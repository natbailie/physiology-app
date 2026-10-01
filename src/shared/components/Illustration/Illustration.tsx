import { useId } from 'react';

export type IllustrationKind = 'welcome' | 'exam' | 'access' | 'search' | 'error';

interface IllustrationProps {
  kind: IllustrationKind;
  /** Rendered size in px. The art is square and scales cleanly. */
  size?: number;
  className?: string;
}

/**
 * The small set of spot illustrations the app uses: a hero on the sign-in card and pricing page,
 * an empty state for search, an error state.
 *
 * Hand-drawn SVG on purpose (see CLAUDE.md — no new runtime dependencies for anything a learner
 * sees), and painted entirely from theme tokens, so each one is correct in light and dark without
 * a second asset. Two colours only: `--brand` for the drawing and `--select` for the one detail
 * that is meant to catch the eye. The native app carries the same set in
 * `src/presentation/ui/Illustration.tsx`; keep the two in step.
 *
 * Decorative by default (`aria-hidden`): every place one appears already says in words what it is
 * illustrating.
 */
export function Illustration({ kind, size = 160, className }: IllustrationProps) {
  const id = useId();
  const glow = `${id}-glow`;

  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 160 160"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <radialGradient id={glow} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="var(--brand)" stopOpacity="0.28" />
          <stop offset="100%" stopColor="var(--brand)" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="80" cy="80" r="76" fill={`url(#${glow})`} />
      {kind === 'welcome' && <Welcome />}
      {kind === 'exam' && <Exam />}
      {kind === 'access' && <Access />}
      {kind === 'search' && <Search />}
      {kind === 'error' && <ErrorArt />}
    </svg>
  );
}

const STROKE = { stroke: 'var(--brand)', strokeWidth: 5, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;
const PICK = { stroke: 'var(--select)', strokeWidth: 5, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;

/** A heart over its own trace: the product in one picture — physiology you can watch move. */
function Welcome() {
  return (
    <g>
      <path
        d="M80 118 C52 98 40 82 40 66 C40 52 51 43 63 43 C71 43 77 47 80 53 C83 47 89 43 97 43 C109 43 120 52 120 66 C120 82 108 98 80 118 Z"
        fill="var(--panel)"
        {...STROKE}
      />
      <path d="M26 84 H58 L66 66 L78 104 L90 58 L98 84 H134" {...PICK} />
    </g>
  );
}

/** A clipboard with a ticked line: the exam you are revising for. */
function Exam() {
  return (
    <g>
      <rect x="46" y="36" width="68" height="92" rx="10" fill="var(--panel)" {...STROKE} />
      <rect x="64" y="28" width="32" height="14" rx="6" fill="var(--panel)" {...STROKE} />
      <path d="M60 66 L68 74 L82 58" {...PICK} />
      <path d="M90 66 H102" {...STROKE} />
      <path d="M60 94 H102" {...STROKE} strokeOpacity="0.5" />
      <path d="M60 110 H88" {...STROKE} strokeOpacity="0.5" />
    </g>
  );
}

/** An open padlock: everything unlocked. */
function Access() {
  return (
    <g>
      <path d="M58 72 V56 C58 43 67 36 80 36 C93 36 102 43 102 56" {...STROKE} />
      <rect x="44" y="72" width="72" height="54" rx="12" fill="var(--panel)" {...STROKE} />
      <circle cx="80" cy="98" r="6" fill="var(--select)" />
      <path d="M80 104 V114" {...PICK} />
    </g>
  );
}

/** A magnifier with nothing under it yet. */
function Search() {
  return (
    <g>
      <circle cx="72" cy="72" r="30" fill="var(--panel)" {...STROKE} />
      <path d="M94 94 L122 122" {...PICK} />
      <path d="M60 72 H84" {...STROKE} strokeOpacity="0.5" />
    </g>
  );
}

/** A flat trace with one kink: something went wrong, nothing is lost. */
function ErrorArt() {
  return (
    <g>
      <rect x="32" y="48" width="96" height="64" rx="12" fill="var(--panel)" {...STROKE} />
      <path d="M44 82 H66 L74 66 L84 100 L92 82 H116" {...PICK} strokeOpacity="0.9" />
    </g>
  );
}
