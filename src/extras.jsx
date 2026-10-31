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
    st.textContent = `.onb { position: fixed; inset: 0; z-index: 1000; background: var(--bg); display: flex; align-items: flex-start; justify-content: center; overflow-y: auto; padding: calc(28px + var(--safe-top)) 18px calc(24px + var(--safe-bottom)); } .onb-card { position: relative; width: 100%; max-width: 420px; display: flex; flex-direction: column; align-items: stretch; text-align: center; padding-top: 18px; } .onb-card h2 { font-size: 23px; line-height: 1.38; margin: 18px 0 8px; color: var(--text); word-break: keep-all; } .onb-card p { font-size: 14.5px; line-height: 1.6; color: var(--text2); margin: 0 0 14px; word-break: keep-all; } .onb-hero { align-self: center; margin-top: 18px; } .onb-bar { height: 5px; border-radius: 3px; background: var(--border); overflow: hidden; margin: 0 34px 0 44px; } .onb-bar i { display: block; height: 100%; background: var(--accent); border-radius: 3px; transition: width .25s; } .onb-back { position: absolute; left: -4px; top: 2px; background: none; border: none; font-size: 30px; line-height: 1; color: var(--text3); cursor: pointer; padding: 0 8px; } .onb-input { width: 100%; font-size: 19px; padding: 14px 16px; border-radius: 14px; border: 1.5px solid var(--border); background: var(--card); color: var(--text); margin: 8px 0 4px; text-align: center; } .onb-input:focus { outline: none; border-color: var(--accent); } .onb-err { color: var(--accent2); font-size: 13px; margin: 4px 0; } .onb-main { margin-top: 18px; background: var(--accent); color: var(--on-accent); border: none; border-radius: 16px; padding: 16px; font-size: 17px; font-weight: 800; cursor: pointer; } .onb-main:disabled { opacity: .55; } .onb-sub { margin-top: 12px; background: none; border: none; color: var(--text2); font-size: 14px; text-decoration: underline; cursor: pointer; padding: 6px; } .onb-sub.strong { color: var(--accent2); font-weight: 700; } .onb-skip { margin-top: 26px; align-self: center; background: none; border: none; color: var(--text3); font-size: 12.5px; text-decoration: underline; cursor: pointer; padding: 6px 10px; } .onb-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-top: 10px; } .onb-grid.two { grid-template-columns: repeat(2, 1fr); } .onb-opt { background: var(--card); border: 1.5px solid var(--border); border-radius: 14px; padding: 15px 6px; font-size: 15px; font-weight: 700; color: var(--text); cursor: pointer; word-break: keep-all; } .onb-opt.on { border-color: var(--accent); background: var(--accent-soft); color: var(--accent2); } .onb-or { font-size: 12.5px; color: var(--text3); margin-top: 14px; } .onb-done { font-size: 48px; margin-top: 18px; } .onb-say { background: var(--card); border: 1px solid var(--border); border-radius: 14px; padding: 12px; font-size: 15px; line-height: 1.8; color: var(--accent2); font-weight: 700; } .onb-warn { font-size: 12.5px !important; color: var(--accent2) !important; background: var(--accent-soft); border-radius: 10px; padding: 8px 10px; margin-top: 12px !important; text-align: left; } .onb-link { background: none; border: none; color: var(--accent2); text-decoration: underline; font-weight: 700; padding: 0; cursor: pointer; font-size: inherit; } .sn-years { display: flex; gap: 6px; margin-bottom: 10px; flex-wrap: wrap; } .sn-years button, .sn-dirs button, .sn-tags button { border: 1px solid var(--border); background: var(--card); color: var(--text2); border-radius: 16px; padding: 6px 12px; font-size: 13px; font-weight: 600; cursor: pointer; } .sn-years button.on, .sn-dirs button.on, .sn-tags button.on { border-color: var(--accent); background: var(--accent-soft); color: var(--accent2); } .sn-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; margin-bottom: 10px; } .sn-tile { background: var(--bg2); border-radius: 12px; padding: 9px 11px; display: flex; flex-direction: column; text-align: left; } .sn-tile span { font-size: 11.5px; color: var(--text3); } .sn-tile b { font-size: 18px; color: var(--text); margin-top: 2px; } .sn-tile small { font-size: 11.5px; color: var(--text2); } .sn-facts { background: var(--accent-soft); color: var(--accent2); border-radius: 10px; padding: 8px 10px; font-size: 12.5px; line-height: 1.6; margin-bottom: 10px; } .sn-sec { margin: 6px 0 12px; } .sn-h { font-size: 13px; font-weight: 800; margin-bottom: 6px; color: var(--text); } .sn-pair { display: flex; justify-content: space-between; font-size: 13px; padding: 5px 2px; border-bottom: 1px solid var(--border); color: var(--text2); } .sn-kid { border: 1px solid var(--border); border-radius: 12px; margin-bottom: 6px; overflow: hidden; } .sn-kid-top { width: 100%; background: none; border: none; text-align: left; padding: 9px 11px; display: flex; flex-wrap: wrap; gap: 2px 8px; align-items: baseline; cursor: pointer; color: var(--text); } .sn-kid-top b { font-size: 14px; } .sn-kid-top span { font-size: 12px; color: var(--text3); } .sn-kid-top i { font-style: normal; font-size: 12px; color: var(--accent2); width: 100%; } .sn-kid-body { padding: 0 11px 10px; } .sn-tags, .sn-dirs { display: flex; flex-wrap: wrap; gap: 5px; margin-bottom: 8px; } .sn-ta { min-height: 54px; margin-bottom: 6px; resize: vertical; font-size: 13.5px; } .sn-empty { font-size: 13px; color: var(--text3); padding: 10px 0; } .sn-empty.small { padding: 2px 0 6px; } .card-prev { border-radius: 14px; overflow: hidden; background: var(--bg2); aspect-ratio: 1 / 1; display: flex; align-items: center; justify-content: center; } .card-prev img { width: 100%; height: 100%; display: block; } .card-wait { font-size: 13px; color: var(--text3); } .adopt-cover { width: 180px; height: 180px; border-radius: 50%; overflow: hidden; align-self: center; margin-top: 14px; background: var(--bg2); display: flex; align-items: center; justify-content: center; font-size: 60px; border: 4px solid var(--accent-soft); } .adopt-cover img { width: 100%; height: 100%; object-fit: cover; } .adopt-info { display: flex; flex-direction: column; gap: 3px; background: var(--card); border: 1px solid var(--border); border-radius: 14px; padding: 12px; margin: 4px 0 12px; } .adopt-info b { font-size: 22px; } .adopt-info span { font-size: 13.5px; color: var(--text2); } .adopt-info small { font-size: 12.5px; color: var(--accent2); margin-top: 4px; } .adopt-name { display: block; text-align: left; font-size: 12.5px; color: var(--text3); } .adopt-memo { display: flex; gap: 8px; align-items: flex-start; font-size: 13px; padding: 7px 0; border-bottom: 1px solid var(--border); text-align: left; } .adopt-memo span { flex: 1; line-height: 1.5; word-break: break-all; } .adopt-memo small { display: block; font-size: 11px; color: var(--text3); } .bday-bg { position: fixed; inset: 0; z-index: 950; background: rgba(24,16,13,.5); display: flex; align-items: center; justify-content: center; padding: 20px; } .bday-card { width: 100%; max-width: 360px; background: var(--card); border-radius: 24px; padding: 22px 20px 14px; text-align: center; box-shadow: 0 12px 36px rgba(0,0,0,.2); display: flex; flex-direction: column; align-items: center; } .bday-hero { width: 104px; height: 104px; image-rendering: pixelated; } .bday-pics { position: relative; display: flex; justify-content: center; margin: 2px 0 6px; } .bday-pic { width: 132px; height: 132px; border-radius: 50%; object-fit: cover; background: var(--bg2); border: 4px solid var(--card); box-shadow: 0 0 0 3px var(--gold-edge), 0 6px 16px rgba(0,0,0,.14); } .bday-pics.many .bday-pic { width: 96px; height: 96px; margin: 0 -9px; } .bday-mini { position: absolute; width: 50px; height: 50px; left: calc(50% + 34px); bottom: -6px; image-rendering: pixelated; filter: drop-shadow(0 2px 3px rgba(0,0,0,.2)); } .bday-card h2 { font-size: 21px; line-height: 1.4; margin: 8px 0 4px; color: var(--text); word-break: keep-all; } .bday-ages { font-size: 13.5px; color: var(--accent2); font-weight: 700; margin-bottom: 6px; word-break: keep-all; } .bday-say { font-size: 15.5px; line-height: 1.6; color: var(--text2); margin: 4px 0 16px; word-break: keep-all; } .bday-card .btn { width: 100%; margin-bottom: 8px; } .bday-off { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--text3); margin-top: 6px; cursor: pointer; } .fb-card { margin: 10px 16px 0; padding: 14px 14px 12px; border: 1.5px solid var(--accent-edge); background: var(--card); } .fb-top { display: flex; align-items: center; gap: 8px; } .fb-top img { width: 46px; height: 46px; flex-shrink: 0; image-rendering: pixelated; } .fb-top b { font-size: 15.5px; line-height: 1.4; color: var(--text); word-break: keep-all; } .fb-say { font-size: 13.5px; line-height: 1.6; color: var(--text2); margin: 8px 0 10px; word-break: keep-all; } .fb-say span { color: var(--text3); font-size: 12px; } .fb-picks { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 10px; } .fb-pick { border: 1.5px solid var(--border); background: var(--bg2); color: var(--text2); border-radius: 18px; padding: 8px 12px; font-size: 13px; font-weight: 600; cursor: pointer; } .fb-pick.on { border-color: var(--accent); background: var(--accent-soft); color: var(--accent2); font-weight: 800; } .fb-text { text-align: left; letter-spacing: normal; width: 100%; min-height: 64px; resize: vertical; font-size: 13.5px; line-height: 1.5; } .fb-note { font-size: 11.5px; color: var(--text3); margin: 6px 0 2px; line-height: 1.5; word-break: keep-all; } .fb-err { font-size: 12.5px; color: var(--accent2); margin-top: 6px; } .fb-later { font-size: 13px; line-height: 1.65; color: var(--text2); background: var(--accent-soft); border-radius: 10px; padding: 9px 11px; word-break: keep-all; } .fb-later b { color: var(--accent2); } .fb-row { display: flex; gap: 8px; margin-top: 10px; } .fb-row > * { flex: 1; width: auto; display: flex; align-items: center; justify-content: center; text-decoration: none; } .fb-inbox-top { width: 100%; display: flex; justify-content: space-between; align-items: center; background: none; border: none; padding: 0; cursor: pointer; color: var(--text); font-size: 13.5px; } .fb-inbox-top span { font-size: 12.5px; color: var(--text3); } .fb-tally { font-size: 12px; color: var(--accent2); background: var(--accent-soft); border-radius: 8px; padding: 6px 9px; margin-bottom: 8px; line-height: 1.6; } .fb-item { border-top: 1px solid var(--border); padding: 8px 0; } .fb-meta { font-size: 11px; color: var(--text3); } .fb-tags { font-size: 12.5px; color: var(--accent2); font-weight: 700; margin-top: 3px; } .fb-msg { font-size: 13.5px; color: var(--text); margin-top: 3px; line-height: 1.55; white-space: pre-wrap; word-break: break-all; }`;
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


