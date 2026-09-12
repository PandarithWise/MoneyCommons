# 🐼 MoneyCommons — Debt-Free Tracker

A Node.js-powered, open-source financial education tool built around the MoneyCommons **debt-first** idea: understand your cash flow, spending and debt before taking on investment risk.

## What it does

- Monthly income and spending snapshot
- Spending audit: identify flexible spending and possible reductions
- Debt map: balance, minimum payment and APR
- Daily financial reflection
- What-if simulator for small spending changes
- Mobile-friendly dashboard
- Local browser storage by default — no account or financial data is sent to this Node server in v0.1

The design is intentionally inspirational rather than prescriptive. Users can personalise their categories and decide what changes make sense for them.

## Run it

Requires Node.js 18+. The app uses Node.js built-in HTTP support, so **no `npm install` is required**.

From PowerShell, Command Prompt, or the VS Code terminal:

```bash
npm start
```

Then open `http://localhost:3000` in Chrome or Edge.

For development with Node's file watcher:

```bash
npm run dev
```

## Project structure

```text
moneycommons-debt-free/
├── package.json
├── server.js
├── README.md
└── public/
    ├── index.html
    ├── app.css
    └── app.js
```

## Roadmap

- Export/import tracker data
- Monthly history and charts
- Debt payoff timelines and education around avalanche/snowball methods
- Emergency-fund planning
- More financial education lessons
- Optional AI tutor that explains the numbers without pretending to be a regulated adviser
- Optional authentication/sync only after a clear privacy model is designed
- Country-specific education modules

## Safety & privacy principle

MoneyCommons is an educational project. It should explain assumptions, uncertainty, interest, fees and risk rather than promise outcomes or give personalised investment instructions.

Financial data is personal. The first version keeps it in the browser. Any future server-side storage should be opt-in, documented, and protected appropriately.

## License

MIT — see the repository license.
