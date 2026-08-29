import { useTheme, type ThemePreference } from './useTheme';
import styles from './ThemeToggle.module.css';

const OPTIONS: { value: ThemePreference; label: string; title: string }[] = [
  { value: 'light', label: 'Light', title: 'Always light' },
  { value: 'system', label: 'Auto', title: 'Follow this device' },
  { value: 'dark', label: 'Dark', title: 'Always dark' },
];

/**
 * Three states, not a switch. "Auto" has to be reachable: a learner who has never chosen
 * follows their machine, and a two-way toggle gives them no way back to that once they have
 * touched it.
 */
export function ThemeToggle() {
  const { preference, choose } = useTheme();
  return (
    <div className={styles.group} role="radiogroup" aria-label="Colour theme">
      {OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={preference === option.value}
          title={option.title}
          className={styles.option}
          onClick={() => choose(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
