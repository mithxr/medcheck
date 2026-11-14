import { loadFixture } from '../fixtures.js';

/**
 * Patient review statistics.
 * Drugs.com has no public API and its terms don't allow scraping, so MedCheck ships
 * a curated dataset per drug (fixtures/<generic>.json). A licensed review feed would
 * plug in here.
 */
export async function getReviews(generic) {
  const fx = await loadFixture(generic);
  return fx?.reviews ? { ...fx.reviews, status: 'curated' } : { status: 'unavailable' };
}
