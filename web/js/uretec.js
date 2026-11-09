// İNTERNETSİZ RASTGELE SENARYO ÜRETİCİSİ
// Büyük kelime/cümle havuzlarından her seferinde yeni bir senaryo kurar.
// Son kullanılan cümleleri hatırlar; aynı cümleyi kısa sürede tekrar kullanmaz.

const HAFIZA_ANAHTAR = 'nvb_kullanilan';
let hafiza = [];
try { hafiza = JSON.parse(localStorage.getItem(HAFIZA_ANAHTAR) || '[]'); } catch { hafiza = []; }
let hafizaSet = new Set(hafiza);
function hatirla(s) {
  if (hafizaSet.has(s)) return;
  hafiza.push(s); hafizaSet.add(s);
  if (hafiza.length > 600) { hafiza = hafiza.slice(-500); hafizaSet = new Set(hafiza); }
}
function hafizaKaydet() { try { localStorage.setItem(HAFIZA_ANAHTAR, JSON.stringify(hafiza)); } catch { } }

const rnd = a => a[Math.floor(Math.random() * a.length)];
const sans = p => Math.random() < p;
const aralik = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const buyuk = s => s.charAt(0).toLocaleUpperCase('tr-TR') + s.slice(1);

// Şablondan, daha önce kullanılmamış bir cümle üret
function sec(liste, d, denemeler = 10) {
  let son = '';
  for (let i = 0; i < denemeler; i++) {
    son = doldur(rnd(liste), d);
    if (!hafizaSet.has(son)) break;
  }
  hatirla(son);
  return son;
}
function doldur(sablon, d) {
  return buyuk(sablon.replace(/\{(\w+)\}/g, (_, k) => {
    const v = d[k];
    return typeof v === 'function' ? v() : Array.isArray(v) ? rnd(v) : (v ?? '');
  }).replace(/\s+/g, ' ').replace(/\s([,.!?])/g, '$1').trim()
    .replace(/([.!?]\s+)(\p{Ll})/gu, (_, a, b) => a + b.toLocaleUpperCase('tr-TR')));
}

// ------------------------------------------------------------ havuzlar
const ERKEK = ['Mehmet', 'Ahmet', 'Mustafa', 'Ali', 'Hasan', 'Hüseyin', 'İbrahim', 'Murat', 'Emre', 'Burak', 'Kemal', 'Osman', 'Yusuf', 'Ramazan', 'Erkan', 'Serkan', 'Volkan', 'Tolga', 'Cem', 'Kadir', 'Halil', 'Recep', 'Selim', 'Orhan', 'Fikret', 'Cengiz', 'Oğuz', 'Barış', 'Onur', 'Sinan', 'Uğur', 'Erdem', 'Kaan', 'Berk', 'Furkan', 'Enes', 'Metin', 'Nihat', 'Şükrü', 'Zeki', 'Cafer', 'Rıza', 'Hakan', 'Tuncay', 'Ercan', 'Levent', 'Bülent', 'Yavuz', 'Taner', 'Gökhan'];
const KADIN = ['Ayşe', 'Fatma', 'Elif', 'Zeynep', 'Emine', 'Hatice', 'Merve', 'Selin', 'Büşra', 'Esra', 'Derya', 'Sevgi', 'Gül', 'Aylin', 'Pınar', 'Burcu', 'Ebru', 'Canan', 'Songül', 'Nur', 'Gamze', 'Tuğba', 'Hande', 'Melek', 'Sibel', 'Filiz', 'Nesrin', 'Hülya', 'Dilek', 'Yasemin', 'Özlem', 'Seda', 'Ece', 'İrem', 'Damla', 'Nazlı', 'Asuman', 'Şerife', 'Kübra', 'Meltem'];
const SOYAD = ['Yılmaz', 'Kaya', 'Demir', 'Şahin', 'Çelik', 'Yıldız', 'Aydın', 'Öztürk', 'Arslan', 'Doğan', 'Kılıç', 'Aslan', 'Çetin', 'Kurt', 'Koç', 'Özdemir', 'Polat', 'Erdoğan', 'Kara', 'Güneş', 'Tekin', 'Aksoy', 'Bulut', 'Yavuz', 'Korkmaz'];
const SEHIR = ['Urfa', 'Adana', 'Antep', 'Karadeniz', 'Ege', 'Hatay', 'Konya', 'Bursa', 'Erzurum', 'Trabzon', 'Mardin', 'Kayseri'];
const SOKAK = ['Atatürk Bulvarı', 'Cumhuriyet Caddesi', 'Gül Sokak', 'İstiklal Caddesi', 'Lale Sokak', 'Menekşe Sokak', 'Bahar Caddesi', 'Çamlık Sokak', 'Fatih Caddesi', 'Barış Sokak', 'Papatya Sokak', 'Okul Sokak', 'Hürriyet Caddesi', 'Yalı Caddesi', 'Çınar Sokak', 'Zafer Caddesi'];
const TAKIM = ['Galatasaray', 'Fenerbahçe', 'Beşiktaş', 'Trabzonspor'];
const GUN = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar', 'yarın', 'bugün'];
const AY = ['Haziran\'da', 'Temmuz\'da', 'Ağustos\'ta', 'Eylül\'de', 'Ekim\'de', 'bayramda', 'hafta sonu'];
const saat = () => `${String(aralik(9, 21)).padStart(2, '0')}:${rnd(['00', '15', '30', '45'])}`;

