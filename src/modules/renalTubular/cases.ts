import type { ModuleCase } from '@/shared/cases/types';
import type { RenalTubularPresetName } from './engine/presets';
import { AKI_PANEL, type RenalTubularSnapshot } from './panel';

export type RenalTubularCase = ModuleCase<RenalTubularPresetName, RenalTubularSnapshot>;

/**
 * Two beds, one creatinine between them.
 *
 * They were chosen to be the pair that looks identical in the blood and opposite in the
 * urine — which is the whole reason the AKI panel exists, and the reason the module's own
 * preset comments read like case notes already. Nothing here is new physiology; what is new
 * is that the numbers belong to somebody, which is the difference between reading a panel
 * and deciding what to do next.
 *
 * Observations are absent on purpose. `chart` points at `AKI_PANEL`, so the five rows are read
 * off the settled engine at the bedside and checked against it in `cases.test.ts`.
 */
export const RENAL_TUBULAR_CASES: readonly RenalTubularCase[] = [
  {
    id: 'harold-prerenal',
    bed: 'C01',
    name: 'Harold',
    age: 74,
    oneLiner: 'Day-one post-laparotomy, hypotensive overnight, urine output falling',
    presentation:
      'Emergency laparotomy yesterday for a perforated ulcer, and overnight his pressure has sagged to a MAP in the low 60s despite two litres of crystalloid. He has passed 80 mL of dark urine in the last six hours, and the morning creatinine is 2.4 where admission said 1.0. The surgical team are asking whether this kidney failure needs a nephrologist or simply more volume, and the urine sample for the panel below was sent before anyone gave anything further.',
    preset: 'preRenalAzotaemia',
    chart: AKI_PANEL,
    task: 'Decide whether this kidney is failing or merely starving.',
    teaching:
      'FENa under 1% with urine sodium below 20 and concentrated urine: an intact, aldosterone-driven nephron is scavenging every millimole it can while the glomerulus starves — prerenal azotaemia, and the right treatment is volume and pressure, not a referral. The creatinine looks alarming but it lags by hours and reflects filtration alone; it cannot tell a starving kidney from a dead one, which is why the urine was sent. Note what diuretics would do here: strip the very compensation that is keeping him out of trouble. Contrast Vera in the next bed, whose identical creatinine comes with the opposite urine.',
    questionIds: ['aki-urine-differentiation'],
  },
  {
    id: 'vera-atn',
    bed: 'C02',
    name: 'Vera',
    age: 68,
    oneLiner: 'Creatinine 2.3 and climbing after prolonged hypotension',
    presentation:
      'Admitted with a bleeding ulcer that kept her hypotensive for the best part of a day before endoscopy caught it, on top of three days of gentamicin for a urinary infection. Her pressure is acceptable now and she is making some urine, but the creatinine has climbed from 1.1 to 2.3 and keeps going. The registrar suggests pushing more fluid to "flush the kidneys through", and her daughter wants to know whether the kidneys will recover.',
    preset: 'atn',
    chart: AKI_PANEL,
    task: 'Say why another litre of saline will not rescue this kidney.',
    teaching:
      'FENa above 2% into an isosthenuric urine: the tubules are dead and shedding the sodium a working nephron would reclaim, so the identical creatinine Harold carries next door means the opposite thing here. Fluids resuscitate perfusion, not epithelium — no amount of volume brings dead tubular cells back, and overfilling an oliguric patient drowns the lungs while the kidney takes days to regrow what was lost. Stop the nephrotoxin, support the perfusion, watch the potassium, and wait. When the question is perfusion versus injury, the urine answers and the blood does not.',
    questionIds: ['atn-wastes-sodium'],
  },
];
