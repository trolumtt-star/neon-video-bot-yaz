// SİNEMA PLANI: kullanıcının yazdığı istemden (ör. "Çanakkale'de cephede...") sahne sahne film planı.
// Gemini varsa JSON şemayla yazdırır; yoksa anahtar kelimelerden hazır şablon kurar.
import { MEKANLAR, KAMERALAR, TIPLER, EYLEMLER } from './sinemaMotor.js';
import { metinModelleri } from './gemini.js';

const API = 'https://generativelanguage.googleapis.com/v1beta/models/';
export const RUHLAR = ['huzunlu', 'destansi', 'neseli', 'gergin', 'umut'];
const ZAMANLAR = ['safak', 'sabah', 'gun', 'aksam', 'gece', 'bulutlu'];
const EFEKTLER = ['sis', 'duman', 'patlama', 'havai_fisek', 'yagmur', 'kar', 'bulut'];
const OLAYLAR = ['yok', 'siren', 'dur', 'patlama', 'top_atisi', 'gemi_duduk', 'alkis'];
const KONUM = ['ust', 'orta', 'alt'];

export const OZEL_GUNLER = [
  { ad: '10 Kasım', istem: '10 Kasım Atatürk\'ü anma günü. Saat 09.05\'te siren çalar, sokakta herkes durur. Anıtkabir\'de kalabalık saygı duruşunda, bayrak yarıya inmiş. Dede ve torun karanfil bırakır.' },
  { ad: '18 Mart', istem: '18 Mart Çanakkale Zaferi. Çanakkale\'de cephede siperlerde bekleyen askerler, top atışları, duman. Askerler hücuma kalkar, tepede bayrak dalgalanır. Şehitlerimizi rahmetle anıyoruz.' },
  { ad: '23 Nisan', istem: '23 Nisan Ulusal Egemenlik ve Çocuk Bayramı. Okul bahçesinde bayraklarla el sallayan çocuklar, meydanda kutlama, neşeli bir gün.' },
  { ad: '19 Mayıs', istem: '19 Mayıs Atatürk\'ü Anma, Gençlik ve Spor Bayramı. Samsun sahilinde bir vapur yanaşır, gençler bayraklarla koşar, tepede dev bayrak.' },
  { ad: '30 Ağustos', istem: '30 Ağustos Zafer Bayramı. Şafakta cephede askerler hücuma kalkar, bayrakla tepeye koşarlar, zafer.' },
  { ad: '29 Ekim', istem: '29 Ekim Cumhuriyet Bayramı. Gece meydanda bayraklarla kutlama, havai fişekler, okul çocukları, dev bayrak. Cumhuriyetimiz 103 yaşında.' },
  { ad: 'Yılbaşı', istem: 'Yeni yıl kutlaması. Karlı bir gece sokakta insanlar, meydanda havai fişekler, mutlu yıllar mesajı.' },
  { ad: 'Reklam', istem: 'İşletmemizi tanıtan kısa ve etkileyici bir reklam. Sabah sokakta yoğun esnaf hayatı, meydanda kalabalık, mesaj: telefonlarınızı yapay zeka açsın.' },
];

const S = (t, e = {}) => ({ type: t, ...e });
const SEMA = S('OBJECT', {
  properties: {
    baslik: S('STRING'), aciklama: S('STRING'),
    muzik: S('STRING', { enum: RUHLAR }),
    sahneler: S('ARRAY', {
      items: S('OBJECT', {
        properties: {
          mekan: S('STRING', { enum: MEKANLAR }), sure: S('NUMBER'), zaman: S('STRING', { enum: ZAMANLAR }),
          kamera: S('STRING', { enum: KAMERALAR }), efekt: S('ARRAY', { items: S('STRING', { enum: EFEKTLER }) }),
          olay: S('STRING', { enum: OLAYLAR }),
          karakterler: S('ARRAY', { items: S('OBJECT', { properties: { tip: S('STRING', { enum: TIPLER }), eylem: S('STRING', { enum: EYLEMLER }), adet: S('INTEGER') }, required: ['tip', 'eylem', 'adet'] }) }),
          yazi: S('STRING'), yaziKonum: S('STRING', { enum: KONUM }), vurgu: S('BOOLEAN'),
          alinti: S('STRING'), alintiKimden: S('STRING'), yariBayrak: S('BOOLEAN'),
        }, required: ['mekan', 'sure', 'zaman', 'kamera', 'efekt', 'olay', 'karakterler', 'yazi', 'yaziKonum'],
      }),
    }),
    kapanis: S('OBJECT', { properties: { baslik: S('STRING'), alt: S('STRING'), bayrak: S('BOOLEAN') }, required: ['baslik', 'alt', 'bayrak'] }),
  }, required: ['baslik', 'aciklama', 'muzik', 'sahneler', 'kapanis'],
});

