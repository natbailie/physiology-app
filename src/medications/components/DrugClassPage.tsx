import type { DrugClass } from '../drugs';
import { getFamily } from '../drugs';
import { MODULES } from '@/home/moduleRegistry';
import { getMechanismDiagram } from './diagrams';
import styles from './DrugClassPage.module.css';

/**
 * One drug class's page: names the class, lists the example drugs and explains the mechanism.
 * Where a class maps onto a simulator engine, a "watch it happen" link takes the learner there.
 * A few classes also embed an interactive, engine-driven mechanism diagram inline.
 */
export function DrugClassPage({ drug }: { drug: DrugClass }) {
  const module = drug.moduleId ? MODULES.find((m) => m.id === drug.moduleId) : undefined;
  const Diagram = getMechanismDiagram(drug.id);
  const family = getFamily(drug.family);

  return (
    <div className={styles.page}>
      <a className={styles.backLink} href={`#medications/${family?.id ?? ''}`}>
        &larr; {family?.name ?? 'All medications'}
      </a>

      <header className={styles.header}>
        <div className={styles.titleRow}>
          <h1 className={styles.title}>{drug.className}</h1>
          <span className={styles.family}>{drug.family}</span>
        </div>
      </header>

      <section>
        <span className={styles.drugsLabel}>Example drugs</span>
        <div className={styles.drugs}>
          {drug.drugs.map((name) => (
            <span key={name} className={styles.drug}>
              {name}
            </span>
          ))}
        </div>
      </section>

      <section className={styles.mechanism}>
        <h2>How it works</h2>
        <p>{drug.mechanism}</p>
      </section>

      {Diagram && <Diagram />}

      {module && (
        <a className={styles.simulateLink} href={`#${module.id}`}>
          Watch this happen in {module.name} &rarr;
        </a>
      )}
    </div>
  );
}
