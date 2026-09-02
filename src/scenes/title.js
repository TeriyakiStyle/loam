// ---------------------------------------------------------------------------
// TITLE SCENE — the front page.
//
// The cube is the way in: it's a real link, so it works with the keyboard,
// middle-click and the Back button without any of that being written here.
// The quote is drawn at random from assets/quotes.txt on each visit.
// ---------------------------------------------------------------------------

import { cubeSVG, SOILS } from '../art/cube.js';
import { loadQuotes, pick } from '../quotes.js';

export function render(el, _store) {
  el.innerHTML = `
    <section class="title-scene">
      <img class="wordmark" src="assets/wordmark-loam.svg" alt="LOAM" width="141" height="38">

      <a class="cube-link" href="#/field" aria-label="Enter">
        ${cubeSVG(SOILS.loam, 256)}
      </a>

      <figure class="quote" data-quote>
        <blockquote data-quote-text></blockquote>
        <figcaption data-quote-author></figcaption>
      </figure>
    </section>
  `;

  let alive = true;

  loadQuotes()
    .then(quotes => {
      if (!alive || !quotes.length) return;
      const quote = pick(quotes);
      el.querySelector('[data-quote-text]').textContent = `“${quote.text}”`;
      el.querySelector('[data-quote-author]').textContent = quote.author;
      el.querySelector('[data-quote]').classList.add('is-ready');
    })
    .catch(() => { /* no quotes file, no quote — the page still works */ });

  return () => { alive = false; };
}
