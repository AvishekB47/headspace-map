import { DATA, POPPING } from "./data.js";
import { CONFIG } from "./config.js";
import { STATE } from "./state.js";
import { clamp } from "./geometry.js";

const TWO_PI = Math.PI * 2;

function parseHex(hex) {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16)
  ];
}

function lightenColor(hex, t) {
  const [r, g, b] = parseHex(hex);
  return `rgb(${Math.round(r + (255 - r) * t)},${Math.round(g + (255 - g) * t)},${Math.round(b + (255 - b) * t)})`;
}

function colorWithAlpha(hex, a) {
  const [r, g, b] = parseHex(hex);
  return `rgba(${r},${g},${b},${a})`;
}

function computeExpandedShape(d) {
  const maxR = d.r * STATE.expandFactor;
  const nRays = STATE.nRays;
  const rvs = [];
  const pts = [];

  for (let i = 0; i < nRays; i++) {
    const θ = (i / nRays) * TWO_PI;
    const cosθ = Math.cos(θ);
    const sinθ = Math.sin(θ);
    let rv = maxR;

    // Container exit: far intersection of ray with container circle
    {
      const fx = d.x - STATE.cx;
      const fy = d.y - STATE.cy;
      const bH = fx * cosθ + fy * sinθ;
      const c = fx * fx + fy * fy - STATE.cr * STATE.cr;
      rv = Math.min(rv, -bH + Math.sqrt(bH * bH - c));
    }

    // Laguerre boundary with each neighbour — equidistant from surfaces
    for (const j of DATA) {
      if (j === d) continue;
      const fx = d.x - j.x;
      const fy = d.y - j.y;
      const bH = fx * cosθ + fy * sinθ;
      const δr = d.r - j.r;
      const D2 = fx * fx + fy * fy;
      const denom = 2 * (δr + bH);
      if (Math.abs(denom) < 1e-6) continue;
      const t = (δr * δr - D2) / denom;
      if (t > d.r && t < rv) rv = t;
    }

    rvs.push(rv);
    pts.push([d.x + rv * cosθ, d.y + rv * sinθ]);
  }

  // Strip vertices at sharp length-jumps — bezier overshoots at these transitions cause hooks
  const jumpThreshold = maxR * STATE.jumpThreshold;
  const toRemove = new Set();
  for (let i = 0; i < nRays; i++) {
    const next = (i + 1) % nRays;
    if (Math.abs(rvs[next] - rvs[i]) > jumpThreshold) {
      toRemove.add(i);
      toRemove.add(next);
    }
  }

  d.expandedPts = toRemove.size > 0
    ? pts.filter((_, i) => !toRemove.has(i))
    : pts;
}

function clampExpandedPts(d) {
  if (!d.expandedPts) return;
  const MARGIN = 2; // px inside each Laguerre boundary — absorbs bezier overshoot

  d.expandedPts = d.expandedPts.map(([px, py]) => {
    let x = px, y = py;
    for (const j of DATA) {
      if (j === d) continue;
      const nx = j.x - d.x;
      const ny = j.y - d.y;
      const len = Math.hypot(nx, ny);
      if (len < 1e-4) continue;
      const unx = nx / len;
      const uny = ny / len;
      // Laguerre boundary: un·p = C  (d's cell is the un·p ≤ C side)
      const C = (j.x*j.x + j.y*j.y - j.r*j.r - d.x*d.x - d.y*d.y + d.r*d.r) / (2 * len);
      const excess = unx * x + uny * y - C + MARGIN;
      if (excess > 0) {
        x -= excess * unx;
        y -= excess * uny;
      }
    }
    return [x, y];
  });
}

