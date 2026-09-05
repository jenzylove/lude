import { test } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { randomUUID } from "node:crypto";
import { WebSocket } from "ws";
import { ProfileStore } from "../server/profiles";
const pause = (ms: number) => new Promise((r) => setTimeout(r, ms));
test("device profiles persist contracts, deaths and bilateral human encounter counts", () => {
  const dir = `test-results/profiles-${randomUUID()}`,
    store = new ProfileStore(dir);
  const a = store.resolve(undefined),
    b = store.resolve(undefined);
  store.record(a.profile, b.profile, true);
  store.record(b.profile, a.profile, false);
  store.flush();
  const loaded = new ProfileStore(dir),
    again = loaded.resolve(a.token);
  assert.equal(again.profile.id, a.profile.id);
  assert.equal(again.profile.contracts, 1);
  assert.equal(again.profile.deaths, 1);
  assert.deepEqual(again.profile.encounters[b.profile.id], {
    name: b.profile.name,
    wins: 1,
    losses: 1,
  });
  assert(!("tokenHash" in store.public(a.profile)));
});
test("real server fills rooms, protects authority, preserves identity and replaces disconnected humans", async () => {
  const port = 3100 + Math.floor(Math.random() * 300),
    data = `test-results/server-${randomUUID()}`;
  const proc = spawn(process.execPath, ["--import", "tsx", "server/index.ts"], {
    env: { ...process.env, PORT: String(port), DATA_DIR: data },
    windowsHide: true,
    stdio: "pipe",
  });
  let output = "";
  proc.stderr.on("data", (b) => (output += b));
  const clients: WebSocket[] = [];
  async function join(token?: string) {
    const ws = new WebSocket(`ws://127.0.0.1:${port}/socket`);
    clients.push(ws);
    let welcome: any, latest: any;
    ws.on("message", (raw) => {
      const d = JSON.parse(raw.toString());
      if (d.type === "welcome") welcome = d;
      if (d.snapshot) latest = d.snapshot;
    });
    await once(ws, "open");
    ws.send(JSON.stringify({ type: "hello", token }));
    for (let i = 0; i < 100 && !welcome; i++) await pause(20);
    assert(welcome, output);
    return {
      ws,
      welcome,
      get snapshot() {
        return latest;
      },
    };
  }
  try {
    let ready = false;
    for (let i = 0; i < 100; i++) {
      try {
        const res = await fetch(`http://127.0.0.1:${port}/health`);
        ready = res.ok;
        if (ready) break;
      } catch {}
      await pause(50);
    }
    assert(ready, output);
    const a = await join();
    assert.equal(a.snapshot.fighters.length, 4);
    assert.equal(
      a.snapshot.fighters.filter((f: any) => f.controller === "ai").length,
      3,
    );
    const before = a.snapshot.fighters.find(
      (f: any) => f.id === a.snapshot.you,
    );
    a.ws.send(
      JSON.stringify({
        type: "input",
        seq: 1,
        x: 999,
        y: 0,
        angle: 0,
        hp: 99999,
        score: 100000,
        action: "kill",
      }),
    );
    await pause(80);
    const after = a.snapshot.fighters.find((f: any) => f.id === a.snapshot.you);
    assert.equal(after.hp, 100);
    assert.equal(after.score, 0);
    assert.equal(after.x, before.x);
    const b = await join(),
      c = await join(),
      d = await join(),
      e = await join();
    await pause(100);
    assert.equal(a.snapshot.room, b.snapshot.room);
    assert.equal(
      a.snapshot.fighters.filter((f: any) => f.controller === "human").length,
      4,
    );
    assert.notEqual(a.snapshot.room, e.snapshot.room);
    assert.equal(
      e.snapshot.fighters.filter((f: any) => f.controller === "ai").length,
      3,
    );
    assert(!("contracts" in a.snapshot));
    assert(a.snapshot.fighters.every((f: any) => !("target" in f)));
    assert.equal(
      new Set([
        a.snapshot.target,
        b.snapshot.target,
        c.snapshot.target,
        d.snapshot.target,
      ]).size,
      4,
    );
    const duplicate = new WebSocket(`ws://127.0.0.1:${port}/socket`);
    clients.push(duplicate);
    await once(duplicate, "open");
    const closed = once(duplicate, "close");
    duplicate.send(JSON.stringify({ type: "hello", token: a.welcome.token }));
    assert.equal((await closed)[0], 4009);
    const token = b.welcome.token,
      name = b.welcome.profile.name;
    const gone = once(b.ws, "close");
    b.ws.close();
    await gone;
    await pause(100);
    assert.equal(
      a.snapshot.fighters.filter((f: any) => f.controller === "ai").length,
      1,
    );
    const back = await join(token);
    assert.equal(back.welcome.profile.name, name);
    assert.equal(back.snapshot.room, a.snapshot.room);
  } finally {
    for (const ws of clients) ws.terminate();
    proc.kill();
    await once(proc, "exit");
  }
});
