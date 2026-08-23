import { useEngineLoop } from '@/shared/hooks/useEngineLoop';
import { useShareableInputs } from '@/shared/hooks/useShareableInputs';
import { GuytonDiagram } from './components/GuytonDiagram';
import { ReadoutPanel } from './components/ReadoutPanel';
import { ControlPanel } from './components/ControlPanel';
import { Sparkline } from '@/shared/components/Sparkline/Sparkline';
import { XYTrajectoryChart } from '@/shared/components/XYTrajectoryChart/XYTrajectoryChart';
import { VENOUS_RETURN_QUESTIONS } from './questions';
import { ExplainerPanel } from '@/shared/components/ExplainerPanel/ExplainerPanel';
import { ModulePage } from '@/shared/components/ModulePage/ModulePage';
import { PresetBar } from '@/shared/components/PresetBar/PresetBar';
import { SimControls } from '@/shared/components/SimControls/SimControls';
import { QuizPanel } from '@/shared/components/QuizPanel/QuizPanel';
import { useModulePractice } from '@/shared/assessment/useModulePractice';
import { venousReturnContent } from './content';
import { venousReturnLoopConfig } from './engine/loopConfig';
import { perturbHemorrhage, perturbTransfusion, perturbValsalva } from './engine/engine';
import {
  DEFAULT_VENOUS_RETURN_INPUTS,
  VENOUS_RETURN_PRESETS,
  VENOUS_RETURN_PRESET_LABELS,
  VENOUS_RETURN_PRESET_ORDER,
  type VenousReturnPresetName,
} from './engine/presets';
import { PLOT } from './engine/constants';
import type { VenousReturnInputs } from './engine/types';

export function VenousReturnPage() {
  const { inputs, setInputs, shareLink } = useShareableInputs<VenousReturnInputs>('venousReturn', DEFAULT_VENOUS_RETURN_INPUTS);
  const { snapshot, history, perturb, reset, transport, baseline } = useEngineLoop(inputs, venousReturnLoopConfig);

  const { session, summary } = useModulePractice({
    moduleId: 'venousReturn',
    questions: VENOUS_RETURN_QUESTIONS,
    presets: VENOUS_RETURN_PRESETS,
    setInputs,
    captureBaseline: baseline.capture,
    clearBaseline: baseline.clear,
    resetEngine: reset,
    perturbEngine: perturb,
  });
  const { derived } = snapshot;

  function handleChange<K extends keyof VenousReturnInputs>(key: K, value: VenousReturnInputs[K]) {
    setInputs((prev) => ({ ...prev, [key]: value }));
  }

  function handleApplyPreset(name: VenousReturnPresetName) {
    setInputs((prev) => ({ ...prev, ...VENOUS_RETURN_PRESETS[name] }));
  }

  return (
    <ModulePage
      moduleId="venousReturn"
      title="Venous Return & Cardiac Function Curves"
      subtitle="filling pressure, the two curves & where they cross"
      accentVar="var(--venous)"
      presets={
        <PresetBar
          order={VENOUS_RETURN_PRESET_ORDER}
          labels={VENOUS_RETURN_PRESET_LABELS}
          onApply={handleApplyPreset}
          actions={[
            { label: 'Transfuse 1 L', onClick: () => perturb((s) => perturbTransfusion(s)), variant: 'impulse' },
            { label: 'Valsalva', onClick: () => perturb((s) => perturbValsalva(s)), variant: 'impulse' },
            { label: 'Haemorrhage 1 L', onClick: () => perturb((s) => perturbHemorrhage(s)), variant: 'danger' },
          ]}
          onShare={shareLink}
          onReset={reset}
        />
      }
      diagram={<GuytonDiagram derived={derived} />}
      readouts={<ReadoutPanel derived={derived} />}
      practice={<QuizPanel session={session} summary={summary} />}
      transport={<SimControls transport={transport} baseline={baseline} />}
      charts={
        <>
          {/* The operating point's path through the same state space the diagram plots. */}
          <XYTrajectoryChart
            points={history.map((h) => ({ x: h.pra, y: h.cardiacOutput }))}
            currentPoint={{ x: derived.rightAtrialPressureMmHg, y: derived.cardiacOutputLPerMin }}
            xDomain={[PLOT.PRA_MIN, PLOT.PRA_MAX]}
            yDomain={[0, PLOT.MAX_FLOW_L_PER_MIN]}
            colorVar="var(--pv-loop)"
            xLabel="right atrial pressure"
            yLabel="cardiac output"
          />
          {/* While these two traces sit on top of each other the circulation is in steady state;
              wherever they separate, the atrium is filling or emptying. */}
          <Sparkline
            label="Cardiac output"
            secondaryLabel="venous return"
            unit="L/min"
            data={history.map((h) => h.cardiacOutput)}
            secondaryData={history.map((h) => h.venousReturn)}
            secondaryColorVar="var(--venous)"
            domainMin={0}
            domainMax={PLOT.MAX_FLOW_L_PER_MIN}
            colorVar="var(--artery)"
          />
          <Sparkline
            label="Right atrial pressure"
            unit="mmHg"
            data={history.map((h) => h.pra)}
            domainMin={PLOT.PRA_MIN}
            domainMax={PLOT.PRA_MAX}
            colorVar="var(--pv-loop)"
          />
          <Sparkline
            label="Mean systemic filling pressure"
            unit="mmHg"
            data={history.map((h) => h.meanSystemicFillingPressure)}
            domainMin={0}
            domainMax={20}
            colorVar="var(--venous)"
          />
        </>
      }
      controls={<ControlPanel inputs={inputs} onChange={handleChange} />}
      explainer={<ExplainerPanel content={venousReturnContent} startCollapsed={session.phase !== 'idle'} />}
      footnote={
        'A simplified, conceptual model of the systemic circulation — not a clinical tool. This module runs in real time: right atrial pressure is not solved for, it obeys mass balance, rising when venous return exceeds cardiac output and falling when it does not, so the crossing of the two curves emerges rather than being assumed. The Cardiorenal module deliberately uses the simpler MAP = CO x SVR shortcut instead; this is where that shortcut is unpacked.'
      }
    />
  );
}
