import type { ExplainerContent } from '@/shared/components/ExplainerPanel/ExplainerPanel';
import type { RfPresetName } from './engine/presets';

export const respiratoryFailureContent: ExplainerContent<RfPresetName> = {
  title: 'Reading a blood gas as two axes, and knowing which one is failing',
  sections: [
    {
      heading: 'The patient is a point on a map: oxygen along one axis, CO2 along the other',
      paragraphs: [
        'Every blood gas is two separate questions. The oxygen axis asks whether blood leaving the lung has been oxygenated; the CO2 axis asks whether the ventilation matched the metabolism. Plot them and a patient becomes a point on a map whose quadrants are the type of failure: low PaO2 alone is type I (hypoxaemic), high PaCO2 alone is type II (hypercapnic), both is mixed, and neither is a person breathing air. The map is not decoration — where the point sits is the diagnosis, and watching it move under your sliders is the therapy.',
      ],
      demos: [
        { preset: 'normal', watch: 'the patient point' },
        { preset: 'type1Pneumonia', watch: 'the patient point' },
      ],
    },
    {
      heading: 'Type I failure is a shunt problem: blood that skips the gas exchange',
      paragraphs: [
        'The pure oxygen problem is perfusion of unventilated lung. Pneumonia, oedema and ARDS leave some cardiac output running past collapsed or fluid-filled alveoli, so a fraction of the mixed venous blood never sees oxygen at all. Turn on the pneumonia preset and the PaO2 falls toward 56 with the CO2 still normal — because a shunt is an oxygen leak, not a ventilation failure. The footprint is the widened A-a gradient. And it explains the two treatments: raise FiO2 so the blood that DOES reach an alveolus is loaded as full as it can be, then reopen the collapsed lung with pressure so the shunt shrinks.',
      ],
      demos: [
        { preset: 'type1Pneumonia', watch: 'the A-a gradient' },
        { preset: 'type1Ards', watch: 'PaO2' },
      ],
    },
    {
      heading: 'Type II failure is a work problem: the muscles cannot move enough air',
      paragraphs: [
        'CO2 accumulates only when alveolar ventilation falls behind CO2 production. The neuromuscular preset shows how little it takes: nearly normal oxygen, because the oxygen that is supplied is handled fine — but a tired diaphragm stops clearing CO2, the PaCO2 climbs past 68, and the pH starts sliding. The lever that fixes a type II patient is ventilation, not oxygen. Give the muscle a machine doing 8 L/min and the carbon dioxide falls out of the numbers while the shunt has not entered the story. Raising FiO2 in a type II patient is the classic error; this is the module designed to make it visible.',
      ],
      demos: [
        { preset: 'type2Neuromuscular', watch: 'PaCO2' },
        { preset: 'type2Neuromuscular', watch: 'pH' },
      ],
    },
    {
      heading: 'The pH separates acute from chronic, because the kidney rewrites the bicarbonate',
      paragraphs: [
        'Two patients can share a PaCO2 of 66 and be in completely different danger. A chronically retained CO2 retainer has had days for the kidney to hold bicarbonate, so the high CO2 rides on HCO3 near 34 and the pH sits at a tolerable 7.34. Impose the same CO2 acutely and the bicarbonate collapses to 26 and the pH to 7.23 — an acidosis that exhausts and can kill. This is why the exam and the ward both read pH, not CO2: the same carbon dioxide is a chronic nuisance in one patient and an emergency in the other. The Course toggle on the left simply asks which way the hypercapnia has been running.',
      ],
      demos: [
        { preset: 'type2CopdExacerbation', watch: 'the bicarbonate' },
        { preset: 'type2CopdExacerbation', watch: 'pH' },
      ],
    },
    {
      heading: 'Oxygen and ventilation fix different axes — the mixed failure patient shows it in one move',
      paragraphs: [
        'The mixed preset loads both failures at once: a big shunt stealing oxygen (PaO2 45) and a low minute ventilation stacking CO2 (PaCO2 82). Ventilate to 8 L/min and the CO2 clears back to 36 with the pH jumping from 7.16 to 7.45, while the PaO2 sits pinned near 45 — moving air does not reconnect the shunted blood to oxygen. The two axes barely speak to each other in this model, which is exactly the clinical point: a ventilator fixes a ventilation problem, and a shunt answers only to recruitment and inspired oxygen. Treat the axis that is failing, and know which one it is.',
      ],
      demos: [
        { preset: 'mixedSevere', watch: 'PaCO2' },
        { preset: 'mixedSevere', watch: 'PaO2' },
      ],
    },
    {
      heading: 'CO2 production is the upstream number nobody adjusts on the dial',
      paragraphs: [
        'The clearance ratio has a second numerator: how much CO2 the body is actually making. Fever, sepsis, shivering and a heavy metabolic effort all raise it, and in a patient whose ventilation is already marginal the extra production simply stacks — the chronic COPD preset doubles its CO2 burden and the PaCO2 climbs toward 91 with a falling pH and even a falling PaO2 as the extra CO2 crowds the alveolar air. The management is not to sedate the problem away: it is to raise ventilation to match metabolism, and to treat the source of the demand. A rising PaCO2 in a febrile patient is often a demand problem dressed up as a clearance one.',
      ],
      demos: [
        { preset: 'type2ChronicCopd', watch: 'PaCO2' },
      ],
    },
  ],
};