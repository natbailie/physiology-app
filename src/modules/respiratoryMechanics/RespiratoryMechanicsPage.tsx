import { useEngineLoop } from '@/shared/hooks/useEngineLoop';
import { useSeries } from '@/shared/hooks/useSeries';
import { useShareableInputs } from '@/shared/hooks/useShareableInputs';
import { useScenarioReset } from '@/shared/hooks/useScenarioReset';
import { useScenarioPreset } from '@/shared/hooks/useScenarioPreset';
import { useInputSetter } from '@/shared/hooks/useInputSetter';
import { RespMechDiagram } from './components/RespMechDiagram';
import { ReadoutPanel } from './components/ReadoutPanel';
import { ControlPanel } from './components/ControlPanel';
import { Sparkline } from '@/shared/components/Sparkline/Sparkline';
import { XYTrajectoryChart } from '@/shared/components/XYTrajectoryChart/XYTrajectoryChart';
import { RESP_MECH_QUESTIONS } from './questions';
import { ExplainerPanel } from '@/shared/components/ExplainerPanel/ExplainerPanel';
import { ModulePage } from '@/shared/components/ModulePage/ModulePage';
import { PresetBar } from '@/shared/components/PresetBar/PresetBar';
import { SimControls } from '@/shared/components/SimControls/SimControls';
import { QuizPanel } from '@/shared/components/QuizPanel/QuizPanel';
import { QuestionSet } from '@/shared/components/QuestionSet/QuestionSet';
import { useModulePractice } from '@/shared/assessment/useModulePractice';
import { respiratoryMechanicsContent } from './content';
import { respMechLoopConfig } from './engine/loopConfig';
import { perturbFvcManeuver } from './engine/engine';
import { DEFAULT_RESP_MECH_INPUTS, RESP_MECH_PRESETS, RESP_MECH_PRESET_LABELS, PRESET_ORDER } from './engine/presets';
import type { RespMechInputs } from './engine/types';

export function RespiratoryMechanicsPage() {
  const { inputs, setInputs, shareLink } = useShareableInputs<RespMechInputs>('respiratoryMechanics', DEFAULT_RESP_MECH_INPUTS);
  const { snapshot, history, perturb, fastForward, reset, transport, baseline } = useEngineLoop(inputs, respMechLoopConfig);
  const resetScenario = useScenarioReset({
    setInputs,
    defaults: DEFAULT_RESP_MECH_INPUTS,
    resetEngine: reset,
    baseline,
    transport,
  });

  const { session, summary } = useModulePractice({
    moduleId: 'respiratoryMechanics',
    questions: RESP_MECH_QUESTIONS,
    presets: RESP_MECH_PRESETS,
    inputs,
    defaultInputs: DEFAULT_RESP_MECH_INPUTS,
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
    defaults: DEFAULT_RESP_MECH_INPUTS,
    presets: RESP_MECH_PRESETS,
    resetEngine: reset,
  });

  function triggerFvcManeuver() {
    perturb((state) => perturbFvcManeuver(state));
  }

  // Flow-volume loop: expiratory flow against lung volume, the same trajectory chart the
  // cardiac module uses for its PV loop.
  const flowVolumePoints = useSeries(history, (h) => ({ x: h.lungVolume / 1000, y: h.airflow / 1000 }));
  const flowVolumePointsBaseline = useSeries(baseline.history, (h) => ({ x: h.lungVolume / 1000, y: h.airflow / 1000 }));
  const volumeHistory = useSeries(history, (h) => h.lungVolume / 1000);
  const volumeHistoryBaseline = useSeries(baseline.history, (h) => h.lungVolume / 1000);

  return (
    <ModulePage
      historyCapacity={respMechLoopConfig.historyCapacity}
      moduleId="respiratoryMechanics"
      title="Respiratory Mechanics & Spirometry"
      subtitle="lung volumes, compliance & V/Q matching"
      accentVar="var(--compliance)"
      presets={
        <PresetBar
          order={PRESET_ORDER}
          labels={RESP_MECH_PRESET_LABELS}
          onApply={applyPreset}
          actions={[{ label: 'FVC maneuver', onClick: triggerFvcManeuver, variant: 'impulse' }]}
          onShare={shareLink}
          onReset={resetScenario}
        />
      }
      diagram={<RespMechDiagram derived={snapshot.derived} />}
      readouts={<ReadoutPanel derived={snapshot.derived} />}
      questions={
        <QuestionSet
          count={RESP_MECH_QUESTIONS.length}
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
  <XYTrajectoryChart
    points={flowVolumePoints}
            baselinePoints={flowVolumePointsBaseline}
    currentPoint={{ x: snapshot.derived.lungVolumeML / 1000, y: snapshot.derived.airflowMLPerSec / 1000 }}
    xDomain={[0, 8]}
    yDomain={[-4, 10]}
    colorVar="var(--resistance)"
    xLabel="volume (L)"
    yLabel="flow (L/s)"
  />
  <Sparkline label="Lung volume" unit="L" data={volumeHistory} baselineData={volumeHistoryBaseline} domainMin={0} domainMax={8} colorVar="var(--compliance)" />
        </>
      }
      controls={<ControlPanel inputs={inputs} onChange={handleChange} />}
      blindControls={session.blinded}
      explainer={<ExplainerPanel content={respiratoryMechanicsContent} startCollapsed={session.phase !== 'idle'} />}
      footnote={'A simplified, conceptual model of lung mechanics — not a clinical or diagnostic tool. Click "FVC maneuver" to run a forced expiration and trace the flow-volume loop; compare the scooped obstructive loop of COPD with the narrow but normally-shaped restrictive loop of fibrosis. Then contrast the "Pulmonary embolism" and "Pneumonia" presets and watch hypoxic pulmonary vasoconstriction engage for the shunt but do nothing at all for the dead space.'}
    />
  );
}
