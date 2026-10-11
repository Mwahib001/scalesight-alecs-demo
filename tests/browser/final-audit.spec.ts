import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { mkdirSync, writeFileSync } from "node:fs";

const routes = [
  "/",
  "/incrementality",
  "/reorder-quality",
  "/cohorts",
  "/production",
  "/components",
  "/allocation",
  "/cash",
  "/forecast-learning",
  "/scenarios",
  "/managed-intelligence",
];
test.use({ timezoneId: "UTC" });
const output = "/tmp/alecs-final-audit";
mkdirSync(output, { recursive: true });

test("audit viewport matrix, assets and page errors", async ({ page }) => {
  test.setTimeout(240_000);
  const results = [];
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  for (const route of routes) {
    const response = await page.goto(route);
    await expect(page.locator("h1")).toBeVisible();
    for (const width of [
      320, 360, 390, 460, 768, 820, 1024, 1280, 1440, 1920,
    ]) {
      await page.setViewportSize({ width, height: 900 });
      const diagnostics = await page.evaluate(() => ({
        viewport: window.innerWidth,
        document: document.documentElement.scrollWidth,
        overflow: [
          ...document.querySelectorAll("main *, header *, .review-bar *"),
        ]
          .filter((el) => {
            if (
              el.closest(".table-scroll, .plot-scroll") ||
              !(el instanceof HTMLElement)
            )
              return false;
            const r = el.getBoundingClientRect();
            return (
              r.width > 0 && (r.right > window.innerWidth + 1 || r.left < -1)
            );
          })
          .map((el) => ({
            tag: el.tagName,
            class: el.className,
            text: el.textContent?.slice(0, 100),
          })),
        brokenImages: [...document.images]
          .filter((image) => image.complete && image.naturalWidth === 0)
          .map((image) => image.src),
      }));
      results.push({
        width,
        route,
        status: response?.status(),
        ...diagnostics,
      });
      writeFileSync(
        `${output}/viewports.json`,
        JSON.stringify({ results, errors }, null, 2),
      );
      if (
        [320, 390, 820, 1440].includes(width) &&
        ["/", "/production", "/scenarios"].includes(route)
      )
        await page.screenshot({
          path: `${output}/${width}-${route === "/" ? "brief" : route.slice(1)}.png`,
          fullPage: true,
        });
    }
  }
  writeFileSync(
    `${output}/viewports.json`,
    JSON.stringify({ results, errors }, null, 2),
  );
  expect(errors).toEqual([]);
  expect(
    results.filter(
      (r) =>
        r.document > r.viewport || r.brokenImages.length || r.status !== 200,
    ),
  ).toEqual([]);
});

test("audit live date advances to the next browser-local day", async ({
  page,
}) => {
  await page.clock.install({ time: new Date("2026-10-11T23:59:30Z") });
  await page.goto("/");
  await expect(page.locator(".review-bar .live-date")).toHaveText(
    "11 October 2026",
  );
  await page.clock.runFor(60_000);
  await expect(page.locator(".review-bar .live-date")).toHaveText(
    "12 October 2026",
  );
});

