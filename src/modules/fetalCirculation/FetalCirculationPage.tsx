import { useEngineLoop } from '@/shared/hooks/useEngineLoop';
import { useShareableInputs } from '@/shared/hooks/useShareableInputs';
import { ModulePage } from '@/shared/components/ModulePage/ModulePage';
import { PresetBar } from '@/shared/components/PresetBar/PresetBar';
import { SimControls } from '@/shared/components/SimControls/SimControls';
import { QuizPanel } from '@/shared/components/QuizPanel/QuizPanel';
import { useModulePractice } from '@/shared/assessment/useModulePractice';
import { Sparkline } from '@/shared/components/Sparkline/Sparkline';
import { FetalDiagram } from './components/FetalDiagram';
import { ReadoutPanel } from './components/ReadoutPanel';
import { ControlPanel } from './components/ControlPanel';
import { FETAL_QUESTIONS } from './questions';
import { ExplainerPanel } from '@/shared/components/ExplainerPanel/ExplainerPanel';
import { fetalCirculationContent } from './content';
import { fetalLoopConfig } from './engine/loopConfig';
import { perturbReopenDuct } from './engine/engine';
import {
  DEFAULT_FETAL_INPUTS,
  FETAL_PRESETS,
  FETAL_PRESET_LABELS,
  FETAL_PRESET_ORDER,
  type FetalPresetName,
} from './engine/presets';
import type { FetalInputs } from './engine/types';

export function FetalCirculationPage() {
  const { inputs, setInputs, shareLink } = useShareableInputs<FetalInputs>('fetalCirculation', DEFAULT_FETAL_INPUTS);
  const { snapshot, history, perturb, fastForward, reset, transport, baseline } = useEngineLoop(inputs, fetalLoopConfig);

  const { session, summary } = useModulePractice({
    moduleId: 'fetalCirculation',
    questions: FETAL_QUESTIONS,
    presets: FETAL_PRESETS,
    inputs,
    defaultInputs: DEFAULT_FETAL_INPUTS,
    setInputs,
    captureBaseline: baseline.capture,
    clearBaseline: baseline.clear,
    resetEngine: reset,
    perturbEngine: perturb,
    fastForwardEngine: fastForward,
  });

  function handleChange<K extends keyof FetalInputs>(key: K, value: FetalInputs[K]) {
    setInputs((prev) => ({ ...prev, [key]: value }));
  }

  function handleApplyPreset(name: FetalPresetName) {
    setInputs((prev) => ({ ...prev, ...FETAL_PRESETS[name] }));
  }

  const preHistory = history.map((h) => h.preDuctal);
  const preHistoryBaseline = baseline.history?.map((h) => h.preDuctal) ?? null;
  const postHistory = history.map((h) => h.postDuctal);
  const pvrHistory = history.map((h) => h.pvr);
  const pvrHistoryBaseline = baseline.history?.map((h) => h.pvr) ?? null;
  const ductusHistory = history.map((h) => h.ductus);
  const ductusHistoryBaseline = baseline.history?.map((h) => h.ductus) ?? null;
  const pulmonaryFlowHistory = history.map((h) => h.pulmonaryFlow);
  const pulmonaryFlowHistoryBaseline = baseline.history?.map((h) => h.pulmonaryFlow) ?? null;

  return (
    <ModulePage
      moduleId="fetalCirculation"
      title="Fetal & Neonatal Circulation"
      subtitle="two circulations in parallel, and the minute they become one"
      accentVar="var(--o2)"
      presets={
        <PresetBar
          order={FETAL_PRESET_ORDER}
          labels={FETAL_PRESET_LABELS}
          onApply={handleApplyPreset}
          actions={[{ label: 'Reopen duct', onClick: () => perturb(perturbReopenDuct), variant: 'impulse' }]}
          onShare={shareLink}
          onReset={reset}
          disabled={session.blinded}
        />
      }
      diagram={<FetalDiagram derived={snapshot.derived} />}
      readouts={<ReadoutPanel derived={snapshot.derived} />}
      practice={<QuizPanel session={session} summary={summary} presetLabels={FETAL_PRESET_LABELS} />}
      transport={<SimControls transport={transport} baseline={baseline} />}
      charts={
        <>
          <Sparkline
            label="Pre-ductal SpO₂"
            unit="%"
            data={preHistory}
            baselineData={preHistoryBaseline}
            secondaryData={postHistory}
            secondaryLabel="post-ductal"
            secondaryColorVar="var(--danger)"
            domainMin={20}
            domainMax={100}
            colorVar="var(--o2)"
          />
          <Sparkline
            label="Pulmonary resistance"
            unit="x"
            data={pvrHistory}
            baselineData={pvrHistoryBaseline}
            domainMin={0}
            domainMax={13}
            colorVar="var(--venous)"
          />
          <Sparkline
            label="Duct patency"
            unit="%"
            data={ductusHistory}
            baselineData={ductusHistoryBaseline}
            domainMin={0}
            domainMax={100}
            colorVar="var(--venous)"
          />
          <Sparkline
            label="Pulmonary flow"
            unit="%"
            data={pulmonaryFlowHistory}
            baselineData={pulmonaryFlowHistoryBaseline}
            domainMin={0}
            domainMax={100}
            colorVar="var(--o2)"
          />
        </>
      }
      blindControls={session.blinded}
      controls={<ControlPanel inputs={inputs} onChange={handleChange} />}
      explainer={<ExplainerPanel content={fetalCirculationContent} startCollapsed={session.phase !== 'idle'} />}
      footnote="A simplified, conceptual model of the fetal circulation and its transition — not a clinical or diagnostic tool. Flow is partitioned between the pulmonary bed and the duct by conductance rather than simulated beat by beat, and the atrial pressures are surrogates rather than waveforms. Simulated time runs faster than real life so ductal closure, which takes hours, is watchable. For the pulmonary vasoconstriction that keeps fetal resistance high, see the V/Q section of Respiratory Mechanics; for the shunt physiology in an adult circulation, see Shock States."
    />
  );
}
