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
import { ReactionCurveChart } from './components/ReactionCurveChart';
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
      diagram={<ReactionCurveChart inputs={inputs} derived={snapshot.derived} />}
      readouts={<KineticsReadoutPanel derived={snapshot.derived} />}
      practice={<QuizPanel session={session} summary={summary} presetLabels={KINETICS_PRESET_LABELS} />}
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
