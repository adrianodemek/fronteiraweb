import { GroundRenderer } from './GroundRenderer.js?v=0.6.16';
import { RiverRenderer } from './RiverRenderer.js?v=0.6.16';

const BRIDGE_LAND_OVERLAP = 20;
const BRIDGE_PLANK_HEIGHT = 6;
const BRIDGE_SIDE_BEAM_WIDTH = 2;
const BRIDGE_ANCHOR_DEPTH = 7;
const BRIDGE_PLANK_COLORS = Object.freeze([
  '#9a7548',
  '#a27a49',
  '#8d6840',
  '#a68150',
  '#927047',
  '#9f794b',
]);

export class Battlefield {
  constructor(config) {
    this.config = config;
    this.groundRenderer = new GroundRenderer(config);
    this.riverRenderer = new RiverRenderer(config);
  }

  draw(ctx, time) {
    const {
      river,
      bridges,
      bridgeWidth,
    } = this.config;

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
    const { palette } = this.config;
    const x = Math.round(centerX - width / 2);
    const h = bottom - top;

    ctx.save();
    ctx.imageSmoothingEnabled = false;

    this.drawBridgeAnchors(ctx, x, top, bottom, width);

    // Estrutura inferior: madeira mais escura aparece nas laterais sem engrossar a ponte.
    ctx.fillStyle = '#4f3927';
    ctx.fillRect(x - 2, top + 1, width + 4, h - 2);

    // Tábuas individuais com variação de madeira velha.
    let plankIndex = 0;
    for (let y = top; y < bottom; y += BRIDGE_PLANK_HEIGHT) {
      const plankHeight = Math.min(BRIDGE_PLANK_HEIGHT - 1, bottom - y);
      ctx.fillStyle = BRIDGE_PLANK_COLORS[plankIndex % BRIDGE_PLANK_COLORS.length];
      ctx.fillRect(x, y, width, plankHeight);

      // Luz irregular e junta escurecida reforçam o aspecto 16-bit.
      ctx.fillStyle = 'rgba(226, 194, 132, 0.12)';
      ctx.fillRect(x + 2, y, width - 4, 1);
      ctx.fillStyle = 'rgba(58, 40, 27, 0.58)';
      ctx.fillRect(x, y + plankHeight, width, 1);

      // Rachaduras curtas e determinísticas para não parecer textura repetida limpa.
      const crackX = x + 7 + ((plankIndex * 11) % Math.max(12, width - 18));
      const crackWidth = 3 + (plankIndex % 3);
      ctx.fillStyle = 'rgba(61, 42, 28, 0.72)';
      ctx.fillRect(crackX, y + 2, crackWidth, 1);
      if (plankIndex % 3 === 1 && y + 4 < bottom) {
        ctx.fillRect(crackX + crackWidth - 1, y + 3, 1, 2);
      }

      // Pregos discretos próximos às longarinas laterais.
      ctx.fillStyle = 'rgba(43, 37, 31, 0.82)';
      ctx.fillRect(x + 5, y + 2, 1, 1);
      ctx.fillRect(x + width - 6, y + 2, 1, 1);

      plankIndex += 1;
    }

    // Longarinas estreitas nas laterais, como ponte de campanha simples.
    ctx.fillStyle = '#5b422b';
    ctx.fillRect(x + 1, top, BRIDGE_SIDE_BEAM_WIDTH, h);
    ctx.fillRect(x + width - 3, top, BRIDGE_SIDE_BEAM_WIDTH, h);

    // Travessas nas duas cabeceiras deixam a madeira visualmente presa ao terreno.
    ctx.fillStyle = '#60462e';
    ctx.fillRect(x - 1, top + 3, width + 2, 2);
    ctx.fillRect(x - 1, bottom - 5, width + 2, 2);

    // Pequeno desgaste claro nas bordas das cabeceiras.
    ctx.fillStyle = 'rgba(199, 161, 101, 0.22)';
    ctx.fillRect(x + 4, top + 1, width - 8, 1);
    ctx.fillRect(x + 4, bottom - 2, width - 8, 1);

    ctx.restore();
  }

  drawBridgeAnchors(ctx, x, top, bottom, width) {
    const { palette } = this.config;

    // Solo batido nas entradas: a ponte parece assentada no terreno em vez de flutuar sobre ele.
    ctx.fillStyle = palette.dirtDark;
    ctx.fillRect(x - 5, top - 5, width + 10, 5);
    ctx.fillRect(x - 5, bottom, width + 10, 5);

    ctx.fillStyle = palette.dirt;
    ctx.fillRect(x - 3, top - 4, width + 6, 3);
    ctx.fillRect(x - 3, bottom + 1, width + 6, 3);

    // Estacas compactas nos quatro cantos, parcialmente enterradas.
    ctx.fillStyle = '#4a3524';
    ctx.fillRect(x - 3, top - 2, 3, BRIDGE_ANCHOR_DEPTH);
    ctx.fillRect(x + width, top - 2, 3, BRIDGE_ANCHOR_DEPTH);
    ctx.fillRect(x - 3, bottom - 5, 3, BRIDGE_ANCHOR_DEPTH);
    ctx.fillRect(x + width, bottom - 5, 3, BRIDGE_ANCHOR_DEPTH);

    ctx.fillStyle = '#80603d';
    ctx.fillRect(x - 3, top - 2, 3, 2);
    ctx.fillRect(x + width, top - 2, 3, 2);
    ctx.fillRect(x - 3, bottom, 3, 2);
    ctx.fillRect(x + width, bottom, 3, 2);
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
});
