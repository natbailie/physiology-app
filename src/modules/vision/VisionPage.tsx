import { useEngineLoop } from '@/shared/hooks/useEngineLoop';
import { useShareableInputs } from '@/shared/hooks/useShareableInputs';
import { useScenarioReset } from '@/shared/hooks/useScenarioReset';
import { useInputSetter } from '@/shared/hooks/useInputSetter';
import { useInputNudge } from '@/shared/hooks/useInputNudge';
import { caseInputs, useModuleCase } from '@/shared/hooks/useModuleCase';
import { useModuleCases } from '@/shared/hooks/useModuleCases';
import { VISION_CASES } from './cases';
import { ModulePage } from '@/shared/components/ModulePage/ModulePage';
import { PresetBar } from '@/shared/components/PresetBar/PresetBar';
import { SimControls } from '@/shared/components/SimControls/SimControls';
import { VISION_QUESTIONS } from './questions';
import { ExplainerPanel } from '@/shared/components/ExplainerPanel/ExplainerPanel';
import { visionContent } from './content';
import { getPresentationContext } from '@/shared/presentation/context';
import { usePresentationSlots } from '@/shared/presentation/ModulePresentationContent';
import { visionLoopConfig } from './engine/loopConfig';
import { perturbBrightGlare } from './engine/engine';
import { VISION_CONTROLS, buildVisionPresentation } from './presentation';
import {
  VISION_PRESETS,
  VISION_PRESET_LABELS,
  VISION_PRESET_GLOSS,
  VISION_PRESET_ORDER,
  DEFAULT_VISION_INPUTS,
} from './engine/presets';
import type { VisionDerived, VisionHistoryPoint, VisionInputs, VisionInternalState } from './engine/types';

export function VisionPage() {
  // Opened from the ward round, or null for the catalogue route. The seed means the engine
  // settles the patient directly rather than settling a healthy body and then jumping.
  const patient = useModuleCase(VISION_CASES);
  const { inputs, setInputs, shareLink } = useShareableInputs<VisionInputs>(
    'vision',
    DEFAULT_VISION_INPUTS,
    caseInputs(patient, DEFAULT_VISION_INPUTS, VISION_PRESETS),
  );
  const { snapshot, history, perturb, fastForward, reset, transport, baseline } = useEngineLoop(inputs, visionLoopConfig);
  const resetScenario = useScenarioReset({
    setInputs,
    // At a bedside, Reset means "back to this patient". Returning a learner who is mid-case to
    // a healthy volunteer would discard the thing they came to look at.
    defaults: caseInputs(patient, DEFAULT_VISION_INPUTS, VISION_PRESETS) ?? DEFAULT_VISION_INPUTS,
    resetEngine: reset,
    baseline,
    transport,
  });

  // Tab, question sets, session, bedside and the three bedded nodes. Everything downstream of
  // the engine that every bedded page repeats lives in the hook; what stays here is this
  // module's physiology and its presentation.
  const cases = useModuleCases({
    moduleId: 'vision',
    patient,
    cases: VISION_CASES,
    questions: VISION_QUESTIONS,
    presets: VISION_PRESETS,
    defaultInputs: DEFAULT_VISION_INPUTS,
    inputs,
    setInputs,
    captureBaseline: baseline.capture,
    clearBaseline: baseline.clear,
    resetEngine: reset,
    perturbEngine: perturb,
    fastForwardEngine: fastForward,
    shareLink,
    snapshot,
    transport,
    baselineFrozen: baseline.history !== null,
    presetLabels: VISION_PRESET_LABELS,
    presetGloss: VISION_PRESET_GLOSS,
  });
  const { session } = cases;

  const handleChange = useInputSetter(setInputs);

  /* One drawing, not two — and the conversion is what puts the new torch toggle on the web rail at
   * all: the hand-written panel carried fourteen controls and the schema fifteen. */
  const ctx = getPresentationContext<VisionInternalState, VisionDerived, VisionInputs, VisionHistoryPoint>(
    snapshot,
    history,
    baseline,
    inputs,
  );
  const slots = usePresentationSlots('vision', buildVisionPresentation(ctx), ctx, inputs, handleChange);
  /* Both of these are standing settings, not events. Turning the lights down leaves them down and
   * a torch held on an eye stays on it — so they move the rail, and the three torch buttons write
   * one toggle between them rather than a hidden state field nothing could see. */
  const nudge = useInputNudge(setInputs, VISION_CONTROLS);


  return (
    <ModulePage
      historyCapacity={visionLoopConfig.historyCapacity}
      moduleId="vision"
      title="Vision & Phototransduction"
      subtitle="two receptor systems share one retina, and each owns a different blindness"
      accentVar="var(--retina)"
      presets={
        <PresetBar
          order={VISION_PRESET_ORDER}
          labels={VISION_PRESET_LABELS}
          onApply={cases.applyPreset}
          actions={[
            { label: 'Lights out', onClick: () => nudge({ sceneLuminanceLogCd: -2.5 }), variant: 'impulse' },
            { label: 'Torch → right', onClick: () => handleChange('torchEye', 'right'), variant: 'impulse' },
            { label: 'Torch → left', onClick: () => handleChange('torchEye', 'left'), variant: 'impulse' },
            { label: 'Torch off', onClick: () => handleChange('torchEye', 'off'), variant: 'impulse' },
            { label: 'Camera flash', onClick: () => perturb(perturbBrightGlare), variant: 'danger' },
          ]}
          onShare={cases.shareLink}
          onReset={resetScenario}
          disabled={session.blinded}
        />
      }
      {...cases.page}
      diagram={slots.diagram}
      readouts={slots.readouts}
      transport={<SimControls transport={transport} baseline={baseline} />}
      charts={slots.charts}
      blindControls={session.blinded}
      controls={slots.controls}
      explainer={<ExplainerPanel content={visionContent} startCollapsed={session.phase !== 'idle'} />}
      footnote="A simplified conceptual model of the dual receptor system, dark adaptation, the pupil reflexes, the aqueous circulation and the visual pathways — not a clinical or diagnostic tool. Colour processing is outside its scope: cone integrity here stands for the whole foveal mosaic rather than the L/M/S classes individually. Dark adaptation is compressed to run in minutes of simulated time; pupil responses stay snappy at that scale. Intraocular pressure relaxes over simulated hours, so glaucomatous scenarios are settled by the question harness before they are shown. Field defects map lesion site to territory as fixed anatomy rather than modelling tumour growth or demyelination. For the ion channels underneath the photoreceptor potential, see Membrane & Action Potentials."
    />
  );
}
