import type { ReferenceRanges } from '@/shared/validation/referenceRange';

/**
 * The bands this module's baseline is asserted against, and where each one comes from.
 *
 * Baseline is a relaxed student in a manageable lecture: low distraction, little fatigue, moderate
 * arousal, a healthy executive reserve. Three of the bands carry external anchors — the 7±2 span of
 * Miller's 1956 paper for working memory, the Yerkes-Dodson inverted-U for performance, and the
 * same law's "difficulty shifts the optimum" corollary for the task optimum. The reserve-drawn band
 * sits on the qualitative "effort is spent from a limited account" tradition; only the demand
 * overshoot reading is a pure index of this model's cliff, and it is named as such.
 */
export const COGNITION_REFERENCE_RANGES: ReferenceRanges = {
  memoryOccupancyPct: {
    low: 5,
    high: 55,
    unit: '%',
    provenance: {
      kind: 'literature',
      citation:
        'Miller\'s 1956 "Magical Number Seven, Plus or Minus Two" sets the span of immediate ' +
        'memory at 5-9 chunks. The baseline holds three chunks under light friction, so its ' +
        'occupancy of that 7-chunk ceiling sits low in the range on purpose — it is the headroom ' +
        'that distraction and fatigue spend.',
    },
  },
  performancePct: {
    low: 50,
    high: 100,
    unit: '%',
    provenance: {
      kind: 'literature',
      citation:
        'The Yerkes-Dodson law (1908) and Hebb\'s "optimum level of arousal/appraisal" both put ' +
        'performance at a mid range of arousal and falling away on either side (Guyton & Hall, ' +
        '"Higher Functions of the Nervous System"; the arousal-and-performance literature). A ' +
        'calm learner on a moderate task sits high on that curve; the exact percentage is an ' +
        'index but the plateau position reads high.',
    },
  },
  optimalArousal: {
    low: 12,
    high: 45,
    unit: 'ratio',
    provenance: {
      kind: 'literature',
      citation:
        'The Yerkes-Dodson difficulty corollary — complex tasks are performed best at LOWER arousal ' +
        '(Yerkes & Dodson, 1908; reviews of arousal and task complexity) — fixes the task optimum ' +
        'between a run of 45 for an easy task and a floor around 12 for the hardest. The baseline ' +
        'medium-difficulty lecture sits about a third down that range: optimum 31.',
    },
  },
  reserveDrawnPct: {
    low: 35,
    high: 70,
    unit: '%',
    provenance: {
      kind: 'literature',
      citation:
        'Kahneman\'s "Attention and Effort" (1973) frames effort as drawn from a limited capacity ' +
        'account — the "reserve" this module draws — and reviews of cognitive fatigue still read ' +
        'its depletion that way (Gailliot et al. 2007 operationalize the resource). A moderate task ' +
        'at near-optimum arousal draws about half the account, which is the working assumption here.',
    },
  },
  demandOvershootPct: {
    low: 0,
    high: 20,
    unit: '%',
    provenance: {
      kind: 'unsourced',
      needs:
        'A measured relation between task difficulty and error-rate runaway would anchor the ' +
        'overshoot threshold and its cliff; for now the baseline undershoots its reserve and reads ' +
        'a wide margin, which is the qualitative claim of the overload literature.',
    },
  },
};