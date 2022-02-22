import Tile from "./Tile";

import { GameState } from "../utils/types";
import { decode } from "../utils/codec";
import { getAnswerStates } from "../utils/game";
import { FLIP_ANIMATION_DELAY_MS } from "../utils/constants";

interface Props {
  hash: string;
  gameState: GameState;
  invalidAnswer: boolean;
}

export default function Board(props: Props) {
  const { hash, gameState, invalidAnswer } = props;
  const answer = decode(hash);

  return (
    <div
      className="grid grid-rows-6 gap-1.5 max-w-full"
      style={{ aspectRatio: "1 / 1" }}
      id="katla"
    >
      {Array(6)
        .fill("")
        .map((_, i) => {
          let userAnswer = gameState.answers[i] ?? "";
          userAnswer += " ".repeat(5 - userAnswer.length);

          const answerStates = getAnswerStates(userAnswer, answer);
          return (
            <div className="grid grid-cols-5 gap-1.5 relative" key={i}>
              {userAnswer.split("").map((char, index) => {
                let state = null;
                if (i < gameState.attempt) {
                  state = answerStates[index];
                }

                const isInvalid = invalidAnswer && i === gameState.attempt;
                return (
                  <Tile
                    key={`${index}-${char}`}
                    char={char}
                    state={state}
                    isInvalid={isInvalid}
                    delay={FLIP_ANIMATION_DELAY_MS * index}
                  />
                );
              })}
            </div>
          );
        })}
    </div>
  );
}
