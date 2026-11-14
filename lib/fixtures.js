import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'fixtures');

/** Load bundled data for a generic name, e.g. fixtures/sertraline.json. Returns null if none. */
export async function loadFixture(name) {
  if (!name) return null;
  const slug = String(name).toLowerCase().split(/[\s,]+/)[0].replace(/[^a-z0-9-]/g, '');
  try {
    return JSON.parse(await readFile(path.join(dir, `${slug}.json`), 'utf8'));
  } catch {
    return null;
  }
}
