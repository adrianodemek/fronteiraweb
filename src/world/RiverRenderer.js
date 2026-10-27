import {
  WATER_SHEET,
  WATER_FRAME_WIDTH,
  WATER_FRAME_HEIGHT,
  WATER_FRAME_COUNT,
} from '../assets/river/water/sheet.js?v=0.6.8';
import {
  TOP_BANK_SHEET,
  BANK_SOURCE_WIDTH,
  BANK_SOURCE_HEIGHT,
  BANK_TILE_COUNT,
} from '../assets/river/banks/top/sheet.js?v=0.6.8';
import { BOTTOM_BANK_SHEET } from '../assets/river/banks/bottom/sheet.js?v=0.6.8';
import {
  ROCK_SHEET,
  ROCK_FRAME_WIDTH,
  ROCK_FRAME_HEIGHT,
  ROCK_FRAME_COUNT,
} from '../assets/river/rocks/sheet.js?v=0.6.8';
import { RIVER_ROCK_LAYOUT } from '../assets/river/rocks/layout.js?v=0.6.8';

const WATER_FRAME_SECONDS = 0.22;
const WATER_SCROLL_SPEED = 3;
const WATER_TILE_WIDTH = 128;
const BANK_TILE_WIDTH = 64;
const BANK_TILE_HEIGHT = 16;
const BANK_OVERLAP = 4;
const BANK_STEP = BANK_TILE_WIDTH - 1;

function createImage(source) {
  if (typeof Image === 'undefined') return null;
  const image = new Image();
  image.src = source;
  return image;
}

export class RiverRenderer {
  constructor(config) {
    this.config = config;
    this.water = createImage(WATER_SHEET);
    this.topBank = createImage(TOP_BANK_SHEET);
    this.bottomBank = createImage(BOTTOM_BANK_SHEET);
    this.rocks = createImage(ROCK_SHEET);
  }

  isReady(image) {
    return Boolean(image && image.complete && image.naturalWidth > 0);
  }

  getWaterFrameIndex(time) {
    return Math.floor(Math.max(0, time) / WATER_FRAME_SECONDS) % WATER_FRAME_COUNT;
  }

  draw(ctx, time) {
    const { width, river, palette } = this.config;
    const riverHeight = river.bottom - river.top;

    ctx.save();
    ctx.imageSmoothingEnabled = false;

    if (this.isReady(this.water)) {
      const frame = this.getWaterFrameIndex(time);
      const scroll = Math.floor((Math.max(0, time) * WATER_SCROLL_SPEED) % WATER_TILE_WIDTH);

      // Movimento intencionalmente lento: o rio continua vivo, mas permanece
      // como elemento de fundo e não compete visualmente com o combate.
      for (let x = -scroll; x < width + WATER_TILE_WIDTH; x += WATER_TILE_WIDTH) {
        ctx.drawImage(
          this.water,
          frame * WATER_FRAME_WIDTH,
          0,
          WATER_FRAME_WIDTH,
          WATER_FRAME_HEIGHT,
          Math.round(x),
          river.top,
          WATER_TILE_WIDTH,
          riverHeight,
        );
      }
    } else {
      // Apenas enquanto os PNGs terminam de carregar.
      ctx.fillStyle = palette.waterDark;
      ctx.fillRect(0, river.top, width, riverHeight);
      ctx.fillStyle = '#176d91';
      ctx.fillRect(0, river.top + 2, width, Math.max(1, riverHeight - 4));
    }

    this.drawBanks(ctx);
    this.drawRocks(ctx);
    ctx.restore();
  }

  drawBanks(ctx) {
    const { width, river } = this.config;
    const topY = river.top - (BANK_TILE_HEIGHT - BANK_OVERLAP);
    const bottomY = river.bottom - BANK_OVERLAP;

    if (this.isReady(this.topBank)) {
      for (let x = 0, tile = 0; x < width; x += BANK_STEP, tile += 1) {
        const frame = tile % BANK_TILE_COUNT;
        ctx.drawImage(
          this.topBank,
          frame * BANK_SOURCE_WIDTH,
          0,
          BANK_SOURCE_WIDTH,
          BANK_SOURCE_HEIGHT,
          x,
          topY,
          BANK_TILE_WIDTH,
          BANK_TILE_HEIGHT,
        );
      }
    }

    if (this.isReady(this.bottomBank)) {
      for (let x = 0, tile = 0; x < width; x += BANK_STEP, tile += 1) {
        const frame = tile % BANK_TILE_COUNT;
        ctx.drawImage(
          this.bottomBank,
          frame * BANK_SOURCE_WIDTH,
          0,
          BANK_SOURCE_WIDTH,
          BANK_SOURCE_HEIGHT,
          x,
          bottomY,
          BANK_TILE_WIDTH,
          BANK_TILE_HEIGHT,
        );
      }
    }
  }

  drawRocks(ctx) {
    if (!this.isReady(this.rocks)) return;

    const { river } = this.config;

    for (const rock of RIVER_ROCK_LAYOUT) {
      const scale = rock.scale ?? 1;
      const width = Math.max(1, Math.round(ROCK_FRAME_WIDTH * scale));
      const height = Math.max(1, Math.round(ROCK_FRAME_HEIGHT * scale));
      const x = Math.round(rock.x - width / 2);
      const y = rock.side === 'top'
        ? Math.round(river.top - height + 2)
        : Math.round(river.bottom - 2);

      ctx.drawImage(
        this.rocks,
        rock.frame * ROCK_FRAME_WIDTH,
        0,
        ROCK_FRAME_WIDTH,
        ROCK_FRAME_HEIGHT,
        x,
        y,
        width,
        height,
      );
    }
  }
}

export const RIVER_SPRITE_META = Object.freeze({
  waterFrames: WATER_FRAME_COUNT,
  waterFrameSeconds: WATER_FRAME_SECONDS,
  waterScrollSpeed: WATER_SCROLL_SPEED,
  waterFrameWidth: WATER_FRAME_WIDTH,
  waterFrameHeight: WATER_FRAME_HEIGHT,
  waterTileWidth: WATER_TILE_WIDTH,
  bankTiles: BANK_TILE_COUNT,
  bankSourceWidth: BANK_SOURCE_WIDTH,
  bankSourceHeight: BANK_SOURCE_HEIGHT,
  bankTileHeight: BANK_TILE_HEIGHT,
  bankOverlap: BANK_OVERLAP,
  rockFrames: ROCK_FRAME_COUNT,
  rockCount: RIVER_ROCK_LAYOUT.length,
});
