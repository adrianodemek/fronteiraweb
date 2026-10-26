import { GAME_CONFIG } from '../config.js';
import { Battlefield } from '../world/Battlefield.js';
import { Structure } from '../entities/Structure.js';
import { Unit } from '../entities/Unit.js?v=0.1.2';
import { clamp } from '../utils/math.js';

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.ctx.imageSmoothingEnabled = false;
    this.config = GAME_CONFIG;
    this.battlefield = new Battlefield(this.config);
    this.lastTime = 0;
    this.elapsed = 0;
    this.enemySpawnClock = 1.8;
    this.enemyLane = 0;

    this.handlePointerDown = this.handlePointerDown.bind(this);
    this.loop = this.loop.bind(this);

    this.canvas.addEventListener('pointerdown', this.handlePointerDown, { passive: false });
    this.reset();
  }

  reset() {
    this.structures = this.config.structures.map((data) => new Structure({ ...data }));
    this.units = [];
    this.remaining = this.config.battleDuration;
    this.state = 'playing';
    this.result = '';
    this.enemySpawnClock = 1.8;
    this.enemyLane = 0;
  }

  start() {
    requestAnimationFrame(this.loop);
  }

  loop(now) {
    if (!this.lastTime) this.lastTime = now;
    const dt = Math.min((now - this.lastTime) / 1000, 0.04);
    this.lastTime = now;
    this.elapsed += dt;

    if (this.state === 'playing') this.update(dt);
    this.draw();

    requestAnimationFrame(this.loop);
  }

  update(dt) {
    this.remaining = Math.max(0, this.remaining - dt);
    this.enemySpawnClock -= dt;

    if (this.enemySpawnClock <= 0) {
      this.spawnUnit('enemy', this.enemyLane, this.config.bridges[this.enemyLane], 218);
      this.enemyLane = this.enemyLane === 0 ? 1 : 0;
      this.enemySpawnClock = 4.1;
    }

    for (const structure of this.structures) {
      structure.update(dt, this.units);
    }

    for (const unit of this.units) {
      unit.update(dt, this.units, this.structures);
    }

    this.units = this.units.filter((unit) => unit.alive);
    this.checkBattleEnd();
  }

  checkBattleEnd() {
    const playerHq = this.structures.find((item) => item.id === 'player-hq');
    const enemyHq = this.structures.find((item) => item.id === 'enemy-hq');

    if (!enemyHq.alive) {
      this.finish('VITÓRIA');
      return;
    }

    if (!playerHq.alive) {
      this.finish('DERROTA');
      return;
    }

    if (this.remaining <= 0) {
      const playerHp = this.structures
        .filter((item) => item.team === 'player')
        .reduce((sum, item) => sum + item.hp, 0);
      const enemyHp = this.structures
        .filter((item) => item.team === 'enemy')
        .reduce((sum, item) => sum + item.hp, 0);

      if (playerHp > enemyHp) this.finish('VITÓRIA');
      else if (enemyHp > playerHp) this.finish('DERROTA');
      else this.finish('EMPATE');
    }
  }

  finish(result) {
    this.state = 'finished';
    this.result = result;
  }

  spawnUnit(team, lane, x, y) {
    if (this.units.length >= 70) return;

    this.units.push(new Unit({
      team,
      lane,
      x,
      y,
      stats: this.config.infantry,
      config: this.config,
    }));
  }

  handlePointerDown(event) {
    event.preventDefault();

    if (this.state === 'finished') {
      this.reset();
      return;
    }

    const rect = this.canvas.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * this.config.width;
    const y = ((event.clientY - rect.top) / rect.height) * this.config.height;

    const minY = this.config.river.bottom + this.config.deployMargin;
    if (y < minY || y > this.config.height - 42) return;

    const lane = Math.abs(x - this.config.bridges[0]) <= Math.abs(x - this.config.bridges[1]) ? 0 : 1;
    const spawnX = clamp(x, 18, this.config.width - 18);
    const spawnY = clamp(y, minY, this.config.height - 62);
    this.spawnUnit('player', lane, spawnX, spawnY);
  }

  draw() {
    const { ctx } = this;
    const { width, height, palette, river } = this.config;

    ctx.clearRect(0, 0, width, height);
    this.battlefield.draw(ctx, this.elapsed);

    for (const structure of this.structures) {
      structure.draw(ctx, palette);
    }

    const orderedUnits = [...this.units].sort((a, b) => a.y - b.y);
    for (const unit of orderedUnits) {
      unit.draw(ctx, palette);
    }

    if (this.state === 'playing') {
      ctx.fillStyle = 'rgba(236, 227, 189, 0.06)';
      ctx.fillRect(0, river.bottom + this.config.deployMargin, width, height - river.bottom - this.config.deployMargin);
    }

    this.drawHud();
  }

  drawHud() {
    const { ctx } = this;
    const { width, palette } = this.config;
    const totalSeconds = Math.ceil(this.remaining);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = String(totalSeconds % 60).padStart(2, '0');

    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.fillStyle = 'rgba(20, 25, 20, 0.82)';
    ctx.fillRect(width / 2 - 33, 8, 66, 24);
    ctx.strokeStyle = palette.ui;
    ctx.strokeRect(width / 2 - 33.5, 8.5, 67, 24);

    ctx.fillStyle = palette.ui;
    ctx.font = 'bold 12px monospace';
    ctx.fillText(`${minutes}:${seconds}`, width / 2, 20);

    ctx.font = 'bold 8px monospace';
    ctx.fillText('INIMIGO', width / 2, 43);
    ctx.fillText('SEU CAMPO', width / 2, 619);

    if (this.state === 'finished') {
      ctx.fillStyle = 'rgba(11, 14, 12, 0.82)';
      ctx.fillRect(35, 270, width - 70, 100);
      ctx.strokeStyle = palette.ui;
      ctx.strokeRect(35.5, 270.5, width - 71, 99);

      ctx.fillStyle = palette.ui;
      ctx.font = 'bold 22px monospace';
      ctx.fillText(this.result, width / 2, 310);
      ctx.font = '10px monospace';
      ctx.fillText('Toque para reiniciar', width / 2, 342);
    }

    ctx.restore();
  }
}
