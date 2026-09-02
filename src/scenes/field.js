// ---------------------------------------------------------------------------
// FIELD SCENE — a stub.
//
// Its only job is to prove the wiring: a second URL, shared state, an action
// that changes that state, and a redraw when it does. There is no game design
// in here on purpose. Delete the body and put your real screen in it.
// ---------------------------------------------------------------------------

import { cubeSVG, SOILS } from '../art/cube.js';

export function render(el, store) {
  el.innerHTML = `
    <section class="field-scene">
      <img class="clock" src="assets/sun-moon.svg" alt="" width="64" height="64">
      <p class="day">Day <span data-day>${store.get().day}</span></p>
      ${cubeSVG(SOILS.loam, 160)}
      <button class="enter" data-wait>Wait a day</button>
      <a class="back" href="#/">Back</a>
    </section>
  `;

  const dayEl = el.querySelector('[data-day]');

  // The button does not change the day. It reports that something happened,
  // and the engine decides what that means. Keep this separation and the app
  // stays easy to reason about however big it gets.
  const onClick = () => store.dispatch({ type: 'day/advance' });
  el.querySelector('[data-wait]').addEventListener('click', onClick);

  const unsubscribe = store.subscribe(state => {
    dayEl.textContent = state.day;
  });

  return () => unsubscribe();
}
