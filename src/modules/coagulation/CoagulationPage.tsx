import { useEngineLoop } from '@/shared/hooks/useEngineLoop';
import { useShareableInputs } from '@/shared/hooks/useShareableInputs';
import { CoagulationDiagram } from './components/CoagulationDiagram';
import { ReadoutPanel } from './components/ReadoutPanel';
import { ControlPanel } from './components/ControlPanel';
import { Sparkline } from '@/shared/components/Sparkline/Sparkline';
import { COAGULATION_QUESTIONS } from './questions';
import { ExplainerPanel } from '@/shared/components/ExplainerPanel/ExplainerPanel';
import { ModulePage } from '@/shared/components/ModulePage/ModulePage';
import { PresetBar } from '@/shared/components/PresetBar/PresetBar';
import { SimControls } from '@/shared/components/SimControls/SimControls';
import { QuizPanel } from '@/shared/components/QuizPanel/QuizPanel';
import { useModulePractice } from '@/shared/assessment/useModulePractice';
import { coagulationContent } from './content';
import { coagLoopConfig } from './engine/loopConfig';
import { perturbInjury } from './engine/engine';
import { COAG_PRESETS, DEFAULT_COAG_INPUTS, type CoagPresetName, COAG_PRESET_LABELS, PRESET_ORDER } from './engine/presets';
import type { CoagInputs } from './engine/types';

export function CoagulationPage() {
  const { inputs, setInputs, shareLink } = useShareableInputs<CoagInputs>('coagulation', DEFAULT_COAG_INPUTS);
  const { snapshot, history, perturb, reset, transport, baseline } = useEngineLoop(inputs, coagLoopConfig);

  const { session, summary } = useModulePractice({
    moduleId: 'coagulation',
    questions: COAGULATION_QUESTIONS,
    presets: COAG_PRESETS,
    setInputs,
    captureBaseline: baseline.capture,
    clearBaseline: baseline.clear,
    resetEngine: reset,
    perturbEngine: perturb,
  });

  function handleChange<K extends keyof CoagInputs>(key: K, value: CoagInputs[K]) {
    setInputs((prev) => ({ ...prev, [key]: value }));
  }

  function handleApplyPreset(name: CoagPresetName) {
    setInputs((prev) => ({ ...prev, ...COAG_PRESETS[name] }));
  }

  function triggerInjury() {
    perturb((state) => perturbInjury(state));
  }

  const thrombinHistory = history.map((h) => h.thrombin * 100);
  const thrombinHistoryBaseline = baseline.history?.map((h) => h.thrombin * 100) ?? null;
  const fibrinHistory = history.map((h) => h.fibrin * 100);
  const fibrinHistoryBaseline = baseline.history?.map((h) => h.fibrin * 100) ?? null;
  const plugHistory = history.map((h) => h.plateletPlug * 100);
  const plugHistoryBaseline = baseline.history?.map((h) => h.plateletPlug * 100) ?? null;

  return (
    <ModulePage
      title="Coagulation & Hemostasis"
      subtitle="the clotting cascade, PT/APTT & anticoagulants"
      accentVar="var(--fibrin)"
      presets={
        <PresetBar
          order={PRESET_ORDER}
          labels={COAG_PRESET_LABELS}
          onApply={handleApplyPreset}
          actions={[{ label: 'Injure vessel', onClick: triggerInjury, variant: 'danger' }]}
          onShare={shareLink}
          onReset={reset}
          disabled={session.blinded}
        />
      }
      diagram={<CoagulationDiagram derived={snapshot.derived} />}
      readouts={<ReadoutPanel derived={snapshot.derived} />}
      practice={<QuizPanel session={session} summary={summary} presetLabels={COAG_PRESET_LABELS} />}
      transport={<SimControls transport={transport} baseline={baseline} />}
      charts={
        <>
  <Sparkline label="Thrombin" unit="%" data={thrombinHistory} baselineData={thrombinHistoryBaseline} domainMin={0} domainMax={100} colorVar="var(--thrombin)" />
  <Sparkline label="Fibrin" unit="%" data={fibrinHistory} baselineData={fibrinHistoryBaseline} domainMin={0} domainMax={100} colorVar="var(--fibrin)" />
  <Sparkline label="Platelet plug" unit="%" data={plugHistory} baselineData={plugHistoryBaseline} domainMin={0} domainMax={100} colorVar="var(--platelet)" />
        </>
      }
      blindControls={session.blinded}
      controls={<ControlPanel inputs={inputs} onChange={handleChange} />}
      explainer={<ExplainerPanel content={coagulationContent} startCollapsed={session.phase !== 'idle'} />}
      footnote={'A simplified, conceptual model of haemostasis — not a clinical or diagnostic tool, and the clotting times are illustrative rather than calibrated to any particular laboratory\'s reagents. Pick a preset and read the PATTERN across PT, APTT, platelets and bleeding time rather than any single value — that combination is what localises the defect. Then click "Injure vessel" to fire the cascade and watch whether a clot actually forms: haemophilia has a perfectly normal PT and still fails to seal.'}
    />
  );
}
