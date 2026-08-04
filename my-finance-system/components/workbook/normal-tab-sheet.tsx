import { useState } from "react";
import {
  getNormalTableRows,
  monthlyRecordColumnIndexes,
  monthlyRecordColumns,
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
  linkableTabs,
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
  linkableTabs: WorkbookTab[];
  onAddPreset: (
    tableType: NormalTableType,
    label: string,
    linkedTabId?: string
  ) => void;
  presetRows: PresetRow[];
  tabId: string;
  values: CellValueMap;
}) {
  const debitPresetRows = presetRows.filter(
    (row) => row.tabId === tabId && row.tableType === "debit"
  );
  const creditPresetRows = presetRows.filter(
    (row) => row.tabId === tabId && row.tableType === "credit"
  );
  const debitRows = getNormalTableRows(debitPresetRows.map((row) => row.label));
  const creditRows = getNormalTableRows(
    creditPresetRows.map((row) => row.label)
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
        columns={monthlyRecordColumns}
        columnIndexes={monthlyRecordColumnIndexes}
        currentTabId={tabId}
        onCellChange={onCellChange}
        onTransactionCellOpen={onTransactionCellOpen}
        linkableTabs={linkableTabs}
        onAddPreset={onAddPreset}
        presetRows={debitPresetRows}
        rows={debitRows}
        presetCount={debitPresetRows.length}
        tabId={tabId}
        tableType="debit"
        title="DEBIT"
        values={values}
      />

      <PresetTableSection
        columns={monthlyRecordColumns}
        columnIndexes={monthlyRecordColumnIndexes}
        currentTabId={tabId}
        onCellChange={onCellChange}
        onTransactionCellOpen={onTransactionCellOpen}
        linkableTabs={linkableTabs}
        onAddPreset={onAddPreset}
        presetRows={creditPresetRows}
        rows={creditRows}
        presetCount={creditPresetRows.length}
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
  columnIndexes,
  currentTabId,
  onCellChange,
  onTransactionCellOpen,
  linkableTabs,
  onAddPreset,
  presetRows,
  rows,
  presetCount,
  tabId,
  tableType,
  title,
  values
}: {
  columns: string[];
  columnIndexes: number[];
  currentTabId: string;
  onCellChange: (input: {
    columnIndex: number;
    commit?: boolean;
    rowIndex: number;
    tableId: string;
    value: string;
  }) => void;
  onTransactionCellOpen: (input: TransactionCell) => void;
  linkableTabs: WorkbookTab[];
  onAddPreset: (
    tableType: NormalTableType,
    label: string,
    linkedTabId?: string
  ) => void;
  rows: string[][];
  presetRows: PresetRow[];
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
      ? "Optional: link to another tab or Credit Card"
      : "Optional: create matching CREDIT in another tab";
  const availableLinkedTabs = linkableTabs.filter((tab) => {
    if (tab.id === currentTabId) {
      return false;
    }

    return tableType === "credit"
      ? tab.kind === "normal" || tab.kind === "credit-card"
      : tab.kind === "normal";
  });

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
              {tab.kind === "credit-card"
                ? `Statement Amount from ${tab.name}`
                : `${tableType === "credit" ? "Debit in" : "Credit in"} ${
                    tab.name
                  }`}
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
        columnIndexes={columnIndexes}
        getCellMode={({ columnIndex, isTotal, rowIndex }) => {
          if (columnIndex === 0 || isTotal) {
            return "display";
          }

          const presetRow = presetRows[rowIndex];
          const linkedTab = linkableTabs.find(
            (tab) => tab.id === presetRow?.linkedTabId
          );

          if (linkedTab?.kind === "credit-card") {
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
