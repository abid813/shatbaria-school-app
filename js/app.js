/* ============================================================
   সাতবাড়িয়া সরকারি প্রাথমিক বিদ্যালয় — অ্যাপ লজিক
   ============================================================ */
'use strict';

/* ---------------- ধ্রুবক constant ---------------- */
const SCHOOL = {
  name: 'সাতবাড়িয়া সরকারি প্রাথমিক বিদ্যালয়',
  sub: 'স্থাপিত: ২০১১ খ্রি. | কালিয়া, নড়াইল',
  phone: '01793582174',
  whatsapp: 'https://wa.me/8801793582174'
};

const CLASS_LABEL = { 1: '১ম শ্রেণি', 2: '২য় শ্রেণি', 3: '৩য় শ্রেণি', 4: '৪র্থ শ্রেণি', 5: '৫ম শ্রেণি' };

const SUBJECTS_BY_CLASS = {
  1: ['বাংলা', 'ইংরেজি', 'গণিত', 'ধর্ম ও নৈতিক শিক্ষা'],
  2: ['বাংলা', 'ইংরেজি', 'গণিত', 'ধর্ম ও নৈতিক শিক্ষা'],
  3: ['বাংলা', 'ইংরেজি', 'গণিত', 'ধর্ম ও নৈতিক শিক্ষা', 'প্রাথমিক বিজ্ঞান', 'বাংলাদেশ ও বিশ্বপরিচয়'],
  4: ['বাংলা', 'ইংরেজি', 'গণিত', 'ধর্ম ও নৈতিক শিক্ষা', 'প্রাথমিক বিজ্ঞান', 'বাংলাদেশ ও বিশ্বপরিচয়'],
  5: ['বাংলা', 'ইংরেজি', 'গণিত', 'ধর্ম ও নৈতিক শিক্ষা', 'প্রাথমিক বিজ্ঞান', 'বাংলাদেশ ও বিশ্বপরিচয়']
};

const PAGES = {
  exam: { title: 'পরীক্ষার রুটিন', icon: '📝' },
  holidays: { title: 'ছুটির তালিকা', icon: '🎉' },
  stipend: { title: 'উপবৃত্তি ও বই', icon: '📚' }
};

/* ---------------- বাংলা হেল্পার ---------------- */
const BN_D = '০১২৩৪৫৬৭৮৯';
const bn = v => String(v).replace(/[0-9]/g, d => BN_D[+d]);

const BN_MONTHS = ['জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'];
const BN_DAYS = ['রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার', 'শনিবার'];

