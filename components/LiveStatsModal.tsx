import Modal from "./Modal";
import Alert from "./Alert";
import { useMap, useOthers, useSelf } from "@liveblocks/react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  totalPlay: number;
}

const GRAPH_WIDTH_MIN_RATIO = 10;

export default function LiveStatsModal(props: Props) {
  const others = useOthers();
  const self = useSelf();
  const { isOpen, onClose, totalPlay } = props;

  const users = others
    .toArray()
    .concat(self)
    .filter(Boolean)
    .sort((a, b) => {
      return (a.presence?.winCount ?? 0) > (b.presence?.winCount ?? 0) ? -1 : 1;
    });

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <Modal.Title>Statistik</Modal.Title>
      <div className="w-10/12 mx-auto mb-8">
        <h3 className="uppercase font-semibold mb-4">Distribusi Kemenangan</h3>
        <div>
          {users.map((user) => {
            const shouldHighlight = user.connectionId === self.connectionId;
            const winCount = user.presence?.winCount ?? 0;
            const ratio =
              totalPlay === 0
                ? GRAPH_WIDTH_MIN_RATIO
                : Math.max((winCount / totalPlay) * 100, GRAPH_WIDTH_MIN_RATIO);
            const alignment =
              ratio === GRAPH_WIDTH_MIN_RATIO
                ? "justify-center"
                : "justify-end";
            const background = shouldHighlight ? "bg-accent" : "bg-gray-500";
            return (
              <div
                className="grid grid-cols-leaderboard h-5 mb-2"
                key={user.connectionId}
              >
                <div className="tabular-nums">{user.id}</div>
                <div className="w-full h-full pl-1">
                  <div
                    className={`text-right text-white ${background} flex ${alignment} px-2 font-bold`}
                    style={{ width: ratio + "%" }}
                  >
                    {winCount}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Modal>
  );
}
