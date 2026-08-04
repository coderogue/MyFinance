# Requirements

## Objective

Build a personal finance system whose final output resembles the existing yearly Excel workbook.

The system is a yearly cashflow projection and tracking tool. It should preserve the Excel-style table structure, while improving interaction through reusable tabs, preset recurring rows, drill-down transactions, automatic roll-ups, and year-to-year carry forward.

For detailed interpretation of the original workbook behavior, see `docs/excel-interpretation.md`.

## 1. Summary Tab

The system starts with a main Summary tab.

The Summary is itself a tab.

The Summary tab is the overview page for the user's financial cashflow.

It is separated into five categories:

- Bank
- Stock
- Managed Funds
- Wallets
- Credit Card

Each category has its own table in the Summary tab.

Each category table displays the tabs created under that category.

The system should start empty except for the system-created Summary tab.

Users should add their own tabs under Bank, Stock, Managed Funds, Wallets, or Credit Card.

The Summary tab has two levels:

1. A brief top summary table that lists only Banks, Stocks, Managed Funds, and Wallets.
2. Detailed category tables below it, such as a Banks table listing CIMB, HSBC, PBB, and other bank tabs, and a Stocks table listing the stock tabs.

The top summary table should pull totals from the detailed category tables.

Credit Card should not be shown in the top Category Summary table.

If there are no user-created tabs yet, the category rows and total rows should remain blank.

## 2. Creating A New Tab

When the user creates a new tab, they must assign it to one category:

- Bank
- Stock
- Managed Funds
- Wallets
- Credit Card

Tabs under Bank and Wallets use the normal cashflow tab structure.

Tabs under Stock and Managed Funds use the investment tab structure.

Tabs under Credit Card use the credit card tab structure.

Users should be able to delete a user-created tab when it is no longer relevant.

Users should be able to rename a user-created tab.

The Summary tab is system-created and cannot be deleted.

The Summary tab is system-created and cannot be renamed.

When a tab is renamed, any linked preset row that uses that tab name as its mirrored row label should be updated to the new tab name.

When a tab is deleted, the system should remove the tab's local workbook data, including:

- preset rows created in that tab
- linked preset rows in other tabs that point to the deleted tab
- fixed expense rows and fixed expense sub tables for that tab
- cell values and transaction records belonging to that tab

## 3. Normal Cashflow Tabs

This structure applies to:

- Bank
- Wallets

Each normal cashflow tab contains:

1. Overview table
2. DEBIT table
3. CREDIT table

## 4. Normal Tab Overview Table

The overview table shows:

- Brought Forward
- Total Debit
- Total Credit
- Total Balance

Columns:

- Opening Balance
- Jan
- Feb
- Mar
- Apr
- May
- Jun
- Jul
- Aug
- Sep
- Oct
- Nov
- Dec
- Closing Balance

Formula:

```text
Total Balance = Brought Forward + Total Debit - Total Credit
```

Carry-forward rule:

```text
Jan Brought Forward = Opening Balance
Feb Brought Forward = Jan Total Balance
Mar Brought Forward = Feb Total Balance
...
Dec Brought Forward = Nov Total Balance
Year-end balance = Dec Total Balance
```

The December year-end balance becomes the next year's Opening Balance and January Brought Forward amount.

Table presentation rules:

- Bank and Wallet Overview tables show Opening Balance, January through December, and Closing Balance.
- Bank and Wallet Debit and Credit tables show January through December only.
- Credit Card Summary shows Opening Balance, January through December, and Closing Balance.
- Fixed Expenses and Fixed Expense subtables show January through December plus Annual Total.
- Credit Card Variable Expenses show January through December only.
- Annual Total is the sum of January through December and is never carried into another year.
- Closing Balance uses the latest available monthly balance and is carried into the following year's Opening Balance.
- Summary, Stock, and Managed Fund position tables retain Opening Balance and Closing Balance. Their Closing Balance is the December year-end position.

## 5. Normal Tab DEBIT Table

The DEBIT table records money coming into the tab.

Columns:

- Jan
- Feb
- Mar
- Apr
- May
- Jun
- Jul
- Aug
- Sep
- Oct
- Nov
- Dec

Rows:

- preset recurring debit items
- Day 1 through Day 31
- TOTAL

Even if a month has fewer than 31 days, the table layout should still show Day 1 through Day 31 for consistency with the Excel-style workbook.

The TOTAL row sums all debit amounts for each month.

The monthly total flows into the overview table:

```text
Overview Total Debit = DEBIT table monthly TOTAL
```

## 6. Normal Tab CREDIT Table

