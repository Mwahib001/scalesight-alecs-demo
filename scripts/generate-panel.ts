import { writeFileSync, mkdirSync } from "node:fs";
import { gzipSync } from "node:zlib";
import { createHash } from "node:crypto";
import { generatePanel, generationVersion } from "../src/engine/panel";
const rows = generatePanel();
const content = JSON.stringify(rows);
mkdirSync("src/data/generated", { recursive: true });
writeFileSync(
  "src/data/generated/store-panel.json.gz",
  gzipSync(content, { level: 9 }),
);
writeFileSync(
  "src/data/generated/manifest.json",
  JSON.stringify(
    {
      generationVersion,
      rows: rows.length,
      sha256: createHash("sha256").update(content).digest("hex"),
      classification: "SYNTHETIC INPUT",
      assumptionId: "A15",
    },
    null,
    2,
  ) + "\n",
);
console.log(`Generated ${rows.length} classified store-week rows.`);
