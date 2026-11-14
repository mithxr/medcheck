// Canonical symptoms and the words people (and labels) use for them.
// Order matters: the first symptom whose term matches wins.
export const SYMPTOMS = [
  { key: 'anxiety', label: 'Anxiety', terms: ['anxiety', 'anxious', 'agitation', 'nervousness', 'jittery', 'jitters', 'restless', 'panic'] },
  { key: 'nausea', label: 'Nausea', terms: ['nausea', 'nauseous', 'nauseated', 'queasy'] },
  { key: 'insomnia', label: 'Insomnia', terms: ['insomnia', "can't sleep", 'cannot sleep', 'trouble sleeping', 'sleeplessness'] },
  { key: 'sexual', label: 'Sexual side effects', terms: ['libido', 'sex drive', 'ejaculation', 'erectile', 'orgasm', 'anorgasmia', 'sexual'] },
  { key: 'fatigue', label: 'Tiredness', terms: ['fatigue', 'tiredness', 'tired', 'exhausted', 'exhaustion', 'asthenia'] },
  { key: 'drowsiness', label: 'Drowsiness', terms: ['somnolence', 'drowsy', 'drowsiness', 'sleepy', 'sedation'] },
  { key: 'appetite', label: 'Loss of appetite', terms: ['decreased appetite', 'appetite decreased', 'loss of appetite', 'no appetite', 'anorexia'] },
  { key: 'weight', label: 'Weight gain', terms: ['weight gain', 'weight increased', 'gained weight', 'weight increase', 'increased appetite'] },
  { key: 'headache', label: 'Headaches', terms: ['headache', 'migraine'] },
  { key: 'diarrhea', label: 'Diarrhea', terms: ['diarrhea', 'diarrhoea', 'loose stool'] },
  { key: 'dizziness', label: 'Dizziness', terms: ['dizziness', 'dizzy', 'lightheaded', 'vertigo'] },
  { key: 'tremor', label: 'Tremor', terms: ['tremor', 'shaking', 'shaky', 'shakes'] },
  { key: 'sweating', label: 'Sweating', terms: ['hyperhidrosis', 'night sweats', 'sweating', 'sweats', 'diaphoresis'] },
  { key: 'drymouth', label: 'Dry mouth', terms: ['dry mouth', 'xerostomia'] },
  { key: 'flat', label: 'Feeling emotionally flat', terms: ['emotional blunting', 'emotionally flat', 'emotionally numb', 'blunted', 'flat affect', 'apathy', 'numb'] },
  { key: 'zaps', label: 'Brain zaps', terms: ['brain zap', 'electric shock'] },
];

export const byKey = Object.fromEntries(SYMPTOMS.map((s) => [s.key, s]));

const escape = (t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const PATTERNS = SYMPTOMS.map((s) => ({
  key: s.key,
  re: new RegExp(`(^|[^a-z])(${s.terms.map(escape).join('|')})`, 'i'),
}));

/** Map a label term like "Libido decreased" to a canonical key, or null. */
export function matchSymptom(text) {
  if (!text) return null;
  const hit = PATTERNS.find((p) => p.re.test(text));
  return hit ? hit.key : null;
}

/** All canonical keys mentioned anywhere in a block of free text. */
export function symptomsIn(text) {
  if (!text) return [];
  return PATTERNS.filter((p) => p.re.test(text)).map((p) => p.key);
}
