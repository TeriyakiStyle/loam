# LOAM — Soil–Plant Adapter

**Authoritative specification · adapter version 1.2 · 8 September 2026**

This maps the [Soil System](SOIL.md) onto the shared
[Growing-System–Plant Contract](GROWING-SYSTEM-PLANT.md). The [Plant System](PLANT.md)
is independent of this adapter. Shared payloads, growth, transaction rules and
conformance tests are defined once in that common contract.

## Identity and binding

Each 1 m² ground cell is one soil system with one slot. Use stable cell-derived
system and slot IDs. The host binds the cell's plant to that slot. Beds group
slots for selection; they do not own soil or nutrient pools.

Soil version 1.1 does not exchange water between cells. If physical pools
are later shared, group their slots into one system transaction rather than
quoting the same supply independently.

## Adapter mapping

| Shared operation/value | Soil implementation |
|---|---|
| `beginDay(state,day)` | `releaseResidues(soil,day)` once; report residue → available N/P/K as an internal transfer |
| `offerResources(state,slotId,demand,day)` | Validate slot; expose stored accessible water and available N/P/K without mutation |
| `rootSupport` | Equal to `soil.structure` |
| `germinationSupport` | Explicitly 1: otherwise ideal germination conditions in this soil version |
| `diagnostics` | `{code:'soil.structure',label:'Soil structure',value:structure,unit:'fraction'}` |
| `applyUptake(state,slotId,taken,day)` | Validate slot; call `applySoilExchange(soil,taken)` |
| `validateState` | Soil state invariants, residue IDs and the host slot binding |

The plant receives no `structure` field. Structure's meaning and its mapping
to support stay here. It is not also applied to the resource quote, so its
effect is not counted twice. The common `rootSupport` limiting factor is
explained to the player with the adapter's Soil structure label.

Seeds receive available water through the same slot but use germinationSupport
rather than rootSupport. Seed nutrients and establishment energy belong to
Plant. Soil does not charge them. Temperature, oxygen and crust resistance
during germination are not simulated in this version; water remains finite.
Journal labels must disclose those ideal-condition assumptions.

## Treatments and observations

The existing host completes water, compost and till work cell by cell.
Inventory charge and soil treatment are committed once. Till is excluded
for occupied cells. Examination is required for planting in the soil workshop;
it is a host/adapter policy, not a Plant requirement. There is no quality gate.

Report water, N/P/K, structure and residue release only when observed.
Bed summaries sum cell resources and uptake, retain per-cell diagnostics, and
average supported growth over growing plants only.

## Residue acceptance

The soil scenario selects the source cell as the default harvest-residue
destination. The host may select another compatible destination without
changing Plant. Soil accepts a nutrient parcel through `receiveResidue`, with
the receipt day and the receiving soil scenario's configured release fraction.
The plant's harvest result contains no decomposition rate or ground address.

A parcel received on day D first releases on day D+1. Moving or removing a
bed does not move parcels. Compost treatments use the same receiving policy;
the host persists its policy version and any rate captured on each residue.

## Integration and checks

Keep the existing `/loam` terrain, movement, tasks and cancellation. The host
calendar delegates to the common coordinator using this adapter. Journal
panels consume common reports and soil diagnostics. This document specifies
interfaces; implementation status is maintained outside the final GDD.

Pass the shared contract and Soil tests, plus:

- Structure 0.9 with sufficient resources yields 0.9 daily growth support.
- Removing a bed leaves the system ID, soil, plant binding and residues intact.
- A ready harvest does not debit soil again.
- Routing residues to host storage leaves source soil unchanged.
- Receiving the same parcel twice is rejected without mutation.
