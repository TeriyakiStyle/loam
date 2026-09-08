# Bed workshop

The `/loam` route is a standalone adapter around reusable, browser-independent simulation modules.

## Ownership

- `soil.js`: per-cell soil state, quality calculation, and soil treatments. No plant dependency.
- `plants.js`: species registry, growth, and lifetime-average quality yield. Receives a numerical soil-quality sample, never a soil object.
- `world.js`: terrain, bed membership, actor routing, work orders, inventory, clock and domain events. This is the small workshop host; a larger game's host can replace it.
- `view.js`: isometric SVG projection and procedural artwork; no simulation updates.
- `scenes/loam.js`: DOM controls, animation scheduling and localStorage adapter. Cleanup stops the loop and saves state.

The land owns soil and plants. Beds only reference cells. Removing a boundary preserves soil and crops; marking a new boundary can expose them again. A work order records its remaining cells and current progress. Resources are spent only when a cell completes. Walk/stop interrupts the remaining order without reverting completed work.

## Contracts for integration

Advance work with `tick(world, seconds)`; issue explicit commands (`addBed`, `startJob`, `walk`, `advanceDays`). The host passes time; the domain has no timers or browser imports. The small world inventory is the future integration point for market/inventory adapters. `events` is a bounded recent-event journal, not a durable story event bus; a larger host should consume and persist events once with its own IDs. Health, relationships and narrative should react to work outcomes rather than being added to soil or plant modules.

Save schema version 1 is stored under `loam.bed-workshop.v1`. Unsupported saves are rejected, not silently interpreted as a current schema. Add explicit migration functions when changing saved structure. Units: one cell = 1 m², food = kg, water = L, crop age = days. Future terrain edits must retain cell IDs and shared corner heights.

## First-pass assumptions

Species definitions are game parameters, not calibrated agricultural evidence. Quality is 40% fertility, 35% structure, 25% moisture. A constant 0.9 quality gives 0.9 of configured potential yield. Varying quality is integrated over crop age; growth stops contributing at maturity. No drought mortality, weather, daily moisture loss, nutrient depletion, seasonal planting windows, obstacles, erosion or hydraulic simulation yet. Current terrain is walkable with height-sensitive movement speed.

Work seconds and calendar days are separate intentionally. Days only advance while no work/movement is active. Replenishing workshop supplies is free. Till is a prototype structure treatment, not a universal recommendation for real soils.

## Artwork

Terrain, gardener, plants and UI are original procedural vector artwork, with no third-party asset dependencies. Kenney's CC0 Tiny Town pack (https://kenney.nl/assets/tiny-town) was reviewed; its orthographic pixel artwork was not imported because this prototype uses continuous isometric slopes. Future external assets must include their source and license alongside the files.

## Checks

`node --test tests/workshop.test.mjs` covers yield integration, interrupted work, resource exhaustion, saving, boundary removal, overlap and the full crop loop.
