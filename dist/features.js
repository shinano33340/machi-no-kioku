'use strict';
let mapProvider = 'google';
let selectedMapPlace;
function safeURL(value) {
  try { const u = new URL(value); return ['http:','https:'].includes(u.protocol) ? u.href : null; } catch { return null; }
}
function link(label,url,cls) {
  const a=el('a',label,cls); a.href=safeURL(url)||'#'; a.target='_blank'; a.rel='noopener noreferrer'; return a;
}
function dateKey(text) {
  const s=text.normalize('NFKC').replace(/^\s*[・●]\s*/,'');
  const match=s.match(/^(紀元前\s*)?(\d{1,4})\s*(年|世紀)/);
  if(!match) return null;
  const number=Number(match[2]);
  let key=match[3]==='世紀'?(match[1]?-number*100:(number-1)*100+1):(match[1]?-number:number);
  if(match[3]==='世紀'&&!match[1]){const suffix=s.slice(match[0].length);if(/^末/.test(suffix))key+=75;else if(/^後半/.test(suffix))key+=50;}
  if(s.slice(match[0].length).trim().length<3)return null;
  return {key,label:match[0]};
}
function timelineFromHistory(history) {
  return history.map((text,index)=>({text,index,date:dateKey(text)})).filter(x=>x.date)
    .sort((a,b)=>a.date.key-b.date.key||a.index-b.index)
    .map(x=>[x.date.label,'その年・時代の記録',x.text]);
}
function claimValue(claim) { return claim?.mainsnak?.datavalue?.value; }
function activeClaims(claims,id) {
  const valid=(claims[id]||[]).filter(c=>c.rank!=='deprecated'&&!c.qualifiers?.P582&&claimValue(c)!==undefined);
  const preferred=valid.filter(c=>c.rank==='preferred'); return preferred.length?preferred:valid;
}
function recentClaim(claims,id) {
  return activeClaims(claims,id).sort((a,b)=>String(b.qualifiers?.P585?.[0]?.datavalue?.value?.time||'').localeCompare(String(a.qualifiers?.P585?.[0]?.datavalue?.value?.time||'')))[0];
}
async function enrichPlace(p,entityId) {
  p.events=timelineFromHistory(p.history||[]);
  p.facts=[]; p.social=[]; p.landmarks=[];
  await Promise.allSettled([loadFacts(p,entityId),loadLandmarks(p)]);
}
async function loadFacts(p,entityId) {
  if(!entityId) return;
  const wd=await api({action:'wbgetentities',ids:entityId,props:'claims'},'https://www.wikidata.org/w/api.php');
  const claims=wd.entities?.[entityId]?.claims||{};
  const fields=[['国','P17'],['行政区分','P131'],['首都','P36'],['公用語','P37'],['通貨','P38']];
  const ids=[...new Set(fields.flatMap(([,id])=>activeClaims(claims,id).map(c=>claimValue(c)?.id)).filter(Boolean))];
  let entities={};
  if(ids.length){const data=await api({action:'wbgetentities',ids:ids.join('|'),props:'labels',languages:'ja|en',languagefallback:'1'},'https://www.wikidata.org/w/api.php');entities=data.entities||{};}
  for(const [label,id] of fields){const labels=activeClaims(claims,id).map(c=>{const e=entities[claimValue(c)?.id];return e?.labels?.ja?.value||e?.labels?.en?.value}).filter(Boolean);if(labels.length)p.facts.push([label,[...new Set(labels)].join('、')]);}
  const pop=recentClaim(claims,'P1082'); const value=claimValue(pop);
  if(value?.amount){const time=pop.qualifiers?.P585?.[0]?.datavalue?.value?.time; const year=time?.match(/\+(\d{4})/)?.[1];p.facts.push(['人口（資料値）',Number(value.amount).toLocaleString('ja-JP')+'人'+(year?'（'+year+'年）':'（基準年不明）')]);}
  const website=claimValue(activeClaims(claims,'P856')[0]);if(safeURL(website))p.official=website;
  for(const [name,id,prefix] of [['Facebook','P2013','https://www.facebook.com/'],['Instagram','P2003','https://www.instagram.com/'],['X','P2002','https://x.com/'],['YouTube','P2397','https://www.youtube.com/channel/'],['LinkedIn','P4264','https://www.linkedin.com/company/']]){
    const handle=claimValue(activeClaims(claims,id)[0]);if(typeof handle==='string'&&handle)p.social.push([name,prefix+encodeURIComponent(handle)]);
  }
  p.factSource='https://www.wikidata.org/wiki/'+entityId;
  p.socialSource=p.factSource;
}
async function loadLandmarks(p) {
  if(!mapLocation(p).hasCoordinates||p.country)return;
  const data=await api({action:'query',generator:'geosearch',ggscoord:p.lat+'|'+p.lon,ggsradius:'10000',ggslimit:'30',ggsnamespace:'0',prop:'extracts|coordinates',exintro:'1',explaintext:'1',exsentences:'2',exlimit:'max',colimit:'1'});
  p.landmarks=(data.query?.pages||[]).filter(x=>x.title!==p.title&&x.coordinates?.length&&/遺跡|城跡|神社|寺院|歴史|古代|記念|宮殿|博物館|大聖堂|世界遺産/.test(x.extract||''))
    .slice(0,8).map(x=>({title:x.title,text:x.extract,period:'周辺の歴史・文化資料',lat:x.coordinates[0].lat,lon:x.coordinates[0].lon,source:'https://ja.wikipedia.org/?curid='+x.pageid}));
}
function updateMap(p, landmark) {
  selectedMapPlace=landmark||null;
  const loc=mapLocation(landmark||p); const target=landmark?.query||loc.target;
  const label=landmark?.title||p.title;
  $('mapLabel').textContent=label+(landmark?'':'の代表地点付近');
  const frame=$('mapFrame');frame.title=label+'の周辺地図';frame.hidden=false;
  if(mapProvider==='google')frame.src='https://www.google.com/maps?q='+encodeURIComponent(target)+'&z='+(landmark?15:p.country?4:12)+'&output=embed';
  else if(loc.hasCoordinates)frame.src='/map.html?lat='+(landmark||p).lat+'&lon='+(landmark||p).lon+'&zoom='+(p.country&&!landmark?4:12);
  else {frame.hidden=true;frame.removeAttribute('src');}
  $('googleLink').href='https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(target);
  $('googleLink').textContent='Googleマップで開く ↗';$('googleLink').setAttribute('aria-label',label+'をGoogleマップで開く');
  $('routeLink').href='https://www.google.com/maps/dir/?api=1&destination='+encodeURIComponent(target);
  $('routeLink').setAttribute('aria-label',label+'への行き方を調べる');
  const fallback=document.querySelector('.mapfallback');if(fallback)fallback.hidden=!frame.hidden;
  $('googleMapButton').setAttribute('aria-pressed',String(mapProvider==='google'));
  $('osmMapButton').setAttribute('aria-pressed',String(mapProvider==='osm'));
  $('resetMapButton').disabled=!landmark;
  for(const b of document.querySelectorAll('.landmark-map'))b.setAttribute('aria-pressed',String(b.dataset.title===landmark?.title));
}
function renderExtra(p) {
  const nav=$('placeLinks');nav.replaceChildren();
  if(p.official)nav.append(link('公式サイト ↗',p.official,'official-link'));
  for(const [label,url] of p.social||[])nav.append(link(label+' ↗',url,'social-link'));
  if(p.social?.length)nav.append(link('SNSの出典',p.socialSource,'quiet'));
  if(!p.social?.length)nav.append(el('span','公式SNSリンクは未登録です。','quiet'));
  const facts=el('dl',undefined,'facts');
  const rows=[['名称',p.title],...(p.facts||[])];
  if(p.subtitle)rows.push(['地域の説明',p.subtitle]);
  if(mapLocation(p).hasCoordinates)rows.push(['代表座標',p.lat.toFixed(4)+', '+p.lon.toFixed(4)]);
  for(const [label,value] of rows){const row=el('div');row.append(el('dt',label),el('dd',value));facts.append(row);}
  $('overviewContent').append(facts);
  $('overviewContent').append(el('p','情報の取得・確認日：'+new Date().toLocaleDateString('ja-JP')+'。人口などの統計は記載された基準年の値です。未登録の項目は表示していません。','quiet'));
  if(p.factSource)$('overviewContent').append(link('基本情報の出典：Wikidata ↗',p.factSource,'quiet'));
  const cards=$('landmarks');cards.replaceChildren();
  $('landmarkNote').textContent=p.landmarks?.length?'「地図で見る」を押すと、この土地の地図がその場所に切り替わります。表示するのは現在の地図です。':'史跡資料はまだ登録されていないか、取得できませんでした。下のボタンから周辺の歴史的な場所を探せます。';
  for(const item of p.landmarks||[]){const card=el('article',undefined,'landmark-card');card.append(el('small',item.period||'歴史の舞台'),el('h3',item.title),el('p',item.text));const button=el('button','地図で見る →','landmark-map');button.dataset.title=item.title;button.setAttribute('aria-pressed','false');button.onclick=()=>{updateMap(p,item);$('mapFrame').scrollIntoView({behavior:'smooth',block:'center'})};card.append(button,link('資料を読む ↗',item.source,'quiet'));cards.append(card);}
  if(!p.landmarks?.length)cards.append(link('周辺の史跡をGoogleマップで探す ↗','https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(p.title+' 史跡'),'outline'));
  const explore=$('exploreLinks');explore.replaceChildren();
  const links=p.explore||[['史跡と建物','この地域の歴史的な場所を探す','https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(p.title+' 史跡')],['博物館','周辺の資料館や博物館を探す','https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(p.title+' 博物館')],['歴史資料','Wikipediaの原文・参考文献',p.sources?.[0]?.[1]||'https://ja.wikipedia.org/']];
  for(const [title,description,url] of links){const a=link('',url,'explore-card');a.append(el('strong',title+' ↗'),el('span',description));explore.append(a);}
  updateMap(p);
}
