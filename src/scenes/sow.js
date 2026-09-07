// Sow and Grow: the current plant stays rooted in the cube; completed
// drawings become a quiet record around it. Times follow the supplied MP3.
import { createRunner, takeHandoff } from '../ui/runner.js';
import { clockSVG } from '../art/clock.js';

// An illustrative season, not a crop forecast. Slow the early growth down
// and let weeks pass between reproductive stages. Decomposition stays open-ended.
const SEASON = [[6.6, 0], [13.8, 1], [23.98, 2], [45, 4], [51.86, 6],
  [60.02, 8], [63.3, 10], [65.7, 12], [72.74, 16], [79.66, 17]];
function seasonWeek(t) {
  for (let i = 1; i < SEASON.length; i++) {
    if (t <= SEASON[i][0]) {
      const [start, week] = SEASON[i - 1];
      const [end, next] = SEASON[i];
      return week + Math.max(0, (t - start) / (end - start)) * (next - week);
    }
  }
  return 17 + (t - 79.66) / 2;
}

const DIR = 'assets/a_sowandgrow/';
const STAGES = [
  ['00', 'A soybean', '120 402 95 85'],
  ['05', 'The first root', '125 402 95 90'],
  ['09', 'Reaching upward', '130 330 95 165'],
  ['10', 'Seed leaves', '105 310 110 200'],
  ['12', 'First true leaves', '65 225 190 285'],
  ['13-32', 'Three leaflets', '65 185 190 325'],
  ['15-34', 'Growing together', '60 110 210 400'],
  ['59-22', 'Flower buds', '45 55 235 455'],
  ['61-23', 'First flowers', '45 55 235 455'],
  ['65-23', 'Flowers open', '45 55 235 455'],
  ['71', 'Young pods', '45 55 235 455'],
  ['75', 'Filling pods', '45 55 235 455'],
  ['79', 'Edamame', '45 55 235 455'],
  ['89', 'Seeds for another season', '45 55 235 455'],
  ['97', 'Returning to the soil', '45 55 235 455'],
];

const SUBS = [
  [0, 'If our vibrant, teeming soil is a party,'],
  [2.94, 'then sowing a seed in it is like the song and dance.'],
  [6.6, 'Our dancer arrives in the form of a soybean.'],
  [10.18, 'Water wakes it.'],
  [11.68, 'A root reaches down.'],
  [13.8, 'A shoot curves toward the light.'],
  [16.62, 'At first, the seed carries the food for its own opening steps.'],
  [21.24, 'Then its leaves unfurl.'],
  [23.98, 'Sunlight becomes sugar.'],
  [26.04, 'And the plant has something to share.'],
  [28.94, 'Through its roots, some of that sugar enters the soil,'],
  [32.76, 'feeding life around it.'],
  [34.9, 'Microbes and fungi help release and carry nutrients.'],
  [39.62, 'The roots take up what the plant needs to grow.'],
  [42.64, 'An exchange takes shape.'],
  [44.84, 'Sugar from above.'],
  [46.54, 'Water and nutrients from below.'],
  [49.52, 'The plant dances between them.'],
  [51.86, 'More leaves reach for the light.'],
  [54.28, 'More roots explore the dark.'],
  [56.66, 'And around those roots, the gathering grows.'],
  [60.02, 'Flowers open.'],
  [61.56, 'Pods swell.'],
  [63.16, 'Some of the energy gathered from sunlight becomes food for our table.'],
  [68.32, 'Some is packed into seeds, ready for another season.'],
  [72.74, 'And when the dance is done,'],
  [74.56, 'we cut the stem and lay it down.'],
  [77.5, 'The roots remain.'],
  [79.66, 'The fallen plant becomes food for the life that helped it grow.'],
  [84.78, 'As it breaks down, nutrients return to the exchange.'],
].map(([t, text]) => ({ t, text }));

