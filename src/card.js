/* v1.9.21 분양 카드 (B 사진 중심형) — 누를 때만 불러오는 조각 (card.min.js)
   window.CREG_CARD = { draw(opts) → Promise<{ canvas, photoOk }>, qr(text) }
   ★ 카드에 들어가는 글자는 앱이 넘겨준 것만 씁니다(분양가는 켰을 때만).
   ★ 사진을 못 불러오면(서버 사진의 교차 출처 막힘 등) 사진 없이 그리고 photoOk=false 로 알려 줍니다.
     그래야 toDataURL 이 막혀 카드 전체를 못 만드는 일이 없습니다. */
import qrcode from 'qrcode-generator';

const W = 1080, H = 1080;
const C = { cream: '#FAF6EF', ink: '#3B2F2A', burgundy: '#8E3B45', quiet: '#8A7766', line: '#E4DACA', shoe: '#FFF6EE' };
const FONT = "-apple-system, 'Apple SD Gothic Neo', 'Noto Sans KR', 'Noto Sans CJK KR', 'Malgun Gothic', sans-serif";
const f = (w, px) => `${w} ${px}px ${FONT}`;

function loadImg(src) {
  return new Promise((res) => {
    if (!src) return res(null);
    const img = new Image();
    if (!/^data:/.test(src)) img.crossOrigin = 'anonymous';
    img.onload = () => res(img);
    img.onerror = () => res(null);
    img.src = src;
  });
}

/* 글자가 칸보다 길면 크기를 줄입니다(최소 크기까지). 그래도 길면 말줄임 */
function fit(ctx, text, maxW, weight, px, minPx) {
  let size = px;
  ctx.font = f(weight, size);
  while (ctx.measureText(text).width > maxW && size > minPx) { size -= 2; ctx.font = f(weight, size); }
  let t = text;
  while (ctx.measureText(t).width > maxW && t.length > 1) t = t.slice(0, -2) + '…';
  return { t, size };
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function qr(text) {
  const q = qrcode(0, 'M');
  q.addData(text);
  q.make();
  return q;
}

function drawQR(ctx, text, x, y, size) {
  const q = qr(text);
  const n = q.getModuleCount();
  const cell = size / n;
  ctx.fillStyle = C.ink;
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
    if (q.isDark(r, c)) ctx.fillRect(Math.floor(x + c * cell), Math.floor(y + r * cell), Math.ceil(cell), Math.ceil(cell));
  }
}

