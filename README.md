# Lude · Milestone 1

Compact local blade duel against **AI / Kestrel**, built with TypeScript, Vite and Phaser 3. No accounts or setup screens.

Requires Node.js 22.12+ (verified on 24). Run `npm install`, then `npm run dev`; open http://127.0.0.1:5173. `npm run build` type-checks and builds; `npm run preview` serves the production build.

WASD/arrows move; mouse aims (movement faces until mouse moves); click/J strikes; E/K/right-click parries; Space/Shift dashes in the movement direction, or facing when stationary. Four hits kill. Both fighters share damage, movement, cooldowns and defensive rules. Dash evades damage; face a strike during the short parry window to stun its attacker. Misses have recovery. Automatic fresh duel after 1.2 seconds.

Only combat prototype scope is implemented. Human review of replay desire is required before any later milestone.
