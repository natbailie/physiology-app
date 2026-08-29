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
import { CellCycleRing } from './components/CellCycleRing';
import { CellCycleReadoutPanel } from './components/CellCycleReadoutPanel';
import { CellCycleControlPanel } from './components/CellCycleControlPanel';
import { CELL_CYCLE_QUESTIONS } from './questions';
import { ExplainerPanel } from '@/shared/components/ExplainerPanel/ExplainerPanel';
import { cellCycleContent } from './content';
import { cellCycleLoopConfig } from './engine/loopConfig';
import {
  DEFAULT_CELL_CYCLE_INPUTS,
  CELL_CYCLE_PRESETS,
  CELL_CYCLE_PRESET_LABELS,
  CELL_CYCLE_PRESET_ORDER,
} from './engine/presets';
import type { CellCycleInputs } from './engine/types';

export function CellCyclePage() {
  const { inputs, setInputs, shareLink } = useShareableInputs<CellCycleInputs>('cellCycle', DEFAULT_CELL_CYCLE_INPUTS);
  const { snapshot, history, perturb, fastForward, reset, transport, baseline } = useEngineLoop(inputs, cellCycleLoopConfig);
  const resetScenario = useScenarioReset({
    setInputs,
    defaults: DEFAULT_CELL_CYCLE_INPUTS,
    resetEngine: reset,
    baseline,
    transport,
  });

  const { session, summary } = useModulePractice({
    moduleId: 'cellCycle',
    questions: CELL_CYCLE_QUESTIONS,
    presets: CELL_CYCLE_PRESETS,
    inputs,
    defaultInputs: DEFAULT_CELL_CYCLE_INPUTS,
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
    defaults: DEFAULT_CELL_CYCLE_INPUTS,
    presets: CELL_CYCLE_PRESETS,
    resetEngine: reset,
  });

  const cyclingHistory = useSeries(history, (h) => h.cyclingRatePct);
  const cyclingBaseline = useSeries(baseline.history, (h) => h.cyclingRatePct);
  const lesionHistory = useSeries(history, (h) => h.lesionLoadPct);
  const lesionBaseline = useSeries(baseline.history, (h) => h.lesionLoadPct);

  return (
    <ModulePage
      moduleId="cellCycle"
      title="Cell Cycle & Checkpoints"
      subtitle="four phases, three checkpoints, and every cancer drug names one of them"
      accentVar="var(--o2)"
      presets={
        <PresetBar
          order={CELL_CYCLE_PRESET_ORDER}
          labels={CELL_CYCLE_PRESET_LABELS}
          onApply={applyPreset}
          onShare={shareLink}
          onReset={resetScenario}
          disabled={session.blinded}
        />
      }
      diagram={<CellCycleRing derived={snapshot.derived} />}
      readouts={<CellCycleReadoutPanel derived={snapshot.derived} />}
      practice={<QuizPanel session={session} summary={summary} presetLabels={CELL_CYCLE_PRESET_LABELS} />}
      transport={<SimControls transport={transport} baseline={baseline} />}
      charts={
        <>
          <Sparkline
            label="Cycling population"
            unit="%"
            data={cyclingHistory}
            baselineData={cyclingBaseline}
            domainMin={0}
            domainMax={100}
            colorVar="var(--conduction-path)"
          />
          <Sparkline
            label="Lesion load"
            unit="%"
            data={lesionHistory}
            baselineData={lesionBaseline}
            domainMin={0}
            domainMax={100}
            colorVar="var(--danger)"
          />
        </>
      }
      blindControls={session.blinded}
      controls={<CellCycleControlPanel inputs={inputs} onChange={handleChange} />}
      explainer={<ExplainerPanel content={cellCycleContent} startCollapsed={session.phase !== 'idle'} />}
      footnote="A single-cohort conceptual model of the four-phase cycle with p53/RB checkpoint logic — not a clinical or diagnostic tool. Population heterogeneity, G2 length variation between cells, senescence as a distinct fate, and the biochemistry of individual cyclin-CDK complexes are outside its scope; arrest locations and drug classes follow textbook phase specificity. One real second represents one simulated hour."
    />
  );
}
