const $ = (selector) =>
  document.querySelector(selector);


/* DATA */

function updateDate() {

  const element =
    $("#currentDate");

  if (!element) return;

  element.textContent =
    new Intl.DateTimeFormat(
      "pt-BR",
      {
        dateStyle: "full"
      }
    ).format(new Date());

}


/* CONFIGURAÇÃO DA RÁDIO */

async function loadConfig() {

  try {

    const response =
      await fetch(
        "../config/radio.json",
        {
          cache: "no-store"
        }
      );

    if (!response.ok) {
      throw new Error(
        "Configuração não encontrada."
      );
    }

    const config =
      await response.json();

    const station =
      config.station || {};


    const name =
      $("#stationName");

    const country =
      $("#stationCountry");

    const language =
      $("#stationLanguage");

    const timezone =
      $("#stationTimezone");


    if (name) {
      name.textContent =
        station.name ||
        "NTP RÁDIO WEB";
    }


    if (country) {
      country.textContent =
        station.country ||
        "Brasil";
    }


    if (language) {
      language.textContent =
        station.language ||
        "pt-BR";
    }


    if (timezone) {
      timezone.textContent =
        station.timezone ||
        "America/Sao_Paulo";
    }


    const message =
      $("#configMessage");

    if (message) {

      message.textContent =
        "config/radio.json carregado com sucesso.";

    }

  }

  catch (error) {

    const message =
      $("#configMessage");

    if (message) {

      message.textContent =
        "Não foi possível carregar config/radio.json.";

    }

  }

}


/* ATUALIZAR */

const refresh =
  $("#refreshBtn");

if (refresh) {

  refresh.addEventListener(
    "click",
    async () => {

      refresh.textContent = "…";

      updateDate();

      await loadConfig();

      setTimeout(() => {

        refresh.textContent = "↻";

      }, 500);

    }function atualizarDashboard() {
  try {
    const programas = JSON.parse(
      localStorage.getItem("ntp_radio_programacao") || "[]"
    );

    const ativos = programas.filter(programa => programa.active !== false);

    const elemento = document.getElementById("programCount");

    if (elemento) {
      elemento.textContent = ativos.length;
    }

    console.log("Programas encontrados:", programas);
    console.log("Programas ativos:", ativos);
  } catch (erro) {
    console.error("Erro ao carregar programação:", erro);

    const elemento = document.getElementById("programCount");

    if (elemento) {
      elemento.textContent = "0";
    }
  }
}

document.addEventListener("DOMContentLoaded", atualizarDashboard);

window.addEventListener("pageshow", atualizarDashboard);

window.addEventListener("storage", atualizarDashboard);
  );
  

}


/* INICIALIZAÇÃO */

updateDate();

loadConfig();
