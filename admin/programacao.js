<script>
  document
    .getElementById("logoutButton")
    .addEventListener("click", function () {

      sessionStorage.removeItem(
        "ntp_admin_logged"
      );

      window.location.href =
        "index.html";

    });
</script>

/* =========================================================
   NTP RADIO OS
   GERENCIADOR DE PROGRAMAÇÃO
========================================================= */

const STORAGE_KEY = "ntp_radio_programacao";

const dayNames = {
  segunda: "Segunda-feira",
  terca: "Terça-feira",
  quarta: "Quarta-feira",
  quinta: "Quinta-feira",
  sexta: "Sexta-feira",
  sabado: "Sábado",
  domingo: "Domingo"
};


/* =========================================================
   ELEMENTOS
========================================================= */

const form =
  document.getElementById("programForm");

const programId =
  document.getElementById("programId");

const programName =
  document.getElementById("programName");

const presenter =
  document.getElementById("presenter");

const day =
  document.getElementById("day");

const startTime =
  document.getElementById("startTime");

const endTime =
  document.getElementById("endTime");

const description =
  document.getElementById("description");

const active =
  document.getElementById("active");

const programList =
  document.getElementById("programList");

const formTitle =
  document.getElementById("formTitle");

const cancelEdit =
  document.getElementById("cancelEdit");

const notice =
  document.getElementById("notice");


/* =========================================================
   CARREGAR PROGRAMAS
========================================================= */

