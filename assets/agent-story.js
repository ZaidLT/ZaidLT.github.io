/* Read-only examples. No network, external actions or shared scene selectors. */
(()=>{'use strict';
const reduce=matchMedia('(prefers-reduced-motion:reduce)'),g=window.gsap;
document.querySelectorAll('[data-agent-exhibit]').forEach(root=>{
 const buttons=[...root.querySelectorAll('[data-agent-step]')],panels=[...root.querySelectorAll('[data-agent-panel]')],notes=[...root.querySelectorAll('[data-agent-note]')],play=root.querySelector('[data-agent-play]'),follow=root.querySelector('[data-agent-follow]'),status=root.querySelector('[data-agent-status]'),memory=root.dataset.agentExhibit==='memory';
 let step=0,owner=memory&&!reduce.matches?'scroll':'manual',film=null,visible=false,progress=0,raf=0,wasPlaying=false;
 root.dataset.enhanced='true';root.querySelector('.agent-evidence-controls').hidden=false;
 function render(n,animate=false){
  n=Math.max(0,Math.min(buttons.length-1,n));const changed=n!==step;step=n;root.dataset.step=String(step);root.dataset.owner=owner;
  buttons.forEach((b,i)=>b.setAttribute('aria-pressed',String(i===step)));panels.forEach((p,i)=>p.hidden=i!==step);notes.forEach((p,i)=>p.hidden=i!==step);
  status.textContent=owner==='scroll'?'Following scroll':(owner==='playback'?'Playing: ':'Viewing: ')+buttons[step].textContent;
  if(follow)follow.disabled=owner==='scroll';
  if(changed&&animate&&!reduce.matches&&g){const targets=memory?root.querySelectorAll('.memory-update,.agent-version,.memory-query'):panels[step].children;g.killTweensOf(targets);g.fromTo(targets,{y:12,rotationZ:0},{y:0,rotationZ:(i)=>memory?0:(i===0?-3:i===2?2:0),duration:.42,ease:'power2.out',stagger:.055,clearProps:'transform'});}
 }
 function stop(){film?.kill();film=null;wasPlaying=false;if(play)play.textContent='Replay';}
 function select(n){stop();owner='manual';render(n,true);}
 buttons.forEach((b,i)=>b.addEventListener('click',()=>select(i)));
 if(play){play.addEventListener('click',()=>{
  if(film){if(film.paused()){film.resume();play.textContent='Pause';status.textContent='Playing: '+buttons[step].textContent;}else{film.pause();play.textContent='Resume';status.textContent='Paused: '+buttons[step].textContent;}return;}
  if(reduce.matches||!g){owner='manual';render(buttons.length-1);return;}
  owner='playback';progress=0;render(0,true);play.textContent='Pause';const state={p:0};film=g?.to(state,{p:1,duration:10,ease:'none',onUpdate:()=>{progress=state.p;render(Math.min(buttons.length-1,Math.floor(progress*buttons.length)),true);},onComplete:()=>{film=null;owner='manual';render(buttons.length-1);play.textContent='Replay';}});
 });}
 function scrollFrame(){raf=0;if(!memory||owner!=='scroll'||!visible||document.hidden)return;const r=root.getBoundingClientRect(),range=Math.max(180,Math.min(innerHeight*.68,r.height*.65));progress=Math.max(0,Math.min(1,(innerHeight*.82-r.top)/range));render(Math.min(3,Math.floor(progress*4)),true);}
 function queue(){if(!raf)raf=requestAnimationFrame(scrollFrame);}
 follow?.addEventListener('click',()=>{stop();owner='scroll';queue();});
 const io=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(!visible&&film&&!film.paused()){film.pause();wasPlaying=true;play.textContent='Resume';}else if(visible&&wasPlaying&&!document.hidden){film?.resume();wasPlaying=false;play.textContent='Pause';}queue();},{threshold:0});io.observe(root);
 if(memory){addEventListener('scroll',queue,{passive:true});addEventListener('resize',queue);}
 const visibility=()=>{if(document.hidden&&film&&!film.paused()){film.pause();wasPlaying=true;play.textContent='Resume';}else if(!document.hidden&&visible&&wasPlaying){film?.resume();wasPlaying=false;play.textContent='Pause';}queue();};document.addEventListener('visibilitychange',visibility);
 const reduced=()=>{stop();owner='manual';render(memory?3:step);};reduce.addEventListener('change',reduced);
 addEventListener('pagehide',()=>{stop();io.disconnect();cancelAnimationFrame(raf);removeEventListener('scroll',queue);removeEventListener('resize',queue);document.removeEventListener('visibilitychange',visibility);reduce.removeEventListener('change',reduced);},{once:true});
 render(memory&&reduce.matches?3:0);queue();
});
})();
