(() => {

  "use strict";

  const NEWS_KEY = "ntp_radio_noticias";
  const PROMOTIONS_KEY = "ntp_radio_promocoes";
  const EVENTS_KEY = "ntp_radio_eventos";
  const PROGRAMS_KEY = "ntp_radio_programacao";


  function load(key) {

    try {

      const data =
        JSON.parse(
          localStorage.getItem(key) || "[]"
        );

      return Array.isArray(data)
        ? data
        : [];

    } catch {

      return [];

    }

  }


  function count(key) {

    return load(key).length;

  }


  function activeCount(key) {

    return load(key)
      .filter(
        item => item && item.published !== false
      ).length;

  }


  function programActiveCount() {

    return load(PROGRAMS_KEY)
      .filter(
        item => item && item.active !== false
      ).length;

  }


  function setText(id, value) {

    const element =
      document.getElementById(id);

    if (element) {
      element.textContent = value;
    }

  }


  function renderMetrics() {

    setText(
      "newsCount",
      count(NEWS_KEY)
    );

    setText(
      "promoCount",
      count(PROMOTIONS_KEY)
    );

    setText(
      "eventCount",
      count(EVENTS_KEY)
    );

    setText(
      "programCount",
      programActiveCount()
    );

  }


  function renderRecentContent() {

    const container =
      document.getElementById(
        "recentNews"
      );

    if (!container) return;


    const news =
      load(NEWS_KEY)
        .filter(
          item =>
            item &&
            item.published !== false
        )
        .sort(
          (a, b) =>
            new Date(
              b.updatedAt ||
              b.createdAt ||
              b.date ||
              0
            ) -
            new Date(
              a.updatedAt ||
              a.createdAt ||
              a.date ||
              0
            )
        )
        .slice(0, 5);


    if (!news.length) {

      container.innerHTML = `
        <div class="empty-state">
          <strong>Nenhuma notícia publicada</strong>
          <span>
            As notícias criadas aparecerão aqui.
          </span>
        </div>
      `;

      return;

    }


    container.innerHTML =
      news.map(item => `

        <article class="recent-item">

          <div class="recent-item-icon">
            📰
          </div>

          <div class="recent-item-content">

            <strong>
              ${escapeHTML(item.title || "Sem título")}
            </strong>

            <span>
              ${
                item.category
                  ? escapeHTML(item.category)
                  : "Notícia"
              }
            </span>

          </div>

        </article>

      `).join("");

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


  function refresh() {

    renderMetrics();
    renderRecentContent();

  }


  /* =======================================================
     ATUALIZAÇÃO AUTOMÁTICA
     ======================================================= */

  window.addEventListener(
    "storage",
    event => {

      if (
        [
          NEWS_KEY,
          PROMOTIONS_KEY,
          EVENTS_KEY,
          PROGRAMS_KEY
        ].includes(event.key)
      ) {

        refresh();

      }

    }
  );


  window.addEventListener(
    "ntp-content-updated",
    refresh
  );


  window.addEventListener(
    "ntp-programacao-updated",
    refresh
  );


  /* =======================================================
     MENU MOBILE
     ======================================================= */

  const menuButton =
    document.getElementById(
      "menuBtn"
    );

  const sidebar =
    document.getElementById(
      "sidebar"
    );

  const overlay =
    document.getElementById(
      "overlay"
    );


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

  refresh();

})();
