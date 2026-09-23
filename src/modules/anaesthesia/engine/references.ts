import type { ReferenceRanges } from '@/shared/validation/referenceRange';

/**
 * The bands this module's baseline is asserted against, and where each one comes from.
 *
 * Baseline is a settled routine maintenance anaesthetic: a 2% sevoflurane dial at 6 L/min fresh gas
 * in a normal cardiac output, read once the wash-in has equilibrated. The timescale bands are the
 * standard wash-in teaching numbers (Eger's wash-in analysis, carried through Nunn's Applied
 * Respiratory Physiology and the standard anaesthesia texts); the concentration bands are the range
 * an expired-agent monitor reads during maintenance with these settings.
 */
export const ANAESTHESIA_REFERENCE_RANGES: ReferenceRanges = {
  alveolarAgentPct: {
    low: 0.8,
    high: 2.4,
    unit: '%',
    provenance: {
      kind: 'literature',
      citation:
        'An expired (alveolar) agent monitor on a patient maintained on sevoflurane reads roughly ' +
        '1-2% — a fraction of the vaporizer dial because the circuit re-breathes a share of the gas. ' +
        'The baseline settles at ~1.1%, inside the range a monitor shows for a 2% dial on a semi-closed ' +
        'circle (Nunn\'s Applied Respiratory Physiology, volatile anaesthetic wash-in chapter).',
    },
  },
  effectSiteAgentPct: {
    low: 0.8,
    high: 2.4,
    unit: '%',
    provenance: {
      kind: 'literature',
      citation:
        'The effect site equilibrates with the alveolar concentration during maintenance, so the ' +
        'brain level tracks the expired reading the monitor shows — a settled sevoflurane patient at ' +
        'roughly 1 MAC reads about 1-2% in both compartments (Eger EI. Anesthetic Uptake and Action).',
    },
  },
  timeTo90PctMinutes: {
    low: 2,
    high: 8,
    unit: 'min',
    provenance: {
      kind: 'literature',
      citation:
        'Wash-in teaching: sevoflurane at moderate flows reaches about 90% of its equilibrated ' +
        'alveolar fraction in roughly three to five minutes, desflurane faster and halothane markedly ' +
        'slower because the blood partition coefficient charges a bigger sink (Eger\'s wash-in curves; ' +
        'the "FA/FI time constant" discussion in Miller\'s Anesthesia). The baseline lands at ~4.7 min.',
    },
  },
  washInProgress: {
    low: 0.7,
    high: 1,
    unit: 'ratio',
    provenance: {
      kind: 'literature',
      citation:
        'Once the wash-in has equilibrated, the alveolar level sits at or just under its steady-state ' +
        'ceiling — the FA/FI ratio tends toward unity and is read as "equilibrated" from about 0.9 ' +
        'upward. The settled baseline (0.91) is that equilibrated reading, not halfway through wash-in.',
    },
  },
  inspiredFractionPct: {
    low: 0.6,
    high: 2,
    unit: '%',
    provenance: {
      kind: 'literature',
      citation:
        'The effective inspired fraction delivered at the Y-piece is the dialed concentration times ' +
        'the fresh-gas share of the circuit flow — a semi-closed circle with 6 L/min fresh gas ' +
        're-breathes enough to deliver roughly two-thirds of the dial, so a 2% dial reads about 1.3% ' +
        'at the patient (standard circle-breathing-system analysis in Nunn\'s Applied Respiratory Physiology).',
    },
  },
  inspiredToDialRatio: {
    low: 0.5,
    high: 0.85,
    unit: 'ratio',
    provenance: {
      kind: 'literature',
      citation:
        'The inspired fraction never equals the dial on a semi-closed circle: it is dialed ' +
        'concentration times the fresh-gas share of the total circuit flow, the FGF/(FGF+rebreathing) ' +
        'dilution written out in every circle-system analysis. At 6 L/min against a ~3.5 L/min ' +
        'rebreathing share that share is about 0.6, which is what the baseline reads (Nunn\'s Applied ' +
        'Respiratory Physiology; Miller\'s Anesthesia, circle-system and gas-delivery chapters).',
    },
  },
  timeTo50PctMinutes: {
    low: 1,
    high: 4,
    unit: 'min',
    provenance: {
      kind: 'literature',
      citation:
        'Wash-in teaching: FA/FI reaches 0.5 after roughly one circuit-plus-lung time constant, which ' +
        'for sevoflurane at moderate flows is about one and a half to two minutes — the mid-point of ' +
        'the rising curve is the half-life of induction, and the baseline lands at ~1.7 min (Eger\'s ' +
        'time-constant analysis in Anesthetic Uptake and Action and Nunn\'s Applied Respiratory Physiology).',
    },
  },
  absorptionIndex: {
    low: 1.5,
    high: 5.5,
    unit: 'index',
    provenance: {
      kind: 'unsourced',
      needs:
        'A published experimental relation tying partition coefficient, cardiac output and alveolar ' +
        'concentration to the actual volume of liquid volatile taken up per minute would anchor these ' +
        'units to ml/min rather than an index; up to then the "solubility × flow × level" composite is ' +
        'shown as a unitless index that still ranks agents and patients correctly.',
    },
  },
};