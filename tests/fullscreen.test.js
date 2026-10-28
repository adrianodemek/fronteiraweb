import assert from 'node:assert/strict';
import {
  enterFullscreen,
  exitFullscreen,
  getFullscreenElement,
  isFullscreenSupported,
  setupFullscreenButton,
  syncFullscreenButton,
} from '../src/ui/fullscreen.js';

function makeButton() {
  const listeners = {};
  const classes = new Set();
  const attrs = new Map();
  return {
    hidden: true,
    listeners,
    classes,
    attrs,
    classList: {
      toggle(name, force) {
        if (force) classes.add(name);
        else classes.delete(name);
      },
    },
    setAttribute(name, value) {
      attrs.set(name, value);
    },
    addEventListener(name, handler) {
      listeners[name] = handler;
    },
  };
}

const documentListeners = {};
const doc = {
  fullscreenElement: null,
  addEventListener(name, handler) {
    documentListeners[name] = handler;
  },
  async exitFullscreen() {
    this.fullscreenElement = null;
  },
};

const target = {
  async requestFullscreen() {
    doc.fullscreenElement = target;
  },
};

assert.equal(isFullscreenSupported(target, doc), true);
assert.equal(getFullscreenElement(doc), null);
assert.equal(await enterFullscreen(target), true);
assert.equal(getFullscreenElement(doc), target);
assert.equal(await exitFullscreen(doc), true);
assert.equal(getFullscreenElement(doc), null);

const button = makeButton();
assert.equal(setupFullscreenButton(button, target, doc), true);
assert.equal(button.hidden, false);
assert.equal(button.attrs.get('aria-label'), 'Abrir em tela cheia');
assert.equal(button.attrs.get('aria-pressed'), 'false');

const event = {
  preventDefault() {},
  stopPropagation() {},
};

await button.listeners.click(event);
assert.equal(doc.fullscreenElement, target);
assert.equal(button.classes.has('is-fullscreen'), true);
assert.equal(button.attrs.get('aria-label'), 'Sair da tela cheia');
assert.equal(button.attrs.get('aria-pressed'), 'true');

await button.listeners.click(event);
assert.equal(doc.fullscreenElement, null);
assert.equal(button.classes.has('is-fullscreen'), false);
assert.equal(button.attrs.get('aria-label'), 'Abrir em tela cheia');

const webkitDoc = { webkitFullscreenElement: null, webkitExitFullscreen() {} };
const webkitTarget = { webkitRequestFullscreen() {} };
assert.equal(isFullscreenSupported(webkitTarget, webkitDoc), true, 'Fallback WebKit deve ser aceito.');

const unsupportedButton = makeButton();
assert.equal(setupFullscreenButton(unsupportedButton, {}, {}), false);
assert.equal(unsupportedButton.hidden, true);

syncFullscreenButton(button, doc);
assert.equal(button.attrs.get('title'), 'Tela cheia');

console.log('fullscreen.test.js: PASS');
