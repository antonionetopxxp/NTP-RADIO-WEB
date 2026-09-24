const STORAGE_KEY = "ntp_radio_stations";
const STATIONS_URL = "../config/stations.json";

let stations = [];
let defaultStation = "ntp-radio-web";

const $ = selector =>
  document.querySelector(selector);

const el = {

  grid: $("#radioGrid"),

  empty: $("#emptyState"),

  search: $("#searchInput"),

  filter: $("#statusFilter"),

  modal: $("#radioModal"),

  form: $("#radioForm"),

  title: $("#modalTitle"),

  editing: $("#editingId"),

  total: $("#totalCount"),

  active: $("#activeCount"),

  inactive: $("#inactiveCount"),

  defaultName: $("#defaultName"),

  toast: $("#toast"),

  streamDot: $("#streamStatus"),

  streamText: $("#streamStatusText")

};


async function init(){

  bindEvents();

  await loadStations();

  render();

}


/* =========================
   CARREGAR RÁDIOS
========================= */

async function loadStations(){

  try{

    const saved =
      JSON.parse(
        localStorage.getItem(
          STORAGE_KEY
        ) || "null"
      );

    if(Array.isArray(saved)){

      stations = saved;

    }

  }catch(error){

    console.warn(
      "Erro ao carregar rádios locais.",
      error
    );

  }


  try{

    const response =
      await fetch(
        `${STATIONS_URL}?v=${Date.now()}`
      );

    if(response.ok){

      const data =
        await response.json();

      defaultStation =
        data.defaultStation ||
        defaultStation;

      if(
        !stations.length &&
        Array.isArray(data.stations)
      ){

        stations =
          data.stations;

      }

    }

  }catch(error){

    console.warn(
      "stations.json não disponível.",
      error
    );

  }

}


/* =========================
   EVENTOS
========================= */

function bindEvents(){

  $("#newRadioBtn")
    .onclick =
    () => openModal();


  $("#emptyNewBtn")
    .onclick =
    () => openModal();


  el.search.oninput =
    render;


  el.filter.onchange =
    render;


  $("#exportBtn")
    .onclick =
    exportJSON;


  el.form.onsubmit =
    saveRadio;


  $("#testStreamBtn")
    .onclick =
    testStream;


  $("#status").onchange =
    updateStatusLabel;


  document
    .querySelectorAll(
      "[data-close]"
    )
    .forEach(button => {

      button.onclick =
        closeModal;

    });

}


/* =========================
   RENDER
========================= */

function render(){

  const query =
    el.search.value
      .trim()
      .toLowerCase();

  const filter =
    el.filter.value;


  const list =
    stations.filter(station => {

      const text =
        `${station.id}
         ${station.name}
         ${station.shortName}
         ${station.country}`
        .toLowerCase();

      const matchSearch =
        !query ||
        text.includes(query);

      const active =
        station.status !== "inactive";

      const matchStatus =
        filter === "all" ||
        (filter === "active" && active) ||
        (filter === "inactive" && !active);

      return (
        matchSearch &&
        matchStatus
      );

    });


  el.grid.innerHTML =
    list
      .map(createCard)
      .join("");


  el.empty.hidden =
    list.length !== 0;


  el.grid
    .querySelectorAll(
      "[data-edit]"
    )
    .forEach(button => {

      button.onclick =
        () =>
          openModal(
            button.dataset.edit
          );

    });


  el.grid
    .querySelectorAll(
      "[data-delete]"
    )
    .forEach(button => {

      button.onclick =
        () =>
          deleteRadio(
            button.dataset.delete
          );

    });


  el.grid
    .querySelectorAll(
      "[data-default]"
    )
    .forEach(button => {

      button.onclick =
        () =>
          setDefault(
            button.dataset.default
          );

    });


  updateStats();

}


/* =========================
   CARD
========================= */

