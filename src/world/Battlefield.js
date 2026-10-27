import { GroundRenderer } from './GroundRenderer.js?v=0.6.18';
import { RiverRenderer } from './RiverRenderer.js?v=0.6.18';

const BRIDGE_LAND_OVERLAP = 20;
const BRIDGE_PLANK_HEIGHT = 5;
const BRIDGE_SIDE_BEAM_WIDTH = 2;
const BRIDGE_ANCHOR_DEPTH = 8;
const BRIDGE_PLANK_COLORS = Object.freeze([
  '#806544',
  '#745c40',
  '#896b47',
  '#70583d',
  '#7b6244',
  '#68543b',
  '#846846',
  '#765e41',
]);
const BRIDGE_MOSS = '#68724b';
const BRIDGE_MOSS_DARK = '#55613f';
const BRIDGE_STONE = '#74745a';
const BRIDGE_STONE_DARK = '#5d634b';

export class Battlefield {
  constructor(config) {
    this.config = config;
    this.groundRenderer = new GroundRenderer(config);
    this.riverRenderer = new RiverRenderer(config);
  }

  draw(ctx, time) {
    const { river, bridges, bridgeWidth } = this.config;

    this.groundRenderer.draw(ctx);
    this.riverRenderer.draw(ctx, time);

    const bridgeTop = river.top - BRIDGE_LAND_OVERLAP;
    const bridgeBottom = river.bottom + BRIDGE_LAND_OVERLAP;

    for (const bridgeX of bridges) {
      this.drawBridge(ctx, bridgeX, bridgeTop, bridgeBottom, bridgeWidth);
    }

    this.drawArenaEdges(ctx);
  }

  drawBridge(ctx, centerX, top, bottom, width) {
    const x = Math.round(centerX - width / 2);
    const h = bottom - top;

    ctx.save();
    ctx.imageSmoothingEnabled = false;

    this.drawBridgeAnchors(ctx, x, top, bottom, width);

    // Sombra curta nas laterais: dá profundidade sem criar uma moldura limpa demais.
    ctx.fillStyle = '#3f3828';
    ctx.fillRect(x - 2, top + 2, 2, h - 4);
    ctx.fillRect(x + width, top + 2, 2, h - 4);

    // Tábuas irregulares e mais opacas, próximas aos tons terrosos do cenário.
    const leftJitter = [1, 0, 1, 0, 2, 0, 1, 0];
    const rightJitter = [0, 1, 0, 1, 0, 2, 0, 1];
    let plankIndex = 0;
    for (let y = top; y < bottom; y += BRIDGE_PLANK_HEIGHT) {
      const plankHeight = Math.min(BRIDGE_PLANK_HEIGHT - 1, bottom - y);
      const left = leftJitter[plankIndex % leftJitter.length];
      const right = rightJitter[plankIndex % rightJitter.length];
      const plankX = x + left;
      const plankWidth = width - left - right;

      ctx.fillStyle = BRIDGE_PLANK_COLORS[plankIndex % BRIDGE_PLANK_COLORS.length];
      ctx.fillRect(plankX, y, plankWidth, plankHeight);

      ctx.fillStyle = 'rgba(219, 188, 126, 0.10)';
      ctx.fillRect(plankX + 2, y, Math.max(4, plankWidth - 5), 1);
      ctx.fillStyle = 'rgba(51, 39, 27, 0.62)';
      ctx.fillRect(plankX, y + plankHeight, plankWidth, 1);

      const crackX = plankX + 6 + ((plankIndex * 9) % Math.max(11, plankWidth - 15));
      const crackWidth = 2 + (plankIndex % 4);
      ctx.fillStyle = 'rgba(55, 42, 29, 0.76)';
      ctx.fillRect(crackX, y + 2, crackWidth, 1);
      if (plankIndex % 4 === 2 && y + 3 < bottom) {
        ctx.fillRect(crackX + 1, y + 3, 1, 1);
      }

      // Musgo e sujeira aparecem sobretudo nas bordas, como madeira exposta à umidade do rio.
      if (plankIndex % 3 === 0) {
        ctx.fillStyle = BRIDGE_MOSS;
        ctx.fillRect(plankX + 1, y + 1, 2 + (plankIndex % 2), 1);
      }
      if (plankIndex % 4 === 1) {
        ctx.fillStyle = BRIDGE_MOSS_DARK;
        ctx.fillRect(plankX + plankWidth - 4, y + 2, 3, 1);
      }

      ctx.fillStyle = 'rgba(42, 38, 31, 0.86)';
      ctx.fillRect(x + 5, y + 2, 1, 1);
      ctx.fillRect(x + width - 6, y + 2, 1, 1);

      plankIndex += 1;
    }

    // Longarinas escuras, parcialmente tomadas por musgo, unem visualmente ponte e margem.
    ctx.fillStyle = '#514732';
    ctx.fillRect(x + 1, top, BRIDGE_SIDE_BEAM_WIDTH, h);
    ctx.fillRect(x + width - 3, top, BRIDGE_SIDE_BEAM_WIDTH, h);

    ctx.fillStyle = BRIDGE_MOSS_DARK;
    for (let y = top + 7; y < bottom - 5; y += 13) {
      ctx.fillRect(x + 1, y, 2, 3);
      if ((y - top) % 26 === 7) ctx.fillRect(x + width - 3, y + 4, 2, 2);
    }

    // Terra trazida pelo tráfego suja as primeiras tábuas e elimina o corte madeira/solo.
    ctx.fillStyle = 'rgba(90, 78, 51, 0.34)';
    ctx.fillRect(x + 3, top, width - 6, 7);
    ctx.fillRect(x + 3, bottom - 7, width - 6, 7);

    // Travessas de cabeceira mais discretas e envelhecidas.
    ctx.fillStyle = '#57452f';
    ctx.fillRect(x, top + 4, width, 2);
    ctx.fillRect(x, bottom - 6, width, 2);

    ctx.restore();
  }

