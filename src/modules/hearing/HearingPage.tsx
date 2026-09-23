import { useEngineLoop } from '@/shared/hooks/useEngineLoop';
import { useSeries } from '@/shared/hooks/useSeries';
import { useShareableInputs } from '@/shared/hooks/useShareableInputs';
import { useScenarioReset } from '@/shared/hooks/useScenarioReset';
import { useInputSetter } from '@/shared/hooks/useInputSetter';
import { caseInputs, useModuleCase } from '@/shared/hooks/useModuleCase';
import { useModuleCases } from '@/shared/hooks/useModuleCases';
import { HEARING_CASES } from './cases';
import { ModulePage } from '@/shared/components/ModulePage/ModulePage';
import { PresetBar } from '@/shared/components/PresetBar/PresetBar';
import { SimControls } from '@/shared/components/SimControls/SimControls';
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
  HEARING_PRESET_GLOSS,
  HEARING_PRESET_ORDER,
  DEFAULT_HEARING_INPUTS,
} from './engine/presets';
import type { HearingInputs } from './engine/types';
import { Audiogram } from './components/Audiogram';

export function HearingPage() {
  // Opened from the ward round, or null for the catalogue route. The seed means the engine
  // settles the patient directly rather than settling a healthy body and then jumping.
  const patient = useModuleCase(HEARING_CASES);
  const { inputs, setInputs, shareLink } = useShareableInputs<HearingInputs>(
    'hearing',
    DEFAULT_HEARING_INPUTS,
    caseInputs(patient, DEFAULT_HEARING_INPUTS, HEARING_PRESETS),
  );
  const { snapshot, history, perturb, fastForward, reset, transport, baseline } = useEngineLoop(inputs, hearingLoopConfig);
  const resetScenario = useScenarioReset({
    setInputs,
    // At a bedside, Reset means "back to this patient". Returning a learner who is mid-case to
    // a healthy volunteer would discard the thing they came to look at.
    defaults: caseInputs(patient, DEFAULT_HEARING_INPUTS, HEARING_PRESETS) ?? DEFAULT_HEARING_INPUTS,
    resetEngine: reset,
    baseline,
    transport,
  });

  // Tab, question sets, session, bedside and the three bedded nodes. Everything downstream of
  // the engine that every bedded page repeats lives in the hook; what stays here is this
  // module's physiology and its presentation.
  const cases = useModuleCases({
    moduleId: 'hearing',
    patient,
    cases: HEARING_CASES,
    questions: HEARING_QUESTIONS,
    presets: HEARING_PRESETS,
    defaultInputs: DEFAULT_HEARING_INPUTS,
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
    presetLabels: HEARING_PRESET_LABELS,
    presetGloss: HEARING_PRESET_GLOSS,
  });
  const { session } = cases;

  const handleChange = useInputSetter(setInputs);

  const ptaHistory = useSeries(history, (h) => h.pta);
  const ptaBaseline = useSeries(baseline.history, (h) => h.pta);
  const loudnessHistory = useSeries(history, (h) => h.loudness);
  const loudnessBaseline = useSeries(baseline.history, (h) => h.loudness);
  const ttsHistory = useSeries(history, (h) => h.tts);
  const ttsBaseline = useSeries(baseline.history, (h) => h.tts);

  return (
    <ModulePage
      historyCapacity={hearingLoopConfig.historyCapacity}
      moduleId="hearing"
      title="Hearing & Cochlear Mechanics"
      subtitle="two tuning forks tell you where the ear failed, and loudness tells you how"
      accentVar="var(--cochlea)"
      presets={
        <PresetBar
          order={HEARING_PRESET_ORDER}
          labels={HEARING_PRESET_LABELS}
          onApply={cases.applyPreset}
          actions={[
            { label: 'Loud concert (no plugs)', onClick: () => perturb(perturbNoiseExposure), variant: 'danger' },
          ]}
          onShare={cases.shareLink}
          onReset={resetScenario}
          disabled={session.blinded}
        />
      }
      {...cases.page}
      diagram={<HearingDiagram derived={snapshot.derived} />}
      readouts={<ReadoutPanel derived={snapshot.derived} />}
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
