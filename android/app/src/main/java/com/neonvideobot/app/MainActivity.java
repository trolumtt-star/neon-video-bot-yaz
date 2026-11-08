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

import androidx.webkit.WebViewAssetLoader;

import java.io.OutputStream;

public class MainActivity extends Activity {
    private static final String ADRES = "https://appassets.androidplatform.net/assets/index.html";
    private WebView web;
    private OutputStream akis;
    private Uri aktifUri;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        web = new WebView(this);
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
        public void ekranAcik(boolean acik) {
            runOnUiThread(() -> {
                if (acik) getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
                else getWindow().clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
            });
        }
    }
}
