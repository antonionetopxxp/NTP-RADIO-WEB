const CONFIG_URL = "./config/radio.json";

let RADIO_CONFIG = null;

let radio;
let volumeInput;
let volumeMini;
let playButtons;
let nowPlayingEls;
let eqEls;

let currentTrack = "🎵 Carregando música...";

/* =========================
   CARREGAR CONFIGURAÇÃO
========================= */

async function loadRadioConfig() {
  try {
    const response = await fetch(CONFIG_URL, {
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error(
        `Erro HTTP ${response.status}`
      );
    }

    RADIO_CONFIG = await response.json();

    console.log(
      "Configuração da rádio carregada:",
      RADIO_CONFIG
    );

    initializeRadio();

  } catch (error) {
    console.error(
      "Não foi possível carregar config/radio.json:",
      error
    );

    /*
     * Fallback de segurança.
     * Se o JSON falhar, a rádio ainda tenta
     * utilizar o endereço conhecido.
     */

    RADIO_CONFIG = {
      station: {
        name: "NTP RÁDIO WEB"
      },

     let ACTIVE_STREAM_URL = 'https://stream.zeno.fm/elhz4znig9wuv';
let ACTIVE_META_URL = 'https://api.zeno.fm/mounts/metadata/subscribe/elhz4znig9wuv';

let metadataSource = null;

    initializeRadio();
  }
}


/* =========================
   INICIALIZAR RÁDIO
========================= */

function initializeRadio() {

  radio = document.getElementById("radio");

  volumeInput =
    document.getElementById("volume");

  volumeMini =
    document.getElementById("volumeMini");

  playButtons =
    document.querySelectorAll("[data-play]");

  nowPlayingEls =
    document.querySelectorAll("[data-now]");

  eqEls =
    document.querySelectorAll("[data-eq]");


  if (!radio) {
    console.error(
      "Elemento #radio não encontrado no index.html."
    );

    return;
  }


  /*
   * Pega o stream do JSON.
   */

  const stream =
    RADIO_CONFIG.stream.url;


  /*
   * Garante que o áudio utilize
   * o endereço configurado.
   */

  if (radio.src !== stream) {
    radio.src = stream;
  }


  /*
   * Eventos do player.
   */

  setupPlayer();

  setupVolume();

  setupMenu();

  setupAnimations();

  setupInstall();

  startMetadata();

  console.log(
    "NTP RÁDIO WEB pronta."
  );

  console.log(
    "Stream:",
    stream
  );
}


/* =========================
   PLAYER
========================= */

function setupPlayer() {

  playButtons.forEach((button) => {

    button.addEventListener(
      "click",
      toggleRadio
    );

  });


  radio.addEventListener(
    "play",
    () => {
      updatePlayer(true);
    }
  );


  radio.addEventListener(
    "playing",
    () => {
      updatePlayer(true);
    }
  );


  radio.addEventListener(
    "pause",
    () => {
      updatePlayer(false);
    }
  );


  radio.addEventListener(
    "ended",
    () => {
      updatePlayer(false);
    }
  );


  radio.addEventListener(
    "error",
    () => {

      console.error(
        "Erro no áudio:",
        radio.error
      );

    }
  );


  radio.addEventListener(
    "stalled",
    () => {

      console.warn(
        "Stream temporariamente parado."
      );

    }
  );


  radio.addEventListener(
    "waiting",
    () => {

      console.log(
        "Aguardando transmissão..."
      );

    }
  );


  radio.addEventListener(
    "canplay",
    () => {

      console.log(
        "Stream disponível."
      );

    }
  );
}


function updatePlayer(playing) {

  document.body.classList.toggle(
    "is-playing",
    playing
  );


  playButtons.forEach((button) => {

    button.classList.toggle(
      "playing",
      playing
    );

    button.setAttribute(
      "aria-pressed",
      String(playing)
    );

    button.setAttribute(
      "aria-label",
      playing
        ? "Pausar rádio"
        : "Tocar rádio"
    );

  });


  eqEls.forEach((eq) => {

    eq.classList.toggle(
      "on",
      playing
    );

  });
}


function toggleRadio() {

  if (!radio) return;


  if (radio.paused) {

    radio
      .play()
      .then(() => {

        updatePlayer(true);

      })
      .catch((error) => {

        console.error(
          "Não foi possível iniciar a rádio:",
          error
        );

        showToast(
          "Não foi possível iniciar a rádio. Tente novamente."
        );

      });

  } else {

    radio.pause();

    updatePlayer(false);

  }
}


/* =========================
   VOLUME
========================= */

function setupVolume() {

  let savedVolume = 0.8;


  try {

    const stored =
      parseFloat(
        localStorage.getItem(
          "ntpVolume"
        )
      );


    if (
      Number.isFinite(stored)
    ) {

      savedVolume = stored;

    }

  } catch (error) {

    console.warn(
      "Não foi possível recuperar o volume."
    );

  }


  radio.volume =
    savedVolume;


  if (volumeInput) {

    volumeInput.value =
      String(savedVolume);

  }


  if (volumeMini) {

    volumeMini.value =
      String(savedVolume);

  }


  if (volumeInput) {

    volumeInput.addEventListener(
      "input",
      () => {

        setVolume(
          volumeInput.value
        );

      }
    );

  }


  if (volumeMini) {

    volumeMini.addEventListener(
      "input",
      () => {

        setVolume(
          volumeMini.value
        );

      }
    );

  }

}


function setVolume(value) {

  const volume =
    Math.max(
      0,
      Math.min(
        1,
        Number(value)
      )
    );


  radio.volume =
    volume;


  if (
    volumeInput &&
    document.activeElement !== volumeInput
  ) {

    volumeInput.value =
      String(volume);

  }


  if (
    volumeMini &&
    document.activeElement !== volumeMini
  ) {

    volumeMini.value =
      String(volume);

  }


  try {

    localStorage.setItem(
      "ntpVolume",
      String(volume)
    );

  } catch (error) {

    // armazenamento indisponível

  }

}


/* =========================
   METADATA
========================= */

function startMetadata() {

  const metadataURL =
    RADIO_CONFIG.stream.metadata;


  if (
    !metadataURL ||
    !("EventSource" in window)
  ) {

    console.warn(
      "Metadata não disponível."
    );

    return;
  }


  const source =
    new EventSource(
      metadataURL
    );


  source.addEventListener(
    "message",
    (event) => {

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

        console.warn(
          "Metadata recebida, mas não pôde ser interpretada."
        );

      }

    }
  );


  source.addEventListener(
    "error",
    () => {

      console.warn(
        "Conexão de metadata interrompida."
      );

    }
  );

}


function cleanTrackTitle(title) {

  let text =
    String(title || "")
      .trim();


  if (!text) {
    return "";
  }


  text =
    text.replace(
      /\s*-\s*\[[^\]]*\]\s*$/,
      ""
    );


  text =
    text.replace(
      /^\s*Various Artists\s*-\s*\d+\s*-\s*/,
      ""
    );


  text =
    text.replace(
      /^\s*\d+\.\s*/,
      ""
    );


  return text
    .replace(/\s{2,}/g, " ")
    .trim();

}


