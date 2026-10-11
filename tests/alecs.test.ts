import { strict as assert } from "node:assert";
import { test } from "node:test";
import { existsSync, readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { gunzipSync } from "node:zlib";
import {
  allocation,
  dispatchRecords,
  bom,
  bridge,
  bridgeEarly,
  cohorts,
  fixture,
  forecastLedger,
  latestCohort,
  latestRetail,
  lots,
  optionalPO,
  payments,
  preCohort,
  products,
  purchaseOrders,
  sum,
} from "../src/data/alecs.v1";
import {
  allocateLots,
  baselineExploration,
  bufferAt,
  convertToCups,
  forwardCover,
  lotEligible,
  requiredReceipts,
  calculate,
  capacity,
  caseRequirement,
  componentCoverage,
  consumeForecast,
  economics,
  forecastMetrics,
  isExploring,
  launchSummary,
  pooledObservedVelocity,
  portfolioForecast,
  reconcileForecast,
  preset,
  ratio,
  reviewedBaseline,
  transferCheck,
  validate,
  validateRaw,
} from "../src/engine/alecs";
import {
  allocate,
  generatePanel,
  targetHistory,
  weeks,
} from "../src/engine/panel";
const approx = (a: number, b: number) =>
  assert.ok(Math.abs(a - b) < 1e-7, `${a} != ${b}`);
test("canonical scope and launch arithmetic reconcile", () => {
  assert.equal(sum(latestRetail.flat()), 13600);
  assert.equal(sum(latestRetail.map((r) => r[0])), 11100);
  assert.equal(sum(latestRetail.slice(1).map((r) => r[0])), 8700);
  assert.equal(launchSummary.pre, 10000);
  assert.equal(launchSummary.growth, 1100);
  assert.equal(launchSummary.incumbentMovement, -1300);
  assert.equal(launchSummary.counterfactual, 10300);
  assert.equal(sum(cohorts.map((c) => c.latest)), 11100);
  assert.equal(launchSummary.latest - launchSummary.counterfactual, 800);
});
test("retail receipts and consumer POS reconcile independently from brand stock", () => {
  assert.equal(sum(cohorts.flatMap((c) => c.receipts)), 14880);
  assert.equal(sum(cohorts.flatMap((c) => c.pos)), 10900);
  assert.deepEqual(
    cohorts.map((c) => sum(c.receipts) - sum(c.pos)),
    [2384, 136, 232, 1228],
  );
  assert.equal(sum(products.map((p) => p.opening)), 42000);
  assert.equal(sum(cohorts.map((c) => sum(c.receipts) - sum(c.pos))), 3980);
});
test("production windows use active-run changeovers and supplied rates", () => {
  approx(
    capacity(products.map((p) => p.requested)).totalHours,
    52000 / 1200 + 3.5,
  );
  assert.equal(capacity(products.map((p) => p.requested)).feasible, false);
  approx(
    capacity(products.map((p) => p.reviewed)).totalHours,
    40000 / 1200 + 3.5,
  );
  assert.equal(capacity(products.map((p) => p.reviewed)).feasible, true);
  assert.equal(capacity([2000, 0, 0]).changeoverHours, 0);
  assert.equal(capacity([1000]).feasible, false);
  assert.equal(capacity([3000]).feasible, false);
  assert.equal(sum(bridge) + sum(bridgeEarly), 40000);
  approx(40000 / 1200 + 8 * 0.5, 37.333333333333336);
});
test("reviewed components reconcile without double counting base ingredients", () => {
  const c = componentCoverage(products.map((p) => p.reviewed));
  approx(c.find((c) => c.id === "BASE")!.required, 3200);
  assert.equal(c.find((c) => c.id === "CUP-LID")!.required, 40000);
  assert.equal(c.find((c) => c.id === "GRANOLA")!.required, 96);
  assert.ok(c.every((c) => c.shortage < 1e-7));
  assert.equal(bom[0].coefficients.GRANOLA * 12000, 144);
  assert.equal(bom[0].coefficients["STRAW-SHELL"] * 12000, 180);
});
test("cost and future cash use different ledgers", () => {
  const reviewed = economics(products.map((p) => p.reviewed)),
    requested = economics(products.map((p) => p.requested));
  approx(reviewed.materials, 25500);
  approx(reviewed.conversion, 18200);
  approx(reviewed.productionCost, 43700);
  approx(requested.productionCost, 56900);
  assert.equal(sum(payments.map((p) => p.amount)), 52265);
  assert.equal(sum(purchaseOrders.map((p) => p.balance)), 16065);
  assert.equal(sum(purchaseOrders.map((p) => p.paid)), 6885);
  assert.equal(reviewedBaseline.cash.firstWindow, 18600);
  assert.equal(optionalPO.status, "Uncommitted option");
  assert.ok(!payments.some((p) => p.commitmentId === optionalPO.id));
});
const expected = [
  [0, 16800],
  [0, 19920],
  [2700, 15600],
  [1200, 13200],
  [0, 16800],
  [4000, 12800],
  [null, null],
  [6300, 23100],
];
for (let i = 0; i < 8; i++)
  test(`scenario S${i} canonical numerical outcome and nonnegative stock`, () => {
    const r = calculate(preset("S" + i));
    if (i === 6) {
      assert.equal(r.blocked, true);
      assert.ok(r.violations.some((v) => v.includes("pack")));
    } else {
      approx(r.portfolio.unmet, expected[i][0]!);
      approx(r.portfolio.closing, expected[i][1]!);
    }
    assert.ok(
      r.skuWeek.every((s) =>
        s.weeks.every((w) => w.closing >= 0 && w.served >= 0 && w.unmet >= 0),
      ),
    );
    assert.equal(r.portfolio.served + r.portfolio.unmet, r.portfolio.required);
  });
test("all eight canonical inventory trajectories match the source", () => {
  const matrix = [
    [2400, 100, 5900, 3900, 2100, 4400, 2800, 1200],
    [3000, 0, 9000, 6000, 3000, 10000, 7000, 4000],
    [2800, 800, 2800, 800, 800, 4800, 2800, 800],
    [4000, 2000, 6000, 4000, 2000, 4000, 2000, 0],
    [6000, 4800, 5600, 4400, 3200, 6000, 4800, 3600],
    [3800, 2800, 3800, 2800, 1800, 2800, 1800, 800],
    [2400, 1200, 4000, 2800, 1600, 6400, 5200, 4000],
    [4000, 3200, 4400, 3600, 2800, 4000, 3200, 2400],
  ];
  assert.deepEqual(
    reviewedBaseline.skuWeek.map((r) => r.weeks.map((w) => w.closing)),
    matrix,
  );
  assert.equal(reviewedBaseline.portfolio.required, 105200);
  assert.equal(
    42000 + 40000 + 40000 - reviewedBaseline.portfolio.served,
    16800,
  );
});
test("no reviewed run exposes 28,600 unmet cups", () => {
  assert.equal(calculate(baselineExploration, "none").portfolio.unmet, 28600);
});
test("late supply cannot retroactively serve earlier unmet demand", () => {
  const r = calculate(preset("S7"));
  assert.equal(r.portfolio.unmet, 6300);
  assert.ok(r.portfolio.closing > reviewedBaseline.portfolio.closing);
  const strong = calculate(preset("S2"));
  assert.equal(strong.skuWeek[0].weeks[1].unmet, 1075);
  assert.equal(strong.skuWeek[0].weeks[7].unmet, 1625);
});
test("infeasible requested mix does not acquire fictional physical supply", () => {
  const r = calculate(baselineExploration, "requested");
  assert.equal(r.manufacturingFeasible, false);
  assert.ok(r.violations.some((v) => v.includes("Line hours")));
  assert.ok(r.violations.some((v) => v.includes("Dairy")));
  assert.equal(r.skuWeek[0].weeks[2].receipts, 0);
});
test("bounded overrides reject invalid values and do not silently clamp", () => {
  for (const overrides of [
    { demandChange: 41 },
    { demandChange: -31 },
    { basePercent: 121 },
    { basePercent: -1 },
    { timingShift: 5 },
    { timingShift: -3 },
    { timingShift: 0.5 },
    { demandSku: 8 },
    { demandChange: NaN },
  ])
    assert.throws(
      () => validate({ ...baselineExploration, ...overrides }),
      /supported scenario range/,
    );
});
test("source and reviewed baseline remain immutable across all explorations", () => {
  const before = JSON.stringify(fixture),
    review = JSON.stringify(reviewedBaseline);
  for (let i = 0; i < 8; i++) calculate(preset("S" + i));
  assert.equal(JSON.stringify(fixture), before);
  assert.equal(JSON.stringify(reviewedBaseline), review);
  assert.ok(Object.isFrozen(fixture.products[0]));
  assert.equal(isExploring(baselineExploration), false);
  assert.equal(calculate(preset("S2")).recommendationStatus, "exploratory");
  assert.equal(
    calculate(baselineExploration).recommendationStatus,
    "reviewed-baseline",
  );
});
test("forecast orders consume forecast and zero denominators return null", () => {
  assert.equal(consumeForecast(2400, 1200), 2400);
  assert.equal(consumeForecast(2400, 3000), 3000);
  assert.equal(ratio(1, 0), null);
  assert.equal(forecastMetrics([0], [2]).wape, null);
});
test("forecast ledger evaluation, chronology and Vanilla baseline", () => {
  const a = portfolioForecast("naive"),
    b = portfolioForecast("reviewed");
  assert.equal(a.total, 45800);
  assert.equal(a.absoluteError, 2500);
  assert.equal(b.absoluteError, 1450);
  assert.equal(a.signedError, 1700);
  assert.equal(b.signedError, 610);
  assert.equal((a.wape! * 100).toFixed(2), "5.46");
  assert.equal((b.wape! * 100).toFixed(2), "3.17");
  for (const l of forecastLedger)
    l.actual.forEach((_, i) => {
      assert.ok(l.issuedAt[i] < l.targetWeek[i]);
      assert.ok(l.observedAt[i] > l.targetWeek[i]);
    });
  assert.equal(
    forecastMetrics(forecastLedger[6].actual, forecastLedger[6].naive)
      .absoluteError,
    0,
  );
});
test("allocation conserves network stock and retains donor protection", () => {
  const t = transferCheck(null);
  assert.equal(t.donorResidual, 720);
  assert.equal(t.networkStock, 6000);
  assert.equal(t.expense, 400);
  assert.equal(t.arrivalBeforeNeed, null);
  assert.equal(t.status, "Timing unresolved");
  assert.equal(allocation.paymentDate, "2026-10-26");
  assert.equal(transferCheck("2026-10-12").arrival, "2026-10-15");
  assert.equal(transferCheck("2026-10-23").arrivalBeforeNeed, false);
  assert.equal(
    transferCheck("2026-10-12", "CC01", "Whole Foods").compatible,
    false,
  );
  assert.equal(
    transferCheck("2026-10-12", "CC04", "Target", "club-eight-pack").compatible,
    false,
  );
});
test("saleable lot ownership and pack constraints stay explicit", () => {
  for (const p of products) {
    const ls = lots.filter((l) => l.skuId === p.id);
    assert.equal(sum(ls.map((l) => l.quantity)), p.opening);
    assert.ok(
      ls.every(
        (l) =>
          l.owner === "brand" &&
          l.packFormat === "retail-four-pack" &&
          l.qaStatus === "Saleable",
      ),
    );
  }
  assert.equal(lots.find((l) => l.skuId === "CC02")!.location, null);
});
test("case rounding residual and forward buffers are exposed", () => {
  assert.deepEqual(caseRequirement(8000), {
    cases: 334,
    executableCups: 8016,
    residual: 16,
  });
  assert.equal(bufferAt([2400, 2300, 2200, 2000], 0, 1.5), 3400);
  assert.equal(bufferAt([2400, 2300], 0, 2), null);
  assert.equal(
    calculate(baselineExploration, "reviewed", 13).skuWeek[0].weeks.length,
    13,
  );
});
test("separate raw-input quality feed excludes errors", () => {
  const r = validateRaw([
    { id: "1", skuId: "CC01" },
    { id: "1" },
    { id: "2", skuId: "UNKNOWN" },
    { id: "3", unit: "pallets" },
    { id: "4", pos: 4, availableDays: 0 },
    { id: "5", eta: null },
    { id: "6", quantity: -1 },
    { id: "7", issuedAt: "2026-10-13", targetWeek: "2026-10-12" },
    { id: "8", paid: true },
  ]);
  assert.equal(r.filter((r) => r.excluded).length, 8);
  assert.equal(fixture.products.length, 8);
});
const panel = generatePanel();
test("panel generator deterministic, unique and dense", () => {
  assert.equal(panel.length, 44800);
  assert.equal(JSON.stringify(panel), JSON.stringify(generatePanel()));
  assert.equal(
    new Set(panel.map((r) => r.storeId + r.skuId + r.week)).size,
    44800,
  );
  assert.equal(
    panel.filter((r) => r.operatingOrControl === "control").length,
    9600,
  );
  assert.ok(
    panel.every(
      (r) =>
        Number.isInteger(r.packsSold) &&
        r.packsSold >= 0 &&
        r.cupsSold === r.packsSold * 4,
    ),
  );
  assert.ok(panel.every((r) => r.listed || r.packsSold === 0));
  assert.ok(panel.every((r) => !r.packsSold || r.availableDays > 0));
  assert.ok(
    panel.every(
      (r) =>
        r.evidenceClass === "SYNTHETIC INPUT" &&
        r.promoFlag === null &&
        r.priceIndex === null,
    ),
  );
  assert.deepEqual(allocate(1, ["A", "B"], [1, 1]), [1, 0]);
});
test("generated panel preserves all weekly retailer-SKU totals", () => {
  const history = targetHistory();
  for (let w = 0; w < 20; w++)
    for (let i = 0; i < 8; i++) {
      const rows = panel.filter(
        (r) =>
          r.week === weeks[w] &&
          r.skuId === products[i].id &&
          r.operatingOrControl === "operating",
      );
      assert.equal(
        sum(rows.filter((r) => r.retailer === "Target").map((r) => r.cupsSold)),
        history[w][i],
      );
      assert.equal(
        sum(
          rows
            .filter((r) => r.retailer === "Whole Foods")
            .map((r) => r.cupsSold),
        ),
        latestRetail[i][1],
      );
      assert.equal(
        sum(
          rows.filter((r) => r.retailer === "Wegmans").map((r) => r.cupsSold),
        ),
        latestRetail[i][2],
      );
    }
});
test("generated cohort matrices, availability and controls reconcile", () => {
  for (let c = 0; c < 4; c++) {
    for (let i = 0; i < 8; i++) {
      const rows = panel.filter(
        (r) =>
          r.retailer === "Target" &&
          r.operatingOrControl === "operating" &&
          r.cohort === cohorts[c].id &&
          r.skuId === products[i].id,
      );
      assert.equal(
        sum(rows.filter((r) => r.week === "2026-10-05").map((r) => r.cupsSold)),
        latestCohort[c][i],
      );
      assert.equal(
        sum(rows.filter((r) => r.week === "2026-09-07").map((r) => r.cupsSold)),
        preCohort[c][i],
      );
    }
    const latest = panel.filter(
      (r) => r.week === "2026-10-05" && r.cohort === cohorts[c].id,
    );
    assert.equal(
      sum(
        latest
          .filter(
            (r) => r.skuId === "CC01" && r.operatingOrControl === "operating",
          )
          .map((r) => r.availableDays),
      ),
      cohorts[c].availableDays,
    );
    assert.equal(
      sum(
        latest
          .filter((r) => r.operatingOrControl === "control")
          .map((r) => r.cupsSold),
      ),
      cohorts[c].control,
    );
  }
  assert.equal(
    sum(
      panel
        .filter(
          (r) => r.skuId === "CC01" && r.operatingOrControl === "operating",
        )
        .map((r) => r.cupsSold),
    ),
    10900,
  );
});
test("generated artifact checksum and packaging image mapping", () => {
  const bytes = gunzipSync(
    readFileSync("src/data/generated/store-panel.json.gz"),
  );
  const manifest = JSON.parse(
    readFileSync("src/data/generated/manifest.json", "utf8"),
  );
  assert.equal(
    createHash("sha256").update(bytes).digest("hex"),
    manifest.sha256,
  );
  assert.equal(manifest.rows, 44800);
  for (const p of products) assert.ok(existsSync("public" + p.imageSrc));
  assert.equal(products[0].imageSrc, "/brand/cc5.webp");
  assert.equal(products[5].imageSrc, "/brand/cc1.webp");
});
test("club pack blockage does not delete compatible baseline operations", () => {
  const r = calculate(preset("S6"));
  assert.equal(r.portfolio.closing, 16800);
  assert.equal(r.clubRequirement!.compatibleSupply, null);
  assert.equal(r.clubRequirement!.served, null);
});

test("physical unit conversion, oldest eligible lot allocation and incompatible destinations", () => {
  assert.equal(convertToCups(50, "cases"), 1200);
  assert.equal(convertToCups(12, "four-packs"), 48);
  assert.throws(() => convertToCups(1.5, "four-packs"));
  const requirement = {
    skuId: "CC01",
    retailer: "Target",
    packFormat: "retail-four-pack",
    needDate: "2026-10-12",
  };
  const a = allocateLots(lots, 2400, requirement);
  assert.equal(a.allocations[0].lotId, "CC01-LOT-1");
  assert.equal(a.allocations[0].cups, 1920);
  assert.equal(a.allocations[1].cups, 480);
  assert.equal(a.unserved, 0);
  assert.equal(
    allocateLots(lots, 2400, { ...requirement, retailer: "Whole Foods" })
      .unserved,
    2400,
  );
  assert.equal(
    lotEligible(lots[0], { ...requirement, needDate: "2027-03-01" }),
    false,
  );
});
test("forward cover follows demand sequence and retail requirements respect ownership", () => {
  assert.equal(forwardCover(4700, [2400, 2300, 2200]), 2);
  assert.equal(forwardCover(5800, [2400, 2300, 2200]), 2.5);
  assert.equal(forwardCover(8000, [1000, 1000]), null);
  assert.equal(requiredReceipts(2400, 3980, 3980), 2400);
});

test("requested cash includes prescribed purchasing multiples and keeps recovery costs unresolved", () => {
  assert.equal(
    calculate(baselineExploration, "requested").cash.firstWindow,
    29965,
  );
});

test("availability pooling and hierarchical totals reconcile without fitted-model claims", () => {
  const p = pooledObservedVelocity(
    cohorts.map((c) => ({ cups: c.launch, availableDays: c.availableDays })),
  );
  assert.equal(p.cups, 2400);
  assert.equal(p.velocity, 21.875);
  assert.equal(pooledObservedVelocity([]).velocity, null);
  const r = reconcileForecast(dispatchRecords.filter((r) => r.week === 1));
  assert.equal(r.portfolio, 13600);
  assert.deepEqual(r.byRetailer, {
    Target: 11100,
    "Whole Foods": 1640,
    Wegmans: 860,
  });
  assert.equal(r.bySKU.CC01, 2400);
  for (let w = 1; w <= 13; w++)
    assert.equal(
      reconcileForecast(dispatchRecords.filter((r) => r.week === w)).portfolio,
      sum(fixture.forward.map((r) => r[w - 1])),
    );
});
