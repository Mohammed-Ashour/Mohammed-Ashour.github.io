// Role-specific pixel illustrations, generated at build time.
// Each item gets a small icon (28 x 28 cells) and an unframed large scene (100 x 100 cells).
// Letters map to colours in OBJ_CSS and palette.css.

const hash = (x, y, s) => { const h = Math.sin(x * 127.1 + y * 311.7 + s * 74.7) * 43758.5453; return h - Math.floor(h); };
const vnoise = (x, y, s) => {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = hash(xi, yi, s), b = hash(xi + 1, yi, s), c = hash(xi, yi + 1, s), d = hash(xi + 1, yi + 1, s);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
};

class Grid {
  constructor(w, h, clip) { this.w = w; this.h = h; this.m = new Map(); this.clip = clip; }
  set(x, y, v) {
    x = Math.round(x); y = Math.round(y);
    if (!v || x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    if (this.clip) { const dx = x + .5 - this.clip[0], dy = y + .5 - this.clip[1]; if (dx * dx + dy * dy > this.clip[2] ** 2) return; }
    this.m.set(y * this.w + x, v);
  }
  rect(x, y, w, h, v) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.set(x + i, y + j, v); }
  box(x, y, w, h, v) { for (let i = 0; i < w; i++) { this.set(x + i, y, v); this.set(x + i, y + h - 1, v); } for (let j = 0; j < h; j++) { this.set(x, y + j, v); this.set(x + w - 1, y + j, v); } }
  ell(cx, cy, rx, ry, v) { for (let y = Math.floor(cy - ry); y <= cy + ry; y++) for (let x = Math.floor(cx - rx); x <= cx + rx; x++) { const dx = (x + .5 - cx) / rx, dy = (y + .5 - cy) / ry; if (dx * dx + dy * dy <= 1) this.set(x, y, typeof v === 'function' ? v(x, y) : v); } }
  poly(pts, v) {
    const ys = pts.map(p => p[1]), y0 = Math.floor(Math.min(...ys)), y1 = Math.ceil(Math.max(...ys));
    const xs = pts.map(p => p[0]), x0 = Math.floor(Math.min(...xs)), x1 = Math.ceil(Math.max(...xs));
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const px = x + .5, py = y + .5; let inside = false;
      for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
        const [xi, yi] = pts[i], [xj, yj] = pts[j];
        if ((yi > py) !== (yj > py) && px < (xj - xi) * (py - yi) / (yj - yi) + xi) inside = !inside;
      }
      if (inside) this.set(x, y, typeof v === 'function' ? v(x, y) : v);
    }
  }
  line(x0, y0, x1, y1, v, dot = 1) {
    x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
    let dx = Math.abs(x1 - x0), sx = x0 < x1 ? 1 : -1, dy = -Math.abs(y1 - y0), sy = y0 < y1 ? 1 : -1, e = dx + dy, i = 0;
    for (let n = 0; n < 4000; n++) { if (i++ % dot === 0) this.set(x0, y0, v); if (x0 === x1 && y0 === y1) break; const e2 = 2 * e; if (e2 >= dy) { e += dy; x0 += sx; } if (e2 <= dx) { e += dx; y0 += sy; } }
  }
  // rows of characters; '.' is transparent. (x, y) is the top-left cell.
  sprite(rows, x, y) { rows.forEach((row, r) => [...row].forEach((ch, k) => ch !== '.' && this.set(x + k, y + r, ch))); }
  arc(cx, cy, rad, v, step = 1, a0 = 0, a1 = 360) {
    const n = Math.round(rad * 2 * Math.PI); let last = '';
    for (let i = 0, k = 0; i < n * 4; i++) {
      const a = a0 + (a1 - a0) * i / (n * 4), x = Math.round(cx + Math.cos(a * Math.PI / 180) * rad - .5), y = Math.round(cy + Math.sin(a * Math.PI / 180) * rad - .5);
      if (`${x},${y}` === last) continue; last = `${x},${y}`;
      if (k++ % step === 0) this.set(x, y, v);
    }
  }
  svg() {
    const byColor = {};
    for (let y = 0; y < this.h; y++) {
      let x = 0;
      while (x < this.w) {
        const v = this.m.get(y * this.w + x); if (!v) { x++; continue; }
        let e = x + 1; while (e < this.w && this.m.get(y * this.w + e) === v) e++;
        (byColor[v] ||= []).push(`M${x} ${y}h${e - x}v1h-${e - x}z`); x = e;
      }
    }
    return Object.entries(byColor).map(([c, d]) => `<path class="p${c}" d="${d.join('')}"/>`).join('');
  }
}

// Thermal ramp, cold to hot: 1 2 3 4 5 6.
const HEAT = ['1', '2', '3', '4', '5', '6'];

