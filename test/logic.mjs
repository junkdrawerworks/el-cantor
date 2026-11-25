// The game's logic, checked without a browser:  node test/logic.mjs  (a few seconds; npm test runs it first)
// The juegos' rules across many names, every winning shape against a checker written out from the rules on the screen
// (with doubles, and a card called twice), when a printed tabla first won, the random tablas' rules, and the shuffle's
// fairness. It loads deck.js as the pages do, and takes the functions it checks out of the pages' own source.
// To run some of the checks only, name them:  node test/logic.mjs shuffle
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = f => readFileSync(join(root, f), 'utf8');
// A fresh deck.js each time, so a juego is built from nothing, as on a phone that just opened the page.
function loadDeck() {
  const box = { window: {}, document: { currentScript: null } };
  vm.runInNewContext(read('deck.js'), box);
  return box.window.Loteria;
}
// A named function's source, out of a page's script (up to its matching brace).
function fn(html, name) {
  const i = html.indexOf('function ' + name + '(');
  assert.ok(i >= 0, 'no function ' + name + ' in the page');
  for (let k = html.indexOf('{', i), depth = 0; k < html.length; k++) {
    if (html[k] === '{') depth++;
    else if (html[k] === '}' && !--depth) return html.slice(i, k + 1);
  }
  throw new Error('function ' + name + ' never ends');
}
const plain = x => JSON.parse(JSON.stringify(x)); // arrays made in the vm, as this file's own
// The same random numbers every run (mulberry32), so a failure can be run again.
function seeded(seed) {
  let a = seed;
  return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
const DECK = Array.from({ length: 54 }, (_, i) => i + 1);
// Chi-square to an approximate z (Wilson–Hilferty). A fair source gives |z| under 3 nearly always; the checks fail
// only past 5, so they never fail by chance, and a biased one lands in the hundreds.
const zOf = (x, df) => ((x / df) ** (1 / 3) - (1 - 2 / (9 * df))) / Math.sqrt(2 / (9 * df));

const checks = [];
function check(name, run) { checks.push({ name, run }); }

// ---------------------------------------------------------------- juegos
// Every way to make Clásico: the rows, columns and diagonals, the corners, and the 2×2 blocks.
const FOURS = [];
for (let r = 0; r < 4; r++) FOURS.push([r * 4, r * 4 + 1, r * 4 + 2, r * 4 + 3]);
for (let c = 0; c < 4; c++) FOURS.push([c, c + 4, c + 8, c + 12]);
FOURS.push([0, 5, 10, 15], [3, 6, 9, 12], [0, 3, 12, 15]);
for (const b of [0, 1, 2, 4, 5, 6, 8, 9, 10]) FOURS.push([b, b + 1, b + 4, b + 5]);

check('juegos: 100 tablas each of 16 different cards, no two alike, every card as often as another, and no Clásico four printed twice', () => {
  const L = loadDeck();
  for (const name of ['CANELA', 'CAJETA', 'ELOTE', 'TAMAL', 'MARK', 'X', 'NAVIDAD2026']) {
    const J = plain(L.juego(name, 100)), sets = new Set(), fours = new Map();
    assert.equal(J.length, 100, name);
    J.forEach((t, i) => {
      const k = name + ' ' + (i + 1);
      assert.equal(t.length, 16, k + ' has ' + t.length + ' squares');
      assert.ok(t.every(n => Number.isInteger(n) && n >= 1 && n <= 54), k + ' has a card that isn’t one: ' + t);
      assert.equal(new Set(t).size, 16, k + ' has a card twice: ' + t);
      const set = t.slice().sort((a, b) => a - b).join();
      assert.ok(!sets.has(set), k + ' has the same cards as an earlier tabla');
      sets.add(set);
      // No four cards that make Clásico on this tabla make it on an earlier one too, so one call never wins twice.
      for (const s of FOURS) {
        const four = s.map(c => t[c]).sort((a, b) => a - b).join();
        assert.ok(!fours.has(four) || fours.get(four) === i, k + ' wins Clásico with the same four cards as tabla ' + (fours.get(four) + 1));
        fours.set(four, i);
      }
    });
    // The deck is dealt out evenly: over any first n tablas, no card is printed more than once more than another.
    for (const n of [27, 54, 100]) {
      const count = new Array(55).fill(0);
      J.slice(0, n).forEach(t => t.forEach(c => count[c]++));
      const c = count.slice(1);
      assert.ok(Math.max(...c) - Math.min(...c) <= 1, name + ' 1–' + n + ' prints a card ' + Math.max(...c) + ' times and another ' + Math.min(...c));
    }
  }
});

check('juegos: a tabla is the same however it’s asked for, and the name is read without accents, case or spaces', () => {
  const want = plain(loadDeck().juego('CAJETA', 20));
  const A = loadDeck(); // tabla by tabla, out of order
  for (const k of [20, 3, 13, 1, 7]) assert.deepEqual(plain(A.juegoTabla('CAJETA', k)), want[k - 1], 'CAJETA ' + k + ' asked for out of order');
  const B = loadDeck(); B.juego('CAJETA', 2); B.juego('CAJETA', 9); // grown in steps
  assert.deepEqual(plain(B.juego('CAJETA', 20)), want);
  const C = loadDeck(), t = C.juegoTabla('CAJETA', 7); t[0] = 99; C.juego('CAJETA', 20)[6][1] = 99; // changing what came back
  assert.deepEqual(plain(C.juegoTabla('CAJETA', 7)), want[6], 'a tabla handed out was changed through the copy');
  for (const [typed, name] of [['cajeta', 'CAJETA'], ['Cájeta', 'CAJETA'], [' ca je ta ', 'CAJETA'], ['Buñuelo', 'BUNUELO'], ['CANELA-1', 'CANELA1'], ['ABCDEFGHIJKLMNOP', 'ABCDEFGHIJKL']]) assert.equal(C.juegoName(typed), name, typed);
  assert.deepEqual(plain(C.juegoTabla('cájeta', 13)), want[12]);
  for (const k of [0, -1, 1000, NaN, null, undefined]) assert.equal(C.juegoTabla('CAJETA', k), null, 'tabla ' + k);
  for (const bad of ['', '!!!', '   ']) assert.equal(C.juego(bad, 3).length, 0, 'a juego named “' + bad + '”');
});

// ---------------------------------------------------------------- winning shapes
// Written out from the shapes as the game picker draws them, not from deck.js.
const R4 = [[0, 1, 2, 3], [4, 5, 6, 7], [8, 9, 10, 11], [12, 13, 14, 15]], C4 = [[0, 4, 8, 12], [1, 5, 9, 13], [2, 6, 10, 14], [3, 7, 11, 15]];
const SHAPES = {
  linea: [...R4, ...C4, [0, 5, 10, 15], [3, 6, 9, 12]], esquinas: [[0, 3, 12, 15]], centro: [[5, 6, 9, 10]],
  cuadro: [0, 1, 2, 4, 5, 6, 8, 9, 10].map(b => [b, b + 1, b + 4, b + 5]),
  ele: [[0, 4, 8, 12, 13, 14, 15]], equis: [[0, 5, 10, 15, 3, 6, 9, 12]], marco: [[0, 1, 2, 3, 4, 7, 8, 11, 12, 13, 14, 15]],
  rieles: [[4, 5, 6, 7, 8, 9, 10, 11]], escalera: [[1, 2, 5, 6, 9, 10, 13, 14]], llena: [DECK.slice(0, 16).map(n => n - 1)],
};
// The shapes a tabla has made, and the fewest squares still to cover for any of them. Siete Loco is any seven squares.
function wins(t, called, ids) {
  const marked = t.map(called), won = new Set();
  for (const id of ids) {
    if (id === 'siete') { if (marked.filter(Boolean).length >= 7) won.add(id); }
    else if (SHAPES[id].some(s => s.every(c => marked[c]))) won.add(id);
  }
  return won;
}
function fewest(t, called, ids) {
  let need = Infinity;
  for (const id of ids) {
    if (id === 'siete') need = Math.min(need, Math.max(0, 7 - t.filter(called).length));
    else for (const s of SHAPES[id]) need = Math.min(need, s.filter(c => !called(t[c])).length);
  }
  return need;
}

check('shapes: Loteria.check and closest agree with the rules on every shape and mix, with doubles and a card called twice', () => {
  const L = loadDeck(), rnd = seeded(12345), ri = n => Math.floor(rnd() * n);
  const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = ri(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const SINGLE = Object.keys(SHAPES).concat('siete');
  assert.deepEqual(plain(L.PATS.filter(p => !p.combo).map(p => p.id)).sort(), SINGLE.slice().sort(), 'the shapes in deck.js');
  const games = [plain(L.CLASICO), ...SINGLE.map(id => [id])];
  for (let i = 0; i < 40; i++) { games.push(shuffle(SINGLE).slice(0, 2 + ri(3))); games.push(plain(L.CLASICO).concat(shuffle(SINGLE.filter(id => L.CLASICO.indexOf(id) < 0)).slice(0, 1 + ri(2)))); }
  // A tabla with no double, one double anywhere, or two or three (the family rule allows a card twice).
  const tabla = kind => {
    const d = shuffle(DECK), t = d.slice(0, 16);
    if (kind === 1) { const at = ri(16); t.splice(at, 1); t.splice(ri(16), 0, t[ri(15)]); }
    if (kind === 2) { const sq = shuffle([...Array(16).keys()]); for (let k = 0; k < 2 + ri(2); k++) t[sq[2 * k]] = t[sq[2 * k + 1]]; }
    return t;
  };
  let cases = 0;
  for (let round = 0; round < 1500; round++) {
    const t = tabla(round % 3), out = shuffle(DECK).slice(0, ri(44));
    if (out.length && round % 5 === 0) out.push(out[0]); // read out twice
    const set = new Set(out), called = n => set.has(n);
    for (const ids of games) {
      cases++;
      const what = JSON.stringify({ tabla: t, called: out, game: ids });
      const hits = L.check(t, called, ids), want = wins(t, called, ids);
      assert.deepEqual(plain(hits.map(h => h.pat.id)).sort(), [...want].sort(), 'check: ' + what);
      for (const h of hits) {
        assert.ok(h.cells.every(c => called(t[c])), 'check names a square not called: ' + what);
        assert.ok(h.pat.id === 'siete' ? h.cells.length >= 7 : SHAPES[h.pat.id].some(s => s.join() === h.cells.join()), 'check names squares that aren’t the shape: ' + what);
      }
      const near = L.closest(t, called, ids);
      assert.equal(near.need, fewest(t, called, ids), 'closest: ' + what);
      assert.equal(near.need === 0, want.size > 0, 'closest and check disagree: ' + what);
      if (!near.pat.min) assert.deepEqual(plain(near.missing), plain(near.cells).filter(c => !called(t[c])), 'closest’s missing squares: ' + what);
    }
  }
  assert.ok(cases > 100000, cases + ' cases');
});

check('shapes: the fewest squares each game wins with, which card by card goes by', () => {
  // Every set of squares on a tabla of 16 different cards, the smallest that wins by the rules written out above.
  // Card by card says a tabla with fewer cards than half of these can't have won yet, a card covering two at most.
  const L = loadDeck(), t = DECK.slice(0, 16), SINGLE = Object.keys(SHAPES).concat('siete');
  const games = [plain(L.CLASICO), ...SINGLE.map(id => [id]), ['ele', 'llena'], ['marco', 'rieles'], ['siete', 'equis'], plain(L.CLASICO).concat('siete')];
  for (const ids of games) {
    let least = 99;
    for (let m = 1; m < 1 << 16; m++) {
      let k = 0; for (let b = m; b; b &= b - 1) k++;
      if (k < least && wins(t, n => m >> (n - 1) & 1, ids).size) least = k;
    }
    assert.equal(L.squaresNeeded(ids), least, JSON.stringify(ids));
  }
  assert.equal(L.squaresNeeded(['llena']), 16);
});

check('search: every card is found first by its name or number, with or without its El or La, for Enter to pick', () => {
  // "sol" is in El Soldado and "rana" in La Araña: the card the search names comes first all the same.
  const L = loadDeck();
  for (const c of L.CARDS) {
    const bare = c.name.replace(/^(El|La|Las|Los) /, '');
    for (const q of [c.name, c.name.toLowerCase(), bare, bare.toUpperCase(), String(c.n), ' ' + bare + ' ']) {
      const f = L.findCards(q);
      assert.ok(f.exact && f.cards[0].n === c.n, `“${q}” finds ${f.cards.slice(0, 3).map(x => x.name).join(', ')} first, not ${c.name}`);
    }
  }
  const names = q => plain(L.findCards(q).cards.map(c => c.name));
  assert.deepEqual(names('sol'), ['El Sol', 'El Soldado']);
  assert.deepEqual(names('rana'), ['La Rana', 'La Araña']);
  assert.deepEqual(names('lu'), ['La Luna', 'La Chalupa']); // a name that starts with it first
  assert.equal(L.findCards('la').exact, false, '“la” names no card');
  assert.equal(L.findCards('').cards.length, 54);
  assert.deepEqual(names('zz'), []);
});

// ---------------------------------------------------------------- when a printed tabla first won
check('cantor: when a tabla first won is the card that finished its earliest shape, call by call', () => {
  const html = read('cantor.html'), L = loadDeck(), C = { order: [], pos: 0 };
  const page = new Function('C', 'L', [fn(html, 'orderOf'), fn(html, 'isOut'), fn(html, 'wonAt'), 'return { wonAt };'].join('\n'))(C, L);
  // As the checker does it (printed() in cantor.html): the earliest win among the game's shapes.
  const earliest = t => { let best = null; C.patterns.forEach(id => { const p = L.pat(id), w = page.wonAt(t, p); if (w && (!best || w.when < best.when)) best = { when: w.when, cells: w.cells, id }; }); return best; };
  const rnd = seeded(99), ri = n => Math.floor(rnd() * n);
  const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = ri(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const SINGLE = L.PATS.filter(p => !p.combo).map(p => p.id), tablas = plain(L.juego('CANELA', 40).concat(L.juego('LAB', 40)));
  for (let round = 0; round < 4000; round++) {
    C.order = shuffle(DECK); C.pos = ri(55);
    C.patterns = round % 3 === 0 ? L.CLASICO.slice() : round % 3 === 1 ? [SINGLE[ri(SINGLE.length)]] : shuffle(SINGLE).slice(0, 2 + ri(3));
    let t = tablas[ri(tablas.length)];
    if (round % 4 === 0) { t = t.slice(); t[6] = t[5]; } // a double, as on a hand-made tabla
    // Call by call: the first card after which the tabla wins.
    let first = null;
    for (let k = 1; k <= C.pos && !first; k++) { const out = new Set(C.order.slice(0, k)), h = L.check(t, n => out.has(n), C.patterns); if (h.length) first = { when: k, ids: h.map(x => x.pat.id) }; }
    const got = earliest(t), what = JSON.stringify({ tabla: t, order: C.order, pos: C.pos, game: C.patterns });
    if (!first) { assert.equal(got, null, 'a win nobody made: ' + what); continue; }
    assert.ok(got, 'a win missed: ' + what);
    assert.equal(got.when, first.when, 'won on the wrong card: ' + what);
    assert.ok(first.ids.includes(got.id), 'won with a shape it didn’t make then: ' + what);
    assert.ok(got.cells.every(c => C.order.indexOf(t[c]) < got.when), 'outlines a square called later: ' + what);
  }
});

// ---------------------------------------------------------------- Línea on some of its lines
// The ten lines as the picker draws them: rows from the top, columns from the left, then the diagonal from the top
// left and the one from the top right. Written out here, not taken from deck.js.
const LINE10 = [...R4, ...C4, [0, 5, 10, 15], [3, 6, 9, 12]];

check('lines: every set of Línea’s lines has one id, read back the same, and only that id is a game', () => {
  const L = loadDeck();
  assert.deepEqual(plain(L.LINES), LINE10, 'Línea’s lines in deck.js');
  const ids = new Set();
  for (let m = 1; m < 1 << 10; m++) {
    const ls = [...Array(10).keys()].filter(i => m >> i & 1), id = L.lineId(ls.slice().reverse().concat(ls)); // in any order, twice
    assert.equal(id, m === 1023 ? 'linea' : 'linea-' + ls.join(''), JSON.stringify(ls));
    assert.deepEqual(plain(L.linesOf(id)), ls, id);
    assert.ok(L.pat(id), id + ' isn’t a game');
    assert.ok(L.isLinea(id));
    ids.add(id);
  }
  assert.equal(ids.size, 1023);
  assert.equal(L.lineId([]), 'linea', 'no lines is any line');
  for (const bad of ['linea-', 'linea-10', 'linea-00', 'linea-0123456789', 'linea-a', 'linea-0 ', 'lineas', 'linea-9-0', 'esquinas-0'])
    assert.equal(L.pat(bad), undefined, bad + ' is taken for a game');
  // The names: one line by its place, a few sets by theirs, the rest by how many.
  const name = id => L.pat(id).name;
  assert.deepEqual(['linea-0', 'linea-3', 'linea-4', 'linea-7', 'linea-1', 'linea-6', 'linea-8', 'linea-9'].map(name), ['Top line', 'Bottom line', 'Left line', 'Right line', 'Second row', 'Third column', 'Left diagonal', 'Right diagonal']);
  assert.deepEqual(['linea-0123', 'linea-4567', 'linea-89', 'linea-01234567', 'linea-03', 'linea-0478'].map(name), ['Any row', 'Any column', 'Either diagonal', 'Línea, no diagonals', 'Línea · 2 lines', 'Línea · 4 lines']);
  assert.equal(L.pat('linea').name, 'Línea');
  assert.equal(L.gameName(['linea-0']), 'Top line');
  // The diagram shows the lines that count: their squares.
  assert.deepEqual(plain(L.pat('linea-03').show), [0, 1, 2, 3, 12, 13, 14, 15]);
  // Holding Línea on a game that already plays some of its lines adds nothing, and Clásico already wins with any line.
  const g = ['linea-0'];
  L.holdShape(g, 'linea'); assert.deepEqual(plain(g), ['linea-0']);
  L.holdShape(g, 'esquinas'); assert.deepEqual(plain(g), ['linea-0', 'esquinas']);
  const c = L.CLASICO.slice(); L.holdShape(c, 'linea'); assert.deepEqual(plain(c), plain(L.CLASICO));
  assert.equal(L.lineaIn(L.CLASICO), 'linea');
  assert.equal(L.lineaIn(['esquinas', 'linea-37']), 'linea-37');
});

check('lines: check, closest, the fewest squares and when a tabla first won agree with a brute force on any set of lines', () => {
  const L = loadDeck(), rnd = seeded(4242), ri = n => Math.floor(rnd() * n);
  const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = ri(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const html = read('cantor.html'), C = { order: [], pos: 0 };
  const page = new Function('C', 'L', [fn(html, 'orderOf'), fn(html, 'isOut'), fn(html, 'wonAt'), 'return { wonAt };'].join('\n'))(C, L);
  let cases = 0;
  for (let round = 0; round < 6000; round++) {
    // Any set of lines: often one of the quick ones, else any of the 1023.
    const quick = [[0], [3], [4], [7]], ls = round % 4 === 0 ? quick[ri(4)] : (() => { let m = 1 + ri(1023); return [...Array(10).keys()].filter(i => m >> i & 1); })();
    const id = L.lineId(ls), lines = ls.map(i => LINE10[i]);
    // A tabla of 16 cards, with a double now and then.
    const t = shuffle(DECK).slice(0, 16); if (round % 3 === 0) t[ri(16)] = t[ri(16)];
    const out = shuffle(DECK).slice(0, ri(50)), set = new Set(out), called = n => set.has(n);
    const game = round % 5 === 0 ? [id, 'esquinas'] : [id], other = round % 5 === 0 ? [[0, 3, 12, 15]] : [];
    const ways = lines.concat(other), what = JSON.stringify({ lines: ls, game, tabla: t, called: out });
    // check: won exactly when some line that counts (or the other shape) is all called, and names one of them.
    const brute = ways.filter(w => w.every(c => called(t[c])));
    const hits = L.check(t, called, game);
    assert.equal(hits.length > 0, brute.length > 0, 'check: ' + what);
    for (const h of hits) assert.ok(ways.some(w => w.join() === h.cells.join()) && h.cells.every(c => called(t[c])), 'check names squares that aren’t a line that counts: ' + what);
    // closest: the fewest squares still to cover on any way that counts.
    const near = L.closest(t, called, game), need = Math.min(...ways.map(w => w.filter(c => !called(t[c])).length));
    assert.equal(near.need, need, 'closest: ' + what);
    assert.ok(ways.some(w => w.join() === near.cells.join()), 'closest on a line that doesn’t count: ' + what);
    // When it first won, call by call.
    C.order = out.concat(shuffle(DECK.filter(n => !set.has(n)))); C.pos = out.length;
    let first = 0; for (let k = 1; k <= C.pos && !first; k++) { const o = new Set(C.order.slice(0, k)); if (ways.some(w => w.every(c => o.has(t[c])))) first = k; }
    const w = page.wonAt(t, L.pat(id)), wo = other.length ? page.wonAt(t, L.pat('esquinas')) : null, got = [w, wo].filter(Boolean).sort((a, b) => a.when - b.when)[0];
    assert.equal(got ? got.when : 0, first, 'won on the wrong card: ' + what);
    cases++;
  }
  // The fewest squares: 4 on any set of lines, against every set of squares.
  for (const ls of [[0], [8], [3, 7], [0, 1, 2, 3, 4, 5, 6, 7]]) {
    let least = 99; const ways = ls.map(i => LINE10[i]);
    for (let m = 1; m < 1 << 16; m++) { let k = 0; for (let b = m; b; b &= b - 1) k++; if (k < least && ways.some(w => w.every(c => m >> c & 1))) least = k; }
    assert.equal(L.squaresNeeded([L.lineId(ls)]), least);
  }
  assert.ok(cases === 6000);
});

// ---------------------------------------------------------------- El Cantor picks the game
// Nights simulated round by round: El Cantor picks, the round's first card is called (which counts its game), and the
// round lasts 4 to 9 minutes. over(pick, k): the game the caller plays instead, or nothing to play the pick.
function night(L, rnd, { start = 1.7e12, rounds = 22, over = null, finalAt = -1, a = L.autoGood(null) } = {}) {
  let now = start; const out = [];
  for (let k = 0; k < rounds; k++) {
    if (k === finalAt) L.autoFinal(a, true, now); // Final three tapped before this round
    const pick = plain(L.autoPick(a, now, rnd)), fin = a.fin, played = (over && over(pick, k)) || pick;
    out.push({ k, now, pick, played, fin, since: a.t ? now - a.night : 0, cutoff: a.cutoff, first: !a.t || now - a.t >= L.NIGHT });
    L.autoCard(a, now, rnd, played, 'r' + now);
    now += (4 + 5 * rnd()) * 60e3;
  }
  return { rounds: out, a };
}
const kind = ids => ids.length === 3 && ['linea', 'esquinas', 'cuadro'].every(x => ids.includes(x)) ? 'clasico' : ids.join('+');

check('auto: a night opens with 15 to 20 minutes of Clásico, never three others in a row, and Tabla Llena only in the final three', () => {
  const L = loadDeck(), rnd = seeded(2026), counts = {};
  let others = 0, cutoffs = [];
  for (let n = 0; n < 400; n++) {
    const { rounds, a } = night(L, rnd, { start: 1.7e12 + n * 86400e3 });
    cutoffs.push(a.cutoff / 60e3);
    let run = 0;
    for (const r of rounds) {
      const k = kind(r.pick);
      // Before the night's first card and in its Clásico stretch: Clásico.
      if (r.first || r.since < r.cutoff) assert.equal(k, 'clasico', 'not Clásico ' + (r.since / 60e3).toFixed(1) + ' minutes in, before ' + (r.cutoff / 60e3).toFixed(1));
      assert.ok(!r.pick.includes('llena'), 'Tabla Llena outside the final three');
      run = k === 'clasico' ? 0 : run + 1;
      assert.ok(run <= 2, 'three games in a row that aren’t Clásico, round ' + r.k);
      if (k !== 'clasico') { others++; counts[k] = (counts[k] || 0) + 1; }
      assert.ok(L.pat(r.pick[0]), 'a pick that isn’t a game: ' + r.pick);
    }
  }
  // The stretch is drawn between 15 and 20 minutes, once a night, and spreads across it.
  assert.ok(cutoffs.every(m => m >= 15 && m <= 20), 'a Clásico stretch outside 15–20 minutes');
  assert.ok(Math.min(...cutoffs) < 15.5 && Math.max(...cutoffs) > 19.5, 'the stretch isn’t drawn across 15–20 minutes');
  // Siete Loco is the most common of the others, by far; the simpler shapes come before the rest; Línea's picks are its lines.
  const ranked = Object.entries(counts).sort((x, y) => y[1] - x[1]);
  assert.equal(ranked[0][0], 'siete', 'Siete Loco isn’t the most common: ' + JSON.stringify(ranked.slice(0, 4)));
  assert.ok(ranked[0][1] > 2 * ranked[1][1], 'Siete Loco isn’t picked far more than the next: ' + JSON.stringify(ranked.slice(0, 3)));
  assert.ok(others > 1500, others + ' rounds that weren’t Clásico');
  const lines = Object.keys(counts).filter(k => k.startsWith('linea'));
  assert.ok(lines.includes('linea-0') && lines.includes('linea'), 'Línea is never on the top line or any line: ' + lines);
  assert.ok(lines.every(k => ['linea', 'linea-0', 'linea-3', 'linea-4', 'linea-7'].includes(k)), 'Línea on lines it doesn’t pick: ' + lines);
});

check('auto: the chance of something other than Clásico starts low and grows over the next hour, the harder shapes later', () => {
  const L = loadDeck(), rnd = seeded(7);
  assert.ok(L.autoChance(0) <= 0.15, 'starts at ' + L.autoChance(0));
  assert.ok(L.autoChance(30) > L.autoChance(0) && L.autoChance(60) > L.autoChance(30), 'doesn’t grow');
  assert.ok(L.autoChance(75) >= 0.5 && L.autoChance(240) <= 0.6, 'ends at ' + L.autoChance(240));
  // Straight after the stretch, and an hour and a half past it: how often, and which shapes.
  const at = (m, n = 20000) => {
    const out = { other: 0, later: 0, easy: 0 };
    for (let i = 0; i < n; i++) {
      const a = L.autoGood({ night: 1e12, t: 1e12 + 1, cutoff: 15 * 60e3, recent: [1, 1] });
      const pick = plain(L.autoPick(a, 1e12 + (15 + m) * 60e3, rnd)), p = pick[0];
      if (kind(pick) === 'clasico') continue;
      out.other++;
      if (['ele', 'equis', 'marco', 'rieles', 'escalera'].includes(p)) out.later++;
      else if (p !== 'siete') out.easy++;
    }
    return out;
  };
  const early = at(1), late = at(90);
  assert.ok(early.other / 20000 < 0.13, 'straight after the stretch: ' + early.other);
  assert.ok(late.other / 20000 > 0.45, 'an hour and a half in: ' + late.other);
  assert.ok(early.later / early.other < 0.03, 'the harder shapes come straight away: ' + early.later + ' of ' + early.other);
  assert.ok(late.later > late.easy * 0.5, 'the harder shapes never come in: ' + late.later + ' to ' + late.easy);
});

check('auto: the final three is Siete Loco, La Equis, Tabla Llena whatever came before, then picks go on as before', () => {
  const L = loadDeck(), rnd = seeded(33);
  for (let n = 0; n < 200; n++) {
    // Tapped at any round of the night, even after two others in a row.
    const at = 2 + (n % 15), { rounds, a } = night(L, rnd, { start: 1.8e12 + n * 86400e3, rounds: at + 6, finalAt: at, over: (p, k) => k === at - 1 || k === at - 2 ? ['marco'] : null });
    assert.deepEqual(rounds.slice(at, at + 3).map(r => r.pick), [['siete'], ['equis'], ['llena']], 'the final three, from round ' + at);
    assert.deepEqual(rounds.slice(at, at + 3).map(r => r.fin), [1, 2, 3]);
    assert.equal(rounds[at + 3].fin, 4, 'the final three isn’t over after the third');
    assert.equal(kind(rounds[at + 3].pick), 'clasico', 'after La Equis and Tabla Llena, the next is Clásico');
    assert.equal(rounds[at + 4].fin, 0, 'picks don’t go back to the usual rules');
    assert.ok(rounds.slice(at + 3).every(r => !r.pick.includes('llena')), 'Tabla Llena after the final three');
    assert.equal(a.fin, 0);
  }
  // The caller can still play something else in the final three: it counts as that final round.
  const { rounds } = night(L, rnd, { rounds: 8, finalAt: 3, over: (p, k) => k === 4 ? ['centro'] : null });
  assert.deepEqual(rounds.slice(3, 6).map(r => r.pick), [['siete'], ['equis'], ['llena']]);
  assert.deepEqual(rounds[4].played, ['centro']);
});

check('auto: a game the caller picks instead counts in the run of others, and six hours with no card starts a new night', () => {
  const L = loadDeck(), rnd = seeded(5);
  for (let n = 0; n < 300; n++) {
    // Late in the night, two rounds the caller played as something else, whatever was picked: the third is Clásico.
    const a = L.autoGood(null), start = 1.9e12 + n * 86400e3;
    L.autoCard(a, start, rnd, ['linea', 'esquinas', 'cuadro'], 'first');
    const late = start + 120 * 60e3;
    L.autoCard(a, late, rnd, ['esquinas'], 'x1');
    L.autoCard(a, late + 5 * 60e3, rnd, ['linea-0'], 'x2');
    assert.equal(kind(plain(L.autoPick(a, late + 10 * 60e3, rnd))), 'clasico', 'a third in a row that isn’t Clásico');
    // A round counts once, however many of its cards are called.
    L.autoCard(a, late + 10 * 60e3, rnd, ['linea', 'esquinas', 'cuadro'], 'x3');
    L.autoCard(a, late + 11 * 60e3, rnd, null, 'x3');
    L.autoCard(a, late + 12 * 60e3, rnd, ['linea', 'esquinas', 'cuadro'], 'x3');
    assert.deepEqual(plain(a.recent), [0, 0, 1]);
    // Six hours later: a new night, Clásico again, its own stretch.
    const next = late + 12 * 60e3 + L.NIGHT;
    assert.equal(kind(plain(L.autoPick(a, next, rnd))), 'clasico');
    L.autoCard(a, next, rnd, ['linea', 'esquinas', 'cuadro'], 'y1');
    assert.equal(a.night, next);
    assert.deepEqual(plain(a.recent), [1]);
  }
  // A damaged save of the state starts clean.
  assert.deepEqual(plain(L.autoGood({ night: 'x', t: -1, recent: [0, 'a', 1, 2], fin: 7, pick: ['nope', 'siete'] })), { night: 0, t: 0, cutoff: 0, recent: [0, 1], fin: 0, finAt: 0, rid: '', pick: ['siete'] });
  // Final three tapped before a night's first card stays on; one left from the last night is over.
  const b = L.autoGood(null), t0 = 2e12;
  L.autoFinal(b, true, t0);
  assert.deepEqual(plain(L.autoPick(b, t0, rnd)), ['siete']);
  L.autoCard(b, t0 + 1000, rnd, ['siete'], 'f1');
  assert.equal(b.fin, 2, 'the first card of the night undid Final three');
  const t1 = t0 + 1000 + L.NIGHT;
  assert.equal(kind(plain(L.autoPick(b, t1, rnd))), 'clasico', 'a final three left from the last night carries on into the next');
  assert.equal(L.autoFin(b, t1), 0);
  L.autoCard(b, t1, rnd, ['linea', 'esquinas', 'cuadro'], 'n1');
  assert.equal(b.fin, 0, 'a final three left from the last night carries on');
});

// ---------------------------------------------------------------- random tablas
check('random: My tablas’ Random tabla deals 16 different cards; Make tablas’ Random makes one like Mark’s four, and Fill the rest keeps what’s there', () => {
  const L = loadDeck(), CARDS = L.CARDS, board = read('board.html'), print = read('print.html');
  const randomBoard = new Function('CARDS', fn(board, 'uid') + fn(board, 'randomBoard') + 'return randomBoard;')(CARDS);
  const P = { set: { doubles: true } };
  const make = new Function('CARDS', 'P', ['uid', 'shuffle', 'deckNums', 'blank', 'filled', 'familyCards', 'fillTabla', 'randomTabla'].map(n => fn(print, n)).join('\n') + 'return { fillTabla, randomTabla, blank };')(CARDS, P);
  const N = 20000, square = Array.from({ length: 16 }, () => new Float64Array(55));
  for (let i = 0; i < N; i++) {
    const t = randomBoard('x').cards;
    assert.ok(t.length === 16 && new Set(t).size === 16 && t.every(n => n >= 1 && n <= 54), 'My tablas’ Random tabla: ' + t);
    t.forEach((n, k) => square[k][n]++);
  }
  let x = 0;
  for (let k = 0; k < 16; k++) for (let n = 1; n <= 54; n++) x += (square[k][n] - N / 54) ** 2 / (N / 54);
  assert.ok(Math.abs(zOf(x, 16 * 53)) < 5, 'My tablas’ Random tabla favours some cards in some squares (z=' + zOf(x, 16 * 53).toFixed(1) + ')');
  // Doubles on: 15 cards, one of them twice, side by side in the middle (squares 6 and 7, or 10 and 11), like Mark's.
  const doubled = new Float64Array(55), where = { 5: 0, 9: 0 };
  for (let i = 0; i < N; i++) {
    const t = make.randomTabla('x').cards, count = {};
    t.forEach(n => { count[n] = (count[n] || 0) + 1; });
    const twice = Object.keys(count).filter(n => count[n] === 2).map(Number);
    assert.ok(t.length === 16 && Object.keys(count).length === 15 && twice.length === 1 && t.every(n => n >= 1 && n <= 54), 'Make tablas’ Random: ' + t);
    const at = t.indexOf(twice[0]);
    assert.ok((at === 5 || at === 9) && t[at + 1] === twice[0], 'Make tablas’ Random put the double elsewhere: ' + t);
    where[at]++; doubled[twice[0]]++;
  }
  x = 0;
  for (let n = 1; n <= 54; n++) x += (doubled[n] - N / 54) ** 2 / (N / 54);
  assert.ok(Math.abs(zOf(x, 53)) < 5, 'Make tablas’ Random doubles some cards more than others');
  assert.ok(Math.abs(where[5] - where[9]) < 6 * Math.sqrt(N / 4), 'the double sits in one middle row far more than the other: ' + JSON.stringify(where));
  P.set.doubles = false;
  for (let i = 0; i < 2000; i++) assert.equal(new Set(make.randomTabla('x').cards).size, 16, 'Doubles off, and Random dealt a double');
  P.set.doubles = true;
  // Fill the rest: the cards already placed stay where they are, and only new cards fill the gaps.
  const rnd = seeded(7);
  for (let i = 0; i < 5000; i++) {
    const t = make.blank('x');
    for (let k = 1 + Math.floor(rnd() * 15); k > 0; k--) t.cards[Math.floor(rnd() * 16)] = 1 + Math.floor(rnd() * 10);
    const before = t.cards.slice(), had = new Set(before.filter(Boolean));
    make.fillTabla(t);
    assert.ok(t.cards.every(n => n >= 1 && n <= 54), 'Fill the rest left a gap: ' + t.cards);
    assert.ok(before.every((n, k) => !n || t.cards[k] === n), 'Fill the rest moved a card: ' + before + ' → ' + t.cards);
    const added = t.cards.filter((n, k) => !before[k]);
    assert.ok(added.every(n => !had.has(n)) && new Set(added).size === added.length, 'Fill the rest added a card again: ' + before + ' → ' + t.cards);
  }
});

// ---------------------------------------------------------------- the shuffle
check('shuffle: El Cantor deals every card in every place equally often, and the next card is never favoured', () => {
  const html = read('cantor.html'), L = loadDeck();
  const make = (window, src) => new Function('window', 'crypto', 'CARDS', src + '\nreturn shuffled;')(window, window.crypto, L.CARDS);
  const own = fn(html, 'rand') + '\n' + fn(html, 'shuffled');
  const score = shuffled => {
    const N = 6000, place = Array.from({ length: 55 }, () => new Float64Array(54)), next = Array.from({ length: 55 }, () => new Float64Array(55));
    for (let s = 0; s < N; s++) {
      const d = shuffled();
      assert.ok(d.length === 54 && new Set(d).size === 54, 'a shuffle that isn’t the whole deck');
      for (let i = 0; i < 54; i++) { place[d[i]][i]++; if (i < 53) next[d[i]][d[i + 1]]++; }
    }
    let x1 = 0, x2 = 0;
    for (let c = 1; c <= 54; c++) for (let i = 0; i < 54; i++) x1 += (place[c][i] - N / 54) ** 2 / (N / 54);
    for (let a = 1; a <= 54; a++) for (let b = 1; b <= 54; b++) if (a !== b) x2 += (next[a][b] - N / 54) ** 2 / (N / 54);
    return [zOf(x1, 53 * 53), zOf(x2, 54 * 53 - 1)];
  };
  for (const [what, shuffled] of [['with the browser’s crypto', make({ crypto: globalThis.crypto }, own)], ['with Math.random, where there’s no crypto', make({}, own)]]) {
    const [z1, z2] = score(shuffled);
    assert.ok(Math.abs(z1) < 5, 'El Cantor’s shuffle ' + what + ' favours some cards in some places (z=' + z1.toFixed(1) + ')');
    assert.ok(Math.abs(z2) < 5, 'El Cantor’s shuffle ' + what + ' favours some cards after others (z=' + z2.toFixed(1) + ')');
  }
  // The usual mistake (picking from the whole deck at every step) scores in the hundreds, so the check can tell.
  const [bad] = score(make({ crypto: globalThis.crypto }, own.replace('rand(i + 1)', 'rand(d.length)')));
  assert.ok(bad > 20, 'the check can’t tell a biased shuffle (z=' + bad.toFixed(1) + ')');
});

// ---------------------------------------------------------------- run them
const pick = process.argv.slice(2).map(s => s.toLowerCase());
let failed = 0, ran = 0;
for (const c of checks) {
  if (pick.length && !pick.some(w => c.name.toLowerCase().includes(w))) continue;
  ran++;
  try { await c.run(); console.log('ok    ' + c.name); }
  catch (e) { failed++; console.log('FAIL  ' + c.name + '\n      ' + String(e && e.message || e).split('\n').join('\n      ')); }
}
if (!ran) { console.log('no check matches ' + pick.join(' ')); process.exit(1); }
if (failed) { console.log(`${failed} of ${ran} failed`); process.exit(1); }
console.log(`all ${ran} good`);
