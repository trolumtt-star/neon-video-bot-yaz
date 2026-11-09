import { senaryoUret, seslendir, modelTemizle, METIN_MODELLERI } from './gemini.js';
import { HAZIR } from './yerel.js';
import { rastgeleSenaryo } from './uretec.js';
import { metniCoz, metneCevir, BOS_SABLON } from './senaryoMetin.js';
import { telefonSesiVar, telefonlaSeslendir, bosluk } from './sesTelefon.js';
import { planla, cizici, OW, OH, FPS } from './sahne.js';
import { miksle, muzik } from './ses.js';
import { kodla } from './kodla.js';
import { planGemini, planYerel, planHazirla, OZEL_GUNLER } from './sinemaPlan.js';
import { cizici as sinemaCizici, OW as SOW, OH as SOH, FPS as SFPS } from './sinemaMotor.js';
import { sinemaSesi } from './sinemaSes.js';

const $ = s => document.querySelector(s);
const A = window.Android || null;
const VARSAYILAN = {
  apiKey: '', marka: 'Dinlio AI', sinemaIstem: '',
  urun: 'İşletmelerin telefonlarını 7/24 açan, Türkçe konuşan yapay zeka asistanı. Sipariş, randevu ve rezervasyon alır, soruları yanıtlar; her görüşme anında işletme sahibinin paneline düşer. Hiçbir arama kaçmaz.',
  slogan: 'Artık siz dinlemeyin, biz dinleyelim.', cta: 'Hemen talep gönderin', iletisim: '',
  sektorler: 'Restoran, Kebapçı, Diş kliniği, Kuaför, Otel, Veteriner, Oto servis, Pastane',
  hashtagler: '#yapayzeka #esnaf #işletme #girişimci #reels #keşfet',
  ekTalimat: '', palet: 'kirmizi', aiSes: 'Zephyr', sesMotoru: 'telefon', muzik: true,
  metinModeli: 'gemini-3.5-flash-lite', sesModeli: 'gemini-2.5-flash-preview-tts', adet: 3, kaynak: 'otomatik', dongu: true,
};
const oku = (k, v) => { try { return JSON.parse(localStorage.getItem(k)) ?? v; } catch { return v; } };
const yaz = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { } };
let ayar = { ...VARSAYILAN, ...oku('nvb_ayar', {}) };
if (ayar.seslendirme === false && !oku('nvb_ayar', {}).sesMotoru) ayar.sesMotoru = 'kapali';
if (!ayar.v3) { ayar.kaynak = 'otomatik'; ayar.v3 = true; yaz('nvb_ayar', ayar); }
ayar.metinModeli = modelTemizle(ayar.metinModeli); if (!METIN_MODELLERI.includes(ayar.metinModeli)) ayar.metinModeli = 'gemini-3.5-flash-lite';
if (ayar.marka === 'Yankı AI') { ayar.marka = 'Dinlio AI'; yaz('nvb_ayar', ayar); }
let videolar = oku('nvb_videolar', []);
let kuyruk = oku('nvb_kuyruk', null);
const oturumBlob = new Map();
let calisiyor = false, iptalIstek = false;

// ilk açılışta hazır örnekler kuyrukta olsun
if (!kuyruk) { kuyruk = []; HAZIR.forEach(m => kuyrugaEkle(m, false)); kaydetKuyruk(); }

function kuyrugaEkle(metin, kaydet = true) {
  const no = (oku('nvb_sayac', 0) || 0) + 1; yaz('nvb_sayac', no);
  const { senaryo, hatalar } = metniCoz(metin);
  const ciddi = hatalar.some(h => h.startsWith('En az'));
  kuyruk.push({ id: Date.now() + '_' + no, no, metin, durum: ciddi ? 'hatali' : 'bekliyor', baslik: senaryo.kanca || senaryo.baslik, mekan: senaryo.mekan });
  if (kaydet) kaydetKuyruk();
}
function kaydetKuyruk() { yaz('nvb_kuyruk', kuyruk); }
const siradakiSen = () => kuyruk.find(k => k.durum === 'bekliyor');

