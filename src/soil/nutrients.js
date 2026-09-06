// ---------------------------------------------------------------------------
// NUTRIENT AVAILABILITY
//
// What the soil holds is not what the plant gets. This file is the difference.
//
// A nutrient has a RESERVE — how much is actually down there — and a set of
// RINGS around it, each of which decides what fraction of that reserve a root
// can reach. pH, temperature, moisture.
//
// Rings compose by multiplication:
//
//     available = reserve × ph × temperature × moisture
//
// which is deliberate. It makes the order irrelevant, it lets any single ring
// veto the result on its own (Liebig's law of the minimum — a plant grows to
// its scarcest input, not its average one), and it means adding a ring is
// appending one object to the list below.
//
// But multiplication assumes the rings are independent, and they are not.
// Waterlogging an acid soil does something neither does alone. So after the
// rings there is a short list of COUPLINGS: named, deliberate exceptions,
// each one a claim you could defend. Keeping them in one visible list is the
// whole trick — the rings stay pure, and every piece of cross-talk lives
// somewhere you can read it.
//
// Like the engine, this file never touches the page.
// ---------------------------------------------------------------------------

// The six macronutrients, clockwise from the top of the chart.
export const NUTRIENTS = [
  { key: 'N',  symbol: 'N',  name: 'Nitrogen'   },
  { key: 'S',  symbol: 'S',  name: 'Sulfur'     },
  { key: 'K',  symbol: 'K',  name: 'Potassium'  },
  { key: 'Ca', symbol: 'Ca', name: 'Calcium'    },
  { key: 'P',  symbol: 'P',  name: 'Phosphorus' },
  { key: 'Mg', symbol: 'Mg', name: 'Magnesium'  },
];

// Straight-line interpolation between control points, flat outside them.
function curve(points, x) {
  if (x <= points[0][0]) return points[0][1];
  const last = points[points.length - 1];
  if (x >= last[0]) return last[1];
  for (let i = 1; i < points.length; i++) {
    const [x1, y1] = points[i];
    if (x <= x1) {
      const [x0, y0] = points[i - 1];
      return y0 + (y1 - y0) * (x - x0) / (x1 - x0);
    }
  }
  return last[1];
}

// ---------------------------------------------------------------------------
// pH — control points of [pH, fraction reachable].
//
// These follow the Truog-style availability bands (1946) that every soil
// textbook reprints — a teaching standard, not a measurement of any particular
// soil. Real availability also turns on mineralogy, organic matter and what
// the microbes are doing.
//
// The shapes differ on purpose, and the difference IS the point:
//
//   P  the narrowest window on the chart. Iron and aluminium lock it up in
//      acid soil, calcium locks it up in alkaline soil. Squeezed from both
//      sides, it peaks around 6.5 and falls away fast.
//   N  and S depend on bacteria doing the converting, and those bacteria
//      stall in acid ground.
//   K  is the forgiving one — broadly available almost everywhere.
//   Ca and Mg run the other way from phosphorus: they get MORE available as
//      the soil turns alkaline.
//
// So an acid soil collapses the whole polygon except potassium, while an
// alkaline soil takes out phosphorus alone and leaves the rest. The chart
// changes shape rather than just size, which is the thing worth seeing.
//
// The curves run the full 0–14 because that is the scale. Past roughly 3 and
// 11 the numbers stop describing agronomy and start describing a chemistry
// accident, so they fall to nothing.
// ---------------------------------------------------------------------------
const PH_CURVES = {
  N:  [[0.0, 0.00], [3.0, 0.04],
       [4.5, 0.12], [5.0, 0.22], [5.5, 0.42], [6.0, 0.72], [6.5, 0.92],
       [7.0, 1.00], [7.5, 1.00], [8.0, 0.95], [8.5, 0.85], [9.0, 0.72],
       [10.0, 0.45], [11.0, 0.20], [12.0, 0.06], [14.0, 0.00]],

  P:  [[0.0, 0.00], [3.0, 0.04],
       [4.5, 0.12], [5.0, 0.22], [5.5, 0.42], [6.0, 0.75], [6.5, 1.00],
       [7.0, 0.92], [7.5, 0.62], [8.0, 0.40], [8.5, 0.28], [9.0, 0.20],
       [10.0, 0.14], [11.0, 0.08], [12.0, 0.03], [14.0, 0.00]],

  K:  [[0.0, 0.00], [3.0, 0.12],
       [4.5, 0.35], [5.0, 0.50], [5.5, 0.68], [6.0, 0.85], [6.5, 0.95],
       [7.0, 1.00], [7.5, 1.00], [8.0, 1.00], [8.5, 0.97], [9.0, 0.93],
       [10.0, 0.72], [11.0, 0.45], [12.0, 0.18], [14.0, 0.00]],

  S:  [[0.0, 0.00], [3.0, 0.08],
       [4.5, 0.28], [5.0, 0.40], [5.5, 0.58], [6.0, 0.80], [6.5, 0.93],
       [7.0, 1.00], [7.5, 1.00], [8.0, 1.00], [8.5, 0.95], [9.0, 0.90],
       [10.0, 0.66], [11.0, 0.38], [12.0, 0.14], [14.0, 0.00]],

  Ca: [[0.0, 0.00], [3.0, 0.03],
       [4.5, 0.10], [5.0, 0.18], [5.5, 0.32], [6.0, 0.52], [6.5, 0.70],
       [7.0, 0.86], [7.5, 0.96], [8.0, 1.00], [8.5, 1.00], [9.0, 0.98],
       [10.0, 0.85], [11.0, 0.55], [12.0, 0.22], [14.0, 0.00]],

  Mg: [[0.0, 0.00], [3.0, 0.04],
       [4.5, 0.12], [5.0, 0.22], [5.5, 0.38], [6.0, 0.58], [6.5, 0.75],
       [7.0, 0.90], [7.5, 0.98], [8.0, 1.00], [8.5, 0.98], [9.0, 0.95],
       [10.0, 0.80], [11.0, 0.50], [12.0, 0.20], [14.0, 0.00]],
};