function createCard(station){

  const active =
    station.status !== "inactive";

  const color =
    station.branding?.primaryColor ||
    "#6d28ff";

  const isDefault =
    station.id === defaultStation;


  return `

    <article class="radio-card">

      <div class="card-top">

        <div
          class="station-icon"
          style="
            background:${color}22;
            color:${color};
            border:1px solid ${color}55;
          "
        >
          📻
        </div>

        <span
          class="pill ${
            active
              ? "active"
              : "inactive"
          }"
        >
          ${
            active
              ? "ATIVA"
              : "INATIVA"
          }
        </span>

      </div>


      <h3>
        ${escapeHTML(
          station.name ||
          "Rádio"
        )}
      </h3>


      <span class="short">

        ${escapeHTML(
          station.shortName || ""
        )}

        ${
          isDefault
            ? " · PADRÃO"
            : ""
        }

      </span>


      <p class="desc">

        ${escapeHTML(
          station.description ||
          "Sem descrição."
        )}

      </p>


      <div class="stream">

        ${escapeHTML(
          station.stream?.provider ||
          "Stream"
        )}

        ·

        ${escapeHTML(
          station.stream?.url ||
          "Sem stream"
        )}

      </div>


      <div class="card-footer">

        <button
          class="btn ghost"
          data-edit="${escapeHTML(
            station.id
          )}"
        >
          Editar
        </button>


        <button
          class="btn ghost"
          data-default="${escapeHTML(
            station.id
          )}"
        >

          ${
            isDefault
              ? "Padrão ✓"
              : "Tornar padrão"
          }

        </button>


        <button
          class="btn ghost"
          data-delete="${escapeHTML(
            station.id
          )}"
        >
          Excluir
        </button>

      </div>

    </article>

  `;

}


/* =========================
   MODAL
========================= */

function openModal(id = null){

  el.form.reset();

  el.editing.value = "";

  el.title.textContent =
    id
      ? "Editar rádio"
      : "Nova rádio";


  setDefaults();


  if(id){

    const station =
      stations.find(
        radio =>
          radio.id === id
      );

    if(!station) return;

    fillForm(station);

  }


  updateStatusLabel();


  el.modal.classList.add(
    "open"
  );

  el.modal.setAttribute(
    "aria-hidden",
    "false"
  );

}


function closeModal(){

  el.modal.classList.remove(
    "open"
  );

  el.modal.setAttribute(
    "aria-hidden",
    "true"
  );

}


/* =========================
   DEFAULTS
========================= */

function setDefaults(){

  $("#country").value =
    "Brasil";

  $("#language").value =
    "pt-BR";

  $("#timezone").value =
    "America/Sao_Paulo";

  $("#provider").value =
    "Zeno.FM";

  $("#primaryColor").value =
    "#6d28ff";

  $("#secondaryColor").value =
    "#a66bff";

  $("#backgroundColor").value =
    "#02030a";


  [
    "livePlayer",
    "metadata",
    "history",
    "schedule",
    "news",
    "events",
    "pwa",
    "mediaSession"

  ].forEach(id => {

    $("#" + id).checked =
      true;

  });


  $("#status").checked =
    true;

  $("#isDefault").checked =
    false;


  el.streamDot.className =
    "status-dot";

  el.streamText.textContent =
    "Teste a transmissão antes de salvar.";

}


/* =========================
   PREENCHER FORM
========================= */

