# Initial audit — before completion fixes

Archived findings; see the [completed audit](../../FINAL_AUDIT.md) for current status.

Audited 11 October 2026 against `docs/ScaleSight_Alecs_Technical_Specification_Wahib_v1.pdf` (121 pages), the current source, and the existing application at `http://127.0.0.1:3000`.

**Verdict: substantial implementation, but not ready for a “complete, correct, unbroken and fully responsive” sign-off.** Core numerical acceptance passes. Confirmed presentation and evidence defects remain, and the current development runtime prevents successful interactive acceptance.

This audit treats the PDF as the specification to compare against, not as authorization to build, start servers, place orders, publish or contact anyone. The user's later requirements override the PDF's fixed displayed review date and proposed palette: live browser-local review date, `#124398` with cream, supplied product photographs and a text wordmark. Historical observations, source snapshots and modeled payment/release dates correctly stay attached to the synthetic timeline.

## Executed checks

| Check                                    | Result                                                                                                                  |
| ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Numerical/data/generator suite           | **34 passed**, zero failures                                                                                            |
| TypeScript                               | Passed                                                                                                                  |
| ESLint, zero warnings                    | Passed, including the added audit tests                                                                                 |
| Prettier                                 | Passed for application, existing tests and documentation; added audit test formatted                                    |
| Existing browser suite                   | **4 passed, 19 failed**; failed runs include confirmed accessibility defects and runtime-dependent interaction failures |
| Added final-audit browser checks         | **5 failed**: viewport overflow plus four runtime-dependent checks                                                      |
| Direct rendered routes                   | **11/11 returned HTTP 200** in the viewport sweep                                                                       |
| Responsive layout sweep                  | **110 combinations**: 11 routes × 320, 360, 390, 460, 768, 820, 1024, 1280, 1440 and 1920 pixels                        |
| Page-wide overflow                       | **109/110 within viewport; Managed Planning at 768px fails**                                                            |
| Product image failures in the sweep      | None detected                                                                                                           |
| Uncaught `pageerror` events in the sweep | None; development WebSocket console errors were recorded separately                                                     |
| Production build / server startup        | **Not run**, as instructed                                                                                              |

The numerical suite checks the PDF's principal launch, cohort, receipt/POS, production, inventory, component, allocation, cash, scenario and forecast benchmarks. It also checks immutability, invalid bounds, nonnegative physical stock, timing, unit conversions, lot compatibility, deterministic 44,800-row panel generation and checksum reconciliation. These passing tests do not establish that every browser interaction works.

Browser execution used Chromium against the already-running development app. This is not a production, Safari, Firefox or real-device certification. Selected full-page screenshots were inspected at 320px and 820px, with captures also collected at 390px and 1440px.

## Findings

### F01 — Interactive acceptance blocked in the current runtime

**Priority: release blocker; root cause requires runtime/environment verification.**

The development connection to `ws://127.0.0.1:3000/_next/hmr?...` repeatedly fails with `ERR_INVALID_HTTP_RESPONSE`. Scripts and HTML return successfully, but the review date stays at the server placeholder `—`; scenario buttons, evidence drawers, product/cohort changes, transfer-date changes and mobile navigation do not pass their browser checks.

The installed Next.js version enables its React development debug channel by default, and the initial Flight decoding uses that channel. The failed WebSocket transport is therefore a plausible explanation for stalled hydration. This is a diagnosis supported by the trace and installed framework source, **not proof that every failed interaction has an application-code defect**. The existing server/proxy/dev transport needs to be checked before rerunning interactive acceptance. No server was started or restarted and no framework settings were changed during this audit.

The four passing original cases are native link-navigation cases. They must not be treated as evidence that React interactions work. Added tests cover next-day review-date rollover, evidence scope, mobile dialogs and investigation-state restoration; their interactive acceptance remains unsuccessful in this runtime.

Evidence: browser traces in `test-results/` and `/tmp/alecs-final-audit/latest-results/`. Installed framework references: `node_modules/next/dist/server/config-shared.js`, `node_modules/next/dist/client/app-index.js`, and `node_modules/next/dist/client/dev/debug-channel.js`.

### F02 — Evidence drawers mislabel retailer POS as future brand-owned stock

**Priority: high. PDF §§05, 07.02, 07.04, 07.11, 08.**

`src/components/evidence.ts:36` hardcodes every `productEvidence` scope to “aggregate brand-owned stock · W1–W8 (12 Oct–6 Dec 2026).” The same helper is used for:

- Incrementality's historical **Target consumer POS**, spanning August–October.
- Forecast Learning's **Target POS and archived launch-period forecasts**, spanning September–October.
- Production and Scenario Lab's **13-week projections**, whose drawers still say W1–W8.

The input values may be correct, but the drawer's ownership, period and scope are incorrect for those uses. Scope must be supplied by the caller, including the selected horizon. This conflicts with the PDF's explicit requirement to distinguish retailer-owned/retail observations from brand-owned inventory and provide result-specific evidence.

### F03 — Tablet horizontal overflow at 768px

**Priority: medium. PDF §§08–09.**

On `/managed-intelligence` at a 768px viewport, document width is **773px**, producing 5px of page-wide horizontal overflow. The third and sixth `.service-step` cards extend beyond the viewport. The sidebar remains visible above 760px, while `.service-flow` keeps three columns until the 760px breakpoint; those columns are too narrow at this tablet width.

Adjust the service-flow breakpoint or column sizing and recheck the surrounding widths. Detailed tables/charts intentionally scroll within their containers; this finding concerns the page itself.

The other 109 baseline route/width combinations did not show page-wide overflow. That limited result does not certify dialogs, all scenario states, zoomed text or every device because interactive checks remain blocked.

