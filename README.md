# Alec’s × ScaleSight

Retail-to-Production Planning — retail signals, reviewed against production, components and cash.

Illustrative planning concept. Operating data and recommendations are synthetic. No live connection or client results.

Next.js 16.3.4 App Router, React 19, TypeScript, local CSS tokens, Lucide icons and accessible SVG charts. All eleven routes are implemented. The original 121-page specification remains unchanged in `docs/ScaleSight_Alecs_Technical_Specification_Wahib_v1.pdf`.

## Run locally

The implementation session did not build the application or start a server, as requested. Run these yourself when ready:

```sh
pnpm dev
```

For a production deployment, `pnpm build` runs unit tests and prepares an isolated production snapshot; `pnpm start` serves it. The existing production lifecycle tooling is retained with Alec’s runtime naming.

## Validation

```sh
pnpm typecheck
pnpm lint
pnpm test
pnpm generate:panel
```

The generator emits an optimized gzip file and SHA-256 manifest in `src/data/generated`. It is deterministic; rebuilding the panel does not start Next.js or build the website. Tests compile only the engine/data/test code into `.test-build`.

Start the app yourself, then run browser checks against that instance:

```sh
PLAYWRIGHT_BASE_URL=http://127.0.0.1:3000 pnpm test:e2e
```

The browser suite has no webServer hook. It covers direct route loading, the four decision links and SKU preselection, evidence drawer keyboard behavior, scenario propagation/reset/history, all product dependencies/forecasts, blocked/infeasible states, transfer timing, mobile/tablet overflow and accessibility. Browser checks are executed against the user-started app; they never build or start a server. The extended audit covers ten viewport widths, live-date rollover, contextual evidence, investigation restoration and active scenario layouts. See `QA_REPORT.md` and `FINAL_AUDIT.md` for the recorded results. Production-build verification remains intentionally deferred.

## Routes

| Group                  | Route                   | Page                     |
| ---------------------- | ----------------------- | ------------------------ |
| Weekly review          | `/`                     | Weekly Decision Brief    |
| Demand evidence        | `/incrementality`       | Launch Incrementality    |
| Demand evidence        | `/reorder-quality`      | Reorder Quality          |
| Demand evidence        | `/cohorts`              | Store Cohorts            |
| Production commitments | `/production`           | Production Priorities    |
| Production commitments | `/components`           | Components & Commitments |
| Production commitments | `/allocation`           | Allocation               |
| Production commitments | `/cash`                 | Cash Exposure            |
| Analytical review      | `/forecast-learning`    | Forecast Learning        |
| Analytical review      | `/scenarios`            | Scenario Lab             |
| ScaleSight service     | `/managed-intelligence` | Managed Planning         |

## Implementation

- `src/data/alecs.v1.ts`: one immutable versioned source fixture, catalog, source metadata, canonical numerical tables, production/component/payment records and dataset registry.
- `src/engine/alecs.ts`: pure calculations, immutable reviewed baseline, inventory simulation, feasibility, costs, cash separation, forecast evaluation, bounds, physical compatibility, lot allocation and raw-input validation.
- `src/engine/panel.ts` and `scripts/generate-panel.ts`: seed-241 LCG store weights; exact largest-remainder four-pack allocation; 44,800 rows, with 9,600 control rows excluded from operating demand.
- `src/components/Workspace.tsx`: persistent navigation, query-string product/cohort/scenario and investigation context, accessible native-dialog Evidence Drawer, disclosures and reset. Context is shareable and survives direct loading and browser history.
- `src/components/WeeklyBrief.tsx`, `DemandViews.tsx`, `ProductionViews.tsx`, `AnalysisViews.tsx`: the eleven product-led views. Relevant analytical results use the same exploratory engine output; reviewed proposals stay identifiable.
- `src/components/PlanningCharts.tsx`: distinct accessible SVG comparisons and production schedules; legends, units and text/table equivalents.
- `src/app/theme.css`: single proposed token palette pairing the cream base with the user-requested `#124398` blue accent, explicitly not certified official Alec’s colors. Albert Sans and Petrona are self-hosted OFL substitutes, not claimed brand fonts.
- `tests/alecs.test.ts`: numerical acceptance, invariants, generator and negative-input checks.

All financial amounts are USD. Forecasts can be fractional cup-equivalents; retailer POS is integer four-packs. Canonical planning anchors are not silently case-rounded. No operational execution controls or live integrations exist.

The optional Next.js development React debug stream is disabled in `next.config.ts`, so hydration does not depend on WebSocket upgrades through a preview proxy. This leaves the demo calculations and production behavior unchanged.

## Review boundaries

`OPEN_QUESTIONS.md` records all A01–A17 treatments and exact missing inputs. `ASSETS_NEEDED.md` records remaining licensing/provenance needs; all eight supplied product images are used with verified mappings in `ASSET_SOURCES.md`.

The regional transfer is quantity-feasible but timing remains conditional. AP-106 is optional and excluded from baseline cash. Club demand is blocked until separately compatible supply is defined. Later inventory never retroactively resolves earlier unmet dispatch. Proposed analytical methods are not presented as trained models or client results.

Analysis maintained by ScaleSight. Decisions made with the client.

The displayed workspace review date uses the viewer’s current local date, refreshed on opening, window focus and every minute. Historical source dates, planning periods and payment dates remain fixed to the synthetic snapshot. `src/components/LiveDate.tsx` provides the shared display.
