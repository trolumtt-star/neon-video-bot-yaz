// Kullanıcının yazdığı düz metin senaryoyu video senaryosuna çevirir (ve tersi).
//
// ÖRNEK:
//   BAŞLIK: Trafikte sipariş kaçar mı? 🚗
//   KANCA: Direksiyondayken sipariş geldi
//   VURGU: sipariş
//   MEKAN: araba            (kafe · dukkan · sahil · araba · yuruyus · park · durak · pazar · balik)
//   ZAMAN: aksam            (sabah · ogle · aksam · gece)
//   A: Mehmet | Kebapçı | Beyzade Kebap | erkek | orta
//   B: Ali | Berber | erkek | yasli
//   B: Bu trafik bitmez abi.
//   A: Bitmez ama benim işler yürüyor.
//   ZİL
//   A: Bırak çalsın, o halleder.
//   MÜŞTERİ: İki adana alabilir miyim?
//   AI: Tabii! Adresiniz neresi?
//   SONUÇ: Yeni sipariş | 2 adana dürüm | Atatürk Bulvarı 48
//   B: Nasıl ya?! Kim konuştu o?
//   PANEL
//   A: Yapay zeka asistanım, telefonlara o bakıyor.
//   B: Yarın bana da kur!

const MEKAN_ESLE = { kafe: 'kafe', 'kafe içi': 'kafe', dukkan: 'dukkan_onu', 'dükkan': 'dukkan_onu', 'dukkan_onu': 'dukkan_onu', 'dükkan önü': 'dukkan_onu',
  sahil: 'sahil', deniz: 'sahil', araba: 'araba', 'araç': 'araba', arac: 'araba', trafik: 'araba',
  yuruyus: 'yuruyus', 'yürüyüş': 'yuruyus', yurume: 'yuruyus', 'yürüme': 'yuruyus', sokak: 'yuruyus', 'cadde': 'yuruyus',
  park: 'park', bahce: 'park', piknik: 'park', durak: 'durak', otobus: 'durak', 'otobus duragi': 'durak',
  pazar: 'pazar', 'pazar yeri': 'pazar', balik: 'balik', 'balik tutma': 'balik', iskele: 'balik', olta: 'balik' };
const ZAMAN_ESLE = { sabah: 'sabah', ogle: 'ogle', 'öğle': 'ogle', 'öğlen': 'ogle', ogle_: 'ogle', aksam: 'aksam', 'akşam': 'aksam', gece: 'gece' };
const kucuk = s => (s || '').toLocaleLowerCase('tr-TR').trim();
const ascii = s => kucuk(s).replace(/ı/g, 'i').replace(/ş/g, 's').replace(/ç/g, 'c').replace(/ğ/g, 'g').replace(/ö/g, 'o').replace(/ü/g, 'u');

function kisiOku(metin, harf) {
  const p = metin.split('|').map(x => x.trim());
  const k = { isim: p[0] || (harf === 'A' ? 'Mehmet' : 'Ali'), meslek: p[1] || 'Esnaf', isletme_adi: '', cinsiyet: 'erkek', yas: 'orta' };
  for (const x of p.slice(2)) {
    const a = ascii(x);
    if (['erkek', 'adam', 'e'].includes(a)) k.cinsiyet = 'erkek';
    else if (['kadin', 'kiz', 'bayan', 'k'].includes(a)) k.cinsiyet = 'kadin';
    else if (['genc', 'orta', 'yasli'].includes(a)) k.yas = a;
    else if (x) k.isletme_adi = x;
  }
  if (!k.isletme_adi) k.isletme_adi = `${k.isim} ${k.meslek}`;
  return k;
}

