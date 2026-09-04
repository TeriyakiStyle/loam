// ---------------------------------------------------------------------------
// PHYSICAL — rock into sand, silt and clay, then blended into loam.
//
// Timing lives in ui/runner.js; the stage vocabulary in ui/stage.js. This file
// is only the cast, the cue times, and what each cue does.
// ---------------------------------------------------------------------------

import { createRunner, handOff, takeHandoff } from '../ui/runner.js';
import { pieceHTML, stageOps } from '../ui/stage.js';

const NARRATION = 'assets/PhysicalNarration.001.mp3';

// How long a handed-off scene waits before it starts talking.
const HANDOFF_BEAT = 550;

// `scale` normalises artwork with very different proportions: the rock is
// tall, the piles are wide and flat, clay is small. Nudge these to taste.
const PIECES = {
  rock: { src: 'assets/RockCube.001.svg', label: 'Parent rock', scale: 1.00 },
  sand: { src: 'assets/SandPile.001.svg', label: 'Sand',        scale: 1.05 },
  silt: { src: 'assets/SiltPile.001.svg', label: 'Silt',        scale: 1.05 },
  clay: { src: 'assets/Clay.001.svg',     label: 'Clay',        scale: 0.78 },
  loam: { src: 'assets/Loam.001.svg',     label: 'Loam',        scale: 1.00 },
};

// Ring slots, clockwise from the top. Rock takes the first one and stays
// there: it's the parent, not an ingredient.
const SLOTS = { rock: 0, sand: 1, silt: 2, clay: 3 };

// Cue times in seconds, read against the narration. The phrase boundaries came
// from the silence gaps in the mp3 itself. If you re-record, re-derive them:
//
//   ffmpeg -i PhysicalNarration.001.mp3 -af silencedetect=noise=-32dB:d=0.30 -f null -
const CUES = [
  { t:  4.0, act: 'break'    },   // on "weathers into ever-smaller particles"
  { t:  7.6, act: 'toSilt'   },   // as silt is named
  { t:  9.3, act: 'toClay'   },   // the slow one: chemistry, not impact
  { t: 17.0, act: 'clayOut'  },   // clay held the centre through its two lines
  { t: 19.2, act: 'markSand' },   // "gritty"
  { t: 20.1, act: 'markSilt' },   // "silky"
  { t: 20.9, act: 'markClay' },   // "sticky"
  { t: 21.9, act: 'unmark'   },
  { t: 27.2, act: 'combine'  },   // "When blended"
  { t: 29.9, act: 'loam'     },   // "they create a balanced medium"
  { t: 34.3, act: 'done'     },
];

// These must match what the voice actually SAYS, not the latest draft of the
// script — a subtitle that disagrees with the audio is worse than an old word.
const SUBS = [
  { t:  0.0,  text: 'Soil begins with its texture.' },
  { t:  2.39, text: 'Over millennia, bedrock weathers into ever-smaller particles:' },
  { t:  6.54, text: 'coarse sand and fine silt.' },
  { t:  9.34, text: 'Lastly there is clay, not broken down but chemically remade.' },
  { t: 14.30, text: 'The smallest particle, and the greatest change.' },
  { t: 17.71, text: 'Each size — from gritty to silky to sticky —' },
  { t: 22.16, text: 'handles water, air, and nutrients differently.' },
  { t: 27.13, text: 'When blended in the right ratios,' },
  { t: 29.84, text: 'they create a balanced medium in which life will thrive.' },
];

// The rock starts the sequence and the loam ends it, so those two are real
// controls; everything in between is scenery.
const TAGS = {
  rock: { tag: 'button', attrs: ' type="button" data-start aria-label="Break the rock and begin"' },
  loam: { tag: 'a', attrs: ' href="#/biological" data-next tabindex="-1"'
                         + ' aria-label="Continue to Biological"' },
};

