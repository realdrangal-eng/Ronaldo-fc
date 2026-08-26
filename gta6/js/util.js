/* ============================================================
   GTA VI — shared helpers
   ============================================================ */

const TAU = Math.PI * 2;

const clamp = (v, lo, hi) => v < lo ? lo : v > hi ? hi : v;
const lerp = (a, b, t) => a + (b - a) * t;
const rand = (a, b) => a + Math.random() * (b - a);
const randInt = (a, b) => Math.floor(rand(a, b + 1));
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const chance = p => Math.random() < p;

const dist2 = (ax, ay, bx, by) => {
  const dx = ax - bx, dy = ay - by;
  return dx * dx + dy * dy;
};
const dist = (ax, ay, bx, by) => Math.sqrt(dist2(ax, ay, bx, by));

/** Shortest signed angle from a to b, in (-PI, PI]. */
function angleDelta(a, b) {
  let d = (b - a) % TAU;
  if (d > Math.PI) d -= TAU;
  if (d < -Math.PI) d += TAU;
  return d;
}

/** Rotate a point around the origin. */
function rot(x, y, a) {
  const c = Math.cos(a), s = Math.sin(a);
  return { x: x * c - y * s, y: x * s + y * c };
}

/** Axis-aligned rect vs circle: pushes the circle out, returns true on contact. */
function resolveCircleRect(body, r, rect) {
  const nx = clamp(body.x, rect.x, rect.x + rect.w);
  const ny = clamp(body.y, rect.y, rect.y + rect.h);
  const dx = body.x - nx, dy = body.y - ny;
  const d2 = dx * dx + dy * dy;
  if (d2 > r * r) return false;

  if (d2 > 0.0001) {
    const d = Math.sqrt(d2);
    body.x = nx + (dx / d) * r;
    body.y = ny + (dy / d) * r;
    return true;
  }

  // Centre is inside the rect: push out through the nearest face.
  const left = body.x - rect.x, right = rect.x + rect.w - body.x;
  const top = body.y - rect.y, bottom = rect.y + rect.h - body.y;
  const m = Math.min(left, right, top, bottom);
  if (m === left) body.x = rect.x - r;
  else if (m === right) body.x = rect.x + rect.w + r;
  else if (m === top) body.y = rect.y - r;
  else body.y = rect.y + rect.h + r;
  return true;
}

function rectsOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

/** Rounded rectangle path, centred on the current transform origin. */
function roundRect(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

const fmtMoney = n => '$' + Math.max(0, Math.floor(n)).toLocaleString('en-US');