function setNowPlaying(title) {

  const cleaned =
    cleanTrackTitle(title);


  currentTrack =
    cleaned
      ? "🎵 " + cleaned
      : "🎵 Carregando música...";


  nowPlayingEls.forEach(
    (element) => {

      element.textContent =
        currentTrack;

      element.title =
        cleaned;

    }
  );


  if (cleaned) {

    document.title =
      cleaned +
      " | NTP RÁDIO WEB";

  } else {

    document.title =
      "NTP RÁDIO WEB | Rádio Online ao Vivo";

  }

}


/* =========================
   MENU
========================= */

function setupMenu() {

  const navToggle =
    document.getElementById(
      "navToggle"
    );

  const navLinks =
    document.getElementById(
      "navLinks"
    );


  if (
    !navToggle ||
    !navLinks
  ) {

    return;

  }


  navToggle.addEventListener(
    "click",
    () => {

      const opened =
        navLinks.classList.toggle(
          "open"
        );


      navToggle.setAttribute(
        "aria-expanded",
        String(opened)
      );


      navToggle.setAttribute(
        "aria-label",
        opened
          ? "Fechar menu"
          : "Abrir menu"
      );

    }
  );


  navLinks
    .querySelectorAll("a")
    .forEach((link) => {

      link.addEventListener(
        "click",
        () => {

          navLinks.classList.remove(
            "open"
          );

          navToggle.setAttribute(
            "aria-expanded",
            "false"
          );

        }
      );

    });

}


