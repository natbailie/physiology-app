import { Slider } from '@/shared/components/Slider/Slider';
import { ControlRail, ControlGroup } from '@/shared/components/ControlRail/ControlRail';
import type { CoagInputs } from '../engine/types';

interface ControlPanelProps {
  inputs: CoagInputs;
  onChange: <K extends keyof CoagInputs>(key: K, value: CoagInputs[K]) => void;
}

export function ControlPanel({ inputs, onChange }: ControlPanelProps) {
  return (
    <ControlRail>
      <ControlGroup label="Clotting factors">
        <Slider
          label="Factor VIII"
          value={inputs.factorVIIIActivity}
          min={0}
          max={150}
          step={1}
          unit="%"
          onChange={(v) => onChange('factorVIIIActivity', v)}
        />
        <Slider
          label="Factor IX"
          value={inputs.factorIXActivity}
          min={0}
          max={150}
          step={1}
          unit="%"
          onChange={(v) => onChange('factorIXActivity', v)}
        />
        <Slider
          label="Vitamin K factors (II, VII, IX, X)"
          value={inputs.vitaminKDependentFactors}
          min={0}
          max={150}
          step={1}
          unit="%"
          onChange={(v) => onChange('vitaminKDependentFactors', v)}
        />
        <Slider
          label="von Willebrand factor"
          value={inputs.vonWillebrandFactor}
          min={0}
          max={150}
          step={1}
          unit="%"
          onChange={(v) => onChange('vonWillebrandFactor', v)}
        />
      </ControlGroup>
      <ControlGroup label="Primary haemostasis">
        <Slider
          label="Platelet count"
          value={inputs.plateletCount}
          min={0}
          max={400}
          step={5}
          unit=" ×10⁹/L"
          onChange={(v) => onChange('plateletCount', v)}
        />
        <Slider
          label="Fibrinogen"
          value={inputs.fibrinogenLevel}
          min={0}
          max={150}
          step={1}
          unit="%"
          onChange={(v) => onChange('fibrinogenLevel', v)}
        />
      </ControlGroup>
      <ControlGroup label="Anticoagulants">
        <Slider
          label="Heparin dose"
          value={inputs.heparinDose}
          min={0}
          max={100}
          step={5}
          unit="%"
          onChange={(v) => onChange('heparinDose', v)}
        />
        <Slider
          label="Aspirin dose"
          value={inputs.aspirinDose}
          min={0}
          max={100}
          step={5}
          unit="%"
          onChange={(v) => onChange('aspirinDose', v)}
        />
      </ControlGroup>
      <ControlGroup label="Fibrinolysis">
        <Slider
          label="Fibrinolytic activity"
          value={inputs.fibrinolyticActivity}
          min={0}
          max={300}
          step={5}
          unit="%"
          onChange={(v) => onChange('fibrinolyticActivity', v)}
        />
      </ControlGroup>
    </ControlRail>
  );
}
