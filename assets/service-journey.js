// All decisions stay in this page. Scrolling changes only the illustration.
(() => {
 'use strict';
 const root = document.querySelector('[data-service-journey]');
 if (!root) return;
 const poses={
 understand:{
 phone:[[125,0,1,-5,1],[30,0,1,-5,1],[0,0,1,-5,1],[0,0,1,-5,1]],
 record:[[-35,95,.76,4,.4],[0,0,1,5,1],[0,0,1,5,1],[0,0,1,5,1]],
 manual:[[-110,-35,.7,-3,0],[-75,-15,.8,-3,.25],[0,0,1,7,1],[0,0,1,7,1]],
 decision:[[0,-32,.88,0,0],[0,-25,.9,0,0],[0,-12,.95,0,.2],[0,0,1,0,1]]},
 prepare:{
 case:[[140,8,1,-6,1],[0,0,1,-6,1],[0,0,1,-6,1],[0,-8,1,-6,1]],
 provider:[[-120,80,.75,-6,0],[0,0,1,4,1],[0,0,1,4,1],[0,0,1,4,1]],
 times:[[-100,-70,.75,-6,0],[-60,-40,.85,0,.15],[0,0,1,4,1],[0,0,1,4,1]],
 },
 call:{
 ai:[[0,-45,.8,-4,.2],[0,0,1,-4,1],[0,0,1,-4,1],[0,0,1,-4,1]],
 connection:[[0,0,.7,-26,0],[0,0,1,-26,1],[0,0,1,-26,1],[0,0,1,-26,1]],
 reply:[[-90,70,.75,-7,0],[-25,20,.9,4,.55],[0,0,1,4,1],[0,0,1,4,1]],
 calendar:[[-45,-80,.75,4,0],[-45,-80,.75,4,0],[-20,-30,.9,4,.25],[0,0,1,5,1]]}
 };
 const find = selector => root.querySelector(selector);
 const motion = matchMedia('(prefers-reduced-motion: reduce)');
 const phone = matchMedia('(max-width: 600px)');
 const gsap = window.gsap;
 const trigger = window.ScrollTrigger;
 const animate = Boolean(gsap && trigger);
 const scenes = [];
 const callScene = find('[data-sj-scene="call"]');
 const modeButton = find('[data-sj-static]');
 const approve = find('[data-sj-approve]');
 const reset = find('[data-sj-reset]');
 const replies = [...root.querySelectorAll('[data-sj-outcome]')];
 let expanded = false;
 let approved = false;
 let outcome = '';

 function draw(scene) {
   if (!animate || document.hidden) return;
   const progress = expanded || motion.matches || (approved && scene.el === callScene) ? 1 : scene.trigger.progress;
   const frame = progress * 3;
   const start = Math.min(2, Math.floor(frame));
   scene.el.dataset.step = String(Math.round(frame));
   for (const piece of scene.pieces) {
     const positions = poses[scene.el.dataset.sjScene][piece.dataset.piece];
     const values = positions[start].map((n,i) => n + (positions[start+1][i]-n)*(frame-start));
     const [x, y, scale, rotation, alpha] = values;
     const transform = phone.matches
       ? {x:0, y:motion.matches ? 0 : (1-alpha)*10, scale:motion.matches ? 1 : .98+alpha*.02, rotation:0, autoAlpha:1}
       : {x,y,scale,rotation,autoAlpha:alpha};
     gsap.set(piece, transform);
   }
 }
 function refresh() {
   scenes.forEach(draw);
   modeButton.hidden = !animate || motion.matches;
   modeButton.setAttribute('aria-pressed', String(expanded));
   const active = approved && !outcome && !document.hidden && !motion.matches;
   callScene.dataset.activeCall = String(active && scenes.some(s => s.el === callScene && s.trigger.isActive));
 }
 function syncDecision() {
   const confirmed = approved && outcome === 'confirmed';
   const followup = approved && outcome === 'followup';
   root.dataset.approved = String(approved);
   root.dataset.outcome = outcome;
   approve.disabled = approved;
   approve.textContent = approved ? 'Call approved' : 'Approve call';
   find('.sj-responses').hidden = !approved;
   reset.hidden = !approved;
   replies.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.sjOutcome === outcome)));
   find('[data-sj-speaker]').textContent = approved ? 'AI to Provider B' : 'Proposed question';
   find('[data-sj-direction]').textContent = approved ? 'AI calls Provider B' : 'Proposed call';
   find('[data-sj-call-state]').textContent = !approved ? 'Pending approval' : outcome ? 'Call complete' : 'AI speaking';
   find('[data-sj-provider-reply]').textContent = confirmed ? '“Yes, Tuesday at 10 is confirmed.”' : followup ? '“I need to check with the technician. Please call back.”' : approved ? 'The AI has asked about Tuesday at 10.' : 'The provider has not received a call.';
   find('[data-sj-provider-state]').textContent = confirmed ? 'Appointment confirmed' : followup ? 'Case remains open' : approved ? 'Awaiting provider reply' : 'Waiting for the approved call';
   find('[data-sj-event]').hidden = !confirmed;
   find('[data-sj-empty]').hidden = confirmed;
   find('[data-sj-empty]').textContent = followup ? 'No booking. Follow up on C-024.' : 'Unbooked';
   find('[data-sj-status]').textContent = confirmed ? 'Booked for Tuesday at 10. The appointment is on the calendar.' : followup ? 'Case open for follow-up. The calendar is still clear.' : approved ? 'The AI called Provider B. Choose a reply to see what happens.' : 'Awaiting permission. Calendar open.';
   refresh();
 }
 find('[data-sj-interactive]').hidden = false;
 approve.addEventListener('click', () => {
   approved = true;
   syncDecision();
   replies[0].focus({preventScroll:true});
 });
 for (const reply of replies) {
   reply.addEventListener('click', () => {
     if (!approved) return;
     outcome = reply.dataset.sjOutcome;
     syncDecision();
   });
 }
 reset.addEventListener('click', () => {
   approved = false;
   outcome = '';
   syncDecision();
   approve.focus({preventScroll:true});
 });
 modeButton.addEventListener('click', () => { expanded = !expanded; refresh(); });
 if (animate) {
   gsap.registerPlugin(trigger);
   root.classList.add('sj-enhanced');
   for (const el of root.querySelectorAll('[data-sj-scene]')) {
     const scene = {el,pieces:[...el.querySelectorAll('[data-piece]')]};
     scene.trigger = trigger.create({
       trigger:el.querySelector('.sj-stage'), start:'top 90%', end:'center 48%',
       onUpdate:() => { if (scene.trigger) draw(scene); }, onToggle:refresh
     });
     scenes.push(scene);
   }
   trigger.addEventListener('refresh',refresh);
 }
 document.addEventListener('visibilitychange', refresh);
 motion.addEventListener('change', refresh);
 phone.addEventListener('change', refresh);
 syncDecision();
})();
