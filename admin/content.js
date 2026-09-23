(() => {
  "use strict";

  const CONTENT_TYPE = window.NTP_CONTENT_TYPE || "news";

  const CONFIG = {
    news: {
      key: "ntp_radio_noticias",
      title: "Notícias",
      singular: "notícia"
    },
    promotions: {
      key: "ntp_radio_promocoes",
      title: "Promoções",
      singular: "promoção"
    },
    events: {
      key: "ntp_radio_eventos",
      title: "Eventos",
      singular: "evento"
    }
  };

  const config = CONFIG[CONTENT_TYPE] || CONFIG.news;

  const $ = (selector) => document.querySelector(selector);

  const listEl = $("#newsList");
  const totalEl = $("#newsTotal");
  const form = $("#newsForm");
  const modal = $("#newsModal");

  const newBtn = $("#newNewsBtn");
  const closeBtn = $("#closeNewsModal");
  const cancelBtn = $("#cancelNewsBtn");

  const searchInput = $("#searchInput");
  const statusFilter = $("#statusFilter");

  const idInput = $("#newsId");
  const titleInput = $("#newsTitle");
  const categoryInput = $("#newsCategory");
  const dateInput = $("#newsDate");
  const imageInput = $("#newsImage");
  const summaryInput = $("#newsSummary");
  const publishedInput = $("#newsPublished");

  let items = [];

  /* =========================================================
     STORAGE
  ========================================================= */

  function loadItems() {
    try {
      const saved = localStorage.getItem(config.key);

      if (!saved) {
        items = [];
        return;
      }

      const parsed = JSON.parse(saved);

      items = Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.error("Erro ao carregar conteúdo:", error);
      items = [];
    }
  }

  function saveItems() {
    try {
      localStorage.setItem(config.key, JSON.stringify(items));
      return true;
    } catch (error) {
      console.error("Erro ao salvar conteúdo:", error);
      showToast("Não foi possível salvar os dados.", "error");
      return false;
    }
  }

  /* =========================================================
     SEGURANÇA
  ========================================================= */

  function escapeHTML(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  /* =========================================================
     DATA
  ========================================================= */

  function formatDate(date) {
    if (!date) return "";

    const parts = String(date).split("-");

    if (parts.length !== 3) {
      return escapeHTML(date);
    }

    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }

  /* =========================================================
     RENDER
  ========================================================= */

  function getFilteredItems() {
    const search = (searchInput?.value || "")
      .trim()
      .toLowerCase();

    const status = statusFilter?.value || "all";

    return items
      .filter((item) => {
        const matchesSearch =
          !search ||
          String(item.title || "")
            .toLowerCase()
            .includes(search) ||
          String(item.category || "")
            .toLowerCase()
            .includes(search) ||
          String(item.summary || "")
            .toLowerCase()
            .includes(search);

        let matchesStatus = true;

        if (status === "published") {
          matchesStatus = item.published === true;
        }

        if (status === "draft") {
          matchesStatus = item.published !== true;
        }

        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        const dateA = new Date(
          a.updatedAt || a.createdAt || 0
        ).getTime();

        const dateB = new Date(
          b.updatedAt || b.createdAt || 0
        ).getTime();

        return dateB - dateA;
      });
  }

  function render() {
    if (!listEl) return;

    const filtered = getFilteredItems();

    if (totalEl) {
      totalEl.textContent = filtered.length;
    }

    if (!filtered.length) {
      listEl.innerHTML = `
        <div class="editorial-empty">
          <div class="empty-icon">📰</div>
          <h3>Nenhuma ${escapeHTML(config.singular)} encontrada</h3>
          <p>
            ${
              items.length
                ? "Tente alterar a pesquisa ou o filtro."
                : `Clique em "+ Nova ${escapeHTML(
                    config.singular
                  )}" para começar.`
            }
          </p>
        </div>
      `;

      return;
    }

    listEl.innerHTML = filtered
      .map(createItemHTML)
      .join("");
  }

  function createItemHTML(item) {
    const image = item.image
      ? `
        <img
          class="editorial-image"
          src="${escapeHTML(item.image)}"
          alt="${escapeHTML(item.title)}"
        >
      `
      : `
        <div class="editorial-placeholder">
          📰
        </div>
      `;

    const status = item.published
      ? `
        <span class="content-status published">
          Publicado
        </span>
      `
      : `
        <span class="content-status draft">
          Rascunho
        </span>
      `;

    return `
      <article class="editorial-item">

        <div class="editorial-media">
          ${image}
        </div>

        <div class="editorial-main">

          <div class="editorial-meta">
            ${
              item.category
                ? `<span>${escapeHTML(item.category)}</span>`
                : ""
            }

            ${
              item.date
                ? `<span>${formatDate(item.date)}</span>`
                : ""
            }

            ${status}
          </div>

          <h3>
            ${escapeHTML(item.title || "Sem título")}
          </h3>

          <p>
            ${escapeHTML(item.summary || "")}
          </p>

          <div class="editorial-actions">

            <button
              type="button"
              class="icon-button edit-button"
              data-action="edit"
              data-id="${escapeHTML(item.id)}"
            >
              ✏️ Editar
            </button>

            <button
              type="button"
              class="icon-button delete-button"
              data-action="delete"
              data-id="${escapeHTML(item.id)}"
            >
              🗑️ Excluir
            </button>

          </div>

        </div>

      </article>
    `;
  }

  /* =========================================================
     MODAL
  ========================================================= */

  function openModal() {
    if (!modal) return;

    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");

    setTimeout(() => {
      titleInput?.focus();
    }, 100);
  }

  function closeModal() {
    if (!modal) return;

    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");

    resetForm();
  }

  function resetForm() {
    form?.reset();

    if (idInput) {
      idInput.value = "";
    }

    if (publishedInput) {
      publishedInput.checked = true;
    }

    const title = document.querySelector("#newsModalTitle");

    if (title) {
      title.textContent = `Nova ${config.singular}`;
    }
  }

  /* =========================================================
     NOVO
  ========================================================= */

  function openCreate() {
    resetForm();
    openModal();
  }

  /* =========================================================
     EDITAR
  ========================================================= */

  function openEdit(id) {
    const item = items.find(
      (entry) => String(entry.id) === String(id)
    );

    if (!item) {
      showToast("Conteúdo não encontrado.", "error");
      return;
    }

    if (idInput) idInput.value = item.id || "";
    if (titleInput) titleInput.value = item.title || "";
    if (categoryInput) categoryInput.value = item.category || "";
    if (dateInput) dateInput.value = item.date || "";
    if (imageInput) imageInput.value = item.image || "";
    if (summaryInput) summaryInput.value = item.summary || "";

    if (publishedInput) {
      publishedInput.checked = item.published === true;
    }

    const title = document.querySelector("#newsModalTitle");

    if (title) {
      title.textContent = `Editar ${config.singular}`;
    }

    openModal();
  }

  /* =========================================================
     SALVAR
  ========================================================= */

  function handleSubmit(event) {
    event.preventDefault();

    const title = titleInput?.value.trim() || "";

    if (!title) {
      showToast(
        `Digite o título da ${config.singular}.`,
        "error"
      );

      titleInput?.focus();
      return;
    }

    const existingId = idInput?.value.trim() || "";

    const now = new Date().toISOString();

    const data = {
      id: existingId || createId(),
      title,
      category: categoryInput?.value.trim() || "",
      date: dateInput?.value || "",
      image: imageInput?.value.trim() || "",
      summary: summaryInput?.value.trim() || "",
      published: publishedInput
        ? publishedInput.checked
        : true,
      updatedAt: now
    };

    if (existingId) {
      const index = items.findIndex(
        (item) =>
          String(item.id) === String(existingId)
      );

      if (index === -1) {
        showToast(
          "O conteúdo não foi encontrado.",
          "error"
        );
        return;
      }

      data.createdAt =
        items[index].createdAt || now;

      items[index] = data;

      if (!saveItems()) return;

      showToast(
        `${capitalize(config.singular)} atualizada com sucesso.`
      );
    } else {
      data.createdAt = now;

      items.unshift(data);

      if (!saveItems()) return;

      showToast(
        `${capitalize(config.singular)} criada com sucesso.`
      );
    }

    closeModal();
    render();

    notifyOtherPages();
  }

  /* =========================================================
     EXCLUIR
  ========================================================= */

  function deleteItem(id) {
    const item = items.find(
      (entry) => String(entry.id) === String(id)
    );

    if (!item) {
      showToast("Conteúdo não encontrado.", "error");
      return;
    }

    const confirmed = window.confirm(
      `Excluir esta ${config.singular}?\n\n"${item.title}"`
    );

    if (!confirmed) return;

    items = items.filter(
      (entry) =>
        String(entry.id) !== String(id)
    );

    if (!saveItems()) return;

    render();

    showToast(
      `${capitalize(config.singular)} excluída.`
    );

    notifyOtherPages();
  }

  /* =========================================================
     ID
  ========================================================= */

  function createId() {
    if (
      window.crypto &&
      typeof window.crypto.randomUUID === "function"
    ) {
      return window.crypto.randomUUID();
    }

    return (
      Date.now().toString(36) +
      Math.random()
        .toString(36)
        .substring(2, 10)
    );
  }

  /* =========================================================
     TOAST
  ========================================================= */

  function showToast(message, type = "success") {
    let toast = document.querySelector(
      ".toast-message"
    );

    if (!toast) {
      toast = document.createElement("div");

      toast.className = "toast-message";

      document.body.appendChild(toast);
    }

    toast.textContent = message;

    toast.classList.remove(
      "success",
      "error",
      "show"
    );

    toast.classList.add(type);

    requestAnimationFrame(() => {
      toast.classList.add("show");
    });

    clearTimeout(
      toast._timeout
    );

    toast._timeout = setTimeout(() => {
      toast.classList.remove("show");
    }, 3000);
  }

  /* =========================================================
     CAPITALIZE
  ========================================================= */

  function capitalize(value) {
    if (!value) return "";

    return (
      value.charAt(0).toUpperCase() +
      value.slice(1)
    );
  }

  /* =========================================================
     EVENTOS DA LISTA
  ========================================================= */

  function handleListClick(event) {
    const button =
      event.target.closest("[data-action]");

    if (!button) return;

    const action =
      button.dataset.action;

    const id =
      button.dataset.id;

    if (action === "edit") {
      openEdit(id);
    }

    if (action === "delete") {
      deleteItem(id);
    }
  }

  /* =========================================================
     MENU MOBILE
  ========================================================= */

  function setupMobileMenu() {
    const menuBtn =
      document.querySelector("#menuBtn");

    const sidebar =
      document.querySelector("#sidebar");

    const overlay =
      document.querySelector("#overlay");

    if (!menuBtn || !sidebar) return;

    function toggleMenu() {
      sidebar.classList.toggle("open");

      overlay?.classList.toggle("open");

      document.body.classList.toggle(
        "menu-open"
      );
    }

    function closeMenu() {
      sidebar.classList.remove("open");

      overlay?.classList.remove("open");

      document.body.classList.remove(
        "menu-open"
      );
    }

    menuBtn.addEventListener(
      "click",
      toggleMenu
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
  }

  /* =========================================================
     SINCRONIZAÇÃO
  ========================================================= */

  function notifyOtherPages() {
    window.dispatchEvent(
      new Event("ntp-content-updated")
    );
  }

  window.addEventListener(
    "storage",
    (event) => {
      if (event.key === config.key) {
        loadItems();
        render();
      }
    }
  );

  /* =========================================================
     INICIALIZAÇÃO
  ========================================================= */

  function init() {
    loadItems();

    render();

    newBtn?.addEventListener(
      "click",
      openCreate
    );

    closeBtn?.addEventListener(
      "click",
      closeModal
    );

    cancelBtn?.addEventListener(
      "click",
      closeModal
    );

    form?.addEventListener(
      "submit",
      handleSubmit
    );

    listEl?.addEventListener(
      "click",
      handleListClick
    );

    searchInput?.addEventListener(
      "input",
      render
    );

    statusFilter?.addEventListener(
      "change",
      render
    );

    modal?.addEventListener(
      "click",
      (event) => {
        if (
          event.target === modal
        ) {
          closeModal();
        }
      }
    );

    document.addEventListener(
      "keydown",
      (event) => {
        if (
          event.key === "Escape"
        ) {
          closeModal();
        }
      }
    );

    setupMobileMenu();

    console.log(
      `NTP RADIO OS: ${config.title} carregado.`
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
