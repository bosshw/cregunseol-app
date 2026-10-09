import http from 'node:http';
import {readFile,writeFile,mkdir,rename} from 'node:fs/promises';
import {createHash,randomUUID} from 'node:crypto';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {CodexProvider} from './codex-provider.mjs';
import {profileFor,VERSION} from '../../src/crevalue/engine.js';

export const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
export async function publicConfig(root=ROOT){
 const source=await readFile(path.join(root,'src/app.jsx'),'utf8');
 const block=source.match(/const SERVER\s*=\s*\{([\s\S]*?)\n\};/)?.[1];
 const url=block?.match(/url:\s*['"]([^'"]+)['"]/)?.[1];
 const key=block?.match(/key:\s*['"]([^'"]+)['"]/)?.[1];
 const owner=source.match(/const OWNER_UID\s*=\s*['"]([^'"]+)['"]/)?.[1];
 if(!url||!key||!owner)throw new Error('브리딩비서 공개 연결 설정을 찾지 못했습니다.');
 return {url,key,owner};
}
export function validateJob(input){
 if(!input||!/^[a-zA-Z0-9-]{1,80}$/.test(input.id||''))throw new Error('요청 ID 오류');
 profileFor(input.morphs);
 if(!Array.isArray(input.photos)||!input.photos.length||input.photos.length>6)throw new Error('사진은 1~6장 등록해 주세요.');
 const ids=new Set();
 const photos=input.photos.map(p=>{
  if(!p||!/^[a-zA-Z0-9-]{1,80}$/.test(p.id||'')||ids.has(p.id))throw new Error('사진 ID 오류');ids.add(p.id);
  if(typeof p.dataUrl!=='string'||p.dataUrl.length>4000000||!/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+=*$/.test(p.dataUrl))throw new Error('지원하지 않는 사진 형식 또는 크기입니다.');
  const bytes=Buffer.from(p.dataUrl.split(',')[1],'base64');
  if(!(bytes.subarray(0,3).equals(Buffer.from([255,216,255]))||bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))||(bytes.toString('ascii',0,4)==='RIFF'&&bytes.toString('ascii',8,12)==='WEBP')))throw new Error('이미지 파일의 실제 형식이 올바르지 않습니다.');
  return {id:p.id,dataUrl:p.dataUrl,angle:String(p.angle||'미지정').slice(0,30),fired:String(p.fired||'미확인').slice(0,30)};
 });
 return {id:input.id,animalId:String(input.animalId||'').slice(0,100),name:String(input.name||'이름 없는 개체').slice(0,100),morphs:[...new Set(input.morphs)],photos,createdAt:new Date(input.createdAt||Date.now()).toISOString(),status:'queued',version:VERSION,forceReanalysis:input.forceReanalysis===true,blindMode:input.blindMode===true,animalSnapshot:input.animalSnapshot&&{weight:input.animalSnapshot.weight??null,hatchDate:String(input.animalSnapshot.hatchDate||''),gender:String(input.animalSnapshot.gender||'unknown')},rights:{analysisAllowed:true,trainingAllowed:false}};
}
export function jobHash(job){return createHash('sha256').update(JSON.stringify({version:VERSION,morphs:job.morphs.slice().sort(),photos:job.photos.map(p=>[p.dataUrl,p.angle,p.fired])})).digest('hex');}

