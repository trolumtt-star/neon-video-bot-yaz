// SİNEMA 3D MOTORU
// Canvas 2D üzerinde küçük bir 3D motor: perspektif kamera, derinlik sıralaması, kapsül/küre/kutu
// primitifleri ile eli kolu ayağı ayrı hareket eden insanlar, dalgalanan Türk bayrağı ve mekanlar.
// planla() ile hazırlanan sahne planını kare kare çizer: cizici(plan).kare(t) -> canvas

export const OW = 1080, OH = 1920, FPS = 30;
const W = OW, H = OH;
const cl = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v)), lerp = (a, b, t) => a + (b - a) * t;
const ease = t => { t = cl(t); return t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; };
const smooth = t => { t = cl(t); return t * t * (3 - 2 * t); };
const seg = (t, a, b) => cl((t - a) / (b - a));
export function rnd(s) { s = (Math.abs(s | 0) % 2147483646) + 1; return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; }
const pick = (r, a) => a[Math.floor(r() * a.length) % a.length];

let X = null; // aktif çizim bağlamı
// ------------------------------------------------------------ renk + sis + ışık
let FOG = [200, 205, 215], FOGK = .01, ISIK = 1, TINT = null;
const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
function rgb(c, k = 1, z = 0, al = 1) {
  const f = 1 - Math.exp(-Math.max(0, z) * FOGK); let b = [c[0] * k * ISIK, c[1] * k * ISIK, c[2] * k * ISIK];
  if (TINT) b = mix(b, TINT, .18);
  const r = mix(b, FOG, f); return `rgba(${cl(r[0], 0, 255) | 0},${cl(r[1], 0, 255) | 0},${cl(r[2], 0, 255) | 0},${al})`;
}
// ------------------------------------------------------------ kamera
let cam = { x: 0, y: 1.6, z: -8, f: 1300, yaw: 0, pitch: 0, hy: .5 };
function C(x, y, z) {
  const dx = x - cam.x, dy = y - cam.y, dz = z - cam.z, c = Math.cos(cam.yaw), s = Math.sin(cam.yaw);
  const rx = dx * c - dz * s; let rz = dx * s + dz * c; const cp = Math.cos(cam.pitch), sp = Math.sin(cam.pitch);
  const ry = dy * cp - rz * sp; rz = dy * sp + rz * cp; return [rx, ry, rz];
}
const PC = v => { const k = cam.f / v[2]; return { x: W / 2 + v[0] * k, y: H * cam.hy - v[1] * k, s: k, z: v[2] }; };
function P(x, y, z) { const v = C(x, y, z); return v[2] < .15 ? null : PC(v); }
let Q = [];
const add = (z, fn) => Q.push({ z, fn });
function flush() { Q.sort((a, b) => b.z - a.z); for (const q of Q) q.fn(); Q = []; }
// ------------------------------------------------------------ primitifler
function quad(pts, c, k = 1, al = 1, bias = 0) {
  const N = .2, cs = pts.map(v => C(...v)), o = [];
  for (let i = 0; i < cs.length; i++) {
    const a = cs[i], b = cs[(i + 1) % cs.length];
    if (a[2] >= N) o.push(a);
    if ((a[2] >= N) !== (b[2] >= N)) { const u = (N - a[2]) / (b[2] - a[2]); o.push([a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, N]); }
  }
  if (o.length < 3) return;
  const p = o.map(PC), z = cs.reduce((a, v) => a + Math.max(v[2], N), 0) / cs.length;
  add(z + bias, () => { X.fillStyle = rgb(c, k, z, al); X.beginPath(); X.moveTo(p[0].x, p[0].y); for (let i = 1; i < p.length; i++) X.lineTo(p[i].x, p[i].y); X.closePath(); X.fill(); });
}
const zemin = (x0, x1, z0, z1, c, k = 1, y = 0, bias = 600) => quad([[x0, y, z0], [x1, y, z0], [x1, y, z1], [x0, y, z1]], c, k, 1, bias);
function box(x0, x1, y0, y1, z0, z1, c, o = {}) {
  const kf = o.kf ?? 1, ks = o.ks ?? .78, kt = o.kt ?? 1.12;
  if (cam.z < z0) quad([[x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0]], c, kf);
  if (cam.z > z1) quad([[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]], c, kf * .9);
  if (cam.x < x0) quad([[x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0]], c, ks);
  if (cam.x > x1) quad([[x1, y0, z0], [x1, y0, z1], [x1, y1, z1], [x1, y1, z0]], c, ks * .95);
  if (cam.y > y1) quad([[x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]], c, kt);
}
function cap(a, b, r, c, bias = 0) {
  const p = P(...a), q = P(...b); if (!p || !q) return;
  const z = (p.z + q.z) / 2 + bias, w = r * (p.s + q.s);
  if (w < .6) return;
  add(z, () => {
    X.lineCap = 'round'; X.lineWidth = w; X.strokeStyle = rgb(c, .55, z); X.beginPath(); X.moveTo(p.x, p.y); X.lineTo(q.x, q.y); X.stroke();
    if (w < 3) return;
    const o = w * .07; X.lineWidth = w * .8; X.strokeStyle = rgb(c, 1, z); X.beginPath(); X.moveTo(p.x - o, p.y - o); X.lineTo(q.x - o, q.y - o); X.stroke();
    const o2 = w * .2; X.lineWidth = w * .28; X.strokeStyle = rgb(c, 1.32, z, .5); X.beginPath(); X.moveTo(p.x - o2, p.y - o2); X.lineTo(q.x - o2, q.y - o2); X.stroke();
  });
}
function ball(a, r, c, bias = 0, al = 1) {
  const p = P(...a); if (!p) return; const z = p.z + bias, R = r * p.s; if (R < .4) return;
  add(z, () => {
    if (R < 3) { X.fillStyle = rgb(c, 1, z, al); X.beginPath(); X.arc(p.x, p.y, R, 0, 7); X.fill(); return; }
    const g = X.createRadialGradient(p.x - R * .35, p.y - R * .4, R * .1, p.x, p.y, R);
    g.addColorStop(0, rgb(c, 1.3, z, al)); g.addColorStop(.6, rgb(c, 1, z, al)); g.addColorStop(1, rgb(c, .55, z, al));
    X.fillStyle = g; X.beginPath(); X.arc(p.x, p.y, R, 0, 7); X.fill();
  });
}
function puff(a, r, c, al) { // yumuşak duman/bulut
  const p = P(...a); if (!p) return; const R = r * p.s; if (R < 1) return;
  add(p.z, () => { const g = X.createRadialGradient(p.x, p.y, 0, p.x, p.y, R); g.addColorStop(0, rgb(c, 1, p.z, al)); g.addColorStop(1, rgb(c, 1, p.z, 0)); X.fillStyle = g; X.beginPath(); X.arc(p.x, p.y, R, 0, 7); X.fill(); });
}
function golge(x, z, r, al = .28) {
  const p = P(x, .01, z), q = P(x + r, .01, z), u = P(x, .01, z + r); if (!p || !q || !u) return;
  const rx = Math.hypot(q.x - p.x, q.y - p.y), ry = Math.max(1, Math.abs(u.y - p.y));
  add(p.z + 50, () => { X.fillStyle = `rgba(0,0,0,${al})`; X.beginPath(); X.ellipse(p.x, p.y, rx, ry, 0, 0, 7); X.fill(); });
}
function koni(top, bot, rt, rb, c, bias = 0) {
  const a = P(...top), b = P(...bot); if (!a || !b) return; const z = (a.z + b.z) / 2 + bias;
  add(z, () => {
    const wt = rt * a.s, wb = rb * b.s, g = X.createLinearGradient(b.x - wb, 0, b.x + wb, 0);
    g.addColorStop(0, rgb(c, 1.15, z)); g.addColorStop(.55, rgb(c, .95, z)); g.addColorStop(1, rgb(c, .55, z)); X.fillStyle = g;
    X.beginPath(); X.moveTo(a.x - wt, a.y); X.lineTo(a.x + wt, a.y); X.lineTo(b.x + wb, b.y); X.quadraticCurveTo(b.x, b.y + wb * .18, b.x - wb, b.y); X.closePath(); X.fill();
  });
}
// ------------------------------------------------------------ Türk bayrağı
let FL = null;
function bayrakDoku() {
  if (FL) return FL;
  FL = document.createElement('canvas'); FL.width = 900; FL.height = 600;
  const g = FL.getContext('2d'), G = 600;
  g.fillStyle = '#E30A17'; g.fillRect(0, 0, 900, 600);
  g.fillStyle = '#fff'; g.beginPath(); g.arc(425 / 800 * G, .5 * G, .25 * G, 0, 7); g.fill();
  g.fillStyle = '#E30A17'; g.beginPath(); g.arc(475 / 800 * G, .5 * G, .2 * G, 0, 7); g.fill();
  g.fillStyle = '#fff'; g.beginPath(); const cx = 683.333 / 800 * G, cy = .5 * G, R = .125 * G, r = R * .382;
  for (let i = 0; i < 10; i++) { const a = Math.PI + i * Math.PI / 5, rr = i % 2 ? r : R; g.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); }
  g.closePath(); g.fill(); return FL;
}
// direk noktasından +x yönüne uzanan dalgalı 3D bayrak
function bayrak3(px, py, pz, L, h, t, amp = .1, dir = 1) {
  const fl = bayrakDoku(), N = 16, ws = [];
  for (let i = 0; i <= N; i++) {
    const u = i / N, ph = t * 5.2 - u * 7, d = Math.sin(ph) * amp * L * u, sag = -u * u * .06 * h;
    ws.push({ top: [px + dir * u * L, py + sag, pz + d], bot: [px + dir * u * L, py - h + sag * 1.2, pz + d], sh: .82 + .28 * Math.cos(ph) });
  }
  for (let i = 0; i < N; i++) {
    const A = ws[i], B = ws[i + 1], a = P(...A.top), b = P(...B.top), c = P(...A.bot), d = P(...B.bot);
    if (!a || !b || !c || !d) continue; const z = (a.z + d.z) / 2, sh = (A.sh + B.sh) / 2, sw = fl.width / N;
    add(z, () => {
      X.save(); X.beginPath(); X.moveTo(a.x, a.y); X.lineTo(b.x, b.y); X.lineTo(d.x, d.y); X.lineTo(c.x, c.y); X.closePath(); X.clip();
      X.setTransform((b.x - a.x) / sw, (b.y - a.y) / sw, (c.x - a.x) / 600, (c.y - a.y) / 600, a.x, a.y);
      const si = dir > 0 ? i : N - 1 - i;
      X.drawImage(fl, si * sw, 0, sw + 1, 600, -.5, 0, sw + 1.5, 600); X.setTransform(1, 0, 0, 1, 0, 0);
      X.fillStyle = sh < 1 ? `rgba(0,0,0,${(1 - sh) * .9})` : `rgba(255,255,255,${(sh - 1) * .45})`; X.fill();
      const f = 1 - Math.exp(-z * FOGK); if (f > .02) { X.fillStyle = `rgba(${FOG[0] | 0},${FOG[1] | 0},${FOG[2] | 0},${f})`; X.fill(); }
      if (ISIK < .95) { X.fillStyle = `rgba(0,0,10,${(1 - ISIK) * .8})`; X.fill(); }
      X.restore();
    });
  }
}
function direkBayrak(x, z, boy, t, yari = false, L = null) {
  cap([x, 0, z], [x, boy, z], .06 + boy * .004, [205, 205, 210]); ball([x, boy + .1, z], .1 + boy * .006, [220, 190, 90]);
  const l = L || Math.max(1.5, boy * .32), h = l / 1.5, top = yari ? boy * .55 : boy - .05;
  bayrak3(x, top, z, l, h, t, .09);
}
function bayrak2(x0, y0, L, h, t, amp = 22) {
  const fl = bayrakDoku(), N = 40, sw = fl.width / N;
  for (let i = 0; i < N; i++) {
    const u = i / N, u2 = (i + 1) / N, f = v => Math.sin(t * 4 - v * 8) * amp * v, ax = x0 + u * L, bx = x0 + u2 * L, ay = y0 + f(u), by = y0 + f(u2);
    X.save(); X.setTransform((bx - ax) / sw, (by - ay) / sw, 0, h / 600, ax, ay); X.drawImage(fl, i * sw, 0, sw + 1, 600, 0, 0, sw + 1, 600); X.restore();
    const sh = Math.cos(t * 4 - u * 8); X.fillStyle = sh < 0 ? `rgba(0,0,0,${-sh * .28})` : `rgba(255,255,255,${sh * .12})`;
    X.beginPath(); X.moveTo(ax, ay); X.lineTo(bx + .5, by); X.lineTo(bx + .5, by + h); X.lineTo(ax, ay + h); X.fill();
  }
}
// ------------------------------------------------------------ insanlar
const TEN = [[224, 178, 140], [198, 150, 112], [236, 196, 160], [176, 128, 92]];
const SAC = [[30, 24, 20], [70, 48, 30], [20, 18, 16], [110, 74, 42], [150, 110, 70]];
const KOYU = [[40, 40, 48], [70, 60, 52], [30, 40, 60], [90, 30, 34], [60, 64, 70], [24, 24, 28], [52, 64, 92], [88, 70, 50]];
const ACIK = [[240, 236, 228], [168, 52, 60], [60, 120, 110], [200, 120, 40], [120, 40, 40], [210, 190, 150], [70, 110, 170]];
export const TIPLER = ['asker', 'sivil', 'kadin', 'cocuk', 'yasli', 'ogrenci', 'garson', 'isadami', 'sporcu'];
function gorunum(tip, r) {
  const o = { skin: pick(r, TEN), hair: pick(r, SAC), shoe: [24, 22, 20], hs: .94 + r() * .12 };
  switch (tip) {
    case 'asker': Object.assign(o, { shirt: [112, 104, 66], pants: [104, 96, 62], shoe: [70, 56, 40], kask: [118, 108, 70], tufek: 1, hair: [30, 24, 20] }); break;
    case 'kadin': Object.assign(o, { shirt: pick(r, ACIK), pants: [50, 50, 60], skirt: pick(r, KOYU), longHair: r() < .8, hs: .9 + r() * .08 }); break;
    case 'cocuk': Object.assign(o, { shirt: pick(r, ACIK), pants: pick(r, KOYU), hs: .6 + r() * .1, longHair: r() < .5 }); break;
    case 'yasli': Object.assign(o, { shirt: [40, 40, 44], coat: pick(r, [[86, 74, 62], [42, 46, 58], [60, 56, 50]]), pants: [60, 58, 56], hair: [180, 180, 184], hs: .9 + r() * .05 }); break;
    case 'ogrenci': Object.assign(o, { shirt: [245, 245, 245], pants: [40, 52, 90], skirt: r() < .5 ? [40, 52, 90] : null, hs: .66 + r() * .1, longHair: r() < .5, kravat: 1 }); break;
    case 'garson': Object.assign(o, { shirt: [245, 245, 240], pants: [30, 30, 34] }); break;
    case 'isadami': Object.assign(o, { shirt: [40, 46, 64], coat: null, pants: [40, 46, 64] }); break;
    case 'sporcu': Object.assign(o, { shirt: [230, 30, 50], pants: [245, 245, 245], shoe: [240, 240, 240] }); break;
    default: Object.assign(o, { shirt: pick(r, r() < .5 ? KOYU : ACIK), pants: pick(r, KOYU), coat: r() < .3 ? pick(r, KOYU) : null, longHair: r() < .3 });
  }
  return o;
}
function kol(m, s, sh, head, chest, legA, w, t) {
  const a3 = (p, v) => [p[0] + v[0], p[1] + v[1], p[2] + v[2]];
  switch (m) {
    case 'swing': { const u = -legA * .85, e = a3(sh, [s * .03, -.29 * Math.cos(u), .29 * Math.sin(u)]), u2 = u + .25 * w + .08; return [e, a3(e, [s * .01, -.27 * Math.cos(u2), .27 * Math.sin(u2)])]; }
    case 'heart': { const e = a3(sh, [s * .03, -.24, .12]); return [e, [-s * .06, chest[1] - .04, chest[2] + .17]]; }
    case 'salute': { const e = a3(sh, [s * .24, -.02, .1]); return [e, a3(head, [s * .08, .04, .1])]; }
    case 'reach': { const e = a3(sh, [s * .02, -.17, .2]); return [e, a3(sh, [0, -.33, .42])]; }
    case 'hold': { const e = a3(sh, [s * .07, -.28, .04]); return [e, a3(sh, [s * .13, -.55, .08])]; }
    case 'tray': { const e = a3(sh, [s * .02, -.27, .05]); return [e, a3(e, [-s * .04, .03, .27])]; }
    case 'phone': { const e = a3(sh, [s * .14, -.2, .12]); return [e, a3(head, [s * .1, -.01, .03])]; }
    case 'flower': { const e = a3(sh, [s * .04, -.26, .1]); return [e, a3(e, [-s * .03, .06, .22])]; }
    case 'aim': { const e = a3(sh, [s * .05, -.2, .22]); return [e, s > 0 ? a3(sh, [-.02, -.12, .45]) : a3(sh, [.12, -.1, .62])]; }
    case 'rifle': { const e = a3(sh, [s * .06, -.26, .06]); return [e, a3(sh, [s * .02, -.36, .2])]; }
    case 'up': { const e = a3(sh, [s * .06, .24, .06]); return [e, a3(sh, [s * .04, .5, .08])]; }
    case 'wave': { const e = a3(sh, [s * .2, .12, .05]), k = Math.sin(t * 9) * .1; return [e, a3(e, [s * (.05 + k), .26, .02])]; }
    case 'clap': { const k = (Math.sin(t * 16) + 1) * .04; const e = a3(sh, [s * .07, -.2, .12]); return [e, [s * (.02 + k), chest[1] - .02, chest[2] + .3]]; }
    case 'side': default: { const e = a3(sh, [s * .035, -.29, 0]); return [e, a3(e, [0, -.27, .02])]; }
  }
}
function insan(o, t) {
  const hs = o.hs || 1, w = o.walk || 0, ph = o.ph || 0, lean = o.lean || 0, cr = o.crouch || 0, c = Math.cos(o.th), s = Math.sin(o.th);
  const Wd = v => [o.x + (v[0] * c + v[2] * s) * hs, v[1] * hs + (o.y || 0), o.z + (-v[0] * s + v[2] * c) * hs];
  const bob = Math.abs(Math.sin(ph)) * .025 * w, py = .95 - cr * .28 + bob;
  const pel = [0, py, 0], chest = [0, py + .42 - lean * .05, lean * .22], neck = [0, chest[1] + .13, chest[2] + lean * .04], head = [0, neck[1] + .13, neck[2] + lean * .05];
  const legs = {}, LA = {};
  for (const sd of [-1, 1]) {
    const pp = ph + (sd > 0 ? 0 : Math.PI), a = Math.sin(pp) * .42 * w + cr; LA[sd] = Math.sin(pp) * .42 * w;
    const bend = Math.max(0, Math.sin(pp + 1.7)) * .55 * w + cr * 1.9;
    const hip = [sd * .1, py, 0], kn = [hip[0], hip[1] - .45 * Math.cos(a), .45 * Math.sin(a)], a2 = a - bend;
    const an = [kn[0], kn[1] - .45 * Math.cos(a2), kn[2] + .45 * Math.sin(a2)], ft = [an[0], Math.max(.03, an[1] - .03), an[2] + .12];
    legs[sd] = { hip, kn, an, ft };
  }
  const shL = [-.19, chest[1] + .06, chest[2]], shR = [.19, chest[1] + .06, chest[2]];
  const am = (m, m2, k, sd, sh) => {
    const A = kol(m, sd, sh, head, chest, LA[-sd], w, t); if (!m2 || !k) return A;
    const B = kol(m2, sd, sh, head, chest, LA[-sd], w, t); return A.map((p, i) => p.map((v, j) => lerp(v, B[i][j], ease(k))));
  };
  const AL = am(o.armL || 'swing', o.armL2, o.mixL, -1, shL), AR = am(o.armR || 'swing', o.armR2, o.mixR, 1, shR);
  if (!o.y) golge(o.x, o.z, .32 * hs);
  for (const sd of [-1, 1]) { const L = legs[sd]; cap(Wd(L.hip), Wd(L.kn), .075, o.pants); cap(Wd(L.kn), Wd(L.an), .06, o.pants); cap(Wd(L.an), Wd(L.ft), .05, o.shoe); }
  if (o.skirt) koni(Wd([0, py + .05, 0]), Wd([0, py - .42, 0]), .15 * hs, .24 * hs, o.skirt, -.01);
  if (o.coat) koni(Wd([0, py + .35, chest[2] * .5]), Wd([0, py - .5, 0]), .17 * hs, .27 * hs, o.coat, -.02);
  const gov = o.coat || o.shirt;
  cap(Wd(pel), Wd(chest), .165, gov); cap(Wd(shL), Wd(shR), .09, gov, .01); cap(Wd([-.1, py, 0]), Wd([.1, py, 0]), .1, o.skirt || o.pants);
  if (o.kravat) cap(Wd([0, chest[1] + .02, chest[2] + .15]), Wd([0, chest[1] - .2, chest[2] + .16]), .025, [200, 20, 30], .03);
  for (const [A, sh] of [[AL, shL], [AR, shR]]) { cap(Wd(sh), Wd(A[0]), .058, gov); cap(Wd(A[0]), Wd(A[1]), .05, gov); ball(Wd(A[1]), .045, o.skin, -.01); }
  cap(Wd(chest), Wd(neck), .05, o.skin, .02); ball(Wd(head), .11, o.skin);
  if (o.kask) { ball(Wd([0, head[1] + .045, head[2] - .01]), .125, o.kask, -.005); cap(Wd([-.12, head[1] + .0, head[2]]), Wd([.12, head[1] + .0, head[2]]), .03, o.kask, -.003); }
  else ball(Wd([0, head[1] + .03, head[2] - .03]), .105, o.hair, 0);
  if (o.longHair && !o.kask) cap(Wd([0, head[1], head[2] - .07]), Wd([0, head[1] - .24, head[2] - .09]), .1, o.hair, 0);
  return { handR: Wd(AR[1]), handL: Wd(AL[1]), head: Wd(head), sh: Wd(shR) };
}
// eylem -> poz
export const EYLEMLER = ['yuru', 'kos', 'dur', 'selam', 'kalp', 'nisan', 'bayrak', 'el_salla', 'alkis', 'cicek'];
function aktorCiz(a, t, u, sh) {
  const o = Object.assign({}, a.look, { x: a.x, z: a.z, th: a.th });
  const durT = sh.durAni; // siren gibi "dur" olayı
  let hareket = a.eylem === 'yuru' || a.eylem === 'kos' || a.eylem === 'bayrak' && a.v > 0;
  let k = 1; if (durT != null && hareket) k = 1 - smooth(seg(t, durT, durT + 1.1));
  const v = a.v * (a.eylem === 'kos' ? 2.3 : 1);
  const lt = t - sh.bas, d = durT != null && hareket ? Math.min(lt, durT - sh.bas) * v + Math.max(0, Math.min(1.1, t - durT)) * v * .5 : (hareket ? lt * v : 0);
  o.x += Math.sin(a.th) * d; o.z += Math.cos(a.th) * d;
  o.walk = hareket ? k * (a.eylem === 'kos' ? 1.3 : 1) : 0; o.ph = d * 5.6 / (o.hs || 1);
  if (a.eylem === 'kos') o.lean = .3 * k;
  const giris = seg(lt, .4 + a.gec, 1.4 + a.gec);
  switch (a.eylem) {
    case 'selam': o.armR = 'side'; o.armR2 = 'salute'; o.mixR = giris; o.armL = 'side'; break;
    case 'kalp': o.armR = 'side'; o.armR2 = 'heart'; o.mixR = giris; o.armL = 'side'; break;
    case 'nisan': o.armR = 'aim'; o.armL = 'aim'; o.crouch = .25; break;
    case 'bayrak': o.armR = 'up'; o.armL = hareket ? 'swing' : 'side'; break;
    case 'el_salla': o.armR = 'side'; o.armR2 = 'wave'; o.mixR = giris; o.armL = 'side'; break;
    case 'alkis': o.armR = 'side'; o.armR2 = 'clap'; o.mixR = giris; o.armL = 'side'; o.armL2 = 'clap'; o.mixL = giris; break;
    case 'cicek': o.armL = 'flower'; o.armR = 'side'; break;
    case 'dur': o.armR = 'side'; o.armL = 'side'; break;
    default:
      if (o.tufek && hareket) { o.armR = 'rifle'; o.armL = 'swing'; }
      else { o.armR = 'swing'; o.armL = 'swing'; if (!hareket || k < 1) { o.armR2 = 'side'; o.armL2 = 'side'; o.mixR = o.mixL = 1 - k; } }
  }
  if (o.tufek && a.eylem === 'selam') o.armL = 'rifle';
  const r = insan(o, t);
  if (o.tufek) { // tüfek: sağ elden ileri
    const h = a.eylem === 'nisan' ? r.handR : (o.armR === 'rifle' || o.armL === 'rifle' ? r.handR : null);
    if (h) { const f = Math.sin(o.th), g = Math.cos(o.th), up = a.eylem === 'nisan' ? .02 : .5;
      const A = [h[0] - f * .35, h[1] - .1 + (a.eylem === 'nisan' ? .05 : -.2), h[2] - g * .35], B = [h[0] + f * .7, h[1] + up * .6, h[2] + g * .7];
      cap(A, B, .022, [70, 46, 26], .02); cap(B, [B[0] + f * .25, B[1] + up * .2, B[2] + g * .25], .01, [190, 190, 196], .02); }
  }
  if (a.eylem === 'bayrak') { const h = r.handR, k = o.hs || 1; cap([h[0], h[1] - .5 * k, h[2]], [h[0], h[1] + 1.1 * k, h[2]], .018, [200, 190, 160]); bayrak3(h[0], h[1] + 1.08 * k, h[2], .84 * k, .56 * k, t + a.x, .12, 1); }
  if (a.eylem === 'cicek') { const h = r.handL; cap(h, [h[0], h[1] - .2, h[2]], .012, [50, 120, 50], .03); ball(h, .05, [220, 16, 34], .04); }
}
// ------------------------------------------------------------ gökyüzü, ışık, efektler
const ZAMAN = {
  safak: { g: ['#2c3a5e', '#9c7e8f', '#f0a36e'], fog: [190, 160, 160], isik: .82, tint: [255, 170, 120] },
  sabah: { g: ['#8fb0d2', '#d9d6c8', '#f3dcb4'], fog: [222, 214, 200], isik: 1, tint: null },
  gun: { g: ['#4f8fd6', '#9cc4ea', '#dcebf6'], fog: [205, 222, 238], isik: 1.06, tint: null },
  aksam: { g: ['#262c50', '#a0506a', '#f59048'], fog: [200, 140, 110], isik: .8, tint: [255, 140, 70] },
  gece: { g: ['#04060f', '#0c1430', '#1d2b52'], fog: [24, 32, 58], isik: .45, tint: [60, 80, 160] },
  bulutlu: { g: ['#6f86a3', '#b9c3cf', '#ead9c2'], fog: [196, 200, 208], isik: .92, tint: null },
};
function gok(zm, t, ef) {
  const Z = ZAMAN[zm] || ZAMAN.sabah, g = X.createLinearGradient(0, 0, 0, H * .7);
  g.addColorStop(0, Z.g[0]); g.addColorStop(.55, Z.g[1]); g.addColorStop(1, Z.g[2]); X.fillStyle = g; X.fillRect(0, 0, W, H);
  FOG = Z.fog.slice(); ISIK = Z.isik; TINT = Z.tint;
  if (zm === 'gece') { const r = rnd(77); X.fillStyle = '#fff'; for (let i = 0; i < 160; i++) { X.globalAlpha = .3 + .7 * Math.abs(Math.sin(t * 2 + i)); X.fillRect(r() * W, r() * H * .55, 2, 2); } X.globalAlpha = 1; }
  if (zm === 'aksam' || zm === 'safak') { const sx = W * .7, sy = H * .44, gr = X.createRadialGradient(sx, sy, 10, sx, sy, 520); gr.addColorStop(0, 'rgba(255,230,170,.95)'); gr.addColorStop(.12, 'rgba(255,190,110,.6)'); gr.addColorStop(1, 'rgba(255,150,80,0)'); X.fillStyle = gr; X.fillRect(0, 0, W, H); }
  if (zm !== 'gece' || ef.includes('bulut')) { X.save(); X.globalAlpha = zm === 'gece' ? .08 : .22; for (let i = 0; i < 7; i++) { const x = ((i * 311 + t * 14) % 1500) - 200, y = 150 + i * 95; X.fillStyle = '#fff'; X.beginPath(); X.ellipse(x, y, 260, 38, 0, 0, 7); X.fill(); } X.restore(); }
}
function patlama(x, z, t0, t, buyuk = 1) {
  const dt = t - t0; if (dt < 0 || dt > 4) return 0;
  const r = rnd(Math.floor(x * 100 + z * 7 + t0 * 13));
  for (let i = 0; i < 26; i++) { const vx = (r() - .5) * 7 * buyuk, vy = 5 + r() * 9 * buyuk, vz = (r() - .5) * 7 * buyuk; const tt = Math.min(dt, 2.2), y = vy * tt - 4.9 * tt * tt; if (y < 0 && tt > .3) continue; ball([x + vx * tt, Math.max(.1, y), z + vz * tt], .14 * buyuk, [90, 70, 50]); }
  for (let i = 0; i < 7; i++) { const rr = (1.2 + dt * 2.2 + r() * 1.5) * buyuk; puff([x + (r() - .5) * 3, rr * .8 + dt * 1.2, z + (r() - .5) * 2], rr, [110, 104, 100], .55 * (1 - dt / 4)); }
  if (dt < .35) puff([x, 1.5, z], 6 * buyuk, [255, 210, 140], (1 - dt / .35) * .9);
  return dt < .18 ? (1 - dt / .18) : 0; // ekran parlaması
}
function dumanSutunu(x, z, t, k = 1) { for (let i = 0; i < 9; i++) { const p = ((t * .25 + i / 9) % 1); puff([x + Math.sin(p * 6 + i) * 1.5, p * 22 * k, z], (1.5 + p * 6) * k, [90, 88, 86], .35 * (1 - p)); } }
function havaiFisek(t, sahneT) {
  for (let n = 0; n < 4; n++) {
    const per = 2.3, t0 = Math.floor((sahneT + n * .6) / per) * per - n * .6, dt = sahneT - t0; if (dt < 0 || dt > 1.8) continue;
    const r = rnd(Math.floor(t0 * 10) + n * 31), cx = W * (.18 + r() * .64), cy = H * (.12 + r() * .25), col = pick(r, ['#ff2a3d', '#ffffff', '#ffd25a', '#ff6a7d']);
    X.save(); X.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 46; i++) { const a = i / 46 * Math.PI * 2, sp = 260 + r() * 120, rr = sp * (1 - Math.exp(-dt * 3)), px = cx + Math.cos(a) * rr, py = cy + Math.sin(a) * rr + dt * dt * 60;
      X.globalAlpha = cl(1 - dt / 1.8); X.fillStyle = col; X.beginPath(); X.arc(px, py, 4, 0, 7); X.fill(); }
    X.restore();
  }
}
function yagmur(t) { X.save(); X.strokeStyle = 'rgba(200,210,230,.35)'; X.lineWidth = 2; const r = rnd(5); for (let i = 0; i < 220; i++) { const x = r() * W, y = (r() * H + t * 2400) % H; X.beginPath(); X.moveTo(x, y); X.lineTo(x - 10, y + 46); X.stroke(); } X.restore(); }
function kar(t) { X.save(); X.fillStyle = 'rgba(255,255,255,.85)'; const r = rnd(9); for (let i = 0; i < 180; i++) { const s = 2 + r() * 5, x = (r() * W + Math.sin(t + i) * 30) % W, y = (r() * H + t * (60 + s * 25)) % H; X.beginPath(); X.arc(x, y, s, 0, 7); X.fill(); } X.restore(); }
function vinyet(a = .55) { const g = X.createRadialGradient(W / 2, H / 2, H * .25, W / 2, H / 2, H * .75); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(0,0,0,${a})`); X.fillStyle = g; X.fillRect(0, 0, W, H); }
function huzme(ust = 'rgba(255,224,170,.3)') { const g = X.createLinearGradient(W, 0, 0, H * .7); g.addColorStop(0, ust); g.addColorStop(1, 'rgba(255,224,170,0)'); X.fillStyle = g; X.fillRect(0, 0, W, H); }
// ------------------------------------------------------------ MEKANLAR
// her mekan: kamera(u, sh) temel kamera, ciz(t, sh) çevre, yer(sayi, i, r, featured) aktör konumu
const MEKAN = {};
MEKAN.sokak = {
  kam: { x: .9, y: 1.5, z: -3.2, f: 1150, yaw: -.05, pitch: .02, hy: .55 },
  ciz(t, sh) {
    const gece = sh.zaman === 'gece';
    zemin(-4, 4, -10, 90, [88, 88, 92], 1, 0, 500); zemin(-8, -4, -10, 90, [170, 160, 146]); zemin(4, 8, -10, 90, [170, 160, 146]);
    for (let z = -6; z < 80; z += 6) quad([[-.12, .005, z], [.12, .005, z], [.12, .005, z + 3], [-.12, .005, z + 3]], [235, 235, 225], 1, 1, 400);
    const RB = rnd(5); let zz = -8; const cols = [[214, 190, 160], [196, 170, 150], [226, 214, 190], [180, 150, 130], [205, 196, 178], [190, 176, 160]];
    for (let i = 0; i < 9; i++) {
      const len = 6 + RB() * 4, h = 9 + RB() * 9;
      for (const sd of [-1, 1]) {
        const x0 = sd * 8, c = cols[(i + (sd > 0 ? 3 : 0)) % 6];
        quad([[x0, 0, zz], [x0, 0, zz + len], [x0, h, zz + len], [x0, h, zz]], c, sd < 0 ? .95 : .78);
        for (let fl = 1; fl * 3 < h - 1; fl++) for (let k = 0; k < 3; k++) {
          const wz = zz + .9 + k * (len - 1.8) / 2.5, wy = fl * 3; if (wz + 1.1 > zz + len) continue;
          const yan = gece && RB() < .6; quad([[x0 - sd * .02, wy, wz], [x0 - sd * .02, wy, wz + 1.1], [x0 - sd * .02, wy + 1.6, wz + 1.1], [x0 - sd * .02, wy + 1.6, wz]], yan ? [255, 210, 120] : [60, 70, 84], yan ? 2 : (sd < 0 ? 1 : .8));
        }
        quad([[x0 - sd * .05, 0, zz + .6], [x0 - sd * .05, 0, zz + len - .6], [x0 - sd * .05, 2.4, zz + len - .6], [x0 - sd * .05, 2.4, zz + .6]], gece ? [120, 96, 60] : [44, 40, 38], sd < 0 ? 1 : .8);
        box(sd < 0 ? x0 : x0 - .2, sd < 0 ? x0 + .2 : x0, h, h + .4, zz, zz + len, [120, 110, 100]);
      }
      zz += len;
    }
    if (sh.bayrak !== false) for (const [sd, z, y] of [[-1, 6, 6.4], [1, 9, 6.4], [-1, 16, 9.3], [1, 20, 6.4], [-1, 27, 6.4], [1, 33, 9.3], [-1, 40, 6.4]]) {
      const x0 = sd * 7.95, sw = Math.sin(t * 2 + z) * .12, a = P(x0, y, z), b = P(x0, y, z + 3.3), c = P(x0 - sd * (.08 + sw * .3), y - 2.2, z), d = P(x0 - sd * (.08 + sw * .3), y - 2.2, z + 3.3);
      if (!a || !b || !c || !d) continue; const zq = (a.z + d.z) / 2, fl = bayrakDoku();
      add(zq, () => { X.save(); X.setTransform((b.x - a.x) / 900, (b.y - a.y) / 900, (c.x - a.x) / 600, (c.y - a.y) / 600, a.x, a.y); X.drawImage(fl, 0, 0); X.restore();
        X.save(); X.globalAlpha = 1 - Math.exp(-zq * FOGK) + (1 - ISIK) * .5; X.fillStyle = `rgb(${FOG[0] | 0},${FOG[1] | 0},${FOG[2] | 0})`; X.beginPath(); X.moveTo(a.x, a.y); X.lineTo(b.x, b.y); X.lineTo(d.x, d.y); X.lineTo(c.x, c.y); X.fill(); X.restore(); });
    }
    quad([[-9, 0, 70], [9, 0, 70], [9, 24, 70], [-9, 24, 70]], [222, 206, 182]); bayrak3(-3, 21, 69.8, 6, 4, t, .06);
    if (gece) for (const z of [4, 16, 28, 40]) for (const sd of [-1, 1]) { cap([sd * 4.4, 0, z], [sd * 4.4, 4.2, z], .06, [40, 44, 48]); puff([sd * 4.4, 4.3, z], 1.4, [255, 220, 150], .7); }
    if (sh.saat) { cap([3.6, 0, 4.2], [3.6, 3.1, 4.2], .06, [40, 44, 48]); const cp = P(3.6, 3.5, 4.15);
      if (cp) add(cp.z - .1, () => { const r = .42 * cp.s; X.fillStyle = '#2b2f33'; X.beginPath(); X.arc(cp.x, cp.y, r * 1.12, 0, 7); X.fill(); X.fillStyle = '#f4efe4'; X.beginPath(); X.arc(cp.x, cp.y, r, 0, 7); X.fill();
        const mins = sh.saat[1] + (sh.durAni != null && t >= sh.durAni ? 1 : 0), ma = mins / 60 * Math.PI * 2, ha = (sh.saat[0] + mins / 60) / 12 * Math.PI * 2; X.strokeStyle = '#222'; X.lineCap = 'round';
        X.lineWidth = r * .09; X.beginPath(); X.moveTo(cp.x, cp.y); X.lineTo(cp.x + Math.sin(ha) * r * .5, cp.y - Math.cos(ha) * r * .5); X.stroke();
        X.lineWidth = r * .06; X.beginPath(); X.moveTo(cp.x, cp.y); X.lineTo(cp.x + Math.sin(ma) * r * .78, cp.y - Math.cos(ma) * r * .78); X.stroke(); }); }
  },
  yer(n, i, r, ft) {
    if (ft) { const sl = [[-1.3, 5, 0], [2.8, 7, -Math.PI / 2], [-3, 6.5, Math.PI / 2], [1.2, 9, 0]]; const s = sl[i % 4]; return { x: s[0] + (i >= 4 ? r() * 2 - 1 : 0), z: s[1] + Math.floor(i / 4) * 3, th: s[2] }; }
    const sd = r() < .5 ? -1 : 1; return { x: sd * (4.6 + r() * 2.6), z: 3 + r() * 30, th: r() < .5 ? 0 : Math.PI };
  },
};
function anitkabirYapi(t, yari) {
  const st = [214, 200, 176];
  zemin(-60, 60, -20, 22, [178, 168, 150], 1, 0, 900);
  for (let i = -60; i < 60; i += 4) quad([[i, .01, -20], [i + .08, .01, -20], [i + .08, .01, 20], [i, .01, 20]], [150, 142, 128], 1, 1, 800);
  for (let k = 0; k < 26; k++) { const y0 = k * .27, z0 = 20 + k * .55; box(-26, 26, y0, y0 + .27, z0, z0 + .55, st, { kf: k % 2 ? .86 : .9, kt: 1.08 }); }
  box(-30, 30, 0, 7, 34.3, 62, st, { kf: .92 }); box(-20, 20, 7, 20, 39.5, 58, [150, 136, 118], { kf: .75 });
  for (let i = 0; i < 12; i++) { const x = -20.6 + i * (41.2 / 11); box(x - .75, x + .75, 7, 20, 36, 37.5, st, { kf: 1.04, ks: .8 }); box(x - .95, x + .95, 19.6, 20.2, 35.8, 37.7, st, { kf: 1.1 }); }
  for (const x of [-20.6, 20.6]) for (let j = 1; j < 5; j++) { const z = 36 + j * 5.2; box(x - .75, x + .75, 7, 20, z, z + 1.5, st, { ks: .8 }); }
  box(-22, 22, 20, 23, 35.5, 58.5, st, { kf: 1.06, kt: 1.15 }); box(-13, 13, 23, 25.2, 40, 55, st, { kf: 1, kt: 1.12 });
  const r = rnd(9); for (let i = 0; i < 30; i++) { const x = -70 + i * 4.8 + r() * 2, z = 66 + r() * 8, h = 5 + r() * 5; ball([x, h, z], 2.6 + r() * 1.5, [60, 80, 62]); }
  direkBayrak(-11, 12, 26, t, yari, 6.6);
  for (const x of [-6, 0, 6]) { // çelenk: ayaklı, yeşil halka, kırmızı-beyaz çiçekler
    cap([x - .35, 0, 19.7], [x - .2, 1.0, 19.7], .025, [90, 70, 50]); cap([x + .35, 0, 19.7], [x + .2, 1.0, 19.7], .025, [90, 70, 50]);
    for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2; ball([x + Math.cos(a) * .5, 1.35 + Math.sin(a) * .5, 19.6], .13, i % 3 ? [44, 96, 54] : [210, 30, 44], .1); }
    cap([x - .12, 1.0, 19.55], [x - .2, .55, 19.55], .04, [230, 30, 40], .05); cap([x + .12, 1.0, 19.55], [x + .2, .55, 19.55], .04, [240, 240, 240], .05); }
}
MEKAN.anitkabir = {
  kam: { x: -1, y: 1.6, z: -8, f: 1250, yaw: .03, pitch: .08, hy: .52 },
  ciz(t, sh) { anitkabirYapi(t, sh.yariBayrak); },
  yer(n, i, r, ft) {
    if (ft) { const sl = [[-.2, 12], [.5, 12], [-1.4, 11], [1.6, 11.4]]; const s = sl[i % 4]; return { x: s[0] + Math.floor(i / 4) * 2.2, z: s[1] - Math.floor(i / 4) * 1.4, th: 0 }; }
    const row = Math.floor(i / 12), c = i % 12; return { x: -12 + c * 2.1 + (row % 2) * .9 + (r() - .5) * .6, z: 5 + row * 1.5 + r() * .5, th: 0 };
  },
};
MEKAN.cephe = {
  kam: { x: .6, y: 1.3, z: -4, f: 1150, yaw: -.04, pitch: .05, hy: .56 },
  ciz(t, sh) {
    zemin(-80, 80, -20, 140, [112, 96, 66], 1, 0, 900);
    const r = rnd(3);
    for (let i = 0; i < 9; i++) { const x = -70 + i * 18 + r() * 6, z = 90 + r() * 30, R = 22 + r() * 18; ball([x, -R * .55, z], R, [96, 100, 64], 400 + i); }
    for (let i = 0; i < 6; i++) { const x = -40 + i * 16 + r() * 5, z = 55 + r() * 10, R = 10 + r() * 8; ball([x, -R * .6, z], R, [110, 104, 70], 300 + i); }
    // siper hatları: kum torbaları
    for (const zr of [2, 14, 30]) for (let x = -14; x < 14; x += .9) { const y0 = .18, rr = rnd(Math.floor(x * 10 + zr)); for (let k = 0; k < 3; k++) cap([x - .35, y0 + k * .3, zr + rr() * .1], [x + .35, y0 + k * .3, zr + rr() * .1], .17, [168, 150, 112]); }
    for (let x = -12; x < 12; x += 3) { cap([x, 0, 22], [x, 1.2, 22], .04, [80, 60, 40]); }
    quad([[-12, 1, 22], [12, 1, 22], [12, 1.02, 22], [-12, 1.02, 22]], [60, 60, 60]);
    if (sh.efekt.includes('duman') || true) { dumanSutunu(-18, 60, t, 1); dumanSutunu(24, 75, t + 3, 1.3); dumanSutunu(4, 95, t + 1.5, 1.6); }
    if (sh.bayrak !== false) direkBayrak(7, 46, 9, t, false, 3.2);
  },
  yer(n, i, r, ft) {
    if (ft) { const sl = [[-1.2, 4.2], [.9, 4.6], [-2.8, 5.4], [2.4, 5.6]]; const s = sl[i % 4]; return { x: s[0] + Math.floor(i / 4) * 1.4, z: s[1] + Math.floor(i / 4) * 1.2, th: 0 }; }
    return { x: -12 + (i % 12) * 2 + r(), z: 6 + Math.floor(i / 12) * 2.5 + r(), th: 0 };
  },
};
MEKAN.meydan = {
  kam: { x: 0, y: 2.2, z: -6, f: 1150, yaw: 0, pitch: .06, hy: .55 },
  ciz(t, sh) {
    const gece = sh.zaman === 'gece';
    zemin(-60, 60, -20, 80, [150, 140, 128], 1, 0, 900);
    for (let i = -30; i < 30; i += 3) quad([[i, .01, -20], [i + .06, .01, -20], [i + .06, .01, 60], [i, .01, 60]], [130, 120, 110], 1, 1, 800);
    const r = rnd(12), cols = [[214, 190, 160], [196, 170, 150], [226, 214, 190], [200, 186, 170]];
    for (let i = 0; i < 7; i++) { const x0 = -36 + i * 10.5, h = 14 + r() * 10; quad([[x0, 0, 46], [x0 + 10, 0, 46], [x0 + 10, h, 46], [x0, h, 46]], cols[i % 4]);
      for (let fl = 1; fl * 3 < h - 1; fl++) for (let k = 0; k < 3; k++) { const yan = gece ? r() < .7 : false; quad([[x0 + 1 + k * 3, fl * 3, 45.9], [x0 + 2.3 + k * 3, fl * 3, 45.9], [x0 + 2.3 + k * 3, fl * 3 + 1.6, 45.9], [x0 + 1 + k * 3, fl * 3 + 1.6, 45.9]], yan ? [255, 210, 120] : [60, 70, 84], yan ? 2 : 1); } }
    // dev sarkan bayrak
    { const a = P(-8, 21, 45.6), b = P(8, 21, 45.6), c = P(-8, 10.3, 45.6), fl = bayrakDoku(); if (a && b && c) add(a.z - 1, () => { X.save(); X.setTransform((b.x - a.x) / 900, (b.y - a.y) / 900, (c.x - a.x) / 600, (c.y - a.y) / 600, a.x, a.y); X.drawImage(fl, 0, 0); X.restore(); if (ISIK < .9) { X.fillStyle = `rgba(0,0,20,${(1 - ISIK) * .5})`; X.fillRect(a.x, a.y, b.x - a.x, c.y - a.y); } }); }
    box(-2.5, 2.5, 0, 1.2, 30, 34, [190, 178, 160]); cap([0, 1.2, 32], [0, 9, 32], .5, [206, 194, 172]); // anıt
    direkBayrak(-14, 20, 18, t); direkBayrak(14, 20, 18, t);
    if (gece) for (const x of [-20, -10, 10, 20]) { cap([x, 0, 8], [x, 5, 8], .07, [40, 40, 44]); puff([x, 5.1, 8], 1.6, [255, 220, 150], .7); }
  },
  yer(n, i, r, ft) {
    if (ft) { const sl = [[-.8, 3.5], [.9, 3.8], [-2.2, 5], [2.4, 5.2]]; const s = sl[i % 4]; return { x: s[0] + Math.floor(i / 4) * 1.6, z: s[1] + Math.floor(i / 4) * 1.3, th: 0 }; }
    return { x: (r() - .5) * 34, z: 7 + r() * 20, th: (r() - .5) * .6 };
  },
};
MEKAN.okul = {
  kam: { x: .5, y: 1.4, z: -3, f: 1150, yaw: -.03, pitch: .06, hy: .56 },
  ciz(t, sh) {
    zemin(-60, 60, -20, 80, [150, 146, 140], 1, 0, 900);
    const sc = [226, 190, 150]; box(-24, 24, 0, 13, 30, 40, sc, { kf: .98 });
    for (let fl = 0; fl < 3; fl++) for (let k = 0; k < 10; k++) { const x = -21 + k * 4.4; quad([[x, 1.6 + fl * 4, 29.95], [x + 2, 1.6 + fl * 4, 29.95], [x + 2, 3.4 + fl * 4, 29.95], [x, 3.4 + fl * 4, 29.95]], [70, 96, 120]); }
    box(-2, 2, 0, 3.4, 29.6, 30, [120, 80, 50]); box(-25, 25, 13, 14, 29.5, 40.5, [170, 70, 60]);
    const r = rnd(4); for (let i = 0; i < 10; i++) { const x = (i < 5 ? -1 : 1) * (28 + r() * 14), z = 10 + i * 3 + r() * 4; cap([x, 0, z], [x, 2.5, z], .18, [90, 64, 40]); ball([x, 4, z], 2 + r(), [70, 120, 60]); }
    direkBayrak(0, 22, 12, t);
    box(-30, 30, 0, 1.2, 46, 46.4, [190, 186, 180]);
  },
  yer(n, i, r, ft) {
    if (ft) { const sl = [[-.9, 4.2], [.8, 4.4], [-2.3, 5.4], [2.2, 5.6]]; const s = sl[i % 4]; return { x: s[0] + Math.floor(i / 4) * 1.4, z: s[1] + Math.floor(i / 4) * 1.2, th: 0 }; }
    const row = Math.floor(i / 10), c = i % 10; return { x: -9 + c * 2 + (r() - .5) * .3, z: 9 + row * 1.6, th: 0 };
  },
};
MEKAN.sahil = {
  kam: { x: 0, y: 1.7, z: -4, f: 1150, yaw: 0, pitch: .02, hy: .5 },
  ciz(t, sh) {
    zemin(-80, 80, -20, 12, [220, 200, 160], 1, 0, 900);
    zemin(-200, 200, 12, 400, [40, 96, 140], 1, -.02, 950);
    for (let i = 0; i < 30; i++) { const z = 13 + i * i * .4, ph = t * 1.2 + i; quad([[-200, .0, z], [200, .0, z], [200, 0, z + .25 + i * .05], [-200, 0, z + .25 + i * .05]], [120, 170, 205], .9 + .2 * Math.sin(ph), .5, 940 - i); }
    for (let i = 0; i < 6; i++) { const x = -30 + i * 12, ph = (t * .5 + i * .37) % 1; quad([[x - 8, .03, 12 - ph * 1.5], [x + 8, .03, 12 - ph * 1.5], [x + 8, .03, 12.4 - ph * 1.5], [x - 8, .03, 12.4 - ph * 1.5]], [245, 245, 240], 1, 1 - ph, 850); }
    if (sh.gemi !== false) { const gx = -30 + ((t * 1.1) % 80), gz = 120; box(gx - 9, gx + 9, 0, 3, gz - 2, gz + 2, [40, 40, 46]); box(gx - 6, gx + 5, 3, 6, gz - 1.6, gz + 1.6, [230, 226, 216]); cap([gx - .5, 6, gz], [gx - .5, 10, gz], .7, [30, 30, 34]); puff([gx - 1.5, 11.5 + Math.sin(t) * .2, gz], 2.2, [120, 120, 120], .5); cap([gx + 6, 3, gz], [gx + 6, 12, gz], .08, [80, 70, 60]); bayrak3(gx + 6, 12, gz, 3, 2, t, .1); }
  },
  yer(n, i, r, ft) {
    if (ft) { const sl = [[-.8, 5], [.9, 5.2], [-2.2, 6.2], [2.4, 6.4]]; const s = sl[i % 4]; return { x: s[0] + Math.floor(i / 4) * 1.5, z: s[1] + Math.floor(i / 4) * 1.2, th: 0 }; }
    return { x: (r() - .5) * 30, z: 4 + r() * 6, th: (r() - .5) * .8 };
  },
};
MEKAN.tepe = {
  kam: { x: 0, y: 1.2, z: -6, f: 1150, yaw: 0, pitch: .12, hy: .6 },
  ciz(t, sh) {
    zemin(-200, 200, -20, 160, [78, 100, 56], 1, 0, 950);
    ball([0, -60, 40], 66, [74, 90, 56], 300); ball([-60, -40, 120], 60, [62, 74, 50], 500); ball([70, -50, 140], 70, [58, 70, 48], 520);
    direkBayrak(0, 30, 16, t, sh.yariBayrak, 7);
  },
  yer(n, i, r, ft) {
    if (ft) { const sl = [[-.8, 9], [.8, 9.2], [-2.2, 10], [2.2, 10.2]]; const s = sl[i % 4]; return { x: s[0] + Math.floor(i / 4) * 1.6, z: s[1] + Math.floor(i / 4) * 1.4, th: 0 }; }
    return { x: (r() - .5) * 20, z: 10 + r() * 12, th: 0 };
  },
};
MEKAN.siyah = { kam: { x: 0, y: 1.6, z: 0, f: 1200, yaw: 0, pitch: 0, hy: .5 }, ciz() { }, yer: () => ({ x: 0, z: 5, th: 0 }) };
export const MEKANLAR = Object.keys(MEKAN);
export const KAMERALAR = ['sabit', 'yaklas', 'uzaklas', 'yuksel', 'alcal', 'pan_sag', 'pan_sol', 'takip'];
function kamera(sh, u, lt) {
  const b = MEKAN[sh.mekan].kam, e = ease(u);
  cam = { ...b };
  cam.x += Math.sin(lt * .4) * .05; cam.y += Math.sin(lt * .3) * .03;
  switch (sh.kamera) {
    case 'yaklas': cam.z += 3.2 * e; break;
    case 'uzaklas': cam.z += 2.5 - 3.5 * e; break;
    case 'yuksel': cam.y += 7 * e; cam.z -= 4 * e; cam.pitch -= .14 * e; break;
    case 'alcal': cam.y += 7 * (1 - e); cam.z -= 4 * (1 - e); cam.pitch -= .14 * (1 - e); break;
    case 'pan_sag': cam.yaw += .3 * e - .12; break;
    case 'pan_sol': cam.yaw -= .3 * e - .12; break;
    case 'takip': { const a = sh.aktorler.find(x => x.ft && x.v > 0) || sh.aktorler.find(x => x.ft); if (a) { const d = a.v > 0 ? lt * a.v * (a.eylem === 'kos' ? 2.3 : 1) : 0; const ax = a.x + Math.sin(a.th) * d, az = a.z + Math.cos(a.th) * d; cam.z = az - lerp(5, 3.6, e); cam.x = ax + 1.1 - .5 * e; cam.y = lerp(1.25, 1.7, e); cam.pitch = lerp(.04, .14, e); cam.yaw = -.12 + .08 * e; } break; }
    default: cam.z += .8 * e;
  }
}
// ------------------------------------------------------------ yazılar + logo
function yazi(s, x, y, size, al, o = {}) {
  if (al <= 0 || !s) return; X.save(); X.globalAlpha = cl(al); X.font = `${o.w || 700} ${size}px ${o.f || 'Inter, sans-serif'}`; X.textAlign = 'center'; X.textBaseline = 'middle';
  X.shadowColor = 'rgba(0,0,0,.6)'; X.shadowBlur = o.sb ?? 26; X.fillStyle = o.c || '#fff'; X.fillText(s, x, y); X.restore();
}
function sar(s, size, maxW, o = {}) { X.save(); X.font = `${o.w || 700} ${size}px ${o.f || 'Inter, sans-serif'}`; const ws = String(s).split(/\s+/), ls = []; let cur = ''; for (const w of ws) { const tt = cur ? cur + ' ' + w : w; if (X.measureText(tt).width > maxW && cur) { ls.push(cur); cur = w; } else cur = tt; } if (cur) ls.push(cur); X.restore(); return ls; }
function cokSatir(s, x, y, size, lh, maxW, al, o = {}) { const ls = sar(s, size, maxW, o); ls.forEach((l, i) => yazi(l, x, y + (i - (ls.length - 1) / 2) * lh, size, al, o)); return ls.length; }
function markaCiz(marka, cx, cy, al) {
  X.save(); X.globalAlpha = al; X.font = '800 112px Inter, sans-serif'; X.textAlign = 'center'; X.textBaseline = 'middle';
  const ad = String(marka || '').toLocaleUpperCase('tr-TR'), w = X.measureText(ad).width, rx = cx + w / 2 + 70;
  X.fillStyle = '#F7F7FA'; X.fillText(ad, cx - 40, cy);
  X.shadowColor = '#FF1F3D'; X.shadowBlur = 22; X.fillStyle = '#FF1F3D'; X.strokeStyle = '#FF1F3D';
  X.beginPath(); X.arc(rx - 40, cy, 13, 0, 7); X.fill(); X.lineWidth = 9; X.beginPath(); X.arc(rx - 40, cy, 32, 0, 7); X.stroke(); X.globalAlpha = al * .45; X.lineWidth = 7; X.beginPath(); X.arc(rx - 40, cy, 50, 0, 7); X.stroke();
  X.restore();
}
// ------------------------------------------------------------ çizici
export function cizici(plan) {
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const ctx = cv.getContext('2d');
  // aktörleri hazırla
  plan.sahneler.forEach((sh, si) => {
    const r = rnd(plan.tohum + si * 101); sh.aktorler = [];
    let n = 0;
    for (const g of sh.karakterler) {
      const adet = cl(g.adet | 0 || 1, 1, 90);
      for (let k = 0; k < adet; k++) {
        const ft = adet <= 4 && sh.aktorler.filter(a => a.ft).length < 6, pos = MEKAN[sh.mekan].yer(adet, ft ? sh.aktorler.filter(a => a.ft).length : n++, r, ft);
        let th = pos.th, v = 0;
        if (g.eylem === 'yuru' || g.eylem === 'kos' || (g.eylem === 'bayrak' && sh.mekan !== 'anitkabir')) { v = (g.tip === 'yasli' ? .55 : g.tip === 'cocuk' ? .9 : .85) * (.85 + r() * .3); if (!ft && sh.mekan === 'sokak') th = pos.th; }
        if (g.eylem === 'bayrak' && sh.mekan === 'anitkabir') v = 0;
        sh.aktorler.push({ ...pos, th, v, ft, tip: g.tip, eylem: g.eylem, gec: r() * .6, look: gorunum(g.tip, r) });
      }
    }
  });
  const toplam = plan.sure;
  function kare(t) {
    X = ctx; X.setTransform(1, 0, 0, 1, 0, 0); X.globalAlpha = 1; X.globalCompositeOperation = 'source-over';
    X.fillStyle = '#000'; X.fillRect(0, 0, W, H);
    if (t >= plan.kapanisBas) { kapanis(t); serit(); return cv; }
    const sh = plan.sahneler.find(s => t >= s.bas && t < s.bas + s.sure) || plan.sahneler[plan.sahneler.length - 1];
    const lt = t - sh.bas, u = lt / sh.sure;
    if (sh.mekan !== 'siyah') {
      gok(sh.zaman, t, sh.efekt); FOGK = sh.efekt.includes('sis') ? .02 : ({ anitkabir: .009, meydan: .008, cephe: .0045, tepe: .004, sahil: .004, okul: .006 }[sh.mekan] ?? .0085);
      kamera(sh, u, lt); MEKAN[sh.mekan].ciz(t, sh);
      for (const a of sh.aktorler) aktorCiz(a, t, u, sh);
      let flas = 0;
      if (sh.mekan === 'cephe' || sh.efekt.includes('patlama')) {
        const r = rnd(sh.bas * 10 + 3); const sayi = sh.efekt.includes('patlama') || sh.olay === 'patlama' || sh.olay === 'top_atisi' ? 4 : 1;
        for (let i = 0; i < sayi; i++) { const t0 = sh.bas + .6 + i * (sh.sure / sayi) + r() * .5; flas = Math.max(flas, patlama((r() - .5) * 40, 35 + r() * 40, t0, t, 1 + r())); }
      }
      if (sh.efekt.includes('duman') && sh.mekan !== 'cephe') { dumanSutunu(-20, 60, t); dumanSutunu(18, 70, t + 2); }
      flush();
      if (sh.efekt.includes('havai_fisek')) havaiFisek(t, lt);
      if (sh.zaman !== 'gece') huzme(sh.zaman === 'aksam' ? 'rgba(255,170,90,.32)' : 'rgba(255,224,170,.28)');
      if (sh.efekt.includes('yagmur')) yagmur(t);
      if (sh.efekt.includes('kar')) kar(t);
      if (sh.durAni != null && t > sh.durAni) { X.fillStyle = `rgba(110,110,120,${smooth(seg(t, sh.durAni, sh.durAni + 2.5)) * .2})`; X.fillRect(0, 0, W, H); }
      if (flas > 0) { X.fillStyle = `rgba(255,236,200,${flas * .7})`; X.fillRect(0, 0, W, H); }
      vinyet(sh.zaman === 'gece' ? .7 : .55);
    }
    // yazılar
    const ya = seg(lt, .5, 1.2) * (1 - seg(lt, sh.sure - .7, sh.sure - .2));
    if (sh.alinti) {
      X.fillStyle = `rgba(0,0,0,${ya * .45})`; X.fillRect(0, H * .07, W, H * .27);
      const n = cokSatir('“' + sh.alinti + '”', W / 2, H * .18, 50, 68, 900, ya, { f: 'Georgia, "Noto Serif", serif', w: 500 });
      if (sh.alintiKimden) yazi(sh.alintiKimden, W / 2, H * .18 + n * 34 + 40, 36, ya * seg(lt, 1.2, 2), { w: 600, c: '#ffd9dd' });
    }
    if (sh.yazi) {
      const y = sh.yaziKonum === 'ust' ? H * .14 : sh.yaziKonum === 'orta' ? H * .45 : H * .8;
      if (sh.yaziKonum === 'ust') { const g = X.createLinearGradient(0, 0, 0, H * .3); g.addColorStop(0, `rgba(0,0,0,${ya * .5})`); g.addColorStop(1, 'rgba(0,0,0,0)'); X.fillStyle = g; X.fillRect(0, 0, W, H * .3); }
      if (sh.vurgu) cokSatir(sh.yazi, W / 2, y, 150, 160, 980, ya, { w: 800 });
      else cokSatir(sh.yazi, W / 2, y, 70, 92, 940, ya, { w: 800 });
    }
    // geçiş: siyaha kararma
    const kenar = Math.min(seg(lt, 0, .45), 1 - seg(lt, sh.sure - .4, sh.sure));
    if (kenar < 1) { X.fillStyle = `rgba(0,0,0,${1 - kenar})`; X.fillRect(0, 0, W, H); }
    serit(); return cv;
  }
  function serit() { X.fillStyle = '#000'; X.fillRect(0, 0, W, 70); X.fillRect(0, H - 70, W, 70); }
  function kapanis(t) {
    const k = plan.kapanis, lt = t - plan.kapanisBas, a = seg(lt, .2, 1.4), e = 1 - seg(t, toplam - .8, toplam);
    if (k.bayrak) { X.save(); X.globalAlpha = a * e; const L = 780, h = 520; bayrak2(W / 2 - L / 2, H * .2, L, h, t); X.restore(); X.save(); X.globalAlpha = a * e; X.fillStyle = '#bbb'; X.fillRect(W / 2 - L / 2 - 14, H * .2 - 30, 10, h + 90); X.restore(); }
    const ly = k.bayrak ? H * .62 : H * .44;
    markaCiz(plan.marka, W / 2, ly, seg(lt, 1.5, 2.5) * e);
    cokSatir(k.baslik || '', W / 2, ly + 160, 50, 64, 920, seg(lt, 2.4, 3.4) * e, { w: 500, c: '#e8e8ee' });
    if (k.alt) yazi(k.alt, W / 2, ly + 280, 40, seg(lt, 3.3, 4.3) * e, { w: 500, c: '#ff6a7d' });
  }
  return { kare, canvas: cv };
}
