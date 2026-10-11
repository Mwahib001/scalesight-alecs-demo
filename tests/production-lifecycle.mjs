import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { chromium } from "@playwright/test";
import { existsSync } from "node:fs";

const port = 3101;
const url = `http://127.0.0.1:${port}`;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
function launch(mode, ...args) {
  const child = spawn(
    process.execPath,
    ["scripts/production.mjs", mode, ...args],
    { stdio: ["ignore", "pipe", "pipe"] },
  );
  let log = "";
  child.stdout.on("data", (data) => {
    log += data;
  });
  child.stderr.on("data", (data) => {
    log += data;
  });
  const done = new Promise((resolve, reject) => {
    child.on("error", reject);
    child.on("exit", (code) => resolve(code));
  });
  return { child, done, log: () => log };
}
async function stop(server) {
  if (server && server.child.exitCode === null) {
    server.child.kill("SIGTERM");
    await server.done;
  }
}
async function ready(server) {
  for (let i = 0; i < 120; i++) {
    if (server.child.exitCode !== null) throw new Error(server.log());
    try {
      if ((await fetch(url)).ok) return;
    } catch {}
    await sleep(250);
  }
  throw new Error("Server did not become ready: " + server.log());
}
let server, browser, build;
try {
  // Never accidentally test against, or stop, somebody else's server.
  try {
    await fetch(url);
    throw new Error(
      `Port ${port} is occupied; stop that server before this test.`,
    );
  } catch (error) {
    if (!error.cause) throw error;
  }
  server = launch("start", "-p", String(port));
  await ready(server);
  browser = await chromium.launch({
    executablePath:
      process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ||
      (existsSync("/usr/bin/google-chrome")
        ? "/usr/bin/google-chrome"
        : undefined),
  });
  const page = await browser.newPage();
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Network.enable");
  await cdp.send("Network.setCacheDisabled", { cacheDisabled: true });
  const failures = [];
  page.on("pageerror", (error) => failures.push(error.message));
  page.on("response", (response) => {
    if (response.status() >= 400)
      failures.push(`${response.status()} ${response.url()}`);
  });
  await page.goto(`${url}/scenarios`);
  const version = await page.locator("html").getAttribute("data-dpl-id");
  assert.ok(version, "Production HTML must carry a deployment ID");
  build = launch("build");
  let building = true;
  const finished = build.done.then((code) => {
    building = false;
    return code;
  });
  let reloads = 0;
  while (building) {
    await page.goto(`${url}/scenarios`);
    await page
      .getByRole("button", { name: "Release arrives one week late" })
      .click();
    await page
      .locator(".metric-strip")
      .getByText("6,300", { exact: false })
      .waitFor();
    assert.equal(
      await page.locator("html").getAttribute("data-dpl-id"),
      version,
      "Running server must keep its original build",
    );
    assert.ok(
      await page
        .locator(".plot")
        .evaluate((el) => el.getBoundingClientRect().height > 100),
    );
    reloads++;
    await sleep(400);
  }
  assert.equal(await finished, 0, build.log());
  assert.deepEqual(
    failures,
    [],
    "Rebuilding must not break active production assets",
  );
  await stop(server);
  server = launch("start", "-p", String(port));
  await ready(server);
  await page.reload();
  assert.notEqual(
    await page.locator("html").getAttribute("data-dpl-id"),
    version,
    "Restart must serve the new build",
  );
  for (const route of [
    "/incrementality",
    "/production",
    "/scenarios",
    "/forecast-learning",
  ]) {
    await page.goto(url + route);
    await page.locator(".plot").waitFor();
    assert.ok(
      await page
        .locator(".plot")
        .evaluate((el) => el.getBoundingClientRect().height > 100),
    );
  }
  assert.deepEqual(failures, []);
  console.log(
    `PASS: ${reloads} uncached interactive loads during rebuild, new deployment after restart, all four chart routes, no failed assets or browser errors.`,
  );
} finally {
  await browser?.close();
  await stop(build);
  await stop(server);
}
