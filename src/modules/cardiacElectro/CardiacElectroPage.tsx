import { useEngineLoop } from '@/shared/hooks/useEngineLoop';
import { useSeries } from '@/shared/hooks/useSeries';
import { useShareableInputs } from '@/shared/hooks/useShareableInputs';
import { useScenarioReset } from '@/shared/hooks/useScenarioReset';
import { useScenarioPreset } from '@/shared/hooks/useScenarioPreset';
import { useInputSetter } from '@/shared/hooks/useInputSetter';
import { CardiacDiagram } from './components/CardiacDiagram';
import { ReadoutPanel } from './components/ReadoutPanel';
import { ControlPanel } from './components/ControlPanel';
import { Sparkline } from '@/shared/components/Sparkline/Sparkline';
import { XYTrajectoryChart } from '@/shared/components/XYTrajectoryChart/XYTrajectoryChart';
import { CARDIAC_QUESTIONS } from './questions';
import { ExplainerPanel } from '@/shared/components/ExplainerPanel/ExplainerPanel';
import { ModulePage } from '@/shared/components/ModulePage/ModulePage';
import { PresetBar } from '@/shared/components/PresetBar/PresetBar';
import { SimControls } from '@/shared/components/SimControls/SimControls';
import { QuizPanel } from '@/shared/components/QuizPanel/QuizPanel';
import { useModulePractice } from '@/shared/assessment/useModulePractice';
import { cardiacElectroContent } from './content';
import { cardiacLoopConfig } from './engine/loopConfig';
import { CARDIAC_PRESETS, DEFAULT_CARDIAC_INPUTS, CARDIAC_PRESET_LABELS, PRESET_ORDER } from './engine/presets';
import type { CardiacInputs } from './engine/types';

export function CardiacElectroPage() {
  const { inputs, setInputs, shareLink } = useShareableInputs<CardiacInputs>('cardiacElectro', DEFAULT_CARDIAC_INPUTS);
  const { snapshot, history, perturb, fastForward, reset, transport, baseline } = useEngineLoop(inputs, cardiacLoopConfig);
  const resetScenario = useScenarioReset({
    setInputs,
    defaults: DEFAULT_CARDIAC_INPUTS,
    resetEngine: reset,
    baseline,
    transport,
  });

  const { session, summary } = useModulePractice({
    moduleId: 'cardiacElectro',
    questions: CARDIAC_QUESTIONS,
    presets: CARDIAC_PRESETS,
    inputs,
    defaultInputs: DEFAULT_CARDIAC_INPUTS,
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
    defaults: DEFAULT_CARDIAC_INPUTS,
    presets: CARDIAC_PRESETS,
    resetEngine: reset,
  });

  const pvPoints = useSeries(history, (h) => ({ x: h.lvVolume, y: h.lvPressure }));
  const pvPointsBaseline = useSeries(baseline.history, (h) => ({ x: h.lvVolume, y: h.lvPressure }));
  const ecgHistory = useSeries(history, (h) => h.ecgVoltage);
  const ecgHistoryBaseline = useSeries(baseline.history, (h) => h.ecgVoltage);

  return (
    <ModulePage
      moduleId="cardiacElectro"
      title="Cardiac Cycle & PV Loop"
      subtitle="preload, afterload, contractility & the pressure-volume loop"
      accentVar="var(--pv-loop)"
      presets={
        <PresetBar
          order={PRESET_ORDER}
          labels={CARDIAC_PRESET_LABELS}
          onApply={applyPreset}
          onShare={shareLink}
          onReset={resetScenario}
        />
      }
      diagram={<CardiacDiagram derived={snapshot.derived} />}
      readouts={<ReadoutPanel derived={snapshot.derived} inputs={inputs} />}
      practice={<QuizPanel session={session} summary={summary} />}
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
      explainer={<ExplainerPanel content={cardiacElectroContent} startCollapsed={session.phase !== 'idle'} />}
      footnote={'A simplified, conceptual model of cardiac mechanics — not a clinical or diagnostic tool. The ECG trace here is a schematic of timing and sequence only, included to show when in the cycle each event falls; for a trace actually computed from the depolarisation sequence, see the ECG & Cardiac Conduction module. Change one lever at a time and watch which corner of the pressure-volume loop moves: preload widens it, afterload raises and narrows it, contractility lets it empty further left. Simulated time runs slower than real time so the four phases are distinguishable as the loop is traced.'}
    />
  );
}