async function draw(o) {
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');
  try { if (document.fonts && document.fonts.ready) await document.fonts.ready; } catch (e) {}

  // ── 사진(꽉 차게) ──
  const img = await loadImg(o.photo);
  let photoOk = !!img;
  if (img) {
    const s = Math.max(W / img.width, (H - 300) / img.height);
    const iw = img.width * s, ih = img.height * s;
    ctx.drawImage(img, (W - iw) / 2, Math.max(0, (H - 300 - ih) / 2), iw, ih);
    try { ctx.getImageData(0, 0, 1, 1); } catch (e) {   // 교차 출처로 막히면 사진 없이 다시
      photoOk = false;
      ctx.clearRect(0, 0, W, H);
    }
  }
  if (!photoOk) {
    const g = ctx.createRadialGradient(W / 2, 380, 40, W / 2, 380, 700);
    g.addColorStop(0, '#B88D6A'); g.addColorStop(0.55, '#7A5643'); g.addColorStop(1, '#4E362B');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  }
  // 위쪽 글자가 사진 위에서도 읽히게 살짝 어둡게
  const top = ctx.createLinearGradient(0, 0, 0, 200);
  top.addColorStop(0, 'rgba(0,0,0,.38)'); top.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = top; ctx.fillRect(0, 0, W, 200);

  // ── 맨 위: 브리더 이름 · 상태 ──
  if (o.breeder) {
    const b = fit(ctx, o.breeder, 620, 800, 34, 22);
    ctx.font = f(800, b.size); ctx.fillStyle = C.shoe; ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0,0,0,.35)'; ctx.shadowBlur = 8;
    ctx.fillText(b.t, 60, 82);
    ctx.shadowBlur = 0;
  }
  if (o.badge) {
    ctx.font = f(800, 28);
    const bw = ctx.measureText(o.badge).width + 48;
    roundRect(ctx, W - 60 - bw, 56, bw, 54, 27); ctx.fillStyle = C.shoe; ctx.fill();
    ctx.fillStyle = C.burgundy; ctx.textBaseline = 'middle'; ctx.fillText(o.badge, W - 60 - bw + 24, 84);
  }

  // ── 아래 판 ──
  const sheetY = H - 356;
  roundRect(ctx, 0, sheetY, W, 400, 44); ctx.fillStyle = C.cream; ctx.fill();
  const hasQR = !!o.qrUrl;
  const textW = hasQR ? W - 60 - 60 - 226 : W - 120;
  ctx.textBaseline = 'alphabetic';
  // 이름 + 모프
  const nm = fit(ctx, o.name || '', textW * 0.62, 900, 100, 56);
  ctx.font = f(900, nm.size); ctx.fillStyle = C.ink;
  ctx.fillText(nm.t, 60, sheetY + 44 + nm.size * 0.86);
  const nameW = ctx.measureText(nm.t).width;
  if (o.morph) {
    const mo = fit(ctx, o.morph, Math.max(120, textW - nameW - 18), 800, 36, 22);
    ctx.font = f(800, mo.size); ctx.fillStyle = C.burgundy;
    ctx.fillText(mo.t, 60 + nameW + 18, sheetY + 44 + nm.size * 0.86 - 8);
  }
  // 정보 한 줄
  const meta = [o.gender, o.hatch ? o.hatch + ' 해칭' : '', o.weight ? o.weight + 'g' : ''].filter(Boolean).join('   |   ');
  const mt = fit(ctx, meta, textW, 700, 28, 18);
  ctx.font = f(700, mt.size); ctx.fillStyle = C.ink;
  ctx.fillText(mt.t, 60, sheetY + 200);
  if (o.weight && o.weightDate) {
    const wd = fit(ctx, `몸무게 ${o.weightDate} 기준`, textW, 500, 19, 14);
    ctx.font = f(500, wd.size); ctx.fillStyle = C.quiet; ctx.fillText(wd.t, 60, sheetY + 230);
  }
  // 부모
  if (o.sire || o.dam) {
    const par = [o.sire ? '아빠 ' + o.sire : '', o.dam ? '엄마 ' + o.dam : ''].filter(Boolean).join('  ×  ');
    const pt = fit(ctx, par, textW, 500, 24, 16);
    ctx.font = f(500, pt.size); ctx.fillStyle = C.quiet;
    ctx.fillText(pt.t, 60, sheetY + 270);
  }
  // 아래 작은 글씨
  ctx.font = f(500, 21); ctx.fillStyle = '#A08D7C';
  ctx.fillText(o.credit || '브리딩비서로 기록한 아이예요', 60, H - 40);

  // QR
  if (hasQR) {
    const qx = W - 60 - 200, qy = sheetY + 40;
    roundRect(ctx, qx, qy, 200, 200, 22); ctx.fillStyle = '#FFFFFF'; ctx.fill();
    ctx.strokeStyle = C.line; ctx.lineWidth = 2; ctx.stroke();
    drawQR(ctx, o.qrUrl, qx + 16, qy + 16, 168);
    ctx.font = f(600, 21); ctx.fillStyle = C.quiet; ctx.textAlign = 'center';
    ctx.fillText('QR로 성장 기록 보기', qx + 100, qy + 236);
    ctx.textAlign = 'left';
  }
  return { canvas, photoOk };
}

window.CREG_CARD = { draw, qr };
