import { test } from "node:test";
import assert from "node:assert/strict";
import {
  CombatWorld,
  createCharacter,
  RULES,
  type Command,
} from "../src/shared/combat";
import { AIController } from "../src/shared/controllers";
import { GameSession } from "../src/client/session";
import {
  ROOFTOP,
  blocked,
  clearLine,
  distance,
  waypoint,
} from "../src/shared/arena";
function seed(n = 12345) {
  return () => {
    n = (n * 1664525 + 1013904223) >>> 0;
    return n / 4294967296;
  };
}
function setup(n = 2) {
  const w = new CombatWorld(n === 2 ? "duel" : "hitlist", ROOFTOP, seed());
  for (let i = 0; i < n; i++) {
    const f = createCharacter("p" + i, "FIGHTER " + i, "human", {
      x: 420 + i * 60,
      y: 320,
    });
    f.invulnerable = 0;
    f.angle = i ? Math.PI : 0;
    w.add(f);
  }
  return w;
}
function ticks(
  w: CombatWorld,
  n: number,
  commands = new Map<string, Command>(),
) {
  for (let i = 0; i < n; i++) w.step(1 / 60, commands);
}
test("strike has wind-up, one hit, recovery and cooldown; spam cannot bypass them", () => {
  const w = setup(),
    [a, b] = w.fighters;
  w.command(a, { x: 0, y: 0, angle: 0, action: "strike" });
  ticks(w, 10);
  assert.equal(b.hp, 100);
  ticks(w, 8);
  assert.equal(b.hp, 75);
  for (let i = 0; i < 10; i++)
    w.command(a, { x: 0, y: 0, angle: 0, action: "strike" });
  ticks(w, 10);
  assert.equal(b.hp, 75);
  assert.equal(a.phase, "recover");
});
test("front parry stuns attacker and grants immediate counterattack; back parry fails", () => {
  const w = setup(),
    [a, b] = w.fighters;
  w.command(a, { x: 0, y: 0, angle: 0, action: "strike" });
  ticks(w, 9);
  w.command(b, { x: 0, y: 0, angle: Math.PI, action: "parry" });
  ticks(w, 7);
  assert.equal(b.hp, 100);
  assert.equal(a.phase, "stun");
  w.command(b, { x: 0, y: 0, angle: Math.PI, action: "strike" });
  ticks(w, 16);
  assert.equal(a.hp, 75);
  const q = setup(),
    [c, d] = q.fighters;
  q.command(c, { x: 0, y: 0, angle: 0, action: "strike" });
  ticks(q, 9);
  q.command(d, { x: 0, y: 0, angle: 0, action: "parry" });
  ticks(q, 7);
  assert.equal(d.hp, 75);
});
test("failed parry has recovery; dash evades but cannot cross solid cover", () => {
  const w = setup(),
    [a, b] = w.fighters;
  w.command(b, { x: 0, y: 0, angle: 0, action: "parry" });
  ticks(w, 14);
  assert.equal(b.phase, "recover");
  assert(b.parryCd > 0);
  b.phase = "dash";
  a.phase = "swing";
  w.hit(a, b);
  assert.equal(b.hp, 100);
  a.x = 190;
  a.y = 190;
  w.move(a, 250, 0);
  assert(a.x < 225);
  assert(!blocked(ROOFTOP, a.x, a.y));
});
test("cover blocks blade damage and route planner takes a passable detour", () => {
  const w = setup(),
    [a, b] = w.fighters;
  a.x = 220;
  a.y = 190;
  b.x = 280;
  b.y = 190;
  w.hit(a, b);
  assert.equal(b.hp, 100);
  const from = { x: 180, y: 185 },
    to = { x: 410, y: 185 };
  assert(!clearLine(ROOFTOP, from, to));
  const next = waypoint(ROOFTOP, from, to);
  assert(clearLine(ROOFTOP, from, next, 20));
  assert(distance(next, from) > 1);
  assert.notDeepEqual(next, to);
});
test("multiple deaths respawn with usable abilities and no negative timer lock", () => {
  const w = setup(),
    [a, b] = w.fighters;
  for (let n = 0; n < 4; n++) {
    a.x = 420;
    a.y = 320;
    b.x = 475;
    b.y = 320;
    b.invulnerable = 0;
    b.hp = 25;
    b.phase = "idle";
    a.hit = false;
    w.hit(a, b);
    assert.equal(b.phase, "dead");
    ticks(w, 74);
    assert.equal(b.hp, 100);
    assert.equal(b.timer, 0);
    w.command(b, { x: 0, y: 0, angle: 0, action: "strike" });
    assert.equal(b.phase, "wind");
  }
  assert.equal(b.deaths, 4);
});
function graph(w: CombatWorld) {
  assert.equal(w.contracts.size, w.fighters.length);
  assert.equal(new Set(w.contracts.values()).size, w.fighters.length);
  for (const [a, b] of w.contracts) assert.notEqual(a, b);
}
test("contract kill rewards and reassigns; unrelated kill does not; snapshots keep graph private", () => {
  const w = setup(4);
  graph(w);
  const a = w.fighters[0],
    target = w.contracts.get(a.id)!,
    b = w.fighters.find((f) => f.id === target)!;
  b.x = a.x + 50;
  b.y = a.y;
  b.hp = 25;
  a.hit = false;
  w.hit(a, b);
  assert.equal(a.score, 100);
  assert.notEqual(w.contracts.get(a.id), target);
  graph(w);
  const other = w.fighters.find(
    (f) => f !== a && f.id !== w.contracts.get(a.id),
  )!;
  other.x = a.x + 50;
  other.y = a.y;
  other.hp = 25;
  other.phase = "idle";
  a.hit = false;
  w.hit(a, other);
  assert.equal(a.score, 100);
  const view = w.snapshot(a.id);
  assert.equal(view.target, w.contracts.get(a.id));
  assert(!JSON.stringify(view).includes("contracts"));
  assert(view.fighters.every((f) => !("target" in f)));
});
test("AI can pursue around cover and fight repeatedly through shared commands", () => {
  const random = seed(91),
    w = new CombatWorld("duel", ROOFTOP, random);
  w.add(createCharacter("a", "A", "ai", { x: 180, y: 185 }));
  w.add(createCharacter("b", "B", "ai", { x: 420, y: 185 }));
  const controllers = [new AIController(random), new AIController(random)];
  let hits = 0,
    parries = 0,
    dashes = 0,
    seen = 0;
  for (let i = 0; i < 60 * 60; i++) {
    w.step(
      1 / 60,
      new Map(
        w.fighters.map((f, j) => [f.id, controllers[j].command(w, f, 1 / 60)]),
      ),
    );
    for (const e of w.events)
      if (e.seq > seen) {
        seen = e.seq;
        if (e.type === "hit") hits++;
        if (e.type === "parry") parries++;
        if (e.type === "dash") dashes++;
      }
    for (const f of w.fighters) assert(!blocked(w.arena, f.x, f.y));
  }
  assert(hits >= 20);
  assert(parries > 0);
  assert(dashes > 0);
  assert(w.fighters.reduce((n, f) => n + f.deaths, 0) >= 4);
  console.log({
    hits,
    parries,
    dashes,
    deaths: w.fighters.map((f) => f.deaths),
  });
});

test("contract results stay private even after a public elimination", () => {
  const w = setup(4),
    a = w.fighters[0];
  const b = w.fighters.find((f) => f.id === w.contracts.get(a.id))!;
  b.x = a.x + 50;
  b.y = a.y;
  b.hp = 25;
  w.hit(a, b);
  const owner = w.snapshot(a.id),
    observer = w.snapshot(b.id);
  assert(owner.events.some((e) => e.type === "contract" && e.reward === 100));
  assert(!observer.events.some((e) => e.type === "contract"));
  assert(
    observer.events
      .filter((e) => e.actor === a.id)
      .every((e) => e.reward === undefined),
  );
  assert.equal(observer.fighters.find((f) => f.id === a.id)!.score, 0);
});

test("high refresh input edges survive until the next local simulation tick", () => {
  const session = new GameSession(true);
  session.update(1 / 240, { x: 0, y: 0, angle: 0, action: "strike" });
  for (let i = 0; i < 4; i++) session.update(1 / 240, { x: 0, y: 0, angle: 0 });
  assert.equal(session.snapshot!.fighters[0].phase, "wind");
});