const TALIMAT = (ayar, istem, varyant) => `Sen kısa dikey sinematik video yönetmenisin. Kullanıcının anlattığından 3D animasyon için sahne planı yaz.
KULLANICININ İSTEĞİ: """${istem}"""
Marka (sondaki kapanış kartında gösterilecek): ${ayar.marka || 'Dinlio AI'}

Kullanabileceğin MEKANLAR (sadece bunlar):
- sokak: bayraklı şehir sokağı, binalar, araba, sokak saati (siren/dur anı için ideal)
- anitkabir: Anıtkabir, tören meydanı, merdivenler, bayrak direği, çelenkler
- cephe: Çanakkale/Kurtuluş Savaşı cephesi, kum torbalı siperler, tepeler, duman (savaş, asker, hücum için)
- meydan: şehir meydanı, binalarda dev bayrak, anıt, kalabalık (kutlama, bayram için; gece + havai_fisek çok iyi durur)
- okul: okul binası, bahçe, bayrak direği, ağaçlar (çocuklar, öğrenciler, 23 Nisan)
- sahil: deniz, dalgalar, uzakta geçen vapur (19 Mayıs Samsun, deniz)
- tepe: yeşil tepe üstünde dev bayrak, geniş gökyüzü (zafer, umut, kapanışa yakın)
- siyah: düz siyah ekran, sadece yazı (açılış/tarih kartı için)
KARAKTER tipleri: ${TIPLER.join(', ')}. EYLEMLER: ${EYLEMLER.join(', ')} (bayrak = elinde bayrakla, nisan = tüfekle nişan, selam = asker selamı, kalp = el kalpte saygı).
KAMERA: ${KAMERALAR.join(', ')}. ZAMAN: ${ZAMANLAR.join(', ')}. EFEKT: ${EFEKTLER.join(', ')}. OLAY: ${OLAYLAR.join(', ')} (siren: siren çalar ve yürüyenler durur).

KURALLAR:
- 5 ile 8 sahne, her sahne 3.5-8 saniye; toplam 30-55 saniye. Hikâye bir akışla ilerlesin, ilk sahne merak uyandırsın.
- Kullanıcının anlattığı yer ve olay mutlaka doğru mekanda geçsin (ör. "Çanakkale'de savaşırken" -> cephe; askerler asker tipi).
- Kalabalık sahnede adet 15-60; yakın sahnede 1-3 kişi. Aynı sahnede en fazla 3 karakter grubu.
- yazi: ekranda çıkan kısa, etkileyici Türkçe cümle (en çok 60 karakter). Bazı sahnelerde boş bırakabilirsin. vurgu=true sadece tek kelime/rakam gibi çok kısa ve büyük yazılar için (ör. "09.05", "1915").
- alinti: gerekiyorsa tarihi, gerçek ve doğru bir söz (ör. Atatürk'ün bilinen sözleri); emin değilsen boş bırak. Uydurma söz yazma.
- Atatürk'ü veya gerçek tarihi kişileri KARAKTER olarak canlandırma; onları sözler, bayrak, Anıtkabir ve insanların saygısıyla anlat.
- Anma günlerinde (10 Kasım, şehitler) ton saygılı, müzik huzunlu; bayramlarda neşeli/umut; savaş-hücum destansi.
- yariBayrak sadece yas/anma günlerinde true.
- kapanis.baslik: marka adını içermeden kısa mesaj (ör. "10 Kasım'ı saygı ve özlemle anıyor."). kapanis.alt: tarih ya da kısa slogan. Milli günlerde bayrak=true.
- aciklama: Instagram açıklaması + 5-8 hashtag.
${varyant ? `- Bu ${varyant}. versiyon: öncekilerden farklı bir kurgu, farklı kamera ve sahne sırası dene.` : ''}`;

