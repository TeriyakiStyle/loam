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

/**
 * Rewrite a stylesheet so it can only reach inside `.clock-art`.
 * Keyframe names are prefixed too — those are global no matter where the
 * rule sits, and `rays` is a plausible enough name to collide one day.
 */
function scopeCSS(css) {
  for (const name of [...css.matchAll(/@keyframes\s+([\w-]+)/g)].map(m => m[1])) {
    css = css.replace(new RegExp(`@keyframes\\s+${name}\\b`, 'g'), `@keyframes sm-${name}`);
    css = css.replace(
      new RegExp(`(animation(?:-name)?\\s*:[^;}]*?)\\b${name}\\b`, 'g'), `$1sm-${name}`);
  }

  // Prefix ordinary selectors. At-rule preludes start with @ and are excluded
  // by the character class; keyframe stops (`0%`, `from`) are skipped by hand.
  return css.replace(/(^|[}{;])\s*([^{}@][^{}]*?)\{/g, (whole, before, selector) => {
    if (/^\s*(\d|from\b|to\b)/.test(selector)) return whole;
    const scoped = selector.split(',')
      .map(s => s.trim())
      .filter(Boolean)
      .map(s => (s === 'svg' ? `.${SCOPE}` : `.${SCOPE} ${s}`))
      .join(', ');
    return `${before} ${scoped} {`;
  });
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
 * Park the artwork on a given day. `dayLength` is the artwork's own `--dur`,
 * two seconds, so ninety days is a hundred and eighty seconds in — about three
 * lunations, which is roughly what a season is.
 */
export function seekClock(el, day, dayLength = 2) {
  el.style.setProperty('--seek', `${(-day * dayLength).toFixed(2)}s`);
}
