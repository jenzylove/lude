# Lude — Product Definition

## Product thesis

**Lude turns the dead time between an AI request and its response into a fast social combat experience people may actually look forward to entering.**

The core game mode is **Hitlist**: while a real AI task is still running, the user can enter a compact multiplayer assassin arena. Every player receives one target while another unknown player is hunting them. If there are not enough human players, clearly labelled AI-controlled fighters fill the room immediately. When the user's real AI response finishes, their avatar is extracted from the arena and the completed response takes over.

Lude is being built for the Commons Made / VibeFi challenge around making AI waiting more enjoyable. The experience must be interactive, creative, repeatable, and genuinely tied to the fact that AI work has uncertain completion time.

---

## Locked product principles

1. **The game must be fun without rewards.** Credits, prizes, tokens, or other economic incentives are not part of the MVP.
2. **Never make the user wait for players.** Bots fill empty slots immediately and are clearly identified as AI.
3. **Do not expose AI prompts or private task content to other players.** The game only needs player identity and game state.
4. **Do not fake AI completion in the final product.** Extraction must eventually be triggered by a real AI request resolving.
5. **Short AI requests should not force the game open.** The final product will only offer Lude after a small wait threshold.
6. **Combat must create the desire to replay.** Leaderboards, cosmetics, persistence, and multiplayer cannot rescue boring combat.
7. **No generic loading-screen mini-game aesthetic.** The visual language should feel mature, stylish, fast, and intentional.
8. **No feature creep before the combat loop is proven.** The first milestone is only about game feel.

---

## Core Hitlist loop — final product direction

1. User sends a real AI request.
2. If the request remains unresolved beyond a small threshold, Lude becomes available.
3. User enters the arena with their persistent avatar.
4. A compact room contains a mixture of humans and clearly labelled AI fighters.
5. Each participant has exactly one current target.
6. Each participant is also the target of another participant, but does not know who is hunting them.
7. The player hunts their assigned target while watching for an unknown hunter.
8. On a successful elimination, score/bounty is awarded based on the defeated player's strength/rank and a new target is assigned.
9. Death causes a short respawn if the user's AI task is still running.
10. The user's real AI completion event immediately extracts them from the arena.
11. Persistent identity remembers rank, encounters, rivals, head-to-head history, streaks, and other game state between AI waits.

### Social memory direction

Repeated encounters should create lightweight human connection without requiring full chat.

Examples:

- `RIVAL — JD 3 : 2 MARCO`
- revenge indicator after a previous loss
- recent encounter history
- persistent handle/avatar
- rank / bounty
- small emotes such as GG, 👀, 😂 after combat

Full text chat is not part of the MVP because it adds moderation and distracts from a short-session experience.

---

# Milestone 1 — Combat Prototype

## Goal

Answer one question only:

> **Is Lude's fighting enjoyable enough that a person voluntarily wants another round?**

Do not build the wider product before this is demonstrated.

## Required implementation

Build a browser game prototype using:

- **TypeScript**
- **Vite**
- **Phaser 3** unless a clearly better browser-native choice is justified before implementation

The prototype should use a **fast 2.5D / top-down assassin-arena presentation** rather than a side-on Mortal Kombat layout or a large third-person GTA-like world.

### Arena

- one compact arena
- contact with an opponent should happen within seconds
- enough walls/cover/geometry to create pursuit, repositioning, ambushes, and line-of-sight decisions
- no giant map
- no collectible diamonds, coins, crates, or busy-work objectives

### Player kit

For Milestone 1, everyone uses one balanced blade. Do not add weapon-selection complexity yet.

Required controls/mechanics:

- movement
- directional facing
- strike
- dash / evasive burst with cooldown
- parry / timed defensive action
- health
- hit feedback
- death
- short respawn

Target combat duration: a committed fight should usually resolve in roughly **5–15 seconds**, not minutes.

The combat should reward timing and positioning rather than button spam.

### Opponent

Milestone 1 must work with no second human.

Implement at least one competent AI fighter that can:

- approach / pursue
- reposition
- attack
- occasionally evade
- use parry defensively
- avoid obviously suicidal repeated attacks