// ---------------------------------------------------------------------------
// TEMPERATURE — soil temperature in °C.
//
// One curve folding two things together: how fast the microbes supply a
// nutrient, and how well a root can take it up. Both stall in the cold, and
// the microbial half is the steeper of the two — hence the Q10 rule of thumb,
// that biological rates roughly double per 10°C.
//
// So the ordering is by how biological each nutrient's supply is:
//
//   N, S  are released by bacteria. Cold soil doesn't hold them back, it
//         stops making them available in the first place. Steepest curves.
//   P     is partly microbial, partly diffusion — and diffusion is slow and
//         temperature-sensitive too. Middling.
//   K, Ca, Mg arrive largely by mass flow with the water a plant is already
//         drinking. Least dependent on anything being alive, so the flattest
//         curves — though root uptake is active transport, so even these
//         fade in cold ground.
//
// The high end is the plant's limit rather than the soil's: past about 30°C
// root function declines and organic matter burns off faster than it builds.
// ---------------------------------------------------------------------------
const TEMP_CURVES = {
  N:  [[0, 0.04], [5, 0.14], [10, 0.36], [15, 0.70], [18, 0.90],
       [22, 1.00], [26, 1.00], [30, 0.95], [35, 0.72], [40, 0.42]],

  S:  [[0, 0.06], [5, 0.18], [10, 0.42], [15, 0.74], [18, 0.92],
       [22, 1.00], [26, 1.00], [30, 0.96], [35, 0.76], [40, 0.48]],

  P:  [[0, 0.22], [5, 0.36], [10, 0.58], [15, 0.80], [18, 0.92],
       [22, 1.00], [26, 1.00], [30, 0.97], [35, 0.86], [40, 0.70]],

  K:  [[0, 0.42], [5, 0.54], [10, 0.70], [15, 0.86], [18, 0.95],
       [22, 1.00], [26, 1.00], [30, 0.98], [35, 0.90], [40, 0.78]],

  Ca: [[0, 0.40], [5, 0.52], [10, 0.68], [15, 0.85], [18, 0.94],
       [22, 1.00], [26, 1.00], [30, 0.98], [35, 0.90], [40, 0.76]],

  Mg: [[0, 0.40], [5, 0.52], [10, 0.68], [15, 0.85], [18, 0.94],
       [22, 1.00], [26, 1.00], [30, 0.98], [35, 0.90], [40, 0.76]],
};

