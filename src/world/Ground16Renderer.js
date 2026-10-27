import {
  GROUND_TILE_SIZE,
  GROUND_PALETTE,
  GROUND_BASE_TILES,
} from '../assets/ground/v1/base/tiles.js?v=0.6.9';
import {
  RIVER_EDGE_PALETTE,
  RIVER_EDGE_TILES,
} from '../assets/ground/v1/transition/tiles.js?v=0.6.9';
import { GROUND_DETAIL_LAYOUT } from '../assets/ground/v1/details/layout.js?v=0.6.9';

const BASE_TILE_PX = 32;
const BASE_PIXEL_PX = BASE_TILE_PX / GROUND_TILE_SIZE;
const EDGE_TILE_PX = 32;
const EDGE_ROW_PX = 3;
const EDGE_HEIGHT = 12;

function tileVariant(tx, ty, count) {
  const hash = Math.abs((tx * 17) ^ (ty * 31) ^ ((tx + ty) * 7));
  return hash % count;
}

export class Ground16Renderer {
  constructor(config) {
    this.config = config;
    this.cache = null;
    this.cacheAttempted = false;
  }

  draw(ctx) {
    if (!this.cacheAttempted) this.buildCache();

    ctx.save();
    ctx.imageSmoothingEnabled = false;

    if (this.cache) {
      ctx.drawImage(this.cache, 0, this.config.battlefield.top);
    } else {
      this.drawDirect(ctx);
    }

    ctx.restore();
  }

  buildCache() {
    this.cacheAttempted = true;
    if (typeof document === 'undefined') return;

    const canvas = document.createElement('canvas');
    canvas.width = this.config.width;
    canvas.height = this.config.battlefield.bottom - this.config.battlefield.top;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.imageSmoothingEnabled = false;
    this.drawDirect(ctx, -this.config.battlefield.top);
    this.cache = canvas;
  }

  drawDirect(ctx, yOffset = 0) {
    const { width, battlefield } = this.config;

    for (let y = battlefield.top; y < battlefield.bottom; y += BASE_TILE_PX) {
      const ty = Math.floor((y - battlefield.top) / BASE_TILE_PX);
      for (let x = 0; x < width; x += BASE_TILE_PX) {
        const tx = Math.floor(x / BASE_TILE_PX);
        const tile = GROUND_BASE_TILES[tileVariant(tx, ty, GROUND_BASE_TILES.length)];
        this.drawBaseTile(ctx, tile, x, y + yOffset);
      }
    }

    this.drawLaneWear(ctx, yOffset);
    this.drawRiverTransition(ctx, yOffset);
    this.drawDetails(ctx, yOffset);
  }

  drawBaseTile(ctx, tile, x, y) {
    for (let row = 0; row < GROUND_TILE_SIZE; row += 1) {
      const cells = tile[row];
      for (let col = 0; col < GROUND_TILE_SIZE; col += 1) {
        const paletteIndex = Number(cells[col]);
        ctx.fillStyle = GROUND_PALETTE[paletteIndex] ?? GROUND_PALETTE[0];
        ctx.fillRect(
          Math.round(x + col * BASE_PIXEL_PX),
          Math.round(y + row * BASE_PIXEL_PX),
          Math.ceil(BASE_PIXEL_PX),
          Math.ceil(BASE_PIXEL_PX),
        );
      }
    }
  }

  drawLaneWear(ctx, yOffset) {
    const { battlefield, river, bridges } = this.config;
    ctx.save();
    ctx.globalAlpha = 0.055;
    ctx.fillStyle = '#4d5c39';

    for (const bridgeX of bridges) {
      ctx.fillRect(bridgeX - 7, battlefield.top + 74 + yOffset, 14, river.top - battlefield.top - 94);
      ctx.fillRect(bridgeX - 7, river.bottom + 20 + yOffset, 14, battlefield.bottom - river.bottom - 96);
    }

    ctx.restore();
  }

  drawRiverTransition(ctx, yOffset) {
    const { width, river } = this.config;
    const topY = river.top - EDGE_HEIGHT + yOffset;
    const bottomY = river.bottom + yOffset;

    for (let x = 0, index = 0; x < width; x += EDGE_TILE_PX, index += 1) {
      const tile = RIVER_EDGE_TILES[index % RIVER_EDGE_TILES.length];
      this.drawEdgeTile(ctx, tile, x, topY, false);
      this.drawEdgeTile(ctx, tile, x, bottomY, true);
    }
  }

  drawEdgeTile(ctx, tile, x, y, flipY) {
    const colWidth = EDGE_TILE_PX / 8;

    for (let row = 0; row < 4; row += 1) {
      const sourceRow = flipY ? 3 - row : row;
      const cells = tile[sourceRow];
      for (let col = 0; col < 8; col += 1) {
        const paletteIndex = Number(cells[col]);
        ctx.fillStyle = RIVER_EDGE_PALETTE[paletteIndex] ?? RIVER_EDGE_PALETTE[0];
        ctx.fillRect(
          Math.round(x + col * colWidth),
          Math.round(y + row * EDGE_ROW_PX),
          Math.ceil(colWidth),
          EDGE_ROW_PX,
        );
      }
    }
  }

  drawDetails(ctx, yOffset) {
    for (const detail of GROUND_DETAIL_LAYOUT) {
      if (detail.type === 'tuft') {
        ctx.fillStyle = '#5f7542';
        ctx.fillRect(detail.x - 2, detail.y + yOffset, 2, 4);
        ctx.fillRect(detail.x + 1, detail.y + 1 + yOffset, 2, 3);
        ctx.fillStyle = '#82965c';
        ctx.fillRect(detail.x, detail.y + yOffset, 1, 2);
      } else {
        ctx.fillStyle = '#82965c';
        ctx.fillRect(detail.x, detail.y + yOffset, 2, 2);
      }
    }
  }
}

export const GROUND_SPRITE_META = Object.freeze({
  baseTiles: GROUND_BASE_TILES.length,
  baseTilePixels: GROUND_TILE_SIZE,
  baseTileRenderSize: BASE_TILE_PX,
  transitionTiles: RIVER_EDGE_TILES.length,
  transitionHeight: EDGE_HEIGHT,
  detailCount: GROUND_DETAIL_LAYOUT.length,
  cachedInBrowser: true,
});
