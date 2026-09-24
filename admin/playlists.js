/* =========================================================
   NTP RADIO OS
   Gerenciamento de Playlists
   ========================================================= */

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

  await carregarRadios();

  carregarDados();

  configurarEventos();

  renderizar();

});


/* =========================================================
   RÁDIOS
   ========================================================= */

async function carregarRadios() {

  try {

    const response = await fetch(
      `${STATIONS_URL}?v=${Date.now()}`
    );

    if (!response.ok) {
      throw new Error("Erro ao carregar rádios.");
    }

    const data = await response.json();

    radios = Array.isArray(data.stations)
      ? data.stations
      : [];

    preencherRadios();

  } catch (error) {

    console.error(error);

    radios = [];

    mostrarToast(
      "Não foi possível carregar as rádios.",
      "error"
    );

  }

}


/* =========================================================
   DADOS LOCAIS
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

  } catch (error) {

    console.error(error);

    playlists = [];
    musicas = [];

  }

}


/* =========================================================
   SALVAR
   ========================================================= */

function salvarPlaylists() {

  localStorage.setItem(
    PLAYLISTS_KEY,
    JSON.stringify(playlists)
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
      atualizarMusicas
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
   PREENCHER RÁDIOS
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

    radios.forEach((radio) => {

      filter.insertAdjacentHTML(
        "beforeend",
        `
        <option value="${escapeHtml(
          radio.id
        )}">
          ${escapeHtml(
            radio.name
          )}
        </option>
        `
      );

    });

  }


  const station =
    $("#stationId");


  if (station) {

    station.innerHTML = `
      <option value="">
        Selecione uma rádio
      </option>
    `;

    radios.forEach((radio) => {

      station.insertAdjacentHTML(
        "beforeend",
        `
        <option value="${escapeHtml(
          radio.id
        )}">
          ${escapeHtml(
            radio.name
          )}
        </option>
        `
      );

    });

  }

}


/* =========================================================
   RENDERIZAR
   ========================================================= */

function renderizar() {

  const grid =
    $("#playlistGrid");


  if (!grid) {
    return;
  }


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


  /* BUSCA */

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


  /* RÁDIO */

  if (radio !== "all") {

    lista =
      lista.filter(
        (playlist) =>
          playlist.stationId === radio
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
        item.id === playlist.stationId
    );


  const radioName =
    radio?.name ||
    "Rádio não encontrada";


  const tracks =
    Array.isArray(
      playlist.trackIds
    )
      ? playlist.trackIds
      : [];


  const statusClass =
    playlist.active
      ? "active"
      : "inactive";


  const statusText =
    playlist.active
      ? "Ativa"
      : "Inativa";


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
      class="playlist-card ${statusClass}">

      <div class="playlist-icon">

        🎶

      </div>


      <div class="playlist-info">

        <div class="playlist-top">

          <span class="playlist-type">

            ${escapeHtml(type)}

          </span>

          <span
            class="status ${statusClass}">

            ${statusText}

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

            🎵 ${tracks.length} faixa${
              tracks.length === 1
                ? ""
                : "s"
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
            class="btn ghost"
            data-edit="${escapeHtml(
              playlist.id
            )}">

            Editar

          </button>


          <button
            class="btn ghost"
            data-toggle="${escapeHtml(
              playlist.id
            )}">

            ${
              playlist.active
                ? "Desativar"
                : "Ativar"
            }

          </button>


          <button
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
   MODAL
   ========================================================= */

function abrirModal(playlist = null) {

  const modal =
    $("#playlistModal");


  const form =
    $("#playlistForm");


  if (!modal || !form) {
    return;
  }


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

      $("#active").checked =
        true;

    }


    atualizarMusicas();

  }


  modal.classList.add(
    "open"
  );


  modal.removeAttribute(
    "hidden"
  );

}


/* =========================================================
   EDITAR
   ========================================================= */

function abrirEdicao(id) {

  const playlist =
    playlists.find(
      (item) =>
        item.id === id
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
   FORMULÁRIO
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
    playlist.trackIds || []
  );

}


/* =========================================================
   MÚSICAS DA RÁDIO
   ========================================================= */

function atualizarMusicas(
  tracksSelecionadas = null
) {

  const container =
    $("#musicSelector");


  if (!container) {
    return;
  }


  const stationId =
    $("#stationId")
      ?.value;


  if (!stationId) {

    container.innerHTML = `

      <div class="music-empty">

        Selecione uma rádio
        para visualizar
        as músicas disponíveis.

      </div>

    `;

    return;

  }


  const musicasDaRadio =
    musicas.filter(
      (music) =>

        music.stationId === stationId &&

        music.active !== false

    );


  if (!musicasDaRadio.length) {

    container.innerHTML = `

      <div class="music-empty">

        Nenhuma música ativa
        cadastrada para esta rádio.

      </div>

    `;

    return;

  }


  let selecionadas =
    tracksSelecionadas;


  if (selecionadas === null) {

    const playlistAtual =
      playlists.find(
        (playlist) =>
          playlist.id === editingId
      );


    selecionadas =
      playlistAtual?.trackIds ||
      [];

  }


  container.innerHTML =
    musicasDaRadio
      .map(
        (music) => {

          const checked =
            selecionadas.includes(
              music.id
            );


          return `

            <label class="music-option">

              <input
                type="checkbox"
                name="trackIds"
                value="${escapeHtml(
                  music.id
                )}"
                ${checked
                  ? "checked"
                  : ""}>

              <span class="music-check">

                ${checked
                  ? "✓"
                  : ""}

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

                </small>

              </span>

            </label>

          `;

        }
      )
      .join("");

}


/* =========================================================
   SALVAR PLAYLIST
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


  /* VALIDAÇÃO */

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


  const playlist = {

    id:
      editingId ||
      criarId("playlist"),

    name,

    stationId,

    type,

    mode,

    description,

    trackIds,

    active,

    updatedAt:
      new Date().toISOString()

  };


  /* EDITAR */

  if (editingId) {

    const index =
      playlists.findIndex(
        (item) =>
          item.id === editingId
      );


    if (index !== -1) {

      playlists[index] = {

        ...playlists[index],

        ...playlist

      };

    }

  }

  /* NOVA */

  else {

    playlist.createdAt =
      new Date().toISOString();

    playlists.unshift(
      playlist
    );

  }


  salvarPlaylists();

  fecharModal();

  renderizar();


  mostrarToast(
    editingId
      ? "Playlist atualizada."
      : "Playlist criada.",
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
        item.id === id
    );


  if (!playlist) {
    return;
  }


  const confirmar =
    confirm(
      `Excluir a playlist "${playlist.name}"?`
    );


  if (!confirmar) {
    return;
  }


  playlists =
    playlists.filter(
      (item) =>
        item.id !== id
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
        item.id === id
    );


  if (!playlist) {
    return;
  }


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

    empty.hidden =
      false;

  }

}


function esconderVazio() {

  const empty =
    $("#emptyState");


  if (empty) {

    empty.hidden =
      true;

  }

}


/* =========================================================
   FECHAR MODAL
   ========================================================= */

function fecharModal() {

  const modal =
    $("#playlistModal");


  if (!modal) {
    return;
  }


  modal.classList.remove(
    "open"
  );


  modal.setAttribute(
    "hidden",
    ""
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
      `[${type}]`,
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
      3000
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