function todayStr(d = new Date()) {
  const p = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
function yesterdayStr() {
  const d = new Date(); d.setDate(d.getDate() - 1); return todayStr(d);
}
function bnDate(dateStr) { // "2026-10-29" -> "বৃহস্পতিবার, ২৯ অক্টোবর ২০২৬"
  const d = new Date(dateStr + 'T00:00:00');
  if (isNaN(d)) return dateStr;
  return `${BN_DAYS[d.getDay()]}, ${bn(d.getDate())} ${BN_MONTHS[d.getMonth()]} ${bn(d.getFullYear())}`;
}
function bnTime(iso) { // ISO -> "বিকেল ৪:৩০"
  const d = new Date(iso);
  if (isNaN(d)) return '';
  let h = d.getHours(); const m = d.getMinutes();
  let part = 'সকাল';
  if (h >= 12 && h < 15) part = 'দুপুর';
  else if (h >= 15 && h < 18) part = 'বিকেল';
  else if (h >= 18 && h < 20) part = 'সন্ধ্যা';
  else if (h >= 20 || h < 4) part = 'রাত';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${part} ${bn(h12)}:${bn(String(m).padStart(2, '0'))}`;
}
function bnUpdated(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return `${bn(d.getDate())} ${BN_MONTHS[d.getMonth()]}, ${bnTime(iso)}`;
}
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/* ---------------- প্রোফাইল (ফোনে সেভ) ---------------- */
const PROFILE_KEY = 'satbaria_profile';
const getProfile = () => { try { return JSON.parse(localStorage.getItem(PROFILE_KEY)); } catch { return null; } };
const setProfile = p => localStorage.setItem(PROFILE_KEY, JSON.stringify(p));

/* ============================================================
   ডেটা লেয়ার — Firebase নাকি ডেমো
   ============================================================ */
const DEMO = !window.firebaseConfig || String(firebaseConfig.apiKey || '').startsWith('PASTE');

/* ---------- ডেমো ডেটাবেস (localStorage) ---------- */
const DemoDB = (() => {
  const KEY = 'satbaria_demo_db';
  const seed = () => ({
    homework: {
      [`c1_${todayStr()}`]: {
        classId: '1', date: todayStr(),
        subjects: { 'বাংলা': 'সহপাঠ: "আমার স্কুল" পাঠ ৩ বার পড়া।', 'গণিত': 'পৃষ্ঠা ২৫: ১ থেকে ৫ নম্বর অঙ্ক।' },
        updatedAt: new Date().toISOString()
      },
      [`c3_${todayStr()}`]: {
        classId: '3', date: todayStr(),
        subjects: {
          'বাংলা': 'ব্যাকরণ: বিশেষ্য পদ চেনা (পৃষ্ঠা ৪০)।',
          'ইংরেজি': 'English for Today: Unit 5, Lesson 1-2 পড়া।',
          'গণিত': 'গুণের নামতা ৬-৭ মুখস্থ।',
          'প্রাথমিক বিজ্ঞান': 'পৃষ্ঠা ৩২-৩৪ পড়া ও ছবি আঁকা।'
        },
        updatedAt: new Date().toISOString()
      }
    },
    notices: [
      { id: 'n1', title: 'তৃতীয় প্রান্তিক মূল্যায়নের রুটিন প্রকাশ', body: 'আগামী ১০ ডিসেম্বর থেকে তৃতীয় প্রান্তিক মূল্যায়ন শুরু হবে। বিস্তারিত রুটিন "পরীক্ষার রুটিন" অংশে দেখুন। সবাইকে নিয়মিত উপস্থিত থাকার জন্য অনুরোধ করা হলো।', urgent: true, forClass: 'all', createdAt: new Date().toISOString() },
      { id: 'n2', title: 'নতুন বই বিতরণ', body: 'আগামী রবিবার সকাল ১০টা থেকে নতুন শ্রেণির বই বিতরণ করা হবে। শিক্ষার্থীদের স্কুলে উপস্থিত থাকতে হবে।', urgent: false, forClass: 'all', createdAt: new Date(Date.now() - 86400000).toISOString() }
    ],
    pages: {
      exam: { title: 'পরীক্ষার রুটিন', body: 'তৃতীয় প্রান্তিক মূল্যায়ন ২০২৬\n\n১০ ডিসেম্বর — বাংলা\n১১ ডিসেম্বর — ইংরেজি\n১২ ডিসেম্বর — গণিত\n১৩ ডিসেম্বর — ধর্ম ও নৈতিক শিক্ষা\n১৪ ডিসেম্বর — প্রাথমিক বিজ্ঞান (৩য়-৫ম)\n১৫ ডিসেম্বর — বাংলাদেশ ও বিশ্বপরিচয় (৩য়-৫ম)\n\nসময়: সকাল ১০টা - দুপুর ১২টা', updatedAt: new Date().toISOString() },
      holidays: { title: 'ছুটির তালিকা', body: '১৬ ডিসেম্বর — বিজয় দিবস\n২৫ ডিসেম্বর — বড়দিন\n২১ ফেব্রুয়ারি — শহীদ দিবস\n২৬ মার্চ — স্বাধীনতা দিবস\n\n(সরকারি ছুটির তালিকা অনুযায়ী হালনাগাদ করা হবে)', updatedAt: new Date().toISOString() },
      stipend: { title: 'উপবৃত্তি ও বই', body: '• নতুন শ্রেণির বই সবার জন্য সম্পূর্ণ ফ্রি।\n• উপবৃত্তির টাকা মোবাইল ব্যাংকিংয়ের মাধ্যমে দেওয়া হয়।\n• উপবৃত্তি সংক্রান্ত যেকোনো সমস্যায় স্কুল অফিসে যোগাযোগ করুন।', updatedAt: new Date().toISOString() }
    },
    routines: {
      '1': '১ম শ্রেণির রুটিন\n\nসকাল ১০:০০ — বাংলা\nসকাল ১০:৪৫ — গণিত\nসকাল ১১:৩০ — ইংরেজি\nদুপুর ১২:১৫ — ধর্ম ও নৈতিক শিক্ষা',
      '3': '৩য় শ্রেণির রুটিন\n\nসকাল ১০:০০ — বাংলা\nসকাল ১০:৪৫ — ইংরেজি\nসকাল ১১:৩০ — গণিত\nদুপুর ১২:১৫ — প্রাথমিক বিজ্ঞান\nদুপুর ১:০০ — বাংলাদেশ ও বিশ্বপরিচয়'
    },
    complaints: [
      { id: 'x1', name: 'একজন অভিভাবক', classId: '2', message: 'পানির ট্যাংকিটা ঠিক করার অনুরোধ করছি।', createdAt: new Date(Date.now() - 3600000).toISOString() }
    ],
    registrations: []
  });

  let db;
  try { db = JSON.parse(localStorage.getItem(KEY)) || null; } catch { db = null; }
  if (!db) { db = seed(); localStorage.setItem(KEY, JSON.stringify(db)); }
  const persist = () => localStorage.setItem(KEY, JSON.stringify(db));
  const ok = v => Promise.resolve(v);

  return {
    isDemo: true,
    init: () => ok(),
    onAuth: () => { },
    getHomework: (cid, date) => ok(db.homework[`c${cid}_${date}`] || null),
    getNotices: () => ok([...db.notices].sort((a, b) => b.createdAt.localeCompare(a.createdAt))),
    getPage: k => ok(db.pages[k] || null),
    getRoutine: c => ok(db.routines[c] ? { body: db.routines[c] } : null),
    saveRegistration: d => { db.registrations.push(d); persist(); return ok(); },
    submitComplaint: d => { db.complaints.unshift({ id: 'x' + Date.now(), ...d, createdAt: new Date().toISOString() }); persist(); return ok(); },
    // admin
    adminLogin: () => ok({ name: 'ডেমো অ্যাডমিন', role: 'owner' }),
    adminLogout: () => ok(),
    saveHomework: (cid, date, subjects) => {
      db.homework[`c${cid}_${date}`] = { classId: cid, date, subjects, updatedAt: new Date().toISOString() };
      persist(); return ok();
    },
    addNotice: n => { db.notices.unshift({ id: 'n' + Date.now(), ...n, createdAt: new Date().toISOString() }); persist(); return ok(); },
    deleteNotice: id => { db.notices = db.notices.filter(n => n.id !== id); persist(); return ok(); },
    savePage: (k, body) => { db.pages[k] = { title: PAGES[k].title, body, updatedAt: new Date().toISOString() }; persist(); return ok(); },
    saveRoutine: (c, body) => { db.routines[c] = body; persist(); return ok(); },
    getComplaints: () => ok(db.complaints)
  };
})();

/* ---------- Firebase ডেটাবেস ---------- */
const FirebaseDB = (() => {
  let db, auth;
  return {
    isDemo: false,
    async init() {
      firebase.initializeApp(firebaseConfig);
      db = firebase.firestore();
      auth = firebase.auth();
      try { await db.enablePersistence({ synchronizeTabs: true }); } catch (e) { /* অফলাইন ক্যাশ না চললেও চলবে */ }
      try { await auth.signInAnonymously(); } catch (e) { console.warn('anon auth', e); }
    },
    async getHomework(cid, date) {
      const s = await db.collection('homework').doc(`c${cid}_${date}`).get();
      return s.exists ? s.data() : null;
    },
    async getNotices() {
      const s = await db.collection('notices').orderBy('createdAt', 'desc').limit(30).get();
      return s.docs.map(d => ({ id: d.id, ...d.data() }));
    },
    async getPage(k) {
      const s = await db.collection('pages').doc(k).get();
      return s.exists ? s.data() : null;
    },
    async getRoutine(c) {
      const s = await db.collection('routines').doc(`class_${c}`).get();
      return s.exists ? s.data() : null;
    },
    saveRegistration: d => db.collection('registrations').add({ ...d, createdAt: new Date().toISOString() }),
    submitComplaint: d => db.collection('complaints').add({ ...d, createdAt: new Date().toISOString() }),
    // admin
    async adminLogin(email, pass) {
      const cred = await auth.signInWithEmailAndPassword(email, pass);
      const a = await db.collection('admins').doc(cred.user.uid).get();
      if (!a.exists) { await auth.signOut(); throw new Error('no-admin'); }
      return a.data();
    },
    adminLogout: () => auth.signOut(),
    saveHomework: (cid, date, subjects) =>
      db.collection('homework').doc(`c${cid}_${date}`).set({ classId: cid, date, subjects, updatedAt: new Date().toISOString() }),
    addNotice: n => db.collection('notices').add({ ...n, createdAt: new Date().toISOString() }),
    deleteNotice: id => db.collection('notices').doc(id).delete(),
    savePage: (k, body) => db.collection('pages').doc(k).set({ title: PAGES[k].title, body, updatedAt: new Date().toISOString() }),
    saveRoutine: (c, body) => db.collection('routines').doc(`class_${c}`).set({ body, updatedAt: new Date().toISOString() }),
    async getComplaints() {
      const s = await db.collection('complaints').orderBy('createdAt', 'desc').limit(50).get();
      return s.docs.map(d => ({ id: d.id, ...d.data() }));
    }
  };
})();

const DB = DEMO ? DemoDB : FirebaseDB;

/* ============================================================
   UI স্টেট
   ============================================================ */
const view = document.getElementById('view');
const appbar = document.getElementById('appbar');
const appbarTitle = document.getElementById('appbarTitle');
const backBtn = document.getElementById('backBtn');
const appFooter = document.getElementById('appFooter');

let deferredInstall = null;
let adminUser = null;

/* ---------------- স্প্ল্যাশের মিষ্টি শব্দ ----------------
   ব্রাউজারের নিয়ম: ব্যবহারকারী স্ক্রিনে না ছুঁলে শব্দ চালানো যায় না।
   তাই আগে চেষ্টা করি; আটকে গেলে প্রথম ছোঁয়ায় বাজবে। */
let chimeCtx = null, chimePlayed = false;
function playChime() {
  if (chimePlayed) return;
  try {
    chimeCtx = chimeCtx || new (window.AudioContext || window.webkitAudioContext)();
    if (chimeCtx.state === 'suspended') { chimeCtx.resume(); }
    if (chimeCtx.state !== 'running') return; // এখনো অনুমতি নেই
    chimePlayed = true;
    const t0 = chimeCtx.currentTime;
    [523.25, 659.25, 783.99].forEach((f, i) => { // C5-E5-G5 নরম ঘণ্টা
      const o = chimeCtx.createOscillator(), g = chimeCtx.createGain();
      o.type = 'sine'; o.frequency.value = f;
      const s = t0 + i * 0.16;
      g.gain.setValueAtTime(0, s);
      g.gain.linearRampToValueAtTime(0.12, s + 0.03);
      g.gain.exponentialRampToValueAtTime(0.001, s + 0.9);
      o.connect(g); g.connect(chimeCtx.destination);
      o.start(s); o.stop(s + 1);
    });
  } catch (e) { /* শব্দ না বাজলেও অ্যাপ চলবে */ }
}

/* ---------------- স্প্ল্যাশ ---------------- */
function boot() {
  if (DEMO) document.getElementById('demoBanner').hidden = false;
  if (/FBAN|FBAV|Instagram|Messenger/i.test(navigator.userAgent)) {
    document.getElementById('inappBanner').hidden = false;
  }

  playChime(); // অটোপ্লে মিললে এখনেই বাজবে
  document.addEventListener('pointerdown', function once() {
    playChime();
    document.removeEventListener('pointerdown', once);
  });

  const splash = document.getElementById('screen-splash');
  const splashInstallBtn = document.getElementById('splashInstall');
  let left = false;
  const leave = () => {
    if (left) return; left = true;
    splash.classList.remove('active');
    // স্প্ল্যাশের পর — ইনস্টল বাটন দেখাও (যদি PWA ইনস্টল পাওয়া যায়)
    if (deferredInstall && !isStandalone()) {
      showInstallPrompt();
      return; // ইনস্টল প্রম্পট দেখাচ্ছি, অ্যাপে ঢোকা বন্ধ রাখি
    }
    if (getProfile()) enterApp();
    else document.getElementById('screen-register').classList.add('active');
  };
  document.getElementById('splashSkip').addEventListener('click', leave);
  setTimeout(leave, 2800);

  DB.init().catch(e => console.warn('DB init', e));
  setupRegister();
  setupRouter();
  setupInstall();
}

/* ---------------- রেজিস্ট্রেশন (৪ প্রশ্ন) ---------------- */
function setupRegister() {
  let picked = '';
  document.querySelectorAll('#regClassPicker .class-btn').forEach(b => {
    b.addEventListener('click', () => {
      document.querySelectorAll('#regClassPicker .class-btn').forEach(x => x.classList.remove('selected'));
      b.classList.add('selected');
      picked = b.dataset.class;
    });
  });

  document.getElementById('registerForm').addEventListener('submit', async e => {
    e.preventDefault();
    const student = document.getElementById('regStudent').value.trim();
    const father = document.getElementById('regFather').value.trim();
    const phone = document.getElementById('regPhone').value.trim();
    const err = document.getElementById('regError');

    if (!student) return showErr(err, 'শিক্ষার্থীর নাম লিখুন');
    if (!father) return showErr(err, 'বাবার নাম লিখুন');
    if (!picked) return showErr(err, 'শ্রেণি বেছে নিন');
    if (!/^01\d{9}$/.test(phone)) return showErr(err, 'সঠিক ১১ সংখ্যার মোবাইল নম্বর দিন (01 দিয়ে শুরু)');

    err.hidden = true;
    const profile = { studentName: student, fatherName: father, classId: picked, phone };
    setProfile(profile);
    try { await DB.saveRegistration(profile); } catch (e2) { console.warn('reg save', e2); }

    document.getElementById('screen-register').classList.remove('active');
    enterApp();
  });
}
function showErr(el, msg) { el.textContent = '⚠️ ' + msg; el.hidden = false; }

/* ---------------- অ্যাপে ঢুকা ---------------- */
function enterApp() {
  appbar.hidden = false;
  view.hidden = false;
  appFooter.hidden = false;
  location.hash = '#/';
  render();
}

/* ---------------- রাউটার ---------------- */
const homeFab = document.getElementById('homeFab');
function setupRouter() {
  window.addEventListener('hashchange', render);
  backBtn.addEventListener('click', () => history.back());
}

const TITLES = {
  home: SCHOOL.name, homework: 'আজকের হোমওয়ার্ক', notices: 'নোটিশ',
  page: '', routine: 'ক্লাস রুটিন', complaint: 'অভিযোগ / মতামত', admin: 'অ্যাডমিন'
};

async function render() {
  const hash = location.hash || '#/';
  const parts = hash.replace(/^#\//, '').split('/').filter(Boolean);
  const route = parts[0] || 'home';
  const profile = getProfile();

  if (!profile) { location.hash = ''; return; }

  backBtn.classList.toggle('show', route !== 'home');
  homeFab.hidden = (route === 'home' || route === 'admin');
  appbar.classList.toggle('home-mode', route === 'home');
  appFooter.hidden = (route !== 'home');

  if (route === 'home') { appbarTitle.textContent = TITLES.home; renderHome(profile); }
  else if (route === 'homework' && parts[1]) { appbarTitle.textContent = CLASS_LABEL[parts[1]] + ' — হোমওয়ার্ক'; renderHomeworkDetail(parts[1]); }
  else if (route === 'homework') { appbarTitle.textContent = TITLES.homework; renderClassPick(profile, 'homework'); }
  else if (route === 'notices') { appbarTitle.textContent = TITLES.notices; renderNotices(); }
  else if (route === 'page' && PAGES[parts[1]]) { appbarTitle.textContent = PAGES[parts[1]].title; renderPage(parts[1]); }
  else if (route === 'routine') { appbarTitle.textContent = TITLES.routine; renderRoutine(profile); }
  else if (route === 'complaint') { appbarTitle.textContent = TITLES.complaint; renderComplaint(profile); }
  else if (route === 'admin') { appbarTitle.textContent = TITLES.admin; renderAdmin(); }
  else if (route === 'soon' && COMING_SOON[parts[1]]) { appbarTitle.textContent = COMING_SOON[parts[1]].title; renderSoon(parts[1]); }
  else { location.hash = '#/'; }
}

/* ---------------- শীঘ্রই আসছে ফিচার ---------------- */
const COMING_SOON = {
  results: {
    icon: '🏆', title: 'ফলাফল',
    desc: 'প্রতিটা পরীক্ষার ফল এখানে দেখতে পাবেন — কোন বিষয়ে কেমন করলো, বিষয়ভিত্তিক সাজানো থাকবে। স্কুল থেকে দেওয়া কোড দিয়ে শুধু নিজের সন্তানের ফল দেখা যাবে।'
  },
  calendar: {
    icon: '🗓️', title: 'ক্যালেন্ডার',
    desc: 'পুরো বছরের ছুটি, পরীক্ষা, বই বিতরণ, অনুষ্ঠান — সব এক ক্যালেন্ডারে এক নজরে দেখতে পাবেন।'
  },
  gallery: {
    icon: '📸', title: 'ছবির গ্যালারি',
    desc: 'চালু হলে এখানে দেখতে পাবেন এই প্রতিষ্ঠানের বিভিন্ন অনুষ্ঠান, ক্রীড়া প্রতিযোগিতা, বিজয়ী শিক্ষার্থীদের মুহূর্তসহ স্মৃতিচিত্র।'
  }
};

function renderSoon(key) {
  const f = COMING_SOON[key];
  if (!f) { location.hash = '#/'; return; }
  view.innerHTML = `
    <div class="card" style="text-align:center;padding:36px 22px">
      <div style="font-size:3.2rem">${f.icon}</div>
      <h3 style="margin-top:10px;font-size:1.3rem;color:var(--ink)">${f.title}</h3>
      <span class="soon-badge">🚧 এই ফিচারটি খুব শীঘ্রই চালু হবে</span>
      <p style="margin-top:14px;color:var(--ink-soft);line-height:1.8">${f.desc}</p>
    </div>`;
}

/* ---------------- হোম ---------------- */
function renderHome(profile) {
  // অভিভাবকের মনে প্রশ্ন আসার ক্রমে সাজানো
  const sections = [
    {
      title: '📌 আজকের খবর',
      items: [
        { icon: '📖', label: 'আজকে ক্লাসে কী পড়া (হোমওয়ার্ক)', go: '#/homework' },
        { icon: '📢', label: 'নোটিশ', go: '#/notices' },
        { icon: '📅', label: 'ক্লাস রুটিন', go: '#/routine' }
      ]
    },
    {
      title: '🗓️ সামনে কী আছে',
      items: [
        { icon: '🎉', label: 'ছুটির তালিকা', go: '#/page/holidays' },
        { icon: '📝', label: 'পরীক্ষার রুটিন', go: '#/page/exam' },
        { icon: '📚', label: 'উপবৃত্তি ও বই', go: '#/page/stipend' },
        { icon: '🏆', label: 'ফলাফল', soon: 'results' }
      ]
    },
    {
      title: '🌟 পরে দেখার জিনিস',
      items: [
        { icon: '🗓️', label: 'ক্যালেন্ডার', soon: 'calendar' },
        { icon: '📸', label: 'ছবির গ্যালারি', soon: 'gallery' }
      ]
    }
  ];

  view.innerHTML = `
    <div class="home-hello">
      <h2>আসসালামু আলাইকুম! 🌿</h2>
      <p>${esc(profile.studentName)} — ${CLASS_LABEL[profile.classId]}</p>
      <button class="edit-profile" id="editProfile">✏️ শিক্ষার্থীর তথ্য পরিবর্তন করতে চান</button>
    </div>

    ${deferredInstall && !isStandalone() ? `<button class="install-btn" id="installBtn">📲 ফোনের হোম স্ক্রিনে অ্যাপ রাখুন</button>` : ''}

    <button class="homework-hero" onclick="location.hash='#/homework'">
      <span class="hero-icon">📖</span>
      <span class="hero-text"><b>আজকের হোমওয়ার্ক</b><span>আজ ক্লাসে কী পড়া হয়েছে দেখুন</span></span>
    </button>

    ${sections.map(sec => `
      <div class="section-title">${sec.title}</div>
      <div class="menu-grid">
        ${sec.items.map(m => m.soon
    ? `<div class="menu-item soon" onclick="location.hash='#/soon/${m.soon}'">
               <span class="mi-icon">${m.icon}</span><span class="mi-label">${m.label}</span>
               <span class="badge-soon">শীঘ্রই আসছে</span>
             </div>`
    : `<div class="menu-item" onclick="location.hash='${m.go}'">
               <span class="mi-icon">${m.icon}</span><span class="mi-label">${m.label}</span>
             </div>`).join('')}
      </div>`).join('')}

    <div class="talk-section">
      <h3>💬 কথা বলুন</h3>
      <div class="talk-btns">
        <div class="talk-btn" onclick="location.hash='#/complaint'">✍️ <span>অভিযোগ / মতামত<small>লিখে পাঠালে সরাসরি হোয়াটসঅ্যাপে পৌঁছে যাবে</small></span></div>
        <a class="talk-btn" href="${SCHOOL.whatsapp}" target="_blank" rel="noopener">🟢 <span>হোয়াটসঅ্যাপে মেসেজ দিন<span class="try-first">প্রথমে এখানে চেষ্টা করুন</span><small>মেসেজ করলে কয়েক মিনিট থেকে কয়েক ঘণ্টার মধ্যেই উত্তর পেয়ে যাবেন</small></span></a>
        <button class="talk-btn" id="imoBtn" style="width:100%;text-align:left">🔵 <span>ইমোতে মেসেজ দিন<small>ইমোতে পেতে হলে আগে নম্বরটি (${bn(SCHOOL.phone)}) সেভ করে নিতে হবে — চাপ দিলে নম্বর কপি হবে</small></span></button>
      </div>
    </div>
  `;

  document.getElementById('imoBtn').addEventListener('click', async function () {
    try { await navigator.clipboard.writeText(SCHOOL.phone); } catch { }
    const small = this.querySelector('small');
    const old = small.textContent;
    small.textContent = '✅ নম্বর কপি হয়ে গেছে! এবার ইমো খুলে নম্বরটি সেভ করে মেসেজ দিন।';
    small.style.color = 'var(--green-dark)'; small.style.fontWeight = '700';
    setTimeout(() => { small.textContent = old; small.style.color = ''; small.style.fontWeight = ''; }, 5000);
  });

  document.getElementById('editProfile').addEventListener('click', () => openRegister(true));

  const ib = document.getElementById('installBtn');
  if (ib) ib.addEventListener('click', async () => {
    deferredInstall.prompt();
    await deferredInstall.userChoice;
    deferredInstall = null;
    render();
  });
}

/* ---------------- প্রোফাইল বদলানো (রেজিস্ট্রেশন আবার খোলা) ---------------- */
function openRegister(edit) {
  const reg = document.getElementById('screen-register');
  if (edit) {
    const p = getProfile();
    if (p) {
      document.getElementById('regStudent').value = p.studentName || '';
      document.getElementById('regFather').value = p.fatherName || '';
      document.getElementById('regPhone').value = p.phone || '';
      document.querySelectorAll('#regClassPicker .class-btn').forEach(b =>
        b.classList.toggle('selected', b.dataset.class === p.classId));
      const btn = document.querySelector(`#regClassPicker .class-btn[data-class="${p.classId}"]`);
      if (btn) btn.click();
    }
    reg.querySelector('h2').textContent = 'তথ্য ঠিক করুন';
  }
  /* ক্যানসেল বাটন — edit মোডে দেখাবে, চাপলে হোমে ফিরবে */
  const cancelBtn = document.getElementById('regCancel');
  cancelBtn.hidden = !edit;
  if (edit) {
    cancelBtn.onclick = () => {
      reg.classList.remove('active');
      enterApp();
    };
  }
  appbar.hidden = true; view.hidden = true; appFooter.hidden = true; homeFab.hidden = true;
  reg.classList.add('active');
}

