// Illustrative species parameters, not agronomic forecasts. No terrain imports.
export const SPECIES = {
  tomato: { name: 'Tomato', days: 90, potentialKg: 4, minQuality: .7, color: '#bf6145' },
  bean: { name: 'Bean', days: 65, potentialKg: .8, minQuality: .6, color: '#77924e' },
  radish: { name: 'Radish', days: 30, potentialKg: .15, minQuality: .55, color: '#a35065' },
};
export function seed(species) {
  if (!SPECIES[species]) throw Error('Unknown species');
  return { species, age: 0, qualityDays: 0, ready: false };
}
export function grow(plant, days, soilQuality) {
  const duration = Math.max(0, Math.min(days, SPECIES[plant.species].days - plant.age));
  plant.qualityDays += duration * Math.max(0, Math.min(1, soilQuality));
  plant.age += duration;
  plant.ready = plant.age >= SPECIES[plant.species].days;
}
export function yieldKg(plant) {
  return SPECIES[plant.species].potentialKg * (plant.age ? plant.qualityDays / plant.age : 0);
}
