// ---------------------------------------------------------------------------
// THE ENGINE
//
// This file never touches the page. No document, no window, no HTML.
// It only knows what is true right now and how that changes.
//
// That one restriction is the whole architecture. Because the rules can't
// reach the screen, you can change how LOAM looks without touching how it
// works, and change how it works without touching how it looks.
//
// When you have real rules, they go here.
// ---------------------------------------------------------------------------

export const initialState = {
  day: 1,
  // Add your own facts here as the game grows: plots, weather, stock, whatever.
};

// A reducer answers one question: given the state now, and something that
// happened, what is the state after? It never modifies the old state — it
// returns a new one. That's what makes undo and replay easy later.
export function reduce(state, action) {
  switch (action.type) {

    case 'day/advance':
      return { ...state, day: state.day + 1 };

    // case 'plot/sow':
    //   return { ...state, plots: sow(state.plots, action.plotId) };

    default:
      return state;
  }
}

// A tiny store: holds the state, runs actions through the reducer, and tells
// anyone who's listening when something changed. About 15 lines, and it does
// the job Redux is famous for.
export function createStore(reducer, state = initialState) {
  const listeners = new Set();

  return {
    get() {
      return state;
    },

    dispatch(action) {
      const next = reducer(state, action);
      if (next === state) return;      // nothing changed, don't wake anyone
      state = next;
      for (const fn of listeners) fn(state);
    },

    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);   // call this to stop listening
    },
  };
}
