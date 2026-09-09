import type { CSSProperties, ReactNode } from 'react';
import { DiagramFrame } from '@/shared/components/DiagramFrame/DiagramFrame';
import { VesselFlow } from '@/shared/components/VesselFlow/VesselFlow';
import { HormoneArrow } from '@/shared/components/HormoneArrow/HormoneArrow';
import type { DefNode, FrameNode, GradientStop, SceneNode } from '../types';
import type { ResolvedDiagramClasses } from './diagramClasses';

/** `{ 'glucose': 0.7 }` → `{ '--glucose': 0.7 }`, exactly the style objects the hand-written
 * components spread onto their elements. */
function toStyleVars(vars: Readonly<Record<string, number | string>>): CSSProperties {
  return Object.fromEntries(Object.entries(vars).map(([key, value]) => [`--${key}`, value])) as CSSProperties;
}

function colorVar(token?: string): string | undefined {
  return token ? `var(--${token})` : undefined;
}

/** Scene nodes carry semantic `cls` keys; the renderer resolves them against the module's
 * stylesheet so the data never imports CSS. Unknown keys fall through as no class — never a crash. */
function resolveClass(classes: ResolvedDiagramClasses, cls?: string): string | undefined {
  return cls ? classes[cls as keyof ResolvedDiagramClasses] : undefined;
}

function renderStops(stops: readonly GradientStop[]): ReactNode {
  return stops.map((stop, i) => (
    // eslint-disable-next-line react/no-array-index-key -- stops are a fixed authored list
    <stop key={i} offset={stop.offset} stopColor={colorVar(stop.colorToken)} stopOpacity={stop.opacity} />
  ));
}

function renderDef(def: DefNode, index: number): ReactNode {
  if (def.type === 'marker') {
    return (
      <marker key={index} id={def.id} markerWidth={8} markerHeight={8} refX={6} refY={4} orient="auto">
        <path d="M0,0 L8,4 L0,8 Z" fill={colorVar(def.colorToken)} />
      </marker>
    );
  }
  if (def.type === 'clipPath') {
    return (
      <clipPath key={index} id={def.id}>
        {def.children.map((path, i) => (
          <path key={i} d={path.d} />
        ))}
      </clipPath>
    );
  }
  /* `objectBoundingBox` by default, so one gradient serves every shape that references it
   * whatever its size; `userSpaceOnUse` is how an organ gets ONE light source across all of its
   * parts instead of one per part. */
  if (def.type === 'linearGradient') {
    return (
      <linearGradient key={index} id={def.id} gradientUnits={def.units} x1={def.x1} y1={def.y1} x2={def.x2} y2={def.y2}>
        {renderStops(def.stops)}
      </linearGradient>
    );
  }
  return (
    <radialGradient key={index} id={def.id} gradientUnits={def.units} cx={def.cx} cy={def.cy} r={def.r} fx={def.fx} fy={def.fy}>
      {renderStops(def.stops)}
    </radialGradient>
  );
}

/** A gradient reference wins over a flat token, so a shaded shape needs only the one field. */
function paint(fill: string | undefined, gradientId: string | undefined): string | undefined {
  if (gradientId) return `url(#${gradientId})`;
  return fill === 'none' ? 'none' : colorVar(fill);
}

