module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./routes/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      gridTemplateColumns: {
        leaderboard: "90px 1fr",
      },
    },
    borderWidth: {
      DEFAULT: "1px",
      0: "0px",
      2: "2px",
      3: "3px",
    },
  },
  plugins: [],
};
