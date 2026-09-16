/* =========================================================
   NTP RÁDIO WEB — SCRIPT PRINCIPAL
   Player + Metadata + Media Session + PIP + PWA
   ========================================================= */

const STREAM_URL = 'https://stream.zeno.fm/elhz4znig9wuv';
const META_URL = 'https://api.zeno.fm/mounts/metadata/subscribe/elhz4znig9wuv';

/* =========================================================
   ELEMENTOS
   ========================================================= */

const radio = document.getElementById('radio');

const volumeInput = document.getElementById('volume');
const volumeMini = document.getElementById('volumeMini');

const playButtons = document.querySelectorAll('[data-play]');
const nowPlayingEls = document.querySelectorAll('[data-now]');
const eqEls = document.querySelectorAll('[data-eq]');

const navToggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');

const playerMin = document.getElementById('playerMin');

const pipButtons = document.querySelectorAll('[data-pip]');

const installBtn = document.getElementById('installBtn');

/* =========================================================
   ESTADO
   ========================================================= */

let lastTrackText = '🎵 Carregando música...';

let currentTrack = {
  raw: '',
  artist: '',
  title: '',
  full: ''
};

let pipWindow = null;

let deferredInstall = null;

/* =========================================================
   PLAYER
   ========================================================= */

function setPlaying(state) {

  if (!radio) return;

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

  updatePipState(state);
}

/* =========================================================
   TOCAR / PAUSAR
   ========================================================= */

function togglePlay() {

  if (!radio) return;

  if (radio.paused) {

    radio.play()
      .then(() => {
        setPlaying(true);
      })
      .catch(() => {

        toast(
          'Não foi possível iniciar o áudio. Tente novamente.'
        );

      });

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
    () => setPlaying(true)
  );

  radio.addEventListener(
    'pause',
    () => setPlaying(false)
  );

  radio.addEventListener(
    'ended',
    () => setPlaying(false)
  );

  radio.addEventListener(
    'error',
    () => {

      setPlaying(false);

      toast(
        'Não foi possível conectar à transmissão.'
      );

    }
  );

}

/* =========================================================
   LIMPEZA DO TÍTULO DA MÚSICA
   ========================================================= */

function cleanTrackTitle(raw) {

  let title = String(raw || '').trim();

  if (!title) {
    return '';
  }

  /* Remove informações extras no final */

  title = title.replace(
    /\s*-\s*\[[^\]]*\]\s*$/,
    ''
  );

  /* Remove Various Artists + número */

  title = title.replace(
    /^\s*Various Artists\s*-\s*\d+\s*-\s*/,
    ''
  );

  /* Remove numeração */

  title = title.replace(
    /^\s*\d+\.\s*/,
    ''
  );

  /* Remove espaços duplicados */

  title = title.replace(
    /\s{2,}/g,
    ' '
  );

  return title.trim();
}

/* =========================================================
   SEPARAR ARTISTA E MÚSICA
   ========================================================= */

function parseTrack(raw) {

  const cleaned = cleanTrackTitle(raw);

  if (!cleaned) {

    return {
      raw: '',
      artist: '',
      title: '',
      full: ''
    };

  }

  /*
    Formato esperado:

    Artista - Música

    Caso o Zeno envie apenas:

    Música

    o sistema mantém tudo como título.
  */

  const separator = ' - ';

  const parts = cleaned.split(separator);

  if (parts.length >= 2) {

    const artist = parts.shift().trim();

    const title = parts
      .join(separator)
      .trim();

    return {
      raw: raw,
      artist: artist,
      title: title,
      full: cleaned
    };

  }

  return {
    raw: raw,
    artist: '',
    title: cleaned,
    full: cleaned
  };
}

/* =========================================================
   TEXTO PRINCIPAL DA FAIXA
   ========================================================= */

function getTrackDisplayText(track) {

  if (!track || !track.full) {

    return '🎵 Carregando música...';

  }

  if (track.artist && track.title) {

    return `🎵 ${track.artist} - ${track.title}`;

  }

  return `🎵 ${track.title}`;
}

/* =========================================================
   ATUALIZAR MÚSICA
   ========================================================= */

