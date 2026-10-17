/* Blackjack Navigator — the table: state, betting, card playback, coaching, stats recording.
   The menu screens live in sheets.js. Game rules and math live in engine.js. */
'use strict';
const BUILD = '2026-10-17.1';
const $ = s => document.querySelector(s);
const h = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const money = (x, cents) => { const a = Math.abs(x), c = cents || Math.round(a * 100) % 100 !== 0; return (x < 0 ? '−' : '') + '$' + a.toLocaleString('en-US', { minimumFractionDigits: c ? 2 : 0, maximumFractionDigits: 2 }); };
const signed = x => (x > 0 ? '+' : '') + money(x);
const pct = (x, d = 2) => (x * 100).toFixed(d) + '%';
const evTxt = x => (x >= 0 ? '+' : '−') + Math.abs(x).toFixed(2);
const ACT = { H: 'Hit', S: 'Stand', D: 'Double', P: 'Split', R: 'Surrender', I: 'Insurance', E: 'Even money', N: 'No insurance' };
const CHIPS = [1, 5, 25, 100, 500];

// ---------- saved state ----------
const KEY = 'bjn.v1';
const newStats = () => ({ rounds: 0, hands: 0, win: 0, lose: 0, push: 0, bj: 0, bust: 0, sur: 0, staked: 0, mainWag: 0, net: 0, exp: 0, dec: 0, ok: 0,
  kinds: {}, cells: {}, evLost: 0, side: {}, tables: {}, best: 0, worst: 0, refills: 0, since: Date.now() });
const fresh = () => ({ v: 1, bank: 1000, tableId: 'six-deck-h17', custom: null,
  set: { coach: 'think', count: false, sound: true, fast: false, sides: ['pp', 't3'] },
  stats: newStats(), hist: [], drill: { n: 0, ok: 0, best: 0, cn: 0, cok: 0 }, game: null, bet: 15, sides: {}, read: {} });
let S;
try { S = Object.assign(fresh(), JSON.parse(localStorage.getItem(KEY) || 'null') || {}); } catch (e) { S = fresh(); }
S.set = Object.assign(fresh().set, S.set); S.stats = Object.assign(newStats(), S.stats);
const rules = () => S.tableId === 'custom' && S.custom ? BJ.makeRules(S.custom) : (BJ.PRESETS.find(p => p.id === S.tableId) || BJ.PRESETS[0]);
let R = rules();
let G;
function makeGame(keep) {
  R = rules();
  if (keep && S.game && S.game.shoe && S.game.shoe.d === R.decks) {
    try { G = new BJ.Game(R, { bank: S.game.bank, shoe: BJ.Shoe.from(S.game.shoe), round: S.game.round, rc: S.game.rc }); return; } catch (e) { /* fall through */ }
  }
  G = new BJ.Game(R, { bank: S.bank });
}
let wiping = false;
function save() {
  if (wiping) return;
  S.bank = G.bank; S.game = G.toJSON();
  try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* storage full: history is the big part */ S.hist = S.hist.slice(0, 60); try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e2) {} }
}

// ---------- sound (Web Audio, respects the silent switch) ----------
let AC = null;
try { if (navigator.audioSession) navigator.audioSession.type = 'ambient'; } catch (e) {}
function ac() { if (!S.set.sound) return null; if (!AC) { try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; } } if (AC.state === 'suspended') AC.resume(); return AC; }
function noise(dur, freq, gain) {
  const a = ac(); if (!a) return; const n = Math.floor(a.sampleRate * dur), b = a.createBuffer(1, n, a.sampleRate), d = b.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 3);
  const s = a.createBufferSource(); s.buffer = b; const f = a.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = .8;
  const g = a.createGain(); g.gain.value = gain; s.connect(f).connect(g).connect(a.destination); s.start();
}
function tone(fr, t0, dur, gain) {
  const a = ac(); if (!a) return; const o = a.createOscillator(), g = a.createGain(); o.frequency.value = fr; o.type = 'sine';
  const t = a.currentTime + t0; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(gain, t + .008); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
  o.connect(g).connect(a.destination); o.start(t); o.stop(t + dur + .02);
}
const sfx = {
  card: () => noise(.06, 2600, .5), chip: () => { tone(2900, 0, .05, .06); tone(3700, .028, .05, .05); },
  win: () => { tone(659, 0, .5, .05); tone(784, .07, .5, .04); tone(988, .14, .6, .035); }, shuffle: () => { for (let i = 0; i < 6; i++) setTimeout(() => noise(.04, 2000, .3), i * 45); },
};

