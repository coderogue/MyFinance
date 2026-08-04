"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
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
const DAY_ROW_COUNT = 31;
const DEFAULT_WORKBOOK_YEAR = 2026;

interface WorkbookYearState {
  cellValues: CellValueMap;
  fixedExpenseRows: FixedExpenseRow[];
  fixedExpenseSubRows: FixedExpenseSubRow[];
  presetRows: PresetRow[];
  selectedTabId: string;
  stockDividends: StockDividendEntry[];
  stockPrices: StockPriceEntry[];
  stockRows: StockRow[];
  stockTransactions: StockTransactionEntry[];
  tabs: WorkbookTab[];
  transactions: Record<string, TransactionEntry[]>;
}

interface PersistedWorkbookState {
  activeYear: number;
  workbookYears: number[];
  yearStates: Record<number, WorkbookYearState>;
}

export function WorkbookApp({ accountControls }: { accountControls?: ReactNode }) {
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
  const [transactionLinkedTabId, setTransactionLinkedTabId] = useState("");
  const [transactionDescription, setTransactionDescription] = useState("");
  const [transactionAmount, setTransactionAmount] = useState("");
  const [editingTransactionId, setEditingTransactionId] = useState<string | null>(
    null
  );
  const [editingTransactionDescription, setEditingTransactionDescription] =
    useState("");
  const [editingTransactionAmount, setEditingTransactionAmount] = useState("");
  const [activeYear, setActiveYear] = useState(DEFAULT_WORKBOOK_YEAR);
  const [workbookYears, setWorkbookYears] = useState([DEFAULT_WORKBOOK_YEAR]);
  const [yearStates, setYearStates] = useState<
    Record<number, WorkbookYearState>
  >({});
  const [loadStatus, setLoadStatus] = useState<"loading" | "loaded" | "failed">(
    "loading"
  );
  const [persistenceError, setPersistenceError] = useState("");
  const revisionRef = useRef(0);
  const saveQueueRef = useRef<Promise<void>>(Promise.resolve());
  const [selectedTabId, setSelectedTabId] = useState("summary");
  const [isAddingTab, setIsAddingTab] = useState(false);
  const [isRenamingTab, setIsRenamingTab] = useState(false);
  const [tabName, setTabName] = useState("");
  const [renameTabName, setRenameTabName] = useState("");
  const [category, setCategory] = useState<UserTabCategory>("Bank");
  const tabGroups = useMemo(() => getWorkbookTabGroups(tabs), [tabs]);
  const selectedTab =
    tabs.find((tab) => tab.id === selectedTabId) ?? tabs[0];
  const linkableTabs = tabs.filter(
    (tab) => tab.kind === "normal" || tab.kind === "credit-card"
  );
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

  function getCurrentWorkbookYearState(): WorkbookYearState {
    return {
      cellValues,
      fixedExpenseRows,
      fixedExpenseSubRows,
      presetRows,
      selectedTabId,
      stockDividends,
      stockPrices,
      stockRows,
      stockTransactions,
      tabs,
      transactions
    };
  }

  function loadWorkbookYearState(yearState?: WorkbookYearState) {
    const nextState = yearState ?? createEmptyWorkbookYearState();

    setTabs(nextState.tabs);
    setFixedExpenseRows(nextState.fixedExpenseRows);
    setFixedExpenseSubRows(nextState.fixedExpenseSubRows);
    setPresetRows(nextState.presetRows);
    setStockRows(nextState.stockRows);
    setStockTransactions(nextState.stockTransactions);
    setStockPrices(nextState.stockPrices);
    setStockDividends(nextState.stockDividends);
    setCellValues(nextState.cellValues);
    setTransactions(nextState.transactions);
    setSelectedTabId(nextState.selectedTabId);
    setTransactionCell(null);
    setTransactionLinkedTabId("");
    setTransactionDescription("");
    setTransactionAmount("");
    cancelTransactionEdit();
    setIsAddingTab(false);
    setIsRenamingTab(false);
    setTabName("");
    setRenameTabName("");
    setCategory("Bank");
  }

  useEffect(() => {
    let didCancel = false;

    async function loadPersistedWorkbookState() {
      try {
        const response = await fetch("/api/workbook-state", {
          cache: "no-store"
        });

        if (!response.ok) {
          throw new Error("Unable to load saved workbook state.");
        }

        const result = (await response.json()) as {
          data: PersistedWorkbookState | null;
          revision: number;
        };

        if (didCancel) {
          return;
        }

        revisionRef.current = result.revision;

        if (result.data) {
          const nextActiveYear = result.data.activeYear;
          const nextYearStates = result.data.yearStates ?? {};
          const nextWorkbookYears =
            result.data.workbookYears?.length > 0
              ? result.data.workbookYears
              : [nextActiveYear];

          if (!nextYearStates[nextActiveYear]) {
            throw new Error("The saved workbook does not contain its active year.");
          }

          setActiveYear(nextActiveYear);
          setWorkbookYears(nextWorkbookYears);
          setYearStates(nextYearStates);
          loadWorkbookYearState(nextYearStates[nextActiveYear]);
        }

        setPersistenceError("");
        setLoadStatus("loaded");
      } catch (error) {
        console.error(error);
        if (!didCancel) {
          setPersistenceError(
            "Saved data could not be loaded. Autosave is disabled to protect the database."
          );
          setLoadStatus("failed");
        }
      }
    }

    void loadPersistedWorkbookState();

    return () => {
      didCancel = true;
    };
  }, []);

  useEffect(() => {
    if (loadStatus !== "loaded") {
      return;
    }

    const saveTimeout = window.setTimeout(() => {
      const nextYearStates = syncCarryForwardAcrossYears({
        ...yearStates,
        [activeYear]: getCurrentWorkbookYearState()
      }, workbookYears);
      const payload: PersistedWorkbookState = {
        activeYear,
        workbookYears,
        yearStates: nextYearStates
      };

      saveQueueRef.current = saveQueueRef.current.then(async () => {
        const response = await fetch("/api/workbook-state", {
          body: JSON.stringify({
            data: payload,
            expectedRevision: revisionRef.current
          }),
          headers: {
            "Content-Type": "application/json"
          },
          method: "PUT"
        });
        const result = (await response.json()) as {
          error?: string;
          revision?: number;
        };

        if (!response.ok || typeof result.revision !== "number") {
          throw new Error(result.error ?? "Unable to save workbook state.");
        }

        revisionRef.current = result.revision;
        setPersistenceError("");
      }).catch((error) => {
        console.error(error);
        setPersistenceError(
          error instanceof Error ? error.message : "Unable to save workbook state."
        );
      });
    }, 600);

    return () => window.clearTimeout(saveTimeout);
  }, [
    activeYear,
    cellValues,
    fixedExpenseRows,
    fixedExpenseSubRows,
    loadStatus,
    presetRows,
    selectedTabId,
    stockDividends,
    stockPrices,
    stockRows,
    stockTransactions,
    tabs,
    transactions,
    workbookYears,
    yearStates
  ]);

  function switchWorkbookYear(year: number) {
    if (year === activeYear) {
      return;
    }

    const currentState = getCurrentWorkbookYearState();
    const nextYearStates = syncCarryForwardAcrossYears({
      ...yearStates,
      [activeYear]: currentState
    }, workbookYears);
    const nextYearState = nextYearStates[year];

    setYearStates(nextYearStates);
    setActiveYear(year);
    loadWorkbookYearState(nextYearState);
  }

  function createNextWorkbookYear() {
    const nextYear = Math.max(...workbookYears) + 1;
    const currentState = getCurrentWorkbookYearState();
    const nextWorkbookYears = workbookYears.includes(nextYear)
      ? workbookYears
      : [...workbookYears, nextYear].sort((first, second) => first - second);
    const nextYearStates = syncCarryForwardAcrossYears({
      ...yearStates,
      [activeYear]: currentState,
      [nextYear]: yearStates[nextYear] ?? createEmptyWorkbookYearState()
    }, nextWorkbookYears);

    setYearStates(nextYearStates);
    setWorkbookYears(nextWorkbookYears);
    setActiveYear(nextYear);
    loadWorkbookYearState(nextYearStates[nextYear]);
  }

  function deleteEmptyWorkbooks() {
    const currentState = getCurrentWorkbookYearState();
    const currentYearStates = {
      ...yearStates,
      [activeYear]: currentState
    };
    const emptyYears = workbookYears.filter((year) =>
      isWorkbookYearStateEmpty(
        currentYearStates[year] ?? createEmptyWorkbookYearState()
      )
    );
    const nextWorkbookYears = workbookYears.filter(
      (year) => !emptyYears.includes(year)
    );

    if (emptyYears.length === 0) {
      window.alert("There are no empty workbooks to delete.");
      return;
    }

    if (nextWorkbookYears.length === 0) {
      window.alert("At least one workbook must remain.");
      return;
    }

    const shouldDelete = window.confirm(
      `Delete ${emptyYears.length} empty workbook${
        emptyYears.length === 1 ? "" : "s"
      }: ${emptyYears.join(", ")}?`
    );

    if (!shouldDelete) {
      return;
    }

    const nextYearStates = Object.fromEntries(
      Object.entries(currentYearStates).filter(([year]) =>
        nextWorkbookYears.includes(Number(year))
      )
    ) as Record<number, WorkbookYearState>;
    const nextActiveYear = nextWorkbookYears.includes(activeYear)
      ? activeYear
      : nextWorkbookYears[0];

    setWorkbookYears(nextWorkbookYears);
    setYearStates(nextYearStates);

    if (nextActiveYear !== activeYear) {
      setActiveYear(nextActiveYear);
      loadWorkbookYearState(nextYearStates[nextActiveYear]);
    }
  }

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
      setTransactionLinkedTabId("");
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
    const linkedTab = tabs.find((tab) => tab.id === linkedTabId);
    const shouldCreateLinkedPreset = linkedTab?.kind === "normal";
    const linkedPresetId = shouldCreateLinkedPreset
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

  function updateStockTransaction(input: StockTransactionEntry) {
    setStockTransactions((currentRows) =>
      currentRows.map((row) => (row.id === input.id ? input : row))
    );
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

  function updateStockPrice(input: StockPriceEntry) {
    setStockPrices((currentRows) =>
      currentRows.map((row) => (row.id === input.id ? input : row))
    );
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
      syncLinkedPresetCellValue(nextValues, input, presetRows);

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
        syncLinkedPresetCellValue(
          nextValues,
          {
            ...input,
            columnIndex: nextColumnIndex
          },
          presetRows
        );
      }

      return nextValues;
    });
  }

  function cellKey(input: TransactionCell) {
    return `${input.tableId}:${input.rowIndex}:${input.columnIndex}`;
  }

  function openTransactionCell(input: TransactionCell) {
    setTransactionCell(input);
    setTransactionLinkedTabId("");
    setTransactionDescription("");
    setTransactionAmount("");
    cancelTransactionEdit();
  }

  function closeTransactionCell() {
    setTransactionCell(null);
    setTransactionLinkedTabId("");
    setTransactionDescription("");
    setTransactionAmount("");
    cancelTransactionEdit();
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

  function updateTransactionCellTotals(
    cellTransactions: Record<string, TransactionEntry[]>
  ) {
    setCellValues((currentValues) => {
      const nextValues = { ...currentValues };

      Object.entries(cellTransactions).forEach(([key, rows]) => {
        const total = rows.reduce(
          (sum, row) => sum + Number(row.amount.replace(/,/g, "")),
          0
        );

        nextValues[key] = rows.length > 0 ? formatAmountTotal(total) : "";
      });

      return nextValues;
    });
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
    const linkedCell =
      findCrossTabTransactionCell(
        transactionCell,
        transactionLinkedTabId,
        presetRows,
        tabs
      ) ?? findLinkedPresetCell(transactionCell, presetRows);
    const linkedKey = linkedCell
      ? createCellKey(
          linkedCell.tableId,
          linkedCell.rowIndex,
          transactionCell.columnIndex
        )
      : null;
    const transactionId = `${key}:${Date.now()}`;
    const linkedTransactionId = linkedKey
      ? `${linkedKey}:${Date.now()}`
      : undefined;
    const nextTransaction: TransactionEntry = {
      amount: cleanAmount,
      description: cleanDescription,
      id: transactionId,
      linkedTransactionId
    };
    const nextLinkedTransaction: TransactionEntry | null =
      linkedKey && linkedTransactionId
        ? {
            amount: cleanAmount,
            description: cleanDescription,
            id: linkedTransactionId,
            linkedTransactionId: transactionId
          }
        : null;

    setTransactions((currentTransactions) => {
      const nextRows = [...(currentTransactions[key] ?? []), nextTransaction];
      const nextTransactions = {
        ...currentTransactions,
        [key]: nextRows
      };
      const nextCellTransactions: Record<string, TransactionEntry[]> = {
        [key]: nextRows
      };

      if (linkedKey && nextLinkedTransaction) {
        const nextLinkedRows = [
          ...(currentTransactions[linkedKey] ?? []),
          nextLinkedTransaction
        ];

        nextTransactions[linkedKey] = nextLinkedRows;
        nextCellTransactions[linkedKey] = nextLinkedRows;
      }

      updateTransactionCellTotals(nextCellTransactions);

      return nextTransactions;
    });

    setTransactionDescription("");
    setTransactionAmount("");
    setTransactionLinkedTabId("");
  }

  function startTransactionEdit(row: TransactionEntry) {
    setEditingTransactionId(row.id);
    setEditingTransactionDescription(row.description);
    setEditingTransactionAmount(row.amount);
  }

  function cancelTransactionEdit() {
    setEditingTransactionId(null);
    setEditingTransactionDescription("");
    setEditingTransactionAmount("");
  }

  function saveTransactionEdit() {
    if (!transactionCell || !editingTransactionId) {
      return;
    }

    const cleanDescription = editingTransactionDescription.trim();
    const cleanAmount = formatAmount(editingTransactionAmount);

    if (!cleanDescription || !cleanAmount) {
      return;
    }

    const key = cellKey(transactionCell);

    setTransactions((currentTransactions) => {
      const currentRows = currentTransactions[key] ?? [];
      const editedRow = currentRows.find((row) => row.id === editingTransactionId);
      const nextRows = currentRows.map((row) =>
        row.id === editingTransactionId
          ? {
              ...row,
              amount: cleanAmount,
              description: cleanDescription
            }
          : row
      );
      const nextTransactions = {
        ...currentTransactions,
        [key]: nextRows
      };
      const nextCellTransactions: Record<string, TransactionEntry[]> = {
        [key]: nextRows
      };
      const linkedKey = editedRow?.linkedTransactionId
        ? findTransactionKeyById(
            currentTransactions,
            editedRow.linkedTransactionId
          )
        : null;

      if (linkedKey && editedRow?.linkedTransactionId) {
        const nextLinkedRows = (currentTransactions[linkedKey] ?? []).map(
          (row) =>
            row.id === editedRow.linkedTransactionId
              ? {
                  ...row,
                  amount: cleanAmount,
                  description: cleanDescription
                }
              : row
        );

        nextTransactions[linkedKey] = nextLinkedRows;
        nextCellTransactions[linkedKey] = nextLinkedRows;
      }

      updateTransactionCellTotals(nextCellTransactions);

      return nextTransactions;
    });
    cancelTransactionEdit();
  }

  const linkedTransactionCell = transactionCell
    ? findLinkedPresetCell(transactionCell, presetRows)
    : null;
  const linkedTransactionTabName = linkedTransactionCell
    ? getTabNameFromTableId(linkedTransactionCell.tableId, tabs)
    : null;
  const transactionTargetTabs = transactionCell
    ? getAvailableTransactionTargetTabs(transactionCell, tabs, presetRows)
    : [];

  return (
    <main className="min-h-screen bg-slate-100 text-slate-950">
      {loadStatus === "loading" ? (
        <div className="border-b border-blue-300 bg-blue-50 px-4 py-2 text-sm text-blue-900">
          Loading saved workbook. Autosave remains disabled until loading succeeds.
        </div>
      ) : null}
      {persistenceError ? (
        <div
          className="border-b border-red-300 bg-red-50 px-4 py-2 text-sm font-medium text-red-900"
          role="alert"
        >
          {persistenceError} Your current screen will not overwrite saved data.
        </div>
      ) : null}
      <div className="grid min-h-screen lg:grid-cols-[280px_1fr]">
        <aside className="border-r border-slate-300 bg-white">
          <div className="border-b border-slate-300 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              My Finance
            </p>
            <h1 className="mt-1 text-xl font-semibold">
              {activeYear} Workbook
            </h1>
            {accountControls ? (
              <div className="mt-2 text-xs text-slate-600">{accountControls}</div>
            ) : null}
          </div>

          <nav className="p-3">
            <div className="mb-4">
              <p className="mb-1 px-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Years
              </p>
              <div className="grid gap-1">
                {workbookYears.map((year) => (
                  <button
                    className={`w-full px-2 py-1.5 text-left text-sm ${
                      year === activeYear
                        ? "border border-slate-300 bg-slate-950 font-medium text-white"
                        : "text-slate-700 hover:bg-slate-100"
                    }`}
                    key={year}
                    onClick={() => switchWorkbookYear(year)}
                  >
                    {year}
                  </button>
                ))}
              </div>
            </div>

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
              <button
                className="border border-slate-300 bg-white px-3 py-2 text-sm"
                onClick={createNextWorkbookYear}
              >
                Create Year
              </button>
              <button
                className="border border-slate-300 bg-white px-3 py-2 text-sm"
                onClick={deleteEmptyWorkbooks}
              >
                Delete Empty Years
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
                onTransactionCellOpen={openTransactionCell}
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
                onUpdateStockPrice={updateStockPrice}
                onUpdateStockTransaction={updateStockTransaction}
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
                onTransactionCellOpen={openTransactionCell}
                linkableTabs={linkableTabs}
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
                  {linkedTransactionTabName ? (
                    <p className="mt-1 text-xs font-medium text-teal-700">
                      Also records in {linkedTransactionTabName}
                    </p>
                  ) : null}
                </div>
                <button
                  className="border border-slate-300 px-2 py-1 text-sm"
                  onClick={closeTransactionCell}
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
                {transactionTargetTabs.length > 0 ? (
                  <select
                    className="border border-slate-300 px-3 py-2 text-sm"
                    onChange={(event) =>
                      setTransactionLinkedTabId(event.target.value)
                    }
                    value={transactionLinkedTabId}
                  >
                    <option value="">Record only here</option>
                    {transactionTargetTabs.map((tab) => (
                      <option key={tab.id} value={tab.id}>
                        Also record in {tab.name}
                      </option>
                    ))}
                  </select>
                ) : null}
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
                      <th className="border border-slate-200 px-2 py-2 text-left">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {(transactions[cellKey(transactionCell)] ?? []).map((row) => (
                      <tr key={row.id}>
                        <td className="border border-slate-200 px-2 py-2">
                          {editingTransactionId === row.id ? (
                            <input
                              className="w-full border border-slate-300 px-2 py-1"
                              onChange={(event) =>
                                setEditingTransactionDescription(
                                  event.target.value
                                )
                              }
                              value={editingTransactionDescription}
                            />
                          ) : (
                            row.description
                          )}
                        </td>
                        <td className="border border-slate-200 px-2 py-2 text-right tabular-nums">
                          {editingTransactionId === row.id ? (
                            <input
                              className="w-full border border-slate-300 px-2 py-1 text-right"
                              inputMode="decimal"
                              onChange={(event) =>
                                setEditingTransactionAmount(event.target.value)
                              }
                              value={editingTransactionAmount}
                            />
                          ) : (
                            row.amount
                          )}
                        </td>
                        <td className="border border-slate-200 px-2 py-2">
                          {editingTransactionId === row.id ? (
                            <div className="flex gap-2">
                              <button
                                className="border border-slate-950 bg-slate-950 px-2 py-1 text-xs text-white"
                                onClick={saveTransactionEdit}
                              >
                                Save
                              </button>
                              <button
                                className="border border-slate-300 px-2 py-1 text-xs"
                                onClick={cancelTransactionEdit}
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              className="border border-slate-300 px-2 py-1 text-xs"
                              onClick={() => startTransactionEdit(row)}
                            >
                              Edit
                            </button>
                          )}
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

function syncLinkedPresetCellValue(
  values: CellValueMap,
  input: {
    columnIndex: number;
    rowIndex: number;
    tableId: string;
    value: string;
  },
  presetRows: PresetRow[]
) {
  const linkedCell = findLinkedPresetCell(input, presetRows);

  if (!linkedCell) {
    return;
  }

  values[
    createCellKey(
      linkedCell.tableId,
      linkedCell.rowIndex,
      input.columnIndex
    )
  ] = input.value;
}

function findLinkedPresetCell(
  input: {
    rowIndex: number;
    tableId: string;
  },
  presetRows: PresetRow[]
) {
  const tableType = getNormalTableType(input.tableId);

  if (!tableType) {
    return null;
  }

  const tabId = input.tableId.slice(0, -`:${tableType}`.length);
  const tableRows = presetRows.filter(
    (row) => row.tabId === tabId && row.tableType === tableType
  );
  const presetRow = tableRows[input.rowIndex];

  if (!presetRow?.linkedPresetRowId) {
    return null;
  }

  const linkedPresetRow = presetRows.find(
    (row) => row.id === presetRow.linkedPresetRowId
  );

  if (!linkedPresetRow || linkedPresetRow.tabId === tabId) {
    return null;
  }

  const linkedTableRows = presetRows.filter(
    (row) =>
      row.tabId === linkedPresetRow.tabId &&
      row.tableType === linkedPresetRow.tableType
  );
  const linkedRowIndex = linkedTableRows.findIndex(
    (row) => row.id === linkedPresetRow.id
  );

  if (linkedRowIndex < 0) {
    return null;
  }

  return {
    rowIndex: linkedRowIndex,
    tableId: `${linkedPresetRow.tabId}:${linkedPresetRow.tableType}`
  };
}

function getNormalTableType(tableId: string): NormalTableType | null {
  if (tableId.endsWith(":debit")) {
    return "debit";
  }

  if (tableId.endsWith(":credit")) {
    return "credit";
  }

  return null;
}

function getTabNameFromTableId(tableId: string, tabs: WorkbookTab[]) {
  const tableType = getNormalTableType(tableId);

  if (!tableType) {
    return null;
  }

  const tabId = tableId.slice(0, -`:${tableType}`.length);

  return tabs.find((tab) => tab.id === tabId)?.name ?? null;
}

function findCrossTabTransactionCell(
  input: TransactionCell,
  linkedTabId: string,
  presetRows: PresetRow[],
  tabs: WorkbookTab[]
) {
  if (!linkedTabId) {
    return null;
  }

  const creditCardTabId = getCreditCardVariableTabId(input.tableId);

  if (creditCardTabId) {
    const linkedTab = tabs.find((tab) => tab.id === linkedTabId);

    if (
      linkedTab?.kind !== "normal" ||
      linkedTab.category !== "Wallets" ||
      input.rowIndex < 0 ||
      input.rowIndex >= DAY_ROW_COUNT
    ) {
      return null;
    }

    const targetPresetCount = getPresetRowsForTable(
      presetRows,
      linkedTabId,
      "debit"
    ).length;

    return {
      rowIndex: targetPresetCount + input.rowIndex,
      tableId: `${linkedTabId}:debit`
    };
  }

  const sourceTableType = getNormalTableType(input.tableId);
  const sourceTabId = getNormalTableTabId(input.tableId);

  if (!sourceTableType || !sourceTabId || sourceTabId === linkedTabId) {
    return null;
  }

  const sourcePresetCount = getPresetRowsForTable(
    presetRows,
    sourceTabId,
    sourceTableType
  ).length;
  const dayRowOffset = input.rowIndex - sourcePresetCount;

  if (dayRowOffset < 0 || dayRowOffset >= DAY_ROW_COUNT) {
    return null;
  }

  const targetTableType =
    sourceTableType === "debit" ? "credit" : "debit";
  const targetPresetCount = getPresetRowsForTable(
    presetRows,
    linkedTabId,
    targetTableType
  ).length;

  return {
    rowIndex: targetPresetCount + dayRowOffset,
    tableId: `${linkedTabId}:${targetTableType}`
  };
}

function getAvailableTransactionTargetTabs(
  input: TransactionCell,
  tabs: WorkbookTab[],
  presetRows: PresetRow[]
) {
  const creditCardTabId = getCreditCardVariableTabId(input.tableId);

  if (creditCardTabId) {
    if (input.rowIndex < 0 || input.rowIndex >= DAY_ROW_COUNT) {
      return [];
    }

    return tabs.filter(
      (tab) => tab.kind === "normal" && tab.category === "Wallets"
    );
  }

  const sourceTableType = getNormalTableType(input.tableId);
  const sourceTabId = getNormalTableTabId(input.tableId);

  if (!sourceTableType || !sourceTabId) {
    return [];
  }

  const sourcePresetCount = getPresetRowsForTable(
    presetRows,
    sourceTabId,
    sourceTableType
  ).length;
  const dayRowOffset = input.rowIndex - sourcePresetCount;

  if (dayRowOffset < 0 || dayRowOffset >= DAY_ROW_COUNT) {
    return [];
  }

  return tabs.filter(
    (tab) => tab.kind === "normal" && tab.id !== sourceTabId
  );
}

function getCreditCardVariableTabId(tableId: string) {
  if (!tableId.endsWith(":variable-expenses")) {
    return null;
  }

  return tableId.slice(0, -":variable-expenses".length);
}

function getNormalTableTabId(tableId: string) {
  const tableType = getNormalTableType(tableId);

  if (!tableType) {
    return null;
  }

  return tableId.slice(0, -`:${tableType}`.length);
}

function getPresetRowsForTable(
  presetRows: PresetRow[],
  tabId: string,
  tableType: NormalTableType
) {
  return presetRows.filter(
    (row) => row.tabId === tabId && row.tableType === tableType
  );
}

function findTransactionKeyById(
  transactions: Record<string, TransactionEntry[]>,
  transactionId: string
) {
  return (
    Object.entries(transactions).find(([, rows]) =>
      rows.some((row) => row.id === transactionId)
    )?.[0] ?? null
  );
}

function syncCarryForwardAcrossYears(
  yearStates: Record<number, WorkbookYearState>,
  workbookYears: number[]
) {
  const sortedYears = [...workbookYears].sort((first, second) => first - second);
  const nextYearStates: Record<number, WorkbookYearState> = { ...yearStates };

  sortedYears.forEach((year, index) => {
    if (index === 0) {
      nextYearStates[year] =
        nextYearStates[year] ?? createEmptyWorkbookYearState();
      return;
    }

    const previousYear = sortedYears[index - 1];
    const previousState =
      nextYearStates[previousYear] ?? createEmptyWorkbookYearState();
    const currentState = nextYearStates[year] ?? createEmptyWorkbookYearState();

    nextYearStates[year] = applyCarryForwardToYear(
      previousState,
      currentState
    );
  });

  return nextYearStates;
}

function applyCarryForwardToYear(
  previousState: WorkbookYearState,
  targetState: WorkbookYearState
): WorkbookYearState {
  const previousDisplayValues = buildDisplayCellValues({
    cellValues: previousState.cellValues,
    fixedExpenseRows: previousState.fixedExpenseRows,
    fixedExpenseSubRows: previousState.fixedExpenseSubRows,
    presetRows: previousState.presetRows,
    stockPrices: previousState.stockPrices,
    stockRows: previousState.stockRows,
    stockTransactions: previousState.stockTransactions,
    tabs: previousState.tabs
  });
  const nextTabs = mergeRowsById(targetState.tabs, previousState.tabs);
  const nextCellValues = { ...targetState.cellValues };
  const nextStockTransactions = carryForwardInvestmentTransactions(
    previousState,
    targetState.stockTransactions
  );
  const nextStockPrices = carryForwardInvestmentPrices(
    previousState,
    targetState.stockPrices
  );

  previousState.tabs.forEach((tab) => {
    if (tab.kind === "normal") {
      const closingBalance = parseAmount(
        previousDisplayValues[
          createCellKey(`${tab.id}:overview`, 3, LAST_AMOUNT_COLUMN)
        ]
      );

      nextCellValues[
        createCellKey(`${tab.id}:overview`, 0, FIRST_AMOUNT_COLUMN)
      ] = formatAmountTotal(closingBalance);
    }

    if (tab.kind === "credit-card") {
      const closingCarriedForward = parseAmount(
        previousDisplayValues[
          createCellKey(
            `${tab.id}:credit-card-summary`,
            6,
            LAST_AMOUNT_COLUMN
          )
        ]
      );

      nextCellValues[
        createCellKey(
          `${tab.id}:credit-card-summary`,
          2,
          FIRST_AMOUNT_COLUMN
        )
      ] = formatAmountTotal(closingCarriedForward);
    }
  });

  return {
    ...targetState,
    cellValues: nextCellValues,
    fixedExpenseRows: mergeRowsById(
      targetState.fixedExpenseRows,
      previousState.fixedExpenseRows
    ),
    fixedExpenseSubRows: mergeRowsById(
      targetState.fixedExpenseSubRows,
      previousState.fixedExpenseSubRows
    ),
    presetRows: mergeRowsById(targetState.presetRows, previousState.presetRows),
    stockPrices: nextStockPrices,
    stockRows: mergeRowsById(targetState.stockRows, previousState.stockRows),
    stockTransactions: nextStockTransactions,
    tabs: nextTabs
  };
}

function carryForwardInvestmentTransactions(
  previousState: WorkbookYearState,
  targetTransactions: StockTransactionEntry[]
) {
  let nextTransactions = [...targetTransactions];

  previousState.stockRows.forEach((stock) => {
    const stockTab = previousState.tabs.find((tab) => tab.id === stock.tabId);
    const isManagedFund = stockTab?.category === "Managed Funds";
    const stockTransactions = previousState.stockTransactions.filter(
      (entry) => entry.stockId === stock.id && entry.columnIndex <= LAST_MONTH_COLUMN
    );
    const quantity = stockTransactions.reduce(
      (sum, entry) => sum + parseAmount(entry.quantity),
      0
    );
    const totalCost = stockTransactions.reduce(
      (sum, entry) => sum + parseAmount(entry.quantity) * parseAmount(entry.price),
      0
    );
    const averagePrice = quantity ? totalCost / quantity : 0;
    const carryForwardId = createCarryForwardStockTransactionId(stock.id);

    nextTransactions = nextTransactions.filter(
      (entry) => entry.id !== carryForwardId
    );

    if (isManagedFund ? !totalCost : !quantity) {
      return;
    }

    nextTransactions = [
      ...nextTransactions,
      {
        columnIndex: FIRST_AMOUNT_COLUMN,
        date: "",
        id: carryForwardId,
        price: formatAmountTotal(isManagedFund ? totalCost : averagePrice),
        quantity: formatAmountTotal(isManagedFund ? 1 : quantity),
        stockId: stock.id
      }
    ];
  });

  return nextTransactions;
}

function carryForwardInvestmentPrices(
  previousState: WorkbookYearState,
  targetPrices: StockPriceEntry[]
) {
  let nextPrices = [...targetPrices];

  previousState.stockRows.forEach((stock) => {
    const latestMarketPrice = previousState.stockPrices
      .filter(
        (entry) =>
          entry.stockId === stock.id && entry.columnIndex <= LAST_MONTH_COLUMN
      )
      .sort((first, second) => first.columnIndex - second.columnIndex)
      .at(-1)?.price;
    const latestPurchasePrice = previousState.stockTransactions
      .filter(
        (entry) =>
          entry.stockId === stock.id && entry.columnIndex <= LAST_MONTH_COLUMN
      )
      .sort((first, second) => first.columnIndex - second.columnIndex)
      .at(-1)?.price;
    const price = latestMarketPrice ?? latestPurchasePrice;
    const carryForwardId = createCarryForwardStockPriceId(stock.id);

    nextPrices = nextPrices.filter((entry) => entry.id !== carryForwardId);

    if (!price) {
      return;
    }

    nextPrices = [
      ...nextPrices,
      {
        columnIndex: FIRST_AMOUNT_COLUMN,
        id: carryForwardId,
        price,
        stockId: stock.id
      }
    ];
  });

  return nextPrices;
}

function createCarryForwardStockTransactionId(stockId: string) {
  return `${stockId}:carry-forward-opening`;
}

function createCarryForwardStockPriceId(stockId: string) {
  return `${stockId}:carry-forward-price`;
}

function mergeRowsById<T extends { id: string }>(targetRows: T[], sourceRows: T[]) {
  const rowMap = new Map(targetRows.map((row) => [row.id, row]));

  sourceRows.forEach((sourceRow) => {
    rowMap.set(sourceRow.id, {
      ...rowMap.get(sourceRow.id),
      ...sourceRow
    });
  });

  return Array.from(rowMap.values());
}

function createEmptyWorkbookYearState(): WorkbookYearState {
  return {
    cellValues: {},
    fixedExpenseRows: [],
    fixedExpenseSubRows: [],
    presetRows: [],
    selectedTabId: "summary",
    stockDividends: [],
    stockPrices: [],
    stockRows: [],
    stockTransactions: [],
    tabs: workbookTabs,
    transactions: {}
  };
}

function isWorkbookYearStateEmpty(yearState: WorkbookYearState) {
  return (
    hasOnlySummaryTab(yearState.tabs) &&
    hasNoMeaningfulRecordValues(yearState.cellValues) &&
    yearState.fixedExpenseRows.length === 0 &&
    yearState.fixedExpenseSubRows.length === 0 &&
    yearState.presetRows.length === 0 &&
    yearState.stockDividends.length === 0 &&
    yearState.stockPrices.length === 0 &&
    yearState.stockRows.length === 0 &&
    yearState.stockTransactions.length === 0 &&
    hasNoTransactionRows(yearState.transactions)
  );
}

function hasOnlySummaryTab(tabs: WorkbookTab[]) {
  return (
    tabs.length === 1 &&
    tabs[0]?.id === "summary" &&
    tabs[0]?.kind === "summary"
  );
}

function hasNoMeaningfulRecordValues(record: Record<string, string>) {
  return Object.values(record).every((value) => value.trim() === "");
}

function hasNoTransactionRows(
  transactions: Record<string, TransactionEntry[]>
) {
  return Object.values(transactions).every((rows) => rows.length === 0);
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

  syncLinkedNormalPresetValues(displayValues, presetRows);

  tabs
    .filter((tab) => tab.kind === "normal")
    .forEach((tab) => {
      calculateNormalTabValues(tab, presetRows, displayValues, tabs);
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
      let columnIndex = FIRST_MONTH_COLUMN;
      columnIndex <= LAST_MONTH_COLUMN;
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

    subRows.forEach((_, rowIndex) => {
      setAnnualTotal(displayValues, subTableId, rowIndex);
    });
    setAnnualTotal(displayValues, subTableId, subTotalRowIndex);
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
      let columnIndex = FIRST_MONTH_COLUMN;
      columnIndex <= LAST_MONTH_COLUMN;
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

    tabRows.forEach((_, rowIndex) => {
      setAnnualTotal(displayValues, fixedExpensesTableId, rowIndex);
    });
    setAnnualTotal(
      displayValues,
      fixedExpensesTableId,
      fixedExpensesTotalRowIndex
    );
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

function syncLinkedNormalPresetValues(
  displayValues: CellValueMap,
  presetRows: PresetRow[]
) {
  const syncedPresetIds = new Set<string>();

  presetRows.forEach((presetRow) => {
    if (!presetRow.linkedPresetRowId || syncedPresetIds.has(presetRow.id)) {
      return;
    }

    const linkedPresetRow = presetRows.find(
      (row) => row.id === presetRow.linkedPresetRowId
    );

    if (!linkedPresetRow || linkedPresetRow.tabId === presetRow.tabId) {
      return;
    }

    const rowIndex = getPresetRowIndex(presetRows, presetRow);
    const linkedRowIndex = getPresetRowIndex(presetRows, linkedPresetRow);

    if (rowIndex < 0 || linkedRowIndex < 0) {
      return;
    }

    const tableId = `${presetRow.tabId}:${presetRow.tableType}`;
    const linkedTableId = `${linkedPresetRow.tabId}:${linkedPresetRow.tableType}`;

    for (
      let columnIndex = FIRST_AMOUNT_COLUMN;
      columnIndex <= LAST_AMOUNT_COLUMN;
      columnIndex += 1
    ) {
      const key = createCellKey(tableId, rowIndex, columnIndex);
      const linkedKey = createCellKey(
        linkedTableId,
        linkedRowIndex,
        columnIndex
      );
      const value = displayValues[key] || displayValues[linkedKey] || "";

      displayValues[key] = value;
      displayValues[linkedKey] = value;
    }

    syncedPresetIds.add(presetRow.id);
    syncedPresetIds.add(linkedPresetRow.id);
  });
}

function getPresetRowIndex(presetRows: PresetRow[], targetRow: PresetRow) {
  return presetRows
    .filter(
      (row) =>
        row.tabId === targetRow.tabId && row.tableType === targetRow.tableType
    )
    .findIndex((row) => row.id === targetRow.id);
}

function calculateNormalTabValues(
  tab: WorkbookTab,
  presetRows: PresetRow[],
  displayValues: CellValueMap,
  tabs: WorkbookTab[]
) {
  const debitPresetRows = presetRows.filter(
    (row) => row.tabId === tab.id && row.tableType === "debit"
  );
  const creditPresetRows = presetRows.filter(
    (row) => row.tabId === tab.id && row.tableType === "credit"
  );
  const debitPresetCount = debitPresetRows.length;
  const creditPresetCount = creditPresetRows.length;
  const debitTotalRowIndex = debitPresetCount + 31;
  const creditTotalRowIndex = creditPresetCount + 31;

  for (
    let columnIndex = FIRST_AMOUNT_COLUMN;
    columnIndex <= LAST_MONTH_COLUMN;
    columnIndex += 1
  ) {
    syncLinkedCreditCardStatementAmounts({
      columnIndex,
      displayValues,
      presetRows: creditPresetRows,
      tabs,
      tabId: tab.id
    });

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
    columnIndex <= LAST_MONTH_COLUMN;
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

  setClosingBalance(displayValues, `${tab.id}:overview`, 3);
  for (let rowIndex = 0; rowIndex < 3; rowIndex += 1) {
    displayValues[
      createCellKey(`${tab.id}:overview`, rowIndex, LAST_AMOUNT_COLUMN)
    ] = "";
  }
}

function syncLinkedCreditCardStatementAmounts({
  columnIndex,
  displayValues,
  presetRows,
  tabs,
  tabId
}: {
  columnIndex: number;
  displayValues: CellValueMap;
  presetRows: PresetRow[];
  tabs: WorkbookTab[];
  tabId: string;
}) {
  presetRows.forEach((presetRow, rowIndex) => {
    const linkedTab = tabs.find((tab) => tab.id === presetRow.linkedTabId);

    if (linkedTab?.kind !== "credit-card") {
      return;
    }

    displayValues[createCellKey(`${tabId}:credit`, rowIndex, columnIndex)] =
      displayValues[
        createCellKey(
          `${linkedTab.id}:credit-card-summary`,
          5,
          columnIndex - 1
        )
      ] ?? "";
  });
}

function calculateCreditCardTabValues(
  tab: WorkbookTab,
  displayValues: CellValueMap
) {
  const variableTotalRowIndex = 31;
  let previousCarriedForward = 0;

  for (
    let columnIndex = FIRST_AMOUNT_COLUMN;
    columnIndex <= LAST_MONTH_COLUMN;
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
    const openingBroughtForward = parseAmount(
      displayValues[
        createCellKey(`${tab.id}:credit-card-summary`, 2, FIRST_AMOUNT_COLUMN)
      ]
    );
    const broughtForward =
      columnIndex === FIRST_AMOUNT_COLUMN
        ? openingBroughtForward
        : previousCarriedForward;
    const rebate = parseAmount(
      displayValues[createCellKey(`${tab.id}:credit-card-summary`, 3, columnIndex)]
    );
    const statementAmount = parseAmount(
      displayValues[
        createCellKey(`${tab.id}:credit-card-summary`, 5, columnIndex)
      ]
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

  setClosingBalance(displayValues, `${tab.id}:credit-card-summary`, 6);
  for (let rowIndex = 0; rowIndex < 6; rowIndex += 1) {
    displayValues[
      createCellKey(
        `${tab.id}:credit-card-summary`,
        rowIndex,
        LAST_AMOUNT_COLUMN
      )
    ] = "";
  }
}

function setClosingBalance(
  displayValues: CellValueMap,
  tableId: string,
  rowIndex: number
) {
  let closingValue = "";

  for (
    let columnIndex = LAST_MONTH_COLUMN;
    columnIndex >= FIRST_AMOUNT_COLUMN;
    columnIndex -= 1
  ) {
    const value = displayValues[createCellKey(tableId, rowIndex, columnIndex)];

    if (value) {
      closingValue = value;
      break;
    }
  }

  displayValues[createCellKey(tableId, rowIndex, LAST_AMOUNT_COLUMN)] =
    closingValue;
}

function setAnnualTotal(
  displayValues: CellValueMap,
  tableId: string,
  rowIndex: number
) {
  let total = 0;
  let hasValue = false;

  for (
    let columnIndex = FIRST_MONTH_COLUMN;
    columnIndex <= LAST_MONTH_COLUMN;
    columnIndex += 1
  ) {
    const value = displayValues[createCellKey(tableId, rowIndex, columnIndex)];

    if (value) {
      hasValue = true;
      total += parseAmount(value);
    }
  }

  displayValues[createCellKey(tableId, rowIndex, LAST_AMOUNT_COLUMN)] = hasValue
    ? formatAmountTotal(total)
    : "";
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
  const balanceColumnIndex =
    summaryColumnIndex === 15 ? LAST_AMOUNT_COLUMN : workbookColumnIndex;

  if (tab.kind === "normal") {
    return parseAmount(
      displayValues[createCellKey(`${tab.id}:overview`, 3, balanceColumnIndex)]
    );
  }

  if (tab.kind === "credit-card") {
    return parseAmount(
      displayValues[
        createCellKey(`${tab.id}:credit-card-summary`, 6, balanceColumnIndex)
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
