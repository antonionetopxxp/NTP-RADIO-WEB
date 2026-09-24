"use strict";

/*
=========================================================
 NTP RADIO OS
 INTERFACE DO AUTO-DJ
=========================================================
*/

function updateAutoDJInterface(state) {

  if (!state) {
    return;
  }

  const program = state.program;
  const playlist = state.playlist;
  const music = state.music;

  const statusEl =
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


  if (statusEl) {

    statusEl.textContent =
      program
        ? "AUTO-DJ OPERACIONAL"
        : "SEM PROGRAMA ATIVO";

  }


  if (programName) {

    programName.textContent =
      program?.name ||
      "Nenhum programa";

  }


  if (programPresenter) {

    programPresenter.textContent =
      program?.presenter
        ? "Apresentador: " + program.presenter
        : "—";

  }


  if (programTime) {

    programTime.textContent =
      program
        ? `${program.startTime} → ${program.endTime}`
        : "—";

  }


  if (playlistName) {

    playlistName.textContent =
      playlist?.name ||
      "Nenhuma playlist";

  }


  if (playlistMode) {

    playlistMode.textContent =
      playlist
        ? `Modo: ${playlist.mode || "sequencial"}`
        : "—";

  }


  if (musicTitle) {

    musicTitle.textContent =
      music?.title ||
      "Nenhuma música";

  }


  if (musicArtist) {

    musicArtist.textContent =
      music?.artist ||
      "—";

  }

}


/*
=========================================================
 RECEBE ATUALIZAÇÕES DO AUTO-DJ
=========================================================
*/

document.addEventListener(
  "ntp-auto-dj-update",
  event => {

    updateAutoDJInterface(
      event.detail
    );

  }
);


/*
=========================================================
 BOTÃO ATUALIZAR
=========================================================
*/

document.addEventListener(
  "DOMContentLoaded",
  () => {

    const refreshBtn =
      document.querySelector("#refreshBtn");

    if (!refreshBtn) {
      return;
    }

    refreshBtn.addEventListener(
      "click",
      () => {

        if (
          window.NTP_AUTO_DJ &&
          typeof window.NTP_AUTO_DJ.refresh === "function"
        ) {

          window.NTP_AUTO_DJ.refresh();

        }

      }
    );

  }
);
