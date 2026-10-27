import { GroundRenderer } from './GroundRenderer.js?v=0.6.16';
import { RiverRenderer } from './RiverRenderer.js?v=0.6.16';

const BRIDGE_LAND_OVERLAP = 14;

export class Battlefield {
  constructor(config) {
    this.config = config;
    this.groundRenderer = new GroundRenderer(config);
    this.riverRenderer = new RiverRenderer(config);
  }

  draw(ctx, time) {
    const {
      river,
      bridges,
      bridgeWidth,
    } = this.config;

    this.groundRenderer.draw(ctx);
    this.riverRenderer.draw(ctx, time);

    const bridgeTop = river.top - BRIDGE_LAND_OVERLAP;
    const bridgeBottom = river.bottom + BRIDGE_LAND_OVERLAP;

    for (const bridgeX of bridges) {
      this.drawBridge(ctx, bridgeX, bridgeTop, bridgeBottom, bridgeWidth);
    }

    this.drawArenaEdges(ctx);
  }

  drawBridge(ctx, centerX, top, bottom, width) {
    const { palette } = this.config;
    const x = Math.round(centerX - width / 2);
    const h = bottom - top;

    ctx.save();
    ctx.imageSmoothingEnabled = false;

    ctx.fillStyle = palette.woodDark;
    ctx.fillRect(x - 2, top - 2, width + 4, h + 4);

    ctx.fillStyle = palette.wood;
    ctx.fillRect(x, top, width, h);

    ctx.fillStyle = 'rgba(66, 48, 31, 0.55)';
    for (let y = top + 3; y < bottom - 1; y += 6) {
      ctx.fillRect(x + 2, y, width - 4, 1);
    }

    ctx.fillStyle = palette.woodDark;
    ctx.fillRect(x + 2, top, 2, h);
    ctx.fillRect(x + width - 4, top, 2, h);

    ctx.fillRect(x, top, 4, 3);
    ctx.fillRect(x + width - 4, top, 4, 3);
    ctx.fillRect(x, bottom - 3, 4, 3);
    ctx.fillRect(x + width - 4, bottom - 3, 4, 3);

    ctx.restore();
  }

  drawArenaEdges(ctx) {
    const { width, battlefield } = this.config;
    ctx.fillStyle = 'rgba(40, 45, 29, 0.38)';
    ctx.fillRect(0, battlefield.top, 5, battlefield.bottom - battlefield.top);
    ctx.fillRect(width - 5, battlefield.top, 5, battlefield.bottom - battlefield.top);
    ctx.fillRect(0, battlefield.bottom - 5, width, 5);
  }
}

export const BRIDGE_VISUAL_META = Object.freeze({
  landOverlap: BRIDGE_LAND_OVERLAP,
});
