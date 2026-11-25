/* Lotería deck: the cards, their verses, the winning shapes, the family's own tablas and
   the juego generator. El Cantor, the play-along board and the tabla maker all load this
   one file, so printed tablas and wins agree everywhere. Card images are found beside the
   page, or wherever the script tag points: <script src="deck.js" data-cards="cards/">. */
(function () {
  'use strict';
  var me = document.currentScript, DIR = (me && me.getAttribute('data-cards')) || '';

  function fold(s) { return String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9 ]/g, ''); }

  var CARDS = [
    ['ElGallo', 'El Gallo', 'El que le cantó a San Pedro no le volverá a cantar.'],
    ['ElDiablito', 'El Diablito', 'Pórtate bien cuatito, si no te lleva el coloradito.'],
    ['LaDama', 'La Dama', 'Puliendo el paso, por toda la calle real.'],
    ['ElCatrin', 'El Catrín', 'Don Ferruco en la alameda, su bastón quería tirar.'],
    ['ElParaguas', 'El Paraguas', 'Para el sol y para el agua.'],
    ['LaSirena', 'La Sirena', 'Con los cantos de sirena, no te vayas a marear.'],
    ['LaEscalera', 'La Escalera', 'Súbeme paso a pasito, no quieras pegar brinquitos.'],
    ['LaBotella', 'La Botella', 'La herramienta del borracho.'],
    ['ElBarril', 'El Barril', 'Tanto bebió el albañil, que quedó como barril.'],
    ['ElArbol', 'El Árbol', 'El que a buen árbol se arrima, buena sombra le cobija.'],
    ['ElMelon', 'El Melón', 'Me lo das o me lo quitas.'],
    ['ElValiente', 'El Valiente', 'Por qué le corres cobarde, trayendo tan buen puñal.'],
    ['ElGorrito', 'El Gorrito', 'Ponle su gorrito al nene, no se nos vaya a resfriar.'],
    ['LaMuerte', 'La Muerte', 'La muerte tilica y flaca.'],
    ['LaPera', 'La Pera', 'El que espera, desespera.'],
    ['LaBandera', 'La Bandera', 'Verde, blanco y colorado, la bandera del soldado.'],
    ['ElBandolon', 'El Bandolón', 'Tocando su bandolón, está el mariachi Simón.'],
    ['ElVioloncello', 'El Violoncello', 'Creciendo se fue hasta el cielo, y como no fue violín, tuvo que ser violoncello.'],
    ['LaGarza', 'La Garza', 'Al otro lado del río tengo mi banco de arena, donde se sienta mi chata, pico de garza morena.'],
    ['ElPajaro', 'El Pájaro', 'Tú me traes a puros brincos, como pájaro en la rama.'],
    ['LaMano', 'La Mano', 'La mano de un criminal.'],
    ['LaBota', 'La Bota', 'Una bota igual que la otra.'],
    ['LaLuna', 'La Luna', 'El farol de los enamorados.'],
    ['ElCotorro', 'El Cotorro', 'Cotorro, cotorro, saca la pata y empiézame a platicar.'],
    ['ElBorracho', 'El Borracho', 'A qué borracho tan necio, ya no lo puedo aguantar.'],
    ['ElNegrito', 'El Negrito', 'El que se comió el azúcar.'],
    ['ElCorazon', 'El Corazón', 'No me extrañes, corazón, que regreso en el camión.'],
    ['LaSandia', 'La Sandía', 'La barriga que Juan tenía, era empacho de sandía.'],
    ['ElTambor', 'El Tambor', 'No te arrugues, cuero viejo, que te quiero pa’ tambor.'],
    ['ElCamaron', 'El Camarón', 'Camarón que se duerme, se lo lleva la corriente.'],
    ['LasJaras', 'Las Jaras', 'Las jaras del indio Adán, donde pegan, dan.'],
    ['ElMusico', 'El Músico', 'El músico trompas de hule, ya no me quiere tocar.'],
    ['LaArana', 'La Araña', 'Atarántamela a palos, no me la dejes llegar.'],
    ['ElSoldado', 'El Soldado', 'Uno, dos y tres, el soldado p’al cuartel.'],
    ['LaEstrella', 'La Estrella', 'La guía de los marineros.'],
    ['ElCazo', 'El Cazo', 'El caso que te hago es poco.'],
    ['ElMundo', 'El Mundo', 'Este mundo es una bola, y nosotros un bolón.'],
    ['ElApache', 'El Apache', '¡Ah, Chihuahua! Cuánto apache con pantalón y huarache.'],
    ['ElNopal', 'El Nopal', 'Al nopal lo van a ver, nomás cuando tiene tunas.'],
    ['ElAlacran', 'El Alacrán', 'El que con la cola pica, le dan una paliza.'],
    ['LaRosa', 'La Rosa', 'Rosita, Rosaura, ven que te quiero ahora.'],
    ['LaCalavera', 'La Calavera', 'Al pasar por el panteón, me encontré un calaverón.'],
    ['LaCampana', 'La Campana', 'Tú con la campana y yo con tu hermana.'],
    ['ElCantarito', 'El Cantarito', 'Tanto va el cántaro al agua, que se quiebra y te moja las enaguas.'],
    ['ElVenado', 'El Venado', 'Saltando va buscando, pero no ve nada.'],
    ['ElSol', 'El Sol', 'La cobija de los pobres.'],
    ['LaCorona', 'La Corona', 'El sombrero de los reyes.'],
    ['LaChalupa', 'La Chalupa', 'Rema que rema Lupita, sentada en su chalupita.'],
    ['ElPino', 'El Pino', 'Fresco y oloroso, en todo tiempo hermoso.'],
    ['ElPescado', 'El Pescado', 'El que por la boca muere, aunque mudo fuere.'],
    ['LaPalma', 'La Palma', 'Palmero, sube a la palma y bájame un coco real.'],
    ['LaMaceta', 'La Maceta', 'El que nace pa’ maceta, no sale del corredor.'],
    ['ElArpa', 'El Arpa', 'Arpa vieja de mi suegra, ya no sirves pa’ tocar.'],
    ['LaRana', 'La Rana', 'Al ver a la verde rana, qué brinco pegó tu hermana.']
  ].map(function (c, i) { return { n: i + 1, f: c[0], name: c[1], verse: c[2], key: fold(c[1]) }; });
  var BYFILE = {}; CARDS.forEach(function (c) { BYFILE[c.f] = c.n; });
  function card(n) { return CARDS[n - 1]; }
  // The cards a search finds, best first: the card the search names (its number, or its name with or without its El
  // or La: "sol" is El Sol, though El Soldado holds it too, and "rana" La Rana, not La Araña), then names that start
  // with it, then the rest that hold it. exact: the first is the card the search names, which Enter picks.
  function findCards(q) {
    var f = fold(String(q).trim()), num = parseInt(f, 10), out = [];
    if (!f) return { cards: CARDS.slice(), exact: false };
    CARDS.forEach(function (c) {
      var bare = c.key.replace(/^(el|la|las|los) /, '');
      var r = (num && c.n === num) || c.key === f || bare === f ? 0 : c.key.indexOf(f) === 0 || bare.indexOf(f) === 0 ? 1 : c.key.indexOf(f) >= 0 ? 2 : -1;
      if (r >= 0) out.push({ c: c, r: r });
    });
    out.sort(function (a, b) { return a.r - b.r || a.c.n - b.c.n; });
    return { cards: out.map(function (x) { return x.c; }), exact: !!out.length && out[0].r === 0 };
  }
  function src(n) { return DIR + card(n).f + '.jpg'; }

  // ---------- Mark's four: the family's own tablas, each with one card twice, side by side ----------
  var ORIGINALS = [
    ['ElMelon', 'ElCotorro', 'LaCampana', 'LaArana', 'LaBandera', 'LaPalma', 'ElTambor', 'LaMaceta', 'ElNegrito', 'LasJaras', 'LasJaras', 'ElPino', 'LaBota', 'LaGarza', 'ElCantarito', 'ElPescado'],
    ['ElVenado', 'ElApache', 'ElCatrin', 'ElMusico', 'ElCazo', 'LaCorona', 'LaCorona', 'ElNegrito', 'ElParaguas', 'ElBarril', 'LaEstrella', 'LaSandia', 'ElPajaro', 'ElValiente', 'LaBotella', 'ElMundo'],
    ['ElGallo', 'ElNopal', 'ElDiablito', 'LaMano', 'LaEstrella', 'LaChalupa', 'LaChalupa', 'ElGorrito', 'LaDama', 'LaMuerte', 'LaLuna', 'ElSoldado', 'ElVioloncello', 'ElApache', 'LaSirena', 'ElCamaron'],
    ['LaPera', 'ElBorracho', 'ElSoldado', 'ElBandolon', 'ElAlacran', 'LaRosa', 'LaRosa', 'LaEscalera', 'ElSol', 'ElValiente', 'LaCalavera', 'ElArpa', 'LaRana', 'ElArbol', 'ElCorazon', 'ElApache']
  ].map(function (t) { return t.map(function (f) { return BYFILE[f]; }); });
  function originals() { return ORIGINALS.map(function (t) { return t.slice(); }); }

  // ---------- patterns (squares are numbered 0–15, row by row) ----------
  function rows() { var o = []; for (var r = 0; r < 4; r++) o.push([r * 4, r * 4 + 1, r * 4 + 2, r * 4 + 3]); return o; }
  function cols() { var o = []; for (var c = 0; c < 4; c++) o.push([c, c + 4, c + 8, c + 12]); return o; }
  var SQ = [0, 1, 2, 4, 5, 6, 8, 9, 10].map(function (b) { return [b, b + 1, b + 4, b + 5]; });
  var ALL = []; for (var i = 0; i < 16; i++) ALL.push(i);
  var PATS = [
    { id: 'clasico', name: 'Clásico', sub: '4 in a row, 4 corners, or 4 in a square', combo: ['linea', 'esquinas', 'cuadro'], show: [0, 1, 2, 3, 5, 6, 9, 10, 12, 15] },
    { id: 'linea', name: 'Línea', sub: 'any row, column or diagonal', sets: rows().concat(cols(), [[0, 5, 10, 15], [3, 6, 9, 12]]), show: [0, 1, 2, 3] },
    { id: 'esquinas', name: 'Esquinas', sub: 'the four corners', sets: [[0, 3, 12, 15]] },
    { id: 'centro', name: 'Centro', sub: 'the middle four', sets: [[5, 6, 9, 10]] },
    { id: 'cuadro', name: 'Cuadrito', sub: 'any 2×2 block', sets: SQ, show: [5, 6, 9, 10] },
    { id: 'ele', name: 'La Ele', sub: 'left column + bottom row', sets: [[0, 4, 8, 12, 13, 14, 15]] },
    { id: 'equis', name: 'La Equis', sub: 'both diagonals', sets: [[0, 5, 10, 15, 3, 6, 9, 12]] },
    { id: 'marco', name: 'El Marco', sub: 'the outer ring', sets: [[0, 1, 2, 3, 4, 7, 8, 11, 12, 13, 14, 15]] },
    { id: 'rieles', name: 'Rieles', sub: 'the two middle rows', sets: [[4, 5, 6, 7, 8, 9, 10, 11]] },
    { id: 'escalera', name: 'Escalera', sub: 'the two middle columns', sets: [[1, 2, 5, 6, 9, 10, 13, 14]] },
    { id: 'siete', name: 'Siete Loco', sub: 'any seven, anywhere', min: 7, show: [0, 5, 6, 9, 10, 15, 3] },
    { id: 'llena', name: 'Tabla Llena', sub: 'every card', sets: [ALL] }
  ];
  var CLASICO = ['linea', 'esquinas', 'cuadro'];
  // ---------- Línea's lines ----------
  // Línea can be played on some of its ten lines only: the top line, say, as some families take Línea to mean. The
  // lines are numbered as Línea's sets: the rows 0–3 from the top, the columns 4–7 from the left, then the diagonal
  // from the top left (8) and the one from the top right (9). Such a game's id is 'linea-' and its lines' numbers in
  // order, 'linea-0' for the top line, 'linea-37' for the bottom and right lines; all ten are plain 'linea', any line.
  // That id goes everywhere a shape's id goes (saves, El Cantor's link, the checker), so nothing else needs to know.
  var LINES = PATS[1].sets;
  function lineId(lines) {
    var u = []; (lines || []).forEach(function (l) { l = +l; if (l >= 0 && l < 10 && l === (l | 0) && u.indexOf(l) < 0) u.push(l); });
    u.sort(function (a, b) { return a - b; });
    return !u.length || u.length === 10 ? 'linea' : 'linea-' + u.join('');
  }
  // The lines an id plays, or null for an id that isn't Línea's (or isn't written the one way lineId writes it).
  function linesOf(id) {
    if (id === 'linea') return LINES.map(function (s, i) { return i; });
    var m = /^linea-(\d{1,9})$/.exec(String(id)); if (!m) return null;
    var ls = m[1].split('').map(Number);
    return lineId(ls) === id ? ls : null;
  }
  function isLinea(id) { return !!linesOf(id); }
  // A game's Línea, if it plays one: its id.
  function lineaIn(ids) { return (ids || []).filter(isLinea)[0] || null; }
  // The name and what it takes, for each line by number, and for the sets with a name of their own; the rest are
  // "Línea · 3 lines", with the lines on the diagram. Words from strings.js where the page loads it, else English.
  function lineWords(ls) {
    var k = ls.join(''), one = T ? T('line.oneSub') : 'only this line counts';
    if (ls.length === 1) {
      var NAMES = T ? [T('line.top'), T('line.row2'), T('line.row3'), T('line.bottom'), T('line.left'), T('line.col2'), T('line.col3'), T('line.right'), T('line.diag1'), T('line.diag2')]
        : ['Top line', 'Second row', 'Third row', 'Bottom line', 'Left line', 'Second column', 'Third column', 'Right line', 'Left diagonal', 'Right diagonal'];
      return { name: NAMES[ls[0]], sub: ls[0] === 8 ? (T ? T('line.diag1Sub') : 'from the top-left corner down') : ls[0] === 9 ? (T ? T('line.diag2Sub') : 'from the top-right corner down') : one };
    }
    if (k === '0123') return { name: T ? T('line.rows') : 'Any row', sub: T ? T('line.rowsSub') : 'any of the four rows' };
    if (k === '4567') return { name: T ? T('line.cols') : 'Any column', sub: T ? T('line.colsSub') : 'any of the four columns' };
    if (k === '89') return { name: T ? T('line.diags') : 'Either diagonal', sub: T ? T('line.diagsSub') : 'one diagonal or the other' };
    if (k === '01234567') return { name: T ? T('line.noDiag') : 'Línea, no diagonals', sub: T ? T('line.noDiagSub') : 'any row or column' };
    return { name: T ? T('line.some', { n: ls.length }) : 'Línea · ' + ls.length + ' lines', sub: T ? T('line.someSub') : 'any of the lines shown' };
  }
  var LINEAS = {};
  function linePat(id) {
    if (LINEAS[id]) return LINEAS[id];
    var ls = linesOf(id); if (!ls || id === 'linea') return null;
    var w = lineWords(ls), sets = ls.map(function (i) { return LINES[i]; }), show = [];
    sets.forEach(function (s) { s.forEach(function (c) { if (show.indexOf(c) < 0) show.push(c); }); });
    return (LINEAS[id] = { id: id, base: 'linea', lines: ls, name: w.name, about: w.sub, sets: sets, show: show.sort(function (a, b) { return a - b; }) });
  }
  function pat(id) { return PATS.filter(function (p) { return p.id === id; })[0] || linePat(id) || undefined; }
  // What a shape takes, under its name: "the four corners".
  function patSub(p) { return p.about || (T ? T('pat.' + p.id) : p.sub); }
  function hasClasico(ids) { return CLASICO.every(function (x) { return ids.indexOf(x) >= 0; }); }
  function isClasico(ids) { return ids.length === 3 && hasClasico(ids); }
  // The words below come from strings.js on a page that loads it, in the language chosen there; elsewhere (and in
  // node, for the tests) they're English. The juego generator further down has no words, and doesn't change.
  var T = window.T || null;
  // Clásico already wins with every shape but Siete Loco (each way to make one holds a Clásico four), so the only
  // game on top of it is Clásico + Siete Loco.
  function gameName(ids) {
    if (isClasico(ids)) return 'Clásico';
    var both = hasClasico(ids), names = ids.filter(function (id) { return !both || CLASICO.indexOf(id) < 0; }).map(function (id) { var q = pat(id); return q ? q.name : id; });
    return (both ? 'Clásico + ' : '') + (names.length ? (names.length > 2 || (both && names.length > 1) ? names[0] + ' +' + (names.length - 1) : names.join(' · ')) : T ? T('pat.none') : 'Pick a game');
  }
  // A shape held in a game picker goes on top of the game `ids` (changed in place); says what it did, for a toast.
  // Holding Clásico keeps Siete Loco, and on Clásico any other shape changes nothing: Clásico already wins with it.
  function holdShape(ids, id) {
    var both = hasClasico(ids), p = pat(id);
    if (id === 'clasico') {
      if (both) return T ? T('shapeIn', { shape: 'Clásico' }) : 'Clásico is already in the game';
      var keep = ids.indexOf('siete') >= 0 ? ['siete'] : [];
      ids.splice.apply(ids, [0, ids.length].concat(CLASICO, keep)); return T ? T('shapeAdded', { shape: 'Clásico' }) : 'Clásico added';
    }
    if (both && id !== 'siete') return T ? T('shapeClasico', { shape: p.name }) : 'Clásico already wins with ' + p.name;
    if (ids.indexOf(id) >= 0 || (id === 'linea' && lineaIn(ids))) return T ? T('shapeIn', { shape: p.name }) : p.name + ' is already in the game';
    ids.push(id); return T ? T('shapeAdded', { shape: p.name }) : p.name + ' added';
  }

  // The fewest squares a tabla can win the game `ids` with: 4 for Clásico, 7 for Siete Loco, 16 for Tabla Llena; for
  // several shapes, the smallest. A card covers two squares at most (a double), so a win takes at least half as many cards.
  function squaresNeeded(ids) {
    var best = 16;
    ids.forEach(function (pid) { var p = pat(pid); if (!p) return; var k = p.min || Math.min.apply(null, p.sets.map(function (s) { return s.length; })); if (k < best) best = k; });
    return best;
  }
  // Which patterns a tabla has completed. `called(n)` says whether card n is out.
  function check(cards, called, ids) {
    var m = []; cards.forEach(function (n, i) { if (called(n)) m.push(i); });
    var hits = [];
    ids.forEach(function (pid) {
      var p = pat(pid); if (!p) return;
      if (p.min) { if (m.length >= p.min) hits.push({ pat: p, cells: m.slice() }); return; }
      for (var i = 0; i < p.sets.length; i++) { var s = p.sets[i]; if (s.every(function (c) { return m.indexOf(c) >= 0; })) { hits.push({ pat: p, cells: s }); return; } }
    });
    return hits;
  }
  // The pattern a tabla is nearest to finishing, with the squares it still needs.
  function closest(cards, called, ids) {
    var best = null;
    ids.forEach(function (pid) {
      var p = pat(pid); if (!p) return;
      if (p.min) {
        var open = []; cards.forEach(function (n, i) { if (!called(n)) open.push(i); });
        var need = Math.max(0, p.min - (16 - open.length));
        if (!best || need < best.need) best = { pat: p, need: need, cells: [], missing: need ? open : [] };
        return;
      }
      p.sets.forEach(function (s) {
        var miss = s.filter(function (c) { return !called(cards[c]); });
        if (!best || miss.length < best.need) best = { pat: p, need: miss.length, cells: s, missing: miss };
      });
    });
    return best;
  }

  // ---------- paper ----------
  // Letter where it's the paper in the shops: the Americas from Canada to Chile, and the Philippines. A phone set to
  // plain Spanish or Latin American Spanish (es, es-419) is most likely in Mexico or the US; only es-ES means Spain.
  // El Cantor's Print tablas and Make tablas' Print… both start on it.
  function defaultPaper() {
    var n = window.navigator || {}, ls = n.languages && n.languages.length ? n.languages : [n.language || 'en-US'];
    return /-(US|CA|MX|PH|CL|CO|VE|CR|GT|SV|HN|NI|PA|PR|DO)$/i.test(ls[0]) || /^(en|es|es-419)$/i.test(ls[0]) ? 'letter' : 'a4';
  }

  // ---------- confetti ----------
  // The cut paper both ¡Lotería! boxes throw: little banderitas with the papel picado's zigzag edge, in its five
  // colours, falling and turning for two to three and a half seconds into `host` (the box's backdrop), then gone.
  // None where the device asks for less motion. Says how many it threw.
  var BITS = ['var(--fa,#B7332F)', 'var(--fb,#1F6F6D)', 'var(--fc,#D99A2B)', 'var(--fd,#3E7D4A)', 'var(--fe,#C2477A)'];
  function confetti(host, count) {
    if (!host || !host.animate || (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches)) return 0;
    var h = host.clientHeight || window.innerHeight, n = count || 36;
    host.style.overflow = 'hidden';
    for (var i = 0; i < n; i++) {
      var b = document.createElement('i'), turn = (Math.random() < 0.5 ? -1 : 1) * (200 + Math.random() * 420);
      b.className = 'bit'; b.setAttribute('aria-hidden', 'true');
      b.style.cssText = 'position:absolute;top:-18px;left:' + (Math.random() * 98).toFixed(1) + '%;width:12px;height:14px;background:' + BITS[i % 5] + ';clip-path:polygon(0 0,100% 0,100% 100%,83% 86%,67% 100%,50% 86%,33% 100%,17% 86%,0 100%);pointer-events:none;z-index:2';
      host.appendChild(b);
      b.animate([{ transform: 'translate(0,0) rotate(0deg) rotateY(0deg)' }, { transform: 'translate(' + Math.round((Math.random() - 0.5) * 140) + 'px,' + (h + 40) + 'px) rotate(' + Math.round(turn) + 'deg) rotateY(' + Math.round(turn * 1.5) + 'deg)' }],
        { duration: 2200 + Math.random() * 1200, delay: Math.random() * 600, easing: 'cubic-bezier(.35,.05,.65,1)', fill: 'backwards' }).onfinish = (function (el) { return function () { el.remove(); }; })(b);
    }
    return n;
  }

  // ---------- printed juegos ----------
  // A juego is a numbered set of tablas made from a name, so anyone with the
  // name can rebuild tabla 7 without the paper. Tabla k depends only on the
  // name and on tablas 1…k-1, never on how many were printed. Printed sheets
  // outlive code: never change anything below, add a v2 beside it instead.
  function juegoName(s) { return fold(s).toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12); }
  function seed(str) { // cyrb128
    var h1 = 1779033703, h2 = 3144134277, h3 = 1013904242, h4 = 2773480762;
    for (var i = 0, k; i < str.length; i++) {
      k = str.charCodeAt(i);
      h1 = h2 ^ Math.imul(h1 ^ k, 597399067); h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
      h3 = h4 ^ Math.imul(h3 ^ k, 951274213); h4 = h1 ^ Math.imul(h4 ^ k, 2716044179);
    }
    h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067); h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233);
    h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213); h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179);
    h1 ^= (h2 ^ h3 ^ h4); h2 ^= h1; h3 ^= h1; h4 ^= h1;
    return [h1 >>> 0, h2 >>> 0, h3 >>> 0, h4 >>> 0];
  }
  function sfc32(s) {
    var a = s[0], b = s[1], c = s[2], d = s[3];
    var next = function () {
      a |= 0; b |= 0; c |= 0; d |= 0;
      var t = (a + b | 0) + d | 0;
      d = d + 1 | 0; a = b ^ b >>> 9; b = c + (c << 3) | 0; c = (c << 21 | c >>> 11); c = c + t | 0;
      return (t >>> 0) / 4294967296;
    };
    for (var i = 0; i < 12; i++) next();
    return next;
  }
  function shuffleWith(rnd, arr) { var d = arr.slice(); for (var i = d.length - 1; i > 0; i--) { var j = Math.floor(rnd() * (i + 1)); var t = d[i]; d[i] = d[j]; d[j] = t; } return d; }
  var FOURS = PATS[1].sets.concat(PATS[2].sets, SQ); // the Clásico shapes
  function fourKeys(cards) { return FOURS.map(function (s) { return s.map(function (c) { return cards[c]; }).sort(function (x, y) { return x - y; }).join('.'); }); }
  var CACHE = {};
  function juego(name, count) {
    var key = juegoName(name); if (!key) return [];
    var st = CACHE[key];
    if (!st) st = CACHE[key] = { rnd: sfc32(seed('loteria-juego-v1:' + key)), shoe: [], seen: {}, tablas: [] };
    var deck = CARDS.map(function (c) { return c.n; });
    while (st.tablas.length < count) {
      // Deal 16 from a shoe of shuffled decks, so every card is used evenly
      // across the juego. A card already on this tabla waits for the next one.
      var pick = [], held = [];
      while (pick.length < 16) {
        if (!st.shoe.length) st.shoe = shuffleWith(st.rnd, deck);
        var c = st.shoe.pop();
        if (pick.indexOf(c) >= 0) held.push(c); else pick.push(c);
      }
      for (var h = held.length - 1; h >= 0; h--) st.shoe.push(held[h]);
      // Lay it out so no Clásico shape holds the same four cards as a shape
      // on an earlier tabla — two tablas never win on the same call that way.
      var best = null;
      for (var t = 0; t < 24; t++) {
        var lay = shuffleWith(st.rnd, pick), ks = fourKeys(lay);
        if (!best) best = { lay: lay, ks: ks };
        if (!ks.some(function (k) { return st.seen[k]; })) { best = { lay: lay, ks: ks }; break; }
      }
      best.ks.forEach(function (k) { st.seen[k] = 1; });
      st.tablas.push(best.lay);
    }
    return st.tablas.slice(0, count).map(function (t) { return t.slice(); });
  }
  function juegoTabla(name, k) { return k >= 1 && k <= 999 ? juego(name, k)[k - 1] || null : null; }
  var WORDS = ['CANELA', 'CAJETA', 'ELOTE', 'TAMAL', 'ATOLE', 'POZOLE', 'MANGO', 'PAPAYA', 'JICAMA', 'GUAYABA', 'LIMON', 'NIEVE', 'CHURRO', 'CONCHA', 'PAMBAZO', 'TEJOCOTE', 'COMAL', 'MOLCAJETE', 'PIPIAN', 'HORCHATA', 'TAMARINDO', 'CHAYOTE', 'CAPIROTADA', 'BUNUELO'];
  function randomJuego(not) { var w; do { w = WORDS[Math.floor(Math.random() * WORDS.length)]; } while (w === not); return w; }

  // ---------- El Cantor picks the game ----------
  // With Settings' El Cantor picks the game on, El Cantor chooses each round's game the way Mark's family plays a night.
  // The night starts at its first card (six hours with no card starts a new one, as for Who's winning tonight), and its
  // first 15 to 20 minutes, drawn once a night, are all Clásico. After that a round is something else now and then: a
  // one-in-ten chance at first, growing to more than one in two over the next hour and a quarter. Siete Loco, the
  // family's go-to, is four in ten of those; the rest are the simpler shapes (Esquinas, Centro, Cuadrito, Línea and its
  // lines), with the others (La Ele, La Equis, El Marco, Rieles, Escalera) coming in over the first hour and a half.
  // Never three in a row that aren't Clásico. Tabla Llena only in the final three: Siete Loco, La Equis, Tabla Llena,
  // started by a tap, whatever came before. The game actually played counts, whoever picked it.
  // The state, kept on the device: { night: its first card's time, t: the last card's, cutoff: the Clásico stretch in ms,
  // recent: the last rounds, 1 for Clásico and 0 for anything else, fin: 0, or 1–3 for the final round coming next, or 4
  // once the third has started, finAt: when Final three was tapped, rid: the round counted last, pick: the game picked
  // for this round }.
  var NIGHT = 6 * 3600e3, AUTO_EASY = ['esquinas', 'centro', 'cuadro', 'linea'], AUTO_LATER = ['ele', 'equis', 'marco', 'rieles', 'escalera'], FINAL = ['siete', 'equis', 'llena'];
  var AUTO_LINES = [['linea-0', 4], ['linea', 3], ['linea-3', 1], ['linea-4', 1], ['linea-7', 1]]; // the top line most, as they like it
  function autoGood(a) {
    a = a && typeof a === 'object' ? a : {};
    var num = function (x) { return typeof x === 'number' && isFinite(x) && x > 0 ? x : 0; };
    return { night: num(a.night), t: num(a.t), cutoff: num(a.cutoff), recent: (Array.isArray(a.recent) ? a.recent : []).filter(function (x) { return x === 0 || x === 1; }).slice(-3),
      fin: [1, 2, 3, 4].indexOf(a.fin) >= 0 ? a.fin : 0, finAt: num(a.finAt), rid: typeof a.rid === 'string' ? a.rid : '', pick: (Array.isArray(a.pick) ? a.pick : []).filter(function (id) { return typeof id === 'string' && pat(id); }) };
  }
  function autoNight(a, now) { return !a.t || now - a.t >= NIGHT; } // no card yet tonight
  // A card called at now. ids and rid for a round's first card: its game, counted once for the round rid.
  function autoCard(a, now, rnd, ids, rid) {
    if (autoNight(a, now)) { a.night = now; a.cutoff = Math.round((15 + 5 * rnd()) * 60e3); a.recent = []; if (!(a.finAt > a.t)) a.fin = 0; } // a final three left from the last night is over, not one tapped since
    a.t = now;
    if (ids && rid !== a.rid) {
      a.rid = rid; a.recent = a.recent.concat(isClasico(ids) ? 1 : 0).slice(-3);
      a.fin = a.fin >= 1 && a.fin <= 3 ? a.fin + 1 : 0;
    }
  }
  // Final three tapped at now: on, the next three rounds are its games; off, the usual picks.
  function autoFinal(a, on, now) { a.fin = on ? 1 : 0; a.finAt = now; }
  // Where the final three is at now: fin, or 0 for one left from a night that's over (six hours with no card since).
  function autoFin(a, now) { return autoNight(a, now) && a.t && !(a.finAt > a.t) ? 0 : a.fin; }
  // The chance a round past the Clásico stretch is something else, m minutes past it.
  function autoChance(m) { return 0.1 + 0.45 * Math.min(1, Math.max(0, m) / 75); }
  function weighted(list, rnd) { var tot = 0, i; for (i = 0; i < list.length; i++) tot += list[i][1]; var x = rnd() * tot; for (i = 0; i < list.length; i++) { x -= list[i][1]; if (x < 0) return list[i][0]; } return list[list.length - 1][0]; }
  // The game for the next round, at now.
  function autoPick(a, now, rnd) {
    var fin = autoFin(a, now);
    if (fin >= 1 && fin <= 3) return [FINAL[fin - 1]];
    if (autoNight(a, now) || now - a.night < a.cutoff) return CLASICO.slice();
    var run = 0; for (var i = a.recent.length - 1; i >= 0 && !a.recent[i]; i--) run++;
    if (run >= 2) return CLASICO.slice();
    var m = (now - a.night - a.cutoff) / 60e3;
    if (rnd() >= autoChance(m)) return CLASICO.slice();
    if (rnd() < 0.4) return ['siete'];
    var later = 0.7 * Math.min(1, m / 90), id = weighted(AUTO_EASY.map(function (x) { return [x, 1]; }).concat(AUTO_LATER.map(function (x) { return [x, later]; })), rnd);
    return [id === 'linea' ? weighted(AUTO_LINES, rnd) : id];
  }

  // ---------- the line picker ----------
  // Under Línea in a game picker, while the game is Línea: which lines count. Any line (the start), the top, bottom,
  // left or right line in one tap, or any set of the ten tapped in and out on a little tabla: a handle at the start of
  // each row and column, and at the top corners for the diagonals, the squares of the lines that count lit. ids: the
  // game, its Línea changed in place; then(id, note) after a tap, with the Línea now played, and a note to show when
  // the tap changed nothing (the last line can't go: some line has to count).
  function linePicker(host, ids, then) {
    var id = lineaIn(ids); if (!id) { host.innerHTML = ''; return; }
    var ls = linesOf(id), on = {}, lit = {}, all = LINES.map(function (s, i) { return i; });
    var Q = [['all', T ? T('line.any') : 'Any line', all], ['top', T ? T('line.qTop') : 'Top', [0]], ['bottom', T ? T('line.qBottom') : 'Bottom', [3]], ['left', T ? T('line.qLeft') : 'Left', [4]], ['right', T ? T('line.qRight') : 'Right', [7]]];
    ls.forEach(function (l) { on[l] = 1; LINES[l].forEach(function (c) { lit[c] = 1; }); });
    function handle(l, arrow) { var nm = lineWords([l]).name; return '<button type="button" class="lh' + (on[l] ? ' on' : '') + '" data-l="' + l + '" aria-pressed="' + !!on[l] + '" aria-label="' + nm + '" title="' + nm + '">' + arrow + '</button>'; }
    var g = handle(8, '↘'), c, r, x; for (c = 4; c < 8; c++) g += handle(c, '↓'); g += handle(9, '↙');
    for (r = 0; r < 4; r++) { g += handle(r, '→'); for (x = 0; x < 4; x++) g += '<i class="' + (lit[r * 4 + x] ? 'on' : '') + '"></i>'; g += '<span></span>'; }
    var head = T ? T('line.h') : 'Which lines count';
    host.innerHTML = '<div class="lnhd"><b>' + head + '</b><span>' + (T ? T('line.note') : 'Tap a line’s arrow to add it or take it out.') + '</span></div>' +
      '<div class="lnq">' + Q.map(function (q) { var o = q[2].join() === ls.join(); return '<button type="button" class="chip' + (o ? ' on' : '') + '" data-q="' + q[0] + '" aria-pressed="' + o + '">' + q[1] + '</button>'; }).join('') + '</div>' +
      '<div class="lng" role="group" aria-label="' + head + '">' + g + '</div>';
    function set(next, sel) {
      var nid = lineId(next); ids[ids.indexOf(id)] = nid;
      var had = host.contains(document.activeElement);
      linePicker(host, ids, then);
      if (had) { var b = host.querySelector(sel); if (b) b.focus({ preventScroll: true }); } // the keyboard stays where it was
      then(nid);
    }
    [].forEach.call(host.querySelectorAll('[data-q]'), function (b) { b.addEventListener('click', function () { set(Q.filter(function (q) { return q[0] === b.dataset.q; })[0][2], '[data-q="' + b.dataset.q + '"]'); }); });
    [].forEach.call(host.querySelectorAll('.lh'), function (b) {
      b.addEventListener('click', function () {
        var l = +b.dataset.l;
        if (!on[l]) { set(ls.concat(l), '[data-l="' + l + '"]'); return; }
        if (ls.length === 1) { then(id, T ? T('line.last') : 'One line at least has to count'); return; }
        set(ls.filter(function (x) { return x !== l; }), '[data-l="' + l + '"]');
      });
    });
  }

  window.Loteria = {
    CARDS: CARDS, BYFILE: BYFILE, card: card, src: src, fold: fold, findCards: findCards, originals: originals,
    PATS: PATS, CLASICO: CLASICO, ALL: ALL, pat: pat, patSub: patSub, LINES: LINES, lineId: lineId, linesOf: linesOf, isLinea: isLinea, lineaIn: lineaIn, linePicker: linePicker, isClasico: isClasico, hasClasico: hasClasico, gameName: gameName, holdShape: holdShape, squaresNeeded: squaresNeeded, check: check, closest: closest, defaultPaper: defaultPaper, confetti: confetti,
    autoGood: autoGood, autoNight: autoNight, autoCard: autoCard, autoFinal: autoFinal, autoFin: autoFin, autoChance: autoChance, autoPick: autoPick, FINAL: FINAL, NIGHT: NIGHT,
    juegoName: juegoName, juego: juego, juegoTabla: juegoTabla, randomJuego: randomJuego
  };
})();
