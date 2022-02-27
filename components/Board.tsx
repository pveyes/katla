import Tile from "./Tile";

import { Game, GameState } from "../utils/types";
import { decode } from "../utils/codec";
import { getAnswerStates } from "../utils/game";
import { FLIP_ANIMATION_DELAY_MS } from "../utils/constants";

interface Props {
  game: Game;
  invalidAnswer: boolean;
}

export default function Board(props: Props) {
  const { game, invalidAnswer } = props;
  const answer = decode(game.hash);

  function handlePress(row: number, index: number) {
    if (game.state.enableFreeEdit && row === game.state.attempt) {
      game.setState({
        ...game.state,
        answers: game.state.answers.map((answer, i) => {
          if (i === game.state.attempt) {
            return answer.slice(0, index) + "_" + answer.slice(index + 1);
          }

          return answer;
        }),
      });
    }
  }

  return (
    <div
      className="grid grid-rows-6 gap-1.5 max-w-full"
      style={{ aspectRatio: "1 / 1" }}
      id="katla"
    >
      {Array(6)
        .fill("")
        .map((_, i) => {
          let userAnswer = game.state.answers[i] ?? "";
          userAnswer += " ".repeat(5 - userAnswer.length);

          const answerStates = getAnswerStates(userAnswer, answer);
          return (
            <div className="grid grid-cols-5 gap-1.5 relative" key={i}>
              {userAnswer.split("").map((char, index) => {
                let state = null;
                if (i < game.state.attempt) {
                  state = answerStates[index];
                }

                const isInvalid = invalidAnswer && i === game.state.attempt;
                return (
                  <Tile
                    key={`${index}-${char}`}
                    char={char}
                    state={state}
                    isInvalid={isInvalid}
                    delay={FLIP_ANIMATION_DELAY_MS * index}
                    onPress={() => handlePress(i, index)}
                  />
                );
              })}
            </div>
          );
        })}
    </div>
  );
}
