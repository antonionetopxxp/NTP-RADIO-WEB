/* =========================================================
   NTP RADIO OS
   GERENCIAMENTO PROFISSIONAL DE PLAYLISTS
   ========================================================= */

"use strict";

const PLAYLISTS_KEY = "ntp_radio_playlists";
const MUSIC_KEY = "ntp_radio_music";
const STATIONS_URL = "../config/stations.json";

const $ = (selector) => document.querySelector(selector);

let playlists = [];
let musicas = [];
let radios = [];
let editingId = null;


/* =========================================================
   INICIALIZAÇÃO
   ========================================================= */

document.addEventListener("DOMContentLoaded", async () => {

  console.log("[PLAYLISTS] Inicializando...");

  carregarDados();

  await carregarRadios();

  configurarEventos();

  renderizar();

  console.log("[PLAYLISTS] Sistema carregado.", {
    playlists: playlists.length,
    musicas: musicas.length,
    radios: radios.length
  });

});


/* =========================================================
   CARREGAR RÁDIOS
   ========================================================= */

async function carregarRadios() {

  try {

    const response = await fetch(
      `${STATIONS_URL}?v=${Date.now()}`
    );

    if (!response.ok) {
      throw new Error(
        `HTTP ${response.status}`
      );
    }

    const data = await response.json();

    /*
      Aceita os dois formatos:

      [
        {...},
        {...}
      ]

      ou

      {
        stations: [...]
      }
    */

    radios = Array.isArray(data)
      ? data
      : Array.isArray(data.stations)
        ? data.stations
        : [];

    console.log(
      "[PLAYLISTS] Rádios carregadas:",
      radios
    );

    preencherRadios();

  } catch (error) {

    console.error(
      "[PLAYLISTS] Erro ao carregar rádios:",
      error
    );

    radios = [];

    mostrarToast(
      "Não foi possível carregar as rádios.",
      "error"
    );

  }

}


/* =========================================================
   DADOS
   ========================================================= */

function carregarDados() {

  try {

    const playlistsData =
      localStorage.getItem(
        PLAYLISTS_KEY
      );

    playlists =
      playlistsData
        ? JSON.parse(playlistsData)
        : [];

    if (!Array.isArray(playlists)) {
      playlists = [];
    }


    const musicData =
      localStorage.getItem(
        MUSIC_KEY
      );

    musicas =
      musicData
        ? JSON.parse(musicData)
        : [];

    if (!Array.isArray(musicas)) {
      musicas = [];
    }

    console.log(
      "[PLAYLISTS] Músicas carregadas:",
      musicas
    );

  } catch (error) {

    console.error(
      "[PLAYLISTS] Erro ao carregar dados:",
      error
    );

    playlists = [];
    musicas = [];

  }

}


/* =========================================================
   SALVAR PLAYLISTS
   ========================================================= */

function salvarPlaylists() {

  localStorage.setItem(
    PLAYLISTS_KEY,
    JSON.stringify(playlists)
  );

  window.dispatchEvent(
    new CustomEvent(
      "ntp-playlists-updated"
    )
  );

}


/* =========================================================
   EVENTOS
   ========================================================= */

function configurarEventos() {

  $("#newPlaylistBtn")
    ?.addEventListener(
      "click",
      () => abrirModal()
    );


  $("#emptyNewBtn")
    ?.addEventListener(
      "click",
      () => abrirModal()
    );


  $("#searchInput")
    ?.addEventListener(
      "input",
      renderizar
    );


  $("#radioFilter")
    ?.addEventListener(
      "change",
      renderizar
    );


  $("#stationId")
    ?.addEventListener(
      "change",
      () => {

        atualizarMusicas([]);

      }
    );


  $("#playlistForm")
    ?.addEventListener(
      "submit",
      salvarFormulario
    );


  document.addEventListener(
    "click",
    tratarClique
  );


  /*
    Atualiza músicas se outra página
    alterar o localStorage.
  */

  window.addEventListener(
    "storage",
    (event) => {

      if (
        event.key === MUSIC_KEY
      ) {

        carregarDados();

        if (
          $("#playlistModal") &&
          !$("#playlistModal").hidden
        ) {

          atualizarMusicas();

        }

        renderizar();

      }

    }
  );

}


