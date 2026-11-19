/* The preference example uses a native switch. Only upload routing needs script. */
(() => {
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
  for (const exhibit of document.querySelectorAll('[data-agent-exhibit="upload"]')) {
    const buttons = [...exhibit.querySelectorAll('[data-agent-step]')];
    const panels = [...exhibit.querySelectorAll('[data-agent-panel]')];
    const status = exhibit.querySelector('[data-agent-status]');
    let active = 0;

    function show(index) {
      buttons.forEach((button, i) => button.setAttribute('aria-pressed', String(i === index)));
      panels.forEach((panel, i) => { panel.hidden = i !== index; });
      exhibit.dataset.step = String(index);
      status.textContent = 'Viewing ' + buttons[index].textContent;
      if (index !== active && window.gsap && !reduceMotion.matches) {
        const targets = panels[index].children;
        window.gsap.killTweensOf(targets);
        window.gsap.fromTo(targets, {y:12, rotationZ:0}, {
          y:0, rotationZ:i => i === 0 ? -3 : i === 2 ? 2 : 0,
          duration:.42, ease:'power2.out', stagger:.055, clearProps:'transform'
        });
      }
      active = index;
    }
    exhibit.dataset.enhanced = 'true';
    exhibit.querySelector('.agent-evidence-controls').hidden = false;
    buttons.forEach((button, i) => button.addEventListener('click', () => show(i)));
    show(0);
  }
})();
