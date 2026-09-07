// ---------------------------------------------------------------------------
// PROSPECT — the concept drawing.
//
// A figure walks forward through a year. Beneath his feet are the stores,
// drawn as six bands of nutrition. Every band is in the same unit: how much
// of that one thing you have, against how much of it you need. One is the
// whole requirement.
//
// The ground he actually stands on is the LOWER ENVELOPE of the six. A larder
// is only ever as deep as the band that runs out first, so the floor belongs
// to whichever ribbon is lowest at that moment — and it changes hands through
// the year. Watch the colour of the ground: in autumn it is minerals, in
// early spring it is vitamin C.
//
// The path he walks is the requirement, and it CLIMBS THROUGH WINTER, because
// a cold body asks for more. So the hill and the shortage arrive together.
// Where the ground falls below the path there is nothing under him. That gap
// is the hungry gap, and here it is opened by vitamin C alone — the stores
// hold plenty of calories the entire way through.
//
// NOTHING HERE IS WIRED TO A SIMULATION. Every number below is a hand-drawn
// shape, chosen to look like the truth rather than computed from it. When the
// real systems exist they replace BANDS and need() and nothing else changes.
// ---------------------------------------------------------------------------

const W    = 1200;   // one year, in drawing units
const BASE = 470;    // where "nothing left" sits
const UNIT = 195;    // one whole requirement, in drawing units

const y = q => BASE - q * UNIT;

// The year runs midsummer to midsummer, so the hungry gap — which belongs to
// two calendar years at once — falls in one piece near the end of the walk
// instead of being cut in half by the edge of the picture.
const GRID = [0, 0.12, 0.25, 0.38, 0.50, 0.62, 0.70, 0.80, 0.90, 0.96, 1.00];

// Six bands. Not thirty-five: these are the ones that actually fail on a
// temperate holding. Fat and minerals are here to be FINE — a band that never
// threatens is what makes the one that does legible.
export const BANDS = [
  { key: 'energy',   label: 'Energy',    tone: '#E4B363',
    pts: [1.22, 1.12, 1.36, 1.62, 1.54, 1.44, 1.38, 1.28, 1.18, 1.20, 1.22] },
  { key: 'protein',  label: 'Protein',   tone: '#D4715A',
    pts: [1.30, 1.22, 1.34, 1.50, 1.44, 1.36, 1.30, 1.22, 1.16, 1.24, 1.30] },
  { key: 'fat',      label: 'Fat',       tone: '#E8C9A0',
    pts: [1.42, 1.36, 1.40, 1.58, 1.55, 1.50, 1.46, 1.40, 1.34, 1.38, 1.42] },
  { key: 'vit_a',    label: 'Vitamin A', tone: '#EE9A3A',
    pts: [1.34, 1.20, 1.42, 1.60, 1.52, 1.40, 1.32, 1.14, 1.06, 1.20, 1.34] },
  { key: 'minerals', label: 'Minerals',  tone: '#7FA8B8',
    pts: [1.26, 1.28, 1.32, 1.44, 1.38, 1.30, 1.24, 1.16, 1.10, 1.18, 1.26] },
  // The one that breaks. It keeps beautifully as sugar and starch and not at
  // all as vitamin C: the stores drain from midwinter and the first spring
  // greens put it back faster than anything else can.
  { key: 'vit_c',    label: 'Vitamin C', tone: '#7CC46B',
    pts: [1.58, 1.62, 1.52, 1.48, 1.38, 1.34, 1.05, 0.45, 0.62, 1.20, 1.58] },
];

// The requirement. Lowest in high summer, a fifth higher at midwinter — the
// hill. Written as a curve rather than control points because it is one idea
// and should stay one line.
export const need = u => 1.0 + 0.26 * (0.5 + 0.5 * Math.cos(2 * Math.PI * (u - 0.62)));

// ---------------------------------------------------------------------------
// Reading the shapes
// ---------------------------------------------------------------------------

function spline(p0, p1, p2, p3, t) {
  const t2 = t * t, t3 = t2 * t;
  return 0.5 * ((2 * p1) + (-p0 + p2) * t
    + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2
    + (-p0 + 3 * p1 - 3 * p2 + p3) * t3);
}

