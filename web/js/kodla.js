// Video kodlama: WebCodecs (H.264 + AAC/Opus) + kendi MP4 paketleyicimiz.
// Desteklenmezse MediaRecorder ile gerçek zamanlı kayda düşer.
import { SR } from './ses.js';

const bekle = ms => new Promise(r => setTimeout(r, ms));

export async function kodla({ sure, fps, genislik, yukseklik, kare, ses, ilerleme = () => { }, iptal = () => false }) {
  if (typeof VideoEncoder !== 'undefined') {
    try { return await webcodecs({ sure, fps, genislik, yukseklik, kare, ses, ilerleme, iptal }); }
    catch (e) { if (e.message === 'IPTAL') throw e; console.warn('WebCodecs başarısız, MediaRecorder deneniyor', e); }
  }
  return await kaydedici({ sure, fps, kare, ses, ilerleme, iptal });
}

async function videoAyari(w, h, fps) {
  for (const codec of ['avc1.640028', 'avc1.4D0028', 'avc1.42E028', 'avc1.640032']) {
    for (const hw of ['prefer-hardware', 'no-preference']) {
      const c = { codec, width: w, height: h, bitrate: 9_000_000, framerate: fps, avc: { format: 'avc' }, hardwareAcceleration: hw };
      try { if ((await VideoEncoder.isConfigSupported(c)).supported) return c; } catch { }
    }
  }
  throw new Error('Bu cihaz H.264 kodlamayı desteklemiyor');
}

async function sesAyari() {
  for (const codec of ['mp4a.40.2', 'opus']) {
    const c = { codec, sampleRate: SR, numberOfChannels: 1, bitrate: 160_000 };
    try { if ((await AudioEncoder.isConfigSupported(c)).supported) return c; } catch { }
  }
  return null;
}

async function webcodecs({ sure, fps, genislik, yukseklik, kare, ses, ilerleme, iptal }) {
  const vAyar = await videoAyari(genislik, yukseklik, fps);
  const aAyar = typeof AudioEncoder !== 'undefined' ? await sesAyari() : null;
  const vParca = [], aParca = [];
  let vDesc = null, aDesc = null, hata = null;
  const venc = new VideoEncoder({
    output: (ch, meta) => {
      const b = new Uint8Array(ch.byteLength); ch.copyTo(b);
      vParca.push({ b, ts: ch.timestamp, key: ch.type === 'key' });
      if (meta?.decoderConfig?.description && !vDesc) vDesc = new Uint8Array(meta.decoderConfig.description instanceof ArrayBuffer ? meta.decoderConfig.description : meta.decoderConfig.description.buffer.slice(meta.decoderConfig.description.byteOffset, meta.decoderConfig.description.byteOffset + meta.decoderConfig.description.byteLength));
    },
    error: e => { hata = e; },
  });
  venc.configure(vAyar);
  const n = Math.ceil(sure * fps);
  for (let i = 0; i < n; i++) {
    if (hata) throw hata;
    if (iptal()) { venc.close(); throw new Error('IPTAL'); }
    const tuval = kare(i / fps);
    // DOM'a eklenmemiş tuvalden doğrudan VideoFrame bazı cihazlarda eski kareyi verir; bitmap üzerinden al
    const bmp = await createImageBitmap(tuval);
    const f = new VideoFrame(bmp, { timestamp: Math.round(i * 1e6 / fps), duration: Math.round(1e6 / fps) });
    venc.encode(f, { keyFrame: i % (fps * 2) === 0 });
    f.close(); bmp.close();
    while (venc.encodeQueueSize > 4) await bekle(2);
    if (i % 6 === 0) { ilerleme(i / n, tuval); await bekle(0); }
  }
  await venc.flush(); venc.close();
  if (hata) throw hata;
  if (!vDesc) throw new Error('avcC alınamadı');

  if (aAyar && ses) {
    const aenc = new AudioEncoder({
      output: (ch, meta) => {
        const b = new Uint8Array(ch.byteLength); ch.copyTo(b);
        aParca.push({ b, ts: ch.timestamp, dur: ch.duration });
        const d = meta?.decoderConfig?.description;
        if (d && !aDesc) aDesc = new Uint8Array(d instanceof ArrayBuffer ? d : d.buffer.slice(d.byteOffset, d.byteOffset + d.byteLength));
      },
      error: e => { hata = e; },
    });
    aenc.configure(aAyar);
    const P = 4800;
    for (let i = 0; i < ses.length; i += P) {
      const parca = ses.slice(i, Math.min(ses.length, i + P));
      const ad = new AudioData({ format: 'f32-planar', sampleRate: SR, numberOfFrames: parca.length, numberOfChannels: 1, timestamp: Math.round(i * 1e6 / SR), data: parca });
      aenc.encode(ad); ad.close();
      while (aenc.encodeQueueSize > 8) await bekle(1);
    }
    await aenc.flush(); aenc.close();
    if (hata) throw hata;
  }
  ilerleme(1);
  return mp4Yap({
    video: { parcalar: vParca, desc: vDesc, w: genislik, h: yukseklik, fps },
    ses: aParca.length ? { parcalar: aParca, desc: aDesc, codec: aAyar.codec } : null,
  });
}

