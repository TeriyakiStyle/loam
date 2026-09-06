// ---------------------------------------------------------------------------
// THE CLOCK
//
// assets/sun-moon.svg, borrowed for the season track and made scrubbable.
//
// That file animates itself: a sun crossing to night and back once per `--dur`,
// and a moon stepping one phase per day through a 29-day lunation, with a true
// cosine terminator. All of that is worth keeping exactly as drawn — so rather
// than reimplementing it, this seeks it.
//
// A CSS animation can be parked at any moment by pausing it and giving it a
// NEGATIVE delay: `animation-play-state: paused; animation-delay: -94s` shows
// you frame 94 and holds there. Day 47 at two seconds a day is exactly that.
// The artwork's own maths does the rest, untouched.
//
// The one hazard is that inlining an SVG dumps its stylesheet into the page.
// That file opens with a bare `svg { … }` rule, which would reach every SVG
// here — the instrument included. So every selector gets scoped to the wrapper
// and every keyframe renamed on the way in.
// ---------------------------------------------------------------------------

const SRC   = 'assets/sun-moon.svg';
const SCOPE = 'clock-art';

let pending = null;   // one fetch, however many callers

/** Index of the `}` closing the block that opens at `from`. */
function closeOf(text, from) {
  let depth = 0;
  for (let i = from; i < text.length; i++) {
    if (text[i] === '{') depth++;
    else if (text[i] === '}' && --depth === 0) return i;
  }
  return text.length;
}

/**
 * Walk a stylesheet block by block, prefixing every ordinary selector.
 *
 * This began as one regex and it was wrong in a way worth recording. The
 * pattern excluded `@` from a selector's first character to skip at-rules —
 * but the `\s*` before it could give a space back under backtracking, the
 * space then satisfied "not an @", and the whole `@keyframes` line was
 * swallowed as if it were a selector. Prefixed, it stopped being a valid
 * at-rule, the parser dropped every keyframe in the file, and the animations
 * had nothing left to animate: the sun sat at frame one for all ninety days.
 *
 * Counting braces is duller and it cannot do that.
 */
function scopeBlock(text) {
  let out = '', i = 0;

  while (i < text.length) {
    const open = text.indexOf('{', i);
    if (open < 0) { out += text.slice(i); break; }

    const prelude = text.slice(i, open);
    const head    = prelude.trim();
    const close   = closeOf(text, open);
    const body    = text.slice(open + 1, close);

    if (head.startsWith('@keyframes')) {
      // Percentages inside are stops, not selectors. Hands off.
      out += `${prelude}{${body}}`;
    } else if (head.startsWith('@')) {
      // @media and friends: the rules INSIDE still need scoping.
      out += `${prelude}{${scopeBlock(body)}}`;
    } else {
      const scoped = head.split(',')
        .map(s => s.trim())
        .filter(Boolean)
        .map(s => (s === 'svg' ? `.${SCOPE}` : `.${SCOPE} ${s}`))
        .join(', ');
      out += `${prelude.replace(head, scoped)}{${body}}`;
    }
    i = close + 1;
  }
  return out;
}

/**
 * Rewrite a stylesheet so it can only reach inside `.clock-art`.
 * Keyframe names are prefixed too — those are global no matter where the
 * rule sits, and `rays` is a plausible enough name to collide one day.
 */
function scopeCSS(css) {
  // Comments first. The walker reads everything before a `{` as a prelude,
  // and a comment sitting in front of an at-rule would ride along inside it.
  css = css.replace(/\/\*[\s\S]*?\*\//g, '');

  for (const name of [...css.matchAll(/@keyframes\s+([\w-]+)/g)].map(m => m[1])) {
    css = css.replace(new RegExp(`@keyframes\\s+${name}\\b`, 'g'), `@keyframes sm-${name}`);
    css = css.replace(
      new RegExp(`(animation(?:-name)?\\s*:[^;}]*?)\\b${name}\\b`, 'g'), `$1sm-${name}`);
  }

  return scopeBlock(css);
}

// Parked, so the only thing that moves the artwork is the season track.
const SEEK_RULE = `
    .${SCOPE} .sunDisc, .${SCOPE} .rays, .${SCOPE} .night,
    .${SCOPE} .halfLit, .${SCOPE} .term {
      animation-play-state: paused;
      animation-delay: var(--seek, 0s);
    }`;

/**
 * Fetch the artwork and return it as markup ready to nest inside another SVG.
 * Resolves to null if it can't be had — the caller should have a plain marker
 * to fall back on rather than losing the control altogether.
 *
 * @param size  the box to draw it in, in the host SVG's units
 */
export function clockSVG(size = 38) {
  if (!pending) {
    pending = fetch(SRC)
      .then(r => (r.ok ? r.text() : Promise.reject(new Error(r.status))))
      .then(text => {
        const style = text.match(/<style[^>]*>([\s\S]*?)<\/style>/);
        const open  = text.match(/<svg[^>]*>/);
        if (!style || !open) throw new Error('unrecognised clock artwork');
        const body = text
          .slice(open.index + open[0].length)
          .replace(/<style[^>]*>[\s\S]*?<\/style>/, '')
          .replace(/<\/svg>\s*$/, '');
        return { css: scopeCSS(style[1]) + SEEK_RULE, body };
      })
      .catch(() => null);
  }

  return pending.then(art => art && `
      <svg class="${SCOPE}" x="${-size / 2}" y="${-size / 2}"
           width="${size}" height="${size}" viewBox="0 0 100 100"
           aria-hidden="true">
        <style>${art.css}</style>
        ${art.body}
      </svg>`);
}

/**
 * Park the artwork on a given day.
 *
 * `dayLength` is the artwork's own `--dur` — two seconds, one full sun-to-night
 * -to-sun turn. Which is the trap: seeking a whole number of days is seeking a
 * whole number of TURNS, so every day lands on frame zero and you get broad
 * daylight for all ninety of them. The moon was stepping through its phases
 * correctly the entire time and never once being on screen for it.
 *
 * So odd days are nudged 45% into the cycle, which is the middle of that day's
 * night. Even days keep the sun. Dragging the track then alternates day, night,
 * day, night — one per day, which is what "days are passing" looks like — and
 * because the slow clock still lands inside the right step, every moon shown is
 * that day's true phase. Across ninety days you get about three lunations.
 */
export function seekClock(el, day, dayLength = 2) {
  const NIGHT = 0.45;                       // safely inside the 19–71% night
  const at = day + (Math.round(day) % 2 ? NIGHT : 0);
  el.style.setProperty('--seek', `${(-at * dayLength).toFixed(3)}s`);
}
