import { clamp } from '@/shared/lib/math';
import styles from './Diagram.module.css';

interface GonadGlandProps {
  isFemale: boolean;
  intensity: number;
  /** Dominant follicle diameter, 0–1. */
  follicleSize: number;
  corpusLuteum: number;
}

/**
 * The gonad, drawn with the structures the cycle actually consists of.
 *
 * An ovary is not a blob that gets brighter: it is a set of follicles of which one is selected
 * and grows, ruptures, and becomes a corpus luteum. Those three stages are what the cycle IS, and
 * the engine already models the dominant follicle and the luteum — they simply had nowhere to be
 * drawn. The testis gets its seminiferous tubules for the same reason: FSH acts on Sertoli cells
 * inside them, and inhibin comes back out.
 */
export function GonadGland({ isFemale, intensity, follicleSize, corpusLuteum }: GonadGlandProps) {
  const dominant = clamp(follicleSize, 0, 1) * 11;
  return (
    <g style={{ '--gonad-intensity': intensity } as React.CSSProperties}>
      {isFemale ? (
        <>
          <ellipse className={styles.gonadBody} cx={0} cy={0} rx={30} ry={20} />
          {/* Antral follicles waiting; only one is selected. */}
          {[[-17, -6], [-13, 8], [16, -9]].map(([cx, cy]) => (
            <circle key={`${cx}`} className={styles.antralFollicle} cx={cx} cy={cy} r={3.6} />
          ))}
          {dominant > 1 && <circle className={styles.follicle} cx={-2} cy={-3} r={dominant} />}
          {corpusLuteum > 0.02 && (
            <circle className={styles.corpusLuteum} style={{ '--luteum': corpusLuteum } as React.CSSProperties} cx={14} cy={7} r={7} />
          )}
        </>
      ) : (
        <>
          <ellipse className={styles.gonadBody} cx={-4} cy={0} rx={28} ry={20} />
          {/* Seminiferous tubules: where FSH acts and inhibin is made. */}
          {[-8, 0, 8].map((dy) => (
            <path
              key={dy}
              className={styles.tubule}
              d={`M -26 ${dy} C -16 ${dy - 6}, -4 ${dy + 6}, 8 ${dy - 4} C 14 ${dy - 7}, 18 ${dy - 2}, 20 ${dy}`}
            />
          ))}
          <path className={styles.epididymis} d="M 22 -14 C 32 -8, 32 8, 22 14" />
        </>
      )}
    </g>
  );
}
