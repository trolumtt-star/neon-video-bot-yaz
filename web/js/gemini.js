// Model adı temizleme: 'Gemini 3.5 Flash-Lite', 'models/gemini-...', tırnaklı yazımlar -> 'gemini-3.5-flash-lite'
export const METIN_MODELLERI = ['gemini-3.5-flash-lite', 'gemini-3.1-flash-lite', 'gemini-2.5-flash-lite', 'gemini-3.8-flash', 'gemini-3.6-flash', 'gemini-3-flash-preview', 'gemini-2.5-flash', 'gemini-flash-latest'];
export function modelTemizle(m, varsayilan = 'gemini-3.5-flash-lite') {
  const t = String(m || '').trim().toLowerCase().replace(/^models\//, '').replace(/[`'"]/g, '').replace(/[\s_]+/g, '-').replace(/-+/g, '-');
  return /^[a-z0-9][a-z0-9.\-]*$/.test(t) ? t : varsayilan;
}
export const metinModelleri = ayar => [...new Set([modelTemizle(ayar.metinModeli), ...METIN_MODELLERI])];
// Gemini: senaryo (JSON şemalı) + iki konuşmacılı Türkçe seslendirme
import { pcmCoz, bolumle } from './ses.js';

const API = 'https://generativelanguage.googleapis.com/v1beta/models/';

const TEMALAR = [
  'kira zammı muhabbeti', 'eleman bulamamak', 'derbi maçı', 'tatile gidememek', 'kızının düğünü',
  'döviz ve fiyatlar', 'yağmurda kepenk', 'yeni açılan rakip dükkan', 'Instagram reklamları', 'çocukların okul masrafı',
  'gece geç saatte gelen sipariş', 'bayram öncesi yoğunluk', 'esnaf lokantasında öğle', 'sabah ilk çay', 'kaçan müşteriler',
  'telefonu açamamaktan şikayet', 'emekli olunca ne yapacağız', 'zam gelen elektrik faturası', 'yeni çırak', 'Google yorumları',
];
const MEKANLAR = ['kafe', 'dukkan_onu', 'sahil', 'araba', 'yuruyus', 'park', 'durak', 'pazar', 'balik'];
const ZAMANLAR = ['sabah', 'ogle', 'aksam', 'gece'];

const S = (t, extra = {}) => ({ type: t, ...extra });
const KISI = S('OBJECT', {
  properties: {
    isim: S('STRING'), meslek: S('STRING'), isletme_adi: S('STRING'),
    cinsiyet: S('STRING', { enum: ['erkek', 'kadin'] }), yas: S('STRING', { enum: ['genc', 'orta', 'yasli'] }),
  }, required: ['isim', 'meslek', 'isletme_adi', 'cinsiyet', 'yas'],
});
const REPLIK = S('OBJECT', { properties: { kim: S('STRING', { enum: ['A', 'B'] }), metin: S('STRING') }, required: ['kim', 'metin'] });
const CAGRI = S('OBJECT', { properties: { kim: S('STRING', { enum: ['musteri', 'ai'] }), metin: S('STRING') }, required: ['kim', 'metin'] });
const KART = S('OBJECT', { properties: { tur: S('STRING'), baslik: S('STRING'), detay: S('STRING') }, required: ['tur', 'baslik', 'detay'] });

const SEMA = S('OBJECT', {
  properties: {
    baslik: S('STRING'), aciklama: S('STRING'),
    kanca: S('STRING'), kanca_vurgu: S('STRING'),
    mekan: S('STRING', { enum: MEKANLAR }), zaman: S('STRING', { enum: ZAMANLAR }),
    A: KISI, B: KISI,
    giris: S('ARRAY', { items: REPLIK }),
    zil_tepki: REPLIK,
    cagri: S('ARRAY', { items: CAGRI }),
    sonuc: KART,
    saskinlik: REPLIK,
    anlatim: S('ARRAY', { items: REPLIK }),
    kapanis: REPLIK,
    panel_kartlari: S('ARRAY', { items: KART }),
    istatistik: S('OBJECT', {
      properties: { arama: S('INTEGER'), kazanc_etiketi: S('STRING'), kazanc: S('INTEGER'), birim: S('STRING') },
      required: ['arama', 'kazanc_etiketi', 'kazanc', 'birim'],
    }),
  },
  required: ['baslik', 'aciklama', 'kanca', 'kanca_vurgu', 'mekan', 'zaman', 'A', 'B', 'giris', 'zil_tepki', 'cagri',
    'sonuc', 'saskinlik', 'anlatim', 'kapanis', 'panel_kartlari', 'istatistik'],
});

async function istek(ayar, model, govde, deneme = 3, durum = () => { }) {
  for (let i = 0; i < deneme; i++) {
    const r = await fetch(API + model + ':generateContent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': ayar.apiKey.trim() },
      body: JSON.stringify(govde),
    });
    if (r.ok) return r.json();
    const metin = await r.text();
    const gunluk = r.status === 429 && /per ?day|PerDay|daily|RequestsPerDay/i.test(metin);
    if (((r.status === 429 && !gunluk && i === 0) || r.status >= 500) && i < deneme - 1) {
      const bekle = r.status === 429 ? 15 : 6;
      durum(`Gemini yoğun (${r.status}), ${bekle} sn bekleniyor...`);
      await new Promise(res => setTimeout(res, bekle * 1000));
      continue;
    }
    let mesaj = metin;
    try { mesaj = JSON.parse(metin).error.message; } catch { }
    const e = new Error(`Gemini ${r.status}: ${mesaj}`);
    e.durum = r.status;
    throw e;
  }
}

