export const SIDE_BASE_DESTRUCTION_FX = Object.freeze({
  shakeDuration: 0.18,
  shakeAmplitude: 1.6,
  smokePuffCount: 4,
  smokeRise: 22,
  smokeCycle: 1.6,
});

export function getSideBaseShakeOffset(elapsed, remaining) {
  if (remaining <= 0) return { x: 0, y: 0 };
  const strength = Math.max(0, Math.min(1, remaining / SIDE_BASE_DESTRUCTION_FX.shakeDuration));
  const envelope = strength * strength;
  const x = Math.sin(elapsed * 118) * SIDE_BASE_DESTRUCTION_FX.shakeAmplitude * envelope;
  const y = Math.sin(elapsed * 151 + 0.7) * (SIDE_BASE_DESTRUCTION_FX.shakeAmplitude * 0.65) * envelope;
  return { x, y };
}

export function getSmokePuffs(age, centerX, baseY) {
  const puffs = [];
  const count = SIDE_BASE_DESTRUCTION_FX.smokePuffCount;
  const cycle = SIDE_BASE_DESTRUCTION_FX.smokeCycle;

  for (let i = 0; i < count; i += 1) {
    const phase = (age / cycle + i / count) % 1;
    const fadeIn = Math.min(1, phase * 5);
    const fadeOut = Math.max(0, 1 - phase);
    const alpha = 0.34 * fadeIn * fadeOut;
    const drift = Math.sin((age * 2.1) + i * 1.7) * 3.2;
    const rise = phase * SIDE_BASE_DESTRUCTION_FX.smokeRise;
    const size = 3 + Math.floor(phase * 4);

    puffs.push({
      x: Math.round(centerX + drift + (i % 2 === 0 ? -2 : 2)),
      y: Math.round(baseY - rise),
      size,
      alpha,
      shade: i % 2 === 0 ? '#6b6d65' : '#85877f',
    });
  }

  return puffs;
}
