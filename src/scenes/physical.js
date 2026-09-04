// ---------------------------------------------------------------------------
// PHYSICAL — rock into sand, silt and clay, then blended into loam.
//
// The narration is the clock. Every visual change is a cue keyed to a moment
// in the audio, read off `audio.currentTime` — so re-recording the voiceover
// means editing the numbers in CUES and nothing else, and the picture can
// never drift out of sync with the words.
//
// If the audio fails to load, the same cue list runs on a plain timer and the
// sequence plays silently rather than not at all.
// ---------------------------------------------------------------------------

// --- everything you'd want to tune lives in these three blocks -------------

const NARRATION = 'assets/PhysicalNarration.001.mp3';

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

// Cue times in seconds, read against the narration. The phrase boundaries
// below came from the silence gaps in the mp3 itself, so if you re-record,
// re-derive them rather than guessing:
//
//   ffmpeg -i PhysicalNarration.001.mp3 -af silencedetect=noise=-32dB:d=0.30 -f null -
//
//   0.00  "Soil begins with its texture."
//   2.39  "Over millennia,"
//   3.72  "bedrock weathers into ever-smaller particles:"
//   6.54  "coarse sand,"      7.67  "and fine silt."
//   9.34  "Lastly there is clay,"
//  10.88  "not broken down"   12.33  "but chemically remade."
//  14.30  "The smallest particle,"  15.88  "and the greatest change."
//  17.71  "Each size"         18.90  "from gritty to silky to sticky"
//  22.16  "handles water,"  23.76 "air,"  24.55 "and nutrients differently."
//  27.13  "When blended in the right ratios,"
//  29.84  "they create a balanced medium"
//  32.47  "in which life will thrive."          (ends 34.23, file 34.72)
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

// Subtitles, on the same clock as everything else. A line shows from its `t`
// until the next line's `t`. The times are the phrase boundaries pulled out of
// the mp3, so they are the recording's own rhythm rather than a guess.
//
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

// How long the closing line holds after the narration stops, before it fades.
const SUB_LINGER = 1200;


// --- markup ----------------------------------------------------------------

// The rock starts the sequence and the loam ends it, so those two are real
// controls; everything in between is scenery.
const TAGS  = { rock: 'button', loam: 'a' };
const ATTRS = {
  rock: ' type="button" data-start aria-label="Break the rock and begin"',
  loam: ' href="#/biological" data-next tabindex="-1"'
      + ' aria-label="Continue to Biological"',
};

function pieceHTML(id) {
  const p = PIECES[id];
  const tag = TAGS[id] || 'div';
  const attrs = ATTRS[id] || ' aria-hidden="true"';
  return `<${tag} class="piece" data-piece="${id}" style="--art:${p.scale}"${attrs}>
        <img src="${p.src}" alt="" draggable="false">
        <span class="piece-label">${p.label}</span>
      </${tag}>`;
}

