# Astra Prompt 1 — Make the Fighting Fun

You are working in the GitHub repository `jenzylove/lude` on branch `main`.

Your task is to complete **Milestone 1 — Combat Prototype** only.

Before changing anything:

1. inspect the repository tree and git status
2. read `PRD.md` fully
3. read `AGENTS.md` fully
4. verify the current branch and `origin` remote
5. understand the Milestone 1 stop condition before coding

Do not rediscover or redesign the product. The product direction is locked in `PRD.md`.

---

## Goal

Build a browser-playable prototype that answers one question:

> **Is Lude's combat genuinely enjoyable enough that someone wants to play another round?**

This first run is intentionally **not** the full hackathon product.

Do not spend time on multiplayer networking, Commons integration, user accounts, persistence, leaderboards, AI request integration, target/hunter matchmaking, multiple weapons, cosmetics, rewards, or a marketing landing page.

If you find yourself implementing those, stop and return to the actual milestone.

---

## Build direction

Use **TypeScript + Vite + Phaser 3** unless the existing repository already contains a materially better browser-game foundation.

Create one compact **2.5D / top-down assassin arena** with one player and at least one competent AI opponent.

The game must feel mature, stylish, fast, and readable rather than like a children's loading-screen mini-game.

### Core controls

Implement:

- responsive movement
- directional facing / aiming appropriate to the camera
- blade strike
- dash / evasive burst with a cooldown
- timed parry
- health
- hit reaction / feedback
- death
- short respawn

A committed duel should usually resolve in approximately **5–15 seconds**.

Timing and positioning should beat mindless attack spam.

Do not scatter weapons, coins, crystals, diamonds, loot crates, or collectibles around the map.

Everyone uses one balanced blade in Milestone 1.

---

## Arena design

The arena must be small enough that the player reaches meaningful interaction almost immediately.

Use geometry that creates:

- pursuit
- cornering
- repositioning
- line-of-sight breaks
- short ambush opportunities

Do not create a large world the player has to traverse before anything happens.

The player should be fighting or actively maneuvering around an opponent within seconds of starting.

---

## AI fighter

The AI opponent must be able to produce a credible duel.

It should:

- pursue when appropriate
- keep or close distance intelligently
- reposition rather than run directly into every attack
- attack with readable timing
- sometimes dash/evade
- sometimes parry
- recover from mistakes
- avoid a trivial infinite attack loop

Do not cheat by giving the AI impossible reactions or hidden damage advantages.

The objective is an opponent that is fun to fight, not merely difficult.

---

## Game feel matters more than feature count

Invest real iteration into:

- input responsiveness
- acceleration/deceleration if used
- strike wind-up and recovery
- attack readability
- attack range
- hitboxes
- hit stop
- restrained screen shake
- dash responsiveness and cooldown
- parry timing window
- parry success feedback
- knockback if it improves combat
- health readability
- death feedback
- respawn speed
- camera behavior
- sound hooks / lightweight generated effects if useful and available

Use simple procedural/geometric/original placeholder art if necessary. Do not waste the milestone hunting for elaborate external assets.

### Visual direction

Aim for:

- dark / high-contrast assassin-arena mood
- strong silhouettes
- restrained luminous accents
- minimal HUD
- clean typography
- readable combat states
- no gore required
- no cute blob characters
- no generic AI SaaS interface

The prototype can be visually simple, but it should feel intentional.

---

## Playtest and iterate

Do not stop after the first implementation compiles.

You must actively run the game in a real browser and test the complete combat loop.

At minimum, exercise repeatedly:

- movement around the arena
- engaging and disengaging from the AI fighter
- strike timing
- dash to evade/reposition
- successful and failed parries
- taking damage
- killing the opponent
- being killed
- respawning
- immediately starting another duel

After the first playable version, identify the most obvious issues in game feel.

Examples:

- sluggish movement
- combat dominated by spam
- parry useless or impossible
- dash too strong or pointless
- unclear hit range
- AI too passive or robotic
- fights taking too long
- deaths feeling flat
- too much downtime
- arena too large
- controls not obvious

Fix the issues and test again.

Continue this loop until the Milestone 1 acceptance criteria in `PRD.md` are satisfied or you identify a genuine blocker.

Do not invent unrelated features as a substitute for improving combat.

---

## Repository and checkpoint requirements

This autonomous run must leave durable work on GitHub.

1. Once the first genuinely playable version exists, make a **checkpoint commit** before major polish/refinement.
2. Continue playtesting and improving the combat.
3. When Milestone 1 acceptance criteria are satisfied, make a **final Milestone 1 commit**.
4. Push all successful commits to **`origin/main`**.
5. Verify the final local HEAD exists on `origin/main`.
6. Verify the working tree is clean.

Do not finish with valuable work only stored locally or uncommitted.

If GitHub push fails because of authentication, permissions, remote configuration, or another blocker, preserve the local commits and report the exact problem. Do not claim remote completion.

---

## Verification requirements

Before declaring success, verify at least:

- dependencies install successfully
- development server launches
- production build succeeds
- game launches in a real browser
- there are no console-breaking runtime errors
- controls work
- combat works through repeated duels
- AI opponent can attack, evade/reposition, and defend
- strike, dash, and parry all have meaningful roles
- death and respawn work repeatedly
- a 30-second play session has no setup/menu friction
- README/run instructions are sufficient for another developer to launch it
- final git status is clean
- final commit is pushed to `origin/main`

If practical, add focused automated tests for deterministic game logic, but do not confuse tests with browser play verification.

---

## What NOT to build

Do not implement any of the following in this run:

- online multiplayer
- WebSocket server
- player accounts
- database
- persistence
- ranking / ELO
- leaderboard
- rival memory
- target/hunter network
- bounty economy
- AI prompt/result flow
- fake AI waiting timers
- Commons Made integration
- credit/token rewards
- multiple weapon classes
- cosmetics store
- Most Wanted mode
- full chat
- giant map
- elaborate landing page

These are intentionally deferred.

---

## Stop condition

When Milestone 1 is complete, **STOP**.

Do not begin Milestone 2 on your own.

Return a compact report in this format:

### IMPLEMENTED

### GAMEPLAY CHANGES AFTER PLAYTESTING

### TESTS / BROWSER VERIFICATION

### KNOWN GAME-FEEL CONCERNS

### FINAL GITHUB HEAD

### PUSHED TO ORIGIN/MAIN: YES/NO

### MILESTONE 1 READY FOR HUMAN REVIEW: YES/NO

The final answer must include the exact final commit SHA.
