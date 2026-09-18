/* =========================================================
   NTP RADIO OS
   GERENCIADOR DE PROGRAMAÇÃO
   VERSÃO 3
========================================================= */


"use strict";


/* =========================================================
   CONFIGURAÇÃO
========================================================= */

const STORAGE_KEY =
  "ntp_radio_programacao";


/* =========================================================
   DIAS
========================================================= */

const DAY_NAMES = {

  segunda: "Segunda-feira",

  terca: "Terça-feira",

  quarta: "Quarta-feira",

  quinta: "Quinta-feira",

  sexta: "Sexta-feira",

  sabado: "Sábado",

  domingo: "Domingo"

};


const DAY_ORDER = [

  "segunda",
  "terca",
  "quarta",
  "quinta",
  "sexta",
  "sabado",
  "domingo"

];


/* =========================================================
   ELEMENTOS
========================================================= */

const form =
  document.getElementById(
    "programForm"
  );


const programId =
  document.getElementById(
    "programId"
  );


const programName =
  document.getElementById(
    "programName"
  );


const presenter =
  document.getElementById(
    "presenter"
  );


const day =
  document.getElementById(
    "day"
  );


const startTime =
  document.getElementById(
    "startTime"
  );


const endTime =
  document.getElementById(
    "endTime"
  );


const description =
  document.getElementById(
    "description"
  );


const active =
  document.getElementById(
    "active"
  );


const programList =
  document.getElementById(
    "programList"
  );


const formTitle =
  document.getElementById(
    "formTitle"
  );


const cancelEdit =
  document.getElementById(
    "cancelEdit"
  );


const notice =
  document.getElementById(
    "notice"
  );


/* =========================================================
   VERIFICAÇÃO
========================================================= */

console.log(
  "NTP RADIO OS - Programação carregada"
);


console.log(
  "Chave:",
  STORAGE_KEY
);


if (!form) {

  console.error(
    "ERRO: #programForm não foi encontrado."
  );

}


/* =========================================================
   LER DADOS
========================================================= */

function getPrograms() {

  const raw =
    localStorage.getItem(
      STORAGE_KEY
    );


  if (!raw) {

    return [];

  }


  try {

    const data =
      JSON.parse(raw);


    if (
      !Array.isArray(data)
    ) {

      return [];

    }


    return data;

  } catch (error) {

    console.error(
      "Erro no JSON da programação:",
      error
    );


    return [];

  }

}


/* =========================================================
   GRAVAR DADOS
========================================================= */

function savePrograms(
  programs
) {

  try {

    const json =
      JSON.stringify(
        programs
      );


    localStorage.setItem(
      STORAGE_KEY,
      json
    );


    /* VERIFICAÇÃO REAL */

    const verification =
      localStorage.getItem(
        STORAGE_KEY
      );


    if (
      verification !== json
    ) {

      throw new Error(
        "O navegador não confirmou o armazenamento."
      );

    }


    console.log(
      "Programação salva:",
      programs
    );


    return true;

  } catch (error) {

    console.error(
      "ERRO AO SALVAR:",
      error
    );


    alert(
      "Não foi possível salvar a programação neste navegador."
    );


    return false;

  }

}


/* =========================================================
   ORDENAR
========================================================= */

