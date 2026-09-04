// ---------------------------------------------------------------------------
// SEQUENCE RUNNER
//
// The narration is the clock. Cues and subtitles are keyed to moments in the
// audio and read off `audio.currentTime`, so re-recording a voiceover means
// editing numbers and nothing else — the picture cannot drift from the words.
//
// This owns the timing and nothing else. What a cue *does*, and what the page
// looks like, belongs to the scene that created the runner.
// ---------------------------------------------------------------------------

// A browser can resolve play() and still never advance the file — an
// unsupported codec, a failed fetch. Wait this long for the audio to prove
// itself, then fall back to a wall clock so the sequence plays silently
// rather than freezing at zero.
const GRACE = 1.5;

// ---------------------------------------------------------------------------
// HANDOFF
//
// One sequence ending and the next beginning is a single move for the viewer:
// they click the finished cube and the next chapter plays. That click is also
// the user gesture a browser needs before it will let audio play, and it
// survives the hash change, so the arriving scene can start itself.
//
// Set on the way out, read once on the way in. A page opened cold — a refresh,
// a bookmark, a link from the nav — finds this false and waits to be clicked,
// which is right: nobody wants a voice starting at them unbidden.
// ---------------------------------------------------------------------------
let handed = false;
export function handOff() { handed = true; }
export function takeHandoff() { const h = handed; handed = false; return h; }

export function createRunner({
  src,                  // narration url
  cues,                 // [{ t, act }] sorted by t
  subs = [],            // [{ t, text }] sorted by t
  linger = 1200,        // ms the closing line holds after the last cue
  onCue,                // (act) => void
  onSub,                // (text | null) => void
  onEnd,                // () => void   — every cue has fired
  onTick,               // (t) => void  — optional, for debugging
}) {
  const audio = new Audio(src);
  audio.preload = 'auto';

  let raf = null, subTimer = null;
  let fired = 0, subAt = -1, startedAt = 0;
  let alive = true, useAudio = true, audioLive = false;

  function now() {
    const wall = (performance.now() - startedAt) / 1000;
    if (useAudio && audio.currentTime > 0.05) audioLive = true;
    if (audioLive) return audio.currentTime;
    if (useAudio && wall < GRACE) return 0;   // hold the first frame briefly
    useAudio = false;
    return wall;
  }

  function tick() {
    if (!alive) return;
    const t = now();
    if (onTick) onTick(t);

    while (fired < cues.length && t >= cues[fired].t) {
      onCue(cues[fired].act);
      fired++;
    }

    // Recomputed rather than incremented, so it stays correct if the clock
    // ever jumps — which it will, the day this grows a scrubber.
    let want = -1;
    for (let i = 0; i < subs.length; i++) if (t >= subs[i].t) want = i;
    if (want !== subAt) {
      subAt = want;
      onSub(want >= 0 ? subs[want].text : null);
    }

    if (fired < cues.length) {
      raf = requestAnimationFrame(tick);
    } else {
      // The closing line can't be a cue: audio.currentTime tops out at the
      // file's own length, and this loop has just stopped.
      clearTimeout(subTimer);
      subTimer = setTimeout(() => onSub(null, true), linger);
      if (onEnd) onEnd();
    }
  }

  return {
    audio,

    start() {
      startedAt = performance.now();
      // The click that got here is what unlocks audio in a browser.
      audio.play().catch(() => { useAudio = false; });
      audio.addEventListener('error',   () => { useAudio = false; }, { once: true });
      audio.addEventListener('stalled', () => { useAudio = false; }, { once: true });
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(tick);
    },

    rewind() {
      cancelAnimationFrame(raf);
      clearTimeout(subTimer);
      fired = 0;
      subAt = -1;
      audioLive = false;
      useAudio = true;
      try { audio.currentTime = 0; } catch { /* not seekable yet */ }
      onSub(null);
    },

    toggleMute() {
      audio.muted = !audio.muted;
      return audio.muted;
    },

    // Leaving the page must stop the audio and the loop, or the narration
    // follows you to the next screen.
    stop() {
      alive = false;
      cancelAnimationFrame(raf);
      clearTimeout(subTimer);
      audio.pause();
      audio.src = '';
    },
  };
}
