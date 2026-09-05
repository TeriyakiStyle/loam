// ---------------------------------------------------------------------------
// RADAR
//
// Two polygons on one set of axes. The faint one is what the soil HOLDS; the
// solid one is what the plant can REACH. The gap between them is the whole
// argument of the page, so it is drawn rather than explained.
//
// Knows nothing about soil. Give it axes and two arrays of 0–1 values.
// ---------------------------------------------------------------------------

const TAU = Math.PI * 2;

/** Unit direction of axis i, clockwise from straight up. */
export function axisAngle(i, count) {
  return -Math.PI / 2 + (i / count) * TAU;
}

function point(cx, cy, r, i, count, value) {
  const a = axisAngle(i, count);
  return [cx + Math.cos(a) * r * value, cy + Math.sin(a) * r * value];
}

function polygon(cx, cy, r, values) {
  return values
    .map((v, i) => point(cx, cy, r, i, values.length, v).map(n => n.toFixed(1)).join(' '))
    .join(' L');
}

/**
 * The static parts: web, spokes, labels. Returns SVG markup.
 *
 * @param axes  [{ symbol, name }]
 * @param geom  { cx, cy, r, labelGap, webs }
 */
export function radarHTML(axes, { cx, cy, r, labelGap = 26, webs = 4 }) {
  const n = axes.length;

  const rings = Array.from({ length: webs }, (_, i) => {
    const rr = r * (i + 1) / webs;
    const pts = polygon(cx, cy, rr, Array(n).fill(1));
    return `<path class="web" d="M${pts} Z"/>`;
  }).join('\n      ');

  const spokes = axes.map((_, i) => {
    const [x, y] = point(cx, cy, r, i, n, 1);
    return `<line class="spoke" x1="${cx}" y1="${cy}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}"/>`;
  }).join('\n      ');

  // Labels sit past the outer web, nudged so the ones on the sides don't
  // collide with it and the ones top and bottom stay centred.
  const labels = axes.map((axis, i) => {
    const a = axisAngle(i, n);
    const x = cx + Math.cos(a) * (r + labelGap);
    const y = cy + Math.sin(a) * (r + labelGap);
    const anchor = Math.abs(Math.cos(a)) < 0.2 ? 'middle' : (Math.cos(a) > 0 ? 'start' : 'end');
    return `<text class="axis-label" x="${x.toFixed(1)}" y="${y.toFixed(1)}"
            text-anchor="${anchor}" dominant-baseline="middle"
            data-axis="${axis.key}">${axis.symbol}<title>${axis.name}</title></text>`;
  }).join('\n      ');

  const flat = Array(n).fill(0);
  return `<g class="radar">
      ${rings}
      ${spokes}
      <path class="plot-reserve"   data-reserve  d="M${polygon(cx, cy, r, flat)} Z"/>
      <path class="plot-available" data-available d="M${polygon(cx, cy, r, flat)} Z"/>
      <g data-dots></g>
      ${labels}
    </g>`;
}

/** Live handle: feed it rows, it moves the polygons. */
export function radarOps(root, { cx, cy, r }) {
  const reserve   = root.querySelector('[data-reserve]');
  const available = root.querySelector('[data-available]');
  const dots      = root.querySelector('[data-dots]');
  const NS = 'http://www.w3.org/2000/svg';

  return {
    set(rows) {
      const n = rows.length;
      reserve.setAttribute('d',   `M${polygon(cx, cy, r, rows.map(x => x.reserve))} Z`);
      available.setAttribute('d', `M${polygon(cx, cy, r, rows.map(x => x.available))} Z`);

      // A dot per vertex on the available polygon — it reads as a measurement
      // rather than a shape, and it gives the eye something to track as the
      // dial moves.
      while (dots.childNodes.length > n) dots.lastChild.remove();
      rows.forEach((row, i) => {
        let c = dots.childNodes[i];
        if (!c) { c = document.createElementNS(NS, 'circle'); c.setAttribute('r', 3); dots.append(c); }
        const [x, y] = point(cx, cy, r, i, n, row.available);
        c.setAttribute('cx', x.toFixed(1));
        c.setAttribute('cy', y.toFixed(1));
        c.dataset.axis = row.key;
      });
    },
  };
}
