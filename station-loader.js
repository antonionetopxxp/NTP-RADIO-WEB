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


  function applyStationToPage(station) {

    if (!station) {
      return;
    }


    /*
      Disponibiliza a rádio inteira
      para os outros scripts.
    */

    window.NTP_ACTIVE_STATION =
      station;

    window.NTP_ACTIVE_STATION_ID =
      station.id;


    /*
      Stream
    */

    window.NTP_ACTIVE_STREAM =
      station.stream?.url || "";


    /*
      Metadata
    */

    window.NTP_ACTIVE_METADATA =
      station.stream?.metadata || "";


    /*
      Identidade
    */

    window.NTP_ACTIVE_STATION_NAME =
      station.name || "";

    window.NTP_ACTIVE_STATION_SHORT_NAME =
      station.shortName || "";


    /*
      Branding
    */

    window.NTP_ACTIVE_BRANDING =
      station.branding || {};


    /*
      Recursos
    */

    window.NTP_ACTIVE_FEATURES =
      station.features || {};


    /*
      Salva estação atual
    */

    localStorage.setItem(
      "ntp_active_station",
      station.id
    );


    /*
      Identificação no HTML
    */

    document.documentElement.dataset.station =
      station.id;


    /*
      Evento para outros scripts
    */

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

    console.log(
      "NTP RADIO OS — Stream:",
      station.stream?.url || "não informado"
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


    /*
      Se a rádio solicitada não existir,
      usa a rádio padrão.
    */

    if (!station) {

      station =
        findStation(
          data,
          data.defaultStation
        );

    }


    /*
      Último fallback.
    */

    if (!station) {

      station =
        findStation(
          data,
          DEFAULT_STATION_ID
        );

    }


    if (!station) {

      console.error(
        "NTP RADIO OS: nenhuma rádio encontrada."
      );

      return;

    }


    applyStationToPage(station);

  }


  /*
    Aguarda o HTML.
  */

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
