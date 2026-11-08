import { senaryoUret, seslendir } from './gemini.js';
import { yerelSenaryo } from './yerel.js';
import { planla, cizici, OW, OH, FPS } from './sahne.js';
import { miksle, muzik } from './ses.js';
import { kodla } from './kodla.js';

const $ = s => document.querySelector(s);
const A = window.Android || null;
const VARSAYILAN = {
  apiKey: '', marka: 'Yankı AI',
  urun: 'İşletmelerin telefonlarını 7/24 açan, Türkçe konuşan yapay zeka asistanı. Sipariş, randevu ve rezervasyon alır, soruları yanıtlar; her görüşme anında işletme sahibinin paneline düşer. Hiçbir arama kaçmaz.',
  slogan: 'Artık siz dinlemeyin, biz dinleyelim.', cta: 'Hemen talep gönderin', iletisim: '',
  sektorler: 'Restoran, Kebapçı, Diş kliniği, Kuaför, Otel, Veteriner, Oto servis, Pastane',
  ekTalimat: '', palet: 'kirmizi', aiSes: 'Zephyr', seslendirme: true, muzik: true,
  metinModeli: 'gemini-2.5-flash', sesModeli: 'gemini-2.5-flash-preview-tts', adet: 3,
};
const oku = (k, v) => { try { return JSON.parse(localStorage.getItem(k)) ?? v; } catch { return v; } };
const yaz = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { } };
let ayar = { ...VARSAYILAN, ...oku('nvb_ayar', {}) };
let videolar = oku('nvb_videolar', []);
const oturumBlob = new Map();
let calisiyor = false, iptalIstek = false;

// ------------------------------------------------------------ arayüz
function toast(m, sure = 3200) {
  const t = $('#toast'); t.textContent = m; t.classList.add('goster');
  clearTimeout(toast._z); toast._z = setTimeout(() => t.classList.remove('goster'), sure);
}
document.querySelectorAll('nav button').forEach(b => b.onclick = () => {
  document.querySelectorAll('nav button').forEach(x => x.classList.toggle('aktif', x === b));
  document.querySelectorAll('.sayfa').forEach(s => s.classList.toggle('aktif', s.id === 's-' + b.dataset.s));
  if (b.dataset.s === 'videolar') listeCiz();
});
function apiDurum() {
  const d = $('#apiDurum'); const var_ = !!ayar.apiKey;
  d.className = 'durum ' + (var_ ? 'ok' : 'yok');
  d.querySelector('span').textContent = var_ ? 'Gemini bağlı' : 'API yok · demo';
}
function adetCiz() {
  $('#adet').innerHTML = '';
  for (let i = 1; i <= 5; i++) {
    const b = document.createElement('button'); b.textContent = i;
    if (i === ayar.adet) b.classList.add('secili');
    b.onclick = () => { ayar.adet = i; yaz('nvb_ayar', ayar); adetCiz(); };
    $('#adet').appendChild(b);
  }
}
const ALANLAR = ['apiKey', 'marka', 'urun', 'slogan', 'cta', 'iletisim', 'sektorler', 'ekTalimat', 'palet', 'aiSes', 'metinModeli', 'sesModeli'];
function ayarDoldur() {
  ALANLAR.forEach(k => { $('#' + k).value = ayar[k] ?? ''; });
  for (const k of ['seslendirme', 'muzik']) {
    const sw = $('#sw-' + k);
    sw.classList.toggle('acik', !!ayar[k]);
    sw.onclick = () => { ayar[k] = !ayar[k]; sw.classList.toggle('acik', ayar[k]); };
  }
}
$('#goster').onclick = () => { const i = $('#apiKey'); i.type = i.type === 'password' ? 'text' : 'password'; $('#goster').textContent = i.type === 'password' ? 'Göster' : 'Gizle'; };
$('#anahtarAl').onclick = e => { e.preventDefault(); disAc('https://aistudio.google.com/apikey'); };
$('#kaydet').onclick = () => {
  ALANLAR.forEach(k => { ayar[k] = $('#' + k).value.trim(); });
  if (!ayar.metinModeli) ayar.metinModeli = VARSAYILAN.metinModeli;
  if (!ayar.sesModeli) ayar.sesModeli = VARSAYILAN.sesModeli;
  yaz('nvb_ayar', ayar); apiDurum(); toast('✓ Ayarlar kaydedildi');
};
function disAc(u) { if (A) A.ac(u); else window.open(u, '_blank'); }

// ------------------------------------------------------------ üretim
const adim = (ad, durum) => { const e = document.querySelector(`.adim[data-a="${ad}"]`); e.className = 'adim ' + (durum || ''); };
const adimlariSifirla = () => ['senaryo', 'ses', 'video', 'kayit'].forEach(a => adim(a, ''));
const bar = p => { $('#bar').style.width = (p * 100).toFixed(1) + '%'; };
const onizCtx = $('#onizleme').getContext('2d');

