package com.neonvideobot.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ServiceInfo;
import android.os.Build;
import android.os.IBinder;
import android.os.PowerManager;

/** Video üretilirken uygulamayı (ekran kapalıyken de) canlı tutan ön plan servisi. */
public class UretimServisi extends Service {
    static final String KANAL = "uretim";
    static final String KANAL_BITTI = "bitti";
    static final int ID = 7;
    static final int ID_BITTI = 8;
    static final String DURDUR = "com.neonvideobot.app.DURDUR";

    private PowerManager.WakeLock kilit;

    static void kanallar(Context c) {
        NotificationManager nm = c.getSystemService(NotificationManager.class);
        if (nm == null) return;
        nm.createNotificationChannel(new NotificationChannel(KANAL, "Video üretimi", NotificationManager.IMPORTANCE_LOW));
        nm.createNotificationChannel(new NotificationChannel(KANAL_BITTI, "Video hazır", NotificationManager.IMPORTANCE_DEFAULT));
    }

    static Notification bildirim(Context c, String metin, int yuzde) {
        PendingIntent ac = PendingIntent.getActivity(c, 0, new Intent(c, MainActivity.class)
                .addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP), PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
        PendingIntent dur = PendingIntent.getService(c, 1, new Intent(c, UretimServisi.class).setAction(DURDUR),
                PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
        Notification.Builder b = new Notification.Builder(c, KANAL)
                .setSmallIcon(R.drawable.ic_bildirim)
                .setColor(0xFFFF1744)
                .setContentTitle("Neon Video Bot")
                .setContentText(metin + (yuzde >= 0 ? "  %" + yuzde : ""))
                .setOngoing(true)
                .setOnlyAlertOnce(true)
                .setContentIntent(ac)
                .addAction(new Notification.Action.Builder(null, "Durdur", dur).build());
        if (yuzde >= 0) b.setProgress(100, yuzde, false);
        return b.build();
    }

    static void guncelle(Context c, String metin, int yuzde) {
        NotificationManager nm = c.getSystemService(NotificationManager.class);
        if (nm != null) nm.notify(ID, bildirim(c, metin, yuzde));
    }

    static void bitti(Context c, String metin) {
        NotificationManager nm = c.getSystemService(NotificationManager.class);
        if (nm == null) return;
        PendingIntent ac = PendingIntent.getActivity(c, 2, new Intent(c, MainActivity.class),
                PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
        nm.notify(ID_BITTI, new Notification.Builder(c, KANAL_BITTI)
                .setSmallIcon(R.drawable.ic_bildirim)
                .setColor(0xFFFF1744)
                .setContentTitle("Neon Video Bot")
                .setContentText(metin)
                .setAutoCancel(true)
                .setContentIntent(ac)
                .build());
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent != null && DURDUR.equals(intent.getAction())) {
            MainActivity m = MainActivity.ornek;
            if (m != null) m.uretimiDurdur();
            return START_NOT_STICKY;
        }
        kanallar(this);
        Notification n = bildirim(this, "Video üretiliyor", 0);
        try {
            if (Build.VERSION.SDK_INT >= 35) {
                startForeground(ID, n, ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PROCESSING);
            } else {
                startForeground(ID, n, ServiceInfo.FOREGROUND_SERVICE_TYPE_DATA_SYNC);
            }
        } catch (Exception e) {
            try { startForeground(ID, n); } catch (Exception ignored) { }
        }
        if (kilit == null) {
            PowerManager pm = (PowerManager) getSystemService(POWER_SERVICE);
            kilit = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "NeonVideoBot:uretim");
            kilit.setReferenceCounted(false);
        }
        kilit.acquire(3 * 60 * 60 * 1000L);
        return START_NOT_STICKY;
    }

    @Override
    public void onDestroy() {
        if (kilit != null && kilit.isHeld()) kilit.release();
        super.onDestroy();
    }

    @Override
    public IBinder onBind(Intent intent) { return null; }
}
