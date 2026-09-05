import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { resolve, extname, sep } from "node:path";
import { WebSocketServer, WebSocket } from "ws";
import {
  CombatWorld,
  createCharacter,
  type Command,
} from "../src/shared/combat";
import { AIController } from "../src/shared/controllers";
import { ProfileStore, type Profile } from "./profiles";

const port = Number(process.env.PORT ?? 3001),
  store = new ProfileStore(process.env.DATA_DIR ?? "data");
const bots = ["KESTREL", "VALE", "WRAITH", "CIPHER"];
type Session = {
  socket: WebSocket;
  room: Room;
  id: string;
  profile: Profile;
  input: Command;
  action?: Command["action"];
  seq: number;
  lastInput: number;
  window: number;
  count: number;
  alive: boolean;
};
class Room {
  world = new CombatWorld();
  clients = new Map<string, Session>();
  controllers = new Map<string, AIController>();
  processed = 0;
  constructor(public id: string) {
    for (let i = 0; i < 4; i++) {
      const id = `slot-${i}`;
      this.world.add(
        createCharacter(id, bots[i], "ai", this.world.arena.spawns[i]),
      );
      this.controllers.set(id, new AIController());
    }
  }
  free() {
    return this.world.fighters.find((f) => f.controller === "ai");
  }
}
const rooms: Room[] = [],
  sessions = new Set<Session>();
let nextRoom = 1;
const root = resolve("dist");
const server = createServer(async (req, res) => {
  if (req.url === "/health") {
    res.setHeader("Content-Type", "application/json");
    res.end(
      JSON.stringify({ ok: true, rooms: rooms.length, humans: sessions.size }),
    );
    return;
  }
  try {
    const pathname = decodeURIComponent(
      new URL(req.url ?? "/", "http://localhost").pathname,
    );
    const path = resolve(
      root,
      "." + (pathname === "/" ? "/index.html" : pathname),
    );
    if (!path.startsWith(root + sep)) {
      res.writeHead(403);
      res.end();
      return;
    }
    const data = await readFile(path);
    res.setHeader(
      "Content-Type",
      (
        {
          ".html": "text/html",
          ".js": "text/javascript",
          ".css": "text/css",
          ".png": "image/png",
          ".svg": "image/svg+xml",
        } as Record<string, string>
      )[extname(path)] ?? "application/octet-stream",
    );
    res.end(data);
  } catch {
    res.writeHead(404);
    res.end("Run npm run build, or use the Vite dev URL.");
  }
});
const wss = new WebSocketServer({ noServer: true, maxPayload: 1024 });
server.on("upgrade", (req, socket, head) => {
  const origin = req.headers.origin;
  let sameOrigin = !origin;
  try {
    if (origin) sameOrigin = new URL(origin).host === req.headers.host;
  } catch {}
  if (req.url !== "/socket" || !sameOrigin) {
    socket.destroy();
    return;
  }
  wss.handleUpgrade(req, socket, head, (ws) => wss.emit("connection", ws));
});
function send(ws: WebSocket, data: unknown) {
  if (ws.readyState === WebSocket.OPEN && ws.bufferedAmount < 128000)
    ws.send(JSON.stringify(data));
}
wss.on("connection", (socket) => {
  let session: Session | undefined;
  const timeout = setTimeout(
    () => socket.close(4000, "Handshake timeout"),
    5000,
  );
  socket.on("pong", () => {
    if (session) session.alive = true;
  });
  socket.on("error", () => {});
  socket.on("message", (raw) => {
    let data;
    try {
      data = JSON.parse(raw.toString());
    } catch {
      socket.close(4000, "Invalid JSON");
      return;
    }
    if (!data || typeof data !== "object") return;
    if (!session) {
      if (data.type !== "hello") return;
      if (sessions.size >= 64) {
        socket.close(4001, "Server full");
        return;
      }
      const { profile, token } = store.resolve(data.token);
      if ([...sessions].some((s) => s.profile.id === profile.id)) {
        socket.close(4009, "This identity is already playing in another tab");
        return;
      }
      let room = rooms.find((r) => r.free());
      if (!room) {
        room = new Room(`ROOF-${String(nextRoom++).padStart(2, "0")}`);
        rooms.push(room);
      }
      const slot = room.free()!;
      Object.assign(
        slot,
        createCharacter(
          slot.id,
          profile.name,
          "human",
          room.world.arena.spawns[Number(slot.id.slice(-1))],
        ),
      );
      session = {
        socket,
        room,
        id: slot.id,
        profile,
        input: { x: 0, y: 0, angle: 0 },
        seq: -1,
        lastInput: Date.now(),
        window: Date.now(),
        count: 0,
        alive: true,
      };
      room.clients.set(slot.id, session);
      sessions.add(session);
      clearTimeout(timeout);
      send(socket, {
        type: "welcome",
        token,
        profile: store.public(profile),
        snapshot: room.world.snapshot(slot.id, room.id),
      });
      return;
    }
    const now = Date.now();
    if (now - session.window > 1000) {
      session.window = now;
      session.count = 0;
    }
    if (++session.count > 100) {
      socket.close(4008, "Input rate exceeded");
      return;
    }
    if (
      data.type !== "input" ||
      !Number.isSafeInteger(data.seq) ||
      data.seq <= session.seq ||
      ![data.x, data.y, data.angle].every(Number.isFinite) ||
      Math.abs(data.x) > 1 ||
      Math.abs(data.y) > 1 ||
      Math.abs(data.angle) > Math.PI * 2
    )
      return;
    session.seq = data.seq;
    session.lastInput = now;
    session.input = { x: data.x, y: data.y, angle: data.angle };
    if (["strike", "dash", "parry"].includes(data.action) && !session.action)
      session.action = data.action;
  });
  socket.on("close", () => {
    clearTimeout(timeout);
    if (!session) return;
    const s = session;
    const f = s.room.world.fighters.find((f) => f.id === s.id)!;
    Object.assign(
      f,
      createCharacter(
        f.id,
        bots[Number(f.id.slice(-1))],
        "ai",
        s.room.world.arena.spawns[Number(f.id.slice(-1))],
      ),
    );
    s.room.clients.delete(s.id);
    sessions.delete(s);
    store.flush();
    if (!s.room.clients.size) rooms.splice(rooms.indexOf(s.room), 1);
  });
});
let last = performance.now(),
  accumulator = 0;