export async function senaryoUret(ayar, gecmis = [], durum = () => { }) {
  const tema = TEMALAR[Math.floor(Math.random() * TEMALAR.length)];
  const sektorler = (ayar.sektorler || '').split(',').map(s => s.trim()).filter(Boolean);
  const sektor = sektorler[Math.floor(Math.random() * sektorler.length)] || 'restoran';
  const mekan = MEKANLAR[Math.floor(Math.random() * MEKANLAR.length)], zaman = ZAMANLAR[Math.floor(Math.random() * 4)];
  const istem = `Sen Instagram Reels/TikTok için viral, komik ve samimi kısa reklam senaryoları yazan bir Türk metin yazarısın.

ÜRÜN: ${ayar.marka}
ÜRÜN AÇIKLAMASI: ${ayar.urun}

HİKAYE KALIBI (her zaman bu sırayla):
1) İki işletme sahibi (A ve B) günlük hayattan sohbet ediyor. Konu: "${tema}". 2-3 kısa replik.
2) A'nın telefonu çalıyor. A telefonu AÇMIYOR, rahat: "zil_tepki" (ör. "Bırak çalsın, o halleder.").
3) Arayan müşteriyle ${ayar.marka} konuşuyor ("cagri"): 3-5 replik, ilk replik ai'nin selamlaması ve A'nın işletme adını söylemesi. Müşteri gerçekçi bir talep iletir (sipariş/randevu/rezervasyon/fiyat), ai halleder ve kısa bir sonuçla bitirir.
4) B şaşırıyor: "saskinlik" (ör. "Nasıl ya?! Kim konuştu o?").
5) A telefonundaki paneli gösterip anlatıyor ("anlatim"): 2-3 replik; ${ayar.marka}'nın ne yaptığını somut, abartısız ve esprili anlatır. İsterse B araya kısa soru sokar.
6) "kapanis": B'nin komik ve ikna olmuş son repliği (ör. "Yarın ilk iş bana da kur!").

KURALLAR:
- A ${sektor} işletiyor. B başka bir sektörde esnaf (farklı ve renkli bir meslek seç).
- Doğal, sokak ağzı ama saygılı, gerçek esnaf Türkçesi. Esprili ol, klişeden kaç.
- HER REPLİK EN FAZLA 12 KELİME. Kısa ve vurucu.
- isimler gerçekçi Türk isimleri. isletme_adi kısa olsun (ör. "Beyzade Kebap").
- mekan: "${mekan}", zaman: "${zaman}" kullan. (kafe=kafede oturuyorlar, dukkan_onu=dükkan önünde taburede çay, sahil=sahilde çay bahçesi, araba=arabada trafikte gidiyorlar (B şoför, A yanında), yuruyus=sokakta birlikte yürüyorlar, park=parkta piknik masasında, durak=otobüs durağında bekliyorlar, pazar=semt pazarında geziyorlar, balik=iskelede balık tutuyorlar). Sohbet bu ortama uygun olsun.
- kanca: videonun ilk 2 saniyesinde ekranda yazacak merak uyandırıcı yazı, en fazla 7 kelime. kanca_vurgu: kancadaki tek bir kelime (vurgulanacak).
- sonuc: çağrının sonucu kartı (tur: "Yeni sipariş" | "Randevu" | "Rezervasyon" | "Teklif"; baslik: kısa detay; detay: saat/adres/kişi gibi).
- panel_kartlari: panelde görünen bugünkü diğer 3 kayıt (aynı sektöre uygun, isimli).
- istatistik: bugünkü arama sayısı (15-80), kazanç etiketi ("Kurtarılan ciro" ya da "Alınan randevu" gibi), kazanç değeri, birim ("₺" ya da "").
- baslik: sosyal medya başlığı (en fazla 70 karakter, emoji olabilir).
- aciklama: Instagram açıklaması: 2-3 cümle + 6-10 alakalı Türkçe hashtag.
${ayar.ekTalimat ? '- EK TALİMAT: ' + ayar.ekTalimat : ''}
${gecmis.length ? 'DAHA ÖNCE YAPILANLAR (bunları TEKRARLAMA, farklı konu/espri bul):\n- ' + gecmis.slice(-15).join('\n- ') : ''}`;

  durum('Senaryo yazılıyor (Gemini)...');
  const modeller = metinModelleri(ayar);
  let son;
  for (const m of [...new Set(modeller)]) {
    try {
      const j = await istek(ayar, m, {
        contents: [{ role: 'user', parts: [{ text: istem }] }],
        generationConfig: { temperature: 1.1, responseMimeType: 'application/json', responseSchema: SEMA },
      }, 3, durum);
      const metin = j.candidates?.[0]?.content?.parts?.map(p => p.text || '').join('') || '';
      return duzelt(JSON.parse(metin), { mekan, zaman });
    } catch (e) {
      son = e;
      if (e.durum === 400 || e.durum === 403) {
        if (/API key|API_KEY|permission/i.test(e.message)) throw new Error('API anahtarı geçersiz. Ayarlardan kontrol et.');
      }
      // yanlış/eskimiş model adı, kota (429) veya geçici hata: sıradaki modeli dene
      if (![400, 404, 429, 500, 503].includes(e.durum)) break;
    }
  }
  throw son;
}

