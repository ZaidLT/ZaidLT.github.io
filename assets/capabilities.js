/* Normal-flow gallery. One progress owner per exhibit; no pinning or scroll interception. */
(()=>{
'use strict';
const g=window.gsap,reduce=matchMedia('(prefers-reduced-motion:reduce)'),desktop=matchMedia('(min-width:1024px)');
const scenes=[...document.querySelectorAll('[data-gallery]')],all=[];let intent=Boolean(location.hash),raf=0,hidden=document.hidden;
const clamp=x=>Math.max(0,Math.min(1,x));
// [x,y,scale,rotationY,rotationZ,opacity]. Different states reveal different responsibilities.
const P={
agents:{
 '.request-window':[[250,100,1.08,-16,-6,1],[20,110,.88,-25,-9,1],[30,80,.85,-18,-7,1],[45,80,.88,-13,-6,1]],
 '.tool-contract':[[330,135,.7,20,5,0],[445,40,1,-8,6,1],[475,35,1,-8,6,1],[490,30,.98,-9,7,1]],
 '.scope-check':[[350,280,.5,0,0,0],[495,405,1,0,4,1],[510,395,1,0,4,1],[510,395,1,0,4,1]],
 '.source-return':[[240,350,.6,0,0,0],[130,400,.75,0,-4,0],[120,475,.9,0,-4,.15],[100,485,1,0,-4,1]]},
evaluation:{
 '.run-reserve':[[220,5,1,0,0,1],[220,5,1,0,0,1],[220,5,1,0,0,1],[220,5,1,0,0,1]],
 '.original-snapshot':[[185,165,1.2,10,-6,1],[40,150,1,10,-5,1],[40,150,1,10,-5,1],[40,150,1,10,-5,1]],
 '.nano-attempt':[[445,175,1,0,5,1],[315,125,1,0,4,1],[305,100,.86,0,4,.55],[315,125,.85,0,4,.5]],
 '.runtime-gate':[[520,200,.6,0,0,0],[625,130,1,-10,0,1],[625,130,.85,-10,0,.6],[625,125,.85,-10,0,.6]],
 '.ultra-restart':[[300,300,.6,0,0,0],[300,360,.7,0,-5,0],[300,410,1,0,-5,1],[300,410,1,0,-5,1]],
 '.outcome-record':[[560,370,.6,0,0,0],[560,370,.6,0,0,0],[640,390,.8,0,4,.1],[630,390,1,0,4,1]]},
data:{
 '.document-source':[[290,100,1.25,-15,-8,1],[45,95,1,12,-10,1],[55,90,1,12,-10,1],[55,90,1,12,-10,1]],
 '.document-structure':[[315,120,1,0,0,0],[330,55,1,0,3,1],[330,55,1,0,3,1],[330,55,1,0,3,1]],
 '.document-output':[[335,140,.8,0,0,0],[605,85,.9,-12,10,.35],[605,85,1,-12,10,.65],[605,85,1,-12,10,1]],
 '.recovery-control':[[100,410,.6,0,0,0],[100,410,.6,0,0,0],[75,465,1,0,-3,1],[75,465,1,0,-3,1]],
 '.quality-control':[[485,410,.6,0,0,0],[485,410,.6,0,0,0],[485,450,.85,0,3,.1],[485,450,1,0,3,1]]},
scientific:{
 '.catalog-source':[[235,150,1,0,-5,1],[235,12,1,0,0,.7],[235,12,1,0,0,.6],[235,12,1,0,0,.6]],
 '.star-a':[[230,310,1,-8,-10,1],[58,295,1,0,-5,1],[58,295,1,0,-5,1],[58,295,1,0,-5,1]],
 '.star-b':[[345,310,1,0,0,1],[348,295,1,0,2,1],[348,295,1,0,2,1],[348,295,1,0,2,1]],
 '.star-c':[[460,310,1,8,10,1],[638,295,1,0,5,1],[638,295,1,0,5,1],[638,295,1,0,5,1]],
 '.partition':[[0,0,1,0,0,0],[0,0,1,0,0,1],[0,0,1,0,0,1],[0,0,1,0,0,1]],
 '.model-choice':[[55,495,.7,0,0,0],[55,495,.7,0,0,0],[55,495,1,0,-2,1],[55,495,1,0,-2,1]],
 '.heldout-seal':[[500,495,.7,0,0,0],[500,495,1,0,2,1],[500,495,1,0,2,1],[500,495,1,0,2,1]]},
delivery:{
 '.env-dev':[[60,190,1.1,0,-3,1],[60,60,1,0,0,1],[60,60,1,0,0,1],[60,60,1,0,0,1]],
 '.env-stage':[[345,155,1.1,0,0,1],[345,60,1,0,0,1],[345,60,1,0,0,1],[345,60,1,0,0,1]],
 '.env-prod':[[630,190,1.1,0,3,1],[630,60,1,0,0,1],[630,60,1,0,0,1],[630,60,1,0,0,1]],
 '.delivery-layer':[[280,330,.65,0,0,0],[45,315,1,12,-6,1],[45,315,1,12,-6,1],[45,315,1,12,-6,1]],
 '.access-layer':[[350,350,.65,0,0,0],[350,350,.65,0,0,0],[350,315,1,0,2,1],[350,315,1,0,2,1]],
 '.operations-layer':[[500,350,.65,0,0,0],[500,350,.65,0,0,0],[600,340,.7,0,7,.1],[650,325,1,0,7,1]]}
};
function init(scene){
 const kind=scene.dataset.gallery,stage=scene.querySelector('.gallery-stage,.memory-stage'),world=scene.querySelector('.gallery-world'),buttons=[...scene.querySelectorAll('[data-gallery-step]')],play=scene.querySelector('[data-gallery-play]'),follow=scene.querySelector('[data-gallery-follow]'),modeLabel=scene.querySelector('[data-gallery-mode]');
 let progress=1,scrollValue=0,mode='scroll',transition=null,film=null,timeline=null,visible=false,renderer=null,loading=false,failed=false,loadGeneration=0;
 const state={p:1};scene.dataset.enhanced='true';scene.querySelector('.gallery-controls').hidden=false;
 if(g&&P[kind]){
  timeline=g.timeline({paused:true});
  for(const [selector,poses]of Object.entries(P[kind])){
   const targets=scene.querySelectorAll(selector);
   const vars=v=>({x:v[0],y:v[1],scale:v[2],rotationY:v[3],rotationZ:v[4],opacity:v[5],transformPerspective:1100});
   g.set(targets,vars(poses[0]));
   for(let i=1;i<4;i++)timeline.to(targets,{...vars(poses[i]),duration:1,ease:'power2.inOut'},i-1);
  }
 }
 function updateUI(){
  const index=Math.round(progress*3);scene.dataset.step=String(index);scene.dataset.progress=progress.toFixed(4);scene.dataset.mode=mode;
  buttons.forEach((b,i)=>b.setAttribute('aria-pressed',String(i===index)));
  play.textContent=mode==='play'?'Pause':mode==='paused'?'Resume':'Replay';follow.disabled=mode==='scroll';
  modeLabel.textContent=mode==='scroll'?'Following scroll':mode==='play'?'Playing':mode==='paused'?'Paused':'Viewing: '+buttons[index].textContent;
  if(kind==='memory'){
   scene.querySelector('[data-memory-current]').textContent=index===0?'LINE · version 1':'WhatsApp · version 2';
   const fallback=scene.querySelector('.memory-fallback');fallback.dataset.step=String(index);scene.querySelectorAll('[data-fallback-v1-label]').forEach(el=>el.textContent=index===0?'V1 · ACTIVE':'V1 · HISTORY');scene.querySelector('.memory-mobile').dataset.step=String(index);
  }
 }
 function render(p){
  progress=clamp(p);state.p=progress;timeline?.progress(progress);renderer?.set(progress);
  const wire=scene.querySelector('.scene-wires');if(wire)wire.style.opacity=String(.12+.88*progress);
  updateUI();
 }
 function stopMotion(){transition?.kill();transition=null;film?.kill();film=null;}
 function seek(p,animated=true){
  transition?.kill();
  if(!g||reduce.matches||!animated){render(p);return;}
  const target={p:progress};transition=g.to(target,{p,duration:.65,ease:'power3.out',onUpdate:()=>render(target.p),onComplete:()=>{transition=null;render(mode==='scroll'?(reduce.matches?1:scrollValue):p);}});
 }
 function useChapter(i){stopMotion();mode='inspect';seek(i/3);}
 buttons.forEach((b,i)=>b.addEventListener('click',()=>{intent=true;useChapter(i);maybeLoad();}));
 play.addEventListener('click',()=>{
  intent=true;
  if(mode==='play'){film?.pause();mode='paused';updateUI();return;}
  if(mode==='paused'&&film){film.resume();mode='play';updateUI();return;}
  stopMotion();mode='play';if(progress>.98)render(0);
  if(reduce.matches||!g){mode='inspect';render(1);return;}
  const target={p:progress};film=g.to(target,{p:1,duration:8*(1-progress),ease:'none',onUpdate:()=>render(target.p),onComplete:()=>{film=null;mode='inspect';render(1);}});updateUI();maybeLoad();
 });
 follow.addEventListener('click',()=>{stopMotion();mode='scroll';seek(reduce.matches?1:scrollValue);});
 function scrollProgress(){
  if(kind==='agents')return clamp(window.scrollY/(innerHeight*.55));
  const rect=stage.getBoundingClientRect();const center=rect.top+rect.height/2;
  return clamp((innerHeight*.74-center)/(innerHeight*.48));
 }
 function onScroll(){scrollValue=scrollProgress();if(mode==='scroll'){if(transition)seek(reduce.matches?1:scrollValue);else render(reduce.matches?1:scrollValue);}maybeLoad();}
 function fallback(){renderer?.dispose();renderer=null;failed=true;loading=false;stage.dataset.ready='false';stage.dataset.renderer='svg';scene.querySelector('[data-memory-reset]')?.setAttribute('hidden','');const status=scene.querySelector('[data-memory-renderer]');if(status)status.textContent='Annotated service view';render(progress);}
 function maybeLoad(){
  if(kind!=='memory'||renderer||loading||failed||!visible||!intent||!desktop.matches||reduce.matches||document.hidden)return;
  loading=true;const generation=++loadGeneration;
  import('./capability-memory3d.js').then(module=>{
   if(generation!==loadGeneration||!desktop.matches||reduce.matches||!visible){loading=false;return;}
   try{const created=module.createMemoryWorld(stage,{onFailure:fallback});if(failed){created.dispose();loading=false;return;}renderer=created;loading=false;renderer.set(progress);stage.dataset.renderer='webgl';const reset=scene.querySelector('[data-memory-reset]');reset.hidden=false;scene.querySelector('[data-memory-renderer]').textContent='Drag or use arrow keys to inspect';}
   catch(error){fallback();}
  }).catch(fallback);
 }
 if(kind==='memory')scene.querySelector('[data-memory-reset]').addEventListener('click',()=>renderer?.reset());
 const observer=new IntersectionObserver(entries=>{
  visible=entries[0].isIntersecting;scene.dataset.visible=String(visible);
  if(!visible&&mode==='play'){film?.pause();mode='paused';updateUI();}
  maybeLoad();
 },{rootMargin:'100px 0px',threshold:.01});observer.observe(stage);
 const resize=new ResizeObserver(()=>{
  if(world){const w=stage.clientWidth,h=stage.clientHeight;world.style.setProperty('--world-scale',Math.min(w/920,(h-10)/620).toFixed(4));}
  scrollValue=scrollProgress();if(mode==='scroll'&&!transition)render(reduce.matches?1:scrollValue);
 });resize.observe(stage);
 function preference(){
  stopMotion();if(mode==='play'||mode==='paused')mode='inspect';
  if(kind==='memory'&&(!desktop.matches||reduce.matches)){loadGeneration++;renderer?.dispose();renderer=null;loading=false;stage.dataset.ready='false';stage.dataset.renderer='svg';scene.querySelector('[data-memory-reset]').hidden=true;scene.querySelector('[data-memory-renderer]').textContent='Annotated service view';}
  render(mode==='scroll'?(reduce.matches?1:scrollValue):progress);maybeLoad();
 }
 render(reduce.matches?1:scrollProgress());
 return{scroll:onScroll,preference,hide(){if(mode==='play'){film?.pause();mode='paused';updateUI();}},destroy(){stopMotion();timeline?.kill();observer.disconnect();resize.disconnect();renderer?.dispose();}};
}
scenes.forEach(scene=>all.push(init(scene)));
function schedule(){if(raf)return;raf=requestAnimationFrame(()=>{raf=0;all.forEach(c=>c.scroll());});}
window.addEventListener('scroll',schedule,{passive:true});window.addEventListener('wheel',()=>{intent=true;schedule();},{passive:true});window.addEventListener('touchmove',()=>{intent=true;schedule();},{passive:true});
document.addEventListener('keydown',e=>{if(['ArrowDown','ArrowUp','PageDown','PageUp','Home','End',' '].includes(e.key)){intent=true;schedule();}});
window.addEventListener('hashchange',()=>{intent=Boolean(location.hash);schedule();});
reduce.addEventListener('change',()=>all.forEach(c=>c.preference()));desktop.addEventListener('change',()=>all.forEach(c=>c.preference()));
document.addEventListener('visibilitychange',()=>{hidden=document.hidden;if(hidden)all.forEach(c=>c.hide());else schedule();});
window.addEventListener('pagehide',()=>all.forEach(c=>c.destroy()));document.fonts.ready.then(schedule);
})();
