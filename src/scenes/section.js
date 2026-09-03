// ---------------------------------------------------------------------------
// SECTION — a placeholder screen for a sequence that isn't built yet.
//
// One factory instead of four near-identical files. When a section grows real
// content, give it its own scene file and swap it into the routes in main.js.
// ---------------------------------------------------------------------------

export function section(heading, note = '', placeholder = "This sequence isn't built yet.") {
  return {
    render(el, _store) {
      el.innerHTML = `
        <section class="page">
          <h1>${heading}</h1>
          ${note ? `<p class="lede">${note}</p>` : ''}
          <p class="placeholder">${placeholder}</p>
        </section>
      `;
      return () => {};
    },
  };
}
