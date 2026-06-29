# Copy prayer logic from prayer-luxor-react

Prayer times, countdown hooks, and constants already exist in `prayer-luxor-react`. We will **copy** the relevant `src/utils/`, hooks, and `prayers366` data into this Tauri project rather than submodule, shared package, or monorepo.

The desktop repo is greenfield and must ship quickly; the prayer table changes infrequently (roughly yearly). Manual sync on update is acceptable. Submodule and shared-package setups add clone and release overhead disproportionate to a solo-maintained Luxor-only widget.