// ---------- view model for playback ----------
let V = { dealer: 0, hidden: true, hands: [0], active: 0, sides: false, done: true };
let busy = false, shownBank = 0, coachHTML = '', lastFb = null;
const viewFromRound = rd => rd ? { dealer: rd.dealer.length, hidden: rd.hidden, hands: rd.hands.map(x => x.cards.length), active: rd.active, sides: rd.sideRes.length > 0, done: rd.phase === 'done' }
  : { dealer: 0, hidden: true, hands: [], active: 0, sides: false, done: true };
const wait = ms => new Promise(r => setTimeout(r, S.set.fast ? ms * .45 : ms));
const roundLive = () => G.round && G.round.phase !== 'done';

// ---------- cards ----------
function cardEl(c, back) {
  const e = h('div', 'card' + (back ? ' back' : '') + (!back && BJ.red(c.s) ? ' red' : ''));
  if (back) return e;
  const rn = BJ.RN[c.r], su = BJ.SUIT[c.s];
  e.setAttribute('aria-label', rn + ' of ' + ['clubs', 'diamonds', 'hearts', 'spades'][c.s]);
  e.innerHTML = `<div class="ix"><b>${rn}</b><i>${su}</i></div><div class="ix br"><b>${rn}</b><i>${su}</i></div>` +
    (c.r >= 11 ? `<div class="face">${rn}</div>` : `<div class="pip">${su}</div>`);
  return e;
}
function totalText(cards, done) {
  if (!cards.length) return '';
  const t = BJ.total(cards);
  if (t.total > 21) return 'Bust';
  if (cards.length === 2 && t.total === 21 && done !== 'split') return 'Blackjack';
  return t.soft && t.total < 21 && !done ? `${t.total - 10}/${t.total}` : String(t.total);
}
function renderDealer(animIx = -1, flipIx = -1) {
  const rd = G.round, box = $('#dealer'); box.innerHTML = '';
  const row = h('div', 'cards'); const tot = h('div', 'tot num');
  if (rd) {
    const cs = rd.dealer.slice(0, V.dealer);
    cs.forEach((c, i) => {
      const e = cardEl(c, i === 1 && V.hidden);
      if (i === animIx) { e.classList.add('enter'); e.style.setProperty('--dx', '30vw'); e.style.setProperty('--dy', '-12vh'); }
      if (i === flipIx) e.classList.add('flip');
      row.appendChild(e);
    });
    const vis = V.hidden ? cs.slice(0, 1) : cs;
    tot.textContent = vis.length ? (V.hidden ? (vis[0].r === 1 ? 'A' : String(BJ.total(vis).total)) : totalText(vis, V.done || V.dealer > 2)) : '';
    if (!V.hidden && vis.length === 2 && rd.dealerBJ) tot.textContent = 'Blackjack';
  }
  box.append(row, tot);
}
const OUT = { win: ['Win', 'w'], lose: ['Lose', 'l'], push: ['Push', 'p'], bust: ['Bust', 'l'], bj: ['Blackjack', 'w'], dealerbj: ['Dealer blackjack', 'l'], surrender: ['Surrendered', 'l'], even: ['Even money', 'w'] };
function renderHands(animHand = -1) {
  const rd = G.round, box = $('#hands'); box.innerHTML = '';
  if (!rd) return;
  const n = V.hands.length; box.className = 'hands-' + Math.min(4, n);
  V.hands.forEach((cnt, i) => {
    const hd = rd.hands[i]; if (!hd) return;
    const cs = hd.cards.slice(0, cnt);
    const wrap = h('div', 'hand' + (n > 1 && !V.done && rd.phase === 'play' ? (i === V.active ? ' active' : ' waiting') : ''));
    const tot = h('div', 'tot num'); tot.textContent = totalText(cs, hd.split ? 'split' : (cnt > 2 || V.done));
    const row = h('div', 'cards');
    cs.forEach((c, j) => {
      const e = cardEl(c);
      if (hd.dbl && j === 2) e.classList.add('side');
      if (i === animHand && j === cnt - 1) e.classList.add('enter');
      row.appendChild(e);
    });
    wrap.append(tot, row);
    const wg = h('div', 'wager num'); wg.textContent = money(hd.bet) + (hd.dbl ? ' doubled' : '');
    if (n > 1 || hd.dbl) wrap.appendChild(wg);
    const showOut = hd.out && (V.done || hd.out === 'bust' || hd.sur) && cnt === hd.cards.length;
    if (showOut) {
      const [label, cls] = OUT[hd.out] || [hd.out, 'p'];
      const net = V.done ? hd.ret - hd.bet : null;
      const r = h('div', 'res num ' + cls); r.textContent = label + (net && hd.out !== 'push' ? ' ' + signed(net) : '');
      wrap.appendChild(r);
    }
    box.appendChild(wrap);
  });
}
function chipStack(amount, big) {
  const box = h('span', 'stack'); let left = Math.floor(amount + 1e-9), k = 0;
  const parts = [];
  for (const d of [1000, 500, 100, 25, 5, 1]) while (left >= d && parts.length < 8) { parts.push(d); left -= d; }
  parts.reverse().forEach(d => { const c = h('span', 'chip v' + d); c.style.transform = `translateY(${-k * 3}px)`; k++; box.appendChild(c); });
  if (parts.length) box.lastChild.innerHTML = `<span>${parts[parts.length - 1] >= 1000 ? '1k' : parts[parts.length - 1]}</span>`;
  return box;
}
function sideIds() { return S.set.sides.filter(id => BJ.sideById(id) && R.decks >= BJ.sideById(id).minDecks).slice(0, 2); }
function renderSpots() {
  const rd = G.round, live = roundLive() || (rd && rd.phase === 'done');
  const bet = live ? rd.bet : S.bet;
  const spot = $('#betSpot'); spot.querySelector('.stack').replaceWith(chipStack(bet, true));
  $('#betAmt').textContent = bet ? money(bet) : `Bet ${money(R.min)}–${money(R.max)}`;
  const ids = sideIds();
  ['#side0', '#side1'].forEach((sel, i) => {
    const b = $(sel), id = ids[i]; b.innerHTML = '';
    if (!id) { b.hidden = true; return; }
    b.hidden = false; const sb = BJ.sideById(id);
    const amt = live ? (rd.sides[id] || 0) : (S.sides[id] || 0);
    b.appendChild(chipStack(amt)); b.appendChild(h('span', 'nm', esc(sb.short) + (amt ? ' ' + money(amt) : '')));
    b.setAttribute('aria-label', sb.name + ' side bet' + (amt ? ', ' + money(amt) : ''));
    if (rd && V.sides) {
      const res = rd.sideRes.find(x => x.id === id);
      if (res) b.appendChild(h('span', 'pay num ' + (res.win ? 'w' : 'l'), res.win ? `${esc(res.name)} ${signed(res.ret - res.amt)}` : 'No win'));
    }
  });
}
function renderTop() {
  $('#tName').textContent = R.name;
  $('#bank').textContent = money(busy ? shownBank : G.bank);
  const cb = $('#countBox'); cb.hidden = !S.set.count;
  if (S.set.count && !busy) { const tc = G.trueCount; cb.textContent = `Running ${G.rc > 0 ? '+' : ''}${G.rc}   True ${tc > 0 ? '+' : ''}${(Math.round(tc * 2) / 2).toFixed(1)}`; }
  $('#shoeBar i').style.width = (G.shoe.i / G.shoe.cards.length * 100) + '%';
  $('#shoeBar').style.setProperty('--cut', (R.pen * 100) + '%');
  $('#arcT1').textContent = R.bj === 1.5 ? 'Blackjack pays 3 to 2' : R.bj === 1.2 ? 'Blackjack pays 6 to 5' : 'Blackjack pays even money';
  $('#arcT2').textContent = (R.h17 ? 'Dealer must hit soft 17' : 'Dealer must stand on all 17s') + ',  insurance pays 2 to 1';
}
function renderAll() { renderTop(); renderDealer(); renderHands(); renderSpots(); renderControls(); }

