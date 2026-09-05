# Active scope and verification

The user's September 5 follow-up explicitly expands the original milestone boundary in PRD.md / PROMPT_1.md: finish the combat foundation first, then continue into shared character/controllers, realtime bot-filled Hitlist rooms, private contracts, and reassignment. The original documents remain intact as product history. No AI task lifecycle is simulated.

## Foundation playtest findings

- First browser pass exposed a negative respawn timer being treated as a truthy action lock. Clamping/resetting the timer and checking positive duration restored subsequent duels.
- Added labels to cooldown bars and fitted the canvas to short desktop viewports so instructions remain visible.
- Edge automation sends real keyboard/pointer inputs, tracks combat events, and exercises a 32-second active session followed by idle vulnerability. It reads development-only state for measurement, without changing health or forcing outcomes.
- The first corrected active run completed five rounds, including four AI deaths and one player death, with eleven parries. Round times including 1.2-second restart were 4.6–6.7 seconds. Human review is still needed to judge replay desire and difficulty.

## Next stable increment

Extract the existing combat rules into a renderer-independent fixed-step world with an arena definition and character state. Human input and delayed AI decisions feed the same command path. The server owns health, collisions, eliminations, contracts and scores. Each client receives only its own assignment, never the full contract graph. A four-slot room replaces bots immediately on human connection and restores them on disconnect. Rendering interprets the supplied visual references using original procedural architecture and humanoid silhouettes.
