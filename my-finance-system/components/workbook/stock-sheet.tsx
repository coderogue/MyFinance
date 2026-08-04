import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { dividendColumns, stockColumns } from "@/lib/workbook/sample-workbook";
import {
  CLOSING_COLUMN,
  DIVIDEND_TOTAL_COLUMN,
  formatNumber,
  getDividendValue,
  getManagedFundInvestedValue,
  getStockTransactionValue,
  getStockValuation,
  OPENING_COLUMN,
  parseNumber,
  sortStocks
} from "@/lib/workbook/stock-calculations";
import type {
  StockSortMode,
  StockSortState
} from "@/lib/workbook/stock-calculations";
import type {
  StockDividendEntry,
  StockPriceEntry,
  StockRow,
  StockTransactionEntry
} from "@/lib/workbook/types";
import type { TabCategory } from "@/lib/workbook/types";

type StockCell =
  | {
      columnIndex: number;
      mode: "price";
      stockId: string;
      stockName: string;
      title: string;
    }
  | {
      columnIndex: number;
      mode: "stock";
      stockId: string;
      stockName: string;
      title: string;
    }
  | {
      columnIndex: number;
      mode: "dividend";
      stockId: string;
      stockName: string;
      title: string;
    };

export function StockSheet({
  category,
  name,
  onAddDividend,
  onAddStockPrice,
  onAddStock,
  onAddStockTransaction,
  onUpdateStockPrice,
  onUpdateStockTransaction,
  stocks,
  stockDividends,
  stockPrices,
  stockTransactions,
  tabId
}: {
  category: TabCategory;
  name: string;
  onAddDividend: (input: Omit<StockDividendEntry, "id">) => void;
  onAddStockPrice: (input: Omit<StockPriceEntry, "id">) => void;
  onAddStock: (label: string) => void;
  onAddStockTransaction: (input: Omit<StockTransactionEntry, "id">) => void;
  onUpdateStockPrice: (input: StockPriceEntry) => void;
  onUpdateStockTransaction: (input: StockTransactionEntry) => void;
  stocks: StockRow[];
  stockDividends: StockDividendEntry[];
  stockPrices: StockPriceEntry[];
  stockTransactions: StockTransactionEntry[];
  tabId: string;
}) {
  const [stockName, setStockName] = useState("");
  const [activeCell, setActiveCell] = useState<StockCell | null>(null);
  const [transactionDate, setTransactionDate] = useState("");
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");
  const [dividendDate, setDividendDate] = useState("");
  const [dividendAmount, setDividendAmount] = useState("");
  const [editingTransactionId, setEditingTransactionId] = useState<string | null>(
    null
  );
  const [editingTransactionDate, setEditingTransactionDate] = useState("");
  const [editingQuantity, setEditingQuantity] = useState("");
  const [editingPrice, setEditingPrice] = useState("");
  const [editingPriceEntryId, setEditingPriceEntryId] = useState<string | null>(
    null
  );
  const [editingPriceValue, setEditingPriceValue] = useState("");
  const [sortState, setSortState] = useState<StockSortState>({
    columnIndex: 0,
    direction: "asc",
    mode: "summary"
  });
  const instrumentLabel = category === "Managed Funds" ? "Managed Fund" : "Stock";
  const isManagedFund = category === "Managed Funds";
  const dividendLabel = category === "Managed Funds" ? "Distribution" : "Dividend";
  const tabStocks = stocks.filter((stock) => stock.tabId === tabId);
  const tabStockIds = useMemo(
    () => new Set(tabStocks.map((stock) => stock.id)),
    [tabStocks]
  );
  const tabTransactions = stockTransactions.filter((entry) =>
    tabStockIds.has(entry.stockId)
  );
  const tabDividends = stockDividends.filter((entry) =>
    tabStockIds.has(entry.stockId)
  );
  const tabPrices = stockPrices.filter((entry) => tabStockIds.has(entry.stockId));

  useEffect(() => {
    const today = getLocalDateInputValue();
    setTransactionDate((currentDate) => currentDate || today);
    setDividendDate((currentDate) => currentDate || today);
  }, []);
  const previousStockTransactions = activeCell
    ? tabTransactions.filter(
        (entry) =>
          entry.stockId === activeCell.stockId &&
          entry.columnIndex === activeCell.columnIndex
      )
    : [];
  const previousPrices = activeCell
    ? tabPrices.filter(
        (entry) =>
          entry.stockId === activeCell.stockId &&
          entry.columnIndex === activeCell.columnIndex
      )
    : [];
  const previousDividends = activeCell
    ? tabDividends.filter(
        (entry) =>
          entry.stockId === activeCell.stockId &&
          entry.columnIndex === activeCell.columnIndex
      )
    : [];
  const sortedStocks = useMemo(
    () =>
      sortStocks({
        dividends: tabDividends,
        prices: tabPrices,
        sortState,
        stocks: tabStocks,
        transactions: tabTransactions,
        useInvestedValue: isManagedFund
      }),
    [isManagedFund, sortState, tabDividends, tabPrices, tabStocks, tabTransactions]
  );

  function addStock() {
    const cleanName = stockName.trim();

    if (!cleanName) {
      return;
    }

    onAddStock(cleanName);
    setStockName("");
  }

  function submitStockTransaction() {
    if (!activeCell || activeCell.mode !== "stock") {
      return;
    }

    const cleanQuantity = isManagedFund ? "1.00" : formatNumber(quantity);
    const cleanPrice = formatNumber(price);

    if (!cleanQuantity || !cleanPrice) {
      return;
    }

    onAddStockTransaction({
      columnIndex: activeCell.columnIndex,
      date:
        activeCell.columnIndex === OPENING_COLUMN
          ? ""
          : transactionDate.trim(),
      price: cleanPrice,
      quantity: cleanQuantity,
      stockId: activeCell.stockId
    });
    resetEntryForm();
  }

  function submitStockPrice() {
    if (!activeCell || activeCell.mode !== "price") {
      return;
    }

    const cleanPrice = formatNumber(price);

    if (!cleanPrice) {
      return;
    }

    onAddStockPrice({
      columnIndex: activeCell.columnIndex,
      price: cleanPrice,
      stockId: activeCell.stockId
    });
    resetEntryForm();
  }

  function submitDividend() {
    if (!activeCell || activeCell.mode !== "dividend") {
      return;
    }

    const cleanAmount = formatNumber(dividendAmount);

    if (!cleanAmount) {
      return;
    }

    onAddDividend({
      amount: cleanAmount,
      columnIndex: activeCell.columnIndex,
      date: dividendDate.trim(),
      stockId: activeCell.stockId
    });
    resetEntryForm();
  }

  function resetEntryForm() {
    const today = getLocalDateInputValue();
    setActiveCell(null);
    setTransactionDate(today);
    setQuantity("");
    setPrice("");
    setDividendDate(today);
    setDividendAmount("");
    cancelPriceEdit();
    cancelTransactionEdit();
  }

  function handleSort(mode: StockSortMode, columnIndex: number) {
    setSortState((currentSortState) => {
      const isSameSort =
        currentSortState.mode === mode &&
        currentSortState.columnIndex === columnIndex;

      return {
        columnIndex,
        direction:
          isSameSort && currentSortState.direction === "asc" ? "desc" : "asc",
        mode
      };
    });
  }

  function startPriceEdit(entry: StockPriceEntry) {
    setEditingPriceEntryId(entry.id);
    setEditingPriceValue(entry.price);
  }

  function cancelPriceEdit() {
    setEditingPriceEntryId(null);
    setEditingPriceValue("");
  }

  function savePriceEdit(entry: StockPriceEntry) {
    const cleanPrice = formatNumber(editingPriceValue);

    if (!cleanPrice) {
      return;
    }

    onUpdateStockPrice({
      ...entry,
      price: cleanPrice
    });
    cancelPriceEdit();
  }

  function startTransactionEdit(entry: StockTransactionEntry) {
    setEditingTransactionId(entry.id);
    setEditingTransactionDate(entry.date);
    setEditingQuantity(isManagedFund ? "1.00" : entry.quantity);
    setEditingPrice(
      isManagedFund
        ? formatNumber(
            String(parseNumber(entry.quantity) * parseNumber(entry.price))
          )
        : entry.price
    );
  }

  function cancelTransactionEdit() {
    setEditingTransactionId(null);
    setEditingTransactionDate("");
    setEditingQuantity("");
    setEditingPrice("");
  }

  function saveTransactionEdit(entry: StockTransactionEntry) {
    const cleanQuantity = isManagedFund ? "1.00" : formatNumber(editingQuantity);
    const cleanPrice = formatNumber(editingPrice);

    if (!cleanQuantity || !cleanPrice) {
      return;
    }

    onUpdateStockTransaction({
      ...entry,
      date:
        entry.columnIndex === OPENING_COLUMN ? "" : editingTransactionDate,
      price: cleanPrice,
      quantity: cleanQuantity
    });
    cancelTransactionEdit();
  }

  return (
    <div className="grid gap-5">
      <div>
        <h1 className="text-2xl font-semibold text-slate-950">{name}</h1>
        <p className="mt-1 text-sm text-slate-600">
          {instrumentLabel} tab: {isManagedFund ? "cumulative invested value" : "valuation"} summary, transactions, and{" "}
          {dividendLabel.toLowerCase()}s.
        </p>
      </div>

      <div className="grid gap-3 border border-slate-200 bg-white p-3 md:grid-cols-[1fr_auto]">
        <input
          className="border border-slate-300 px-3 py-2 text-sm"
          onChange={(event) => setStockName(event.target.value)}
          placeholder={`${instrumentLabel} name`}
          value={stockName}
        />
        <button
          className="border border-slate-950 bg-slate-950 px-3 py-2 text-sm text-white"
          onClick={addStock}
        >
          + Register {instrumentLabel}
        </button>
      </div>

      <StockGrid
        columns={stockColumns}
        getValue={(stock, columnIndex) =>
          isManagedFund
            ? getManagedFundInvestedValue(
                stock.id,
                columnIndex,
                tabTransactions
              )
            : getStockValuation(
                stock.id,
                columnIndex,
                tabTransactions,
                tabPrices
              )
        }
        lockedColumnIndex={CLOSING_COLUMN}
        onSort={(columnIndex) => handleSort("summary", columnIndex)}
        onCellClick={isManagedFund ? undefined : (stock, columnIndex) => {
          if (columnIndex === CLOSING_COLUMN) {
            return;
          }

          setActiveCell({
            columnIndex,
            mode: "price",
            stockId: stock.id,
            stockName: stock.label,
            title: `${stock.label} / ${stockColumns[columnIndex]} Current Price`
          });
        }}
        sortState={sortState.mode === "summary" ? sortState : undefined}
        stocks={sortedStocks}
        title={isManagedFund ? "Managed Fund Invested Value Summary" : "Stock Summary"}
        tone="slate"
      />

      <StockGrid
        columns={stockColumns}
        getValue={(stock, columnIndex) =>
          getStockTransactionValue(stock.id, columnIndex, tabTransactions)
        }
        lockedColumnIndex={CLOSING_COLUMN}
        onSort={(columnIndex) => handleSort("transactions", columnIndex)}
        onCellClick={(stock, columnIndex) => {
          if (columnIndex === CLOSING_COLUMN) {
            return;
          }

          setActiveCell({
            columnIndex,
            mode: "stock",
            stockId: stock.id,
            stockName: stock.label,
            title: `${stock.label} / ${stockColumns[columnIndex]}`
          });
        }}
        sortState={sortState.mode === "transactions" ? sortState : undefined}
        stocks={sortedStocks}
        title={`${instrumentLabel} Transactions`}
        tone="blue"
      />

      <StockGrid
        columns={dividendColumns}
        getValue={(stock, columnIndex) =>
          getDividendValue(stock.id, columnIndex, tabDividends)
        }
        lockedColumnIndex={DIVIDEND_TOTAL_COLUMN}
        onSort={(columnIndex) => handleSort("dividend", columnIndex)}
        onCellClick={(stock, columnIndex) => {
          if (columnIndex === DIVIDEND_TOTAL_COLUMN) {
            return;
          }

          setActiveCell({
            columnIndex,
            mode: "dividend",
            stockId: stock.id,
            stockName: stock.label,
            title: `${stock.label} / ${dividendColumns[columnIndex]} ${dividendLabel}`
          });
        }}
        sortState={sortState.mode === "dividend" ? sortState : undefined}
        stocks={sortedStocks}
        title={dividendLabel}
        tone="yellow"
      />

      {activeCell ? (
        <section className="fixed inset-y-0 right-0 z-10 w-full max-w-md border-l border-slate-300 bg-white p-4 shadow-xl">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold">
                {activeCell.mode === "price"
                  ? "Current Stock Price"
                  : activeCell.mode === "stock"
                    ? `${instrumentLabel} Transaction`
                    : `${dividendLabel} Entry`}
              </h2>
              <p className="mt-1 text-sm text-slate-600">{activeCell.title}</p>
            </div>
            <button
              className="border border-slate-300 px-2 py-1 text-sm"
              onClick={resetEntryForm}
            >
              Close
            </button>
          </div>

          {activeCell.mode === "price" ? (
            <div className="mt-4 grid gap-3">
              <input
                className="border border-slate-300 px-3 py-2 text-sm"
                inputMode="decimal"
                onChange={(event) => setPrice(event.target.value)}
                placeholder={`Current price per ${instrumentLabel.toLowerCase()}`}
                value={price}
              />
              <button
                className="border border-slate-950 bg-slate-950 px-3 py-2 text-sm text-white"
                onClick={submitStockPrice}
              >
                Update Current Price
              </button>
              <PreviousPriceEntries
                editingEntry={{
                  id: editingPriceEntryId,
                  price: editingPriceValue
                }}
                entries={previousPrices}
                onCancelEdit={cancelPriceEdit}
                onChangePrice={setEditingPriceValue}
                onSaveEdit={savePriceEdit}
                onStartEdit={startPriceEdit}
              />
            </div>
          ) : activeCell.mode === "stock" ? (
            <div className="mt-4 grid gap-3">
              {activeCell.columnIndex !== OPENING_COLUMN ? (
                <input
                  className="border border-slate-300 px-3 py-2 text-sm"
                  onChange={(event) => setTransactionDate(event.target.value)}
                  type="date"
                  value={transactionDate}
                />
              ) : null}
              {!isManagedFund ? (
                <input
                  className="border border-slate-300 px-3 py-2 text-sm"
                  inputMode="decimal"
                  onChange={(event) => setQuantity(event.target.value)}
                  placeholder="Quantity bought / quantity at hand"
                  value={quantity}
                />
              ) : null}
              <input
                className="border border-slate-300 px-3 py-2 text-sm"
                inputMode="decimal"
                onChange={(event) => setPrice(event.target.value)}
                placeholder={isManagedFund ? "Investment amount" : `Price per ${instrumentLabel.toLowerCase()}`}
                value={price}
              />
              <button
                className="border border-slate-950 bg-slate-950 px-3 py-2 text-sm text-white"
                onClick={submitStockTransaction}
              >
                Add {instrumentLabel} Transaction
              </button>
              <PreviousStockTransactionEntries
                editingEntry={{
                  date: editingTransactionDate,
                  id: editingTransactionId,
                  price: editingPrice,
                  quantity: editingQuantity
                }}
                entries={previousStockTransactions}
                isManagedFund={isManagedFund}
                onCancelEdit={cancelTransactionEdit}
                onChangeDate={setEditingTransactionDate}
                onChangePrice={setEditingPrice}
                onChangeQuantity={setEditingQuantity}
                onSaveEdit={saveTransactionEdit}
                onStartEdit={startTransactionEdit}
              />
            </div>
          ) : (
            <div className="mt-4 grid gap-3">
              <input
                className="border border-slate-300 px-3 py-2 text-sm"
                onChange={(event) => setDividendDate(event.target.value)}
                type="date"
                value={dividendDate}
              />
              <input
                className="border border-slate-300 px-3 py-2 text-sm"
                inputMode="decimal"
                onChange={(event) => setDividendAmount(event.target.value)}
                placeholder={`${dividendLabel} amount`}
                value={dividendAmount}
              />
              <button
                className="border border-slate-950 bg-slate-950 px-3 py-2 text-sm text-white"
                onClick={submitDividend}
              >
                Add {dividendLabel}
              </button>
              <PreviousDividendEntries entries={previousDividends} />
            </div>
          )}
        </section>
      ) : null}
    </div>
  );
}

