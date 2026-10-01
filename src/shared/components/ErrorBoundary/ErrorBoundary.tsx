import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Illustration } from '../Illustration/Illustration';
import styles from './ErrorBoundary.module.css';

interface Props {
  children: ReactNode;
  /** Changing this clears a caught error, e.g. the route, so leaving a broken page recovers. */
  resetKey?: string;
}

interface State {
  failed: boolean;
  resetKey: string | undefined;
}

/**
 * Catches a render error or a failed lazy chunk (the usual offline failure) and offers a retry
 * instead of a white screen. Retry re-renders in place; if the chunk is genuinely missing, Reload
 * gets a fresh copy of the app.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { failed: false, resetKey: this.props.resetKey };

  static getDerivedStateFromError(): Partial<State> {
    return { failed: true };
  }

  static getDerivedStateFromProps(props: Props, state: State): Partial<State> | null {
    return props.resetKey === state.resetKey ? null : { failed: false, resetKey: props.resetKey };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('ErrorBoundary caught', error, info.componentStack);
  }

  render(): ReactNode {
    if (!this.state.failed) return this.props.children;

    return (
      <div className={styles.box} role="alert">
        <Illustration kind="error" size={112} />
        <h2 className={styles.title}>This page didn&rsquo;t load</h2>
        <p className={styles.text}>
          That one&rsquo;s on us, or your connection dropped for a moment. Nothing you&rsquo;ve done is lost.
        </p>
        <div className={styles.actions}>
          <button type="button" className={styles.primary} onClick={() => this.setState({ failed: false })}>
            Try again
          </button>
          <button type="button" className={styles.button} onClick={() => window.location.reload()}>
            Reload
          </button>
        </div>
      </div>
    );
  }
}
