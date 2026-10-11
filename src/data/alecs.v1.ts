export const snapshotId = "ALECS-DEMO-2026-10-12-V1";
export type EvidenceClass =
  | "PUBLIC FACT"
  | "SYNTHETIC INPUT"
  | "DERIVED METRIC"
  | "ANALYST INTERPRETATION";
export const meta = (
  evidenceClass: EvidenceClass = "SYNTHETIC INPUT",
  sourceId = "SPEC-04",
  assumptionId: string | null = null,
  note = "Illustrative planning input.",
) => ({
  evidenceClass,
  sourceId,
  asOfDate: "2026-10-11",
  snapshotId,
  assumptionId,
  note,
});
export const disclosure =
  "Illustrative planning concept. Operating data and recommendations are synthetic. No live connection or client results.";
export const missing = "Not specified in demo source";
export const sum = (xs: readonly number[]) => xs.reduce((a, b) => a + b, 0);
export function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object") {
    Object.freeze(value);
    Object.values(value).forEach(deepFreeze);
  }
  return value;
}
const names = [
  "Breakfast",
  "Cookies & Cream",
  "Dark Chocolate Honeycomb Crunch",
  "Chocolate Covered Strawberry",
  "Mint Chocolate Cookie",
  "GROUNDWORK Coffee",
  "Madagascar Vanilla Bean",
  "Peanut Butter Cup",
];
const short = [
  "Breakfast",
  "Cookies",
  "Honeycomb",
  "Strawberry",
  "Mint",
  "Coffee",
  "Vanilla",
  "Peanut Butter",
];
const images = [5, 2, 4, 8, 7, 1, 3, 6];
const colors = [
  "#F1D46A",
  "#B8D9E7",
  "#C9B6DC",
  "#E98AA3",
  "#8FB69C",
  "#C2A184",
  "#9FCDE7",
  "#DCB67F",
];
const paths = [
  "alecs-x-purely-elizabeth",
  "culture-cup-cookies-cream-4-pack",
  "dark-chocolate-honeycomb-crunch",
  "chocolate-covered-strawberry-4-pack",
  "mint-chocolate-cookie-4-pack",
  "groundwork-coffee-4-pack",
  "madagascar-vanilla-bean-4-pack",
  "peanut-butter-cup-4-pack",
];
const opening = [4800, 6000, 4800, 6000, 7200, 4800, 3600, 4800];
const requested = [12000, 10000, 6000, 6000, 4000, 4000, 6000, 4000];
const reviewed = [8000, 12000, 4000, 6000, 2000, 2000, 4000, 2000];
const material = [0.7, 0.6, 0.65, 0.65, 0.6, 0.65, 0.6, 0.65];
const conversion = [0.5, 0.45, 0.45, 0.5, 0.4, 0.45, 0.35, 0.45];
const revenue = [1.9, 1.8, 1.85, 1.8, 1.75, 1.85, 1.7, 1.85];
export const latestRetail = deepFreeze([
  [2400, 0, 0],
  [2400, 400, 200],
  [1600, 280, 120],
  [1400, 400, 200],
  [1000, 120, 80],
  [800, 120, 80],
  [900, 200, 100],
  [600, 120, 80],
]);
export const products = deepFreeze(
  names.map((name, i) => ({
    ...meta("PUBLIC FACT", "S06"),
    id: `CC0${i + 1}`,
    name,
    short: short[i],
    publicName: i === 0 ? "Alec’s × Purely Elizabeth" : name,
    source: `https://www.alecsicecream.com/products/${paths[i]}`,
    imageSrc: `/brand/cc${images[i]}.webp`,
    color: colors[i],
    opening: opening[i],
    requested: requested[i],
    reviewed: reviewed[i],
    material: material[i],
    conversion: conversion[i],
    revenue: revenue[i],
    bufferWeeks: i === 0 ? 1.5 : 2,
    cupsPerPack: 4,
    cupsPerCase: 24,
    operatingMeta: meta("SYNTHETIC INPUT", "SPEC-04.10", "A06"),
  })),
);
export const preMix = [0, 2600, 1900, 1600, 1300, 1000, 900, 700];
export const historicAnchors = deepFreeze([
  [0, 2600, 1900, 1600, 1300, 1000, 900, 700],
  [0, 2652, 1936, 1632, 1328, 1020, 916, 716],
  [0, 2548, 1864, 1568, 1272, 980, 884, 684],
  [0, 2600, 1900, 1600, 1300, 1000, 900, 700],
  [3200, 2500, 1600, 1400, 1000, 800, 900, 600],
  [2800, 2400, 1600, 1400, 1000, 800, 900, 600],
  [2500, 2400, 1600, 1400, 1000, 800, 900, 600],
  [2400, 2400, 1600, 1400, 1000, 800, 900, 600],
]);
export const earlyTotals = [
  9400, 9600, 9800, 10000, 10200, 10400, 10000, 9800, 10200, 10000, 10400,
  10200,
];
export const preCohort = deepFreeze([
  [0, 648, 476, 400, 324, 252, 224, 176],
  [0, 652, 476, 400, 324, 248, 224, 176],
  [0, 648, 476, 400, 324, 252, 224, 176],
  [0, 652, 472, 400, 328, 248, 228, 172],
]);
export const latestCohort = deepFreeze([
  [900, 700, 452, 352, 248, 200, 248, 200],
  [800, 400, 300, 248, 200, 152, 248, 152],
  [200, 748, 400, 352, 252, 248, 200, 100],
  [500, 552, 448, 448, 300, 200, 204, 148],
]);
export const launchCohort = deepFreeze([
  [1200, 1100, 300, 600],
  [1048, 952, 248, 552],
  [948, 852, 220, 480],
  [900, 800, 200, 500],
]);
export const cohorts = deepFreeze(
  ["A", "B", "C", "D"].map((id, i) => ({
    ...meta("SYNTHETIC INPUT", "SPEC-04.06", "A15"),
    id,
    stores: 30,
    availableDays: [200, 196, 168, 204][i],
    pre: 2500,
    latest: sum(latestCohort[i]),
    launch: latestCohort[i][0],
    control: [1040, 1020, 980, 1080][i],
    controlPre: 1000,
    receipts: [
      [2880, 1440, 1200, 960],
      [2880, 960, 0, 0],
      [1200, 0, 0, 0],
      [1920, 0, 720, 720],
    ][i],
    pos: launchCohort.map((row) => row[i]),
    label: [
      "Stronger portfolio movement",
      "High launch, flat portfolio",
      "Incumbent-led mix",
      "Persistent launch consumption",
    ][i],
    interpretation: [
      "Later receipt cycles and stronger portfolio movement provide more evidence to investigate sustained depth.",
      "Strong launch consumption has left little retailer stock. Replenishment may be needed even though total portfolio demand is flat.",
      "Weaker launch movement needs an availability and assortment check before reducing the commitment.",
      "Continued consumption through later receipt cycles supports another review of allocation and run depth.",
    ][i],
  })),
);
export const forward = deepFreeze(
  products.map((_, i) =>
    i === 0
      ? [
          2400, 2300, 2200, 2000, 1800, 1700, 1600, 1600, 1600, 1600, 1600,
          1600, 1600,
        ]
      : Array<number>(13).fill([0, 3000, 2000, 2000, 1200, 1000, 1200, 800][i]),
  ),
);
export const bridge = deepFreeze([
  4000, 10000, 6000, 4000, 4000, 2000, 6000, 2000,
]);
export const bridgeEarly = deepFreeze([0, 0, 2000, 0, 0, 0, 0, 0]);
export const constrainedMix = deepFreeze([
  6000, 12000, 4000, 4000, 0, 0, 4000, 2000,
]);
export const components = deepFreeze(
  [
    ["BASE", "Dairy-based production mix", "kg", 3200, 3.5],
    ["CUP-LID", "Cup/lid sets", "sets", 40000, 0.1],
    ["CULTURE", "Culture preparation", "kg", 2, 500],
    ["FIBER", "Fiber preparation", "kg", 80, 5],
    ["STRAW-SHELL", "Strawberry shell", "kg", 150, 8],
    ["CREME", "Creme shell", "kg", 220, 8],
    ["DARK", "Dark shell", "kg", 420, 6],
    ["GRANOLA", "Granola", "kg", 120, 5],
    ["COOKIE", "Cookie inclusion", "kg", 180, 4],
    ["HONEY", "Honeycomb inclusion", "kg", 60, 6],
    ["STRAW", "Strawberry preparation", "kg", 90, 4],
    ["COFFEE", "Coffee preparation", "kg", 30, 20],
    ["VANILLA", "Vanilla preparation", "kg", 12, 50],
    ["PEANUT", "Peanut preparation", "kg", 60, 5],
  ].map(([id, name, unit, available, price]) => ({
    ...meta("SYNTHETIC INPUT", "SPEC-04.15", "A05"),
    id: String(id),
    name: String(name),
    unit: String(unit),
    available: Number(available),
    price: Number(price),
  })),
);
export const cartonStock = deepFreeze([
  3000, 3500, 1500, 1800, 1500, 1500, 1500, 1200,
]);
export const bom = deepFreeze(
  products.map((p, i) => ({
    ...meta("SYNTHETIC INPUT", "SPEC-04.14", "A05"),
    skuId: p.id,
    coefficients: {
      BASE: 0.08,
      "CUP-LID": 1,
      CULTURE: 0.00005,
      FIBER: 0.002,
      [i === 0 ? "STRAW-SHELL" : i === 1 ? "CREME" : "DARK"]: 0.015,
      [[
        "GRANOLA",
        "COOKIE",
        "HONEY",
        "STRAW",
        "COOKIE",
        "COFFEE",
        "VANILLA",
        "PEANUT",
      ][i]]: [0.012, 0.01, 0.01, 0.01, 0.01, 0.003, 0.001, 0.012][i],
    } as Record<string, number>,
    otherCost: [0.085, 0.005, 0.065, 0.085, 0.035, 0.065, 0.025, 0.065][i],
    otherAvailable: 20000,
  })),
);
export const purchaseOrders = deepFreeze(
  [
    ["AP-101", "Base mix", 11200, 3360, 7840],
    ["AP-102", "Cup/lid sets", 4000, 1200, 2800],
    ["AP-103", "Printed cartons", 800, 240, 560],
    ["AP-104", "Culture and fiber", 1400, 420, 980],
    ["AP-105", "Flavor components", 5550, 1665, 3885],
  ].map(([id, name, value, paid, balance]) => ({
    ...meta("SYNTHETIC INPUT", "SPEC-04.16", "A07"),
    id: String(id),
    name: String(name),
    value: Number(value),
    paid: Number(paid),
    balance: Number(balance),
    receiptDate: "2026-11-02",
    leadWeeks: 3,
  })),
);
export const poLines = deepFreeze(
  [
    { poId: "AP-101", componentId: "BASE", quantity: 3200 },
    { poId: "AP-102", componentId: "CUP-LID", quantity: 40000 },
    ...[1000, 2500, 2000, 1000, 1000, 500, 1500, 500].map((quantity, i) => ({
      poId: "AP-103",
      componentId: `CARTON-${products[i].id}`,
      quantity,
    })),
    { poId: "AP-104", componentId: "CULTURE", quantity: 2 },
    { poId: "AP-104", componentId: "FIBER", quantity: 80 },
    ...[
      "GRANOLA",
      "DARK",
      "CREME",
      "STRAW-SHELL",
      "COOKIE",
      "HONEY",
      "STRAW",
      "COFFEE",
      "VANILLA",
      "PEANUT",
    ].map((componentId, i) => ({
      poId: "AP-105",
      componentId,
      quantity: [60, 300, 150, 60, 100, 80, 60, 10, 6, 30][i],
    })),
  ].map((line) => ({
    ...meta("SYNTHETIC INPUT", "SPEC-04.16", "A07"),
    ...line,
    lineId: `${line.poId}-${line.componentId}`,
  })),
);
export const optionalPO = deepFreeze({
  ...meta("SYNTHETIC INPUT", "SPEC-04.16", "A10"),
  id: "AP-106",
  componentId: "GRANOLA",
  quantity: 60,
  value: 300,
  deposit: 90,
  balance: 210,
  earliestReceipt: "2026-10-26",
  cancellationTerms: null,
  status: "Uncommitted option",
});
export const payments = deepFreeze(
  [
    ["2026-10-23", "Reviewed conversion · 60%", "NEXT-WINDOW", 10920],
    ["2026-10-26", "CC04 transfer expense", "TRANSFER-CC04", 400],
    ["2026-10-30", "Reviewed conversion · balance", "NEXT-WINDOW", 7280],
    ["2026-11-02", "Existing component PO balances", "AP-101–AP-105", 16065],
    ["2026-11-13", "Bridge conversion · 60%", "BRIDGE", 10560],
    ["2026-11-20", "Bridge conversion · balance", "BRIDGE", 7040],
  ].map(([dueDate, label, commitmentId, amount]) => ({
    ...meta("SYNTHETIC INPUT", "SPEC-04.18", "A08"),
    dueDate: String(dueDate),
    paymentId: `${commitmentId}-${dueDate}`,
    label: String(label),
    commitmentId: String(commitmentId),
    amount: Number(amount),
  })),
);
export const allocation = deepFreeze({
  ...meta("SYNTHETIC INPUT", "SPEC-04.17", "A09"),
  skuId: "CC04",
  pools: [
    { id: "West", stock: 600, demand: 1800, buffer: 0 },
    { id: "East", stock: 3600, demand: 1000, buffer: 680 },
    { id: "Central", stock: 1800, demand: 1200, buffer: 0 },
  ],
  quantity: 1200,
  freight: 320,
  handling: 80,
  transitDays: 2,
  releaseDays: 1,
  departureDate: null,
  paymentDate: "2026-10-26",
});
export const lots = deepFreeze(
  products.flatMap((p) =>
    [0.4, 0.6].map((share, i) => ({
      ...meta("SYNTHETIC INPUT", "SPEC-04.10", "A06"),
      id: `${p.id}-LOT-${i + 1}`,
      skuId: p.id,
      quantity: p.opening * share,
      owner: "brand",
      location: p.id === "CC04" ? "CC04 worked regional scope" : null,
      packFormat: "retail-four-pack",
      expiry: i === 0 ? "2027-02-28" : "2027-03-31",
      qaStatus: "Saleable",
    })),
  ),
);
export const forecastLedger = deepFreeze(
  products.map((p, i) => ({
    ...meta("SYNTHETIC INPUT", "SPEC-04.19", "A11"),
    skuId: p.id,
    actual: historicAnchors.slice(4).map((r) => r[i]),
    naive: [
      [2800, 3200, 2800, 2500],
      [2600, 2500, 2400, 2400],
      [1900, 1600, 1600, 1600],
      [1600, 1400, 1400, 1400],
      [1300, 1000, 1000, 1000],
      [1000, 800, 800, 800],
      [900, 900, 900, 900],
      [700, 600, 600, 600],
    ][i],
    reviewed: [
      [2800, 2900, 2600, 2450],
      [2480, 2440, 2400, 2400],
      [1760, 1640, 1600, 1600],
      [1520, 1440, 1400, 1400],
      [1120, 1040, 1000, 1000],
      [920, 840, 800, 800],
      [900, 900, 900, 900],
      [640, 620, 600, 600],
    ][i],
    issuedAt: ["2026-09-07", "2026-09-14", "2026-09-21", "2026-09-28"],
    targetWeek: ["2026-09-14", "2026-09-21", "2026-09-28", "2026-10-05"],
    observedAt: ["2026-09-21", "2026-09-28", "2026-10-05", "2026-10-12"],
  })),
);
export const scenarios = deepFreeze([
  { id: "S0", label: "Reviewed baseline", detail: "Phase 1 reviewed mix" },
  {
    id: "S1",
    label: "Collaboration softens",
    detail: "Collaboration demand −20%",
  },
  {
    id: "S2",
    label: "Collaboration strengthens",
    detail: "Collaboration demand +25%",
  },
  {
    id: "S3",
    label: "Cookies & Cream accelerates",
    detail: "Cookies demand +20%",
  },
  {
    id: "S4",
    label: "Target requires stock earlier",
    detail: "Collaboration dispatch shifts earlier",
  },
  {
    id: "S5",
    label: "Base availability tightens",
    detail: "Available base −20%",
  },
  {
    id: "S6",
    label: "Hypothetical club order",
    detail: "New 8-cup pack requirement",
  },
  {
    id: "S7",
    label: "Release arrives one week late",
    detail: "Reviewed release moves to Week 4",
  },
]);
// Complete source-table metadata: values remain in the same immutable snapshot above.
export const planningWindow = deepFreeze({
  ...meta("SYNTHETIC INPUT", "SPEC-04.11", "A04"),
  id: "NEXT-WINDOW",
  start: "2026-10-19",
  end: "2026-10-23",
  releaseDate: "2026-10-26",
  releaseWeek: 3,
  availableHours: 40,
  goodCupsPerHour: 1200,
  minimumRun: 2000,
  quantityIncrement: 2000,
  changeoverHours: 0.5,
});
export const financePolicy = deepFreeze({
  ...meta("SYNTHETIC INPUT", "SPEC-04.18", "A08"),
  firstWindowCashLimit: 25000,
  materialsPreviouslyPaid: true,
});
export const materialTopups = deepFreeze(
  [
    ["BASE", 1000, 3500],
    ["CUP-LID", 12000, 1200],
    ["CULTURE", 1, 500],
    ["FIBER", 25, 125],
    ["GRANOLA", 60, 300],
    ["DARK", 60, 360],
    ["STRAW-SHELL", 60, 480],
  ].map(([componentId, quantity, value]) => ({
    ...meta("SYNTHETIC INPUT", "SPEC-04.18", "A05"),
    componentId: String(componentId),
    quantity: Number(quantity),
    value: Number(value),
    arrivalBeforeWindow: null,
  })),
);
export const productionCommitments = deepFreeze(
  products.flatMap((p, i) => [
    {
      ...meta("SYNTHETIC INPUT", "SPEC-04.11", "A04"),
      id: `REQUESTED-${p.id}`,
      skuId: p.id,
      cups: p.requested,
      releaseWeek: 3,
      status: "Uncommitted and infeasible",
    },
    {
      ...meta("ANALYST INTERPRETATION", "SPEC-04.11", "A17"),
      id: `REVIEWED-${p.id}`,
      skuId: p.id,
      cups: p.reviewed,
      releaseWeek: 3,
      status: "Proposed for client decision",
    },
    {
      ...meta("SYNTHETIC INPUT", "SPEC-04.12", "A07"),
      id: `BRIDGE-${p.id}`,
      skuId: p.id,
      cups: bridge[i],
      releaseWeek: 6,
      status: "Synthetic confirmed planning commitment",
    },
    ...(bridgeEarly[i]
      ? [
          {
            ...meta("SYNTHETIC INPUT", "SPEC-04.12", "A07"),
            id: `EARLY-${p.id}`,
            skuId: p.id,
            cups: bridgeEarly[i],
            releaseWeek: 5,
            status: "Synthetic confirmed dependency",
          },
        ]
      : []),
  ]),
);
export const retailReceipts = deepFreeze(
  cohorts.flatMap((c) =>
    c.receipts
      .map((cups, w) => ({
        ...meta("SYNTHETIC INPUT", "SPEC-04.08", "A01"),
        id:
          w === 0
            ? `LF-${c.id}`
            : `R-${c.id}${c.receipts.slice(1, w + 1).filter((q) => q > 0).length}`,
        skuId: "CC01",
        cohortId: c.id,
        type: w === 0 ? "Initial fill" : "Reorder",
        receivedWeek: ["2026-09-14", "2026-09-21", "2026-09-28", "2026-10-05"][
          w
        ],
        cups,
      }))
      .filter((r) => r.cups > 0),
  ),
);
export const evidenceDatasets = deepFreeze({
  retailerPOS: {
    ...meta("SYNTHETIC INPUT", "SPEC-04.04", "A01"),
    rows: latestRetail,
  },
  historicalPOS: {
    ...meta("SYNTHETIC INPUT", "SPEC-04.05", "A15"),
    rows: historicAnchors,
    earlierTotalCups: earlyTotals,
  },
  cohortMix: {
    ...meta("SYNTHETIC INPUT", "SPEC-04.06", "A15"),
    pre: preCohort,
    latest: latestCohort,
  },
  dispatchForecast: {
    ...meta("SYNTHETIC INPUT", "SPEC-04.09", "A03"),
    rows: forward,
    firmOrders: [],
    inventoryTargetsUnchanged: true,
  },
  componentBOM: { ...meta("SYNTHETIC INPUT", "SPEC-04.14", "A05"), rows: bom },
  packagingStock: {
    ...meta("SYNTHETIC INPUT", "SPEC-04.15", "A05"),
    cartons: cartonStock,
  },
  production: {
    ...meta("SYNTHETIC INPUT", "SPEC-04.11", "A04"),
    rows: productionCommitments,
  },
  forecast: {
    ...meta("SYNTHETIC INPUT", "SPEC-04.19", "A11"),
    rows: forecastLedger,
  },
  scenarios: {
    ...meta("SYNTHETIC INPUT", "SPEC-04.20", "A03"),
    rows: scenarios,
  },
});

