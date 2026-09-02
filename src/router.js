// ---------------------------------------------------------------------------
// THE ROUTER
//
// Gives each screen its own URL and makes the browser Back button work,
// using the part of the URL after the "#". Hashes matter here: GitHub Pages
// serves plain files, so "/field" would 404, but "#/field" never leaves
// index.html. Same result, no server configuration.
// ---------------------------------------------------------------------------

export function createRouter(routes, fallback = '/') {
  function current() {
    const path = location.hash.slice(1) || fallback;
    return routes[path] ? path : fallback;
  }

  return {
    current,
    // Call this whenever the route changes. Returns an unsubscribe function.
    onChange(fn) {
      const handler = () => fn(current());
      addEventListener('hashchange', handler);
      return () => removeEventListener('hashchange', handler);
    },
  };
}

export function go(path) {
  location.hash = path;
}
