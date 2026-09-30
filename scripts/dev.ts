/**
 * Dev orchestration script.
 * Starts the Python STT/TTS worker, waits for health check, then launches Next.js.
 * Handles graceful shutdown on SIGINT/SIGTERM.
 *
 * Usage: bun scripts/dev.ts
 */

import { spawn, ChildProcess } from "child_process";
import { existsSync, readFileSync, writeFileSync } from "fs";
import { createHash } from "crypto";
import { join } from "path";

const WORKER_DIR = join(process.cwd(), "src/features/speech/worker");
const VENV_DIR = join(WORKER_DIR, ".venv");
const POLL_INTERVAL = 500; // ms
const POLL_TIMEOUT = 30_000; // ms

function log(prefix: string, msg: string) {
  process.stdout.write(`[${prefix}] ${msg}`);
}

function logErr(prefix: string, msg: string) {
  process.stderr.write(`[${prefix}] ${msg}`);
}

function getRequirementsHash(): string {
  const content = readFileSync(join(WORKER_DIR, "requirements.txt"), "utf-8");
  return createHash("sha256").update(content).digest("hex").slice(0, 16);
}

/**
 * Ensure Python virtual environment exists and dependencies are installed.
 * Re-installs if requirements.txt changed.
 */
async function ensureWorkerEnv(): Promise<void> {
  const venvPython = process.platform === "win32"
    ? join(VENV_DIR, "Scripts", "python.exe")
    : join(VENV_DIR, "bin", "python");

  const pip = process.platform === "win32"
    ? join(VENV_DIR, "Scripts", "pip.exe")
    : join(VENV_DIR, "bin", "pip");

  const hashFile = join(VENV_DIR, ".requirements_hash");
  const currentHash = getRequirementsHash();
  const needsInstall = !existsSync(venvPython) ||
    !existsSync(hashFile) ||
    readFileSync(hashFile, "utf-8") !== currentHash;

  if (!existsSync(venvPython)) {
    log("setup", "Creating Python virtual environment...\n");
    await exec("python3", ["-m", "venv", VENV_DIR]);
  }

  if (needsInstall) {
    log("setup", "Installing Python dependencies...\n");
    await exec(pip, ["install", "-r", join(WORKER_DIR, "requirements.txt")]);
    writeFileSync(hashFile, currentHash);
    log("setup", "Python environment ready.\n");
  }
}

/**
 * Execute a command and return when it completes.
 */
function exec(cmd: string, args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = spawn(cmd, args, { stdio: "inherit" });
    proc.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${cmd} exited with code ${code}`));
    });
    proc.on("error", reject);
  });
}

/**
 * Find a free port by briefly binding a server.
 */
async function findFreePort(): Promise<number> {
  const { createServer } = await import("net");
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.listen(0, "127.0.0.1", () => {
      const addr = server.address();
      const port = typeof addr === "object" && addr ? addr.port : 0;
      server.close(() => resolve(port));
    });
    server.on("error", reject);
  });
}

/**
 * Poll the worker health endpoint until ready or timeout.
 */
async function waitForHealth(port: number): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < POLL_TIMEOUT) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/health`);
      if (res.ok) return;
    } catch {
      // Not ready yet
    }
    await new Promise((r) => setTimeout(r, POLL_INTERVAL));
  }
  throw new Error("Python worker failed to start within timeout");
}

/**
 * Gracefully shut down both processes.
 */
function shutdown(worker: ChildProcess | null, next: ChildProcess | null) {
  log("dev", "\nShutting down...\n");

  if (next) {
    next.kill("SIGTERM");
    setTimeout(() => {
      if (!next.killed) {
        log("dev", "Force-killing Next.js process\n");
        next.kill("SIGKILL");
      }
    }, 5000);
  }

  if (worker) {
    worker.kill("SIGTERM");
    setTimeout(() => {
      if (!worker.killed) {
        log("dev", "Force-killing Python worker\n");
        worker.kill("SIGKILL");
      }
    }, 5000);
  }
}

async function main() {
  // Step 1: Ensure Python worker environment
  await ensureWorkerEnv();

  // Step 2: Find a free port for the worker
  const workerPort = await findFreePort();

  // Step 3: Spawn the Python worker
  const uvicorn = process.platform === "win32"
    ? join(VENV_DIR, "Scripts", "uvicorn.exe")
    : join(VENV_DIR, "bin", "uvicorn");

  const worker = spawn(uvicorn, ["main:app", "--host", "127.0.0.1", "--port", String(workerPort)], {
    cwd: WORKER_DIR,
    env: { ...process.env, PYTHONUNBUFFERED: "1" },
  });

  worker.stdout?.on("data", (chunk) => log("python", chunk.toString()));
  worker.stderr?.on("data", (chunk) => logErr("python", chunk.toString()));

  worker.on("error", (err) => {
    logErr("python", `Worker error: ${err.message}\n`);
    process.exit(1);
  });

  worker.on("close", (code) => {
    if (code !== null && code !== 0) {
      logErr("python", `Worker exited with code ${code}, shutting down\n`);
      process.exit(1);
    }
  });

  // Step 4: Wait for health check
  try {
    log("dev", "Waiting for Python worker health check...\n");
    await waitForHealth(workerPort);
    log("dev", `Python worker ready on port ${workerPort}\n`);
  } catch (err) {
    logErr("dev", `Health check failed: ${err}\n`);
    worker.kill();
    process.exit(1);
  }

  // Step 5: Start Next.js dev server
  const next = spawn("bun", ["x", "next", "dev", "--turbopack"], {
    env: { ...process.env, PYTHON_WORKER_PORT: String(workerPort) },
  });

  next.stdout?.on("data", (chunk) => log("next", chunk.toString()));
  next.stderr?.on("data", (chunk) => logErr("next", chunk.toString()));

  next.on("error", (err) => {
    logErr("next", `Next.js error: ${err.message}\n`);
    worker.kill();
    process.exit(1);
  });

  next.on("close", (code) => {
    log("dev", `Next.js exited with code ${code}\n`);
    worker.kill();
    process.exit(code ?? 0);
  });

  // Step 6: Handle graceful shutdown
  let shuttingDown = false;
  const handleSignal = () => {
    if (shuttingDown) return;
    shuttingDown = true;
    shutdown(worker, next);
  };

  process.on("SIGINT", handleSignal);
  process.on("SIGTERM", handleSignal);

  // Keep the process alive
  await new Promise(() => {});
}

main().catch((err) => {
  logErr("dev", `Fatal error: ${err}\n`);
  process.exit(1);
});
