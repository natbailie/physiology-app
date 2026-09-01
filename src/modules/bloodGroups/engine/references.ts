import type { ReferenceRanges } from '@/shared/validation/referenceRange';

/**
 * The bands this module's baseline is asserted against, and where each one comes from.
 *
 * A compatible pairing before any transfusion, and an unsensitised pregnancy.
 *
 * The fetal values are the anchored ones; the reaction severity scales are not, and say so.
 */
export const BLOOD_GROUP_REFERENCE_RANGES: ReferenceRanges = {
  fetalHaemoglobinGDl: {
    low: 13.0,
    high: 20.0,
    unit: 'g/dL',
    provenance: {
      kind: 'literature',
      citation:
        'Term cord haemoglobin 14-22 g/dL, higher than adult because fetal life is hypoxic by ' +
        'adult standards and fetal haemoglobin binds oxygen more avidly.',
    },
  },
  cordBilirubinUmolL: {
    low: 0.0,
    high: 40.0,
    unit: 'umol/L',
    provenance: {
      kind: 'literature',
      citation:
        'Cord bilirubin is normally below about 35 umol/L; above it predicts significant ' +
        'haemolytic disease of the newborn and is one of the triggers for exchange transfusion.',
    },
  },
  haemolyticSeverity: {
    low: 0.0,
    high: 0.05,
    unit: 'index',
    provenance: {
      kind: 'unsourced',
      needs:
        'Haemolytic severity, DIC risk and shock index are 0-100 scales. The published ' +
        'quantitative frame for haemolytic disease of the newborn is the Liley or Queenan ' +
        'amniotic delta-OD450 chart, which is read as zones against gestational age; nothing on ' +
        'this scale can be plotted on it.',
    },
  },
  nextPregnancySensitisationRiskPct: {
    low: 0.0,
    high: 20.0,
    unit: '%',
    provenance: {
      kind: 'literature',
      citation:
        'About 16% of RhD-negative women delivering an RhD-positive infant become sensitised ' +
        'without prophylaxis; anti-D immunoglobulin reduces that to well under 1%. That ' +
        'difference is the entire justification for the programme.',
    },
  },
};
