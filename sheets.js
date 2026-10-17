/* Blackjack Navigator — menu screens (one bottom sheet, a page stack). Uses globals from app.js. */
'use strict';
let NAV = [];
const TITLES = { menu: 'Blackjack Navigator', tables: 'Tables', custom: 'Custom table', chart: 'Strategy chart', cell: 'Chart cell', practice: 'Practice', drill: 'Practice',
  count: 'Count drill', stats: 'Stats', history: 'History', round: 'Hand', learn: 'Learn', glossary: 'Glossary', settings: 'Settings' };
function openSheet(page, arg) { NAV = []; go(page, arg); $('#sheet').hidden = false; $('#sheetBack').hidden = false; }
function go(page, arg) { NAV.push([page, arg]); draw(); }
function back() { if (NAV.length > 1) { NAV.pop(); draw(); } else closeSheet(); }
function closeSheet() { $('#sheet').hidden = true; $('#sheetBack').hidden = true; NAV = []; stopCount(); renderAll(); }
function draw() {
  const [page, arg] = NAV[NAV.length - 1];
  $('#sTitle').textContent = TITLES[page] || '';
  $('#sBack').style.visibility = NAV.length > 1 ? 'visible' : 'hidden';
  const body = $('#sheetBody'); body.innerHTML = ''; body.scrollTop = 0;
  stopCount();
  PAGES[page](body, arg);
}
const btn = (label, cls, fn) => { const b = h('button', cls, label); b.onclick = fn; return b; };
const mini = codes => `<span class="mini">${codes.map(n => cardEl({ r: n >> 2, s: n & 3 }).outerHTML).join('')}</span>`;
const miniC = cards => mini(cards.map(c => c.r * 4 + c.s));
function twoTaps(b, label, fn) { let armed = false; b.onclick = () => { if (!armed) { armed = true; b.textContent = 'Tap again to confirm'; setTimeout(() => { armed = false; b.textContent = label; }, 3000); } else fn(); }; }
const suit = () => Math.floor(Math.random() * 4);
const adherence = () => S.stats.dec ? S.stats.ok / S.stats.dec : null;

// mastery: per chart cell, misses and the run of correct answers since the last miss (table + practice)
function master(key, ok) {
  if (!key || key === 'INS' || key === 'bust') return;
  const m = S.mastery || (S.mastery = {}); const x = m[key] || (m[key] = { n: 0, miss: 0, run: 0 });
  x.n++; if (ok) x.run++; else { x.miss++; x.run = 0; }
}
const weakSpots = () => Object.entries(S.mastery || {}).filter(([k, x]) => x.miss && x.run < 3).sort((a, b) => (b[1].miss - b[1].run) - (a[1].miss - a[1].run));

