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
      colors: {
        page: "var(--k-bg)",
        surface: "var(--k-surface)",
        ink: "var(--k-ink)",
        muted: "var(--k-muted)",
        line: "var(--k-line)",
        "line-strong": "var(--k-line-strong)",
        warn: "var(--k-warn)",
      },
      fontFamily: {
        sans: ['"Bricolage Grotesque Variable"', "system-ui", "sans-serif"],
      },
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