// Catmull-Rom through the control points, wrapping at the year boundary so
// the walk can loop without a seam.
function at(vals, u) {
  u = ((u % 1) + 1) % 1;
  let i = 0;
  while (i < GRID.length - 2 && u >= GRID[i + 1]) i++;
  const t = (u - GRID[i]) / (GRID[i + 1] - GRID[i]);
  const n = GRID.length - 1;
  return spline(vals[(i - 1 + n) % n], vals[i], vals[(i + 1) % n], vals[(i + 2) % n], t);
}

const STEP = 0.004;
const END  = 2 + STEP / 2;          // two years drawn, one year scrolled

function lowest(u) {
  let best = 0, bv = at(BANDS[0].pts, u);
  for (let i = 1; i < BANDS.length; i++) {
    const v = at(BANDS[i].pts, u);
    if (v < bv) { bv = v; best = i; }
  }
  return { i: best, v: bv };
}

export const underfoot = u => BANDS[lowest(u).i];

const px = (x, v) => `${(x * W).toFixed(1)} ${y(v).toFixed(1)}`;

function line(fn) {
  let d = '';
  for (let u = 0; u <= END; u += STEP) d += (d ? 'L' : 'M') + px(u, fn(u)) + ' ';
  return d.trim();
}

// The ground, cut into runs by whoever owns the floor. Each run carries its
// band's colour, so the change of hands is something you see rather than
// something you are told.
function runs() {
  const out = [];
  let run = null;
  for (let u = 0; u <= END; u += STEP) {
    const { i, v } = lowest(u);
    const pt = px(u, v);
    if (!run || run.i !== i) {
      if (run) run.d += 'L' + pt + ' ';       // meet the next run, no gap
      run = { i, d: 'M' + pt + ' ' };
      out.push(run);
    } else run.d += 'L' + pt + ' ';
  }
  return out;
}

// The two ways the ground and the path can disagree. Both are drawn out
// along one and back along the other, so the shape between them is the
// quantity itself — its AREA is person-days, of plenty or of hunger. Depth
// alone would lie: a fortnight at half rations and three days at none reach
// the same low point and are not the same year.
const shut = o => 'M' + o.a.join(' L') + ' L' + o.b.reverse().join(' L') + ' Z';

function spans(test, hi, lo) {
  const out = [];
  let open = null;
  for (let u = 0; u <= END; u += STEP) {
    if (test(u)) {
      if (!open) open = { a: [], b: [] };
      open.a.push(px(u, hi(u)));
      open.b.push(px(u, lo(u)));
    } else if (open) { out.push(shut(open)); open = null; }
  }
  if (open) out.push(shut(open));
  return out;
}

const floorOf = u => lowest(u).v;
const gaps    = () => spans(u => floorOf(u) <  need(u), need, floorOf);
const surplus = () => spans(u => floorOf(u) >= need(u), floorOf, need);

// ---------------------------------------------------------------------------
// The furniture of the year
// ---------------------------------------------------------------------------

const SUN = `<circle r="7" class="pr-glyph"/>` +
  [0, 45, 90, 135, 180, 225, 270, 315].map(a =>
    `<line x1="0" y1="-11" x2="0" y2="-15" class="pr-glyph" transform="rotate(${a})"/>`).join('');

const LEAF = `<path d="M0 -11C7 -7 8 3 0 11C-8 3 -7 -7 0 -11Z" class="pr-glyph"/>` +
  `<line x1="0" y1="-7" x2="0" y2="10" class="pr-glyph"/>`;

const FLAKE = [0, 60, 120].map(a => `<g transform="rotate(${a})">
      <line x1="0" y1="-12" x2="0" y2="12" class="pr-glyph"/>
      <line x1="0" y1="-12" x2="-4" y2="-8" class="pr-glyph"/>
      <line x1="0" y1="-12" x2="4" y2="-8" class="pr-glyph"/>
      <line x1="0" y1="12" x2="-4" y2="8" class="pr-glyph"/>
      <line x1="0" y1="12" x2="4" y2="8" class="pr-glyph"/>
    </g>`).join('');

