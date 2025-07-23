// --- Video URL y resume logic ---
window.addEventListener('DOMContentLoaded', () => {
  const video = document.getElementById('mainVideo');
  const urlInput = document.getElementById('videoUrlInput');
  const saveBtn = document.getElementById('saveUrlBtn');
  const reloadBtn = document.getElementById('reloadBtn');
  const backBtn = document.getElementById('backBtn');
  const toolbar = document.getElementById('topbar');
  const fileBrowser = document.getElementById('fileBrowser');

  // Extensiones válidas para el tag <video>
  const VALID_VIDEO_EXTENSIONS = ['.mp4', '.webm', '.ogg'];

  function isValidVideoUrl(url) {
    try {
      const u = new URL(url, window.location.href);
      return VALID_VIDEO_EXTENSIONS.some((ext) =>
        u.pathname.toLowerCase().endsWith(ext)
      );
    } catch {
      return false;
    }
  }

  // Decide qué mostrar según la URL actual
  function updateViewFromUrl(url) {
    // Actualiza el input siempre que se cambie el recurso
    urlInput.value = url || '';
    if (url && isValidVideoUrl(url)) {
      video.src = url;
      video.style.display = '';
      fileBrowser.style.display = 'none';
      video.focus();
    } else {
      fileBrowser.src = url || '';
      fileBrowser.style.display = '';
      video.style.display = 'none';
      fileBrowser.focus();
    }
  }

  // Botón para volver atrás (mostrar file browser y ocultar video)
  backBtn.addEventListener('click', () => {
    video.pause();
    // Al volver atrás, poner la URL del home (iframe)
    const homeUrl = localStorage.getItem('homeUrl') || fileBrowser.src || '';
    updateViewFromUrl(homeUrl);
  });

  // Guardar la URL "home" (la del iframe inicial) para poder volver a ella
  const initialHomeUrl =
    document.getElementById('fileBrowser').getAttribute('src') || '';
  localStorage.setItem('homeUrl', initialHomeUrl);

  // Al cargar, usar la URL del input o la guardada
  const savedUrl = localStorage.getItem('videoUrl') || '';
  if (savedUrl) {
    updateViewFromUrl(savedUrl);
  } else {
    updateViewFromUrl(initialHomeUrl);
  }

  // Interceptar clicks en el iframe para detectar mp4 y mostrar el video
  fileBrowser.addEventListener('load', () => {
    try {
      const doc =
        fileBrowser.contentDocument || fileBrowser.contentWindow.document;
      doc.addEventListener(
        'click',
        function (e) {
          let el = e.target;
          while (el && el.tagName !== 'A') el = el.parentElement;
          if (el && el.tagName === 'A') {
            const href = el.getAttribute('href');
            if (href && /\.mp4(?:$|\?)/i.test(href)) {
              e.preventDefault();
              e.stopPropagation();
              // Construir URL absoluta
              let absUrl = href;
              if (!/^https?:\/\//.test(href)) {
                const base = new URL(fileBrowser.src);
                absUrl = new URL(href, base).toString();
              }
              localStorage.setItem('videoUrl', absUrl);
              updateViewFromUrl(absUrl);
            }
          }
        },
        true
      );
    } catch (err) {
      // Puede fallar por CORS si el servidor no permite acceso
      console.error('No se pudo acceder al contenido del iframe:', err);
    }
  });

  // ...existing code...

  // Guardar nueva URL
  saveBtn.addEventListener('click', () => {
    const url = urlInput.value.trim();
    localStorage.setItem('videoUrl', url);
    // Reiniciar posiciones guardadas para el nuevo video
    localStorage.removeItem('videoPositions');
    updateViewFromUrl(url);
    if (!isValidVideoUrl(url) && url) {
      alert(
        'La URL no es un vídeo compatible. Se mostrará el contenido como navegador de archivos. Vídeos válidos: ' +
          VALID_VIDEO_EXTENSIONS.join(', ')
      );
    }
  });

  // Función para restaurar la posición del vídeo si coincide el tamaño
  function restoreVideoPosition() {
    const positionsRaw = localStorage.getItem('videoPositions');
    let positions = {};
    if (positionsRaw) {
      try {
        positions = JSON.parse(positionsRaw);
      } catch {
        console.error('Error parsing video positions:', positionsRaw);
      }
    }
    const currentSize = video.duration;
    if (
      !isNaN(currentSize) &&
      positions &&
      Object.hasOwn(positions, currentSize)
    ) {
      video.currentTime = parseFloat(positions[currentSize]);
    }
  }

  // Restaurar la posición guardada solo si coincide el tamaño
  video.addEventListener('loadedmetadata', restoreVideoPosition);

  // Recargar el video manualmente y restaurar tiempo
  reloadBtn.addEventListener('click', () => {
    video.load();
    video.addEventListener('loadedmetadata', restoreVideoPosition, {
      once: true
    });
  });

  // Guardar la posición y tamaño cada vez que cambie
  video.addEventListener('timeupdate', () => {
    const positionsRaw = localStorage.getItem('videoPositions');
    let positions = {};
    if (positionsRaw) {
      try {
        positions = JSON.parse(positionsRaw);
      } catch {
        console.error('Error parsing video positions:', positionsRaw);
      }
    }
    const currentSize = video.duration;
    if (!isNaN(currentSize)) {
      positions[currentSize] = video.currentTime;
      localStorage.setItem('videoPositions', JSON.stringify(positions));
    }
  });

  // Hacer los elementos del toolbar y el video focuseables
  [urlInput, saveBtn, reloadBtn, backBtn, video].forEach((el) => {
    if (el) el.setAttribute('tabindex', '0');
  });

  // Resaltar al enfocar (añado el video)
  const style = document.createElement('style');
  style.textContent = `
    #topbar input:focus, #topbar button:focus, #mainVideo:focus {
      outline: 2px solid #00bfff !important;
      z-index: 2;
    }
  `;
  document.head.appendChild(style);

  // Navegación avanzada con flechas y enter (incluye el video)
  const ARROW_KEY_CODE = { 37: 'left', 38: 'up', 39: 'right', 40: 'down' };
  const focusables = [urlInput, saveBtn, reloadBtn, backBtn, video];

  toolbar.addEventListener(
    'keydown',
    (evt) => {
      if (evt.keyCode in ARROW_KEY_CODE) {
        const direction = ARROW_KEY_CODE[evt.keyCode];
        const currentIndex = focusables.indexOf(document.activeElement);
        let nextIndex = currentIndex;
        if (direction === 'right' || direction === 'down') {
          nextIndex = (currentIndex + 1) % focusables.length;
        } else if (direction === 'left' || direction === 'up') {
          nextIndex =
            (currentIndex - 1 + focusables.length) % focusables.length;
        }
        focusables[nextIndex].focus();
        evt.preventDefault();
        evt.stopPropagation();
      } else if (evt.keyCode === 13) {
        // Enter
        if (document.activeElement) {
          document.activeElement.click();
          evt.preventDefault();
          evt.stopPropagation();
        }
      }
    },
    true
  );

  // Si el focus está en el vídeo y se pulsa flecha arriba, enfocar el input
  video.addEventListener('keydown', (evt) => {
    if (evt.keyCode === 38) {
      urlInput.focus();
      evt.preventDefault();
      evt.stopPropagation();
    }
  });

  // Si se pulsa flecha arriba mientras el video está en play, mostrar toolbar y enfocar input
  video.addEventListener('keydown', (evt) => {
    if (evt.keyCode === 38) {
      // ArrowUp
      if (!video.paused) {
        showToolbar();
      }
      urlInput.focus();
      evt.preventDefault();
      evt.stopPropagation();
    }
  });

  function hideToolbar() {
    video.requestFullscreen();
  }
  function showToolbar() {
    document.exitFullscreen();
  }

  // Mostrar toolbar si se pausa o se hace back
  video.addEventListener('pause', showToolbar);
  document.addEventListener('keydown', (evt) => {
    if (evt.keyCode === 461) {
      // 'back' key
      showToolbar();
      evt.preventDefault();
      evt.stopPropagation();
    }
  });
  // También mostrar si el foco sale del video
  video.addEventListener('blur', showToolbar);

  // Ocultar toolbar si el vídeo está en play
  video.addEventListener('play', () => {
    hideToolbar();
  });
});

/**
 * Force babel to interpret this file as ESM so it
 * polyfills with ESM imports instead of CommonJS.
 */
export {};
