import { distance } from '../utils/math.js';

const HQ_WIDTH = 140;
const HQ_HEIGHT = 88;
const HQ_FIELD_INSET_Y = 15;
const HQ_CANNON_MOUNT_OFFSET_X = 0;
const HQ_CANNON_MOUNT_OFFSET_Y = -10;

export const HQ_ASSET_PATHS = Object.freeze({
  front: new URL('../assets/structures/hq/hq_front.png?v=0.6.23', import.meta.url).href,
  back: new URL('../assets/structures/hq/hq_back.png?v=0.6.23', import.meta.url).href,
});

function createSprite(src) {
  if (typeof Image === 'undefined') return null;

  const image = new Image();
  image.decoding = 'async';
  image.src = src;
  return image;
}

const HQ_SPRITES = Object.freeze({
  front: createSprite(HQ_ASSET_PATHS.front),
  back: createSprite(HQ_ASSET_PATHS.back),
});

export class Structure {
  constructor(data) {
    Object.assign(this, data);
    this.maxHp = data.hp;
    this.cooldown = Math.random() * 0.25;
    this.flash = 0;
    this.hitRadius = data.kind === 'hq' ? 28 : 22;
    this.active = data.startsActive ?? data.kind !== 'hq';
  }

  get alive() {
    return this.hp > 0;
  }

  activate() {
    if (this.alive) this.active = true;
  }

  takeDamage(amount) {
    if (amount <= 0 || !this.alive) return;
    if (this.kind === 'hq') this.activate();
    this.hp = Math.max(0, this.hp - amount);
    this.flash = 0.08;
  }

  getSurfaceDistanceTo(unit) {
    const centerDistance = distance(this, unit);
    const targetRadius = unit.radius ?? 0;
    return Math.max(0, centerDistance - this.hitRadius - targetRadius);
  }

  update(dt, units) {
    this.cooldown = Math.max(0, this.cooldown - dt);
    this.flash = Math.max(0, this.flash - dt);
    if (!this.alive || this.cooldown > 0) return;
    if (this.kind === 'hq' && !this.active) return;

    let target = null;
    let bestSurfaceDistance = Infinity;

    for (const unit of units) {
      if (!unit.alive || unit.team === this.team) continue;

      const surfaceDistance = this.getSurfaceDistanceTo(unit);
      if (surfaceDistance <= this.range && surfaceDistance < bestSurfaceDistance) {
        bestSurfaceDistance = surfaceDistance;
        target = unit;
      }
    }

    if (target) {
      target.takeDamage(this.damage);
      this.cooldown = this.attackDelay;
      this.flash = 0.12;
    }
  }

  draw(ctx, palette) {
    const isHq = this.kind === 'hq';
    const isPlayer = this.team === 'player';
    const w = isHq ? HQ_WIDTH : 44;
    const h = isHq ? HQ_HEIGHT : 46;
    const x = Math.round(this.x - w / 2);

    // O QG usa uma âncora visual voltada para fora do centro da arena.
    // Assim o inimigo ocupa o terreno atrás das bases superiores e o QG
    // do jogador ocupa o terreno atrás das bases inferiores, mantendo a
    // leitura de profundidade/perspectiva do mapa e evitando sobreposição.
    const y = isHq
      ? Math.round(isPlayer ? this.y - HQ_FIELD_INSET_Y : this.y - h + HQ_FIELD_INSET_Y)
      : Math.round(this.y - h / 2);

    if (!this.alive) {
      this.drawDestroyed(ctx, palette, x, y, w, h, isHq);
      return;
    }

    const body = isPlayer ? palette.player : palette.enemy;
    const light = isPlayer ? palette.playerLight : palette.enemyLight;

    if (isHq) {
      this.drawHeadquarters(ctx, palette, x, y, w, h, isPlayer, body, light);
    } else {
      this.drawSideBase(ctx, palette, x, y, w, h, body, light);
    }

    if (!isHq || this.hp < this.maxHp) {
      this.drawHpBar(ctx, palette, x, y, w, isPlayer, isHq);
    }
  }

