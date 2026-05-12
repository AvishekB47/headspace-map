# Headspace Map — Concept Document

## What Is This?

A personal **mental load visualisation tool** — a freeform bubble map that reflects where your attention currently is, where it *should* be given the importance of things, and the gap between the two.

It is not a task manager. It is not a goal setter. It is a **mirror** — an honest visual representation of your mental state at a given point in time.

---

## Core Mental Model

The mind trades in **attention**, not time. Time is just a proxy. This tool maps attention directly.

Each area of life or concern in your head is represented as a **bubble**. Bubbles have two properties:

### Volume
How much mental space a topic currently occupies. This reflects your *actual* current state — how much you are thinking about it, worrying about it, spending time on it.

### Mass (Density)
How important the topic actually is. This is slower to change. It reflects your values, obligations, and priorities.

### Pressure
Derived from mass and volume: `Pressure = Mass / Volume`

- **High mass, low volume** → high pressure → danger zone. Something important is being under-attended.
- **Low mass, high volume** → low pressure → noise. Something is occupying more headspace than it deserves.
- **Balanced** → pressure roughly equal across bubbles → equilibrium.

---

## The Physics Metaphor

Bubbles behave like matter under pressure:

- Denser (higher mass) bubbles push away less dense ones
- Bubbles find a **resting position** when the pressure across all bubbles equalises
- This equilibrium state is the *target* — not a fixed goal you define, but something you discover by letting the system settle

The gap between your **current state** (where bubbles are now) and the **equilibrium state** (where they should be) is your action signal. The bubbles most out of place = what to tackle next.

---

## Structure of the Map

### Bubbles
Each bubble represents a **specific concern** — an actual thing occupying your headspace (e.g. "plan summer activity for son", "finish tax return", "complete Blender project"). These are the only visible elements on the canvas. Abstract category labels do not appear.

### Categories
Categories (e.g. Health, Finance, Creative, Work, Family) exist as **invisible metadata**. Each concern bubble is assigned a category which determines:
- Its **default mass** — all bubbles in the same category inherit the same base importance
- Its **colour** — the only visible trace of category on the canvas

### Mass Override
Category sets the default mass but individual bubbles can be overridden. Most bubbles inherit the category mass — the override exists for cases where a specific concern feels significantly more or less important than others in the same domain.

### Positioning
- Positioning is handled by the force-directed simulation — bubbles find their own place
- Bubbles colour-coded by category will naturally reveal clustering patterns visually

---

## Purpose and Workflow

1. **Define your categories** — set up domains (Health, Work, Finance etc.) and assign a mass (importance) to each
2. **Dump your headspace** — add specific concerns as bubbles, assign volume (how much it's occupying you) and a category
3. **Simulate equilibrium** — the system shows where bubbles *should* be if attention were proportional to importance
4. **Read the gap** — bubbles furthest from equilibrium = highest priority action
5. **Act and update** — when a concern is resolved, pop its bubble. Space opens up for other bubbles to expand naturally

### The Key Insight
This models what the mind actually does. Completing obligatory tasks doesn't just free *time* — it frees *attention*. Creative and hobby pursuits expand naturally into that freed space. The tool makes this invisible process visible and intentional.

---

## Relationship to Existing Frameworks

| Framework | Similarity | Difference |
|---|---|---|
| Eisenhower Matrix | Priority based on importance | Headspace map is spatial, organic, not a rigid 2x2 |
| IFS Parts Mapping | Circles representing mental states | Headspace map is concern/task oriented, not therapeutic parts |
| PARA Method | Domain-based organisation | Headspace map is dynamic and pressure-driven, not static |
| Affinity Mapping | Freeform cluster layout | Headspace map has physics-based priority logic |
| Personal Kanban | Visual task flow | Headspace map shows *why* something has priority, not just what |

---

## What It Is Not

- Not a scheduler
- Not a fixed goal framework
- Not something you define equilibrium for upfront — you discover it
- Not equal balance — equilibrium means **proportional**, not identical bubble sizes

---

## Design Principles

- **Mass assignment is the most important input** — it is where your values live. Be honest. Social conditioning or habit may make you assign low mass to things that actually matter deeply to you, or vice versa.
- **Volume reflects current reality**, not aspiration
- **Equilibrium is discovered**, not designed
- **Popping bubbles** (completing tasks) is a meaningful act — it literally creates room for other things to grow
- **The tool should feel like relief**, not another obligation

---

## Anticipated Behaviour

- Completing obligatory tasks → their bubbles shrink → neighbouring creative/hobby bubbles have room to expand
- A persistently high-pressure bubble that never gets attention = a signal worth investigating (avoidance, undervaluing, or resource constraint)
- A consistently oversized low-mass bubble = noise that may need conscious reduction
- Over time, the map reveals your *actual* equilibrium — what balance genuinely looks like for you, not what you think it should look like

---

## Technical Approach

### Layout Engine — Force-Directed Simulation

The recommended starting point is a **force-directed circle simulation** using d3-force.

- Bubbles are circles with mass and volume properties
- They repel each other based on density (pressure)
- They naturally find equilibrium positions through physics simulation
- Gaps and disconnected positioning are natural outcomes
- Sub-bubbles can be nested inside parent circles

**Why not Voronoi:**
Voronoi was considered as a starting point. It computes equilibrium naturally and weighted seeds can represent mass. However it always fills the entire canvas (no breathing room), regions are always contiguous (no disconnected bubbles), and sub-bubbles don't nest naturally within cells. Voronoi could optionally be used as a background layer to visualise territory/influence if needed later.

### Collision Detection — Strict No Border Overlap

d3-force supports this via `d3.forceCollide(radius)`:

- Prevents any two bubbles from overlapping
- Radius is set per bubble based on its volume
- Larger bubbles push smaller ones away naturally
- Simulation settles into equilibrium without border crossing

**Tuning notes:**
- Set collision radius slightly larger than visual radius to add natural padding
- Run multiple simulation ticks before rendering for a stable initial state
- Collision `strength` around 0.7–0.9 gives firm but smooth separation

---

## Implementation Notes (for the builder)

- Each bubble has: `label`, `volume` (visual size), `category`, `mass` (defaults to category mass, overridable per bubble)
- Categories have: `label`, `mass`, `colour` — not rendered on canvas, used as metadata only
- Pressure is calculated per bubble: `mass / volume`
- Equilibrium state can be simulated by normalising sizes proportional to mass
- Difference between current and equilibrium state surfaces priority
- Visual style: soft, organic, calm — not clinical or corporate
- Should support a "pop" or "close" action when a concern is resolved
- Force-directed layout handles positioning — no manual placement required
- Colour is the only visual indicator of category on the canvas
