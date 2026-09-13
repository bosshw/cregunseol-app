/* Brand artwork only changes rendered presentation, never stored values. */
(function (global) {
 'use strict';
 const map = {"🦎":["gecko","개체·비서"],"🐣":["hatch","해칭"],"🥚":["egg","산란·알"],"📏":["growth","성장·몸무게"],"💞":["mating","메이팅"],"🤝":["distribution","분양 완료"],"🌿":["shed","탈피"],"🍽":["feeding","먹이 기록"],"🦗":["insect","충식"],"🥣":["bowl","슈푸"],"⚠":["warning","주의·건강 이상"],"🌤":["condition","컨디션"],"🌙":["season","산란 시즌·휴식"],"🌡":["environment","온습도"],"📷":["photo","사진"],"📸":["photo","사진 첨부"],"📝":["memo","메모"],"🧬":["dna","모프·유전"],"👪":["lineage","부모·혈통"],"🌳":["lineage","공유 기록 혈통"],"🎂":["birthday","생일"],"♀":["female","암컷"],"♂":["male","수컷"],"🏠":["home","축양·홈"],"🏷":["price","분양 가능·가격"],"📌":["pin","예약·고정"],"🌈":["memorial","무지개다리"],"😊":["good","좋아요"],"🙂":["good","긍정 응답"],"😐":["normal","보통"],"😟":["down","처져요"],"😥":["sad","걱정 응답"],"😢":["sad","슬픔·이상"],"🚨":["urgent","긴급 확인"],"☀":["sun","주간 컨디션"],"⭐":["favorite","즐겨찾기"],"🔒":["lock","KEEP"],"🎯":["target","목표·선택"],"⏭":["skip","건너뛰기"],"🚫":["fasting","금식·제외"],"⛔":["blocked","불가"],"🎁":["gift","선물 분양"],"💬":["chat","대화·기록 시작"],"🔍":["search","검색"],"✍":["edit","작성"],"✏":["edit","수정"],"📋":["briefing","브리핑·기록 목록"],"↕":["sort","정렬"],"🗑":["delete","삭제"],"📅":["calendar","캘린더"],"🗓":["calendar","날짜 선택"],"💾":["save","기록 저장"],"🧹":["clean","대화 정리"],"🔔":["bell","알림"],"📖":["book","공유 기록 이력"],"💰":["income","수입·가계부"],"💸":["expense","지출"],"🗂":["archive","자료 정리"],"📥":["import","담기·복원"],"✨":["sparkle","완료·축하"],"✅":["done","확인·성공"],"📊":["chart","엑셀·통계"],"📦":["backup","백업"],"📈":["trend","성장 그래프"],"🙏":["thanks","감사 응답"],"👏":["applause","격려 응답"],"🔗":["link","기록 공유·링크"],"🔄":["sync","동기화"],"⬇":["download","다운로드"],"🔀":["merge","병합"],"☁":["cloud","서버 상태"],"📧":["email","이메일"],"📱":["mobile","기기"],"🎨":["theme","색상 테마"],"⚙":["settings","설정"],"🗣":["voice","비서 말투"],"☆":["starOutline","즐겨찾기"],"⚥":["unknown","성별 미구분"]};
 Object.assign(map,{'✕':['close','닫기'],'＋':['plus','추가'],'→':['next','다음'],'←':['back','뒤로'],'‹':['back','이전'],'›':['next','다음']});
 const raster = new Set(['gecko','hatch','good','normal','down','sad']);
 const re = new RegExp('(' + Object.keys(map).sort((a,b)=>b.length-a.length).join('|') + ')\uFE0F?', 'gu');
 const skip = new Set(['option','optgroup','textarea','input','select','script','style','svg','text','tspan','title','desc','code','pre']);
 const url = id => './assets/brand/' + (id === 'gecko' ? 'gecko-transparent' : id) + (raster.has(id) ? '.webp' : '.svg');
 function parts(value) {
   if (typeof value !== 'string') return null;
   re.lastIndex=0; let m,last=0; const result=[];
   while((m=re.exec(value))){ if(m.index>last)result.push(value.slice(last,m.index)); const [id,label]=map[m[1]]; result.push({id,label,symbol:m[0]});last=m.index+m[0].length; }
   if(!result.length)return null; if(last<value.length)result.push(value.slice(last));return result;
 }
 function props(id,label,symbol) { return {src:url(id),className:'brand-icon'+(raster.has(id)?' brand-character':''),alt:symbol||'',title:label,draggable:false,decoding:'async','data-art':id}; }
 function children(value, create) {
   if(Array.isArray(value))return value.map(v=>children(v,create));
   const items=parts(value);if(!items)return value;
   return items.map((item,i)=>typeof item==='string'?item:create('img',{...props(item.id,item.label,item.symbol),key:'art-'+i}));
 }
 // Shared page has no virtual DOM. Convert text nodes once after rendering, never innerHTML strings.
 function decorate(root) {
   const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);const pending=[];let n;
   while((n=walker.nextNode())){if(!n.parentElement||n.parentElement.closest('svg,option,optgroup,select,input,textarea,script,style,code,pre'))continue;const items=parts(n.nodeValue);if(items)pending.push([n,items]);}
   pending.forEach(([text,items])=>{const fragment=document.createDocumentFragment();items.forEach(item=>{if(typeof item==='string'){fragment.appendChild(document.createTextNode(item));return;}const im=document.createElement('img');const a=props(item.id,item.label,item.symbol);im.src=a.src;im.className=a.className;im.alt=a.alt;im.title=a.title;im.draggable=false;im.dataset.art=item.id;fragment.appendChild(im);});text.replaceWith(fragment);});
 }
 function plain(value) {
   if(Array.isArray(value))return value.map(plain);
   const items=parts(value);if(!items)return value;
   const text=items.filter(x=>typeof x==='string').join('');
   return text.trim()?text:items.map(x=>typeof x==='string'?x:x.label).join('');
 }
 global.CREG_ART={map,url,parts,children,decorate,skip,plain};
})(window);
