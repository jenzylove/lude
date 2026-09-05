import type Phaser from "phaser";
import {
  ROOFTOP,
  type ArenaDefinition,
  type Point,
  type Cover,
} from "../shared/arena";
import type { Character, CombatEvent } from "../shared/combat";
import {
  drawEnvironment,
  drawCover,
  drawCharacter,
  drawEffect,
  project,
  unproject,
} from "./render";

/** Rendering/camera implementation is selected independently of combat state.
 * A future arena supplies its own definition and presentation without changing
 * characters, controllers, rooms, input transport or the contract graph. */
export interface ArenaPresentation {
  definition: ArenaDefinition;
  project(p: Point, z?: number): Point;
  unproject(p: Point): Point;
  environment(g: Phaser.GameObjects.Graphics): void;
  cover(g: Phaser.GameObjects.Graphics, cover: Cover): void;
  character(
    g: Phaser.GameObjects.Graphics,
    f: Character,
    own: boolean,
    target: boolean,
    time: number,
  ): void;
  effect(g: Phaser.GameObjects.Graphics, event: CombatEvent, age: number): void;
}
export const arenaPresentations: Record<string, ArenaPresentation> = {
  [ROOFTOP.id]: {
    definition: ROOFTOP,
    project,
    unproject,
    environment: drawEnvironment,
    cover: drawCover,
    character: drawCharacter,
    effect: drawEffect,
  },
};
