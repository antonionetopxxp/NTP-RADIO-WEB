(() => {
  "use strict";

  const STORAGE_KEY = "ntp_radio_programacao";

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

  const listEl = $("#programList");
  const totalEl = $("#programTotal");
  const noticeEl = $("#programNotice");

  const cancelBtn =
    document.querySelector("#cancelProgram");

  let programs = [];

  /* =====================================================
     CARREGAR
  ===================================================== */

  function loadPrograms() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);

      programs = saved ? JSON.parse(saved) : [];

      if (!Array.isArray(programs)) {
        programs = [];
      }
    } catch (error) {
      console.error("Erro ao carregar programação:", error);
      programs = [];
    }
  }

  /* =====================================================
     SALVAR
  ===================================================== */

  function savePrograms() {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(programs)
      );

      return true;
    } catch (error) {
      console.error("Erro ao salvar programação:", error);

      showNotice(
        "Não foi possível salvar a programação.",
        "error"
      );

      return false;
    }
  }

  /* =====================================================
     ID
  ===================================================== */

  function createId() {
    if (
      window.crypto &&
      typeof window.crypto.randomUUID === "function"
    ) {
      return window.crypto.randomUUID();
    }

    return (
      Date.now().toString(36) +
      Math.random().toString(36).substring(2, 9)
    );
  }

  /* =====================================================
     SEGURANÇA
  ===================================================== */

  function escapeHTML(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  /* =====================================================
     ORDEM DOS DIAS
  ===================================================== */

  const dayOrder = {
    "Domingo": 0,
    "Segunda-feira": 1,
    "Terça-feira": 2,
    "Quarta-feira": 3,
    "Quinta-feira": 4,
    "Sexta-feira": 5,
    "Sábado": 6
  };

  function sortPrograms(list) {
    return [...list].sort((a, b) => {
      const dayA =
        dayOrder[a.day] !== undefined
          ? dayOrder[a.day]
          : 99;

      const dayB =
        dayOrder[b.day] !== undefined
          ? dayOrder[b.day]
          : 99;

      if (dayA !== dayB) {
        return dayA - dayB;
      }

      return String(a.startTime || "")
        .localeCompare(String(b.startTime || ""));
    });
  }

  /* =====================================================
     RENDER
  ===================================================== */

  function render() {
    if (!listEl) return;

    const ordered = sortPrograms(programs);

    if (totalEl) {
      totalEl.textContent = programs.length;
    }

    if (!ordered.length) {
      listEl.innerHTML = `
        <div class="program-empty">
          <strong>Nenhum programa cadastrado.</strong>
          <span>Use o formulário acima para criar o primeiro programa.</span>
        </div>
      `;

      return;
    }

    listEl.innerHTML = ordered
      .map(createProgramHTML)
      .join("");
  }

  function createProgramHTML(program) {
    const active = program.active !== false;

    const statusClass = active
      ? "active"
      : "inactive";

    const statusText = active
      ? "ATIVO"
      : "INATIVO";

    const toggleText = active
      ? "⏸️ Desativar"
      : "▶️ Ativar";

    return `
      <article
        class="program-card"
        data-id="${escapeHTML(program.id)}"
      >

        <div class="program-info">

          <h3 class="program-title">
            ${escapeHTML(program.name || "Sem nome")}
          </h3>

          ${
            program.presenter
              ? `
                <div class="program-presenter">
                  🎙️ ${escapeHTML(program.presenter)}
                </div>
              `
              : ""
          }

          <div class="program-meta">

            ${
              program.startTime || program.endTime
                ? `
                  <span>
                    🕐
                    ${escapeHTML(program.startTime || "--:--")}
                    —
                    ${escapeHTML(program.endTime || "--:--")}
                  </span>
                `
                : ""
            }

            ${
              program.day
                ? `
                  <span>
                    📅 ${escapeHTML(program.day)}
                  </span>
                `
                : ""
            }

            <span class="program-status ${statusClass}">
              ${statusText}
            </span>

          </div>

          ${
            program.description
              ? `
                <p class="program-description">
                  ${escapeHTML(program.description)}
                </p>
              `
              : ""
          }

        </div>

        <div class="program-actions">

          <button
            type="button"
            class="program-action edit"
            data-action="edit"
            data-id="${escapeHTML(program.id)}"
          >
            ✏️ Editar
          </button>

          <button
            type="button"
            class="program-action toggle"
            data-action="toggle"
            data-id="${escapeHTML(program.id)}"
          >
            ${toggleText}
          </button>

          <button
            type="button"
            class="program-action delete"
            data-action="delete"
            data-id="${escapeHTML(program.id)}"
          >
            🗑️ Excluir
          </button>

        </div>

      </article>
    `;
  }

  /* =====================================================
     NOVO / EDITAR
  ===================================================== */

  function resetForm() {
    form?.reset();

    if (idInput) {
      idInput.value = "";
    }

    if (activeInput) {
      activeInput.checked = true;
    }

    if (cancelBtn) {
      cancelBtn.style.display = "none";
    }

    showNotice("", "");
  }

  function editProgram(id) {
    const program = programs.find(
      (item) => String(item.id) === String(id)
    );

    if (!program) {
      showNotice(
        "Programa não encontrado.",
        "error"
      );

      return;
    }

    idInput.value = program.id || "";
    nameInput.value = program.name || "";
    presenterInput.value = program.presenter || "";
    dayInput.value = program.day || "";
    startInput.value = program.startTime || "";
    endInput.value = program.endTime || "";
    descriptionInput.value =
      program.description || "";

    if (activeInput) {
      activeInput.checked =
        program.active !== false;
    }

    if (cancelBtn) {
      cancelBtn.style.display = "inline-flex";
    }

    nameInput?.focus();

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });

    showNotice(
      "Editando programa. Altere os dados e clique em salvar.",
      "info"
    );
  }

  /* =====================================================
     SALVAR FORMULÁRIO
  ===================================================== */

  function handleSubmit(event) {
    event.preventDefault();

    const name =
      nameInput?.value.trim() || "";

    if (!name) {
      showNotice(
        "Digite o nome do programa.",
        "error"
      );

      nameInput?.focus();

      return;
    }

    const id =
      idInput?.value.trim() || "";

    const data = {
      id: id || createId(),

      name,

      presenter:
        presenterInput?.value.trim() || "",

      day:
        dayInput?.value || "",

      startTime:
        startInput?.value || "",

      endTime:
        endInput?.value || "",

      description:
        descriptionInput?.value.trim() || "",

      active:
        activeInput
          ? activeInput.checked
          : true,

      updatedAt:
        new Date().toISOString()
    };

    if (id) {
      const index = programs.findIndex(
        (item) =>
          String(item.id) === String(id)
      );

      if (index === -1) {
        showNotice(
          "Programa não encontrado.",
          "error"
        );

        return;
      }

      data.createdAt =
        programs[index].createdAt ||
        new Date().toISOString();

      programs[index] = data;

      if (!savePrograms()) return;

      showNotice(
        "Programa atualizado com sucesso.",
        "success"
      );
    } else {
      data.createdAt =
        new Date().toISOString();

      programs.push(data);

      if (!savePrograms()) return;

      showNotice(
        "Programa criado com sucesso.",
        "success"
      );
    }

    resetForm();
    render();

    notifyUpdate();
  }

  /* =====================================================
     ATIVAR / DESATIVAR
  ===================================================== */

  function toggleProgram(id) {
    const program = programs.find(
      (item) =>
        String(item.id) === String(id)
    );

    if (!program) {
      showNotice(
        "Programa não encontrado.",
        "error"
      );

      return;
    }

    program.active =
      program.active === false;

    program.updatedAt =
      new Date().toISOString();

    if (!savePrograms()) return;

    render();

    showNotice(
      program.active
        ? "Programa ativado."
        : "Programa desativado.",
      "success"
    );

    notifyUpdate();
  }

  /* =====================================================
     EXCLUIR
  ===================================================== */

  function deleteProgram(id) {
    const program = programs.find(
      (item) =>
        String(item.id) === String(id)
    );

    if (!program) {
      showNotice(
        "Programa não encontrado.",
        "error"
      );

      return;
    }

    const confirmed = window.confirm(
      `Excluir o programa "${program.name}"?\n\n` +
      "Esta ação não poderá ser desfeita."
    );

    if (!confirmed) {
      return;
    }

    programs = programs.filter(
      (item) =>
        String(item.id) !== String(id)
    );

    if (!savePrograms()) return;

    render();

    showNotice(
      "Programa excluído com sucesso.",
      "success"
    );

    notifyUpdate();
  }

  /* =====================================================
     CLIQUES NOS BOTÕES
  ===================================================== */

  function handleListClick(event) {
    const button =
      event.target.closest("[data-action]");

    if (!button) return;

    const action =
      button.dataset.action;

    const id =
      button.dataset.id;

    if (!id) return;

    if (action === "edit") {
      editProgram(id);
    }

    if (action === "toggle") {
      toggleProgram(id);
    }

    if (action === "delete") {
      deleteProgram(id);
    }
  }

  /* =====================================================
     AVISOS
  ===================================================== */

  function showNotice(message, type) {
    if (!noticeEl) return;

    noticeEl.textContent = message;

    noticeEl.className =
      "program-notice";

    if (type) {
      noticeEl.classList.add(type);
    }

    if (!message) {
      noticeEl.style.display = "none";
    } else {
      noticeEl.style.display = "block";
    }
  }

  /* =====================================================
     ATUALIZAÇÃO
  ===================================================== */

  function notifyUpdate() {
    window.dispatchEvent(
      new Event("ntp-programacao-updated")
    );
  }

  window.addEventListener(
    "storage",
    (event) => {
      if (event.key === STORAGE_KEY) {
        loadPrograms();
        render();
      }
    }
  );

  /* =====================================================
     CANCELAR EDIÇÃO
  ===================================================== */

  cancelBtn?.addEventListener(
    "click",
    () => {
      resetForm();
    }
  );

  /* =====================================================
     MENU MOBILE
  ===================================================== */

  function setupMenu() {
    const menuBtn =
      document.querySelector("#menuBtn");

    const sidebar =
      document.querySelector("#sidebar");

    const overlay =
      document.querySelector("#overlay");

    if (!menuBtn || !sidebar) {
      return;
    }

    menuBtn.addEventListener(
      "click",
      () => {
        sidebar.classList.toggle("open");
        overlay?.classList.toggle("open");
        document.body.classList.toggle(
          "menu-open"
        );
      }
    );

    overlay?.addEventListener(
      "click",
      closeMenu
    );

    sidebar
      .querySelectorAll("a")
      .forEach((link) => {
        link.addEventListener(
          "click",
          closeMenu
        );
      });

    function closeMenu() {
      sidebar.classList.remove("open");
      overlay?.classList.remove("open");
      document.body.classList.remove(
        "menu-open"
      );
    }
  }

  /* =====================================================
     INICIAR
  ===================================================== */

  function init() {
    if (!form || !listEl) {
      console.warn(
        "Elementos da programação não encontrados."
      );

      return;
    }

    loadPrograms();

    render();

    form.addEventListener(
      "submit",
      handleSubmit
    );

    listEl.addEventListener(
      "click",
      handleListClick
    );

    setupMenu();

    console.log(
      "NTP RADIO OS — Programação carregada."
    );
  }

  if (
    document.readyState === "loading"
  ) {
    document.addEventListener(
      "DOMContentLoaded",
      init
    );
  } else {
    init();
  }
})();