test("audit investigation state when navigating away and back", async ({
  page,
}) => {
  await page.goto("/incrementality");
  await page
    .getByRole("button", { name: "Counterfactual estimate", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Counterfactual estimate", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("link", { name: "View by cohort" }).click();
  await expect(page).toHaveURL(/cohorts/);
  await page.goBack();
  await expect(
    page.getByRole("button", { name: "Counterfactual estimate", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
});

test("audit evidence scope matches the selected forecast", async ({ page }) => {
  await page.goto("/forecast-learning?sku=CC07");
  await page
    .getByRole("button", { name: "View evidence", exact: true })
    .click();
  const drawer = page.getByRole("dialog", { name: "Evidence and assumptions" });
  await expect(drawer).toBeVisible();
  const scope = await drawer.locator("dd").first().innerText();
  writeFileSync(`${output}/forecast-scope.txt`, scope);
  expect(scope).toContain("Target");
  expect(scope).toContain("POS");
});

test("audit mobile evidence and navigation dialogs", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page
    .getByRole("button", { name: "View evidence", exact: true })
    .first()
    .click();
  const drawer = page.getByRole("dialog", { name: "Evidence and assumptions" });
  await expect(drawer).toBeVisible();
  await page.screenshot({ path: `${output}/390-evidence.png` });
  expect((await drawer.boundingBox())?.height).toBe(844);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Open navigation" }).click();
  await expect(
    page.getByRole("dialog", { name: "Workspace navigation" }),
  ).toBeVisible();
  await page.screenshot({ path: `${output}/390-navigation.png` });
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.keyboard.press("Escape");
});

test("all scenario presets expose their canonical outcomes and invalid inputs stay explicit", async ({
  page,
}) => {
  const presets = [
    ["Reviewed baseline", "0", "16,800"],
    ["Collaboration softens", "0", "19,920"],
    ["Collaboration strengthens", "2,700", "15,600"],
    ["Cookies & Cream accelerates", "1,200", "13,200"],
    ["Target requires stock earlier", "0", "16,800"],
    ["Base availability tightens", "4,000", "12,800"],
    ["Release arrives one week late", "6,300", "23,100"],
  ];
  await page.goto("/scenarios");
  for (const [name, unmet, closing] of presets) {
    await page.getByRole("button", { name, exact: true }).click();
    const summary = page.locator(".metric-strip");
    await expect(summary.locator("strong").nth(0)).toContainText(unmet);
    await expect(summary.locator("strong").nth(1)).toContainText(closing);
  }
  await page
    .getByRole("button", { name: "Hypothetical club order", exact: true })
    .click();
  await expect(
    page.getByText(
      "! Blocked pending pack compatibility, permissions and supply review.",
      { exact: true },
    ),
  ).toBeVisible();
  await page.goto("/scenarios?demand=999");
  await expect(
    page.getByRole("alert").filter({
      hasText: "Enter a value within the supported scenario range.",
    }),
  ).toContainText("Enter a value within the supported scenario range.");
  await expect(page.locator(".baseline-state")).toHaveText("Reviewed baseline");
});

test("cohort history links retain context and extended projections label the evidence horizon", async ({
  page,
}) => {
  await page.goto("/cohorts?cohort=C");
  await page
    .getByRole("link", { name: "CC07 · Madagascar Vanilla Bean", exact: true })
    .click();
  await expect(page).toHaveURL(/sku=CC07/);
  await expect(page).toHaveURL(/cohort=C/);
  await expect(page.getByLabel("Product", { exact: true })).toHaveValue("6");
  await page.goto("/production?sku=CC03");
  await page
    .getByRole("button", { name: "13-week visibility", exact: true })
    .click();
  await page
    .getByRole("button", { name: "View evidence", exact: true })
    .last()
    .click();
  await expect(page.getByRole("dialog").locator("dd").first()).toContainText(
    "W1–W13",
  );
  await page.keyboard.press("Escape");
  await page.reload();
  await expect(
    page.getByRole("button", { name: "13-week visibility", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
});

test("active scenarios and expanded evidence fit mobile and tablet screens", async ({
  page,
}) => {
  test.setTimeout(120_000);
  const results = [];
  for (const route of [
    "/scenarios?scenario=S7&scenarioHorizon=13",
    "/production?scenario=S5&productionHorizon=13",
    "/components?scenario=S5&componentQuantity=12000",
    "/allocation?sku=CC04&destination=Hypothetical%20club",
  ]) {
    await page.goto(route);
    await expect(page.locator(".live-date").first()).not.toHaveText("—");
    for (const width of [320, 390, 768, 820, 1024, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      await page
        .getByRole("button", { name: "View evidence", exact: true })
        .last()
        .click();
      const drawer = page.getByRole("dialog", {
        name: "Evidence and assumptions",
      });
      await expect(drawer).toBeVisible();
      const box = await drawer.boundingBox();
      expect(box!.x).toBeGreaterThanOrEqual(0);
      expect(box!.x + box!.width).toBeLessThanOrEqual(width);
      results.push({ route, width, drawer: box, overflow: false });
      writeFileSync(
        `${output}/active-viewports.json`,
        JSON.stringify(results, null, 2),
      );
      await page.keyboard.press("Escape");
      if (width === 768)
        expect((await new AxeBuilder({ page }).analyze()).violations).toEqual(
          [],
        );
    }
  }
});

test("raw import investigations stay separate from clean operating metrics", async ({
  page,
}) => {
  await page.goto("/forecast-learning");
  await page
    .getByText("Illustrative input validation", { exact: true })
    .click();
  await expect(
    page.getByText("Duplicate receipt", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Pack incompatibility", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Current source used; discrepancy retained", {
      exact: true,
    }),
  ).toBeVisible();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});
