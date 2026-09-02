// ---------------------------------------------------------------------------
// THE CUBE
//
// True 2:1 isometric: the top rhombus is half as tall as it is wide, and the
// side height equals the half-width. Three polygons, no more.
//
// A soil type is three colours. That is the entire difference between LOAM
// and every other cube you'll add, so they live as data, not as new drawings.
// ---------------------------------------------------------------------------

export const SOILS = {
  loam: { top: '#6B8E23', left: '#3E2723', right: '#D6B18D' },
  // clay: { top: '#6B8E23', left: '…', right: '…' },
};

export function cubeSVG(soil = SOILS.loam, size = 256) {
  const { top, left, right } = soil;
  return `
<svg viewBox="0 0 256 256" width="${size}" height="${size}" class="cube" aria-hidden="true">
  <polygon points="128,0 256,64 128,128 0,64"      fill="${top}"/>
  <polygon points="0,64 128,128 128,256 0,192"     fill="${left}"/>
  <polygon points="128,128 256,64 256,192 128,256" fill="${right}"/>
</svg>`;
}