// ------------------------------------------------------------ MP4 paketleyici
const enc = new TextEncoder();
function kutu(tip, ...icerik) {
  const parcalar = icerik.flat(Infinity).filter(Boolean);
  const boy = 8 + parcalar.reduce((a, p) => a + p.length, 0);
  const o = new Uint8Array(boy);
  new DataView(o.buffer).setUint32(0, boy);
  o.set(enc.encode(tip), 4);
  let k = 8; for (const p of parcalar) { o.set(p, k); k += p.length; }
  return o;
}
const tamKutu = (tip, v, flags, ...ic) => kutu(tip, u8(v), u24(flags), ...ic);
const u8 = v => Uint8Array.of(v & 255);
const u16 = v => Uint8Array.of((v >> 8) & 255, v & 255);
const u24 = v => Uint8Array.of((v >> 16) & 255, (v >> 8) & 255, v & 255);
const u32 = v => { const o = new Uint8Array(4); new DataView(o.buffer).setUint32(0, v >>> 0); return o; };
const i32 = v => { const o = new Uint8Array(4); new DataView(o.buffer).setInt32(0, v); return o; };
const sifir = n => new Uint8Array(n);
const MATRIS = [u32(0x00010000), u32(0), u32(0), u32(0), u32(0x00010000), u32(0), u32(0), u32(0), u32(0x40000000)];

function sttsYap(sureler) {
  const runs = [];
  for (const d of sureler) { const s = runs[runs.length - 1]; if (s && s[1] === d) s[0]++; else runs.push([1, d]); }
  return tamKutu('stts', 0, 0, u32(runs.length), runs.map(([c, d]) => [u32(c), u32(d)]));
}

function trak({ id, tip, sureMovie, timescale, sureMedia, stsd, sureler, boyutlar, ofsetler, anahtarlar, ctts, w, h }) {
  const tkhd = tamKutu('tkhd', 0, 3, u32(0), u32(0), u32(id), u32(0), u32(sureMovie), sifir(8), u16(0), u16(0),
    u16(tip === 'soun' ? 0x0100 : 0), u16(0), MATRIS, u32((w || 0) * 65536), u32((h || 0) * 65536));
  const mdhd = tamKutu('mdhd', 0, 0, u32(0), u32(0), u32(timescale), u32(sureMedia), u16(0x55c4), u16(0));
  const hdlr = tamKutu('hdlr', 0, 0, u32(0), enc.encode(tip), sifir(12), enc.encode(tip === 'vide' ? 'VideoHandler\0' : 'SoundHandler\0'));
  const xmhd = tip === 'vide' ? tamKutu('vmhd', 0, 1, sifir(8)) : tamKutu('smhd', 0, 0, sifir(4));
  const dinf = kutu('dinf', tamKutu('dref', 0, 0, u32(1), tamKutu('url ', 0, 1)));
  const stbl = kutu('stbl',
    stsd, sttsYap(sureler),
    anahtarlar ? tamKutu('stss', 0, 0, u32(anahtarlar.length), anahtarlar.map(u32)) : null,
    ctts ? tamKutu('ctts', 1, 0, u32(ctts.length), ctts.map(o => [u32(1), i32(o)])) : null,
    tamKutu('stsc', 0, 0, u32(1), u32(1), u32(1), u32(1)),
    tamKutu('stsz', 0, 0, u32(0), u32(boyutlar.length), boyutlar.map(u32)),
    tamKutu('stco', 0, 0, u32(ofsetler.length), ofsetler.map(u32)));
  return kutu('trak', tkhd, kutu('mdia', mdhd, hdlr, kutu('minf', xmhd, dinf, stbl)));
}

function esds(asc) {
  const dsi = [u8(0x05), u8(asc.length), asc];
  const dcd = [u8(0x04), u8(13 + 2 + asc.length), u8(0x40), u8(0x15), u24(0), u32(192000), u32(160000), ...dsi];
  const len = 3 + 2 + 13 + 2 + asc.length + 3;
  return tamKutu('esds', 0, 0, u8(0x03), u8(len), u16(2), u8(0), ...dcd, u8(0x06), u8(1), u8(2));
}