function drawSmoothPoly(ctx, pts) {
  const n = pts.length;
  ctx.beginPath();
  ctx.moveTo((pts[n - 1][0] + pts[0][0]) / 2, (pts[n - 1][1] + pts[0][1]) / 2);
  for (let i = 0; i < n; i++) {
    const cur = pts[i];
    const nxt = pts[(i + 1) % n];
    ctx.quadraticCurveTo(cur[0], cur[1], (cur[0] + nxt[0]) / 2, (cur[1] + nxt[1]) / 2);
  }
  ctx.closePath();
}

function drawContainerCircle() {
  const ctx = STATE.ctx;

  ctx.beginPath();
  ctx.arc(STATE.cx, STATE.cy, STATE.cr, 0, Math.PI * 2);
  ctx.fillStyle = CONFIG.appearance.containerFill;
  ctx.fill();

  ctx.strokeStyle = CONFIG.appearance.containerStroke;
  ctx.lineWidth = 1;
  ctx.stroke();
}

function drawBubbles() {
  const ctx = STATE.ctx;
  const drawOrder = [...DATA].sort((a, b) => b.r - a.r);

  drawOrder.forEach(d => {
    if (!d.expandedPts) return;

    drawSmoothPoly(ctx, d.expandedPts);

    ctx.fillStyle = d.color;
    ctx.globalAlpha = d.dragging
      ? CONFIG.appearance.draggedBubbleAlpha
      : CONFIG.appearance.bubbleAlpha;
    ctx.fill();
    ctx.globalAlpha = 1;
  });
}

function drawLabels() {
  const ctx = STATE.ctx;

  DATA.forEach(d => {
    const maxWidth = d.r * 2 * CONFIG.labels.maxWidthFactor;

    let fontSize = clamp(
      Math.round(d.r * CONFIG.labels.fontScale),
      CONFIG.labels.minFontSize,
      CONFIG.labels.maxFontSize
    );

    ctx.font = `${fontSize}px 'DM Sans', sans-serif`;

    while (fontSize > CONFIG.labels.minFontSize && ctx.measureText(d.label).width > maxWidth) {
      fontSize -= 1;
      ctx.font = `${fontSize}px 'DM Sans', sans-serif`;
    }

    if (ctx.measureText(d.label).width > maxWidth && fontSize <= CONFIG.labels.minFontSize) return;

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = d.dragging
      ? CONFIG.appearance.draggedLabelFill
      : CONFIG.appearance.labelFill;

    ctx.fillText(d.label, d.x, d.y);
  });
}

function drawPoppingBubbles() {
  const ctx = STATE.ctx;
  const now = performance.now();
  const DURATION = 380;

  for (let i = POPPING.length - 1; i >= 0; i--) {
    const p = POPPING[i];
    const t = Math.min(1, (now - p.startTime) / DURATION);

    if (t >= 1) { POPPING.splice(i, 1); continue; }

    const eased = 1 - (1 - t) * (1 - t); // ease-out quad
    const drawR = p.r * (1 + eased * 2);
    const alpha = 1 - t;

    // Fading fill
    ctx.beginPath();
    ctx.arc(p.x, p.y, drawR, 0, Math.PI * 2);
    ctx.fillStyle = colorWithAlpha(p.color, alpha * 0.35);
    ctx.fill();

    // Expanding ring
    ctx.beginPath();
    ctx.arc(p.x, p.y, drawR, 0, Math.PI * 2);
    ctx.strokeStyle = colorWithAlpha(p.color, alpha * 0.9);
    ctx.lineWidth = 2.5 * (1 - eased);
    ctx.stroke();
  }
}

export function render() {
  const ctx = STATE.ctx;

  ctx.clearRect(0, 0, STATE.size, STATE.size);

  drawContainerCircle();

  DATA.forEach(d => computeExpandedShape(d));
  DATA.forEach(d => clampExpandedPts(d));

  ctx.save();

  ctx.beginPath();
  ctx.arc(STATE.cx, STATE.cy, STATE.cr, 0, Math.PI * 2);
  ctx.clip();

  drawBubbles();
  drawPoppingBubbles();
  drawLabels();

  ctx.restore();
}
