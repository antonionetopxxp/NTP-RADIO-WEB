(function () {
  "use strict";

  const STORAGE_KEY = "ntp_radio_stations";

  const form = document.getElementById("radioForm");
  const editor = document.getElementById("radioEditor");
  const list = document.getElementById("radioList");
  const total = document.getElementById("radioTotal");
  const notice = document.getElementById("radioNotice");

  const newBtn = document.getElementById("newRadioBtn");
  const cancelBtn = document.getElementById("cancelRadioBtn");

  const formTitle = document.getElementById("formTitle");

  const fields = {
    id: document.getElementById("radioId"),
    name: document.getElementById("radioName"),
    shortName: document.getElementById("radioShortName"),
    description: document.getElementById("radioDescription"),
    country: document.getElementById("radioCountry"),
    language: document.getElementById("radioLanguage"),
    timezone: document.getElementById("radioTimezone"),
    provider: document.getElementById("radioProvider"),
    stream: document.getElementById("radioStream"),
    metadata: document.getElementById("radioMetadata"),
    primary: document.getElementById("radioPrimary"),
    secondary: document.getElementById("radioSecondary"),
    background: document.getElementById("radioBackground"),
    active: document.getElementById("radioActive")
  };

  let stations = [];
  let defaultStation = "ntp-radio-web";


  // =====================================================
  // AVISO
  // =====================================================

  function showNotice(message, type = "success") {
    if (!notice) return;

    notice.hidden = false;
    notice.textContent = message;

    notice.className =
      "notice " +
      (type === "error"
        ? "notice-error"
        : "notice-success");

    setTimeout(() => {
      notice.hidden = true;
    }, 3500);
  }


  // =====================================================
  // ID
  // =====================================================

  function createId(name) {

    return String(name || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 50) || "radio";

  }


  function uniqueId(base, ignoreId = "") {

    let id = base;
    let counter = 2;

    while (
      stations.some(
        station =>
          station.id === id &&
          station.id !== ignoreId
      )
    ) {
      id = `${base}-${counter}`;
      counter++;
    }

    return id;
  }


  // =====================================================
  // LOCAL STORAGE
  // =====================================================

  function saveLocal() {

    try {

      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(stations)
      );

    } catch (error) {

      console.error(
        "Erro ao salvar rádios:",
        error
      );

    }

  }


  function loadLocal() {

    try {

      const saved =
        localStorage.getItem(
          STORAGE_KEY
        );

      if (!saved) {
        return false;
      }

      const parsed =
        JSON.parse(saved);

      if (!Array.isArray(parsed)) {
        return false;
      }

      stations = parsed;

      return true;

    } catch (error) {

      console.error(
        "Erro ao carregar rádios locais:",
        error
      );

      return false;

    }

  }


  // =====================================================
  // CARREGAR STATIONS.JSON
  // =====================================================

  async function loadStations() {

    const localLoaded =
      loadLocal();

    if (localLoaded) {

      render();

      return;

    }


    try {

      const response =
        await fetch(
          "../config/stations.json?v=" +
          Date.now(),
          {
            cache: "no-store"
          }
        );

      if (!response.ok) {

        throw new Error(
          "HTTP " + response.status
        );

      }


      const data =
        await response.json();


      defaultStation =
        data.defaultStation ||
        "ntp-radio-web";


      stations =
        Array.isArray(data.stations)
          ? data.stations
          : [];


      saveLocal();

      render();


    } catch (error) {

      console.error(
        "Erro ao carregar stations.json:",
        error
      );

      stations = [];

      render();

      showNotice(
        "Não foi possível carregar as rádios.",
        "error"
      );

    }

  }


  // =====================================================
  // FORMULÁRIO
  // =====================================================

  function resetForm() {

    form.reset();

    fields.id.value = "";

    fields.country.value =
      "Brasil";

    fields.language.value =
      "pt-BR";

    fields.timezone.value =
      "America/Sao_Paulo";

    fields.primary.value =
      "#6d28ff";

    fields.secondary.value =
      "#a66bff";

    fields.background.value =
      "#02030a";

    fields.active.checked = true;

    formTitle.textContent =
      "Nova rádio";

    editor.hidden = false;

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });

  }


  function fillForm(station) {

    fields.id.value =
      station.id || "";

    fields.name.value =
      station.name || "";

    fields.shortName.value =
      station.shortName || "";

    fields.description.value =
      station.description || "";

    fields.country.value =
      station.country || "Brasil";

    fields.language.value =
      station.language || "pt-BR";

    fields.timezone.value =
      station.timezone ||
      "America/Sao_Paulo";

    fields.provider.value =
      station.stream?.provider || "";

    fields.stream.value =
      station.stream?.url || "";

    fields.metadata.value =
      station.stream?.metadata || "";

    fields.primary.value =
      station.branding?.primaryColor ||
      "#6d28ff";

    fields.secondary.value =
      station.branding?.secondaryColor ||
      "#a66bff";

    fields.background.value =
      station.branding?.background ||
      "#02030a";

    fields.active.checked =
      station.status !== "inactive";

    formTitle.textContent =
      "Editar rádio";

    editor.hidden = false;

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });

  }


  // =====================================================
  // FORM DATA
  // =====================================================

  function getFormData() {

    const currentId =
      fields.id.value.trim();

    const generatedId =
      createId(fields.name.value);

    const id =
      currentId ||
      uniqueId(generatedId);


    return {

      id,

      name:
        fields.name.value.trim(),

      shortName:
        fields.shortName.value.trim(),

      description:
        fields.description.value.trim(),

      country:
        fields.country.value.trim(),

      language:
        fields.language.value.trim(),

      timezone:
        fields.timezone.value.trim(),

      stream: {

        provider:
          fields.provider.value.trim(),

        url:
          fields.stream.value.trim(),

        metadata:
          fields.metadata.value.trim()

      },

      branding: {

        theme: "galaxy",

        primaryColor:
          fields.primary.value.trim(),

        secondaryColor:
          fields.secondary.value.trim(),

        background:
          fields.background.value.trim()

      },

      social: {

        instagram: "",
        facebook: "",
        youtube: "",
        tiktok: "",
        whatsapp: ""

      },

      features: {

        livePlayer: true,
        metadata: true,
        history: true,
        schedule: true,
        news: true,
        events: true,
        pwa: true,
        mediaSession: true

      },

      status:
        fields.active.checked
          ? "active"
          : "inactive"

    };

  }


  // =====================================================
  // VALIDAÇÃO
  // =====================================================

  function validate(station) {

    if (!station.name) {

      showNotice(
        "Digite o nome da rádio.",
        "error"
      );

      fields.name.focus();

      return false;

    }


    if (!station.shortName) {

      showNotice(
        "Digite o nome curto da rádio.",
        "error"
      );

      fields.shortName.focus();

      return false;

    }


    if (!station.stream.url) {

      showNotice(
        "Digite a URL do streaming.",
        "error"
      );

      fields.stream.focus();

      return false;

    }


    return true;

  }


  // =====================================================
  // SALVAR
  // =====================================================

  function saveStation(event) {

    event.preventDefault();

    const station =
      getFormData();


    if (!validate(station)) {
      return;
    }


    const existingIndex =
      stations.findIndex(
        item =>
          item.id === station.id
      );


    if (existingIndex >= 0) {

      stations[existingIndex] =
        station;

      showNotice(
        "Rádio atualizada com sucesso."
      );

    } else {

      stations.push(station);

      showNotice(
        "Rádio cadastrada com sucesso."
      );

    }


    saveLocal();

    render();

    form.reset();

    fields.id.value = "";

    editor.hidden = true;


    window.dispatchEvent(
      new CustomEvent(
        "ntp-stations-updated",
        {
          detail: stations
        }
      )
    );

  }


  // =====================================================
  // EDITAR
  // =====================================================

  function editStation(id) {

    const station =
      stations.find(
        item =>
          item.id === id
      );

    if (!station) return;

    fillForm(station);

  }


  // =====================================================
  // ATIVAR / DESATIVAR
  // =====================================================

  function toggleStation(id) {

    const station =
      stations.find(
        item =>
          item.id === id
      );

    if (!station) return;


    if (
      station.status === "active"
    ) {

      station.status =
        "inactive";

    } else {

      station.status =
        "active";

    }


    saveLocal();

    render();

    showNotice(
      station.status === "active"
        ? "Rádio ativada."
        : "Rádio desativada."
    );


    window.dispatchEvent(
      new CustomEvent(
        "ntp-stations-updated",
        {
          detail: stations
        }
      )
    );

  }


  // =====================================================
  // EXCLUIR
  // =====================================================

  function deleteStation(id) {

    const station =
      stations.find(
        item =>
          item.id === id
      );

    if (!station) return;


    if (
      stations.length === 1
    ) {

      showNotice(
        "Você precisa manter pelo menos uma rádio cadastrada.",
        "error"
      );

      return;

    }


    const confirmed =
      confirm(
        `Excluir a rádio "${station.name}"?`
      );


    if (!confirmed) {
      return;
    }


    stations =
      stations.filter(
        item =>
          item.id !== id
      );


    if (
      defaultStation === id
    ) {

      defaultStation =
        stations[0]?.id ||
        "ntp-radio-web";

    }


    saveLocal();

    render();

    showNotice(
      "Rádio excluída."
    );


    window.dispatchEvent(
      new CustomEvent(
        "ntp-stations-updated",
        {
          detail: stations
        }
      )
    );

  }


  // =====================================================
  // DEFINIR COMO PADRÃO
  // =====================================================

  function setDefaultStation(id) {

    const station =
      stations.find(
        item =>
          item.id === id
      );

    if (!station) return;


    defaultStation =
      id;


    try {

      localStorage.setItem(
        "ntp_default_station",
        id
      );

    } catch (error) {

      console.error(error);

    }


    render();

    showNotice(
      `"${station.name}" definida como rádio padrão.`
    );

  }


  // =====================================================
  // HTML SEGURO
  // =====================================================

  function escapeHTML(value) {

    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

  }


  // =====================================================
  // RENDER
  // =====================================================

  function render() {

    if (!list) return;


    total.textContent =
      stations.length;


    if (!stations.length) {

      list.innerHTML = `
        <div class="empty-state">
          Nenhuma rádio cadastrada.
        </div>
      `;

      return;

    }


    list.innerHTML =
      stations
        .map(station => {

          const active =
            station.status !== "inactive";

          const isDefault =
            station.id === defaultStation;


          return `

            <article class="radio-card">

              <div class="radio-card-main">

                <div
                  class="radio-logo"
                  style="
                    background:
                      linear-gradient(
                        135deg,
                        ${escapeHTML(
                          station.branding?.primaryColor ||
                          "#6d28ff"
                        )},
                        ${escapeHTML(
                          station.branding?.secondaryColor ||
                          "#a66bff"
                        )}
                      );
                  "
                >
                  ${escapeHTML(
                    station.shortName ||
                    "R"
                  )}
                </div>


                <div class="radio-info">

                  <h3>
                    ${escapeHTML(
                      station.name
                    )}
                  </h3>

                  <p>
                    ${escapeHTML(
                      station.description ||
                      "Rádio online"
                    )}
                  </p>

                  <div class="radio-meta">

                    <span>
                      📡
                      ${escapeHTML(
                        station.stream?.provider ||
                        "Streaming"
                      )}
                    </span>

                    <span>
                      ${active
                        ? "🟢 Ativa"
                        : "⚫ Inativa"}
                    </span>

                    ${
                      isDefault
                        ? `
                          <span>
                            ⭐ Padrão
                          </span>
                        `
                        : ""
                    }

                  </div>

                </div>

              </div>


              <div class="radio-actions">

                <button
                  class="btn"
                  type="button"
                  data-action="edit"
                  data-id="${escapeHTML(
                    station.id
                  )}"
                >
                  ✏️ Editar
                </button>


                <button
                  class="btn"
                  type="button"
                  data-action="toggle"
                  data-id="${escapeHTML(
                    station.id
                  )}"
                >
                  ${
                    active
                      ? "⏸️ Desativar"
                      : "▶️ Ativar"
                  }
                </button>


                ${
                  !isDefault
                    ? `
                      <button
                        class="btn"
                        type="button"
                        data-action="default"
                        data-id="${escapeHTML(
                          station.id
                        )}"
                      >
                        ⭐ Tornar padrão
                      </button>
                    `
                    : ""
                }


                <button
                  class="btn btn-danger"
                  type="button"
                  data-action="delete"
                  data-id="${escapeHTML(
                    station.id
                  )}"
                >
                  🗑️ Excluir
                </button>

              </div>

            </article>

          `;

        })
        .join("");

  }


  // =====================================================
  // CLIQUES DA LISTA
  // =====================================================

  if (list) {

    list.addEventListener(
      "click",
      function (event) {

        const button =
          event.target.closest(
            "button[data-action]"
          );

        if (!button) {
          return;
        }


        const action =
          button.dataset.action;

        const id =
          button.dataset.id;


        if (action === "edit") {

          editStation(id);

        }

        else if (
          action === "toggle"
        ) {

          toggleStation(id);

        }

        else if (
          action === "delete"
        ) {

          deleteStation(id);

        }

        else if (
          action === "default"
        ) {

          setDefaultStation(id);

        }

      }
    );

  }


  // =====================================================
  // BOTÕES
  // =====================================================

  if (newBtn) {

    newBtn.addEventListener(
      "click",
      resetForm
    );

  }


  if (cancelBtn) {

    cancelBtn.addEventListener(
      "click",
      function () {

        editor.hidden = true;

        form.reset();

      }
    );

  }


  if (form) {

    form.addEventListener(
      "submit",
      saveStation
    );

  }


  // =====================================================
  // INICIALIZAÇÃO
  // =====================================================

  loadStations();

})();
