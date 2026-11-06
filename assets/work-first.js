/* Small explanatory scenes. No scroll pinning and no external actions. */
(() => {
  'use strict';
  const g = window.gsap;
  if (!g) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const cleanups = [];
  document.querySelectorAll('.portfolio-work [data-showcase]').forEach(root => {
    let seen = false, film;
    const observer = new IntersectionObserver(entries => {
      if (!entries[0].isIntersecting) { film?.pause(); return; }
      if (reduced.matches) return;
      if (seen) { film?.resume(); return; }
      seen = true;
      film = g.timeline({defaults:{duration:1.15,ease:'power2.inOut'}});
      if (root.dataset.showcase === 'product') {
        film.fromTo(root.querySelector('.preview-context'),{x:0,y:-20,opacity:.3},{x:0,y:0,opacity:1},0)
          .fromTo(root.querySelector('.preview-interface'),{y:15},{y:0},.12)
          .fromTo(root.querySelector('.preview-tools'),{x:0,y:20,opacity:.4},{x:0,y:0,opacity:1},.2);
      } else {
        film.fromTo(root.querySelector('.preview-source'),{x:60,rotationZ:-3},{x:0,rotationZ:-14},0)
          .fromTo(root.querySelector('.preview-structure'),{y:25},{y:0},.12)
          .fromTo(root.querySelector('.preview-knowledge'),{x:-60,rotationZ:0},{x:0,rotationZ:13},.2);
      }
    },{threshold:.3});
    observer.observe(root);
    const preference = () => { if (reduced.matches) film?.progress(1).pause(); };
    reduced.addEventListener('change',preference);
    cleanups.push(()=>{observer.disconnect();film?.kill();reduced.removeEventListener('change',preference);});
  });
  document.querySelectorAll('[data-memory]').forEach(root => {
    const old = root.querySelector('.memory-old'), next = root.querySelector('.memory-new'), answer = root.querySelector('.memory-answer');
    const buttons = [...root.querySelectorAll('[data-memory-step]')], panels = [...root.querySelectorAll('.memory-details>section')];
    let tween, active = 0;
    function select(index, instant = false) {
      active = index; root.dataset.memoryStep = String(index);
      buttons.forEach((b,i)=>b.setAttribute('aria-pressed',String(index===i)));
      panels.forEach((p,i)=>p.hidden=index!==i);
      tween?.kill();
      const duration = reduced.matches || instant ? 0 : .7;
      const width = root.querySelector('.memory-theatre').clientWidth;
      const spread = Math.min(65,width*.16);
      g.set([old,next],{xPercent:-50});
      tween = g.timeline({defaults:{duration,ease:'power2.inOut'}});
      tween.to(old,{x:index===0?0:-spread,y:index===0?15:0,rotationZ:index===0?-4:-12,scale:index===0?1:.84,opacity:index===0?1:.65},0)
        .to(next,{x:index===0?0:spread*.6,y:index===0?25:index===1?-10:-22,rotationZ:index===0?0:4,scale:index===0?.82:1,autoAlpha:index===0?0:1},0)
        .to(answer,{y:index===2?0:18,scale:index===2?1:.95,autoAlpha:index===2?1:0},0);
      old.querySelector('span').textContent=index===0?'Current preference':'Retained history';
    }
    root.dataset.memoryReady='true';root.querySelector('.memory-controls').hidden=false;
    buttons.forEach((b,i)=>b.addEventListener('click',()=>select(i)));
    const preference=()=>select(active,true);reduced.addEventListener('change',preference);
    const resize=new ResizeObserver(()=>select(active,true));resize.observe(root.querySelector('.memory-theatre'));
    select(0,true);
    cleanups.push(()=>{tween?.kill();resize.disconnect();reduced.removeEventListener('change',preference);});
  });
  window.addEventListener('pagehide',event=>{if(!event.persisted)cleanups.forEach(fn=>fn());});
})();
