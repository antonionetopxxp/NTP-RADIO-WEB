(function () {
  "use strict";

  const $ = (selector) => document.querySelector(selector);

  const systemStatus = $("#systemStatus");
  const programName = $("#programName");
  const programPresenter = $("#programPresenter");
  const programTime = $("#programTime");

  const playlistName = $("#playlistName");
  const playlistMode = $("#playlistMode");

  const musicTitle = $("#musicTitle");
  const musicArtist = $("#musicArtist");

  const refreshBtn = $("#refreshBtn");

  console.log("[AUTO-DJ UI] Interface carregada.");

  function texto(valor, padrao = "—") {
    if (valor === undefined || valor === null || valor === "") {
      return padrao;
    }

    return String(valor);
  }

  function limparInterface() {
    if (programName) {
      programName.textContent = "Nenhum programa ativo";
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
      musicTitle.textContent = "Nenhuma música";
    }

    if (musicArtist) {
      musicArtist.textContent = "—";
    }

    if (systemStatus) {
      systemStatus.textContent = "Aguardando programação";
    }
  }

  function atualizarInterface(resultado) {
    console.log("[AUTO-DJ UI] Resultado recebido:", resultado);

    if (!resultado) {
      limparInterface();
      return;
    }

    const programa =
      resultado.programa ||
      resultado.program ||
      resultado.currentProgram ||
      null;

    const playlist =
      resultado.playlist ||
      resultado.currentPlaylist ||
      null;

    const musica =
      resultado.musica ||
      resultado.music ||
      resultado.currentMusic ||
      null;

    if (!programa) {
      limparInterface();

      if (systemStatus) {
        systemStatus.textContent = "Nenhum programa ativo";
      }

      return;
    }

    if (systemStatus) {
      systemStatus.textContent = "AUTO DJ ONLINE";
    }

    if (programName) {
      programName.textContent = texto(
        programa.nome || programa.name,
        "Programa atual"
      );
    }

    if (programPresenter) {
      programPresenter.textContent = texto(
        programa.apresentador ||
        programa.presenter ||
        programa.locutor ||
        programa.host,
        "—"
      );
    }

    if (programTime) {
      const inicio = programa.inicio || programa.start || "";
      const fim = programa.fim || programa.end || "";

      if (inicio || fim) {
        programTime.textContent =
          texto(inicio, "--:--") +
          " — " +
          texto(fim, "--:--");
      } else {
        programTime.textContent = "—";
      }
    }

    if (playlistName) {
      playlistName.textContent = texto(
        playlist &&
          (playlist.nome ||
            playlist.name ||
            playlist.title),
        "Nenhuma playlist"
      );
    }

    if (playlistMode) {
      playlistMode.textContent = texto(
        playlist &&
          (playlist.mode ||
            playlist.modo ||
            playlist.type),
        "—"
      );
    }

    if (musicTitle) {
      musicTitle.textContent = texto(
        musica &&
          (musica.title ||
            musica.nome ||
            musica.name),
        "Nenhuma música"
      );
    }

    if (musicArtist) {
      musicArtist.textContent = texto(
        musica &&
          (musica.artist ||
            musica.artista),
        "—"
      );
    }
  }

  function executarAtualizacao() {
    console.log("[AUTO-DJ UI] Executando atualização...");

    if (!window.NTP_AUTO_DJ) {
      console.warn("[AUTO-DJ UI] Motor Auto DJ não encontrado.");

      if (systemStatus) {
        systemStatus.textContent = "Motor não carregado";
      }

      return;
    }

    console.log("[AUTO-DJ UI] Motor Auto DJ encontrado.");

    try {
      const resultado = window.NTP_AUTO_DJ.executar();

      if (resultado) {
        atualizarInterface(resultado);
      }
    } catch (erro) {
      console.error(
        "[AUTO-DJ UI] Erro ao executar Auto DJ:",
        erro
      );

      if (systemStatus) {
        systemStatus.textContent = "Erro no Auto DJ";
      }
    }
  }

  function configurarBotao() {
    if (!refreshBtn) {
      console.warn(
        "[AUTO-DJ UI] Botão #refreshBtn não encontrado."
      );
      return;
    }

    refreshBtn.addEventListener("click", function () {
      console.log(
        "[AUTO-DJ UI] Botão Atualizar pressionado."
      );

      refreshBtn.disabled = true;

      executarAtualizacao();

      setTimeout(function () {
        refreshBtn.disabled = false;
      }, 1000);
    });
  }

  window.addEventListener(
    "ntp-auto-dj-update",
    function (event) {
      console.log(
        "[AUTO-DJ UI] Evento ntp-auto-dj-update recebido:",
        event.detail
      );

      atualizarInterface(event.detail);
    }
  );

  window.addEventListener(
    "storage",
    function (event) {
      if (
        event.key === "ntp_radio_programacao" ||
        event.key === "ntp_radio_playlists" ||
        event.key === "ntp_radio_music"
      ) {
        console.log(
          "[AUTO-DJ UI] Dados alterados. Atualizando..."
        );

        executarAtualizacao();
      }
    }
  );

  document.addEventListener("DOMContentLoaded", function () {
    console.log("[AUTO-DJ UI] DOM carregado.");

    limparInterface();
    configurarBotao();

    setTimeout(function () {
      executarAtualizacao();
    }, 300);
  });
})();
