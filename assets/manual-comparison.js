// The checkbox also operates without JavaScript. Dragging changes the same state.
for (const figure of document.querySelectorAll('.manual-comparison')) {
  const sheet = figure.querySelector('[data-identity-sheet]');
  const book = figure.querySelector('.mc-book');
  const toggle = figure.querySelector('input');
  let gesture;
  sheet.dataset.draggable = '';
  sheet.title = 'Drag the filename over the model plate, or use the Compare model IDs switch.';

  function finish(commit) {
    if (!gesture) return;
    const { id, active, position } = gesture;
    gesture = null;
    if (active && commit && toggle.checked !== (position >= 0.5)) {
      toggle.checked = position >= 0.5;
      toggle.dispatchEvent(new Event('change', { bubbles: true }));
    }
    delete figure.dataset.dragging;
    figure.style.removeProperty('--alignment');
    if (sheet.hasPointerCapture(id)) sheet.releasePointerCapture(id);
  }

  sheet.addEventListener('pointerdown', event => {
    if (gesture || !event.isPrimary || event.button !== 0) return;
    const initial = Number(toggle.checked);
    gesture = { id: event.pointerId, x: event.clientX, y: event.clientY,
      initial, position: initial, distance: book.clientWidth / 2, active: false };
    sheet.setPointerCapture(event.pointerId);
  });

  sheet.addEventListener('pointermove', event => {
    if (!gesture || gesture.id !== event.pointerId) return;
    const dx = event.clientX - gesture.x;
    const dy = event.clientY - gesture.y;
    if (!gesture.active) {
      if (Math.max(Math.abs(dx), Math.abs(dy)) < 5) return;
      if (Math.abs(dy) > Math.abs(dx)) { finish(false); return; }
      gesture.active = true;
      figure.dataset.dragging = '';
    }
    gesture.position = Math.min(1, Math.max(0, gesture.initial + dx / gesture.distance));
    figure.style.setProperty('--alignment', gesture.position);
  });
  sheet.addEventListener('pointerup', event => { if (gesture?.id === event.pointerId) finish(true); });
  for (const type of ['pointercancel', 'lostpointercapture']) {
    sheet.addEventListener(type, event => { if (gesture?.id === event.pointerId) finish(false); });
  }
}
