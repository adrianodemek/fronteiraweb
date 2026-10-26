import { GAME_CONFIG } from '../config.js?v=0.3.0';
import { Battlefield } from '../world/Battlefield.js';
import { Structure } from '../entities/Structure.js?v=0.2.1';
import { Unit } from '../entities/Unit.js?v=0.2.1';
import { DeploymentSystem } from '../systems/Deployment.js?v=0.2.0';
import { SupplySystem } from '../systems/Supply.js?v=0.3.0';
import { clamp } from '../utils/math.js';

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.ctx.imageSmoothingEnabled = false;
    this.config = GAME_CONFIG;
    this.battlefield = new Battlefield(this.config);
    this.deployment = new DeploymentSystem(this.config);
    this.supplies = new SupplySystem(this.config);
    this.lastTime = 0;
    this.elapsed = 0;
    this.enemySpawnClock = 1.8;
    this.enemyLane = 0;
    this.resourceDeniedFlash = 0;

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
    this.resourceDeniedFlash = 0;
    this.supplies.reset();
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
    this.resourceDeniedFlash = Math.max(0, this.resourceDeniedFlash - dt);
    this.supplies.update(dt, this.remaining);
    this.enemySpawnClock -= dt;

    if (this.enemySpawnClock <= 0) {
      const lane = this.enemyLane;
      const deployed = this.tryDeployUnit(
        'enemy',
        this.config.bridges[lane],
        218,
        this.config.costs.infantry,
      );

      if (deployed) {
        this.enemyLane = lane === 0 ? 1 : 0;
        this.enemySpawnClock = 4.1;
      } else {
        this.enemySpawnClock = 0.35;
      }
    }

    this.syncHqActivation();

    for (const structure of this.structures) {
      structure.update(dt, this.units);
    }

    for (const unit of this.units) {
      unit.update(dt, this.units, this.structures);
    }

    this.syncHqActivation();
    this.units = this.units.filter((unit) => unit.alive);
    this.checkBattleEnd();
  }

  syncHqActivation() {
    for (const team of Object.values(this.config.teams)) {
      const hq = this.structures.find((item) => item.team === team && item.kind === 'hq');
      if (!hq || !hq.alive || hq.active) continue;

      const lostBase = this.structures.some((item) => (
        item.team === team && item.kind === 'base' && !item.alive
      ));

      if (lostBase) hq.activate();
    }
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
    if (this.units.length >= 70) return false;

    this.units.push(new Unit({
      team,
      lane,
      x,
      y,
      stats: this.config.infantry,
      config: this.config,
    }));
    return true;
  }

  tryDeployUnit(team, x, y, cost = this.config.costs.infantry) {
    if (this.state !== 'playing') return false;
    if (!this.deployment.isDeployAllowed(team, x, y, this.structures)) return false;

    if (!this.supplies.canSpend(team, cost)) {
      if (team === 'player') this.resourceDeniedFlash = 0.3;
      return false;
    }

    const lane = Math.abs(x - this.config.bridges[0]) <= Math.abs(x - this.config.bridges[1]) ? 0 : 1;
    const { edgeMargin, bottomUiMargin } = this.config.deployment;
    const spawnX = clamp(x, edgeMargin, this.config.width - edgeMargin);
    const spawnY = clamp(y, edgeMargin, this.config.height - bottomUiMargin);

    const spawned = this.spawnUnit(team, lane, spawnX, spawnY);
    if (!spawned) return false;

    this.supplies.spend(team, cost);
    return true;
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

    this.tryDeployUnit('player', x, y, this.config.costs.infantry);
  }

  drawDeploymentZones() {
    const rects = this.deployment.getDeployRects('player', this.structures);

    this.ctx.fillStyle = 'rgba(236, 227, 189, 0.055)';
    for (const rect of rects) {
      this.ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
    }
  }

  drawSupplyHud() {
    const { ctx } = this;
    const { width, palette, supplies, costs } = this.config;
    const current = this.supplies.get('player');
    const multiplier = this.supplies.getMultiplier(this.remaining);
    const denied = this.resourceDeniedFlash > 0;
    const segmentWidth = 24;
    const segmentHeight = 10;
    const gap = 2;
    const totalWidth = supplies.max * segmentWidth + (supplies.max - 1) * gap;
    const startX = Math.round((width - totalWidth) / 2);
    const barY = 608;

    ctx.textAlign = 'center';
    ctx.fillStyle = denied ? '#d66b5e' : palette.ui;
    ctx.font = 'bold 8px monospace';
    ctx.fillText(
      `SUPRIMENTOS ${current.toFixed(1)}/${supplies.max}${multiplier > 1 ? '  x2' : ''}`,
      width / 2,
      599,
    );

    for (let i = 0; i < supplies.max; i += 1) {
      const x = startX + i * (segmentWidth + gap);
      const amount = clamp(current - i, 0, 1);

      ctx.fillStyle = 'rgba(20, 25, 20, 0.82)';
      ctx.fillRect(x, barY, segmentWidth, segmentHeight);
      ctx.strokeStyle = denied ? '#d66b5e' : palette.ui;
      ctx.strokeRect(x + 0.5, barY + 0.5, segmentWidth - 1, segmentHeight - 1);

      if (amount > 0) {
        ctx.fillStyle = denied ? '#d66b5e' : '#d7c86c';
        ctx.fillRect(x + 2, barY + 2, Math.round((segmentWidth - 4) * amount), segmentHeight - 4);
      }
    }

    ctx.fillStyle = palette.ui;
    ctx.font = '7px monospace';
    ctx.fillText(`INFANTARIA = ${costs.infantry}`, width / 2, 628);
  }

  draw() {
    const { ctx } = this;
    const { width, height, palette } = this.config;

    ctx.clearRect(0, 0, width, height);
    this.battlefield.draw(ctx, this.elapsed);

    if (this.state === 'playing') {
      this.drawDeploymentZones();
    }

    for (const structure of this.structures) {
      structure.draw(ctx, palette);
    }

    const orderedUnits = [...this.units].sort((a, b) => a.y - b.y);
    for (const unit of orderedUnits) {
      unit.draw(ctx, palette);
    }

    this.drawHud();
  }

  drawHud() {
    const { ctx } = this;
    const { width, palette, version } = this.config;
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
    ctx.fillText('SEU CAMPO', width / 2, 586);

    ctx.textAlign = 'right';
    ctx.font = '7px monospace';
    ctx.fillText(`V${version}`, width - 6, 10);

    if (this.state === 'playing') this.drawSupplyHud();

    if (this.state === 'finished') {
      ctx.textAlign = 'center';
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
