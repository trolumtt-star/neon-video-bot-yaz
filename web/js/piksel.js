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
  R(x, mx - 48, ust, 97, 7, mekan === 'kafe' ? '#7a4a2c' : '#e8e8ee');
  R(x, mx - 48, ust, 97, 2, mekan === 'kafe' ? '#9a6a44' : '#ffffff');
  R(x, mx - 46, ust + 7, 93, 2, mekan === 'kafe' ? '#4a2a18' : '#9a9aa8');
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
    sacStil: kadin ? sec(['uzun', 'topuz', 'kisa_k', 'dalgali']) : (yasli ? sec(['kel', 'kisa', 'kel']) : sec(['kisa', 'dalgali', 'kivircik', 'yan'])),
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
  const [c, x] = tuval(64, 134);
  const k = (px, py, w, h, col) => R(x, px, py, w, h, col);
  const golge = 'rgba(0,0,0,0.18)';
  const b = d.bob || 0;
  // bacaklar (oturuyor)
  k(16, 84, 32, 10, g.pantolon); k(40, 90, 9, 36, g.pantolon);
  k(39, 126, 14, 6, '#1d1a1c'); k(39, 130, 15, 2, '#0e0c0e');
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
    case 'kisa_k': k(12, H - 3, 28, 7, s); k(11, H + 2, 10, 20, s); k(34, H + 2, 6, 4, s); break;
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
