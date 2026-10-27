import {
  GROUND_BASE_SHEET,
  GROUND_TILE_WIDTH,
  GROUND_TILE_HEIGHT,
  GROUND_TILE_COUNT,
} from '../assets/ground/base/sheet.js?v=0.6.9';
import {
  GROUND_TOP_TRANSITION_SHEET,
  TRANSITION_TILE_WIDTH,
  TRANSITION_TILE_HEIGHT,
  TRANSITION_TILE_COUNT,
} from '../assets/ground/transition/top/sheet.js?v=0.6.9';
import { GROUND_BOTTOM_TRANSITION_SHEET } from '../assets/ground/transition/bottom/sheet.js?v=0.6.9';

const TILE_DRAW_SIZE = 64;
const TRANSITION_DRAW_HEIGHT = 16;
const TILE_STEP = TILE_DRAW_SIZE - 1;

function createImage(source) {
  if (typeof Image === 'undefined') return null;
  const image = new Image();
  image.src = source;
  return image;
}

export class GroundRenderer {
  constructor(config) {
    this.config = config;
    this.base = createImage(GROUND_BASE_SHEET);
    this.topTransition = createImage(GROUND_TOP_TRANSITION_SHEET);
    this.bottomTransition = createImage(GROUND_BOTTOM_TRANSITION_SHEET);
  }

  isReady(image) {
    return Boolean(image && image.complete && image.naturalWidth > 0);
  }

  draw(ctx) {
    const { width, battlefield, palette } = this.config;

    ctx.save();
    ctx.imageSmoothingEnabled = false;

    if (!this.isReady(this.base)) {
      ctx.fillStyle = palette.grass;
      ctx.fillRect(0, battlefield.top, width, battlefield.bottom - battlefield.top);
      ctx.restore();
      return;
    }

    this.drawBase(ctx);
    this.drawRiverTransitions(ctx);
    ctx.restore();
  }

  drawBase(ctx) {
    const { width, battlefield } = this.config;

    for (let y = battlefield.top, row = 0; y < battlefield.bottom; y += TILE_STEP, row += 1) {
      for (let x = 0, column = 0; x < width; x += TILE_STEP, column += 1) {
        const frame = (column + row * 2) % GROUND_TILE_COUNT;
        ctx.drawImage(
          this.base,
          frame * GROUND_TILE_WIDTH,
          0,
          GROUND_TILE_WIDTH,
          GROUND_TILE_HEIGHT,
          x,
          y,
          TILE_DRAW_SIZE,
          TILE_DRAW_SIZE,
        );
      }
    }
  }

  drawRiverTransitions(ctx) {
    const { width, river } = this.config;
    const topY = river.top - TRANSITION_DRAW_HEIGHT;
    const bottomY = river.bottom;

    if (this.isReady(this.topTransition)) {
      for (let x = 0, tile = 0; x < width; x += TILE_STEP, tile += 1) {
        const frame = tile % TRANSITION_TILE_COUNT;
        ctx.drawImage(
          this.topTransition,
          frame * TRANSITION_TILE_WIDTH,
          0,
          TRANSITION_TILE_WIDTH,
          TRANSITION_TILE_HEIGHT,
          x,
          topY,
          TILE_DRAW_SIZE,
          TRANSITION_DRAW_HEIGHT,
        );
      }
    }

    if (this.isReady(this.bottomTransition)) {
      for (let x = 0, tile = 0; x < width; x += TILE_STEP, tile += 1) {
        const frame = tile % TRANSITION_TILE_COUNT;
        ctx.drawImage(
          this.bottomTransition,
          frame * TRANSITION_TILE_WIDTH,
          0,
          TRANSITION_TILE_WIDTH,
          TRANSITION_TILE_HEIGHT,
          x,
          bottomY,
          TILE_DRAW_SIZE,
          TRANSITION_DRAW_HEIGHT,
        );
      }
    }
  }
}

export const GROUND_SPRITE_META = Object.freeze({
  tiles: GROUND_TILE_COUNT,
  tileWidth: GROUND_TILE_WIDTH,
  tileHeight: GROUND_TILE_HEIGHT,
  transitionTiles: TRANSITION_TILE_COUNT,
  transitionHeight: TRANSITION_DRAW_HEIGHT,
});
