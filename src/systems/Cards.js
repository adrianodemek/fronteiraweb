export class CardSystem {
  constructor(config) {
    this.config = config;
    this.reset();
  }

  reset() {
    const catalog = new Map(this.config.cards.map((card) => [card.id, { ...card }]));
    const deckIds = this.config.battleDeck?.length
      ? this.config.battleDeck
      : this.config.cards.map((card) => card.id);

    const cards = deckIds
      .map((id) => catalog.get(id))
      .filter(Boolean);

    if (cards.length < 4) {
      throw new Error('O deck de batalha precisa ter pelo menos quatro cartas válidas.');
    }

    this.deck = cards.map((card) => ({ ...card }));
    this.hand = this.deck.slice(0, 4);
    this.queue = this.deck.slice(4);
    this.selectedIndex = null;
  }

  get selectedCard() {
    if (this.selectedIndex === null) return null;
    return this.hand[this.selectedIndex] ?? null;
  }

  get nextCard() {
    return this.queue[0] ?? null;
  }

  select(index) {
    if (index < 0 || index >= this.hand.length) return false;
    this.selectedIndex = this.selectedIndex === index ? null : index;
    return true;
  }

  clearSelection() {
    this.selectedIndex = null;
  }

  playSelected() {
    if (this.selectedIndex === null) return null;

    const index = this.selectedIndex;
    const played = this.hand[index];
    const next = this.queue.shift();

    if (next) this.hand[index] = next;
    else this.hand.splice(index, 1);

    this.queue.push(played);
    this.selectedIndex = null;
    return played;
  }

  getCardRect(index) {
    const { hud } = this.config;
    return {
      x: hud.handStartX + index * (hud.cardWidth + hud.cardGap),
      y: hud.cardTop,
      width: hud.cardWidth,
      height: hud.cardHeight,
    };
  }

  getCardIndexAt(x, y) {
    for (let index = 0; index < this.hand.length; index += 1) {
      const rect = this.getCardRect(index);
      if (
        x >= rect.x
        && x <= rect.x + rect.width
        && y >= rect.y
        && y <= rect.y + rect.height
      ) {
        return index;
      }
    }

    return -1;
  }
}
