// Ses: Gemini PCM çözme, replik bölme, efekt/müzik sentezi, telefon filtresi, miksaj.
export const SR = 48000;

export function pcmCoz(b64, kaynakHz = 24000) {
  const bin = atob(b64);
  const n = bin.length >> 1;
  const src = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    let v = bin.charCodeAt(2 * i) | (bin.charCodeAt(2 * i + 1) << 8);
    if (v >= 32768) v -= 65536;
    src[i] = v / 32768;
  }
  return yenidenOrnekle(src, kaynakHz, SR);
}

export function yenidenOrnekle(src, from, to) {
  if (from === to) return src;
  const oran = from / to, n = Math.floor(src.length / oran);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const p = i * oran, k = Math.floor(p), f = p - k;
    out[i] = (src[k] || 0) * (1 - f) + (src[k + 1] || 0) * f;
  }
  return out;
}

// ---------------------------------------------------------------- replik bölme
// Tek parça diyalog sesini, metin uzunluklarına ve sessizliklere bakarak N repliğe böler.
export function bolumle(sig, metinler) {
  const N = metinler.length;
  const F = Math.round(SR * 0.01);
  const nf = Math.floor(sig.length / F);
  const rms = new Float32Array(nf);
  for (let i = 0; i < nf; i++) { let s = 0; for (let j = 0; j < F; j++) { const v = sig[i * F + j]; s += v * v; } rms[i] = Math.sqrt(s / F); }
  const sirali = Array.from(rms).sort((a, b) => a - b);
  const esik = Math.max(0.008, sirali[Math.floor(nf * 0.9)] * 0.07);
  let bas = 0, son = nf - 1;
  while (bas < nf && rms[bas] < esik) bas++;
  while (son > bas && rms[son] < esik) son--;
  if (N === 1) return [kes(sig, bas * F, (son + 1) * F)];
  // sessiz aralıklar
  const aday = [];
  let i = bas;
  while (i <= son) {
    if (rms[i] < esik) { let j = i; while (j <= son && rms[j] < esik) j++; if (j - i >= 9) aday.push({ orta: (i + j) / 2, uz: j - i }); i = j; }
    else i++;
  }
  const uz = metinler.map(m => Math.max(4, m.length));
  const top = uz.reduce((a, b) => a + b, 0);
  const beklenen = []; let c = 0;
  for (let k = 0; k < N - 1; k++) { c += uz[k]; beklenen.push(bas + (son - bas) * c / top); }
  let sinirlar;
  if (aday.length >= N - 1) {
    const G = aday.length, S = (son - bas) * 0.18 + 1, INF = 1e18;
    const maliyet = (k, j) => ((aday[j].orta - beklenen[k]) / S) ** 2 - Math.min(aday[j].uz, 60) / 25;
    const dp = Array.from({ length: N - 1 }, () => new Float64Array(G).fill(INF));
    const geri = Array.from({ length: N - 1 }, () => new Int32Array(G).fill(-1));
    for (let j = 0; j < G; j++) dp[0][j] = maliyet(0, j);
    for (let k = 1; k < N - 1; k++) {
      let enIyi = INF, enJ = -1;
      for (let j = 0; j < G; j++) {
        if (j > 0 && dp[k - 1][j - 1] < enIyi) { enIyi = dp[k - 1][j - 1]; enJ = j - 1; }
        if (enJ >= 0) { dp[k][j] = enIyi + maliyet(k, j); geri[k][j] = enJ; }
      }
    }
    let j = 0; for (let q = 1; q < G; q++) if (dp[N - 2][q] < dp[N - 2][j]) j = q;
    sinirlar = new Array(N - 1);
    for (let k = N - 2; k >= 0; k--) { sinirlar[k] = aday[j].orta; j = geri[k][j]; }
  } else {
    sinirlar = beklenen;
  }
  const parcalar = [];
  let onceki = bas;
  for (let k = 0; k < N; k++) {
    let s0 = Math.floor(onceki), s1 = Math.floor(k < N - 1 ? sinirlar[k] : son + 1);
    while (s0 < s1 && rms[s0] < esik) s0++;
    while (s1 > s0 + 1 && rms[s1 - 1] < esik) s1--;
    parcalar.push(kes(sig, Math.max(0, s0 - 3) * F, Math.min(nf, s1 + 4) * F));
    onceki = k < N - 1 ? sinirlar[k] : son;
  }
  return parcalar;
}