function getPrograms() {

  try {

    const saved =
      localStorage.getItem(
        STORAGE_KEY
      );

    if (!saved) {
      return [];
    }

    const programs =
      JSON.parse(saved);

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


/* =========================================================
   SALVAR PROGRAMAS
========================================================= */

function savePrograms(programs) {

  try {

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(programs)
    );

    return true;

  } catch (error) {

    console.error(
      "Erro ao salvar programação:",
      error
    );

    showNotice(
      "Não foi possível salvar. O armazenamento do navegador pode estar bloqueado.",
      "error"
    );

    return false;

  }

}


/* =========================================================
   ORDENAR
========================================================= */

const dayOrder = [
  "segunda",
  "terca",
  "quarta",
  "quinta",
  "sexta",
  "sabado",
  "domingo"
];


function sortPrograms(programs) {

  return [...programs].sort(
    (a, b) => {

      const dayA =
        dayOrder.indexOf(a.day);

      const dayB =
        dayOrder.indexOf(b.day);


      if (dayA !== dayB) {

        return dayA - dayB;

      }


      return String(
        a.startTime || ""
      ).localeCompare(
        String(
          b.startTime || ""
        )
      );

    }
  );

}


/* =========================================================
   SEGURANÇA HTML
========================================================= */

function escapeHTML(value) {

  return String(
    value ?? ""
  )
    .replace(
      /&/g,
      "&amp;"
    )
    .replace(
      /</g,
      "&lt;"
    )
    .replace(
      />/g,
      "&gt;"
    )
    .replace(
      /"/g,
      "&quot;"
    )
    .replace(
      /'/g,
      "&#039;"
    );

}


/* =========================================================
   AVISO
========================================================= */

function showNotice(
  message,
  type = "success"
) {

  if (!notice) {
    return;
  }


  notice.textContent =
    message;

  notice.style.display =
    "block";


  if (type === "error") {

    notice.style.color =
      "#ff8fae";

    notice.style.background =
      "rgba(255,80,120,.08)";

    notice.style.borderColor =
      "rgba(255,80,120,.25)";

  } else {

    notice.style.color =
      "#75efbe";

    notice.style.background =
      "rgba(41,227,154,.08)";

    notice.style.borderColor =
      "rgba(41,227,154,.25)";

  }


  clearTimeout(
    showNotice.timer
  );


  showNotice.timer =
    setTimeout(
      () => {

        notice.style.display =
          "none";

      },
      3500
    );

}


/* =========================================================
   LIMPAR FORMULÁRIO
========================================================= */

function clearForm() {

  form.reset();

  programId.value = "";

  active.checked = true;

  formTitle.textContent =
    "Novo programa";

  cancelEdit.style.display =
    "none";

}


/* =========================================================
   RENDERIZAR LISTA
========================================================= */

function renderPrograms() {

  const programs =
    sortPrograms(
      getPrograms()
    );


  if (!programs.length) {

    programList.innerHTML = `

      <div class="empty">

        <div class="empty-icon">
          📻
        </div>

        <strong>
          Nenhum programa cadastrado
        </strong>

        <p>
          Use o formulário ao lado
          para criar o primeiro programa.
        </p>

      </div>

    `;

    return;

  }


  programList.innerHTML =
    programs.map(
      program => {

        const dayName =
          dayNames[
            program.day
          ] ||
          program.day ||
          "Dia não informado";


        const statusClass =
          program.active !== false
            ? "active"
            : "inactive";


        const statusText =
          program.active !== false
            ? "ATIVO"
            : "INATIVO";


        return `

          <article
            class="program-card"
          >

            <div
              class="program-top"
            >

              <div>

                <div
                  class="program-name"
                >
                  ${escapeHTML(
                    program.name
                  )}
                </div>


                ${
                  program.presenter
                    ? `
                      <div
                        class="program-presenter"
                      >
                        🎙️
                        ${escapeHTML(
                          program.presenter
                        )}
                      </div>
                    `
                    : ""
                }

              </div>


              <span
                class="status ${statusClass}"
              >
                ${statusText}
              </span>

            </div>


            <div
              class="program-time"
            >

              🕐

              ${escapeHTML(
                program.startTime
              )}

              —

              ${escapeHTML(
                program.endTime
              )}

            </div>


            <span
              class="program-day"
            >
              📅
              ${escapeHTML(
                dayName
              )}
            </span>


            ${
              program.description
                ? `
                  <div
                    class="program-description"
                  >
                    ${escapeHTML(
                      program.description
                    )}
                  </div>
                `
                : ""
            }


            <div
              class="program-actions"
            >

              <button
                class="action-btn"
                data-action="edit"
                data-id="${program.id}"
              >
                ✏️ Editar
              </button>


              <button
                class="action-btn"
                data-action="toggle"
                data-id="${program.id}"
              >
                ${
                  program.active !== false
                    ? "⏸️ Desativar"
                    : "▶️ Ativar"
                }
              </button>


              <button
                class="action-btn delete"
                data-action="delete"
                data-id="${program.id}"
              >
                🗑️ Excluir
              </button>

            </div>

          </article>

        `;

      }
    ).join("");

}


/* =========================================================
   SALVAR NOVO / EDITAR
========================================================= */

form.addEventListener(
  "submit",
  function(event) {

    event.preventDefault();


    const name =
      programName.value.trim();

    const presenterValue =
      presenter.value.trim();

    const dayValue =
      day.value;

    const startValue =
      startTime.value;

    const endValue =
      endTime.value;

    const descriptionValue =
      description.value.trim();

    const activeValue =
      active.checked;


    /* =========================
       VALIDAÇÕES
    ========================= */

    if (!name) {

      showNotice(
        "Digite o nome do programa.",
        "error"
      );

      programName.focus();

      return;

    }


    if (!dayValue) {

      showNotice(
        "Selecione o dia da semana.",
        "error"
      );

      day.focus();

      return;

    }


    if (!startValue) {

      showNotice(
        "Informe o horário de início.",
        "error"
      );

      startTime.focus();

      return;

    }


    if (!endValue) {

      showNotice(
        "Informe o horário de término.",
        "error"
      );

      endTime.focus();

      return;

    }


    if (startValue >= endValue) {

      showNotice(
        "O horário de término deve ser depois do início.",
        "error"
      );

      endTime.focus();

      return;

    }


    let programs =
      getPrograms();


    /* =========================
       EDITAR
    ========================= */

    if (programId.value) {

      const index =
        programs.findIndex(
          program =>
            String(program.id) ===
            String(programId.value)
        );


      if (index === -1) {

        showNotice(
          "Programa não encontrado.",
          "error"
        );

        return;

      }


      programs[index] = {

        ...programs[index],

        name,

        presenter:
          presenterValue,

        day:
          dayValue,

        startTime:
          startValue,

        endTime:
          endValue,

        description:
          descriptionValue,

        active:
          activeValue

      };


      if (
        savePrograms(
          programs
        )
      ) {

        showNotice(
          "Programa atualizado com sucesso!"
        );

        clearForm();

        renderPrograms();

      }


      return;

    }


    /* =========================
       NOVO PROGRAMA
    ========================= */

    const newProgram = {

      id:
        Date.now().toString(),

      name,

      presenter:
        presenterValue,

      day:
        dayValue,

      startTime:
        startValue,

      endTime:
        endValue,

      description:
        descriptionValue,

      active:
        activeValue,

      createdAt:
        new Date().toISOString()

    };


    programs.push(
      newProgram
    );


    if (
      savePrograms(
        programs
      )
    ) {

      showNotice(
        "Programa salvo com sucesso! 🎉"
      );

      clearForm();

      renderPrograms();

    }

  }
);


/* =========================================================
   EDITAR
========================================================= */

function editProgram(id) {

  const programs =
    getPrograms();


  const program =
    programs.find(
      item =>
        String(item.id) ===
        String(id)
    );


  if (!program) {

    showNotice(
      "Programa não encontrado.",
      "error"
    );

    return;

  }


  programId.value =
    program.id;

  programName.value =
    program.name || "";

  presenter.value =
    program.presenter || "";

  day.value =
    program.day || "";

  startTime.value =
    program.startTime || "";

  endTime.value =
    program.endTime || "";

  description.value =
    program.description || "";

  active.checked =
    program.active !== false;


  formTitle.textContent =
    "Editar programa";


  cancelEdit.style.display =
    "block";


  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });

}


