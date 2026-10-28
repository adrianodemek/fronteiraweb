import { Structure } from './Structure.js?v=0.6.23';
import { HQ_FRONT_PERSPECTIVE_SPRITE } from '../assets/structures/hq/hq_front_perspective.sprite.js?v=0.6.29';
import { HQ_BACK_PERSPECTIVE_SPRITE } from '../assets/structures/hq/hq_back_perspective.sprite.js?v=0.6.29';

const PIXEL_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

export function createHqSpriteCanvas(definition, view) {
  if (typeof document === 'undefined' || typeof document.createElement !== 'function') return null;

  const canvas = document.createElement('canvas');
  canvas.width = definition.width;
  canvas.height = definition.height;
  canvas.__hqView = view;

  const ctx = canvas.getContext?.('2d');
  if (!ctx) return null;
  if ('imageSmoothingEnabled' in ctx) ctx.imageSmoothingEnabled = false;

  for (let y = 0; y < definition.height; y += 1) {
    let x = 0;
    while (x < definition.width) {
      const offset = y * definition.width + x;
      const colorIndex = PIXEL_ALPHABET.indexOf(definition.pixels[offset]);

      if (colorIndex < 0 || colorIndex === 63) {
        x += 1;
        continue;
      }

      let runLength = 1;
      while (x + runLength < definition.width) {
        const nextOffset = y * definition.width + x + runLength;
        if (definition.pixels[nextOffset] !== definition.pixels[offset]) break;
        runLength += 1;
      }

      const paletteOffset = colorIndex * 6;
      ctx.fillStyle = `#${definition.palette.slice(paletteOffset, paletteOffset + 6)}`;
      ctx.fillRect(x, y, runLength, 1);
      x += runLength;
    }
  }

  return canvas;
}

const HQ_RUNTIME_SPRITES = Object.freeze({
  enemy: createHqSpriteCanvas(HQ_FRONT_PERSPECTIVE_SPRITE, 'front'),
  player: createHqSpriteCanvas(HQ_BACK_PERSPECTIVE_SPRITE, 'back'),
});

export class HeadquartersStructure extends Structure {
  drawHeadquarters(ctx, palette, x, y, w, h, isPlayer, body, light) {
    const slot = this.id === 'player-hq' ? 'player' : 'enemy';
    const sprite = HQ_RUNTIME_SPRITES[slot];

    if (sprite && typeof ctx.drawImage === 'function') {
      const canSave = typeof ctx.save === 'function' && typeof ctx.restore === 'function';

      if (canSave) ctx.save();
      if ('imageSmoothingEnabled' in ctx) ctx.imageSmoothingEnabled = false;

      // Frente do inimigo e costas do jogador usam a mesma perspectiva elevada do mapa.
      ctx.drawImage(sprite, x, y, w, h);

      if (this.flash > 0 && 'globalAlpha' in ctx) {
        const previousAlpha = ctx.globalAlpha;
        ctx.globalAlpha = 0.2;
        ctx.drawImage(sprite, x, y, w, h);
        ctx.globalAlpha = previousAlpha ?? 1;
      }

      if (canSave) ctx.restore();
      return;
    }

    super.drawHeadquarters(ctx, palette, x, y, w, h, isPlayer, body, light);
  }
}

export const HQ_RUNTIME_META = Object.freeze({
  playerStructureId: 'player-hq',
  playerView: 'back',
  playerAsset: 'hq_back_perspective.sprite.js',
  enemyStructureId: 'enemy-hq',
  enemyView: 'front',
  enemyAsset: 'hq_front_perspective.sprite.js',
  explicitStructureMapping: true,
  sourceWidth: 96,
  sourceHeight: 60,
  renderWidth: 140,
  renderHeight: 88,
  storageFormat: 'text-palette-grid',
  transparentBackground: true,
  visiblePixelValidation: true,
  pixelArt: true,
  imageSmoothing: false,
  perspective: 'map-top-down-corrected',
  gameplayUnchanged: true,
  release: '0.6.29',
});
