const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

// Exercise the complete application with deterministic API replies. Browser QA
// separately verifies the visible page and embedded map against live services.
class Element {
  constructor(tag='div',text=''){this.tagName=tag;this.children=[];this.attrs={};this.style={};this.dataset={};this.hidden=false;this._text=text;this.classList={toggle(){},contains(){return false}}}
  set textContent(value){this._text=String(value);this.children=[]}
  get textContent(){return this._text+this.children.map(c=>c.textContent).join('')}
  append(...nodes){this.children.push(...nodes)}
  replaceChildren(...nodes){this._text='';this.children=[...nodes]}
  setAttribute(name,value){this.attrs[name]=String(value)}
  removeAttribute(name){delete this.attrs[name];if(name==='src'||name==='href')delete this[name]}
  querySelector(){return null}
  addEventListener(){}
  scrollIntoView(){}
}
function deferred(){let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b});return {promise,resolve,reject}}
function app(api){
  const nodes=new Map();
  const get=id=>{if(!nodes.has(id))nodes.set(id,new Element());return nodes.get(id)};
  const mapArea=get('maparea');
  const document={title:'',getElementById:get,createElement:tag=>new Element(tag),createTextNode:text=>new Element('#text',text),body:new Element('body'),querySelectorAll:()=>[],querySelector:selector=>selector==='.maparea'?mapArea:mapArea.children.find(e=>e.className==='mapfallback quiet')};
  class DOMParser {parseFromString(text){return {body:{textContent:text},querySelectorAll:selector=>selector==='h3,h4,h5,p,li'?[{textContent:text,querySelector(){return null}}]:[]}}}
  const context=vm.createContext({document,DOMParser,localStorage:{getItem(){return null},setItem(){}},URL,URLSearchParams,AbortController,setTimeout,clearTimeout});
  for(const file of ['places','features','app'])vm.runInContext(fs.readFileSync('dist/'+file+'.js','utf8'),context);
  context.api=api;
  return {get,run:code=>vm.runInContext(code,context)};
}
const places={
  'パリ':{pageid:31,title:'パリ',extract:'パリの概要',coordinates:[{lat:48.8566,lon:2.3522}],terms:{description:['フランスの首都']}},
  'イスタンブール':{pageid:19527,title:'イスタンブール',extract:'イスタンブールの概要',coordinates:[{lat:41.0136,lon:28.955}],terms:{description:['トルコの都市']}}
};
function reply(params){
  if(params.list==='search')return {query:{search:[{title:params.srsearch,snippet:'候補の紹介'}]}};
  if(params.action==='query')return {query:{pages:[places[params.titles]]}};
  if(params.prop==='sections')return {parse:{sections:[{line:'歴史',index:'1'}]}};
  if(params.prop==='text')return {parse:{text:params.page+'の歴史です。この都市にまつわる十分に長い説明文をここに表示します。'}};
  throw Error('Unexpected API request');
}
function consistent(a,title,lat,lon){
  assert.equal(a.get('place').hidden,false);
  assert.equal(a.get('results').hidden,true);
  assert.equal(a.get('placeTitle').textContent.trim(),title);
  assert.match(a.get('historyContent').textContent,new RegExp(title+'の歴史'));
  assert.match(a.get('overviewContent').textContent,new RegExp(title+'の概要'));
  assert.match(a.get('sources').textContent,new RegExp('Wikipedia｜'+title));
  assert.equal(new URL(a.get('mapFrame').src).searchParams.get('q'),lat+','+lon);
  assert.doesNotMatch(a.get('placeLinks').textContent,/Facebook|Instagram/);
  assert.doesNotMatch(a.get('exploreLinks').textContent,/ローマ|長野/);
  assert.equal(new URL(a.get('googleLink').href).searchParams.get('query'),lat+','+lon);
  assert.equal(new URL(a.get('routeLink').href).searchParams.get('destination'),lat+','+lon);
}
test('Exact city search replaces Rome history, overview, sources and map without a candidate click',async()=>{
  const gate=deferred();const a=app(p=>p.list==='search'?gate.promise:Promise.resolve(reply(p)));
  const task=a.run('search("パリ")');
  assert.equal(a.get('place').hidden,true);
  assert.equal(a.get('mapFrame').src,undefined);
  assert.equal(a.get('googleLink').href,undefined);
  gate.resolve(reply({list:'search',srsearch:'パリ'}));await task;
  consistent(a,'パリ',48.8566,2.3522);
});
test('Candidate lists do not leave the previous city below them; selecting a candidate updates the entire place',async()=>{
  const a=app(p=>Promise.resolve(p.list==='search'?{query:{search:[{title:'イスタンブール',snippet:'都市の候補'}]}}:reply(p)));
  await a.run('search("イスタン")');
  assert.equal(a.get('place').hidden,true);assert.equal(a.get('results').hidden,false);
  await a.get('candidates').children[0].onclick();consistent(a,'イスタンブール',41.0136,28.955);
});
test('Empty results and network failures do not restore the old Rome map',async()=>{
  for(const empty of [true,false]){
    const a=app(()=>empty?Promise.resolve({query:{search:[]}}):Promise.reject(Error('offline')));
    await a.run('search("見つからない都市")');assert.equal(a.get('place').hidden,true);assert.equal(a.get('mapFrame').src,undefined);
    assert.match(a.get('status').textContent,empty?/見つかりません/:/接続できません/);
  }
});
test('A late city reply cannot overwrite a newer selection',async()=>{
  const gate=deferred();const a=app(p=>p.action==='query'&&p.titles==='パリ'?gate.promise:Promise.resolve(reply(p)));
  const old=a.run('loadPlace("パリ")');await a.run('loadPlace("イスタンブール")');
  gate.resolve(reply({action:'query',titles:'パリ'}));await old;consistent(a,'イスタンブール',41.0136,28.955);
});
test('A failed article load leaves no previous city content visible',async()=>{
  const a=app(()=>Promise.reject(Error('offline')));await a.run('loadPlace("パリ")');
  assert.equal(a.get('place').hidden,true);assert.equal(a.get('mapFrame').src,undefined);assert.match(a.get('status').textContent,/資料を取得できません/);
});
test('Chronology sorts centuries by their beginning and excludes heading-only dates',()=>{
  const a=app(()=>Promise.reject(Error('offline')));
  assert.equal(a.run('dateKey("14世紀初頭のパリの人口についての記録").key'),1301);
  assert.equal(a.run('dateKey("紀元前753年 建国伝承についての記録").key'),-753);
  assert.equal(a.run('dateKey("19世紀")'),null);
  assert.deepEqual(JSON.parse(a.run('JSON.stringify(timelineFromHistory(["1594年、首都を回復。","16世紀後半、宗教戦争。","14世紀初頭の人口。","1328年、王朝の断絶。"]).map(x=>x[0]))')),['14世紀','1328年','16世紀','1594年']);
});
test('A stale enrichment response cannot replace the newer city or its related sections',async()=>{
  const gate=deferred();const a=app(p=>p.generator==='geosearch'&&p.ggscoord.startsWith('48.')?gate.promise:Promise.resolve(reply(p)));
  const old=a.run('loadPlace("パリ")');
  // Drain the already-resolved article and history requests until enrichment awaits.
  for(let i=0;i<12;i++)await Promise.resolve();
  await a.run('loadPlace("長野市")');gate.resolve({query:{pages:[]}});await old;
  assert.match(a.get('placeTitle').textContent,/長野市/);
  assert.match(a.get('landmarks').textContent,/善光寺/);
  assert.doesNotMatch(a.get('placeLinks').textContent,/Facebook|Instagram/);
  assert.equal(new URL(a.get('mapFrame').src).searchParams.get('q'),'36.6486,138.1948');
});
