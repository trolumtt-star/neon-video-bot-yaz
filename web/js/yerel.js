// İnternetsiz hazır senaryo kütüphanesi (Senaryolar sekmesinden kuyruğa eklenebilir).
import { metniCoz } from './senaryoMetin.js';

export const HAZIR = [
`BAŞLIK: Trafikte sipariş kaçar mı? 🚗📞
KANCA: Direksiyondayken bile sipariş kaçmadı
VURGU: sipariş
MEKAN: araba
ZAMAN: aksam
A: Mehmet | Kebapçı | Beyzade Kebap | erkek | orta
B: Hasan | Taksici | erkek | yasli

B: Bu saatte köprü kilit, eve gece varırız.
A: Ben dertli değilim abi, dükkan kendi kendine dönüyor.
ZİL
A: Bırak çalsın, o halleder.
MÜŞTERİ: Akşama iki adana, bir lahmacun alabilir miyim?
AI: Tabii! Beyzade Kebap'a hoş geldiniz. Adresiniz neresi?
MÜŞTERİ: Atatürk Bulvarı 48.
AI: Siparişiniz alındı, otuz dakikada kapınızda!
SONUÇ: Yeni sipariş | 2 adana, 1 lahmacun | Atatürk Bulvarı 48
B: Oğlum sen buradasın, kim aldı o siparişi?
PANEL
A: Yapay zeka asistanım abi, telefonlara o bakıyor.
A: Sipariş direkt panelime düşüyor, ben trafikteyim.
B: Bana da kur, korna çalarken müşteri kaçırıyorum!`,

`BAŞLIK: Yürürken randevu dolduran kuaför 💇‍♀️
KANCA: Elleri poşet dolu, randevu yine de alındı
VURGU: randevu
MEKAN: yuruyus
ZAMAN: ogle
A: Elif | Kuaför | Elif Kuaför | kadin | genc
B: Selin | Çiçekçi | kadin | orta

B: Pazardan mı geliyorsun, poşetler ağır mı?
A: Ağır ama kafam rahat, dükkanı düşünmüyorum.
ZİL
A: Açmıyorum, bak şimdi ne olacak.
MÜŞTERİ: Cumartesi fön ve boya için yer var mı?
AI: Cumartesi 14:30 uygun. Adınızı alabilir miyim?
MÜŞTERİ: Zeynep Arslan.
AI: Randevunuz oluşturuldu Zeynep Hanım!
SONUÇ: Randevu | Fön + boya · Cumartesi 14:30 | Zeynep Arslan
B: Dur dur, sekreter mi tuttun sen?
PANEL
A: Sekreter değil, yapay zeka! Maaş da istemiyor.
A: Randevular kendiliğinden düşüyor, ben pazarı geziyorum.
B: Bayramdan önce bana da lazım bu!`,

`BAŞLIK: Çay içerken sipariş aldı, telefona dokunmadı ☕
KANCA: Telefonu açmadı ama sipariş geldi
VURGU: sipariş
MEKAN: dukkan
ZAMAN: ogle
A: Mehmet | Kebapçı | Beyzade Kebap | erkek | orta
B: Hasan | Berber | Hasan Berber | erkek | yasli

B: Bu kira zammı beni bitirdi Mehmet.
A: Beni de abi, bari çayı ben ısmarlayayım.
ZİL
A: Bırak çalsın abi, o halleder.
AI: Beyzade Kebap, hoş geldiniz! Nasıl yardımcı olabilirim?
MÜŞTERİ: İki adana dürüm, bir de ayran alabilir miyim?
AI: Tabii! Adresiniz Atatürk Bulvarı 48 mi?
MÜŞTERİ: Evet, aynen orası.
AI: Siparişiniz alındı, yirmi beş dakikada kapınızda!
SONUÇ: Yeni sipariş | 2 adana dürüm, 1 ayran | Atatürk Bulvarı 48
B: Nasıl ya?! Kim konuştu o?
PANEL
A: Yapay zeka asistanım abi, telefonlara o bakıyor.
A: Siparişi alıyor, direkt panelime düşüyor.
B: Yarın ilk iş bana da kur bunu!
İSTATİSTİK: 42 | Kurtarılan ciro | 18750 | ₺`,

`BAŞLIK: Gece 23:40, dükkan kapalı, sipariş açık 🌙
KANCA: Dükkan kapalı ama telefon açık
VURGU: açık
MEKAN: sahil
ZAMAN: gece
A: Burak | Pideci | Karadeniz Pide | erkek | genc
B: Ramazan | Oto tamirci | erkek | yasli

B: Derbiyi kaybettik, moral sıfır yeğenim.
A: Boş ver abi, en azından deniz güzel.
ZİL
A: Saat on bir, mesaide miyim? Bırak.
AI: Karadeniz Pide, iyi akşamlar! Nasıl yardımcı olabilirim?
MÜŞTERİ: Yarın öğlen ofise on kıymalı pide lazım.
AI: Not aldım, yarın 12:30'da teslim edelim mi?
MÜŞTERİ: Süper, öyle olsun.
SONUÇ: Yeni sipariş | 10 kıymalı pide | Yarın 12:30 · Ofis
B: Oğlum gece gece kim çalışıyor senin yerine?
PANEL
A: Yapay zeka abi, yedi yirmi dört açık.
A: Ben uyurken bile siparişler panele düşüyor.
B: Kaçan müşterilerimi düşündükçe derbiyi unuttum!`,

`BAŞLIK: Veteriner yürüyüşte, hasta kaydı tamam 🐾
KANCA: Köpeği gezdirirken acil randevu aldı
VURGU: acil
MEKAN: yuruyus
ZAMAN: aksam
A: Deniz | Veteriner | Pati Klinik | kadin | orta
B: Murat | Fırıncı | erkek | orta

B: Hocam akşam akşam sen de mi yürüyüşe çıktın?
A: Klinik kapandı, biraz hava alayım dedim.
ZİL
A: Açmasam da olur, o bakıyor.
MÜŞTERİ: Kedim bir şey yuttu galiba, çok korktum!
AI: Geçmiş olsun. Sizi hemen yarın sabah ilk sıraya alıyorum.
MÜŞTERİ: Çok teşekkürler, adım Ayşe.
AI: Ayşe Hanım, yarın 09:00. Acil olursa sizi arayacağız.
SONUÇ: Randevu | Acil muayene · Yarın 09:00 | Ayşe K. · kedi
B: Hocam telefonda kim var, asistan mı?
PANEL
A: Yapay zeka asistan! Randevuyu alıp panelime yazıyor.
A: Acil olanları da en üste koyuyor.
B: Bana sabah dörtte ekmek siparişi alan lazım tam!`,

`BAŞLIK: Otel resepsiyonu boşken rezervasyon dolar mı? 🏨
KANCA: Resepsiyonda kimse yok, oda doldu
VURGU: doldu
MEKAN: kafe
ZAMAN: sabah
A: Kemal | Otelci | Mavi Koy Otel | erkek | orta
B: Fatma | Lokantacı | kadin | orta

B: Sezon başladı, siz de yetişemiyorsunuzdur.
A: Valla bu sene rahatım, sabah kahvemi içiyorum.
ZİL
A: Kahvem soğumasın, bırak çalsın.
MÜŞTERİ: Temmuz'da üç gece deniz manzaralı oda var mı?
AI: 12-15 Temmuz deniz manzaralı oda müsait. İki kişi mi?
MÜŞTERİ: Evet iki kişi, kahvaltı dahil olsun.
AI: Rezervasyonunuz alındı, onay mesajı gönderiyorum!
SONUÇ: Rezervasyon | Deniz manzaralı oda · 3 gece | 12-15 Temmuz · 2 kişi
B: Kemal Bey, kim konuşuyor o telefonda?
PANEL
A: Yapay zeka resepsiyonist Fatma Hanım, gece gündüz çalışıyor.
A: Rezervasyonlar direkt panele geliyor.
B: Lokantaya da olur mu bu? Hemen ver numarayı!`,
];

export function yerelSenaryo(ayar, sira = Math.floor(Math.random() * 1000)) {
  const { senaryo } = metniCoz(HAZIR[sira % HAZIR.length]);
  senaryo.aciklama = `${senaryo.baslik}\n${ayar.marka}: ${ayar.urun}\n\n#yapayzeka #esnaf #işletme #girişimci #reels`;
  return senaryo;
}
