import {
  GROUND_TEXTURE_URL,
  GROUND_FRAME_WIDTH,
  GROUND_FRAME_HEIGHT,
  GROUND_FRAME_COUNT,
} from '../assets/ground/base/manifest.js?v=0.6.10';
import {
  GROUND_LANE_URL,
  LANE_FRAME_WIDTH,
  LANE_FRAME_HEIGHT,
  LANE_FRAME_COUNT,
} from '../assets/ground/lane/manifest.js?v=0.6.10';

const GROUND_DRAW_WIDTH = 360;
const GROUND_DRAW_HEIGHT = 256;
const LANE_DRAW_WIDTH = 20;
const LANE_DRAW_HEIGHT = 64;

function createImage(source) {
  if (typeof Image === 'undefined') return null;
  const image = new Image();
  image.src = source;
  return image;
}

export class GroundRenderer {
  constructor(config) {
    this.config = config;
    this.ground = createImage(GROUND_TEXTURE_URL);
    this.lanes = createImage(GROUND_LANE_URL);
  }

  isReady(image) {
    return Boolean(image && image.complete && image.naturalWidth > 0);
  }

  draw(ctx) {
    const { width, battlefield, palette } = this.config;

    ctx.save();
    ctx.imageSmoothingEnabled = false;

    if (!this.isReady(this.ground)) {
      ctx.fillStyle = palette.grass;
      ctx.fillRect(0, battlefield.top, width, battlefield.bottom - battlefield.top);
      ctx.restore();
      return;
    }

    this.drawBase(ctx);
    this.drawLanes(ctx);
    ctx.restore();
  }

  drawBase(ctx) {
    const { width, battlefield } = this.config;

    for (let y = battlefield.top, row = 0; y < battlefield.bottom; y += GROUND_DRAW_HEIGHT, row += 1) {
      const frame = row % GROUND_FRAME_COUNT;
      const remaining = battlefield.bottom - y;
      const drawHeight = Math.min(GROUND_DRAW_HEIGHT, remaining);
      const sourceHeight = Math.max(1, Math.ceil((drawHeight / GROUND_DRAW_HEIGHT) * GROUND_FRAME_HEIGHT));

      ctx.drawImage(
        this.ground,
        frame * GROUND_FRAME_WIDTH,
        0,
        GROUND_FRAME_WIDTH,
        sourceHeight,
        0,
        y,
        width,
        drawHeight,
      );
    }
  }

  drawLanes(ctx) {
    if (!this.isReady(this.lanes)) return;

    const { battlefield, river, bridges } = this.config;

    for (let lane = 0; lane < bridges.length; lane += 1) {
      const centerX = bridges[lane];
      const x = Math.round(centerX - LANE_DRAW_WIDTH / 2);

      this.drawLaneSection(ctx, lane, x, battlefield.top + 72, river.top);
      this.drawLaneSection(ctx, lane + 1, x, river.bottom, battlefield.bottom - 76);
    }
  }

  drawLaneSection(ctx, seed, x, startY, endY) {
    for (let y = startY, segment = 0; y < endY; y += LANE_DRAW_HEIGHT, segment += 1) {
      const frame = (seed + segment) % LANE_FRAME_COUNT;
      const remaining = endY - y;
      const drawHeight = Math.min(LANE_DRAW_HEIGHT, remaining);
      const sourceHeight = Math.max(1, Math.ceil((drawHeight / LANE_DRAW_HEIGHT) * LANE_FRAME_HEIGHT));

      ctx.drawImage(
        this.lanes,
        frame * LANE_FRAME_WIDTH,
        0,
        LANE_FRAME_WIDTH,
        sourceHeight,
        x,
        y,
        LANE_DRAW_WIDTH,
        drawHeight,
      );
    }
  }
}

export const GROUND_SPRITE_META = Object.freeze({
  groundFrames: GROUND_FRAME_COUNT,
  groundFrameWidth: GROUND_FRAME_WIDTH,
  groundFrameHeight: GROUND_FRAME_HEIGHT,
  groundDrawWidth: GROUND_DRAW_WIDTH,
  groundDrawHeight: GROUND_DRAW_HEIGHT,
  laneFrames: LANE_FRAME_COUNT,
  laneFrameWidth: LANE_FRAME_WIDTH,
  laneFrameHeight: LANE_FRAME_HEIGHT,
  laneDrawWidth: LANE_DRAW_WIDTH,
});
