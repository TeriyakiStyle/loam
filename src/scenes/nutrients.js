// ---------------------------------------------------------------------------
// NUTRIENTS — the instrument.
//
// Three arcs on one ring: pH over the top, temperature at the lower left,
// water at the lower right. Inside them, what the plant actually gets.
//
// Every arc runs from one failure to its opposite with the good ground in the
// middle, and each arc is placed so its own middle points outward. So when
// all three are where they should be, the three markers sit at the top of
// their own arcs and form an equilateral triangle. Lopsided means something
// is off, and which way it leans says what — a reading you get before you
// read a single number.
//
// This file only assembles. It asks soil/nutrients.js what exists, hands the
// geometry to ui/radar.js and ui/dial.js, and wires the two together.
// ---------------------------------------------------------------------------

import { NUTRIENTS, RINGS, SAMPLE_BED, COUPLINGS,
         evaluate, limiting, culprit, lockedFraction, noteIndex, allInBand }
  from '../soil/nutrients.js';
import { radarHTML, radarOps } from '../ui/radar.js';
import { dialHTML, dialOps }   from '../ui/dial.js';

// The face, from the middle out.
const R_CHART = 92;    // hexagon at full value
const R_LABEL = 130;   // where the letters sit
const R_BEZEL = 164;   // the circle around them
const R_DIAL  = 198;   // every dial rides this one ring

// Three arcs, and the shares are the hierarchy. SVG degrees: 270 is up, 90
// is down, 0 is right.
//
// pH takes the whole upper HALF of the circle — 180° of it — and temperature
// and water divide what is left, 66° each with 16° of clear space between
// all three. Half the instrument against a fifth: that is a difference you
// read before you read anything, and it says what the soil says. pH is the
// first thing to check and it gates the other two; they modulate what it has
// already decided.
//
//        pH   180 → 360    the whole top half
//   moisture    82 →  16    lower right
//       temp    98 → 164    lower left
//
// The two lower arcs sit 41° either side of straight down, mirrored, and both
// put their MINIMUM at the bottom and climb outward — cold at the bottom
// rising to hot up the left, dry at the bottom rising to drowned up the
// right. `flip` is what reverses one of them; without it the pair runs in
// opposite senses and reads as a mistake.
//
// A note on what this costs. When the arcs were equal thirds, three markers
// at their sweet spots made an equilateral triangle. They no longer do —
// the shape is now isosceles. What survives, and is the part you actually
// read, is the MIRROR SYMMETRY: at rest the two lower markers are reflections
// of each other and the pH marker sits at top centre. Lopsided still means
// something is off, and which way it leans still says what.
const GAP = 16;
const ARCS = {
  ph:       { centre: 270, span: 180, flip: false, tone: 'primary'   },
  temp:     { centre: 131, span:  66, flip: false, tone: 'secondary' },
  moisture: { centre:  49, span:  66, flip: true,  tone: 'secondary' },
};

const arcFor = key => {
  const { centre, span, flip, tone } = ARCS[key];
  const lo = centre - span / 2;
  const hi = centre + span / 2;
  return { ...(flip ? { a0: hi, a1: lo } : { a0: lo, a1: hi }), tone };
};

