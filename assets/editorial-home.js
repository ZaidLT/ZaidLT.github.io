/* One owner at a time: opening, manual views, then reversible scroll progress. */
(() => {
  'use strict';
  const root = document.querySelector('[data-editorial-art]');
  const g = window.gsap;
  if (!root || !g) return;
  const ST = window.ScrollTrigger;
  if (ST) g.registerPlugin(ST);
  const intro = root.closest('.editorial-intro');
  const desktop = matchMedia('(min-width: 1024px) and (min-height: 700px)');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const buttons = [...root.querySelectorAll('[data-view]')];
  const play = root.querySelector('[data-play]');
  const status = root.querySelector('[data-art-status]');
  const state = {open: reduced.matches || location.hash ? 1 : 0};
  const parts = [
    ['.hero-lid',0,-46,0], ['.hero-core',0,-6,0],
    ['.satellite-0',-30,-18,0], ['.satellite-1',30,-18,0],
    ['.satellite-2',-35,18,0], ['.satellite-3',35,18,0],
    ['.document-0',40,-24,5], ['.document-1',0,0,0], ['.document-2',-43,18,-5],
    ['.plane-0',0,18,0], ['.plane-1',0,-5,0], ['.plane-2',0,-40,0]
  ].map(([selector,x,y,rotation]) => ({node:root.querySelector(selector),x,y,rotation}));
  let timeline = null, move = null, scrollTween = null, trigger = null;
  let seen = false, inView = false, destroyed = false, refreshing = false;
  let owner = 'idle', lastScroll = scrollY;
  const render = () => {
    for (const {node,x,y,rotation} of parts) g.set(node,{x:x*state.open,y:y*state.open,rotation:rotation*state.open,svgOrigin:node.classList.contains('hero-document')?'55 80':undefined});
    g.set(root.querySelector('.hero-wires'),{opacity:.12+state.open*.88});
    root.dataset.openness=state.open.toFixed(3);
    buttons.forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.view)===(state.open>.5?1:0))));
  };
  function label(mode,text) {root.dataset.motion=mode;play.textContent=mode==='playing'?'Pause':mode==='paused'?'Resume':'Replay';status.textContent=text;}
  function stop() {timeline?.kill();timeline=null;move?.kill();move=null;scrollTween?.tween.kill();scrollTween=null;}
  function select(value,immediate=false) {
    seen=true;stop();owner='manual';label('transition',value?'Opening layers':'Assembling');
    move=g.to(state,{open:value,duration:reduced.matches||immediate?0:.75,ease:'power3.inOut',onUpdate:render,onComplete:()=>{move=null;label('static',value?'Layers open.':'Assembled overview.');}});
  }
  function run() {
    seen=true;stop();owner='opening';
    if(reduced.matches){state.open=1;render();label('static','Layers open. Reduced motion is enabled.');return;}
    label('playing','Opening animation playing.');
    timeline=g.timeline({onComplete:()=>{owner='idle';label('static','Scroll to open the layers, or choose a view.');}});
    timeline.to(state,{open:0,duration:.2,ease:'power2.inOut',onUpdate:render})
      .to(state,{open:1,duration:1.3,ease:'power3.inOut',onUpdate:render},'open')
      .to(state,{open:1,duration:1.2,onUpdate:render},'inspect')
      .to(state,{open:0,duration:1.3,ease:'power3.inOut',onUpdate:render},'assemble');
  }
  function followScroll() {
    const current = scrollY;
    if (Math.abs(current-lastScroll)<.5) return;
    lastScroll=current;
    if (reduced.matches || !trigger || refreshing || destroyed) return;
    seen=true;
    if(owner!=='scroll'){stop();owner='scroll';label('scrolling','Scroll down to open the layers. Scroll up to reassemble.');}
    // A short interpolation transfers ownership from any current opening/manual pose.
    // It never moves the page and continues to follow reverse scrolling.
    const progress=Math.min(1,Math.max(0,(current-trigger.start)/(trigger.end-trigger.start)));
    const target = Math.min(1,progress/0.85);
    if(!scrollTween) scrollTween=g.quickTo(state,'open',{duration:.18,ease:'power2.out',onUpdate:render});
    scrollTween(target);
    root.dataset.scrollProgress=progress.toFixed(3);
  }
  function configureScroll() {
    refreshing=true;
    trigger?.kill();trigger=null;
    intro.style.minHeight='';intro.removeAttribute('data-scroll-pinned');
    if(ST && !reduced.matches){
      const header=document.querySelector('.site-header');
      const availableHeight=Math.max(0,innerHeight-header.offsetTop-header.offsetHeight-32);
      const contentHeight=intro.getBoundingClientRect().height;
      // Hold only when the introduction already fills most of the viewport.
      // Tall windows and zoomed-out layouts must reveal the work in normal flow,
      // rather than stretching a compact introduction into a large blank stage.
      const spareHeight=availableHeight-contentHeight;
      const pinned=desktop.matches && spareHeight>=-1 && spareHeight<=160;
      if(pinned){
        intro.style.minHeight=`${availableHeight}px`;
        intro.dataset.scrollPinned='true';
      }
      trigger=ST.create({
        id:'editorial-home-scroll',trigger:pinned?intro:root,
        start:pinned?'top top':'clamp(top 65%)',
        end:pinned?'+=400':'clamp(bottom 25%)',
        pin:pinned?intro:false,anticipatePin:1,invalidateOnRefresh:true,
        onUpdate:followScroll,
        onRefreshInit:()=>{refreshing=true;},
        onRefresh:()=>{lastScroll=scrollY;refreshing=false;}
      });
      root.dataset.scrollMode=pinned?'held':'flow';
    }else root.dataset.scrollMode='reduced';
    lastScroll=scrollY;refreshing=false;
  }
  function visibility() {
    if(document.hidden && root.dataset.motion==='playing'){timeline?.pause();label('paused','Animation paused.');}
    else if(!document.hidden && inView && !seen) start();
  }
  function start() {
    if(seen || document.hidden || !inView)return;
    seen=true;
    if(reduced.matches || location.hash){state.open=1;render();label('static','Layers open.');} else run();
  }
  buttons.forEach(b=>b.addEventListener('click',e=>select(Number(b.dataset.view),e.detail===0)));
  play.addEventListener('click',()=>{
    if(root.dataset.motion==='playing' && timeline){timeline.pause();label('paused','Animation paused.');}
    else if(root.dataset.motion==='paused' && timeline){timeline.resume();label('playing','Animation playing.');}
    else run();
  });
  function preference(){stop();owner='idle';state.open=1;render();seen=true;label('static','Layers open.');configureScroll();}
  root.querySelector('.editorial-toolbar').hidden=false;
  render();label('static','Overview of three independent areas of work.');
  const observer=new IntersectionObserver(entries=>{inView=entries[0].isIntersecting;if(inView)start();else if(root.dataset.motion==='playing'){stop();owner='idle';label('static','Scroll to explore the layers.');}},{threshold:.4});
  document.fonts.ready.then(()=>{if(!destroyed){configureScroll();observer.observe(root);}});
  // ScrollTrigger owns scroll positions; refresh does not replay the opening.
  let resizeTimer;
  const resize=()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(configureScroll,180);};
  window.addEventListener('resize',resize);
  window.addEventListener('scroll',followScroll,{passive:true});
  document.addEventListener('visibilitychange',visibility);
  reduced.addEventListener('change',preference);
  window.addEventListener('pagehide',e=>{stop();label('static','Animation stopped.');if(e.persisted)return;destroyed=true;observer.disconnect();trigger?.kill();clearTimeout(resizeTimer);window.removeEventListener('resize',resize);window.removeEventListener('scroll',followScroll);document.removeEventListener('visibilitychange',visibility);reduced.removeEventListener('change',preference);});
})();
