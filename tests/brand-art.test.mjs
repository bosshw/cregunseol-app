import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';
import test from 'node:test';
const root=new URL('../',import.meta.url);
const read=name=>fs.readFile(new URL(name,root),'utf8');
async function artContext(){const ctx={window:{}};vm.createContext(ctx);vm.runInContext(await read('brand-art.js'),ctx);return ctx;}

test('renders mixed emoji strings without rewriting the source text or losing variation selectors',async()=>{
 const {window:{CREG_ART:art}}=await artContext();
 const text='크한이 😊 좋아요 · ⚠️ 확인\n📷 사진 · 🐣 해칭';
 const pieces=art.parts(text);
 assert.equal(pieces.map(p=>typeof p==='string'?p:p.symbol).join(''),text);
 assert.deepEqual(Array.from(pieces.filter(p=>p.id),p=>p.id),['good','warning','photo','hatch']);
 assert.equal(art.parts('원본 이름 <script> & 12g'),null);
 assert.equal(art.parts('⚠️')[0].symbol,'⚠️');
 assert.equal(art.plain('🥚 산란'),' 산란');
 assert.equal(art.plain('🐣'),'해칭');
});

test('JSX adapter preserves form values and native options while rendering nested content',async()=>{
 const ctx=await artContext();
 ctx.React={createElement:(type,props,...children)=>({type,props,children}),Fragment:()=>null};
 const source=await read('src/app.jsx');
 vm.runInContext(source.slice(0,source.indexOf('function BrandIcon')),ctx);
 const input=ctx.BrandElement('input',{value:'😊 원문',placeholder:'직접 입력'});
 assert.equal(input.props.value,'😊 원문');
 const option=ctx.BrandElement('option',{value:'hatching'},'🐣 해칭');
 assert.equal(option.props.value,'hatching');
 assert.equal(option.children.flat(Infinity).join(''),' 해칭');
 const el=ctx.BrandElement('div',null,['기록 ',['😊',' 📷']]);
 const images=el.children.flat(Infinity).filter(x=>x?.type==='img');
 assert.deepEqual(images.map(x=>x.props['data-art']),['good','photo']);
 const frag=ctx.BrandElement(ctx.React.Fragment,null,'😟');
 assert.equal(frag.children.flat(Infinity)[0].props['data-art'],'down');
});

test('every mapped artwork exists and is precached, including transparent avatar and Krhan expressions',async()=>{
 const {window:{CREG_ART:art}}=await artContext();
 const worker=await read('sw.js');
 for(const [id]of Object.values(art.map)){
  const asset=art.url(id);await fs.access(new URL(asset,root));assert.ok(worker.includes("'"+asset+"'"),asset);
 }
 for(const id of ['gecko','hatch','good','normal','down','sad']){
  const bytes=await fs.readFile(new URL(art.url(id),root));assert.equal(bytes.toString('ascii',8,12),'WEBP');
  // Lossless WebP alpha bit in VP8L, or alpha in extended VP8X, must be set.
  const chunk=bytes.toString('ascii',12,16);
  assert.ok(chunk==='VP8L' ? Boolean(bytes[24]&16) : chunk==='VP8X'&&Boolean(bytes[20]&16),`${id} alpha`);
 }
 assert.ok(worker.includes("'./brand-art.js'"));assert.ok(worker.includes("'./brand-art.css'"));
 const html=await read('index.html');
 assert.ok(html.indexOf('brand-art.js')<html.indexOf('app.min.js'));
 assert.match(await read('g.html'),/CREG_ART\.decorate\(app\)/);
});

test('service worker returns the installed character asset when network is offline',async()=>{
 const listeners={};const saved=new Map();const origin='https://example.test';
 const key=x=>new URL(typeof x==='string'?x:x.url,origin+'/').href;
 const caches={open:async()=>({add:async u=>{saved.set(key(u),new Response('cached-art'));},put:async(u,v)=>saved.set(key(u),v)}),match:async u=>saved.get(key(u))};
 const ctx={self:{location:{origin},addEventListener:(n,f)=>listeners[n]=f,skipWaiting:()=>{}},caches,URL,fetch:async()=>{throw Error('offline');}};
 vm.createContext(ctx);vm.runInContext(await read('sw.js'),ctx);
 let install;listeners.install({waitUntil:p=>install=p});await install;
 let response;listeners.fetch({request:{method:'GET',url:origin+'/assets/brand/good.webp'},respondWith:p=>response=p});
 assert.equal(await(await response).text(),'cached-art');
 let intercepted=false;listeners.fetch({request:{method:'GET',url:origin+'/version.json'},respondWith:()=>intercepted=true});assert.equal(intercepted,false);
});
