/* v1.9.2 처음 온 사람 안내 — 필요할 때만 불러오는 조각 (welcome.min.js)
   app.min.js 가 먼저 떠 있어야 합니다. useState·TRACK·STORE·addDaysISO 등은 거기 것을 씁니다.
   window.CREG_WELCOME = { demoData, OpenHint, DemoGuide } */
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
  const openOut = () => {
    try {
      if (INAPP === '카카오톡') location.href = 'kakaotalk://web/openExternal?url=' + encodeURIComponent(url);
      else if (os === 'android') location.href = 'intent://' + url.replace(/^https?:\/\//, '') + '#Intent;scheme=https;package=com.android.chrome;end';
      else location.href = 'x-safari-' + url;
    } catch (e) {}
  };
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

function DemoGuide({ navigate }) {
  const G = [['calendar', '📅', '캘린더', '부화·산란 예정일이 저절로 잡혀요'],
    ['reminders', '📋', '브리핑', '오늘 챙길 일을 알려 줘요'],
    ['chat', '💬', '대화', '"루나 산란 2개"처럼 말하면 적혀요'],
    ['ledger', '💰', '가계부', '분양·먹이값이 한눈에 보여요']];
  return (
    <div className="card demo-guide" data-testid="demo-guide">
      <div className="dg-t">🦎 루나·솔 가족으로 보여 드릴게요</div>
      <div className="dg-s">아래를 눌러 둘러보세요. 다 보셨으면 맨 위 '내 것으로 시작'을 누르면 비워져요.</div>
      {G.map(([go, ic, t, d]) => (
        <button key={go} className="dg-b" onClick={() => navigate(go)}>
          <span className="dg-i">{ic}</span><span><b>{t}</b><small>{d}</small></span><span className="dg-a">›</span>
        </button>
      ))}
    </div>
  );
}


window.CREG_WELCOME = { demoData, OpenHint, DemoGuide };
})();
