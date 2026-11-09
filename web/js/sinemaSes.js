// SİNEMA SESİ: plana göre müzik + efekt sentezi (OfflineAudioContext, internet ve dosya gerekmez).
// Ruh haline göre özgün beste: huzunlu (ney ağıtı, uşşak), destansi (hicaz, davul + bakır),
// neseli (marş), gergin (nabız), umut (piyano arpej). Efektler: siren, top, rüzgar, kuş, dalga, alkış, havai fişek...
import { SR } from './ses.js';

const MAKAM = {
  ussak: [0, 150, 300, 500, 700, 800, 1000],
  hicaz: [0, 113, 386, 498, 702, 792, 996],
  majr: [0, 200, 400, 500, 700, 900, 1100],
  minr: [0, 200, 300, 500, 700, 800, 1000],
};
const RUH = {
  huzunlu: { bpm: 60, makam: 'ussak', ton: 440, lead: 'ney', pad: 'drone', davul: null, akor: [0, 0, 3, 4, 0, 5, 3, 0] },
  destansi: { bpm: 84, makam: 'hicaz', ton: 293.66, lead: 'brass', pad: 'yayli', davul: 'taiko', akor: [0, 0, 6, 5, 0, 3, 4, 0] },
  neseli: { bpm: 116, makam: 'majr', ton: 392, lead: 'kare', pad: 'yayli', davul: 'mars', akor: [0, 4, 5, 3, 0, 4, 3, 4] },
  gergin: { bpm: 96, makam: 'minr', ton: 164.8, lead: 'ney', pad: 'nabiz', davul: 'kalp', akor: [0, 0, 5, 5, 3, 3, 4, 4] },
  umut: { bpm: 92, makam: 'majr', ton: 261.63, lead: 'yumusak', pad: 'piyano', davul: 'hafif', akor: [0, 5, 3, 4, 0, 5, 3, 4] },
};
function rnd(s) { s = (Math.abs(s | 0) % 2147483646) + 1; return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; }

