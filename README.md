# 📱 Neon Video Bot

Telefonda tek tuşla **yapay zeka reklam videosu** üreten Android uygulaması.

Gemini her gün yeni bir senaryo yazar: iki esnaf sohbet ederken birinin telefonu çalar, telefonu
yapay zeka asistanı açar, sipariş/randevuyu alır; diğer esnaf "Nasıl ya?!" der ve panel gösterilir.
Uygulama sahneleri piksel sanat olarak çizer, Gemini ile iki kişilik Türkçe seslendirme yapar,
müzik ve efektleri ekler ve **1080x1920 MP4** olarak galeriye kaydeder (Reels / TikTok / Shorts).

## ⬇️ İndir
**[NeonVideoBot.apk (son sürüm)](../../releases/latest/download/NeonVideoBot.apk)**

## 🎬 Sinema 3D (yeni)
**Oluştur → 🎬 Sinema 3D** seç, videoyu kendi cümlelerinle anlat (ör. *"Çanakkale'de cephede savaşırken…"*)
ya da bir özel gün çipine dokun (10 Kasım, 18 Mart, 23 Nisan, 19 Mayıs, 30 Ağustos, 29 Ekim, Yılbaşı, Reklam).
- Gemini anahtarı varsa anlattığını sahne sahne plana çevirir: mekan, karakterler, eylemler, kamera, ışık, yazılar, alıntılar.
- Telefon videoyu **3D motorla** çizer: eli kolu ayağı ayrı hareket eden insanlar, dalgalanan bayraklar, 8 mekan
  (sokak, Anıtkabir, cephe, meydan, okul, sahil, tepe, siyah kart), duman/patlama/havai fişek/kar/yağmur.
- Müziği kendisi besteler (huzunlu ney ağıtı, destansı davul, neşeli marş, gergin, umut) ve efektleri ekler (siren, top, rüzgar, dalga, alkış…).
- Kod: `js/sinemaMotor.js` (3D motor + mekanlar), `js/sinemaPlan.js` (Gemini planı + şablonlar), `js/sinemaSes.js` (müzik/efekt sentezi).

## Kullanım
1. APK'yı kur, uygulamayı aç.
2. **Ayarlar** → Gemini API anahtarını yapıştır ([ücretsiz al](https://aistudio.google.com/apikey)) → Kaydet.
3. **Oluştur**: kaç video istediğini seç, büyük butona bas.
4. **Videolar**: izle, Instagram / TikTok / YouTube'a tek dokunuşla paylaş (açıklama + hashtag otomatik kopyalanır).

API anahtarı yokken uygulama hazır demo senaryolarla çalışır.

## Yapı
- `web/`: uygulamanın kendisi (HTML/JS). Senaryo, ses, piksel çizim ve MP4 kodlama burada.
  - `js/gemini.js`: senaryo (JSON şema) + çok konuşmacılı TTS
  - `js/piksel.js`: mekanlar (kafe, dükkan önü, sahil), karakterler
  - `js/sahne.js`: zaman çizelgesi, kamera, balonlar, telefon arayüzü, panel, kapanış
  - `js/ses.js`: replik bölme, efektler, müzik, miksaj
  - `js/kodla.js`: WebCodecs + MP4 paketleyici
- `android/`: WebView kabuğu (galeriye kaydetme, paylaşma).
- Her `main` push'unda GitHub Actions APK derler ve Releases'a koyar.
