import { useEngineLoop } from '@/shared/hooks/useEngineLoop';
import { useSeries } from '@/shared/hooks/useSeries';
import { useShareableInputs } from '@/shared/hooks/useShareableInputs';
import { useScenarioReset } from '@/shared/hooks/useScenarioReset';
import { useScenarioPreset } from '@/shared/hooks/useScenarioPreset';
import { useInputSetter } from '@/shared/hooks/useInputSetter';
import { ModulePage } from '@/shared/components/ModulePage/ModulePage';
import { PresetBar } from '@/shared/components/PresetBar/PresetBar';
import { SimControls } from '@/shared/components/SimControls/SimControls';
import { QuizPanel } from '@/shared/components/QuizPanel/QuizPanel';
import { QuestionSet } from '@/shared/components/QuestionSet/QuestionSet';
import { useModulePractice } from '@/shared/assessment/useModulePractice';
import { Sparkline } from '@/shared/components/Sparkline/Sparkline';
import { SomaticDiagram } from './components/SomaticDiagram';
import { ReadoutPanel } from './components/ReadoutPanel';
import { ControlPanel } from './components/ControlPanel';
import { SOMATIC_QUESTIONS } from './questions';
import { ExplainerPanel } from '@/shared/components/ExplainerPanel/ExplainerPanel';
import { somaticSensationContent } from './content';
import { somaticLoopConfig } from './engine/loopConfig';
import { perturbOpioidBolus, perturbTissueInjury } from './engine/engine';
import {
  SOMATIC_PRESETS,
  SOMATIC_PRESET_LABELS,
  SOMATIC_PRESET_ORDER,
  DEFAULT_SOMATIC_INPUTS,
} from './engine/presets';
import type { SomaticInputs } from './engine/types';

export function SomaticSensationPage() {
  const { inputs, setInputs, shareLink } = useShareableInputs<SomaticInputs>('somaticSensation', DEFAULT_SOMATIC_INPUTS);
  const { snapshot, history, perturb, fastForward, reset, transport, baseline } = useEngineLoop(inputs, somaticLoopConfig);
  const resetScenario = useScenarioReset({
    setInputs,
    defaults: DEFAULT_SOMATIC_INPUTS,
    resetEngine: reset,
    baseline,
    transport,
  });

  const { session, summary } = useModulePractice({
    moduleId: 'somaticSensation',
    questions: SOMATIC_QUESTIONS,
    presets: SOMATIC_PRESETS,
    inputs,
    defaultInputs: DEFAULT_SOMATIC_INPUTS,
    setInputs,
    captureBaseline: baseline.capture,
    clearBaseline: baseline.clear,
    resetEngine: reset,
    perturbEngine: perturb,
    fastForwardEngine: fastForward,
  });

  const handleChange = useInputSetter(setInputs);

  const applyPreset = useScenarioPreset({
    setInputs,
    defaults: DEFAULT_SOMATIC_INPUTS,
    presets: SOMATIC_PRESETS,
    resetEngine: reset,
  });

  const painHistory = useSeries(history, (h) => h.pain);
  const painBaseline = useSeries(baseline.history, (h) => h.pain);
  const gateHistory = useSeries(history, (h) => h.gate);
  const gateBaseline = useSeries(baseline.history, (h) => h.gate);
  const sensHistory = useSeries(history, (h) => h.sensitisation);
  const sensBaseline = useSeries(baseline.history, (h) => h.sensitisation);

  return (
    <ModulePage
      historyCapacity={somaticLoopConfig.historyCapacity}
      moduleId="somaticSensation"
      title="Somatosensation & Pain Pathways"
      subtitle="one gate decides what you feel, and two crossing tracts decide where you lose it"
      accentVar="var(--nociception)"
      presets={
        <PresetBar
          order={SOMATIC_PRESET_ORDER}
          labels={SOMATIC_PRESET_LABELS}
          onApply={applyPreset}
          actions={[
            { label: 'Opioid bolus', onClick: () => perturb(perturbOpioidBolus), variant: 'impulse' },
            { label: 'Fresh injury', onClick: () => perturb(perturbTissueInjury), variant: 'danger' },
          ]}
          onShare={shareLink}
          onReset={resetScenario}
          disabled={session.blinded}
        />
      }
      diagram={<SomaticDiagram derived={snapshot.derived} />}
      readouts={<ReadoutPanel derived={snapshot.derived} />}
      questions={
        <QuestionSet
          count={SOMATIC_QUESTIONS.length}
          beds={[]}
          schedule={summary.schedule}
          snapshot={snapshot}
          question={session.question}
        >
          <QuizPanel session={session} summary={summary} presetLabels={SOMATIC_PRESET_LABELS} />
        </QuestionSet>
      }
      transport={<SimControls transport={transport} baseline={baseline} />}
      charts={
        <>
          <Sparkline
            label="Pain score"
            unit="/10"
            data={painHistory}
            baselineData={painBaseline}
            domainMin={0}
            domainMax={10}
            colorVar="var(--nociception)"
          />
          <Sparkline
            label="Gate"
            unit="% open"
            data={gateHistory}
            baselineData={gateBaseline}
            domainMin={0}
            domainMax={100}
            colorVar="var(--warn)"
          />
          <Sparkline
            label="Peripheral sensitisation"
            unit="%"
            data={sensHistory}
            baselineData={sensBaseline}
            domainMin={0}
            domainMax={100}
            colorVar="var(--danger)"
          />
        </>
      }
      blindControls={session.blinded}
      controls={<ControlPanel inputs={inputs} onChange={handleChange} />}
      explainer={<ExplainerPanel content={somaticSensationContent} startCollapsed={session.phase !== 'idle'} />}
      footnote="A simplified conceptual model of dorsal-horn gating, sensitisation and the two ascending tract systems — not a clinical or diagnostic tool. Motor tracts are not modelled (the corticospinal consequences of these lesions are noted in prose only); pain rating is a whole-system output rather than a per-fibre measure; and lesion severities are continuous stand-ins for what is anatomically binary. Sensitisation and wind-up run on compressed timescales of minutes."
    />
  );
}
