// Draws the dithered field across the top of each page (DitherField.astro).
// It runs in a worker on an OffscreenCanvas where the browser supports that,
// so the page's main thread does no drawing at all, and on the main thread
// otherwise. Either way, this is the same code.

import { fieldFor } from './dither-pattern';

// One cell of the dither is this many CSS pixels.
export const CELL = 3;
// How long one page's field takes to become the next one's.
const MORPH_MS = 900;
// While only drifting, the field moves a few cells a second, so most frames
// would redraw the same dots; it redraws at 30 frames a second then, and on
// every frame while it answers the pointer or morphs into a new page's.
const DRIFT_FRAME_MS = 1000 / 30;

const VERTEX = `
  attribute vec2 position;
  void main() { gl_Position = vec4(position, 0.0, 1.0); }
`;

// A field is a few soft blobs that circle slowly around their resting places,
// plus a faint ripple. Two fields are blended while one page's becomes
// another's. The 4×4 Bayer threshold, the same matrix as the project plates,
// comes from the classic recursive form, since WebGL 1 has no integer
// operations.
const FRAGMENT = `
  precision mediump float;
  uniform vec2 resolution;
  uniform float time;
  uniform vec4 blobsFrom[3];
  uniform vec4 blobsTo[3];
  uniform vec2 rippleFrom;
  uniform vec2 rippleTo;
  uniform float morph;
  uniform vec2 pointer;
  uniform float heat;
  uniform vec3 ink;
  uniform vec3 hot;

  float bayer2(vec2 a) { a = floor(a); return fract(dot(a, vec2(0.5, a.y * 0.75))); }
  float bayer4(vec2 a) { return bayer2(0.5 * a) * 0.25 + bayer2(a); }

  float field(vec2 uv, vec4 blobs[3], vec2 ripple) {
    float value = 0.0;
    for (int i = 0; i < 3; i++) {
      vec4 blob = blobs[i];
      float phase = float(i) * 2.1 + blob.x * 6.0;
      vec2 center = blob.xy + 0.06 * vec2(sin(time * 0.11 + phase), cos(time * 0.09 + phase));
      vec2 delta = (uv - center) * vec2(resolution.x / resolution.y, 1.0);
      value += blob.w * exp(-dot(delta, delta) / (blob.z * blob.z));
    }
    vec2 direction = vec2(cos(ripple.x), sin(ripple.x));
    return value + 0.12 * sin(dot(uv * resolution, direction) / ripple.y + time * 0.25);
  }

  void main() {
    vec2 cell = gl_FragCoord.xy;
    vec2 uv = vec2(cell.x / resolution.x, 1.0 - cell.y / resolution.y);
    float value = mix(field(uv, blobsFrom, rippleFrom), field(uv, blobsTo, rippleTo), morph);
    // Sparse overall, and fading out toward the bottom of the band.
    float level = 0.22 * smoothstep(0.35, 1.2, value) * (1.0 - smoothstep(0.25, 1.0, uv.y));
    // Near the pointer the dots gather a little and tint toward the accent.
    vec2 away = (cell - pointer) / 18.0;
    float warmth = heat * exp(-dot(away, away));
    level += 0.08 * warmth;
    if (level <= bayer4(cell)) discard;
    gl_FragColor = vec4(mix(ink, hot, 0.35 * smoothstep(0.1, 0.5, warmth)), 1.0);
  }
`;

export type Message =
  | { type: 'size'; width: number; height: number }
  | { type: 'colors'; ink: number[]; hot: number[] }
  | { type: 'pointer'; x: number; y: number; inside: boolean }
  | { type: 'morph'; path: string }
  | { type: 'visible'; visible: boolean }
  | { type: 'reduce-motion'; reduce: boolean };

const frameRequest: (callback: (now: number) => void) => unknown =
  typeof requestAnimationFrame === 'function'
    ? requestAnimationFrame
    : (callback) => setTimeout(() => callback(performance.now()), 1000 / 60);

type Surface = {
  canvas: HTMLCanvasElement | OffscreenCanvas;
  gl: WebGLRenderingContext;
  u: Record<string, WebGLUniformLocation | null>;
};

// Sets up the shader on a canvas, or returns undefined without WebGL.
function surfaceOn(canvas: HTMLCanvasElement | OffscreenCanvas): Surface | undefined {
  const gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: false, antialias: false }) as WebGLRenderingContext | null;
  if (!gl) return undefined;
  const compile = (type: number, source: string) => {
    const shader = gl.createShader(type)!;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    return shader;
  };
  const program = gl.createProgram()!;
  gl.attachShader(program, compile(gl.VERTEX_SHADER, VERTEX));
  gl.attachShader(program, compile(gl.FRAGMENT_SHADER, FRAGMENT));
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return undefined;
  gl.useProgram(program);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, Float32Array.of(-1, -1, 3, -1, -1, 3), gl.STATIC_DRAW);
  const position = gl.getAttribLocation(program, 'position');
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
  const u = Object.fromEntries(
    ['resolution', 'time', 'blobsFrom', 'blobsTo', 'rippleFrom', 'rippleTo', 'morph', 'pointer', 'heat', 'ink', 'hot']
      .map((name) => [name, gl.getUniformLocation(program, name)]),
  );
  return { canvas, gl, u };
}

