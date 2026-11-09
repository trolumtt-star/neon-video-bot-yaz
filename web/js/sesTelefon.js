// İnternetsiz seslendirme: telefonun kendi Türkçe metin okuma motoru (Android TextToSpeech)
import { SR, yenidenOrnekle, bolumle } from './ses.js';
import { diyalogSirasi } from './gemini.js';

export const bosluk = () => new Promise(r => { const c = new MessageChannel(); c.port1.onmessage = () => r(); c.port2.postMessage(0); });

export function telefonSesiVar() { return !!(window.Android && window.Android.tts); }

export function telefonSesleri() {
  try { return JSON.parse(window.Android.ttsSesler() || '[]'); } catch { return []; }
}

function wavCoz(b64) {
  const bin = atob(b64);
  const u = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
  const d = new DataView(u.buffer);
  let hz = 22050, kanal = 1, bit = 16, veri = 44, boy = u.length - 44;
  for (let k = 12; k + 8 <= u.length;) {
    const id = String.fromCharCode(u[k], u[k + 1], u[k + 2], u[k + 3]);
    const n = d.getUint32(k + 4, true);
    if (id === 'fmt ') { kanal = d.getUint16(k + 10, true); hz = d.getUint32(k + 12, true); bit = d.getUint16(k + 22, true); }
    if (id === 'data') { veri = k + 8; boy = Math.min(n, u.length - veri); break; }
    k += 8 + n + (n & 1);
  }
  const adim = (bit / 8) * kanal, n = Math.floor(boy / adim);
  const o = new Float32Array(n);
  for (let i = 0; i < n; i++) o[i] = bit === 16 ? d.getInt16(veri + i * adim, true) / 32768 : (u[veri + i * adim] - 128) / 128;
  return yenidenOrnekle(o, hz, SR);
}

export async function telefonlaSeslendir(ayar, s, durum = () => { }) {
  const liste = telefonSesleri();
  if (!liste.length) throw new Error('Telefonda Türkçe ses bulunamadı (Ayarlar > Metin okuma > Google > Türkçe ses verisini indir).');
  const yerel = liste.filter(v => v.yerel);
  const havuz = (yerel.length ? yerel : liste).map(v => v.ad);
  const ses = i => havuz[i % havuz.length];
  const perde = (k, ek = 0) => (k?.cinsiyet === 'kadin' ? 1.18 : 0.84) + ek;
  const ayni = havuz.length < 3;
  const P = {
    A: [ses(0), perde(s.A), 1.0],
    B: [ses(1), perde(s.B, ayni && s.A.cinsiyet === s.B.cinsiyet ? 0.12 : 0), 1.04],
    ai: [ses(2), 1.1, 1.06],
    musteri: [ses(3), ayni ? 0.95 : 1.0, 1.0],
  };
  const oku = async (metin, [ad, p, h]) => {
    await bosluk();
    const b64 = window.Android.tts(metin, ad, p, h);
    if (!b64) throw new Error('Telefon seslendirmesi başarısız');
    return bolumle(wavCoz(b64), [metin])[0];
  };
  const diyalog = [];
  const sira = diyalogSirasi(s);
  for (let i = 0; i < sira.length; i++) { durum(`Seslendiriliyor ${i + 1}/${sira.length + s.cagri.length + 1}`); diyalog.push(await oku(sira[i].metin, P[sira[i].kim])); }
  const cagri = [];
  for (const c of s.cagri) cagri.push(await oku(c.metin, P[c.kim === 'ai' ? 'ai' : 'musteri']));
  const slogan = await oku(`${ayar.marka}. ${ayar.slogan || ''}`, P.ai);
  return { diyalog, cagri, slogan };
}