export async function planGemini(ayar, istem, varyant = 0, durum = () => { }) {
  let son = null;
  for (const model of metinModelleri(ayar)) {
    for (let i = 0; i < 2; i++) {
      const r = await fetch(API + model + ':generateContent', {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': ayar.apiKey.trim() },
        body: JSON.stringify({ contents: [{ parts: [{ text: TALIMAT(ayar, istem, varyant) }] }], generationConfig: { responseMimeType: 'application/json', responseSchema: SEMA, temperature: 1 } }),
      });
      if (r.ok) { const j = await r.json(); const txt = j.candidates?.[0]?.content?.parts?.map(p => p.text || '').join('') || ''; if (txt) return JSON.parse(txt); son = new Error(model + ': boş cevap'); break; }
      let m = await r.text(); try { m = JSON.parse(m).error.message; } catch { }
      if ((r.status === 400 || r.status === 403) && /API key|API_KEY|permission/i.test(m)) throw new Error('API anahtarı geçersiz. Ayarlardan kontrol et.');
      son = new Error(`Gemini ${r.status} (${model}): ${m}`);
      if (r.status >= 500 && i === 0) { durum(`Gemini yoğun (${model}), tekrar deneniyor…`); await new Promise(res => setTimeout(res, 4000)); continue; }
      if (r.status === 429) durum(`${model} kotası doldu, sıradaki model deneniyor…`);
      break; // 400/404/429: sıradaki model
    }
  }
  throw son || new Error('Gemini cevap vermedi');
}

