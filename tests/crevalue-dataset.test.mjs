import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {normalizeMorph,validateSample,validateTrade,latestTrades,tradeReadiness,checkTradeCSV,createSession,createBallot,sessionState,createDatasetStore,validationSummary,aiValidation,comparablePrice,DATA_VERSION} from '../src/crevalue/dataset.js';
import {validateJob} from '../scripts/crevalue/server.mjs';
const photo={id:'p1',hash:'testhash',dataUrl:'data:image/png;base64,AAA=',angle:'등',fired:'미확인'};
const sample=(extra={})=>({id:'cv2-sample',type:'sample',animalKey:'animal-1',name:'합성 시험',morphRaw:'노멀',morphs:['normal'],capturedAt:'2026-10-01',split:'develop',rights:'owned',sex:'unknown',familyKey:'family-1',photos:[{...photo}],...extra});
const trade=(extra={})=>({id:'cv2-trade',type:'trade',transactionKey:'sale-1',animalKey:'animal-1',sellerKey:'seller-1',source:'합성 시험',morphRaw:'노멀',morphs:['normal'],sex:'unknown',status:'sold',saleType:'single',evidenceGrade:'A',rights:'owned',soldAt:'2026-10-01',completedAt:'2026-10-02',verifiedAt:'2026-10-03',evidenceRef:'시험 확인',verifiedBy:'시험 담당',finalPrice:100000,currency:'KRW',region:'대한민국',...extra});

