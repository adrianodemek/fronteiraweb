export class Battlefield {
  constructor(config) {
    this.config = config;
  }

  draw(ctx, time) {
    const { width, height, river, bridges, bridgeWidth, palette } = this.config;

    ctx.fillStyle = palette.grass;
    ctx.fillRect(0, 0, width, height);

    this.drawGrassTexture(ctx);
    this.drawLanes(ctx);

    ctx.fillStyle = palette.waterDark;
    ctx.fillRect(0, river.top, width, river.bottom - river.top);

    ctx.fillStyle = palette.water;
    ctx.fillRect(0, river.top + 3, width, river.bottom - river.top - 6);

    const waveOffset = Math.floor((time * 12) % 24);
    ctx.fillStyle = palette.waterLight;
    for (let x = -24 + waveOffset; x < width + 24; x += 24) {
      ctx.fillRect(x, river.top + 10, 12, 2);
      ctx.fillRect(x - 8, river.top + 28, 9, 2);
    }

    for (const bridgeX of bridges) {
      this.drawBridge(ctx, bridgeX, river.top, river.bottom, bridgeWidth);
    }

    ctx.strokeStyle = 'rgba(31, 45, 31, 0.35)';
    ctx.setLineDash([2, 4]);
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  drawGrassTexture(ctx) {
    const { width, height, palette } = this.config;
    for (let y = 8; y < height; y += 24) {
      for (let x = 8; x < width; x += 24) {
        const variant = ((x * 13 + y * 7) / 8) % 3;
        ctx.fillStyle = variant < 1 ? palette.grassDark : palette.grassLight;
        ctx.fillRect(x + ((y / 8) % 5), y, 2, 2);
      }
    }
  }

  drawLanes(ctx) {
    const { height, bridges, palette } = this.config;
    ctx.fillStyle = palette.dirt;

    for (const bridgeX of bridges) {
      ctx.fillRect(bridgeX - 13, 0, 26, height);
      ctx.fillStyle = palette.dirtDark;
      for (let y = 8; y < height; y += 32) {
        ctx.fillRect(bridgeX - 9, y, 5, 2);
        ctx.fillRect(bridgeX + 3, y + 13, 6, 2);
      }
      ctx.fillStyle = palette.dirt;
    }
  }

  drawBridge(ctx, centerX, top, bottom, width) {
    const { palette } = this.config;
    const x = Math.round(centerX - width / 2);
    const h = bottom - top;

    ctx.fillStyle = palette.woodDark;
    ctx.fillRect(x - 3, top - 2, width + 6, h + 4);

    ctx.fillStyle = palette.wood;
    ctx.fillRect(x, top, width, h);

    ctx.fillStyle = palette.woodDark;
    for (let y = top + 2; y < bottom; y += 7) {
      ctx.fillRect(x + 2, y, width - 4, 2);
    }

    ctx.fillRect(x + 2, top, 3, h);
    ctx.fillRect(x + width - 5, top, 3, h);
  }
}