// ---------- shared small drawings ----------

function cylinder(g, cx, top, rx, h, bands = []) {
  // A database cylinder: body, banded joints, lit top.
  g.rect(cx - rx, top, rx * 2, h, 'g');
  for (let j = 0; j < h; j++) { g.set(cx + rx - 1, top + j, 'G'); g.set(cx + rx - 2, top + j, 'G'); g.set(cx - rx, top + j, 'w'); }
  g.ell(cx, top + h, rx, Math.max(1.5, rx / 3), (x, y) => y >= top + h ? (x >= cx + rx - 2 ? 'G' : 'g') : null);
  bands.forEach(b => g.ell(cx, top + b, rx, Math.max(1.5, rx / 3), (x, y) => y >= top + b && y <= top + b + 1 ? 'k' : null));
  g.ell(cx, top, rx, Math.max(1.5, rx / 3), (x, y) => y < top + .5 * Math.max(1.5, rx / 3) ? 'w' : 'i');
}
function cloud(g, x, y, s = 1) {
  // A pixel cloud with a flat base. (x, y) is the top-left of its bounding box.
  g.ell(x + 6 * s, y + 5 * s, 5 * s, 4 * s, 'w');
  g.ell(x + 12 * s, y + 4 * s, 6 * s, 5 * s, 'w');
  g.ell(x + 17 * s, y + 6 * s, 4 * s, 3.5 * s, 'w');
  g.rect(x + 2 * s, y + 6 * s, 18 * s, 3 * s, 'w');
  for (let i = 2 * s; i < 20 * s; i++) g.set(x + i, y + 9 * s - 1, 'i');
}
function windowFrame(g, x, y, w, h) {
  g.rect(x, y, w, h, 'k'); g.box(x, y, w, h, 'w'); g.rect(x, y, w, 3, 'w');
  g.set(x + 2, y + 1, 'a'); g.set(x + 4, y + 1, 'g'); g.set(x + 6, y + 1, 'g');
}

// ---------- large scenes (100 x 100, window radius 44 centred at 50,50) ----------

