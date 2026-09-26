/* =========================================================
   NTP RADIO OS
   Biblioteca de Músicas
   Upload + IndexedDB
   ========================================================= */

const STORAGE_KEY = "ntp_radio_music";
const STATIONS_URL = "../config/stations.json";

const DB_NAME = "ntp_radio_os_audio";
const DB_VERSION = 1;
const AUDIO_STORE = "audioFiles";

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB

const $ = (selector) =>
  document.querySelector(selector);

let musicas = [];
let radios = [];
let editingId = null;

let audioDatabase = null;


/* =========================================================
   INICIALIZAÇÃO
   ========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  async () => {

    try {

      await abrirBancoAudio();

      await carregarRadios();

      carregarMusicas();

      configurarEventos();

      renderizar();

    } catch (error) {

      console.error(
        "[MÚSICAS] Erro na inicialização:",
        error
      );

      mostrarToast(
        "Erro ao inicializar a biblioteca de áudio.",
        "error"
      );

    }

  }
);


/* =========================================================
   INDEXEDDB
   ========================================================= */

function abrirBancoAudio() {

  return new Promise(
    (resolve, reject) => {

      const request =
        indexedDB.open(
          DB_NAME,
          DB_VERSION
        );

      request.onupgradeneeded =
        (event) => {

          const db =
            event.target.result;

          if (
            !db.objectStoreNames.contains(
              AUDIO_STORE
            )
          ) {

            db.createObjectStore(
              AUDIO_STORE
            );

          }

        };

      request.onsuccess =
        (event) => {

          audioDatabase =
            event.target.result;

          console.log(
            "[MÚSICAS] Banco de áudio iniciado."
          );

          resolve(
            audioDatabase
          );

        };

      request.onerror =
        () => {

          reject(
            request.error ||
            new Error(
              "Não foi possível abrir o banco de áudio."
            )
          );

        };

    }
  );

}


/* =========================================================
   SALVAR ARQUIVO NO INDEXEDDB
   ========================================================= */

function salvarArquivoAudio(id, file) {

  return new Promise((resolve, reject) => {

    if (!audioDatabase) {
      reject(
        new Error(
          "Banco de áudio não inicializado."
        )
      );
      return;
    }

    if (!(file instanceof Blob)) {
      reject(
        new Error(
          "O arquivo selecionado é inválido."
        )
      );
      return;
    }

    try {

      const transaction =
        audioDatabase.transaction(
          AUDIO_STORE,
          "readwrite"
        );

      const store =
        transaction.objectStore(
          AUDIO_STORE
        );

      store.put(file, id);

      transaction.oncomplete = () => {

        console.log(
          "[MÚSICAS] Upload concluído:",
          file.name,
          file.size
        );

        resolve(id);

      };

      transaction.onerror = () => {

        console.error(
          "[MÚSICAS] Erro IndexedDB:",
          transaction.error
        );

        reject(
          transaction.error ||
          new Error(
            "Erro ao salvar o arquivo."
          )
        );

      };

      transaction.onabort = () => {

        console.error(
          "[MÚSICAS] Transação abortada:",
          transaction.error
        );

        reject(
          transaction.error ||
          new Error(
            "A gravação do arquivo foi abortada."
          )
        );

      };

    } catch (error) {

      console.error(
        "[MÚSICAS] Erro ao iniciar upload:",
        error
      );

      reject(error);

    }

  });

}


/* =========================================================
   OBTER ARQUIVO
   ========================================================= */

function obterArquivoAudio(id) {

  return new Promise(
    (resolve, reject) => {

      if (!audioDatabase) {

        reject(
          new Error(
            "Banco de áudio não inicializado."
          )
        );

        return;

      }

      const transaction =
        audioDatabase.transaction(
          AUDIO_STORE,
          "readonly"
        );

      const store =
        transaction.objectStore(
          AUDIO_STORE
        );

      const request =
        store.get(id);

      request.onsuccess =
        () => {

          resolve(
            request.result || null
          );

        };

      request.onerror =
        () => {

          reject(
            request.error
          );

        };

    }
  );

}


/* =========================================================
   EXCLUIR ARQUIVO
   ========================================================= */

