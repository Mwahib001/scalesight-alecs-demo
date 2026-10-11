import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
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
for (const route of routes)
  test(`direct route ${route}`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(route);
    await expect(page.locator("h1")).toBeVisible();
    await expect(
      page.getByText(
        "Illustrative planning concept. Operating data and recommendations are synthetic. No live connection or client results.",
      ),
    ).toBeVisible();
    await expect(
      page.getByText(
        "Analysis maintained by ScaleSight. Decisions made with the client.",
      ),
    ).toBeVisible();
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    expect(errors).toEqual([]);
  });
for (const item of [
  { text: "Examine the launch signal", url: "/incrementality", sku: "CC01" },
  { text: "Review the production slot", url: "/production", sku: "CC02" },
  { text: "Compare the allocation", url: "/allocation", sku: "CC04" },
  { text: "Inspect the buying depth", url: "/production", sku: "CC05" },
])
  test(`brief link ${item.sku}`, async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: item.text, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(item.url + "\\?sku=" + item.sku));
    const select = page.getByLabel("Product", { exact: true });
    if (await select.count())
      await expect(select).toHaveValue(String(Number(item.sku.slice(-1)) - 1));
  });
test("scenario activation propagates, browser history restores, reset recovers exact baseline", async ({
  page,
}) => {
  await page.goto("/scenarios");
  await page.getByRole("button", { name: "Collaboration strengthens" }).click();
  await expect(
    page.getByText("Exploring: Collaboration demand +25%", { exact: true }),
  ).toBeVisible();
  await expect(
    page.locator(".metric-strip").getByText("2,700", { exact: false }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Run timing and capacity" }).click();
  await expect(page).toHaveURL(/production.*scenario=S2/);
  await expect(
    page.getByText("Exploring: Collaboration demand +25%", { exact: true }),
  ).toBeVisible();
  await page.goBack();
  await expect(page).toHaveURL(/scenarios/);
  await page.getByRole("button", { name: "Reset exploration" }).click();
  await expect(page.locator(".baseline-state")).toHaveText("Reviewed baseline");
  await expect(
    page.locator(".metric-strip").getByText("16,800", { exact: false }),
  ).toBeVisible();
});
test("evidence drawer is relevant and keyboard accessible", async ({
  page,
}) => {
  await page.goto("/");
  const trigger = page
    .getByRole("button", { name: "View evidence", exact: true })
    .first();
  await trigger.click();
  const dialog = page.getByRole("dialog", { name: "Evidence and assumptions" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("heading")).toHaveText(
    "Strong launch sales. A different portfolio story.",
  );
  await expect(dialog.getByText("Input values", { exact: true })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(trigger).toBeFocused();
});
test("blocked club and infeasible requested production remain explicit", async ({
  page,
}) => {
  await page.goto("/scenarios?scenario=S6");
  await expect(
    page.getByText(
      "! Blocked pending pack compatibility, permissions and supply review.",
    ),
  ).toBeVisible();
  await page.goto("/production");
  await page
    .getByRole("button", { name: "Requested mix", exact: true })
    .click();
  await expect(
    page.getByText(
      "! This option exceeds the available constraint. Review the highlighted requirement before treating it as executable.",
    ),
  ).toBeVisible();
});
test("transfer date remains unresolved until selected", async ({ page }) => {
  await page.goto("/allocation?sku=CC04");
  await expect(
    page.getByText("Timing unresolved", { exact: true }),
  ).toBeVisible();
  await page.getByLabel("Exploratory dispatch date").fill("2026-10-12");
  await expect(
    page.getByText("Earliest released stock: 2026-10-15."),
  ).toBeVisible();
  await page.getByLabel("Exploratory dispatch date").fill("2026-10-23");
  await expect(
    page.getByText("Infeasible timing", { exact: true }),
  ).toBeVisible();
});
test("all product forecasts and dependencies work", async ({ page }) => {
  for (const route of ["/forecast-learning", "/components"]) {
    await page.goto(route);
    for (let i = 0; i < 8; i++) {
      await page.getByLabel("Product", { exact: true }).selectOption(String(i));
      await expect(page.getByLabel("Product", { exact: true })).toHaveValue(
        String(i),
      );
      await expect(page.locator("h1")).toBeVisible();
    }
  }
});
test("cohort selection reconciles retailer inventory", async ({ page }) => {
  await page.goto("/reorder-quality");
  await page.getByRole("button", { name: "Cohort B", exact: true }).click();
  await expect(page.getByText("136", { exact: true }).first()).toBeVisible();
  await expect(
    page.getByText("Cohort B · retailer-owned stock · cups"),
  ).toBeVisible();
});
for (const width of [390, 820])
  test(`responsive navigation and contained tables at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    for (const route of routes) {
      await page.goto(route);
      await expect(page.locator("h1")).toBeVisible();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
      ).toBe(true);
    }
    await page.goto("/");
    if (width === 390) {
      await page.getByRole("button", { name: "Open navigation" }).click();
      const nav = page.getByRole("dialog", { name: "Workspace navigation" });
      await expect(nav).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(nav).not.toBeVisible();
    }
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  });
