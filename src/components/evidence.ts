import { products, snapshotId } from "../data/alecs.v1";
import type { Evidence } from "./Workspace";
export function evidence(
  title: string,
  scope: string,
  inputs: Record<string, unknown>,
  calculation: string,
  overrides: Partial<Evidence> = {},
): Evidence {
  return {
    title,
    question: title,
    scope,
    inputs,
    calculation,
    evidenceClass: "DERIVED METRIC",
    sourceId: "SPEC-04 / " + snapshotId,
    assumptions:
      "Synthetic planning sample. Operating panels exclude the 60 comparison stores. Retailer-owned stock is separate from brand-owned inventory.",
    constraints:
      "Production hours, component availability, pack compatibility and release timing must all work.",
    unknown:
      "Real retailer commitments, commercial conditions, supplier constraints and client operating context.",
    ...overrides,
  };
}
export const productEvidence = (
  index: number,
  title: string,
  scope: string,
  inputs: Record<string, unknown>,
  calculation: string,
  overrides: Partial<Evidence> = {},
) =>
  evidence(
    title,
    `${products[index].id} · ${products[index].name} · ${scope}`,
    inputs,
    calculation,
    { source: products[index].source, ...overrides },
  );
