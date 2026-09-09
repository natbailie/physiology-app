import { ReadoutItem } from '@/shared/components/ReadoutItem/ReadoutItem';
import readoutGridStyles from '@/shared/components/ReadoutPanel/ReadoutPanel.module.css';
import type { ReadoutContext, ReadoutSpec } from '../types';

interface ReadoutGridViewProps<State, Derived, Inputs> {
  readouts: readonly ReadoutSpec<State, Derived, Inputs>[];
  ctx: ReadoutContext<State, Derived, Inputs>;
}

/** The readout tile grid rendered from specs. The grid chrome is the same shared panel class the
 * hand-written grids used, so the schema grid sits in the page exactly where the old one did.
 *
 * Nothing here tells the tutor what is on screen: each `ReadoutItem` registers itself, which is
 * what lets the thirty-eight pages still rendering a hand-written panel be seen too. See
 * `shared/chat/tileRegistry.ts`. */
export function ReadoutGridView<State, Derived, Inputs>({ readouts, ctx }: ReadoutGridViewProps<State, Derived, Inputs>) {
  return (
    <div className={readoutGridStyles.grid}>
      {readouts.map((spec) => (
        <ReadoutItem
          key={spec.label}
          label={spec.label}
          value={spec.value(ctx)}
          unit={spec.unit}
          secondary={spec.secondary?.(ctx)}
          setPoint={spec.setPoint?.(ctx)}
          colorVar={spec.colorToken ? `var(--${spec.colorToken})` : undefined}
          wide={spec.wide}
          revealsPattern={spec.revealsPattern}
        />
      ))}
    </div>
  );
}
