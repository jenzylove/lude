# Active scope and verification

The user's September 5 follow-up explicitly expands the original milestone boundary in PRD.md / PROMPT_1.md: finish the combat foundation first, then continue into shared character/controllers, realtime bot-filled Hitlist rooms, private contracts, and reassignment. The original documents remain intact as product history. No AI task lifecycle is simulated.

## Foundation playtest findings

- First browser pass exposed a negative respawn timer being treated as a truthy action lock. Clamping/resetting the timer and checking positive duration restored subsequent duels.
- Added labels to cooldown bars and fitted the canvas to short desktop viewports so instructions remain visible.
- Edge automation sends real keyboard/pointer inputs, tracks combat events, and exercises a 32-second active session followed by idle vulnerability. It reads development-only state for measurement, without changing health or forcing outcomes.
- The first corrected active run completed five rounds, including four AI deaths and one player death, with eleven parries. Round times including 1.2-second restart were 4.6–6.7 seconds. Human review is still needed to judge replay desire and difficulty.

## Implemented shared Hitlist increment

The combat rules now run in a renderer-independent fixed-step world with an arena definition and character state. Human input and delayed AI decisions feed the same command path. The server owns health, collisions, eliminations, contracts and scores. Each client receives only its own assignment, never the full contract graph. A four-slot room replaces bots immediately on human connection and restores them on disconnect. Rendering interprets the supplied visual references using original procedural architecture and humanoid silhouettes.

The above is now implemented. Device-token profiles also persist contract totals, deaths and bounded human encounter counters. This is the state foundation; ranks and rival UI remain unimplemented.

### Verified checkpoint

- `npm run build` passed. Vite reports the expected large Phaser bundle warning (about 341 KB gzipped total JS).
- Nine automated tests passed, covering parry direction/counterattack, attack spam lockouts, missed parry recovery, dash invulnerability and collision, blade line of sight, repeated respawn, private contract graph invariants/scoring, AI pursuit, profile persistence and a real five-client server test.
- Bot navigation originally stopped at inflated cover boundaries. Matching navigation clearance to the collision radius fixed it; a seeded 60-second bot duel produced 55 hits, seven parries, five dashes and thirteen deaths.
- Real Edge input-driven local play: 32 seconds active plus 14 seconds idle, 40 hits, nine parries, ten dashes, ten deaths and ten respawns. Measured player death intervals during active play: 5.85, 8.08 and 6.75 seconds. Both player and AI eliminations verified.
- Two isolated browser contexts played simultaneously for 34 seconds in the same room: 64 hits, twenty parries, ten dashes, fifteen deaths/respawns and twelve contract eliminations across the room. Both clients used actual keyboard/pointer input, without health writes or forced kills.
- Disconnect restored the bot slot, and reload preserved the remaining player's identity. No browser runtime exceptions. Screenshots inspected at 1440×960.
- Browser automation measures the interaction path and outcomes; it cannot establish subjective enjoyment. Internet latency and human four-player balance remain review items.

### Final refinements and re-verification

- Contract rewards, successful-contract events and session scores are private to their owner, preventing those messages from disclosing another fighter's assignment. Ordinary visible hits/deaths remain public.
- Input edges survive frames without a simulation tick (120/144 Hz displays). Reconnect resets event tracking so a new room cannot replay stale effects. Remote character positions are smoothed between snapshots, while health and combat phases remain authoritative.
- Arena presentation now has a registry/interface separate from the world definition. Only the rooftop is built; other arenas can supply a camera and renderer without changing characters, controllers, room transport or contracts.
- Increased primary controls and cooldown text, and respect reduced-motion preference for shake.
- Final `npm test`: **11/11 passed**. Final production build passed; expected Phaser bundle-size warning remains.
- Final Edge local test: **41 hits, six parries, five dashes, ten deaths and ten respawns** over 32 seconds active plus 14 seconds idle. The measured player-death intervals were 4.72 and 9.54 seconds; fights vary with defensive timing.
- Final simultaneous two-client test: **59 hits, six parries, seven dashes, fourteen deaths**, twelve respawns at sampling time, and one private contract success observed by the first client. Rechecked same-room play, human/bot replacement, identity-preserving reload, and zero runtime exceptions. Contract event counts are now per recipient, not room-wide.
- Production smoke/play test used the built client with a separate real server at **1366×768**, exercised input and the sound toggle, verified no viewport overflow and no development test bridge. Killed/restarted that server; the browser automatically reconnected with its identity and **four persisted deaths**. Zero runtime exceptions.
- `node tests/production.mjs` reproduces the production test after building. It starts and stops its own isolated server and stores data under ignored `test-results/`.

### Remaining product work

Human assessment of replay desire and group balance; internet latency/lag compensation and deployment hardening; recoverable identity/accounts; rank and rival-history UI. The persisted encounter counters are a foundation only. No real AI-request lifecycle or Commons integration is claimed. No public service has been deployed.