function fillForm(station){

  el.editing.value =
    station.id || "";


  $("#id").value =
    station.id || "";

  $("#name").value =
    station.name || "";

  $("#shortName").value =
    station.shortName || "";

  $("#description").value =
    station.description || "";

  $("#country").value =
    station.country ||
    "Brasil";

  $("#language").value =
    station.language ||
    "pt-BR";

  $("#timezone").value =
    station.timezone ||
    "America/Sao_Paulo";


  $("#provider").value =
    station.stream?.provider ||
    "";

  $("#streamUrl").value =
    station.stream?.url ||
    "";

  $("#metadataUrl").value =
    station.stream?.metadata ||
    "";


  $("#primaryColor").value =
    station.branding?.primaryColor ||
    "#6d28ff";

  $("#secondaryColor").value =
    station.branding?.secondaryColor ||
    "#a66bff";

  $("#backgroundColor").value =
    station.branding?.background ||
    "#02030a";


  [
    "instagram",
    "facebook",
    "youtube",
    "tiktok",
    "whatsapp"

  ].forEach(id => {

    $("#" + id).value =
      station.social?.[id] ||
      "";

  });


  const features =
    station.features || {};


  [
    "livePlayer",
    "metadata",
    "history",
    "schedule",
    "news",
    "events",
    "pwa",
    "mediaSession"

  ].forEach(id => {

    $("#" + id).checked =
      features[id] !== false;

  });


  $("#status").checked =
    station.status !==
    "inactive";


  $("#isDefault").checked =
    station.id ===
    defaultStation;

}


/* =========================
   DADOS
========================= */

function getFormData(){

  return {

    id:
      $("#id")
        .value
        .trim()
        .toLowerCase(),

    name:
      $("#name")
        .value
        .trim(),

    shortName:
      $("#shortName")
        .value
        .trim(),

    description:
      $("#description")
        .value
        .trim(),

    country:
      $("#country")
        .value
        .trim(),

    language:
      $("#language")
        .value
        .trim(),

    timezone:
      $("#timezone")
        .value
        .trim(),


    stream: {

      provider:
        $("#provider")
          .value
          .trim(),

      url:
        $("#streamUrl")
          .value
          .trim(),

      metadata:
        $("#metadataUrl")
          .value
          .trim()

    },


    branding: {

      theme:
        "galaxy",

      primaryColor:
        $("#primaryColor")
          .value,

      secondaryColor:
        $("#secondaryColor")
          .value,

      background:
        $("#backgroundColor")
          .value

    },


    social: {

      instagram:
        $("#instagram")
          .value
          .trim(),

      facebook:
        $("#facebook")
          .value
          .trim(),

      youtube:
        $("#youtube")
          .value
          .trim(),

      tiktok:
        $("#tiktok")
          .value
          .trim(),

      whatsapp:
        $("#whatsapp")
          .value
          .trim()

    },


    features: {

      livePlayer:
        $("#livePlayer")
          .checked,

      metadata:
        $("#metadata")
          .checked,

      history:
        $("#history")
          .checked,

      schedule:
        $("#schedule")
          .checked,

      news:
        $("#news")
          .checked,

      events:
        $("#events")
          .checked,

      pwa:
        $("#pwa")
          .checked,

      mediaSession:
        $("#mediaSession")
          .checked

    },


    status:
      $("#status").checked
        ? "active"
        : "inactive"

  };

}


/* =========================
   SALVAR
========================= */

function saveRadio(event){

  event.preventDefault();


  const data =
    getFormData();


  if(
    !/^[a-z0-9]+(?:-[a-z0-9]+)*$/
      .test(data.id)
  ){

    toast(
      "ID inválido. Use letras, números e hífen."
    );

    return;

  }


  const editing =
    el.editing.value;


  const duplicate =
    stations.some(
      station =>
        station.id === data.id &&
        station.id !== editing
    );


  if(duplicate){

    toast(
      "Esse ID já está cadastrado."
    );

    return;

  }


  if(editing){

    const index =
      stations.findIndex(
        station =>
          station.id === editing
      );


    if(index >= 0){

      stations[index] =
        data;

    }

  }else{

    stations.push(
      data
    );

  }


  if(
    $("#isDefault").checked
  ){

    defaultStation =
      data.id;

  }


  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(
      stations
    )
  );


  render();

  closeModal();


  toast(
    editing
      ? "Rádio atualizada com sucesso."
      : "Rádio cadastrada com sucesso."
  );

}


/* =========================
   EXCLUIR
========================= */

