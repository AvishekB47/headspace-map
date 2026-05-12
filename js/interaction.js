import { DATA, POPPING } from "./data.js";
import { CONFIG } from "./config.js";
import { STATE } from "./state.js";
import { clampBubbleInside } from "./layout.js";
import { stopPhysics, startPhysics, fadeStopPhysics } from "./physics.js";

let physicsStopTimer = null;
let audioCtx = null;

function playPop(radius) {
  try {
    if (!audioCtx) audioCtx = new AudioContext();
    if (audioCtx.state === "suspended") audioCtx.resume();

    const now = audioCtx.currentTime;
    const duration = 0.12;

    const sampleCount = Math.ceil(audioCtx.sampleRate * duration);
    const buffer = audioCtx.createBuffer(1, sampleCount, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < sampleCount; i++) data[i] = Math.random() * 2 - 1;

    const source = audioCtx.createBufferSource();
    source.buffer = buffer;

    const filter = audioCtx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = Math.max(150, 900 - radius * 6);
    filter.Q.value = 2;

    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(0.6, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(audioCtx.destination);
    source.start(now);
  } catch (_) {}
}

function getXY(event) {
  const rect = STATE.canvas.getBoundingClientRect();
  const scale = STATE.size / rect.width;

  return [
    (event.clientX - rect.left) * scale,
    (event.clientY - rect.top) * scale
  ];
}

function pointInPoly(px, py, pts) {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const xi = pts[i][0], yi = pts[i][1];
    const xj = pts[j][0], yj = pts[j][1];
    if ((yi > py) !== (yj > py) && px < (xj - xi) * (py - yi) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

function hitBubble(x, y) {
  // Smallest bubbles first so they stay selectable when surrounded by larger ones
  const bySmallestFirst = [...DATA].sort((a, b) => a.r - b.r);

  for (const d of bySmallestFirst) {
    if (d.expandedPts && pointInPoly(x, y, d.expandedPts)) return d;
  }

  return null;
}

function onPointerDown(event) {
  event.preventDefault();

  const [x, y] = getXY(event);
  const hit = hitBubble(x, y);

  if (!hit) return;

  STATE.dragged = hit;
  STATE.activePointerId = event.pointerId;

  hit.dragging = true;
  hit.vx = 0;
  hit.vy = 0;

  clearTimeout(physicsStopTimer);
  physicsStopTimer = null;
  stopPhysics();

  STATE.dragOffsetX = hit.x - x;
  STATE.dragOffsetY = hit.y - y;

  STATE.canvas.classList.add("dragging");

  try {
    STATE.canvas.setPointerCapture(event.pointerId);
  } catch (_) {}
}

function onPointerMove(event) {
  if (!STATE.dragged) return;
  if (STATE.activePointerId !== null && event.pointerId !== STATE.activePointerId) return;

  event.preventDefault();

  const [x, y] = getXY(event);

  STATE.dragged.x = x + STATE.dragOffsetX;
  STATE.dragged.y = y + STATE.dragOffsetY;

  clampBubbleInside(STATE.dragged);
}

function finishDrag(event) {
  if (!STATE.dragged) return;

  event.preventDefault();

  STATE.dragged.dragging = false;
  STATE.dragged = null;
  STATE.activePointerId = null;

  STATE.canvas.classList.remove("dragging");

  try {
    STATE.canvas.releasePointerCapture(event.pointerId);
  } catch (_) {}

  startPhysics();
  physicsStopTimer = setTimeout(() => fadeStopPhysics(CONFIG.physics.fadeDuration), 500);
}

async function popBubble(d) {
  const idx = DATA.indexOf(d);
  if (idx === -1) return;

  POPPING.push({ x: d.x, y: d.y, r: d.r, color: d.color, startTime: performance.now() });
  playPop(d.r);
  DATA.splice(idx, 1);

  if (STATE.dragged === d) {
    STATE.dragged.dragging = false;
    STATE.dragged = null;
    STATE.activePointerId = null;
    STATE.canvas.classList.remove("dragging");
  }

  startPhysics();
  clearTimeout(physicsStopTimer);
  physicsStopTimer = setTimeout(() => fadeStopPhysics(CONFIG.physics.fadeDuration), 500);

  try {
    const isLocal = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
    const closeUrl = isLocal ? `/proxy/tasks/${d.id}/close` : `https://api.todoist.com/api/v1/tasks/${d.id}/close`;
    await fetch(closeUrl, {
      method: "POST",
      headers: { "Authorization": `Bearer ${CONFIG.todoist.apiToken}` }
    });
  } catch (_) {}
}

function onDblClick(event) {
  const [x, y] = getXY(event);
  const hit = hitBubble(x, y);
  if (!hit) return;
  event.preventDefault();
  popBubble(hit);
}

export function attachInteraction() {
  STATE.canvas.addEventListener("pointerdown", onPointerDown, { passive: false });
  STATE.canvas.addEventListener("pointermove", onPointerMove, { passive: false });
  STATE.canvas.addEventListener("pointerup", finishDrag, { passive: false });
  STATE.canvas.addEventListener("pointercancel", finishDrag, { passive: false });
  STATE.canvas.addEventListener("lostpointercapture", finishDrag, { passive: false });
  STATE.canvas.addEventListener("dblclick", onDblClick);
}