// ---------- coaching copy ----------
const upName = r => r === 1 ? 'an ace' : r >= 10 ? 'a 10' : r === 8 ? 'an 8' : 'a ' + r;
const weak = u => u >= 2 && u <= 6, strong = u => u === 1 || u >= 9;
function why(a, cards, up, ev) {
  const { total: t, soft } = BJ.total(cards), U = upName(up), bust = Math.round(BJ.bustChance(up, R) * 100);
  const pair = BJ.pairable(cards) ? cards[0].r : 0;
  const w = x => ev && ev[x] && ev[x].w != null ? Math.round(ev[x].w * 100) : null;
  if (a === 'P') {
    if (pair === 1) return 'Each ace starts a new hand one card from 21. Always split aces.';
    if (pair === 8) return '16 is the worst total in blackjack. Two 8s each start from a solid base.';
    if (pair === 9) return up === 8 || up === 9 ? `Your 18 is only about even against ${U}. Two hands starting at 9 do better.` : `The dealer busts ${bust}% of the time from ${U}. Two hands starting at 9 earn more than one 18.`;
    if (pair === 4) return `Each 4 can catch a 6 or 7 for a strong 10 or 11, and ${U} busts ${bust}% of the time.`;
    if (pair === 7) return `14 has no future against ${U}. Two hands starting at 7 lose less.`;
    return `A pair of ${pair}s makes a weak ${t}. Two fresh hands do better against ${U}${weak(up) ? `, which busts ${bust}% of the time` : ''}.`;
  }
  if (a === 'R') {
    const alt = ['H', 'S'].filter(x => ev && ev[x]).map(x => ev[x].ev);
    const bestAlt = alt.length ? Math.max(...alt) : null;
    return bestAlt != null ? `Playing on loses ${Math.abs(bestAlt).toFixed(2)} per dollar on average. Surrender costs exactly 0.50.`
      : `${t} against ${U} loses more than half your bet on average. Taking half back is cheaper.`;
  }
  if (a === 'D') {
    const dw = w('D');
    if (!soft && t === 11) return `Eleven is one card from 21${dw != null ? ` and wins ${dw}% here` : ''}. Put more money on it.`;
    if (!soft && t === 10) return `A ten-value card makes 20${dw != null ? `, and you win ${dw}% here` : ''}. Double while you are ahead.`;
    if (!soft && t === 9) return `${U[0].toUpperCase() + U.slice(1)} busts ${bust}% of the time. Doubling 9 gets more money down while the dealer is weak.`;
    if (soft && t === 17) return `Only an ace, 2, 3 or 4 improves soft 17, but ${U} is weak enough that the extra bet pays.`;
    if (soft && t === 18) return `18 already does well against ${U}. Doubling wins more money overall, with no bust risk on the one card.`;
    if (soft && t === 19) return `Against ${U} the dealer busts so often that doubling 19 earns more than standing.`;
    if (soft) return `One card can't bust a soft hand, and ${U} busts ${bust}% of the time. Press the bet.`;
    return 'Doubling has the best expected value here.';
  }
  if (a === 'H') {
    if (soft && t <= 17) return `One card can't bust soft ${t}, and ${t} won't win often as it stands.`;
    if (soft && t === 18) return `18 loses to ${U} more often than it wins. The ace lets you draw without busting.`;
    if (!soft && t <= 11) return `You can't bust ${t}. Take a card.`;
    if (!soft && t === 12 && (up === 2 || up === 3)) return `Only a 10 busts 12, and ${U} isn't weak enough to stand on.`;
    if (!soft && t >= 12 && t <= 16 && !weak(up)) {
      const dp = ev && ev.H && ev.S && Math.abs(ev.H.ev - ev.S.ev) < .01 ? 3 : 2;
      return ev && ev.H && ev.S ? `${t} against ${U} loses either way, but hitting loses less: ${Math.abs(ev.H.ev).toFixed(dp)} per dollar against ${Math.abs(ev.S.ev).toFixed(dp)} for standing.`
        : `${t} against ${U} loses either way, but hitting loses less.`;
    }
    return 'Your hand needs to improve to compete. Take a card.';
  }
  // stand
  if (pair >= 10) return '20 wins most of the time. Splitting trades it for two weaker hands.';
  if (pair === 9) return up === 7 ? 'Your 18 already beats the 17 a dealer 7 usually makes.' : `Two hands starting at 9 do worse against ${U} than one 18.`;
  if (!soft && t >= 17) return `${t} is a made hand. Any card risks a bust for little gain.`;
  if (!soft && t >= 12 && weak(up)) return `${U[0].toUpperCase() + U.slice(1)} busts ${bust}% of the time. Let the dealer take the risk.`;
  if (soft && t >= 19) return `Soft ${t} already beats most dealer hands.`;
  if (soft && t === 18) return `18 holds up against ${U}.`;
  return 'Standing has the best expected value here.';
}
function compNote(ev, chart) {
  if (!ev || !ev[chart]) return '';
  const best = Object.keys(ev).reduce((x, y) => ev[x].ev >= ev[y].ev ? x : y);
  if (best === chart || ev[best].ev - ev[chart].ev < .002) return '';
  return `<span class="note">With these exact cards, ${ACT[best].toLowerCase()} is very slightly better (${evTxt(ev[best].ev - ev[chart].ev)}). The chart play is basic strategy.</span>`;
}
function insuranceEdge() {
  const rd = G.round; const c = BJ.deckFor(R.decks, G.visible()); const ten = c[9] / c.reduce((a, b) => a + b, 0);
  return { edge: 1 - 3 * ten, ten };
}

