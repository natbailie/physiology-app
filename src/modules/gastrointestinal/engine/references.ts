import type { ReferenceRanges } from '@/shared/validation/referenceRange';

/**
 * The bands this module's baseline is asserted against, and where each one comes from.
 *
 * A fasting adult stomach and duodenum between meals.
 *
 * The two pH values were asserted against the engine's own GASTRIC_PH and DUODENAL_PH constants,
 * which passes by construction. They are published values now.
 */
export const GI_REFERENCE_RANGES: ReferenceRanges = {
  gastricPH: {
    low: 1.0,
    high: 4.0,
    unit: 'pH',
    provenance: {
      kind: 'literature',
      citation:
        'Fasting gastric pH is 1.5-3.5. A pH above 4 for enough of the day is the pharmacodynamic ' +
        'target of acid suppression in reflux disease.',
      note:
        'Was asserted against GASTRIC_PH.BASELINE — the engine compared to itself. Ours settles ' +
        'at 3.57, at the alkaline end of the fasting band; worth deciding whether the default ' +
        'vagal tone represents a truly fasting stomach.',
    },
  },
  duodenalPH: {
    low: 5.5,
    high: 7.5,
    unit: 'pH',
    provenance: {
      kind: 'literature',
      citation:
        'Duodenal pH 6-7 once pancreatic bicarbonate has neutralised gastric acid; pancreatic ' +
        'lipase is inactivated below about pH 4, which is why bicarbonate delivery matters for ' +
        'fat digestion.',
    },
  },
  motilinPhase: {
    low: 0.0,
    high: 1.0,
    unit: 'phase',
    provenance: {
      kind: 'literature',
      citation:
        'The migrating motor complex cycles about every 90-120 minutes in the fasting gut and is ' +
        'abolished by eating. Its phase III is the "housekeeper" sweep.',
    },
  },
  gastricAcidOutput: {
    low: 0.0,
    high: 60.0,
    unit: 'index',
    provenance: {
      kind: 'unsourced',
      needs:
        'Acid output is measurable and published: basal acid output is about 2-5 mmol H+/hour and ' +
        'maximal (pentagastrin-stimulated) about 20-25, with the BAO/MAO ratio raised above 0.6 ' +
        'in Zollinger-Ellison syndrome. On this index that diagnostic ratio cannot be computed.',
    },
  },
};