// ------------------------------------------------------------ arayüz
function toast(m, sure = 3200) {
  const t = $('#toast'); t.textContent = m; t.classList.add('goster');
  clearTimeout(toast._z); toast._z = setTimeout(() => t.classList.remove('goster'), sure);
}
function sayfaAc(ad) {
  document.querySelectorAll('nav button').forEach(x => x.classList.toggle('aktif', x.dataset.s === ad));
  document.querySelectorAll('.sayfa').forEach(s => s.classList.toggle('aktif', s.id === 's-' + ad));
  if (ad === 'videolar') listeCiz();
  if (ad === 'senaryolar') senListeCiz();
  if (ad === 'olustur') kaynakCiz();
}
document.querySelectorAll('nav button').forEach(b => b.onclick = () => sayfaAc(b.dataset.s));
function apiDurum() {
  const d = $('#apiDurum');
  const tel = telefonSesiVar();
  const yazi = ayar.kaynak === 'sinema' ? (ayar.apiKey && navigator.onLine ? 'Sinema · Gemini' : 'Sinema · şablon') : ayar.kaynak === 'otomatik' ? (navigator.onLine ? 'Otomatik' : 'İnternetsiz mod') : ayar.kaynak === 'gemini' ? (ayar.apiKey ? 'Gemini bağlı' : 'API yok') : (navigator.onLine ? 'Çevrimiçi' : 'İnternetsiz mod');
  d.className = 'durum ' + (ayar.kaynak === 'gemini' && !ayar.apiKey ? 'yok' : 'ok');
  d.querySelector('span').textContent = yazi + (ayar.sesMotoru === 'telefon' && !tel && A ? ' · ses yok' : '');
}
window.addEventListener('online', apiDurum); window.addEventListener('offline', apiDurum);
function adetCiz() {
  $('#adet').innerHTML = '';
  for (let i = 1; i <= 5; i++) {
    const b = document.createElement('button'); b.textContent = i;
    if (i === ayar.adet) b.classList.add('secili');
    b.onclick = () => { ayar.adet = i; yaz('nvb_ayar', ayar); adetCiz(); };
    $('#adet').appendChild(b);
  }
}
function kaynakCiz() {
  document.querySelectorAll('#kaynak button').forEach(b => {
    b.classList.toggle('secili', b.dataset.k === ayar.kaynak);
    b.onclick = () => { ayar.kaynak = b.dataset.k; yaz('nvb_ayar', ayar); kaynakCiz(); apiDurum(); };
  });
  $('#sinemaPanel').classList.toggle('goster', ayar.kaynak === 'sinema');
  if (ayar.kaynak === 'sinema') { $('#siradaki').innerHTML = '🎬 Yazdığın hikâyeyi <b>3D filme</b> çevirir: mekan, karakterler, kamera, müzik.'; return; }
  const s = siradakiSen();
  if (ayar.kaynak === 'otomatik') { $('#siradaki').innerHTML = '🎲 Her videoda yeni isimler, meslekler, konular ve mekanlar. <b>İnternet gerekmez.</b>'; return; }
  $('#siradaki').innerHTML = ayar.kaynak === 'kuyruk'
    ? (s ? `Sıradaki: <b>#${s.no}</b> ${esc(s.baslik || '')}` : (kuyruk.length ? 'Hepsi yapıldı. ' + (ayar.dongu ? 'Baştan başlayacak.' : 'Senaryolar sekmesinden yenisini ekle.') : 'Henüz senaryo yok, Senaryolar sekmesinden ekle.'))
    : (ayar.apiKey ? 'Gemini her video için yeni senaryo yazacak.' : 'Gemini için Ayarlar\'a API anahtarı ekle.');
}
const esc = t => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const ALANLAR = ['apiKey', 'marka', 'urun', 'slogan', 'cta', 'iletisim', 'sektorler', 'ekTalimat', 'palet', 'aiSes', 'sesMotoru', 'metinModeli', 'sesModeli'];
function ayarDoldur() {
  ALANLAR.forEach(k => { const e = $('#' + k); if (e) e.value = ayar[k] ?? ''; });
  for (const k of ['muzik', 'dongu']) {
    const sw = $('#sw-' + k); if (!sw) continue;
    sw.classList.toggle('acik', !!ayar[k]);
    sw.onclick = () => { ayar[k] = !ayar[k]; sw.classList.toggle('acik', ayar[k]); yaz('nvb_ayar', ayar); kaynakCiz(); };
  }
}
$('#goster').onclick = () => { const i = $('#apiKey'); i.type = i.type === 'password' ? 'text' : 'password'; $('#goster').textContent = i.type === 'password' ? 'Göster' : 'Gizle'; };
$('#anahtarAl').onclick = e => { e.preventDefault(); disAc('https://aistudio.google.com/apikey'); };
$('#kaydet').onclick = () => {
  ALANLAR.forEach(k => { const e = $('#' + k); if (e) ayar[k] = e.value.trim(); });
  if (!ayar.metinModeli) ayar.metinModeli = VARSAYILAN.metinModeli;
  if (!ayar.sesModeli) ayar.sesModeli = VARSAYILAN.sesModeli;
  yaz('nvb_ayar', ayar); apiDurum(); toast('✓ Ayarlar kaydedildi');
};
function disAc(u) { if (A) A.ac(u); else window.open(u, '_blank'); }