function duzelt(s, vars) {
  const k = (v, d = '') => (typeof v === 'string' ? v.trim() : d);
  const rep = (r, kim) => ({ kim: r?.kim === 'B' ? 'B' : r?.kim === 'A' ? 'A' : kim, metin: k(r?.metin, '...') });
  s.mekan = MEKANLAR.includes(s.mekan) ? s.mekan : vars.mekan;
  s.zaman = ZAMANLAR.includes(s.zaman) ? s.zaman : vars.zaman;
  for (const x of ['A', 'B']) {
    s[x] = s[x] || {};
    s[x].isim = k(s[x].isim, x === 'A' ? 'Mehmet' : 'Ali');
    s[x].meslek = k(s[x].meslek, 'Esnaf');
    s[x].isletme_adi = k(s[x].isletme_adi, s[x].isim + ' Usta');
    s[x].cinsiyet = s[x].cinsiyet === 'kadin' ? 'kadin' : 'erkek';
    s[x].yas = ['genc', 'orta', 'yasli'].includes(s[x].yas) ? s[x].yas : 'orta';
  }
  if (s.A.isim === s.B.isim) s.B.isim += ' Abi';
  s.giris = (s.giris || []).slice(0, 4).map((r, i) => rep(r, i % 2 ? 'B' : 'A'));
  if (!s.giris.length) s.giris = [{ kim: 'B', metin: 'Ee, işler nasıl?' }];
  s.zil_tepki = rep(s.zil_tepki, 'A'); s.zil_tepki.kim = 'A';
  s.cagri = (s.cagri || []).slice(0, 6).map((r, i) => ({ kim: r?.kim === 'musteri' ? 'musteri' : r?.kim === 'ai' ? 'ai' : (i % 2 ? 'musteri' : 'ai'), metin: k(r?.metin, '...') }));
  if (!s.cagri.length) s.cagri = [{ kim: 'ai', metin: 'Merhaba, nasıl yardımcı olabilirim?' }];
  s.saskinlik = rep(s.saskinlik, 'B'); s.saskinlik.kim = 'B';
  s.anlatim = (s.anlatim || []).slice(0, 4).map((r, i) => rep(r, 'A'));
  if (!s.anlatim.length) s.anlatim = [{ kim: 'A', metin: 'Yapay zeka asistanım, telefonlara o bakıyor.' }];
  s.kapanis = rep(s.kapanis, 'B');
  s.sonuc = s.sonuc || { tur: 'Yeni sipariş', baslik: 'Sipariş alındı', detay: '' };
  s.panel_kartlari = (s.panel_kartlari || []).slice(0, 4);
  s.istatistik = s.istatistik || { arama: 38, kazanc_etiketi: 'Kurtarılan ciro', kazanc: 24500, birim: '₺' };
  s.baslik = k(s.baslik, s.kanca);
  s.kanca = k(s.kanca, 'Telefonu açmadı ama sipariş geldi');
  s.aciklama = k(s.aciklama, s.baslik);
  return s;
}

