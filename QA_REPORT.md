# Verification report

Completion QA: 11 October 2026. Source planning snapshot: 12 October 2026. Displayed review dates use the viewer's local current date.

The demo's initial audit findings have been resolved. See [FINAL_AUDIT.md](FINAL_AUDIT.md) for the closure record and verification limits.

## Executed checks

| Check                          | Result                                                                            |
| ------------------------------ | --------------------------------------------------------------------------------- |
| TypeScript                     | Pass                                                                              |
| ESLint, zero warnings          | Pass                                                                              |
| Engine/data/generator suite    | 36 tests passed                                                                   |
| Browser acceptance             | 32 unique cases passed across the suite and targeted reruns                       |
| Baseline responsiveness        | 110 route/width combinations passed                                               |
| Active scenario responsiveness | 24 state/width combinations passed, including drawer bounds                       |
| Route accessibility            | All 11 routes passed axe                                                          |
| Additional accessibility       | Mobile dialogs, expanded validation table and four tablet explorations passed axe |
| Live review date               | Midnight rollover verified                                                        |
| Deterministic panel            | 44,800 rows; existing checksum and reconciliation pass                            |
| Prettier / diff whitespace     | Pass                                                                              |

Browser checks used the existing user-started app. Long multi-route tests use appropriate time budgets; the viewport sweeps resize loaded routes to avoid unnecessary server navigation. The production build and production lifecycle/rebuild tests were not run because they build/start servers. No production or cross-browser certification is claimed.

## Numerical acceptance

| Result                                              | Verified value                             |
| --------------------------------------------------- | ------------------------------------------ |
| Target prelaunch / latest                           | 10,000 / 11,100 cups                       |
| Latest operating panel                              | 13,600 cups                                |
| Collaboration / observed growth                     | 2,400 / 1,100 cups                         |
| Modeled no-launch portfolio / associated difference | 10,300 / 800 cups                          |
| Retail receipts / POS / retailer-owned closing      | 14,880 / 10,900 / 3,980 cups               |
| Requested / reviewed / bridge output                | 52,000 / 40,000 / 40,000 cups              |
| Requested / reviewed / bridge line hours            | 46.83 / 36.83 / 37.33                      |
| Reviewed closing stock / unmet dispatch             | 16,800 / 0 cups                            |
| No-reviewed-run unmet dispatch                      | 28,600 cups                                |
| Reviewed base / cup-lid / granola consumption       | 3,200 kg / 40,000 sets / 96 kg             |
| East donor surplus after transfer                   | 720 cups; network stock conserved at 6,000 |
| Requested / reviewed production cost                | $56,900 / $43,700                          |
| Reviewed first-window / eight-week future cash      | $18,600 / $52,265                          |
| Previously paid PO deposits, excluded               | $6,885                                     |
| Collaboration +25% / Cookies +20% unmet             | 2,700 / 1,200 cups                         |
| One-week release delay unmet / closing              | 6,300 / 23,100 cups                        |
| Base-constrained candidate output / unmet           | 32,000 / 4,000 cups                        |
| Naive / illustrative reviewed WAPE                  | 5.46% / 3.17%                              |

The panel tests validate unique keys, deterministic content, integer nonnegative four-packs, units, listing permissions, positive selling exposure for sales, exact weekly retailer-SKU totals, both cohort matrices, available-day sums, cumulative launch POS and control totals. All 9,600 control rows are excluded from operating demand.

Generated content SHA-256: `accca71a97ea6d66d56c22fb5ab542cec4db1a3353eeeef8eaee1486b6e820fe`.

## Audit artifacts

Current measurements and accessibility outcomes are in `docs/audit/`. The initial report and failing measurements are archived there separately; they are historical findings, not the current sign-off status.

All product image mappings and remaining provenance requirements are documented in `ASSET_SOURCES.md` and `ASSETS_NEEDED.md`. A01–A17 source boundaries remain explicit in `OPEN_QUESTIONS.md`.
