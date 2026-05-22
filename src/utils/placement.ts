// Placement-instance key helpers.
//
// `placedHeroes` and saved loadouts are keyed by a placement-instance id so
// the same hero can be deployed multiple times. The first copy uses the bare
// hero id; extra copies append `#2`, `#3`, … The hero id itself never
// contains a `#`, so splitting on it is safe.

export function heroIdOfPlacement(key: string): string {
  const i = key.indexOf('#');
  return i === -1 ? key : key.slice(0, i);
}

// Build the placement key for the Nth copy (1-indexed) of a hero.
export function placementKey(heroId: string, copy: number): string {
  return copy <= 1 ? heroId : `${heroId}#${copy}`;
}

// Given the keys already in use, return the lowest-numbered free placement
// key for `heroId` (or null if every copy up to `maxCopies` is taken).
export function nextPlacementKey(
  heroId: string,
  used: Iterable<string>,
  maxCopies: number,
): string | null {
  const taken = new Set(used);
  for (let copy = 1; copy <= maxCopies; copy++) {
    const key = placementKey(heroId, copy);
    if (!taken.has(key)) return key;
  }
  return null;
}

// Count how many placement keys belong to a given hero id.
export function countPlacementsOf(heroId: string, keys: Iterable<string>): number {
  let n = 0;
  for (const k of keys) if (heroIdOfPlacement(k) === heroId) n++;
  return n;
}
