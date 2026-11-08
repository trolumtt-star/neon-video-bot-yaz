// Zaman çizelgesi + kare çizimi (1080x1920 dikey)
import {
  DW, DH, KOLTUK, AYAK_Y, TELEFON, rng, tuval, arkaPlan, dekor, masa, sandalye, gorunumUret, karakterCiz, unlem,
} from './piksel.js';
import { SR, zarf, efekt, telefonFiltre } from './ses.js';

export const OW = 1080, OH = 1920, FPS = 30;
export const PALETLER = {
  kirmizi: ['#ff1744', '#ff3d6e', '#ff8a5c'],
  mor: ['#22d3ee', '#8b5cf6', '#ec4899'],
  yesil: ['#00e5a0', '#22d3ee', '#7c4dff'],
};
const F = (w, px) => `${w} ${px}px Inter, "Segoe UI", Roboto, sans-serif`;
const kis = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const yum = v => 1 - (1 - kis(v)) ** 3;
const zip = v => { v = kis(v); const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * (v - 1) ** 3 + c1 * (v - 1) ** 2; };

// ------------------------------------------------------------ plan
export function planla(s, sesler, ayar) {
  const pal = PALETLER[ayar.palet] || PALETLER.kirmizi;
  const konus = [], cekim = [], sfx = [];
  let t = 0;
  const sureTahmin = m => 0.9 + m.length * 0.058;
  let dI = 0, cI = 0;
  const dSes = () => sesler?.diyalog?.[dI++] || null;
  const cSes = () => sesler?.cagri?.[cI++] || null;
  const ekle = (kim, metin, sig, t0, ekstra = {}) => {
    const sure = sig ? sig.length / SR : sureTahmin(metin);
    const k = { kim, metin, t0, t1: t0 + sure, sig, zarf: sig ? zarf(sig, FPS) : null, ...ekstra };
    konus.push(k);
    if (!sig) sfx.push({ t: t0, tur: 'pop' });
    return k;
  };
  const kamera = { genis: { cx: 135, cy: 350, z: 1.45 }, orta: { cx: 135, cy: 330, z: 1.65 },
    A: { cx: KOLTUK.A + 20, cy: 330, z: 2.5 }, B: { cx: KOLTUK.B - 20, cy: 330, z: 2.5 },
    tel: { cx: TELEFON.x + 7, cy: TELEFON.y, z: 5.2 } };

  // 1) giriş
  cekim.push({ tip: 'mekan', t0: 0, t1: 1.1, kam: kamera.genis, it: 1.04 });
  t = 1.0;
  s.giris.forEach((r, i) => {
    const k = ekle(r.kim, r.metin, dSes(), t + 0.15, { poz: i % 2 ? 'jest' : 'dinlen' });
    const kam = i === 0 ? kamera.orta : kamera[r.kim];
    cekim.push({ tip: 'mekan', t0: t, t1: k.t1 + 0.3, kam, it: 1.05 });
    t = k.t1 + 0.3;
  });
  // 2) zil
  const zilT = t;
  sfx.push({ t: zilT, tur: 'zil' }, { t: zilT, tur: 'whoosh' });
  cekim.push({ tip: 'mekan', t0: t, t1: t + 1.5, kam: kamera.tel, it: 1.08, glitch: true });
  t += 1.5;
  const zk = ekle('A', s.zil_tepki.metin, dSes(), t + 0.1, { poz: 'cay' });
  cekim.push({ tip: 'mekan', t0: t, t1: zk.t1 + 0.35, kam: kamera.A, it: 1.04 });
  t = zk.t1 + 0.35;
  sfx.push({ t: zilT + 2.7, tur: 'zil' });
  const zilBitis = t;
  // 3) çağrı ekranı
  const cagriT0 = t;
  sfx.push({ t: t, tur: 'whoosh' });
  let ct = t + 1.0;
  const cagriMesaj = s.cagri.map(c => {
    const k = ekle(c.kim, c.metin, cSes(), ct, { telefon: true });
    ct = k.t1 + 0.3;
    return k;
  });
  const sonucT = ct + 0.1;
  sfx.push({ t: sonucT, tur: 'bildirim' });
  cekim.push({ tip: 'cagri', t0: cagriT0, t1: sonucT + 1.8, mesajlar: cagriMesaj, sonucT });
  t = sonucT + 1.8;
  // 4) şaşkınlık
  sfx.push({ t, tur: 'saskin' });
  const sk = ekle('B', s.saskinlik.metin, dSes(), t + 0.4, { goz: 'saskin', poz: 'saskin' });
  cekim.push({ tip: 'mekan', t0: t, t1: sk.t1 + 0.3, kam: kamera.B, it: 1.0, yumruk: true, unlem: true });
  t = sk.t1 + 0.3;
  // 5) anlatım
  const anl = s.anlatim;
  let panelBas = 0;
  if (anl.length > 1) {
    const k = ekle(anl[0].kim, anl[0].metin, dSes(), t + 0.1, { poz: anl[0].kim === 'A' ? 'telefon' : 'jest' });
    cekim.push({ tip: 'mekan', t0: t, t1: k.t1 + 0.3, kam: kamera.orta, it: 1.05, telefonElde: true });
    t = k.t1 + 0.3; panelBas = 1;
  } else {
    cekim.push({ tip: 'mekan', t0: t, t1: t + 0.8, kam: kamera.A, it: 1.05, telefonElde: true, pozA: 'telefon' });
    t += 0.8;
  }
  const panelT0 = t;
  sfx.push({ t, tur: 'whoosh' });
  let pt = t + 0.7;
  const panelAlt = [];
  for (let i = panelBas; i < anl.length; i++) {
    const k = ekle(anl[i].kim, anl[i].metin, dSes(), pt, { altyazi: true, poz: 'telefon' });
    panelAlt.push(k); pt = k.t1 + 0.25;
  }
  (s.panel_kartlari || []).forEach((_, i) => sfx.push({ t: panelT0 + 1.6 + i * 0.6, tur: 'bildirim' }));
  cekim.push({ tip: 'panel', t0: panelT0, t1: Math.max(pt + 0.3, panelT0 + 3.6) });
  t = Math.max(pt + 0.3, panelT0 + 3.6);
  // 6) kapanış
  const kk = ekle(s.kapanis.kim, s.kapanis.metin, dSes(), t + 0.1, { poz: 'jest' });
  cekim.push({ tip: 'mekan', t0: t, t1: kk.t1 + 1.0, kam: kamera.genis, it: 1.06, gulmeT: kk.t1 + 0.05, telefonElde: true });
  t = kk.t1 + 1.0;
  // 7) son kart
  const sloganSig = sesler?.slogan || null;
  const sonSure = Math.max(4.2, (sloganSig ? sloganSig.length / SR : 0) + 1.6);
  sfx.push({ t, tur: 'bas' }, { t, tur: 'whoosh' });
  cekim.push({ tip: 'son', t0: t, t1: t + sonSure });
  const sesOlay = [];
  if (sloganSig) sesOlay.push({ t: t + 0.55, sig: telefonFiltre(sloganSig, false), kazanc: 1.1, konusma: true });
  t += sonSure;

  for (const k of konus) if (k.sig) sesOlay.push({ t: k.t0, sig: k.telefon ? telefonFiltre(k.sig, k.kim === 'musteri') : k.sig, kazanc: k.telefon ? 1.15 : 1.0, konusma: true });
  for (const e of sfx) sesOlay.push({ t: e.t, sig: efekt(e.tur), kazanc: e.tur === 'zil' ? 0.9 : 1 });

  return { s, ayar, pal, sure: t, konus, cekim, sesOlay, zilT, zilBitis, gorunum: { A: gorunumUret(s.A), B: gorunumUret(s.B) } };
}