const SCENES = {
  hydrosat(g) {
    // Ground below a curved horizon, a thermal footprint, a lifted tile, and the satellite.
    const hz = x => 64 + (x - 50) ** 2 / 170;
    for (let x = 0; x < 100; x++) for (let y = Math.ceil(hz(x)); y < 100; y++) {
      const n = vnoise(x / 6, y / 3.2, 3), w = vnoise(x / 11 + 3, y / 5, 7);
      g.set(x, y, w < .3 ? ((x + y) % 5 ? 's' : 'S') : n > .56 ? 'L' : 'l');
    }
    for (let x = 0; x < 100; x++) g.set(x, Math.ceil(hz(x)) - 1, 'h');
    // Footprint on the ground, in false colour: fields of different temperature.
    const foot = [[49, 69], [73, 69], [83, 88], [39, 88]];
    g.poly(foot, (x, y) => {
      const fx = Math.floor((x - 30) / 4.5 + (y - 69) * .12), fy = Math.floor((y - 69) / 3.4);
      const base = vnoise(fx / 2.2, fy / 1.6, 11) * .8 + hash(fx, fy, 4) * .35;
      return HEAT[Math.max(0, Math.min(5, Math.floor(base * 5.2)))];
    });
    g.line(49, 69, 73, 69, 'a'); g.line(73, 69, 83, 88, 'a'); g.line(39, 88, 49, 69, 'a'); g.line(39, 88, 83, 88, 'a');
    // Beam from the sensor down to the footprint.
    g.poly([[58, 32], [62, 32], [73, 68], [49, 68]], (x, y) => (x + y) % 2 === 0 && y % 3 === 0 ? 'a' : null);
    g.line(58, 32, 49, 68, 'a', 2); g.line(61, 32, 73, 68, 'a', 2);
    // One tile lifted out of the footprint for processing.
    const tx = 82, ty = 52;
    for (let j = 0; j < 8; j++) for (let i = 0; i < 8; i++) g.set(tx + i, ty + j, HEAT[Math.max(0, Math.min(5, Math.floor((vnoise(i / 3, j / 3, 12) * .9 + hash(i >> 1, j >> 1, 2) * .3) * 5.4)))]);
    g.box(tx - 1, ty - 1, 10, 10, 'w');
    g.line(77, 78, tx + 2, ty + 10, 'a', 2);
    g.sprite(['.....a', '....a.', 'a..a..', '.aa...'], tx + 2, ty - 7);
    // Satellite: bus, two solar wings, a downward-looking imager.
    g.rect(41, 18, 12, 6, 'b'); g.rect(67, 18, 12, 6, 'b');
    for (let i = 0; i < 12; i += 3) { g.rect(41 + i, 18, 1, 6, 'B'); g.rect(67 + i, 18, 1, 6, 'B'); }
    g.rect(41, 20, 12, 1, 'B'); g.rect(67, 20, 12, 1, 'B');
    g.rect(53, 20, 3, 2, 'g'); g.rect(64, 20, 3, 2, 'g');
    g.rect(56, 14, 8, 12, 'w'); g.rect(62, 14, 2, 12, 'g'); g.rect(56, 14, 8, 1, 'i');
    g.rect(57, 17, 4, 1, 'G'); g.rect(57, 22, 4, 1, 'G');
    g.rect(57, 26, 6, 4, 'g'); g.rect(61, 26, 2, 4, 'G'); g.rect(57, 30, 6, 1, 'k'); g.rect(58, 31, 4, 1, 'n');
    g.set(58, 30, 'a'); g.set(59, 30, 'a');
  },

  spire(g) {
    // Radio occultation. A GNSS satellite (left) and a small receiver (right) sit low on either side of Earth.
    // The signal reaches the receiver because the atmosphere bends it around the limb: the amber ray curves
    // over the top, touching the air at one tangent point. The dotted chord is the straight line, which Earth blocks.
    const ec = [56, 75], er = 34;
    g.arc(ec[0], ec[1], er + 9, 'h', 2, 180, 360);
    g.arc(ec[0], ec[1], er + 5, 'h', 4, 180, 360);
    g.ell(ec[0], ec[1], er + 1.8, er + 1.8, 'h');
    g.ell(ec[0], ec[1], er, er, (x, y) => {
      const n = vnoise(x / 6, y / 4, 8), m = vnoise(x / 3, y / 3, 17), dy = (y - ec[1]) / er;
      let c = n > .66 || dy < -.86 + (m - .5) * .2 ? (m > .55 ? 'I' : 'i') : ((x + 2 * y) % 9 === 0 ? 'S' : 's');
      const lit = (x - ec[0]) / er * .7 + dy * .4;
      if (lit > .5 || (lit > .3 && (x + y) % 2 === 0)) c = 'n';
      return c;
    });
    const A = [30, 46], B = [84, 46], T = [57, 34];
    // Straight chord: dotted, drawn over Earth to show it would be blocked.
    for (let x = A[0] + 3; x <= B[0] - 3; x += 2) { const dx = x + .5 - ec[0], dy = A[1] + .5 - ec[1]; g.set(x, A[1], dx * dx + dy * dy < er * er ? 'k' : 'g'); }
    // The bent ray, flat at the tangent point and curving down towards each satellite.
    let prev = null;
    for (let x = A[0]; x <= B[0]; x += .25) {
      const u = (x - T[0]) / (x < T[0] ? T[0] - A[0] : B[0] - T[0]);
      const k = .5, y = T[1] + (A[1] - T[1]) * (Math.sqrt(u * u + k * k) - k) / (Math.sqrt(1 + k * k) - k);
      const p = [Math.round(x), Math.round(y)];
      if (prev) g.line(prev[0], prev[1], p[0], p[1], 'a'); prev = p;
    }
    g.rect(T[0] - 1, T[1] - 1, 3, 1, 'w');
    // GNSS transmitter: body, two wings, an antenna face towards the limb.
    g.sprite([
      'bBbB.......bBbB',
      'bBbBgwwwwwgbBbB',
      'bBbB.wwwgg.bBbB',
      'bBbB.wwwgg.bBbB',
      '.....wwwgg.....',
      '.......aa......',
    ], 22, 41);
    // Receiver: a small satellite with short wings and a limb-facing antenna.
    g.sprite([
      '...wwww...',
      'bBgwwwgGbB',
      'bB.wwgg.bB',
      'bB.wwgg.bB',
      '...aa.....',
    ], 81, 42);
  },

  yaoota(g) {
    // A product search page: search box, results with thumbnails and prices; pages fed in from the left.
    const x = 34, y = 22, w = 52, h = 46;
    windowFrame(g, x, y, w, h);
    // Search box with a magnifier.
    g.rect(x + 4, y + 6, w - 8, 7, 'w'); g.rect(x + 5, y + 7, w - 10, 5, 'i');
    g.rect(x + 7, y + 9, 14, 1, 'G'); g.rect(x + 22, y + 9, 6, 1, 'G'); g.set(x + 29, y + 8, 'k'); g.set(x + 29, y + 9, 'k'); g.set(x + 29, y + 10, 'k');
    g.sprite(['.aaa..', 'a...a.', 'a...a.', '.aaa..', '....a.', '.....a'].map(r => r), x + w - 12, y + 6);
    // Three results: thumbnail, name, price.
    const thumbs = [
      ['..kkkk..', '..kbbk..', '..kbbk..', '..kbbk..', '..kbbk..', '..kkkk..', '...gg...'], // phone
      ['.......', '..ggg..', '.g...g.', 'gwwwwwg', 'gwwwwwgg', 'gwwwwwg.', '.ggggg..'], // kettle
      ['........', '........', 'mmm.....', 'mMmmm...', 'mmmmmmm.', 'wwwwwwww', '........'], // shoe
    ];
    thumbs.forEach((t, i) => {
      const ry = y + 16 + i * 10;
      g.rect(x + 4, ry, 10, 9, 'n'); g.sprite(t, x + 5, ry + 1);
      g.rect(x + 17, ry + 1, 20 - i * 3, 1, 'w'); g.rect(x + 17, ry + 3, 12 + i * 2, 1, 'g');
      g.rect(x + 17, ry + 6, 7, 2, 'a'); g.rect(x + w - 12, ry + 6, 7, 2, 'a'); g.rect(x + w - 12, ry + 6, 7, 2, i === 1 ? 'a' : 'g');
    });
    // Scraped pages entering from the left.
    [[22, 34], [24, 50], [22, 66]].forEach(([px, py]) => {
      g.rect(px, py, 6, 8, 'w'); g.rect(px + 1, py + 2, 4, 1, 'g'); g.rect(px + 1, py + 4, 3, 1, 'g'); g.set(px + 5, py, 'g');
      g.line(px + 7, py + 4, x - 1, py + 4 + (y + 30 - py) * .3, 'a', 2);
    });
  },

  eaf(g) {
    // One database in the middle; internal applications for several departments around it.
    cylinder(g, 58, 38, 11, 22, [7, 14]);
    const apps = [[28, 26, 'form'], [74, 22, 'table'], [26, 64, 'chart'], [72, 66, 'form']];
    apps.forEach(([ax, ay, kind]) => {
      const cx = ax + 7, cy = ay + 6;
      g.line(cx < 58 ? ax + 15 : ax - 1, cy, cx < 58 ? 46 : 70, cy < 50 ? 44 : 56, 'a', 2);
    });
    apps.forEach(([ax, ay, kind]) => {
      windowFrame(g, ax, ay, 16, 13);
      if (kind === 'form') for (let r = 0; r < 3; r++) { g.rect(ax + 2, ay + 5 + r * 2.5, 3, 1, 'g'); g.rect(ax + 6, ay + 5 + r * 2.5, 8, 1, 'w'); }
      if (kind === 'table') { for (let r = 0; r < 4; r++) g.rect(ax + 2, ay + 4 + r * 2, 12, 1, r ? 'g' : 'w'); g.rect(ax + 7, ay + 4, 1, 8, 'G'); }
      if (kind === 'chart') { [3, 5, 2, 6, 4].forEach((hh, i) => g.rect(ax + 3 + i * 2, ay + 11 - hh, 1, hh, i === 3 ? 'a' : 'h')); }
    });
  },

  elements(g) {
    // A card payment goes through a gateway to a business.
    // Card.
    g.rect(22, 40, 22, 14, 'B'); g.rect(22, 40, 22, 1, 'b'); g.rect(22, 43, 22, 3, 'k');
    g.rect(25, 48, 4, 3, 'y'); g.rect(26, 49, 2, 1, 'Y'); g.rect(31, 49, 8, 1, 'w'); g.rect(31, 51, 5, 1, 'b');
    // Path.
    g.line(45, 47, 54, 47, 'a', 2); g.line(72, 47, 80, 47, 'a', 2);
    // Gateway: two posts, a lintel, a lock above the opening.
    g.rect(54, 34, 4, 28, 'g'); g.rect(68, 34, 4, 28, 'g'); g.rect(57, 34, 1, 28, 'G'); g.rect(71, 34, 1, 28, 'G');
    g.rect(52, 31, 22, 4, 'w'); g.rect(52, 34, 22, 1, 'g');
    g.rect(52, 62, 22, 2, 'G');
    g.sprite(['..aaa..', '.a...a.', '.a...a.', 'aaaaaaa', 'aaakaaa', 'aaakaaa', 'aaaaaaa'], 60, 22);
    for (let i = 59; i <= 66; i += 2) g.set(i, 47, 'a');
    // Business: a shop front with an awning.
    g.rect(78, 40, 12, 22, 'c'); g.rect(78, 40, 12, 1, 'C');
    for (let i = 0; i < 14; i++) g.rect(77 + i, 36, 1, 4, i % 4 < 2 ? 'a' : 'w');
    g.rect(81, 47, 6, 15, 'k'); g.rect(85, 54, 1, 1, 'a'); g.rect(80, 43, 8, 2, 'n');
    g.rect(74, 62, 20, 1, 'G');
    g.sprite(['....e', '...e.', 'e.e..', '.e...'], 82, 28);
  },

  freelance(g) {
    // A laptop with Python-style indented code, a mug, and three clients it delivered to.
    g.rect(36, 32, 40, 26, 'g'); g.rect(38, 34, 36, 22, 'k');
    const code = [[0, 4, 'a'], [5, 10, 'w'], [3, 7, 'h'], [6, 12, 'w'], [3, 5, 'a'], [6, 9, 'g'], [0, 3, 'a'], [3, 14, 'w']];
    code.forEach(([ind, len, c], i) => { g.rect(41 + ind * 1.5, 36 + i * 2.5, len, 1, c); });
    g.rect(64, 41, 1, 4, 'a');
    g.poly([[32, 58], [80, 58], [84, 63], [28, 63]], 'w'); g.rect(29, 63, 55, 1, 'g'); g.rect(50, 59, 12, 1, 'g');
    // Mug.
    const mx = 20;
    g.rect(mx, 50, 7, 8, 'w'); g.rect(mx + 6, 50, 1, 8, 'g'); g.box(mx + 7, 52, 3, 4, 'w'); g.rect(mx, 50, 7, 1, 'M');
    g.set(mx + 2, 47, 'g'); g.set(mx + 3, 46, 'g'); g.set(mx + 2, 45, 'g'); g.set(mx + 5, 47, 'g'); g.set(mx + 4, 46, 'g');
    // Clients, each a small figure, joined to the laptop.
    [[32, 16], [56, 12], [80, 18]].forEach(([cx, cy]) => {
      g.sprite(['.ww.', '.ww.', '....', '.ww.', 'wwww', 'wwww'], cx, cy);
      g.line(cx + 2, cy + 7, 56 + (cx - 56) * .4, 31, 'a', 2);
    });
    // Desk.
    g.rect(14, 64, 80, 2, 'C'); g.rect(14, 64, 80, 1, 'c');
  },

  codescalers(g) {
    // A monitoring dashboard: cloud machines above, their charts and status on a screen below.
    cloud(g, 44, 14, 1);
    g.line(57, 24, 57, 33, 'a', 2);
    // Monitor.
    g.rect(30, 34, 54, 34, 'g'); g.rect(32, 36, 50, 29, 'k');
    // Line chart.
    g.rect(35, 40, 1, 14, 'G'); g.rect(35, 53, 26, 1, 'G');
    const pts = [[36, 50], [40, 47], [44, 49], [48, 43], [52, 45], [56, 41], [60, 44]];
    pts.slice(1).forEach((p, i) => g.line(pts[i][0], pts[i][1], p[0], p[1], 'e'));
    // Status column: three machines, one needing attention.
    ['e', 'e', 'a'].forEach((c, i) => { g.rect(65, 40 + i * 5, 3, 3, c); g.rect(70, 41 + i * 5, 9, 1, 'g'); });
    // Gauges.
    [[35, 57, 14], [53, 57, 8], [65, 57, 11]].forEach(([gx, gy, ww]) => { g.rect(gx, gy, 14, 3, 'n'); g.rect(gx, gy, ww, 3, ww > 12 ? 'a' : 'h'); });
    g.rect(53, 68, 8, 4, 'G'); g.rect(46, 72, 22, 2, 'g');
  },

  toolkit(g) {
    // A pegboard with one tool per skill group: languages, data, cloud, CI/CD, ML. Drawn 6 cells higher to leave room for the engineer.
    const set = g.set; g.set = (x, y, v) => set.call(g, x, y - 6, v);
    g.rect(28, 24, 60, 48, 'k');
    for (let y = 27; y < 71; y += 4) for (let x = 31; x < 86; x += 4) g.set(x, y, 'o');
    // Languages: a terminal prompt.
    g.rect(33, 31, 15, 11, 'n'); g.box(33, 31, 15, 11, 'w');
    g.sprite(['a..', '.a.', 'a..'], 35, 34); g.rect(39, 38, 5, 1, 'w');
    // Data: a cylinder.
    cylinder(g, 58, 31, 6, 9, [4]);
    // Cloud.
    cloud(g, 67, 30, .8);
    // CI/CD: a looping pipe with an arrow.
    g.arc(40.5, 61.5, 6, 'h', 1, -60, 230); g.arc(40.5, 61.5, 5, 'h', 1, -60, 230);
    g.sprite(['a....', 'aa...', 'aaa..', 'aaaa.'], 43, 53);
    // ML: axes, points, and a fitted line.
    g.rect(58, 54, 1, 14, 'g'); g.rect(58, 67, 24, 1, 'g');
    [[61, 64], [64, 62], [66, 63], [69, 60], [72, 58], [74, 59], [77, 56], [79, 57]].forEach(([px, py]) => g.set(px, py, 'w'));
    g.line(60, 66, 80, 55, 'a');
    // Hooks.
    [[40, 29], [58, 28], [76, 28], [40, 52], [69, 52]].forEach(([hx, hy]) => g.rect(hx, hy, 1, 2, 'g'));
    delete g.set;
  },

  school(g) {
    // A mortarboard for the degree, an open notebook for the blog, a video frame for teaching.
    g.poly([[50, 54], [74, 60], [98, 54], [74, 48]].map(([x, y]) => [x - 18, y + 8]), 'w');
    // Open book.
    g.poly([[30, 58], [56, 54], [56, 78], [30, 80]], 'w');
    g.poly([[58, 54], [84, 58], [84, 80], [58, 78]], 'w');
    g.rect(56, 54, 2, 25, 'g'); g.poly([[29, 80], [56, 78], [58, 78], [85, 80], [85, 82], [29, 82]], 'C');
    for (let r = 0; r < 6; r++) { g.line(33, 62 + r * 2.8, 53, 59 + r * 2.8, 'g'); g.line(61, 59 + r * 2.8, 81 - (r === 5 ? 8 : 0), 62 + r * 2.8, 'g'); }
    // Pen across the right page.
    g.line(66, 74, 88, 52, 'y'); g.line(67, 74, 89, 52, 'Y'); g.set(65, 75, 'k'); g.set(88, 51, 'a'); g.set(89, 51, 'a');
    // Keep the cap and its tassel separate from the teaching video frame.
    const cx = 3, cy = 5;
    g.poly([[28 + cx, 30 + cy], [42 + cx, 24 + cy], [56 + cx, 30 + cy], [42 + cx, 36 + cy]], 'k'); g.line(28 + cx, 30 + cy, 42 + cx, 36 + cy, 'G'); g.line(42 + cx, 36 + cy, 56 + cx, 30 + cy, 'G');
    g.rect(35 + cx, 33 + cy, 14, 6, 'k'); g.rect(35 + cx, 38 + cy, 14, 1, 'G');
    g.set(42 + cx, 30 + cy, 'a'); g.line(42 + cx, 30 + cy, 52 + cx, 32 + cy, 'a'); g.line(52 + cx, 32 + cy, 52 + cx, 40 + cy, 'a'); g.rect(51 + cx, 40 + cy, 3, 2, 'a');
    // Video frame.
    g.rect(64, 24, 22, 15, 'w'); g.rect(66, 26, 18, 11, 'n');
    g.sprite(['a...', 'aa..', 'aaa.', 'aa..', 'a...'], 73, 29);
    g.rect(66, 39, 18, 1, 'g'); g.rect(66, 39, 7, 1, 'a');
  },
};

