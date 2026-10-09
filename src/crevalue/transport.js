export const WORKER_ORIGIN='http://127.0.0.1:4264';
// The user-opened PC page relays only authenticated, allowlisted worker routes.
// Tokens stay in memory; never put them in URLs, browser storage or logs.
export function createWorkerClient(bridge,win=window,fetcher=fetch){
 let popup=null,ready=false,opening=null,disposed=false;
 const popupName='crevalue-pc-'+crypto.randomUUID();
 const pending=new Map();
 const receive=event=>{
  if(event.origin!==WORKER_ORIGIN||event.source!==popup||!event.data)return;
  const m=event.data;
  if(m.type==='crevalue:ready'){ready=true;return;}
  if(m.type!=='crevalue:response'||!pending.has(m.id))return;
  const item=pending.get(m.id);pending.delete(m.id);clearTimeout(item.timer);
  m.error?item.reject(new Error(m.error)):item.resolve(m.data);
 };
 win.addEventListener('message',receive);
 function open(){
  if(disposed)throw new Error('PC 연결 화면을 다시 열어 주세요.');
  if([WORKER_ORIGIN,'http://localhost:4264'].includes(win.location?.origin))return Promise.resolve();
  if(opening)return opening;
  for(const item of pending.values()){clearTimeout(item.timer);item.reject(new Error('PC 연결을 다시 설정하고 있습니다.'));}pending.clear();
  ready=false;popup=win.open(WORKER_ORIGIN+'/crevalue-connect.html',popupName);
  if(!popup)throw new Error('PC 연결 창을 열 수 없습니다. 팝업 허용 후 다시 눌러 주세요.');
  opening=new Promise((resolve,reject)=>{
   const began=Date.now();const timer=setInterval(()=>{
    if(ready){clearInterval(timer);opening=null;resolve();return;}
    if(disposed||popup.closed||Date.now()-began>12000){clearInterval(timer);opening=null;reject(new Error('PC 연결 창이 준비되지 않았습니다. 크레밸류 실행을 먼저 열어 주세요.'));return;}
    popup.postMessage({type:'crevalue:hello'},WORKER_ORIGIN);
   },100);
  });return opening;
 }
 async function request(route,body){
  if(!['status','jobs','retry'].includes(route))throw new Error('지원하지 않는 PC 요청입니다.');
  await bridge.ensure();
  if(disposed)throw new Error('PC 연결 화면을 다시 열어 주세요.');
  if(popup&&!popup.closed&&ready){
   const id=crypto.randomUUID();return new Promise((resolve,reject)=>{
    const timer=setTimeout(()=>{ready=false;pending.delete(id);reject(new Error('PC 응답 시간이 초과되었습니다. 연결을 다시 확인해 주세요.'));},35000);
    pending.set(id,{resolve,reject,timer});
    popup.postMessage({type:'crevalue:request',id,route,token:bridge.token(),...(body?{body}:{})},WORKER_ORIGIN);
   });
  }
  const response=await fetcher(WORKER_ORIGIN+'/api/'+route,{method:body?'POST':'GET',headers:{Authorization:'Bearer '+bridge.token(),'Content-Type':'application/json','X-Crevalue-Request':'1'},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(12000)});
  const result=await response.json();if(!response.ok)throw new Error(result.error||'PC 연결 오류');return result;
 }
 return {open,request,dispose(){disposed=true;win.removeEventListener('message',receive);for(const p of pending.values()){clearTimeout(p.timer);p.reject(new Error('PC 연결 화면이 닫혔습니다.'));}pending.clear();}};
}