function getLocalDateInputValue() {
  const now = new Date();
  const timezoneOffset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - timezoneOffset).toISOString().slice(0, 10);
}

function PreviousPriceEntries({
  editingEntry,
  entries,
  onCancelEdit,
  onChangePrice,
  onSaveEdit,
  onStartEdit
}: {
  editingEntry: {
    id: string | null;
    price: string;
  };
  entries: StockPriceEntry[];
  onCancelEdit: () => void;
  onChangePrice: (value: string) => void;
  onSaveEdit: (entry: StockPriceEntry) => void;
  onStartEdit: (entry: StockPriceEntry) => void;
}) {
  return (
    <PreviousEntries title="Previous Price Updates">
      {entries.length > 0 ? (
        entries.map((entry) => {
          const isEditing = editingEntry.id === entry.id;

          return (
            <tr key={entry.id}>
              <td className="border border-slate-200 px-2 py-2 text-right tabular-nums">
                {isEditing ? (
                  <input
                    className="w-full border border-slate-300 px-2 py-1 text-right"
                    inputMode="decimal"
                    onChange={(event) => onChangePrice(event.target.value)}
                    value={editingEntry.price}
                  />
                ) : (
                  entry.price
                )}
              </td>
              <td className="border border-slate-200 px-2 py-2">
                {isEditing ? (
                  <div className="flex gap-2">
                    <button
                      className="border border-slate-950 bg-slate-950 px-2 py-1 text-xs text-white"
                      onClick={() => onSaveEdit(entry)}
                    >
                      Save
                    </button>
                    <button
                      className="border border-slate-300 px-2 py-1 text-xs"
                      onClick={onCancelEdit}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    className="border border-slate-300 px-2 py-1 text-xs"
                    onClick={() => onStartEdit(entry)}
                  >
                    Edit
                  </button>
                )}
              </td>
            </tr>
          );
        })
      ) : (
        <EmptyPreviousEntries colSpan={2} />
      )}
    </PreviousEntries>
  );
}

