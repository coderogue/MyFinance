# My Finance System

A local-first personal finance app shaped like a yearly Excel workbook.

## Current Direction

The app should start from the user's desired end output:

- a Summary tab
- category tables for Bank, Stock, Managed Funds, Wallets, and Credit Card
- created tabs grouped under those categories
- normal tabs with Overview, DEBIT, and CREDIT sections
- credit card tabs with Fixed Expenses, Variable Expenses, Statement Amount, and Carried Forward
- day/month cells that display totals but can contain multiple transactions
- year-to-year carry forward

## Workbook Rules

Normal tab:

```text
Total Balance = Brought Forward + Total Debit - Total Credit
```

Credit card tab:

```text
Monthly Total = Fixed Expenses + Variable Expenses + Brought Forward - Rebate
Carried Forward = Monthly Total - Statement Amount
```

`Statement Amount` means amount actually paid.

## Recommended Stack

- Next.js
- React
- TypeScript
- Prisma
- SQLite first
- PostgreSQL/Supabase later if sync is needed
- Tailwind CSS
- TanStack Table later for spreadsheet-like grids
- Recharts later for visual summaries

## Project Structure

```text
app/                  Next.js app routes
components/           Reusable UI components
docs/                 Product and domain design notes
lib/domain/           Finance model and calculation helpers
prisma/               Database schema
```

## Main Design Docs

- `docs/requirements.md`
- `docs/excel-interpretation.md`
- `docs/product-model.md`
- `docs/data-model.md`
- `docs/forecast-rules.md`

## Docker Deployment

From the repository root:

```bash
docker compose up --build
```

Then open:

```text
http://localhost:3000
```

To run in the background:

```bash
docker compose up --build -d
```

To stop:

```bash
docker compose down
```

The compose setup bind-mounts `my-finance-system/data` to `/data` in the
container and sets:

```text
DATABASE_URL=file:/data/finance.db
```

Workbook data is persisted to SQLite through `app/api/workbook-state`.
The app saves a workbook snapshot after edits and reloads it on startup.
Autosave is enabled only after a successful, validated load. Saves use revision
checks so a stale browser session cannot overwrite newer data, and the API
rejects attempts to replace a populated workbook with an empty state. Before
each accepted update, the previous snapshot is retained in the
`WorkbookStateRevision` table (latest 50 revisions).

The application requires registration and login. Passwords are hashed with
scrypt, sessions use secure HTTP-only cookies, and workbook records and their
revision history are isolated by user account.

For local development, `.env` and `.env.local` point Prisma to:

```text
DATABASE_URL=file:./dev.db
```

That creates `prisma/dev.db`, which is ignored by git. In Docker, records are
kept in `my-finance-system/data/finance.db`, so they are visible in the project
folder and survive container rebuilds and restarts. The `data` folder is kept in
git with `.gitkeep`, but database files inside it are ignored.

## Core Product

This is not a normal ledger-first app. It is an Excel-style annual workbook with better interactions.

## Telegram Notifications

1. In Telegram, open `@BotFather`, run `/newbot`, and copy the bot token.
2. Add the token to the ignored `.env.local` file:

   ```text
   TELEGRAM_BOT_TOKEN="your-token"
   TELEGRAM_CHAT_ID=""
   ```

3. Open the new bot, press **Start**, and send it any message.
4. Discover your chat ID:

   ```bash
   npm run telegram:chat-id
   ```

5. Put the returned ID in `TELEGRAM_CHAT_ID` and test:

   ```bash
   npm run telegram:send -- "My Finance notification test"
   ```

Never commit the bot token. Telegram bots cannot initiate a conversation until
you have opened the bot and pressed **Start**.
