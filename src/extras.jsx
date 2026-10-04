/* v1.9.21 덧붙는 조각 — 필요할 때만 불러옵니다 (extras.min.js)
   첫 화면 크기 한도(app.min.js 400KB · 첫 로딩 gzip 150KB) 때문에 따로 묶었습니다.
   app.min.js 가 먼저 떠 있어야 합니다. React 훅·DB·SYNC·PHOTO·clutchRows 등은 거기 것을 씁니다.
   window.CREG_EXTRAS = { SeasonNoteSheet, SaleCardSheet, AdoptSendSheet, AdoptReceive, chat, … }
   ★ 시즌 노트 · 분양 카드 · 입양 보내기/받기 */
(function () {
/* 이 조각이 쓰는 모양(첫 등록 화면과 같은 .onb 모양은 입양 받기 화면도 씁니다) */
(function injectCss() {
  try {
    if (document.getElementById('cg-extras-css')) return;
    const st = document.createElement('style');
    st.id = 'cg-extras-css';
    st.textContent = `.onb { position: fixed; inset: 0; z-index: 1000; background: var(--bg); display: flex; align-items: flex-start; justify-content: center; overflow-y: auto; padding: calc(28px + var(--safe-top)) 18px calc(24px + var(--safe-bottom)); } .onb-card { position: relative; width: 100%; max-width: 420px; display: flex; flex-direction: column; align-items: stretch; text-align: center; padding-top: 18px; } .onb-card h2 { font-size: 23px; line-height: 1.38; margin: 18px 0 8px; color: var(--text); word-break: keep-all; } .onb-card p { font-size: 14.5px; line-height: 1.6; color: var(--text2); margin: 0 0 14px; word-break: keep-all; } .onb-hero { align-self: center; margin-top: 18px; } .onb-bar { height: 5px; border-radius: 3px; background: var(--border); overflow: hidden; margin: 0 34px 0 44px; } .onb-bar i { display: block; height: 100%; background: var(--accent); border-radius: 3px; transition: width .25s; } .onb-back { position: absolute; left: -4px; top: 2px; background: none; border: none; font-size: 30px; line-height: 1; color: var(--text3); cursor: pointer; padding: 0 8px; } .onb-input { width: 100%; font-size: 19px; padding: 14px 16px; border-radius: 14px; border: 1.5px solid var(--border); background: var(--card); color: var(--text); margin: 8px 0 4px; text-align: center; } .onb-input:focus { outline: none; border-color: var(--accent); } .onb-err { color: var(--accent2); font-size: 13px; margin: 4px 0; } .onb-main { margin-top: 18px; background: var(--accent); color: var(--on-accent); border: none; border-radius: 16px; padding: 16px; font-size: 17px; font-weight: 800; cursor: pointer; } .onb-main:disabled { opacity: .55; } .onb-sub { margin-top: 12px; background: none; border: none; color: var(--text2); font-size: 14px; text-decoration: underline; cursor: pointer; padding: 6px; } .onb-sub.strong { color: var(--accent2); font-weight: 700; } .onb-skip { margin-top: 26px; align-self: center; background: none; border: none; color: var(--text3); font-size: 12.5px; text-decoration: underline; cursor: pointer; padding: 6px 10px; } .onb-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-top: 10px; } .onb-grid.two { grid-template-columns: repeat(2, 1fr); } .onb-opt { background: var(--card); border: 1.5px solid var(--border); border-radius: 14px; padding: 15px 6px; font-size: 15px; font-weight: 700; color: var(--text); cursor: pointer; word-break: keep-all; } .onb-opt.on { border-color: var(--accent); background: var(--accent-soft); color: var(--accent2); } .onb-or { font-size: 12.5px; color: var(--text3); margin-top: 14px; } .onb-done { font-size: 48px; margin-top: 18px; } .onb-say { background: var(--card); border: 1px solid var(--border); border-radius: 14px; padding: 12px; font-size: 15px; line-height: 1.8; color: var(--accent2); font-weight: 700; } .onb-warn { font-size: 12.5px !important; color: var(--accent2) !important; background: var(--accent-soft); border-radius: 10px; padding: 8px 10px; margin-top: 12px !important; text-align: left; } .onb-link { background: none; border: none; color: var(--accent2); text-decoration: underline; font-weight: 700; padding: 0; cursor: pointer; font-size: inherit; } .sn-years { display: flex; gap: 6px; margin-bottom: 10px; flex-wrap: wrap; } .sn-years button, .sn-dirs button, .sn-tags button { border: 1px solid var(--border); background: var(--card); color: var(--text2); border-radius: 16px; padding: 6px 12px; font-size: 13px; font-weight: 600; cursor: pointer; } .sn-years button.on, .sn-dirs button.on, .sn-tags button.on { border-color: var(--accent); background: var(--accent-soft); color: var(--accent2); } .sn-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; margin-bottom: 10px; } .sn-tile { background: var(--bg2); border-radius: 12px; padding: 9px 11px; display: flex; flex-direction: column; text-align: left; } .sn-tile span { font-size: 11.5px; color: var(--text3); } .sn-tile b { font-size: 18px; color: var(--text); margin-top: 2px; } .sn-tile small { font-size: 11.5px; color: var(--text2); } .sn-facts { background: var(--accent-soft); color: var(--accent2); border-radius: 10px; padding: 8px 10px; font-size: 12.5px; line-height: 1.6; margin-bottom: 10px; } .sn-sec { margin: 6px 0 12px; } .sn-h { font-size: 13px; font-weight: 800; margin-bottom: 6px; color: var(--text); } .sn-pair { display: flex; justify-content: space-between; font-size: 13px; padding: 5px 2px; border-bottom: 1px solid var(--border); color: var(--text2); } .sn-kid { border: 1px solid var(--border); border-radius: 12px; margin-bottom: 6px; overflow: hidden; } .sn-kid-top { width: 100%; background: none; border: none; text-align: left; padding: 9px 11px; display: flex; flex-wrap: wrap; gap: 2px 8px; align-items: baseline; cursor: pointer; color: var(--text); } .sn-kid-top b { font-size: 14px; } .sn-kid-top span { font-size: 12px; color: var(--text3); } .sn-kid-top i { font-style: normal; font-size: 12px; color: var(--accent2); width: 100%; } .sn-kid-body { padding: 0 11px 10px; } .sn-tags, .sn-dirs { display: flex; flex-wrap: wrap; gap: 5px; margin-bottom: 8px; } .sn-ta { min-height: 54px; margin-bottom: 6px; resize: vertical; font-size: 13.5px; } .sn-empty { font-size: 13px; color: var(--text3); padding: 10px 0; } .sn-empty.small { padding: 2px 0 6px; } .card-prev { border-radius: 14px; overflow: hidden; background: var(--bg2); aspect-ratio: 1 / 1; display: flex; align-items: center; justify-content: center; } .card-prev img { width: 100%; height: 100%; display: block; } .card-wait { font-size: 13px; color: var(--text3); } .adopt-cover { width: 180px; height: 180px; border-radius: 50%; overflow: hidden; align-self: center; margin-top: 14px; background: var(--bg2); display: flex; align-items: center; justify-content: center; font-size: 60px; border: 4px solid var(--accent-soft); } .adopt-cover img { width: 100%; height: 100%; object-fit: cover; } .adopt-info { display: flex; flex-direction: column; gap: 3px; background: var(--card); border: 1px solid var(--border); border-radius: 14px; padding: 12px; margin: 4px 0 12px; } .adopt-info b { font-size: 22px; } .adopt-info span { font-size: 13.5px; color: var(--text2); } .adopt-info small { font-size: 12.5px; color: var(--accent2); margin-top: 4px; } .adopt-name { display: block; text-align: left; font-size: 12.5px; color: var(--text3); } .adopt-memo { display: flex; gap: 8px; align-items: flex-start; font-size: 13px; padding: 7px 0; border-bottom: 1px solid var(--border); text-align: left; } .adopt-memo span { flex: 1; line-height: 1.5; word-break: break-all; } .adopt-memo small { display: block; font-size: 11px; color: var(--text3); }`;
    document.head.appendChild(st);
  } catch (e) {}
})();

/* ══════════════════════════════════════════
   v1.9.21 개체 시즌 노트 — 암컷·수컷 한 마리의 한 시즌(해 단위)을 한 장으로
   ★ 숫자는 저장하지 않고 열 때마다 기존 기록에서 계산합니다(판정 사본을 두지 않는 원칙).
     산란·부화 기록을 고치면 노트도 저절로 맞춰집니다.
   ★ 브리더가 적는 것만 저장합니다: 개체.seasonNotes[해] = { dir, good, bad, memo, summary }
     자식 특징은 자식 개체 쪽(traits·traitNote)에 남아, 그 아이가 부모가 됐을 때도 다시 볼 수 있습니다.
   ★ 앱은 판단을 대신하지 않습니다 — 사실 알림(몸무게 변화 등)만 하고 모프·유전 추천은 하지 않습니다.
   ══════════════════════════════════════════ */
const SEASON_TRAITS = ['색 진함', '패턴 좋음', '크레스트 풍성', '체형 좋음', '성장 빠름', '성장 느림', '주의 필요'];
const SEASON_DIRS = [
  { key: 'keep', label: '같은 짝 계속' }, { key: 'change', label: '짝 바꾸기' },
  { key: 'rest', label: '한 시즌 쉬기' }, { key: 'retire', label: '은퇴' },
];
const seasonDirLabel = (k) => (SEASON_DIRS.find(d => d.key === k) || {}).label || '';
const yearOf = (d) => String(d || '').slice(0, 4);
const daysBetween = (a, b) => Math.round((new Date(b) - new Date(a)) / 86400000);

/* 이 아이가 브리딩 기록을 가진 해들 (최근 해 먼저) */
function seasonYears(g, list, evs) {
  if (!g) return [];
  const inds = list || DB.getIndividuals(), all = evs || DB.getEvents();
  const male = g.gender === 'male';
  const ys = new Set();
  clutchRows(inds, all).forEach(r => { if (male ? r.dadId === g.id : r.e.individualId === g.id) ys.add(yearOf(r.e.date)); });
  all.forEach(e => {
    if (e.type === 'mating' && (e.individualId === g.id || (e.data && e.data.partnerId === g.id))) ys.add(yearOf(e.date));
  });
  return [...ys].filter(y => /^\d{4}$/.test(y)).sort().reverse();
}

function seasonNoteStats(g, year, list, evs) {
  const inds = list || DB.getIndividuals(), all = evs || DB.getEvents();
  const male = g.gender === 'male';
  const rows = clutchRows(inds, all).filter(r => (male ? r.dadId === g.id : r.e.individualId === g.id) && yearOf(r.e.date) === year);
  const count = (st) => rows.reduce((a, r) => a + r.units.filter(u => u.status === st).length, 0);
  const hatchedOf = (r) => Math.max(r.units.filter(u => u.status === 'hatched').length, r.babies.length);
  const eggsKnown = rows.filter(r => parseInt(r.eggs, 10) > 0);
  const eggs = eggsKnown.reduce((a, r) => a + parseInt(r.eggs, 10), 0);
  const unknownEggs = rows.length - eggsKnown.length;
  const hatched = rows.reduce((a, r) => a + hatchedOf(r), 0);
  const dates = rows.map(r => r.e.date).sort();
  const gaps = []; for (let i = 1; i < dates.length; i++) gaps.push(daysBetween(dates[i - 1], dates[i]));
  const inc = rows.filter(r => r.hatches && r.hatches[0]).map(r => daysBetween(r.e.date, r.hatches[0].date)).filter(d => d > 30 && d < 200);
  const avg = (a) => a.length ? Math.round(a.reduce((x, y) => x + y, 0) / a.length) : null;
  // 짝별 결과 (암컷이면 수컷별, 수컷이면 암컷별)
  const pairs = {};
  rows.forEach(r => {
    const k = (male ? r.momName : r.dadName) || '짝 모름';
    const p = pairs[k] = pairs[k] || { mate: k, clutches: 0, eggs: 0, hatched: 0 };
    p.clutches++; p.eggs += parseInt(r.eggs, 10) || 0; p.hatched += hatchedOf(r);
  });
  // 몸무게 — 시즌 첫 산란 전 마지막 값 → 그 해 마지막 값
  const ws = all.filter(e => e.individualId === g.id && e.type === 'growth' && e.data && Number(e.data.weight) > 0)
    .sort((a, b) => (a.date < b.date ? -1 : 1));
  const firstDay = dates[0] || (year + '-01-01');
  const wBefore = [...ws].filter(e => e.date <= firstDay).pop() || ws.find(e => yearOf(e.date) === year) || null;
  const wAfter = [...ws].filter(e => yearOf(e.date) === year).pop() || null;
  let weight = null;
  if (wBefore && wAfter && wAfter.date > wBefore.date) {
    const a = Number(wBefore.data.weight), b = Number(wAfter.data.weight);
    weight = { from: a, to: b, fromDate: wBefore.date, toDate: wAfter.date, pct: Math.round((b - a) / a * 100) };
  }
  // 자식 — 이 해 산란에서 나온 아이들
  const seen = new Set(), kids = [];
  rows.forEach(r => r.babies.forEach(b => { if (!seen.has(b.id)) { seen.add(b.id); kids.push({ ...b, clutchNth: r.nth, mate: (male ? r.momName : r.dadName) || '' }); } }));
  const facts = [];
  if (weight && weight.pct <= -10) facts.push(`시즌 동안 몸무게가 ${-weight.pct}% 줄었어요 (${weight.from}g → ${weight.to}g)`);
  if (unknownEggs) facts.push(`알 개수가 빈 산란이 ${unknownEggs}번 있어 부화율은 대략이에요`);
  return {
    year, male, rows, clutches: rows.length,
    first: dates[0] || '', last: dates[dates.length - 1] || '',
    gap: avg(gaps), eggs, unknownEggs, hatched,
    infertile: count('infertile'), problem: count('problem'), pending: count('pending'),
    rate: eggs && !count('pending') ? Math.round(hatched / eggs * 100) : null,   // 아직 품는 알이 있으면 부화율은 내지 않습니다
    incubation: avg(inc), weight, pairs: Object.values(pairs), kids,
    kept: kids.filter(k => (k.status || 'own') === 'own').length,
    sold: kids.filter(k => k.status === 'sold').length,
    facts,
  };
}

const seasonNoteOf = (g, year) => ((g && g.seasonNotes) || {})[year] || {};
function saveSeasonNote(id, year, patch) {
  const g = DB.getIndividuals().find(i => i.id === id);
  if (!g) return null;
  const notes = { ...(g.seasonNotes || {}) };
  notes[year] = { ...(notes[year] || {}), ...patch, updatedAt: now() };
  DB.updateIndividual(id, { seasonNotes: notes });
  return notes[year];
}
/* 자식 특징 태그 — 켜고 끄기 */
function toggleTrait(id, tag, on) {
  const g = DB.getIndividuals().find(i => i.id === id);
  if (!g) return [];
  const cur = Array.isArray(g.traits) ? g.traits : [];
  const want = on === undefined ? cur.indexOf(tag) < 0 : on;
  const next = want ? (cur.indexOf(tag) >= 0 ? cur : [...cur, tag]) : cur.filter(t => t !== tag);
  DB.updateIndividual(id, { traits: next });
  return next;
}
/* 한 줄 요약 — 시즌을 닫거나 노트를 열 때 자동으로 만들어 보여 줍니다(고쳐 쓸 수 있음) */
function seasonSummaryText(g, st, note) {
  const bits = [];
  if (st.clutches) bits.push(`${st.year}년 ${st.male ? '짝지은 암컷과' : ''} 산란 ${st.clutches}번`.replace('  ', ' '));
  if (st.eggs) bits.push(`알 ${st.eggs}개${st.unknownEggs ? '+' : ''}`);
  bits.push(`부화 ${st.hatched}마리${st.rate != null && !st.unknownEggs ? ` (${st.rate}%)` : ''}`);
  if (st.gap) bits.push(`평균 ${st.gap}일 간격`);
  let line = `${g.name} — ` + bits.join(' · ') + '.';
  const tagged = st.kids.filter(k => (k.traits || []).length);
  if (tagged.length) line += ' ' + tagged.slice(0, 3).map(k => `${k.name}(${k.traits.slice(0, 2).join('·')})`).join(', ') + '.';
  if (note && note.dir) line += ` 다음 시즌: ${seasonDirLabel(note.dir)}.`;
  return line;
}


/* ══════════════════════════════════════════
   v1.9.21 입양 연결 — 기록의 '복사본'을 건넵니다
   ★ 원칙: 보내는 쪽 기록과 받는 쪽의 기존 기록은 어떤 경우에도 바뀌지 않습니다.
     받는 쪽에는 '새 개체로 추가'만 합니다(새 번호). 같은 링크는 두 번 들어오지 않습니다(adoptFrom.code).
   ★ 무엇이 넘어가는지는 adoptSnapshot() 한 곳에서만 정합니다(허용 목록). 돈·분양 기록·입양자 정보는 담기지 않습니다.
   ★ 메모도 그 아이의 기록이라 넘깁니다. 다만 돈·연락처로 보이는 메모는 미리 빼 두고 보내는 분이 고릅니다.
   ★ 서버: cg_adopt 표 + cg_adopt_peek / cg_adopt_claim / cg_adopt_revoke 함수 (supabase_adopt.sql)
   ══════════════════════════════════════════ */
const ADOPT_V = 1;
const ADOPT_TABLE = 'cg_adopt';
const ADOPT_DAYS = 7;
const ADOPT_PHOTOS = 6;
/* 넘어가는 기록 종류 — 이 목록에 없는 것은 나가지 않습니다 */
const ADOPT_KINDS = ['growth', 'feeding', 'shed', 'health', 'condition', 'env', 'photo', 'memo'];
/* 절대 나가지 않는 종류 — 실수로 위에 추가되면 테스트가 잡습니다 */
const ADOPT_NEVER = ['ledger', 'distribution', 'mating', 'laying', 'hatching', 'season'];
/* 기록 안에서도 이런 이름의 칸은 지웁니다 */
const ADOPT_DROP_KEY = /price|won|buyer|contact|phone|adopter|sale|free|laying|target|avatar/i;
/* 돈·연락처로 보이는 글 — 메모를 미리 빼 둘지 정할 때 씁니다 */
const looksPrivate = (t) => /\d[\d,.]*\s*(원|만)|만\s*원|01[016789][-\s.]?\d{3,4}[-\s.]?\d{4}|카톡|오픈채팅|계좌|입금/.test(String(t || ''));
const memoText = (e) => String((e && e.data && (e.data.notes || e.data.text)) || '').trim();

/* 보내기 전 미리보기에 쓰는 메모 목록 */
function adoptMemos(g, evs) {
  return (evs || DB.getEvents()).filter(e => e.individualId === g.id && e.type === 'memo' && memoText(e))
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .map(e => ({ id: e.id, date: e.date, text: memoText(e), flagged: looksPrivate(memoText(e)) }));
}
const adoptCleanData = (data) => {
  const out = {};
  Object.keys(data || {}).forEach(k => { if (!ADOPT_DROP_KEY.test(k)) out[k] = data[k]; });
  return out;
};

/* 넘겨줄 보따리 — skipMemo: 빼기로 한 메모 id 목록 */
function adoptSnapshot(g, opt) {
  const o = opt || {};
  const skip = new Set(o.skipMemo || []);
  const inds = o.inds || DB.getIndividuals();
  const evs = o.evs || DB.getEvents();
  const byId = {}; inds.forEach(i => { byId[i.id] = i; });
  const par = (id) => byId[id] ? { name: byId[id].name || '', morph: String(byId[id].morph || '').trim() } : null;
  const mine = evs.filter(e => e.individualId === g.id && ADOPT_KINDS.indexOf(e.type) >= 0 && !(e.type === 'memo' && skip.has(e.id)));
  const asc = (a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0);
  const photos = mine.filter(e => e.type === 'photo' && e.data && e.data.photo).sort(asc).slice(-ADOPT_PHOTOS);
  const keepPhoto = new Set(photos.map(e => e.id));
  const list = mine.filter(e => e.type !== 'photo' || keepPhoto.has(e.id)).sort(asc)
    .map(e => ({ type: e.type, date: e.date, data: adoptCleanData(e.data), ...(e.id === g.avatarRef ? { avatar: true } : {}) }));
  let clutch = null;
  try {
    const row = clutchRows(inds, evs).find(r => r.babies.some(b => b.id === g.id));
    if (row) clutch = { mom: row.momName || '', dad: row.dadName || '', nth: row.nth || 0, layDate: row.e.date };
  } catch (e) {}
  return {
    v: ADOPT_V,
    sentAt: todayStr(),
    breeder: String(((DB.getSettings() || {}).breederName) || '').trim(),
    ind: {
      name: g.name || '', gender: g.gender || 'unknown', morph: String(g.morph || '').trim(),
      morphUnknown: !!g.morphUnknown, spots: g.spots || '', hatchDate: g.hatchDate || '',
      traits: Array.isArray(g.traits) ? g.traits.slice(0, 12) : [], traitNote: String(g.traitNote || '').slice(0, 200),
    },
    parents: { sire: par(g.sireId), dam: par(g.damId) },
    litter: littermatesOf(g, inds).map(x => x.name).filter(Boolean).slice(0, 20),
    clutch,
    events: list,
  };
}
/* 보따리 한눈에 — 보내는 쪽·받는 쪽 미리보기가 같이 씁니다 */
function adoptCounts(snap) {
  const c = {}; (snap.events || []).forEach(e => { c[e.type] = (c[e.type] || 0) + 1; });
  return [
    c.growth ? `몸무게 ${c.growth}번` : '', c.feeding ? `먹이 ${c.feeding}번` : '', c.shed ? `탈피 ${c.shed}번` : '',
    c.health ? `이상 기록 ${c.health}번` : '', c.photo ? `사진 ${c.photo}장` : '', c.memo ? `메모 ${c.memo}개` : '',
  ].filter(Boolean);
}
const adoptParentsText = (snap) => {
  const p = snap.parents || {};
  const t = (x) => x ? x.name + (x.morph ? ` (${x.morph})` : '') : '';
  return [p.sire ? '아빠 ' + t(p.sire) : '', p.dam ? '엄마 ' + t(p.dam) : ''].filter(Boolean).join(' × ');
};

/* 이 기기 표시 — 받다가 끊겼을 때 같은 기기면 다시 받을 수 있게 */
function adoptDeviceKey() {
  let k = '';
  try { k = localStorage.getItem('cg_dev_key') || ''; } catch (e) {}
  if (!k) { k = randomCode(16); STORE.set('cg_dev_key', k); }
  return k;
}
/* 추측할 수 없는 코드 — 공유 코드(6자리)와 달리 받아가는 링크라 길게 만듭니다 */
function randomCode(bytes) {
  const a = new Uint8Array(bytes || 16);
  (window.crypto || window.msCrypto).getRandomValues(a);
  let s = ''; a.forEach(b => { s += String.fromCharCode(b); });
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
const adoptUrl = (code) => `${location.origin}${String(location.pathname || '/').replace(/[^/]*$/, '')}?adopt=${encodeURIComponent(code)}`;

const ADOPT = {
  ready() { return SYNC.active(); },
  async rpc(fn, body, auth) {
    const res = await SYNC.api(`/rest/v1/rpc/${fn}`, { method: 'POST', body: JSON.stringify(body) }, !!auth);
    if (!res.ok) throw new Error(await SYNC.parseErr(res));
    return res.json();
  },
  /* 보내기 — 로그인한 브리더만 */
  async create(g, opt) {
    if (!this.ready()) throw new Error('입양 보내기는 서버 연결(로그인)이 필요해요');
    await SYNC.ensureSession();
    try { await PHOTO.flush(null, ADOPT_PHOTOS, PHOTO.era()); } catch (e) {}   // 폰에만 있던 사진을 먼저 서버로(보따리가 가볍게)
    const snap = adoptSnapshot(DB.getIndividuals().find(i => i.id === g.id) || g, opt);
    const code = randomCode(16);
    const expires = new Date(Date.now() + ADOPT_DAYS * 86400000).toISOString();
    const res = await SYNC.api(`/rest/v1/${ADOPT_TABLE}`, {
      method: 'POST', headers: { Prefer: 'return=minimal' },
      body: JSON.stringify([{ code, src_id: g.id, data: snap, expires_at: expires }]),
    });
    if (!res.ok) throw new Error(await SYNC.parseErr(res));
    const sent = [...(Array.isArray(g.adoptSent) ? g.adoptSent : []), { code, at: now(), expires }].slice(-5);
    DB.updateIndividual(g.id, { adoptSent: sent });
    return { code, url: adoptUrl(code), expires };
  },
  async status(code) {
    await SYNC.ensureSession();
    const res = await SYNC.api(`/rest/v1/${ADOPT_TABLE}?code=eq.${encodeURIComponent(code)}&select=claimed_at,revoked,expires_at`, { method: 'GET' });
    if (!res.ok) throw new Error(await SYNC.parseErr(res));
    const r = (await res.json())[0];
    if (!r) return 'none';
    if (r.revoked) return 'revoked';
    if (r.claimed_at) return 'claimed';
    if (new Date(r.expires_at) < new Date()) return 'expired';
    return 'waiting';
  },
  async revoke(code) {
    await SYNC.ensureSession();
    const r = await this.rpc('cg_adopt_revoke', { p_code: code }, true);
    return r && r.status === 'ok';
  },
  /* 받기 쪽 — 로그인 없이 */
  peek(code) { return this.rpc('cg_adopt_peek', { p_code: code }, false); },
  claim(code) { return this.rpc('cg_adopt_claim', { p_code: code, p_key: adoptDeviceKey() }, false); },
};

/* 이미 받은 아이 */
const adoptedFrom = (code) => DB.getIndividuals().find(i => i.adoptFrom && i.adoptFrom.code === code) || null;

/* 사진을 이 기기로 복사합니다(보낸 분이 사진을 지워도 남도록). 못 받아오면 주소 그대로 둡니다 */
async function adoptCopyPhoto(src) {
  if (!src || /^data:/.test(src)) return src;
  try {
    const ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const t = ctrl ? setTimeout(() => ctrl.abort(), 8000) : null;
    const blob = await (await fetch(src, ctrl ? { signal: ctrl.signal } : {})).blob();
    if (t) clearTimeout(t);
    if (!/^image\//.test(blob.type) || blob.size > 1500000) return src;
    return await new Promise((res) => { const r = new FileReader(); r.onload = () => res(String(r.result || src)); r.onerror = () => res(src); r.readAsDataURL(blob); });
  } catch (e) { return src; }
}

/* 받은 보따리를 새 개체로 들입니다 — 전부 되거나 전부 안 되거나 */
async function adoptImport(snap, code, opt) {
  const o = opt || {};
  const dup = adoptedFrom(code);
  if (dup) return { ok: true, ind: dup, again: true };
  if (!snap || !snap.ind || !snap.ind.name) return { ok: false, why: '받은 내용이 비어 있어요' };
  if (Number(snap.v || 0) > ADOPT_V) return { ok: false, why: '앱을 새 버전으로 업데이트한 뒤 다시 받아 주세요' };
  const name = String(o.name || snap.ind.name).trim();
  if (!name) return { ok: false, why: '이름을 적어 주세요' };
  if (DB.getIndividuals().some(i => i.name === name)) return { ok: false, why: '같은 이름의 아이가 이미 있어요. 이름을 바꿔 주세요', dupName: true };
  const evs = (snap.events || []).filter(e => e && ADOPT_KINDS.indexOf(e.type) >= 0 && /^\d{4}-\d{2}-\d{2}$/.test(String(e.date || '')));
  // 사진 복사(시간이 걸릴 수 있어 먼저)
  const copied = await Promise.all(evs.map(e => (e.type === 'photo' && e.data && e.data.photo) ? adoptCopyPhoto(e.data.photo) : Promise.resolve(null)));
  const p = snap.parents || {};
  const saved = DB.addIndividual({
    name, gender: snap.ind.gender || 'unknown', morph: snap.ind.morph || '', morphUnknown: !!snap.ind.morphUnknown,
    spots: snap.ind.spots || '', hatchDate: snap.ind.hatchDate || '',
    traits: Array.isArray(snap.ind.traits) ? snap.ind.traits : [], traitNote: snap.ind.traitNote || '',
    status: 'own', isFromCreGunseol: false, isExternal: false, sireId: null, damId: null,
    shareCode: newShareCode(),
    adoptFrom: {
      code, breeder: snap.breeder || '', origName: snap.ind.name, sentAt: snap.sentAt || '', at: todayStr(),
      parents: adoptParentsText(snap), sire: p.sire || null, dam: p.dam || null, clutch: snap.clutch || null, litter: snap.litter || [],
    },
  });
  if (!saved) return { ok: false, why: '저장하지 못했어요' };
  const list = evs.map((e, i) => ({
    individualId: saved.id, type: e.type, date: e.date,
    data: { ...adoptCleanData(e.data), ...(copied[i] ? { photo: copied[i] } : {}) },
    _avatar: !!e.avatar,
  }));
  list.push({ individualId: saved.id, type: 'memo', date: todayStr(), data: { notes: `🎁 ${snap.breeder ? snap.breeder + '에서' : ''} 입양 (기록 ${evs.length}건 함께 받음)`.replace('  ', ' ') } });
  const added = list.length ? DB.addEvents(list.map(({ _avatar, ...rest }) => rest)) : [];
  if (list.length && added.length !== list.length) {
    // 기록이 다 안 들어갔으면 들인 것을 전부 거둡니다(반쪽짜리가 남지 않게)
    const ids = new Set(added.map(e => e.id));
    DB.saveEvents(DB.getEvents().filter(e => !ids.has(e.id)));
    DB.saveIndividuals(DB.getIndividuals().filter(i => i.id !== saved.id));
    return { ok: false, why: '폰 저장 칸이 부족해 받지 못했어요. 설정에서 정리한 뒤 다시 눌러 주세요' };
  }
  const avIdx = list.findIndex(e => e._avatar);
  if (avIdx >= 0 && added[avIdx]) DB.updateIndividual(saved.id, { avatarRef: added[avIdx].id });
  return { ok: true, ind: DB.getIndividuals().find(i => i.id === saved.id) || saved };
}


const loadCard = () => loadScriptOnce('./card.min.js', 'CREG_CARD');

/* 분양 카드에 들어갈 글자 — 이 함수 하나에서만 정합니다(카드와 링크가 다른 말을 하지 않게) */
function saleCardData(g, opt) {
  const o = opt || {};
  const evs = DB.getEvents();
  const inds = DB.getIndividuals();
  const byId = {}; inds.forEach(i => { byId[i.id] = i; });
  const w = evs.filter(e => e.individualId === g.id && e.type === 'growth' && e.data && Number(e.data.weight) > 0)
    .sort((a, b) => (a.date < b.date ? 1 : -1))[0];
  const pName = (id, fallback) => { const p = byId[id]; return p ? (p.name + (p.morph ? ` (${String(p.morph).trim()})` : '')) : (fallback || ''); };
  const dot = (d) => d ? d.replace(/-/g, '.') : '';
  const price = o.price ? salePriceLabel(g) : '';
  return {
    photo: avatarSrc(g, evs) || '',
    name: g.name || '',
    morph: String(g.morph || '').trim(),
    gender: g.gender === 'female' ? '암컷' : g.gender === 'male' ? '수컷' : '미구분',
    hatch: dot(g.hatchDate || ''),
    weight: w ? String(Number(w.data.weight)) : '',
    weightDate: w ? dot(w.date).slice(5) : '',
    sire: pName(g.sireId, g.adoptFrom && g.adoptFrom.sire ? g.adoptFrom.sire.name + (g.adoptFrom.sire.morph ? ` (${g.adoptFrom.sire.morph})` : '') : ''),
    dam: pName(g.damId, g.adoptFrom && g.adoptFrom.dam ? g.adoptFrom.dam.name + (g.adoptFrom.dam.morph ? ` (${g.adoptFrom.dam.morph})` : '') : ''),
    breeder: o.noBreeder ? '' : String((DB.getSettings() || {}).breederName || '').trim(),
    badge: [o.badge || '', price].filter(Boolean).join(' · '),
    qrUrl: g.publicOn && g.shareCode ? publicUrl(g.shareCode) : '',
  };
}

/* 인스타·카톡 같은 앱 안 브라우저인지(여기서 받으면 크롬·사파리에서 안 보입니다) */
const inAppName = () => {
  try {
    const ua = navigator.userAgent || '';
    const L = [[/Instagram/i, '인스타'], [/KAKAOTALK/i, '카카오톡'], [/FBAN|FBAV|FB_IAB/, '페이스북'], [/Barcelona/, '스레드'],
      [/NAVER\(inapp/i, '네이버'], [/ Line\//, '라인'], [/DaumApps/, '다음'], [/BAND\//, '밴드']];
    const hit = L.find(([re]) => re.test(ua));
    return hit ? hit[1] : '';
  } catch (e) { return ''; }
};
const ADOPT_WHY = {
  none: '없는 링크예요. 주소가 잘렸는지 확인해 주세요.',
  revoked: '보낸 분이 취소한 링크예요. 보낸 분께 새 링크를 부탁해 주세요.',
  claimed: '이미 누군가 받아간 링크예요. 받은 적이 없다면 보낸 분께 새 링크를 부탁해 주세요.',
  expired: '7일이 지나 닫힌 링크예요. 보낸 분께 새 링크를 부탁해 주세요.',
  bad: '받지 못했어요. 잠시 뒤 다시 눌러 주세요.',
};
const fmtUntil = (iso) => { try { const d = new Date(iso); return `${d.getMonth() + 1}월 ${d.getDate()}일`; } catch (e) { return ''; } };

/* v1.9.21 입양 보내기 화면 (실험 — 대표님 폰에서만) */
function AdoptSendSheet({ gecko, onClose, showToast, navigate, refresh }) {
  const memos = useMemo(() => adoptMemos(gecko), [gecko.id]);
  const [skip, setSkip] = useState(() => memos.filter(m => m.flagged).map(m => m.id));
  const [busy, setBusy] = useState(false);
  const [made, setMade] = useState(null);           // { code, url, expires }
  const [state, setState] = useState('');           // waiting | claimed | revoked | expired | none
  const last = (Array.isArray(gecko.adoptSent) ? gecko.adoptSent : []).slice(-1)[0] || null;
  const snap = useMemo(() => adoptSnapshot(gecko, { skipMemo: skip }), [gecko.id, skip]);
  const counts = adoptCounts(snap);
  useEffect(() => {
    if (!last || !ADOPT.ready()) return;
    let live = true;
    ADOPT.status(last.code).then(st => { if (live) { setState(st); if (st === 'waiting') setMade({ code: last.code, url: adoptUrl(last.code), expires: last.expires }); } }).catch(() => {});
    return () => { live = false; };
  }, []);
  const make = async () => {
    setBusy(true);
    try { const r = await ADOPT.create(gecko, { skipMemo: skip }); setMade(r); setState('waiting'); refresh && refresh(); }
    catch (e) { showToast((e && e.message) || '링크를 만들지 못했어요'); }
    setBusy(false);
  };
  const cancel = async () => {
    if (!made) return;
    setBusy(true);
    try { const ok = await ADOPT.revoke(made.code); if (ok) { setState('revoked'); setMade(null); showToast('링크를 취소했어요. 이제 안 열려요'); } else { setState(await ADOPT.status(made.code)); showToast('이미 받아갔거나 취소할 수 없는 링크예요'); } }
    catch (e) { showToast((e && e.message) || '취소하지 못했어요'); }
    setBusy(false);
  };
  const copy = () => { try { navigator.clipboard.writeText(made.url); showToast('링크를 복사했어요 📋'); } catch (e) { showToast('주소를 길게 눌러 복사해 주세요'); } };
  const shareLink = async () => {
    try { if (navigator.share) { await navigator.share({ title: `${gecko.name} 입양 기록`, text: `${gecko.name}의 기록을 브리딩비서로 받아 주세요 (7일 안에)`, url: made.url }); return; } } catch (e) { if (e && e.name === 'AbortError') return; }
    copy();
  };
  const markSold = () => {
    DB.recordSale(gecko.id, {});
    refresh && refresh();
    showToast(`🤝 ${gecko.name} 분양완료로 바꿨어요`);
    onClose();
  };
  if (!ADOPT.ready()) return (
    <div className="pe-bg" onClick={onClose} data-testid="adopt-send">
      <div className="pe-sheet" onClick={e => e.stopPropagation()}>
        <div className="pe-head"><b>🎁 입양 보내기</b><button onClick={onClose} aria-label="닫기">×</button></div>
        <div className="pe-body">
          <p style={{fontSize:13.5, lineHeight:1.6}}>입양 보내기는 서버 연결(로그인)이 필요해요. 받는 분은 로그인 없이 받을 수 있어요.</p>
          <button className="btn btn-primary" onClick={() => { onClose(); navigate('settings'); }}>설정에서 로그인하기</button>
        </div>
      </div>
    </div>
  );
  return (
    <div className="pe-bg" onClick={onClose} data-testid="adopt-send">
      <div className="pe-sheet" onClick={e => e.stopPropagation()}>
        <div className="pe-head"><b>🎁 {gecko.name} 입양 보내기</b><button onClick={onClose} aria-label="닫기">×</button></div>
        <div className="pe-body">
          {state === 'claimed' ? (
            <div data-testid="adopt-claimed">
              <p style={{fontSize:14, lineHeight:1.6}}>✅ 입양자가 <b>{gecko.name}</b>의 기록을 받아갔어요.</p>
              {(gecko.status || 'own') !== 'sold' && <button className="btn btn-primary" onClick={markSold} data-testid="adopt-mark-sold">🤝 분양완료로 바꾸기</button>}
              <button className="btn btn-ghost" style={{marginTop:8}} onClick={() => { setState(''); setMade(null); }}>다른 분께 새 링크 만들기</button>
            </div>
          ) : made ? (
            <div data-testid="adopt-made">
              <p style={{fontSize:13.5, lineHeight:1.6, margin:'0 0 8px'}}>이 링크를 입양자에게 보내 주세요. <b>{fmtUntil(made.expires)}까지</b>, <b>한 번만</b> 받을 수 있어요.</p>
              <div className="share-code" data-testid="adopt-url" style={{fontSize:11.5, wordBreak:'break-all', lineHeight:1.55, textAlign:'left', padding:'9px 11px', letterSpacing:0, fontWeight:600}}>{made.url}</div>
              <div style={{display:'flex', gap:6, marginTop:8}}>
                <button className="btn btn-primary btn-sm" style={{flex:1}} onClick={shareLink} data-testid="adopt-share">📤 보내기</button>
                <button className="btn btn-secondary btn-sm" style={{flex:1}} onClick={copy} data-testid="adopt-copy">📋 복사</button>
              </div>
              <div style={{fontSize:12, color:'var(--text3)', margin:'10px 0 6px'}}>{state === 'waiting' ? '아직 안 받아갔어요.' : ''} 받아가면 여기서 분양완료로 바꿀 수 있어요.</div>
              <button className="btn btn-ghost btn-sm" disabled={busy} onClick={cancel} data-testid="adopt-revoke">링크 취소하기</button>
            </div>
          ) : (
            <>
              {state === 'expired' && <div className="sn-facts">지난번 링크는 7일이 지나 닫혔어요. 새로 만들어 주세요.</div>}
              {state === 'revoked' && <div className="sn-facts">지난번 링크는 취소됐어요.</div>}
              <div className="sn-h">넘어가는 것</div>
              <div style={{fontSize:13, lineHeight:1.7, color:'var(--text2)', marginBottom:8}} data-testid="adopt-includes">
                이름·성별·모프·해칭일{snap.parents.sire || snap.parents.dam ? '·부모' : ''}{snap.litter.length ? '·동배' : ''}{snap.breeder ? `·브리더 이름(${snap.breeder})` : ''}<br />
                {counts.length ? counts.join(' · ') : '기록은 아직 없어요'}
              </div>
              <div className="sn-h">안 넘어가는 것</div>
              <div style={{fontSize:12.5, color:'var(--text3)', marginBottom:10}}>분양가·입양가, 가계부, 분양 기록, 입양자 연락처, 다른 아이 기록</div>
              {memos.length > 0 && (
                <div className="sn-sec"><div className="sn-h">메모 고르기 ({memos.length - skip.length}/{memos.length}개 넘김)</div>
                  {memos.some(m => m.flagged) && <div className="sn-facts">돈·연락처가 있는 것 같은 메모는 미리 빼 두었어요. 넣으려면 체크해 주세요.</div>}
                  {memos.map(m => (
                    <label key={m.id} className="adopt-memo" data-testid={'adopt-memo-' + m.id}>
                      <input type="checkbox" checked={skip.indexOf(m.id) < 0} onChange={e => setSkip(x => e.target.checked ? x.filter(i => i !== m.id) : [...x, m.id])} />
                      <span><small>{fmtDateShort(m.date)}{m.flagged ? ' · 확인 필요' : ''}</small>{m.text}</span>
                    </label>
                  ))}
                </div>
              )}
              <button className="btn btn-primary" disabled={busy} onClick={make} data-testid="adopt-make">{busy ? '만드는 중이에요…' : '🔗 입양 링크 만들기 (7일)'}</button>
              <div style={{fontSize:11.5, color:'var(--text3)', marginTop:8, lineHeight:1.55}}>지금 기록의 복사본이 넘어가요. 링크를 만든 뒤에 고친 기록은 넘어가지 않아요. {gecko.name}의 기록은 여기 그대로 남아요.</div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* v1.9.21 입양 받기 화면 — 링크(?adopt=코드)로 들어온 분. 로그인 없이 받습니다 */
function AdoptReceive({ code, onDone, navigate, refreshIndividuals }) {
  const [st, setSt] = useState('loading');   // loading | ok | none | revoked | claimed | expired | error | done | dup
  const [data, setData] = useState(null);
  const [expires, setExpires] = useState('');
  const [name, setName] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [got, setGot] = useState(null);
  const inapp = inAppName();
  const [inappOk, setInappOk] = useState(false);
  useEffect(() => {
    const dup = adoptedFrom(code);
    if (dup) { setGot(dup); setSt('dup'); return; }
    ADOPT.peek(code).then(r => {
      if (r && r.status === 'ok') { setData(r.data); setName((r.data && r.data.ind && r.data.ind.name) || ''); setExpires(r.expires_at || ''); setSt('ok'); }
      else setSt((r && r.status) || 'error');
    }).catch(() => setSt('error'));
  }, [code]);
  const take = async () => {
    setErr(''); setBusy(true);
    try {
      const nm = name.trim();
      if (!nm) { setErr('이름을 적어 주세요'); setBusy(false); return; }
      if (DB.getIndividuals().some(i => i.name === nm)) { setErr('같은 이름의 아이가 이미 있어요. 이름을 바꿔 주세요'); setBusy(false); return; }
      const r = await ADOPT.claim(code);
      if (!r || r.status !== 'ok') { setSt((r && r.status) || 'error'); setBusy(false); return; }
      const res = await adoptImport(r.data, code, { name: nm });
      if (!res.ok) { setErr(res.why || '받지 못했어요'); setBusy(false); return; }
      try { TRACK.step('adopt_in'); } catch (e) {}
      refreshIndividuals && refreshIndividuals();
      setGot(res.ind); setSt('done');
    } catch (e) { setErr('인터넷 연결을 확인하고 다시 눌러 주세요'); }
    setBusy(false);
  };
  const close = (go) => {
    try { history.replaceState(null, '', location.pathname); } catch (e) {}
    onDone && onDone();
    if (go && got) navigate('profile', { gecko: got });
  };
  const snap = data || {};
  const photo = (snap.events || []).filter(e => e.type === 'photo' && e.data && e.data.photo).map(e => e.data.photo);
  const avatar = ((snap.events || []).find(e => e.avatar && e.data && e.data.photo) || {}).data;
  const cover = (avatar && avatar.photo) || photo[photo.length - 1] || '';
  return (
    <div className="onb" data-testid="adopt-receive" data-state={st}>
      <div className="onb-card">
        {st === 'loading' && <><div className="onb-done">🎁</div><p>입양 기록을 불러오는 중이에요…</p></>}
        {(st === 'none' || st === 'revoked' || st === 'claimed' || st === 'expired' || st === 'error' || st === 'bad') && (
          <>
            <div className="onb-done">📭</div>
            <h2>받을 수 없는 링크예요</h2>
            <p data-testid="adopt-why">{ADOPT_WHY[st] || '불러오지 못했어요. 인터넷 연결을 확인한 뒤 다시 열어 주세요.'}</p>
            <button className="onb-main" onClick={() => close(false)}>앱 시작하기</button>
          </>
        )}
        {st === 'dup' && got && (
          <>
            <div className="onb-done">✅</div>
            <h2>이미 받은 아이예요</h2>
            <p>{got.name}의 기록은 이 폰에 이미 있어요.</p>
            <button className="onb-main" onClick={() => close(true)} data-testid="adopt-open-profile">{got.name} 보러 가기</button>
          </>
        )}
        {st === 'ok' && (
          <>
            <div className="adopt-cover">{cover ? <img src={cover} alt="" /> : <span>🦎</span>}</div>
            <h2>{snap.breeder ? `${snap.breeder}에서 ` : ''}보낸 아이예요</h2>
            <div className="adopt-info" data-testid="adopt-preview">
              <b>{snap.ind && snap.ind.name}</b>
              <span>{[snap.ind && snap.ind.morph, snap.ind && (snap.ind.gender === 'female' ? '암컷' : snap.ind.gender === 'male' ? '수컷' : '미구분'), snap.ind && snap.ind.hatchDate ? snap.ind.hatchDate.replace(/-/g, '.') + ' 해칭' : ''].filter(Boolean).join(' · ')}</span>
              {adoptParentsText(snap) && <span>{adoptParentsText(snap)}</span>}
              <small>{adoptCounts(snap).join(' · ') || '기본 정보'} 함께 받아요</small>
            </div>
            <label className="adopt-name">우리 집에서 부를 이름
              <input className="onb-input" maxLength={20} value={name} onChange={e => { setErr(''); setName(e.target.value); }} data-testid="adopt-name" />
            </label>
            {err && <div className="onb-err" data-testid="adopt-err">{err}</div>}
            {inapp && !inappOk ? (
              <>
                <p className="onb-warn">지금 {inapp} 안에서 열려 있어요. 여기서 받으면 {TRACK.device() === 'ios' ? '사파리' : '크롬'}·앱에서는 안 보이고, 링크는 한 번만 받을 수 있어요. <b>주소를 복사해 {TRACK.device() === 'ios' ? '사파리' : '크롬'}에서 열어 주세요.</b></p>
                <button className="onb-main" onClick={() => { try { navigator.clipboard.writeText(location.href); } catch (e) {} }} data-testid="adopt-copy-link">주소 복사하기</button>
                <button className="onb-sub" onClick={() => setInappOk(true)}>그래도 여기서 받을게요</button>
              </>
            ) : (
              <button className="onb-main" disabled={busy} onClick={take} data-testid="adopt-take">{busy ? '받는 중이에요…' : '🎁 내 아이로 받기'}</button>
            )}
            {expires && <p style={{fontSize:12, color:'var(--text3)', marginTop:10}}>{fmtUntil(expires)}까지 받을 수 있어요 · 로그인 없이 받아요</p>}
            <button className="onb-skip" onClick={() => close(false)}>나중에 받을게요</button>
          </>
        )}
        {st === 'done' && got && (
          <>
            <div className="onb-done">🎉</div>
            <h2>{got.name}, 우리 식구가 됐어요!</h2>
            <p>보내 주신 기록이 함께 들어왔어요. 이제부터는 여기에 이어서 적으시면 돼요.</p>
            {!SYNC.loggedIn() && <p className="onb-warn">폰을 바꾸거나 앱을 지워도 남도록 설정에서 로그인(서버 연결)해 두시길 권해요.</p>}
            <button className="onb-main" onClick={() => close(true)} data-testid="adopt-open-profile">{got.name} 보러 가기</button>
          </>
        )}
      </div>
    </div>
  );
}

/* v1.9.21 분양 카드 화면 — B 사진 중심형(대표님 결정) */
function SaleCardSheet({ gecko, onClose, showToast, onMakeShare }) {
  const st = gecko.status || 'own';
  const [badge, setBadge] = useState(st === 'available' ? '분양 중' : st === 'reserved' ? '예약 중' : '');
  const [price, setPrice] = useState(false);
  const [breeder, setBreeder] = useState(() => String((DB.getSettings() || {}).breederName || '').trim());
  const [noBreeder, setNoBreeder] = useState(false);
  const [nameAsk, setNameAsk] = useState('');
  const [img, setImg] = useState('');
  const [busy, setBusy] = useState(true);
  const [note, setNote] = useState('');
  const hasPrice = !!salePriceLabel(gecko);
  const needName = !breeder && !noBreeder;
  useEffect(() => {
    if (needName) { setBusy(false); return; }
    let live = true;
    setBusy(true);
    loadCard().then(C => C.draw(saleCardData(gecko, { badge, price, noBreeder })))
      .then(({ canvas, photoOk }) => {
        if (!live) return;
        setImg(canvas.toDataURL('image/png'));
        setNote(photoOk ? '' : (avatarSrc(gecko) ? '사진을 불러오지 못해 사진 없이 만들었어요' : '사진이 없어 배경으로 채웠어요. 프로필에서 사진을 넣으면 카드에 들어가요'));
        setBusy(false);
      })
      .catch(() => { if (live) { setBusy(false); setNote('카드를 만들지 못했어요. 인터넷 연결을 확인해 주세요'); } });
    return () => { live = false; };
  }, [badge, price, breeder, noBreeder, gecko.publicOn]);
  const fileName = `${gecko.name || 'gecko'}_분양카드.png`;
  const share = async () => {
    try {
      const blob = await (await fetch(img)).blob();
      const file = new File([blob], fileName, { type: 'image/png' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: gecko.name }); return; }
    } catch (e) { if (e && e.name === 'AbortError') return; }
    showToast('이 기기에서는 바로 공유가 안 돼요. [이미지 저장]을 눌러 주세요');
  };
  return (
    <div className="pe-bg" onClick={onClose} data-testid="sale-card">
      <div className="pe-sheet" onClick={e => e.stopPropagation()}>
        <div className="pe-head"><b>🖼 {gecko.name} 분양 카드</b><button onClick={onClose} aria-label="닫기">×</button></div>
        <div className="pe-body">
          {needName ? (
            <div data-testid="card-name-ask">
              <div style={{fontSize:13.5, lineHeight:1.6, marginBottom:8}}>카드 맨 위에 들어갈 <b>브리더 이름</b>을 정해 주세요.<br /><span style={{color:'var(--text3)', fontSize:12}}>설정의 브리더 이름으로 저장되고, 공유 페이지에도 같이 쓰여요.</span></div>
              <input className="input" placeholder="예: 크레건설" maxLength={20} value={nameAsk} onChange={e => setNameAsk(e.target.value)} data-testid="card-breeder" />
              <div style={{display:'flex', gap:6, marginTop:8}}>
                <button className="btn btn-primary btn-sm" style={{flex:1}} data-testid="card-breeder-save" onClick={() => {
                  const v = nameAsk.trim(); if (!v) return showToast('이름을 적어 주세요');
                  DB.saveSettings({ ...DB.getSettings(), breederName: v }); setBreeder(v);
                }}>이 이름으로 만들기</button>
                <button className="btn btn-secondary btn-sm" style={{flex:1}} data-testid="card-no-breeder" onClick={() => setNoBreeder(true)}>이름 없이 만들기</button>
              </div>
            </div>
          ) : (
            <>
              <div className="card-prev">{busy ? <div className="card-wait">카드를 만드는 중이에요…</div> : img ? <img src={img} alt={gecko.name + ' 분양 카드'} data-testid="card-img" /> : null}</div>
              {note && <div style={{fontSize:12, color:'var(--text3)', margin:'6px 0'}}>{note}</div>}
              <div className="sn-h" style={{marginTop:10}}>오른쪽 위 표시</div>
              <div className="sn-dirs">{['분양 중', '예약 중', ''].map(b => (
                <button key={b || 'none'} className={badge === b ? 'on' : ''} onClick={() => setBadge(b)} data-testid={'card-badge-' + (b || 'none')}>{b || '없음'}</button>
              ))}</div>
              {hasPrice && (
                <label style={{display:'flex', alignItems:'center', gap:8, fontSize:13, margin:'4px 0 8px'}}>
                  <input type="checkbox" checked={price} onChange={e => setPrice(e.target.checked)} data-testid="card-price" /> 분양가 넣기 ({salePriceLabel(gecko)})
                </label>
              )}
              {!gecko.publicOn && (
                <div style={{fontSize:12.5, color:'var(--text2)', background:'var(--bg2)', borderRadius:10, padding:'8px 10px', margin:'4px 0 8px', lineHeight:1.55}}>
                  공유 링크를 켜면 카드에 성장 기록 QR이 들어가요.
                  {onMakeShare && <button className="onb-link" style={{marginLeft:6}} data-testid="card-make-share" onClick={onMakeShare}>공유 링크 켜기</button>}
                </div>
              )}
              <div style={{display:'flex', gap:6, marginTop:8}}>
                <a className="btn btn-primary btn-sm" style={{flex:1, textAlign:'center', textDecoration:'none', pointerEvents: img ? 'auto' : 'none', opacity: img ? 1 : .5}}
                  href={img || undefined} download={fileName} data-testid="card-save">⬇️ 이미지 저장</a>
                <button className="btn btn-secondary btn-sm" style={{flex:1}} disabled={!img} onClick={share} data-testid="card-share">📤 공유하기</button>
              </div>
              {breeder && !noBreeder && <div style={{fontSize:11.5, color:'var(--text3)', marginTop:8}}>맨 위 이름은 설정의 브리더 이름({breeder})이에요.</div>}
            </>
          )}
        </div>
      </div>
    </div>
  );
}


/* v1.9.21 개체 시즌 노트 화면 — 숫자는 앱이, 판단은 브리더가 */
function SeasonNoteSheet({ gecko, year: y0, onClose, navigate, showToast, refreshIndividuals }) {
  const years = useMemo(() => seasonYears(gecko), [gecko.id]);
  const [year, setYear] = useState(y0 && years.indexOf(y0) >= 0 ? y0 : (years[0] || String(new Date().getFullYear())));
  const [ver, setVer] = useState(0);
  const g = DB.getIndividuals().find(i => i.id === gecko.id) || gecko;
  const st = useMemo(() => seasonNoteStats(g, year), [g.id, year, ver]);
  const saved = seasonNoteOf(g, year);
  const [note, setNote] = useState(saved);
  const [openKid, setOpenKid] = useState(null);
  useEffect(() => { setNote(seasonNoteOf(DB.getIndividuals().find(i => i.id === gecko.id) || gecko, year)); }, [year]);
  const auto = seasonSummaryText(g, st, note);
  const put = (k, v) => setNote(n => ({ ...n, [k]: v }));
  const save = () => {
    saveSeasonNote(g.id, year, { dir: note.dir || '', good: note.good || '', bad: note.bad || '', memo: note.memo || '', summary: note.summary || '' });
    refreshIndividuals && refreshIndividuals();
    showToast && showToast(`📒 ${g.name} ${year} 시즌 노트를 저장했어요`);
    onClose && onClose();
  };
  const tile = (label, val, sub, tid) => (
    <div className="sn-tile" data-testid={tid}><span>{label}</span><b>{val}</b>{sub ? <small>{sub}</small> : null}</div>
  );
  const firstUnknown = st.rows.find(r => !(parseInt(r.eggs, 10) > 0));
  return (
    <div className="pe-bg" onClick={onClose} data-testid="season-note">
      <div className="pe-sheet" onClick={e => e.stopPropagation()}>
        <div className="pe-head"><b>📒 {g.name} 시즌 노트</b><button onClick={onClose} aria-label="닫기">×</button></div>
        <div className="pe-body">
          {years.length > 1 && (
            <div className="sn-years">{years.map(y => <button key={y} className={y === year ? 'on' : ''} onClick={() => setYear(y)} data-testid={'sn-year-' + y}>{y}</button>)}</div>
          )}
          {!st.clutches && !st.kids.length ? (
            <div className="sn-empty">{year}년에는 {g.gender === 'male' ? '이 아이가 아빠인 산란' : '산란'} 기록이 없어요.</div>
          ) : (
            <>
              <div className="sn-grid">
                {tile('산란', `${st.clutches}번`, st.gap ? `평균 ${st.gap}일 간격` : '', 'sn-clutches')}
                {tile('알', `${st.eggs}개${st.unknownEggs ? '+' : ''}`, st.unknownEggs ? `빈 곳 ${st.unknownEggs}번` : '', 'sn-eggs')}
                {tile('부화', `${st.hatched}마리`, st.rate != null ? `부화율 ${st.rate}%${st.unknownEggs ? ' (대략)' : ''}` : '', 'sn-hatched')}
                {tile('무정란 · 문제 · 대기', `${st.infertile} · ${st.problem} · ${st.pending}`, '', 'sn-other')}
                {st.incubation ? tile('부화 기간', `${st.incubation}일`, '우리 집 평균', 'sn-inc') : null}
                {st.weight ? tile('몸무게', `${st.weight.from}→${st.weight.to}g`, `${st.weight.pct > 0 ? '+' : ''}${st.weight.pct}%`, 'sn-weight') : null}
              </div>
              {st.facts.length > 0 && <div className="sn-facts">{st.facts.map((f, i) => <div key={i}>• {f}</div>)}</div>}
              {firstUnknown && navigate && (
                <button className="btn btn-secondary btn-sm" style={{width:'100%', marginBottom:10}} data-testid="sn-fill-eggs"
                  onClick={() => { onClose(); navigate('clutch', { layingId: firstUnknown.e.id, editEggs: true }); }}>🥚 빈 알 개수 채우기</button>
              )}
              {st.pairs.length > 0 && (
                <div className="sn-sec"><div className="sn-h">{st.male ? '암컷별' : '짝별'} 결과</div>
                  {st.pairs.map(p => <div key={p.mate} className="sn-pair"><span>{p.mate}</span><span>산란 {p.clutches} · 알 {p.eggs} · 부화 {p.hatched}</span></div>)}
                </div>
              )}
              <div className="sn-sec"><div className="sn-h">이번 시즌 아이들 {st.kids.length ? `(${st.kids.length})` : ''}</div>
                {!st.kids.length && <div className="sn-empty small">아직 등록된 아기가 없어요.</div>}
                {st.kids.map(k => {
                  const cur = DB.getIndividuals().find(i => i.id === k.id) || k;
                  const tags = Array.isArray(cur.traits) ? cur.traits : [];
                  const open = openKid === k.id;
                  return (
                    <div key={k.id} className="sn-kid" data-testid={'sn-kid-' + k.name}>
                      <button className="sn-kid-top" onClick={() => setOpenKid(open ? null : k.id)}>
                        <b>{k.name}</b><span>{[k.morph, k.gender === 'female' ? '암' : k.gender === 'male' ? '수' : '미구분', k.status === 'sold' ? '분양' : ''].filter(Boolean).join(' · ')}</span>
                        <i>{tags.length ? tags.join(' · ') : '특징 적기 ›'}</i>
                      </button>
                      {open && (
                        <div className="sn-kid-body">
                          <div className="sn-tags">{SEASON_TRAITS.map(t => (
                            <button key={t} className={tags.indexOf(t) >= 0 ? 'on' : ''} data-testid={'sn-tag-' + t}
                              onClick={() => { toggleTrait(k.id, t); setVer(v => v + 1); }}>{t}</button>
                          ))}</div>
                          <input className="input" placeholder="한 줄 메모 (예: 등 무늬가 진하게 올라옴)" defaultValue={cur.traitNote || ''}
                            onBlur={e => { DB.updateIndividual(k.id, { traitNote: e.target.value.trim() }); setVer(v => v + 1); }} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
          <div className="sn-sec"><div className="sn-h">다음 시즌</div>
            <div className="sn-dirs">{SEASON_DIRS.map(d => (
              <button key={d.key} className={note.dir === d.key ? 'on' : ''} data-testid={'sn-dir-' + d.key} onClick={() => put('dir', note.dir === d.key ? '' : d.key)}>{d.label}</button>
            ))}</div>
            <textarea className="input sn-ta" placeholder="좋았던 점" value={note.good || ''} onChange={e => put('good', e.target.value)} data-testid="sn-good" />
            <textarea className="input sn-ta" placeholder="아쉬운 점" value={note.bad || ''} onChange={e => put('bad', e.target.value)} data-testid="sn-bad" />
            <textarea className="input sn-ta" placeholder="브리딩 방향 메모 (예: 릴리 라인으로, 크레스트 좋은 수컷과)" value={note.memo || ''} onChange={e => put('memo', e.target.value)} data-testid="sn-memo" />
          </div>
          <div className="sn-sec"><div className="sn-h">한 줄 요약</div>
            <textarea className="input sn-ta" value={note.summary != null && note.summary !== '' ? note.summary : auto} onChange={e => put('summary', e.target.value)} data-testid="sn-summary" />
            {note.summary && note.summary !== auto && <button className="btn btn-ghost btn-sm" onClick={() => put('summary', '')}>자동 요약으로 되돌리기</button>}
          </div>
          <button className="btn btn-primary" onClick={save} data-testid="sn-save">저장</button>
        </div>
      </div>
    </div>
  );
}


/* v1.9.22 개체 직접 추가 (대표님 2026-10-05: "개체 등록도 수기로 할 수 있게, 축양 화면 검색란 옆에")
   대화로 등록하던 것과 같은 개체 한 마리를 만듭니다(DB.addIndividual 한 곳). 같은 이름·비속어는 막습니다. */
const ADD_MORPHS = ['노말', '할리퀸', '핀스트라이프', '달마시안', '릴리화이트', '트라이컬러'];
function AddGeckoSheet({ onClose, navigate, showToast, refreshIndividuals }) {
  const all = DB.getIndividuals();
  const [v, setV] = useState({ name: '', gender: 'unknown', morph: '', hatchDate: '', status: 'own', sireId: '', damId: '', mine: false, source: '', price: '' });
  const [photo, setPhoto] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const fileRef = useRef(null);
  const put = (k, val) => { setErr(''); setV(x => ({ ...x, [k]: val })); };
  const byName = (a, b) => (a.name || '').localeCompare(b.name || '', 'ko');
  const males = all.filter(i => i.gender !== 'female').sort(byName);
  const females = all.filter(i => i.gender !== 'male').sort(byName);
  const save = (open) => {
    const nm = v.name.trim();
    if (!nm) return setErr('이름을 적어 주세요');
    if (nm.length > 20) return setErr('이름은 20자까지 적을 수 있어요');
    if (isBadName(nm)) return setErr('예쁜 이름으로 다시 적어 주세요 🙂');
    if (all.some(i => i.name === nm)) return setErr(`"${nm}"는 이미 있는 이름이에요`);
    if (v.hatchDate && v.hatchDate > todayStr()) return setErr('아직 오지 않은 날짜예요');
    if (v.sireId && v.sireId === v.damId) return setErr('아빠와 엄마를 같은 아이로 고를 수 없어요');
    const price = String(v.price || '').replace(/,/g, '').trim();
    if (price && !/^\d+(\.\d+)?$/.test(price)) return setErr('입양가는 숫자(만원)로 적어 주세요');
    setBusy(true);
    try {
      const saved = DB.addIndividual({
        name: nm, gender: v.gender, morph: v.morph.trim(), hatchDate: v.hatchDate || '', status: v.status,
        isFromCreGunseol: !!v.mine, isExternal: false, sireId: v.sireId || null, damId: v.damId || null,
        shareCode: newShareCode(),
      });
      if (photo) DB.addEvent({ individualId: saved.id, type: 'photo', date: todayStr(), data: { photo } });
      if (v.source.trim() || price) setAdoptMemo(saved.id, v.source.trim(), price);
      refreshIndividuals && refreshIndividuals();
      showToast && showToast(`🦎 ${nm}, 우리 식구가 됐어요!`);
      onClose && onClose();
      if (open && navigate) navigate('profile', { gecko: DB.getIndividuals().find(i => i.id === saved.id) || saved });
    } catch (e) { setErr('저장하지 못했어요. 한 번 더 눌러 주세요'); }
    setBusy(false);
  };
  const G = [['female', '♀ 암컷'], ['male', '♂ 수컷'], ['unknown', '미구분']];
  const S = [['own', '보유중'], ['available', '분양가능'], ['reserved', '예약중']];
  return (
    <div className="pe-bg" onClick={onClose} data-testid="add-gecko">
      <div className="pe-sheet" onClick={e => e.stopPropagation()}>
        <div className="pe-head"><b>🦎 개체 추가</b><button onClick={onClose} aria-label="닫기">×</button></div>
        <div className="pe-body">
          <label className="pe-row"><span>이름 *</span><input className="input" autoFocus maxLength={20} placeholder="예: 크범이" value={v.name} onChange={e => put('name', e.target.value)} data-testid="add-name" /></label>
          <div className="pe-row"><span>성별</span>
            <div className="pe-seg">{G.map(([k, l]) => <button key={k} className={v.gender === k ? 'on' : ''} onClick={() => put('gender', k)} data-testid={'add-g-' + k}>{l}</button>)}</div>
          </div>
          <label className="pe-row"><span>모프</span><input className="input" placeholder="예: 릴리화이트" value={v.morph} onChange={e => put('morph', e.target.value)} data-testid="add-morph" /></label>
          <div className="sn-dirs" style={{marginLeft:68, marginTop:-4}}>{ADD_MORPHS.map(m => <button key={m} className={v.morph === m ? 'on' : ''} onClick={() => put('morph', v.morph === m ? '' : m)}>{m}</button>)}</div>
          <label className="pe-row"><span>해칭일</span><input className="input" type="date" max={todayStr()} value={v.hatchDate} onChange={e => put('hatchDate', e.target.value)} data-testid="add-hatch" /></label>
          <div className="pe-row"><span>상태</span>
            <div className="pe-seg">{S.map(([k, l]) => <button key={k} className={v.status === k ? 'on' : ''} onClick={() => put('status', k)} data-testid={'add-s-' + k}>{l}</button>)}</div>
          </div>
          <label className="pe-row"><span>아빠</span>
            <select className="input" value={v.sireId} onChange={e => put('sireId', e.target.value)} data-testid="add-sire">
              <option value="">없음 · 모름</option>{males.map(i => <option key={i.id} value={i.id}>{i.name}{i.gender === 'male' ? ' (수)' : ''}</option>)}
            </select></label>
          <label className="pe-row"><span>엄마</span>
            <select className="input" value={v.damId} onChange={e => put('damId', e.target.value)} data-testid="add-dam">
              <option value="">없음 · 모름</option>{females.map(i => <option key={i.id} value={i.id}>{i.name}{i.gender === 'female' ? ' (암)' : ''}</option>)}
            </select></label>
          <label style={{display:'flex', alignItems:'center', gap:8, fontSize:13.5}}>
            <input type="checkbox" checked={v.mine} onChange={e => put('mine', e.target.checked)} data-testid="add-mine" /> 우리 집에서 태어난 아이(MY)
          </label>
          {!v.mine && (
            <>
              <label className="pe-row"><span>데려온 곳</span><input className="input" placeholder="선택 · 예: OO브리더" value={v.source} onChange={e => put('source', e.target.value)} /></label>
              <label className="pe-row"><span>입양가</span><input className="input" inputMode="decimal" placeholder="선택 · 만원" value={v.price} onChange={e => put('price', e.target.value)} /></label>
            </>
          )}
          <div className="pe-row"><span>사진</span>
            <input ref={fileRef} type="file" accept="image/*" style={{display:'none'}} data-testid="add-file"
              onChange={e => { const f = e.target.files && e.target.files[0]; if (!f) return; setBusy(true); takePhoto(f, (src) => { setPhoto(src); setBusy(false); }); }} />
            {photo ? <img src={photo} alt="" style={{width:56, height:56, borderRadius:'50%', objectFit:'cover'}} /> : null}
            <button className="btn btn-secondary btn-sm" style={{width:'auto'}} disabled={busy} onClick={() => fileRef.current && fileRef.current.click()}>{photo ? '바꾸기' : '📷 고르기 (선택)'}</button>
          </div>
          {err && <div className="onb-err" style={{textAlign:'left'}} data-testid="add-err">{err}</div>}
          <div style={{display:'flex', gap:6, marginTop:4}}>
            <button className="btn btn-primary" style={{flex:1}} disabled={busy} onClick={() => save(false)} data-testid="add-save">등록하기</button>
            <button className="btn btn-secondary" style={{flex:1}} disabled={busy} onClick={() => save(true)} data-testid="add-save-open">등록 후 프로필</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* 대화에서 온 부탁 — planAppChat 이 알아들은 것을 여기서 처리합니다(화면과 같은 함수) */
function chat(p, ctx) {
  const { bot, refreshIndividuals } = ctx;
  const g = p.g;
  if (p.kind === 'card' || p.kind === 'adoptSend') {
    const card = p.kind === 'card';
    if (!LABS.on()) {
      bot(`${card ? '🖼 분양 카드' : '🎁 입양 보내기'}는 곧 열려요. 지금은 공유 링크로 ${g.name}의 기록을 보여줄 수 있어요.`,
        [{ label: '🔗 공유 화면 열기', kind: 'go', value: { name: 'profile', geckoId: g.id, openShare: true } }]);
      return;
    }
    bot(card ? `🖼 ${g.name} 분양 카드를 만들어 드릴게요. 사진·모프·부모·QR이 한 장에 들어가요.` : `🎁 ${g.name} 입양 링크를 만들 수 있어요. 무엇이 넘어가는지 먼저 보여 드릴게요.`,
      [{ label: card ? '🖼 분양 카드 열기' : '🎁 입양 보내기 열기', kind: 'go', value: { name: 'profile', geckoId: g.id, [card ? 'openCard' : 'openAdopt']: true } }]);
    return;
  }
  if (p.kind === 'note') {
    const ys = seasonYears(g);
    if (!ys.length) { bot(`${eunneun(g.name)} 아직 산란·메이팅 기록이 없어 시즌 노트가 비어 있어요 🙂`); return; }
    const y = p.year && ys.indexOf(p.year) >= 0 ? p.year : ys[0];
    bot(`📒 ${seasonSummaryText(g, seasonNoteStats(g, y), seasonNoteOf(g, y))}`, [{ label: '📒 시즌 노트 열기', kind: 'go', value: { name: 'profile', geckoId: g.id, openNote: true, noteYear: y } }]);
    return;
  }
  if (p.kind === 'noteDir') {
    const y = seasonYears(g)[0] || String(new Date().getFullYear());
    saveSeasonNote(g.id, y, { dir: p.dir });
    refreshIndividuals();
    bot(`📒 ${g.name} 다음 시즌은 "${seasonDirLabel(p.dir)}"로 시즌 노트(${y})에 적어 뒀어요.`, [{ label: '📒 시즌 노트 열기', kind: 'go', value: { name: 'profile', geckoId: g.id, openNote: true, noteYear: y } }]);
    return;
  }
  if (p.kind === 'trait') {
    const list = toggleTrait(g.id, p.tag, p.on);
    refreshIndividuals();
    bot(p.on ? `🏷️ ${g.name}에 "${p.tag}" 특징을 달았어요. (지금: ${list.join(' · ')})\n부모 시즌 노트에도 같이 보여요.` : `${g.name}의 "${p.tag}" 특징을 뺐어요.`);
  }
}

window.CREG_EXTRAS = {
  SeasonNoteSheet, SaleCardSheet, AdoptSendSheet, AdoptReceive, AddGeckoSheet, chat,
  // 시험(node)에서 쓰는 순수 함수들
  seasonYears, seasonNoteStats, seasonSummaryText, saveSeasonNote, toggleTrait, SEASON_TRAITS, SEASON_DIRS,
  adoptSnapshot, adoptMemos, adoptImport, adoptCounts, looksPrivate, ADOPT, ADOPT_KINDS, ADOPT_NEVER, saleCardData,
};
})();