// ---------- icons (28 x 28) ----------

const ICONS = {
  hydrosat(g) {
    g.rect(2, 4, 7, 4, 'b'); g.rect(19, 4, 7, 4, 'b'); g.rect(5, 4, 1, 4, 'B'); g.rect(22, 4, 1, 4, 'B');
    g.rect(9, 5, 2, 1, 'g'); g.rect(17, 5, 2, 1, 'g');
    g.rect(11, 2, 6, 7, 'w'); g.rect(15, 2, 2, 7, 'g');
    g.rect(12, 9, 4, 2, 'g'); g.rect(12, 11, 4, 1, 'k');
    g.poly([[12, 12], [16, 12], [24, 18], [4, 18]], (x, y) => (x + y) % 2 === 0 ? 'a' : null);
    const L = [[1, 2, 3, 2, 1, 2], [2, 4, 6, 5, 3, 1], [1, 3, 5, 4, 2, 2], [1, 1, 2, 3, 2, 1]];
    L.forEach((row, j) => row.forEach((v, i) => g.rect(3 + i * 4, 18 + j * 2.5, 4, j === 3 ? 2 : 3, HEAT[v - 1])));
    g.box(2, 17, 26, 11, 'a');
  },
  spire(g) {
    g.ell(14, 42, 21.4, 21.4, 'h');
    g.ell(14, 42, 20.2, 20.2, (x, y) => vnoise(x / 3, y / 2, 8) > .62 || y < 24 ? 'i' : ((x - 14) * .7 + (y - 42) * .4 > 7 ? 'n' : 's'));
    g.sprite(['b.....b', 'bbwwwbb', 'b.www.b', '...a...'], 0, 16);
    g.sprite(['bwwb', 'b.gb', '.a..'], 23, 17);
    const pts = [[4, 19], [7, 15], [11, 13], [14, 13], [17, 13], [21, 15], [24, 19]];
    pts.slice(1).forEach((p, i) => g.line(pts[i][0], pts[i][1], p[0], p[1], 'a'));
  },
  yaoota(g) {
    g.rect(1, 3, 26, 22, 'k'); g.box(1, 3, 26, 22, 'w'); g.rect(1, 3, 26, 2, 'w');
    g.rect(4, 7, 20, 5, 'w'); g.rect(6, 9, 8, 1, 'G');
    g.sprite(['.aa..', 'a..a.', 'a..a.', '.aa..', '...a.', '....a'], 19, 7);
    [[4, 15], [4, 20]].forEach(([x, y], i) => { g.rect(x, y, 4, 4, i ? 'm' : 'b'); g.rect(x + 6, y, 10, 1, 'g'); g.rect(x + 6, y + 2, 5, 2, 'a'); });
  },
  eaf(g) {
    cylinder(g, 14, 6, 6, 15, [5, 10]);
    [[0, 4], [21, 15]].forEach(([x, y]) => { g.rect(x, y, 7, 7, 'k'); g.box(x, y, 7, 7, 'w'); g.rect(x, y, 7, 2, 'w'); g.rect(x + 2, y + 3, 3, 1, 'g'); g.rect(x + 2, y + 5, 3, 1, 'g'); });
    g.line(7, 7, 8, 7, 'a'); g.line(20, 18, 21, 18, 'a');
  },
  elements(g) {
    g.rect(1, 11, 15, 10, 'B'); g.rect(1, 13, 15, 2, 'k'); g.rect(3, 16, 3, 2, 'y'); g.rect(8, 18, 6, 1, 'w');
    g.rect(17, 8, 2, 17, 'g'); g.rect(25, 8, 2, 17, 'g'); g.rect(16, 6, 12, 2, 'w');
    g.sprite(['.aa.', 'a..a', 'aaaa', 'akaa', 'aaaa'], 20, 0);
    for (let i = 19; i < 25; i += 2) g.set(i, 16, 'a');
  },
  freelance(g) {
    g.rect(3, 5, 19, 13, 'g'); g.rect(4, 6, 17, 11, 'k');
    [[0, 4, 'a'], [2, 8, 'w'], [2, 5, 'h'], [0, 3, 'a'], [2, 9, 'w']].forEach(([ind, len, c], i) => g.rect(6 + ind, 7 + i * 2, len, 1, c));
    g.poly([[2, 18], [23, 18], [26, 21], [-1, 21]], 'w'); g.rect(10, 18, 5, 1, 'g');
    g.rect(22, 11, 4, 5, 'w'); g.box(25, 12, 2, 3, 'w'); g.rect(22, 11, 4, 1, 'M');
    g.rect(0, 22, 28, 1, 'C');
  },
  codescalers(g) {
    g.ell(10, 4, 3.5, 3, 'w'); g.ell(15, 3.5, 4, 3.5, 'w'); g.ell(19, 5, 3, 2.5, 'w'); g.rect(8, 5, 13, 2, 'w');
    g.rect(14, 7, 1, 2, 'a');
    g.rect(2, 9, 24, 15, 'g'); g.rect(3, 10, 22, 13, 'k');
    [[4, 19], [7, 16], [10, 18], [13, 13], [16, 15]].reduce((a, b) => (g.line(a[0], a[1], b[0], b[1], 'e'), b));
    g.rect(19, 12, 2, 2, 'e'); g.rect(19, 15, 2, 2, 'e'); g.rect(19, 18, 2, 2, 'a');
    g.rect(12, 24, 4, 2, 'G'); g.rect(9, 26, 10, 1, 'g');
  },
  toolkit(g) {
    g.rect(10, 4, 8, 2, 'g'); g.rect(10, 4, 1, 5, 'g'); g.rect(17, 4, 1, 5, 'g');
    g.rect(2, 8, 24, 5, 'M'); g.rect(2, 12, 24, 13, 'm'); g.rect(2, 12, 24, 1, 'M');
    g.rect(12, 11, 4, 3, 'a');
    g.sprite(['..w.....w..', '.w.......w.', 'w...w.w...w', '.w..w.w..w.', '..w.....w..'], 8, 16);
    g.rect(2, 24, 24, 1, 'M');
  },
  school(g) {
    g.poly([[4, 6], [14, 2], [24, 6], [14, 10]], 'k'); g.line(4, 6, 14, 10, 'G'); g.line(14, 10, 24, 6, 'G');
    g.rect(9, 8, 10, 3, 'k'); g.line(14, 6, 21, 8, 'a'); g.rect(21, 8, 1, 5, 'a');
    g.poly([[1, 15], [13, 13], [13, 25], [1, 26]], 'w'); g.poly([[15, 13], [27, 15], [27, 26], [15, 25]], 'w');
    g.rect(13, 13, 2, 13, 'g');
    for (let r = 0; r < 3; r++) { g.line(3, 18 + r * 2.5, 11, 16 + r * 2.5, 'g'); g.line(17, 16 + r * 2.5, 25, 18 + r * 2.5, 'g'); }
    g.rect(0, 26, 28, 1, 'C');
  },
};

