import type { CSSProperties, ReactNode } from 'react';
import { DiagramFrame } from '@/shared/components/DiagramFrame/DiagramFrame';
import { VesselFlow } from '@/shared/components/VesselFlow/VesselFlow';
import { HormoneArrow } from '@/shared/components/HormoneArrow/HormoneArrow';
import type { ClipNode, FrameNode, MarkerNode, SceneNode } from '../types';
import { ORGANS } from './organs';
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

function renderDef(def: MarkerNode | ClipNode, index: number): ReactNode {
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
  return null;
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
          fill={node.fill === 'none' ? 'none' : colorVar(node.fill)}
          strokeWidth={node.strokeWidth}
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
          fill={colorVar(node.fill)}
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
          fill={colorVar(node.fill)}
          clipPath={node.clipPathId ? `url(#${node.clipPathId})` : undefined}
          style={node.styleVars ? toStyleVars(node.styleVars) : undefined}
        />
      );
    case 'line':
      return <line key={index} x1={node.x1} y1={node.y1} x2={node.x2} y2={node.y2} className={resolveClass(classes, node.cls)} stroke={colorVar(node.colorToken)} />;
    case 'text':
      return (
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
    case 'organ': {
      const Organ = ORGANS[node.name];
      return <Organ key={index} x={node.x} y={node.y} params={node.params} classes={classes} />;
    }
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