function PreviousStockTransactionEntries({
  editingEntry,
  entries,
  isManagedFund,
  onCancelEdit,
  onChangeDate,
  onChangePrice,
  onChangeQuantity,
  onSaveEdit,
  onStartEdit
}: {
  editingEntry: {
    date: string;
    id: string | null;
    price: string;
    quantity: string;
  };
  entries: StockTransactionEntry[];
  isManagedFund: boolean;
  onCancelEdit: () => void;
  onChangeDate: (value: string) => void;
  onChangePrice: (value: string) => void;
  onChangeQuantity: (value: string) => void;
  onSaveEdit: (entry: StockTransactionEntry) => void;
  onStartEdit: (entry: StockTransactionEntry) => void;
}) {
  return (
    <PreviousEntries title="Previous Stock Transactions">
      {entries.length > 0 ? (
        entries.map((entry) => {
          const isEditing = editingEntry.id === entry.id;

          return (
            <tr key={entry.id}>
              <td className="border border-slate-200 px-2 py-2">
                {isEditing && entry.columnIndex !== OPENING_COLUMN ? (
                  <input
                    className="w-full border border-slate-300 px-2 py-1"
                    onChange={(event) => onChangeDate(event.target.value)}
                    type="date"
                    value={editingEntry.date}
                  />
                ) : (
                  entry.date || "Opening"
                )}
              </td>
              {!isManagedFund ? (
                <td className="border border-slate-200 px-2 py-2 text-right tabular-nums">
                  {isEditing ? (
                    <input
                      className="w-full border border-slate-300 px-2 py-1 text-right"
                      inputMode="decimal"
                      onChange={(event) => onChangeQuantity(event.target.value)}
                      value={editingEntry.quantity}
                    />
                  ) : (
                    entry.quantity
                  )}
                </td>
              ) : null}
              <td className="border border-slate-200 px-2 py-2 text-right tabular-nums">
                {isEditing ? (
                  <input
                    className="w-full border border-slate-300 px-2 py-1 text-right"
                    inputMode="decimal"
                    onChange={(event) => onChangePrice(event.target.value)}
                    value={editingEntry.price}
                  />
                ) : (
                  isManagedFund
                    ? formatNumber(
                        String(
                          parseNumber(entry.quantity) * parseNumber(entry.price)
                        )
                      )
                    : entry.price
                )}
              </td>
              {!isManagedFund ? (
                <td className="border border-slate-200 px-2 py-2 text-right tabular-nums">
                  {formatNumber(
                    String(
                      parseNumber(
                        isEditing ? editingEntry.quantity : entry.quantity
                      ) *
                        parseNumber(isEditing ? editingEntry.price : entry.price)
                    )
                  )}
                </td>
              ) : null}
              <td className="border border-slate-200 px-2 py-2">
                {isEditing ? (
                  <div className="flex gap-2">
                    <button
                      className="border border-slate-950 bg-slate-950 px-2 py-1 text-xs text-white"
                      onClick={() => onSaveEdit(entry)}
                    >
                      Save
                    </button>
                    <button
                      className="border border-slate-300 px-2 py-1 text-xs"
                      onClick={onCancelEdit}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    className="border border-slate-300 px-2 py-1 text-xs"
                    onClick={() => onStartEdit(entry)}
                  >
                    Edit
                  </button>
                )}
              </td>
            </tr>
          );
        })
      ) : (
        <EmptyPreviousEntries colSpan={isManagedFund ? 3 : 5} />
      )}
    </PreviousEntries>
  );
}

