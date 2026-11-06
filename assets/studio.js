/* Progressive enhancement: all page content is readable before this file runs. */
(() => {
  'use strict';
  const gsap = window.gsap;
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  document.querySelectorAll('[data-print]').forEach(button => {
    button.addEventListener('click', () => window.print());
  });
  const system = document.querySelector('.system');
  if (!system) return;
  const data = JSON.parse(document.getElementById('system-stage-data').textContent);
  const nodes = [...system.querySelectorAll('[data-stage]')];
  const paths = [...system.querySelectorAll('[data-connector]')];
  const detail = system.querySelector('.stage-detail');
  const play = system.querySelector('[data-play]');
  const reset = system.querySelector('[data-reset]');
  const playLabel = play.querySelector('span');
  const dot = system.querySelector('.signal-point');
  const points = [[52,38], [156,38], [260,38], [364,38], [468,38]];
  let timeline = null;
  let timer = null;
  let selection = 0;
  let mode = 'idle';
  let approved = false;

  function cancel() {
    if (timeline) { timeline.kill(); timeline = null; }
    if (timer !== null) { window.clearTimeout(timer); timer = null; }
    if (gsap) gsap.killTweensOf(dot);
  }
  function controls(nextMode) {
    mode = nextMode;
    playLabel.textContent = mode === 'running' ? 'Pause walkthrough' : mode === 'waiting' ? 'Approve' : mode === 'complete' ? 'Replay walkthrough' : 'Play walkthrough';
    play.toggleAttribute('data-waiting', mode === 'waiting');
    system.dataset.mode = mode;
  }
  function select(index, animate = true) {
    if (index === 4 && !approved) index = 3;
    selection = index;
    nodes.forEach((node, i) => {
      node.classList.toggle('is-active', i === index);
      node.setAttribute('aria-pressed', String(i === index));
    });
    paths.forEach(path => path.classList.toggle('is-traversed', Number(path.dataset.connector) <= index));
    detail.dataset.selected = String(index);
    detail.querySelector('.stage-label').textContent = data[index].name;
    detail.querySelector('h2').textContent = data[index].title;
    detail.querySelector('.stage-copy').textContent = data[index].detail;
    if (gsap && animate && !motion.matches) {
      gsap.fromTo(detail, {opacity: .5, y: 4}, {opacity: 1, y: 0, duration: .22, overwrite: true, clearProps: 'opacity,transform'});
      gsap.to(dot, {attr: {cx: points[index][0], cy: points[index][1]}, duration: .35, ease: 'power2.out', overwrite: true});
    } else {
      dot.setAttribute('cx', points[index][0]);
      dot.setAttribute('cy', points[index][1]);
      if (gsap) { gsap.killTweensOf(detail); gsap.set(detail, {clearProps:'opacity,transform'}); }
    }
  }
  function arrive(index) {
    select(index);
    if (index === 3) controls('waiting');
  }
  function runToApproval(start) {
    cancel();
    controls('running');
    if (motion.matches) { select(3, false); controls('waiting'); return; }
    if (gsap) {
      timeline = gsap.timeline();
      for (let i = start; i <= 3; i++) timeline.call(() => arrive(i), null, (i - start + 1) * .8);
      return;
    }
    // Keep the illustrative interaction functional if the animation dependency fails.
    function step(index) {
      timer = window.setTimeout(() => {
        timer = null;
        arrive(index);
        if (index < 3) step(index + 1);
      }, 800);
    }
    step(start);
  }
  nodes.forEach((node, index) => {
    node.disabled = false;
    node.addEventListener('click', () => {
      cancel();
      select(index);
      controls(selection === 3 ? 'waiting' : selection === 4 ? 'complete' : 'idle');
    });
  });
  play.addEventListener('click', () => {
    if (mode === 'running') { cancel(); controls('idle'); return; }
    if (mode === 'waiting') { cancel(); approved = true; select(4); controls('complete'); return; }
    if (selection >= 3) select(0, false);
    runToApproval(selection + 1);
  });
  reset.addEventListener('click', () => { cancel(); approved = false; select(0, false); controls('idle'); });
  motion.addEventListener('change', () => {
    cancel();
    select(selection, false);
    controls(selection === 3 ? 'waiting' : selection === 4 ? 'complete' : 'idle');
  });
  window.addEventListener('pagehide', cancel);
  system.querySelector('[data-fallback]').hidden = true;
  system.querySelector('.walkthrough-controls').hidden = false;
  controls('idle');
})();
