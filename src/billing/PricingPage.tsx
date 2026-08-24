import { useState, type FormEvent } from 'react';
import { useAuth } from '@/auth/AuthContext';
import { MODULES } from '@/home/moduleRegistry';
import { FREE_MODULE_IDS, PLAN } from './config';
import { useEntitlement } from './useEntitlement';
import { startCheckout } from './startCheckout';
import { clearAccessCode, redeemAccessCode } from './accessCode';
import styles from './PricingPage.module.css';

const SIMULATORS = MODULES.filter((m) => m.kind !== 'reference' && m.status === 'available');
const FREE_SIMULATOR_COUNT = SIMULATORS.filter((m) => FREE_MODULE_IDS.has(m.id)).length;

export function PricingPage() {
  const { user } = useAuth();
  const { status, viaAccessCode } = useEntitlement();
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [code, setCode] = useState('');

  const subscribe = async () => {
    setBusy(true);
    setNotice(null);
    try {
      const result = await startCheckout();
      if (result.ok) window.location.href = result.url;
      else setNotice(result.message);
    } finally {
      setBusy(false);
    }
  };

  const submitCode = (event: FormEvent) => {
    event.preventDefault();
    setNotice(null);
    if (redeemAccessCode(code)) {
      setCode('');
    } else {
      setNotice('That code was not recognised.');
    }
  };

  return (
    <div className={styles.page}>
      <a href="#" className={styles.backLink}>
        ← All modules
      </a>
      <h1 className={styles.title}>Full access</h1>
      <p className={styles.lede}>
        {FREE_SIMULATOR_COUNT} of the {SIMULATORS.length} simulators are free on any account, questions
        included. Full access opens the rest.
      </p>

      <section className={styles.card}>
        <h2 className={styles.planName}>{PLAN.name}</h2>
        <p className={styles.priceRow}>
          <span className={`${styles.price} numeral`}>{PLAN.price}</span>
          <span className={styles.period}>per {PLAN.period}</span>
        </p>

        <ul className={styles.features}>
          {PLAN.features.map((feature) => (
            <li key={feature} className={styles.feature}>
              <span className={styles.tick} aria-hidden="true">
                ✓
              </span>
              {feature}
            </li>
          ))}
        </ul>

        {status === 'active' ? (
          <p className={styles.activeNote}>You already have full access — every module is open.</p>
        ) : user ? (
          <button type="button" className={styles.cta} disabled={busy} onClick={() => void subscribe()}>
            {busy ? 'One moment…' : `Subscribe — ${PLAN.price}/${PLAN.period}`}
          </button>
        ) : (
          <a href="#" className={styles.cta}>
            Create a free account first
          </a>
        )}

        {notice && <p className={styles.notice}>{notice}</p>}

        {viaAccessCode ? (
          <div className={styles.codeRow}>
            <p className={styles.codeNote}>Unlocked with an access code on this browser.</p>
            <button type="button" className={styles.codeButton} onClick={clearAccessCode}>
              Remove
            </button>
          </div>
        ) : (
          <form className={styles.codeRow} onSubmit={submitCode}>
            <label className={styles.codeLabel} htmlFor="access-code">
              Have an access code?
            </label>
            <input
              id="access-code"
              className={styles.codeInput}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              autoComplete="off"
              spellCheck={false}
            />
            <button type="submit" className={styles.codeButton} disabled={code.trim() === ''}>
              Apply
            </button>
          </form>
        )}
      </section>

      <p className={styles.freeNote}>
        Cancel any time. Progress you have already recorded stays on your account whether or not you
        subscribe.
      </p>
    </div>
  );
}
