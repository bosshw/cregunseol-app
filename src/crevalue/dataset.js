import {PROFILES, profileFor} from './engine.js';
import {parseCSV, estimatePrice} from './market.js';

export const DATA_VERSION = 2;
export const SPLITS = {develop:'기준 개발',tune:'기준 조정',holdout:'최종 검증'};
export const MORPHS = Object.fromEntries(Object.entries(PROFILES).map(([k,v])=>[k,v.label]));
export const today = () => new Date().toLocaleDateString('en-CA');
export const newId = () => 'cv2-'+crypto.randomUUID();
const clone = x => JSON.parse(JSON.stringify(x));
const canonical = x => JSON.stringify(x, (_,v)=>v&&typeof v==='object'&&!Array.isArray(v)?Object.fromEntries(Object.keys(v).sort().map(k=>[k,v[k]])):v);
const text = x => String(x ?? '').trim();
const number = x => x === '' || x === null || x === undefined ? null : Number(x);
const day = x => /^\d{4}-\d{2}-\d{2}$/.test(x) && Number.isFinite(Date.parse(x)) && new Date(x).toISOString().slice(0,10) === x;
const sameMorph = (a,b) => a.slice().sort().join('+')===b.slice().sort().join('+');
export function normalizeMorph(raw) {
  const aliases = {...Object.fromEntries(Object.entries(MORPHS).map(([k,v])=>[v.replace(/\s/g,''),k])),노말:'normal',릴리:'lilly',풀핀:'pinstripe'};
  const tokens=text(raw).split(/[+,/]/).map(v=>v.replace(/\s/g,'').toLowerCase()).filter(Boolean);
  const keys=tokens.map(t=>Object.hasOwn(MORPHS,t)?t:aliases[t]);
  return tokens.length && keys.every(Boolean) ? [...new Set(keys)].sort() : [];
}
function dates(d, fields, errors, now=today()) {
  for(const k of fields) if(d[k] && (!day(d[k]) || d[k]>now)) errors[k]='실제 존재하는 오늘 이전 날짜를 입력해 주세요.';
}
function lengths(d,errors){for(const [k,v] of Object.entries(d))if(typeof v==='string'&&v.length>(k==='notes'?2000:500))errors[k]='입력 내용이 너무 깁니다.';}
export function validateSample(d, photos, existing=[]) {
  const value={...clone(d),type:'sample',schemaVersion:DATA_VERSION,morphs:normalizeMorph(d.morphRaw)};
  const errors={}, warnings=[];
  lengths(d,errors);
  for(const k of ['animalKey','name','capturedAt']) if(!text(d[k]))errors[k]='필수 항목입니다.';
  if(!Object.hasOwn(SPLITS,d.split)) errors.split='검증 용도를 선택해 주세요.';
  if(!['owned','permission'].includes(d.rights)) errors.rights='사진 사용 권한을 확인해 주세요.';
  if(!['unknown','male','female'].includes(d.sex)) errors.sex='성별을 확인해 주세요.';
  dates(d,['capturedAt','weighedAt','hatchDate'],errors);
  value.weight=number(d.weight);
  if(value.weight!==null&&(!Number.isFinite(value.weight)||value.weight<=0))errors.weight='체중은 0보다 큰 숫자입니다.';
  if(value.weight!==null&&!d.weighedAt)errors.weighedAt='체중 측정일을 입력해 주세요.';
  if(d.hatchDate&&d.capturedAt&&d.hatchDate>d.capturedAt)errors.hatchDate='촬영일보다 늦은 해칭일입니다.';
  if(d.weighedAt&&d.capturedAt&&d.weighedAt>d.capturedAt)errors.weighedAt='촬영 당시 또는 그 이전 측정값을 입력해 주세요.';
  if(!Array.isArray(photos)||photos.length<1||photos.length>6)errors.photos='사진을 1~6장 선택해 주세요.';
  if(photos?.some(p=>!p.id||!p.hash||!/^data:image\/(jpeg|png|webp);base64,/.test(p.dataUrl||'')))errors.photos='사진 파일을 다시 선택해 주세요.';
  if(new Set(photos?.map(p=>p.hash)).size!==photos?.length)errors.photos='같은 사진이 중복 선택되었습니다.';
  if(!value.morphs.length)warnings.push('모프 미확정: 자료는 보관하지만 모프별 분석·가격 계산은 보류합니다.');
  const angles=new Set(photos?.map(p=>p.angle));
  if(['등','좌측','우측','전신'].some(a=>!angles.has(a)))warnings.push('권장 촬영: 등·좌측·우측·전신. 빠진 각도를 보완해 주세요.');
  if(!text(d.familyKey))warnings.push('가족 그룹이 없어 형제·부모 조합의 검증 자료 혼입을 확인할 수 없습니다.');
  for(const old of existing.filter(r=>r.type==='sample')) {
    if(old.animalKey===text(d.animalKey)&&old.capturedAt===d.capturedAt&&old.photos?.length===photos?.length&&old.photos.every(a=>photos.some(b=>a.hash===b.hash)))errors.photos='같은 개체·촬영일·사진 세트가 이미 저장되어 있습니다. 새로고침 후 기존 세트를 확인해 주세요.';
    if(old.animalKey!==text(d.animalKey)&&old.photos?.some(a=>photos?.some(b=>a.hash===b.hash)))errors.photos='다른 개체 ID에 이미 등록된 사진입니다. 개체와 사진을 확인해 주세요.';
    const related=old.animalKey===text(d.animalKey)||(text(d.familyKey)&&old.familyKey===text(d.familyKey))||old.photos?.some(a=>photos?.some(b=>a.hash===b.hash));
    if(related&&old.split!==d.split)errors.split='같은 개체·가족·사진이 다른 검증 용도에 있습니다. 기존 용도와 맞춰 주세요.';
  }
  value.animalKey=text(d.animalKey);value.familyKey=text(d.familyKey);value.name=text(d.name);
  value.photos=(photos||[]).map(({dataUrl,...meta})=>meta);
  return {value,errors,warnings};
}