// ---------- controls ----------
function setCoach(html, cls) { coachHTML = html; $('#coach').innerHTML = html ? `<div class="coachCard ${cls || ''}">${html}</div>` : ''; }
function renderControls() {
  const rd = G.round, phase = rd ? rd.phase : 'done';
  $('#betBar').hidden = phase !== 'done'; $('#playBar').hidden = phase !== 'play'; $('#insBar').hidden = phase !== 'insurance';
  document.querySelectorAll('#bar button, #spots button').forEach(b => { if (busy) b.disabled = true; });
  if (busy) return;
  $('#betSpot').disabled = false; $('#side0').disabled = $('#side1').disabled = false;
  if (phase === 'done') {
    const broke = G.bank + 1e-9 < R.min;
    document.querySelectorAll('#rail button').forEach(b => { const v = +b.dataset.v; b.disabled = v > R.max || v > G.bank; b.classList.toggle('sel', v === selChip); });
    const stake = S.bet + Object.values(liveSides()).reduce((a, b) => a + b, 0);
    const dl = $('#bDeal');
    if (broke) { dl.disabled = false; dl.textContent = 'Add $1,000'; dl.dataset.mode = 'refill'; if (!coachHTML) setCoach('<span class="lead">Out of chips.</span>Add another $1,000 to keep playing. Stats count every top-up.'); }
    else { dl.dataset.mode = ''; dl.textContent = S.bet ? 'Deal ' + money(S.bet) : 'Deal'; dl.disabled = S.bet < R.min || S.bet > R.max || stake > G.bank + 1e-9; }
    $('#bClear').disabled = !S.bet && !Object.keys(liveSides()).length;
    return;
  }
  if (phase === 'insurance') {
    const bj = BJ.natural(rd.hands[0].cards), cost = BJ.r2(rd.bet / 2), ie = insuranceEdge();
    $('#bInsYes').textContent = bj ? 'Even money' : 'Insurance ' + money(cost);
    $('#bInsNo').textContent = bj ? 'Keep blackjack' : 'No insurance';
    $('#bInsYes').disabled = !bj && !G.canAfford(cost); $('#bInsNo').disabled = false;
    const showAdvice = S.set.coach === 'full';
    $('#insQ').innerHTML = (bj ? 'You have blackjack and the dealer shows an ace. Take even money?' : 'The dealer shows an ace. Insure your bet?') +
      (showAdvice ? `<span class="note">Basic strategy says no: it loses about ${pct(ie.edge, 1)} of what you put on it.</span>` : '');
    $('#bInsNo').classList.toggle('hint', S.set.coach === 'full' || S.set.coach === 'hints');
    return;
  }
  // play
  const can = G.legal(), adv = G.advise();
  const showEv = S.set.coach === 'full', ev = showEv ? G.ev() : null;
  const acts = [...document.querySelectorAll('#playBar .act')];
  const shown = acts.filter(b => b.dataset.a !== 'R' || R.surrender);
  $('#playBar').style.setProperty('--n', shown.length);
  acts.forEach(b => {
    const a = b.dataset.a; b.hidden = a === 'R' && !R.surrender; b.disabled = !can[a];
    b.classList.toggle('hint', (S.set.coach === 'full' || S.set.coach === 'hints') && a === (can[adv.rec.a] ? adv.rec.a : adv.rec.fallback));
    $('#ev' + a).textContent = ev && ev[a] && can[a] ? evTxt(ev[a].ev) : (a === 'D' && adv.ideal.D && !can.D) || (a === 'P' && adv.ideal.P && !can.P) ? 'need chips' : '';
  });
  if (S.set.coach === 'full') {
    const rd2 = G.round, hd = rd2.hands[rd2.active], best = can[adv.rec.a] ? adv.rec.a : adv.rec.fallback;
    const short = !can[adv.rec.a] ? `<span class="note">The chart says ${ACT[adv.rec.a].toLowerCase()}, but you don't have the chips.</span>` : '';
    setCoach(`<span class="lead">${ACT[best]}.</span><span class="why">${esc(why(best, hd.cards, rd2.dealer[0].r, ev))}</span>${short}${compNote(ev, adv.rec.a)}`);
  } else if (lastFb == null) setCoach('');
}
function liveSides() { const ids = sideIds(); return Object.fromEntries(Object.entries(S.sides).filter(([id, v]) => ids.includes(id) && v > 0)); }