const SPROUT = `<line x1="0" y1="12" x2="0" y2="-4" class="pr-glyph"/>` +
  `<path d="M0 0C-5 -2 -9 -6 -9 -11C-4 -11 -1 -6 0 0Z" class="pr-glyph"/>` +
  `<path d="M0 -3C5 -5 9 -9 9 -14C4 -14 1 -9 0 -3Z" class="pr-glyph"/>`;

const SEASONS = [
  { u: 0.06, glyph: SUN,    label: 'high summer'  },
  { u: 0.31, glyph: LEAF,   label: 'harvest'      },
  { u: 0.58, glyph: FLAKE,  label: 'deep winter'  },
  // Not a season — the thing that ENDS the gap. It belongs at the far side
  // of the hole, not in the middle of it.
  { u: 0.93, glyph: SPROUT, label: 'first greens' },
];

// Thirteen moons to the year. They are the tick marks — weeks without a
// gridline, and the only clock this drawing needs.
function moons() {
  let s = '';
  for (let k = 0; k < 26; k++) {
    const cx = (k / 13) * W, cy = 112, r = 4.5;
    const phase = (k % 13) / 13;
    const flat = Math.abs(Math.cos(phase * 2 * Math.PI)) * r;
    const outer = phase < 0.5 ? 1 : 0;
    const inner = Math.cos(phase * 2 * Math.PI) > 0
      ? (phase < 0.5 ? 0 : 1) : (phase < 0.5 ? 1 : 0);
    s += `<circle cx="${cx.toFixed(1)}" cy="${cy}" r="${r}" class="pr-moon-o"/>`
      + `<path class="pr-moon-f" d="M${cx.toFixed(1)} ${cy - r}A${r} ${r} 0 0 ${outer} `
      + `${cx.toFixed(1)} ${cy + r}A${flat.toFixed(2)} ${r} 0 0 ${inner} ${cx.toFixed(1)} ${cy - r}Z"/>`;
  }
  return s;
}

// The walker. Straight limbs on purpose — this is the figure from the napkin,
// not a character.
const WALKER = `
  <g class="pr-walker">
   <g transform="scale(1.3)">
    <g class="pr-bob">
      <circle cx="0" cy="-52" r="7.5" class="pr-fig"/>
      <line x1="0" y1="-44" x2="0" y2="-22" class="pr-fig"/>
      <g class="pr-arm-b" transform="translate(0 -40)"><line x1="0" y1="0" x2="0" y2="17" class="pr-fig"/></g>
      <g class="pr-leg-b" transform="translate(0 -22)"><line x1="0" y1="0" x2="0" y2="22" class="pr-fig"/></g>
      <g class="pr-arm-f" transform="translate(0 -40)"><line x1="0" y1="0" x2="0" y2="17" class="pr-fig"/></g>
      <g class="pr-leg-f" transform="translate(0 -22)"><line x1="0" y1="0" x2="0" y2="22" class="pr-fig"/></g>
    </g>
   </g>
  </g>`;

// ---------------------------------------------------------------------------
// The drawing
// ---------------------------------------------------------------------------

