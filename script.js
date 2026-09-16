/* =========================================================
   NTP RÁDIO WEB
   PLAYER + METADATA + VOLUME + PWA
========================================================= */

const STREAM_URL =
  'https://stream.zeno.fm/elhz4znig9wuv';

const META_URL =
  'https://api.zeno.fm/mounts/metadata/subscribe/elhz4znig9wuv';


/* =========================================================
   ELEMENTOS
========================================================= */

const radio =
  document.getElementById('radio');

const volumeInput =
  document.getElementById('volume');

const volumeMini =
  document.getElementById('volumeMini');

const playButtons =
  document.querySelectorAll('[data-play]');

const nowPlayingEls =
  document.querySelectorAll('[data-now]');

const eqEls =
  document.querySelectorAll('[data-eq]');

const navToggle =
  document.getElementById('navToggle');

const navLinks =
  document.getElementById('navLinks');

const playerMin =
  document.getElementById('playerMin');

const installBtn =
  document.getElementById('installBtn');

const pipButtons =
  document.querySelectorAll('[data-pip]');


let lastTrackText =
  '🎵 Carregando música...';

let pipWindow = null;


/* =========================================================
   GARANTE O STREAM
========================================================= */

if (radio) {

  radio.src = STREAM_URL;

  radio.preload = 'none';

}


/* =========================================================
   ESTADO DO PLAYER
========================================================= */

function setPlaying(state) {

  document.body.classList.toggle(
    'is-playing',
    state
  );


  playButtons.forEach(button => {

    button.classList.toggle(
      'playing',
      state
    );


    button.setAttribute(
      'aria-pressed',
      String(state)
    );


    button.setAttribute(
      'aria-label',
      state ? 'Pausar' : 'Tocar'
    );

  });


  eqEls.forEach(eq => {

    eq.classList.toggle(
      'on',
      state
    );

  });


  updatePipState(state);

}


/* =========================================================
   LIMPA TÍTULO RECEBIDO DO ZENO
========================================================= */

function cleanTrackTitle(raw) {

  let title =
    String(raw || '').trim();


  if (!title) {
    return '';
  }


  title =
    title.replace(
      /\s*-\s*\[[^\]]*\]\s*$/,
      ''
    );


  title =
    title.replace(
      /^\s*Various Artists\s*-\s*\d+\s*-\s*/,
      ''
    );


  title =
    title.replace(
      /^\s*\d+\.\s*/,
      ''
    );


  title =
    title.replace(
      /\s{2,}/g,
      ' '
    ).trim();


  return title;

}


/* =========================================================
   SEPARA ARTISTA E MÚSICA
========================================================= */

function parseTrack(raw) {

  const cleaned =
    cleanTrackTitle(raw);


  if (!cleaned) {

    return {
      artist: 'NTP RÁDIO WEB',
      title: 'Carregando música...'
    };

  }


  const parts =
    cleaned
      .split(/\s+-\s+/)
      .map(part => part.trim())
      .filter(Boolean);


  if (parts.length >= 2) {

    return {

      artist: parts[0],

      title:
        parts
          .slice(1)
          .join(' - ')

    };

  }


  return {

    artist:
      'NTP RÁDIO WEB',

    title:
      cleaned

  };

}


/* =========================================================
   ATUALIZA MÚSICA
========================================================= */

function setNowPlaying(rawTitle) {

  const track =
    parseTrack(rawTitle);


  const hasTrack =
    track.title &&
    track.title !==
      'Carregando música...';


  const fullText =
    hasTrack
      ? `🎵 ${track.artist} - ${track.title}`
      : '🎵 Carregando música...';


  lastTrackText =
    fullText;


  nowPlayingEls.forEach(el => {

    el.classList.add(
      'track-changing'
    );


    setTimeout(() => {

      el.textContent =
        fullText;


      el.title =
        hasTrack
          ? `${track.artist} - ${track.title}`
          : '';


      el.dataset.artist =
        track.artist || '';


      el.dataset.title =
        track.title || '';


      el.classList.remove(
        'track-changing'
      );

    }, 180);

  });


  /*
   * Elementos opcionais.
   * Se não existirem no HTML, nada acontece.
   */

  const artistElement =
    document.getElementById(
      'artist'
    );


  const titleElement =
    document.getElementById(
      'trackTitle'
    );


  if (artistElement) {

    artistElement.textContent =
      track.artist;

  }


  if (titleElement) {

    titleElement.textContent =
      fullText;

  }


  /*
   * Título da aba
   */

  if (hasTrack) {

    document.title =
      `${track.artist} - ${track.title} | NTP RÁDIO WEB`;

  } else {

    document.title =
      'NTP RÁDIO WEB | Rádio Online ao Vivo';

  }


  updatePipNowPlaying(
    fullText
  );


  updateMediaSession(
    track.title,
    track.artist
  );


  /*
   * Capa padrão.
   * Não depende de nenhuma API externa.
   */

  updateCover();

}


