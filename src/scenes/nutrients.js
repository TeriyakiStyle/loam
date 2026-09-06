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

import { NUTRIENTS, RINGS, SAMPLE_BED, COUPLINGS, SEASON,
         evaluate, project, limiting, culprit, lockedFraction,
         noteIndex, allInBand }
  from '../soil/nutrients.js';
import { FIELDS, entry, hasEntry } from '../soil/glossary.js';
import { radarHTML, radarOps }  from '../ui/radar.js';
import { dialHTML, dialOps }    from '../ui/dial.js';
import { cardOps }              from '../ui/card.js';
import { clockSVG, seekClock }  from '../art/clock.js';

// The face, from the middle out.
const R_CHART = 92;    // hexagon at full value
const R_LABEL = 130;   // where the letters sit
const R_BEZEL = 164;   // the circle around them
const R_DIAL  = 198;   // every dial rides this one ring
const R_SEASON = 308;  // and the sun crosses outside all of it

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

// The season crosses the sky: dawn on the left, ninety days later on the
// right, above everything else on the face. It is not a condition and it
// modulates nothing — it is a clock, and what it changes is the reserve.
const SEASON_ARC = { a0: 180, a1: 360, tone: 'season' };

export function render(el, _store) {
  // Not square, and that is what makes the drawing big. The pH arc now ends
  // at the horizontal, which is exactly where its longest zone names sit, so
  // the canvas needs width there — but nothing reaches nearly as far above or
  // below, and a square canvas would spend that height on nothing. Trimming
  // the vertical margin is worth more than the extra width costs, because the
  // instrument is sized by its height.
  const marginX = 170;   // the long zone names at the ends of the pH arc
  const marginY = 96;    // the lower arcs and their readings
  const marginTop = R_SEASON - R_DIAL + 26;   // the sun, and room to ride
  const width  = (R_DIAL + marginX) * 2;
  const height = (R_DIAL + marginTop) + (R_DIAL + marginY);
  const cx = width / 2;
  const cy = R_DIAL + marginTop;

  const geom = {
    cx, cy,
    r: R_CHART,
    labelGap: R_LABEL - R_CHART,
    bezel: R_BEZEL,
    webs: 3,
    // The six letters are the way into the glossary — see the card below.
    pick: true,
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
        ${dialHTML(SEASON, { cx, cy, r: R_SEASON, ...SEASON_ARC,
                             marker: '<circle class="clock-fallback" r="13"/>' })}
        ${RINGS.map(ring => dialHTML(ring, dialGeom(ring))).join('\n        ')}
        ${radarHTML(NUTRIENTS, geom)}

        <!-- The day count lives in the middle of the chart, where there is
             room for it and nothing else wants to be. Hidden on day zero, so
             the page still opens as the instrument it was. -->
        <text class="day-count" data-days x="${cx}" y="${cy}"
              text-anchor="middle" dominant-baseline="middle"></text>
      </svg>

      <!-- One column, not two. Six bars stacked share a left edge, so their
           lengths can be compared by eye in a single pass down the list;
           split across two columns they could only be compared three at a
           time, and the shortest bar — the whole point of the readout — no
           longer stands out. -->
      <dl class="levels" data-levels>
        ${NUTRIENTS.map(n => `
        <div class="level" data-level="${n.key}">
          <dt>${hasEntry(n.key)
            ? `<button type="button" class="level-name" data-pick="${n.key}"
                       aria-expanded="false" aria-label="${n.name}">${n.symbol}</button>`
            : `<abbr title="${n.name}">${n.symbol}</abbr>`}</dt>
          <dd>
            <span class="level-track">
              <span class="level-reserve"   data-level-reserve></span>
              <span class="level-available" data-level-available></span>
              <span class="level-was"       data-level-was></span>
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
            is what's holding it. Held here for 90 days, this soil loses 100%
            of what it started with — <em>almost none of it into a crop</em>: it is
            leaching away and gassing off.</p>
        </div>
        <div class="stack">
          ${MESSAGES.map(m => `
          <p class="verdict-note${m.coupled ? ' is-coupled' : ''}"
             data-note="${m.id}">${m.text}</p>`).join('')}
        </div>
      </div>

      <p class="footnote">
        Solid: what the roots can reach. Dashed: what the soil holds. Dotted,
        once the sun has moved: where it stood on day one. Availability follows
        the standard bands; the depletion rates are round numbers chosen to
        behave right, not measurements.
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
      was:       node.querySelector('[data-level-was]'),
      figure:    node.querySelector('[data-level-figure]'),
    }]));

  const values = Object.fromEntries(RINGS.map(r => [r.key, r.start]));
  let days = SEASON.start;

  const dayText = el.querySelector('[data-days]');

  function update() {
    // Time first: run the reserves forward, then read availability off what
    // is left. Availability is a property of today's conditions; the reserve
    // is what the season has done to the soil.
    const ahead = project(SAMPLE_BED, values, days);
    const { rows, fired } = evaluate(ahead.reserves, values);
    // Where each reserve stood before the season ran, so the chart can show
    // what has been taken out as well as what is locked away.
    radar.set(days ? rows.map(r => ({ ...r, was: SAMPLE_BED[r.key] })) : rows);

    dayText.textContent = days > 0 ? `DAY ${Math.round(days)}` : '';

    for (const row of rows) {
      const level = levels[row.key];
      const was   = SAMPLE_BED[row.key];
      level.reserve.style.width   = `${(row.reserve   * 100).toFixed(1)}%`;
      level.available.style.width = `${(row.available * 100).toFixed(1)}%`;
      // A ghost of where this nutrient started, so the retreat is visible.
      level.was.style.width       = `${(was * 100).toFixed(1)}%`;
      level.was.hidden            = !days;
      level.figure.textContent    = `${Math.round(row.available * 100)}%`;
      // Under half of its own reserve means held back, not absent — which is
      // the distinction the whole page exists to make.
      level.node.classList.toggle('is-locked', row.factor < 0.5);
    }

    const worst  = limiting(rows);
    const locked = lockedFraction(rows);
    const taken  = NUTRIENTS.reduce((s, n) => s + ahead.uptake[n.key], 0);
    const wasted = NUTRIENTS.reduce((s, n) => s + ahead.waste[n.key], 0);
    // With one dial you always knew what changed. With three you don't, so
    // the verdict has to name the ring, not just the nutrient.
    const blame  = culprit(worst);
    // Opening on a healthy bed and saying "X is the LIMIT" reads like an
    // alarm. When all three dials are in their bands there is nothing wrong —
    // there is just a ceiling, which is a different sentence.
    const today = allInBand(values)
      ? `All three dials are in their working range. <strong>${worst.name}</strong>
         is still the ceiling at ${Math.round(worst.available * 100)}%, and
         ${Math.round(locked * 100)}% of this soil stays out of reach even here.`
      : `<strong>${worst.name}</strong> is the limit here, at
         ${Math.round(worst.available * 100)}% — and
         ${Math.round(locked * 100)}% of everything in this soil is out of reach.
         The ${blame.noun} is what's holding it.`;

    // The two doors. Same falling number, opposite meaning: one of these is a
    // harvest and the other is a leak, and saying which is the whole reason
    // the projection is worth having.
    const gone  = taken + wasted;
    const start = NUTRIENTS.reduce((s, n) => s + SAMPLE_BED[n.key], 0);
    const kept  = gone > 0 ? taken / gone : 0;
    const ledger = !days ? ''
      : ` Held here for ${Math.round(days)} days, this soil loses
          ${Math.round(gone / start * 100)}% of what it started with —
          ${kept >= 0.6 ? `<em>most of it into the crop</em>, which is what a
             harvest is`
           : kept <= 0.25 ? `<em>almost none of it into a crop</em>: it is
             leaching away and gassing off`
           : `<em>about half into the crop</em>, the rest leaching away`}.`;

    verdict.innerHTML = today + ledger;

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

  const clock = svg.querySelector(`[data-dial="${SEASON.key}"] [data-marker]`);
  dials.push(dialOps(svg, SEASON, { cx, cy, r: R_SEASON, ...SEASON_ARC }, v => {
    days = v;
    const art = clock.querySelector('.clock-art');
    if (art) seekClock(art, v);
    update();
  }));

  // --- the glossary, on demand -------------------------------------------
  // Two ways in to the same card: the letter on the chart and the label on
  // the bar beneath it. They are the same term in two places, so they open
  // the same thing, and either one closes it again.
  const section = el.querySelector('.instrument');
  const card    = cardOps(section, FIELDS);
  const picks   = [...section.querySelectorAll('[data-pick]')];

  function onPick(event) {
    const trigger = event.currentTarget;
    const found = entry(trigger.dataset.pick);
    if (!found) return;
    // The chart letters are SVG groups, not buttons: Space and Enter have to
    // be spelled out. On a real <button> the browser has already turned those
    // into a click, so only the group needs this.
    if (event.type === 'keydown') {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
    }
    card.toggle(trigger, { name: NUTRIENTS.find(n => n.key === found.key).name, ...found });
  }

  picks.forEach(p => {
    p.addEventListener('click', onPick);
    if (p.tagName !== 'BUTTON') p.addEventListener('keydown', onPick);
  });

  // The artwork arrives when it arrives; the track works without it.
  let alive = true;
  clockSVG(40).then(markup => {
    if (!alive || !markup) return;
    clock.innerHTML = markup;
    seekClock(clock.querySelector('.clock-art'), days);
  });

  update();
  return () => {
    alive = false;
    dials.forEach(d => d.destroy());
    picks.forEach(p => {
      p.removeEventListener('click', onPick);
      p.removeEventListener('keydown', onPick);
    });
    card.destroy();
  };
}
