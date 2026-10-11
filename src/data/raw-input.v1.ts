import { deepFreeze } from "./alecs.v1";
import type { RawRecord } from "../engine/alecs";

// Deliberately separate from the clean operating fixture and generated panel.
// These are synthetic imported records used to demonstrate validation decisions.
export const rawInputFeed = deepFreeze<RawRecord[]>([
  { id: "RECEIPT-001", skuId: "CC01", unit: "cases", quantity: 50 },
  { id: "RECEIPT-001", skuId: "CC01", unit: "cases", quantity: 50 },
  { id: "UNIT-001", skuId: "CC02", unit: "pallets", quantity: 1 },
  { id: "EXPOSURE-001", skuId: "CC01", pos: 4, availableDays: 0 },
  { id: "SKU-001", skuId: "UNMAPPED" },
  { id: "ETA-001", skuId: "CC01", eta: null },
  { id: "TRANSFER-001", skuId: "CC01", destination: "Whole Foods" },
  {
    id: "PACK-001",
    skuId: "CC02",
    packFormat: "retail-four-pack",
    requirementPack: "club-eight-pack",
  },
  { id: "STOCK-001", skuId: "CC02", unit: "cups", quantity: -4 },
  {
    id: "FORECAST-001",
    skuId: "CC01",
    issuedAt: "2026-10-13",
    targetWeek: "2026-10-12",
  },
  {
    id: "DEMAND-001",
    skuId: "CC02",
    forecastIncludesOrders: true,
    addsOrdersAgain: true,
  },
  { id: "PAYMENT-001", skuId: "CC01", paid: true },
  { id: "METADATA-001", skuId: "CC01", staleMetadata: true },
]);
