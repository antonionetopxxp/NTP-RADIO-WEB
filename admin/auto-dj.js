"use strict";

/*
=========================================================
 NTP RADIO OS
 AUTO DJ — MOTOR DE AUTOMAÇÃO
=========================================================
*/

const PROGRAMS_KEY = "ntp_radio_programacao";
const PLAYLISTS_KEY = "ntp_radio_playlists";
const MUSIC_KEY = "ntp_radio_music";

let programs = [];
let playlists = [];
let music = [];

let currentProgram = null;
let currentPlaylist = null;
let currentMusic = null;


/* ======================================================
   STORAGE
====================================================== */

function loadData() {

  try {

    programs = JSON.parse(
      localStorage.getItem(PROGRAMS_KEY) || "[]"
    );

    playlists = JSON.parse(
      localStorage.getItem(PLAYLISTS_KEY) || "[]"
    );

    music = JSON.parse(
      localStorage.getItem(MUSIC_KEY) || "[]"
    );

  } catch (error) {

    console.error(
      "[AUTO-DJ] Erro ao carregar dados:",
      error
    );

    programs = [];
    playlists = [];
    music = [];
  }

  if (!Array.isArray(programs)) {
    programs = [];
  }

  if (!Array.isArray(playlists)) {
    playlists = [];
  }

  if (!Array.isArray(music)) {
    music = [];
  }
}


/* ======================================================
   NORMALIZAR DIA
====================================================== */

