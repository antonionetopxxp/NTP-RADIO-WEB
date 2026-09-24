const STREAM_URL = 'https://stream.zeno.fm/elhz4znig9wuv';
const META_URL = 'https://api.zeno.fm/mounts/metadata/subscribe/elhz4znig9wuv';

const radio = document.getElementById('radio');
const volumeInput = document.getElementById('volume');
const volumeMini = document.getElementById('volumeMini');
const playButtons = document.querySelectorAll('[data-play]');
const nowPlayingEls = document.querySelectorAll('[data-now]');
const eqEls = document.querySelectorAll('[data-eq]');

let lastTrackText = '🎵 Carregando música...';

function setPlaying(state) {
  document.body.classList.toggle('is-playing', state);

  playButtons.forEach(button => {
    button.classList.toggle('playing', state);
    button.setAttribute('aria-pressed', String(state));
    button.setAttribute('aria-label', state ? 'Pausar' : 'Tocar');
  });

  eqEls.forEach(eq => eq.classList.toggle('on', state));

  updatePipState(state);
}

function cleanTrackTitle(raw) {
  let title = String(raw || '').trim();

  if (!title) return '';

  title = title.replace(/\s*-\s*\[[^\]]*\]\s*$/, '');
  title = title.replace(/^\s*Various Artists\s*-\s*\d+\s*-\s*/, '');
  title = title.replace(/^\s*\d+\.\s*/, '');
  title = title.replace(/\s{2,}/g, ' ').trim();

  return title;
}

function setNowPlaying(title) {
  const cleaned = cleanTrackTitle(title);
  const text = cleaned
    ? '🎵 ' + cleaned
    : '🎵 Carregando música...';

  lastTrackText = text;

  nowPlayingEls.forEach(el => {
    el.textContent = text;
    el.title = cleaned || '';
  });

  if (cleaned) {
    document.title = cleaned + ' | NTP RÁDIO WEB';
  }

  updatePipNowPlaying(text);
  updateMediaSession(cleaned);
}

function initMediaSession() {
  if (!('mediaSession' in navigator)) return;

  try {
    navigator.mediaSession.setActionHandler('play', () => radio.play());
    navigator.mediaSession.setActionHandler('pause', () => radio.pause());
  } catch (error) {
    // handlers não suportados
  }

  updateMediaSession('');
}

function updateMediaSession(title) {
  if (!('mediaSession' in navigator)) return;

  try {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: title || 'NTP RÁDIO WEB',
      artist: 'NTP RÁDIO WEB',
      album: 'Rádio Online',
      artwork: [{ src: 'favicon.svg', sizes: '64x64', type: 'image/svg+xml' }]
    });
  } catch (error) {
    // MediaMetadata indisponível
  }
}

function togglePlay() {
  if (radio.paused) {
    radio.play()
      .then(() => setPlaying(true))
      .catch(() => toast('Não foi possível iniciar o áudio. Tente novamente.'));
  } else {
    radio.pause();
    setPlaying(false);
  }
}

playButtons.forEach(button => {
  button.addEventListener('click', togglePlay);
});

radio.addEventListener('play', () => setPlaying(true));
radio.addEventListener('pause', () => setPlaying(false));
radio.addEventListener('ended', () => setPlaying(false));

if (volumeInput || volumeMini) {
  let savedVolume;

  try {
    savedVolume = parseFloat(localStorage.getItem('ntpVolume'));
  } catch (error) {
    savedVolume = NaN;
  }

  const initialVolume = Number.isFinite(savedVolume) ? savedVolume : 0.8;

  radio.volume = initialVolume;

  if (volumeInput) {
    volumeInput.value = String(initialVolume);
  }

  if (volumeMini) {
    volumeMini.value = String(initialVolume);
  }

  const applyVolume = value => {
    radio.volume = value;

    if (volumeInput && volumeInput !== document.activeElement) {
      volumeInput.value = String(value);
    }

    if (volumeMini && volumeMini !== document.activeElement) {
      volumeMini.value = String(value);
    }

    syncPipVolume(value);

    try {
      localStorage.setItem('ntpVolume', String(value));
    } catch (error) {
      // armazenamento indisponível
    }
  };

  if (volumeInput) {
    volumeInput.addEventListener('input', () => {
      applyVolume(parseFloat(volumeInput.value));
    });
  }

  if (volumeMini) {
    volumeMini.addEventListener('input', () => {
      applyVolume(parseFloat(volumeMini.value));
    });
  }
}

function initMetadata() {
  if (!('EventSource' in window)) {
    setNowPlaying('');
    return;
  }

  const source = new EventSource(META_URL);

  source.addEventListener('message', event => {
    try {
      const data = JSON.parse(event.data);

      if (data && data.streamTitle) {
        setNowPlaying(data.streamTitle);
      }
    } catch (error) {
      // evento sem título, apenas ping
    }
  });

  source.addEventListener('error', () => {
    // O EventSource reconecta automaticamente. Mantemos a última música exibida.
  });
}

function toast(message) {
  const element = document.getElementById('toast');

  element.textContent = message;
  element.classList.add('show');

  clearTimeout(window.toastTimer);

  window.toastTimer = setTimeout(() => {
    element.classList.remove('show');
  }, 2600);
}

const navToggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');

navToggle.addEventListener('click', () => {
  const open = navLinks.classList.toggle('open');

  navToggle.setAttribute('aria-expanded', String(open));
  navToggle.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
});

const playerMin = document.getElementById('playerMin');

