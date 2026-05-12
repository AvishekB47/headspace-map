import { DATA } from "./data.js";
import { CONFIG } from "./config.js";
import { STATE } from "./state.js";
import { clampBubbleInside } from "./layout.js";

let physicsActive = false;
let settled = false;
let fadeEndTime = 0;
let fadeDuration = 500;

export function initPhysics() {
  DATA.forEach(d => {
    d.density = d.mass / d.volume;
    d.vx = 0;
    d.vy = 0;
  });

  physicsActive = true;
  settled = false;
  fadeEndTime = 0;
}

export function stopPhysics() {
  physicsActive = false;
  fadeEndTime = 0;
  DATA.forEach(d => {
    d.vx = 0;
    d.vy = 0;
  });
}

export function startPhysics() {
  physicsActive = true;
  settled = false;
  fadeEndTime = 0;
}

export function fadeStopPhysics(duration = 500) {
  fadeDuration = duration;
  fadeEndTime = Date.now() + duration;
  physicsActive = true;
  settled = false;
}

export function isPhysicsActive() {
  return physicsActive && !settled;
}

export function tickPhysics() {
  if (!physicsActive || settled) return;

  const {
    attractionStrength,
    repulsionStrength,
    damping,
    settleThreshold,
    collisionIterations,
    collisionStiffness,
    boundaryStiffness
  } = CONFIG.physics;

  // Step 1: Pairwise attraction (same category) and repulsion (different category)
  const maxRepulseDist = STATE.cr * 0.8;
  for (let i = 0; i < DATA.length; i++) {
    for (let j = i + 1; j < DATA.length; j++) {
      const a = DATA[i];
      const b = DATA[j];

      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dist = Math.hypot(dx, dy) || 0.001;
      const nx = dx / dist;
      const ny = dy / dist;

      if (a.category === b.category) {
        const minDist = a.r + b.r;
        if (dist > minDist) {
          const f = attractionStrength * STATE.cr;
          if (!a.dragging) { a.vx += nx * f; a.vy += ny * f; }
          if (!b.dragging) { b.vx -= nx * f; b.vy -= ny * f; }
        }
      } else if (dist < maxRepulseDist) {
        const f = repulsionStrength * STATE.cr * (1 - dist / maxRepulseDist);
        if (!a.dragging) { a.vx -= nx * f; a.vy -= ny * f; }
        if (!b.dragging) { b.vx += nx * f; b.vy += ny * f; }
      }
    }
  }

  // Step 2: Integrate velocity → position, apply damping and fade
  const now = Date.now();
  const fadeScale = fadeEndTime > 0
    ? Math.max(0, (fadeEndTime - now) / fadeDuration)
    : 1;

  DATA.forEach(d => {
    if (d.dragging) return;
    d.vx *= damping * fadeScale;
    d.vy *= damping * fadeScale;
    d.x += d.vx;
    d.y += d.vy;
  });

  // Step 3: Boundary — soft spring inward + hard clamp
  DATA.forEach(d => {
    if (d.dragging) return;

    const dx = d.x - STATE.cx;
    const dy = d.y - STATE.cy;
    const dist = Math.hypot(dx, dy) || 0.001;
    const maxCenter = STATE.cr - d.r - CONFIG.bubbles.boundaryPadding;

    if (dist > maxCenter) {
      const excess = dist - maxCenter;
      const nx = dx / dist;
      const ny = dy / dist;

      d.vx -= nx * excess * boundaryStiffness;
      d.vy -= ny * excess * boundaryStiffness;

      // Hard clamp prevents tunneling through the wall
      d.x = STATE.cx + nx * maxCenter;
      d.y = STATE.cy + ny * maxCenter;
    }
  });

  // Step 4: Circle-circle collision resolution (iterated position correction)
  for (let iter = 0; iter < collisionIterations; iter++) {
    for (let i = 0; i < DATA.length; i++) {
      for (let j = i + 1; j < DATA.length; j++) {
        const a = DATA[i];
        const b = DATA[j];

        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.hypot(dx, dy) || 0.001;
        const minDist = a.r + b.r;

        if (dist >= minDist) continue;

        const overlap = minDist - dist;
        const nx = dx / dist;
        const ny = dy / dist;

        // Heavier bubble moves less: alpha = fraction of correction absorbed by b
        const totalMass = a.mass + b.mass;
        const alpha = a.mass / totalMass;
        const correction = overlap * collisionStiffness;

        if (!a.dragging) {
          a.x -= nx * correction * (1 - alpha);
          a.y -= ny * correction * (1 - alpha);
        }

        if (!b.dragging) {
          b.x += nx * correction * alpha;
          b.y += ny * correction * alpha;
        }
      }
    }

    // Re-clamp all non-dragging bubbles after each collision pass
    DATA.forEach(d => {
      if (!d.dragging) clampBubbleInside(d);
    });
  }

  // Step 5: Settle check
  if (fadeEndTime > 0 && Date.now() >= fadeEndTime) {
    stopPhysics();
    return;
  }

  let maxSpeed = 0;
  DATA.forEach(d => {
    maxSpeed = Math.max(maxSpeed, Math.hypot(d.vx, d.vy));
  });

  if (maxSpeed < settleThreshold) {
    settled = true;
    physicsActive = false;
  }
}
