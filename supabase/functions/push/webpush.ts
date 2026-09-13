/* ══════════════════════════════════════════
   웹 푸시 보내기 — 표준(RFC 8291 / RFC 8292)만 씁니다. 외부 라이브러리 없음.

   왜 직접 썼나:
     Edge Function 은 저희가 고쳐가며 시험해 볼 수 없는 자리라(대표님 서버에서만 돕니다)
     남의 라이브러리가 Deno 에서 어떻게 도는지에 걸지 않았습니다.
     아래 두 함수는 RFC 문서에 실린 시험값으로 맞는지 확인해 두었습니다.

   보내는 한 통은 두 겹입니다.
     ① 본문 암호화(RFC 8291) — 폰만 열어볼 수 있게. 서버도 중간도 못 읽습니다
     ② 신분 증명(RFC 8292 VAPID) — "이 앱이 보낸 게 맞다"는 서명
   ══════════════════════════════════════════ */

const enc = new TextEncoder();

export const b64u = (b: ArrayBuffer | Uint8Array): string => {
  const u = b instanceof Uint8Array ? b : new Uint8Array(b);
  let s = '';
  for (const x of u) s += String.fromCharCode(x);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

export const unb64u = (s: string): Uint8Array => {
  const t = s.replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(t + '='.repeat((4 - (t.length % 4)) % 4));
  const u = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
  return u;
};

const cat = (...parts: Uint8Array[]): Uint8Array => {
  const n = parts.reduce((a, p) => a + p.length, 0);
  const out = new Uint8Array(n);
  let o = 0;
  for (const p of parts) { out.set(p, o); o += p.length; }
  return out;
};

/* HKDF — 짧은 비밀에서 필요한 길이의 열쇠를 뽑아냅니다 */
async function hkdf(salt: Uint8Array, ikm: Uint8Array, info: Uint8Array, len: number) {
  const key = await crypto.subtle.importKey('raw', ikm, 'HKDF', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'HKDF', hash: 'SHA-256', salt, info }, key, len * 8);
  return new Uint8Array(bits);
}

/* 이 기기(구독)의 공개키와 우리 쪽 임시 열쇠를 맞물려 공용 비밀을 만듭니다 */
async function ecdh(privKey: CryptoKey, peerRaw: Uint8Array) {
  const peer = await crypto.subtle.importKey('raw', peerRaw, { name: 'ECDH', namedCurve: 'P-256' }, false, []);
  const bits = await crypto.subtle.deriveBits({ name: 'ECDH', public: peer }, privKey, 256);
  return new Uint8Array(bits);
}

/* ── ① 본문 암호화 (aes128gcm) ──
   salt·임시공개키·레코드크기를 앞에 붙인 한 덩어리를 돌려줍니다. 그대로 body 로 보냅니다. */
export async function encrypt(
  payload: string,
  p256dhB64: string,
  authB64: string,
  opts?: { salt?: Uint8Array; localKeys?: CryptoKeyPair },
): Promise<Uint8Array> {
  const uaPublic = unb64u(p256dhB64);          // 폰의 공개키
  const authSecret = unb64u(authB64);          // 폰이 준 비밀값
  const salt = opts?.salt ?? crypto.getRandomValues(new Uint8Array(16));

  const kp = opts?.localKeys ?? await crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']);
  const asPublic = new Uint8Array(await crypto.subtle.exportKey('raw', kp.publicKey));

  const shared = await ecdh(kp.privateKey, uaPublic);

  // RFC 8291 §3.3 — 두 공개키를 순서대로 넣은 라벨로 공용 비밀을 한 번 더 굳힙니다
  const keyInfo = cat(enc.encode('WebPush: info\0'), uaPublic, asPublic);
  const ikm = await hkdf(authSecret, shared, keyInfo, 32);

  const cek = await hkdf(salt, ikm, enc.encode('Content-Encoding: aes128gcm\0'), 16);
  const nonce = await hkdf(salt, ikm, enc.encode('Content-Encoding: nonce\0'), 12);

  // 본문 끝에 0x02 를 붙입니다 — "이게 마지막 조각"이라는 표시입니다
  const plain = cat(enc.encode(payload), new Uint8Array([0x02]));
  const aesKey = await crypto.subtle.importKey('raw', cek, 'AES-GCM', false, ['encrypt']);
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv: nonce }, aesKey, plain));

  // 머리말: salt(16) + 레코드크기(4) + 공개키길이(1) + 공개키(65)
  const rs = new Uint8Array(4);
  new DataView(rs.buffer).setUint32(0, 4096);
  return cat(salt, rs, new Uint8Array([asPublic.length]), asPublic, ct);
}

/* ── ② 신분 증명 (VAPID) ──
   "이 서명은 우리 앱이 했다"를 푸시 서버에 보이는 짧은 증표입니다. 12시간짜리로 만듭니다. */
export async function vapidHeader(endpoint: string, subject: string, publicKey: string, privateKey: string) {
  const aud = new URL(endpoint).origin;
  const head = b64u(enc.encode(JSON.stringify({ typ: 'JWT', alg: 'ES256' })));
  const body = b64u(enc.encode(JSON.stringify({
    aud, exp: Math.floor(Date.now() / 1000) + 12 * 3600, sub: subject,
  })));
  const signingInput = `${head}.${body}`;

  const pub = unb64u(publicKey);
  const jwk: JsonWebKey = {
    kty: 'EC', crv: 'P-256', ext: true,
    x: b64u(pub.slice(1, 33)),
    y: b64u(pub.slice(33, 65)),
    d: privateKey,
  };
  const key = await crypto.subtle.importKey('jwk', jwk, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, key, enc.encode(signingInput));
  return `vapid t=${signingInput}.${b64u(sig)}, k=${publicKey}`;
}

export type Sub = { endpoint: string; p256dh: string; auth: string };

/* 한 기기에 한 통. 성공이면 ok, 구독이 사라졌으면 gone(=목록에서 지울 것) */
export async function send(sub: Sub, payload: string, vapid: { subject: string; publicKey: string; privateKey: string }) {
  const body = await encrypt(payload, sub.p256dh, sub.auth);
  const auth = await vapidHeader(sub.endpoint, vapid.subject, vapid.publicKey, vapid.privateKey);
  const res = await fetch(sub.endpoint, {
    method: 'POST',
    headers: {
      Authorization: auth,
      'Content-Encoding': 'aes128gcm',
      'Content-Type': 'application/octet-stream',
      TTL: '86400',
      Urgency: 'normal',
    },
    body,
  });
  // 404·410 = 이 기기는 앱을 지웠거나 구독을 껐습니다
  return { ok: res.ok, status: res.status, gone: res.status === 404 || res.status === 410 };
}