/* ---------------- শ্রেণি বাছাই (হোমওয়ার্ক) ---------------- */
function renderClassPick(profile, mode) {
  view.innerHTML = `
    <p class="meta-line">কোন শ্রেণির হোমওয়ার্ক দেখতে চান?</p>
    <div class="class-list">
      ${[1, 2, 3, 4, 5].map(c => `
        <div class="class-row ${String(c) === profile.classId ? 'child-class' : ''}"
             onclick="location.hash='#/${mode}/${c}'">
          <span>${CLASS_LABEL[c]}</span>
          ${String(c) === profile.classId ? '<span class="child-tag">আপনার সন্তান</span>' : '<span class="arrow">›</span>'}
        </div>`).join('')}
    </div>`;
}

/* ---------------- হোমওয়ার্ক বিস্তারিত ---------------- */
async function renderHomeworkDetail(classId) {
  view.innerHTML = '<div class="loading">হোমওয়ার্ক আনা হচ্ছে…</div>';
  const subjects = SUBJECTS_BY_CLASS[classId] || [];

  let hw = null, label = 'আজকের হোমওয়ার্ক', date = todayStr(), netErr = false;
  try {
    hw = await DB.getHomework(classId, date);
    if (!hw) { date = yesterdayStr(); label = 'গতকালের হোমওয়ার্ক'; hw = await DB.getHomework(classId, date); }
  } catch (e) { console.warn(e); netErr = true; }

  if (netErr) {
    view.innerHTML = `<div class="empty-note">📶 হোমওয়ার্ক আনা যায়নি।<br>ইন্টারনেট সংযোগ দেখে আবার চেষ্টা করুন।</div>`;
    return;
  }

  if (!hw) {
    view.innerHTML = `
      <p class="meta-line">${CLASS_LABEL[classId]} • ${bnDate(todayStr())}</p>
      <div class="empty-note">😔 আজকের হোমওয়ার্ক এখনো আসেনি।<br>সন্ধ্যার দিকে আবার দেখুন।</div>`;
    return;
  }

  view.innerHTML = `
    <p class="meta-line">${label} • ${bnDate(hw.date)} • শেষ হালনাগাদ: ${bnUpdated(hw.updatedAt)}</p>
    ${subjects.map(s => {
    const t = (hw.subjects || {})[s];
    return `<div class="card subject-card ${t ? '' : 'empty'}">
        <div class="sub-name">${s}</div>
        ${t ? `<div class="sub-hw">${esc(t)}</div>` : '<div class="sub-none">আজ এই বিষয়ে পড়া নেই</div>'}
      </div>`;
  }).join('')}`;
}

