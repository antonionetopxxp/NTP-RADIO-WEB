document.addEventListener("DOMContentLoaded", () => {
  console.log("[AUTO-DJ UI] Página carregada.");

  const botao = document.getElementById("refreshAutoDJBtn");

  if (!botao) {
    console.error("[AUTO-DJ UI] Botão refreshAutoDJBtn NÃO encontrado.");
    return;
  }

  console.log("[AUTO-DJ UI] Botão encontrado.");

  botao.addEventListener("click", async (event) => {
    event.preventDefault();

    console.log("[AUTO-DJ UI] Botão Atualizar pressionado.");

    botao.disabled = true;
    const textoOriginal = botao.innerHTML;
    botao.innerHTML = "⏳ Atualizando...";

    try {
      if (
        window.NTP_AUTO_DJ &&
        typeof window.NTP_AUTO_DJ.executar === "function"
      ) {
        console.log("[AUTO-DJ UI] Executando Auto DJ...");

        await window.NTP_AUTO_DJ.executar();

        console.log("[AUTO-DJ UI] Auto DJ executado.");

        atualizarTela();

        mostrarStatus("Auto DJ atualizado.");
      } else {
        console.error(
          "[AUTO-DJ UI] NTP_AUTO_DJ.executar não encontrado."
        );

        mostrarStatus("Motor Auto DJ não carregado.");
      }
    } catch (erro) {
      console.error("[AUTO-DJ UI] Erro:", erro);

      mostrarStatus("Erro ao atualizar Auto DJ.");
    } finally {
      botao.disabled = false;
      botao.innerHTML = textoOriginal;
    }
  });

  // Atualiza automaticamente ao abrir a página
  setTimeout(() => {
    atualizarTela();
  }, 300);
});


function atualizarTela() {
  console.log("[AUTO-DJ UI] Atualizando tela.");

  const estado = window.NTP_AUTO_DJ_STATE || {};

  console.log("[AUTO-DJ UI] Estado:", estado);

  const programa = estado.program || null;
  const playlist = estado.playlist || null;
  const musica = estado.music || null;

  const elementos = {
    status: document.getElementById("status"),
    programName: document.getElementById("programName"),
    programPresenter: document.getElementById("programPresenter"),
    programTime: document.getElementById("programTime"),
    playlistName: document.getElementById("playlistName"),
    playlistMode: document.getElementById("playlistMode"),
    musicName: document.getElementById("musicName"),
    musicArtist: document.getElementById("musicArtist")
  };

  if (elementos.status) {
    elementos.status.textContent = programa
      ? "🟢 Auto DJ ativo"
      : "🟡 Nenhum programa ativo";
  }

  if (elementos.programName) {
    elementos.programName.textContent =
      programa?.name || "—";
  }

  if (elementos.programPresenter) {
    elementos.programPresenter.textContent =
      programa?.presenter || "—";
  }

  if (elementos.programTime) {
    elementos.programTime.textContent =
      programa
        ? `${programa.startTime || "—"} — ${programa.endTime || "—"}`
        : "—";
  }

  if (elementos.playlistName) {
    elementos.playlistName.textContent =
      playlist?.name || "—";
  }

  if (elementos.playlistMode) {
    elementos.playlistMode.textContent =
      playlist?.mode || "—";
  }

  if (elementos.musicName) {
    elementos.musicName.textContent =
      musica?.title || "—";
  }

  if (elementos.musicArtist) {
    elementos.musicArtist.textContent =
      musica?.artist || "—";
  }
}


function mostrarStatus(mensagem) {
  console.log("[AUTO-DJ UI]", mensagem);

  const status =
    document.getElementById("status");

  if (status) {
    status.textContent = mensagem;
  }
}


window.addEventListener(
  "ntp-auto-dj-update",
  () => {
    console.log(
      "[AUTO-DJ UI] Evento ntp-auto-dj-update recebido."
    );

    atualizarTela();
  }
);
