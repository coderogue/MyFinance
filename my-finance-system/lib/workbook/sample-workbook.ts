import type { WorkbookTab, UserTabCategory } from "./types";

export const workbookTabs: WorkbookTab[] = [
  { id: "summary", name: "Summary", category: "Summary", kind: "summary" }
];

export const userTabCategories: UserTabCategory[] = [
  "Bank",
  "Stock",
  "Managed Funds",
  "Wallets",
  "Credit Card"
];

export function getWorkbookTabGroups(tabs: WorkbookTab[]) {
  return [
  {
    title: "Workbook",
    tabs: tabs.filter((tab) => tab.kind === "summary")
  },
  ...userTabCategories.map((category) => ({
    title: category,
    tabs: tabs.filter((tab) => tab.category === category)
  }))
  ];
}

export const summaryColumns = [
  "No.",
  "Description",
  "Open Balance",
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
  "Closing Balance"
];

export const summaryOverviewRows = [
  [
    "1",
    "BANKS",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    ""
  ],
  [
    "2",
    "STOCKS",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    ""
  ],
  [
    "3",
    "MANAGED FUND",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    ""
  ],
  [
    "4",
    "WALLETS",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    ""
  ],
  [
    "5",
    "CREDIT CARD",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    ""
  ],
  [
    "",
    "TOTAL",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    ""
  ]
];

export const summaryDetailSections = [
  {
    title: "Banks",
    theme: "blue",
    rows: [
      [
        "",
        "TOTAL",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        ""
      ]
    ]
  },
  {
    title: "Stocks",
    theme: "green",
    rows: [
      [
        "",
        "TOTAL",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        ""
      ]
    ]
  },
  {
    title: "Managed Funds",
    theme: "teal",
    rows: [
      [
        "",
        "TOTAL",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        ""
      ]
    ]
  }
];

export function getSummaryOverviewRows(tabs: WorkbookTab[]) {
  const labels: Array<[UserTabCategory, string]> = [
    ["Bank", "BANKS"],
    ["Stock", "STOCKS"],
    ["Managed Funds", "MANAGED FUND"],
    ["Wallets", "WALLETS"]
  ];

  return [
    ...labels.map(([category, label], index) => [
      String(index + 1),
      label,
      ...Array(14).fill("")
    ]),
    ["", "TOTAL", ...Array(14).fill("")]
  ];
}

export function getSummaryDetailSections(tabs: WorkbookTab[]) {
  const detailCategories: Array<{
    category: UserTabCategory;
    title: string;
    theme: "blue" | "green" | "teal";
  }> = [
    { category: "Bank", title: "Banks", theme: "blue" },
    { category: "Stock", title: "Stocks", theme: "green" },
    { category: "Managed Funds", title: "Managed Funds", theme: "teal" }
  ];

  return detailCategories.map((section) => {
    const categoryTabs = tabs.filter((tab) => tab.category === section.category);
    const rows =
      categoryTabs.length > 0
        ? [
            ...categoryTabs.map((tab, index) => [
              String(index + 1),
              tab.name,
              ...Array(14).fill("")
            ]),
            ["", "TOTAL", ...Array(14).fill("")]
          ]
        : [["", "TOTAL", ...Array(14).fill("")]];

    return {
      category: section.category,
      title: section.title,
      theme: section.theme,
      rows
    };
  });
}

const normalValueColumns = Array(14).fill("");

export const normalColumns = [
  "Description",
  "Opening Balance",
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
  "Closing Balance"
];

export const annualTotalColumns = [
  "Description",
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
  "Annual Total"
];

export const annualTotalColumnIndexes = [
  0, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14
];

export const monthlyRecordColumns = annualTotalColumns.slice(0, -1);
export const monthlyRecordColumnIndexes = annualTotalColumnIndexes.slice(0, -1);

export const stockColumns = [
  "Description",
  "Opening Balance",
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
  "Closing Balance"
];

export const dividendColumns = [
  "Description",
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
  "Total"
];

export const normalOverviewRows = [
  ["Brought Forward", ...normalValueColumns],
  ["Total Debit", ...normalValueColumns],
  ["Total Credit", ...normalValueColumns],
  ["Total Balance", ...normalValueColumns]
];

export const dayRows = [
  ...Array.from({ length: 31 }, (_, index) => [
    `Day ${index + 1}`,
    ...normalValueColumns
  ]),
  ["TOTAL", ...normalValueColumns]
];

export function getNormalTableRows(presetLabels: string[]) {
  return [
    ...presetLabels.map((label) => [label, ...normalValueColumns]),
    ...dayRows
  ];
}

const creditCardValueColumns = Array(14).fill("");

export const creditCardColumns = [
  "Description",
  "Opening Balance",
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
  "Closing Balance"
];

export const creditCardSummaryRows = [
  ["Fixed Expenses", ...creditCardValueColumns],
  ["Variable Expenses", ...creditCardValueColumns],
  ["Brought Forward", ...creditCardValueColumns],
  ["Rebate", ...creditCardValueColumns],
  ["Monthly Total", ...creditCardValueColumns],
  ["Statement Amount", ...creditCardValueColumns],
  ["Carried Forward", ...creditCardValueColumns]
];

export const fixedExpenseRows = [
  ["TOTAL", ...creditCardValueColumns]
];

export function getFixedExpenseRows(fixedExpenseLabels: string[]) {
  return [
    ...fixedExpenseLabels.map((label) => [label, ...creditCardValueColumns]),
    ["TOTAL", ...creditCardValueColumns]
  ];
}

export function getFixedExpenseSubTableRows(subRowLabels: string[]) {
  return [
    ...subRowLabels.map((label) => [label, ...creditCardValueColumns]),
    ["TOTAL", ...creditCardValueColumns]
  ];
}

export const variableExpenseRows = [
  ...Array.from({ length: 31 }, (_, index) => [
    `Day ${index + 1}`,
    ...creditCardValueColumns
  ]),
  ["TOTAL", ...creditCardValueColumns]
];
