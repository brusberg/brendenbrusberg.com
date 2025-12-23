/**
 * PerlinNoise - Smooth noise generation for lightning effects
 * Based on Ken Perlin's improved noise algorithm
 */

// Permutation table
const permutation = [
  151, 160, 137, 91, 90, 15, 131, 13, 201, 95, 96, 53, 194, 233, 7, 225,
  140, 36, 103, 30, 69, 142, 8, 99, 37, 240, 21, 10, 23, 190, 6, 148,
  247, 120, 234, 75, 0, 26, 197, 62, 94, 252, 219, 203, 117, 35, 11, 32,
  57, 177, 33, 88, 237, 149, 56, 87, 174, 20, 125, 136, 171, 168, 68, 175,
  74, 165, 71, 134, 139, 48, 27, 166, 77, 146, 158, 231, 83, 111, 229, 122,
  60, 211, 133, 230, 220, 105, 92, 41, 55, 46, 245, 40, 244, 102, 143, 54,
  65, 25, 63, 161, 1, 216, 80, 73, 209, 76, 132, 187, 208, 89, 18, 169,
  200, 196, 135, 130, 116, 188, 159, 86, 164, 100, 109, 198, 173, 186, 3, 64,
  52, 217, 226, 250, 124, 123, 5, 202, 38, 147, 118, 126, 255, 82, 85, 212,
  207, 206, 59, 227, 47, 16, 58, 17, 182, 189, 28, 42, 223, 183, 170, 213,
  119, 248, 152, 2, 44, 154, 163, 70, 221, 153, 101, 155, 167, 43, 172, 9,
  129, 22, 39, 253, 19, 98, 108, 110, 79, 113, 224, 232, 178, 185, 112, 104,
  218, 246, 97, 228, 251, 34, 242, 193, 238, 210, 144, 12, 191, 179, 162, 241,
  81, 51, 145, 235, 249, 14, 239, 107, 49, 192, 214, 31, 181, 199, 106, 157,
  184, 84, 204, 176, 115, 121, 50, 45, 127, 4, 150, 254, 138, 236, 205, 93,
  222, 114, 67, 29, 24, 72, 243, 141, 128, 195, 78, 66, 215, 61, 156, 180,
];

// Double permutation table for faster lookup
const p = new Array(512);
for (let i = 0; i < 256; i++) {
  p[i] = permutation[i] ?? 0;
  p[256 + i] = permutation[i] ?? 0;
}

/**
 * Fade function for smooth interpolation
 */
function fade(t: number): number {
  return t * t * t * (t * (t * 6 - 15) + 10);
}

/**
 * Linear interpolation
 */
function lerp(t: number, a: number, b: number): number {
  return a + t * (b - a);
}

/**
 * Gradient function
 */
function grad(hash: number, x: number, y: number): number {
  const h = hash & 15;
  const u = h < 8 ? x : y;
  const v = h < 4 ? y : h === 12 || h === 14 ? x : 0;
  return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
}

/**
 * 2D Perlin noise
 * Returns value between -1 and 1
 */
export function noise2D(x: number, y: number): number {
  // Find unit square containing point
  const X = Math.floor(x) & 255;
  const Y = Math.floor(y) & 255;

  // Find relative x, y in square
  x -= Math.floor(x);
  y -= Math.floor(y);

  // Compute fade curves
  const u = fade(x);
  const v = fade(y);

  // Hash coordinates of square corners
  const A = (p[X] ?? 0) + Y;
  const AA = p[A] ?? 0;
  const AB = p[A + 1] ?? 0;
  const B = (p[X + 1] ?? 0) + Y;
  const BA = p[B] ?? 0;
  const BB = p[B + 1] ?? 0;

  // Blend results from corners
  return lerp(
    v,
    lerp(u, grad(p[AA] ?? 0, x, y), grad(p[BA] ?? 0, x - 1, y)),
    lerp(u, grad(p[AB] ?? 0, x, y - 1), grad(p[BB] ?? 0, x - 1, y - 1))
  );
}

/**
 * 1D Perlin noise (uses 2D with fixed y)
 */
export function noise1D(x: number): number {
  return noise2D(x, 0);
}

/**
 * Fractal Brownian Motion - multiple octaves of noise
 * Creates more detailed, natural-looking noise
 */
export function fbm(
  x: number,
  y: number,
  octaves: number = 4,
  lacunarity: number = 2,
  persistence: number = 0.5
): number {
  let value = 0;
  let amplitude = 1;
  let frequency = 1;
  let maxValue = 0;

  for (let i = 0; i < octaves; i++) {
    value += amplitude * noise2D(x * frequency, y * frequency);
    maxValue += amplitude;
    amplitude *= persistence;
    frequency *= lacunarity;
  }

  return value / maxValue;
}

/**
 * Generate smooth lightning bolt points using Perlin noise
 * Returns array of {x, y} points from start to end
 */
export function generateLightningPath(
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  segments: number = 30,
  amplitude: number = 30,
  timeOffset: number = 0
): Array<{ x: number; y: number }> {
  const points: Array<{ x: number; y: number }> = [];

  for (let i = 0; i <= segments; i++) {
    const t = i / segments;

    // Base position along the line
    const baseX = startX + (endX - startX) * t;
    const baseY = startY + (endY - startY) * t;

    // Apply Perlin noise displacement perpendicular to the line
    // More displacement in the middle, less at ends
    const midFactor = Math.sin(t * Math.PI);
    const noiseValue = noise2D(t * 5 + timeOffset, timeOffset * 0.5);
    const displacement = noiseValue * amplitude * midFactor;

    // Calculate perpendicular direction
    const dx = endX - startX;
    const dy = endY - startY;
    const length = Math.sqrt(dx * dx + dy * dy);
    const perpX = -dy / length;
    const perpY = dx / length;

    points.push({
      x: baseX + perpX * displacement,
      y: baseY + perpY * displacement,
    });
  }

  return points;
}