// ---------- playback ----------
async function play(events) {
  busy = true; renderControls();
  for (const e of events) await step(e);
  busy = false;
  const rd = G.round;
  if (rd && rd.phase === 'done' && !rd.recorded) { recordRound(rd); rd.recorded = true; if (S.set.coach === 'full' && !lastFb) setCoach(''); }
  save(); renderAll();
}
async function step(e) {
  const rd = G.round;
  switch (e.t) {
    case 'shuffle': setCoach('<span class="lead">New shoe.</span>The dealer shuffles and burns a card.'); sfx.shuffle(); await wait(700); setCoach(''); break;
    case 'card':
      if (e.to === 'p') { V.hands[e.h] = (V.hands[e.h] || 0) + 1; renderHands(e.h); }
      else { V.dealer++; renderDealer(V.dealer - 1); }
      sfx.card(); await wait(rd.phase === 'dealer' || rd.phase === 'done' && e.to === 'd' ? 480 : 330); break;
    case 'flip': V.hidden = false; renderDealer(-1, 1); sfx.card(); await wait(450); break;
    case 'split': V.hands.splice(e.h + 1, 0, 1); V.hands[e.h] = 1; renderHands(); sfx.chip(); await wait(260); break;
    case 'turn': V.active = e.h; renderHands(); await wait(120); break;
    case 'double': sfx.chip(); await wait(160); break;
    case 'peek': if (!e.bj) { $('#dealer').classList.add('peek'); await wait(380); $('#dealer').classList.remove('peek'); } break;
    case 'sides': {
      V.sides = true; renderSpots();
      const won = rd.sideRes.filter(x => x.win); shownBank = BJ.r2(shownBank + rd.sideRes.reduce((a, x) => a + x.ret, 0)); renderTop();
      if (won.length) sfx.win();
      await wait(won.length ? 900 : 450); break;
    }
    case 'insres': shownBank = BJ.r2(shownBank + (rd.insRet || 0)); renderTop();
      if (rd.ins) setCoach(e.win ? `<span class="lead">Insurance pays.</span>The dealer has blackjack: ${money(rd.insRet)} back.` : '<span class="lead">No blackjack.</span>The insurance bet loses.');
      await wait(400); break;
    case 'bust': renderHands(); await wait(260); break;
    case 'surrender': renderHands(); await wait(220); break;
    case 'done': V.done = true; renderHands(); renderDealer(); shownBank = G.bank; renderTop(); showToast(rd); await wait(200); break;
  }
}
let toastT = 0;
function showToast(rd) {
  const t = $('#toast'); const net = rd.net;
  const outs = rd.hands.map(x => x.out);
  const sub = outs.includes('bj') ? 'Blackjack' : rd.dealerBJ ? 'Dealer blackjack' : outs.length === 1 && outs[0] === 'bust' ? 'Bust' :
    rd.hands.some(x => !x.sur && BJ.total(x.cards).total <= 21) && BJ.total(rd.dealer).total > 21 ? 'Dealer busts' : outs.includes('surrender') && outs.length === 1 ? 'Surrendered' : '';
  t.className = 'on ' + (net > 0 ? 'w' : net < 0 ? 'l' : 'p');
  t.innerHTML = (net === 0 ? 'Push' : signed(net)) + (sub ? `<small>${sub}</small>` : '');
  if (net > 0) sfx.win();
  clearTimeout(toastT); toastT = setTimeout(() => t.className = '', 1500);
}