export function render(el, _store) {
  // Not square, and that is what makes the drawing big. The pH arc now ends
  // at the horizontal, which is exactly where its longest zone names sit, so
  // the canvas needs width there — but nothing reaches nearly as far above or
  // below, and a square canvas would spend that height on nothing. Trimming
  // the vertical margin is worth more than the extra width costs, because the
  // instrument is sized by its height.
  const marginX = 170;   // the long zone names at the ends of the pH arc
  const marginY = 96;    // the reading above the apex, the lower arcs below
  const width  = (R_DIAL + marginX) * 2;
  const height = (R_DIAL + marginY) * 2;
  const cx = width / 2;
  const cy = height / 2;

  const geom = {
    cx, cy,
    r: R_CHART,
    labelGap: R_LABEL - R_CHART,
    bezel: R_BEZEL,
    webs: 3,
  };

  const dialGeom = ring => ({ cx, cy, r: R_DIAL, ...arcFor(ring.key) });

  // Every message the page can ever show, laid out at once. See the verdict
  // block below for why.
  const MESSAGES = [
    ...RINGS.flatMap(ring => ring.notes.map((n, i) => ({ id: `${ring.key}-${i}`, text: n.text }))),
    ...COUPLINGS.map(c => ({ id: `x-${c.key}`, text: c.text, coupled: true })),
  ];

  el.innerHTML = `
    <section class="instrument">
      <h1 class="sr-only">Nutrients</h1>

      <svg viewBox="0 0 ${width} ${height}" class="scope-svg"
           role="group" aria-label="Nutrient availability">
        ${RINGS.map(ring => dialHTML(ring, dialGeom(ring))).join('\n        ')}
        ${radarHTML(NUTRIENTS, geom)}
      </svg>

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

      <!-- Every line the verdict can ever show is laid out here at once, in a
           single grid cell, with the inactive ones merely invisible. The block
           is therefore always as tall as its tallest possible contents, so
           dragging a dial cannot change the height of the document — which is
           what made the page twitch as the text got longer or shorter. -->
      <div class="verdict">
        <div class="stack">
          <p class="verdict-line" data-verdict></p>
          <p class="verdict-line is-sizer" aria-hidden="true">
            <strong>Phosphorus</strong> is the limit here, at 100% — and
            100% of everything in this soil is out of reach. The temperature
            is what's holding it.</p>
        </div>
        <div class="stack">
          ${MESSAGES.map(m => `
          <p class="verdict-note${m.coupled ? ' is-coupled' : ''}"
             data-note="${m.id}">${m.text}</p>`).join('')}
        </div>
      </div>

      <p class="footnote">
        Faint outline: what the soil holds. Solid: what the roots can reach.
        Availability curves follow the standard bands — a teaching figure, not
        a reading from any particular soil.
      </p>
    </section>
  `;

  const svg     = el.querySelector('.scope-svg');
  const radar   = radarOps(svg, geom);
  const verdict = el.querySelector('[data-verdict]');
  const notes   = new Map([...el.querySelectorAll('[data-note]')]
    .map(node => [node.dataset.note, node]));
  const levels  = Object.fromEntries([...el.querySelectorAll('[data-level]')]
    .map(node => [node.dataset.level, {
      node,
      reserve:   node.querySelector('[data-level-reserve]'),
      available: node.querySelector('[data-level-available]'),
      figure:    node.querySelector('[data-level-figure]'),
    }]));

  const values = Object.fromEntries(RINGS.map(r => [r.key, r.start]));

  function update() {
    const { rows, fired } = evaluate(SAMPLE_BED, values);
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

    const worst  = limiting(rows);
    const locked = lockedFraction(rows);
    // With one dial you always knew what changed. With three you don't, so
    // the verdict has to name the ring, not just the nutrient.
    const blame  = culprit(worst);
    // Opening on a healthy bed and saying "X is the LIMIT" reads like an
    // alarm. When all three dials are in their bands there is nothing wrong —
    // there is just a ceiling, which is a different sentence.
    verdict.innerHTML = allInBand(values)
      ? `All three dials are in their working range. <strong>${worst.name}</strong>
         is still the ceiling at ${Math.round(worst.available * 100)}%, and
         ${Math.round(locked * 100)}% of this soil stays out of reach even here.`
      : `<strong>${worst.name}</strong> is the limit here, at
         ${Math.round(worst.available * 100)}% — and
         ${Math.round(locked * 100)}% of everything in this soil is out of reach.
         The ${blame.noun} is what's holding it.`;

    // A coupling that has fired outranks any single ring's note: it is the
    // surprising thing on screen, so it is the thing worth explaining.
    const showing = fired.length
      ? `x-${fired[0].key}`
      : `${blame.key}-${noteIndex(blame, values[blame.key])}`;
    for (const [id, node] of notes) node.classList.toggle('is-on', id === showing);
  }

  const dials = RINGS.map(ring =>
    dialOps(svg, ring, dialGeom(ring), v => {
      values[ring.key] = v;
      update();
    }));

  update();
  return () => dials.forEach(d => d.destroy());
}
