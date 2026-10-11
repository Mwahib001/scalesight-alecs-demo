# Completed demo audit

The Alec’s × ScaleSight demo is complete for the supplied synthetic planning scope. The initial audit findings are resolved, and the implemented browser acceptance checks now pass. Production-build validation remains unexecuted under the user's instruction not to build or start a server.

Reference: `docs/ScaleSight_Alecs_Technical_Specification_Wahib_v1.pdf`, all eleven routes and the existing user-started development app. Later user requirements are preserved: live browser-local review date, cream with `#124398`, supplied product photographs and a text wordmark. Historical and modeled dates remain attached to the source snapshot.

## Verification

| Check                                                | Final result                                                                                      |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Numerical, data, generator and engine-contract tests | **36 passed**                                                                                     |
| Browser acceptance cases                             | **32 unique cases passed across the suite and final targeted reruns**                             |
| Direct routes                                        | **11/11** load successfully with no recorded hydration/page errors                                |
| Baseline responsive sweep                            | **110/110** route/width combinations pass; no page-wide overflow or broken images detected        |
| Active scenario / extended horizon layouts           | **24/24** pass, including evidence drawer bounds                                                  |
| Route accessibility                                  | Axe passes on all 11 desktop routes                                                               |
| Additional accessibility                             | Mobile navigation/evidence dialogs, expanded raw-input table and four tablet scenario states pass |
| Live date                                            | Verified browser-local midnight rollover from 11 to 12 October                                    |
| TypeScript, ESLint and Prettier                      | Pass                                                                                              |
| Production build and server startup                  | **Not run**                                                                                       |

Baseline widths: 320, 360, 390, 460, 768, 820, 1024, 1280, 1440 and 1920px. Active scenarios: release delay, component-constrained production, deeper component quantity and incompatible allocation destination at 320, 390, 768, 820, 1024 and 1440px. Detailed tables and charts intentionally scroll inside their own keyboard-accessible containers.

The browser suite's full run passed 29 cases and initially failed two new checks: an ambiguous warning selector and an aggregate test timeout during 24 repeated page loads. The warning selector was scoped to the application alert, and the scenario sweep was reorganized to resize each loaded route. All preset outcomes and invalid-input handling passed their rerun. The active sweep additionally found a scroll-region keyboard issue, which was fixed and verified. A new raw-input investigation case also passed. Five targeted checks and the final active-scenario check passed after the changes. No assertions were weakened or accessibility rules disabled.

These results cover Chromium and the recorded viewports/states; no Safari, Firefox, real-device or production-build pass is claimed.

## Closed findings

| Finding                                                       | Resolution                                                                                                                                                                        |
| ------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Development hydration stalled behind preview proxy            | Disabled the optional Next.js React development debug stream; app hydration and live-date rollover work without that WebSocket dependency                                         |
| SVG title hydration errors exposed by working client runtime  | Dynamic SVG titles render as single strings; direct-route checks pass                                                                                                             |
| Evidence ownership, period and horizon were incorrect         | Product evidence requires caller-supplied scope; retail POS/forecasts and brand-owned stock are distinguished, including W1–W13                                                   |
| Managed Planning overflow at 768px                            | Service columns adapt at tablet widths; all 110 baseline combinations pass                                                                                                        |
| Contrast, duplicate region names, heading and landmark issues | Darker muted text, readable stage numbers, unique comparison labels, coherent headings and a header landmark containing review/disclosure                                         |
| Scrolling charts lacked keyboard access                       | Chart scroll regions have focus targets and meaningful accessible names                                                                                                           |
| Missing cohort product-history links                          | Mix rows link to the selected SKU's history while retaining cohort and scenario context                                                                                           |
| Investigation controls reset unexpectedly                     | Analytical views, comparison cohort, quantity, timing, pack/destination, cash view and projection horizons persist in URL history across navigation and reload                    |
| Engine contract lacked structured constraint details          | Rule/entity/severity/explanation records, allocation results, component availability-by-run, economics aliases and explicit dated-cash uncertainty                                |
| Repeated variable planning anchors                            | Capacity, component and cash comparisons consume shared fixture/engine values; schedule widths use shared rates and actual changeover hours                                       |
| Raw-input validation coverage incomplete                      | Separate immutable feed covers all 12 prescribed issue types, with explicit case conversion, exclusion and current-metadata treatment; visible investigation in Forecast Learning |
| Allocation checklist ignored edited compatibility             | Pack, destination and arrival checks now reflect the selected restrictions                                                                                                        |

The 36 numerical tests retain the PDF's launch, cohort, inventory, requested/reviewed production, component, allocation, cost/cash, WAPE/bias and scenario benchmarks. The deterministic panel still contains 44,800 rows and excludes 9,600 comparison rows from operating demand.

## Evidence and scope boundaries

- [Baseline layout measurements](docs/audit/viewport-results.json).
- [Active scenario and drawer measurements](docs/audit/active-viewport-results.json).
- [Accessibility outcome register](docs/audit/accessibility-results.json).
- [Initial findings, retained for comparison](docs/audit/initial-findings.md).
- Acceptance coverage: `tests/browser/alecs.spec.ts` and `tests/browser/final-audit.spec.ts`.
- Final run logs: `/tmp/alecs-completion-final-browser.log`, `/tmp/alecs-completion-recheck.log`, `/tmp/alecs-completion-active-final.log`.

Unspecified real-client inputs remain explicit in `OPEN_QUESTIONS.md`. Transfer depletion timing, optional purchase terms, changed scenario payment dates, client approval and compatible club supply are deliberately unresolved source boundaries. They have not been fabricated to make the demo appear executable. There are no live integrations or operational execution controls.

The original PDF remains unchanged. No production build, server startup, deployment, publishing or external communication was performed.