// ---------------------------------------------------------------------------
// MOISTURE — percent of plant-available water.
//
// Three real landmarks on this scale: 0 is the WILTING POINT, 100 is FIELD
// CAPACITY, and about 150 is SATURATION. Field capacity is what the soil
// still holds once gravity has finished draining it.
//
// Every curve is an inverted U, and the two ends fail for opposite reasons:
//
//   too dry  nutrients cannot MOVE. Everything reaches a root by mass flow
//            or by diffusing through films of water. No water, no delivery,
//            however full the soil is.
//   too wet  roots cannot PUMP. Uptake is active transport, it costs ATP,
//            ATP costs oxygen, and saturated pores have none. A drowned
//            plant starves in a soil that is full.
//
// The wet end is where they stop agreeing:
//
//   N  falls off a cliff. Without oxygen, nitrification stops AND denitrifying
//      bacteria start breathing nitrate off as N₂ and N₂O gas. That nitrogen
//      has not been locked up, it has left.
//   S  suffers similarly as sulfate reduces to sulfide.
//   P  barely cares, and in acid ground it actually improves — see COUPLINGS.
// ---------------------------------------------------------------------------
const MOISTURE_CURVES = {
  N:  [[0, 0.04], [15, 0.22], [30, 0.52], [50, 0.80], [70, 0.96], [90, 1.00],
       [105, 0.88], [120, 0.58], [135, 0.28], [150, 0.10]],

  S:  [[0, 0.05], [15, 0.24], [30, 0.54], [50, 0.82], [70, 0.97], [90, 1.00],
       [105, 0.92], [120, 0.68], [135, 0.40], [150, 0.18]],

  P:  [[0, 0.06], [15, 0.26], [30, 0.56], [50, 0.84], [70, 0.98], [90, 1.00],
       [105, 0.98], [120, 0.90], [135, 0.78], [150, 0.66]],

  K:  [[0, 0.05], [15, 0.25], [30, 0.55], [50, 0.82], [70, 0.97], [90, 1.00],
       [105, 0.96], [120, 0.80], [135, 0.55], [150, 0.32]],

  Ca: [[0, 0.05], [15, 0.25], [30, 0.55], [50, 0.82], [70, 0.97], [90, 1.00],
       [105, 0.96], [120, 0.80], [135, 0.55], [150, 0.32]],

  Mg: [[0, 0.05], [15, 0.25], [30, 0.55], [50, 0.82], [70, 0.97], [90, 1.00],
       [105, 0.96], [120, 0.80], [135, 0.55], [150, 0.32]],
};

