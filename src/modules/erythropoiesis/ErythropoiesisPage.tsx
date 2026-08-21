import { useState } from 'react';
import { useEngineLoop } from '@/shared/hooks/useEngineLoop';
import { ErythropoiesisDiagram } from './components/ErythropoiesisDiagram';
import { ReadoutPanel } from './components/ReadoutPanel';
import { ControlPanel } from './components/ControlPanel';
import { Sparkline } from '@/shared/components/Sparkline/Sparkline';
import { ERYTHROPOIESIS_QUESTIONS } from './questions';
import { ExplainerPanel } from '@/shared/components/ExplainerPanel/ExplainerPanel';
import { ModulePage } from '@/shared/components/ModulePage/ModulePage';
import { PresetBar } from '@/shared/components/PresetBar/PresetBar';
import { SimControls } from '@/shared/components/SimControls/SimControls';
import { QuizPanel } from '@/shared/components/QuizPanel/QuizPanel';
import { useModulePractice } from '@/shared/assessment/useModulePractice';
import { erythropoiesisContent } from './content';
import { erythroLoopConfig } from './engine/loopConfig';
import { perturbAcuteBloodLoss } from './engine/engine';
import { DEFAULT_ERYTHRO_INPUTS, ERYTHRO_PRESETS, type ErythroPresetName, ERYTHRO_PRESET_LABELS, PRESET_ORDER } from './engine/presets';
import type { ErythroInputs } from './engine/types';

export function ErythropoiesisPage() {
  const [inputs, setInputs] = useState<ErythroInputs>(DEFAULT_ERYTHRO_INPUTS);
  const { snapshot, history, perturb, reset, transport, baseline } = useEngineLoop(inputs, erythroLoopConfig);

  const { session, summary } = useModulePractice({
    moduleId: 'erythropoiesis',
    questions: ERYTHROPOIESIS_QUESTIONS,
    presets: ERYTHRO_PRESETS,
    setInputs,
    captureBaseline: baseline.capture,
    clearBaseline: baseline.clear,
    resetEngine: reset,
    perturbEngine: perturb,
  });

  function handleChange<K extends keyof ErythroInputs>(key: K, value: ErythroInputs[K]) {
    setInputs((prev) => ({ ...prev, [key]: value }));
  }

  function handleApplyPreset(name: ErythroPresetName) {
    setInputs((prev) => ({ ...prev, ...ERYTHRO_PRESETS[name] }));
  }

  function triggerAcuteBleed() {
    perturb((state) => perturbAcuteBloodLoss(state));
  }

  const hbHistory = history.map((h) => h.hemoglobin);
  const hbHistoryBaseline = baseline.history?.map((h) => h.hemoglobin) ?? null;
  const epoHistory = history.map((h) => h.epo * 100);
  const epoHistoryBaseline = baseline.history?.map((h) => h.epo * 100) ?? null;
  const reticHistory = history.map((h) => h.reticulocyteIndex);
  const reticHistoryBaseline = baseline.history?.map((h) => h.reticulocyteIndex) ?? null;

  return (
    <ModulePage
      title="Erythropoiesis & Anemia"
      subtitle="EPO feedback, iron & B12, and classifying an anemia"
      accentVar="var(--hemoglobin)"
      presets={
        <PresetBar
          order={PRESET_ORDER}
          labels={ERYTHRO_PRESET_LABELS}
          onApply={handleApplyPreset}
          actions={[{ label: 'Acute bleed', onClick: triggerAcuteBleed, variant: 'danger' }]}
          onReset={reset}
          disabled={session.blinded}
        />
      }
      diagram={<ErythropoiesisDiagram derived={snapshot.derived} />}
      readouts={<ReadoutPanel derived={snapshot.derived} />}
      practice={<QuizPanel session={session} summary={summary} presetLabels={ERYTHRO_PRESET_LABELS} />}
      transport={<SimControls transport={transport} baseline={baseline} />}
      charts={
        <>
  <Sparkline label="Hemoglobin" unit="g/dL" data={hbHistory} baselineData={hbHistoryBaseline} domainMin={3} domainMax={22} colorVar="var(--hemoglobin)" />
  <Sparkline label="EPO" unit="%" data={epoHistory} baselineData={epoHistoryBaseline} domainMin={0} domainMax={100} colorVar="var(--epo)" />
  <Sparkline label="Retic index" data={reticHistory} baselineData={reticHistoryBaseline} domainMin={0} domainMax={6} colorVar="var(--marrow)" />
        </>
      }
      blindControls={session.blinded}
      controls={<ControlPanel inputs={inputs} onChange={handleChange} />}
      explainer={<ExplainerPanel content={erythropoiesisContent} startCollapsed={session.phase !== 'idle'} />}
      footnote={'A simplified, conceptual model of red cell production — not a clinical or diagnostic tool. Compare the presets on MCV and reticulocyte index together rather than on haemoglobin alone: that pair is what classifies an anemia. Aplastic anemia and anemia of CKD both show a low retic index, but only CKD has a LOW EPO to go with it. Simulated time is heavily compressed, since erythropoiesis plays out over weeks — try "Acute bleed" and watch the reticulocyte response lag behind the fall in haemoglobin before it catches up.'}
    />
  );
}
