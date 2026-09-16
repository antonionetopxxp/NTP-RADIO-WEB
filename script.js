const STREAM_URL = 'https://stream.zeno.fm/elhz4znig9wuv';
const META_URL = 'https://api.zeno.fm/mounts/metadata/subscribe/elhz4znig9wuv';

const radio = document.getElementById('radio');
const volumeInput = document.getElementById('volume');
const volumeMini = document.getElementById('volumeMini');

const playButtons = document.querySelectorAll('[data-play]');
const nowPlayingEls = document.querySelectorAll('[data-now]');
const eqEls = document.querySelectorAll('[data-eq]');

let lastTrackText = '🎵 Carregando música...';


/* ================================
   PLAYER
================================ */

function setPlaying(state) {

  document.body.classList.toggle('is-playing', state);

  playButtons.forEach(button => {

    button.classList.toggle('playing', state);

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

    eq.classList.toggle('on', state);

  });

}


/* ================================
   PLAY / PAUSE
================================ */

function togglePlay() {

  if (!radio) {
    console.error('Elemento #radio não encontrado.');
    return;
  }


  if (radio.paused) {

    radio.src = STREAM_URL;

    radio.load();


    const promise = radio.play();


    if (promise !== undefined) {

      promise
        .then(() => {

          setPlaying(true);

        })
        .catch(error => {

          console.error(
            'Erro ao iniciar a rádio:',
            error
          );

          setPlaying(false);

          toast(
            'Não foi possível iniciar a rádio.'
          );

        });

    }

  } else {

    radio.pause();

    setPlaying(false);

  }

}


/* ================================
   BOTÕES
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
      localStorage.getItem('ntpVolume')
    );

  if (Number.isFinite(stored)) {

    savedVolume = stored;

  }

} catch (error) {}


if (radio) {

  radio.volume = savedVolume;

}


if (volumeInput) {

  volumeInput.value =
    String(savedVolume);

}


if (volumeMini) {

  volumeMini.value =
    String(savedVolume);

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


/* ================================
   METADATA
================================ */

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


  return title
    .replace(/\s{2,}/g, ' ')
    .trim();

}


function setNowPlaying(rawTitle) {

  const title =
    cleanTrackTitle(rawTitle);


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

}


/* ================================
   ZENO METADATA
================================ */

function initMetadata() {

  if (!('EventSource' in window)) {

    setNowPlaying('');

    return;

  }


  try {

    const source =
      new EventSource(
        META_URL
      );


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
           * Ignora eventos que não sejam
           * metadata válida.
           */

        }

      }
    );


    source.addEventListener(
      'error',
      () => {

        /*
         * EventSource tenta reconectar.
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
    setTimeout(() => {

      element.classList.remove(
        'show'
      );

    }, 2600);

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
   SERVICE WORKER
================================ */

if (
  'serviceWorker' in navigator
) {

  window.addEventListener(
    'load',
    () => {

      navigator.serviceWorker
        .register('sw.js')
        .catch(error => {

          console.error(
            'Service Worker:',
            error
          );

        });

    }
  );

}


/* ================================
   INICIALIZAÇÃO
================================ */

setNowPlaying('');

initMetadata();
