import { distance } from '../utils/math.js';

export class Structure {
  constructor(data) {
    Object.assign(this, data);
    this.maxHp = data.hp;
    this.cooldown = Math.random() * 0.25;
    this.flash = 0;
    this.hitRadius = data.kind === 'hq' ? 20 : 16;
  }

  get alive() {
    return this.hp > 0;
  }

  takeDamage(amount) {
    this.hp = Math.max(0, this.hp - amount);
    this.flash = 0.08;
  }

  update(dt, units) {
    this.cooldown = Math.max(0, this.cooldown - dt);
    this.flash = Math.max(0, this.flash - dt);
    if (!this.alive || this.cooldown > 0) return;

    let target = null;
    let bestDistance = Infinity;

    for (const unit of units) {
      if (!unit.alive || unit.team === this.team) continue;
      const d = distance(this, unit);
      if (d <= this.range && d < bestDistance) {
        bestDistance = d;
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
    if (!this.alive) {
      ctx.fillStyle = '#3b3a31';
      ctx.fillRect(Math.round(this.x - 15), Math.round(this.y - 7), 30, 14);
      ctx.fillStyle = '#252821';
      ctx.fillRect(Math.round(this.x - 10), Math.round(this.y - 3), 9, 5);
      ctx.fillRect(Math.round(this.x + 4), Math.round(this.y - 5), 8, 7);
      return;
    }

    const isPlayer = this.team === 'player';
    const body = isPlayer ? palette.player : palette.enemy;
    const light = isPlayer ? palette.playerLight : palette.enemyLight;
    const w = this.kind === 'hq' ? 42 : 32;
    const h = this.kind === 'hq' ? 34 : 28;
    const x = Math.round(this.x - w / 2);
    const y = Math.round(this.y - h / 2);

    ctx.fillStyle = palette.outline;
    ctx.fillRect(x - 2, y + 3, w + 4, h - 1);

    ctx.fillStyle = palette.sandbag;
    for (let i = 0; i < w; i += 8) {
      ctx.fillRect(x + i, y + h - 5, 7, 4);
    }

    ctx.fillStyle = this.flash > 0 ? light : body;
    ctx.fillRect(x, y, w, h - 6);
    ctx.fillStyle = light;
    ctx.fillRect(x + 4, y + 4, w - 8, 5);
    ctx.fillStyle = palette.outline;
    ctx.fillRect(Math.round(this.x - 4), y + 7, 8, 8);

    if (this.kind === 'hq') {
      ctx.fillStyle = palette.outline;
      ctx.fillRect(Math.round(this.x - 2), y - 9, 3, 10);
      ctx.fillStyle = body;
      ctx.fillRect(Math.round(this.x + 1), y - 9, 10, 6);
    }

    const ratio = this.hp / this.maxHp;
    ctx.fillStyle = '#202820';
    ctx.fillRect(x, y - 7, w, 4);
    ctx.fillStyle = ratio > 0.5 ? '#9fbd69' : ratio > 0.25 ? '#d0a956' : '#bc6558';
    ctx.fillRect(x + 1, y - 6, Math.max(0, Math.round((w - 2) * ratio)), 2);
  }
}