/* ══════════════════════════════════════════
   v1.9.28 생일 축하 팝업 — 생일날 홈을 열면 하루 한 번 (대표님 2026-10-14)
   ★ 멘트는 여러 개 중에서 고릅니다. 같은 날엔 같은 멘트(날짜+이름으로 고름) — 다시 열어도 바뀌지 않게.
   ★ "앞으로 띄우지 않기"는 설정의 생일 팝업 켜기와 같은 값(bdayPopupOff)입니다. 브리핑 맨 위 생일 문구는 그대로 나옵니다.
   ══════════════════════════════════════════ */
const BDAY_LINES = [
  '오늘은 특식 어떨까요? 🍽️',
  '좋아하는 먹이로 한 끼 차려 주세요.',
  '생일 기념 사진 한 장 남겨 두는 건 어떨까요? 📸',
  '1년 동안 얼마나 컸는지, 오늘 몸무게를 재 봐도 좋아요. ⚖️',
  '한 해 동안 건강하게 자라 줘서 고마운 날이에요.',
  '사육장을 한 번 깨끗하게 정리해 주고, 상쾌하게 생일을 보내게 해 주세요. 🌿',
  '오늘은 평소보다 조금 더 오래 눈 맞춰 주세요.',
  '앞으로도 지금처럼 건강하게! 🎉',
];
function bdayPick(list, day) {
  const key = (day || todayStr()) + list.map(b => b.g.name).join('');
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) % 100003;
  return BDAY_LINES[h % BDAY_LINES.length];
}
function BirthdayPopup({ list, navigate, showToast, onClose }) {
  const [off, setOff] = useState(false);
  const [bad, setBad] = useState({});   // 못 불러온 사진(서버 사진인데 오프라인 등) — 그 아이는 빼고, 다 빠지면 크한이
  const one = list.length === 1 ? list[0] : null;
  /* v1.9.29 등록해 둔 사진이 있으면 그 아이 사진을 띄웁니다(대표 사진 → 프로필 사진 → 첫 사진, 앱 카드와 같은 순서). 여러 마리면 3장까지 겹쳐서 */
  const pics = list.map(b => ({ b, src: avatarSrc(b.g) })).filter(x => x.src && !bad[x.b.g.id]).slice(0, 3);
  const close = (go) => {
    STORE.set('cg_bday_seen', todayStr());
    if (off) {
      DB.saveSettings({ ...(DB.getSettings() || {}), bdayPopupOff: true });
      showToast && showToast('생일 팝업을 껐어요. 설정에서 다시 켤 수 있어요');
    }
    onClose && onClose();
    if (go && one && navigate) navigate('profile', { gecko: one.g });
  };
  return (
    <div className="bday-bg" data-testid="bday-pop" onClick={() => close()}>
      <div className="bday-card" onClick={e => e.stopPropagation()}>
        {pics.length ? (
          <div className={'bday-pics' + (pics.length > 1 ? ' many' : '')} data-testid="bday-pics">
            {pics.map(x => <img key={x.b.g.id} className="bday-pic" src={x.src} alt={x.b.g.name} onError={() => setBad(v => ({ ...v, [x.b.g.id]: 1 }))} />)}
            {pics.length === 1 && <img className="bday-mini" src="./assets/brand/gecko-transparent.webp" alt="" />}
          </div>
        ) : <img className="bday-hero" src="./assets/brand/gecko-transparent.webp" alt="" />}
        <h2>{one ? `🎂 ${one.g.name} ${one.age}살 생일이에요!` : `🎂 오늘 생일인 아이가 ${list.length}마리예요!`}</h2>
        {!one && <div className="bday-ages">{list.map(b => `${b.g.name} ${b.age}살`).join(' · ')}</div>}
        <div className="bday-say" data-testid="bday-say">{bdayPick(list)}</div>
        <button className="btn btn-primary" data-testid="bday-ok" onClick={() => close()}>축하해요 🎉</button>
        {one && <button className="btn btn-secondary" data-testid="bday-go" onClick={() => close(true)}>⚖️ 생일 기록 남기기</button>}
        <label className="bday-off"><input type="checkbox" checked={off} onChange={e => setOff(e.target.checked)} data-testid="bday-off" /> 앞으로 생일 팝업 띄우지 않기</label>
      </div>
    </div>
  );
}

/* v1.9.28 설정 · 중복 개체 정리 카드 — app.min.js 에서 옮겨 왔습니다(같은 이름이 있을 때만 불러옴) */
function DupMergeCard({ showToast, refreshIndividuals }) {
  const [ver, setVer] = useState(0);
  const [choice, setChoice] = useState({});
  const [busy, setBusy] = useState(false);
  const groups = DB.findDuplicateNames();
  if (!groups.length) return null;

  // 정보가 더 알찬 쪽을 기본 선택 (채워진 항목 수 → 기록 수 순)
  const score = (i) => ['gender', 'morph', 'spots', 'hatchDate', 'avatar'].filter(k => {
    const v = i[k]; return v && v !== 'unknown';
  }).length;
  const best = (items) => [...items].sort((a, b) =>
    score(b) - score(a) || DB.getEventsFor(b.id).length - DB.getEventsFor(a.id).length)[0];

  const summary = (i) => {
    const bits = [];
    bits.push(genderLabel(i.gender));
    if (i.morph) bits.push(i.morph);
    bits.push(i.hatchDate ? fmtDate(i.hatchDate) + ' 출생' : '출생일 없음');
    if ((i.status || 'own') !== 'own') bits.push(STATUS[i.status].label);
    return bits.join(' · ');
  };

  const mergeOne = (g) => {
    const keep = choice[g.name] || best(g.items).id;
    g.items.forEach(i => { if (i.id !== keep) DB.mergeIndividuals(keep, i.id, 'keep'); });
    return g.items.length - 1;
  };

  const doOne = (g) => {
    setBusy(true);
    const n = mergeOne(g);
    refreshIndividuals(); setVer(v => v + 1); setBusy(false);
    showToast(`✅ ${g.name} 합쳤어요 (${n}건 정리)`);
  };

  const doAll = () => {
    setBusy(true);
    let n = 0;
    groups.forEach(g => { n += mergeOne(g); });
    refreshIndividuals(); setVer(v => v + 1); setBusy(false);
    showToast(`✅ 중복 ${n}건 정리 완료`);
  };

  return (
    <div className="card" style={{margin:0, border:'1px solid var(--accent-dim)'}}>
      <div style={{fontSize:13, fontWeight:700, marginBottom:4, color:'var(--accent2)'}}>
        🔀 같은 이름 개체 {groups.length}건
      </div>
      <div style={{fontSize:12, color:'var(--text3)', lineHeight:1.6, marginBottom:10}}>
        기기마다 따로 등록돼서 같은 아이가 둘로 나뉘었어요.<br/>
        <b>어느 정보를 쓸지만 고르시면 됩니다. 기록과 사진은 전부 합쳐져요.</b>
      </div>

      {groups.map(g => {
        const sel = choice[g.name] || best(g.items).id;
        const total = g.items.reduce((s, i) => s + DB.getEventsFor(i.id).length, 0);
        return (
          <div key={g.name} style={{background:'var(--bg3)', borderRadius:10, padding:12, marginBottom:10}}>
            <div style={{fontSize:14, fontWeight:700, marginBottom:8}}>🦎 {g.name}</div>
            <div style={{display:'flex', flexDirection:'column', gap:6}}>
              {g.items.map(i => (
                <button key={i.id}
                  className={`option-btn ${sel === i.id ? 'selected' : ''}`}
                  style={{textAlign:'left', fontSize:12, lineHeight:1.5}}
                  onClick={() => setChoice(c => ({ ...c, [g.name]: i.id }))}>
                  {sel === i.id ? '◉ ' : '○ '}{summary(i)}
                  <span style={{color:'var(--text3)'}}> · 기록 {DB.getEventsFor(i.id).length}건</span>
                </button>
              ))}
            </div>
            <div style={{fontSize:11, color:'var(--text3)', margin:'8px 0 8px'}}>
              → 기록 {total}건은 어느 쪽을 고르셔도 전부 남습니다
            </div>
            <button className="btn btn-primary btn-sm" disabled={busy} onClick={() => doOne(g)}>합치기</button>
          </div>
        );
      })}

      {groups.length > 1 && (
        <button className="btn btn-secondary" disabled={busy} onClick={doAll}>
          전부 합치기 ({groups.length}건)
        </button>
      )}
    </div>
  );
}