// ---------------------------------------------------------------- seslendirme
const ERKEK = ['Charon', 'Orus', 'Fenrir', 'Algenib', 'Iapetus', 'Puck', 'Alnilam', 'Sadaltager'];
const KADIN = ['Kore', 'Aoede', 'Leda', 'Despina', 'Sulafat', 'Callirrhoe', 'Vindemiatrix'];
const etiket = s => (s || 'Kisi').replace(/ı/g, 'i').replace(/İ/g, 'I').normalize('NFD').replace(/[^A-Za-z0-9]/g, '').slice(0, 14) || 'Kisi';

export function diyalogSirasi(s) {
  return [...s.giris, s.zil_tepki, s.saskinlik, ...s.anlatim, s.kapanis];
}

async function ttsIste(ayar, satirlar, konusmacilar, stil, durum) {
  const model = modelTemizle(ayar.sesModeli, 'gemini-2.5-flash-preview-tts');
  const metin = stil + '\n\n' + satirlar.map(([k, m]) => `${k}: ${m}`).join('\n');
  const j = await istek(ayar, model, {
    contents: [{ parts: [{ text: metin }] }],
    generationConfig: {
      responseModalities: ['AUDIO'],
      speechConfig: {
        multiSpeakerVoiceConfig: {
          speakerVoiceConfigs: konusmacilar.map(([ad, ses]) => ({ speaker: ad, voiceConfig: { prebuiltVoiceConfig: { voiceName: ses } } })),
        },
      },
    },
  }, 4, durum);
  const parca = j.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
  if (!parca) throw new Error('Gemini ses döndürmedi.');
  const hz = +(/rate=(\d+)/.exec(parca.inlineData.mimeType || '')?.[1] || 24000);
  return pcmCoz(parca.inlineData.data, hz);
}

export async function seslendir(ayar, s, durum = () => { }) {
  const rnd = a => a[Math.floor(Math.random() * a.length)];
  const sesSec = (kisi, haric) => rnd((kisi.cinsiyet === 'kadin' ? KADIN : ERKEK).filter(v => v !== haric));
  let eA = etiket(s.A.isim), eB = etiket(s.B.isim);
  if (eA === eB) eB += 'B';
  const vA = sesSec(s.A), vB = sesSec(s.B, vA);
  const diyalog = diyalogSirasi(s);
  durum('Esnaf sohbeti seslendiriliyor...');
  const ham1 = await ttsIste(ayar, diyalog.map(r => [r.kim === 'A' ? eA : eB, r.metin]), [[eA, vA], [eB, vB]],
    'Aşağıda iki Türk esnafının çay içerken yaptığı samimi, esprili, doğal bir sohbet var. Türkçe, günlük konuşma temposunda, ' +
    'duygulu ve canlı seslendir. Şaşırma anında gerçekten şaşır. Her replikten sonra kısa bir duraksama ver.', durum);
  const dParca = bolumle(ham1, diyalog.map(r => r.metin));

  const cagri = [...s.cagri.map(c => [c.kim === 'ai' ? 'Asistan' : 'Musteri', c.metin]), ['Asistan', `${ayar.marka}. ${ayar.slogan || ''}`]];
  const vMus = rnd([...ERKEK.slice(0, 4), ...KADIN.slice(0, 3)]);
  durum('Telefon görüşmesi seslendiriliyor...');
  const ham2 = await ttsIste(ayar, cagri, [['Asistan', ayar.aiSes || 'Zephyr'], ['Musteri', vMus]],
    'Aşağıdaki Türkçe bir telefon görüşmesi: bir işletmenin yapay zeka asistanı (Asistan) gelen aramayı karşılıyor. ' +
    'Asistan sıcak, net, profesyonel ve güler yüzlü; müşteri doğal ve gündelik konuşuyor. Her replik arasında kısa duraksama ver.', durum);
  const cParca = bolumle(ham2, cagri.map(c => c[1]));
  return { diyalog: dParca, cagri: cParca.slice(0, -1), slogan: cParca[cParca.length - 1] };
}
