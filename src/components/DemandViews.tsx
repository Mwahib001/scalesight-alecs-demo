"use client";
import { useState } from "react";
import { Check, CircleHelp } from "lucide-react";
import {
  cohorts,
  latestCohort,
  preCohort,
  historicAnchors,
  sum,
} from "../data/alecs.v1";
import { launchSummary, ratio } from "../engine/alecs";
import {
  CohortSelect,
  ContextLink,
  EvidenceButton,
  Heading,
  NextLink,
  ProductSelect,
  Review,
  Table,
  n,
  useWorkspace,
} from "./Workspace";
import { evidence, productEvidence } from "./evidence";
import { Waterfall } from "./PlanningCharts";
export function Incrementality() {
  const [view, setView] = useState("observed");
  const { sku } = useWorkspace();
  const s = launchSummary;
  return (
    <>
      <Heading
        eyebrow="DEMAND EVIDENCE / LAUNCH INCREMENTALITY"
        title="Is the collaboration growing Culture Cup - or changing the flavor mix?"
        description="Strong launch sales can lead to different production decisions depending on what happens across the portfolio."
      />
      <div className="toolbar">
        <div className="segmented">
          <button
            aria-pressed={view === "observed"}
            onClick={() => setView("observed")}
          >
            Observed movement
          </button>
          <button
            aria-pressed={view === "counterfactual"}
            onClick={() => setView("counterfactual")}
          >
            Counterfactual estimate
          </button>
        </div>
        <ProductSelect />
      </div>
      <div className="two-col">
        <section className="panel">
          <div className="panel-header">
            <div>
              <h2>
                {view === "observed"
                  ? "A launch is only part of the story."
                  : "A comparison, with explicit assumptions."}
              </h2>
              <span>
                Target launch panel · 120 synthetic stores · cups / week
              </span>
            </div>
          </div>
          {view === "observed" ? (
            <>
              <Waterfall
                pre={s.pre}
                launch={s.collaboration}
                incumbent={s.incumbentMovement}
                latest={s.latest}
              />
              <p className="chart-note">
                The new SKU sells 2,400 cups, but the observed operating
                portfolio grows by 1,100. It does not establish that 1,300 cups
                were causally cannibalized.
              </p>
            </>
          ) : (
            <>
              <div className="mini-stats">
                <div>
                  <span>Modeled no-launch portfolio</span>
                  <strong>{n(s.counterfactual)}</strong>
                </div>
                <div>
                  <span>Observed Target portfolio</span>
                  <strong>{n(s.latest)}</strong>
                </div>
                <div>
                  <span>Associated difference</span>
                  <strong>+{n(s.latest - s.counterfactual)}</strong>
                </div>
              </div>
              <div className="warning">
                Assumption sensitivity: {n(s.latest - (s.counterfactual + 500))}
                –{n(s.latest - (s.counterfactual - 500))} cups. This is not a
                statistical confidence interval.
              </div>
              <p>
                This comparison uses synthetic matched controls. It estimates an
                associated difference under stated assumptions; it does not
                establish customer-level causality.
              </p>
              <Table
                headers={[
                  "Cohort",
                  "Observed cups",
                  "No-launch estimate",
                  "Difference",
                ]}
                rows={cohorts.map((c) => [
                  c.id,
                  n(c.latest),
                  n((c.pre * c.control) / c.controlPre),
                  n(c.latest - (c.pre * c.control) / c.controlPre),
                ])}
              />
            </>
          )}
          <div style={{ marginTop: 24 }}>
            <EvidenceButton
              label="What could explain the difference?"
              evidence={evidence(
                "Portfolio movement and the modeled no-launch comparison",
                "Target launch panel vs separate matched Target comparison panel · latest week",
                {
                  pre: s.pre,
                  latest: s.latest,
                  launch: s.collaboration,
                  controlPre: 4000,
                  controlLatest: sum(cohorts.map((c) => c.control)),
                  counterfactual: s.counterfactual,
                },
                "Observed growth = 11,100 − 10,000. Counterfactual = Σ(2,500 × latest group control / 1,000). Associated difference = 800.",
                {
                  assumptions:
                    "A12: comparison-group exposure is proportionately matched. ±500-cup sensitivity around no-launch portfolio; not a confidence interval.",
                  unknown:
                    "Price and promotions, comparable distribution, unobserved customer switching and broader commercial conditions remain unverified.",
                },
              )}
            />
          </div>
        </section>
        <div className="stack">
          <section className="panel">
            <p className="eyebrow">KEEP THE RATIOS DISTINCT</p>
            <div className="stat">
              {((ratio(s.growth, s.collaboration) ?? 0) * 100).toFixed(1)}
              <small>%</small>
            </div>
            <p>
              Observed net-growth ratio
              <br />
              Descriptive, not causal.
            </p>
            <hr
              style={{
                border: 0,
                borderTop: "1px solid var(--border)",
                margin: "22px 0",
              }}
            />
            <div className="stat">
              {(
                (ratio(s.latest - s.counterfactual, s.collaboration) ?? 0) * 100
              ).toFixed(1)}
              <small>%</small>
            </div>
            <p>
              Counterfactual-associated lift ratio
              <br />
              Estimate under stated assumptions.
            </p>
          </section>
          <section className="panel">
            <h2>Which stores changed?</h2>
            <p>
              A and B both show strong launch sales. Their portfolio movement is
              different.
            </p>
            <ContextLink to="/cohorts">View by cohort →</ContextLink>
          </section>
        </div>
      </div>
      <div className="section-title">
        <h2>Selected SKU · Target observed history</h2>
        <EvidenceButton
          evidence={productEvidence(
            sku,
            "Selected product launch history",
            { cups: historicAnchors.map((r) => r[sku]) },
            "Each entry is a complete weekly Target-panel synthetic POS observation. Consumer POS is stored as integer four-packs.",
          )}
        />
      </div>
      <Table
        headers={[
          "Week starting",
          "17 Aug",
          "24 Aug",
          "31 Aug",
          "7 Sep",
          "14 Sep",
          "21 Sep",
          "28 Sep",
          "5 Oct",
        ]}
        rows={[
          [`CC0${sku + 1} · cups`, ...historicAnchors.map((r) => n(r[sku]))],
        ]}
      />
      <Review decision="Should the next commitment increase total output, change the flavor mix, or wait for another cycle of evidence?">
        <p>
          The launch warrants continued attention. The portfolio evidence
          supports reviewing the production mix before treating all launch sales
          as additional demand.
        </p>
      </Review>
      <NextLink to="/reorder-quality">
        Check whether retailer consumption supports the next run →
      </NextLink>
    </>
  );
}
export function ReorderQuality() {
  const { cohort } = useWorkspace();
  const c = cohorts[cohort];
  const balances = c.receipts.map(
    (_, i) => sum(c.receipts.slice(0, i + 1)) - sum(c.pos.slice(0, i + 1)),
  );
  const stock = balances.at(-1)!;
  const totalReceipts = sum(c.receipts),
    totalPos = sum(c.pos);
  const max = Math.max(...c.receipts, ...c.pos, ...balances);
  return (
    <>
      <Heading
        eyebrow="DEMAND EVIDENCE / REORDER QUALITY"
        title="When has a launch earned a deeper commitment?"
        description="Opening fill, consumer sales and later replenishment each tell us something different."
      />
      <div className="toolbar">
        <CohortSelect />
        <span className="small muted">
          CC01 · Target · 30 stores per cohort
        </span>
      </div>
      <div className="two-col">
        <section className="panel">
          <div className="panel-header">
            <div>
              <h2>From receipt to consumption.</h2>
              <span>Cohort {c.id} · retailer-owned stock · cups</span>
            </div>
            <EvidenceButton
              evidence={evidence(
                `Cohort ${c.id}: receipts, POS and retailer-owned inventory`,
                "CC01 · Target cohort " + c.id + " · 14 Sep–11 Oct 2026",
                {
                  receipts: c.receipts,
                  pos: c.pos,
                  balances,
                  availableDays: c.availableDays,
                },
                "Closing retailer stock = opening + receipts − consumer POS. " +
                  n(totalReceipts) +
                  " − " +
                  n(totalPos) +
                  " = " +
                  n(stock),
                {
                  constraints:
                    "Receipt events are case-compatible. Consumer POS is integer four-packs. Retail stock is excluded from brand stock.",
                  unknown:
                    "Order batching, retailer policies, price/promotion context and customer repeat purchase.",
                },
              )}
            />
          </div>
          <div className="plot-scroll">
            <svg
              viewBox="0 0 650 325"
              className="plot"
              role="img"
              aria-label={`Cohort ${c.id} receipt and consumption timeline. ${n(totalReceipts)} received, ${n(totalPos)} sold, ${n(stock)} cups remaining.`}
            >
              <title>
                Receipt, POS and retailer-owned closing inventory lanes · cups
              </title>
              {[
                "Retailer receipts",
                "Consumer POS",
                "Closing retail stock",
              ].map((label, l) => (
                <g key={label}>
                  <text x="10" y={43 + l * 95}>
                    {label}
                  </text>
                  {[c.receipts, c.pos, balances][l].map((v, i) => (
                    <g key={i}>
                      <rect
                        x={155 + i * 120}
                        y={15 + l * 95 + (1 - v / max) * 60}
                        width="65"
                        height={(v / max) * 60}
                        rx="3"
                        fill={["#997357", "var(--primary)", "#A24D68"][l]}
                      />
                      <text
                        x={188 + i * 120}
                        y={10 + l * 95 + (1 - v / max) * 60}
                        textAnchor="middle"
                      >
                        {n(v)}
                      </text>
                    </g>
                  ))}
                </g>
              ))}
              {["14 Sep", "21 Sep", "28 Sep", "5 Oct"].map((d, i) => (
                <text key={d} x={188 + i * 120} y="310" textAnchor="middle">
                  {d}
                </text>
              ))}
            </svg>
          </div>
          <p className="chart-note">
            Receipts are shipments into retail. POS is consumer consumption.
            Closing stock remains retailer-owned.
          </p>
        </section>
        <section className="panel">
          <p className="eyebrow">
            COHORT {c.id} / {c.label}
          </p>
          <div
            className="mini-stats"
            style={{ gridTemplateColumns: "1fr 1fr" }}
          >
            <div>
              <span>Later receipt cycles</span>
              <strong>{c.receipts.slice(1).filter((v) => v > 0).length}</strong>
            </div>
            <div>
              <span>Closing retail stock</span>
              <strong>{n(stock)}</strong>
            </div>
          </div>
          <p>{c.interpretation}</p>
          <p className="chart-note">
            Available selling exposure: {c.availableDays} / 210 store-days (
            {((c.availableDays / 210) * 100).toFixed(1)}%).
          </p>
          <ul className="checklist" style={{ gridTemplateColumns: "1fr" }}>
            <li>
              <Check />
              Receipts reconcile to inventory.
            </li>
            <li>
              <Check />
              Consumer POS is available.
            </li>
            <li>
              <Check />
              Availability has been considered.
            </li>
            <li>
              <CircleHelp />
              Distribution context: defined synthetic panel.
            </li>
            <li>
              <CircleHelp />
              Promotion context: not specified.
            </li>
            <li>
              <Check />
              Portfolio movement examined.
            </li>
          </ul>
        </section>
      </div>
      <Table
        headers={[
          "Week",
          "Receipts · cups",
          "Consumer POS · cups",
          "Closing retail stock · cups",
        ]}
        rows={c.pos.map((v, i) => [
          ["14 Sep", "21 Sep", "28 Sep", "5 Oct"][i],
          n(c.receipts[i]),
          n(v),
          n(balances[i]),
        ])}
      />
      <Review decision="Which receipts protect existing demand, and which signals justify a larger future commitment?">
        <p>{c.interpretation}</p>
        <p>
          Low remaining stock can justify service replenishment even when the
          launch has not increased total portfolio sales. A reorder is an input,
          not proof.
        </p>
      </Review>
      <NextLink to="/cohorts">Compare the store groups →</NextLink>
    </>
  );
}
export function CohortView() {
  const { cohort } = useWorkspace();
  const [counter, setCounter] = useState(false),
    [compare, setCompare] = useState(1);
  const c = cohorts[cohort];
  const y = (v: number) => 225 - (v / 850) * 175,
    x = (v: number) => 70 + (v / 35) * 470;
  return (
    <>
      <Heading
        eyebrow="DEMAND EVIDENCE / STORE COHORTS"
        title="The same launch sales can mean different things in different stores."
        description="Compare launch velocity with availability and movement across the rest of the portfolio."
      />
      <div className="toolbar">
        <CohortSelect />
        <div className="segmented">
          <button aria-pressed={!counter} onClick={() => setCounter(false)}>
            Observed movement
          </button>
          <button aria-pressed={counter} onClick={() => setCounter(true)}>
            Counterfactual difference
          </button>
        </div>
      </div>
      <div className="two-col">
        <section className="panel">
          <div className="panel-header">
            <div>
              <h2>Velocity is one signal. Growth is another.</h2>
              <span>Defined synthetic cohorts · 30 Target stores each</span>
            </div>
          </div>
          <div className="plot-scroll">
            <svg
              viewBox="0 0 640 310"
              className="plot"
              role="img"
              aria-label="Cohort scatterplot. A and B have strong launch velocity but different portfolio movement; C has lower availability."
            >
              <title>
                Collaboration availability-normalized velocity versus{" "}
                {counter ? "counterfactual-associated" : "observed"} portfolio
                movement
              </title>
              {[0, 400, 800].map((v) => (
                <g key={v}>
                  <line className="axis" x1="70" x2="560" y1={y(v)} y2={y(v)} />
                  <text x="57" y={y(v) + 4} textAnchor="end">
                    {v}
                  </text>
                </g>
              ))}
              {cohorts.map((c, i) => {
                const velocity = c.launch / (c.availableDays / 7),
                  movement = counter
                    ? c.latest - (c.pre * c.control) / 1000
                    : c.latest - c.pre;
                return (
                  <g key={c.id}>
                    <circle
                      cx={x(velocity)}
                      cy={y(movement)}
                      r={i === cohort ? 18 : 13}
                      fill={
                        ["var(--primary)", "#7E5B43", "#A24D68", "#526999"][i]
                      }
                      opacity={i === cohort ? 1 : 0.75}
                    />
                    <text
                      x={x(velocity)}
                      y={y(movement) + 4}
                      textAnchor="middle"
                      style={{ fill: "#fff" }}
                    >
                      {c.id}
                    </text>
                  </g>
                );
              })}
              {[0, 10, 20, 30].map((v) => (
                <text key={v} x={x(v)} y="256" textAnchor="middle">
                  {v}
                </text>
              ))}
              <text x="70" y="17">
                {counter
                  ? "Counterfactual-associated difference · cups"
                  : "Observed portfolio change · cups"}
              </text>
              <text x="310" y="290" textAnchor="middle">
                Collaboration cups per available store-week
              </text>
            </svg>
          </div>
          <p className="chart-note">
            These cohorts are defined in the synthetic dataset. Automated
            clustering could be evaluated with real data during an engagement.
          </p>
        </section>
        <section className="panel">
          <p className="eyebrow">SELECTED COHORT {c.id}</p>
          <h2>{c.label}</h2>
          <div className="mini-stats">
            <div>
              <span>Launch cups</span>
              <strong>{n(c.launch)}</strong>
            </div>
            <div>
              <span>Availability</span>
              <strong>{((c.availableDays / 210) * 100).toFixed(1)}%</strong>
            </div>
            <div>
              <span>Cups / available week</span>
              <strong>{(c.launch / (c.availableDays / 7)).toFixed(2)}</strong>
            </div>
          </div>
          <p>{c.interpretation}</p>
          <p className="chart-note">
            Matched control: {n(c.control)} versus 1,000 baseline cups.
            No-launch estimate: {n((c.pre * c.control) / 1000)}. Associated
            difference: {n(c.latest - (c.pre * c.control) / 1000)} cups, under
            stated assumptions.
          </p>
          <EvidenceButton
            evidence={evidence(
              `Cohort ${c.id} availability and comparison`,
              "30 synthetic Target operating stores · latest week",
              {
                pre: preCohort[cohort],
                latest: latestCohort[cohort],
                availableDays: c.availableDays,
                control: c.control,
                receiptHistory: c.receipts,
              },
              `${c.launch} / (${c.availableDays}/7) = ${(c.launch / (c.availableDays / 7)).toFixed(2)} cups per available store-week. Counterfactual = 2,500 × ${c.control}/1,000.`,
              {
                assumptions:
                  "A12 / A15: fixed defined cohorts; proportionately matched control exposure; no trained clustering.",
                unknown:
                  "Availability normalization does not automatically recover lost demand. Pricing, promotions and causal customer switching remain unknown.",
              },
            )}
          />
        </section>
      </div>
      <div className="section-title">
        <h2>Compare cohort {c.id} with</h2>
        <label className="select-label">
          Comparison cohort
          <select
            value={compare}
            onChange={(e) => setCompare(Number(e.target.value))}
          >
            {cohorts.map((c, i) => (
              <option key={c.id} value={i}>
                {c.id} · {c.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <Table
        headers={[
          "Cohort",
          "Prelaunch cups",
          "Latest cups",
          "Launch cups",
          "Availability",
          "Portfolio difference · cups",
        ]}
        rows={[c, cohorts[compare]].map((c) => [
          c.id,
          n(c.pre),
          n(c.latest),
          n(c.launch),
          ((c.availableDays / 210) * 100).toFixed(1) + "%",
          n(counter ? c.latest - (c.pre * c.control) / 1000 : c.latest - c.pre),
        ])}
      />
      <div className="section-title">
        <h2>Selected cohort product mix · cup equivalents</h2>
        <ContextLink to="/reorder-quality">Receipt history →</ContextLink>
      </div>
      <Table
        headers={["SKU", "Prelaunch cups", "Latest cups"]}
        rows={latestCohort[cohort].map((v, i) => [
          `CC0${i + 1}`,
          n(preCohort[cohort][i]),
          n(v),
        ])}
      />
      <Review decision="Where does the evidence support additional depth, and where should replenishment preserve the existing mix?">
        <p>
          Strong launch velocity and stronger portfolio demand are different
          signals. Availability also changes how confidently we can interpret a
          weaker result.
        </p>
      </Review>
      <NextLink to="/production">
        Translate the evidence into production →
      </NextLink>
    </>
  );
}
