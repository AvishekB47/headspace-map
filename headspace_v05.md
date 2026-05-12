---
title: headspace_v05 — Build Flags
project: headspace-map
status: active
created: 2026-05-07
updated: 2026-05-07
---

# headspace_v05 — Build Status

---

## Done

### Colour picker
Clicking the colour swatch in any editor row or the Add dialog opens the native OS colour picker. Updates live on `input`; physics reinitialises on `change`.

### Volume normalised to 1–100
All volume values remapped from the old 0–200 range (÷2, rounded). Editor Vol sliders and the Add dialog slider capped at 100. Proportions preserved.

### Fluidity slider (renamed from Expansion)
The global expansion control is now labelled Fluidity.

### Physics damping duration doubled
`fadeDuration` 500ms → 1000ms. `setTimeout` delay 500ms → 1000ms. Physics runs freely for 1s then winds down over 1s, on load and after each drag release.

---

## Remaining

### 1. Pressure encoding *(shelved)*
`pressure = mass / volume` drives buoyancy in the physics engine but is invisible to the user. The concept's core signal — high-pressure bubbles are important but under-attended — is never surfaced visually. High-pressure bubbles look identical to balanced ones. Needs a visual treatment: ring, glow, opacity shift, or colour tint.

### 2. Equilibrium state *(shelved)*
The concept distinguishes *current state* (volume-driven sizes, where attention actually is) from *equilibrium state* (mass-proportional sizes, where attention should be). The gap between them is the action signal. Currently only current state is rendered. Equilibrium state and the gap between the two are not shown.

### 3. Gravity rework *(next)*
Current buoyancy uses `(mass - meanMass)` which pushes above-average bubbles up and below-average ones down — relative comparison. Replace with a gravity model: all bubbles have a constant downward pull, but heavier bubbles are pulled harder. Lighter bubbles naturally settle higher, heavy ones at the bottom. No mean comparison — just `vy += mass * gravityScale * cr` with damping doing the rest.

### 4. Pop action
On-canvas "I resolved this" gesture, distinct from the editor's delete button. When a bubble is resolved it should visually collapse or burst before being removed — its freed territory becomes visible space for neighbouring bubbles to expand into.

### 4. Category system
Categories (Health, Work, Finance, etc.) as invisible metadata with shared base mass and colour inheritance. Currently all bubbles are flat — individual mass, manually assigned colour. The category layer would let bubbles inherit a default mass from their domain and provide consistent colour grouping.

### ~~5. Colour picker~~ ✓ Done
Clicking the colour swatch in any editor row or the Add dialog opens the native OS colour picker. Updates live on `input`; physics reinitialises on `change`.

---

## Nice to Have

### Animated expansion
Expansion currently computed statically per frame. Future: each bubble's expanded territory accumulates over time toward its equilibrium size, driven by pressure differential. High-pressure bubbles visibly push outward on load; popping a bubble releases territory that neighbours visibly expand into.

### Expansion / Rays / Trim sliders
Dev scaffolding — intentionally left visible for now. Will be removed or hidden once values are settled.
