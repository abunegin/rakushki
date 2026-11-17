// Run with: node tests/model.test.cjs
const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const html=fs.readFileSync(__dirname+'/../index.html','utf8');
const js=html.match(/<script>\s*([\s\S]*?)<\/script>/)[1];new vm.Script(js);
const db={};const c={window:{},location:{hash:'',origin:'https://abunegin.github.io',pathname:'/rakushki/'},URLSearchParams,localStorage:{getItem:k=>db[k]||null,setItem:(k,v)=>db[k]=v}};
vm.createContext(c);
vm.runInContext(js.slice(js.indexOf('var TOP'),js.indexOf('/* ---------- отрисовка'))+js.slice(js.indexOf('var cur=0,done='),js.indexOf('function rulersHtml'))+js.slice(js.indexOf('function starPoints'),js.indexOf('function itemPath')),c);
const run=code=>vm.runInContext(code,c);
run('build()');assert.equal(c.M.big,291);assert.equal(c.M.small,209);assert.equal(c.M.maxLen,892);
const original=JSON.stringify(c.M);run('build()');assert.equal(JSON.stringify(c.M),original);
run('done.add(1);shellCounts[1]=2;cur=2;saveProgress();P.paperPalette="rose";P.tone="pink";build()');assert(c.done.has(1));assert.equal(c.cur,2);
let count=0;
for(const mode of ['off','separate','mixed','only'])for(const shapes of ['both','circles','stars'])for(const layers of [1,2,3])for(const size of [20,35,60])for(const h of [30,100,200])for(const gap of [0,40])for(const n of [4,40])for(const percent of [10,70]){
 c.P={...c.DEF,paperMode:mode,paperShapes:shapes,paperSize:size,paperPercent:percent,paperGap:count%2?20:140,layers,h,gap,n:n,w:40,minlen:15,jitter:40};run('build()');
 const m=c.M;assert.equal(m.strands.length,c.P.n*layers-(layers>1?1:0));let big=0,small=0,stars=0,circles=0;
 for(const s of m.strands){assert(s.items.length);assert(s.len<=h*10);assert(s.x>0&&s.x<m.Wmm);if(mode==='separate')assert(s.paperCount===0||s.paperCount===s.items.length);
  s.items.forEach((it,i)=>{assert(it.y-it.d/2>=15);if(it.kind==='paper'){assert.equal(it.d,size);if(it.shape==='star')stars++;else circles++;if(shapes==='stars')assert.equal(it.shape,'star');if(shapes==='circles')assert.equal(it.shape,'circle')}else{assert([15,40].includes(it.d));if(it.d===40)big++;else small++}if(i){const prev=s.items[i-1],distance=it.y-it.d/2-prev.y-prev.d/2;assert.equal(distance,it.kind==='paper'||prev.kind==='paper'?(mode==='only'?c.P.paperGap:Math.max(gap,c.P.paperGap)):gap)}});
  assert.equal(s.len,s.items.at(-1).y+s.items.at(-1).d/2);
 }
 assert.equal(big,m.big);assert.equal(small,m.small);assert.equal(stars,m.stars);assert.equal(circles,m.circles);assert.equal(m.paper,stars+circles);if(mode==='only'){assert.equal(m.big+m.small,0);assert(m.paper>0)}if(mode==='off')assert.equal(m.paper,0);if(mode==='separate')assert(m.paper>0);count++;
}
c.P={...c.DEF,paperMode:'mixed'};run('build();done.add(2);cur=1;saveProgress();P.paperPalette="sage";P.tone="cream";build()');assert(c.done.has(2));assert.equal(c.cur,1);run('P.paperSize=60;build()');assert.equal(c.done.size,0);run('P.paperSize=35;build()');assert(c.done.has(2));
c.location.hash='#v=1&w=90&h=100';assert.equal(run('sharedParams()').paperMode,'off');
c.location.hash='#v=1&paperMode=mixed&paperSize=999&paperPalette=garbage&paperPercent=NaN';const validated=run('sharedParams()');assert.equal(validated.paperSize,60);assert.equal(validated.paperPalette,'auto');assert.equal(validated.paperPercent,30);
const points=run('starPoints()');assert(Math.abs(Math.max(...points.map(p=>p.y))-Math.min(...points.map(p=>p.y))-1)<1e-12);assert(Math.abs(Math.max(...points.map(p=>p.x))-Math.min(...points.map(p=>p.x))-1)<1e-12);

console.log('PASS: '+count+' models; legacy default, deterministic geometry, all materials and shapes, sizes, bounds, gaps, counts, progress, old/new links, star template dimensions, SVG shapes');

c.P={...c.DEF,paperMode:"only",paperPalette:"custom",paperColor1:"#123456",paperColor2:"#abcdef",paperColor3:"#aabbcc",paperColor4:"#ddeeff"};run("build();done.add(1);saveProgress();P.paperColor1=\"#999999\";build()");assert(c.done.has(1));assert.equal(run("paperPalette().c[0]"),"#999999");c.location.hash="#v=1&paperMode=only&paperPalette=custom&paperColor1=%23123456&paperColor2=bad";const colors=run("sharedParams()");assert.equal(colors.paperColor1,"#123456");assert.equal(colors.paperColor2,c.DEF.paperColor2);assert.equal(colors.paperMode,"only");console.log("PASS: custom colors validation, link decoding and progress preservation");
