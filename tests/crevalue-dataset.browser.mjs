// Synthetic, isolated browser fixture. No account login or external requests.
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const root=new URL('../',import.meta.url);
const fixture=`<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><style>:root{--text2:#535a58;--accent:#236b50;--accent-soft:#e9f3ed;--accent-edge:#c8dbce;--card:white;--bg3:#edf0ee;--border:#d3dcd6;--text:#1c2922}*{box-sizing:border-box}body{margin:0;background:#f4f6f3;font-family:Arial,sans-serif;color:var(--text)}.card{background:white;border:1px solid var(--border);border-radius:16px}.header{padding:16px}.header-row{display:flex;gap:16px;align-items:center}.btn,.chip-btn,.back-btn{padding:10px 14px;border:1px solid var(--border);border-radius:10px;background:white;font-size:15px}.btn-primary{background:#236b50;color:white}.input{padding:10px;border:1px solid #9aa99f;border-radius:8px}summary{cursor:pointer}</style><div id="root"></div><script src="/vendor/preact-shim.min.js"></script><script>
localStorage.setItem('cg_individuals',localStorage.getItem('cg_individuals')||JSON.stringify([{id:'protected',name:'보존 시험'}]));
window.original=localStorage.getItem('cg_individuals'); window.calls=[];window.owner=true;
const read=()=>JSON.parse(localStorage.getItem('fixtureRecords')||'[]');
window.fixtureBridge={isOwner:()=>window.owner,ensure:async()=>{if(!window.owner)throw Error('대표님 전용');},animals:()=>[],photos:()=>[],token:()=>'',
list:async(kind,summary)=>{window.calls.push({method:'list',kind});return read().filter(r=>r.kind===kind).map(r=>summary?{id:r.data.id,result:r.data.result,animalId:r.data.animalId,createdAt:r.data.createdAt}:r.data);},
get:async(kind,id)=>read().find(r=>r.kind===kind&&r.data.id===id)?.data||null,
save:async(kind,data)=>{if(!window.owner)throw Error('대표님 전용');if(kind!=='crevalue_feedback'&&kind!=='crevalue')throw Error('Wrong write namespace');window.calls.push({method:'save',kind});const all=read();all.push({kind,data});localStorage.setItem('fixtureRecords',JSON.stringify(all));},
saveMany:async()=>{throw Error('Legacy writes not expected');}};
</script><script src="/crevalue.min.js"></script><script>ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(window.CREG_VALUE.Screen,{bridge:window.fixtureBridge,navigate:()=>{}}));</script></html>`;
const server=createServer(async(req,res)=>{try{const path=new URL(req.url,'http://localhost').pathname;if(path==='/'){res.setHeader('Content-Type','text/html;charset=utf-8');res.end(fixture);return;}if(!['/crevalue.min.js','/vendor/preact-shim.min.js'].includes(path)){res.statusCode=404;res.end();return;}res.setHeader('Content-Type','text/javascript;charset=utf-8');res.end(await readFile(new URL(path.slice(1),root)));}catch{res.statusCode=500;res.end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
const browser=await chromium.launch({channel:'chrome',headless:true});const context=await browser.newContext({viewport:{width:390,height:844},locale:'ko-KR'});const page=await context.newPage(),errors=[];
page.on('pageerror',e=>errors.push(e.message));
await page.route('**/*',route=>route.request().url().startsWith(base)?route.continue():route.abort());
const click=async name=>page.getByRole('button',{name,exact:true}).click();
const fill=async(id,value)=>page.locator('#'+id).fill(value);
const select=async(id,value)=>page.locator('#'+id).selectOption(value);
const waitSaved=async()=>page.getByRole('status').filter({hasText:'다시 조회했습니다'}).waitFor();
try {
 await page.goto(base);await page.getByRole('heading',{name:'사진 세트 입력',exact:true}).waitFor();
 await click('사진 세트 저장');await page.getByRole('alert').filter({hasText:'입력 내용을 확인'}).waitFor();
 for(const [key,name,split] of [['animal-a','시험 A','develop'],['animal-b','시험 B','develop']]){
   await fill('sample-animalKey',key);await fill('sample-name',name);await fill('sample-morphRaw','노멀');await fill('sample-capturedAt','2026-10-01');await select('sample-split',split);await select('sample-rights','owned');
   const image=await page.evaluate(key=>{const c=document.createElement('canvas');c.width=300;c.height=200;const x=c.getContext('2d');x.fillStyle=key==='animal-a'?'#b0c49b':'#c4b09b';x.fillRect(0,0,300,200);x.fillStyle='#536d3e';x.fillRect(20,50,220,80);return c.toDataURL('image/png').split(',')[1];},key);
   await page.locator('#sample-photos input').setInputFiles({name:key+'.png',mimeType:'image/png',buffer:Buffer.from(image,'base64')});await page.getByRole('status').filter({hasText:'사진을 준비했습니다'}).waitFor();
   await click('사진 세트 저장');await waitSaved();
 }
 await page.reload();await page.getByText('시험 A',{exact:true}).waitFor();await page.getByText('시험 B',{exact:true}).waitFor();
 await page.getByRole('button',{name:'사진 보기',exact:true}).first().click();await page.getByRole('button',{name:'사진 닫기',exact:true}).waitFor();
 await click('거래 자료');await fill('trade-transactionKey','sale-1');await fill('trade-animalKey','animal-a');await fill('trade-sellerKey','seller-a');await fill('trade-morphRaw','노멀');await select('trade-status','sold');await select('trade-rights','owned');await select('trade-evidenceGrade','A');
 await click('거래 자료 저장');await page.locator('#trade-finalPrice[aria-invalid="true"]').waitFor();
 await fill('trade-finalPrice','100000');await fill('trade-soldAt','2026-10-02');await fill('trade-completedAt','2026-10-03');await fill('trade-evidenceRef','합성 거래 확인');await fill('trade-verifiedBy','시험 담당');await fill('trade-verifiedAt','2026-10-03');
 await click('거래 자료 저장');await waitSaved();
 await page.getByLabel('CSV 내용',{exact:true}).fill('id,status,animalKey,sellerKey,source,morphRaw\ncsv-1,unsold,animal-c,seller-a,시험,노멀\ncsv-1,unsold,animal-d,seller-a,시험,노멀');await click('CSV 오류 검사');assert.equal(await page.getByRole('button',{name:'검사한 거래 전체 저장',exact:true}).isDisabled(),true);
 await page.getByLabel('CSV 내용',{exact:true}).fill('id,status,animalKey,sellerKey,source,morphRaw\ncsv-1,unsold,animal-c,seller-a,시험,노멀');await click('CSV 오류 검사');await click('검사한 거래 전체 저장');await waitSaved();
 await click('독립 평가');await page.getByLabel('사진 세트 A',{exact:true}).selectOption({index:1});await page.getByLabel('사진 세트 B',{exact:true}).selectOption({index:2});await click('독립 평가 회차 만들기');await page.getByText('대표님: 미제출 · 공동 평가자: 미제출',{exact:true}).waitFor();
 for(const label of ['발색 균일도','색·패턴 대비','두상·체형 외관','전체 외형 균형'])await page.getByLabel(label,{exact:true}).selectOption('a');await page.getByLabel('선택 근거·판단 불가 이유',{exact:true}).fill('첫 평가 비공개 근거');await click('평가 제출·잠금');await page.getByText('대표님: 제출 완료 · 공동 평가자: 미제출',{exact:true}).waitFor();assert.equal(await page.getByText('첫 평가 비공개 근거',{exact:true}).count(),0);assert.equal(await page.getByRole('button',{name:'두 사람 평가 공개',exact:true}).count(),0);
 await page.getByLabel('이번 평가자',{exact:true}).selectOption('1');for(const label of ['발색 균일도','색·패턴 대비','두상·체형 외관','전체 외형 균형'])await page.getByLabel(label,{exact:true}).selectOption('a');await page.getByLabel('선택 근거·판단 불가 이유',{exact:true}).fill('둘째 독립 근거');await click('평가 제출·잠금');await click('두 사람 평가 공개');await page.getByText('첫 평가 비공개 근거',{exact:true}).waitFor();
 await click('검증 현황');await page.getByText(/사진 세트 2개 · 서로 다른 개체 2마리/).waitFor();await click('저장된 AI 결과와 검증');await page.getByText(/사람 합의 항목과 AI: 0건/).waitFor();
 const qa=new URL('.crevalue-qa/',root);await mkdir(qa,{recursive:true});await page.screenshot({path:new URL('dataset-mobile.png',qa).pathname.replace(/^\/(.:)/,'$1'),fullPage:true});
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 await page.setViewportSize({width:1280,height:900});await page.screenshot({path:new URL('dataset-desktop.png',qa).pathname.replace(/^\/(.:)/,'$1'),fullPage:true});
 assert.equal(await page.evaluate(()=>localStorage.getItem('cg_individuals')===window.original),true);assert.deepEqual(errors,[]);
 assert.ok(await page.evaluate(()=>window.calls.filter(c=>c.method==='save').every(c=>c.kind==='crevalue_feedback')));
 await page.evaluate(()=>{window.owner=false;});await click('자료 새로고침');await page.getByRole('alert').filter({hasText:'대표님 전용'}).waitFor();
 const result={passed:true,checks:['photo input/save/reload','invalid dates/data guards in unit tests','trade validation/save','CSV all-or-none preview','two-reviewer seal/reveal','read-only AI validation','390px no overflow','nonowner blocked','breeding storage unchanged'],pageErrors:errors};await writeFile(new URL('dataset-browser.json',qa),JSON.stringify(result,null,2));console.log(JSON.stringify(result));
}catch(e){console.log((await page.locator('body').innerText()).slice(-4000));console.log('Page errors',errors);throw e;}finally {await browser.close();await new Promise(r=>server.close(r));}
