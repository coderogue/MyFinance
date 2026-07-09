# Product Model

## Product Shape

The app should feel like a yearly Excel workbook, not a generic finance dashboard.

The initial workbook starts empty except for the system-created Summary tab.

The main surface is a workbook with:

- a Summary tab that is itself a workbook tab
- created finance tabs grouped by category
- month columns
- opening and closing values
- preset rows
- day rows
- totals that roll up automatically

## Categories

Every created tab belongs to exactly one category:

- Bank
- Stock
- Managed Funds
- Wallets
- Credit Card

## Summary Tab

The Summary tab is the landing view.

It is a system-created tab and should appear in the workbook tab list.

It shows one table per category. Each category table lists the tabs created under that category and their monthly values.

This is the user's main view of financial cashflow.

The Summary tab should be structured in two levels:

1. A brief top table for the category totals.
2. Detailed tables below for each category.

The top table is intentionally short and should not list every tab. The lower tables provide the detail.

The empty starting Summary should show blank category totals and blank detail totals until the user creates tabs.

## Normal Tabs

Bank, Stock, Managed Funds, and Wallet tabs use the normal tab layout.

Normal tab sections:

1. Overview
2. DEBIT
3. CREDIT

The DEBIT and CREDIT tables should show:

- Opening Balance
- Jan through Dec
- Closing Balance
- Day 1 through Day 31
- TOTAL

Overview rows:

- Brought Forward
- Total Debit
- Total Credit
- Total Balance

Formula:

```text
Total Balance = Brought Forward + Total Debit - Total Credit
```

## Credit Card Tabs

Credit Card tabs use a separate layout.

Credit card sections:

1. Credit Card Summary
2. Fixed Expenses
3. Optional sub tables for fixed expense rows
4. Variable Expenses

Credit card summary rows:

- Fixed Expenses
- Variable Expenses
- Brought Forward
- Rebate
- Monthly Total
- Statement Amount
- Carried Forward

Formula:

```text
Monthly Total = Fixed Expenses + Variable Expenses + Brought Forward - Rebate
Carried Forward = Monthly Total - Statement Amount
```

`Statement Amount` means amount actually paid.

## Interaction Model

The table cell is the display.

The records behind a cell are the detail.

Multiple transactions can be recorded behind one day/month cell, while the table displays only the total.
