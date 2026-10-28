export function getFullscreenElement(doc = globalThis.document) {
  if (!doc) return null;
  return doc.fullscreenElement ?? doc.webkitFullscreenElement ?? null;
}

export function isFullscreenSupported(target, doc = globalThis.document) {
  if (!target || !doc) return false;
  return Boolean(
    target.requestFullscreen
    || target.webkitRequestFullscreen
    || doc.exitFullscreen
    || doc.webkitExitFullscreen,
  );
}

export async function enterFullscreen(target) {
  if (!target) return false;
  const request = target.requestFullscreen ?? target.webkitRequestFullscreen;
  if (typeof request !== 'function') return false;

  try {
    await request.call(target, { navigationUI: 'hide' });
    return true;
  } catch {
    try {
      await request.call(target);
      return true;
    } catch {
      return false;
    }
  }
}

export async function exitFullscreen(doc = globalThis.document) {
  if (!doc) return false;
  const exit = doc.exitFullscreen ?? doc.webkitExitFullscreen;
  if (typeof exit !== 'function') return false;

  try {
    await exit.call(doc);
    return true;
  } catch {
    return false;
  }
}

export function syncFullscreenButton(button, doc = globalThis.document) {
  if (!button) return false;
  const active = Boolean(getFullscreenElement(doc));
  button.classList?.toggle('is-fullscreen', active);
  button.setAttribute?.('aria-label', active ? 'Sair da tela cheia' : 'Abrir em tela cheia');
  button.setAttribute?.('title', active ? 'Sair da tela cheia' : 'Tela cheia');
  button.setAttribute?.('aria-pressed', active ? 'true' : 'false');
  return active;
}

export function setupFullscreenButton(button, target, doc = globalThis.document) {
  if (!button || !target || !doc) return false;

  if (!isFullscreenSupported(target, doc)) {
    button.hidden = true;
    return false;
  }

  button.hidden = false;
  syncFullscreenButton(button, doc);

  button.addEventListener?.('pointerdown', (event) => {
    event.stopPropagation?.();
  });

  button.addEventListener?.('click', async (event) => {
    event.preventDefault?.();
    event.stopPropagation?.();

    if (getFullscreenElement(doc)) {
      await exitFullscreen(doc);
    } else {
      await enterFullscreen(target);
    }
    syncFullscreenButton(button, doc);
  });

  const sync = () => syncFullscreenButton(button, doc);
  doc.addEventListener?.('fullscreenchange', sync);
  doc.addEventListener?.('webkitfullscreenchange', sync);
  return true;
}