// ---------------------------------------------------------------------------
// RINGS — the environment, one dial each.
//
// Each declares its range, where the good ground is, how it colours itself,
// what to call each region, and one function: given a nutrient and the dial's
// value, what fraction gets through?
//
// The IDEAL OF EVERY RING IS THE MIDDLE OF ITS RANGE. That is what lets the
// scene put each range's midpoint at each arc's midpoint, so three markers at
// their sweet spots make an equilateral triangle. If you add a ring, centre
// its range on its ideal or the geometry stops meaning anything.
// ---------------------------------------------------------------------------
export const RINGS = [
  {
    key: 'ph',
    label: 'pH',      // short, for the dial
    noun:  'pH',      // for prose: "… is what's holding it"

    // The whole scale, not the gardening slice of it. Over 0–14 the midpoint
    // lands on 7.0, so the middle of the arc is chemical neutrality exactly.
    min: 0,
    max: 14,
    start: 6.5,
    step: 0.1,
    // The band a vegetable bed wants, which is not quite the same as the band
    // a chemist would call neutral. Sits a hair left of the arc's midpoint.
    sweet: [6.0, 7.0],
    ticks: [0, 2, 4, 6, 7, 8, 10, 12, 14],
    format: v => v.toFixed(1),

    // The USDA/NRCS soil reaction classes. Chemically, neutral is 7.0 and
    // everything below is acid — so 6.5 is acid, full stop. But a scale with
    // three words puts pH 6.5 and pH 4.0 in the same bucket, which is true
    // and useless: one is a fine vegetable bed, the other kills what you
    // plant in it. "Slightly acid" says both things at once.
    zones: [
      { upTo: 3.4,      label: 'ultra acid'             },
      { upTo: 4.4,      label: 'extremely acid'         },
      { upTo: 5.0,      label: 'very strongly acid'     },
      { upTo: 5.5,      label: 'strongly acid'          },
      { upTo: 6.0,      label: 'moderately acid'        },
      { upTo: 6.5,      label: 'slightly acid'          },
      { upTo: 7.3,      label: 'neutral'                },
      { upTo: 7.8,      label: 'slightly alkaline'      },
      { upTo: 8.4,      label: 'moderately alkaline'    },
      { upTo: 9.0,      label: 'strongly alkaline'      },
      { upTo: Infinity, label: 'very strongly alkaline' },
    ],

    // Universal-indicator order — acid red through neutral green to alkaline
    // violet — pulled down in saturation so it belongs to this site rather
    // than to a chemistry catalogue.
    ramp: [
      [0.0,  'hsl(348, 60%, 46%)'],
      [2.0,  'hsl(0, 62%, 50%)'],
      [4.0,  'hsl(26, 62%, 52%)'],
      [6.0,  'hsl(52, 56%, 50%)'],
      [6.5,  'hsl(88, 46%, 46%)'],
      [7.0,  'hsl(140, 42%, 44%)'],
      [8.0,  'hsl(185, 45%, 47%)'],
      [9.0,  'hsl(215, 48%, 52%)'],
      [11.0, 'hsl(252, 42%, 54%)'],
      [12.5, 'hsl(280, 38%, 50%)'],
      [14.0, 'hsl(300, 34%, 42%)'],
    ],

    effect: (nutrient, v) => curve(PH_CURVES[nutrient], v),

    // A list rather than a function so the page can lay every line out at
    // once and reserve the tallest — text that changes length as you drag
    // would resize the document and make the page twitch under your hand.
    notes: [
      { upTo: 3.4, text: 'Past soil chemistry. Acid this strong strips the exchange sites bare and dissolves the minerals themselves — no root, no fungus, no bacterium works here.' },
      { upTo: 5.5, text: 'Acid ground. Aluminium and iron are holding the phosphorus, and the bacteria that free up nitrogen and sulfur have stalled.' },
      { upTo: 6.0, text: 'A little sour. Phosphorus is starting to lock away, and calcium and magnesium are scarce.' },
      { upTo: 7.3, text: 'The working range for pH. Nothing is locked out; nothing is at its limit.' },
      { upTo: 7.8, text: 'Turning alkaline. Calcium and magnesium are freely available, but phosphorus is beginning to bind to them.' },
      { upTo: 9.0, text: 'Alkaline. Calcium has taken the phosphorus out of reach — the reserve is still there, the plant just cannot get at it.' },
      { upTo: Infinity, text: 'Beyond soil. Ground this alkaline disperses its own structure: the clay slumps, the pores close, and what little is left cannot move to a root anyway.' },
    ],
  },

  {
    key: 'temp',
    label: 'Soil',
    noun:  'temperature',

    min: 0,
    max: 40,
    start: 20,
    step: 0.5,
    sweet: [15, 25],
    ticks: [0, 10, 20, 30, 40],
    format: v => `${v.toFixed(0)}°C`,

    zones: [
      { upTo: 4,        label: 'near freezing' },
      { upTo: 10,       label: 'cold'          },
      { upTo: 15,       label: 'cool'          },
      { upTo: 25,       label: 'warm'          },
      { upTo: 32,       label: 'hot'           },
      { upTo: Infinity, label: 'baking'        },
    ],

    // Two poles and nothing else: cold blue to hot red, through a quiet
    // neutral at the middle. No green — pH owns the full spectrum on this
    // face, and a second rainbow would just compete with it. A temperature
    // scale that runs blue to red needs no explaining at all.
    ramp: [
      [0,  'hsl(206, 58%, 50%)'],
      [8,  'hsl(198, 44%, 55%)'],
      [16, 'hsl(38, 22%, 62%)'],
      [22, 'hsl(32, 30%, 60%)'],
      [28, 'hsl(24, 56%, 56%)'],
      [34, 'hsl(12, 62%, 52%)'],
      [40, 'hsl(2, 66%, 48%)'],
    ],

    effect: (nutrient, v) => curve(TEMP_CURVES[nutrient], v),

    notes: [
      { upTo: 4,  text: 'Cold ground. Nothing is locked away — nothing is being released. The bacteria that free nitrogen and sulfur have simply stopped, and roots have stopped drinking.' },
      { upTo: 10, text: 'Cold enough to matter. Mineralisation is crawling, so nitrogen and sulfur arrive slowly however much organic matter is waiting.' },
      { upTo: 15, text: 'Cool. Everything works, just slower — this is why an early planting sits and sulks in a soil that will race in a month.' },
      { upTo: 25, text: 'The working range for temperature. Microbes are releasing and roots are drinking at close to full rate.' },
      { upTo: 32, text: 'Hot. Roots are past their best and organic matter is burning off faster than it is being built.' },
      { upTo: Infinity, text: 'Too hot. Root function is failing and the soil is spending its own carbon reserves to do it.' },
    ],
  },

  {
    key: 'moisture',
    label: 'Water',
    noun:  'water',

    // Percent of plant-available water. 0 is the wilting point, 100 is field
    // capacity, 150 is saturation — so the midpoint, 75, is the middle of the
    // range a bed actually wants, and field capacity sits just to the wet side
    // of it, which is right: at field capacity you are good and a touch damp.
    min: 0,
    max: 150,
    start: 75,
    step: 1,
    sweet: [50, 100],
    ticks: [0, 25, 50, 75, 100, 125, 150],
    format: v => `${v.toFixed(0)}%`,

    zones: [
      { upTo: 10,       label: 'at wilting point' },
      { upTo: 40,       label: 'droughty'         },
      { upTo: 55,       label: 'drying'           },
      { upTo: 105,      label: 'moist'            },
      { upTo: 125,      label: 'wet'              },
      { upTo: Infinity, label: 'waterlogged'      },
    ],

    // Dry dust to standing water: a greyish tan at the wilting point,
    // deepening through teal to a dark blue at saturation. One direction,
    // no spectrum — the reading is "how much water", and the colour should
    // say only that.
    ramp: [
      [0,   'hsl(36, 16%, 58%)'],
      [40,  'hsl(40, 20%, 57%)'],
      [70,  'hsl(178, 26%, 52%)'],
      [100, 'hsl(196, 42%, 48%)'],
      [125, 'hsl(210, 48%, 40%)'],
      [150, 'hsl(224, 52%, 30%)'],
    ],

    effect: (nutrient, v) => curve(MOISTURE_CURVES[nutrient], v),

    notes: [
      { upTo: 10,  text: 'At the wilting point. There is no film of water left to carry anything to a root, so a soil full of nutrients delivers none of them.' },
      { upTo: 40,  text: 'Droughty. Mass flow has slowed to nothing and diffusion is doing all the work, which it does badly.' },
      { upTo: 55,  text: 'Drying out. Delivery is falling off before the plant shows you anything is wrong.' },
      { upTo: 105, text: 'The working range for water. Enough to carry nutrients, enough air left in the pores for roots to breathe.' },
      { upTo: 125, text: 'Wet. Air is leaving the pores, and root uptake costs oxygen — so the plant is starting to starve in a full soil.' },
      { upTo: Infinity, text: 'Waterlogged. Anaerobic now: nitrification has stopped and nitrogen is gassing off, while roots suffocate and stop drinking altogether.' },
    ],
  },
];

