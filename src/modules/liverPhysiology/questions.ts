import type { ModuleQuestion, PanelField } from '@/shared/assessment/types';
import type { LiverDerived, LiverInputs, LiverInternalState } from './engine/types';
import type { LiverPresetName } from './engine/presets';
import { perturbHaemolyticEpisode, perturbStentObstruction } from './engine/engine';

type Snapshot = { state: LiverInternalState; derived: LiverDerived };
export type LiverQuestion = ModuleQuestion<LiverInputs, LiverPresetName, Snapshot>;

const PANEL: readonly PanelField<Snapshot>[] = [
  { label: 'Total bilirubin', unit: 'µmol/L', value: (s) => s.derived.totalBilirubinUmolL, decimals: 0 },
  {
    label: 'Conjugated fraction',
    unit: '%',
    value: (s) => s.derived.fractionConjugatedPct,
    decimals: 0,
    tolerance: 0.2,
  },
  {
    label: 'Urine bilirubin',
    value: (s) => (s.derived.urineBilirubinPresent ? 1 : 0),
    decimals: 0,
    tolerance: 0.5,
  },
  {
    label: 'Urine urobilinogen',
    unit: '% of normal',
    value: (s) => s.derived.urineUrobilinogenIndex,
    decimals: 0,
    tolerance: 0.35,
  },
  { label: 'ALT', unit: '× ULN', value: (s) => s.derived.altXUlN, decimals: 1, tolerance: 0.3 },
  { label: 'ALP', unit: '× ULN', value: (s) => s.derived.alpXUlN, decimals: 1, tolerance: 0.3 },
];

const SETTLE = 200000;

export const LIVER_QUESTIONS: readonly LiverQuestion[] = [
  {
    id: 'gilbert-fasting-jaundice',
    stem: 'A medical student notices mild yellowing of his eyes during exam-stress fasting. It resolves when he resumes eating. His bloods otherwise normal.',
    answer: 'gilbert',
    options: ['gilbert', 'haemolyticAnaemia', 'acuteHepatitisA', 'choledocholithiasis'],
    panel: PANEL,
    settleSeconds: SETTLE,
    explanation:
      'Mild unconjugated jaundice with completely normal enzymes and no bilirubinuria is Gilbert syndrome — a reduced UGT capacity that hides until fasting, illness or exertion raises the load. The conjugated fraction stays low, urobilinogen is normal, and nothing is damaged. It matters clinically almost entirely so that it is not mistaken for something else: no treatment, no monitoring, no restrictions.',
  },
  {
    id: 'haemolytic-dark-urine-free',
    stem: 'A patient with hereditary spherocytosis presents during a haemolytic crisis: visibly yellow, urine dipstick negative for bilirubin, and no abdominal pain.',
    answer: 'haemolyticAnaemia',
    options: ['haemolyticAnaemia', 'choledocholithiasis', 'gilbert', 'alcoholicCirrhosis'],
    panel: PANEL,
    settleSeconds: SETTLE,
    explanation:
      'Jaundice with a negative bilirubin dipstick localises the problem upstream of the liver: unconjugated bilirubin is albumin-bound and simply cannot reach the urine. The liver copes by upregulating excretion, so conjugated levels stay low while urobilinogen floods through — the one pattern where high turnover reads as high urinary urobilinogen. The gallstone preset produces deep jaundice too, but its urine is inky and its stool pale.',
  },
  {
    id: 'obstructive-quartet',
    stem: 'A woman in her sixties presents with colicky right-upper-quadrant pain, dark urine, pale stools and a positive bilirubin dipstick. ALT is near normal.',
    answer: 'choledocholithiasis',
    options: ['choledocholithiasis', 'haemolyticAnaemia', 'gilbert', 'acuteHepatitisA'],
    panel: PANEL,
    settleSeconds: SETTLE,
    explanation:
      'Conjugated-predominant jaundice with bilirubinuria, absent urobilinogen and pale stools means bile cannot leave the liver — the pigment has nowhere to go but backwards into blood and urine. ALP rises because biliary epithelium responds to pressure, while ALT stays quiet because hepatocytes are unharmed. Pain points to a stone rather than a painless stricture or head-of-pancreas tumour, which can produce an identical chart silently.',
  },
  {
    id: 'hepatitis-mixed-pigments',
    stem: 'A young traveller returns with malaise, right-upper-quadrant tenderness and deepening jaundice. His urine turns dark but his stools are normal colour.',
    answer: 'acuteHepatitisA',
    options: ['acuteHepatitisA', 'choledocholithiasis', 'haemolyticAnaemia', 'gilbert'],
    panel: PANEL,
    settleSeconds: SETTLE,
    explanation:
      'ALT in the stratosphere makes this hepatocellular — and note both pigments are raised with bilirubinuria, because dying hepatocytes leak freshly conjugated bilirubin straight back into plasma. Stools keep some colour because the ducts are open, which separates him from obstruction despite the dark urine. The R-factor does the sorting mechanically: transaminase-dominant injury always outranks whatever the ALP is doing.',
  },
  {
    id: 'stent-drains-the-system',
    stem: 'The same patient with a stone in the common bile duct undergoes ERCP and stenting.',
    setup: { preset: 'choledocholithiasis' },
    intervention: { label: 'Stent placed across the obstruction.', perturb: (state) => perturbStentObstruction(state) },
    prompt: 'What happens to plasma conjugated bilirubin?',
    watch: 'conjugated bilirubin',
    correctDirection: 'falls',
    settleSeconds: 150000,
    observeSeconds: 80000,
    tolerance: 0.03,
    explanation:
      'It falls — drainage is restored, so secretion outruns formation and the pool clears partly down the reopened duct and partly renally. Watch stool colour return with it: pigment reaching the gut again. The clinical corollary is that post-obstructive complications run on the same timeline — fat-soluble vitamin depletion and cholangitis risk track how long the system stayed blocked, not just how yellow the patient looked.',
    metric: (s) => s.derived.conjugatedUmolL,
  },
  {
    id: 'haemolytic-surge-urobilinogen',
    stem: 'A patient with compensated anaemia is hit by an acute haemolytic episode.',
    setup: { preset: 'normal', inputs: { haemolysisMultiplier: 1 } },
    intervention: { label: 'Haemolytic episode begins.', perturb: (state) => perturbHaemolyticEpisode(state) },
    prompt: 'What happens to urinary urobilinogen?',
    watch: 'urobilinogen',
    correctDirection: 'rises',
    settleSeconds: 60000,
    observeSeconds: 3000,
    explanation:
      'It rises — more haemoglobin breakdown sends more bilirubin down an open bile pathway, where gut flora convert the surplus into urobilinogen, part of which reabsorbs and reaches urine. This is the earliest laboratory hint of haemolysis, appearing before the reticulocyte peak. Note what does not happen: no bilirubinuria, because none of the surplus is conjugated unless the liver saturates.',
    metric: (s) => s.derived.urineUrobilinogenIndex,
  },
];
