/**
 * Visor audiovisual dedicado. Cada portada de la revista abre esta página
 * con un identificador de video en la URL.
 */
'use strict';

const VIDEOS = {
  spot: {
    kicker: 'PRODUCCIÓN AUDIOVISUAL',
    title: 'Spot Literario: Una Historia en Imágenes',
    issue: 'PIEZA 01',
    description: 'Un homenaje visual a la intensidad, la belleza y la memoria de la Generación Decapitada.',
    page: 6,
    sources: [
      { src: '../Videos/copy_C431B0A3-306B-45F3-8279-C6B0930B7AB1.mp4', type: 'video/mp4' },
    ],
  },
  voz: {
    kicker: 'RECREACIÓN HISTÓRICA CON IA',
    title: 'La Voz del Más Allá: Medardo Ángel Silva',
    issue: 'PIEZA 02',
    description: 'Una conversación imaginada con Medardo Ángel Silva, recreada mediante Inteligencia Artificial.',
    page: 7,
    sources: [
      { src: '../Videos/copy_E065FDA7-4161-429E-88A1-007ED286F624.mp4', type: 'video/mp4' },
    ],
  },
};

function initVideoPage() {
  const requestedVideo = new URLSearchParams(window.location.search).get('video');
  const videoData = VIDEOS[requestedVideo] || VIDEOS.spot;
  const videoEl = document.getElementById('watchVideo');

  document.title = `${videoData.title} · Las Voces que Florecieron en la Sombra`;
  document.getElementById('watchKicker').textContent = videoData.kicker;
  document.getElementById('watchTitle').textContent = videoData.title;
  document.getElementById('watchIssue').textContent = videoData.issue;
  document.getElementById('watchDescription').textContent = videoData.description;

  const returnUrl = `index.html?page=${videoData.page}`;
  document.getElementById('watchBack').href = returnUrl;
  document.getElementById('watchReturn').href = returnUrl;

  videoData.sources.forEach(({ src, type }) => {
    const source = document.createElement('source');
    source.src = src;
    source.type = type;
    videoEl.appendChild(source);
  });
  videoEl.setAttribute('aria-label', videoData.title);
  videoEl.load();

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && !videoEl.paused) videoEl.pause();
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') window.location.href = returnUrl;
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initVideoPage);
} else {
  initVideoPage();
}
