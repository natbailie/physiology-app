import { useEngineLoop } from '@/shared/hooks/useEngineLoop';
import { useSeries } from '@/shared/hooks/useSeries';
import { useShareableInputs } from '@/shared/hooks/useShareableInputs';
import { useScenarioReset } from '@/shared/hooks/useScenarioReset';
import { useScenarioPreset } from '@/shared/hooks/useScenarioPreset';
import { useInputSetter } from '@/shared/hooks/useInputSetter';
import { useInputNudge } from '@/shared/hooks/useInputNudge';
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
import { QuestionSet } from '@/shared/components/QuestionSet/QuestionSet';
import { useModulePractice } from '@/shared/assessment/useModulePractice';
import { venousReturnContent } from './content';
import { venousReturnLoopConfig } from './engine/loopConfig';
import { perturbValsalva } from './engine/engine';
import { VENOUS_RETURN_CONTROLS } from './presentation';
import {
  DEFAULT_VENOUS_RETURN_INPUTS,
  VENOUS_RETURN_PRESETS,
  VENOUS_RETURN_PRESET_LABELS,
  VENOUS_RETURN_PRESET_ORDER,
} from './engine/presets';
import { PLOT } from './engine/constants';
import type { VenousReturnInputs } from './engine/types';

export function VenousReturnPage() {
  const { inputs, setInputs, shareLink } = useShareableInputs<VenousReturnInputs>('venousReturn', DEFAULT_VENOUS_RETURN_INPUTS);
  const { snapshot, history, perturb, fastForward, reset, transport, baseline } = useEngineLoop(inputs, venousReturnLoopConfig);
  const resetScenario = useScenarioReset({
    setInputs,
    defaults: DEFAULT_VENOUS_RETURN_INPUTS,
    resetEngine: reset,
    baseline,
    transport,
  });

  const { session, summary } = useModulePractice({
    moduleId: 'venousReturn',
    questions: VENOUS_RETURN_QUESTIONS,
    presets: VENOUS_RETURN_PRESETS,
    inputs,
    defaultInputs: DEFAULT_VENOUS_RETURN_INPUTS,
    setInputs,
    captureBaseline: baseline.capture,
    clearBaseline: baseline.clear,
    resetEngine: reset,
    perturbEngine: perturb,
    fastForwardEngine: fastForward,
  });
  const { derived } = snapshot;
  const guytonPoints = useSeries(history, (h) => ({ x: h.pra, y: h.cardiacOutput }));
  const cardiacOutputHistory = useSeries(history, (h) => h.cardiacOutput);
  const venousReturnHistory = useSeries(history, (h) => h.venousReturn);
  const praHistory = useSeries(history, (h) => h.pra);
  const msfpHistory = useSeries(history, (h) => h.meanSystemicFillingPressure);

  const handleChange = useInputSetter(setInputs);
  // Blood lost or given is a standing change and moves the slider; a Valsalva is not, and does not.
  // That split is the whole distinction this rail was hiding — `volumeOffsetMl` carried the litre
  // forever while the blood-volume slider went on reading 5000, and the intrathoracic surge decays
  // to nothing in four seconds, which is right for a manoeuvre and wrong for a haemorrhage.
  const nudge = useInputNudge(setInputs, VENOUS_RETURN_CONTROLS);

  const applyPreset = useScenarioPreset({
    setInputs,
    defaults: DEFAULT_VENOUS_RETURN_INPUTS,
    presets: VENOUS_RETURN_PRESETS,
    resetEngine: reset,
  });

  return (
    <ModulePage
      historyCapacity={venousReturnLoopConfig.historyCapacity}
      moduleId="venousReturn"
      title="Venous Return & Cardiac Function Curves"
      subtitle="filling pressure, the two curves & where they cross"
      accentVar="var(--venous)"
      presets={
        <PresetBar
          order={VENOUS_RETURN_PRESET_ORDER}
          labels={VENOUS_RETURN_PRESET_LABELS}
          onApply={applyPreset}
          actions={[
            { label: 'Transfuse 1 L', onClick: () => nudge({ bloodVolumeMl: 1000 }), variant: 'impulse' },
            { label: 'Valsalva', onClick: () => perturb((s) => perturbValsalva(s)), variant: 'impulse' },
            { label: 'Haemorrhage 1 L', onClick: () => nudge({ bloodVolumeMl: -1000 }), variant: 'danger' },
          ]}
          onShare={shareLink}
          onReset={resetScenario}
        />
      }
      diagram={<GuytonDiagram derived={derived} />}
      readouts={<ReadoutPanel derived={derived} inputs={inputs} />}
      questions={
        <QuestionSet
          count={VENOUS_RETURN_QUESTIONS.length}
          beds={[]}
          schedule={summary.schedule}
          snapshot={snapshot}
          question={session.question}
        >
          <QuizPanel session={session} summary={summary} />
        </QuestionSet>
      }
      transport={<SimControls transport={transport} baseline={baseline} />}
      charts={
        <>
          {/* The operating point's path through the same state space the diagram plots. */}
          <XYTrajectoryChart
            points={guytonPoints}
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
            data={cardiacOutputHistory}
            secondaryData={venousReturnHistory}
            secondaryColorVar="var(--venous)"
            domainMin={0}
            domainMax={PLOT.MAX_FLOW_L_PER_MIN}
            colorVar="var(--artery)"
          />
          <Sparkline
            label="Right atrial pressure"
            unit="mmHg"
            data={praHistory}
            domainMin={PLOT.PRA_MIN}
            domainMax={PLOT.PRA_MAX}
            colorVar="var(--pv-loop)"
          />
          <Sparkline
            label="Mean systemic filling pressure"
            unit="mmHg"
            data={msfpHistory}
            domainMin={0}
            domainMax={20}
            colorVar="var(--venous)"
          />
        </>
      }
      controls={<ControlPanel inputs={inputs} onChange={handleChange} />}
      blindControls={session.blinded}
      explainer={<ExplainerPanel content={venousReturnContent} startCollapsed={session.phase !== 'idle'} />}
      footnote={
        'A simplified, conceptual model of the systemic circulation — not a clinical tool. This module runs in real time: right atrial pressure is not solved for, it obeys mass balance, rising when venous return exceeds cardiac output and falling when it does not, so the crossing of the two curves emerges rather than being assumed. The Cardiorenal module deliberately uses the simpler MAP = CO x SVR shortcut instead; this is where that shortcut is unpacked.'
      }
    />
  );
}
