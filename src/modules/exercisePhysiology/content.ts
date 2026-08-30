import type { ExplainerContent } from '@/shared/components/ExplainerPanel/ExplainerPanel';
import type { ExercisePresetName } from './engine/presets';

export const exercisePhysiologyContent: ExplainerContent<ExercisePresetName> = {
  title: 'Every system answers one question at a time: how much oxygen do the muscles need',
  sections: [
    {
      heading: 'Twenty responses that all scale off one variable',
      paragraphs: [
        'Exercise physiology looks like twenty separate responses until you notice they all scale off one variable: the workload. Oxygen demand rises linearly with watts — roughly ten millilitres a minute per watt — and every system in the body reorganises to meet it. Cardiac output climbs from five to as much as twenty-five litres a minute; ventilation climbs in parallel; muscle blood flow increases twenty-fold while gut and kidney quietly halve their share. Load the vigorous run preset and read across the panels: one cause, whole-body effect.',
      ],
      demos: [
        { preset: 'rest', watch: 'VO2' },
        { preset: 'lightCycling', watch: 'VO2' },
      ],
    },
    {
      heading: 'The cardiovascular story is redistribution plus multiplication',
      paragraphs: [
        'The cardiovascular story is redistribution plus multiplication. Heart rate rises along its age-predicted ceiling, stroke volume grows then plateaus by half of maximal effort, and their product — cardiac output — triples or quadruples. But pressure rises only modestly, because total peripheral resistance CRASHES as muscle beds dilate: the circulation opens its taps exactly where the demand is. Meanwhile arterial oxygen content barely changes — saturation stays near 97 per cent — so the extra oxygen is delivered by flow and extracted by widening the arterio-venous difference. Watch that difference on screen: it does more work than any other number in the panel.',
      ],
      demos: [
        { preset: 'vigorousRun', watch: 'cardiac output' },
      ],
    },
    {
      heading: 'Two ceilings define the limits of what effort can buy',
      paragraphs: [
        'Two ceilings define the limits. VO2max is the first: above it, oxygen consumption pins flat no matter what the workload asks, and the deficit is paid anaerobically — watch fatigue accumulate once demand crosses the line. The second is the lactate threshold, well below VO2max, where lactate begins climbing steeply and sustainable exercise ends. Training moves both: fitness raises the ceiling and right-shifts the threshold, so the trained athlete at the same absolute wattage sits below their threshold with modest lactate and lower heart rate while the untrained subject is already drowning. Compare presets at identical loads and the entire meaning of "fitness" appears as arithmetic.',
      ],
      demos: [
        { preset: 'eliteEffort', watch: 'VO2' },
        { preset: 'untrainedExhaustion', watch: 'fatigue' },
      ],
    },
    {
      heading: 'Age and training write their signatures everywhere at once',
      paragraphs: [
        'Age and training write their signatures everywhere at once. Maximal heart rate falls with age (the rough formula is 220 minus age), so an older athlete reaches their ceiling sooner even with excellent fitness. The trained resting heart is slow — forty-something beats a minute — because stroke volume is enormous; watch the athlete-at-rest preset show bradycardia with a perfectly normal output. Dehydration adds a thermal penalty: less sweat available means heat accumulates faster at the same workload, which is why fluid status decides long races.',
      ],
      demos: [
        { preset: 'athleteRest', watch: 'heart rate' },
        { preset: 'dehydratedEffort', watch: 'stroke volume' },
      ],
    },
    {
      heading: 'Nothing here acts alone, and that is the point of the module',
      paragraphs: [
        'The integrative lesson is the point of this module. Nothing here acts alone: raising the workload raises VO2, which raises cardiac output through rate and stroke, which requires redistribution, which changes resistance, which the baroreflex tolerates because pressure only drifts mildly upward. Ventilation follows carbon dioxide; temperature drifts with inefficiency; lactate marks the border between the sustainable and the terminal. When a board question describes an exercising subject, it is really asking which of these coupled curves you are looking at — and this page shows all of them moving together from one slider.',
      ],
    },
  ],
};