  drawHeadquarters(ctx, palette, x, y, w, h, isPlayer, body, light) {
    const sprite = isPlayer ? HQ_SPRITES.back : HQ_SPRITES.front;

    if (sprite?.complete && sprite.naturalWidth > 0 && sprite.naturalHeight > 0 && typeof ctx.drawImage === 'function') {
      const canSave = typeof ctx.save === 'function' && typeof ctx.restore === 'function';

      if (canSave) ctx.save();
      if ('imageSmoothingEnabled' in ctx) ctx.imageSmoothingEnabled = false;

      // Frente e costas possuem recortes-fonte com 1 px de diferença de altura.
      // Desenhamos ambos exatamente na mesma caixa para que os dois QGs tenham
      // o mesmo tamanho perceptivo no campo.
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

    this.drawHeadquartersLoadingFallback(ctx, palette, x, y, w, h, body, light, isPlayer);
  }

  drawHeadquartersLoadingFallback(ctx, palette, x, y, w, h, body, light, isPlayer) {
    ctx.fillStyle = 'rgba(20, 24, 19, 0.28)';
    ctx.fillRect(x + 7, y + h - 3, w - 14, 6);

    ctx.fillStyle = palette.outline;
    ctx.fillRect(x + 8, y + 13, w - 16, h - 14);
    ctx.fillStyle = '#77715f';
    ctx.fillRect(x + 11, y + 16, w - 22, h - 20);

    const mountX = Math.round(this.x - 14);
    ctx.fillStyle = '#292d28';
    ctx.fillRect(mountX, y + 6, 28, 9);
    ctx.fillStyle = '#a58d4f';
    ctx.fillRect(mountX + 4, y + 8, 20, 3);

    if (!isPlayer) {
      ctx.fillStyle = palette.outline;
      ctx.fillRect(Math.round(this.x - 8), y + h - 20, 16, 17);
      ctx.fillStyle = '#242923';
      ctx.fillRect(Math.round(this.x - 5), y + h - 17, 10, 14);
    } else {
      ctx.fillStyle = '#5b584b';
      ctx.fillRect(Math.round(this.x - 13), y + h - 17, 26, 12);
    }

    ctx.fillStyle = body;
    ctx.fillRect(x + 12, y + h - 8, 7, 3);
    ctx.fillStyle = light;
    ctx.fillRect(x + w - 19, y + h - 8, 7, 3);
  }

  drawSideBase(ctx, palette, x, y, w, h, body, light) {
    ctx.fillStyle = 'rgba(20, 24, 19, 0.30)';
    ctx.fillRect(x + 3, y + h - 3, w, 7);

    ctx.fillStyle = palette.outline;
    ctx.fillRect(x - 2, y + 3, w + 4, h - 1);

    ctx.fillStyle = '#b8b3a0';
    ctx.fillRect(x, y, w, 8);
    ctx.fillRect(x, y + 8, 7, h - 16);
    ctx.fillRect(x + w - 7, y + 8, 7, h - 16);

    ctx.fillStyle = this.flash > 0 ? light : body;
    ctx.fillRect(x + 7, y + 8, w - 14, h - 15);

    ctx.fillStyle = light;
    ctx.fillRect(x + 10, y + 12, w - 20, 6);

    ctx.fillStyle = palette.outline;
    ctx.fillRect(Math.round(this.x - 5), y + 17, 10, 9);

    ctx.fillStyle = palette.sandbag;
    for (let i = 4; i < w - 4; i += 9) {
      ctx.fillRect(x + i, y + h - 7, 8, 5);
    }
  }

  drawDestroyed(ctx, palette, x, y, w, h, isHq) {
    ctx.fillStyle = palette.dirtDark ?? '#6e674b';
    ctx.fillRect(x - 3, y + h - 13, w + 6, 12);

    ctx.fillStyle = '#3b3a31';
    ctx.fillRect(x + 4, Math.round(this.y - 8), w - 8, 16);
    ctx.fillStyle = '#252821';
    ctx.fillRect(x + 9, Math.round(this.y - 4), 13, 6);
    ctx.fillRect(x + w - 20, Math.round(this.y - 7), 12, 9);

    if (isHq) {
      ctx.fillStyle = '#5f5a4c';
      ctx.fillRect(x + 8, y + h - 20, 15, 7);
      ctx.fillRect(x + 34, y + h - 23, 18, 9);
      ctx.fillRect(x + w - 23, y + h - 18, 11, 6);
      ctx.fillStyle = '#34382f';
      ctx.fillRect(x + 15, y + h - 25, 3, 10);
    }
  }

  drawHpBar(ctx, palette, x, y, w, isPlayer, isHq = false) {
    const ratio = this.hp / this.maxHp;
    const barWidth = w + 8;
    const barX = x - 4;
    const barY = y - (isHq ? 10 : 11);

    ctx.fillStyle = '#202820';
    ctx.fillRect(barX, barY, barWidth, 7);

    ctx.fillStyle = isPlayer ? '#3b9cce' : '#c95a66';
    ctx.fillRect(barX + 1, barY + 1, Math.max(0, Math.round((barWidth - 2) * ratio)), 5);

    ctx.fillStyle = '#f3ead1';
    ctx.font = 'bold 6px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${Math.ceil(this.hp)}`, this.x, barY + 3.5);
  }
}

export const HQ_VISUAL_META = Object.freeze({
  width: HQ_WIDTH,
  height: HQ_HEIGHT,
  fieldInsetY: HQ_FIELD_INSET_Y,
  spriteBased: true,
  assetDirectory: 'src/assets/structures/hq/',
  enemyView: 'front',
  playerView: 'back',
  frontAsset: 'hq_front.png',
  backAsset: 'hq_back.png',
  sameVisualSizeBothTeams: true,
  mapPerspective: 'outward-from-center',
  placementMode: 'team-outward-ground-anchor',
  transparentBackground: true,
  pixelArt: true,
  imageSmoothing: false,
  cannonMount: true,
  cannonMountOffsetX: HQ_CANNON_MOUNT_OFFSET_X,
  cannonMountOffsetY: HQ_CANNON_MOUNT_OFFSET_Y,
  separateCannonSprite: true,
  cannonIncludedInSprite: false,
  flagIncluded: false,
  antennaIncluded: false,
  destroyedSpritePending: true,
});
