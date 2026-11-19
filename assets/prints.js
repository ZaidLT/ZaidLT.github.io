(() => {
  const art = document.querySelector('.opening-study');
  const g = window.gsap;
  if (!art || !g) return;
  const motion = g.matchMedia();
  const replay = art.querySelector('.print-replay');
  const label = replay.querySelector('b');
  let hasPresented = matchMedia('(prefers-reduced-motion: reduce)').matches;
  motion.add('(prefers-reduced-motion: no-preference)', () => {
    const film = g.timeline({paused:true, defaults:{ease:'power2.inOut'}});
    const part = s => art.querySelector(s);
    const paths = art.querySelectorAll('.voice-threads polyline');
    // Reveal the voice sample, register the printed ID, then ink the new staging footprint.
    film.fromTo(paths, {strokeDasharray:390,strokeDashoffset:315},
      {strokeDashoffset:0,duration:1.1,stagger:.008}, 0)
      .fromTo(part('.voice-trace'), {strokeDasharray:1,strokeDashoffset:1}, {strokeDashoffset:0,duration:.48}, .56)
      .fromTo(part('.brief-paper'), {x:26,y:8,rotation:6,opacity:.55,svgOrigin:'252 77'},
        {x:0,y:0,rotation:0,opacity:1,duration:.65}, .74)
      .fromTo(part('.manual-rotor'), {rotation:-21,svgOrigin:'0 0'}, {rotation:0,duration:.9}, .56)
      .fromTo(part('.model-leader'), {strokeDasharray:1,strokeDashoffset:1}, {strokeDashoffset:0,duration:.6}, 1.1)
      .fromTo(part('.model-frame'), {x:14,y:-9}, {x:0,y:0,duration:.58}, 1.1)
      .fromTo(part('.model-ink'), {scaleX:.01,transformOrigin:'left center'}, {scaleX:1,duration:.46}, 1.52)
      .fromTo(part('.prod-record'), {y:-26}, {y:0,duration:.47}, .4)
      .fromTo(part('.staging-copy'), {opacity:0,x:9}, {opacity:1,x:0,duration:.44}, .78);

    let state = hasPresented ? 'finished' : 'waiting';
    let inView = false;
    function setAction(text) {
      replay.dataset.action = text;
      label.textContent = text;
    }
    function start() {
      hasPresented = true;
      state = 'playing';
      setAction('Pause');
      film.pause(0, true);
      if (inView && !document.hidden) film.play();
    }
    function syncVisibility() {
      if (!inView || document.hidden) film.pause();
      else if (state === 'waiting') start();
      else if (state === 'playing') film.play();
    }
    function click() {
      if (state === 'playing') {
        state = 'paused';
        film.pause();
        setAction('Resume');
      } else if (state === 'paused') {
        state = 'playing';
        setAction('Pause');
        syncVisibility();
      } else {
        start();
      }
    }

    film.eventCallback('onComplete', () => {
      state = 'finished';
      setAction('Replay');
    });
    film.progress(hasPresented ? 1 : 0, true);
    setAction('Replay');
    const observer = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting && entry.intersectionRatio >= .12;
      syncVisibility();
    }, {threshold: .12});
    observer.observe(art);
    replay.hidden = false;
    replay.addEventListener('click', click);
    document.addEventListener('visibilitychange', syncVisibility);
    return () => {
      observer.disconnect();
      replay.hidden = true;
      replay.removeEventListener('click', click);
      document.removeEventListener('visibilitychange', syncVisibility);
    };
  }, art);
})();
