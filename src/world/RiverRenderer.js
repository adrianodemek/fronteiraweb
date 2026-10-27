import {
  WATER_SHEET,
  WATER_FRAME_WIDTH,
  WATER_FRAME_HEIGHT,
  WATER_FRAME_COUNT,
} from '../assets/river/water/sheet.js?v=0.6.6';
import {
  TOP_BANK_SHEET,
  BANK_SOURCE_WIDTH,
  BANK_SOURCE_HEIGHT,
  BANK_TILE_COUNT,
} from '../assets/river/banks/top/sheet.js?v=0.6.6';
import { BOTTOM_BANK_SHEET } from '../assets/river/banks/bottom/sheet.js?v=0.6.6';

const WATER_FRAME_SECONDS = 0.12;
const WATER_TILE_WIDTH = 64;
const BANK_TILE_WIDTH = 64;
const BANK_TILE_HEIGHT = 32;

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
      const reflectionScroll = Math.floor((Math.max(0, time) * 10) % WATER_TILE_WIDTH);

      for (let x = -WATER_TILE_WIDTH + reflectionScroll; x < width + WATER_TILE_WIDTH; x += WATER_TILE_WIDTH) {
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
      ctx.fillStyle = palette.waterDark;
      ctx.fillRect(0, river.top, width, riverHeight);
      ctx.fillStyle = palette.water;
      ctx.fillRect(0, river.top + 2, width, Math.max(1, riverHeight - 4));
    }

    this.drawBanks(ctx);
    ctx.restore();
  }

  drawBanks(ctx) {
    const { width, river } = this.config;

    if (this.isReady(this.topBank)) {
      for (let x = 0, tile = 0; x < width; x += BANK_TILE_WIDTH, tile += 1) {
        const frame = tile % BANK_TILE_COUNT;
        ctx.drawImage(
          this.topBank,
          frame * BANK_SOURCE_WIDTH,
          0,
          BANK_SOURCE_WIDTH,
          BANK_SOURCE_HEIGHT,
          x,
          river.top - 24,
          BANK_TILE_WIDTH,
          BANK_TILE_HEIGHT,
        );
      }
    }

    if (this.isReady(this.bottomBank)) {
      for (let x = 0, tile = 0; x < width; x += BANK_TILE_WIDTH, tile += 1) {
        const frame = tile % BANK_TILE_COUNT;
        ctx.drawImage(
          this.bottomBank,
          frame * BANK_SOURCE_WIDTH,
          0,
          BANK_SOURCE_WIDTH,
          BANK_SOURCE_HEIGHT,
          x,
          river.bottom - 8,
          BANK_TILE_WIDTH,
          BANK_TILE_HEIGHT,
        );
      }
    }
  }
}

export const RIVER_SPRITE_META = Object.freeze({
  waterFrames: WATER_FRAME_COUNT,
  waterFrameSeconds: WATER_FRAME_SECONDS,
  waterFrameWidth: WATER_FRAME_WIDTH,
  waterFrameHeight: WATER_FRAME_HEIGHT,
  bankTiles: BANK_TILE_COUNT,
  bankSourceWidth: BANK_SOURCE_WIDTH,
  bankSourceHeight: BANK_SOURCE_HEIGHT,
});
