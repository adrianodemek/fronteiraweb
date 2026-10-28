import { Structure } from './Structure.js?v=0.6.23';

const SIDE_BASE_WIDTH = 70;
const SIDE_BASE_HEIGHT = 44;

export const SIDE_BASE_ASSET_PATHS = Object.freeze({
  front: new URL('../assets/structures/side-base/base_front.png?v=0.6.27', import.meta.url).href,
  back: new URL('../assets/structures/side-base/base_back.png?v=0.6.27', import.meta.url).href,
});

function createSprite(src) {
  if (typeof Image === 'undefined') return null;
  const image = new Image();
  image.decoding = 'async';
  image.src = src;
  return image;
}

const SIDE_BASE_SPRITES = Object.freeze({
  front: createSprite(SIDE_BASE_ASSET_PATHS.front),
  back: createSprite(SIDE_BASE_ASSET_PATHS.back),
});

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
      this.drawDestroyed(ctx, palette, x, y, w, h, false);
      return;
    }

    const sprite = isPlayer ? SIDE_BASE_SPRITES.back : SIDE_BASE_SPRITES.front;
    const body = isPlayer ? palette.player : palette.enemy;
    const light = isPlayer ? palette.playerLight : palette.enemyLight;

    if (sprite?.complete && sprite.naturalWidth > 0 && sprite.naturalHeight > 0 && typeof ctx.drawImage === 'function') {
      const canSave = typeof ctx.save === 'function' && typeof ctx.restore === 'function';
      if (canSave) ctx.save();
      if ('imageSmoothingEnabled' in ctx) ctx.imageSmoothingEnabled = false;

      ctx.drawImage(sprite, x, y, w, h);

      if (this.flash > 0 && 'globalAlpha' in ctx) {
        const previousAlpha = ctx.globalAlpha;
        ctx.globalAlpha = 0.2;
        ctx.drawImage(sprite, x, y, w, h);
        ctx.globalAlpha = previousAlpha ?? 1;
      }

      if (canSave) ctx.restore();
    } else {
      // Mantém o desenho procedural antigo apenas como fallback de carregamento.
      super.drawSideBase(ctx, palette, x, y, w, h, body, light);
    }

    this.drawHpBar(ctx, palette, x, y, w, isPlayer, false);
  }
}

export const SIDE_BASE_VISUAL_META = Object.freeze({
  width: SIDE_BASE_WIDTH,
  height: SIDE_BASE_HEIGHT,
  spriteBased: true,
  assetDirectory: 'src/assets/structures/side-base/',
  enemyView: 'front',
  playerView: 'back',
  frontAsset: 'base_front.png',
  backAsset: 'base_back.png',
  sameVisualSizeBothTeams: true,
  transparentBackground: true,
  pixelArt: true,
  imageSmoothing: false,
  gameplayHitRadiusUnchanged: 22,
  release: '0.6.27',
});
