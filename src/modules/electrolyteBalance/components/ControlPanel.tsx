import { Slider } from '@/shared/components/Slider/Slider';
import { ToggleGroup } from '@/shared/components/ToggleGroup/ToggleGroup';
import { ControlGroup, ControlRail } from '@/shared/components/ControlRail/ControlRail';
import type { AdhMode, Diuretic, ElectrolyteInputs, ExtrarenalLoss, Infusion } from '../engine/types';

interface ControlPanelProps {
  inputs: ElectrolyteInputs;
  onChange: <K extends keyof ElectrolyteInputs>(key: K, value: ElectrolyteInputs[K]) => void;
}

const multiple = (v: number) => `${v.toFixed(1)}x`;

const ADH_OPTIONS: { value: AdhMode; label: string }[] = [
  { value: 'regulated', label: 'Regulated' },
  { value: 'inappropriate', label: 'SIADH' },
  { value: 'deficient', label: 'DI' },
];

const LOSS_OPTIONS: { value: ExtrarenalLoss; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'vomiting', label: 'Vomiting' },
  { value: 'diarrhoea', label: 'Diarrhoea' },
  { value: 'sweating', label: 'Sweating' },
];

const DIURETIC_OPTIONS: { value: Diuretic; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'loop', label: 'Loop' },
  { value: 'thiazide', label: 'Thiazide' },
  { value: 'potassiumSparing', label: 'K-sparing' },
];

const INFUSION_OPTIONS: { value: Infusion; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'normalSaline', label: '0.9% saline' },
  { value: 'hypertonic3', label: '3% saline' },
  { value: 'dextrose5', label: 'D5W' },
  { value: 'potassiumReplacement', label: 'K+ replacement' },
];

export function ControlPanel({ inputs, onChange }: ControlPanelProps) {
  return (
    <ControlRail>
      <ControlGroup label="Intake">
        <Slider
          label="Sodium intake"
          value={inputs.sodiumIntake}
          min={0}
          max={400}
          step={10}
          unit=" mEq/d"
          onChange={(v) => onChange('sodiumIntake', v)}
        />
        <Slider
          label="Potassium intake"
          value={inputs.potassiumIntake}
          min={0}
          max={200}
          step={5}
          unit=" mEq/d"
          onChange={(v) => onChange('potassiumIntake', v)}
        />
        <Slider
          label="Water intake"
          value={inputs.waterIntake}
          min={0}
          max={12}
          step={0.25}
          unit=" L/d"
          formatValue={(v) => v.toFixed(2)}
          onChange={(v) => onChange('waterIntake', v)}
        />
      </ControlGroup>

      <ControlGroup label="Internal shift">
        <Slider
          label="Insulin"
          value={inputs.insulinLevel}
          min={0}
          max={5}
          step={0.1}
          formatValue={multiple}
          onChange={(v) => onChange('insulinLevel', v)}
        />
        <Slider
          label="Beta-2 activity"
          value={inputs.beta2Activity}
          min={0}
          max={3}
          step={0.1}
          formatValue={multiple}
          onChange={(v) => onChange('beta2Activity', v)}
        />
        <Slider
          label="Arterial pH"
          value={inputs.arterialPH}
          min={6.9}
          max={7.6}
          step={0.01}
          formatValue={(v) => v.toFixed(2)}
          onChange={(v) => onChange('arterialPH', v)}
        />
        <Slider
          label="Serum glucose"
          value={inputs.serumGlucoseMgDl}
          min={70}
          max={800}
          step={10}
          unit=" mg/dL"
          onChange={(v) => onChange('serumGlucoseMgDl', v)}
        />
      </ControlGroup>

      <ControlGroup label="Renal handling">
        <Slider
          label="GFR"
          value={inputs.gfrFraction}
          min={0.05}
          max={1.2}
          step={0.01}
          unit="%"
          formatValue={(v) => Math.round(v * 100).toString()}
          onChange={(v) => onChange('gfrFraction', v)}
        />
        <Slider
          label="Aldosterone drive"
          value={inputs.aldosteroneDrive}
          min={0}
          max={3}
          step={0.1}
          formatValue={multiple}
          onChange={(v) => onChange('aldosteroneDrive', v)}
        />
        <ToggleGroup
          label="ADH secretion"
          value={inputs.adhMode}
          options={ADH_OPTIONS}
          colorVar="var(--adh)"
          onChange={(v) => onChange('adhMode', v)}
        />
        <ToggleGroup
          label="Diuretic"
          value={inputs.diuretic}
          options={DIURETIC_OPTIONS}
          colorVar="var(--tubule)"
          onChange={(v) => onChange('diuretic', v)}
        />
      </ControlGroup>

      <ControlGroup label="Losses & treatment">
        <ToggleGroup
          label="Extrarenal loss"
          value={inputs.extrarenalLoss}
          options={LOSS_OPTIONS}
          colorVar="var(--sodium)"
          onChange={(v) => onChange('extrarenalLoss', v)}
        />
        <ToggleGroup
          label="Infusion"
          value={inputs.infusion}
          options={INFUSION_OPTIONS}
          colorVar="var(--potassium)"
          onChange={(v) => onChange('infusion', v)}
        />
      </ControlGroup>
    </ControlRail>
  );
}
