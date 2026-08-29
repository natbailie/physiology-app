import type { ModuleQuestion, PanelField } from '@/shared/assessment/types';
import type { CoronaryDerived, CoronaryInputs, CoronaryInternalState } from './engine/types';
import type { CoronaryPresetName } from './engine/presets';
import { perturbExertion, perturbVasospasm } from './engine/engine';

type Snapshot = { state: CoronaryInternalState; derived: CoronaryDerived };
export type CoronaryQuestion = ModuleQuestion<CoronaryInputs, CoronaryPresetName, Snapshot>;

const PANEL: readonly PanelField<Snapshot>[] = [
  {
    label: 'Flow reserve',
    value: (s) => s.derived.flowReserveRatio,
    decimals: 1,
    tolerance: 0.08,
  },
  { label: 'Demand', unit: '× rest', value: (s) => s.derived.requiredFlow, decimals: 2 },
  { label: 'Maximal supply', unit: '× rest', value: (s) => s.derived.maximalFlowCapacity, decimals: 2 },
  {
    label: 'Ischaemia',
    unit: '%',
    value: (s) => s.derived.ischaemiaLevel * 100,
    decimals: 0,
    tolerance: 0.12,
  },
  {
    label: 'Diastolic window',
    unit: '%',
    value: (s) => s.derived.diastolicTimeFraction * 100,
    decimals: 0,
    tolerance: 0.04,
  },
  {
    label: 'Oxygen carriage',
    unit: '%',
    value: (s) => s.derived.oxygenCarriageRatio * 100,
    decimals: 0,
    tolerance: 0.04,
  },
];

const SETTLE = 300;

