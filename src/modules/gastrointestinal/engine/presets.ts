import type { GiInputs } from './types';

export const DEFAULT_GI_INPUTS: GiInputs = {
  mealFatGrams: 0,
  mealProteinGrams: 0,
  mealCarbGrams: 0,
  mealVolumeML: 0,
  ppiDose: 0,
  h2BlockerDose: 0,
  vagalTone: 100,
  autonomousGastrinSecretion: 0,
};

export type GiPresetName = 'normalMeal' | 'highFatMeal' | 'ppiTherapy' | 'gastrinoma' | 'fasting' | 'vagotomy';

export const GI_PRESETS: Record<GiPresetName, Partial<GiInputs>> = {
  normalMeal: {
    ...DEFAULT_GI_INPUTS,
    mealFatGrams: 20,
    mealProteinGrams: 25,
    mealCarbGrams: 60,
    mealVolumeML: 500,
  },
  // Fat is the dominant CCK stimulus and the strongest brake on gastric emptying — this is
  // why a fatty meal "sits" noticeably longer than an equivalent carb-heavy one.
  highFatMeal: {
    ...DEFAULT_GI_INPUTS,
    mealFatGrams: 75,
    mealProteinGrams: 20,
    mealCarbGrams: 35,
    mealVolumeML: 600,
  },
  // Blocks the H+/K+-ATPase directly: hypochlorhydria despite gastrin actually climbing
  // higher than normal, since losing the acid-mediated somatostatin brake un-suppresses it.
  ppiTherapy: {
    ...DEFAULT_GI_INPUTS,
    mealFatGrams: 20,
    mealProteinGrams: 25,
    mealCarbGrams: 60,
    mealVolumeML: 500,
    ppiDose: 100,
  },
  // Zollinger-Ellison syndrome: autonomous gastrin secretion that bypasses the somatostatin
  // brake entirely, driving acid output far above what any meal-driven response would reach.
  gastrinoma: {
    ...DEFAULT_GI_INPUTS,
    autonomousGastrinSecretion: 70,
  },
  // No meal queued — reset and leave this running to watch the migrating motor complex sweep
  // through its interdigestive cycle.
  fasting: {
    ...DEFAULT_GI_INPUTS,
  },
  // Vagal input removed: the acid response to a meal is blunted (no direct ACh drive) but not
  // abolished, since gastrin still responds to protein/distension independent of the vagus.
  vagotomy: {
    ...DEFAULT_GI_INPUTS,
    mealFatGrams: 20,
    mealProteinGrams: 25,
    mealCarbGrams: 60,
    mealVolumeML: 500,
    vagalTone: 0,
  },
};

export const GI_PRESET_LABELS: Record<GiPresetName, string> = {
  normalMeal: 'Normal meal',
  highFatMeal: 'High-fat meal',
  ppiTherapy: 'PPI therapy',
  gastrinoma: 'Gastrinoma (ZES)',
  fasting: 'Fasting',
  vagotomy: 'Vagotomy',
};

export const PRESET_ORDER: GiPresetName[] = ['normalMeal', 'highFatMeal', 'ppiTherapy', 'gastrinoma', 'fasting', 'vagotomy'];
