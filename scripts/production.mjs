import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const runtimeRoot = path.join(root, ".production");
const lock = path.join(runtimeRoot, "prepare.lock");
const mode = process.argv[2];
let ownsLock = false;
let snapshot;

function releaseLock() {
  if (ownsLock) {
    rmSync(lock, { force: true });
    ownsLock = false;
  }
}
function acquireLock() {
  mkdirSync(runtimeRoot, { recursive: true });
  if (existsSync(lock)) {
    const pid = Number(readFileSync(lock, "utf8"));
    if (Number.isInteger(pid) && pid > 0) {
      try {
        process.kill(pid, 0);
      } catch (error) {
        if (error.code === "ESRCH") rmSync(lock, { force: true });
      }
    }
  }
  try {
    writeFileSync(lock, String(process.pid), { flag: "wx" });
    ownsLock = true;
  } catch (error) {
    if (error.code === "EEXIST")
      throw new Error(
        "A production build or startup is already preparing files. Wait for it to finish, then retry.",
      );
    throw error;
  }
}
function runNext(args, env) {
  return new Promise((resolve, reject) => {
    const child = spawn(
      process.execPath,
      [path.join(root, "node_modules/next/dist/bin/next"), ...args],
      {
        cwd: root,
        env: { ...process.env, ...env },
        stdio: "inherit",
      },
    );
    const interrupt = () => child.kill("SIGINT");
    const terminate = () => child.kill("SIGTERM");
    process.on("SIGINT", interrupt);
    process.on("SIGTERM", terminate);
    const cleanup = () => {
      process.off("SIGINT", interrupt);
      process.off("SIGTERM", terminate);
    };
    child.on("error", (error) => {
      cleanup();
      reject(error);
    });
    child.on("exit", (code, signal) => {
      cleanup();
      resolve(code ?? (signal === "SIGINT" ? 130 : 143));
    });
  });
}
try {
  if (!["build", "start"].includes(mode))
    throw new Error("Use production.mjs build or production.mjs start.");
  acquireLock();
  if (mode === "build") {
    process.exitCode = await runNext(
      ["build", "--webpack", ...process.argv.slice(3)],
      {
        ALECS_RUNTIME_DIR: "",
        NEXT_DEPLOYMENT_ID: randomUUID().replaceAll("-", ""),
      },
    );
  } else {
    if (!existsSync(path.join(root, ".next/BUILD_ID")))
      throw new Error("No completed production build. Run pnpm build first.");
    // A running server must never read files that `next build` deletes/replaces.
    const relative = `.production/run-${randomUUID()}`;
    snapshot = path.join(root, relative);
    cpSync(path.join(root, ".next"), snapshot, {
      recursive: true,
      filter: (source) =>
        !["cache", "dev", "lock"].includes(
          path.relative(path.join(root, ".next"), source).split(path.sep)[0],
        ),
    });
    const { config } = JSON.parse(
      readFileSync(path.join(snapshot, "required-server-files.json"), "utf8"),
    );
    releaseLock();
    console.log(
      "Serving an isolated production build; rebuilds will not change this server. Restart to use a newer build.",
    );
    process.exitCode = await runNext(["start", ...process.argv.slice(3)], {
      ALECS_RUNTIME_DIR: relative,
      NEXT_DEPLOYMENT_ID: config.deploymentId || "",
    });
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  releaseLock();
  if (snapshot) rmSync(snapshot, { recursive: true, force: true });
}