const PAGES = {
  menu(b) {
    const ad = adherence();
    const items = [
      ['tables', 'Tables', `${R.name}, ${pct(BJ.houseEdge(R).edge)} house edge`],
      ['chart', 'Strategy chart', 'Every play for this table'],
      ['practice', 'Practice', S.drill.n ? `${S.drill.n} drilled, ${pct(S.drill.ok / S.drill.n, 0)} right` : 'Drill hands and the count'],
      ['stats', 'Stats', ad == null ? 'Nothing played yet' : `${pct(ad, 1)} by the chart, ${signed(S.stats.net)}`],
      ['history', 'History', S.hist.length ? `${S.hist.length} round${S.hist.length === 1 ? '' : 's'} saved` : 'No rounds yet'],
      ['learn', 'Learn', 'Strategy, the casino, side bets'],
      ['settings', 'Settings', { full: 'Full coaching', hints: 'Hints', think: 'Think first', mistakes: 'Mistakes only', off: 'Coach off' }[S.set.coach]],
    ];
    const m = h('div', 'menu');
    for (const [p, t, s] of items) m.appendChild(btn(`<b>${t}</b><span>${esc(s)}</span>`, '', () => go(p)));
    b.appendChild(m);
    b.appendChild(h('p', 'dim small', '<br>Play money only. For learning and practice.'));
  },

  tables(b) {
    if (roundLive()) b.appendChild(h('p', 'dim', 'Finish this hand to change tables.'));
    for (const p of BJ.PRESETS) b.appendChild(tableCard(p, S.tableId === p.id, () => { if (sitAt(p.id)) closeSheet(); }));
    const c = S.custom ? BJ.makeRules(S.custom) : null;
    const cb = h('button', 'tbl' + (S.tableId === 'custom' ? ' on' : ''), `<div class="h"><b>Custom table</b><span>${c ? '≈ ' + pct(BJ.houseEdge(c).edge) : ''}</span></div>
      <div class="rl">${c ? esc(BJ.rulesLine(c)) : 'Set the decks, dealer rule, payout and options yourself.'}</div>`);
    cb.onclick = () => go('custom'); b.appendChild(cb);
    b.appendChild(h('p', 'dim small', 'House edges are Wizard of Odds figures for these exact rules, with perfect basic strategy. Custom tables show an estimate from the built-in calculator.'));
  },
  custom(b) {
    const c = Object.assign(BJ.makeRules({}), S.custom || {});
    const opts = [
      ['decks', 'Decks', [[1, '1'], [2, '2'], [4, '4'], [6, '6'], [8, '8']]],
      ['h17', 'Soft 17', [[true, 'Dealer hits'], [false, 'Dealer stands']]],
      ['bj', 'Blackjack pays', [[1.5, '3 to 2'], [1.2, '6 to 5'], [1, '1 to 1']]],
      ['doubleOn', 'Double on', [['any', 'Any two'], ['9-11', '9–11'], ['10-11', '10–11']]],
      ['das', 'Double after split', [[true, 'Yes'], [false, 'No']]],
      ['maxSplits', 'Split up to', [[1, '2 hands'], [2, '3 hands'], [3, '4 hands']]],
      ['rsa', 'Resplit aces', [[true, 'Yes'], [false, 'No']]],
      ['surrender', 'Late surrender', [[true, 'Yes'], [false, 'No']]],
    ];
    const edge = h('div', 'tbl on');
    const upd = () => { const r = BJ.makeRules(c); edge.innerHTML = `<div class="h"><b>House edge</b><span>≈ ${pct(BJ.houseEdge(r).edge)}</span></div><div class="rl">${esc(BJ.rulesLine(r))}</div>`; };
    for (const [k, label, vals] of opts) {
      b.appendChild(h('div', 'dim small', label));
      const seg = h('div', 'seg');
      vals.forEach(([v, t]) => { const x = btn(t, c[k] === v ? 'on' : '', () => { c[k] = v; [...seg.children].forEach(y => y.classList.remove('on')); x.classList.add('on'); upd(); }); seg.appendChild(x); });
      b.appendChild(seg);
    }
    upd(); b.appendChild(edge);
    const sit = btn('Sit at this table', 'btn gold', () => { c.pen = c.decks <= 2 ? .65 : .75; c.min = 10; c.max = 500; c.id = 'custom'; c.name = 'Custom Table'; if (sitAt('custom', c)) closeSheet(); });
    sit.disabled = roundLive(); sit.style.width = '100%'; b.appendChild(sit);
  },

  chart(b, sel) {
    b.appendChild(h('p', 'dim small', esc(R.name + ': ' + BJ.rulesLine(R))));
    const lg = h('div', 'legend');
    [['H', 'Hit'], ['S', 'Stand'], ['D', 'Double, or hit'], ['Ds', 'Double, or stand'], ['P', 'Split'], ...(R.surrender ? [['R', 'Surrender, or hit'], ['Rs', 'Surrender, or stand']] : [])]
      .forEach(([c, t]) => lg.insertAdjacentHTML('beforeend', `<span><i class="c-${c}"></i>${t}</span>`));
    b.appendChild(lg);
    const ups = [2, 3, 4, 5, 6, 7, 8, 9, 10, 1];
    const sec = (title, rows) => {
      b.appendChild(h('h3', '', title));
      const g = h('div', 'chart'); g.appendChild(h('div', 'hd', ''));
      ups.forEach(u => g.appendChild(h('div', 'hd', BJ.upLabel(u))));
      for (const [label, kind, v] of rows) {
        g.appendChild(h('div', 'rh', label));
        for (const u of ups) {
          const lab = chartLabel(kind, v, u), key = cellKey(kind, v, u), m = (S.mastery || {})[key];
          const c = btn(lab === 'Ds' || lab === 'Rs' ? lab : lab[0], 'c-' + lab, () => go('cell', { kind, v, u }));
          c.setAttribute('aria-label', `${label} against ${BJ.upLabel(u)}: ${chartWord(lab)}`);
          if (m && m.miss && m.run < 3) c.appendChild(h('i'));
          g.appendChild(c);
        }
      }
      b.appendChild(g);
    };
    sec('Hard totals', [8, 9, 10, 11, 12, 13, 14, 15, 16, 17].map(t => [t === 17 ? '17' : String(t), 'hard', t]));
    b.appendChild(h('p', 'dim small', 'Hard 5 to 7 always hit. Hard 18 and up always stand.'));
    sec('Soft totals', [13, 14, 15, 16, 17, 18, 19, 20].map(t => ['A,' + (t - 11), 'soft', t]));
    sec('Pairs', [2, 3, 4, 5, 6, 7, 8, 9, 10, 1].map(r => [r === 1 ? 'A,A' : r === 10 ? '10s' : r + ',' + r, 'pair', r]));
    b.appendChild(h('p', 'dim small', 'A red dot marks a cell you have missed recently. Tap any cell for the reason and the numbers.'));
  },
  cell(b, { kind, v, u }) {
    const cards = sampleHand(kind, v);
    const can = { H: true, S: true, D: BJ.canDoubleTotal(R, BJ.total(cards).total), P: kind === 'pair', R: R.surrender };
    const rec = BJ.recommend(cards, u, R, can).a;
    const ev = BJ.evActions(cards, u, R, can, [...cards, { r: u, s: 3 }], R.maxSplits);
    const name = kind === 'pair' ? `Pair of ${v === 1 ? 'aces' : v === 10 ? 'tens' : v + 's'}` : `${kind === 'soft' ? 'Soft' : 'Hard'} ${v}`;
    b.appendChild(h('h3', '', `${name} against ${BJ.upLabel(u)}`));
    b.insertAdjacentHTML('beforeend', `<div class="cardline">${miniC(cards)} <span class="dim">vs</span> ${miniC([{ r: u, s: 3 }])}</div>`);
    b.insertAdjacentHTML('beforeend', `<p><b>${ACT[rec]}.</b> ${esc(why(rec, cards, u, ev))}</p>`);
    evRow(b, ev, rec);
    b.insertAdjacentHTML('beforeend', compNote(ev, rec).replace('class="note"', 'class="dim small"'));
    const m = (S.mastery || {})[cellKey(kind, v, u)];
    if (m) b.appendChild(h('p', 'dim small', `You have played this ${m.n} time${m.n === 1 ? '' : 's'}, missed it ${m.miss}${m.miss ? `, ${m.run} right since the last miss` : ''}.`));
    b.appendChild(h('p', 'dim small', 'Expected value per dollar of the original bet, from a full shoe minus the cards shown. Double and split include the extra bet. The dealer has already checked for blackjack.'));
  },

  practice(b) {
    const ws = weakSpots().length;
    const d = S.drill;
    b.appendChild(h('p', 'dim', d.n ? `${d.n} hands drilled, ${pct(d.ok / d.n, 0)} right, best run ${d.best}.` : 'A hand, a dealer card, your call. Instant feedback, no chips at stake.'));
    const m = h('div', 'menu');
    const cats = [['all', 'Any hand', 'Two random cards'], ['hard', 'Hard totals', 'No aces, no pairs'], ['soft', 'Soft hands', 'An ace and a small card'], ['pair', 'Pairs', 'Split or not'],
      ['double', 'Doubles', 'Every spot the chart doubles'], ...(R.surrender ? [['surrender', 'Surrender', 'The close calls on this table']] : []),
      ['weak', 'Your weak spots', ws ? `${ws} cell${ws === 1 ? '' : 's'} you have missed` : 'Nothing missed yet']];
    for (const [id, t, s] of cats) m.appendChild(btn(`<b>${t}</b><span>${s}</span>`, '', () => go('drill', id)));
    m.appendChild(btn(`<b>Count drill</b><span>Keep the Hi-Lo running count${d.cn ? `, ${d.cok}/${d.cn} right` : ''}</span>`, '', () => go('count')));
    b.appendChild(m);
    b.appendChild(h('p', 'dim small', '<br>Drills follow the rules of the table you are sitting at: ' + esc(R.name) + '.'));
  },
  drill(b, cat) {
    const wrap = h('div', 'drill'); b.appendChild(wrap);
    let run = 0, n = 0, ok = 0, cur;
    const next = () => {
      cur = genDrill(cat);
      if (!cur) { wrap.innerHTML = '<p class="dim">No missed spots yet. Play a few hands at the table first.</p>'; return; }
      const { cards, up } = cur;
      wrap.innerHTML = '';
      const dz = h('div', 'dz', '<div class="lab">Dealer</div>'); const dc = h('div', 'cards'); dc.appendChild(cardEl({ r: up, s: suit() })); dz.appendChild(dc);
      const pz = h('div', 'dz'); const pc = h('div', 'cards'); cards.forEach(c => pc.appendChild(cardEl(c))); pz.appendChild(pc);
      pz.appendChild(h('div', 'lab', 'You have ' + totalText(cards).replace('Blackjack', '21')));
      const fb = h('div', 'fb');
      const acts = h('div', 'acts');
      const can = { H: true, S: true, D: BJ.canDoubleTotal(R, BJ.total(cards).total), P: BJ.pairable(cards), R: R.surrender };
      const rec = BJ.recommend(cards, up, R, can);
      ['H', 'S', 'D', 'P', ...(R.surrender ? ['R'] : [])].forEach(a => {
        const x = btn(ACT[a], 'btn', () => answer(a)); x.disabled = !can[a]; x.dataset.a = a; acts.appendChild(x);
      });
      const sc = h('div', 'score num', `<span>Run ${run}</span><span>${n ? Math.round(ok / n * 100) + '% of ' + n : ''}</span>`);
      wrap.append(dz, pz, fb, acts, sc);
      let answered = false;
      function answer(a) {
        if (answered) { next(); return; }
        answered = true; n++; S.drill.n++;
        const right = a === rec.a;
        if (right) { ok++; run++; S.drill.ok++; S.drill.best = Math.max(S.drill.best, run); } else run = 0;
        master(rec.key, right);
        const ev = BJ.evActions(cards, up, R, can, [...cards, { r: up, s: 0 }], R.maxSplits);
        fb.innerHTML = `<b style="color:var(${right ? '--win' : '--amber'})">${right ? 'Right.' : 'The chart says ' + ACT[rec.a].toLowerCase() + '.'}</b> ${esc(why(rec.a, cards, up, ev))}`;
        const er = h('div', 'evrow'); fb.appendChild(er); evRow(er, ev, rec.a, true);
        acts.querySelectorAll('button').forEach(x => { x.disabled = false; if (x.dataset.a === rec.a) x.classList.add('gold'); });
        acts.appendChild(btn('Next hand', 'btn gold', next)).style.gridColumn = '1/-1';
        sc.innerHTML = `<span>Run ${run}</span><span>${Math.round(ok / n * 100)}% of ${n}</span>`;
        save();
        if (right) setTimeout(() => { if (wrap.isConnected && cur && cur.cards === cards) next(); }, S.set.fast ? 650 : 1100);
      }
    };
    next();
  },
  count(b) {
    const wrap = h('div', 'drill'); b.appendChild(wrap);
    const intro = () => {
      wrap.innerHTML = '<p>Cards are dealt a few at a time. Keep the Hi-Lo running count: 2 to 6 are +1, 7 to 9 are 0, tens and aces are −1. At the end, pick the count.</p>';
      const seg = h('div', 'seg'); [[1400, 'Slow'], [900, 'Medium'], [550, 'Fast']].forEach(([ms, t]) => seg.appendChild(btn(t, (S.cntMs || 900) === ms ? 'on' : '', () => { S.cntMs = ms; intro(); })));
      wrap.appendChild(seg);
      wrap.appendChild(btn('Start', 'btn gold', run)).style.width = '100%';
    };
    const run = () => {
      const shoe = new BJ.Shoe(1, 1); const seq = []; const n = 12 + Math.floor(Math.random() * 10);
      let rc = 0; for (let i = 0; i < n; i++) { const c = shoe.draw(); seq.push(c); rc += BJ.hiLo(c.r); }
      wrap.innerHTML = ''; const row = h('div', 'cards'); wrap.appendChild(h('div', 'lab', `${n} cards`)); wrap.appendChild(row);
      let i = 0; const ms = S.cntMs || 900;
      const tick = () => {
        if (!row.isConnected) return;
        if (i >= seq.length) return ask(rc);
        row.innerHTML = ''; const k = Math.min(seq.length - i, 1 + Math.floor(Math.random() * 3));
        for (let j = 0; j < k; j++) { const e = cardEl(seq[i + j]); e.classList.add('enter'); e.style.setProperty('--dx', '0px'); e.style.setProperty('--dy', '-20px'); row.appendChild(e); }
        i += k; COUNT_T = setTimeout(tick, ms * (0.6 + 0.4 * k));
      };
      tick();
    };
    const ask = rc => {
      wrap.innerHTML = '<p>What is the running count?</p>';
      const opts = new Set([rc]); while (opts.size < 4) opts.add(rc + [-3, -2, -1, 1, 2, 3][Math.floor(Math.random() * 6)]);
      const g = h('div', 'cntbtns'); [...opts].sort((a, b) => a - b).forEach(v => g.appendChild(btn((v > 0 ? '+' : '') + v, 'btn', () => {
        S.drill.cn++; if (v === rc) S.drill.cok++; save();
        wrap.innerHTML = `<p><b style="color:var(${v === rc ? '--win' : '--amber'})">${v === rc ? 'Right.' : 'It was ' + (rc > 0 ? '+' : '') + rc + '.'}</b> ${S.drill.cok} of ${S.drill.cn} right so far.</p>`;
        wrap.appendChild(btn('Again', 'btn gold', run)).style.width = '100%';
      })));
      wrap.appendChild(g);
    };
    intro();
  },

  stats(b) {
    const st = S.stats;
    if (!st.rounds) { b.appendChild(h('p', 'dim', 'Play a few hands and your numbers show up here.')); return; }
    const hands = st.hands || 1;
    b.appendChild(h('h3', '', 'This session'));
    b.appendChild(h('p', '', `${SESSION.rounds} round${SESSION.rounds === 1 ? '' : 's'}, ${signed(SESSION.net)}.`));
    b.appendChild(h('h3', '', 'All play'));
    const grid = h('div', 'stat');
    [[st.rounds, 'Rounds'], [pct(st.win / hands, 0), 'Hands won'], [pct(st.push / hands, 0), 'Pushed'], [signed(st.net), 'Net'], [money(st.staked), 'Wagered'], [st.bj, 'Blackjacks']]
      .forEach(([v, l]) => grid.insertAdjacentHTML('beforeend', `<div><b>${v}</b><span>${l}</span></div>`));
    b.appendChild(grid);
    const exp = st.exp, lost = st.evLost, luck = st.net - (exp - lost);
    const l = h('div', 'list');
    l.insertAdjacentHTML('beforeend', `<div><span>Expected with perfect play</span><span class="r">${signed(BJ.r2(exp))}</span></div>`);
    l.insertAdjacentHTML('beforeend', `<div><span>Cost of your mistakes</span><span class="r">${signed(-BJ.r2(lost))}</span></div>`);
    l.insertAdjacentHTML('beforeend', `<div><span>What actually happened</span><span class="r">${signed(st.net)}</span></div>`);
    l.insertAdjacentHTML('beforeend', `<div><span>Luck</span><span class="r">${signed(BJ.r2(luck))}</span></div>`);
    if (st.refills) l.insertAdjacentHTML('beforeend', `<div><span>Top-ups</span><span class="r">${st.refills} × $1,000</span></div>`);
    b.appendChild(l);
    b.appendChild(h('p', 'dim small', 'Expected uses each table’s house edge and each side bet’s edge on what you bet there. Mistake cost is the expected value you gave up, decision by decision.'));
    b.appendChild(h('h3', '', 'Strategy'));
    const ad = adherence();
    b.appendChild(h('p', '', ad == null ? 'No decisions yet.' : `You followed the chart on ${pct(ad, 1)} of ${st.dec} decisions.`));
    const kl = h('div', 'list');
    [['hard', 'Hard totals'], ['soft', 'Soft hands'], ['pair', 'Pairs'], ['ins', 'Insurance']].forEach(([k, t]) => {
      const x = st.kinds[k]; if (x) kl.insertAdjacentHTML('beforeend', `<div><span>${t}</span><span class="r">${pct(x.ok / x.n, 0)} of ${x.n}</span></div>`);
    });
    b.appendChild(kl);
    const ws = weakSpots().slice(0, 8);
    if (ws.length) {
      b.appendChild(h('h3', '', 'Spots to work on'));
      const ml = h('div', 'list');
      ws.forEach(([k, x]) => ml.insertAdjacentHTML('beforeend', `<div><span>${esc(keyName(k))}</span><span class="r">missed ${x.miss}, ${x.run} right since</span></div>`));
      b.appendChild(ml);
      b.appendChild(btn('Drill these', 'btn gold', () => go('drill', 'weak'))).style.cssText = 'width:100%;margin-top:12px';
    }
    const sids = Object.keys(st.side);
    if (sids.length) {
      b.appendChild(h('h3', '', 'Side bets'));
      const sl = h('div', 'list');
      sids.forEach(id => { const x = st.side[id], sb = BJ.sideById(id); sl.insertAdjacentHTML('beforeend',
        `<div><span>${esc(sb.name)}<br><span class="dim small">${x.n} bets, ${x.wins} won${x.best ? ', best ' + x.best + ' to 1' : ''}</span></span><span class="r">${signed(BJ.r2(x.ret - x.wag))}<br><span class="dim small">expected ${signed(BJ.r2(x.exp))}</span></span></div>`); });
      b.appendChild(sl);
    }
    b.appendChild(h('h3', '', 'Tables'));
    const tl = h('div', 'list');
    Object.values(st.tables).forEach(x => tl.insertAdjacentHTML('beforeend', `<div><span>${esc(x.name)}<br><span class="dim small">${x.rounds} rounds</span></span><span class="r">${signed(x.net)}</span></div>`));
    b.appendChild(tl);
    const rs = btn('Reset stats', 'btn ghost danger', null); rs.style.cssText = 'width:100%;margin-top:20px';
    twoTaps(rs, 'Reset stats', () => { S.stats = newStats(); S.mastery = {}; save(); draw(); });
    b.appendChild(rs);
  },
  history(b) {
    if (!S.hist.length) { b.appendChild(h('p', 'dim', 'Rounds you play are listed here, newest first.')); return; }
    const l = h('div', 'list hist');
    S.hist.forEach((x, i) => {
      const t = new Date(x.t), when = t.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) + ' ' + t.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
      const miss = x.k.filter(k => !k.ok).length;
      const row = btn(`<span>${x.h.map(hh => mini(hh.c)).join(' ')} <span class="dim small">vs</span> ${mini(x.d)}<br><span class="dim small">${esc(when)}${miss ? `, ${miss} mistake${miss > 1 ? 's' : ''}` : ''}</span></span><span class="r">${x.net === 0 ? 'Push' : signed(x.net)}</span>`, '', () => go('round', i));
      l.appendChild(row);
    });
    b.appendChild(l);
  },
  round(b, i) {
    const x = S.hist[i]; if (!x) return;
    b.appendChild(h('p', 'dim small', `${esc(x.tb)}, ${new Date(x.t).toLocaleString()}`));
    b.insertAdjacentHTML('beforeend', `<h3>Dealer</h3><div class="cardline">${mini(x.d)} ${esc(totalText(x.d.map(n => ({ r: n >> 2, s: n & 3 })), true))}</div>`);
    x.h.forEach((hh, j) => {
      const [label] = OUT[hh.o] || [hh.o];
      b.insertAdjacentHTML('beforeend', `<h3>${x.h.length > 1 ? 'Hand ' + (j + 1) : 'You'}</h3><div class="cardline">${mini(hh.c)} ${esc(label)}, ${money(hh.b)} bet</div>`);
    });
    if (x.ins) b.appendChild(h('p', '', `Insurance ${money(x.ins)}.`));
    if (x.s.length) b.appendChild(h('p', '', x.s.map(s => `${esc(BJ.sideById(s.id).name)} ${money(s.a)}: ${s.n ? esc(s.n) + ' ' + signed(BJ.r2(s.r - s.a)) : 'no win'}`).join('<br>')));
    if (x.k.length) {
      b.appendChild(h('h3', '', 'Decisions'));
      const l = h('div', 'list');
      x.k.forEach(k => l.insertAdjacentHTML('beforeend', `<div><span>${mini(k.c)} vs ${BJ.upLabel(k.u)}: ${ACT[k.a]}</span><span class="r" style="color:var(${k.ok ? '--win' : '--amber'})">${k.ok ? 'Right' : 'Chart: ' + ACT[k.r]}</span></div>`));
      b.appendChild(l);
    }
    b.appendChild(h('p', '', `<br>Net ${signed(x.net)}.`));
  },

  learn(b) {
    for (const sec of CONTENT.sections) {
      b.appendChild(h('h3', '', esc(sec.title)));
      for (const t of sec.topics) {
        const d = h('div', 'topic' + (S.read[t.id] ? ' read' : ''));
        const head = btn(esc(t.title), '', () => { d.classList.toggle('open'); if (!S.read[t.id]) { S.read[t.id] = 1; save(); }
          if (t.side && !body.dataset.done) { body.dataset.done = 1; body.appendChild(sideTable(t.side)); } });
        const body = h('div', 'body', t.body.split('\n\n').map(p => `<p>${esc(p)}</p>`).join(''));
        d.append(head, body); b.appendChild(d);
      }
    }
    b.appendChild(btn('Glossary of terms', 'btn', () => go('glossary'))).style.cssText = 'width:100%;margin-top:18px';
    b.appendChild(h('p', 'dim small', '<br>Problem gambling help: 1-800-GAMBLER (US), any time.'));
  },
  glossary(b) {
    const inp = h('input', 'search'); inp.placeholder = 'Search terms'; inp.type = 'search'; b.appendChild(inp);
    const list = h('div'); b.appendChild(list);
    const show = q => {
      list.innerHTML = ''; let cat = '';
      CONTENT.glossary.filter(g => !q || (g.term + ' ' + g.def).toLowerCase().includes(q)).sort((a, c) => a.cat.localeCompare(c.cat) || a.term.localeCompare(c.term)).forEach(g => {
        if (g.cat !== cat && !q) { cat = g.cat; list.appendChild(h('h3', '', esc(cat))); }
        list.appendChild(h('div', 'gl', `<b>${esc(g.term)}</b><p>${esc(g.def)}</p>`));
      });
    };
    inp.oninput = () => show(inp.value.trim().toLowerCase()); show('');
  },

  settings(b) {
    b.appendChild(h('h3', '', 'Coach'));
    const modes = [['full', 'Full', 'The right play, the reason and the expected value of every option, before you act.'], ['hints', 'Hints', 'Outlines the right button. No words.'],
      ['think', 'Think first', 'Decide first. The coach tells you after whether you matched the chart, and why.'], ['mistakes', 'Mistakes', 'Silent until you slip.'], ['off', 'Off', 'A plain game. Adherence is still tracked.']];
    const seg = h('div', 'seg'); const desc = h('p', 'dim small');
    modes.forEach(([id, t, d]) => seg.appendChild(btn(t, S.set.coach === id ? 'on' : '', () => { S.set.coach = id; lastFb = null; setCoach(''); save(); draw(); })));
    desc.textContent = modes.find(m => m[0] === S.set.coach)[2];
    b.append(seg, desc);
    const tog = (label, sub, key, after) => {
      const o = h('div', 'opt', `<div class="l"><b>${label}</b><span>${sub}</span></div>`);
      const t = btn('', 'tog' + (S.set[key] ? ' on' : ''), () => { S.set[key] = !S.set[key]; t.classList.toggle('on', S.set[key]); if (after) after(); save(); });
      t.setAttribute('role', 'switch'); t.setAttribute('aria-checked', S.set[key]); t.setAttribute('aria-label', label);
      o.appendChild(t); b.appendChild(o);
    };
    tog('Show the count', 'Hi-Lo running and true count in the top bar', 'count');
    tog('Fast dealing', 'Shorter pauses between cards', 'fast');
    tog('Sound', 'Cards and chips. Follows the silent switch.', 'sound');
    b.appendChild(h('h3', '', 'Side bets on the felt'));
    b.appendChild(h('p', 'dim small', 'Pick up to two. Tap a side spot to add a chip; tap it when full to clear it.'));
    const sl = h('div', 'list');
    BJ.SIDE.forEach(sb => {
      const on = S.set.sides.includes(sb.id), avail = R.decks >= sb.minDecks, e = BJ.sideEdge(sb.id, Math.max(sb.minDecks, R.decks)).edge;
      const row = btn(`<span>${esc(sb.name)}<br><span class="dim small">${avail ? pct(e) + ' house edge here' : 'Needs ' + sb.minDecks + '+ decks'}</span></span><span class="r">${on ? 'On' : ''}</span>`, '', () => {
        if (on) S.set.sides = S.set.sides.filter(x => x !== sb.id); else { S.set.sides.push(sb.id); if (S.set.sides.length > 2) S.set.sides.shift(); }
        save(); draw();
      });
      sl.appendChild(row);
    });
    b.appendChild(sl);
    b.appendChild(h('h3', '', 'Chips'));
    b.appendChild(h('p', '', `Bank ${money(G.bank)}${S.stats.refills ? `, topped up ${S.stats.refills} time${S.stats.refills > 1 ? 's' : ''}` : ''}.`));
    const add = btn('Add $1,000', 'btn', () => { G.bank = BJ.r2(G.bank + 1000); S.stats.refills++; save(); draw(); }); add.style.width = '100%'; b.appendChild(add);
    const wipe = btn('Erase everything', 'btn ghost danger', null); wipe.style.cssText = 'width:100%;margin-top:10px';
    twoTaps(wipe, 'Erase everything', () => { wiping = true; localStorage.removeItem(KEY); location.reload(); });
    b.appendChild(wipe);
    b.appendChild(h('p', 'dim small', `<br>Build ${BUILD}. Saved on this device only.`));
  },
};