// ---------- actions ----------
let selChip = 5;
function chipTap(v) {
  if (busy || roundLive()) return;
  selChip = v;
  const stake = S.bet + Object.values(liveSides()).reduce((a, b) => a + b, 0);
  if (S.bet + v <= R.max && stake + v <= G.bank + 1e-9) { S.bet += v; sfx.chip(); }
  afterBetChange();
}
function sideTap(i) {
  if (busy || roundLive()) return;
  const id = sideIds()[i]; if (!id) return;
  const cap = Math.min(100, R.max), cur = S.sides[id] || 0, add = Math.min(selChip, 25);
  const stake = S.bet + Object.values(liveSides()).reduce((a, b) => a + b, 0);
  if (cur + add <= cap && stake + add <= G.bank + 1e-9) { S.sides[id] = cur + add; sfx.chip(); }
  else S.sides[id] = 0;     // tapping a full spot clears it
  afterBetChange();
}
function betTap() {
  if (busy || roundLive()) return;
  if (G.round && G.round.phase === 'done') { G.round = null; V = viewFromRound(null); renderAll(); return; }
  if (S.bet) { S.bet = Math.max(0, S.bet - selChip); if (S.bet && S.bet < R.min) S.bet = 0; afterBetChange(); }
}
function afterBetChange() {
  if (G.round && G.round.phase === 'done') { G.round = null; V = viewFromRound(null); renderDealer(); renderHands(); setCoach(''); }
  lastFb = null; save(); renderSpots(); renderControls();
}
function clearBets() { if (busy || roundLive()) return; S.bet = 0; S.sides = {}; afterBetChange(); }
function deal() {
  if (busy || roundLive()) return;
  if ($('#bDeal').dataset.mode === 'refill') { G.bank = BJ.r2(G.bank + 1000); S.stats.refills++; setCoach(''); save(); renderAll(); return; }
  R = rules();
  const sides = liveSides();
  const before = G.bank;
  try { G.start(S.bet, sides); } catch (err) { setCoach(`<span class="lead">Can't deal.</span>${esc(err.message)}.`); return; }
  ac();
  lastFb = null; setCoach('');
  V = { dealer: 0, hidden: true, hands: [0], active: 0, sides: false, done: false };
  shownBank = BJ.r2(before - G.round.staked);
  renderDealer(); renderHands(); renderSpots();
  play(G.take());
}
function feedback(d, cards, up, ev) {
  const mode = S.set.coach; if (mode === 'off') return;
  const chart = d.rec;
  if (d.ok) {
    if (mode === 'think') { lastFb = d; setCoach(`<span class="lead">Right.</span><span class="why">${esc(why(chart, cards, up, ev))}</span>${compNote(ev, d.chart)}`, 'good'); }
    else lastFb = null;
    return;
  }
  lastFb = d;
  const cost = d.cost > 0.0005 ? ` <span class="note">That gave up about ${d.cost.toFixed(2)} per dollar bet, ${money(d.costD, true)} on this hand.</span>` : '';
  setCoach(`<span class="lead">The chart says ${ACT[chart].toLowerCase()}.</span><span class="why">${esc(why(chart, cards, up, ev))}</span>${cost}`, 'bad');
}
function act(a) {
  if (busy || !G.round || G.round.phase !== 'play') return;
  const can = G.legal(); if (!can[a]) return;
  const rd = G.round, hd = rd.hands[rd.active], cards = hd.cards.slice(), up = rd.dealer[0].r, bet = hd.bet, before = rd.staked;
  const ev = G.ev();
  G.act(a);
  const d = rd.decisions[rd.decisions.length - 1];
  if (ev[d.rec] && ev[a]) { d.cost = Math.max(0, ev[d.rec].ev - ev[a].ev); d.costD = BJ.r2(d.cost * bet); d.evA = ev[a].ev; d.evB = ev[d.rec].ev; }
  feedback(d, cards, up, ev);
  shownBank = BJ.r2(shownBank - (rd.staked - before));
  if (a === 'D' || a === 'P') sfx.chip();
  save(); play(G.take());
}
function insure(take) {
  if (busy || !G.round || G.round.phase !== 'insurance') return;
  const rd = G.round, before = rd.staked, ie = insuranceEdge();
  G.insurance(take);
  const d = rd.decisions[rd.decisions.length - 1];
  d.cost = take ? Math.max(0, ie.edge) * (d.a === 'E' ? 1 : .5) : 0; d.costD = BJ.r2(d.cost * rd.bet);
  const mode = S.set.coach;
  if (take && mode !== 'off') { lastFb = d; setCoach(`<span class="lead">Basic strategy never takes ${d.a === 'E' ? 'even money' : 'insurance'}.</span>Only ${Math.round(ie.ten * 100)}% of the unseen cards are tens; it needs 33% to break even.` +
    (S.set.count && G.trueCount >= 3 ? ' <span class="note">At this true count, a counter would take it.</span>' : ''), 'bad'); }
  else if (!take && mode === 'think') { lastFb = d; setCoach('<span class="lead">Right.</span>Insurance loses money unless a third of the unseen cards are tens.', 'good'); }
  shownBank = BJ.r2(shownBank - (rd.staked - before));
  save(); play(G.take());
}