/* =========================================================
   CLIQUES
   ========================================================= */

function tratarClique(event) {

  const target =
    event.target;


  /* FECHAR */

  if (
    target.matches("[data-close]") ||
    target.closest("[data-close]")
  ) {

    fecharModal();

    return;

  }


  /* EDITAR */

  const edit =
    target.closest(
      "[data-edit]"
    );

  if (edit) {

    abrirEdicao(
      edit.dataset.edit
    );

    return;

  }


  /* EXCLUIR */

  const remove =
    target.closest(
      "[data-delete]"
    );

  if (remove) {

    excluirPlaylist(
      remove.dataset.delete
    );

    return;

  }


  /* ATIVAR */

  const toggle =
    target.closest(
      "[data-toggle]"
    );

  if (toggle) {

    alternarPlaylist(
      toggle.dataset.toggle
    );

  }

}


/* =========================================================
   RÁDIOS
   ========================================================= */

function preencherRadios() {

  const filter =
    $("#radioFilter");

  if (filter) {

    filter.innerHTML = `
      <option value="all">
        Todas as rádios
      </option>
    `;

    radios.forEach(
      (radio) => {

        if (!radio?.id) return;

        filter.insertAdjacentHTML(
          "beforeend",
          `
          <option value="${escapeHtml(
            radio.id
          )}">
            ${escapeHtml(
              radio.name ||
              radio.shortName ||
              radio.title ||
              radio.id
            )}
          </option>
          `
        );

      }
    );

  }


  const station =
    $("#stationId");

  if (station) {

    station.innerHTML = `
      <option value="">
        Selecione uma rádio
      </option>
    `;

    radios.forEach(
      (radio) => {

        if (!radio?.id) return;

        station.insertAdjacentHTML(
          "beforeend",
          `
          <option value="${escapeHtml(
            radio.id
          )}">
            ${escapeHtml(
              radio.name ||
              radio.shortName ||
              radio.title ||
              radio.id
            )}
          </option>
          `
        );

      }
    );

  }

}


/* =========================================================
   RENDERIZAR PLAYLISTS
   ========================================================= */

