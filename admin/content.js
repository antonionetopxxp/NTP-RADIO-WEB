/* =========================================================
   NTP RADIO OS
   GERENCIADOR DE CONTEÚDO
   Notícias / Eventos / Promoções
   ========================================================= */

(() => {

  "use strict";

  const CONTENT_TYPE =
    window.NTP_CONTENT_TYPE || "news";

  const CONFIG = {

    news: {
      key: "ntp_radio_noticias",
      title: "Notícias",
      singular: "notícia"
    },

    events: {
      key: "ntp_radio_eventos",
      title: "Eventos",
      singular: "evento"
    },

    promotions: {
      key: "ntp_radio_promocoes",
      title: "Promoções",
      singular: "promoção"
    }

  };

  const current =
    CONFIG[CONTENT_TYPE] || CONFIG.news;


  /* =======================================================
     ELEMENTOS
     ======================================================= */

  const form =
    document.getElementById(
      CONTENT_TYPE === "news"
        ? "newsForm"
        : CONTENT_TYPE === "events"
        ? "eventForm"
        : "promotionForm"
    );

  const list =
    document.getElementById(
      CONTENT_TYPE === "news"
        ? "newsList"
        : CONTENT_TYPE === "events"
        ? "eventList"
        : "promotionList"
    );

  const total =
    document.getElementById(
      CONTENT_TYPE === "news"
        ? "newsTotal"
        : CONTENT_TYPE === "events"
        ? "eventTotal"
        : "promotionTotal"
    );


  /* =======================================================
     HELPERS
     ======================================================= */

  function $(id) {
    return document.getElementById(id);
  }


  function uid() {

    return (
      Date.now().toString(36) +
      Math.random()
        .toString(36)
        .substring(2, 8)
    );

  }


  function escapeHTML(value = "") {

    return String(value).replace(
      /[&<>"']/g,
      character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
      })[character]
    );

  }


  function loadItems() {

    try {

      const raw =
        localStorage.getItem(current.key);

      if (!raw) return [];

      const data =
        JSON.parse(raw);

      return Array.isArray(data)
        ? data
        : [];

    } catch (error) {

      console.error(
        "Erro ao carregar conteúdo:",
        error
      );

      return [];

    }

  }


  function saveItems(items) {

    localStorage.setItem(
      current.key,
      JSON.stringify(items)
    );

    window.dispatchEvent(
      new CustomEvent(
        "ntp-content-updated",
        {
          detail: {
            type: CONTENT_TYPE
          }
        }
      )
    );

  }


  function showNotice(
    message,
    type = "success"
  ) {

    const notice =
      $(
        CONTENT_TYPE === "news"
          ? "newsNotice"
          : CONTENT_TYPE === "events"
          ? "eventNotice"
          : "promotionNotice"
      );

    if (!notice) return;

    notice.textContent = message;

    notice.style.display = "block";

    notice.style.background =
      type === "error"
        ? "rgba(255,92,112,.12)"
        : "rgba(50,213,131,.12)";

    notice.style.color =
      type === "error"
        ? "#ff7585"
        : "#32d583";

    notice.style.border =
      type === "error"
        ? "1px solid rgba(255,92,112,.25)"
        : "1px solid rgba(50,213,131,.25)";

    clearTimeout(
      notice._timer
    );

    notice._timer =
      setTimeout(() => {

        notice.style.display =
          "none";

      }, 3500);

  }


  /* =======================================================
     FORMULÁRIO
     ======================================================= */

  function resetForm() {

    if (!form) return;

    form.reset();

    const idField =
      CONTENT_TYPE === "news"
        ? $("newsId")
        : CONTENT_TYPE === "events"
        ? $("eventId")
        : $("promotionId");

    if (idField) {
      idField.value = "";
    }

    if (CONTENT_TYPE === "news") {

      const published =
        $("newsPublished");

      if (published) {
        published.checked = true;
      }

    }

    if (CONTENT_TYPE === "events") {

      const published =
        $("eventPublished");

      if (published) {
        published.checked = true;
      }

    }

    if (CONTENT_TYPE === "promotions") {

      const published =
        $("promotionPublished");

      if (published) {
        published.checked = true;
      }

    }

  }


  function fillForm(item) {

    if (!item || !form) return;

    if (CONTENT_TYPE === "news") {

      $("newsId").value =
        item.id || "";

      $("newsTitle").value =
        item.title || "";

      $("newsCategory").value =
        item.category || "";

      $("newsDate").value =
        item.date || "";

      $("newsImage").value =
        item.image || "";

      $("newsSummary").value =
        item.summary || "";

      $("newsPublished").checked =
        item.published !== false;

    }


    if (CONTENT_TYPE === "events") {

      $("eventId").value =
        item.id || "";

      $("eventTitle").value =
        item.title || "";

      $("eventDate").value =
        item.date || "";

      $("eventTime").value =
        item.time || "";

      $("eventLocation").value =
        item.location || "";

      $("eventImage").value =
        item.image || "";

      $("eventDescription").value =
        item.description || "";

      $("eventPublished").checked =
        item.published !== false;

    }


    if (CONTENT_TYPE === "promotions") {

      $("promotionId").value =
        item.id || "";

      $("promotionTitle").value =
        item.title || "";

      $("promotionDate").value =
        item.date || "";

      $("promotionImage").value =
        item.image || "";

      $("promotionDescription").value =
        item.description || "";

      $("promotionPrize").value =
        item.prize || "";

      $("promotionPublished").checked =
        item.published !== false;

    }

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });

  }


  /* =======================================================
     CRIAR OBJETO
     ======================================================= */

  function getFormData() {

    const now =
      new Date().toISOString();


    if (CONTENT_TYPE === "news") {

      return {

        title:
          $("newsTitle").value.trim(),

        category:
          $("newsCategory").value.trim(),

        date:
          $("newsDate").value,

        image:
          $("newsImage").value.trim(),

        summary:
          $("newsSummary").value.trim(),

        published:
          $("newsPublished").checked,

        updatedAt:
          now

      };

    }


    if (CONTENT_TYPE === "events") {

      return {

        title:
          $("eventTitle").value.trim(),

        date:
          $("eventDate").value,

        time:
          $("eventTime").value,

        location:
          $("eventLocation").value.trim(),

        image:
          $("eventImage").value.trim(),

        description:
          $("eventDescription").value.trim(),

        published:
          $("eventPublished").checked,

        updatedAt:
          now

      };

    }


    return {

      title:
        $("promotionTitle").value.trim(),

      date:
        $("promotionDate").value,

      image:
        $("promotionImage").value.trim(),

      description:
        $("promotionDescription").value.trim(),

      prize:
        $("promotionPrize").value.trim(),

      published:
        $("promotionPublished").checked,

      updatedAt:
        now

    };

  }


  /* =======================================================
     VALIDAÇÃO
     ======================================================= */

  function validate(data) {

    if (!data.title) {

      showNotice(
        `Digite o título da ${current.singular}.`,
        "error"
      );

      return false;

    }

    return true;

  }


  /* =======================================================
     SALVAR
     ======================================================= */

  function handleSubmit(event) {

    event.preventDefault();

    const data =
      getFormData();

    if (!validate(data)) {
      return;
    }

    const items =
      loadItems();

    const idField =
      CONTENT_TYPE === "news"
        ? $("newsId")
        : CONTENT_TYPE === "events"
        ? $("eventId")
        : $("promotionId");

    const editingId =
      idField
        ? idField.value.trim()
        : "";

    if (editingId) {

      const index =
        items.findIndex(
          item =>
            item.id === editingId
        );

      if (index !== -1) {

        items[index] = {
          ...items[index],
          ...data,
          id: editingId
        };

      }

      saveItems(items);

      showNotice(
        `${current.singular} atualizada com sucesso.`
      );

    } else {

      const newItem = {

        id: uid(),

        ...data,

        createdAt:
          new Date().toISOString()

      };

      items.unshift(newItem);

      saveItems(items);

      showNotice(
        `${current.singular} criada com sucesso.`
      );

    }

    resetForm();

    render();

  }


  /* =======================================================
     EDITAR
     ======================================================= */

  function editItem(id) {

    const items =
      loadItems();

    const item =
      items.find(
        entry => entry.id === id
      );

    if (!item) return;

    fillForm(item);

  }


  /* =======================================================
     PUBLICAR / DESPUBLICAR
     ======================================================= */

  function togglePublished(id) {

    const items =
      loadItems();

    const index =
      items.findIndex(
        item => item.id === id
      );

    if (index === -1) return;

    items[index].published =
      items[index].published === false;

    items[index].updatedAt =
      new Date().toISOString();

    saveItems(items);

    render();

  }


  /* =======================================================
     EXCLUIR
     ======================================================= */

  function deleteItem(id) {

    const items =
      loadItems();

    const item =
      items.find(
        entry => entry.id === id
      );

    if (!item) return;

    const confirmed =
      window.confirm(
        `Excluir esta ${current.singular}?\n\nEsta ação não pode ser desfeita.`
      );

    if (!confirmed) return;

    const filtered =
      items.filter(
        entry => entry.id !== id
      );

    saveItems(filtered);

    showNotice(
      `${current.singular} excluída com sucesso.`
    );

    render();

  }


  /* =======================================================
     DATA FORMAT
     ======================================================= */

  function formatDate(value) {

    if (!value) return "";

    const date =
      new Date(
        value + "T00:00:00"
      );

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleDateString(
      "pt-BR"
    );

  }


  /* =======================================================
     RENDER NOTÍCIAS
     ======================================================= */

  function renderNews(items) {

    if (!list) return;

    if (!items.length) {

      list.innerHTML = `
        <div class="empty-state">
          <strong>Nenhuma notícia cadastrada</strong>
          <span>Crie sua primeira notícia.</span>
        </div>
      `;

      return;

    }

    list.innerHTML =
      items.map(item => {

        const status =
          item.published !== false;

        return `

          <article class="content-item">

            <div class="content-main">

              ${
                item.image
                  ? `
                    <img
                      class="content-thumb"
                      src="${escapeHTML(item.image)}"
                      alt=""
                      loading="lazy"
                    >
                  `
                  : ""
              }

              <div>

                <div class="content-title">
                  ${escapeHTML(item.title)}
                </div>

                <div class="content-meta">

                  ${
                    item.category
                      ? escapeHTML(item.category) + " · "
                      : ""
                  }

                  ${
                    formatDate(item.date)
                  }

                </div>

                ${
                  item.summary
                    ? `
                      <div class="content-description">
                        ${escapeHTML(item.summary)}
                      </div>
                    `
                    : ""
                }

                <span
                  class="content-status ${
                    status
                      ? "published"
                      : "draft"
                  }"
                >
                  ${
                    status
                      ? "PUBLICADA"
                      : "DESATIVADA"
                  }
                </span>

              </div>

            </div>

            <div class="editorial-actions">

              <button
                class="icon-button"
                type="button"
                data-action="edit"
                data-id="${escapeHTML(item.id)}"
                title="Editar"
              >
                ✏️
              </button>

              <button
                class="icon-button"
                type="button"
                data-action="toggle"
                data-id="${escapeHTML(item.id)}"
                title="${
                  status
                    ? "Desativar"
                    : "Publicar"
                }"
              >
                ${
                  status
                    ? "⏸️"
                    : "▶️"
                }
              </button>

              <button
                class="icon-button danger"
                type="button"
                data-action="delete"
                data-id="${escapeHTML(item.id)}"
                title="Excluir"
              >
                🗑️
              </button>

            </div>

          </article>

        `;

      }).join("");

  }


  /* =======================================================
     RENDER EVENTOS
     ======================================================= */

  function renderEvents(items) {

    if (!list) return;

    if (!items.length) {

      list.innerHTML = `
        <div class="event-empty">
          Nenhum evento cadastrado.
        </div>
      `;

      return;

    }

    list.innerHTML =
      items.map(item => {

        const status =
          item.published !== false;

        const date =
          formatDate(item.date);

        return `

          <article class="event-card">

            <div>

              <div class="event-title">
                ${escapeHTML(item.title)}
              </div>

              <div class="event-meta">

                ${
                  date
                    ? "📅 " + escapeHTML(date)
                    : ""
                }

                ${
                  item.time
                    ? " · 🕐 " +
                      escapeHTML(item.time)
                    : ""
                }

                ${
                  item.location
                    ? " · 📍 " +
                      escapeHTML(item.location)
                    : ""
                }

              </div>

              ${
                item.description
                  ? `
                    <div class="event-description">
                      ${escapeHTML(item.description)}
                    </div>
                  `
                  : ""
              }

              <span
                class="event-status ${
                  status
                    ? "active"
                    : "inactive"
                }"
              >
                ${
                  status
                    ? "PUBLICADO"
                    : "DESATIVADO"
                }
              </span>

            </div>

            <div class="event-actions">

              <button
                class="btn btn-ghost"
                type="button"
                data-action="edit"
                data-id="${escapeHTML(item.id)}"
              >
                ✏️ Editar
              </button>

              <button
                class="btn btn-ghost"
                type="button"
                data-action="toggle"
                data-id="${escapeHTML(item.id)}"
              >
                ${
                  status
                    ? "⏸️ Desativar"
                    : "▶️ Ativar"
                }
              </button>

              <button
                class="btn btn-ghost"
                type="button"
                data-action="delete"
                data-id="${escapeHTML(item.id)}"
              >
                🗑️ Excluir
              </button>

            </div>

          </article>

        `;

      }).join("");

  }


  /* =======================================================
     RENDER PROMOÇÕES
     ======================================================= */

  function renderPromotions(items) {

    if (!list) return;

    if (!items.length) {

      list.innerHTML = `
        <div class="promotion-empty">
          Nenhuma promoção cadastrada.
        </div>
      `;

      return;

    }

    list.innerHTML =
      items.map(item => {

        const status =
          item.published !== false;

        return `

          <article class="promotion-card">

            <div>

              <div class="promotion-title">
                ${escapeHTML(item.title)}
              </div>

              <div class="promotion-meta">

                ${
                  item.date
                    ? "📅 Até " +
                      escapeHTML(
                        formatDate(item.date)
                      )
                    : ""
                }

                ${
                  item.prize
                    ? " · 🏆 " +
                      escapeHTML(item.prize)
                    : ""
                }

              </div>

              ${
                item.description
                  ? `
                    <div class="promotion-description">
                      ${escapeHTML(item.description)}
                    </div>
                  `
                  : ""
              }

              <span
                class="promotion-status ${
                  status
                    ? "active"
                    : "inactive"
                }"
              >
                ${
                  status
                    ? "PUBLICADA"
                    : "DESATIVADA"
                }
              </span>

            </div>

            <div class="promotion-actions">

              <button
                class="btn btn-ghost"
                type="button"
                data-action="edit"
                data-id="${escapeHTML(item.id)}"
              >
                ✏️ Editar
              </button>

              <button
                class="btn btn-ghost"
                type="button"
                data-action="toggle"
                data-id="${escapeHTML(item.id)}"
              >
                ${
                  status
                    ? "⏸️ Desativar"
                    : "▶️ Ativar"
                }
              </button>

              <button
                class="btn btn-ghost"
                type="button"
                data-action="delete"
                data-id="${escapeHTML(item.id)}"
              >
                🗑️ Excluir
              </button>

            </div>

          </article>

        `;

      }).join("");

  }


  /* =======================================================
     RENDER
     ======================================================= */

  function render() {

    const items =
      loadItems();

    if (total) {
      total.textContent =
        items.length;
    }

    if (CONTENT_TYPE === "news") {

      renderNews(items);

      return;

    }

    if (CONTENT_TYPE === "events") {

      renderEvents(items);

      return;

    }

    renderPromotions(items);

  }


  /* =======================================================
     BOTÕES
     ======================================================= */

  function bindButtons() {

    if (list) {

      list.addEventListener(
        "click",
        event => {

          const button =
            event.target.closest(
              "[data-action]"
            );

          if (!button) return;

          const action =
            button.dataset.action;

          const id =
            button.dataset.id;

          if (!id) return;

          if (action === "edit") {
            editItem(id);
          }

          if (action === "toggle") {
            togglePublished(id);
          }

          if (action === "delete") {
            deleteItem(id);
          }

        }
      );

    }


    const newButton =
      $(
        CONTENT_TYPE === "news"
          ? "newNewsBtn"
          : CONTENT_TYPE === "events"
          ? "newEventBtn"
          : "newPromotionBtn"
      );

    if (newButton) {

      newButton.addEventListener(
        "click",
        () => {

          resetForm();

          window.scrollTo({
            top: 0,
            behavior: "smooth"
          });

        }
      );

    }


    const cancelButton =
      $(
        CONTENT_TYPE === "news"
          ? "cancelNewsBtn"
          : CONTENT_TYPE === "events"
          ? "cancelEventBtn"
          : "cancelPromotionBtn"
      );

    if (cancelButton) {

      cancelButton.addEventListener(
        "click",
        resetForm
      );

    }

  }


  /* =======================================================
     FORM
     ======================================================= */

  if (form) {

    form.addEventListener(
      "submit",
      handleSubmit
    );

  }


  /* =======================================================
     PESQUISA DE NOTÍCIAS
     ======================================================= */

  if (CONTENT_TYPE === "news") {

    const search =
      $("searchInput");

    const statusFilter =
      $("statusFilter");

    function filterNews() {

      let items =
        loadItems();

      const term =
        search
          ? search.value
              .trim()
              .toLowerCase()
          : "";

      const status =
        statusFilter
          ? statusFilter.value
          : "all";

      if (term) {

        items =
          items.filter(item =>
            [
              item.title,
              item.category,
              item.summary
            ]
              .join(" ")
              .toLowerCase()
              .includes(term)
          );

      }

      if (status === "published") {

        items =
          items.filter(
            item =>
              item.published !== false
          );

      }

      if (status === "draft") {

        items =
          items.filter(
            item =>
              item.published === false
          );

      }

      renderNews(items);

    }


    if (search) {

      search.addEventListener(
        "input",
        filterNews
      );

    }


    if (statusFilter) {

      statusFilter.addEventListener(
        "change",
        filterNews
      );

    }

  }


  /* =======================================================
     SINCRONIZAÇÃO
     ======================================================= */

  window.addEventListener(
    "storage",
    event => {

      if (
        event.key === current.key
      ) {

        render();

      }

    }
  );


  window.addEventListener(
    "ntp-content-updated",
    event => {

      if (
        !event.detail ||
        event.detail.type === CONTENT_TYPE
      ) {

        render();

      }

    }
  );


  /* =======================================================
     MENU MOBILE
     ======================================================= */

  const menuButton =
    $("menuBtn");

  const sidebar =
    $("sidebar");

  const overlay =
    $("overlay");

  if (
    menuButton &&
    sidebar
  ) {

    menuButton.addEventListener(
      "click",
      () => {

        sidebar.classList.toggle(
          "open"
        );

        if (overlay) {

          overlay.classList.toggle(
            "active"
          );

        }

      }
    );

  }


  if (overlay) {

    overlay.addEventListener(
      "click",
      () => {

        sidebar.classList.remove(
          "open"
        );

        overlay.classList.remove(
          "active"
        );

      }
    );

  }


  /* =======================================================
     INICIALIZAÇÃO
     ======================================================= */

  bindButtons();

  render();

  console.log(
    `NTP RADIO OS: ${current.title} carregado.`
  );

})();
