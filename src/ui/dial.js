// ---------------------------------------------------------------------------
// DIAL
//
// One environmental ring: an arc on the instrument face, coloured along its
// length, with a marker you can drag or arrow along it.
//
// Every dial on this face measures the same shape of thing — a scale running
// between two opposite failures with the good ground in the middle. Too acid
// or too alkaline, too cold or too hot, too dry or too drowned. So none of
// them FILL: a filled gauge would say more is better, and for all three of
// these more is another way to be wrong.
//
// Because the ideal is the middle of the range, and each arc is placed so its
// own middle points outward, all three markers sit at the twelve o'clock of
// their own arc when conditions are right — three evenly spaced arcs, three
// markers, an equilateral triangle. Lopsided means something is off, and
// which way it leans says what.
//
// Angles are SVG degrees (0 = right, 90 = down). a0 is where the MINIMUM
// sits and a1 the maximum, and a1 may be either side of a0 — a dial can run
// clockwise or anticlockwise, which is what lets the two lower arcs mirror
// each other so both read outward from the bottom of the face. An arc may
// also wrap past 360.
//
// Knows nothing about soil. Hand it a ring definition from soil/nutrients.js
// plus a centre, a radius and two angles, and it draws itself.
// ---------------------------------------------------------------------------

import { zoneLabel } from '../soil/nutrients.js';

const DEG = Math.PI / 180;

// How far outside the arc the live reading rides. It has to clear the tick
// labels at r + 19, and on the diagonal arcs radial separation projects into
// much less horizontal separation — so this is set from the worst case, not
// from how it looks at the top of the circle.
const VALUE_GAP = 68;

const at = (cx, cy, r, deg) => [cx + Math.cos(deg * DEG) * r, cy + Math.sin(deg * DEG) * r];

/**
 * Static markup for one dial.
 *
 * @param ring  a definition from RINGS
 * @param geom  { cx, cy, r, a0, a1 }
 */
export function dialHTML(ring, { cx, cy, r, a0, a1 }) {
  const span = ring.max - ring.min;
  const norm = v => (v - ring.min) / span;
  const angleOf = t => a0 + t * (a1 - a0);
  const sweep = a1 - a0;
  const id = `ramp-${ring.key}`;

  // A gradient along the arc's chord. Projecting an arc onto its own chord is
  // monotonic for any sweep under 180°, so a straight gradient can follow a
  // curve exactly — this is where each colour stop lands along it.
  const stopAt = t => {
    const th = angleOf(t);
    return Math.sin((th - a0) / 2 * DEG) * Math.cos((th - a1) / 2 * DEG)
         / Math.sin(sweep / 2 * DEG);
  };

  const [gx1, gy1] = at(cx, cy, r, a0);
  const [gx2, gy2] = at(cx, cy, r, a1);

  const stops = ring.ramp.map(([v, colour]) =>
    `<stop offset="${(stopAt(norm(v)) * 100).toFixed(2)}%" stop-color="${colour}"/>`
  ).join('\n        ');

  function arcPath(radius, t0, t1) {
    const [x0, y0] = at(cx, cy, radius, angleOf(t0));
    const [x1, y1] = at(cx, cy, radius, angleOf(t1));
    const arc = (t1 - t0) * sweep;
    const big = Math.abs(arc) > 180 ? 1 : 0;
    return `M${x0.toFixed(1)} ${y0.toFixed(1)} `
         + `A${radius} ${radius} 0 ${big} ${arc >= 0 ? 1 : 0} `
         + `${x1.toFixed(1)} ${y1.toFixed(1)}`;
  }

  const ticks = ring.ticks.map(v => {
    const a = angleOf(norm(v));
    const [ix, iy] = at(cx, cy, r - 9, a);
    const [ox, oy] = at(cx, cy, r + 1, a);
    const [lx, ly] = at(cx, cy, r + 19, a);
    return `<line class="dial-tick" x1="${ix.toFixed(1)}" y1="${iy.toFixed(1)}"
              x2="${ox.toFixed(1)}" y2="${oy.toFixed(1)}"/>
        <text class="dial-tick-label" x="${lx.toFixed(1)}" y="${ly.toFixed(1)}"
              text-anchor="middle" dominant-baseline="middle">${v}</text>`;
  }).join('\n        ');

  // The band worth aiming for, marked on the inside so it reads as a target
  // rather than as more scale.
  const sweet = ring.sweet
    ? `<path class="dial-sweet" d="${arcPath(r - 13, norm(ring.sweet[0]), norm(ring.sweet[1]))}"/>`
    : '';

  const [mx, my] = at(cx, cy, r, angleOf(norm(ring.start)));
  const [vx, vy] = at(cx, cy, r + VALUE_GAP, angleOf(norm(ring.start)));
  const zoned = Boolean(ring.zones);

  return `<g class="dial" data-dial="${ring.key}">
      <defs>
        <linearGradient id="${id}" gradientUnits="userSpaceOnUse"
                        x1="${gx1.toFixed(1)}" y1="${gy1.toFixed(1)}"
                        x2="${gx2.toFixed(1)}" y2="${gy2.toFixed(1)}">
        ${stops}
        </linearGradient>
      </defs>

      ${sweet}
      <path class="dial-track" d="${arcPath(r, 0, 1)}" stroke="url(#${id})"/>
      <path class="dial-hit"   d="${arcPath(r, 0, 1)}" data-hit/>
      <g class="dial-ticks">
        ${ticks}
      </g>

      <g class="dial-marker" data-marker
         transform="translate(${mx.toFixed(1)} ${my.toFixed(1)})"
         tabindex="0" role="slider"
         aria-label="${ring.label}"
         aria-valuemin="${ring.min}" aria-valuemax="${ring.max}"
         aria-valuenow="${ring.start}" aria-valuetext="${ring.format(ring.start)}">
        <circle class="dial-knob" r="9"/>
        <circle class="dial-pip"  r="3.2"/>
      </g>

      <!-- The reading rides along with the marker rather than sitting in a
           corner: the number and the thing it measures stay together. The
           whole group is translated, so both lines move as one. -->
      <g class="dial-reading" data-dial-reading aria-hidden="true"
         transform="translate(${vx.toFixed(1)} ${vy.toFixed(1)})">
        <text class="dial-value" data-dial-value
              text-anchor="middle" dominant-baseline="middle"
              y="${zoned ? -6 : 0}">${ring.label} ${ring.format(ring.start)}</text>
        ${zoned ? `<text class="dial-zone" data-dial-zone
              text-anchor="middle" dominant-baseline="middle"
              y="8">${zoneLabel(ring, ring.start)}</text>` : ''}
      </g>
    </g>`;
}

