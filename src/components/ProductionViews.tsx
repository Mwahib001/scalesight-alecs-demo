"use client";
import { useState } from "react";
import { Check, CircleAlert, CircleHelp } from "lucide-react";
import {
  allocation,
  bom,
  bridge,
  bridgeEarly,
  cartonStock,
  components,
  missing,
  optionalPO,
  poLines,
  products,
  purchaseOrders,
} from "../data/alecs.v1";
import {
  calculate,
  capacity,
  caseRequirement,
  componentCoverage,
  economics,
  reviewedBaseline,
  sum,
  transferCheck,
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
} from "./Workspace";
import { Schedule, StockChart } from "./PlanningCharts";
import { evidence, productEvidence } from "./evidence";
const productExplanations = [
  "The reviewed run retains meaningful launch output while limiting the larger commitment that requires additional evidence and components.",
  "Preserve output for the established dispatch requirement. Opening stock has little resilience before the W3 receipt.",
  "The reviewed quantity depends on the early W5 bridge tranche. Keep that timing visible.",
  "Aggregate supply is adequate; allocation confidence depends on the transfer assumptions.",
  "Existing stock and the bridge commitment support less additional depth in this window.",
  "Existing stock and later commitments are compared with the central dispatch requirement.",
  "The reviewed candidate retains output alongside the later bridge commitment.",
  "Six weeks of opening cover support reviewing the depth of the next commitment.",
];
export function Production() {
  const { sku, setSku, scenario, result } = useWorkspace();
  const [option, setOption] = useState<"requested" | "reviewed">("reviewed"),
    [horizon, setHorizon] = useState(8);
  const r = calculate(scenario, option, horizon),
    p = products[sku],
    requested = products.map((p) => p.requested),
    reviewed = products.map((p) => p.reviewed);
  return (
    <>
      <Heading
        eyebrow="PRODUCTION COMMITMENTS / PRODUCTION PRIORITIES"
        title="Where should the next production slot go?"
        description="Compare the requested mix with a feasible candidate across demand, line time, components and upcoming supply."
      />
      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>One window. Competing commitments.</h2>
            <span>
              19–23 October · 40 allocated hours · 1,200 good cups / hour
            </span>
          </div>
          <EvidenceButton
            evidence={evidence(
              "Production schedule and manufacturing feasibility",
              "Next reserved production window · eight flavors",
              {
                requested: capacity(requested),
                reviewed: capacity(reviewed),
                baseAvailable: 3200,
                packagingAvailable: 40000,
              },
              "Total hours = good cups / 1,200 + 0.5 × max(active flavors − 1, 0). 52,000 → 46.83 h; 40,000 → 36.83 h.",
              {
                assumptions:
                  "A04: 2,000-cup nonzero minimum and increments; good-cup output already includes yield. Not whole-factory capacity.",
                unknown:
                  "Actual capacity, QA release timing, output rates and client commitments.",
              },
            )}
          />
        </div>
        <Schedule
          mix={requested}
          label="Requested mix · Infeasible under current assumptions"
        />
        <Schedule
          mix={reviewed}
          label="Reviewed mix · Feasible candidate for discussion"
        />
        <p className="chart-note">
          The reviewed mix leaves 3.17 line hours available, but consumes the
          available base and cup-and-lid sets. Unused line time does not mean
          more production is feasible.
        </p>
      </section>
      <div className="section-title">
        <h2>Next-window constraints</h2>
        <ContextLink to="/components">
          Inspect component dependencies →
        </ContextLink>
      </div>
      <Table
        headers={["Constraint", "Requested", "Reviewed", "Available"]}
        rows={[
          [
            "Output · cups",
            n(sum(requested)),
            n(sum(reviewed)),
            "Component-dependent",
          ],
          [
            "Line time · h",
            capacity(requested).totalHours.toFixed(2),
            capacity(reviewed).totalHours.toFixed(2),
            "40.00",
          ],
          ["Cup-and-lid sets", n(sum(requested)), n(sum(reviewed)), n(40000)],
          [
            "Base · kg",
            n(sum(requested) * 0.08),
            n(sum(reviewed) * 0.08),
            n(3200),
          ],
          [
            "Production-cost exposure",
            money(economics(requested).productionCost),
            money(economics(reviewed).productionCost),
            "Separate from future cash",
          ],
        ]}
      />
      <div className="section-title">
        <h2>Compare the flavor mix</h2>
        <span>Reviewed baseline · cups, not weekly demand</span>
      </div>
      <Table
        headers={[
          "Product",
          "Opening stock · cups",
          "Requested · cups",
          "Reviewed · cups",
          "Change · cups",
        ]}
        rows={products.map((p, i) => [
          <button aria-pressed={sku === i} onClick={() => setSku(i)} key={p.id}>
            <span className="inline-product">
              <ProductVisual index={i} />
              <span>
                <strong>{p.name}</strong>
                <span>{p.id}</span>
              </span>
            </span>
          </button>,
          n(p.opening),
          n(p.requested),
          n(p.reviewed),
          n(p.reviewed - p.requested),
        ])}
      />
      <div className="section-title">
        <h2>Selected-product projection</h2>
        <ProductSelect />
      </div>
      <div className="toolbar">
        <div className="segmented">
          <button
            aria-pressed={option === "reviewed"}
            onClick={() => setOption("reviewed")}
          >
            Reviewed candidate
          </button>
          <button
            aria-pressed={option === "requested"}
            onClick={() => setOption("requested")}
          >
            Requested mix
          </button>
        </div>
        <div className="segmented">
          <button aria-pressed={horizon === 8} onClick={() => setHorizon(8)}>
            8 weeks
          </button>
          <button aria-pressed={horizon === 13} onClick={() => setHorizon(13)}>
            13-week visibility
          </button>
        </div>
      </div>
      {r.violations.length > 0 && (
        <div className="warning danger-box">
          <strong>
            ! This option exceeds the available constraint. Review the
            highlighted requirement before treating it as executable.
          </strong>
          <ul>
            {r.violations.map((v) => (
              <li key={v}>{v}</li>
            ))}
          </ul>
          <p>
            Infeasible first-window production is excluded from physical
            receipts. Later bridge supply remains separate.
          </p>
        </div>
      )}
      <div className="two-col">
        <section className="panel">
          <div className="panel-header">
            <div>
              <h2>{p.name}</h2>
              <span>Brand-owned aggregate stock · W1–W{horizon}</span>
            </div>
            <EvidenceButton
              evidence={productEvidence(
                sku,
                "Selected production and stock trajectory",
                {
                  opening: p.opening,
                  requested: p.requested,
                  reviewed: p.reviewed,
                  projection: r.skuWeek[sku].weeks,
                  scenario,
                },
                "Available = opening + released receipts. Served = min(required, available). Unmet is tracked separately. Closing = available − served.",
                {
                  assumptions:
                    "A03 / A06 / A07 / A16: aggregate SKU scope; no invented full node partition. Bridge remains separately supplied.",
                  constraints:
                    r.violations.join(" ") ||
                    "Release W3, early Honeycomb tranche W5, bridge W6. Run increments and components checked.",
                },
              )}
            />
          </div>
          <StockChart row={r.skuWeek[sku]} />
        </section>
        <section className="panel">
          <div className="product-detail">
            <ProductVisual index={sku} />
            <div>
              <p className="eyebrow">{p.id}</p>
              <h2>{p.short}</h2>
            </div>
          </div>
          <div className="mini-stats">
            <div>
              <span>Opening cups</span>
              <strong>{n(p.opening)}</strong>
            </div>
            <div>
              <span>Opening cover</span>
              <strong>
                {(
                  p.opening / reviewedBaseline.skuWeek[sku].weeks[0].required
                ).toFixed(1)}
                <small> wk</small>
              </strong>
            </div>
            <div>
              <span>Reviewed run</span>
              <strong>{n(p.reviewed)}</strong>
            </div>
          </div>
          <p>{productExplanations[sku]}</p>
          <p className="chart-note">
            Next reviewed release: W3. Later bridge: {n(bridge[sku])} cups in W6
            {bridgeEarly[sku] > 0
              ? `, plus ${n(bridgeEarly[sku])} cups in W5`
              : ""}
            .
          </p>
          <p className="chart-note">
            Case-only shipment residual for reviewed run:{" "}
            {caseRequirement(p.reviewed).residual} cups (
            {caseRequirement(p.reviewed).cases} cases). Analytical anchors are
            preserved.
          </p>
          <ContextLink to="/components">Trace components →</ContextLink>
          <br />
          <ContextLink to="/cash">Trace cost and cash →</ContextLink>
        </section>
      </div>
      {horizon === 13 && (
        <p className="warning">
          Additional supply is not committed in this fixture. The projection
          identifies a next decision; it does not assume replenishment.
        </p>
      )}
      <Table
        headers={[
          "Week",
          "Required cups",
          "Released cups",
          "Closing cups",
          "Unserved cups",
          "Buffer cups",
        ]}
        rows={r.skuWeek[sku].weeks.map((w) => [
          "W" + w.week,
          n(w.required),
          n(w.receipts),
          n(w.closing),
          n(w.unmet),
          w.buffer === null ? "Incomplete horizon" : n(w.buffer),
        ])}
      />
      {result.recommendationStatus === "exploratory" && (
        <p className="warning">
          Shared exploration: {n(result.portfolio.unmet)} cups unserved across
          the portfolio. Reviewed quantities above remain baseline
          interpretation.
        </p>
      )}
      <Review decision="Which output should be committed in this window, and what would need to change to justify the larger request?">
        <p>{productExplanations[sku]}</p>
        <p>
          Dark Chocolate Honeycomb Crunch depends on its earlier Week 5 bridge
          receipt. The reviewed mix is an analyst-supplied feasible alternative,
          not a claimed optimized mathematical solution.
        </p>
      </Review>
      <NextLink to="/cash">Review the cash consequence →</NextLink>
    </>
  );
}
export function Components() {
  const { sku, result } = useWorkspace();
  const p = products[sku];
  const [quantityOption, setQuantityOption] = useState("reviewed");
  const quantity =
    quantityOption === "reviewed"
      ? p.reviewed
      : quantityOption === "requested"
        ? p.requested
        : Number(quantityOption);
  const deps = components.filter((c) => bom[sku].coefficients[c.id]);
  const coverage = componentCoverage(result.mix, result.scenario.basePercent);
  return (
    <>
      <Heading
        eyebrow="PRODUCTION COMMITMENTS / COMPONENTS & COMMITMENTS"
        title="A deeper run creates more than finished inventory."
        description="See what the next quantity requires - and which commitments can remain flexible."
      />
      <div className="toolbar">
        <ProductSelect />
        <label className="select-label">
          Compare quantity
          <select
            value={quantityOption}
            onChange={(e) => setQuantityOption(e.target.value)}
          >
            <option value="reviewed">Reviewed quantity</option>
            <option value="requested">Requested quantity</option>
            <option value="8000">8,000 cups</option>
            <option value="10000">10,000 cups</option>
            <option value="12000">12,000 cups</option>
          </select>
        </label>
      </div>
      <div className="two-col">
        <section className="panel">
          <div className="panel-header">
            <div>
              <h2>What does {n(quantity)} cups depend on?</h2>
              <span>
                Public ingredient categories. Synthetic planning coefficients.
              </span>
            </div>
            <EvidenceButton
              evidence={productEvidence(
                sku,
                "Selected product dependency calculation",
                {
                  quantity,
                  coefficients: bom[sku].coefficients,
                  cartonCoefficient: 0.25,
                  cartonsAvailable: cartonStock[sku],
                },
                "Required component = selected good cups × synthetic coefficient. Cartons = cups / 4. Common mix already includes base ingredients; do not double count.",
                {
                  sourceId: "SPEC-04.14 / A05",
                  unknown:
                    "Actual recipes, procurement multiples outside supplied top-ups, supplier timing and food-quality parameters.",
                },
              )}
            />
          </div>
          <div className="dependency-root">
            <strong>
              {p.id} · {p.name}
            </strong>
            <br />
            {n(quantity)} good cups
          </div>
          <div className="dependency-grid">
            {deps.map((c) => {
              const required = quantity * bom[sku].coefficients[c.id],
                available =
                  c.available *
                  (c.id === "BASE" ? result.scenario.basePercent / 100 : 1),
                short = Math.max(0, required - available);
              return (
                <div
                  key={c.id}
                  className={`dependency ${short > 0 ? "short" : ""}`}
                >
                  <span>{c.name}</span>
                  <strong>
                    {n(required)} {c.unit}
                  </strong>
                  <span>{n(available)} available</span>
                  {short > 0 && (
                    <p className="status danger">
                      ! {n(short)} {c.unit} short
                    </p>
                  )}
                </div>
              );
            })}
            <div
              className={`dependency ${quantity / 4 > cartonStock[sku] ? "short" : ""}`}
            >
              Compatible printed cartons<strong>{n(quantity / 4)}</strong>
              <span>{n(cartonStock[sku])} available</span>
            </div>
            <div className="dependency">
              Run time · before changeovers
              <strong>{(quantity / 1200).toFixed(2)} h</strong>
              <span>Portfolio allocation: 40 hours</span>
            </div>
            <div className="dependency">
              SKU-specific other ingredient kit
              <strong>{n(quantity)} cup eq.</strong>
              <span>{n(bom[sku].otherAvailable)} available</span>
            </div>
          </div>
          <p className="chart-note">
            Selected-SKU coverage is distinct from portfolio feasibility:
            expanding one run can displace shared base and packaging used by
            others.
          </p>
        </section>
        <section className="panel">
          <p className="eyebrow">OPTIONAL COMPONENT POSITION</p>
          <h2>Reserve, produce, or wait?</h2>
          <p>Optional granola purchase · {optionalPO.id}</p>
          <div className="mini-stats">
            <div>
              <span>Quantity</span>
              <strong>
                {optionalPO.quantity}
                <small> kg</small>
              </strong>
            </div>
            <div>
              <span>Commitment</span>
              <strong>{money(optionalPO.value)}</strong>
            </div>
            <div>
              <span>Deposit</span>
              <strong>{money(optionalPO.deposit)}</strong>
            </div>
          </div>
          <p>
            Later balance: {money(optionalPO.balance)}.<br />
            Earliest standard arrival: 26 October.
          </p>
          <div className="warning">
            <strong>! Uncommitted option</strong>
            <p>
              Cancellation terms: Unknown.
              <br />
              Excluded from baseline future cash. Does not establish supply
              before the 19–23 October window.
            </p>
          </div>
          <p>
            Reserving an ingredient may preserve an option. It does not reserve
            production capacity or authorize finished-goods output.
          </p>
          <EvidenceButton
            evidence={evidence(
              "AP-106 optional granola reservation",
              "Optional component commitment · not in baseline",
              { ...optionalPO },
              "$300 = 60 kg × $5. $90 deposit + $210 later balance; uncommitted option excluded from baseline cash.",
              {
                evidenceClass: "SYNTHETIC INPUT",
                sourceId: "SPEC-04.16 / A10",
                assumptions: "No order is placed by this comparison.",
                constraints:
                  "Earliest standard receipt is 26 October, after the first production window.",
                unknown:
                  "Cancellation/refund terms and exact payment dates; reversibility is unknown.",
              },
            )}
          />
        </section>
      </div>
      <div className="section-title">
        <h2>Collaboration depth · component requirement</h2>
      </div>
      <Table
        headers={[
          "CC01 output · cups",
          "Granola · kg",
          "Strawberry shell · kg",
          "Interpretation",
        ]}
        rows={[8000, 10000, 12000].map((q) => [
          n(q),
          n(q * bom[0].coefficients.GRANOLA),
          n(q * bom[0].coefficients["STRAW-SHELL"]),
          q === 8000
            ? "Fits the selected component position."
            : q === 10000
              ? "Uses all current granola and strawberry shell."
              : "Requires additional components before the window.",
        ])}
      />
      <div className="section-title">
        <h2>Shared portfolio coverage</h2>
        <span>
          {result.recommendationStatus === "exploratory"
            ? "Exploration"
            : "Reviewed candidate"}{" "}
          · evaluated option only
        </span>
      </div>
      <Table
        headers={[
          "Component",
          "Required",
          "Available before run",
          "Shortage",
          "Unit",
        ]}
        rows={coverage.map((c) => [
          c.name,
          n(c.required),
          n(c.available),
          n(c.shortage),
          c.unit,
        ])}
      />
      <div className="section-title">
        <h2>Existing component commitments</h2>
        <span>2 November receipt · 30% paid / 70% due</span>
      </div>
      <Table
        headers={[
          "PO",
          "Contents",
          "Order value",
          "Previously paid",
          "Future balance",
        ]}
        rows={purchaseOrders.map((po) => [
          <details key={po.id}>
            <summary>{po.id}</summary>
            {poLines
              .filter((l) => l.poId === po.id)
              .map((l) => (
                <p className="small" key={l.componentId}>
                  {l.componentId}: {n(l.quantity)}
                </p>
              ))}
          </details>,
          po.name,
          money(po.value),
          money(po.paid),
          money(po.balance),
        ])}
      />
      <Review decision="Which commitments should be made now, which can preserve flexibility, and which need stronger demand evidence?">
        <p>
          At 12,000 collaboration cups, granola is short by 24 kg and strawberry
          shell by 30 kg. Portfolio-level base, packaging and line constraints
          must still be resolved.
        </p>
        <p>
          Reservation terms remain incomplete. A quantity calculation does not
          establish supplier arrival or factory capacity.
        </p>
      </Review>
      <NextLink to="/production">Compare the full production window →</NextLink>
    </>
  );
}
export function Allocation() {
  const { sku, setSku, scenario } = useWorkspace();
  const [after, setAfter] = useState(false),
    [departure, setDeparture] = useState(""),
    [destination, setDestination] = useState("Target"),
    [pack, setPack] = useState("retail-four-pack");
  const t = transferCheck(
    departure || null,
    products[sku].id,
    destination,
    pack,
  );
  return (
    <>
      <Heading
        eyebrow="PRODUCTION COMMITMENTS / ALLOCATION"
        title="Do we need another run - or a better allocation?"
        description="Test whether compatible stock can resolve the shortage before committing more production."
      />
      <div className="toolbar">
        <ProductSelect />
        <button className="button light" onClick={() => setSku(3)}>
          View CC04 worked case
        </button>
        <div className="segmented">
          <button aria-pressed={!after} onClick={() => setAfter(false)}>
            Before transfer
          </button>
          <button aria-pressed={after} onClick={() => setAfter(true)}>
            After transfer · candidate
          </button>
        </div>
      </div>
      {sku !== 3 ? (
        <div className="panel">
          <ProductVisual index={sku} />
          <h2>No regional partition supplied for {products[sku].name}.</h2>
          <p>
            {missing}. This case remains at aggregate SKU scope; no node-level
            allocations are inferred.
          </p>
          <p>
            {sku === 0
              ? "CC01 is Target-only. This product is not eligible for a non-Target retailer in the illustrative assortment."
              : "Select CC04 to inspect the supplied East-to-West worked case."}
          </p>
          <EvidenceButton
            evidence={productEvidence(
              sku,
              "Regional allocation not specified",
              { nodeAllocation: null },
              "A16: no full node dispatch/receipt partition supplied. Aggregate stock is not proof of a compatible regional surplus.",
              {
                unknown:
                  "Node stock, demand, buffer, destination permission and lot partition.",
              },
            )}
          />
        </div>
      ) : (
        <>
          <div className="region-grid">
            {allocation.pools.map((pool, i) => {
              const stock =
                pool.stock +
                (after
                  ? i === 0
                    ? allocation.quantity
                    : i === 1
                      ? -allocation.quantity
                      : 0
                  : 0);
              return (
                <section className="region" key={pool.id}>
                  <p className="eyebrow">BRAND-OWNED CC04 POOL</p>
                  <h3>
                    {pool.id === "Central"
                      ? "Central · other retailers"
                      : "Target " + pool.id}
                  </h3>
                  <div className="stat">
                    {n(stock)}
                    <small> cups</small>
                  </div>
                  <p>
                    Two-week demand: {n(pool.demand)} cups
                    <br />
                    Protected buffer: {n(pool.buffer)} cups
                  </p>
                  <p
                    className={`status ${stock < pool.demand ? "danger" : ""}`}
                  >
                    {stock < pool.demand ? (
                      <CircleAlert size={12} />
                    ) : (
                      <Check size={12} />
                    )}{" "}
                    {stock < pool.demand
                      ? `${n(pool.demand - stock)}-cup gap`
                      : pool.id === "East"
                        ? `${n(stock - pool.demand - pool.buffer)} transferable surplus`
                        : "Requirements covered in aggregate"}
                  </p>
                </section>
              );
            })}
          </div>
          <div className="transfer-arrow">
            East → West · {n(allocation.quantity)} cups /{" "}
            {allocation.quantity / 24} cases · {money(t.expense)}
          </div>
          <div className="equal-col">
            <section className="panel">
              <div className="panel-header">
                <h2>Can it arrive before the need?</h2>
                <EvidenceButton
                  evidence={evidence(
                    "CC04 transfer compatibility and donor protection",
                    "Brand-owned East and West pools · W1–W2",
                    {
                      ...allocation,
                      departureDate: departure || null,
                      earliestRelease: t.arrival,
                      donorResidual: t.donorResidual,
                    },
                    "East surplus = 3,600 − 1,000 − 680 = 1,920. Transfer 1,200 leaves 720. Arrival/release = departure + 2 days transit + 1 day receiving.",
                    {
                      sourceId: "SPEC-04.17 / A09 / A16",
                      assumptions:
                        "Synthetic compatible SKU, retail four-pack, saleable lots and cold-chain conditions. Weekly demand buckets do not establish exact intraweek depletion.",
                      constraints:
                        "Dispatch and receipt timing must be explicit. 26 October is only the expense payment date.",
                      unknown:
                        "Exact dispatch/arrival dates, intraweek West depletion and real lane conditions.",
                    },
                  )}
                />
              </div>
              <label className="select-label">
                Exploratory dispatch date
                <input
                  type="date"
                  value={departure}
                  min="2026-10-12"
                  max="2026-10-25"
                  onChange={(e) => setDeparture(e.target.value)}
                />
              </label>
              <p>Two-day frozen transit + one-day receiving/release.</p>
              <div
                className={`warning ${t.arrivalBeforeNeed === false ? "danger-box" : ""}`}
              >
                <strong>{t.status}</strong>
                <p>
                  {t.arrival
                    ? `Earliest released stock: ${t.arrival}.`
                    : "Select a dispatch date to evaluate the three-day constraint."}
                </p>
                <p>
                  26 October is the payment date, not proof of arrival. The
                  exact depletion day within W1 is unresolved.
                </p>
              </div>
              <p className="chart-note">
                After-transfer quantities are conditional. Network stock remains{" "}
                {n(t.networkStock)} cups; this comparison creates no new stock.
              </p>
            </section>
            <section className="panel">
              <h2>Eligibility is part of the decision.</h2>
              <ul className="checklist">
                <li>
                  <Check />
                  Same finished SKU
                </li>
                <li>
                  <Check />
                  Compatible retail pack
                </li>
                <li>
                  <Check />
                  Brand-owned inventory
                </li>
                <li>
                  <Check />
                  Donor demand and buffer protected
                </li>
                <li>
                  <Check />
                  Synthetic saleable lot assumptions
                </li>
                <li>
                  <CircleHelp />
                  Cold-chain conditions require validation
                </li>
                <li>
                  <CircleHelp />
                  Arrival before depletion: conditional
                </li>
              </ul>
              <p>
                Freight: {money(allocation.freight)}. Handling / QA:{" "}
                {money(allocation.handling)}.
              </p>
              <p>
                Finished-goods reallocation moves existing CC04 stock.
                Production-mix allocation changes future flavor output.
              </p>
            </section>
          </div>
        </>
      )}
      <div className="section-title">
        <h2>Check pack and destination restrictions</h2>
      </div>
      <div className="toolbar">
        <label className="select-label">
          Destination
          <select
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
          >
            <option>Target</option>
            <option>Whole Foods</option>
            <option>Hypothetical club</option>
          </select>
        </label>
        <label className="select-label">
          Requirement pack
          <select value={pack} onChange={(e) => setPack(e.target.value)}>
            <option value="retail-four-pack">Retail four-pack</option>
            <option value="club-eight-pack">
              Hypothetical eight-cup club pack
            </option>
          </select>
        </label>
      </div>
      {(destination === "Hypothetical club" ||
        pack !== "retail-four-pack" ||
        (sku === 0 && destination !== "Target") ||
        (sku === 3 && destination !== "Target")) && (
        <div className="warning danger-box">
          ! This stock cannot serve that requirement under the current pack or
          destination assumptions. The available stock has a different pack or
          destination restriction.
        </div>
      )}
      {scenario.preset === "S6" && (
        <div className="warning danger-box">
          Blocked pending pack compatibility, permissions and supply review.
          Retail four-packs cannot serve the hypothetical club requirement.
        </div>
      )}
      <Review decision="Can this transfer arrive in time without creating a shortage elsewhere?">
        <p>
          Compatible stock elsewhere could resolve the regional gap before
          another run is needed. East retains protected demand and buffer, with
          720 cups of residual surplus.
        </p>
        <p>
          The quantity comparison is supported; execution feasibility remains
          conditional on dispatch, arrival and intraweek depletion timing.
        </p>
      </Review>
      <NextLink to="/cash">See the cash and service trade-off →</NextLink>
    </>
  );
}
