import { useEngineLoop } from '@/shared/hooks/useEngineLoop';
import { useShareableInputs } from '@/shared/hooks/useShareableInputs';
import { ReactionTimeline } from './components/ReactionTimeline';
import { MechanismDiagram } from './components/MechanismDiagram';
import { ReadoutPanel } from './components/ReadoutPanel';
import { ControlPanel } from './components/ControlPanel';
import { Sparkline } from '@/shared/components/Sparkline/Sparkline';
import { HYPERSENSITIVITY_QUESTIONS } from './questions';
import { ExplainerPanel } from '@/shared/components/ExplainerPanel/ExplainerPanel';
import { ModulePage } from '@/shared/components/ModulePage/ModulePage';
import { PresetBar } from '@/shared/components/PresetBar/PresetBar';
import { SimControls } from '@/shared/components/SimControls/SimControls';
import { QuizPanel } from '@/shared/components/QuizPanel/QuizPanel';
import { useModulePractice } from '@/shared/assessment/useModulePractice';
import { hypersensitivityContent } from './content';
import { hypersensitivityLoopConfig } from './engine/loopConfig';
import { perturbAdrenaline, perturbChallenge, perturbDiurese, perturbTransfuse } from './engine/engine';
import {
  DEFAULT_HYPERSENSITIVITY_INPUTS,
  HYPERSENSITIVITY_PRESETS,
  type HypersensitivityPresetName,
  HYPERSENSITIVITY_PRESET_LABELS,
  MECHANISM_PRESET_ORDER,
  PRESET_ORDER,
  TRANSFUSION_PRESET_ORDER,
} from './engine/presets';
import type { HypersensitivityInputs } from './engine/types';

export function HypersensitivityPage() {
  const { inputs, setInputs, shareLink } = useShareableInputs<HypersensitivityInputs>('hypersensitivity', DEFAULT_HYPERSENSITIVITY_INPUTS);
  const { snapshot, history, perturb, fastForward, reset, transport, baseline } = useEngineLoop(inputs, hypersensitivityLoopConfig);

  const { session, summary } = useModulePractice({
    moduleId: 'hypersensitivity',
    questions: HYPERSENSITIVITY_QUESTIONS,
    presets: HYPERSENSITIVITY_PRESETS,
    inputs,
    defaultInputs: DEFAULT_HYPERSENSITIVITY_INPUTS,
    setInputs,
    captureBaseline: baseline.capture,
    clearBaseline: baseline.clear,
    resetEngine: reset,
    perturbEngine: perturb,
    fastForwardEngine: fastForward,
  });

  function handleChange<K extends keyof HypersensitivityInputs>(key: K, value: HypersensitivityInputs[K]) {
    setInputs((prev) => ({ ...prev, [key]: value }));
  }

  function handleApplyPreset(name: HypersensitivityPresetName) {
    setInputs((prev) => ({ ...prev, ...HYPERSENSITIVITY_PRESETS[name] }));
  }

  const injuryHistory = history.map((h) => h.tissueInjury * 100);
  const injuryBaseline = baseline.history?.map((h) => h.tissueInjury * 100) ?? null;
  const typeIHistory = history.map((h) => h.typeI * 100);
  const typeIBaseline = baseline.history?.map((h) => h.typeI * 100) ?? null;
  const typeIVHistory = history.map((h) => h.typeIV * 100);
  const typeIVBaseline = baseline.history?.map((h) => h.typeIV * 100) ?? null;

  return (
    <ModulePage
      moduleId="hypersensitivity"
      title="Hypersensitivity"
      subtitle="four mechanisms, four timescales, and every transfusion reaction among them"
      accentVar="var(--ige)"
      presets={
        <PresetBar
          order={PRESET_ORDER}
          groups={[
            { label: 'Mechanism', order: MECHANISM_PRESET_ORDER },
            { label: 'Transfusion', order: TRANSFUSION_PRESET_ORDER },
          ]}
          labels={HYPERSENSITIVITY_PRESET_LABELS}
          onApply={handleApplyPreset}
          actions={[
            { label: 'Adrenaline', onClick: () => perturb((state) => perturbAdrenaline(state)), variant: 'impulse' },
            { label: 'Diurese', onClick: () => perturb((state) => perturbDiurese(state)), variant: 'impulse' },
            {
              label: 'Challenge',
              onClick: () => perturb((state) => perturbChallenge(state, inputs.antigenDose)),
              variant: 'danger',
            },
            { label: 'Transfuse', onClick: () => perturb((state) => perturbTransfuse(state)), variant: 'danger' },
          ]}
          onShare={shareLink}
          onReset={reset}
          disabled={session.blinded}
        />
      }
      diagram={
        <>
          <ReactionTimeline derived={snapshot.derived} history={history} />
          <MechanismDiagram derived={snapshot.derived} />
        </>
      }
      readouts={<ReadoutPanel derived={snapshot.derived} />}
      practice={<QuizPanel session={session} summary={summary} presetLabels={HYPERSENSITIVITY_PRESET_LABELS} />}
      transport={<SimControls transport={transport} baseline={baseline} />}
      charts={
        <>
          <Sparkline
            label="Tissue injury"
            unit="%"
            data={injuryHistory}
            baselineData={injuryBaseline}
            domainMin={0}
            domainMax={100}
            colorVar="var(--danger)"
          />
          <Sparkline
            label="Type I activity"
            unit="%"
            data={typeIHistory}
            baselineData={typeIBaseline}
            domainMin={0}
            domainMax={100}
            colorVar="var(--ige)"
          />
          <Sparkline
            label="Type IV activity"
            unit="%"
            data={typeIVHistory}
            baselineData={typeIVBaseline}
            domainMin={0}
            domainMax={100}
            colorVar="var(--delayed-type)"
          />
        </>
      }
      blindControls={session.blinded}
      controls={<ControlPanel inputs={inputs} onChange={handleChange} />}
      explainer={<ExplainerPanel content={hypersensitivityContent} startCollapsed={session.phase !== 'idle'} />}
      footnote={
        'A simplified, conceptual model of hypersensitivity — not a clinical or diagnostic tool. The best way to use it: pick a MECHANISM preset and press "Challenge", or a TRANSFUSION preset and press "Transfuse", then watch the reaction timeline. Its time axis is LOGARITHMIC because a type I reaction peaks in minutes and a type IV in days, and no linear axis can hold both. Start with the naive host, where a maximal dose does nothing at all, then challenge the sensitised one on an identical dose — and note that blood is the exception to that rule, since anti-A and anti-B need no prior exposure. Each preset isolates a single arm so the timings and labs read cleanly; a real patient can have more than one at once. Two simplifications worth knowing: hypotension in this model tracks histamine only, so the ABO reaction here is less shocked than a real one; and only the injury of an infarcting reaction is modelled, not the marrow response to it. One simulated second is about one hour. For how sensitisation is laid down in the first place, see the Immune Response module.'
      }
    />
  );
}