// ------------------------------------------------------------ internetsiz şablonlar
const sh = (mekan, sure, o = {}) => ({ mekan, sure, zaman: 'sabah', kamera: 'yaklas', efekt: [], olay: 'yok', karakterler: [], yazi: '', yaziKonum: 'alt', ...o });
const K = (tip, eylem, adet) => ({ tip, eylem, adet });
const SABLON = {
  '10kasim': () => ({ baslik: '10 Kasım', muzik: 'huzunlu', sahneler: [
    sh('siyah', 3.5, { yazi: '10 KASIM', vurgu: true, yaziKonum: 'orta' }),
    sh('sokak', 10, { olay: 'siren', saat: [9, 4], karakterler: [K('garson', 'yuru', 1), K('kadin', 'yuru', 1), K('cocuk', 'yuru', 1), K('sivil', 'yuru', 1), K('yasli', 'yuru', 1)], yazi: 'Bir ülke durur. Ve susar.' }),
    sh('anitkabir', 7, { zaman: 'bulutlu', kamera: 'yuksel', yariBayrak: true, karakterler: [K('sivil', 'dur', 60)], yazi: 'Bugün sadece dinliyoruz.' }),
    sh('anitkabir', 7, { zaman: 'bulutlu', kamera: 'yaklas', yariBayrak: true, karakterler: [K('sivil', 'dur', 40)], alinti: 'Benim naçiz vücudum elbet bir gün toprak olacaktır, ancak Türkiye Cumhuriyeti ilelebet payidar kalacaktır.', alintiKimden: 'Mustafa Kemal Atatürk' }),
    sh('anitkabir', 7, { zaman: 'bulutlu', kamera: 'takip', yariBayrak: true, karakterler: [K('yasli', 'kalp', 1), K('cocuk', 'cicek', 1)], yazi: 'Unutmadık. Unutmayacağız.', yaziKonum: 'ust' }),
  ], kapanis: { baslik: '10 Kasım\'ı saygı ve özlemle anıyor.', alt: '1881 – 1938', bayrak: true } }),
  '18mart': () => ({ baslik: '18 Mart Çanakkale', muzik: 'destansi', sahneler: [
    sh('siyah', 3.5, { yazi: '1915', vurgu: true, yaziKonum: 'orta' }),
    sh('cephe', 7, { zaman: 'safak', kamera: 'yaklas', efekt: ['duman', 'sis'], karakterler: [K('asker', 'nisan', 3)], yazi: 'Çanakkale. Şafak sökerken…' }),
    sh('cephe', 6, { zaman: 'safak', kamera: 'pan_sag', efekt: ['duman', 'patlama'], olay: 'top_atisi', karakterler: [K('asker', 'dur', 24)], yazi: 'Toplar gürledi, kimse geri adım atmadı.' }),
    sh('cephe', 6.5, { zaman: 'safak', kamera: 'takip', efekt: ['duman'], karakterler: [K('asker', 'kos', 3)], yazi: 'Bir milletin destanı yazıldı.' }),
    sh('tepe', 7, { zaman: 'aksam', kamera: 'yuksel', karakterler: [K('asker', 'selam', 2)], alinti: 'Ben size taarruzu emretmiyorum, ölmeyi emrediyorum!', alintiKimden: 'Mustafa Kemal, Çanakkale 1915' }),
  ], kapanis: { baslik: '18 Mart Çanakkale Zaferi\'nin yıl dönümünde şehitlerimizi rahmetle anıyor.', alt: '18 Mart 1915', bayrak: true } }),
  '23nisan': () => ({ baslik: '23 Nisan', muzik: 'neseli', sahneler: [
    sh('okul', 6.5, { zaman: 'gun', kamera: 'yaklas', karakterler: [K('ogrenci', 'el_salla', 30)], yazi: 'Bugün bayram!' }),
    sh('okul', 6, { zaman: 'gun', kamera: 'takip', karakterler: [K('cocuk', 'bayrak', 2), K('ogrenci', 'kos', 1)], yazi: 'Egemenlik kayıtsız şartsız milletindir.' }),
    sh('meydan', 7, { zaman: 'gun', kamera: 'yuksel', olay: 'alkis', karakterler: [K('cocuk', 'el_salla', 30), K('sivil', 'alkis', 20)], yazi: 'Geleceğimiz onların ellerinde.' }),
    sh('tepe', 6, { zaman: 'gun', kamera: 'yuksel', karakterler: [K('cocuk', 'el_salla', 3)] }),
  ], kapanis: { baslik: '23 Nisan Ulusal Egemenlik ve Çocuk Bayramı kutlu olsun!', alt: '23 Nisan 1920', bayrak: true } }),
  '19mayis': () => ({ baslik: '19 Mayıs', muzik: 'umut', sahneler: [
    sh('sahil', 7, { zaman: 'safak', kamera: 'yaklas', olay: 'gemi_duduk', yazi: 'Samsun. 19 Mayıs 1919.' }),
    sh('sahil', 6, { zaman: 'sabah', kamera: 'takip', karakterler: [K('sporcu', 'kos', 3)], yazi: 'Bir yolculuk başladı.' }),
    sh('meydan', 6.5, { zaman: 'gun', kamera: 'yuksel', karakterler: [K('sporcu', 'bayrak', 20), K('sivil', 'alkis', 20)], yazi: 'Gençlik, istikbal sensin!' }),
    sh('tepe', 6.5, { zaman: 'gun', kamera: 'yuksel', karakterler: [K('sporcu', 'el_salla', 3)], alinti: 'Ey Türk gençliği! Birinci vazifen, Türk istiklâlini, Türk Cumhuriyetini, ilelebet muhafaza ve müdafaa etmektir.', alintiKimden: 'Mustafa Kemal Atatürk' }),
  ], kapanis: { baslik: '19 Mayıs Atatürk\'ü Anma, Gençlik ve Spor Bayramı kutlu olsun!', alt: '19 Mayıs 1919', bayrak: true } }),
  '30agustos': () => ({ baslik: '30 Ağustos', muzik: 'destansi', sahneler: [
    sh('siyah', 3.5, { yazi: '26 AĞUSTOS 1922', vurgu: true, yaziKonum: 'orta' }),
    sh('cephe', 6.5, { zaman: 'safak', kamera: 'yaklas', efekt: ['sis', 'duman'], karakterler: [K('asker', 'nisan', 3)], yazi: 'Büyük Taarruz başlıyor.' }),
    sh('cephe', 6.5, { zaman: 'safak', kamera: 'takip', efekt: ['duman', 'patlama'], olay: 'top_atisi', karakterler: [K('asker', 'kos', 3), K('asker', 'kos', 20)], yazi: 'Ordular! İlk hedefiniz Akdeniz\'dir. İleri!' }),
    sh('tepe', 7, { zaman: 'gun', kamera: 'yuksel', karakterler: [K('asker', 'bayrak', 1), K('asker', 'selam', 2)], yazi: 'Ve zafer.' }),
  ], kapanis: { baslik: '30 Ağustos Zafer Bayramı kutlu olsun!', alt: '30 Ağustos 1922', bayrak: true } }),
  '29ekim': () => ({ baslik: '29 Ekim', muzik: 'neseli', sahneler: [
    sh('siyah', 3.5, { yazi: '29 EKİM 1923', vurgu: true, yaziKonum: 'orta' }),
    sh('sokak', 6.5, { zaman: 'aksam', kamera: 'yaklas', karakterler: [K('sivil', 'bayrak', 2), K('cocuk', 'yuru', 1), K('kadin', 'yuru', 1)], yazi: 'Bütün şehir bayram yeri.' }),
    sh('meydan', 7.5, { zaman: 'gece', kamera: 'yuksel', efekt: ['havai_fisek'], olay: 'alkis', karakterler: [K('sivil', 'el_salla', 40), K('kadin', 'alkis', 15)], yazi: 'Cumhuriyet, en büyük eserimiz.' }),
    sh('okul', 6, { zaman: 'gun', kamera: 'takip', karakterler: [K('ogrenci', 'bayrak', 2), K('ogrenci', 'el_salla', 20)] }),
    sh('tepe', 6.5, { zaman: 'aksam', kamera: 'yuksel', karakterler: [K('sivil', 'selam', 2)], alinti: 'Cumhuriyet, fikren, ilmen, fennen, bedenen kuvvetli ve yüksek seciyeli muhafızlar ister.', alintiKimden: 'Mustafa Kemal Atatürk' }),
  ], kapanis: { baslik: 'Cumhuriyet Bayramımız kutlu olsun!', alt: '29 Ekim 1923', bayrak: true } }),
  'yilbasi': () => ({ baslik: 'Yeni Yıl', muzik: 'neseli', sahneler: [
    sh('sokak', 6.5, { zaman: 'gece', kamera: 'yaklas', efekt: ['kar'], bayrak: false, karakterler: [K('kadin', 'yuru', 1), K('sivil', 'yuru', 2), K('cocuk', 'yuru', 1)], yazi: 'Yeni bir yıl kapıda…' }),
    sh('meydan', 7, { zaman: 'gece', kamera: 'yuksel', efekt: ['havai_fisek', 'kar'], olay: 'alkis', karakterler: [K('sivil', 'el_salla', 40)], yazi: '3… 2… 1…', vurgu: false }),
  ], kapanis: { baslik: 'Mutlu yıllar! Yeni yılda da hep yanınızdayız.', alt: '', bayrak: false } }),
};
const ANAHTAR = [
  [/10\s*kas[ıi]m|anıtkabir|anitkabir|09[.:]05/i, '10kasim'], [/18\s*mart|çanakkale|canakkale|1915/i, '18mart'], [/23\s*nisan|çocuk bayram/i, '23nisan'],
  [/19\s*may[ıi]s|samsun|gençlik ve spor/i, '19mayis'], [/30\s*a[gğ]ustos|zafer bayram|büyük taarruz|buyuk taarruz/i, '30agustos'],
  [/29\s*ekim|cumhuriyet bayram/i, '29ekim'], [/y[ıi]lba[sş][ıi]|yeni y[ıi]l/i, 'yilbasi'],
];
const MEKAN_IPUCU = [
  [/cephe|siper|sava[sş]|asker|hücum|hucum|taarruz/i, 'cephe'], [/anıtkabir|anitkabir|anıt/i, 'anitkabir'], [/okul|öğrenci|ogrenci|çocuk|cocuk/i, 'okul'],
  [/deniz|sahil|vapur|gemi|liman/i, 'sahil'], [/meydan|kutlama|bayram|konser|kalabal/i, 'meydan'], [/tepe|da[gğ]|zirve/i, 'tepe'], [/sokak|cadde|şehir|sehir|esnaf|dükkan/i, 'sokak'],
];
export function planYerel(istem, ayar, varyant = 0) {
  const s = String(istem || '');
  for (const [re, k] of ANAHTAR) if (re.test(s)) { const p = SABLON[k](); if (varyant % 2) p.sahneler = p.sahneler.map(x => ({ ...x, kamera: x.kamera === 'yaklas' ? 'pan_sag' : x.kamera === 'yuksel' ? 'yaklas' : x.kamera })); p.aciklama = `${p.baslik}\n\n#${p.baslik.replace(/\s/g, '')} #türkiye #keşfet #reels`; return p; }
  let mekan = 'sokak'; for (const [re, m] of MEKAN_IPUCU) if (re.test(s)) { mekan = m; break; }
  const cumle = s.split(/[.!?\n]/).map(x => x.trim()).filter(Boolean);
  const asker = mekan === 'cephe', tip = asker ? 'asker' : mekan === 'okul' ? 'ogrenci' : 'sivil';
  const sahneler = [
    sh('siyah', 3.5, { yazi: (cumle[0] || 'Bir hikâye…').slice(0, 60), yaziKonum: 'orta' }),
    sh(mekan, 7, { zaman: asker ? 'safak' : 'sabah', kamera: 'yaklas', efekt: asker ? ['duman'] : [], karakterler: [K(tip, asker ? 'nisan' : 'yuru', 3)], yazi: (cumle[1] || '').slice(0, 60) }),
    sh(mekan, 6.5, { zaman: asker ? 'safak' : 'gun', kamera: 'yuksel', efekt: asker ? ['duman', 'patlama'] : [], olay: asker ? 'top_atisi' : 'yok', karakterler: [K(tip, asker ? 'kos' : 'dur', 30)], yazi: (cumle[2] || '').slice(0, 60) }),
    sh('tepe', 6.5, { zaman: 'aksam', kamera: 'yuksel', karakterler: [K(tip, 'selam', 2)], yazi: (cumle[3] || '').slice(0, 60) }),
  ];
  return { baslik: (cumle[0] || 'Video').slice(0, 40), aciklama: s.slice(0, 200), muzik: asker ? 'destansi' : 'umut', sahneler, kapanis: { baslik: cumle[4] || 'Saygıyla.', alt: '', bayrak: true } };
}

