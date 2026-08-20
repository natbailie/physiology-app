import { useState } from 'react';
import { useEngineLoop } from '@/shared/hooks/useEngineLoop';
import { RespiratoryDiagram } from './components/RespiratoryDiagram';
import { ReadoutPanel } from './components/ReadoutPanel';
import { ControlPanel } from './components/ControlPanel';
import { Sparkline } from '@/shared/components/Sparkline/Sparkline';
import { OxygenDissociationCurve } from '@/shared/components/OxygenDissociationCurve/OxygenDissociationCurve';
import { RESPIRATORY_QUESTIONS } from './questions';
import { ExplainerPanel } from '@/shared/components/ExplainerPanel/ExplainerPanel';
import { ModulePage } from '@/shared/components/ModulePage/ModulePage';
import { PresetBar } from '@/shared/components/PresetBar/PresetBar';
import { SimControls } from '@/shared/components/SimControls/SimControls';
import { QuizPanel } from '@/shared/components/QuizPanel/QuizPanel';
import { useModulePractice } from '@/shared/assessment/useModulePractice';
import { respiratoryContent } from './content';
import { respiratoryLoopConfig } from './engine/loopConfig';
import { perturbAirwayObstruction } from './engine/engine';
import { saO2 } from './engine/gasExchange';
import { DEFAULT_RESP_INPUTS, RESP_PRESETS, type RespPresetName, RESP_PRESET_LABELS, PRESET_ORDER } from './engine/presets';
import type { RespInputs } from './engine/types';

export function RespiratoryPage() {
  const [inputs, setInputs] = useState<RespInputs>(DEFAULT_RESP_INPUTS);
  const { snapshot, history, perturb, reset, transport, baseline } = useEngineLoop(inputs, respiratoryLoopConfig);

  const { session, summary } = useModulePractice({
    moduleId: 'respiratory',
    questions: RESPIRATORY_QUESTIONS,
    presets: RESP_PRESETS,
    setInputs,
    captureBaseline: baseline.capture,
    clearBaseline: baseline.clear,
    resetEngine: reset,
  });

  function handleChange<K extends keyof RespInputs>(key: K, value: RespInputs[K]) {
    setInputs((prev) => ({ ...prev, [key]: value }));
  }

  function handleApplyPreset(name: RespPresetName) {
    setInputs((prev) => ({ ...prev, ...RESP_PRESETS[name] }));
  }

  function triggerBronchospasm() {
    perturb((state) => perturbAirwayObstruction(state));
  }

  const pHHistory = history.map((h) => h.pH);
  const pHHistoryBaseline = baseline.history?.map((h) => h.pH) ?? null;
  const paCO2History = history.map((h) => h.paCO2);
  const paCO2HistoryBaseline = baseline.history?.map((h) => h.paCO2) ?? null;
  const saO2History = history.map((h) => h.saO2);
  const saO2HistoryBaseline = baseline.history?.map((h) => h.saO2) ?? null;

  return (
    <ModulePage
      title="Respiratory & Acid-Base"
      subtitle="ventilation, gas exchange & acid-base feedback simulator"
      accentVar="var(--o2)"
      presets={
        <PresetBar
          order={PRESET_ORDER}
          labels={RESP_PRESET_LABELS}
          onApply={handleApplyPreset}
          actions={[{ label: 'Bronchospasm', onClick: triggerBronchospasm, variant: 'danger' }]}
          onReset={reset}
        />
      }
      diagram={<RespiratoryDiagram derived={snapshot.derived} />}
      readouts={<ReadoutPanel derived={snapshot.derived} />}
      practice={<QuizPanel session={session} summary={summary} />}
      transport={<SimControls transport={transport} baseline={baseline} />}
      charts={
        <>
  <Sparkline label="pH" data={pHHistory} baselineData={pHHistoryBaseline} domainMin={6.9} domainMax={7.7} colorVar="var(--ph)" />
  <Sparkline label="PaCO2" unit="mmHg" data={paCO2History} baselineData={paCO2HistoryBaseline} domainMin={10} domainMax={100} colorVar="var(--co2)" />
  <Sparkline label="SaO2" unit="%" data={saO2History} baselineData={saO2HistoryBaseline} domainMin={0} domainMax={100} colorVar="var(--o2)" />
  <OxygenDissociationCurve
    curveFn={saO2}
    currentX={snapshot.derived.paO2}
    currentY={snapshot.derived.saO2}
    xDomain={[0, 120]}
    yDomain={[0, 100]}
    colorVar="var(--o2)"
    xLabel="PaO2 (mmHg)"
    yLabel="SaO2 (%)"
  />
        </>
      }
      controls={<ControlPanel inputs={inputs} onChange={handleChange} />}
      explainer={<ExplainerPanel content={respiratoryContent} />}
      footnote={'A simplified, conceptual model of respiratory and acid-base physiology — not a clinical or diagnostic tool. Simulated time runs faster than real time so chemoreceptor responses (seconds-minutes) and renal compensation (physiologically days) are both watchable within roughly a minute.'}
    />
  );
}
