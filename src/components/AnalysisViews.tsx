"use client";
import { useState } from "react";
import { ArrowRight } from "lucide-react";
import {
  cohorts,
  forecastLedger,
  latestRetail,
  forward,
  financePolicy,
  missing,
  optionalPO,
  payments,
  products,
  purchaseOrders,
  scenarios,
  sum,
} from "../data/alecs.v1";
import {
  baselineExploration,
  calculate,
  economics,
  forecastMetrics,
  forwardCover,
  isExploring,
  pooledObservedVelocity,
  portfolioForecast,
  preset,
  reviewedBaseline,
  validate,
  type Exploration,
} from "../engine/alecs";
import {
  ContextLink,
  EvidenceButton,
  Heading,
  NextLink,
  ProductSelect,
  ProductVisual,
  Review,
  Table,
  money,
  n,
  useWorkspace,
  useInvestigationState,
} from "./Workspace";
import { CashTimeline, ForecastChart, StockChart } from "./PlanningCharts";
import { evidence, productEvidence } from "./evidence";
import { rawInputFeed } from "../data/raw-input.v1";
import { validateRaw } from "../engine/alecs";
export function Cash() {
  const { result, scenario } = useWorkspace();
  const [view, setView] = useInvestigationState("cashView", "cash", [
    "cash",
    "cost",
  ]);
  const reviewed = reviewedBaseline,
    requested = economics(products.map((p) => p.requested)),
    requestedCash = calculate(baselineExploration, "requested").cash
      .firstWindow,
    total = sum(payments.map((p) => p.amount)),
    deposits = sum(purchaseOrders.map((p) => p.paid));
  return (
    <>
      <Heading
        eyebrow="PRODUCTION COMMITMENTS / CASH EXPOSURE"
        title="What does this decision commit - and when does cash leave?"
        description="Separate the cost of production from the payments still ahead."
      />
      <div className="toolbar">
        <div className="segmented">
          <button
            aria-pressed={view === "cash"}
            onClick={() => setView("cash")}
          >
            Future cash
          </button>
          <button
            aria-pressed={view === "cost"}
            onClick={() => setView("cost")}
          >
            Production cost
          </button>
        </div>
        <ContextLink to="/scenarios">
          Compare scenario consequences →
        </ContextLink>
      </div>
      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>
              {view === "cash"
                ? "Cash has a calendar."
                : "Cost measures what the run consumes."}
            </h2>
            <span>Reviewed baseline · USD · eight-week horizon</span>
          </div>
          <EvidenceButton
            evidence={evidence(
              "Production cost, future cash and previously paid materials",
              "Reviewed next window and eight-week payment schedule",
              {
                payments,
                reviewedCost: reviewed.economics,
                previouslyPaid: deposits,
                firstWindowCash: reviewed.cash.firstWindow,
              },
              "Production cost = material consumption + conversion. Future cash = unpaid PO balances + future conversion + transfer. 18,200 + 400 + 16,065 + 17,600 = 52,265.",
              {
                sourceId: "SPEC-04.18 / A08",
                assumptions:
                  "Opening materials were paid before the snapshot. PO deposits of $6,885 are excluded. AP-106 is uncommitted.",
                constraints:
                  "Requested cash is at least $29,965 before recovery costs and transfer; requested production remains infeasible.",
                unknown:
                  "Payment timing for changed exploratory production, recovery costs and AP-106 cancellation/refund terms.",
              },
            )}
          />
        </div>
        {view === "cash" ? (
          <CashTimeline payments={payments} />
        ) : (
          <>
            <div className="equal-col">
              <div className="window-summary" style={{ marginTop: 0 }}>
                <p className="eyebrow">REQUESTED · INFEASIBLE</p>
                <div className="stat">{money(requested.productionCost)}</div>
                <p className="small">
                  Materials {money(requested.materials)} + conversion{" "}
                  {money(requested.conversion)}
                </p>
              </div>
              <div
                className="window-summary"
                style={{ marginTop: 0, background: "#EAF0E4" }}
              >
                <p className="eyebrow">REVIEWED CANDIDATE</p>
                <div className="stat">
                  {money(reviewed.economics.productionCost)}
                </div>
                <p className="small">
                  Materials {money(reviewed.economics.materials)} + conversion{" "}
                  {money(reviewed.economics.conversion)}
                </p>
              </div>
            </div>
            <p className="chart-note">
              The reviewed mix has{" "}
              {money(
                requested.productionCost - reviewed.economics.productionCost,
              )}{" "}
              lower modeled production-cost exposure. That is not the same as
              $13,200 in cash savings.
            </p>
          </>
        )}
        <div className="mini-stats">
          <div>
            <span>Eight-week future cash</span>
            <strong>{money(total)}</strong>
          </div>
          <div>
            <span>First-window future cash</span>
            <strong>{money(reviewed.cash.firstWindow)}</strong>
          </div>
          <div>
            <span>First-window cash headroom</span>
            <strong>
              {money(
                financePolicy.firstWindowCashLimit - reviewed.cash.firstWindow,
              )}
            </strong>
          </div>
        </div>
        <p className="chart-note">
          Previously paid component deposits: {money(deposits)}, excluded from
          future payments. Materials consumed and procurement payments are never
          counted twice.
        </p>
      </section>
      <div className="section-title">
        <h2>Cost and cash are different comparisons.</h2>
      </div>
      <Table
        headers={["Measure", "Requested", "Reviewed"]}
        rows={[
          [
            "Modeled production cost",
            money(requested.productionCost),
            money(reviewed.economics.productionCost),
          ],
          [
            "First-window future cash",
            "At least " + money(requestedCash) + " *",
            money(reviewed.cash.firstWindow),
          ],
          [
            "First-window cash limit",
            money(financePolicy.firstWindowCashLimit),
            money(financePolicy.firstWindowCashLimit),
          ],
          [
            "Optional AP-106",
            "Uncommitted",
            money(optionalPO.value) + " · excluded",
          ],
        ]}
      />
      <p className="chart-note">
        * Requested option excludes recovery costs such as expediting, overtime,
        extra capacity and transfer. Component top-up arrival before the window
        is not established.
      </p>
      {isExploring(scenario) && (
        <section className="warning">
          <strong>Exploratory cash and service consequence</strong>
          <p>
            Candidate modeled production cost:{" "}
            {money(result.economics.productionCost)}. Modeled conversion
            expenditure: {money(result.economics.conversion)}.
          </p>
          <p>
            {n(result.portfolio.unmet)} cups unserved;{" "}
            {money(
              sum(result.skuWeek.map((r, i) => r.unmet * products[i].revenue)),
            )}{" "}
            modeled unserved-dispatch revenue exposure.
          </p>
          <p>
            Changed payment dates: {missing}. The dated timeline above remains
            the reviewed baseline. It is not a new payment commitment.
          </p>
        </section>
      )}
      <div className="section-title">
        <h2>Inventory exposure alongside the payment comparison</h2>
        <span>
          {isExploring(scenario) ? "Exploration" : "Reviewed baseline"}
        </span>
      </div>
      <Table
        headers={[
          "Product",
          "Closing stock · cups",
          "Forward closing cover · weeks",
          "Unserved cups",
          "Net revenue / cup assumption",
          "Revenue exposure",
        ]}
        rows={result.skuWeek.map((r, i) => [
          <ContextLink key={r.skuId} to="/production" sku={i}>
            {products[i].name}
          </ContextLink>,
          n(r.closing),
          forwardCover(
            r.closing,
            forward[i]
              .slice(8)
              .map(
                (q) =>
                  q *
                  (scenario.demandSku === i
                    ? 1 + scenario.demandChange / 100
                    : 1),
              ),
          ) === null
            ? "Beyond supplied horizon"
            : forwardCover(
                r.closing,
                forward[i]
                  .slice(8)
                  .map(
                    (q) =>
                      q *
                      (scenario.demandSku === i
                        ? 1 + scenario.demandChange / 100
                        : 1),
                  ),
              )!.toFixed(1),
          n(r.unmet),
          products[i].revenue.toFixed(2),
          money(r.unmet * products[i].revenue),
        ])}
      />
      <p className="chart-note">
        Net revenue per delivered cup is synthetic brand revenue, not shelf
        price. Exposure is not guaranteed lost revenue, profit or recovered
        sales.
      </p>
      <Review decision="Which feasible option uses new cash in a way the demand evidence supports?">
        <p>
          The reviewed mix has $13,200 lower modeled production-cost exposure.
          That is not the same as $13,200 in cash savings.
        </p>
        <p>
          Avoid celebrating lower cash if it creates an unacceptable service
          shortfall.
        </p>
      </Review>
      <NextLink to="/managed-intelligence">
        See how this comparison stays current →
      </NextLink>
    </>
  );
}
export function ForecastLearning() {
  const { sku } = useWorkspace();
  const ledger = forecastLedger[sku],
    naive = portfolioForecast("naive"),
    reviewed = portfolioForecast("reviewed"),
    selectedNaive = forecastMetrics(ledger.actual, ledger.naive),
    selectedReviewed = forecastMetrics(ledger.actual, ledger.reviewed);
  return (
    <>
      <Heading
        eyebrow="ANALYTICAL REVIEW / FORECAST LEARNING"
        title="Which signals should change the next planning assumption?"
        description="Review forecast differences alongside the demand signals that could change a commitment."
      />
      <div className="toolbar">
        <ProductSelect />
        <EvidenceButton
          evidence={productEvidence(
            sku,
            "Forecast ledger and evaluation",
            "Target consumer POS and archived forecasts · 14 September–11 October 2026",
            { ...ledger },
            "WAPE = Σ|forecast − actual| / Σactual. Signed bias = Σ(forecast − actual) / Σactual. Return null if total actual is zero.",
            {
              sourceId: "SPEC-04.19 / A11 / SPEC-10.D",
              assumptions:
                "Synthetic archived forecasts. Technical issue dates use prior-week date; actual observed after target week. No fitted model replaces these supplied paths.",
              unknown:
                "Actual historical forecast issues, commercial-event context and a validated real model.",
            },
          )}
        />
      </div>
      <div className="two-col">
        <section className="panel">
          <div className="panel-header">
            <div>
              <h2>{products[sku].name}</h2>
              <span>Actual POS versus archived forecasts · Target panel</span>
            </div>
          </div>
          <ForecastChart ledger={ledger} />
          <p className="chart-note">
            Availability-normalized Target velocity:{" "}
            {n(
              pooledObservedVelocity(
                sku === 0
                  ? cohorts.map((c) => ({
                      cups: c.launch,
                      availableDays: c.availableDays,
                    }))
                  : [{ cups: latestRetail[sku][0], availableDays: 120 * 7 }],
              ).velocity,
            )}{" "}
            cups per available store-week. Pooled selling exposure is an
            observed calculation; it does not automatically recover lost demand.
          </p>
          <p className="chart-note">
            Calculated from the synthetic demonstration ledger. These are not
            measured ScaleSight client results.
          </p>
        </section>
        <section className="panel">
          <p className="eyebrow">PORTFOLIO BENCHMARK</p>
          <h2>Compare with a simple baseline.</h2>
          <Table
            headers={["Metric", "Naive", "Illustrative reviewed"]}
            rows={[
              [
                "WAPE",
                ((naive.wape ?? 0) * 100).toFixed(2) + "%",
                ((reviewed.wape ?? 0) * 100).toFixed(2) + "%",
              ],
              [
                "Signed bias",
                ((naive.bias ?? 0) * 100).toFixed(2) + "%",
                ((reviewed.bias ?? 0) * 100).toFixed(2) + "%",
              ],
              [
                "Absolute error · cups",
                n(naive.absoluteError),
                n(reviewed.absoluteError),
              ],
            ]}
          />
          <p>
            {sku === 6
              ? "Vanilla: both supplied methods have zero error. A simple baseline can remain appropriate."
              : "Forecast error and business decision quality are related but different. A better forecast still needs a feasible response."}
          </p>
          <p className="chart-note">
            Selected SKU WAPE:{" "}
            {selectedNaive.wape === null
              ? "Not calculable"
              : (selectedNaive.wape * 100).toFixed(2) + "%"}{" "}
            naive /{" "}
            {selectedReviewed.wape === null
              ? "Not calculable"
              : (selectedReviewed.wape * 100).toFixed(2) + "%"}{" "}
            reviewed.
          </p>
        </section>
      </div>
      <div className="section-title">
        <h2>Chronology stays visible</h2>
        <span>Issue before target week · observation after week end</span>
      </div>
      <Table
        headers={[
          "Target week",
          "Synthetic issued date",
          "Actual observed date",
          "Actual cups",
          "Naive cups",
          "Reviewed cups",
        ]}
        rows={ledger.actual.map((a, i) => [
          ledger.targetWeek[i],
          ledger.issuedAt[i],
          ledger.observedAt[i],
          n(a),
          n(ledger.naive[i]),
          n(ledger.reviewed[i]),
        ])}
      />
      <div className="equal-col" style={{ marginTop: 24 }}>
        <section className="panel topics">
          <h2>What might change the assumption?</h2>
          {[
            [
              "Availability",
              "Low sales can reflect limited selling opportunity.",
            ],
            [
              "Launch age",
              "Early consumption may not persist at the same rate.",
            ],
            [
              "Portfolio movement",
              "New-SKU growth may accompany changes elsewhere.",
            ],
            [
              "Retailer behavior",
              "Receipt timing can differ from consumer demand.",
            ],
            [
              "Supply timing",
              "A better forecast still needs a feasible response.",
            ],
          ].map(([title, text]) => (
            <details key={title}>
              <summary>{title}</summary>
              <p>{text}</p>
            </details>
          ))}
        </section>
        <section className="panel">
          <h2>Methods and their status</h2>
          <Table
            headers={["Method", "Demo status"]}
            rows={[
              ["Availability normalization", "Implemented demo calculation"],
              ["Forecast-error comparison", "Implemented demo calculation"],
              ["Counterfactual comparison", "Illustrative analytical method"],
              ["Supplied forecast paths", "Synthetic archived inputs"],
              ["Hierarchical ML / clustering", "Proposed method"],
            ]}
          />
          <p className="chart-note">
            This method is proposed for a real-data investigation. The current
            demo uses the labeled synthetic comparison.
          </p>
          <details className="input-checks">
            <summary>Illustrative input validation</summary>
            <p className="chart-note">
              Separate synthetic raw-input feed. Excluded records never enter
              operating totals; current metadata replaces the stale description.
            </p>
            <Table
              caption="Synthetic import validation results"
              headers={["Record", "Validation", "Treatment"]}
              rows={validateRaw(rawInputFeed).map((r) => [
                r.record.id,
                r.issue ??
                  `Valid ${n(r.normalizedCups)} cups after explicit case conversion`,
                r.excluded
                  ? "Excluded / investigate"
                  : r.issue
                    ? "Current source used; discrepancy retained"
                    : "Accepted test record only",
              ])}
            />
          </details>
        </section>
      </div>
      <Review decision="Is the difference material enough to change quantities, timing or the next investigation?">
        <p>
          A model must be compared with a baseline. Sparse launch history needs
          pooling and judgment. A forecast improvement is useful only if it
          changes a feasible commitment.
        </p>
      </Review>
      <NextLink to="/scenarios">
        Test what would change the commitment →
      </NextLink>
    </>
  );
}
export function ScenarioLab() {
  const { sku, scenario, setScenario, result } = useWorkspace();
  const [error, setError] = useState(""),
    [horizon, setHorizon] = useInvestigationState(
      "scenarioHorizon",
      8,
      [8, 13],
    );
  const r = horizon === 8 ? result : calculate(scenario, "reviewed", 13);
  function change(patch: Partial<Exploration>) {
    try {
      const s = { ...scenario, ...patch };
      validate(s);
      setScenario(s);
      setError("");
    } catch (e) {
      setError((e as Error).message);
    }
  }
  return (
    <>
      <Heading
        eyebrow="ANALYTICAL REVIEW / SCENARIO LAB"
        title="What would change the recommendation?"
        description="Explore demand and supply changes before a commitment is locked."
      />
      <div className="scenario-grid">
        {scenarios.map((s) => (
          <button
            key={s.id}
            className="scenario-option"
            aria-label={s.label}
            aria-describedby={`scenario-${s.id}-description`}
            aria-pressed={scenario.preset === s.id}
            onClick={() => {
              setScenario(preset(s.id));
              setError("");
            }}
          >
            <strong>{s.label}</strong>
            <span id={`scenario-${s.id}-description`}>{s.detail}</span>
          </button>
        ))}
      </div>
      <div className="toolbar">
        <ProductSelect />
        <div className="segmented">
          <button aria-pressed={horizon === 8} onClick={() => setHorizon(8)}>
            8 weeks
          </button>
          <button aria-pressed={horizon === 13} onClick={() => setHorizon(13)}>
            13 weeks
          </button>
        </div>
        <button
          className="button light"
          onClick={() => {
            setScenario({ ...baselineExploration });
            setError("");
          }}
        >
          Reset baseline
        </button>
      </div>
      <div className="controls">
        <label>
          Demand change · {products[scenario.demandSku].short} ·{" "}
          {scenario.demandChange > 0 ? "+" : ""}
          {scenario.demandChange}%
          <select
            aria-label="Demand adjustment product"
            value={scenario.demandSku}
            onChange={(e) => change({ demandSku: Number(e.target.value) })}
          >
            {products.map((p, i) => (
              <option key={p.id} value={i}>
                {p.name}
              </option>
            ))}
          </select>
          <input
            aria-label="Demand change percentage"
            type="range"
            min={-30}
            max={40}
            step={1}
            value={scenario.demandChange}
            onChange={(e) => change({ demandChange: Number(e.target.value) })}
          />
          <span>−30% to +40% · technical scenario bounds</span>
        </label>
        <label>
          Reviewed release shift · {scenario.timingShift} week(s)
          <input
            aria-label="Receipt timing shift"
            type="number"
            min={-2}
            max={4}
            step={1}
            value={scenario.timingShift}
            onChange={(e) => change({ timingShift: Number(e.target.value) })}
          />
          <span>−2 to +4 weeks · earlier releases need feasibility review</span>
        </label>
        <label>
          Base availability · {scenario.basePercent}%
          <input
            aria-label="Component availability percentage"
            type="range"
            min={0}
            max={120}
            value={scenario.basePercent}
            onChange={(e) => change({ basePercent: Number(e.target.value) })}
          />
          <span>0% to 120% of baseline · no hidden supply</span>
        </label>
      </div>
      {error && (
        <p className="warning" role="alert">
          {error}
        </p>
      )}
      {r.blocked && (
        <div className="warning danger-box">
          <strong>
            ! Blocked pending pack compatibility, permissions and supply review.
          </strong>
          <p>
            Hypothetical 4,000 cups / 500 eight-cup club packs. Distinct club
            carton and packing requirement; no approved conversion from retail
            four-packs.
          </p>
          <p>
            The metrics below cover existing retail operations only. Compatible
            club supply, served quantity and unmet quantity: {missing}.
          </p>
          <ContextLink to="/allocation">
            Inspect the pack restriction →
          </ContextLink>
        </div>
      )}
      {r.violations.length > 0 && !r.blocked && (
        <div className="warning danger-box">
          <strong>
            ! This option exceeds the available constraint. Review the
            highlighted requirement before treating it as executable.
          </strong>
          <ul>
            {r.violations.map((v) => (
              <li key={`${v.ruleId}:${v.entityId}`}>{v.explanation}</li>
            ))}
          </ul>
        </div>
      )}
      <section className="window-summary">
        <div className="summary-title">
          <strong>
            {isExploring(scenario) ? "SIMULATED OUTCOME" : "REVIEWED BASELINE"}{" "}
            · W1–W{horizon}
          </strong>
          <span>
            {r.blocked
              ? "Existing retail plan · additional club requirement blocked"
              : r.manufacturingFeasible
                ? "Manufacturing candidate passes supplied constraints"
                : "First-window supply blocked by constraints"}
          </span>
        </div>
        <div className="metric-strip">
          <div>
            <strong>
              {n(r.portfolio.unmet)}
              <small> cups</small>
            </strong>
            <span>Operating-panel unserved requirement</span>
          </div>
          <div>
            <strong>
              {n(r.portfolio.closing)}
              <small> cups</small>
            </strong>
            <span>Ending physical inventory</span>
          </div>
          <div>
            <strong>
              {r.capacity.totalHours.toFixed(2)}
              <small> h</small>
            </strong>
            <span>Candidate line time</span>
          </div>
          <div>
            <strong>
              {n(r.capacity.total)}
              <small> cups</small>
            </strong>
            <span>Candidate output</span>
          </div>
        </div>
      </section>
      <section className="panel" style={{ marginTop: 24 }}>
        <div className="panel-header">
          <div>
            <h2>{products[sku].name} · the timing of supply matters.</h2>
            <span>Aggregate SKU · brand-owned stock · simulated cups</span>
          </div>
          <EvidenceButton
            evidence={productEvidence(
              sku,
              "Scenario inventory and constraint simulation",
              `Aggregate brand-owned stock · W1–W${horizon} · 12 October 2026–${horizon === 8 ? "6 December 2026" : "10 January 2027"}`,
              {
                scenario,
                mix: r.mix,
                projection: r.skuWeek[sku].weeks,
                violations: r.violations,
              },
              "Apply scenario to canonical inputs, validate hours/components/release dates, then simulate each period. Late supply does not serve past unmet dispatch.",
              {
                sourceId: "SPEC-04.20 / SPEC-04.21",
                assumptions:
                  "Unmet dispatch is unserved in its own period, not automatically backlogged. Bridge receipts retain supplied timing.",
                constraints:
                  r.violations.map((v) => v.explanation).join(" ") ||
                  "Base, pack, hours and reviewed release checked. Regional transfer timing remains conditional.",
                unknown:
                  "Changed payment timing and specialist/client review of any new recommendation.",
              },
            )}
          />
        </div>
        <StockChart row={r.skuWeek[sku]} />
      </section>
      <p className="warning">
        More ending stock does not undo demand that could not be served earlier.
      </p>
      <Table
        headers={[
          "Week",
          "Required cups",
          "Released cups",
          "Served cups",
          "Unserved cups",
          "Closing cups",
          "Buffer cups",
        ]}
        rows={r.skuWeek[sku].weeks.map((w) => [
          "W" + w.week,
          n(w.required),
          n(w.receipts),
          n(w.served),
          n(w.unmet),
          n(w.closing),
          w.buffer === null ? "Incomplete horizon" : n(w.buffer),
        ])}
      />
      <div className="section-title">
        <h2>Trace the response to the cause</h2>
      </div>
      <div className="equal-col">
        <section className="panel">
          <h2>What needs investigation?</h2>
          <p>
            First shortage for {products[sku].id}:{" "}
            {r.skuWeek[sku].firstShortage
              ? "W" + r.skuWeek[sku].firstShortage
              : "none in this projection"}
            . First buffer breach:{" "}
            {r.skuWeek[sku].firstBufferBreach
              ? "W" + r.skuWeek[sku].firstBufferBreach
              : "none in complete periods"}
            .
          </p>
          <p>
            {scenario.preset === "S2"
              ? "Producing more in W3 alone does not resolve the W2 shortage."
              : scenario.preset === "S3"
                ? "A larger quantity released in W3 still arrives too late."
                : scenario.preset === "S5"
                  ? "The 32,000-cup mix is a feasible manufacturing candidate, not a commercially optimal recommendation."
                  : "Review timing, compatible supply and competing commitments before adding total output."}
          </p>
          <div className="stack" style={{ gap: 8, marginTop: 16 }}>
            <ContextLink to="/production">
              Run timing and capacity →
            </ContextLink>
            <ContextLink to="/components">Component shortage →</ContextLink>
            <ContextLink to="/allocation">
              Compatible stock elsewhere →
            </ContextLink>
            <ContextLink to="/cash">Payment impact →</ContextLink>
            <ContextLink to="/cohorts">Demand evidence →</ContextLink>
          </div>
        </section>
        <section className="panel">
          <h2>Cash is a separate review.</h2>
          <p>
            Candidate modeled production cost:{" "}
            {money(r.economics.productionCost)}.<br />
            Conversion expenditure: {money(r.economics.conversion)}.
          </p>
          <p>
            Reviewed baseline future payments:{" "}
            {money(reviewedBaseline.cash.baselineFutureCash)}.
          </p>
          <p className="chart-note">
            Changed scenario payment dates:{" "}
            {isExploring(scenario) ? missing : "See reviewed payment schedule"}.
            No new PO, approval or payment commitment is created.
          </p>
        </section>
      </div>
      <Review decision="What would change the recommendation - and which response addresses the actual cause?">
        <p>
          Candidate for investigation. Specialist review and client context are
          required before changing the commitment.
        </p>
        <p>
          Stronger demand before W3 requires timing intervention. More line time
          may not help if components are unavailable.
        </p>
      </Review>
      <NextLink to="/production">
        Review the candidate production response →
      </NextLink>
    </>
  );
}
export function ManagedPlanning() {
  const [discuss, setDiscuss] = useState(false);
  const steps = [
    [
      "Receive the operating picture",
      "Sales, stock, incoming supply, production timing, component availability and commercial plans.",
    ],
    [
      "Investigate the signal",
      "The collaboration sells strongly, while incumbent sales and store cohorts move differently.",
    ],
    [
      "Compare feasible options",
      "Requested 12,000-cup collaboration run versus an 8,000-cup candidate within the broader production mix.",
    ],
    [
      "Review the consequences",
      "Supply-chain review checks service exposure, components, line time, timing and cash.",
    ],
    [
      "Bring the decision to Alec’s",
      "A short recommendation covering proposed quantities, timing, evidence, assumptions, cash implications and what still requires client judgment.",
    ],
    [
      "Review the next cycle",
      "Refresh the evidence and investigate whether a change is warranted.",
    ],
  ];
  return (
    <>
      <Heading
        eyebrow="SCALESIGHT SERVICE / MANAGED PLANNING"
        title="The analysis stays current. Your team keeps the decision."
        description="ScaleSight maintains the forecasts, investigates the exceptions and prepares the comparisons around your next commitment."
      />
      <div className="section-title">
        <h2>One collaboration. The complete planning work.</h2>
        <span>Worked service example · illustrative</span>
      </div>
      <div className="service-flow">
        {steps.map(([title, text], i) => (
          <section className="service-step" key={title}>
            <span>0{i + 1}</span>
            <h3>{title}</h3>
            <p>{text}</p>
          </section>
        ))}
      </div>
      <div className="equal-col" style={{ marginTop: 25 }}>
        <section className="panel">
          <div className="product-detail">
            <ProductVisual index={0} />
            <div>
              <p className="eyebrow">PREPARED RECOMMENDATION / D01</p>
              <h2>Breakfast collaboration</h2>
            </div>
          </div>
          <p>
            Compare an 8,000-cup commitment with the larger request. The
            reviewed quantity fits the current window while retaining an
            evidence review before deeper expansion.
          </p>
          <p>
            <strong>Evidence</strong>
            <br />
            Launch consumption, portfolio movement, cohort differences and
            component availability.
          </p>
          <p>
            <strong>Client context needed</strong>
            <br />
            Retailer commitments, supplier constraints and production conditions
            not represented in this illustrative dataset.
          </p>
          <p className="status warning">
            Illustrative proposal. No client decision recorded.
          </p>
          <EvidenceButton
            evidence={productEvidence(
              0,
              "Prepared illustrative collaboration recommendation",
              "Target launch evidence · 14 September–11 October 2026; production candidate · 19–23 October 2026",
              {
                signal:
                  "Strong launch sales alongside weaker incumbent movement.",
                optionsCompared: [
                  12000,
                  8000,
                  "Component reservation",
                  "Later expansion after another evidence cycle",
                ],
                recommendedAction:
                  "Compare feasible partial run and review additional depth",
                quantity: 8000,
                nextReviewDate: null,
                clientQuestion:
                  "Are there retailer commitments or supplier constraints not represented in these assumptions?",
                reviewIdentity: null,
              },
              "Compare retail evidence, availability, receipt cycles, production feasibility and cash. No automatic recommendation change from exploration.",
              {
                evidenceClass: "ANALYST INTERPRETATION",
                sourceId: "SPEC-06.11 / A17",
                unknown:
                  "Real retailer commitments, supplier constraints, review identities, approvals and next review date.",
              },
            )}
          />
        </section>
        <section className="panel">
          <h2>Clear ownership.</h2>
          <Table
            headers={[
              "ScaleSight maintains",
              "Alec’s contributes and controls",
            ]}
            rows={[
              [
                "Forecasts and analytical comparisons",
                "Commercial plans and operating context",
              ],
              ["Demand investigations", "Final quantities and commitments"],
              ["Scenario analysis", "Supplier and retailer relationships"],
              [
                "Reviewed recommendations",
                "Execution through existing systems",
              ],
              ["Recurring decision brief", "Final commercial judgment"],
            ]}
          />
          <p className="chart-note">
            ScaleSight prepares the analysis and recommendations. Alec’s
            supplies context, makes the final decisions and executes through its
            existing systems.
          </p>
        </section>
      </div>
      <section className="pilot">
        <div>
          <p className="eyebrow">A FOCUSED PLANNING PILOT</p>
          <h2>Start with one commitment.</h2>
          <p>
            A focused 30-day planning pilot could examine one upcoming Culture
            Cup production window using agreed real inputs. We would maintain
            the comparison and bring your team a reviewed recommendation with
            quantities, timing, assumptions and cash implications.
          </p>
        </div>
        <button
          className="button"
          aria-expanded={discuss}
          onClick={() => setDiscuss(!discuss)}
        >
          Discuss a production commitment <ArrowRight size={16} />
        </button>
      </section>
      {discuss && (
        <section className="panel" style={{ marginTop: 16 }}>
          <h2>One upcoming Culture Cup production window.</h2>
          <p>
            With real inputs, we would maintain this comparison alongside your
            team and bring back the decisions that deserve attention.
          </p>
          <p>
            No booking destination is supplied. This explanatory panel does not
            record a booking or client approval.
          </p>
        </section>
      )}
      <Review decision="Are there retailer commitments or supplier constraints not represented in these assumptions?">
        <p>
          ScaleSight prepares the analysis and recommendations. Alec’s supplies
          context, makes the final decisions and executes through its existing
          systems.
        </p>
      </Review>
      <NextLink to="/">Return to the Weekly Decision Brief →</NextLink>
    </>
  );
}