/* ---------------- নোটিশ ---------------- */
async function renderNotices() {
  view.innerHTML = '<div class="loading">নোটিশ আনা হচ্ছে…</div>';
  let list = [], netErr = false;
  try { list = await DB.getNotices(); } catch (e) { console.warn(e); netErr = true; }

  if (netErr) {
    view.innerHTML = '<div class="empty-note">📶 নোটিশ আনা যায়নি।<br>ইন্টারনেট সংযোগ দেখে আবার চেষ্টা করুন।</div>';
    return;
  }

  if (!list.length) {
    view.innerHTML = '<div class="empty-note">📢 এখনো কোনো নোটিশ আসেনি।<br>স্কুল থেকে নতুন খবর এলে এখানেই দেখা যাবে।</div>';
    return;
  }
  view.innerHTML = list.map(n => `
    <div class="card ${n.urgent ? 'notice-urgent' : 'notice-normal'}">
      <div class="notice-title">${esc(n.title)}
        ${n.urgent ? '<span class="urgent-tag">জরুরি</span>' : ''}
        ${n.forClass && n.forClass !== 'all' ? `<span class="class-tag">${CLASS_LABEL[n.forClass]}</span>` : ''}
      </div>
      <div class="notice-date">${bnUpdated(n.createdAt)}</div>
      <div class="notice-body">${esc(n.body)}</div>
    </div>`).join('');
}

