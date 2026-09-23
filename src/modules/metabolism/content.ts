import type { ExplainerContent } from '@/shared/components/ExplainerPanel/ExplainerPanel';
import type { MetabolismPresetName } from './engine/presets';

export const metabolismContent: ExplainerContent<MetabolismPresetName> = {
  title: 'Why a starving body burns fat and a fed one burns carbohydrate',
  sections: [
    {
      heading: 'One dial — hours since a meal — drives the whole switch',
      paragraphs: [
        'The fed-to-starved transition is one continuous axis, and almost everything this module draws hangs off the time since the last meal. Just fed, insulin is high and the mix leans hard on carbohydrate. In the post-absorptive phase (roughly 4-12 hours) glycogen takes over and glucose stays defended. By 24 hours glucagon owns the day and the mix has tipped to fat. Past 36-48 hours, gluconeogenesis is guarding a glucose floor and the liver is making ketones at a rate measurable in whole mmol/L. That is why the readouts that move are the ones you might expect to stay put: the fuel percentages and the ketone level are the signals, not the glucose.',
      ],
      demos: [
        { preset: 'fed', watch: 'carbohydrate oxidation' },
        { preset: 'fasted24', watch: 'fat oxidation' },
        { preset: 'starvation', watch: 'ketones' },
      ],
    },
    {
      heading: 'The hormones are the axis read backwards',
      paragraphs: [
        'Insulin and glucagon are the same balance seen from two sides. Insulin dominates while blood glucose is high and the tissues can clear it; as glucose falls through the fast, glucagon rises and reshapes the liver: stop storing, start releasing, and when glycogen runs out start making glucose from protein and glycerol. A learner should read the two signals as one slider rather than two readings — the fed to starved journey is an insulin-to-glucagon handover, and every fuel choice below it is downstream of which hormone is holding the pen.',
      ],
      demos: [
        { preset: 'fed', watch: 'insulin signal' },
        { preset: 'starvation', watch: 'glucagon signal' },
      ],
    },
    {
      heading: 'The fuel gauge is a single pie, not three numbers',
      paragraphs: [
        'Carbohydrate, fat and protein oxidation are forced to add up to 100%, because a body is always burning something, and the interesting question is the mix. In the fed state carbohydrate wins; as the fast deepens, fat takes over; in starvation protein creeps up to feed gluconeogenesis, which is the piece most people miss — the starved state is not purely fat-burning, it quietly trades skeletal muscle for the glucose the brain still demands. The respiratory quotient is the same pie read by a spirometer: 0.7 if you are burning pure fat, 1.0 if pure carbohydrate, and a lean 0.74-0.75 deep in starvation.',
      ],
      demos: [
        { preset: 'starvation', watch: 'respiratory quotient' },
      ],
    },
    {
      heading: 'Glucose is defended, and the defense has a price',
      paragraphs: [
        'Glycogenolysis covers the first stretch of a fast; gluconeogenesis covers everything after it and never goes back to the fed level until carbohydrate returns. The visible evidence is the protein-oxidation readout climbing as the carbohydrate share collapses: a starving body keeps its glucose on a floor near 3.9 mmol/L by breaking down its own protein, which is why the same physiology reads as a weight-loss trick to some and a wasting disease to others. Ketones are the cleverer half of the answer — by the time they saturate, the brain is running partly on them, sparing muscle — but ketogenesis needs both a glucagon drive and a liver that has stopped holding glucose.',
      ],
      demos: [
        { preset: 'starvation', watch: 'blood glucose' },
        { preset: 'fasted24', watch: 'glycogen remaining' },
      ],
    },
    {
      heading: 'Insulin resistance is the model asking what happens when the dial stops turning',
      paragraphs: [
        'Raising the insulin-resistance dial leaves the fed-fasting axis untouched and changes what each point on it looks like. A resistant tissue cannot move glucose in, so the glucose curve sits higher at every hour; the carbohydrate burn is blunted because the sugar is not getting into the cells; and ketosis is suppressed because the type-2 liver still carries enough insulin tone to stop ketogenesis. That is why a diabetic does not "starve into ketosis" the way a fasting patient does, even when blood glucose is far above normal — the same number that reads as fruitful starvation in one person reads as ketoacidosis-prone hyperglycaemia in another.',
      ],
      demos: [
        { preset: 'type2Diabetes', watch: 'blood glucose' },
      ],
    },
    {
      heading: 'Catabolic stress is the bill and the muscle bill at once',
      paragraphs: [
        'The trauma, sepsis or critical-illness state does two things the fasting lever cannot: it raises the whole energy bill (the catecholamine-cortisol response can multiply resting needs by two or more), and it pushes the mix toward protein because gluconeogenesis is serving a much bigger glucose demand. An ITU patient burns muscle not because they haven\'t eaten — they are being force-fed — but because catabolic hormones override the substrate supply. The distinction matters clinically: fasting is reversible by feeding, catabolic stress is not, which is why nutrition support is protocolised and still loses ground in the sick.',
      ],
      demos: [
        { preset: 'ituCatabolic', watch: 'energy expenditure' },
      ],
    },
    {
      heading: 'What you ate sets the fed-state ceiling, not the switch',
      paragraphs: [
        'Diet composition is real but second-order: the carbohydrate, fat and protein sliders move the fed-state mix, then the fast takes over and drags every diet toward the same fat-burning endpoint. The teaching trap would be concluding the eating plan is irrelevant; the right conclusion is that nutrition sets where "fed" lives, while fasting, resistance and stress set the shape of the curve. Drag the meal clock to zero and a ketogenic breakfast still loads a fish-oil-heavy mix; drag it to 60 hours and the exact same keto breakfast has become nearly all fat oxidation — the clock is the louder instrument.',
      ],
      demos: [
        { preset: 'enduranceAthlete', watch: 'carbohydrate oxidation' },
      ],
    },
  ],
};