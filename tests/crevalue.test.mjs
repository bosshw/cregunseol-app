import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,writeFile} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {profileFor,PROFILES,scoreObservation,validateObservation,quotaDecision,compareAssessments,morphKeys} from '../src/crevalue/engine.js';
import {parseCSV,validateTransactions,estimatePrice} from '../src/crevalue/market.js';
import {summarizeFeedback} from '../src/crevalue/feedback.js';
import {createServer,validateJob,jobHash} from '../scripts/crevalue/server.mjs';

// All fixtures here are synthetic, never production animal or transaction records.
const p=profileFor(['normal']);
function observation(profile=p){return {subject:'gecko',summary:'합성 시험',tail:'미확인',lighting:'시험',strengths:[],limitations:[],suggestions:[],traits:Object.keys(profile.weights).map(id=>({id,observable:true,level:3,confidence:.7,observation:'시험 관찰',reason:'시험 근거',photoIds:['photo-1']}))};}
const png='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a9V0AAAAASUVORK5CYII=';
const job=id=>({id,name:'합성 시험',morphs:['normal'],photos:[{id:'photo-1',dataUrl:png}]});
const snapshot=(used=20,secondary=30)=>({rateLimitsByLimitId:{codex:{primary:{usedPercent:used},secondary:{usedPercent:secondary}}}});

