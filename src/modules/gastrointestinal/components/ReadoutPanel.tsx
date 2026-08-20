import { ReadoutItem } from '@/shared/components/ReadoutItem/ReadoutItem';
import styles from '@/shared/components/ReadoutPanel/ReadoutPanel.module.css';
import type { GiDerived } from '../engine/types';

interface ReadoutPanelProps {
  derived: GiDerived;
}

export function ReadoutPanel({ derived }: ReadoutPanelProps) {
  return (
    <div className={styles.grid}>
      <ReadoutItem label="Gastric pH" value={derived.gastricPH.toFixed(1)} colorVar="var(--gastrin)" />
      <ReadoutItem label="Duodenal pH" value={derived.duodenalPH.toFixed(1)} colorVar="var(--secretin)" />
      <ReadoutItem label="Acid output" value={derived.gastricAcidOutput.toFixed(0)} unit="%" colorVar="var(--gastrin)" />
      <ReadoutItem label="Gastric volume" value={(derived.gastricVolumeFraction * 100).toFixed(0)} unit="%" colorVar="var(--motility)" />
      <ReadoutItem label="Gastrin" value={(derived.gastrinDrive * 100).toFixed(0)} unit="%" colorVar="var(--gastrin)" />
      <ReadoutItem label="Somatostatin" value={(derived.somatostatinDrive * 100).toFixed(0)} unit="%" colorVar="var(--somatostatin)" />
      <ReadoutItem label="CCK" value={(derived.cckDrive * 100).toFixed(0)} unit="%" colorVar="var(--cck)" />
      <ReadoutItem label="Secretin" value={(derived.secretinDrive * 100).toFixed(0)} unit="%" colorVar="var(--secretin)" />
      <ReadoutItem label="GIP / GLP-1" value={(derived.gipGlp1Drive * 100).toFixed(0)} unit="%" colorVar="var(--cck)" />
    </div>
  );
}
