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
  if (!('mediaSession' in navigator)) {
    console.log('Media Session API não disponível neste navegador.');
    return;
  }

  try {
    navigator.mediaSession.setActionHandler('play', async () => {
      try {
        await radio.play();
        navigator.mediaSession.playbackState = 'playing';
      } catch (error) {
        console.error('Erro ao reproduzir:', error);
      }
    });
  } catch (e) {}

  try {
    navigator.mediaSession.setActionHandler('pause', () => {
      radio.pause();
      navigator.mediaSession.playbackState = 'paused';
    });
  } catch (e) {}

  try {
    navigator.mediaSession.setActionHandler('stop', () => {
      radio.pause();
      navigator.mediaSession.playbackState = 'none';
    });
  } catch (e) {}

  try {
    navigator.mediaSession.setActionHandler('seekbackward', () => {});
  } catch (e) {}

  try {
    navigator.mediaSession.setActionHandler('seekforward', () => {});
  } catch (e) {}

  updateMediaSession(currentTrack || {
    title: 'NTP RÁDIO WEB',
    artist: 'Ao vivo',
    album: 'Rádio Online'
  });
}
// ======================================================
// REPRODUÇÃO EM SEGUNDO PLANO / TELA BLOQUEADA
// ======================================================

function updatePlaybackState() {
  if (!('mediaSession' in navigator)) return;

  if (!radio.paused) {
    navigator.mediaSession.playbackState = 'playing';
  } else {
    navigator.mediaSession.playbackState = 'paused';
  }
}

radio.addEventListener('play', () => {
  updatePlaybackState();
});

radio.addEventListener('playing', () => {
  updatePlaybackState();
});

radio.addEventListener('pause', () => {
  updatePlaybackState();
});

radio.addEventListener('ended', () => {
  if ('mediaSession' in navigator) {
    navigator.mediaSession.playbackState = 'none';
  }
});

document.addEventListener('visibilitychange', () => {
  if (!radio.paused) {
    updatePlaybackState();
  }
});

