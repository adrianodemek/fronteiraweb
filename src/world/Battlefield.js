import { RiverRenderer } from './RiverRenderer.js?v=0.6.6';

export class Battlefield {
  constructor(config) {
    this.config = config;
    this.riverRenderer = new RiverRenderer(config);
  }

  draw(ctx, time) {
    const {
      width,
      battlefield,
      river,
      bridges,
      bridgeWidth,
      palette,
    } = this.config;

    ctx.fillStyle = palette.grass;
    ctx.fillRect(0, battlefield.top, width, battlefield.bottom - battlefield.top);

    this.drawTileTexture(ctx);
    this.drawLaneTracks(ctx);
    this.riverRenderer.draw(ctx, time);

    // As pontes ficam acima da água e das margens. A lógica de travessia
    // continua independente do visual do rio.
    for (const bridgeX of bridges) {
      this.drawBridge(ctx, bridgeX, river.top, river.bottom, bridgeWidth);
    }

    this.drawArenaEdges(ctx);
  }

  drawTileTexture(ctx) {
    const { width, battlefield, arenaGrid, palette } = this.config;
    const tile = arenaGrid.tileSize;

    for (let y = battlefield.top; y < battlefield.bottom; y += tile) {
      for (let x = 0; x < width; x += tile) {
        const checker = ((x / tile) + (y / tile)) % 2;
        ctx.fillStyle = checker === 0
          ? 'rgba(255,255,210,0.025)'
          : 'rgba(24,50,24,0.025)';
        ctx.fillRect(x, y, tile, tile);

        const seed = ((x * 17 + y * 11) / tile) % 5;
        ctx.fillStyle = seed < 2 ? palette.grassDark : palette.grassLight;
        ctx.globalAlpha = 0.16;
        ctx.fillRect(x + 4 + (seed % 3), y + 5 + ((seed * 2) % 7), 2, 2);
        ctx.globalAlpha = 1;
      }
    }
  }

  drawLaneTracks(ctx) {
    const { battlefield, river, bridges } = this.config;

    ctx.fillStyle = 'rgba(71, 86, 49, 0.13)';
    for (const bridgeX of bridges) {
      ctx.fillRect(bridgeX - 9, battlefield.top + 72, 18, river.top - battlefield.top - 72);
      ctx.fillRect(bridgeX - 9, river.bottom, 18, battlefield.bottom - river.bottom - 76);
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
