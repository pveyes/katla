# Katla

Permainan kata harian. ~~Imitasi~~ Terinspirasi dari [Wordle](https://www.powerlanguage.co.uk/wordle/)

## Development

```sh
yarn install
cp .dev.vars.example .dev.vars   # Worker secrets (DEFINE_TOKEN, ...)
cp .env.example .env             # client env (VITE_*)
yarn dev                         # Vite + Workers runtime
yarn test
yarn typecheck
```

## Architecture

- Client: Vite + React + React Router (`src`, `routes`, `components`, `utils`)
- API: Cloudflare Worker (`worker/`) serving `/api/*` next to the static assets. The answer list (`.scripts/answers.csv`) is only bundled into the Worker so answers never ship to the browser.
- Deploy: the `deploy` GitHub Action on every push to `main` (`yarn build`, `wrangler deploy`)
- Daily word: the `update-word` GitHub Action (15:00 UTC) commits a new word to `answers.csv`, then calls `deploy` directly (commits made with `GITHUB_TOKEN` don't trigger `push` workflows). Run it manually with "Run workflow" in the Actions tab.

GitHub repo secrets: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `DEFINE_TOKEN` (any random string; passed to the Worker and to the build as `VITE_DEFINE_TOKEN`). `THIRD_PARTY_DEFINE_TOKEN` and `SENTRY_DSN` are optional Worker secrets, set them with `wrangler secret put`.
