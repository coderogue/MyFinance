import { useState } from "react";
import {
  annualTotalColumnIndexes,
  annualTotalColumns,
  creditCardColumns,
  creditCardSummaryRows,
  getFixedExpenseRows,
  getFixedExpenseSubTableRows,
  monthlyRecordColumnIndexes,
  monthlyRecordColumns,
  variableExpenseRows
} from "@/lib/workbook/sample-workbook";
import type {
  CellValueMap,
  FixedExpenseRow,
  FixedExpenseSubRow,
  TransactionCell
} from "@/lib/workbook/types";
import { WorkbookTable } from "./workbook-table";

const CLOSING_COLUMN = 14;

export function CreditCardSheet({
  fixedExpenseRows,
  fixedExpenseSubRows,
  name,
  onCellChange,
  onTransactionCellOpen,
  onAddFixedExpense,
  onAddFixedExpenseSubRow,
  tabId,
  values
}: {
  fixedExpenseRows: FixedExpenseRow[];
  fixedExpenseSubRows: FixedExpenseSubRow[];
  name: string;
  onCellChange: (input: {
    columnIndex: number;
    commit?: boolean;
    rowIndex: number;
    tableId: string;
    value: string;
  }) => void;
  onTransactionCellOpen: (input: TransactionCell) => void;
  onAddFixedExpense: (label: string, hasSubTable: boolean) => void;
  onAddFixedExpenseSubRow: (fixedExpenseId: string, label: string) => void;
  tabId: string;
  values: CellValueMap;
}) {
  const [fixedExpenseName, setFixedExpenseName] = useState("");
  const [hasSubTable, setHasSubTable] = useState(false);
  const tabFixedExpenseRows = fixedExpenseRows.filter((row) => row.tabId === tabId);
  const fixedExpenseTableRows = getFixedExpenseRows(
    tabFixedExpenseRows.map((row) => row.label)
  );

  function addFixedExpense() {
    const cleanName = fixedExpenseName.trim();

    if (!cleanName) {
      return;
    }

    onAddFixedExpense(cleanName, hasSubTable);
    setFixedExpenseName("");
    setHasSubTable(false);
  }

  return (
    <div className="grid gap-5">
      <div>
        <h1 className="text-2xl font-semibold text-slate-950">{name}</h1>
        <p className="mt-1 text-sm text-slate-600">
          Credit-card-specific tab with amount actually paid as Statement
          Amount.
        </p>
      </div>

      <WorkbookTable
        title="Credit Card Summary"
        columns={creditCardColumns}
        getCellMode={({ columnIndex, rowIndex }) => {
          if (columnIndex === 0 || columnIndex === CLOSING_COLUMN) {
            return "display";
          }

          return rowIndex === 3 || rowIndex === 5 ? "edit" : "display";
        }}
        onCellChange={onCellChange}
        rows={creditCardSummaryRows}
        tableId={`${tabId}:credit-card-summary`}
        values={values}
        compact
      />

      <WorkbookTable
        title="Fixed Expenses"
        columns={annualTotalColumns}
        columnIndexes={annualTotalColumnIndexes}
        getCellMode={({ columnIndex, isTotal, rowIndex }) => {
          const row = tabFixedExpenseRows[rowIndex];
          if (
            columnIndex === CLOSING_COLUMN ||
            isTotal ||
            !row ||
            row.hasSubTable
          ) {
            return "display";
          }

          return "edit";
        }}
        onCellChange={onCellChange}
        rows={fixedExpenseTableRows}
        tableId={`${tabId}:fixed-expenses`}
        values={values}
        compact
      />

      <div className="grid gap-3 border border-slate-200 bg-white p-3 md:grid-cols-[1fr_auto_auto]">
        <input
          className="border border-slate-300 px-3 py-2 text-sm"
          onChange={(event) => setFixedExpenseName(event.target.value)}
          placeholder="Fixed expense name"
          value={fixedExpenseName}
        />
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            checked={hasSubTable}
            onChange={(event) => setHasSubTable(event.target.checked)}
            type="checkbox"
          />
          Create subtable
        </label>
        <button
          className="border border-slate-950 bg-slate-950 px-3 py-2 text-sm text-white"
          onClick={addFixedExpense}
        >
          + Fixed Expense
        </button>
      </div>

      {tabFixedExpenseRows
        .filter((row) => row.hasSubTable)
        .map((row) => (
          <FixedExpenseSubTable
            fixedExpense={row}
            key={row.id}
            onCellChange={onCellChange}
            onAddFixedExpenseSubRow={onAddFixedExpenseSubRow}
            onTransactionCellOpen={onTransactionCellOpen}
            rows={fixedExpenseSubRows.filter(
              (subRow) => subRow.fixedExpenseId === row.id
            )}
            values={values}
          />
        ))}

      <WorkbookTable
        title="Variable Expenses"
        columns={monthlyRecordColumns}
        columnIndexes={monthlyRecordColumnIndexes}
        getCellMode={({ isTotal }) => (isTotal ? "display" : "transaction")}
        onCellChange={onCellChange}
        onTransactionCellOpen={onTransactionCellOpen}
        rows={variableExpenseRows}
        tableId={`${tabId}:variable-expenses`}
        values={values}
        compact
      />
    </div>
  );
}

function FixedExpenseSubTable({
  fixedExpense,
  onCellChange,
  onAddFixedExpenseSubRow,
  onTransactionCellOpen,
  rows,
  values
}: {
  fixedExpense: FixedExpenseRow;
  onCellChange: (input: {
    columnIndex: number;
    commit?: boolean;
    rowIndex: number;
    tableId: string;
    value: string;
  }) => void;
  onAddFixedExpenseSubRow: (fixedExpenseId: string, label: string) => void;
  onTransactionCellOpen: (input: TransactionCell) => void;
  rows: FixedExpenseSubRow[];
  values: CellValueMap;
}) {
  const [subRowName, setSubRowName] = useState("");
  const tableRows = getFixedExpenseSubTableRows(rows.map((row) => row.label));

  function addSubRow() {
    const cleanName = subRowName.trim();

    if (!cleanName) {
      return;
    }

    onAddFixedExpenseSubRow(fixedExpense.id, cleanName);
    setSubRowName("");
  }

  return (
    <div className="grid gap-3 border-l-4 border-slate-300 pl-4">
      <div className="grid gap-3 border border-slate-200 bg-white p-3 md:grid-cols-[1fr_auto]">
        <input
          className="border border-slate-300 px-3 py-2 text-sm"
          onChange={(event) => setSubRowName(event.target.value)}
          placeholder={`Row name, e.g. ${fixedExpense.label} 1`}
          value={subRowName}
        />
        <button
          className="border border-slate-950 bg-slate-950 px-3 py-2 text-sm text-white"
          onClick={addSubRow}
        >
          + Sub Row
        </button>
      </div>
      <WorkbookTable
        title={`Sub Table: ${fixedExpense.label}`}
        columns={annualTotalColumns}
        columnIndexes={annualTotalColumnIndexes}
        getCellMode={({ columnIndex, isTotal }) =>
          columnIndex === CLOSING_COLUMN || isTotal ? "display" : "edit"
        }
        onCellChange={onCellChange}
        onTransactionCellOpen={onTransactionCellOpen}
        rows={tableRows}
        tableId={`fixed-subtable:${fixedExpense.id}`}
        values={values}
        compact
      />
    </div>
  );
}