// ---------------------------------------------------------------------------
// COUPLINGS — where the rings stop being independent.
//
// Multiplication can only ever make things worse, and that is not always the
// truth. Each entry here is a specific, defensible claim about two conditions
// meeting, applied after the rings. A factor above 1 means a condition FREES
// something, which is why the composition clamps at the reserve: you can
// never take out more than is in there.
//
// Keep this list short. Every entry is an assertion someone could check.
// ---------------------------------------------------------------------------
export const COUPLINGS = [
  {
    key: 'wet-acid',
    when: v => v.moisture > 105 && v.ph < 6.0,
    text: 'Waterlogged AND acid — and these do not simply add up. Nitrogen is gassing off as the soil goes anaerobic. But the same lack of oxygen reduces iron from Fe³⁺ to Fe²⁺, and the iron lets go of the phosphate it was holding: phosphorus actually rises. This is a large part of why flooded rice paddies work.',
    effect: { N: 0.45, S: 0.65, P: 1.70 },
  },
  {
    key: 'wet-warm',
    when: v => v.moisture > 110 && v.temp > 22,
    text: 'Warm and waterlogged, and the warmth is the problem. Denitrifying bacteria are fastest in warm ground, and what they do is breathe nitrate off as N₂ and N₂O gas. A cold wet soil reads lower than this one, but for the opposite reason — it never released its nitrogen at all. Here the soil had it and lost it.',
    effect: { N: 0.40 },
  },
];

