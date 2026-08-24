import { useEngineLoop } from '@/shared/hooks/useEngineLoop';
import { useShareableInputs } from '@/shared/hooks/useShareableInputs';
import { ModulePage } from '@/shared/components/ModulePage/ModulePage';
import { PresetBar } from '@/shared/components/PresetBar/PresetBar';
import { SimControls } from '@/shared/components/SimControls/SimControls';
import { QuizPanel } from '@/shared/components/QuizPanel/QuizPanel';
import { useModulePractice } from '@/shared/assessment/useModulePractice';
import { Sparkline } from '@/shared/components/Sparkline/Sparkline';
import { BloodGroupsDiagram } from './components/BloodGroupsDiagram';
import { BloodGroupsReadoutPanel } from './components/BloodGroupsReadoutPanel';
import { ControlPanel as BloodGroupsControlPanel } from './components/BloodGroupsControlPanel';
import { BLOOD_QUESTIONS } from './questions';
import { ExplainerPanel } from '@/shared/components/ExplainerPanel/ExplainerPanel';
import { bloodGroupsContent } from './content';
import { bloodLoopConfig } from './engine/loopConfig';
import {
  BLOOD_PRESETS,
  BLOOD_PRESET_LABELS,
  BLOOD_PRESET_ORDER,
  DEFAULT_BLOOD_INPUTS,
  type BloodPresetName,
} from './engine/presets';
import type { BloodInputs } from './engine/types';

export function BloodGroupsPage() {
  const { inputs, setInputs, shareLink } = useShareableInputs<BloodInputs>('bloodGroups', DEFAULT_BLOOD_INPUTS);
  const { snapshot, history, perturb, fastForward, reset, transport, baseline } = useEngineLoop(inputs, bloodLoopConfig);

  const { session, summary } = useModulePractice({
    moduleId: 'bloodGroups',
    questions: BLOOD_QUESTIONS,
    presets: BLOOD_PRESETS,
    inputs,
    defaultInputs: DEFAULT_BLOOD_INPUTS,
    setInputs,
    captureBaseline: baseline.capture,
    clearBaseline: baseline.clear,
    resetEngine: reset,
    perturbEngine: perturb,
    fastForwardEngine: fastForward,
  });

  function handleChange<K extends keyof BloodInputs>(key: K, value: BloodInputs[K]) {
    setInputs((prev) => ({ ...prev, [key]: value }));
  }

  function handleApplyPreset(name: BloodPresetName) {
    setInputs((prev) => ({ ...prev, ...BLOOD_PRESETS[name] }));
  }

  const severityHistory = history.map((h) => h.severity);
  const severityBaseline = baseline.history?.map((h) => h.severity) ?? null;
  const freeHbHistory = history.map((h) => h.freeHb);
  const freeHbBaseline = baseline.history?.map((h) => h.freeHb) ?? null;

  return (
    <ModulePage
      moduleId="bloodGroups"
      title="Blood Groups & Transfusion Reactions"
      subtitle="the antibodies are already there — which is why the wrong unit is a five-minute emergency"
      accentVar="var(--transfusion)"
      presets={
        <PresetBar
          order={BLOOD_PRESET_ORDER}
          labels={BLOOD_PRESET_LABELS}
          onApply={handleApplyPreset}
          onReset={reset}
          onShare={shareLink}
          disabled={session.blinded}
        />
      }
      diagram={<BloodGroupsDiagram derived={snapshot.derived} inputs={inputs} />}
      readouts={<BloodGroupsReadoutPanel derived={snapshot.derived} />}
      practice={<QuizPanel session={session} summary={summary} presetLabels={BLOOD_PRESET_LABELS} />}
      transport={<SimControls transport={transport} baseline={baseline} />}
      charts={
        <>
          <Sparkline
            label="Haemolytic severity"
            unit="%"
            data={severityHistory}
            baselineData={severityBaseline}
            domainMin={0}
            domainMax={100}
            colorVar="var(--transfusion)"
          />
          <Sparkline
            label="Plasma free haemoglobin"
            data={freeHbHistory}
            baselineData={freeHbBaseline}
            domainMin={0}
            domainMax={350}
            colorVar="var(--danger)"
          />
        </>
      }
      blindControls={session.blinded}
      controls={<BloodGroupsControlPanel inputs={inputs} onChange={handleChange} />}
      explainer={<ExplainerPanel content={bloodGroupsContent} startCollapsed={session.phase !== 'idle'} />}
      footnote="A simplified conceptual model of red-cell compatibility — not a clinical or diagnostic tool. Only major (red-cell) incompatibility is modelled; minor ABO incompatibility of donor plasma, Kell and other antigen systems, and the full coagulopathy of massive transfusion are outside its scope. Reaction severity is a single index standing in for fever, shock and laboratory change; the two arms differ only in speed and intravascular versus extravascular clearance. For the cells being destroyed, see Erythropoiesis; for the complement machinery, see Hypersensitivity."
    />
  );
}
