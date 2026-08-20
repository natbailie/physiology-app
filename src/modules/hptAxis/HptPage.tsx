import { useState } from 'react';
import { useEngineLoop } from '@/shared/hooks/useEngineLoop';
import { HptDiagram } from './components/HptDiagram';
import { ReadoutPanel } from './components/ReadoutPanel';
import { ControlPanel } from './components/ControlPanel';
import { Sparkline } from '@/shared/components/Sparkline/Sparkline';
import { ExplainerPanel } from '@/shared/components/ExplainerPanel/ExplainerPanel';
import { ModulePage } from '@/shared/components/ModulePage/ModulePage';
import { PresetBar } from '@/shared/components/PresetBar/PresetBar';
import { SimControls } from '@/shared/components/SimControls/SimControls';
import { hptAxisContent } from './content';
import { hptLoopConfig } from './engine/loopConfig';
import { perturbAcuteIllness } from './engine/engine';
import { DEFAULT_HPT_INPUTS, HPT_PRESETS, type HptPresetName, HPT_PRESET_LABELS, PRESET_ORDER } from './engine/presets';
import type { HptInputs } from './engine/types';

export function HptPage() {
  const [inputs, setInputs] = useState<HptInputs>(DEFAULT_HPT_INPUTS);
  const { snapshot, history, perturb, reset, transport, baseline } = useEngineLoop(inputs, hptLoopConfig);

  function handleChange<K extends keyof HptInputs>(key: K, value: HptInputs[K]) {
    setInputs((prev) => ({ ...prev, [key]: value }));
  }

  function handleApplyPreset(name: HptPresetName) {
    setInputs((prev) => ({ ...prev, ...HPT_PRESETS[name] }));
  }

  function triggerAcuteIllness() {
    perturb((state) => perturbAcuteIllness(state));
  }

  const tshHistory = history.map((h) => h.tsh);
  const tshHistoryBaseline = baseline.history?.map((h) => h.tsh) ?? null;
  const t4History = history.map((h) => h.t4);
  const t4HistoryBaseline = baseline.history?.map((h) => h.t4) ?? null;
  const t3History = history.map((h) => h.t3);
  const t3HistoryBaseline = baseline.history?.map((h) => h.t3) ?? null;

  return (
    <ModulePage
      title="Thyroid (HPT) Axis"
      subtitle="TSH, T4/T3 & thyroid function test interpretation simulator"
      accentVar="var(--thyroid)"
      presets={
        <PresetBar
          order={PRESET_ORDER}
          labels={HPT_PRESET_LABELS}
          onApply={handleApplyPreset}
          actions={[{ label: 'Acute illness', onClick: triggerAcuteIllness, variant: 'danger' }]}
          onReset={reset}
        />
      }
      diagram={<HptDiagram derived={snapshot.derived} />}
      readouts={<ReadoutPanel derived={snapshot.derived} />}
      transport={<SimControls transport={transport} baseline={baseline} />}
      charts={
        <>
  <Sparkline label="TSH" unit="%" data={tshHistory} baselineData={tshHistoryBaseline} domainMin={0} domainMax={100} colorVar="var(--tsh)" />
  <Sparkline label="T4" unit="µg/dL" data={t4History} baselineData={t4HistoryBaseline} domainMin={0} domainMax={30} colorVar="var(--thyroid)" />
  <Sparkline label="T3" unit="ng/dL*" data={t3History} baselineData={t3HistoryBaseline} domainMin={0} domainMax={250} colorVar="var(--thyroid)" />
        </>
      }
      controls={<ControlPanel inputs={inputs} onChange={handleChange} />}
      explainer={<ExplainerPanel content={hptAxisContent} />}
      footnote={'A simplified, conceptual model of thyroid axis physiology — not a clinical or diagnostic tool. T3 is shown in normalized units (baseline ≈ 90-100), not literal ng/dL. Simulated time runs much faster than real time so T4\'s week-long turnover is compressed to be watchable within a session.'}
    />
  );
}
