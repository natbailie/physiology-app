// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { PresetBar } from './PresetBar';
import { ModuleShellProvider } from '@/shared/context/moduleShell';

afterEach(cleanup);

type Preset = 'normal' | 'alpha';

const ORDER: Preset[] = ['normal', 'alpha'];
const LABELS: Record<Preset, string> = { normal: 'Normal', alpha: 'Alpha disease' };

describe('PresetBar', () => {
  it('applies a preset when one is chosen', () => {
    const onApply = vi.fn();
    render(<PresetBar order={ORDER} labels={LABELS} onApply={onApply} onReset={vi.fn()} />);

    screen.getByRole('button', { name: 'Alpha disease' }).click();
    expect(onApply).toHaveBeenCalledWith('alpha');
  });

  it('locks every control while disabled', () => {
    const onApply = vi.fn();
    const onReset = vi.fn();
    const onAction = vi.fn();

    render(
      <PresetBar
        order={ORDER}
        labels={LABELS}
        onApply={onApply}
        onReset={onReset}
        actions={[{ label: 'Injure', onClick: onAction, variant: 'danger' }]}
        disabled
      />,
    );

    // Loading another scenario mid-question would replace the one being asked about.
    for (const name of ['Normal', 'Alpha disease', 'Injure', 'Reset']) {
      const button = screen.getByRole('button', { name }) as HTMLButtonElement;
      expect(button.disabled, name).toBe(true);
      button.click();
    }

    expect(onApply).not.toHaveBeenCalled();
    expect(onReset).not.toHaveBeenCalled();
    expect(onAction).not.toHaveBeenCalled();
  });

  it('leaves everything usable by default', () => {
    render(
      <PresetBar
        order={ORDER}
        labels={LABELS}
        onApply={vi.fn()}
        onReset={vi.fn()}
        actions={[{ label: 'Injure', onClick: vi.fn() }]}
      />,
    );

    for (const name of ['Normal', 'Alpha disease', 'Injure', 'Reset']) {
      expect((screen.getByRole('button', { name }) as HTMLButtonElement).disabled, name).toBe(false);
    }
  });

  /**
   * The shell read that closes the pages which never passed `disabled`: once a page feeds
   * `blindControls` to the shell, a blinded learner gets a locked bar with no `disabled` prop.
   */
  it('locks the bar while the shell is blinded, even without the disabled prop', () => {
    const onApply = vi.fn();
    render(
      <ModuleShellProvider blinded>
        <PresetBar order={ORDER} labels={LABELS} onApply={onApply} onReset={vi.fn()} />
      </ModuleShellProvider>,
    );

    const button = screen.getByRole('button', { name: 'Alpha disease' }) as HTMLButtonElement;
    expect(button.disabled).toBe(true);
    button.click();
    expect(onApply).not.toHaveBeenCalled();
  });
});