export async function createServer({port=4264,dataDir=path.join(process.env.LOCALAPPDATA||ROOT,'Crevalue'),provider=new CodexProvider(),config,verifyUser,cloud=true,fetcher=fetch,writeState=writeFile}={}){
 config??=await publicConfig();await mkdir(dataDir,{recursive:true});await mkdir(path.join(dataDir,'analysis'),{recursive:true});
 const workerFile=path.join(dataDir,'worker-id');let workerId;try{workerId=await readFile(workerFile,'utf8');}catch(e){if(e.code!=='ENOENT')throw e;workerId=randomUUID();await writeFile(workerFile,workerId,{mode:0o600});}
 if(!/^[a-f0-9-]{36}$/.test(workerId))throw new Error('PC 분석기 ID 파일이 올바르지 않습니다.');
 const jobs=new Map(),synced=new Set();let session=null,busy=false,lastQuota=null,lastCloudError='',cloudBusy=false,closed=false;
 const stateFile=path.join(dataDir,'jobs.json');
 try{for(const job of JSON.parse(await readFile(stateFile,'utf8'))){if(['analyzing','claiming'].includes(job.status)){job.status='error';job.error='PC 분석 프로그램이 재시작되었습니다. 다시 분석을 눌러 주세요.';}jobs.set(job.id,job);}}catch(e){if(e.code!=='ENOENT')throw new Error('저장된 분석 기록을 읽지 못했습니다. 원본 파일을 보존합니다.');}
 let saving=Promise.resolve();
 const persist=()=>{const snapshot=JSON.stringify([...jobs.values()]);saving=saving.catch(()=>{}).then(async()=>{await writeState(stateFile+'.tmp',snapshot,{mode:0o600});await rename(stateFile+'.tmp',stateFile);});return saving;};
 const headers=()=>({apikey:config.key,Authorization:'Bearer '+session.token,'Content-Type':'application/json'});
 const cloudQuery=(id,extra={})=>new URLSearchParams({kind:'eq.crevalue',id:'eq.'+id,deleted:'eq.false',...extra});
 const readRemote=async id=>{const r=await fetcher(config.url+'/rest/v1/cg_records?'+cloudQuery(id,{select:'data,updated_at',limit:'1'}),{headers:headers(),signal:AbortSignal.timeout(15000)});if(!r.ok)throw new Error('서버 요청 상태 확인 실패');return (await r.json())[0]||null;};
 const adoptRemote=async job=>{
  const row=await readRemote(job.id);
  if(row?.data){
   const remote=row.data;
   if(['completed','blocked','error'].includes(remote.status)){jobs.set(job.id,remote);synced.add(job.id);}
   else if(remote.status==='queued'){const restored=validateJob(remote);jobs.set(job.id,{...restored,hash:jobHash(restored)});}
  }else{job.status='error';job.error='서버 요청이 없거나 삭제되었습니다.';synced.add(job.id);}
  await persist();
 };
 const mirror=async(job)=>{
  synced.delete(job.id);if(!cloud||!session||!job.runId)return;
  const q=cloudQuery(job.id,{select:'id','data->>status':'eq.analyzing','data->>workerId':'eq.'+workerId,'data->>runId':'eq.'+job.runId});
  const r=await fetcher(config.url+'/rest/v1/cg_records?'+q,{method:'PATCH',headers:{...headers(),Prefer:'return=representation'},body:JSON.stringify({data:job,updated_at:new Date().toISOString()}),signal:AbortSignal.timeout(20000)});
  if(!r.ok)throw new Error('분석 결과 서버 저장 실패 ('+r.status+')');
  if((await r.json()).length)synced.add(job.id);else{job.status='waiting';await adoptRemote(job);}
 };
 async function auth(token){
  if(!token||token.length>10000)throw Object.assign(new Error('대표님 계정으로 로그인해 주세요.'),{status:401});
  const u=verifyUser?await verifyUser(token):await fetcher(config.url+'/auth/v1/user',{headers:{apikey:config.key,Authorization:'Bearer '+token},signal:AbortSignal.timeout(15000)}).then(async r=>r.ok?r.json():null);
  if(u?.id!==config.owner)throw Object.assign(new Error('대표님 전용 기능입니다.'),{status:403});
  session={token,seenAt:Date.now()};
 }
 async function add(input,fromCloud=false){
  const job=validateJob(input),prior=jobs.get(job.id);
  job.hash=jobHash(job);
  if(prior){if(prior.hash!==job.hash)throw new Error('같은 요청 ID에 다른 사진을 등록할 수 없습니다.');return prior;}
  const cached=!job.forceReanalysis&&[...jobs.values()].find(j=>j.hash===job.hash&&j.status==='completed');
  if(cached){const remap=t=>({...t,photoIds:t.photoIds.map(id=>job.photos[cached.photos.findIndex(p=>p.id===id)]?.id).filter(Boolean)});job.result={...cached.result,traits:cached.result.traits.map(remap),observation:{...cached.result.observation,traits:cached.result.observation.traits.map(remap)}};job.reusedFrom=cached.id;}
  jobs.set(job.id,job);await persist();
  if(cloud&&!fromCloud){const r=await fetcher(config.url+'/rest/v1/cg_records?on_conflict=user_id,kind,id',{method:'POST',headers:{...headers(),Prefer:'resolution=ignore-duplicates'},body:JSON.stringify({user_id:config.owner,kind:'crevalue',id:job.id,data:job,deleted:false,updated_at:new Date().toISOString()}),signal:AbortSignal.timeout(20000)});if(!r.ok)throw new Error('서버 대기열 저장 실패');}
  void work();return job;
 }
 async function work(){
  if(busy||closed||!session)return;const job=[...jobs.values()].find(j=>j.status==='queued');if(!job)return;
  busy=true;
  try{await auth(session.token);}catch{session=null;lastCloudError='계정 연결이 만료되었습니다. PC에서 크레밸류를 다시 열어 주세요.';busy=false;return;}
  let claimed=!cloud;
  try{
   if(cloud){
    const remote=await readRemote(job.id);if(!remote)throw new Error('서버 요청이 없거나 삭제되었습니다.');
    if(jobHash(validateJob(remote.data))!==job.hash)throw new Error('같은 요청 ID의 서버 사진이 다릅니다. 새 평가로 접수해 주세요.');
    if(remote.data.status!=='queued'){job.status='waiting';return;}
    Object.assign(job,{status:'claiming',workerId,runId:randomUUID(),startedAt:new Date().toISOString()});await persist();
    const q=cloudQuery(job.id,{'data->>status':'eq.queued',updated_at:'eq.'+remote.updated_at,select:'id'});
    const r=await fetcher(config.url+'/rest/v1/cg_records?'+q,{method:'PATCH',headers:{...headers(),Prefer:'return=representation'},body:JSON.stringify({data:{...job,status:'analyzing'},updated_at:new Date().toISOString()}),signal:AbortSignal.timeout(15000)});
    if(!r.ok)throw new Error('서버 분석 요청을 선점하지 못했습니다.');
    if(!(await r.json()).length){job.status='waiting';job.error='다른 분석기의 결과를 기다리고 있습니다.';return;}
    claimed=true;job.workerId=workerId;
   }
   lastQuota=await provider.quota();
   if(!lastQuota.allowed){job.status='blocked';job.error=lastQuota.message;job.errorCode=lastQuota.code;}
   else{job.status='analyzing';job.error='';await persist();if(!job.reusedFrom)job.result=await provider.analyze(job,path.join(dataDir,'analysis'));job.status='completed';job.completedAt=new Date().toISOString();}
  }catch(e){job.status=e.code?.startsWith('QUOTA')?'blocked':'error';job.error=String(e.message||'분석 실패').slice(0,500);job.errorCode=e.code||'ANALYSIS_FAILED';}
  finally{try{await persist();}catch{lastCloudError='PC 파일 저장 실패: 디스크 공간·파일 잠금을 확인해 주세요.';}try{if(claimed)await mirror(job);}catch(e){lastCloudError=e.message;}finally{busy=false;if(!closed)setTimeout(()=>void work(),200).unref();}}
 }
 async function pollCloud(){
  if(!cloud||!session||cloudBusy)return;cloudBusy=true;
  try{
   const r=await fetcher(config.url+'/rest/v1/cg_records?kind=eq.crevalue&deleted=eq.false&data->>status=eq.queued&select=id,data,updated_at&order=updated_at.asc&limit=5',{headers:headers(),signal:AbortSignal.timeout(15000)});
   if(r.status===401){session=null;return;}if(!r.ok)throw new Error('대기열 연결 실패 ('+r.status+')');
   const rows=await r.json();for(const row of rows){if(row.data?.status==='queued'&&!jobs.has(row.id)){try{await add({...row.data,id:row.id},true);}catch(e){const q=cloudQuery(row.id,{'data->>status':'eq.queued',updated_at:'eq.'+row.updated_at});await fetcher(config.url+'/rest/v1/cg_records?'+q,{method:'PATCH',headers:headers(),body:JSON.stringify({data:{...row.data,status:'error',error:String(e.message).slice(0,200)},updated_at:new Date().toISOString()}),signal:AbortSignal.timeout(15000)});}}}
   for(const job of jobs.values())if(job.status==='waiting')await adoptRemote(job);
   for(const j of jobs.values())if(j.workerId===workerId&&['completed','error','blocked'].includes(j.status)&&!synced.has(j.id))await mirror(j);
   lastCloudError='';
  }catch(e){lastCloudError=String(e.message).slice(0,150);}finally{cloudBusy=false;}
 }
 const allowedOrigins=new Set(['https://bosshw.github.io',`http://127.0.0.1:${port}`,`http://localhost:${port}`]);
 const server=http.createServer(async(req,res)=>{
  const origin=req.headers.origin;
  const send=(status,data)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(data));};
  if(!['127.0.0.1:'+server.address().port,'localhost:'+server.address().port].includes(req.headers.host))return send(403,{error:'로컬 PC 접속만 허용됩니다.'});
  if(origin&&!allowedOrigins.has(origin))return send(403,{error:'허용되지 않은 접속입니다.'});
  if(origin){res.setHeader('Access-Control-Allow-Origin',origin);res.setHeader('Vary','Origin');res.setHeader('Access-Control-Allow-Headers','Authorization,Content-Type,X-Crevalue-Request');res.setHeader('Access-Control-Allow-Methods','GET,POST,OPTIONS');res.setHeader('Access-Control-Allow-Private-Network','true');}
  if(req.method==='OPTIONS'){res.writeHead(204);res.end();return;}
  const pathname=new URL(req.url,'http://127.0.0.1').pathname;
  try{
   if(pathname==='/health')return send(200,{ok:true,service:'crevalue',version:VERSION});
   if(!pathname.startsWith('/api/')){
    if(req.method!=='GET')return send(405,{error:'GET only'});
    const rel=decodeURIComponent(pathname==='/'?'/index.html':pathname).slice(1);
    // Only public application assets are served; never repository, scripts, data or credentials.
    if(!/^(index\.html|app\.min\.js|crevalue\.min\.js|crevalue-connect\.(html|js|css)|brand-art\.(js|css)|welcome\.min\.js|extras\.min\.js|card\.min\.js|importer\.min\.js|manifest\.json|version\.json|icon-\d+\.png|g\.html|vendor\/[\w.-]+\.js|assets\/brand\/[\w.-]+\.(svg|webp|png))$/.test(rel))return send(404,{error:'Not found'});
    if(rel.startsWith('crevalue-connect.'))res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'");
    const data=await readFile(path.join(ROOT,rel));const ext=path.extname(rel);res.writeHead(200,{'Content-Type':({'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png','.json':'application/json'})[ext]||'application/octet-stream','Cache-Control':'no-store'});res.end(data);return;
   }
   await auth(String(req.headers.authorization||'').match(/^Bearer\s+(\S+)$/i)?.[1]||'');
   if(req.method==='GET'&&pathname==='/api/status'){
    try{lastQuota=await provider.quota();}catch{lastQuota={allowed:false,remaining:null,code:'QUOTA_UNKNOWN',message:'Codex 로그인·구독 한도를 확인할 수 없습니다.'};}
    return send(200,{connected:true,busy,quota:lastQuota,cloudError:lastCloudError});
   }
   if(req.method==='GET'&&pathname==='/api/jobs')return send(200,[...jobs.values()].map(j=>({...j,photos:j.photos.map(p=>({id:p.id,angle:p.angle,fired:p.fired}))})));
   if(req.method!=='POST'||req.headers['x-crevalue-request']!=='1')return send(400,{error:'잘못된 요청입니다.'});
   let size=0,chunks=[];for await(const chunk of req){size+=chunk.length;if(size>20000000)throw Object.assign(new Error('사진 요청 크기가 너무 큽니다.'),{status:413});chunks.push(chunk);}let input;try{input=JSON.parse(Buffer.concat(chunks).toString());}catch{throw new Error('요청 형식 오류');}
   if(pathname==='/api/jobs')return send(202,await add(input));
   if(pathname==='/api/retry'){
    const j=jobs.get(input.id);if(!j||!['error','blocked'].includes(j.status))throw new Error('재시도할 요청이 없습니다.');
    let next=validateJob(j);next.hash=jobHash(next);
    if(cloud){
     const query=new URLSearchParams({kind:'eq.crevalue',id:'eq.'+j.id,deleted:'eq.false',select:'data,updated_at',limit:'1'});
     const read=await fetcher(config.url+'/rest/v1/cg_records?'+query,{headers:headers(),signal:AbortSignal.timeout(15000)});if(!read.ok)throw new Error('서버 요청 상태 확인 실패');
     const row=(await read.json())[0],remote=row?.data;
     if(!remote||remote.status==='completed'||(remote.status==='analyzing'&&remote.workerId!==workerId))throw new Error('이미 완료되었거나 다른 PC에서 처리 중인 요청입니다.');
     const canonical=validateJob(remote);if(jobHash(canonical)!==j.hash)throw new Error('서버와 사진·모프가 달라 재시도할 수 없습니다. 새 평가로 접수해 주세요.');next={...canonical,hash:jobHash(canonical)};
     query.delete('limit');query.set('select','id');query.set('updated_at','eq.'+row.updated_at);query.set('data->>status','eq.'+remote.status);if(remote.workerId)query.set('data->>workerId','eq.'+remote.workerId);if(remote.runId)query.set('data->>runId','eq.'+remote.runId);
     const reset=await fetcher(config.url+'/rest/v1/cg_records?'+query,{method:'PATCH',headers:{...headers(),Prefer:'return=representation'},body:JSON.stringify({data:next,updated_at:new Date().toISOString()}),signal:AbortSignal.timeout(15000)});
     if(!reset.ok||!(await reset.json()).length)throw new Error('요청 상태가 변경되었습니다. 다시 확인해 주세요.');
    }
    jobs.set(j.id,next);await persist();void work();return send(202,{id:next.id,status:next.status});
   }
   return send(404,{error:'Not found'});
  }catch(e){return send(e.status||400,{error:String(e.message||'요청 실패').slice(0,500)});}
 });
 await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(port,'127.0.0.1',resolve);});
 const timer=setInterval(()=>{void pollCloud();void work();},10000);void work();
 return {server,provider,jobs,add,work,pollCloud,close:async()=>{closed=true;clearInterval(timer);provider.close();await saving.catch(()=>{});await new Promise(r=>server.close(r));}};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const service=await createServer();console.log('CREVALUE 준비: http://127.0.0.1:4264 · 대표님 계정 로그인 후 사용');
 for(const sig of ['SIGTERM','SIGINT'])process.on(sig,()=>service.close().then(()=>process.exit(0)));
}
