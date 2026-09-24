/* ══════════════════════════════════════════
   엑셀·표 가져오기 엔진 (v1.8) — 규칙 기반, AI 없음
   ──────────────────────────────────────────
   사람마다 엑셀 모양이 다릅니다. 그래서 "양식을 맞춰 주세요"라고 하지 않고
   이쪽에서 알아봅니다.

   ① 제목줄 찾기    — 1행이 아니어도, B열부터 시작해도, 제목줄이 두 번 나와도
   ② 칸 알아보기    — 칸 이름 사전(동의어) → 안 되면 칸 안의 값을 보고 추정
   ③ 시트 종류 판단 — 개체 목록 · 메이팅/산란 · 날짜별 기록 · 날짜 칸 표 · 가계부 · 일지
   ④ 값 읽기        — 날짜(연도 없는 날짜·엑셀 날짜 숫자 포함) · 성별(1.0/0.1 포함) ·
                      돈(만원/원/무료) · 알 개수(무정 포함) · 부모(크한x크순)
   ⑤ 합치기         — 이미 있는 아이와 이름으로 합치고, 같은 기록은 두 번 넣지 않습니다

   ★ 원칙: 칸 하나도 버리지 않습니다.
     알아본 칸은 제 자리로, 못 알아본 칸은 "칸 이름: 값"으로 그 아이 메모에 남깁니다.
     일부러 빼는 것(번호·합계·부화 예정일처럼 앱이 계산하는 것)은 따로 세어 보여드립니다.

   이 파일은 화면(React)을 모릅니다. 격자(행·칸)만 받아서 "무엇을 넣을지" 계획을 돌려줍니다.
   그래서 node 로 그대로 시험할 수 있습니다.
   ══════════════════════════════════════════ */
