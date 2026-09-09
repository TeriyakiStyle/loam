# LOAM — Growing-System–Plant Contract

**Authoritative specification · contract version 1.2 · 8 September 2026**

This contract defines the environment-independent boundary used by the
[Plant System](PLANT.md). The [Soil–Plant Adapter](SOIL-PLANT.md) implements
it for [Soil](SOIL.md). Other growing systems implement this same contract;
they do not require a different plant model.

## 1. Ownership and substitution

**A growing system owns resource delivery. A plant owns demand and growth.
The host owns locations, transactions, residue destinations and time.**

Plant state and species definitions contain no soil, reservoir, bed, nozzle,
cell area or growing-system type. The host binds a plant to a `slotId` in a
`systemId`. A slot holds at most one plant, but has no universal physical
area: it can represent a soil cell or another module's planting position.

Resource pools shared by several slots belong to one system transaction.
Two system IDs must not independently own the same reservoir or pool. This
prevents several plants from spending the same water or nutrient supply.

All operations use serializable records, validate inputs, return replacements
and leave arguments intact. Modules have no autonomous clocks, UI or storage.

![Growing-system and plant exchange](soil-plant-flow.svg)

## 2. Common values

`NPK` is `{n,p,k}` in separate nutrient game units. `Resources` is
`{waterL,n,p,k}`, water in litres. All quantities are finite and nonnegative;
fractions lie in [0,1]. Units have identical meanings in every adapter.

| Payload | Fields and meaning |
|---|---|
| `ResourceDemand` | `Resources` requested by this plant for one simulated day |
| `ResourceOffer` | `available:Resources`, `rootSupport`, `germinationSupport`, `diagnostics` |
| `ResourceTaken` | Actual `Resources` used by the plant, debited exactly once |
| `HarvestResult` | `freshKg`, `exported:NPK`, `residueNutrients:NPK` |
| `DayReport` | Identity, needed/offered/taken, coverage, support, growth and causes |

`available` is the amount this slot can actually receive during this day,
after system delivery constraints, not necessarily everything stored in a
reservoir. Offers are read-only quotes, not withdrawals or reservations.

`rootSupport` is the environment's ceiling on supported growth, independent
of the resource-coverage fractions. Soil maps structure to it. Another
adapter must document its mapping from its own root conditions. Do not apply
the same delivery limitation both to `available` and again to `rootSupport`.
An adapter may declare ideal support (1); it must not imply that it models
oxygen, equipment failure or chemistry when it does not.

`germinationSupport` is a required [0,1] ceiling for establishment conditions,
separate from rootSupport and water delivery. It represents the adapter's
declared germination environment, including any modeled temperature, oxygen
or physical-support effects. Water shortage is represented by the water offer,
not counted again here. An ideal nursery sets this fraction to 1 explicitly.
A provider must supply a germination-capable slot or the host must initially
bind the seed to a nursery adapter. A seed does not need to fake mature roots.

`diagnostics` is an array of `{code, label, value, unit}` owned by the adapter.
It explains its offer/support to the journal. These values do not alter plant
calculations; the Plant module never switches behavior on a diagnostic code.

`taken.waterL` means plant-use water leaving the growing system's accessible
ledger. It does not mean gross irrigation circulation, pump throughput or mist
volume. An adapter accounts for recirculation internally without charging
circulated water repeatedly. Actual losses are explicit ledger outputs.

## 3. Growing-system adapter interface

| Operation | Input → output | Requirement |
|---|---|---|
| `beginDay` | `(state, day) → {state, flows}` | Perform internal daily processes exactly once per system, even if all slots are empty |
| `offerResources` | `(state, slotId, demand, day) → ResourceOffer` | Quote current deliverable supply for this slot without mutation |
| `applyUptake` | `(state, slotId, taken, day) → state` | Debit actual consumption and update delivery accounting once |
| `validateState` | `state → valid or error` | Check module schema, bounds and shared-pool ownership |

The host owns the registry resolving `systemType` to an adapter. The plant
does not access this registry. Local treatments and residue acceptance are
module-specific operations, not mandatory root-delivery capabilities.

`flows` describes internal transfers and external additions/losses as named
resource vectors. A transfer has a source and destination pool; an external
flow identifies the external boundary. Neither may be counted twice. Soil's
residue release is an internal transfer, not newly created nutrients.

