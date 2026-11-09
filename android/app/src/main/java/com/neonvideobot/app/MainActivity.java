package com.neonvideobot.app;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.ContentValues;
import android.content.Context;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.os.Environment;
import android.provider.MediaStore;
import android.util.Base64;
import android.view.WindowManager;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.Manifest;
import android.content.pm.PackageManager;
import android.os.Build;
import android.speech.tts.TextToSpeech;
import android.speech.tts.UtteranceProgressListener;
import android.speech.tts.Voice;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.File;
import java.nio.file.Files;
import java.util.Locale;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;

import androidx.webkit.WebViewAssetLoader;

import java.io.OutputStream;

public class MainActivity extends Activity {
    private static final String ADRES = "https://appassets.androidplatform.net/assets/index.html";
    static MainActivity ornek;
    private WebView web;
    private OutputStream akis;
    private Uri aktifUri;
    private TextToSpeech tts;
    private volatile int ttsDurum = 0; // 0 hazırlanıyor, 1 hazır, -1 yok
    private final ConcurrentHashMap<String, CountDownLatch> bekleyen = new ConcurrentHashMap<>();
    private static final Locale TR = new Locale("tr", "TR");

    void uretimiDurdur() {
        runOnUiThread(() -> web.evaluateJavascript("window.uretimiDurdur && window.uretimiDurdur()", null));
    }

    private void ttsBaslat() {
        tts = new TextToSpeech(getApplicationContext(), durum -> {
            if (durum == TextToSpeech.SUCCESS) {
                int r = tts.setLanguage(TR);
                tts.setOnUtteranceProgressListener(new UtteranceProgressListener() {
                    @Override public void onStart(String id) { }
                    @Override public void onDone(String id) { bitir(id); }
                    @Override public void onError(String id) { bitir(id); }
                    @Override public void onError(String id, int kod) { bitir(id); }
                });
                ttsDurum = r >= 0 ? 1 : -1;
            } else {
                ttsDurum = -1;
            }
        });
    }

    private void bitir(String id) {
        CountDownLatch l = bekleyen.remove(id);
        if (l != null) l.countDown();
    }