// Keep the complete illustration, without a decorative circle or circular crop.
export function scene(id) {
  const g = new Grid(100, 100);
  SCENES[id](g);
  return `<svg class="px scene s-${id}" viewBox="0 0 100 100" shape-rendering="crispEdges" aria-hidden="true" focusable="false">${g.svg()}</svg>`;
}
// Static Earth for the role-navigation overview, drawn on the same pixel lattice.
export function earth() {
  const g = new Grid(64, 64, [32, 32, 28]);
  g.ell(32, 32, 28, 28, (x, y) => (x + y) % 11 === 0 ? 'S' : 's');
  const land = (x, y) => vnoise(x / 4, y / 4, 21) > .55 ? 'L' : 'l';
  for (const points of [
    [[8, 18], [18, 10], [29, 12], [29, 19], [23, 26], [16, 24], [13, 20]],
    [[23, 27], [31, 31], [32, 36], [26, 49], [22, 43], [20, 33]],
    [[36, 17], [43, 13], [49, 17], [44, 24], [37, 23]],
    [[37, 25], [44, 23], [49, 29], [44, 41], [39, 38], [35, 30]],
    [[44, 13], [55, 16], [59, 25], [54, 31], [48, 27], [44, 22]],
    [[49, 43], [56, 42], [59, 47], [52, 50]],
  ]) g.poly(points, land);
  g.ell(31, 7, 12, 4, 'i');
  g.ell(31, 59, 13, 3, 'I');
  // A restrained night-side edge gives the globe depth without a framing ring.
  for (let y = 0; y < 64; y++) for (let x = 48; x < 64; x++) {
    if (g.m.has(y * 64 + x) && (x > 55 || (x + y) % 2 === 0)) g.set(x, y, 'n');
  }
  return `<svg class="px earth-art" viewBox="0 0 64 64" shape-rendering="crispEdges" aria-hidden="true" focusable="false">${g.svg()}</svg>`;
}

