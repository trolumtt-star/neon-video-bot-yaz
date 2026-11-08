package com.redcut.app;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.ContentValues;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.os.Environment;
import android.provider.MediaStore;
import android.util.Base64;
import android.view.WindowManager;
import android.webkit.JavascriptInterface;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import androidx.webkit.WebViewAssetLoader;

import java.io.OutputStream;
import java.util.ArrayList;
import java.util.List;

public class MainActivity extends Activity {
    private static final String ADRES = "https://appassets.androidplatform.net/assets/index.html";
    private static final int DOSYA_SEC = 41;
    private WebView web;
    private OutputStream akis;
    private Uri aktifUri;
    private ValueCallback<Uri[]> dosyaCb;

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

        // <input type="file"> için Android dosya seçicisi (video, müzik, çoklu seçim)
        web.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onShowFileChooser(WebView v, ValueCallback<Uri[]> cb, FileChooserParams p) {
                if (dosyaCb != null) dosyaCb.onReceiveValue(null);
                dosyaCb = cb;
                List<String> turler = new ArrayList<>();
                String[] kabul = p.getAcceptTypes();
                if (kabul != null) {
                    for (String a : kabul) {
                        if (a == null) continue;
                        for (String parca : a.split(",")) {
                            String t = parca.trim();
                            if (!t.isEmpty() && t.contains("/")) turler.add(t);
                        }
                    }
                }
                Intent i = new Intent(Intent.ACTION_GET_CONTENT);
                i.addCategory(Intent.CATEGORY_OPENABLE);
                if (turler.size() == 1) {
                    i.setType(turler.get(0));
                } else {
                    i.setType("*/*");
                    if (!turler.isEmpty()) i.putExtra(Intent.EXTRA_MIME_TYPES, turler.toArray(new String[0]));
                }
                if (p.getMode() == FileChooserParams.MODE_OPEN_MULTIPLE) i.putExtra(Intent.EXTRA_ALLOW_MULTIPLE, true);
                try {
                    startActivityForResult(Intent.createChooser(i, "Dosya seç"), DOSYA_SEC);
                } catch (Exception e) {
                    dosyaCb = null;
                    return false;
                }
                return true;
            }
        });

        web.addJavascriptInterface(new Kopru(), "Android");
        if (savedInstanceState != null) web.restoreState(savedInstanceState);
        else web.loadUrl(ADRES);
    }

    @Override
    protected void onActivityResult(int istek, int sonuc, Intent veri) {
        if (istek == DOSYA_SEC) {
            Uri[] secilen = null;
            if (sonuc == RESULT_OK && veri != null) {
                if (veri.getClipData() != null) {
                    int n = veri.getClipData().getItemCount();
                    secilen = new Uri[n];
                    for (int k = 0; k < n; k++) secilen[k] = veri.getClipData().getItemAt(k).getUri();
                } else if (veri.getData() != null) {
                    secilen = new Uri[]{veri.getData()};
                }
            }
            if (dosyaCb != null) dosyaCb.onReceiveValue(secilen);
            dosyaCb = null;
            return;
        }
        super.onActivityResult(istek, sonuc, veri);
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

    /** JavaScript köprüsü: window.Android.* */
    private class Kopru {
        @JavascriptInterface
        public boolean dosyaBasla(String ad, String mime) {
            try {
                ContentValues cv = new ContentValues();
                cv.put(MediaStore.Video.Media.DISPLAY_NAME, ad);
                cv.put(MediaStore.Video.Media.MIME_TYPE, mime == null || mime.isEmpty() ? "video/mp4" : mime);
                cv.put(MediaStore.Video.Media.RELATIVE_PATH, Environment.DIRECTORY_MOVIES + "/RedCut");
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
                i.setType("video/*");
                i.putExtra(Intent.EXTRA_STREAM, Uri.parse(uri));
                if (metin != null && !metin.isEmpty()) i.putExtra(Intent.EXTRA_TEXT, metin);
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
        public void ekranAcik(boolean acik) {
            runOnUiThread(() -> {
                if (acik) getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
                else getWindow().clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
            });
        }
    }
}
