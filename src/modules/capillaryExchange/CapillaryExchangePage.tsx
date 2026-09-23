import { useEngineLoop } from '@/shared/hooks/useEngineLoop';
import { useSeries } from '@/shared/hooks/useSeries';
import { useShareableInputs } from '@/shared/hooks/useShareableInputs';
import { useScenarioReset } from '@/shared/hooks/useScenarioReset';
import { useScenarioPreset } from '@/shared/hooks/useScenarioPreset';
import { useInputSetter } from '@/shared/hooks/useInputSetter';
import { useInputNudge } from '@/shared/hooks/useInputNudge';
import { CAPILLARY_CONTROLS } from './presentation';
import { CapillaryDiagram } from './components/CapillaryDiagram';
import { ReadoutPanel } from './components/ReadoutPanel';
import { ControlPanel } from './components/ControlPanel';
import { Sparkline } from '@/shared/components/Sparkline/Sparkline';
import { CAPILLARY_QUESTIONS } from './questions';
import { ExplainerPanel } from '@/shared/components/ExplainerPanel/ExplainerPanel';
import { ModulePage } from '@/shared/components/ModulePage/ModulePage';
import { PresetBar } from '@/shared/components/PresetBar/PresetBar';
import { SimControls } from '@/shared/components/SimControls/SimControls';
import { QuizPanel } from '@/shared/components/QuizPanel/QuizPanel';
import { QuestionSet } from '@/shared/components/QuestionSet/QuestionSet';
import { useModulePractice } from '@/shared/assessment/useModulePractice';
import { capillaryExchangeContent } from './content';
import { capillaryLoopConfig } from './engine/loopConfig';
import { perturbAlbuminInfusion } from './engine/engine';
import {
  CAPILLARY_PRESETS,
  CAPILLARY_PRESET_LABELS,
  CAPILLARY_PRESET_ORDER,
  DEFAULT_CAPILLARY_INPUTS,
  bedDefaults,
} from './engine/presets';
import type { CapillaryInputs, TissueBed } from './engine/types';

export function CapillaryExchangePage() {
  const { inputs, setInputs, shareLink } = useShareableInputs<CapillaryInputs>('capillaryExchange', DEFAULT_CAPILLARY_INPUTS);
  const { snapshot, history, perturb, fastForward, reset, transport, baseline } = useEngineLoop(inputs, capillaryLoopConfig);
  const resetScenario = useScenarioReset({
    setInputs,
    defaults: DEFAULT_CAPILLARY_INPUTS,
    resetEngine: reset,
    baseline,
    transport,
  });

  const { session, summary } = useModulePractice({
    moduleId: 'capillaryExchange',
    questions: CAPILLARY_QUESTIONS,
    presets: CAPILLARY_PRESETS,
    inputs,
    defaultInputs: DEFAULT_CAPILLARY_INPUTS,
    setInputs,
    captureBaseline: baseline.capture,
    clearBaseline: baseline.clear,
    resetEngine: reset,
    perturbEngine: perturb,
    fastForwardEngine: fastForward,
  });
  const { derived } = snapshot;
  const interstitialVolumeHistory = useSeries(history, (h) => h.interstitialVolume);
  const filtrationRateHistory = useSeries(history, (h) => h.filtrationRate);
  const lymphFlowHistory = useSeries(history, (h) => h.lymphFlow);
  const capillaryPressureHistory = useSeries(history, (h) => h.capillaryPressure);

  const handleChange = useInputSetter(setInputs);
  // You stay standing, and what standing does is raise the venous pressure at the ankle — which is
  // what `perturbStandUp`'s own docblock says it does. The code added to the interstitial volume
  // instead: the oedema rather than its cause, so the pressure it came from was never on the rail.
  const nudge = useInputNudge(setInputs, CAPILLARY_CONTROLS);

  function handleSelectBed(bed: TissueBed) {
    setInputs((prev) => ({ ...prev, ...bedDefaults(bed) }));
  }

  const applyPreset = useScenarioPreset({
    setInputs,
    defaults: DEFAULT_CAPILLARY_INPUTS,
    presets: CAPILLARY_PRESETS,
    resetEngine: reset,
  });

  return (
    <ModulePage
      historyCapacity={capillaryLoopConfig.historyCapacity}
      moduleId="capillaryExchange"
      title="Capillary Exchange & Oedema"
      subtitle="Starling forces, the interstitium & lymphatic reserve"
      accentVar="var(--capillary)"
      presets={
        <PresetBar
          order={CAPILLARY_PRESET_ORDER}
          labels={CAPILLARY_PRESET_LABELS}
          onApply={applyPreset}
          actions={[
            { label: 'Albumin infusion', onClick: () => perturb((s) => perturbAlbuminInfusion(s)), variant: 'impulse' },
            { label: 'Stand up', onClick: () => nudge({ venousOutflowPressure: 25 }), variant: 'danger' },
          ]}
          onShare={shareLink}
          onReset={resetScenario}
        />
      }
      diagram={<CapillaryDiagram derived={derived} />}
      readouts={<ReadoutPanel derived={derived} />}
      questions={
        <QuestionSet
          count={CAPILLARY_QUESTIONS.length}
          beds={[]}
          schedule={summary.schedule}
          snapshot={snapshot}
          question={session.question}
        >
          <QuizPanel session={session} summary={summary} />
        </QuestionSet>
      }
      transport={<SimControls transport={transport} baseline={baseline} />}
      charts={
        <>
          <Sparkline
            label="Interstitial volume"
            unit="% of normal"
            data={interstitialVolumeHistory}
            domainMin={80}
            domainMax={260}
            colorVar="var(--interstitium)"
          />
          {/* Filtration and lymph flow on the same axis: while they track each other nothing
              accumulates, and the gap between them IS the rate of swelling. */}
          <Sparkline
            label="Filtration"
            secondaryLabel="lymph flow"
            unit="mL/min"
            data={filtrationRateHistory}
            secondaryData={lymphFlowHistory}
            secondaryColorVar="var(--lymph)"
            domainMin={0}
            domainMax={Math.max(6, derived.lymphaticCapacityMlPerMin * 1.2)}
            colorVar="var(--capillary)"
          />
          <Sparkline
            label="Capillary pressure"
            unit="mmHg"
            data={capillaryPressureHistory}
            domainMin={0}
            domainMax={60}
            colorVar="var(--artery)"
          />
        </>
      }
      controls={<ControlPanel inputs={inputs} onChange={handleChange} onSelectBed={handleSelectBed} />}
      blindControls={session.blinded}
      explainer={<ExplainerPanel content={capillaryExchangeContent} startCollapsed={session.phase !== 'idle'} />}
      footnote={
        'A simplified, conceptual model of capillary fluid exchange — not a clinical tool. This is Starling\'s law of the CAPILLARY, not the Frank-Starling relationship between preload and stroke volume in the cardiorenal and PV loop modules; same physiologist, different law. One second of real time is about half a simulated hour, so oedema that takes a day or two to build appears over roughly a minute.'
      }
    />
  );
}
