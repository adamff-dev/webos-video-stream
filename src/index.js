// --- Video URL y resume logic ---
window.addEventListener('DOMContentLoaded', () => {
  const video = document.getElementById('mainVideo');
  const urlInput = document.getElementById('videoUrlInput');
  const saveBtn = document.getElementById('saveUrlBtn');
  const reloadBtn = document.getElementById('reloadBtn');
  const toolbar = document.getElementById('topbar');

  // Cargar URL guardada o por defecto
  const savedUrl =
    localStorage.getItem('videoUrl') || 'http://192.168.0.13:8080/v.mp4';
  urlInput.value = savedUrl;
  video.src = savedUrl;

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

  // Guardar nueva URL
  saveBtn.addEventListener('click', () => {
    const url = urlInput.value.trim();
    if (url && isValidVideoUrl(url)) {
      localStorage.setItem('videoUrl', url);
      video.src = url;
      // Reiniciar posiciones guardadas para el nuevo video
      localStorage.removeItem('videoPositions');
    } else {
      alert(
        'Invalid URL. Only HTML5 compatible videos are accepted: ' +
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
  [urlInput, saveBtn, reloadBtn, video].forEach((el) => {
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
  const focusables = [urlInput, saveBtn, reloadBtn, video];

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