// ------------------------------------------------------------ çizici
export function cizici(plan) {
  const { s, ayar, pal } = plan;
  const [out, o] = tuval(OW, OH);
  const [dunya, d] = tuval(DW, DH);
  const arka = arkaPlan(s.mekan, s.zaman, s.A.isim + s.B.isim, s.A.isletme_adi);
  const tohum = [...(s.A.isim || 'x')].reduce((a, c) => a + c.charCodeAt(0), 0);
  const vinyet = vinyetYap();
  const tarama = taramaYap();
  let bulanik = null, bulanikT = -1;
  const balonOnbellek = new Map();

  const aktifKonusma = (t, f = () => true) => plan.konus.find(k => t >= k.t0 && t < k.t1 + 0.05 && f(k));
  const sonKonusma = (t, f) => { let r = null; for (const k of plan.konus) if (k.t0 <= t && f(k)) r = k; return r; };

  function dunyaCiz(t, c) {
    d.drawImage(arka, 0, 0);
    dekor(d, s.mekan, s.zaman, t, tohum);
    sandalye(d, KOLTUK.A, 1, s.mekan);
    sandalye(d, KOLTUK.B, -1, s.mekan);
    const konusan = aktifKonusma(t, k => !k.telefon && !k.altyazi);
    for (const kim of ['A', 'B']) {
      const g = plan.gorunum[kim];
      const ben = konusan?.kim === kim;
      const sid = kim === 'A' ? 0 : 1.7;
      let agiz = 0;
      if (ben) {
        if (konusan.zarf) { const v = konusan.zarf[Math.floor((t - konusan.t0) * FPS)] || 0; agiz = v > 0.45 ? 2 : v > 0.14 ? 1 : 0; }
        else agiz = Math.floor(t * 9) % 3 === 0 ? 0 : 1 + (Math.floor(t * 7) % 2);
      }
      const kirp = ((t + sid * 1.3) % 3.7) < 0.12;
      let goz = kirp ? 'kapali' : 'acik', poz = 'dinlen';
      if (ben) { poz = konusan.poz || 'dinlen'; if (konusan.goz) goz = konusan.goz; }
      if (c.unlem && kim === 'B') { goz = 'saskin'; poz = 'saskin'; }
      if (c.telefonElde && kim === 'A') poz = 'telefon';
      if (c.gulmeT && t > c.gulmeT) { goz = 'gulen'; agiz = Math.floor(t * 8) % 2 + 1; }
      const bob = (Math.sin(t * (ben ? 7 : 2.2) + sid) > (ben ? 0.2 : 0.75)) ? 1 : 0;
      const spr = karakterCiz(g, { agiz, goz, poz, bob, ekran: pal[0] });
      const ust = AYAK_Y - 134;
      if (kim === 'A') d.drawImage(spr, KOLTUK.A - 26, ust);
      else { d.save(); d.translate(KOLTUK.B + 26, 0); d.scale(-1, 1); d.drawImage(spr, 0, ust); d.restore(); }
    }
    const zilAktif = t >= plan.zilT && t < plan.zilBitis;
    const telefonYok = !!c.telefonElde;
    masa(d, t, s.mekan, zilAktif, zilAktif, telefonYok);
    if (c.unlem && t - c.t0 > 0.3) unlem(d, KOLTUK.B - 34, 276, t);
  }

  function kameraHesap(c, t) {
    const p = (t - c.t0) / Math.max(0.1, c.t1 - c.t0);
    let z = c.kam.z * (1 + ((c.it || 1) - 1) * yum(p));
    if (c.yumruk) z *= 1 + 0.3 * (1 - yum((t - c.t0) / 0.3));
    const vw = DW / z, vh = DH / z;
    let x0 = kis(c.kam.cx - vw / 2, 0, DW - vw), y0 = kis(c.kam.cy - vh / 2, 0, DH - vh);
    if (c.yumruk && t - c.t0 < 0.5) { x0 += Math.sin(t * 90) * 1.2; y0 += Math.cos(t * 77) * 1.2; }
    if (c.glitch && t - c.t0 < 0.9) { x0 += Math.sin(t * 120) * 0.6; }
    return { x0, y0, vw, vh, k: OW / vw };
  }

  function mekanKare(c, t) {
    dunyaCiz(t, c);
    const K = kameraHesap(c, t);
    o.imageSmoothingEnabled = false;
    o.drawImage(dunya, K.x0, K.y0, K.vw, K.vh, 0, 0, OW, OH);
    o.drawImage(vinyet, 0, 0);
    // konuşma balonları
    const ekran = (wx, wy) => [(wx - K.x0) * K.k, (wy - K.y0) * K.k];
    for (const kim of ['A', 'B']) {
      const k = sonKonusma(t, q => q.kim === kim && !q.telefon && !q.altyazi && t < q.t1 + 0.35 && q.t0 >= c.t0 - 0.01);
      if (!k) continue;
      const hx = kim === 'A' ? KOLTUK.A + 6 : KOLTUK.B - 6;
      const [sx, sy] = ekran(hx, AYAK_Y - 134);
      balon(o, k, t, sx, sy, kim, K);
    }
    if (c.glitch) glitch(t - c.t0);
    // kanca yazısı
    if (t < 3.4) kanca(t);
  }

  function balon(x, k, t, sx, sy, kim) {
    const kisi = s[kim];
    const ilerleme = kis((t - k.t0) / Math.max(0.4, (k.t1 - k.t0) * 0.8));
    const metin = k.metin;
    const n = Math.max(1, Math.ceil(metin.length * ilerleme));
    let b = balonOnbellek.get(k);
    if (!b) {
      x.font = F(800, 50);
      const satirlar = sar(x, metin, 760);
      const w = Math.max(...satirlar.map(l => x.measureText(l).width)) + 76;
      const h = satirlar.length * 62 + 52;
      b = { satirlar, w, h };
      balonOnbellek.set(k, b);
    }
    const olc = 0.7 + 0.3 * zip((t - k.t0) / 0.16);
    const cikis = t > k.t1 ? kis(1 - (t - k.t1) / 0.3) : 1;
    let bx = kis(sx - b.w / 2, 36, OW - 36 - b.w), by = Math.max(250, sy - 90 - b.h);
    x.save();
    x.globalAlpha = cikis;
    x.translate(bx + b.w / 2, by + b.h);
    x.scale(olc, olc);
    x.translate(-(bx + b.w / 2), -(by + b.h));
    // gölge + gövde + kuyruk
    const kx = kis(sx, bx + 50, bx + b.w - 50);
    x.fillStyle = 'rgba(0,0,0,0.35)';
    yuvarlak(x, bx + 10, by + 12, b.w, b.h, 30); x.fill();
    x.fillStyle = '#ffffff'; x.strokeStyle = '#15111c'; x.lineWidth = 7;
    x.beginPath();
    yuvarlakYol(x, bx, by, b.w, b.h, 30);
    x.moveTo(kx - 26, by + b.h - 2); x.lineTo(kx + (kim === 'A' ? -10 : 10), by + b.h + 46); x.lineTo(kx + 26, by + b.h - 2);
    x.fill(); x.stroke();
    x.fillStyle = '#ffffff'; x.fillRect(kx - 22, by + b.h - 8, 44, 10);
    // isim etiketi
    x.font = F(800, 30);
    const et = `${kisi.isim} · ${kisi.meslek}`;
    const ew = x.measureText(et).width + 40;
    x.fillStyle = kim === 'A' ? pal[0] : '#15111c';
    yuvarlak(x, bx + 22, by - 26, ew, 50, 25); x.fill();
    x.fillStyle = '#fff'; x.fillText(et, bx + 42, by + 10);
    // metin (daktilo)
    x.font = F(800, 50); x.fillStyle = '#15111c';
    let kalan = n;
    b.satirlar.forEach((l, i) => {
      const parca = l.slice(0, Math.max(0, kalan));
      kalan -= l.length + 1;
      x.fillText(parca, bx + 38, by + 72 + i * 62);
    });
    x.restore();
  }

  function kanca(t) {
    const a = kis((t - 0.15) / 0.25) * kis((3.4 - t) / 0.35);
    if (a <= 0) return;
    const g = o.createLinearGradient(0, 0, 0, 520);
    g.addColorStop(0, `rgba(0,0,0,${0.75 * a})`); g.addColorStop(1, 'rgba(0,0,0,0)');
    o.fillStyle = g; o.fillRect(0, 0, OW, 520);
    o.save();
    o.globalAlpha = a;
    const olc = 0.85 + 0.15 * zip((t - 0.15) / 0.3);
    o.translate(OW / 2, 240); o.scale(olc, olc);
    o.font = F(800, 84);
    const satirlar = sar(o, s.kanca, 920);
    const vurgu = (s.kanca_vurgu || '').toLocaleLowerCase('tr-TR');
    satirlar.forEach((l, i) => {
      const y = (i - (satirlar.length - 1) / 2) * 100;
      const kelimeler = l.split(' ');
      const tw = o.measureText(l).width;
      let x = -tw / 2;
      for (const w of kelimeler) {
        const temiz = w.toLocaleLowerCase('tr-TR').replace(/[^\p{L}\p{N}]/gu, '');
        const vur = vurgu && temiz && vurgu.includes(temiz);
        o.lineWidth = 12; o.strokeStyle = '#000'; o.lineJoin = 'round';
        o.strokeText(w, x, y);
        if (vur) { o.shadowColor = pal[0]; o.shadowBlur = 30; o.fillStyle = pal[0]; }
        else { o.shadowBlur = 0; o.fillStyle = '#fff'; }
        o.fillText(w, x, y);
        o.shadowBlur = 0;
        x += o.measureText(w + ' ').width;
      }
    });
    o.restore();
  }

  function glitch(tr) {
    if (tr > 1.4) return;
    const r = rng(Math.floor(tr * 30) + 99);
    const g = kis(1 - tr / 1.4);
    const [kopya, kx] = glitchTuval();
    kx.drawImage(out, 0, 0);
    for (let i = 0; i < 7; i++) {
      const y = r() * OH, h = 20 + r() * 120, dx = (r() - 0.5) * 120 * g;
      o.drawImage(kopya, 0, y, OW, h, dx, y, OW, h);
    }
    o.globalCompositeOperation = 'screen';
    o.fillStyle = pal[0] + '33'; o.fillRect(0, 0, OW, OH);
    o.globalCompositeOperation = 'source-over';
    o.globalAlpha = 0.5 * g; o.drawImage(tarama, 0, 0); o.globalAlpha = 1;
    o.save();
    o.translate(OW / 2 + (r() - 0.5) * 20, 520 + (r() - 0.5) * 16);
    o.rotate(-0.12);
    const olc = 0.6 + 0.4 * zip(tr / 0.25);
    o.scale(olc, olc);
    o.font = F(800, 150); o.textAlign = 'center';
    o.lineWidth = 22; o.strokeStyle = '#0a0006'; o.lineJoin = 'round';
    o.strokeText('DRIIING!', 0, 0);
    o.shadowColor = pal[0]; o.shadowBlur = 50;
    o.fillStyle = '#fff'; o.fillText('DRIIING!', 0, 0);
    o.fillStyle = pal[0]; o.globalAlpha = 0.85; o.fillText('DRIIING!', 6, 6);
    o.restore();
  }

  // ---------------------------------------------------------- telefon arayüzü
  const TEL = { x: 120, w: 840, h: 1660, y: 130, r: 100 };
  function telefonCerceve(t, giris, icerik) {
    if (!bulanik || bulanikT !== giris) {
      const c = plan.cekim.filter(q => q.tip === 'mekan' && q.t1 <= giris + 0.01).pop() || plan.cekim[0];
      mekanKareSessiz(c, giris - 0.05);
      const [b, bx] = tuval(OW, OH);
      bx.filter = 'blur(22px) brightness(0.32) saturate(1.3)';
      bx.drawImage(out, 0, 0);
      bulanik = b; bulanikT = giris;
    }
    o.drawImage(bulanik, 0, 0);
    // neon ışık lekeleri
    const g = o.createRadialGradient(OW / 2, OH * 0.45, 50, OW / 2, OH * 0.45, 900);
    g.addColorStop(0, pal[0] + '40'); g.addColorStop(1, 'rgba(0,0,0,0)');
    o.fillStyle = g; o.fillRect(0, 0, OW, OH);
    const p = yum((t - giris) / 0.5);
    const y = TEL.y + (1 - p) * 1500;
    o.save();
    o.shadowColor = pal[0]; o.shadowBlur = 60;
    o.fillStyle = '#050407';
    yuvarlak(o, TEL.x, y, TEL.w, TEL.h, TEL.r); o.fill();
    o.shadowBlur = 0;
    o.lineWidth = 4; o.strokeStyle = pal[0] + 'cc';
    yuvarlak(o, TEL.x, y, TEL.w, TEL.h, TEL.r); o.stroke();
    const ix = TEL.x + 20, iy = y + 20, iw = TEL.w - 40, ih = TEL.h - 40;
    o.beginPath(); yuvarlakYol(o, ix, iy, iw, ih, TEL.r - 18); o.clip();
    const eg = o.createLinearGradient(0, iy, 0, iy + ih);
    eg.addColorStop(0, '#120c18'); eg.addColorStop(1, '#050408');
    o.fillStyle = eg; o.fillRect(ix, iy, iw, ih);
    icerik(ix, iy, iw, ih);
    // çentik + durum çubuğu
    o.fillStyle = '#000'; yuvarlak(o, OW / 2 - 110, iy + 22, 220, 58, 29); o.fill();
    o.fillStyle = '#fff'; o.font = F(700, 34);
    o.fillText({ sabah: '09:12', ogle: '13:24', aksam: '19:47', gece: '23:41' }[s.zaman] || '14:32', ix + 60, iy + 64);
    o.fillRect(ix + iw - 120, iy + 42, 54, 26); o.fillStyle = '#000'; o.fillRect(ix + iw - 116, iy + 46, 14, 18);
    o.restore();
  }

  function cagriKare(c, t) {
    telefonCerceve(t, c.t0, (ix, iy, iw, ih) => {
      const cx = ix + iw / 2;
      const gecen = Math.max(0, t - c.t0 - 0.6);
      // başlık
      o.textAlign = 'center';
      o.fillStyle = '#8f8a9e'; o.font = F(600, 34); o.fillText('Gelen arama', cx, iy + 170);
      o.fillStyle = '#fff'; o.font = F(800, 58); o.fillText('Müşteri', cx, iy + 240);
      o.fillStyle = '#8f8a9e'; o.font = F(500, 32); o.fillText(`+90 5${(tohum % 50) + 30} ••• •• ${10 + tohum % 89}`, cx, iy + 290);
      // rozet
      const nab = 0.6 + 0.4 * Math.sin(t * 6);
      o.font = F(800, 34);
      const et = `${ayar.marka} cevaplıyor`;
      const ew = o.measureText(et).width + 90;
      const gr = o.createLinearGradient(cx - ew / 2, 0, cx + ew / 2, 0);
      gr.addColorStop(0, pal[0]); gr.addColorStop(1, pal[2]);
      o.shadowColor = pal[0]; o.shadowBlur = 30 * nab;
      o.fillStyle = gr; yuvarlak(o, cx - ew / 2, iy + 320, ew, 66, 33); o.fill();
      o.shadowBlur = 0;
      o.fillStyle = '#fff'; o.beginPath(); o.arc(cx - ew / 2 + 38, iy + 353, 9 + 3 * nab, 0, 7); o.fill();
      o.fillText(et, cx + 18, iy + 366);
      o.fillStyle = '#c9c4d6'; o.font = F(600, 30);
      o.fillText(`${String(Math.floor(gecen / 60)).padStart(2, '0')}:${String(Math.floor(gecen % 60)).padStart(2, '0')}`, cx, iy + 430);
      // dalga formu
      const aktif = aktifKonusma(t, k => k.telefon);
      let v = 0.05;
      if (aktif) v = aktif.zarf ? (aktif.zarf[Math.floor((t - aktif.t0) * FPS)] || 0) : 0.4 + 0.4 * Math.abs(Math.sin(t * 13));
      for (let i = 0; i < 31; i++) {
        const h = 10 + 110 * v * (0.4 + 0.6 * Math.abs(Math.sin(i * 1.7 + t * 9)));
        o.fillStyle = aktif?.kim === 'ai' ? pal[i % 3] : '#d6d2e4';
        yuvarlak(o, cx - 31 * 12 + i * 24, iy + 530 - h / 2, 12, h, 6); o.fill();
      }
      o.textAlign = 'left';
      // sohbet balonları
      const alanY = iy + 620, alanH = ih - 620 - 150;
      const gorunen = c.mesajlar.filter(m => t >= m.t0);
      o.font = F(600, 38);
      const kutular = gorunen.map(m => {
        const sat = sar(o, m.metin, 520);
        return { m, sat, h: sat.length * 50 + 74, w: Math.max(...sat.map(l => o.measureText(l).width)) + 56 };
      });
      let toplam = kutular.reduce((a, b) => a + b.h + 22, 0);
      const sonucH = t > c.sonucT ? 300 : 0;
      toplam += sonucH;
      const kaydir = Math.max(0, toplam - alanH);
      o.save();
      o.beginPath(); o.rect(ix, alanY, iw, alanH); o.clip();
      let yy = alanY - kaydir;
      for (const k of kutular) {
        const p = yum((t - k.m.t0) / 0.3);
        const ai = k.m.kim === 'ai';
        const bx = ai ? ix + iw - 40 - k.w : ix + 40;
        const by = yy + (1 - p) * 40;
        o.globalAlpha = p;
        o.font = F(700, 26); o.fillStyle = ai ? pal[1] : '#8f8a9e';
        o.textAlign = ai ? 'right' : 'left';
        o.fillText(ai ? ayar.marka : 'Müşteri', ai ? bx + k.w : bx, by + 22);
        o.textAlign = 'left';
        if (ai) { const gg = o.createLinearGradient(bx, 0, bx + k.w, 0); gg.addColorStop(0, pal[0]); gg.addColorStop(1, pal[2]); o.fillStyle = gg; }
        else o.fillStyle = '#25212f';
        yuvarlak(o, bx, by + 34, k.w, k.h - 34, 30); o.fill();
        const ilerleme = kis((t - k.m.t0) / Math.max(0.4, (k.m.t1 - k.m.t0) * 0.85));
        let kalan = Math.ceil(k.m.metin.length * ilerleme);
        o.font = F(600, 38); o.fillStyle = '#fff';
        k.sat.forEach((l, i) => { o.fillText(l.slice(0, Math.max(0, kalan)), bx + 28, by + 34 + 52 + i * 50); kalan -= l.length + 1; });
        o.globalAlpha = 1;
        yy += k.h + 22;
      }
      if (sonucH) sonucKart(ix + 40, yy + 10, iw - 80, t - c.sonucT);
      o.restore();
      // alt butonlar
      const by = iy + ih - 120;
      o.fillStyle = '#ff3045'; o.beginPath(); o.arc(cx, by, 50, 0, 7); o.fill();
      o.strokeStyle = '#fff'; o.lineWidth = 9; o.lineCap = 'round';
      o.beginPath(); o.arc(cx, by + 16, 30, Math.PI * 1.15, Math.PI * 1.85); o.stroke();
      for (const dx of [-230, 230]) { o.fillStyle = '#25212f'; o.beginPath(); o.arc(cx + dx, by, 44, 0, 7); o.fill(); }
      o.fillStyle = '#d6d2e4';
      o.fillRect(cx - 245, by - 14, 12, 28); o.beginPath(); o.moveTo(cx - 233, by - 14); o.lineTo(cx - 215, by - 26); o.lineTo(cx - 215, by + 26); o.lineTo(cx - 233, by + 14); o.fill();
      for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) { o.beginPath(); o.arc(cx + 212 + i * 18, by - 18 + j * 18, 5, 0, 7); o.fill(); }
    });
  }

  function sonucKart(x, y, w, tr) {
    const p = zip(tr / 0.35);
    o.save();
    o.globalAlpha = kis(tr / 0.2);
    o.translate(x + w / 2, y + 140); o.scale(p, p); o.translate(-(x + w / 2), -(y + 140));
    o.shadowColor = '#22e39a'; o.shadowBlur = 40;
    o.fillStyle = '#0f1a16'; yuvarlak(o, x, y, w, 270, 34); o.fill();
    o.shadowBlur = 0; o.strokeStyle = '#22e39a'; o.lineWidth = 4; yuvarlak(o, x, y, w, 270, 34); o.stroke();
    o.fillStyle = '#22e39a'; o.beginPath(); o.arc(x + 80, y + 80, 42, 0, 7); o.fill();
    o.strokeStyle = '#06130e'; o.lineWidth = 10; o.lineCap = 'round';
    o.beginPath(); o.moveTo(x + 60, y + 82); o.lineTo(x + 76, y + 98); o.lineTo(x + 102, y + 64); o.stroke();
    o.fillStyle = '#22e39a'; o.font = F(800, 32); o.fillText((s.sonuc.tur || 'Yeni kayıt').toLocaleUpperCase('tr-TR'), x + 146, y + 70);
    o.fillStyle = '#fff'; o.font = F(800, 40);
    o.fillText(kirp(o, s.sonuc.baslik || '', w - 170), x + 146, y + 120);
    o.fillStyle = '#9fb7ad'; o.font = F(500, 32);
    o.fillText(kirp(o, s.sonuc.detay || '', w - 60), x + 40, y + 190);
    o.fillStyle = '#22e39a'; o.font = F(700, 28); o.fillText('✓ Panele eklendi', x + 40, y + 240);
    o.restore();
  }

  function panelKare(c, t) {
    const giris = plan.cekim.find(q => q.tip === 'cagri')?.t0 ?? c.t0;
    telefonCerceve(t, giris, (ix, iy, iw, ih) => {
      const tr = t - c.t0;
      const px = ix + 50, pw = iw - 100;
      o.fillStyle = '#fff'; o.font = F(800, 52); o.fillText(`${ayar.marka}`, px, iy + 190);
      o.fillStyle = '#8f8a9e'; o.font = F(600, 32); o.fillText('Panel · Bugün', px, iy + 238);
      const nab = 0.5 + 0.5 * Math.sin(t * 6);
      o.fillStyle = '#ff3045'; yuvarlak(o, ix + iw - 210, iy + 150, 160, 56, 28); o.fill();
      o.fillStyle = '#fff'; o.beginPath(); o.arc(ix + iw - 180, iy + 178, 8 + 3 * nab, 0, 7); o.fill();
      o.font = F(800, 30); o.fillText('CANLI', ix + iw - 160, iy + 189);
      // istatistikler
      const ist = s.istatistik;
      const tw = (pw - 40) / 3;
      const kutular = [
        ['Bugün arama', ist.arama, '', '#fff'],
        ['Kaçan arama', 0, '', '#22e39a'],
        [ist.kazanc_etiketi, ist.kazanc, ist.birim, pal[0]],
      ];
      kutular.forEach(([ad, deger, birim, renk], i) => {
        const p = yum((tr - 0.2 - i * 0.12) / 0.4);
        const x = px + i * (tw + 20), y = iy + 290 + (1 - p) * 30;
        o.globalAlpha = p;
        o.fillStyle = '#1a1622'; yuvarlak(o, x, y, tw, 190, 28); o.fill();
        o.strokeStyle = '#2c2638'; o.lineWidth = 2; yuvarlak(o, x, y, tw, 190, 28); o.stroke();
        o.fillStyle = '#8f8a9e'; o.font = F(600, 25); o.fillText(kirp(o, ad, tw - 40), x + 22, y + 48);
        const v = Math.round(deger * yum((tr - 0.3) / 1.4));
        o.fillStyle = renk; o.font = F(800, birim ? 40 : 64);
        o.fillText(kirp(o, birim + v.toLocaleString('tr-TR'), tw - 30), x + 22, y + 140);
        o.globalAlpha = 1;
      });
      // grafik
      const gy = iy + 540;
      o.fillStyle = '#8f8a9e'; o.font = F(600, 28); o.fillText('Saatlik aramalar', px, gy);
      for (let i = 0; i < 14; i++) {
        const h = (40 + ((i * 37 + tohum) % 90) + (i > 8 ? 30 : 0)) * yum((tr - 0.4 - i * 0.03) / 0.5);
        const gg = o.createLinearGradient(0, gy + 180 - h, 0, gy + 180);
        gg.addColorStop(0, pal[i % 3]); gg.addColorStop(1, pal[0] + '22');
        o.fillStyle = gg; yuvarlak(o, px + i * (pw / 14), gy + 180 - h, pw / 14 - 12, h, 8); o.fill();
      }
      // kayıtlar
      o.fillStyle = '#8f8a9e'; o.font = F(600, 28); o.fillText('Son kayıtlar', px, gy + 250);
      const kayit = [{ ...s.sonuc, yeni: true }, ...(s.panel_kartlari || [])].slice(0, 4);
      kayit.forEach((k, i) => {
        const t0 = 0.7 + i * 0.6;
        const p = yum((tr - t0) / 0.4);
        if (p <= 0) return;
        const x = px + (1 - p) * 300, y = gy + 280 + i * 150;
        o.globalAlpha = p;
        o.fillStyle = k.yeni ? '#1d1420' : '#16131d';
        yuvarlak(o, x, y, pw, 130, 26); o.fill();
        if (k.yeni) { o.strokeStyle = pal[0]; o.lineWidth = 3; o.shadowColor = pal[0]; o.shadowBlur = 20 * (0.5 + 0.5 * Math.sin(t * 5)); yuvarlak(o, x, y, pw, 130, 26); o.stroke(); o.shadowBlur = 0; }
        const etRenk = /randevu/i.test(k.tur) ? '#f5a524' : /rezerv/i.test(k.tur) ? '#ec4899' : /teklif|bilgi/i.test(k.tur) ? '#3b82f6' : '#14b8a6';
        o.font = F(800, 24);
        const ew = o.measureText(k.tur || '').width + 30;
        o.fillStyle = etRenk + '33'; yuvarlak(o, x + 24, y + 20, ew, 38, 19); o.fill();
        o.fillStyle = etRenk; o.fillText(k.tur || '', x + 39, y + 47);
        if (k.yeni) { o.fillStyle = pal[0]; yuvarlak(o, x + pw - 120, y + 20, 96, 38, 19); o.fill(); o.fillStyle = '#fff'; o.fillText('YENİ', x + pw - 102, y + 47); }
        o.fillStyle = '#fff'; o.font = F(700, 34); o.fillText(kirp(o, k.baslik || '', pw - 50), x + 24, y + 98);
        o.globalAlpha = 1;
      });
    });
    // altyazı
    const k = aktifKonusma(t, q => q.altyazi);
    if (k) altyazi(k, t);
  }

  function altyazi(k, t) {
    const kisi = s[k.kim];
    o.font = F(800, 54);
    const sat = sar(o, k.metin, 900);
    const h = sat.length * 68 + 110;
    const y = OH - h - 60;
    const p = yum((t - k.t0) / 0.25);
    o.save();
    o.globalAlpha = p;
    o.fillStyle = 'rgba(5,4,8,0.88)'; yuvarlak(o, 50, y, OW - 100, h, 36); o.fill();
    o.strokeStyle = pal[0]; o.lineWidth = 3; yuvarlak(o, 50, y, OW - 100, h, 36); o.stroke();
    o.font = F(800, 32); o.fillStyle = pal[0]; o.fillText(`${kisi.isim} · ${kisi.meslek}`, 90, y + 56);
    o.font = F(800, 54); o.fillStyle = '#fff';
    const il = kis((t - k.t0) / Math.max(0.4, (k.t1 - k.t0) * 0.85));
    let kalan = Math.ceil(k.metin.length * il);
    sat.forEach((l, i) => { o.fillText(l.slice(0, Math.max(0, kalan)), 90, y + 122 + i * 68); kalan -= l.length + 1; });
    o.restore();
  }

  // ---------------------------------------------------------- son kart
  function sonKare(c, t) {
    const tr = t - c.t0;
    o.fillStyle = '#030204'; o.fillRect(0, 0, OW, OH);
    const ufuk = 1240;
    // güneş
    const gg = o.createLinearGradient(0, ufuk - 420, 0, ufuk);
    gg.addColorStop(0, pal[2]); gg.addColorStop(1, pal[0]);
    o.save(); o.beginPath(); o.arc(OW / 2, ufuk, 360, Math.PI, 0); o.clip();
    o.globalAlpha = 0.85 * kis(tr / 0.6); o.fillStyle = gg; o.fillRect(0, ufuk - 380, OW, 380);
    o.fillStyle = '#030204';
    for (let i = 0; i < 7; i++) o.fillRect(0, ufuk - 120 + i * 18 - i * i * 1.5, OW, 4 + i * 2);
    o.restore();
    // ızgara
    o.save();
    o.strokeStyle = pal[0]; o.shadowColor = pal[0]; o.shadowBlur = 16; o.lineWidth = 3;
    o.globalAlpha = kis(tr / 0.5);
    o.beginPath(); o.moveTo(0, ufuk); o.lineTo(OW, ufuk); o.stroke();
    for (let i = -12; i <= 12; i++) { o.beginPath(); o.moveTo(OW / 2 + i * 30, ufuk); o.lineTo(OW / 2 + i * 260, OH); o.stroke(); }
    for (let i = 0; i < 12; i++) {
      const f = ((i + tr * 1.2) % 12) / 12;
      const y = ufuk + (OH - ufuk) * f * f;
      o.globalAlpha = kis(tr / 0.5) * f;
      o.beginPath(); o.moveTo(0, y); o.lineTo(OW, y); o.stroke();
    }
    o.restore();
    // logo
    const cy = 470, p = zip(tr / 0.5);
    o.save();
    o.translate(OW / 2, cy); o.scale(p, p);
    o.shadowColor = pal[0]; o.shadowBlur = 50;
    o.fillStyle = pal[0]; o.beginPath(); o.arc(-70, 0, 34, 0, 7); o.fill();
    for (let i = 0; i < 3; i++) {
      const nab = 0.45 + 0.55 * Math.max(0, Math.sin(tr * 4 - i * 0.9));
      o.globalAlpha = nab; o.strokeStyle = pal[i]; o.lineWidth = 20; o.lineCap = 'round';
      o.beginPath(); o.arc(-70, 0, 75 + i * 48, -0.85, 0.85); o.stroke();
    }
    o.restore();
    // marka
    const pm = yum((tr - 0.25) / 0.45);
    o.save(); o.globalAlpha = pm; o.textAlign = 'center';
    o.font = F(800, 130);
    o.shadowColor = pal[0]; o.shadowBlur = 40; o.fillStyle = '#fff';
    o.fillText(ayar.marka, OW / 2, 760 + (1 - pm) * 40);
    o.shadowBlur = 0;
    o.font = F(700, 46); o.fillStyle = '#e8e4f0';
    sar(o, ayar.slogan || '', 940).forEach((l, i) => o.fillText(l, OW / 2, 850 + i * 58));
    o.restore();
    // CTA
    const pb = (tr - 1.0) / 0.35;
    if (pb > 0) {
      o.save(); o.textAlign = 'center';
      o.font = F(800, 50);
      const bw = o.measureText(ayar.cta || 'Hemen dene').width + 140, bh = 120, by = 1010;
      const nab = 0.6 + 0.4 * Math.sin(tr * 4);
      o.translate(OW / 2, by + bh / 2); o.scale(zip(pb), zip(pb)); o.translate(-OW / 2, -(by + bh / 2));
      const bg = o.createLinearGradient(OW / 2 - bw / 2, 0, OW / 2 + bw / 2, 0);
      bg.addColorStop(0, pal[0]); bg.addColorStop(1, pal[2]);
      o.shadowColor = pal[0]; o.shadowBlur = 50 * nab;
      o.fillStyle = bg; yuvarlak(o, OW / 2 - bw / 2, by, bw, bh, bh / 2); o.fill();
      o.shadowBlur = 0; o.fillStyle = '#fff'; o.fillText(ayar.cta || 'Hemen dene', OW / 2, by + 77);
      o.restore();
    }
    o.save(); o.textAlign = 'center';
    o.globalAlpha = yum((tr - 1.4) / 0.5);
    if (ayar.iletisim) { o.font = F(700, 44); o.fillStyle = '#fff'; o.fillText(ayar.iletisim, OW / 2, 1420); }
    o.font = F(600, 30); o.fillStyle = '#b8b2c8';
    o.fillText((ayar.sektorler || '').split(',').map(x => x.trim()).filter(Boolean).slice(0, 6).join(' · '), OW / 2, 1840);
    o.restore();
  }

  function mekanKareSessiz(c, t) {
    dunyaCiz(t, c);
    const K = kameraHesap(c, t);
    o.imageSmoothingEnabled = false;
    o.drawImage(dunya, K.x0, K.y0, K.vw, K.vh, 0, 0, OW, OH);
  }

  function kare(t) {
    const c = plan.cekim.find(q => t >= q.t0 && t < q.t1) || plan.cekim[plan.cekim.length - 1];
    o.save();
    o.fillStyle = '#000'; o.fillRect(0, 0, OW, OH);
    if (c.tip === 'mekan') mekanKare(c, t);
    else if (c.tip === 'cagri') cagriKare(c, t);
    else if (c.tip === 'panel') panelKare(c, t);
    else sonKare(c, t);
    o.restore();
    // geçiş flaşı
    const gecis = t - c.t0;
    if (c.tip !== 'mekan' && gecis < 0.12) { o.fillStyle = `rgba(255,255,255,${0.35 * (1 - gecis / 0.12)})`; o.fillRect(0, 0, OW, OH); }
    if (t < 0.3) { o.fillStyle = `rgba(0,0,0,${1 - t / 0.3})`; o.fillRect(0, 0, OW, OH); }
    if (plan.sure - t < 0.5) { o.fillStyle = `rgba(0,0,0,${1 - (plan.sure - t) / 0.5})`; o.fillRect(0, 0, OW, OH); }
    return out;
  }
  return { kare, tuval: out };
}

