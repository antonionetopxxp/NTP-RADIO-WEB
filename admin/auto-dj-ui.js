(function () {

  "use strict";

  console.log("[AUTO-DJ UI] Interface carregada.");


  const systemStatus =
    document.querySelector("#systemStatus");

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


  /* =====================================================
     LIMPAR INTERFACE
     ===================================================== */

  function limparInterface() {

    if (programName)
      programName.textContent = "Nenhum programa";

    if (programPresenter)
      programPresenter.textContent = "—";

    if (programTime)
      programTime.textContent = "—";

    if (playlistName)
      playlistName.textContent = "Nenhuma playlist";

    if (playlistMode)
      playlistMode.textContent = "—";

    if (musicTitle)
      musicTitle.textContent = "Nenhuma música";

    if (musicArtist)
      musicArtist.textContent = "—";

  }


  /* =====================================================
     ATUALIZAR INTERFACE
     ===================================================== */

  function atualizarInterface(resultado) {

    console.log(
      "[AUTO-DJ UI] Resultado:",
      resultado
    );


    if (!resultado) {

      limparInterface();

      return;

    }


    const programa =
      resultado.program ||
      resultado.programa ||
      null;

    const playlist =
      resultado.playlist ||
      null;

    const musica =
      resultado.music ||
      resultado.musica ||
      null;


    /* STATUS */

    if (systemStatus) {

      if (programa) {

        systemStatus.textContent =
          "AUTO DJ — PROGRAMA ATIVO";

        systemStatus.classList.add("active");
        systemStatus.classList.remove("inactive");

      } else {

        systemStatus.textContent =
          "SEM PROGRAMA ATIVO";

        systemStatus.classList.remove("active");
        systemStatus.classList.add("inactive");

      }

    }


    /* PROGRAMA */

    if (programa) {

      if (programName) {

        programName.textContent =
          programa.name ||
          programa.nome ||
          "Programa";

      }


      if (programPresenter) {

        programPresenter.textContent =
          programa.presenter ||
          programa.apresentador ||
          programa.host ||
          "—";

      }


      if (programTime) {

        const inicio =
          programa.start ||
          programa.horaInicio ||
          programa.startTime ||
          "";

        const fim =
          programa.end ||
          programa.horaFim ||
          programa.endTime ||
          "";

        if (inicio || fim) {

          programTime.textContent =
            `${inicio} — ${fim}`;

        } else {

          programTime.textContent =
            "Horário não informado";

        }

      }

    } else {

      if (programName)
        programName.textContent =
          "Nenhum programa";

      if (programPresenter)
        programPresenter.textContent = "—";

      if (programTime)
        programTime.textContent = "—";

    }


    /* PLAYLIST */

    if (playlist) {

      if (playlistName) {

        playlistName.textContent =
          playlist.name ||
          playlist.nome ||
          "Playlist";

      }


      if (playlistMode) {

        playlistMode.textContent =
          playlist.mode ||
          playlist.modo ||
          playlist.type ||
          "Modo automático";

      }

    } else {

      if (playlistName)
        playlistName.textContent =
          "Nenhuma playlist";

      if (playlistMode)
        playlistMode.textContent = "—";

    }


    /* MÚSICA */

    if (musica) {

      if (musicTitle) {

        musicTitle.textContent =
          musica.title ||
          musica.titulo ||
          "Música";

      }


      if (musicArtist) {

        musicArtist.textContent =
          musica.artist ||
          musica.artista ||
          "Artista desconhecido";

      }

    } else {

      if (musicTitle)
        musicTitle.textContent =
          "Nenhuma música";

      if (musicArtist)
        musicArtist.textContent =
          "—";

    }

  }


  /* =====================================================
     EXECUTAR
     ===================================================== */

  function executar() {

    console.log(
      "[AUTO-DJ UI] Executando atualização..."
    );


    if (
      !window.NTP_AUTO_DJ ||
      typeof window.NTP_AUTO_DJ.executar !== "function"
    ) {

      console.error(
        "[AUTO-DJ UI] Motor Auto DJ não encontrado."
      );

      if (systemStatus) {

        systemStatus.textContent =
          "AUTO DJ OFFLINE";

      }

      return;

    }


    const resultado =
      window.NTP_AUTO_DJ.executar();


    atualizarInterface(
      resultado
    );

  }


  /* =====================================================
     BOTÃO
     ===================================================== */

  if (refreshBtn) {

    refreshBtn.addEventListener(
      "click",
      function () {

        console.log(
          "[AUTO-DJ UI] Botão Atualizar pressionado."
        );

        refreshBtn.disabled = true;

        const texto =
          refreshBtn.textContent;

        refreshBtn.textContent =
          "⏳ Atualizando...";


        executar();


        setTimeout(
          function () {

            refreshBtn.disabled = false;

            refreshBtn.textContent =
              texto;

          },
          600
        );

      }
    );

  }


  /* =====================================================
     EVENTO DO MOTOR
     ===================================================== */

  window.addEventListener(
    "ntp-auto-dj-update",
    function (event) {

      console.log(
        "[AUTO-DJ UI] Evento recebido:",
        event.detail
      );

      atualizarInterface(
        event.detail
      );

    }
  );


  /* =====================================================
     STORAGE
     ===================================================== */

  window.addEventListener(
    "storage",
    function () {

      executar();

    }
  );


  /* =====================================================
     INICIALIZAÇÃO
     ===================================================== */

  function iniciar() {

    limparInterface();

    setTimeout(
      executar,
      300
    );

  }


  if (
    document.readyState === "loading"
  ) {

    document.addEventListener(
      "DOMContentLoaded",
      iniciar
    );

  } else {

    iniciar();

  }


})();
