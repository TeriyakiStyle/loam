// ---------------------------------------------------------------------------
// TITLE SCENE — the front page.
//
// Every scene is the same shape: it gets an element and the store, fills the
// element, and returns a function that cleans up after itself. Nothing else
// in the app needs to know what's inside.
// ---------------------------------------------------------------------------

import { cubeSVG, SOILS } from '../art/cube.js';

export function render(el, _store) {
  el.innerHTML = `
    <section class="title-scene">
      <img class="wordmark" src="assets/wordmark-loam.svg" alt="LOAM" width="141" height="38">
      ${cubeSVG(SOILS.loam, 256)}
      <p class="tagline">A garden that keeps its own time.</p>
      <a class="enter" href="#/field">Enter</a>
    </section>
  `;

  return () => {};   // nothing to tear down yet
}
