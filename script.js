const STREAM_URL = 'https://stream.zeno.fm/elhz4znig9wuv';
const META_URL = 'https://api.zeno.fm/mounts/metadata/subscribe/elhz4znig9wuv';

const radio = document.getElementById('radio');
const volumeInput = document.getElementById('volume');
const playButtons = document.querySelectorAll('[data-play]');
const nowPlayingEls = document.querySelectorAll('[data-now]');
const eqEls = document.querySelectorAll('[data-eq]');

function setPlaying(state) {
  document.body.classList.toggle('is-playing', state);

  playButtons.forEach(button => {
    button.classList.toggle('playing', state);
    button.setAttribute('aria-pressed', String(state));
    button.setAttribute('aria-label', state ? 'Pausar' : 'Tocar');
  });

  eqEls.forEach(eq => eq.classList.toggle('on', state));
}

function setNowPlaying(title) {
  const text = title
    ? '🎵 ' + title
    : '🎵 Carregando música...';

  nowPlayingEls.forEach(el => {
    el.textContent = text;
    el.title = title || '';
  });

  if (title) {
    document.title = title + ' | NTP RÁDIO WEB';
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

if (volumeInput) {
  let savedVolume;

  try {
    savedVolume = parseFloat(localStorage.getItem('ntpVolume'));
  } catch (error) {
    savedVolume = NaN;
  }

  const initialVolume = Number.isFinite(savedVolume) ? savedVolume : 0.8;

  radio.volume = initialVolume;
  volumeInput.value = String(initialVolume);

  volumeInput.addEventListener('input', () => {
    const value = parseFloat(volumeInput.value);

    radio.volume = value;

    try {
      localStorage.setItem('ntpVolume', String(value));
    } catch (error) {
      // armazenamento indisponível
    }
  });
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