// ---------------------------------------------------------------------------
// What is actually down there.
//
// Fixed for now — a decent, unremarkable garden bed. This is the hook for the
// rest of the game: when the Physical and Biological chapters produce a real
// soil, they hand their result in here and the chart reads it.
// ---------------------------------------------------------------------------
export const SAMPLE_BED = {
  N: 0.72, S: 0.80, K: 0.86, Ca: 0.90, P: 0.78, Mg: 0.82,
};

// ---------------------------------------------------------------------------
// TIME — what leaves, and where it goes.
//
// The rings say what a plant can REACH today. This says what is still there in
// six weeks, and the difference between those two questions is the whole point
// of the season track.
//
// Nutrients leave a soil by two doors, and they look identical on a falling
// number:
//
//   UPTAKE  into the crop. This is fastest when conditions are BEST, because
//           something is actually growing. A bed at its ideal drains nitrogen
//           quickest of all — and that nitrogen became food.
//   WASTE   into the water table and the sky. Nitrate leaches (nothing holds
//           an anion), denitrifying bacteria gas it off when waterlogged,
//           ammonia volatilises off alkaline ground. Nothing to show for it.
//
// Same curve down, opposite meaning. Keeping them apart is what stops "your
// soil is emptying" from reading as a failure when it is a harvest.
//
// A caution worth keeping: the availability curves above rest on a textbook
// standard. These rates do not. How fast nitrogen actually leaves a soil turns
// on rainfall, texture, crop and form far more than availability does — so
// these are round numbers chosen to behave right, not measurements. Coarse on
// purpose.
// ---------------------------------------------------------------------------

// Half-life in days at FULL growth: what a thriving crop removes.
const UPTAKE_HALFLIFE = { N: 70, S: 200, K: 90, Ca: 340, P: 260, Mg: 380 };

// Half-life in days under neutral conditions: the background trickle away.
const WASTE_HALFLIFE  = { N: 220, S: 240, K: 500, Ca: 1100, P: 4000, Mg: 950 };

// How much a nutrient moves when water moves. Anions ride straight down with
// the drainage; cations are held on the exchange sites and go slowly.
// Phosphorus barely moves at all — it gets fixed in place, not washed away.
const MOBILITY = { N: 1.0, S: 0.85, K: 0.45, Ca: 0.25, P: 0.05, Mg: 0.30 };

const LN2 = Math.LN2;
const clamp01 = x => Math.min(1, Math.max(0, x));

/** How hard this soil is leaching, and how much of it reaches each nutrient. */
function wasteRate(key, values) {
  // Leaching needs water to spare. Below field capacity there is none.
  const excess = clamp01((values.moisture - 95) / 55);
  let m = 1 + 6 * excess * MOBILITY[key];

  if (key === 'N') {
    // Denitrification: anaerobic AND warm. The bacteria doing it are
    // themselves fastest in warm ground, so heat makes this worse, not better.
    m *= 1 + 5 * clamp01((values.moisture - 105) / 45) * clamp01((values.temp - 10) / 20);
    // Ammonia off an alkaline surface.
    m *= 1 + 2 * clamp01((values.ph - 7.5) / 2);
  }
  return (LN2 / WASTE_HALFLIFE[key]) * m;
}

/**
 * Where these reserves would be after `days` of holding these conditions.
 *
 * A projection, not a history: it answers "if you left it like this", which is
 * what makes the track scrubbable in both directions. A real history would
 * depend on where the dials had been along the way, and the page does not
 * know that.
 *
 * @returns { reserves, uptake, waste } — the last two are what LEFT, per
 *          nutrient, split by which door it went out of.
 */
export function project(reserves, values, days, rings = RINGS, couplings = COUPLINGS) {
  const out = { reserves: {}, uptake: {}, waste: {} };
  if (!days) {
    for (const n of NUTRIENTS) {
      out.reserves[n.key] = reserves[n.key] ?? 0;
      out.uptake[n.key] = 0;
      out.waste[n.key] = 0;
    }
    return out;
  }

  // Liebig again: the crop grows at the rate of its scarcest input, so a bed
  // held back by nitrogen removes little of anything else.
  const today = evaluate(reserves, values, rings, couplings).rows;
  const growth = today.reduce((lo, r) => Math.min(lo, r.available), 1);

  for (const n of NUTRIENTS) {
    const held = reserves[n.key] ?? 0;
    const kUp  = (LN2 / UPTAKE_HALFLIFE[n.key]) * growth;
    const kOut = wasteRate(n.key, values);
    const k    = kUp + kOut;

    const left = held * Math.exp(-k * days);
    const lost = held - left;
    const share = k > 0 ? kUp / k : 0;

    out.reserves[n.key] = left;
    out.uptake[n.key]   = lost * share;
    out.waste[n.key]    = lost * (1 - share);
  }
  return out;
}

