// --- Video URL y resume logic ---
window.addEventListener('DOMContentLoaded', () => {
  const savedUrl = localStorage.getItem('savedUrl') || '';

  const video = document.getElementById('mainVideo');
  const urlInput = document.getElementById('videoUrlInput');
  const saveBtn = document.getElementById('saveUrlBtn');
  const reloadBtn = document.getElementById('reloadBtn');
  const backBtn = document.getElementById('backBtn');
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
    const homeUrl = savedUrl.replace(/\/[^/]*$/, '/');
    updateViewFromUrl(homeUrl);
  });

  // Al cargar, usar la URL del input o la guardada
  if (savedUrl) {
    updateViewFromUrl(savedUrl);
  }

  // Interceptar clicks y navegación en el iframe
  fileBrowser.addEventListener('load', () => {
    try {
      const doc =
        fileBrowser.contentDocument || fileBrowser.contentWindow.document;

      // Hacer que todos los elementos navegables sean focuseables y darles estilos de focus
      const iframeStyle = doc.createElement('style');
      iframeStyle.textContent = `
        a:focus, button:focus, input:focus, select:focus, textarea:focus {
          outline: 2px solid #00bfff !important;
          z-index: 2;
        }
      `;
      doc.head.appendChild(iframeStyle);

      // Hacer que todos los elementos sean focuseables
      doc
        .querySelectorAll('a, button, input, select, textarea')
        .forEach((el) => {
          el.setAttribute('tabindex', '0');
          // Asegurarnos de que los enlaces sean clicables
          el.style.cursor = 'pointer';
        });

      // Propagar los eventos del mando al iframe
      doc.addEventListener(
        'keydown',
        (evt) => {
          // Si el evento ya fue manejado por el documento principal, no hacer nada
          if (evt.defaultPrevented) return;

          if (evt.keyCode in LG_KEY_CODE) {
            const direction = LG_KEY_CODE[evt.keyCode];
            const iframeElements = getFocusableElements(doc);

            if (iframeElements.length === 0) return;

            const currentIndex = iframeElements.indexOf(doc.activeElement);
            let nextIndex = currentIndex;

            if (direction === 'right' || direction === 'down') {
              nextIndex = currentIndex + 1;
              if (nextIndex >= iframeElements.length) {
                // Si llegamos al final del iframe, mover el foco al saveBtn del documento principal
                saveBtn.focus();
                evt.preventDefault();
                evt.stopPropagation();
                return;
              }
            } else if (direction === 'left' || direction === 'up') {
              nextIndex = currentIndex - 1;
              if (nextIndex < 0) {
                // Si llegamos al inicio del iframe, mover el foco al urlInput del documento principal
                urlInput.focus();
                evt.preventDefault();
                evt.stopPropagation();
                return;
              }
            } else if (direction === 'enter' && doc.activeElement) {
              doc.activeElement.click();
            } // Solo enfocar si encontramos un elemento válido
            if (iframeElements[nextIndex]) {
              iframeElements[nextIndex].focus();
              evt.preventDefault();
              evt.stopPropagation();
            }
          }
        },
        true
      );

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
              localStorage.setItem('savedUrl', absUrl);
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
    localStorage.setItem('savedUrl', url);
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

  // Navegación avanzada con mando LG (usando simulación de Tab)
  const LG_KEY_CODE = {
    37: 'left', // Izquierda
    38: 'up', // Arriba
    39: 'right', // Derecha
    40: 'down', // Abajo
    13: 'enter', // Enter/OK
    461: 'back' // Back
  };

  // Función para obtener todos los elementos focuseables
  function getFocusableElements(doc = document) {
    return Array.from(
      doc.querySelectorAll(
        'a[href], button, input, select, video, textarea, iframe'
      )
    ).filter((el) => el.offsetWidth > 0 && el.offsetHeight > 0 && !el.disabled);
  }

  // Manejador global de teclas para el mando LG
  document.addEventListener(
    'keydown',
    (evt) => {
      if (evt.keyCode in LG_KEY_CODE) {
        const direction = LG_KEY_CODE[evt.keyCode];

        // Si estamos dentro del iframe o en el video, dejar que ellos manejen la navegación
        try {
          if (
            (fileBrowser.style.display !== 'none' &&
              fileBrowser.contentDocument &&
              fileBrowser.contentDocument.activeElement !==
                fileBrowser.contentDocument.body) ||
            document.activeElement === video
          ) {
            return; // Dejar que el iframe o el video manejen el evento
          }
        } catch (err) {
          console.error('Error accediendo al iframe:', err);
        }

        // Obtener elementos focuseables del documento principal
        let elements = getFocusableElements();

        // Si no hay elemento activo o el elemento activo no está en la lista,
        // empezar desde el principio o el final según la dirección
        let currentIndex = elements.indexOf(document.activeElement);
        if (currentIndex === -1) {
          currentIndex =
            direction === 'left' || direction === 'up' ? elements.length : -1;
        }

        let nextIndex = currentIndex;

        if (direction === 'right' || direction === 'down') {
          nextIndex = currentIndex + 1;
          if (nextIndex >= elements.length) nextIndex = 0;
        } else if (direction === 'left' || direction === 'up') {
          nextIndex = currentIndex - 1;
          if (nextIndex < 0) nextIndex = elements.length - 1;
        } else if (direction === 'enter') {
          // Si hay un elemento activo, hacer click
          if (
            document.activeElement &&
            document.activeElement !== document.body
          ) {
            document.activeElement.click();
          }
        }

        // Enfocar el siguiente elemento
        if (elements[nextIndex]) {
          elements[nextIndex].focus();
        }

        evt.preventDefault();
        evt.stopPropagation();

        // Enfocar el siguiente elemento
        if (nextIndex !== currentIndex && elements[nextIndex]) {
          elements[nextIndex].focus();
        }

        evt.preventDefault();
        evt.stopPropagation();
      }
    },
    true
  );

  // Manejo especial de navegación cuando el foco está en el video
  video.addEventListener('keydown', (evt) => {
    if (evt.keyCode === 38) {
      // Arriba
      if (!video.paused) {
        showToolbar();
      }
      urlInput.focus();
      evt.preventDefault();
      evt.stopPropagation();
    } else if (evt.keyCode === 40) {
      // Abajo
      if (!video.paused) {
        hideToolbar();
      }
    } else if (evt.keyCode === 13) {
      // Enter - toggle play/pause
      if (video.paused) {
        video.play();
      } else {
        video.pause();
      }
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
