import { useState } from 'react';
import { useEngineLoop } from '@/shared/hooks/useEngineLoop';
import { HpgDiagram } from './components/HpgDiagram';
import { ReadoutPanel } from './components/ReadoutPanel';
import { ControlPanel } from './components/ControlPanel';
import { Sparkline } from '@/shared/components/Sparkline/Sparkline';
import { ExplainerPanel } from '@/shared/components/ExplainerPanel/ExplainerPanel';
import { ModulePage } from '@/shared/components/ModulePage/ModulePage';
import { PresetBar } from '@/shared/components/PresetBar/PresetBar';
import { SimControls } from '@/shared/components/SimControls/SimControls';
import { hpgAxisContent } from './content';
import { hpgLoopConfig } from './engine/loopConfig';
import { DEFAULT_HPG_INPUTS, HPG_PRESETS, type HpgPresetName, HPG_PRESET_LABELS, PRESET_ORDER } from './engine/presets';
import type { HpgInputs } from './engine/types';

export function HpgAxisPage() {
  const [inputs, setInputs] = useState<HpgInputs>(DEFAULT_HPG_INPUTS);
  const { snapshot, history, reset, transport, baseline } = useEngineLoop(inputs, hpgLoopConfig);

  function handleChange<K extends keyof HpgInputs>(key: K, value: HpgInputs[K]) {
    setInputs((prev) => ({ ...prev, [key]: value }));
  }

  function handleApplyPreset(name: HpgPresetName) {
    setInputs((prev) => ({ ...prev, ...HPG_PRESETS[name] }));
  }

  const isFemale = snapshot.derived.sex === 'female';
  const lhHistory = history.map((h) => h.lh * 100);
  const lhHistoryBaseline = baseline.history?.map((h) => h.lh * 100) ?? null;
  const fshHistory = history.map((h) => h.fsh * 100);
  const fshHistoryBaseline = baseline.history?.map((h) => h.fsh * 100) ?? null;
  const steroidHistory = history.map((h) => h.gonadalSteroid * 100);
  const steroidHistoryBaseline = baseline.history?.map((h) => h.gonadalSteroid * 100) ?? null;

  return (
    <ModulePage
      title="HPG Axis"
      subtitle="GnRH, LH/FSH & the ovulatory LH surge"
      accentVar="var(--lh)"
      presets={
        <PresetBar
          order={PRESET_ORDER}
          labels={HPG_PRESET_LABELS}
          onApply={handleApplyPreset}
          onReset={reset}
        />
      }
      diagram={<HpgDiagram derived={snapshot.derived} />}
      readouts={<ReadoutPanel derived={snapshot.derived} />}
      transport={<SimControls transport={transport} baseline={baseline} />}
      charts={
        <>
  <Sparkline label="LH" unit="%" data={lhHistory} baselineData={lhHistoryBaseline} domainMin={0} domainMax={100} colorVar="var(--lh)" />
  <Sparkline label="FSH" unit="%" data={fshHistory} baselineData={fshHistoryBaseline} domainMin={0} domainMax={100} colorVar="var(--fsh)" />
  <Sparkline
    label={isFemale ? 'Estrogen' : 'Testosterone'}
    unit="%"
    data={steroidHistory} baselineData={steroidHistoryBaseline}
    domainMin={0}
    domainMax={100}
    colorVar={isFemale ? 'var(--estrogen)' : 'var(--testosterone)'}
  />
        </>
      }
      controls={<ControlPanel inputs={inputs} onChange={handleChange} />}
      explainer={<ExplainerPanel content={hpgAxisContent} />}
      footnote={'A simplified, conceptual model of reproductive endocrinology — not a clinical or diagnostic tool. Leave the normal female cycle running and the LH surge will fire on its own once follicular estrogen has been high for long enough: the surge is emergent, not scheduled on a fixed day. Watch the feedback arrow flip from inhibitory to stimulatory as it happens, then try the Combined OCP preset, where the surge never comes. One simulated cycle takes roughly a minute of real time.'}
    />
  );
}
