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
import { AbsorptionDiagram } from './components/AbsorptionDiagram';
import { ReadoutPanel } from './components/ReadoutPanel';
import { ControlPanel } from './components/ControlPanel';
import { DIGESTION_QUESTIONS } from './questions';
import { ExplainerPanel } from '@/shared/components/ExplainerPanel/ExplainerPanel';
import { digestionAbsorptionContent } from './content';
import { digestionLoopConfig } from './engine/loopConfig';
import { perturbEatMeal } from './engine/engine';
import {
  DIGESTION_PRESETS,
  DIGESTION_PRESET_LABELS,
  DIGESTION_PRESET_ORDER,
  DEFAULT_DIGESTION_INPUTS,
} from './engine/presets';
import type { DigestionInputs } from './engine/types';

export function DigestionAbsorptionPage() {
  const { inputs, setInputs, shareLink } = useShareableInputs<DigestionInputs>('digestionAbsorption', DEFAULT_DIGESTION_INPUTS);
  const { snapshot, history, perturb, fastForward, reset, transport, baseline } = useEngineLoop(inputs, digestionLoopConfig);
  const resetScenario = useScenarioReset({
    setInputs,
    defaults: DEFAULT_DIGESTION_INPUTS,
    resetEngine: reset,
    baseline,
    transport,
  });

  const { session, summary } = useModulePractice({
    moduleId: 'digestionAbsorption',
    questions: DIGESTION_QUESTIONS,
    presets: DIGESTION_PRESETS,
    inputs,
    defaultInputs: DEFAULT_DIGESTION_INPUTS,
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
    defaults: DEFAULT_DIGESTION_INPUTS,
    presets: DIGESTION_PRESETS,
    resetEngine: reset,
  });

  const stoolHistory = useSeries(history, (h) => h.stoolWaterMlPerDay);
  const stoolHistoryBaseline = useSeries(baseline.history, (h) => h.stoolWaterMlPerDay);
  const poolHistory = useSeries(history, (h) => h.bileSaltPoolG);
  const poolHistoryBaseline = useSeries(baseline.history, (h) => h.bileSaltPoolG);
  const nutritionHistory = useSeries(history, (h) => h.nutritionIndex * 100);
  const nutritionHistoryBaseline = useSeries(baseline.history, (h) => h.nutritionIndex * 100);
  const fatHistory = useSeries(history, (h) => h.fatAbsorptionPct);
  const fatHistoryBaseline = useSeries(baseline.history, (h) => h.fatAbsorptionPct);

  return (
    <ModulePage
      historyCapacity={digestionLoopConfig.historyCapacity}
      moduleId="digestionAbsorption"
      title="Digestion & Absorption"
      subtitle="the meal, taken apart and taken up"
      accentVar="var(--gastrin)"
      presets={
        <PresetBar
          order={DIGESTION_PRESET_ORDER}
          labels={DIGESTION_PRESET_LABELS}
          onApply={applyPreset}
          actions={[
            { label: 'Eat a meal', onClick: () => perturb((s) => perturbEatMeal(s)), variant: 'impulse' },
          ]}
          onShare={shareLink}
          onReset={resetScenario}
          disabled={session.blinded}
        />
      }
      diagram={<AbsorptionDiagram derived={snapshot.derived} />}
      readouts={<ReadoutPanel derived={snapshot.derived} />}
      questions={
        <QuestionSet
          count={DIGESTION_QUESTIONS.length}
          beds={[]}
          schedule={summary.schedule}
          snapshot={snapshot}
          question={session.question}
        >
          <QuizPanel session={session} summary={summary} presetLabels={DIGESTION_PRESET_LABELS} />
        </QuestionSet>
      }
      transport={<SimControls transport={transport} baseline={baseline} />}
      charts={
        <>
          <Sparkline
            label="Stool water"
            unit="ml/day"
            data={stoolHistory}
            baselineData={stoolHistoryBaseline}
            domainMin={0}
            domainMax={3000}
            colorVar="var(--danger)"
          />
          <Sparkline
            label="Bile salt pool"
            unit="g"
            data={poolHistory}
            baselineData={poolHistoryBaseline}
            domainMin={0}
            domainMax={5}
            colorVar="var(--liver)"
          />
          <Sparkline
            label="Fat uptake"
            unit="%"
            data={fatHistory}
            baselineData={fatHistoryBaseline}
            domainMin={0}
            domainMax={100}
            colorVar="var(--o2)"
          />
          <Sparkline
            label="Nutrition"
            unit="%"
            data={nutritionHistory}
            baselineData={nutritionHistoryBaseline}
            domainMin={0}
            domainMax={100}
            colorVar="var(--text)"
          />
        </>
      }
      blindControls={session.blinded}
      controls={<ControlPanel inputs={inputs} onChange={handleChange} />}
      explainer={<ExplainerPanel content={digestionAbsorptionContent} startCollapsed={session.phase !== 'idle'} />}
      footnote="A simplified conceptual model of luminal digestion and absorption — not a clinical or diagnostic tool. Gastric acid control, gut hormones and motility live in GI Physiology, which sits upstream of this one; the anaemia that follows B12 and iron loss is modelled in Erythropoiesis. Micronutrient stores drain over simulated weeks, compressed heavily so the long game is watchable; bile salt pools move over simulated days. Stool classifications follow mechanism — osmotic, secretory, cholerrhoeic, steatorrhoeic — rather than any single number."
    />
  );
}