if (playerMin) {
  playerMin.addEventListener('click', () => {
    const minimized = document.body.classList.toggle('player-minimized');

    playerMin.setAttribute('aria-label', minimized ? 'Expandir player' : 'Minimizar player');
  });
}

navLinks.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    navLinks.classList.remove('open');
    navToggle.setAttribute('aria-expanded', 'false');
  });
});

const revealObserver = new IntersectionObserver(
  entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.12 }
);

document
  .querySelectorAll('.reveal')
  .forEach(element => revealObserver.observe(element));

initMetadata();
initMediaSession();

/* ---------- PICTURE-IN-PICTURE (MINI PLAYER) ---------- */

const pipButtons = document.querySelectorAll('[data-pip]');
let pipWindow = null;

function isPipSupported() {
  return 'documentPictureInPicture' in window;
}

function updatePipNowPlaying(text) {
  if (!pipWindow) return;

  const track = pipWindow.document.getElementById('pipTrack');

  if (track) {
    track.textContent = text;
  }
}

function updatePipState(state) {
  if (!pipWindow) return;

  const button = pipWindow.document.getElementById('pipPlay');
  const eq = pipWindow.document.getElementById('pipEq');

  if (button) {
    button.classList.toggle('playing', state);
    button.setAttribute('aria-pressed', String(state));
    button.setAttribute('aria-label', state ? 'Pausar' : 'Tocar');
  }

  if (eq) {
    eq.classList.toggle('on', state);
  }
}

function buildPipContent() {
  const wrap = document.createElement('div');

  wrap.className = 'pip-window';

  wrap.innerHTML = `
    <button class="pip-close" id="pipClose" aria-label="Fechar mini player">&times;</button>
    <div class="pip-brand">NTP <b>RÁDIO WEB</b></div>
    <div class="eq" id="pipEq"><span></span><span></span><span></span><span></span><span></span></div>
    <div class="pip-track" id="pipTrack">🎵 Carregando música...</div>
    <button class="play-btn" id="pipPlay" aria-label="Tocar" aria-pressed="false">
      <span class="pb-play" aria-hidden="true"></span>
      <span class="pb-pause" aria-hidden="true"></span>
    </button>
    <div class="pip-volume">
      <svg class="vol-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 9v6h4l5 5V4L7 9H3z" fill="currentColor"></path><path d="M16 8a5 5 0 0 1 0 8M18.5 5.5a9 9 0 0 1 0 13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"></path></svg>
      <input type="range" id="pipVolume" min="0" max="1" step="0.01" value="0.8" aria-label="Volume do mini player">
    </div>
  `;

  return wrap;
}

function copyStyleSheets(targetDocument) {
  [...document.styleSheets].forEach(styleSheet => {
    if (!styleSheet.href) return;

    const link = document.createElement('link');

    link.rel = 'stylesheet';
    link.href = styleSheet.href;

    targetDocument.head.appendChild(link);
  });
}

function syncPipVolume(value) {
  if (pipWindow) {
    const pipVolume = pipWindow.document.getElementById('pipVolume');

    if (pipVolume) {
      pipVolume.value = String(value);
    }
  }
}

async function openPip() {
  if (!isPipSupported()) {
    document.getElementById('ao-vivo').scrollIntoView({ behavior: 'smooth', block: 'start' });
    return;
  }

  if (pipWindow) {
    toast('O mini player já está aberto.');
    return;
  }

  if (radio.paused) {
    radio.play().catch(() => {});
  }

  let windowRef;

  try {
    windowRef = await documentPictureInPicture.requestWindow({
      width: 340,
      height: 300
    });
  } catch (error) {
    pipWindow = null;
    toast('Não foi possível abrir o mini player.');
    return;
  }

  pipWindow = windowRef;

  copyStyleSheets(pipWindow.document);

  pipWindow.document.body.appendChild(buildPipContent());

  pipWindow.document
    .getElementById('pipClose')
    .addEventListener('click', () => pipWindow.close());

  pipWindow.document
    .getElementById('pipPlay')
    .addEventListener('click', togglePlay);

  const pipVolume = pipWindow.document.getElementById('pipVolume');

  if (pipVolume) {
    pipVolume.value = String(radio.volume);

    pipVolume.addEventListener('input', () => {
      const value = parseFloat(pipVolume.value);

      radio.volume = value;

      if (volumeInput) {
        volumeInput.value = String(value);
      }

      try {
        localStorage.setItem('ntpVolume', String(value));
      } catch (error) {
        // armazenamento indisponível
      }
    });
  }

  updatePipNowPlaying(lastTrackText);
  updatePipState(!radio.paused);

  pipButtons.forEach(button => button.classList.add('active'));

  pipWindow.addEventListener('pagehide', () => {
    pipWindow = null;

    pipButtons.forEach(button => button.classList.remove('active'));
  });
}

pipButtons.forEach(button => {
  button.addEventListener('click', openPip);
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  });
}

let deferredInstall = null;
const installBtn = document.getElementById('installBtn');

window.addEventListener('beforeinstallprompt', event => {
  event.preventDefault();
  deferredInstall = event;

  if (installBtn) {
    installBtn.hidden = false;
  }
});

window.addEventListener('appinstalled', () => {
  deferredInstall = null;

  if (installBtn) {
    installBtn.hidden = true;
  }
});

if (installBtn) {
  installBtn.addEventListener('click', async () => {
    if (!deferredInstall) {
      toast('Instale pelo menu do navegador: ⋮ → "Adicionar à tela inicial".');
      return;
    }

    deferredInstall.prompt();
    const choice = await deferredInstall.userChoice;
    deferredInstall = null;
    installBtn.hidden = true;
  });
}
