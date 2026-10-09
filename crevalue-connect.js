const APP_ORIGIN='https://bosshw.github.io';
const parentWindow=window.opener;
const status=document.getElementById('connection-status');
const reply=message=>parentWindow?.postMessage(message,APP_ORIGIN);
window.addEventListener('message',async event=>{
 if(event.origin!==APP_ORIGIN||event.source!==parentWindow||!parentWindow||!event.data)return;
 const m=event.data;
 if(m.type==='crevalue:hello'){reply({type:'crevalue:ready'});return;}
 if(m.type!=='crevalue:request'||typeof m.id!=='string'||m.id.length>80||!['status','jobs','retry'].includes(m.route)||typeof m.token!=='string'||m.token.length>10000)return;
 try{
  const r=await fetch('/api/'+m.route,{method:m.body?'POST':'GET',headers:{Authorization:'Bearer '+m.token,'Content-Type':'application/json','X-Crevalue-Request':'1'},...(m.body?{body:JSON.stringify(m.body)}:{}),signal:AbortSignal.timeout(30000)});
  const data=await r.json();if(!r.ok)throw new Error(data.error||'PC 연결 오류');
  status.textContent=m.route==='status'?'연결되었습니다. '+data.quota.message:'사진 분석 요청을 전달했습니다.';
  reply({type:'crevalue:response',id:m.id,data});
 }catch(e){status.textContent='연결을 확인해 주세요. '+e.message;reply({type:'crevalue:response',id:m.id,error:String(e.message).slice(0,300)});}
});
document.getElementById('return-to-app').addEventListener('click',()=>parentWindow?.focus());
if(parentWindow)reply({type:'crevalue:ready'});else status.textContent='브리딩비서의 “PC 연결·사용 한도 확인” 버튼에서 이 창을 열어 주세요.';
