/* Motion is illustrative only. No external requests or actions are performed. */
(()=>{
 const g=window.gsap, scene=document.querySelector('.system-cinema');
 if(!g||!scene)return;
 const media=matchMedia('(prefers-reduced-motion: reduce)');
 const layers=[...scene.querySelectorAll('.stratum')];
 const picker=[...scene.querySelectorAll('[data-select]')];
 const explode=scene.querySelector('[data-explode]'),tour=scene.querySelector('[data-tour]');
 const switcher=document.querySelector('[data-motion]');
 const status=scene.querySelector('.tour-status');
 const descriptions=[
 ['Cloud engineering','A foundation<br>you can rely on.','Environments, infrastructure as code, migrations and production recovery. I owned the cloud foundations across Azure and Google Cloud.','Explore the cloud foundation','work/infrastructure-migrations/index.html','#a5d1e2'],
 ['Persistent context','The right context.<br>Carried forward.','Household records and document intelligence connect to persistent memory. I was the primary engineer on the PostgreSQL and pgvector memory service.','Explore persistent memory','work/agent-platform/index.html#build-persistent-relationship-aware-memory','#79d0ca'],
 ['Agent orchestration','Specialists working<br>as one system.','One Google ADK orchestrator routes work to 16 specialist agents and typed tools. I co-led the platform and shipped seven production capabilities.','Explore the agent platform','work/agent-platform/index.html','#f2b7ae'],
 ['Human approval','Useful action.<br>On your terms.','A proposed service action waits for a person. Scoped inputs, duplicate-action prevention and recorded decisions preserve that boundary.','Explore the service workflows','work/agent-platform/index.html#own-voice-messaging-and-service-execution','#ffc179']
 ];
 let expanded=false,film=null,ambient=null,paused=media.matches,storyPaused=false;
 scene.querySelector('.view-controls').hidden=false;switcher.hidden=false;
 function stopFilm(){if(film){film.kill();film=null;}tour.innerHTML='Play the story <span aria-hidden="true">▶</span>';g.set('.scene-progress i',{scaleX:0});scene.dataset.playing='false';}
 function select(index,fromFilm=false){
  if(!fromFilm)stopFilm();
  const [category,title,body,label,href,color]=descriptions[index];
  picker.forEach(b=>b.setAttribute('aria-pressed',String(+b.dataset.select===index)));
  scene.querySelector('.layer-category').textContent=category;
  scene.querySelector('.layer-category').style.color=color;
  scene.querySelector('h3').innerHTML=title;
  scene.querySelector('.layer-body').textContent=body;
  const link=scene.querySelector('.layer-link');link.textContent=label+' ↗';link.href=href;
  g.to(layers,{opacity:(i)=>i===index?1:.48,duration:media.matches?0:.4,overwrite:'auto'});
  status.textContent=fromFilm?'Playing: '+category:category+' selected. Explore the case study for the evidence.';
  scene.dataset.selected=String(index);
 }
 function assemble(open){
  expanded=open;explode.setAttribute('aria-pressed',String(open));
  explode.innerHTML=(open?'Assemble the system':'Explode the system')+' <span aria-hidden="true">↗</span>';
  layers.forEach((el,i)=>g.to(el,{y:open?-i*62:0,x:open?(i%2?12:-12):0,duration:media.matches?0:1.2,ease:'power3.inOut',overwrite:'auto'}));
  scene.dataset.expanded=String(open);
 }
 explode.addEventListener('click',()=>{stopFilm();assemble(!expanded);status.textContent=expanded?'Layers separated. Select a layer to explore it.':'Layers assembled into one system.';});
 picker.forEach(b=>b.addEventListener('click',()=>{assemble(true);select(+b.dataset.select);}));
 tour.addEventListener('click',()=>{
  if(film){storyPaused=!storyPaused;film.paused(storyPaused);tour.innerHTML=storyPaused?'Resume story <span aria-hidden="true">▶</span>':'Pause story <span aria-hidden="true">Ⅱ</span>';scene.dataset.playing=String(!storyPaused);status.textContent=storyPaused?'Story paused. Resume or select a layer.':'Story resumed.';return;}
  storyPaused=false;
  assemble(true);
  if(media.matches){select(3);status.textContent='Reduced motion: showing the approval boundary without playback.';return;}
  tour.innerHTML='Pause story <span aria-hidden="true">Ⅱ</span>';scene.dataset.playing='true';
  film=g.timeline({onComplete:()=>{film=null;tour.innerHTML='Replay the story <span aria-hidden="true">↻</span>';status.textContent='The story ends at human approval. No external action is performed.';scene.dataset.playing='false';}});
  for(let i=0;i<4;i++){
   film.call(()=>select(i,true),null,i*2.8);
   film.fromTo('.packet-'+i,{opacity:0,scale:.5},{opacity:1,scale:1.4,svgOrigin:'450 '+(460-i*46),duration:.65,repeat:1,yoyo:true},i*2.8+.4);
  }
  film.to('.scene-progress i',{scaleX:1,duration:11.2,ease:'none'},0);
 });
 function setAmbient(){
  if(ambient)ambient.kill();
  g.set('.hero-render',{y:0,scale:1});g.set('.hero-signals circle',{opacity:0});
  switcher.textContent=paused?'Play motion':'Pause motion';switcher.setAttribute('aria-pressed',String(!paused));
  if(paused||media.matches)return;
  ambient=g.timeline({repeat:-1,yoyo:true});
  ambient.to('.hero-render',{y:-9,scale:1.025,duration:5,ease:'sine.inOut'},0)
   .fromTo('.signal-a',{x:0,y:0,opacity:0},{x:130,y:210,opacity:.9,duration:3,ease:'power1.inOut'},0)
   .fromTo('.signal-b',{x:0,y:0,opacity:0},{x:-190,y:155,opacity:.9,duration:3,ease:'power1.inOut'},1.1);
 }
 switcher.addEventListener('click',()=>{paused=!paused;setAmbient();});
 media.addEventListener('change',()=>{paused=media.matches;stopFilm();assemble(expanded);setAmbient();});
 document.addEventListener('visibilitychange',()=>{if(document.hidden){ambient?.pause();film?.pause();}else{if(!paused)ambient?.resume();if(!storyPaused)film?.resume();}});
 const observer=new IntersectionObserver(entries=>{entries.forEach(e=>{if(e.target===scene&&!e.isIntersecting&&film){film.pause();}if(e.target===scene&&e.isIntersecting&&film&&!storyPaused)film.resume();if(e.target.classList.contains('hero-exhibit')){if(e.isIntersecting&&!paused)ambient?.resume();else ambient?.pause();}});},{threshold:.05});
 observer.observe(scene);observer.observe(document.querySelector('.hero-exhibit'));
 window.addEventListener('pagehide',()=>{ambient?.kill();film?.kill();observer.disconnect();});
 select(3);g.set(layers,{opacity:1});setAmbient();
})();
