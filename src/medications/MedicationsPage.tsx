import { useState } from 'react';
import { DrugClassPage } from './components/DrugClassPage';
import {
  FAMILIES,
  MEDICATIONS,
  MICRO_GROUPS,
  MOA_GROUPS,
  getDrugClass,
  getFamily,
  getMoaClasses,
  getMoaGroup,
  getMicroGroup,
  getMicroGroupClasses,
  MEDICATION_INVALID,
  resolveMedicationRoute,
} from './drugs';
import { useHashRoute } from '@/shared/hooks/useHashRoute';
import styles from './MedicationsPage.module.css';

const FAMILY_ACCENT = 'var(--raas)';

/**
 * The Medications module. The hub is a grid of families; most families descend one further level
 * into a grid of classes. The Infection family descends two more: first into antimicrobial
 * branches (Antibiotics / Antivirals / Antifungals / Antiparasitics), then — for antibiotics —
 * into mechanism-of-action groups before reaching the broad classes.
 *  - `#medications` (and `#theme/medications`) — the hub of family tiles
 *  - `#medications/<familySlug>` — a family's grid (classes, or Infection's subfamily tiles)
 *  - `#medications/infection/<microGroup>` — one antimicrobial branch's tiles
 *  - `#medications/infection/antibiotics/<moa>` — antibiotic classes by mechanism of action
 *  - `#medications/<classId>` — the class detail page.
 */
