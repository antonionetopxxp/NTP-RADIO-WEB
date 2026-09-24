(function () {
  "use strict";

  const SELECTOR_ID = "stationSelector";

  async function loadStations() {
    try {
      const response = await fetch(
        "/config/stations.json?v=" + Date.now(),
        {
          cache: "no-store"
        }
      );

      if (!response.ok) {
        throw new Error("HTTP " + response.status);
      }

      return await response.json();

    } catch (error) {

      console.error(
        "NTP RADIO OS: não foi possível carregar as rádios.",
        error
      );

      return {
        defaultStation: "",
        stations: []
      };
    }
  }


  function createSelector(stations) {

    if (!Array.isArray(stations) || !stations.length) {
      return;
    }


    const oldSelector =
      document.getElementById(SELECTOR_ID);

    if (oldSelector) {
      oldSelector.remove();
    }


    const container =
      document.createElement("div");

    container.id = SELECTOR_ID;
    container.className = "station-selector";


    container.innerHTML = `
      <div class="station-selector-title">
        <span>📻</span>
        <strong>Escolha sua rádio</strong>
      </div>

      <div class="station-selector-list"></div>
    `;


    const list =
      container.querySelector(
        ".station-selector-list"
      );


    stations
      .filter(
        station =>
          station &&
          station.status !== "inactive"
      )
      .forEach(function (station) {

        const button =
          document.createElement("button");

        button.type = "button";

        button.className =
          "station-option";


        button.dataset.stationId =
          station.id;


        button.innerHTML = `
          <span class="station-option-icon">
            📻
          </span>

          <span class="station-option-info">

            <strong>
              ${escapeHTML(
                station.name || "Rádio"
              )}
            </strong>

            <small>
              ${escapeHTML(
                station.description || ""
              )}
            </small>

          </span>

          <span class="station-option-arrow">
            ▶
          </span>
        `;


        button.addEventListener(
          "click",
          function () {

            selectStation(
              station.id
            );

          }
        );


        list.appendChild(button);

      });


    document.body.appendChild(
      container
    );

  }


  function selectStation(id) {

    if (!id) {
      return;
    }


    localStorage.setItem(
      "ntp_active_station",
      id
    );


    const url =
      new URL(
        window.location.href
      );


    url.searchParams.set(
      "station",
      id
    );


    window.location.href =
      url.toString();

  }


  function escapeHTML(value) {

    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

  }


  async function init() {

    const data =
      await loadStations();

    createSelector(
      data.stations
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
