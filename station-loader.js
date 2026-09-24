(function () {
  "use strict";

  const DEFAULT_STATION_ID = "ntp-radio-web";

  async function loadStations() {
    try {
      const response = await fetch(
        "/config/stations.json?v=" + Date.now(),
        {
          cache: "no-store"
        }
      );

      if (!response.ok) {
        throw new Error(
          "Erro HTTP " + response.status
        );
      }

      return await response.json();
    } catch (error) {
      console.error(
        "NTP RADIO OS: erro ao carregar estações.",
        error
      );

      return {
        defaultStation: DEFAULT_STATION_ID,
        stations: []
      };
    }
  }

  function getStationId() {
    const params =
      new URLSearchParams(
        window.location.search
      );

    return (
      params.get("station") ||
      localStorage.getItem(
        "ntp_active_station"
      ) ||
      DEFAULT_STATION_ID
    );
  }

  function findStation(data, id) {
    if (
      !data ||
      !Array.isArray(data.stations)
    ) {
      return null;
    }

    return data.stations.find(
      station =>
        station &&
        station.id === id
    );
  }

  async function init() {
    const data =
      await loadStations();

    const requestedId =
      getStationId();

    let station =
      findStation(
        data,
        requestedId
      );

    if (!station) {
      station =
        findStation(
          data,
          data.defaultStation
        );
    }

    if (!station) {
      console.error(
        "NTP RADIO OS: nenhuma rádio encontrada."
      );

      return;
    }

    window.NTP_ACTIVE_STATION =
      station;

    window.NTP_ACTIVE_STATION_ID =
      station.id;

    localStorage.setItem(
      "ntp_active_station",
      station.id
    );

    document.documentElement.dataset.station =
      station.id;

    window.dispatchEvent(
      new CustomEvent(
        "ntp-station-loaded",
        {
          detail: station
        }
      )
    );

    console.log(
      "NTP RADIO OS — Rádio ativa:",
      station.name
    );
  }

  if (
    document.readyState ===
    "loading"
  ) {
    document.addEventListener(
      "DOMContentLoaded",
      init
    );
  } else {
    init();
  }
})();