It should feel like an opponent, not a stationary dummy.

A second clearly different bot difficulty is welcome only if the core implementation is already solid.

### Game feel

Prioritize:

- responsive input
- readable attacks
- strong impact feedback
- short recovery windows
- readable cooldown feedback
- satisfying dash
- clear parry timing and feedback
- camera treatment that supports combat
- restrained screen shake / hit stop where useful
- readable health state
- fast restart after death

### Visual direction

Lude should not resemble a children's loading-screen game.

Direction:

- sleek, dark, high-contrast assassin / underground-arena feel
- strong silhouettes
- restrained neon / light accents are acceptable
- clean typography
- minimal UI
- no gore required
- avoid generic AI SaaS visuals
- avoid cute blob characters and cartoon collectible aesthetics

Use simple original procedural/geometric assets if necessary. Do not delay the milestone hunting for elaborate art assets.

### Controls

Desktop must be fully playable.

Suggested baseline:

- WASD / arrows: move
- mouse or directional input: face/aim
- primary input: strike
- secondary input/key: parry
- Space / Shift: dash

Mobile controls may be sketched structurally but full mobile polish is not required in Milestone 1.

---

## Milestone 1 explicit non-goals

Do **not** implement yet:

- Commons integration
- real AI request lifecycle
- multiplayer networking
- WebSockets
- user accounts
- database persistence
- leaderboard
- ranking/ELO
- rival history
- target/hunter matchmaking network
- bounty economy
- multiple weapons
- cosmetics
- credit rewards
- Most Wanted events
- full chat
- giant maps
- landing-page marketing work

If the combat loop is not compelling, these features are wasted effort.

---

## Milestone 1 acceptance criteria

The milestone is ready only when:

1. `npm install` and the documented dev command launch the game cleanly.
2. The game loads without console-breaking errors.
3. A user can understand how to move and fight within a few seconds.
4. Player movement feels responsive.
5. Strike, dash, and parry are all meaningfully useful.
6. Button-spamming is weaker than timing/positioning.
7. At least one AI fighter can produce a credible short duel.
8. Death and respawn work reliably.
9. A complete 30-second play session is possible without menus or setup friction.
10. The implementation has been tested in a real browser, not only type-checked.
11. The repository contains concise run instructions.
12. The final working state is committed and pushed to `origin/main`.
13. The working tree is clean at completion.

### Stop condition

**Do not proceed to multiplayer, persistence, AI integration, Commons publication, leaderboards, or additional weapons after Milestone 1.**

Stop and report what was built, what was tested, exact commit SHA, and any remaining game-feel concerns. Product approval comes before Milestone 2.

---

# Planned later milestones — context only

These are intentionally not Milestone 1 work.

## Milestone 2 — Hitlist becomes social

- authoritative realtime multiplayer
- compact rooms, likely ~4–6 participants
- bots always fill missing slots
- real users replace bots without showing `waiting for players`
- hidden target/hunter assignment graph
- server-validated hits/kills/score
- target reassignment
- reconnect handling
- persistent player identity
- scoring/rank
- rivals/head-to-head history
- two-browser end-to-end verification

## Milestone 3 — Connect the AI wait

- real AI request
- waiting threshold
- enter-Lude transition
- AI request continues while game is active
- real completion event triggers extraction
- quick responses bypass Lude
- model errors/timeouts handled honestly
- final AI result shown immediately after extraction
- Commons-compatible/published experience

## Optional final milestone — submission polish

Only after the full real loop works:

- responsive/mobile polish
- audio
- refined animation and VFX
- avatar/cosmetic layer
- additional balanced weapon archetypes if they improve gameplay
- optional limited-time Most Wanted event
- submission demo polish

---

## Final demo target

A judge should be able to understand the concept in about 20 seconds:

1. Send an AI request.
2. AI is still working.
3. Enter Lude.
4. Receive a target and fight a real player or clearly labelled bot while another participant may be hunting you.
5. Score/encounter state changes.
6. The real AI response completes unpredictably.
7. The player's avatar is extracted instantly.
8. The finished AI answer appears.

The final demo must use a real AI lifecycle, not a hard-coded timer presented as AI work.
