// ---------------------------------------------------------------------------
// RADAR
//
// Up to three polygons on one set of axes:
//
//   was        the faintest — where the reserve stood on day zero. Only drawn
//              once the season track has moved off today.
//   reserve    what the soil HOLDS now.
//   available  what the plant can REACH.
//
// The gap between the last two is what pH and the rest are locking away. The
// gap between the first two is what the season has taken out of the soil
// altogether. Two different losses, and they are different lines.
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
 * The static parts: bezel, web, spokes, labels. Returns SVG markup.
 *
 * The bezel is a plain circle drawn OUTSIDE the labels, so the chart reads as
 * an instrument face with the hexagon floating at its centre and the axis
 * letters in the ring between the two.
 *
 * @param axes  [{ key, symbol, name }]
 * @param geom  { cx, cy, r, labelGap, bezel, webs, pick }
 *
 * `pick` turns the axis letters into buttons — see the labels below.
 */
export function radarHTML(axes, { cx, cy, r, labelGap = 26, bezel = 0, webs = 4,
                                  pick = false }) {
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

  // Labels ride their own circle between the web and the bezel, centred on it
  // rather than anchored outward — they belong to the ring, not to the web.
  //
  // With `pick` on, each one is wrapped in a button: a transparent disc gives
  // it a target worth aiming at (a two-letter glyph is a tiny thing to hit on
  // a phone), and role/tabindex make it reachable without a pointer at all.
  const labels = axes.map((axis, i) => {
    const a = axisAngle(i, n);
    const x = (cx + Math.cos(a) * (r + labelGap)).toFixed(1);
    const y = (cy + Math.sin(a) * (r + labelGap)).toFixed(1);
    const text = symbol => `<text class="axis-label" x="${x}" y="${y}"
            text-anchor="middle" dominant-baseline="middle"
            data-axis="${axis.key}">${symbol}</text>`;
    if (!pick) return text(`${axis.symbol}<title>${axis.name}</title>`);
    return `<g class="axis-pick" data-pick="${axis.key}" role="button" tabindex="0"
            aria-expanded="false" aria-label="${axis.name}">
        <circle class="axis-hit" cx="${x}" cy="${y}" r="${Math.max(16, labelGap * 0.6).toFixed(1)}"/>
        ${text(axis.symbol)}
      </g>`;
  }).join('\n      ');

  const flat = Array(n).fill(0);
  const ring = bezel
    ? `<circle class="web-bezel" cx="${cx}" cy="${cy}" r="${bezel}"/>`
    : '';

  return `<g class="radar">
      ${ring}
      ${rings}
      ${spokes}
      <path class="plot-was"       data-was      d="M${polygon(cx, cy, r, flat)} Z" hidden/>
      <path class="plot-reserve"   data-reserve  d="M${polygon(cx, cy, r, flat)} Z"/>
      <path class="plot-available" data-available d="M${polygon(cx, cy, r, flat)} Z"/>
      <g data-dots></g>
      ${labels}
    </g>`;
}

/** Live handle: feed it rows, it moves the polygons. */
export function radarOps(root, { cx, cy, r }) {
  const was       = root.querySelector('[data-was]');
  const reserve   = root.querySelector('[data-reserve]');
  const available = root.querySelector('[data-available]');
  const dots      = root.querySelector('[data-dots]');
  const NS = 'http://www.w3.org/2000/svg';

  return {
    set(rows) {
      const n = rows.length;
      // `was` is optional: pass it and the high-water mark appears.
      const marks = rows.map(x => x.was);
      if (marks.every(v => typeof v === 'number')) {
        was.setAttribute('d', `M${polygon(cx, cy, r, marks)} Z`);
        was.hidden = false;
      } else {
        was.hidden = true;
      }
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