export async function sinemaSesi(plan) {
  const n = Math.floor(SR * plan.sure), ctx = new OfflineAudioContext(1, n, SR);
  const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 3; comp.connect(ctx.destination);
  const master = ctx.createGain(); master.gain.value = .9; master.connect(comp);
  // yankı
  const ir = ctx.createBuffer(1, SR * 2.6, SR), d = ir.getChannelData(0), r0 = rnd(7);
  for (let i = 0; i < d.length; i++) d[i] = (r0() * 2 - 1) * Math.pow(1 - i / d.length, 3.2);
  const verb = ctx.createConvolver(); verb.buffer = ir; const vg = ctx.createGain(); vg.gain.value = .35; verb.connect(vg); vg.connect(master);
  const muzikBus = ctx.createGain(); muzikBus.connect(master); muzikBus.connect(verb);
  const sfx = ctx.createGain(); sfx.connect(master); const sfxV = ctx.createGain(); sfxV.gain.value = .6; sfxV.connect(verb); sfx.connect(sfxV);
  const gurultu = ctx.createBuffer(1, SR * 2, SR); { const g = gurultu.getChannelData(0), r = rnd(3); for (let i = 0; i < g.length; i++) g[i] = r() * 2 - 1; }
  const R = rnd(plan.tohum || 1);
  // ---------------------------------------------------------- yardımcılar
  const gain = (v = 1, dest = sfx) => { const g = ctx.createGain(); g.gain.value = v; g.connect(dest); return g; };
  const filtre = (tip, f, q = .7, dest) => { const b = ctx.createBiquadFilter(); b.type = tip; b.frequency.value = f; b.Q.value = q; b.connect(dest); return b; };
  function gur(t0, sure, dest, dongu = false) { const s = ctx.createBufferSource(); s.buffer = gurultu; s.loop = true; s.loopStart = R() * 1.5; s.connect(dest); s.start(t0, R() * 1.5); s.stop(t0 + sure); return s; }
  function zarf(g, t0, a, tut, b, tepe = 1) { g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(tepe, t0 + a); g.gain.setValueAtTime(tepe, t0 + a + tut); g.gain.exponentialRampToValueAtTime(.0001, t0 + a + tut + b); }
  const osc = (tip, f, t0, t1, dest) => { const o = ctx.createOscillator(); if (typeof tip === 'string') o.type = tip; else o.setPeriodicWave(tip); o.frequency.value = f; o.connect(dest); o.start(t0); o.stop(t1); return o; };
  const dalgaTek = ctx.createPeriodicWave(new Float32Array([0, 0, 0, 0, 0, 0, 0]), new Float32Array([0, 1, 0, .35, 0, .15, 0]));
  const neyDalga = ctx.createPeriodicWave(new Float32Array([0, 0, 0, 0, 0]), new Float32Array([0, 1, .28, .1, .04]));
  // ---------------------------------------------------------- efektler
  const E = {
    siren(t0, k = 1, det = 1) {
      const g = gain(0, sfx), lp = filtre('lowpass', 3200, .7, g), o = osc(dalgaTek, 90, t0, t0 + 7.5, lp);
      o.frequency.setValueAtTime(90 * det, t0); o.frequency.linearRampToValueAtTime(520 * det, t0 + 2.1); o.frequency.linearRampToValueAtTime(528 * det, t0 + 5.4); o.frequency.linearRampToValueAtTime(140 * det, t0 + 7.3);
      g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(.32 * k, t0 + 1.4); g.gain.setValueAtTime(.32 * k, t0 + 5.4); g.gain.linearRampToValueAtTime(0, t0 + 7.4);
      const s = gain(.9, verb); g.connect(s);
    },
    top(t0, k = 1) {
      const g = gain(0, sfx); const o = osc('sine', 95, t0, t0 + 2, g); o.frequency.setValueAtTime(95, t0); o.frequency.exponentialRampToValueAtTime(32, t0 + 1.2); zarf(g, t0, .01, .05, 1.5, .9 * k);
      const ng = gain(0, sfx), lp = filtre('lowpass', 500, .7, ng); gur(t0, 2, lp); zarf(ng, t0, .005, .05, 1.3, .8 * k);
    },
    tufek(t0, k = 1) { const g = gain(0, sfx), hp = filtre('highpass', 900, .7, g); gur(t0, .3, hp); zarf(g, t0, .002, .01, .12, .35 * k); },
    ruzgar(t0, sure, k = 1) { const g = gain(0, sfx), bp = filtre('bandpass', 480, .6, g); gur(t0, sure, bp); g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(.12 * k, t0 + 1.5); g.gain.setValueAtTime(.12 * k, t0 + sure - 1); g.gain.linearRampToValueAtTime(0, t0 + sure);
      const l = ctx.createOscillator(); l.frequency.value = .13; const lg = ctx.createGain(); lg.gain.value = .05 * k; l.connect(lg); lg.connect(g.gain); l.start(t0); l.stop(t0 + sure); },
    sehir(t0, sure, k = 1, bitis = null) { const g = gain(0, sfx), lp = filtre('lowpass', 320, .7, g), g2 = ctx.createGain(); g2.gain.value = .25; const bp = filtre('bandpass', 1400, .5, g2); g2.connect(g); gur(t0, sure, lp); gur(t0, sure, bp);
      g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(.36 * k, t0 + .8); const tb = bitis ?? t0 + sure - .6; g.gain.setValueAtTime(.36 * k, tb); g.gain.linearRampToValueAtTime(0, tb + (bitis ? 1.6 : .6)); },
    kus(t0) { const g = gain(0, sfx), o = osc('sine', 2800 + R() * 1600, t0, t0 + .2, g), l = ctx.createOscillator(); l.frequency.value = 14; const lg = ctx.createGain(); lg.gain.value = 500; l.connect(lg); lg.connect(o.frequency); l.start(t0); l.stop(t0 + .2); zarf(g, t0, .02, .04, .1, .05); },
    dalga(t0, sure) { const g = gain(0, sfx), lp = filtre('lowpass', 700, .7, g); gur(t0, sure, lp); g.gain.setValueAtTime(.05, t0); for (let t = t0; t < t0 + sure; t += 3.2) { g.gain.linearRampToValueAtTime(.26, t + 1.4); g.gain.linearRampToValueAtTime(.05, t + 3.2); } },
    marti(t0) { const g = gain(0, sfx), bp = filtre('bandpass', 1300, 2, g), o = osc('sawtooth', 1500, t0, t0 + .6, bp); o.frequency.setValueAtTime(1500, t0); o.frequency.exponentialRampToValueAtTime(900, t0 + .5); zarf(g, t0, .03, .2, .3, .08); },
    gemi(t0) { const g = gain(0, sfx), lp = filtre('lowpass', 900, .8, g); osc('sawtooth', 110, t0, t0 + 2.6, lp); osc('sawtooth', 164.8, t0, t0 + 2.6, lp); g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(.22, t0 + .25); g.gain.setValueAtTime(.22, t0 + 2); g.gain.linearRampToValueAtTime(0, t0 + 2.5); },
    kalabalik(t0, sure, k = 1) { const g = gain(0, sfx), bp = filtre('bandpass', 650, .4, g); gur(t0, sure, bp); g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(.16 * k, t0 + 1); g.gain.setValueAtTime(.16 * k, t0 + sure - .8); g.gain.linearRampToValueAtTime(0, t0 + sure); },
    alkis(t0, sure, k = 1) { const g = gain(.9 * k, sfx), bp = filtre('bandpass', 2200, .6, g); for (let t = t0; t < t0 + sure; t += .03 + R() * .03) { const e = Math.min(1, (t - t0) / .8, (t0 + sure - t) / .8); const s = ctx.createGain(); s.connect(bp); gur(t, .06, s); zarf(s, t, .002, .005, .05, .25 * e * (.5 + R() * .5)); } },
    fisek(t0) { const g = gain(0, sfx), o = osc('sine', 1100, t0, t0 + .9, g); o.frequency.exponentialRampToValueAtTime(2600, t0 + .8); zarf(g, t0, .05, .6, .2, .04);
      const t1 = t0 + .9; E.top(t1, .35); const cg = gain(.6, sfx), hp = filtre('highpass', 3000, .7, cg); for (let i = 0; i < 26; i++) { const tt = t1 + .1 + R() * 1.1, s = ctx.createGain(); s.connect(hp); gur(tt, .03, s); zarf(s, tt, .001, .003, .02, .3 * R()); } },
    tik(t0, k = .25) { const g = gain(0, sfx), bp = filtre('bandpass', 3200, 2, g); gur(t0, .05, bp); zarf(g, t0, .001, .002, .03, k); },
    adim(t0, k = .12) { const g = gain(0, sfx), lp = filtre('lowpass', 900, .7, g); gur(t0, .08, lp); zarf(g, t0, .002, .01, .06, k); },
  };
  // ---------------------------------------------------------- sahnelere göre efekt + ambiyans
  for (const s of plan.sahneler) {
    const t0 = s.bas, sure = s.sure, ef = s.efekt, siren = s.olay === 'siren';
    if (s.mekan === 'siyah') { for (let t = t0 + .3; t < t0 + sure; t += 1) E.tik(t, .2); continue; }
    if (s.mekan === 'sokak') { E.sehir(t0, sure, 1, s.durAni ?? null); for (let i = 0; i < 6; i++) E.kus(t0 + R() * sure); if (s.saat) for (let t = t0 + .2; t < (s.durAni ?? t0 + sure); t += 1) E.tik(t, .12);
      const yuruyen = s.karakterler.some(k => k.eylem === 'yuru' || k.eylem === 'kos'); if (yuruyen) for (let t = t0 + .3; t < (s.durAni ?? t0 + sure) + .6; t += .27 + R() * .1) E.adim(t, s.durAni && t > s.durAni ? .05 : .1); }
    if (s.mekan === 'anitkabir' || s.mekan === 'tepe') E.ruzgar(t0, sure, s.mekan === 'tepe' ? 1.2 : 1);
    if (s.mekan === 'cephe') { E.ruzgar(t0, sure, .8); for (let i = 0; i < 4; i++) E.top(t0 + .5 + R() * sure, .25); if (s.karakterler.some(k => k.eylem === 'nisan')) for (let i = 0; i < 10; i++) E.tufek(t0 + R() * sure, .5 + R() * .5); }
    if (s.mekan === 'meydan' || s.mekan === 'okul') { E.kalabalik(t0, sure, s.mekan === 'okul' ? .7 : 1); for (let i = 0; i < 4; i++) E.kus(t0 + R() * sure); }
    if (s.mekan === 'sahil') { E.dalga(t0, sure); for (let i = 0; i < 3; i++) E.marti(t0 + .5 + R() * (sure - 1)); }
    if (s.olay === 'patlama' || s.olay === 'top_atisi' || ef.includes('patlama') || s.mekan === 'cephe') { const sayi = s.olay === 'patlama' || s.olay === 'top_atisi' || ef.includes('patlama') ? 4 : 1; for (let i = 0; i < sayi; i++) E.top(t0 + .6 + i * (sure / sayi) + .02, 1); }
    if (s.olay === 'gemi_duduk' || (s.mekan === 'sahil' && R() < .5)) E.gemi(t0 + 1.2);
    if (s.olay === 'alkis' || s.karakterler.some(k => k.eylem === 'alkis')) E.alkis(t0 + .8, sure - 1.2);
    if (ef.includes('havai_fisek')) for (let t = t0 + .1; t < t0 + sure - 1; t += 2.3) E.fisek(t);
    if (ef.includes('yagmur')) { const g = gain(.12, sfx), hp = filtre('highpass', 1500, .5, g); gur(t0, sure, hp); }
    if (siren && s.durAni != null) { E.siren(s.durAni); E.siren(s.durAni + .35, .7, 1.017); }
  }
  // ---------------------------------------------------------- müzik
  const cfg = RUH[plan.muzik] || RUH.umut, sc = MAKAM[cfg.makam];
  const nota = (der, oct = 0) => { const k = Math.floor(der / 7), i = ((der % 7) + 7) % 7; return cfg.ton * Math.pow(2, oct + k + sc[i] / 1200); };
  const ilk = plan.sahneler[0]?.mekan === 'siyah' ? plan.sahneler[0].sure * .5 : 0;
  const mBas = ilk, mBit = plan.sure - .4, beat = 60 / cfg.bpm, bar = beat * 4;
  // müzik seviyesi: girişte yavaş açıl, siren boyunca kıs, sonda kapan
  muzikBus.gain.setValueAtTime(0, 0); muzikBus.gain.linearRampToValueAtTime(.55, mBas + 2.5);
  for (const s of plan.sahneler) if (s.olay === 'siren' && s.durAni != null) { muzikBus.gain.setValueAtTime(.55, s.durAni); muzikBus.gain.linearRampToValueAtTime(.12, s.durAni + 1); muzikBus.gain.setValueAtTime(.12, s.durAni + 5.5); muzikBus.gain.linearRampToValueAtTime(.55, s.durAni + 8); }
  muzikBus.gain.setValueAtTime(.55, mBit - 1.6); muzikBus.gain.linearRampToValueAtTime(0, mBit + .3);
  const barSay = Math.max(2, Math.floor((mBit - mBas) / bar));
  const t0m = mBit - barSay * bar; // son vuruş videonun sonuna denk gelsin
  // ped / akor
  const padBus = ctx.createGain(); padBus.gain.value = .22; padBus.connect(muzikBus);
  for (let b = 0; b < barSay; b++) {
    const ta = t0m + b * bar, kok = cfg.akor[b % cfg.akor.length], son = b === barSay - 1, uz = son ? bar + .4 : bar;
    if (cfg.pad === 'drone') { if (b % 4 === 0) { const g = ctx.createGain(); g.connect(padBus); const lp = filtre('lowpass', 650, .7, g); for (const f of [nota(0, -2), nota(4, -2), nota(0, -1)]) { osc('sawtooth', f, ta, ta + bar * 4 + .5, lp); } g.gain.setValueAtTime(0, ta); g.gain.linearRampToValueAtTime(.5, ta + 1.5); g.gain.setValueAtTime(.5, ta + bar * 4 - .6); g.gain.linearRampToValueAtTime(0, ta + bar * 4 + .4); } }
    else if (cfg.pad === 'piyano') { for (let k = 0; k < 8; k++) { const tt = ta + k * beat / 2, der = kok + [0, 2, 4, 7, 4, 2, 4, 7][k], g = ctx.createGain(); g.connect(padBus); const lp = filtre('lowpass', 2400, .7, g); osc('triangle', nota(der, -1), tt, tt + 1.2, lp); zarf(g, tt, .005, .02, 1.0, .5); } }
    else if (cfg.pad === 'nabiz') { for (let k = 0; k < 8; k++) { const tt = ta + k * beat / 2, g = ctx.createGain(); g.connect(padBus); const lp = filtre('lowpass', 500, 2, g); osc('sawtooth', nota(kok, -2), tt, tt + .25, lp); zarf(g, tt, .005, .05, .15, .7); } }
    else { const g = ctx.createGain(); g.connect(padBus); const lp = filtre('lowpass', 1300, .6, g); for (const dd of [0, 2, 4]) for (const det of [-4, 4]) { const o = osc('sawtooth', nota(kok + dd, -1), ta, ta + uz + .6, lp); o.detune.value = det; } g.gain.setValueAtTime(0, ta); g.gain.linearRampToValueAtTime(.32, ta + .45); g.gain.setValueAtTime(.32, ta + uz - .2); g.gain.linearRampToValueAtTime(0, ta + uz + .5); }
    // bas
    if (cfg.davul) { const g = ctx.createGain(); g.connect(padBus); const lp = filtre('lowpass', 400, .7, g); osc('triangle', nota(kok, -2), ta, ta + bar, lp); zarf(g, ta, .01, bar * .7, bar * .25, .7); }
  }
  // davul
  const davBus = ctx.createGain(); davBus.gain.value = .5; davBus.connect(muzikBus);
  const kick = (t, k = 1) => { const g = ctx.createGain(); g.connect(davBus); const o = osc('sine', 140, t, t + .4, g); o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(45, t + .15); zarf(g, t, .002, .02, .3, k); };
  const taiko = (t, k = 1) => { const g = ctx.createGain(); g.connect(davBus); const o = osc('sine', 100, t, t + .7, g); o.frequency.setValueAtTime(100, t); o.frequency.exponentialRampToValueAtTime(52, t + .3); zarf(g, t, .003, .03, .55, k); const ng = ctx.createGain(); ng.connect(davBus); gur(t, .4, filtre('lowpass', 320, .7, ng)); zarf(ng, t, .002, .02, .25, .6 * k); };
  const trampet = (t, k = 1) => { const g = ctx.createGain(); g.connect(davBus); gur(t, .25, filtre('highpass', 1500, .7, g)); zarf(g, t, .001, .01, .14, .55 * k); };
  const hh = (t, k = 1) => { const g = ctx.createGain(); g.connect(davBus); gur(t, .06, filtre('highpass', 7000, .7, g)); zarf(g, t, .001, .005, .035, .3 * k); };
  for (let b = 0; b < barSay; b++) {
    const ta = t0m + b * bar, giris = Math.min(1, (b + 1) / 4), son = b === barSay - 1;
    if (cfg.davul === 'taiko') { for (const [x, k] of [[0, 1], [1.5, .6], [2, .9], [3, .5], [3.5, .7]]) taiko(ta + x * beat, k * giris); if (b % 4 === 3) for (let i = 0; i < 4; i++) taiko(ta + (3 + i * .25) * beat, .5 + i * .12); }
    else if (cfg.davul === 'mars') { kick(ta, .9); kick(ta + 2 * beat, .9); trampet(ta + beat); trampet(ta + 3 * beat); for (let i = 0; i < 8; i++) hh(ta + i * beat / 2, i % 2 ? .6 : 1); if (b % 4 === 3) { trampet(ta + 3.5 * beat, .7); trampet(ta + 3.75 * beat, .8); } }
    else if (cfg.davul === 'kalp') { kick(ta, .7); kick(ta + .28, .45); kick(ta + 2 * beat, .7); kick(ta + 2 * beat + .28, .45); }
    else if (cfg.davul === 'hafif') { kick(ta, .5); if (b >= 4) { hh(ta + beat, .5); hh(ta + 3 * beat, .5); } }
    if (son && cfg.davul) { (cfg.davul === 'taiko' ? taiko : kick)(ta + bar, 1); }
  }
  // melodi
  const leadBus = ctx.createGain(); leadBus.gain.value = cfg.lead === 'ney' ? .42 : .3; leadBus.connect(muzikBus);
  const RIT = cfg.lead === 'ney' ? [[2, 1, 1], [1.5, .5, 2], [3, 1], [1, 1, 2], [4]] : cfg.lead === 'brass' ? [[1, 1, 2], [1.5, .5, 1, 1], [2, 2], [.5, .5, 1, 2], [3, 1]] : [[1, 1, 1, 1], [.5, .5, 1, 2], [1, .5, .5, 2], [2, 1, 1], [1.5, .5, 2]];
  const notalar = []; let der = 0;
  const bas = cfg.lead === 'brass' ? Math.max(1, Math.floor(barSay * .25)) : cfg.lead === 'ney' ? 1 : 2; // ilk barlarda sadece ped
  for (let b = bas; b < barSay; b++) {
    const ta = t0m + b * bar, kok = cfg.akor[b % cfg.akor.length], son = b === barSay - 1, cumleSon = b % 4 === 3;
    const rit = son ? [4] : cumleSon ? [2, 2] : RIT[Math.floor(R() * RIT.length)];
    let x = 0;
    rit.forEach((du, i) => {
      if (son) der = 0; else if (cumleSon && i === rit.length - 1) der = kok + (R() < .5 ? 0 : 4);
      else { const hedef = kok + [0, 2, 4][Math.floor(R() * 3)]; der += Math.sign(hedef - der) * (R() < .7 ? 1 : 2); if (R() < .25) der += R() < .5 ? 1 : -1; der = Math.max(-2, Math.min(9, der)); }
      notalar.push({ t: ta + x * beat, d: du * beat * (son ? 1.6 : 1), f: nota(der, cfg.lead === 'brass' || cfg.lead === 'yumusak' ? 0 : 0) * (cfg.makam === 'hicaz' || cfg.lead === 'kare' ? 1 : 1) });
      x += du;
    });
  }
  if (cfg.lead === 'ney') {
    const g = ctx.createGain(); g.gain.value = 0; const lp = filtre('lowpass', 4200, .7, g); g.connect(leadBus);
    const o = osc(neyDalga, notalar[0]?.f || 440, t0m, mBit + 1, lp);
    const l = ctx.createOscillator(); l.frequency.value = 5.2; const lg = ctx.createGain(); lg.gain.value = 2.4; l.connect(lg); lg.connect(o.frequency); l.start(t0m); l.stop(mBit + 1);
    const ng = ctx.createGain(); ng.gain.value = 0; const nbp = filtre('bandpass', 2600, .5, ng); ng.connect(leadBus); gur(t0m, mBit - t0m + 1, nbp);
    for (const nt of notalar) {
      o.frequency.setTargetAtTime(nt.f, nt.t, .035);
      g.gain.setTargetAtTime(.0, nt.t - .02, .02); g.gain.setTargetAtTime(.85, nt.t + .02, .08); g.gain.setTargetAtTime(.55, nt.t + nt.d * .6, .2);
      ng.gain.setTargetAtTime(.06, nt.t, .05); ng.gain.setTargetAtTime(.02, nt.t + .2, .2);
    }
    const sonN = notalar[notalar.length - 1]; if (sonN) { g.gain.setTargetAtTime(0, Math.min(mBit - .3, sonN.t + sonN.d * .7), .4); ng.gain.setTargetAtTime(0, sonN.t + sonN.d * .5, .3); }
  } else {
    for (const nt of notalar) {
      const g = ctx.createGain(); g.connect(leadBus);
      if (cfg.lead === 'brass') { const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = 1.2; lp.connect(g); for (const det of [-6, 6]) { const o = osc('sawtooth', nt.f, nt.t, nt.t + nt.d + .5, lp); o.detune.value = det; } lp.frequency.setValueAtTime(300, nt.t); lp.frequency.linearRampToValueAtTime(2200, nt.t + .12); lp.frequency.setTargetAtTime(1200, nt.t + .2, .3); zarf(g, nt.t, .06, nt.d * .7, .35, .5); }
      else if (cfg.lead === 'kare') { const lp = filtre('lowpass', 2600, .8, g); osc('square', nt.f, nt.t, nt.t + nt.d + .3, lp); zarf(g, nt.t, .01, nt.d * .5, nt.d * .4 + .1, .32); }
      else { const lp = filtre('lowpass', 2000, .7, g); osc('sine', nt.f * 2, nt.t, nt.t + nt.d + .6, lp); osc('triangle', nt.f, nt.t, nt.t + nt.d + .6, lp); zarf(g, nt.t, .04, nt.d * .6, .5, .45); }
    }
  }
  const buf = await ctx.startRendering();
  const o = new Float32Array(n); o.set(buf.getChannelData(0).subarray(0, n));
  // patlamalar tepe değeri yükseltmesin: %99.7'lik dilime göre seviye + yumuşak kırpma
  const orn = []; for (let i = 0; i < n; i += 37) orn.push(Math.abs(o[i])); orn.sort((x, y) => x - y);
  const p = orn[Math.floor(orn.length * .997)] || 1e-3, k = .72 / p;
  for (let i = 0; i < n; i++) o[i] = Math.tanh(o[i] * k) * .97;
  const f = Math.floor(SR * .5); for (let i = 0; i < f && i < n; i++) o[n - 1 - i] *= i / f;
  return o;
}
