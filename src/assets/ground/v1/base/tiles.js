export const GROUND_TILE_SIZE = 8;

export const GROUND_PALETTE = Object.freeze([
  '#73894f',
  '#778d52',
  '#6e844a',
  '#7c9258',
  '#687d46',
]);

// Tiles 8x8 de baixo contraste. Os números apontam para GROUND_PALETTE.
// Mantemos detalhes pequenos para que tropas, drops e projéteis continuem
// sendo os elementos de maior contraste no campo.
export const GROUND_BASE_TILES = Object.freeze([
  [
    '00100010',
    '01000000',
    '00003000',
    '00000010',
    '20000000',
    '00010000',
    '00000000',
    '00300000',
  ],
  [
    '00010000',
    '20000000',
    '00000030',
    '00100000',
    '00000000',
    '00001000',
    '30000000',
    '00000020',
  ],
  [
    '00000020',
    '00100000',
    '00000000',
    '30000010',
    '00000000',
    '00020000',
    '01000000',
    '00000030',
  ],
  [
    '10000000',
    '00000020',
    '00003000',
    '00000000',
    '00200000',
    '00000010',
    '00000000',
    '00030000',
  ],
]);
