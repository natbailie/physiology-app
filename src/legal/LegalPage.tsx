import { ThemeBar } from '@/theme/ThemeBar';
import { LEGAL_DOCS } from '@/shared/legal';
import type { LegalDocId, LegalLink, LegalTable } from '@/shared/legal/types';
import styles from './LegalPage.module.css';

const DATE = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

function linkHref(link: LegalLink): string {
  return 'route' in link ? `#${link.route}` : link.href;
}

function Table({ table, caption }: { table: LegalTable; caption: string }) {
  const hasHead = table.head.some((cell) => cell.length > 0);
  // A wide table scrolls inside its own box rather than pushing the page sideways at 320px
  // (WCAG 1.4.10). The box is focusable so a keyboard user can scroll it too.
  return (
    <div className={styles.tableWrap} role="region" aria-label={caption} tabIndex={0}>
      <table className={styles.table}>
        <caption className="sr-only">{caption}</caption>
        {hasHead && (
          <thead>
            <tr>
              {table.head.map((cell) => (
                <th key={cell} scope="col">
                  {cell}
                </th>
              ))}
            </tr>
          </thead>
        )}
        <tbody>
          {table.rows.map((row) => (
            <tr key={row.join('|')}>
              {row.map((cell, i) =>
                i === 0 ? (
                  <th key={i} scope="row">
                    {cell}
                  </th>
                ) : (
                  <td key={i}>{cell}</td>
                ),
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Renders one of the shared legal documents. The words live in `src/shared/legal/`, which the
 * phone app renders too — change them there, never here.
 */
export function LegalPage({ doc: id }: { doc: LegalDocId }) {
  const doc = LEGAL_DOCS[id];
  return (
    <div className={styles.page}>
      <ThemeBar />
      <header className={styles.header}>
        <h1 className={styles.title}>{doc.title}</h1>
        <p className={styles.standfirst}>{doc.summary}</p>
        <p className={styles.updated}>
          Last updated <time dateTime={doc.lastUpdated}>{DATE.format(new Date(doc.lastUpdated))}</time>
        </p>
      </header>

      <div className={styles.body}>
        {doc.sections.map((section) => (
          <section key={section.heading} aria-labelledby={`${id}-${slug(section.heading)}`}>
            <h2 id={`${id}-${slug(section.heading)}`} className={styles.sectionTitle}>
              {section.heading}
            </h2>
            {section.paragraphs?.map((p) => (
              <p key={p} className={styles.prose}>
                {p}
              </p>
            ))}
            {section.list && (
              <ul className={styles.list}>
                {section.list.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            )}
            {section.table && <Table table={section.table} caption={section.heading} />}
            {section.closing?.map((p) => (
              <p key={p} className={styles.prose}>
                {p}
              </p>
            ))}
            {section.links && (
              <ul className={styles.links}>
                {section.links.map((link) => (
                  <li key={link.label}>
                    <a href={linkHref(link)} className={styles.link} {...('href' in link && link.href.startsWith('http') ? { rel: 'noopener noreferrer', target: '_blank' } : {})}>
                      {link.label}
                      {'href' in link && link.href.startsWith('http') && <span className="sr-only"> (opens in a new tab)</span>}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}

function slug(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}
