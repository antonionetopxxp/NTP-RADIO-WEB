const STREAM_URL = "https://stream.zeno.fm/elhz4znig9wuv";
const META_URL =
  "https://api.zeno.fm/mounts/metadata/subscribe/elhz4znig9wuv";

const radio = document.getElementById("radio");
const volumeInput = document.getElementById("volume");
const volumeMini = document.getElementById("volumeMini");

const playButtons = document.querySelectorAll("[data-play]");
const nowPlayingEls = document.querySelectorAll("[data-now]");
const eqEls = document.querySelectorAll("[data-eq]");

let currentTrack = "🎵 Carregando música...";

/* =========================
   PLAYER
========================= */

function updatePlayer(playing) {
  document.body.classList.toggle("is-playing", playing);

  playButtons.forEach((button) => {
    button.classList.toggle("playing", playing);
    button.setAttribute("aria-pressed", String(playing));
    button.setAttribute(
      "aria-label",
      playing ? "Pausar rádio" : "Tocar rádio"
    );
  });

  eqEls.forEach((eq) => {
    eq.classList.toggle("on", playing);
  });
}

function playRadio() {
  if (!radio) return;

  radio
    .play()
    .then(() => {
      updatePlayer(true);
    })
    .catch((error) => {
      console.error("Erro ao iniciar rádio:", error);

      const toast = document.getElementById("toast");

      if (toast) {
        toast.textContent =
          "Não foi possível iniciar a rádio. Tente novamente.";
        toast.classList.add("show");

        clearTimeout(window.ntpToastTimer);

        window.ntpToastTimer = setTimeout(() => {
          toast.classList.remove("show");
        }, 3000);
      }
    });
}

function pauseRadio() {
  if (!radio) return;

  radio.pause();
  updatePlayer(false);
}

function toggleRadio() {
  if (!radio) return;

  if (radio.paused) {
    playRadio();
  } else {
    pauseRadio();
  }
}

/* Botões Play */

playButtons.forEach((button) => {
  button.addEventListener("click", toggleRadio);
});

/* Eventos do áudio */

if (radio) {
  radio.addEventListener("play", () => {
    updatePlayer(true);
  });

  radio.addEventListener("playing", () => {
    updatePlayer(true);
  });

  radio.addEventListener("pause", () => {
    updatePlayer(false);
  });

  radio.addEventListener("ended", () => {
    updatePlayer(false);
  });

  radio.addEventListener("error", () => {
    console.error("Erro no áudio:", radio.error);
  });

  radio.addEventListener("stalled", () => {
    console.warn("Stream temporariamente parado.");
  });

  radio.addEventListener("waiting", () => {
    console.log("Aguardando transmissão...");
  });

  radio.addEventListener("canplay", () => {
    console.log("Stream disponível para reprodução.");
  });
}

/* =========================
   VOLUME
========================= */

let savedVolume = 0.8;

try {
  const stored = parseFloat(localStorage.getItem("ntpVolume"));

  if (Number.isFinite(stored)) {
    savedVolume = stored;
  }
} catch (error) {
  console.warn("Não foi possível recuperar o volume.");
}

if (radio) {
  radio.volume = savedVolume;
}

if (volumeInput) {
  volumeInput.value = String(savedVolume);
}

if (volumeMini) {
  volumeMini.value = String(savedVolume);
}

function setVolume(value) {
  const volume = Math.max(0, Math.min(1, Number(value)));

  if (radio) {
    radio.volume = volume;
  }

  if (
    volumeInput &&
    document.activeElement !== volumeInput
  ) {
    volumeInput.value = String(volume);
  }

  if (
    volumeMini &&
    document.activeElement !== volumeMini
  ) {
    volumeMini.value = String(volume);
  }

  try {
    localStorage.setItem("ntpVolume", String(volume));
  } catch (error) {
    // Sem armazenamento
  }
}

if (volumeInput) {
  volumeInput.addEventListener("input", () => {
    setVolume(volumeInput.value);
  });
}

if (volumeMini) {
  volumeMini.addEventListener("input", () => {
    setVolume(volumeMini.value);
  });
}

/* =========================
   MÚSICA ATUAL
========================= */