(function (G) {
'use strict';

/* ───────── 글자 다듬기 ───────── */
const S = v => (v == null ? '' : String(v));
const FW = s => s.replace(/[０-９]/g, c => String.fromCharCode(c.charCodeAt(0) - 0xFEE0))
                 .replace(/[．]/g, '.').replace(/[／]/g, '/').replace(/[－―—–]/g, '-').replace(/[：]/g, ':')
                 .replace(/[（]/g, '(').replace(/[）]/g, ')').replace(/[ｘＸ✕✖]/g, 'x');
const clean = v => FW(S(v)).replace(/[ 　​]/g, ' ').replace(/[\r\t\n]+/g, ' ').replace(/\s+/g, ' ').trim();
const hkey = v => clean(v).toLowerCase().replace(/[\s()\[\]{}<>:·.,\/\\\-_~!?'"`*#|=+@^;]/g, '');
const pad = n => String(n).padStart(2, '0');
const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);
const code6 = () => Math.random().toString(36).slice(2, 8).toUpperCase().padEnd(6, 'X');

/* ───────── 날짜 ───────── */
const DIM = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
function validYMD(y, m, d) {
  if (!(y >= 1990 && y <= 2100 && m >= 1 && m <= 12 && d >= 1 && d <= DIM[m - 1])) return false;
  if (m === 2 && d === 29 && !((y % 4 === 0 && y % 100 !== 0) || y % 400 === 0)) return false;
  return true;
}
const iso = (y, m, d) => `${y}-${pad(m)}-${pad(d)}`;
const y2 = y => (y < 100 ? 2000 + y : y);
function addDays(isoStr, n) {
  const [y, m, d] = isoStr.split('-').map(Number);
  const t = new Date(Date.UTC(y, m - 1, d) + n * 86400000);
  return iso(t.getUTCFullYear(), t.getUTCMonth() + 1, t.getUTCDate());
}
function diffDays(a, b) {
  const p = s => { const [y, m, d] = s.split('-').map(Number); return Date.UTC(y, m - 1, d); };
  return Math.round((p(a) - p(b)) / 86400000);
}
/* 엑셀 날짜 숫자(1900 기준) → 날짜. 1900-02-29 버그 보정 포함 */
function serialToISO(n) {
  if (!(n > 20000 && n < 80000)) return null;
  const t = new Date(Date.UTC(1899, 11, 30) + Math.floor(n) * 86400000);
  return iso(t.getUTCFullYear(), t.getUTCMonth() + 1, t.getUTCDate());
}

/* 연도 없는 날짜의 연도 정하기
   anchor(같은 줄의 앞 날짜) 가 있으면 그 뒤에서 가장 가까운 해,
   없으면 오늘을 넘지 않는 가장 최근 해 (기록은 지난 일이므로 앞으로 7일까지만 허용) */
function pickYear(m, d, opt) {
  const o = opt || {};
  const today = o.today;
  // 앞 날짜(산란일 → 부화일처럼)가 있으면 그 뒤에서 가장 가까운 해가 제일 믿을 만합니다
  if (o.anchor) {
    const ay = +o.anchor.slice(0, 4);
    for (const y of [ay, ay + 1]) {
      if (validYMD(y, m, d) && diffDays(iso(y, m, d), o.anchor) >= -20) return y;
    }
  }
  if (o.year && validYMD(o.year, m, d)) return o.year;
  const ty = +today.slice(0, 4);
  for (const y of [ty, ty - 1, ty - 2]) {
    if (validYMD(y, m, d) && diffDays(iso(y, m, d), today) <= 7) return y;
  }
  return validYMD(ty, m, d) ? ty : null;
}

/* 글 속 날짜 하나 찾기 → { iso, at, len, partial, noYear }
   partial: 'ym' 이면 달까지만 아는 날짜 (일자 미상) */
const RE_DATES = [
  // 2025-03-15 · 2025.3.15 · 2025/03/15 · 2025년 3월 15일 · 2025. 3. 15.
  { re: /(\d{4})\s*(?:[-./]|년)\s*(\d{1,2})\s*(?:[-./]|월)\s*(\d{1,2})\s*일?/, f: m => ({ y: +m[1], mo: +m[2], d: +m[3] }) },
  // 25.03.15 · '25.3.15 · 25/3/15 · 25-03-15 · 25년 3월 15일
  { re: /(?:^|[^\d.])'?(\d{2})\s*(?:[-./]|년)\s*(\d{1,2})\s*(?:[-./]|월)\s*(\d{1,2})(?!\d)\s*일?/, f: m => ({ y: 2000 + +m[1], mo: +m[2], d: +m[3] }) },
  // 15/03/2025 (일/월/연)
  { re: /(\d{1,2})[/.](\d{1,2})[/.](\d{4})/, f: m => (+m[1] > 12 ? { y: +m[3], mo: +m[2], d: +m[1] } : { y: +m[3], mo: +m[1], d: +m[2] }) },
  // 20250315
  { re: /(?:^|\D)(20\d{2})(\d{2})(\d{2})(?!\d)/, f: m => ({ y: +m[1], mo: +m[2], d: +m[3] }) },
  // 3월 15일 · 3월15일
  { re: /(\d{1,2})\s*월\s*(\d{1,2})\s*일?/, f: m => ({ mo: +m[1], d: +m[2] }) },
];
const RE_MD = /(?:^|[^\d.])(\d{1,2})\s*[/.]\s*(\d{1,2})(?![\d.]*\d{2,})(?!\s*[/.]\s*\d)/;
const RE_YM = [
  { re: /(\d{4})\s*(?:[-./]|년)\s*(\d{1,2})\s*(?:월|\.|$)/, f: m => ({ y: +m[1], mo: +m[2] }) },
  { re: /(?:^|[^\d])'?(\d{2})\s*(?:[-./]|년)\s*(\d{1,2})\s*(?:월|\.|[-./]\s*[x?？]+|$)/i, f: m => ({ y: 2000 + +m[1], mo: +m[2] }) },
];
function findDate(text, opt) {
  const o = opt || {};
  const t = FW(S(text));
  for (const p of RE_DATES) {
    const m = t.match(p.re);
    if (!m) continue;
    const v = p.f(m);
    let y = v.y;
    if (!y) y = pickYear(v.mo, v.d, o);
    if (y && validYMD(y, v.mo, v.d)) return { iso: iso(y, v.mo, v.d), at: m.index, len: m[0].length, noYear: !v.y };
  }
  if (o.loose !== false) {
    const m = t.match(RE_MD);
    if (m) {
      const mo = +m[1], d = +m[2];
      const y = pickYear(mo, d, o);
      if (y && validYMD(y, mo, d)) return { iso: iso(y, mo, d), at: m.index, len: m[0].length, noYear: true };
    }
  }
  for (const p of RE_YM) {
    const m = t.match(p.re);
    if (!m) continue;
    const v = p.f(m);
    if (v.y >= 1990 && v.y <= 2100 && v.mo >= 1 && v.mo <= 12) {
      return { iso: iso(v.y, v.mo, 1), at: m.index, len: m[0].length, partial: 'ym' };
    }
  }
  return null;
}
/* 칸 하나를 날짜로 — 칸 전체가 날짜여야 합니다(글 속에 섞인 날짜는 findDate 로) */
function cellDate(cell, opt) {
  if (!cell) return null;
  if (cell.d) return { iso: cell.d };
  const o = opt || {};
  if (typeof cell.n === 'number' && o.dateCol) {
    const s = serialToISO(cell.n);
    if (s) return { iso: s, serial: true };
    const str = String(Math.round(cell.n));
    if (/^\d{6}$/.test(str)) { const y = 2000 + +str.slice(0, 2), mo = +str.slice(2, 4), d = +str.slice(4, 6); if (validYMD(y, mo, d)) return { iso: iso(y, mo, d) }; }
    if (/^\d{8}$/.test(str)) { const y = +str.slice(0, 4), mo = +str.slice(4, 6), d = +str.slice(6, 8); if (validYMD(y, mo, d)) return { iso: iso(y, mo, d) }; }
  }
  const t = clean(cell.t);
  if (!t) return null;
  if (/^\d{6}$/.test(t) && o.dateCol) {
    const y = 2000 + +t.slice(0, 2), mo = +t.slice(2, 4), d = +t.slice(4, 6);
    if (validYMD(y, mo, d)) return { iso: iso(y, mo, d) };
  }
  const f = findDate(t, { ...o, loose: o.dateCol || o.loose });
  if (!f) return null;
  // 칸이 거의 날짜로만 이루어져 있어야 "날짜 칸" 입니다
  const rest = (t.slice(0, f.at) + t.slice(f.at + f.len)).replace(/[\s,()~\-.일경쯤추정?]/g, '');
  return { iso: f.iso, partial: f.partial, noYear: f.noYear, rest, raw: t };
}
/* 한 칸 안의 날짜 여러 개 — "1/9, 2/2, 3/1" */
function allDates(text, opt) {
  const out = [];
  let t = FW(S(text));
  let anchor = (opt && opt.anchor) || null;
  for (let guard = 0; guard < 20 && t; guard++) {
    const f = findDate(t, { ...opt, anchor, loose: true });
    if (!f || f.partial) break;
    out.push({ iso: f.iso, before: t.slice(0, f.at) });
    anchor = f.iso;
    t = t.slice(f.at + f.len);
  }
  return { dates: out, tail: t };
}

/* ───────── 숫자 · 돈 · 성별 · 상태 ───────── */
function num(cell) {
  if (cell && typeof cell.n === 'number' && !cell.d) return cell.n;
  const m = clean(cell && cell.t).replace(/,/g, '').match(/-?\d+(?:\.\d+)?/);
  return m ? parseFloat(m[0]) : null;
}
const FREE_RE = /무료|무상|선물|나눔|서비스|공짜|free|기증|증정/i;
/* 돈 칸 — unit: 10000(만원 칸) · 1000(천원) · 1(원). 적힌 글자에 단위가 있으면 그걸 우선합니다 */
function money(cell, unit) {
  const raw = clean(cell && cell.t);
  if (!raw && !(cell && typeof cell.n === 'number')) return null;
  if (FREE_RE.test(raw)) return { won: 0, free: true, raw };
  if (typeof (cell && cell.n) === 'number' && !cell.d && !/[만천원₩]/.test(raw)) {
    const n = cell.n;
    if (n === 0) return { won: 0, zero: true, raw };
    return { won: Math.round(Math.abs(n) * (unit || 1)), neg: n < 0, raw };
  }
  const s = raw.replace(/,/g, '').replace(/\s/g, '');
  let m = s.match(/(\d+(?:\.\d+)?)[~\-](\d+(?:\.\d+)?)만/);   // "30~35만" → 앞 값
  if (m) return { won: Math.round(parseFloat(m[1]) * 10000), raw, range: true };
  m = s.match(/(-?\d+(?:\.\d+)?)만(?:(\d+)천)?/);
  if (m) return { won: Math.round(Math.abs(parseFloat(m[1])) * 10000 + (m[2] ? +m[2] * 1000 : 0)), neg: /^-/.test(m[1]), raw };
  m = s.match(/(-?\d+(?:\.\d+)?)천/);
  if (m) return { won: Math.round(Math.abs(parseFloat(m[1])) * 1000), neg: /^-/.test(m[1]), raw };
  m = s.match(/(-?\d+(?:\.\d+)?)(원|₩)?/) || s.match(/₩(-?\d+(?:\.\d+)?)/);
  if (m) {
    const n = parseFloat(m[1]);
    const u = /원|₩/.test(s) ? 1 : (unit || 1);
    if (n === 0) return { won: 0, zero: true, raw };
    return { won: Math.round(Math.abs(n) * u), neg: n < 0, raw };
  }
  return null;
}
/* 성별 → { g: 'female'|'male'|'unknown', sure } / 성별 말이 아니면 null */
function gender(v) {
  const raw = clean(v);
  if (!raw) return null;
  let s = raw.toLowerCase().replace(/\s/g, '');
  if (/^1[.,]0([.,]0)?$/.test(s)) return { g: 'male', sure: true };
  if (/^0[.,]1([.,]0)?$/.test(s)) return { g: 'female', sure: true };
  if (/^0[.,]0[.,]1$/.test(s)) return { g: 'unknown', sure: true };
  if (s.length > 14) return null;
  const unsure = /[?？]|추정|예상|같음|아마|probably|maybe|의심/.test(s);
  const s0 = s;
  s = s.replace(/\(.*?\)|추정|예상|같음|아마|의심|probably|maybe|[?？]/g, '') || s0;
  if (/^(미구분|미정|모름|미확인|미상|구분안됨|구분불가|불명|유체|베이비|베이비라|해츨링|아기|애기|unknown|unsexed|n\/a|na|u|-|\?+|？+|암수미구분|미성별|성별미상|암수모름|모름\?|미)$/.test(s) || /미구분|미정|모름|unsexed|unknown/.test(s)) return { g: 'unknown', sure: true };
  const f = /♀|암|여자|여아|^여$|female|^f$|girl|메스|걸/.test(s);
  const m = /♂|수컷|숫|^수$|남자|남아|^남$|^male$|^m$|boy|오스|보이/.test(s) || /(^|[^fe])male/.test(s);
  if (f && !m) return { g: 'female', sure: !unsure };
  if (m && !f) return { g: 'male', sure: !unsure };
  return null;
}
const OX_YES = /^(o|ㅇ|○|◯|●|v|✓|✔|✅|y|yes|true|예|네|있음|있다|유|함|했음|완료|먹음|먹었음|잘먹음|1)$/i;
const OX_NO = /^(x|ㅌ|×|✗|✘|n|no|false|아니오|없음|없다|무|안함|안먹음|거부|거식|0)$/i;
const ox = v => { const s = clean(v).replace(/\s/g, ''); return OX_YES.test(s) ? true : OX_NO.test(s) ? false : null; };

/* 상태 → { status, keep, gone } */
function statusOf(v, hdr) {
  const s = clean(v).replace(/\s/g, '').toLowerCase();
  if (!s) return null;
  const h = hkey(hdr || '');
  const yn = ox(s);
  if (yn !== null) {
    if (/킵|keep|보유|소장|종개체/.test(h)) return { keep: yn };
    if (/완료|판매됨|sold/.test(h)) return yn ? { status: 'sold' } : null;
    if (/가능|판매중|forsale/.test(h)) return yn ? { status: 'available' } : null;
    if (/예약/.test(h)) return yn ? { status: 'reserved' } : null;
    if (/분양|판매/.test(h)) return yn ? { status: 'sold', guess: true } : null;
    return null;
  }
  if (/폐사|사망|죽음|죽었|무지개|하늘나라|dead|died|^rip$/.test(s)) return { status: 'gone', gone: '폐사' };
  if (/실종|탈출|도망|missing|escape/.test(s)) return { status: 'gone', gone: '실종·탈출' };
  if (/예약|입금대기|계약|홀드|hold|reserved/.test(s)) return { status: 'reserved' };
  if (/분양가능|판매가능|판매중|분양중|분양예정|분양대기|판매예정|매물|forsale|available|내놓|판매대기|분양준비/.test(s)) return { status: 'available' };
  if (/분양완료|판매완료|분양됨|판매됨|분양함|분양했|출고|보냄|보냈|입양감|입양완료|입양보냄|팔림|팔았|sold|완료|분양감|분양$|판매$/.test(s)) return { status: 'sold' };
  if (/킵|keep|소장|종개체|종자|브리딩용|메인|평생/.test(s)) return { status: 'own', keep: true };
  if (/보유|키움|사육중|보유중|있음|own|키핑|양육/.test(s)) return { status: 'own' };
  if (/외부|빌림|대여|위탁|임대/.test(s)) return { external: true };
  return null;
}

/* 먹이 종류 — 앱은 충식/슈푸 두 가지로 봅니다 */
function foodType(t) {
  const s = clean(t);
  if (/귀뚜|귀뚤|밀웜|슈퍼웜|두비아|레드런|충식|곤충|벌레|로치|실크웜|cricket|roach|worm/i.test(s)) return '충식';
  if (/슈푸|슈퍼푸드|판게아|레파시|cgd|슬러리|사료|이유식|파우더|pangea|repashy|과일|퓨레/i.test(s)) return '슈푸';
  return '';
}

/* ───────── 이름 ───────── */
function nameKey(n) { return clean(n).toLowerCase().replace(/[\s'"`.·_\-]/g, ''); }
/* 이름 칸 다듬기 — 번호 떼기, 괄호 속 성별 뽑기 */
function tidyName(raw) {
  let s = clean(raw);
  let g = null;
  const gm = s.match(/[(\[]\s*([^)\]]{1,8})\s*[)\]]/);
  if (gm) { const gg = gender(gm[1]); if (gg) { g = gg; s = (s.slice(0, gm.index) + s.slice(gm.index + gm[0].length)).trim(); } }
  const sym = s.match(/\s*([♀♂])\s*/);
  if (sym) { g = gender(sym[1]); s = s.replace(sym[0], ' ').trim(); }
  s = s.replace(/^(no\.?|#|넘버)\s*\d+[.)\s:-]*/i, '').replace(/^\d{1,3}[.)]\s+/, '').trim();
  s = s.replace(/^[-·•*]+\s*/, '').trim();
  return { name: s, gender: g };
}
const NOT_NAME = /^(합계|총계|소계|계|총|합|평균|total|sum|없음|모름|미상|미정|-+|\?+|x|o|v|n\/a|na|외부|샵|타샵|수입|구입|업체|브리더)$/i;
function looksName(s) {
  const t = clean(s);
  if (!t || t.length > 24 || NOT_NAME.test(t)) return false;
  if (/^\d+(?:\.\d+)?$/.test(t)) return false;
  if (gender(t) && !/^(베이비|아기|애기|해츨링|유체)$/.test(t)) return false;   // "베이비"는 이름으로도 씁니다
  if (cellDate({ t }, { dateCol: true, today: '2026-01-01' })) {
    const d = cellDate({ t }, { dateCol: true, today: '2026-01-01' });
    if (d && !d.rest) return false;
  }
  return true;
}

/* ───────── 모프 낱말 (값을 보고 모프 칸인지 알아볼 때) ───────── */
const MORPH_RE = /노말|할리|릴리|핀|달마|익스트림|파이어|플레임|트라이|브린들|타이거|팬텀|세이블|카푸|프라푸|푸라푸|아잔틱|솔리드|슈퍼|헷|초초|크림|크림시클|바이|레드|옐로|오렌지|초코|블랙|버프|올리브|라벤더|패턴리스|포트홀|화이트|루왁|챠콜|차콜|하이포|쿼드|엑스|페일|다크|레터럴|도살|풀핀|nor|harley|lilly|lily|dalmatian|pinstripe|flame|tiger|brindle|phantom|sable|cappuccino|frappuccino|axanthic|extreme|tricolor|bicolor|creamsicle|hypo|cold ?fusion|patternless|red|yellow|orange|black|buckskin|olive|charcoal/i;

/* ══════════════════════════════════════════
   칸 이름 사전
   [칸 종류, 정확히 같은 말들, 들어 있으면 되는 말들]
   ══════════════════════════════════════════ */
const HDR = [
  ['name',    ['이름','개체명','개체이름','개체','닉네임','애칭','명칭','네임','name','개체명칭','아이이름','아이','게코','게코이름','도마뱀','개체명닉네임','nickname','이름닉네임','크레','크레이름'], ['이름','개체명','닉네임','애칭','name']],
  ['number',  ['번호','no','넘버','순번','연번','순서','num','개체번호','관리번호','n','number','id','개체id','코드','개체코드','고유번호'], ['번호','넘버','순번']],
  ['gender',  ['성별','암수','성','sex','gender','암수구분','성구분','암수여부','성별구분','♀♂','암수성별'], ['성별','암수','sex','gender']],
  ['morph',   ['모프','품종','형질','모프명','morph','morphs','trait','traits','유전','유전자','발현','컬러','색','색상','타입','모프타입','종','종류모프','모프이름'], ['모프','morph','형질','품종','trait']],
  ['morphFeat',['모프특징','모프특징사항','특징','외형','패턴','무늬','외모','특징사항','생김새'], ['특징','패턴','무늬','외형']],
  ['spots',   ['점','점여부','점유무','달마점','스팟','spots','spot','달마','점개수','점갯수'], ['점여부','점유무','스팟','달마점','점개수','점갯수']],
  ['hatchX',  ['해칭일','해칭','부화일','부화','생일','생년월일','생년원일','출생일','출생','태어난날','해칭날짜','부화날짜','hatch','hatchdate','hatched','birth','birthday','dob','해칭일자','부화일자','출생일자','생년','탄생일','해칭일생일','해칭일부화일','태어난날짜','해치일'], ['해칭일','부화일','생년','출생','생일','hatch','birth','해칭날짜','부화날짜']],
  ['age',     ['나이','개월','월령','개월수','age','연령','개월령'], ['나이','개월','월령']],
  ['adoptDate',['입양일','입양날짜','데려온날','구입일','구매일','분양받은날','들인날','입수일','입양일자','구입날짜','구매날짜','입고일','adopted','purchased','acquired','입양받은날','데려온날짜','들여온날'], ['입양일','입양날짜','구입일','구매일','입수일','데려온','들인날','들여온']],
  ['partyX',  ['분양처','분양받은곳'], []],
  ['source',  ['입양처','구입처','구매처','출처','브리더','샵','매장','데려온곳','입양경로','구입경로','source','breeder','from','입수처','입양업체','구입업체','판매자','분양해준곳','데려온데','매입처','분양샵'], ['입양처','구입처','구매처','출처','브리더','입수처','판매자','매입처']],
  ['buyPrice',['입양가','구입가','구매가','구입가격','구매가격','입양가격','입양비','매입가','산가격','구입비','cost','입양금액','구입금액','구매금액','산값','데려온가격','입양가만원','구입가만원'], ['입양가','구입가','구매가','매입','입양비','구입비','입양금액','구입금액']],
  ['salePrice',['분양가','판매가','판매가격','분양가격','판가','분양금액','판매금액','saleprice','분양가만원','판매가만원','분양비','판값'], ['분양가','판매가','분양금액','판매금액','분양비']],
  ['priceX',  ['가격','가격만원','price','값','가격원','가격천원'], []],
  ['saleDate',['분양일','판매일','분양날짜','판매날짜','출고일','보낸날','분양일자','판매일자','입양보낸날','solddate','분양완료일','분양보낸날','출고날짜','판매완료일'], ['분양일','판매일','출고일','분양날짜','판매날짜','보낸날']],
  ['buyer',   ['입양자','분양자','구매자','구입자','입양보낸곳','분양받은사람','새주인','고객','판매처','받은사람','buyer','customer','입양자명','분양받는분','구매고객','입양간곳','분양간곳','보낸곳','입양처분양','데려간사람'], ['입양자','구매자','구입자','고객','새주인','분양받은','입양간','분양간','데려간']],
  ['status',  ['상태','분양여부','분양상태','판매상태','보유여부','현황','판매여부','status','상태값','현재상태','보유','분양','판매','분양현황','보유상태','생존','생존여부'], ['상태','여부','현황','status']],
  ['keep',    ['킵','keep','킵여부','보유킵','종개체','브리딩용','소장','킵개체'], ['킵','keep']],
  ['dad',     ['부','부개체','아빠','父','부모수컷','sire','father','부수컷','아비','부친','수컷부모','dad','부개체명','아빠개체','부이름','아빠이름','sire명'], ['아빠','sire','father','부개체','부이름']],
  ['mom',     ['모','모개체','엄마','母','dam','mother','어미','모친','모암컷','mom','모체','모개체명','엄마개체','모이름','엄마이름','dam명'], ['엄마','어미','mother','모개체','모이름']],
  ['parents', ['부모','부x모','부모개체','부모님','parents','부모정보','부모부x모','부모x','부모부모','혈통부모'], ['부모']],
  ['pair',    ['페어','pair','조합','메이팅페어','짝','커플','페어링','페어조합','교배조합','수x암','암x수','수컷x암컷','암컷x수컷'], ['페어','pair','조합','커플']],
  ['lineage', ['혈통','라인','계보','혈통정보','lineage','line','bloodline','혈','혈통라인'], ['혈통','계보','lineage','bloodline']],
  ['weight',  ['무게','체중','몸무게','g','그램','weight','무게g','체중g','중량','몸무게g','무게그램','kg'], ['무게','체중','weight','중량']],
  ['weightDate',['측정일','무게측정일','체중측정일','측정날짜','잰날','측정일자'], ['측정일','측정날짜']],
  ['notes',   ['특이사항','비고','메모','노트','기타','참고','설명','note','notes','memo','remarks','remark','comment','코멘트','특이','참고사항','기타사항','특이점','주의사항','비고란','메모사항','comments','추가사항'], ['특이','비고','메모','참고','note','memo','remark','comment','코멘트']],
  ['photo',   ['사진','이미지','링크','url','photo','image','사진링크','사진주소','pic'], ['사진','이미지','photo','url','링크','image']],
  ['dateX',   ['날짜','일자','일시','날','date','기록일','작성일','day','언제','일','기록날짜','기록일자','년월일','날자'], ['날짜','일자','date','날자']],
  ['female',  ['암컷','암','female','암컷이름','암개체','산란개체','암컷명','♀','암놈','메스','암컷개체'], ['암컷','female','암개체']],
  ['male',    ['수컷','숫','수컷이름','숫컷','male','수개체','수컷명','♂','숫놈','수컷개체','숫컷이름'], ['수컷','숫컷','수개체']],
  ['matingX', ['메이팅일','메이팅날짜','메이팅','합사일','교배일','합방일','메이팅일자','합사','교배','mating','matingdate','페어링일','합사날짜','교배날짜','합방','메이팅시작일','합사시작'], ['메이팅','합사','교배','합방','mating','페어링']],
  ['layX',    ['산란일','산란날짜','산란','산란확인일','알확인일','클러치일','산란일자','laydate','laid','산란확인','알발견일','알날짜','산란일시','알받은날','알나온날'], ['산란','laid','laydate','알확인','알발견','알받은','알나온']],
  ['eggCount',['알','알개수','알수','개수','산란수','알갯수','수량','eggs','egg','알개','산란개수','알몇개','알총','총알','eggcount'], ['알개수','알수','알갯수','개수','egg','산란수','산란개수','알몇']],
  ['fertile', ['유정','유정란','유정수','유정알','유정개수'], ['유정']],
  ['infertile',['무정','무정란','무정수','무정알','무정란수','무정개수','슬러그','slug'], ['무정','slug','슬러그']],
  ['hatchCount',['해칭수','부화수','해칭개수','부화개수','마리수','부화마리','해칭마리','부화된수','태어난수','부화마리수','해칭마리수'], ['해칭수','부화수','마리','해칭개수','부화개수']],
  ['expected',['부화예정일','해칭예정일','예정일','예정','예상부화일','부화예정','expected','due','해칭예정','예상일','부화예상일','해칭예상일'], ['예정','예상','due','expected']],
  ['clutchNo',['차수','클러치','회차','클러치번호','산란차수','clutch','클러치차수','몇차'], ['차수','회차']],
  ['incub',   ['인큐','인큐온도','온도','습도','부화온도','인큐베이터','인큐베이팅','온습도','temp','temperature','humidity'], ['인큐','온도','습도']],
  ['food',    ['먹이','급여','피딩','사료','급여량','먹이종류','밥','급식','feeding','food','feed','먹이량','급여먹이','먹은것','먹이내용'], ['먹이','급여','피딩','사료','food','feed','밥']],
  ['ate',     ['섭취','먹음','먹었는지','반응','먹었나','섭취여부','먹방','섭취량','먹은양','먹었어'], ['섭취','먹었']],
  ['shed',    ['탈피','탈피일','탈피여부','shed','shedding','탈피날짜','허물'], ['탈피','shed','허물']],
  ['health',  ['이상','증상','건강','질병','병','이상증상','health','건강상태','컨디션','상태건강'], ['증상','건강','질병','컨디션']],
  ['text',    ['내용','기록','일지','활동','한일','이벤트','메모내용','일기','log','content','diary','기록내용','사항','내역기록','일어난일','한것'], ['내용','일지','일기','log']],
  ['amount',  ['금액','비용','액수','원','amount','지불액','결제금액','사용금액','금액원','금액만원','돈','cost원','가격금액','결제액'], ['금액','비용','amount','액수','결제']],
  ['income',  ['수입','입금','수입금액','수입액','들어온돈','매출','income','in','수익','판매수입','입금액'], ['수입','입금','매출','income','수익']],
  ['expense', ['지출','출금','지출금액','지출액','나간돈','사용액','expense','out','비용지출','출금액','지출비용'], ['지출','출금','expense']],
  ['flow',    ['구분','수입/지출','수입지출','입출','입출금','유형','종류','type','입출구분','수지','inout','지출수입','구분수입지출'], ['수입지출','지출수입','입출']],
  ['category',['분류','카테고리','항목','category','계정','계정과목','용도','대분류','분류항목'], ['분류','카테고리','항목','용도','category']],
  ['item',    ['품목','상세','적요','사용처','내역','상품','물품','item','description','구입품목','상품명','제품','구입내역','사용내역','상세내역','품명','구매처가계부'], ['품목','적요','내역','상세','사용처','상품','물품','품명','제품']],
  ['balance', ['잔액','잔고','누계','누적','합계','총액','balance','total','소계','누적합계','잔금','누적금액'], ['잔액','잔고','누계','누적']],
];
const HDR_EXACT = new Map();
const HDR_CONTAINS = [];
HDR.forEach(([f, ex, co]) => {
  ex.forEach(w => { const k = hkey(w); if (k && !HDR_EXACT.has(k)) HDR_EXACT.set(k, f); });
  co.forEach(w => HDR_CONTAINS.push([hkey(w), f]));
});
HDR_CONTAINS.sort((a, b) => b[0].length - a[0].length);

/* 칸 이름 → 칸 종류 (못 알아보면 null) */
function headerField(text) {
  const raw = clean(text);
  if (!raw || raw.length > 30) return null;
  const k = hkey(raw);
  if (!k) return null;
  // "1차", "1차 산란확인일", "2nd clutch"
  const ln = k.match(/^(\d{1,2})(?:차|번째|st|nd|rd|th)/) || k.match(/^clutch(\d{1,2})$/) || k.match(/^(\d{1,2})클러치/);
  if (ln && !/예정|예상|부화|해칭/.test(k)) return (/개수|갯수|알수|수량|egg|몇개|개$|알$/.test(k.slice(ln[0].length)) ? 'layNc:' : 'layN:') + (+ln[1]);
  if (HDR_EXACT.has(k)) return HDR_EXACT.get(k);
  // 단위만 붙은 경우: "무게(g)" → "무게g" 는 사전에 있음. "분양가(만원)" → 앞부분으로
  const k2 = hkey(raw.replace(/\((?:[^)]{0,6})\)$/, ''));
  if (k2 && HDR_EXACT.has(k2)) return HDR_EXACT.get(k2);
  if (k.length === 1) return null;
  for (const [w, f] of HDR_CONTAINS) if (w.length >= 2 && k.includes(w)) return f;
  return null;
}
/* 칸 이름에 붙은 돈 단위 */
function unitOf(header) {
  const h = clean(header);
  if (/만\s*원|\(만\)|만원단위|단위\s*:?\s*만/.test(h)) return 10000;
  if (/천\s*원|\(천\)/.test(h)) return 1000;
  if (/\(\s*원\s*\)|원\s*$|₩/.test(h)) return 1;
  return 0;
}

/* ══════════════════════════════════════════
   격자 만들기 — 엑셀(SheetJS) · CSV · 붙여넣기
   칸 하나 = { t: 글자, n?: 숫자, d?: 'YYYY-MM-DD' }
   ══════════════════════════════════════════ */
const MAX_ROWS = 6000, MAX_COLS = 80;
function trimGrid(rows) {
  let lastR = -1, lastC = -1;
  rows.forEach((r, i) => r.forEach((c, j) => { if (c && clean(c.t)) { if (i > lastR) lastR = i; if (j > lastC) lastC = j; } }));
  return rows.slice(0, lastR + 1).map(r => {
    const out = r.slice(0, lastC + 1);
    while (out.length < lastC + 1) out.push(null);
    return out;
  });
}
function gridsFromWorkbook(XLSX, wb) {
  const out = [];
  (wb.SheetNames || []).forEach(name => {
    const ws = wb.Sheets[name];
    if (!ws || !ws['!ref']) return;
    const R = XLSX.utils.decode_range(ws['!ref']);
    const r1 = Math.min(R.e.r, R.s.r + MAX_ROWS), c1 = Math.min(R.e.c, R.s.c + MAX_COLS);
    const rows = [];
    for (let r = 0; r <= r1; r++) {
      const row = [];
      for (let c = 0; c <= c1; c++) {
        const cell = ws[XLSX.utils.encode_cell({ r, c })];
        row.push(cellFromSheet(XLSX, cell));
      }
      rows.push(row);
    }
    // 합쳐진 칸(병합)은 모든 자리에 같은 값을 채웁니다 — 한 암컷의 산란이 여러 줄일 때 흔합니다
    (ws['!merges'] || []).forEach(m => {
      const src = rows[m.s.r] && rows[m.s.r][m.s.c];
      if (!src) return;
      for (let r = m.s.r; r <= Math.min(m.e.r, r1); r++) for (let c = m.s.c; c <= Math.min(m.e.c, c1); c++) {
        if (r === m.s.r && c === m.s.c) continue;
        if (rows[r]) rows[r][c] = { ...src, merged: true };
      }
    });
    const hidden = ws['!rows'] ? ws['!rows'].map(x => !!(x && x.hidden)) : [];
    const tg = trimGrid(rows);
    // 엑셀 한 칸에 "1 - 해롱. 릴리. 250721 …" 처럼 줄글로 적어 둔 시트도 목록으로 읽습니다
    const cols = new Set();
    tg.forEach(r => r.forEach((c, j) => { if (c && clean(c.t)) cols.add(j); }));
    if (cols.size === 1) {
      const j = [...cols][0];
      const listed = listLinesToGrid(tg.map(r => (r[j] ? S(r[j].t) : '')));
      if (listed) { out.push({ sheet: name, rows: listed, hidden: [], listed: true }); return; }
    }
    out.push({ sheet: name, rows: tg, hidden });
  });
  return out;
}
function cellFromSheet(XLSX, cell) {
  if (!cell) return null;
  if (cell.t === 'e' || cell.t === 'z') return null;
  if (cell.t === 'd' && cell.v instanceof Date) {
    const v = cell.v;
    return { t: cell.w || '', d: iso(v.getFullYear(), v.getMonth() + 1, v.getDate()) };
  }
  if (cell.t === 'n') {
    const out = { t: cell.w != null ? String(cell.w) : String(cell.v), n: cell.v };
    let isDate = false;
    try { isDate = !!(cell.z && XLSX.SSF && XLSX.SSF.is_date(cell.z)); } catch (e) { isDate = false; }
    if (isDate) {
      try {
        const p = XLSX.SSF.parse_date_code(cell.v);
        if (p && validYMD(p.y, p.m, p.d)) out.d = iso(p.y, p.m, p.d);
      } catch (e) {}
    }
    return out;
  }
  if (cell.t === 'b') return { t: cell.v ? 'TRUE' : 'FALSE' };
  const t = S(cell.w != null && cell.t !== 's' ? cell.w : cell.v);
  return t.trim() ? { t } : null;
}
function splitCSVLine(line, sep) {
  const out = [];
  let cur = '', q = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (q) {
      if (ch === '"') { if (line[i + 1] === '"') { cur += '"'; i++; } else q = false; }
      else cur += ch;
    } else if (ch === '"' && cur === '') q = true;
    else if (ch === sep) { out.push(cur); cur = ''; }
    else cur += ch;
  }
  out.push(cur);
  return out;
}

/* ══════════════════════════════════════════
   줄글 개체 목록 — 메모장·카톡에 흔한 모양
     "1 - 해롱. 릴리. 250721. 여왕x진격. 키큰남자 : 시루"
     "4 - 방울. 노멀. 2503월생. 암추"
   한 줄 = 한 아이. 점(또는 / , ·)으로 나눈 조각을 "생김새"로 가립니다.
     이름(첫 조각) · 모프 · 해칭일(250721 / 2511 / 2503월생) · 부모(AxB, 부-알파) · 입양처(남은 조각) · 성별
   알아본 대로 제목줄을 붙인 표로 바꿔서, 엑셀과 똑같은 길로 넘깁니다(화면에서 칸을 고칠 수도 있게).
   ══════════════════════════════════════════ */
const MORPH_MORE = /노멀|노말|차콜|아잔|오닉스|옐로|벅|스트로베리|세릴|릴잔|sft|spt|쿼드|핀타입|헷|달마|트라이|레드|크림|세이블|릴리|할리|팬텀|초초|솔리드|바이|브린들|타이거|플레임|익스|파이어|다크|페일|버프|올리브|라벤더|바브|쿠키|모카|라떼|오렌지|초코|블랙|화이트|루왁|하이포|카푸|프라푸|푸라푸|아잔틱|바브라인|morph/i;
const LIST_SEPS = [
  { re: /\.(?:\s+|$)/, name: 'dot' },
  { re: /\s*\/\s*/, name: 'slash' },
  { re: /\s*,\s*/, name: 'comma' },
  { re: /\s*[·•|]\s*/, name: 'middot' },
];
const NUM_HEAD = /^\s*(?:no\.?\s*)?#?\d{1,4}\s*(?:[-–—.)·:]|번)\s*/i;
function listTokens(line, sep) {
  // "2025. 7. 21." 처럼 점 뒤에 띄어 쓴 날짜는 먼저 붙여 둡니다(조각 가르기에 휩쓸리지 않게)
  let t = clean(line).replace(/(\d{2,4})\.\s*(\d{1,2})\.\s*(\d{1,2})\.?(?=\s|$)/g, '$1-$2-$3');
  t = t.replace(NUM_HEAD, '');
  let toks = t.split(sep.re).map(x => clean(x)).filter(Boolean);
  // "250818 부-알파" 처럼 점을 빠뜨려 붙은 조각은 날짜와 나머지로 가릅니다
  const out = [];
  toks.forEach(x => {
    const m = x.match(/^(\d{4,8}(?:\s*(?:월생|월|생))?(?:\s*추정)?)\s+(\S.*)$/);
    if (m && !/^(추정|생)/.test(m[2])) { out.push(m[1]); out.push(m[2]); } else out.push(x);
  });
  return out;
}
function tokenType(x) {
  const t = clean(x);
  const s = t.replace(/\s/g, '');
  if (s.length <= 4 && (gender(s) || /^(암|수|숫)추/.test(s))) return 'gender';
  if (/부모\s*사진|사진\s*[xX없]/.test(t)) return 'note';
  if (/^\d{6}$/.test(s)) { const y = 2000 + +s.slice(0, 2), m = +s.slice(2, 4), d = +s.slice(4, 6); if (validYMD(y, m, d)) return 'date'; }
  if (/^\d{8}$/.test(s)) { const y = +s.slice(0, 4), m = +s.slice(4, 6), d = +s.slice(6, 8); if (validYMD(y, m, d)) return 'date'; }
  if (/^\d{4}(월생|월|생)?(추정)?$/.test(s)) { const y = +s.slice(0, 2), m = +s.slice(2, 4); if (y >= 10 && y <= 40 && m >= 1 && m <= 12) return 'date'; }
  if (/\d/.test(s) && /(월생|생|추정)$/.test(s) && s.length <= 12) return 'birthnote';
  const fd = findDate(t, { today: '2026-01-01', loose: false });
  if (fd && t.length - fd.len <= 3) return 'date';
  if (/[가-힣A-Za-z0-9]\s*[x×X*]\s*[가-힣A-Za-z0-9]/.test(t) && !/^\d+[xX]\d+$/.test(s) && !/헷|het/i.test(t.replace(/\s*[x×X*]\s*[가-힣A-Za-z0-9]+$/, ''))) return 'parents';
  if (/^(부|모|父|母|아빠|엄마)\s*[-:]\s*\S/.test(t) || /\s(부|모)\s*-\s*\S/.test(t)) return 'parents';
  if (MORPH_RE.test(t) || MORPH_MORE.test(t)) return 'morph';
  return 'unknown';
}
/* 날짜 조각을 표 칸에 넣을 글로 — 250721 → 2025-07-21, 2511 → 25.11 (일자 미상) */
function tokenDate(x) {
  const s = clean(x).replace(/\s/g, '');
  if (/^\d{6}$/.test(s)) return `20${s.slice(0, 2)}-${s.slice(2, 4)}-${s.slice(4, 6)}`;
  if (/^\d{8}$/.test(s)) return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;
  const m = s.match(/^(\d{2})(\d{2})/);
  if (m && /^\d{4}(월생|월|생)?(추정)?$/.test(s)) return `${m[1]}.${m[2]}`;
  return clean(x);
}
function listLinesToGrid(lines, name) {
  const filled = lines.map(l => clean(l)).filter(Boolean);
  if (filled.length < 2) return null;
  let best = null;
  LIST_SEPS.forEach(sep => {
    const ok = filled.filter(l => listTokens(l, sep).length >= 3).length;
    if (!best || ok > best.ok) best = { sep, ok };
  });
  if (!best || best.ok < Math.max(2, filled.length * 0.5)) return null;
  const sep = best.sep;
  const HEAD = ['이름', '모프', '해칭일', '혈통', '입양처', '성별', '메모'];
  const rows = [HEAD.map(h => ({ t: h }))];
  const numbered = filled.filter(l => NUM_HEAD.test(l)).length >= filled.length * 0.5;
  filled.forEach(line => {
    const toks = listTokens(line, sep);
    const isNumbered = NUM_HEAD.test(line);
    // "(선주 윌리-심바x만시 라인)" 처럼 괄호로 덧붙인 줄·조각 하나뿐인 줄은 바로 위 아이의 메모로
    const cont = /^[(\[（]/.test(clean(line)) || toks.length < 2 || (numbered && !isNumbered && toks.length < 3);
    if (cont && rows.length > 1) {
      const prev = rows[rows.length - 1];
      const txt = clean(line).replace(/^[(\[（]\s*|\s*[)\]）]$/g, '');
      prev[6] = { t: [prev[6] && prev[6].t, txt].filter(Boolean).join(' · ') };
      return;
    }
    const row = new Array(7).fill(null);
    const put = (i, v) => { row[i] = { t: row[i] ? row[i].t + ' · ' + v : v }; };
    put(0, toks[0]);
    const rest = toks.slice(1).map(x => ({ x, type: tokenType(x) }));
    // 모프: 이름 바로 다음 조각(날짜·성별·부모가 아니면), 없으면 모프 낱말이 든 첫 조각
    let mi = rest.findIndex((r, i) => i === 0 && (r.type === 'unknown' || r.type === 'morph'));
    if (mi < 0) mi = rest.findIndex(r => r.type === 'morph');
    if (mi >= 0) { put(1, rest[mi].x); rest[mi].done = true; }
    let dated = false;
    rest.forEach(r => {
      if (r.done) return;
      if (r.type === 'date' && !dated) { const v = tokenDate(r.x); put(2, v); if (/추정/.test(r.x)) put(6, '출생 추정'); dated = true; r.done = true; }
      else if (r.type === 'birthnote') { put(6, '출생 ' + r.x); r.done = true; }
      else if (r.type === 'gender') { const s = r.x.replace(/\s/g, ''); put(5, /추/.test(s) ? s.replace(/추(정)?/, '') + '(추정)' : r.x); r.done = true; }
      else if (r.type === 'parents') { put(3, r.x); r.done = true; }
      else if (r.type === 'note') { put(6, r.x); r.done = true; }
    });
    // 남은 조각: 맨 뒤 것은 입양처, 그 앞 것들은 메모
    const left = rest.filter(r => !r.done);
    if (left.length) {
      put(4, left[left.length - 1].x);
      left.slice(0, -1).forEach(r => put(6, r.x));
    }
    rows.push(row);
  });
  return trimGrid(rows);
}

/* 글(붙여넣기·CSV·메모장) → 격자 */
function gridsFromText(text, name) {
  const src = S(text).replace(/^﻿/, '').replace(/\r\n?/g, '\n');
  const lines = src.split('\n');
  while (lines.length && !lines[lines.length - 1].trim()) lines.pop();
  const filled = lines.filter(l => l.trim());
  const tabs = filled.filter(l => l.includes('\t')).length;
  const commas = filled.filter(l => (l.match(/,/g) || []).length >= 2).length;
  let sep = null;
  if (tabs >= Math.max(1, filled.length * 0.3)) sep = '\t';
  else if (commas >= Math.max(2, filled.length * 0.6)) sep = ',';
  const toCell = s => {
    const t = S(s).trim();
    if (!t) return null;
    const c = { t };
    if (/^-?\d+(?:\.\d+)?$/.test(t.replace(/,/g, '')) && !/^0\d/.test(t)) c.n = parseFloat(t.replace(/,/g, ''));
    return c;
  };
  let rows;
  if (sep) {
    // 따옴표 안의 줄바꿈까지 챙기려고 다시 이어 붙입니다
    rows = [];
    let buf = '';
    lines.forEach(l => {
      buf = buf ? buf + '\n' + l : l;
      if (((buf.match(/"/g) || []).length % 2) === 0) { rows.push(splitCSVLine(buf, sep).map(toCell)); buf = ''; }
    });
    if (buf) rows.push(splitCSVLine(buf, sep).map(toCell));
  } else {
    // 줄마다 "이름. 모프. 날짜…" 로 적은 목록이면 표로 바꿔 넘깁니다
    const listed = listLinesToGrid(lines);
    if (listed) return [{ sheet: name || '붙여넣은 목록', rows: listed, hidden: [], listed: true }];
    rows = lines.map(l => [toCell(l)]);
  }
  return [{ sheet: name || '붙여넣은 표', rows: trimGrid(rows), hidden: [], text: !sep }];
}

/* ══════════════════════════════════════════
   칸 성질 재기 — 값이 무엇처럼 생겼는지
   ══════════════════════════════════════════ */
function profile(vals, today) {
  const p = { n: 0, date: 0, num: 0, gender: 0, ox: 0, money: 0, morph: 0, name: 0, uniq: 0, long: 0, small: 0, parents: 0, status: 0, flow: 0, seq: 0 };
  const seen = new Set();
  let prevNum = null, seqRun = 0;
  vals.forEach(c => {
    const t = clean(c && c.t);
    if (!t && !(c && typeof c.n === 'number')) return;
    p.n++;
    const dt = cellDate(c, { dateCol: true, today });
    if (dt && !dt.rest) p.date++;
    const nv = typeof (c && c.n) === 'number' && !c.d ? c.n : (/^-?[\d,]+(\.\d+)?$/.test(t) ? parseFloat(t.replace(/,/g, '')) : null);
    if (nv !== null && !(dt && !dt.rest && !(c && typeof c.n === 'number' && !serialToISO(c.n)))) {
      p.num++;
      if (Math.abs(nv) <= 30 && Number.isInteger(nv)) p.small++;
      if (prevNum !== null && nv === prevNum + 1) seqRun++;
      prevNum = nv;
    }
    if (gender(t)) p.gender++;
    if (ox(t) !== null) p.ox++;
    if (/\d\s*(만|천|원)|₩|^[\d,]+원$/.test(t) || FREE_RE.test(t)) p.money++;
    if (MORPH_RE.test(t)) p.morph++;
    if (looksName(t) && t.length <= 10 && !/\s.*\s/.test(t) && !MORPH_RE.test(t) && !/\d{2,}/.test(t)) p.name++;
    if (t.length >= 16) p.long++;
    if (/\S\s*(x|×|\*|&|\+)\s*\S/i.test(t) && t.length <= 30) p.parents++;
    if (statusOf(t)) p.status++;
    if (/^(수입|지출|입금|출금|\+|-|in|out|매출|비용)$/i.test(t)) p.flow++;
    seen.add(t);
  });
  p.uniq = p.n ? seen.size / p.n : 0;
  p.seq = p.n > 2 && seqRun >= p.n - 2 ? 1 : 0;
  const r = k => (p.n ? p[k] / p.n : 0);
  p.r = r;
  return p;
}

/* ══════════════════════════════════════════
   표 나누기 — 제목줄 찾기, 옆으로 붙은 표 가르기
   ══════════════════════════════════════════ */
function rowText(row, c) { return clean(row && row[c] && row[c].t); }
function headerScore(row) {
  let s = 0, cells = 0;
  (row || []).forEach(c => {
    const t = clean(c && c.t);
    if (!t) return;
    cells++;
    if (c && typeof c.n === 'number' && !/차/.test(t)) return;
    if (headerField(t)) s++;
  });
  return { s, cells };
}
/* 날짜처럼 생긴 칸 제목("1/5", "9월 1일", "1월", 진짜 날짜) */
function dateHeader(c, today) {
  if (!c) return false;
  if (c.d) return true;
  const t = clean(c.t);
  if (!t || t.length > 14) return false;
  if (/^\d{1,2}\s*월$/.test(t)) return true;
  if (headerField(t)) return false;
  const d = cellDate(c, { dateCol: true, today });
  return !!(d && !d.rest);
}
function findBlocks(grid, today) {
  const rows = grid.rows;
  const H = Math.min(rows.length, 25);
  let best = -1, bestS = 0;
  // 칸 아래 값이 숫자·O/X 로 채워져 있는지 (가로 날짜 표·세로 날짜 표를 알아보는 데 씁니다)
  const belowIsValue = (r, c) => {
    let n = 0, v = 0;
    for (let k = r + 1; k < Math.min(rows.length, r + 30); k++) {
      const x = rows[k] && rows[k][c];
      const t = clean(x && x.t);
      if (!t) continue;
      n++;
      if ((typeof x.n === 'number' && !x.d) || ox(t) !== null || /^\d+(\.\d+)?\s*g?$/i.test(t) || t.length <= 8) v++;
    }
    return n > 0 && v / n >= 0.6;
  };
  for (let r = 0; r < H; r++) {
    let { s, cells } = headerScore(rows[r]);
    if (s >= 1) {
      const row = rows[r] || [];
      const dh = row.filter(c => dateHeader(c, today)).length;
      if (dh >= 2) s += dh;
      else {
        const nh = row.map((c, i) => [c, i]).filter(([c, i]) => c && !headerField(c.t) && looksName(c.t) && !dateHeader(c, today) && belowIsValue(r, i)).length;
        if (nh >= 2 && row.some(c => c && ['dateX', 'layX', 'weightDate'].includes(headerField(c.t)))) s += nh;
      }
    }
    // 제목줄은 알아본 칸이 2개 이상이고, 채워진 칸의 40% 이상이 칸 이름이어야 합니다
    if (s >= 2 && s >= cells * 0.4 && s > bestS) { best = r; bestS = s; }
  }
  const width = rows.reduce((m, r) => Math.max(m, r.length), 0);
  if (best < 0) {
    // 제목줄이 없는 표 — 값만 보고 알아봅니다
    const cols = [];
    for (let c = 0; c < width; c++) if (rows.some(r => clean(r[c] && r[c].t))) cols.push(c);
    return cols.length ? [{ headerRow: -1, cols, start: 0 }] : [];
  }
  const hr = rows[best];
  // 두 줄 제목: 위 줄에 "1차", "2차" 같은 묶음 이름이 있으면 아래 칸에 붙입니다
  const above = best > 0 ? rows[best - 1] : null;
  const data = rows.slice(best + 1);
  const colHasData = c => data.some(r => clean(r[c] && r[c].t));
  const used = [];
  for (let c = 0; c < width; c++) used.push(!!clean(hr[c] && hr[c].t) || colHasData(c));
  // 빈 칸(제목도 값도 없는 세로줄)을 경계로 표를 가릅니다
  const groups = [];
  let cur = [];
  for (let c = 0; c < width; c++) {
    if (used[c]) cur.push(c);
    else if (cur.length) { groups.push(cur); cur = []; }
  }
  if (cur.length) groups.push(cur);
  // 두 줄 제목 — 바로 아래 줄도 칸 이름(날짜·개수…)이면 위아래를 붙여 읽습니다
  let sub = null;
  const nx = rows[best + 1];
  if (nx) {
    const filled = nx.filter(c => clean(c && c.t));
    const hdrs = filled.filter(c => typeof c.n !== 'number' && !c.d && headerField(c.t));
    if (hdrs.length >= 2 && hdrs.length >= filled.length * 0.6) sub = nx;
  }
  const start = sub ? best + 2 : best + 1;
  const data2 = rows.slice(start);
  const hasData2 = c => data2.some(r => clean(r[c] && r[c].t));
  // 아래에 값이 하나도 없는 조각(제목줄 옆 "분양가 합 1573 만원" 같은 것)은 표가 아닙니다
  return groups.filter(cols => cols.some(hasData2)).map(cols => ({ headerRow: best, cols, start, above, sub }));
}

/* ══════════════════════════════════════════
   시트 종류
   ══════════════════════════════════════════ */
const KIND_LABEL = {
  animals: '개체 목록', mating: '메이팅 기록', laying: '산란 기록', events: '날짜별 기록',
  grid: '날짜 칸 표', gridT: '날짜 줄 표', ledger: '가계부', diary: '일지(글)', skip: '가져오지 않음',
};
const MODE_LABEL = { own: '내가 키우는 아이', hatch: '내가 해칭한 아이', sold: '분양 보낸 아이', available: '분양 내놓은 아이' };
const FIELD_LABEL = {
  name: '이름', number: '번호(안 가져옴)', gender: '성별', morph: '모프', morphFeat: '모프 특징', spots: '점여부',
  hatchDate: '해칭일(생일)', age: '나이', adoptDate: '입양일', source: '입양처(데려온 곳)',
  buyPrice: '입양가(산 값)', salePrice: '분양가(판 값)', saleDate: '분양일', buyer: '분양처(보낸 곳)',
  status: '상태', keep: 'KEEP', sire: '부(아빠)', dam: '모(엄마)', parents: '부모(부×모)', lineage: '혈통',
  weight: '무게(g)', weightDate: '무게 잰 날', notes: '메모·특이사항', photo: '사진(안 가져옴)',
  date: '날짜', female: '암컷', male: '수컷', pair: '페어(수×암)', matingDate: '메이팅일', layDate: '산란일',
  eggCount: '알 개수', fertile: '유정 알', infertile: '무정 알', clutchHatch: '부화일(알)', hatchCount: '부화 마릿수',
  expected: '부화 예정일(앱이 계산)', clutchNo: '차수', layN: 'N차 산란일', layNc: 'N차 알 개수', food: '먹이', ate: '먹었는지', shed: '탈피',
  health: '이상·증상', text: '내용(글)', amount: '금액', income: '수입 금액', expense: '지출 금액', flow: '수입/지출',
  category: '분류', item: '내용·품목', balance: '잔액(안 가져옴)', subject: '개체 이름', gridDate: '날짜 칸', ignore: '안 가져옴',
  incub: '온습도(메모)',
};
const FIELDS_BY_KIND = {
  animals: ['name','gender','morph','morphFeat','spots','hatchDate','adoptDate','source','buyPrice','salePrice','saleDate','buyer','status','keep','sire','dam','parents','lineage','weight','weightDate','layDate','matingDate','shed','female','male','notes','age','number','photo','ignore'],
  mating:  ['female','male','pair','matingDate','layDate','eggCount','fertile','infertile','clutchHatch','hatchCount','layN','clutchNo','expected','notes','incub','ignore'],
  laying:  ['female','male','pair','layDate','matingDate','eggCount','fertile','infertile','clutchHatch','hatchCount','layN','clutchNo','expected','notes','incub','ignore'],
  events:  ['subject','date','weight','food','ate','shed','eggCount','health','text','notes','ignore'],
  grid:    ['subject','gridDate','gender','morph','notes','ignore'],
  gridT:   ['date','subject','notes','ignore'],
  ledger:  ['date','amount','income','expense','flow','category','item','notes','subject','balance','ignore'],
  diary:   ['date','subject','text','ignore'],
};

function guessKind(sheetName, hf, prof, block, grid) {
  const n = hkey(sheetName);
  const has = f => hf.some(x => x === f || (f === 'layN' && /^layNc?:/.test(x || '')));
  const count = f => hf.filter(x => x === f).length;
  if (/가계부|지출|수입|정산|비용|장부|회계|매출|결산|돈|ledger|expense|money/.test(n) && (has('amount') || has('income') || has('expense') || has('priceX'))) return 'ledger';
  if ((has('amount') || has('income') || has('expense')) && (has('category') || has('item') || has('flow') || has('balance')) && !has('gender') && !has('morph') && !has('eggCount')) return 'ledger';
  if (has('income') && has('expense')) return 'ledger';
  if (block.gridDates >= 2 && (has('name') || block.nameCol >= 0)) return 'grid';
  if (block.gridNames >= 2 && has('dateX')) return 'gridT';
  const breedName = /메이팅|교배|합사|페어|mating|pairing|breeding/.test(n);
  const layName = /산란|클러치|인큐|clutch|egg|lay/.test(n) || /^알/.test(n);
  if (has('layN')) return 'mating';
  if (has('eggCount') || has('layX') || has('fertile') || has('infertile') || has('hatchCount') || has('clutchNo') || layName) {
    if (has('name') && !has('female') && !has('mom') && (has('gender') || has('morph')) && !layName) return 'animals';
    return 'laying';
  }
  if ((has('female') || has('mom')) && (has('male') || has('dad')) && (has('matingX') || has('dateX') || breedName)) return 'mating';
  if (has('pair') && (has('matingX') || has('dateX') || breedName)) return 'mating';
  if (breedName && (has('female') || has('male') || has('name'))) return 'mating';
  if (has('matingX') && (has('female') || has('male') || has('pair'))) return 'mating';
  const nameIdx = hf.indexOf('name');
  if (nameIdx >= 0 && has('dateX')) {
    const np = prof[nameIdx];
    // 이름이 여러 번 나오면 "날짜별 기록", 한 번씩이면 개체 목록
    if (np && np.uniq < 0.75) return 'events';
    if (has('weight') || has('food') || has('shed') || has('text') || has('ate')) return 'events';
  }
  if (nameIdx >= 0 || has('gender') && has('morph')) return 'animals';
  if (has('dateX') && (has('text') || has('notes'))) return 'diary';
  if (has('dateX') && (has('weight') || has('food') || has('shed'))) return 'events';
  if ((has('female') || has('male')) && !has('dateX')) return 'animals';
  if (grid && grid.text) return 'diary';
  return 'skip';
}
function guessMode(sheetName, hf) {
  const n = hkey(sheetName);
  if (/해칭|부화|해츨링|hatch|자가번식|자가해칭|cb|베이비기록|베이비리스트|새끼/.test(n)) return 'hatch';
  if (/분양가능|판매중|분양예정|분양대기|판매예정|매물|forsale|available|판매가능|분양중/.test(n)) return 'available';
  if (/분양|판매|sold|출고|입양보낸/.test(n)) return 'sold';
  return 'own';
}

/* 칸 종류 확정 — 시트 종류와 값을 보고 애매한 칸을 가릅니다 */
function resolveField(hf, kind, p, ctx) {
  if (!hf) return null;
  if (/^layNc?:/.test(hf)) return (kind === 'mating' || kind === 'laying') ? hf : (kind === 'animals' && /^layN:/.test(hf) ? 'layDate' : 'notes');
  const dateLike = p.r('date') >= 0.5;
  const nameLike = p.r('name') >= 0.5;
  const numLike = p.r('num') >= 0.6;
  switch (kind) {
    case 'animals':
      if (hf === 'hatchX') return 'hatchDate';
      if (hf === 'dateX') return ctx.mode === 'sold' && !ctx.has('saleDate') ? 'saleDate' : ctx.mode === 'hatch' && !ctx.has('hatchX') ? 'hatchDate' : 'notes';
      if (hf === 'partyX') return (ctx.mode === 'sold' || ctx.has('saleDate') || ctx.has('salePrice')) && !ctx.has('buyer') ? 'buyer' : (ctx.has('source') ? 'buyer' : 'source');
      if (hf === 'priceX' || hf === 'amount') {
        if (ctx.mode === 'sold' || ctx.mode === 'available' || ctx.has('buyer') || ctx.has('saleDate') || (ctx.has('status') && !ctx.has('source') && !ctx.has('adoptDate'))) return ctx.has('salePrice') ? 'notes' : 'salePrice';
        return ctx.has('buyPrice') ? 'notes' : 'buyPrice';
      }
      if (hf === 'dad') return nameLike || p.n === 0 || p.r('name') >= 0.3 ? 'sire' : 'notes';
      if (hf === 'mom') return nameLike || p.n === 0 || p.r('name') >= 0.3 ? 'dam' : 'notes';
      if (hf === 'pair') return 'parents';
      if (hf === 'matingX') return dateLike ? 'matingDate' : 'notes';
      if (hf === 'layX') return dateLike ? 'layDate' : 'notes';
      if (hf === 'female' || hf === 'male') return ctx.has('name') ? 'notes' : hf;
      if (hf === 'flow') return p.r('morph') >= 0.3 ? 'morph' : 'notes';
      if (['eggCount','fertile','infertile','hatchCount','clutchNo','expected','food','ate','health','text','income','expense','category','item','incub'].includes(hf)) return hf === 'expected' ? 'ignore' : 'notes';
      if (hf === 'balance') return 'notes';
      if (hf === 'status' && p.r('gender') >= 0.6) return 'gender';
      if (hf === 'number' && !ctx.has('name') && p.r('num') < 0.5) return 'name';
      return ['name','number','gender','morph','morphFeat','spots','age','adoptDate','source','buyPrice','salePrice','saleDate','buyer','status','keep','lineage','weight','weightDate','notes','photo','shed','parents'].includes(hf) ? hf : 'notes';
    case 'mating':
    case 'laying':
      if (hf === 'female' || hf === 'mom') return 'female';
      if (hf === 'male' || hf === 'dad') return 'male';
      if (hf === 'name') return ctx.has('female') || ctx.has('mom') ? 'notes' : 'female';
      if (hf === 'pair' || hf === 'parents') return 'pair';
      if (hf === 'matingX') return nameLike && !dateLike ? (ctx.has('male') || ctx.has('dad') ? 'notes' : 'male') : 'matingDate';
      if (hf === 'layX') return numLike && !dateLike && p.small >= p.num * 0.8 ? 'eggCount' : 'layDate';
      if (hf === 'dateX') return kind === 'mating' && !ctx.has('matingX') ? 'matingDate' : (!ctx.has('layX') ? 'layDate' : 'notes');
      if (hf === 'hatchX') return numLike && !dateLike ? 'hatchCount' : 'clutchHatch';
      if (hf === 'eggCount') return dateLike && !numLike ? 'layDate' : 'eggCount';
      if (['fertile','infertile','hatchCount','clutchNo','expected','notes','incub'].includes(hf)) return hf;
      if (hf === 'number') return 'ignore';
      if (hf === 'gender' || hf === 'morph' || hf === 'status') return 'notes';
      return 'notes';
    case 'events':
      if (['name','female','male','mom','dad'].includes(hf)) return ctx.hasSubject && hf !== 'name' ? 'notes' : 'subject';
      if (['dateX','layX','matingX','weightDate','hatchX'].includes(hf)) return dateLike ? (ctx.hasDate ? 'notes' : 'date') : 'notes';
      if (['weight','food','ate','shed','eggCount','health','text','notes'].includes(hf)) return hf;
      if (hf === 'number') return 'ignore';
      return 'notes';
    case 'grid':
      if (hf === 'name') return 'subject';
      if (['gender','morph','notes'].includes(hf)) return hf;
      if (hf === 'number') return 'ignore';
      return 'notes';
    case 'gridT':
      if (['dateX','layX','weightDate'].includes(hf)) return 'date';
      if (hf === 'number') return 'ignore';
      return 'notes';
    case 'ledger':
      if (['dateX','adoptDate','saleDate','layX'].includes(hf)) return 'date';
      if (hf === 'amount' || hf === 'priceX' || hf === 'buyPrice' || hf === 'salePrice') return ctx.has('amount') && hf !== 'amount' ? 'notes' : 'amount';
      if (hf === 'income' || hf === 'expense') return p.r('num') + p.r('money') >= 0.4 || p.n === 0 ? hf : (p.r('flow') > 0.5 ? 'flow' : 'item');
      if (hf === 'flow') return p.r('flow') >= 0.5 ? 'flow' : 'category';
      if (hf === 'category') return 'category';
      if (['item','text','source','partyX','buyer'].includes(hf)) return ctx.has('item') && hf !== 'item' ? 'notes' : 'item';
      if (hf === 'notes') return 'notes';
      if (hf === 'name') return 'subject';
      if (hf === 'balance' || hf === 'number') return hf === 'balance' ? 'balance' : 'ignore';
      return 'notes';
    case 'diary':
      if (['dateX','layX'].includes(hf)) return 'date';
      if (['name','female'].includes(hf)) return 'subject';
      if (hf === 'number') return 'ignore';
      return 'text';
    default:
      return 'ignore';
  }
}
/* 칸 이름을 못 알아봤을 때 값만 보고 추정 */
function guessByValues(p, kind, taken) {
  if (!p.n) return 'ignore';
  const r = p.r;
  if (p.seq && r('num') > 0.9) return 'ignore';
  if (kind === 'animals') {
    if (!taken.has('name') && r('name') >= 0.6 && p.uniq >= 0.8) return 'name';
    if (!taken.has('gender') && r('gender') >= 0.6) return 'gender';
    if (!taken.has('morph') && r('morph') >= 0.4) return 'morph';
    if (!taken.has('hatchDate') && r('date') >= 0.6) return 'hatchDate';
    if (!taken.has('parents') && r('parents') >= 0.5) return 'parents';
    if (!taken.has('status') && r('status') >= 0.6) return 'status';
    if (!taken.has('buyPrice') && r('money') >= 0.6) return 'buyPrice';
    return 'notes';
  }
  if (kind === 'mating' || kind === 'laying') {
    if (!taken.has('female') && r('name') >= 0.6) return 'female';
    if (!taken.has('male') && r('name') >= 0.6) return 'male';
    if (!taken.has('layDate') && r('date') >= 0.6) return 'layDate';
    if (!taken.has('eggCount') && r('num') >= 0.8 && p.small >= p.num * 0.9) return 'eggCount';
    return 'notes';
  }
  if (kind === 'ledger') {
    if (!taken.has('date') && r('date') >= 0.6) return 'date';
    if (!taken.has('amount') && (r('num') >= 0.7 || r('money') >= 0.6)) return 'amount';
    if (!taken.has('flow') && r('flow') >= 0.6) return 'flow';
    if (!taken.has('item')) return 'item';
    return 'notes';
  }
  if (kind === 'diary' || kind === 'events') {
    if (!taken.has('date') && r('date') >= 0.6) return 'date';
    if (!taken.has('subject') && r('name') >= 0.6) return 'subject';
    if (kind === 'diary' && !taken.has('text')) return 'text';
    return kind === 'events' ? 'text' : 'text';
  }
  return 'notes';
}

/* ══════════════════════════════════════════
   분석 — 격자들을 받아 "무엇을 넣을지" 계획을 만듭니다
   ctx = { individuals, events, today, overrides }
   overrides[blockId] = { kind, mode, fields: { [col]: field }, amountUnit }
   ══════════════════════════════════════════ */
function analyze(grids, ctx0) {
  const ctx = { individuals: [], events: [], overrides: {}, ...ctx0 };
  const today = ctx.today;
  const blocks = [];
  grids.forEach((grid, gi) => {
    const sheetYear = (() => { const m = S(grid.sheet).match(/(20\d{2})|(?:^|\D)(\d{2})\s*년/); return m ? (m[1] ? +m[1] : 2000 + +m[2]) : null; })();
    findBlocks(grid, today).forEach((b, bi) => {
      const id = `${gi}:${bi}`;
      const ov = ctx.overrides[id] || {};
      const hr = b.headerRow >= 0 ? grid.rows[b.headerRow] : null;
      const headers = b.cols.map(c => {
        let h = hr ? clean(hr[c] && hr[c].t) : '';
        if (b.sub) { const lo = clean(b.sub[c] && b.sub[c].t); if (lo && lo !== h) h = h ? h + ' ' + lo : lo; }
        const up = b.above ? clean(b.above[c] && b.above[c].t) : '';
        const hf0 = headerField(h);
        // 두 줄 제목 — 위 칸이 "1차"면 아래 "날짜"를 "1차 날짜"로
        if (up && /^\d{1,2}\s*차/.test(up) && (!hf0 || ['dateX','eggCount','layX','notes','hatchX','hatchCount','infertile'].includes(hf0))) h = h ? up + ' ' + h : up;
        else if (!h && up && headerField(up)) h = up;   // 위 줄에만 이름이 있는 칸(병합 제목)
        return h;
      });
      const dataRows = [];
      for (let r = b.start; r < grid.rows.length; r++) dataRows.push(r);
      // 표 바로 위의 한 줄 제목("암컷", "분양완료", "2025년")은 이 표 전체의 성질로 봅니다
      let blockTitle = null;
      if (b.above) {
        const tops = b.cols.map(c => clean(b.above[c] && b.above[c].t)).filter(Boolean);
        const uniq = [...new Set(tops)];
        if (uniq.length === 1 && uniq[0].length <= 16) {
          const t = uniq[0];
          const g = gender(t), st = statusOf(t), ym = t.match(/(20\d{2})\s*년?|(?:^|\D)'?(\d{2})\s*년/);
          blockTitle = { gender: g && g.g !== 'unknown' ? g.g : null, status: st && st.status || null, year: ym ? (ym[1] ? +ym[1] : 2000 + +ym[2]) : null };
        }
      }
      const colVals = b.cols.map(c => dataRows.map(r => grid.rows[r] && grid.rows[r][c]).filter(Boolean));
      const prof = colVals.map(v => profile(v, today));
      let hf = headers.map(h => headerField(h));
      /* 날짜 칸 표(가로로 날짜) · 날짜 줄 표(세로로 날짜, 가로로 이름) 찾기 */
      let gridDates = 0, gridNames = 0, nameCol = -1;
      headers.forEach((h, i) => {
        if (!h) return;
        const hc = hr && hr[b.cols[i]];
        const isD = (hc && hc.d) || (!hf[i] && (cellDate({ t: h, n: hc && hc.n }, { dateCol: true, today, year: sheetYear }) || /^\d{1,2}\s*월$/.test(h)));
        if (isD && !hf[i]) gridDates++;
        if (!hf[i] && looksName(h) && prof[i].n && (prof[i].r('num') >= 0.6 || prof[i].r('ox') >= 0.6)) gridNames++;
      });
      nameCol = hf.indexOf('name');
      let kind0 = guessKind(grid.sheet, hf, prof, { gridDates, gridNames, nameCol }, grid);
      // 제목줄이 없는 표 — 값만 보고 종류를 정합니다
      if (b.headerRow < 0 && kind0 === 'skip' || b.headerRow < 0 && grid.text) {
        const t0 = new Set();
        const g = prof.map(p => { const f = guessByValues(p, 'animals', t0); t0.add(f); return f; });
        const dated = prof.some(p => p.r('date') >= 0.6);
        const texty = prof.some(p => p.long / Math.max(1, p.n) >= 0.3 || p.r('name') < 0.5);
        if (g.includes('name') && (g.includes('gender') || g.includes('morph') || g.includes('hatchDate'))) kind0 = 'animals';
        else if (grid.text || dated && texty) kind0 = 'diary';
      }
      const kind = ov.kind || kind0;
      const mode = ov.mode || guessMode(grid.sheet, hf);
      const taken = new Set();
      const hasHF = f => hf.includes(f);
      const fields = [];
      let hasSubject = false, hasDate = false;
      headers.forEach((h, i) => {
        let f = null, guessed = false, why = '';
        if (ov.fields && ov.fields[b.cols[i]]) { f = ov.fields[b.cols[i]]; }
        else if (kind === 'grid' || kind === 'gridT') {
          const hc = hr && hr[b.cols[i]];
          const isD = h && ((hc && hc.d) || cellDate({ t: h, n: hc && hc.n }, { dateCol: true, today, year: sheetYear }) || /^\d{1,2}\s*월$/.test(h));
          if (kind === 'grid' && isD && !hf[i]) f = 'gridDate';
          else if (kind === 'gridT' && !hf[i] && looksName(h) && prof[i].n) f = 'subject';
          else f = resolveField(hf[i], kind, prof[i], { mode, has: hasHF });
          if (!f) { f = kind === 'grid' && prof[i].r('name') >= 0.6 && !taken.has('subject') ? 'subject' : 'notes'; guessed = true; }
        } else if (hf[i]) {
          f = resolveField(hf[i], kind, prof[i], { mode, has: hasHF, hasSubject, hasDate });
        } else {
          f = guessByValues(prof[i], kind, taken);
          guessed = !!prof[i].n;
          why = h ? '칸 이름을 몰라 값을 보고 정했어요' : '칸 이름이 없어 값을 보고 정했어요';
        }
        // 이미 같은 역할이 있으면 두 번째부터는 메모로 (날짜 칸·N차·메모는 여러 개 가능)
        const multi = ['notes','ignore','gridDate','subject','layDate','matingDate','text'].includes(f) || /^layNc?:/.test(f || '');
        if (!multi && taken.has(f)) { f = f === 'photo' ? 'photo' : 'notes'; }
        if (f === 'subject' && kind !== 'gridT') { if (hasSubject) f = 'notes'; hasSubject = true; }
        if (f === 'date') { if (hasDate) f = 'notes'; hasDate = true; }
        taken.add(f);
        // 값이 칸 종류와 너무 다르면 확인 표시
        const p = prof[i];
        let check = false;
        if (p.n >= 2) {
          if (['hatchDate','adoptDate','saleDate','date','layDate','matingDate','clutchHatch','weightDate'].includes(f) && p.r('date') < 0.5) check = true;
          if (f === 'gender' && p.r('gender') < 0.5) check = true;
          if (['weight','eggCount','hatchCount','fertile','infertile'].includes(f) && p.r('num') < 0.5 && !(f === 'eggCount' && p.r('date') < 0.3 && /\d/.test(clean(colVals[i][0] && colVals[i][0].t)))) check = true;
          if (hf[i] && ['priceX','partyX','dateX','flow','status'].includes(hf[i]) && kind === 'animals') check = true;
        }
        if (guessed && p.n) check = true;
        fields.push({ col: b.cols[i], header: h || `칸 ${colName(b.cols[i])}`, hasHeader: !!h, field: f, guessed, check, why,
                      unit: unitOf(h), sample: colVals[i].slice(0, 3).map(c => clean(c.t)).filter(Boolean), filled: p.n, prof: p });
      });
      blocks.push({ id, grid, gi, sheet: grid.sheet, sheetYear: (blockTitle && blockTitle.year) || sheetYear, blockTitle, headerRow: b.headerRow, cols: b.cols, rows: dataRows,
                    kind, kindGuess: kind0,
                    mode, fields, ov });
    });
  });
  return buildPlan(blocks, ctx);
}
function colName(c) { let s = ''; c++; while (c > 0) { const m = (c - 1) % 26; s = String.fromCharCode(65 + m) + s; c = Math.floor((c - 1) / 26); } return s; }

/* ══════════════════════════════════════════
   계획 만들기
   ══════════════════════════════════════════ */
function buildPlan(blocks, ctx) {
  const today = ctx.today;
  const batch = 'imp' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
  const existing = (ctx.individuals || []).filter(i => i && i.id);
  const exEvents = ctx.events || [];
  const extract = ctx.extractFacts || (typeof G.extractFacts === 'function' ? G.extractFacts : null);

  /* ── 개체 장부: 이름 → 개체 ── */
  const ents = [];
  const byKey = new Map();
  const keyVariants = k => {
    const v = [k];
    if (k.length > 1 && k.endsWith('이')) v.push(k.slice(0, -1)); else v.push(k + '이');
    return v;
  };
  const index = ent => keyVariants(nameKey(ent.name)).forEach((k, i) => { if (!byKey.has(k) || i === 0) { if (!byKey.has(k) || byKey.get(k).exact !== true) byKey.set(k, ent); } });
  existing.forEach(ind => {
    const ent = { id: ind.id, name: ind.name, base: ind, isNew: false, set: {}, memo: [], exact: true, from: [] };
    ents.push(ent);
    const k = nameKey(ind.name);
    if (!byKey.has(k)) byKey.set(k, ent);
  });
  existing.forEach(ind => {
    const k = nameKey(ind.name);
    keyVariants(k).slice(1).forEach(v => { if (!byKey.has(v)) byKey.set(v, ents.find(e => e.id === ind.id)); });
  });
  const find = name => {
    const k = nameKey(name);
    if (!k) return null;
    if (byKey.has(k)) return byKey.get(k);
    return null;
  };
  const make = (name, attrs, from) => {
    const ent = {
      id: uid(), name: clean(name), isNew: true, base: null, from: from ? [from] : [], memo: [],
      set: { gender: 'unknown', morph: '', spots: '', hatchDate: '', isFromCreGunseol: false, isExternal: false,
             sireId: null, damId: null, status: 'own', favorite: false, keep: false, shareCode: code6(), ...attrs },
    };
    ents.push(ent);
    const k = nameKey(ent.name);
    byKey.set(k, ent);
    keyVariants(k).slice(1).forEach(v => { if (!byKey.has(v)) byKey.set(v, ent); });
    return ent;
  };
  const cur = (ent, f) => (f in ent.set ? ent.set[f] : ent.base ? ent.base[f] : undefined);
  const isEmptyVal = (f, v) => v == null || v === '' || v === false || (f === 'gender' && v === 'unknown') || (f === 'status' && v === 'own');
  /* 값 넣기 — 이미 있는 아이는 빈 칸만 채웁니다(대표님이 앱에 적은 걸 덮지 않습니다) */
  const setF = (ent, f, v, force) => {
    if (v == null || v === '') return;
    const now1 = cur(ent, f);
    if (now1 === v || (!now1 && !v)) return;              // 이미 같은 값
    if (isEmptyVal(f, v) && !force) return;               // 비우는 값(미구분·false)은 넣을 필요가 없습니다
    if (ent.isNew) {
      if (force || isEmptyVal(f, ent.set[f])) ent.set[f] = v;
      return;
    }
    const now0 = cur(ent, f);
    if (isEmptyVal(f, now0) || force === 'fill') {
      if (f === 'status' && now0 && now0 !== 'own') return;
      ent.set[f] = v;
    }
  };
  const addMemo = (ent, part) => { const p = clean(part); if (p && !ent.memo.includes(p)) ent.memo.push(p); };

  /* ── 기록: 같은 것 두 번 넣지 않기 ── */
  const events = [];
  const evKey = e => {
    const d = e.data || {};
    const core = e.type === 'growth' ? d.weight : e.type === 'laying' ? '' : e.type === 'ledger' ? `${d.flow}${d.amount}${d.notes}` :
      e.type === 'memo' ? d.notes : e.type === 'health' ? d.issue : e.type === 'mating' ? (d.partnerName || '') : '';
    return `${e.individualId || ''}|${e.type}|${e.date}|${core}`;
  };
  const seenEv = new Set(exEvents.map(evKey));
  let dupSkipped = 0;
  // 메모는 날짜가 달라도 같은 내용이면 겹친 것으로 봅니다 (다시 가져오기 해도 메모가 쌓이지 않게)
  const memoParts = new Map();
  const partsOf = n => S(n).split('·').map(x => clean(x)).filter(Boolean);
  exEvents.forEach(e => { if (e.type === 'memo' && e.individualId) { const set = memoParts.get(e.individualId) || new Set(); partsOf(e.data && e.data.notes).forEach(p => set.add(p)); memoParts.set(e.individualId, set); } });
  const addEv = (ent, type, date, data, meta) => {
    if (!date) return null;
    if (type === 'memo' && ent) {
      const set = memoParts.get(ent.id) || new Set();
      const fresh = partsOf(data && data.notes).filter(p => !set.has(p));
      if (!fresh.length) { dupSkipped++; return null; }
      fresh.forEach(p => set.add(p));
      memoParts.set(ent.id, set);
      data = { ...data, notes: fresh.join(' · ') };
    }
    const ev = { id: uid(), individualId: ent ? ent.id : null, type, date, data: data || {} };
    const k = evKey(ev);
    if (seenEv.has(k)) { dupSkipped++; return null; }
    seenEv.add(k);
    ev._ent = ent; ev._from = meta || null;
    events.push(ev);
    return ev;
  };

  /* ── 보고: 못 읽은 곳 · 일부러 뺀 곳 ── */
  const issues = [];
  const stats = { cells: 0, used: 0, memo: 0, ignored: 0, rows: 0, skippedRows: 0 };
  const note = (b, r, header, text, why) => issues.push({ sheet: b.sheet, row: r + 1, header, text: clean(text).slice(0, 40), why });

  const cellAt = (b, r, col) => (b.grid.rows[r] ? b.grid.rows[r][col] : null);
  const tx = c => clean(c && c.t);
  const dateOf = (c, opt) => cellDate(c, { dateCol: true, today, ...opt });

  /* 부모 글 "크한x크순" → [{name, role}] */
  const splitParents = text => {
    const t = clean(text);
    if (!t) return [];
    let m = t.match(/(?:부|아빠|♂|sire)\s*[:：]?\s*([^\s,/x×*&+]+).*?(?:모|엄마|♀|dam)\s*[:：]?\s*([^\s,/x×*&+]+)/i);
    if (m) return [{ name: m[1], role: 'sire' }, { name: m[2], role: 'dam' }];
    m = t.match(/(?:모|엄마|♀|dam)\s*[:：]?\s*([^\s,/x×*&+]+).*?(?:부|아빠|♂|sire)\s*[:：]?\s*([^\s,/x×*&+]+)/i);
    if (m) return [{ name: m[2], role: 'sire' }, { name: m[1], role: 'dam' }];
    // "쌀이x보리" 처럼 붙여 쓴 x 도 가릅니다 (옛 아이폰이 못 읽는 뒤돌아보기 정규식은 쓰지 않습니다)
    const spaced = t.replace(/([가-힣])[xX]([가-힣])/g, '$1 x $2');
    const parts = spaced.split(/\s+x\s+|\s*(?:×|\*|&|\+|\/|,|와|과|랑|하고|\s-\s)\s*/i).map(s => s && s.trim()).filter(Boolean);
    if (parts.length === 2) {
      const a = tidyName(parts[0]), bb = tidyName(parts[1]);
      return [{ name: a.name, g: a.gender }, { name: bb.name, g: bb.gender }];
    }
    return [{ name: tidyName(t).name, single: true }];
  };
  /* 두 이름 중 누가 수컷·암컷인지 — 성별을 아는 쪽으로, 모르면 "수 x 암" 순서 */
  const orderPair = (ps) => {
    if (ps.length !== 2) return null;
    if (ps[0].role) return { sire: ps[0].name, dam: ps[1].name };
    const ga = (ps[0].g && ps[0].g.g) || (find(ps[0].name) && cur(find(ps[0].name), 'gender'));
    const gb = (ps[1].g && ps[1].g.g) || (find(ps[1].name) && cur(find(ps[1].name), 'gender'));
    if (ga === 'female' || gb === 'male') return { sire: ps[1].name, dam: ps[0].name };
    return { sire: ps[0].name, dam: ps[1].name };
  };

  /* 알 칸 "2", "2개", "2(1무정)", "3개 중 1무정", "두개" */
  const eggInfo = (c) => {
    const t = tx(c);
    const out = { count: 0, infertile: 0, notes: '' };
    if (!t) return out;
    if (typeof (c && c.n) === 'number' && !c.d) { out.count = Math.round(c.n); return out; }
    const KN = { 한: 1, 하나: 1, 두: 2, 둘: 2, 세: 3, 셋: 3, 네: 4, 넷: 4 };
    let m = t.match(/(\d+)\s*(?:개|알|ea)?/);
    if (m) out.count = +m[1];
    else if ((m = t.match(/(한|하나|두|둘|세|셋|네|넷)\s*개/))) out.count = KN[m[1]];
    const inf = t.match(/무정\s*(\d+)|(\d+)\s*(?:개\s*)?무정/);
    if (inf) out.infertile = +(inf[1] || inf[2]);
    else if (/무정|슬러그|slug/.test(t)) out.infertile = out.count || 1;
    const rest = t.replace(/\d+\s*(?:개|알|ea)?/, '').replace(/무정\s*\d*|\d+\s*무정/, '').replace(/[()\s]/g, '');
    if (rest && !/^(개|알)$/.test(rest)) out.notes = t;
    return out;
  };
  /* 알 칸들로 eggUnits 만들기 — 무정을 따로 적었을 때만 */
  const eggUnits = (count, infertile, hatched, hatchDate) => {
    if (!infertile || !count) return null;
    const u = [];
    for (let i = 0; i < count; i++) {
      if (i < hatched) u.push({ look: '', status: 'hatched', reason: '', note: '', date: hatchDate || '' });
      else if (i < hatched + infertile) u.push({ look: '', status: 'infertile', reason: '', note: '', date: '' });
      else u.push({ look: '', status: 'pending', reason: '', note: '', date: '' });
    }
    return u;
  };

  /* 산란 칸 하나 "25.12.01(2개)" · "1/9 2개 무정1" · "2/2 조산" · "12/3 2개 부화 3/1" */
  const layCell = (c, anchor, yearHint) => {
    const t = tx(c);
    if (!t) return null;
    if (c && c.d) return { date: c.d, eggs: { count: 0, infertile: 0, notes: '' } };
    if (typeof (c && c.n) === 'number') { const s = serialToISO(c.n); if (s) return { date: s, eggs: { count: 0, infertile: 0, notes: '' } }; }
    const f = findDate(t, { today, anchor, year: yearHint, loose: true });
    if (!f || f.partial) return { bad: t };
    let rest = t.slice(0, f.at) + ' ' + t.slice(f.at + f.len);
    let hatch = null;
    const hm = rest.match(/(부화|해칭|깨어|나옴)[^\d]*(\d{1,4}[^\s,)]*)/);
    if (hm) {
      const hf = findDate(hm[2], { today, anchor: f.iso, loose: true });
      if (hf && !hf.partial) { hatch = hf.iso; rest = rest.replace(hm[0], ' '); }
    }
    let hatchCount = 0;
    const hc = rest.match(/(\d+)\s*마리/);
    if (hc) { hatchCount = +hc[1]; rest = rest.replace(hc[0], ' '); }
    const eggs = eggInfo({ t: rest.replace(/[()]/g, ' ') });
    const leftover = clean(rest.replace(/\d+\s*(?:개|알)/, '').replace(/무정\s*\d*|\d+\s*무정/, '').replace(/[()]/g, ' '));
    eggs.notes = leftover && !/^[\s,.~\-]*$/.test(leftover) ? leftover : '';
    return { date: f.iso, eggs, hatch, hatchCount };
  };

  /* 칸 하나를 "칸 이름: 값" 메모로 */
  const asMemo = (fd, c) => {
    const t = tx(c);
    if (!t) return '';
    // 특이사항·비고·메모 칸은 칸 이름 없이 글만 — 나머지는 "칸 이름: 값"
    if (!fd.hasHeader || fd.field === 'notes' && headerField(fd.header) === 'notes') return t;
    return `${fd.header}: ${t}`;
  };

  /* ── 줄 걸러내기: 빈 줄 · 합계 · 되풀이된 제목줄 · 구역 제목 ── */
  const TOTAL_RE = /^(합계|총계|소계|계|총합|총|합|total|sum|평균|average|avg|누계|합산)\s*:?$/i;
  const rowCtx = (b) => ({ gender: (b.blockTitle && b.blockTitle.gender) || null, year: b.sheetYear, status: (b.blockTitle && b.blockTitle.status) || null });
  const classifyRow = (b, r, sec) => {
    const cells = b.fields.map(fd => ({ fd, c: cellAt(b, r, fd.col) })).filter(x => tx(x.c) || (x.c && typeof x.c.n === 'number'));
    if (!cells.length) return 'empty';
    if (b.grid.hidden && b.grid.hidden[r]) { /* 숨긴 줄도 가져옵니다 — 숨긴 건 지운 게 아닙니다 */ }
    if (cells.some(x => TOTAL_RE.test(tx(x.c)))) return 'total';
    const hdrLike = cells.filter(x => { const t = tx(x.c); return t && (t === x.fd.header || (headerField(t) && headerField(t) === headerField(x.fd.header))); }).length;
    if (hdrLike >= Math.max(2, cells.length * 0.6)) return 'header';
    if (cells.length === 1 && b.kind !== 'diary' && tx(cells[0].c).length <= 16) {
      const t = tx(cells[0].c);
      const f = cells[0].fd.field;
      const g = gender(t);
      const ym = t.match(/^(?:'?(\d{2})|(20\d{2}))\s*년?(?:\s*(?:산란|해칭|부화|시즌|기록))?$/);
      const st = statusOf(t);
      const isNameCol = ['name', 'subject', 'female'].includes(f);
      if (g && !isNameCol) { sec.gender = g.g; return 'section'; }
      if (g && isNameCol && /^[♀♂]|^(암컷|수컷|숫컷|암|수|미구분)\s*(개체|들|목록|리스트)?$/.test(t)) { sec.gender = g.g; return 'section'; }
      if (ym) { sec.year = ym[2] ? +ym[2] : 2000 + +ym[1]; return 'section'; }
      if (st && st.status && (!isNameCol || /^(분양완료|분양가능|보유|보유중|예약|폐사|판매완료|판매중|킵|keep)\s*(개체|들|목록|리스트)?$/i.test(t))) { sec.status = st.status; return 'section'; }
      if (!isNameCol && !['date', 'text', 'notes', 'item', 'gridDate'].includes(f) && b.kind !== 'diary') return 'title';
    }
    return 'row';
  };

  /* ════ 1단계: 개체 목록 (먼저 해야 다른 시트가 이름을 찾습니다) ════ */
  const parentJobs = [];
  const animalBlocks = blocks.filter(b => b.kind === 'animals');
  // 해칭 시트는 부모가 먼저 있어야 하므로 뒤로
  animalBlocks.sort((a, b2) => (a.mode === 'hatch') - (b2.mode === 'hatch'));
  animalBlocks.forEach(b => {
    const sec = rowCtx(b);
    const F = f => b.fields.filter(x => x.field === f);
    const f1 = f => F(f)[0];
    // 금액 칸 단위: 적혀 있지 않으면 값 크기로 (1000 미만이면 만원으로 봅니다)
    const unitFor = fd => {
      if (!fd) return 1;
      if (b.ov.amountUnit) return b.ov.amountUnit;
      if (fd.unit) return fd.unit;
      const nums = b.rows.map(r => cellAt(b, r, fd.col)).filter(c => c && typeof c.n === 'number').map(c => c.n);
      if (!nums.length) return 1;
      const sorted = nums.slice().sort((x, y) => x - y);
      const med = sorted[Math.floor(sorted.length / 2)];
      return med < 1000 ? 10000 : 1;
    };
    const buyUnit = unitFor(f1('buyPrice')), saleUnit = unitFor(f1('salePrice'));
    b.units = { buyPrice: buyUnit, salePrice: saleUnit };
    // "암컷 | 수컷" 두 칸에 이름만 죽 적은 표
    const genderCols = !f1('name') && (F('female').length || F('male').length);
    b.rows.forEach(r => {
      const kindOfRow = classifyRow(b, r, sec);
      if (kindOfRow !== 'row') {
        b.fields.forEach(fd => { const c = cellAt(b, r, fd.col); if (tx(c)) { stats.cells++; stats.ignored++; } });
        if (kindOfRow !== 'empty') stats.skippedRows++;
        return;
      }
      stats.rows++;
      const subjects = [];
      if (genderCols) {
        [...F('female'), ...F('male')].forEach(fd => {
          const c = cellAt(b, r, fd.col); const t = tx(c);
          if (!t) return;
          stats.cells++;
          const tn = tidyName(t);
          if (!looksName(tn.name)) { note(b, r, fd.header, t, '이름으로 보기 어려워 건너뜀'); stats.ignored++; return; }
          stats.used++;
          subjects.push({ name: tn.name, g: fd.field === 'female' ? 'female' : 'male' });
        });
        subjects.forEach(s => {
          let ent = find(s.name);
          if (!ent) ent = make(s.name, {}, { sheet: b.sheet, row: r + 1 });
          setF(ent, 'gender', s.g);
          if (sec.status) setF(ent, 'status', sec.status);
        });
        return;
      }
      const nameFd = f1('name');
      let rawName = nameFd ? tx(cellAt(b, r, nameFd.col)) : '';
      const tn = tidyName(rawName);
      let ent = null;
      if (tn.name && looksName(tn.name)) {
        ent = find(tn.name);
        if (!ent) ent = make(tn.name, {}, { sheet: b.sheet, row: r + 1 });
        else if (ent.from) ent.from.push({ sheet: b.sheet, row: r + 1 });
      } else {
        // 이름이 없는 줄 — 해칭 시트면 부모 이름으로 지어 드리고, 아니면 그 줄의 다른 칸으로 이름을 찾습니다
        const hasAny = b.fields.some(fd => fd.field !== 'number' && fd.field !== 'ignore' && tx(cellAt(b, r, fd.col)));
        if (!hasAny) return;
        if (b.mode === 'hatch' || f1('sire') || f1('dam') || f1('parents')) {
          ent = make('', {}, { sheet: b.sheet, row: r + 1 });
          ent.needName = true;
        } else {
          b.fields.forEach(fd => { const c = cellAt(b, r, fd.col); if (tx(c)) { stats.cells++; stats.ignored++; } });
          note(b, r, nameFd ? nameFd.header : '이름', rawName || '(빈 칸)', '이름이 없어 이 줄은 건너뜀');
          return;
        }
      }
      if (nameFd && rawName) { stats.cells++; stats.used++; }
      if (tn.gender) setF(ent, 'gender', tn.gender.g);
      if (sec.gender) setF(ent, 'gender', sec.gender);
      let st = null, saleDate = null, buyer = '', saleMoney = null, buyMoney = null, adoptDate = null, source = '', weight = null, weightDate = null;
      const parents = { sire: '', dam: '', raw: '' };
      const memoParts = [];
      b.fields.forEach(fd => {
        if (fd.field === 'name') return;
        const c = cellAt(b, r, fd.col);
        const t = tx(c);
        if (!t && !(c && typeof c.n === 'number')) return;
        stats.cells++;
        const used = () => stats.used++;
        const toMemo = (why) => { memoParts.push(asMemo(fd, c)); stats.memo++; if (why) note(b, r, fd.header, t, why); };
        switch (fd.field) {
          case 'gender': { const g = gender(t); if (g) { setF(ent, 'gender', g.g); if (!g.sure && g.g !== 'unknown') memoParts.push(/추정/.test(t) ? '성별 추정' : '성별 추정(' + t + ')'); used(); } else toMemo('성별로 못 읽어 메모로 둠'); break; }
          case 'morph': setF(ent, 'morph', t); used(); break;
          case 'morphFeat': memoParts.push('모프 특징: ' + t); used(); break;
          case 'spots': { const y = ox(t); setF(ent, 'spots', y === true ? '있음' : y === false ? '무점' : t); used(); break; }
          case 'hatchDate': {
            const d = dateOf(c, { year: sec.year });
            // 연도 없이 "3/15" 만 적힌 생일은 해를 짐작하지 않습니다(다 큰 아이가 올해생이 되어 버립니다).
            // 해칭 시트이거나 시트 이름에 해가 있을 때만 짐작합니다.
            if (d && d.noYear && !(b.mode === 'hatch' || sec.year)) { memoParts.push(`생일 ${t} (연도 모름)`); used(); }
            else if (d && !d.partial && !d.rest) { setF(ent, 'hatchDate', d.iso); used(); }
            else if (d && d.partial) { memoParts.push('출생 ' + t + ' (일자 미상)'); used(); }
            else if (d) { setF(ent, 'hatchDate', d.iso); memoParts.push('출생: ' + t); used(); }
            else toMemo('날짜로 못 읽어 메모로 둠');
            break;
          }
          case 'adoptDate': { const d = dateOf(c, { year: sec.year }); if (d && !d.partial) { adoptDate = d.iso; used(); } else toMemo(d ? '' : '날짜로 못 읽어 메모로 둠'); break; }
          case 'source': source = t; used(); break;
          case 'buyPrice': { const mm = money(c, b.units.buyPrice); if (mm) { buyMoney = mm; used(); } else toMemo('금액으로 못 읽어 메모로 둠'); break; }
          case 'salePrice': { const mm = money(c, b.units.salePrice); if (mm) { saleMoney = mm; used(); } else toMemo('금액으로 못 읽어 메모로 둠'); break; }
          case 'saleDate': { const d = dateOf(c, { year: sec.year }); if (d && !d.partial) { saleDate = d.iso; used(); } else toMemo('날짜로 못 읽어 메모로 둠'); break; }
          case 'buyer': buyer = t; used(); break;
          case 'status': { const s2 = statusOf(t, fd.header); if (s2) { st = { ...(st || {}), ...s2 }; used(); if (s2.guess) memoParts.push(`${fd.header}: ${t}`); } else toMemo('상태로 못 읽어 메모로 둠'); break; }
          case 'keep': { const y = ox(t); const s2 = statusOf(t, fd.header || '킵'); if (y !== null || s2) { st = { ...(st || {}), keep: y !== null ? y : !!(s2 && s2.keep) }; used(); } else toMemo(); break; }
          case 'sire': parents.sire = t; used(); break;
          case 'dam': parents.dam = t; used(); break;
          case 'parents': parents.raw = t; used(); break;
          case 'lineage': {
            const ps = splitParents(t);
            if (ps.length === 2 && ps.every(p => find(p.name) && !find(p.name).set.isExternal)) { parents.raw = t; }
            else memoParts.push('혈통: ' + t);
            used(); break;
          }
          case 'weight': { const n = num(c); if (n !== null && n > 0 && n < 500) { weight = n; used(); } else toMemo('무게로 못 읽어 메모로 둠'); break; }
          case 'weightDate': { const d = dateOf(c, { year: sec.year }); if (d && !d.partial) { weightDate = d.iso; used(); } else toMemo(); break; }
          case 'layDate': case 'matingDate': case 'shed': {
            const type = fd.field === 'layDate' ? 'laying' : fd.field === 'matingDate' ? 'mating' : 'shed';
            const yn = ox(t);
            if (type === 'shed' && yn !== null) { toMemo(); break; }
            const ds = c.d ? { dates: [{ iso: c.d }], tail: '' } : allDates(t, { today, year: sec.year });
            if (ds.dates.length) { ds.dates.forEach(d => ent._later = (ent._later || []).concat([{ type, date: d.iso, from: { sheet: b.sheet, row: r + 1 } }])); used(); if (clean(ds.tail).replace(/[,\s]/g, '')) memoParts.push(`${fd.header}: ${t}`); }
            else toMemo('날짜로 못 읽어 메모로 둠');
            break;
          }
          case 'age': memoParts.push('나이: ' + t + (today ? ` (${today} 기준)` : '')); used(); break;
          case 'number': case 'photo': case 'ignore': case 'expected': case 'balance': stats.ignored++; break;
          case 'female': case 'male': memoParts.push(asMemo(fd, c)); stats.memo++; break;
          default: toMemo(); break;
        }
      });
      // 상태 정하기: 적힌 상태 > 분양 흔적(분양처·분양일) > 시트 성격 > 구역 제목
      let status = st && st.status;
      if (!status && (buyer || saleDate) && b.mode !== 'available') status = 'sold';
      if (!status && sec.status) status = sec.status;
      if (!status && b.mode === 'sold') status = 'sold';
      if (!status && b.mode === 'available') status = 'available';
      if (status) setF(ent, 'status', status, ent.isNew);
      if (st && st.keep) { setF(ent, 'keep', true); if (!status || status === 'own') setF(ent, 'status', 'own'); }
      if (st && st.external) { setF(ent, 'isExternal', true); }
      if (status === 'gone') { setF(ent, 'goneReason', st.gone || '폐사'); setF(ent, 'keep', false, true); }
      if (status === 'sold' || status === 'gone') setF(ent, 'keep', false, true);
      // 분양 — 앱의 DB.recordSale 과 같은 모양으로 적습니다
      if (status === 'sold') {
        const won = saleMoney ? saleMoney.won : 0;
        const free = !!(saleMoney && (saleMoney.free || saleMoney.zero));
        setF(ent, 'salePrice', won ? String(won) : '', true);
        if (free) setF(ent, 'saleFree', true, true);
        ent._sale = { date: saleDate || today, dated: !!saleDate, won, free, buyer, from: { sheet: b.sheet, row: r + 1 } };
      } else if (saleMoney && saleMoney.won) {
        setF(ent, 'salePrice', String(saleMoney.won));
        if (buyer) memoParts.push('분양처: ' + buyer);
      } else if (buyer) memoParts.push('분양처: ' + buyer);
      // 입양 메모 — 예전 시트 이관과 같은 글 모양(가계부가 이 글을 읽습니다)
      const adopt = [];
      if (source) adopt.push('입양처: ' + source);
      if (buyMoney) {
        if (buyMoney.free || buyMoney.zero) adopt.push('입양가 0 (무상/선물)');
        else if (buyMoney.won) adopt.push('입양가 ' + (Math.round(buyMoney.won / 100) / 100) + '만원');
      }
      // 같은 아이가 여러 시트에 나오면 입양 정보를 합칩니다(뒤 시트가 빈 칸이라고 지우지 않게)
      if (!ent._adopt) ent._adopt = { parts: [], date: null, from: { sheet: b.sheet, row: r + 1 } };
      adopt.forEach(p => { if (!ent._adopt.parts.some(q => q.split(/[:\s]/)[0] === p.split(/[:\s]/)[0])) ent._adopt.parts.push(p); });
      if (adoptDate && !ent._adopt.date) ent._adopt.date = adoptDate;
      memoParts.forEach(p => addMemo(ent, p));
      if (weight !== null) ent._later = (ent._later || []).concat([{ type: 'growth', date: weightDate || today, weight, undated: !weightDate, from: { sheet: b.sheet, row: r + 1 } }]);
      if (parents.sire || parents.dam || parents.raw) parentJobs.push({ ent, parents, mode: b.mode, b, r });
      if (b.mode === 'hatch') setF(ent, 'isFromCreGunseol', true);
    });
  });

  /* 부모 잇기 — 내가 가진 아이면 부·모로 잇고, 아니면 "혈통" 메모로.
     해칭 시트(내가 해칭한 아이)는 부모가 목록에 없으면 "외부 개체"로 만들어 잇습니다. */
  parentJobs.forEach(job => {
    const { ent, parents, mode } = job;
    let sire = clean(parents.sire), dam = clean(parents.dam);
    if (parents.raw) {
      const ps = splitParents(parents.raw);
      const o = orderPair(ps);
      if (o) { sire = sire || o.sire; dam = dam || o.dam; }
      else if (ps.length === 1) {
        if (mode === 'hatch' && ps[0].name && find(ps[0].name)) {
          const p = find(ps[0].name); if (cur(p, 'gender') === 'male') sire = ps[0].name; else dam = ps[0].name;
        } else { addMemo(ent, '혈통: ' + clean(parents.raw)); return; }
      }
    }
    const link = (nm, role) => {
      if (!nm) return null;
      const tn = tidyName(nm);
      if (!looksName(tn.name)) return null;
      let p = find(tn.name);
      if (p === ent) return null;
      if (!p && mode === 'hatch') p = make(tn.name, { isExternal: true, gender: role === 'sire' ? 'male' : 'female' }, { sheet: job.b.sheet, row: job.r + 1, external: true });
      return p;
    };
    const ps = link(sire, 'sire'), pd = link(dam, 'dam');
    const mine = p => p && (p.isNew ? !p.set.isExternal || mode === 'hatch' : !p.base.isExternal || mode === 'hatch');
    const linkable = mode === 'hatch' || (mine(ps) && mine(pd)) || (mine(ps) && !dam) || (mine(pd) && !sire);
    if (linkable && (ps || pd)) {
      if (ps) setF(ent, 'sireId', ps.id);
      if (pd) setF(ent, 'damId', pd.id);
      if (ps && cur(ps, 'gender') === 'unknown') setF(ps, 'gender', 'male');
      if (pd && cur(pd, 'gender') === 'unknown') setF(pd, 'gender', 'female');
      setF(ent, 'isFromCreGunseol', true);
      const missing = [!ps && sire ? '부 ' + sire : '', !pd && dam ? '모 ' + dam : ''].filter(Boolean);
      if (missing.length) addMemo(ent, '혈통: ' + missing.join(' · '));
    } else {
      const txt = parents.raw ? clean(parents.raw) : [sire ? '부 ' + sire : '', dam ? '모 ' + dam : ''].filter(Boolean).join(' × ');
      addMemo(ent, '혈통: ' + txt);
    }
  });
  // 이름 없던 아기들 — 앱의 해칭 이름 규칙(엄마·아빠 끝 글자 + 번호)
  const allNames = () => ents.map(e => e.name).filter(Boolean);
  ents.filter(e => e.needName).forEach(e => {
    const mom = e.set.damId ? ents.find(x => x.id === e.set.damId) : null;
    const dad = e.set.sireId ? ents.find(x => x.id === e.set.sireId) : null;
    const nm = (typeof G.makeBabyNames === 'function' ? G.makeBabyNames : babyNames)(mom ? mom.name : '', dad ? dad.name : '', 1, allNames())[0];
    e.name = nm;
    byKey.set(nameKey(nm), e);
  });

  /* ════ 2단계: 메이팅 · 산란 ════ */
  const subjectEnt = (name, g, from, b, r, header) => {
    const tn = tidyName(name);
    if (!tn.name || !looksName(tn.name)) return null;
    let e = find(tn.name);
    if (!e) { e = make(tn.name, {}, { ...from, onlyRecord: true }); }
    if (g) setF(e, 'gender', g);
    else if (tn.gender) setF(e, 'gender', tn.gender.g);
    return e;
  };
  blocks.filter(b => b.kind === 'mating' || b.kind === 'laying').forEach(b => {
    const sec = rowCtx(b);
    const F = f => b.fields.filter(x => x.field === f || (f === 'layN' && /^layN:/.test(x.field)));
    const f1 = f => F(f)[0];
    let lastFemale = '', lastMale = '';
    b.rows.forEach(r => {
      const k = classifyRow(b, r, sec);
      if (k !== 'row') { b.fields.forEach(fd => { if (tx(cellAt(b, r, fd.col))) { stats.cells++; stats.ignored++; } }); if (k !== 'empty') stats.skippedRows++; return; }
      stats.rows++;
      const from = { sheet: b.sheet, row: r + 1 };
      const val = f => { const fd = f1(f); return fd ? cellAt(b, r, fd.col) : null; };
      let femName = tx(val('female')), maleName = tx(val('male'));
      const pairT = tx(val('pair'));
      if (pairT) {
        const o = orderPair(splitParents(pairT));
        if (o) { femName = femName || o.dam; maleName = maleName || o.sire; }
        else femName = femName || pairT;
      }
      // 비워 둔 칸은 "위와 같음"으로 봅니다 (한 암컷의 산란을 여러 줄에 적을 때)
      if (!femName && lastFemale && (tx(val('layDate')) || tx(val('eggCount')) || F('layN').length)) femName = lastFemale;
      if (!maleName && lastMale && !tx(val('matingDate')) && femName === lastFemale) maleName = lastMale;
      const fem = femName ? subjectEnt(femName, 'female', from, b, r) : null;
      const male = maleName ? subjectEnt(maleName, 'male', from, b, r) : null;
      if (femName) lastFemale = femName;
      if (maleName) lastMale = maleName;
      const rowCells = b.fields.filter(fd => tx(cellAt(b, r, fd.col)) || typeof (cellAt(b, r, fd.col) || {}).n === 'number');
      rowCells.forEach(() => stats.cells++);
      if (!fem) {
        rowCells.forEach(fd => { stats.ignored++; });
        note(b, r, f1('female') ? f1('female').header : '암컷', femName || pairT || '(빈 칸)', '어느 암컷인지 몰라 이 줄은 건너뜀');
        return;
      }
      const partner = male ? { partnerId: male.id, partnerName: male.name } : (maleName ? { partnerName: maleName } : {});
      const sireData = male ? { sireId: male.id, sireName: male.name } : {};
      const memo = [];
      let used = 0;
      ['female', 'male', 'pair'].forEach(f => F(f).forEach(fd => { if (tx(cellAt(b, r, fd.col))) used++; }));
      // 메이팅
      let mateAnchor = null;
      F('matingDate').forEach(fd => {
        const c = cellAt(b, r, fd.col); const t = tx(c);
        if (!t && !(c && c.d)) return;
        const ds = c.d ? { dates: [{ iso: c.d }] } : allDates(t, { today, year: sec.year });
        if (!ds.dates.length) { memo.push(asMemo(fd, c)); stats.memo++; note(b, r, fd.header, t, '날짜로 못 읽어 메모로 둠'); return; }
        ds.dates.forEach(d => { addEv(fem, 'mating', d.iso, { ...partner }, from); mateAnchor = mateAnchor || d.iso; });
        used++;
      });
      // 산란 (한 줄에 하나)
      const layFd = F('layDate');
      const eggs = val('eggCount') ? eggInfo(val('eggCount')) : { count: 0, infertile: 0, notes: '' };
      if (val('eggCount') && tx(val('eggCount'))) used++;
      const fertN = num(val('fertile')), infN = num(val('infertile'));
      if (tx(val('fertile'))) used++;
      if (tx(val('infertile'))) used++;
      let infertile = infN != null ? infN : eggs.infertile;
      if (fertN != null && eggs.count && infN == null) infertile = Math.max(0, eggs.count - fertN);
      const totalEggs = eggs.count || ((fertN || 0) + (infN || 0)) || 0;
      const hatchC = val('clutchHatch');
      let hatchD = null;
      const hatchN = num(val('hatchCount'));
      if (tx(hatchC)) used++;
      if (tx(val('hatchCount'))) used++;
      const clutchNo = tx(val('clutchNo'));
      if (clutchNo) used++;
      let layDates = [];
      layFd.forEach(fd => {
        const c = cellAt(b, r, fd.col); const t = tx(c);
        if (!t && !(c && c.d)) return;
        const ds = c.d ? { dates: [{ iso: c.d }], tail: '' } : allDates(t, { today, anchor: mateAnchor, year: sec.year });
        if (!ds.dates.length) {
          const li = layCell(c, mateAnchor, sec.year);
          if (li && li.date) { layDates.push({ iso: li.date, cell: li }); used++; return; }
          memo.push(asMemo(fd, c)); stats.memo++; note(b, r, fd.header, t, '날짜로 못 읽어 메모로 둠'); return;
        }
        if (ds.dates.length === 1) { const li = layCell(c, mateAnchor, sec.year); layDates.push({ iso: ds.dates[0].iso, cell: li }); }
        else ds.dates.forEach(d => layDates.push({ iso: d.iso }));
        used++;
      });
      if (hatchC && (tx(hatchC) || hatchC.d)) hatchD = dateOf(hatchC, { anchor: (layDates[0] && layDates[0].iso) || mateAnchor, year: sec.year });
      if (hatchD && hatchD.partial) hatchD = null;
      if (hatchC && tx(hatchC) && !hatchD) { memo.push(asMemo(f1('clutchHatch'), hatchC)); note(b, r, f1('clutchHatch').header, tx(hatchC), '부화일로 못 읽어 메모로 둠'); }
      // 비고·온도 같은 칸은 그 줄의 산란 기록 메모에 붙입니다(따로 메모를 만들지 않게)
      const rowNotes = [];
      F('notes').concat(F('incub')).forEach(fd => { const c = cellAt(b, r, fd.col); if (tx(c)) { rowNotes.push(asMemo(fd, c)); stats.memo++; } });
      if (!layDates.length && b.kind === 'laying' && (totalEggs || hatchD) && !F('layN').length) {
        memo.push('산란일을 모르는 알 ' + (totalEggs || '') + (totalEggs ? '개' : '') + (hatchD ? ` · 부화 ${hatchD.iso}` : ''));
        note(b, r, '산란일', '(빈 칸)', '산란일이 없어 메모로 둠');
      }
      layDates.forEach((ld, i) => {
        const single = layDates.length === 1;
        const ci = ld.cell && ld.cell.eggs ? ld.cell.eggs : { count: 0, infertile: 0, notes: '' };
        const cnt = single ? (totalEggs || ci.count) : ci.count;
        const inf = single ? (infertile || ci.infertile) : ci.infertile;
        const notes = [clutchNo ? (/차/.test(clutchNo) ? clutchNo : clutchNo + '차') : '', ci.notes, single ? eggs.notes : '', ...(i === 0 ? rowNotes.splice(0) : [])].filter(Boolean);
        const hd = single ? (hatchD && hatchD.iso) || (ld.cell && ld.cell.hatch) : (ld.cell && ld.cell.hatch);
        const hn = single ? (hatchN || (ld.cell && ld.cell.hatchCount) || 0) : ((ld.cell && ld.cell.hatchCount) || 0);
        if (inf && cnt && inf >= cnt) notes.push('무정');
        const data = { eggCount: cnt ? String(cnt) : '', notes: notes.join(' · '), ...sireData };
        const units = inf && cnt && inf < cnt ? eggUnits(cnt, inf, hd ? (hn || 0) : 0, hd) : null;
        if (units) data.eggUnits = units;
        if (!data.notes) delete data.notes;
        const lay = addEv(fem, 'laying', ld.iso, data, from);
        if (hd && lay) addEv(fem, 'hatching', hd, { count: hn ? String(hn) : '', layingId: lay.id }, from);
      });
      // N차 산란 칸들
      let anchor = mateAnchor;
      const cntFor = n0 => b.fields.find(x => x.field === 'layNc:' + n0);
      b.fields.filter(x => /^layNc:/.test(x.field)).forEach(fd => { if (tx(cellAt(b, r, fd.col))) used++; });
      F('layN').filter(x => /^layN:/.test(x.field)).sort((a, b2) => +a.field.split(':')[1] - +b2.field.split(':')[1]).forEach(fd => {
        const c = cellAt(b, r, fd.col); const t = tx(c);
        if (!t && !(c && c.d)) return;
        const li = layCell(c, anchor, sec.year);
        const cfd = cntFor(fd.field.split(':')[1]);
        if (li && !li.bad && cfd) { const ce = eggInfo(cellAt(b, r, cfd.col)); if (ce.count && !li.eggs.count) li.eggs.count = ce.count; if (ce.infertile && !li.eggs.infertile) li.eggs.infertile = ce.infertile; }
        if (!li || li.bad) {
          if (ox(t) === true || /^(o|ㅇ|○)$/i.test(t)) { memo.push(asMemo(fd, c)); stats.memo++; return; }
          memo.push(asMemo(fd, c)); stats.memo++; note(b, r, fd.header, t, '산란 날짜로 못 읽어 메모로 둠'); return;
        }
        used++;
        const n0 = +fd.field.split(':')[1];
        const cnt = li.eggs.count, inf = li.eggs.infertile;
        const notes = [li.eggs.notes];
        if (inf && cnt && inf >= cnt) notes.push('무정');
        else if (inf && !cnt) notes.push('무정');
        const data = { eggCount: cnt ? String(cnt) : '', ...sireData };
        const nt = notes.filter(Boolean).join(' · ');
        if (nt) data.notes = nt;
        const units = inf && cnt && inf < cnt ? eggUnits(cnt, inf, li.hatch ? (li.hatchCount || 0) : 0, li.hatch) : null;
        if (units) data.eggUnits = units;
        const lay = addEv(fem, 'laying', li.date, data, { ...from, n: n0 });
        if (li.hatch && lay) addEv(fem, 'hatching', li.hatch, { count: li.hatchCount ? String(li.hatchCount) : '', layingId: lay.id }, from);
        anchor = li.date;
      });
      // 메이팅 시트인데 메이팅 날짜 칸이 없고 날짜 없는 줄 — 짝만 적힌 경우
      if (b.kind === 'mating' && !F('matingDate').length && male && !layDates.length && !F('layN').some(fd => tx(cellAt(b, r, fd.col)))) {
        memo.push(`메이팅 상대: ${male.name} (날짜 없음)`);
      }
      memo.push(...rowNotes);
      F('expected').concat(F('ignore')).forEach(fd => { if (tx(cellAt(b, r, fd.col))) stats.ignored++; });
      stats.used += used;
      if (memo.length) {
        const d0 = (layDates[0] && layDates[0].iso) || mateAnchor || today;
        addEv(fem, 'memo', d0, { notes: memo.join(' · ') }, from);
      }
    });
  });

  /* ════ 3단계: 날짜별 기록 · 날짜 칸 표 · 일지 ════ */
  const knownNamesRe = () => {
    const names = ents.map(e => e.name).filter(n => n && n.length >= 2).sort((a, b) => b.length - a.length);
    const alt = [];
    names.forEach(n => { alt.push(n); if (n.length > 2 && n.endsWith('이')) alt.push(n.slice(0, -1)); });
    if (!alt.length) return null;
    return new RegExp('(' + alt.map(s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')', 'g');
  };
  /* 글 한 줄 → 기록들 (앱의 대화 해석을 그대로 씁니다) */
  const factsFromText = (ent, date, text, from, extraEnts) => {
    const t = clean(text);
    if (!t) return 0;
    let facts = [];
    if (extract) { try { facts = extract(t) || []; } catch (e) { facts = []; } }
    let n = 0;
    facts.forEach(f => {
      const d = f.date && f.date !== today ? f.date : date;
      if (f.type === 'mating' && extraEnts && extraEnts.length) {
        const other = extraEnts.find(x => x !== ent);
        // 암컷에게 적습니다. 둘 다 성별을 모르면 뒤에 말한 쪽을 암컷으로 봅니다
        const fem = other && (cur(other, 'gender') === 'female' || (cur(ent, 'gender') !== 'female' && cur(other, 'gender') !== 'male')) ? other : ent;
        const mal = fem === ent ? other : ent;
        if (addEv(fem, 'mating', d, mal ? { partnerId: mal.id, partnerName: mal.name } : {}, from)) n++;
        return;
      }
      if (f.type === 'distribution') {
        const won = f.data && f.data.price ? Number(f.data.price) : 0;
        setF(ent, 'status', 'sold', true);
        if (won) setF(ent, 'salePrice', String(won), true);
        if (addEv(ent, 'distribution', d, { price: won ? String(won) : '', free: false, notes: f.data && f.data.buyer ? '분양처: ' + f.data.buyer : '' }, from)) n++;
        return;
      }
      const data = { ...(f.data || {}) };
      if (f.type === 'feeding' && data.notes === t) data.notes = t;
      if (f.type === 'health' && !data.notes) data.notes = t;
      if (addEv(ent, f.type, d, data, from)) n++;
    });
    return n;
  };
  blocks.filter(b => ['events', 'grid', 'gridT', 'diary'].includes(b.kind)).forEach(b => {
    const sec = rowCtx(b);
    const F = f => b.fields.filter(x => x.field === f);
    const f1 = f => F(f)[0];
    let lastDate = null, lastSubj = '';
    const gridDateOf = (fd) => {
      const hr = b.headerRow >= 0 ? b.grid.rows[b.headerRow] : null;
      const hc = hr && hr[fd.col];
      if (hc && hc.d) return hc.d;
      const h = fd.header;
      const mm = h.match(/^(\d{1,2})\s*월$/);
      if (mm) { const y = pickYear(+mm[1], 1, { today, year: sec.year || b.sheetYear }); return y ? iso(y, +mm[1], 1) : null; }
      const d = cellDate({ t: h, n: hc && hc.n }, { dateCol: true, today, year: sec.year || b.sheetYear });
      return d && !d.partial ? d.iso : d && d.partial ? d.iso : null;
    };
    const weightHint = /무게|체중|몸무게|weight|성장|g\b/i.test(b.sheet + ' ' + b.fields.map(x => x.header).join(' '));
    const cellEvent = (ent, date, fd, c, from) => {
      const t = tx(c);
      const n = typeof (c && c.n) === 'number' && !c.d ? c.n : (/^\d+(\.\d+)?\s*(g|그램)?$/i.test(t) ? parseFloat(t) : null);
      if (n !== null) {
        if ((weightHint || (n > 0 && n <= 300)) && n > 0) { addEv(ent, 'growth', date, { weight: String(n) }, from); return 'used'; }
        return 'memo';
      }
      const y = ox(t);
      const feedHint = /먹이|급여|피딩|밥|feed/i.test(b.sheet);
      const shedHint = /탈피|shed/i.test(b.sheet);
      if (y !== null) {
        if (shedHint) { if (y) addEv(ent, 'shed', date, {}, from); return y ? 'used' : 'ignored'; }
        addEv(ent, 'feeding', date, y ? { foodType: '', notes: '' } : { ate: false, foodType: '', notes: /거식|거부/.test(t) ? t : '안 먹음' }, from);
        return 'used';
      }
      if (/^(탈피|허물)$/.test(t)) { addEv(ent, 'shed', date, {}, from); return 'used'; }
      const ft = foodType(t);
      if (ft && t.length <= 12 && !/\d/.test(t)) { addEv(ent, 'feeding', date, { foodType: ft, notes: t }, from); return 'used'; }
      const got = factsFromText(ent, date, t, from);
      if (got) return 'used';
      if (feedHint) { addEv(ent, 'feeding', date, { foodType: ft, notes: t }, from); return 'used'; }
      addEv(ent, 'memo', date, { notes: t }, from);
      return 'memo';
    };
    b.rows.forEach(r => {
      const k = classifyRow(b, r, sec);
      if (k !== 'row') { b.fields.forEach(fd => { if (tx(cellAt(b, r, fd.col))) { stats.cells++; stats.ignored++; } }); if (k !== 'empty') stats.skippedRows++; return; }
      stats.rows++;
      const from = { sheet: b.sheet, row: r + 1 };
      if (b.kind === 'grid') {
        const sfd = f1('subject');
        const nm = sfd ? tx(cellAt(b, r, sfd.col)) : '';
        if (!nm) { b.fields.forEach(fd => { if (tx(cellAt(b, r, fd.col))) { stats.cells++; stats.ignored++; } }); note(b, r, '이름', '(빈 칸)', '이름이 없어 이 줄은 건너뜀'); return; }
        const ent = subjectEnt(nm, null, from, b, r);
        stats.cells++; stats.used++;
        b.fields.forEach(fd => {
          if (fd.field === 'subject') return;
          const c = cellAt(b, r, fd.col); const t = tx(c);
          if (!t && !(c && typeof c.n === 'number')) return;
          stats.cells++;
          if (!ent) { stats.ignored++; return; }
          if (fd.field === 'gridDate') {
            const d = gridDateOf(fd);
            if (!d) { addMemo(ent, asMemo(fd, c)); stats.memo++; return; }
            const res = cellEvent(ent, d, fd, c, from);
            stats[res === 'used' ? 'used' : res === 'memo' ? 'memo' : 'ignored']++;
          } else if (fd.field === 'gender') { const g = gender(t); if (g) { setF(ent, 'gender', g.g); stats.used++; } else { addMemo(ent, asMemo(fd, c)); stats.memo++; } }
          else if (fd.field === 'morph') { setF(ent, 'morph', t); stats.used++; }
          else if (fd.field === 'ignore') stats.ignored++;
          else { addMemo(ent, asMemo(fd, c)); stats.memo++; }
        });
        return;
      }
      if (b.kind === 'gridT') {
        const dfd = f1('date');
        const dc = dfd ? cellAt(b, r, dfd.col) : null;
        const d = dc ? dateOf(dc, { year: sec.year, anchor: lastDate }) : null;
        if (!d || d.partial) { b.fields.forEach(fd => { if (tx(cellAt(b, r, fd.col))) { stats.cells++; stats.ignored++; } }); note(b, r, dfd ? dfd.header : '날짜', tx(dc) || '(빈 칸)', '날짜를 몰라 이 줄은 건너뜀'); return; }
        lastDate = d.iso;
        stats.cells++; stats.used++;
        b.fields.forEach(fd => {
          if (fd.field === 'date') return;
          const c = cellAt(b, r, fd.col); const t = tx(c);
          if (!t && !(c && typeof c.n === 'number')) return;
          stats.cells++;
          if (fd.field === 'subject') {
            const ent = subjectEnt(fd.header, null, from, b, r);
            if (!ent) { stats.ignored++; return; }
            const res = cellEvent(ent, d.iso, fd, c, from);
            stats[res === 'used' ? 'used' : res === 'memo' ? 'memo' : 'ignored']++;
          } else stats.ignored++;
        });
        return;
      }
      // 날짜별 기록 · 일지
      const dfd = f1('date');
      const dc = dfd ? cellAt(b, r, dfd.col) : null;
      let d = dc && tx(dc) ? dateOf(dc, { year: sec.year, anchor: null }) : null;
      if (dc && tx(dc)) stats.cells++;
      if (d && !d.partial) { lastDate = d.iso; stats.used++; }
      else if (dc && tx(dc)) { note(b, r, dfd.header, tx(dc), '날짜로 못 읽음 — 글 속 날짜나 위 줄 날짜로'); }
      const textFds = [...F('text'), ...F('notes'), ...F('health')];
      const textAll = textFds.map(fd => tx(cellAt(b, r, fd.col))).filter(Boolean).join(' · ');
      if (!d || d.partial) {
        let inText = textAll ? findDate(textAll, { today, year: sec.year, loose: false }) : null;
        // 줄 첫머리의 "9/5", "9.5" 도 날짜로 봅니다(메모장에 흔한 모양)
        if (!inText && textAll) { const lm = textAll.match(/^\s*(\d{1,2})\s*[/.]\s*(\d{1,2})(?!\d)/); if (lm) { const y = pickYear(+lm[1], +lm[2], { today, year: sec.year, anchor: null }); if (y) inText = { iso: iso(y, +lm[1], +lm[2]) }; } }
        d = inText && !inText.partial ? { iso: inText.iso } : (lastDate ? { iso: lastDate } : null);
      }
      const sfd = f1('subject');
      let names = [];
      if (sfd && tx(cellAt(b, r, sfd.col))) {
        const raw = tx(cellAt(b, r, sfd.col));
        stats.cells++; stats.used++;
        names = raw.split(/\s*(?:,|\/|&|\+|·|와|과|랑)\s*/).filter(Boolean);
        lastSubj = raw;
      } else if (sfd && lastSubj && b.kind === 'events') names = [lastSubj];
      let subj = names.map(n => subjectEnt(n, null, from, b, r)).filter(Boolean);
      if (!subj.length && textAll) {
        const re = knownNamesRe();
        const hits = re ? [...new Set((textAll.match(re) || []))] : [];
        subj = hits.map(h => find(h)).filter(Boolean).filter((e, i, a) => a.indexOf(e) === i);
      }
      // 처음 보는 이름 — 글 첫머리의 이름을 찾습니다("해님이랑 별이 합사" → 해님, 별이)
      if (!(sfd && names.length) && textAll) {
        const guessed = guessSubjects(textAll.replace(/^\s*\d{1,4}[./-]\d{1,2}(?:[./-]\d{1,2})?\s*/, ''));
        const facts = guessed.length && extract ? (extract(textAll) || []) : [];
        if (guessed.length && facts.length) {
          const g2 = guessed.map(n => find(n) || subjectEnt(n, null, from, b, r)).filter(Boolean);
          subj = [...g2, ...subj].filter((e, i, a) => a.indexOf(e) === i);
        }
      }
      const otherFds = b.fields.filter(fd => !['date', 'subject', 'text', 'notes', 'health', 'ignore'].includes(fd.field));
      const cellsHere = otherFds.filter(fd => tx(cellAt(b, r, fd.col)) || typeof (cellAt(b, r, fd.col) || {}).n === 'number');
      cellsHere.forEach(() => stats.cells++);
      textFds.forEach(fd => { if (tx(cellAt(b, r, fd.col))) stats.cells++; });
      b.fields.filter(fd => fd.field === 'ignore').forEach(fd => { if (tx(cellAt(b, r, fd.col))) { stats.cells++; stats.ignored++; } });
      if (!d) {
        cellsHere.concat(textFds.filter(fd => tx(cellAt(b, r, fd.col)))).forEach(() => stats.ignored++);
        note(b, r, dfd ? dfd.header : '날짜', textAll || '(빈 칸)', '날짜를 몰라 이 줄은 건너뜀');
        return;
      }
      if (!subj.length) {
        // 개체가 없는 줄 — 돈 이야기면 가계부로
        const led = textAll && typeof G.extractLedger === 'function' ? G.extractLedger(textAll) : null;
        if (led && led.data && led.data.amount) { addEv(null, 'ledger', d.iso, { ...led.data, notes: textAll }, from); stats.used += textFds.filter(fd => tx(cellAt(b, r, fd.col))).length; return; }
        cellsHere.concat(textFds.filter(fd => tx(cellAt(b, r, fd.col)))).forEach(() => stats.ignored++);
        note(b, r, '개체', textAll || '(빈 칸)', '어느 아이 이야기인지 몰라 건너뜀');
        return;
      }
      subj.forEach(ent => {
        cellsHere.forEach(fd => {
          const c = cellAt(b, r, fd.col); const t = tx(c);
          switch (fd.field) {
            case 'weight': { const n = num(c); if (n) addEv(ent, 'growth', d.iso, { weight: String(n) }, from); break; }
            case 'food': { const y = ox(t); addEv(ent, 'feeding', d.iso, y === false ? { ate: false, foodType: '', notes: '안 먹음' } : { foodType: foodType(t), notes: t }, from); break; }
            case 'ate': { const y = ox(t); if (y === false || /안|거부|거식|남김/.test(t)) addEv(ent, 'feeding', d.iso, { ate: false, foodType: '', notes: t }, from); else addEv(ent, 'feeding', d.iso, { foodType: '', notes: t }, from); break; }
            case 'shed': { const y = ox(t); if (y !== false) addEv(ent, 'shed', d.iso, {}, from); break; }
            case 'eggCount': { const e2 = eggInfo(c); addEv(ent, 'laying', d.iso, { eggCount: e2.count ? String(e2.count) : '' }, from); break; }
            default: addEv(ent, 'memo', d.iso, { notes: asMemo(fd, c) }, from); break;
          }
        });
      });
      stats.used += cellsHere.length;
      if (textAll) {
        const got = factsFromText(subj[0], d.iso, textAll, from, subj.length > 1 ? subj : null);
        if (subj.length > 1 && got) subj.slice(1).forEach(e => { const f2 = extract ? (extract(textAll) || []) : []; if (!f2.some(x => x.type === 'mating')) factsFromText(e, d.iso, textAll, from); });
        if (got) stats.used += textFds.filter(fd => tx(cellAt(b, r, fd.col))).length;
        else { subj.forEach(e => addEv(e, 'memo', d.iso, { notes: textAll }, from)); stats.memo += textFds.filter(fd => tx(cellAt(b, r, fd.col))).length; }
      }
    });
  });

  /* ════ 4단계: 가계부 ════ */
  blocks.filter(b => b.kind === 'ledger').forEach(b => {
    const sec = rowCtx(b);
    const F = f => b.fields.filter(x => x.field === f);
    const f1 = f => F(f)[0];
    const unitFor = fd => {
      if (!fd) return 1;
      if (b.ov.amountUnit) return b.ov.amountUnit;
      if (fd.unit) return fd.unit;
      const nums = b.rows.map(r => cellAt(b, r, fd.col)).filter(c => c && typeof c.n === 'number' && !c.d).map(c => Math.abs(c.n)).filter(n => n > 0);
      if (!nums.length) return 1;
      const s = nums.slice().sort((x, y) => x - y);
      return s[Math.floor(s.length / 2)] < 300 && s[s.length - 1] < 5000 ? 10000 : 1;
    };
    b.units = { amount: unitFor(f1('amount')), income: unitFor(f1('income')), expense: unitFor(f1('expense')) };
    let lastDate = null;
    b.rows.forEach(r => {
      const k = classifyRow(b, r, sec);
      if (k !== 'row') { b.fields.forEach(fd => { if (tx(cellAt(b, r, fd.col))) { stats.cells++; stats.ignored++; } }); if (k !== 'empty') stats.skippedRows++; return; }
      stats.rows++;
      const from = { sheet: b.sheet, row: r + 1 };
      const val = f => { const fd = f1(f); return fd ? cellAt(b, r, fd.col) : null; };
      const filled = b.fields.filter(fd => tx(cellAt(b, r, fd.col)) || typeof (cellAt(b, r, fd.col) || {}).n === 'number');
      filled.forEach(() => stats.cells++);
      const dc = val('date');
      let d = dc && (tx(dc) || dc.d) ? dateOf(dc, { year: sec.year, anchor: lastDate }) : null;
      if (d && !d.partial) lastDate = d.iso; else d = lastDate ? { iso: lastDate } : null;
      let flow = null, m = null;
      const inc = val('income') && money(val('income'), b.units.income);
      const exp = val('expense') && money(val('expense'), b.units.expense);
      if (inc && inc.won) { flow = 'in'; m = inc; }
      if (exp && exp.won) { if (m) { /* 한 줄에 둘 다 — 따로 적습니다 */ } else { flow = 'out'; m = exp; } }
      if (!m && val('amount')) { m = money(val('amount'), b.units.amount); if (m && m.neg) flow = 'out'; }
      const words = [tx(val('flow')), tx(val('category')), ...F('item').map(fd => tx(cellAt(b, r, fd.col))), ...F('notes').map(fd => tx(cellAt(b, r, fd.col)))].filter(Boolean).join(' ');
      const ft = tx(val('flow'));
      if (!flow && ft) flow = /수입|입금|매출|\+|in|판매|받/i.test(ft) ? 'in' : /지출|출금|-|out|구입|구매|비용/i.test(ft) ? 'out' : null;
      if (!flow) flow = /분양|판매|팔|입금|수입|매출/.test(words) && !/분양\s*받|구입|구매|샀/.test(words) ? 'in' : 'out';
      if (!m || (!m.won && !m.free)) {
        filled.forEach(() => stats.ignored++);
        if (filled.length) note(b, r, f1('amount') ? f1('amount').header : '금액', words || '(빈 칸)', '금액이 없어 이 줄은 건너뜀');
        return;
      }
      if (!d) { filled.forEach(() => stats.ignored++); note(b, r, '날짜', words, '날짜를 몰라 이 줄은 건너뜀'); return; }
      const catRaw = tx(val('category'));
      const cats = flow === 'in' ? ['분양', '용품 판매', '기타'] : ['사료·먹이', '용품', '개체 구입', '전기·난방', '택배·포장', '병원', '기타'];
      let category = cats.find(c => hkey(c) === hkey(catRaw)) || '';
      if (!category) {
        const rules = typeof LEDGER_CAT !== 'undefined' ? LEDGER_CAT : LEDGER_RULES;
        const hit = rules.find(([re]) => re.test(words));
        category = hit && cats.includes(hit[1]) ? hit[1] : (flow === 'in' ? (/분양|판매|팔/.test(words) ? '분양' : '기타') : '기타');
      }
      const item = [catRaw && !cats.some(c => hkey(c) === hkey(catRaw)) ? catRaw : '', ...F('item').map(fd => tx(cellAt(b, r, fd.col))), ...F('notes').map(fd => tx(cellAt(b, r, fd.col)))].filter(Boolean).join(' · ');
      // 개체 이름이 보이면 그 아이 돈으로
      const re = knownNamesRe();
      const subjT = tx(val('subject'));
      const hitName = subjT || (re ? ((item.match(re) || [])[0]) : '');
      const indE = hitName ? find(hitName) : null;
      // 두 번 세지 않기 — 분양 수입은 분양 기록이, 개체 입양가는 입양 메모가 이미 셉니다
      if (indE && flow === 'in' && category === '분양' && (indE._sale || exEvents.some(e => e.individualId === indE.id && e.type === 'distribution'))) {
        filled.forEach(() => stats.ignored++); note(b, r, '금액', item, `${indE.name} 분양 기록과 겹쳐 빼 둠`); return;
      }
      if (indE && flow === 'out' && category === '개체 구입' && ((indE._adopt && indE._adopt.parts.some(p => /입양가/.test(p))) || exEvents.some(e => e.individualId === indE.id && e.type === 'memo' && /입양가/.test((e.data && e.data.notes) || '')))) {
        filled.forEach(() => stats.ignored++); note(b, r, '금액', item, `${indE.name} 입양가와 겹쳐 빼 둠`); return;
      }
      addEv(null, 'ledger', d.iso, { flow, category, amount: m.won, notes: item, indId: indE ? indE.id : null }, from);
      if (inc && inc.won && exp && exp.won) addEv(null, 'ledger', d.iso, { flow: 'out', category, amount: exp.won, notes: item, indId: indE ? indE.id : null }, from);
      filled.forEach(fd => (fd.field === 'balance' || fd.field === 'ignore') ? stats.ignored++ : stats.used++);
    });
  });

  /* ════ 마무리: 개체별 메모·분양·뒤늦은 기록을 기록으로 ════ */
  ents.forEach(ent => {
    if (ent._adopt) {
      const parts = [...ent._adopt.parts, ...ent.memo];
      if (parts.length) {
        const data = { notes: parts.join(' · ') };
        if (ent._adopt.date) data.dated = true;
        addEv(ent, 'memo', ent._adopt.date || today, data, ent._adopt.from);
      }
    } else if (ent.memo.length) addEv(ent, 'memo', today, { notes: ent.memo.join(' · ') }, null);
    if (ent._sale) {
      const s = ent._sale;
      const already = exEvents.some(e => e.individualId === ent.id && e.type === 'distribution');
      if (!already) addEv(ent, 'distribution', s.date, { price: s.won ? String(s.won) : '', free: s.free, notes: s.buyer ? '분양처: ' + s.buyer : '' }, s.from);
      if (s.dated) setF(ent, 'soldDate', s.date);
    }
    (ent._later || []).forEach(x => {
      if (x.type === 'growth') addEv(ent, 'growth', x.date, x.undated ? { weight: String(x.weight), notes: '엑셀에 적혀 있던 무게' } : { weight: String(x.weight) }, x.from);
      else addEv(ent, x.type, x.date, {}, x.from);
    });
    if (ent.set.status === 'gone' && ent.isNew) ent.set.goneDate = ent.set.goneDate || '';
  });

  // 해칭 시트의 아기들 → 엄마에게 "해칭" 기록 (같은 엄마·같은 날은 한 건, 마릿수 합산)
  const hatchGroups = new Map();
  ents.filter(e => e.isNew && e.set.isFromCreGunseol && e.set.damId && e.set.hatchDate).forEach(e => {
    const k = e.set.damId + '|' + e.set.hatchDate;
    hatchGroups.set(k, (hatchGroups.get(k) || 0) + 1);
  });
  hatchGroups.forEach((n, k) => {
    const [damId, date] = k.split('|');
    if (events.some(e => e.individualId === damId && e.type === 'hatching' && e.date === date)) return;
    if (exEvents.some(e => e.individualId === damId && e.type === 'hatching' && e.date === date)) return;
    const mom = ents.find(e => e.id === damId);
    const sireIds = ents.filter(e => e.set.damId === damId && e.set.hatchDate === date && e.set.sireId).map(e => e.set.sireId);
    const dad = sireIds.length ? ents.find(e => e.id === sireIds[0]) : null;
    addEv(mom, 'hatching', date, { count: String(n), ...(dad ? { sireId: dad.id, sireName: dad.name } : {}) }, { sheet: '해칭', auto: true });
  });

  /* ── 결과 정리 ── */
  const newInds = ents.filter(e => e.isNew).map(e => ({ id: e.id, name: e.name, ...e.set, importBatch: batch }));
  const patches = ents.filter(e => !e.isNew && Object.keys(e.set).length).map(e => {
    const prev = {};
    Object.keys(e.set).forEach(k => { prev[k] = e.base[k] === undefined ? null : e.base[k]; });
    return { id: e.id, name: e.name, set: { ...e.set }, prev };
  });
  const outEvents = events.map(e => { const { _ent, _from, ...rest } = e; return { ...rest, importBatch: batch }; });
  const byType = {};
  outEvents.forEach(e => { byType[e.type] = (byType[e.type] || 0) + 1; });
  const onlyRecord = ents.filter(e => e.isNew && e.from.some(f => f && f.onlyRecord) && !e.from.some(f => f && !f.onlyRecord)).map(e => e.name);
  const externals = ents.filter(e => e.isNew && e.set.isExternal).map(e => e.name);
  const cover = stats.cells ? (stats.used + stats.memo + stats.ignored) / stats.cells : 1;
  return {
    batch, blocks: blocks.map(b => ({ id: b.id, sheet: b.sheet, kind: b.kind, kindGuess: b.kindGuess, mode: b.mode, headerRow: b.headerRow,
                                     rows: b.rows.length, fields: b.fields.map(({ prof, ...f }) => f), units: b.units || null })),
    newInds, patches, events: outEvents, byType, dupSkipped, issues, stats: { ...stats, cover },
    onlyRecord, externals,
    preview: ents.filter(e => e.isNew || Object.keys(e.set).length).slice(0, 400).map(e => ({ id: e.id, isNew: e.isNew, name: e.name, ...(e.isNew ? e.set : { ...e.base, ...e.set }) })),
  };
}

/* 글 첫머리의 이름 짐작 — "해님이랑 별이 합사" · "별이 탈피함" · "크한x크순 메이팅"
   ★ 기록할 거리(탈피·산란·먹이…)가 함께 있을 때만 씁니다(부르는 쪽에서 확인). */
const NOT_SUBJECT = /^(오늘|어제|그제|내일|아침|저녁|밤|낮|그냥|전체|모두|다들|애들|아이들|전부|사료|판게아|레파시|귀뚜라미|귀뚤|먹이|밥|알|인큐|온도|습도|택배|분양|구입|구매|메이팅|합사|산란|탈피|피딩|급여|청소|환기|날씨|비|병원|이번|지난|다음|새|새로|처음|오전|오후|주말|요즘|계속|아직|또|다시|총|합계)$/;
function guessSubjects(text) {
  const t = clean(text);
  const strip = w => w.replace(/(이랑|랑|이와|와|과|하고|이가|이는|이도|이를|이의|이에게|에게|한테|가|는|은|를|을|도|의)$/, '');
  const m = t.match(/^([가-힣A-Za-z0-9]{1,10}?)(?:이랑|랑|와|과|하고|\s*[x×&+,]\s*|\s+)([가-힣A-Za-z0-9]{1,10})?/);
  if (!m) return [];
  const out = [];
  const a = strip(m[1] || '');
  if (a.length >= 2 && looksName(a) && !NOT_SUBJECT.test(a)) out.push(a);
  if (!out.length) return [];
  // 두 번째 이름은 "랑/와/x" 로 이어졌을 때만
  const joined = /^[가-힣A-Za-z0-9]{1,10}?(이랑|랑|와|과|하고|\s*[x×&+,]\s*)/.test(t);
  if (joined && m[2]) { const b = strip(m[2]); if (b.length >= 2 && looksName(b) && !NOT_SUBJECT.test(b)) out.push(b); }
  return out;
}

/* 앱 밖(시험)에서 쓰는 가계부 분류 — 앱 안에서는 LEDGER_CAT 을 그대로 씁니다 */
const LEDGER_RULES = [
  [/사료|먹이|판게아|레파시|슈퍼푸드|슈푸|슬러리|CGD|귀뚜라미|귀뚤|밀웜|슈퍼웜|두비아|레드런|충식/i, '사료·먹이'],
  [/개체|입양|분양\s*받|데려왔|영입|들여왔/, '개체 구입'],
  [/전기|난방|히터|온조기|보온|전기세|전기요금|관리비/, '전기·난방'],
  [/택배|포장|배송|운송|퀵|박스|아이스팩|핫팩/, '택배·포장'],
  [/병원|진료|수의사|약값|치료/, '병원'],
  [/용품|사육장|케이지|렉|바닥재|은신처|핀셋|먹이컵|온습도계|분무기|화분|유목/, '용품'],
];
function babyNames(momName, dadName, count, existing) {
  const core = n => { let s = (n || '').trim(); if (s.length > 1 && s.endsWith('이')) s = s.slice(0, -1); return s.length ? s[s.length - 1] : ''; };
  const base = (core(momName) + core(dadName)) || '베이비';
  const out = []; let n = 1;
  for (let i = 0; i < count; i++) { while (existing.includes(`${base}${n}호`) || out.includes(`${base}${n}호`)) n++; out.push(`${base}${n}호`); n++; }
  return out;
}


/* ══════════════════════════════════════════
   넣기 · 되돌리기
   env = { DB, STORE } — 앱 안에서는 앱의 DB·STORE 를 그대로 씁니다
   ★ 한 번에 저장합니다(개체 → 기록). 기록 저장이 실패하면 개체도 원래대로 돌립니다.
   ══════════════════════════════════════════ */
const UNDO_KEY = 'cg_import_undo';
function applyPlan(plan, env) {
  const { DB, STORE } = env;
  const at = new Date().toISOString();
  const before = DB.getIndividuals();
  const byId = new Map(before.map(i => [i.id, i]));
  const livePatches = [];
  plan.patches.forEach(p => {
    const curI = byId.get(p.id);
    if (!curI) return;
    const prev = {};
    Object.keys(p.set).forEach(k => { prev[k] = curI[k] === undefined ? null : curI[k]; });
    byId.set(p.id, { ...curI, ...p.set });
    livePatches.push({ id: p.id, set: p.set, prev });
  });
  const newInds = plan.newInds.map(n => ({ ...n, createdAt: at }));
  const inds = before.map(i => byId.get(i.id)).concat(newInds);
  if (!DB.saveIndividuals(inds)) return { ok: false, why: 'store' };
  const evs = DB.getEvents();
  const add = plan.events.map(e => ({ ...e, createdAt: at }));
  if (!DB.saveEvents(evs.concat(add))) {
    DB.saveIndividuals(before);
    return { ok: false, why: 'store' };
  }
  const undo = { batch: plan.batch, at, indIds: newInds.map(i => i.id), evIds: add.map(e => e.id), patches: livePatches,
                 counts: { inds: newInds.length, events: add.length, patched: livePatches.length } };
  try { STORE.set(UNDO_KEY, JSON.stringify(undo)); } catch (e) {}
  return { ok: true, undo };
}
function lastImport() {
  try { const v = JSON.parse(localStorage.getItem(UNDO_KEY) || 'null'); return v && v.batch ? v : null; } catch (e) { return null; }
}
/* 되돌리기 — 가져온 개체·기록을 빼고, 채워 넣었던 칸은 원래 값으로.
   가져온 뒤 그 아이들에게 새로 적은 기록도 같이 빠집니다(주인 없는 기록이 남지 않게). */
function undoImport(env, u0) {
  const { DB, STORE } = env;
  const u = u0 || lastImport();
  if (!u) return { ok: false };
  const indSet = new Set(u.indIds), evSet = new Set(u.evIds);
  const evs = DB.getEvents().filter(e => !evSet.has(e.id) && !(e.individualId && indSet.has(e.individualId)));
  const pmap = new Map(u.patches.map(p => [p.id, p]));
  const inds = DB.getIndividuals().filter(i => !indSet.has(i.id)).map(i => {
    let x = i;
    const p = pmap.get(i.id);
    if (p) {
      x = { ...i };
      Object.keys(p.set).forEach(k => {
        // 가져온 뒤 대표님이 직접 바꾼 칸은 그대로 둡니다
        if (JSON.stringify(x[k]) === JSON.stringify(p.set[k])) { if (p.prev[k] === null) delete x[k]; else x[k] = p.prev[k]; }
      });
    }
    if (x.sireId && indSet.has(x.sireId)) x = { ...x, sireId: null };
    if (x.damId && indSet.has(x.damId)) x = { ...x, damId: null };
    return x;
  });
  if (!DB.saveEvents(evs)) return { ok: false, why: 'store' };
  DB.saveIndividuals(inds);
  try { STORE.drop(UNDO_KEY); } catch (e) {}
  return { ok: true, removed: { inds: u.indIds.length, events: u.evIds.length } };
}

const api = {
  analyze, applyPlan, undoImport, lastImport, gridsFromWorkbook, gridsFromText,
  KIND_LABEL, MODE_LABEL, FIELD_LABEL, FIELDS_BY_KIND,
  // 시험용
  _t: { headerField, findDate, cellDate, gender, money, statusOf, tidyName, allDates, pickYear, looksName, profile },
};
if (typeof module !== 'undefined' && module.exports) module.exports = api;
G.CREG_IMPORT_ENGINE = api;
})(typeof window !== 'undefined' ? window : globalThis);
