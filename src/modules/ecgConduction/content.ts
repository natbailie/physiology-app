import type { ExplainerContent } from '@/shared/components/ExplainerPanel/ExplainerPanel';
import type { EcgPresetName } from './engine/presets';

export const ecgConductionContent: ExplainerContent<EcgPresetName> = {
  title: 'Every deflection is a wavefront pointing somewhere',
  sections: [
    {
      heading: 'A lead records one number, and its sign is a direction',
      paragraphs: [
        'An ECG lead records one number: how much of the heart\'s instantaneous electrical vector points along that lead\'s axis. A wavefront travelling toward the positive electrode writes upward, one travelling away writes downward, and one travelling at right angles writes nothing. The trace here is not drawn — it is computed by summing the dipoles of every region that is currently depolarising or repolarising and projecting that sum onto the lead you have selected, which is why the heart diagram and the trace stay exactly in step.',
      ],
      demos: [
        { preset: 'normalSinus', watch: 'the trace' },
      ],
    },
    {
      heading: 'The flat bits are the parts most often misread',
      paragraphs: [
        'That immediately explains the flat bits, which are the parts students most often misread. The PR segment is isoelectric not because nothing is happening — the AV node is conducting hard — but because the node holds far too little tissue to register at the body surface. The ST segment is isoelectric because by then the whole ventricle is uniformly depolarised, so there is no potential difference anywhere to record. Flat line means no net vector, never no activity.',
      ],
      demos: [
        { preset: 'firstDegreeBlock', watch: 'PR interval' },
        { preset: 'completeHeartBlock', watch: 'P wave relation' },
      ],
    },
    {
      heading: 'The T wave is upright because two sign flips cancel',
      paragraphs: [
        'The T wave is the elegant one. Repolarisation is the reverse process, so its current reverses — one sign flip. But the epicardium has a shorter action potential than the endocardium, so it repolarises first and the wavefront travels epicardium-to-endocardium, opposite to the way depolarisation travelled — a second flip. Two flips cancel, so the T wave points the same way as the QRS. That is why a normal T wave is concordant with the QRS in nearly every lead, and it is the reason repolarisation does not simply undo the QRS on paper.',
      ],
    },
    {
      heading: 'The QT is rate-dependent for a physiological reason',
      paragraphs: [
        'The QT interval is rate-dependent for a physiological reason, not a measurement one. Action potential duration genuinely shortens as heart rate rises — the tissue repolarises faster when it is being driven harder — so a raw QT taken at 100 bpm is not comparable to one taken at 50. Bazett\'s correction exists to undo exactly that, which is why the corrected value is the one that carries meaning. Because the model shortens the action potential with rate rather than simply scaling the trace, the QTc here stays stable while the raw QT moves, which is the behaviour the correction is designed to produce.',
      ],
      demos: [
        { preset: 'longQt', watch: 'QTc' },
        { preset: 'torsades', watch: 'rhythm' },
      ],
    },
    {
      heading: 'Hyperkalaemia is three simultaneous effects, not one sign',
      paragraphs: [
        'Hyperkalaemia is worth watching as three simultaneous effects rather than one sign. Rising potassium peaks the T waves by increasing the amplitude of repolarisation, slows conduction through myocardium so the QRS widens, and depresses atrial excitability until the P wave flattens and eventually disappears. They appear in that rough order as the level climbs, which is why a peaked T is an early warning and a wide QRS without a P is an emergency. Note also what the atria do normally: they have no repolarisation gradient, so unlike the ventricle their Ta wave genuinely does reverse — it is simply small and buried inside the QRS where you never see it.',
      ],
      demos: [
        { preset: 'hyperkalemia', watch: 'QRS width' },
      ],
    },
    {
      heading: 'Six leads are blind to front and back',
      paragraphs: [
        'Six leads are not enough, and the reason is geometric rather than clinical. The limb leads all lie in the frontal plane, so between them they can only measure how far the vector points up, down, left or right — they are completely blind to how far it points forward or back. Two infarcts on opposite walls of the heart can therefore look identical, or look like nothing, in all six. The chest leads wrap round the front of the thorax to sample that missing axis, and the two reference circles beside the heart show the same instantaneous vector casting its shadow on the two planes at once.',
      ],
    },
    {
      heading: 'R-wave progression is a property of the sequence, not a lead',
      paragraphs: [
        'R-wave progression is the single most useful thing the precordium shows, and it is not a property of any one lead. The septum depolarises left to right and sits anteriorly, so its wavefront points at V1 and away from V6 — a small r in V1, a small q in V6, from one and the same event. Then the far more massive left ventricle depolarises leftward and posteriorly, pointing away from V1 and straight at V6. So the complex starts small-and-positive over the right side and ends tall-and-positive over the left, crossing over somewhere in the middle. That crossover is the transition, it normally sits at V3 or V4, and here it emerges from the activation sequence rather than being drawn.',
      ],
    },
    {
      heading: 'A bundle branch block signs itself in the chest leads',
      paragraphs: [
        'A bundle branch block signs itself in the chest leads for the same reason. The right ventricle is the most anterior chamber, so activating it LATE sends a delayed wavefront straight at V1 and produces the terminal positive deflection of the RSR pattern; the same late force points away from V6, giving the wide terminal S there. Left bundle branch block does the mirror image, delaying the large posterior left ventricle so V6 becomes a broad monophasic R and the transition is pushed later across the precordium. Neither pattern is drawn in the model — switch the presets and watch both fall out of which territory was activated last.',
      ],
      demos: [
        { preset: 'rbbb', watch: 'V1' },
        { preset: 'lbbb', watch: 'V1' },
      ],
    },
    {
      heading: 'Separate the arrhythmias by who is driving',
      paragraphs: [
        'The arrhythmias are worth separating by who is driving, because that one question generates every finding. In atrial flutter a single re-entry circuit drives the atria at a fixed 300 per minute, and since the circuit captures the atrium uniformly its sawtooth waves are far larger than fibrillation\'s chaos; the AV node cannot keep up, so it filters to a regular fraction — classically 2:1, which is why an utterly regular tachycardia at 150 should be called flutter until disproved. Fibrillation is the same organ without discipline: no organised atrial activity at all, and an AV node receiving hundreds of chaotic impulses a minute produces the irregularly irregular response. In both, the ventricles obey whoever arrives; in ventricular tachycardia the tables turn — a ventricular focus paces at 180 or more while the sinus node marches on unnoticed behind it, and because the focus activates muscle cell to cell rather than down the His-Purkinje system the QRS is wide.',
      ],
      demos: [
        { preset: 'atrialFlutter', watch: 'atrial rate' },
        { preset: 'atrialFibrillation', watch: 'rhythm' },
        { preset: 'sickSinus', watch: 'rate' },
        { preset: 'ventricularTachycardia', watch: 'QRS width' },
        { preset: 'ventricularFibrillation', watch: 'rhythm' },
      ],
    },
    {
      heading: 'Two rhythms reward closer attention',
      paragraphs: [
        'Two rhythms reward closer attention. Wolff-Parkinson-White exists because an accessory pathway skips the AV node\'s protective delay: part of the ventricle is excited early and slowly, shortening PR below 120 ms and slurring the QRS onset into a delta wave — harmless in sinus rhythm, lethal if atrial fibrillation arrives and conducts down the pathway. Torsades de pointes is polymorphic VT on a long-QT substrate: after-depolarisations fire during prolonged repolarisation, and the mean axis visibly rotates round the baseline so each lead watches the complexes swell, flatten and invert in turn. Treat the QT — magnesium and stop the drugs — not just the rhythm. And sick sinus syndrome is the opposite problem: the SA node fails intermittently, pauses open up, and junctional escape beats fill them at their own slow rate. The escapes are the patient\'s friend; suppressing them before a pacemaker is in place is how dizziness becomes syncope.',
      ],
      demos: [
        { preset: 'wpw', watch: 'PR interval' },
      ],
    },
    {
      heading: 'Localising an infarct is the same projection twelve times',
      paragraphs: [
        'Localising an infarct is the same projection applied twelve times. The injury current is a vector pointing at the damaged wall, so leads facing it record elevation and leads facing the other way record depression, which is all a reciprocal change ever is. An inferior injury elevates II, III and aVF while depressing aVL and barely troubling the chest leads; an anterior injury does the opposite, dominating V2 to V4 while the limb leads stay almost silent. Posterior injury is the one worth dwelling on: no electrode faces the back of the heart, so it elevates nothing at all and appears only as its mirror image — ST depression across V1 to V3. It is the commonest infarct to miss, and the reason is that the leads that would show it do not exist.',
      ],
      demos: [
        { preset: 'inferiorStemi', watch: 'ST segment' },
        { preset: 'anteriorStemi', watch: 'ST segment' },
        { preset: 'posteriorMi', watch: 'ST segment' },
      ],
    },
    {
      heading: 'Switching leads changes your viewing angle, nothing else',
      paragraphs: [
        'Switching leads changes nothing about the heart, only your viewing angle — watch the intervals stay identical while the shape transforms. aVR is inverted in a perfectly healthy person because it looks from −150°, nearly opposite the normal mean axis of about +60°; an upright aVR should make you suspect the limb leads are reversed. The same geometry produces reciprocal change: set an inferior injury and the ST elevates in II, III and aVF while simultaneously depressing in aVL, because the identical injury vector projects positively onto one axis and negatively onto the other. Then try a bundle branch block to widen the QRS, complete block to watch the P waves march independently through an escape rhythm, and hyperkalemia to peak the T waves. Use the twelve-lead grid for anything that is a comparison between leads, and the single strip for anything that is a comparison across time.',
      ],
    },
  ],
};
