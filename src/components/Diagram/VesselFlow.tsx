import type { CSSProperties } from 'react';
import styles from './Diagram.module.css';

interface VesselFlowProps {
  path: string;
  speed: number;
  colorVar: string;
}

/** A vessel: a faint static path plus an animated dashed overlay showing flow direction/speed. */
export function VesselFlow({ path, speed, colorVar }: VesselFlowProps) {
  const style = { '--flow-speed': speed } as CSSProperties;
  return (
    <g style={style}>
      <path className={styles.vessel} d={path} stroke={colorVar} />
      <path className={styles.vesselFlow} d={path} stroke={colorVar} />
    </g>
  );
}
