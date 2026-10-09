/* Native controls enhance an otherwise fully readable portfolio overview. */
(() => {
  'use strict';
  const overview = document.querySelector('[data-overview]');
  if (!overview) return;
  const gsap = window.gsap;
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const nodes = [...overview.querySelectorAll('[data-area]')];
  const panels = [...overview.querySelectorAll('[data-area-panel]')];
  const wires = [...overview.querySelectorAll('[data-wire]')];
  const intro = overview.querySelector('[data-overview-intro]');
  const reset = overview.querySelector('[data-overview-reset]');
  const status = overview.querySelector('[data-overview-status]');
  let selected = null;
  const stop = () => {
    if (!gsap) return;
    gsap.killTweensOf(panels);
    gsap.set(panels, {clearProps: 'opacity,transform'});
  };
  function select(key, announce = true) {
    stop();
    selected = key;
    overview.dataset.selected = key || 'all';
    nodes.forEach(node => {
      const active = node.dataset.area === key;
      node.setAttribute('aria-pressed', String(active));
      node.classList.toggle('is-selected', active);
    });
    wires.forEach(wire => wire.classList.toggle('is-selected', wire.dataset.wire === key));
    panels.forEach(panel => { panel.hidden = panel.dataset.areaPanel !== key; });
    intro.hidden = key !== null;
    reset.hidden = key === null;
    const activePanel = panels.find(panel => panel.dataset.areaPanel === key);
    if (activePanel && gsap && !motion.matches) {
      gsap.fromTo(activePanel, {opacity: .6, y: 5}, {opacity: 1, y: 0, duration: .22, overwrite: true, clearProps: 'opacity,transform'});
    }
    if (announce) status.textContent = activePanel ? `${activePanel.querySelector('h3').textContent}: contribution and supporting work shown below.` : 'All three areas shown.';
  }
  nodes.forEach(node => {
    node.disabled = false;
    node.addEventListener('click', () => select(selected === node.dataset.area ? null : node.dataset.area));
  });
  reset.addEventListener('click', () => {
    const previous = nodes.find(node => node.dataset.area === selected);
    select(null);
    if (previous) previous.focus();
  });
  motion.addEventListener('change', stop);
  window.addEventListener('pagehide', stop);
  overview.querySelector('.overview-hint').hidden = false;
  select(null, false);
  if (gsap) {
    const media = gsap.matchMedia();
    media.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.timeline({defaults: {ease: 'power2.out'}})
        .from('.hero-copy', {y: 12, opacity: .5, duration: .55, clearProps: 'opacity,transform'}, 0)
        .from(overview, {y: 8, opacity: .5, duration: .55, clearProps: 'opacity,transform'}, .12);
    });
  }
})();
