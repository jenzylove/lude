# Lude Agent Instructions

## Source of truth

Before making material changes, read `PRD.md` completely.

`PRD.md` contains the locked product direction, current milestone, explicit non-goals, and stop condition. Do not silently redesign the product or pull future milestones into the current one.

## Current milestone

The original **Milestone 1 — Combat Prototype** is the verified foundation. The user's September 5 follow-up explicitly expanded the active scope to shared arena/character/controller abstractions, realtime bot-filled Hitlist rooms, private contract scoring/reassignment, and persistent player-state foundations. See `DEVELOPMENT.md` and the scope amendment in `PRD.md`.

The only product question to answer is:

> Is the fighting enjoyable enough that a user voluntarily wants another round?

Multiplayer and persistent-state foundations are now authorized and implemented. Do not silently add AI waiting integration, Commons publication, leaderboards, accounts, multiple weapons or cosmetics. Preserve and verify the working combat and two-client loop before further expansion.

## Operating rule

**Inspect first. Build second. Verify before claiming success.**

Before coding:

1. inspect the repository tree and git state
2. read `PRD.md`
3. inspect any existing code rather than assuming the repo is empty
4. confirm current branch and remote
5. preserve working code unless there is a concrete reason to replace it

## Implementation expectations

- Prefer TypeScript + Vite + Phaser 3 for the Milestone 1 browser prototype.
- Keep the implementation small enough to reason about and iterate quickly.
- Prioritize game feel over architecture breadth.
- Use simple original procedural/geometric assets when needed rather than delaying the milestone for art.
- Avoid fake integrations and fake claims.
- Do not add hard-coded AI waiting timers and present them as real product behavior; AI integration is a later milestone.

## Browser verification is mandatory

Do not treat successful compilation or unit tests as proof that the game works.

Launch the game in a real browser and actively exercise:

- movement
- strike
- dash
- parry
- damage feedback
- AI opponent behavior
- death
- respawn
- repeated short fights

Fix obvious gameplay bugs before completion.

Where your environment supports browser automation or direct browser interaction, use it. If automated control is insufficient to judge game feel, still verify the full interaction path and report the limitation honestly.

## Game-feel iteration

The first implementation is not automatically the final implementation.

After the first playable pass:

1. play/test it
2. identify the most obvious boring, sluggish, confusing, unfair, or spammy behavior
3. improve the combat
4. repeat until the Milestone 1 acceptance criteria in `PRD.md` are met or a genuine blocker is found

Do not compensate for weak combat by adding unrelated features.

## Git discipline

The repository is `jenzylove/lude` and the target branch is `main` unless the repository state clearly indicates otherwise.

During a substantial autonomous run:

- create a checkpoint commit once the first genuinely playable prototype works
- continue polish/verification from that checkpoint
- create a final Milestone 1 commit after verification
- push successful commits to `origin/main`
- do not finish with valuable work only in an uncommitted working tree

Before reporting completion, verify:

- `git status` is clean
- local HEAD is pushed to `origin/main`
- report the exact final commit SHA

If push fails, report the failure and reason explicitly. Do not claim the milestone is complete if the requested repository state was not persisted remotely.

## Completion report

When Milestone 1 is finished, stop and report compactly:

**IMPLEMENTED**

**GAMEPLAY CHANGES AFTER PLAYTESTING**

**TESTS / BROWSER VERIFICATION**

**KNOWN GAME-FEEL CONCERNS**

**FINAL GITHUB HEAD**

**PUSHED TO ORIGIN/MAIN: YES/NO**

**MILESTONE 1 READY FOR HUMAN REVIEW: YES/NO**

The explicit September 5 scope expansion authorizes the implemented Hitlist increment. Further expansion still requires clear user direction; do not infer a requirement to finish all later milestones.