  drawBridgeAnchors(ctx, x, top, bottom, width) {
    const { palette } = this.config;

    // Cabeceiras irregulares em camadas, acompanhando o caminho de terra em vez de formar retângulos retos.
    ctx.fillStyle = palette.dirtDark;
    ctx.fillRect(x + 3, top - 8, width - 6, 2);
    ctx.fillRect(x, top - 6, width, 3);
    ctx.fillRect(x - 3, top - 3, width + 6, 3);
    ctx.fillRect(x - 3, bottom, width + 6, 3);
    ctx.fillRect(x, bottom + 3, width, 3);
    ctx.fillRect(x + 4, bottom + 6, width - 8, 2);

    ctx.fillStyle = palette.dirt;
    ctx.fillRect(x + 5, top - 7, width - 10, 2);
    ctx.fillRect(x + 2, top - 5, width - 4, 2);
    ctx.fillRect(x + 2, bottom + 1, width - 4, 2);
    ctx.fillRect(x + 5, bottom + 4, width - 10, 2);

    // Grama invade as laterais da cabeceira, igual à transição das margens do rio.
    ctx.fillStyle = palette.grassDark;
    ctx.fillRect(x - 5, top - 4, 4, 2);
    ctx.fillRect(x + width + 1, top - 5, 5, 2);
    ctx.fillRect(x - 5, bottom + 2, 5, 2);
    ctx.fillRect(x + width + 1, bottom + 1, 4, 2);
    ctx.fillRect(x + 3, top - 9, 3, 2);
    ctx.fillRect(x + width - 7, bottom + 7, 4, 2);

    ctx.fillStyle = palette.grassLight;
    ctx.fillRect(x - 2, top - 6, 2, 2);
    ctx.fillRect(x + width, bottom + 4, 2, 2);

    // Pedras curtas nas cabeceiras conectam a ponte à margem rochosa sem cercá-la inteira.
    ctx.fillStyle = BRIDGE_STONE_DARK;
    ctx.fillRect(x - 4, top - 1, 4, 3);
    ctx.fillRect(x + width, top - 2, 4, 3);
    ctx.fillRect(x - 4, bottom - 2, 4, 3);
    ctx.fillRect(x + width, bottom - 1, 4, 3);

    ctx.fillStyle = BRIDGE_STONE;
    ctx.fillRect(x - 3, top - 2, 2, 1);
    ctx.fillRect(x + width + 1, top - 3, 2, 1);
    ctx.fillRect(x - 3, bottom - 3, 2, 1);
    ctx.fillRect(x + width + 1, bottom - 2, 2, 1);

    // Estacas menores e escurecidas, visualmente enterradas entre terra e pedras.
    ctx.fillStyle = '#493b29';
    ctx.fillRect(x - 2, top - 1, 2, BRIDGE_ANCHOR_DEPTH);
    ctx.fillRect(x + width, top - 1, 2, BRIDGE_ANCHOR_DEPTH);
    ctx.fillRect(x - 2, bottom - 6, 2, BRIDGE_ANCHOR_DEPTH);
    ctx.fillRect(x + width, bottom - 6, 2, BRIDGE_ANCHOR_DEPTH);

    ctx.fillStyle = BRIDGE_MOSS_DARK;
    ctx.fillRect(x - 2, top, 2, 2);
    ctx.fillRect(x + width, bottom - 1, 2, 2);
  }

  drawArenaEdges(ctx) {
    const { width, battlefield } = this.config;
    ctx.fillStyle = 'rgba(40, 45, 29, 0.38)';
    ctx.fillRect(0, battlefield.top, 5, battlefield.bottom - battlefield.top);
    ctx.fillRect(width - 5, battlefield.top, 5, battlefield.bottom - battlefield.top);
    ctx.fillRect(0, battlefield.bottom - 5, width, 5);
  }
}

export const BRIDGE_VISUAL_META = Object.freeze({
  landOverlap: BRIDGE_LAND_OVERLAP,
  plankHeight: BRIDGE_PLANK_HEIGHT,
  sideBeamWidth: BRIDGE_SIDE_BEAM_WIDTH,
  anchorDepth: BRIDGE_ANCHOR_DEPTH,
  plankVariants: BRIDGE_PLANK_COLORS.length,
  agedWood: true,
  groundedAnchors: true,
  scenarioBlend: true,
  mossDetails: true,
  irregularPlanks: true,
  terrainShoulders: true,
});
