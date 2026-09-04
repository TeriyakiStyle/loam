// ---------------------------------------------------------------------------
// STAGE
//
// The shared vocabulary both sequences are built from: a centre, a ring of
// slots around it, and pieces that move between the two. Physical breaks one
// thing into many; Biological gathers many into one. Same grammar either way.
// ---------------------------------------------------------------------------

export function pieceHTML(id, piece, { tag = 'div', attrs = ' aria-hidden="true"' } = {}) {
  return `<${tag} class="piece" data-piece="${id}" style="--art:${piece.scale}"${attrs}>
        <img src="${piece.src}" alt="" draggable="false">
        <span class="piece-label">${piece.label || ''}</span>
      </${tag}>`;
}

// Returns the helpers a scene needs to move things around its own stage.
export function stageOps(stage, slots, slotCount) {
  const piece = id => stage.querySelector(`[data-piece="${id}"]`);
  const step = 360 / slotCount;

  // A slot is either an index on the ring — evenly spaced, clockwise from the
  // top — or an explicit [x, y] direction, for a scene that wants a shape the
  // ring doesn't give it. Lengths under 1 pull a piece in towards the centre.
  function direction(id) {
    const slot = slots[id];
    if (Array.isArray(slot)) return slot;
    const angle = (-90 + slot * step) * Math.PI / 180;
    return [Math.cos(angle), Math.sin(angle)];
  }

  return {
    piece,

    // 'centre' | 'ring' | 'away'
    place(id, where) {
      const node = piece(id);
      node.dataset.at = where;
      if (where === 'ring') {
        const [dx, dy] = direction(id);
        node.style.setProperty('--dx', dx.toFixed(4));
        node.style.setProperty('--dy', dy.toFixed(4));
      } else {
        node.style.setProperty('--dx', '0');
        node.style.setProperty('--dy', '0');
      }
    },

    mark(id, on) {
      piece(id).classList.toggle('is-marked', on);
    },

    hide(...ids) {
      for (const id of ids) piece(id).dataset.at = 'away';
    },
  };
}
