/* v1.9.2 처음 온 사람 안내 — 필요할 때만 불러오는 조각 (welcome.min.js)
   app.min.js 가 먼저 떠 있어야 합니다. useState·TRACK·STORE·addDaysISO 등은 거기 것을 씁니다.
   window.CREG_WELCOME = { demoData, OpenHint, DemoGuide, Tutorial } */
(function () {
const INAPP = (() => {
  try {
    const ua = navigator.userAgent || '';
    const L = [[/Instagram/i, '인스타'], [/KAKAOTALK/i, '카카오톡'], [/FBAN|FBAV|FB_IAB/, '페이스북'], [/Barcelona/, '스레드'],
      [/NAVER\(inapp/i, '네이버'], [/ Line\//, '라인'], [/DaumApps/, '다음'], [/BAND\//, '밴드']];
    const hit = L.find(([re]) => re.test(ua));
    return hit ? hit[1] : '';
  } catch (e) { return ''; }
})();

/* 예시 아이들 — 오늘 날짜를 기준으로 만듭니다(언제 열어도 캘린더·브리핑이 살아 있게).
   루나(암) × 솔(수) 한 쌍이 30일마다 알을 낳고, 아기 셋이 나왔고, 하나는 분양됐습니다.
   모카는 얼마 전 메이팅해서 첫 산란을 기다리는 중입니다. */
function demoData(t) {
  const D = (n) => addDaysISO(t, n);
  const at = now();
  const inds = [], events = [];
  const I = (name, gender, morph, hatch, x) => {
    const i = { id: uuid(), name, gender, morph, spots: '', hatchDate: hatch, isFromCreGunseol: false, isExternal: false,
      sireId: null, damId: null, status: 'own', favorite: false, keep: false, shareCode: '', createdAt: at, ...(x || {}) };
    inds.push(i); return i;
  };
  const E = (ind, type, n, data) => { const e = { id: uuid(), individualId: ind ? ind.id : null, type, date: D(n), data: data || {}, createdAt: at }; events.push(e); return e; };
  const luna = I('루나', 'female', '릴리화이트', D(-730), { favorite: true, keep: true });
  const sol = I('솔', 'male', '할리퀸 핀스트라이프', D(-900), { keep: true });
  const moka = I('모카', 'female', '달마시안', D(-560));
  const pa = { sireId: sol.id, sireName: sol.name };
  const kid = { sireId: sol.id, damId: luna.id };
  const dotori = I('도토리', 'unknown', '할리퀸', D(-82), { ...kid, status: 'sold' });
  const berry = I('베리', 'unknown', '릴리화이트', D(-82), { ...kid, status: 'available', salePrice: '180000' });
  const cookie = I('쿠키', 'unknown', '핀스트라이프', D(-52), kid);
  E(luna, 'mating', -175, { partnerId: sol.id, partnerName: sol.name });
  E(moka, 'mating', -25, { partnerId: sol.id, partnerName: sol.name });
  const L = [-150, -120, -90, -60, -30].map(n => E(luna, 'laying', n, { eggCount: '2', ...pa }));
  E(luna, 'hatching', -82, { count: '2', layingId: L[0].id, ...pa });
  E(luna, 'hatching', -52, { count: '1', layingId: L[1].id, ...pa });
  E(luna, 'hatching', -22, { count: '2', layingId: L[2].id, ...pa });
  [[dotori, -40, '3.1'], [berry, -40, '3.0'], [berry, -20, '5.2'], [berry, -5, '7.4'], [cookie, -30, '2.4'], [cookie, -10, '4.0'],
   [luna, -14, '48'], [sol, -14, '42'], [moka, -14, '39']].forEach(([i, n, w]) => E(i, 'growth', n, { weight: w }));
  [[luna, -1, '슈푸'], [sol, -1, '슈푸'], [moka, -1, '충식'], [berry, -1, '슈푸'], [cookie, -2, '슈푸']].forEach(([i, n, f]) => E(i, 'feeding', n, { foodType: f, notes: '' }));
  E(moka, 'feeding', -3, { ate: false, foodType: '', notes: '안 먹음' });
  E(cookie, 'shed', -6, {});
  E(dotori, 'distribution', -6, { price: '150000', free: false, notes: '분양처: 인스타 DM' });
  E(null, 'ledger', -12, { flow: 'out', category: '사료·먹이', amount: 32000, notes: '슈퍼푸드' });
  E(null, 'ledger', -20, { flow: 'out', category: '용품', amount: 18000, notes: '인큐베이터 온도계' });
  return { inds, events };
}

// 앱 안 브라우저에서 크롬·사파리로 내보내기 (안내 카드와 튜토리얼 첫 화면이 같이 씁니다)
function openOutside() {
  const url = location.origin + location.pathname;
  try {
    if (INAPP === '카카오톡') location.href = 'kakaotalk://web/openExternal?url=' + encodeURIComponent(url);
    else if (TRACK.device() === 'android') location.href = 'intent://' + url.replace(/^https?:\/\//, '') + '#Intent;scheme=https;package=com.android.chrome;end';
    else location.href = 'x-safari-' + url;
  } catch (e) {}
}

function OpenHint() {
  const [, bump] = useState(0);
  const [copied, setCopied] = useState(false);
  const [hide, setHide] = useState(() => {
    try { return INAPP ? !!sessionStorage.getItem('cg_inapp_off') : !!localStorage.getItem('cg_install_off'); } catch (e) { return false; }
  });
  useEffect(() => {
    const f = () => bump(v => v + 1);
    window.addEventListener('cg-install', f);
    return () => window.removeEventListener('cg-install', f);
  }, []);
  const os = TRACK.device();
  if (hide || TRACK.standalone() || (!INAPP && os === 'pc')) return null;
  const url = location.origin + location.pathname;
  const close = () => {
    try { if (INAPP) sessionStorage.setItem('cg_inapp_off', '1'); else STORE.set('cg_install_off', '1'); } catch (e) {}
    setHide(true);
  };
  const copy = () => {
    const done = () => setCopied(true);
    try { navigator.clipboard.writeText(url).then(done, () => { try { window.prompt('주소를 길게 눌러 복사하세요', url); } catch (e) {} }); }
    catch (e) { try { window.prompt('주소를 길게 눌러 복사하세요', url); } catch (x) {} }
  };
  const openOut = openOutside;
  const install = () => {
    const ev = window.CG_INSTALL_EVT;
    if (!ev) return;
    try { ev.prompt(); ev.userChoice.then(() => { window.CG_INSTALL_EVT = null; bump(v => v + 1); }, () => {}); } catch (e) {}
  };
  const browser = os === 'ios' ? '사파리' : '크롬';
  const withRo = os === 'ios' ? '사파리로' : '크롬으로';
  return INAPP ? (
    <div className="openhint inapp" data-testid="open-hint" data-kind="inapp">
      <button className="x" onClick={close} aria-label="닫기">×</button>
      <b>{INAPP} 안에서 열려 있어요</b>
      <span>여기서 적은 기록은 {browser}에서 안 보여요.{'\n'}{withRo} 열어서 써 주세요.</span>
      <div className="row">
        <button onClick={openOut} data-testid="open-out">{withRo} 열기</button>
        <button className="ghost" onClick={copy}>{copied ? '복사됐어요 ✓' : '주소 복사'}</button>
      </div>
      <small>안 열리면 오른쪽 위 {os === 'ios' ? '⋯' : '⋮'} 를 누르고 '외부 브라우저로 열기'를 고르세요.</small>
    </div>
  ) : (
    <div className="openhint" data-testid="open-hint" data-kind="install">
      <button className="x" onClick={close} aria-label="닫기">×</button>
      <b>홈 화면에 앱으로 설치하세요</b>
      <span>아이콘 한 번에 열리고, 알림도 받을 수 있어요.</span>
      {os === 'android' && window.CG_INSTALL_EVT ? (
        <div className="row"><button onClick={install} data-testid="install-btn">설치하기</button></div>
      ) : (
        <small>{os === 'ios' ? "공유 버튼(□↑) → '홈 화면에 추가'" : "오른쪽 위 ⋮ → '홈 화면에 추가' 또는 '앱 설치'"}</small>
      )}
    </div>
  );
}

/* 연습 중 홈 맨 위 — 튜토리얼을 다시 볼 수 있는 작은 카드 */
function DemoGuide() {
  const again = () => { tutSet(0); try { window.dispatchEvent(new Event('cg-tut')); } catch (e) {} };
  return (
    <div className="card demo-guide" data-testid="demo-guide">
      <div className="dg-t">🦎 연습용 예시 아이들이에요</div>
      <div className="dg-s">마음껏 눌러 보고 적어 보세요. 다 해 보셨으면 맨 위 '내 것으로 시작'을 누르면 깨끗하게 비워져요.</div>
      <button className="dg-b" onClick={again} data-testid="tut-again">
        <span className="dg-i">▶</span><span><b>사용법 다시 보기</b><small>대화로 적기 → 저장 → 캘린더 → 브리핑</small></span><span className="dg-a">›</span>
      </button>
    </div>
  );
}

/* ══════════════════════════════════════════
   v1.9.3 게임식 튜토리얼 — 화면을 어둡게 하고 누를 곳만 밝혀, 크한이가 한 단계씩 시킵니다
   예시 아이 루나로 직접: 대화 열기 → 산란 말하기 → 저장 → 캘린더 → 브리핑 → 내 아이로 시작
   ★ 단계는 "눌렀는가"가 아니라 "그 화면이 나왔는가(until)"로 넘어갑니다 — 앱 쪽 동작을 건드리지 않고,
     빨리 누르거나 뒤로가기를 눌러도 꼬이지 않게. 필요한 화면이 사라지면(need) 앞 단계로 되돌아갑니다.
   ★ 진행 칸(cg_tut)은 연습(DEMO)과 함께 지워집니다.
   ══════════════════════════════════════════ */
const tutGet = () => { try { const v = parseInt(localStorage.getItem('cg_tut'), 10); return v >= 0 ? v : -1; } catch (e) { return -1; } };   // 없음·'done' → -1
const tutSet = (n) => { try { if (n < 0) STORE.set('cg_tut', 'done'); else STORE.set('cg_tut', String(n)); } catch (e) {} };
const Q = (sel) => { try { return document.querySelector(sel); } catch (e) { return null; } };
const lastWith = (sel, re) => { try { const l = [...document.querySelectorAll(sel)].filter(el => re.test(el.textContent || '')); return l[l.length - 1] || null; } catch (e) { return null; } };
const inChat = () => Q('textarea[name=cgChat]');
const fillChat = (text) => {
  const ta = inChat(); if (!ta) return;
  try {
    Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set.call(ta, text);
    ta.dispatchEvent(new Event('input', { bubbles: true }));
  } catch (e) {}
};
const onHome = () => !inChat() && !Q('[data-tut=save-final]') && Q('[data-tut=home].active');

const TUT = [
  { modal: true, title: '안녕하세요, 브리딩비서예요!', text: '예시 아이 루나로 기록하는 법을\n1분 만에 알려 드릴게요.', next: '시작하기' },
  { at: () => Q('[data-tut=chat]'), text: '기록은 전부 대화로 해요.\n가운데 [대화] 버튼을 눌러 보세요.', until: inChat },
  { at: () => Q('[data-tut=chat-bar]'), text: '루나가 오늘 알을 2개 낳았다고 해 볼게요.\n아래 버튼으로 글을 채운 뒤\n오른쪽 보내기 버튼을 눌러 주세요.',
    act: ['"루나 산란 2개" 채우기', () => fillChat('루나 산란 2개')], until: () => Q('.pending-bar'), need: inChat, back: 1 },
  { at: () => lastWith('.chip-btn', /저장할래/), text: '"산란 · 알 2개"로 알아들었어요!\n[이제 저장할래]를 눌러 주세요.',
    until: () => Q('[data-tut=save-final]'), need: () => inChat() || Q('[data-tut=save-final]'), back: 1 },
  { at: () => Q('[data-tut=save-final]'), text: '저장하기 전에 한 번 더 보여 드려요.\n맞으면 눌러 주세요.',
    until: onHome, need: () => Q('[data-tut=save-final]') || onHome(), back: 1 },
  { at: () => Q('[data-tut=calendar]'), text: '저장 끝! 🎉\n알을 적으면 부화 예정일이 저절로 잡혀요.\n[캘린더]를 눌러 보세요.', until: () => Q('[data-tut=calendar].active') },
  { at: () => Q('[data-tut=cal]'), text: '알 모양은 산란, 아기 모양은 부화예요.\n방금 적은 알의 부화 예정일도 저절로 들어갔어요.\n› 로 달을 넘겨 보면 보여요.', next: '다음' },
  { at: () => Q('[data-tut=reminders]'), text: '매일 챙길 일은 [브리핑]에 모여요.\n눌러 보세요.', until: () => Q('[data-tut=reminders].active') },
  { text: '산란 예정일, 부화 임박, 밥 줄 날을\n알아서 챙겨 드려요.\n홈 화면에 설치하면 알림으로도 와요.', next: '다음' },
  { modal: true, title: '이제 끝이에요!', text: '연습으로 적은 건 지우고\n내 아이로 시작해 볼까요?', final: true },
];
const PAD = 6;

function Tutorial() {
  const [n, setN] = useState(tutGet);
  const [rect, setRect] = useState(null);
  const miss = useRef(0);
  const go = (k) => { tutSet(k); setN(k); setRect(null); miss.current = 0; };
  useEffect(() => {   // '사용법 다시 보기'
    const f = () => go(0);
    window.addEventListener('cg-tut', f);
    return () => window.removeEventListener('cg-tut', f);
  }, []);
  useEffect(() => {
    const s = TUT[n];
    if (!s) return;
    const t = setInterval(() => {
      if (s.until && s.until()) { go(n + 1); return; }
      if (s.need) { if (s.need()) miss.current = 0; else if (++miss.current > 10) { go(s.back); return; } }
      const el = s.at && s.at();
      if (!el) { setRect(null); return; }
      const r = el.getBoundingClientRect();
      if (r.bottom < 0 || r.top > innerHeight) { try { el.scrollIntoView({ block: 'center' }); } catch (e) {} }
      setRect(p => (p && Math.abs(p.x - r.left) < 1 && Math.abs(p.y - r.top) < 1 && Math.abs(p.w - r.width) < 1 && Math.abs(p.h - r.height) < 1)
        ? p : { x: r.left, y: r.top, w: r.width, h: r.height });
    }, 150);
    return () => clearInterval(t);
  }, [n]);

  const s = TUT[n];
  if (!s) return null;
  const hole = !s.modal && rect ? { x: rect.x - PAD, y: rect.y - PAD, w: rect.w + PAD * 2, h: rect.h + PAD * 2 } : null;
  const H = innerHeight, W = innerWidth;
  const block = (st) => <div className="tut-block" style={st} />;
  const low = hole && hole.y + hole.h / 2 > H / 2;
  const bubblePos = !hole ? { top: '50%', transform: 'translateY(-50%)' }
    : low ? { bottom: Math.max(12, H - hole.y + 12) } : { top: Math.min(H - 160, hole.y + hole.h + 12) };
  const total = TUT.length - 1;
  const end = () => go(-1);
  return (
    <div className="tut" data-testid="tutorial" data-step={n}>
      {hole ? (
        <>
          {block({ left: 0, top: 0, width: W, height: Math.max(0, hole.y) })}
          {block({ left: 0, top: hole.y + hole.h, width: W, height: Math.max(0, H - hole.y - hole.h) })}
          {block({ left: 0, top: hole.y, width: Math.max(0, hole.x), height: hole.h })}
          {block({ left: hole.x + hole.w, top: hole.y, width: Math.max(0, W - hole.x - hole.w), height: hole.h })}
          <div className="tut-hole" style={{ left: hole.x, top: hole.y, width: hole.w, height: hole.h }} />
        </>
      ) : <div className="tut-dim" />}
      <div className={'tut-bubble' + (s.modal ? ' modal' : '')} style={bubblePos}>
        <img src="./assets/brand/gecko-transparent.webp" alt="" width="52" height="52" />
        <div className="tut-body">
          {s.title && <b>{s.title}</b>}
          <p>{s.text}</p>
          {n === 0 && INAPP && (
            <p className="tut-warn">지금 {INAPP} 안에서 열려 있어요. 여기서 적은 건 {TRACK.device() === 'ios' ? '사파리' : '크롬'}에서 안 보이니, 밖으로 열어서 하시는 게 좋아요.</p>
          )}
          <div className="tut-row">
            {n === 0 && INAPP && <button className="ghost" onClick={openOutside}>{TRACK.device() === 'ios' ? '사파리로' : '크롬으로'} 열기</button>}
            {s.act && <button onClick={s.act[1]} data-testid="tut-act">{s.act[0]}</button>}
            {s.next && <button onClick={() => go(n + 1)} data-testid="tut-next">{s.next}</button>}
            {s.final && <button onClick={() => { tutSet(-1); DEMO.exit('chat'); }} data-testid="tut-start">내 아이 등록하기</button>}
            {s.final && <button className="ghost" onClick={end}>조금 더 둘러볼게요</button>}
          </div>
          {!s.final && (
            <div className="tut-foot">
              <span>{n > 0 ? n + ' / ' + (total - 1) : ''}</span>
              <button onClick={end} data-testid="tut-skip">건너뛰기</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

window.CREG_WELCOME = { demoData, OpenHint, DemoGuide, Tutorial };
})();
