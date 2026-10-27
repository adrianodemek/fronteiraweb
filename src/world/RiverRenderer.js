import {
  WATER_SHEET,
  WATER_FRAME_WIDTH,
  WATER_FRAME_HEIGHT,
  WATER_FRAME_COUNT,
} from '../assets/river/water/sheet.js?v=0.6.9';
import {
  TOP_BANK_SHEET,
  BANK_SOURCE_WIDTH,
  BANK_SOURCE_HEIGHT,
  BANK_TILE_COUNT,
} from '../assets/river/banks/top/sheet.js?v=0.6.9';
import { BOTTOM_BANK_SHEET } from '../assets/river/banks/bottom/sheet.js?v=0.6.9';
import {
  ROCK_SHEET,
  ROCK_FRAME_WIDTH,
  ROCK_FRAME_HEIGHT,
  ROCK_FRAME_COUNT,
} from '../assets/river/rocks/sheet.js?v=0.6.9';
import { RIVER_ROCK_LAYOUT } from '../assets/river/rocks/layout.js?v=0.6.9';
import {
  DETAIL_ATLAS_URL,
  DETAIL_TILE_WIDTH,
  DETAIL_TILE_HEIGHT,
  DETAIL_TILE_COLUMNS,
  DETAIL_TILE_COUNT,
} from '../assets/ground/details/manifest.js?v=0.6.15';

const WATER_FRAME_SECONDS = 0.22;
const WATER_SCROLL_SPEED = 3;
const WATER_TILE_WIDTH = 128;
const BANK_TILE_WIDTH = 64;
const BANK_TILE_HEIGHT = 16;
const BANK_OVERLAP = 4;
const BANK_STEP = BANK_TILE_WIDTH - 1;
const BLEND_BRIDGE_PADDING = 12;
const FRINGE_STEP = 8;

const BANK_BLEND_LAYOUT = Object.freeze([
  { side: 'top', x: 14, frame: 4, size: 23, yOffset: -2 },
  { side: 'top', x: 42, frame: 1, size: 19, yOffset: 1 },
  { side: 'top', x: 112, frame: 3, size: 21, yOffset: -1 },
  { side: 'top', x: 145, frame: 6, size: 24, yOffset: 1 },
  { side: 'top', x: 176, frame: 0, size: 18, yOffset: -2 },
  { side: 'top', x: 210, frame: 12, size: 21, yOffset: 1 },
  { side: 'top', x: 242, frame: 14, size: 19, yOffset: -1 },
  { side: 'top', x: 318, frame: 2, size: 23, yOffset: 0 },
  { side: 'top', x: 346, frame: 8, size: 20, yOffset: -2 },
  { side: 'bottom', x: 16, frame: 8, size: 21, yOffset: 1 },
  { side: 'bottom', x: 44, frame: 3, size: 20, yOffset: -1 },
  { side: 'bottom', x: 112, frame: 14, size: 19, yOffset: 1 },
  { side: 'bottom', x: 146, frame: 2, size: 23, yOffset: -1 },
  { side: 'bottom', x: 178, frame: 6, size: 20, yOffset: 1 },
  { side: 'bottom', x: 212, frame: 1, size: 19, yOffset: -1 },
  { side: 'bottom', x: 244, frame: 12, size: 22, yOffset: 1 },
  { side: 'bottom', x: 318, frame: 4, size: 24, yOffset: -1 },
  { side: 'bottom', x: 346, frame: 0, size: 18, yOffset: 1 },
]);

function createImage(source) {
  if (typeof Image === 'undefined') return null;
  const image = new Image();
  image.src = source;
  return image;
}

function getAtlasRect(frame, columns, tileWidth, tileHeight) {
  return {
    sx: (frame % columns) * tileWidth,
    sy: Math.floor(frame / columns) * tileHeight,
    sw: tileWidth,
    sh: tileHeight,
  };
}

export class RiverRenderer {
  constructor(config) {
    this.config = config;
    this.water = createImage(WATER_SHEET);
    this.topBank = createImage(TOP_BANK_SHEET);
    this.bottomBank = createImage(BOTTOM_BANK_SHEET);
    this.rocks = createImage(ROCK_SHEET);
    this.groundDetails = createImage(DETAIL_ATLAS_URL);
  }

  isReady(image) {
    return Boolean(image && image.complete && image.naturalWidth > 0);
  }

  getWaterFrameIndex(time) {
    return Math.floor(Math.max(0, time) / WATER_FRAME_SECONDS) % WATER_FRAME_COUNT;
  }

  isNearBridge(x) {
    const half = this.config.bridgeWidth / 2 + BLEND_BRIDGE_PADDING;
    return this.config.bridges.some((bridgeX) => Math.abs(x - bridgeX) <= half);
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
    this.drawRocks(ctx);
    this.drawBankFringe(ctx);
    this.drawVegetationBlend(ctx);
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

  drawBankFringe(ctx) {
    const { width, river, palette } = this.config;
    const colors = [palette.grassDark, palette.grass, palette.grassLight, palette.dirt];

    for (let x = 4, index = 0; x < width - 4; x += FRINGE_STEP, index += 1) {
      if (this.isNearBridge(x)) continue;

      const topDepth = 2 + ((index * 3) % 5);
      const bottomDepth = 2 + ((index * 5 + 1) % 5);
      const topWidth = 3 + ((index * 7) % 6);
      const bottomWidth = 3 + ((index * 11) % 6);

      ctx.fillStyle = colors[index % colors.length];
      ctx.fillRect(x, river.top - topDepth, topWidth, topDepth + 1);

      ctx.fillStyle = colors[(index + 2) % colors.length];
      ctx.fillRect(x + ((index % 3) - 1), river.bottom - 1, bottomWidth, bottomDepth + 1);
    }
  }

  drawVegetationBlend(ctx) {
    if (!this.isReady(this.groundDetails)) return;

    const { river } = this.config;

    for (const detail of BANK_BLEND_LAYOUT) {
      if (this.isNearBridge(detail.x)) continue;

      const frame = detail.frame % DETAIL_TILE_COUNT;
      const { sx, sy } = getAtlasRect(
        frame,
        DETAIL_TILE_COLUMNS,
        DETAIL_TILE_WIDTH,
        DETAIL_TILE_HEIGHT,
      );
      const size = detail.size;
      const centerY = detail.side === 'top'
        ? river.top - 5 + detail.yOffset
        : river.bottom + 5 + detail.yOffset;

      ctx.drawImage(
        this.groundDetails,
        sx,
        sy,
        DETAIL_TILE_WIDTH,
        DETAIL_TILE_HEIGHT,
        Math.round(detail.x - size / 2),
        Math.round(centerY - size / 2),
        size,
        size,
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
  blendSprites: BANK_BLEND_LAYOUT.length,
  fringeStep: FRINGE_STEP,
  bridgeBlendPadding: BLEND_BRIDGE_PADDING,
});