export const TRADE_FIELDS = ['transactionKey','animalKey','sellerKey','source','morphRaw','sex','weight','weighedAt','hatchDate','listedAt','priceChangedAt','soldAt','completedAt','lastConfirmedAt','listedPrice','finalPrice','shippingAmount','saleType','status','evidenceGrade','evidenceRef','verifiedBy','verifiedAt','rights','region','genetics','geneticsEvidence','lineage','sampleId','notes'];
export const TRADE_HEADER = ['id','status',...TRADE_FIELDS.filter(k=>k!=='status')].join(',');
export const EMPTY_TRADE = {sex:'unknown',status:'unsold',saleType:'single',evidenceGrade:'D',rights:'unknown',source:'본인 기록',region:'대한민국',morphRaw:'',currency:'KRW'};
export function latestTrades(records) {
  const trades=records.filter(r=>r.type==='trade');
  const superseded=new Set(trades.map(r=>r.replacesId).filter(Boolean));
  return trades.filter(r=>!superseded.has(r.id));
}
export function tradeReadiness(t, samples=[]) {
  const reasons=[];
  if(t.status!=='sold')reasons.push('판매 완료 아님');
  if(t.evidenceGrade!=='A'||!t.evidenceRef||!t.verifiedBy||!day(t.verifiedAt||''))reasons.push('최종금액 확인 근거 부족');
  if(!['owned','permission'].includes(t.rights))reasons.push('이용 권한 미확인');
  if(!t.morphs?.length)reasons.push('모프 미확정');
  if(!(t.finalPrice>0)||!day(t.soldAt||'')||!day(t.completedAt||''))reasons.push('최종금액·거래일·완료일 부족');
  if(t.saleType!=='single'||t.currency!=='KRW')reasons.push('국내 원화 단독 일반 거래 아님');
  if(t.region!=='대한민국')reasons.push('국내 시장 여부 확인 필요');
  const photo=samples.find(s=>s.id===t.sampleId);
  return {eligible:!reasons.length,reasons,photoLinked:!!photo};
}
export function validateTrade(d, existing=[], samples=[]) {
  const value={...clone(d),type:'trade',schemaVersion:DATA_VERSION,currency:'KRW',morphs:normalizeMorph(d.morphRaw)};
  const errors={},warnings=[];
  lengths(d,errors);
  for(const k of ['transactionKey','animalKey','sellerKey','source']){value[k]=text(d[k]);if(!value[k])errors[k]='필수 항목입니다.';}
  if(!['unsold','held','sold','cancelled','withdrawn','incomplete'].includes(d.status))errors.status='거래 상태를 확인해 주세요.';
  if(!['A','B','C','D'].includes(d.evidenceGrade))errors.evidenceGrade='근거 등급은 A~D입니다.';
  if(!['owned','permission','unknown'].includes(d.rights))errors.rights='이용 권한을 확인해 주세요.';
  if(!['unknown','male','female'].includes(d.sex))errors.sex='성별을 확인해 주세요.';
  if(!['single','bundle','exchange','urgent','friend','auction'].includes(d.saleType))errors.saleType='거래 종류를 확인해 주세요.';
  dates(d,['hatchDate','weighedAt','listedAt','priceChangedAt','soldAt','completedAt','lastConfirmedAt','verifiedAt'],errors);
  for(const k of ['weight','listedPrice','finalPrice','shippingAmount']){
    value[k]=number(d[k]);if(value[k]!==null&&(!Number.isFinite(value[k])||value[k]<0||(k==='weight'&&value[k]===0)))errors[k]='유효한 0 이상의 숫자를 입력해 주세요. 체중은 0보다 커야 합니다.';
  }
  for(const [a,b] of [['hatchDate','soldAt'],['weighedAt','soldAt'],['listedAt','priceChangedAt'],['priceChangedAt','soldAt'],['listedAt','soldAt'],['soldAt','completedAt']])if(d[a]&&d[b]&&d[a]>d[b])errors[a]='거래 날짜 순서를 확인해 주세요.';
  if(d.evidenceGrade==='A'){
    for(const k of ['soldAt','completedAt','evidenceRef','verifiedBy','verifiedAt'])if(!text(d[k]))errors[k]='A등급에는 완료일·금액 확인 근거·확인자·확인일이 필요합니다.';
    if(d.status!=='sold')errors.status='A등급은 최종 거래가 확인된 판매 완료 기록입니다.';
    if(value.finalPrice===null)errors.finalPrice='확인한 최종 개체 금액을 입력해 주세요.';
    if(d.verifiedAt&&d.completedAt&&d.verifiedAt<d.completedAt)errors.verifiedAt='완료 근거 확인일이 완료일보다 빠릅니다.';
  }
  if(d.evidenceGrade==='B'&&value.finalPrice===null)errors.finalPrice='B등급에는 판매자가 진술한 최종금액이 필요합니다.';
  const current=latestTrades(existing);
  const prior=d.replacesId?current.find(t=>t.id===d.replacesId):null;
  if(prior&&number(prior.listedPrice)!==value.listedPrice&&!d.priceChangedAt)errors.priceChangedAt='등록가를 실제로 변경한 날짜를 입력해 주세요.';
  if(d.replacesId&&(!prior||prior.transactionKey!==value.transactionKey))errors.transactionKey='수정할 원본이 변경되었습니다. 새로고침 후 다시 선택해 주세요.';
  if(current.some(t=>t.transactionKey===value.transactionKey&&t.id!==d.replacesId))errors.transactionKey='이미 있는 거래 ID입니다. 기존 거래의 수정 기록을 추가해 주세요.';
  if(current.some(t=>t.id!==d.replacesId&&t.animalKey===value.animalKey&&t.sellerKey===value.sellerKey&&t.soldAt&&t.soldAt===d.soldAt))errors.transactionKey='같은 개체·판매자·거래일의 중복 거래입니다.';
  if(d.sampleId){
    const s=samples.find(x=>x.id===d.sampleId);
    if(!s||s.animalKey!==value.animalKey)errors.sampleId='거래 개체와 같은 개체의 사진 세트를 선택해 주세요.';
    else if(d.soldAt&&s.capturedAt>d.soldAt)errors.sampleId='거래 이후 사진은 당시 외형 근거로 연결할 수 없습니다.';
  }
  if(!value.morphs.length)warnings.push('모프 미확정으로 가격 계산에서 제외됩니다.');
  if(value.weight!==null&&!d.weighedAt)warnings.push('당시 체중 측정일이 없습니다. 체중을 이용한 비교에서 제외됩니다.');
  if(d.status==='sold'&&!d.sampleId)warnings.push('거래 당시 사진이 없어 외형과 가격의 관계를 검증할 수 없습니다.');
  return {value,errors,warnings};
}
export function checkTradeCSV(csv,existing=[],samples=[]) {
  if(new TextEncoder().encode(csv).length>5*1024*1024)throw new Error('CSV는 5MB 이하로 나누어 주세요.');
  const input=parseCSV(csv);if(!input.length||input.length>500)throw new Error('CSV는 한 번에 1~500건 입력해 주세요.');
  const records=[],errors=[],warnings=[];
  input.forEach((r,i)=>{
    const checked=validateTrade({...EMPTY_TRADE,...Object.fromEntries(TRADE_FIELDS.filter(k=>r[k]!==undefined).map(k=>[k,r[k]])),transactionKey:r.transactionKey||r.id},existing.concat(records),samples);
    Object.entries(checked.errors).forEach(([field,message])=>errors.push({row:i+2,field,message}));
    checked.warnings.forEach(message=>warnings.push({row:i+2,message}));
    records.push({...checked.value,id:newId(),recordedAt:new Date().toISOString()});
  });
  return {records,errors,warnings};
}

