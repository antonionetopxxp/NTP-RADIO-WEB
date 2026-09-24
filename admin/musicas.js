/* =========================================================
   NTP RADIO OS
   Biblioteca de Músicas
   ========================================================= */

const STORAGE_KEY = "ntp_radio_music";
const STATIONS_URL = "../config/stations.json";

const $ = (selector) => document.querySelector(selector);

let musicas = [];
let radios = [];

let editingId = null;


/* =========================================================
   INICIALIZAÇÃO
   ========================================================= */

document.addEventListener("DOMContentLoaded", async () => {

  await carregarRadios();

  carregarMusicas();

  configurarEventos();

  renderizar();

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
      throw new Error("Não foi possível carregar as rádios.");
    }

    const data = await response.json();

    radios = Array.isArray(data.stations)
      ? data.stations
      : [];

    preencherFiltros();

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
   CARREGAR MÚSICAS
   ========================================================= */

function carregarMusicas() {

  try {

    const dados = localStorage.getItem(STORAGE_KEY);

    musicas = dados
      ? JSON.parse(dados)
      : [];

    if (!Array.isArray(musicas)) {
      musicas = [];
    }

  } catch (error) {

    console.error(error);

    musicas = [];

  }

}


/* =========================================================
   SALVAR
   ========================================================= */

function salvarMusicas() {

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(musicas)
  );

}


/* =========================================================
   ELEMENTOS / EVENTOS
   ========================================================= */

function configurarEventos() {

  const newBtn = $("#newMusicBtn");

  if (newBtn) {
    newBtn.addEventListener(
      "click",
      () => abrirModal()
    );
  }


  const emptyBtn = $("#emptyNewBtn");

  if (emptyBtn) {
    emptyBtn.addEventListener(
      "click",
      () => abrirModal()
    );
  }


  const searchInput = $("#searchInput");

  if (searchInput) {

    searchInput.addEventListener(
      "input",
      renderizar
    );

  }


  const radioFilter = $("#radioFilter");

  if (radioFilter) {

    radioFilter.addEventListener(
      "change",
      renderizar
    );

  }


  const categoryFilter = $("#categoryFilter");

  if (categoryFilter) {

    categoryFilter.addEventListener(
      "change",
      renderizar
    );

  }


  const form = $("#musicForm");

  if (form) {

    form.addEventListener(
      "submit",
      salvarFormulario
    );

  }


  document.addEventListener(
    "click",
    tratarClique
  );


  const stationSelect = $("#stationId");

  if (stationSelect) {

    stationSelect.addEventListener(
      "change",
      atualizarPreviewRadio
    );

  }

}


/* =========================================================
   CLIQUES
   ========================================================= */

function tratarClique(event) {

  const target = event.target;


  /* FECHAR MODAL */

  if (
    target.matches("[data-close]") ||
    target.closest("[data-close]")
  ) {

    fecharModal();

    return;

  }


  /* EDITAR */

  const editButton =
    target.closest("[data-edit]");

  if (editButton) {

    abrirEdicao(
      editButton.dataset.edit
    );

    return;

  }


  /* EXCLUIR */

  const deleteButton =
    target.closest("[data-delete]");

  if (deleteButton) {

    excluirMusica(
      deleteButton.dataset.delete
    );

    return;

  }


  /* ATIVAR / DESATIVAR */

  const toggleButton =
    target.closest("[data-toggle]");

  if (toggleButton) {

    alternarMusica(
      toggleButton.dataset.toggle
    );

    return;

  }


  /* TOCAR */

  const playButton =
    target.closest("[data-play-music]");

  if (playButton) {

    tocarMusica(
      playButton.dataset.playMusic
    );

  }

}


/* =========================================================
   FILTROS
   ========================================================= */

function preencherFiltros() {

  const radioFilter = $("#radioFilter");

  if (radioFilter) {

    radioFilter.innerHTML = `
      <option value="all">
        Todas as rádios
      </option>
    `;

    radios.forEach((radio) => {

      radioFilter.insertAdjacentHTML(
        "beforeend",
        `
        <option value="${escapeHtml(radio.id)}">
          ${escapeHtml(radio.name)}
        </option>
        `
      );

    });

  }


  const stationSelect = $("#stationId");

  if (stationSelect) {

    stationSelect.innerHTML = `
      <option value="">
        Selecione uma rádio
      </option>
    `;

    radios.forEach((radio) => {

      stationSelect.insertAdjacentHTML(
        "beforeend",
        `
        <option value="${escapeHtml(radio.id)}">
          ${escapeHtml(radio.name)}
        </option>
        `
      );

    });

  }

}


/* =========================================================
   RENDERIZAÇÃO
   ========================================================= */

