/* ══════════════════════════════════════════
   푸시 보내는 자리 (Supabase Edge Function)

   길은 셋뿐입니다.
     GET  /push/key   → 앱에 줄 공개키 (감출 것 없는 값입니다)
     POST /push/test  → 지금 로그인한 분께 시험 알림 한 통
     POST /push/run   → 오늘 몫을 모두에게. 새벽에 스케줄러가 부릅니다

   ★ 무엇을 보낼지는 여기서 정하지 않습니다.
     부화 예정일·밥 주는 날 계산은 전부 앱(src/app.jsx 의 pushPlan)에 있고,
     앱이 그 결과를 "알림 일정표"로 서버에 올려둡니다.
     여기서는 그 표에서 오늘 날짜 줄만 골라 보냅니다 — 규칙이 두 곳에 생기지 않게.

   비밀값 (Edge Function Secrets 에 넣습니다)
     VAPID_PUBLIC / VAPID_PRIVATE / VAPID_SUBJECT / CRON_KEY
   ══════════════════════════════════════════ */
import { send, type Sub } from './webpush.ts';

const SB_URL = Deno.env.get('SUPABASE_URL')!;
const SB_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const VAPID = {
  publicKey: Deno.env.get('VAPID_PUBLIC') || '',
  privateKey: Deno.env.get('VAPID_PRIVATE') || '',
  subject: Deno.env.get('VAPID_SUBJECT') || 'mailto:gkssnfdl@gmail.com',
};
const CRON_KEY = Deno.env.get('CRON_KEY') || '';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-cron-key',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });

/* 데이터베이스에 직접 묻습니다 — 라이브러리 없이 REST 그대로 */
async function db(path: string, opts: RequestInit = {}) {
  const res = await fetch(`${SB_URL}/rest/v1/${path}`, {
    ...opts,
    headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, 'Content-Type': 'application/json', ...(opts.headers || {}) },
  });
  if (!res.ok) throw new Error(`${path} → ${res.status} ${await res.text()}`);
  return res.status === 204 ? null : res.json();
}

/* 한국 날짜 — 서버는 세계표준시로 돌기 때문에 아홉 시간을 더해서 봅니다 */
const todayKST = () => new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10);

type Row = { endpoint: string; user_id: string; p256dh: string; auth: string; hatch: boolean; feed: boolean };
type Item = { d: string; k: 'hatch' | 'feed'; t: string; b?: string };

/* 여러 건이면 한 통으로 묶습니다 — 알림이 여러 개 쌓이지 않게 */
function compose(items: Item[], tag: string) {
  if (items.length === 1) {
    return { t: items[0].t, b: items[0].b || '', u: items[0].k === 'feed' ? 'feeding' : 'reminders', g: tag };
  }
  return {
    t: `오늘 챙길 것 ${items.length}가지`,
    b: items.map(i => '· ' + i.t).join('\n'),
    u: 'reminders',
    g: tag,
  };
}

async function deliver(subs: Row[], payloadFor: (s: Row) => unknown | null) {
  let sent = 0;
  const gone: string[] = [];
  for (const s of subs) {
    const p = payloadFor(s);
    if (!p) continue;
    try {
      const r = await send({ endpoint: s.endpoint, p256dh: s.p256dh, auth: s.auth } as Sub, JSON.stringify(p), VAPID);
      if (r.ok) sent++;
      else if (r.gone) gone.push(s.endpoint);
    } catch (_e) { /* 한 기기가 실패해도 나머지는 계속 보냅니다 */ }
  }
  // 앱을 지웠거나 알림을 끈 기기는 목록에서 정리합니다
  if (gone.length) {
    const list = gone.map(e => `"${encodeURIComponent(e)}"`).join(',');
    try { await db(`cg_push_subs?endpoint=in.(${list})`, { method: 'DELETE' }); } catch (_e) {}
  }
  return { sent, removed: gone.length };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  const path = new URL(req.url).pathname.replace(/\/+$/, '').split('/').pop();

  try {
    /* ── 공개키 주기 ── */
    if (path === 'key') return json({ key: VAPID.publicKey });

    if (!VAPID.publicKey || !VAPID.privateKey) return json({ error: 'VAPID 키가 아직 설정되지 않았어요' }, 503);

    /* ── 오늘 몫 전체 발송 (스케줄러 전용) ── */
    if (path === 'run') {
      if (!CRON_KEY || req.headers.get('x-cron-key') !== CRON_KEY) return json({ error: 'forbidden' }, 403);
      const today = todayKST();
      const tag = 'cg-daily-' + today;
      const plans: { user_id: string; plan: Item[] }[] = await db('cg_push_plan?select=user_id,plan');
      const subs: Row[] = await db('cg_push_subs?select=endpoint,user_id,p256dh,auth,hatch,feed');

      const byUser: Record<string, Row[]> = {};
      subs.forEach(s => (byUser[s.user_id] = byUser[s.user_id] || []).push(s));

      let sent = 0, removed = 0, users = 0;
      for (const p of plans) {
        const mine = byUser[p.user_id];
        if (!mine || !mine.length) continue;
        const today9 = (Array.isArray(p.plan) ? p.plan : []).filter(i => i && i.d === today);
        if (!today9.length) continue;
        users++;
        const r = await deliver(mine, (s) => {
          const on = today9.filter(i => (i.k === 'feed' ? s.feed : s.hatch));
          return on.length ? compose(on, tag) : null;
        });
        sent += r.sent; removed += r.removed;
      }
      return json({ ok: true, date: today, users, sent, removed });
    }

    /* ── 시험 한 통 (본인에게만) ── */
    if (path === 'test') {
      const token = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
      if (!token) return json({ error: '로그인이 필요해요' }, 401);
      const who = await fetch(`${SB_URL}/auth/v1/user`, { headers: { apikey: SB_KEY, Authorization: `Bearer ${token}` } });
      if (!who.ok) return json({ error: '로그인이 만료됐어요' }, 401);
      const uid = (await who.json()).id;
      const subs: Row[] = await db(`cg_push_subs?select=endpoint,user_id,p256dh,auth,hatch,feed&user_id=eq.${uid}`);
      if (!subs.length) return json({ error: '이 계정에 등록된 기기가 없어요' }, 404);
      const r = await deliver(subs, () => ({
        t: '🔔 알림이 잘 도착했어요', b: '앞으로 부화 예정일과 밥 주는 날 아침에 이렇게 알려드릴게요.',
        u: 'reminders', g: 'cg-test',
      }));
      return json({ ok: true, ...r });
    }

    return json({ error: 'not found' }, 404);
  } catch (e) {
    return json({ error: String((e as Error)?.message || e) }, 500);
  }
});