// The field's state lasts across pages; each page has its own canvas, which
// `attach` binds it to. (Moving one live WebGL canvas from page to page with
// transition:persist crashes Chrome when anything else, such as an
// extension's element, sits directly in <html>.) `send` passes it the rest of
// what it needs to know. `drawn` hears when a newly bound canvas has its first
// frame.
export function createField(path: string, reduce: boolean, drawn?: () => void) {
  let surface: Surface | undefined;
  let size = { width: 0, height: 0 };
  let colors = { ink: [0.8, 0.8, 0.8], hot: [0.02, 0.38, 1] };
  let from = fieldFor(path);
  let to = from;
  let morphStart = -Infinity;
  let pointer = { x: -1e4, y: -1e4 };
  let heat = 0;
  let heatTarget = 0;
  let visible = true;
  let reduceMotion = reduce;
  let scheduled = false;
  let lastDraw = -Infinity;
  // Something changed what's on screen, so the next frame draws.
  let changed = true;
  // The canvas was just bound and hasn't drawn yet.
  let fresh = false;
  const start = performance.now();

  const resize = () => {
    if (!surface) return;
    const { canvas, gl, u } = surface;
    canvas.width = Math.max(1, Math.ceil(size.width / CELL));
    canvas.height = Math.max(1, Math.ceil(size.height / CELL));
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform2f(u.resolution, canvas.width, canvas.height);
  };

  const draw = (now: number) => {
    const t = Math.min(1, (now - morphStart) / MORPH_MS);
    // Ease out, so the new field settles into place.
    const morph = 1 - (1 - t) ** 3;
    heat += (heatTarget - heat) * 0.08;
    if (surface) {
      const { gl, u } = surface;
      gl.uniform1f(u.time, reduceMotion ? 0 : (now - start) / 1000);
      gl.uniform4fv(u.blobsFrom, from.blobs);
      gl.uniform4fv(u.blobsTo, to.blobs);
      gl.uniform2fv(u.rippleFrom, from.ripple);
      gl.uniform2fv(u.rippleTo, to.ripple);
      gl.uniform1f(u.morph, morph);
      gl.uniform2f(u.pointer, pointer.x, pointer.y);
      gl.uniform1f(u.heat, heat);
      gl.uniform3fv(u.ink, colors.ink);
      gl.uniform3fv(u.hot, colors.hot);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      if (fresh) {
        fresh = false;
        drawn?.();
      }
    }
    // Still settling: a morph in progress or warmth still easing.
    return t < 1 || Math.abs(heatTarget - heat) > 0.001;
  };

  // With reduced motion, frames are drawn only when something changes, and
  // the field neither drifts nor answers the pointer.
  const loop = (now: number) => {
    scheduled = false;
    if (!visible || !surface) return;
    if (changed || now - lastDraw >= DRIFT_FRAME_MS) {
      changed = draw(now);
      lastDraw = now;
    }
    if (!reduceMotion || changed) schedule();
  };
  const schedule = () => {
    if (scheduled || !visible || !surface) return;
    scheduled = true;
    frameRequest(loop);
  };
  const update = () => {
    changed = true;
    schedule();
  };

  // Binds the field to a page's canvas, letting go of the last one. Returns
  // false without WebGL.
  const attach = (canvas: HTMLCanvasElement | OffscreenCanvas) => {
    surface?.gl.getExtension('WEBGL_lose_context')?.loseContext();
    surface = surfaceOn(canvas);
    fresh = true;
    resize();
    update();
    return Boolean(surface);
  };

  const send = (message: Message) => {
    switch (message.type) {
      case 'size':
        size = { width: message.width, height: message.height };
        resize();
        break;
      case 'colors':
        colors = { ink: message.ink, hot: message.hot };
        break;
      case 'pointer':
        if (reduceMotion) return;
        pointer = { x: message.x / CELL, y: Math.ceil(size.height / CELL) - message.y / CELL };
        heatTarget = message.inside ? 1 : 0;
        break;
      case 'morph':
        // A page's field grows out of the previous page's. A morph still in
        // progress jumps to its end first, which is rarely visible.
        from = to;
        to = fieldFor(message.path);
        morphStart = reduceMotion ? -Infinity : performance.now();
        break;
      case 'visible':
        visible = message.visible;
        break;
      case 'reduce-motion':
        reduceMotion = message.reduce;
        break;
    }
    update();
  };

  return { attach, send };
}