function normalizeDay(day) {

  return String(day || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

}


/* ======================================================
   DIAS DA SEMANA

   IMPORTANTE:
   Os valores usados pelo formulário são:

   segunda
   terca
   quarta
   quinta
   sexta
   sabado
   domingo
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


function getToday() {

  return DAYS[new Date().getDay()];

}


/* ======================================================
   HORÁRIO → MINUTOS
====================================================== */

function timeToMinutes(time) {

  if (!time) {
    return null;
  }

  const parts = String(time).split(":");

  if (parts.length < 2) {
    return null;
  }

  const hours = Number(parts[0]);
  const minutes = Number(parts[1]);

  if (
    Number.isNaN(hours) ||
    Number.isNaN(minutes)
  ) {
    return null;
  }

  return (hours * 60) + minutes;

}


/* ======================================================
   HORÁRIO ATUAL
====================================================== */

function getCurrentMinutes() {

  const now = new Date();

  return (
    now.getHours() * 60 +
    now.getMinutes()
  );

}


/* ======================================================
   VERIFICAR PROGRAMA ATIVO
====================================================== */

function isProgramActive(program) {

  if (!program) {
    return false;
  }

  if (program.active === false) {
    return false;
  }

  const today = getToday();

  const programDay =
    normalizeDay(program.day);

  if (programDay !== today) {
    return false;
  }

  const current =
    getCurrentMinutes();

  const start =
    timeToMinutes(program.startTime);

  const end =
    timeToMinutes(program.endTime);

  if (
    start === null ||
    end === null
  ) {
    return false;
  }


  /*
  ==============================================
  PROGRAMA NORMAL

  08:00 → 10:00
  ==============================================
  */

  if (start < end) {

    return (
      current >= start &&
      current < end
    );

  }


  /*
  ==============================================
  PROGRAMA ATRAVESSANDO MEIA-NOITE

  23:00 → 02:00
  ==============================================
  */

  if (start > end) {

    return (
      current >= start ||
      current < end
    );

  }


  /*
  ==============================================
  MESMO HORÁRIO

  Exemplo:
  10:00 → 10:00

  Consideramos inválido.
  ==============================================
  */

  return false;

}


/* ======================================================
   ENCONTRAR PROGRAMA ATUAL
====================================================== */

function findCurrentProgram() {

  loadData();

  const today =
    getToday();

  const currentMinutes =
    getCurrentMinutes();


  console.log(
    "[AUTO-DJ] Dia atual:",
    today
  );


  console.log(
    "[AUTO-DJ] Minutos atuais:",
    currentMinutes
  );


  console.log(
    "[AUTO-DJ] Programas cadastrados:",
    programs
  );

console.log(
  "[AUTO-DJ] Programas cadastrados:",
  programs
);

console.table(
  programs.map(program => ({
    nome: program.name,
    diaSalvo: program.day,
    diaNormalizado: normalizeDay(program.day),
    diaAtual: today,
    inicio: program.startTime,
    fim: program.endTime,
    ativo: program.active,
    minutosInicio: timeToMinutes(program.startTime),
    minutosFim: timeToMinutes(program.endTime),
    minutosAgora: currentMinutes
  }))
);

const activePrograms =
  programs.filter(
    isProgramActive
  );
 
  const activePrograms =
    programs.filter(
      isProgramActive
    );


  console.log(
    "[AUTO-DJ] Programas ativos agora:",
    activePrograms
  );


  if (!activePrograms.length) {

    console.log(
      "[AUTO-DJ] Nenhum programa ativo neste momento."
    );

    return null;

  }


  return activePrograms[0];

}


/* ======================================================
   ENCONTRAR PLAYLIST DO PROGRAMA
====================================================== */

function findPlaylist(program) {

  if (!program) {
    return null;
  }

  if (!program.playlistId) {

    console.warn(
      "[AUTO-DJ] O programa não possui playlistId."
    );

    return null;

  }


  const playlist =
    playlists.find(
      item =>
        String(item.id) ===
          String(program.playlistId) &&
        item.active !== false
    );


  if (!playlist) {

    console.warn(
      "[AUTO-DJ] Playlist não encontrada:",
      program.playlistId
    );

    return null;

  }


  return playlist;

}


/* ======================================================
   MÚSICAS DA PLAYLIST
====================================================== */

function getPlaylistTracks(playlist) {

  if (!playlist) {
    return [];
  }

  if (!Array.isArray(playlist.trackIds)) {
    return [];
  }


  const tracks =
    playlist.trackIds
      .map(trackId => {

        return music.find(
          track =>
            String(track.id) ===
              String(trackId) &&
            track.active !== false
        );

      })
      .filter(Boolean);


  return tracks;

}


/* ======================================================
   ESCOLHER MÚSICA
====================================================== */

function chooseMusic(playlist) {

  const tracks =
    getPlaylistTracks(playlist);


  console.log(
    "[AUTO-DJ] Músicas encontradas:",
    tracks
  );


  if (!tracks.length) {

    console.warn(
      "[AUTO-DJ] A playlist não possui músicas ativas."
    );

    return null;

  }


  /*
  ==============================================
  MODO ALEATÓRIO
  ==============================================
  */

  if (playlist.mode === "random") {

    const index =
      Math.floor(
        Math.random() * tracks.length
      );

    return tracks[index];

  }


  /*
  ==============================================
  MODO SEQUENCIAL

  Nesta primeira versão pegamos a primeira faixa.

  O histórico e a próxima faixa serão adicionados
  na próxima etapa.
  ==============================================
  */

  return tracks[0];

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


  window.NTP_AUTO_DJ_STATE =
    state;


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
   MOTOR PRINCIPAL
====================================================== */

function runAutoDJ() {

  console.log(
    "[AUTO-DJ] Executando motor..."
  );


  loadData();


  /*
  ==============================================
  PROGRAMA
  ==============================================
  */

  const program =
    findCurrentProgram();


  if (!program) {

    currentProgram = null;
    currentPlaylist = null;
    currentMusic = null;

    showAutoDJState();

    return;

  }


  currentProgram =
    program;


  /*
  ==============================================
  PLAYLIST
  ==============================================
  */

  const playlist =
    findPlaylist(program);


  currentPlaylist =
    playlist;


  if (!playlist) {

    currentMusic = null;

    showAutoDJState();

    return;

  }


  /*
  ==============================================
  MÚSICA
  ==============================================
  */

  currentMusic =
    chooseMusic(playlist);


  console.log(
    "[AUTO-DJ] Programa:",
    currentProgram.name
  );


  console.log(
    "[AUTO-DJ] Playlist:",
    currentPlaylist.name
  );


  console.log(
    "[AUTO-DJ] Música:",
    currentMusic
      ? currentMusic.title
      : "Nenhuma"
  );


  showAutoDJState();

}


/* ======================================================
   API PÚBLICA
====================================================== */

window.NTP_AUTO_DJ = {

  run: runAutoDJ,

  refresh: runAutoDJ,

  getState() {

    return {

      program:
        currentProgram,

      playlist:
        currentPlaylist,

      music:
        currentMusic

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
    Verifica a programação
    a cada 30 segundos.
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
