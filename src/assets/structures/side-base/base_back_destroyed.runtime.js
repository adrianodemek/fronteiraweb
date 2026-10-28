import { SIDE_BASE_BACK_DESTROYED_SPRITE as SOURCE } from './base_back_destroyed.sprite.js?v=0.6.30';

// O payload RLE foi preservado; a paleta perdeu 4 dígitos hexadecimais durante
// a primeira gravação textual no GitHub. Reconstituímos exatamente o trecho
// original validado localmente antes de expor o sprite ao runtime.
const palette = `${SOURCE.palette.slice(0, 125)}d382${SOURCE.palette.slice(125)}`;

export const SIDE_BASE_BACK_DESTROYED_SPRITE = Object.freeze({
  ...SOURCE,
  palette,
});
