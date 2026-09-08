# LOAM — Game Design Document

A framework, not a finished design. Most of this is scaffolding waiting to be
filled in. What's here is marked so you can tell the difference:

- **[decided]** — settled, and it would take a real argument to move it
- **[proposed]** — on the table, not yet chosen
- **[open]** — a question with no answer yet

---

## How to use this document

Four layers, in descending order of how long they last. They are usually all
called "pillars," which is why they get conflated. They do different jobs.

| Layer | What it is | What it's for |
|---|---|---|
| **Mission** | Why the game exists, and its effect on the player | Points outward. Doesn't arbitrate features. |
| **Design principles** | Qualities every part of the game must honor | Says *no*. Settles arguments. |
| **Gameplay pillars** | The load-bearing activity categories | Scope. A feature belongs to one, or it's out. |
| **Loops** | The concrete repeated sequences inside each pillar | The actual thing you build. |

Principles are derived from the mission. Pillars are tested against every
principle. Loops live inside pillars.

**The three questions.** For any feature, ask them separately:

1. Which pillar does this belong to? *(scope — if none, cut it)*
2. Does it violate a principle? *(quality — if yes, fix it or cut it)*
3. Does it serve the mission? *(purpose — if no, it's someone else's game)*

A feature can pass one and fail another. Knowing which one failed tells you
whether to fix it or drop it.

---

## 1. Mission

> **Instill a respect for the complex system that feeds us.** **[decided]**

This points at the player, not at the game. It's the reason the project
exists, and every principle below should trace back to it.

It deliberately doesn't say no to anything. That isn't its job.

### What "respect" means here

Not reverence, and not mystification. Respect is what you feel for a system
you understand well enough to see how much of it you don't control. The game
earns it by being legible and by refusing to be conquered — which is where
the first principle comes from.

---

## 2. Design principles

The layer that cuts. Each one should be able to kill a feature you like.

### The system is knowable, but never solvable **[proposed]**

Both halves do work.

*Knowable* — no hidden rolls, no opaque randomness. When the crop fails the
player must always be able to reconstruct why, given enough attention. A
player who can't diagnose a failure learns nothing from it.

*Never solvable* — no optimal build, no correct answer, no state where the
acre is finished and agriculture has been beaten. The moment a build order
always works, respect turns into mastery of a puzzle.

**Says no to:** hidden dice, difficulty-by-obscurity, a meta build, an
end state.

### Accuracy over convenience **[decided]**

Real soil, real phenology, real seasons. Where accuracy and fun conflict,
accuracy wins.

This is a *constraint*, not the goal — the reason to reach for it is that a
real system is the most convincing not-solvable system available. Naming it
this way matters, because the day accuracy and the mission genuinely conflict
you want to already know which wins.

**Says no to:** fictional chemistry for convenience, plants out of season,
numbers tuned for feel against the record.

### Consequences arrive late **[proposed]**

You harvest what you decided months ago. Feedback is separated from its cause
in time, and often in space.

**Says no to:** undo, instant feedback, a failure diagnosable in the moment.

### Never say the lesson out loud **[proposed]**

The game argues through mechanics. No character delivers the thesis. If the
player has to be told what to take from it, the systems failed.

**Says no to:** the essay in an NPC's mouth, the summary screen that explains
what you should have felt.

### The acre's limit is allocation, not capacity **[decided]**

One acre is genuinely enough to farm sustainably — Fortier ran about an acre
and a half commercially, and biointensive methods push a subsistence diet into
a fraction of that. The game must never claim otherwise.

The real constraints are **allocation** and **fertility**. Every square foot in
grain isn't in vegetables. Closing the fertility loop on one acre is hard, and
historically small holdings imported it — manure, seaweed, mill offal, night
soil. Self-sufficiency is largely a modern myth; peasant agriculture was always
networked through mills, commons, seed exchange and markets.

So the argument isn't *you can't do it alone*, which is false and which any
homesteader would rightly reject. It's *doing it alone costs you everything
else you could have done*. That's true, specific, and felt every time the
player allocates a bed.

**Says no to:** the acre as a place of scarcity, visits framed as charity,
any number implying one acre can't feed a household.

---

## 3. Gameplay pillars

Four categories. **[decided]** — the set is chosen; the contents are not.

They work because they run at **different tempos** and nest. Pyre had one loop
because it had one tempo. LOAM has four because it has four, which is a
structure rather than a lack of focus. The failure mode isn't having four —
it's having four at the same tempo.

### Investigation — *moment to moment* **[proposed as primary]**

A question you can ask and answer today. The scan, the profile, the diagnosis,
the test bed, the comparison.

This is the pillar nothing else in the genre does well, and the only one that
the accuracy constraint uniquely buys. It's what turns real soil from a burden
into the point. If depth has to be sacrificed somewhere, not here.