/**
 * Live handle. `onChange(value)` fires whenever the marker moves.
 * Returns { set, value, destroy }.
 */
export function dialOps(root, ring, { cx, cy, r, a0, a1 }, onChange) {
  const g       = root.querySelector(`[data-dial="${ring.key}"]`);
  const hit     = g.querySelector('[data-hit]');
  const marker  = g.querySelector('[data-marker]');
  const reading = g.querySelector('[data-dial-reading]');
  const value$  = g.querySelector('[data-dial-value]');
  const zone$   = g.querySelector('[data-dial-zone]');
  const svg     = root.closest('svg') || root.querySelector('svg') || root;
  const span    = ring.max - ring.min;
  const sweep   = a1 - a0;
  const quantum = ring.step || 0.1;

  let value = ring.start;

  // Rounded through a fixed number of decimals, not just to the nearest step:
  // Math.round(7.3 / 0.1) * 0.1 is 7.300000000000001 in binary floating point,
  // which then falls the wrong side of a band edge written as 7.3.
  const snap = v => Number((Math.round(v / quantum) * quantum).toFixed(6));
  const clamp = v => Math.min(ring.max, Math.max(ring.min, v));

  function place(v) {
    value = clamp(snap(v));
    const a = a0 + ((value - ring.min) / span) * sweep;

    const [x, y] = at(cx, cy, r, a);
    marker.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)})`);
    marker.setAttribute('aria-valuenow', value.toFixed(2));

    const [vx, vy] = at(cx, cy, r + VALUE_GAP, a);
    reading.setAttribute('transform', `translate(${vx.toFixed(1)} ${vy.toFixed(1)})`);
    value$.textContent = `${ring.label} ${ring.format(value)}`;

    const zone = zoneLabel(ring, value);
    if (zone$) zone$.textContent = zone;
    // The region belongs in the accessible reading too, not just the picture.
    marker.setAttribute('aria-valuetext',
      zone ? `${ring.format(value)}, ${zone}` : ring.format(value));

    if (onChange) onChange(value);
  }

  // Pointer position -> value, measured as an angle around this arc's own
  // start and in this arc's own direction. Anything outside the arc clamps to
  // whichever end it is nearer, so a drag that runs off the end parks sensibly
  // instead of leaping to the other extreme — which matters more now that each
  // arc is only a third of the circle and there is a lot of "outside" to
  // wander into.
  function fromPointer(event) {
    const pt = svg.createSVGPoint();
    pt.x = event.clientX;
    pt.y = event.clientY;
    const p = pt.matrixTransform(svg.getScreenCTM().inverse());

    const a  = Math.atan2(p.y - cy, p.x - cx) / DEG;
    const cw = ((a - a0) % 360 + 360) % 360;       // clockwise from the start
    const rel = sweep >= 0 ? cw : (360 - cw) % 360;  // ...in the arc's own sense
    const reach = Math.abs(sweep);

    if (rel <= reach) return ring.min + (rel / reach) * span;
    return (rel - reach) < (360 - rel) ? ring.max : ring.min;
  }

  let dragging = false;

  function onDown(event) {
    dragging = true;
    marker.focus?.();
    g.setPointerCapture?.(event.pointerId);
    place(fromPointer(event));
    event.preventDefault();
  }
  function onMove(event) { if (dragging) place(fromPointer(event)); }
  function onUp(event)   { dragging = false; g.releasePointerCapture?.(event.pointerId); }

  const STEPS = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1 };
  function onKey(event) {
    if (event.key === 'Home')  { place(ring.min); event.preventDefault(); return; }
    if (event.key === 'End')   { place(ring.max); event.preventDefault(); return; }
    if (event.key === 'PageUp')   { place(value + quantum * 10); event.preventDefault(); return; }
    if (event.key === 'PageDown') { place(value - quantum * 10); event.preventDefault(); return; }
    const dir = STEPS[event.key];
    if (!dir) return;
    place(value + dir * quantum);
    event.preventDefault();
  }

  hit.addEventListener('pointerdown', onDown);
  marker.addEventListener('pointerdown', onDown);
  g.addEventListener('pointermove', onMove);
  g.addEventListener('pointerup', onUp);
  g.addEventListener('pointercancel', onUp);
  marker.addEventListener('keydown', onKey);

  place(ring.start);

  return {
    set: place,
    value: () => value,
    destroy() {
      hit.removeEventListener('pointerdown', onDown);
      marker.removeEventListener('pointerdown', onDown);
      g.removeEventListener('pointermove', onMove);
      g.removeEventListener('pointerup', onUp);
      g.removeEventListener('pointercancel', onUp);
      marker.removeEventListener('keydown', onKey);
    },
  };
}