export function render(el, _store) {
  el.innerHTML = `
    <section class="physical">
      <div class="stage" data-stage>
        ${Object.keys(PIECES).map(pieceHTML).join('\n        ')}
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
  const piece    = id => stage.querySelector(`[data-piece="${id}"]`);

  const audio = new Audio(NARRATION);
  audio.preload = 'auto';

  let raf = null, fired = 0, startedAt = 0, alive = true;
  let subTimer = null;      // the closing fade
  let subAt = -1;           // which subtitle line is currently showing
  let useAudio = true;      // still hoping to follow the narration
  let audioLive = false;    // the narration is genuinely playing

  // --- placing ---------------------------------------------------------
  // Position is CSS: each piece carries a unit direction and the ring radius
  // is a single custom property, so the whole layout scales on small screens.
  function place(id, where) {
    const node = piece(id);
    node.dataset.at = where;
    if (where === 'ring') {
      const angle = (-90 + SLOTS[id] * 90) * Math.PI / 180;
      node.style.setProperty('--dx', Math.cos(angle).toFixed(4));
      node.style.setProperty('--dy', Math.sin(angle).toFixed(4));
    } else {
      node.style.setProperty('--dx', '0');
      node.style.setProperty('--dy', '0');
    }
  }

  function mark(id, on) {
    piece(id).classList.toggle('is-marked', on);
  }

  function reset() {
    for (const id of Object.keys(PIECES)) {
      place(id, 'centre');
      piece(id).dataset.at = id === 'rock' ? 'centre' : 'away';
      piece(id).classList.remove('is-marked');
    }
    place('rock', 'centre');
    piece('rock').dataset.at = 'centre';
    fired = 0;
    subAt = -1;
    clearTimeout(subTimer);
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

  // --- the cue actions --------------------------------------------------
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
    loam()     { for (const id of ['sand', 'silt', 'clay', 'rock']) {
                   piece(id).dataset.at = 'away';
                 }
                 place('loam', 'centre');
                 stage.classList.remove('is-combining');
                 wordmark.classList.add('is-in'); },
    done()     { clearTimeout(subTimer);
                 subTimer = setTimeout(() => {
                   sub.classList.add('is-closing');   // a slower fade than a line change
                   sub.classList.remove('is-in');
                 }, SUB_LINGER);
                 replay.classList.add('is-ready');
                 controls.classList.add('is-open');
                 replay.disabled = false;
                 nextLink.removeAttribute('tabindex');
                 stage.classList.add('is-done'); },
  };

  // --- the clock --------------------------------------------------------
  // Follow the narration when it's really playing. A browser can resolve
  // play() and still never advance the file — an unsupported codec, a failed
  // fetch — which would leave the sequence frozen at zero. So give it a
  // moment to prove itself, then fall back to a wall clock and play on.
  const GRACE = 1.5;

  function now() {
    const wall = (performance.now() - startedAt) / 1000;
    if (useAudio && audio.currentTime > 0.05) audioLive = true;
    if (audioLive) return audio.currentTime;
    if (useAudio && wall < GRACE) return 0;   // hold the first frame briefly
    useAudio = false;
    return wall - (audio.paused ? 0 : 0);
  }

  function tick() {
    if (!alive) return;
    const t = now();
    stage.dataset.t = t.toFixed(2);
    while (fired < CUES.length && t >= CUES[fired].t) {
      ACTIONS[CUES[fired].act]();
      fired++;
    }

    // Last line whose time has passed. Recomputed rather than incremented, so
    // it stays correct if the clock ever jumps.
    let want = -1;
    for (let i = 0; i < SUBS.length; i++) if (t >= SUBS[i].t) want = i;
    if (want !== subAt) {
      subAt = want;
      const line = want >= 0 ? SUBS[want].text : '';
      sub.textContent = line;
      sub.classList.toggle('is-in', line !== '');
    }
    if (fired < CUES.length) raf = requestAnimationFrame(tick);
  }

  function start() {
    startBtn.disabled = true;
    startedAt = performance.now();

    // The click is what unlocks audio in a browser, which is the other good
    // reason for the rock being the trigger.
    audio.play().catch(() => { useAudio = false; });
    audio.addEventListener('error', () => { useAudio = false; }, { once: true });
    audio.addEventListener('stalled', () => { useAudio = false; }, { once: true });

    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(tick);
  }

  startBtn.addEventListener('click', start);

  muteBtn.addEventListener('click', () => {
    audio.muted = !audio.muted;
    muteBtn.setAttribute('aria-pressed', String(audio.muted));
    muteBtn.textContent = audio.muted ? 'Unmute' : 'Mute';
  });

  replay.addEventListener('click', () => {
    reset();
    audioLive = false;
    try { audio.currentTime = 0; } catch { /* not seekable yet */ }
    start();
  });

  reset();

  // Leaving the page must stop the audio and the loop, or the narration
  // follows you to the next screen.
  return () => {
    alive = false;
    clearTimeout(subTimer);
    cancelAnimationFrame(raf);
    audio.pause();
    audio.src = '';
  };
}
