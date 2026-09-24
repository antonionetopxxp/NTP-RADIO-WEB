```javascript
(() => {
  "use strict";

  console.log("[AUTO-DJ UI] Interface carregada.");

  /* =========================================================
     ELEMENTOS
  ========================================================= */

  const systemStatus = document.querySelector("#systemStatus");

  const programName =
    document.querySelector("#programName");

  const programPresenter =
    document.querySelector("#programPresenter");

  const programTime =
    document.querySelector("#programTime");

  const playlistName =
    document.querySelector("#playlistName");

  const playlistMode =
    document.querySelector("#playlistMode");

  const musicTitle =
    document.querySelector("#musicTitle");

  const musicArtist =
    document.querySelector("#musicArtist");

  const refreshBtn =
    document.querySelector("#refreshBtn");


  /* =========================================================
     ESTADO
  ========================================================= */

  let motorEncontrado = false;
  let atualizando = false;


  /* =========================================================
     TEXTO SEGURO
  ========================================================= */

  function texto(valor, fallback = "—") {
    if (
      valor === undefined ||
      valor === null ||
      String(valor).trim() === ""
    ) {
      return fallback;
    }

    return String(valor);
  }


  /* =========================================================
     STATUS
  ========================================================= */

  function atualizarStatusOnline() {

    motorEncontrado = true;

    if (systemStatus) {
      systemStatus.textContent = "AUTO DJ ONLINE";
      systemStatus.style.color = "#35d07f";
    }

    console.log(
      "[AUTO-DJ UI] Motor Auto DJ encontrado."
    );
  }


  function atualizarStatusOffline() {

    motorEncontrado = false;

    if (systemStatus) {
      systemStatus.textContent =
        "Aguardando motor Auto DJ...";

      systemStatus.style.color = "#f5b942";
    }
  }


  /* =========================================================
     LIMPAR INTERFACE
  ========================================================= */

  function limparInterface() {

    if (programName) {
      programName.textContent = "—";
    }

    if (programPresenter) {
      programPresenter.textContent = "—";
    }

    if (programTime) {
      programTime.textContent = "—";
    }

    if (playlistName) {
      playlistName.textContent = "—";
    }

    if (playlistMode) {
      playlistMode.textContent = "—";
    }

    if (musicTitle) {
      musicTitle.textContent = "—";
    }

    if (musicArtist) {
      musicArtist.textContent = "—";
    }
  }


  /* =========================================================
     ATUALIZAR INTERFACE
  ========================================================= */

  function atualizarInterface(resultado) {

    if (!resultado) {
      console.warn(
        "[AUTO-DJ UI] Nenhum resultado recebido."
      );

      return;
    }

    console.log(
      "[AUTO-DJ UI] Resultado recebido:",
      resultado
    );


    const programa =
      resultado.program ||
      resultado.programa ||
      resultado.currentProgram ||
      null;

    const playlist =
      resultado.playlist ||
      resultado.currentPlaylist ||
      null;

    const musica =
      resultado.music ||
      resultado.musica ||
      resultado.currentMusic ||
      null;


    /* PROGRAMA */

    if (programName) {

      programName.textContent =
        texto(
          programa?.name ||
          resultado.programName
        );
    }


    if (programPresenter) {

      programPresenter.textContent =
        texto(
          programa?.presenter ||
          resultado.programPresenter
        );
    }


    if (programTime) {

      const inicio =
        programa?.startTime ||
        resultado.startTime ||
        "";

      const fim =
        programa?.endTime ||
        resultado.endTime ||
        "";

      if (inicio || fim) {

        programTime.textContent =
          `${inicio || "--:--"} — ${fim || "--:--"}`;

      } else {

        programTime.textContent = "—";
      }
    }


    /* PLAYLIST */

    if (playlistName) {

      playlistName.textContent =
        texto(
          playlist?.name ||
          resultado.playlistName
        );
    }


    if (playlistMode) {

      playlistMode.textContent =
        texto(
          playlist?.mode ||
          resultado.playlistMode
        );
    }


    /* MÚSICA */

    if (musicTitle) {

      musicTitle.textContent =
        texto(
          musica?.title ||
          resultado.musicTitle
        );
    }


    if (musicArtist) {

      musicArtist.textContent =
        texto(
          musica?.artist ||
          resultado.musicArtist
        );
    }
  }


  /* =========================================================
     EXECUTAR MOTOR
  ========================================================= */

  async function executar() {

    console.log(
      "[AUTO-DJ UI] Executando atualização..."
    );


    /*
     * O motor pode demorar alguns instantes
     * para aparecer no window.
     */

    if (
      !window.NTP_AUTO_DJ ||
      typeof window.NTP_AUTO_DJ.executar !== "function"
    ) {

      atualizarStatusOffline();

      console.warn(
        "[AUTO-DJ UI] Motor ainda não disponível."
      );

      procurarMotor();

      return;
    }


    atualizarStatusOnline();


    if (atualizando) {
      return;
    }

    atualizando = true;


    try {

      const resultado =
        await window.NTP_AUTO_DJ.executar();


      /*
       * Algumas versões do motor retornam o resultado.
       * Outras apenas disparam o evento
       * ntp-auto-dj-update.
       */

      if (resultado) {
        atualizarInterface(resultado);
      }

    } catch (error) {

      console.error(
        "[AUTO-DJ UI] Erro ao executar motor:",
        error
      );

    } finally {

      atualizando = false;
    }
  }


  /* =========================================================
     PROCURAR MOTOR
  ========================================================= */

  function procurarMotor() {

    if (
      window.NTP_AUTO_DJ &&
      typeof window.NTP_AUTO_DJ.executar === "function"
    ) {

      atualizarStatusOnline();

      console.log(
        "[AUTO-DJ UI] Motor encontrado."
      );

      return true;
    }


    atualizarStatusOffline();

    return false;
  }


  /* =========================================================
     ESPERAR O MOTOR
  ========================================================= */

  let tentativasMotor = 0;

  const intervaloMotor =
    setInterval(() => {

      tentativasMotor++;

      if (procurarMotor()) {

        clearInterval(intervaloMotor);

        console.log(
          "[AUTO-DJ UI] Motor conectado após",
          tentativasMotor,
          "tentativa(s)."
        );

        executar();

        return;
      }


      /*
       * Continua tentando por até 30 segundos.
       */

      if (tentativasMotor >= 30) {

        clearInterval(intervaloMotor);

        console.warn(
          "[AUTO-DJ UI] Motor não encontrado após 30 segundos."
        );
      }

    }, 1000);


  /* =========================================================
     EVENTO DO MOTOR
  ========================================================= */

  window.addEventListener(
    "ntp-auto-dj-update",
    (event) => {

      console.log(
        "[AUTO-DJ UI] Atualização recebida do motor:",
        event.detail
      );


      procurarMotor();


      if (event.detail) {
        atualizarInterface(event.detail);
      }
    }
  );


  /* =========================================================
     STORAGE
  ========================================================= */

  window.addEventListener(
    "storage",
    (event) => {

      if (
        event.key === "ntp_radio_programacao" ||
        event.key === "ntp_radio_playlists" ||
        event.key === "ntp_radio_music"
      ) {

        console.log(
          "[AUTO-DJ UI] Dados alterados. Atualizando..."
        );

        executar();
      }
    }
  );


  /* =========================================================
     BOTÃO ATUALIZAR
  ========================================================= */

  if (refreshBtn) {

    refreshBtn.addEventListener(
      "click",
      async () => {

        console.log(
          "[AUTO-DJ UI] Botão Atualizar pressionado."
        );


        const textoOriginal =
          refreshBtn.textContent;


        refreshBtn.disabled = true;

        refreshBtn.textContent =
          "⏳ Atualizando...";


        try {

          await executar();

        } finally {

          setTimeout(() => {

            refreshBtn.disabled = false;

            refreshBtn.textContent =
              textoOriginal;

          }, 700);
        }
      }
    );
  }


  /* =========================================================
     INICIALIZAÇÃO
  ========================================================= */

  function inicializar() {

    console.log(
      "[AUTO-DJ UI] Inicializando interface..."
    );


    limparInterface();


    if (procurarMotor()) {

      executar();

    } else {

      atualizarStatusOffline();

      console.log(
        "[AUTO-DJ UI] Aguardando carregamento do motor..."
      );
    }
  }


  if (
    document.readyState === "loading"
  ) {

    document.addEventListener(
      "DOMContentLoaded",
      inicializar,
      { once: true }
    );

  } else {

    inicializar();
  }

})();
```