const CUES = [
  [6.6, 0], [10.18, 'water'], [11.68, 1], [13.8, 2],
  [18.0, 3], [21.24, 4], [23.98, 'sun'], [28.94, 'sugar'],
  [34.9, 'nutrients'], [42.64, 'exchange'], [45.0, 5], [51.86, 6],
  [56.66, 7], [59.0, 8], [60.02, 9], [61.56, 10], [63.3, 11],
  [65.7, 12], [67.0, 'harvest'], [69.4, 13], [72.74, 14],
  [74.56, 'cut'], [79.66, 'decay'], [84.78, 'soil'], [88.7, 'done'],
].map(([t, act]) => ({ t, act }));

// Only these local, authored plant SVGs are inlined. Keep original files
// untouched; remove their ground strokes and separate the roots for the cut.
function plantSVG(source, crop) {
  const doc = new DOMParser().parseFromString(source, 'image/svg+xml');
  if (doc.querySelector('parsererror')) throw new Error('Invalid plant artwork');
  const svg = doc.documentElement;
  svg.querySelector('#soil')?.remove();
  const roots = svg.querySelector('#roots');
  if (roots) svg.append(roots);
  svg.querySelectorAll('title, desc').forEach(node => node.remove());
  svg.querySelectorAll('[id]').forEach(node => {
    node.dataset.part = node.id;
    node.removeAttribute('id');
  });
  // The authored pod shape is shared across these SVGs. Mark its groups so
  // harvest can remove pods without changing or flattening the source art.
  [...svg.querySelectorAll('path')]
    .filter(node => node.getAttribute('d')?.startsWith('M0 0 C-10 7 -15 16'))
    .forEach((node, i) => {
      if (i > 1) node.parentElement.setAttribute('data-harvest-pod', '');
    });
  svg.removeAttribute('aria-labelledby');
  svg.removeAttribute('role');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  if (crop) svg.setAttribute('viewBox', crop);
  return svg.outerHTML;
}

