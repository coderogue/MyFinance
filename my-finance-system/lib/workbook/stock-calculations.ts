import type {
  StockDividendEntry,
  StockPriceEntry,
  StockRow,
  StockTransactionEntry
} from "@/lib/workbook/types";

export const OPENING_COLUMN = 1;
export const CLOSING_COLUMN = 14;
export const DIVIDEND_TOTAL_COLUMN = 13;
const LAST_MONTH_COLUMN = 13;

export type StockSortMode = "summary" | "transactions" | "dividend";

export interface StockSortState {
  columnIndex: number;
  direction: "asc" | "desc";
  mode: StockSortMode;
}

export function sortStocks({
  dividends,
  prices,
  sortState,
  stocks,
  transactions
}: {
  dividends: StockDividendEntry[];
  prices: StockPriceEntry[];
  sortState: StockSortState;
  stocks: StockRow[];
  transactions: StockTransactionEntry[];
}) {
  return [...stocks].sort((firstStock, secondStock) => {
    const directionMultiplier = sortState.direction === "asc" ? 1 : -1;

    if (sortState.columnIndex === 0) {
      return firstStock.label.localeCompare(secondStock.label) * directionMultiplier;
    }

    const firstValue = getSortableStockValue({
      dividends,
      prices,
      sortState,
      stock: firstStock,
      transactions
    });
    const secondValue = getSortableStockValue({
      dividends,
      prices,
      sortState,
      stock: secondStock,
      transactions
    });

    return (firstValue - secondValue) * directionMultiplier;
  });
}

export function getStockValuation(
  stockId: string,
  columnIndex: number,
  transactions: StockTransactionEntry[],
  prices: StockPriceEntry[]
) {
  const entries = transactions
    .filter((entry) => entry.stockId === stockId)
    .sort((first, second) => first.columnIndex - second.columnIndex);
  const maxColumnIndex =
    columnIndex === CLOSING_COLUMN ? LAST_MONTH_COLUMN : columnIndex;
  const relevantEntries = entries.filter(
    (entry) => entry.columnIndex <= maxColumnIndex
  );
  const quantity = relevantEntries.reduce(
    (sum, entry) => sum + parseNumber(entry.quantity),
    0
  );
  const latestMarketPrice = prices
    .filter(
      (entry) => entry.stockId === stockId && entry.columnIndex <= maxColumnIndex
    )
    .sort((first, second) => first.columnIndex - second.columnIndex)
    .at(-1)?.price;
  const fallbackPurchasePrice = [...relevantEntries]
    .reverse()
    .find((entry) => parseNumber(entry.price) > 0)?.price;
  const latestPrice = latestMarketPrice ?? fallbackPurchasePrice;

  if (!quantity || !latestPrice) return "";
  return formatNumber(String(quantity * parseNumber(latestPrice)));
}

export function getStockTransactionValue(
  stockId: string,
  columnIndex: number,
  transactions: StockTransactionEntry[]
) {
  const entries = transactions.filter(
    (entry) => entry.stockId === stockId && entry.columnIndex === columnIndex
  );

  if (columnIndex === CLOSING_COLUMN) {
    const stockTransactions = transactions.filter(
      (entry) => entry.stockId === stockId
    );
    const quantity = stockTransactions.reduce(
      (sum, entry) => sum + parseNumber(entry.quantity),
      0
    );
    const totalCost = stockTransactions.reduce(
      (sum, entry) => sum + parseNumber(entry.quantity) * parseNumber(entry.price),
      0
    );
    const averagePrice = quantity ? totalCost / quantity : 0;
    const closingValue = quantity * averagePrice;
    return closingValue ? formatNumber(String(closingValue)) : "";
  }

  const total = entries.reduce(
    (sum, entry) => sum + parseNumber(entry.quantity) * parseNumber(entry.price),
    0
  );
  return total ? formatNumber(String(total)) : "";
}

export function getDividendValue(
  stockId: string,
  columnIndex: number,
  dividends: StockDividendEntry[]
) {
  const entries = dividends.filter((entry) => entry.stockId === stockId);
  const relevantEntries =
    columnIndex === DIVIDEND_TOTAL_COLUMN
      ? entries
      : entries.filter((entry) => entry.columnIndex === columnIndex);
  const total = relevantEntries.reduce(
    (sum, entry) => sum + parseNumber(entry.amount),
    0
  );
  return total ? formatNumber(String(total)) : "";
}

export function parseNumber(value: string) {
  const parsed = Number(value.replace(/,/g, "").trim());
  return Number.isFinite(parsed) ? parsed : 0;
}

export function formatNumber(value: string) {
  const parsed = parseNumber(value);
  return parsed
    ? parsed.toLocaleString("en-US", {
        maximumFractionDigits: 2,
        minimumFractionDigits: 2
      })
    : "";
}

function getSortableStockValue({
  dividends,
  prices,
  sortState,
  stock,
  transactions
}: {
  dividends: StockDividendEntry[];
  prices: StockPriceEntry[];
  sortState: StockSortState;
  stock: StockRow;
  transactions: StockTransactionEntry[];
}) {
  if (sortState.mode === "summary") {
    return parseNumber(
      getStockValuation(stock.id, sortState.columnIndex, transactions, prices)
    );
  }
  if (sortState.mode === "transactions") {
    return parseNumber(
      getStockTransactionValue(stock.id, sortState.columnIndex, transactions)
    );
  }
  return parseNumber(getDividendValue(stock.id, sortState.columnIndex, dividends));
}
