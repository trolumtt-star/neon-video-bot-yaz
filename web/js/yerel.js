// API anahtarı yokken / Gemini hata verirse kullanılan hazır senaryolar (demo).
const SENARYOLAR = [
  {
    baslik: 'Çay içerken sipariş aldı, telefona dokunmadı bile ☕📞', kanca: 'Telefonu açmadı ama sipariş geldi', kanca_vurgu: 'sipariş',
    mekan: 'dukkan_onu', zaman: 'ogle',
    A: { isim: 'Mehmet', meslek: 'Kebapçı', isletme_adi: 'Beyzade Kebap', cinsiyet: 'erkek', yas: 'orta' },
    B: { isim: 'Hasan', meslek: 'Berber', isletme_adi: 'Hasan Berber', cinsiyet: 'erkek', yas: 'yasli' },
    giris: [{ kim: 'B', metin: 'Bu kira zammı beni bitirdi Mehmet.' }, { kim: 'A', metin: 'Beni de abi, bari çayı ben ısmarlayayım.' }],
    zil_tepki: { kim: 'A', metin: 'Bırak çalsın abi, o halleder.' },
    cagri: [{ kim: 'ai', metin: 'Beyzade Kebap, hoş geldiniz! Nasıl yardımcı olabilirim?' }, { kim: 'musteri', metin: 'İki adana dürüm, bir de ayran alabilir miyim?' }, { kim: 'ai', metin: 'Tabii! Adresiniz Atatürk Bulvarı 48 mi?' }, { kim: 'musteri', metin: 'Evet, aynen orası.' }, { kim: 'ai', metin: 'Siparişiniz alındı, 25 dakikada kapınızda!' }],
    sonuc: { tur: 'Yeni sipariş', baslik: '2 adana dürüm, 1 ayran', detay: 'Atatürk Bulvarı 48 · 25 dk' },
    saskinlik: { kim: 'B', metin: 'Nasıl ya?! Kim konuştu o?' },
    anlatim: [{ kim: 'A', metin: 'Yapay zeka asistanım abi, telefonlara o bakıyor.' }, { kim: 'A', metin: 'Siparişi alıyor, direkt panelime düşüyor.' }, { kim: 'B', metin: 'Gece de mi çalışıyor bu?' }],
    kapanis: { kim: 'B', metin: 'Yarın ilk iş bana da kur bunu!' },
    panel_kartlari: [{ tur: 'Yeni sipariş', baslik: 'Ayşe K. · 3 lahmacun', detay: 'Gül Sk. 7' }, { tur: 'Rezervasyon', baslik: 'Masa 4 · 20:00', detay: '6 kişi' }, { tur: 'Yeni sipariş', baslik: 'Can T. · Karışık pide', detay: 'Paket' }],
    istatistik: { arama: 42, kazanc_etiketi: 'Kurtarılan ciro', kazanc: 18750, birim: '₺' },
  },
  {
    baslik: 'Kuaför koltuğunda randevu kaçar mı? 💇‍♀️🤖', kanca: 'Elleri doluyken randevuyu kim aldı?', kanca_vurgu: 'randevuyu',
    mekan: 'kafe', zaman: 'aksam',
    A: { isim: 'Elif', meslek: 'Kuaför', isletme_adi: 'Elif Kuaför', cinsiyet: 'kadin', yas: 'genc' },
    B: { isim: 'Selin', meslek: 'Çiçekçi', isletme_adi: 'Selin Çiçek', cinsiyet: 'kadin', yas: 'orta' },
    giris: [{ kim: 'B', metin: 'Bayram geliyor, dükkan yine tıklım tıklım olacak.' }, { kim: 'A', metin: 'Bende de öyle ama artık stres yok.' }],
    zil_tepki: { kim: 'A', metin: 'Açmıyorum, bak şimdi ne olacak.' },
    cagri: [{ kim: 'ai', metin: 'Elif Kuaför, merhaba! Size nasıl yardımcı olabilirim?' }, { kim: 'musteri', metin: 'Cumartesi fön ve boya için yer var mı?' }, { kim: 'ai', metin: 'Cumartesi 14:30 uygun, adınızı alabilir miyim?' }, { kim: 'musteri', metin: 'Zeynep Arslan.' }, { kim: 'ai', metin: 'Randevunuz oluşturuldu Zeynep Hanım, görüşmek üzere!' }],
    sonuc: { tur: 'Randevu', baslik: 'Fön + boya · Cumartesi 14:30', detay: 'Zeynep Arslan' },
    saskinlik: { kim: 'B', metin: 'Dur dur dur, sekreter mi tuttun?' },
    anlatim: [{ kim: 'A', metin: 'Sekreter değil, yapay zeka! Maaş da istemiyor.' }, { kim: 'A', metin: 'Randevular düşüyor, ben sadece saçla uğraşıyorum.' }],
    kapanis: { kim: 'B', metin: 'Bayramdan önce bana da lazım bu!' },
    panel_kartlari: [{ tur: 'Randevu', baslik: 'Merve Y. · Kesim', detay: 'Cuma 11:00' }, { tur: 'Randevu', baslik: 'Gelin başı · Pazar', detay: 'Prova dahil' }, { tur: 'Bilgi', baslik: 'Keratin fiyatı soruldu', detay: 'Yanıtlandı' }],
    istatistik: { arama: 27, kazanc_etiketi: 'Alınan randevu', kazanc: 19, birim: '' },
  },
  {
    baslik: 'Gece 23:40, dükkan kapalı, sipariş açık 🌙', kanca: 'Dükkan kapalı ama telefon açık', kanca_vurgu: 'açık',
    mekan: 'sahil', zaman: 'gece',
    A: { isim: 'Burak', meslek: 'Pideci', isletme_adi: 'Karadeniz Pide', cinsiyet: 'erkek', yas: 'genc' },
    B: { isim: 'Ramazan', meslek: 'Oto tamirci', isletme_adi: 'Ramazan Oto', cinsiyet: 'erkek', yas: 'yasli' },
    giris: [{ kim: 'B', metin: 'Derbiyi kaybettik, moral sıfır yeğenim.' }, { kim: 'A', metin: 'Boş ver abi, en azından deniz güzel.' }],
    zil_tepki: { kim: 'A', metin: 'Saat on bir, ben mesaideyim sanki? Bırak.' },
    cagri: [{ kim: 'ai', metin: 'Karadeniz Pide, iyi akşamlar! Nasıl yardımcı olabilirim?' }, { kim: 'musteri', metin: 'Yarın öğlen ofise 10 kıymalı pide lazım.' }, { kim: 'ai', metin: 'Not aldım, yarın 12:30 teslim edelim mi?' }, { kim: 'musteri', metin: 'Süper, öyle olsun.' }],
    sonuc: { tur: 'Yeni sipariş', baslik: '10 kıymalı pide', detay: 'Yarın 12:30 · Ofis' },
    saskinlik: { kim: 'B', metin: 'Oğlum gece gece kim çalışıyor senin yerine?' },
    anlatim: [{ kim: 'A', metin: 'Yapay zeka abi, yedi yirmi dört açık.' }, { kim: 'A', metin: 'Ben uyurken bile siparişler panele düşüyor.' }],
    kapanis: { kim: 'B', metin: 'Benim kaçan müşterileri düşündükçe derbiyi unuttum!' },
    panel_kartlari: [{ tur: 'Yeni sipariş', baslik: 'Kaşarlı pide x3', detay: 'Paket' }, { tur: 'Teklif', baslik: 'Düğün yemeği', detay: '150 kişi' }, { tur: 'Yeni sipariş', baslik: 'Lahmacun x6', detay: 'Gelal Sk.' }],
    istatistik: { arama: 31, kazanc_etiketi: 'Kurtarılan ciro', kazanc: 27400, birim: '₺' },
  },
];

export function yerelSenaryo(ayar, sira = Math.floor(Math.random() * 1000)) {
  const s = JSON.parse(JSON.stringify(SENARYOLAR[sira % SENARYOLAR.length]));
  s.aciklama = `${s.baslik}\n${ayar.marka}: ${ayar.urun}\n\n#yapayzeka #esnaf #işletme #girişimci #reels`;
  return s;
}
