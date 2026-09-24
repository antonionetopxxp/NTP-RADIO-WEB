```js
/* =========================================================
   NTP RADIO OS
   AUTO DJ — INTERFACE
   ========================================================= */

(function () {

  "use strict";


  console.log("[AUTO-DJ UI] Arquivo carregado.");


  /* =======================================================
     EXECUTAR QUANDO DOM ESTIVER PRONTO
     ======================================================= */

  function iniciar() {

    console.log(
      "[AUTO-DJ UI] Inicializando interface..."
    );


    const refreshBtn =
      document.querySelector("#refreshBtn");


    if (!refreshBtn) {

      console.error(
        "[AUTO-DJ UI] ERRO: #refreshBtn não encontrado."
      );

    } else {

      console.log(
        "[AUTO-DJ UI] Botão #refreshBtn encontrado."
      );


      /*
       * Remove qualquer comportamento antigo
       * criado diretamente no botão.
       */

      refreshBtn.type =
        "button";


      refreshBtn.addEventListener(
        "click",
        function (event) {

          event.preventDefault();
          event.stopPropagation();


          console.log(
            "[AUTO-DJ UI] Botão Atualizar clicado."
          );


          executarAutoDJ();

        }
      );

    }


    /*
     * Também usamos delegação de eventos.
     *
     * Isso permite que o botão continue funcionando
     * mesmo se algum elemento da interface for recriado.
     */

    document.addEventListener(
      "click",
      function (event) {

        const button =
          event.target.closest(
            "#refreshBtn"
          );


        if (!button) {

          return;

        }


        /*
         * O listener acima já pode ter executado.
         * Aqui não executamos novamente.
         */

      }
    );


    /*
     * Atualização automática quando o motor
     * envia um novo estado.
     */

    document.addEventListener(
      "ntp-auto-dj-update",
      function (event) {

        console.log(
          "[AUTO-DJ UI] Estado recebido:",
          event.detail
        );


        atualizarInterface(
          event.detail
        );

      }
    );


    /*
     * Alteração em outra aba/janela.
     */

    window.addEventListener(
      "storage",
      function (event) {

        if (
          event.key ===
          "ntp_radio_programacao"

          ||

          event.key ===
          "ntp_radio_playlists"

          ||

          event.key ===
          "ntp_radio_music"
        ) {

          console.log(
            "[AUTO-DJ UI] Dados alterados. Atualizando..."
          );


          executarAutoDJ();

        }

      }
    );


    /*
     * Primeira execução.
     */

    executarAutoDJ();

  }


  /* =======================================================
     EXECUTAR AUTO DJ
     ======================================================= */

  function executarAutoDJ() {

    console.log(
      "[AUTO-DJ UI] Executando atualização..."
    );


    if (
      !window.NTP_AUTO_DJ
    ) {

      console.error(
        "[AUTO-DJ UI] window.NTP_AUTO_DJ não existe."
      );


      atualizarStatus(
        "ERRO — MOTOR NÃO CARREGADO"
      );


      return;

    }


    /*
     * Compatibilidade com as versões
     * anteriores do motor.
     */

    let resultado =
      null;


    try {

      if (
        typeof window.NTP_AUTO_DJ.executar ===
        "function"
      ) {

        resultado =
          window.NTP_AUTO_DJ.executar();

      }

      else if (
        typeof window.NTP_AUTO_DJ.run ===
        "function"
      ) {

        resultado =
          window.NTP_AUTO_DJ.run();

      }

      else if (
        typeof window.NTP_AUTO_DJ.refresh ===
        "function"
      ) {

        resultado =
          window.NTP_AUTO_DJ.refresh();

      }

      else {

        throw new Error(
          "Nenhuma função de execução foi encontrada."
        );

      }


      /*
       * O motor atual retorna o estado.
       */

      if (resultado) {

        console.log(
          "[AUTO-DJ UI] Resultado recebido:",
          resultado
        );


        atualizarInterface(
          resultado
        );

      }


    } catch (error) {

      console.error(
        "[AUTO-DJ UI] Erro ao executar Auto-DJ:",
        error
      );


      atualizarStatus(
        "ERRO NO AUTO DJ"
      );

    }

  }


  /* =======================================================
     ATUALIZAR INTERFACE
     ======================================================= */

  function atualizarInterface(
    state
  ) {

    if (!state) {

      console.warn(
        "[AUTO-DJ UI] Estado vazio."
      );

      return;

    }


    const program =
      state.program ||
      null;


    const playlist =
      state.playlist ||
      null;


    const music =
      state.music ||
      null;


    /*
     * STATUS
     */

    if (
      program &&
      playlist &&
      music
    ) {

      atualizarStatus(
        "AUTO DJ ONLINE"
      );

    }

    else if (program) {

      atualizarStatus(
        "PROGRAMA ATIVO — SEM PLAYLIST"
      );

    }

    else {

      atualizarStatus(
        "AUTO DJ ONLINE"
      );

    }


    /*
     * PROGRAMA
     */

    setText(
      "#programName",
      program?.name ||
      "Nenhum programa"
    );


    setText(
      "#programPresenter",
      program?.presenter ||
      "—"
    );


    if (program) {

      const inicio =
        program.startTime ||
        "--:--";


      const fim =
        program.endTime ||
        "--:--";


      setText(
        "#programTime",
        `${inicio} — ${fim}`
      );

    }

    else {

      setText(
        "#programTime",
        "—"
      );

    }


    /*
     * PLAYLIST
     */

    setText(
      "#playlistName",
      playlist?.name ||
      "Nenhuma playlist"
    );


    setText(
      "#playlistMode",
      playlist?.mode ||
      "—"
    );


    /*
     * MÚSICA
     */

    setText(
      "#musicTitle",
      music?.title ||
      "Nenhuma música"
    );


    setText(
      "#musicArtist",
      music?.artist ||
      "—"
    );


    console.log(
      "[AUTO-DJ UI] Interface atualizada.",
      {
        program,
        playlist,
        music
      }
    );

  }


  /* =======================================================
     STATUS
     ======================================================= */

  function atualizarStatus(
    text
  ) {

    const element =
      document.querySelector(
        "#systemStatus"
      );


    if (!element) {

      return;

    }


    element.textContent =
      text;

  }


  /* =======================================================
     TEXTO
     ======================================================= */

  function setText(
    selector,
    value
  ) {

    const element =
      document.querySelector(
        selector
      );


    if (!element) {

      console.warn(
        `[AUTO-DJ UI] Elemento não encontrado: ${selector}`
      );


      return;

    }


    element.textContent =
      value;

  }


  /* =======================================================
     INICIALIZAÇÃO SEGURA
     ======================================================= */

  if (
    document.readyState ===
    "loading"
  ) {

    document.addEventListener(
      "DOMContentLoaded",
      iniciar,
      {
        once: true
      }
    );

  } else {

    iniciar();

  }


})();
```
