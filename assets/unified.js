(() => {
 'use strict';
 const root = document.querySelector('.unified-story');
 const g = window.gsap, S = window.ScrollTrigger;
 if (root && g) {
  const stage = root.querySelector('.unified-stage');
  const world = root.querySelector('.breadth-world');
  const pieces = [...root.querySelectorAll('.area-object')];
  const buttons = [...root.querySelectorAll('[data-home-step]')];
  const play = root.querySelector('[data-home-play]');
  const q = selector => root.querySelector(selector);
  const notes = ['Assembled system illustrations.', 'Expanded connections, document stages and cloud layers.', 'Linked project previews.'];
  let p=0,film=null,catchup=null,trigger=null,introUsed=false,owner='ready',mobileFilms=[];
  let desktop=false,reduced=false,lastScroll=scrollY,fontsReady=false;
  const skipIntro=!!location.hash&&location.hash!=='#inside';
  const pose=[
   [[-156,-124,.96,-5],[156,-124,.96,5],[0,156,.98,0]],
   [[-178,-120,.96,0],[178,-120,.96,0],[0,185,.96,0]],
   [[-230,-22,.78,0],[0,-22,.78,0],[230,-22,.78,0]]
  ];
  const main=g.timeline({paused:true,defaults:{duration:1,ease:'power2.inOut'}});
  g.set(pieces,{xPercent:-50,yPercent:-50,top:'50%'});
  pose[0].forEach((v,i)=>g.set(pieces[i],{x:v[0],y:v[1],scale:v[2],rotationZ:v[3]}));
  pose.slice(1).forEach((positions,k)=>positions.forEach((v,i)=>main.to(pieces[i],{x:v[0],y:v[1],scale:v[2],rotationZ:v[3]},k)));
  const internals=[
   ['.ai-satellites',{scale:.62},{scale:1.22},{scale:.78}],
   ['.ai-web',{scale:.62,opacity:.55},{scale:1.22,opacity:1},{scale:.78,opacity:.65}],
   ['.ai-core',{y:0},{y:-38},{y:0}],
   ['.sheet-source',{x:-25,y:0,rotation:-9},{x:-88,y:-6,rotation:-19},{x:-23,y:0,rotation:-9}],
   ['.sheet-structure',{y:-12,rotation:0},{y:-42,rotation:0},{y:-12,rotation:0}],
   ['.sheet-ready',{x:25,y:2,rotation:8},{x:88,y:10,rotation:16},{x:25,y:2,rotation:8}],
   ['.plane-operations',{y:-14},{y:-72},{y:-14}],
   ['.plane-delivery',{y:0},{y:0},{y:0}],
   ['.plane-environments',{y:14},{y:72},{y:14}]
  ];
  internals.forEach(([selector,closed,open,end])=>{
   g.set(q(selector),{...closed,transformOrigin:'50% 50%'});
   main.to(q(selector),open,0).to(q(selector),end,1);
  });
  main.to(q('.area-cloud .area-name'),{y:40},0).to(q('.area-cloud .area-name'),{y:0},1);
  function render(value){
   p=g.utils.clamp(0,1,value);main.progress(p);const frame=Math.round(p*2);
   root.dataset.frame=String(frame);root.dataset.progress=p.toFixed(3);root.dataset.owner=owner;
   buttons.forEach((b,i)=>b.setAttribute('aria-pressed',String(i===frame)));
   q('.home-state').textContent=notes[frame];q('.home-progress').setAttribute('aria-valuenow',String(Math.round(p*100)));
   q('.home-progress i').style.transform=`scaleX(${p})`;
  }
  function stop(){film?.kill();film=null;catchup?.kill();catchup=null;mobileFilms.forEach(t=>t.kill());mobileFilms=[];play.textContent='Replay';play.setAttribute('aria-label','Replay animation');play.setAttribute('aria-pressed','false')}
  function settle(value,duration=.22){
   catchup?.kill();const state={value:p};
   catchup=g.to(state,{value,duration:reduced?0:duration,ease:'power1.out',onUpdate:()=>render(state.value),onComplete:()=>{catchup=null}});
  }
  function jumpTo(top){
   const style=document.documentElement.style,previous=style.scrollBehavior;
   style.scrollBehavior='auto';window.scrollTo({top,behavior:'auto'});style.scrollBehavior=previous;lastScroll=scrollY;
  }
  function runFilm(opening=false){
   // End an in-flight chapter scroll before playback takes ownership.
   if(!opening){jumpTo(scrollY)}
   stop();owner=opening?'intro':'playback';root.dataset.owner=owner;
   if(reduced){render(.5);return}
   const state={value:p};film=g.timeline({onComplete:()=>{film=null;owner='idle';root.dataset.owner=owner;play.textContent='Replay';play.setAttribute('aria-label','Replay animation');play.setAttribute('aria-pressed','false')}});
   play.textContent='Pause';play.setAttribute('aria-label','Pause animation');play.setAttribute('aria-pressed','true');
   if(opening){render(0);state.value=0;film.to(state,{value:.5,duration:1.15,ease:'power2.inOut',onUpdate:()=>render(state.value)},.3).to(state,{value:0,duration:1.1,ease:'power2.inOut',onUpdate:()=>render(state.value)},1.9)}
   else{if(p>.98){state.value=0;render(0)}film.to(state,{value:1,duration:4*(1-state.value),ease:'none',onUpdate:()=>render(state.value)})}
  }
  function ownScroll(){
   if(!desktop||!trigger)return;
   if(['intro','playback','paused'].includes(owner)){stop();owner='scroll';settle(trigger.progress)}else{owner='scroll'}root.dataset.owner=owner;
  }
  const input=e=>{const control=e.target.closest?.('button,a,input,select,textarea');if(control&&(e.type==='touchstart'||(e.type==='keydown'&&e.key===' ')))return;if(e.type==='keydown'&&!['ArrowDown','ArrowUp','PageDown','PageUp','Home','End',' '].includes(e.key))return;ownScroll()};
  window.addEventListener('wheel',input,{passive:true});window.addEventListener('touchstart',input,{passive:true});window.addEventListener('keydown',input);
  window.addEventListener('scroll',()=>{if(Math.abs(scrollY-lastScroll)>.5)ownScroll();lastScroll=scrollY},{passive:true});
  buttons.forEach((b,i)=>b.addEventListener('click',e=>{
   stop();introUsed=true;owner='chapter';
   if(trigger){jumpTo(trigger.start+i/2*400);settle(i/2,e.detail===0?0:.25)}else{render(i/2)}
  }));
  play.addEventListener('click',()=>{
   introUsed=true;
   if(film){if(film.paused()){owner='playback';film.resume();play.textContent='Pause';play.setAttribute('aria-label','Pause animation');play.setAttribute('aria-pressed','true')}else{film.pause();owner='paused';play.textContent='Resume';play.setAttribute('aria-label','Resume animation');play.setAttribute('aria-pressed','false')}root.dataset.owner=owner}else{runFilm(false)}
  });
  root.dataset.enhanced='true';q('.home-controls').hidden=false;
  const mm=g.matchMedia();
  mm.add({all:'all',desktop:'(min-width:1024px) and (min-height:700px)',reduce:'(prefers-reduced-motion:reduce)'},ctx=>{
   stop();desktop=ctx.conditions.desktop&&!ctx.conditions.reduce;reduced=ctx.conditions.reduce;
   root.dataset.reduced=String(reduced);root.dataset.pinned=String(desktop);root.dataset.mode=desktop?'desktop':reduced?'reduced':'flow';owner='ready';render(reduced?.5:0);
   let cardObserver=null;
   if(desktop&&S){g.registerPlugin(S);trigger=S.create({id:'portfolio-home',trigger:stage,start:'top top',end:'+=400',pin:true,pinSpacing:true,pinType:'fixed',invalidateOnRefresh:true,onUpdate:self=>{if(['intro','playback','paused'].includes(owner))return;owner='scroll';if(catchup)settle(self.progress,.12);else render(self.progress)}})}
   else if(!reduced){
    const seen=new WeakSet();cardObserver=new IntersectionObserver(entries=>entries.forEach(entry=>{
     if(!entry.isIntersecting||seen.has(entry.target)||skipIntro)return;seen.add(entry.target);const cardFilm=g.timeline();mobileFilms.push(cardFilm);
     internals.forEach(([selector,closed,open])=>{const el=entry.target.querySelector(selector);if(el)cardFilm.to(el,{...open,duration:.85,ease:'power2.inOut'},0).to(el,{...closed,duration:.7,ease:'power2.inOut'},1.1)});
    }),{threshold:.5});pieces.forEach(card=>cardObserver.observe(card));
   }
   if(fontsReady)requestAnimationFrame(maybeIntro);
   return()=>{stop();trigger?.kill();trigger=null;cardObserver?.disconnect();root.dataset.pinned='false'};
  });
  const resize=new ResizeObserver(()=>{const r=q('.unified-art').getBoundingClientRect();world.style.setProperty('--scene-scale',String(Math.min(r.width/760,(r.height-100)/650,1.18)));if(trigger)S?.refresh()});resize.observe(q('.unified-art'));
  function maybeIntro(){if(!fontsReady||introUsed||skipIntro||!desktop||reduced||document.visibilityState!=='visible')return;const r=stage.getBoundingClientRect();if(r.top>innerHeight*.5||r.bottom<innerHeight*.5)return;introUsed=true;runFilm(true)}
  const visible=new IntersectionObserver(entries=>{if(entries[0].isIntersecting)maybeIntro();else if(film&&!film.paused()){film.pause();play.textContent='Resume';play.setAttribute('aria-label','Resume animation');owner='paused';root.dataset.owner=owner}},{threshold:.4});visible.observe(stage);
  document.fonts.ready.then(()=>{fontsReady=true;S?.refresh();if(skipIntro)document.getElementById(decodeURIComponent(location.hash.slice(1)))?.scrollIntoView({behavior:'instant'});else maybeIntro()});
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&film&&!film.paused()){film.pause();play.textContent='Resume';play.setAttribute('aria-label','Resume animation');owner='paused';root.dataset.owner=owner}else if(!document.hidden)maybeIntro()});
  window.addEventListener('pagehide',event=>{stop();if(event.persisted)return;mm.revert();resize.disconnect();visible.disconnect();main.kill()});
  window.addEventListener('pageshow',event=>{if(event.persisted){owner='scroll';lastScroll=scrollY;S?.refresh();render(trigger?trigger.progress:p)}});
 }
})();
