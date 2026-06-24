// Dev launcher that picks a genuinely-free port before starting Next.
//
// Why this exists: `next dev` only falls back to another port when the OS
// raises EADDRINUSE. On macOS a server bound to a specific loopback address
// (e.g. `[::1]:3000`) does NOT collide with Next's wildcard bind (`*:3000`),
// so Next happily "starts" on 3000 while localhost requests are silently
// shadowed by the other process. We detect occupancy by actually connecting
// to the port over both IPv4 and IPv6, which catches that case.

import net from "node:net";
import { spawn } from "node:child_process";

const HOST_PROBES = ["127.0.0.1", "::1"];
const MAX_ATTEMPTS = 20;
const CONNECT_TIMEOUT = 400;

/** Resolve true if something is already accepting connections on this port. */
function isPortInUse(port) {
  return Promise.all(
    HOST_PROBES.map(
      (host) =>
        new Promise((resolve) => {
          const socket = new net.Socket();
          const done = (inUse) => {
            socket.destroy();
            resolve(inUse);
          };
          socket.setTimeout(CONNECT_TIMEOUT);
          socket.once("connect", () => done(true));
          socket.once("timeout", () => done(false));
          socket.once("error", () => done(false)); // ECONNREFUSED => free
          socket.connect(port, host);
        }),
    ),
  ).then((results) => results.some(Boolean));
}

async function findFreePort(start) {
  for (let port = start; port < start + MAX_ATTEMPTS; port++) {
    if (!(await isPortInUse(port))) return port;
  }
  throw new Error(
    `No free port found in range ${start}-${start + MAX_ATTEMPTS - 1}`,
  );
}

const startPort = Number(process.env.PORT) || 3000;
const port = await findFreePort(startPort);

if (port !== startPort) {
  console.log(`⚠ Port ${startPort} is already in use — using ${port} instead.`);
}

// Forward any extra args (e.g. `npm run dev -- --turbo`) through to next.
const extraArgs = process.argv.slice(2);
const child = spawn("next", ["dev", "-p", String(port), ...extraArgs], {
  stdio: "inherit",
  shell: process.platform === "win32",
});

child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  else process.exit(code ?? 0);
});
