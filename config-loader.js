/* =========================================================
   NTP RADIO OS — CONFIG LOADER
   Carrega configuração da rádio e aplica no site.
   Não altera a lógica do player.
   ========================================================= */

(function () {
  "use strict";

  const DEFAULT_CONFIG = {
    station: {
      name: "NTP RÁDIO WEB",
      shortName: "NTP",
      description: "Sua rádio online ao vivo",
      country: "Brasil",
      language: "pt-BR",
      timezone: "America/Sao_Paulo"
    },

    stream: {
      provider: "Zeno.FM",
      url: "https://stream.zeno.fm/elhz4znig9wuv",
      metadata:
        "https://api.zeno.fm/mounts/metadata/subscribe/elhz4znig9wuv"
    },

    branding: {
      theme: "galaxy",
      primaryColor: "#6d28ff",
      secondaryColor: "#a66bff",
      background: "#02030a"
    },

    social: {
      instagram: "",
      facebook: "",
      youtube: "",
      tiktok: "",
      whatsapp: ""
    },

    features: {
      livePlayer: true,
      metadata: true,
      history: true,
      schedule: true,
      news: true,
      events: true,
      pwa: true,
      mediaSession: true
    }
  };

  function deepMerge(base, extra) {
    const result = structuredClone
      ? structuredClone(base)
      : JSON.parse(JSON.stringify(base));

    if (!extra || typeof extra !== "object") {
      return result;
    }

    Object.keys(extra).forEach((key) => {
      if (
        extra[key] &&
        typeof extra[key] === "object" &&
        !Array.isArray(extra[key])
      ) {
        result[key] = deepMerge(result[key] || {}, extra[key]);
      } else {
        result[key] = extra[key];
      }
    });

    return result;
  }

  function getSavedConfig() {
    try {
      const saved = localStorage.getItem("ntp_radio_config");

      if (!saved) {
        return null;
      }

      return JSON.parse(saved);
    } catch (error) {
      console.warn(
        "NTP RADIO OS: configuração local inválida.",
        error
      );

      return null;
    }
  }

  async function getFileConfig() {
    try {
      const response = await fetch(
        "/config/radio.json?v=" + Date.now(),
        {
          cache: "no-store"
        }
      );

      if (!response.ok) {
        throw new Error(
          "HTTP " + response.status
        );
      }

      return await response.json();
    } catch (error) {
      console.warn(
        "NTP RADIO OS: não foi possível carregar config/radio.json.",
        error
      );

      return null;
    }
  }

  function applyColors(config) {
    const root = document.documentElement;

    const primary =
      config.branding?.primaryColor ||
      DEFAULT_CONFIG.branding.primaryColor;

    const secondary =
      config.branding?.secondaryColor ||
      DEFAULT_CONFIG.branding.secondaryColor;

    const background =
      config.branding?.background ||
      DEFAULT_CONFIG.branding.background;

    root.style.setProperty(
      "--purple",
      primary
    );

    root.style.setProperty(
      "--purple2",
      secondary
    );

    root.style.setProperty(
      "--pink",
      secondary
    );

    root.style.setProperty(
      "--bg",
      background
    );

    root.style.setProperty(
      "--primary",
      primary
    );

    root.style.setProperty(
      "--primary-color",
      primary
    );

    root.style.setProperty(
      "--secondary",
      secondary
    );

    root.style.setProperty(
      "--secondary-color",
      secondary
    );

    root.style.setProperty(
      "--background",
      background
    );
  }

  function setText(selector, value) {
    const elements =
      document.querySelectorAll(selector);

    elements.forEach((element) => {
      element.textContent = value;
    });
  }

  function applyStation(config) {
    const station = config.station || {};

    const name =
      station.name ||
      DEFAULT_CONFIG.station.name;

    const shortName =
      station.shortName ||
      DEFAULT_CONFIG.station.shortName;

    const description =
      station.description ||
      DEFAULT_CONFIG.station.description;

    document.title =
      name + " — Rádio Online";

    setText(
      "[data-radio-name]",
      name
    );

    setText(
      "[data-radio-short-name]",
      shortName
    );

    setText(
      "[data-radio-description]",
      description
    );

    setText(
      "[data-radio-country]",
      station.country || ""
    );

    setText(
      "[data-radio-language]",
      station.language || ""
    );

    document.documentElement.lang =
      station.language ||
      DEFAULT_CONFIG.station.language;

    const metaDescription =
      document.querySelector(
        'meta[name="description"]'
      );

    if (metaDescription) {
      metaDescription.setAttribute(
        "content",
        description
      );
    }
  }

  function applySocial(config) {
    const social =
      config.social || {};

    const selectors = {
      instagram: '[data-social="instagram"]',
      facebook: '[data-social="facebook"]',
      youtube: '[data-social="youtube"]',
      tiktok: '[data-social="tiktok"]',
      whatsapp: '[data-social="whatsapp"]'
    };

    Object.keys(selectors).forEach((network) => {
      const url = social[network];

      document
        .querySelectorAll(
          selectors[network]
        )
        .forEach((element) => {
          if (url) {
            element.href = url;
            element.style.display = "";
          } else {
            element.removeAttribute("href");
            element.style.display = "none";
          }
        });
    });
  }

  function applyFeatures(config) {
    const features =
      config.features || {};

    const featureMap = {
      livePlayer: '[data-feature="livePlayer"]',
      metadata: '[data-feature="metadata"]',
      history: '[data-feature="history"]',
      schedule: '[data-feature="schedule"]',
      news: '[data-feature="news"]',
      events: '[data-feature="events"]',
      pwa: '[data-feature="pwa"]'
    };

    Object.keys(featureMap).forEach(
      (feature) => {
        const enabled =
          features[feature] !== false;

        document
          .querySelectorAll(
            featureMap[feature]
          )
          .forEach((element) => {
            element.style.display =
              enabled ? "" : "none";
          });
      }
    );
  }

  function exposeConfig(config) {
    window.NTP_RADIO_CONFIG = config;

    window.NTP_CONFIG = config;

    console.log(
      "NTP RADIO OS: configuração carregada.",
      config
    );

    window.dispatchEvent(
      new CustomEvent(
        "ntp-config-loaded",
        {
          detail: config
        }
      )
    );
  }

  async function init() {
    const fileConfig =
      await getFileConfig();

    const savedConfig =
      getSavedConfig();

    /*
      Prioridade:

      1. configuração salva no painel
      2. config/radio.json
      3. configuração padrão
    */

    let config =
      deepMerge(
        DEFAULT_CONFIG,
        fileConfig || {}
      );

    config =
      deepMerge(
        config,
        savedConfig || {}
      );

    applyColors(config);
    applyStation(config);
    applySocial(config);
    applyFeatures(config);
    exposeConfig(config);
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

  /*
    Se o painel alterar a configuração
    em outra aba/janela, recarrega.
  */

  window.addEventListener(
    "storage",
    function (event) {
      if (
        event.key ===
        "ntp_radio_config"
      ) {
        init();
      }
    }
  );
})();