function sortPrograms(
  programs
) {

  return [...programs].sort(
    function(a, b) {

      const dayA =
        DAY_ORDER.indexOf(
          a.day
        );


      const dayB =
        DAY_ORDER.indexOf(
          b.day
        );


      if (
        dayA !== dayB
      ) {

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
   SEGURANÇA
========================================================= */

function escapeHTML(
  value
) {

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


  if (
    type === "error"
  ) {

    notice.style.color =
      "#ff8fae";

  } else {

    notice.style.color =
      "#75efbe";

  }


  setTimeout(
    function() {

      notice.style.display =
        "none";

    },
    3500
  );

}


/* =========================================================
   LIMPAR
========================================================= */

function clearForm() {

  form.reset();


  programId.value =
    "";


  active.checked =
    true;


  formTitle.textContent =
    "Novo programa";


  cancelEdit.style.display =
    "none";

}


/* =========================================================
   RENDERIZAR
========================================================= */

function renderPrograms() {

  const programs =
    sortPrograms(
      getPrograms()
    );


  if (
    programs.length === 0
  ) {

    programList.innerHTML = `

      <div class="empty">

        <div style="font-size:40px">
          📻
        </div>

        <br>

        <strong>
          Nenhum programa cadastrado
        </strong>

        <p>
          Cadastre o primeiro programa
          usando o formulário.
        </p>

      </div>

    `;


    return;

  }


  programList.innerHTML =
    programs
      .map(
        function(program) {

          const dayName =
            DAY_NAMES[
              program.day
            ] ||
            program.day;


          const status =
            program.active !== false;


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
                  class="status ${
                    status
                      ? "active"
                      : "inactive"
                  }"
                >

                  ${
                    status
                      ? "ATIVO"
                      : "INATIVO"
                  }

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
                  type="button"
                  class="action-btn"
                  data-action="edit"
                  data-id="${
                    program.id
                  }"
                >
                  ✏️ Editar
                </button>


                <button
                  type="button"
                  class="action-btn"
                  data-action="toggle"
                  data-id="${
                    program.id
                  }"
                >

                  ${
                    status
                      ? "⏸️ Desativar"
                      : "▶️ Ativar"
                  }

                </button>


                <button
                  type="button"
                  class="action-btn delete"
                  data-action="delete"
                  data-id="${
                    program.id
                  }"
                >
                  🗑️ Excluir
                </button>

              </div>

            </article>

          `;

        }
      )
      .join("");

}


/* =========================================================
   SALVAR
========================================================= */

form.addEventListener(
  "submit",
  function(event) {

    event.preventDefault();


    console.log(
      "Botão SALVAR pressionado."
    );


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


    /* ================================================
       VALIDAÇÕES
    ================================================= */

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
        "Selecione o dia.",
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


    if (
      startValue >= endValue
    ) {

      showNotice(
        "O horário final deve ser depois do horário inicial.",
        "error"
      );

      endTime.focus();

      return;

    }


    let programs =
      getPrograms();


    /* ================================================
       EDITAR
    ================================================= */

    if (
      programId.value
    ) {

      const index =
        programs.findIndex(
          function(item) {

            return String(
              item.id
            ) === String(
              programId.value
            );

          }
        );


      if (
        index === -1
      ) {

        alert(
          "Programa não encontrado."
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


    } else {


      /* ==============================================
         NOVO
      ============================================== */

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

    }


    /* ==============================================
       GRAVAR
    ============================================== */

    const saved =
      savePrograms(
        programs
      );


    if (!saved) {
      return;
    }


    /* ==============================================
       CONFIRMAÇÃO
    ============================================== */

    showNotice(
      "✅ Programa salvo com sucesso!"
    );


    clearForm();


    renderPrograms();

  }
);


/* =========================================================
   BOTÕES
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


    const programs =
      getPrograms();


    const index =
      programs.findIndex(
        function(item) {

          return String(
            item.id
          ) === String(id);

        }
      );


    if (
      index === -1
    ) {

      return;

    }


    /* EDITAR */

    if (
      action === "edit"
    ) {

      const program =
        programs[index];


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


      return;

    }


    /* ATIVAR / DESATIVAR */

    if (
      action === "toggle"
    ) {

      programs[index].active =
        programs[index].active === false;


      if (
        savePrograms(
          programs
        )
      ) {

        renderPrograms();

        showNotice(
          "Status do programa atualizado."
        );

      }


      return;

    }


    /* EXCLUIR */

    if (
      action === "delete"
    ) {

      const confirmed =
        window.confirm(
          "Deseja excluir este programa?"
        );


      if (!confirmed) {
        return;
      }


      programs.splice(
        index,
        1
      );


      if (
        savePrograms(
          programs
        )
      ) {

        renderPrograms();

        showNotice(
          "Programa excluído."
        );

      }

    }

  }
);


/* =========================================================
   CANCELAR
========================================================= */

cancelEdit.addEventListener(
  "click",
  function() {

    clearForm();

  }
);


/* =========================================================
   INICIAR
========================================================= */

renderPrograms();