// ------------------------------------------------------------ senaryolar sekmesi
const MEKAN_AD = { kafe: '☕ Kafe', dukkan_onu: '🏪 Dükkan önü', sahil: '🌊 Sahil', araba: '🚗 Araba', yuruyus: '🚶 Yürüyüş', park: '🌳 Park', durak: '🚌 Durak', pazar: '🍅 Pazar', balik: '🎣 Balık' };
function senListeCiz() {
  const l = $('#senListe');
  if (!kuyruk.length) { l.innerHTML = '<div class="bosListe">Senaryo yok.<br>"+ Yeni yaz" ile başla ✍️</div>'; return; }
  const sira = siradakiSen();
  l.innerHTML = '';
  kuyruk.forEach((k, i) => {
    const e = document.createElement('div');
    e.className = 'sen' + (k.durum === 'yapildi' ? ' yapildi' : '') + (k === sira ? ' siradaki-sen' : '');
    const dur = k.durum === 'yapildi' ? '<span class="ok">✓ yapıldı</span>' : k.durum === 'hatali' ? '<span class="hata">hatalı</span>' : (k === sira ? '<span class="ok">▶ sıradaki</span>' : '<span>bekliyor</span>');
    e.innerHTML = `<div class="no">${i + 1}</div><div class="ic"><h4>${esc(k.baslik || 'Senaryo')}</h4>
      <div class="etk"><span>${MEKAN_AD[k.mekan] || ''}</span>${dur}</div>
      <div class="ek"><button data-e="duz">Düzenle</button><button data-e="yukari">↑</button><button data-e="asagi">↓</button>
      ${k.durum === 'yapildi' ? '<button data-e="tekrar">Tekrar yap</button>' : ''}<button data-e="sil">Sil</button></div></div>`;
    e.querySelectorAll('button').forEach(b => b.onclick = () => senEylem(i, b.dataset.e));
    l.appendChild(e);
  });
}
function senEylem(i, e) {
  const k = kuyruk[i];
  if (e === 'duz') editorAc(i);
  else if (e === 'sil') { if (confirm(`#${i + 1} silinsin mi?`)) { kuyruk.splice(i, 1); kaydetKuyruk(); senListeCiz(); } }
  else if (e === 'yukari' && i > 0) { [kuyruk[i - 1], kuyruk[i]] = [kuyruk[i], kuyruk[i - 1]]; kaydetKuyruk(); senListeCiz(); }
  else if (e === 'asagi' && i < kuyruk.length - 1) { [kuyruk[i + 1], kuyruk[i]] = [kuyruk[i], kuyruk[i + 1]]; kaydetKuyruk(); senListeCiz(); }
  else if (e === 'tekrar') { k.durum = 'bekliyor'; kaydetKuyruk(); senListeCiz(); }
}
let editorIndeks = -1;
function editorAc(i) {
  editorIndeks = i;
  $('#editorBaslik').textContent = i < 0 ? 'Yeni senaryo' : `Senaryo #${i + 1}`;
  $('#edMetin').value = i < 0 ? BOS_SABLON : kuyruk[i].metin;
  $('#edDurum').textContent = ''; $('#edDurum').className = 'durumYazi';
  $('#editor').classList.add('goster');
}
function kontrol() {
  const { senaryo: s, hatalar } = metniCoz($('#edMetin').value);
  const d = $('#edDurum');
  if (hatalar.length) { d.className = 'durumYazi hata'; d.textContent = hatalar.join('\n'); }
  else { d.className = 'durumYazi ok'; d.textContent = `✓ ${MEKAN_AD[s.mekan]} · ${s.giris.length + s.anlatim.length + 3} replik · telefonda ${s.cagri.length} konuşma · ${s.A.isim} & ${s.B.isim}`; }
  return { s, hatalar };
}
$('#edKontrol').onclick = kontrol;
$('#edIptal').onclick = () => $('#editor').classList.remove('goster');
$('#edKaydet').onclick = () => {
  const { hatalar, s } = kontrol();
  if (hatalar.some(h => h.startsWith('En az'))) return;
  const metin = $('#edMetin').value;
  if (editorIndeks < 0) kuyrugaEkle(metin);
  else Object.assign(kuyruk[editorIndeks], { metin, baslik: s.kanca || s.baslik, mekan: s.mekan, durum: kuyruk[editorIndeks].durum === 'hatali' ? 'bekliyor' : kuyruk[editorIndeks].durum }), kaydetKuyruk();
  $('#editor').classList.remove('goster'); senListeCiz(); toast('✓ Senaryo kaydedildi');
};
$('#yeniSen').onclick = () => editorAc(-1);
$('#hazirEkle').onclick = () => {
  for (let i = 0; i < 10; i++) kuyrugaEkle(metneCevir(rastgeleSenaryo(ayar)), false);
  kaydetKuyruk(); senListeCiz(); toast('🎲 10 yeni rastgele senaryo eklendi. İstersen düzenle.');
};
$('#geminiYaz').onclick = async () => {
  if (!ayar.apiKey) return toast('Önce Ayarlar\'dan Gemini API anahtarı ekle.');
  if (!navigator.onLine) return toast('Bunun için internet lazım.');
  const b = $('#geminiYaz'); b.disabled = true;
  try {
    for (let i = 0; i < 5; i++) {
      b.textContent = `Yazılıyor ${i + 1}/5…`;
      const s = await senaryoUret(ayar, oku('nvb_gecmis', []), () => { });
      const g = oku('nvb_gecmis', []); g.push(`${s.baslik} — ${s.giris?.[0]?.metin || ''}`); yaz('nvb_gecmis', g.slice(-40));
      kuyrugaEkle(metneCevir(s)); senListeCiz();
    }
    toast('✓ 5 yeni senaryo eklendi. İstersen düzenle, internetsiz üretebilirsin.', 4500);
  } catch (e) { toast('✗ ' + e.message, 6000); }
  finally { b.disabled = false; b.textContent = '✨ Gemini 5 tane yazsın'; }
};

