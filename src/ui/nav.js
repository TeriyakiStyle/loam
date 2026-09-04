// ---------------------------------------------------------------------------
// NAV BAR
//
// Shown on every screen except the title page.
//
// SECTIONS are the game itself — each leads to its own sequence.
// UTILITY is everything else, kept visually apart so it doesn't compete.
//
// An entry with `items` becomes a dropdown; an entry with `href` is a plain
// link. That distinction is what makes it work with a keyboard and a screen
// reader without any extra code.
// ---------------------------------------------------------------------------

import { cubeSVG, SOILS } from '../art/cube.js';

const SECTIONS = [
  { label: 'Physical',     href: '#/physical' },
  { label: 'Biological',   href: '#/biological' },
  { label: 'Sow and Grow', href: '#/sow' },
];

const UTILITY = [
  { label: 'About', href: '#/about' },
  {
    // Reference material. These two are a guess at what belongs here —
    // rename or replace the list, the markup follows it.
    label: 'Appendix',
    items: [
      { label: 'The texture triangle', href: '#/texture-triangle' },
      { label: 'Soil components',      href: '#/soil-components' },
    ],
  },
  {
    label: 'Resources',
    items: [
      { label: 'ISRIC — World Soil Information', href: 'https://isric.org/', external: true },
    ],
  },
  { label: 'Contact', href: '#/contact' },
];

// Purely decorative: it says "these run in order" and nothing else, so it is
// hidden from screen readers — the <ol> already carries that meaning for them.
const ARROW = `<li class="bar-arrow" aria-hidden="true">
        <svg viewBox="0 0 14 8"><path d="M0.5 4h12M9.5 1l3 3-3 3"
             fill="none" stroke="currentColor" stroke-width="1.2"
             stroke-linecap="round" stroke-linejoin="round"/></svg>
      </li>`;

const CHEVRON = `<svg class="chev" viewBox="0 0 12 8" aria-hidden="true">
    <path d="M1 1.5 6 6.5 11 1.5" fill="none" stroke="currentColor"
          stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;

const EXTERNAL = `<svg class="ext" viewBox="0 0 12 12" aria-hidden="true">
    <path d="M4.5 1.5h6v6M10.5 1.5 5 7M8 9.5v1h-7v-9h1" fill="none" stroke="currentColor"
          stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;

function itemHTML(entry, index) {
  if (!entry.items) {
    return `<li class="bar-item">
        <a class="bar-link" href="${entry.href}">${entry.label}</a>
      </li>`;
  }

  const id = `bar-menu-${index}`;
  const links = entry.items.map(item => `
        <li><a href="${item.href}"${item.external ? ' target="_blank" rel="noopener noreferrer"' : ''}>
          <span>${item.label}</span>${item.external ? EXTERNAL : ''}
        </a></li>`).join('');

  return `<li class="bar-item has-menu">
      <button type="button" class="bar-link" data-menu-button
              aria-expanded="false" aria-controls="${id}">
        ${entry.label}${CHEVRON}
      </button>
      <ul class="bar-menu" id="${id}" hidden>${links}
      </ul>
    </li>`;
}

export function navHTML() {
  return `
    <nav class="bar" aria-label="Main">
      <a class="bar-home" href="#/" aria-label="LOAM — front page">
        ${cubeSVG(SOILS.loam, 34)}
      </a>
      <ol class="bar-items bar-sections">
        ${SECTIONS.map(itemHTML).join('\n        ' + ARROW + '\n        ')}
      </ol>
      <ul class="bar-items bar-utility">
        ${UTILITY.map((entry, i) => itemHTML(entry, `u${i}`)).join('\n        ')}
      </ul>
    </nav>`;
}

// Wires up the dropdowns. Returns a cleanup function.
export function wireNav(root) {
  const groups = [...root.querySelectorAll('.has-menu')].map(li => ({
    li,
    button: li.querySelector('[data-menu-button]'),
    menu:   li.querySelector('.bar-menu'),
  }));

  function close(group) {
    group.menu.hidden = true;
    group.button.setAttribute('aria-expanded', 'false');
  }

  function closeAll(except) {
    for (const g of groups) if (g !== except) close(g);
  }

  function onButtonClick(event) {
    const group = groups.find(g => g.button === event.currentTarget);
    const isOpen = group.button.getAttribute('aria-expanded') === 'true';
    closeAll(group);
    if (isOpen) { close(group); return; }
    group.menu.hidden = false;
    group.button.setAttribute('aria-expanded', 'true');
  }

  function onDocumentPointer(event) {
    if (!root.contains(event.target)) closeAll();
  }

  function onKeydown(event) {
    if (event.key !== 'Escape') return;
    const open = groups.find(g => !g.menu.hidden);
    if (!open) return;
    close(open);
    open.button.focus();
  }

  // Closing a menu when focus tabs out of it keeps keyboard and mouse in step.
  function onFocusOut(event) {
    for (const group of groups) {
      if (!group.menu.hidden && !group.li.contains(event.relatedTarget)) close(group);
    }
  }

  groups.forEach(g => g.button.addEventListener('click', onButtonClick));
  document.addEventListener('pointerdown', onDocumentPointer);
  document.addEventListener('keydown', onKeydown);
  root.addEventListener('focusout', onFocusOut);

  return () => {
    groups.forEach(g => g.button.removeEventListener('click', onButtonClick));
    document.removeEventListener('pointerdown', onDocumentPointer);
    document.removeEventListener('keydown', onKeydown);
    root.removeEventListener('focusout', onFocusOut);
  };
}

// Marks the current section in the bar so you can see where you are.
export function setActive(root, path) {
  root.querySelectorAll('.bar-link[href]').forEach(link => {
    const isCurrent = link.getAttribute('href') === `#${path}`;
    link.classList.toggle('is-active', isCurrent);
    if (isCurrent) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
}