function kes(sig, a, b) {
  const p = sig.slice(a, Math.max(a + 1, b));
  const f = Math.min(240, p.length >> 2);
  for (let i = 0; i < f; i++) { p[i] *= i / f; p[p.length - 1 - i] *= i / f; }
  return p;
}

// Ağız animasyonu için kare başına ses şiddeti (30 fps)
export function zarf(sig, fps = 30) {
  const F = Math.round(SR / fps), n = Math.ceil(sig.length / F);
  const out = new Float32Array(n);
  let mx = 1e-6;
  for (let i = 0; i < n; i++) {
    let s = 0; const e = Math.min(sig.length, (i + 1) * F);
    for (let j = i * F; j < e; j++) s += sig[j] * sig[j];
    out[i] = Math.sqrt(s / F); mx = Math.max(mx, out[i]);
  }
  for (let i = 0; i < n; i++) out[i] /= mx;
  return out;
}

// ---------------------------------------------------------------- filtreler
function biquad(sig, tip, f0, Q) {
  const w = 2 * Math.PI * f0 / SR, al = Math.sin(w) / (2 * Q), cs = Math.cos(w);
  let b0, b1, b2, a0, a1, a2;
  if (tip === 'hp') { b0 = (1 + cs) / 2; b1 = -(1 + cs); b2 = (1 + cs) / 2; }
  else { b0 = (1 - cs) / 2; b1 = 1 - cs; b2 = (1 - cs) / 2; }
  a0 = 1 + al; a1 = -2 * cs; a2 = 1 - al;
  const out = new Float32Array(sig.length);
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  for (let i = 0; i < sig.length; i++) {
    const x0 = sig[i];
    const y0 = (b0 * x0 + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2) / a0;
    out[i] = y0; x2 = x1; x1 = x0; y2 = y1; y1 = y0;
  }
  return out;
}

export function telefonFiltre(sig, sert = true) {
  let o = biquad(sig, 'hp', sert ? 380 : 220, 0.8);
  o = biquad(o, 'lp', sert ? 3200 : 6500, 0.8);
  if (sert) for (let i = 0; i < o.length; i++) o[i] = Math.tanh(o[i] * 2.2) * 0.75;
  return o;
}

// ---------------------------------------------------------------- efektler
const T = s => { const n = Math.floor(SR * s); return [new Float32Array(n), n]; };
let _gurultuTohum = 12345;
const gurultu = () => { _gurultuTohum = (_gurultuTohum * 1103515245 + 12345) & 0x7fffffff; return _gurultuTohum / 0x3fffffff - 1; };