/* ---------- সাধারণ পাতা (পরীক্ষা/ছুটি/উপবৃত্তি) ---------- */
async function renderPage(key) {
  view.innerHTML = '<div class="loading">তথ্য আনা হচ্ছে…</div>';
  let p = null, netErr = false;
  try { p = await DB.getPage(key); } catch (e) { console.warn(e); netErr = true; }

  if (netErr) {
    view.innerHTML = '<div class="empty-note">📶 তথ্য আনা যায়নি।<br>ইন্টারনেট সংযোগ দেখে আবার চেষ্টা করুন।</div>';
    return;
  }

  view.innerHTML = p && p.body
    ? `${p.updatedAt ? `<p class="meta-line">শেষ হালনাগাদ: ${bnUpdated(p.updatedAt)}</p>` : ''}
       <div class="card"><div class="page-body">${esc(p.body)}</div></div>`
    : '<div class="empty-note">এখনো কোনো তথ্য দেওয়া হয়নি।</div>';
}

/* ---------------- ক্লাস রুটিন ---------------- */
async function renderRoutine(profile, selected) {
  const cur = selected || profile.classId;
  view.innerHTML = `
    <div class="class-picker" style="max-width:320px;margin-bottom:16px">
      ${[1, 2, 3, 4, 5].map(c => `<button class="class-btn ${String(c) === cur ? 'selected' : ''}" data-c="${c}">${bn(c)}</button>`).join('')}
    </div>
    <div id="routineBody"><div class="loading">রুটিন আনা হচ্ছে…</div></div>`;

  document.querySelectorAll('#view .class-btn').forEach(b =>
    b.addEventListener('click', () => renderRoutine(profile, b.dataset.c)));

  let r = null, netErr = false;
  try { r = await DB.getRoutine(cur); } catch (e) { console.warn(e); netErr = true; }
  document.getElementById('routineBody').innerHTML = netErr
    ? '<div class="empty-note">📶 রুটিন আনা যায়নি।<br>ইন্টারনেট সংযোগ দেখে আবার চেষ্টা করুন।</div>'
    : r && r.body
      ? `<div class="card"><h3>${CLASS_LABEL[cur]}</h3><div class="page-body" style="margin-top:8px">${esc(r.body)}</div></div>`
      : `<div class="empty-note">${CLASS_LABEL[cur]}-এর রুটিন এখনো দেওয়া হয়নি।</div>`;
}

