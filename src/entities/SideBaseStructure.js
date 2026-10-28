import { Structure } from './Structure.js?v=0.6.23';
import { SIDE_BASE_FRONT_SPRITE } from '../assets/structures/side-base/base_front.sprite.js?v=0.6.28';
import { SIDE_BASE_BACK_SPRITE } from '../assets/structures/side-base/base_back.sprite.js?v=0.6.28';
import { SIDE_BASE_FRONT_DESTROYED_SPRITE } from '../assets/structures/side-base/base_front_destroyed.sprite.js?v=0.6.30';
import { SIDE_BASE_BACK_DESTROYED_SPRITE } from '../assets/structures/side-base/base_back_destroyed.sprite.js?v=0.6.30';

const SIDE_BASE_WIDTH = 70;
const SIDE_BASE_HEIGHT = 44;
const RUN_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

function decodeValue(char) {
  return RUN_ALPHABET.indexOf(char);
}

export function createSideBaseSpriteCanvas(definition) {
  if (typeof document === 'undefined' || typeof document.createElement !== 'function') return null;

  const canvas = document.createElement('canvas');
  canvas.width = definition.width;
  canvas.height = definition.height;
  const ctx = canvas.getContext?.('2d');
  if (!ctx) return null;

  if ('imageSmoothingEnabled' in ctx) ctx.imageSmoothingEnabled = false;

  for (let i = 0; i < definition.runs.length; i += 4) {
    const colorIndex = decodeValue(definition.runs[i]);
    const x = decodeValue(definition.runs[i + 1]);
    const y = decodeValue(definition.runs[i + 2]);
    const length = decodeValue(definition.runs[i + 3]) + 1;
    const paletteOffset = colorIndex * 6;

    if (colorIndex < 0 || x < 0 || y < 0 || length <= 0 || paletteOffset + 6 > definition.palette.length) continue;

    ctx.fillStyle = `#${definition.palette.slice(paletteOffset, paletteOffset + 6)}`;
    ctx.fillRect(x, y, length, 1);
  }

  return canvas;
}

const SIDE_BASE_SPRITES = Object.freeze({
  front: createSideBaseSpriteCanvas(SIDE_BASE_FRONT_SPRITE),
  back: createSideBaseSpriteCanvas(SIDE_BASE_BACK_SPRITE),
  frontDestroyed: createSideBaseSpriteCanvas(SIDE_BASE_FRONT_DESTROYED_SPRITE),
  backDestroyed: createSideBaseSpriteCanvas(SIDE_BASE_BACK_DESTROYED_SPRITE),
});

function drawPixelSprite(ctx, sprite, x, y, w, h, flash = false) {
  if (!sprite || typeof ctx.drawImage !== 'function') return false;

  const canSave = typeof ctx.save === 'function' && typeof ctx.restore === 'function';
  if (canSave) ctx.save();
  if ('imageSmoothingEnabled' in ctx) ctx.imageSmoothingEnabled = false;

  ctx.drawImage(sprite, x, y, w, h);

  if (flash && 'globalAlpha' in ctx) {
    const previousAlpha = ctx.globalAlpha;
    ctx.globalAlpha = 0.2;
    ctx.drawImage(sprite, x, y, w, h);
    ctx.globalAlpha = previousAlpha ?? 1;
  }

  if (canSave) ctx.restore();
  return true;
}

export class SideBaseStructure extends Structure {
  draw(ctx, palette) {
    if (this.kind !== 'base') {
      super.draw(ctx, palette);
      return;
    }

    const isPlayer = this.team === 'player';
    const w = SIDE_BASE_WIDTH;
    const h = SIDE_BASE_HEIGHT;
    const x = Math.round(this.x - w / 2);
    const y = Math.round(this.y - h / 2);

    if (!this.alive) {
      const destroyedSprite = isPlayer ? SIDE_BASE_SPRITES.backDestroyed : SIDE_BASE_SPRITES.frontDestroyed;
      if (!drawPixelSprite(ctx, destroyedSprite, x, y, w, h, false)) {
        this.drawDestroyed(ctx, palette, x, y, w, h, false);
      }
      return;
    }

    const sprite = isPlayer ? SIDE_BASE_SPRITES.back : SIDE_BASE_SPRITES.front;
    const body = isPlayer ? palette.player : palette.enemy;
    const light = isPlayer ? palette.playerLight : palette.enemyLight;

    if (!drawPixelSprite(ctx, sprite, x, y, w, h, this.flash > 0)) {
      super.drawSideBase(ctx, palette, x, y, w, h, body, light);
    }

    this.drawHpBar(ctx, palette, x, y, w, isPlayer, false);
  }
}

export const SIDE_BASE_VISUAL_META = Object.freeze({
  width: SIDE_BASE_WIDTH,
  height: SIDE_BASE_HEIGHT,
  sourceWidth: 64,
  sourceHeight: 40,
  destroyedSourceWidth: 48,
  destroyedSourceHeight: 30,
  spriteBased: true,
  assetDirectory: 'src/assets/structures/side-base/',
  enemyView: 'front',
  playerView: 'back',
  frontAsset: 'base_front.sprite.js',
  backAsset: 'base_back.sprite.js',
  enemyDestroyedAsset: 'base_front_destroyed.sprite.js',
  playerDestroyedAsset: 'base_back_destroyed.sprite.js',
  destroyedSwapCondition: 'hp<=0',
  destroyedUsesTeamPerspective: true,
  storageFormat: 'text-rle-pixel-sprite',
  sameVisualSizeBothTeams: true,
  transparentBackground: true,
  visiblePixelValidation: true,
  pixelArt: true,
  imageSmoothing: false,
  gameplayHitRadiusUnchanged: 22,
  release: '0.6.30',
});