## 4. Coordinator and order

```ts
stepSystemDay(systemState, slots, speciesRegistry, adapter, day)
    -> {systemState, slots, slotReports, systemReport}
```

`slots` contains `{slotId, plant}` records; plant is null or a PlantState.
The host supplies species by each plant's species ID. All input IDs and
bindings must be unique and valid. Failure returns no partially committed
state. The host builds the whole next world before committing the day.

1. Call `beginDay` once; use its resulting system state for all slots.
2. Visit slots in ascending, locale-independent lexical `slotId` order. The
   allocation policy is deterministic priority, not a claim of fair sharing.
3. Request demand from the plant. Germinating plants request water only;
   growing plants request phase resources. Empty, ready and failed slots
   request zero.
4. Obtain the slot offer from the current working system snapshot.
5. For each resource, `coverage = demand === 0 ? 1 : min(1, available/demand)`.
6. For a germinating plant, take `min(offered.waterL,needed.waterL)` and zero
   N/P/K. Debit this hydration once with `applyUptake`, then call
   `advanceGermination(plant,species,taken.waterL,germinationSupport)`. Follow
   Plant's energy/progress/failure rule. Do not advance normal growth on the
   emergence day. Use the debited provider state for the next slot.
   For a growing plant, `growthFraction = min(rootSupport, waterCoverage,
   nCoverage, pCoverage, kCoverage)`. Then `taken = demand * growthFraction`.
7. For growing plants call `applyUptake`; use its new state for the next slot's offer. Call
   `advancePlant(plant, species, taken, growthFraction)` and retain its result.
8. Empty, ready and failed slots do not call uptake or plant advancement. Their
   report has zero taken, coverage 1, null growth and no limiting factors.
9. Return the system snapshot, updated plants, slot reports and one system
   flow report. The host atomically commits after every system succeeds.

There is no stale batch of independent full-reservoir offers. Shared supply
is quoted again after each settled plant. A changed sharing policy requires
an explicit contract version; array input order never changes allocation.

The host calls one-day steps in stable system-ID order. No shared physical
pool may span these transactions: such slots must use the same system ID.
Inter-system transfers are explicit host transactions between daily steps.

Normal growth scales consumption with growth. Germination hydration and
seed-energy spending follow the separate Plant rule. Establishment reserve
exhaustion is modeled; established-plant maintenance, remobilization and
mortality remain outside this contract's version.
Equipment can be integrated at daily resolution through an adapter's quote.
Subdaily failure responses or species-specific oxygen effects require a
versioned response model; changing an adapter must not invent those responses.

## 5. Reports and UI

| `DayReport` field | Meaning |
|---|---|
| `id` | Host-issued `worldId:systemId:slotId:day:exchange` |
| `systemId`, `slotId`, `day`, `plantId` | Identity; plant ID may be null |
| `needed`, `offered`, `taken` | Common resource vectors |
| `coverage` | `{water,n,p,k}` fractions |
| `rootSupport`, `diagnostics` | Quote's support and its explanation |
| `germinationSupport` | Quote's establishment-condition ceiling |
| `statusBefore`, `statusAfter` | Plant statuses or null for an empty slot |
| `germination` | null unless input was germinating; then `{progressAdded,energyUsed,energyRemaining,seedTransfer:NPK,failureReason}` |
| `growthFraction` | Supported fraction for growing input; null for other statuses |
| `limitingFactors` | Growing: ordered subset of `water,n,p,k,rootSupport`; germinating: stage-specific order below; tied minima included |
| `waterUseL` | Equal to `taken.waterL`; includes seed hydration |

For germination, report external water coverage but normal growth is null.
Order germination limiting factors as `water,germinationSupport,seedEnergy`;
compare their fractions as defined by Plant before capping progress to the
remaining target. An unactivated dry seed reports water limitation, no energy
spending and no progress. A seed transfer is internal to the plant ledger,
not additional provider uptake. Null growth is excluded from bed averages.

If all factors equal 1, limiting factors is empty. Tie tolerance is absolute
1e-9. Conservation comparisons use `1e-9 * max(1, abs(a), abs(b))`.
Clamp only roundoff-sized negatives; reject material invalid quantities.