function setNowPlaying(title) {

  const track = parseTrack(title);

  currentTrack = track;

  const text = getTrackDisplayText(track);

  lastTrackText = text;

  /* -----------------------------------------
     Atualização visual
     ----------------------------------------- */

  nowPlayingEls.forEach(el => {

    el.classList.add(
      'track-changing'
    );

    setTimeout(() => {

      el.textContent = text;

      el.title = track.full || '';

      el.dataset.artist =
        track.artist || '';

      el.dataset.title =
        track.title || '';

      el.classList.remove(
        'track-changing'
      );

    }, 180);

  });

  /* -----------------------------------------
     Título da página
     ----------------------------------------- */

  if (track.full) {

    document.title =
      `${track.full} | NTP RÁDIO WEB`;

  } else {

    document.title =
      'NTP RÁDIO WEB | Rádio Online ao Vivo';

  }

  /* -----------------------------------------
     Mini player
     ----------------------------------------- */

  updatePipNowPlaying(text);

  /* -----------------------------------------
     Media Session
     ----------------------------------------- */

  updateMediaSession(track);

  /* -----------------------------------------
     Evento personalizado
     ----------------------------------------- */

  document.dispatchEvent(
    new CustomEvent(
      'ntp:trackchange',
      {
        detail: track
      }
    )
  );
}

/* =========================================================
   MEDIA SESSION
   ========================================================= */

function initMediaSession() {

  if (
    !('mediaSession' in navigator) ||
    !radio
  ) {
    return;
  }

  try {

    navigator.mediaSession.setActionHandler(
      'play',
      () => {

        radio.play()
          .then(() => setPlaying(true))
          .catch(() => {});

      }
    );

  } catch (error) {
    // ação não suportada
  }

  try {

    navigator.mediaSession.setActionHandler(
      'pause',
      () => {

        radio.pause();

        setPlaying(false);

      }
    );

  } catch (error) {
    // ação não suportada
  }

  updateMediaSession(currentTrack);
}

/* =========================================================
   MEDIA SESSION — METADADOS
   ========================================================= */

function updateMediaSession(track) {

  if (
    !('mediaSession' in navigator)
  ) {
    return;
  }

  try {

    const title =
      track && track.title
        ? track.title
        : 'NTP RÁDIO WEB';

    const artist =
      track && track.artist
        ? track.artist
        : 'NTP RÁDIO WEB';

    navigator.mediaSession.metadata =
      new MediaMetadata({

        title: title,

        artist: artist,

        album: 'Rádio Online',

        artwork: [

          {
            src: 'favicon.svg',
            sizes: '64x64',
            type: 'image/svg+xml'
          }

        ]

      });

  } catch (error) {

    // MediaMetadata indisponível

  }
}

/* =========================================================
   VOLUME
   ========================================================= */

