import {
  GRASS_ATLAS_URL,
  GRASS_TILE_WIDTH,
  GRASS_TILE_HEIGHT,
  GRASS_TILE_COLUMNS,
  GRASS_TILE_COUNT,
} from '../assets/ground/grass/manifest.js?v=0.6.11';
import {
  PATH_ATLAS_URL,
  PATH_TILE_WIDTH,
  PATH_TILE_HEIGHT,
  PATH_TILE_COLUMNS,
  PATH_TILE_COUNT,
} from '../assets/ground/paths/manifest.js?v=0.6.11';
import {
  DETAIL_ATLAS_URL,
  DETAIL_TILE_WIDTH,
  DETAIL_TILE_HEIGHT,
  DETAIL_TILE_COLUMNS,
  DETAIL_TILE_COUNT,
} from '../assets/ground/details/manifest.js?v=0.6.11';
import { GROUND_DETAIL_LAYOUT } from '../assets/ground/details/layout.js?v=0.6.11';

const GRASS_DRAW_SIZE = 64;
const PATH_DRAW_WIDTH = 48;
const PATH_DRAW_HEIGHT = 96;
const PATH_OFFSETS = [-4, 0, 3, -2, 2, 0];

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

export class GroundRenderer {
  constructor(config) {
    this.config = config;
    this.grass = createImage(GRASS_ATLAS_URL);
    this.paths = createImage(PATH_ATLAS_URL);
    this.details = createImage(DETAIL_ATLAS_URL);
  }

  isReady(image) {
    return Boolean(image && image.complete && image.naturalWidth > 0);
  }

  draw(ctx) {
    const { width, battlefield, palette } = this.config;

    ctx.save();
    ctx.imageSmoothingEnabled = false;

    if (!this.isReady(this.grass)) {
      ctx.fillStyle = palette.grass;
      ctx.fillRect(0, battlefield.top, width, battlefield.bottom - battlefield.top);
      ctx.restore();
      return;
    }

    this.drawGrass(ctx);
    this.drawDetails(ctx);
    this.drawPaths(ctx);
    ctx.restore();
  }

  drawGrass(ctx) {
    const { width, battlefield } = this.config;

    for (let y = battlefield.top, row = 0; y < battlefield.bottom; y += GRASS_DRAW_SIZE, row += 1) {
      for (let x = 0, column = 0; x < width; x += GRASS_DRAW_SIZE, column += 1) {
        const frame = (column * 7 + row * 11 + ((column + row) % 3) * 5) % GRASS_TILE_COUNT;
        const { sx, sy } = getAtlasRect(frame, GRASS_TILE_COLUMNS, GRASS_TILE_WIDTH, GRASS_TILE_HEIGHT);
        const drawWidth = Math.min(GRASS_DRAW_SIZE, width - x);
        const drawHeight = Math.min(GRASS_DRAW_SIZE, battlefield.bottom - y);
        const sourceWidth = Math.max(1, Math.ceil((drawWidth / GRASS_DRAW_SIZE) * GRASS_TILE_WIDTH));
        const sourceHeight = Math.max(1, Math.ceil((drawHeight / GRASS_DRAW_SIZE) * GRASS_TILE_HEIGHT));

        ctx.drawImage(
          this.grass,
          sx,
          sy,
          sourceWidth,
          sourceHeight,
          x,
          y,
          drawWidth + 1,
          drawHeight + 1,
        );
      }
    }
  }

  drawDetails(ctx) {
    if (!this.isReady(this.details)) return;

    for (const detail of GROUND_DETAIL_LAYOUT) {
      const frame = detail.frame % DETAIL_TILE_COUNT;
      const { sx, sy } = getAtlasRect(frame, DETAIL_TILE_COLUMNS, DETAIL_TILE_WIDTH, DETAIL_TILE_HEIGHT);
      const size = detail.size;

      ctx.drawImage(
        this.details,
        sx,
        sy,
        DETAIL_TILE_WIDTH,
        DETAIL_TILE_HEIGHT,
        Math.round(detail.x - size / 2),
        Math.round(detail.y - size / 2),
        size,
        size,
      );
    }
  }

  drawPaths(ctx) {
    if (!this.isReady(this.paths)) return;

    const { battlefield, river, bridges } = this.config;

    for (let lane = 0; lane < bridges.length; lane += 1) {
      const centerX = bridges[lane];
      this.drawPathSection(ctx, lane * 3, centerX, battlefield.top + 48, river.top);
      this.drawPathSection(ctx, lane * 3 + 2, centerX, river.bottom, battlefield.bottom - 28);
    }
  }

  drawPathSection(ctx, seed, centerX, startY, endY) {
    for (let y = startY, segment = 0; y < endY; y += PATH_DRAW_HEIGHT, segment += 1) {
      const frame = (seed + segment * 5) % PATH_TILE_COUNT;
      const { sx, sy } = getAtlasRect(frame, PATH_TILE_COLUMNS, PATH_TILE_WIDTH, PATH_TILE_HEIGHT);
      const remaining = endY - y;
      const drawHeight = Math.min(PATH_DRAW_HEIGHT, remaining);
      const sourceHeight = Math.max(1, Math.ceil((drawHeight / PATH_DRAW_HEIGHT) * PATH_TILE_HEIGHT));
      const offset = PATH_OFFSETS[(segment + seed) % PATH_OFFSETS.length];
      const x = Math.round(centerX - PATH_DRAW_WIDTH / 2 + offset);

      ctx.drawImage(
        this.paths,
        sx,
        sy,
        PATH_TILE_WIDTH,
        sourceHeight,
        x,
        y,
        PATH_DRAW_WIDTH,
        drawHeight + 1,
      );
    }
  }
}

export const GROUND_SPRITE_META = Object.freeze({
  grassTiles: GRASS_TILE_COUNT,
  grassTileWidth: GRASS_TILE_WIDTH,
  grassTileHeight: GRASS_TILE_HEIGHT,
  grassDrawSize: GRASS_DRAW_SIZE,
  pathTiles: PATH_TILE_COUNT,
  pathTileWidth: PATH_TILE_WIDTH,
  pathTileHeight: PATH_TILE_HEIGHT,
  pathDrawWidth: PATH_DRAW_WIDTH,
  pathDrawHeight: PATH_DRAW_HEIGHT,
  detailTiles: DETAIL_TILE_COUNT,
  detailTileWidth: DETAIL_TILE_WIDTH,
  detailTileHeight: DETAIL_TILE_HEIGHT,
  details: GROUND_DETAIL_LAYOUT.length,
});