test('unknown and het-only names never silently become normal; composite aliases normalize',()=>{
 assert.deepEqual(normalizeMorph('100헷초초'),[]);assert.deepEqual(normalizeMorph('오타'),[]);assert.deepEqual(normalizeMorph(''),[]);assert.deepEqual(normalizeMorph('릴리화이트 + 아잔틱'),['axanthic','lilly']);assert.deepEqual(normalizeMorph('노멀'),['normal']);
});
test('sample holds unknown morph, checks photos and dates, and never mutates source',()=>{
 const d=sample({morphRaw:'모름',weight:20,weighedAt:'2026-10-02'}), original=structuredClone(d);
 const c=validateSample(d,[photo]);assert.ok(c.errors.weighedAt);assert.ok(c.warnings.some(w=>w.includes('모프 미확정')));assert.deepEqual(d,original);assert.equal(c.value.photos[0].dataUrl,undefined);
 assert.ok(validateSample(sample(),[photo,photo]).errors.photos);
 assert.ok(validateSample(sample({capturedAt:'2026-02-30'}),[photo]).errors.capturedAt);
});
test('animal, family and exact photo hash cannot cross the frozen data split',()=>{
 for(const other of [sample({split:'holdout'}),sample({animalKey:'other',split:'holdout'}),sample({animalKey:'other',familyKey:'other-family',split:'holdout'})])assert.ok(validateSample(sample(),[photo],[other]).errors.split);
 assert.deepEqual(validateSample(sample(),[photo],[sample({capturedAt:'2026-09-30'})]).errors,{});
 assert.ok(validateSample(sample(),[photo],[sample()]).errors.photos,'an uncertain save cannot duplicate the same photo set');
});
test('verified transaction needs realized amount, completion evidence and chronological dates',()=>{
 assert.deepEqual(validateTrade(trade()).errors,{});
 for(const key of ['finalPrice','completedAt','evidenceRef','verifiedBy','verifiedAt'])assert.ok(Object.keys(validateTrade(trade({[key]:''})).errors).length,key);
 assert.ok(validateTrade(trade({listedAt:'2026-10-03'})).errors.listedAt);
 assert.ok(validateTrade(trade({weighedAt:'2026-10-02'})).errors.weighedAt);
 assert.ok(validateTrade(trade({status:'held'})).errors.status);
 assert.equal(tradeReadiness(trade({evidenceGrade:'C'})).eligible,false);
 assert.equal(tradeReadiness(trade({saleType:'bundle'})).eligible,false);
 assert.equal(tradeReadiness(trade({finalPrice:0})).eligible,false);
});
test('snapshot linkage rejects another animal or future photographs',()=>{
 assert.ok(validateTrade(trade({sampleId:'cv2-sample'}),[],[sample({animalKey:'other'})]).errors.sampleId);
 assert.ok(validateTrade(trade({sampleId:'cv2-sample'}),[],[sample({capturedAt:'2026-10-02'})]).errors.sampleId);
 assert.deepEqual(validateTrade(trade({sampleId:'cv2-sample'}),[],[sample()]).errors,{});
});
test('trade corrections are append-only and stale revision/duplicate input is rejected',()=>{
 const old=trade(), revised=trade({id:'cv2-new',replacesId:old.id,finalPrice:90000});
 assert.deepEqual(validateTrade(revised,[old]).errors,{});assert.deepEqual(latestTrades([old,revised]),[revised]);
 assert.ok(validateTrade(trade(),[old]).errors.transactionKey);
 assert.ok(validateTrade(trade({replacesId:old.id}),[old,revised]).errors.transactionKey);
 assert.equal(old.finalPrice,100000);
});
test('CSV detects duplicated transaction IDs and reports field/row before any persistence',()=>{
 const csv='id,status,animalKey,sellerKey,source,morphRaw\none,unsold,a,s,fixture,노멀\none,unsold,b,s,fixture,노멀\n';
 const c=checkTradeCSV(csv);assert.equal(c.records.length,2);assert.ok(c.errors.some(e=>e.row===3&&e.field==='transactionKey'));
 assert.ok(c.records.every(r=>Number.isFinite(Date.parse(r.recordedAt))));
 assert.throws(()=>checkTradeCSV('id,status\n"bad,unsold'),/따옴표/);
 assert.throws(()=>checkTradeCSV('id,status\n'),/1~500/);
});
test('two reviewer submissions are sealed until explicit reveal; duplicates invalidate a session',()=>{
 const s=createSession(sample(),sample({id:'cv2-b',animalKey:'animal-2'}),['첫째','둘째'],()=>0);
 const votes=Object.fromEntries(s.traits.map(k=>[k,'a']));
 const a=createBallot(s,[],0,votes,'사진의 대비',false,true);
 assert.equal(sessionState(s,[a]).ready,false);assert.throws(()=>createBallot(s,[a],0,votes,'중복',false,false),/이미/);
 const b=createBallot(s,[a],1,votes,'사진의 대비',false,false);
 assert.equal(sessionState(s,[a,b]).ready,true);assert.equal(sessionState(s,[a,b]).revealed,false);
 const reveal={id:'cv2-reveal',type:'reveal',sessionId:s.id};
 assert.equal(sessionState(s,[a,b,reveal]).revealed,true);
 assert.equal(sessionState(s,[a,b,{...b,id:'cv2-duplicate'},reveal]).revealed,false);
 assert.equal(validationSummary([s,a,b,reveal]).matched,s.traits.length);
 assert.equal(validationSummary([s,a,{...b,seenResult:true},reveal]).compared,0);
 assert.throws(()=>createSession(sample(),sample({id:'cv2-b'}),['a','b']),/서로 다른/);
});
test('dataset repository is owner guarded, uses only CREVALUE feedback, preserves metadata under key reordering',async()=>{
 const data=new Map(),calls=[];let owner=true;
 const bridge={isOwner:()=>owner,ensure:async()=>{},get:async(k,id)=>{calls.push(k);return data.get(id)||null;},save:async(k,v)=>{calls.push(k);data.set(v.id,JSON.parse(JSON.stringify(v),(_,x)=>x&&typeof x==='object'&&!Array.isArray(x)?Object.fromEntries(Object.entries(x).reverse()):x));},list:async(k)=>{calls.push(k);return [...data.values()];}};
 const store=createDatasetStore(bridge);const s={...sample(),schemaVersion:DATA_VERSION};await store.append(s,[photo]);assert.equal((await store.load()).length,1);assert.equal((await store.sample(s.id)).photos.length,1);assert.ok(calls.every(k=>k==='crevalue_feedback'));
 await assert.rejects(()=>store.append(s),/이미 저장/);owner=false;await assert.rejects(()=>store.load(),/대표님/);await assert.rejects(()=>store.append({...s,id:'cv2-other'}),/대표님/);assert.equal(data.size,1);
});
test('account switch during session refresh blocks a write',async()=>{
 let owner=true,writes=0;const store=createDatasetStore({isOwner:()=>owner,ensure:async()=>{owner=false;},save:async()=>writes++});await assert.rejects(()=>store.append(sample()),/변경/);assert.equal(writes,0);
});
test('worker validation retains dataset provenance without widening access or changing old job hashes',()=>{
 const j=validateJob({id:'test-job',animalId:'a',morphs:['normal'],sourceSampleId:'cv2-sample',animalSnapshot:{capturedAt:'2026-10-01',weighedAt:'2026-09-30',split:'holdout',gender:'female',weight:20},photos:[{id:'p1',dataUrl:'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a9V0AAAAASUVORK5CYII='}]});
 assert.equal(j.sourceSampleId,'cv2-sample');assert.equal(j.animalSnapshot.split,'holdout');assert.equal(j.animalSnapshot.gender,'female');
});
test('AI validation uses pre-session blind matching observations and never counts cached results as repeats',()=>{
 const a=sample(), b=sample({id:'cv2-b',animalKey:'animal-2',photos:[{...photo,hash:'different'}]}),s=createSession(a,b,['first','second'],()=>0);s.createdAt='2026-10-02T00:00:00Z';
 const votes=Object.fromEntries(s.traits.map(k=>[k,'a']));const ballots=[0,1].map(i=>({...createBallot(s,[],i,votes,'test',false,false),createdAt:'2026-10-03T00:00:00Z'}));
 const records=[a,b,s,...ballots,{id:'cv2-reveal',type:'reveal',sessionId:s.id}];
 const result=n=>({source:'ai',score:n,version:'test',model:'test',coverage:100,profile:{ids:['normal']},traits:s.traits.map(id=>({id,score:n}))});
 const jobs=[{id:'a',sampleId:a.id,createdAt:'2026-10-01T00:00:00Z',result:result(75)},{id:'b',sampleId:b.id,createdAt:'2026-10-01T00:00:00Z',result:result(50)}];
 assert.equal(aiValidation(records,jobs).matched,4);assert.equal(aiValidation(records,[...jobs,{...jobs[0],id:'cached'}]).repeats.length,0);
 assert.equal(aiValidation(records,[{...jobs[0],exposedAt:'2026-10-02T00:00:00Z'},jobs[1]]).compared,0);
 assert.equal(aiValidation(records,[{...jobs[0],createdAt:'2026-10-04T00:00:00Z'},jobs[1]]).compared,0);
 assert.equal(aiValidation(records,[{...jobs[0],result:{...jobs[0].result,coverage:45}},jobs[1]]).compared,0);
});
test('comparable price excludes self, repeated sales and mismatched genetics',()=>{
 const rows=Array.from({length:12},(_,i)=>trade({id:'cv2-t'+i,animalKey:'animal-'+i,transactionKey:'sale-'+i}));
 rows.push(trade({id:'cv2-resale',transactionKey:'resale',animalKey:'animal-2',soldAt:'2026-10-02',finalPrice:1000000}));
 rows[11].genetics='100% 헷';
 const result=comparablePrice({animalKey:'animal-0',morphRaw:'노멀',sex:'unknown'},rows);assert.ok(result.sampleCount<=10);
 assert.equal(comparablePrice({morphRaw:'오타'},rows).range,null);
});
test('new UI and persistence modules do not write to breeding stores or ship production fixtures',async()=>{
 const sources=await Promise.all(['dataset.js','workspace.jsx'].map(p=>readFile(new URL('../src/crevalue/'+p,import.meta.url),'utf8')));
 for(const s of sources){assert.doesNotMatch(s,/DB\.(add|update|remove|set)|localStorage\.setItem|cg_individuals|cg_events|cg_reminders/);assert.doesNotMatch(s,/service_role|SUPABASE_SERVICE/);}
});