/* =========================================================
   CAPA PADRÃO
========================================================= */

function updateCover() {

  const cover =
    document.getElementById(
      'cover'
    );


  const miniCover =
    document.getElementById(
      'miniCover'
    );


  if (cover) {

    cover.onerror = () => {

      cover.onerror = null;

      cover.src =
        'ntp1.png';

    };


    /*
     * Só altera se o elemento existir.
     */

    if (
      !cover.getAttribute('src')
    ) {

      cover.src =
        'ntp1.png';

    }

  }


  if (miniCover) {

    miniCover.onerror = () => {

      miniCover.onerror = null;

      miniCover.src =
        'ntp1.png';

    };


    if (
      !miniCover.getAttribute('src')
    ) {

      miniCover.src =
        'ntp1.png';

    }

  }

}


/* =========================================================
   MEDIA SESSION
========================================================= */

function initMediaSession() {

  if (
    !radio ||
    !('mediaSession' in navigator)
  ) {

    return;

  }


  try {

    navigator.mediaSession.setActionHandler(
      'play',
      () => {

        radio.play().catch(() => {});

      }
    );

  } catch (error) {}


  try {

    navigator.mediaSession.setActionHandler(
      'pause',
      () => {

        radio.pause();

      }
    );

  } catch (error) {}


  updateMediaSession(
    '',
    'NTP RÁDIO WEB'
  );

}


/* =========================================================
   ATUALIZA MEDIA SESSION
========================================================= */

function updateMediaSession(
  title,
  artist
) {

  if (
    !('mediaSession' in navigator)
  ) {

    return;

  }


  /*
   * MediaMetadata pode não existir
   * em alguns navegadores.
   */

  if (
    typeof MediaMetadata ===
    'undefined'
  ) {

    return;

  }


  try {

    navigator.mediaSession.metadata =
      new MediaMetadata({

        title:
          title ||
          'NTP RÁDIO WEB',

        artist:
          artist ||
          'NTP RÁDIO WEB',

        album:
          'NTP RÁDIO WEB',

        artwork: [

          {
            src: 'ntp1.png',
            sizes: '512x512',
            type: 'image/png'
          }

        ]

      });

  } catch (error) {

    /*
     * Não deixa erro da Media Session
     * afetar o player.
     */

  }

}


/* =========================================================
   PLAY / PAUSE
========================================================= */

function togglePlay() {

  if (!radio) {
    return;
  }


  if (radio.paused) {

    /*
     * Garante novamente o endereço do stream.
     */

    if (!radio.src) {

      radio.src =
        STREAM_URL;

    }


    const playPromise =
      radio.play();


    if (
      playPromise &&
      typeof playPromise.then ===
        'function'
    ) {

      playPromise

        .then(() => {

          setPlaying(true);

        })

        .catch(() => {

          setPlaying(false);

          toast(
            'Não foi possível iniciar a rádio. Toque novamente.'
          );

        });

    } else {

      setPlaying(true);

    }

  } else {

    radio.pause();

    setPlaying(false);

  }

}


/* =========================================================
   BOTÕES PLAY
========================================================= */

playButtons.forEach(button => {

  button.addEventListener(
    'click',
    togglePlay
  );

});


/* =========================================================
   EVENTOS DO ÁUDIO
========================================================= */

