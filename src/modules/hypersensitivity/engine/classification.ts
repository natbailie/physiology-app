import type { DominantMechanism, HypersensitivityType } from './types';

interface ArmActivity {
  I: number;
  II: number;
  III: number;
  IV: number;
}

/** Below this, no arm is doing enough to be called the mechanism. */
const DECLARED_THRESHOLD = 0.06;

/**
 * Which arm is doing the damage.
 *
 * Named from the activity of the arms themselves rather than from the clinical picture, so the
 * verdict is a statement about the mechanism and not a restatement of the symptoms. Two
 * reactions can look alike and be different types; that is the whole reason the classification
 * exists, and a classifier that read the symptoms would simply reproduce the confusion.
 */
export function dominantMechanism(activity: ArmActivity): DominantMechanism {
  const entries: [HypersensitivityType, number][] = [
    ['I', activity.I],
    ['II', activity.II],
    ['III', activity.III],
    ['IV', activity.IV],
  ];
  let best: HypersensitivityType = 'I';
  let bestValue = -Infinity;
  for (const [type, value] of entries) {
    if (value > bestValue) {
      best = type;
      bestValue = value;
    }
  }
  return bestValue < DECLARED_THRESHOLD ? 'none' : best;
}

const MECHANISM_NAMES: Record<HypersensitivityType, string> = {
  I: 'Type I — IgE / mast cell',
  II: 'Type II — antibody vs cell',
  III: 'Type III — immune complex',
  IV: 'Type IV — T cell / macrophage',
};

/**
 * The reasoning under the label: how fast it came on, and what that alone rules out.
 *
 * Onset is the single most discriminating piece of information about a hypersensitivity
 * reaction, because the four effectors are physically incapable of working at each other's
 * speeds. Nothing that takes two days can be preformed granule contents; nothing that happens
 * in ten minutes can be waiting for cells to traffic to a site.
 */
export function mechanismSummary(mechanism: DominantMechanism, onsetHours: number): string {
  if (mechanism === 'none') return 'No reaction — the arm that would mediate one is not present';

  const timing =
    onsetHours < 0
      ? 'not yet apparent'
      : onsetHours < 0.75
        ? `onset ${Math.round(onsetHours * 60)} min · only preformed mediators are that fast`
        : onsetHours < 8
          ? `onset ${onsetHours.toFixed(1)} h · antibody had to bind first`
          : `onset ${Math.round(onsetHours)} h · cells had to travel there`;

  return `${MECHANISM_NAMES[mechanism]} · ${timing}`;
}