The CREDIT table records money going out of the tab.

Columns:

- Jan
- Feb
- Mar
- Apr
- May
- Jun
- Jul
- Aug
- Sep
- Oct
- Nov
- Dec

Rows:

- preset recurring credit items
- Day 1 through Day 31
- TOTAL

Even if a month has fewer than 31 days, the table layout should still show Day 1 through Day 31 for consistency with the Excel-style workbook.

The TOTAL row sums all credit amounts for each month.

The monthly total flows into the overview table:

```text
Overview Total Credit = CREDIT table monthly TOTAL
```

## 7. Preset Items For Normal Tabs

Users can add preset items under either the DEBIT or CREDIT table.

Preset items are used for recurring monthly values.

Examples:

- Salary
- Rental Income
- Loan Payment
- Insurance
- Transfer to Wallet
- Transfer to Bank

Preset items appear above the Day 1 to Day 31 rows.

Preset items can repeat monthly, but users must be able to change the value for a specific month.

When a user enters a monthly value in a preset row, the value should repeat into the following blank months as a projection.

If any following month already has its own value, that month must not be overwritten.

Example:

```text
Jan Salary = 5,000.00
Feb to Dec are blank
Result: Feb to Dec also show 5,000.00

Mar Salary is changed to 5,200.00
Result: Jan and Feb remain 5,000.00, Mar becomes 5,200.00, and existing later month values are not overwritten
```

Each normal tab should provide controls to add preset rows to either the DEBIT or CREDIT table.

Preset rows may optionally be linked to another normal tab.

If a CREDIT preset row is linked to another tab, the selected tab should receive a matching DEBIT preset row.

If a DEBIT preset row is linked to another tab, the selected tab should receive a matching CREDIT preset row.

The mirrored row in the linked tab should use the source tab name as its row name.

This represents transfers between tabs without requiring the user to create both sides manually.

## 8. Day Rows For Normal Tabs

Day rows are used for non-preset daily transactions.

Rows:

- Day 1
- Day 2
- Day 3
- ...
- Day 31

A user can record multiple transactions for the same day and month.

The displayed cell only shows the total sum.

Example:

```text
CIMB > CREDIT > Day 7 > March = 125.50
```

Underlying transactions:

```text
Lunch       18.50
Parking      7.00
Groceries  100.00
```

Displayed total:

```text
125.50
```

## 9. Credit Card Tabs

## 9. Stock And Managed Fund Tabs

Stock and Managed Fund tabs use a different structure from normal cashflow tabs.

Each Stock or Managed Fund tab contains:

1. Summary table
2. Transactions table
3. Dividend or distribution table

### Stock Summary Table

The Stock Summary table lists the stocks registered by the user.

For Managed Funds, the same structure lists managed fund items registered by the user.

The Stock Summary table is calculated from transaction quantities and user-updated market prices.

The user must not edit stock quantity from the Stock Summary table.

The user may click a month cell in the Stock Summary table to update the current market price for that stock and month.

Previous current market price updates must be visible when the user clicks the same Stock Summary cell.

The user must be able to edit a previous current market price update to correct typo or input mistakes.

The Stock Summary table should calculate value as:

```text
Accumulated quantity from Stock Transactions * current market price from Stock Summary
```

If no market price has been entered in Stock Summary yet, the system may temporarily fall back to the latest purchase price from Stock Transactions.

Entering a current price in Stock Summary should not change the purchase price recorded in Stock Transactions.

Its quantities must come from the Stock Transactions table by default.

The Stock Summary, Stock Transactions, and Dividend tables should share the same row ordering.

If the user sorts one table by description or by a month/value column, the other tables on that Stock or Managed Fund page should follow the same stock row order.

Rows are user-defined stock counters.

Examples:

- AAX (5238)
- CAPITAL A (5099)
- IGBREIT (5227)
- MAYBANK (1155)

Columns:

- Opening Balance
- Jan
- Feb
- Mar
- Apr
- May
- Jun
- Jul
- Aug
- Sep
- Oct
- Nov
- Dec
- Closing Balance

Each monthly value is calculated as:

```text
Accumulated stock quantity up to that month * latest known market price
```

The accumulated stock quantity starts from Opening Balance and adds stock quantities bought in each month.

The Closing Balance represents the closing stock position at the end of the year.

At year end, the closing quantity should be carried forward to the Opening Balance of the new year.

### Stock Transactions Table

The Stock Transactions table records stock purchases and opening stock positions.

For Managed Funds, the same table records managed fund unit purchases and opening unit positions.

