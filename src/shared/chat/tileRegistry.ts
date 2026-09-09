/**
 * Every readout tile on screen, as it mounts, for the tutor to read.
 *
 * ## Why the TILE and not the module page
 *
 * The obvious place to publish from is the schema grid, and that was the first attempt. It covers
 * nine modules. The other thirty-eight web pages still render a hand-written `ReadoutPanel` —
 * the presentation schema exists for 47 modules and the phone renders all of them from it, but
 * the web migration is a backlog, and a tutor that could see the numbers on nine pages and not
 * the rest would be a feature a learner cannot predict.
 *
 * Every one of those panels, old and new, builds its tiles out of `ReadoutItem`. So the tile
 * registers itself, and the coverage question disappears: if a learner can see a number, it is
 * because a `ReadoutItem` rendered it, and the tutor has it.
 *
 * ## Withheld tiles
 *
 * A tile that names the pattern goes blank while a pattern question is open. Rather than re-derive
 * that rule here, the tile hands over the SAME `withheld` flag it uses to blank itself. The guard
 * is therefore not a mirror that could drift out of step: a tile that shows nothing on screen is,
 * by construction, a tile the tutor is not told about.
 *
 * ## Cost
 *
 * A `Map.set` per tile per commit — nine or so per frame, of values the tile had already computed
 * to render. Nothing is formatted for the tutor's benefit until a message is actually sent, and
 * `Map` keeps a key in its original position when it is overwritten, so tiles stay in the order
 * they were painted in.
 *
 * This file is web-only and deliberately outside the sync manifest: the phone renders every module
 * from the schema already, so `app/module/[id].tsx` publishes with `liveReadings` and needs none
 * of this.
 */

import { clearLiveState, publishLiveState, type LiveState } from './liveState';

interface RegisteredTile {
  moduleId: string;
  label: string;
  value: string;
  unit?: string;
  secondary?: string;
  withheld: boolean;
}

const tiles = new Map<number, RegisteredTile>();
let nextId = 0;

const source = (): LiveState => {
  const shown = [...tiles.values()].filter((tile) => !tile.withheld);
  return {
    // Every mounted tile belongs to the page on screen, so any of them answers this.
    moduleId: shown[0]?.moduleId ?? '',
    readings: shown.map((tile) => ({
      label: tile.label,
      value: tile.value,
      ...(tile.unit ? { unit: tile.unit } : {}),
      ...(tile.secondary ? { secondary: tile.secondary } : {}),
    })),
  };
};

/** Claim a slot. The id keeps this tile's position for as long as it is mounted. */
export function claimTile(): number {
  return nextId++;
}

/** Record what this tile currently shows. Called from a commit effect, never during render. */
export function setTile(id: number, tile: RegisteredTile): void {
  const first = tiles.size === 0;
  tiles.set(id, tile);
  // Published on the first tile rather than eagerly, so a page with no readouts leaves the tutor
  // with no screen instead of an empty one.
  if (first) publishLiveState(source);
}

/** Give the slot back on unmount, and stand the whole screen down once the last tile goes. */
export function releaseTile(id: number): void {
  tiles.delete(id);
  if (tiles.size === 0) clearLiveState(source);
}
