# Soil–plant working material

This directory is non-authoritative. The final requirements are in
[Soil](../SOIL.md), [Shared Contract](../GROWING-SYSTEM-PLANT.md),
[Soil Adapter](../SOIL-PLANT.md) and [Plant](../PLANT.md).

## Implementation checklist

As of 8 September 2026, the workshop uses weighted quality indices and a
single soil-quality value passed to plant growth. It has no uptake or residue
return. The authoritative specifications describe the target resource model,
not completed runtime changes.

- Implement/validate the Soil and Plant records and operations.
- Add the deterministic daily exchange and reports.
- Adapt world time and completed work without replacing terrain/navigation.
- Add crop-specific harvest records and residue deposition.
- Add the report-driven journal and versioned persistence.
- Run all module and contract acceptance checks.

No gameplay files were changed during this specification revision.

## Parameter calibration

The final specs intentionally require a versioned scenario/species configuration
instead of embedding unsourced crop budgets as final defaults. Values still to
establish for a released scenario include initial accessible water/capacity,
N/P/K budgets, structure, crop phase boundaries/demands, potential fresh yield,
nutrient export fractions, residue release and treatment quantities/costs.

Test fixtures can supply arbitrary declared values to prove implementation.
Do not promote old tomato/bean/radish budgets to calibrated values by copying
them. Record a source or explicit test classification for every parameter.

## Reference material

- [Previous implementation brief](SOIL-PLANT-BRIEF-2026-09-08.md): historical
  design reasoning, source review, example budgets and integration suggestions.
- [Earlier code audit and research roadmap](../SOIL-PLANT-REFERENCE-v1.md):
  historical details; not current module requirements.
- [Vanaspati source reviewed at 91fd148](https://github.com/MacCracken/vanaspati/tree/91fd1480b586acf6ec6ac873ad8875f4456afd03): useful separation of storage, fluxes,
  decomposition and presentation data. Source review only; no code imported.
- NASA's *Space Crop Considerations for Human Exploration*, July 2024:
  scheduling and resource-accounting reference, not a homestead parameter set.

## Design record

The authoritative specs choose a small resource-budget model: finite water,
separate nutrient units, structure-limited access, equal daily growth weighting,
terminal harvest and delayed residue return. Physical chemistry, fixation,
microbial carbon, thermal time, mortality and weather are outside this version.
Their absence is explicit scope, not an unfinished API requiring guesses.

Questions about calibrating this model or extending its scope belong here.
Only resolved changes enter the authoritative specifications, with a version update.

## Version 1.1 boundary revision

The authoritative exchange is now growing-system independent. Soil's structure
mapping is confined to its adapter. Plant no longer owns a residue processing
rate or assumes a ground-cell destination. The host binds planting slots,
routes residue parcels and coordinates shared-pool transactions. Future
hydroponic/aeroponic modules supply their own adapters; no such runtime module
was implemented in this documentation change.

Legacy references to per-cell exchange, `rootAccess`, or species-owned residue
rates in historical briefs do not override the 1.1 specifications.

## Version 1.2 establishment

Seed energy and nutrient reserves now belong to Plant. The shared contract
adds germinationSupport and germination reporting; soil explicitly assumes
ideal non-water germination conditions. Activated establishment can exhaust
energy and fail; dormant unhydrated seeds do not spend energy. Calibration
must now include species reserve budgets, water demand, required progress
and post-germination maturity durations. No runtime implementation is claimed.
