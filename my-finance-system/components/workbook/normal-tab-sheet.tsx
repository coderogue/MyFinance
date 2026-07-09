import { useState } from "react";
import {
  getNormalTableRows,
  normalColumns,
  normalOverviewRows
} from "@/lib/workbook/sample-workbook";
import type {
  CellValueMap,
  NormalTableType,
  PresetRow,
  TransactionCell,
  WorkbookTab
} from "@/lib/workbook/types";
import { WorkbookTable } from "./workbook-table";

export function NormalTabSheet({
  category,
  name,
  onCellChange,
  onTransactionCellOpen,
  normalTabs,
  onAddPreset,
  presetRows,
  tabId,
  values
}: {
  category: string;
  name: string;
  onCellChange: (input: {
    columnIndex: number;
    commit?: boolean;
    rowIndex: number;
    tableId: string;
    value: string;
  }) => void;
  onTransactionCellOpen: (input: TransactionCell) => void;
  normalTabs: WorkbookTab[];
  onAddPreset: (
    tableType: NormalTableType,
    label: string,
    linkedTabId?: string
  ) => void;
  presetRows: PresetRow[];
  tabId: string;
  values: CellValueMap;
}) {
  const debitRows = getNormalTableRows(
    presetRows
      .filter((row) => row.tabId === tabId && row.tableType === "debit")
      .map((row) => row.label)
  );
  const creditRows = getNormalTableRows(
    presetRows
      .filter((row) => row.tabId === tabId && row.tableType === "credit")
      .map((row) => row.label)
  );

  return (
    <div className="grid gap-5">
      <div>
        <h1 className="text-2xl font-semibold text-slate-950">{name}</h1>
        <p className="mt-1 text-sm text-slate-600">
          {category} tab: overview, DEBIT table, and CREDIT table.
        </p>
      </div>

      <WorkbookTable
        title="Overview"
        columns={normalColumns}
        rows={normalOverviewRows}
        tableId={`${tabId}:overview`}
        values={values}
        compact
      />

      <PresetTableSection
        columns={normalColumns}
        currentTabId={tabId}
        onCellChange={onCellChange}
        onTransactionCellOpen={onTransactionCellOpen}
        normalTabs={normalTabs}
        onAddPreset={onAddPreset}
        rows={debitRows}
        presetCount={
          presetRows.filter(
            (row) => row.tabId === tabId && row.tableType === "debit"
          ).length
        }
        tabId={tabId}
        tableType="debit"
        title="DEBIT"
        values={values}
      />

      <PresetTableSection
        columns={normalColumns}
        currentTabId={tabId}
        onCellChange={onCellChange}
        onTransactionCellOpen={onTransactionCellOpen}
        normalTabs={normalTabs}
        onAddPreset={onAddPreset}
        rows={creditRows}
        presetCount={
          presetRows.filter(
            (row) => row.tabId === tabId && row.tableType === "credit"
          ).length
        }
        tabId={tabId}
        tableType="credit"
        title="CREDIT"
        values={values}
      />
    </div>
  );
}

function PresetTableSection({
  columns,
  currentTabId,
  onCellChange,
  onTransactionCellOpen,
  normalTabs,
  onAddPreset,
  rows,
  presetCount,
  tabId,
  tableType,
  title,
  values
}: {
  columns: string[];
  currentTabId: string;
  onCellChange: (input: {
    columnIndex: number;
    commit?: boolean;
    rowIndex: number;
    tableId: string;
    value: string;
  }) => void;
  onTransactionCellOpen: (input: TransactionCell) => void;
  normalTabs: WorkbookTab[];
  onAddPreset: (
    tableType: NormalTableType,
    label: string,
    linkedTabId?: string
  ) => void;
  rows: string[][];
  presetCount: number;
  tabId: string;
  tableType: NormalTableType;
  title: string;
  values: CellValueMap;
}) {
  const [label, setLabel] = useState("");
  const [linkedTabId, setLinkedTabId] = useState("");
  const linkDescription =
    tableType === "credit"
      ? "Optional: create matching DEBIT in another tab"
      : "Optional: create matching CREDIT in another tab";
  const availableLinkedTabs = normalTabs.filter((tab) => tab.id !== currentTabId);

  function submitPreset() {
    const cleanLabel = label.trim();

    if (!cleanLabel) {
      return;
    }

    onAddPreset(tableType, cleanLabel, linkedTabId || undefined);
    setLabel("");
    setLinkedTabId("");
  }

  return (
    <div className="grid gap-2">
      <div className="grid gap-2 border border-slate-200 bg-white p-3 md:grid-cols-[1fr_280px_auto]">
        <input
          className="border border-slate-300 px-3 py-2 text-sm"
          onChange={(event) => setLabel(event.target.value)}
          placeholder={`Preset ${title} row name`}
          value={label}
        />
        <select
          className="border border-slate-300 px-3 py-2 text-sm"
          onChange={(event) => setLinkedTabId(event.target.value)}
          value={linkedTabId}
        >
          <option value="">{linkDescription}</option>
          {availableLinkedTabs.map((tab) => (
            <option key={tab.id} value={tab.id}>
              {tableType === "credit" ? "Debit in" : "Credit in"} {tab.name}
            </option>
          ))}
        </select>
        <button
          className="border border-slate-950 bg-slate-950 px-3 py-2 text-sm text-white"
          onClick={submitPreset}
        >
          + Preset {title}
        </button>
      </div>
      <WorkbookTable
        title={title}
        columns={columns}
        getCellMode={({ columnIndex, isTotal, rowIndex }) => {
          if (columnIndex === 0 || isTotal) {
            return "display";
          }

          return rowIndex < presetCount ? "edit" : "transaction";
        }}
        onCellChange={onCellChange}
        onTransactionCellOpen={onTransactionCellOpen}
        rows={rows}
        tableId={`${tabId}:${tableType}`}
        values={values}
        compact
      />
    </div>
  );
}
