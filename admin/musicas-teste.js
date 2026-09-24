/* ============================================================
   NTP RADIO OS
   MÚSICAS DE TESTE
   ============================================================ */

(() => {
  "use strict";

  const MUSIC_KEY = "ntp_radio_music";

  const DB_NAME = "ntp_radio_os_audio";
  const DB_VERSION = 1;
  const AUDIO_STORE = "audioFiles";

  const STATIONS_URL = "../config/stations.json";

  const TEST_TRACKS = [
    {
      title: "NTP Teste 01 - Abertura",
      artist: "NTP RADIO OS",
      frequency: 440
    },
    {
      title: "NTP Teste 02 - Energia",
      artist: "NTP RADIO OS",
      frequency: 523.25
    },
    {
      title: "NTP Teste 03 - Rádio",
      artist: "NTP RADIO OS",
      frequency: 659.25
    },
    {
      title: "NTP Teste 04 - Programação",
      artist: "NTP RADIO OS",
      frequency: 392
    },
    {
      title: "NTP Teste 05 - Auto DJ",
      artist: "NTP RADIO OS",
      frequency: 587.33
    },
    {
      title: "NTP Teste 06 - Encerramento",
      artist: "NTP RADIO OS",
      frequency: 698.46
    }
  ];

  let db = null;

  /* ============================================================
     INDEXED DB
     ============================================================ */

  function abrirBanco() {

    return new Promise((resolve, reject) => {

      const request =
        indexedDB.open(
          DB_NAME,
          DB_VERSION
        );

      request.onupgradeneeded = () => {

        const database =
          request.result;

        if (
          !database.objectStoreNames.contains(
            AUDIO_STORE
          )
        ) {

          database.createObjectStore(
            AUDIO_STORE
          );

        }

      };

      request.onsuccess = () => {

        db = request.result;

        resolve(db);

      };

      request.onerror = () => {

        reject(request.error);

      };

    });

  }


  function salvarAudio(id, blob) {

    return new Promise((resolve, reject) => {

      const transaction =
        db.transaction(
          AUDIO_STORE,
          "readwrite"
        );

      const store =
        transaction.objectStore(
          AUDIO_STORE
        );

      store.put(
        blob,
        id
      );

      transaction.oncomplete =
        () => resolve();

      transaction.onerror =
        () => reject(
          transaction.error
        );

    });

  }


  /* ============================================================
     CARREGAR RÁDIO
     ============================================================ */

  async function carregarRadio() {

    try {

      const response =
        await fetch(
          STATIONS_URL,
          {
            cache: "no-store"
          }
        );

      if (!response.ok) {

        throw new Error(
          "Erro ao carregar estações."
        );

      }

      const data =
        await response.json();

      const stations =
        Array.isArray(data)
          ? data
          : Array.isArray(data.stations)
            ? data.stations
            : [];

      if (!stations.length) {

        throw new Error(
          "Nenhuma rádio cadastrada."
        );

      }

      const saved =
        localStorage.getItem(
          "ntp_active_station"
        );

      let station =
        stations.find(
          radio =>
            radio.id === saved
        );

      if (!station) {

        station =
          stations.find(
            radio =>
              radio.id === "ntp-radio-web"
          );

      }

      if (!station) {

        station =
          stations[0];

      }

      return station;

    } catch (error) {

      console.error(
        "[MÚSICAS TESTE]",
        error
      );

      return {
        id: "ntp-radio-web",
        name: "NTP RÁDIO WEB"
      };

    }

  }


  /* ============================================================
     GERAR WAV
     ============================================================ */

  function gerarWav(
    frequency,
    duration = 8
  ) {

    const sampleRate = 44100;
    const channels = 1;
    const bits = 16;

    const samples =
      Math.floor(
        sampleRate *
        duration
      );

    const dataSize =
      samples *
      channels *
      2;

    const buffer =
      new ArrayBuffer(
        44 + dataSize
      );

    const view =
      new DataView(
        buffer
      );


    function texto(
      offset,
      value
    ) {

      for (
        let i = 0;
        i < value.length;
        i++
      ) {

        view.setUint8(
          offset + i,
          value.charCodeAt(i)
        );

      }

    }


    texto(
      0,
      "RIFF"
    );

    view.setUint32(
      4,
      36 + dataSize,
      true
    );

    texto(
      8,
      "WAVE"
    );

    texto(
      12,
      "fmt "
    );

    view.setUint32(
      16,
      16,
      true
    );

    view.setUint16(
      20,
      1,
      true
    );

    view.setUint16(
      22,
      channels,
      true
    );

    view.setUint32(
      24,
      sampleRate,
      true
    );

    view.setUint32(
      28,
      sampleRate * 2,
      true
    );

    view.setUint16(
      32,
      2,
      true
    );

    view.setUint16(
      34,
      bits,
      true
    );

    texto(
      36,
      "data"
    );

    view.setUint32(
      40,
      dataSize,
      true
    );


    const fade =
      Math.floor(
        sampleRate * 0.5
      );


    for (
      let i = 0;
      i < samples;
      i++
    ) {

      let volume = 0.25;


      if (i < fade) {

        volume *=
          i / fade;

      }


      if (
        samples - i <
        fade
      ) {

        volume *=
          (samples - i) /
          fade;

      }


      const wave =
        Math.sin(
          2 *
          Math.PI *
          frequency *
          i /
          sampleRate
        );


      view.setInt16(
        44 + i * 2,
        wave *
        volume *
        32767,
        true
      );

    }


    return new Blob(
      [buffer],
      {
        type: "audio/wav"
      }
    );

  }


  /* ============================================================
     ID
     ============================================================ */

  function gerarId() {

    return (
      "teste-" +
      Date.now() +
      "-" +
      Math.random()
        .toString(36)
        .substring(2, 8)
    );

  }


  /* ============================================================
     CRIAR MÚSICAS
     ============================================================ */

  async function criarMusicasTeste() {

    if (!db) {

      await abrirBanco();

    }


    const radio =
      await carregarRadio();


    let musicas =
      JSON.parse(
        localStorage.getItem(
          MUSIC_KEY
        ) || "[]"
      );


    if (!Array.isArray(musicas)) {

      musicas = [];

    }


    const criadas = [];


    for (
      const track of TEST_TRACKS
    ) {

      const id =
        gerarId();


      const audio =
        gerarWav(
          track.frequency,
          8
        );


      await salvarAudio(
        id,
        audio
      );


      const musica = {

        id,

        title:
          track.title,

        artist:
          track.artist,

        album:
          "NTP RADIO OS - TESTE",

        category:
          "music",

        stationId:
          radio.id ||
          "ntp-radio-web",

        duration:
          8,

        audioUrl:
          "",

        active:
          true,

        hasAudio:
          true,

        isTestTrack:
          true,

        createdAt:
          new Date().toISOString()

      };


      musicas.push(
        musica
      );

      criadas.push(
        musica
      );

    }


    localStorage.setItem(
      MUSIC_KEY,
      JSON.stringify(
        musicas
      )
    );


    window.dispatchEvent(
      new CustomEvent(
        "ntp-music-updated",
        {
          detail: {
            added: criadas
          }
        }
      )
    );


    return criadas;

  }


  /* ============================================================
     REMOVER TESTES
     ============================================================ */

  async function removerMusicasTeste() {

    let musicas =
      JSON.parse(
        localStorage.getItem(
          MUSIC_KEY
        ) || "[]"
      );


    const testes =
      musicas.filter(
        musica =>
          musica.isTestTrack
      );


    if (!testes.length) {

      alert(
        "Não existem músicas de teste."
      );

      return;

    }


    if (!db) {

      await abrirBanco();

    }


    for (
      const musica of testes
    ) {

      await new Promise(
        resolve => {

          const transaction =
            db.transaction(
              AUDIO_STORE,
              "readwrite"
            );

          transaction
            .objectStore(
              AUDIO_STORE
            )
            .delete(
              musica.id
            );

          transaction.oncomplete =
            resolve;

          transaction.onerror =
            resolve;

        }
      );

    }


    musicas =
      musicas.filter(
        musica =>
          !musica.isTestTrack
      );


    localStorage.setItem(
      MUSIC_KEY,
      JSON.stringify(
        musicas
      )
    );


    window.dispatchEvent(
      new Event(
        "ntp-music-updated"
      )
    );


    location.reload();

  }


  /* ============================================================
     CRIAR BOTÕES
     ============================================================ */

  function criarBotoes() {

    if (
      document.getElementById(
        "ntpTestMusicButtons"
      )
    ) {

      return;

    }


    const topbar =
      document.querySelector(
        ".topbar"
      );


    if (!topbar) {

      console.error(
        "[MÚSICAS TESTE] .topbar não encontrada."
      );

      return;

    }


    const botoes =
      document.createElement(
        "div"
      );


    botoes.id =
      "ntpTestMusicButtons";


    botoes.style.display =
      "flex";

    botoes.style.gap =
      "10px";

    botoes.style.flexWrap =
      "wrap";

    botoes.style.marginTop =
      "16px";


    /* CRIAR */

    const criar =
      document.createElement(
        "button"
      );


    criar.type =
      "button";

    criar.className =
      "btn primary";

    criar.innerHTML =
      "🎵 Criar músicas de teste";


    criar.addEventListener(
      "click",
      async () => {

        criar.disabled =
          true;

        criar.textContent =
          "⏳ Criando músicas...";


        try {

          const musicas =
            await criarMusicasTeste();


          alert(
            `${musicas.length} músicas de teste criadas com sucesso.`
          );


          location.reload();

        } catch (error) {

          console.error(
            error
          );

          alert(
            "Erro ao criar músicas de teste. Veja o console."
          );


          criar.disabled =
            false;

          criar.innerHTML =
            "🎵 Criar músicas de teste";

        }

      }
    );


    /* REMOVER */

    const remover =
      document.createElement(
        "button"
      );


    remover.type =
      "button";

    remover.className =
      "btn ghost";

    remover.innerHTML =
      "🗑️ Remover músicas de teste";


    remover.addEventListener(
      "click",
      removerMusicasTeste
    );


    botoes.appendChild(
      criar
    );

    botoes.appendChild(
      remover
    );


    /*
      O seu HTML usa .topbar.
      Colocamos os botões dentro do cabeçalho.
    */

    topbar.appendChild(
      botoes
    );


    console.log(
      "[MÚSICAS TESTE] Botões adicionados."
    );

  }


  /* ============================================================
     API
     ============================================================ */

  window.NTP_TEST_MUSIC = {

    criar:
      criarMusicasTeste,

    remover:
      removerMusicasTeste

  };


  /* ============================================================
     INICIALIZAÇÃO
     ============================================================ */

  async function iniciar() {

    try {

      await abrirBanco();

      criarBotoes();

      console.log(
        "%cNTP RADIO OS — Sistema de músicas de teste carregado.",
        "color:#a66bff;font-weight:bold;"
      );

    } catch (error) {

      console.error(
        "[MÚSICAS TESTE]",
        error
      );

    }

  }


  if (
    document.readyState ===
    "loading"
  ) {

    document.addEventListener(
      "DOMContentLoaded",
      iniciar
    );

  } else {

    iniciar();

  }

})();
