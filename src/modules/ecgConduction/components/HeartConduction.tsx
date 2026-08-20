import type { CSSProperties } from 'react';
import styles from './Diagram.module.css';
import type { RegionActivation, RegionId, RegionState } from '../engine/types';

interface HeartConductionProps {
  x: number;
  y: number;
  regions: RegionActivation[];
}

/** Schematic four-chamber heart. Shapes are drawn in anatomical convention — the patient's
 * right side on the viewer's left — so the leftward/inferior sweep of ventricular activation
 * reads the same way it does on a real diagram. */
const CHAMBER_PATHS: Partial<Record<RegionId, string>> = {
  rightAtrium: 'M-64,-64 C-30,-76 -6,-70 -4,-44 C-3,-26 -22,-18 -44,-22 C-62,-25 -72,-44 -64,-64 Z',
  leftAtrium: 'M64,-64 C30,-76 6,-70 4,-44 C3,-26 22,-18 44,-22 C62,-25 72,-44 64,-64 Z',
  rvFreeWall: 'M-58,-14 C-30,-20 -12,-10 -10,16 C-9,44 -24,66 -44,62 C-62,58 -70,26 -58,-14 Z',
  lvFreeWall: 'M18,-4 C48,-12 72,10 70,42 C68,72 44,88 22,80 C4,73 2,40 8,16 C11,4 14,-1 18,-4 Z',
  lvBase: 'M14,-24 C40,-32 62,-22 64,-6 C65,6 46,10 30,6 C20,3 14,-8 14,-24 Z',
  septum: 'M-6,-16 C2,-18 8,-6 8,18 C8,44 2,64 -6,62 C-12,60 -14,38 -14,20 C-14,2 -12,-14 -6,-16 Z',
};

const CHAMBER_LABELS: Partial<Record<RegionId, { x: number; y: number; text: string }>> = {
  rightAtrium: { x: -36, y: -46, text: 'RA' },
  leftAtrium: { x: 36, y: -46, text: 'LA' },
  rvFreeWall: { x: -40, y: 28, text: 'RV' },
  lvFreeWall: { x: 42, y: 50, text: 'LV' },
  septum: { x: -2, y: 88, text: 'Septum' },
};

/** Conduction-system geometry: thin paths and small nodes, sized to make the point that this
 * tissue is electrically decisive but far too small to register on the surface ECG. */
const CONDUCTION_PATHS: Partial<Record<RegionId, string>> = {
  hisBundle: 'M-2,-18 L-2,4',
  rightBundle: 'M-2,4 C-10,16 -20,28 -30,44',
  leftBundle: 'M-2,4 C10,16 24,28 38,44',
};

const NODE_POSITIONS: Partial<Record<RegionId, { cx: number; cy: number; r: number; label: string; labelX: number; labelY: number }>> = {
  saNode: { cx: -50, cy: -60, r: 5, label: 'SA', labelX: -50, labelY: -74 },
  avNode: { cx: -2, cy: -24, r: 4.5, label: 'AV', labelX: 16, labelY: -24 },
};

function stateClass(state: RegionState): string {
  switch (state) {
    case 'depolarizing':
      return styles.depolarizing ?? '';
    case 'depolarized':
      return styles.depolarized ?? '';
    case 'repolarizing':
      return styles.repolarizing ?? '';
    default:
      return styles.resting ?? '';
  }
}

export function HeartConduction({ x, y, regions }: HeartConductionProps) {
  const byId = new Map(regions.map((region) => [region.id, region]));

  const renderRegion = (id: RegionId) => {
    const path = CHAMBER_PATHS[id];
    const region = byId.get(id);
    if (!path || !region) return null;
    const style = { '--phase': region.phaseProgress } as CSSProperties;
    return <path key={id} className={stateClass(region.state)} d={path} style={style} />;
  };

  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Chambers first, then conduction tissue on top of them. */}
      {(['rightAtrium', 'leftAtrium', 'rvFreeWall', 'lvBase', 'lvFreeWall', 'septum'] as RegionId[]).map(renderRegion)}

      {(Object.entries(CONDUCTION_PATHS) as [RegionId, string][]).map(([id, path]) => {
        const region = byId.get(id);
        const active = region?.state === 'depolarizing';
        return <path key={id} className={active ? styles.conductionPathActive : styles.conductionPath} d={path} />;
      })}

      {(Object.entries(NODE_POSITIONS) as [RegionId, NonNullable<(typeof NODE_POSITIONS)[RegionId]>][]).map(([id, node]) => {
        const region = byId.get(id);
        const active = region?.state === 'depolarizing';
        return (
          <g key={id}>
            <circle className={active ? styles.nodeActive : styles.node} cx={node.cx} cy={node.cy} r={node.r} />
            <text className={styles.pathLabel} x={node.labelX} y={node.labelY} textAnchor="middle">
              {node.label}
            </text>
          </g>
        );
      })}

      {Object.entries(CHAMBER_LABELS).map(([id, label]) => (
        <text key={id} className={styles.organLabel} x={label.x} y={label.y}>
          {label.text}
        </text>
      ))}
    </g>
  );
}
