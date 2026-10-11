"use client";
import { products, type forecastLedger } from "../data/alecs.v1";
import { capacity, type calculate } from "../engine/alecs";
import { money, n, useWorkspace } from "./Workspace";
export function Schedule({
  mix,
  label,
}: {
  mix: readonly number[];
  label: string;
}) {
  const c = capacity(mix),
    { setSku } = useWorkspace();
  const active = mix.map((q, i) => ({ q, i })).filter((r) => r.q > 0);
  return (
    <div className="schedule-row">
      <div className="schedule-label">
        <strong>{label}</strong>
        <span>
          {n(c.total)} cups · {c.totalHours.toFixed(2)} h
        </span>
      </div>
      <div
        className="schedule-track"
        aria-label={`${label}: ${c.totalHours.toFixed(2)} line hours including ${c.changeoverHours} changeover hours`}
      >
        {active.map((r, index) => (
          <div key={r.i} style={{ display: "contents" }}>
            <button
              className="run-block"
              style={{
                background: products[r.i].color,
                width: `${(r.q / 1200 / 48) * 100}%`,
                border: 0,
              }}
              onClick={() => setSku(r.i)}
              title={`${products[r.i].name}: ${(r.q / 1200).toFixed(2)} hours`}
            >
              {products[r.i].id}
            </button>
            {index < active.length - 1 && (
              <div
                className="changeover"
                style={{ width: `${(0.5 / 48) * 100}%` }}
                title="0.5 hour changeover"
              />
            )}
          </div>
        ))}
      </div>
      <div className="schedule-scale">
        <span>0 hours</span>
        <span>24 hours</span>
        <span>48 hours</span>
      </div>
      <p className="chart-note">
        {c.feasible
          ? "✓ Within line allocation"
          : "! Exceeds 40 allocated hours"}{" "}
        · Gray blocks: changeovers. Widths represent actual line time; component
        checks follow below.
      </p>
    </div>
  );
}
export function StockChart({
  row,
}: {
  row: ReturnType<typeof calculate>["skuWeek"][number];
}) {
  const max = Math.max(
    1,
    ...row.weeks.flatMap((w) => [
      w.closing,
      w.required,
      w.receipts,
      w.buffer ?? 0,
    ]),
  );
  const x = (i: number) => 55 + i * (540 / Math.max(1, row.weeks.length - 1));
  const y = (v: number) => 215 - (v / max) * 175;
  const points = (field: "closing" | "required" | "receipts") =>
    row.weeks.map((w, i) => `${x(i)},${y(w[field])}`).join(" ");
  return (
    <>
      <div className="plot-scroll">
        <svg
          viewBox="0 0 640 270"
          className="plot"
          role="img"
          aria-label={`${row.skuId} brand-owned stock projection, cup equivalents by week. Closing stock never negative. Unserved requirement ${n(row.unmet)} cups.`}
        >
          <title>{row.skuId} simulated brand stock and dispatch · cups</title>
          {[0, 0.5, 1].map((t) => (
            <g key={t}>
              <line
                className="axis"
                x1="55"
                x2="600"
                y1={y(t * max)}
                y2={y(t * max)}
              />
              <text x="45" y={y(t * max) + 4} textAnchor="end">
                {n(t * max)}
              </text>
            </g>
          ))}
          <polyline
            points={points("required")}
            fill="none"
            stroke="#997357"
            strokeWidth="2"
            strokeDasharray="5 4"
          />
          <polyline
            points={points("receipts")}
            fill="none"
            stroke="#8B6412"
            strokeWidth="1.5"
            strokeDasharray="2 4"
          />
          <polyline
            points={row.weeks
              .filter((w) => w.buffer !== null)
              .map((w, i) => `${x(i)},${y(w.buffer!)}`)
              .join(" ")}
            fill="none"
            stroke="#66736A"
            strokeDasharray="8 5"
            strokeWidth="1.5"
          />
          <polyline
            points={points("closing")}
            fill="none"
            stroke="#21372F"
            strokeWidth="3"
          />
          {row.weeks.map((w, i) => (
            <g key={w.week}>
              <circle cx={x(i)} cy={y(w.closing)} r="4" fill="#21372F" />
              {w.unmet > 0 && (
                <rect
                  x={x(i) - 9}
                  y={y(w.unmet)}
                  width="18"
                  height={215 - y(w.unmet)}
                  fill="#943B35"
                  opacity=".65"
                />
              )}
              <text x={x(i)} y="237" textAnchor="middle">
                W{w.week}
              </text>
            </g>
          ))}
          <text x="55" y="16">
            Cups · aggregate SKU · simulated
          </text>
        </svg>
      </div>
      <div className="legend">
        <span>
          <i style={{ background: "#21372F" }} />
          Closing physical stock
        </span>
        <span>
          <i style={{ background: "#997357" }} />
          Required dispatch · dashed
        </span>
        <span>
          <i style={{ background: "#8B6412" }} />
          Released receipts · dotted
        </span>
        <span>
          <i style={{ background: "#66736A" }} />
          Forward buffer · dashed
        </span>
        <span>
          <i style={{ background: "#943B35" }} />
          Unserved requirement
        </span>
      </div>
      <p className="chart-note">
        {n(row.closing)} cups ending stock · {n(row.unmet)} cups unserved ·
        first shortage: {row.firstShortage ? `W${row.firstShortage}` : "none"} ·
        first buffer breach:{" "}
        {row.firstBufferBreach
          ? `W${row.firstBufferBreach}`
          : "none in complete forecast periods"}
        .
      </p>
    </>
  );
}
export function ForecastChart({
  ledger,
}: {
  ledger: (typeof forecastLedger)[number];
}) {
  const max =
    Math.max(...ledger.actual, ...ledger.naive, ...ledger.reviewed) * 1.12;
  const y = (v: number) => 220 - (v / max) * 185;
  const x = (i: number) => 65 + i * 170;
  return (
    <>
      <div className="plot-scroll">
        <svg
          viewBox="0 0 640 270"
          className="plot"
          role="img"
          aria-label={`${ledger.skuId} actual, naive and reviewed synthetic POS forecasts for four launch weeks, in cups`}
        >
          <title>
            Synthetic archived forecasts compared with actual POS · Target panel
          </title>
          {[0, 0.5, 1].map((t) => (
            <g key={t}>
              <line
                className="axis"
                x1="65"
                x2="590"
                y1={y(t * max)}
                y2={y(t * max)}
              />
              <text x="53" y={y(t * max) + 4} textAnchor="end">
                {n(t * max)}
              </text>
            </g>
          ))}
          {(["actual", "naive", "reviewed"] as const).map((key, k) => (
            <g key={key}>
              <polyline
                points={ledger[key].map((v, i) => `${x(i)},${y(v)}`).join(" ")}
                stroke={["#21372F", "#997357", "#A54E6B"][k]}
                strokeWidth="2.5"
                strokeDasharray={k === 1 ? "5 4" : undefined}
                fill="none"
              />
              {ledger[key].map((v, i) => (
                <circle
                  key={i}
                  cx={x(i)}
                  cy={y(v)}
                  r="4"
                  fill={["#21372F", "#997357", "#A54E6B"][k]}
                />
              ))}
            </g>
          ))}
          {["14 Sep", "21 Sep", "28 Sep", "5 Oct"].map((w, i) => (
            <text key={w} x={x(i)} y="245" textAnchor="middle">
              {w}
            </text>
          ))}
          <text x="65" y="17">
            Cups · Target panel · synthetic ledger
          </text>
        </svg>
      </div>
      <div className="legend">
        {[
          "Actual synthetic POS",
          "Naive forecast · dashed",
          "Illustrative reviewed forecast",
        ].map((s, i) => (
          <span key={s}>
            <i style={{ background: ["#21372F", "#997357", "#A54E6B"][i] }} />
            {s}
          </span>
        ))}
      </div>
    </>
  );
}
export function CashTimeline({
  payments,
}: {
  payments: readonly {
    dueDate: string;
    label: string;
    commitmentId: string;
    amount: number;
  }[];
}) {
  return (
    <div className="cash-timeline">
      {payments.map((p) => (
        <div key={p.dueDate} className="payment">
          <time dateTime={p.dueDate}>
            {new Date(p.dueDate + "T12:00:00Z").toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
              timeZone: "UTC",
            })}
          </time>
          <strong>{money(p.amount)}</strong>
          <p>{p.label}</p>
          <details>
            <summary>Payment reference</summary>
            <p>
              {p.commitmentId} · future obligation · synthetic input. Previously
              paid amounts excluded.
            </p>
          </details>
        </div>
      ))}
    </div>
  );
}
export function Waterfall({
  pre,
  launch,
  incumbent,
  latest,
}: {
  pre: number;
  launch: number;
  incumbent: number;
  latest: number;
}) {
  const y = (v: number) => 230 - (v / 14000) * 185;
  const data = [
    {
      label: ["Pre-launch Target", "portfolio"],
      bottom: 0,
      top: pre,
      value: n(pre),
      color: "#8FB69C",
    },
    {
      label: ["Collaboration", "sales"],
      bottom: pre,
      top: pre + launch,
      value: "+" + n(launch),
      color: "#E98AA3",
    },
    {
      label: ["Incumbent product", "movement"],
      bottom: latest,
      top: pre + launch,
      value: n(incumbent),
      color: "#997357",
    },
    {
      label: ["Latest Target", "portfolio"],
      bottom: 0,
      top: latest,
      value: n(latest),
      color: "#21372F",
    },
  ];
  return (
    <div className="plot-scroll">
      <svg
        viewBox="0 0 620 310"
        className="plot"
        role="img"
        aria-label={`Target portfolio waterfall: ${n(pre)} prelaunch plus ${n(launch)} collaboration and ${n(incumbent)} incumbent movement equals ${n(latest)} latest cups per week.`}
      >
        <title>
          Observed synthetic Target portfolio waterfall · cups per week
        </title>
        {[0, 5000, 10000].map((v) => (
          <g key={v}>
            <line className="axis" x1="55" x2="605" y1={y(v)} y2={y(v)} />
            <text x="47" y={y(v) + 3} textAnchor="end">
              {n(v)}
            </text>
          </g>
        ))}
        {data.map((d, i) => (
          <g key={i}>
            <rect
              x={75 + i * 135}
              y={y(d.top)}
              width="87"
              height={y(d.bottom) - y(d.top)}
              fill={d.color}
              rx="4"
            />
            <text
              x={118 + i * 135}
              y={y(d.top) - 11}
              textAnchor="middle"
              style={{ fill: "#21372F", fontSize: 16, fontWeight: 500 }}
            >
              {d.value}
            </text>
            {d.label.map((line, l) => (
              <text
                key={line}
                x={118 + i * 135}
                y={253 + l * 15}
                textAnchor="middle"
              >
                {line}
              </text>
            ))}
          </g>
        ))}
        <text x="55" y="17">
          Cups / week · synthetic observed movement
        </text>
      </svg>
    </div>
  );
}