The price in the Stock Transactions table is the purchase price at the time the stock was bought.

This purchase price is different from the current market price entered in the Stock Summary table.

Users can click a stock/month cell to open a transaction form.

For monthly stock transactions, the form should collect:

- Date of transaction
- Quantity bought
- Price per stock

For Opening Balance, the user can enter:

- Quantity at hand
- Price per stock

The displayed transaction cell shows the total cost:

```text
Quantity * Price per stock
```

The Closing Balance column in the transaction table should show the closing cost value based on weighted average purchase price.

Formula:

```text
Average purchase price = Total purchase cost / Accumulated quantity
Closing Balance = Accumulated quantity * Average purchase price
```

### Dividend Table

The Dividend table records dividends received for each stock.

For Managed Funds, this table records distributions received for each managed fund item.

Users can click a stock/month cell to open a dividend form.

The dividend form should collect:

- Date received
- Dividend amount

The Dividend table should show monthly dividend totals per stock and a yearly total per stock.

The final row should show total dividends received across all stocks.

## 10. Credit Card Tabs

Credit Card tabs use a different structure.

Each credit card tab contains:

1. Credit card summary table
2. Fixed expenses table
3. Optional fixed expense sub tables
4. Variable expenses table

## 11. Credit Card Summary Table

The credit card summary table shows:

- Fixed Expenses
- Variable Expenses
- Brought Forward
- Rebate
- Monthly Total
- Statement Amount
- Carried Forward

Columns:

- Opening Balance
- Jan
- Feb
- Mar
- Apr
- May
- Jun
- Jul
- Aug
- Sep
- Oct
- Nov
- Dec
- Closing Balance

Formula:

```text
Monthly Total = Fixed Expenses + Variable Expenses + Brought Forward - Rebate
```

Manual values:

- Rebate
- Statement Amount

Statement Amount means the amount actually paid.

Formula:

```text
Carried Forward = Monthly Total - Statement Amount
```

Carry-forward rule:

```text
Feb Brought Forward = Jan Carried Forward
Mar Brought Forward = Feb Carried Forward
...
Dec Brought Forward = Nov Carried Forward
```

## 12. Fixed Expenses Table

The Fixed Expenses table records recurring credit card expenses used for projection.

Rows are user-defined fixed expense items.

Examples:

- Netflix
- Insurance
- Phone Bill
- Gym
- Petrol
- Subscriptions

Columns:

- Jan
- Feb
- Mar
- Apr
- May
- Jun
- Jul
- Aug
- Sep
- Oct
- Nov
- Dec
- Annual Total

Each fixed expense item can have a recurring monthly projected value.

Users must be able to change the value for a specific month when the actual amount differs.

When a user enters a monthly value in a fixed expense row without a sub table, the value should repeat into the following blank months as a projection.

If any following month already has its own value, that month must not be overwritten.

The Credit Card tab should provide a control to add Fixed Expense rows.

When adding a Fixed Expense row, the user may choose whether that row needs a sub table.

The monthly total flows into the credit card summary:

```text
Summary Fixed Expenses = Fixed Expenses table monthly total
```

## 13. Optional Fixed Expense Sub Tables

Users can create a sub table for a fixed expense item when more detail is needed.

Example:

```text
Fixed Expense Item: Petrol
```

The sub table allows multiple entries within one month.

The parent fixed expense row still displays only the monthly total.

The sub table should use the same January-to-December plus Annual Total layout as the fixed expense table:

- Jan
- Feb
- Mar
- Apr
- May
- Jun
- Jul
- Aug
- Sep
- Oct
- Nov
- Dec
- Annual Total

The user should be able to add named sub rows.

Example:

```text
Petrol 1
Petrol 2
Petrol 3
TOTAL
```

The TOTAL row should sum the sub rows for each month.

The parent fixed expense row in the main Fixed Expenses table should display the sub table TOTAL for each month.

The Fixed Expenses table TOTAL row should include both:

- fixed expense rows edited directly
- fixed expense rows whose values come from sub table totals

Example:

```text
Petrol - March = 350.00
```

Sub table:

```text
2026-03-05  Petrol  120.00
2026-03-14  Petrol  110.00
2026-03-25  Petrol  120.00
```

Displayed total:

```text
350.00
```

## 14. Variable Expenses Table

The Variable Expenses table records non-recurring or daily credit card spending.

When adding a Credit Card Variable Expense transaction, the user may choose a Wallet tab as the transaction point.

If a Wallet tab is selected, the Credit Card Variable Expense transaction should create a matching DEBIT transaction in the selected Wallet tab on the same day and month.

