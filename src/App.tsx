import { useState } from 'react';
import { useSimulationLoop } from '@/hooks/useSimulationLoop';
import { PhysiologyDiagram } from '@/components/Diagram/PhysiologyDiagram';
import { ReadoutPanel } from '@/components/Readouts/ReadoutPanel';
import { Sparkline } from '@/components/Charts/Sparkline';
import { ControlPanel } from '@/components/ControlPanel/ControlPanel';
import { DEFAULT_INPUTS, PRESETS, type PresetName } from '@/simulation/presets';
import type { SimInputs } from '@/simulation/types';
import styles from './App.module.css';

function App() {
  const [inputs, setInputs] = useState<SimInputs>(DEFAULT_INPUTS);
  const { snapshot, history, triggerHemorrhage, reset } = useSimulationLoop(inputs);

  function handleChange<K extends keyof SimInputs>(key: K, value: SimInputs[K]) {
    setInputs((prev) => ({ ...prev, [key]: value }));
  }

  function handleApplyPreset(name: PresetName) {
    setInputs((prev) => ({ ...prev, ...PRESETS[name] }));
  }

  const mapHistory = history.map((h) => h.map);
  const gfrHistory = history.map((h) => h.gfr);
  const bvHistory = history.map((h) => h.bloodVolume);

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <h1 className={styles.title}>Cardiorenal Monitor</h1>
        <span className={styles.subtitle}>heart &amp; kidney feedback simulator</span>
      </header>

      <div className={styles.mainGrid}>
        <PhysiologyDiagram derived={snapshot.derived} />

        <div className={styles.sidebar}>
          <ReadoutPanel state={snapshot.state} derived={snapshot.derived} inputs={inputs} />
          <div className={styles.charts}>
            <Sparkline label="MAP" unit="mmHg" data={mapHistory} domainMin={30} domainMax={180} colorVar="var(--artery)" />
            <Sparkline label="GFR" unit="*" data={gfrHistory} domainMin={0} domainMax={150} colorVar="var(--kidney)" />
            <Sparkline label="Blood volume" unit="%" data={bvHistory} domainMin={40} domainMax={220} colorVar="var(--text)" />
          </div>
        </div>
      </div>

      <ControlPanel
        inputs={inputs}
        onChange={handleChange}
        onApplyPreset={handleApplyPreset}
        onHemorrhage={triggerHemorrhage}
        onReset={reset}
      />

      <p className={styles.footnote}>
        A simplified, conceptual model of cardiorenal physiology — not a clinical or diagnostic tool. GFR and
        urine output are shown in normalized units (baseline = 100), not literal mL/min. Simulated time runs
        faster than real time so RAAS/ANP responses (which take minutes physiologically) are watchable within
        roughly a minute.
      </p>
    </div>
  );
}

export default App;
