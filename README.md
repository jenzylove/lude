# Lude · Hitlist

A compact realtime assassin arena. Enter immediately with AI filling the room. Hunt your assigned contract while another unknown fighter hunts you. One blade, four fighters, no waiting lobby.

## Run

Requires **Node.js 22.12+** and npm (verified on Node 24 / Windows).

```sh
npm install
npm run dev
```

Open **http://127.0.0.1:5173**. This command runs Vite and the authoritative WebSocket server together. Open the same URL in a different browser or private browser context for a second human. Tabs sharing a device identity cannot play simultaneously. Unoccupied slots are always clearly labelled AI fighters.

**Practice Duel** in the lower right opens an offline one-on-one version using the same combat rules. It also works directly at `/?mode=duel`.

```sh
npm run build    # TypeScript checks + production client
npm start        # Serve production client and WebSocket on http://127.0.0.1:3001
npm test         # Deterministic combat + real server + persistence tests
node tests/playtest.mjs # Real Edge input-driven duel and two-client verification; dev server must be running
node tests/production.mjs # Built client, isolated server, audio, reconnect and persistence verification
```

Browser tests use locally installed Microsoft Edge; install Edge or change Playwright's channel to an available Chromium browser. Screenshots and measured results go into ignored `test-results/`.

For a trusted LAN demo, set `HOST=0.0.0.0` before `npm start` and open the host's LAN address on port 3001. Internet hosting requires a persistent Node process, HTTPS/WSS reverse proxy, durable `DATA_DIR`, and deployment hardening. A static Vite preview only supports offline practice; use `npm start` for the full production loop.

## Fight

| Input | Action |
|---|---|
| WASD / arrows | Screen-relative movement |
| Mouse | Aim; movement faces until the mouse is used |
| Click / J | Commit a blade strike |
| Space / Shift | Dash in movement direction, otherwise facing |
| E / K / right click | Timed forward parry |

Amber arcs telegraph strikes. Dash briefly avoids damage. A correctly faced parry stuns the attacker and clears your strike cooldown; missed parries and strikes leave recovery openings. Attacks are edge-triggered, not auto-repeat. Four blade hits kill. Death returns you in 1.2 seconds with a brief shield that ends when attacking or parrying. Sound is optional and starts muted.

Only an assigned-target elimination gives **100 contract score**. Other eliminations can defend your life but give no contract score. A valid elimination changes the contract cycle while preserving exactly one target and one hunter per slot. Session score resets when leaving. Joining humans replace bot slots; leaving humans are replaced immediately.

## Structure

- `src/shared/arena.ts`: arena definition, collision geometry, line of sight and navigation; the rooftop is one arena instance.
- `src/shared/combat.ts`: renderer-independent fixed-step characters, actions, health, respawn and private contract graph.
- `src/shared/controllers.ts`: imperfect, delayed AI intent; uses the same command path as human input.
- `server/index.ts`: 60 Hz authoritative rooms, 20 Hz personalized snapshots, input validation and bot replacement.
- `server/profiles.ts`: private device-token identity, lifetime contract/death counters and bounded human encounter history; atomic local-file persistence.
- `src/client/`: local/network session transport, arena-presentation registry and original procedural 2.5D rendering.

## Persistence and limits

Device identity is stored in browser local storage; server records live in ignored `data/profiles.json` (override with `DATA_DIR`). Tokens are stored hashed on the server. Keep that directory private and back it up. Clearing local storage creates a new identity; this is a foundation, not a recoverable user-account system. Profiles retain lifetime contract counts, deaths and up to 50 human encounters. Ranks and a rival-history UI are not implemented.

This is a verified local/LAN prototype, not a deployed service. There is no distributed room infrastructure, latency compensation, account recovery, mobile control scheme, or real AI-request lifecycle. Human playtesting remains necessary to judge replay desire, four-player balance and internet latency. The art is original procedural geometry inspired by the supplied composition references, not photoreal assets.

See `DEVELOPMENT.md` for the authorized scope expansion and measured verification.