export function metniCoz(metin) {
  const s = { baslik: '', kanca: '', kanca_vurgu: '', mekan: 'dukkan_onu', zaman: 'ogle', aciklama: '', panel_kartlari: [] };
  const hatalar = [];
  const akis = []; // {tip:'rep'|'zil'|'panel'|'cagri', kim, metin}
  let kisiA = null, kisiB = null;
  for (const hamSatir of String(metin).split(/\r?\n/)) {
    const satir = hamSatir.trim();
    if (!satir || satir.startsWith('#') || satir.startsWith('//')) continue;
    const m = /^([^:]{1,14}):\s*(.*)$/.exec(satir);
    const anahtar = m ? ascii(m[1]) : ascii(satir);
    const deger = m ? m[2].trim() : '';
    if (!m) {
      if (/^zil|^telefon cal|^ring/.test(anahtar)) akis.push({ tip: 'zil' });
      else if (/^panel/.test(anahtar)) akis.push({ tip: 'panel' });
      else hatalar.push(`Anlaşılmadı: "${satir}"`);
      continue;
    }
    switch (anahtar) {
      case 'baslik': s.baslik = deger; break;
      case 'kanca': s.kanca = deger; break;
      case 'vurgu': s.kanca_vurgu = deger; break;
      case 'aciklama': s.aciklama = deger; break;
      case 'mekan': s.mekan = MEKAN_ESLE[kucuk(deger)] || MEKAN_ESLE[ascii(deger)] || (hatalar.push(`Mekan bilinmiyor: ${deger} (kafe, dukkan, sahil, araba, yuruyus, park, durak, pazar, balik)`), 'dukkan_onu'); break;
      case 'zaman': s.zaman = ZAMAN_ESLE[kucuk(deger)] || ZAMAN_ESLE[ascii(deger)] || 'ogle'; break;
      case 'a': case 'b': {
        const harf = anahtar.toUpperCase();
        if (deger.includes('|')) { if (harf === 'A') kisiA = kisiOku(deger, 'A'); else kisiB = kisiOku(deger, 'B'); }
        else if (deger) akis.push({ tip: 'rep', kim: harf, metin: deger });
        break;
      }
      case 'musteri': case 'arayan': akis.push({ tip: 'cagri', kim: 'musteri', metin: deger }); break;
      case 'ai': case 'yapay zeka': case 'asistan': case 'bot': akis.push({ tip: 'cagri', kim: 'ai', metin: deger }); break;
      case 'sonuc': { const p = deger.split('|').map(x => x.trim()); s.sonuc = { tur: p[0] || 'Yeni kayıt', baslik: p[1] || '', detay: p[2] || '' }; break; }
      case 'kayit': { const p = deger.split('|').map(x => x.trim()); s.panel_kartlari.push({ tur: p[0] || 'Kayıt', baslik: p[1] || '', detay: p[2] || '' }); break; }
      case 'istatistik': { const p = deger.split('|').map(x => x.trim()); s.istatistik = { arama: parseInt(p[0]) || 38, kazanc_etiketi: p[1] || 'Kurtarılan ciro', kazanc: parseInt((p[2] || '').replace(/\D/g, '')) || 0, birim: p[3] ?? '₺' }; break; }
      default:
        hatalar.push(`Bilinmeyen satır: "${satir}"`);
    }
  }
  s.A = kisiA || kisiOku('Mehmet | Esnaf', 'A');
  s.B = kisiB || kisiOku('Ali | Esnaf', 'B');

  // akışı bölümlere ayır
  const ilkCagri = akis.findIndex(e => e.tip === 'cagri');
  if (ilkCagri < 0) hatalar.push('En az bir "AI:" satırı lazım (telefondaki yapay zekanın konuşması).');
  let sonCagri = -1; akis.forEach((e, i) => { if (e.tip === 'cagri') sonCagri = i; });
  const zilI = akis.findIndex(e => e.tip === 'zil');
  const once = akis.slice(0, ilkCagri < 0 ? akis.length : ilkCagri);
  let giris, zil_tepki;
  if (zilI >= 0 && zilI < (ilkCagri < 0 ? akis.length : ilkCagri)) {
    giris = once.slice(0, zilI).filter(e => e.tip === 'rep');
    const sonra = once.slice(zilI + 1).filter(e => e.tip === 'rep');
    zil_tepki = sonra[0];
    if (sonra.length > 1) giris = giris.concat(sonra.slice(0, -1)), zil_tepki = sonra[sonra.length - 1];
  } else {
    const reps = once.filter(e => e.tip === 'rep');
    const sonA = [...reps].reverse().find(e => e.kim === 'A');
    zil_tepki = sonA; giris = reps.filter(e => e !== sonA);
  }
  s.giris = (giris || []).map(r => ({ kim: r.kim, metin: r.metin }));
  if (!s.giris.length) s.giris = [{ kim: 'B', metin: 'Ee, işler nasıl gidiyor?' }];
  s.zil_tepki = zil_tepki ? { kim: 'A', metin: zil_tepki.metin } : { kim: 'A', metin: 'Bırak çalsın, o halleder.' };
  s.cagri = akis.filter(e => e.tip === 'cagri').map(e => ({ kim: e.kim, metin: e.metin }));
  const sonrasi = sonCagri >= 0 ? akis.slice(sonCagri + 1) : [];
  const panelI = sonrasi.findIndex(e => e.tip === 'panel');
  let saskin, anlat;
  const reps2 = sonrasi.filter(e => e.tip === 'rep');
  if (panelI >= 0) {
    const panelOnce = sonrasi.slice(0, panelI).filter(e => e.tip === 'rep');
    saskin = panelOnce[0];
    anlat = panelOnce.slice(1).concat(sonrasi.slice(panelI + 1).filter(e => e.tip === 'rep'));
  } else { saskin = reps2[0]; anlat = reps2.slice(1); }
  s.saskinlik = saskin ? { kim: saskin.kim, metin: saskin.metin } : { kim: 'B', metin: 'Nasıl ya?! Kim konuştu o?' };
  s.saskinlik.kim = 'B';
  if (anlat.length >= 2) { s.kapanis = { kim: anlat[anlat.length - 1].kim, metin: anlat[anlat.length - 1].metin }; anlat = anlat.slice(0, -1); }
  else s.kapanis = { kim: 'B', metin: 'Bana da lazım bu!' };
  s.anlatim = anlat.length ? anlat.map(r => ({ kim: r.kim, metin: r.metin })) : [{ kim: 'A', metin: 'Yapay zeka asistanım, telefonlara o bakıyor.' }];

  if (!s.sonuc) {
    const sonAi = [...s.cagri].reverse().find(c => c.kim === 'ai');
    s.sonuc = { tur: 'Yeni kayıt', baslik: (sonAi?.metin || 'Talep alındı').slice(0, 40), detay: '' };
  }
  if (!s.panel_kartlari.length) s.panel_kartlari = [
    { tur: 'Randevu', baslik: 'Elif Y. · Cuma 14:00', detay: '' },
    { tur: 'Yeni sipariş', baslik: 'Can T. · Paket', detay: '' },
    { tur: 'Bilgi', baslik: 'Fiyat soruldu · yanıtlandı', detay: '' }];
  if (!s.istatistik) s.istatistik = { arama: 38, kazanc_etiketi: 'Kurtarılan ciro', kazanc: 21500, birim: '₺' };
  if (!s.kanca) s.kanca = 'Telefonu açmadı ama işi halletti';
  if (!s.baslik) s.baslik = s.kanca;
  return { senaryo: s, hatalar };
}

