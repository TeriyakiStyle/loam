// ---------------------------------------------------------------------------
// GLOSSARY
//
// The words behind the chart. One entry per term, written once and read by
// two surfaces: the instrument shows a single entry on demand when you click
// an axis, and the appendix can lay the whole set out as a page. Same source,
// so they cannot drift apart.
//
// Every entry answers the same five questions in the same order, because the
// comparison is half the value — you learn what phosphorus is by seeing where
// its answers differ from nitrogen's.
//
//   role    what it does inside the plant
//   curve   WHY its line on the chart bends the way it does. This is the
//           field the instrument exists to explain; the others are context.
//   lack    what running short of it looks like, and where on the plant.
//           Whether a symptom starts at the top or the bottom is not a
//           detail — it tells you whether the nutrient can move.
//   comes   where a gardener gets more of it
//   goes    how it leaves, and how fast
//
// Nothing here touches the page, and nothing here does arithmetic. It is
// prose, kept next to the model so the two stay honest about each other.
// ---------------------------------------------------------------------------

/** The fields, in the order both surfaces render them. */
export const FIELDS = [
  { key: 'role',  label: 'In the plant' },
  { key: 'curve', label: 'Why the line bends' },
  { key: 'lack',  label: 'Short of it' },
  { key: 'comes', label: 'Where it comes from' },
  { key: 'goes',  label: 'Where it goes' },
];

