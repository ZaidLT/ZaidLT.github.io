// Reversible project illustrations in normal document flow. Each timeline owns its figure only.
(() => {
  const work = document.querySelector('.portfolio-work');
  const gsap = window.gsap;
  if (!work || !gsap) return;
  let manualInspected = false;

  const motion = gsap.matchMedia();
  motion.add('(prefers-reduced-motion: no-preference)', () => {
    // The intro above can change height after fonts load or the viewport changes.
    // Measure the visible art itself so no cached scroll offset can go stale.
    const timelines = new Map();
    const visible = new Set();
    let frame = 0;
    // A direct project link can land beyond the entire entrance. Show its opening once.
    const anchor = document.getElementById(location.hash.slice(1));
    const destination = anchor === work ? work.querySelector('.product-exhibit')
      : anchor?.closest('.portfolio-work article')?.querySelector('.product-exhibit, .mc-home, .cloud-cutaway');
    let arrival;
    let visitedDestination = false;

    function draw(now) {
      frame = 0;
      if (document.hidden) return;
      const height = window.innerHeight;
      const positions = [];
      for (const figure of visible) {
        const box = figure.getBoundingClientRect();
        const start = height * .94;
        const end = height * .47 - Math.min(box.height * .25, height * .15);
        let progress = Math.max(0, Math.min(1, (start - box.top) / (start - end)));
        if (figure === destination) {
          if (!visitedDestination) {
            visitedDestination = true;
            if (progress > .25) arrival = now;
          }
          if (arrival !== undefined) {
            const elapsed = Math.min(1, (now - arrival) / 850);
            progress *= elapsed * elapsed * (3 - 2 * elapsed);
            if (elapsed < 1) schedule();
            else arrival = undefined;
          }
        }
        positions.push([figure, progress]);
      }
      for (const [figure, progress] of positions) timelines.get(figure)?.progress(progress);
    }

    function schedule() {
      if (!frame && visible.size && !document.hidden) frame = requestAnimationFrame(draw);
    }

    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (entry.isIntersecting) visible.add(entry.target);
        else visible.delete(entry.target);
      }
      schedule();
    }, {rootMargin: '10% 0px'});

    function sequence(figure) {
      const timeline = gsap.timeline({paused: true, defaults: {duration: .55, ease: 'sine.inOut'}});
      timelines.set(figure, timeline);
      observer.observe(figure);
      return timeline;
    }

    const product = work.querySelector('.product-exhibit');
    const part = selector => product.querySelector(selector);
    const service = sequence(product);
    // Use individual transforms so the underlying dimensional poses stay intact.
    service.fromTo(part('.preview-context'), {translate: '48px -24px', rotate: '8deg'},
      {translate: '0px 0px', rotate: '0deg'}, 0)
      .fromTo(part('.preview-interface'), {translate: '72px 23px', rotate: '8deg'},
        {translate: '0px 0px', rotate: '0deg'}, .12)
      .fromTo(part('.preview-message'), {'--citation': 0}, {'--citation': 1, duration: .38}, .25)
      .fromTo(part('.preview-tools'), {translate: '82px 34px', rotate: '-14deg', opacity: .5},
        {translate: '0px 0px', rotate: '0deg', opacity: 1}, .47);

    const manual = work.querySelector('.mc-home');
    const paper = sequence(manual);
    paper.fromTo(manual.querySelector('.mc-verso'), {rotationY: 57}, {rotationY: 0}, 0)
      .fromTo(manual.querySelector('.mc-recto'), {rotationY: -38}, {rotationY: 0}, .04)
      .fromTo(manual.querySelector('.mc-overlay'), {translate: '18% -48px', rotate: '-10deg'},
        {translate: '0% 0px', rotate: '0deg'}, .24)
      .fromTo(manual.querySelector('.mc-plate'), {scale: .78, opacity: .6}, {scale: 1, opacity: 1}, .36);

    // From the first inspection onward the native switch or drag owns the comparison.
    function inspect() {
      manualInspected = true;
      observer.unobserve(manual);
      visible.delete(manual);
      timelines.delete(manual);
      paper.progress(1).pause();
    }
    const toggle = manual.querySelector('input');
    function dragStarted() {
      if (manual.hasAttribute('data-dragging')) inspect();
    }
    toggle.addEventListener('focus', inspect, {once:true});
    manual.addEventListener('pointermove', dragStarted);
    toggle.addEventListener('change', inspect);
    if (manualInspected || toggle.checked || manual.contains(document.activeElement)) inspect();

    const cloud = work.querySelector('.cloud-cutaway');
    const cutaway = sequence(cloud);
    cutaway.fromTo(cloud.querySelector('.cut-delivery'), {y: 96}, {y: 0, duration: .86}, 0)
      .fromTo(cloud.querySelector('.cut-access'), {y: 48}, {y: 0, duration: .7}, .14)
      .fromTo(cloud.querySelector('.cut-guides'), {opacity: 0}, {opacity: .52, duration: .42}, .3)
      .fromTo(cloud.querySelectorAll('.cut-leads path'), {strokeDashoffset: 1},
        {strokeDashoffset: 0, stagger: .09, duration: .33}, .49);

    const layout = new ResizeObserver(schedule);
    layout.observe(document.body);
    window.addEventListener('scroll', schedule, {passive: true});
    window.addEventListener('resize', schedule);
    document.addEventListener('visibilitychange', schedule);
    return () => {
      observer.disconnect();
      layout.disconnect();
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      document.removeEventListener('visibilitychange', schedule);
      cancelAnimationFrame(frame);
      toggle.removeEventListener('focus', inspect);
      manual.removeEventListener('pointermove', dragStarted);
      toggle.removeEventListener('change', inspect);
    };
  }, work);
})();