`SystemDayReport` contains system/day identity, `flows` from beginning the day,
and total plant uptake (sum of slot taken). Do not repeat a shared reservoir's
available total or residue release in every slot and then sum it. Slot offers
are sequential quotes, not independent stocks to add together.

The journal shows needed → offered → taken → growth. Return/release comes
from the receiving module's report. Sum actual quantities; average growth
over growing plants only. Root-support diagnostic labels can differ by module
without changing the common calculation. The host gates unknown observations.

## 6. Harvest and residue destination

`finishHarvest` returns plant products only. It does not know their destination
or decomposition rate. The host commits one transaction that:

1. Creates a harvest record (`plantId:harvest`) with species, fresh kg, exported
   nutrient units and day.
2. Creates a residue parcel (`plantId:residue`) containing residue N/P/K.
3. Routes the parcel to a compatible, host-selected destination and removes
   the plant. The destination supplies its own processing policy.

Failed establishment is cleared through a host task using `clearFailedPlant`:
route held plus unused seed N/P/K as one residue parcel, remove the failed
plant, and publish `plantId:failedClear`. There is no food or exported harvest.
Use the same residue ID and destination rules to prevent duplicate returns.

A soil scenario may select the original cell. Another scenario may select
compost storage or a residue inventory. A growing system is not required to
accept residues. If the destination cannot accept the parcel, store it in
the host's persistent residue inventory; never discard it or inject it into
a reservoir automatically. Inventory parcels retain nutrients but do not
decompose without a processing module. Disposal is an explicit recorded export.

Do not debit the source growing system at harvest. Reject duplicate harvest
and residue IDs. Residue transfer changes ownership once; it does not copy
holdings. The host-selected processing policy is not a plant species property.

## 7. Time, persistence and conservation

Simulation days remain separate from work seconds and rendering. The host
prevents daily advancement during walking/work in the workshop. Persist all
module states, slot bindings, IDs, schema/model/adapter/parameter versions,
last committed day, transaction IDs and residue destinations/inventories.
Save before or after an atomic transaction, never a partial daily commit.

Keep 120 daily reports per slot and system plus cumulative totals. Publish
events only after success; consumers deduplicate stable IDs. Old models are
loaded through matching adapters or explicit migration, never silently
interpreted with a new field meaning. Do not migrate soil scores into solution
concentrations or infer resource stocks from legacy fertility.

For each nutrient:

```text
all module pools + residue inventory + plant-held N/P/K + seed N/P/K + cumulative exports
    = initial total + external additions
```

The ledger includes failed plants until cleared. At sowing, transfer seed N/P/K
from an accounted seed inventory or record an external seed addition if the
inventory tracks counts only; never do both. Seed energy is a separate abstract
budget, not nutrient matter. Internal transfers and recirculation cancel.
For water, apply the same boundary ledger with
plant-use and other declared losses as outputs. Harvest fresh kg is a separate
configured yield, not a conserved nutrient or water calculation.

## 8. Adding a module without changing Plant

Register its adapter and schema; define slots and owned pools; supply documented
quote/support calculations, flows and parameter units; bind existing species;
configure host observation and residue policies. No soil imports, new plant
subclasses, system-type branches or species copies are needed.

Hydroponics and aeroponics are extension targets, not implemented systems or
finished physical models in this specification. Their adapter internals must
receive their own authoritative specification when developed.

Required conformance tests:

- The same plant/species and identical daily offers/support produce identical
  growth and yield across two adapters with different internal state shapes.
- Two slots sharing a pool cannot collectively withdraw more than the pool;
  reversing input-array order preserves results after stable sorting.
- `beginDay` runs once per system, not once per plant; empty systems advance.
- Net plant use is charged once despite internal recirculation.
- Invalid adapter results or failed destinations cannot create partial commits.
- Nutrient/water ledgers close across harvest, storage and residue transfers.
- No plant field or branch depends on growing-system type or residue destination.
- Save/load preserves adapter state and bindings; UI uses reports, not equations.
- Equivalent nursery offers and support produce the same emergence or failure
  in soil, hydroponic and aeroponic adapter fixtures without Plant branches.
- Seed hydration is charged once, seed N/P/K is never charged to the provider,
  and failed clearing conserves all remaining nutrient units.
- Save/load during activated germination preserves reserves and progress.
