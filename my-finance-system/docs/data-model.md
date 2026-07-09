# Data Model

## Core Records

The data model should mirror the workbook.

```text
FinanceYear
FinanceTab
NormalTabMonthSummary
CreditCardMonthSummary
TabLineItem
TabLineMonthlyValue
Transaction
FixedExpenseSubTable
FixedExpenseSubTableEntry
MonthClose
YearCloseSnapshot
```

## FinanceYear

Represents one yearly workbook.

Example:

```text
2026 ANNUAL BUDGET
```

## FinanceTab

Represents a tab created by the user.

The system-created Summary tab is also stored as a FinanceTab with:

```text
category = Summary
kind = summary
isSystem = true
```

Fields:

- name
- category
- kind
- opening balance
- is system
- sort order

Categories:

- Summary
- Bank
- Stock
- Managed Funds
- Wallets
- Credit Card

Kinds:

- summary
- normal
- credit-card

## NormalTabMonthSummary

Stores the top overview values for a normal tab.

Rows represented:

- Brought Forward
- Total Debit
- Total Credit
- Total Balance

## CreditCardMonthSummary

Stores the top summary values for a credit card tab.

Rows represented:

- Fixed Expenses
- Variable Expenses
- Brought Forward
- Rebate
- Monthly Total
- Statement Amount
- Carried Forward

## TabLineItem

Represents a row inside one of the lower tables.

Normal tab table types:

- debit
- credit

Credit card table types:

- fixed_expense
- variable_expense

Line types:

- preset
- day
- total

## TabLineMonthlyValue

Stores monthly values for preset rows and editable table rows.

This supports recurring projections while still allowing month-specific changes.

## Transaction

Stores drill-down detail behind a visible cell.

The visible cell total is calculated from one or more transactions.

## FixedExpenseSubTable

Stores optional detail tables under credit card fixed expense rows.

Example:

```text
Petrol
  2026-03-05  120.00
  2026-03-14  110.00
  2026-03-25  290.00
```
