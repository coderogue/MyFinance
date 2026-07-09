export function calculateNormalBalance(input: {
  broughtForward: number;
  totalDebit: number;
  totalCredit: number;
}) {
  return input.broughtForward + input.totalDebit - input.totalCredit;
}

export function calculateCreditCardMonthlyTotal(input: {
  fixedExpenses: number;
  variableExpenses: number;
  broughtForward: number;
  rebate: number;
}) {
  return (
    input.fixedExpenses +
    input.variableExpenses +
    input.broughtForward -
    input.rebate
  );
}

export function calculateCreditCardCarriedForward(input: {
  monthlyTotal: number;
  statementAmount: number;
}) {
  return input.monthlyTotal - input.statementAmount;
}

export function sumAmounts(values: number[]) {
  return values.reduce((total, value) => total + value, 0);
}

