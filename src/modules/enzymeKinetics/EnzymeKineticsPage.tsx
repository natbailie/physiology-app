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
import { QuestionSet } from '@/shared/components/QuestionSet/QuestionSet';
import { useModulePractice } from '@/shared/assessment/useModulePractice';
import { Sparkline } from '@/shared/components/Sparkline/Sparkline';
import { KineticsReadoutPanel } from './components/KineticsReadoutPanel';
import { KineticsControlPanel } from './components/KineticsControlPanel';
import { KINETICS_QUESTIONS } from './questions';
import { ExplainerPanel } from '@/shared/components/ExplainerPanel/ExplainerPanel';
import { enzymeKineticsContent } from './content';
import { kineticsLoopConfig } from './engine/loopConfig';
import {
  DEFAULT_KINETICS_INPUTS,
  KINETICS_PRESETS,
  KINETICS_PRESET_LABELS,
  KINETICS_PRESET_ORDER,
} from './engine/presets';
import type { KineticsInputs } from './engine/types';
import { getPresentationContext } from '@/shared/presentation/context';
import { usePresentationSlots } from '@/shared/presentation/ModulePresentationContent';
import { buildEnzymeKineticsPresentation } from './presentation';

export function EnzymeKineticsPage() {
  const { inputs, setInputs, shareLink } = useShareableInputs<KineticsInputs>('enzymeKinetics', DEFAULT_KINETICS_INPUTS);
  const { snapshot, history, perturb, fastForward, reset, transport, baseline } = useEngineLoop(inputs, kineticsLoopConfig);
  const resetScenario = useScenarioReset({
    setInputs,
    defaults: DEFAULT_KINETICS_INPUTS,
    resetEngine: reset,
    baseline,
    transport,
  });

  const { session, summary } = useModulePractice({
    moduleId: 'enzymeKinetics',
    questions: KINETICS_QUESTIONS,
    presets: KINETICS_PRESETS,
    inputs,
    defaultInputs: DEFAULT_KINETICS_INPUTS,
    setInputs,
    captureBaseline: baseline.capture,
    clearBaseline: baseline.clear,
    resetEngine: reset,
    perturbEngine: perturb,
    fastForwardEngine: fastForward,
  });

  const handleChange = useInputSetter(setInputs);

  /* The DIAGRAM is the schema's. The readouts, charts and controls stay this page's own
   * components: the drawing is what has to agree with the phone, and converting the other
   * three slots is a separate change with its own failure modes. */
  const presentationCtx = getPresentationContext(snapshot, history, baseline, inputs);
  const slots = usePresentationSlots('enzymeKinetics', buildEnzymeKineticsPresentation(presentationCtx), presentationCtx, inputs, handleChange);

  const applyPreset = useScenarioPreset({
    setInputs,
    defaults: DEFAULT_KINETICS_INPUTS,
    presets: KINETICS_PRESETS,
    resetEngine: reset,
  });

  const rateHistory = useSeries(history, (h) => h.rate);
  const rateBaseline = useSeries(baseline.history, (h) => h.rate);
  const saturationHistory = useSeries(history, (h) => h.saturationPct);
  const saturationBaseline = useSeries(baseline.history, (h) => h.saturationPct);

  return (
    <ModulePage
      historyCapacity={kineticsLoopConfig.historyCapacity}
      moduleId="enzymeKinetics"
      title="Enzyme Kinetics & Inhibition"
      subtitle="one equation explains saturation, competition and why dose escalation stops working"
      accentVar="var(--ecg-trace)"
      presets={
        <PresetBar
          order={KINETICS_PRESET_ORDER}
          labels={KINETICS_PRESET_LABELS}
          onApply={applyPreset}
          onShare={shareLink}
          onReset={resetScenario}
          disabled={session.blinded}
        />
      }
      diagram={slots.diagram}
      readouts={<KineticsReadoutPanel derived={snapshot.derived} />}
      questions={
        <QuestionSet
          count={KINETICS_QUESTIONS.length}
          beds={[]}
          schedule={summary.schedule}
          snapshot={snapshot}
          question={session.question}
        >
          <QuizPanel session={session} summary={summary} presetLabels={KINETICS_PRESET_LABELS} />
        </QuestionSet>
      }
      transport={<SimControls transport={transport} baseline={baseline} />}
      charts={
        <>
          <Sparkline
            label="Reaction rate"
            unit="µmol/min"
            data={rateHistory}
            baselineData={rateBaseline}
            domainMin={0}
            domainMax={inputs.vmaxUmPerMin * 1.1}
            colorVar="var(--ecg-trace)"
          />
          <Sparkline
            label="Active-site saturation"
            unit="%"
            data={saturationHistory}
            baselineData={saturationBaseline}
            domainMin={0}
            domainMax={100}
            colorVar="var(--potassium)"
          />
        </>
      }
      blindControls={session.blinded}
      controls={<KineticsControlPanel inputs={inputs} onChange={handleChange} />}
      explainer={<ExplainerPanel content={enzymeKineticsContent} startCollapsed={session.phase !== 'idle'} />}
      footnote="A single-enzyme Michaelis-Menten model with the three classical inhibition classes and Q10/pH modifiers — not a clinical or diagnostic tool. Cooperativity (sigmoid curves), allosteric multi-subunit regulation, and enzyme synthesis/degradation timescales are outside its scope. Inhibition constants are illustrative teaching values rather than measurements of any specific drug."
    />
  );
}