$('#olusturBtn').onclick = async () => {
  if (calisiyor) return;
  if (!ayar.apiKey) toast('API anahtarı yok: hazır demo senaryolar kullanılacak. Ayarlardan ekleyebilirsin.', 4500);
  calisiyor = true; iptalIstek = false;
  $('#olusturBtn').classList.add('calisiyor');
  $('#ilerleme').classList.add('goster');
  $('#ipucu').style.display = 'none';
  if (A?.ekranAcik) A.ekranAcik(true);
  let kilit = null; try { kilit = await navigator.wakeLock?.request('screen'); } catch { }
  let basarili = 0;
  try {
    await document.fonts.load('800 50px Inter'); await document.fonts.load('600 40px Inter'); await document.fonts.load('700 40px Inter');
    for (let i = 0; i < ayar.adet && !iptalIstek; i++) {
      $('#sayac').textContent = `VİDEO ${i + 1} / ${ayar.adet}`;
      $('#olusturYazi').textContent = `${i + 1}/${ayar.adet}`;
      try { await birVideo(i); basarili++; }
      catch (e) {
        if (e.message === 'IPTAL') break;
        console.error(e);
        toast('✗ ' + (e.message || e), 6000);
        if (/API anahtarı/.test(e.message)) break;
      }
    }
  } finally {
    calisiyor = false;
    $('#olusturBtn').classList.remove('calisiyor');
    $('#olusturYazi').textContent = 'OLUŞTUR'; $('#olusturAlt').textContent = 'dokun ve başlasın';
    if (A?.ekranAcik) A.ekranAcik(false);
    try { kilit?.release(); } catch { }
    if (basarili) { toast(`✓ ${basarili} video hazır! Videolar sekmesinde.`, 4000); }
    setTimeout(() => { if (!calisiyor) { $('#ilerleme').classList.remove('goster'); $('#ipucu').style.display = ''; } }, 2500);
  }
};
$('#durdurBtn').onclick = () => { iptalIstek = true; toast('Durduruluyor…'); };

async function birVideo(i) {
  adimlariSifirla(); bar(0);
  $('#baslikMini').textContent = 'Hazırlanıyor…';
  // 1) senaryo
  adim('senaryo', 'aktif');
  const gecmis = oku('nvb_gecmis', []);
  let s;
  if (ayar.apiKey) {
    try { s = await senaryoUret(ayar, gecmis, m => { $('#olusturAlt').textContent = m; }); }
    catch (e) { if (/API anahtarı/.test(e.message)) throw e; toast('Gemini senaryo hatası, demo senaryo kullanılıyor: ' + e.message, 5000); s = yerelSenaryo(ayar, gecmis.length + i); }
  } else s = yerelSenaryo(ayar, gecmis.length + i);
  gecmis.push(`${s.baslik} — ${s.giris?.[0]?.metin || ''}`); yaz('nvb_gecmis', gecmis.slice(-40));
  $('#baslikMini').textContent = s.baslik;
  adim('senaryo', 'tamam');
  if (iptalIstek) throw new Error('IPTAL');
  // 2) ses
  adim('ses', 'aktif');
  let sesler = null;
  if (ayar.apiKey && ayar.seslendirme) {
    try { sesler = await seslendir(ayar, s, m => { $('#olusturAlt').textContent = m; }); }
    catch (e) { toast('Seslendirme yapılamadı (kota olabilir), yazılı devam: ' + e.message, 5500); }
  }
  adim('ses', 'tamam');
  if (iptalIstek) throw new Error('IPTAL');
  // 3) video
  adim('video', 'aktif');
  $('#olusturAlt').textContent = 'video çiziliyor';
  const plan = planla(s, sesler, ayar);
  const ciz = cizici(plan);
  const sesSig = miksle(plan.sesOlay, plan.sure, ayar.muzik ? muzik(plan.sure + 1, Date.now() % 997) : null, 0.42);
  const blob = await kodla({
    sure: plan.sure, fps: FPS, genislik: OW, yukseklik: OH, kare: ciz.kare, ses: sesSig,
    iptal: () => iptalIstek,
    ilerleme: (p, tv) => {
      bar(p); $('#olusturAlt').textContent = `%${Math.round(p * 100)}`;
      if (tv) onizCtx.drawImage(tv, 0, 0, 270, 480);
    },
  });
  adim('video', 'tamam');
  // kapak
  const [kap, kx] = [document.createElement('canvas'), null];
  kap.width = 180; kap.height = 320;
  const cagri = plan.cekim.find(c => c.tip === 'cagri');
  kap.getContext('2d').drawImage(ciz.kare(cagri ? cagri.sonucT + 0.6 : plan.sure / 2), 0, 0, 180, 320);
  const kapak = kap.toDataURL('image/jpeg', 0.72);
  // 4) kayıt
  adim('kayit', 'aktif');
  const ad = `NeonBot_${new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-')}_${i + 1}.${blob.type.includes('webm') ? 'webm' : 'mp4'}`;
  const uri = await kaydet(blob, ad);
  const id = Date.now() + '_' + i;
  oturumBlob.set(id, URL.createObjectURL(blob));
  videolar.unshift({ id, baslik: s.baslik, aciklama: s.aciklama, tarih: Date.now(), uri, kapak, ad });
  yaz('nvb_videolar', videolar.slice(0, 60));
  adim('kayit', 'tamam');
}