/* ══════════════════════════════════════════
   v1.9.33 의견 한 줄 — 대표님 요청(2026-10-22)
   쓰시는 분 연락처가 없어서, 앱을 몇 번 열어 본 분께 홈에서 딱 한 번 여쭙니다.
   ★ [보내기] 와 [안 보낼게요] 둘 다 있습니다. 안 보내셔도 아무것도 서버에 가지 않습니다.
   ★ 두 경우 모두 "써 주셔서 감사합니다"를 꼭 넣고, 나중에라도 설정의 오픈채팅으로 건의할 수 있다고 알립니다.
   ★ 이름·이메일·연락처는 받지 않습니다. 보내는 것: 고른 버튼 · 적은 글 · 기기 종류 · 몇 번째 방문 · 아이 수 · 앱 버전.
   ★ 표(cg_feedback)는 넣기만 되고, 읽기는 대표님 계정만 됩니다(supabase_feedback.sql).
   ══════════════════════════════════════════ */
const FB_PICKS = [
  { key: 'easy', label: '기록이 편해요' },
  { key: 'alarm', label: '알림이 도움돼요' },
  { key: 'hard', label: '쓰는 법이 어려워요' },
  { key: 'missing', label: '필요한 기능이 없어요' },
  { key: 'bug', label: '오류·느림이 있어요' },
  { key: 'unsure', label: '아직 잘 모르겠어요' },
];
const FB_MAX = 500;
const fbLabel = (k) => (FB_PICKS.find(p => p.key === k) || {}).label || k;
/* 보낼 내용 — 고른 것도 적은 것도 없으면 null (보내기 버튼이 꺼집니다) */
function fbPayload(picks, msg) {
  const p = FB_PICKS.map(x => x.key).filter(k => (picks || []).indexOf(k) >= 0);
  const m = String(msg || '').trim().slice(0, FB_MAX);
  if (!p.length && !m) return null;
  let visit = 0, animals = 0;
  try { visit = parseInt(localStorage.getItem('cg_visit_no') || '0', 10) || 0; } catch (e) {}
  try { animals = DB.getIndividuals().filter(isHere).length; } catch (e) {}
  return { picks: p, msg: m, device: TRACK.device(), standalone: TRACK.standalone(), visit_no: visit, animals, app: APP_VERSION };
}
const fbChat = () => { try { return (contactLinks(DB.getSettings()).find(l => l.key === 'chat') || {}).url || ''; } catch (e) { return ''; } };

function FeedbackCard({ onClose }) {
  const [picks, setPicks] = useState([]);
  const [msg, setMsg] = useState('');
  const [mode, setMode] = useState('ask');   // ask | sent | skip
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const body = fbPayload(picks, msg);
  const done = (m) => { try { STORE.set('cg_fb', m + ':' + todayStr()); } catch (e) {} setMode(m); };
  const toggle = (k) => setPicks(v => v.indexOf(k) >= 0 ? v.filter(x => x !== k) : v.concat(k));
  const send = async () => {
    if (!body || busy) return;
    setBusy(true); setErr('');
    try {
      const res = await SYNC.api('/rest/v1/cg_feedback', { method: 'POST', headers: { Prefer: 'return=minimal' }, body: JSON.stringify(body) }, false);
      if (!res.ok) throw new Error(String(res.status));
      done('sent');
    } catch (e) {
      setErr('전송이 안 됐어요. 인터넷 연결을 확인하고 한 번 더 눌러 주세요.');
    }
    setBusy(false);
  };
  const chat = fbChat();
  const after = (
    <>
      <div className="fb-later" data-testid="fb-later">
        나중에라도 불편한 점이나 바라는 기능이 생기면 <b>설정 › 💬 문의·건의 오픈채팅</b>으로 언제든 보내 주세요. 꼭 참고할게요!
      </div>
      <div className="fb-row">
        {chat && <a className="btn btn-secondary btn-sm" href={chat} target="_blank" rel="noopener noreferrer" data-testid="fb-chat">💬 오픈채팅 열기</a>}
        <button className="btn btn-primary btn-sm" data-testid="fb-close" onClick={() => onClose && onClose()}>닫기</button>
      </div>
    </>
  );
  if (mode === 'sent') return (
    <div className="card fb-card" data-testid="fb-sent">
      <div className="fb-top"><img src="./assets/brand/gecko-transparent.webp" alt="" width="46" height="46" /><b>보내 주셔서 정말 감사합니다!</b></div>
      <div className="fb-say">브리딩비서를 써 주시는 것만으로도 큰 힘이 돼요. 한 줄 한 줄 꼼꼼히 읽고 더 편한 앱으로 만들어 볼게요.</div>
      {after}
    </div>
  );
  if (mode === 'skip') return (
    <div className="card fb-card" data-testid="fb-skipped">
      <div className="fb-top"><img src="./assets/brand/gecko-transparent.webp" alt="" width="46" height="46" /><b>괜찮아요! 써 주셔서 정말 감사합니다</b></div>
      <div className="fb-say">브리딩비서를 아껴 써 주셔서 늘 고마워요.</div>
      {after}
    </div>
  );
  return (
    <div className="card fb-card" data-testid="fb-card">
      <div className="fb-top"><img src="./assets/brand/gecko-transparent.webp" alt="" width="46" height="46" /><b>브리딩비서를 써 주셔서 감사해요</b></div>
      <div className="fb-say">만든 사람이 직접 하나하나 읽어요. 써 보시니 어떠셨는지 잠깐만 들려주시겠어요? <span>(여러 개 골라도 돼요)</span></div>
      <div className="fb-picks">
        {FB_PICKS.map(p => (
          <button key={p.key} className={'fb-pick' + (picks.indexOf(p.key) >= 0 ? ' on' : '')} data-testid={'fb-pick-' + p.key} onClick={() => toggle(p.key)}>{p.label}</button>
        ))}
      </div>
      <textarea className="input fb-text" data-testid="fb-text" maxLength={FB_MAX} rows={3} value={msg} onChange={e => setMsg(e.target.value)}
        placeholder="불편한 점이나 있었으면 하는 기능을 적어 주세요 (안 적으셔도 돼요)" />
      <div className="fb-note">이름·연락처는 받지 않아요. 답장이 필요하시면 설정의 오픈채팅으로 말씀해 주세요.</div>
      {err && <div className="fb-err" role="alert">{err}</div>}
      <div className="fb-row">
        <button className="btn btn-secondary btn-sm" data-testid="fb-skip" disabled={busy} onClick={() => done('skip')}>안 보낼게요</button>
        <button className="btn btn-primary btn-sm" data-testid="fb-send" disabled={!body || busy} onClick={send}>{busy ? '보내는 중…' : '보내기'}</button>
      </div>
    </div>
  );
}

