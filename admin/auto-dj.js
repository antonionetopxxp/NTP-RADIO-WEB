"use strict";

/*
=========================================================
 NTP RADIO OS
 MOTOR DE AUTOMAÇÃO — AUTO DJ
 Etapa 1
=========================================================
*/

const PROGRAMS_KEY = "ntp_radio_programacao";
const PLAYLISTS_KEY = "ntp_radio_playlists";
const MUSIC_KEY = "ntp_radio_music";
const STATIONS_KEY = "ntp_radio_stations";

let programs = [];
let playlists = [];
let music = [];
let stations = [];

let currentProgram = null;
let currentPlaylist = null;
let currentMusic = null;

/* ======================================================
   STORAGE
====================================================== */

function loadData() {
  programs = JSON.parse(
    localStorage.getItem(PROGRAMS_KEY) || "[]"
  );

  playlists = JSON.parse(
    localStorage.getItem(PLAYLISTS_KEY) || "[]"
  );

  music = JSON.parse(
    localStorage.getItem(MUSIC_KEY) || "[]"
  );

  stations = JSON.parse(
    localStorage.getItem(STATIONS_KEY) || "[]"
  );
}

/* ======================================================
   DIAS DA SEMANA
====================================================== */

const DAYS = [
  "domingo",
  "segunda",
  "terca",
  "quarta",
  "quinta",
  "sexta",
  "sabado"
];
function normalizeDay(day) {

  return String(day || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

}

/* ======================================================
   HORÁRIO
====================================================== */

function timeToMinutes(time) {
  if (!time) return null;

  const parts = String(time).split(":");

  if (parts.length < 2) return null;

  const hours = Number(parts[0]);
  const minutes = Number(parts[1]);

  if (
    Number.isNaN(hours) ||
    Number.isNaN(minutes)
  ) {
    return null;
  }

  return hours * 60 + minutes;
}

function getCurrentMinutes() {
  const now = new Date();

  return (
    now.getHours() * 60 +
    now.getMinutes()
  );
}

/* ======================================================
   VERIFICA PROGRAMA ATUAL
====================================================== */

function isProgramActive(program) {
  if (!program || program.active === false) {
    return false;
  }

  const today = getToday();

  const programDay = normalizeDay(program.day);

  if (programDay !== today) {
    return false;
  }

  const current = getCurrentMinutes();

  const start = timeToMinutes(program.startTime);
  const end = timeToMinutes(program.endTime);

  if (start === null || end === null) {
    return false;
  }

  /*
    Programa normal:
    08:00 → 10:00
  */

  if (start < end) {
    return current >= start && current < end;
  }

  /*
    Programa atravessando meia-noite:
    23:00 → 02:00
  */

  if (start > end) {
    return (
      current >= start ||
      current < end
    );
  }

  return false;
}

/* ======================================================
   ENCONTRA PROGRAMA ATUAL
====================================================== */

function findCurrentProgram() {
  loadData();

  const activePrograms = programs.filter(
    isProgramActive
  );

  if (!activePrograms.length) {
    return null;
  }

  /*
    Se houver mais de um programa no mesmo horário,
    usamos o primeiro cadastrado.
  */

  return activePrograms[0];
}

/* ======================================================
   ENCONTRA PLAYLIST
====================================================== */

function findPlaylist(program) {
  if (!program) {
    return null;
  }

  if (!program.playlistId) {
    return null;
  }

  return playlists.find(
    playlist =>
      playlist.id === program.playlistId &&
      playlist.active !== false
  ) || null;
}

/* ======================================================
   ENCONTRA MÚSICAS DA PLAYLIST
====================================================== */

function getPlaylistTracks(playlist) {
  if (!playlist) {
    return [];
  }

  if (!Array.isArray(playlist.trackIds)) {
    return [];
  }

  return playlist.trackIds
    .map(trackId =>
      music.find(
        track =>
          track.id === trackId &&
          track.active !== false
      )
    )
    .filter(Boolean);
}

/* ======================================================
   ESCOLHE PRÓXIMA MÚSICA
====================================================== */

function chooseMusic(playlist) {
  const tracks = getPlaylistTracks(playlist);

  if (!tracks.length) {
    return null;
  }

  /*
    Modo aleatório
  */

  if (playlist.mode === "random") {
    const index = Math.floor(
      Math.random() * tracks.length
    );

    return tracks[index];
  }

  /*
    Modo sequencial
    Nesta primeira etapa usamos a primeira faixa.
    O controle de histórico será adicionado na
    próxima etapa.
  */

  return tracks[0];
}

/* ======================================================
   CICLO PRINCIPAL
====================================================== */

function runAutoDJ() {
  loadData();

  const program = findCurrentProgram();

  if (!program) {
    currentProgram = null;
    currentPlaylist = null;
    currentMusic = null;

    console.log(
      "[AUTO-DJ] Nenhum programa ativo."
    );

    return;
  }

  const playlist = findPlaylist(program);

  currentProgram = program;
  currentPlaylist = playlist;

  if (!playlist) {
    currentMusic = null;

    console.warn(
      "[AUTO-DJ] Programa ativo sem playlist."
    );

    showAutoDJState();

    return;
  }

  const selectedMusic = chooseMusic(playlist);

  currentMusic = selectedMusic;

  console.log(
    "[AUTO-DJ] Programa:",
    program.name
  );

  console.log(
    "[AUTO-DJ] Playlist:",
    playlist.name
  );

  console.log(
    "[AUTO-DJ] Música:",
    selectedMusic
      ? selectedMusic.title
      : "Nenhuma"
  );

  showAutoDJState();
}

/* ======================================================
   ESTADO VISUAL
====================================================== */

function showAutoDJState() {
  const state = {
    program: currentProgram
      ? {
          id: currentProgram.id,
          name: currentProgram.name,
          presenter: currentProgram.presenter,
          startTime: currentProgram.startTime,
          endTime: currentProgram.endTime
        }
      : null,

    playlist: currentPlaylist
      ? {
          id: currentPlaylist.id,
          name: currentPlaylist.name,
          mode: currentPlaylist.mode
        }
      : null,

    music: currentMusic
      ? {
          id: currentMusic.id,
          title: currentMusic.title,
          artist: currentMusic.artist,
          audioUrl: currentMusic.audioUrl
        }
      : null
  };

  window.NTP_AUTO_DJ_STATE = state;

  document.dispatchEvent(
    new CustomEvent(
      "ntp-auto-dj-update",
      {
        detail: state
      }
    )
  );
}

/* ======================================================
   API PÚBLICA
====================================================== */

window.NTP_AUTO_DJ = {
  run: runAutoDJ,

  getState() {
    return {
      program: currentProgram,
      playlist: currentPlaylist,
      music: currentMusic
    };
  },

  getCurrentProgram() {
    return currentProgram;
  },

  getCurrentPlaylist() {
    return currentPlaylist;
  },

  getCurrentMusic() {
    return currentMusic;
  },

  refresh() {
    runAutoDJ();
  }
};

/* ======================================================
   INICIALIZAÇÃO
====================================================== */

document.addEventListener(
  "DOMContentLoaded",
  () => {
    runAutoDJ();

    /*
      Verifica a programação a cada 30 segundos.
    */

    setInterval(
      runAutoDJ,
      30000
    );
  }
);

/* ======================================================
   ATUALIZAÇÃO ENTRE ABAS
====================================================== */

window.addEventListener(
  "storage",
  event => {
    if (
      event.key === PROGRAMS_KEY ||
      event.key === PLAYLISTS_KEY ||
      event.key === MUSIC_KEY
    ) {
      runAutoDJ();
    }
  }
);
