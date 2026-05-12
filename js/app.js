import { STATE } from "./state.js";
import { CONFIG } from "./config.js";
import { resizeCanvas, computeRadii, initPositions } from "./layout.js";
import { initPhysics, tickPhysics, isPhysicsActive, fadeStopPhysics, startPhysics } from "./physics.js";
import { render } from "./render.js";
import { attachInteraction } from "./interaction.js";
import { loadTodoistTasks } from "./todoist.js";
import { attachAddTask } from "./addtask.js";

const statusEl = document.getElementById("status");

function showLoading(visible) {
  statusEl.textContent = visible ? "Loading tasks…" : "";
}

function showError(msg) {
  statusEl.textContent = `Error: ${msg}`;
}

function initCanvas() {
  STATE.canvas = document.getElementById("c");
  STATE.ctx = STATE.canvas.getContext("2d");
}

function initAll() {
  resizeCanvas();
  computeRadii();
  initPositions();
  initPhysics();
  setTimeout(() => fadeStopPhysics(CONFIG.physics.fadeDuration), 2000);
}

function loop() {
  if (isPhysicsActive()) {
    tickPhysics();
  }

  render();
  requestAnimationFrame(loop);
}

function reinit() {
  computeRadii();
  initPositions();
  initPhysics();
  setTimeout(() => fadeStopPhysics(CONFIG.physics.fadeDuration), 2000);
}

function handleResize() {
  initAll();
}

(async () => {
  showLoading(true);
  try {
    await loadTodoistTasks(CONFIG.todoist.apiToken);
  } catch (e) {
    showError(e.message);
    return;
  }
  showLoading(false);

  initCanvas();
  initAll();
  attachInteraction();

  const expandSlider = document.getElementById("expand");
  const expandVal = document.getElementById("expand-val");
  STATE.expandFactor = parseFloat(expandSlider.value);
  expandSlider.addEventListener("input", () => {
    STATE.expandFactor = parseFloat(expandSlider.value);
    expandVal.textContent = expandSlider.value;
  });

  const trimSlider = document.getElementById("trim");
  const trimVal = document.getElementById("trim-val");
  STATE.jumpThreshold = parseFloat(trimSlider.value);
  trimSlider.addEventListener("input", () => {
    STATE.jumpThreshold = parseFloat(trimSlider.value);
    trimVal.textContent = parseFloat(trimSlider.value).toFixed(2);
  });

  const contrastSlider = document.getElementById("contrast");
  const contrastVal = document.getElementById("contrast-val");
  STATE.radiusPower = parseFloat(contrastSlider.value);
  contrastSlider.addEventListener("input", () => {
    STATE.radiusPower = parseFloat(contrastSlider.value);
    contrastVal.textContent = parseFloat(contrastSlider.value).toFixed(2);
    reinit();
  });

  const floorSlider = document.getElementById("floor");
  const floorVal = document.getElementById("floor-val");
  STATE.radiusFloor = parseFloat(floorSlider.value);
  floorSlider.addEventListener("input", () => {
    STATE.radiusFloor = parseFloat(floorSlider.value);
    floorVal.textContent = parseFloat(floorSlider.value).toFixed(1);
    reinit();
  });

  let forceFadeTimer = null;
  function restartForces() {
    startPhysics();
    clearTimeout(forceFadeTimer);
    forceFadeTimer = setTimeout(() => fadeStopPhysics(CONFIG.physics.fadeDuration), 1500);
  }

  const attractionSlider = document.getElementById("attraction");
  const attractionVal = document.getElementById("attraction-val");
  attractionSlider.addEventListener("input", () => {
    CONFIG.physics.attractionStrength = parseFloat(attractionSlider.value);
    attractionVal.textContent = parseFloat(attractionSlider.value).toFixed(3);
    restartForces();
  });

  const repulsionSlider = document.getElementById("repulsion");
  const repulsionVal = document.getElementById("repulsion-val");
  repulsionSlider.addEventListener("input", () => {
    CONFIG.physics.repulsionStrength = parseFloat(repulsionSlider.value);
    repulsionVal.textContent = parseFloat(repulsionSlider.value).toFixed(3);
    restartForces();
  });

  attachAddTask(CONFIG.todoist.apiToken, async () => {
    await loadTodoistTasks(CONFIG.todoist.apiToken);
    reinit();
  });

  loop();
  window.addEventListener("resize", handleResize);
})();
