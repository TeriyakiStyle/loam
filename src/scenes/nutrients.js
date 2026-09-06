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
         evaluate, project, limiting, culprit, lockedFraction, ledger,
         noteIndex, allInBand }
  from '../soil/nutrients.js';
import { FIELDS, entry }        from '../soil/glossary.js';
import { radarHTML, radarOps }  from '../ui/radar.js';
import { dialHTML, dialOps }    from '../ui/dial.js';
import { cardOps }              from '../ui/card.js';
import { clockSVG, seekClock }  from '../art/clock.js';

// The face, from the middle out.
//
// The letters and their figures share the ring between the hexagon and the
// bezel: letter inside, number just outside it, both on the same spoke. That
// ring used to hold only the letters, with the numbers listed as bars beneath
// the drawing — which meant reading a shape, then reading a list, then
// matching one to the other. The chart was always saying it already.
const R_CHART = 92;    // hexagon at full value
const R_LABEL = 120;   // where the letters sit
const R_VALUE = 145;   // and the reading, one step further out
const R_BEZEL = 164;   // the circle around them both

// How much headroom past the target the chart shows. A soil can hold more
// than a crop needs — that is an ordinary state, not an error — so the ring
// cannot be the edge of the world. At 1.5 the target sits two-thirds out,
// which leaves a visible band of "more than enough" without shrinking the
// part of the scale where the answers actually live.
const FULL = 1.5;
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
    valueGap: R_VALUE - R_CHART,
    bezel: R_BEZEL,
    webs: 3,
    targetAt: 1 / FULL,
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

      <!-- Every line the verdict can ever show is laid out here at once, in a
           single grid cell, with the inactive ones merely invisible. The block
           is therefore always as tall as its tallest possible contents, so
           dragging a dial cannot change the height of the document — which is
           what made the page twitch as the text got longer or shorter.

           That reservation is only free if the lines are of a SIZE. When the
           verdict could run to five clauses and usually ran to two, the block
           held a hole where the other three would have been, and the hole
           read as a mistake. The sentences below are short and roughly equal;
           the sizer is what the longest of them actually costs. -->
      <div class="verdict">
        <div class="stack">
          <p class="verdict-line" data-verdict></p>
          <p class="verdict-line is-sizer" aria-hidden="true">
            <strong>Phosphorus</strong> is the limit — 1000 of 1000 ppm, and the
            temperature is what's holding it back, along with 100% of everything
            else here. After 90 days, 100% of the bed is gone —
            <em>almost none into a crop</em>.</p>
        </div>
        <div class="stack">
          ${MESSAGES.map(m => `
          <p class="verdict-note${m.coupled ? ' is-coupled' : ''}"
             data-note="${m.id}">${m.text}</p>`).join('')}
        </div>
      </div>

      <p class="footnote">
        Figures are ppm. Rings are half, one and one-and-a-half times target;
        the bold one is target, where a soil test stops asking for more.
        Filled: what roots reach. Dashed: what the soil holds. Dotted: day one.
        Targets are Bray-1 / Mehlich-3 — Olsen phosphorus reads about half.
        Depletion rates are chosen to behave right, not measured.
      </p>
    </section>
  `;

  const svg     = el.querySelector('.scope-svg');
  const radar   = radarOps(svg, geom);
  const verdict = el.querySelector('[data-verdict]');
  const notes   = new Map([...el.querySelectorAll('[data-note]')]
    .map(node => [node.dataset.note, node]));

  const values = Object.fromEntries(RINGS.map(r => [r.key, r.start]));
  let days = SEASON.start;

  const dayText = el.querySelector('[data-days]');

  // Everything the chart plots is a share of that nutrient's target, scaled
  // into the radius. The figures beside the axes stay in ppm — the shape is
  // what makes six different nutrients comparable, and the number is what
  // makes any one of them checkable.
  const plot = ppm => Math.max(0, Math.min(1, ppm / FULL));
  const ppm  = v => (v >= 100 ? Math.round(v) : v >= 10 ? v.toFixed(0) : v.toFixed(1));

  function update() {
    // Time first: run the reserves forward, then read availability off what
    // is left. Availability is a property of today's conditions; the reserve
    // is what the season has done to the soil.
    const ahead = project(SAMPLE_BED, values, days);
    const { rows, fired } = evaluate(ahead.reserves, values);

    radar.set(rows.map(row => ({
      key:       row.key,
      reserve:   plot(row.reserve / row.target),
      available: plot(row.share),
      // Where this nutrient stood before the season ran, so the chart shows
      // what has been taken OUT as well as what is locked away.
      ...(days ? { was: plot(SAMPLE_BED[row.key] / row.target) } : {}),
      figure:    ppm(row.available),
      // Short enough that a lab would tell you to add some.
      //
      // Not `share < 1`. Optimum is a BAND, not a cliff — every one of the
      // targets above is the middle or top of a published range, so a soil at
      // 149 of 150 is not deficient in potassium, it is at target with a
      // rounding error. Colouring five of six figures red on a healthy bed
      // teaches the reader to ignore the colour, which costs it the one job
      // it has: to shout when something is actually wrong.
      short:     row.share < 0.75,
      label:     `${row.name}, ${ppm(row.available)} of ${row.target} ppm available`,
    })));

    dayText.textContent = days > 0 ? `DAY ${Math.round(days)}` : '';

    const worst  = limiting(rows);
    const locked = lockedFraction(rows);
    // With one dial you always knew what changed. With three you don't, so
    // the verdict has to name the ring, not just the nutrient.
    const blame  = culprit(worst);

    // Now that the scale has a denominator, the sentence can say what the
    // shortfall IS: not "58%" of nothing in particular, but this much of the
    // level a lab would ask for. And a soil that clears every target is a
    // different sentence again — no ceiling, no alarm.
    const short = `${ppm(worst.available)} of ${worst.target} ppm`;
    const today = worst.share >= 1
      ? `Every nutrient is at or above target. <strong>${worst.name}</strong> is
         the closest to the line, at ${short}.`
      : allInBand(values)
      ? `<strong>${worst.name}</strong> is the limit — ${short}, with all three
         dials in range. This bed is short of it, not locked out of it.`
      : `<strong>${worst.name}</strong> is the limit — ${short}, and the
         ${blame.noun} is what's holding it back${
           locked > 0.15 ? `, along with ${Math.round(locked * 100)}% of
           everything else here` : ''}.`;

    // The two doors. Same falling number, opposite meaning: one of these is a
    // harvest and the other is a leak, and saying which is the whole reason
    // the projection is worth having.
    const season = days ? ledger(SAMPLE_BED, ahead) : null;
    const past = !season ? ''
      : ` After ${Math.round(days)} days, ${Math.round(season.gone * 100)}% of
          the bed is gone — ${season.kept >= 0.6 ? `<em>most of it into the crop</em>`
           : season.kept <= 0.25 ? `<em>almost none into a crop</em>`
           : `<em>about half into the crop</em>`}.`;

    verdict.innerHTML = today + past;

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
  // The six letters on the face are the way in. They already carry the
  // reading, so they are the one place on the page that is unambiguously
  // ABOUT a nutrient — which makes them the right thing to click.
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
    const nutrient = NUTRIENTS.find(n => n.key === found.key);
    card.toggle(trigger, {
      ...found,
      name: nutrient.name,
      // The target belongs at the top, not buried at the bottom: it is the
      // denominator of the figure the reader just clicked on.
      meta: found.target ? `Target · ${found.target}` : '',
    });
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