if (radio) {

  radio.addEventListener(
    'play',
    () => {

      setPlaying(true);

    }
  );


  radio.addEventListener(
    'pause',
    () => {

      setPlaying(false);

    }
  );


  radio.addEventListener(
    'ended',
    () => {

      setPlaying(false);

    }
  );


  radio.addEventListener(
    'error',
    () => {

      setPlaying(false);

      toast(
        'Erro na conexão com a rádio. Tente novamente.'
      );

    }
  );

}


/* =========================================================
   VOLUME
========================================================= */

if (
  radio &&
  (volumeInput || volumeMini)
) {

  let savedVolume =
    NaN;


  try {

    savedVolume =
      parseFloat(
        localStorage.getItem(
          'ntpVolume'
        )
      );

  } catch (error) {

    savedVolume =
      NaN;

  }


  const initialVolume =
    Number.isFinite(
      savedVolume
    )
      ? savedVolume
      : 0.8;


  radio.volume =
    initialVolume;


  if (volumeInput) {

    volumeInput.value =
      String(
        initialVolume
      );

  }


  if (volumeMini) {

    volumeMini.value =
      String(
        initialVolume
      );

  }


  function applyVolume(value) {

    if (!Number.isFinite(value)) {

      return;

    }


    value =
      Math.max(
        0,
        Math.min(
          1,
          value
        )
      );


    radio.volume =
      value;


    if (volumeInput) {

      volumeInput.value =
        String(value);

    }


    if (volumeMini) {

      volumeMini.value =
        String(value);

    }


    syncPipVolume(
      value
    );


    try {

      localStorage.setItem(
        'ntpVolume',
        String(value)
      );

    } catch (error) {}

  }


  if (volumeInput) {

    volumeInput.addEventListener(
      'input',
      () => {

        applyVolume(
          parseFloat(
            volumeInput.value
          )
        );

      }
    );

  }


  if (volumeMini) {

    volumeMini.addEventListener(
      'input',
      () => {

        applyVolume(
          parseFloat(
            volumeMini.value
          )
        );

      }
    );

  }

}


/* =========================================================
   METADATA ZENO.FM
========================================================= */

function initMetadata() {

  if (
    !('EventSource' in window)
  ) {

    setNowPlaying('');

    return;

  }


  let source;


  try {

    source =
      new EventSource(
        META_URL
      );

  } catch (error) {

    setNowPlaying('');

    return;

  }


  source.addEventListener(
    'message',
    event => {

      try {

        const data =
          JSON.parse(
            event.data
          );


        if (
          data &&
          data.streamTitle
        ) {

          setNowPlaying(
            data.streamTitle
          );

        }

      } catch (error) {

        /*
         * Alguns eventos podem não
         * conter JSON de música.
         */

      }

    }
  );


  source.addEventListener(
    'error',
    () => {

      /*
       * O navegador tenta reconectar
       * automaticamente.
       */

    }
  );

}


/* =========================================================
   TOAST
========================================================= */

function toast(message) {

  const element =
    document.getElementById(
      'toast'
    );


  if (!element) {
    return;
  }


  element.textContent =
    message;


  element.classList.add(
    'show'
  );


  clearTimeout(
    window.ntpToastTimer
  );


  window.ntpToastTimer =
    setTimeout(() => {

      element.classList.remove(
        'show'
      );

    }, 2600);

}


/* =========================================================
   MENU MOBILE
========================================================= */

if (
  navToggle &&
  navLinks
) {

  navToggle.addEventListener(
    'click',
    () => {

      const open =
        navLinks.classList.toggle(
          'open'
        );


      navToggle.setAttribute(
        'aria-expanded',
        String(open)
      );


      navToggle.setAttribute(
        'aria-label',
        open
          ? 'Fechar menu'
          : 'Abrir menu'
      );

    }
  );


  navLinks
    .querySelectorAll('a')
    .forEach(link => {

      link.addEventListener(
        'click',
        () => {

          navLinks.classList.remove(
            'open'
          );


          navToggle.setAttribute(
            'aria-expanded',
            'false'
          );

        }
      );

    });

}


/* =========================================================
   ANIMAÇÃO REVEAL
========================================================= */

