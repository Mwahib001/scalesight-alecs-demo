import {
  allocation,
  bom,
  bridge,
  bridgeEarly,
  cartonStock,
  components,
  constrainedMix,
  deepFreeze,
  fixture,
  forecastLedger,
  forward,
  meta,
  materialTopups,
  payments,
  planningWindow,
  products,
  purchaseOrders,
  sum,
} from "../data/alecs.v1";
export { sum };
export type Exploration = {
  preset: string;
  demandChange: number;
  demandSku: number;
  timingShift: number;
  basePercent: number;
};
export const baselineExploration: Exploration = deepFreeze({
  preset: "S0",
  demandChange: 0,
  demandSku: 0,
  timingShift: 0,
  basePercent: 100,
});
export function preset(id: string): Exploration {
  return {
    ...baselineExploration,
    preset: id,
    ...({
      S1: { demandChange: -20 },
      S2: { demandChange: 25 },
      S3: { demandChange: 20, demandSku: 1 },
      S5: { basePercent: 80 },
      S7: { timingShift: 1 },
    }[id] ?? {}),
  };
}
export const isExploring = (s: Exploration) =>
  s.preset !== "S0" ||
  s.demandChange !== 0 ||
  s.timingShift !== 0 ||
  s.basePercent !== 100;
export function validate(s: Exploration) {
  if (
    !fixture.scenarios.some((x) => x.id === s.preset) ||
    !Number.isFinite(s.demandChange) ||
    s.demandChange < -30 ||
    s.demandChange > 40 ||
    !Number.isInteger(s.demandSku) ||
    s.demandSku < 0 ||
    s.demandSku > 7 ||
    !Number.isInteger(s.timingShift) ||
    s.timingShift < -2 ||
    s.timingShift > 4 ||
    !Number.isFinite(s.basePercent) ||
    s.basePercent < 0 ||
    s.basePercent > 120
  )
    throw new Error("Enter a value within the supported scenario range.");
}
export const ratio = (a: number, b: number) => (b === 0 ? null : a / b);
export const consumeForecast = (forecast: number, orders: number) =>
  orders + Math.max(0, forecast - orders);
