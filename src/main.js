// ---------------------------------------------------------------------------
// MAIN — the only file that knows about all the other files.
//
// It creates the store, maps URLs to scenes, and swaps them when the URL
// changes. Adding a screen is two lines: import it, list it below.
// ---------------------------------------------------------------------------

import { createStore, reduce, initialState } from './engine.js';
import { createRouter } from './router.js';
import * as title from './scenes/title.js';
import * as field from './scenes/field.js';

const routes = {
  '/':      title,
  '/field': field,
};

const store  = createStore(reduce, initialState);
const router = createRouter(routes, '/');
const root   = document.getElementById('app');

let cleanup = null;

function show(path) {
  if (cleanup) cleanup();               // let the old scene put itself away
  cleanup = routes[path].render(root, store);
  document.title = path === '/' ? 'LOAM' : 'LOAM — Field';
}

router.onChange(show);
show(router.current());
