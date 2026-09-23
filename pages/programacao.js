(() => {
  "use strict";

  const STORAGE_KEY = "ntp_radio_programacao";

  const dayOrder = {
    "Domingo": 0,
    "Segunda-feira": 1,
    "Terça-feira": 2,
    "Quarta-feira": 3,
    "Quinta-feira": 4,
    "Sexta-feira": 5,
    "Sábado": 6
  };

  const scheduleGrid =
    document.querySelector("#scheduleGrid");

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
      const saved =
        localStorage.getItem(STORAGE_KEY);

      if (!saved) {
        return [];
      }

      const programs = JSON.parse(saved);

      if (!Array.isArray(programs)) {
        return [];
      }

      return programs
        .filter(
          (program) =>
            program &&
            program.active !== false
        )
        .sort((a, b) => {
          const dayA =
            dayOrder[a.day] ?? 99;

          const dayB =
            dayOrder[b.day] ?? 99;

          if (dayA !== dayB) {
            return dayA - dayB;
          }

          return String(
            a.startTime || ""
          ).localeCompare(
            String(b.startTime || "")
          );
        });

    } catch (error) {
      console.error(
        "Erro ao carregar programação:",
        error
      );

      return [];
    }
  }

  function render() {
    if (!scheduleGrid) {
      return;
    }

    const programs = loadPrograms();

    if (!programs.length) {
      scheduleGrid.innerHTML = `
        <article class="schedule-card reveal">
          <span class="time">—</span>

          <h3>Programação em atualização</h3>

          <p>
            Nossa grade de programação
            será divulgada em breve.
          </p>
        </article>
      `;

      return;
    }

    scheduleGrid.innerHTML =
      programs
        .map((program) => {
          const start =
            program.startTime || "";

          const end =
            program.endTime || "";

          const time =
            start && end
              ? `${start} — ${end}`
              : start || "Horário";

          return `
            <article class="schedule-card reveal">

              <span class="time">
                ${escapeHTML(time)}
              </span>

              <div class="schedule-day">
                ${escapeHTML(
                  program.day || ""
                )}
              </div>

              <h3>
                ${escapeHTML(
                  program.name ||
                  "Programa"
                )}
              </h3>

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

            </article>
          `;
        })
        .join("");

    activateReveal();
  }

  function activateReveal() {
    const elements =
      document.querySelectorAll(
        ".schedule-card.reveal"
      );

    if (
      "IntersectionObserver" in window
    ) {
      const observer =
        new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                entry.target.classList.add(
                  "visible"
                );

                observer.unobserve(
                  entry.target
                );
              }
            });
          },
          {
            threshold: 0.08
          }
        );

      elements.forEach((element) => {
        observer.observe(element);
      });

    } else {
      elements.forEach((element) => {
        element.classList.add("visible");
      });
    }
  }

  window.addEventListener(
    "storage",
    (event) => {
      if (
        event.key === STORAGE_KEY
      ) {
        render();
      }
    }
  );

  window.addEventListener(
    "pageshow",
    render
  );

  if (
    document.readyState === "loading"
  ) {
    document.addEventListener(
      "DOMContentLoaded",
      render
    );
  } else {
    render();
  }
})();
