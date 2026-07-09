"use client";

import { useMemo, useState } from "react";
import {
  getWorkbookTabGroups,
  userTabCategories,
  workbookTabs
} from "@/lib/workbook/sample-workbook";
import type {
  FixedExpenseRow,
  FixedExpenseSubRow,
  CellValueMap,
  NormalTableType,
  PresetRow,
  StockDividendEntry,
  StockPriceEntry,
  StockRow,
  StockTransactionEntry,
  TransactionCell,
  TransactionEntry,
  UserTabCategory,
  WorkbookTab
} from "@/lib/workbook/types";
import { CreditCardSheet } from "./credit-card-sheet";
import { NormalTabSheet } from "./normal-tab-sheet";
import { StockSheet } from "./stock-sheet";
import { SummarySheet } from "./summary-sheet";

const FIRST_MONTH_COLUMN = 2;
const LAST_MONTH_COLUMN = 13;
const FIRST_AMOUNT_COLUMN = 1;
const LAST_AMOUNT_COLUMN = 14;

export function WorkbookApp() {
  const [tabs, setTabs] = useState<WorkbookTab[]>(workbookTabs);
  const [fixedExpenseRows, setFixedExpenseRows] = useState<FixedExpenseRow[]>([]);
  const [fixedExpenseSubRows, setFixedExpenseSubRows] = useState<
    FixedExpenseSubRow[]
  >([]);
  const [presetRows, setPresetRows] = useState<PresetRow[]>([]);
  const [stockRows, setStockRows] = useState<StockRow[]>([]);
  const [stockTransactions, setStockTransactions] = useState<
    StockTransactionEntry[]
  >([]);
  const [stockPrices, setStockPrices] = useState<StockPriceEntry[]>([]);
  const [stockDividends, setStockDividends] = useState<StockDividendEntry[]>([]);
  const [cellValues, setCellValues] = useState<CellValueMap>({});
  const [transactionCell, setTransactionCell] = useState<TransactionCell | null>(
    null
  );
  const [transactions, setTransactions] = useState<
    Record<string, TransactionEntry[]>
  >({});
  const [transactionDescription, setTransactionDescription] = useState("");
  const [transactionAmount, setTransactionAmount] = useState("");
  const [selectedTabId, setSelectedTabId] = useState("summary");
  const [isAddingTab, setIsAddingTab] = useState(false);
  const [isRenamingTab, setIsRenamingTab] = useState(false);
  const [tabName, setTabName] = useState("");
  const [renameTabName, setRenameTabName] = useState("");
  const [category, setCategory] = useState<UserTabCategory>("Bank");
  const tabGroups = useMemo(() => getWorkbookTabGroups(tabs), [tabs]);
  const selectedTab =
    tabs.find((tab) => tab.id === selectedTabId) ?? tabs[0];
  const normalTabs = tabs.filter((tab) => tab.kind === "normal");
  const displayCellValues = useMemo(
    () =>
      buildDisplayCellValues({
        cellValues,
        fixedExpenseRows,
        fixedExpenseSubRows,
        presetRows,
        stockPrices,
        stockRows,
        stockTransactions,
        tabs
      }),
    [
      cellValues,
      fixedExpenseRows,
      fixedExpenseSubRows,
      presetRows,
      stockPrices,
      stockRows,
      stockTransactions,
      tabs
    ]
  );

  function addTab() {
    const cleanName = tabName.trim();

    if (!cleanName) {
      return;
    }

    const newTab: WorkbookTab = {
      id: `${category.toLowerCase().replaceAll(" ", "-")}-${Date.now()}`,
      name: cleanName,
      category,
      kind:
        category === "Credit Card"
          ? "credit-card"
          : category === "Stock" || category === "Managed Funds"
            ? "stock"
            : "normal"
    };

    setTabs((currentTabs) => [...currentTabs, newTab]);
    setSelectedTabId(newTab.id);
    setTabName("");
    setCategory("Bank");
    setIsAddingTab(false);
  }

  function startRenameTab() {
    if (selectedTab.kind === "summary") {
      return;
    }

    setRenameTabName(selectedTab.name);
    setIsRenamingTab(true);
  }

  function renameSelectedTab() {
    if (selectedTab.kind === "summary") {
      return;
    }

    const cleanName = renameTabName.trim();

    if (!cleanName) {
      return;
    }

    const tabId = selectedTab.id;

    setTabs((currentTabs) =>
      currentTabs.map((tab) =>
        tab.id === tabId
          ? {
              ...tab,
              name: cleanName
            }
          : tab
      )
    );
    setPresetRows((currentRows) =>
      currentRows.map((row) =>
        row.linkedTabId === tabId
          ? {
              ...row,
              label: cleanName
            }
          : row
      )
    );
    setRenameTabName("");
    setIsRenamingTab(false);
  }

  function deleteSelectedTab() {
    if (selectedTab.kind === "summary") {
      return;
    }

    const shouldDelete = window.confirm(
      `Delete "${selectedTab.name}" and all local data entered in this tab?`
    );

    if (!shouldDelete) {
      return;
    }

    const tabId = selectedTab.id;
    const fixedExpenseIds = fixedExpenseRows
      .filter((row) => row.tabId === tabId)
      .map((row) => row.id);
    const cellKeyPrefixes = [
      `${tabId}:`,
      ...fixedExpenseIds.map((id) => `fixed-subtable:${id}:`)
    ];

    setTabs((currentTabs) => currentTabs.filter((tab) => tab.id !== tabId));
    setPresetRows((currentRows) =>
      currentRows.filter(
        (row) => row.tabId !== tabId && row.linkedTabId !== tabId
      )
    );
    setFixedExpenseRows((currentRows) =>
      currentRows.filter((row) => row.tabId !== tabId)
    );
    setFixedExpenseSubRows((currentRows) =>
      currentRows.filter((row) => !fixedExpenseIds.includes(row.fixedExpenseId))
    );
    setCellValues((currentValues) =>
      removeRecordKeysByPrefixes(currentValues, cellKeyPrefixes)
    );
    setTransactions((currentTransactions) =>
      removeRecordKeysByPrefixes(currentTransactions, cellKeyPrefixes)
    );
    setStockRows((currentRows) =>
      currentRows.filter((row) => row.tabId !== tabId)
    );
    setStockTransactions((currentRows) =>
      currentRows.filter((row) => {
        const stock = stockRows.find((item) => item.id === row.stockId);
        return stock?.tabId !== tabId;
      })
    );
    setStockPrices((currentRows) =>
      currentRows.filter((row) => {
        const stock = stockRows.find((item) => item.id === row.stockId);
        return stock?.tabId !== tabId;
      })
    );
    setStockDividends((currentRows) =>
      currentRows.filter((row) => {
        const stock = stockRows.find((item) => item.id === row.stockId);
        return stock?.tabId !== tabId;
      })
    );

    if (
      transactionCell &&
      cellKeyPrefixes.some((prefix) =>
        cellKey(transactionCell).startsWith(prefix)
      )
    ) {
      setTransactionCell(null);
      setTransactionDescription("");
      setTransactionAmount("");
    }

    setSelectedTabId("summary");
  }

  function addPreset(
    tableType: NormalTableType,
    label: string,
    linkedTabId?: string
  ) {
    if (selectedTab.kind !== "normal") {
      return;
    }

    const oppositeTableType: NormalTableType =
      tableType === "credit" ? "debit" : "credit";
    const timestamp = Date.now();
    const sourcePresetId = `${selectedTab.id}-${tableType}-${timestamp}`;
    const linkedPresetId = linkedTabId
      ? `${linkedTabId}-${oppositeTableType}-${timestamp}`
      : undefined;

    setPresetRows((currentRows) => {
      const sourceRow: PresetRow = {
        id: sourcePresetId,
        label,
        linkedPresetRowId: linkedPresetId,
        linkedTabId,
        tableType,
        tabId: selectedTab.id
      };

      if (!linkedTabId || !linkedPresetId) {
        return [...currentRows, sourceRow];
      }

      const linkedRow: PresetRow = {
        id: linkedPresetId,
        label: selectedTab.name,
        linkedPresetRowId: sourcePresetId,
        linkedTabId: selectedTab.id,
        tableType: oppositeTableType,
        tabId: linkedTabId
      };

      return [...currentRows, sourceRow, linkedRow];
    });
  }

  function addFixedExpense(label: string, hasSubTable: boolean) {
    if (selectedTab.kind !== "credit-card") {
      return;
    }

    setFixedExpenseRows((currentRows) => [
      ...currentRows,
      {
        hasSubTable,
        id: `${selectedTab.id}-fixed-${Date.now()}`,
        label,
        tabId: selectedTab.id
      }
    ]);
  }

  function addFixedExpenseSubRow(fixedExpenseId: string, label: string) {
    setFixedExpenseSubRows((currentRows) => [
      ...currentRows,
      {
        fixedExpenseId,
        id: `${fixedExpenseId}-sub-${Date.now()}`,
        label
      }
    ]);
  }

  function addStock(label: string) {
    if (selectedTab.kind !== "stock") {
      return;
    }

    setStockRows((currentRows) => [
      ...currentRows,
      {
        id: `${selectedTab.id}-stock-${Date.now()}`,
        label,
        tabId: selectedTab.id
      }
    ]);
  }

  function addStockTransaction(input: Omit<StockTransactionEntry, "id">) {
    setStockTransactions((currentRows) => [
      ...currentRows,
      {
        ...input,
        id: `${input.stockId}-transaction-${Date.now()}`
      }
    ]);
  }

  function addStockPrice(input: Omit<StockPriceEntry, "id">) {
    setStockPrices((currentRows) => [
      ...currentRows,
      {
        ...input,
        id: `${input.stockId}-price-${Date.now()}`
      }
    ]);
  }

  function addStockDividend(input: Omit<StockDividendEntry, "id">) {
    setStockDividends((currentRows) => [
      ...currentRows,
      {
        ...input,
        id: `${input.stockId}-dividend-${Date.now()}`
      }
    ]);
  }

  function updateCell(input: {
    columnIndex: number;
    commit?: boolean;
    rowIndex: number;
    tableId: string;
    value: string;
  }) {
    setCellValues((currentValues) => {
      const key = createCellKey(
        input.tableId,
        input.rowIndex,
        input.columnIndex
      );
      const nextValues = {
        ...currentValues,
        [key]: input.value
      };

      if (
        !input.commit ||
        input.columnIndex < FIRST_MONTH_COLUMN ||
        input.columnIndex >= LAST_MONTH_COLUMN ||
        !input.value
      ) {
        return nextValues;
      }

      for (
        let nextColumnIndex = input.columnIndex + 1;
        nextColumnIndex <= LAST_MONTH_COLUMN;
        nextColumnIndex += 1
      ) {
        const nextKey = createCellKey(
          input.tableId,
          input.rowIndex,
          nextColumnIndex
        );

        if (nextValues[nextKey]) {
          continue;
        }

        nextValues[nextKey] = input.value;
      }

      return nextValues;
    });
  }

  function cellKey(input: TransactionCell) {
    return `${input.tableId}:${input.rowIndex}:${input.columnIndex}`;
  }

  function formatAmount(value: string) {
    const parsed = Number(value.replace(/,/g, "").trim());
    return Number.isFinite(parsed)
      ? parsed.toLocaleString("en-US", {
          maximumFractionDigits: 2,
          minimumFractionDigits: 2
        })
      : "";
  }

  function addTransaction() {
    if (!transactionCell) {
      return;
    }

    const cleanDescription = transactionDescription.trim();
    const cleanAmount = formatAmount(transactionAmount);

    if (!cleanDescription || !cleanAmount) {
      return;
    }

    const key = cellKey(transactionCell);
    const nextTransaction: TransactionEntry = {
      amount: cleanAmount,
      description: cleanDescription,
      id: `${key}:${Date.now()}`
    };

    setTransactions((currentTransactions) => {
      const nextRows = [...(currentTransactions[key] ?? []), nextTransaction];
      const total = nextRows.reduce(
        (sum, row) => sum + Number(row.amount.replace(/,/g, "")),
        0
      );

      setCellValues((currentValues) => ({
        ...currentValues,
        [key]: total.toLocaleString("en-US", {
          maximumFractionDigits: 2,
          minimumFractionDigits: 2
        })
      }));

      return {
        ...currentTransactions,
        [key]: nextRows
      };
    });

    setTransactionDescription("");
    setTransactionAmount("");
  }

  return (
    <main className="min-h-screen bg-slate-100 text-slate-950">
      <div className="grid min-h-screen lg:grid-cols-[280px_1fr]">
        <aside className="border-r border-slate-300 bg-white">
          <div className="border-b border-slate-300 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              My Finance
            </p>
            <h1 className="mt-1 text-xl font-semibold">2026 Workbook</h1>
          </div>

          <nav className="p-3">
            {tabGroups.map((group) => (
              <div key={group.title} className="mb-4">
                <p className="mb-1 px-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {group.title}
                </p>
                <div className="grid gap-1">
                  {group.tabs.map((tab) => (
                    <button
                      key={tab.id}
                      className={`w-full px-2 py-1.5 text-left text-sm ${
                        tab.id === selectedTabId
                          ? "border border-slate-300 bg-slate-950 font-medium text-white"
                          : "text-slate-700 hover:bg-slate-100"
                      }`}
                      onClick={() => setSelectedTabId(tab.id)}
                    >
                      {tab.name}
                    </button>
                  ))}
                  {group.tabs.length === 0 ? (
                    <p className="px-2 py-1.5 text-xs text-slate-400">
                      No tabs yet
                    </p>
                  ) : null}
                </div>
              </div>
            ))}

            <button
              className="w-full border border-dashed border-slate-400 px-3 py-2 text-left text-sm font-medium text-slate-600"
              onClick={() => setIsAddingTab(true)}
            >
              + New Tab
            </button>
          </nav>
        </aside>

        <section className="min-w-0 p-4 md:p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Workbook prototype
              </p>
              <p className="text-sm text-slate-600">
                {selectedTab.kind === "summary"
                  ? "Summary-first output shaped like the Excel file."
                  : `${selectedTab.category} / ${
                      selectedTab.kind === "credit-card"
                        ? "Credit Card"
                        : selectedTab.kind === "stock"
                          ? selectedTab.category
                          : "Normal"
                    } tab`}
              </p>
            </div>

            <div className="flex gap-2">
              {selectedTab.kind !== "summary" ? (
                <>
                  <button
                    className="border border-slate-300 bg-white px-3 py-2 text-sm"
                    onClick={startRenameTab}
                  >
                    Rename Tab
                  </button>
                  <button
                    className="border border-red-300 bg-white px-3 py-2 text-sm text-red-700"
                    onClick={deleteSelectedTab}
                  >
                    Delete Tab
                  </button>
                </>
              ) : null}
              <button className="border border-slate-300 bg-white px-3 py-2 text-sm">
                Create Year
              </button>
              <button
                className="border border-slate-950 bg-slate-950 px-3 py-2 text-sm text-white"
                onClick={() => setIsAddingTab(true)}
              >
                Add Tab
              </button>
            </div>
          </div>

          {isAddingTab ? (
            <section className="mb-5 border border-slate-300 bg-white p-4">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-600">
                Add Tab
              </h2>
              <div className="mt-3 grid gap-3 md:grid-cols-[1fr_220px_auto_auto]">
                <input
                  className="border border-slate-300 px-3 py-2 text-sm"
                  onChange={(event) => setTabName(event.target.value)}
                  placeholder="Tab name"
                  value={tabName}
                />
                <select
                  className="border border-slate-300 px-3 py-2 text-sm"
                  onChange={(event) =>
                    setCategory(event.target.value as UserTabCategory)
                  }
                  value={category}
                >
                  {userTabCategories.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
                <button
                  className="border border-slate-950 bg-slate-950 px-3 py-2 text-sm text-white"
                  onClick={addTab}
                >
                  Add
                </button>
                <button
                  className="border border-slate-300 bg-white px-3 py-2 text-sm"
                  onClick={() => setIsAddingTab(false)}
                >
                  Cancel
                </button>
              </div>
            </section>
          ) : null}

          {isRenamingTab ? (
            <section className="mb-5 border border-slate-300 bg-white p-4">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-600">
                Rename Tab
              </h2>
              <div className="mt-3 grid gap-3 md:grid-cols-[1fr_auto_auto]">
                <input
                  className="border border-slate-300 px-3 py-2 text-sm"
                  onChange={(event) => setRenameTabName(event.target.value)}
                  placeholder="Tab name"
                  value={renameTabName}
                />
                <button
                  className="border border-slate-950 bg-slate-950 px-3 py-2 text-sm text-white"
                  onClick={renameSelectedTab}
                >
                  Save
                </button>
                <button
                  className="border border-slate-300 bg-white px-3 py-2 text-sm"
                  onClick={() => setIsRenamingTab(false)}
                >
                  Cancel
                </button>
              </div>
            </section>
          ) : null}

          <div className="grid gap-8">
            {selectedTab.kind === "summary" ? (
              <SummarySheet tabs={tabs} values={displayCellValues} />
            ) : selectedTab.kind === "credit-card" ? (
              <CreditCardSheet
                fixedExpenseRows={fixedExpenseRows}
                fixedExpenseSubRows={fixedExpenseSubRows}
                name={selectedTab.name}
                onCellChange={updateCell}
                onTransactionCellOpen={setTransactionCell}
                onAddFixedExpense={addFixedExpense}
                onAddFixedExpenseSubRow={addFixedExpenseSubRow}
                tabId={selectedTab.id}
                values={displayCellValues}
              />
            ) : selectedTab.kind === "stock" ? (
              <StockSheet
                category={selectedTab.category}
                name={selectedTab.name}
                onAddDividend={addStockDividend}
                onAddStockPrice={addStockPrice}
                onAddStock={addStock}
                onAddStockTransaction={addStockTransaction}
                stocks={stockRows}
                stockDividends={stockDividends}
                stockPrices={stockPrices}
                stockTransactions={stockTransactions}
                tabId={selectedTab.id}
              />
            ) : (
              <NormalTabSheet
                category={selectedTab.category}
                name={selectedTab.name}
                onCellChange={updateCell}
                onTransactionCellOpen={setTransactionCell}
                normalTabs={normalTabs}
                onAddPreset={addPreset}
                presetRows={presetRows}
                tabId={selectedTab.id}
                values={displayCellValues}
              />
            )}
          </div>

          {transactionCell ? (
            <section className="fixed inset-y-0 right-0 z-10 w-full max-w-md border-l border-slate-300 bg-white p-4 shadow-xl">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold">Transactions</h2>
                  <p className="mt-1 text-sm text-slate-600">
                    {transactionCell.title}
                  </p>
                </div>
                <button
                  className="border border-slate-300 px-2 py-1 text-sm"
                  onClick={() => setTransactionCell(null)}
                >
                  Close
                </button>
              </div>

              <div className="mt-4 grid gap-3">
                <input
                  className="border border-slate-300 px-3 py-2 text-sm"
                  onChange={(event) =>
                    setTransactionDescription(event.target.value)
                  }
                  placeholder="Description"
                  value={transactionDescription}
                />
                <input
                  className="border border-slate-300 px-3 py-2 text-sm"
                  inputMode="decimal"
                  onChange={(event) => setTransactionAmount(event.target.value)}
                  placeholder="Amount"
                  value={transactionAmount}
                />
                <button
                  className="border border-slate-950 bg-slate-950 px-3 py-2 text-sm text-white"
                  onClick={addTransaction}
                >
                  Add Transaction
                </button>
              </div>

              <div className="mt-5">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="bg-slate-100">
                      <th className="border border-slate-200 px-2 py-2 text-left">
                        Description
                      </th>
                      <th className="border border-slate-200 px-2 py-2 text-right">
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {(transactions[cellKey(transactionCell)] ?? []).map((row) => (
                      <tr key={row.id}>
                        <td className="border border-slate-200 px-2 py-2">
                          {row.description}
                        </td>
                        <td className="border border-slate-200 px-2 py-2 text-right tabular-nums">
                          {row.amount}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ) : null}
        </section>
      </div>
    </main>
  );
}

function createCellKey(tableId: string, rowIndex: number, columnIndex: number) {
  return `${tableId}:${rowIndex}:${columnIndex}`;
}

function removeRecordKeysByPrefixes<T>(record: Record<string, T>, prefixes: string[]) {
  return Object.fromEntries(
    Object.entries(record).filter(
      ([key]) => !prefixes.some((prefix) => key.startsWith(prefix))
    )
  );
}

function parseAmount(value?: string) {
  const parsed = Number((value ?? "").replace(/,/g, "").trim());
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatAmountTotal(value: number) {
  return value.toLocaleString("en-US", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2
  });
}

function buildDisplayCellValues({
  cellValues,
  fixedExpenseRows,
  fixedExpenseSubRows,
  presetRows,
  stockPrices,
  stockRows,
  stockTransactions,
  tabs
}: {
  cellValues: CellValueMap;
  fixedExpenseRows: FixedExpenseRow[];
  fixedExpenseSubRows: FixedExpenseSubRow[];
  presetRows: PresetRow[];
  stockPrices: StockPriceEntry[];
  stockRows: StockRow[];
  stockTransactions: StockTransactionEntry[];
  tabs: WorkbookTab[];
}) {
  const displayValues: CellValueMap = { ...cellValues };

  tabs
    .filter((tab) => tab.kind === "normal")
    .forEach((tab) => {
      calculateNormalTabValues(tab, presetRows, displayValues);
    });

  for (const fixedExpenseRow of fixedExpenseRows) {
    if (!fixedExpenseRow.hasSubTable) {
      continue;
    }

    const subRows = fixedExpenseSubRows.filter(
      (row) => row.fixedExpenseId === fixedExpenseRow.id
    );
    const subTableId = `fixed-subtable:${fixedExpenseRow.id}`;
    const subTotalRowIndex = subRows.length;

    for (
      let columnIndex = FIRST_AMOUNT_COLUMN;
      columnIndex <= LAST_AMOUNT_COLUMN;
      columnIndex += 1
    ) {
      let total = 0;
      let hasValue = false;

      subRows.forEach((_, rowIndex) => {
        const value = cellValues[createCellKey(subTableId, rowIndex, columnIndex)];
        if (value) {
          hasValue = true;
          total += parseAmount(value);
        }
      });

      displayValues[createCellKey(subTableId, subTotalRowIndex, columnIndex)] =
        hasValue ? formatAmountTotal(total) : "";
    }
  }

  const fixedExpenseRowsByTab = fixedExpenseRows.reduce<
    Record<string, FixedExpenseRow[]>
  >((groups, row) => {
    groups[row.tabId] = [...(groups[row.tabId] ?? []), row];
    return groups;
  }, {});

  Object.entries(fixedExpenseRowsByTab).forEach(([tabId, tabRows]) => {
    const fixedExpensesTableId = `${tabId}:fixed-expenses`;
    const fixedExpensesTotalRowIndex = tabRows.length;

    for (
      let columnIndex = FIRST_AMOUNT_COLUMN;
      columnIndex <= LAST_AMOUNT_COLUMN;
      columnIndex += 1
    ) {
      let tableTotal = 0;
      let tableHasValue = false;

      tabRows.forEach((row, rowIndex) => {
        const rowKey = createCellKey(fixedExpensesTableId, rowIndex, columnIndex);
        let rowValue = cellValues[rowKey];

        if (row.hasSubTable) {
          const subRows = fixedExpenseSubRows.filter(
            (subRow) => subRow.fixedExpenseId === row.id
          );
          const subTotalKey = createCellKey(
            `fixed-subtable:${row.id}`,
            subRows.length,
            columnIndex
          );
          rowValue = displayValues[subTotalKey];
          displayValues[rowKey] = rowValue;
        }

        if (rowValue) {
          tableHasValue = true;
          tableTotal += parseAmount(rowValue);
        }
      });

      displayValues[
        createCellKey(
          fixedExpensesTableId,
          fixedExpensesTotalRowIndex,
          columnIndex
        )
      ] = tableHasValue ? formatAmountTotal(tableTotal) : "";
    }
  });

  tabs
    .filter((tab) => tab.kind === "credit-card")
    .forEach((tab) => {
      calculateCreditCardTabValues(tab, displayValues);
    });

  calculateSummaryValues({
    displayValues,
    stockPrices,
    stockRows,
    stockTransactions,
    tabs
  });

  return displayValues;
}

function calculateNormalTabValues(
  tab: WorkbookTab,
  presetRows: PresetRow[],
  displayValues: CellValueMap
) {
  const debitPresetCount = presetRows.filter(
    (row) => row.tabId === tab.id && row.tableType === "debit"
  ).length;
  const creditPresetCount = presetRows.filter(
    (row) => row.tabId === tab.id && row.tableType === "credit"
  ).length;
  const debitTotalRowIndex = debitPresetCount + 31;
  const creditTotalRowIndex = creditPresetCount + 31;

  for (
    let columnIndex = FIRST_AMOUNT_COLUMN;
    columnIndex <= LAST_AMOUNT_COLUMN;
    columnIndex += 1
  ) {
    const debitTotal = sumTableColumn(
      `${tab.id}:debit`,
      debitTotalRowIndex,
      columnIndex,
      displayValues
    );
    const creditTotal = sumTableColumn(
      `${tab.id}:credit`,
      creditTotalRowIndex,
      columnIndex,
      displayValues
    );

    displayValues[
      createCellKey(`${tab.id}:debit`, debitTotalRowIndex, columnIndex)
    ] = debitTotal.hasValue ? formatAmountTotal(debitTotal.total) : "";
    displayValues[
      createCellKey(`${tab.id}:credit`, creditTotalRowIndex, columnIndex)
    ] = creditTotal.hasValue ? formatAmountTotal(creditTotal.total) : "";
  }

  let previousBalance = parseAmount(
    displayValues[createCellKey(`${tab.id}:overview`, 0, FIRST_AMOUNT_COLUMN)]
  );

  for (
    let columnIndex = FIRST_AMOUNT_COLUMN;
    columnIndex <= LAST_AMOUNT_COLUMN;
    columnIndex += 1
  ) {
    const broughtForward =
      columnIndex === FIRST_AMOUNT_COLUMN ? previousBalance : previousBalance;
    const debit = parseAmount(
      displayValues[createCellKey(`${tab.id}:debit`, debitTotalRowIndex, columnIndex)]
    );
    const credit = parseAmount(
      displayValues[
        createCellKey(`${tab.id}:credit`, creditTotalRowIndex, columnIndex)
      ]
    );
    const balance = broughtForward + debit - credit;

    displayValues[createCellKey(`${tab.id}:overview`, 0, columnIndex)] =
      broughtForward || debit || credit ? formatAmountTotal(broughtForward) : "";
    displayValues[createCellKey(`${tab.id}:overview`, 1, columnIndex)] =
      debit ? formatAmountTotal(debit) : "";
    displayValues[createCellKey(`${tab.id}:overview`, 2, columnIndex)] =
      credit ? formatAmountTotal(credit) : "";
    displayValues[createCellKey(`${tab.id}:overview`, 3, columnIndex)] =
      broughtForward || debit || credit ? formatAmountTotal(balance) : "";

    previousBalance = balance;
  }
}

function calculateCreditCardTabValues(
  tab: WorkbookTab,
  displayValues: CellValueMap
) {
  const variableTotalRowIndex = 31;
  let previousCarriedForward = 0;

  for (
    let columnIndex = FIRST_AMOUNT_COLUMN;
    columnIndex <= LAST_AMOUNT_COLUMN;
    columnIndex += 1
  ) {
    const variableTotal = sumTableColumn(
      `${tab.id}:variable-expenses`,
      variableTotalRowIndex,
      columnIndex,
      displayValues
    );
    displayValues[
      createCellKey(
        `${tab.id}:variable-expenses`,
        variableTotalRowIndex,
        columnIndex
      )
    ] = variableTotal.hasValue ? formatAmountTotal(variableTotal.total) : "";

    const fixedExpenses = parseAmount(
      displayValues[
        findFixedExpenseTotalKey(`${tab.id}:fixed-expenses`, columnIndex, displayValues)
      ]
    );
    const variableExpenses = variableTotal.total;
    const broughtForward =
      columnIndex === FIRST_AMOUNT_COLUMN ? 0 : previousCarriedForward;
    const rebate = parseAmount(
      displayValues[createCellKey(`${tab.id}:credit-card-summary`, 3, columnIndex)]
    );
    const statementAmount = parseAmount(
      displayValues[createCellKey(`${tab.id}:credit-card-summary`, 5, columnIndex)]
    );
    const monthlyTotal = fixedExpenses + variableExpenses + broughtForward - rebate;
    const carriedForward = monthlyTotal - statementAmount;
    const hasValue =
      fixedExpenses ||
      variableExpenses ||
      broughtForward ||
      rebate ||
      statementAmount;

    displayValues[createCellKey(`${tab.id}:credit-card-summary`, 0, columnIndex)] =
      fixedExpenses ? formatAmountTotal(fixedExpenses) : "";
    displayValues[createCellKey(`${tab.id}:credit-card-summary`, 1, columnIndex)] =
      variableExpenses ? formatAmountTotal(variableExpenses) : "";
    displayValues[createCellKey(`${tab.id}:credit-card-summary`, 2, columnIndex)] =
      broughtForward ? formatAmountTotal(broughtForward) : "";
    displayValues[createCellKey(`${tab.id}:credit-card-summary`, 4, columnIndex)] =
      hasValue ? formatAmountTotal(monthlyTotal) : "";
    displayValues[createCellKey(`${tab.id}:credit-card-summary`, 6, columnIndex)] =
      hasValue ? formatAmountTotal(carriedForward) : "";

    previousCarriedForward = carriedForward;
  }
}

function calculateSummaryValues({
  displayValues,
  stockPrices,
  stockRows,
  stockTransactions,
  tabs
}: {
  displayValues: CellValueMap;
  stockPrices: StockPriceEntry[];
  stockRows: StockRow[];
  stockTransactions: StockTransactionEntry[];
  tabs: WorkbookTab[];
}) {
  const summaryCategories: Array<{
    category: UserTabCategory;
    label: string;
  }> = [
    { category: "Bank", label: "BANKS" },
    { category: "Stock", label: "STOCKS" },
    { category: "Managed Funds", label: "MANAGED FUND" },
    { category: "Wallets", label: "WALLETS" }
  ];

  const detailCategories: UserTabCategory[] = [
    "Bank",
    "Stock",
    "Managed Funds"
  ];

  detailCategories.forEach((category) => {
    const categoryTabs = tabs.filter((tab) => tab.category === category);

    categoryTabs.forEach((tab, tabIndex) => {
      for (
        let summaryColumnIndex = 2;
        summaryColumnIndex <= 15;
        summaryColumnIndex += 1
      ) {
        const value = getTabSummaryValue({
          displayValues,
          stockPrices,
          stockRows,
          stockTransactions,
          summaryColumnIndex,
          tab
        });
        displayValues[
          createCellKey(`summary:${category}`, tabIndex, summaryColumnIndex)
        ] = value ? formatAmountTotal(value) : "";
      }
    });

    const totalRowIndex = categoryTabs.length;
    for (
      let summaryColumnIndex = 2;
      summaryColumnIndex <= 15;
      summaryColumnIndex += 1
    ) {
      const total = categoryTabs.reduce((sum, _, tabIndex) => {
        return (
          sum +
          parseAmount(
            displayValues[
              createCellKey(`summary:${category}`, tabIndex, summaryColumnIndex)
            ]
          )
        );
      }, 0);
      displayValues[
        createCellKey(`summary:${category}`, totalRowIndex, summaryColumnIndex)
      ] = total ? formatAmountTotal(total) : "";
    }
  });

  summaryCategories.forEach(({ category }, rowIndex) => {
    const categoryTabs = tabs.filter((tab) => tab.category === category);
    for (
      let summaryColumnIndex = 2;
      summaryColumnIndex <= 15;
      summaryColumnIndex += 1
    ) {
      const total = categoryTabs.reduce(
        (sum, tab) =>
          sum +
          getTabSummaryValue({
            displayValues,
            stockPrices,
            stockRows,
            stockTransactions,
            summaryColumnIndex,
            tab
          }),
        0
      );
      displayValues[
        createCellKey("summary:category", rowIndex, summaryColumnIndex)
      ] = total ? formatAmountTotal(total) : "";
    }
  });

  const totalRowIndex = summaryCategories.length;
  for (
    let summaryColumnIndex = 2;
    summaryColumnIndex <= 15;
    summaryColumnIndex += 1
  ) {
    const total = summaryCategories.reduce(
      (sum, _, rowIndex) =>
        sum +
        parseAmount(
          displayValues[
            createCellKey("summary:category", rowIndex, summaryColumnIndex)
          ]
        ),
      0
    );
    displayValues[
      createCellKey("summary:category", totalRowIndex, summaryColumnIndex)
    ] = total ? formatAmountTotal(total) : "";
  }
}

function getTabSummaryValue({
  displayValues,
  stockPrices,
  stockRows,
  stockTransactions,
  summaryColumnIndex,
  tab
}: {
  displayValues: CellValueMap;
  stockPrices: StockPriceEntry[];
  stockRows: StockRow[];
  stockTransactions: StockTransactionEntry[];
  summaryColumnIndex: number;
  tab: WorkbookTab;
}) {
  const workbookColumnIndex = summaryColumnIndex - 1;

  if (tab.kind === "normal") {
    return parseAmount(
      displayValues[createCellKey(`${tab.id}:overview`, 3, workbookColumnIndex)]
    );
  }

  if (tab.kind === "credit-card") {
    return parseAmount(
      displayValues[
        createCellKey(`${tab.id}:credit-card-summary`, 6, workbookColumnIndex)
      ]
    );
  }

  if (tab.kind === "stock") {
    return getInvestmentTabSummaryValue({
      columnIndex: workbookColumnIndex,
      stockPrices,
      stockRows: stockRows.filter((row) => row.tabId === tab.id),
      stockTransactions
    });
  }

  return 0;
}

function getInvestmentTabSummaryValue({
  columnIndex,
  stockPrices,
  stockRows,
  stockTransactions
}: {
  columnIndex: number;
  stockPrices: StockPriceEntry[];
  stockRows: StockRow[];
  stockTransactions: StockTransactionEntry[];
}) {
  return stockRows.reduce((sum, stock) => {
    const maxColumnIndex =
      columnIndex === LAST_AMOUNT_COLUMN ? LAST_MONTH_COLUMN : columnIndex;
    const relevantTransactions = stockTransactions
      .filter(
        (entry) =>
          entry.stockId === stock.id && entry.columnIndex <= maxColumnIndex
      )
      .sort((first, second) => first.columnIndex - second.columnIndex);
    const quantity = relevantTransactions.reduce(
      (quantitySum, entry) => quantitySum + parseAmount(entry.quantity),
      0
    );
    const latestMarketPrice = stockPrices
      .filter(
        (entry) =>
          entry.stockId === stock.id && entry.columnIndex <= maxColumnIndex
      )
      .sort((first, second) => first.columnIndex - second.columnIndex)
      .at(-1)?.price;
    const fallbackPurchasePrice = [...relevantTransactions]
      .reverse()
      .find((entry) => parseAmount(entry.price) > 0)?.price;
    const price = parseAmount(latestMarketPrice ?? fallbackPurchasePrice);

    return sum + quantity * price;
  }, 0);
}

function sumTableColumn(
  tableId: string,
  totalRowIndex: number,
  columnIndex: number,
  displayValues: CellValueMap
) {
  let total = 0;
  let hasValue = false;

  for (let rowIndex = 0; rowIndex < totalRowIndex; rowIndex += 1) {
    const value = displayValues[createCellKey(tableId, rowIndex, columnIndex)];

    if (value) {
      hasValue = true;
      total += parseAmount(value);
    }
  }

  return { hasValue, total };
}

function findFixedExpenseTotalKey(
  tableId: string,
  columnIndex: number,
  displayValues: CellValueMap
) {
  const matchingKeys = Object.keys(displayValues).filter((key) => {
    const keyParts = key.split(":");
    const keyColumnIndex = keyParts.at(-1);
    return key.startsWith(`${tableId}:`) && keyColumnIndex === String(columnIndex);
  });
  const totalKey = matchingKeys
    .map((key) => ({
      key,
      rowIndex: Number(key.split(":").at(-2))
    }))
    .filter((item) => Number.isFinite(item.rowIndex))
    .sort((first, second) => second.rowIndex - first.rowIndex)[0]?.key;

  return totalKey ?? createCellKey(tableId, 0, columnIndex);
}
