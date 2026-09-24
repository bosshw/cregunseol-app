/* ══════════════════════════════════════════
   엑셀·표 가져오기 화면 (v1.8)
   ──────────────────────────────────────────
   쓰던 엑셀·구글시트·CSV·메모를 그대로 올리면, 엔진(import-engine.js)이 읽은 결과를
   "이렇게 읽었어요"로 먼저 보여드리고, 누르셔야 넣습니다.
   ★ 파일은 폰 밖으로 나가지 않습니다 — 읽기·해석 모두 이 화면 안에서 합니다.
   ★ 넣은 뒤에도 [되돌리기] 한 번이면 가져오기 전으로 돌아갑니다.
   앱 본체(app.min.js)와 이름이 겹치지 않도록 전부 이 안에 가둡니다.
   ══════════════════════════════════════════ */
(function () {
const ENG = window.CREG_IMPORT_ENGINE;
const { useState, useRef, useMemo } = React;

const TYPE_WORD = { laying: '산란', mating: '메이팅', hatching: '해칭', distribution: '분양', growth: '무게', feeding: '먹이',
  shed: '탈피', health: '이상', condition: '컨디션', env: '온습도', memo: '메모', ledger: '가계부' };
const GENDER_WORD = { female: '♀', male: '♂' };
const STATUS_WORD = { sold: '분양완료', available: '분양가능', reserved: '예약중', gone: '떠남' };

/* 파일 → 격자 */
async function readFileGrids(file) {
  const name = file.name || '';
  const buf = await file.arrayBuffer();
  if (/\.(csv|tsv|txt)$/i.test(name)) {
    let text;
    // 윈도우 엑셀이 저장한 CSV 는 대개 한글 옛 방식(EUC-KR)입니다
    try { text = new TextDecoder('utf-8', { fatal: true }).decode(buf); }
    catch (e) { try { text = new TextDecoder('euc-kr').decode(buf); } catch (e2) { text = new TextDecoder().decode(buf); } }
    return ENG.gridsFromText(text, name.replace(/\.[^.]+$/, ''));
  }
  const XLSX = await loadXLSX();
  let wb;
  try { wb = XLSX.read(new Uint8Array(buf), { type: 'array', cellNF: true, cellText: true, cellDates: false }); }
  catch (e) {
    if (/password|encrypt/i.test(String(e && e.message))) throw new Error('암호가 걸린 파일이에요. 엑셀에서 암호를 풀고 다시 저장해 주세요');
    throw new Error('엑셀 파일을 열지 못했어요. 파일이 깨졌거나 지원하지 않는 형식이에요');
  }
  return ENG.gridsFromWorkbook(XLSX, wb);
}

function ctxNow(overrides) {
  return {
    individuals: DB.getIndividuals(), events: DB.getEvents(), today: todayStr(), overrides,
    extractFacts: typeof extractFacts === 'function' ? extractFacts : null,
  };
}

const small = { fontSize: 12, color: 'var(--text3)', lineHeight: 1.6 };

function ImportScreen({ navigate, showToast, refreshIndividuals }) {
  const [step, setStep] = useState('pick');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [grids, setGrids] = useState(null);
  const [fileName, setFileName] = useState('');
  const [overrides, setOverrides] = useState({});
  const [paste, setPaste] = useState('');
  const [openCols, setOpenCols] = useState({});
  const [showIssues, setShowIssues] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [result, setResult] = useState(null);
  const [last, setLast] = useState(() => ENG.lastImport());
  const fileRef = useRef(null);

  const plan = useMemo(() => {
    if (!grids) return null;
    try { return ENG.analyze(grids, ctxNow(overrides)); }
    catch (e) { console.error(e); return { error: String(e && e.message || e) }; }
  }, [grids, overrides]);

  const start = (g, name) => {
    const any = g.some(x => x.rows.length);
    if (!any) { setErr('비어 있는 파일이에요'); return; }
    setGrids(g); setFileName(name); setOverrides({}); setOpenCols({}); setErr(''); setStep('review');
  };
  const onFile = async (e) => {
    const f = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!f) return;
    setBusy(true); setErr('');
    try { start(await readFileGrids(f), f.name); }
    catch (x) { setErr((x && x.message) || '파일을 읽지 못했어요'); }
    setBusy(false);
  };
  const onPaste = () => {
    if (!paste.trim()) return;
    start(ENG.gridsFromText(paste, '붙여넣은 표'), '붙여넣은 표');
  };
  const setOv = (id, patch) => setOverrides(o => ({ ...o, [id]: { ...(o[id] || {}), ...patch } }));
  const setField = (id, col, field) => setOverrides(o => {
    const cur = o[id] || {};
    return { ...o, [id]: { ...cur, fields: { ...(cur.fields || {}), [col]: field } } };
  });

  const doImport = () => {
    if (!plan || plan.error) return;
    setBusy(true);
    const r = ENG.applyPlan(plan, { DB, STORE });
    setBusy(false);
    if (!r.ok) { setErr('저장 공간이 모자라 넣지 못했어요. 설정 → 저장 공간을 먼저 정리해 주세요'); return; }
    try { TRACK.step('record'); } catch (e) {}
    refreshIndividuals();
    setResult({ ...r.undo, plan });
    setLast(r.undo);
    setStep('done');
    showToast(`📥 개체 ${r.undo.counts.inds}마리 · 기록 ${r.undo.counts.events}건 가져왔어요`);
  };
  const doUndo = (u) => {
    const r = ENG.undoImport({ DB, STORE }, u);
    refreshIndividuals();
    setLast(null);
    if (r.ok) { showToast(`↩️ 되돌렸어요 (개체 ${r.removed.inds} · 기록 ${r.removed.events} 뺌)`); setStep('pick'); setGrids(null); setResult(null); }
    else showToast('⚠️ 되돌릴 가져오기가 없어요');
  };

  const Header = ({ title }) => (
    <div className="header">
      <div className="header-row">
        <button className="back-btn" onClick={() => (step === 'review' ? (setStep('pick'), setGrids(null)) : navigate('settings'))}>‹ 뒤로</button>
        <h1 style={{ fontSize: 16 }}>{title}</h1>
      </div>
    </div>
  );

  /* ───── 1. 고르기 ───── */
  if (step === 'pick') {
    return (
      <div className="screen">
        <Header title="📥 엑셀·표 가져오기" />
        <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="card" style={{ margin: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>쓰던 엑셀을 그대로 올려주세요</div>
            <div style={small}>
              양식을 맞추지 않으셔도 돼요. 칸 이름과 적힌 값을 보고 <b>개체 목록 · 메이팅 · 산란 · 해칭 · 분양 · 무게 · 먹이 · 가계부 · 일지</b>를 알아서 나눠 읽어요.<br />
              넣기 전에 <b>이렇게 읽었어요</b>를 먼저 보여드리고, 넣은 뒤에도 한 번에 되돌릴 수 있어요.<br />
              파일은 이 폰 안에서만 읽고 어디에도 올리지 않아요.
            </div>
            <button className="btn btn-primary" style={{ marginTop: 12 }} disabled={busy} onClick={() => fileRef.current && fileRef.current.click()}>
              {busy ? '읽는 중…' : '📂 파일 고르기 (엑셀 · CSV · 메모장)'}
            </button>
            <input ref={fileRef} type="file" style={{ display: 'none' }} onChange={onFile}
              accept=".xlsx,.xls,.xlsm,.xlsb,.ods,.csv,.tsv,.txt,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv,text/plain" />
            <div style={{ ...small, marginTop: 8 }}>구글 시트는 <b>파일 · 다운로드 · Microsoft Excel</b> 순서로 받아서 올리시면 돼요.</div>
          </div>
          <div className="card" style={{ margin: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text2)', marginBottom: 6 }}>📋 복사해서 붙여넣기</div>
            <div style={{ ...small, marginBottom: 8 }}>엑셀·구글 시트에서 칸을 긁어 복사하거나, 메모장에 적어 둔 줄글을 그대로 붙여넣어도 돼요.</div>
            <textarea className="input" style={{ minHeight: 110, fontSize: 13 }} value={paste} onChange={e => setPaste(e.target.value)}
              placeholder={'이름\t성별\t모프\n크한이\t수컷\t릴리화이트\n\n또는\n9/3 크한이 밥 먹음\n9/5 크순이 알 2개'} />
            <button className="btn btn-secondary" style={{ marginTop: 8 }} disabled={!paste.trim()} onClick={onPaste}>읽어보기</button>
          </div>
          {err && <div className="card" style={{ margin: 0, color: 'var(--danger)', fontSize: 13 }}>⚠️ {err}</div>}
          {last && (
            <div className="card" style={{ margin: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text2)', marginBottom: 4 }}>↩️ 지난 가져오기 되돌리기</div>
              <div style={{ ...small, marginBottom: 8 }}>
                {String(last.at || '').slice(0, 10)} · 개체 {last.counts.inds}마리 · 기록 {last.counts.events}건
                {last.counts.patched ? ` · 빈 칸 채운 아이 ${last.counts.patched}마리` : ''}<br />
                그 뒤에 이 아이들에게 적은 기록도 함께 빠져요.
              </div>
              <button className="btn btn-danger btn-sm" onClick={() => doUndo(last)}>되돌리기</button>
            </div>
          )}
        </div>
      </div>
    );
  }

  /* ───── 3. 끝 ───── */
  if (step === 'done' && result) {
    const inds = DB.getIndividuals(), evs = DB.getEvents();
    let waiting = [], money = null;
    try { waiting = clutchRows(inds, evs).filter(c => c.waiting); } catch (e) {}
    try {
      const rows = ledgerRows(evs, inds);
      const out = rows.filter(x => x.flow === 'out').reduce((a, x) => a + x.amount, 0);
      const inn = rows.filter(x => x.flow === 'in').reduce((a, x) => a + x.amount, 0);
      if (out || inn) money = { out, inn };
    } catch (e) {}
    const eggs = waiting.reduce((a, c) => a + c.units.filter(u => u.status === 'pending').length, 0);
    const soon = waiting.slice().sort((a, b) => a.d - b.d)[0];
    return (
      <div className="screen">
        <Header title="📥 가져오기 끝" />
        <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="card" style={{ margin: 0 }}>
            <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 6 }}>✅ 다 넣었어요</div>
            <div style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.8 }}>
              새 개체 <b>{result.counts.inds}</b>마리 · 기록 <b>{result.counts.events}</b>건
              {result.counts.patched ? <> · 빈 칸 채운 아이 <b>{result.counts.patched}</b>마리</> : null}
            </div>
          </div>
          <div className="card" style={{ margin: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text2)', marginBottom: 6 }}>✨ 가져온 기록으로 바로 알 수 있는 것</div>
            <div style={{ fontSize: 13.5, color: 'var(--text2)', lineHeight: 1.9 }}>
              {eggs ? <>🥚 부화를 기다리는 알 <b>{eggs}개</b>{soon ? <> · 가장 빠른 건 <b>{soon.momName}</b> {soon.state}</> : null}<br /></> : null}
              {money ? <>💰 가계부 · 지출 <b>{wonText(money.out)}</b>{money.inn ? <> · 수입 <b>{wonText(money.inn)}</b></> : null}<br /></> : null}
              🔔 부화 예정일·산란 간격·혈통·근친 판단은 이제 앱이 알아서 계산해요.
            </div>
          </div>
          <button className="btn btn-primary" onClick={() => navigate('home')}>홈에서 보기</button>
          <button className="btn btn-secondary" onClick={() => navigate('home', { view: 'laying' })}>산란기록 보기</button>
          <button className="btn btn-danger btn-sm" onClick={() => doUndo(result)}>↩️ 방금 가져온 것 되돌리기</button>
        </div>
      </div>
    );
  }

  /* ───── 2. 확인 ───── */
  if (!plan) return null;
  if (plan.error) {
    return (<div className="screen"><Header title="📥 확인" /><div className="card">⚠️ 읽다가 막혔어요: {plan.error}</div></div>);
  }
  const bt = plan.byType;
  const typeLine = Object.keys(TYPE_WORD).filter(k => bt[k]).map(k => `${TYPE_WORD[k]} ${bt[k]}`).join(' · ');
  const nothing = !plan.newInds.length && !plan.events.length && !plan.patches.length;
  const pct = Math.round((plan.stats.cover || 0) * 100);
  const kinds = Object.keys(ENG.KIND_LABEL);
  return (
    <div className="screen">
      <Header title="📥 이렇게 읽었어요" />
      <div style={{ padding: '16px 16px 120px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* 한눈에 */}
        <div className="card" style={{ margin: 0 }}>
          <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 4, wordBreak: 'break-all' }}>{fileName}</div>
          {nothing ? (
            <div style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.7 }}>
              넣을 게 없어요. {plan.dupSkipped ? `이미 앱에 있는 기록이에요 (${plan.dupSkipped}건 겹침).` : '아래에서 시트 종류나 칸을 바꿔 보세요.'}
            </div>
          ) : (
            <div style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.9 }}>
              {plan.newInds.length ? <div>🦎 새로 등록 <b>{plan.newInds.length}</b>마리 <button className="chip-btn" style={{ fontSize: 11, padding: '3px 8px', minHeight: 0, marginLeft: 4 }} onClick={() => setShowNew(v => !v)}>{showNew ? '접기' : '보기'}</button></div> : null}
              {plan.patches.length ? <div>✏️ 이미 있는 아이 <b>{plan.patches.length}</b>마리의 빈 칸 채우기 <span style={small}>(적어 두신 값은 안 덮어요)</span></div> : null}
              {plan.events.length ? <div>📝 기록 <b>{plan.events.length}</b>건 <span style={small}>{typeLine}</span></div> : null}
              {plan.dupSkipped ? <div style={small}>이미 앱에 있는 {plan.dupSkipped}건은 겹치지 않게 뺐어요</div> : null}
            </div>
          )}
          <div style={{ ...small, marginTop: 6 }} data-testid="coverage">
            채워진 칸 {plan.stats.cells}개를 {pct >= 100 ? '하나도 빠짐없이' : `${pct}%`} 읽었어요 — 제자리 {plan.stats.used} · 메모로 남김 {plan.stats.memo}{plan.stats.ignored ? ` · 번호·합계처럼 뺀 것 ${plan.stats.ignored}` : ''}
          </div>
          {showNew && plan.newInds.length ? (
            <div style={{ marginTop: 8, maxHeight: 260, overflowY: 'auto', borderTop: '1px solid var(--border)', paddingTop: 8 }}>
              {plan.newInds.map(i => (
                <div key={i.id} style={{ fontSize: 13, color: 'var(--text2)', padding: '3px 0' }}>
                  <b>{i.name}</b> <span style={{ color: 'var(--text3)' }}>
                    {[GENDER_WORD[i.gender] || '미구분', i.morph, i.hatchDate, STATUS_WORD[i.status], i.keep ? 'KEEP' : '', i.isExternal ? '외부 개체' : '', i.isFromCreGunseol && !i.isExternal ? 'MY' : ''].filter(Boolean).join(' · ')}
                  </span>
                </div>
              ))}
            </div>
          ) : null}
        </div>

        {(plan.onlyRecord.length || plan.externals.length) ? (
          <div className="card" style={{ margin: 0, borderColor: 'var(--accent-dim)' }}>
            {plan.onlyRecord.length ? (
              <div style={{ ...small, color: 'var(--text2)' }}>
                🔎 <b>기록에만 나온 이름</b>이라 새로 만들어요: {plan.onlyRecord.slice(0, 20).join(', ')}{plan.onlyRecord.length > 20 ? ` 외 ${plan.onlyRecord.length - 20}` : ''}<br />
                <span style={small}>이미 있는 아이를 다른 이름으로 적으신 거라면, 넣은 뒤 설정의 '중복 개체 정리'에서 합칠 수 있어요.</span>
              </div>
            ) : null}
            {plan.externals.length ? (
              <div style={{ ...small, color: 'var(--text2)', marginTop: plan.onlyRecord.length ? 8 : 0 }}>
                🔗 해칭 기록의 부모인데 목록에 없어서 <b>외부 개체</b>로 이어요: {plan.externals.join(', ')}
              </div>
            ) : null}
          </div>
        ) : null}

        {/* 시트마다 */}
        {plan.blocks.map(b => {
          const opts = ENG.FIELDS_BY_KIND[b.kind] || ['notes', 'ignore'];
          const checks = b.fields.filter(f => f.check).length;
          const open = openCols[b.id] !== undefined ? openCols[b.id] : checks > 0;
          const moneyUnit = b.units && (b.units.buyPrice === 10000 || b.units.salePrice === 10000 || b.units.amount === 10000) ? 10000 : null;
          return (
            <div key={b.id} className="card" style={{ margin: 0, opacity: b.kind === 'skip' ? 0.6 : 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <div style={{ fontSize: 14, fontWeight: 700, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>📄 {b.sheet}</div>
                <span style={{ fontSize: 11, color: 'var(--text3)', flexShrink: 0 }}>{b.rows}줄</span>
              </div>
              <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
                <label style={{ flex: '1 1 140px', fontSize: 11.5, color: 'var(--text3)' }}>이 표는
                  <select className="input" data-testid="kind-select" style={{ padding: '7px 8px', fontSize: 13, minHeight: 0, marginTop: 3 }} value={b.kind}
                    onChange={e => setOv(b.id, { kind: e.target.value, fields: undefined })}>
                    {kinds.filter(k => k !== 'gridT' || b.kind === 'gridT' || b.kindGuess === 'gridT').filter(k => k !== 'grid' || b.kind === 'grid' || b.kindGuess === 'grid')
                      .map(k => <option key={k} value={k}>{ENG.KIND_LABEL[k]}{k === b.kindGuess && k !== b.kind ? ' (처음 짐작)' : ''}</option>)}
                  </select>
                </label>
                {b.kind === 'animals' && (
                  <label style={{ flex: '1 1 140px', fontSize: 11.5, color: 'var(--text3)' }}>여기 적힌 아이들은
                    <select className="input" style={{ padding: '7px 8px', fontSize: 13, minHeight: 0, marginTop: 3 }} value={b.mode}
                      onChange={e => setOv(b.id, { mode: e.target.value })}>
                      {Object.keys(ENG.MODE_LABEL).map(m => <option key={m} value={m}>{ENG.MODE_LABEL[m]}</option>)}
                    </select>
                  </label>
                )}
              </div>
              {b.units && b.fields.some(f => ['buyPrice', 'salePrice', 'amount', 'income', 'expense'].includes(f.field) && f.filled) && (
                <div style={{ ...small, marginBottom: 8 }}>
                  💰 금액을 <b>{moneyUnit ? '만원' : '원'}</b> 단위로 읽었어요{' '}
                  <button className="chip-btn" style={{ fontSize: 11, padding: '3px 8px', minHeight: 0 }}
                    onClick={() => setOv(b.id, { amountUnit: moneyUnit ? 1 : 10000 })}>{moneyUnit ? '원으로 바꾸기' : '만원으로 바꾸기'}</button>
                </div>
              )}
              {b.kind !== 'skip' && (
                <button className="chip-btn" style={{ fontSize: 12, padding: '5px 10px', minHeight: 0 }} onClick={() => setOpenCols(o => ({ ...o, [b.id]: !open }))}>
                  {open ? '칸 접기' : checks ? `⚠️ 확인할 칸 ${checks}개 · 칸 보기` : `칸 ${b.fields.length}개 모두 알아봤어요 · 칸 보기`}
                </button>
              )}
              {open && b.kind !== 'skip' && (
                <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {b.fields.map(f => {
                    const base = f.field.split(':')[0];
                    const n = f.field.split(':')[1];
                    const cur = base === 'layN' || base === 'layNc' ? f.field : f.field;
                    const list = opts.includes(base) ? opts : [f.field, ...opts];
                    return (
                      <div key={f.col} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5 }}>
                        <div style={{ flex: '1 1 40%', minWidth: 0 }}>
                          <div style={{ fontWeight: 600, color: f.check ? 'var(--warning)' : 'var(--text2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.check ? '⚠️ ' : ''}{f.header}</div>
                          <div style={{ fontSize: 11, color: 'var(--text3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.sample.join(' / ') || '(빈 칸)'}</div>
                        </div>
                        <select className="input" style={{ flex: '1 1 55%', padding: '7px 8px', fontSize: 12.5, minHeight: 0 }} value={cur}
                          onChange={e => setField(b.id, f.col, e.target.value)}>
                          {list.map(o => {
                            const ob = o.split(':')[0];
                            const label = (ENG.FIELD_LABEL[ob] || o) + (o.includes(':') ? ` (${o.split(':')[1]}차)` : '');
                            return <option key={o} value={ob === 'layN' && !o.includes(':') ? 'layN:' + (n || 1) : o}>{label}</option>;
                          })}
                        </select>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {/* 못 읽은 곳 */}
        {plan.issues.length ? (
          <div className="card" style={{ margin: 0 }}>
            <button className="chip-btn" style={{ fontSize: 12, padding: '5px 10px', minHeight: 0 }} onClick={() => setShowIssues(v => !v)}>
              {showIssues ? '접기' : `📝 제자리를 못 찾은 곳 ${plan.issues.length}군데 보기`}
            </button>
            {showIssues && (
              <div style={{ marginTop: 8, maxHeight: 300, overflowY: 'auto' }}>
                {plan.issues.map((x, k) => (
                  <div key={k} style={{ fontSize: 12, color: 'var(--text2)', padding: '4px 0', borderBottom: '1px solid var(--border)' }}>
                    <span style={{ color: 'var(--text3)' }}>{x.sheet} {x.row}행 · {x.header}</span><br />
                    "{x.text}" → {x.why}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : null}
        {err && <div className="card" style={{ margin: 0, color: 'var(--danger)', fontSize: 13 }}>⚠️ {err}</div>}
      </div>
      <div style={{ position: 'fixed', left: 0, right: 0, bottom: 0, padding: '10px 16px calc(10px + env(safe-area-inset-bottom))', background: 'var(--bg)', borderTop: '1px solid var(--border)', display: 'flex', gap: 8, zIndex: 50, maxWidth: 480, margin: '0 auto' }}>
        <button className="btn btn-secondary" style={{ flex: 1, whiteSpace: 'nowrap', padding: '13px 8px', fontSize: 14 }} onClick={() => { setStep('pick'); setGrids(null); }}>다시 고르기</button>
        <button className="btn btn-primary" style={{ flex: 2 }} disabled={busy || nothing} onClick={doImport}>
          {busy ? '넣는 중…' : nothing ? '넣을 게 없어요' : '이대로 가져오기'}
        </button>
      </div>
    </div>
  );
}

window.CREG_IMPORT = { Screen: ImportScreen, engine: ENG };
})();
