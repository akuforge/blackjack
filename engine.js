/* Blackjack Navigator — engine. Pure logic, no DOM: the app and tools/test.js both load it.
   Ported from the Swift BlackjackCore package of the iOS app, with its known engine bugs fixed. */
(function (root) {
'use strict';

// ---------- cards ----------
// A card is {r: 1..13 (A..K), s: 0..3 (clubs, diamonds, hearts, spades)}.
const RN = ['', 'A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const SUIT = ['♣', '♦', '♥', '♠'];
const val = r => r >= 10 ? 10 : r;
const isTen = r => r >= 10;
const red = s => s === 1 || s === 2;
const short = r => r === 1 ? 'A' : r >= 10 ? 'T' : String(r);      // chart label (any ten-value = T)
const upLabel = r => r === 1 ? 'A' : r >= 10 ? '10' : String(r);
function total(cards) {
  let t = 0, aces = 0;
  for (const c of cards) { t += val(c.r); if (c.r === 1) aces++; }
  if (aces && t + 10 <= 21) return { total: t + 10, soft: true };
  return { total: t, soft: false };
}
const pairable = cs => cs.length === 2 && (cs[0].r === cs[1].r || (isTen(cs[0].r) && isTen(cs[1].r)));
const natural = cs => cs.length === 2 && total(cs).total === 21;

// ---------- rules ----------
// Every preset peeks for blackjack (US rules), offers insurance, and deals one card to split aces.
const PRESETS = [
  { id: 'six-deck-h17', name: 'Casino Floor', decks: 6, h17: true, bj: 1.5, das: true, rsa: false, maxSplits: 3, surrender: false, doubleOn: 'any', pen: .75, min: 15, max: 300, edge: .0062,
    blurb: 'The most common table in casinos. Fair rules, full blackjack payout.' },
  { id: 'six-deck-s17', name: 'The Good Game', decks: 6, h17: false, bj: 1.5, das: true, rsa: false, maxSplits: 3, surrender: false, doubleOn: 'any', pen: .75, min: 15, max: 300, edge: .0041,
    blurb: 'The dealer stands on soft 17. A solid table worth looking for.' },
  { id: 'eight-deck-s17', name: 'Atlantic City', decks: 8, h17: false, bj: 1.5, das: true, rsa: false, maxSplits: 3, surrender: true, doubleOn: 'any', pen: .75, min: 15, max: 300, edge: .0036,
    blurb: 'Player-friendly rules across the board, including late surrender.' },
  { id: 'six-deck-s17-premium', name: 'Strip Premium', decks: 6, h17: false, bj: 1.5, das: true, rsa: true, maxSplits: 3, surrender: true, doubleOn: 'any', pen: .75, min: 25, max: 500, edge: .0028,
    blurb: 'The best odds you will find. Every player-friendly rule in one table.' },
  { id: 'double-deck-h17', name: 'Double Deck', decks: 2, h17: true, bj: 1.5, das: false, rsa: false, maxSplits: 3, surrender: false, doubleOn: 'any', pen: .60, min: 15, max: 200, edge: .0053,
    blurb: 'Fewer cards in the shoe, tighter rules. A niche pick.' },
  { id: 'single-deck-h17-short-pay', name: 'Single Deck', decks: 1, h17: true, bj: 1.2, das: false, rsa: false, maxSplits: 2, surrender: false, doubleOn: '10-11', pen: .65, min: 10, max: 200, edge: .0184,
    blurb: 'One deck, but the 6:5 payout more than wipes out the gain.' },
  { id: 'six-deck-h17-short-pay', name: 'The Tourist Trap', decks: 6, h17: true, bj: 1.2, das: true, rsa: false, maxSplits: 3, surrender: false, doubleOn: 'any', pen: .75, min: 10, max: 200, edge: .0198,
    blurb: 'The table most beginners sit at. The 6:5 payout costs you about 1.4%.' },
];
// Wizard of Odds calculator figures for the exact preset rules ("optimal results" column), as
// audited in the iOS project (C387, 2026-05-31). Custom tables use calcEdge() + a deck correction.
function makeRules(o) {
  return Object.assign({ id: 'custom', name: 'Custom Table', decks: 6, h17: true, bj: 1.5, das: true, rsa: false, maxSplits: 3,
    surrender: false, doubleOn: 'any', pen: .75, min: 10, max: 500 }, o);
}
const canDoubleTotal = (rules, t) => rules.doubleOn === 'any' || (rules.doubleOn === '9-11' ? t >= 9 && t <= 11 : t >= 10 && t <= 11);
function rulesLine(r) {
  const p = [r.decks === 1 ? '1 deck' : r.decks + ' decks', r.h17 ? 'H17' : 'S17', 'BJ ' + (r.bj === 1.5 ? '3:2' : r.bj === 1.2 ? '6:5' : '1:1')];
  p.push(r.das ? 'DAS' : 'no DAS');
  if (r.doubleOn !== 'any') p.push('double ' + r.doubleOn);
  if (r.rsa) p.push('RSA');
  if (r.surrender) p.push('surrender');
  return p.join(' · ');
}

// ---------- rng + shoe ----------
function mulberry(seed) { let a = seed >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function cryptoRng() {
  const c = (typeof crypto !== 'undefined' && crypto.getRandomValues) ? crypto : null;
  if (!c) return Math.random;
  const buf = new Uint32Array(256); let i = 256;
  return () => { if (i >= 256) { c.getRandomValues(buf); i = 0; } return buf[i++] / 4294967296; };
}
class Shoe {
  constructor(decks, pen, rng) {
    this.decks = decks; this.pen = pen; this.rng = rng || cryptoRng();
    this.cards = []; for (let d = 0; d < decks; d++) for (let s = 0; s < 4; s++) for (let r = 1; r <= 13; r++) this.cards.push({ r, s });
    this.shuffle();
  }
  shuffle() {
    const a = this.cards;
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(this.rng() * (i + 1)); const t = a[i]; a[i] = a[j]; a[j] = t; }
    this.i = 0; this.burned = false; this.shuffles = (this.shuffles || 0) + 1;
  }
  draw() { if (this.i >= this.cards.length) this.shuffle(); return this.cards[this.i++]; }
  burn() { this.draw(); this.burned = true; }
  get needsShuffle() { return this.i / this.cards.length >= this.pen; }
  get left() { return this.cards.length - this.i; }
  toJSON() { return { d: this.decks, p: this.pen, i: this.i, b: this.burned, c: this.cards.map(c => c.r * 4 + c.s) }; }
  static from(o, rng) {
    const sh = Object.create(Shoe.prototype);
    sh.decks = o.d; sh.pen = o.p; sh.i = o.i; sh.burned = o.b; sh.rng = rng || cryptoRng(); sh.shuffles = 1;
    sh.cards = o.c.map(n => ({ r: n >> 2, s: n & 3 }));
    return sh;
  }
}
const hiLo = r => (r >= 2 && r <= 6) ? 1 : (r === 1 || r >= 10) ? -1 : 0;

// ---------- basic strategy ----------
// Six WoO tables (American peek, double any two). Rows: hard 5-21, soft 13-21, pairs 2-2..A-A.
// Columns: dealer 2..9, ten, ace. Q* = depends on DAS, R* = depends on surrender. See README.
const TABLES={
  s17Multi:[
   'H H H H H H H H H H',
   'H H H H H H H H H H',
   'H H H H H H H H H H',
   'H H H H H H H H H H',
   'H Dh Dh Dh Dh H H H H H',
   'Dh Dh Dh Dh Dh Dh Dh Dh H H',
   'Dh Dh Dh Dh Dh Dh Dh Dh Dh H',
   'H H S S S H H H H H',
   'S S S S S H H H H H',
   'S S S S S H H H H H',
   'S S S S S H H H Rh H',
   'S S S S S H H Rh Rh Rh',
   'S S S S S S S S S S',
   'S S S S S S S S S S',
   'S S S S S S S S S S',
   'S S S S S S S S S S',
   'S S S S S S S S S S',
   'H H H Dh Dh H H H H H',
   'H H H Dh Dh H H H H H',
   'H H Dh Dh Dh H H H H H',
   'H H Dh Dh Dh H H H H H',
   'H Dh Dh Dh Dh H H H H H',
   'S Ds Ds Ds Ds S S H H H',
   'S S S S S S S S S S',
   'S S S S S S S S S S',
   'S S S S S S S S S S',
   'Qh Qh P P P P H H H H',
   'Qh Qh P P P P H H H H',
   'H H H Qh Qh H H H H H',
   'Dh Dh Dh Dh Dh Dh Dh Dh H H',
   'Qh P P P P H H H H H',
   'P P P P P P H H H H',
   'P P P P P P P P P P',
   'P P P P P S P P S S',
   'S S S S S S S S S S',
   'P P P P P P P P P P'],
  h17Multi:[
   'H H H H H H H H H H',
   'H H H H H H H H H H',
   'H H H H H H H H H H',
   'H H H H H H H H H H',
   'H Dh Dh Dh Dh H H H H H',
   'Dh Dh Dh Dh Dh Dh Dh Dh H H',
   'Dh Dh Dh Dh Dh Dh Dh Dh Dh Dh',
   'H H S S S H H H H H',
   'S S S S S H H H H H',
   'S S S S S H H H H H',
   'S S S S S H H H Rh Rh',
   'S S S S S H H Rh Rh Rh',
   'S S S S S S S S S Rs',
   'S S S S S S S S S S',
   'S S S S S S S S S S',
   'S S S S S S S S S S',
   'S S S S S S S S S S',
   'H H H Dh Dh H H H H H',
   'H H H Dh Dh H H H H H',
   'H H Dh Dh Dh H H H H H',
   'H H Dh Dh Dh H H H H H',
   'H Dh Dh Dh Dh H H H H H',
   'Ds Ds Ds Ds Ds S S H H H',
   'S S S S Ds S S S S S',
   'S S S S S S S S S S',
   'S S S S S S S S S S',
   'Qh Qh P P P P H H H H',
   'Qh Qh P P P P H H H H',
   'H H H Qh Qh H H H H H',
   'Dh Dh Dh Dh Dh Dh Dh Dh H H',
   'Qh P P P P H H H H H',
   'P P P P P P H H H H',
   'P P P P P P P P P Rp',
   'P P P P P S P P S S',
   'S S S S S S S S S S',
   'P P P P P P P P P P'],
  s17Double:[
   'H H H H H H H H H H',
   'H H H H H H H H H H',
   'H H H H H H H H H H',
   'H H H H H H H H H H',
   'Dh Dh Dh Dh Dh H H H H H',
   'Dh Dh Dh Dh Dh Dh Dh Dh H H',
   'Dh Dh Dh Dh Dh Dh Dh Dh Dh Dh',
   'H H S S S H H H H H',
   'S S S S S H H H H H',
   'S S S S S H H H H H',
   'S S S S S H H H Rh H',
   'S S S S S H H H Rh Rh',
   'S S S S S S S S S S',
   'S S S S S S S S S S',
   'S S S S S S S S S S',
   'S S S S S S S S S S',
   'S S S S S S S S S S',
   'H H H Dh Dh H H H H H',
   'H H H Dh Dh H H H H H',
   'H H Dh Dh Dh H H H H H',
   'H H Dh Dh Dh H H H H H',
   'H Dh Dh Dh Dh H H H H H',
   'S Ds Ds Ds Ds S S H H H',
   'S S S S S S S S S S',
   'S S S S S S S S S S',
   'S S S S S S S S S S',
   'Qh Qh P P P P H H H H',
   'Qh Qh P P P P H H H H',
   'H H H Qh Qh H H H H H',
   'Dh Dh Dh Dh Dh Dh Dh Dh H H',
   'P P P P P Qh H H H H',
   'P P P P P P Qh H H H',
   'P P P P P P P P P P',
   'P P P P P S P P S S',
   'S S S S S S S S S S',
   'P P P P P P P P P P'],
  h17Double:[
   'H H H H H H H H H H',
   'H H H H H H H H H H',
   'H H H H H H H H H H',
   'H H H H H H H H H H',
   'Dh Dh Dh Dh Dh H H H H H',
   'Dh Dh Dh Dh Dh Dh Dh Dh H H',
   'Dh Dh Dh Dh Dh Dh Dh Dh Dh Dh',
   'H H S S S H H H H H',
   'S S S S S H H H H H',
   'S S S S S H H H H H',
   'S S S S S H H H Rh Rh',
   'S S S S S H H H Rh Rh',
   'S S S S S S S S S Rs',
   'S S S S S S S S S S',
   'S S S S S S S S S S',
   'S S S S S S S S S S',
   'S S S S S S S S S S',
   'H H H Dh Dh H H H H H',
   'H H Dh Dh Dh H H H H H',
   'H H Dh Dh Dh H H H H H',
   'H H Dh Dh Dh H H H H H',
   'H Dh Dh Dh Dh H H H H H',
   'Ds Ds Ds Ds Ds S S H H H',
   'S S S S Ds S S S S S',
   'S S S S S S S S S S',
   'S S S S S S S S S S',
   'Qh Qh P P P P H H H H',
   'Qh Qh P P P P H H H H',
   'H H H Qh Qh H H H H H',
   'Dh Dh Dh Dh Dh Dh Dh Dh H H',
   'P P P P P Qh H H H H',
   'P P P P P P Qh H H H',
   'P P P P P P P P P Rp',
   'P P P P P S P P S S',
   'S S S S S S S S S S',
   'P P P P P P P P P P'],
  h17Single:[
   'H H H H H H H H H H',
   'H H H H H H H H H H',
   'H H H H H H H H H H',
   'H H H Dh Dh H H H H H',
   'Dh Dh Dh Dh Dh H H H H H',
   'Dh Dh Dh Dh Dh Dh Dh Dh H H',
   'Dh Dh Dh Dh Dh Dh Dh Dh Dh Dh',
   'H H S S S H H H H H',
   'S S S S S H H H H H',
   'S S S S S H H H H H',
   'S S S S S H H H Rh Rh',
   'S S S S S H H H Rh Rh',
   'S S S S S S S S S Rs',
   'S S S S S S S S S S',
   'S S S S S S S S S S',
   'S S S S S S S S S S',
   'S S S S S S S S S S',
   'H H Dh Dh Dh H H H H H',
   'H H Dh Dh Dh H H H H H',
   'H H Dh Dh Dh H H H H H',
   'H H Dh Dh Dh H H H H H',
   'Dh Dh Dh Dh Dh H H H H H',
   'S Ds Ds Ds Ds S S H H H',
   'S S S S Ds S S S S S',
   'S S S S S S S S S S',
   'S S S S S S S S S S',
   'Qh P P P P P H H H H',
   'Qh Qh P P P P Qh H H H',
   'H H Qh Qd Qd H H H H H',
   'Dh Dh Dh Dh Dh Dh Dh Dh H H',
   'P P P P P Qh H H H H',
   'P P P P P P Qh H Rs Rh',
   'P P P P P P P P P P',
   'P P P P P S P P S Qs',
   'S S S S S S S S S S',
   'P P P P P P P P P P'],
  s17Single:[
   'H H H H H H H H H H',
   'H H H H H H H H H H',
   'H H H H H H H H H H',
   'H H H Dh Dh H H H H H',
   'Dh Dh Dh Dh Dh H H H H H',
   'Dh Dh Dh Dh Dh Dh Dh Dh H H',
   'Dh Dh Dh Dh Dh Dh Dh Dh Dh Dh',
   'H H S S S H H H H H',
   'S S S S S H H H H H',
   'S S S S S H H H H H',
   'S S S S S H H H Rh H',
   'S S S S S H H H Rh Rh',
   'S S S S S S S S S S',
   'S S S S S S S S S S',
   'S S S S S S S S S S',
   'S S S S S S S S S S',
   'S S S S S S S S S S',
   'H H Dh Dh Dh H H H H H',
   'H H Dh Dh Dh H H H H H',
   'H H Dh Dh Dh H H H H H',
   'H H Dh Dh Dh H H H H H',
   'Dh Dh Dh Dh Dh H H H H H',
   'S Ds Ds Ds Ds S S H H S',
   'S S S S Ds S S S S S',
   'S S S S S S S S S S',
   'S S S S S S S S S S',
   'Qh Qh P P P P H H H H',
   'Qh Qh P P P P Qh H H H',
   'H H Qh Qd Qd H H H H H',
   'Dh Dh Dh Dh Dh Dh Dh Dh H H',
   'P P P P P Qh H H H H',
   'P P P P P P Qh H Rs H',
   'P P P P P P P P P P',
   'P P P P P S P P S S',
   'S S S S S S S S S S',
   'P P P P P P P P P P']
};
const PARSED = {}; for (const k in TABLES) PARSED[k] = TABLES[k].map(row => row.split(' '));
function tableFor(rules) { return PARSED[(rules.h17 ? 'h17' : 's17') + (rules.decks === 1 ? 'Single' : rules.decks === 2 ? 'Double' : 'Multi')]; }
const colFor = up => up === 1 ? 9 : up >= 10 ? 8 : up - 2;
const pairRow = r => r === 1 ? 35 : r >= 10 ? 34 : r + 24;
function chartCode(rules, kind, t, up) {        // kind 'hard'|'soft'|'pair' (t = pair rank for pairs)
  const tb = tableFor(rules), c = colFor(up);
  if (kind === 'pair') return tb[pairRow(t)][c];
  if (kind === 'soft') return t >= 13 && t <= 21 ? tb[t + 4][c] : 'H';
  return t < 5 ? 'H' : t > 21 ? 'S' : tb[t - 5][c];
}
// Resolve a chart code against what this hand can actually do. Returns null when the code says
// split but splitting isn't possible, so the caller falls back to the hand's total.
function resolveCode(code, rules, can) {
  switch (code) {
    case 'H': return 'H';
    case 'S': return 'S';
    case 'Dh': return can.D ? 'D' : 'H';
    case 'Ds': return can.D ? 'D' : 'S';
    case 'P': return can.P ? 'P' : null;
    case 'Qh': return rules.das ? (can.P ? 'P' : null) : 'H';
    case 'Qd': return rules.das ? (can.P ? 'P' : null) : (can.D ? 'D' : 'H');
    case 'Qs': return rules.das ? (can.P ? 'P' : null) : 'S';
    case 'Rh': return can.R ? 'R' : 'H';
    case 'Rs': return can.R ? 'R' : 'S';
    case 'Rp': return can.R ? 'R' : (can.P ? 'P' : null);
  }
  return 'S';
}
// The basic-strategy play for a hand, given the actions legal right now (can = {H,S,D,P,R}).
// Always returns a legal action. Returns {a, kind, key} (key identifies the chart cell).
function recommend(cards, up, rules, can) {
  const { total: t, soft } = total(cards);
  // never trust the caller to have applied the table rules
  can = Object.assign({}, can, { D: can.D && cards.length === 2 && canDoubleTotal(rules, t), R: can.R && rules.surrender && cards.length === 2, P: can.P && pairable(cards) });
  const u = short(up);
  if (t > 21) return { a: 'S', kind: 'hard', key: 'bust' };
  if (!can.H) {                                   // a split ace that may only stand or resplit
    return { a: can.P ? 'P' : 'S', kind: 'pair', key: 'PAv' + u };
  }
  if (pairable(cards)) {
    const code = chartCode(rules, 'pair', cards[0].r, up);
    const a = resolveCode(code, rules, can);
    if (a) return { a, kind: 'pair', key: 'P' + short(cards[0].r) + 'v' + u };
  }
  if (soft && t >= 13) return { a: resolveCode(chartCode(rules, 'soft', t, up), rules, can) || 'H', kind: 'soft', key: 'S' + t + 'v' + u };
  if (soft) return { a: 'H', kind: 'soft', key: 'S12v' + u };   // A-A that can't be split: always hit
  const a = resolveCode(chartCode(rules, 'hard', t, up), rules, can) || 'H';
  return { a, kind: 'hard', key: 'H' + Math.max(t, 5) + 'v' + u };
}

// ---------- expected value ----------
// Deck model: index 0 = ace, 1..8 = 2..9, 9 = any ten-value. Counts start from a full shoe minus
// the cards visible on the table, as in the Swift EVCalculator. The dealer's hole card is
// conditioned on "no dealer blackjack" whenever the player is still deciding (US peek).
const ix = r => r === 1 ? 0 : r >= 10 ? 9 : r - 1;
function addI(t, soft, i) {
  if (i === 0) { if (t + 11 <= 21) { t += 11; soft = true; } else t += 1; } else t += i === 9 ? 10 : i + 1;
  if (t > 21 && soft) { t -= 10; soft = false; }
  return [t, soft];
}
function deckFor(decks, visible) {
  const c = new Array(10).fill(4 * decks); c[9] = 16 * decks;
  for (const card of visible) { const k = ix(card.r); if (c[k] > 0) c[k]--; }
  return c;
}
const sum = a => a.reduce((x, y) => x + y, 0);
// Dealer final-total distribution {17..21, 0 = bust}, drawing WITHOUT replacement from `counts`.
function dealerDist(upR, rules, counts, peek = true) {
  const out = { 0: 0, 17: 0, 18: 0, 19: 0, 20: 0, 21: 0 };
  const c = counts.slice();
  const u = ix(upR);
  const stand = (t, soft) => t > 21 || t > 17 || (t === 17 && !(soft && rules.h17));
  function rec(t, soft, p, n) {
    if (t > 21) { out[0] += p; return; }
    if (stand(t, soft)) { out[t] += p; return; }
    const T = sum(c);
    for (let i = 0; i < 10; i++) {
      if (!c[i]) continue;
      const q = p * c[i] / T; c[i]--;
      const [nt, ns] = addI(t, soft, i);
      rec(nt, ns, q, n + 1); c[i]++;
    }
  }
  const [t0, s0] = addI(0, false, u);
  // hole card, conditioned on no natural when the dealer has peeked
  const excl = peek ? (u === 0 ? 9 : u === 9 ? 0 : -1) : -1;
  let T = sum(c) - (excl >= 0 ? c[excl] : 0);
  for (let i = 0; i < 10; i++) {
    if (!c[i] || i === excl) continue;
    const q = c[i] / T; c[i]--;
    const [nt, ns] = addI(t0, s0, i);
    rec(nt, ns, q, 2); c[i]++;
  }
  return out;
}
function standWLP(t, dd) {
  let w = dd[0], l = 0, p = 0;
  for (const k of [17, 18, 19, 20, 21]) { if (t > k) w += dd[k]; else if (t < k) l += dd[k]; else p += dd[k]; }
  return { ev: w - l, w, l, p };
}
// Optimal hit-or-stand from (t, soft), drawing from c (mutated and restored). Returns {ev,w,l,p}.
function hitWLP(t, soft, c, dd) {
  let W = 0, L = 0, P = 0; const T = sum(c);
  for (let i = 0; i < 10; i++) {
    if (!c[i]) continue;
    const q = c[i] / T; const [nt, ns] = addI(t, soft, i);
    if (nt > 21) { L += q; continue; }
    const st = standWLP(nt, dd);
    let best = st;
    if (nt < 21) { c[i]--; const h = hitWLP(nt, ns, c, dd); c[i]++; if (h.ev > st.ev) best = h; }
    W += q * best.w; L += q * best.l; P += q * best.p;
  }
  return { ev: W - L, w: W, l: L, p: P };
}
function doubleWLP(t, soft, c, dd) {
  let W = 0, L = 0, P = 0; const T = sum(c);
  for (let i = 0; i < 10; i++) {
    if (!c[i]) continue;
    const q = c[i] / T; const [nt] = addI(t, soft, i);
    if (nt > 21) { L += q; continue; }
    const st = standWLP(nt, dd); W += q * st.w; L += q * st.l; P += q * st.p;
  }
  return { ev: 2 * (W - L), w: W, l: L, p: P };
}
const pairStart = i => i === 0 ? 11 : i === 9 ? 10 : i + 1;
// One post-split slot: draw a card, then play it out (or resplit if it pairs and splits remain).
// Mirrors the Swift S1647 resplit model. Split aces take one card and stand.
function splitSlot(pr, c, dd, rules, left) {
  const ace = pr === 0; let ev = 0; const T = sum(c);
  for (let i = 0; i < 10; i++) {
    if (!c[i]) continue;
    const q = c[i] / T; c[i]--;
    const [t, soft] = addI(pairStart(pr), ace, i);
    let play;
    if (t > 21) play = -1;
    else {
      play = standWLP(t, dd).ev;
      if (!ace) {
        if (t < 21) play = Math.max(play, hitWLP(t, soft, c, dd).ev);
        if (rules.das && canDoubleTotal(rules, t)) play = Math.max(play, doubleWLP(t, soft, c, dd).ev);
      }
    }
    if (left > 0 && i === pr && (!ace || rules.rsa)) play = Math.max(play, 2 * splitSlot(pr, c, dd, rules, left - 1));
    ev += q * play; c[i]++;
  }
  return ev;
}
// EV per legal action for the hand being decided. `visible` = every face-up card on the table.
// Values are per unit of the hand's ORIGINAL bet (double and split count the extra stake).
// Only actions in `can` are priced, so nothing unavailable can be named as best (S1789 #2).
function evActions(cards, up, rules, can, visible, splitsLeft) {
  const c = deckFor(rules.decks, visible);
  const dd = dealerDist(up, rules, c);
  const { total: t, soft } = total(cards);
  const out = {};
  if (can.S) out.S = standWLP(t, dd);
  if (can.H && t < 21) out.H = hitWLP(t, soft, c, dd);
  if (can.D) out.D = doubleWLP(t, soft, c, dd);
  if (can.R) out.R = { ev: -.5, w: 0, l: 1, p: 0 };
  if (can.P) out.P = { ev: 2 * splitSlot(ix(cards[0].r), c, dd, rules, Math.max(0, splitsLeft - 1)) };
  return out;
}
// Dealer bust chance for an upcard after the peek, with a full shoe (used in coaching copy).
function bustChance(up, rules) { return dealerDist(up, rules, deckFor(rules.decks, [{ r: up, s: 0 }]))[0]; }

// ---------- house edge ----------
// Infinite-deck optimal-play calculator (correct for any rule mix, including A-A), plus a deck
// correction fitted to the WoO preset figures. Presets show the WoO number itself.
const P13 = i => i === 9 ? 4 / 13 : 1 / 13;
function calcEdgeInfinite(rules) {
  let ev = 0;
  for (let u = 0; u < 10; u++) {
    const upR = u === 0 ? 1 : u === 9 ? 10 : u + 1;
    const pBJ = u === 0 ? 4 / 13 : u === 9 ? 1 / 13 : 0;
    // dealer distribution after the peek, infinite deck
    const dd = { 0: 0, 17: 0, 18: 0, 19: 0, 20: 0, 21: 0 };
    const dm = new Map();
    const drec = (t, soft) => {               // returns distribution object from state
      const k = t * 2 + (soft ? 1 : 0); if (dm.has(k)) return dm.get(k);
      const o = { 0: 0, 17: 0, 18: 0, 19: 0, 20: 0, 21: 0 };
      if (t > 21) o[0] = 1;
      else if (t > 17 || (t === 17 && !(soft && rules.h17))) o[t] = 1;
      else for (let i = 0; i < 10; i++) { const [nt, ns] = addI(t, soft, i); const sub = drec(nt, ns); for (const kk in o) o[kk] += P13(i) * sub[kk]; }
      dm.set(k, o); return o;
    };
    const [t0, s0] = addI(0, false, u); const excl = u === 0 ? 9 : u === 9 ? 0 : -1;
    const norm = excl >= 0 ? 1 - P13(excl) : 1;
    for (let i = 0; i < 10; i++) { if (i === excl) continue; const [nt, ns] = addI(t0, s0, i); const sub = drec(nt, ns); for (const kk in dd) dd[kk] += P13(i) / norm * sub[kk]; }
    const hm = new Map();
    const hit = (t, soft) => {                // optimal hit/stand EV from (t, soft) after drawing
      const k = t * 2 + (soft ? 1 : 0); if (hm.has(k)) return hm.get(k);
      let e = 0;
      for (let i = 0; i < 10; i++) { const [nt, ns] = addI(t, soft, i); e += P13(i) * (nt > 21 ? -1 : Math.max(standWLP(nt, dd).ev, nt < 21 ? hit(nt, ns) : -9)); }
      hm.set(k, e); return e;
    };
    const dbl = (t, soft) => { let e = 0; for (let i = 0; i < 10; i++) { const [nt] = addI(t, soft, i); e += P13(i) * (nt > 21 ? -1 : standWLP(nt, dd).ev); } return 2 * e; };
    const slot = (pr, left) => {
      const ace = pr === 0; let e = 0;
      for (let i = 0; i < 10; i++) {
        const [t, soft] = addI(pairStart(pr), ace, i);
        let play = t > 21 ? -1 : standWLP(t, dd).ev;
        if (t <= 21 && !ace) { if (t < 21) play = Math.max(play, hit(t, soft)); if (rules.das && canDoubleTotal(rules, t)) play = Math.max(play, dbl(t, soft)); }
        if (left > 0 && i === pr && (!ace || rules.rsa)) play = Math.max(play, 2 * slot(pr, left - 1));
        e += P13(i) * play;
      }
      return e;
    };
    for (let a = 0; a < 10; a++) for (let b = 0; b < 10; b++) {
      const p = P13(u) * P13(a) * P13(b);
      const [ta, sa] = addI(0, false, a); const [t, soft] = addI(ta, sa, b);
      if (t === 21) { ev += p * (1 - pBJ) * rules.bj; continue; }
      let best = Math.max(standWLP(t, dd).ev, hit(t, soft));
      if (canDoubleTotal(rules, t)) best = Math.max(best, dbl(t, soft));
      if (rules.surrender) best = Math.max(best, -.5);
      if (a === b) best = Math.max(best, 2 * slot(a, rules.maxSplits - 1));   // A-A priced as aces (S1788 #4)
      ev += p * (-pBJ + (1 - pBJ) * best);
    }
  }
  return -ev;
}
// Fitted in tools/test.js against the WoO preset figures (difference WoO minus infinite-deck).
const DECK_ADJ = { 1: -0.0056, 2: -0.0034, 3: -0.0024, 4: -0.0016, 5: -0.0012, 6: -0.0010, 7: -0.0008, 8: -0.00065 };
const edgeMemo = {};
function houseEdge(rules) {
  const p = PRESETS.find(x => x.id === rules.id);
  if (p && sameRules(p, rules)) return { edge: p.edge, source: 'Wizard of Odds' };
  const k = JSON.stringify([rules.decks, rules.h17, rules.bj, rules.das, rules.rsa, rules.maxSplits, rules.surrender, rules.doubleOn]);
  if (!(k in edgeMemo)) edgeMemo[k] = calcEdgeInfinite(rules) + (DECK_ADJ[rules.decks] ?? 0);
  return { edge: edgeMemo[k], source: 'estimate' };
}
function sameRules(a, b) { return ['decks', 'h17', 'bj', 'das', 'rsa', 'maxSplits', 'surrender', 'doubleOn'].every(k => a[k] === b[k]); }

// ---------- side bets ----------
// Each evaluator sees the player's first two cards and the dealer's upcard (Queens' Reward also
// needs to know about a dealer blackjack). Returns {pay, name} on a win, null on a loss.
function poker3(a, b, c) {
  const flush = a.s === b.s && b.s === c.s;
  const trips = a.r === b.r && b.r === c.r;
  const v = [a.r, b.r, c.r].sort((x, y) => x - y);
  const straight = (v[1] === v[0] + 1 && v[2] === v[1] + 1) || (v[0] === 1 && v[1] === 12 && v[2] === 13);
  return { flush, trips, straight, royals: v[0] === 1 && v[1] === 12 && v[2] === 13 };
}
const SIDE = [
  { id: 'pp', name: 'Perfect Pairs', short: 'Pairs', minDecks: 4, cards: 2,
    caption: 'Your first two cards form a pair.',
    pays: d => [['Perfect Pair (same suit)', 25], ['Colored Pair', 12], ['Mixed Pair', 6]],
    ev(p1, p2) { if (p1.r !== p2.r) return null; if (p1.s === p2.s) return { pay: 25, name: 'Perfect Pair' }; if (red(p1.s) === red(p2.s)) return { pay: 12, name: 'Colored Pair' }; return { pay: 6, name: 'Mixed Pair' }; } },
  { id: 't3', name: '21+3', short: '21+3', minDecks: 2, cards: 3,
    caption: 'A three-card poker hand from your two cards plus the dealer upcard.',
    pays: d => [['Suited Trips', 100], ['Straight Flush', 40], ['Three of a Kind', 30], ['Straight', 10], ['Flush', 5]],
    ev(p1, p2, u) { const h = poker3(p1, p2, u);
      if (h.trips && h.flush) return { pay: 100, name: 'Suited Trips' }; if (h.straight && h.flush) return { pay: 40, name: 'Straight Flush' };
      if (h.trips) return { pay: 30, name: 'Three of a Kind' }; if (h.straight) return { pay: 10, name: 'Straight' }; if (h.flush) return { pay: 5, name: 'Flush' }; return null; } },
  { id: 'll', name: 'Lucky Lucky', short: 'Lucky', minDecks: 2, cards: 3,
    caption: 'Your two cards plus the dealer upcard total 19, 20 or 21.',
    pays: d => [['Suited 7-7-7', 200], ['Suited 6-7-8', 100], ['7-7-7', 50], ['6-7-8', 30], ['Suited 21', 15], ['Any 21', 3], ['Any 20', 2], ['Any 19', 2]],
    ev(p1, p2, u) {
      const cs = [p1, p2, u], suited = p1.s === p2.s && p2.s === u.s, rs = cs.map(c => c.r).sort((a, b) => a - b);
      if (rs[0] === 7 && rs[2] === 7) return suited ? { pay: 200, name: 'Suited 7-7-7' } : { pay: 50, name: '7-7-7' };
      if (rs[0] === 6 && rs[1] === 7 && rs[2] === 8) return suited ? { pay: 100, name: 'Suited 6-7-8' } : { pay: 30, name: '6-7-8' };
      const t = total(cs).total;
      if (t === 21) return suited ? { pay: 15, name: 'Suited 21' } : { pay: 3, name: 'Any 21' };
      if (t === 20) return { pay: 2, name: 'Any 20' }; if (t === 19) return { pay: 2, name: 'Any 19' }; return null; } },
  { id: 'md', name: 'Match the Dealer', short: 'Match', minDecks: 2, cards: 3,
    caption: 'Either of your first two cards matches the dealer upcard by rank.',
    mp(d) { return d <= 2 ? [19, 4] : d === 4 ? [12, 4] : d === 5 ? [15, 3] : d >= 8 ? [14, 3] : [11, 4]; },
    pays(d) { const [s, u] = this.mp(d); return [['Each suited match', s], ['Each unsuited match', u]]; },
    ev(p1, p2, u, d) { const [sp, up] = this.mp(d); let pay = 0, n = 0;
      for (const c of [p1, p2]) if (c.r === u.r) { pay += c.s === u.s ? sp : up; n++; }
      return pay ? { pay, name: n === 2 ? 'Two matches' : (pay === sp ? 'Suited match' : 'Match') } : null; } },
  { id: 'qr', name: "Queens' Reward", short: 'Queens', minDecks: 2, cards: 2, bj: true,
    caption: 'Your first two cards total 20. Two queens of hearts are the jackpot.',
    pays: d => d === 1 ? [['Q-Q + dealer blackjack', 250], ['Pair of queens', 25], ['Paired 20', 9], ['Suited 20', 6], ['Any 20', 3]]
      : [['Q♥ Q♥ + dealer blackjack', 1000], ['Q♥ Q♥', 125], ['Matched 20', 19], ['Suited 20', 9], ['Any 20', 4]],
    ev(p1, p2, u, d, dealerBJ) {
      if (total([p1, p2]).total !== 20) return null;
      if (d === 1) {
        if (p1.r === 12 && p2.r === 12) return dealerBJ ? { pay: 250, name: 'Queens + dealer blackjack' } : { pay: 25, name: 'Pair of queens' };
        if (p1.r === p2.r) return { pay: 9, name: 'Paired 20' }; if (p1.s === p2.s) return { pay: 6, name: 'Suited 20' }; return { pay: 3, name: 'Any 20' };
      }
      if (p1.r === 12 && p2.r === 12 && p1.s === 2 && p2.s === 2) return dealerBJ ? { pay: 1000, name: 'Q♥ Q♥ + dealer blackjack' } : { pay: 125, name: 'Q♥ Q♥' };
      if (p1.r === p2.r && p1.s === p2.s) return { pay: 19, name: 'Matched 20' };
      if (p1.s === p2.s) return { pay: 9, name: 'Suited 20' }; return { pay: 4, name: 'Any 20' }; } },
  { id: 'cb', name: '3-Card Poker Bonus', short: '3-Card B', minDecks: 6, cards: 3,
    caption: '21+3 with a premium top tier for suited A-K-Q.',
    pays: d => [['Suited A-K-Q', 200], ['Straight Flush', 50], ['Three of a Kind', 30], ['Straight', 10], ['Flush', 5]],
    ev(p1, p2, u) { const h = poker3(p1, p2, u);
      if (h.royals && h.flush) return { pay: 200, name: 'Suited A-K-Q' }; if (h.straight && h.flush) return { pay: 50, name: 'Straight Flush' };
      if (h.trips) return { pay: 30, name: 'Three of a Kind' }; if (h.straight) return { pay: 10, name: 'Straight' }; if (h.flush) return { pay: 5, name: 'Flush' }; return null; } },
  { id: 'cc', name: '3-Card Poker Classic', short: '3-Card C', minDecks: 6, cards: 3,
    caption: 'The companion bet with a lower top tier.',
    pays: d => [['Suited A-K-Q', 100], ['Straight Flush', 40], ['Three of a Kind', 30], ['Straight', 10], ['Flush', 5]],
    ev(p1, p2, u) { const h = poker3(p1, p2, u);
      if (h.royals && h.flush) return { pay: 100, name: 'Suited A-K-Q' }; if (h.straight && h.flush) return { pay: 40, name: 'Straight Flush' };
      if (h.trips) return { pay: 30, name: 'Three of a Kind' }; if (h.straight) return { pay: 10, name: 'Straight' }; if (h.flush) return { pay: 5, name: 'Flush' }; return null; } },
];
const sideById = id => SIDE.find(s => s.id === id);
const sideAvailable = (rules) => SIDE.filter(s => rules.decks >= s.minDecks);
// Exact house edge of a side bet by enumerating every card combination without replacement.
// This replaces the iOS app's hand-typed per-deck tables (S1798: wrong at unsupported deck counts).
const sideMemo = {};
function sideEdge(id, decks) {
  const k = id + decks; if (k in sideMemo) return sideMemo[k];
  const bet = sideById(id), N = decks, T = 52 * N;
  const C = []; for (let t = 0; t < 52; t++) C.push({ r: t % 13 + 1, s: Math.floor(t / 13) });
  let ev = 0, pWin = 0;
  const cnt = new Array(52).fill(N);
  for (let a = 0; a < 52; a++) {
    const pa = cnt[a] / T; cnt[a]--;
    for (let b = 0; b < 52; b++) {
      if (!cnt[b]) continue;
      const pb = cnt[b] / (T - 1); cnt[b]--;
      if (bet.cards === 2 && !bet.bj) {
        const r = bet.ev(C[a], C[b], null, N); const p = pa * pb;
        ev += p * (r ? r.pay : -1); if (r) pWin += p;
      } else if (bet.bj) {
        const r0 = bet.ev(C[a], C[b], null, N, false); const p = pa * pb;
        if (!r0) { ev -= p; }
        else {
          const r1 = bet.ev(C[a], C[b], null, N, true);
          if (r1.pay === r0.pay) ev += p * r0.pay;
          else {  // jackpot tier: needs P(dealer blackjack | these two cards gone)
            const R = T - 2; let ten = 0, ace = 0;
            for (let x = 0; x < 52; x++) { if (C[x].r === 1) ace += cnt[x]; else if (C[x].r >= 10) ten += cnt[x]; }
            const pbj = (ace / R) * (ten / (R - 1)) + (ten / R) * (ace / (R - 1));
            ev += p * (pbj * r1.pay + (1 - pbj) * r0.pay);
          }
          pWin += p;
        }
      } else {
        for (let c = 0; c < 52; c++) {
          if (!cnt[c]) continue;
          const p = pa * pb * cnt[c] / (T - 2);
          const r = bet.ev(C[a], C[b], C[c], N);
          ev += p * (r ? r.pay : -1); if (r) pWin += p;
        }
      }
      cnt[b]++;
    }
    cnt[a]++;
  }
  return (sideMemo[k] = { edge: -ev, hit: pWin });
}

// ---------- the game ----------
const r2 = x => Math.round(x * 100) / 100;
class Game {
  constructor(rules, opts = {}) {
    this.rules = rules;
    this.bank = opts.bank ?? 1000;
    this.shoe = opts.shoe || new Shoe(rules.decks, rules.pen, opts.rng);
    this.round = opts.round || null;
    this.rc = opts.rc ?? 0;              // Hi-Lo running count of every card shown since the shuffle
    this.events = [];
  }
  toJSON() { return { bank: this.bank, shoe: this.shoe.toJSON(), round: this.round, rc: this.rc }; }
  emit(e) { this.events.push(e); }
  take() { const e = this.events; this.events = []; return e; }
  seen(card) { this.rc += hiLo(card.r); }
  get trueCount() { const d = Math.max(.5, Math.round(this.shoe.left / 52 * 2) / 2); return this.rc / d; }
  draw(seen = true) { const c = this.shoe.draw(); if (seen) this.seen(c); return c; }
  canAfford(x) { return this.bank + 1e-9 >= x; }

  // ---- betting ----
  start(bet, sides = {}) {
    const R = this.rules;
    if (this.round && this.round.phase !== 'done') throw new Error('round in progress');
    sides = Object.fromEntries(Object.entries(sides).filter(([id, v]) => v > 0 && sideById(id) && R.decks >= sideById(id).minDecks));
    const stake = bet + sum(Object.values(sides));
    if (bet < R.min || bet > R.max) throw new Error('bet out of range');
    if (!this.canAfford(stake)) throw new Error('not enough chips');
    if (this.shoe.needsShuffle || !this.shoe.burned) {
      if (this.shoe.needsShuffle) { this.shoe.shuffle(); this.emit({ t: 'shuffle' }); }
      this.rc = 0; this.shoe.burn();
    }
    this.bank = r2(this.bank - stake);
    const rd = this.round = {
      id: Date.now(), phase: 'deal', bet, sides, sideRes: [], staked: stake, ret: 0,
      hands: [{ cards: [], bet, split: false, aces: false, done: false, dbl: false, sur: false, out: null, ret: 0, acts: [] }],
      active: 0, dealer: [], hidden: true, ins: 0, even: false, splits: 0, dealerBJ: false, decisions: [],
      tc0: this.trueCount,
    };
    const h = rd.hands[0];
    const deal = (to, hidden) => {
      const c = this.draw(!hidden);
      if (to === 'p') { h.cards.push(c); this.emit({ t: 'card', to: 'p', h: 0, c }); }
      else { rd.dealer.push(c); this.emit({ t: 'card', to: 'd', c, hidden }); }
    };
    deal('p'); deal('d'); deal('p'); deal('d', true);
    const up = rd.dealer[0].r;
    if (up === 1) { rd.phase = 'insurance'; this.emit({ t: 'insurance' }); return; }
    this.afterPeek();
  }
  insurance(take) {
    const rd = this.round; if (!rd || rd.phase !== 'insurance') throw new Error('no insurance offered');
    const h = rd.hands[0], bj = natural(h.cards);
    const choice = take ? (bj ? 'even' : 'ins') : 'no';
    // Insurance is a decision the coach grades: basic strategy never takes it (even money included).
    rd.decisions.push({ h: 0, cards: h.cards.slice(), up: 1, a: take ? (bj ? 'E' : 'I') : 'N', rec: 'N', kind: 'ins', key: 'INS', ok: !take, tc: this.trueCount });
    if (choice === 'even') rd.even = true;
    else if (choice === 'ins') {
      const cost = r2(rd.bet / 2);
      if (!this.canAfford(cost)) throw new Error('not enough chips');
      rd.ins = cost; this.bank = r2(this.bank - cost); rd.staked = r2(rd.staked + cost);
    }
    this.afterPeek();
  }
  afterPeek() {
    const rd = this.round, up = rd.dealer[0], hole = rd.dealer[1], h = rd.hands[0];
    rd.dealerBJ = natural([up, hole]);
    if (up.r === 1 || isTen(up.r)) this.emit({ t: 'peek', bj: rd.dealerBJ });
    // side bets settle now, before anyone plays
    for (const [id, amt] of Object.entries(rd.sides)) {
      const sb = sideById(id); const res = sb.ev(h.cards[0], h.cards[1], up, this.rules.decks, rd.dealerBJ);
      const ret = res ? r2(amt * (res.pay + 1)) : 0;
      rd.sideRes.push({ id, amt, win: !!res, pay: res ? res.pay : 0, name: res ? res.name : null, ret });
      this.credit(ret);
    }
    if (rd.sideRes.length) this.emit({ t: 'sides' });
    if (rd.ins) {
      if (rd.dealerBJ) { const ret = r2(rd.ins * 3); rd.insRet = ret; this.credit(ret); }
      else rd.insRet = 0;
      this.emit({ t: 'insres', win: rd.dealerBJ });
    }
    const pBJ = natural(h.cards);
    if (rd.even) { this.settleHand(h, 'even', 2 * h.bet); this.reveal(); return this.finish(); }
    if (rd.dealerBJ) {
      this.reveal();
      this.settleHand(h, pBJ ? 'push' : 'dealerbj', pBJ ? h.bet : 0);
      return this.finish();
    }
    if (pBJ) { this.settleHand(h, 'bj', h.bet * (1 + this.rules.bj)); this.reveal(); return this.finish(); }
    rd.phase = 'play';
    this.emit({ t: 'turn', h: 0 });
  }
  credit(x) { if (x) { this.bank = r2(this.bank + x); this.round.ret = r2(this.round.ret + x); } }
  settleHand(h, out, ret) { h.out = out; h.ret = r2(ret); h.done = true; this.credit(h.ret); }
  reveal() {
    const rd = this.round; if (!rd.hidden) return;
    rd.hidden = false; this.seen(rd.dealer[1]); this.emit({ t: 'flip', c: rd.dealer[1] });
  }

  // ---- play ----
  legal(i = this.round && this.round.active) {
    const rd = this.round, R = this.rules;
    const no = { H: false, S: false, D: false, P: false, R: false };
    if (!rd || rd.phase !== 'play') return no;
    const h = rd.hands[i]; if (!h || h.done) return no;
    const two = h.cards.length === 2, t = total(h.cards).total;
    const lockedAce = h.aces;                        // split aces: one card only
    return {
      H: !lockedAce && t < 21,
      S: true,
      D: two && !lockedAce && (!h.split || R.das) && canDoubleTotal(R, t) && this.canAfford(h.bet),
      P: two && pairable(h.cards) && rd.splits < R.maxSplits && this.canAfford(h.bet) && !(h.cards[0].r === 1 && h.split && !R.rsa),
      R: two && R.surrender && rd.hands.length === 1,
    };
  }
  visible() {
    const rd = this.round, v = [];
    for (const h of rd.hands) v.push(...h.cards);
    v.push(rd.dealer[0]);
    return v;
  }
  advise(i = this.round.active) {
    const rd = this.round, h = rd.hands[i], can = this.legal(i);
    // what the chart says with the bank set aside (not being able to afford a double doesn't change the right play)
    const ideal = Object.assign({}, can);
    const R = this.rules, two = h.cards.length === 2, t = total(h.cards).total;
    ideal.D = two && !h.aces && (!h.split || R.das) && canDoubleTotal(R, t);
    ideal.P = two && pairable(h.cards) && rd.splits < R.maxSplits && !(h.cards[0].r === 1 && h.split && !R.rsa);
    const rec = recommend(h.cards, rd.dealer[0].r, R, ideal);
    if (!can[rec.a]) rec.fallback = recommend(h.cards, rd.dealer[0].r, R, can).a;
    return { rec, can, ideal };
  }
  ev(i = this.round.active) {
    const rd = this.round, h = rd.hands[i];
    const { ideal } = this.advise(i);
    return evActions(h.cards, rd.dealer[0].r, this.rules, ideal, this.visible(), this.rules.maxSplits - rd.splits);
  }
  act(a) {
    const rd = this.round; if (!rd || rd.phase !== 'play') throw new Error('not your turn');
    const i = rd.active, h = rd.hands[i], can = this.legal(i);
    if (!can[a]) throw new Error('illegal action ' + a);
    const { rec } = this.advise(i);
    const best = can[rec.a] ? rec.a : rec.fallback;
    rd.decisions.push({ h: i, cards: h.cards.slice(), up: rd.dealer[0].r, a, rec: best, chart: rec.a, kind: rec.kind, key: rec.key, ok: a === best, tc: this.trueCount, split: h.split });
    h.acts.push(a);
    if (a === 'H') {
      const c = this.draw(); h.cards.push(c); this.emit({ t: 'card', to: 'p', h: i, c });
      const t = total(h.cards).total;
      if (t > 21) { h.done = true; h.out = 'bust'; this.emit({ t: 'bust', h: i }); }
      else if (t === 21) h.done = true;
    } else if (a === 'S') h.done = true;
    else if (a === 'D') {
      this.bank = r2(this.bank - h.bet); rd.staked = r2(rd.staked + h.bet); h.bet = r2(h.bet * 2); h.dbl = true;
      this.emit({ t: 'double', h: i });
      const c = this.draw(); h.cards.push(c); this.emit({ t: 'card', to: 'p', h: i, c, sideways: true });
      if (total(h.cards).total > 21) { h.out = 'bust'; this.emit({ t: 'bust', h: i }); }
      h.done = true;
    } else if (a === 'P') {
      this.bank = r2(this.bank - h.bet); rd.staked = r2(rd.staked + h.bet); rd.splits++;
      const aces = h.cards[0].r === 1;
      const nh = { cards: [h.cards.pop()], bet: h.bet, split: true, aces, done: false, dbl: false, sur: false, out: null, ret: 0, acts: [] };
      h.split = true; h.aces = aces;
      rd.hands.splice(i + 1, 0, nh);
      this.emit({ t: 'split', h: i });
      this.dealSecond(i);
    } else if (a === 'R') {
      h.sur = true; h.done = true; this.emit({ t: 'surrender', h: i });
    }
    if (h.done) this.advance();
  }
  dealSecond(i) {
    const rd = this.round, h = rd.hands[i];
    const c = this.draw(); h.cards.push(c); this.emit({ t: 'card', to: 'p', h: i, c });
    const t = total(h.cards).total;
    if (h.aces) {
      // One card on split aces, unless it's another ace and resplitting aces is allowed.
      const resplit = this.rules.rsa && c.r === 1 && rd.splits < this.rules.maxSplits && this.canAfford(h.bet);
      if (!resplit) h.done = true;
    } else if (t === 21) h.done = true;
  }
  advance() {
    const rd = this.round;
    for (let j = rd.active; j < rd.hands.length; j++) {
      const h = rd.hands[j];
      if (h.done) continue;
      if (j !== rd.active) { rd.active = j; this.emit({ t: 'turn', h: j }); }
      if (h.cards.length === 1) { this.dealSecond(j); if (h.done) continue; }
      return;
    }
    this.dealerTurn();
  }
  dealerTurn() {
    const rd = this.round, R = this.rules;
    rd.phase = 'dealer'; rd.active = -1;
    this.reveal();
    const live = rd.hands.some(h => !h.sur && total(h.cards).total <= 21);
    if (live) {
      for (;;) {
        const { total: t, soft } = total(rd.dealer);
        if (t < 17 || (t === 17 && soft && R.h17)) { const c = this.draw(); rd.dealer.push(c); this.emit({ t: 'card', to: 'd', c }); }
        else break;
      }
    }
    const d = total(rd.dealer).total;
    for (const h of rd.hands) {
      const t = total(h.cards).total;
      if (h.sur) this.settleHand(h, 'surrender', h.bet / 2);
      else if (t > 21) this.settleHand(h, 'bust', 0);
      else if (d > 21 || t > d) this.settleHand(h, 'win', 2 * h.bet);
      else if (t < d) this.settleHand(h, 'lose', 0);
      else this.settleHand(h, 'push', h.bet);
    }
    this.finish();
  }
  finish() {
    const rd = this.round; rd.phase = 'done';
    rd.net = r2(rd.ret - rd.staked);
    this.emit({ t: 'done', net: rd.net });
  }
}

const api = { RN, SUIT, val, isTen, red, total, pairable, natural, short, upLabel, PRESETS, makeRules, rulesLine, canDoubleTotal,
  Shoe, mulberry, hiLo, TABLES, chartCode, resolveCode, recommend, evActions, dealerDist, deckFor, calcEdgeInfinite, houseEdge, DECK_ADJ,
  SIDE, sideById, sideAvailable, sideEdge, Game, r2, bustChance };
if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.BJ = api;
})(typeof self !== 'undefined' ? self : this);
