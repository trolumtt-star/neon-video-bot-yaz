// Piksel sanat motoru: 270x480 düşük çözünürlüklü dünya.
// Mekanlar: kafe, dukkan_onu, sahil  ·  Zaman: sabah, ogle, aksam, gece
export const DW = 270, DH = 480;
export const MASA = { x: 135, ust: 345 };
export const KOLTUK = { A: 70, B: 200 };       // karakterlerin x merkezi
export const AYAK_Y = 422;                       // karakter sprite tabanı
export const TELEFON = { x: 100, y: 341 };       // masadaki telefon

export function rng(seed) {
  let a = (typeof seed === 'string' ? [...seed].reduce((s, c) => (s * 31 + c.charCodeAt(0)) | 0, 7) : seed) >>> 0;
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function tuval(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const x = c.getContext('2d');
  x.imageSmoothingEnabled = false;
  return [c, x];
}

const R = (x, px, py, w, h, c) => { x.fillStyle = c; x.fillRect(Math.round(px), Math.round(py), Math.round(w), Math.round(h)); };

function dikeyGecis(x, x0, y0, w, h, renkler) {
  const g = x.createLinearGradient(0, y0, 0, y0 + h);
  renkler.forEach((r, i) => g.addColorStop(i / Math.max(1, renkler.length - 1), r));
  x.fillStyle = g; x.fillRect(x0, y0, w, h);
}

// ------------------------------------------------------------ 3x5 piksel yazı
const GLIF = {
  A: '010101111101101', B: '110101110101110', C: '011100100100011', D: '110101101101110', E: '111100110100111',
  F: '111100110100100', G: '011100101101011', H: '101101111101101', I: '111010010010111', J: '001001001101010',
  K: '101101110101101', L: '100100100100111', M: '101111111101101', N: '110101101101101', O: '010101101101010',
  P: '110101110100100', Q: '010101101110011', R: '110101110101101', S: '011100010001110', T: '111010010010010',
  U: '101101101101111', V: '101101101101010', W: '101101111111101', X: '101101010101101', Y: '101101010010010',
  Z: '111001010100111', '0': '111101101101111', '1': '010110010010111', '2': '110001010100111', '3': '110001010001110',
  '4': '101101111001001', '5': '111100110001110', '6': '011100111101111', '7': '111001010010010', '8': '111101111101111',
  '9': '111101111001110', '.': '000000000000010', '&': '010101010101011', '-': '000000111000000', "'": '010010000000000',
  ' ': '000000000000000',
};
const TR = { 'Ç': 'C', 'Ğ': 'G', 'İ': 'I', 'Ö': 'O', 'Ş': 'S', 'Ü': 'U', 'Â': 'A' };
export function pikselYaziGenislik(s, o = 1) { return s.length * 4 * o - o; }
export function pikselYazi(x, s, px, py, renk, o = 1) {
  s = s.toLocaleUpperCase('tr-TR');
  x.fillStyle = renk;
  [...s].forEach((ch, i) => {
    const g = GLIF[TR[ch] || ch] || GLIF[' '];
    for (let k = 0; k < 15; k++) if (g[k] === '1') x.fillRect(px + i * 4 * o + (k % 3) * o, py + Math.floor(k / 3) * o, o, o);
    if ('ÇŞ'.includes(ch)) x.fillRect(px + i * 4 * o + o, py + 5 * o, o, o);
    if ('ĞÜÖ'.includes(ch)) { x.fillRect(px + i * 4 * o, py - 2 * o, o, o); x.fillRect(px + i * 4 * o + 2 * o, py - 2 * o, o, o); }
  });
}

// ------------------------------------------------------------ zaman paletleri
export const ZAMAN = {
  sabah: { gok: ['#7ec8f5', '#bfe6ff', '#fff1d6'], ton: null, isik: 0.25 },
  ogle: { gok: ['#3e9cf0', '#8ccfff', '#d9f1ff'], ton: null, isik: 0.15 },
  aksam: { gok: ['#2a1748', '#a33a6b', '#ff8a4c', '#ffc76b'], ton: 'rgba(255,140,90,0.16)', isik: 0.55 },
  gece: { gok: ['#03061a', '#0d1440', '#232a66'], ton: 'rgba(20,25,80,0.42)', isik: 1 },
};

// ------------------------------------------------------------ arka planlar (statik)
export function arkaPlan(mekan, zaman, tohum, isletmeAdi = 'KEBAP') {
  const [c, x] = tuval(DW, DH);
  const r = rng(tohum);
  const z = ZAMAN[zaman] || ZAMAN.ogle;
  const gece = zaman === 'gece';
  x.fillStyle = mekan === 'sahil' ? '#5e544b' : mekan === 'kafe' ? '#1d1116' : '#7a746c';
  x.fillRect(0, 0, DW, DH);
  if (mekan === 'kafe') kafe(x, r, z, gece);
  else if (mekan === 'sahil') sahil(x, r, z, gece);
  else if (mekan === 'araba' || mekan === 'yuruyus' || mekan === 'pazar') dikeyGecis(x, 0, 0, DW, 320, z.gok);
  else if (mekan === 'park') park(x, r, z, gece);
  else if (mekan === 'durak') durak(x, r, z, gece);
  else if (mekan === 'balik') balikBg(x, r, z, gece);
  else dukkan(x, r, z, gece, isletmeAdi);
  return c;
}

function sokakManzara(x, r, x0, y0, w, h, z, gece) {
  dikeyGecis(x, x0, y0, w, h, z.gok);
  let bx = x0;
  while (bx < x0 + w) {
    const bw = 14 + (r() * 16 | 0), bh = 40 + (r() * 60 | 0);
    const renk = ['#5b4a6b', '#6d5a52', '#4b5568', '#7a5b48'][r() * 4 | 0];
    R(x, bx, y0 + h - bh, bw, bh, gece ? '#1a1830' : renk);
    for (let yy = y0 + h - bh + 4; yy < y0 + h - 6; yy += 8)
      for (let xx = bx + 3; xx < bx + bw - 3; xx += 6)
        R(x, xx, yy, 3, 4, gece ? (r() < 0.5 ? '#ffd27a' : '#2a2840') : '#a9c7de');
    bx += bw + 1;
  }
}

function kafe(x, r, z, gece) {
  R(x, 0, 0, DW, 352, '#3b2230');
  // tuğla duvar
  for (let y = 0; y < 250; y += 7) {
    const off = (y / 7) % 2 ? 0 : 8;
    for (let xx = -off; xx < DW; xx += 16) {
      R(x, xx, y, 15, 6, ['#5e2f2c', '#673530', '#57292a'][r() * 3 | 0]);
    }
  }
  // ahşap lambri
  R(x, 0, 250, DW, 102, '#4a2a1f');
  for (let xx = 0; xx < DW; xx += 18) R(x, xx, 252, 1, 98, '#3a2018');
  R(x, 0, 248, DW, 4, '#6b3e28');
  R(x, 0, 348, DW, 4, '#2a160f');
  // pencere
  const wx = 16, wy = 108, ww = 104, wh = 116;
  sokakManzara(x, r, wx, wy, ww, wh, z, gece);
  R(x, wx - 4, wy - 4, ww + 8, 4, '#2a1710'); R(x, wx - 4, wy + wh, ww + 8, 6, '#6b3e28');
  R(x, wx - 4, wy, 4, wh, '#2a1710'); R(x, wx + ww, wy, 4, wh, '#2a1710');
  R(x, wx + ww / 2 - 1, wy, 3, wh, '#2a1710');
  R(x, wx, wy + 40, ww, 2, '#2a1710');
  // raflar
  for (const ry of [150, 196]) {
    R(x, 150, ry, 108, 4, '#7a4a2c'); R(x, 150, ry + 4, 108, 2, '#3a2018');
    let px = 154;
    while (px < 250) {
      const tur = r() * 4 | 0;
      if (tur === 0) { R(x, px, ry - 12, 8, 12, '#d8e6e8'); R(x, px + 1, ry - 7, 6, 6, ['#c0392b', '#e67e22', '#8e5a2b'][r() * 3 | 0]); R(x, px, ry - 14, 8, 2, '#9aa'); px += 11; }
      else if (tur === 1) { R(x, px, ry - 6, 6, 6, '#f2efe8'); R(x, px + 6, ry - 5, 2, 3, '#f2efe8'); px += 10; }
      else if (tur === 2) { R(x, px + 1, ry - 7, 7, 7, '#7b4b33'); R(x, px, ry - 16, 9, 9, '#3f9a4f'); R(x, px + 2, ry - 19, 5, 4, '#57c065'); px += 12; }
      else { R(x, px, ry - 10, 4, 10, '#e8d38a'); R(x, px + 4, ry - 12, 4, 12, '#c96d4b'); R(x, px + 8, ry - 9, 4, 9, '#5a8fbf'); px += 14; }
    }
  }
  // saat
  R(x, 186, 228, 1, 1, '#000');
  // zemin
  for (let y = 352; y < DH; y += 10)
    for (let xx = 0; xx < DW; xx += 16)
      R(x, xx, y, 16, 10, ((xx / 16 + (y - 352) / 10) % 2) ? '#2c1d24' : '#3b2a30');
  R(x, 0, 352, DW, 2, '#1d1116');
  if (z.ton) { x.fillStyle = z.ton; x.fillRect(0, 0, DW, DH); }
}

function dukkan(x, r, z, gece, isim) {
  dikeyGecis(x, 0, 0, DW, 70, z.gok);
  // üst kat
  R(x, 0, 18, DW, 60, '#c98c6b');
  for (const bx of [20, 110, 200]) {
    R(x, bx, 28, 40, 34, gece ? '#ffd27a' : '#6fa6c9'); R(x, bx + 19, 28, 2, 34, '#f2e6da');
    R(x, bx - 3, 25, 46, 3, '#f2e6da'); R(x, bx - 2, 62, 44, 5, '#7b4b33');
    for (let k = 0; k < 6; k++) R(x, bx + k * 7, 57, 5, 5, ['#e74c3c', '#f39c12', '#ff6fa8'][(k + bx) % 3]);
  }
  // cephe
  R(x, 0, 78, DW, 274, '#e8dcc6');
  for (let y = 78; y < 352; y += 12) R(x, 0, y, DW, 1, '#d6c7ad');
  // tabela
  R(x, 12, 84, 246, 28, '#7a1020'); R(x, 12, 84, 246, 2, '#b3243a'); R(x, 12, 110, 246, 2, '#4a0812');
  const ad = (isim || 'KEBAP').toLocaleUpperCase('tr-TR').slice(0, 20);
  const o = ad.length > 12 ? 2 : 3;
  const tw = ad.length * 4 * o - o;
  pikselYazi(x, ad, Math.round(135 - tw / 2), 98 - (5 * o) / 2 | 0, '#fff4d6', o);
  // tente
  for (let k = 0; k < 18; k++) {
    R(x, 6 + k * 14, 116, 14, 26, k % 2 ? '#f4f1ea' : '#d32f3f');
    R(x, 6 + k * 14 + 3, 142, 8, 3, k % 2 ? '#f4f1ea' : '#d32f3f');
  }
  R(x, 4, 114, 262, 3, '#8a1a26');
  // vitrin + kapı
  R(x, 14, 156, 138, 150, '#2b3a46');
  for (let yy = 176; yy < 300; yy += 30) {
    R(x, 18, yy, 130, 3, '#8a6a4a');
    for (let px = 22; px < 144; px += 10) R(x, px, yy - 9, 7, 9, ['#e8b04a', '#c0392b', '#7fb069', '#f2efe8'][(px + yy) % 4]);
  }
  R(x, 22, 160, 30, 140, 'rgba(255,255,255,0.08)');
  R(x, 10, 152, 146, 4, '#5a3a24'); R(x, 10, 306, 146, 6, '#5a3a24');
  R(x, 172, 156, 70, 196, '#5a3a24'); R(x, 177, 162, 60, 120, '#2b3a46'); R(x, 180, 166, 18, 110, 'rgba(255,255,255,0.08)');
  R(x, 230, 290, 4, 10, '#e8c36a');
  pikselYazi(x, 'AÇIK', 190, 220, gece ? '#ff3355' : '#2ee6a0', 2);
  // kaldırım
  for (let y = 352; y < 440; y += 11)
    for (let xx = ((y / 11) % 2) * 9; xx < DW; xx += 18) R(x, xx, y, 17, 10, ((xx + y) % 3) ? '#a9a39b' : '#b8b2a9');
  R(x, 0, 350, DW, 3, '#7a746c');
  R(x, 0, 440, DW, 6, '#d8d2c8'); R(x, 0, 446, DW, 34, '#3c3f45');
  for (let xx = 10; xx < DW; xx += 40) R(x, xx, 462, 20, 3, '#e8e2c8');
  // saksı
  R(x, 252, 316, 14, 34, '#9a5a3a'); R(x, 248, 290, 22, 28, '#3f9a4f'); R(x, 252, 284, 14, 10, '#57c065');
  if (z.ton) { x.fillStyle = z.ton; x.fillRect(0, 0, DW, DH); }
}

function sahil(x, r, z, gece) {
  dikeyGecis(x, 0, 0, DW, 262, z.gok);
  if (gece) for (let i = 0; i < 60; i++) R(x, r() * DW, r() * 200, 1, 1, r() < 0.3 ? '#fff' : '#9ab');
  // güneş/ay
  if (gece) { R(x, 200, 40, 14, 14, '#f4ecd0'); R(x, 205, 38, 12, 12, z.gok[0]); }
  else { x.fillStyle = z === ZAMAN.aksam ? '#ffd27a' : '#fff6c8'; x.beginPath(); x.arc(205, z === ZAMAN.aksam ? 222 : 58, 16, 0, 7); x.fill(); }
  // karşı kıyı siluet (kubbe + minare)
  const s = gece ? '#141836' : (z === ZAMAN.aksam ? '#4a2850' : '#6c84a8');
  R(x, 0, 236, DW, 26, s);
  const kubbe = (cx, rr, y) => { x.fillStyle = s; x.beginPath(); x.arc(cx, y, rr, Math.PI, 0); x.fill(); };
  kubbe(70, 14, 236); kubbe(52, 7, 238); kubbe(88, 7, 238);
  R(x, 40, 196, 3, 42, s); R(x, 98, 196, 3, 42, s); R(x, 40, 192, 3, 4, s); R(x, 98, 192, 3, 4, s);
  kubbe(190, 10, 238); R(x, 205, 206, 2, 32, s);
  for (let xx = 120; xx < 170; xx += 7) R(x, xx, 226 - (r() * 10 | 0), 6, 20, s);
  if (gece) for (let i = 0; i < 25; i++) R(x, r() * DW, 240 + r() * 18, 1, 1, '#ffd27a');
  // deniz
  dikeyGecis(x, 0, 262, DW, 86, gece ? ['#0b1238', '#060a22'] : (z === ZAMAN.aksam ? ['#6a3a6a', '#2a2a5a'] : ['#2a7fc0', '#16507f']));
  // korkuluk
  R(x, 0, 318, DW, 3, '#e8e8f0');
  R(x, 0, 334, DW, 2, '#c8c8d8');
  for (let xx = 4; xx < DW; xx += 12) R(x, xx, 318, 2, 32, '#d8d8e4');
  // zemin
  for (let y = 350; y < DH; y += 9)
    for (let xx = ((y / 9) % 2) * 7; xx < DW; xx += 14) R(x, xx, y, 13, 8, ((xx + y) % 4) ? '#8d7f73' : '#9a8c7f');
  R(x, 0, 348, DW, 3, '#5e544b');
  // fener direği
  R(x, 246, 196, 4, 154, '#2c2f3a'); R(x, 238, 186, 20, 10, '#2c2f3a'); R(x, 241, 190, 14, 6, gece ? '#ffe9a0' : '#cfd6e0');
  if (z.ton) { x.fillStyle = z.ton; x.fillRect(0, 0, DW, DH); }
}

// ------------------------------------------------------------ hareketli dekor
export function dekor(x, mekan, zaman, t, tohum) {
  const gece = zaman === 'gece';
  if (mekan === 'araba') return arabaDekor(x, zaman, t, tohum);
  if (mekan === 'yuruyus') return yuruyusDekor(x, zaman, t, tohum);
  if (mekan === 'pazar') return pazarDekor(x, zaman, t, tohum);
  if (mekan === 'park') return parkDekor(x, zaman, t);
  if (mekan === 'durak') return durakDekor(x, zaman, t);
  if (mekan === 'balik') return balikDekor(x, zaman, t);
  if (mekan === 'kafe') {
    // geçen araba
    const p = ((t + tohum % 7) % 7) / 7;
    const ax = -40 + p * 200;
    x.save(); x.beginPath(); x.rect(16, 108, 104, 116); x.clip();
    R(x, ax, 206, 30, 9, '#d6453d'); R(x, ax + 6, 200, 16, 7, '#d6453d'); R(x, ax + 8, 201, 12, 5, '#9fd3f0');
    R(x, ax + 4, 214, 6, 4, '#111'); R(x, ax + 20, 214, 6, 4, '#111');
    x.restore();
    // neon tabela
    neonYazi(x, 'ÇAY', 172, 72, '#ff2a4d', t);
    // lambalar
    for (const lx of [70, 200]) {
      R(x, lx, 0, 1, 44, '#1a1014');
      R(x, lx - 9, 44, 19, 7, '#c0392b'); R(x, lx - 6, 41, 13, 4, '#d6453d');
      R(x, lx - 3, 51, 7, 3, '#fff3c4');
      const g = x.createRadialGradient(lx, 56, 2, lx, 110, 80);
      g.addColorStop(0, `rgba(255,214,140,${0.30 + 0.25 * (ZAMAN[zaman]?.isik || 0)})`); g.addColorStop(1, 'rgba(255,214,140,0)');
      x.globalCompositeOperation = 'lighter'; x.fillStyle = g;
      x.beginPath(); x.moveTo(lx - 6, 54); x.lineTo(lx + 6, 54); x.lineTo(lx + 60, 300); x.lineTo(lx - 60, 300); x.fill();
      x.globalCompositeOperation = 'source-over';
    }
  } else if (mekan === 'dukkan_onu') {
    if (gece) neonYazi(x, 'AÇIK', 190, 220, '#ff2a4d', t, 2, false);
    // ampul dizisi
    for (let k = 0; k < 14; k++) {
      const yk = 146 + Math.sin(k * 0.9) * 2;
      const yan = (Math.floor(t * 3) + k) % 3 === 0;
      R(x, 10 + k * 19, yk, 3, 3, yan || gece ? '#ffe28a' : '#a08a50');
    }
  } else if (mekan === 'sahil') {
    // dalga parıltısı
    for (let i = 0; i < 18; i++) {
      const yy = 268 + (i * 37) % 48;
      const xx = ((i * 53 + t * (8 + i % 5)) % (DW + 30)) - 15;
      R(x, xx, yy, 6 + i % 4, 1, gece ? 'rgba(255,230,160,0.6)' : 'rgba(255,255,255,0.7)');
    }
    // martılar
    for (let i = 0; i < 3; i++) {
      const mx = ((t * (14 + i * 5) + i * 90) % (DW + 40)) - 20, my = 60 + i * 28 + Math.sin(t * 2 + i) * 6;
      const k = Math.sin(t * 9 + i) > 0 ? 1 : 0;
      R(x, mx - 3, my - k, 3, 1, '#f4f4f8'); R(x, mx + 1, my - k, 3, 1, '#f4f4f8'); R(x, mx, my, 1, 1, '#f4f4f8');
    }
    // bulutlar
    if (!gece) for (let i = 0; i < 3; i++) {
      const bx = ((t * 3 + i * 110) % (DW + 80)) - 50, by = 30 + i * 35;
      R(x, bx, by, 40, 8, 'rgba(255,255,255,0.85)'); R(x, bx + 8, by - 5, 22, 6, 'rgba(255,255,255,0.85)');
    }
  }
}

function neonYazi(x, s, px, py, renk, t, o = 4, cerceve = true) {
  const titre = (Math.sin(t * 23) > 0.93) ? 0.4 : 1;
  const w = pikselYaziGenislik(s, o);
  x.save();
  x.globalAlpha = titre;
  if (cerceve) { x.strokeStyle = renk; x.lineWidth = 1; x.strokeRect(px - 5.5, py - 5.5, w + 11, 5 * o + 11); }
  x.shadowColor = renk; x.shadowBlur = 8;
  pikselYazi(x, s, px, py, renk, o);
  pikselYazi(x, s, px, py, '#ffd0d8', o > 2 ? 1 : 1);
  x.restore();
  x.save(); x.globalAlpha = titre * 0.9; pikselYazi(x, s, px, py, renk, o); x.restore();
}

// ------------------------------------------------------------ masa, çay, telefon
export function masa(x, t, mekan, zilAktif, telefonEkran, telefonYok = false) {
  const { x: mx, ust } = MASA;
  R(x, mx - 4, ust + 6, 9, 66, '#2a2a30'); R(x, mx - 20, ust + 70, 41, 5, '#2a2a30');
  const ahsap = mekan === 'kafe' || mekan === 'park';
  R(x, mx - 48, ust, 97, 7, ahsap ? '#7a4a2c' : '#e8e8ee');
  R(x, mx - 48, ust, 97, 2, ahsap ? '#9a6a44' : '#ffffff');
  R(x, mx - 46, ust + 7, 93, 2, ahsap ? '#4a2a18' : '#9a9aa8');
  for (const cx of [mx - 28, mx + 26]) cay(x, cx, ust, t + cx);
  // simit tabağı
  R(x, mx - 7, ust - 2, 16, 2, '#f2f2f6');
  R(x, mx - 5, ust - 5, 12, 3, '#b8742e'); R(x, mx - 2, ust - 4, 6, 1, '#7a4a20');
  if (telefonYok) return;
  // telefon
  const tx = TELEFON.x + (zilAktif ? (Math.floor(t * 40) % 3) - 1 : 0);
  R(x, tx, TELEFON.y, 14, 4, '#0d0d12');
  R(x, tx + 1, TELEFON.y + 1, 12, 2, telefonEkran ? '#ff3a5c' : '#22232c');
  if (zilAktif && Math.floor(t * 8) % 2 === 0) {
    R(x, tx - 3, TELEFON.y - 3, 2, 1, '#fff'); R(x, tx + 15, TELEFON.y - 3, 2, 1, '#fff');
    R(x, tx - 5, TELEFON.y - 6, 2, 1, '#fff'); R(x, tx + 17, TELEFON.y - 6, 2, 1, '#fff');
  }
}

function cay(x, cx, ust, t) {
  R(x, cx - 6, ust - 2, 13, 2, '#f2f2f6');                 // tabak
  R(x, cx - 3, ust - 13, 7, 11, 'rgba(230,240,255,0.55)'); // ince belli bardak
  R(x, cx - 2, ust - 10, 5, 2, '#b8341c'); R(x, cx - 1, ust - 8, 3, 3, '#a02a14'); R(x, cx - 2, ust - 5, 5, 3, '#b8341c');
  R(x, cx - 3, ust - 13, 1, 11, 'rgba(255,255,255,0.8)');
  for (let i = 0; i < 3; i++) {
    const f = ((t * 0.6 + i / 3) % 1);
    x.fillStyle = `rgba(255,255,255,${0.45 * (1 - f)})`;
    x.fillRect(Math.round(cx + Math.sin(f * 6 + i * 2) * 2), Math.round(ust - 15 - f * 14), 1, 2);
  }
}

// ------------------------------------------------------------ sandalye/tabure
export function sandalye(x, cx, yuz, mekan) {
  const d = yuz; // +1 sağa bakıyor (A), -1 sola (B)
  const renk = mekan === 'dukkan_onu' ? '#c0392b' : '#6b3e28';
  const koyu = mekan === 'dukkan_onu' ? '#8a1a26' : '#4a2a18';
  if (mekan === 'dukkan_onu') {
    R(x, cx - 14, AYAK_Y - 46, 28, 5, renk);
    R(x, cx - 12, AYAK_Y - 41, 3, 41, koyu); R(x, cx + 9, AYAK_Y - 41, 3, 41, koyu);
    return;
  }
  const arka = cx - d * 16;
  R(x, arka - 2, AYAK_Y - 96, 5, 96, koyu);
  R(x, Math.min(arka, cx + d * 12) - 1, AYAK_Y - 46, Math.abs(cx + d * 12 - arka) + 3, 5, renk);
  R(x, cx + d * 12 - 1, AYAK_Y - 41, 3, 41, koyu);
  R(x, arka - 3, AYAK_Y - 96, 7, 4, renk);
}

// ------------------------------------------------------------ karakter
// gorunum: {ten, sac, sacStil, sacRenk, biyik, sakal, gozluk, kasket, gomlek, onluk, pantolon}
export function gorunumUret(kisi) {
  const r = rng((kisi.isim || 'x') + (kisi.meslek || ''));
  const kadin = kisi.cinsiyet === 'kadin';
  const yasli = kisi.yas === 'yasli';
  const tenler = ['#f2c290', '#e8b07c', '#d9996a', '#f5cfa4', '#c98a5c'];
  const saclar = yasli ? ['#bdbdc4', '#8e8e98', '#d8d8de'] : ['#2b1a10', '#3b2414', '#1a1210', '#6b3a1e', '#a0522d', '#d4a056'];
  const gomlekler = ['#27306b', '#2f8f5b', '#8e2a3a', '#3b6ea8', '#5a3d7a', '#d07a2a', '#2a2a32', '#f2f2f6'];
  const m = (kisi.meslek || '').toLocaleLowerCase('tr-TR');
  const onluk = /kebap|lokanta|aşçı|fırın|pide|döner|kasap|restoran|cafe|kafe|çiğ|tatlı|börek/.test(m);
  const sec = a => a[r() * a.length | 0];
  return {
    ten: sec(tenler),
    sacRenk: sec(saclar),
    sacStil: kadin ? sec(['uzun', 'topuz', 'uzun', 'kisa_k']) : (yasli ? sec(['kel', 'kisa', 'kel']) : sec(['kisa', 'dalgali', 'kivircik', 'yan'])),
    biyik: !kadin && r() < (yasli ? 0.85 : 0.55),
    sakal: !kadin && r() < 0.3,
    gozluk: r() < (yasli ? 0.5 : 0.25),
    kasket: !kadin && yasli && r() < 0.6,
    gomlek: sec(gomlekler),
    onluk: onluk ? (r() < 0.5 ? '#f4f4f8' : '#b8242f') : null,
    pantolon: sec(['#2c3140', '#3a2f28', '#24324a', '#444']),
    ruj: kadin,
  };
}

// durum: {agiz:0..2, goz:'acik'|'kapali'|'saskin'|'gulen', poz:'dinlen'|'jest'|'telefon'|'cay'|'saskin', bob}
export function karakterCiz(g, d) {
  const ayakta = !!d.ayakta;
  const [c, x] = tuval(64, ayakta ? 178 : 134);
  const k = (px, py, w, h, col) => R(x, px, py, w, h, col);
  const golge = 'rgba(0,0,0,0.18)';
  const faz = (d.adim || 0) * Math.PI * 2;
  const salla = ayakta && d.yuruyor !== false ? Math.sin(faz) : 0;
  const b = ayakta ? (Math.abs(Math.sin(faz)) > 0.6 ? 1 : 0) : (d.bob || 0);
  if (ayakta) {
    // yürüyen bacaklar
    const bacak = (kx, aci, renk) => {
      x.strokeStyle = renk; x.lineWidth = 9; x.lineCap = 'butt';
      const ax = kx + aci * 11;
      x.beginPath(); x.moveTo(kx, 84); x.lineTo(kx + aci * 5, 128); x.lineTo(ax, 170); x.stroke();
      k(ax - 5, 168, 15, 6, '#1d1a1c'); k(ax - 5, 172, 16, 2, '#0e0c0e');
    };
    bacak(26, -salla, shade(g.pantolon));
    bacak(26, salla, g.pantolon);
  } else {
    // bacaklar (oturuyor)
    k(16, 84, 32, 10, g.pantolon); k(40, 90, 9, 36, g.pantolon);
    k(39, 126, 14, 6, '#1d1a1c'); k(39, 130, 15, 2, '#0e0c0e');
  }
  // gövde
  const Y = 30 + b;
  k(12, Y + 6, 28, 52 - b, g.gomlek); k(14, Y + 3, 24, 4, g.gomlek);
  k(12, Y + 6, 4, 50 - b, golge);
  k(26, Y + 4, 6, 6, '#ffffff'); k(28, Y + 4, 2, 9, g.gomlek === '#f2f2f6' ? '#c9c9d4' : '#ffffffaa');
  if (g.onluk) { k(26, Y + 12, 14, 46 - b, g.onluk); k(28, Y + 4, 2, 9, g.onluk); k(26, Y + 26, 14, 2, 'rgba(0,0,0,0.12)'); }
  // boyun + kafa
  k(21, Y - 1, 9, 6, g.ten);
  const H = 3 + b;
  k(14, H, 25, 27, g.ten);
  k(38, H + 12, 2, 5, g.ten);                     // burun
  k(38, H + 16, 1, 1, 'rgba(0,0,0,0.25)');
  k(19, H + 11, 4, 6, g.ten); k(20, H + 12, 2, 4, 'rgba(0,0,0,0.15)'); // kulak
  // saç
  const s = g.sacRenk;
  switch (g.sacStil) {
    case 'kel': k(14, H + 4, 6, 8, s); k(15, H + 2, 5, 3, s); break;
    case 'kisa': k(14, H - 2, 25, 6, s); k(14, H + 3, 7, 9, s); break;
    case 'yan': k(14, H - 2, 26, 6, s); k(14, H + 3, 7, 9, s); k(30, H - 3, 9, 3, s); break;
    case 'dalgali': k(13, H - 3, 27, 7, s); k(13, H + 3, 8, 11, s); k(36, H, 4, 3, s); for (let i = 0; i < 6; i++) k(14 + i * 4, H - 4, 3, 2, s); break;
    case 'kivircik': for (let i = 0; i < 7; i++) for (let j = 0; j < 3; j++) k(12 + i * 4, H - 4 + j * 4, 4, 4, (i + j) % 2 ? s : shade(s)); k(12, H + 6, 8, 8, s); break;
    case 'uzun': k(12, H - 3, 28, 7, s); k(10, H + 2, 11, 36, s); k(35, H + 1, 5, 6, s); break;
    case 'topuz': k(13, H - 3, 27, 7, s); k(13, H + 3, 8, 10, s); k(6, H - 1, 9, 9, s); break;
    case 'kisa_k': k(12, H - 3, 28, 7, s); k(9, H + 2, 12, 28, s); k(32, H + 1, 8, 5, s); k(12, H + 26, 8, 6, s); break;
  }
  if (g.kasket) { k(12, H - 4, 28, 7, '#4a4a52'); k(36, H + 1, 8, 2, '#3a3a40'); }
  // göz + kaş
  const gz = d.goz || 'acik';
  const kasY = gz === 'saskin' ? H + 6 : H + 8;
  k(29, kasY, 7, 2, shade(s === '#d8d8de' ? '#888' : s));
  if (gz === 'kapali') k(30, H + 12, 4, 1, '#2a1a1a');
  else if (gz === 'gulen') { k(30, H + 11, 4, 1, '#2a1a1a'); k(29, H + 12, 1, 1, '#2a1a1a'); k(34, H + 12, 1, 1, '#2a1a1a'); }
  else if (gz === 'saskin') { k(29, H + 9, 6, 6, '#ffffff'); k(32, H + 10, 3, 4, '#1a1214'); }
  else { k(30, H + 10, 4, 4, '#ffffff'); k(32, H + 10, 2, 4, '#1a1214'); k(32, H + 10, 1, 1, '#ffffff'); }
  if (g.gozluk) { x.strokeStyle = '#1a1a22'; x.lineWidth = 1; x.strokeRect(28.5, H + 8.5, 8, 7); k(22, H + 10, 7, 1, '#1a1a22'); }
  // ağız
  const ay = H + 20;
  if (gz === 'gulen') { k(29, ay - 1, 8, 4, '#5a1a22'); k(30, ay - 1, 6, 1, '#fff'); }
  else if (d.agiz === 2 || gz === 'saskin') { k(31, ay - 1, 5, 4, '#5a1a22'); k(32, ay + 2, 3, 1, '#c0505a'); }
  else if (d.agiz === 1) { k(30, ay, 6, 2, '#5a1a22'); }
  else k(30, ay + 1, 6, 1, g.ruj ? '#c0405a' : '#8a4a40');
  if (g.biyik) k(29, ay - 2, 9, 2, shade(s));
  if (g.sakal) { k(18, H + 18, 21, 10, s); k(29, ay - 1, 8, 4, gz === 'gulen' || d.agiz ? '#5a1a22' : s); }
  // kollar / poz
  const poz = d.poz || 'dinlen';
  const kol = (pts) => { x.strokeStyle = g.gomlek; x.lineWidth = 6; x.lineCap = 'round'; x.beginPath(); x.moveTo(pts[0][0], pts[0][1]); pts.slice(1).forEach(p => x.lineTo(p[0], p[1])); x.stroke(); };
  const el = (px, py) => k(px - 3, py - 3, 6, 6, g.ten);
  if (poz === 'jest') { kol([[28, Y + 10], [34, Y + 28], [44, Y + 12]]); el(46, Y + 9); k(49, Y + 5, 2, 4, g.ten); }
  else if (poz === 'telefon') {
    kol([[28, Y + 10], [38, Y + 22], [54, Y + 10]]); el(55, Y + 8);
    k(52, Y - 10, 9, 16, '#0d0d12'); k(53, Y - 9, 7, 13, d.ekran || '#ff3a5c');
  }
  else if (poz === 'cay') { kol([[28, Y + 10], [36, Y + 26], [38, H + 22]]); el(38, H + 24); k(35, H + 13, 6, 9, 'rgba(230,240,255,0.7)'); k(36, H + 17, 4, 4, '#b8341c'); }
  else if (poz === 'saskin') { kol([[28, Y + 10], [32, Y + 26], [36, H + 26]]); el(37, H + 26); }
  else if (poz === 'direksiyon') { kol([[28, Y + 10], [36, Y + 24], [50, Y + 18]]); el(52, Y + 18); }
  else if (poz === 'cep') {
    kol([[28, Y + 10], [30, Y + 30], [36, Y + 46]]); el(37, Y + 48);
    k(34, Y + 40, 9, 14, '#0d0d12'); k(35, Y + 41, 7, 11, d.ekran || '#22232c');
  }
  else if (ayakta) { const sx = 30 - salla * 9; kol([[28, Y + 10], [29 - salla * 4, Y + 30], [sx, Y + 48]]); el(sx, Y + 50); }
  else { kol([[28, Y + 10], [33, Y + 24], [47, Y + 24]]); el(50, Y + 25); }
  return c;
}

function shade(hex) {
  const n = parseInt(hex.slice(1, 7), 16);
  const f = v => Math.max(0, Math.round(v * 0.72));
  return '#' + [n >> 16, (n >> 8) & 255, n & 255].map(f).map(v => v.toString(16).padStart(2, '0')).join('');
}

// "!" tepki işareti
export function unlem(x, px, py, t) {
  const z = Math.round(Math.abs(Math.sin(t * 10)) * 3);
  R(x, px, py - z, 5, 12, '#ffd23f'); R(x, px, py + 14 - z, 5, 5, '#ffd23f');
  R(x, px + 5, py - z, 1, 12, '#b8861a');
}

// ============================================================ mekan düzenleri
// x: gövde merkezi, taban: sprite alt çizgisi, yuz: 1 sağa / -1 sola bakar
export const DUZENLER = {
  otur: { A: { x: 70, taban: 422, yuz: 1 }, B: { x: 200, taban: 422, yuz: -1 }, tel: { x: 107, y: 342 }, masa: true,
    kam: { genis: { cx: 135, cy: 350, z: 1.45 }, orta: { cx: 135, cy: 330, z: 1.65 }, A: { cx: 90, cy: 330, z: 2.5 }, B: { cx: 180, cy: 330, z: 2.5 }, tel: { cx: 107, cy: 341, z: 5.2 } } },
  araba: { A: { x: 96, taban: 452, yuz: 1 }, B: { x: 178, taban: 452, yuz: 1, sofor: true }, tel: { x: 231, y: 340 },
    kam: { genis: { cx: 137, cy: 352, z: 1.45 }, orta: { cx: 140, cy: 338, z: 1.8 }, A: { cx: 112, cy: 336, z: 2.6 }, B: { cx: 196, cy: 336, z: 2.6 }, tel: { cx: 229, cy: 342, z: 4.6 } } },
  yuruyus: { A: { x: 164, taban: 452, yuz: 1, ayakta: true }, B: { x: 102, taban: 444, yuz: 1, ayakta: true }, tel: { x: 175, y: 345 },
    kam: { genis: { cx: 135, cy: 352, z: 1.45 }, orta: { cx: 134, cy: 336, z: 1.6 }, A: { cx: 176, cy: 312, z: 2.3 }, B: { cx: 116, cy: 306, z: 2.3 }, tel: { cx: 175, cy: 345, z: 4.4 } } },
};
DUZENLER.park = { ...DUZENLER.otur };
DUZENLER.pazar = { ...DUZENLER.yuruyus };
DUZENLER.durak = { A: { x: 88, taban: 446, yuz: 1, ayakta: true, sabit: true }, B: { x: 182, taban: 446, yuz: -1, ayakta: true, sabit: true }, tel: { x: 100, y: 345 },
  kam: { genis: { cx: 135, cy: 352, z: 1.45 }, orta: { cx: 135, cy: 330, z: 1.6 }, A: { cx: 106, cy: 312, z: 2.3 }, B: { cx: 164, cy: 312, z: 2.3 }, tel: { cx: 100, cy: 345, z: 4.4 } } };
DUZENLER.balik = { A: { x: 160, taban: 452, yuz: 1, ayakta: true, sabit: true }, B: { x: 98, taban: 446, yuz: 1, ayakta: true, sabit: true }, tel: { x: 172, y: 349 },
  kam: { genis: { cx: 140, cy: 352, z: 1.45 }, orta: { cx: 136, cy: 336, z: 1.6 }, A: { cx: 172, cy: 312, z: 2.3 }, B: { cx: 112, cy: 306, z: 2.3 }, tel: { cx: 172, cy: 349, z: 4.4 } } };
export function duzen(mekan) { return DUZENLER[mekan] || DUZENLER.otur; }
export function arabaSarsinti(t) { return Math.sin(t * 13) > 0.8 ? 1 : 0; }

const hs = i => { let h = (i * 2654435761) >>> 0; h ^= h >>> 15; h = Math.imul(h, 2246822519) >>> 0; return (h ^ (h >>> 13)) >>> 0; };

function gecekiTon(x, zaman) {
  const z = ZAMAN[zaman];
  if (z?.ton) { x.fillStyle = z.ton; x.fillRect(0, 0, DW, DH); }
}

function arabaDekor(x, zaman, t, tohum) {
  const gece = zaman === 'gece';
  // uzak siluet (yavaş)
  const o1 = t * 14;
  for (let i = Math.floor(o1 / 26) - 1; i < Math.floor(o1 / 26) + 12; i++) {
    const bx = i * 26 - o1, h = 50 + hs(i + tohum) % 90;
    R(x, bx, 300 - h, 25, h, gece ? '#151632' : '#7d8aa8');
    for (let yy = 300 - h + 5; yy < 296; yy += 9) for (let xx = bx + 4; xx < bx + 22; xx += 7)
      if (hs(i * 31 + yy + xx) % 3 === 0) R(x, xx, yy, 3, 4, gece ? '#ffd27a' : '#a9bdd6');
  }
  // orta katman binalar (orta hız)
  const o2 = t * 45;
  for (let i = Math.floor(o2 / 70) - 1; i < Math.floor(o2 / 70) + 6; i++) {
    const bx = i * 70 - o2, h = 70 + hs(i * 7 + tohum) % 60;
    const rn = ['#b0624a', '#c9a77c', '#8a6f8f', '#6d8a7a', '#c48a5a'][hs(i) % 5];
    R(x, bx, 380 - h, 66, h, gece ? '#262342' : rn);
    for (let yy = 380 - h + 8; yy < 370; yy += 16) for (let xx = bx + 6; xx < bx + 60; xx += 14)
      R(x, xx, yy, 8, 9, gece ? (hs(i + yy + xx) % 2 ? '#ffd27a' : '#1a1830') : '#dce8f2');
  }
  // kaldırım + yol
  R(x, 0, 380, DW, 16, gece ? '#55535c' : '#a8a39c');
  const o3 = t * 140;
  for (let xx = -(o3 % 24); xx < DW; xx += 24) R(x, xx, 380, 1, 16, gece ? '#45434c' : '#8f8a83');
  R(x, 396, 0, 0, 0, '#000');
  R(x, 0, 396, DW, 84, '#2b2d33');
  R(x, 0, 396, DW, 2, '#d8d2c8');
  for (let xx = -(t * 260 % 52); xx < DW; xx += 52) R(x, xx, 462, 26, 3, '#e8e2c8');
  // sokak lambaları
  for (let i = Math.floor(o3 / 150) - 1; i < Math.floor(o3 / 150) + 3; i++) {
    const lx = i * 150 - o3 + 40;
    R(x, lx, 250, 3, 132, '#2c2f3a'); R(x, lx - 2, 246, 16, 4, '#2c2f3a'); R(x, lx + 9, 250, 6, 3, gece ? '#fff3c4' : '#c9cfd8');
    if (gece) {
      const g = x.createRadialGradient(lx + 12, 252, 2, lx + 12, 300, 60);
      g.addColorStop(0, 'rgba(255,220,150,0.45)'); g.addColorStop(1, 'rgba(255,220,150,0)');
      x.globalCompositeOperation = 'lighter'; x.fillStyle = g; x.fillRect(lx - 50, 250, 124, 140); x.globalCompositeOperation = 'source-over';
    }
  }
  gecekiTon(x, zaman);
  // araç içi (karakterlerin arkası)
  const y = arabaSarsinti(t);
  x.fillStyle = 'rgba(18,18,26,0.78)';
  x.beginPath(); x.moveTo(62, 298 + y); x.lineTo(208, 298 + y); x.lineTo(238, 356 + y); x.lineTo(42, 356 + y); x.fill();
  for (const sx of [80, 162]) { R(x, sx, 318 + y, 9, 40, '#3a3a46'); R(x, sx - 1, 308 + y, 11, 10, '#4a4a58'); }
}

function yuruyusDekor(x, zaman, t, tohum) {
  const gece = zaman === 'gece';
  const o = t * 34;
  const tabelalar = ['FIRIN', 'ECZANE', 'MARKET', 'ÇİÇEK', 'KUAFÖR', 'BÜFE', 'KASAP', 'TERZİ', 'KAFE', 'OPTİK'];
  const W = 100;
  for (let i = Math.floor(o / W) - 1; i < Math.floor(o / W) + 4; i++) {
    const bx = i * W - o, hh = hs(i * 13 + tohum);
    const duvar = ['#e8dcc6', '#d9b99b', '#c9d6c8', '#e4c7c7', '#d6d0e4'][hh % 5];
    R(x, bx, 60, W, 334, duvar);
    for (let yy = 72; yy < 200; yy += 44) for (const wx of [bx + 14, bx + 58]) {
      R(x, wx, yy, 28, 30, gece ? (hs(i + yy + wx) % 2 ? '#ffd27a' : '#2a2840') : '#7fb0d0');
      R(x, wx + 13, yy, 2, 30, duvar); R(x, wx - 2, yy + 30, 32, 3, '#8a7a66');
    }
    const renk = ['#d32f3f', '#2e7d4f', '#1f5fa8', '#e08a1e', '#7b3fa0'][hs(i * 3) % 5];
    R(x, bx + 4, 214, W - 8, 24, '#2a2228');
    const ad = tabelalar[hs(i * 5 + tohum) % tabelalar.length];
    pikselYazi(x, ad, Math.round(bx + W / 2 - pikselYaziGenislik(ad, 2) / 2), 221, gece ? '#ff4d6d' : '#fff4d6', 2);
    for (let k = 0; k < 7; k++) R(x, bx + 2 + k * 14, 240, 14, 16, k % 2 ? '#f4f1ea' : renk);
    R(x, bx + 8, 262, 54, 112, '#2b3a46');
    for (let yy = 290; yy < 370; yy += 26) { R(x, bx + 10, yy, 50, 2, '#8a6a4a'); for (let px = bx + 12; px < bx + 58; px += 9) R(x, px, yy - 8, 6, 8, ['#e8b04a', '#c0392b', '#7fb069', '#f2efe8'][hs(px + yy) % 4]); }
    R(x, bx + 70, 268, 24, 106, '#5a3a24'); R(x, bx + 73, 272, 18, 60, '#2b3a46');
    R(x, bx, 374, W, 6, '#8a7a66');
  }
  // kaldırım
  R(x, 380, 0, 0, 0, '#000');
  R(x, 0, 380, DW, 100, '#a9a39b');
  for (let y = 380; y < 470; y += 12)
    for (let xx = -((o * 1.6) % 24) + ((y / 12) % 2) * 12; xx < DW; xx += 24) R(x, xx, y, 23, 11, ((Math.floor(xx) + y) % 3) ? '#b3ada4' : '#bcb6ad');
  R(x, 0, 470, DW, 10, '#d8d2c8');
  // ağaçlar
  for (let i = Math.floor(o * 1.6 / 210) - 1; i < Math.floor(o * 1.6 / 210) + 3; i++) {
    const tx = i * 210 - o * 1.6 + 30;
    R(x, tx, 300, 6, 90, '#5a3a24');
    x.fillStyle = gece ? '#1f4a2c' : '#3f9a4f'; x.beginPath(); x.arc(tx + 3, 286, 30, 0, 7); x.fill();
    x.fillStyle = gece ? '#2a5a36' : '#57c065'; x.beginPath(); x.arc(tx - 6, 278, 16, 0, 7); x.fill();
  }
  gecekiTon(x, zaman);
}

// karakterlerin ÖNÜNE çizilen katman (araba gövdesi vb.)
export function onPlan(x, mekan, t, durum) {
  if (mekan === 'balik') return oltalar(x, t);
  if (mekan !== 'araba') return;
  const y = arabaSarsinti(t);
  const govde = '#c62828', koyu = '#8e1b1b', acik = '#e85a5a';
  x.save(); x.translate(0, y);
  // cam
  x.fillStyle = 'rgba(170,210,255,0.10)';
  x.beginPath(); x.moveTo(62, 298); x.lineTo(208, 298); x.lineTo(238, 356); x.lineTo(42, 356); x.fill();
  x.fillStyle = 'rgba(255,255,255,0.10)';
  x.beginPath(); x.moveTo(150, 300); x.lineTo(166, 300); x.lineTo(140, 354); x.lineTo(124, 354); x.fill();
  // direksiyon + torpido + telefon tutucu
  R(x, 214, 338, 26, 18, '#1b1b22');
  x.strokeStyle = '#111'; x.lineWidth = 4; x.beginPath(); x.ellipse(214, 336, 4, 11, -0.35, 0, 7); x.stroke();
  R(x, 214, 344, 8, 3, '#111');
  if (!durum.telefonYok) {
    const tx = 226 + (durum.zil ? (Math.floor(t * 40) % 3) - 1 : 0);
    R(x, tx, 332, 11, 16, '#0d0d12');
    R(x, tx + 1, 333, 9, 13, durum.zil && Math.floor(t * 8) % 2 === 0 ? durum.ekran : '#22232c');
    R(x, tx + 3, 348, 5, 6, '#333');
  }
  // tavan + direkler
  R(x, 58, 293, 154, 6, govde); R(x, 60, 293, 150, 2, acik);
  x.fillStyle = govde;
  x.beginPath(); x.moveTo(204, 293); x.lineTo(212, 293); x.lineTo(246, 358); x.lineTo(236, 358); x.fill();
  x.beginPath(); x.moveTo(58, 293); x.lineTo(66, 293); x.lineTo(46, 358); x.lineTo(34, 358); x.fill();
  R(x, 136, 298, 6, 60, govde);
  // alt gövde
  R(x, 18, 356, 238, 46, govde);
  R(x, 18, 356, 238, 3, acik);
  R(x, 232, 346, 26, 14, govde); R(x, 16, 348, 26, 12, govde);
  R(x, 18, 396, 238, 6, koyu);
  R(x, 139, 360, 1, 36, koyu); R(x, 54, 360, 1, 36, koyu);
  R(x, 112, 366, 10, 3, '#f0d0d0'); R(x, 196, 366, 10, 3, '#f0d0d0');
  R(x, 252, 362, 6, 7, '#ffe9a0'); R(x, 14, 362, 5, 7, '#ff3344');
  // tekerlekler
  for (const wx of [66, 206]) {
    x.fillStyle = koyu; x.beginPath(); x.arc(wx, 402, 21, Math.PI, 0); x.fill();
    x.fillStyle = '#141416'; x.beginPath(); x.arc(wx, 402, 17, 0, 7); x.fill();
    x.fillStyle = '#9aa0a8'; x.beginPath(); x.arc(wx, 402, 8, 0, 7); x.fill();
    x.strokeStyle = '#5a6068'; x.lineWidth = 2;
    for (let k = 0; k < 3; k++) { const a = t * 18 + k * 2.09; x.beginPath(); x.moveTo(wx, 402); x.lineTo(wx + Math.cos(a) * 8, 402 + Math.sin(a) * 8); x.stroke(); }
  }
  x.restore();
  if (durum.gece) {
    const g = x.createLinearGradient(258, 0, 270, 0);
    g.addColorStop(0, 'rgba(255,240,180,0.5)'); g.addColorStop(1, 'rgba(255,240,180,0)');
    x.globalCompositeOperation = 'lighter'; x.fillStyle = g;
    x.beginPath(); x.moveTo(258, 362 + y); x.lineTo(270, 345); x.lineTo(270, 395); x.fill();
    x.globalCompositeOperation = 'source-over';
  }
}


// ============================================================ yeni mekanlar
function park(x, r, z, gece) {
  dikeyGecis(x, 0, 0, DW, 250, z.gok);
  // uzak ağaç sırası
  for (let i = 0; i < 14; i++) { x.fillStyle = gece ? '#14301f' : ['#2f7a3d', '#3a8a48', '#28703a'][i % 3]; x.beginPath(); x.arc(i * 21 + (r() * 8 | 0), 225 + (r() * 12 | 0), 18 + (r() * 10 | 0), 0, 7); x.fill(); }
  R(x, 0, 240, DW, 240, gece ? '#1d3a22' : '#5fae4f');
  for (let i = 0; i < 220; i++) R(x, r() * DW, 240 + r() * 240, 1, 2, gece ? '#284a2c' : (r() < 0.5 ? '#4f9a42' : '#74c25e'));
  // yol
  x.fillStyle = gece ? '#5a5048' : '#d8c8a2';
  x.beginPath(); x.moveTo(0, 360); x.quadraticCurveTo(140, 330, 270, 352); x.lineTo(270, 480); x.lineTo(0, 480); x.fill();
  // büyük ağaçlar
  for (const [tx, ty, rr] of [[30, 150, 46], [236, 140, 52]]) {
    R(x, tx - 4, ty, 9, 110, '#5a3a24');
    x.fillStyle = gece ? '#18402a' : '#3f9a4f'; x.beginPath(); x.arc(tx, ty, rr, 0, 7); x.fill();
    x.fillStyle = gece ? '#215234' : '#57c065'; x.beginPath(); x.arc(tx - rr * 0.3, ty - rr * 0.35, rr * 0.5, 0, 7); x.fill();
  }
  // fener + çiçekler
  R(x, 205, 230, 3, 120, '#2c2f3a'); R(x, 200, 222, 13, 9, '#2c2f3a'); R(x, 202, 224, 9, 5, gece ? '#fff1b0' : '#cfd6e0');
  for (let i = 0; i < 26; i++) { const fx = r() < 0.5 ? 4 + r() * 40 : 226 + r() * 40, fy = 250 + r() * 70; R(x, fx, fy + 2, 1, 3, '#2f7a3d'); R(x, fx - 1, fy, 3, 2, ['#ff6fa8', '#ffd23f', '#ffffff', '#c084fc'][i % 4]); }
  if (z.ton) { x.fillStyle = z.ton; x.fillRect(0, 0, DW, DH); }
}

function parkDekor(x, zaman, t) {
  // gagalayan güvercinler
  for (let i = 0; i < 4; i++) {
    const px = 20 + i * 62 + Math.sin(t * 0.7 + i) * 12, py = 440 + (i % 2) * 14;
    const gag = Math.sin(t * 6 + i * 2) > 0.5 ? 2 : 0;
    R(x, px, py - 6, 9, 6, '#8c8fa3'); R(x, px + 7, py - 9 + gag, 4, 4, '#9a9db2'); R(x, px + 11, py - 8 + gag, 2, 1, '#e0a040');
    R(x, px + 1, py, 1, 2, '#e07040'); R(x, px + 5, py, 1, 2, '#e07040'); R(x, px + 2, py - 5, 4, 1, '#6c6f83');
  }
  if (zaman !== 'gece') for (let i = 0; i < 2; i++) {
    const bx = ((t * 4 + i * 140) % (DW + 80)) - 50;
    R(x, bx, 40 + i * 40, 42, 8, 'rgba(255,255,255,0.85)'); R(x, bx + 9, 35 + i * 40, 22, 6, 'rgba(255,255,255,0.85)');
  }
}

function durak(x, r, z, gece) {
  dikeyGecis(x, 0, 0, DW, 120, z.gok);
  // karşı binalar
  let bx = 0;
  while (bx < DW) {
    const bw = 50 + (r() * 30 | 0), bh = 170 + (r() * 60 | 0);
    const renk = gece ? '#23203a' : ['#c98c6b', '#d9c7a7', '#8fa3b8', '#b98fa0'][r() * 4 | 0];
    R(x, bx, 300 - bh, bw, bh, renk);
    for (let yy = 300 - bh + 10; yy < 280; yy += 22) for (let xx = bx + 6; xx < bx + bw - 10; xx += 16)
      R(x, xx, yy, 9, 12, gece ? (r() < 0.5 ? '#ffd27a' : '#2a2840') : '#a9c7de');
    bx += bw + 2;
  }
  // yol + kaldırım
  R(x, 0, 290, DW, 64, '#33353c'); for (let xx = 0; xx < DW; xx += 40) R(x, xx, 320, 20, 2, '#e8e2c8');
  R(x, 0, 352, DW, 5, '#d8d2c8');
  for (let y = 357; y < DH; y += 11) for (let xx = ((y / 11) % 2) * 9; xx < DW; xx += 18) R(x, xx, y, 17, 10, ((xx + y) % 3) ? '#a9a39b' : '#b8b2a9');
  // durak
  R(x, 10, 236, 250, 10, '#1f2a3a'); R(x, 10, 246, 250, 3, '#ff3a5c');
  x.fillStyle = 'rgba(180,220,255,0.18)'; x.fillRect(16, 250, 238, 140);
  R(x, 14, 246, 4, 200, '#3a4658'); R(x, 252, 246, 4, 200, '#3a4658'); R(x, 132, 246, 3, 144, '#3a4658');
  R(x, 30, 396, 210, 5, '#5a6478'); R(x, 34, 401, 3, 20, '#3a4658'); R(x, 233, 401, 3, 20, '#3a4658');
  R(x, 150, 262, 90, 60, gece ? '#ffe9b0' : '#f4f4f8'); R(x, 154, 266, 82, 52, gece ? '#3a2a58' : '#2a6fd0');
  pikselYazi(x, 'OTOBÜS', 160, 272, '#ffffff', 2); pikselYazi(x, '500T  34', 160, 292, '#ffd23f', 2);
  if (z.ton) { x.fillStyle = z.ton; x.fillRect(0, 0, DW, DH); }
}

function durakDekor(x, zaman, t) {
  const gece = zaman === 'gece';
  // geçen arabalar
  for (let i = 0; i < 3; i++) {
    const hiz = 90 + i * 35, yon = i % 2 ? -1 : 1;
    const p = ((t * hiz + i * 160) % (DW + 120)) - 60;
    const ax = yon === 1 ? p : DW - p;
    const y = yon === 1 ? 328 : 300;
    const renk = ['#2a6fd0', '#d6453d', '#f2c14e'][i];
    R(x, ax, y + 4, 34, 11, renk); R(x, ax + 7, y - 3, 18, 8, renk); R(x, ax + 9, y - 2, 14, 6, '#9fd3f0');
    R(x, ax + 4, y + 14, 6, 5, '#111'); R(x, ax + 24, y + 14, 6, 5, '#111');
    if (gece) R(x, yon === 1 ? ax + 33 : ax, y + 7, 2, 3, '#fff3c4');
  }
  // arada bir geçen otobüs
  const op = (t % 11) / 11;
  if (op < 0.35) {
    const ox = DW + 20 - op / 0.35 * (DW + 180);
    R(x, ox, 286, 150, 38, '#e2e2ea'); R(x, ox, 312, 150, 4, '#ff3a5c');
    for (let k = 0; k < 6; k++) R(x, ox + 8 + k * 23, 292, 18, 14, gece ? '#ffe9a0' : '#7fb0d0');
    R(x, ox + 20, 322, 12, 8, '#111'); R(x, ox + 115, 322, 12, 8, '#111');
  }
}

function pazarDekor(x, zaman, t, tohum) {
  const gece = zaman === 'gece';
  const o = t * 30;
  R(x, 0, 120, DW, 260, gece ? '#2a2638' : '#cdb89a');
  for (let i = 0; i < 6; i++) R(x, i * 50 + 10, 150, 30, 40, gece ? '#3a3450' : '#b8a283');
  const urunler = [['#d6302b', 'DOMATES'], ['#2e9a3a', 'BİBER'], ['#f08a1e', 'PORTAKAL'], ['#6a2a8a', 'PATLICAN'], ['#e8d13a', 'LİMON'], ['#7cc242', 'ELMA'], ['#b5651d', 'PATATES'], ['#c0185a', 'ÇİLEK']];
  const W = 90;
  for (let i = Math.floor(o / W) - 1; i < Math.floor(o / W) + 4; i++) {
    const bx = i * W - o, h = hs(i * 17 + tohum);
    const tente = ['#d32f3f', '#1f5fa8', '#2e7d4f', '#e08a1e'][h % 4];
    for (let k = 0; k < 6; k++) R(x, bx + k * 15, 210, 15, 22, k % 2 ? '#f4f1ea' : tente);
    R(x, bx, 206, W - 4, 4, '#4a3a2a');
    R(x, bx + 4, 232, 3, 120, '#6a5a48'); R(x, bx + W - 10, 232, 3, 120, '#6a5a48');
    R(x, bx + 2, 320, W - 6, 8, '#8a6a4a'); R(x, bx + 4, 328, W - 10, 30, '#6e5238');
    for (let k = 0; k < 2; k++) {
      const [renk, ad] = urunler[(h + k * 3) % urunler.length];
      const ux = bx + 6 + k * 42;
      for (let yy = 0; yy < 3; yy++) for (let xx = 0; xx < 6 - yy; xx++) {
        x.fillStyle = renk; x.beginPath(); x.arc(ux + 4 + xx * 6 + yy * 3, 316 - yy * 5, 3.2, 0, 7); x.fill();
      }
      R(x, ux + 6, 290, 26, 12, '#fff8e0'); pikselYazi(x, (10 + (h + k * 7) % 60) + 'TL', ux + 8, 293, '#c0392b', 1);
    }
  }
  R(x, 0, 380, DW, 100, '#8a847c');
  for (let y = 380; y < 470; y += 12)
    for (let xx = -((o * 1.6) % 24) + ((y / 12) % 2) * 12; xx < DW; xx += 24) R(x, xx, y, 23, 11, ((Math.floor(xx) + y) % 3) ? '#948e86' : '#9d978f');
  R(x, 0, 470, DW, 10, '#bdb7ae');
  gecekiTon(x, zaman);
}

function balikBg(x, r, z, gece) {
  dikeyGecis(x, 0, 0, DW, 250, z.gok);
  const s = gece ? '#141836' : (z === ZAMAN.aksam ? '#4a2850' : '#6c84a8');
  for (let xx = 0; xx < DW; xx += 6) R(x, xx, 238 - (Math.sin(xx * 0.05) * 6 + 6), 6, 20, s);
  dikeyGecis(x, 0, 250, DW, 140, gece ? ['#0b1238', '#060a22'] : (z === ZAMAN.aksam ? ['#7a3a6a', '#2a2a5a'] : ['#2a8fd0', '#145a8f']));
  // iskele tahtaları
  R(x, 0, 388, DW, 92, '#7a5636');
  for (let y = 392; y < DH; y += 9) R(x, 0, y, DW, 1, '#5e4028');
  for (let xx = 10; xx < DW; xx += 48) R(x, xx, 388, 1, 92, '#5e4028');
  // korkuluk
  R(x, 0, 346, DW, 4, '#e8e8f0'); R(x, 0, 368, DW, 2, '#c8c8d8');
  for (let xx = 6; xx < DW; xx += 30) R(x, xx, 346, 3, 42, '#d8d8e4');
  // kova
  R(x, 214, 430, 18, 18, '#2a6fd0'); R(x, 212, 428, 22, 3, '#1f4fa0');
  if (z.ton) { x.fillStyle = z.ton; x.fillRect(0, 0, DW, DH); }
}

function balikDekor(x, zaman, t) {
  const gece = zaman === 'gece';
  for (let i = 0; i < 20; i++) {
    const yy = 256 + (i * 41) % 86, xx = ((i * 57 + t * (6 + i % 4)) % (DW + 30)) - 15;
    R(x, xx, yy, 5 + i % 4, 1, gece ? 'rgba(255,230,160,0.6)' : 'rgba(255,255,255,0.65)');
  }
  // uzakta geçen tekne
  const tx = ((t * 6) % (DW + 80)) - 60;
  R(x, tx, 250, 34, 6, '#f4f4f8'); R(x, tx + 8, 242, 14, 8, '#e8e8f0'); R(x, tx + 2, 256, 30, 2, '#2a3a5a');
  for (let i = 0; i < 2; i++) {
    const mx = ((t * (16 + i * 6) + i * 120) % (DW + 40)) - 20, my = 80 + i * 40 + Math.sin(t * 2 + i) * 5;
    const k = Math.sin(t * 9 + i) > 0 ? 1 : 0;
    R(x, mx - 3, my - k, 3, 1, '#f4f4f8'); R(x, mx + 1, my - k, 3, 1, '#f4f4f8'); R(x, mx, my, 1, 1, '#f4f4f8');
  }
}

function oltalar(x, t) {
  for (const [bx, uz] of [[36, 105], [208, 95]]) {
    x.strokeStyle = '#3a2a1a'; x.lineWidth = 2;
    x.beginPath(); x.moveTo(bx, 372); x.lineTo(bx + uz * 0.62, 372 - uz * 0.8); x.stroke();
    const ux = bx + uz * 0.62, uy = 372 - uz * 0.8;
    x.strokeStyle = 'rgba(255,255,255,0.7)'; x.lineWidth = 1;
    x.beginPath(); x.moveTo(ux, uy); x.lineTo(ux + 14, 330 + Math.sin(t * 2 + bx) * 2); x.stroke();
    R(x, ux + 12, 328 + Math.sin(t * 2 + bx) * 2, 4, 4, '#ff3a3a');
    R(x, bx - 2, 368, 6, 8, '#2a2a30');
  }
}
