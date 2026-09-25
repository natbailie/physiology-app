import * as React from 'react';
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { DiagramFrame } from '@/shared/components/DiagramFrame/DiagramFrame';
import { VesselFlow } from '@/shared/components/VesselFlow/VesselFlow';
import { HormoneArrow } from '@/shared/components/HormoneArrow/HormoneArrow';
import type { DefNode, FrameNode, GradientStop, LabelRailNode, SceneNode } from '../types';
import { contentViewBox, layoutRail, RAIL_BADGE_R, RAIL_DOT_R, RAIL_NARROW_BELOW, type RailKeyEntry } from '../labelRail';
import type { ResolvedDiagramClasses } from './diagramClasses';
import rail from './LabelRail.module.css';

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

interface RenderCtx {
  viewBox: readonly [number, number, number, number];
  /** First badge number for each rail in the frame. Two rails must not both start at 1. */
  railOffset: Map<LabelRailNode, number>;
  /** The frame has no room for a rail of words, so its names are badges plus a key below. */
  narrow: boolean;
}

function renderNode(node: SceneNode, classes: ResolvedDiagramClasses, index: number, ctx: RenderCtx): ReactNode {
  switch (node.type) {
    case 'group':
      return (
        <g key={index} className={resolveClass(classes, node.cls)} transform={node.transform} style={node.styleVars ? toStyleVars(node.styleVars) : undefined}>
          {node.children.map((child, i) => renderNode(child, classes, i, ctx))}
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
          strokeDasharray={node.strokeDasharray}
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
    case 'labelRail': {
      const { labels, badges } = layoutRail(node, ctx.viewBox);
      const offset = ctx.railOffset.get(node) ?? 0;

      if (ctx.narrow) {
        return (
          <g key={index}>
            {badges.map((b) => (
              <g key={b.n}>
                <circle cx={b.x} cy={b.y} r={RAIL_BADGE_R} fill="var(--panel)" stroke="var(--text-faint)" strokeWidth={1} />
                <text x={b.x} y={b.y + 4} className={resolveClass(classes, 'railBadge')} textAnchor="middle">
                  {b.n + offset}
                </text>
              </g>
            ))}
          </g>
        );
      }

      return (
        <g key={index}>
          {labels.map((l, i) => (
            // eslint-disable-next-line react/no-array-index-key -- a rail is a fixed authored list
            <g key={i}>
              <path d={l.leader} className={resolveClass(classes, 'leader')} fill="none" />
              <circle cx={l.dot[0]} cy={l.dot[1]} r={RAIL_DOT_R} fill="var(--text-faint)" />
              <text x={l.x} y={l.y} className={resolveClass(classes, l.cls)} textAnchor={l.anchor}>
                {l.text}
              </text>
            </g>
          ))}
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
/** Rails may be nested in a group, so the key is gathered by walking rather than by reading
 *  `frame.children` — a rail that rendered its badges and contributed no key would be a drawing
 *  covered in unexplained numbers. */
function collectRails(nodes: readonly SceneNode[], out: LabelRailNode[] = []): LabelRailNode[] {
  for (const node of nodes) {
    if (node.type === 'labelRail') out.push(node);
    else if (node.type === 'group') collectRails(node.children, out);
  }
  return out;
}

/**
 * Whether the drawing has room for a rail of words.
 *
 * Measured rather than asked of CSS. A container query handled the earlier version of this swap
 * with no JavaScript at all, and it cannot handle this one: a narrow frame also crops its viewBox
 * to drop the empty gutters, and the viewBox is an attribute no stylesheet can reach.
 *
 * `undefined` until the first observation, and treated as narrow until then — guessing wide would
 * paint one frame of 8px labels on every mount.
 */
function usePanelWidth(): [React.RefObject<HTMLDivElement | null>, number | undefined] {
  const ref = useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = useState<number | undefined>(undefined);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(([entry]) => {
      if (entry) setWidth(entry.contentRect.width);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, width];
}

export function DiagramView({ frame, classes }: DiagramViewProps) {
  const [panelRef, width] = usePanelWidth();
  const rails = collectRails(frame.children);
  const narrow = rails.length > 0 && (width ?? 0) < RAIL_NARROW_BELOW;

  /* The key is read out of the LAYOUT, not out of `items`: a rail seats each label beside its own
   * target and then numbers the columns top to bottom, so author order and reading order are not
   * the same list. Numbering from `items` here would have put "3" on the drawing next to the row
   * the key called "1".
   *
   * Continuous across rails, so two rails in one frame do not both start at 1, and the same
   * offsets go to the badges — which is what keeps a badge and its key row agreeing. */
  const railOffset = new Map<LabelRailNode, number>();
  const key: RailKeyEntry[] = [];
  for (const r of rails) {
    const offset = key.length;
    railOffset.set(r, offset);
    for (const entry of layoutRail(r, frame.viewBox).key) {
      key.push({ n: entry.n + offset, text: entry.text });
    }
  }

  /* A rail is always laid out against the frame's OWN viewBox, even when the svg is drawn with the
   * cropped one — the targets are in frame coordinates and cropping must not move them. */
  const ctx: RenderCtx = { viewBox: frame.viewBox, railOffset, narrow };
  const drawnViewBox = narrow ? contentViewBox(rails, frame.viewBox) : frame.viewBox;

  return (
    <DiagramFrame
      panelRef={panelRef}
      viewBox={drawnViewBox.join(' ')}
      ariaLabel={frame.ariaLabel}
      defs={frame.defs?.map((def, i) => renderDef(def, i))}
      footer={
        narrow && key.length > 0 ? (
          <ol className={rail.key}>
            {key.map((entry) => (
              <li key={entry.n} className={rail.keyRow}>
                <span className={rail.keyNum}>{entry.n}</span>
                <span>{entry.text}</span>
              </li>
            ))}
          </ol>
        ) : undefined
      }
    >
      {frame.children.map((node, i) => renderNode(node, classes, i, ctx))}
    </DiagramFrame>
  );
}