function renderizar() {

  const grid =
    $("#playlistGrid");

  if (!grid) return;


  const search =
    (
      $("#searchInput")
        ?.value || ""
    )
      .trim()
      .toLowerCase();


  const radio =
    $("#radioFilter")
      ?.value || "all";


  let lista =
    [...playlists];


  if (search) {

    lista =
      lista.filter(
        (playlist) => {

          const texto = [

            playlist.name,
            playlist.description

          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

          return texto.includes(
            search
          );

        }
      );

  }


  if (radio !== "all") {

    lista =
      lista.filter(
        (playlist) =>
          String(
            playlist.stationId
          ) === String(radio)
      );

  }


  grid.innerHTML = "";


  if (!lista.length) {

    mostrarVazio();

    atualizarStats();

    return;

  }


  esconderVazio();


  lista.forEach(
    (playlist) => {

      grid.insertAdjacentHTML(
        "beforeend",
        criarCard(playlist)
      );

    }
  );


  atualizarStats();

}


/* =========================================================
   CARD
   ========================================================= */

function criarCard(playlist) {

  const radio =
    radios.find(
      (item) =>
        String(item.id) ===
        String(playlist.stationId)
    );


  const radioName =
    radio?.name ||
    radio?.shortName ||
    radio?.title ||
    "Rádio não encontrada";


  const tracks =
    Array.isArray(
      playlist.trackIds
    )
      ? playlist.trackIds
      : [];


  const active =
    playlist.active !== false;


  const typeNames = {

    rotation:
      "Rotação musical",

    jingles:
      "Vinhetas",

    commercial:
      "Comerciais",

    special:
      "Especial"

  };


  const type =
    typeNames[
      playlist.type
    ] ||
    "Playlist";


  return `

    <article
      class="playlist-card ${
        active
          ? "active"
          : "inactive"
      }">

      <div class="playlist-icon">
        🎶
      </div>

      <div class="playlist-info">

        <div class="playlist-top">

          <span class="playlist-type">
            ${escapeHtml(type)}
          </span>

          <span
            class="status ${
              active
                ? "active"
                : "inactive"
            }">

            ${
              active
                ? "Ativa"
                : "Inativa"
            }

          </span>

        </div>

        <h3>
          ${escapeHtml(
            playlist.name
          )}
        </h3>

        <p>
          ${escapeHtml(
            playlist.description ||
            "Sem descrição."
          )}
        </p>

        <div class="playlist-meta">

          <span>
            📻 ${escapeHtml(
              radioName
            )}
          </span>

          <span>
            🎵 ${tracks.length}
            ${
              tracks.length === 1
                ? "faixa"
                : "faixas"
            }
          </span>

          <span>
            ${
              playlist.mode === "random"
                ? "🔀 Aleatório"
                : "▶ Sequencial"
            }
          </span>

        </div>

        <div class="playlist-actions">

          <button
            type="button"
            class="btn ghost"
            data-edit="${escapeHtml(
              playlist.id
            )}">

            Editar

          </button>

          <button
            type="button"
            class="btn ghost"
            data-toggle="${escapeHtml(
              playlist.id
            )}">

            ${
              active
                ? "Desativar"
                : "Ativar"
            }

          </button>

          <button
            type="button"
            class="btn danger"
            data-delete="${escapeHtml(
              playlist.id
            )}">

            Excluir

          </button>

        </div>

      </div>

    </article>

  `;

}


/* =========================================================
   ABRIR MODAL
   ========================================================= */

function abrirModal(
  playlist = null
) {

  const modal =
    $("#playlistModal");

  const form =
    $("#playlistForm");

  if (!modal || !form) return;


  editingId =
    playlist?.id || null;


  if (playlist) {

    $("#modalTitle").textContent =
      "Editar playlist";

    preencherFormulario(
      playlist
    );

  } else {

    $("#modalTitle").textContent =
      "Nova playlist";

    form.reset();

    if ($("#active")) {
      $("#active").checked = true;
    }

    atualizarMusicas([]);

  }


  modal.hidden = false;

  requestAnimationFrame(
    () => {
      modal.classList.add(
        "open"
      );
    }
  );

}


/* =========================================================
   EDITAR
   ========================================================= */

function abrirEdicao(id) {

  const playlist =
    playlists.find(
      (item) =>
        String(item.id) ===
        String(id)
    );


  if (!playlist) {

    mostrarToast(
      "Playlist não encontrada.",
      "error"
    );

    return;

  }


  abrirModal(
    playlist
  );

}


/* =========================================================
   PREENCHER FORMULÁRIO
   ========================================================= */

function preencherFormulario(
  playlist
) {

  setValue(
    "#name",
    playlist.name
  );


  setValue(
    "#stationId",
    playlist.stationId
  );


  setValue(
    "#type",
    playlist.type ||
    "rotation"
  );


  setValue(
    "#mode",
    playlist.mode ||
    "sequential"
  );


  setValue(
    "#description",
    playlist.description
  );


  if ($("#active")) {

    $("#active").checked =
      playlist.active !== false;

  }


  atualizarMusicas(
    Array.isArray(
      playlist.trackIds
    )
      ? playlist.trackIds
      : []
  );

}


/* =========================================================
   MÚSICAS
   ========================================================= */

function atualizarMusicas(
  tracksSelecionadas = null
) {

  const container =
    $("#musicSelector");

  if (!container) {

    console.error(
      "[PLAYLISTS] #musicSelector não encontrado."
    );

    return;

  }


  const stationId =
    $("#stationId")
      ?.value || "";


  if (!stationId) {

    container.innerHTML = `

      <div class="music-empty">

        <strong>
          📻 Selecione uma rádio
        </strong>

        <span>
          As músicas cadastradas
          para essa rádio aparecerão aqui.
        </span>

      </div>

    `;

    atualizarContadorMusicas();

    return;

  }


  /*
    Carrega novamente para garantir
    que estamos usando os dados atuais.
  */

  try {

    const saved =
      localStorage.getItem(
        MUSIC_KEY
      );

    musicas =
      saved
        ? JSON.parse(saved)
        : [];

    if (!Array.isArray(musicas)) {
      musicas = [];
    }

  } catch {

    musicas = [];

  }


  console.log(
    "[PLAYLISTS] Rádio selecionada:",
    stationId
  );

  console.log(
    "[PLAYLISTS] Todas as músicas:",
    musicas
  );


  const musicasDaRadio =
    musicas.filter(
      (music) => {

        const mesmaRadio =
          String(
            music.stationId || ""
          ) ===
          String(stationId);


        const ativa =
          music.active !== false;


        return (
          mesmaRadio &&
          ativa
        );

      }
    );


  console.log(
    "[PLAYLISTS] Músicas disponíveis para a rádio:",
    musicasDaRadio
  );


  let selecionadas =
    tracksSelecionadas;


  if (selecionadas === null) {

    const playlistAtual =
      playlists.find(
        (playlist) =>
          String(playlist.id) ===
          String(editingId)
      );


    selecionadas =
      Array.isArray(
        playlistAtual?.trackIds
      )
        ? playlistAtual.trackIds
        : [];

  }


  if (!Array.isArray(selecionadas)) {
    selecionadas = [];
  }


  if (!musicasDaRadio.length) {

    container.innerHTML = `

      <div class="music-empty">

        <strong>
          🎵 Nenhuma música disponível
        </strong>

        <span>
          Não existem músicas ativas
          cadastradas para esta rádio.
        </span>

        <small>
          Vá em
          <strong>Admin → Músicas</strong>
          e cadastre/upload uma música
          para esta rádio.
        </small>

      </div>

    `;

    atualizarContadorMusicas();

    return;

  }


  /*
    CABEÇALHO
  */

  container.innerHTML = `

    <div class="music-selector-header">

      <div>

        <strong>
          🎵 Músicas disponíveis
        </strong>

        <small>
          ${musicasDaRadio.length}
          ${
            musicasDaRadio.length === 1
              ? "música"
              : "músicas"
          }
        </small>

      </div>

      <div
        id="selectedMusicCount"
        class="selected-music-count">

        0 selecionadas

      </div>

    </div>


    <div class="music-search">

      <span>
        🔎
      </span>

      <input
        type="search"
        id="musicSearchInput"
        placeholder="Pesquisar música ou artista..."
      >

    </div>


    <div
      id="musicOptions"
      class="music-options">
    </div>

  `;


  renderizarOpcoesMusicas(
    musicasDaRadio,
    selecionadas
  );


  $("#musicSearchInput")
    ?.addEventListener(
      "input",
      () => {

        renderizarOpcoesMusicas(
          musicasDaRadio,
          selecionadas
        );

      }
    );


  atualizarContadorMusicas();

}


/* =========================================================
   RENDERIZAR OPÇÕES DE MÚSICA
   ========================================================= */

function renderizarOpcoesMusicas(
  lista,
  selecionadas
) {

  const container =
    $("#musicOptions");

  if (!container) return;


  const search =
    (
      $("#musicSearchInput")
        ?.value || ""
    )
      .trim()
      .toLowerCase();


  const filtradas =
    lista.filter(
      (music) => {

        if (!search) {
          return true;
        }


        const texto = [

          music.title,
          music.artist,
          music.album

        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();


        return texto.includes(
          search
        );

      }
    );


  if (!filtradas.length) {

    container.innerHTML = `

      <div class="music-empty">

        🔎 Nenhuma música encontrada.

      </div>

    `;

    return;

  }


  container.innerHTML =
    filtradas
      .map(
        (music) => {

          const checked =
            selecionadas.some(
              (id) =>
                String(id) ===
                String(music.id)
            );


          return `

            <label
              class="music-option ${
                checked
                  ? "selected"
                  : ""
              }">

              <input
                type="checkbox"
                name="trackIds"
                value="${escapeHtml(
                  music.id
                )}"
                ${
                  checked
                    ? "checked"
                    : ""
                }
              >

              <span class="music-check">

                ${
                  checked
                    ? "✓"
                    : ""
                }

              </span>


              <span class="music-details">

                <strong>

                  ${escapeHtml(
                    music.title ||
                    "Sem título"
                  )}

                </strong>


                <small>

                  ${escapeHtml(
                    music.artist ||
                    "Artista desconhecido"
                  )}

                  ${
                    music.album
                      ? ` · ${escapeHtml(
                          music.album
                        )}`
                      : ""
                  }

                </small>

              </span>


              ${
                music.category
                  ? `
                    <span class="music-category">
                      ${escapeHtml(
                        music.category
                      )}
                    </span>
                  `
                  : ""
              }

            </label>

          `;

        }
      )
      .join("");


  /*
    Atualiza visualmente ao marcar/desmarcar.
  */

  container
    .querySelectorAll(
      'input[name="trackIds"]'
    )
    .forEach(
      (checkbox) => {

        checkbox.addEventListener(
          "change",
          () => {

            const label =
              checkbox.closest(
                ".music-option"
              );

            if (label) {

              label.classList.toggle(
                "selected",
                checkbox.checked
              );

            }


            atualizarContadorMusicas();

          }
        );

      }
    );

}


/* =========================================================
   CONTADOR
   ========================================================= */

function atualizarContadorMusicas() {

  const count =
    document.querySelectorAll(
      'input[name="trackIds"]:checked'
    ).length;


  const element =
    $("#selectedMusicCount");


  if (element) {

    element.textContent =
      `${count} ${
        count === 1
          ? "selecionada"
          : "selecionadas"
      }`;

  }

}


/* =========================================================
   SALVAR
   ========================================================= */

function salvarFormulario(
  event
) {

  event.preventDefault();


  const name =
    $("#name")
      ?.value
      .trim();


  const stationId =
    $("#stationId")
      ?.value;


  const type =
    $("#type")
      ?.value ||
    "rotation";


  const mode =
    $("#mode")
      ?.value ||
    "sequential";


  const description =
    $("#description")
      ?.value
      .trim();


  const active =
    $("#active")
      ? $("#active").checked
      : true;


  const trackIds =
    Array.from(
      document.querySelectorAll(
        'input[name="trackIds"]:checked'
      )
    )
      .map(
        (input) =>
          input.value
      );


  if (!name) {

    mostrarToast(
      "Digite o nome da playlist.",
      "error"
    );

    return;

  }


  if (!stationId) {

    mostrarToast(
      "Selecione uma rádio.",
      "error"
    );

    return;

  }


  if (!trackIds.length) {

    mostrarToast(
      "Selecione pelo menos uma música.",
      "error"
    );

    return;

  }


  const now =
    new Date().toISOString();


  const newId =
    editingId ||
    criarId("playlist");


  const playlistData = {

    id: newId,

    name,

    stationId,

    type,

    mode,

    description,

    trackIds,

    active,

    updatedAt: now

  };


  if (editingId) {

    const index =
      playlists.findIndex(
        (item) =>
          String(item.id) ===
          String(editingId)
      );


    if (index !== -1) {

      playlists[index] = {

        ...playlists[index],

        ...playlistData

      };

    }

  } else {

    playlistData.createdAt =
      now;

    playlists.unshift(
      playlistData
    );

  }


  salvarPlaylists();

  console.log(
    "[PLAYLISTS] Playlist salva:",
    playlistData
  );


  fecharModal();

  renderizar();


  mostrarToast(
    editingId
      ? "Playlist atualizada com sucesso."
      : "Playlist criada com sucesso.",
    "success"
  );


  editingId = null;

}


/* =========================================================
   EXCLUIR
   ========================================================= */

function excluirPlaylist(id) {

  const playlist =
    playlists.find(
      (item) =>
        String(item.id) ===
        String(id)
    );


  if (!playlist) return;


  const confirmar =
    window.confirm(
      `Excluir a playlist "${playlist.name}"?`
    );


  if (!confirmar) return;


  playlists =
    playlists.filter(
      (item) =>
        String(item.id) !==
        String(id)
    );


  salvarPlaylists();

  renderizar();


  mostrarToast(
    "Playlist excluída.",
    "success"
  );

}


/* =========================================================
   ATIVAR / DESATIVAR
   ========================================================= */

function alternarPlaylist(id) {

  const playlist =
    playlists.find(
      (item) =>
        String(item.id) ===
        String(id)
    );


  if (!playlist) return;


  playlist.active =
    !playlist.active;


  playlist.updatedAt =
    new Date().toISOString();


  salvarPlaylists();

  renderizar();


  mostrarToast(
    playlist.active
      ? "Playlist ativada."
      : "Playlist desativada.",
    "success"
  );

}


/* =========================================================
   ESTATÍSTICAS
   ========================================================= */

function atualizarStats() {

  const total =
    playlists.length;


  const active =
    playlists.filter(
      (playlist) =>
        playlist.active !== false
    ).length;


  const radioIds =
    new Set(
      playlists
        .map(
          (playlist) =>
            playlist.stationId
        )
        .filter(Boolean)
    );


  const trackIds =
    new Set();


  playlists.forEach(
    (playlist) => {

      if (
        Array.isArray(
          playlist.trackIds
        )
      ) {

        playlist.trackIds.forEach(
          (id) =>
            trackIds.add(id)
        );

      }

    }
  );


  setText(
    "#totalCount",
    total
  );


  setText(
    "#activeCount",
    active
  );


  setText(
    "#radioCount",
    radioIds.size
  );


  setText(
    "#trackCount",
    trackIds.size
  );

}


/* =========================================================
   ESTADO VAZIO
   ========================================================= */

function mostrarVazio() {

  const empty =
    $("#emptyState");

  if (empty) {
    empty.hidden = false;
  }

}


function esconderVazio() {

  const empty =
    $("#emptyState");

  if (empty) {
    empty.hidden = true;
  }

}


/* =========================================================
   FECHAR MODAL
   ========================================================= */

function fecharModal() {

  const modal =
    $("#playlistModal");

  if (!modal) return;


  modal.classList.remove(
    "open"
  );


  setTimeout(
    () => {
      modal.hidden = true;
    },
    150
  );


  editingId = null;

}


/* =========================================================
   TOAST
   ========================================================= */

let toastTimer = null;


function mostrarToast(
  message,
  type = "info"
) {

  const toast =
    $("#toast");


  if (!toast) {

    console.log(
      `[PLAYLISTS ${type}]`,
      message
    );

    return;

  }


  toast.textContent =
    message;


  toast.className =
    `toast ${type} show`;


  clearTimeout(
    toastTimer
  );


  toastTimer =
    setTimeout(
      () => {

        toast.classList.remove(
          "show"
        );

      },
      3500
    );

}


/* =========================================================
   UTILITÁRIOS
   ========================================================= */

function criarId(
  prefix
) {

  return `${prefix}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;

}


function setValue(
  selector,
  value
) {

  const element =
    $(selector);

  if (element) {

    element.value =
      value ?? "";

  }

}


function setText(
  selector,
  value
) {

  const element =
    $(selector);

  if (element) {

    element.textContent =
      value;

  }

}


function escapeHtml(
  value
) {

  return String(
    value ?? ""
  )
    .replaceAll(
      "&",
      "&amp;"
    )
    .replaceAll(
      "<",
      "&lt;"
    )
    .replaceAll(
      ">",
      "&gt;"
    )
    .replaceAll(
      '"',
      "&quot;"
    )
    .replaceAll(
      "'",
      "&#039;"
    );

}