function deleteRadio(id){

  const station =
    stations.find(
      radio =>
        radio.id === id
    );


  if(!station) return;


  if(
    !confirm(
      `Excluir "${station.name}"?`
    )
  ){

    return;

  }


  stations =
    stations.filter(
      radio =>
        radio.id !== id
    );


  if(
    defaultStation === id
  ){

    defaultStation =
      stations[0]?.id || "";

  }


  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(
      stations
    )
  );


  render();


  toast(
    "Rádio excluída."
  );

}


/* =========================
   PADRÃO
========================= */

function setDefault(id){

  if(
    !stations.some(
      radio =>
        radio.id === id
    )
  ){

    return;

  }


  defaultStation =
    id;


  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(
      stations
    )
  );


  render();


  toast(
    "Rádio definida como padrão."
  );

}


/* =========================
   TESTAR STREAM
========================= */

async function testStream(){

  const url =
    $("#streamUrl")
      .value
      .trim();


  if(!url){

    toast(
      "Informe a URL do stream."
    );

    return;

  }


  el.streamDot.className =
    "status-dot";

  el.streamText.textContent =
    "Testando transmissão...";


  const audio =
    new Audio();


  audio.preload =
    "none";

  audio.src =
    url;


  let finished =
    false;


  const finish =
    (success,message) => {

      if(finished) return;

      finished = true;


      el.streamDot.className =
        `status-dot ${
          success
            ? "ok"
            : "bad"
        }`;


      el.streamText.textContent =
        message;


      try{

        audio.pause();

      }catch{}

    };


  audio.addEventListener(
    "canplay",
    () => {

      finish(
        true,
        "Stream respondeu ao teste."
      );

    }
  );


  audio.addEventListener(
    "error",
    () => {

      finish(
        false,
        "Não foi possível validar o stream."
      );

    }
  );


  audio.load();


  setTimeout(
    () => {

      finish(
        false,
        "Tempo esgotado no teste."
      );

    },
    7000
  );

}


/* =========================
   EXPORTAR
========================= */

function exportJSON(){

  const data = {

    defaultStation,

    stations

  };


  const blob =
    new Blob(
      [
        JSON.stringify(
          data,
          null,
          2
        )
      ],
      {
        type:
          "application/json"
      }
    );


  const link =
    document.createElement(
      "a"
    );


  link.href =
    URL.createObjectURL(
      blob
    );

  link.download =
    "stations.json";


  link.click();


  URL.revokeObjectURL(
    link.href
  );

}


/* =========================
   ESTATÍSTICAS
========================= */

function updateStats(){

  const active =
    stations.filter(
      station =>
        station.status !==
        "inactive"
    ).length;


  el.total.textContent =
    stations.length;

  el.active.textContent =
    active;

  el.inactive.textContent =
    stations.length -
    active;


  const defaultRadio =
    stations.find(
      station =>
        station.id ===
        defaultStation
    );


  el.defaultName.textContent =
    defaultRadio
      ? (
          defaultRadio.shortName ||
          defaultRadio.name
        )
      : "—";

}


/* =========================
   STATUS
========================= */

function updateStatusLabel(){

  $("#statusLabel")
    .textContent =
      $("#status").checked
        ? "Rádio ativa"
        : "Rádio inativa";

}


/* =========================
   TOAST
========================= */

function toast(message){

  el.toast.textContent =
    message;


  el.toast.classList.add(
    "show"
  );


  clearTimeout(
    window.__toast
  );


  window.__toast =
    setTimeout(
      () => {

        el.toast.classList.remove(
          "show"
        );

      },
      2600
    );

}


/* =========================
   SEGURANÇA HTML
========================= */

function escapeHTML(value){

  return String(
    value ?? ""
  ).replace(
    /[&<>"']/g,
    char => ({

      "&":"&amp;",
      "<":"&lt;",
      ">":"&gt;",
      '"':"&quot;",
      "'":"&#039;"

    }[char])
  );

}


init();
