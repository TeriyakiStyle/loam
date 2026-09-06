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
 * @param geom  { cx, cy, r, labelGap, valueGap, bezel, webs, targetAt, pick }
 *
 * `valueGap` puts a live figure on each axis, further out than its letter.
 * `targetAt` (0–1) draws the one web that carries a meaning.
 * `pick` turns the pair into a button — see the labels below.
 */
export function radarHTML(axes, { cx, cy, r, labelGap = 26, valueGap = 0,
                                  bezel = 0, webs = 4, targetAt = 0,
                                  pick = false }) {
  const n = axes.length;

  const rings = Array.from({ length: webs }, (_, i) => {
    const rr = r * (i + 1) / webs;
    const pts = polygon(cx, cy, rr, Array(n).fill(1));
    return `<path class="web" d="M${pts} Z"/>`;
  }).join('\n      ');

  // The one web that means something. Everything else here is graph paper;
  // this is the line the reading is FOR — cross it and the soil has enough.
  const goal = targetAt
    ? `<path class="web-target" d="M${polygon(cx, cy, r * targetAt, Array(n).fill(1))} Z"/>`
    : '';

  const spokes = axes.map((_, i) => {
    const [x, y] = point(cx, cy, r, i, n, 1);
    return `<line class="spoke" x1="${cx}" y1="${cy}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}"/>`;
  }).join('\n      ');

  // Labels ride their own circle between the web and the bezel, centred on it
  // rather than anchored outward — they belong to the ring, not to the web.
  //
  // The figure sits one step further out along the same spoke. Radially
  // outward is the only direction that is guaranteed clear of the polygon at
  // every angle, and putting the number where the axis already is means the
  // shape and its value are read in one movement rather than two — which is
  // what a separate list of bars underneath could never do, however tidy it
  // was, because it made you look somewhere else and match them up again.
  //
  // With `pick` on, the pair is wrapped in a button: a transparent disc over
  // both gives it a target worth aiming at, and role/tabindex make it
  // reachable without a pointer at all.
  const labels = axes.map((axis, i) => {
    const a = axisAngle(i, n);
    const at = rr => [(cx + Math.cos(a) * rr).toFixed(1), (cy + Math.sin(a) * rr).toFixed(1)];
    const [lx, ly] = at(r + labelGap);
    const [vx, vy] = at(r + valueGap);

    const letter = `<text class="axis-label" x="${lx}" y="${ly}"
            text-anchor="middle" dominant-baseline="middle"
            data-axis="${axis.key}">${axis.symbol}${pick ? '' : `<title>${axis.name}</title>`}</text>`;
    const value = valueGap
      ? `<text class="axis-value" x="${vx}" y="${vy}"
            text-anchor="middle" dominant-baseline="middle"
            data-value="${axis.key}"></text>`
      : '';

    if (!pick) return letter + value;

    const [hx, hy] = at(r + (labelGap + (valueGap || labelGap)) / 2);
    const hr = (Math.abs((valueGap || labelGap) - labelGap) / 2 + 15).toFixed(1);
    return `<g class="axis-pick" data-pick="${axis.key}" role="button" tabindex="0"
            aria-expanded="false" aria-label="${axis.name}">
        <circle class="axis-hit" cx="${hx}" cy="${hy}" r="${hr}"/>
        ${letter}${value}
      </g>`;
  }).join('\n      ');

  const flat = Array(n).fill(0);
  const ring = bezel
    ? `<circle class="web-bezel" cx="${cx}" cy="${cy}" r="${bezel}"/>`
    : '';

  // Order matters, and the target goes on TOP of the plots. It is the line
  // the reader is measuring against, so it is the one thing on the face that
  // must never be hidden — and at rest a healthy bed sits almost exactly on
  // it, which is precisely when being painted over would lose it.
  return `<g class="radar">
      ${ring}
      ${rings}
      ${spokes}
      <path class="plot-was"       data-was      d="M${polygon(cx, cy, r, flat)} Z" hidden/>
      <path class="plot-reserve"   data-reserve  d="M${polygon(cx, cy, r, flat)} Z"/>
      <path class="plot-available" data-available d="M${polygon(cx, cy, r, flat)} Z"/>
      ${goal}
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
  const values    = new Map([...root.querySelectorAll('[data-value]')]
    .map(node => [node.dataset.value, node]));
  const picks     = new Map([...root.querySelectorAll('[data-pick]')]
    .map(node => [node.dataset.pick, node]));
  const NS = 'http://www.w3.org/2000/svg';

  return {
    set(rows) {
      const n = rows.length;

      // The figure on each axis, and — since a group's aria-label replaces
      // whatever is inside it — the same figure spoken as part of the name.
      // Both come from the caller: this file plots numbers, it does not know
      // what they are measuring or what a reader should be told about them.
      for (const row of rows) {
        const node = values.get(row.key);
        if (!node) continue;
        node.textContent = row.figure ?? '';
        node.classList.toggle('is-short', Boolean(row.short));
        const pick = picks.get(row.key);
        if (pick && row.label) pick.setAttribute('aria-label', row.label);
      }

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