export function render(el, _store) {
  el.innerHTML = `
    <section class="sequence">
      <div class="stage" data-stage>
        ${Object.entries(PIECES).map(([id, p]) => pieceHTML(id, p, TAGS[id])).join('\n        ')}
        <img class="finale-mark" data-mark src="assets/wordmark-loam.svg"
             alt="LOAM" width="141" height="38">
      </div>

      <p class="subtitle" data-sub></p>

      <div class="seq-controls">
        <button type="button" class="ghost" data-mute aria-pressed="false">Mute</button>
        <button type="button" class="ghost" data-replay>Replay</button>
      </div>
    </section>
  `;

  const stage    = el.querySelector('[data-stage]');
  const controls = el.querySelector('.seq-controls');
  const sub      = el.querySelector('[data-sub]');
  const muteBtn  = el.querySelector('[data-mute]');
  const replay   = el.querySelector('[data-replay]');
  const startBtn = el.querySelector('[data-start]');
  const wordmark = el.querySelector('[data-mark]');
  const nextLink = el.querySelector('[data-next]');

  const { piece, place, mark, hide } = stageOps(stage, SLOTS, 4);

  const ACTIONS = {
    break()    { place('rock', 'ring'); place('sand', 'centre'); },
    toSilt()   { place('sand', 'ring'); place('silt', 'centre'); },
    toClay()   { place('silt', 'ring'); place('clay', 'centre');
                 stage.classList.add('is-chemical'); },
    clayOut()  { place('clay', 'ring'); stage.classList.remove('is-chemical'); },
    markSand() { mark('sand', true); },
    markSilt() { mark('sand', false); mark('silt', true); },
    markClay() { mark('silt', false); mark('clay', true); },
    unmark()   { for (const id of ['sand', 'silt', 'clay']) mark(id, false); },
    combine()  { stage.classList.add('is-combining');
                 for (const id of ['sand', 'silt', 'clay']) place(id, 'centre'); },
    // The rock goes too: once there is loam, the parent is spent.
    loam()     { hide('sand', 'silt', 'clay', 'rock');
                 place('loam', 'centre');
                 stage.classList.remove('is-combining');
                 wordmark.classList.add('is-in'); },
    done()     {},
  };

  const runner = createRunner({
    src: NARRATION, cues: CUES, subs: SUBS,
    onTick: t => { stage.dataset.t = t.toFixed(2); },
    onCue: act => ACTIONS[act](),
    onSub: (text, closing) => {
      if (text === null) {
        if (closing) sub.classList.add('is-closing');
        sub.classList.remove('is-in');
        return;
      }
      sub.textContent = text;
      sub.classList.add('is-in');
    },
    onEnd: () => {
      replay.classList.add('is-ready');
      controls.classList.add('is-open');
      replay.disabled = false;
      nextLink.removeAttribute('tabindex');
      stage.classList.add('is-done');
    },
  });

  function reset() {
    for (const id of Object.keys(PIECES)) {
      place(id, 'centre');
      piece(id).dataset.at = id === 'rock' ? 'centre' : 'away';
      piece(id).classList.remove('is-marked');
    }
    sub.textContent = '';
    sub.classList.remove('is-in', 'is-closing');
    replay.classList.remove('is-ready');
    controls.classList.remove('is-open');
    replay.disabled = true;
    startBtn.disabled = false;
    wordmark.classList.remove('is-in');
    stage.classList.remove('is-done', 'is-chemical', 'is-combining');
    nextLink.setAttribute('tabindex', '-1');
  }

  function start() {
    startBtn.disabled = true;
    runner.start();
  }

  startBtn.addEventListener('click', start);
  nextLink.addEventListener('click', handOff);
  muteBtn.addEventListener('click', () => {
    const muted = runner.toggleMute();
    muteBtn.setAttribute('aria-pressed', String(muted));
    muteBtn.textContent = muted ? 'Unmute' : 'Mute';
  });
  replay.addEventListener('click', () => { reset(); runner.rewind(); start(); });

  reset();

  // Arriving from the previous chapter: play on, after a beat to let the
  // screen settle rather than talking over its own arrival.
  const opening = takeHandoff() ? setTimeout(start, HANDOFF_BEAT) : null;

  return () => { clearTimeout(opening); runner.stop(); };
}