export function prospectSVG() {
  const ground = line(u => lowest(u).v);
  const path   = line(need);

  const world = SEASONS.flatMap(s => [s.u, s.u + 1].map(u => `
      <g transform="translate(${(u * W).toFixed(1)} 54)">${s.glyph}
        <text y="32" class="pr-season">${s.label}</text>
      </g>`)).join('');

  return `
  <svg class="pr-svg" viewBox="0 0 ${W} 440" role="img"
       aria-label="A figure walks a year. Six bands of nutrition run beneath him; the ground is the lowest of them. In late winter the vitamin C band drops away and opens a gap under his feet.">
    <defs>
      <pattern id="pr-hatch" width="7" height="7" patternTransform="rotate(45)"
               patternUnits="userSpaceOnUse">
        <line x1="0" y1="0" x2="0" y2="7" class="pr-hatch-line"/>
      </pattern>
      <clipPath id="pr-frame"><rect x="0" y="0" width="${W}" height="440"/></clipPath>
    </defs>

    <g clip-path="url(#pr-frame)">
      <g class="pr-world">
        ${world}
        ${moons()}

        <!-- the stores, as a solid mass -->
        <path class="pr-fill" d="${ground} L${(2 * W).toFixed(1)} 440 L0 440 Z"/>

        <!-- everything you have over what you need: the feast, and the
             thing he wades through when the year is going well -->
        ${surplus().map(d => `<path class="pr-surplus" d="${d}"/>`).join('')}

        <!-- the five that are not the floor -->
        ${BANDS.map(b => `<path class="pr-band" style="stroke:${b.tone}"
          d="${line(u => at(b.pts, u))}"/>`).join('')}

        <!-- nothing under him -->
        ${gaps().map(d => `<path class="pr-gap" d="${d}"/>`).join('')}

        <!-- and the floor itself, laid over the hole so it keeps its colour -->
        ${runs().map(r => `<path class="pr-floor" style="stroke:${BANDS[r.i].tone}"
          d="${r.d.trim()}"/>`).join('')}

        <!-- the requirement: the line he walks -->
        <path class="pr-need" d="${path}"/>
      </g>

      ${WALKER}

      <text class="pr-mark pr-feast"  x="${W - 24}">FEAST</text>
      <text class="pr-mark pr-famine" x="${W - 24}">FAMINE</text>
      <text class="pr-under" x="24" y="34">underfoot — <tspan class="pr-under-v"></tspan></text>
    </g>
  </svg>`;
}

// ---------------------------------------------------------------------------
// The walk
// ---------------------------------------------------------------------------

const YEAR   = 64000;   // ms for one turn of the year — a slow read, not a demo
const STRIDE = 1150;    // ms for one full pace
const STAND  = 300;     // where he stands, in drawing units

export function runProspect(root) {
  const q = s => root.querySelector(s);
  const world = q('.pr-world'), walker = q('.pr-walker'), bob = q('.pr-bob');
  const legF = q('.pr-leg-f'), legB = q('.pr-leg-b');
  const armF = q('.pr-arm-f'), armB = q('.pr-arm-b');
  const feast = q('.pr-feast'), famine = q('.pr-famine'), under = q('.pr-under-v');
  if (!world) return () => {};

  let raf = null, t0 = null, was = null;

  function draw(elapsed) {
    const s = ((elapsed / YEAR) % 1) * W;
    world.setAttribute('transform', `translate(${(-s).toFixed(2)} 0)`);

    const u = (STAND + s) / W;
    walker.setAttribute('transform', `translate(${STAND} ${y(need(u)).toFixed(2)})`);

    const ph = (elapsed % STRIDE) / STRIDE * Math.PI * 2;
    const swing = Math.sin(ph) * 24;
    legF.setAttribute('transform', `translate(0 -22) rotate(${swing.toFixed(1)})`);
    legB.setAttribute('transform', `translate(0 -22) rotate(${(-swing).toFixed(1)})`);
    armF.setAttribute('transform', `translate(0 -40) rotate(${(-swing * 0.85).toFixed(1)})`);
    armB.setAttribute('transform', `translate(0 -40) rotate(${(swing * 0.85).toFixed(1)})`);
    // Two rises to the pace: the body lifts over each leg, not each stride.
    bob.setAttribute('transform', `translate(0 ${(Math.abs(Math.cos(ph)) * -2).toFixed(2)})`);

    // The labels ride the line they name, at the far edge of the frame.
    const ru = (W - 24 + s) / W, ry = y(need(ru));
    feast.setAttribute('y', (ry - 19).toFixed(1));
    famine.setAttribute('y', (ry + 28).toFixed(1));

    const band = underfoot(u);
    if (band !== was) {
      was = band;
      under.textContent = band.label.toLowerCase();
      under.setAttribute('fill', band.tone);
    }
  }

  // Still frame for anyone who has asked the machine to hold quiet: parked in
  // the gap, which is the one moment worth stopping on anyway.
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
    draw(YEAR * 0.55);
    return () => {};
  }

  function frame(now) {
    if (t0 === null) t0 = now;
    draw(now - t0);
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);

  return () => cancelAnimationFrame(raf);
}
