export class SupplySystem {
  constructor(config) {
    this.config = config;
    this.values = new Map();
    this.reset();
  }

  reset() {
    this.values.clear();
    for (const team of Object.values(this.config.teams)) {
      this.values.set(team, this.config.supplies.starting);
    }
  }

  get(team) {
    return this.values.get(team) ?? 0;
  }

  getMultiplier(remaining) {
    return remaining <= this.config.supplies.doubleAtRemaining ? 2 : 1;
  }

  update(dt, remaining) {
    const multiplier = this.getMultiplier(remaining);
    const gain = this.config.supplies.regenPerSecond * multiplier * dt;

    for (const team of Object.values(this.config.teams)) {
      const next = Math.min(this.config.supplies.max, this.get(team) + gain);
      this.values.set(team, next);
    }
  }

  canSpend(team, amount) {
    return this.get(team) + 1e-9 >= amount;
  }

  spend(team, amount) {
    if (!this.canSpend(team, amount)) return false;
    this.values.set(team, Math.max(0, this.get(team) - amount));
    return true;
  }

  add(team, amount) {
    const next = Math.min(this.config.supplies.max, this.get(team) + amount);
    this.values.set(team, next);
    return next;
  }
}
