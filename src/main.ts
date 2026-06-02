import './styles.css';
import { AntPatchSimulation } from './sim/AntPatchSimulation';
import type { TaskAllocation } from './sim/AntModel';

const canvas = document.querySelector<HTMLCanvasElement>('#patch-canvas');
const loading = document.querySelector<HTMLElement>('#loading');
const errorMessage = document.querySelector<HTMLElement>('#error-message');
const allocationTriangle = document.querySelector<SVGSVGElement>('#allocation-triangle');
const allocationThumb = document.querySelector<SVGCircleElement>('#allocation-thumb');
const foragePercent = document.querySelector<HTMLElement>('#forage-percent');
const digPercent = document.querySelector<HTMLElement>('#dig-percent');
const nursePercent = document.querySelector<HTMLElement>('#nurse-percent');
const antCount = document.querySelector<HTMLElement>('#ant-count');
const foodCount = document.querySelector<HTMLElement>('#food-count');
const broodCount = document.querySelector<HTMLElement>('#brood-count');
const reduceMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

let simulation: AntPatchSimulation | null = null;
let trackerTimer = 0;
let currentAllocation: TaskAllocation = {
  forage: 0.62,
  dig: 0.34,
  nurse: 0.04,
};

const allocationVertices = {
  forage: { x: 50, y: 6 },
  dig: { x: 8, y: 78 },
  nurse: { x: 92, y: 78 },
} satisfies Record<keyof TaskAllocation, { x: number; y: number }>;

function showError(message: string): void {
  if (loading) {
    loading.hidden = true;
  }

  if (errorMessage) {
    errorMessage.hidden = false;
    errorMessage.textContent = message;
  }
}

function start(): void {
  if (!canvas) {
    showError('Canvas not found.');
    return;
  }

  try {
    simulation = new AntPatchSimulation(canvas, {
      reducedMotion: reduceMotionQuery.matches,
    });
    (window as Window & { __antSim?: AntPatchSimulation }).__antSim = simulation;
    simulation.setTaskAllocation(currentAllocation);

    simulation.start();
    updateTracker();
    trackerTimer = window.setInterval(updateTracker, 500);
    loading?.setAttribute('hidden', 'true');
  } catch (error) {
    console.error(error);
    showError('WebGL is not available in this browser.');
  }
}

function updateAllocation(allocation: TaskAllocation): void {
  currentAllocation = allocation;
  simulation?.setTaskAllocation(allocation);

  const position = allocationToPoint(allocation);
  allocationThumb?.setAttribute('cx', position.x.toFixed(2));
  allocationThumb?.setAttribute('cy', position.y.toFixed(2));

  const forage = Math.round(allocation.forage * 100);
  const dig = Math.round(allocation.dig * 100);
  const nurse = Math.max(0, 100 - forage - dig);

  if (foragePercent) {
    foragePercent.textContent = String(forage);
  }

  if (digPercent) {
    digPercent.textContent = String(dig);
  }

  if (nursePercent) {
    nursePercent.textContent = String(nurse);
  }

  allocationTriangle?.setAttribute('aria-valuetext', `${forage}% forage, ${dig}% dig, ${nurse}% nurse`);
}

function updateTracker(): void {
  if (!simulation) {
    return;
  }

  const snapshot = simulation.snapshot();

  if (antCount) {
    antCount.textContent = String(snapshot.ants.length);
  }

  if (foodCount) {
    foodCount.textContent = String(snapshot.storedFood + snapshot.food.reduce((sum, food) => sum + food.amount, 0));
  }

  if (broodCount) {
    broodCount.textContent = String(snapshot.larvae.length);
  }
}

function allocationToPoint(allocation: TaskAllocation): { x: number; y: number } {
  return {
    x:
      allocation.forage * allocationVertices.forage.x +
      allocation.dig * allocationVertices.dig.x +
      allocation.nurse * allocationVertices.nurse.x,
    y:
      allocation.forage * allocationVertices.forage.y +
      allocation.dig * allocationVertices.dig.y +
      allocation.nurse * allocationVertices.nurse.y,
  };
}

function allocationFromPoint(x: number, y: number): TaskAllocation {
  const a = allocationVertices.forage;
  const b = allocationVertices.dig;
  const c = allocationVertices.nurse;
  const denominator = (b.y - c.y) * (a.x - c.x) + (c.x - b.x) * (a.y - c.y);
  const forage = ((b.y - c.y) * (x - c.x) + (c.x - b.x) * (y - c.y)) / denominator;
  const dig = ((c.y - a.y) * (x - c.x) + (a.x - c.x) * (y - c.y)) / denominator;
  const nurse = 1 - forage - dig;
  const clamped = {
    forage: Math.max(0, forage),
    dig: Math.max(0, dig),
    nurse: Math.max(0, nurse),
  };
  const total = Math.max(0.001, clamped.forage + clamped.dig + clamped.nurse);

  return {
    forage: clamped.forage / total,
    dig: clamped.dig / total,
    nurse: clamped.nurse / total,
  };
}

function updateAllocationFromPointer(event: PointerEvent): void {
  if (!allocationTriangle) {
    return;
  }

  const rect = allocationTriangle.getBoundingClientRect();
  const x = ((event.clientX - rect.left) / rect.width) * 100;
  const y = ((event.clientY - rect.top) / rect.height) * 86;
  updateAllocation(allocationFromPoint(x, y));
}

allocationTriangle?.addEventListener('pointerdown', (event) => {
  allocationTriangle.setPointerCapture(event.pointerId);
  updateAllocationFromPointer(event);
});

allocationTriangle?.addEventListener('pointermove', (event) => {
  if (event.buttons === 1) {
    updateAllocationFromPointer(event);
  }
});

allocationTriangle?.addEventListener('keydown', (event) => {
  const step = event.shiftKey ? 0.08 : 0.03;
  let next = currentAllocation;

  if (event.key === 'ArrowUp') {
    next = { forage: currentAllocation.forage + step, dig: currentAllocation.dig - step / 2, nurse: currentAllocation.nurse - step / 2 };
  } else if (event.key === 'ArrowLeft') {
    next = { forage: currentAllocation.forage - step / 2, dig: currentAllocation.dig + step, nurse: currentAllocation.nurse - step / 2 };
  } else if (event.key === 'ArrowRight') {
    next = { forage: currentAllocation.forage - step / 2, dig: currentAllocation.dig - step / 2, nurse: currentAllocation.nurse + step };
  } else {
    return;
  }

  event.preventDefault();
  const total = Math.max(0.001, Math.max(0, next.forage) + Math.max(0, next.dig) + Math.max(0, next.nurse));
  updateAllocation({
    forage: Math.max(0, next.forage) / total,
    dig: Math.max(0, next.dig) / total,
    nurse: Math.max(0, next.nurse) / total,
  });
});

reduceMotionQuery.addEventListener('change', (event) => {
  simulation?.setReducedMotion(event.matches);
});

document.addEventListener('visibilitychange', () => {
  if (!simulation) {
    return;
  }

  if (document.hidden) {
    simulation.stop();
  } else {
    simulation.start();
  }
});

window.addEventListener('beforeunload', () => {
  window.clearInterval(trackerTimer);
  simulation?.dispose();
  simulation = null;
  delete (window as Window & { __antSim?: AntPatchSimulation }).__antSim;
});

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', start, { once: true });
} else {
  start();
}

updateAllocation(currentAllocation);
