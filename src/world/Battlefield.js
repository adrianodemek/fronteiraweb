import { RIVER_ATLAS_DATA_URI, RIVER_ATLAS } from '../assets/riverAtlas.js?v=0.6.5';

export class Battlefield {
  constructor(config) {
    this.config = config;
    this.riverAtlas = null;
    this.riverAtlasReady = false;

    if (typeof Image !== 'undefined') {
      this.riverAtlas = new Image();
      this.riverAtlas.onload = () => {
        this.riverAtlasReady = true;
      };
      this.riverAtlas.src = RIVER_ATLAS_DATA_URI;
    }
  }

  getWaterFrameIndex(time) {
    return Math.floor(time * 6) % RIVER_ATLAS.waterFrames;
  }

  getRiverRockLayout() {
    return [
      { x: 17, side: 'top', sprite: 0, width: 17, height: 13 },
      { x: 47, side: 'bottom', sprite: 2, width: 13, height: 10 },
      { x: 117, side: 'top', sprite: 1, width: 18, height: 11 },
      { x: 148, side: 'bottom', sprite: 0, width: 16, height: 13 },
      { x: 211, side: 'top', sprite: 2, width: 14, height: 11 },
      { x: 243, side: 'bottom', sprite: 1, width: 18, height: 11 },
      { x: 330, side: 'top', sprite: 3, width: 18, height: 15 },
      { x: 349, side: 'bottom', sprite: 2, width: 13, height: 10 },
    ];
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
    this.drawRiver(ctx, time);

    for (const bridgeX of bridges) {
      this.drawBridge(ctx, bridgeX, river.top, river.bottom, bridgeWidth);
    }

    this.drawArenaEdges(ctx);
  }

  drawRiver(ctx, time) {
    const { width, river, palette } = this.config;
    const riverHeight = river.bottom - river.top;

    ctx.save();
    ctx.imageSmoothingEnabled = false;

    if (this.riverAtlasReady && this.riverAtlas) {
      const tileWidth = RIVER_ATLAS.frameWidth;
      const baseFrame = this.getWaterFrameIndex(time);
      const scroll = Math.floor((time * 10) % tileWidth);
      let tileIndex = 0;

      for (let x = -tileWidth + scroll; x < width + tileWidth; x += tileWidth) {
        const frame = (baseFrame + tileIndex) % RIVER_ATLAS.waterFrames;
        ctx.drawImage(
          this.riverAtlas,
          frame * RIVER_ATLAS.frameWidth,
          RIVER_ATLAS.waterY,
          RIVER_ATLAS.frameWidth,
          RIVER_ATLAS.frameHeight,
          Math.round(x),
          river.top,
          tileWidth,
          riverHeight,
        );
        tileIndex += 1;
      }
    } else {
      // Fallback imediato enquanto o atlas termina de carregar.
      ctx.fillStyle = palette.waterDark;
      ctx.fillRect(0, river.top, width, riverHeight);
      ctx.fillStyle = palette.water;
      ctx.fillRect(0, river.top + 2, width, riverHeight - 4);

      const waveOffset = Math.floor((time * 9) % 30);
      ctx.fillStyle = palette.waterLight;
      for (let x = -30 + waveOffset; x < width + 30; x += 30) {
        ctx.fillRect(x, river.top + 7, 10, 1);
        ctx.fillRect(x - 12, river.top + 16, 8, 1);
      }
    }

    this.drawRiverBanks(ctx, time);
    this.drawRiverRocks(ctx);
    ctx.restore();
  }

  drawRiverBanks(ctx, time) {
    const { width, river, palette } = this.config;
    const shimmer = Math.floor(time * 8) % 16;

    // Margem de terra em pixels para integrar o rio ao gramado.
    ctx.fillStyle = palette.dirtDark;
    ctx.fillRect(0, river.top - 2, width, 2);
    ctx.fillRect(0, river.bottom, width, 2);

    ctx.fillStyle = palette.dirt;
    for (let x = 5; x < width; x += 14) {
      if ((x + shimmer) % 28 < 14) {
        ctx.fillRect(x, river.top - 3, 6, 1);
        ctx.fillRect(x + 5, river.bottom + 2, 7, 1);
      }
    }

    // Espuma/reflexo da beirada em pequenos grupos de pixels.
    ctx.fillStyle = 'rgba(206, 239, 233, 0.82)';
    for (let x = -10 + shimmer; x < width + 10; x += 18) {
      ctx.fillRect(x, river.top, 5, 1);
      ctx.fillRect(x + 7, river.bottom - 1, 4, 1);
    }
  }

  drawRiverRocks(ctx) {
    const { river, palette } = this.config;

    for (const rock of this.getRiverRockLayout()) {
      const y = rock.side === 'top'
        ? river.top - rock.height + 5
        : river.bottom - 5;

      if (this.riverAtlasReady && this.riverAtlas) {
        ctx.drawImage(
          this.riverAtlas,
          rock.sprite * RIVER_ATLAS.frameWidth,
          RIVER_ATLAS.rocksY,
          RIVER_ATLAS.frameWidth,
          RIVER_ATLAS.frameHeight,
          Math.round(rock.x - rock.width / 2),
          Math.round(y),
          rock.width,
          rock.height,
        );
      } else {
        // Fallback pixelado para que as pedras já apareçam no primeiro frame.
        ctx.fillStyle = '#514d43';
        ctx.fillRect(Math.round(rock.x - rock.width / 2), Math.round(y + 3), rock.width, rock.height - 3);
        ctx.fillStyle = '#827966';
        ctx.fillRect(Math.round(rock.x - rock.width / 2 + 3), Math.round(y), Math.max(4, rock.width - 6), 4);
        ctx.fillStyle = palette.outline;
        ctx.fillRect(Math.round(rock.x - rock.width / 2), Math.round(y + rock.height - 2), rock.width, 2);
      }
    }
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
  }

  drawArenaEdges(ctx) {
    const { width, battlefield } = this.config;
    ctx.fillStyle = 'rgba(40, 45, 29, 0.38)';
    ctx.fillRect(0, battlefield.top, 5, battlefield.bottom - battlefield.top);
    ctx.fillRect(width - 5, battlefield.top, 5, battlefield.bottom - battlefield.top);
    ctx.fillRect(0, battlefield.bottom - 5, width, 5);
  }
}
