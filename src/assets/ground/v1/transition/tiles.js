export const RIVER_EDGE_PALETTE = Object.freeze([
  '#73894f',
  '#6a8048',
  '#7f8354',
  '#777a4d',
  '#8b8156',
]);

// Faixas 8x4 usadas somente fora da água. A terra aparece de forma quebrada
// e sutil para casar com as margens do rio sem formar uma linha artificial.
export const RIVER_EDGE_TILES = Object.freeze([
  [
    '00100010',
    '01022000',
    '00233420',
    '02344332',
  ],
  [
    '10000001',
    '00220010',
    '23342000',
    '34433220',
  ],
  [
    '00010000',
    '22000100',
    '03342230',
    '23344332',
  ],
  [
    '01000010',
    '00220200',
    '22334002',
    '34432330',
  ],
]);
