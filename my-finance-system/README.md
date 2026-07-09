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

The compose setup creates a Docker volume named `my-finance-data` and sets:

```text
DATABASE_URL=file:/data/finance.db
```

Workbook data is persisted to SQLite through `app/api/workbook-state`.
The app saves a workbook snapshot after edits and reloads it on startup.

For local development, `.env` and `.env.local` point Prisma to:

```text
DATABASE_URL=file:./dev.db
```

That creates `prisma/dev.db`, which is ignored by git. In Docker, records are
kept in the `my-finance-data` volume, so they survive container rebuilds and
restarts. Do not run `docker compose down -v` unless you intentionally want to
delete the saved database volume.

## Core Product

This is not a normal ledger-first app. It is an Excel-style annual workbook with better interactions.