function renderizar() {

  const grid = $("#musicGrid");

  if (!grid) {
    return;
  }


  const search =
    ($("#searchInput")?.value || "")
      .trim()
      .toLowerCase();


  const radio =
    $("#radioFilter")?.value || "all";


  const category =
    $("#categoryFilter")?.value || "all";


  let lista = [...musicas];


  /* BUSCA */

  if (search) {

    lista = lista.filter((music) => {

      const texto = [

        music.title,
        music.artist,
        music.album

      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return texto.includes(search);

    });

  }


  /* RÁDIO */

  if (radio !== "all") {

    lista = lista.filter(
      (music) =>
        music.stationId === radio
    );

  }


  /* CATEGORIA */

  if (category !== "all") {

    lista = lista.filter(
      (music) =>
        music.category === category
    );

  }


  grid.innerHTML = "";


  if (!lista.length) {

    mostrarVazio();

    atualizarStats();

    return;

  }


  esconderVazio();


  lista.forEach((music) => {

    grid.insertAdjacentHTML(
      "beforeend",
      criarCard(music)
    );

  });


  atualizarStats();

}


/* =========================================================
   CARD
   ========================================================= */

function criarCard(music) {

  const radio = radios.find(
    (item) =>
      item.id === music.stationId
  );


  const radioName =
    radio?.name ||
    "Rádio não encontrada";


  const statusClass =
    music.active
      ? "active"
      : "inactive";


  const statusText =
    music.active
      ? "Ativa"
      : "Inativa";


  const categoryNames = {

    music: "Música",

    jingle: "Vinheta",

    commercial: "Comercial",

    program: "Programa"

  };


  const category =
    categoryNames[music.category]
    || "Música";


  return `

    <article
      class="music-card ${statusClass}"
      data-id="${escapeHtml(music.id)}">

      <div class="music-cover">

        <span>
          🎵
        </span>

        <button
          class="play-music"
          data-play-music="${escapeHtml(music.id)}"
          title="Tocar">

          ▶

        </button>

      </div>


      <div class="music-info">

        <div class="music-top">

          <span class="music-category">
            ${escapeHtml(category)}
          </span>

          <span class="status ${statusClass}">
            ${statusText}
          </span>

        </div>


        <h3>
          ${escapeHtml(
            music.title || "Sem título"
          )}
        </h3>


        <p>
          ${escapeHtml(
            music.artist || "Artista desconhecido"
          )}
        </p>


        ${
          music.album
            ? `
              <small>
                ${escapeHtml(music.album)}
              </small>
            `
            : ""
        }


        <div class="music-meta">

          <span>
            📻 ${escapeHtml(radioName)}
          </span>

          ${
            music.duration
              ? `
                <span>
                  ⏱ ${escapeHtml(
                    music.duration
                  )}
                </span>
              `
              : ""
          }

        </div>


        <div class="music-actions">

          <button
            class="btn ghost"
            data-edit="${escapeHtml(music.id)}">

            Editar

          </button>


          <button
            class="btn ghost"
            data-toggle="${escapeHtml(music.id)}">

            ${
              music.active
                ? "Desativar"
                : "Ativar"
            }

          </button>


          <button
            class="btn danger"
            data-delete="${escapeHtml(music.id)}">

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

function abrirModal(music = null) {

  const modal = $("#musicModal");

  const form = $("#musicForm");

  if (!modal || !form) {
    return;
  }


  editingId =
    music?.id || null;


  if (music) {

    $("#modalTitle").textContent =
      "Editar música";

    preencherFormulario(music);

  } else {

    $("#modalTitle").textContent =
      "Nova música";

    form.reset();

    if ($("#active")) {
      $("#active").checked = true;
    }

    if ($("#category")) {
      $("#category").value = "music";
    }

  }


  modal.classList.add("open");

  modal.removeAttribute("hidden");

}


/* =========================================================
   EDITAR
   ========================================================= */

function abrirEdicao(id) {

  const music = musicas.find(
    (item) =>
      item.id === id
  );


  if (!music) {

    mostrarToast(
      "Música não encontrada.",
      "error"
    );

    return;

  }


  abrirModal(music);

}


/* =========================================================
   PREENCHER FORMULÁRIO
   ========================================================= */

function preencherFormulario(music) {

  setValue(
    "#title",
    music.title
  );

  setValue(
    "#artist",
    music.artist
  );

  setValue(
    "#album",
    music.album
  );

  setValue(
    "#category",
    music.category || "music"
  );

  setValue(
    "#stationId",
    music.stationId
  );

  setValue(
    "#duration",
    music.duration
  );

  setValue(
    "#audioUrl",
    music.audioUrl
  );


  if ($("#active")) {

    $("#active").checked =
      music.active !== false;

  }

}


/* =========================================================
   SALVAR FORMULÁRIO
   ========================================================= */

function salvarFormulario(event) {

  event.preventDefault();


  const title =
    $("#title")?.value.trim();


  const artist =
    $("#artist")?.value.trim();


  const stationId =
    $("#stationId")?.value;


  const category =
    $("#category")?.value || "music";


  const duration =
    $("#duration")?.value.trim();


  const audioUrl =
    $("#audioUrl")?.value.trim();


  const album =
    $("#album")?.value.trim();


  const active =
    $("#active")
      ? $("#active").checked
      : true;


  /* VALIDAÇÃO */

  if (!title) {

    mostrarToast(
      "Digite o nome da música.",
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


  /* OBJETO */

  const music = {

    id:
      editingId ||
      criarId("music"),

    title,

    artist,

    album,

    category,

    stationId,

    duration,

    audioUrl,

    active,

    updatedAt:
      new Date().toISOString()

  };


  /* EDITAR */

  if (editingId) {

    const index =
      musicas.findIndex(
        (item) =>
          item.id === editingId
      );


    if (index !== -1) {

      musicas[index] = {

        ...musicas[index],

        ...music

      };

    }

  }

  /* NOVA */

  else {

    music.createdAt =
      new Date().toISOString();

    musicas.unshift(music);

  }


  salvarMusicas();

  fecharModal();

  renderizar();


  mostrarToast(
    editingId
      ? "Música atualizada."
      : "Música cadastrada.",
    "success"
  );


  editingId = null;

}


/* =========================================================
   EXCLUIR
   ========================================================= */

function excluirMusica(id) {

  const music = musicas.find(
    (item) =>
      item.id === id
  );


  if (!music) {
    return;
  }


  const confirmar =
    confirm(
      `Excluir a música "${music.title}"?`
    );


  if (!confirmar) {
    return;
  }


  musicas =
    musicas.filter(
      (item) =>
        item.id !== id
    );


  salvarMusicas();

  renderizar();


  mostrarToast(
    "Música excluída.",
    "success"
  );

}


/* =========================================================
   ATIVAR / DESATIVAR
   ========================================================= */

function alternarMusica(id) {

  const music = musicas.find(
    (item) =>
      item.id === id
  );


  if (!music) {
    return;
  }


  music.active =
    !music.active;


  music.updatedAt =
    new Date().toISOString();


  salvarMusicas();

  renderizar();


  mostrarToast(

    music.active
      ? "Música ativada."
      : "Música desativada.",

    "success"

  );

}


/* =========================================================
   TOCAR MÚSICA
   ========================================================= */

function tocarMusica(id) {

  const music = musicas.find(
    (item) =>
      item.id === id
  );


  if (!music) {
    return;
  }


  if (!music.audioUrl) {

    mostrarToast(
      "Esta música ainda não possui URL de áudio.",
      "error"
    );

    return;

  }


  let player =
    document.querySelector(
      "#musicPreviewPlayer"
    );


  if (!player) {

    player =
      document.createElement(
        "audio"
      );

    player.id =
      "musicPreviewPlayer";

    player.controls = true;

    player.style.display =
      "none";

    document.body.appendChild(
      player
    );

  }


  player.src =
    music.audioUrl;


  player.play()
    .then(() => {

      mostrarToast(
        `Tocando: ${music.title}`,
        "success"
      );

    })
    .catch(() => {

      mostrarToast(
        "Não foi possível reproduzir este áudio.",
        "error"
      );

    });

}


/* =========================================================
   FECHAR MODAL
   ========================================================= */

function fecharModal() {

  const modal =
    $("#musicModal");


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
   ESTATÍSTICAS
   ========================================================= */

function atualizarStats() {

  const total =
    musicas.length;


  const ativas =
    musicas.filter(
      (music) =>
        music.active !== false
    ).length;


  const radiosComMusicas =
    new Set(
      musicas
        .map(
          (music) =>
            music.stationId
        )
        .filter(Boolean)
    ).size;


  const categorias =
    new Set(
      musicas
        .map(
          (music) =>
            music.category
        )
        .filter(Boolean)
    ).size;


  setText(
    "#totalCount",
    total
  );


  setText(
    "#activeCount",
    ativas
  );


  setText(
    "#radioCount",
    radiosComMusicas
  );


  setText(
    "#categoryCount",
    categorias
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
   PREVIEW DA RÁDIO
   ========================================================= */

function atualizarPreviewRadio() {

  const stationId =
    $("#stationId")?.value;


  if (!stationId) {
    return;
  }


  const radio =
    radios.find(
      (item) =>
        item.id === stationId
    );


  if (radio) {

    console.log(
      "Rádio selecionada:",
      radio.name
    );

  }

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
    setTimeout(() => {

      toast.classList.remove(
        "show"
      );

    }, 3000);

}


/* =========================================================
   UTILITÁRIOS
   ========================================================= */

function criarId(prefix = "id") {

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


function escapeHtml(value) {

  return String(
    value ?? ""
  )
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

}
