// ---------------------------------------------------------------------------
// INFO CARD
//
// One card node, reused. Point it at a trigger and an entry and it appears
// beside that trigger; press Escape, click the trigger again, or click
// anywhere else and it goes.
//
// Click rather than hover, and that is a decision rather than a shortcut.
// There is no hover on a phone; a keyboard gets nothing from it; a card that
// fires as the pointer crosses a dense chart fires constantly; and the main
// thing you do on this page is DRAG — a card that opens because the pointer
// passed over a letter on its way to a dial is in the way of the very gesture
// it interrupted. A click is a request. Only requests get answered.
//
// The card is absolutely positioned inside its host, so it costs the document
// no height and opening one cannot move anything else on the page.
//
// Knows nothing about soil: give it a list of fields and hand it objects.
// ---------------------------------------------------------------------------

const EDGE = 10;   // clear space kept between the card and the host's edge
const GAP  = 12;   // between the trigger and the card
const TALL = 300;  // past this it scrolls rather than swallowing the page

let seq = 0;

/**
 * @param host    the positioned element the card lives inside
 * @param fields  [{ key, label }] — rendered in this order, blanks skipped
 */
export function cardOps(host, fields) {
  const id = `card-${++seq}`;
  const node = document.createElement('div');
  node.className = 'card';
  node.hidden = true;
  node.tabIndex = -1;
  node.setAttribute('role', 'dialog');
  node.setAttribute('aria-labelledby', `${id}-title`);
  node.innerHTML = `
    <button type="button" class="card-close" data-close aria-label="Close">
      <svg viewBox="0 0 12 12" aria-hidden="true">
        <path d="M2 2l8 8M10 2l-8 8" fill="none" stroke="currentColor"
              stroke-width="1.4" stroke-linecap="round"/>
      </svg>
    </button>
    <h2 class="card-title" id="${id}-title" data-title></h2>
    <p class="card-tagline" data-tagline></p>
    <p class="card-meta" data-meta></p>
    <dl class="card-body" data-body></dl>`;
  host.append(node);

  const titleEl   = node.querySelector('[data-title]');
  const taglineEl = node.querySelector('[data-tagline]');
  const metaEl    = node.querySelector('[data-meta]');
  const bodyEl    = node.querySelector('[data-body]');

  let current = null;   // the trigger the open card belongs to

  /**
   * Sit the card beside its trigger: centred on it horizontally, below it if
   * there is room and above it if there isn't.
   *
   * All of this is worked out in viewport coordinates and converted to the
   * host's at the last line — which is what lets an SVG letter inside a
   * scaled drawing and a plain HTML button both be pointed at by the same
   * code, and what lets the card be kept ON SCREEN rather than merely inside
   * its host. The host is taller than the window on most laptops, so those
   * are two different constraints and only one of them is any use to a
   * reader.
   */
  function place(trigger) {
    node.style.left = '0px';
    node.style.top  = '0px';
    node.style.maxHeight = '';
    node.classList.remove('is-scrollable');

    const h = host.getBoundingClientRect();
    const t = trigger.getBoundingClientRect();

    // The band the card may occupy: inside the host AND inside the window.
    const top    = Math.max(h.top + EDGE, EDGE);
    const bottom = Math.min(h.bottom - EDGE, window.innerHeight - EDGE);
    const left   = Math.max(h.left + EDGE, EDGE);
    const right  = Math.min(h.right - EDGE, window.innerWidth - EDGE);

    // Never taller than that band, and never taller than a comfortable read.
    // If the text doesn't fit, the card says so with a fade rather than a cut.
    const ceiling = Math.min(TALL, bottom - top);
    if (node.offsetHeight > ceiling) {
      node.style.maxHeight = `${Math.round(ceiling)}px`;
      node.classList.add('is-scrollable');
    }
    const w = node.offsetWidth;
    const c = node.offsetHeight;

    const midX = t.left + t.width / 2 - w / 2;
    const x = Math.min(Math.max(midX, left), Math.max(left, right - w));

    const below = t.bottom + GAP;
    const above = t.top - GAP - c;
    const y0 = (below + c <= bottom) ? below : (above >= top ? above : below);
    const y = Math.min(Math.max(y0, top), Math.max(top, bottom - c));

    node.style.left = `${Math.round(x - h.left)}px`;
    node.style.top  = `${Math.round(y - h.top)}px`;
  }

  function open(trigger, entry) {
    titleEl.textContent   = entry.name || entry.title || '';
    taglineEl.textContent = entry.tagline || '';
    taglineEl.hidden      = !entry.tagline;
    metaEl.textContent    = entry.meta || '';
    metaEl.hidden         = !entry.meta;

    bodyEl.innerHTML = fields
      .filter(f => entry[f.key])
      .map(f => `<dt>${f.label}</dt><dd>${entry[f.key]}</dd>`)
      .join('');

    node.hidden = false;
    node.scrollTop = 0;
    place(trigger);

    if (current && current !== trigger) current.setAttribute('aria-expanded', 'false');
    current = trigger;
    trigger.setAttribute('aria-expanded', 'true');
    // preventScroll: the trigger is already on screen, and jumping the page
    // to satisfy the focus call would undo the point of a card that costs no
    // layout in the first place.
    node.focus({ preventScroll: true });
  }

  function close({ restore = true } = {}) {
    if (!current) return;
    node.hidden = true;
    current.setAttribute('aria-expanded', 'false');
    const was = current;
    current = null;
    if (restore) was.focus({ preventScroll: true });
  }

  /** Click a trigger: open it, or close it if it is already the open one. */
  function toggle(trigger, entry) {
    if (current === trigger) close();
    else open(trigger, entry);
  }

  function onPointerDown(event) {
    if (!current) return;
    if (node.contains(event.target)) return;
    // The trigger's own handler deals with a second click on itself.
    if (current.contains?.(event.target) || current === event.target) return;
    close({ restore: false });
  }

  function onKeydown(event) {
    if (event.key === 'Escape' && current) { event.stopPropagation(); close(); }
  }

  // Every position is measured, so anything that reflows the page
  // invalidates it. A page scroll just moves the trigger, so follow it; a
  // resize can change the whole layout under the card, so put it away
  // instead — it is a glance, not a panel, and the letter is still there.
  function onScroll() { if (current) place(current); }
  function onResize() { close({ restore: false }); }

  node.querySelector('[data-close]').addEventListener('click', () => close());
  document.addEventListener('pointerdown', onPointerDown);
  document.addEventListener('keydown', onKeydown);
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onResize);

  return {
    open, close, toggle,
    isOpen: trigger => (trigger ? current === trigger : Boolean(current)),
    destroy() {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeydown);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      node.remove();
    },
  };
}
