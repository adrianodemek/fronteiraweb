import { distance } from '../utils/math.js?v=0.2.0';

export class DeploymentSystem {
  constructor(config) {
    this.config = config;
  }

  getOpponent(team) {
    return team === 'player' ? 'enemy' : 'player';
  }

  getLaneAtX(x) {
    return x < this.config.width / 2 ? 0 : 1;
  }

  getLaneBounds(lane) {
    const half = this.config.width / 2;
    return lane === 0
      ? { x: 0, width: half }
      : { x: half, width: half };
  }

  getBase(structures, team, lane) {
    return structures.find((item) => (
      item.team === team && item.kind === 'base' && item.lane === lane
    ));
  }

  isInsideMap(x, y) {
    const { width, height, deployment } = this.config;
    const margin = deployment.edgeMargin;
    return x >= margin && x <= width - margin && y >= margin && y <= height - margin;
  }

  isInsideRiver(y) {
    const { river } = this.config;
    return y >= river.top && y <= river.bottom;
  }

  isNearAliveStructure(x, y, structures) {
    const { structureBuffer } = this.config.deployment;
    const point = { x, y };

    return structures.some((structure) => {
      if (!structure.alive) return false;
      const radius = structure.hitRadius ?? (structure.kind === 'hq' ? 20 : 16);
      return distance(point, structure) < radius + structureBuffer;
    });
  }

  getHomeRect(team) {
    const { width, height, river, deployMargin, deployment } = this.config;

    if (team === 'player') {
      const y = river.bottom + deployMargin;
      return {
        lane: null,
        advanced: false,
        kind: 'home',
        x: 0,
        y,
        width,
        height: height - deployment.bottomUiMargin - y,
      };
    }

    const y = deployment.edgeMargin;
    return {
      lane: null,
      advanced: false,
      kind: 'home',
      x: 0,
      y,
      width,
      height: river.top - deployMargin - y,
    };
  }

  getPocketRect(team, lane) {
    const { river, deployment, arenaGrid } = this.config;
    const laneBounds = this.getLaneBounds(lane);
    const depth = deployment.pocketDepthTiles * arenaGrid.tileSize;

    if (team === 'player') {
      return {
        lane,
        advanced: true,
        kind: 'pocket',
        x: laneBounds.x,
        y: river.top - depth,
        width: laneBounds.width,
        height: depth,
      };
    }

    return {
      lane,
      advanced: true,
      kind: 'pocket',
      x: laneBounds.x,
      y: river.bottom,
      width: laneBounds.width,
      height: depth,
    };
  }

  getDeployRects(team, structures) {
    const rects = [this.getHomeRect(team)];
    const opponent = this.getOpponent(team);

    for (const lane of [0, 1]) {
      const enemyBase = this.getBase(structures, opponent, lane);
      if (enemyBase && !enemyBase.alive) {
        rects.push(this.getPocketRect(team, lane));
      }
    }

    return rects;
  }

  pointInRect(x, y, rect) {
    return x >= rect.x
      && x <= rect.x + rect.width
      && y >= rect.y
      && y <= rect.y + rect.height;
  }

  isDeployAllowed(team, x, y, structures) {
    if (!this.isInsideMap(x, y)) return false;
    if (this.isInsideRiver(y)) return false;
    if (this.isNearAliveStructure(x, y, structures)) return false;

    return this.getDeployRects(team, structures)
      .some((rect) => this.pointInRect(x, y, rect));
  }
}
