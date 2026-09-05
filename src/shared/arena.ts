export type Point = { x: number; y: number };
export type Cover = Point & {
  w: number;
  h: number;
  height: number;
  kind: "vent" | "planter" | "wall";
};
export interface ArenaDefinition {
  id: string;
  name: string;
  width: number;
  height: number;
  cover: Cover[];
  spawns: Point[];
}

/** An arena is data, independent of characters, controllers and the renderer. */
export const ROOFTOP: ArenaDefinition = {
  id: "rooftop-01",
  name: "THE UPPER DISTRICT",
  width: 960,
  height: 640,
  cover: [
    { x: 225, y: 160, w: 140, h: 65, height: 42, kind: "vent" },
    { x: 595, y: 405, w: 140, h: 65, height: 42, kind: "vent" },
    { x: 230, y: 420, w: 65, h: 90, height: 35, kind: "planter" },
    { x: 665, y: 130, w: 65, h: 90, height: 35, kind: "planter" },
  ],
  spawns: [
    { x: 380, y: 320 },
    { x: 580, y: 320 },
    { x: 480, y: 140 },
    { x: 480, y: 500 },
  ],
};

export const distance = (a: Point, b: Point) =>
  Math.hypot(a.x - b.x, a.y - b.y);
export const angleDifference = (a: number, b: number) =>
  Math.atan2(Math.sin(a - b), Math.cos(a - b));
export function blocked(
  arena: ArenaDefinition,
  x: number,
  y: number,
  r = 17,
): boolean {
  return (
    x < 32 + r ||
    x > arena.width - 32 - r ||
    y < 32 + r ||
    y > arena.height - 32 - r ||
    arena.cover.some(
      (w) =>
        x > w.x - r && x < w.x + w.w + r && y > w.y - r && y < w.y + w.h + r,
    )
  );
}
/** Exact segment/AABB intersection, also used with inflated cover for navigation. */
export function clearLine(
  arena: ArenaDefinition,
  a: Point,
  b: Point,
  r = 0,
): boolean {
  return !arena.cover.some((w) => {
    let lo = 0,
      hi = 1;
    for (const [start, delta, min, max] of [
      [a.x, b.x - a.x, w.x - r, w.x + w.w + r],
      [a.y, b.y - a.y, w.y - r, w.y + w.h + r],
    ]) {
      if (Math.abs(delta) < 1e-8) {
        if (start < min || start > max) return false;
      } else {
        let t1 = (min - start) / delta,
          t2 = (max - start) / delta;
        if (t1 > t2) [t1, t2] = [t2, t1];
        lo = Math.max(lo, t1);
        hi = Math.min(hi, t2);
        if (lo > hi) return false;
      }
    }
    return true;
  });
}

/** Small visibility graph around expanded cover corners; no wall-sticking pursuit. */
export function waypoint(
  arena: ArenaDefinition,
  start: Point,
  end: Point,
): Point {
  if (clearLine(arena, start, end, 16.5)) return end;
  const nodes = [
    start,
    end,
    ...arena.cover
      .flatMap((w) => [
        { x: w.x - 23, y: w.y - 23 },
        { x: w.x + w.w + 23, y: w.y - 23 },
        { x: w.x - 23, y: w.y + w.h + 23 },
        { x: w.x + w.w + 23, y: w.y + w.h + 23 },
      ])
      .filter((p) => !blocked(arena, p.x, p.y)),
  ];
  const cost = nodes.map(() => Infinity),
    prev = nodes.map(() => -1),
    seen = new Set<number>();
  cost[0] = 0;
  for (let n = 0; n < nodes.length; n++) {
    let i = -1;
    for (let j = 0; j < nodes.length; j++)
      if (!seen.has(j) && (i < 0 || cost[j] < cost[i])) i = j;
    if (i < 0 || !Number.isFinite(cost[i])) break;
    if (i === 1) break;
    seen.add(i);
    for (let j = 0; j < nodes.length; j++)
      if (!seen.has(j) && clearLine(arena, nodes[i], nodes[j], 16.5)) {
        const next = cost[i] + distance(nodes[i], nodes[j]);
        if (next < cost[j]) {
          cost[j] = next;
          prev[j] = i;
        }
      }
  }
  let i = 1;
  if (prev[i] < 0) return start;
  while (prev[i] > 0) i = prev[i];
  return nodes[i];
}
