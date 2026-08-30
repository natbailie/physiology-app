import type { ExplainerContent } from '@/shared/components/ExplainerPanel/ExplainerPanel';
import type { RenalTubularPresetName } from './engine/presets';

export const renalTubularContent: ExplainerContent<RenalTubularPresetName> = {
  title: 'How the nephron builds — and then spends — an osmotic gradient',
  sections: [
    {
      heading: 'Follow the osmolality and the logic falls out',
      paragraphs: [
        'Follow the osmolality along the tubule and the logic falls out. The proximal tubule reabsorbs about two-thirds of the filtered volume iso-osmotically: a lot of fluid disappears, but its concentration barely changes, so no concentrating work has happened yet. The descending limb is water-permeable and solute-impermeable, so it passively concentrates as water is drawn into the hypertonic medulla. Then the thick ascending limb pumps NaCl out via NKCC2 while staying water-tight, so fluid leaves it hypotonic no matter how concentrated it arrived.',
      ],
      demos: [
        { preset: 'normal', watch: 'urine osmolality' },
      ],
    },
    {
      heading: 'The ascending limb builds the gradient the rest depends on',
      paragraphs: [
        'That ascending limb does double duty, and this is the heart of countercurrent multiplication: the salt it deposits in the interstitium is what creates the medullary gradient in the first place, and the descending limb and collecting duct then both depend on that gradient. The loop is quite literally building the tool it later uses.',
      ],
      demos: [
        { preset: 'loopDiuretic', watch: 'medullary gradient' },
      ],
    },
    {
      heading: 'The collecting duct is the final, ADH-controlled step',
      paragraphs: [
        'The collecting duct is the final, ADH-controlled step. Without ADH it stays water-tight and dilute urine pours out; with ADH, aquaporin channels insert and water equilibrates with the medulla. Note the ceiling: however much ADH is present, urine can never become more concentrated than the medullary interstitium — which is why a loop diuretic, by washing out that gradient, blunts concentrating ability even when ADH is given. A thiazide acts further downstream and leaves the gradient intact, which is why it is the milder diuretic.',
      ],
      demos: [
        { preset: 'siadh', watch: 'urine osmolality' },
        { preset: 'tolvaptan', watch: 'urine output' },
      ],
    },
    {
      heading: 'A startlingly steep osmoreceptor is why plasma is so stable',
      paragraphs: [
        'The osmoreceptor is startlingly steep, and that steepness is the whole reason plasma osmolality is such a stable number. ADH release is essentially silent below threshold and already maximal a mere 18 mOsm/kg above it — a span of a few percent. Everything outside that narrow window is handled by thirst instead. It is worth appreciating what this buys: a person can drink four litres in an evening or none all day, and the osmolality the cells actually experience barely moves.',
      ],
    },
    {
      heading: 'Read the nephron as a pipeline rather than as a store',
      paragraphs: [
        'It helps to read the nephron as a pipeline rather than a store. Each segment is a pure consequence of what entered it, the current medullary gradient, and whatever hormones and drugs are acting — the tubule itself holds nothing between beats. Only the plasma, the medulla and the hormone levels carry state. That is why the whole osmolality profile can be recomputed from scratch each moment, and why following a single bolus of filtrate down the diagram tells you everything the kidney is doing to it.',
      ],
    },
    {
      heading: 'Each diuretic names its own segment',
      paragraphs: [
        'Each diuretic names its own segment, which is why the site of action IS the pharmacology. Acetazolamide blocks carbonic anhydrase proximally, so bicarbonate — whose reclaim depends on that reaction — pours out, giving a metabolic acidosis with the paradoxical combination of an alkaline urine. The loop agent blocks NKCC2 in the thick ascending limb, hitting both the medullary gradient and a quarter of filtered sodium at once. The thiazide blocks the distal cotransporter: milder, gradient-sparing. Amiloride closes ENaC itself, so potassium is spared but the lumen-negative potential that also secreted hydrogen ions goes with it — hence the mild acidosis of K+-sparing agents. Mannitol works by no transporter whatsoever: simply being unreclaimable, it obliges water to follow it out, exactly as glucose does above threshold in diabetes. And tolvaptan deafens the V2 receptor rather than arguing with ADH — a pure water diuresis (an aquaresis) with sodium untouched, which is precisely what SIADH needs.',
      ],
      demos: [
        { preset: 'acetazolamide', watch: 'bicarbonate' },
        { preset: 'thiazide', watch: 'urine sodium' },
        { preset: 'sglt2Inhibitor', watch: 'glucose' },
        { preset: 'amiloride', watch: 'potassium' },
        { preset: 'mannitol', watch: 'urine output' },
      ],
    },
    {
      heading: 'The three tubular acidoses ask one question three ways',
      paragraphs: [
        'The three renal tubular acidoses are one question asked three ways: where did acid handling break? In proximal (type 2) RTA the reclaim threshold falls until serum bicarbonate meets what the tubule can hold back — so the acidosis self-limits around 12 to 16, potassium runs low from the distal flood, and crucially the urine can still be acidified because the distal pump works. In distal (type 1) RTA that pump fails outright: daily acid simply cannot be excreted against nothing, the urine pH stays above 5.5 however acidemic the patient becomes, calcium phosphate precipitates, and stones follow. Type 4 is not a pump failure at all — it is hypoaldosteronism — so potassium rises, ammoniagenesis starves (positive urine anion gap), yet the urine still acidifies below 5.5 because H+ secreted into an unbuffered lumen crashes the local pH while carrying almost no total acid. Serum potassium, urine pH and urine anion gap between them separate all three.',
      ],
      demos: [
        { preset: 'proximalRTA', watch: 'serum bicarbonate' },
        { preset: 'distalRTA', watch: 'urine pH' },
        { preset: 'type4RTA', watch: 'potassium' },
      ],
    },
    {
      heading: 'When creatinine rises, the urine tells you why',
      paragraphs: [
        'When the creatinine rises, the urine — not the blood — tells you why. Prerenal azotaemia means intact tubules starving for flow: aldosterone-driven sodium scavenging drives FENa below 1%, urine sodium under 20, concentrated urine. Acute tubular necrosis means dead reabsorptive machinery: FENa climbs above 2%, sodium spills, and the urine drifts toward isosthenuria (~300) regardless of how much ADH circulates. Both raise the creatinine identically, because creatinine reflects filtration alone and lags by half a day — today\'s value describes yesterday\'s kidney, which is why serial creatinines and one spot urine decide between fluids and nothing-at-all.',
      ],
      demos: [
        { preset: 'preRenalAzotaemia', watch: 'FENa' },
        { preset: 'atn', watch: 'FENa' },
      ],
    },
    {
      heading: 'Two diabetes insipidus look alike and separate easily',
      paragraphs: [
        'Central and nephrogenic diabetes insipidus look identical at the bedside — dilute urine, rising plasma osmolality, unquenchable thirst — and the model shows why they are nonetheless easy to separate. In central DI, ADH is simply absent; in nephrogenic DI, ADH is maximal but the duct cannot respond. Give desmopressin and the two diverge instantly: central DI concentrates its urine sharply, nephrogenic DI barely moves. Meanwhile tubuloglomerular feedback runs quietly underneath all of this, with the macula densa sensing NaCl delivery and constricting the afferent arteriole to protect the nephron from over-filtering.',
      ],
      demos: [
        { preset: 'centralDI', watch: 'urine osmolality' },
        { preset: 'nephrogenicDI', watch: 'urine osmolality' },
      ],
    },
  ],
};
