import type { PredictQuestion } from '@/shared/assessment/types';
import type { MvDerived, MvInputs, MvState } from './engine/types';
import type { MvPresetName } from './engine/presets';

type Snapshot = { state: MvState; derived: MvDerived };
export type MvQuestion = PredictQuestion<MvInputs, MvPresetName, Snapshot>;

export const MV_QUESTIONS: readonly MvQuestion[] = [
  {
    id: 'cpap-splints-collapse',
    stem: 'A patient with obstructive sleep apnoea and daytime hypercapnia has a floppy pharynx that collapses on inspiration. They are on low CPAP.',
    setup: { preset: 'osaHypoventilation' },
    intervention: { label: 'EPAP is raised from 4 to 10 cmH2O.', inputs: { epapPeepCmH2O: 10 } },
    prompt: 'What happens to tidal volume?',
    watch: 'the tidal volume',
    correctDirection: 'rises',
    explanation:
      'The positive pressure does not breathe for the patient — it simply stents the floppy airway apart, so the patient\'s own inspiratory effort no longer collapses it. Tidal volume climbs the moment the splinting pressure clears the collapse threshold. Nothing else about the lung changed: no compliance was added, no muscle strength appeared, just the airway kept open. That is why CPAP is the treatment for obstructive hypoventilation, and why raising EPAP further past the splinting threshold buys nothing — an airway already open is not more open with more pressure.',
    metric: (s) => s.derived.tidalVolumeML,
  },
  {
    id: 'peep-recruits-ards',
    stem: 'A patient with ARDS has dense, wet, collapsed lung and a large right-to-left shunt. Their lungs are recruitable.',
    setup: { preset: 'ards' },
    intervention: { label: 'PEEP is raised from 3 to 10 cmH2O.', inputs: { epapPeepCmH2O: 10 } },
    prompt: 'What happens to the effective shunt?',
    watch: 'the effective shunt',
    correctDirection: 'falls',
    explanation:
      'PEEP pushes the collapsed, fluid-filled alveoli back open and reconnects them to gas, so the fraction of cardiac output flowing past lung that is not ventilated falls. Recruitment does not remove the oxygen problem by magic — it removes the unit that was generating it. Note the lever, though: recruitability. A recruitable ARDS lung responds dramatically to PEEP; an emphysema lung with nothing to reopen does not, and there PEEP merely raises intrathoracic pressure and loads the heart.',
    metric: (s) => s.derived.effectiveShuntFraction,
  },
  {
    id: 'niv-leak-limits-support',
    stem: 'A patient with weak respiratory muscles is invasively ventilated and doing well on a set inspiratory pressure.',
    setup: { preset: 'neuromuscular' },
    intervention: { label: 'The tube is removed and the same pressure moved to a NIV mask.', inputs: { mode: 'niv' } },
    prompt: 'What happens to the delivered tidal volume?',
    watch: 'the tidal volume',
    correctDirection: 'falls',
    explanation:
      'The leak around a mask makes non-invasive pressure ventilation blunt: a measurable fraction of the inspiratory pressure escapes around the seal instead of entering the lung, so the delivered tidal volume drops. This is the classic argument in neuromuscular disease — exactly the patient whose muscles are too weak to compensate for the lost volume. The mode was not a free choice; it was a price, paid in tidal volume, and it is why marginal respiratory drive is a relative indication for intubation rather than a reason to avoid it.',
    metric: (s) => s.derived.tidalVolumeML,
  },
  {
    id: 'fast-rate-traps-air',
    stem: 'A patient with COPD is on NIV with a long expiratory time constant. Their back-up rate is increased in an attempt to clear CO2.',
    setup: { preset: 'copd' },
    intervention: { label: 'The back-up rate is raised from 18 to 35/min.', inputs: { ventRatePerMin: 35 } },
    prompt: 'What happens to total PEEP (including auto-PEEP)?',
    watch: 'the total PEEP',
    correctDirection: 'rises',
    explanation:
      'Faster breaths shorten the expiratory time, and an obstructed lung needs roughly three time constants to empty. The lung no longer finishes before the next breath begins, more gas stacks up at end-expiration, and the auto-PEEP it exerts adds to whatever the dial is set to. The learner\'s instinct to speed up a ventilated COPD patient is exactly backwards: ventilation improved only if the extra air also has time to escape. Slowing the rate and lengthening expiration is what actually relieves trapping.',
    metric: (s) => s.derived.totalPeepCmH2O,
  },
  {
    id: 'fiO2-does-not-clear-co2',
    stem: 'A hypoventilating patient with COPD is admitted with a high PaCO2. Their inspired oxygen is raised to 100% to "treat" it.',
    setup: { preset: 'copd' },
    intervention: { label: 'Inspired oxygen is raised from 28% to 100%.', inputs: { fiO2: 1 } },
    prompt: 'What happens to PaCO2?',
    watch: 'the PaCO2',
    correctDirection: 'unchanged',
    explanation:
      'Oxygen changes the inspired gas, not the ventilation. PaCO2 is set by how much CO2 is produced and how much alveolar ventilation clears it; raising FiO2 does not move air and cannot wash out CO2. It can raise PaO2 (and thereby blunts the hypoxic respiratory drive, worth remembering in a CO2 retainer), but the hypercapnia itself is a ventilation problem — the treatment is support for the muscles, not more oxygen. Controlled low-flow oxygen keeps a retainer alive long enough for the ventilation to be fixed.',
    metric: (s) => s.derived.paCO2,
  },
  {
    id: 'chronic-compensation-raises-bicarb',
    stem: 'A patient with COPD and chronically elevated PaCO2 is compared with a patient who has the same high PaCO2 but acutey. The kidney has had days in one and not the other.',
    setup: { preset: 'copd' },
    intervention: { label: 'The same hypercapnia is imposed acutely, with no renal compensation.', inputs: { chronicKidneyCompensation: 0 } },
    prompt: 'What happens to plasma bicarbonate?',
    watch: 'the bicarbonate',
    correctDirection: 'falls',
    explanation:
      'In chronic hypercapnia the kidney retains bicarbonate during the days of compensation, so the same PaCO2 rides on a higher plasma HCO3 — and the pH therefore stays far closer to normal. Taking that compensation away collapses the bicarbonate back toward 24, and the pH stops being protected: a PaCO2 of 87 is an acute severe acidosis if it appears suddenly, and a tolerable chronic state if the bicarbonate has had time to catch up. The pH, not the CO2, is what tells you which patient you are treating.',
    metric: (s) => s.derived.plasmaHCO3,
  },
];