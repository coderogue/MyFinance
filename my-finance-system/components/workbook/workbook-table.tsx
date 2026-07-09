export function WorkbookTable({
  title,
  columns,
  getCellMode,
  onCellChange,
  onTransactionCellOpen,
  rows,
  compact = false,
  tableId = title,
  tone = "slate",
  values = {}
}: {
  title: string;
  columns: string[];
  getCellMode?: (input: {
    cell: string;
    columnIndex: number;
    isTotal: boolean;
    row: string[];
    rowIndex: number;
  }) => "display" | "edit" | "transaction";
  onCellChange?: (input: {
    columnIndex: number;
    commit?: boolean;
    rowIndex: number;
    tableId: string;
    value: string;
  }) => void;
  onTransactionCellOpen?: (input: {
    columnIndex: number;
    rowIndex: number;
    tableId: string;
    title: string;
  }) => void;
  rows: string[][];
  compact?: boolean;
  tableId?: string;
  tone?: "slate" | "teal" | "blue" | "green";
  values?: Record<string, string>;
}) {
  const headerTone = {
    slate: "bg-slate-100 text-slate-700",
    teal: "bg-teal-600 text-black",
    blue: "bg-blue-500 text-black",
    green: "bg-lime-500 text-black"
  }[tone];

  const totalTone = {
    slate: "bg-slate-100",
    teal: "bg-teal-200",
    blue: "bg-blue-200",
    green: "bg-lime-200"
  }[tone];

  function formatDecimal(value: string) {
    const normalized = value.replace(/,/g, "").trim();
    if (!normalized) {
      return "";
    }

    const parsed = Number(normalized);
    return Number.isFinite(parsed)
      ? parsed.toLocaleString("en-US", {
          maximumFractionDigits: 2,
          minimumFractionDigits: 2
        })
      : value;
  }

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
                  key={column}
                  className={`border-b border-r border-slate-300 px-2 py-2 text-left text-xs font-bold uppercase ${
                    index > 0 ? "text-right" : ""
                  } ${compact ? "whitespace-nowrap" : ""}`}
                >
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => {
              const isTotal = row.some((cell) => cell.toLowerCase() === "total");
              const rowKey = row.join("-");

              return (
                <tr key={rowKey} className={isTotal ? totalTone : ""}>
                  {row.map((cell, index) => {
                    const key = `${tableId}:${rowIndex}:${index}`;
                    const value = values[key] ?? cell;
                    const mode =
                      index === 0
                        ? "display"
                        : getCellMode?.({
                            cell,
                            columnIndex: index,
                            isTotal,
                            row,
                            rowIndex
                          }) ?? "display";

                    return (
                      <td
                        key={`${row[0]}-${index}`}
                        className={`border-b border-r border-slate-200 px-2 py-1.5 text-xs ${
                          index <= 1
                            ? "text-center font-semibold text-slate-800"
                            : "text-right font-medium tabular-nums"
                        } ${isTotal ? "font-bold" : ""}`}
                      >
                        {mode === "edit" ? (
                          <input
                            className="w-full min-w-20 bg-transparent text-right outline-none focus:bg-white focus:ring-1 focus:ring-slate-400"
                            onBlur={(event) =>
                              onCellChange?.({
                                columnIndex: index,
                                commit: true,
                                rowIndex,
                                tableId,
                                value: formatDecimal(event.target.value)
                              })
                            }
                            onChange={(event) =>
                              onCellChange?.({
                                columnIndex: index,
                                commit: false,
                                rowIndex,
                                tableId,
                                value: event.target.value
                              })
                            }
                            value={value}
                          />
                        ) : mode === "transaction" ? (
                          <button
                            className="min-h-5 w-full min-w-20 text-right hover:bg-slate-100 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-400"
                            onClick={() =>
                              onTransactionCellOpen?.({
                                columnIndex: index,
                                rowIndex,
                                tableId,
                                title: `${title} / ${row[0]} / ${columns[index]}`
                              })
                            }
                          >
                            {value || ""}
                          </button>
                        ) : (
                          value
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
