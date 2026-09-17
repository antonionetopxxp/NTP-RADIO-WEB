/* =========================================================
   NTP RÁDIO WEB
   PLAYER + METADATA + VOLUME + SERVICE WORKER
   ========================================================= */


/* ================================
   CONFIGURAÇÃO DA RÁDIO
================================ */

const STREAM_URL =
  'https://stream.zeno.fm/elhz4znig9wuv';

const META_URL =
  'https://api.zeno.fm/mounts/metadata/subscribe/elhz4znig9wuv';


/* ================================
   ELEMENTOS
================================ */

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


/* ================================
   ESTADO
================================ */

let lastTrackText =
  '🎵 Carregando música...';

let metadataSource = null;


/* ================================
   PLAYER
================================ */

function setPlaying(state) {

  document.body.classList.toggle(
    'is-playing',
    Boolean(state)
  );


  playButtons.forEach(button => {

    button.classList.toggle(
      'playing',
      Boolean(state)
    );


    button.setAttribute(
      'aria-pressed',
      String(Boolean(state))
    );


    button.setAttribute(
      'aria-label',
      state
        ? 'Pausar rádio'
        : 'Tocar rádio'
    );

  });


  eqEls.forEach(eq => {

    eq.classList.toggle(
      'on',
      Boolean(state)
    );

  });

}


/* ================================
   PLAY
================================ */

async function playRadio() {

  if (!radio) {

    console.error(
      'Elemento #radio não encontrado.'
    );

    toast(
      'Player de rádio não encontrado.'
    );

    return;

  }


  try {

    /*
     * Define novamente o endereço somente
     * se necessário.
     */

    if (
      !radio.src ||
      !radio.src.includes(STREAM_URL)
    ) {

      radio.src =
        STREAM_URL;

    }


    /*
     * Não usamos load() toda vez que
     * o usuário aperta Play.
     *
     * Isso evita reiniciar a conexão
     * desnecessariamente.
     */

    const promise =
      radio.play();


    if (
      promise &&
      typeof promise.then === 'function'
    ) {

      await promise;

    }


    setPlaying(true);


    /*
     * Atualiza Media Session, quando
     * disponível.
     */

    updateMediaSession();

  } catch (error) {

    console.error(
      'Erro ao iniciar a rádio:',
      error
    );


    setPlaying(false);


    toast(
      'Não foi possível iniciar a rádio.'
    );

  }

}


/* ================================
   PAUSE
================================ */

function pauseRadio() {

  if (!radio) {
    return;
  }


  try {

    radio.pause();

  } catch (error) {

    console.error(
      'Erro ao pausar rádio:',
      error
    );

  }


  setPlaying(false);

}


/* ================================
   PLAY / PAUSE
================================ */

function togglePlay() {

  if (!radio) {

    console.error(
      'Elemento #radio não encontrado.'
    );

    return;

  }


  if (radio.paused) {

    playRadio();

  } else {

    pauseRadio();

  }

}


/* ================================
   BOTÕES PLAY
================================ */

playButtons.forEach(button => {

  button.addEventListener(
    'click',
    togglePlay
  );

});


/* ================================
   EVENTOS DO ÁUDIO
================================ */

if (radio) {

  radio.addEventListener(
    'play',
    () => {

      setPlaying(true);

      updateMediaSession();

    }
  );


  radio.addEventListener(
    'playing',
    () => {

      setPlaying(true);

      updateMediaSession();

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
    'waiting',
    () => {

      /*
       * A transmissão pode ficar alguns
       * instantes aguardando dados.
       *
       * Não desligamos o estado aqui.
       */

      console.log(
        'Rádio aguardando dados...'
      );

    }
  );


  radio.addEventListener(
    'stalled',
    () => {

      console.log(
        'Transmissão temporariamente interrompida.'
      );

    }
  );


  radio.addEventListener(
    'error',
    event => {

      console.error(
        'Erro no áudio:',
        event
      );


      setPlaying(false);


      toast(
        'Erro ao conectar ao servidor da rádio.'
      );

    }
  );

}


/* ================================
   VOLUME
================================ */

let savedVolume = 0.8;


try {

  const stored =
    parseFloat(
      localStorage.getItem(
        'ntpVolume'
      )
    );


  if (
    Number.isFinite(stored)
  ) {

    savedVolume =
      Math.max(
        0,
        Math.min(
          1,
          stored
        )
      );

  }

} catch (error) {

  console.warn(
    'Não foi possível carregar o volume salvo.',
    error
  );

}


/* ================================
   APLICAR VOLUME INICIAL
================================ */

if (radio) {

  radio.volume =
    savedVolume;

}


if (volumeInput) {

  volumeInput.value =
    String(savedVolume);

}


if (volumeMini) {

  volumeMini.value =
    String(savedVolume);

}


/* ================================
   APLICAR VOLUME
================================ */

function applyVolume(value) {

  if (
    !Number.isFinite(value)
  ) {

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


  if (radio) {

    radio.volume =
      value;

  }


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

  } catch (error) {

    console.warn(
      'Não foi possível salvar o volume.',
      error
    );

  }

}


/* ================================
   VOLUME PRINCIPAL
================================ */

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


/* ================================
   VOLUME MINI PLAYER
================================ */

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


/* ================================
   LIMPAR TÍTULO
================================ */

function cleanTrackTitle(raw) {

  let title =
    String(
      raw || ''
    ).trim();


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


  return title
    .replace(
      /\s{2,}/g,
      ' '
    )
    .trim();

}


/* ================================
   NOW PLAYING
================================ */

function setNowPlaying(rawTitle) {

  const title =
    cleanTrackTitle(
      rawTitle
    );


  const text =
    title
      ? '🎵 ' + title
      : '🎵 Carregando música...';


  lastTrackText =
    text;


  nowPlayingEls.forEach(element => {

    element.textContent =
      text;


    element.title =
      title || '';

  });


  if (title) {

    document.title =
      title +
      ' | NTP RÁDIO WEB';

  } else {

    document.title =
      'NTP RÁDIO WEB | Rádio Online ao Vivo';

  }


  updateMediaSession();

}


/* ================================
   ZENO METADATA
================================ */

function initMetadata() {

  if (
    !('EventSource' in window)
  ) {

    console.warn(
      'EventSource não é suportado neste navegador.'
    );


    setNowPlaying('');

    return;

  }


  /*
   * Fecha uma conexão anterior caso
   * initMetadata seja chamado novamente.
   */

  if (metadataSource) {

    try {

      metadataSource.close();

    } catch (error) {}

  }


  try {

    metadataSource =
      new EventSource(
        META_URL
      );


    metadataSource.addEventListener(
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
           * Alguns eventos do servidor
           * podem não conter JSON válido.
           */

        }

      }
    );


    metadataSource.addEventListener(
      'error',
      error => {

        console.warn(
          'Conexão de metadata temporariamente indisponível.',
          error
        );

        /*
         * O EventSource tenta reconectar
         * automaticamente.
         */

      }
    );

  } catch (error) {

    console.error(
      'Erro na metadata:',
      error
    );

  }

}


