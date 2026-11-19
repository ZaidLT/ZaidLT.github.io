/* Document-only motion. A single owner: scroll, inspection or optional playback. */
(()=>{
 'use strict';
 const g=window.gsap;if(!g)return;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)'),mobile=matchMedia('(max-width:1023px)');
 const clamp=p=>Math.max(0,Math.min(1,p));const controllers=[];
 // x, y, scale, rotationY, rotationZ, visibility. Labels remain HTML.
 const pose={
 capability:{
 source:[[375,100,1.14,-15,-9,1],[35,80,.85,-13,-8,1],[25,75,.92,-10,-7,1],[30,70,.76,-12,-7,1]],
 extract:[[390,150,.7,0,0,0],[300,45,1,0,3,1],[360,25,.72,0,3,.35],[270,25,.8,0,3,.72]],
 ocr:[[480,220,.6,0,0,0],[685,210,1,-12,8,1],[680,80,.7,0,5,.15],[530,45,.75,0,5,.55]],
 classify:[[0,0,1,0,0,0],[0,0,1,0,0,0],[0,0,1,0,0,0],[0,0,1,0,0,0]],
 identity:[[420,240,.5,0,0,0],[400,290,.65,0,0,0],[375,205,1.12,-8,4,1],[250,300,.88,-6,-3,1]],
 structure:[[0,0,1,0,0,0],[0,0,1,0,0,0],[0,0,1,0,0,0],[0,0,1,0,0,0]],
 recover:[[0,0,1,0,0,0],[0,0,1,0,0,0],[0,0,1,0,0,0],[0,0,1,0,0,0]],
 gate:[[520,350,.5,0,0,0],[520,350,.5,0,0,0],[650,370,.6,0,0,0],[520,350,.88,0,-3,1]],
 output:[[410,180,.8,0,0,0],[620,45,.75,0,8,.15],[740,50,.8,0,8,.3],[750,50,.9,-10,7,1]],
 held:[[670,390,.5,0,0,0],[670,390,.5,0,0,0],[710,385,.7,0,4,.2],[750,365,.9,0,3,1]]},
 case:{
 source:[[80,65,1,-12,-8,1],[15,70,.78,-12,-9,.75],[20,40,.82,-10,-6,.8],[20,65,.78,-12,-8,.8]],
 extract:[[355,70,1.08,-7,3,1],[45,390,.7,0,-3,.65],[275,55,.82,-8,2,.55],[255,20,.65,0,2,.4]],
 ocr:[[710,270,1,-12,8,1],[695,410,.65,0,5,.2],[735,45,.7,0,5,.2],[530,40,.7,0,5,.4]],
 classify:[[450,160,.7,0,3,0],[275,25,1.05,-8,3,1],[410,80,.7,0,3,.15],[400,80,.7,0,3,0]],
 identity:[[570,220,.7,0,0,0],[650,170,1,-10,7,1],[680,310,.75,0,5,.2],[255,290,.76,0,-4,.65]],
 structure:[[0,0,1,0,0,0],[450,200,.6,0,0,0],[615,65,1.08,-12,7,1],[290,50,.9,-8,3,1]],
 recover:[[250,390,.7,0,0,0],[250,390,.7,0,0,0],[235,390,1,0,-3,1],[55,410,.72,0,-3,.7]],
 gate:[[510,340,.5,0,0,0],[510,340,.5,0,0,0],[510,340,.5,0,0,0],[520,355,.86,0,-3,1]],
 output:[[580,170,.7,0,0,0],[580,170,.7,0,0,0],[810,245,.7,0,8,.1],[750,50,.92,-10,7,1]],
 held:[[650,390,.5,0,0,0],[650,390,.5,0,0,0],[650,390,.5,0,0,0],[750,365,.92,0,3,1]]},
 home:{
 source:[[335,45,1.15,-12,-8,1],[95,70,1,-15,-13,1],[95,70,1,-15,-13,1],[95,70,1,-15,-13,1]],
 structure:[[350,80,.85,0,0,0],[360,35,.95,0,2,1],[360,35,.95,0,2,1],[360,35,.95,0,2,1]],
 output:[[365,110,.75,0,0,0],[620,70,1,-12,10,1],[620,70,1,-12,10,1],[620,70,1,-12,10,1]],
 held:[[590,430,.6,0,0,0],[545,445,.92,0,3,1],[545,445,.92,0,3,1],[545,445,.92,0,3,1]]}
 };
 const focus={capability:[['source'],['source','extract','ocr'],['source','identity'],['source','identity','gate','output','held']],case:[['source','extract','ocr'],['source','classify','identity'],['source','extract','structure','recover'],['source','structure','gate','output','held']]};
 for(const kind of ['capability','case'])for(const [name,poses]of Object.entries(pose[kind]))poses.forEach((p,i)=>p[5]=focus[kind][i].includes(name)?1:0);
 function init(root){
  const kind=root.dataset.docScene,world=root.querySelector('.dp-world'),stage=root.querySelector('.dp-stage'),isHome=kind==='home',chapters=[...root.querySelectorAll('[data-dp-chapter]')],play=root.querySelector('[data-dp-play]'),follow=root.querySelector('[data-dp-follow]'),label=root.querySelector('[data-dp-mode]');
  let mode='scroll',progress=1,scrollValue=1,visible=false,film=null,seek=null,offset=0,lastScroll=0,scale=1,disposed=false;
  const values={p:1};root.classList.add('dp-enhanced');root.querySelector('.dp-controls')?.removeAttribute('hidden');
  let timeline=g.timeline({paused:true});
  for(const [name,poses] of Object.entries(pose[kind])){
   const el=root.querySelector('[data-dp-object="'+name+'"]');if(!el)continue;
   const vars=p=>({x:p[0],y:p[1],scale:p[2],rotationY:p[3],rotationZ:p[4],autoAlpha:p[5],transformPerspective:1100});
   g.set(el,vars(poses[0]));for(let i=1;i<4;i++)timeline.to(el,{...vars(poses[i]),duration:1,ease:'power2.inOut'},i-1);
  }
  if(isHome){root.querySelectorAll('[data-dp-object]').forEach(el=>{if(!pose.home[el.dataset.dpObject])el.style.display='none';});}
  function render(p){
   progress=clamp(p);values.p=progress;const index=Math.round(progress*3);root.dataset.docStep=String(index);root.dataset.docProgress=progress.toFixed(4);root.dataset.docMode=mode;
   if(!mobile.matches||isHome){timeline.progress(progress);if(isHome){root.querySelectorAll('[data-dp-object]').forEach(el=>el.style.setProperty('--dp-home-transform',el.style.transform));}}
   root.querySelectorAll('[data-dp-description]').forEach((el,i)=>el.hidden=i!==index);
   chapters.forEach((b,i)=>b.setAttribute('aria-pressed',String(i===index)));
   if(play){play.textContent=mode==='play'?'Pause':mode==='paused'?'Resume':'Replay';play.setAttribute('aria-pressed',String(mode==='play'));follow.disabled=mode==='scroll';label.textContent=mode==='scroll'?'Following scroll':mode==='play'?'Playing':mode==='paused'?'Paused':'Viewing: '+chapters[index].textContent;}
   const handoff=root.querySelector('.dp-handoff');handoff.style.opacity=isHome?'0':String(clamp((progress-.8)*5));
   const wire=root.querySelector('.dp-wires');if(wire)wire.style.opacity=String(.15+.65*progress);
  }
  function stop(){film?.kill();film=null;seek?.kill();seek=null;}
  function move(p,instant=false){seek?.kill();if(instant||reduced.matches||mobile.matches){render(p);return;}const target={p:progress};seek=g.to(target,{p,duration:.65,ease:'power2.inOut',onUpdate:()=>render(target.p),onComplete:()=>{seek=null;render(mode==='scroll'?measure():p);}});}
  function measure(){const r=stage.getBoundingClientRect();const start=Math.max(0,r.top+scrollY-innerHeight*.8);const distance=Math.max(240,Math.min(r.height*.9,innerHeight*.85));return clamp((scrollY-start)/distance);}
  function onScroll(){
   const next=measure();const change=next-lastScroll;lastScroll=next;scrollValue=next;
   if(mode==='scroll'&&!seek){if(offset){offset=Math.sign(offset)*Math.max(0,Math.abs(offset)-Math.abs(change)*1.8);}render(reduced.matches?1:clamp(scrollValue+offset));}
  }
  chapters.forEach((button,i)=>button.addEventListener('click',()=>{stop();mode='inspect';move(i/3);}));
  play?.addEventListener('click',()=>{
   if(mode==='play'){film?.pause();mode='paused';render(progress);return;}
   if(mode==='paused'&&film){if(!document.hidden&&visible){mode='play';film.resume();render(progress);}return;}
   stop();mode='play';if(reduced.matches){mode='inspect';render(1);return;}render(0);const target={p:0};film=g.to(target,{p:1,duration:10,ease:'none',onUpdate:()=>render(target.p),onComplete:()=>{film=null;mode='inspect';render(1);}});if(document.hidden||!visible){film.pause();mode='paused';render(progress);}
  });
  follow?.addEventListener('click',()=>{stop();mode='scroll';scrollValue=measure();lastScroll=scrollValue;offset=0;move(reduced.matches?1:scrollValue);});
  function resize(){
   const w=stage.clientWidth;
   if(!mobile.matches||isHome){scale=w/1000;world.style.transform='scale('+scale+')';world.style.setProperty('--dp-home-scale','scale('+scale+')');stage.style.height=((isHome?650:590)*scale)+'px';}
   else{world.style.transform='';stage.style.height='590px';}
   scrollValue=measure();lastScroll=scrollValue;if(mode==='scroll'){offset=progress-scrollValue;}render(progress);
  }
  const ro=new ResizeObserver(resize);ro.observe(stage);
  const io=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;root.dataset.docVisible=String(visible);if(!visible&&mode==='play'){film?.pause();mode='paused';render(progress);}},{threshold:.04});io.observe(stage);
  function preference(){stop();if(mode==='play'||mode==='paused')mode='inspect';resize();if(reduced.matches)render(mode==='scroll'?1:Math.round(progress*3)/3);}
  function hide(){if(mode==='play'){film?.pause();mode='paused';render(progress);}}
  resize();scrollValue=measure();lastScroll=scrollValue;offset=0;render(reduced.matches?1:scrollValue);
  return{scroll:onScroll,preference,hide,destroy(){if(disposed)return;disposed=true;stop();timeline.kill();ro.disconnect();io.disconnect();}};
 }
 document.querySelectorAll('[data-doc-scene]').forEach(root=>controllers.push(init(root)));
 let raf=0;window.addEventListener('scroll',()=>{if(!raf)raf=requestAnimationFrame(()=>{raf=0;controllers.forEach(c=>c.scroll());});},{passive:true});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)controllers.forEach(c=>c.hide());});
 reduced.addEventListener('change',()=>controllers.forEach(c=>c.preference()));mobile.addEventListener('change',()=>controllers.forEach(c=>c.preference()));
 window.addEventListener('pagehide',e=>{if(!e.persisted)controllers.forEach(c=>c.destroy());else controllers.forEach(c=>c.hide());});
})();