export function efekt(tur) {
  if (tur === 'pop') {
    const [o, n] = T(0.12);
    for (let i = 0; i < n; i++) { const t = i / SR; o[i] = 0.35 * Math.sin(2 * Math.PI * (500 + 1400 * t / 0.12) * t) * Math.exp(-t * 38); }
    return o;
  }
  if (tur === 'zil') { // modern zil melodisi + titreşim
    const notalar = [76, 79, 84, 79, 76, 79, 84, 88];
    const [o, n] = T(2.6);
    notalar.forEach((m, k) => {
      const f = 440 * 2 ** ((m - 69) / 12), b = Math.floor((k * 0.15 + (k >= 4 ? 0.5 : 0)) * SR);
      for (let i = 0; i < SR * 0.3 && b + i < n; i++) {
        const t = i / SR;
        o[b + i] += 0.22 * (Math.sin(2 * Math.PI * f * t) + 0.35 * Math.sin(2 * Math.PI * f * 2 * t) + 0.15 * Math.sin(2 * Math.PI * f * 3.01 * t)) * Math.exp(-t * 9);
      }
    });
    for (let i = 0; i < n; i++) { const t = i / SR; if (Math.floor(t * 4) % 2 === 0) o[i] += 0.07 * Math.sin(2 * Math.PI * 150 * t) * Math.sin(2 * Math.PI * 23 * t); }
    return o;
  }
  if (tur === 'whoosh') {
    const [o, n] = T(0.5); let lp = 0;
    for (let i = 0; i < n; i++) { const t = i / SR; lp += (gurultu() - lp) * (0.02 + 0.25 * t); o[i] = 1.6 * lp * Math.sin(Math.PI * t / 0.5) ** 2; }
    return o;
  }
  if (tur === 'bildirim') {
    const [o, n] = T(0.6);
    for (let i = 0; i < n; i++) {
      const t = i / SR;
      o[i] = 0.2 * Math.sin(2 * Math.PI * 1047 * t) * Math.exp(-t * 8) + (t > 0.1 ? 0.2 * Math.sin(2 * Math.PI * 1568 * t) * Math.exp(-(t - 0.1) * 7) : 0);
    }
    return o;
  }
  if (tur === 'saskin') { // "dun-dun!" vurgusu
    const [o, n] = T(0.9);
    for (let i = 0; i < n; i++) {
      const t = i / SR, t2 = t - 0.22;
      o[i] = 0.5 * Math.sin(2 * Math.PI * (90 - 30 * t) * t) * Math.exp(-t * 6) * (t < 0.22 ? 1 : 0)
        + (t2 > 0 ? 0.5 * Math.sin(2 * Math.PI * (70 - 20 * t2) * t2) * Math.exp(-t2 * 4) : 0)
        + 0.12 * Math.sin(2 * Math.PI * 880 * t) * Math.exp(-t * 12);
    }
    return o;
  }
  if (tur === 'tik') {
    const [o, n] = T(0.03);
    for (let i = 0; i < n; i++) { const t = i / SR; o[i] = 0.12 * Math.sin(2 * Math.PI * 1800 * t) * Math.exp(-t * 200); }
    return o;
  }
  if (tur === 'bas') { // kapanış bas vuruşu
    const [o, n] = T(1.4);
    for (let i = 0; i < n; i++) { const t = i / SR; o[i] = 0.7 * Math.sin(2 * Math.PI * (40 + 120 * Math.exp(-t * 18)) * t) * Math.exp(-t * 2.5); }
    return o;
  }
  return new Float32Array(1);
}