function initVolume() {

  if (
    !volumeInput &&
    !volumeMini
  ) {
    return;
  }

  let savedVolume;

  try {

    savedVolume =
      parseFloat(
        localStorage.getItem(
          'ntpVolume'
        )
      );

  } catch (error) {

    savedVolume = NaN;

  }

  const initialVolume =
    Number.isFinite(savedVolume)
      ? savedVolume
      : 0.8;

  if (radio) {

    radio.volume =
      initialVolume;

  }

  if (volumeInput) {

    volumeInput.value =
      String(initialVolume);

  }

  if (volumeMini) {

    volumeMini.value =
      String(initialVolume);

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

    if (
      volumeInput &&
      volumeInput !== document.activeElement
    ) {

      volumeInput.value =
        String(value);

    }

    if (
      volumeMini &&
      volumeMini !== document.activeElement
    ) {

      volumeMini.value =
        String(value);

    }

    syncPipVolume(value);

    try {

      localStorage.setItem(
        'ntpVolume',
        String(value)
      );

    } catch (error) {
      // armazenamento indisponível
    }

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
   METADATA DO ZENO.FM
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
          Alguns eventos do Zeno
          podem ser apenas pings.
        */

      }

    }
  );

  source.addEventListener(
    'error',
    () => {

      /*
        EventSource tenta reconectar
        automaticamente.
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
    window.toastTimer
  );

  window.toastTimer =
    setTimeout(
      () => {

        element.classList.remove(
          'show'
        );

      },
      2600
    );

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

}

/* =========================================================
   FECHAR MENU AO CLICAR
   ========================================================= */

if (navLinks && navToggle) {

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
   MINIMIZAR PLAYER
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
   ANIMAÇÕES REVEAL
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
   PICTURE-IN-PICTURE
   ========================================================= */

function isPipSupported() {

  return (
    'documentPictureInPicture'
    in window
  );

}

/* =========================================================
   ATUALIZAR TEXTO DO PIP
   ========================================================= */

function updatePipNowPlaying(text) {

  if (!pipWindow) {
    return;
  }

  const track =
    pipWindow.document
      .getElementById(
        'pipTrack'
      );

  if (track) {

    track.textContent =
      text;

  }

}

/* =========================================================
   ATUALIZAR ESTADO DO PIP
   ========================================================= */

function updatePipState(state) {

  if (!pipWindow) {
    return;
  }

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

}

/* =========================================================
   CONTEÚDO DO MINI PLAYER
   ========================================================= */

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

/* =========================================================
   COPIAR CSS PARA PIP
   ========================================================= */

function copyStyleSheets(
  targetDocument
) {

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

/* =========================================================
   SINCRONIZAR VOLUME DO PIP
   ========================================================= */

function syncPipVolume(value) {

  if (!pipWindow) {
    return;
  }

  const pipVolume =
    pipWindow.document
      .getElementById(
        'pipVolume'
      );

  if (pipVolume) {

    pipVolume.value =
      String(value);

  }

}

/* =========================================================
   ABRIR PIP
   ========================================================= */

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
      'O mini player não é compatível com este navegador.'
    );

    return;

  }

  if (pipWindow) {

    toast(
      'O mini player já está aberto.'
    );

    return;

  }

  if (
    radio &&
    radio.paused
  ) {

    radio
      .play()
      .catch(() => {});

  }

  let windowRef;

  try {

    windowRef =
      await documentPictureInPicture
        .requestWindow({

          width: 340,
          height: 300

        });

  } catch (error) {

    pipWindow = null;

    toast(
      'Não foi possível abrir o mini player.'
    );

    return;

  }

  pipWindow =
    windowRef;

  copyStyleSheets(
    pipWindow.document
  );

  pipWindow.document.body.appendChild(
    buildPipContent()
  );

  /* -----------------------------------------
     Botão fechar
     ----------------------------------------- */

  const closeButton =
    pipWindow.document
      .getElementById(
        'pipClose'
      );

  if (closeButton) {

    closeButton.addEventListener(
      'click',
      () => {

        pipWindow.close();

      }
    );

  }

  /* -----------------------------------------
     Botão play
     ----------------------------------------- */

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

  /* -----------------------------------------
     Volume
     ----------------------------------------- */

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

        const value =
          parseFloat(
            pipVolume.value
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
          // armazenamento indisponível
        }

      }
    );

  }

  /* -----------------------------------------
     Estado inicial
     ----------------------------------------- */

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

  /* -----------------------------------------
     Fechamento da janela
     ----------------------------------------- */

  pipWindow.addEventListener(
    'pagehide',
    () => {

      pipWindow = null;

      pipButtons.forEach(button => {

        button.classList.remove(
          'active'
        );

      });

    }
  );

}

/* =========================================================
   BOTÕES PIP
   ========================================================= */

pipButtons.forEach(button => {

  button.addEventListener(
    'click',
    openPip
  );

});

/* =========================================================
   SERVICE WORKER / PWA
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
   INSTALAÇÃO PWA
   ========================================================= */

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

/* =========================================================
   APP INSTALADO
   ========================================================= */

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

/* =========================================================
   BOTÃO INSTALAR
   ========================================================= */

if (installBtn) {

  installBtn.addEventListener(
    'click',
    async () => {

      if (!deferredInstall) {

        toast(
          'Instale pelo menu do navegador: ⋮ → "Adicionar à tela inicial".'
        );

        return;

      }

      deferredInstall.prompt();

      try {

        await deferredInstall.userChoice;

      } catch (error) {
        // usuário fechou a janela
      }

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

initVolume();

initMetadata();

initMediaSession();

/* =========================================================
   EVENTO GLOBAL PARA OUTROS MÓDULOS
   ========================================================= */

/*
  Outros scripts poderão escutar:

  document.addEventListener(
    'ntp:trackchange',
    event => {
      console.log(event.detail);
    }
  );
*/

console.log(
  'NTP RÁDIO WEB — sistema inicializado.'
);
