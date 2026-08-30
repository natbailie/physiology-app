import type { ExplainerContent } from '@/shared/components/ExplainerPanel/ExplainerPanel';
import type { CoronaryPresetName } from './engine/presets';

export const coronaryCirculationContent: ExplainerContent<CoronaryPresetName> = {
  title: 'Supply, demand, and the reserve in between',
  sections: [
    {
      heading: 'The heart squeezes shut the arteries that feed it',
      paragraphs: [
        'The myocardium is in the awkward position of pumping the very arteries that feed it. During systole the muscle squeezes shut its own intramyocardial vessels, so the left ventricle is perfused almost entirely during diastole — against a driving column that is not the aortic pressure but what is left of it after subtracting the pressure inside the wall itself. That is why this module keeps two clocks on every scenario: how much oxygen the muscle is asking for, and how big the diastolic window is for delivering it.',
      ],
      demos: [
        { preset: 'normal', watch: 'diastolic perfusion time' },
      ],
    },
    {
      heading: 'Tachycardia raises demand and shortens supply at once',
      paragraphs: [
        'Tachycardia hurts twice. Every beat raises demand through the rate-pressure product, and every beat shortens diastole — at 72 bpm about three quarters of the cycle is perfusion time; at 160 barely half is. Load the tachycardic preset and watch both effects arrive together in a heart that could have tolerated either alone. This double action is also exactly why beta-blockade works: slowing the rate lowers demand and hands the coronaries back their window.',
      ],
      demos: [
        { preset: 'tachycardicDanger', watch: 'flow reserve' },
      ],
    },
    {
      heading: 'A stenosis is silent until the reserve it spent runs out',
      paragraphs: [
        'A stenosis is silent until it is not. Because the microvasculature can dilate to four or five times its resting conductance, an 85% narrowing can sit at rest with perfectly normal flow — but it has spent nearly all of its vasodilatory reserve buying that normality. The flow-reserve readout tells you which patient you are looking at: the resting numbers of stable angina and of the healthy heart can be identical while one climb of the stairs separates them. Exert the stable-angina preset and watch demand overtake a supply line that has nothing left to recruit.',
      ],
      demos: [
        { preset: 'stableAngina', watch: 'flow reserve' },
        { preset: 'criticalStenosis', watch: 'flow reserve' },
      ],
    },
    {
      heading: 'Where the balance breaks decides what you see',
      paragraphs: [
        'Where the balance breaks decides what you see. Demand outstripping a limited supply starves the subendocardium first — the inner layer endures the greatest wall stress and the deepest systolic compression — and produces diffuse ST depression. An occluded epicardial vessel with no collateral rescue threatens the full thickness of the wall instead. The model draws that distinction from its own arithmetic rather than from a label, and the same distinction organises acute coronary syndromes on a monitor: subendocardial ischaemia is a balance problem; transmural injury is a plumbing failure.',
      ],
      demos: [
        { preset: 'collateralisedOcclusion', watch: 'subendocardial flow' },
        { preset: 'hypertrophied', watch: 'flow reserve' },
      ],
    },
    {
      heading: 'The supply side can fail with every artery wide open',
      paragraphs: [
        'The supply side can fail with every artery wide open. Flow carries oxygen only as well as the blood holds it, so anaemia or desaturation scales delivery down without changing the anatomy — which is why a haemoglobin of 7.5 converts compensated disease into angina, and why hypotension plus tachycardia is the combination cardiology fears: the head falls while the window closes. Run the low-diastolic-head preset to see a starving myocardium behind pristine vessels.',
      ],
      demos: [
        { preset: 'anaemiaHeartDisease', watch: 'oxygen delivery' },
        { preset: 'supplyStarved', watch: 'perfusion pressure' },
      ],
    },
    {
      heading: 'The drugs act wherever their receptors happen to be',
      paragraphs: [
        'Finally, the drugs act where their receptors are. Nitrates are venodilators first — preload falls, wall stress falls, demand falls with them — and they relax the dynamic components of a lesion, tone and spasm, while leaving the fixed plaque untouched; the price is a lower diastolic head, which is why GTN can make a patient faint. Collaterals belong to the same story of time: grown over months, they keep a chronically occluded vessel alive at rest, which is why losing them — or never having had them — is the difference between exertional angina and an evolving infarct.',
      ],
      demos: [
        { preset: 'vasospastic', watch: 'coronary tone' },
      ],
    },
  ],
};
