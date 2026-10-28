export const SIDE_BASE_DESTRUCTION_FX = Object.freeze({
  shakeDuration: 1.1,
  shakeAmplitude: 2.2,
  shakeDecayPower: 1.6,
  smokePuffCount: 8,
  smokeRise: 34,
  smokeCycle: 2.2,
  smokeMaxAlpha: 0.56,
});

export function getSideBaseShakeOffset(elapsed, remaining) {
  if (remaining <= 0) return { x: 0, y: 0 };

  const strength = Math.max(0, Math.min(1, remaining / SIDE_BASE_DESTRUCTION_FX.shakeDuration));
  // Impacto perceptível no início, perdendo força de forma progressiva durante
  // toda a janela de ~1,1 s em vez de parar abruptamente.
  const envelope = Math.pow(strength, SIDE_BASE_DESTRUCTION_FX.shakeDecayPower);
  const x = Math.sin(elapsed * 95) * SIDE_BASE_DESTRUCTION_FX.shakeAmplitude * envelope;
  const y = Math.sin(elapsed * 127 + 0.7) * (SIDE_BASE_DESTRUCTION_FX.shakeAmplitude * 0.65) * envelope;
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
    const alpha = SIDE_BASE_DESTRUCTION_FX.smokeMaxAlpha * fadeIn * fadeOut;
    const drift = Math.sin((age * 1.8) + i * 1.45) * 5;
    const rise = phase * SIDE_BASE_DESTRUCTION_FX.smokeRise;
    const size = 5 + Math.floor(phase * 5);

    puffs.push({
      x: Math.round(centerX + drift + (i % 2 === 0 ? -4 : 4)),
      y: Math.round(baseY - rise),
      size,
      alpha,
      shade: i % 3 === 0 ? '#50544e' : i % 2 === 0 ? '#686d65' : '#858981',
    });
  }

  return puffs;
}
