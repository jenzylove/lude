import { chromium } from "@playwright/test";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { randomUUID } from "node:crypto";
import fs from "node:fs";
import assert from "node:assert/strict";
const port = 3400 + Math.floor(Math.random() * 200),
  directory = `test-results/production-${randomUUID()}`;
let proc, browser;
const errors = [];
let latest = null,
  welcome = null;
async function start() {
  proc = spawn(process.execPath, ["--import", "tsx", "server/index.ts"], {
    env: { ...process.env, PORT: String(port), DATA_DIR: directory },
    windowsHide: true,
    stdio: "pipe",
  });
  for (let i = 0; i < 100; i++) {
    try {
      if ((await fetch(`http://127.0.0.1:${port}/health`)).ok) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 50));
  }
  throw new Error("Production server did not start");
}
try {
  await start();
  browser = await chromium.launch({ channel: "msedge", headless: true });
  const page = await browser.newPage({
    viewport: { width: 1366, height: 768 },
  });
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("websocket", (ws) =>
    ws.on("framereceived", (frame) => {
      const data = JSON.parse(String(frame.payload));
      if (data.type === "welcome") welcome = data;
      if (data.snapshot) latest = data.snapshot;
    }),
  );
  await page.goto(`http://127.0.0.1:${port}`);
  await page.waitForFunction(() =>
    document.querySelector("#connection").textContent.includes("LIVE"),
  );
  assert.equal(
    await page.evaluate(() => typeof window.__lude),
    "undefined",
    "test bridge excluded from production",
  );
  await page.getByRole("button", { name: "SOUND OFF" }).click();
  assert.equal(await page.locator("#sound").innerText(), "SOUND ON");
  const identity = welcome.profile.name;
  const end = Date.now() + 20000;
  let last = 0,
    parry = 0;
  const held = new Set();
  const box = await page.locator("canvas").boundingBox();
  const project = (p) => ({
    x: 640 + (p.x - 480) * 0.9 - (p.y - 320) * 0.43,
    y: 405 + (p.x - 480) * 0.21 + (p.y - 320) * 0.69,
  });
  while (Date.now() < end) {
    const s = latest,
      p = s.fighters.find((f) => f.id === s.you),
      threat = s.fighters.find(
        (f) =>
          f.id !== p.id &&
          f.hp &&
          f.phase === "wind" &&
          Math.hypot(f.x - p.x, f.y - p.y) < 100,
      ),
      t = threat ?? s.fighters.find((f) => f.id === s.target && f.hp);
    if (!t) {
      await page.waitForTimeout(30);
      continue;
    }
    const a = project(p),
      b = project(t),
      d = Math.hypot(t.x - p.x, t.y - p.y);
    await page.mouse.move(
      box.x + (b.x * box.width) / 1280,
      box.y + (b.y * box.height) / 820,
    );
    for (const [key, on] of [
      ["KeyD", d > 78 && b.x - a.x > 12],
      ["KeyA", d > 78 && b.x - a.x < -12],
      ["KeyS", d > 78 && b.y - a.y > 10],
      ["KeyW", d > 78 && b.y - a.y < -10],
    ]) {
      if (on && !held.has(key)) {
        await page.keyboard.down(key);
        held.add(key);
      } else if (!on && held.has(key)) {
        await page.keyboard.up(key);
        held.delete(key);
      }
    }
    if (
      threat &&
      p.phase === "idle" &&
      p.parryCd <= 0 &&
      Date.now() - parry > 900
    ) {
      await page.keyboard.press("KeyE", { delay: 25 });
      parry = Date.now();
    } else if (
      p.phase === "idle" &&
      d < 85 &&
      p.strikeCd <= 0 &&
      Date.now() - last > 700
    ) {
      await page.keyboard.press("KeyJ", { delay: 25 });
      last = Date.now();
    }
    await page.waitForTimeout(30);
  }
  for (const key of held) await page.keyboard.up(key);
  assert(latest.events.some((e) => e.type === "death"));
  assert(
    latest.events
      .filter((e) => e.type === "contract")
      .every((e) => e.actor === latest.you),
  );
  assert(
    latest.fighters
      .filter((f) => f.id !== latest.you)
      .every((f) => f.score === 0),
  );
  await page.screenshot({ path: "test-results/production-1366.png" });
  const overflow = await page.evaluate(
    () =>
      document.documentElement.scrollWidth > innerWidth ||
      document.documentElement.scrollHeight > innerHeight + 2,
  );
  assert(!overflow, "desktop HUD fits viewport");
  await page.waitForTimeout(5200);
  const beforeName = identity;
  proc.kill();
  await once(proc, "exit");
  latest = null;
  welcome = null;
  await start();
  await page.waitForFunction(() =>
    document.querySelector("#connection").textContent.includes("LIVE"),
  );
  for (let i = 0; i < 100 && !welcome; i++) await page.waitForTimeout(50);
  assert(welcome, "automatic reconnect");
  assert.equal(welcome.profile.name, beforeName);
  assert(
    welcome.profile.deaths > 0,
    "server retained combat counters after restart",
  );
  assert.deepEqual(errors, []);
  const report = {
    productionServed: true,
    twoWayWebSocket: true,
    debugBridgeExcluded: true,
    soundToggle: true,
    desktop1366Fits: true,
    serverRestartReconnect: true,
    persistedDeaths: welcome.profile.deaths,
    errors,
  };
  fs.writeFileSync(
    "test-results/production.json",
    JSON.stringify(report, null, 2),
  );
  console.log(report);
} finally {
  await browser?.close();
  if (proc?.exitCode === null) {
    proc.kill();
    await once(proc, "exit");
  }
}
