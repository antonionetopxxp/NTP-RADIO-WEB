const STREAM_URL = 'https://stream.zeno.fm/elhz4znig9wuv';
const META_URL = 'https://api.zeno.fm/mounts/metadata/subscribe/elhz4znig9wuv';

const radio = document.getElementById('radio');
const volumeInput = document.getElementById('volume');
const volumeMini = document.getElementById('volumeMini');

const playButtons = document.querySelectorAll('[data-play]');
const nowPlayingEls = document.querySelectorAll('[data-now]');
const eqEls = document.querySelectorAll('[data-eq]');

let lastTrackText = '🎵 Carregando música...';
let pipWindow = null;


/* =========================================================
   ESTADO DO PLAYER
========================================================= */

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


  updatePipState(state);
}


/* =========================================================
   LIMPEZA DO NOME DA MÚSICA
========================================================= */

function cleanTrackTitle(raw) {

  let title = String(raw || '').trim();

  if (!title) {
    return '';
  }


  // Remove informações entre colchetes no final
  title = title.replace(
    /\s*-\s*\[[^\]]*\]\s*$/,
    ''
  );


  // Remove "Various Artists - número -"
  title = title.replace(
    /^\s*Various Artists\s*-\s*\d+\s*-\s*/,
    ''
  );


  // Remove numeração inicial
  title = title.replace(
    /^\s*\d+\.\s*/,
    ''
  );


  // Remove espaços duplicados
  title = title.replace(
    /\s{2,}/g,
    ' '
  ).trim();


  return title;
}


/* =========================================================
   SEPARAÇÃO ARTISTA / MÚSICA
========================================================= */

function parseTrack(raw) {

  const cleaned = cleanTrackTitle(raw);


  if (!cleaned) {

    return {
      artist: 'NTP RÁDIO WEB',
      title: 'Carregando música...'
    };

  }


  /*
   * Exemplos aceitos:
   *
   * Bon Jovi - Always
   * Gusttavo Lima - Apelido Carinhoso
   * Banda X - Música Y - Remix
   *
   * O primeiro "-" separa o artista.
   */

  const parts = cleaned
    .split(/\s+-\s+/)
    .map(part => part.trim())
    .filter(Boolean);


  if (parts.length >= 2) {

    return {

      artist: parts[0],

      title: parts
        .slice(1)
        .join(' - ')

    };

  }


  /*
   * Caso o Zeno envie somente:
   *
   * Always
   *
   * Mantemos o texto inteiro como música.
   */

  return {

    artist: 'NTP RÁDIO WEB',

    title: cleaned

  };

}


/* =========================================================
   ATUALIZAÇÃO DA MÚSICA
========================================================= */

