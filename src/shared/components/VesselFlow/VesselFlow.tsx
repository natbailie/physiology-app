import type { CSSProperties } from 'react';
import styles from './VesselFlow.module.css';

interface VesselFlowProps {
  path: string;
  speed: number;
  colorVar: string;
  /** Calibre as a multiple of normal. Lets a module show a vessel constricting or dilating,
   * which is the only way a resistance change is visible in the drawing rather than only in
   * the readouts. Defaults to 1, so existing callers are unaffected. */
  width?: number;
}

/** A vessel: a faint static path plus an animated dashed overlay showing flow direction/speed. */
export function VesselFlow({ path, speed, colorVar, width = 1 }: VesselFlowProps) {
  const style = { '--flow-speed': speed, '--vessel-calibre': width } as CSSProperties;
  return (
    <g style={style}>
      <path className={styles.vessel} d={path} stroke={colorVar} />
      <path className={styles.vesselFlow} d={path} stroke={colorVar} />
    </g>
  );
}