// ------------------------------------------------------------ yardımcılar
let _gt;
function glitchTuval() { if (!_gt) _gt = tuval(OW, OH); return _gt; }

function vinyetYap() {
  const [c, x] = tuval(OW, OH);
  const g = x.createRadialGradient(OW / 2, OH / 2, OH * 0.3, OW / 2, OH / 2, OH * 0.75);
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.45)');
  x.fillStyle = g; x.fillRect(0, 0, OW, OH);
  return c;
}
function taramaYap() {
  const [c, x] = tuval(OW, OH);
  x.fillStyle = 'rgba(0,0,0,0.5)';
  for (let y = 0; y < OH; y += 6) x.fillRect(0, y, OW, 2);
  return c;
}
export function sar(x, metin, max) {
  const kel = String(metin).split(/\s+/); const sat = []; let l = '';
  for (const w of kel) { const d = l ? l + ' ' + w : w; if (x.measureText(d).width > max && l) { sat.push(l); l = w; } else l = d; }
  if (l) sat.push(l);
  return sat;
}
function kirp(x, s, max) {
  if (x.measureText(s).width <= max) return s;
  while (s.length > 1 && x.measureText(s + '…').width > max) s = s.slice(0, -1);
  return s + '…';
}
function yuvarlakYol(x, px, py, w, h, r) {
  x.moveTo(px + r, py); x.arcTo(px + w, py, px + w, py + h, r); x.arcTo(px + w, py + h, px, py + h, r);
  x.arcTo(px, py + h, px, py, r); x.arcTo(px, py, px + w, py, r); x.closePath();
}
function yuvarlak(x, px, py, w, h, r) { x.beginPath(); yuvarlakYol(x, px, py, w, h, r); }