/* =========================
   PLAYER MINIMIZADO
========================= */

function setupMiniPlayer() {

  const playerMin =
    document.getElementById(
      "playerMin"
    );


  if (!playerMin) {
    return;
  }


  playerMin.addEventListener(
    "click",
    () => {

      const minimized =
        document.body.classList.toggle(
          "player-minimized"
        );


      playerMin.setAttribute(
        "aria-label",
        minimized
          ? "Expandir player"
          : "Minimizar player"
      );

    }
  );

}


/* =========================
   ANIMAÇÕES
========================= */

function setupAnimations() {

  if (
    !("IntersectionObserver" in window)
  ) {

    document
      .querySelectorAll(".reveal")
      .forEach((element) => {

        element.classList.add(
          "visible"
        );

      });

    return;

  }


  const observer =
    new IntersectionObserver(
      (entries) => {

        entries.forEach(
          (entry) => {

            if (
              entry.isIntersecting
            ) {

              entry.target.classList.add(
                "visible"
              );

              observer.unobserve(
                entry.target
              );

            }

          }
        );

      },
      {
        threshold: 0.12
      }
    );


  document
    .querySelectorAll(".reveal")
    .forEach((element) => {

      observer.observe(
        element
      );

    });

}


/* =========================
   PWA
========================= */

function setupInstall() {

  let deferredInstall =
    null;


  const installBtn =
    document.getElementById(
      "installBtn"
    );


  window.addEventListener(
    "beforeinstallprompt",
    (event) => {

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
    "appinstalled",
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
      "click",
      async () => {

        if (!deferredInstall) {

          showToast(
            'Instale pelo menu do navegador: ⋮ → "Adicionar à tela inicial".'
          );

          return;

        }


        deferredInstall.prompt();


        try {

          await deferredInstall.userChoice;

        } catch (error) {

          console.warn(
            "Instalação cancelada."
          );

        }


        deferredInstall =
          null;

        installBtn.hidden =
          true;

      }
    );

  }

}


/* =========================
   TOAST
========================= */

function showToast(message) {

  const element =
    document.getElementById(
      "toast"
    );


  if (!element) {
    return;
  }


  element.textContent =
    message;


  element.classList.add(
    "show"
  );


  clearTimeout(
    window.ntpToastTimer
  );


  window.ntpToastTimer =
    setTimeout(
      () => {

        element.classList.remove(
          "show"
        );

      },
      3000
    );

}


/* =========================
   SERVICE WORKER
========================= */

function registerServiceWorker() {

  if (
    !("serviceWorker" in navigator)
  ) {

    return;

  }


  window.addEventListener(
    "load",
    () => {

      navigator.serviceWorker
        .register("./sw.js")
        .then(
          (registration) => {

            console.log(
              "Service Worker ativo:",
              registration.scope
            );

          }
        )
        .catch(
          (error) => {

            console.error(
              "Erro no Service Worker:",
              error
            );

          }
        );

    }
  );

}


/* =========================
   INÍCIO
========================= */

setupMiniPlayer();

registerServiceWorker();

loadRadioConfig();
