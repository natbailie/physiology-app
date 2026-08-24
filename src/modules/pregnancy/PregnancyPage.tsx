import { useEngineLoop } from '@/shared/hooks/useEngineLoop';
import { useShareableInputs } from '@/shared/hooks/useShareableInputs';
import { ModulePage } from '@/shared/components/ModulePage/ModulePage';
import { PresetBar } from '@/shared/components/PresetBar/PresetBar';
import { SimControls } from '@/shared/components/SimControls/SimControls';
import { QuizPanel } from '@/shared/components/QuizPanel/QuizPanel';
import { useModulePractice } from '@/shared/assessment/useModulePractice';
import { Sparkline } from '@/shared/components/Sparkline/Sparkline';
import { PregnancyDiagram } from './components/PregnancyDiagram';
import { ReadoutPanel } from './components/ReadoutPanel';
import { ControlPanel } from './components/ControlPanel';
import { PREGNANCY_QUESTIONS } from './questions';
import { ExplainerPanel } from '@/shared/components/ExplainerPanel/ExplainerPanel';
import { pregnancyContent } from './content';
import { pregnancyLoopConfig } from './engine/loopConfig';
import { perturbFeedNow, perturbStartLabour } from './engine/engine';
import {
  PREGNANCY_PRESETS,
  PREGNANCY_PRESET_LABELS,
  PREGNANCY_PRESET_ORDER,
  DEFAULT_PREGNANCY_INPUTS,
  type PregnancyPresetName,
} from './engine/presets';
import type { PregnancyInputs } from './engine/types';

export function PregnancyPage() {
  const { inputs, setInputs, shareLink } = useShareableInputs<PregnancyInputs>('pregnancy', DEFAULT_PREGNANCY_INPUTS);
  const { snapshot, history, perturb, fastForward, reset, transport, baseline } = useEngineLoop(inputs, pregnancyLoopConfig);

  const { session, summary } = useModulePractice({
    moduleId: 'pregnancy',
    questions: PREGNANCY_QUESTIONS,
    presets: PREGNANCY_PRESETS,
    inputs,
    defaultInputs: DEFAULT_PREGNANCY_INPUTS,
    setInputs,
    captureBaseline: baseline.capture,
    clearBaseline: baseline.clear,
    resetEngine: reset,
    perturbEngine: perturb,
    fastForwardEngine: fastForward,
  });

  function handleChange<K extends keyof PregnancyInputs>(key: K, value: PregnancyInputs[K]) {
    setInputs((prev) => ({ ...prev, [key]: value }));
  }

  function handleApplyPreset(name: PregnancyPresetName) {
    setInputs((prev) => ({ ...prev, ...PREGNANCY_PRESETS[name] }));
  }

  const hbHistory = history.map((h) => h.hb);
  const hbBaseline = baseline.history?.map((h) => h.hb) ?? null;
  const progesteroneHistory = history.map((h) => h.progesterone);
  const progesteroneBaseline = baseline.history?.map((h) => h.progesterone) ?? null;
  const milkHistory = history.map((h) => h.milk);
  const milkBaseline = baseline.history?.map((h) => h.milk) ?? null;
  const dilationHistory = history.map((h) => h.dilation);
  const dilationBaseline = baseline.history?.map((h) => h.dilation) ?? null;

  return (
    <ModulePage
      moduleId="pregnancy"
      title="Maternal Physiology, Labour & Lactation"
      subtitle="every maternal number changes, and most of the changes look like disease"
      accentVar="var(--placenta)"
      presets={
        <PresetBar
          order={PREGNANCY_PRESET_ORDER}
          labels={PREGNANCY_PRESET_LABELS}
          onApply={handleApplyPreset}
          actions={[
            { label: 'Labour onset', onClick: () => perturb(perturbStartLabour), variant: 'impulse' },
            { label: 'Feed (let-down)', onClick: () => perturb(perturbFeedNow), variant: 'impulse' },
          ]}
          onShare={shareLink}
          onReset={reset}
          disabled={session.blinded}
        />
      }
      diagram={<PregnancyDiagram derived={snapshot.derived} />}
      readouts={<ReadoutPanel derived={snapshot.derived} />}
      practice={<QuizPanel session={session} summary={summary} presetLabels={PREGNANCY_PRESET_LABELS} />}
      transport={<SimControls transport={transport} baseline={baseline} />}
      charts={
        <>
          <Sparkline
            label="Haemoglobin"
            unit="g/dL"
            data={hbHistory}
            baselineData={hbBaseline}
            domainMin={8}
            domainMax={15}
            colorVar="var(--hemoglobin)"
          />
          <Sparkline
            label="Progesterone"
            unit="ng/mL"
            data={progesteroneHistory}
            baselineData={progesteroneBaseline}
            domainMin={0}
            domainMax={140}
            colorVar="var(--progesterone)"
          />
          <Sparkline
            label="Milk supply"
            unit="mL/day"
            data={milkHistory}
            baselineData={milkBaseline}
            domainMin={0}
            domainMax={800}
            colorVar="var(--estrogen)"
          />
          <Sparkline
            label="Cervical dilation"
            unit="cm"
            data={dilationHistory}
            baselineData={dilationBaseline}
            domainMin={0}
            domainMax={10}
            colorVar="var(--nociception)"
          />
        </>
      }
      blindControls={session.blinded}
      controls={<ControlPanel inputs={inputs} onChange={handleChange} />}
      explainer={<ExplainerPanel content={pregnancyContent} startCollapsed={session.phase !== 'idle'} />}
      footnote="A simplified conceptual model of maternal adaptation, the Ferguson reflex and lactogenesis — not a clinical or diagnostic tool. Fetal physiology is represented by a single growth curve scaled by placental function; pre-eclampsia is modelled as its haemodynamic signature rather than its endothelial mechanisms; labour is one positive-feedback loop without pain or fetal monitoring axes; and hormone levels are schematic rather than assay-accurate. Gestation advances only when you move the slider — time alone changes the puerperium."
    />
  );
}