const MEKAN_YAZ = { kafe: 'kafe', dukkan_onu: 'dukkan', sahil: 'sahil', araba: 'araba', yuruyus: 'yuruyus', park: 'park', durak: 'durak', pazar: 'pazar', balik: 'balik' };
export function metneCevir(s) {
  const kisi = (h, k) => `${h}: ${k.isim} | ${k.meslek} | ${k.isletme_adi} | ${k.cinsiyet} | ${k.yas}`;
  const r = x => `${x.kim}: ${x.metin}`;
  const sat = [
    `BAŞLIK: ${s.baslik || ''}`, `KANCA: ${s.kanca || ''}`, `VURGU: ${s.kanca_vurgu || ''}`,
    `MEKAN: ${MEKAN_YAZ[s.mekan] || 'dukkan'}`, `ZAMAN: ${s.zaman || 'ogle'}`,
    kisi('A', s.A), kisi('B', s.B), '',
    ...s.giris.map(r), 'ZİL', r(s.zil_tepki),
    ...s.cagri.map(c => `${c.kim === 'ai' ? 'AI' : 'MÜŞTERİ'}: ${c.metin}`),
    `SONUÇ: ${s.sonuc?.tur || ''} | ${s.sonuc?.baslik || ''} | ${s.sonuc?.detay || ''}`,
    r(s.saskinlik), 'PANEL', ...s.anlatim.map(r), r(s.kapanis), '',
    ...(s.panel_kartlari || []).map(k => `KAYIT: ${k.tur} | ${k.baslik} | ${k.detay || ''}`),
    s.istatistik ? `İSTATİSTİK: ${s.istatistik.arama} | ${s.istatistik.kazanc_etiketi} | ${s.istatistik.kazanc} | ${s.istatistik.birim}` : '',
  ];
  if (s.aciklama) sat.push(`AÇIKLAMA: ${s.aciklama.replace(/\n+/g, ' ')}`);
  return sat.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

export const BOS_SABLON = `BAŞLIK: Videonun başlığı
KANCA: Videonun başında yazacak cümle
VURGU: kelime
MEKAN: araba
ZAMAN: aksam
A: Mehmet | Kebapçı | Beyzade Kebap | erkek | orta
B: Ali | Berber | erkek | yasli

B: Bu trafik hiç bitmez abi.
A: Bitmez ama benim işler yürüyor.
ZİL
A: Bırak çalsın, o halleder.
MÜŞTERİ: İki adana alabilir miyim?
AI: Tabii! Adresiniz neresi?
MÜŞTERİ: Atatürk Bulvarı 48.
AI: Siparişiniz alındı, 25 dakikada kapınızda!
SONUÇ: Yeni sipariş | 2 adana dürüm | Atatürk Bulvarı 48
B: Nasıl ya?! Kim konuştu o?
PANEL
A: Yapay zeka asistanım, telefonlara o bakıyor.
A: Siparişler direkt panelime düşüyor.
B: Yarın ilk iş bana da kur!`;