function renderNode(node: SceneNode, classes: ResolvedDiagramClasses, index: number): ReactNode {
  switch (node.type) {
    case 'group':
      return (
        <g key={index} className={resolveClass(classes, node.cls)} transform={node.transform} style={node.styleVars ? toStyleVars(node.styleVars) : undefined}>
          {node.children.map((child, i) => renderNode(child, classes, i))}
        </g>
      );
    case 'path':
      return (
        <path
          key={index}
          d={node.d}
          className={resolveClass(classes, node.cls)}
          stroke={colorVar(node.colorToken)}
          fill={paint(node.fill, node.fillGradientId)}
          fillOpacity={node.fillOpacity}
          strokeWidth={node.strokeWidth}
          strokeOpacity={node.strokeOpacity}
          strokeLinecap={node.strokeLinecap}
          strokeLinejoin={node.strokeLinejoin}
          opacity={node.opacity}
          markerEnd={node.markerEnd ? `url(#${node.markerEnd})` : undefined}
          clipPath={node.clipPathId ? `url(#${node.clipPathId})` : undefined}
          style={node.styleVars ? toStyleVars(node.styleVars) : undefined}
        />
      );
    case 'circle':
      return (
        <circle
          key={index}
          cx={node.cx}
          cy={node.cy}
          r={node.r}
          className={resolveClass(classes, node.cls)}
          fill={paint(node.fill, node.fillGradientId)}
          fillOpacity={node.fillOpacity}
          stroke={colorVar(node.stroke)}
          strokeWidth={node.strokeWidth}
          opacity={node.opacity}
          style={node.styleVars ? toStyleVars(node.styleVars) : undefined}
        />
      );
    case 'rect':
      return (
        <rect
          key={index}
          x={node.x}
          y={node.y}
          width={node.width}
          height={node.height}
          className={resolveClass(classes, node.cls)}
          fill={paint(node.fill, node.fillGradientId)}
          fillOpacity={node.fillOpacity}
          stroke={colorVar(node.stroke)}
          strokeWidth={node.strokeWidth}
          opacity={node.opacity}
          clipPath={node.clipPathId ? `url(#${node.clipPathId})` : undefined}
          style={node.styleVars ? toStyleVars(node.styleVars) : undefined}
        />
      );
    case 'line':
      return <line key={index} x1={node.x1} y1={node.y1} x2={node.x2} y2={node.y2} className={resolveClass(classes, node.cls)} stroke={colorVar(node.colorToken)} />;
    case 'text': {
      const label = (
        <text
          key={index}
          x={node.x}
          y={node.y}
          className={resolveClass(classes, node.cls)}
          textAnchor={node.anchor}
          fill={colorVar(node.colorToken)}
          opacity={node.opacity}
          style={node.styleVars ? toStyleVars(node.styleVars) : undefined}
        >
          {node.text}
        </text>
      );
      if (!node.halo) return label;
      /* The halo is the SAME text stroked in the background colour, underneath. Two passes rather
       * than `paint-order: stroke fill`, which react-native-svg does not support — and the two
       * renderers have to agree, or a label is legible on one platform and not the other. */
      return (
        <g key={index}>
          <text
            x={node.x}
            y={node.y}
            className={resolveClass(classes, node.cls)}
            textAnchor={node.anchor}
            fill={colorVar(node.halo)}
            stroke={colorVar(node.halo)}
            strokeWidth={node.haloWidth ?? 3}
            strokeLinejoin="round"
            opacity={node.opacity}
            aria-hidden="true"
            style={node.styleVars ? toStyleVars(node.styleVars) : undefined}
          >
            {node.text}
          </text>
          {label}
        </g>
      );
    }
    case 'vessel':
      return <VesselFlow key={index} path={node.path} speed={node.speed} colorVar={colorVar(node.colorToken) ?? ''} width={node.width} />;
    case 'axis':
      return (
        <HormoneArrow
          key={index}
          path={node.path}
          activation={node.activation}
          colorVar={colorVar(node.colorToken) ?? ''}
          label={node.label}
          markerId={node.markerId}
          labelPos={{ x: node.labelX, y: node.labelY }}
          inhibitory={node.inhibitory}
        />
      );
  }
}

interface DiagramViewProps {
  frame: FrameNode;
  classes: ResolvedDiagramClasses;
}

/** One schema diagram rendered by the web renderer: the shared frame, its defs, then the scene. */
export function DiagramView({ frame, classes }: DiagramViewProps) {
  return (
    <DiagramFrame
      viewBox={frame.viewBox.join(' ')}
      ariaLabel={frame.ariaLabel}
      defs={frame.defs?.map((def, i) => renderDef(def, i))}
    >
      {frame.children.map((node, i) => renderNode(node, classes, i))}
    </DiagramFrame>
  );
}