# 🎬 RedCut

Videolarını Gemini ile analiz edip müziğin ritmine göre otomatik edit yapan, anlatım videolarına
altyazı ve kodla üretilmiş animasyonlar ekleyen Android uygulaması. Neon kırmızı · beyaz · siyah.

## ⬇️ İndir
[Releases](../../releases) sayfasında en yeni **RedCut v1.0.x** sürümünün altındaki **RedCut.apk** dosyasını indir.

## Modlar
- **Serbest**: prompt ne derse o (gol derlemesi, kılıç efekti, montaj…)
- **Anlatım**: sessizlik/tekrar kesme, kelime kelime altyazı, Gemini'nin her an için yazdığı Canvas animasyonları, ekran kaydında zoom
- **Fail → Başarı**, **Highlight / Gol**, **Hype Montaj**, **Önce / Sonra**, **Sinematik**

## Kurulum
1. APK'yı kur ve aç.
2. ⚙️ Ayarlar → [Google AI Studio](https://aistudio.google.com/apikey)'dan aldığın ücretsiz Gemini key'i gir.
3. Videoları ve müziği at, prompt'u yaz, **Analiz et** → **Kurgu** → **Render al** → **Galeriye kaydet**.

Key yoksa uygulama offline modda (hareket + ses analizi) çalışır.

## Yapı
- `web/index.html`: uygulamanın tamamı (analiz, beat tespiti, plan, render, animasyon kum havuzu)
- `android/`: WebView kabuğu (dosya seçici, galeriye kaydetme, paylaşma)
- Her `redcut` dalı push'unda GitHub Actions APK derler ve Releases'a koyar.
