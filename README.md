# LOAM

A teaser front page, built to grow into the larger game.

There is no build step, no framework, and nothing to install. The files you
edit are the files that ship.

---

## Run it on your machine

You can't just double-click `index.html` — browsers block JavaScript modules
loaded straight off the disk. You need any tiny local server. Pick one:

```bash
# if you have Python (Mac and most Linux already do)
python3 -m http.server 8000

# if you have Node
npx serve
```

Then open the address it prints — usually <http://localhost:8000>.

In VS Code, the **Live Server** extension does the same thing with a click.

---

## Put it online with GitHub Pages

You do not need to learn git for this. The website works fine.

1. Go to <https://github.com/new>. Name the repository `loam`. Leave it
   **Public** — Pages needs that on a free account. Click **Create**.
2. On the empty repo page, click **uploading an existing file**.
3. Drag in *everything* from this folder — `index.html`, `README.md`,
   `.nojekyll`, and the `src`, `styles`, and `assets` folders. Drag the
   folders themselves so the structure is kept.
4. Click **Commit changes**.
5. Go to **Settings → Pages**. Under *Build and deployment*, set
   **Source** to `Deploy from a branch`, **Branch** to `main` and folder to
   `/ (root)`. Click **Save**.
6. Wait a minute or two, then reload that Settings page. Your address appears
   at the top: `https://YOUR-USERNAME.github.io/loam/`

To change something later, open the file on github.com, click the pencil
icon, edit, commit. The live site updates within a minute.

When editing in the browser starts to feel slow, that's the moment to install
[GitHub Desktop](https://desktop.github.com/) — it gives you a *Commit* and a
*Push* button and nothing else to learn.

---

## How it's put together

Six small files, and one idea holding them apart.

```
index.html            the shell — loads the CSS and starts main.js
styles/main.css       every colour, in one place
src/
  main.js             the only file that knows about all the others
  engine.js           the rules. Never touches the page.
  router.js           gives each screen a URL, makes Back work
  art/cube.js         the isometric cube. A soil type is three colours.
  scenes/title.js     the front page
  scenes/field.js     a stub that exists to prove the wiring
assets/               the SVG artwork
```

**The one rule worth keeping:** `engine.js` must never mention `document`,
`window`, or HTML. It only knows what is true and how that changes. Everything
else can be rewritten around it — you could throw away every scene and put
Three.js in their place, and the rules would not notice.

### Adding a screen

1. Copy `scenes/field.js` to `scenes/whatever.js`.
2. In `main.js`, import it and add one line to `routes`.

It's now at `#/whatever`, with a working Back button.

### Adding a soil type

In `src/art/cube.js`, add three colours to `SOILS`. That's the whole change —
there's no second drawing to make.

### Adding a rule

Add a `case` to the switch in `engine.js`. Scenes report what happened
(`store.dispatch({ type: 'day/advance' })`); the engine decides what it means.
Keep it that way round and this stays easy to reason about at ten times the
size.

---

## What to ignore for now

A finished, shipped application carries everything a finished application
needs: accounts, payments, multiplayer, automated opponents, a test suite,
server functions. All of that is real work worth doing eventually, and none
of it is work a teaser needs.

React and Next.js earn their keep when you're managing a lot of interface
state across many screens. A backend like Firebase earns its keep the day you
need accounts or saved games on someone else's device. Until then they are
mostly things to configure.

The part worth taking from a bigger codebase is the shape, not the stack, and
the shape is already here: rules separate from interface, artwork separate
from both. Add the rest when something you actually want to build is blocked
without it.
