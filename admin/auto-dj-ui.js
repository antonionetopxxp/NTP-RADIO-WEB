/* =========================================================
   NTP RADIO OS — AUTO DJ UI
   Interface do Auto DJ
   ========================================================= */

(function () {

  "use strict";

  const programEl = document.querySelector("#currentProgram");
  const playlistEl = document.querySelector("#currentPlaylist");
  const musicEl = document.querySelector("#currentMusic");
  const statusEl = document.querySelector("#autoDjStatus");
  const refreshBtn = document.querySelector("#refreshAutoDj");

  /* =========================================================
     ATUALIZA INTERFACE
  ========================================================= */

  function atualizarInterface(data) {

    if (!data) {
      mostrarVazio();
      return;
    }

    if (programEl) {
      programEl.textContent =
        data.program?.name ||
        "Nenhum programa";
    }

    if (playlistEl) {
      playlistEl.textContent =
        data.playlist?.name ||
        "Nenhuma playlist";
    }

    if (musicEl) {
      const music = data.music;

      if (music) {

        const title = music.title || "Sem título";
        const artist = music.artist || "";

        musicEl.textContent =
          artist
            ? `${title} — ${artist}`
            : title;

      } else {

        musicEl.textContent =
          "Nenhuma música";

      }
    }

    if (statusEl) {

      if (data.program) {

        statusEl.textContent =
          "PROGRAMA ATIVO";

        statusEl.classList.add("active");
        statusEl.classList.remove("inactive");

      } else {

        statusEl.textContent =
          "SEM PROGRAMA ATIVO";

        statusEl.classList.remove("active");
        statusEl.classList.add("inactive");

      }

    }

  }


  /* =========================================================
     ESTADO VAZIO
  ========================================================= */

  function mostrarVazio() {

    if (programEl) {
      programEl.textContent =
        "Nenhum programa";
    }

    if (playlistEl) {
      playlistEl.textContent =
        "Nenhuma playlist";
    }

    if (musicEl) {
      musicEl.textContent =
        "Nenhuma música";
    }

    if (statusEl) {

      statusEl.textContent =
        "SEM PROGRAMA ATIVO";

      statusEl.classList.remove("active");
      statusEl.classList.add("inactive");

    }

  }


  /* =========================================================
     EXECUTAR AUTO DJ
  ========================================================= */

  function executarAutoDJ() {

    console.log(
      "[AUTO-DJ UI] Atualizando interface..."
    );

    if (
      !window.NTP_AUTO_DJ ||
      typeof window.NTP_AUTO_DJ.executar !== "function"
    ) {

      console.error(
        "[AUTO-DJ UI] Motor Auto DJ não encontrado."
      );

      mostrarVazio();

      return;

    }

    const resultado =
      window.NTP_AUTO_DJ.executar();

    console.log(
      "[AUTO-DJ UI] Resultado:",
      resultado
    );

    atualizarInterface(resultado);

  }


  /* =========================================================
     BOTÃO ATUALIZAR
  ========================================================= */

  if (refreshBtn) {

    refreshBtn.addEventListener(
      "click",
      function () {

        refreshBtn.disabled = true;

        const textoOriginal =
          refreshBtn.textContent;

        refreshBtn.textContent =
          "⏳ Atualizando...";

        executarAutoDJ();

        setTimeout(
          function () {

            refreshBtn.disabled = false;

            refreshBtn.textContent =
              textoOriginal;

          },
          500
        );

      }
    );

  }


  /* =========================================================
     EVENTO DO MOTOR
  ========================================================= */

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


  /* =========================================================
     INICIALIZAÇÃO
  ========================================================= */

  function init() {

    console.log(
      "[AUTO-DJ UI] Interface carregada."
    );

    executarAutoDJ();

  }


  if (
    document.readyState === "loading"
  ) {

    document.addEventListener(
      "DOMContentLoaded",
      init
    );

  } else {

    init();

  }

})();
