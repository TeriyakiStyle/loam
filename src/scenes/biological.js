// ---------------------------------------------------------------------------
// BIOLOGICAL — inviting life into the loam, by way of a compost pile.
//
// The mirror image of Physical. That sequence broke one thing into many; this
// one gathers many into one. Same stage grammar, opposite direction.
//
// Timing lives in ui/runner.js; the stage vocabulary in ui/stage.js.
// ---------------------------------------------------------------------------

import { createRunner } from '../ui/runner.js';
import { pieceHTML, stageOps } from '../ui/stage.js';

const NARRATION = 'assets/a_biological/organicnarration.001.mp3';
const DIR = 'assets/a_biological/';

const PIECES = {
  loam:   { src: DIR + 'startingloam.svg',      label: 'Loam',              scale: 1.00 },
  brown:  { src: DIR + 'brownfoodcube.svg',     label: 'Browns · carbon',   scale: 0.95 },
  green:  { src: DIR + 'greenfoodcube.svg',     label: 'Greens · nitrogen', scale: 0.95 },
  water:  { src: DIR + 'watercube.svg',         label: 'Water',             scale: 0.88 },
  pile1:  { src: DIR + 'compost_step_01.svg',   label: '',                  scale: 1.20 },
  pile2:  { src: DIR + 'compost_step_02.svg',   label: '',                  scale: 1.15 },
  pile3:  { src: DIR + 'compost_step_03.svg',   label: '',                  scale: 1.10 },
  living: { src: DIR + 'endingloamwithbio.svg', label: '',                  scale: 1.00 },
};

// The loam waits at the top of the ring while its meal is prepared below.
// The three ingredients aren't on the ring proper — they sit on a shallow arc
// so they read as one triad rather than three separate arrivals, and so their
// labels have room to breathe. Browns left, water low centre, greens right.
const SLOTS = {
  loam:  0,
  brown: [-0.95, 0.42],
  water: [ 0.00, 0.58],
  green: [ 0.95, 0.42],
};
const SLOT_COUNT = 4;   // only the loam uses an index; 0 is the top

// Cue times in seconds. Phrase boundaries pulled from the mp3 itself:
//
//   ffmpeg -i organicnarration.001.mp3 -af silencedetect=noise=-32dB:d=0.25 -f null -
const CUES = [
  { t:  3.64, act: 'setAside'    },  // "you must invite life into it"
  // The triad, each on its own word: moistened, browns, greens.
  { t: 16.50, act: 'addWater'    },  // "a moistened pile"
  { t: 17.90, act: 'addBrown'    },  // "of carbon-rich browns"
  { t: 19.48, act: 'addGreen'    },  // "and nitrogen-rich greens"
  { t: 21.57, act: 'buildPile'   },  // "you're setting the table"
  { t: 26.19, act: 'work'        },  // "with a little work — turning, watering, waiting"
  { t: 30.37, act: 'rot'         },  // "your pile transforms"
  { t: 35.83, act: 'finish'      },  // "into finished compost"
  { t: 46.37, act: 'incorporate' },  // "add this to your loamy soil"
  { t: 52.30, act: 'done'        },
];

// Matt's script, split at the recording's own phrase boundaries.
const SUBS = [
  { t:  0.00, text: 'Eroded rock is not yet fertile soil.' },
  { t:  3.64, text: 'You must invite life into it by providing food and water.' },
  { t:  8.67, text: 'And the best way to send that invitation is composting.' },
  { t: 12.87, text: 'Think of compost as a carefully prepared banquet.' },
  { t: 16.50, text: 'By preparing a moistened pile of carbon-rich browns' },
  { t: 19.48, text: 'and nitrogen-rich greens,' },
  { t: 21.57, text: "you're setting the table for billions of microscopic guests." },
  { t: 26.19, text: 'With a little work — turning, watering, and waiting —' },
  { t: 30.37, text: 'your pile transforms as countless organisms break down the material' },
  { t: 35.83, text: 'into finished compost.' },
  { t: 38.18, text: 'The result is dark, crumbly organic matter with an earthy smell;' },
  { t: 44.17, text: 'your compost is ready!' },
  { t: 46.37, text: 'Add this to your loamy soil' },
  { t: 48.54, text: 'to set the table for a wonderful exchange!' },
];

// The loam starts the sequence and the living soil ends it.
const TAGS = {
  loam:   { tag: 'button', attrs: ' type="button" data-start aria-label="Begin composting"' },
  living: { tag: 'a', attrs: ' href="#/sow" data-next tabindex="-1"'
                          + ' aria-label="Continue to Sow and Grow"' },
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

  const { piece, place, hide } = stageOps(stage, SLOTS, SLOT_COUNT);

  const ACTIONS = {
    // the loam steps aside; the centre is the kitchen now
    setAside()    { place('loam', 'ring'); },

    // the triad assembles below the loam, one piece per word
    addWater()    { place('water', 'ring'); },
    addBrown()    { place('brown', 'ring'); },
    addGreen()    { place('green', 'ring'); },

    // all three come in together and become the pile
    buildPile()   { stage.classList.add('is-combining');
                    for (const id of ['water', 'brown', 'green']) place(id, 'centre');
                    setTimeout(() => {
                      hide('water', 'brown', 'green');
                      place('pile1', 'centre');
                      stage.classList.remove('is-combining');
                    }, 900); },

    // turning, watering, waiting — the pile is being tended
    work()        { stage.classList.add('is-working'); },
    rot()         { stage.classList.remove('is-working');
                    hide('pile1'); place('pile2', 'centre'); },
    finish()      { hide('pile2'); place('pile3', 'centre'); },

    incorporate() { stage.classList.add('is-combining');
                    place('loam', 'centre');
                    setTimeout(() => {
                      hide('pile3', 'loam');
                      place('living', 'centre');
                      stage.classList.remove('is-combining');
                      wordmark.classList.add('is-in');
                    }, 700); },
    done()        {},
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
      piece(id).dataset.at = id === 'loam' ? 'centre' : 'away';
      piece(id).classList.remove('is-marked');
    }
    sub.textContent = '';
    sub.classList.remove('is-in', 'is-closing');
    replay.classList.remove('is-ready');
    controls.classList.remove('is-open');
    replay.disabled = true;
    startBtn.disabled = false;
    wordmark.classList.remove('is-in');
    stage.classList.remove('is-done', 'is-combining', 'is-working');
    nextLink.setAttribute('tabindex', '-1');
  }

  function start() {
    startBtn.disabled = true;
    runner.start();
  }

  startBtn.addEventListener('click', start);
  muteBtn.addEventListener('click', () => {
    const muted = runner.toggleMute();
    muteBtn.setAttribute('aria-pressed', String(muted));
    muteBtn.textContent = muted ? 'Unmute' : 'Mute';
  });
  replay.addEventListener('click', () => { reset(); runner.rewind(); start(); });

  reset();
  return () => runner.stop();
}