window.addEventListener('pagehide', () => {
  if (!radio.paused) {
    updatePlaybackState();
  }
});

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
  // Verifica se o navegador suporta Document Picture-in-Picture
  if (!('documentPictureInPicture' in window)) {
    console.warn('Picture-in-Picture não é suportado neste navegador.');
    
    // Alternativa: informa ao usuário que o áudio pode continuar
    // em segundo plano usando o player normal.
    alert(
      'O mini player flutuante não é suportado neste navegador. ' +
      'Você ainda pode ouvir a rádio em segundo plano pelo player normal.'
    );
    
    return;
  }

  // Evita abrir várias janelas PiP
  if (window.__ntpPipWindow && !window.__ntpPipWindow.closed) {
    window.__ntpPipWindow.focus();
    return;
  }

  try {
    const pipWindow = await documentPictureInPicture.requestWindow({
      width: 360,
      height: 220
    });

    window.__ntpPipWindow = pipWindow;

    // ==================================================
    // ESTILO DO MINI PLAYER
    // ==================================================

    const style = pipWindow.document.createElement('style');

    style.textContent = `
      * {
        box-sizing: border-box;
      }

      html,
      body {
        margin: 0;
        padding: 0;
        width: 100%;
        height: 100%;
        overflow: hidden;
        font-family: Arial, sans-serif;
        background: #0b1020;
        color: #ffffff;
      }

      .ntp-pip {
        width: 100%;
        height: 100%;
        padding: 18px;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        background:
          radial-gradient(circle at top right, #26345f 0%, transparent 45%),
          #0b1020;
      }

      .ntp-pip-header {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .ntp-pip-logo {
        width: 48px;
        height: 48px;
        border-radius: 12px;
        object-fit: cover;
        background: #151d35;
      }

      .ntp-pip-info {
        min-width: 0;
        flex: 1;
      }

      .ntp-pip-title {
        font-size: 16px;
        font-weight: 700;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .ntp-pip-artist {
        margin-top: 5px;
        font-size: 13px;
        opacity: .72;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .ntp-pip-live {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        margin-top: 7px;
        font-size: 10px;
        font-weight: 700;
        letter-spacing: .8px;
        color: #ff4d6d;
      }

      .ntp-pip-live-dot {
        width: 7px;
        height: 7px;
        border-radius: 50%;
        background: #ff4d6d;
        animation: ntpPulse 1.2s infinite;
      }

      @keyframes ntpPulse {
        0%, 100% {
          opacity: 1;
        }

        50% {
          opacity: .35;
        }
      }

      .ntp-pip-controls {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 14px;
      }

      .ntp-pip-button {
        width: 52px;
        height: 52px;
        border: 0;
        border-radius: 50%;
        background: #ffffff;
        color: #0b1020;
        font-size: 22px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .ntp-pip-button:active {
        transform: scale(.94);
      }

      .ntp-pip-close {
        width: 38px;
        height: 38px;
        border: 0;
        border-radius: 50%;
        background: rgba(255,255,255,.12);
        color: #ffffff;
        font-size: 18px;
        cursor: pointer;
      }

      .ntp-pip-status {
        text-align: center;
        font-size: 11px;
        opacity: .55;
      }
    `;

    pipWindow.document.head.appendChild(style);

    // ==================================================
    // HTML DO MINI PLAYER
    // ==================================================

    const container = pipWindow.document.createElement('div');

    container.className = 'ntp-pip';

    container.innerHTML = `
      <div class="ntp-pip-header">

        <img
          class="ntp-pip-logo"
          src="favicon.svg"
          alt="NTP Rádio Web"
        >

        <div class="ntp-pip-info">

          <div class="ntp-pip-title">
            NTP RÁDIO WEB
          </div>

          <div class="ntp-pip-artist">
            Ao vivo
          </div>

          <div class="ntp-pip-live">
            <span class="ntp-pip-live-dot"></span>
            AO VIVO
          </div>

        </div>

      </div>

      <div class="ntp-pip-controls">

        <button
          class="ntp-pip-close"
          id="ntpPipClose"
          aria-label="Fechar mini player">
          ✕
        </button>

        <button
          class="ntp-pip-button"
          id="ntpPipPlay"
          aria-label="Reproduzir rádio">
          ▶
        </button>

      </div>

      <div
        class="ntp-pip-status"
        id="ntpPipStatus">
        Rádio online
      </div>
    `;

    pipWindow.document.body.appendChild(container);

    // ==================================================
    // ELEMENTOS
    // ==================================================

    const pipPlay = pipWindow.document.getElementById('ntpPipPlay');
    const pipClose = pipWindow.document.getElementById('ntpPipClose');
    const pipTitle = pipWindow.document.querySelector('.ntp-pip-title');
    const pipArtist = pipWindow.document.querySelector('.ntp-pip-artist');
    const pipStatus = pipWindow.document.getElementById('ntpPipStatus');

    // ==================================================
    // ATUALIZA O BOTÃO PLAY/PAUSE
    // ==================================================

    function updatePipButton() {
      if (!pipPlay) return;

      if (radio.paused) {
        pipPlay.textContent = '▶';
        pipPlay.setAttribute(
          'aria-label',
          'Reproduzir rádio'
        );
      } else {
        pipPlay.textContent = '❚❚';
        pipPlay.setAttribute(
          'aria-label',
          'Pausar rádio'
        );
      }
    }

    // ==================================================
    // PLAY / PAUSE
    // ==================================================

    pipPlay.addEventListener('click', async () => {

      try {

        if (radio.paused) {

          await radio.play();

          if ('mediaSession' in navigator) {
            navigator.mediaSession.playbackState = 'playing';
          }

          pipStatus.textContent = 'Reproduzindo ao vivo';

        } else {

          radio.pause();

          if ('mediaSession' in navigator) {
            navigator.mediaSession.playbackState = 'paused';
          }

          pipStatus.textContent = 'Pausado';

        }

        updatePipButton();

      } catch (error) {

        console.error(
          'Erro no mini player:',
          error
        );

        pipStatus.textContent =
          'Não foi possível reproduzir';

      }

    });

    // ==================================================
    // FECHAR
    // ==================================================

    pipClose.addEventListener('click', () => {

      try {
        pipWindow.close();
      } catch (error) {
        console.error(error);
      }

    });

    // ==================================================
    // SINCRONIZAÇÃO COM O PLAYER PRINCIPAL
    // ==================================================

    function syncPip() {

      updatePipButton();

      if (!radio.paused) {
        pipStatus.textContent =
          'Reproduzindo ao vivo';
      } else {
        pipStatus.textContent =
          'Pausado';
      }

    }

    radio.addEventListener('play', syncPip);
    radio.addEventListener('playing', syncPip);
    radio.addEventListener('pause', syncPip);

    // ==================================================
    // ATUALIZA METADATA NO MINI PLAYER
    // ==================================================

    function updatePipMetadata(track) {

      if (!track) return;

      const title =
        track.title ||
        track.name ||
        'NTP RÁDIO WEB';

      const artist =
        track.artist ||
        track.author ||
        'Ao vivo';

      if (pipTitle) {
        pipTitle.textContent = title;
      }

      if (pipArtist) {
        pipArtist.textContent = artist;
      }

    }

    // Tenta mostrar a faixa atual
    if (typeof currentTrack !== 'undefined' && currentTrack) {
      updatePipMetadata(currentTrack);
    }

    // Observa alterações da metadata existente
    const originalUpdateMediaSession =
      window.updateMediaSession;

    if (typeof originalUpdateMediaSession === 'function') {
      // O player principal continua funcionando normalmente.
      // A metadata do PiP será atualizada pelos eventos abaixo.
    }

    // ==================================================
    // QUANDO A JANELA PiP FOR FECHADA
    // ==================================================

    pipWindow.addEventListener('pagehide', () => {

      window.__ntpPipWindow = null;

      // Remove listeners associados ao mini player
      radio.removeEventListener('play', syncPip);
      radio.removeEventListener('playing', syncPip);
      radio.removeEventListener('pause', syncPip);

    });

    // ==================================================
    // ESTADO INICIAL
    // ==================================================

    syncPip();

  } catch (error) {

    console.error(
      'Erro ao abrir o mini player PiP:',
      error
    );

    window.__ntpPipWindow = null;

    alert(
      'Não foi possível abrir o mini player neste navegador.'
    );
  }
}

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