// Small, locally drawn contact symbols in the same pixel palette as the role objects.
export function contactIcon(kind) {
  const g = new Grid(20, 20);
  if (kind === 'email') {
    g.box(2, 4, 16, 12, 'a');
    g.line(2, 4, 10, 10, 'a'); g.line(10, 10, 17, 4, 'a');
  } else if (kind === 'blog') {
    g.box(4, 2, 11, 16, 'a');
    g.rect(7, 5, 5, 1, 'a'); g.rect(7, 8, 5, 1, 'a'); g.rect(7, 11, 3, 1, 'a');
    g.line(11, 15, 18, 8, 'a'); g.line(12, 15, 18, 9, 'a');
  } else if (kind === 'linkedin') {
    g.box(2, 2, 16, 16, 'a');
    g.rect(5, 5, 2, 2, 'a'); g.rect(5, 9, 2, 6, 'a');
    g.rect(9, 9, 2, 6, 'a'); g.rect(11, 8, 3, 2, 'a'); g.rect(14, 10, 2, 5, 'a');
  } else if (kind === 'github') {
    g.ell(10, 9, 6, 5, 'a');
    g.poly([[4, 8], [4, 2], [9, 5]], 'a'); g.poly([[11, 5], [16, 2], [16, 8]], 'a');
    g.rect(7, 13, 6, 5, 'a');
    g.line(7, 15, 4, 15, 'a'); g.line(4, 15, 2, 12, 'a');
    g.rect(7, 8, 1, 2, 'n'); g.rect(12, 8, 1, 2, 'n');
  } else {
    throw new Error('Unknown contact icon: ' + kind);
  }
  return `<svg class="px contact-icon" viewBox="0 0 20 20" shape-rendering="crispEdges" aria-hidden="true" focusable="false">${g.svg()}</svg>`;
}

export function icon(id) {
  const g = new Grid(28, 28);
  ICONS[id](g);
  return `<svg class="px icon i-${id}" viewBox="0 0 28 28" shape-rendering="crispEdges" aria-hidden="true" focusable="false">${g.svg()}</svg>`;
}

// Extra colours used only by the objects: a thermal ramp (1-6) and a status green (e).
export const OBJ_CSS = `.px .p1{fill:#2c3a86}.px .p2{fill:#6a3f9e}.px .p3{fill:#b34a86}.px .p4{fill:#e06f4c}.px .p5{fill:#f3ab3c}.px .p6{fill:#fbe59a}.px .pe{fill:#7cc492}`;
