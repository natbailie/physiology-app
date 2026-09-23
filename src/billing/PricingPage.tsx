import { useEffect, useState, type FormEvent } from 'react';
import { useAuth } from '@/auth/AuthContext';
import { MODULES } from '@/home/moduleRegistry';
import { FALLBACK_PACKAGES, FREE_MODULE_IDS, PLAN_FEATURES, PLAN_NAME, type PlanPackage } from './config';
import { useEntitlement } from './useEntitlement';
import { useExamProfile } from '@/account/examProfile';
import { startCheckout } from './startCheckout';
import { fetchOfferedPackages, setExamAttributes, type OfferedPackage } from './revenuecat';
import { redeemLicence } from './licence';
import styles from './PricingPage.module.css';
import { ThemeBar } from '@/theme/ThemeBar';

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
  /**
   * One message, tagged with which action produced it.
   *
   * The licence-code form sits ABOVE the plan card now, so a single untagged notice rendered in
   * one fixed place would report the result of redeeming a code somewhere the person who typed
   * it is no longer looking. Two independent notice states would be the other way to do this,
   * and would allow both to be on screen at once saying different things.
   */
  const [notice, setNotice] = useState<{ where: 'plan' | 'code'; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [code, setCode] = useState('');

  /** Live prices when RevenueCat answers; last known prices when it does not. */
  const [packages, setPackages] = useState<readonly (PlanPackage | OfferedPackage)[]>(FALLBACK_PACKAGES);
  const [selected, setSelected] = useState<string>(DEFAULT_PACKAGE_ID);
  const { targetExam, trainingLevel, ready: profileReady } = useExamProfile();

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

  /**
   * Send the learner's exam to RevenueCat, from the one page that loads the SDK anyway.
   *
   * This is the whole reason the attribute is set here rather than at sign-in: the SDK is an
   * 840 kB dynamic chunk and pulling it for every signed-in learner would undo that. See the
   * docblock on `setExamAttributes`.
   *
   * Fire-and-forget, and after the offering rather than before it — the prices have to render
   * whatever an analytics call does.
   */
  useEffect(() => {
    if (!user || !profileReady) return;
    void setExamAttributes(user.id, { targetExam, trainingLevel });
  }, [user, profileReady, targetExam, trainingLevel]);

  const chosen = packages.find((plan) => plan.id === selected) ?? packages[0];

  const subscribe = async () => {
    if (!user || !chosen) return;
    if (!hasRcPackage(chosen)) {
      setNotice({ where: 'plan', text: 'Payments are not configured on this deployment yet.' });
      return;
    }

    setBusy(true);
    setNotice(null);
    try {
      const result = await startCheckout(user.id, chosen.rcPackage, user.email ?? undefined);
      // A closed payment sheet is a decision, not a failure, and says nothing back.
      if ('cancelled' in result) return;
      if (!result.ok) setNotice({ where: 'plan', text: result.message });
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
        setNotice({ where: 'code', text: `Access granted through ${result.institutionName}.` });
      } else {
        setNotice({ where: 'code', text: result.message });
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={styles.page}>
      <ThemeBar />
      <a href="#" className={styles.backLink}>
        ← All modules
      </a>
      <h1 className={styles.title}>Full access</h1>
      <p className={styles.lede}>
        {FREE_SIMULATOR_COUNT} of the {SIMULATORS.length} simulators are free on any account, questions
        included. Full access opens the rest.
      </p>

      {/* Above the cards, not in small print below them.
       *
       * UK medical schools buy by purchase order, so for a large share of the people who reach
       * this page the correct action is not to choose a billing period at all — it is to type a
       * code somebody has emailed them. Making them read past two prices first asks them to
       * consider paying personally for something their school has already bought, and an
       * institutional seat beats a personal subscription anyway (`v_entitlement`). */}
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
      {notice?.where === 'code' && <p className={styles.notice}>{notice.text}</p>}

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

        {notice?.where === 'plan' && <p className={styles.notice}>{notice.text}</p>}

      </section>

      <p className={styles.freeNote}>
        Cancel any time. Progress you have already recorded stays on your account whether or not you
        subscribe.
      </p>
    </div>
  );
}
