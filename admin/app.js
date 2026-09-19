const STORAGE = {
  news: "ntp_radio_noticias",
  promotions: "ntp_radio_promocoes",
  programs: "ntp_radio_programacao"
};


function getData(key) {
  try {
    const data = JSON.parse(
      localStorage.getItem(key) || "[]"
    );

    return Array.isArray(data) ? data : [];

  } catch (error) {

    console.error(
      "Erro ao carregar:",
      key,
      error
    );

    return [];
  }
}


function updateDashboard() {

  const noticias = getData(STORAGE.news);

  const promocoes = getData(
    STORAGE.promotions
  );

  const programas = getData(
    STORAGE.programs
  );


  const newsCount =
    document.getElementById("newsCount");

  const promoCount =
    document.getElementById("promoCount");

  const programCount =
    document.getElementById("programCount");


  if (newsCount) {
    newsCount.textContent =
      noticias.length;
  }


  if (promoCount) {
    promoCount.textContent =
      promocoes.length;
  }


  if (programCount) {

    const ativos =
      programas.filter(
        item => item.active !== false
      );

    programCount.textContent =
      ativos.length;
  }


  renderRecentNews(noticias);
}


function renderRecentNews(noticias) {

  const container =
    document.getElementById(
      "recentNews"
    );

  if (!container) return;


  if (!noticias.length) {

    container.innerHTML = `
      <div class="empty-state">

        <div class="empty-icon">
          ▤
        </div>

        <strong>
          Nenhuma notícia cadastrada
        </strong>

        <span>
          As notícias criadas no painel aparecerão aqui.
        </span>

        <a
          href="noticias.html"
          class="button button-secondary"
        >
          Criar primeira notícia
        </a>

      </div>
    `;

    return;
  }


  const recentes =
    [...noticias]
      .reverse()
      .slice(0, 5);


  container.innerHTML =
    recentes.map((noticia) => {

      const titulo =
        escapeHTML(
          noticia.title ||
          noticia.name ||
          "Sem título"
        );


      const resumo =
        escapeHTML(
          noticia.summary ||
          noticia.description ||
          "Sem descrição"
        );


      return `
        <div class="recent-item">

          <div class="recent-thumb">
            ${noticia.image
              ? `<img
                   src="${escapeAttribute(
                     noticia.image
                   )}"
                   alt=""
                 >`
              : "N"
            }
          </div>

          <div class="recent-content">

            <strong>
              ${titulo}
            </strong>

            <span>
              ${resumo}
            </span>

          </div>

          <span class="recent-status">
            Publicado
          </span>

        </div>
      `;

    }).join("");
}


function escapeHTML(value) {

  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


function escapeAttribute(value) {

  return escapeHTML(value);
}


/* MENU MOBILE */

const menuBtn =
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


function openMenu() {

  if (sidebar) {
    sidebar.classList.add(
      "open"
    );
  }

  if (overlay) {
    overlay.classList.add(
      "show"
    );
  }

  document.body.classList.add(
    "menu-open"
  );
}


function closeMenu() {

  if (sidebar) {
    sidebar.classList.remove(
      "open"
    );
  }

  if (overlay) {
    overlay.classList.remove(
      "show"
    );
  }

  document.body.classList.remove(
    "menu-open"
  );
}


if (menuBtn) {

  menuBtn.addEventListener(
    "click",
    openMenu
  );
}


if (overlay) {

  overlay.addEventListener(
    "click",
    closeMenu
  );
}


document
  .querySelectorAll(".nav-link")
  .forEach(link => {

    link.addEventListener(
      "click",
      () => {

        if (
          window.innerWidth <= 900
        ) {
          closeMenu();
        }

      }
    );

  });


/* SAIR */

const logoutBtn =
  document.getElementById(
    "logoutBtn"
  );


if (logoutBtn) {

  logoutBtn.addEventListener(
    "click",
    event => {

      event.preventDefault();

      localStorage.removeItem(
        "ntp_admin_session"
      );

      window.location.href =
        "login.html";

    }
  );

}


/* ATUALIZAÇÃO */

document.addEventListener(
  "DOMContentLoaded",
  updateDashboard
);


window.addEventListener(
  "pageshow",
  updateDashboard
);


window.addEventListener(
  "storage",
  updateDashboard
);


console.log(
  "NTP RADIO OS — Dashboard carregado"
);