// ------------------------------------------------------------ normalize: süreler, zamanlama
export function planHazirla(ham, ayar, tohum = Date.now() % 100000) {
  const p = { baslik: ham.baslik || 'Video', aciklama: ham.aciklama || '', muzik: RUHLAR.includes(ham.muzik) ? ham.muzik : 'umut', marka: ayar.marka || 'Dinlio AI', tohum };
  let t = 0;
  p.sahneler = (ham.sahneler || []).slice(0, 9).map(x => {
    const s = {
      mekan: MEKANLAR.includes(x.mekan) ? x.mekan : 'sokak', sure: Math.max(3, Math.min(10, +x.sure || 6)),
      zaman: ZAMANLAR.includes(x.zaman) ? x.zaman : 'sabah', kamera: KAMERALAR.includes(x.kamera) ? x.kamera : 'yaklas',
      efekt: (x.efekt || []).filter(e => EFEKTLER.includes(e)), olay: OLAYLAR.includes(x.olay) ? x.olay : 'yok',
      karakterler: (x.karakterler || []).slice(0, 3).map(k => ({ tip: TIPLER.includes(k.tip) ? k.tip : 'sivil', eylem: EYLEMLER.includes(k.eylem) ? k.eylem : 'dur', adet: Math.max(1, Math.min(70, k.adet | 0 || 1)) })),
      yazi: String(x.yazi || '').slice(0, 90), yaziKonum: KONUM.includes(x.yaziKonum) ? x.yaziKonum : 'alt', vurgu: !!x.vurgu && String(x.yazi || '').length <= 16,
      alinti: String(x.alinti || '').slice(0, 220), alintiKimden: String(x.alintiKimden || '').slice(0, 60), yariBayrak: !!x.yariBayrak,
      bayrak: x.bayrak, saat: x.saat || (x.olay === 'siren' ? [9, 4] : null),
    };
    if (s.alinti && s.yazi && s.yaziKonum === 'ust') s.yaziKonum = 'alt';
    if (s.alinti) s.sure = Math.max(s.sure, 6.5);
    s.bas = t; t += s.sure;
    if (s.olay === 'siren' || s.olay === 'dur') s.durAni = s.bas + Math.min(3, s.sure * .35);
    return s;
  });
  if (!p.sahneler.length) return planHazirla(planYerel('', ayar), ayar, tohum);
  p.kapanisBas = t; p.kapanis = { baslik: ham.kapanis?.baslik || '', alt: ham.kapanis?.alt || '', bayrak: ham.kapanis?.bayrak !== false };
  p.sure = t + 7;
  return p;
}