/* 대표님 설정 화면 — 받은 의견 보기 (대표님 계정만 읽을 수 있습니다) */
function FeedbackInbox() {
  const [rows, setRows] = useState(null);
  const [open, setOpen] = useState(false);
  const [err, setErr] = useState('');
  const load = async () => {
    setErr('');
    try {
      await SYNC.ensureSession();
      const res = await SYNC.api('/rest/v1/cg_feedback?select=at,day,picks,msg,device,standalone,visit_no,animals,app&order=at.desc&limit=200');
      if (!res.ok) throw new Error(String(res.status));
      setRows(await res.json());
    } catch (e) { setErr('받은 의견을 불러오지 못했어요. (' + (e.message || '') + ')'); }
  };
  useEffect(() => { load(); }, []);
  const dev = { ios: '아이폰', android: '안드로이드', pc: 'PC' };
  const tally = {};
  (rows || []).forEach(r => (r.picks || []).forEach(k => { tally[k] = (tally[k] || 0) + 1; }));
  return (
    <div className="card fb-inbox" style={{margin:0}} data-testid="fb-inbox">
      <button className="fb-inbox-top" onClick={() => setOpen(o => !o)}>
        <b>📮 받은 의견</b><span>{rows ? rows.length + '건' : (err ? '' : '불러오는 중…')} {open ? '▲' : '▼'}</span>
      </button>
      {err && <div className="fb-err">{err} <button className="onb-link" onClick={load}>다시</button></div>}
      {open && rows && (
        <div style={{marginTop:8}}>
          {!rows.length && <div className="fb-note">아직 받은 의견이 없어요.</div>}
          {rows.length > 0 && <div className="fb-tally">{FB_PICKS.filter(p => tally[p.key]).map(p => p.label + ' ' + tally[p.key]).join(' · ')}</div>}
          {rows.map((r, i) => (
            <div key={i} className="fb-item">
              <div className="fb-meta">{r.day || String(r.at || '').slice(0, 10)} · {dev[r.device] || r.device || '?'}{r.standalone ? '(앱)' : ''} · {r.visit_no}번째 방문 · 아이 {r.animals}마리 · v{r.app}</div>
              {(r.picks || []).length > 0 && <div className="fb-tags">{r.picks.map(fbLabel).join(' · ')}</div>}
              {r.msg && <div className="fb-msg">{r.msg}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


/* ══════════════════════════════════════════
   v1.9.34 모프누락명령 — 대표님 요청(2026-10-22)
   대화창에 "모프누락명령"이라고 치면 모프가 빈 아이를 한 마리씩 소개하고 모프를 받아 바로 적습니다.
   ★ 대상: 곁에 있는 아이(isHere — 보유중·분양가능·예약중). 분양 간 아이·떠난 아이는 묻지 않습니다.
   ★ 순서: 태어난 날(없으면 데려온 날 → 등록한 날)이 오래된 아이부터.
   ★ 답: 적으신 글자 그대로 저장(띄어쓰기도 그대로). "모름/넘어가" 비워 두고 다음 · "그만" 멈춤 · "취소" 방금 것 되돌리고 다시 묻기.
   ★ 소개 문구는 기록에 있는 것만 말합니다(부모·몇 차 해칭·부화일·데려온 날·데려온 곳). 없는 건 지어내지 않습니다.
   ★ 진행 상태는 이 조각 안(MF)에만 둡니다. "그만" 뒤에 다시 치면 그때 빈 아이부터 새로 셉니다.
   ══════════════════════════════════════════ */
const MF = { ids: [], i: 0, done: 0, skip: 0, last: null };
const MF_CMD = /모프\s*누락\s*명령/;
/* 이름 끝이 숫자면 읽는 소리로 받침을 봅니다 (Ch24 → 사 → 예요, 크은1 → 일 → 이에요) */
const mfYeyo = (w) => { const t = String(w || '').trim(), d = t.slice(-1); return /\d/.test(d) ? t + ('013678'.indexOf(d) >= 0 ? '이에요' : '예요') : iyeyo(t); };
const mfDate = (d) => /^\d{4}-\d\d-\d\d/.test(d || '') ? d.slice(2, 4) + '.' + d.slice(5, 7) + '.' + d.slice(8, 10) : '';
/* 데려온 날·곳 — 입양 받기(adoptFrom) → 입양처/입양가 메모(날짜를 아는 것만) → 가계부 '개체 구입' 순 */
function mfCame(g, evs) {
  const src = (() => { try { return splitMemo(g.id).source || ''; } catch (e) { return ''; } })() || (g.adoptFrom && g.adoptFrom.breeder) || '';
  let at = (g.adoptFrom && g.adoptFrom.at) || '';
  if (!at) { const m = evs.find(e => e.individualId === g.id && e.type === 'memo' && e.data && e.data.dated && /입양(처|가)/.test(e.data.notes || '')); if (m) at = m.date; }
  if (!at) { const l = evs.find(e => e.type === 'ledger' && e.data && e.data.indId === g.id && e.data.flow !== 'in'); if (l) at = l.date; }
  return { src: String(src).trim(), at };
}
function mfList() {
  const evs = DB.getEvents();
  const key = (g) => g.hatchDate || mfCame(g, evs).at || String(g.createdAt || '').slice(0, 10) || '9999';
  return DB.getIndividuals().filter(g => isHere(g) && !String(g.morph || '').trim())
    .sort((a, b) => (key(a) < key(b) ? -1 : key(a) > key(b) ? 1 : 0)).map(g => g.id);
}
/* 한 마리 소개 — 기록에 있는 것만 */
function mfIntro(g, k) {
  const inds = DB.getIndividuals(), evs = DB.getEvents(), byId = {};
  inds.forEach(i => { byId[i.id] = i; });
  const L = [`${k + 1}번 아이는 ${mfYeyo(g.name)}.`];
  const row = (() => { try { return clutchRows(inds, evs).find(r => r.babies.some(b => b.id === g.id)); } catch (e) { return null; } })();
  const mom = byId[g.damId], dad = byId[g.sireId];
  if (row) L.push(`${row.pairName} ${row.nth}차 해칭 아이이고`);
  else if (mom || dad) L.push(`${[mom && mom.name, dad && dad.name].filter(Boolean).join(' × ')} 사이에서 나온 아이이고`);
  const born = mfDate(g.hatchDate);
  const mine = (row || mom || dad);
  const came = mine ? { src: '', at: '' } : mfCame(g, evs);
  if (born) L.push(`${born}에 태어난 아이예요.`);
  if (came.at || came.src) L.push(`${came.at ? mfDate(came.at) + '에 ' : ''}${came.src ? came.src + '에서 ' : ''}데려왔어요.`);
  else if (!born && !mine && g.createdAt) L.push(`${mfDate(String(g.createdAt).slice(0, 10))}에 등록한 아이예요.`);
  if (L.length > 1 && /이고$/.test(L[L.length - 1])) L[L.length - 1] = L[L.length - 1].replace(/ 아이이고$/, ' 아이예요.');
  L.push('모프가 무엇인가요?');
  return L.join('\n');
}
function mfAsk(bot) {
  const all = DB.getIndividuals();
  while (MF.i < MF.ids.length) {
    const g = all.find(x => x.id === MF.ids[MF.i]);
    if (g && isHere(g) && !String(g.morph || '').trim()) { bot(mfIntro(g, MF.i)); return true; }
    MF.i++;   // 그 사이 지워졌거나 다른 데서 모프를 채운 아이는 건너뜁니다
  }
  const n = MF.ids.length;
  bot(`🎉 ${n}마리 모두 끝났어요! 모프를 채운 아이 ${MF.done}마리${MF.skip ? `, 비워 둔 아이 ${MF.skip}마리` : ''}.` + (MF.skip ? '\n비워 둔 아이는 다음에 "모프누락명령"이라고 하시면 다시 여쭐게요.' : ''));
  return false;
}
/* 돌려주는 값: 아직 묻는 중이면 true (app 이 다음 말을 다시 이리로 보냅니다) */
function morphFill(text, ctx) {
  const { bot, refreshIndividuals } = ctx;
  const t = String(text || '').trim();
  if (MF_CMD.test(t) || !MF.ids.length) {
    MF.ids = mfList(); MF.i = 0; MF.done = 0; MF.skip = 0; MF.last = null;
    if (!MF.ids.length) { bot('모프가 비어 있는 아이가 없어요 🙂 모두 채워져 있어요.'); return false; }
    bot(`모프가 비어 있는 아이는 총 ${MF.ids.length}마리예요.\n1번 아이부터 모프를 말씀해 주시면 채워 둘게요.\n(모르면 "모름" · 멈추려면 "그만" · 방금 것 되돌리려면 "취소")`);
    return mfAsk(bot);
  }
  const g = DB.getIndividuals().find(x => x.id === MF.ids[MF.i]);
  if (/^(그만|멈춰|중단|끝내|그만할래|그만해)/.test(t)) {
    const left = mfList().length;   // 넘어간 아이까지 — 다음에 다시 여쭙는 수
    bot(`여기까지 할게요. ${MF.done}마리 채웠어요.${left > 0 ? `\n남은 ${left}마리는 다음에 "모프누락명령"이라고 하시면 이어서 여쭐게요.` : ''}`);
    MF.ids = []; return false;
  }
  if (/^(취소|되돌려|방금\s*(거|것)?\s*취소|잘못)/.test(t)) {
    if (!MF.last) { bot('되돌릴 게 아직 없어요 🙂'); return mfAsk(bot); }
    const { id, prev, k, skipped } = MF.last; MF.last = null;
    const p = DB.getIndividuals().find(x => x.id === id);
    if (!skipped) { DB.updateIndividual(id, { morph: prev || '' }); MF.done = Math.max(0, MF.done - 1); refreshIndividuals && refreshIndividuals(); }
    else MF.skip = Math.max(0, MF.skip - 1);
    MF.i = k;
    bot(`↩️ ${p ? p.name : '방금 아이'} ${skipped ? '다시 여쭐게요.' : '모프를 다시 비웠어요.'}`);
    return mfAsk(bot);
  }
  if (!g) return mfAsk(bot);
  if (/^(모름|모르겠|몰라|넘어가|넘어|패스|스킵|다음|건너)/.test(t)) {
    MF.last = { id: g.id, prev: '', k: MF.i, skipped: true };
    MF.skip++; MF.i++;
    bot(`${eunneun(g.name)} 비워 둘게요.`);
    return mfAsk(bot);
  }
  if (!t || t.length > 40 || /\n/.test(t)) { bot('모프 이름만 짧게 말씀해 주세요 🙂 (예: 100헷초초)'); return true; }
  MF.last = { id: g.id, prev: g.morph || '', k: MF.i, skipped: false };
  DB.updateIndividual(g.id, { morph: t });
  refreshIndividuals && refreshIndividuals();
  MF.done++; MF.i++;
  bot(`✅ ${g.name} 모프 "${t}"로 기록할게요.`);
  return mfAsk(bot);
}


/* v1.9.35 설정 · 익명 방문 집계 카드 — app.min.js 에서 옮겨 왔습니다(첫 화면 크기 한도). TRACK·CHIP_ON/OFF 는 app 것을 씁니다 */
function TrackCard({ showToast }) {
  const [off, setOff] = useState(() => TRACK.isOff());
  return (
    <div className="card" style={{margin:0}} data-testid="track-card">
      <div style={{fontSize:13, fontWeight:700, color:'var(--text2)', marginBottom:8}}>📊 익명 방문 집계</div>
      <div style={{fontSize:12.5, color:'var(--text3)', lineHeight:1.7}}>
        앱이 얼마나 쓰이는지 보려고 <b>사람 수만</b> 셉니다.{'\n'}
        이름·이메일·아이피 같은 건 <b>하나도 보내지 않습니다.</b> 기록 내용도 물론이고요.
      </div>
      <button className="chip-btn" data-testid="track-off"
        onClick={() => { const v = !off; TRACK.setOff(v); setOff(v); showToast(v ? '이 기기는 세지 않을게요' : '집계에 다시 포함했어요'); }}
        style={{display:'flex', alignItems:'center', gap:9, width:'100%', textAlign:'left',
                marginTop:12, padding:'11px 12px', ...(off ? CHIP_ON : CHIP_OFF)}}>
        <span style={{fontSize:15}}>{off ? '☑' : '☐'}</span>
        <span style={{flex:1, minWidth:0, fontWeight:600, fontSize:13}}>이 기기는 세지 않기</span>
      </button>
    </div>
  );
}

/* v1.9.37 설정 · 저장 공간 카드 — app.min.js 에서 옮겨 왔습니다(첫 화면 크기 한도). STORE·PHOTO·STORE_MSG 는 app 것을 씁니다 */
/* 저장 공간 막대.
   ★ 숫자는 STORE.usage() 와 PHOTO.pending() 두 곳에서만 옵니다 — 화면에서 다시 세지 마세요.
   사진이 칸의 대부분을 먹기 때문에 "사진이 몇 장, 얼마"까지 같이 보여드립니다. */
function StorageCard({ showToast }) {
  const [tick, setTick] = useState(0);
  const [busy, setBusy] = useState(null);          // {done, total} 옮기는 중
  const u = STORE.usage();
  const pend = PHOTO.pending().count;
  const onServer = DB.getEvents().filter(e => e && e.data && isPhotoUrl(e.data.photo)).length;
  const pct = Math.min(100, Math.round(u.ratio * 100));
  const mb = (n) => (n / 1000000).toFixed(2) + 'MB';
  const color = pct >= 90 ? 'var(--danger, #B3362B)' : pct >= STORE_WARN * 100 ? '#C87F2F' : '#2E7D46';

  const moveAll = async () => {
    if (!PHOTO.ready()) return showToast && showToast('⚠️ 로그인하고 인터넷이 연결돼야 옮길 수 있어요');
    setBusy({ done: 0, total: pend });
    const r = await PHOTO.flush((done, total) => setBusy({ done, total }));
    setBusy(null);
    setTick(t => t + 1);
    if (showToast) showToast(r.left ? `📷 ${r.done}장 옮겼어요 · ${r.left}장 남음` : `📷 사진 ${r.done}장을 모두 옮겼어요`);
  };

  return (
    <div className="card" style={{margin:0}} data-testid="storage-card" key={tick}>
      <div style={{fontSize:13, fontWeight:700, marginBottom:4, color:'var(--text2)'}}>🗂️ 저장 공간</div>
      <div style={{fontSize:12, color:'var(--text3)', marginBottom:10, lineHeight:1.6}}>
        기록은 이 기기 안에 저장돼요. 칸이 꽉 차면 새 기록이 저장되지 않아요.
      </div>
      <div style={{height:10, borderRadius:6, background:'var(--bg3)', overflow:'hidden'}}>
        <div style={{width: Math.max(2, pct) + '%', height:'100%', background: color, borderRadius:6}} />
      </div>
      <div style={{display:'flex', justifyContent:'space-between', marginTop:7, fontSize:12, color:'var(--text2)'}}>
        <span><b style={{color}}>{mb(u.used)}</b> / 약 5MB</span>
        <span style={{fontVariantNumeric:'tabular-nums'}}>{pct}%</span>
      </div>

      <div style={{fontSize:11.5, color:'var(--text3)', marginTop:6, lineHeight:1.6}} data-testid="storage-photos">
        {onServer > 0 && `☁️ 서버에 ${onServer}장 (폰 칸을 안 먹어요)`}
        {onServer > 0 && pend > 0 && <br/>}
        {pend > 0 && `📱 폰에 ${pend}장이 ${mb(u.photo)}를 쓰고 있어요`}
        {onServer === 0 && pend === 0 && '아직 사진은 없어요.'}
      </div>

      {pend > 0 && (
        <button className="btn btn-secondary btn-sm" style={{width:'100%', marginTop:10}}
          disabled={!!busy} onClick={moveAll} data-testid="photo-move">
          {busy ? `옮기는 중… ${busy.done}/${busy.total}` : `☁️ 사진 ${pend}장 서버로 옮기기`}
        </button>
      )}

      {pct >= STORE_WARN * 100 && (
        <div style={{marginTop:9, padding:'9px 11px', borderRadius:9, background:'var(--bg3)',
                     fontSize:12, color:'var(--text2)', lineHeight:1.6, whiteSpace:'pre-line'}}>
          {STORE_MSG.near(pct)}
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════
   v1.9.39 대화 이어 묻기 — 대표님 요청(2026-10-30)
   "분양 보냈어 · 입양했어 · 태어났어"를 대화에서 끝내지 않고, 빠진 것을 하나씩 여쭙고 연결된 곳까지 채웁니다.
   · 분양: 얼마에 · 누구에게 → 담아 둔 분양 기록에 채움 → 저장하면 DB.recordSale(분양완료·분양가·입양자·가계부 수입·분양 기록)
   · 입양: 얼마에 · 어디서 → setAdoptMemo(프로필 입양처·입양가) + 그 메모를 그날 날짜로(가계부 '개체 구입'이 그 달에 잡힘)
   · 부화: 모프 → 담아 둔 부화 기록에 채움 → 저장하면 아기들 모프
   ★ "모름/넘어가" 그 질문만 건너뜀 · "그만" 멈춤 · 다른 이야기(밥·탈피·저장…)를 하시면 묻기를 멈추고 그 말을 평소대로 처리('pass')
   ★ 돌려주는 값: true 아직 묻는 중 · false 끝 · 'pass' 대답이 아님(app 이 그 말을 평소대로 해석)
   ══════════════════════════════════════════ */
const FU = { q: [], ctx: null, g: null };
const FU_SKIP = /^(모름|모르겠|몰라|없어|패스|넘어가|건너|다음에|나중에|비워)/;
const FU_STOP = /^(그만|됐어|괜찮아|안\s*적)/;
const FU_NOT = /밥|먹었|먹이|탈피|산란|무게|그램|\dg\b|해칭|부화|메이팅|저장|기록|분양|입양|태어|나왔|낳았|몇\s*마리|[?？]$/;
/* "15만원" · "150,000원" · "15"(→ 만원) · "무료" */
function fuPrice(t) {
  if (/무료|공짜|무상|선물|그냥\s*(줬|받)/.test(t)) return { free: true, won: 0 };
  let m = t.match(/(\d+(?:\.\d+)?)\s*만/); if (m) return { won: Math.round(parseFloat(m[1]) * 10000) };
  m = t.match(/(\d[\d,]*)\s*원/); if (m) return { won: parseInt(m[1].replace(/,/g, ''), 10) };
  m = t.match(/^(\d+(?:\.\d+)?)$/); if (m) { const n = parseFloat(m[1]); return { won: n <= 2000 ? Math.round(n * 10000) : Math.round(n) }; }
  return null;
}
const fuWho = (t) => {
  const n = t.replace(/^(그냥\s*)?/, '').replace(/(님|씨)?(한테|에게|께|에서|이요|요|이야|야)?$/, '').trim();
  return n && n.length <= 20 && !FU_NOT.test(t) && !/\d/.test(n.slice(0, 1)) && !DB.getIndividuals().some(i => i.name === n) ? n : null;
};
const fuWon = (p) => p.free ? '무료' : wonText(p.won);
function fuBuild(job, c) {
  const Q = [], add = (g, ask, take) => { Q.push({ g, ask: (Q.some(x => x.g === g) ? '' : g.intro + '\n') + ask, take }); };
  (job.facts || []).forEach(f => {
    const d = f.data || {}, nm = f.targetName || '';
    if (f.type === 'distribution') {
      const g = { got: [], intro: `🤝 ${nm} 분양 보냈군요! 빠진 걸 적어 둘게요.`,
        end: () => c.bot(`✅ ${nm} 분양 · ${g.got.join(' · ')} 담았어요.\n저장하면 분양완료로 바뀌고, 분양가는 가계부 수입·분양 기록에 들어가요.`) };
      if (!Number(d.price) && !d.free) add(g, '얼마에 보내셨나요? (예: 15만원 · 무료 · 모름)', t => { const p = fuPrice(t); if (!p) return null; c.patch(f, p.free ? { free: true, price: '' } : { price: String(p.won) }); return fuWon(p); });
      if (!d.buyer) add(g, '누구에게 보내셨나요? (이름·닉네임 · 모르면 "모름")', t => { const w = fuWho(t); if (!w) return null; c.patch(f, { buyer: w }); return '분양처 ' + w; });
    }
    if (f.type === 'hatching' && Number(d.count) > 0 && !String(d.morph || '').trim() && (babyNamingMode() !== 'ask' || (d.babyNames || []).length)) {
      const who = (d.babyNames || []).length ? d.babyNames.join(', ') : `아기들(${d.count}마리)`;
      const g = { got: [], intro: `🐣 축하드려요!`, end: () => c.bot(`✅ 모프 "${g.got[0]}"로 담았어요. 저장하면 ${who} 프로필에 들어가요.`) };
      add(g, `${who} 모프는 무엇인가요? (모르면 "모름")`, t => { if (t.length > 30 || /\n/.test(t) || FU_NOT.test(t)) return null; c.patch(f, { morph: t }); return t; });
    }
  });
  if (job.adopt) {
    const ind = DB.getIndividuals().find(i => i.id === job.adopt);
    if (ind) {
      const cur = (() => { try { return splitMemo(ind.id); } catch (e) { return { source: '', price: '' }; } })();
      const v = { source: cur.source || '', price: cur.price === undefined ? '' : String(cur.price) };
      const put = () => {
        setAdoptMemo(ind.id, v.source, v.price);
        const m = DB.getEventsFor(ind.id).find(e => e.type === 'memo' && /입양처\s*:|입양가/.test((e.data && e.data.notes) || ''));
        if (m) DB.updateEvent(m.id, { date: job.date || todayStr(), data: { ...m.data, dated: true } });   // 가계부 그 달에 '개체 구입'으로
        c.refreshIndividuals && c.refreshIndividuals();
      };
      const g = { got: [], intro: `🏠 ${ind.name} 데려왔군요! 빠진 걸 적어 둘게요.`,
        end: () => c.bot(`✅ ${ind.name} · ${g.got.join(' · ')} 적었어요.\n프로필의 입양처·입양가에 들어가요.${Number(v.price) > 0 ? "\n가계부 '개체 구입'에도 잡혀요." : ''}`) };
      if (v.price === '') add(g, '얼마에 데려오셨나요? (예: 30만원 · 무료 · 모름)', t => { const p = fuPrice(t); if (!p) return null; v.price = p.free ? '0' : String(Math.round(p.won / 1000) / 10); put(); return '입양가 ' + fuWon(p); });
      if (!v.source) add(g, '어디서(누구에게서) 데려오셨나요? (샵·브리더 이름 · 모르면 "모름")', t => { const w = fuWho(t); if (!w) return null; v.source = w; put(); return '입양처 ' + w; });
    }
  }
  return Q;
}
function fuNext() {
  const q = FU.q[0], c = FU.ctx;
  if (FU.g && (!q || q.g !== FU.g)) { if (FU.g.got.length) FU.g.end(); FU.g = null; }
  if (!q) return false;
  FU.g = q.g; c.bot(q.ask);
  return true;
}
function followUp(text, job, ctx) {
  if (ctx) FU.ctx = ctx;
  if (job) { FU.q = fuBuild(job, FU.ctx); FU.g = null; return fuNext(); }
  const q = FU.q[0], t = String(text || '').trim();
  if (!q) return false;
  if (FU_STOP.test(t)) { FU.q = []; fuNext(); FU.ctx.bot('네, 여기까지만 적어 둘게요 🙂'); return false; }
  if (FU_SKIP.test(t)) { FU.q.shift(); return fuNext(); }
  const r = q.take(t);
  if (r == null) { FU.q = []; fuNext(); return 'pass'; }
  q.g.got.push(r); FU.q.shift();
  return fuNext();
}

/* v1.9.42 서버 동기화 카드 — app.jsx 에서 옮겨 왔습니다(첫 화면 크기 한도). SYNC 등은 app 것을 씁니다 */
function SyncCard({ showToast, refreshIndividuals }) {
  const [, bump] = useState(0);
  const [form, setForm] = useState({ email: '', password: '' });
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState('signin');   // signin | signup | reset
  const [note, setNote] = useState('');
  const [confirmPull, setConfirmPull] = useState(false);

  useEffect(() => SYNC.on(() => bump(v => v + 1)), []);

  const st = SYNC.st();
  const ses = SYNC.ses();
  const active = SYNC.active();

  const fmtSync = (iso) => {
    if (!iso) return '아직 없음';
    const d = new Date(iso), diff = Math.floor((Date.now() - d.getTime()) / 1000);
    if (diff < 60) return '방금 전';
    if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
    return d.toLocaleString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const afterAuth = async () => {
    showToast('✅ 연결됐어요! 기록을 맞추는 중...');
    const r = await SYNC.firstSync();
    const dup = DB.findDuplicateNames();
    showToast(r && r.error ? '⚠️ ' + r.error
      : dup.length ? `☁️ 동기화 완료 · 같은 이름 ${dup.length}건은 아래에서 합쳐주세요`
      : '☁️ 동기화 완료!');
    refreshIndividuals();
    setForm({ email: '', password: '' });
    setOpen(false); setNote('');
  };

  const doSubmit = async () => {
    const email = form.email.trim();
    if (!email) return showToast('⚠️ 이메일을 넣어주세요');
    if (mode === 'reset') {
      setBusy(true);
      try { await SYNC.resetPassword(email); setNote('📧 비밀번호 재설정 메일을 보냈어요. 메일함을 확인해주세요.'); }
      catch (e) { showToast('⚠️ ' + ((e && e.message) || '실패')); }
      setBusy(false); return;
    }
    if (!form.password) return showToast('⚠️ 비밀번호를 넣어주세요');
    if (mode === 'signup' && form.password.length < 6) return showToast('⚠️ 비밀번호는 6자 이상이어야 해요');
    setBusy(true);
    try {
      if (mode === 'signup') {
        const r = await SYNC.signUp(email, form.password);
        if (!r.signedIn) {
          setNote('📧 인증 메일을 보냈어요. 메일의 링크를 누른 뒤 로그인해주세요.');
          setMode('signin'); setBusy(false); return;
        }
      } else {
        await SYNC.signIn(email, form.password);
      }
      await afterAuth();
    } catch (e) {
      showToast('⚠️ ' + ((e && e.message) || '실패'));
    }
    setBusy(false);
  };

  const doSync = async () => {
    setBusy(true);
    const r = await SYNC.run('manual');
    showToast(r && r.error ? '⚠️ ' + r.error : '☁️ 동기화 완료!');
    refreshIndividuals();
    setBusy(false);
  };

  const doPullReplace = async () => {
    setBusy(true);
    setConfirmPull(false);
    try {
      const n = await SYNC.pullReplace();
      refreshIndividuals();
      showToast(`📥 서버 데이터 ${n}건 불러왔어요`);
    } catch (e) {
      showToast('⚠️ ' + ((e && e.message) || '불러오기 실패'));
    }
    setBusy(false);
  };

  const doLogout = () => {
    SYNC.signOut();
    showToast('연결을 끊었어요 (이 기기 데이터는 그대로예요)');
  };

  return (
    <div className="card" style={{margin:0}}>
      <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:6}}>
        <div style={{fontSize:13, fontWeight:700, color:'var(--text2)'}}>☁️ 서버 동기화</div>
        <div style={{fontSize:11, fontWeight:700, color: active ? '#2E7D46' : 'var(--text3)'}}>
          {SYNC.running ? '동기화 중…' : active ? '● 연결됨' : '○ 로컬 저장만'}
        </div>
      </div>

      {active ? (
        <>
          <div style={{fontSize:12, color:'var(--text3)', lineHeight:1.7, marginBottom:10}}>
            계정: {(ses && ses.email) || '-'}<br/>
            마지막 동기화: {fmtSync(st.lastSyncAt)}
            {st.lastError && <><br/><span style={{color:'#B3261E'}}>⚠️ {st.lastError}</span></>}
          </div>
          <div style={{display:'flex', flexDirection:'column', gap:8}}>
            <button className="btn btn-primary" disabled={busy} onClick={doSync}>{busy ? '진행 중…' : '🔄 지금 동기화'}</button>
            {confirmPull ? (
              <div style={{background:'var(--bg3)', borderRadius:10, padding:12}}>
                <div style={{fontSize:12, color:'var(--text2)', marginBottom:8, lineHeight:1.6}}>
                  이 기기의 데이터를 지우고 서버 내용으로 통째로 바꿔요.<br/>새 폰·새 PC에서 처음 설치했을 때만 쓰세요.
                </div>
                <div style={{display:'flex', gap:6}}>
                  <button className="btn btn-primary btn-sm" style={{flex:1}} onClick={doPullReplace}>서버 내용으로 바꾸기</button>
                  <button className="btn btn-secondary btn-sm" style={{flex:1}} onClick={() => setConfirmPull(false)}>취소</button>
                </div>
              </div>
            ) : (
              <button className="btn btn-secondary" disabled={busy} onClick={() => setConfirmPull(true)}>📥 서버 내용 통째로 받기 (새 기기)</button>
            )}
            <button className="btn btn-secondary" disabled={busy} onClick={doLogout}>연결 끊기</button>
          </div>
        </>
      ) : open ? (
        <div style={{display:'flex', flexDirection:'column', gap:8}}>
          <div style={{fontSize:12, color:'var(--text3)', lineHeight:1.6, marginBottom:2}}>
            {mode === 'signup' ? '이메일과 비밀번호만 정하면 됩니다. 기록은 본인만 볼 수 있어요.'
             : mode === 'reset' ? '가입하신 이메일을 넣으면 재설정 링크를 보내드려요.'
             : '로그인하면 폰·PC가 같은 기록을 봅니다.'}
          </div>
          <input className="input" type="email" autoComplete="username" placeholder="이메일"
            value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
          {mode !== 'reset' && (
            <input className="input" type="password"
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              placeholder={mode === 'signup' ? '비밀번호 (6자 이상)' : '비밀번호'}
              value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
          )}
          {note && <div style={{fontSize:12, color:'var(--accent2)', lineHeight:1.6}}>{note}</div>}
          <div style={{display:'flex', gap:6}}>
            <button className="btn btn-primary" style={{flex:1}} disabled={busy} onClick={doSubmit}>
              {busy ? '진행 중…' : mode === 'signup' ? '가입하고 시작하기' : mode === 'reset' ? '재설정 메일 보내기' : '로그인'}
            </button>
            <button className="btn btn-secondary" style={{flex:1}} disabled={busy}
              onClick={() => { setOpen(false); setNote(''); setMode('signin'); }}>취소</button>
          </div>
          <div style={{display:'flex', justifyContent:'space-between', fontSize:12, paddingTop:2}}>
            {mode === 'signin' ? (
              <>
                <button onClick={() => { setMode('signup'); setNote(''); }} style={{background:'none', border:'none', color:'var(--accent2)', cursor:'pointer', padding:0}}>처음이세요? 회원가입</button>
                <button onClick={() => { setMode('reset'); setNote(''); }} style={{background:'none', border:'none', color:'var(--text3)', cursor:'pointer', padding:0}}>비밀번호를 잊었어요</button>
              </>
            ) : (
              <button onClick={() => { setMode('signin'); setNote(''); }} style={{background:'none', border:'none', color:'var(--accent2)', cursor:'pointer', padding:0}}>← 로그인으로 돌아가기</button>
            )}
          </div>
        </div>
      ) : (
        <>
          <div style={{fontSize:12, color:'var(--text3)', lineHeight:1.7, marginBottom:10}}>
            지금은 이 기기에만 저장돼요. 로그인하면 폰에서 적은 기록이 PC에도 그대로 나타나요.
          </div>
          <div style={{display:'flex', gap:6}}>
            <button className="btn btn-primary" style={{flex:1}} onClick={() => { setMode('signin'); setOpen(true); }}>로그인</button>
            <button className="btn btn-secondary" style={{flex:1}} onClick={() => { setMode('signup'); setOpen(true); }}>회원가입</button>
          </div>
        </>
      )}
    </div>
  );
}

/* v1.9.40 폰 알림 카드 — app.jsx 에서 옮겨 왔습니다(첫 화면 크기 한도). PUSH·SYNC·CHIP_ON/OFF 는 app 것을 씁니다 */
function PushCard({ showToast }) {
  const [, bump] = useState(0);
  const [busy, setBusy] = useState('');
  useEffect(() => {
    const off = PUSH.on(() => bump(v => v + 1));
    const off2 = SYNC.on(() => bump(v => v + 1));
    PUSH.refresh().catch(() => {});
    return () => { off(); off2(); };
  }, []);

  const st = PUSH.state();
  const prefs = PUSH.prefs();

  const wrap = (children) => (
    <div className="card" style={{margin:0}} data-testid="push-card">
      <div style={{fontSize:13, fontWeight:700, color:'var(--text2)', marginBottom:10}}>🔔 폰 알림</div>
      {children}
    </div>
  );
  const note = (text) => (
    <div style={{fontSize:12.5, color:'var(--text3)', lineHeight:1.6}}>{text}</div>
  );

  if (st === 'unsupported') return wrap(note('이 브라우저는 폰 알림을 지원하지 않아요.\n크롬이나 사파리에서 열어주세요.'));
  if (st === 'need-install') return wrap(note('아이폰은 홈 화면에 추가한 뒤에 알림을 받을 수 있어요.\n사파리 아래 공유 버튼 → "홈 화면에 추가" 를 누르시고,\n거기서 열어서 다시 와주세요.'));
  if (st === 'need-login') return wrap(note('먼저 위의 ☁️ 서버 동기화를 연결해주세요.\n어느 폰으로 보낼지 알아야 알림을 드릴 수 있어요.'));
  if (st === 'denied') return wrap(note('알림이 차단돼 있어요.\n폰 설정 → 알림에서 이 앱을 허용해주신 뒤 다시 와주세요.'));

  const doEnable = async () => {
    setBusy('on');
    try { await PUSH.enable(); showToast('🔔 알림을 켰어요'); }
    catch (e) { showToast('⚠️ ' + ((e && e.message) || '실패')); }
    setBusy('');
  };
  const doDisable = async () => {
    setBusy('off');
    try { await PUSH.disable(); showToast('알림을 껐어요'); }
    catch (e) { showToast('⚠️ ' + ((e && e.message) || '실패')); }
    setBusy('');
  };
  const doTest = async () => {
    setBusy('test');
    try { await PUSH.test(); showToast('📨 보냈어요. 잠시 뒤 알림이 뜰 거예요'); }
    catch (e) { showToast('⚠️ ' + ((e && e.message) || '실패')); }
    setBusy('');
  };

  if (st === 'off') return wrap(
    <div>
      {note('앱을 켜지 않아도 잠금화면으로 알려드려요.\n부화 예정일과 밥 주는 날, 아침 8시에 한 번씩이에요.')}
      <button className="btn btn-primary" style={{marginTop:12}} data-testid="push-on"
        disabled={busy === 'on'} onClick={doEnable}>
        {busy === 'on' ? '켜는 중…' : '🔔 알림 받기'}
      </button>
    </div>
  );

  // 켜져 있음
  const row = (key, label, sub, on) => (
    <button key={key} className="chip-btn" data-testid={'push-' + key}
      onClick={() => PUSH.savePrefs(key === 'hatch' ? { pushHatch: !on } : { pushFeed: !on })}
      style={{display:'flex', alignItems:'center', gap:10, width:'100%', textAlign:'left',
              padding:'11px 12px', ...(on ? CHIP_ON : CHIP_OFF)}}>
      <span style={{fontSize:15}}>{on ? '☑' : '☐'}</span>
      <span style={{flex:1, minWidth:0}}>
        <span style={{display:'block', fontWeight:600, fontSize:13.5}}>{label}</span>
        <span style={{display:'block', fontSize:11.5, opacity:.8, marginTop:2}}>{sub}</span>
      </span>
    </button>
  );

  return wrap(
    <div>
      <div style={{fontSize:12.5, color:'#2E7D46', fontWeight:600, marginBottom:10}}>● 이 기기로 알림을 받고 있어요</div>
      <div style={{display:'flex', flexDirection:'column', gap:8}}>
        {row('hatch', '🥚 부화 예정', '사흘 전과 당일 아침', prefs.hatch)}
        {row('feed', '🍽️ 밥 주는 날', '그날 아침', prefs.feed)}
      </div>
      <div style={{display:'flex', gap:8, marginTop:12}}>
        <button className="btn btn-secondary btn-sm" style={{flex:1}} data-testid="push-test"
          disabled={busy === 'test'} onClick={doTest}>
          {busy === 'test' ? '보내는 중…' : '📨 시험 알림'}
        </button>
        <button className="btn btn-secondary btn-sm" style={{flex:1}} data-testid="push-off"
          disabled={busy === 'off'} onClick={doDisable}>알림 끄기</button>
      </div>
      <div style={{fontSize:11.5, color:'var(--text3)', marginTop:10, lineHeight:1.6}}>
        아침 8시에 그날 챙길 것을 묶어서 한 통으로 보내드려요.
      </div>
    </div>
  );
}

/* ══ v1.9.40 형제로 부모 잇기 — "마동이들이랑 아빠가 같아" · "크한이랑 엄마가 같아" · "엄마도 같아"
   이름 하나(크한이)나 이름 앞부분이 같은 무리(마동1호~10호)의 부모를 지금 이야기하는 아이에게 그대로 잇습니다.
   ★ 대상: 문장에 나온 다른 이름 → 없으면 방금까지 이야기하던 아이("얘"). 무리 아이들은 대상이 될 수 없습니다. ══ */
const SIB_PAR_RE = /([가-힣A-Za-z0-9]+?)\s*(?:이들|들)?\s*(?:이랑|랑|이하고|하고|이와|와|과)\s*(?:다\s*)?(아빠|아비|엄마|어미|부모|엄빠)\s*(?:가|는|도|랑|이)?\s*(?:다\s*)?(?:똑\s*)?(?:같|동일)/;
const SIB_MORE_RE = /^(?:근데\s*|그리고\s*)?(아빠|엄마|부모|엄빠)\s*(?:도|가|는)?\s*(?:다\s*)?(?:똑\s*)?(?:같|동일)/;
const wa = (w) => { const c = (w || '').charCodeAt(w.length - 1) - 0xAC00; return c >= 0 && c < 11172 && c % 28 ? '과' : '와'; };
function sibGroupOf(word, list) {
  const all = list.filter(i => i.name);
  const flat = s => s.replace(/\s+/g, '');
  const one = all.find(i => i.name === word) || all.find(i => i.name === word + '이');
  if (one) return [one];
  const stem = word.replace(/이$/, '');
  if (stem.length < 2) return [];
  return all.filter(i => flat(i.name).startsWith(stem));
}
function sibParentKeys(role) { return /엄마|어미/.test(role) ? ['damId'] : /부모|엄빠/.test(role) ? ['sireId', 'damId'] : ['sireId']; }
/* 순수 — 무리에서 가장 많이 겹치는 부모를 고릅니다 */
function sibParentsPlan(subj, grp, keys, list) {
  const byId = {}; list.forEach(i => { byId[i.id] = i; });
  const patch = {}, L = [], miss = [];
  for (const k of keys) {
    const role = k === 'sireId' ? '아빠' : '엄마';
    const cnt = {};
    grp.forEach(g => { if (g[k] && g[k] !== subj.id && byId[g[k]]) cnt[g[k]] = (cnt[g[k]] || 0) + 1; });
    const ids = Object.keys(cnt).sort((a, b) => cnt[b] - cnt[a]);
    if (!ids.length) { miss.push(role); continue; }
    const p = byId[ids[0]], old = subj[k] && subj[k] !== p.id && byId[subj[k]];
    patch[k] = p.id;
    L.push(`${role} ${p.name} 🧬 연결 완료${old ? ` (전에는 ${old.name})` : ''}${ids.length > 1 ? ` · ${grp.length}마리 중 ${cnt[ids[0]]}마리 기준` : ''}`);
  }
  return { patch, L, miss };
}
const SIB = { last: null };
function sibParents(text, c) {
  const t = String(text || '').trim();
  const list = DB.getIndividuals();
  let m = t.match(SIB_PAR_RE), grp, keys, word;
  if (m) {
    word = m[1]; keys = sibParentKeys(m[2]);
    const hit = (c.names || []).find(n => new RegExp(n.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*(?:들|이들)?\\s*(?:이랑|랑|이하고|하고|이와|와|과)').test(t));   // "마동 5호랑" 처럼 띄어 쓴 이름
    grp = hit ? [hit] : sibGroupOf(word, list);
    if (hit) word = hit.name;
  }
  else if ((m = t.match(SIB_MORE_RE)) && SIB.last && c.prev && c.prev.id === SIB.last.subj) {
    word = SIB.last.word; keys = sibParentKeys(m[1]);
    grp = SIB.last.grp.map(id => list.find(i => i.id === id)).filter(Boolean);
  } else return false;
  const ids = new Set(grp.map(g => g.id).concat(...grp.map(g => [g.sireId, g.damId])));   // 무리와 그 부모는 대상이 아닙니다
  const pick = (c.names || []).find(n => !ids.has(n.id)) || (c.prev && !ids.has(c.prev.id) ? c.prev : null);
  const subj = pick && (list.find(i => i.id === pick.id) || pick);
  if (!grp.length) { c.bot(`"${word}" 아이를 못 찾았어요 🙂\n${keys[0] === 'damId' ? '엄마' : '아빠'}가 같은 아이 이름을 하나만 알려주시겠어요?\n예) "마동1호랑 아빠가 같아"`); return true; }
  if (!subj) { c.bot(`어느 아이 이야기인지 이름을 알려주세요 🙂\n예) "크얌이는 ${word}들이랑 아빠가 같아"`); return true; }
  const p = sibParentsPlan(subj, grp, keys, list);
  const nm = grp.length > 1 ? `${grp[0].name} 외 ${grp.length - 1}마리` : grp[0].name;
  c.setTarget(subj);
  SIB.last = { subj: subj.id, grp: grp.map(g => g.id), word };
  if (!p.L.length) { c.bot(`${nm}도 ${p.miss.join('·')}가 아직 비어 있어요.\n"${subj.name} 아빠는 ○○야"처럼 이름으로 알려주시면 이어 드릴게요.`); return true; }
  DB.updateIndividual(subj.id, p.patch);
  c.refreshIndividuals && c.refreshIndividuals();
  const fresh = DB.getIndividuals(), me = fresh.find(i => i.id === subj.id) || subj;
  const both = grp.some(g => g.sireId && g.damId && g.sireId === me.sireId && g.damId === me.damId);
  c.bot(`${subj.name} 혈통에 담았어요.\n${p.L.join('\n')}${p.miss.length ? `\n(${nm}도 ${p.miss.join('·')}는 비어 있어요)` : ''}\n\n`
    + `${nm}${wa(nm)} ${both ? '부모가 모두 같은 동배' : '한쪽 부모가 같은 반동배'}라 서로 메이팅은 피해 주세요.\n붙이려 하시면 제가 먼저 말씀드릴게요.`
    + (!both && keys.length === 1 ? `\n${keys[0] === 'sireId' ? '엄마' : '아빠'}도 같으면 "${keys[0] === 'sireId' ? '엄마' : '아빠'}도 같아"라고 말씀해 주세요.` : ''));
  return true;
}


window.CREG_EXTRAS = {
  SeasonNoteSheet, BirthdayPopup, DupMergeCard, FeedbackCard, FeedbackInbox, fbPayload, FB_PICKS, morphFill, mfList, mfIntro, MF, TrackCard, StorageCard, PushCard, SyncCard, followUp, fuPrice, fuWho, FU, sibParents, sibGroupOf, sibParentsPlan, SIB_PAR_RE, SIB_MORE_RE, SIB, BDAY_LINES, bdayPick, SaleCardSheet, AdoptSendSheet, AdoptReceive, AddGeckoSheet, chat,
  // 시험(node)에서 쓰는 순수 함수들
  seasonYears, seasonNoteStats, seasonSummaryText, saveSeasonNote, toggleTrait, SEASON_TRAITS, SEASON_DIRS,
  adoptSnapshot, adoptMemos, adoptImport, adoptCounts, looksPrivate, ADOPT, ADOPT_KINDS, ADOPT_NEVER, saleCardData,
};
})();
