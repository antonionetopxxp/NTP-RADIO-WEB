/* =========================================================
   NTP RÁDIO WEB
   PROGRAMAÇÃO PÚBLICA
========================================================= */

const PROGRAM_STORAGE_KEY =
  "ntp_radio_programacao";


const dayNames = {
  segunda: "Segunda-feira",
  terca: "Terça-feira",
  quarta: "Quarta-feira",
  quinta: "Quinta-feira",
  sexta: "Sexta-feira",
  sabado: "Sábado",
  domingo: "Domingo"
};


const dayOrder = [
  "segunda",
  "terca",
  "quarta",
  "quinta",
  "sexta",
  "sabado",
  "domingo"
];


function getPrograms() {

  try {

    const data =
      localStorage.getItem(
        PROGRAM_STORAGE_KEY
      );

    if (!data) {
      return [];
    }

    const programs =
      JSON.parse(data);

    if (!Array.isArray(programs)) {
      return [];
    }

    return programs;

  } catch (error) {

    console.error(
      "Erro ao carregar programação:",
      error
    );

    return [];

  }

}


function sortPrograms(programs) {

  return [...programs].sort((a, b) => {

    const dayA =
      dayOrder.indexOf(a.day);

    const dayB =
      dayOrder.indexOf(b.day);


    if (dayA !== dayB) {
      return dayA - dayB;
    }


    return String(a.startTime)
      .localeCompare(
        String(b.startTime)
      );

  });

}


function escapeHTML(value) {

  if (!value) {
    return "";
  }

  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

}


function renderPublicSchedule() {

  const container =
    document.getElementById(
      "scheduleGrid"
    );


  if (!container) {
    return;
  }


  const programs =
    sortPrograms(
      getPrograms()
        .filter(program =>
          program.active !== false
        )
    );


  /* =========================
     NENHUM PROGRAMA
  ========================= */

  if (!programs.length) {

    container.innerHTML = `

      <div class="schedule-empty">

        <div class="schedule-empty-icon">
          📻
        </div>

        <h3>
          Programação em atualização
        </h3>

        <p>
          Em breve divulgaremos os
          horários dos programas da
          NTP RÁDIO WEB.
        </p>

      </div>

    `;

    return;

  }


  /* =========================
     PROGRAMAS
  ========================= */

  container.innerHTML =
    programs.map(program => {

      const day =
        dayNames[program.day] ||
        program.day ||
        "";


      return `

        <article class="schedule-card reveal">

          <span class="time">
            ${escapeHTML(
              program.startTime
            )}
          </span>


          <h3>
            ${escapeHTML(
              program.name
            )}
          </h3>


          <div class="schedule-day">
            📅 ${escapeHTML(day)}
          </div>


          ${
            program.presenter
              ? `
                <div class="schedule-presenter">
                  🎙️
                  ${escapeHTML(
                    program.presenter
                  )}
                </div>
              `
              : ""
          }


          ${
            program.description
              ? `
                <p>
                  ${escapeHTML(
                    program.description
                  )}
                </p>
              `
              : ""
          }


          <div class="schedule-time-range">

            🕐

            ${escapeHTML(
              program.startTime
            )}

            —

            ${escapeHTML(
              program.endTime
            )}

          </div>

        </article>

      `;

    }).join("");

}


/* =========================================================
   ATUALIZA AUTOMATICAMENTE
========================================================= */

renderPublicSchedule();


window.addEventListener(
  "storage",
  function(event) {

    if (
      event.key ===
      PROGRAM_STORAGE_KEY
    ) {

      renderPublicSchedule();

    }

  }
);


/*
   Caso o administrador seja alterado
   e a página pública seja aberta novamente,
   ela sempre busca os dados atuais.
*/

window.addEventListener(
  "pageshow",
  renderPublicSchedule
);
