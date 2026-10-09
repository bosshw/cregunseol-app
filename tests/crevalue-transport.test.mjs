import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
import {createWorkerClient,WORKER_ORIGIN} from '../src/crevalue/transport.js';

test('PC client opens on user action and accepts only its exact window and origin',async()=>{
 let receive,lastMessage,opened=0,ensured=0,settled=false;
 const popup={closed:false,postMessage(message,origin){assert.equal(origin,WORKER_ORIGIN);lastMessage=message;}};
 const win={addEventListener(_,fn){receive=fn;},removeEventListener(){},open(url){opened++;assert.equal(url,WORKER_ORIGIN+'/crevalue-connect.html');return popup;}};
 const client=createWorkerClient({ensure:async()=>{ensured++;},token:()=> 'synthetic-token'},win,()=>{throw Error('Unexpected direct request');});
 assert.equal(opened,0);const opening=client.open();receive({origin:WORKER_ORIGIN,source:popup,data:{type:'crevalue:ready'}});await opening;
 const request=client.request('status').then(r=>{settled=true;return r;});await Promise.resolve();await Promise.resolve();
 assert.equal(ensured,1);assert.equal(lastMessage.token,'synthetic-token');const id=lastMessage.id;
 receive({origin:'https://attacker.invalid',source:popup,data:{type:'crevalue:response',id,data:{bad:true}}});
 receive({origin:WORKER_ORIGIN,source:{},data:{type:'crevalue:response',id,data:{bad:true}}});await Promise.resolve();assert.equal(settled,false);
 receive({origin:WORKER_ORIGIN,source:popup,data:{type:'crevalue:response',id,data:{connected:true}}});assert.deepEqual(await request,{connected:true});
 await assert.rejects(()=>client.request('../health'));client.dispose();
});
test('blocked PC popup is a recoverable error and never sends credentials',()=>{
 const client=createWorkerClient({token(){throw Error('Must not access credentials');}},{addEventListener(){},removeEventListener(){},open(){return null;}});
 assert.throws(()=>client.open(),/PC 연결 창/);client.dispose();
});
test('explicit reconnection reloads the PC page and independent clients use separate windows',async()=>{
 function fixture(){let receive;const opened=[];const popup={closed:false,postMessage(){}};const win={addEventListener(_,fn){receive=fn;},removeEventListener(){},open(url,name){opened.push({url,name});return popup;}};return {client:createWorkerClient({},win),opened,ready(){receive({origin:WORKER_ORIGIN,source:popup,data:{type:'crevalue:ready'}});}};}
 const a=fixture(),b=fixture();let opening=a.client.open();a.ready();await opening;
 opening=a.client.open();assert.equal(a.opened.length,2);a.ready();await opening;
 opening=b.client.open();b.ready();await opening;
 assert.equal(a.opened[0].name,a.opened[1].name);assert.notEqual(a.opened[0].name,b.opened[0].name);a.client.dispose();b.client.dispose();
});
test('PC page rejects unrelated senders and arbitrary routes, and authenticates valid requests',async()=>{
 const code=await readFile(new URL('../crevalue-connect.js',import.meta.url),'utf8');let listener;const calls=[],replies=[];const parent={postMessage:(message,origin)=>replies.push({message,origin}),focus(){}};
 const elements={'connection-status':{textContent:''},'return-to-app':{addEventListener(){}}};
 vm.runInNewContext(code,{window:{opener:parent,addEventListener:(_,fn)=>{listener=fn;}},document:{getElementById:id=>elements[id]},AbortSignal,fetch:async(url,options)=>{calls.push({url,options});return {ok:true,json:async()=>({quota:{message:'합성 시험'},connected:true})};}});
 const message={type:'crevalue:request',id:'test-id',route:'status',token:'synthetic-token'};
 await listener({origin:'https://attacker.invalid',source:parent,data:message});
 await listener({origin:'https://bosshw.github.io',source:{},data:message});
 await listener({origin:'https://bosshw.github.io',source:parent,data:{...message,route:'../health'}});assert.equal(calls.length,0);
 await listener({origin:'https://bosshw.github.io',source:parent,data:message});assert.equal(calls.length,1);assert.equal(calls[0].url,'/api/status');assert.equal(calls[0].options.headers.Authorization,'Bearer synthetic-token');
 assert.equal(replies.at(-1).origin,'https://bosshw.github.io');assert.equal(replies.at(-1).message.data.connected,true);assert.ok(!JSON.stringify(replies).includes('synthetic-token'));
});
test('reconnecting rejects old requests before they can invalidate the new connection',async()=>{
 let receive;const popup={closed:false,postMessage(){}};const win={addEventListener(_,fn){receive=fn;},removeEventListener(){},open(){return popup;}};
 const client=createWorkerClient({ensure:async()=>{},token:()=> 'synthetic-token'},win);let opening=client.open();receive({origin:WORKER_ORIGIN,source:popup,data:{type:'crevalue:ready'}});await opening;
 const pending=client.request('status');const rejected=assert.rejects(pending,/다시 설정/);await Promise.resolve();await Promise.resolve();
 opening=client.open();await rejected;receive({origin:WORKER_ORIGIN,source:popup,data:{type:'crevalue:ready'}});await opening;client.dispose();
});
test('local app connection uses direct authenticated requests without opening a popup',async()=>{
 let calls=0;const win={location:{origin:WORKER_ORIGIN},addEventListener(){},removeEventListener(){},open(){throw Error('Must not open a popup');}};
 const client=createWorkerClient({ensure:async()=>{},token:()=> 'synthetic-token'},win,async(url,options)=>{calls++;assert.equal(url,WORKER_ORIGIN+'/api/status');assert.equal(options.headers.Authorization,'Bearer synthetic-token');return {ok:true,json:async()=>({connected:true})};});
 await client.open();assert.equal((await client.request('status')).connected,true);assert.equal(calls,1);client.dispose();
});