test('every provisional profile and composite normalizes without duplicate traits',()=>{
 for(const id of Object.keys(PROFILES))assert.ok(Math.abs(Object.values(profileFor([id]).weights).reduce((a,b)=>a+b)-1)<1e-10);
 assert.deepEqual(profileFor(['lilly','lilly','axanthic']),profileFor(['lilly','axanthic']));
 assert.throws(()=>profileFor(['unknown']));assert.throws(()=>profileFor(['normal','bad']));
});
test('existing morph aliases do not turn heterozygous labels into visible morphs',()=>{
 assert.deepEqual(morphKeys('릴리'),['lilly']);assert.deepEqual(morphKeys('노말 핀타입'),['pinstripe']);assert.deepEqual(morphKeys('세이블헷아잔틱'),['sable']);assert.deepEqual(morphKeys('100헷초초 노말'),['normal']);assert.deepEqual(morphKeys('익스트림 할리퀸'),['extreme']);
});
test('unobservable traits are excluded rather than scored zero',()=>{
 const o=observation();o.traits[0]={...o.traits[0],observable:false,level:null};validateObservation(o,p,['photo-1']);
 const r=scoreObservation(o,p);assert.equal(r.score,75);assert.equal(r.coverage,75);assert.equal(r.traits[0].score,null);
});
test('insufficient coverage, drawings and uncertain subjects do not produce scores',()=>{
 const o=observation();for(const t of o.traits.slice(1)){t.observable=false;t.level=null;}assert.equal(scoreObservation(o,p).score,null);
 for(const subject of ['not_gecko','unclear']){const result=scoreObservation({...observation(),subject},p);assert.equal(result.score,null);assert.ok(result.traits.every(t=>t.score===null));assert.equal(result.coverage,0);}
});
test('schema rejects invented image references, duplicate traits and non-finite confidence',()=>{
 for(const mutate of [o=>o.traits[0].photoIds=['missing'],o=>o.traits[1].id=o.traits[0].id,o=>o.traits[0].confidence=NaN,o=>o.traits[0].level=8,o=>o.traits[0].reason='',o=>{o.traits[0].observable=false;}]){const o=observation();mutate(o);assert.throws(()=>validateObservation(o,p,['photo-1']));}
});
test('manual evaluations retain an explicit source and version snapshot',()=>{const r=scoreObservation(observation(),p,'manual');assert.equal(r.source,'manual');assert.equal(r.profile.version,r.version);assert.equal(r.score,75);});
test('different morphs or rubric versions suppress total-score ranking',()=>{const a=scoreObservation(observation(),p),q=profileFor(['axanthic']),b=scoreObservation(observation(q),q);assert.equal(compareAssessments(a,b).sameProfile,false);assert.equal(compareAssessments(a,{...a,version:'other'}).sameProfile,false);assert.equal(compareAssessments(a,a).sameProfile,true);});
test('exactly 10 percent and less refuses inference; the lowest window wins',()=>{
 for(const n of [90,90.1,100])assert.equal(quotaDecision(snapshot(0,n)).allowed,false);
 assert.equal(quotaDecision(snapshot(89.9,0)).allowed,true);assert.equal(quotaDecision(snapshot(80,40)).remaining,20);
});
test('unknown, malformed and non-Codex quotas fail closed',()=>{
 for(const q of [{},{rateLimitsByLimitId:{other:{primary:{usedPercent:0}}}},snapshot(NaN),snapshot(-1),snapshot(101),{...snapshot(),ordinaryUsageAllowed:null},{...snapshot(),ordinaryUsageAllowed:false}])assert.equal(quotaDecision(q).allowed,false);
 assert.equal(quotaDecision({rateLimits:{primary:{usedPercent:20}}}).allowed,true);
});
test('CSV handles BOM, quoted commas, escaped quotes and malformed columns',()=>{
 const rows=parseCSV('\uFEFFid,status,source\r\na,unsold,"my, \"\"source\"\""\r\n');assert.equal(rows[0].source,'my, "source"');
 assert.throws(()=>parseCSV('id,status\na,unsold,extra'));assert.throws(()=>parseCSV('id,status\na,"unclosed'));
 assert.throws(()=>parseCSV('id,status,finalPrice, finalPrice\na,sold,100,200'));
});
const tx=(id='a')=>({id,animalId:id,morph:'normal',sex:'female',weight:30,status:'sold',verification:'verified',rights:'owned',source:'SYNTHETIC QA',listedPrice:999999,finalPrice:100000,soldAt:'2026-10-01'});
test('sold listings are not verified transactions without final price and date',()=>{
 assert.equal(validateTransactions([{...tx(),finalPrice:''}]).errors.length,1);
 assert.equal(validateTransactions([{...tx(),soldAt:'2026-02-30'}]).errors.length,1);
 assert.equal(validateTransactions([{...tx(),status:'unsold',verification:'unverified',finalPrice:''}]).valid[0].finalPrice,null);
});
test('duplicate IDs and duplicate provenance records are rejected',()=>{
 assert.equal(validateTransactions([tx(),tx()]).errors.length,1);
 assert.equal(validateTransactions([{...tx(),id:'b'}],[tx()]).errors.length,1);
});
const now=Date.parse('2026-10-09T00:00:00Z'),target={morph:'normal',sex:'female',weight:30};
test('no data, unknown rights, stale sales and listing prices never create a range',()=>{
 assert.equal(estimatePrice(target,[],{now}).range,null);
 for(const patch of [{rights:'unknown'},{verification:'unverified'},{status:'unsold'},{soldAt:'2024-01-01'},{weight:null}])assert.equal(estimatePrice(target,Array.from({length:12},(_,i)=>({...tx(String(i)),...patch})),{now}).range,null);
});
test('reference range uses realized prices and excludes extreme outliers',()=>{
 const rows=Array.from({length:12},(_,i)=>({...tx(String(i)),finalPrice:100000+i*1000}));rows.push({...tx('extreme'),finalPrice:99999999});
 const r=estimatePrice(target,rows,{now});assert.deepEqual(r.range,[102750,108250]);assert.equal(r.excludedOutliers,1);assert.equal(r.confidence,'낮음');
});
test('quality, verified genetics, lineage and terms narrow comparable sales',()=>{
 const rows=Array.from({length:12},(_,i)=>({...tx(String(i)),assessmentScore:70,assessmentVersion:'v1',genetics:'het-x',geneticsVerification:'verified',lineage:'line',transactionTerms:'pickup'}));
 assert.ok(estimatePrice({...target,assessmentScore:75,assessmentVersion:'v1',genetics:'het-x',geneticsVerification:'verified',lineage:'line',transactionTerms:'pickup'},rows,{now}).range);
 assert.equal(estimatePrice({...target,assessmentScore:75,assessmentVersion:'v2'},rows,{now}).range,null);
 assert.equal(estimatePrice({...target,genetics:'het-x',geneticsVerification:'unknown'},rows,{now}).range,null);
});
test('only blind same-profile AI feedback contributes to agreement counts',()=>{
 const a=scoreObservation(observation(),p),b=structuredClone(a);b.traits[0].score=50;
 const jobs=[{id:'a',result:a},{id:'b',result:b}];const f={left:'a',right:'b',blind:true,votes:{color:'a'},reviewer:'시험'};
 const r=summarizeFeedback([f,{...f,blind:false}],jobs);assert.equal(r.pairs,1);assert.equal(r.traits[0].rate,100);
});
test('job input rejects missing photos, invalid formats, duplicate IDs and unknown morphs',()=>{
 for(const patch of [{photos:[]},{morphs:['invented']},{photos:[{id:'a',dataUrl:'data:image/png;base64,aGVsbG8='}]},{photos:[...job('a').photos,...job('a').photos]}])assert.throws(()=>validateJob({...job('a'),...patch}));
 assert.equal(validateJob(job('a')).rights.trainingAllowed,false);
 assert.equal(jobHash(validateJob(job('a'))),jobHash(validateJob({...job('b'),photos:[{id:'new',dataUrl:png}]})));
});

