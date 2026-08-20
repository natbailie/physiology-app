import { useState } from 'react';
import { useEngineLoop } from '@/shared/hooks/useEngineLoop';
import { CardiacDiagram } from './components/CardiacDiagram';
import { ReadoutPanel } from './components/ReadoutPanel';
import { ControlPanel } from './components/ControlPanel';
import { Sparkline } from '@/shared/components/Sparkline/Sparkline';
import { XYTrajectoryChart } from '@/shared/components/XYTrajectoryChart/XYTrajectoryChart';
import { ExplainerPanel } from '@/shared/components/ExplainerPanel/ExplainerPanel';
import { ModulePage } from '@/shared/components/ModulePage/ModulePage';
import { PresetBar } from '@/shared/components/PresetBar/PresetBar';
import { SimControls } from '@/shared/components/SimControls/SimControls';
import { cardiacElectroContent } from './content';
import { cardiacLoopConfig } from './engine/loopConfig';
import { CARDIAC_PRESETS, DEFAULT_CARDIAC_INPUTS, type CardiacPresetName, CARDIAC_PRESET_LABELS, PRESET_ORDER } from './engine/presets';
import type { CardiacInputs } from './engine/types';

export function CardiacElectroPage() {
  const [inputs, setInputs] = useState<CardiacInputs>(DEFAULT_CARDIAC_INPUTS);
  const { snapshot, history, reset, transport, baseline } = useEngineLoop(inputs, cardiacLoopConfig);

  function handleChange<K extends keyof CardiacInputs>(key: K, value: CardiacInputs[K]) {
    setInputs((prev) => ({ ...prev, [key]: value }));
  }

  function handleApplyPreset(name: CardiacPresetName) {
    setInputs((prev) => ({ ...prev, ...CARDIAC_PRESETS[name] }));
  }

  const pvPoints = history.map((h) => ({ x: h.lvVolume, y: h.lvPressure }));
  const pvPointsBaseline = baseline.history?.map((h) => ({ x: h.lvVolume, y: h.lvPressure })) ?? null;
  const ecgHistory = history.map((h) => h.ecgVoltage);
  const ecgHistoryBaseline = baseline.history?.map((h) => h.ecgVoltage) ?? null;

  return (
    <ModulePage
      title="Cardiac Cycle & PV Loop"
      subtitle="preload, afterload, contractility & the pressure-volume loop"
      accentVar="var(--pv-loop)"
      presets={
        <PresetBar
          order={PRESET_ORDER}
          labels={CARDIAC_PRESET_LABELS}
          onApply={handleApplyPreset}
          onReset={reset}
        />
      }
      diagram={<CardiacDiagram derived={snapshot.derived} />}
      readouts={<ReadoutPanel derived={snapshot.derived} />}
      transport={<SimControls transport={transport} baseline={baseline} />}
      charts={
        <>
  <XYTrajectoryChart
    points={pvPoints}
            baselinePoints={pvPointsBaseline}
    currentPoint={{ x: snapshot.derived.lvVolumeML, y: snapshot.derived.lvPressureMmHg }}
    xDomain={[0, 240]}
    yDomain={[0, 200]}
    colorVar="var(--pv-loop)"
    xLabel="LV volume (mL)"
    yLabel="LV pressure (mmHg)"
  />
  <Sparkline label="ECG" data={ecgHistory} baselineData={ecgHistoryBaseline} domainMin={-0.4} domainMax={1.2} colorVar="var(--conduction)" />
        </>
      }
      controls={<ControlPanel inputs={inputs} onChange={handleChange} />}
      explainer={<ExplainerPanel content={cardiacElectroContent} />}
      footnote={'A simplified, conceptual model of cardiac mechanics — not a clinical or diagnostic tool. The ECG trace here is a schematic of timing and sequence only, included to show when in the cycle each event falls; for a trace actually computed from the depolarisation sequence, see the ECG & Cardiac Conduction module. Change one lever at a time and watch which corner of the pressure-volume loop moves: preload widens it, afterload raises and narrows it, contractility lets it empty further left. Simulated time runs slower than real time so the four phases are distinguishable as the loop is traced.'}
    />
  );
}
