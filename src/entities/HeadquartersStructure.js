import { Structure } from './Structure.js?v=0.6.23';

export const HQ_RUNTIME_ASSET_PATHS = Object.freeze({
  enemy: new URL('../assets/structures/hq/hq_front.png?v=0.6.24&hq=enemy-front', import.meta.url).href,
  player: new URL('../assets/structures/hq/hq_back.png?v=0.6.24&hq=player-back', import.meta.url).href,
});

function createSprite(src) {
  if (typeof Image === 'undefined') return null;
  const image = new Image();
  image.decoding = 'async';
  image.src = src;
  return image;
}

const HQ_RUNTIME_SPRITES = Object.freeze({
  enemy: createSprite(HQ_RUNTIME_ASSET_PATHS.enemy),
  player: createSprite(HQ_RUNTIME_ASSET_PATHS.player),
});

export class HeadquartersStructure extends Structure {
  drawHeadquarters(ctx, palette, x, y, w, h, isPlayer, body, light) {
    const slot = this.id === 'player-hq' ? 'player' : 'enemy';
    const sprite = HQ_RUNTIME_SPRITES[slot];

    if (sprite?.complete && sprite.naturalWidth > 0 && sprite.naturalHeight > 0 && typeof ctx.drawImage === 'function') {
      const canSave = typeof ctx.save === 'function' && typeof ctx.restore === 'function';

      if (canSave) ctx.save();
      if ('imageSmoothingEnabled' in ctx) ctx.imageSmoothingEnabled = false;

      // Os dois QGs ocupam exatamente a mesma caixa visual.
      // A identidade do sprite é fixa pelo id da estrutura:
      // player-hq = costas; enemy-hq = frente.
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
  playerAsset: 'hq_back.png',
  enemyStructureId: 'enemy-hq',
  enemyView: 'front',
  enemyAsset: 'hq_front.png',
  explicitStructureMapping: true,
  release: '0.6.24',
});