if (
  'IntersectionObserver' in window
) {

  const revealObserver =
    new IntersectionObserver(
      entries => {

        entries.forEach(entry => {

          if (
            entry.isIntersecting
          ) {

            entry.target.classList.add(
              'visible'
            );


            revealObserver.unobserve(
              entry.target
            );

          }

        });

      },
      {
        threshold: 0.12
      }
    );


  document
    .querySelectorAll('.reveal')
    .forEach(element => {

      revealObserver.observe(
        element
      );

    });

} else {

  document
    .querySelectorAll('.reveal')
    .forEach(element => {

      element.classList.add(
        'visible'
      );

    });

}


/* =========================================================
   PLAYER MINIMIZADO
========================================================= */

if (playerMin) {

  playerMin.addEventListener(
    'click',
    () => {

      const minimized =
        document.body.classList.toggle(
          'player-minimized'
        );


      playerMin.setAttribute(
        'aria-label',
        minimized
          ? 'Expandir player'
          : 'Minimizar player'
      );

    }
  );

}


/* =========================================================
   MINI PLAYER
========================================================= */

function isPipSupported() {

  return (
    'documentPictureInPicture'
    in window
  );

}


function updatePipNowPlaying(text) {

  if (!pipWindow) {
    return;
  }


  try {

    const track =
      pipWindow.document
        .getElementById(
          'pipTrack'
        );


    if (track) {

      track.textContent =
        text;

    }

  } catch (error) {}

}


function updatePipState(state) {

  if (!pipWindow) {
    return;
  }


  try {

    const button =
      pipWindow.document
        .getElementById(
          'pipPlay'
        );


    const eq =
      pipWindow.document
        .getElementById(
          'pipEq'
        );


    if (button) {

      button.classList.toggle(
        'playing',
        state
      );


      button.setAttribute(
        'aria-pressed',
        String(state)
      );


      button.setAttribute(
        'aria-label',
        state
          ? 'Pausar'
          : 'Tocar'
      );

    }


    if (eq) {

      eq.classList.toggle(
        'on',
        state
      );

    }

  } catch (error) {}

}


function syncPipVolume(value) {

  if (!pipWindow) {
    return;
  }


  try {

    const input =
      pipWindow.document
        .getElementById(
          'pipVolume'
        );


    if (input) {

      input.value =
        String(value);

    }

  } catch (error) {}

}


function buildPipContent() {

  const wrap =
    document.createElement(
      'div'
    );


  wrap.className =
    'pip-window';


  wrap.innerHTML = `

    <button
      class="pip-close"
      id="pipClose"
      aria-label="Fechar mini player"
    >
      &times;
    </button>


    <div class="pip-brand">
      NTP <b>RÁDIO WEB</b>
    </div>


    <div
      class="eq"
      id="pipEq"
    >
      <span></span>
      <span></span>
      <span></span>
      <span></span>
      <span></span>
    </div>


    <div
      class="pip-track"
      id="pipTrack"
    >
      🎵 Carregando música...
    </div>


    <button
      class="play-btn"
      id="pipPlay"
      aria-label="Tocar"
      aria-pressed="false"
    >
      <span
        class="pb-play"
        aria-hidden="true"
      ></span>

      <span
        class="pb-pause"
        aria-hidden="true"
      ></span>
    </button>


    <div class="pip-volume">

      <svg
        class="vol-icon"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >

        <path
          d="M3 9v6h4l5 5V4L7 9H3z"
          fill="currentColor"
        ></path>

        <path
          d="M16 8a5 5 0 0 1 0 8M18.5 5.5a9 9 0 0 1 0 13"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
        ></path>

      </svg>


      <input
        type="range"
        id="pipVolume"
        min="0"
        max="1"
        step="0.01"
        value="0.8"
        aria-label="Volume do mini player"
      >

    </div>

  `;


  return wrap;

}


function copyStyleSheets(targetDocument) {

  [...document.styleSheets]
    .forEach(styleSheet => {

      if (!styleSheet.href) {
        return;
      }


      const link =
        document.createElement(
          'link'
        );


      link.rel =
        'stylesheet';


      link.href =
        styleSheet.href;


      targetDocument.head.appendChild(
        link
      );

    });

}


