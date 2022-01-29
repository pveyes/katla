import {
  ComponentProps,
  FormEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { createClient } from "@liveblocks/client";
import { GetStaticProps } from "next";
import {
  LiveblocksProvider,
  RoomProvider,
  useBroadcastEvent,
  useOthers,
  useSelf,
} from "@liveblocks/react";

import App from "../components/App";
import Container from "../components/Container";
import Header from "../components/Header";
import Modal, { useModalState } from "../components/Modal";

import {
  LiveGame,
  useLiveGame,
  generateRoomId,
  getEmojiFromScore,
  getTotalScore,
  defaultScore,
  shareInviteLink,
} from "../utils/liveGame";
import fetcher from "../utils/fetcher";
import { decode, encode } from "../utils/codec";
import { GameStats, LiveConfig, LiveEvent } from "../utils/types";
import { useTheme } from "next-themes";
import HelpModal from "../components/HelpModal";
import LiveStatsModal from "../components/LiveStatsModal";
import SettingsModal from "../components/SettingsModal";

interface Props {
  words: string[];
}

export default function Lawan({ words }: Props) {
  const [username, setUsername] = useState("");
  const [roomId, setRoomId] = useState("");
  const [isHost, setIsHost] = useState(false);
  const [inviteKey, setInviteKey] = useState(null);
  const client = useRef<ReturnType<typeof createClient>>(null);

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const room = query.get("room");
    const auth = query.get("auth");
    const invite = query.get("invite");

    if (!room && auth) {
      query.set("room", generateRoomId(encode(auth)));
      window.location.search = query.toString();
      return;
    }

    if (room) {
      setRoomId(room);

      const [_, eauth, _id] = room.split("-");
      if (auth) {
        if (decode(eauth) !== auth) {
          window.location.replace("/404");
          return;
        }

        setIsHost(true);
        return;
      }

      if (!invite) {
        window.location.replace("/404");
        return;
      }
    }
  }, []);

  if (!roomId) {
    return <div>{"loading..."}</div>;
  }

  function handleSubmit(e: FormEvent) {
    const username = (e.target as any).name.value;
    e.preventDefault();
    setUsername(username);
    client.current = createClient({
      authEndpoint: async (room) => {
        const query = new URLSearchParams(window.location.search);
        const response = await fetch("/api/live", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            room,
            auth: query.get("auth") ?? query.get("invite"),
            username,
          }),
        });

        // TODO: validate
        const { inviteKey, ...liveblocks } = await response.json();
        setInviteKey(inviteKey);
        return liveblocks;
      },
    });
  }

  if (!username) {
    return (
      <Modal isOpen>
        <form onSubmit={handleSubmit}>
          <label htmlFor="username" className="mb-4 block">
            Masukkan username
          </label>
          <input
            id="username"
            className="text-gray-800 dark:text-gray-100 p-2 mr-4 rounded-sm bg-gray-200 dark:bg-gray-800"
            name="name"
            autoComplete="off"
          />
          <button className="px-4 py-2 rounded-sm bg-green-600">Pilih</button>
        </form>
      </Modal>
    );
  }

  return (
    <LiveblocksProvider client={client.current}>
      <RoomProvider id={roomId as string}>
        <Main
          words={words}
          config={{
            isHost,
            inviteKey,
            roomId,
          }}
        />
      </RoomProvider>
    </LiveblocksProvider>
  );
}

export const getStaticProps: GetStaticProps<Props> = async () => {
  const words = await fetcher("https://katla.vercel.app/api/words");
  return {
    props: {
      words,
    },
  };
};

const initialStats: GameStats = {
  distribution: {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
    6: 0,
    fail: 0,
  },
  currentStreak: 0,
  maxStreak: 0,
};

interface MainProps {
  words: string[];
  config: LiveConfig;
}

