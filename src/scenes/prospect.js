// ---------------------------------------------------------------------------
// PROSPECT — a look down the year.
//
// This screen is a drawing, not an instrument. Nothing on it is computed from
// a plan, because there is no plan yet: plantings, storage losses and the
// weather all have to exist before this can tell the truth. What it is for is
// to fix the SHAPE of the answer while the parts are still being built —
// six bands, a floor that belongs to the lowest of them, and a path that
// climbs into winter.
//
// The art file holds the whole picture. This one gives it a page.
// ---------------------------------------------------------------------------

import { prospectSVG, runProspect, BANDS } from '../art/prospect.js';

const legend = BANDS.map(b => `
    <li><span class="pr-dot" style="background:${b.tone}"></span>${b.label}</li>`).join('');

export function render(el, _store) {
  el.innerHTML = `
    <section class="page prospect">
      <h1>Prospect</h1>
      <p class="lede">A year ahead, and what is under your feet for each of it.</p>

      <figure class="pr-figure">
        ${prospectSVG()}
        <ul class="pr-legend">${legend}</ul>
        <figcaption>
          Six bands, all measured the same way: what you have of that one thing
          against what you need of it. The ground is whichever band is lowest,
          so the floor changes hands through the year. The path he walks is the
          requirement — it climbs through winter, because a cold body asks for
          more. Where the ground falls below the path there is nothing beneath
          him, and the size of that hole is the size of the hunger.
        </figcaption>
      </figure>

      <p class="pr-note">
        Here the stores never run out of calories. What opens the gap is
        vitamin C, which keeps badly and comes back all at once with the first
        spring greens. Doubling the potato harvest would not raise the floor
        by a finger's width.
      </p>

      <p class="placeholder">
        Concept only — every curve is drawn by hand. Nothing is wired to a
        simulation yet.
      </p>
    </section>
  `;

  const stop = runProspect(el);
  return () => stop();
}
