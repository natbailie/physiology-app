import { useState } from 'react';
import { useEngineLoop } from '@/shared/hooks/useEngineLoop';
import { ModulePage } from '@/shared/components/ModulePage/ModulePage';
import { PresetBar } from '@/shared/components/PresetBar/PresetBar';
import { SimControls } from '@/shared/components/SimControls/SimControls';
import { QuizPanel } from '@/shared/components/QuizPanel/QuizPanel';
import { useModulePractice } from '@/shared/assessment/useModulePractice';
import { Sparkline } from '@/shared/components/Sparkline/Sparkline';
import { CerebralDiagram } from './components/CerebralDiagram';
import { ReadoutPanel } from './components/ReadoutPanel';
import { ControlPanel } from './components/ControlPanel';
import { CEREBRAL_QUESTIONS } from './questions';
import { ExplainerPanel } from '@/shared/components/ExplainerPanel/ExplainerPanel';
import { cerebralPerfusionContent } from './content';
import { cerebralLoopConfig } from './engine/loopConfig';
import { perturbAcuteBleed, perturbDrainCsf } from './engine/engine';
import {
  CEREBRAL_PRESETS,
  CEREBRAL_PRESET_LABELS,
  CEREBRAL_PRESET_ORDER,
  DEFAULT_CEREBRAL_INPUTS,
  type CerebralPresetName,
} from './engine/presets';
import type { CerebralInputs } from './engine/types';

export function CerebralPerfusionPage() {
  const [inputs, setInputs] = useState<CerebralInputs>(DEFAULT_CEREBRAL_INPUTS);
  const { snapshot, history, perturb, reset, transport, baseline } = useEngineLoop(inputs, cerebralLoopConfig);

  const { session, summary } = useModulePractice({
    moduleId: 'cerebralPerfusion',
    questions: CEREBRAL_QUESTIONS,
    presets: CEREBRAL_PRESETS,
    setInputs,
    captureBaseline: baseline.capture,
    clearBaseline: baseline.clear,
    resetEngine: reset,
    perturbEngine: perturb,
  });

  function handleChange<K extends keyof CerebralInputs>(key: K, value: CerebralInputs[K]) {
    setInputs((prev) => ({ ...prev, [key]: value }));
  }

  function handleApplyPreset(name: CerebralPresetName) {
    setInputs((prev) => ({ ...prev, ...CEREBRAL_PRESETS[name] }));
  }

  const icpHistory = history.map((h) => h.icp);
  const icpHistoryBaseline = baseline.history?.map((h) => h.icp) ?? null;
  const cppHistory = history.map((h) => h.cpp);
  const cppHistoryBaseline = baseline.history?.map((h) => h.cpp) ?? null;
  const cbfHistory = history.map((h) => h.cbf);
  const cbfHistoryBaseline = baseline.history?.map((h) => h.cbf) ?? null;
  const cbvHistory = history.map((h) => h.cbv);
  const cbvHistoryBaseline = baseline.history?.map((h) => h.cbv) ?? null;

  return (
    <ModulePage
      title="Cerebral Perfusion, ICP & CSF"
      subtitle="a box that cannot expand, and the pressure that gets you perfused"
      accentVar="var(--vm)"
      presets={
        <PresetBar
          order={CEREBRAL_PRESET_ORDER}
          labels={CEREBRAL_PRESET_LABELS}
          onApply={handleApplyPreset}
          actions={[
            { label: 'Drain CSF', onClick: () => perturb((s) => perturbDrainCsf(s, 12)), variant: 'impulse' },
            { label: 'Acute bleed', onClick: () => perturb((s) => perturbAcuteBleed(s, 20)), variant: 'danger' },
          ]}
          onReset={reset}
          disabled={session.blinded}
        />
      }
      diagram={<CerebralDiagram derived={snapshot.derived} />}
      readouts={<ReadoutPanel derived={snapshot.derived} />}
      practice={<QuizPanel session={session} summary={summary} presetLabels={CEREBRAL_PRESET_LABELS} />}
      transport={<SimControls transport={transport} baseline={baseline} />}
      charts={
        <>
          <Sparkline
            label="ICP"
            unit="mmHg"
            data={icpHistory}
            baselineData={icpHistoryBaseline}
            domainMin={0}
            domainMax={70}
            colorVar="var(--danger)"
          />
          <Sparkline
            label="CPP"
            unit="mmHg"
            data={cppHistory}
            baselineData={cppHistoryBaseline}
            domainMin={0}
            domainMax={140}
            colorVar="var(--artery)"
          />
          <Sparkline
            label="Cerebral blood flow"
            data={cbfHistory}
            baselineData={cbfHistoryBaseline}
            domainMin={0}
            domainMax={100}
            colorVar="var(--o2)"
          />
          <Sparkline
            label="Cerebral blood volume"
            unit="mL"
            data={cbvHistory}
            baselineData={cbvHistoryBaseline}
            domainMin={30}
            domainMax={170}
            colorVar="var(--venous)"
          />
        </>
      }
      blindControls={session.blinded}
      controls={<ControlPanel inputs={inputs} onChange={handleChange} />}
      explainer={<ExplainerPanel content={cerebralPerfusionContent} startCollapsed={session.phase !== 'idle'} />}
      footnote="A simplified, conceptual model of intracranial pressure-volume relationships — not a clinical or diagnostic tool. The cranium is treated as one compartment, so pressure gradients between compartments and the herniation syndromes that follow from them are outside its scope; cerebral blood flow is a whole-brain average rather than regional. Simulated time runs faster than real life so CSF accumulation, which takes hours, is watchable. For the systemic circulation supplying this one, see Shock States; for the CO2 handling that sets the vasodilator, see Respiratory & Acid-Base."
    />
  );
}