function cleanTrackTitle(title) {
  let text = String(title || "").trim();

  if (!text) {
    return "";
  }

  text = text.replace(
    /\s*-\s*\[[^\]]*\]\s*$/,
    ""
  );

  text = text.replace(
    /^\s*Various Artists\s*-\s*\d+\s*-\s*/,
    ""
  );

  text = text.replace(
    /^\s*\d+\.\s*/,
    ""
  );

  return text
    .replace(/\s{2,}/g, " ")
    .trim();
}

function setNowPlaying(title) {
  const cleaned = cleanTrackTitle(title);

  currentTrack = cleaned
    ? "🎵 " + cleaned
    : "🎵 Carregando música...";

  nowPlayingEls.forEach((element) => {
    element.textContent = currentTrack;
    element.title = cleaned;
  });

  if (cleaned) {
    document.title =
      cleaned + " | NTP RÁDIO WEB";
  } else {
    document.title =
      "NTP RÁDIO WEB | Rádio Online ao Vivo";
  }
}

/* =========================
   METADATA ZENO
========================= */

function startMetadata() {
  if (!("EventSource" in window)) {
    console.warn(
      "Este navegador não suporta EventSource."
    );

    return;
  }

  const source = new EventSource(META_URL);

  source.addEventListener("message", (event) => {
    try {
      const data = JSON.parse(event.data);

      if (data && data.streamTitle) {
        setNowPlaying(data.streamTitle);
      }
    } catch (error) {
      console.warn(
        "Metadata recebida, mas não pôde ser interpretada."
      );
    }
  });

  source.addEventListener("error", () => {
    console.warn(
      "Conexão de metadata interrompida. O navegador tentará reconectar."
    );
  });
}

/* =========================
   MENU MOBILE
========================= */

const navToggle = document.getElementById("navToggle");
const navLinks = document.getElementById("navLinks");

if (navToggle && navLinks) {
  navToggle.addEventListener("click", () => {
    const opened =
      navLinks.classList.toggle("open");

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
  });

  navLinks
    .querySelectorAll("a")
    .forEach((link) => {
      link.addEventListener("click", () => {
        navLinks.classList.remove("open");

        navToggle.setAttribute(
          "aria-expanded",
          "false"
        );
      });
    });
}

/* =========================
   PLAYER MINIMIZADO
========================= */

const playerMin =
  document.getElementById("playerMin");

if (playerMin) {
  playerMin.addEventListener("click", () => {
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
  });
}

/* =========================
   ANIMAÇÕES
========================= */

if ("IntersectionObserver" in window) {
  const revealObserver =
    new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");

            revealObserver.unobserve(
              entry.target
            );
          }
        });
      },
      {
        threshold: 0.12,
      }
    );

  document
    .querySelectorAll(".reveal")
    .forEach((element) => {
      revealObserver.observe(element);
    });
} else {
  document
    .querySelectorAll(".reveal")
    .forEach((element) => {
      element.classList.add("visible");
    });
}

/* =========================
   INSTALAÇÃO PWA
========================= */

let deferredInstall = null;

const installBtn =
  document.getElementById("installBtn");

window.addEventListener(
  "beforeinstallprompt",
  (event) => {
    event.preventDefault();

    deferredInstall = event;

    if (installBtn) {
      installBtn.hidden = false;
    }
  }
);

window.addEventListener(
  "appinstalled",
  () => {
    deferredInstall = null;

    if (installBtn) {
      installBtn.hidden = true;
    }
  }
);

if (installBtn) {
  installBtn.addEventListener(
    "click",
    async () => {
      if (!deferredInstall) {
        const toast =
          document.getElementById("toast");

        if (toast) {
          toast.textContent =
            'Instale pelo menu do navegador: ⋮ → "Adicionar à tela inicial".';

          toast.classList.add("show");

          setTimeout(() => {
            toast.classList.remove("show");
          }, 3500);
        }

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

      deferredInstall = null;
      installBtn.hidden = true;
    }
  );
}

/* =========================
   SERVICE WORKER
========================= */

if ("serviceWorker" in navigator) {
  window.addEventListener(
    "load",
    () => {
      navigator.serviceWorker
        .register("./sw.js")
        .then((registration) => {
          console.log(
            "Service Worker ativo:",
            registration.scope
          );
        })
        .catch((error) => {
          console.error(
            "Erro no Service Worker:",
            error
          );
        });
    }
  );
}

/* =========================
   INICIALIZAÇÃO
========================= */

setNowPlaying("");

startMetadata();

console.log(
  "NTP RÁDIO WEB carregada."
);

console.log(
  "Stream:",
  STREAM_URL
);