// ------------------------------------------------------------ üretim
const adim = (ad, durum) => { const e = document.querySelector(`.adim[data-a="${ad}"]`); e.className = 'adim ' + (durum || ''); };
const adimlariSifirla = () => ['senaryo', 'ses', 'video', 'kayit'].forEach(a => adim(a, ''));
let sonBildirim = 0;
const bar = (p, metin) => {
  $('#bar').style.width = (p * 100).toFixed(1) + '%';
  const simdi = Date.now();
  if (A?.bildirim && simdi - sonBildirim > 1500) { sonBildirim = simdi; try { A.bildirim(metin || 'Video üretiliyor', Math.round(p * 100)); } catch { } }
};
const onizCtx = $('#onizleme').getContext('2d');

$('#olusturBtn').onclick = async () => {
  if (calisiyor) return;
  if (ayar.kaynak === 'gemini' && !ayar.apiKey) toast('API anahtarı yok: senaryolarından devam edilecek.', 4000);
  if (ayar.kaynak === 'sinema' && !($('#sinemaIstem').value.trim())) return toast('Önce videoyu anlat ya da bir özel gün seç.');
  if (ayar.kaynak === 'kuyruk' && !siradakiSen() && !(ayar.dongu && kuyruk.length)) return toast('Sırada senaryo yok. Senaryolar sekmesinden ekle ya da 🎲 Otomatik seç.');
  calisiyor = true; iptalIstek = false;
  $('#olusturBtn').classList.add('calisiyor');
  $('#ilerleme').classList.add('goster');
  $('#ipucu').style.display = 'none';
  try { A?.arkaPlanBasla?.(); } catch { }
  if (A?.ekranAcik) A.ekranAcik(true);
  let basarili = 0;
  try {
    await document.fonts.load('800 50px Inter'); await document.fonts.load('600 40px Inter'); await document.fonts.load('700 40px Inter'); await document.fonts.load('500 40px Inter');
    for (let i = 0; i < ayar.adet && !iptalIstek; i++) {
      $('#sayac').textContent = `VİDEO ${i + 1} / ${ayar.adet}`;
      $('#olusturYazi').textContent = `${i + 1}/${ayar.adet}`;
      try { if (await (ayar.kaynak === 'sinema' ? birSinema(i) : birVideo(i))) basarili++; else break; }
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
    try { A?.arkaPlanBitir?.(basarili ? `${basarili} video hazır 🎬` : ''); } catch { }
    if (basarili) toast(`✓ ${basarili} video hazır! Videolar sekmesinde.`, 4000);
    kaynakCiz();
    setTimeout(() => { if (!calisiyor) { $('#ilerleme').classList.remove('goster'); $('#ipucu').style.display = ''; } }, 2500);
  }
};
$('#durdurBtn').onclick = () => { iptalIstek = true; toast('Durduruluyor…'); };
window.uretimiDurdur = () => { iptalIstek = true; };

function kuyruktanAl() {
  let k = siradakiSen();
  if (!k && ayar.dongu && kuyruk.some(x => x.durum === 'yapildi')) {
    kuyruk.forEach(x => { if (x.durum === 'yapildi') x.durum = 'bekliyor'; }); kaydetKuyruk(); k = siradakiSen();
  }
  if (!k) return null;
  const { senaryo } = metniCoz(k.metin);
  return { s: senaryo, kayit: k };
}

async function birVideo(i) {
  adimlariSifirla(); bar(0, 'Senaryo hazırlanıyor');
  $('#baslikMini').textContent = 'Hazırlanıyor…';
  // 1) senaryo
  adim('senaryo', 'aktif');
  let s, kayit = null;
  if (ayar.kaynak === 'gemini' && ayar.apiKey && navigator.onLine) {
    try {
      s = await senaryoUret(ayar, oku('nvb_gecmis', []), m => { $('#olusturAlt').textContent = m; });
      const g = oku('nvb_gecmis', []); g.push(`${s.baslik} — ${s.giris?.[0]?.metin || ''}`); yaz('nvb_gecmis', g.slice(-40));
    } catch (e) { if (/API anahtarı/.test(e.message)) throw e; toast('Gemini hatası, senaryolarından devam: ' + e.message, 5000); }
  }
  if (!s && ayar.kaynak === 'otomatik') s = rastgeleSenaryo(ayar);
  if (!s) {
    const r = kuyruktanAl();
    if (r) { s = r.s; kayit = r.kayit; }
    else if (ayar.kaynak === 'gemini') s = rastgeleSenaryo(ayar);
    else { toast('Sırada senaryo kalmadı.'); return false; }
  }
  if (!s.aciklama) s.aciklama = `${s.baslik}\n${ayar.marka}: ${ayar.urun}`;
  if (ayar.hashtagler && !s.aciklama.includes('#')) s.aciklama += `\n\n${ayar.hashtagler}`;
  $('#baslikMini').textContent = (kayit ? `#${kuyruk.indexOf(kayit) + 1} · ` : '') + s.baslik;
  adim('senaryo', 'tamam');
  if (iptalIstek) throw new Error('IPTAL');
  // 2) ses
  adim('ses', 'aktif'); bar(0, 'Seslendiriliyor');
  let sesler = null;
  const durum = m => { $('#olusturAlt').textContent = m; };
  if (ayar.sesMotoru === 'gemini' && ayar.apiKey && navigator.onLine) {
    try { sesler = await seslendir(ayar, s, durum); }
    catch (e) { toast('Gemini sesi alınamadı, telefonun sesi kullanılıyor.', 4000); }
  }
  if (!sesler && ayar.sesMotoru !== 'kapali' && telefonSesiVar()) {
    try { sesler = await telefonlaSeslendir(ayar, s, durum); }
    catch (e) { toast(e.message, 6000); }
  }
  adim('ses', 'tamam');
  if (iptalIstek) throw new Error('IPTAL');
  // 3) video
  adim('video', 'aktif');
  $('#olusturAlt').textContent = 'video çiziliyor';
  await bosluk();
  const plan = planla(s, sesler, ayar);
  const ciz = cizici(plan);
  const sesSig = miksle(plan.sesOlay, plan.sure, ayar.muzik ? muzik(plan.sure + 1, Date.now() % 997) : null, 0.42);
  const blob = await kodla({
    sure: plan.sure, fps: FPS, genislik: OW, yukseklik: OH, kare: ciz.kare, ses: sesSig,
    iptal: () => iptalIstek,
    ilerleme: (p, tv) => {
      bar(p, `Video ${i + 1}/${ayar.adet} çiziliyor`); $('#olusturAlt').textContent = `%${Math.round(p * 100)}`;
      if (tv && !document.hidden) onizCtx.drawImage(tv, 0, 0, 270, 480);
    },
  });
  adim('video', 'tamam');
  const kap = document.createElement('canvas');
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
  if (kayit) { kayit.durum = 'yapildi'; kaydetKuyruk(); }
  adim('kayit', 'tamam');
  return true;
}

// ------------------------------------------------------------ SİNEMA 3D
function ozelGunCiz() {
  const k = $('#ozelGun'); k.innerHTML = '';
  for (const g of OZEL_GUNLER) {
    const b = document.createElement('button'); b.textContent = g.ad;
    b.onclick = () => { $('#sinemaIstem').value = g.istem; ayar.sinemaIstem = g.istem; yaz('nvb_ayar', ayar); k.querySelectorAll('button').forEach(x => x.classList.toggle('secili', x === b)); };
    k.appendChild(b);
  }
  $('#sinemaIstem').value = ayar.sinemaIstem || '';
  $('#sinemaIstem').oninput = e => { ayar.sinemaIstem = e.target.value; yaz('nvb_ayar', ayar); };
}
async function birSinema(i) {
  adimlariSifirla(); bar(0, 'Sahne planı yazılıyor');
  $('#baslikMini').textContent = 'Sahneler planlanıyor…';
  adim('senaryo', 'aktif');
  const istem = $('#sinemaIstem').value.trim();
  let ham = null;
  if (ayar.apiKey && navigator.onLine) {
    try { ham = await planGemini(ayar, istem, i, m => { $('#olusturAlt').textContent = m; }); }
    catch (e) { if (/API anahtarı|API key/i.test(e.message)) throw e; toast('Gemini planı alınamadı, şablonla devam: ' + e.message, 5000); }
  }
  if (!ham) ham = planYerel(istem, ayar, i);
  const plan = planHazirla(ham, ayar, (Date.now() + i * 7919) % 100000);
  let aciklama = plan.aciklama || plan.baslik;
  if (ayar.hashtagler && !aciklama.includes('#')) aciklama += `\n\n${ayar.hashtagler}`;
  $('#baslikMini').textContent = '🎬 ' + plan.baslik;
  adim('senaryo', 'tamam');
  if (iptalIstek) throw new Error('IPTAL');
  adim('ses', 'aktif'); $('#olusturAlt').textContent = 'müzik besteleniyor';
  await bosluk();
  const sesSig = await sinemaSesi(plan);
  adim('ses', 'tamam');
  if (iptalIstek) throw new Error('IPTAL');
  adim('video', 'aktif'); $('#olusturAlt').textContent = '3D çiziliyor';
  const ciz = sinemaCizici(plan);
  const blob = await kodla({
    sure: plan.sure, fps: SFPS, genislik: SOW, yukseklik: SOH, kare: ciz.kare, ses: sesSig,
    iptal: () => iptalIstek,
    ilerleme: (p, tv) => {
      bar(p, `Film ${i + 1}/${ayar.adet} çiziliyor`); $('#olusturAlt').textContent = `%${Math.round(p * 100)}`;
      if (tv && !document.hidden) onizCtx.drawImage(tv, 0, 0, 270, 480);
    },
  });
  adim('video', 'tamam');
  const kap = document.createElement('canvas'); kap.width = 180; kap.height = 320;
  const ks = plan.sahneler.find(s => s.mekan !== 'siyah') || plan.sahneler[0];
  kap.getContext('2d').drawImage(ciz.kare(ks.bas + ks.sure * .55), 0, 0, 180, 320);
  const kapak = kap.toDataURL('image/jpeg', .72);
  adim('kayit', 'aktif');
  const ad = `Sinema_${new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-')}_${i + 1}.${blob.type.includes('webm') ? 'webm' : 'mp4'}`;
  const uri = await kaydet(blob, ad);
  const id = Date.now() + '_' + i;
  oturumBlob.set(id, URL.createObjectURL(blob));
  videolar.unshift({ id, baslik: '🎬 ' + plan.baslik, aciklama, tarih: Date.now(), uri, kapak, ad });
  yaz('nvb_videolar', videolar.slice(0, 60));
  adim('kayit', 'tamam');
  return true;
}

async function kaydet(blob, ad) {
  if (!A) { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = ad; a.click(); return ''; }
  if (!A.dosyaBasla(ad, blob.type)) throw new Error('Galeriye yazılamadı');
  const P = 3 * 256 * 1024;
  for (let i = 0; i < blob.size; i += P) {
    const b64 = await new Promise((res, rej) => {
      const r = new FileReader(); r.onload = () => res(String(r.result).split(',')[1]); r.onerror = rej;
      r.readAsDataURL(blob.slice(i, i + P));
    });
    if (!A.dosyaParca(b64)) throw new Error('Kayıt sırasında hata');
    bar(i / blob.size, 'Galeriye kaydediliyor');
  }
  return A.dosyaBitir();
}

// ------------------------------------------------------------ videolar
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
  if ($('#editor').classList.contains('goster')) { $('#editor').classList.remove('goster'); return true; }
  if ($('#oynatici').classList.contains('goster')) { $('#kapatOyn').click(); return true; }
  const ana = document.querySelector('nav button[data-s="olustur"]');
  if (!ana.classList.contains('aktif')) { sayfaAc('olustur'); return true; }
  return false;
};

apiDurum(); adetCiz(); ayarDoldur(); ozelGunCiz(); kaynakCiz();