async function kaydet(blob, ad) {
  if (!A) { // tarayıcıda: indir
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = ad; a.click();
    return '';
  }
  if (!A.dosyaBasla(ad, blob.type)) throw new Error('Galeriye yazılamadı');
  const P = 3 * 256 * 1024;
  for (let i = 0; i < blob.size; i += P) {
    const b64 = await new Promise((res, rej) => {
      const r = new FileReader(); r.onload = () => res(String(r.result).split(',')[1]); r.onerror = rej;
      r.readAsDataURL(blob.slice(i, i + P));
    });
    if (!A.dosyaParca(b64)) throw new Error('Kayıt sırasında hata');
    bar(i / blob.size);
  }
  return A.dosyaBitir();
}

// ------------------------------------------------------------ liste
function listeCiz() {
  const l = $('#liste');
  if (!videolar.length) { l.innerHTML = '<div class="bosListe">Henüz video yok.<br>Oluştur sekmesinden başla 🚀</div>'; return; }
  l.innerHTML = '';
  for (const v of videolar) {
    const e = document.createElement('div'); e.className = 'video';
    e.innerHTML = `${v.kapak ? `<img src="${v.kapak}">` : '<div class="bos"></div>'}
      <div class="bilgi"><h3></h3><div class="tarih">${new Date(v.tarih).toLocaleString('tr-TR')}</div>
      <div class="eylemler">
        <button class="ana" data-e="izle">▶ İzle</button>
        <button data-e="ig">Instagram</button><button data-e="tt">TikTok</button><button data-e="yt">YouTube</button>
        <button data-e="pay">Paylaş…</button><button data-e="kop">Açıklamayı kopyala</button><button data-e="sil">Sil</button>
      </div></div>`;
    e.querySelector('h3').textContent = v.baslik;
    e.querySelectorAll('button').forEach(b => b.onclick = () => eylem(v, b.dataset.e));
    l.appendChild(e);
  }
}
const PAKET = { ig: 'com.instagram.android', tt: 'com.zhiliaoapp.musically', yt: 'com.google.android.youtube', pay: '' };
function eylem(v, e) {
  if (e === 'izle') {
    const b = oturumBlob.get(v.id);
    if (b) { $('#video').src = b; $('#oynatici').classList.add('goster'); $('#video').play(); }
    else if (A && v.uri) A.ac(v.uri);
    else toast('Video galeride kayıtlı.');
  } else if (e in PAKET) {
    if (!A) return toast('Paylaşım telefonda çalışır.');
    A.kopyala(v.aciklama || '');
    toast('Açıklama kopyalandı, yapıştırman yeter 📋', 3500);
    const ok = A.paylas(v.uri, v.aciklama || '', PAKET[e]);
    if (!ok && PAKET[e]) { if (e === 'tt') A.paylas(v.uri, v.aciklama || '', 'com.ss.android.ugc.trill') || A.paylas(v.uri, v.aciklama || '', ''); else A.paylas(v.uri, v.aciklama || '', ''); }
  } else if (e === 'kop') {
    if (A) A.kopyala(v.aciklama || ''); else navigator.clipboard?.writeText(v.aciklama || '');
    toast('📋 Açıklama + hashtagler kopyalandı');
  } else if (e === 'sil') {
    if (A && v.uri) A.sil(v.uri);
    videolar = videolar.filter(x => x.id !== v.id); yaz('nvb_videolar', videolar); listeCiz();
  }
}
$('#kapatOyn').onclick = () => { $('#video').pause(); $('#oynatici').classList.remove('goster'); };
window.geriTusu = () => {
  if ($('#oynatici').classList.contains('goster')) { $('#kapatOyn').click(); return true; }
  const ana = document.querySelector('nav button[data-s="olustur"]');
  if (!ana.classList.contains('aktif')) { ana.click(); return true; }
  return false;
};

apiDurum(); adetCiz(); ayarDoldur();