function setNowPlaying(title) {

  const track = parseTrack(title);


  const cleaned =
    track.title === 'Carregando música...'
      ? ''
      : `${track.artist} - ${track.title}`;


  const text = cleaned
    ? '🎵 ' + cleaned
    : '🎵 Carregando música...';


  lastTrackText = text;


  /*
   * Atualiza todos os elementos [data-now]
   */

  nowPlayingEls.forEach(el => {

    el.classList.add('track-changing');


    setTimeout(() => {

      el.textContent = text;

      el.title = cleaned || '';


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
   * Elementos específicos de artista
   */

  const artistElement =
    document.getElementById('artist');


  const titleElement =
    document.getElementById('trackTitle');


  if (artistElement) {

    artistElement.textContent =
      track.artist;

  }


  if (titleElement) {

    titleElement.textContent =
      text;

  }


  /*
   * Título da aba
   */

  if (cleaned) {

    document.title =
      cleaned +
      ' | NTP RÁDIO WEB';

  } else {

    document.title =
      'NTP RÁDIO WEB | Rádio Online ao Vivo';

  }


  /*
   * Atualiza mini player
   */

  updatePipNowPlaying(text);


  /*
   * Atualiza controles do sistema
   * Android / Chrome / tela bloqueada
   */

  updateMediaSession(
    track.title,
    track.artist
  );


  /*
   * Atualiza capa
   */

  updateCover(
    track.artist,
    track.title
  );

}


/* =========================================================
   CAPA DA RÁDIO
========================================================= */

const DEFAULT_COVER = 'ntp1.png';


function updateCover(artist, title) {

  const cover =
    document.getElementById('cover');


  const miniCover =
    document.getElementById('miniCover');


  /*
   * Se não houver música válida,
   * usa a capa padrão.
   */

  if (!artist || !title) {

    setCover(DEFAULT_COVER);

    return;

  }


  /*
   * Por enquanto utilizamos a capa oficial
   * da rádio como fallback.
   *
   * A estrutura fica preparada para futuramente
   * integrar uma API de capas de músicas.
   */

  setCover(DEFAULT_COVER);

}


function setCover(src) {

  const cover =
    document.getElementById('cover');


  const miniCover =
    document.getElementById('miniCover');


  if (cover) {

    cover.onerror = () => {

      /*
       * Evita imagem quebrada.
       */

      if (cover.src !== DEFAULT_COVER) {
        cover.src = DEFAULT_COVER;
      }

    };


    cover.src = src;

  }


  if (miniCover) {

    miniCover.onerror = () => {

      if (miniCover.src !== DEFAULT_COVER) {
        miniCover.src = DEFAULT_COVER;
      }

    };


    miniCover.src = src;

  }

}


/* =========================================================
   MEDIA SESSION
========================================================= */

function initMediaSession() {

  if (!('mediaSession' in navigator)) {
    return;
  }


  try {

    navigator.mediaSession.setActionHandler(
      'play',
      () => {

        radio.play().catch(() => {});

      }
    );


    navigator.mediaSession.setActionHandler(
      'pause',
      () => {

        radio.pause();

      }
    );


  } catch (error) {

    /*
     * Alguns navegadores não suportam
     * todos os controles.
     */

  }


  updateMediaSession(
    '',
    'NTP RÁDIO WEB'
  );

}


function updateMediaSession(title, artist) {

  if (!('mediaSession' in navigator)) {
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
     * Media Session indisponível.
     */

  }

}


/* =========================================================
   PLAY / PAUSE
========================================================= */

function togglePlay() {

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


/*
 * Botões de reprodução
 */

playButtons.forEach(button => {

  button.addEventListener(
    'click',
    togglePlay
  );

});


/*
 * Eventos do áudio
 */

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


/*
 * Erro do stream
 */

radio.addEventListener(
  'error',
  () => {

    toast(
      'Não foi possível conectar à rádio. Tente novamente.'
    );

    setPlaying(false);

  }
);


/* =========================================================
   VOLUME
========================================================= */

if (volumeInput || volumeMini) {

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


  radio.volume =
    initialVolume;


  if (volumeInput) {

    volumeInput.value =
      String(initialVolume);

  }


  if (volumeMini) {

    volumeMini.value =
      String(initialVolume);

  }


  function applyVolume(value) {

    /*
     * Garante que o volume fique
     * entre 0 e 1.
     */

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

      /*
       * LocalStorage indisponível.
       */

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

  if (!('EventSource' in window)) {

    setNowPlaying('');

    return;

  }


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
         * Evento sem título.
         */

      }

    }
  );


  source.addEventListener(
    'error',
    () => {

      /*
       * EventSource tenta reconectar
       * automaticamente.
       *
       * Mantemos a última música exibida.
       */

    }
  );

}


/* =========================================================
   TOAST / NOTIFICAÇÕES
========================================================= */

function toast(message) {

  const element =
    document.getElementById('toast');


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
    setTimeout(() => {

      element.classList.remove(
        'show'
      );

    }, 2600);

}


/* =========================================================
   MENU MOBILE
========================================================= */

const navToggle =
  document.getElementById(
    'navToggle'
  );


const navLinks =
  document.getElementById(
    'navLinks'
  );


if (navToggle && navLinks) {

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
   ANIMAÇÕES DE REVEAL
========================================================= */

if ('IntersectionObserver' in window) {

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

  /*
   * Navegadores antigos:
   * deixa os elementos visíveis.
   */

  document
    .querySelectorAll('.reveal')
    .forEach(element => {

      element.classList.add(
        'visible'
      );

    });

}


/* =========================================================
   PICTURE-IN-PICTURE / MINI PLAYER
========================================================= */

const pipButtons =
  document.querySelectorAll(
    '[data-pip]'
  );


function isPipSupported() {

  return (
    'documentPictureInPicture'
    in window
  );

}


/* =========================================================
   ATUALIZA MINI PLAYER
========================================================= */

function updatePipNowPlaying(text) {

  if (!pipWindow) {
    return;
  }


  const track =
    pipWindow.document.getElementById(
      'pipTrack'
    );


  if (track) {

    track.textContent =
      text;

  }

}


/* =========================================================
   ESTADO MINI PLAYER
========================================================= */

function updatePipState(state) {

  if (!pipWindow) {
    return;
  }


  const button =
    pipWindow.document.getElementById(
      'pipPlay'
    );


  const eq =
    pipWindow.document.getElementById(
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
   COPIA CSS PARA MINI PLAYER
========================================================= */

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


/* =========================================================
   SINCRONIZA VOLUME DO MINI PLAYER
========================================================= */

function syncPipVolume(value) {

  if (!pipWindow) {
    return;
  }


  const pipVolume =
    pipWindow.document.getElementById(
      'pipVolume'
    );


  if (pipVolume) {

    pipVolume.value =
      String(value);

  }

}


/* =========================================================
   ABRIR MINI PLAYER
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


  /*
   * Começa a rádio automaticamente
   * quando o usuário abre o mini player.
   */

  if (radio.paused) {

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


  /*
   * Copia os estilos da página.
   */

  copyStyleSheets(
    pipWindow.document
  );


  /*
   * Pequena configuração visual.
   */

  pipWindow.document.title =
    'NTP RÁDIO WEB';


  pipWindow.document.body.appendChild(
    buildPipContent()
  );


  /*
   * Botão fechar
   */

  const closeButton =
    pipWindow.document.getElementById(
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


  /*
   * Botão play/pause
   */

  const pipPlay =
    pipWindow.document.getElementById(
      'pipPlay'
    );


  if (pipPlay) {

    pipPlay.addEventListener(
      'click',
      togglePlay
    );

  }


  /*
   * Volume
   */

  const pipVolume =
    pipWindow.document.getElementById(
      'pipVolume'
    );


  if (pipVolume) {

    pipVolume.value =
      String(
        radio.volume
      );


    pipVolume.addEventListener(
      'input',
      () => {

        const value =
          parseFloat(
            pipVolume.value
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


        try {

          localStorage.setItem(
            'ntpVolume',
            String(value)
          );

        } catch (error) {}

      }
    );

  }


  /*
   * Estado inicial.
   */

  updatePipNowPlaying(
    lastTrackText
  );


  updatePipState(
    !radio.paused
  );


  pipButtons.forEach(button => {

    button.classList.add(
      'active'
    );

  });


  /*
   * Quando a janela for fechada.
   */

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


/*
 * Ativa os botões do mini player
 */

pipButtons.forEach(button => {

  button.addEventListener(
    'click',
    openPip
  );

});


/* =========================================================
   PLAYER MINIMIZADO
========================================================= */

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


/* =========================================================
   SERVICE WORKER / PWA
========================================================= */

if ('serviceWorker' in navigator) {

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
   INSTALAÇÃO DO APLICATIVO
========================================================= */

let deferredInstall = null;


const installBtn =
  document.getElementById(
    'installBtn'
  );


/*
 * O navegador oferece instalação.
 */

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


/*
 * Aplicativo instalado.
 */

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


/*
 * Clique no botão instalar.
 */

if (installBtn) {

  installBtn.addEventListener(
    'click',
    async () => {

      /*
       * Se o navegador não disponibilizou
       * o prompt automático.
       */

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

        /*
         * Usuário fechou ou recusou
         * o prompt.
         */

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

setNowPlaying('');

initMetadata();

initMediaSession();


/* =========================================================
   CONFIGURAÇÃO DO STREAM
========================================================= */

/*
 * O elemento <audio> deve possuir:
 *
 * <audio id="radio"></audio>
 *
 * ou
 *
 * <audio
 *   id="radio"
 *   src="https://stream.zeno.fm/elhz4znig9wuv"
 * ></audio>
 *
 * Para garantir que o stream esteja configurado,
 * definimos o src caso ele ainda esteja vazio.
 */

if (radio) {

  if (!radio.src) {

    radio.src =
      STREAM_URL;

  }

  /*
   * Mantém o áudio preparado para reprodução.
   */

  radio.preload =
    'none';

}