/* ---------------- অভিযোগ / মতামত (হোয়াটসঅ্যাপে পাঠায়) ---------------- */
function renderComplaint(profile) {
  view.innerHTML = `
    <div class="card">
      <h3>✍️ অভিযোগ বা মতামত লিখুন</h3>
      <p class="meta-line" style="margin:6px 0 14px">আপনার কথা সরাসরি হোয়াটসঅ্যাপে স্কুল কর্তৃপক্ষের কাছে পৌঁছে যাবে।</p>
      <form id="complaintForm">
        <label class="field"><span class="field-label">আপনার নাম</span>
          <input type="text" id="cpName" value="${esc(profile.fatherName)}"></label>
        <label class="field"><span class="field-label">আপনার অভিযোগ / মতামত</span>
          <textarea id="cpMsg" placeholder="এখানে লিখুন…"></textarea></label>
        <p class="form-error" id="cpErr" hidden></p>
        <button type="submit" class="btn btn-primary">হোয়াটসঅ্যাপে পাঠান 📨</button>
      </form>
    </div>`;

  document.getElementById('complaintForm').addEventListener('submit', async e => {
    e.preventDefault();
    const name = document.getElementById('cpName').value.trim();
    const msg = document.getElementById('cpMsg').value.trim();
    const err = document.getElementById('cpErr');
    if (!msg) return showErr(err, 'অভিযোগ / মতামত লিখুন');

    /* ব্যাকআপ হিসেবে ডেটাবেসেও রাখি */
    try { await DB.submitComplaint({ name: name || 'অভিভাবক', classId: profile.classId, message: msg }); } catch (e2) { console.warn('complaint save', e2); }

    /* হোয়াটসঅ্যাপে পাঠাই */
    const waMsg = `*অভিযোগ / মতামত*\n\nনাম: ${name || 'অভিভাবক'}\nশ্রেণি: ${CLASS_LABEL[profile.classId]}\n\n${msg}`;
    window.open(`${SCHOOL.whatsapp}?text=${encodeURIComponent(waMsg)}`, '_blank');

    view.innerHTML = `
      <div class="card" style="text-align:center;padding:34px 18px">
        <div style="font-size:2.6rem">✅</div>
        <h3 style="margin-top:8px">হোয়াটসঅ্যাপে পাঠানো হচ্ছে</h3>
        <p class="meta-line" style="margin-top:6px">জাজাকাল্লাহ খাইর! হোয়াটসঅ্যাপ খুলবে — সেখান থেকে "পাঠান" চাপুন।</p>
        <button class="btn btn-outline" style="margin-top:16px" onclick="location.hash='#/'">হোমে ফিরুন</button>
      </div>`;
  });
}

/* ============================================================
   অ্যাডমিন প্যানেল
   ============================================================ */
function renderAdmin() {
  if (adminUser) return renderAdminPanel();

  view.innerHTML = `
    <div class="card">
      <h3>🔐 শিক্ষক / অ্যাডমিন লগইন</h3>
      <p class="meta-line" style="margin:6px 0 14px">এই অংশ শুধু স্কুলের জন্য। অভিভাবকদের এখানে কিছু করার নেই।</p>
      ${DB.isDemo ? `
        <p class="meta-line" style="margin-bottom:12px">ডেমো মোডে লগইন লাগবে না —</p>
        <button class="btn btn-primary" id="demoLogin">ডেমো অ্যাডমিন হিসেবে ঢুকুন</button>
      ` : `
      <form id="loginForm">
        <label class="field"><span class="field-label">ইমেইল</span>
          <input type="email" id="adEmail" autocomplete="username"></label>
        <label class="field"><span class="field-label">পাসওয়ার্ড</span>
          <input type="password" id="adPass" autocomplete="current-password"></label>
        <p class="form-error" id="adErr" hidden></p>
        <button type="submit" class="btn btn-primary">ঢুকুন</button>
      </form>`}
    </div>`;

  if (DB.isDemo) {
    document.getElementById('demoLogin').addEventListener('click', async () => {
      adminUser = await DB.adminLogin();
      renderAdminPanel();
    });
  } else {
    document.getElementById('loginForm').addEventListener('submit', async e => {
      e.preventDefault();
      const err = document.getElementById('adErr');
      try {
        adminUser = await DB.adminLogin(
          document.getElementById('adEmail').value.trim(),
          document.getElementById('adPass').value);
        renderAdminPanel();
      } catch (e2) {
        const code = e2.code || '';
        showErr(err,
          e2.message === 'no-admin'
            ? 'লগইন হয়েছে, কিন্তু অ্যাডমিন অনুমতি নেই — SETUP.md-এর ধাপ ৫.২ অনুযায়ী admins কালেকশনে আপনার UID যোগ করা আছে কি না দেখুন।'
            : code === 'auth/invalid-email'
              ? 'ইমেইল ঠিক নেই — পুরো ইমেইল লিখুন (যেমন: naam@gmail.com)।'
              : code === 'auth/user-not-found'
                ? 'এই ইমেইলে কোনো অ্যাকাউন্ট নেই — Firebase Console → Authentication → Users-এ আগে অ্যাকাউন্ট বানান (SETUP.md ধাপ ৫)।'
                : code === 'auth/wrong-password' || code === 'auth/invalid-credential'
                  ? 'ইমেইল বা পাসওয়ার্ড মিলছে না — আবার চেষ্টা করুন।'
                  : 'লগইন হয়নি। ইন্টারনেট দেখে আবার চেষ্টা করুন। (' + code + ')');
      }
    });
  }
}

let adminTab = 'homework';
function renderAdminPanel() {
  const tabs = [
    ['homework', '📖 হোমওয়ার্ক'], ['notice', '📢 নোটিশ'], ['routine', '📅 রুটিন'],
    ['pages', '📄 ঘোষণা'], ['complaints', '✉️ অভিযোগ']
  ];
  view.innerHTML = `
    <div class="admin-head">
      <h3>👋 ${esc(adminUser.name || 'অ্যাডমিন')}</h3>
      <button class="logout-btn" id="adminLogout">বের হোন</button>
    </div>
    <div class="admin-tabs">
      ${tabs.map(([k, l]) => `<button class="admin-tab ${k === adminTab ? 'active' : ''}" data-tab="${k}">${l}</button>`).join('')}
    </div>
    <div id="adminBody"></div>`;

  document.getElementById('adminLogout').addEventListener('click', async () => {
    try { await DB.adminLogout(); } catch { }
    adminUser = null; location.hash = '#/';
  });
  document.querySelectorAll('.admin-tab').forEach(t =>
    t.addEventListener('click', () => { adminTab = t.dataset.tab; renderAdminPanel(); }));

  const body = document.getElementById('adminBody');
  if (adminTab === 'homework') adminHomework(body);
  else if (adminTab === 'notice') adminNotice(body);
  else if (adminTab === 'routine') adminRoutine(body);
  else if (adminTab === 'pages') adminPages(body);
  else if (adminTab === 'complaints') adminComplaints(body);
}