export function mp4Yap({ video, ses }) {
  const VT = 90000;
  const fd = Math.round(VT / video.fps);
  const vp = video.parcalar;
  const pts = vp.map(p => Math.round(p.ts * VT / 1e6));
  const sirali = [...pts].sort((a, b) => a - b);
  const ofs = pts.map((p, i) => p - sirali[i]);
  const bframe = ofs.some(o => o !== 0);
  const vSureler = vp.map(() => fd);
  const vSure = vp.length * fd;
  const anahtar = vp.map((p, i) => (p.key ? i + 1 : 0)).filter(Boolean);
  const avc1 = kutu('avc1', sifir(6), u16(1), sifir(16), u16(video.w), u16(video.h), u32(0x00480000), u32(0x00480000),
    u32(0), u16(1), sifir(32), u16(0x18), u16(0xffff), kutu('avcC', video.desc));
  const vStsd = tamKutu('stsd', 0, 0, u32(1), avc1);

  let aStsd = null, aSureler = [], aSure = 0;
  if (ses) {
    aSureler = ses.parcalar.map(p => Math.max(1, Math.round((p.dur || (1024 * 1e6 / SR)) * SR / 1e6)));
    aSure = aSureler.reduce((a, b) => a + b, 0);
    const ortak = [sifir(6), u16(1), sifir(8), u16(1), u16(16), u16(0), u16(0), u32(SR * 65536)];
    if (ses.codec === 'opus') {
      const dOps = kutu('dOps', u8(0), u8(1), u16(312), u32(SR), u16(0), u8(0));
      aStsd = tamKutu('stsd', 0, 0, u32(1), kutu('Opus', ...ortak, dOps));
    } else {
      const asc = ses.desc && ses.desc.length ? ses.desc : Uint8Array.of(0x11, 0x88);
      aStsd = tamKutu('stsd', 0, 0, u32(1), kutu('mp4a', ...ortak, esds(asc)));
    }
  }
  const sureMs = Math.max(Math.round(vSure / VT * 1000), ses ? Math.round(aSure / SR * 1000) : 0);
  const ftyp = kutu('ftyp', enc.encode('isom'), u32(512), enc.encode('isomiso2avc1mp41'));

  const moovYap = (taban) => {
    let k = taban;
    const vOfs = vp.map(p => { const o = k; k += p.b.length; return o; });
    const aOfs = ses ? ses.parcalar.map(p => { const o = k; k += p.b.length; return o; }) : [];
    const mvhd = tamKutu('mvhd', 0, 0, u32(0), u32(0), u32(1000), u32(sureMs), u32(0x00010000), u16(0x0100), sifir(10), MATRIS, sifir(24), u32(ses ? 3 : 2));
    const tv = trak({ id: 1, tip: 'vide', sureMovie: Math.round(vSure / VT * 1000), timescale: VT, sureMedia: vSure, stsd: vStsd,
      sureler: vSureler, boyutlar: vp.map(p => p.b.length), ofsetler: vOfs, anahtarlar: anahtar, ctts: bframe ? ofs : null, w: video.w, h: video.h });
    const ta = ses ? trak({ id: 2, tip: 'soun', sureMovie: Math.round(aSure / SR * 1000), timescale: SR, sureMedia: aSure, stsd: aStsd,
      sureler: aSureler, boyutlar: ses.parcalar.map(p => p.b.length), ofsetler: aOfs }) : null;
    return kutu('moov', mvhd, tv, ta);
  };
  const deneme = moovYap(0);
  const moov = moovYap(ftyp.length + deneme.length + 8);
  const mdatBoy = 8 + vp.reduce((a, p) => a + p.b.length, 0) + (ses ? ses.parcalar.reduce((a, p) => a + p.b.length, 0) : 0);
  const mdatBas = new Uint8Array(8); new DataView(mdatBas.buffer).setUint32(0, mdatBoy); mdatBas.set(enc.encode('mdat'), 4);
  return new Blob([ftyp, moov, mdatBas, ...vp.map(p => p.b), ...(ses ? ses.parcalar.map(p => p.b) : [])], { type: 'video/mp4' });
}

// ------------------------------------------------------------ yedek: gerçek zamanlı kayıt
async function kaydedici({ sure, fps, kare, ses, ilerleme, iptal }) {
  const ilk = kare(0);
  const akis = ilk.captureStream(0);
  const iz = akis.getVideoTracks()[0];
  const ac = new AudioContext({ sampleRate: SR });
  const hedef = ac.createMediaStreamDestination();
  const buf = ac.createBuffer(1, ses.length, SR); buf.copyToChannel(ses, 0);
  const kaynak = ac.createBufferSource(); kaynak.buffer = buf; kaynak.connect(hedef);
  const birlesik = new MediaStream([iz, ...hedef.stream.getAudioTracks()]);
  const tip = ['video/mp4;codecs=avc1,mp4a.40.2', 'video/mp4', 'video/webm;codecs=vp9,opus', 'video/webm'].find(t => MediaRecorder.isTypeSupported(t));
  const kayit = new MediaRecorder(birlesik, { mimeType: tip, videoBitsPerSecond: 8_000_000 });
  const parcalar = [];
  kayit.ondataavailable = e => e.data.size && parcalar.push(e.data);
  const bitti = new Promise(r => { kayit.onstop = r; });
  kayit.start(1000);
  await ac.resume();
  const bas = ac.currentTime + 0.05;
  kaynak.start(bas);
  while (true) {
    const t = ac.currentTime - bas;
    if (t >= sure) break;
    if (iptal()) { kayit.stop(); throw new Error('IPTAL'); }
    if (t >= 0) { kare(t); iz.requestFrame?.(); ilerleme(t / sure, ilk); }
    await new Promise(r => requestAnimationFrame(r));
  }
  kayit.stop(); await bitti; ac.close();
  return new Blob(parcalar, { type: tip.split(';')[0] });
}