export function render(el) {
  const handed = takeHandoff();
  let alive = true, runner = null, opening = null, current = -1;
  const abort = new AbortController();
  el.innerHTML = `
    <section class="sequence sow-sequence">
      <h1 class="sr-only">Sow and Grow</h1>
      <div class="sow-stage" data-sow>
        <div class="sow-orbit" aria-hidden="true"></div>
        <button class="sow-cube sow-start" data-start disabled aria-label="Plant a soybean and begin Sow and Grow">
          <img src="assets/a_biological/endingloamwithbio.svg" alt="" draggable="false">
        </button>
        <img class="sow-cube sow-final" src="${DIR}finalcube.svg" alt="Topsoil covered with fallen leaves and stems, with roots remaining below" draggable="false">
        <div class="sow-plants" aria-hidden="true"></div>
        <div class="sow-exchange" aria-hidden="true">
          ${[0, 1, 2, 3].map(i => `<i class="sow-flow sugar" style="--i:${i}"></i><i class="sow-flow nutrient" style="--i:${i}"></i>`).join('')}
          <i class="sow-water"></i>
        </div>
        <div class="sow-time">
          <svg viewBox="0 0 64 64" aria-hidden="true"><g data-clock transform="translate(32 32)"><circle r="17" fill="#e1c57c"/></g></svg>
        </div>
        <p class="sow-label" data-label>Preparing the seed…</p>
      </div>
      <p class="subtitle" data-sub></p>
      <div class="sow-controls">
        <button type="button" class="ghost" data-mute disabled aria-pressed="false">Mute</button>
        <button type="button" class="ghost sow-replay" data-replay disabled>Replay</button>
      </div>
      <p class="sow-error" role="status" hidden></p>
    </section>`;

  const stage = el.querySelector('[data-sow]');
  const start = el.querySelector('[data-start]');
  const label = el.querySelector('[data-label]');
  const sub = el.querySelector('[data-sub]');
  const mute = el.querySelector('[data-mute]');
  const replay = el.querySelector('[data-replay]');
  const plants = el.querySelector('.sow-plants');
  const clock = el.querySelector('.sow-time');
  const clockFace = clock.querySelector('[data-clock]');
  let time = 0;
  function updateTime(t) {
    time = t;
    const progress = Math.min(1, Math.max(0, t / 88.7));
    const angle = -Math.PI / 2 + progress * Math.PI * 2;
    const radius = 40;
    clock.style.left = `${50 + Math.cos(angle) * radius}%`;
    clock.style.top = `${50 + Math.sin(angle) * radius}%`;
  }
  clockSVG(56).then(markup => {
    if (!alive || !markup) return;
    clock.innerHTML = markup;
    updateTime(time);
  });

  function advance(index) {
    if (current >= 0) plants.children[current].dataset.at = 'past';
    current = index;
    plants.children[index].dataset.at = 'current';
    label.textContent = STAGES[index][1];
    stage.classList.remove('is-harvesting');
  }

  function cue(act) {
    if (typeof act === 'number') { advance(act); return; }
    if (act === 'harvest') stage.classList.add('is-harvesting', 'has-harvested');
    else if (act === 'cut') {
      stage.classList.add('is-cut');
      stage.classList.remove('has-exchange', 'has-sugar', 'has-nutrients', 'has-sun');
    } else if (act === 'decay') stage.classList.add('is-decaying');
    else if (act === 'soil') {
      stage.classList.add('is-soil');
      label.textContent = 'The exchange continues';
    } else if (act === 'done') stage.classList.add('is-done');
    else stage.classList.add(`has-${act}`);
  }

  function begin() {
    if (!runner || start.disabled) return;
    start.disabled = true;
    stage.classList.add('is-playing');
    label.textContent = 'A living soil';
    runner.start();
  }
  start.addEventListener('click', begin);
  mute.addEventListener('click', () => {
    const muted = runner.toggleMute();
    mute.setAttribute('aria-pressed', String(muted));
    mute.textContent = muted ? 'Unmute' : 'Mute';
  });
  replay.addEventListener('click', () => {
    stage.className = 'sow-stage';
    current = -1;
    [...plants.children].forEach(node => { node.dataset.at = 'waiting'; });
    sub.classList.remove('is-in', 'is-closing');
    replay.disabled = true;
    start.disabled = false;
    runner.rewind();
    updateTime(0);
    begin();
  });

  Promise.all(STAGES.map(async ([code]) => {
    const response = await fetch(`${DIR}soybean-${code}.svg`, { signal: abort.signal });
    if (!response.ok) throw new Error(`Plant artwork ${code} could not load`);
    return response.text();
  })).then(sources => {
    if (!alive) return;
    plants.innerHTML = sources.map((source, i) => {
      // The last plant is cut at the centre, so only the preceding stages
      // need orbit slots. Distribute those evenly around the whole circle.
      const angle = (-90 + i * 360 / (STAGES.length - 1)) * Math.PI / 180;
      return `<div class="sow-plant" data-at="waiting" style="--dx:${Math.cos(angle).toFixed(5)};--dy:${Math.sin(angle).toFixed(5)}">
        <div class="sow-main-art">${plantSVG(source)}</div>
        <div class="sow-memory-art">${plantSVG(source, STAGES[i][2])}</div>
      </div>`;
    }).join('');
    runner = createRunner({
      src: `${DIR}sowandgrow_dialogue.001.mp3`, cues: CUES, subs: SUBS,
      linger: 2000,
      onCue: cue,
      onTick: t => { stage.dataset.t = t.toFixed(2); updateTime(t); },
      onSub: (text, closing) => {
        if (text !== null) sub.textContent = text;
        sub.classList.toggle('is-in', text !== null);
        if (closing) sub.classList.add('is-closing');
      },
      onEnd: () => { replay.disabled = false; },
    });
    start.disabled = false;
    mute.disabled = false;
    label.textContent = 'Plant a soybean';
    if (handed) opening = setTimeout(begin, 550);
  }).catch(error => {
    if (!alive || error.name === 'AbortError') return;
    label.textContent = 'The artwork could not load';
    const status = el.querySelector('.sow-error');
    status.hidden = false;
    status.textContent = 'Please reload this page to try again.';
  });

  return () => {
    alive = false;
    abort.abort();
    clearTimeout(opening);
    runner?.stop();
  };
}