/* ----- অ্যাডমিন: হোমওয়ার্ক ----- */
function adminHomework(body) {
  body.innerHTML = `
    <div class="card">
      <div class="admin-row">
        <label class="field"><span class="field-label">শ্রেণি</span>
          <select id="ahClass">${[1, 2, 3, 4, 5].map(c => `<option value="${c}">${CLASS_LABEL[c]}</option>`).join('')}</select></label>
        <label class="field"><span class="field-label">তারিখ</span>
          <input type="date" id="ahDate" value="${todayStr()}"></label>
      </div>
      <div id="ahSubjects"></div>
      <button class="btn btn-primary" id="ahSave">প্রকাশ করুন ✅</button>
      <p class="save-ok" id="ahOk" hidden>সেভ হয়েছে! অভিভাবকরা এখনই দেখতে পাবেন।</p>
    </div>`;

  const classSel = document.getElementById('ahClass');
  const dateIn = document.getElementById('ahDate');

  async function load() {
    const cid = classSel.value, date = dateIn.value;
    const subjects = SUBJECTS_BY_CLASS[cid];
    let hw = null;
    try { hw = await DB.getHomework(cid, date); } catch { }
    document.getElementById('ahSubjects').innerHTML = subjects.map(s => `
      <label class="field"><span class="field-label">${s}</span>
        <textarea data-subject="${s}" placeholder="এই বিষয়ে পড়া না থাকলে ফাঁকা রাখুন">${esc((hw?.subjects || {})[s] || '')}</textarea></label>`).join('');
    document.getElementById('ahOk').hidden = true;
  }
  classSel.addEventListener('change', load);
  dateIn.addEventListener('change', load);

  document.getElementById('ahSave').addEventListener('click', async () => {
    const subjects = {};
    document.querySelectorAll('#ahSubjects textarea').forEach(t => {
      const v = t.value.trim();
      if (v) subjects[t.dataset.subject] = v;
    });
    await DB.saveHomework(classSel.value, dateIn.value, subjects);
    document.getElementById('ahOk').hidden = false;
  });

  load();
}

/* ----- অ্যাডমিন: নোটিশ ----- */

// নমুনা নোটিশ — নতুন অ্যাডমিনদের শেখানোর জন্য
const SAMPLE_NOTICES = [
  {
    title: 'নতুন বই বিতরণ',
    body: 'আগামী রবিবার সকাল ১০টা থেকে নতুন শ্রেণির বই বিতরণ করা হবে। সব শিক্ষার্থীকে স্কুলে উপস্থিত থাকতে হবে।',
    urgent: false, forClass: 'all'
  },
  {
    title: 'অভিভাবক সমাবেশ',
    body: 'আগামী বুধবার সকাল ১১টায় অভিভাবক সমাবেশ অনুষ্ঠিত হবে। সব অভিভাবককে উপস্থিত থাকার জন্য বিশেষভাবে অনুরোধ করা হলো।',
    urgent: true, forClass: 'all'
  }
];

async function adminNotice(body) {
  body.innerHTML = `
    <div class="card" style="background:var(--green-light);border:1.5px dashed var(--green)">
      <h3>📚 কীভাবে নোটিশ দেবেন</h3>
      <p class="meta-line" style="margin-top:6px">
        ১) নিচের ফর্মে <b>শিরোনাম</b> (ছোট শিরোনাম) ও <b>বিস্তারিত</b> (পুরো খবর) লিখুন।<br>
        ২) জরুরি খবর হলে <b>"জরুরি"</b> টিক দিন — লাল রঙে দেখাবে।<br>
        ৩) <b>"প্রকাশ করুন"</b> চাপলেই সব অভিভাবকের অ্যাপের নোটিশ পাতায় চলে যাবে।<br>
        প্রথমবার বুঝতে চাইলে নিচের সবুজ বাটনে চাপ দিন — ২টা নমুনা নোটিশ যোগ হবে, পরে মুছে দিতে পারবেন।
      </p>
      <button class="btn btn-outline btn-small" id="anDemo">🧪 ২টা নমুনা নোটিশ যোগ করুন</button>
    </div>
    <div class="card">
      <h3>নতুন নোটিশ</h3>
      <label class="field" style="margin-top:10px"><span class="field-label">শিরোনাম</span>
        <input type="text" id="anTitle" placeholder="যেমন: নতুন বই বিতরণ"></label>
      <label class="field"><span class="field-label">বিস্তারিত</span>
        <textarea id="anBody" placeholder="যেমন: আগামী রবিবার সকাল ১০টা থেকে নতুন শ্রেণির বই বিতরণ করা হবে। সব শিক্ষার্থীকে স্কুলে উপস্থিত থাকতে হবে।"></textarea></label>
      <div class="admin-row">
        <label class="field"><span class="field-label">কার জন্য</span>
          <select id="anClass"><option value="all">সবার জন্য</option>
            ${[1, 2, 3, 4, 5].map(c => `<option value="${c}">${CLASS_LABEL[c]}</option>`).join('')}</select></label>
        <label class="field" style="display:flex;align-items:flex-end;gap:8px;padding-bottom:12px">
          <input type="checkbox" id="anUrgent" style="width:22px;height:22px"> <b>জরুরি</b></label>
      </div>
      <button class="btn btn-primary" id="anSave">প্রকাশ করুন 📢</button>
      <p class="save-ok" id="anOk" hidden>নোটিশ প্রকাশিত হয়েছে! অভিভাবকরা এখনই দেখতে পাবেন।</p>
      <p class="form-error" id="anErr" hidden></p>
    </div>
    <div class="card"><h3>পুরোনো নোটিশ</h3><div id="anList"><div class="loading"></div></div></div>`;

  const err = document.getElementById('anErr');

  document.getElementById('anSave').addEventListener('click', async () => {
    const title = document.getElementById('anTitle').value.trim();
    const bodyText = document.getElementById('anBody').value.trim();
    if (!title || !bodyText) return showErr(err, 'শিরোনাম ও বিস্তারিত — দুটোই লিখুন');
    try {
      await DB.addNotice({ title, body: bodyText, urgent: document.getElementById('anUrgent').checked, forClass: document.getElementById('anClass').value });
      err.hidden = true;
      document.getElementById('anOk').hidden = false;
      document.getElementById('anTitle').value = '';
      document.getElementById('anBody').value = '';
      document.getElementById('anUrgent').checked = false;
      loadList();
    } catch (e) { showErr(err, 'প্রকাশ হয়নি — ইন্টারনেট দেখে আবার চেষ্টা করুন।'); }
  });

  document.getElementById('anDemo').addEventListener('click', async () => {
    try {
      for (const n of SAMPLE_NOTICES) await DB.addNotice(n);
      loadList();
      showOkOnce();
    } catch (e) { showErr(err, 'নমুনা যোগ হয়নি — ইন্টারনেট দেখুন।'); }
  });
  function showOkOnce() {
    const ok = document.getElementById('anOk');
    ok.textContent = '✅ নমুনা নোটিশ যোগ হয়েছে! হোম → নোটিশ পাতায় গিয়ে দেখুন। (পরে নিচে থেকে মুছে দিতে পারবেন)';
    ok.hidden = false;
  }

  async function loadList() {
    let list = [];
    try { list = await DB.getNotices(); } catch (e) { console.warn(e); }
    document.getElementById('anList').innerHTML = list.length
      ? list.map(n => `<div class="admin-list-item">
          <div><b>${esc(n.title)}</b>
            ${n.urgent ? '<span class="urgent-tag">জরুরি</span>' : ''}
            <div class="notice-date">${bnUpdated(n.createdAt)}</div></div>
          <button class="del" data-id="${n.id}">মুছুন</button></div>`).join('')
      : '<p class="meta-line">কোনো নোটিশ নেই</p>';
    document.querySelectorAll('#anList .del').forEach(b =>
      b.addEventListener('click', async () => {
        if (confirm('নোটিশটি মুছে ফেলবেন?')) { await DB.deleteNotice(b.dataset.id); loadList(); }
      }));
  }
  loadList();
}

