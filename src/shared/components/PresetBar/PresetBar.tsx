import { memo, useEffect, useState } from 'react';
import { useModuleShell } from '@/shared/context/moduleShell';
import styles from './PresetBar.module.css';

export interface PresetAction {
  label: string;
  onClick: () => void;
  /** 'impulse' = a one-off stimulus (Eat meal, Stimulate); 'danger' = an insult
   * applied to the model (Hemorrhage, Infect). Default is a plain preset button. */
  variant?: 'impulse' | 'danger';
}

export interface PresetGroup<T extends string> {
  label: string;
  order: readonly T[];
}

interface PresetBarProps<T extends string> {
  order: readonly T[];
  /**
   * Splits the scenarios into labelled runs.
   *
   * For a module whose presets fall into two genuinely different families — the four
   * mechanisms, and the same mechanisms met clinically — an undifferentiated row of eleven
   * buttons hides the structure that is half the teaching. Falls back to a single flat run
   * when absent, so existing modules are untouched.
   */
  groups?: readonly PresetGroup<T>[];
  labels: Record<T, string>;
  onApply: (name: T) => void;
  actions?: PresetAction[];
  /** Returns a URL reproducing the current scenario. Renders a copy-link affordance when given. */
  onShare?: () => string;
  onReset: () => void;
  /** Locks the bar while a pattern question is open. Loading a different scenario mid-question
   * would silently replace the one being asked about. The shell's blindness ORs in beside it,
   * so a page that never passed this is still covered while its own session runs. */
  disabled?: boolean;
}

/** Scenario presets and one-off actions, pinned in ModulePage's sticky top bar —
 * the fastest path to a teaching point, so it stays reachable at every scroll position. */
function PresetBarBase<T extends string>({
  order,
  groups,
  labels,
  onApply,
  actions,
  onShare,
  onReset,
  disabled = false,
}: PresetBarProps<T>) {
  const [copied, setCopied] = useState(false);
  const { registerScenarios, blinded } = useModuleShell();

  /**
   * Locked while a pattern question is open — from this bar's own `disabled` prop, or from the
   * shell, which carries the blindness of whichever tab owns the session. Reading the shell
   * closes the pages that never passed `disabled`: a blinded learner crossing to the lab could
   * otherwise silently replace the scenario being asked about. Loading a different scenario
   * mid-question would answer it from the preset row.
   */
  const locked = disabled || blinded;

  /**
   * Publish the scenarios so the explainer can offer "show me" buttons beside the prose that
   * names them. The bar already holds both halves — the labels and the apply handler — so
   * registering here is what keeps this feature out of all 45 module pages.
   *
   * `labels` and `onApply` are module-level constants and a `useCallback`, so this settles after
   * the first commit; `locked` re-registers only on a practice phase change.
   */
  useEffect(() => {
    // A `Record<T, string>` over a union has no index signature, so it needs the widening
    // cast the shell's untyped, module-agnostic view of scenarios requires.
    registerScenarios({
      labels: labels as Record<string, string>,
      apply: onApply as (id: string) => void,
      disabled: locked,
    });
    return () => registerScenarios(null);
  }, [registerScenarios, labels, onApply, locked]);

  /**
   * Copy, then say so for a moment.
   *
   * Without the acknowledgement a learner cannot tell the button did anything — the clipboard
   * is invisible — and will click it repeatedly. Falls back to a prompt where the clipboard API
   * is unavailable (an insecure origin, or a browser that refuses without a gesture it trusts),
   * because a link the user can select beats a button that silently fails.
   */
  const handleShare = async () => {
    if (!onShare) return;
    const url = onShare();
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      window.prompt('Copy this link to share the scenario', url);
    }
  };
  const runs: readonly PresetGroup<T>[] = groups ?? [{ label: '', order }];

  return (
    <div className={styles.bar}>
      <div className={styles.presets}>
        {runs.map((run) => (
          <div key={run.label} className={styles.group}>
            {run.label && <span className={styles.groupLabel}>{run.label}</span>}
            {run.order.map((name) => (
              <button
                key={name}
                type="button"
                className={styles.preset}
                disabled={locked}
                onClick={() => onApply(name)}
              >
                {labels[name]}
              </button>
            ))}
          </div>
        ))}
      </div>

      <div className={styles.actions}>
        {onShare && (
          <button
            type="button"
            className={styles.share}
            disabled={locked}
            onClick={() => void handleShare()}
          >
            {copied ? 'Link copied' : 'Share'}
          </button>
        )}
        {actions?.map((action) => (
          <button
            key={action.label}
            type="button"
            className={action.variant === 'danger' ? styles.danger : styles.impulse}
            disabled={locked}
            onClick={action.onClick}
          >
            {action.label}
          </button>
        ))}
        <button type="button" className={styles.reset} disabled={locked} onClick={onReset}>
          Reset
        </button>
      </div>
    </div>
  );
}

export const PresetBar = memo(PresetBarBase) as typeof PresetBarBase;
