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
        throw new Error("HTTP " + response.status);
      }

      return await response.json();

    } catch (error) {

      console.error(
        "NTP RADIO OS: erro ao carregar stations.json.",
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
      new URLSearchParams(window.location.search);

    return (
      params.get("station") ||
      localStorage.getItem("ntp_active_station") ||
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

    const data = await loadStations();

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
        "NTP RADIO OS: nenhuma estação encontrada."
      );

      return;
    }


    window.NTP_ACTIVE_STATION =
      station;

    window.NTP_ACTIVE_STATION_ID =
      station.id;


    window.NTP_ACTIVE_STREAM =
      station.stream?.url || "";


    window.NTP_ACTIVE_METADATA =
      station.stream?.metadata || "";


    window.NTP_ACTIVE_STATION_NAME =
      station.name || "";


    window.NTP_ACTIVE_STATION_SHORT_NAME =
      station.shortName || "";


    window.NTP_ACTIVE_BRANDING =
      station.branding || {};


    window.NTP_ACTIVE_FEATURES =
      station.features || {};


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
      "NTP RADIO OS — Estação ativa:",
      station.name
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