// ---------- stats ----------
function recordRound(rd) {
  const st = S.stats, edge = BJ.houseEdge(R).edge;
  st.rounds++; st.staked = BJ.r2(st.staked + rd.staked); st.net = BJ.r2(st.net + rd.net);
  st.exp -= edge * rd.bet; st.best = Math.max(st.best, rd.net); st.worst = Math.min(st.worst, rd.net);
  for (const hd of rd.hands) {
    st.hands++; st.mainWag += hd.bet;
    const o = hd.out; if (o === 'win' || o === 'bj' || o === 'even') st.win++; else if (o === 'push') st.push++; else st.lose++;
    if (o === 'bj') st.bj++; if (o === 'bust') st.bust++; if (o === 'surrender') st.sur++;
  }
  for (const s of rd.sideRes) {
    const x = st.side[s.id] || (st.side[s.id] = { n: 0, wag: 0, ret: 0, wins: 0, best: 0, exp: 0 });
    x.n++; x.wag += s.amt; x.ret = BJ.r2(x.ret + s.ret); if (s.win) { x.wins++; x.best = Math.max(x.best, s.pay); }
    x.exp -= BJ.sideEdge(s.id, R.decks).edge * s.amt; st.exp -= BJ.sideEdge(s.id, R.decks).edge * s.amt;
  }
  for (const d of rd.decisions) {
    st.dec++; if (d.ok) st.ok++; st.evLost += d.costD || 0;
    const k = st.kinds[d.kind] || (st.kinds[d.kind] = { n: 0, ok: 0 }); k.n++; if (d.ok) k.ok++;
    master(d.key, d.ok);
    if (d.kind !== 'ins') { const c = st.cells[d.key] || (st.cells[d.key] = { n: 0, ok: 0, miss: 0 }); c.n++; if (d.ok) c.ok++; else c.miss = Date.now(); }
  }
  const tb = st.tables[R.id] || (st.tables[R.id] = { name: R.name, rounds: 0, net: 0, wag: 0 });
  tb.rounds++; tb.net = BJ.r2(tb.net + rd.net); tb.wag += rd.bet;
  const pk = c => c.r * 4 + c.s;
  S.hist.unshift({ t: Date.now(), tb: R.name, bet: rd.bet, net: rd.net, d: rd.dealer.map(pk), dbj: rd.dealerBJ, ins: rd.ins, even: rd.even,
    h: rd.hands.map(x => ({ c: x.cards.map(pk), b: x.bet, o: x.out, a: x.acts })),
    s: rd.sideRes.map(x => ({ id: x.id, a: x.amt, n: x.name, r: x.ret })),
    k: rd.decisions.map(x => ({ c: x.cards.map(pk), u: x.up, a: x.a, r: x.rec, ok: x.ok, cost: x.cost || 0 })) });
  if (S.hist.length > 250) S.hist.length = 250;
  SESSION.rounds++; SESSION.net = BJ.r2(SESSION.net + rd.net);
}
const SESSION = { rounds: 0, net: 0, start: Date.now() };