/* =========================================================
   ATIVAR / DESATIVAR
========================================================= */

function toggleProgram(id) {

  const programs =
    getPrograms();


  const index =
    programs.findIndex(
      program =>
        String(program.id) ===
        String(id)
    );


  if (index === -1) {
    return;
  }


  programs[index].active =
    programs[index].active === false;


  if (
    savePrograms(
      programs
    )
  ) {

    showNotice(
      programs[index].active
        ? "Programa ativado."
        : "Programa desativado."
    );

    renderPrograms();

  }

}


/* =========================================================
   EXCLUIR
========================================================= */

function deleteProgram(id) {

  const programs =
    getPrograms();


  const program =
    programs.find(
      item =>
        String(item.id) ===
        String(id)
    );


  if (!program) {
    return;
  }


  const confirmed =
    window.confirm(
      `Excluir o programa "${program.name}"?`
    );


  if (!confirmed) {
    return;
  }


  const updated =
    programs.filter(
      item =>
        String(item.id) !==
        String(id)
    );


  if (
    savePrograms(
      updated
    )
  ) {

    showNotice(
      "Programa excluído."
    );

    renderPrograms();

  }

}


/* =========================================================
   BOTÕES DA LISTA
========================================================= */

programList.addEventListener(
  "click",
  function(event) {

    const button =
      event.target.closest(
        "[data-action]"
      );


    if (!button) {
      return;
    }


    const action =
      button.dataset.action;

    const id =
      button.dataset.id;


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
);


/* =========================================================
   CANCELAR EDIÇÃO
========================================================= */

cancelEdit.addEventListener(
  "click",
  function() {

    clearForm();

  }
);


/* =========================================================
   INICIALIZAÇÃO
========================================================= */

renderPrograms();

console.log(
  "NTP RADIO OS - Gerenciador de Programação carregado."
);