// meslekler: tip = siparis | randevu | rezervasyon | teklif
const MESLEK = [
  { ad: 'Kebapçı', tip: 'siparis', isl: ['{soyad} Kebap', '{sehir} Kebap Salonu', 'Köz Kebap', '{isim} Usta Kebap', 'Ateş Kebap'], u: ['adana dürüm', 'urfa dürüm', 'lahmacun', 'beyti', 'ayran', 'şalgam', 'künefe', 'kuzu şiş', 'tavuk kanat'], h: '#kebap #adana #lezzet' },
  { ad: 'Pideci', tip: 'siparis', isl: ['{sehir} Pide', '{soyad} Pide Salonu', 'Taş Fırın Pide', 'Mavi Pide'], u: ['kıymalı pide', 'kaşarlı pide', 'kuşbaşılı pide', 'karışık pide', 'lahmacun', 'ayran'], h: '#pide #karadenizpidesi' },
  { ad: 'Dönerci', tip: 'siparis', isl: ['{isim} Döner', 'Usta Döner', '{soyad} Döner Evi'], u: ['et döner dürüm', 'tavuk döner', 'iskender', 'pilav üstü döner', 'ayran', 'patates'], h: '#döner #iskender' },
  { ad: 'Lokantacı', tip: 'siparis', isl: ['{soyad} Ev Yemekleri', 'Anadolu Lokantası', '{isim} Usta Lokanta', 'Sofra Lokantası'], u: ['kuru fasulye', 'pilav', 'mercimek çorbası', 'karnıyarık', 'sütlaç', 'tas kebabı', 'cacık'], h: '#esnaflokantası #evyemekleri' },
  { ad: 'Pastaneci', tip: 'siparis', isl: ['{soyad} Pastanesi', 'Saray Pastanesi', 'Tatlı Köşe', '{isim} Pastane'], u: ['doğum günü pastası', 'baklava', 'profiterol', 'su böreği', 'poğaça', 'trileçe'], h: '#pastane #tatlı' },
  { ad: 'Fırıncı', tip: 'siparis', isl: ['{soyad} Fırını', 'Ekmek Teknesi', 'Taş Fırın', 'Halk Ekmek {isim}'], u: ['köy ekmeği', 'simit', 'pide ekmeği', 'açma', 'çavdar ekmeği', 'kandil simidi'], h: '#fırın #ekmek' },
  { ad: 'Balıkçı', tip: 'siparis', isl: ['{isim} Reis Balık', 'Mavi Balık', '{soyad} Balıkçılık', 'Deniz Kızı Balık'], u: ['levrek', 'çupra', 'hamsi', 'balık ekmek', 'midye dolma', 'kalamar'], h: '#balık #deniz' },
  { ad: 'Çiğköfteci', tip: 'siparis', isl: ['{isim} Çiğköfte', 'Acı Çiğköfte', '{sehir} Çiğköftecisi'], u: ['çiğköfte dürüm', 'çiğköfte porsiyon', 'ayran', 'şalgam', 'nar ekşili dürüm'], h: '#çiğköfte' },
  { ad: 'Berber', tip: 'randevu', isl: ['{isim} Berber', 'Makas {soyad}', 'Usta Berber', 'Erkek Kuaförü {isim}'], u: ['saç kesimi', 'sakal tıraşı', 'saç sakal', 'damat tıraşı', 'cilt bakımı'], h: '#berber #tıraş' },
  { ad: 'Kuaför', tip: 'randevu', isl: ['{isim} Kuaför', 'Bella Kuaför', 'Saç Atölyesi', '{isim} Güzellik'], u: ['fön', 'boya', 'gelin başı', 'keratin bakımı', 'kesim', 'manikür'], h: '#kuaför #saç', kadin: true },
  { ad: 'Diş hekimi', tip: 'randevu', isl: ['{soyad} Diş Kliniği', 'Gülüş Diş', 'Beyaz Diş Kliniği'], u: ['dolgu', 'diş taşı temizliği', 'implant muayenesi', 'kanal tedavisi', 'beyazlatma'], h: '#diş #gülüş' },
  { ad: 'Veteriner', tip: 'randevu', isl: ['Pati Veteriner', '{soyad} Veteriner Kliniği', 'Can Dostlar Kliniği'], u: ['kedi aşısı', 'köpek kontrolü', 'kısırlaştırma', 'tırnak kesimi', 'genel muayene'], h: '#veteriner #kedi #köpek' },
  { ad: 'Oto servisçi', tip: 'randevu', isl: ['{soyad} Oto', 'Usta Oto Servis', '{isim} Oto Bakım'], u: ['periyodik bakım', 'yağ değişimi', 'fren kontrolü', 'balata değişimi', 'klima gazı'], h: '#otoservis #araba' },
  { ad: 'Lastikçi', tip: 'randevu', isl: ['{isim} Lastik', 'Hızlı Lastik', '{soyad} Rot Balans'], u: ['lastik değişimi', 'rot balans', 'kışlık lastik', 'lastik tamiri'], h: '#lastik #rotbalans' },
  { ad: 'Oto yıkamacı', tip: 'randevu', isl: ['Parlak Oto Yıkama', '{isim} Oto Kuaför', 'Köpük Yıkama'], u: ['iç dış yıkama', 'detaylı temizlik', 'pasta cila', 'koltuk yıkama'], h: '#otoyıkama' },
  { ad: 'Diyetisyen', tip: 'randevu', isl: ['Dyt. {isim} {soyad}', 'Dengeli Beslenme', 'Fit Ofis'], u: ['ilk görüşme', 'kontrol randevusu', 'online görüşme', 'ölçüm randevusu'], h: '#diyetisyen #sağlıklıbeslenme', kadin: true },
  { ad: 'Güzellik uzmanı', tip: 'randevu', isl: ['{isim} Güzellik Salonu', 'Işıltı Güzellik', 'Bakım Atölyesi'], u: ['cilt bakımı', 'kaş tasarımı', 'lazer epilasyon', 'kirpik lifting'], h: '#güzellik #ciltbakımı', kadin: true },
  { ad: 'Otelci', tip: 'rezervasyon', isl: ['Mavi Koy Otel', '{soyad} Butik Otel', 'Deniz Yıldızı Otel', 'Çamlık Pansiyon'], u: ['deniz manzaralı oda', 'aile odası', 'balayı odası', 'çift kişilik oda'], h: '#otel #tatil' },
  { ad: 'Restorancı', tip: 'rezervasyon', isl: ['{isim} Ocakbaşı', 'Asma Altı Restoran', 'Teras {soyad}', 'Bahçe Restoran'], u: ['cam kenarı masa', 'bahçede masa', 'doğum günü masası', 'aile masası'], h: '#restoran #akşamyemeği' },
  { ad: 'Düğün salonu sahibi', tip: 'rezervasyon', isl: ['Kristal Düğün Salonu', 'Saray Davet', '{soyad} Balo Salonu'], u: ['düğün', 'kına gecesi', 'nişan', 'sünnet düğünü'], h: '#düğün #nişan' },
  { ad: 'Tesisatçı', tip: 'teklif', isl: ['{isim} Usta Tesisat', 'Akış Tesisat', '{soyad} Su Tesisatı'], u: ['kombi bakımı', 'petek temizliği', 'su kaçağı tespiti', 'musluk tamiri'], h: '#tesisat #kombi' },
  { ad: 'Elektrikçi', tip: 'teklif', isl: ['{isim} Elektrik', 'Volt Elektrik', '{soyad} Elektrik Tamir'], u: ['priz tamiri', 'sigorta arızası', 'avize montajı', 'kablo yenileme'], h: '#elektrik #tamir' },
  { ad: 'Halı yıkamacı', tip: 'teklif', isl: ['Pırıl Halı Yıkama', '{soyad} Halı', 'Temiz Ev Halı'], u: ['halı yıkama', 'koltuk yıkama', 'perde yıkama', 'yorgan yıkama'], h: '#halıyıkama #temizlik' },
  { ad: 'Emlakçı', tip: 'teklif', isl: ['{soyad} Emlak', 'Anahtar Gayrimenkul', 'Yuva Emlak'], u: ['kiralık daire', 'satılık daire', 'dükkan kiralama', 'arsa'], h: '#emlak #kiralık' },
  { ad: 'Nakliyeci', tip: 'teklif', isl: ['{soyad} Nakliyat', 'Hızlı Evden Eve', 'Güven Nakliyat'], u: ['evden eve nakliyat', 'ofis taşıma', 'parça eşya taşıma'], h: '#nakliyat #taşınma' },
  { ad: 'Çiçekçi', tip: 'siparis', isl: ['{isim} Çiçek', 'Lale Çiçekçilik', 'Gonca Çiçek'], u: ['gül buketi', 'orkide', 'doğum günü çiçeği', 'açılış çelengi', 'papatya buketi'], h: '#çiçek #hediye' },
];
// B için ek renkli meslekler (müşterisi olmayabilir)
const B_MESLEK = ['Taksici', 'Bakkal', 'Manav', 'Kasap', 'Terzi', 'Kunduracı', 'Saatçi', 'Kırtasiyeci', 'Nalbur', 'Muhtar', 'Çaycı', 'Simitçi', 'Kuyumcu', 'Eczacı', 'Fotoğrafçı', 'Gözlükçü', 'Mobilyacı', 'Tamirci', 'Market sahibi', 'Kasiyer', 'Pazarcı', 'Matbaacı', 'Dondurmacı', 'Börekçi'];

