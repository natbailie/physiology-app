import { useState } from 'react';
import { DrugClassPage } from './components/DrugClassPage';
import { FAMILIES, MEDICATIONS, getDrugClass, getFamily } from './drugs';
import { useHashRoute } from '@/shared/hooks/useHashRoute';
import styles from './MedicationsPage.module.css';

const FAMILY_ACCENT = 'var(--raas)';

/**
 * The Medications module. Three levels, mirroring the main-menu grid:
 *  - `#medications` (and `#theme/medications`) — the hub of family tiles
 *  - `#medications/<familySlug>` — one family's grid of class tiles, with per-family search
 *  - `#medications/<classId>` — the class detail page.
 */
export function MedicationsPage() {
  const route = useHashRoute();

  if (route.startsWith('medications/')) {
    const subId = route.slice('medications/'.length);
    const family = getFamily(subId);
    if (family) return <FamilyPage familyId={family.id} />;
    const drug = getDrugClass(subId);
    if (drug) return <DrugClassPage drug={drug} />;
    return <FamilyHub />;
  }

  return <FamilyHub />;
}

function FamilyHub() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <a className={styles.backLink} href="#">
          &larr; Modules
        </a>
        <h1 className={styles.title}>Medications</h1>
        <span className={styles.subtitle}>{MEDICATIONS.length} drug classes, grouped by system</span>
      </header>

      <p className={styles.lead}>
        Choose a family to see its classes. Class names and example drugs follow the UK top-100
        list.
      </p>

      <ul className={styles.grid} aria-label="Medication families">
        {FAMILIES.map((family) => (
          <li key={family.id}>
            <a
              className={styles.familyCard}
              style={{ '--card-accent': FAMILY_ACCENT } as React.CSSProperties}
              href={`#medications/${family.id}`}
            >
              <span className={styles.nameRow}>
                <span className={styles.name}>{family.name}</span>
                <span className={styles.count}>
                  {family.classCount} class{family.classCount === 1 ? '' : 'es'}
                </span>
              </span>
              <span className={styles.blurb}>{family.blurb}</span>
            </a>
          </li>
        ))}
      </ul>

      <p className={styles.footnote}>
        Informational reference for exam prep, not a prescriber.
      </p>
    </div>
  );
}

function FamilyPage({ familyId }: { familyId: string }) {
  const family = getFamily(familyId);
  const [query, setQuery] = useState('');
  const needle = query.trim().toLowerCase();

  if (!family) return <FamilyHub />;

  const members = MEDICATIONS.filter((drug) => drug.family === family.name);
  const visible = members.filter(
    (drug) =>
      !needle ||
      drug.className.toLowerCase().includes(needle) ||
      drug.drugs.some((d) => d.toLowerCase().includes(needle)),
  );

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <a className={styles.backLink} href="#medications">
          &larr; All medications
        </a>
        <h1 className={styles.title}>{family.name}</h1>
        <span className={styles.subtitle}>{family.blurb}</span>
      </header>

      <input
        className={styles.search}
        type="search"
        placeholder={`Search ${family.name}…`}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        aria-label={`Search ${family.name}`}
      />

      {needle && visible.length === 0 && (
        <p className={styles.empty}>No classes in {family.name} match “{query}”.</p>
      )}

      <ul className={styles.grid} aria-label={`${family.name} classes`}>
        {visible.map((drug) => (
          <li key={drug.id}>
            <a className={styles.classCard} href={`#medications/${drug.id}`}>
              <span className={styles.name}>{drug.className}</span>
              <span className={styles.blurb}>{drug.drugs.join(', ')}</span>
            </a>
          </li>
        ))}
      </ul>

      <p className={styles.footnote}>
        Informational reference for exam prep, not a prescriber.
      </p>
    </div>
  );
}
