/**
 * ================================================================
 *  LAS VOCES QUE FLORECIERON EN LA SOMBRA
 *  main.js — Control de navegación e interactividad editorial
 * ================================================================
 */

'use strict';

/* ─────────────────────────────────────────────
   ESTADO GLOBAL
───────────────────────────────────────────── */
const S = {
  current: 0,
  total: 8,
  busy: false,
};

const TRANSITION_MS = 860;

/* Elementos del DOM */
let pages = [];
let arrowPrev = null;
let arrowNext = null;
let dotsEl = null;
let cntCurrent = null;
let cntTotal = null;
let pageSweep = null;

/* ─────────────────────────────────────────────
   INICIALIZACIÓN
───────────────────────────────────────────── */
function init() {
  pages = Array.from(document.querySelectorAll('.pg'));
  arrowPrev = document.getElementById('arrowPrev');
  arrowNext = document.getElementById('arrowNext');
  dotsEl = document.getElementById('navDots');
  cntCurrent = document.getElementById('cntCurrent');
  cntTotal = document.getElementById('cntTotal');
  pageSweep = document.getElementById('pageSweep');

  S.total = pages.length;
  if (cntTotal) {
    cntTotal.textContent = String(S.total).padStart(2, '0');
  }

  buildDots();

  // Permite volver desde el visor de video a la página audiovisual exacta.
  const requestedPage = Number.parseInt(new URLSearchParams(window.location.search).get('page'), 10);
  const initialIndex = Number.isInteger(requestedPage) && requestedPage >= 1 && requestedPage <= S.total
    ? requestedPage - 1
    : 0;
  setPage(initialIndex);

  // Event Listeners
  arrowPrev?.addEventListener('click', () => navigate('prev'));
  arrowNext?.addEventListener('click', () => navigate('next'));
  document.addEventListener('keydown', onKeyDown);
  initTouchSwipe();

  // Pausar videos al cambiar de pestaña
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) pauseAllVideos();
  });
}

/* ─────────────────────────────────────────────
   CONSTRUCCIÓN DE INDICADORES (DOTS)
───────────────────────────────────────────── */
function buildDots() {
  if (!dotsEl) return;
  dotsEl.innerHTML = '';

  for (let i = 0; i < S.total; i++) {
    const dot = document.createElement('button');
    dot.className = 'dot';
    dot.setAttribute('type', 'button');
    dot.setAttribute('aria-label', `Ir a página ${i + 1}`);
    dot.dataset.index = i;
    dot.addEventListener('click', () => {
      if (i !== S.current) {
        jumpTo(i, i > S.current ? 'next' : 'prev');
      }
    });
    dotsEl.appendChild(dot);
  }
}

/* ─────────────────────────────────────────────
   SINCRONIZACIÓN DE LA INTERFAZ
───────────────────────────────────────────── */
function syncUI() {
  // Flechas
  arrowPrev?.classList.toggle('is-hidden', S.current === 0);
  arrowNext?.classList.toggle('is-hidden', S.current === S.total - 1);

  // Contador numérico
  if (cntCurrent) {
    cntCurrent.textContent = String(S.current + 1).padStart(2, '0');
  }

  // Dots
  const dots = dotsEl?.querySelectorAll('.dot') || [];
  dots.forEach((dot, idx) => {
    const isActive = idx === S.current;
    dot.classList.toggle('is-active', isActive);
    dot.setAttribute('aria-current', isActive ? 'page' : 'false');
  });
}

/* ─────────────────────────────────────────────
   TRANSICIÓN Y CAMBIO DE PÁGINA
───────────────────────────────────────────── */
function setPage(index) {
  pages.forEach((p, i) => {
    const active = i === index;
    p.classList.remove('is-preparing', 'is-exiting', 'is-to-next', 'is-to-prev', 'is-from-next', 'is-from-prev');
    p.classList.toggle('is-active', active);
    if (!active) {
      pauseVideosIn(p);
    }
  });

  S.current = index;
  syncUI();
}