export function MedicationsPage() {
  const route = useHashRoute();

  if (route.startsWith('medications/')) {
    const segments = route.slice('medications/'.length).split('/');
    const resolved = resolveMedicationRoute(segments);
    if (resolved === MEDICATION_INVALID) return <FamilyHub />;

    if (resolved.kind === 'family') return <FamilyPage familyId={resolved.familyId} />;
    if (resolved.kind === 'class') return <DrugClassPage drug={getDrugClass(resolved.classId)!} />;
    if (resolved.kind === 'subfamily')
      return <SubfamilyPage familyId={resolved.familyId} microGroup={resolved.microGroup} />;
    return <MoaPage familyId={resolved.familyId} moa={resolved.moa} />;
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
  if (!family) return <FamilyHub />;

  // Infection's family page is a chooser between its four antimicrobial branches rather than a
  // flat class grid; the branches then lead down to the classes.
  if (family.name === 'Infection') return <InfectionTiers family={family} />;

  return <ClassGrid familyId={family.id} query="" />;
}

/** The Infection family page: four antimicrobial branch tiles, one level deeper than the hub. */
function InfectionTiers({ family }: { family: NonNullable<ReturnType<typeof getFamily>> }) {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <a className={styles.backLink} href="#medications">
          &larr; All medications
        </a>
        <h1 className={styles.title}>{family.name}</h1>
        <span className={styles.subtitle}>{family.blurb}</span>
      </header>

      <p className={styles.lead}>
        Choose how the drug works — what it is aimed at — before narrowing to a broad class.
      </p>

      <ul className={styles.grid} aria-label="Antimicrobial groups">
        {MICRO_GROUPS.map((micro) => (
          <li key={micro.id}>
            <a className={styles.familyCard} href={`#medications/infection/${micro.id}`}>
              <span className={styles.nameRow}>
                <span className={styles.name}>{micro.name}</span>
                <span className={styles.count}>
                  {micro.classCount} class{micro.classCount === 1 ? '' : 'es'}
                </span>
              </span>
              <span className={styles.blurb}>{micro.blurb}</span>
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

/**
 * One antimicrobial branch. Antibiotics get a further mechanism-of-action tile tier; the other
 * three branches show their classes directly.
 */
function SubfamilyPage({ familyId, microGroup }: { familyId: string; microGroup: string }) {
  const family = getFamily(familyId);
  const micro = getMicroGroup(microGroup);
  if (!family || !micro) return <FamilyHub />;

  if (micro.hasMoa) return <AntibioticsTiers family={family} micro={micro} />;

  return <ClassGrid familyId={family.id} microGroup={micro.id} query="" />;
}

/** The antibiotics branch: mechanism-of-action tiles leading down to the broad classes. */
function AntibioticsTiers({
  family,
  micro,
}: {
  family: NonNullable<ReturnType<typeof getFamily>>;
  micro: NonNullable<ReturnType<typeof getMicroGroup>>;
}) {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <a className={styles.backLink} href={`#medications/${family.id}`}>
          &larr; {family.name}
        </a>
        <h1 className={styles.title}>{micro.name}</h1>
        <span className={styles.subtitle}>{micro.blurb}</span>
      </header>

      <p className={styles.lead}>
        Pick the bacterial process the drugs attack — the standard way antibiotics are taught.
      </p>

      <ul className={styles.grid} aria-label="Antibiotic mechanisms of action">
        {MOA_GROUPS.map((moa) => (
          <li key={moa.id}>
            <a className={styles.familyCard} href={`#medications/infection/antibiotics/${moa.id}`}>
              <span className={styles.nameRow}>
                <span className={styles.name}>{moa.name}</span>
                <span className={styles.count}>
                  {moa.classCount} class{moa.classCount === 1 ? '' : 'es'}
                </span>
              </span>
              <span className={styles.blurb}>{moa.blurb}</span>
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

/** The classes that act through one antibiotic mechanism of action. */
function MoaPage({ familyId, moa }: { familyId: string; moa: string }) {
  const family = getFamily(familyId);
  const moaMeta = getMoaGroup(moa);
  if (!family || !moaMeta) return <FamilyHub />;

  const members = getMoaClasses(moaMeta.id);
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <a className={styles.backLink} href="#medications/infection/antibiotics">
          &larr; Antibiotics
        </a>
        <h1 className={styles.title}>{moaMeta.name}</h1>
        <span className={styles.subtitle}>
          {moaMeta.classCount} class{moaMeta.classCount === 1 ? '' : 'es'} — {moaMeta.blurb}
        </span>
      </header>

      <ul className={styles.grid} aria-label={`${moaMeta.name} classes`}>
        {members.map((drug) => (
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

/**
 * A grid of class tiles with per-family search. Used for every non-Infection family, and for the
 * antiviral / antifungal / antiparasitic branches (which carry no deeper tier). When `microGroup`
 * is set the tiles come from that branch; otherwise they come from the whole family.
 */
function ClassGrid({
  familyId,
  microGroup,
  query,
}: {
  familyId: string;
  microGroup?: string;
  query: string;
}) {
  const family = getFamily(familyId);
  const [search, setSearch] = useState(query);
  const needle = search.trim().toLowerCase();

  if (!family) return <FamilyHub />;

  const isBranch = microGroup !== undefined;
  const members = microGroup
    ? getMicroGroupClasses(microGroup as Parameters<typeof getMicroGroupClasses>[0])
    : MEDICATIONS.filter((drug) => drug.family === family.name);

  const visible = members.filter(
    (drug) =>
      !needle ||
      drug.className.toLowerCase().includes(needle) ||
      drug.drugs.some((d) => d.toLowerCase().includes(needle)),
  );

  const label = isBranch ? getMicroGroup(microGroup)!.name : family.name;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <a className={styles.backLink} href={`#medications/${family.id}`}>
          &larr; {family.name}
        </a>
        <h1 className={styles.title}>{label}</h1>
        <span className={styles.subtitle}>{family.blurb}</span>
      </header>

      {!isBranch && (
        <input
          className={styles.search}
          type="search"
          placeholder={`Search ${family.name}…`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label={`Search ${family.name}`}
        />
      )}

      {search && visible.length === 0 && (
        <p className={styles.empty}>No classes in {label} match “{search}”.</p>
      )}

      <ul className={styles.grid} aria-label={`${label} classes`}>
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
