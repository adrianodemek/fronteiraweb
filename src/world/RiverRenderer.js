import {
  WATER_SHEET,
  WATER_FRAME_WIDTH,
  WATER_FRAME_HEIGHT,
  WATER_FRAME_COUNT,
} from '../assets/river/water/sheet.js?v=0.6.16';
import {
  TOP_BANK_ATLAS_URL,
  BANK_TILE_WIDTH,
  BANK_TILE_HEIGHT,
  BANK_TILE_COUNT,
} from '../assets/river/banks/top/manifest.js?v=0.6.16';
import { BOTTOM_BANK_ATLAS_URL } from '../assets/river/banks/bottom/manifest.js?v=0.6.16';

const WATER_FRAME_SECONDS = 0.22;
const WATER_SCROLL_SPEED = 3;
const WATER_TILE_WIDTH = 128;
const BANK_OVERLAP = 8;
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
    this.topBank = createImage(TOP_BANK_ATLAS_URL);
    this.bottomBank = createImage(BOTTOM_BANK_ATLAS_URL);
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
      ctx.fillStyle = palette.waterDark;
      ctx.fillRect(0, river.top, width, riverHeight);
      ctx.fillStyle = '#176d91';
      ctx.fillRect(0, river.top + 2, width, Math.max(1, riverHeight - 4));
    }

    this.drawBanks(ctx);
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
          frame * BANK_TILE_WIDTH,
          0,
          BANK_TILE_WIDTH,
          BANK_TILE_HEIGHT,
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
          frame * BANK_TILE_WIDTH,
          0,
          BANK_TILE_WIDTH,
          BANK_TILE_HEIGHT,
          x,
          bottomY,
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
  waterScrollSpeed: WATER_SCROLL_SPEED,
  waterFrameWidth: WATER_FRAME_WIDTH,
  waterFrameHeight: WATER_FRAME_HEIGHT,
  waterTileWidth: WATER_TILE_WIDTH,
  bankTiles: BANK_TILE_COUNT,
  bankTileWidth: BANK_TILE_WIDTH,
  bankTileHeight: BANK_TILE_HEIGHT,
  bankOverlap: BANK_OVERLAP,
  bankLandDepth: BANK_TILE_HEIGHT - BANK_OVERLAP,
  integratedBankBlend: true,
});
