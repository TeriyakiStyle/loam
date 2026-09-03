// ---------------------------------------------------------------------------
// MAIN — the only file that knows about all the other files.
//
// It creates the store, maps URLs to scenes, and swaps them when the URL
// changes. Adding a screen is two lines: import it, list it below.
// ---------------------------------------------------------------------------

import { createStore, reduce, initialState } from './engine.js';
import { createRouter } from './router.js';
import { navHTML, wireNav, setActive } from './ui/nav.js';
import { section } from './scenes/section.js';
import * as title from './scenes/title.js';
import * as field from './scenes/field.js';
import * as contact from './scenes/contact.js';
import * as physical from './scenes/physical.js';

const routes = {
  '/':           { scene: title,   name: 'LOAM',              bar: false },
  '/field':      { scene: field,   name: 'LOAM — Field',      bar: true  },

  '/physical':   { scene: physical, name: 'LOAM — Physical',   bar: true  },
  '/biological': { scene: section('Biological'),
                                   name: 'LOAM — Biological', bar: true  },
  '/chemical':   { scene: section('Chemical'),
                                   name: 'LOAM — Chemical',   bar: true  },
  '/sow':        { scene: section('Sow'),
                                   name: 'LOAM — Sow',        bar: true  },

  '/about':      { scene: section('About', '', 'Nothing here yet.'),
                                   name: 'LOAM — About',      bar: true  },
  '/contact':    { scene: contact, name: 'LOAM — Contact',    bar: true  },
};

const store  = createStore(reduce, initialState);
const router = createRouter(routes, '/');
const root   = document.getElementById('app');
const header = document.getElementById('nav');

// The bar is built once and simply hidden on the title page, so its dropdowns
// don't have to be rewired every time you change screens.
header.innerHTML = navHTML();
wireNav(header);

let cleanup = null;

function show(path) {
  const route = routes[path];
  if (cleanup) cleanup();                 // let the old scene put itself away
  cleanup = route.scene.render(root, store);
  header.hidden = !route.bar;
  setActive(header, path);
  document.title = route.name;
}

router.onChange(show);
show(router.current());
