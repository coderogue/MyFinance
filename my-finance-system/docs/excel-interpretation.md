# Excel Workbook Interpretation

This document records how the original workbook appears to function, based on the earlier inspection of the existing sheet structure.

No live Google Drive changes are made from this project.

## Workbook-Level Shape

The workbook is an annual finance workbook.

Observed tabs included:

- CASH FLOW
- CREDIT CARD
- CIMB
- HSBC
- PBB
- MBB1
- MBB2
- MBB3
- GXBANK
- Touch&Go
- MOOMOO
- FSMONE
- STOCKS - MY
- STOCKS - US
- MANAGED FUND

The workbook is not a pure transaction ledger. It is closer to a yearly cashflow and balance projection workbook.

The main output is the same style as the Excel workbook:

- month columns
- opening balance
- closing balance
- account/tab rows
- category roll-ups
- daily buckets
- preset recurring rows

## Summary / Cash Flow Tab

The original summary tab is named `CASH FLOW`.

This should become the app's `Summary` tab.

The Summary tab functions as the annual overview.

It rolls up values from the other tabs into category tables.

The Summary tab has two layers:

1. a brief top category summary
2. detailed category tables underneath

Observed top-level categories:

- Banks
- Stocks
- Managed Fund

The updated app requirement expands this to:

- Bank
- Stock
- Managed Funds
- Wallets
- Credit Card

The Summary tab should be treated as a real tab, but system-created.

It should appear in the workbook tab list and open the overview screen.

For the app, the user should start with an empty Summary tab. The sample values from the inspected workbook are useful for understanding behavior, but they should not be preloaded as real user data.

## Summary Tab Roll-Up Behavior

The Summary tab does not store most values directly.

It references values from the detailed tabs.

The top table shows category rows only.

Example:

```text
BANKS
STOCKS
MANAGED FUND
TOTAL
```

Below that, each category has a detailed table.

Example behavior observed:

```text
Summary Bank row = total from bank detail section
Summary Stock row = total from stock detail section
Summary Managed Fund row = value from MANAGED FUND tab
```

Within the Summary tab, category sections also contain detail rows that reference individual tabs.

Example:

```text
Bank section:
  CIMB
  HSBC
  PBB
  MBB1
  MBB2
  MBB3
  GXBANK
  MOOMOO
  FSMONE
  TOTAL
```

The category total is then used by the top summary section.

## Normal Cashflow Tabs

Tabs such as `CIMB`, `HSBC`, `PBB`, `MBB1`, `GXBANK`, and similar tabs follow a normal cashflow layout.

They have:

1. a top overview area
2. a DEBIT table
3. a CREDIT table

The top overview area observed in the original workbook used rows similar to:

```text
Total Debit
Total Credit
Total Balance
```

The updated app requirement formalizes this as:

```text
Brought Forward
Total Debit
Total Credit
Total Balance
```

This is clearer because brought forward is conceptually separate from debit.

## Important Formula Interpretation

In the existing workbook, the `Total Debit` row appeared to include a carried value from the previous balance.

Example observed pattern:

```text
Jan Total Debit = Jan DEBIT table total + Opening/previous balance
Feb Total Debit = Feb DEBIT table total + Jan Total Balance
Mar Total Debit = Mar DEBIT table total + Feb Total Balance
```

Then:

```text
Total Balance = Total Debit - Total Credit
```

The updated app requirement expresses the same cashflow more explicitly:

```text
Total Balance = Brought Forward + Total Debit - Total Credit
```

So the app should prefer the explicit requirement model:

```text
Brought Forward = previous month Total Balance
Total Debit = current month incoming amount
Total Credit = current month outgoing amount
Total Balance = Brought Forward + Total Debit - Total Credit
```

This avoids hiding brought forward inside the debit row.

## DEBIT Table Behavior

The DEBIT table records money coming into the tab.

Observed rows included:

- preset rows, such as Salary
- transfer rows
- Day 1 through Day 31
- TOTAL

Preset rows exist above the day rows.

Day rows are used for ad hoc transactions by date.

The TOTAL row sums all preset and day rows for the month.

That total feeds the top overview's Total Debit.

## CREDIT Table Behavior

The CREDIT table records money going out of the tab.

Observed rows included:

- preset transfer/payment rows
- Credit Card
- Cash
- Day 1 through Day 31
- TOTAL

The TOTAL row sums all preset and day rows for the month.

That total feeds the top overview's Total Credit.

## Preset Rows

Preset rows are important because the workbook is used for projection.

They represent expected recurring values.

Examples:

- Salary
- bank transfers
- credit card payment
- cash withdrawal
- subscriptions
- recurring bills

The app should allow users to create these rows and copy/project the values across future months.

The app must still allow month-specific overrides.

## Day Rows And Drill-Down

Day rows represent daily buckets.

The table cell should display only the total for the day/month.

The user can record multiple transactions behind that cell.

Example:

```text
CIMB > CREDIT > Day 7 > Mar = 125.50
```

Behind the cell:

```text
Lunch       18.50
Parking      7.00
Groceries  100.00
```

Displayed cell:

```text
125.50
```

## Credit Card Tab Behavior

The Credit Card tab has special logic and should not be forced into the normal tab model.

Required summary rows:

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

`Statement Amount` means the amount actually paid.

Previous month carried forward becomes current month brought forward.

## Fixed Expenses

Fixed Expenses are recurring credit card expenses.

Examples:

- Insurance
- phone bill
- subscriptions
- petrol

They support projection because they likely repeat monthly.

However, each month must still be editable.

## Fixed Expense Sub Tables

A fixed expense can optionally have a sub table.

This is useful when one recurring category is made of multiple transactions.

Example:

```text
Petrol - Mar = 520.00
```

Sub table:

```text
2026-03-05  Petrol  120.00
2026-03-14  Petrol  110.00
2026-03-25  Petrol  290.00
```

The parent fixed expense row displays only the monthly total.

## Variable Expenses

Variable Expenses are daily credit card expenses.

They use Day 1 through Day 31 rows and a TOTAL row.

The monthly total feeds the Credit Card Summary's Variable Expenses row.

## Year-To-Year Behavior

The workbook is one year at a time.

At year end:

```text
normal tab next year Opening Balance = current year Closing Balance
credit card next year Brought Forward = final Carried Forward
```

The app should eventually snapshot the year close so future years do not unexpectedly change if an old year is edited.