// ------------------------------------------------------------ konuşma havuzları
// {h}: konuşanın karşısındakine hitabı. {hB} vb. özel.
const KONULAR = {
  hava_soguk: { B: ['Bu soğuk adamın iliğine işledi {h}.', 'Ne soğuk be {h}, parmaklarım dondu.', 'Kış erken geldi bu sene {h}.', 'Kombiyi yaktım, fatura gelince yanacağım {h}.', 'Sabah arabanın camını kazıdım resmen {h}.'],
    A: ['Çayı demle o zaman, ısınalım.', 'Bana mısın demiyor, kafam rahat.', 'Soğuk da geçer, sen işine bak.', 'Ben ısınmanın yolunu buldum, sonra anlatırım.', 'Sıcak bir çorba iyi gider şimdi.'],
    C: ['Senin keyfin hep yerinde zaten.', 'Ya, sende hep bir rahatlık var.', 'Herkes titriyor, sen gülüyorsun.'] },
  hava_sicak: { B: ['Bu sıcakta dükkanda durulmuyor {h}.', 'Klima da yetmiyor, eriyoruz {h}.', 'Gölgede kırk derece var {h}.', 'Böyle sıcakta müşteri de gelmiyor {h}.'],
    A: ['Bir buzlu ayran söyleyelim.', 'Sıcak bizi değil, telefonu yorsun.', 'Ben serinim, işler yürüyor.', 'Dondurma yesek mi ne?'],
    C: ['Senin işler nasıl bu kadar rahat ya?', 'Sen hiç terlemiyorsun maşallah.'] },
  yagmur: { B: ['Şemsiyesiz çıktım, sırılsıklam oldum {h}.', 'Yağmur başladı, sokakta kimse kalmadı {h}.', 'Bu yağmurda müşteri dükkana gelmez {h}.'],
    A: ['Gelmesin, telefondan sipariş veriyorlar.', 'Yağmurda herkes eve sipariş veriyor.', 'Bırak yağsın, bizim işler kuru.'],
    C: ['Sana yağmur da yarıyor demek.', 'Nasıl bu kadar emin konuşuyorsun?'] },
  mac: { B: ['Dün akşam {takim} maçını izledin mi {h}?', '{takim} yine kaybetti, moralim bozuk {h}.', 'Derbiye bilet bulamadım {h}.', 'Hakem yine bizi yaktı {h}.'],
    A: ['İzledim, kalbim dayanmadı.', 'Futbol bitti ama bizim işler sezonda.', 'Maç bahane, sen keyfine bak.', 'Ben maçı rahat izledim, telefon bile bakmadım.'],
    C: ['Maç sırasında telefona bakmadın mı yani?', 'Ben devre arasında üç müşteri kaçırdım.'] },
  zam: { B: ['Her şeye zam geldi, nereye gidiyoruz {h}?', 'Domatesin kilosu ne olmuş gördün mü {h}?', 'Elektrik faturası beni bitirdi {h}.', 'Toptancı yine fiyat artırmış {h}.'],
    A: ['Masrafı kıstım, kaçan müşteriyi de bitirdim.', 'Zor ama müşteri kaçırmazsan dönüyor.', 'Ben de dertliydim, bir çözüm buldum.', 'Fiyatı değil, kaçan müşteriyi düşün sen.'],
    C: ['Nasıl çözüm, anlatsana?', 'Kaçan müşteri mi, benimkiler hep kaçıyor.'] },
  kira: { B: ['Ev sahibi kiraya yine zam istedi {h}.', 'Kira kontratı yenilenince ağladım resmen {h}.', 'Bu kirayla dükkan döner mi {h}?'],
    A: ['Kirayı çıkarmak için her siparişi almak lazım.', 'Döner, yeter ki tek müşteri kaçmasın.', 'Ben artık hiçbir aramayı kaçırmıyorum.'],
    C: ['Hepsini nasıl yetiştiriyorsun ya?', 'Ben telefona bile yetişemiyorum.'] },
  eleman: { B: ['Eleman bulamıyorum {h}, kimse çalışmak istemiyor.', 'Çırak yine işi bıraktı {h}.', 'Telefona bakacak birine ihtiyacım var {h}.', 'Yeni kız daha telefonu açmayı bilmiyor {h}.'],
    A: ['Telefona bakacak birini ben buldum.', 'Benim yardımcım hiç izin istemiyor.', 'Bende öyle bir eleman var ki maaş da istemiyor.'],
    C: ['Hadi canım, öyle eleman mı olur?', 'Nerede buldun, bana da söyle.'] },
  trafik: { B: ['Bu trafik hiç bitmiyor {h}.', 'Köprü yine kilit, akşama varırız {h}.', 'Yarım saattir aynı yerdeyiz {h}.', 'Navigasyon bile pes etti {h}.'],
    A: ['Bırak dursun, dükkan kendi kendine dönüyor.', 'Ben acele etmiyorum, işler yürüyor.', 'Trafikteyim ama müşteri beklemiyor.'],
    C: ['Senin dükkan nasıl kendi kendine dönüyor?', 'Ben dükkandan çıkınca telefon susmuyor.'] },
  tatil: { B: ['Bu yaz yine tatile gidemedik {h}.', 'Hanım tatil istiyor, dükkanı kime bırakacağım {h}?', 'Üç yıldır izin yapmadım {h}.'],
    A: ['Ben bu yaz gideceğim, dükkan beni beklemesin.', 'Git, telefonlar artık dert değil.', 'Ben tatildeyken bile sipariş alıyorum.'],
    C: ['Tatilde mi sipariş, şaka yapıyorsun?', 'Ben bir gün kapatsam müşteriler darılır.'] },
  dugun: { B: ['Kızın düğünü yaklaştı, koşturmaca çok {h}.', 'Bu düğün masrafları bitirdi beni {h}.', 'Yeğenin nişanı var, dükkanı kapatacağım {h}.'],
    A: ['Kapatma, işler aksamaz merak etme.', 'Ben düğünde göbek atarken bile işler yürüyor.', 'Düğüne git, telefonu dert etme.'],
    C: ['Nasıl aksamaz, kim bakacak?', 'Düğünde göbek atarken sipariş mi?'] },
  okul: { B: ['Çocukların okul masrafı dudak uçuklatıyor {h}.', 'Sabah okula bırak, akşam al, dükkan yalnız kalıyor {h}.', 'Veli toplantısı var, dükkanı ne yapacağım {h}?'],
    A: ['Git sen, dükkan kendini idare eder.', 'Ben çocukları okula bırakırken bile müşteri kaçmıyor.', 'Toplantıya git, aramaları dert etme.'],
    C: ['Dükkan nasıl kendini idare eder ya?', 'Benim telefon o saatlerde çıldırıyor.'] },
  yorgun: { B: ['Sabahtan beri ayaktayım, belim koptu {h}.', 'Gece de rüyamda telefon çalıyor {h}.', 'Bugün yüz kere telefona koştum {h}.'],
    A: ['Ben artık telefona hiç koşmuyorum.', 'Ben rahatım, telefonu başkası açıyor.', 'Otur bir çay iç, sonra konuşuruz.'],
    C: ['Kim açıyor telefonu, eleman mı aldın?', 'Şanslısın, bende herkes beni arıyor.'] },
  rakip: { B: ['Karşıya yeni bir dükkan açıldı {h}.', 'Rakip internetten reklam veriyor {h}.', 'Yan dükkan müşterilerimi çalıyor {h}.'],
    A: ['Ben telefonla müşteri kaçırmıyorum, korkmuyorum.', 'Rakip açılsın, benim telefonum hep açık.', 'Müşteri ulaşamayınca rakibe gidiyor, ben ulaşılıyorum.'],
    C: ['Hep açık mı, sen hiç mi uyumuyorsun?', 'Nasıl her aramaya yetişiyorsun?'] },
  yorum: { B: ['Google\'da biri bana bir yıldız vermiş {h}.', 'Müşteri telefonu açmadınız diye kızdı {h}.', 'Yorumlarda hep ulaşamadık yazıyorlar {h}.'],
    A: ['Bende o şikayet bitti artık.', 'Benim telefon hiç cevapsız kalmıyor.', 'Ben o yorumlardan kurtuldum.'],
    C: ['Nasıl kurtuldun, sır mı?', 'Valla bana da lazım o sır.'] },
  saglik: { B: ['Doktor stresi azalt dedi {h}.', 'Tansiyonum yine yükseldi {h}.', 'Hekim yürüyüş yap dedi, vakit yok {h}.'],
    A: ['Benim stresim azaldı, telefon dert değil.', 'Yürü, dükkan seni beklemesin.', 'Ben stresi telefonla birlikte bıraktım.'],
    C: ['Telefonu bıraktın mı yani?', 'Anlatsana, nasıl yaptın?'] },
};
// mekana özel konular
const MEKAN_KONU = {
  araba: ['trafik', 'mac', 'zam', 'tatil'],
  yuruyus: ['saglik', 'hava_soguk', 'hava_sicak', 'okul', 'eleman'],
  pazar: ['zam', 'pazar', 'kira'],
  balik: ['balik', 'tatil', 'yorgun', 'mac'],
  durak: ['durak', 'yagmur', 'hava_soguk', 'okul'],
  park: ['park', 'saglik', 'tatil', 'dugun'],
  sahil: ['tatil', 'mac', 'yorgun', 'hava_sicak'],
  kafe: ['kira', 'eleman', 'yorum', 'rakip', 'dugun'],
  dukkan_onu: ['zam', 'rakip', 'yorum', 'eleman', 'yagmur', 'hava_soguk', 'kira'],
};
KONULAR.pazar = { B: ['Domatesin kilosuna bak {h}, ateş pahası.', 'Pazarcı yine fiyatları uçurmuş {h}.', 'Bu poşetleri eve nasıl taşıyacağız {h}?', 'Biber de patlıcan da cep yakıyor {h}.'],
  A: ['Pazar pahalı ama dükkan iyi kazandırıyor.', 'Ben pazarı gezerken dükkan çalışıyor.', 'Taşırız, kafam rahat olunca poşet hafif.'],
  C: ['Sen pazardasın, dükkana kim bakıyor?', 'Dükkan boşsa telefonlar ne olacak?'] };