This represents spending through credit card first, with the wallet receiving the corresponding debit-side record.

Rows:

- Day 1
- Day 2
- Day 3
- ...
- Day 31
- TOTAL

The Variable Expenses table should always show Day 1 through Day 31 for consistency with the yearly workbook layout.

Columns:

- Jan
- Feb
- Mar
- Apr
- May
- Jun
- Jul
- Aug
- Sep
- Oct
- Nov
- Dec

The monthly total flows into the credit card summary:

```text
Summary Variable Expenses = Variable Expenses table monthly total
```

## 15. Summary Tab Roll-Up

The Summary tab pulls values from each created tab.

The Summary tab first displays a brief category table.

Example:

```text
BANKS
STOCKS
MANAGED FUND
TOTAL
```

Below the brief category table, the Summary tab displays detailed category tables.

Example:

```text
BANKS
  CIMB
  HSBC
  PBB
  MBB 1
  GXBANK
  TOTAL

STOCKS
  STOCKS - MY
  STOCKS - US
  TOTAL
```

For normal tabs:

```text
Summary category table shows monthly balances from each tab.
```

For credit card tabs:

```text
Summary credit card table shows relevant credit card monthly values.
```

The Summary tab provides the user with a high-level view of financial cashflow across all categories.

In the initial empty workbook, the Summary tab should display only the summary table and the category detail tables up to Managed Funds. Additional detailed sections should appear only when required by user-created categories.

## 16. Yearly Logic

The system is yearly.

The default workbook year is 2026.

The Create Year action should create the next yearly workbook set.

Example:

```text
Default year = 2026
Click Create Year
New active workbook year = 2027
```

Each created year should maintain its own workbook state, including tabs, rows, cell values, transaction records, stock or managed fund records, and credit card data.

Carry-forward is a core accounting requirement.

When a new year is created, the system should copy the prior year's workbook structure into the new year and seed the new year's opening records from the prior year's calculated closing records.

If a future workbook year already exists, changes made to the prior year should continue to update the future year's system-generated opening records.

System-generated opening records should remain tied to the prior year's closing values unless the user explicitly changes the underlying prior-year records.

Each year has:

- Opening Balance
- Jan through Dec values
- Closing Balance

At year end:

```text
Current year Closing Balance becomes next year Opening Balance
```

For normal tabs:

```text
Next year Opening Balance = Current year Closing Balance
```

For credit card tabs:

```text
Next year Brought Forward = Previous year final Carried Forward
```

For stock tabs:

```text
Next year Opening Balance quantity = Current year Closing Balance quantity
```

For stock and managed fund tabs:

```text
Next year Opening Balance quantity = Previous year final accumulated quantity
Next year Opening Balance price = Previous year latest known market price, or latest purchase price if no market price exists
```

Managed Funds use a simplified contribution model. Users record only the date and amount invested; unit quantity and unit price are not shown. The Managed Fund Summary displays cumulative invested capital: Opening Balance plus all contributions through each month. Its Closing Balance is carried to the following year's Opening Balance. Stocks continue to use quantity and market-price valuation.

## 17. Core Interaction

The user should be able to:

1. Create a new tab.
2. Choose its category.
3. Rename a user-created tab.
4. Delete a user-created tab that is no longer relevant.
5. Enter opening balance where applicable.
6. Add preset recurring rows.
7. Enter or update monthly values.
8. Click a day/month cell to record multiple transactions.
9. See only the total displayed in the table.
10. Update actual values as the month progresses.
11. Let the Summary tab reflect all changes automatically.

Table cells for month values should be editable directly in the workbook UI.

Edited cell values should be stored as workbook cell values and later persisted to the database.

Overview table cells should be display-only.

Preset row cells should be directly editable.

Fixed Expense row cells should be directly editable only when the fixed expense does not have a subtable.

Fixed Expense subtable row cells should be directly editable.

Day rows, variable expense day rows, and other non-direct-entry cells should open a transaction entry panel when clicked.

The transaction entry panel should collect:

- Description
- Amount

When a transaction record is added or changed, the displayed cell total should update first.

The table TOTAL row should then update from the displayed cell totals.

The tab Overview should then update from the table TOTAL rows.

The Summary tab should then update from each tab's Overview or calculated tab balance.

All displayed figures should use two decimal places unless a different format is specified.

## 18. Key Principle

The final output should look and behave like the Excel structure, with better interaction:

- Excel-style yearly tables
- Summary overview
- categorized tabs
- recurring preset items
- drill-down transactions
- automatic monthly roll-ups
- year-to-year carry forward
