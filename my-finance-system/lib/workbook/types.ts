export const monthColumns = [
  "Opening",
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
  "Closing"
] as const;

export const activeMonthColumns = monthColumns.slice(1, 13);

export type TabCategory =
  | "Summary"
  | "Bank"
  | "Stock"
  | "Managed Funds"
  | "Wallets"
  | "Credit Card";

export type WorkbookTabKind = "summary" | "normal" | "stock" | "credit-card";

export interface WorkbookTab {
  id: string;
  name: string;
  category: TabCategory;
  kind: WorkbookTabKind;
}

export type UserTabCategory = Exclude<TabCategory, "Summary">;

export type NormalTableType = "debit" | "credit";

export interface PresetRow {
  id: string;
  linkedPresetRowId?: string;
  linkedTabId?: string;
  tabId: string;
  tableType: NormalTableType;
  label: string;
}

export interface FixedExpenseRow {
  hasSubTable: boolean;
  id: string;
  label: string;
  tabId: string;
}

export interface FixedExpenseSubRow {
  fixedExpenseId: string;
  id: string;
  label: string;
}

export interface StockRow {
  id: string;
  label: string;
  tabId: string;
}

export interface StockTransactionEntry {
  columnIndex: number;
  date: string;
  id: string;
  price: string;
  quantity: string;
  stockId: string;
}

export interface StockPriceEntry {
  columnIndex: number;
  id: string;
  price: string;
  stockId: string;
}

export interface StockDividendEntry {
  amount: string;
  columnIndex: number;
  date: string;
  id: string;
  stockId: string;
}

export type CellValueMap = Record<string, string>;

export type WorkbookCellMode = "display" | "edit" | "transaction";

export interface EditableTableCell {
  columnIndex: number;
  commit?: boolean;
  rowIndex: number;
  tableId: string;
  value: string;
}

export interface TransactionEntry {
  amount: string;
  description: string;
  id: string;
}

export interface TransactionCell {
  columnIndex: number;
  rowIndex: number;
  tableId: string;
  title: string;
}
