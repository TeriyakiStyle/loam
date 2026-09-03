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

// Cue times in seconds, read against the narration.
//   0.0  "Soil begins with its texture."
//   3.2  "Over millennia, bedrock weathers into ever-smaller particles:"
//   7.9  "coarse sand, and fine silt."
//   9.9  "Lastly there is clay, not broken down but chemically remade."
//  12.9  "The smallest particle, and the greatest change."
//  16.3  "Each size — gritty, silky, sticky — handles water, air and nutrients…"
//  23.0  "When blended in the right ratios,"
//  25.5  "they create a balanced medium in which life will thrive."
const CUES = [
  { t:  4.6, act: 'break'      },   // rock -> sand
  { t:  8.7, act: 'toSilt'     },
  { t: 10.3, act: 'toClay'     },   // the slow one: chemistry, not impact
  { t: 13.2, act: 'clayOut'    },   // clay joins the ring, centre clears
  { t: 17.7, act: 'markSand'   },   // "gritty"
  { t: 19.1, act: 'markSilt'   },   // "silky"
  { t: 20.6, act: 'markClay'   },   // "sticky"
  { t: 22.3, act: 'unmark'     },
  { t: 23.2, act: 'combine'    },   // the three converge on the centre
  { t: 25.6, act: 'loam'       },
  { t: 27.9, act: 'done'       },
];

const RUNTIME = 28.4;   // used only when there's no audio to follow


// --- markup ----------------------------------------------------------------

function pieceHTML(id) {
  const p = PIECES[id];
  const tag = id === 'rock' ? 'button' : 'div';
  const attrs = id === 'rock'
    ? ' type="button" data-start aria-label="Break the rock and begin"'
    : ' aria-hidden="true"';
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
      </div>

      <p class="hint" data-hint>Click the rock to begin.</p>

      <div class="seq-controls" data-controls hidden>
        <button type="button" class="ghost" data-mute aria-pressed="false">Mute</button>
        <button type="button" class="ghost" data-replay hidden>Replay</button>
      </div>
    </section>
  `;

  const stage    = el.querySelector('[data-stage]');
  const hint     = el.querySelector('[data-hint]');
  const controls = el.querySelector('[data-controls]');
  const muteBtn  = el.querySelector('[data-mute]');
  const replay   = el.querySelector('[data-replay]');
  const startBtn = el.querySelector('[data-start]');
  const piece    = id => stage.querySelector(`[data-piece="${id}"]`);

  const audio = new Audio(NARRATION);
  audio.preload = 'auto';

  let raf = null, fired = 0, startedAt = 0, alive = true;
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
    hint.hidden = false;
    replay.hidden = true;
    startBtn.disabled = false;
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
    loam()     { for (const id of ['sand', 'silt', 'clay']) {
                   piece(id).dataset.at = 'away';
                 }
                 place('loam', 'centre');
                 stage.classList.remove('is-combining'); },
    done()     { replay.hidden = false; },
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
    if (fired < CUES.length) raf = requestAnimationFrame(tick);
  }

  function start() {
    hint.hidden = true;
    controls.hidden = false;
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
    cancelAnimationFrame(raf);
    audio.pause();
    audio.src = '';
  };
}
