import {
  cohorts,
  earlyTotals,
  historicAnchors,
  latestCohort,
  latestRetail,
  launchCohort,
  meta,
  preCohort,
  preMix,
  products,
  sum,
} from "../data/alecs.v1";
export const generationVersion = "LCG-241-LR-v1";
export function allocate(
  total: number,
  ids: readonly string[],
  weights: readonly number[],
) {
  if (!Number.isInteger(total) || total < 0)
    throw new Error("Pack total must be a nonnegative integer");
  const denominator = sum(weights);
  if (!denominator) return ids.map(() => 0);
  const q = weights.map((w) => Math.floor((total * w) / denominator));
  const ranked = ids
    .map((id, i) => ({ id, i, remainder: (total * weights[i]) % denominator }))
    .sort((a, b) => b.remainder - a.remainder || a.id.localeCompare(b.id));
  const residual = total - sum(q);
  for (let i = 0; i < residual; i++) q[ranked[i].i]++;
  return q;
}
export const weeks = Array.from({ length: 20 }, (_, i) =>
  new Date(Date.UTC(2026, 4, 25 + i * 7)).toISOString().slice(0, 10),
);
export function targetHistory() {
  return [
    ...earlyTotals.map((total) =>
      allocate(
        total / 4,
        products.map((p) => p.id),
        preMix,
      ).map((p) => p * 4),
    ),
    ...historicAnchors,
  ];
}
export function generatePanel() {
  const stores = [
    ...Array.from({ length: 120 }, (_, i) => ({
      id: `T${String(i + 1).padStart(3, "0")}`,
      retailer: "Target",
      cohort: Math.floor(i / 30),
      control: false,
    })),
    ...Array.from({ length: 60 }, (_, i) => ({
      id: `TC${String(i + 1).padStart(3, "0")}`,
      retailer: "Target",
      cohort: Math.floor(i / 15),
      control: true,
    })),
    ...Array.from({ length: 60 }, (_, i) => ({
      id: `WF${String(i + 1).padStart(3, "0")}`,
      retailer: "Whole Foods",
      cohort: null,
      control: false,
    })),
    ...Array.from({ length: 40 }, (_, i) => ({
      id: `WG${String(i + 1).padStart(3, "0")}`,
      retailer: "Wegmans",
      cohort: null,
      control: false,
    })),
  ].sort((a, b) => a.id.localeCompare(b.id));
  let state = 241;
  const weights = new Map(
    stores.map((s) => {
      state = (Math.imul(1664525, state) + 1013904223) >>> 0;
      return [s.id, 50 + (state % 101)];
    }),
  );
  const history = targetHistory();
  const rows: StoreWeek[] = [];
  for (let w = 0; w < 20; w++)
    for (let sku = 0; sku < 8; sku++) {
      const targetCohorts =
        sku === 0
          ? w < 16
            ? [0, 0, 0, 0]
            : launchCohort[w - 16]
          : allocate(
              history[w][sku] / 4,
              ["A", "B", "C", "D"],
              (w < 16 ? preCohort : latestCohort).map((r) => r[sku]),
            ).map((p) => p * 4);
      const groups = [
        ...cohorts.map((_, c) => ({
          ids: stores.filter(
            (s) => !s.control && s.retailer === "Target" && s.cohort === c,
          ),
          cups: targetCohorts[c],
        })),
        ...cohorts.map((c, ci) => {
          const totalPacks =
            w < 16
              ? 250
              : 250 + Math.round(((c.control / 4 - 250) * (w - 15)) / 4);
          return {
            ids: stores.filter((s) => s.control && s.cohort === ci),
            cups:
              allocate(
                totalPacks,
                products.map((p) => p.id),
                preMix,
              )[sku] * 4,
          };
        }),
        {
          ids: stores.filter((s) => s.retailer === "Whole Foods"),
          cups: latestRetail[sku][1],
        },
        {
          ids: stores.filter((s) => s.retailer === "Wegmans"),
          cups: latestRetail[sku][2],
        },
      ];
      for (const group of groups) {
        const packs = allocate(
          group.cups / 4,
          group.ids.map((s) => s.id),
          group.ids.map((s) => weights.get(s.id)!),
        );
        group.ids.forEach((store, i) => {
          const listed =
            sku !== 0 ||
            (store.retailer === "Target" && !store.control && w >= 16);
          const days =
            sku === 0 && w === 19 && store.cohort !== null && !store.control
              ? Math.floor(cohorts[store.cohort].availableDays / 30) +
                (i < cohorts[store.cohort].availableDays % 30 ? 1 : 0)
              : 7;
          rows.push({
            ...meta(
              "SYNTHETIC INPUT",
              "SPEC-10.C",
              "A15",
              "Fixed LCG weights; largest remainder ties by stable ID; controlled exposure; null commercial context.",
            ),
            generationVersion,
            storeId: store.id,
            skuId: products[sku].id,
            week: weeks[w],
            retailer: store.retailer,
            cohort: store.cohort === null ? null : cohorts[store.cohort].id,
            operatingOrControl: store.control ? "control" : "operating",
            packsSold: packs[i],
            cupsSold: packs[i] * 4,
            listed,
            availableDays: listed ? days : 0,
            promoFlag: null,
            priceIndex: null,
          });
        });
      }
    }
  return rows;
}
export type StoreWeek = ReturnType<typeof meta> & {
  generationVersion: string;
  storeId: string;
  skuId: string;
  week: string;
  retailer: string;
  cohort: string | null;
  operatingOrControl: string;
  packsSold: number;
  cupsSold: number;
  listed: boolean;
  availableDays: number;
  promoFlag: null;
  priceIndex: null;
};