// ---------- table changes (called from sheets.js) ----------
function sitAt(id, custom) {
  if (roundLive()) return false;
  const bank = G.bank;
  S.tableId = id; if (custom) S.custom = custom;
  S.game = null; S.bank = bank; makeGame(false);
  S.bet = Math.min(Math.max(S.bet, R.min), R.max);
  V = viewFromRound(null); lastFb = null; setCoach(''); save(); renderAll();
  return true;
}

// ---------- wiring ----------
function buildRail() {
  const rail = $('#rail'); rail.innerHTML = '';
  CHIPS.forEach(v => { const b = h('button'); b.dataset.v = v; b.setAttribute('aria-label', 'Add ' + money(v));
    const c = h('span', 'chip v' + v, `<span>${v}</span>`); b.appendChild(c); b.onclick = () => chipTap(v); rail.appendChild(b); });
}
function wire() {
  buildRail();
  $('#bDeal').onclick = deal; $('#bClear').onclick = clearBets;
  $('#betSpot').onclick = betTap; $('#side0').onclick = () => sideTap(0); $('#side1').onclick = () => sideTap(1);
  document.querySelectorAll('#playBar .act').forEach(b => b.onclick = () => act(b.dataset.a));
  $('#bInsYes').onclick = () => insure(true); $('#bInsNo').onclick = () => insure(false);
  $('#bMenu').onclick = () => openSheet('menu');
  document.addEventListener('keydown', e => {
    if (!$('#sheet').hidden) { if (e.key === 'Escape') closeSheet(); return; }
    const k = e.key.toLowerCase();
    if (G.round && G.round.phase === 'play') { const m = { h: 'H', s: 'S', d: 'D', p: 'P', r: 'R' }[k]; if (m) { act(m); e.preventDefault(); } }
    else if (G.round && G.round.phase === 'insurance') { if (k === 'y' || k === 'i') insure(true); if (k === 'n') insure(false); }
    else if (k === ' ' || k === 'enter') { deal(); e.preventDefault(); }
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden) save(); else checkBuild(); });
  window.addEventListener('pagehide', save);
}
function checkBuild() {
  if (location.protocol !== 'https:' || busy || roundLive()) return;
  fetch('app.js?vc=' + Date.now(), { cache: 'no-store' }).then(r => r.text()).then(t => {
    const m = t.match(/const BUILD = '([^']+)'/); if (m && m[1] !== BUILD && !busy && !roundLive()) { save(); location.reload(); }
  }).catch(() => {});
}
function boot() {
  makeGame(true);
  const rd = G.round;
  if (rd && rd.phase === 'deal') G.round = null;          // can't happen (deal is synchronous); belt and braces
  V = viewFromRound(G.round);
  if (rd && rd.phase === 'done') rd.recorded = true;
  wire(); renderAll();
  if (roundLive()) setCoach('<span class="lead">Hand restored.</span>You left this hand in play; it is right where you left it.');
  if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});
  setTimeout(checkBuild, 1500);
  window.__bj = () => ({ G, S, V, busy });
}
document.addEventListener('DOMContentLoaded', boot);
