/**
 * Where and what a learner studies: university, degree and year.
 *
 * Optional and self-declared, like `exams.ts`. The ids are storage keys and never change with the
 * labels; a school that renames itself changes `name` only. The list is the UK medical schools
 * (GMC-recognised primary medical qualifications), not every university, because that is who this
 * is for — anyone else picks "Other / not listed".
 */

export const UK_MEDICAL_SCHOOLS = [
  { id: 'aberdeen', name: 'University of Aberdeen' },
  { id: 'anglia_ruskin', name: 'Anglia Ruskin University' },
  { id: 'aston', name: 'Aston University' },
  { id: 'barts', name: "Queen Mary University of London (Barts and The London)" },
  { id: 'birmingham', name: 'University of Birmingham' },
  { id: 'brighton_sussex', name: 'Brighton and Sussex Medical School' },
  { id: 'bristol', name: 'University of Bristol' },
  { id: 'buckingham', name: 'University of Buckingham' },
  { id: 'cambridge', name: 'University of Cambridge' },
  { id: 'cardiff', name: 'Cardiff University' },
  { id: 'central_lancashire', name: 'University of Central Lancashire' },
  { id: 'dundee', name: 'University of Dundee' },
  { id: 'durham', name: 'Durham University' },
  { id: 'edge_hill', name: 'Edge Hill University' },
  { id: 'edinburgh', name: 'University of Edinburgh' },
  { id: 'exeter', name: 'University of Exeter' },
  { id: 'glasgow', name: 'University of Glasgow' },
  { id: 'hull_york', name: 'Hull York Medical School' },
  { id: 'imperial', name: 'Imperial College London' },
  { id: 'keele', name: 'Keele University' },
  { id: 'kent_medway', name: 'Kent and Medway Medical School' },
  { id: 'kings', name: "King's College London" },
  { id: 'lancaster', name: 'Lancaster University' },
  { id: 'leeds', name: 'University of Leeds' },
  { id: 'leicester', name: 'University of Leicester' },
  { id: 'lincoln', name: 'University of Lincoln' },
  { id: 'liverpool', name: 'University of Liverpool' },
  { id: 'manchester', name: 'University of Manchester' },
  { id: 'newcastle', name: 'Newcastle University' },
  { id: 'northern_ireland', name: "Queen's University Belfast" },
  { id: 'norwich', name: 'University of East Anglia (Norwich Medical School)' },
  { id: 'nottingham', name: 'University of Nottingham' },
  { id: 'oxford', name: 'University of Oxford' },
  { id: 'plymouth', name: 'University of Plymouth' },
  { id: 'sheffield', name: 'University of Sheffield' },
  { id: 'southampton', name: 'University of Southampton' },
  { id: 'st_andrews', name: 'University of St Andrews' },
  { id: 'st_georges', name: "St George's, University of London" },
  { id: 'sunderland', name: 'University of Sunderland' },
  { id: 'swansea', name: 'Swansea University' },
  { id: 'ucl', name: 'University College London' },
  { id: 'ulster', name: 'Ulster University' },
  { id: 'warwick', name: 'University of Warwick' },
  { id: 'bangor_wales', name: 'Bangor University (North Wales Medical School)' },
  { id: 'other', name: 'Other / not listed' },
] as const;

export type UniversityId = (typeof UK_MEDICAL_SCHOOLS)[number]['id'];

export const DEGREE_TYPES = [
  { id: 'mbbs', name: 'MBBS / MBChB (medicine)' },
  { id: 'bsc', name: 'BSc' },
  { id: 'msc', name: 'MSc' },
  { id: 'mres', name: 'MRes' },
  { id: 'md', name: 'MD' },
  { id: 'phd', name: 'PhD' },
  { id: 'other', name: 'Other' },
] as const;

export type DegreeTypeId = (typeof DEGREE_TYPES)[number]['id'];

export const STUDY_YEARS = [1, 2, 3, 4, 5, 6] as const;

export type StudyYear = (typeof STUDY_YEARS)[number];

const UNIVERSITY_IDS = new Set<string>(UK_MEDICAL_SCHOOLS.map((school) => school.id));
const DEGREE_IDS = new Set<string>(DEGREE_TYPES.map((degree) => degree.id));

export function isUniversityId(value: unknown): value is UniversityId {
  return typeof value === 'string' && UNIVERSITY_IDS.has(value);
}

export function isDegreeTypeId(value: unknown): value is DegreeTypeId {
  return typeof value === 'string' && DEGREE_IDS.has(value);
}

export function isStudyYear(value: unknown): value is StudyYear {
  return typeof value === 'number' && (STUDY_YEARS as readonly number[]).includes(value);
}
