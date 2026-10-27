(()=>{'use strict';window.addEventListener('pageshow',e=>{if(e.persisted)location.reload()});const root=document.querySelector('.unified-story'),g=window.gsap,reduce=matchMedia('(prefers-reduced-motion:reduce)');
if(root&&g){
 const stage=root.querySelector('.unified-stage'),world=root.querySelector('.breadth-world'),pieces=[...root.querySelectorAll('.area-object')],buttons=[...root.querySelectorAll('[data-home-step]')],play=root.querySelector('[data-home-play]');
 let film=null,p=0;root.dataset.enhanced='true';root.dataset.reduced=String(reduce.matches);root.querySelector('.home-controls').hidden=false;
 const notes=['AI products. Data platforms. Cloud infrastructure.','Tools and memory. Traceable data. Environments and operations.','Choose a project to see the implementation and results.'];
 const poses=[[[ -155,-122,.93,-5],[155,-122,.93,5],[0,153,.95,0]],[[-175,-120,.94,0],[175,-120,.94,0],[0,160,.94,0]],[[-225,-30,.8,0],[0,-30,.8,0],[225,-30,.8,0]]];
 g.set(pieces,{xPercent:-50,yPercent:-50,top:'50%'});
 poses[0].forEach((v,i)=>g.set(pieces[i],{x:v[0],y:v[1],scale:v[2],rotationZ:v[3]}));
 const tl=g.timeline({paused:true,defaults:{duration:1,ease:'power2.inOut'}});
 tl.addLabel('build',0).addLabel('inside',1).addLabel('explore',2);
 poses.slice(1).forEach((pose,k)=>pose.forEach((v,i)=>tl.to(pieces[i],{x:v[0],y:v[1],scale:v[2],rotationZ:v[3]},k)));
 // The three subjects open independently. They are not a single product topology.
 const q=s=>root.querySelector(s),internal=(selector,open,closed={})=>{tl.to(q(selector),open,0).to(q(selector),closed,1)};
 g.set(q('.ai-satellites'),{scale:.65,transformOrigin:'50% 50%'});g.set(q('.ai-web'),{scale:.65,transformOrigin:'50% 50%',opacity:.55});
 internal('.ai-satellites',{scale:1.1},{scale:.8});internal('.ai-web',{scale:1.1,opacity:1},{scale:.8,opacity:.65});internal('.ai-core',{y:-22},{y:0});
 internal('.sheet-source',{x:-65,y:-8,rotation:-16},{x:-23,y:0,rotation:-9});internal('.sheet-structure',{y:-34,rotation:0},{y:-12,rotation:0});internal('.sheet-ready',{x:65,y:8,rotation:13},{x:25,y:2,rotation:8});
 internal('.plane-operations',{y:-45},{y:-14});internal('.plane-delivery',{y:0},{y:0});internal('.plane-environments',{y:45},{y:14});
 function render(value){p=Math.max(0,Math.min(1,value));tl.progress(p);const frame=Math.round(p*2);root.dataset.frame=frame;root.dataset.progress=p.toFixed(3);buttons.forEach((b,i)=>b.setAttribute('aria-pressed',String(i===frame)));root.querySelector('.home-state').textContent=notes[frame];root.querySelector('.home-progress').setAttribute('aria-valuenow',Math.round(p*100));root.querySelector('.home-progress i').style.transform=`scaleX(${p})`;}
 function stop(){film?.kill();film=null;play.textContent='Play the story'}
 function go(v){render(v)}
 buttons.forEach((b,i)=>b.addEventListener('click',()=>{stop();go(i/2)}));
 play.addEventListener('click',()=>{if(film){stop();return}if(reduce.matches)return;if(p>.98)go(0);const s={value:p};play.textContent='Pause story';film=g.to(s,{value:1,duration:12*(1-p),ease:'none',onUpdate:()=>go(s.value),onComplete:stop})});
 const resize=new ResizeObserver(()=>{const r=root.querySelector('.unified-art').getBoundingClientRect();world.style.setProperty('--scene-scale',Math.min(r.width/720,(r.height-50)/620))});resize.observe(root.querySelector('.unified-art'));
 // Normal document flow keeps the next section adjacent at every scroll position.
 root.dataset.pinned='false';
 const visibility=new IntersectionObserver(e=>{if(!e[0].isIntersecting)stop()});visibility.observe(stage);document.addEventListener('visibilitychange',()=>{if(document.hidden)stop()});reduce.addEventListener('change',()=>{root.dataset.reduced=String(reduce.matches);stop();render(Math.round(p*2)/2)});window.addEventListener('pagehide',()=>{stop();resize.disconnect();visibility.disconnect();tl.kill()});render(0);
}
document.querySelectorAll('[data-evidence]').forEach(root=>{const buttons=[...root.querySelectorAll('[data-evidence-step]')],panels=[...root.querySelectorAll('[data-evidence-panel]')];root.querySelector('.evidence-controls').hidden=false;function select(n){root.dataset.step=n;buttons.forEach((b,i)=>b.setAttribute('aria-pressed',i===n));panels.forEach((el,i)=>el.hidden=i!==n);if(root.dataset.evidence==='operations')root.querySelector('[data-attention-count]').textContent=n?'1':'14'}buttons.forEach((b,i)=>b.addEventListener('click',()=>select(i)));select(0)});
})();
