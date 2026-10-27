import assert from 'node:assert/strict';
import { GAME_CONFIG } from '../src/config.js';

const cards = GAME_CONFIG.cards;

assert.equal(cards.length, 30, 'O roster inicial deve ter exatamente 30 cartas.');
assert.equal(new Set(cards.map((card) => card.id)).size, 30, 'Todos os IDs de carta devem ser únicos.');
assert.equal(new Set(cards.map((card) => card.name)).size, 30, 'Todos os nomes de carta devem ser únicos.');

const rarityCounts = cards.reduce((counts, card) => {
  counts[card.rarity] = (counts[card.rarity] ?? 0) + 1;
  return counts;
}, {});

assert.deepEqual(
  rarityCounts,
  { common: 10, rare: 8, epic: 7, legendary: 5 },
  'A distribuição deve ser 10 Comuns, 8 Raras, 7 Épicas e 5 Lendárias.',
);

for (const card of cards) {
  assert.ok(card.short.length <= 8, `${card.name}: nome curto deve ter no máximo 8 caracteres.`);
  assert.ok(card.cost >= 2 && card.cost <= 8, `${card.name}: custo deve ficar entre 2 e 8 Suprimentos.`);
  assert.ok(GAME_CONFIG.rarities[card.rarity], `${card.name}: raridade inválida.`);
  assert.ok(card.fullName?.length > 0, `${card.name}: deve manter o nome histórico completo.`);
  assert.ok(card.category?.length > 0, `${card.name}: deve possuir categoria de gameplay.`);
}

assert.equal(GAME_CONFIG.battleDeck.length, 8, 'O deck de batalha deve ter exatamente 8 cartas.');
assert.equal(new Set(GAME_CONFIG.battleDeck).size, 8, 'O deck de batalha não pode repetir cartas.');

const catalog = new Map(cards.map((card) => [card.id, card]));
const battleCards = GAME_CONFIG.battleDeck.map((id) => catalog.get(id));

for (const card of battleCards) {
  assert.ok(card, 'Toda carta do deck deve existir no catálogo de 30.');
  assert.equal(card.implemented, true, `${card.name}: carta do deck inicial precisa estar implementada.`);
  assert.ok(card.unitType, `${card.name}: carta jogável inicial precisa apontar para um tipo de unidade.`);
}

const averageCost = battleCards.reduce((sum, card) => sum + card.cost, 0) / battleCards.length;
assert.ok(averageCost >= 3 && averageCost <= 4.5, `Custo médio inicial fora da faixa saudável: ${averageCost}`);

assert.equal(catalog.get('tiger').name, 'Tiger');
assert.equal(catalog.get('tiger2').name, 'Tiger II');
assert.equal(catalog.get('jagdtiger').name, 'Jagdtiger');
assert.equal(catalog.get('b17').name, 'B-17');
assert.equal(catalog.get('hummel').name, 'Hummel');

console.log('roster.test.js: PASS');
