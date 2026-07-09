import {
  getSummaryDetailSections,
  getSummaryOverviewRows,
  summaryColumns,
} from "@/lib/workbook/sample-workbook";
import type { CellValueMap, WorkbookTab } from "@/lib/workbook/types";
import { WorkbookTable } from "./workbook-table";

export function SummarySheet({
  tabs,
  values
}: {
  tabs: WorkbookTab[];
  values: CellValueMap;
}) {
  const summaryOverviewRows = getSummaryOverviewRows(tabs);
  const summaryDetailSections = getSummaryDetailSections(tabs);

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-950">Summary</h1>
        <p className="mt-1 text-sm text-slate-600">
          Brief category overview first, followed by detailed category tables.
        </p>
      </div>

      <WorkbookTable
        title="Category Summary"
        columns={summaryColumns}
        rows={summaryOverviewRows}
        tableId="summary:category"
        values={values}
        compact
        tone="teal"
      />

      <div className="grid gap-5">
        {summaryDetailSections.map((section) => {
          const tone =
            section.theme === "blue"
              ? "blue"
              : section.theme === "green"
                ? "green"
                : "teal";

          return (
            <WorkbookTable
              key={section.title}
              title={section.title}
              columns={summaryColumns}
              rows={section.rows}
              tableId={`summary:${section.category}`}
              values={values}
              compact
              tone={tone}
            />
          );
        })}
      </div>
    </div>
  );
}
