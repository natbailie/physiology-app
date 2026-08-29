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
import { useModulePractice } from '@/shared/assessment/useModulePractice';
import { Sparkline } from '@/shared/components/Sparkline/Sparkline';
import { HearingDiagram } from './components/HearingDiagram';
import { ReadoutPanel } from './components/ReadoutPanel';
import { ControlPanel } from './components/ControlPanel';
import { HEARING_QUESTIONS } from './questions';
import { ExplainerPanel } from '@/shared/components/ExplainerPanel/ExplainerPanel';
import { hearingContent } from './content';
import { hearingLoopConfig } from './engine/loopConfig';
import { perturbNoiseExposure } from './engine/engine';
import {
  HEARING_PRESETS,
  HEARING_PRESET_LABELS,
  HEARING_PRESET_ORDER,
  DEFAULT_HEARING_INPUTS,
} from './engine/presets';
import type { HearingInputs } from './engine/types';
import { Audiogram } from './components/Audiogram';

export function HearingPage() {
  const { inputs, setInputs, shareLink } = useShareableInputs<HearingInputs>('hearing', DEFAULT_HEARING_INPUTS);
  const { snapshot, history, perturb, fastForward, reset, transport, baseline } = useEngineLoop(inputs, hearingLoopConfig);
  const resetScenario = useScenarioReset({
    setInputs,
    defaults: DEFAULT_HEARING_INPUTS,
    resetEngine: reset,
    baseline,
    transport,
  });

  const { session, summary } = useModulePractice({
    moduleId: 'hearing',
    questions: HEARING_QUESTIONS,
    presets: HEARING_PRESETS,
    inputs,
    defaultInputs: DEFAULT_HEARING_INPUTS,
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
    defaults: DEFAULT_HEARING_INPUTS,
    presets: HEARING_PRESETS,
    resetEngine: reset,
  });

  const ptaHistory = useSeries(history, (h) => h.pta);
  const ptaBaseline = useSeries(baseline.history, (h) => h.pta);
  const loudnessHistory = useSeries(history, (h) => h.loudness);
  const loudnessBaseline = useSeries(baseline.history, (h) => h.loudness);
  const ttsHistory = useSeries(history, (h) => h.tts);
  const ttsBaseline = useSeries(baseline.history, (h) => h.tts);

  return (
    <ModulePage
      moduleId="hearing"
      title="Hearing & Cochlear Mechanics"
      subtitle="two tuning forks tell you where the ear failed, and loudness tells you how"
      accentVar="var(--cochlea)"
      presets={
        <PresetBar
          order={HEARING_PRESET_ORDER}
          labels={HEARING_PRESET_LABELS}
          onApply={applyPreset}
          actions={[
            { label: 'Loud concert (no plugs)', onClick: () => perturb(perturbNoiseExposure), variant: 'danger' },
          ]}
          onShare={shareLink}
          onReset={resetScenario}
          disabled={session.blinded}
        />
      }
      diagram={<HearingDiagram derived={snapshot.derived} />}
      readouts={<ReadoutPanel derived={snapshot.derived} />}
      practice={<QuizPanel session={session} summary={summary} presetLabels={HEARING_PRESET_LABELS} />}
      transport={<SimControls transport={transport} baseline={baseline} />}
      charts={
        <>
          <Audiogram derived={snapshot.derived} />
          <Sparkline
            label="Pure-tone average"
            unit="dB"
            data={ptaHistory}
            baselineData={ptaBaseline}
            domainMin={0}
            domainMax={80}
            colorVar="var(--cochlea)"
          />
          <Sparkline
            label="Loudness"
            unit="%"
            data={loudnessHistory}
            baselineData={loudnessBaseline}
            domainMin={0}
            domainMax={100}
            colorVar="var(--warn)"
          />
          <Sparkline
            label="Temporary threshold shift"
            unit="dB"
            data={ttsHistory}
            baselineData={ttsBaseline}
            domainMin={0}
            domainMax={30}
            colorVar="var(--danger)"
          />
        </>
      }
      blindControls={session.blinded}
      controls={<ControlPanel inputs={inputs} onChange={handleChange} />}
      explainer={<ExplainerPanel content={hearingContent} startCollapsed={session.phase !== 'idle'} />}
      footnote="A simplified conceptual model of one tested ear against an assumed-normal other — not a clinical or diagnostic tool. The two ears are never compared directly, so true unilateral patterns are implied rather than drawn; speech audiometry is modelled as audibility plus a transducer distortion penalty. Temporary threshold shift is compressed to recover within minutes of simulated time; permanent thresholds do not recover at all, which is the point."
    />
  );
}
