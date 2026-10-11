"use client";
import { ArrowRight, Check, CircleAlert } from "lucide-react";
import { allocation, products } from "../data/alecs.v1";
import { launchSummary, reviewedBaseline, economics } from "../engine/alecs";
import {
  ContextLink,
  EvidenceButton,
  Heading,
  ProductVisual,
  Review,
  money,
  n,
} from "./Workspace";
import { productEvidence } from "./evidence";
const decisions = [
  {
    sku: 0,
    action: "REVIEW PRODUCTION",
    headline: "Strong launch sales. A different portfolio story.",
    note: "Launch sales are substantial, but the wider portfolio movement gives us a different question about how much additional production to commit.",
    link: "Examine the launch signal",
    to: "/incrementality",
  },
  {
    sku: 1,
    action: "PROTECT CAPACITY",
    headline: "Don’t let the launch displace the next requirement.",
    note: "The existing stock covers the first two weeks exactly. Production timing matters alongside the quantity.",
    link: "Review the production slot",
    to: "/production",
  },
  {
    sku: 3,
    action: "REALLOCATE",
    headline: "Enough stock overall. A regional shortage underneath.",
    note: "Compatible stock elsewhere could resolve the regional gap before another run is needed.",
    link: "Compare the allocation",
    to: "/allocation",
  },
  {
    sku: 4,
    action: "HOLD ADDITIONAL DEPTH",
    headline: "More stock does not yet require a deeper run.",
    note: "Existing stock and the later bridge receipt reduce the case for a larger immediate commitment.",
    link: "Inspect the buying depth",
    to: "/production",
  },
];
export default function WeeklyBrief() {
  const r = reviewedBaseline;
  return (
    <>
      <div className="issue-line">
        <strong>Retail-to-Production Planning</strong>
        <span>Weekly review · 12 October 2026</span>
      </div>
      <div className="brief-heading">
        <Heading
          eyebrow="WEEKLY PLANNING REVIEW"
          title="The fastest-moving SKU isn’t automatically the SKU that deserves more production."
          description="Four commitments deserve a closer look before the next production window."
        />
      </div>
      <div className="section-title">
        <h2>Four commitments. One production window.</h2>
        <span>Illustrative reviewed proposals</span>
      </div>
      <div className="decision-grid">
        {decisions.map((d, i) => {
          const p = products[d.sku];
          const values =
            d.sku === 0
              ? [
                  ["Launch cups", n(launchSummary.collaboration)],
                  ["Portfolio growth", n(launchSummary.growth)],
                  ["Requested run", n(p.requested)],
                  ["Reviewed candidate", n(p.reviewed)],
                ]
              : d.sku === 1
                ? [
                    ["Opening stock", n(p.opening)],
                    ["Demand / week", n(r.skuWeek[1].weeks[0].required)],
                    ["Next release", "Week 3"],
                    ["Reviewed run", n(p.reviewed)],
                  ]
                : d.sku === 3
                  ? [
                      [
                        "West gap",
                        n(
                          allocation.pools[0].demand -
                            allocation.pools[0].stock,
                        ),
                      ],
                      ["Transfer cups", n(allocation.quantity)],
                      [
                        "Transfer expense",
                        money(allocation.freight + allocation.handling),
                      ],
                      ["Logistics cases", n(allocation.quantity / 24)],
                    ]
                  : [
                      ["Opening stock", n(p.opening)],
                      ["Opening cover", "6.0 weeks"],
                      ["Requested run", n(p.requested)],
                      ["Reviewed candidate", n(p.reviewed)],
                    ];
          return (
            <article key={p.id} className="decision-card">
              <div
                className="product-stage"
                style={{ "--flavor": p.color } as React.CSSProperties}
              >
                <span className="stage-number">0{i + 1}</span>
                <span className="stage-sku">{p.id}</span>
                <ProductVisual index={d.sku} />
              </div>
              <div className="card-body">
                <p className="card-name">
                  {d.sku === 0 ? "Collaboration Culture Cup" : p.name}
                </p>
                <p className={`status ${i === 0 ? "warning" : ""}`}>
                  {i === 0 ? <CircleAlert size={11} /> : <Check size={11} />}{" "}
                  {d.action}
                </p>
                <h3>{d.headline}</h3>
                <dl className="card-metrics">
                  {values.map(([label, value]) => (
                    <div key={label}>
                      <dt>{label}</dt>
                      <dd>{value}</dd>
                    </div>
                  ))}
                </dl>
                <p className="card-note">{d.note}</p>
              </div>
              <ContextLink to={d.to} sku={d.sku} className="card-link">
                {d.link}
                <ArrowRight size={15} />
              </ContextLink>
              <div className="card-evidence">
                <EvidenceButton
                  evidence={productEvidence(
                    d.sku,
                    d.headline,
                    Object.fromEntries(values),
                    d.sku === 0
                      ? "11,100 − 10,000 = 1,100 observed Target growth; 2,400 launch cups do not establish 2,400 additional portfolio cups."
                      : d.sku === 1
                        ? "6,000 opening / 3,000 per week = 2 weeks; reviewed 12,000 available W3."
                        : d.sku === 3
                          ? "East surplus = 3,600 − 1,000 − 680 = 1,920; 1,200 transfer leaves 720."
                          : "7,200 / 1,200 = 6.0 weeks; later bridge adds 4,000 in W6.",
                    {
                      evidenceClass: "ANALYST INTERPRETATION",
                      unknown:
                        d.sku === 3
                          ? "Transfer dispatch and arrival dates are unresolved. 26 October is the payment date."
                          : "Real client requirements and demand persistence.",
                    },
                  )}
                />
              </div>
            </article>
          );
        })}
      </div>
      <section className="window-summary">
        <div className="summary-title">
          <strong>NEXT PRODUCTION WINDOW · 19–23 OCTOBER</strong>
          <span>Reviewed candidate · available from Week 3</span>
        </div>
        <div className="metric-strip">
          <div>
            <strong>
              {n(r.capacity.total)} <small>cups</small>
            </strong>
            <span>Reviewed output</span>
          </div>
          <div>
            <strong>
              {r.capacity.totalHours.toFixed(2)} <small>hours</small>
            </strong>
            <span>Line time, including changeovers</span>
          </div>
          <div>
            <strong>{money(economics(r.mix).productionCost)}</strong>
            <span>Modeled production cost</span>
          </div>
          <div>
            <strong>{money(r.cash.firstWindow)}</strong>
            <span>Future cash, including transfer</span>
          </div>
        </div>
      </section>
      <Review decision="Which commitments deserve the next production window, and what client context could change the mix?">
        <p>
          The launch deserves production, but not an automatic expansion equal
          to its headline sales. Protect the proven incumbent requirement,
          resolve the regional imbalance and preserve flexibility in flavors
          already carrying more cover.
        </p>
      </Review>
      <div className="brief-closing">
        <div>
          <h2>
            What changes if demand strengthens, or the release arrives a week
            late?
          </h2>
          <p>
            Timing still matters: the reviewed plan depends on the W3 release
            and the early Honeycomb bridge tranche.
          </p>
        </div>
        <ContextLink to="/scenarios" className="button light">
          Explore Scenario Lab <ArrowRight size={15} />
        </ContextLink>
      </div>
      <ContextLink to="/incrementality" sku={0} className="next-link">
        Walk through the launch decision <ArrowRight size={17} />
      </ContextLink>
    </>
  );
}