function Main({ words, config }: MainProps) {
  const game = useLiveGame(words);
  const [stats, setStats] = useState(initialStats);
  const broadcast = useBroadcastEvent();
  const others = useOthers();
  const self = useSelf();
  const [modalState, setModalState, resetModalState] = useModalState(
    game,
    stats
  );

  const handleSendEmoji = useCallback(
    (emoji: string) => {
      broadcast({ type: "emoji", emoji, username: self.id });
    },
    [broadcast, self?.id]
  );

  const headerProps: ComponentProps<typeof Header> = {
    onSendEmoji: others.count > 0 ? handleSendEmoji : undefined,
    customHeading: (
      <div className="dark:text-gray-300 text-gray-700 flex relative">
        <div className="uppercase text-center flex flex-col items-center">
          <span className="block">Lawan</span>
          <span className="block text-xs" style={{ letterSpacing: 0 }}>
            Katla
          </span>
        </div>
        {game.ready && game.num > 0 && (
          <sup className="top-1 tracking-tight" style={{ fontSize: "45%" }}>
            #{game.num}
          </sup>
        )}
      </div>
    ),
    onShowHelp: () => setModalState("help"),
    onShowStats: () => setModalState("stats"),
    onShowSettings: () => setModalState("settings"),
    isLiveMode: true,
  };

  const playerCount = others.toArray().length + 1;
  const isReady = playerCount > 1;

  useEffect(() => {
    if (isReady && game.num === 0 && config.isHost) {
      game.start();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReady, game.num]);

  return (
    <Container>
      <Header {...headerProps} />
      <LiveGameBar game={game} config={config} isReady={isReady} />
      {game.hash && isReady && (
        <App
          game={game}
          stats={stats}
          setStats={setStats}
          showStats={() => void 0}
          words={words}
        />
      )}
      <HelpModal
        isOpen={modalState === "help"}
        onClose={resetModalState}
        isLiveMode
      />
      <LiveStatsModal
        isOpen={modalState === "stats"}
        onClose={resetModalState}
        totalPlay={game.num ?? 0}
      />
      <SettingsModal
        isOpen={modalState === "settings"}
        onClose={resetModalState}
        game={game}
        liveConfig={config}
      />
    </Container>
  );
}

interface GameBarProps {
  game: LiveGame;
  config: LiveConfig;
  isReady: boolean;
}

function LiveGameBar(props: GameBarProps) {
  const { game, config, isReady } = props;
  const { resolvedTheme } = useTheme();
  const others = useOthers();
  const currentUser = useSelf();

  const users = others.toArray().concat(currentUser).filter(Boolean);

  const userScores = users
    .map((user) => ({
      id: user.id,
      scores: user.presence?.scores ?? defaultScore,
      isFailed: user.presence?.isFailed ?? false,
    }))
    .sort((a, b) => {
      return getTotalScore(a.scores) > getTotalScore(b.scores) ? -1 : 1;
    });

  function handleShare() {
    shareInviteLink(config);
  }

  return (
    <div className="relative z-auto pb-4" id="game-bar">
      {isReady ? (
        <div className="flex flex-row overflow-x-auto">
          {userScores.map((entry) => (
            <div
              key={entry.id}
              className="flex-grow-0 flex-shrink-0 user-score self-center px-2"
              style={{ maxWidth: 150, opacity: entry.isFailed ? 0.4 : 1 }}
            >
              <span className="text-ellipsis block overflow-clip">
                {entry.id}
              </span>
              <div className="tracking-widest">
                {entry.scores.map((score) =>
                  getEmojiFromScore(
                    score,
                    resolvedTheme === "dark",
                    game.state.enableHighContrast
                  )
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center">
          <div>Menunggu pemain lain terhubung...</div>
          {config.inviteKey && (
            <button
              className="block text-center color-accent w-full"
              onClick={handleShare}
            >
              Ajak pemain
            </button>
          )}
        </div>
      )}
    </div>
  );
}