export const CORONARY_QUESTIONS: readonly CoronaryQuestion[] = [
  {
    id: 'silent-until-stressed',
    stem: 'A man attends the chest pain clinic. He gets tight shoulders walking uphill but has never had pain at rest. His resting ECG and observations are unremarkable.',
    answer: 'stableAngina',
    options: ['stableAngina', 'normal', 'criticalStenosis', 'collateralisedOcclusion'],
    panel: PANEL,
    settleSeconds: SETTLE,
    explanation:
      'Resting flow is normal — because the microvasculature downstream of the narrowing has dilated to compensate, spending most of the vasodilatory reserve to do it. The reserve readout is the giveaway: half of what a healthy heart holds. That margin is why this patient is well in the waiting room and would not be halfway up a hill, and why a normal resting trace excludes neither significant disease nor an ischaemic event tomorrow.',
  },
  {
    id: 'pain-at-rest-with-a-clean-trace-history',
    stem: 'A woman wakes at 3 am with severe central chest pain. She has never had exertional symptoms. The monitor shows evolving ST elevation while she lies still.',
    setup: { perturb: (state) => perturbVasospasm(state) },
    answer: 'vasospastic',
    options: ['vasospastic', 'stableAngina', 'tachycardicDanger', 'criticalStenosis'],
    panel: PANEL,
    settleSeconds: SETTLE,
    explanation:
      'The occlusion is dynamic. Her fixed plaque is trivial and her rate and blood pressure are ordinary — nothing about demand explains a full-thickness injury at rest. A focal spasm has closed the epicardial segment outright, which is Prinzmetal angina, and it responds to nitrates and calcium-channel blockers rather than to exercise restrictions. The lesion readout looks like a critical stenosis precisely because, for as long as the spasm holds, it is one.',
  },
  {
    id: 'thin-blood-or-tight-vessel',
    stem: 'A breathless woman reports chest tightness on climbing stairs. She is pale, her heart rate runs a little fast, and her arteries were reported as showing moderate disease at angiography.',
    answer: 'anaemiaHeartDisease',
    options: ['anaemiaHeartDisease', 'criticalStenosis', 'tachycardicDanger', 'hypertrophied'],
    panel: PANEL,
    settleSeconds: SETTLE,
    explanation:
      'Moderate disease should leave reserve to spare, so the tightness needs another explanation — and the carriage row provides it: her blood carries barely half the oxygen it should. Flow is only half of delivery, so anaemia scales the entire supply curve down as surely as a tighter stenosis would. Transfuse her or correct the iron and the same arteries will suddenly reach the top of the stairs.',
  },
  {
    id: 'the-pressure-loaded-heart',
    stem: 'A man with long-standing untreated hypertension now notices exertional chest tightness. Angiography showed only moderate coronary disease, insufficient to explain his symptoms.',
    answer: 'hypertrophied',
    options: ['hypertrophied', 'stableAngina', 'normal', 'supplyStarved'],
    panel: PANEL,
    settleSeconds: SETTLE,
    explanation:
      'The vessels are only part of the accounting. A pressure-loaded ventricle generates enormous wall stress by Laplace, and wall stress is oxygen demand: his heart starts each day consuming nearly twice what a resting normal heart does, before he takes a single step. Demand this high turns even moderate disease into exertional ischaemia — and treating the blood pressure treats the angina, without touching the arteries at all.',
  },
  {
    id: 'tachycardia-breaks-the-stenosed-heart',
    stem: 'A man with known stable angina develops atrial flutter at 160 bpm. He has taken no rate-control medication yet.',
    setup: { preset: 'stableAngina' },
    intervention: { label: 'The ventricular rate rises to 160 bpm.', inputs: { heartRateBpm: 160 } },
    prompt: 'What happens to his myocardial ischaemia?',
    watch: 'ischaemia',
    correctDirection: 'rises',
    settleSeconds: 20,
    observeSeconds: 40,
    explanation:
      'It climbs, and for two reasons stacked on top of each other. Each beat adds to the rate-pressure product, raising demand; each beat also shortens diastole, shrinking the window in which the narrowed segment can be perfused through. Supply falls exactly as demand peaks — which is why a fast arrhythmia can precipitate infarction in a heart that was coping, and why restoring sinus rhythm is itself anti-ischaemic treatment.',
    metric: (s) => s.derived.ischaemiaLevel,
  },
  {
    id: 'beta-blockade-relieves-exertion',
    stem: 'The same man keeps getting angina on exertion despite his fixed 75% stenosis. A beta-blocker is started.',
    setup: { preset: 'stableAngina', perturb: (state) => perturbExertion(state) },
    intervention: { label: 'Beta-blockade is titrated to 70% effect.', inputs: { betaBlockerDosePercent: 70 } },
    prompt: 'What happens to myocardial ischaemia?',
    watch: 'ischaemia',
    correctDirection: 'falls',
    settleSeconds: 20,
    observeSeconds: 40,
    explanation:
      'It eases, though the stenosis itself has not changed by a millimetre. Beta-blockade removes sympathetic drive: the rate falls, cutting the rate-pressure product, and the slower cycle lengthens diastole, widening the perfusion window the coronaries depend on. Demand drops and supply recovers simultaneously — the double action that makes beta-blockers the backbone of anti-anginal therapy, and the reason the resting heart rate is a treatment target.',
    metric: (s) => s.derived.ischaemiaLevel,
  },
  {
    id: 'nitrates-lyse-spasm-not-plaque',
    stem: 'A patient with vasospastic angina is having an attack at rest. Sublingual GTN is given.',
    setup: { preset: 'vasospastic', perturb: (state) => perturbVasospasm(state) },
    intervention: { label: 'Nitrate effect reaches 80%.', inputs: { nitrateDosePercent: 80 } },
    prompt: 'What happens to myocardial ischaemia?',
    watch: 'ischaemia',
    correctDirection: 'falls',
    settleSeconds: 20,
    observeSeconds: 40,
    explanation:
      'It resolves, because GTN relaxes smooth muscle in the epicardial segment — and in vasospastic angina the occlusion is made of smooth muscle. Watch what else moves: preload and the diastolic pressure head both fall, the trade-off that occasionally makes a patient faint. The fixed plaque, if present, is untouched — nitrates buy time and relieve spasm, but they are not working on the architecture of the lesion.',
    metric: (s) => s.derived.ischaemiaLevel,
  },
  {
    id: 'anaemia-steals-the-margin',
    stem: 'A woman with stable exertional angina becomes acutely anaemic from a gastrointestinal bleed, her haemoglobin falling to 7 g/dL.',
    setup: { preset: 'stableAngina', perturb: (state) => perturbExertion(state) },
    intervention: { label: 'Haemoglobin falls to 7 g/dL.', inputs: { haemoglobinGPerDl: 7 } },
    prompt: 'What happens to myocardial ischaemia?',
    watch: 'ischaemia',
    correctDirection: 'rises',
    settleSeconds: 20,
    observeSeconds: 40,
    explanation:
      'It deepens sharply although not one vessel has narrowed further. Every millilitre of blood the coronaries deliver now carries about half the oxygen it did, so the entire supply side is scaled down — the circulation compensates by racing along at higher flow, which raises demand again. Anaemia plus coronary disease is why gastrointestinal bleeds precipitate cardiac events, and why transfusion thresholds are lower than intuition suggests in active bleeders with angina.',
    metric: (s) => s.derived.ischaemiaLevel,
  },
  {
    id: 'hypotension-starves-the-myocardium',
    stem: 'A patient with critical aortic stenosis-related coronary disease becomes hypotensive peri-operatively, the diastolic pressure sliding to 55 mmHg.',
    setup: { preset: 'criticalStenosis' },
    intervention: { label: 'Diastolic pressure falls to 55 mmHg.', inputs: { aorticDiastolicPressureMmHg: 55 } },
    prompt: 'What happens to myocardial ischaemia?',
    watch: 'ischaemia',
    correctDirection: 'rises',
    settleSeconds: 20,
    observeSeconds: 40,
    explanation:
      'It worsens although demand has not moved a beat. The diastolic column is what pushes blood through the muscle in the few moments systole allows, and a narrowed lumen wastes proportionally more of whatever head arrives. This is the vicious circle of the failing coronary patient: ischaemia depresses contractility, the pressure falls further, and perfusion collapses — which is why maintaining diastolic pressure is the first duty when resuscitating these hearts.',
    metric: (s) => s.derived.ischaemiaLevel,
  },
  {
    id: 'losing-the-collaterals',
    stem: 'A patient has lived for years with a totally occluded vessel kept open by collaterals grown around it. Disease progression quietly chokes those collaterals off.',
    setup: { preset: 'collateralisedOcclusion' },
    intervention: {
      label: 'Collateral supply fails.',
      inputs: { collateralFraction: 0.05 },
    },
    prompt: 'What happens to the territory supplied by that vessel?',
    watch: 'infarcted territory',
    correctDirection: 'rises',
    settleSeconds: 20,
    observeSeconds: 60,
    explanation:
      'It begins to infarct. The parent artery has been dead for years — what changed is the detour. Collateral vessels grow over weeks to months under the stimulus of repeated ischaemia, and they hold a chronically occluded territory at rest; lose them acutely and the anatomy reverts to a fresh total occlusion with no rescue path. It is why patients with long-standing disease can tolerate occlusions that would devastate a previously healthy heart — until the day the detours close.',
    metric: (s) => s.state.necrosisLoad,
  },
];