export const dispatchRecords = deepFreeze(
  products.flatMap((p, sku) =>
    forward[sku].flatMap((central, week) =>
      ["Target", "Whole Foods", "Wegmans"].map((retailer, r) => ({
        ...meta("SYNTHETIC INPUT", "SPEC-04.09", "A03"),
        skuId: p.id,
        retailer,
        week: week + 1,
        central: sku === 0 ? (r === 0 ? central : 0) : latestRetail[sku][r],
        low:
          (sku === 0 ? (r === 0 ? central : 0) : latestRetail[sku][r]) *
          (sku === 0 ? 0.75 : 0.9),
        high:
          (sku === 0 ? (r === 0 ? central : 0) : latestRetail[sku][r]) *
          (sku === 0 ? 1.25 : 1.15),
        method:
          "Supplied central forecast; unchanged incumbent retailer quantities",
        version: "v1",
      })),
    ),
  ),
);

export const fixture = deepFreeze({
  metadata: meta(),
  products,
  latestRetail,
  preMix,
  historicAnchors,
  earlyTotals,
  preCohort,
  latestCohort,
  launchCohort,
  cohorts,
  forward,
  bridge,
  bridgeEarly,
  constrainedMix,
  components,
  cartonStock,
  bom,
  purchaseOrders,
  poLines,
  optionalPO,
  payments,
  allocation,
  lots,
  forecastLedger,
  scenarios,
  planningWindow,
  financePolicy,
  materialTopups,
  productionCommitments,
  retailReceipts,
  evidenceDatasets,
  dispatchRecords,
});
