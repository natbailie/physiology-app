import type { ReferenceRanges } from '@/shared/validation/referenceRange';

/**
 * The bands this module's baseline is asserted against, and where each one comes from.
 *
 * Four of the six are corroborated by the committed Pulse trace in `__oracle__/`; two are not yet,
 * and say so. See `tools/pulse-oracle/README.md` for how the traces are generated.
 */
export const SHOCK_REFERENCE_RANGES = {
  cardiacOutputLPerMin: {
    low: 4,
    high: 6,
    unit: 'L/min',
    provenance: {
      kind: 'oracle',
      trace: 'hemorrhage-class3',
      observed: 5.79,
      note:
        "Pulse's StandardMale at rest. Pulse's own cardiovascular validation table gives an expected " +
        '5,600 mL/min for this patient, attributed there to Guyton 2006, and its engine reports 5,787 ' +
        '— so this band is corroborated twice over, by the trace and by the table behind it.',
    },
  },
  meanArterialPressureMmHg: {
    low: 88,
    high: 100,
    unit: 'mmHg',
    provenance: {
      kind: 'oracle',
      trace: 'hemorrhage-class3',
      observed: 95.3,
      note: "Pulse's StandardMale baseline sits mid-band.",
    },
  },
  centralVenousPressureMmHg: {
    low: 1,
    high: 6,
    unit: 'mmHg',
    provenance: {
      kind: 'oracle',
      trace: 'hemorrhage-class3',
      observed: 4.7,
      note: 'Within band, toward the top of it.',
    },
  },
  wedgePressureMmHg: {
    low: 7,
    high: 13,
    unit: 'mmHg',
    provenance: {
      kind: 'oracle',
      trace: 'hemorrhage-class3',
      observed: 6.46,
      note:
        'Note: Pulse settles just below our lower bound of 7. Both sit inside the conventional 6-12 ' +
        'mmHg range for PCWP, so neither is wrong, but our lower bound is the one value here that the ' +
        'oracle does not corroborate. Worth deciding whether the band should start at 6.',
    },
  },
  mixedVenousSaturationPercent: {
    low: 68,
    high: 78,
    unit: '%',
    provenance: {
      kind: 'oracle',
      trace: 'hemorrhage-class3',
      observed: 77,
      note:
        'Sits at the very top of our band. Pulse then shows a clean extraction dose-response across ' +
        'the ladder — 77 -> 69 -> 60 -> 40 -> 21% as loss climbs — which is the strongest external ' +
        'evidence available for this quantity.',
    },
  },
  lactateMmolL: {
    low: 0,
    high: 1.5,
    unit: 'mmol/L',
    provenance: {
      kind: 'unsourced',
      needs:
        'Pulse now records it, and the answer is unhelpful in two ways. Its resting lactate is 1.60 ' +
        'mmol/L, which is above our upper bound of 1.5 — so this band currently excludes an ' +
        'independently validated healthy patient, and is tighter than the conventional 0.5-2.2 ' +
        'mmol/L. And Pulse cannot adjudicate the interesting question, because its own lactate is ' +
        'flat at every severity (1.60 -> 1.66 even at cardiovascular collapse). Settling this needs ' +
        'the clinical literature on lactate in shock, not another engine.',
    },
  },
} satisfies ReferenceRanges;
