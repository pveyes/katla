import { getAnswerStates } from "../utils/game";
import { GetServerSideProps } from "next";

const imageShare = ({
  gameNumber,
  answer,
  userAnswer,
  score,
  theme,
}: {
  gameNumber: string;
  answer: string;
  userAnswer: string;
  score: string;
  theme: string;
}) => {
  const userAnswers = userAnswer.split(",");

  return (
    <div
      className={`flex px-8 py-8 flex-col absolute ${
        theme === "dark" ? "text-white" : "text-gray-800"
      }`}
      style={{
        width: 450,
        height: 700,
        backgroundColor: theme === "dark" ? "rgb(17 24 39)" : "white",
      }}
    >
      <div className="mx-auto text-center ">
        <span
          className="uppercase text-4xl font-bold"
          style={{ letterSpacing: 4 }}
        >
          KATLA
          <sup className="-top-4 tracking-tight" style={{ fontSize: "45%" }}>
            #{gameNumber}
          </sup>
        </span>
        <p className="font-medium text-2xl">
          {score}
          /6
        </p>
      </div>
      <div className="grid grid-cols-5 gap-2 mt-8">
        {userAnswers.filter(Boolean).map((userAnswer) => {
          return getAnswerStates(userAnswer, answer).map((state, index) => {
            switch (state) {
              case "correct":
                return (
                  <div
                    key={index}
                    style={{
                      width: 70,
                      height: 70,
                      backgroundColor: "#15803d",
                    }}
                  />
                );
              case "exist":
                return (
                  <div
                    key={index}
                    style={{
                      width: 70,
                      height: 70,
                      backgroundColor: "#ca8a04",
                    }}
                  />
                );
              case "wrong":
                return (
                  <div
                    key={index}
                    style={{
                      width: 70,
                      height: 70,
                      backgroundColor: theme === "dark" ? "#374151" : "#6b7280",
                    }}
                  />
                );
            }
          });
        })}
      </div>
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <span>katla.vercel.app</span>
      </div>
    </div>
  );
};

export default imageShare;
export const getServerSideProps: GetServerSideProps = async (context) => {
  const answer = context.query.answer;
  const userAnswer = context.query.userAnswer;
  const gameNumber = context.query.gameNumber;
  const score = context.query.score;
  const theme = context.query.theme;

  return {
    props: {
      gameNumber,
      answer,
      userAnswer,
      score,
      theme,
    },
  };
};