KONULAR.balik = { B: ['İki saattir bir tane bile vurmadı {h}.', 'Bugün balık da işsiz galiba {h}.', 'Yemi değiştir bari {h}, bir şey çıkmıyor.', 'Martılar bizden çok tutuyor {h}.'],
  A: ['Balık vurmasın, sipariş vuruyor.', 'Ben balığa bakıyorum, dükkan işini görüyor.', 'Sabret, oltada da işte de sabır.'],
  C: ['Dükkanı bırakıp balığa çıktın, ya müşteri?', 'Ben bir saat ayrılsam telefon kilitlenir.'] };
KONULAR.durak = { B: ['Bu otobüs yine gecikti {h}.', 'Yarım saattir duraktayız {h}.', 'Bir gelse de dükkana yetişsem {h}.', 'Otobüs dolu geçti, inanabiliyor musun {h}?'],
  A: ['Acele etme, dükkan beni beklemiyor.', 'Ben geç kalsam da müşteri bekletilmiyor.', 'Gecikse de olur, telefonlar açık.'],
  C: ['Dükkan kapalı, telefonlar nasıl açık?', 'Sen hiç telaşlanmıyorsun ya.'] };
KONULAR.park = { B: ['Güvercinlere yem verdim, en iyi müşterim onlar {h}.', 'Yıllardır parkta oturmaya vakit bulamadım {h}.', 'Torunla parka geldik, dükkanı kapattım {h}.'],
  A: ['Ben her gün biraz parktayım artık.', 'Otur keyfine bak, işler yürüsün.', 'Ben dükkanı kapatmadan da parka gelebiliyorum.'],
  C: ['Dükkanı kapatmadan nasıl geliyorsun?', 'Sende sihir var valla.'] };

