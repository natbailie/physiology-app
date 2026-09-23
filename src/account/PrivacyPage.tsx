import styles from './AccountPage.module.css';
import { ThemeBar } from '@/theme/ThemeBar';

/**
 * The whole notice, in plain language. It only ever lists data that is actually stored —
 * if a new table starts holding personal data, this page must be updated in the same change.
 */
export function PrivacyPage() {
  return (
    <div className={styles.page}>
      <ThemeBar />
      <header className={styles.header}>
        <h1 className={styles.title}>Privacy: what we store</h1>
      </header>

      <div className={`${styles.body} ${styles.prose}`}>
        <section>
          <h2 className={styles.sectionTitle}>If you answer questions without an account</h2>
          <p className={styles.muted}>
            Your progress lives only in this browser's local storage. Nothing is sent anywhere, and
            clearing your browser data erases it completely.
          </p>
        </section>

        <section>
          <h2 className={styles.sectionTitle}>If you create an account</h2>
          <ul className={styles.privacyList}>
            <li>Your email address and password (the password itself is never readable by us)</li>
            <li>Each practice question you answer: which module, which question, right or wrong, and when</li>
            <li>Your subscription status, if you have one</li>
          </ul>
          <p className={styles.muted}>
            That list is the whole record. There are no tracking cookies, no advertising, no
            analytics profiles and no third parties receiving your data.
          </p>
        </section>

        <section>
          <h2 className={styles.sectionTitle}>Why it is stored</h2>
          <p className={styles.muted}>
            So your progress follows you between devices, so the app can bring back the questions
            you got wrong, and so a teacher can see how a class is coping.
          </p>
        </section>

        <section>
          <h2 className={styles.sectionTitle}>If you join a class</h2>
          <p className={styles.muted}>
            Joining a class with a code — or being enrolled in one by a licence your school bought —
            lets the teacher who runs it see how that class is getting on. Their dashboard shows the
            class as a whole: how many people have attempted each module and what proportion were
            correct. It does not list students, and a module is left blank until at least five
            people have attempted it, so a class average can never be read back as one
            person&rsquo;s result.
          </p>
          <p className={styles.muted}>
            Being straight about the limit of that: the permission your teacher holds is over the
            answers of people in their own classes, and it is what makes the class figures possible.
            Nobody else can see them, no other teacher can, and leaving the class ends it.
          </p>
        </section>

        <section>
          <h2 className={styles.sectionTitle}>Getting rid of it</h2>
          <p className={styles.muted}>
            Deleting your account on the account page removes your email address, every recorded
            answer and your access rights from the servers immediately and permanently. You do not
            need to ask.
          </p>
        </section>
      </div>
    </div>
  );
}
