import { GroundRenderer } from './GroundRenderer.js?v=0.6.9';
import { RiverRenderer } from './RiverRenderer.js?v=0.6.9';

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
    this.drawLaneTracks(ctx);
    this.riverRenderer.draw(ctx, time);

    // As pontes ficam acima da água e das margens. A lógica de travessia
    // continua independente do visual do rio.
    for (const bridgeX of bridges) {
      this.drawBridge(ctx, bridgeX, river.top, river.bottom, bridgeWidth);
    }

    this.drawArenaEdges(ctx);
  }

  drawLaneTracks(ctx) {
    const { battlefield, river, bridges } = this.config;

    // Marcas de passagem intencionalmente discretas para orientar o olhar
    // sem competir com tropas, projéteis, itens ou estruturas.
    ctx.fillStyle = 'rgba(61, 72, 43, 0.065)';
    for (const bridgeX of bridges) {
      ctx.fillRect(bridgeX - 6, battlefield.top + 72, 12, river.top - battlefield.top - 72);
      ctx.fillRect(bridgeX - 6, river.bottom, 12, battlefield.bottom - river.bottom - 76);
    }
  }

  drawBridge(ctx, centerX, top, bottom, width) {
    const { palette } = this.config;
    const x = Math.round(centerX - width / 2);
    const h = bottom - top;

    ctx.save();
    ctx.imageSmoothingEnabled = false;

    ctx.fillStyle = palette.woodDark;
    ctx.fillRect(x - 2, top - 3, width + 4, h + 6);

    ctx.fillStyle = palette.wood;
    ctx.fillRect(x, top - 2, width, h + 4);

    ctx.fillStyle = 'rgba(66, 48, 31, 0.55)';
    for (let y = top; y < bottom + 2; y += 6) {
      ctx.fillRect(x + 2, y, width - 4, 1);
    }

    ctx.fillStyle = palette.woodDark;
    ctx.fillRect(x + 2, top - 2, 2, h + 4);
    ctx.fillRect(x + width - 4, top - 2, 2, h + 4);

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