const ZIL_TEPKI = ['Bırak çalsın, o halleder.', 'Açmıyorum, bak şimdi ne olacak.', 'Rahat ol {h}, o bakıyor.', 'Dokunma, kendi açacak.', 'Benim yerime biri var, izle.', 'Hiç telaş yok, dinle şimdi.', 'Çalsın {h}, ben çayımı içiyorum.', 'Açmama gerek yok, sen izle.', 'O telefon artık beni yormuyor.', 'Bak şimdi sihri göreceksin.', 'Sus sus, dinle bak ne oluyor.', 'Bana bakma, telefona bak.'];
const SASKIN = ['Nasıl ya?! Kim konuştu o?', 'Dur dur dur, telefon kendi mi açtı?', 'Oha! Kim cevap verdi şimdi?', 'Sekreter mi tuttun sen?', 'Bu ne ya? Telefonda biri mi var?', 'Şaka mı bu {h}? Kim o?', 'Vay! Robot mu konuşuyor?', 'Telefonun içinde biri mi yaşıyor?', 'Ne oluyor ya? Sen konuşmadın ki!', 'Bir dakika, sipariş kendi kendine mi alındı?', 'Kim bu kibar ses {h}?', 'Valla gözlerime inanamıyorum!'];
const ANLAT1 = ['Yapay zeka asistanım {h}, telefonlara o bakıyor.', '{marka} bu {h}, telefonlarımı o açıyor.', 'Yapay zeka {h}! Türkçe konuşuyor, hiç yorulmuyor.', 'Asistanım var artık, adı {marka}.', 'Benim yerime {marka} konuşuyor {h}.', 'Bu {marka}, işletmeler için telefon asistanı.'];
const ANLAT2 = {
  siparis: ['Siparişi alıyor, direkt panelime düşüyor.', 'Adresi, siparişi yazıyor, ben sadece hazırlıyorum.', 'Aynı anda on arama gelse hepsini alıyor.', 'Gece yarısı bile sipariş kaçırmıyor.'],
  randevu: ['Randevuyu ayarlıyor, takvimime işliyor.', 'Boş saatleri biliyor, ona göre randevu veriyor.', 'Müşteri aradığında hep açık, randevu kaçmıyor.', 'Hatırlatma mesajını bile o atıyor.'],
  rezervasyon: ['Rezervasyonu alıyor, panelime yazıyor.', 'Hangi masa, hangi oda boş, hepsini biliyor.', 'Gece de gündüz de rezervasyon alıyor.', 'Kimseyi bekletmiyor, hemen cevap veriyor.'],
  teklif: ['Adresi, işi not alıyor, ben sadece gidiyorum.', 'Fiyat soranlara cevap veriyor, kaydı panele atıyor.', 'Ben işteyken bile yeni işler geliyor.', 'Acil işleri en üste koyuyor.'],
};
const B_SORU = ['Peki gece de çalışıyor mu?', 'Yanlış anlarsa ne olacak?', 'Pahalı mıdır bu iş?', 'Her şeyi mi biliyor yani?', 'Müşteri anlıyor mu robot olduğunu?', 'Benim işe de olur mu?'];
const A_CEVAP = ['Yedi yirmi dört açık, bayramda bile.', 'Anlamazsa sorup teyit ediyor, çok dikkatli.', 'Bir eleman maaşından çok ucuz.', 'Menüyü, fiyatları, saatleri hepsini öğrettik.', 'Çok doğal konuşuyor, çoğu fark etmiyor bile.', 'Her işletmeye uyuyor, senin işe de olur.'];
const KAPANIS = ['Yarın ilk iş bana da kur!', 'Bana da lazım bu, numarasını ver!', 'Ben bunu kaçırmam, hemen istiyorum!', 'Benim dükkana da olur mu? Olur olur, kuralım!', 'Vallahi bunu benim dükkana da kuruyoruz!', 'Kaçan müşterilerimi düşündükçe içim acıdı!', 'Tamam ikna oldum, ilk iş arıyorum!', 'Ben de istiyorum, hem de bugün!', 'Şimdiye kadar nerdeydi bu ya?', 'Hanım duyarsa çok sevinir, kuralım!'];
const KANCA = [
  ['Telefonu açmadı ama {sk} geldi', '{sk}'], ['{mi} bile {sk} kaçmadı', '{sk}'], ['Kimse açmadı ama {sk} tamam', '{sk}'],
  ['Bu esnaf telefonu hiç açmıyor, neden?', 'neden'], ['Telefon çaldı, {sk} kendiliğinden alındı', 'kendiliğinden'],
  ['{meslek} telefona bakmadı, müşteri kazandı', 'kazandı'], ['Arkadaşı ne olduğunu anlamadı', 'anlamadı'],
  ['Telefona dokunmadan {sk} almak', 'dokunmadan'], ['Bir telefon, sıfır stres', 'sıfır'], ['{mi} çalışan telefon', 'çalışan'],
  ['{meslek} çayını içti, telefon işini yaptı', 'telefon'], ['Arkadaşının yüzüne bak, sonuna kadar izle', 'sonuna'],
  ['Telefon çalınca panik yapmayan esnaf', 'panik'], ['Esnafın gizli silahı ortaya çıktı', 'gizli'],
  ['{mi} müşteri kaçırmayan {meslek}', 'kaçırmayan'], ['O telefonu açan kim?', 'kim'], ['Esnaf muhabbetinde yapay zeka sürprizi', 'yapay'],
  ['Telefonu cebinden çıkarmadı bile', 'çıkarmadı'], ['Müşteri aradı, {meslek} hiç kıpırdamadı', 'kıpırdamadı'],
  ['Bu {meslek} artık hiç {sk} kaçırmıyor', 'kaçırmıyor'], ['{mi} gelen {sk} kimde kaldı?', 'kimde'],
];
const MEKAN_IFADE = { araba: 'Trafikteyken', yuruyus: 'Yürürken', pazar: 'Pazarda', balik: 'Balık tutarken', durak: 'Otobüs beklerken', park: 'Parkta', sahil: 'Sahilde çay içerken', kafe: 'Kahve içerken', dukkan_onu: 'Çay molasında' };
const SONUC_KELIME = { siparis: 'sipariş', randevu: 'randevu', rezervasyon: 'rezervasyon', teklif: 'iş' };
const EMOJI = ['📞', '🤖', '🔥', '😂', '😮', '✅', '💸', '🚀', '👀', '☕'];