// ---------------------------------------------------------------- müzik (telifsiz, kodla)
export function muzik(sure, tohum = 1, enerjik = false) {
  let s = tohum * 9301 + 49297; const r = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
  const bpm = enerjik ? 112 : [88, 94, 100][Math.floor(r() * 3)];
  const v = 60 / bpm, n = Math.floor(SR * sure), o = new Float32Array(n);
  const ilerlemeler = [
    [[57, 60, 64, 67], [53, 57, 60, 64], [48, 52, 55, 59], [55, 59, 62, 65]],
    [[50, 53, 57, 60], [55, 58, 62, 65], [48, 52, 55, 58], [53, 57, 60, 64]],
    [[52, 55, 59, 62], [48, 52, 55, 59], [55, 59, 62, 66], [50, 54, 57, 60]],
  ];
  const ak = ilerlemeler[Math.floor(r() * 3)];
  const hz = m => 440 * 2 ** ((m - 69) / 12);
  const olcu = v * 4;
  for (let b = 0; b * olcu < sure; b++) {
    const a = ak[b % 4], bas = Math.floor(b * olcu * SR), L = Math.floor(olcu * SR);
    for (let i = 0; i < L && bas + i < n; i++) {
      const t = i / SR;
      let p = 0;
      for (const m of a) p += Math.sin(2 * Math.PI * hz(m) * t) + 0.4 * Math.sin(2 * Math.PI * hz(m) * 1.004 * t);
      const env = Math.min(1, t * 3) * Math.min(1, (olcu - t) * 5);
      const bassT = t % v;
      o[bas + i] += 0.028 * p * env + 0.13 * Math.sin(2 * Math.PI * hz(a[0] - 12) * t) * Math.exp(-bassT * 2.5);
    }
    // arpej
    for (let k = 0; k < 8; k++) {
      const m = a[k % 4] + 12, st = bas + Math.floor(k * v / 2 * SR);
      for (let i = 0; i < SR * 0.25 && st + i < n; i++) { const t = i / SR; o[st + i] += 0.045 * Math.sin(2 * Math.PI * hz(m) * t) * Math.exp(-t * 10); }
    }
  }
  for (let j = 0; j * v < sure; j++) {
    const b = Math.floor(j * v * SR);
    if (j % 2 === 0 || r() < 0.35) for (let i = 0; i < SR * 0.25 && b + i < n; i++) { const t = i / SR; o[b + i] += 0.5 * Math.sin(2 * Math.PI * (48 + 90 * Math.exp(-t * 30)) * t) * Math.exp(-t * 13); }
    if (j % 2 === 1) for (let i = 0; i < SR * 0.18 && b + i < n; i++) { const t = i / SR; o[b + i] += 0.12 * gurultu() * Math.exp(-t * 22); }
    const h = b + Math.floor(v / 2 * SR);
    for (let i = 0; i < SR * 0.04 && h + i < n; i++) { const t = i / SR; o[h + i] += 0.05 * gurultu() * Math.exp(-t * 90); }
  }
  return o;
}

// ---------------------------------------------------------------- miksaj
// olaylar: [{t, sig, kazanc, konusma}]
export function miksle(olaylar, sure, muzikSig, muzikSes = 0.5) {
  const n = Math.floor(SR * sure), o = new Float32Array(n), maske = new Float32Array(n);
  for (const e of olaylar) {
    const b = Math.floor(e.t * SR), k = e.kazanc ?? 1;
    for (let i = 0; i < e.sig.length && b + i < n; i++) { if (b + i < 0) continue; o[b + i] += e.sig[i] * k; if (e.konusma) maske[b + i] = 1; }
  }
  if (muzikSig) {
    // yumuşak ducking
    let m = 0; const a = 1 / (SR * 0.15);
    for (let i = 0; i < n; i++) {
      m += (maske[i] - m) * a;
      const giris = Math.min(1, i / (SR * 0.6));
      o[i] += (muzikSig[i % muzikSig.length] || 0) * muzikSes * (1 - 0.65 * m) * giris;
    }
  }
  const fade = Math.floor(SR * 0.8);
  for (let i = 0; i < fade && i < n; i++) o[n - 1 - i] *= i / fade;
  let tepe = 0; for (let i = 0; i < n; i++) tepe = Math.max(tepe, Math.abs(o[i]));
  if (tepe > 0.97) { const g = 0.97 / tepe; for (let i = 0; i < n; i++) o[i] *= g; }
  return o;
}

export function wavYap(sig) { // önizleme/test için
  const b = new ArrayBuffer(44 + sig.length * 2), d = new DataView(b);
  const w = (o, s) => [...s].forEach((c, i) => d.setUint8(o + i, c.charCodeAt(0)));
  w(0, 'RIFF'); d.setUint32(4, 36 + sig.length * 2, true); w(8, 'WAVEfmt '); d.setUint32(16, 16, true);
  d.setUint16(20, 1, true); d.setUint16(22, 1, true); d.setUint32(24, SR, true); d.setUint32(28, SR * 2, true);
  d.setUint16(32, 2, true); d.setUint16(34, 16, true); w(36, 'data'); d.setUint32(40, sig.length * 2, true);
  for (let i = 0; i < sig.length; i++) d.setInt16(44 + i * 2, Math.max(-1, Math.min(1, sig[i])) * 32767, true);
  return new Blob([b], { type: 'audio/wav' });
}
