# Ground assets (16-bit)

Assets ativos do solo da arena:

- `grass/grass_tiles.png`: 18 variações de gramado/terra, 32×32 por tile.
- `paths/path_tiles.png`: 12 variações de estrada/trilha, 24×48 por tile.
- `details/detail_tiles.png`: 17 patches de vegetação, flores e pedras, 36×36 por tile.
- `details/layout.js`: posições fixas dos detalhes decorativos no mapa.

Todos são desenhados com `imageSmoothingEnabled = false` pelo `GroundRenderer`.
Os detalhes são apenas visuais e não criam colisão. Para trocar a arte depois, substitua o PNG correspondente mantendo a grade/tamanho descritos no `manifest.js` da pasta.