function navigate(direction) {
  if (S.busy) return;
  const target = direction === 'next' ? S.current + 1 : S.current - 1;
  jumpTo(target, direction);
}

function jumpTo(targetIndex, direction) {
  if (S.busy) return;
  if (targetIndex < 0 || targetIndex >= S.total || targetIndex === S.current) return;

  S.busy = true;

  const currentPage = pages[S.current];
  const targetPage = pages[targetIndex];

  // Pausar cualquier video que se esté reproduciendo en la página saliente
  pauseVideosIn(currentPage);

  const exitClass = direction === 'next' ? 'is-to-next' : 'is-to-prev';
  const enterClass = direction === 'next' ? 'is-from-next' : 'is-from-prev';

  /*
   * Se prepara la página entrante en un fotograma distinto. Forzar esta
   * lectura evita que el navegador agrupe los estilos y se salte la animación.
   */
  targetPage.classList.add('is-preparing');
  void targetPage.offsetWidth;

  requestAnimationFrame(() => {
    playPageSweep(direction);
    currentPage.classList.add('is-exiting', exitClass);
    currentPage.classList.remove('is-active');
    targetPage.classList.remove('is-preparing');
    targetPage.classList.add('is-active', enterClass);

    S.current = targetIndex;
    syncUI();

    // Liberar el cambio solo después de que la hoja termine su giro.
    setTimeout(() => {
      currentPage.classList.remove('is-exiting', exitClass);
      targetPage.classList.remove(enterClass);
      S.busy = false;
    }, TRANSITION_MS);
  });
}

function playPageSweep(direction) {
  if (!pageSweep) return;
  const sweepClass = direction === 'next' ? 'is-going-next' : 'is-going-prev';
  pageSweep.className = 'page-sweep';
  // Forzar el reinicio de la animación entre cambios consecutivos.
  void pageSweep.offsetWidth;
  pageSweep.classList.add(sweepClass);
}

/* ─────────────────────────────────────────────
   CONTROL DE VIDEOS
───────────────────────────────────────────── */
function pauseVideosIn(container) {
  if (!container) return;
  const videos = container.querySelectorAll('video');
  videos.forEach(v => {
    if (!v.paused) {
      v.pause();
    }
  });
}

function pauseAllVideos() {
  pages.forEach(p => pauseVideosIn(p));
}

/* ─────────────────────────────────────────────
   NAVEGACIÓN POR TECLADO
───────────────────────────────────────────── */
function onKeyDown(e) {
  if (e.target.closest('a, button, video, input, textarea, select, [contenteditable="true"]')) return;

  switch (e.key) {
    case 'ArrowRight':
    case 'ArrowDown':
    case 'PageDown':
    case ' ':
      e.preventDefault();
      navigate('next');
      break;

    case 'ArrowLeft':
    case 'ArrowUp':
    case 'PageUp':
      e.preventDefault();
      navigate('prev');
      break;

    case 'Home':
      e.preventDefault();
      jumpTo(0, 'prev');
      break;

    case 'End':
      e.preventDefault();
      jumpTo(S.total - 1, 'next');
      break;
  }
}

/* ─────────────────────────────────────────────
   GESTOS TÁCTILES (SWIPE)
───────────────────────────────────────────── */
function initTouchSwipe() {
  let startX = 0;
  let startY = 0;
  const threshold = 45;

  document.addEventListener('touchstart', e => {
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
  }, { passive: true });

  document.addEventListener('touchend', e => {
    const deltaX = e.changedTouches[0].clientX - startX;
    const deltaY = Math.abs(e.changedTouches[0].clientY - startY);

    if (Math.abs(deltaX) > threshold && Math.abs(deltaX) > deltaY * 1.2) {
      if (deltaX < 0) {
        navigate('next');
      } else {
        navigate('prev');
      }
    }
  }, { passive: true });
}

/* ─────────────────────────────────────────────
   ARRANQUE
───────────────────────────────────────────── */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