async function openPip() {

  if (!isPipSupported()) {

    const live =
      document.getElementById(
        'ao-vivo'
      );


    if (live) {

      live.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });

    }


    toast(
      'Mini player não é compatível com este navegador.'
    );


    return;

  }


  if (pipWindow) {

    toast(
      'O mini player já está aberto.'
    );


    return;

  }


  /*
   * Tenta iniciar a rádio.
   */

  if (
    radio &&
    radio.paused
  ) {

    radio
      .play()
      .catch(() => {});

  }


  try {

    pipWindow =
      await documentPictureInPicture
        .requestWindow({

          width: 340,

          height: 300

        });


  } catch (error) {

    pipWindow =
      null;


    toast(
      'Não foi possível abrir o mini player.'
    );


    return;

  }


  copyStyleSheets(
    pipWindow.document
  );


  pipWindow.document.title =
    'NTP RÁDIO WEB';


  pipWindow.document.body.appendChild(
    buildPipContent()
  );


  const closeButton =
    pipWindow.document
      .getElementById(
        'pipClose'
      );


  if (closeButton) {

    closeButton.addEventListener(
      'click',
      () => {

        if (pipWindow) {

          pipWindow.close();

        }

      }
    );

  }


  const pipPlay =
    pipWindow.document
      .getElementById(
        'pipPlay'
      );


  if (pipPlay) {

    pipPlay.addEventListener(
      'click',
      togglePlay
    );

  }


  const pipVolume =
    pipWindow.document
      .getElementById(
        'pipVolume'
      );


  if (pipVolume) {

    pipVolume.value =
      String(
        radio
          ? radio.volume
          : 0.8
      );


    pipVolume.addEventListener(
      'input',
      () => {

        if (!radio) {
          return;
        }


        const value =
          parseFloat(
            pipVolume.value
          );


        if (
          !Number.isFinite(value)
        ) {

          return;

        }


        radio.volume =
          value;


        if (volumeInput) {

          volumeInput.value =
            String(value);

        }


        if (volumeMini) {

          volumeMini.value =
            String(value);

        }


        try {

          localStorage.setItem(
            'ntpVolume',
            String(value)
          );

        } catch (error) {}

      }
    );

  }


  updatePipNowPlaying(
    lastTrackText
  );


  updatePipState(
    radio
      ? !radio.paused
      : false
  );


  pipButtons.forEach(button => {

    button.classList.add(
      'active'
    );

  });


  pipWindow.addEventListener(
    'pagehide',
    () => {

      pipWindow =
        null;


      pipButtons.forEach(button => {

        button.classList.remove(
          'active'
        );

      });

    }
  );

}


pipButtons.forEach(button => {

  button.addEventListener(
    'click',
    openPip
  );

});


/* =========================================================
   PWA / SERVICE WORKER
========================================================= */

if (
  'serviceWorker' in navigator
) {

  window.addEventListener(
    'load',
    () => {

      navigator.serviceWorker
        .register('sw.js')
        .catch(() => {});

    }
  );

}


/* =========================================================
   INSTALAÇÃO DO APP
========================================================= */

let deferredInstall =
  null;


window.addEventListener(
  'beforeinstallprompt',
  event => {

    event.preventDefault();


    deferredInstall =
      event;


    if (installBtn) {

      installBtn.hidden =
        false;

    }

  }
);


window.addEventListener(
  'appinstalled',
  () => {

    deferredInstall =
      null;


    if (installBtn) {

      installBtn.hidden =
        true;

    }

  }
);


if (installBtn) {

  installBtn.addEventListener(
    'click',
    async () => {

      if (!deferredInstall) {

        toast(
          'Instale pelo menu do navegador: ⋮ → Adicionar à tela inicial.'
        );


        return;

      }


      try {

        deferredInstall.prompt();

        await deferredInstall.userChoice;

      } catch (error) {}


      deferredInstall =
        null;


      installBtn.hidden =
        true;

    }
  );

}


/* =========================================================
   INICIALIZAÇÃO
========================================================= */

setNowPlaying('');

initMetadata();

initMediaSession();

updateCover();