const timer = setInterval(() => {
  const now = performance.now();
  accumulator += Math.min((now - last) / 1000, 0.1);
  last = now;
  while (accumulator >= 1 / 60) {
    accumulator -= 1 / 60;
    for (const room of rooms) {
      const commands = new Map<string, Command>();
      for (const f of room.world.fighters) {
        const s = room.clients.get(f.id);
        if (s) {
          commands.set(
            f.id,
            Date.now() - s.lastInput < 250
              ? { ...s.input, action: s.action }
              : { x: 0, y: 0, angle: f.angle },
          );
          s.action = undefined;
        } else
          commands.set(
            f.id,
            room.controllers.get(f.id)!.command(room.world, f, 1 / 60),
          );
      }
      room.world.step(1 / 60, commands);
      for (const e of room.world.events)
        if (e.seq > room.processed) {
          room.processed = e.seq;
          if (e.type === "death")
            store.record(
              room.clients.get(e.actor)?.profile,
              room.clients.get(e.victim!)?.profile,
              !!e.reward,
            );
        }
      if (room.world.tick % 3 === 0)
        for (const s of room.clients.values())
          send(s.socket, {
            type: "state",
            snapshot: room.world.snapshot(s.id, room.id),
            profile: store.public(s.profile),
          });
    }
  }
}, 1000 / 60);
const save = setInterval(() => store.flush(), 5000);
const heartbeat = setInterval(() => {
  for (const s of sessions) {
    if (!s.alive) {
      s.socket.terminate();
      continue;
    }
    s.alive = false;
    s.socket.ping();
  }
}, 10000);
function shutdown() {
  clearInterval(timer);
  clearInterval(save);
  clearInterval(heartbeat);
  store.flush();
  for (const s of sessions) s.socket.close(1001, "Server restarting");
  wss.close();
  server.close(() => process.exit(0));
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
server.listen(port, process.env.HOST ?? "127.0.0.1", () =>
  console.log(`Lude authoritative server http://127.0.0.1:${port}`),
);