// ------------------------------------------------------------ çağrı kurgusu
function cagriKur(m, isl, d) {
  const u1 = rnd(m.u), u2 = rnd(m.u.filter(x => x !== u1)) || u1;
  const n1 = rnd(['bir', 'iki', 'üç', 'dört']), n2 = rnd(['bir', 'iki']);
  const gun = rnd(GUN), sa = saat();
  const adSoyad = `${rnd(sans(0.5) ? ERKEK : KADIN)} ${rnd(SOYAD)}`;
  const adres = `${rnd(SOKAK)} ${aralik(2, 120)}`;
  const [dk, dkSayi] = rnd([['yirmi', 20], ['yirmi beş', 25], ['otuz', 30], ['kırk', 40], ['on beş', 15]]);
  const kisi = rnd(['iki', 'dört', 'altı', 'sekiz']);
  const v = { isl, u1, u2, n1, n2, gun, saat: sa, adSoyad, ad: adSoyad.split(' ')[0], adres, dk, kisi, ay: rnd(AY), gece: rnd(['iki', 'üç', 'beş', 'yedi']) };
  const S = (l) => sec(l, v);
  const selam = S(['{isl}, hoş geldiniz! Nasıl yardımcı olabilirim?', '{isl}, merhaba! Size nasıl yardımcı olayım?', 'Merhaba, burası {isl}. Buyurun?', '{isl}, iyi günler! Dinliyorum.']);
  const c = [{ kim: 'ai', metin: selam }];
  let sonuc;
  if (m.tip === 'siparis') {
    c.push({ kim: 'musteri', metin: S(['{n1} {u1}, {n2} {u2} alabilir miyim?', 'Akşama {n1} {u1} gönderir misiniz?', 'Ofise {kisi} kişilik {u1} lazım.', '{u1} var mı bugün? {n1} tane istiyorum.', 'Eve {n1} {u1} ve {u2} istiyorum.']) });
    c.push({ kim: 'ai', metin: S(['Tabii! Adresiniz neresi?', 'Hemen hazırlıyoruz. Teslimat adresiniz?', 'Elbette! Nereye gönderelim?', 'Harika seçim! Adresi alabilir miyim?']) });
    c.push({ kim: 'musteri', metin: S(['{adres}.', '{adres}, zile basın.', '{adres}, kapıcıya bırakın.']) });
    if (sans(0.45)) {
      c.push({ kim: 'musteri', metin: S(['Kartla ödeyebilir miyim?', 'Yanına acı sos da koyar mısınız?', 'Çabuk gelir mi, acıktık?', 'Kampanyanız var mı?']) });
      c.push({ kim: 'ai', metin: S(['Tabii, kapıda kart da geçer.', 'Notunuzu aldım, ekliyoruz.', 'Mutfağa ilettim, öncelikli hazırlıyoruz.', 'Bugün ikinci üründe tatlı ikram!']) });
    }
    c.push({ kim: 'ai', metin: S(['Siparişiniz alındı, {dk} dakikada kapınızda!', 'Tamamdır, {dk} dakikaya yoldadır. Afiyet olsun!', 'Siparişiniz hazırlanıyor, {dk} dakikada orada!']) });
    const tl = c[1].metin.toLocaleLowerCase('tr-TR');
    const ana = tl.includes(`${n1} ${u1}`) ? `${n1} ${u1}` : tl.includes('kişilik') ? `${kisi} kişilik ${u1}` : u1;
    sonuc = { tur: 'Yeni sipariş', baslik: buyuk(ana + (tl.includes(u2) && u2 !== u1 ? `, ${tl.includes(`${n2} ${u2}`) ? n2 + ' ' : ''}${u2}` : '')), detay: `${adres} · ${dkSayi} dk` };
  } else if (m.tip === 'randevu') {
    c.push({ kim: 'musteri', metin: S(['{gun} {u1} için yer var mı?', '{u1} randevusu almak istiyorum.', '{gun} müsait misiniz? {u1} yaptıracağım.', 'Merhaba, {u1} için ne zaman gelebilirim?']) });
    c.push({ kim: 'ai', metin: S(['{gun} saat {saat} uygun. Adınızı alabilir miyim?', '{gun} {saat} boş görünüyor, adınız?', 'Size {gun} {saat} ayırabilirim. İsminiz nedir?']) });
    c.push({ kim: 'musteri', metin: S(['{adSoyad}.', 'Adım {adSoyad}.', '{adSoyad}, teşekkürler.']) });
    c.push({ kim: 'ai', metin: S(['Randevunuz oluşturuldu, görüşmek üzere!', 'Kaydınız tamam, bir gün önce hatırlatırız!', 'Harika, {gun} {saat} sizi bekliyoruz!']) });
    sonuc = { tur: 'Randevu', baslik: `${buyuk(u1)} · ${buyuk(gun)} ${sa}`, detay: adSoyad };
  } else if (m.tip === 'rezervasyon') {
    c.push({ kim: 'musteri', metin: S(['{gun} akşam {kisi} kişilik {u1} var mı?', '{ay} {gece} gece {u1} lazım.', '{u1} için rezervasyon yapmak istiyorum.', '{kisi} kişiyiz, {gun} için yer ayırır mısınız?']) });
    c.push({ kim: 'ai', metin: S(['Müsait! Kaç kişi olacaksınız?', 'Uygun yerimiz var. İsminizi alayım mı?', 'Tabii, hemen ayırıyorum. Adınız nedir?']) });
    c.push({ kim: 'musteri', metin: S(/balayı|çift/.test(u1) ? ['İki kişi, adım {adSoyad}.', '{adSoyad} adına olsun.'] : ['{kisi} kişi, adım {adSoyad}.', '{adSoyad} adına olsun.', '{adSoyad}, teşekkürler.']) });
    c.push({ kim: 'ai', metin: S(['Rezervasyonunuz tamam, onay mesajı geliyor!', 'Yeriniz ayrıldı, şimdiden iyi eğlenceler!', 'Kaydınızı aldım, sizi bekliyoruz!']) });
    const tl = c[1].metin.toLocaleLowerCase('tr-TR');
    const ne = tl.includes(v.ay.toLocaleLowerCase('tr-TR')) ? v.ay.replace(/'.*$/, '').replace(/da$|ta$|de$/, '') : gun;
    sonuc = { tur: 'Rezervasyon', baslik: `${buyuk(u1)} · ${buyuk(ne)}`, detay: `${adSoyad} · ${/balayı|çift/.test(u1) ? 'iki' : kisi} kişi` };
  } else {
    c.push({ kim: 'musteri', metin: S(['{u1} için fiyat alabilir miyim?', 'Acil {u1} lazım, gelebilir misiniz?', '{u1} yaptırmak istiyorum, ne zaman müsaitsiniz?']) });
    c.push({ kim: 'ai', metin: S(['Tabii! Adresinizi ve uygun gününüzü alayım.', 'Hemen ayarlayalım. Adres neresi?', 'Ustamızı yönlendireyim, adresiniz?']) });
    c.push({ kim: 'musteri', metin: S(['{adres}, {gun} öğleden sonra olur.', '{adres}. Ne kadar erken o kadar iyi.', '{adres}, {gun} evdeyim.']) });
    c.push({ kim: 'ai', metin: S(['Kaydınızı aldım, {gun} {saat} gibi oradayız!', 'Tamamdır, ustamız {gun} saat {saat} gibi geliyor.', 'Not ettim, fiyatı da mesajla iletiyoruz!']) });
    sonuc = { tur: 'Teklif', baslik: `${buyuk(u1)} · ${buyuk(gun)} ${sa}`, detay: adres };
  }
  return { cagri: c, sonuc };
}

function hitap(konusan, dinleyen) {
  const k = dinleyen;
  const yasli = k.yas === 'yasli', genc = k.yas === 'genc';
  if (k.cinsiyet === 'kadin') return rnd(yasli ? ['teyze', `${k.isim} abla`, 'ablacım'] : genc ? [k.isim, 'canım', 'kızım'] : [`${k.isim} abla`, 'abla', 'ablacım', k.isim]);
  return rnd(yasli ? ['hacı abi', 'usta', `${k.isim} abi`, 'abi'] : genc ? [k.isim, 'kardeşim', 'yeğenim', 'dostum'] : [`${k.isim} abi`, 'abi', 'usta', 'kardeşim', k.isim]);
}

function kisiYap(meslekAdi, kadinMi) {
  const kadin = kadinMi ?? sans(0.35);
  return { isim: rnd(kadin ? KADIN : ERKEK), meslek: meslekAdi, cinsiyet: kadin ? 'kadin' : 'erkek', yas: rnd(['genc', 'orta', 'orta', 'yasli']) };
}

const MEKANLAR = ['kafe', 'dukkan_onu', 'sahil', 'araba', 'yuruyus', 'park', 'durak', 'pazar', 'balik'];
const ZAMANLAR = ['sabah', 'ogle', 'ogle', 'aksam', 'aksam', 'gece'];

// ------------------------------------------------------------ ana fonksiyon
export function rastgeleSenaryo(ayar = {}) {
  const marka = ayar.marka || 'Yankı AI';
  const m = rnd(MESLEK);
  let mekan = rnd(MEKANLAR);
  if (mekan === 'balik' && sans(0.3)) mekan = rnd(MEKANLAR);
  let zaman = rnd(ZAMANLAR);
  if (mekan === 'balik' && zaman === 'gece') zaman = 'aksam';
  const A = kisiYap(m.ad, m.kadin ? sans(0.8) : undefined);
  const sablonVeri = { isim: A.isim, soyad: rnd(SOYAD), sehir: rnd(SEHIR) };
  A.isletme_adi = doldur(rnd(m.isl), sablonVeri);
  let bMeslek = rnd([...B_MESLEK, ...MESLEK.map(x => x.ad)]);
  while (bMeslek === A.meslek) bMeslek = rnd(B_MESLEK);
  const B = kisiYap(bMeslek);
  while (B.isim === A.isim) B.isim = rnd(B.cinsiyet === 'kadin' ? KADIN : ERKEK);
  B.isletme_adi = `${B.isim} ${B.meslek}`;

  const hAB = () => hitap(A, B), hBA = () => hitap(B, A);
  const ortak = { marka, takim: () => rnd(TAKIM), meslek: A.meslek, bIs: B.meslek.toLocaleLowerCase('tr-TR') };
  const A_ = l => sec(l, { ...ortak, h: hAB });
  const B_ = l => sec(l, { ...ortak, h: hBA });

  // 1) sohbet
  const konuAdi = rnd(sans(0.7) ? (MEKAN_KONU[mekan] || Object.keys(KONULAR)) : Object.keys(KONULAR));
  const konu = KONULAR[konuAdi] || KONULAR.zam;
  const giris = [{ kim: 'B', metin: B_(konu.B) }, { kim: 'A', metin: A_(konu.A) }];
  if (sans(0.55)) giris.push({ kim: 'B', metin: B_(konu.C) });
  // 2) zil
  const zil_tepki = { kim: 'A', metin: A_(ZIL_TEPKI) };
  // 3) çağrı
  const { cagri, sonuc } = cagriKur(m, A.isletme_adi);
  // 4) şaşkınlık + anlatım + kapanış
  const saskinlik = { kim: 'B', metin: B_(SASKIN) };
  const anlatim = [{ kim: 'A', metin: A_(ANLAT1) }];
  if (sans(0.5)) {
    const i = Math.floor(Math.random() * B_SORU.length);
    anlatim.push({ kim: 'B', metin: B_([B_SORU[i]]) }, { kim: 'A', metin: A_([A_CEVAP[i]]) });
  } else anlatim.push({ kim: 'A', metin: A_(ANLAT2[m.tip]) });
  const kapanis = { kim: 'B', metin: B_(KAPANIS) };

  // panel
  const panel_kartlari = Array.from({ length: 3 }, () => {
    const u = rnd(m.u);
    return { tur: sonuc.tur, baslik: `${rnd(sans(0.5) ? ERKEK : KADIN)} ${rnd(SOYAD).charAt(0)}. · ${buyuk(u)}`, detay: `${buyuk(rnd(GUN))} ${saat()}` };
  });
  const ciro = m.tip === 'siparis' || m.tip === 'rezervasyon' || m.tip === 'teklif';
  const istatistik = ciro
    ? { arama: aralik(18, 85), kazanc_etiketi: 'Kurtarılan ciro', kazanc: aralik(8, 140) * 250, birim: '₺' }
    : { arama: aralik(14, 60), kazanc_etiketi: 'Alınan randevu', kazanc: aralik(8, 45), birim: '' };

  // kanca + başlık + açıklama
  const sk = SONUC_KELIME[m.tip];
  const kv = { sk, mi: MEKAN_IFADE[mekan], meslek: A.meslek };
  let kancaSablon = rnd(KANCA), kanca = doldur(kancaSablon[0], kv);
  for (let i = 0; i < 8 && hafizaSet.has('K:' + kanca); i++) { kancaSablon = rnd(KANCA); kanca = doldur(kancaSablon[0], kv); }
  hatirla('K:' + kanca);
  const vurgu = doldur(kancaSablon[1], kv).toLocaleLowerCase('tr-TR');
  const baslik = `${kanca} ${rnd(EMOJI)}${rnd(EMOJI)}`;
  const aciklama = `${kanca}! ${A.meslek} ${A.isim}, telefonu açmadan ${sk} aldı. ${marka} ile işletmenin telefonları 7/24 açık.\n\n${m.h} ${ayar.hashtagler || '#yapayzeka #esnaf #işletme #reels'}`;

  hafizaKaydet();
  return { baslik, aciklama, kanca, kanca_vurgu: vurgu, mekan, zaman, A, B, giris, zil_tepki, cagri, sonuc, saskinlik, anlatim, kapanis, panel_kartlari, istatistik };
}
