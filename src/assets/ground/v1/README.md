# Chão 16-bit v1

Estrutura modular do solo da arena.

- `base/tiles.js`: 4 tiles de grama 8x8 e paleta principal.
- `transition/tiles.js`: transição discreta entre grama/terra e a margem do rio.
- `details/layout.js`: poucos tufos e pontos decorativos, concentrados longe do centro.

Princípios visuais:

1. baixo contraste no centro da arena;
2. nenhum detalhe deve parecer tropa, drop ou obstáculo;
3. transição do rio usa terra/oliva compatível com as margens 16-bit;
4. o renderer usa nearest-neighbor e pré-renderiza o chão em cache para não pesar no celular.
