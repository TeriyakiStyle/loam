# LOAM — Soil System

**Authoritative specification · system version 1.2 · 8 September 2026**

Implement this specification through the [Soil–Plant Adapter](SOIL-PLANT.md),
which satisfies the [Growing-System–Plant Contract](GROWING-SYSTEM-PLANT.md).
The [Plant System](PLANT.md) is independent of soil. These specifications
define required behavior, independently of implementation status.

## Purpose and scope

Soil is persistent ground that stores accessible resources, responds to work,
supplies plants and receives residues. A plant draws from specific resources;
it does not spend a universal “soil quality” percentage.

Version 1 is an explicit game abstraction: accessible water, separate N/P/K
budgets, root access and delayed nutrient return. It does not simulate chemical
species, physical soil-test concentrations, pH, microbes, nitrogen fixation,
carbon cycling, weather or hydraulic transport. Those processes must not be
implied by labels or inferred from unrelated game indices.

## Ownership

- Ground cells own soil; each cell represents 1 m². Beds hold cell IDs only.
- Soil owns its water, available nutrients, structure and residue records.
- Plants own nutrients already acquired. Inventory owns exported harvests.
- The host owns time, IDs, observations, work orders, transactions and saves.
- Soil never imports Plant, beds, inventory, rendering or story systems.
- Deleting or resizing a bed does not reset soil or remove residues.

## State

| Field | Type / unit | Invariant |
|---|---|---|
| `waterL` | litres of plant-accessible water | `0 <= waterL <= capacityL` |
| `capacityL` | litres | Finite and greater than zero |
| `available` | `{n,p,k}` nutrient game units | Each finite and nonnegative |
| `structure` | dimensionless 0–1 | Root-access condition; not consumable |
| `residues` | array of `Residue` | Unique IDs, nonnegative holdings |

A `Residue` contains `id`, `receivedDay`, `nutrients:{n,p,k}`, and
`releaseFractionPerDay` in [0,1]. N/P/K are separate accounting currencies,
not interchangeable and not grams, ppm or dietary nutrient measurements.
There is no conversion from these units to fertilizer recommendations.

`waterL` is an accessible bucket, not total soil water. On a 1 m² cell, one
litre of application corresponds to 1 mm depth; that does not establish field
capacity or wilting point. Fertility is a description of multiple supplies,
not a fourth resource pool.

The host retains `examined` and `tilled` metadata on the cell. Examination
changes what a player knows, never the underlying resource amounts.

## Public operations

Every operation is deterministic, validates its inputs and returns a new
record. No argument mutation, timers, storage access or random draws.

| Operation | Inputs | Output |
|---|---|---|
| `createSoil` | Validated initial state | `SoilState` |
| `offerResources` | Soil state | `{available:{waterL,n,p,k}, rootSupport}` |
| `applySoilExchange` | Soil state, actual `taken:{waterL,n,p,k}` | New soil state |
| `releaseResidues` | Soil state, integer `day` | `{soil, released:{n,p,k}}` |
| `receiveResidue` | Soil state, residue | New soil state |
| `applyTreatment` | Soil state, treatment, integer day | `{soil, addedWaterL, overflowL, addedNutrients, structureChange}` |

`offerResources` returns the stored supplies and `rootSupport=structure`.
The adapter supplies common slot validation and diagnostic metadata.
It also supplies the required germinationSupport value, as defined in its
specification. Seed hydration is a water debit; seed reserves are not soil debits.
An offer is read-only: it does not reserve or remove anything.
`applySoilExchange` deducts actual uptake once. Reject a request exceeding
available supplies; do not silently create resources or hide a caller error.

## Treatments

The host translates a completed work cell into one treatment. It commits the
inventory charge and soil result together. Soil itself cannot charge inventory.

| Treatment | Required input | Result |
|---|---|---|
| Water | Nonnegative litres | Accept `min(input, capacityL-waterL)`; report the remainder as overflow |
| Compost | Residue ID, N/P/K vector, release fraction | Add to residues; no immediate available-nutrient increase |
| Till | Structure increment in [0,1] | Clamp structure to 1; report actual change |

Till does not supply nutrients. Water does not restore a fertility score.
The host excludes tilling occupied cells in version 1. Preparation actions
are available choices, not a universal requirement to till or amend.

Scenario configuration supplies quantities per action and matching inventory
costs. A request for water spends the full applied quantity even if some
overflows; the report makes that loss visible. No passive water loss, rain,
drainage or capacity changes occur within this system version.

## Residue release

For each residue with `receivedDay < day`, process each element independently:

```text
released = residue.nutrients[element] * residue.releaseFractionPerDay
residue.nutrients[element] -= released
soil.available[element] += released
```

Residues received today cannot release until tomorrow. Empty cells release
residues too. The rate is a configured game rate, not a measured decomposition
law. Do not discard small positive holdings; floating-point comparisons use
the contract's tolerance. Exactly empty residues may be removed.

Plants cannot immediately reclaim nutrients still held in residue. Harvested
nutrients that left the ground are not included in this return. No process
creates nitrogen or other nutrients implicitly.

The receiving soil configuration owns release fractions. Plant harvests
supply nutrient parcels without a rate or destination. The host selects the
destination and supplies this soil's configured policy on receipt. Reject
duplicate parcel IDs. Soil must not pull residue out of another module's
inventory or automatically capture every harvested plant.

## Player-facing information

Expose water, N/P/K supplies, structure, and pending residue return separately.
The journal uses the contract's daily report for flow explanations. It does
not compute another nutrient model. Unknown cells remain unknown to ordinary
UI until examined; the host enforces that visibility rule.

For occupied cells, recommendations follow reported shortages. For an empty
cell with a selected species, preview the first day's request against today's
offer and clearly label it a preview. Sum quantities over a bed; never average
its soil state back into each cell.

## Configuration and persistence

Initial water, capacity, N/P/K, structure and treatment parameters are required
scenario data. There are no silent fallback budgets. Each parameter set has
an ID, version, units, provenance and a classification of `test` or `calibrated`.
Test configurations must be labeled as such wherever results are presented.

Serialize every state field and residue, without UI-derived caches. Loading
must validate ranges and unique residue IDs. Changing a bed does not change
state IDs. Save-version and legacy handling belong to the host contract.

## Acceptance criteria

1. Water addition closes: previous water + applied = new water + overflow.
2. Uptake reduces each resource by exactly the reported taken quantity.
3. An offer leaves the input and next state unchanged.
4. Residue release conserves each element between residue and available pools.
5. Newly received residues release nothing on the receipt day.
6. Invalid values, overdrafts and duplicate residue IDs fail without mutation.
7. Removing/recreating a bed leaves all ground and residue state unchanged.
8. Save/load followed by a daily step matches an uninterrupted run.