const TYPES=new Set(['sample','trade','trade_batch','session','ballot','reveal','estimate']);
// Only the pre-existing owner-gated CREVALUE feedback namespace is written.
// Metadata lives in result so the existing summary projection can omit image bytes.
export function createDatasetStore(bridge) {
  async function guard(){if(!bridge.isOwner())throw new Error('대표님 전용 기능입니다.');await bridge.ensure();if(!bridge.isOwner())throw new Error('로그인 계정이 변경되었습니다.');}
  async function load(){await guard();const rows=await bridge.list('crevalue_feedback',true);return rows.filter(r=>r.result?.schemaVersion===DATA_VERSION&&TYPES.has(r.result.type)).flatMap(r=>r.result.type==='trade_batch'?r.result.records.map(t=>({...t,batchId:r.id})): [{...r.result,id:r.id}]);}
  async function append(value, photos=[]) {
    await guard();
    if(!TYPES.has(value.type)||!/^cv2-[\w-]+$/.test(value.id||''))throw new Error('자료 기록 형식이 올바르지 않습니다.');
    if(await bridge.get('crevalue_feedback',value.id))throw new Error('이미 저장된 기록입니다. 새 기록으로 추가해 주세요.');
    const record={id:value.id,name:value.name||value.transactionKey||'크레밸류 검증 자료',createdAt:new Date().toISOString(),result:{...clone(value),schemaVersion:DATA_VERSION},photos:clone(photos)};
    await guard();await bridge.save('crevalue_feedback',record);
    const saved=await bridge.get('crevalue_feedback',value.id);
    if(!saved||canonical(saved.result)!==canonical(record.result))throw new Error('저장 확인이 되지 않았습니다. 새로고침 후 기록을 확인해 주세요.');
    return record.result;
  }
  async function sample(id){await guard();const r=await bridge.get('crevalue_feedback',id);if(r?.result?.type!=='sample')throw new Error('사진 세트를 찾지 못했습니다.');return {...r.result,id,photos:r.photos};}
  async function assessments(sampleIds){
    await guard();const summaries=await bridge.list('crevalue',true), records=await load();
    const selected=records.filter(r=>r.type==='sample'&&(!sampleIds||sampleIds.includes(r.id)));
    const animals=new Set(selected.map(s=>s.animalKey)), ids=new Set(selected.map(s=>s.id));
    const results=[];
    for(const row of summaries.filter(r=>r.result?.source==='ai'&&animals.has(r.animalId))){
      const job=await bridge.get('crevalue',row.id);
      if(job&&ids.has(job.sourceSampleId)){
        const exposure=await bridge.get('crevalue_feedback','seen-'+job.id);
        results.push({id:job.id,sampleId:job.sourceSampleId,result:job.result,forceReanalysis:!!job.forceReanalysis,createdAt:job.createdAt,exposedAt:exposure?.createdAt||null});
      }
    }
    return results;
  }
  return {load,append,sample,assessments,async exportAll(){await guard();return (await bridge.list('crevalue_feedback')).filter(r=>r.result?.schemaVersion===DATA_VERSION);}};
}
export function createSession(left,right,reviewers,random=Math.random) {
  if(!left||!right||left.id===right.id||left.animalKey===right.animalKey)throw new Error('서로 다른 개체의 사진 세트를 선택해 주세요.');
  if(!left.morphs?.length||!sameMorph(left.morphs,right.morphs))throw new Error('확정한 같은 모프끼리 비교해 주세요.');
  const names=reviewers.map(text);if(names.length!==2||names.some(n=>!n)||names[0]===names[1])throw new Error('서로 다른 평가자 두 분의 구분 이름을 입력해 주세요.');
  const ids=random()<.5?[left.id,right.id]:[right.id,left.id];
  return {id:newId(),type:'session',schemaVersion:DATA_VERSION,left:ids[0],right:ids[1],reviewers:names,traits:Object.keys(profileFor(left.morphs).weights),morphs:left.morphs,createdAt:new Date().toISOString()};
}
export function sessionState(session,records) {
  const ballots=records.filter(r=>r.type==='ballot'&&r.sessionId===session.id);
  const duplicate=session.reviewers.some((_,i)=>ballots.filter(b=>b.reviewerIndex===i).length>1);
  const ready=!duplicate&&session.reviewers.every((_,i)=>ballots.some(b=>b.reviewerIndex===i));
  return {ballots,duplicate,ready,revealed:ready&&records.some(r=>r.type==='reveal'&&r.sessionId===session.id)};
}
export function createBallot(session,records,index,votes,notes,seen,recognizes) {
  if(!session||![0,1].includes(index))throw new Error('평가 회차와 평가자를 선택해 주세요.');
  if(records.some(r=>r.sessionId===session.id&&(r.type==='reveal'||r.type==='ballot'&&r.reviewerIndex===index)))throw new Error('이미 제출하거나 공개한 평가입니다. 새 회차를 만들어 주세요.');
  if(session.traits.some(k=>!['a','b','tie','unknown'].includes(votes[k])))throw new Error('모든 항목에서 선택하거나 판단 불가를 표시해 주세요.');
  if(!text(notes))throw new Error('선택한 근거 또는 판단 불가 이유를 적어 주세요.');
  return {id:newId(),type:'ballot',schemaVersion:DATA_VERSION,sessionId:session.id,reviewerIndex:index,votes:clone(votes),notes:text(notes),seenResult:!!seen,recognizesAnimal:!!recognizes,createdAt:new Date().toISOString()};
}
export function validationSummary(records) {
  const samples=records.filter(r=>r.type==='sample'), trades=latestTrades(records), sessions=records.filter(r=>r.type==='session');
  let compared=0,matched=0,withheld=0,excluded=0;
  for(const session of sessions){const s=sessionState(session,records);if(!s.revealed||s.ballots.some(b=>b.seenResult)){excluded++;continue;}
    for(const k of session.traits){const [a,b]=s.ballots.map(v=>v.votes[k]);if(a==='unknown'||b==='unknown'){withheld++;continue;}compared++;if(a===b)matched++;}
  }
  const conflictingSamples=samples.filter(s=>Object.keys(validateSample(s,(s.photos||[]).map(p=>({...p,dataUrl:'data:image/jpeg;base64,AA=='})),samples.filter(x=>x.id!==s.id)).errors).some(k=>k==='split'||k==='photos')).map(s=>s.id);
  const conflictingTrades=trades.filter(t=>trades.some(u=>u.id!==t.id&&u.transactionKey===t.transactionKey)).map(t=>t.id);
  return {samples:samples.length,animals:new Set(samples.map(s=>s.animalKey)).size,splits:Object.fromEntries(Object.keys(SPLITS).map(k=>[k,new Set(samples.filter(s=>s.split===k).map(s=>s.animalKey)).size])),trades:trades.length,eligible:trades.filter(t=>!conflictingTrades.includes(t.id)&&tradeReadiness(t,samples).eligible).length,photoTrades:trades.filter(t=>t.sampleId).length,sessions:sessions.length,compared,matched,withheld,excluded,conflictingSamples,conflictingTrades};
}
export function aiValidation(records, jobs) {
  let compared=0,matched=0,held=0;const rows=[];
  const conflicts=new Set(validationSummary(records).conflictingSamples);
  for(const session of records.filter(r=>r.type==='session')){
    if(conflicts.has(session.left)||conflicts.has(session.right))continue;
    const state=sessionState(session,records);if(!state.revealed||state.ballots.some(b=>b.seenResult))continue;
    // Freeze the first observation before the session. Later tuning must not rewrite the comparison.
    const pick=id=>jobs.filter(j=>j.sampleId===id&&j.createdAt<=session.createdAt&&j.result?.source==='ai').sort((a,b)=>a.createdAt.localeCompare(b.createdAt))[0];
    const a=pick(session.left),b=pick(session.right);
    if(!a||!b||a.result.version!==b.result.version||a.result.model!==b.result.model||!sameMorph(a.result.profile.ids,b.result.profile.ids)||a.result.coverage<80||b.result.coverage<80)continue;
    if([a,b].some(j=>j.exposedAt&&state.ballots.some(v=>j.exposedAt<=v.createdAt)))continue;
    for(const k of session.traits){
      const votes=state.ballots.map(v=>v.votes[k]);const x=a.result.traits.find(t=>t.id===k),y=b.result.traits.find(t=>t.id===k);
      if(votes[0]!==votes[1]||votes.includes('unknown')||x?.score==null||y?.score==null){held++;continue;}
      const prediction=x.score===y.score?'tie':x.score>y.score?'a':'b';compared++;if(prediction===votes[0])matched++;
      rows.push({sessionId:session.id,trait:k,human:votes[0],ai:prediction,matched:prediction===votes[0],assessmentIds:[a.id,b.id]});
    }
  }
  const repeats=[];
  for(const s of records.filter(r=>r.type==='sample')){
    const groups=new Map();for(const j of jobs.filter(j=>j.sampleId===s.id&&j.forceReanalysis&&j.result?.score!=null)){
      const key=[j.result.version,j.result.model,JSON.stringify(j.result.profile)].join('|');if(!groups.has(key))groups.set(key,[]);groups.get(key).push(j);
    }
    for(const g of groups.values())if(g.length>=2)repeats.push({sampleId:s.id,count:g.length,range:Math.max(...g.map(j=>j.result.score))-Math.min(...g.map(j=>j.result.score))});
  }
  return {compared,matched,held,rows,repeats};
}
export function comparablePrice(target,records) {
  const samples=records.filter(r=>r.type==='sample');const rows=latestTrades(records).filter(t=>tradeReadiness(t,samples).eligible);
  const unique=new Map();
  const conflicts=new Set(latestTrades(records).filter(t=>latestTrades(records).some(u=>u.id!==t.id&&u.transactionKey===t.transactionKey)).map(t=>t.transactionKey));
  for(const t of rows.slice().sort((a,b)=>String(b.soldAt).localeCompare(String(a.soldAt)))){
    if(conflicts.has(t.transactionKey))continue;
    if(t.animalKey===target.animalKey||text(t.genetics)!==text(target.genetics)||unique.has(t.animalKey))continue;
    unique.set(t.animalKey,t);
  }
  const comparable=[...unique.values()].map(t=>({...t,morph:t.morphs.join('+'),verification:'verified',weight:t.weighedAt?t.weight:null}));
  if(!normalizeMorph(target.morphRaw).length)return {range:null,reason:'대상 모프를 확정해야 합니다.',sampleCount:0};
  return estimatePrice({morph:normalizeMorph(target.morphRaw).join('+'),sex:target.sex,weight:number(target.weight)},comparable);
}
