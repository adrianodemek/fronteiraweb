# Fronteira Web

Protótipo mobile-first de estratégia em tempo real com estética 16-bit e temática inspirada na Segunda Guerra Mundial.

## V0.1 — Campo de batalha

A primeira versão foca somente no núcleo da batalha:

- campo vertical 9:16;
- Quartel-General e duas bases para cada lado;
- córrego horizontal dividindo o mapa;
- duas pontes como rotas terrestres obrigatórias;
- batalha de 3 minutos;
- estruturas com HP e ataque automático;
- infantaria de teste com HP, dano, alcance, aggro e movimentação;
- mobilização de infantaria por toque no lado do jogador;
- inimigo de teste mobiliza unidades automaticamente nas duas lanes;
- vitória imediata ao destruir o QG;
- desempate provisório pelo HP total restante das estruturas.

## Estrutura

```text
index.html
css/
  main.css
src/
  main.js
  config.js
  core/
    Game.js
  entities/
    Structure.js
    Unit.js
  utils/
    math.js
  world/
    Battlefield.js
assets/
  (sprites, tiles, áudio e efeitos entrarão nas próximas versões)
```

Os valores de balanceamento e dimensões principais ficam centralizados em `src/config.js`.

## Teste

Deploy conectado ao Cloudflare Pages:

https://fronteiraweb.pages.dev
