// ---------------------------------------------------------------------------
// NUTRIENTS — the instrument.
//
// Rings on the outside are the environment. The chart in the middle is what
// the plant actually gets. Move a ring and watch the middle change shape.
//
// This file only assembles: it asks soil/nutrients.js what exists, hands the
// geometry to ui/radar.js and ui/dial.js, and wires the two together. Adding
// a second ring means adding it to RINGS — nothing here changes.
// ---------------------------------------------------------------------------

import { NUTRIENTS, RINGS, SAMPLE_BED, evaluate, limiting, lockedFraction }
  from '../soil/nutrients.js';
import { radarHTML, radarOps } from '../ui/radar.js';
import { dialHTML, dialOps }   from '../ui/dial.js';

// Radar radius, then the first ring, then each ring after it.
const R_CHART = 104;
const R_FIRST = 168;
const R_STEP  = 36;

const ringRadius = i => R_FIRST + i * R_STEP;

export function render(el, _store) {
  // The canvas grows with the number of rings, so a third ring never gets
  // clipped — it just makes the drawing wider and taller.
  //
  // It is not square: the dials are half-circles over the top, so below the
  // centre there is only the chart and its labels. Cropping that dead space
  // is what keeps the page from scrolling on a laptop.
  const outer  = ringRadius(RINGS.length - 1);
  const margin = 34;                        // tick labels live out here
  const above  = outer + margin;
  const below  = R_CHART + 44;              // chart, its labels, a little air
  const width  = above * 2;
  const height = above + below;
  const cx = width / 2;
  const cy = above;
  const geom = { cx, cy, r: R_CHART };

  el.innerHTML = `
    <section class="instrument">
      <header class="instrument-head">
        <h1>Nutrients</h1>
        <p class="lede">What the soil holds is not what the plant gets.</p>
      </header>

      <div class="scope">
        <svg viewBox="0 0 ${width} ${height}" class="scope-svg"
             role="group" aria-label="Nutrient availability">
          ${RINGS.map((ring, i) =>
            dialHTML(ring, { cx, cy, r: ringRadius(i) })).join('\n          ')}
          ${radarHTML(NUTRIENTS, geom)}
        </svg>

        <div class="readouts">
          ${RINGS.map(ring => `
          <p class="readout" data-readout="${ring.key}">
            <span class="readout-label">${ring.label}</span>
            <span class="readout-value" data-value="${ring.key}"></span>
          </p>`).join('')}
        </div>
      </div>

      <dl class="levels" data-levels>
        ${NUTRIENTS.map(n => `
        <div class="level" data-level="${n.key}">
          <dt><abbr title="${n.name}">${n.symbol}</abbr></dt>
          <dd>
            <span class="level-track">
              <span class="level-reserve"   data-level-reserve></span>
              <span class="level-available" data-level-available></span>
            </span>
            <span class="level-figure" data-level-figure></span>
          </dd>
        </div>`).join('')}
      </dl>

      <p class="verdict" data-verdict></p>
      <p class="footnote">
        Faint outline: what the soil holds. Solid: what the roots can reach.
        Availability curves follow the standard Truog bands — a teaching
        figure, not a reading from any particular soil.
      </p>
    </section>
  `;

  const svg     = el.querySelector('.scope-svg');
  const radar   = radarOps(svg, geom);
  const verdict = el.querySelector('[data-verdict]');
  const levels  = Object.fromEntries([...el.querySelectorAll('[data-level]')]
    .map(node => [node.dataset.level, {
      node,
      reserve:   node.querySelector('[data-level-reserve]'),
      available: node.querySelector('[data-level-available]'),
      figure:    node.querySelector('[data-level-figure]'),
    }]));

  const values = Object.fromEntries(RINGS.map(r => [r.key, r.start]));

  function update() {
    const rows = evaluate(SAMPLE_BED, values);
    radar.set(rows);

    for (const row of rows) {
      const level = levels[row.key];
      level.reserve.style.width   = `${(row.reserve   * 100).toFixed(1)}%`;
      level.available.style.width = `${(row.available * 100).toFixed(1)}%`;
      level.figure.textContent    = `${Math.round(row.available * 100)}%`;
      // Under half of its own reserve means held back, not absent — which is
      // the distinction the whole page exists to make.
      level.node.classList.toggle('is-locked', row.factor < 0.5);
    }

    for (const ring of RINGS) {
      el.querySelector(`[data-value="${ring.key}"]`).textContent =
        ring.format(values[ring.key]);
    }

    const worst  = limiting(rows);
    const locked = lockedFraction(rows);
    const ring   = RINGS[0];
    verdict.innerHTML =
      `<strong>${worst.name}</strong> is the limit here, at
       ${Math.round(worst.available * 100)}% — and
       ${Math.round(locked * 100)}% of everything in this soil is out of reach.
       <span class="verdict-note">${ring.note(values[ring.key])}</span>`;
  }

  const dials = RINGS.map((ring, i) =>
    dialOps(svg, ring, { cx, cy, r: ringRadius(i) }, v => {
      values[ring.key] = v;
      update();
    }));

  update();
  return () => dials.forEach(d => d.destroy());
}
