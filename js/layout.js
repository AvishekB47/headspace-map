import { DATA } from "./data.js";
import { CONFIG } from "./config.js";
import { STATE } from "./state.js";

export function resizeCanvas() {
  const canvas = STATE.canvas;
  const ctx = STATE.ctx;

  STATE.dpr = Math.min(
    window.devicePixelRatio || 1,
    CONFIG.canvas.devicePixelRatioCap
  );

  STATE.size = Math.min(
    window.innerWidth - CONFIG.canvas.viewportPaddingX,
    window.innerHeight - CONFIG.canvas.viewportPaddingY,
    CONFIG.canvas.maxSize
  );

  STATE.size = Math.max(CONFIG.canvas.minSize, STATE.size);

  canvas.style.width = STATE.size + "px";
  canvas.style.height = STATE.size + "px";

  canvas.width = Math.round(STATE.size * STATE.dpr);
  canvas.height = Math.round(STATE.size * STATE.dpr);

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.scale(STATE.dpr, STATE.dpr);

  STATE.cx = STATE.size / 2;
  STATE.cy = STATE.size / 2;
  STATE.cr = STATE.size * CONFIG.canvas.circleRadiusFactor;
}

export function computeRadii() {
  const p = STATE.radiusPower;
  const sumRawSq = DATA.reduce((sum, d) => sum + Math.pow(d.volume, 2 * p), 0);
  const k = Math.sqrt(CONFIG.bubbles.fillFactor * STATE.cr * STATE.cr / sumRawSq);

  DATA.forEach(d => {
    d.r = k * Math.pow(d.volume, p);
    if (d.volume === 1) d.r += STATE.radiusFloor;
  });
}

export function clampBubbleInside(d) {
  const dx = d.x - STATE.cx;
  const dy = d.y - STATE.cy;
  const dist = Math.hypot(dx, dy) || 0.001;
  const maxCenter = STATE.cr - d.r - CONFIG.bubbles.boundaryPadding;

  if (dist > maxCenter) {
    d.x = STATE.cx + (dx / dist) * maxCenter;
    d.y = STATE.cy + (dy / dist) * maxCenter;
  }
}

export function initPositions() {
  const n = DATA.length;
  DATA.forEach((d, i) => {
    const angle = i * 2.39996;               // golden angle (radians)
    const radiusFrac = Math.sqrt((i + 0.5) / n) * 0.7;
    d.x = STATE.cx + Math.cos(angle) * radiusFrac * STATE.cr;
    d.y = STATE.cy + Math.sin(angle) * radiusFrac * STATE.cr;
    d.vx = 0;
    d.vy = 0;
    d.dragging = false;
    clampBubbleInside(d);
  });
}
