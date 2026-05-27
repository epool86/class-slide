// ============ Deck navigation ============
const slides = Array.from(document.querySelectorAll('.slide'));
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const counter = document.getElementById('counter');
const sectionLabel = document.getElementById('sectionLabel');

let current = 0;

function show(i) {
  current = Math.max(0, Math.min(slides.length - 1, i));
  slides.forEach((s, idx) => s.classList.toggle('active', idx === current));
  counter.textContent = `${current + 1} / ${slides.length}`;
  sectionLabel.textContent = slides[current].dataset.section || '';
  prevBtn.disabled = current === 0;
  nextBtn.disabled = current === slides.length - 1;

  // Persist position
  try { localStorage.setItem('deck-pos', String(current)); } catch {}

  // Update URL hash for shareable links
  history.replaceState(null, '', `#${current + 1}`);
}

prevBtn.addEventListener('click', () => show(current - 1));
nextBtn.addEventListener('click', () => show(current + 1));

document.addEventListener('keydown', (e) => {
  // Don't hijack arrow keys while editing code blocks
  if (e.target.isContentEditable) return;

  if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') {
    e.preventDefault();
    show(current + 1);
  } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
    e.preventDefault();
    show(current - 1);
  } else if (e.key === 'Home') {
    show(0);
  } else if (e.key === 'End') {
    show(slides.length - 1);
  }
});

// Restore position from URL hash or localStorage
const fromHash = parseInt(location.hash.slice(1), 10);
const fromStorage = parseInt(localStorage.getItem('deck-pos') || '0', 10);
const startAt = !isNaN(fromHash) && fromHash > 0 ? fromHash - 1 : (fromStorage || 0);
show(startAt);

// ============ Pan & zoom for the flow diagram ============
const diagramWrap = document.getElementById('diagramWrap');
const diagram = document.getElementById('flowDiagram');

if (diagramWrap && diagram) {
  let scale = 1;
  let tx = 0;
  let ty = 0;
  let dragging = false;
  let startX = 0;
  let startY = 0;

  function apply() {
    diagram.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
  }

  diagramWrap.addEventListener('wheel', (e) => {
    e.preventDefault();
    const rect = diagramWrap.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    const delta = -e.deltaY * 0.0015;
    const newScale = Math.max(0.4, Math.min(5, scale * (1 + delta)));
    const ratio = newScale / scale;

    // Zoom around mouse pointer
    tx = mx - (mx - tx) * ratio;
    ty = my - (my - ty) * ratio;
    scale = newScale;

    apply();
  }, { passive: false });

  diagramWrap.addEventListener('mousedown', (e) => {
    dragging = true;
    startX = e.clientX - tx;
    startY = e.clientY - ty;
  });

  window.addEventListener('mousemove', (e) => {
    if (!dragging) return;
    tx = e.clientX - startX;
    ty = e.clientY - startY;
    apply();
  });

  window.addEventListener('mouseup', () => { dragging = false; });

  diagramWrap.addEventListener('dblclick', () => {
    scale = 1; tx = 0; ty = 0; apply();
  });

  // Touch support (basic — single-finger pan)
  diagramWrap.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1) {
      dragging = true;
      startX = e.touches[0].clientX - tx;
      startY = e.touches[0].clientY - ty;
    }
  });

  diagramWrap.addEventListener('touchmove', (e) => {
    if (dragging && e.touches.length === 1) {
      tx = e.touches[0].clientX - startX;
      ty = e.touches[0].clientY - startY;
      apply();
    }
  }, { passive: true });

  diagramWrap.addEventListener('touchend', () => { dragging = false; });
}
