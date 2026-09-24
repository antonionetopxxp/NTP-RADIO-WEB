(() => {
  "use strict";

  const PROGRAMS_KEY = "ntp_radio_programacao";
  const PLAYLISTS_KEY = "ntp_radio_playlists";
  const STATIONS_URL = "../config/stations.json";

  const $ = (selector) => document.querySelector(selector);

  const form = $("#programForm");

  const idInput = $("#programId");
  const nameInput = $("#programName");
  const presenterInput = $("#presenter");
  const dayInput = $("#day");
  const startInput = $("#startTime");
  const endInput = $("#endTime");
  const descriptionInput = $("#description");
  const activeInput = $("#active");

  const stationInput = $("#stationId");
  const playlistInput = $("#playlistId");
  const createPlaylistBtn = $("#createPlaylistBtn");

  const listEl = $("#programList");
  const totalEl = $("#programTotal");
  const noticeEl = $("#programNotice");

  const cancelBtn =
    $("#cancelEditBtn") ||
    $("#cancelProgram");

  let programs = [];
  let playlists = [];
  let stations = [];

  const DAY_ORDER = {
    domingo: 0,
    segunda: 1,
    terca: 2,
    quarta: 3,
    quinta: 4,
    sexta: 5,
    sabado: 6
  };

  const DAY_LABELS = {
    domingo: "Domingo",
    segunda: "Segunda-feira",
    terca: "Terça-feira",
    quarta: "Quarta-feira",
    quinta: "Quinta-feira",
    sexta: "Sexta-feira",
    sabado: "Sábado"
  };

  function normalizeDay(value) {
    return String(value || "")
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  }

  function createId(prefix = "id") {
    if (window.crypto && crypto.randomUUID) {
      return `${prefix}-${crypto.randomUUID()}`;
    }

    return `${prefix}-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}`;
  }

  function escapeHTML(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function loadPrograms() {
    try {
      const saved = localStorage.getItem(PROGRAMS_KEY);
      programs = saved ? JSON.parse(saved) : [];

      if (!Array.isArray(programs)) {
        programs = [];
      }
    } catch (error) {
      console.error("[PROGRAMAÇÃO] Erro ao carregar programas:", error);
      programs = [];
    }
  }

  function savePrograms() {
    localStorage.setItem(
      PROGRAMS_KEY,
      JSON.stringify(programs)
    );

    window.dispatchEvent(
      new CustomEvent("ntp-programacao-updated")
    );
  }

  function loadPlaylists() {
    try {
      const saved = localStorage.getItem(PLAYLISTS_KEY);
      playlists = saved ? JSON.parse(saved) : [];

      if (!Array.isArray(playlists)) {
        playlists = [];
      }
    } catch (error) {
      console.error("[PROGRAMAÇÃO] Erro ao carregar playlists:", error);
      playlists = [];
    }
  }

  async function loadStations() {
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

      stations = Array.isArray(data)
        ? data
        : Array.isArray(data.stations)
        ? data.stations
        : [];

    } catch (error) {
      console.error(
        "[PROGRAMAÇÃO] Erro ao carregar rádios:",
        error
      );

      stations = [];
    }
  }

  function getStationName(stationId) {
    const station = stations.find(
      (item) => String(item.id) === String(stationId)
    );

    return (
      station?.name ||
      station?.shortName ||
      station?.title ||
      stationId ||
      "Rádio não definida"
    );
  }

  function getPlaylistName(playlistId) {
    if (!playlistId) {
      return "Nenhuma playlist";
    }

    const playlist = playlists.find(
      (item) => String(item.id) === String(playlistId)
    );

    return playlist?.name || "Playlist não encontrada";
  }

  function showNotice(message, type = "success") {
    if (!noticeEl) return;

    noticeEl.textContent = message;
    noticeEl.className = `notice ${type}`;

    clearTimeout(showNotice.timer);

    showNotice.timer = setTimeout(() => {
      noticeEl.textContent = "";
      noticeEl.className = "notice";
    }, 4000);
  }

  function populateStations(selectedId = "") {
    if (!stationInput) return;

    stationInput.innerHTML = `
      <option value="">Selecione a rádio</option>
    `;

    stations.forEach((station) => {
      const id = station.id;

      if (!id) return;

      const name =
        station.name ||
        station.shortName ||
        station.title ||
        id;

      const option = document.createElement("option");

      option.value = id;
      option.textContent = name;

      stationInput.appendChild(option);
    });

    if (selectedId) {
      stationInput.value = selectedId;
    }
  }

  function populatePlaylists(selectedId = "") {
    if (!playlistInput) return;

    const stationId = stationInput?.value || "";

    playlistInput.innerHTML = `
      <option value="">Nenhuma playlist</option>
    `;

    const filtered = playlists
      .filter((playlist) => {
        if (!playlist.active) return false;

        if (!stationId) return true;

        return (
          String(playlist.stationId) ===
          String(stationId)
        );
      })
      .sort((a, b) =>
        String(a.name || "").localeCompare(
          String(b.name || ""),
          "pt-BR"
        )
      );

    filtered.forEach((playlist) => {
      const option = document.createElement("option");

      option.value = playlist.id;
      option.textContent = playlist.name;

      playlistInput.appendChild(option);
    });

    if (
      selectedId &&
      filtered.some(
        (playlist) =>
          String(playlist.id) ===
          String(selectedId)
      )
    ) {
      playlistInput.value = selectedId;
    }
  }

  function renderPrograms() {
    if (!listEl) return;

    const sorted = [...programs].sort((a, b) => {
      const dayA =
        DAY_ORDER[normalizeDay(a.day)] ?? 99;

      const dayB =
        DAY_ORDER[normalizeDay(b.day)] ?? 99;

      if (dayA !== dayB) {
        return dayA - dayB;
      }

      return String(a.startTime || "").localeCompare(
        String(b.startTime || "")
      );
    });

    if (totalEl) {
      totalEl.textContent = sorted.length;
    }

    if (!sorted.length) {
      listEl.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">📻</div>
          <h3>Nenhum programa cadastrado</h3>
          <p>
            Crie o primeiro programa para começar
            a montar a programação da rádio.
          </p>
        </div>
      `;

      return;
    }

    listEl.innerHTML = sorted
      .map((program) => {
        const day =
          DAY_LABELS[normalizeDay(program.day)] ||
          program.day ||
          "Dia não definido";

        const stationName =
          getStationName(program.stationId);

        const playlistName =
          getPlaylistName(program.playlistId);

        const active =
          program.active !== false;

        return `
          <article
            class="program-card ${
              active ? "" : "program-inactive"
            }"
          >

            <div class="program-card-top">

              <div>
                <span class="program-day">
                  ${escapeHTML(day)}
                </span>

                <h3>
                  ${escapeHTML(
                    program.name ||
                      "Programa sem nome"
                  )}
                </h3>
              </div>

              <span class="program-status ${
                active
                  ? "status-active"
                  : "status-inactive"
              }">
                ${
                  active
                    ? "ATIVO"
                    : "INATIVO"
                }
              </span>

            </div>

            <div class="program-time">
              🕐
              ${escapeHTML(
                program.startTime || "--:--"
              )}
              →
              ${escapeHTML(
                program.endTime || "--:--"
              )}
            </div>

            <div class="program-info">

              <div>
                <strong>📻 Rádio</strong>
                <span>
                  ${escapeHTML(stationName)}
                </span>
              </div>

              <div>
                <strong>🎵 Playlist</strong>
                <span>
                  ${escapeHTML(playlistName)}
                </span>
              </div>

              <div>
                <strong>🎙️ Apresentador</strong>
                <span>
                  ${escapeHTML(
                    program.presenter ||
                      "Não informado"
                  )}
                </span>
              </div>

            </div>

            ${
              program.description
                ? `
                  <p class="program-description">
                    ${escapeHTML(
                      program.description
                    )}
                  </p>
                `
                : ""
            }

            <div class="program-actions">

              <button
                type="button"
                class="button button-secondary"
                data-action="edit"
                data-id="${escapeHTML(
                  program.id
                )}"
              >
                ✏️ Editar
              </button>

              <button
                type="button"
                class="button button-secondary"
                data-action="toggle"
                data-id="${escapeHTML(
                  program.id
                )}"
              >
                ${
                  active
                    ? "⏸️ Desativar"
                    : "▶️ Ativar"
                }
              </button>

              <button
                type="button"
                class="button button-danger"
                data-action="delete"
                data-id="${escapeHTML(
                  program.id
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

  function resetForm() {
    if (!form) return;

    form.reset();

    if (idInput) {
      idInput.value = "";
    }

    if (activeInput) {
      activeInput.checked = true;
    }

    if (stationInput) {
      stationInput.value = "";
    }

    populatePlaylists("");

    if (cancelBtn) {
      cancelBtn.style.display = "none";
    }

    const submitButton =
      form.querySelector(
        'button[type="submit"]'
      );

    if (submitButton) {
      submitButton.textContent =
        "💾 Salvar programa";
    }
  }

  function editProgram(id) {
    const program = programs.find(
      (item) =>
        String(item.id) === String(id)
    );

    if (!program) return;

    if (idInput) {
      idInput.value = program.id;
    }

    if (nameInput) {
      nameInput.value =
        program.name || "";
    }

    if (presenterInput) {
      presenterInput.value =
        program.presenter || "";
    }

    if (dayInput) {
      dayInput.value =
        normalizeDay(program.day);
    }

    if (startInput) {
      startInput.value =
        program.startTime || "";
    }

    if (endInput) {
      endInput.value =
        program.endTime || "";
    }

    if (descriptionInput) {
      descriptionInput.value =
        program.description || "";
    }

    if (activeInput) {
      activeInput.checked =
        program.active !== false;
    }

    if (stationInput) {
      stationInput.value =
        program.stationId || "";
    }

    populatePlaylists(
      program.playlistId || ""
    );

    if (cancelBtn) {
      cancelBtn.style.display = "";
    }

    const submitButton =
      form?.querySelector(
        'button[type="submit"]'
      );

    if (submitButton) {
      submitButton.textContent =
        "💾 Atualizar programa";
    }

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  }

  function deleteProgram(id) {
    const program = programs.find(
      (item) =>
        String(item.id) === String(id)
    );

    if (!program) return;

    const confirmed = window.confirm(
      `Excluir o programa "${program.name}"?`
    );

    if (!confirmed) return;

    programs = programs.filter(
      (item) =>
        String(item.id) !== String(id)
    );

    savePrograms();
    renderPrograms();

    showNotice(
      "Programa excluído com sucesso."
    );
  }

  function toggleProgram(id) {
    const program = programs.find(
      (item) =>
        String(item.id) === String(id)
    );

    if (!program) return;

    program.active =
      program.active === false;

    program.updatedAt =
      new Date().toISOString();

    savePrograms();
    renderPrograms();

    showNotice(
      program.active
        ? "Programa ativado."
        : "Programa desativado."
    );
  }

  function createPlaylist() {
    if (!stationInput || !playlistInput) {
      return;
    }

    const stationId =
      stationInput.value;

    if (!stationId) {
      showNotice(
        "Selecione uma rádio antes de criar a playlist.",
        "error"
      );

      stationInput.focus();
      return;
    }

    const stationName =
      getStationName(stationId);

    const name = window.prompt(
      `Nome da nova playlist para ${stationName}:`
    );

    if (name === null) {
      return;
    }

    const cleanName =
      name.trim();

    if (!cleanName) {
      showNotice(
        "Digite um nome para a playlist.",
        "error"
      );

      return;
    }

    const duplicate = playlists.some(
      (playlist) =>
        String(playlist.stationId) ===
          String(stationId) &&
        String(playlist.name)
          .trim()
          .toLowerCase() ===
          cleanName.toLowerCase()
    );

    if (duplicate) {
      showNotice(
        "Já existe uma playlist com esse nome para esta rádio.",
        "error"
      );

      return;
    }

    const now =
      new Date().toISOString();

    const playlist = {
      id: createId("playlist"),
      name: cleanName,
      stationId,
      type: "rotation",
      mode: "random",
      description: "",
      trackIds: [],
      active: true,
      createdAt: now,
      updatedAt: now
    };

    playlists.push(playlist);

    localStorage.setItem(
      PLAYLISTS_KEY,
      JSON.stringify(playlists)
    );

    window.dispatchEvent(
      new CustomEvent("ntp-playlists-updated", {
        detail: playlist
      })
    );

    populatePlaylists(
      playlist.id
    );

    playlistInput.value =
      playlist.id;

    showNotice(
      `Playlist "${cleanName}" criada com sucesso.`
    );
  }

  function validateForm() {
    if (!nameInput?.value.trim()) {
      showNotice(
        "Digite o nome do programa.",
        "error"
      );

      nameInput?.focus();

      return false;
    }

    if (!stationInput?.value) {
      showNotice(
        "Selecione a rádio.",
        "error"
      );

      stationInput?.focus();

      return false;
    }

    if (!dayInput?.value) {
      showNotice(
        "Selecione o dia da semana.",
        "error"
      );

      dayInput?.focus();

      return false;
    }

    if (!startInput?.value) {
      showNotice(
        "Informe o horário de início.",
        "error"
      );

      startInput?.focus();

      return false;
    }

    if (!endInput?.value) {
      showNotice(
        "Informe o horário de término.",
        "error"
      );

      endInput?.focus();

      return false;
    }

    return true;
  }

  function handleSubmit(event) {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    const editingId =
      idInput?.value.trim();

    const now =
      new Date().toISOString();

    const programData = {
      id:
        editingId ||
        createId("program"),
      name:
        nameInput.value.trim(),
      presenter:
        presenterInput?.value.trim() || "",
      day:
        normalizeDay(dayInput.value),
      startTime:
        startInput.value,
      endTime:
        endInput.value,
      description:
        descriptionInput?.value.trim() || "",
      active:
        activeInput
          ? activeInput.checked
          : true,
      stationId:
        stationInput.value,
      playlistId:
        playlistInput?.value || "",
      updatedAt: now
    };

    if (editingId) {
      const index =
        programs.findIndex(
          (item) =>
            String(item.id) ===
            String(editingId)
        );

      if (index !== -1) {
        programData.createdAt =
          programs[index].createdAt ||
          now;

        programs[index] =
          programData;
      }
    } else {
      programData.createdAt = now;
      programs.push(programData);
    }

    savePrograms();
    renderPrograms();

    showNotice(
      editingId
        ? "Programa atualizado com sucesso."
        : "Programa criado com sucesso."
    );

    resetForm();
  }

  function handleListClick(event) {
    const button =
      event.target.closest(
        "button[data-action]"
      );

    if (!button) return;

    const action =
      button.dataset.action;

    const id =
      button.dataset.id;

    if (!id) return;

    if (action === "edit") {
      editProgram(id);
    }

    if (action === "delete") {
      deleteProgram(id);
    }

    if (action === "toggle") {
      toggleProgram(id);
    }
  }

  function bindEvents() {
    form?.addEventListener(
      "submit",
      handleSubmit
    );

    listEl?.addEventListener(
      "click",
      handleListClick
    );

    stationInput?.addEventListener(
      "change",
      () => {
        populatePlaylists("");
      }
    );

    createPlaylistBtn?.addEventListener(
      "click",
      createPlaylist
    );

    cancelBtn?.addEventListener(
      "click",
      (event) => {
        event.preventDefault();
        resetForm();
      }
    );

    window.addEventListener(
      "storage",
      (event) => {
        if (
          event.key ===
          PROGRAMS_KEY
        ) {
          loadPrograms();
          renderPrograms();
        }

        if (
          event.key ===
          PLAYLISTS_KEY
        ) {
          loadPlaylists();

          populatePlaylists(
            playlistInput?.value || ""
          );

          renderPrograms();
        }
      }
    );

    window.addEventListener(
      "ntp-playlists-updated",
      () => {
        loadPlaylists();

        populatePlaylists(
          playlistInput?.value || ""
        );

        renderPrograms();
      }
    );

    window.addEventListener(
      "ntp-stations-updated",
      async () => {
        await loadStations();

        populateStations(
          stationInput?.value || ""
        );

        populatePlaylists(
          playlistInput?.value || ""
        );
      }
    );
  }

  async function init() {
    console.log(
      "[PROGRAMAÇÃO] Inicializando..."
    );

    loadPrograms();
    loadPlaylists();

    await loadStations();

    populateStations();
    populatePlaylists();

    renderPrograms();

    resetForm();

    bindEvents();

    console.log(
      "[PROGRAMAÇÃO] Sistema carregado.",
      {
        programas: programs.length,
        playlists: playlists.length,
        radios: stations.length
      }
    );
  }

  if (
    document.readyState ===
    "loading"
  ) {
    document.addEventListener(
      "DOMContentLoaded",
      init
    );
  } else {
    init();
  }
})();