/* ----- অ্যাডমিন: রুটিন ----- */
function adminRoutine(body) {
  body.innerHTML = `
    <div class="card">
      <label class="field"><span class="field-label">শ্রেণি</span>
        <select id="arClass">${[1, 2, 3, 4, 5].map(c => `<option value="${c}">${CLASS_LABEL[c]}</option>`).join('')}</select></label>
      <label class="field"><span class="field-label">রুটিন (প্রতি লাইনে একটা পিরিয়ড)</span>
        <textarea id="arBody" style="min-height:180px"></textarea></label>
      <button class="btn btn-primary" id="arSave">সেভ করুন</button>
      <p class="save-ok" id="arOk" hidden>রুটিন সেভ হয়েছে!</p>
    </div>`;
  const sel = document.getElementById('arClass');
  async function load() {
    const r = await DB.getRoutine(sel.value);
    document.getElementById('arBody').value = r?.body || '';
    document.getElementById('arOk').hidden = true;
  }
  sel.addEventListener('change', load);
  document.getElementById('arSave').addEventListener('click', async () => {
    await DB.saveRoutine(sel.value, document.getElementById('arBody').value.trim());
    document.getElementById('arOk').hidden = false;
  });
  load();
}

/* ----- অ্যাডমিন: ঘোষণা (পরীক্ষা/ছুটি/উপবৃত্তি) ----- */
function adminPages(body) {
  body.innerHTML = `
    <div class="card">
      <label class="field"><span class="field-label">কোন পাতা</span>
        <select id="apKey">${Object.entries(PAGES).map(([k, p]) => `<option value="${k}">${p.icon} ${p.title}</option>`).join('')}</select></label>
      <label class="field"><span class="field-label">তথ্য</span>
        <textarea id="apBody" style="min-height:180px"></textarea></label>
      <button class="btn btn-primary" id="apSave">সেভ করুন</button>
      <p class="save-ok" id="apOk" hidden>সেভ হয়েছে!</p>
    </div>`;
  const sel = document.getElementById('apKey');
  async function load() {
    const p = await DB.getPage(sel.value);
    document.getElementById('apBody').value = p?.body || '';
    document.getElementById('apOk').hidden = true;
  }
  sel.addEventListener('change', load);
  document.getElementById('apSave').addEventListener('click', async () => {
    await DB.savePage(sel.value, document.getElementById('apBody').value.trim());
    document.getElementById('apOk').hidden = false;
  });
  load();
}

/* ----- অ্যাডমিন: অভিযোগ তালিকা ----- */
async function adminComplaints(body) {
  body.innerHTML = '<div class="loading">অভিযোগ আনা হচ্ছে…</div>';
  let list = [];
  try { list = await DB.getComplaints(); } catch (e) { console.warn(e); }
  body.innerHTML = list.length
    ? list.map(c => `<div class="card complaint-item">
        <div class="who">${esc(c.name)} <span class="class-tag">${CLASS_LABEL[c.classId] || ''}</span></div>
        <div class="when">${bnUpdated(c.createdAt)}</div>
        <div class="msg">${esc(c.message)}</div>
      </div>`).join('')
    : '<div class="empty-note">কোনো অভিযোগ আসেনি।</div>';
}

/* ============================================================
   ইনস্টল + সার্ভিস ওয়ার্কার
   ============================================================ */

/* অ্যাপ ইতিমধ্যে ইনস্টল হয়েছে কিনা চেক (standalone mode) */
function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true ||
    document.referrer.startsWith('android-app://');
}

/* স্প্ল্যাশের পর ইনস্টল প্রম্পট দেখাও */
function showInstallPrompt() {
  const splash = document.getElementById('screen-splash');
  const btn = document.getElementById('splashInstall');
  if (!btn) return;

  // স্প্ল্যাশ স্ক্রিন রাখো, ইনস্টল বাটন দেখাও
  splash.classList.add('active');
  btn.hidden = false;

  btn.addEventListener('click', async function handleInstall() {
    btn.removeEventListener('click', handleInstall);
    if (deferredInstall) {
      btn.disabled = true;
      btn.textContent = '⏳ ইনস্টল হচ্ছে…';
      deferredInstall.prompt();
      const choice = await deferredInstall.userChoice;
      deferredInstall = null;
      btn.hidden = true;
      // ইনস্টল করুন চাপলে বা বাতিল করলে — অ্যাপে ঢুকে পড়ো
      splash.classList.remove('active');
      if (getProfile()) enterApp();
      else document.getElementById('screen-register').classList.add('active');
    } else {
      btn.hidden = true;
      splash.classList.remove('active');
      if (getProfile()) enterApp();
      else document.getElementById('screen-register').classList.add('active');
    }
  }, { once: true });
}

function setupInstall() {
  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    deferredInstall = e;
    // স্প্ল্যাশ চলছে থাকলে কিছু করতে হবে না — leave() ফাংশন দেখাবে
    // স্প্ল্যাশ শেষ হলে এবং অ্যাপে ঢুকে গেলে হোম পেজে বাটন দেখাও
    const splash = document.getElementById('screen-splash');
    if (splash && splash.classList.contains('active')) return; // স্প্ল্যাশ চলছে, পরে দেখাবে
    if (getProfile()) render();
  });

  // অ্যাপ ইনস্টল হয়ে গেলে
  window.addEventListener('appinstalled', () => {
    deferredInstall = null;
    const btn = document.getElementById('splashInstall');
    if (btn) btn.hidden = true;
  });

  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    navigator.serviceWorker.register('sw.js').catch(() => { });
  }
}

/* ---------------- শুরু ---------------- */
document.addEventListener('DOMContentLoaded', boot);
