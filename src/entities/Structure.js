import { distance } from '../utils/math.js';

const HQ_WIDTH = 64;
const HQ_HEIGHT = 56;
const HQ_ROOF_HEIGHT = 13;
const HQ_DOOR_WIDTH = 14;
const HQ_DOOR_HEIGHT = 18;

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
    const w = isHq ? HQ_WIDTH : 44;
    const h = isHq ? HQ_HEIGHT : 46;
    const x = Math.round(this.x - w / 2);
    const y = Math.round(this.y - h / 2);

    if (!this.alive) {
      this.drawDestroyed(ctx, palette, x, y, w, h, isHq);
      return;
    }

    const isPlayer = this.team === 'player';
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
    const concrete = this.flash > 0 ? '#a39b82' : '#77715f';
    const concreteDark = '#5b584b';
    const concreteLight = '#8b846f';
    const roof = isPlayer ? '#465340' : '#51453f';
    const roofDark = isPlayer ? '#354032' : '#3f3531';
    const inactiveFlag = '#53594d';

    // Sombra curta e solo pisado integram o QG ao gramado.
    ctx.fillStyle = 'rgba(20, 24, 19, 0.34)';
    ctx.fillRect(x + 3, y + h - 1, w + 2, 7);

    ctx.fillStyle = palette.dirtDark;
    ctx.fillRect(x - 5, y + h - 7, w + 10, 6);
    ctx.fillRect(x - 2, y + h - 10, w + 4, 4);
    ctx.fillStyle = palette.dirt;
    ctx.fillRect(x + 1, y + h - 9, w - 2, 3);
    ctx.fillRect(x - 3, y + h - 4, 10, 2);
    ctx.fillRect(x + w - 7, y + h - 4, 10, 2);

    ctx.fillStyle = palette.grassDark;
    ctx.fillRect(x - 7, y + h - 7, 5, 3);
    ctx.fillRect(x + w + 1, y + h - 9, 5, 3);
    ctx.fillRect(x + 3, y + h, 5, 2);
    ctx.fillRect(x + w - 10, y + h - 1, 6, 2);

    // Corpo pesado de concreto, com laterais escalonadas de bunker.
    ctx.fillStyle = palette.outline;
    ctx.fillRect(x - 2, y + 14, w + 4, h - 13);
    ctx.fillRect(x + 2, y + 10, w - 4, 6);

    ctx.fillStyle = concreteDark;
    ctx.fillRect(x, y + 16, w, h - 17);
    ctx.fillRect(x + 3, y + 12, w - 6, 6);

    ctx.fillStyle = concrete;
    ctx.fillRect(x + 5, y + 18, w - 10, h - 24);
    ctx.fillRect(x + 8, y + 15, w - 16, 5);

    // Blocos de desgaste e juntas quebram o retângulo limpo.
    ctx.fillStyle = concreteLight;
    ctx.fillRect(x + 7, y + 20, 15, 2);
    ctx.fillRect(x + 37, y + 22, 16, 2);
    ctx.fillRect(x + 9, y + 31, 8, 2);
    ctx.fillRect(x + 48, y + 34, 6, 2);
    ctx.fillStyle = '#625f51';
    ctx.fillRect(x + 19, y + 25, 2, 5);
    ctx.fillRect(x + 44, y + 28, 2, 4);

    // Cobertura de chapa escura com perfil irregular e nervuras.
    ctx.fillStyle = palette.outline;
    ctx.fillRect(x + 1, y + 2, w - 2, HQ_ROOF_HEIGHT + 3);
    ctx.fillRect(x + 6, y - 1, w - 12, 4);

    ctx.fillStyle = roofDark;
    ctx.fillRect(x + 3, y + 3, w - 6, HQ_ROOF_HEIGHT);
    ctx.fillRect(x + 8, y + 1, w - 16, 3);
    ctx.fillStyle = roof;
    ctx.fillRect(x + 5, y + 4, w - 10, 7);

    ctx.fillStyle = 'rgba(174, 170, 134, 0.18)';
    for (let rx = x + 9; rx < x + w - 8; rx += 9) {
      ctx.fillRect(rx, y + 4, 1, 7);
    }

    // Pequena escotilha no teto.
    ctx.fillStyle = palette.outline;
    ctx.fillRect(x + w - 20, y + 6, 11, 7);
    ctx.fillStyle = roofDark;
    ctx.fillRect(x + w - 18, y + 7, 8, 4);

    // Seteiras laterais escuras.
    ctx.fillStyle = '#282c26';
    ctx.fillRect(x + 7, y + 27, 9, 5);
    ctx.fillRect(x + w - 16, y + 27, 9, 5);
    ctx.fillStyle = '#9a9276';
    ctx.fillRect(x + 8, y + 27, 7, 1);
    ctx.fillRect(x + w - 15, y + 27, 7, 1);

    // Entrada frontal profunda com discreto detalhe da facção.
    const doorX = Math.round(this.x - HQ_DOOR_WIDTH / 2);
    const doorY = y + h - HQ_DOOR_HEIGHT - 4;
    ctx.fillStyle = palette.outline;
    ctx.fillRect(doorX - 2, doorY - 2, HQ_DOOR_WIDTH + 4, HQ_DOOR_HEIGHT + 4);
    ctx.fillStyle = '#30342d';
    ctx.fillRect(doorX, doorY, HQ_DOOR_WIDTH, HQ_DOOR_HEIGHT);
    ctx.fillStyle = '#1f241f';
    ctx.fillRect(doorX + 3, doorY + 4, HQ_DOOR_WIDTH - 6, HQ_DOOR_HEIGHT - 4);
    ctx.fillStyle = body;
    ctx.fillRect(doorX - 1, doorY - 3, HQ_DOOR_WIDTH + 2, 2);
    ctx.fillStyle = light;
    ctx.fillRect(doorX + 2, doorY - 3, HQ_DOOR_WIDTH - 7, 1);

    // Sacos de areia deixam a frente com aparência de posição fortificada.
    this.drawSandbagGroup(ctx, palette, x + 4, y + h - 12, 3);
    this.drawSandbagGroup(ctx, palette, x + w - 25, y + h - 12, 3);

    // Rádio/antena e bandeira de comando.
    const mastX = x + 12;
    ctx.fillStyle = '#30372e';
    ctx.fillRect(mastX, y - 11, 2, 14);
    ctx.fillRect(mastX - 2, y - 9, 1, 5);
    ctx.fillRect(mastX + 3, y - 7, 1, 4);
    ctx.fillStyle = '#747764';
    ctx.fillRect(mastX, y - 11, 1, 10);

    ctx.fillStyle = this.active ? body : inactiveFlag;
    ctx.fillRect(mastX + 2, y - 10, 14, 7);
    ctx.fillRect(mastX + 2, y - 3, 10, 2);
    if (this.active) {
      ctx.fillStyle = light;
      ctx.fillRect(mastX + 4, y - 8, 6, 1);
    }

    // Placa/comando lateral: pequena leitura de facção, sem pintar o bunker inteiro.
    ctx.fillStyle = palette.outline;
    ctx.fillRect(x + w - 15, y + 38, 8, 7);
    ctx.fillStyle = body;
    ctx.fillRect(x + w - 13, y + 40, 4, 3);
  }

  drawSandbagGroup(ctx, palette, startX, y, count) {
    ctx.fillStyle = '#756c50';
    for (let i = 0; i < count; i += 1) {
      ctx.fillRect(startX + i * 7, y + (i % 2), 7, 5);
    }
    ctx.fillStyle = palette.sandbag;
    for (let i = 0; i < count; i += 1) {
      ctx.fillRect(startX + 1 + i * 7, y + (i % 2), 5, 3);
    }
    ctx.fillStyle = '#91805e';
    ctx.fillRect(startX + 4, y - 4, 7, 4);
    ctx.fillRect(startX + 11, y - 3, 7, 4);
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
      ctx.fillRect(x + 6, y + h - 19, 12, 6);
      ctx.fillRect(x + 31, y + h - 22, 15, 8);
      ctx.fillRect(x + 49, y + h - 16, 8, 5);
      ctx.fillStyle = '#34382f';
      ctx.fillRect(x + 11, y + h - 23, 3, 8);
    }
  }

  drawHpBar(ctx, palette, x, y, w, isPlayer, isHq = false) {
    const ratio = this.hp / this.maxHp;
    const barWidth = w + 8;
    const barX = x - 4;
    const barY = y - (isHq ? 18 : 11);

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
  roofHeight: HQ_ROOF_HEIGHT,
  doorWidth: HQ_DOOR_WIDTH,
  doorHeight: HQ_DOOR_HEIGHT,
  fortified: true,
  concreteBody: true,
  sandbags: true,
  radioMast: true,
  terrainBlend: true,
  factionAccentOnly: true,
});