function PreviousDividendEntries({
  entries
}: {
  entries: StockDividendEntry[];
}) {
  return (
    <PreviousEntries title="Previous Dividends">
      {entries.length > 0 ? (
        entries.map((entry) => (
          <tr key={entry.id}>
            <td className="border border-slate-200 px-2 py-2">
              {entry.date || "-"}
            </td>
            <td className="border border-slate-200 px-2 py-2 text-right tabular-nums">
              {entry.amount}
            </td>
          </tr>
        ))
      ) : (
        <EmptyPreviousEntries colSpan={2} />
      )}
    </PreviousEntries>
  );
}

function PreviousEntries({
  children,
  title
}: {
  children: ReactNode;
  title: string;
}) {
  return (
    <div className="mt-4">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-600">
        {title}
      </h3>
      <div className="mt-2 overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <tbody>{children}</tbody>
        </table>
      </div>
    </div>
  );
}

function EmptyPreviousEntries({ colSpan }: { colSpan: number }) {
  return (
    <tr>
      <td className="border border-slate-200 px-2 py-2 text-slate-400" colSpan={colSpan}>
        No entries yet
      </td>
    </tr>
  );
}

function StockGrid({
  columns,
  getValue,
  isDisplayOnly = false,
  lockedColumnIndex,
  onCellClick,
  onSort,
  sortState,
  stocks,
  title,
  tone
}: {
  columns: string[];
  getValue: (stock: StockRow, columnIndex: number) => string;
  isDisplayOnly?: boolean;
  lockedColumnIndex: number;
  onCellClick?: (stock: StockRow, columnIndex: number) => void;
  onSort?: (columnIndex: number) => void;
  sortState?: Pick<StockSortState, "columnIndex" | "direction">;
  stocks: StockRow[];
  title: string;
  tone: "slate" | "blue" | "yellow";
}) {
  const headerTone = {
    slate: "bg-slate-400",
    blue: "bg-blue-500",
    yellow: "bg-yellow-300"
  }[tone];
  const totalTone = {
    slate: "bg-slate-300",
    blue: "bg-blue-200",
    yellow: "bg-yellow-100"
  }[tone];

  return (
    <section className="overflow-hidden border border-slate-300 bg-white">
      <div className="border-b border-slate-300 bg-white px-1 py-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-700">
          {title}
        </h2>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse text-sm">
          <thead>
            <tr className={headerTone}>
              {columns.map((column, index) => (
                <th
                  className={`border-b border-r border-slate-300 px-2 py-2 text-xs font-bold uppercase ${
                    index > 0 ? "text-right" : "text-center"
                  }`}
                  key={column}
                >
                  <button
                    className={`w-full uppercase ${
                      index > 0 ? "text-right" : "text-center"
                    }`}
                    onClick={() => onSort?.(index)}
                  >
                    {column}
                    {sortState?.columnIndex === index
                      ? sortState.direction === "asc"
                        ? " ▲"
                        : " ▼"
                      : ""}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {stocks.map((stock) => (
              <tr key={stock.id}>
                <td className="border-b border-r border-slate-200 px-2 py-1.5 text-center text-xs font-semibold text-slate-800">
                  {stock.label}
                </td>
                {columns.slice(1).map((_, columnOffset) => {
                  const columnIndex = columnOffset + 1;
                  const isLocked =
                    isDisplayOnly || columnIndex === lockedColumnIndex;
                  return (
                    <td
                      className="border-b border-r border-slate-200 px-2 py-1.5 text-right text-xs font-medium tabular-nums"
                      key={`${stock.id}-${columnIndex}`}
                    >
                      {isLocked ? (
                        getValue(stock, columnIndex)
                      ) : (
                        <button
                          className="min-h-5 w-full min-w-20 text-right hover:bg-slate-100 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-400"
                          onClick={() => onCellClick?.(stock, columnIndex)}
                        >
                          {getValue(stock, columnIndex)}
                        </button>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
            <tr className={totalTone}>
              <td className="border-b border-r border-slate-200 px-2 py-1.5 text-center text-xs font-bold">
                TOTAL
              </td>
              {columns.slice(1).map((_, columnOffset) => {
                const columnIndex = columnOffset + 1;
                const total = stocks.reduce(
                  (sum, stock) => sum + parseNumber(getValue(stock, columnIndex)),
                  0
                );
                return (
                  <td
                    className="border-b border-r border-slate-200 px-2 py-1.5 text-right text-xs font-bold tabular-nums"
                    key={`total-${columnIndex}`}
                  >
                    {total ? formatNumber(String(total)) : ""}
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}
