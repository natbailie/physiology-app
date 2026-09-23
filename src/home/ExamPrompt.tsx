import { useState } from 'react';
import { useExamProfile } from '@/account/examProfile';
import { EXAMS, type ExamId } from './exams';
import { setExamFilter } from './examFilter';
import styles from './ExamPrompt.module.css';

const DISMISSED_KEY = 'physiologylab.examPromptDismissed';

function alreadyDismissed(): boolean {
  try {
    return localStorage.getItem(DISMISSED_KEY) === '1';
  } catch {
    return false;
  }
}

/**
 * Asks, once, which exam a learner is revising for.
 *
 * Deliberately NOT an onboarding step. A wizard between signing up and seeing the product costs
 * more conversion than the answer is worth, and a learner who has not opened a simulator yet has
 * no reason to care which exam the catalogue is filtered to. This sits on the home page instead,
 * where it is skippable by simply scrolling past, and the account page is the permanent home for
 * the same setting.
 *
 * Answering does two things at once — saves the profile and filters the catalogue — because they
 * are the same intent. The saved answer also reaches RevenueCat as a subscriber attribute; see
 * `billing/revenuecat.ts` for why that happens on the pricing page rather than here.
 *
 * Shows for nobody who has answered, dismissed it, or has no profile to save to.
 */
export function ExamPrompt() {
  const { targetExam, trainingLevel, ready, canSave, save } = useExamProfile();
  const [dismissed, setDismissed] = useState(alreadyDismissed);

  if (!canSave || !ready || targetExam !== null || dismissed) return null;

  const choose = (id: ExamId) => async () => {
    // Filter first: the catalogue should respond to the click, not to the round trip. A failed
    // save leaves the filter set for this tab, which is the behaviour of someone who never
    // signed in and is strictly better than a click that appears to do nothing.
    setExamFilter(id);
    await save({ targetExam: id, trainingLevel });
  };

  const dismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(DISMISSED_KEY, '1');
    } catch {
      // Dismissed for this page view only. Better than refusing to dismiss at all.
    }
  };

  return (
    <div className={styles.prompt}>
      <span className={styles.question}>Revising for a particular exam?</span>

      {EXAMS.map((exam) => (
        <button key={exam.id} type="button" className={styles.choice} onClick={choose(exam.id)} title={exam.name}>
          {exam.short}
        </button>
      ))}

      <button type="button" className={styles.dismiss} onClick={dismiss}>
        Not right now
      </button>
    </div>
  );
}
