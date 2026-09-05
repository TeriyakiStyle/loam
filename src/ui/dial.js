// ---------------------------------------------------------------------------
// DIAL
//
// One environmental ring: a half-circle arc over the top of the chart, coloured
// along its length, with a marker you can drag or arrow along it.
//
// The arc runs left → top → right, so the middle of the range sits at the
// apex. For pH over 4–9 that puts 6.5 at the top, which is where it belongs.
//
// Knows nothing about soil either. Hand it a ring definition from
// soil/nutrients.js and a radius, and it draws itself. Two rings, three rings,
// same component at a bigger radius each time.
// ---------------------------------------------------------------------------

const DEG = Math.PI / 180;

// The arc's angular span, in SVG degrees (0 = right, 90 = down).
const A0 = 180;   // left end  — the minimum
const A1 = 360;   // right end — the maximum

const at = (cx, cy, r, deg) => [cx + Math.cos(deg * DEG) * r, cy + Math.sin(deg * DEG) * r];
const angleOf = t => A0 + t * (A1 - A0);

/** Where along a left-to-right gradient the angle for `t` actually lands. */
const gradientStop = t => (1 + Math.cos(angleOf(t) * DEG)) / 2;

function arcPath(cx, cy, r, t0, t1) {
  const [x0, y0] = at(cx, cy, r, angleOf(t0));
  const [x1, y1] = at(cx, cy, r, angleOf(t1));
  return `M${x0.toFixed(1)} ${y0.toFixed(1)} A${r} ${r} 0 0 1 ${x1.toFixed(1)} ${y1.toFixed(1)}`;
}

/**
 * Static markup for one ring.
 *
 * @param ring  a definition from RINGS
 * @param geom  { cx, cy, r }
 */
export function dialHTML(ring, { cx, cy, r }) {
  const span = ring.max - ring.min;
  const norm = v => (v - ring.min) / span;
  const id = `ramp-${ring.key}`;

  const stops = ring.ramp.map(([v, colour]) =>
    `<stop offset="${(gradientStop(norm(v)) * 100).toFixed(2)}%" stop-color="${colour}"/>`
  ).join('\n        ');

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
    ? `<path class="dial-sweet" d="${arcPath(cx, cy, r - 13, norm(ring.sweet[0]), norm(ring.sweet[1]))}"/>`
    : '';

  const [mx, my] = at(cx, cy, r, angleOf(norm(ring.start)));

  return `<g class="dial" data-dial="${ring.key}">
      <defs>
        <linearGradient id="${id}" x1="${cx - r}" y1="0" x2="${cx + r}" y2="0"
                        gradientUnits="userSpaceOnUse">
        ${stops}
        </linearGradient>
      </defs>

      ${sweet}
      <path class="dial-track" d="${arcPath(cx, cy, r, 0, 1)}" stroke="url(#${id})"/>
      <path class="dial-hit"   d="${arcPath(cx, cy, r, 0, 1)}" data-hit/>
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
    </g>`;
}

/**
 * Live handle. `onChange(value)` fires whenever the marker moves.
 * Returns { set, value, destroy }.
 */
export function dialOps(root, ring, { cx, cy, r }, onChange) {
  const g       = root.querySelector(`[data-dial="${ring.key}"]`);
  const hit     = g.querySelector('[data-hit]');
  const marker  = g.querySelector('[data-marker]');
  const svg     = root.closest('svg') || root.querySelector('svg') || root;
  const span    = ring.max - ring.min;
  const quantum = ring.step || 0.1;

  let value = ring.start;

  const snap = v => Math.round(v / quantum) * quantum;
  const clamp = v => Math.min(ring.max, Math.max(ring.min, v));

  function place(v) {
    value = clamp(snap(v));
    const [x, y] = at(cx, cy, r, angleOf((value - ring.min) / span));
    marker.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)})`);
    marker.setAttribute('aria-valuenow', value.toFixed(2));
    marker.setAttribute('aria-valuetext', ring.format(value));
    if (onChange) onChange(value);
  }

  // Pointer position -> value. Anything below the centre line clamps to
  // whichever end it is nearest, so a drag that overshoots parks sensibly
  // instead of jumping to the far side.
  function fromPointer(event) {
    const pt = svg.createSVGPoint();
    pt.x = event.clientX;
    pt.y = event.clientY;
    const p = pt.matrixTransform(svg.getScreenCTM().inverse());
    let a = Math.atan2(p.y - cy, p.x - cx) / DEG;
    if (a < 0) a += 360;
    if (a < 90) return ring.max;
    if (a < 180) return ring.min;
    return ring.min + ((a - A0) / (A1 - A0)) * span;
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