function excluirArquivoAudio(id) {

  return new Promise(
    (resolve, reject) => {

      if (!audioDatabase) {

        resolve();

        return;

      }

      const transaction =
        audioDatabase.transaction(
          AUDIO_STORE,
          "readwrite"
        );

      const store =
        transaction.objectStore(
          AUDIO_STORE
        );

      const request =
        store.delete(id);

      request.onsuccess =
        () => resolve();

      request.onerror =
        () => reject(
          request.error
        );

    }
  );

}


/* =========================================================
   CARREGAR RÁDIOS
   ========================================================= */

async function carregarRadios() {

  try {

    const response =
      await fetch(
        `${STATIONS_URL}?v=${Date.now()}`
      );

    if (!response.ok) {

      throw new Error(
        "Não foi possível carregar as rádios."
      );

    }

    const data =
      await response.json();

    radios =
      Array.isArray(data)
        ? data
        : Array.isArray(data.stations)
        ? data.stations
        : [];

    preencherFiltros();

  } catch (error) {

    console.error(
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
   CARREGAR MÚSICAS
   ========================================================= */

function carregarMusicas() {

  try {

    const dados =
      localStorage.getItem(
        STORAGE_KEY
      );

    musicas =
      dados
        ? JSON.parse(dados)
        : [];

    if (!Array.isArray(musicas)) {

      musicas = [];

    }

  } catch (error) {

    console.error(
      error
    );

    musicas = [];

  }

}


/* =========================================================
   SALVAR MÚSICAS
   ========================================================= */

function salvarMusicas() {

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(musicas)
  );

  window.dispatchEvent(
    new CustomEvent(
      "ntp-music-updated"
    )
  );

}


/* =========================================================
   EVENTOS
   ========================================================= */

function configurarEventos() {

  const newBtn =
    $("#newMusicBtn");

  if (newBtn) {

    newBtn.addEventListener(
      "click",
      () => abrirModal()
    );

  }


  const emptyBtn =
    $("#emptyNewBtn");

  if (emptyBtn) {

    emptyBtn.addEventListener(
      "click",
      () => abrirModal()
    );

  }


  const searchInput =
    $("#searchInput");

  if (searchInput) {

    searchInput.addEventListener(
      "input",
      renderizar
    );

  }


  const radioFilter =
    $("#radioFilter");

  if (radioFilter) {

    radioFilter.addEventListener(
      "change",
      renderizar
    );

  }


  const categoryFilter =
    $("#categoryFilter");

  if (categoryFilter) {

    categoryFilter.addEventListener(
      "change",
      renderizar
    );

  }


  const form =
    $("#musicForm");

  if (form) {

    form.addEventListener(
      "submit",
      salvarFormulario
    );

  }


  const audioFile =
    $("#audioFile");

  if (audioFile) {

    audioFile.addEventListener(
      "change",
      analisarArquivoSelecionado
    );

  }


  document.addEventListener(
    "click",
    tratarClique
  );


  const stationSelect =
    $("#stationId");

  if (stationSelect) {

    stationSelect.addEventListener(
      "change",
      atualizarPreviewRadio
    );

  }

}


/* =========================================================
   ARQUIVO SELECIONADO
   ========================================================= */

async function analisarArquivoSelecionado(
  event
) {

  const file =
    event.target.files?.[0];

  if (!file) {

    return;

  }


  if (
    file.size >
    MAX_FILE_SIZE
  ) {

    mostrarToast(
      "O arquivo ultrapassa o limite de 100 MB.",
      "error"
    );

    event.target.value = "";

    return;

  }


  const permitido =
    [
      "audio/mpeg",
      "audio/mp3",
      "audio/wav",
      "audio/x-wav",
      "audio/ogg",
      "audio/aac",
      "audio/mp4",
      "audio/x-m4a"
    ];


  const extensao =
    file.name
      .split(".")
      .pop()
      .toLowerCase();


  const extensoesPermitidas =
    [
      "mp3",
      "wav",
      "ogg",
      "oga",
      "aac",
      "m4a"
    ];


  if (
    !permitido.includes(
      file.type
    ) &&
    !extensoesPermitidas.includes(
      extensao
    )
  ) {

    mostrarToast(
      "Formato de áudio não suportado.",
      "error"
    );

    event.target.value = "";

    return;

  }


  mostrarInformacoesArquivo(
    file
  );


  const duracao =
    await obterDuracaoAudio(
      file
    );


  if (duracao) {

    const durationInput =
      $("#duration");

    if (
      durationInput &&
      !durationInput.value
    ) {

      durationInput.value =
        formatarDuracao(
          duracao
        );

    }

  }

}


/* =========================================================
   INFORMAÇÕES DO ARQUIVO
   ========================================================= */

function mostrarInformacoesArquivo(
  file
) {

  const info =
    $("#audioFileInfo");

  if (!info) {

    return;

  }


  info.hidden = false;

  info.innerHTML = `
    <strong>🎵 ${escapeHtml(
      file.name
    )}</strong>

    <span>
      ${formatarTamanho(
        file.size
      )}
    </span>
  `;

}


/* =========================================================
   DURAÇÃO DO ÁUDIO
   ========================================================= */

function obterDuracaoAudio(
  file
) {

  return new Promise(
    (resolve) => {

      const url =
        URL.createObjectURL(
          file
        );

      const audio =
        document.createElement(
          "audio"
        );

      audio.preload =
        "metadata";

      audio.onloadedmetadata =
        () => {

          const duration =
            audio.duration;

          URL.revokeObjectURL(
            url
          );

          resolve(
            Number.isFinite(
              duration
            )
              ? duration
              : null
          );

        };

      audio.onerror =
        () => {

          URL.revokeObjectURL(
            url
          );

          resolve(null);

        };

      audio.src =
        url;

    }
  );

}


/* =========================================================
   FORMATAR DURAÇÃO
   ========================================================= */

function formatarDuracao(
  seconds
) {

  const total =
    Math.floor(
      Number(seconds)
    );

  const minutes =
    Math.floor(
      total / 60
    );

  const remaining =
    total % 60;

  return `${String(
    minutes
  ).padStart(2, "0")}:${String(
    remaining
  ).padStart(2, "0")}`;

}


/* =========================================================
   FORMATAR TAMANHO
   ========================================================= */

function formatarTamanho(
  bytes
) {

  if (
    !Number.isFinite(
      bytes
    )
  ) {

    return "0 KB";

  }


  if (
    bytes <
    1024 * 1024
  ) {

    return `${(
      bytes / 1024
    ).toFixed(1)} KB`;

  }


  return `${(
    bytes /
    (1024 * 1024)
  ).toFixed(2)} MB`;

}


/* =========================================================
   CLIQUES
   ========================================================= */

function tratarClique(
  event
) {

  const target =
    event.target;


  if (
    target.matches(
      "[data-close]"
    ) ||
    target.closest(
      "[data-close]"
    )
  ) {

    fecharModal();

    return;

  }


  const editButton =
    target.closest(
      "[data-edit]"
    );

  if (editButton) {

    abrirEdicao(
      editButton.dataset.edit
    );

    return;

  }


  const deleteButton =
    target.closest(
      "[data-delete]"
    );

  if (deleteButton) {

    excluirMusica(
      deleteButton.dataset.delete
    );

    return;

  }


  const toggleButton =
    target.closest(
      "[data-toggle]"
    );

  if (toggleButton) {

    alternarMusica(
      toggleButton.dataset.toggle
    );

    return;

  }


  const playButton =
    target.closest(
      "[data-play-music]"
    );

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

  const radioFilter =
    $("#radioFilter");

  if (radioFilter) {

    radioFilter.innerHTML = `
      <option value="all">
        Todas as rádios
      </option>
    `;

    radios.forEach(
      (radio) => {

        radioFilter.insertAdjacentHTML(
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

      }
    );

  }


  const stationSelect =
    $("#stationId");

  if (stationSelect) {

    stationSelect.innerHTML = `
      <option value="">
        Selecione uma rádio
      </option>
    `;

    radios.forEach(
      (radio) => {

        stationSelect.insertAdjacentHTML(
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

      }
    );

  }

}


/* =========================================================
   RENDERIZAÇÃO
   ========================================================= */

function renderizar() {

  const grid =
    $("#musicGrid");

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
      ?.value ||
    "all";


  const category =
    $("#categoryFilter")
      ?.value ||
    "all";


  let lista =
    [...musicas];


  if (search) {

    lista =
      lista.filter(
        (music) => {

          const texto =
            [
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

  }


  if (radio !== "all") {

    lista =
      lista.filter(
        (music) =>
          music.stationId ===
          radio
      );

  }


  if (category !== "all") {

    lista =
      lista.filter(
        (music) =>
          music.category ===
          category
      );

  }


  grid.innerHTML =
    "";


  if (!lista.length) {

    mostrarVazio();

    atualizarStats();

    return;

  }


  esconderVazio();


  lista.forEach(
    (music) => {

      grid.insertAdjacentHTML(
        "beforeend",
        criarCard(music)
      );

    }
  );


  atualizarStats();

}


/* =========================================================
   CARD
   ========================================================= */

function criarCard(
  music
) {

  const radio =
    radios.find(
      (item) =>
        item.id ===
        music.stationId
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
    categoryNames[
      music.category
    ] ||
    "Música";


  return `

    <article
      class="music-card ${statusClass}"
      data-id="${escapeHtml(
        music.id
      )}">

      <div class="music-cover">

        <span>
          🎵
        </span>

        <button
          class="play-music"
          data-play-music="${escapeHtml(
            music.id
          )}"
          title="Tocar">

          ▶

        </button>

      </div>


      <div class="music-info">

        <div class="music-top">

          <span class="music-category">
            ${escapeHtml(
              category
            )}
          </span>

          <span class="status ${statusClass}">
            ${statusText}
          </span>

        </div>


        <h3>
          ${escapeHtml(
            music.title ||
            "Sem título"
          )}
        </h3>


        <p>
          ${escapeHtml(
            music.artist ||
            "Artista desconhecido"
          )}
        </p>


        ${
          music.album
            ? `
              <small>
                ${escapeHtml(
                  music.album
                )}
              </small>
            `
            : ""
        }


        <div class="music-meta">

          <span>
            📻 ${escapeHtml(
              radioName
            )}
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

          ${
            music.hasAudio
              ? `
                <span>
                  💾 Upload
                </span>
              `
              : ""
          }

        </div>


        <div class="music-actions">

          <button
            class="btn ghost"
            data-edit="${escapeHtml(
              music.id
            )}">

            Editar

          </button>


          <button
            class="btn ghost"
            data-toggle="${escapeHtml(
              music.id
            )}">

            ${
              music.active
                ? "Desativar"
                : "Ativar"
            }

          </button>


          <button
            class="btn danger"
            data-delete="${escapeHtml(
              music.id
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
  music = null
) {

  const modal =
    $("#musicModal");

  const form =
    $("#musicForm");

  if (!modal || !form) {

    return;

  }


  editingId =
    music?.id ||
    null;


  if (music) {

    $("#modalTitle").textContent =
      "Editar música";

    preencherFormulario(
      music
    );

  } else {

    $("#modalTitle").textContent =
      "Nova música";

    form.reset();

    if ($("#active")) {

      $("#active").checked =
        true;

    }

    if ($("#category")) {

      $("#category").value =
        "music";

    }

    limparArquivoSelecionado();

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

function abrirEdicao(
  id
) {

  const music =
    musicas.find(
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


  abrirModal(
    music
  );

}


/* =========================================================
   PREENCHER FORMULÁRIO
   ========================================================= */

function preencherFormulario(
  music
) {

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
    music.category ||
    "music"
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
    music.audioUrl ||
    ""
  );


  const fileInput =
    $("#audioFile");

  if (fileInput) {

    fileInput.value =
      "";

  }


  const info =
    $("#audioFileInfo");

  if (info) {

    if (music.hasAudio) {

      info.hidden =
        false;

      info.innerHTML = `
        <strong>
          💾 Arquivo de áudio cadastrado
        </strong>

        <span>
          Selecione outro arquivo
          somente se quiser substituí-lo.
        </span>
      `;

    } else {

      info.hidden =
        true;

      info.innerHTML =
        "";

    }

  }


  if ($("#active")) {

    $("#active").checked =
      music.active !== false;

  }

}


/* =========================================================
   SALVAR FORMULÁRIO
   ========================================================= */

async function salvarFormulario(
  event
) {

  event.preventDefault();


  const title =
    $("#title")
      ?.value.trim();


  const artist =
    $("#artist")
      ?.value.trim();


  const stationId =
    $("#stationId")
      ?.value;


  const category =
    $("#category")
      ?.value ||
    "music";


  const album =
    $("#album")
      ?.value.trim();


  const duration =
    $("#duration")
      ?.value.trim();


  const active =
    $("#active")
      ? $("#active").checked
      : true;


  const fileInput =
    $("#audioFile");


  const file =
    fileInput
      ?.files?.[0] ||
    null;


  if (!title) {

    mostrarToast(
      "Digite o nome da música.",
      "error"
    );

    return;

  }


  if (!artist) {

    mostrarToast(
      "Digite o nome do artista.",
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


  if (
    file &&
    file.size >
    MAX_FILE_SIZE
  ) {

    mostrarToast(
      "O arquivo ultrapassa 100 MB.",
      "error"
    );

    return;

  }


  const existing =
    editingId
      ? musicas.find(
          (item) =>
            item.id ===
            editingId
        )
      : null;


  const id =
    editingId ||
    criarId("music");


  try {

    /* =========================
       UPLOAD DO ARQUIVO
       ========================= */

    if (file) {

      mostrarToast(
        "Salvando arquivo de áudio...",
        "info"
      );

      await salvarArquivoAudio(
        id,
        file
      );

    }


    /* =========================
       OBJETO DA MÚSICA
       ========================= */

    const music = {

      id,

      title,

      artist,

      album,

      category,

      stationId,

      duration,

      audioUrl:
        existing?.audioUrl ||
        "",

      hasAudio:
        Boolean(
          file ||
          existing?.hasAudio
        ),

      audioFileName:
        file?.name ||
        existing?.audioFileName ||
        "",

      audioMimeType:
        file?.type ||
        existing?.audioMimeType ||
        "",

      audioSize:
        file?.size ||
        existing?.audioSize ||
        0,

      active,

      createdAt:
        existing?.createdAt ||
        new Date().toISOString(),

      updatedAt:
        new Date().toISOString()

    };


    if (editingId) {

      const index =
        musicas.findIndex(
          (item) =>
            item.id ===
            editingId
        );


      if (index !== -1) {

        musicas[index] = {

          ...musicas[index],

          ...music

        };

      }

    } else {

      musicas.unshift(
        music
      );

    }


    salvarMusicas();

    fecharModal();

    renderizar();


    mostrarToast(
      editingId
        ? "Música atualizada com sucesso."
        : "Música enviada com sucesso.",
      "success"
    );


    editingId =
      null;


  } catch (error) {

    console.error(
      "[MÚSICAS] Erro ao salvar:",
      error
    );

    mostrarToast(
      "Não foi possível salvar o arquivo de áudio.",
      "error"
    );

  }

}


/* =========================================================
   EXCLUIR
   ========================================================= */

async function excluirMusica(
  id
) {

  const music =
    musicas.find(
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


  try {

    await excluirArquivoAudio(
      id
    );

  } catch (error) {

    console.error(
      "[MÚSICAS] Erro ao excluir áudio:",
      error
    );

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

function alternarMusica(
  id
) {

  const music =
    musicas.find(
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


TOCAR MÚSICA

/* =========================================================
   LIMPAR ARQUIVO
   ========================================================= */

function limparArquivoSelecionado() {

  const fileInput =
    $("#audioFile");

  if (fileInput) {

    fileInput.value =
      "";

  }


  const info =
    $("#audioFileInfo");

  if (info) {

    info.hidden =
      true;

    info.innerHTML =
      "";

  }

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


  editingId =
    null;

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
   PREVIEW RÁDIO
   ========================================================= */

function atualizarPreviewRadio() {

  const stationId =
    $("#stationId")
      ?.value;


  if (!stationId) {

    return;

  }


  const radio =
    radios.find(
      (item) =>
        item.id ===
        stationId
    );


  if (radio) {

    console.log(
      "[MÚSICAS] Rádio selecionada:",
      radio.name
    );

  }

}


/* =========================================================
   TOAST
   ========================================================= */

let toastTimer =
  null;


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
  prefix = "id"
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
/* =========================================================
   PESQUISA EXTERNA DE MÚSICAS
   ========================================================= */

let resultadosExternos = [];


/* =========================================================
   CONFIGURAR PESQUISA EXTERNA
   ========================================================= */

function configurarPesquisaExterna() {

  const input =
    $("#externalMusicSearch");

  const button =
    $("#externalSearchBtn");

  if (!input || !button) {

    console.warn(
      "[MÚSICAS] Campo de pesquisa externa não encontrado."
    );

    return;

  }


  button.addEventListener(
    "click",
    pesquisarMusicasExternas
  );


  input.addEventListener(
    "keydown",
    (event) => {

      if (
        event.key === "Enter"
      ) {

        event.preventDefault();

        pesquisarMusicasExternas();

      }

    }
  );

}


/* =========================================================
   PESQUISAR
   ========================================================= */

async function pesquisarMusicasExternas() {

  const input =
    $("#externalMusicSearch");

  const results =
    $("#externalMusicResults");

  const status =
    $("#externalSearchStatus");


  if (!input || !results) {

    return;

  }


  const termo =
    input.value
      .trim();


  if (!termo) {

    mostrarStatusPesquisa(
      "Digite o nome de uma música, artista ou álbum.",
      "error"
    );

    input.focus();

    return;

  }


  mostrarStatusPesquisa(
    "🔎 Pesquisando músicas...",
    "loading"
  );


  results.innerHTML =
    "";


  try {

    /*
     * Catálogo público da Apple/iTunes.
     *
     * O endpoint retorna metadados de músicas
     * e, quando disponível, previewUrl.
     */

    const url =
      "https://itunes.apple.com/search?" +
      new URLSearchParams({
        term: termo,
        media: "music",
        entity: "song",
        country: "BR",
        lang: "pt_br",
        limit: "20"
      });


    const response =
      await fetch(url);


    if (!response.ok) {

      throw new Error(
        `HTTP ${response.status}`
      );

    }


    const data =
      await response.json();


    resultadosExternos =
      Array.isArray(
        data.results
      )
        ? data.results
        : [];


    if (!resultadosExternos.length) {

      mostrarStatusPesquisa(
        "Nenhuma música encontrada.",
        "empty"
      );

      return;

    }


    mostrarStatusPesquisa(
      `${resultadosExternos.length} resultado(s) encontrado(s).`,
      "success"
    );


    renderizarResultadosExternos();


  } catch (error) {

    console.error(
      "[MÚSICAS] Erro na pesquisa externa:",
      error
    );


    mostrarStatusPesquisa(
      "Não foi possível pesquisar músicas agora.",
      "error"
    );

  }

}


/* =========================================================
   RENDERIZAR RESULTADOS
   ========================================================= */

function renderizarResultadosExternos() {

  const container =
    $("#externalMusicResults");


  if (!container) {

    return;

  }


  container.innerHTML =
    resultadosExternos
      .map(
        (music, index) =>
          criarResultadoExterno(
            music,
            index
          )
      )
      .join("");

}


/* =========================================================
   CARD DO RESULTADO
   ========================================================= */

function criarResultadoExterno(
  music,
  index
) {

  const artwork =
    music.artworkUrl100 ||
    "";


  const title =
    music.trackName ||
    "Sem título";


  const artist =
    music.artistName ||
    "Artista desconhecido";


  const album =
    music.collectionName ||
    "";


  const preview =
    music.previewUrl ||
    "";


  return `

    <article class="external-music-card">

      <div class="external-music-cover">

        ${
          artwork
            ? `
              <img
                src="${escapeHtml(
                  artwork
                )}"
                alt="${escapeHtml(
                  title
                )}"
                loading="lazy">
            `
            : `
              <span>🎵</span>
            `
        }

      </div>


      <div class="external-music-info">

        <h3>
          ${escapeHtml(
            title
          )}
        </h3>


        <p>
          ${escapeHtml(
            artist
          )}
        </p>


        ${
          album
            ? `
              <small>
                💿 ${escapeHtml(
                  album
                )}
              </small>
            `
            : ""
        }


        <div class="external-music-actions">

          ${
            preview
              ? `
                <button
                  type="button"
                  class="btn ghost"
                  data-preview-external="${index}">
                  ▶ Prévia
                </button>
              `
              : ""
          }


          <button
            type="button"
            class="btn primary"
            data-add-external="${index}">
            ＋ Adicionar
          </button>

        </div>

      </div>

    </article>

  `;

}


/* =========================================================
   CLIQUES DOS RESULTADOS
   ========================================================= */

document.addEventListener(
  "click",
  (event) => {

    const previewButton =
      event.target.closest(
        "[data-preview-external]"
      );


    if (previewButton) {

      const index =
        Number(
          previewButton.dataset
            .previewExternal
        );


      reproduzirPreviewExterno(
        index
      );

      return;

    }


    const addButton =
      event.target.closest(
        "[data-add-external]"
      );


    if (addButton) {

      const index =
        Number(
          addButton.dataset
            .addExternal
        );


      adicionarResultadoExterno(
        index
      );

    }

  }
);


/* =========================================================
   PRÉVIA
   ========================================================= */

function reproduzirPreviewExterno(
  index
) {

  const music =
    resultadosExternos[
      index
    ];


  if (
    !music ||
    !music.previewUrl
  ) {

    mostrarToast(
      "Esta música não possui prévia disponível.",
      "error"
    );

    return;

  }


  let player =
    $("#externalPreviewPlayer");


  if (!player) {

    player =
      document.createElement(
        "audio"
      );

    player.id =
      "externalPreviewPlayer";

    player.controls =
      true;

    player.style.width =
      "100%";

    player.style.marginTop =
      "15px";


    const results =
      $("#externalMusicResults");


    results?.prepend(
      player
    );

  }


  player.src =
    music.previewUrl;


  player.play()
    .catch(
      () => {}
    );


  mostrarToast(
    `Prévia: ${music.trackName}`,
    "success"
  );

}


/* =========================================================
   ADICIONAR RESULTADO À BIBLIOTECA
   ========================================================= */

function adicionarResultadoExterno(
  index
) {

  const result =
    resultadosExternos[
      index
    ];


  if (!result) {

    return;

  }


  const titulo =
    result.trackName ||
    "";


  const artista =
    result.artistName ||
    "";


  /*
   * Evita cadastrar a mesma música
   * e artista várias vezes.
   */

  const existente =
    musicas.find(
      (music) =>

        music.title
          ?.toLowerCase() ===
        titulo.toLowerCase()

        &&

        music.artist
          ?.toLowerCase() ===
        artista.toLowerCase()
    );


  if (existente) {

    mostrarToast(
      "Essa música já está na biblioteca.",
      "info"
    );

    return;

  }


  /*
   * Ainda não existe arquivo local.
   *
   * O usuário deverá abrir "Editar"
   * e fazer o upload do arquivo de áudio
   * autorizado para uso na rádio.
   */

  const music = {

    id:
      criarId("music"),

    title:
      titulo,

    artist:
      artista,

    album:
      result.collectionName ||
      "",

    category:
      "music",

    stationId:
      "",

    duration:
      result.trackTimeMillis
        ? formatarDuracao(
            result.trackTimeMillis /
            1000
          )
        : "",

    audioUrl:
      "",

    hasAudio:
      false,

    audioFileName:
      "",

    audioMimeType:
      "",

    audioSize:
      0,

    artworkUrl:
      result.artworkUrl100 ||
      "",

    externalId:
      result.trackId ||
      "",

    externalUrl:
      result.trackViewUrl ||
      "",

    previewUrl:
      result.previewUrl ||
      "",

    active:
      true,

    createdAt:
      new Date().toISOString(),

    updatedAt:
      new Date().toISOString()

  };


  musicas.unshift(
    music
  );


  salvarMusicas();


  renderizar();


  mostrarToast(
    `"${titulo}" adicionada à biblioteca. Agora associe uma rádio e faça o upload do áudio.`,
    "success"
  );


  /*
   * Abre imediatamente a edição
   * para o usuário completar os dados.
   */

  setTimeout(
    () => {

      abrirEdicao(
        music.id
      );

    },
    200
  );

}


/* =========================================================
   STATUS DA PESQUISA
   ========================================================= */

function mostrarStatusPesquisa(
  message,
  type
) {

  const status =
    $("#externalSearchStatus");


  if (!status) {

    return;

  }


  status.hidden =
    false;


  status.className =
    `search-status ${type}`;


  status.textContent =
    message;

}


/* =========================================================
   INICIALIZAR PESQUISA
   ========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    configurarPesquisaExterna();

  }
);