export const GLOSSARY = {
  N: {
    slug: 'nitrogen',
    tagline: 'Leaf and stem. Needed most, held worst.',
    role: `Every protein and every chlorophyll molecule is built around it.
      Plants draw more nitrogen from the soil than anything else on this
      chart, and it is the difference between a thin plant and a lush one.`,
    curve: `Almost no nitrogen arrives as nitrogen — it arrives as bacteria.
      Mineralising it out of organic matter and nitrifying it into a form
      roots take up are both microbial jobs, so the line does not follow
      nitrogen at all. It follows what the microbes can stand: it stalls
      below about pH 5.5, it stalls near freezing, and it stalls again in
      ground so wet there is no air left in it.`,
    lack: `The oldest leaves first, yellowing evenly from the tip back along
      the midrib while the growing point stays green. Nitrogen moves freely
      inside a plant, so a hungry one strips its own old growth to feed the
      new — the pale leaves at the bottom are a decision, not a disease.`,
    comes: `Legumes and the rhizobia in their root nodules; compost and manure
      as they break down; a little from every thunderstorm.`,
    goes: `Faster than anything else here, and by three doors at once. It
      leaches out as nitrate with heavy rain, gasses off as nitrogen from
      waterlogged ground, and evaporates as ammonia from alkaline soil.`,
  },

  S: {
    slug: 'sulfur',
    tagline: 'Two amino acids, and most of what you can taste.',
    role: `Two of the twenty amino acids carry a sulfur atom, and proteins
      fold around the bonds between them. It is also what makes an onion
      sharp, a brassica bitter and mustard hot.`,
    curve: `Like nitrogen, it has to be released from organic matter by
      bacteria before a root can reach it, so it takes broadly the same
      shape — cold, acid and airless soil all slow the same process down.`,
    lack: `Looks like nitrogen hunger and starts at the opposite end. Sulfur
      barely moves once it is placed, so the new leaves at the top go pale
      while the old ones stay green. Top-down pale is sulfur; bottom-up pale
      is nitrogen.`,
    comes: `Organic matter, gypsum, and — for most of the last century —
      coal smoke. Cleaner air has quietly turned this into a deficiency
      worth checking for.`,
    goes: `Leaches as sulfate, at roughly nitrate's pace.`,
  },

  K: {
    slug: 'potassium',
    tagline: 'Never built into anything. Runs everything.',
    role: `Potassium is the one nutrient here that never becomes part of a
      structure. It stays a loose ion, and it spends its time opening and
      closing stomata, balancing water, and switching enzymes on. It is why
      a plant stands up through a hot afternoon and shuts down in drought.`,
    curve: `The forgiving one. It is held on the surfaces of clay and humus
      rather than manufactured by microbes, so it stays broadly available
      right across the range and only the extremes reach it. On a chart
      where everything else has an opinion about pH, potassium mostly
      doesn't.`,
    lack: `A scorched brown margin creeping in from the edge of the oldest
      leaves while the middle stays green. Mobile, so old growth goes first.`,
    comes: `Weathering clay, wood ash, and deep-rooted plants like comfrey
      that mine it and hand it back as mulch.`,
    goes: `Slowly. The exchange sites hold onto it, so it only really leaches
      out of sand.`,
  },

  Ca: {
    slug: 'calcium',
    tagline: 'Mortar. Placed once, never moved again.',
    role: `Calcium cements one cell wall to the next and holds membranes
      together. It is structural rather than metabolic — laid down as the
      cell is built and never recovered afterwards.`,
    curve: `It climbs as the soil turns alkaline, for the plain reason that
      lime is calcium: the thing that raises pH is the thing being measured.
      In acid ground it falls away, because hydrogen and aluminium have taken
      the exchange sites it would otherwise sit on.`,
    lack: `Always in the newest tissue, because that is where building is
      happening: blossom end rot in tomatoes, tip burn in lettuce, hollow
      heart in brassicas. It travels only in the transpiration stream, so a
      plant that has stopped drinking has stopped delivering calcium — which
      makes this as often a watering fault as a soil one.`,
    comes: `Limestone, gypsum, the parent rock itself, and eggshells given
      years to break down.`,
    goes: `Very slowly, and mostly by being carried off in the crop.`,
  },

  P: {
    slug: 'phosphorus',
    tagline: 'Energy, roots and seed — through the narrowest window here.',
    role: `Phosphorus is energy. ATP, DNA, and the phospholipids of every
      membrane. What you see of it is root growth, flowering and seed set.`,
    curve: `The narrowest window on the chart, and squeezed from both sides.
      Below about pH 6, iron and aluminium bind it into compounds no root
      can undo; above about 7.5, calcium does the same thing by a different
      route. It peaks near 6.5 and falls away fast in either direction —
      which is why a phosphorus problem is so often a pH problem wearing a
      disguise.`,
    lack: `Stunting first and colour second: a plant that is simply small,
      with dull blue-green leaves that sometimes go purple as sugars back up
      in tissue that has no energy to spend them.`,
    comes: `Rock phosphate, bone meal, manure — and mycorrhizal fungi, which
      reach where roots cannot and trade phosphorus back for sugar.`,
    goes: `Hardly anywhere. It is the least mobile thing on this chart, which
      is exactly why it is far more often locked up than lost.`,
  },

  Mg: {
    slug: 'magnesium',
    tagline: 'The atom at the centre of green.',
    role: `A magnesium atom sits at the centre of every chlorophyll molecule.
      Without it a leaf cannot be green, whatever else the soil has.`,
    curve: `It runs with calcium — more available as the soil turns
      alkaline — but it also competes with it. Liming heavily with calcium
      alone can crowd magnesium off the exchange sites and produce a
      deficiency in soil that holds plenty of it.`,
    lack: `Yellow between the veins of the older leaves while the veins
      themselves stay green, going bronze or reddish as it worsens. Mobile,
      so the bottom of the plant goes first.`,
    comes: `Dolomitic lime, Epsom salts, and soils weathered from serpentine
      and other magnesium-rich rock.`,
    goes: `More readily than calcium: a smaller ion, more heavily wrapped in
      water, holding on less well — so it is the first of the two to wash out
      of a sandy bed.`,
  },
};

/** One entry, with its key folded in. Null if there isn't one. */
export function entry(key) {
  const found = GLOSSARY[key];
  return found ? { key, ...found } : null;
}

/** True if this key has anything to show — so a trigger is only built when
    there is something behind it. */
export function hasEntry(key) {
  return Boolean(GLOSSARY[key]);
}