- **[open]** What is the smallest satisfying investigation? The one you do
  fifty times without tiring of it.
- **[open]** How is a finding recorded? Does the player keep notes, or does
  the game?

### Survival — *the season*

The food-store line. Winter as the hill to climb. Six bands of nutrition, so
the line can fall to famine on a full larder that carried no vitamin C.

Provides the pressure that makes the other three matter. Without it, nothing
is at stake.

- **[open]** Does famine end a run, or scar it? A slow game with a hard fail
  state is a slow game people stop playing.

### Social — *episodic, between seasons*

Invitations, visits, exchange between specialists. Authored beats punctuating
systemic stretches. Still images with dialogue.

- **[open]** One-shot invitation or standing? Probably both — most acres
  one-shot, a few characters eventually leaving the door open.
- **[open]** How many characters, realistically, for a solo project?

### Mastery — *the campaign*

The acre becoming a build. Knowledge compounding across years. Entry into
higher systems.

**The tension to resolve:** mastery pulls directly against *never solvable*.
The version worth defending is that the player masters their **practice**, not
the system — knowledge compounds, the weather never becomes yours, the acre
never becomes finished. That keeps both, but only if mastery never resolves
into a build order that always works.

- **[open]** Which side wins when they conflict? Every number in the game
  depends on this answer.

### Not yet a pillar: place

The acre is a prison you'll spend years looking at, and the project has a
strong visual identity already. Whether the acre is somewhere the player
*wants to look at* — arranged, theirs, changing across seasons — does real
work in games like this, and none of the four covers it.

- **[open]** Is place a fifth pillar, or is it art direction serving the
  other four?

---

## 4. Setting

### The premise **[decided]**

A fantasy world where everyone is placed on one acre of land. No one really
knows why. The characters have simply adapted to it.

### The acre is a prison **[decided]**

A hard constraint, not a soft social one. You cannot leave.

### The invitation is a spell **[decided]**

It works like inviting in a vampire: crossing the boundary requires the
host's permission. Three things follow from choosing that rule specifically
rather than a generic key:

- **The host controls it.** Invitations can't be found or bought. Someone has
  to choose to let you in, so progression is reputation and relationship, not
  collection.
- **It can be revoked.** A visit you can be thrown out of gives you a
  consequential failure state that isn't a reload.
- **It's symmetric.** Bringing techniques home eventually means inviting
  someone onto *your* acre — giving a stranger power over your soil. Hosting
  becomes a decision with risk, which is the mission argued as a mechanic.

### Presentation **[decided]**

Characters as still images with dialogue, in the manner of Supergiant's Pyre.

### Open questions

- **[open]** Who cast the spell? Pyre had the Rites — an authority with rules,
  and the player's relationship to it was the spine of the game. This doesn't
  need answering yet, but whether an answer *exists* shapes every character.
- **[open]** Tone. Prison plus slow farming can read grim fast. Pyre's exile
  stayed warm because the characters were. The built-in answer here: the world
  is a prison, and hospitality is the way out — worth writing toward
  deliberately rather than hoping for.

---

## 5. Loops

**[open] — undefined, and correctly the last thing.**

The visits are not the core loop. They're meta-progression: episodic, authored,
expensive to make, and too infrequent to carry the game.

The core loop is more likely something done many times per season on your own
acre, where you make a legible decision, wait, and read the result. Given the
pillars, it should most directly produce *investigation, on a seasonal delay*.

### What a good answer looks like

- Repeats often enough to build skill
- Uses the same verbs every time — variety comes from constraints, not from
  new mechanics
- Produces a result the player can reason about after the fact
- Survives being run a hundred times

### The visit structure, once loops exist

Every visit should be a **scenario for the systems the player already has**,
not a bespoke minigame. This acre is heavy clay. That one is shaded half the
day. That one has a ninety-day season. That one solved closed-loop fertility.

That choice does three things at once: it keeps authoring cost sane, it lets
the player build real mastery because the verbs repeat, and it gives every
character a legible identity tied to a genuine agricultural problem.

- **[open]** What is the core loop?
- **[open]** What does the player bring home — technique, genetics, a fertility
  source, a tool? Probably several kinds, and they should change what the acre
  *can do* rather than unlock the next door.

---

## Decision log

Newest first. Keep it short; this is for remembering *why*, not what.

| Date | Decision |
|---|---|
| 2026-09-08 | Four gameplay pillars chosen: survival, investigation, mastery, social |
| 2026-09-08 | Invitation works by vampire rules — host grants, can revoke, symmetric |
| 2026-09-08 | The acre is a prison; the constraint is hard, not social |
| 2026-09-08 | Setting: everyone placed on one acre, reason unknown, Pyre-style stills |