/* ================================
   TOAST
================================ */

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
    setTimeout(
      () => {

        element.classList.remove(
          'show'
        );

      },
      2600
    );

}


/* ================================
   MENU
================================ */

const navToggle =
  document.getElementById(
    'navToggle'
  );

const navLinks =
  document.getElementById(
    'navLinks'
  );


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


/* ================================
   PLAYER MINIMIZADO
================================ */

const playerMin =
  document.getElementById(
    'playerMin'
  );


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


/* ================================
   ANIMAÇÃO DOS BLOCOS
================================ */

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

}


/* ================================
   MEDIA SESSION
   CONTROLES DA TELA BLOQUEADA
================================ */

function initMediaSession() {

  if (
    !('mediaSession' in navigator)
  ) {

    console.log(
      'Media Session API não disponível.'
    );

    return;

  }


  try {

    navigator.mediaSession.setActionHandler(
      'play',
      () => {

        playRadio();

      }
    );

  } catch (error) {

    console.warn(
      'Media Session play:',
      error
    );

  }


  try {

    navigator.mediaSession.setActionHandler(
      'pause',
      () => {

        pauseRadio();

      }
    );

  } catch (error) {

    console.warn(
      'Media Session pause:',
      error
    );

  }


  try {

    navigator.mediaSession.setActionHandler(
      'stop',
      () => {

        pauseRadio();

      }
    );

  } catch (error) {

    console.warn(
      'Media Session stop:',
      error
    );

  }


  /*
   * Alguns celulares oferecem esses
   * controles mesmo para streaming.
   */

  try {

    navigator.mediaSession.setActionHandler(
      'seekbackward',
      null
    );

  } catch (error) {}


  try {

    navigator.mediaSession.setActionHandler(
      'seekforward',
      null
    );

  } catch (error) {}


  updateMediaSession();

}


/* ================================
   ATUALIZAR MEDIA SESSION
================================ */

function updateMediaSession() {

  if (
    !('mediaSession' in navigator)
  ) {

    return;

  }


  if (
    typeof MediaMetadata === 'undefined'
  ) {

    return;

  }


  const title =
    lastTrackText
      .replace(/^🎵\s*/, '')
      .trim();


  try {

    navigator.mediaSession.metadata =
      new MediaMetadata({

        title:
          title ||
          'NTP RÁDIO WEB',

        artist:
          'NTP RÁDIO WEB',

        album:
          'Rádio Online Ao Vivo',

        artwork: [
          {
            src: 'favicon.svg',
            sizes: '192x192',
            type: 'image/svg+xml'
          }
        ]

      });

  } catch (error) {

    console.warn(
      'Erro ao atualizar Media Session:',
      error
    );

  }

}


/* ================================
   SERVICE WORKER
================================ */

if (
  'serviceWorker' in navigator
) {

  window.addEventListener(
    'load',
    () => {

      navigator.serviceWorker
        .register(
          'sw.js'
        )
        .then(
          registration => {

            console.log(
              'Service Worker ativo:',
              registration.scope
            );

          }
        )
        .catch(
          error => {

            console.error(
              'Service Worker:',
              error
            );

          }
        );

    }
  );

}


/* ================================
   INICIALIZAÇÃO
================================ */

function initRadio() {

  if (!radio) {

    console.error(
      'NTP RÁDIO WEB: elemento #radio não encontrado.'
    );

    return;

  }


  /*
   * Garante que o endereço correto
   * esteja configurado.
   */

  if (
    !radio.src ||
    !radio.src.includes(STREAM_URL)
  ) {

    radio.src =
      STREAM_URL;

  }


  /*
   * Volume inicial.
   */

  radio.volume =
    savedVolume;


  /*
   * Estado inicial.
   */

  setPlaying(
    !radio.paused
  );


  /*
   * Metadata.
   */

  setNowPlaying('');

}


/* ================================
   INICIAR SISTEMA
================================ */

initRadio();

initMetadata();

initMediaSession();
