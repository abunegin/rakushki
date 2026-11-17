const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const html=fs.readFileSync(__dirname+'/../index.html','utf8');
const js=html.match(/<script>\s*([\s\S]*?)<\/script>/)[1];new vm.Script(js);
const c={window:{},location:{hash:''},URLSearchParams,localStorage:{getItem:()=>null,setItem:()=>{}}};vm.createContext(c);
vm.runInContext(js.slice(js.indexOf('var TOP'),js.indexOf('/* ---------- отрисовка'))+js.slice(js.indexOf('var cur=0,done='),js.indexOf('function rulersHtml'))+js.slice(js.indexOf('function starPoints'),js.indexOf('function paperSprite'))+js.slice(js.indexOf('function words'),js.indexOf('function stepList'))+js.slice(js.indexOf('function templateRow'),js.indexOf('function printCards')),c);
const run=s=>vm.runInContext(s,c);const ids=['circle','star','heart','diamond','drop'];
// Shopping helpers are independent of rendering and use the same model as templates.
run('function fmt(n){return String(n)}');
for(const shape of ids){
 const points=run('shapePoints("'+shape+'")');for(const axis of ['x','y'])assert(Math.abs(Math.max(...points.map(p=>p[axis]))-Math.min(...points.map(p=>p[axis]))-1)<1e-10,shape+' bounds');
 for(const mode of ['only','separate','mixed'])for(const layers of [1,3])for(const sizes of [[10,80],[25,55],[40,40]]){
  c.P={...c.DEF,paperScatter:0,paperMode:mode,paperShapes:'custom',h:30,w:40,n:12,layers,minlen:15,jitter:40,paperGap:20};for(const id of ids)c.P['use_'+id]=id===shape;c.P['size_'+shape]=sizes[0];c.P['two_'+shape]=true;c.P['size2_'+shape]=sizes[1];run('build()');
  const paper=c.M.strands.flatMap(s=>s.items).filter(it=>it.kind==='paper');assert(paper.length);assert(paper.every(it=>it.shape===shape&&sizes.includes(it.d)));if(sizes[0]!==sizes[1])assert.equal(new Set(paper.map(it=>it.d)).size,2);
  assert.equal(c.M.paper,paper.length);assert.equal(run('paperGroups().reduce(function(n,g){return n+g.n},0)'),paper.length);
  for(const s of c.M.strands){assert(s.len<=300);s.items.forEach((it,i)=>{assert(it.y-it.d/2>=15);if(i){const p=s.items[i-1],expected=it.kind==='paper'||p.kind==='paper'?20:c.P.gap;assert.equal(it.y-it.d/2-p.y-p.d/2,expected)}})}
  const groups=run('paperGroups()'),templates=run('templateSvg()'),shopping=run('shopList().join(" ")');for(const g of groups){assert(templates.includes(g.d+' мм'));assert(shopping.includes(g.d+' мм — '+Math.ceil(g.n*1.1)*2+' деталей'))}assert.equal((templates.match(/<polygon /g)||[]).length,groups.length);assert(run('paperSheets()')>0);
 }
}
// All five shapes, two sizes per shape, exact count and share validation.
c.P={...c.DEF,paperScatter:0,paperMode:'only',paperShapes:'custom',h:200,paperGap:20};for(const id of ids){c.P['use_'+id]=true;c.P['size_'+id]=20;c.P['two_'+id]=true;c.P['size2_'+id]=60}run('build()');assert.equal(run('paperGroups().length'),10);assert.equal((run('templateSvg()').match(/<polygon /g)||[]).length,10);assert.equal(c.M.big+c.M.small,0);
const before=JSON.stringify(c.M);run('build()');assert.equal(JSON.stringify(c.M),before);
run('done.add(1);saveProgress();P.paperColor1="#abcdef";build()');assert(c.done.has(1));run('P.size_heart=30;build()');assert.equal(c.done.size,0);run('P.size_heart=20;build()');assert(c.done.has(1));
c.location.hash='#v=1&paperMode=only&paperShapes=custom&use_circle=false&use_star=false&use_heart=true&size_heart=25&two_heart=true&size2_heart=80';const p=run('sharedParams()');assert.equal(p.size_heart,25);assert.equal(p.size2_heart,80);assert.equal(p.two_heart,true);assert.equal(p.use_heart,true);
assert.equal(run('validParams({paperShapes:"custom",use_circle:false,use_star:false}).use_circle'),true);
assert.equal(run('validParams({size_heart:999,size2_heart:-5}).size_heart'),80);assert.equal(run('validParams({size_heart:5}).size_heart'),10);
// IDs must remain unique; every literal DOM binding must have a matching control.
const domIds=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);assert.equal(new Set(domIds).size,domIds.length);for(const m of js.matchAll(/\$\("([^"]+)"\)/g))assert(domIds.includes(m[1]),'Missing control '+m[1]);
assert(html.indexOf('id="paperMode"')<html.indexOf('class="main"'));assert(!html.includes('Как на фото'));assert(!html.includes('id="paperSize"'));assert(html.includes('"shellGroup").hidden=P.paperMode==="only"'));assert(html.includes('"paperGroup").hidden=P.paperMode==="off"'));
console.log('PASS: 90 new shape/size models; shape bounds, all materials, dual sizes, counts, gaps, templates, shopping quantities, links, progress, control IDs and material placement');
