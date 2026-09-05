// ---------------------------------------------------------------------------
// NUTRIENT AVAILABILITY
//
// What the soil holds is not what the plant gets. This file is the difference.
//
// A nutrient has a RESERVE — how much is actually down there — and a set of
// RINGS around it, each of which decides what fraction of that reserve a root
// can reach. pH is the first ring. Temperature and moisture are next.
//
// Rings compose by multiplication:
//
//     available = reserve × ph × temperature × moisture × …
//
// which is deliberate. It makes the order irrelevant, it lets any single ring
// veto the result on its own (Liebig's law of the minimum — a plant grows to
// its scarcest input, not its average one), and it means adding a ring is
// appending one object to the list below. Nothing else has to change.
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

// ---------------------------------------------------------------------------
// pH availability curves
//
// Control points of [pH, fraction reachable]. These follow the Truog-style
// availability bands (1946) that every soil textbook reprints — a teaching
// standard, not a measurement of any particular soil. Real availability also
// turns on mineralogy, organic matter and what the microbes are doing. Tune
// the numbers freely; the shape is the lesson.
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
// accident, so they fall to nothing — which is the honest reading, and it
// shows just how narrow the workable window is against the whole span.
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
// RINGS — the environment, one dial at a time.
//
// Each ring declares its range, where it sits, how it colours itself, and one
// function: given a nutrient and the dial's value, what fraction gets through?
// A ring that returns 1 for everything is a ring that does nothing, which is
// how you stub a new one in before you know its curves.
//
// Add temperature and moisture here. The scene reads this list and draws
// whatever it finds, at increasing radius, in order.
// ---------------------------------------------------------------------------
export const RINGS = [
  {
    key: 'ph',
    label: 'pH',
    // The whole scale, not the gardening slice of it. Over 0–14 the midpoint
    // lands on 7.0, so the apex of the arc is chemical neutrality exactly —
    // and the band a vegetable bed actually wants shows up as the small notch
    // it really is.
    min: 0,
    max: 14,
    start: 6.5,
    step: 0.1,
    // The band to aim for. Drawn as a brighter notch on the dial.
    sweet: [6.0, 7.0],
    // Ticks worth labelling. 7 earns its place among the evens.
    ticks: [0, 2, 4, 6, 7, 8, 10, 12, 14],
    format: v => v.toFixed(1),

    // Named regions, shown under the reading as it travels. These are the
    // USDA/NRCS soil reaction classes, and the gradation is the point.
    //
    // Chemically, neutral is 7.0 and everything below it is acid — so 6.5 is
    // acid, full stop. But a scale with only three words puts pH 6.5 and pH
    // 4.0 in the same bucket, which is true and useless: one is a fine
    // vegetable bed, the other will kill what you plant in it. Calling 6.5
    // "slightly acid" says both things at once.
    //
    // Note this is NOT the target band above. Neutral is what the soil IS;
    // the sweet band is what a vegetable bed WANTS. They overlap, they are
    // not the same claim, and the difference is worth leaving visible.
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
    // blue — pulled down in saturation so it belongs to this site rather than
    // to a chemistry catalogue.
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

    // What to say under the chart, by band. A list rather than a function so
    // the page can lay every line out at once and reserve the tallest — text
    // that changes length as you drag would otherwise resize the document and
    // make the whole page twitch under your hand.
    notes: [
      { upTo: 3.4, text: 'Past soil chemistry. Acid this strong strips the exchange sites bare and dissolves the minerals themselves — no root, no fungus, no bacterium works here.' },
      { upTo: 5.5, text: 'Acid ground. Aluminium and iron are holding the phosphorus, and the bacteria that free up nitrogen and sulfur have stalled.' },
      { upTo: 6.0, text: 'A little sour. Phosphorus is starting to lock away, and calcium and magnesium are scarce.' },
      { upTo: 7.3, text: 'The working range. Nothing is locked out; nothing is at its limit.' },
      { upTo: 7.8, text: 'Turning alkaline. Calcium and magnesium are freely available, but phosphorus is beginning to bind to them.' },
      { upTo: 9.0, text: 'Alkaline. Calcium has taken the phosphorus out of reach — the reserve is still there, the plant just cannot get at it.' },
      { upTo: Infinity, text: 'Beyond soil. Ground this alkaline disperses its own structure: the clay slumps, the pores close, and what little is left cannot move to a root anyway.' },
    ],
  },

  // Next up. Uncomment, give it curves, and it draws itself.
  //
  // {
  //   key: 'temp', label: 'Soil temperature', min: 0, max: 35, start: 18,
  //   step: 0.5, sweet: [15, 25], ticks: [0, 10, 20, 30],
  //   format: v => `${v.toFixed(0)}°C`,
  //   ramp: [...],
  //   notes: [...],
  //   effect: (nutrient, v) => ...,   // cold soil stalls mineralisation:
  //                                   // N and S first, then everything
  // },
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

/**
 * Run the reserves through every ring.
 *
 * @param reserves    { N, P, K, Ca, Mg, S } each 0–1
 * @param values      { ph: 6.5, … } current dial positions
 * @param rings       defaults to RINGS
 * @returns rows of { key, symbol, name, reserve, available, factor }
 */
export function evaluate(reserves, values, rings = RINGS) {
  return NUTRIENTS.map(n => {
    let factor = 1;
    for (const ring of rings) {
      const v = values[ring.key];
      if (v !== undefined) factor *= ring.effect(n.key, v);
    }
    const reserve = reserves[n.key] ?? 0;
    return { ...n, reserve, factor, available: reserve * factor };
  });
}

/** Index of the note that applies at this value. */
export function noteIndex(ring, value) {
  return ring.notes.findIndex(n => value <= n.upTo);
}

/** The name of the region a value falls in, or '' if the ring has no regions. */
export function zoneLabel(ring, value) {
  return ring.zones?.find(z => value <= z.upTo)?.label ?? '';
}

/** The scarcest one — what the bed is actually limited by. */
export function limiting(rows) {
  return rows.reduce((worst, r) => (r.available < worst.available ? r : worst));
}

/** How much of the reserve the plant is losing, 0–1. The tax. */
export function lockedFraction(rows) {
  const held = rows.reduce((s, r) => s + r.reserve, 0);
  const got  = rows.reduce((s, r) => s + r.available, 0);
  return held > 0 ? 1 - got / held : 0;
}
