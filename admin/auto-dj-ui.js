"use strict";

document.addEventListener("DOMContentLoaded", () => {

  console.log("[AUTO-DJ UI] DOM carregado.");

  const systemStatus =
    document.getElementById("systemStatus");

  const programName =
    document.getElementById("programName");

  const programPresenter =
    document.getElementById("programPresenter");

  const programTime =
    document.getElementById("programTime");

  const playlistName =
    document.getElementById("playlistName");

  const playlistMode =
    document.getElementById("playlistMode");

  const musicTitle =
    document.getElementById("musicTitle");

  const musicArtist =
    document.getElementById("musicArtist");

  const refreshBtn =
    document.getElementById("refreshBtn");


  /* ==================================================
     VERIFICAR ELEMENTOS
  ================================================== */

  if (!refreshBtn) {

    console.error(
      "[AUTO-DJ UI] Botão refreshBtn não encontrado."
    );

    return;

  }


  /* ==================================================
     ATUALIZAR INTERFACE
  ================================================== */

  function atualizarInterface(state) {

    if (!state) {
      return;
    }


    /* STATUS */

    if (systemStatus) {

      systemStatus.textContent =
        "AUTO DJ ONLINE";

    }


    /* PROGRAMA */

    if (state.program) {

      if (programName) {

        programName.textContent =
          state.program.name || "Sem nome";

      }

      if (programPresenter) {

        programPresenter.textContent =
          state.program.presenter ||
          "Apresentador não informado";

      }

      if (programTime) {

        programTime.textContent =
          `${state.program.startTime || "--:--"} → ${state.program.endTime || "--:--"}`;

      }

    } else {

      if (programName) {
        programName.textContent =
          "Nenhum programa";
      }

      if (programPresenter) {
        programPresenter.textContent = "—";
      }

      if (programTime) {
        programTime.textContent = "—";
      }

    }


    /* PLAYLIST */

    if (state.playlist) {

      if (playlistName) {

        playlistName.textContent =
          state.playlist.name ||
          "Sem nome";

      }

      if (playlistMode) {

        playlistMode.textContent =
          state.playlist.mode === "random"
            ? "Modo aleatório"
            : "Modo sequencial";

      }

    } else {

      if (playlistName) {
        playlistName.textContent =
          "Nenhuma playlist";
      }

      if (playlistMode) {
        playlistMode.textContent =
          "—";
      }

    }


    /* MÚSICA */

    if (state.music) {

      if (musicTitle) {

        musicTitle.textContent =
          state.music.title ||
          "Sem título";

      }

      if (musicArtist) {

        musicArtist.textContent =
          state.music.artist ||
          "Artista não informado";

      }

    } else {

      if (musicTitle) {
        musicTitle.textContent =
          "Nenhuma música";
      }

      if (musicArtist) {
        musicArtist.textContent =
          "—";
      }

    }

  }


  /* ==================================================
     EXECUTAR AUTO DJ
  ================================================== */

  function executarAutoDJ() {

    console.log(
      "[AUTO-DJ UI] Executando atualização..."
    );


    if (
      !window.NTP_AUTO_DJ ||
      typeof window.NTP_AUTO_DJ.executar !== "function"
    ) {

      console.error(
        "[AUTO-DJ UI] Motor Auto DJ não está disponível."
      );

      if (systemStatus) {

        systemStatus.textContent =
          "ERRO NO MOTOR";

      }

      return;

    }


    try {

      const resultado =
        window.NTP_AUTO_DJ.executar();


      console.log(
        "[AUTO-DJ UI] Resultado:",
        resultado
      );


      /*
      Atualiza imediatamente,
      sem precisar esperar pelo evento.
      */

      if (resultado) {

        atualizarInterface(resultado);

      }

    } catch (error) {

      console.error(
        "[AUTO-DJ UI] Erro ao executar Auto DJ:",
        error
      );

      if (systemStatus) {

        systemStatus.textContent =
          "ERRO";

      }

    }

  }


  /* ==================================================
     BOTÃO ATUALIZAR
  ================================================== */

  refreshBtn.addEventListener(
    "click",
    executarAutoDJ
  );


  /* ==================================================
     EVENTO DO MOTOR
  ================================================== */

  document.addEventListener(
    "ntp-auto-dj-update",
    event => {

      console.log(
        "[AUTO-DJ UI] Evento recebido:",
        event.detail
      );

      atualizarInterface(
        event.detail
      );

    }
  );


  /* ==================================================
     STORAGE
  ================================================== */

  window.addEventListener(
    "storage",
    event => {

      if (
        event.key === "ntp_radio_programacao" ||
        event.key === "ntp_radio_playlists" ||
        event.key === "ntp_radio_music"
      ) {

        executarAutoDJ();

      }

    }
  );


  /* ==================================================
     PRIMEIRA EXECUÇÃO
  ================================================== */

  executarAutoDJ();

});
