import { GAME_CONFIG } from '../config.js?v=0.5.1';
import { Battlefield } from '../world/Battlefield.js?v=0.5.1';
import { Structure } from '../entities/Structure.js?v=0.5.1';
import { Unit } from '../entities/Unit.js?v=0.5.1';
import { DeploymentSystem } from '../systems/Deployment.js?v=0.5.1';
import { SupplySystem } from '../systems/Supply.js?v=0.5.1';
import { CardSystem } from '../systems/Cards.js?v=0.5.1';
import { clamp } from '../utils/math.js?v=0.5.1';

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.ctx.imageSmoothingEnabled = false;
    this.config = GAME_CONFIG;
    this.battlefield = new Battlefield(this.config);
    this.deployment = new DeploymentSystem(this.config);
    this.supplies = new SupplySystem(this.config);
    this.cards = new CardSystem(this.config);
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
    this.cards.reset();
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
        this.config.river.top - 76,
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
    const { edgeMargin } = this.config.deployment;
    const spawnX = clamp(x, edgeMargin, this.config.width - edgeMargin);
    const spawnY = clamp(
      y,
      this.config.battlefield.top + edgeMargin,
      this.config.battlefield.bottom - edgeMargin,
    );

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

    if (y >= this.config.hud.top) {
      const index = this.cards.getCardIndexAt(x, y);
      if (index >= 0) this.cards.select(index);
      return;
    }

    const card = this.cards.selectedCard;
    if (!card) return;

    const deployed = this.tryDeployUnit('player', x, y, card.cost);
    if (deployed) this.cards.playSelected();
  }

  drawDeploymentZones() {
    const rects = this.deployment.getDeployRects('player', this.structures);

    this.ctx.fillStyle = 'rgba(239, 227, 189, 0.035)';
    for (const rect of rects) {
      this.ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
    }
  }

  drawTopHud() {
    const { ctx } = this;
    const { width, hud, palette, version } = this.config;
    const totalSeconds = Math.ceil(this.remaining);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = String(totalSeconds % 60).padStart(2, '0');

    ctx.save();

    ctx.fillStyle = 'rgba(13, 22, 18, 0.68)';
    ctx.fillRect(7, 34, 116, 45);
    ctx.fillStyle = palette.ui;
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('INIMIGO', 34, 49);
    ctx.font = '7px monospace';
    ctx.fillText('BATALHÃO', 34, 62);
    ctx.fillText('★ 0', 34, 74);

    ctx.strokeStyle = palette.ui;
    ctx.strokeRect(12.5, 42.5, 16, 18);
    ctx.beginPath();
    ctx.moveTo(20, 38);
    ctx.lineTo(29, 43);
    ctx.lineTo(29, 59);
    ctx.lineTo(20, 64);
    ctx.lineTo(11, 59);
    ctx.lineTo(11, 43);
    ctx.closePath();
    ctx.stroke();

    ctx.fillStyle = 'rgba(13, 18, 15, 0.86)';
    ctx.fillRect(hud.timerX, hud.timerY, hud.timerWidth, hud.timerHeight);
    ctx.strokeStyle = '#0a0d0b';
    ctx.strokeRect(hud.timerX + 0.5, hud.timerY + 0.5, hud.timerWidth - 1, hud.timerHeight - 1);

    ctx.textAlign = 'center';
    ctx.fillStyle = palette.ui;
    ctx.font = 'bold 6px monospace';
    ctx.fillText('RESTANTE:', hud.timerX + hud.timerWidth / 2, hud.timerY + 10);
    ctx.font = 'bold 15px monospace';
    ctx.fillText(`${minutes}:${seconds}`, hud.timerX + hud.timerWidth / 2, hud.timerY + 27);

    ctx.textAlign = 'right';
    ctx.font = '6px monospace';
    ctx.fillStyle = 'rgba(239,227,189,0.75)';
    ctx.fillText(`V${version}`, width - 5, this.config.hud.top - 7);

    ctx.restore();
  }

  drawCardHud() {
    const { ctx } = this;
    const { width, height, hud, palette } = this.config;

    ctx.save();
    ctx.fillStyle = palette.hudDark;
    ctx.fillRect(0, hud.top, width, height - hud.top);
    ctx.fillStyle = palette.hud;
    ctx.fillRect(0, hud.top + 5, width, height - hud.top - 5);
    ctx.fillStyle = palette.hudLight;
    ctx.fillRect(0, hud.top, width, 7);

    ctx.fillStyle = 'rgba(9, 25, 35, 0.9)';
    ctx.fillRect(0, hud.top + 7, 65, height - hud.top - 7);
    ctx.strokeStyle = 'rgba(220,235,235,0.22)';
    ctx.strokeRect(64.5, hud.top + 7.5, 1, height - hud.top - 9);

    ctx.fillStyle = palette.ui;
    ctx.textAlign = 'center';
    ctx.font = 'bold 8px monospace';
    ctx.fillText('PRÓXIMA:', 32, hud.top + 61);

    const next = this.cards.nextCard;
    if (next) this.drawMiniCard(next);

    for (let index = 0; index < this.cards.hand.length; index += 1) {
      this.drawCard(this.cards.hand[index], index);
    }

    this.drawSupplyHud();
    ctx.restore();
  }

  drawMiniCard(card) {
    const { ctx } = this;
    const { hud, palette } = this.config;
    const x = hud.nextX + 11;
    const y = hud.nextY + 16;
    const w = 31;
    const h = 35;

    ctx.fillStyle = '#101917';
    ctx.fillRect(x - 2, y - 2, w + 4, h + 4);
    ctx.fillStyle = card.accent;
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = palette.ui;
    ctx.font = 'bold 6px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(card.short, x + w / 2, y + 20);
    ctx.fillStyle = '#d7b448';
    ctx.fillRect(x + w - 10, y + h - 10, 10, 10);
    ctx.fillStyle = '#1a1a15';
    ctx.font = 'bold 7px monospace';
    ctx.fillText(`${card.cost}`, x + w - 5, y + h - 5);
  }

  drawCard(card, index) {
    const { ctx } = this;
    const { hud, palette } = this.config;
    const rect = this.cards.getCardRect(index);
    const selected = this.cards.selectedIndex === index;
    const y = selected ? rect.y - 7 : rect.y;

    ctx.fillStyle = selected ? palette.ui : '#0b1518';
    ctx.fillRect(rect.x - 2, y - 2, rect.width + 4, rect.height + 4);

    ctx.fillStyle = '#c9c5ae';
    ctx.fillRect(rect.x, y, rect.width, rect.height);
    ctx.fillStyle = card.accent;
    ctx.fillRect(rect.x + 3, y + 3, rect.width - 6, rect.height - 6);

    ctx.fillStyle = 'rgba(20, 27, 21, 0.30)';
    ctx.fillRect(rect.x + 8, y + 10, rect.width - 16, 36);

    this.drawCardSoldierIcon(rect.x + rect.width / 2, y + 27, card.accent);

    ctx.fillStyle = 'rgba(12, 18, 15, 0.82)';
    ctx.fillRect(rect.x + 3, y + 51, rect.width - 6, 20);
    ctx.fillStyle = palette.ui;
    ctx.font = 'bold 7px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(card.short, rect.x + rect.width / 2, y + 62);

    const bubbleX = rect.x + rect.width - 10;
    const bubbleY = y + rect.height - 7;
    ctx.fillStyle = '#d7b448';
    ctx.beginPath();
    ctx.arc(bubbleX, bubbleY, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#201d14';
    ctx.stroke();
    ctx.fillStyle = '#181812';
    ctx.font = 'bold 9px monospace';
    ctx.fillText(`${card.cost}`, bubbleX, bubbleY + 1);
  }

  drawCardSoldierIcon(cx, cy) {
    const { ctx } = this;
    ctx.fillStyle = '#252b27';
    ctx.fillRect(Math.round(cx - 9), Math.round(cy + 4), 18, 13);
    ctx.fillStyle = '#d0b08a';
    ctx.fillRect(Math.round(cx - 6), Math.round(cy - 6), 12, 10);
    ctx.fillStyle = '#3e493b';
    ctx.fillRect(Math.round(cx - 8), Math.round(cy - 9), 16, 5);
    ctx.fillStyle = '#2c261e';
    ctx.fillRect(Math.round(cx + 6), Math.round(cy + 2), 15, 3);
  }

  drawSupplyHud() {
    const { ctx } = this;
    const { hud, palette, supplies } = this.config;
    const current = this.supplies.get('player');
    const multiplier = this.supplies.getMultiplier(this.remaining);
    const denied = this.resourceDeniedFlash > 0;
    const ratio = clamp(current / supplies.max, 0, 1);

    ctx.fillStyle = '#0a1418';
    ctx.fillRect(hud.supplyX, hud.supplyY, hud.supplyWidth, hud.supplyHeight);
    ctx.strokeStyle = denied ? '#d66b5e' : '#c9d4cb';
    ctx.strokeRect(hud.supplyX + 0.5, hud.supplyY + 0.5, hud.supplyWidth - 1, hud.supplyHeight - 1);

    ctx.fillStyle = denied ? '#b65a50' : palette.supply;
    ctx.fillRect(
      hud.supplyX + 3,
      hud.supplyY + 3,
      Math.round((hud.supplyWidth - 6) * ratio),
      hud.supplyHeight - 6,
    );

    ctx.strokeStyle = 'rgba(20, 25, 20, 0.30)';
    for (let i = 1; i < supplies.max; i += 1) {
      const x = hud.supplyX + Math.round((hud.supplyWidth / supplies.max) * i);
      ctx.beginPath();
      ctx.moveTo(x, hud.supplyY + 2);
      ctx.lineTo(x, hud.supplyY + hud.supplyHeight - 2);
      ctx.stroke();
    }

    ctx.fillStyle = denied ? '#d66b5e' : palette.supply;
    ctx.beginPath();
    ctx.arc(55, hud.supplyY + hud.supplyHeight / 2, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#181d18';
    ctx.stroke();

    ctx.fillStyle = '#151812';
    ctx.textAlign = 'center';
    ctx.font = 'bold 12px monospace';
    ctx.fillText(`${Math.floor(current)}`, 55, hud.supplyY + 13);

    if (multiplier > 1) {
      ctx.fillStyle = palette.ui;
      ctx.font = 'bold 7px monospace';
      ctx.fillText('x2', 55, hud.supplyY - 5);
    }
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

    this.drawTopHud();
    this.drawCardHud();

    if (this.state === 'finished') this.drawResultOverlay();
  }

  drawResultOverlay() {
    const { ctx } = this;
    const { width, palette } = this.config;

    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(11, 14, 12, 0.84)';
    ctx.fillRect(35, 285, width - 70, 100);
    ctx.strokeStyle = palette.ui;
    ctx.strokeRect(35.5, 285.5, width - 71, 99);
    ctx.fillStyle = palette.ui;
    ctx.font = 'bold 22px monospace';
    ctx.fillText(this.result, width / 2, 325);
    ctx.font = '10px monospace';
    ctx.fillText('Toque para reiniciar', width / 2, 357);
    ctx.restore();
  }
}
