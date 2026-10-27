// The shape of a page's dithered field, shared by the live field in the
// browser (dither-field.ts) and the still copies drawn into the site at build
// time: the share images and the field that closes each post.

// The same hash and generator as the project plates, so a page's path always
// makes the same field.
export function hash(text: string) {
  let h = 2166136261;
  for (const char of text) {
    h ^= char.charCodeAt(0);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function random(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type Field = { blobs: Float32Array; ripple: Float32Array };

// Blobs keep to the upper band and spread across its width.
export function fieldFor(path: string): Field {
  const next = random(hash(path));
  const blobs = new Float32Array(12);
  for (let i = 0; i < 3; i++) {
    blobs.set([(i + 0.2 + next() * 0.6) / 3, 0.1 + next() * 0.45, 0.18 + next() * 0.22, next() < 0.25 ? -0.5 : 1], i * 4);
  }
  return { blobs, ripple: Float32Array.of(next() * Math.PI * 2, 4 + next() * 8) };
}

// The fragment shader's field() at time zero, where u and v run from 0 to 1
// across and down a grid of columns by rows of cells.
export function fieldValue({ blobs, ripple }: Field, u: number, v: number, columns: number, rows: number) {
  let value = 0;
  for (let i = 0; i < 3; i++) {
    const [x, y, size, weight] = blobs.subarray(i * 4, i * 4 + 4);
    const phase = i * 2.1 + x * 6;
    const dx = (u - (x + 0.06 * Math.sin(phase))) * (columns / rows);
    const dy = v - (y + 0.06 * Math.cos(phase));
    value += weight * Math.exp(-(dx * dx + dy * dy) / (size * size));
  }
  return value + 0.12 * Math.sin((u * columns * Math.cos(ripple[0]) + v * rows * Math.sin(ripple[0])) / ripple[1]);
}

export function smoothstep(edge0: number, edge1: number, x: number) {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

// The shader's 4×4 Bayer threshold for the cell whose center is (x, y),
// counted up from the bottom as WebGL does.
function bayer2(x: number, y: number) {
  x = Math.floor(x);
  y = Math.floor(y);
  const sum = x * 0.5 + y * y * 0.75;
  return sum - Math.floor(sum);
}

function bayer4(x: number, y: number) {
  return bayer2(0.5 * x, 0.5 * y) * 0.25 + bayer2(x, y);
}

// The inked cells of a grid as an SVG path, one rectangle per run of cells in
// a row. level(u, v) gives each cell's ink, from 0 to 1, which the Bayer
// threshold turns into dots.
export function ditherPath(columns: number, rows: number, cell: number, level: (u: number, v: number) => number) {
  let path = '';
  for (let row = 0; row < rows; row++) {
    let run = 0;
    for (let column = 0; column <= columns; column++) {
      const inked = column < columns && level((column + 0.5) / columns, (row + 0.5) / rows) > bayer4(column + 0.5, rows - row - 0.5);
      if (inked) {
        run++;
      } else if (run > 0) {
        path += `M${(column - run) * cell} ${row * cell}h${run * cell}v${cell}h${-run * cell}z`;
        run = 0;
      }
    }
  }
  return path;
}
