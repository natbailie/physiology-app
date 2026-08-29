import { memo } from 'react';
import { Slider } from '@/shared/components/Slider/Slider';
import { ToggleGroup } from '@/shared/components/ToggleGroup/ToggleGroup';
import { ControlGroup, ControlRail } from '@/shared/components/ControlRail/ControlRail';
import type { VisionInputs } from '../engine/types';
import type { FieldLesionSite } from '../engine/visualFields';

interface ControlPanelProps {
  inputs: VisionInputs;
  onChange: <K extends keyof VisionInputs>(key: K, value: VisionInputs[K]) => void;
}

const percent = (v: number) => Math.round(v * 100).toString();
const times = (v: number) => `${v.toFixed(2)}x`;

const LESION_OPTIONS: { value: FieldLesionSite; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'leftOpticNerve', label: 'L nerve' },
  { value: 'rightOpticNerve', label: 'R nerve' },
  { value: 'chiasmalCentre', label: 'Chiasm' },
  { value: 'leftOpticTract', label: 'L tract' },
  { value: 'rightOpticTract', label: 'R tract' },
  { value: 'leftTemporalRadiation', label: "L Meyer's" },
  { value: 'rightTemporalRadiation', label: "R Meyer's" },
  { value: 'leftParietalRadiation', label: 'L parietal' },
  { value: 'rightParietalRadiation', label: 'R parietal' },
  { value: 'leftOccipitalLobe', label: 'L occipital' },
  { value: 'rightOccipitalLobe', label: 'R occipital' },
];

function ControlPanelBase({ inputs, onChange }: ControlPanelProps) {
  return (
    <ControlRail>
      <ControlGroup label="Scene & retina">
        <Slider
          label="Scene luminance"
          value={inputs.sceneLuminanceLogCd}
          min={-5}
          max={4}
          step={0.5}
          unit=" log cd/m²"
          onChange={(v) => onChange('sceneLuminanceLogCd', v)}
        />
        <Slider
          label="Rod integrity"
          value={inputs.rodIntegrity}
          min={0}
          max={1}
          step={0.02}
          unit="%"
          formatValue={percent}
          onChange={(v) => onChange('rodIntegrity', v)}
        />
        <Slider
          label="Foveal cone integrity"
          value={inputs.coneIntegrity}
          min={0}
          max={1}
          step={0.02}
          unit="%"
          formatValue={percent}
          onChange={(v) => onChange('coneIntegrity', v)}
        />
      </ControlGroup>

      <ControlGroup label="Pupil reflexes">
        <Slider
          label="Left optic nerve (afferent)"
          value={inputs.leftOpticNerveAfferent}
          min={0}
          max={1}
          step={0.02}
          unit="%"
          formatValue={percent}
          onChange={(v) => onChange('leftOpticNerveAfferent', v)}
        />
        <Slider
          label="Right pupil efferent"
          value={inputs.rightPupilEfferentGain}
          min={0}
          max={1}
          step={0.02}
          unit="%"
          formatValue={percent}
          onChange={(v) => onChange('rightPupilEfferentGain', v)}
        />
      </ControlGroup>

      <ControlGroup label="Near response">
        <Slider
          label="Fixation distance"
          value={inputs.targetDistanceMetres}
          min={0.12}
          max={6}
          step={0.02}
          unit=" m"
          formatValue={(v) => v.toFixed(2)}
          onChange={(v) => onChange('targetDistanceMetres', v)}
        />
        <Slider
          label="Lens amplitude"
          value={inputs.maximumAccommodationD}
          min={0}
          max={12}
          step={0.5}
          unit=" D"
          onChange={(v) => onChange('maximumAccommodationD', v)}
        />
      </ControlGroup>

      <ControlGroup label="Aqueous & pressure">
        <Slider
          label="Aqueous production"
          value={inputs.aqueousProductionRate}
          min={0}
          max={2}
          step={0.05}
          unit="%"
          formatValue={times}
          onChange={(v) => onChange('aqueousProductionRate', v)}
        />
        <Slider
          label="Meshwork outflow"
          value={inputs.trabecularOutflowFacility}
          min={0}
          max={1.5}
          step={0.02}
          unit="%"
          formatValue={percent}
          onChange={(v) => onChange('trabecularOutflowFacility', v)}
        />
        <Slider
          label="Angle width"
          value={inputs.angleWidthPct}
          min={0}
          max={100}
          step={2}
          unit="%"
          onChange={(v) => onChange('angleWidthPct', v)}
        />
      </ControlGroup>

      <ControlGroup label="Eye drops">
        <Slider
          label="Pilocarpine"
          value={inputs.pilocarpineDosePct}
          min={0}
          max={100}
          step={5}
          unit="%"
          onChange={(v) => onChange('pilocarpineDosePct', v)}
        />
        <Slider
          label="Acetazolamide"
          value={inputs.acetazolamideDosePct}
          min={0}
          max={100}
          step={5}
          unit="%"
          onChange={(v) => onChange('acetazolamideDosePct', v)}
        />
        <Slider
          label="Mydriatic"
          value={inputs.mydriaticDosePct}
          min={0}
          max={100}
          step={5}
          unit="%"
          onChange={(v) => onChange('mydriaticDosePct', v)}
        />
      </ControlGroup>

      <ToggleGroup
        label="Pathway lesion"
        value={inputs.fieldLesionSite}
        options={LESION_OPTIONS}
        colorVar="var(--retina)"
        onChange={(site) => onChange('fieldLesionSite', site)}
      />
    </ControlRail>
  );
}

export const ControlPanel = memo(ControlPanelBase);