Evidence: [complete viewport measurements](initial-viewports.json). Relevant styles: `src/app/globals.css` `.service-flow` and the 760px media query.

### F04 — Accessibility acceptance fails

**Priority: medium. PDF §08.**

The original browser suite's axe checks fail on all eleven routes. Confirmed categories:

- **Color contrast:** muted table headers, summary labels, selected-option descriptions and home-card stage numbers fall below the required contrast. For example, the home stage number on yellow is 3.65:1 and the strawberry stage number is 2.89:1, against a 4.5:1 requirement for that small text; muted summary text is 4.29:1.
- **Duplicate region names:** multiple tables use the same fallback `aria-label="Planning comparison"` because callers omit captions. Several pages fail `landmark-unique`.
- **Content outside landmarks:** `.review-bar` and the persistent disclosure sit outside the header/main landmarks, failing axe's `region` rule.
- **Heading order:** Allocation starts regional sections with `h3` directly after the page `h1`, failing `heading-order`.

Use sufficient text contrast, unique table captions/labels, appropriate landmark placement and a coherent heading hierarchy. Focus outlines, reduced-motion CSS, labeled controls and full-height dialog styles exist in source, but rendered dialog behavior is not certified.

Evidence: [accessibility categories by route](initial-accessibility-results.json), original traces/error contexts in `test-results/`. Relevant source: `src/app/globals.css:431`, `src/components/Workspace.tsx:292`, `src/components/Workspace.tsx:578`, `src/components/ProductionViews.tsx:678`.

### F05 — Some PDF behavior and engine contracts remain incomplete

**Priority: medium; source-confirmed gaps and verification risks.**

- **SKU-history drilldown from cohorts:** the selected-cohort product-mix table renders plain SKU codes with no product-selection/history action (`src/components/DemandViews.tsx:598`). PDF §07.06 explicitly asks to open the relevant SKU history. Add a contextual link preserving the selected cohort and SKU. Some tables also omit the product name required alongside SKU codes by §08.
- **Investigation state:** product, cohort and scenario parameters are URL-backed, but observed/counterfactual views, comparison cohort, production option/horizon, component quantity, allocation date/pack/destination and cash view are page-local state. They are not explicitly persisted across route remounts or reloads. PDF §07.02 requires returning to an investigation without unexpected resets. The added test checks that the toggle actually activates before attempting navigation; it currently fails at activation because of F01, so this audit does not claim an independently reproduced navigation regression.
- **Engine output contract:** PDF §05 specifies structured violations with rule/entity/severity/explanation and allocation results in the calculation output. `calculate()` currently returns `violations: string[]`; allocation is calculated through a separate helper, and the prescribed unified output contract is not fully implemented. Numerical fixture behavior passes, but full technical-contract compliance should not be claimed.
- **Shared-source drift risk:** some displayed anchors and formulas are repeated as literals in views (for example requested cash `29965`, available hours/base/packaging and historical evidence formulas), rather than consistently consumed from shared selectors. Their current canonical values match the tested fixture; this is a maintenance/completeness gap, not a demonstrated arithmetic failure.

## PDF route coverage

| PDF section / route            | Audit assessment                                                                                                                                                        |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| §07.03 `/`                     | Four decision cards, correct supplied image mappings, window cost/cash separation and linked journey implemented; contrast and runtime issues remain                    |
| §07.04 `/incrementality`       | Observed/counterfactual comparisons, qualified ratios and history implemented; historical evidence scope is mislabeled                                                  |
| §07.05 `/reorder-quality`      | Receipt/POS/inventory lanes and cohort arithmetic implemented; interactive cohort acceptance blocked                                                                    |
| §07.06 `/cohorts`              | Scatterplot, comparison, availability and mix tables implemented; SKU-history drilldown missing                                                                         |
| §07.07 `/production`           | Requested/reviewed schedules, constraints, SKU projections and 13-week option implemented; evidence horizon and runtime issues remain                                   |
| §07.08 `/components`           | Eight-SKU dependencies, quantity comparisons, existing POs and uncommitted option implemented; accessibility/runtime acceptance fails                                   |
| §07.09 `/allocation`           | CC04 conservation/donor arithmetic, timing uncertainty and pack/destination checks implemented; heading hierarchy and runtime issues remain                             |
| §07.10 `/cash`                 | Dated baseline payments, production-cost separation, paid-deposit exclusion and exposure table implemented; accessibility/runtime acceptance fails                      |
| §07.11 `/forecast-learning`    | Archived ledger, issue/observation dates, WAPE/bias, Vanilla baseline and proposed-method labels implemented; evidence scope incorrect                                  |
| §07.12 `/scenarios`            | Eight presets, bounded controls, nonnegative stock/unserved requirements and canonical stress results implemented; browser propagation/reset not validated successfully |
| §07.13 `/managed-intelligence` | Worked service example, ownership and specific pilot explanation implemented; 768px overflow and accessibility issues remain                                            |

All routes and the core synthetic model exist. Missing real inputs described in `OPEN_QUESTIONS.md`—such as transfer depletion timing, cancellation terms and client approval—are intentional source boundaries, not features to fabricate. The lack of a certified logo is covered by the user's text-wordmark instruction. No unsupported claim of live integrations, trained ML, client approval or guaranteed savings is needed to finish the demo.

## Sign-off conditions

Resolve the development transport/hydration problem, correct F02–F05, and rerun browser acceptance including date rollover, all products/cohorts/presets, navigation/history/reset, incompatible states, dialogs/focus and the responsive matrix. Include active exploration and 13-week states in rendered checks. Production-build verification remains outstanding until the user runs or authorizes it.

This audit changes tests and audit documentation only. It does not silently fix application behavior or claim production readiness.
