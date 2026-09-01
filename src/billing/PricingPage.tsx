import { useEffect, useState, type FormEvent } from 'react';
import { useAuth } from '@/auth/AuthContext';
import { MODULES } from '@/home/moduleRegistry';
import { FALLBACK_PACKAGES, FREE_MODULE_IDS, PLAN_FEATURES, PLAN_NAME, type PlanPackage } from './config';
import { useEntitlement } from './useEntitlement';
import { startCheckout } from './startCheckout';
import { fetchOfferedPackages, type OfferedPackage } from './revenuecat';
import { redeemLicence } from './licence';
import styles from './PricingPage.module.css';

const SIMULATORS = MODULES.filter((m) => m.kind !== 'reference' && m.status === 'available');
const FREE_SIMULATOR_COUNT = SIMULATORS.filter((m) => FREE_MODULE_IDS.has(m.id)).length;

/** Annual first: it is the better deal and the one worth defaulting to. */
const DEFAULT_PACKAGE_ID = '$rc_annual';

function hasRcPackage(plan: PlanPackage | OfferedPackage): plan is OfferedPackage {
  return 'rcPackage' in plan;
}

export function PricingPage() {
  const { user } = useAuth();
  const { status, source, institutionName } = useEntitlement();
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [code, setCode] = useState('');

  /** Live prices when RevenueCat answers; last known prices when it does not. */
  const [packages, setPackages] = useState<readonly (PlanPackage | OfferedPackage)[]>(FALLBACK_PACKAGES);
  const [selected, setSelected] = useState<string>(DEFAULT_PACKAGE_ID);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    void fetchOfferedPackages(user.id).then((offered) => {
      if (!cancelled && offered) setPackages(offered);
    });
    return () => {
      cancelled = true;
    };
  }, [user]);

  const chosen = packages.find((plan) => plan.id === selected) ?? packages[0];

  const subscribe = async () => {
    if (!user || !chosen) return;
    if (!hasRcPackage(chosen)) {
      setNotice('Payments are not configured on this deployment yet.');
      return;
    }

    setBusy(true);
    setNotice(null);
    try {
      const result = await startCheckout(user.id, chosen.rcPackage, user.email ?? undefined);
      // A closed payment sheet is a decision, not a failure, and says nothing back.
      if ('cancelled' in result) return;
      if (!result.ok) setNotice(result.message);
    } finally {
      setBusy(false);
    }
  };

  const submitCode = async (event: FormEvent) => {
    event.preventDefault();
    setNotice(null);
    setBusy(true);
    try {
      const result = await redeemLicence(code);
      if (result.ok) {
        setCode('');
        setNotice(`Access granted through ${result.institutionName}.`);
      } else {
        setNotice(result.message);
      }
    } finally {
      setBusy(false);
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
        <h2 className={styles.planName}>{PLAN_NAME}</h2>

        {status === 'active' ? (
          <p className={styles.activeNote}>You already have full access — every module is open.</p>
        ) : (
          <fieldset className={styles.packages}>
            <legend className={styles.packageLegend}>Choose a billing period</legend>
            {packages.map((plan) => (
              <label key={plan.id} className={styles.packageOption}>
                <input
                  className={styles.packageRadio}
                  type="radio"
                  name="billing-period"
                  value={plan.id}
                  checked={plan.id === selected}
                  onChange={() => setSelected(plan.id)}
                />
                <span className={styles.packageLabel}>{plan.label}</span>
                <span className={`${styles.packagePrice} numeral`}>{plan.price}</span>
                <span className={styles.packagePeriod}>per {plan.period}</span>
                {plan.note && <span className={styles.packageNote}>{plan.note}</span>}
              </label>
            ))}
          </fieldset>
        )}

        <ul className={styles.features}>
          {PLAN_FEATURES.map((feature) => (
            <li key={feature} className={styles.feature}>
              <span className={styles.tick} aria-hidden="true">
                ✓
              </span>
              {feature}
            </li>
          ))}
        </ul>

        {status === 'active' ? (
          // Which stream is paying matters: a learner covered by their school should not also be
          // paying us themselves, and cannot find that out unless we say it.
          <p className={styles.sourceNote}>
            {source === 'institution'
              ? `Covered by ${institutionName ?? 'your institution'}'s licence. If you are also paying for a personal subscription, you can cancel it — this access does not depend on it.`
              : source === 'subscription'
                ? 'Your personal subscription is active. Cancel any time.'
                : 'This build runs without accounts, so every module is open.'}
          </p>
        ) : user ? (
          <button type="button" className={styles.cta} disabled={busy} onClick={() => void subscribe()}>
            {busy ? 'One moment…' : `Subscribe — ${chosen?.price}/${chosen?.period}`}
          </button>
        ) : (
          <a href="#" className={styles.cta}>
            Create a free account first
          </a>
        )}

        {notice && <p className={styles.notice}>{notice}</p>}

        {status === 'active' && source === 'institution' ? null : (
          <form className={styles.codeRow} onSubmit={(event) => void submitCode(event)}>
            <label className={styles.codeLabel} htmlFor="licence-code">
              Has your institution given you a code?
            </label>
            <input
              id="licence-code"
              className={styles.codeInput}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              autoComplete="off"
              spellCheck={false}
            />
            <button type="submit" className={styles.codeButton} disabled={busy || code.trim() === ''}>
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
