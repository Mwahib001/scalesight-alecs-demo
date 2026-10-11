"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  createContext,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Boxes,
  CalendarDays,
  Check,
  ChevronRight,
  CircleHelp,
  ClipboardList,
  FlaskConical,
  Layers,
  Menu,
  RefreshCcw,
  Search,
  Sparkles,
  Truck,
  Wallet,
  X,
} from "lucide-react";
import {
  disclosure,
  missing,
  products,
  scenarios,
  type EvidenceClass,
} from "../data/alecs.v1";
import {
  baselineExploration,
  calculate,
  isExploring,
  preset,
  validate,
  type Exploration,
} from "../engine/alecs";
export const navigation = [
  {
    group: "Weekly review",
    items: [["/", "Weekly Decision Brief", ClipboardList]],
  },
  {
    group: "Demand evidence",
    items: [
      ["/incrementality", "Launch Incrementality", BarChart3],
      ["/reorder-quality", "Reorder Quality", RefreshCcw],
      ["/cohorts", "Store Cohorts", Layers],
    ],
  },
  {
    group: "Production commitments",
    items: [
      ["/production", "Production Priorities", CalendarDays],
      ["/components", "Components & Commitments", Boxes],
      ["/allocation", "Allocation", Truck],
      ["/cash", "Cash Exposure", Wallet],
    ],
  },
  {
    group: "Analytical review",
    items: [
      ["/forecast-learning", "Forecast Learning", Sparkles],
      ["/scenarios", "Scenario Lab", FlaskConical],
    ],
  },
  {
    group: "ScaleSight service",
    items: [["/managed-intelligence", "Managed Planning", CircleHelp]],
  },
] as const;
export type Evidence = {
  title: string;
  question: string;
  scope: string;
  inputs: Record<string, unknown>;
  calculation: string;
  assumptions: string;
  constraints: string;
  unknown: string;
  sourceId: string;
  evidenceClass: EvidenceClass;
  source?: string;
};
type WorkspaceContext = {
  sku: number;
  cohort: number;
  scenario: Exploration;
  result: ReturnType<typeof calculate>;
  setSku: (n: number) => void;
  setCohort: (n: number) => void;
  setScenario: (s: Exploration) => void;
  href: (path: string, sku?: number) => string;
  openEvidence: (e: Evidence) => void;
};
const Context = createContext<WorkspaceContext | null>(null);
export function useWorkspace() {
  const ctx = useContext(Context);
  if (!ctx) throw new Error("Workspace context missing");
  return ctx;
}
export function ContextLink({
  to,
  sku,
  children,
  className,
}: {
  to: string;
  sku?: number;
  children: ReactNode;
  className?: string;
}) {
  const c = useWorkspace();
  return (
    <Link className={className ?? "text-link"} href={c.href(to, sku)}>
      {children}
    </Link>
  );
}
export function Workspace({ children }: { children: ReactNode }) {
  const path = usePathname(),
    search = useSearchParams(),
    router = useRouter();
  const rawSku = products.findIndex((p) => p.id === search.get("sku")),
    sku = rawSku < 0 ? (path === "/allocation" ? 3 : 0) : rawSku;
  const rawCohort = ["A", "B", "C", "D"].indexOf(search.get("cohort") ?? "A"),
    cohort = rawCohort < 0 ? 0 : rawCohort;
  const selectedPreset = scenarios.some((s) => s.id === search.get("scenario"))
    ? search.get("scenario")!
    : "S0";
  let scenario = { ...preset(selectedPreset) };
  if (search.has("demand"))
    scenario.demandChange = Number(search.get("demand"));
  if (search.has("demandSku"))
    scenario.demandSku = Number(search.get("demandSku"));
  if (search.has("timing")) scenario.timingShift = Number(search.get("timing"));
  if (search.has("base")) scenario.basePercent = Number(search.get("base"));
  let invalid = false;
  try {
    validate(scenario);
  } catch {
    invalid = true;
    scenario = { ...baselineExploration };
  }
  const result = calculate(scenario),
    active = isExploring(scenario);
  const [menu, setMenu] = useState(false),
    [evidence, setEvidence] = useState<Evidence | null>(null);
  const drawer = useRef<HTMLDialogElement>(null),
    navDialog = useRef<HTMLDialogElement>(null);
  const current =
    navigation
      .map((g) => g.items.find((i) => i[0] === path)?.[1])
      .find(Boolean) ?? "Weekly Decision Brief";
  function update(values: Record<string, string | null>) {
    const params = new URLSearchParams(search.toString());
    Object.entries(values).forEach(([k, v]) =>
      v === null ? params.delete(k) : params.set(k, v),
    );
    router.push(`${path}${params.size ? "?" + params.toString() : ""}`, {
      scroll: false,
    });
  }
  function setScenario(s: Exploration) {
    validate(s);
    update({
      scenario: s.preset === "S0" && !isExploring(s) ? null : s.preset,
      demand: s.demandChange === 0 ? null : String(s.demandChange),
      demandSku: s.demandSku === 0 ? null : String(s.demandSku),
      timing: s.timingShift === 0 ? null : String(s.timingShift),
      base: s.basePercent === 100 ? null : String(s.basePercent),
    });
  }
  const makeHref = (to: string, selected?: number) => {
    const p = new URLSearchParams(search.toString());
    if (selected !== undefined) p.set("sku", products[selected].id);
    return to + (p.size ? "?" + p.toString() : "");
  };
  const value: WorkspaceContext = {
    sku,
    cohort,
    scenario,
    result,
    setSku: (n) => update({ sku: products[n].id }),
    setCohort: (n) => update({ cohort: ["A", "B", "C", "D"][n] }),
    setScenario,
    href: makeHref,
    openEvidence: (e) => {
      setEvidence(e);
      drawer.current?.showModal();
    },
  };
  const nav = (
    <>
      <Link href="/" className="wordmark" aria-label="Alec’s home">
        alec’s<span>THE PLANNING WORKSPACE</span>
      </Link>
      <div className="sidebar-rule" />
      <nav aria-label="Primary navigation">
        {navigation.map((g) => (
          <div className="nav-group" key={g.group}>
            <p>{g.group}</p>
            {g.items.map(([to, label, Icon]) => (
              <Link
                key={to}
                href={makeHref(to)}
                aria-current={path === to ? "page" : undefined}
                className={path === to ? "active" : ""}
                onNavigate={() => {
                  setMenu(false);
                  navDialog.current?.close();
                }}
              >
                <Icon size={16} />
                <span>{label}</span>
                {path === to && <ChevronRight size={14} />}
              </Link>
            ))}
          </div>
        ))}
      </nav>
      <div className="sidebar-foot">
        <span className="ss-mark">S</span>
        <div>
          <strong>Maintained by ScaleSight</strong>
          <span>Analytical capacity. Client judgment.</span>
        </div>
        <Link
          href={makeHref("/managed-intelligence")}
          aria-label="About managed planning"
        >
          <ArrowUpRight size={16} />
        </Link>
      </div>
    </>
  );
  return (
    <Context.Provider value={value}>
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <aside className="sidebar">{nav}</aside>
      <dialog
        ref={navDialog}
        className="mobile-nav"
        aria-label="Workspace navigation"
        onClose={() => setMenu(false)}
      >
        <button
          className="icon-button close-nav"
          aria-label="Close navigation"
          onClick={() => navDialog.current?.close()}
        >
          <X />
        </button>
        {nav}
      </dialog>
      <div className="workspace">
        <header className="topbar">
          <div className="breadcrumb">
            <button
              className="icon-button menu-toggle"
              aria-label="Open navigation"
              aria-expanded={menu}
              onClick={() => {
                setMenu(true);
                navDialog.current?.showModal();
              }}
            >
              <Menu size={20} />
            </button>
            <span className="workspace-identity">
              Alec’s × ScaleSight<small>Retail-to-Production Planning</small>
            </span>
            <ChevronRight size={13} />
            <strong>{current}</strong>
          </div>
          <span className="data-badge">
            <FlaskConical size={13} /> Illustrative data
          </span>
        </header>
        <div className="review-bar">
          <span>
            <CalendarDays size={14} /> Review date: 12 October 2026
          </span>
          <span className={active ? "exploring-state" : "baseline-state"}>
            {active ? <FlaskConical size={13} /> : <Check size={13} />}{" "}
            {active
              ? `Exploring: ${scenario.demandChange !== 0 ? `${products[scenario.demandSku].short === "Breakfast" ? "Collaboration" : products[scenario.demandSku].short} demand ${scenario.demandChange > 0 ? "+" : ""}${scenario.demandChange}%` : scenario.timingShift !== 0 ? `Release shift ${scenario.timingShift > 0 ? "+" : ""}${scenario.timingShift} week(s)` : scenario.basePercent !== 100 ? `Base availability ${scenario.basePercent}%` : (scenarios.find((s) => s.id === scenario.preset)?.label ?? "Custom inputs")}`
              : "Reviewed baseline"}
          </span>
          {active && (
            <button
              className="reset"
              onClick={() => setScenario({ ...baselineExploration })}
            >
              <RefreshCcw size={13} /> Reset exploration
            </button>
          )}
        </div>
        <p className="disclosure">{disclosure}</p>
        {invalid && (
          <p role="alert" className="warning">
            Enter a value within the supported scenario range. Reviewed baseline
            shown; invalid URL inputs have not been calculated.
          </p>
        )}
        {active && (
          <div className="exploration-banner">
            <FlaskConical size={17} />
            <div>
              <strong>
                Exploration · reviewed recommendation remains unchanged
              </strong>
              <p>
                Simulated outcome. A changed recommendation requires specialist
                review and client context.
              </p>
            </div>
          </div>
        )}
        <main id="main-content">
          {children}
          <footer>
            <span>
              Analysis maintained by ScaleSight. Decisions made with the client.
            </span>
            <span>ALECS-DEMO-2026-10-12-V1</span>
          </footer>
        </main>
      </div>
      <dialog
        ref={drawer}
        className="evidence-dialog"
        aria-label="Evidence and assumptions"
      >
        <div className="drawer-header">
          <span className="eyebrow">EVIDENCE & ASSUMPTIONS</span>
          <button
            aria-label="Close evidence"
            className="icon-button"
            onClick={() => drawer.current?.close()}
          >
            <X size={22} />
          </button>
        </div>
        {evidence && (
          <>
            <h2>{evidence.title}</h2>
            <p>{evidence.question}</p>
            <span className="evidence-class">{evidence.evidenceClass}</span>
            <dl className="evidence-list">
              <dt>Scope · product / retailer / period</dt>
              <dd>{evidence.scope}</dd>
              <dt>Input values</dt>
              <dd>
                <pre>
                  {JSON.stringify(
                    evidence.inputs,
                    (_, value) => (value === null ? missing : value),
                    2,
                  )}
                </pre>
              </dd>
              <dt>Calculation</dt>
              <dd>{evidence.calculation}</dd>
              <dt>Assumptions</dt>
              <dd>{evidence.assumptions}</dd>
              <dt>Constraints</dt>
              <dd>{evidence.constraints}</dd>
              <dt>What remains unknown</dt>
              <dd>{evidence.unknown}</dd>
              <dt>Source & snapshot</dt>
              <dd>
                {evidence.sourceId} · ALECS-DEMO-2026-10-12-V1
                <br />
                As of 11 October 2026 · reviewed 12 October 2026
                {evidence.source && (
                  <a href={evidence.source} target="_blank" rel="noreferrer">
                    Public product source ↗
                  </a>
                )}
              </dd>
            </dl>
            <p className="small muted">
              PUBLIC FACT: product identity. SYNTHETIC INPUT: operating
              assumptions. DERIVED METRIC: calculation. ANALYST INTERPRETATION:
              proposed decision.
            </p>
          </>
        )}
      </dialog>
    </Context.Provider>
  );
}
export function ProductVisual({
  index,
  imageSrc,
  large = false,
}: {
  index: number;
  imageSrc?: string | null;
  large?: boolean;
}) {
  const p = products[index],
    src = imageSrc === undefined ? p.imageSrc : imageSrc;
  return src ? (
    <Image
      className={`product-image ${large ? "large" : ""}`}
      src={src}
      width={large ? 240 : 130}
      height={large ? 240 : 130}
      alt={`${p.publicName} Culture Cup four-pack`}
      priority={index === 0}
    />
  ) : (
    <div className="product-placeholder">
      <strong>{p.id}</strong>
      {p.short}
    </div>
  );
}
export function ProductSelect() {
  const { sku, setSku } = useWorkspace();
  return (
    <label className="select-label">
      Product
      <select value={sku} onChange={(e) => setSku(Number(e.target.value))}>
        {products.map((p, i) => (
          <option key={p.id} value={i}>
            {p.id} · {p.name}
          </option>
        ))}
      </select>
    </label>
  );
}
export function CohortSelect() {
  const { cohort, setCohort } = useWorkspace();
  return (
    <div className="segmented" aria-label="Select cohort">
      {["A", "B", "C", "D"].map((c, i) => (
        <button
          key={c}
          aria-pressed={cohort === i}
          onClick={() => setCohort(i)}
        >
          Cohort {c}
        </button>
      ))}
    </div>
  );
}
export function EvidenceButton({
  evidence,
  label = "View evidence",
}: {
  evidence: Evidence;
  label?: string;
}) {
  const { openEvidence } = useWorkspace();
  return (
    <button className="evidence-button" onClick={() => openEvidence(evidence)}>
      <Search size={13} />
      {label}
    </button>
  );
}
export function Heading({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p className="page-description">{description}</p>
      </div>
      {children}
    </div>
  );
}
export function Review({
  children,
  decision,
}: {
  children: ReactNode;
  decision: string;
}) {
  const { sku } = useWorkspace();
  return (
    <section className="review">
      <div className="review-label">
        <span className="ss-mark">S</span>
        <strong>ScaleSight review</strong>
        <span>ANALYST INTERPRETATION</span>
      </div>
      <div className="review-content">
        <div>
          {children}
          <div className="confidence">
            <span>
              <strong>
                Demand evidence ·{" "}
                {sku === 0 ? "Moderate" : "High within fixture"}
              </strong>
              {sku === 0
                ? "Recent launch; limited persistence evidence."
                : "Established supplied synthetic dispatch history."}
            </span>
            <span>
              <strong>
                Execution feasibility · {sku === 3 ? "Low" : "Moderate"}
              </strong>
              {sku === 3
                ? "Transfer arrival and intraweek depletion unresolved."
                : "Supplied manufacturing assumptions; release timing needs client context."}
            </span>
          </div>
        </div>
        <div className="client-decision">
          <p className="eyebrow">DECISION FOR ALEC’S</p>
          <p>{decision}</p>
          <small>Illustrative proposal · client decision not recorded.</small>
        </div>
      </div>
    </section>
  );
}
export function NextLink({
  to,
  children,
  sku,
}: {
  to: string;
  children: ReactNode;
  sku?: number;
}) {
  return (
    <ContextLink to={to} sku={sku} className="next-link">
      {children}
      <ArrowRight size={17} />
    </ContextLink>
  );
}
export function Table({
  headers,
  rows,
  caption,
}: {
  headers: string[];
  rows: ReactNode[][];
  caption?: string;
}) {
  return (
    <div
      className="table-scroll"
      tabIndex={0}
      role="region"
      aria-label={caption ?? "Planning comparison"}
    >
      <table>
        {caption && <caption>{caption}</caption>}
        <thead>
          <tr>
            {headers.map((h) => (
              <th key={h} scope="col">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => (
                <td key={j}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
export const n = (v: number | null | undefined) =>
  v === null || v === undefined
    ? "Not specified in demo source"
    : v.toLocaleString("en-US", { maximumFractionDigits: 2 });
export const money = (v: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(v);