async function service(t,provider,dataDir,options={}){
 dataDir??=await mkdtemp(path.join(os.tmpdir(),'crevalue-test-'));
 const s=await createServer({port:0,dataDir,cloud:false,config:{owner:'synthetic-owner',url:'http://unused.invalid',key:'not-a-secret'},verifyUser:async token=>token==='synthetic-token'?{id:'synthetic-owner'}:token==='other-token'?{id:'someone-else'}:null,provider,...options});
 t.after(()=>s.close());const base='http://127.0.0.1:'+s.server.address().port;
 const request=(route,body,token='synthetic-token',extra={})=>fetch(base+route,{method:body?'POST':'GET',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json','X-Crevalue-Request':'1',...extra},...(body?{body:JSON.stringify(body)}:{})});
 return {s,request,base,dataDir};
}
const fake=()=>({calls:0,quota:async()=>quotaDecision(snapshot()),async analyze(j){this.calls++;const o=observation();for(const t of o.traits)t.photoIds=[j.photos[0].id];return scoreObservation(o,p);},close(){}});
async function settled(s,id){for(let i=0;i<100;i++){const j=s.jobs.get(id);if(j&&!['queued','claiming','analyzing','waiting'].includes(j.status))return j;await new Promise(r=>setTimeout(r,10));}throw Error('worker did not settle');}
test('worker verifies identity, rejects another account and disallowed browser origins',async t=>{
 const {request}=await service(t,fake());assert.equal((await request('/api/jobs',null,'')).status,401);assert.equal((await request('/api/jobs',null,'forged')).status,403);assert.equal((await request('/api/jobs',null,'other-token')).status,403);assert.equal((await request('/api/jobs',null,'synthetic-token',{Origin:'https://attacker.invalid'})).status,403);assert.equal((await request('/api/jobs')).status,200);
});
test('static server never exposes scripts, local state or dotfiles',async t=>{const {base}=await service(t,fake());for(const suffix of ['/scripts/crevalue/server.mjs','/.env','/jobs.json','/package.json'])assert.equal((await fetch(base+suffix)).status,404);});
test('submit, analyze, persist, cache and remap evidence without another AI call',async t=>{
 const provider=fake(),{request,s,dataDir}=await service(t,provider);assert.equal((await request('/api/jobs',job('first'))).status,202);const r=await settled(s,'first');assert.equal(r.result.score,75);
 const second={...job('second'),photos:[{id:'photo-2',dataUrl:png}]};await request('/api/jobs',second);const cached=await settled(s,'second');assert.equal(provider.calls,1);assert.equal(cached.reusedFrom,'first');assert.deepEqual(cached.result.traits[0].photoIds,['photo-2']);
 const saved=JSON.parse(await readFile(path.join(dataDir,'jobs.json'),'utf8'));assert.equal(saved.length,2);assert.ok(!JSON.stringify(saved).includes('synthetic-token'));
 const summaries=await (await request('/api/jobs')).json();assert.equal(summaries[0].photos[0].dataUrl,undefined);
});
test('forced re-observation calls AI, ID collisions do not replace a saved job',async t=>{
 const provider=fake(),{request,s}=await service(t,provider);await request('/api/jobs',job('a'));await settled(s,'a');await request('/api/jobs',{...job('b'),forceReanalysis:true});await settled(s,'b');assert.equal(provider.calls,2);
 assert.equal((await request('/api/jobs',{...job('a'),morphs:['lilly']})).status,400);assert.deepEqual(s.jobs.get('a').morphs,['normal']);
});
test('10 percent reserve persists blocked status without any inference, then retry recovers',async t=>{
 const provider=fake();provider.quota=async()=>quotaDecision(snapshot(90));const {request,s}=await service(t,provider);await request('/api/jobs',job('a'));assert.equal((await settled(s,'a')).status,'blocked');assert.equal(provider.calls,0);
 provider.quota=async()=>quotaDecision(snapshot(10));await request('/api/retry',{id:'a'});assert.equal((await settled(s,'a')).status,'completed');assert.equal(provider.calls,1);
});
test('provider failure stores an actionable error, never a fabricated result',async t=>{
 const provider=fake();provider.analyze=async()=>{throw Error('synthetic connection failure');};const {request,s}=await service(t,provider);await request('/api/jobs',job('a'));const r=await settled(s,'a');assert.equal(r.status,'error');assert.equal(r.result,undefined);assert.match(r.error,/connection failure/);
});
test('restarting after an interrupted analysis preserves photos and does not auto-spend',async t=>{
 const dir=await mkdtemp(path.join(os.tmpdir(),'crevalue-test-'));await writeFile(path.join(dir,'jobs.json'),JSON.stringify([{...validateJob(job('a')),status:'analyzing'}]));const provider=fake(),{s}=await service(t,provider,dir);assert.equal(s.jobs.get('a').status,'error');assert.equal(provider.calls,0);assert.equal(s.jobs.get('a').photos[0].dataUrl,png);
});
test('saved queued jobs wait for a newly verified owner session after restart',async t=>{
 const dir=await mkdtemp(path.join(os.tmpdir(),'crevalue-test-'));await writeFile(path.join(dir,'jobs.json'),JSON.stringify([validateJob(job('a'))]));const provider=fake(),{s,request}=await service(t,provider,dir);
 await s.work();assert.equal(provider.calls,0);assert.equal(s.jobs.get('a').status,'queued');await request('/api/status');await s.work();assert.equal((await settled(s,'a')).status,'completed');
});
test('expired identity is checked again immediately before spending quota',async t=>{
 let checks=0;const provider=fake(),{s,request}=await service(t,provider,undefined,{verifyUser:async()=>++checks===1?{id:'synthetic-owner'}:null});await request('/api/jobs',job('a'));await s.work();assert.equal(provider.calls,0);assert.equal(s.jobs.get('a').status,'queued');
});
test('a transient disk write failure does not poison later saves or freeze the worker',async t=>{
 let writes=0;const provider=fake(),{request,s}=await service(t,provider,undefined,{writeState:async(...args)=>{if(++writes===2)throw Error('SYNTHETIC disk lock');return writeFile(...args);}});
 await request('/api/jobs',job('a'));assert.equal((await settled(s,'a')).status,'error');await request('/api/jobs',job('b'));assert.equal((await settled(s,'b')).status,'completed');assert.equal(provider.calls,1);
});
function mockCloud(){
 const records=new Map();return {records,fetcher:async(url,options={})=>{
  const q=new URL(url).searchParams,method=options.method||'GET';let rows=[...records.values()];const id=q.get('id')?.replace(/^eq\./,'');if(id)rows=rows.filter(r=>r.id===id);
  for(const [key,val]of q){if(key.startsWith('data->>'))rows=rows.filter(r=>String(r.data[key.slice(7)])===val.replace(/^eq\./,''));if(key==='updated_at')rows=rows.filter(r=>r.updated_at===val.replace(/^eq\./,''));}
  if(method==='POST'){const row=JSON.parse(options.body);if(!records.has(row.id)||!options.headers.Prefer?.includes('ignore-duplicates'))records.set(row.id,row);return new Response(null,{status:201});}
  if(method==='PATCH'){const patch=JSON.parse(options.body);for(const row of rows)records.set(row.id,{...row,...patch});return Response.json(rows.map(r=>({id:r.id})));}
  return Response.json(rows);
 }};
}
test('two workers atomically claim one cloud job and only one spends subscription quota',async t=>{
 const cloud=mockCloud(),p1=fake(),p2=fake();for(const p of [p1,p2]){const original=p.analyze;p.analyze=async function(j){await new Promise(r=>setTimeout(r,40));return original.call(this,j);};}
 const a=await service(t,p1,undefined,{cloud:true,fetcher:cloud.fetcher}),b=await service(t,p2,undefined,{cloud:true,fetcher:cloud.fetcher});
 await Promise.all([a.request('/api/jobs',job('shared')),b.request('/api/jobs',job('shared'))]);
 for(let i=0;i<30&&cloud.records.get('shared')?.data.status!=='completed';i++)await new Promise(r=>setTimeout(r,10));
 assert.equal(p1.calls+p2.calls,1);assert.equal(cloud.records.get('shared').data.status,'completed');await a.s.pollCloud();await b.s.pollCloud();assert.equal(a.s.jobs.get('shared').status,'completed');assert.equal(b.s.jobs.get('shared').status,'completed');
});
test('cloud ID collision rejects different photos or morphs without rewriting the server job',async t=>{
 const cloud=mockCloud(),original=validateJob(job('collision'));cloud.records.set(original.id,{id:original.id,data:original,updated_at:'2026-10-09T00:00:00Z'});
 const provider=fake(),{request,s}=await service(t,provider,undefined,{cloud:true,fetcher:cloud.fetcher});await request('/api/jobs',{...job('collision'),morphs:['lilly']});assert.equal((await settled(s,'collision')).status,'error');assert.equal(provider.calls,0);assert.deepEqual(cloud.records.get('collision').data.morphs,['normal']);assert.equal((await request('/api/retry',{id:'collision'})).status,400);assert.deepEqual(cloud.records.get('collision').data.morphs,['normal']);
});
test('durable claim intent recovers a crash immediately after remote claim and can retry',async t=>{
 const cloud=mockCloud(),dir=await mkdtemp(path.join(os.tmpdir(),'crevalue-test-')),workerId='11111111-1111-4111-8111-111111111111',runId='old-run';
 const j={...validateJob(job('orphan')),workerId,runId,status:'claiming'};j.hash=jobHash(j);await writeFile(path.join(dir,'worker-id'),workerId);await writeFile(path.join(dir,'jobs.json'),JSON.stringify([j]));cloud.records.set(j.id,{id:j.id,data:{...j,status:'analyzing'},updated_at:'2026-10-09T00:00:00Z'});
 const provider=fake(),{s,request}=await service(t,provider,dir,{cloud:true,fetcher:cloud.fetcher});await request('/api/status');await s.pollCloud();assert.equal(cloud.records.get(j.id).data.status,'error');assert.equal(provider.calls,0);await request('/api/retry',{id:j.id});await settled(s,j.id);assert.equal(provider.calls,1);assert.equal(cloud.records.get(j.id).data.status,'completed');
});
test('stale local errors never overwrite another run or an already committed result',async t=>{
 const cloud=mockCloud(),dir=await mkdtemp(path.join(os.tmpdir(),'crevalue-test-')),workerId='22222222-2222-4222-8222-222222222222';
 const j={...validateJob(job('stale')),workerId,runId:'old-run',status:'error'};j.hash=jobHash(j);await writeFile(path.join(dir,'worker-id'),workerId);await writeFile(path.join(dir,'jobs.json'),JSON.stringify([j]));const completed={...j,workerId:'other-worker',runId:'new-run',status:'completed',result:scoreObservation(observation(),p)};cloud.records.set(j.id,{id:j.id,data:completed,updated_at:'2026-10-09T00:00:00Z'});
 const provider=fake(),{s,request}=await service(t,provider,dir,{cloud:true,fetcher:cloud.fetcher});await request('/api/status');await s.pollCloud();assert.equal(cloud.records.get(j.id).data.runId,'new-run');assert.equal(s.jobs.get(j.id).result.score,75);assert.equal(provider.calls,0);
});
test('a lost claim response is recoverable without running an unconfirmed analysis',async t=>{
 const cloud=mockCloud();let lose=true;const provider=fake(),{s,request}=await service(t,provider,undefined,{cloud:true,fetcher:async(url,options)=>{const r=await cloud.fetcher(url,options);if(lose&&options?.method==='PATCH'&&JSON.parse(options.body).data.status==='analyzing'){lose=false;throw Error('synthetic lost response');}return r;}});
 await request('/api/jobs',job('lost'));await settled(s,'lost');assert.equal(provider.calls,0);await s.pollCloud();assert.equal(cloud.records.get('lost').data.status,'error');
});
test('a cloud input edit between retry read and reset cannot be overwritten',async t=>{
 const cloud=mockCloud();let changeOnRead=false;const provider=fake();provider.quota=async()=>quotaDecision(snapshot(90));
 const {s,request}=await service(t,provider,undefined,{cloud:true,fetcher:async(url,options)=>{const r=await cloud.fetcher(url,options);if(changeOnRead&&(!options.method||options.method==='GET')&&new URL(url).searchParams.has('id')){changeOnRead=false;const row=cloud.records.get('retry-race');cloud.records.set(row.id,{...row,updated_at:new Date(Date.now()+1000).toISOString(),data:{...row.data,morphs:['lilly']}});}return r;}});
 await request('/api/jobs',job('retry-race'));await settled(s,'retry-race');for(let i=0;i<30&&cloud.records.get('retry-race').data.status!=='blocked';i++)await new Promise(r=>setTimeout(r,10));changeOnRead=true;
 assert.equal((await request('/api/retry',{id:'retry-race'})).status,400);assert.deepEqual(cloud.records.get('retry-race').data.morphs,['lilly']);assert.equal(provider.calls,0);
});
