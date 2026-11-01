/* Page-local, unpinned stories. The article and static overview need no script. */
(() => {
  'use strict';
  const g = window.gsap;
  if (!g) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');

  document.querySelectorAll('[data-evidence]').forEach(root => {
    const kind = root.dataset.evidence;
    const steps = [...root.querySelectorAll('[data-evidence-step]')];
    const panels = [...root.querySelectorAll('[data-evidence-panel]')];
    const theatre = root.querySelector('.pipeline-theatre,.retrieval-theatre,.operations-theatre');
    const play = root.querySelector('[data-evidence-play]');
    const replay = root.querySelector('[data-evidence-replay]');
    const progress = root.querySelector('.evidence-progress');
    const position = root.querySelector('.evidence-position');
    const spacing = 2.4;
    let timeline, seek, active = 0, mode = 'ready', seen = false, inView = false;
    let resumeWhenVisible = false, destroyed = false, width = 0;

    function status(next) {
      mode = next;
      root.dataset.playback = mode;
      play.textContent = mode === 'playing' ? 'Pause story' : mode === 'paused' ? 'Resume story' : mode === 'complete' ? 'Replay story' : 'Play story';
      play.setAttribute('aria-pressed', String(mode === 'playing'));
    }
    function sync() {
      const time = timeline.time();
      active = Math.min(steps.length - 1, Math.round(time / spacing));
      root.dataset.step = String(active);
      root.dataset.motionProgress = timeline.progress().toFixed(3);
      steps.forEach((button, i) => button.setAttribute('aria-pressed', String(active === i)));
      panels.forEach((panel, i) => { panel.hidden = active !== i; });
      position.textContent = `${String(active + 1).padStart(2, '0')} / ${String(steps.length).padStart(2, '0')} · ${steps[active].textContent.replace(/^\d+\s*/, '')}`;
      progress.setAttribute('aria-valuenow', String(Math.round(timeline.progress() * 100)));
      progress.querySelector('i').style.transform = `scaleX(${timeline.progress()})`;
    }
    function stop() {
      seek?.kill(); seek = null;
      timeline?.pause(); resumeWhenVisible = false;
    }
    function select(index, instant = false) {
      stop(); seen = true;
      status('ready');
      const time = spacing * index;
      if (reduced.matches || instant) { timeline.time(time); sync(); }
      else seek = g.to(timeline, {time, duration: .72, ease: 'power2.inOut', onUpdate: sync, onComplete: () => { seek = null; sync(); }});
    }
    function run(restart = false) {
      stop(); seen = true;
      if (reduced.matches) { select(steps.length - 1, true); return; }
      if (restart || timeline.progress() > .995 || (active === steps.length - 1 && mode !== 'paused')) timeline.pause(0);
      status('playing'); timeline.play();
    }
    function makeTimeline() {
      const oldTime = timeline?.time() || 0;
      const oldMode = mode;
      seek?.kill(); seek = null;
      timeline?.kill();
      timeline = g.timeline({paused: true, defaults: {duration: .9, ease: 'power2.inOut'}, onUpdate: sync, onComplete: () => status('complete')});
      const width = theatre.clientWidth;
      if (kind === 'pipeline') {
        const papers = [...theatre.querySelectorAll('.paper')];
        const gap = Math.min(width * .29, 166);
        const poses = [
          [[-gap * .65, 5, -12, -16, 1, 1], [-gap * .32, 28, 0, -12, .84, .18], [gap * .15, 45, 9, -14, .78, .12]],
          [[-gap, 20, -12, -18, .85, .72], [0, -6, 2, -8, 1, 1], [gap, 36, 12, -16, .84, .25]],
          [[-gap, 28, -14, -16, .82, .58], [0, -16, -7, -10, 1.04, 1], [gap, 30, 10, -14, .82, .35]],
          [[-gap, 22, -10, -16, .82, .6], [0, 28, -3, -12, .82, .6], [gap * .84, -8, 4, -6, 1.03, 1]]
        ];
        const vars = v => ({x: v[0], y: v[1], rotationZ: v[2], rotationY: v[3], scale: v[4], opacity: v[5]});
        g.set(papers, {left: '50%', top: 20, xPercent: -50, transformPerspective: 950});
        poses[0].forEach((v, i) => g.set(papers[i], vars(v)));
        poses.slice(1).forEach((pose, index) => pose.forEach((v, i) => timeline.to(papers[i], vars(v), (index + 1) * spacing - .9)));
        const scan = theatre.querySelector('.extraction-scan');
        g.set(scan, {opacity: 0, y: 0});
        timeline.to(scan, {opacity: 1, duration: .1}, 1.8).to(scan, {y: 156, duration: .85, ease: 'none'}, 1.9).to(scan, {opacity: 0, duration: .2}, 2.8);
        const route = theatre.querySelector('.route-signal');
        g.set(route, {strokeDasharray: 1, strokeDashoffset: 1, opacity: 0});
        timeline.to(route, {opacity: 1, duration: .15}, spacing * 2 - .7).to(route, {strokeDashoffset: 0, duration: 1.25, ease: 'power1.inOut'}, spacing * 2 - .55);
        timeline.fromTo(theatre.querySelector('.recovery-loop'), {opacity: .55}, {opacity: 1, duration: .4}, spacing * 2 - .5);
      } else if (kind === 'retrieval') {
        const rows = [...theatre.querySelectorAll('.ranked-list>div')];
        const query = theatre.querySelector('.query-card');
        g.set(query, {x: 0, rotationY: -8});
        g.set(rows, {x: 65, y: i => -i * 32, scale: .92, opacity: .15});
        const tick = theatre.querySelector('.ranked-list i');
        g.set(tick, {opacity: 0, scale: .75});
        timeline.to(query, {x: -10, rotationY: 0}, spacing - .9)
          .to(rows, {x: 0, y: 0, scale: 1, opacity: 1, stagger: .14}, spacing - .8)
          .to(rows[0], {x: -14, scale: 1.025}, spacing * 2 - .7)
          .to(rows.slice(1), {x: 12, opacity: .5, scale: .97, stagger: .08}, spacing * 2 - .7)
          .to(tick, {opacity: 1, scale: 1, duration: .3}, spacing * 2 - .25);
      } else {
        const nodes = [...theatre.querySelectorAll('.ops-node')];
        const track = theatre.querySelector('.ops-flow-track i');
        const branch = theatre.querySelector('.ops-branch');
        const ledger = theatre.querySelector('.ops-ledger');
        const diagnosis = theatre.querySelector('.ops-diagnosis');
        g.set(nodes,{opacity:i=>i===0?1:.45,y:i=>i===0?0:8});
        g.set(track,{scaleX:0});g.set(branch,{opacity:.35,y:8});
        g.set(ledger,{opacity:.3,y:20,rotationY:-8});g.set(diagnosis,{opacity:.25,y:12});
        [1,2,3].forEach(i=>{
          timeline.to(nodes[i],{opacity:1,y:0},spacing*i-.8)
            .to(track,{scaleX:i/3},spacing*i-.8);
        });
        timeline.to(branch,{opacity:1,y:0},spacing-.6)
          .to(ledger,{opacity:1,y:0,rotationY:0},spacing*2-.8)
          .to(diagnosis,{opacity:1,y:0},spacing*3-.8);
      }
      // A brief readable hold at the end; never loop automatically.
      timeline.to({}, {duration: .9}, spacing * (steps.length - 1));
      timeline.time(Math.min(oldTime, timeline.duration())); sync();
      if (oldMode === 'playing' && !reduced.matches) { status('playing'); timeline.play(); }
    }

    root.dataset.motionReady = 'true';
    root.querySelector('.evidence-controls').hidden = false;
    root.querySelector('.evidence-playback').hidden = false;
    makeTimeline(); status('ready');
    const observer = new IntersectionObserver(entries => {
      inView = entries[0].isIntersecting;
      if (!inView && mode === 'playing') { timeline.pause(); resumeWhenVisible = true; status('paused'); }
      else if (inView && !document.hidden && !reduced.matches) {
        if (!seen && !location.hash) run();
        else if (resumeWhenVisible) { resumeWhenVisible = false; status('playing'); timeline.play(); }
      }
    }, {threshold: .35});
    observer.observe(theatre);
    steps.forEach((button, i) => button.addEventListener('click', event => select(i, event.detail === 0)));
    play.addEventListener('click', () => {
      if (mode === 'playing') { stop(); status('paused'); }
      else run();
    });
    replay.addEventListener('click', () => run(true));
    function modeChanged() {
      stop(); root.dataset.reduced = String(reduced.matches);
      timeline.time(active * spacing); sync(); status('ready');
    }
    root.dataset.reduced = String(reduced.matches);
    reduced.addEventListener('change', modeChanged);
    const resize = new ResizeObserver(() => {
      const next = Math.round(theatre.clientWidth);
      if (next !== width) { width = next; makeTimeline(); }
    });
    resize.observe(theatre);
    function visibilityChanged() {
      if (document.hidden && mode === 'playing') { timeline.pause(); resumeWhenVisible = true; status('paused'); }
      else if (!document.hidden && inView && resumeWhenVisible && !reduced.matches) { resumeWhenVisible = false; status('playing'); timeline.play(); }
    }
    document.addEventListener('visibilitychange', visibilityChanged);
    window.addEventListener('pagehide', event => {
      stop(); status('paused');
      if (event.persisted) return;
      destroyed = true; observer.disconnect(); resize.disconnect(); timeline.kill();
      reduced.removeEventListener('change', modeChanged);
      document.removeEventListener('visibilitychange', visibilityChanged);
    });
    window.addEventListener('pageshow', event => {
      if (event.persisted && !destroyed) { sync(); status('ready'); }
    });
  });
})();