export const caseRequirement = (cups: number) => ({
  cases: Math.ceil(cups / 24),
  executableCups: Math.ceil(cups / 24) * 24,
  residual: Math.ceil(cups / 24) * 24 - cups,
});
export function capacity(mix: readonly number[]) {
  const total = sum(mix),
    active = mix.filter((q) => q > 0).length;
  const runHours = total / planningWindow.goodCupsPerHour,
    changeoverHours = Math.max(0, active - 1) * planningWindow.changeoverHours;
  return {
    ...meta("DERIVED METRIC", "SPEC-04.11", "A04"),
    total,
    active,
    runHours,
    changeoverHours,
    totalHours: runHours + changeoverHours,
    feasible:
      runHours + changeoverHours <= planningWindow.availableHours &&
      mix.every(
        (q) =>
          q === 0 ||
          (q >= planningWindow.minimumRun &&
            q % planningWindow.quantityIncrement === 0),
      ),
  };
}
export function componentCoverage(mix: readonly number[], basePercent = 100) {
  return components.map((c) => {
    const required = sum(
      bom.map((b, i) => mix[i] * (b.coefficients[c.id] ?? 0)),
    );
    const available = c.available * (c.id === "BASE" ? basePercent / 100 : 1);
    return {
      ...c,
      ...meta("DERIVED METRIC", "SPEC-04.14", "A05"),
      required,
      available,
      shortage: Math.max(0, required - available),
    };
  });
}
export function economics(mix: readonly number[]) {
  const materials = sum(mix.map((q, i) => q * products[i].material)),
    conversion = sum(mix.map((q, i) => q * products[i].conversion));
  return {
    ...meta("DERIVED METRIC", "SPEC-04.18", "A08"),
    materials,
    conversion,
    productionCost: materials + conversion,
  };
}
export function forecastMetrics(
  actual: readonly number[],
  forecast: readonly number[],
) {
  const total = sum(actual);
  const absoluteError = sum(actual.map((a, i) => Math.abs(forecast[i] - a))),
    signedError = sum(actual.map((a, i) => forecast[i] - a));
  return {
    ...meta("DERIVED METRIC", "SPEC-04.19", "A11"),
    total,
    absoluteError,
    signedError,
    wape: ratio(absoluteError, total),
    bias: ratio(signedError, total),
  };
}
export function portfolioForecast(method: "naive" | "reviewed") {
  return forecastMetrics(
    forecastLedger.flatMap((r) => r.actual),
    forecastLedger.flatMap((r) => r[method]),
  );
}
export function bufferAt(
  demand: readonly number[],
  week: number,
  policy: number,
) {
  const full = Math.floor(policy),
    fraction = policy - full;
  if (week + full + (fraction > 0 ? 1 : 0) >= demand.length) return null;
  return (
    sum(demand.slice(week + 1, week + 1 + full)) +
    (fraction ? demand[week + 1 + full] * fraction : 0)
  );
}
export function calculate(
  s: Exploration = baselineExploration,
  option: "reviewed" | "requested" | "none" = "reviewed",
  horizon = 8,
) {
  validate(s);
  if (![8, 13].includes(horizon)) throw new Error("Unsupported horizon");
  const mix =
    option === "none"
      ? products.map(() => 0)
      : option === "requested"
        ? products.map((p) => p.requested)
        : s.preset === "S5"
          ? [...constrainedMix]
          : products.map((p) => p.reviewed);
  const cap = capacity(mix),
    coverage = componentCoverage(mix, s.basePercent);
  const violations: string[] = [];
  if (!cap.feasible)
    violations.push(
      "Line hours or run increments exceed the available constraint.",
    );
  coverage
    .filter((c) => c.shortage > 1e-8)
    .forEach((c) =>
      violations.push(
        `${c.name}: ${c.shortage.toLocaleString("en-US")} ${c.unit} short before the production window.`,
      ),
    );
  mix.forEach((q, i) => {
    if (q / 4 > cartonStock[i])
      violations.push(
        `${products[i].id}: compatible printed cartons are insufficient.`,
      );
    if (q > 20000)
      violations.push(`${products[i].id}: other ingredient kit insufficient.`);
  });
  if (s.timingShift < 0 && option !== "none")
    violations.push(
      "Earlier release requires production and QA timing review; the current window does not establish this supply.",
    );
  const manufacturingFeasible = violations.length === 0;
  if (s.preset === "S6")
    violations.push(
      "Blocked pending pack compatibility, permissions and supply review.",
    );
  const skuWeek = products.map((p, i) => {
    const demand = forward[i].map(
      (q) => q * (s.demandSku === i ? 1 + s.demandChange / 100 : 1),
    );
    if (s.preset === "S4" && i === 0) {
      demand[0] += demand[1];
      demand[1] = 0;
    }
    let stock = p.opening;
    const weeks = Array.from({ length: horizon }, (_, w) => {
      // Infeasible output is never introduced as physical stock. Bridge is a separate supplied commitment.
      const receipts =
        (manufacturingFeasible && w === 2 + s.timingShift ? mix[i] : 0) +
        (w === 4 ? bridgeEarly[i] : 0) +
        (w === 5 ? bridge[i] : 0);
      const available = stock + receipts,
        required = demand[w],
        served = Math.min(required, available),
        unmet = required - served;
      stock = available - served;
      return {
        ...meta("DERIVED METRIC", "SPEC-04.21", "A03"),
        week: w + 1,
        required,
        receipts,
        served,
        unmet,
        closing: stock,
        buffer: bufferAt(demand, w, p.bufferWeeks),
      };
    });
    return {
      ...meta("DERIVED METRIC", "SPEC-04.21", "A16"),
      skuId: p.id,
      weeks,
      unmet: sum(weeks.map((w) => w.unmet)),
      closing: stock,
      firstShortage: weeks.find((w) => w.unmet > 0)?.week ?? null,
      firstBufferBreach:
        weeks.find((w) => w.buffer !== null && w.closing < w.buffer)?.week ??
        null,
    };
  });
  const costs = economics(mix),
    futureCash = sum(payments.map((p) => p.amount)),
    previouslyPaid = sum(purchaseOrders.map((p) => p.paid));
  return {
    ...meta("DERIVED METRIC", "SPEC-04.21"),
    snapshotId: fixture.metadata.snapshotId,
    scenario: s,
    option,
    mix,
    capacity: cap,
    components: coverage,
    economics: costs,
    skuWeek,
    portfolio: {
      ...meta("DERIVED METRIC", "SPEC-04.21", "A03"),
      required: sum(skuWeek.flatMap((p) => p.weeks.map((w) => w.required))),
      served: sum(skuWeek.flatMap((p) => p.weeks.map((w) => w.served))),
      unmet: sum(skuWeek.map((p) => p.unmet)),
      closing: sum(skuWeek.map((p) => p.closing)),
    },
    cash: {
      ...meta("DERIVED METRIC", "SPEC-04.18", "A08"),
      baselineFutureCash: futureCash,
      previouslyPaid,
      firstWindow:
        costs.conversion +
        (option === "requested"
          ? sum(materialTopups.map((p) => p.value))
          : allocation.freight + allocation.handling),
      exploratoryPaymentDates: isExploring(s) ? null : payments,
    },
    violations,
    manufacturingFeasible,
    blocked: s.preset === "S6",
    clubRequirement:
      s.preset === "S6"
        ? {
            cups: 4000,
            packs: 500,
            cupsPerPack: 8,
            compatibleSupply: null,
            served: null,
            unmet: null,
          }
        : null,
    recommendationStatus: isExploring(s) ? "exploratory" : "reviewed-baseline",
  };
}
export const reviewedBaseline = deepFreeze(calculate());
export const launchSummary = deepFreeze({
  ...meta("DERIVED METRIC", "SPEC-04.04", "A12"),
  pre: sum(fixture.preMix),
  latest: sum(fixture.latestRetail.map((r) => r[0])),
  collaboration: fixture.latestRetail[0][0],
  growth: sum(fixture.latestRetail.map((r) => r[0])) - sum(fixture.preMix),
  incumbentMovement:
    sum(fixture.latestRetail.slice(1).map((r) => r[0])) - sum(fixture.preMix),
  counterfactual: sum(
    fixture.cohorts.map((c) => (c.pre * c.control) / c.controlPre),
  ),
});
export function transferCheck(
  departure: string | null,
  skuId = "CC04",
  destination = "Target",
  pack = "retail-four-pack",
) {
  const compatible =
    skuId === "CC04" && pack === "retail-four-pack" && destination === "Target";
  const date = departure ? new Date(`${departure}T00:00:00Z`) : null;
  const validDate =
    date &&
    !Number.isNaN(date.getTime()) &&
    date.toISOString().slice(0, 10) === departure;
  const arrival = validDate
    ? new Date(date.getTime() + 3 * 86400000).toISOString().slice(0, 10)
    : null;
  // W1 West need is 900; 600 opening cannot satisfy the first weekly requirement. Check against W1 end; intraweek depletion is unspecified.
  const arrivalBeforeNeed = arrival
    ? arrival <= "2026-10-18" && departure !== null && departure >= "2026-10-12"
    : null;
  return {
    ...meta("DERIVED METRIC", "SPEC-04.17", "A09"),
    compatible,
    arrival,
    arrivalBeforeNeed,
    donorResidual:
      allocation.pools[1].stock -
      allocation.pools[1].demand -
      allocation.pools[1].buffer -
      allocation.quantity,
    networkStock: sum(allocation.pools.map((p) => p.stock)),
    expense: allocation.freight + allocation.handling,
    status: !compatible
      ? "Blocked"
      : arrival === null
        ? "Timing unresolved"
        : arrivalBeforeNeed
          ? "Candidate · intraweek depletion requires validation"
          : "Infeasible timing",
  };
}
export type RawRecord = {
  id: string;
  skuId?: string;
  unit?: string;
  quantity?: number;
  availableDays?: number;
  pos?: number;
  eta?: string | null;
  issuedAt?: string;
  targetWeek?: string;
  paid?: boolean;
};
export function validateRaw(records: RawRecord[]) {
  const seen = new Set<string>();
  return records.map((r) => {
    let issue: string | null = null;
    if (seen.has(r.id)) issue = "Duplicate receipt";
    else if (r.skuId && !products.some((p) => p.id === r.skuId))
      issue = "Unknown SKU";
    else if (r.unit && !["cups", "four-packs", "cases"].includes(r.unit))
      issue = "Unit mismatch";
    else if (r.pos && r.availableDays === 0) issue = "Impossible availability";
    else if (r.quantity !== undefined && r.quantity < 0)
      issue = "Negative physical stock";
    else if ("eta" in r && r.eta === null) issue = "Missing PO ETA";
    else if (r.issuedAt && r.targetWeek && r.issuedAt >= r.targetWeek)
      issue = "Forecast leakage";
    else if (r.paid) issue = "Previously paid: exclude from future cash";
    seen.add(r.id);
    return { record: r, issue, excluded: issue !== null };
  });
}
export const requiredReceipts = (
  consumerDemand: number,
  targetEndingRetailStock: number,
  openingRetailStock: number,
) => Math.max(0, consumerDemand + targetEndingRetailStock - openingRetailStock);
export function forwardCover(
  stock: number,
  demand: readonly number[],
): number | null {
  if (stock < 0 || demand.some((d) => d < 0))
    throw new Error("Invalid cover inputs");
  let remaining = stock,
    cover = 0;
  for (const d of demand) {
    if (d === 0) {
      cover++;
      continue;
    }
    if (remaining < d) return cover + remaining / d;
    remaining -= d;
    cover++;
  }
  return remaining === 0 ? cover : null;
}
export function convertToCups(
  quantity: number,
  unit: "cups" | "four-packs" | "cases",
) {
  if (quantity < 0 || !Number.isInteger(quantity))
    throw new Error("Physical movements require nonnegative integer units");
  return quantity * { cups: 1, "four-packs": 4, cases: 24 }[unit];
}
export function lotEligible(
  lot: (typeof fixture.lots)[number],
  requirement: {
    skuId: string;
    retailer: string;
    packFormat: string;
    needDate: string;
  },
) {
  return (
    lot.owner === "brand" &&
    lot.qaStatus === "Saleable" &&
    lot.skuId === requirement.skuId &&
    lot.packFormat === requirement.packFormat &&
    lot.expiry >= requirement.needDate &&
    (lot.skuId !== "CC01" || requirement.retailer === "Target")
  );
}
export function allocateLots(
  candidates: readonly (typeof fixture.lots)[number][],
  quantity: number,
  requirement: Parameters<typeof lotEligible>[1],
) {
  if (quantity < 0 || quantity % 4 !== 0)
    throw new Error("Actual retail movements require complete four-packs");
  let remaining = quantity;
  const allocations = candidates
    .filter((l) => lotEligible(l, requirement))
    .slice()
    .sort(
      (a, b) => a.expiry.localeCompare(b.expiry) || a.id.localeCompare(b.id),
    )
    .map((l) => {
      const cups = Math.min(remaining, l.quantity);
      remaining -= cups;
      return { lotId: l.id, cups };
    })
    .filter((l) => l.cups > 0);
  return { allocations, unserved: remaining };
}

export function pooledObservedVelocity(
  rows: readonly { cups: number; availableDays: number }[],
) {
  return {
    ...meta("DERIVED METRIC", "SPEC-04.19", "A11"),
    cups: sum(rows.map((r) => r.cups)),
    availableStoreWeeks: sum(rows.map((r) => r.availableDays)) / 7,
    velocity: ratio(
      sum(rows.map((r) => r.cups)),
      sum(rows.map((r) => r.availableDays)) / 7,
    ),
  };
}
export function reconcileForecast(
  rows: readonly { skuId: string; retailer: string; central: number }[],
) {
  const bySKU: Record<string, number> = {},
    byRetailer: Record<string, number> = {};
  for (const row of rows) {
    bySKU[row.skuId] = (bySKU[row.skuId] ?? 0) + row.central;
    byRetailer[row.retailer] = (byRetailer[row.retailer] ?? 0) + row.central;
  }
  return {
    ...meta("DERIVED METRIC", "SPEC-04.19", "A03"),
    bySKU,
    byRetailer,
    portfolio: sum(rows.map((r) => r.central)),
  };
}
