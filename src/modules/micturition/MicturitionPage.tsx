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
import { ExplainerPanel } from '@/shared/components/ExplainerPanel/ExplainerPanel';
import { BladderDiagram } from './components/Diagram';
import { ReadoutPanel } from './components/ReadoutPanel';
import { ControlPanel } from './components/ControlPanel';
import { MICTURITION_QUESTIONS } from './questions';
import { micturitionContent } from './content';
import { micturitionLoopConfig } from './engine/loopConfig';
import {
  MICTURITION_PRESETS,
  MICTURITION_PRESET_LABELS,
  MICTURITION_PRESET_ORDER,
  DEFAULT_MICTURITION_INPUTS,
} from './engine/presets';
import type { MicturitionInputs } from './engine/types';

export function MicturitionPage() {
  const { inputs, setInputs, shareLink } = useShareableInputs<MicturitionInputs>(
    'micturition',
    DEFAULT_MICTURITION_INPUTS,
  );
  const { snapshot, history, reset, transport, baseline } = useEngineLoop(
    inputs,
    micturitionLoopConfig,
  );
  const resetScenario = useScenarioReset({
    setInputs,
    defaults: DEFAULT_MICTURITION_INPUTS,
    resetEngine: reset,
    baseline,
    transport,
  });

  const { session, summary } = useModulePractice({
    moduleId: 'micturition',
    questions: MICTURITION_QUESTIONS,
    presets: MICTURITION_PRESETS,
    inputs,
    defaultInputs: DEFAULT_MICTURITION_INPUTS,
    setInputs,
    captureBaseline: baseline.capture,
    clearBaseline: baseline.clear,
    resetEngine: reset,
    perturbEngine: () => {},
    fastForwardEngine: () => {},
  });

  const handleChange = useInputSetter(setInputs);

  const applyPreset = useScenarioPreset({
    setInputs,
    defaults: DEFAULT_MICTURITION_INPUTS,
    presets: MICTURITION_PRESETS,
    resetEngine: reset,
  });

  const volumeHistory = useSeries(history, (h) => h.bladderVolumeML);
  const volumeHistoryBaseline = useSeries(baseline.history, (h) => h.bladderVolumeML);
  const pressureHistory = useSeries(history, (h) => h.intravesicalPressureCmH2O);
  const pressureHistoryBaseline = useSeries(baseline.history, (h) => h.intravesicalPressureCmH2O);
  const detrusorHistory = useSeries(history, (h) => h.detrusorTone);
  const detrusorHistoryBaseline = useSeries(baseline.history, (h) => h.detrusorTone);

  return (
    <ModulePage
      moduleId="micturition"
      title="Micturition"
      subtitle="bladder filling, storage and the voluntary control of voiding"
      accentVar="var(--o2)"
      presets={
        <PresetBar
          order={MICTURITION_PRESET_ORDER}
          labels={MICTURITION_PRESET_LABELS}
          onApply={applyPreset}
          onShare={shareLink}
          onReset={resetScenario}
          disabled={session.blinded}
        />
      }
      diagram={<BladderDiagram derived={snapshot.derived} />}
      readouts={<ReadoutPanel derived={snapshot.derived} />}
      practice={
        <QuizPanel
          session={session}
          summary={summary}
          presetLabels={MICTURITION_PRESET_LABELS}
        />
      }
      transport={<SimControls transport={transport} baseline={baseline} />}
      charts={
        <>
          <Sparkline
            label="Bladder volume"
            unit="mL"
            data={volumeHistory}
            baselineData={volumeHistoryBaseline}
            domainMin={0}
            domainMax={600}
            colorVar="var(--o2)"
          />
          <Sparkline
            label="Intravesical pressure"
            unit="cmH₂O"
            data={pressureHistory}
            baselineData={pressureHistoryBaseline}
            domainMin={0}
            domainMax={60}
            colorVar="var(--artery)"
          />
          <Sparkline
            label="Detrusor tone"
            data={detrusorHistory}
            baselineData={detrusorHistoryBaseline}
            domainMin={0}
            domainMax={1}
            colorVar="var(--danger)"
          />
        </>
      }
      blindControls={session.blinded}
      controls={<ControlPanel inputs={inputs} onChange={handleChange} />}
      explainer={
        <ExplainerPanel
          content={micturitionContent}
          startCollapsed={session.phase !== 'idle'}
        />
      }
      footnote="A simplified model of lower urinary tract physiology — not a clinical or diagnostic tool. The micturition reflex, autonomic innervation and voluntary sphincter control are represented as interacting tone variables. Real urodynamics involve complex pressure-flow relationships and multiple nerve pathways not captured here."
    />
  );
}
