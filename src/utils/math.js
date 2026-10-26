export function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function moveToward(entity, target, amount) {
  const dx = target.x - entity.x;
  const dy = target.y - entity.y;
  const length = Math.hypot(dx, dy);

  if (length <= 0.001) return;

  const step = Math.min(amount, length);
  entity.x += (dx / length) * step;
  entity.y += (dy / length) * step;
}