    private boolean ttsBekle() {
        long son = System.currentTimeMillis() + 8000;
        while (ttsDurum == 0 && System.currentTimeMillis() < son) {
            try { Thread.sleep(50); } catch (InterruptedException e) { return false; }
        }
        return ttsDurum == 1;
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        ornek = this;
        UretimServisi.kanallar(this);
        if (Build.VERSION.SDK_INT >= 33 && checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
            requestPermissions(new String[]{Manifest.permission.POST_NOTIFICATIONS}, 1);
        }
        ttsBaslat();
        web = new WebView(this);
        // ekran kapalıyken / arka plandayken de çizim yavaşlamasın
        web.setRendererPriorityPolicy(WebView.RENDERER_PRIORITY_IMPORTANT, false);
        web.setBackgroundColor(Color.BLACK);
        setContentView(web);

        final WebViewAssetLoader yukleyici = new WebViewAssetLoader.Builder()
                .addPathHandler("/assets/", new WebViewAssetLoader.AssetsPathHandler(this))
                .build();

        WebSettings ws = web.getSettings();
        ws.setJavaScriptEnabled(true);
        ws.setDomStorageEnabled(true);
        ws.setMediaPlaybackRequiresUserGesture(false);
        ws.setAllowFileAccess(false);
        ws.setAllowContentAccess(true);
        ws.setTextZoom(100);

        web.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest req) {
                return yukleyici.shouldInterceptRequest(req.getUrl());
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest req) {
                Uri u = req.getUrl();
                if ("appassets.androidplatform.net".equals(u.getHost())) return false;
                try { startActivity(new Intent(Intent.ACTION_VIEW, u)); } catch (Exception ignored) { }
                return true;
            }
        });
        web.setWebChromeClient(new WebChromeClient());
        web.addJavascriptInterface(new Kopru(), "Android");
        if (savedInstanceState != null) web.restoreState(savedInstanceState);
        else web.loadUrl(ADRES);
    }

    @Override
    protected void onDestroy() {
        if (ornek == this) ornek = null;
        if (tts != null) tts.shutdown();
        super.onDestroy();
    }

    @Override
    protected void onSaveInstanceState(Bundle outState) {
        super.onSaveInstanceState(outState);
        web.saveState(outState);
    }

    @Override
    public void onBackPressed() {
        web.evaluateJavascript("window.geriTusu ? window.geriTusu() : false", deger -> {
            if (!"true".equals(deger)) MainActivity.super.onBackPressed();
        });
    }

    /** JavaScript'ten çağrılan köprü: window.Android.* */
    private class Kopru {
        @JavascriptInterface
        public boolean dosyaBasla(String ad, String mime) {
            try {
                ContentValues cv = new ContentValues();
                cv.put(MediaStore.Video.Media.DISPLAY_NAME, ad);
                cv.put(MediaStore.Video.Media.MIME_TYPE, mime == null || mime.isEmpty() ? "video/mp4" : mime);
                cv.put(MediaStore.Video.Media.RELATIVE_PATH, Environment.DIRECTORY_MOVIES + "/NeonVideoBot");
                cv.put(MediaStore.Video.Media.IS_PENDING, 1);
                aktifUri = getContentResolver().insert(
                        MediaStore.Video.Media.getContentUri(MediaStore.VOLUME_EXTERNAL_PRIMARY), cv);
                if (aktifUri == null) return false;
                akis = getContentResolver().openOutputStream(aktifUri);
                return akis != null;
            } catch (Exception e) {
                return false;
            }
        }

        @JavascriptInterface
        public boolean dosyaParca(String b64) {
            try {
                akis.write(Base64.decode(b64, Base64.DEFAULT));
                return true;
            } catch (Exception e) {
                return false;
            }
        }

        @JavascriptInterface
        public String dosyaBitir() {
            try {
                akis.flush();
                akis.close();
                ContentValues cv = new ContentValues();
                cv.put(MediaStore.Video.Media.IS_PENDING, 0);
                getContentResolver().update(aktifUri, cv, null, null);
                return aktifUri.toString();
            } catch (Exception e) {
                return "";
            }
        }

        @JavascriptInterface
        public boolean paylas(String uri, String metin, String paket) {
            try {
                Intent i = new Intent(Intent.ACTION_SEND);
                i.setType("video/mp4");
                i.putExtra(Intent.EXTRA_STREAM, Uri.parse(uri));
                i.putExtra(Intent.EXTRA_TEXT, metin);
                i.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                if (paket != null && !paket.isEmpty()) {
                    i.setPackage(paket);
                    startActivity(i);
                } else {
                    Intent secici = Intent.createChooser(i, "Videoyu paylaş");
                    secici.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                    startActivity(secici);
                }
                return true;
            } catch (ActivityNotFoundException e) {
                return false;
            } catch (Exception e) {
                return false;
            }
        }

        @JavascriptInterface
        public void kopyala(String metin) {
            runOnUiThread(() -> {
                ClipboardManager cm = (ClipboardManager) getSystemService(Context.CLIPBOARD_SERVICE);
                if (cm != null) cm.setPrimaryClip(ClipData.newPlainText("aciklama", metin));
            });
        }

        @JavascriptInterface
        public void ac(String adres) {
            runOnUiThread(() -> {
                try {
                    Uri u = Uri.parse(adres);
                    Intent i = new Intent(Intent.ACTION_VIEW);
                    if ("content".equals(u.getScheme())) {
                        i.setDataAndType(u, "video/*");
                        i.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                    } else {
                        i.setData(u);
                    }
                    startActivity(i);
                } catch (Exception ignored) { }
            });
        }

        @JavascriptInterface
        public void sil(String adres) {
            try { getContentResolver().delete(Uri.parse(adres), null, null); } catch (Exception ignored) { }
        }

        @JavascriptInterface
        public void arkaPlanBasla() {
            Intent i = new Intent(MainActivity.this, UretimServisi.class);
            try { startForegroundService(i); } catch (Exception ignored) { }
        }

        @JavascriptInterface
        public void bildirim(String metin, int yuzde) {
            UretimServisi.guncelle(MainActivity.this, metin, yuzde);
        }

        @JavascriptInterface
        public void arkaPlanBitir(String mesaj) {
            stopService(new Intent(MainActivity.this, UretimServisi.class));
            if (mesaj != null && !mesaj.isEmpty()) UretimServisi.bitti(MainActivity.this, mesaj);
        }

        @JavascriptInterface
        public String ttsSesler() {
            JSONArray a = new JSONArray();
            if (!ttsBekle()) return a.toString();
            try {
                java.util.Set<Voice> sesler = tts.getVoices();
                if (sesler != null) for (Voice v : sesler) {
                    if (v.getLocale() == null || !"tr".equals(v.getLocale().getLanguage())) continue;
                    boolean kurulu = v.getFeatures() == null || !v.getFeatures().contains(TextToSpeech.Engine.KEY_FEATURE_NOT_INSTALLED);
                    if (!kurulu) continue;
                    JSONObject o = new JSONObject();
                    o.put("ad", v.getName());
                    o.put("yerel", !v.isNetworkConnectionRequired());
                    a.put(o);
                }
                if (a.length() == 0) {
                    JSONObject o = new JSONObject();
                    o.put("ad", "");
                    o.put("yerel", true);
                    a.put(o);
                }
            } catch (Exception ignored) { }
            return a.toString();
        }

        @JavascriptInterface
        public String tts(String metin, String ses, float perde, float hiz) {
            if (!ttsBekle()) return "";
            File f = new File(getCacheDir(), "tts_" + System.nanoTime() + ".wav");
            String id = UUID.randomUUID().toString();
            CountDownLatch l = new CountDownLatch(1);
            bekleyen.put(id, l);
            try {
                synchronized (MainActivity.this) {
                    boolean secildi = false;
                    if (ses != null && !ses.isEmpty()) {
                        java.util.Set<Voice> sesler = tts.getVoices();
                        if (sesler != null) for (Voice v : sesler) {
                            if (v.getName().equals(ses)) { tts.setVoice(v); secildi = true; break; }
                        }
                    }
                    if (!secildi) tts.setLanguage(TR);
                    tts.setPitch(perde);
                    tts.setSpeechRate(hiz);
                    Bundle b = new Bundle();
                    b.putString(TextToSpeech.Engine.KEY_PARAM_UTTERANCE_ID, id);
                    if (tts.synthesizeToFile(metin, b, f, id) != TextToSpeech.SUCCESS) { bekleyen.remove(id); return ""; }
                    l.await(40, TimeUnit.SECONDS);
                }
                if (!f.exists() || f.length() < 100) return "";
                byte[] veri = Files.readAllBytes(f.toPath());
                return Base64.encodeToString(veri, Base64.NO_WRAP);
            } catch (Exception e) {
                return "";
            } finally {
                bekleyen.remove(id);
                //noinspection ResultOfMethodCallIgnored
                f.delete();
            }
        }

        @JavascriptInterface
        public void ekranAcik(boolean acik) {
            runOnUiThread(() -> {
                if (acik) getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
                else getWindow().clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
            });
        }
    }
}