// ---------------------------------------------------------------------------
// THE SEASON TRACK
//
// Ring-shaped so the dial component can draw it, but it is NOT in RINGS: it
// changes nothing about availability. It is a clock, and the sun riding it is
// the marker.
//
// Ninety days at one lunation per 29 of them means about three moons cross the
// track end to end, which is a very old way of saying a season.
// ---------------------------------------------------------------------------
export const SEASON = {
  key: 'days',
  label: 'Day',
  noun: 'time',
  min: 0,
  max: 90,
  start: 0,
  step: 1,
  ticks: [0, 30, 60, 90],
  format: v => v.toFixed(0),
  zones: [
    { upTo: 0,        label: 'today'      },
    { upTo: 21,       label: 'three weeks' },
    { upTo: 45,       label: 'six weeks'  },
    { upTo: 70,       label: 'ten weeks'  },
    { upTo: Infinity, label: 'a season'   },
  ],
  // Quiet: this track is a path for the sun, not another reading to compare.
  ramp: [
    [0,  'hsl(38, 20%, 46%)'],
    [45, 'hsl(38, 14%, 40%)'],
    [90, 'hsl(220, 16%, 38%)'],
  ],
};

/** Index of the note that applies at this value. */
export function noteIndex(ring, value) {
  return ring.notes.findIndex(n => value <= n.upTo);
}

/** The name of the region a value falls in, or '' if the ring has no regions. */
export function zoneLabel(ring, value) {
  return ring.zones?.find(z => value <= z.upTo)?.label ?? '';
}

/**
 * Run the reserves through every ring, then through whichever couplings fire.
 *
 * @param reserves  { N, P, K, Ca, Mg, S } each 0–1
 * @param values    { ph, temp, moisture } current dial positions
 * @returns { rows, fired }
 *          rows  — { key, symbol, name, reserve, available, factor, factors }
 *                  where `factors` is the per-ring breakdown, which is what
 *                  lets the page say WHICH dial is doing the damage.
 *          fired — the couplings currently in effect.
 */
export function evaluate(reserves, values, rings = RINGS, couplings = COUPLINGS) {
  const fired = couplings.filter(c => c.when(values));

  const rows = NUTRIENTS.map(n => {
    const factors = {};
    let factor = 1;

    for (const ring of rings) {
      const v = values[ring.key];
      const f = v === undefined ? 1 : ring.effect(n.key, v);
      factors[ring.key] = f;
      factor *= f;
    }
    for (const c of fired) factor *= (c.effect[n.key] ?? 1);

    const reserve = reserves[n.key] ?? 0;
    // Clamped: a coupling can free what a ring was holding, but nothing can
    // conjure more than the soil has.
    return { ...n, reserve, factors, factor,
             available: Math.min(reserve, reserve * factor) };
  });

  return { rows, fired };
}

/** True when every ring sits inside its own target band. */
export function allInBand(values, rings = RINGS) {
  return rings.every(ring => {
    const v = values[ring.key];
    return !ring.sweet || (v >= ring.sweet[0] && v <= ring.sweet[1]);
  });
}

/** The scarcest one — what the bed is actually limited by. */
export function limiting(rows) {
  return rows.reduce((worst, r) => (r.available < worst.available ? r : worst));
}

/** Which ring is doing the most damage to this nutrient. */
export function culprit(row, rings = RINGS) {
  return rings.reduce((worst, ring) =>
    (row.factors[ring.key] ?? 1) < (row.factors[worst.key] ?? 1) ? ring : worst);
}

/** How much of the reserve the plant is losing, 0–1. The tax. */
export function lockedFraction(rows) {
  const held = rows.reduce((s, r) => s + r.reserve, 0);
  const got  = rows.reduce((s, r) => s + r.available, 0);
  return held > 0 ? 1 - got / held : 0;
}
