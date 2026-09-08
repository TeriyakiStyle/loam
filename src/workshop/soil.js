// Soil owns no plants, UI, inventory, or calendar. Values are workshop indices.
export const clamp = n => Math.max(0, Math.min(1, n));
export function createSoil(x, y) {
  return { fertility: .48 + .18 * (1 + Math.sin(x * .7 + y)) / 2,
    structure: .44 + .25 * (1 + Math.cos(y * .8)) / 2,
    moisture: .3 + .18 * (1 + Math.sin(x + y)) / 2, tilled: false };
}
export function quality(soil) {
  return clamp(soil.fertility * .4 + soil.structure * .35 + soil.moisture * .25);
}
export function applySoilWork(soil, action) {
  if (action === 'water') soil.moisture = 1;
  if (action === 'compost') soil.fertility = clamp(soil.fertility + .25);
  if (action === 'till') { soil.structure = clamp(soil.structure + .3); soil.tilled = true; }
}
export function soilNeeds(soil) {
  return [soil.structure < .75 && 'till', soil.fertility < .8 && 'compost', soil.moisture < .75 && 'water'].filter(Boolean);
}
