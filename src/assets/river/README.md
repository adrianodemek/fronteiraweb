# Sprites 16-bit do rio

Esta pasta contém a arte modular do rio usada pelo `RiverRenderer`.

- `water/sheet.js`: 6 frames animados de água, 64×24 por frame.
- `banks/top/sheet.js`: 6 variações da margem superior.
- `banks/bottom/sheet.js`: 6 variações da margem inferior.
- `rocks/sheet.js`: 4 sprites independentes de pedras.
- `rocks/layout.js`: posições, lado e escala das pedras fixas no mapa.

As imagens são desenhadas com `imageSmoothingEnabled = false`, preservando o visual 16-bit. Para alterar uma categoria, basta substituir a folha correspondente mantendo as dimensões exportadas pelo arquivo.
