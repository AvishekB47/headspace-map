export const CONFIG = {
  canvas: {
    maxSize: 520,
    minSize: 240,
    viewportPaddingX: 32,
    viewportPaddingY: 80,
    devicePixelRatioCap: 2,
    circleRadiusFactor: 0.44
  },

  bubbles: {
    fillFactor: 0.65,
    boundaryPadding: 4
  },

  physics: {
    attractionStrength: 0.004,
    repulsionStrength: 0.004,
    damping: 0.88,
    settleThreshold: 0.08,
    collisionIterations: 4,
    collisionStiffness: 0.9,
    boundaryStiffness: 0.12,
    fadeDuration: 500
  },

  labels: {
    minFontSize: 8,
    maxFontSize: 30,
    fontScale: 0.42,
    maxWidthFactor: 0.82
  },

  todoist: {
    apiToken: "93c30dd34608cc8a44da1c21729730617fa3277a"
  },

  appearance: {
    background: "#1a1a24",
    containerFill: "rgba(255,255,255,0.04)",
    containerStroke: "rgba(255,255,255,0.10)",
    bubbleAlpha: 0.85,
    draggedBubbleAlpha: 0.65,
    labelFill: "rgba(230,225,215,0.82)",
    draggedLabelFill: "rgba(255,250,240,0.95)"
  }
};