// ---------- helpers ----------
function tableCard(p, on, fn) {
  const e = BJ.houseEdge(p).edge;
  const c = h('button', 'tbl' + (on ? ' on' : ''), `<div class="h"><b>${esc(p.name)}</b><span>${pct(e)}</span></div><div class="rl">${esc(BJ.rulesLine(p))}, ${money(p.min)}–${money(p.max)}</div><p>${esc(p.blurb)}</p>`);
  c.onclick = fn; c.disabled = roundLive(); return c;
}
function chartLabel(kind, v, u) {
  const code = BJ.chartCode(R, kind, v, u);
  const t = kind === 'pair' ? (v === 1 ? 12 : BJ.val(v) * 2) : v;
  const canD = BJ.canDoubleTotal(R, kind === 'pair' ? t : v);
  switch (code) {
    case 'H': return 'H'; case 'S': return 'S'; case 'P': return 'P';
    case 'Dh': return canD ? 'D' : 'H'; case 'Ds': return canD ? 'Ds' : 'S';
    case 'Qh': return R.das ? 'P' : 'H'; case 'Qd': return R.das ? 'P' : (canD ? 'D' : 'H'); case 'Qs': return R.das ? 'P' : 'S';
    case 'Rh': return R.surrender ? 'R' : 'H'; case 'Rs': return R.surrender ? 'Rs' : 'S'; case 'Rp': return R.surrender ? 'R' : 'P';
  }
  return 'S';
}
const chartWord = l => ({ H: 'hit', S: 'stand', D: 'double, or hit', Ds: 'double, or stand', P: 'split', R: 'surrender, or hit', Rs: 'surrender, or stand' }[l]);
const cellKey = (kind, v, u) => (kind === 'hard' ? 'H' + v : kind === 'soft' ? 'S' + v : 'P' + BJ.short(v)) + 'v' + BJ.short(u);
function keyName(k) {
  const m = k.match(/^([HSP])(\w+)v(\w)$/); if (!m) return k;
  const u = m[3] === 'T' ? '10' : m[3];
  if (m[1] === 'P') return `Pair of ${m[2] === 'A' ? 'aces' : m[2] === 'T' ? 'tens' : m[2] + 's'} vs ${u}`;
  return `${m[1] === 'S' ? 'Soft' : 'Hard'} ${m[2]} vs ${u}`;
}
function sampleHand(kind, v) {
  const s1 = suit(), s2 = (s1 + 1 + Math.floor(Math.random() * 3)) % 4;
  if (kind === 'pair') return [{ r: v, s: s1 }, { r: v === 10 ? [10, 11, 12, 13][Math.floor(Math.random() * 4)] : v, s: s2 }];
  if (kind === 'soft') return [{ r: 1, s: s1 }, { r: v - 11, s: s2 }];
  const opts = []; for (let a = 2; a <= 10; a++) { const b = v - a; if (b >= 2 && b <= 10 && b !== a && a < b + 1) opts.push([a, b]); }
  if (!opts.length) { const a = Math.floor(v / 2), b = v - a; return [{ r: a, s: s1 }, { r: b, s: s2 }]; }
  const [a, b] = opts[Math.floor(Math.random() * opts.length)];
  return [{ r: b === 10 ? 10 + Math.floor(Math.random() * 4) : b, s: s1 }, { r: a, s: s2 }];
}
function randUp() { const r = 1 + Math.floor(Math.random() * 13); return r > 10 ? 10 : r; }
function genDrill(cat) {
  for (let tries = 0; tries < 400; tries++) {
    let cards, up = randUp();
    if (cat === 'weak') {
      const ws = weakSpots(); if (!ws.length) return null;
      const [k] = ws[Math.floor(Math.random() * Math.min(ws.length, 6))];
      const m = k.match(/^([HSP])(\w+)v(\w)$/); if (!m) continue;
      const toR = x => x === 'A' ? 1 : x === 'T' ? 10 : +x;
      up = toR(m[3]); const v = m[1] === 'P' ? toR(m[2]) : +m[2];
      cards = sampleHand(m[1] === 'P' ? 'pair' : m[1] === 'S' ? 'soft' : 'hard', v);
      if (m[1] === 'S' && v === 12) cards = [{ r: 1, s: 0 }, { r: 1, s: 2 }];
      return { cards, up };
    }
    if (cat === 'hard') { const t = 5 + Math.floor(Math.random() * 15); cards = sampleHand('hard', t); }
    else if (cat === 'soft') cards = sampleHand('soft', 13 + Math.floor(Math.random() * 8));
    else if (cat === 'pair') cards = sampleHand('pair', 1 + Math.floor(Math.random() * 10));
    else cards = [{ r: 1 + Math.floor(Math.random() * 13), s: suit() }, { r: 1 + Math.floor(Math.random() * 13), s: suit() }];
    if (BJ.natural(cards)) continue;
    const t = BJ.total(cards).total;
    if (!BJ.pairable(cards) && cards[0].r === cards[1].r) continue;
    const can = { H: true, S: true, D: BJ.canDoubleTotal(R, t), P: BJ.pairable(cards), R: R.surrender };
    const a = BJ.recommend(cards, up, R, can).a;
    if (cat === 'double' && a !== 'D') continue;
    if (cat === 'surrender' && a !== 'R' && !(R.surrender && t >= 14 && t <= 17 && !BJ.total(cards).soft && (up === 1 || up >= 9) && Math.random() < .35)) continue;
    if (cat === 'all' && t >= 19 && Math.random() < .7) continue;     // fewer trivial stands
    return { cards, up };
  }
  return { cards: sampleHand('hard', 16), up: 10 };
}
function evRow(box, ev, rec, inline) {
  const row = inline ? box : h('div', 'evrow');
  const best = Object.keys(ev).reduce((x, y) => ev[x].ev >= ev[y].ev ? x : y);
  ['H', 'S', 'D', 'P', 'R'].filter(a => ev[a]).forEach(a => row.insertAdjacentHTML('beforeend', `<span class="${a === best ? 'best' : ''}">${ACT[a]} ${evTxt(ev[a].ev)}</span>`));
  if (!inline) box.appendChild(row);
}
function sideTable(id) {
  const sb = BJ.sideById(id), wrap = h('div');
  const d = Math.max(R.decks, sb.minDecks);
  wrap.insertAdjacentHTML('beforeend', `<p class="dim small">Paytable at ${d} decks</p>`);
  wrap.insertAdjacentHTML('beforeend', `<table class="pay">${sb.pays(d).map(([n, p]) => `<tr><td>${esc(n)}</td><td>${p} to 1</td></tr>`).join('')}</table>`);
  const rows = [1, 2, 4, 6, 8].filter(x => x >= sb.minDecks).map(x => { const e = BJ.sideEdge(id, x); return `<tr><td>${x} deck${x > 1 ? 's' : ''}</td><td>${pct(e.edge)} edge, wins ${pct(e.hit, 1)} of bets</td></tr>`; });
  wrap.insertAdjacentHTML('beforeend', `<table class="pay">${rows.join('')}</table><p class="dim small">Computed exactly from every card combination.</p>`);
  return wrap;
}
let COUNT_T = 0; function stopCount() { clearTimeout(COUNT_T); }

$('#sBack').onclick = back; $('#sClose').onclick = closeSheet; $('#sheetBack').onclick = closeSheet;
