// Listing prices never silently become verified realized prices.
export const CSV_HEADER='id,animalId,morph,sex,weight,hatchDate,listedPrice,finalPrice,status,verification,soldAt,source,rights,region,lineage,genetics,geneticsVerification,assessmentId,assessmentScore,assessmentVersion,transactionTerms,registeredAt';
export function parseCSV(text){
 text=text.replace(/^\uFEFF/,'');
 const rows=[];let row=[],cell='',quote=false;
 for(let i=0;i<text.length;i++){
  const c=text[i];
  if(c==='"'){if(quote&&text[i+1]==='"'){cell+='"';i++;}else quote=!quote;}
  else if(!quote&&(c===','||c==='\n')){row.push(cell);cell='';if(c==='\n'){rows.push(row);row=[];}}
  else if(c!=='\r'||quote)cell+=c;
 }
 if(quote)throw new Error('CSV 따옴표가 닫히지 않았습니다.');
 if(cell||row.length){row.push(cell);rows.push(row);}
 const header=rows.shift()?.map(h=>h.trim());if(!header||!header.includes('id')||!header.includes('status'))throw new Error('CSV 필수 열 id, status가 없습니다.');
 if(new Set(header).size!==header.length)throw new Error('CSV 열 이름이 중복됩니다.');
 return rows.filter(r=>r.some(c=>c.trim())).map((r,i)=>{if(r.length!==header.length)throw new Error(`${i+2}행 열 수 오류`);return Object.fromEntries(header.map((h,j)=>[h.trim(),r[j].trim()]));});
}
export function validateTransactions(rows,existing=[]){
 const ids=new Set(existing.map(r=>r.id));const signatures=new Set(existing.map(signature));const valid=[],errors=[];
 for(const [i,r]of rows.entries()){
  const t={...r};let err='';
  if(!/^[\w-]{1,100}$/.test(t.id||''))err='id는 영문·숫자·밑줄·하이픈으로 입력';
  else if(!t.morph||!t.source)err='모프와 출처 필수';
  else if(!['unsold','sold','cancelled','incomplete'].includes(t.status))err='거래 상태 오류';
  else if(!['unverified','verified'].includes(t.verification))err='검증 상태 오류';
  else if(!['owned','permission','unknown'].includes(t.rights))err='사용 권한 오류';
  for(const k of ['listedPrice','finalPrice','weight','assessmentScore']){
   if(t[k]===''||t[k]===undefined||t[k]===null)t[k]=null;
   else if(!Number.isFinite(Number(t[k]))||Number(t[k])<0)err=`${k}는 0 이상의 숫자`;
   else t[k]=Number(t[k]);
  }
  if(t.assessmentScore!==null&&(t.assessmentScore>100||!t.assessmentVersion))err='외형 점수는 0~100이며 기준 버전 필수';
  if(t.sex&&!['unknown','male','female'].includes(t.sex))err='성별은 unknown, male, female 중 선택';
  if(t.geneticsVerification&&!['unknown','verified'].includes(t.geneticsVerification))err='유전 검증은 unknown 또는 verified';
  if(t.soldAt&&(!/^\d{4}-\d{2}-\d{2}$/.test(t.soldAt)||!Number.isFinite(Date.parse(t.soldAt))||new Date(t.soldAt).toISOString().slice(0,10)!==t.soldAt))err='거래일은 실제 존재하는 YYYY-MM-DD 날짜';
  if(t.status==='sold'&&t.verification==='verified'&&(t.finalPrice===null||!t.soldAt||!Number.isFinite(Date.parse(t.soldAt))))err='검증 거래에는 최종 거래가격·거래일 필수';
  if(ids.has(t.id)||signatures.has(signature(t)))err='중복 기록';
  if(err)errors.push({row:i+2,message:err});else {ids.add(t.id);signatures.add(signature(t));valid.push({...t,enteredAt:new Date().toISOString()});}
 }
 return {valid,errors};
}
function signature(t){return [t.source,t.animalId||t.id,t.soldAt||'',t.finalPrice??''].join('|');}
const quantile=(a,p)=>{const n=(a.length-1)*p,l=Math.floor(n);return a[l]+(a[Math.ceil(n)]-a[l])*(n-l);};
export function estimatePrice(target,rows,{minSamples=10,maxAgeDays=180,now=Date.now()}={}){
 if(!Number.isInteger(minSamples)||minSamples<3||!(maxAgeDays>0))throw new Error('표본·기간 설정 오류');
 const morphKey=v=>String(v||'').split('+').map(s=>s.trim()).sort().join('+');
 const eligible=rows.filter(r=>r.status==='sold'&&r.verification==='verified'&&['owned','permission'].includes(r.rights)&&Number.isFinite(r.finalPrice)&&r.finalPrice>0&&Number.isFinite(Date.parse(r.soldAt))&&Date.parse(r.soldAt)<=now&&now-Date.parse(r.soldAt)<=maxAgeDays*86400000&&morphKey(r.morph)===morphKey(target.morph)&&(!target.sex||target.sex==='unknown'||r.sex===target.sex)&&(!target.region||r.region===target.region)&&(!target.weight||(r.weight>0&&Math.abs(r.weight-target.weight)<=Math.max(5,target.weight*0.3)))&&(!target.lineage||r.lineage===target.lineage)&&(!target.genetics||(target.geneticsVerification==='verified'&&r.geneticsVerification==='verified'&&r.genetics===target.genetics))&&(target.assessmentScore==null||(r.assessmentScore!=null&&r.assessmentVersion===target.assessmentVersion&&Math.abs(r.assessmentScore-target.assessmentScore)<=15))&&(!target.transactionTerms||r.transactionTerms===target.transactionTerms));
 const prices=eligible.map(r=>r.finalPrice).sort((a,b)=>a-b);
 const base={sampleCount:prices.length,asOf:new Date(now).toISOString().slice(0,10),periodDays:maxAgeDays,minSamples,confidence:'낮음'};
 if(prices.length<minSamples)return {...base,range:null,reason:'유사 실거래 자료 부족으로 신뢰할 수 있는 가격 범위를 제공할 수 없습니다.'};
 const q1=quantile(prices,.25),q3=quantile(prices,.75),iqr=q3-q1;
 const inside=prices.filter(p=>p>=q1-1.5*iqr&&p<=q3+1.5*iqr);
 if(inside.length<minSamples)return {...base,range:null,reason:'이상치 검토 후 유사 거래 표본이 부족합니다.'};
 const median=quantile(inside,.5); const dispersion=median?iqr/median:Infinity;
 const recentCount=eligible.filter(r=>now-Date.parse(r.soldAt)<=60*86400000&&inside.includes(r.finalPrice)).length;
 return {...base,sampleCount:inside.length,recentCount,excludedOutliers:prices.length-inside.length,median:Math.round(median),range:[Math.round(quantile(inside,.25)),Math.round(quantile(inside,.75))],confidence:inside.length>=30&&dispersion<=.5&&recentCount>=15?'보통':'낮음',reason:'입력한 모프·성별·체중 등 조건에 맞는 검증 거래의 중앙 50% 범위입니다. 외형 점수는 같은 버전 ±15점, 혈통·검증 유전·거래 조건은 입력 시 동일 기록으로 제한합니다. 미입력 조건의 영향과 시장 변동은 반영하지 못합니다.'};
}
