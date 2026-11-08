# 📱 Neon Video Bot

Telefonda tek tuşla **yapay zeka reklam videosu** üreten Android uygulaması.

Gemini her gün yeni bir senaryo yazar: iki esnaf sohbet ederken birinin telefonu çalar, telefonu
yapay zeka asistanı açar, sipariş/randevuyu alır; diğer esnaf "Nasıl ya?!" der ve panel gösterilir.
Uygulama sahneleri piksel sanat olarak çizer, Gemini ile iki kişilik Türkçe seslendirme yapar,
müzik ve efektleri ekler ve **1080x1920 MP4** olarak galeriye kaydeder (Reels / TikTok / Shorts).

## ⬇️ İndir
**[NeonVideoBot.apk (son sürüm)](../../releases/latest/download/NeonVideoBot.apk)**

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
