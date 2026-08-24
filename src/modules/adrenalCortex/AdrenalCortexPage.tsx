import { useEngineLoop } from '@/shared/hooks/useEngineLoop';
import { useShareableInputs } from '@/shared/hooks/useShareableInputs';
import { ModulePage } from '@/shared/components/ModulePage/ModulePage';
import { PresetBar } from '@/shared/components/PresetBar/PresetBar';
import { SimControls } from '@/shared/components/SimControls/SimControls';
import { QuizPanel } from '@/shared/components/QuizPanel/QuizPanel';
import { useModulePractice } from '@/shared/assessment/useModulePractice';
import { Sparkline } from '@/shared/components/Sparkline/Sparkline';
import { AdrenalCortexDiagram } from './components/AdrenalCortexDiagram';
import { AdrenalCortexReadoutPanel } from './components/AdrenalCortexReadoutPanel';
import { ControlPanel as AdrenalCortexControlPanel } from './components/AdrenalCortexControlPanel';
import { ADRENAL_QUESTIONS } from './questions';
import { ExplainerPanel } from '@/shared/components/ExplainerPanel/ExplainerPanel';
import { adrenalCortexContent } from './content';
import { adrenalLoopConfig } from './engine/loopConfig';
import {
  ADRENAL_PRESETS,
  ADRENAL_PRESET_LABELS,
  ADRENAL_PRESET_ORDER,
  DEFAULT_ADRENAL_INPUTS,
  type AdrenalCortexPresetName,
} from './engine/presets';
import type { AdrenalCortexInputs } from './engine/types';

export function AdrenalCortexPage() {
  const { inputs, setInputs, shareLink } = useShareableInputs<AdrenalCortexInputs>('adrenalCortex', DEFAULT_ADRENAL_INPUTS);
  const { snapshot, history, perturb, fastForward, reset, transport, baseline } = useEngineLoop(inputs, adrenalLoopConfig);

  const { session, summary } = useModulePractice({
    moduleId: 'adrenalCortex',
    questions: ADRENAL_QUESTIONS,
    presets: ADRENAL_PRESETS,
    inputs,
    defaultInputs: DEFAULT_ADRENAL_INPUTS,
    setInputs,
    captureBaseline: baseline.capture,
    clearBaseline: baseline.clear,
    resetEngine: reset,
    perturbEngine: perturb,
    fastForwardEngine: fastForward,
  });

  function handleChange<K extends keyof AdrenalCortexInputs>(key: K, value: AdrenalCortexInputs[K]) {
    setInputs((prev) => ({ ...prev, [key]: value }));
  }

  function handleApplyPreset(name: AdrenalCortexPresetName) {
    setInputs((prev) => ({ ...prev, ...ADRENAL_PRESETS[name] }));
  }

  const cortisolHistory = history.map((h) => h.cortisol);
  const cortisolBaseline = baseline.history?.map((h) => h.cortisol) ?? null;
  const androgenHistory = history.map((h) => h.androgens);
  const androgenBaseline = baseline.history?.map((h) => h.androgens) ?? null;
  const mcHistory = history.map((h) => h.mcActivity);
  const mcBaseline = baseline.history?.map((h) => h.mcActivity) ?? null;

  return (
    <ModulePage
      moduleId="adrenalCortex"
      title="Adrenal Cortex: Steroidogenesis & CAH"
      subtitle="one pathway, four enzymes, and a fingerprint at every block"
      accentVar="var(--cortisol)"
      presets={
        <PresetBar
          order={ADRENAL_PRESET_ORDER}
          labels={ADRENAL_PRESET_LABELS}
          onApply={handleApplyPreset}
          onShare={shareLink}
          onReset={reset}
          disabled={session.blinded}
        />
      }
      diagram={<AdrenalCortexDiagram derived={snapshot.derived} inputs={inputs} />}
      readouts={<AdrenalCortexReadoutPanel derived={snapshot.derived} />}
      practice={<QuizPanel session={session} summary={summary} presetLabels={ADRENAL_PRESET_LABELS} />}
      transport={<SimControls transport={transport} baseline={baseline} />}
      charts={
        <>
          <Sparkline
            label="Cortisol (effective)"
            unit="% normal"
            data={cortisolHistory}
            baselineData={cortisolBaseline}
            domainMin={0}
            domainMax={150}
            colorVar="var(--cortisol)"
          />
          <Sparkline
            label="Androgens"
            unit="% normal"
            data={androgenHistory}
            baselineData={androgenBaseline}
            domainMin={0}
            domainMax={400}
            colorVar="var(--lh)"
          />
          <Sparkline
            label="Mineralocorticoid activity"
            unit="% normal"
            data={mcHistory}
            baselineData={mcBaseline}
            domainMin={0}
            domainMax={200}
            colorVar="var(--raas)"
          />
        </>
      }
      blindControls={session.blinded}
      controls={<AdrenalCortexControlPanel inputs={inputs} onChange={handleChange} />}
      explainer={<ExplainerPanel content={adrenalCortexContent} startCollapsed={session.phase !== 'idle'} />}
      footnote="A simplified conceptual model of the steroidogenic pathway — not a clinical or diagnostic tool. Fluxes are relative units rather than assay values; enzyme blocks are continuous severities standing in for what is genetically binary; DOC mineralocorticoid potency and the ACTH feedback loop are simplified scalars. For regulation of this gland by its pituitary master, see HPA Axis; for catecholamines see Adrenal Medulla."
    />
  );
}
