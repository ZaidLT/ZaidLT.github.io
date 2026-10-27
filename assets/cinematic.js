/* Local illustrative scenes. No network calls or external actions. */
(()=>{'use strict';
const scene=document.querySelector('[data-case]');if(!scene)return;
const kind=scene.dataset.case,stage=scene.querySelector('.case-stage'),art=scene.querySelector('.cinematic-figure svg');
const buttons=[...scene.querySelectorAll('[data-chapter]')],panels=[...scene.querySelectorAll('[data-chapter-panel]')];
const copy=scene.querySelector('.cinematic-chapter-copy'),progress=scene.querySelector('[role=progressbar]');
const g=window.gsap,S=window.ScrollTrigger;let trigger=null,timeline=null,current=-1,approved=false;
scene.querySelector('.scene-navigation').hidden=false;
function select(i){
 if(current===i)return;current=i;scene.dataset.chapter=String(i);
 buttons.forEach((b,n)=>b.setAttribute('aria-pressed',String(n===i)));
 copy.querySelector('h2').textContent=panels[i].querySelector('h3').textContent;
 copy.querySelector('p').textContent=panels[i].querySelector('p').textContent;
}
function meter(p){progress.setAttribute('aria-valuenow',String(Math.round(p*100)));progress.querySelector('span').style.transform=`scaleX(${p})`;select(Math.min(3,Math.floor(p*4)));}
buttons.forEach((b,i)=>b.addEventListener('click',()=>{
 if(trigger){window.scrollTo({top:trigger.start+(trigger.end-trigger.start)*[0,.34,.67,1][i],behavior:'instant'});S.update();}
 else{select(i);panels[i].scrollIntoView({behavior:'instant',block:'start'});}
}));
const approve=scene.querySelector('[data-approve]'),reset=scene.querySelector('[data-reset-approval]');
function approval(value){approved=value;scene.dataset.approved=String(value);scene.querySelector('.approval-status').textContent=value?'Demonstration action approved':'Awaiting human approval';art.querySelector('.art-approval-label').textContent=value?'Illustrative action recorded':'Awaiting a decision';approve.disabled=value;}
if(approve){scene.querySelector('.approval-buttons').hidden=false;approval(false);approve.addEventListener('click',()=>approval(true));reset.addEventListener('click',()=>approval(false));}
const incidentButtons=[...document.querySelectorAll('[data-incident]')],incidentPanels=[...document.querySelectorAll('[data-incident-panel]')];
function incident(id){incidentButtons.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.incident===id)));incidentPanels.forEach(p=>p.hidden=p.dataset.incidentPanel!==id);}
if(incidentButtons.length){document.querySelector('.incident-controls').hidden=false;incident('migration');incidentButtons.forEach(b=>b.addEventListener('click',()=>incident(b.dataset.incident)));}
select(0);scene.dataset.mode='static';
if(!g||!S)return;
g.registerPlugin(S);
const mm=g.matchMedia();
function enableMotion(){mm.add('(min-width:1024px) and (min-height:700px) and (prefers-reduced-motion:no-preference)',()=>{
 scene.dataset.mode='pinned';
 const q=s=>art.querySelectorAll(s);
 timeline=g.timeline({paused:true,defaults:{ease:'none'}});
 if(kind==='agent'){
  timeline.fromTo(q('.request-packet'),{attr:{cy:110}},{attr:{cy:194},duration:.6},0)
   .fromTo(q('.context-layer'),{y:35,opacity:.8},{y:0,opacity:1,duration:1},0)
   .fromTo(q('.interface-layer'),{opacity:1},{opacity:.85,duration:1},.1)
   .fromTo(q('.agent-core'),{y:0},{y:-18,duration:1},.1)
   .fromTo(q('.specialist'),{opacity:.8},{opacity:1,stagger:.025,duration:.45},1)
   .fromTo(q('.integration-layer'),{opacity:.8},{opacity:1,duration:.5},1.4)
   .fromTo(q('.approval-layer'),{opacity:.8,y:14},{opacity:1,y:0,duration:.8},2.2);
 }else{
  timeline.fromTo(q('.delivery-packet'),{attr:{cx:375,cy:80}},{attr:{cx:375,cy:108},duration:.2},.7)
   .to(q('.delivery-packet'),{attr:{cx:85,cy:108},duration:.35},.9)
   .to(q('.delivery-packet'),{attr:{cx:85,cy:405},duration:.4},1.25)
   .to(q('.delivery-packet'),{attr:{cx:145,cy:405},duration:.15},1.65)
   .fromTo(q('.env-0'),{y:-40},{y:25,duration:1},0)
   .fromTo(q('.env-2'),{y:40},{y:-20,duration:1},0)
   .fromTo(q('.delivery-layer'),{opacity:.8},{opacity:1,duration:.8},.8)
   .fromTo(q('.access-layer'),{opacity:.8},{opacity:1,duration:.8},1.6)
   .fromTo(q('.operations-layer'),{opacity:.8,y:10},{opacity:1,y:0,duration:.6},2.4);
 }
 trigger=S.create({trigger:stage,start:'top top',end:()=>'+='+Math.round(innerHeight*2),pin:true,pinSpacing:true,invalidateOnRefresh:true,onUpdate:self=>{timeline.progress(self.progress);meter(self.progress);},onRefresh:self=>{timeline.progress(self.progress);meter(self.progress);}});
 // Chapter controls and scrolling share one progress state. Consent is independent.
 return ()=>{trigger?.kill();timeline?.kill();trigger=null;timeline=null;scene.dataset.mode='static';g.set(art.querySelectorAll('g'),{clearProps:'transform,opacity'});meter(0);};
});
}
enableMotion();
const staticButton=scene.querySelector('[data-static-view]');let staticView=false;
staticButton.addEventListener('click',()=>{staticView=!staticView;staticButton.setAttribute('aria-pressed',String(staticView));staticButton.textContent=staticView?'Use scroll story':'Use static view';if(staticView){mm.revert();scene.dataset.mode='static';}else enableMotion();S.refresh();});
document.fonts.ready.then(()=>{S.refresh();if(location.hash){const target=document.getElementById(decodeURIComponent(location.hash.slice(1)));target?.scrollIntoView({behavior:'instant',block:'start'});}});
window.addEventListener('pagehide',()=>mm.revert());
window.addEventListener('beforeprint',()=>{trigger?.disable(true);incidentPanels.forEach(p=>p.hidden=false);});
window.addEventListener('afterprint',()=>{trigger?.enable();if(incidentButtons.length)incident('migration');S.refresh();});
})();
