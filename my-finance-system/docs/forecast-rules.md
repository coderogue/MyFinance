# Forecast Rules

## Normal Cashflow Tabs

Applies to:

- Bank
- Stock
- Managed Funds
- Wallets

Formula:

```text
Total Balance = Brought Forward + Total Debit - Total Credit
```

Carry-forward:

```text
Jan Brought Forward = Opening Balance
Feb Brought Forward = Jan Total Balance
Mar Brought Forward = Feb Total Balance
...
Closing Balance = Dec Total Balance
```

DEBIT table total:

```text
Total Debit = sum(DEBIT preset rows + DEBIT day rows)
```

CREDIT table total:

```text
Total Credit = sum(CREDIT preset rows + CREDIT day rows)
```

## Credit Card Tabs

Formula:

```text
Monthly Total = Fixed Expenses + Variable Expenses + Brought Forward - Rebate
Carried Forward = Monthly Total - Statement Amount
```

`Statement Amount` is the amount actually paid.

Carry-forward:

```text
Feb Brought Forward = Jan Carried Forward
Mar Brought Forward = Feb Carried Forward
...
```

Fixed expenses:

```text
Fixed Expenses = sum(fixed expense rows for the month)
```

Variable expenses:

```text
Variable Expenses = sum(variable expense day rows for the month)
```

## Visible Cell Totals

The visible grid cell is a total, not necessarily a single transaction.

```text
cell total = sum(transactions behind that tab + line item + month)
```

## Preset Values

Preset values are used to project future months.

Users must be able to override a preset value for a specific month.

## Year Close

At year close:

```text
next year opening balance = current year closing balance
```

For credit cards:

```text
next year brought forward = previous year final carried forward
```

Year close should use a snapshot so future years do not change if an old year is edited later.

