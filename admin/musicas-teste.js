/* ============================================================
   NTP RADIO OS
   SISTEMA DE MÚSICAS DE TESTE
   Gera pequenos áudios sintéticos para testar o Auto-DJ
   ============================================================ */

(() => {
  "use strict";

  const MUSIC_KEY = "ntp_radio_music";
  const STATIONS_URL = "../config/stations.json";

  const DB_NAME = "ntp_radio_os_audio";
  const DB_VERSION = 1;
  const AUDIO_STORE = "audioFiles";

  const TEST_TRACKS = [
    {
      title: "NTP Teste 01 - Abertura",
      artist: "NTP RADIO OS",
      category: "music",
      frequency: 440
    },
    {
      title: "NTP Teste 02 - Energia",
      artist: "NTP RADIO OS",
      category: "music",
      frequency: 523.25
    },
    {
      title: "NTP Teste 03 - Rádio",
      artist: "NTP RADIO OS",
      category: "music",
      frequency: 659.25
    },
    {
      title: "NTP Teste 04 - Programação",
      artist: "NTP RADIO OS",
      category: "music",
      frequency: 392
    },
    {
      title: "NTP Teste 05 - Auto DJ",
      artist: "NTP RADIO OS",
      category: "music",
      frequency: 587.33
    },
    {
      title: "NTP Teste 06 - Encerramento",
      artist: "NTP RADIO OS",
      category: "music",
      frequency: 698.46
    }
  ];

  let db = null;

  /* ============================================================
     INDEXED DB
     ============================================================ */

  function abrirBanco() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = () => {
        const database = request.result;

        if (!database.objectStoreNames.contains(AUDIO_STORE)) {
          database.createObjectStore(AUDIO_STORE);
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
      const transaction = db.transaction(AUDIO_STORE, "readwrite");
      const store = transaction.objectStore(AUDIO_STORE);

      store.put(blob, id);

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  /* ============================================================
     ESTAÇÃO
     ============================================================ */

  async function carregarEstacao() {
    try {
      const response = await fetch(STATIONS_URL, {
        cache: "no-store"
      });

      if (!response.ok) {
        throw new Error("Não foi possível carregar stations.json");
      }

      const data = await response.json();

      const stations = Array.isArray(data)
        ? data
        : Array.isArray(data.stations)
          ? data.stations
          : [];

      if (!stations.length) {
        throw new Error("Nenhuma rádio encontrada.");
      }

      // Primeiro tenta estação salva
      const savedStation =
        localStorage.getItem("ntp_active_station") ||
        "";

      let station =
        stations.find(
          s => s.id === savedStation
        );

      // Depois tenta NTP RADIO WEB
      if (!station) {
        station =
          stations.find(
            s =>
              s.id === "ntp-radio-web" ||
              /NTP RADIO WEB/i.test(s.name || s.nome || "")
          );
      }

      // Finalmente usa a primeira
      if (!station) {
        station = stations[0];
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
     GERAÇÃO DO WAV
     ============================================================ */

  function gerarWav(frequency, duration = 8) {
    const sampleRate = 44100;
    const channels = 1;
    const bitsPerSample = 16;

    const totalSamples =
      Math.floor(sampleRate * duration);

    const dataSize =
      totalSamples *
      channels *
      (bitsPerSample / 8);

    const buffer =
      new ArrayBuffer(44 + dataSize);

    const view =
      new DataView(buffer);

    function writeString(offset, text) {
      for (let i = 0; i < text.length; i++) {
        view.setUint8(
          offset + i,
          text.charCodeAt(i)
        );
      }
    }

    // RIFF
    writeString(0, "RIFF");

    view.setUint32(
      4,
      36 + dataSize,
      true
    );

    writeString(8, "WAVE");

    // fmt
    writeString(12, "fmt ");

    view.setUint32(
      16,
      16,
      true
    );

    // PCM
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

    const byteRate =
      sampleRate *
      channels *
      (bitsPerSample / 8);

    view.setUint32(
      28,
      byteRate,
      true
    );

    const blockAlign =
      channels *
      (bitsPerSample / 8);

    view.setUint16(
      32,
      blockAlign,
      true
    );

    view.setUint16(
      34,
      bitsPerSample,
      true
    );

    // data
    writeString(36, "data");

    view.setUint32(
      40,
      dataSize,
      true
    );

    const fadeSamples =
      Math.floor(sampleRate * 0.5);

    for (let i = 0; i < totalSamples; i++) {

      let amplitude = 0.25;

      if (i < fadeSamples) {
        amplitude *= i / fadeSamples;
      }

      const remaining =
        totalSamples - i;

      if (remaining < fadeSamples) {
        amplitude *= remaining / fadeSamples;
      }

      // pequena modulação para parecer um sinal real
      const modulation =
        1 +
        Math.sin(
          2 *
          Math.PI *
          2 *
          i /
          sampleRate
        ) *
        0.08;

      const sample =
        Math.sin(
          2 *
          Math.PI *
          frequency *
          i /
          sampleRate
        ) *
        amplitude *
        modulation;

      const value =
        Math.max(
          -1,
          Math.min(1, sample)
        );

      view.setInt16(
        44 + i * 2,
        value * 32767,
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
        .slice(2, 8)
    );
  }

  /* ============================================================
     CRIA MÚSICAS
     ============================================================ */

  async function criarMusicasTeste() {

    if (!db) {
      await abrirBanco();
    }

    const station =
      await carregarEstacao();

    console.log(
      "[MÚSICAS TESTE] Rádio:",
      station
    );

    let musicas =
      JSON.parse(
        localStorage.getItem(MUSIC_KEY) || "[]"
      );

    if (!Array.isArray(musicas)) {
      musicas = [];
    }

    const criadas = [];

    for (const track of TEST_TRACKS) {

      const id = gerarId();

      console.log(
        "[MÚSICAS TESTE] Gerando:",
        track.title
      );

      const audioBlob =
        gerarWav(
          track.frequency,
          8
        );

      await salvarAudio(
        id,
        audioBlob
      );

      const musica = {
        id,
        title: track.title,
        artist: track.artist,
        album: "NTP RADIO OS - TESTE",
        category: track.category,

        stationId:
          station.id || "ntp-radio-web",

        duration: 8,

        audioUrl: "",

        active: true,

        hasAudio: true,

        isTestTrack: true,

        createdAt:
          new Date().toISOString()
      };

      musicas.push(musica);
      criadas.push(musica);
    }

    localStorage.setItem(
      MUSIC_KEY,
      JSON.stringify(musicas)
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

    console.log(
      "[MÚSICAS TESTE] Criadas:",
      criadas
    );

    return criadas;
  }

  /* ============================================================
     REMOVE SOMENTE AS MÚSICAS DE TESTE
     ============================================================ */

  async function removerMusicasTeste() {

    let musicas =
      JSON.parse(
        localStorage.getItem(MUSIC_KEY) || "[]"
      );

    const teste =
      musicas.filter(
        m => m.isTestTrack
      );

    if (!teste.length) {
      alert(
        "Nenhuma música de teste encontrada."
      );
      return;
    }

    if (!db) {
      await abrirBanco();
    }

    await Promise.all(
      teste.map(
        musica =>
          new Promise(resolve => {

            const tx =
              db.transaction(
                AUDIO_STORE,
                "readwrite"
              );

            tx.objectStore(
              AUDIO_STORE
            ).delete(musica.id);

            tx.oncomplete =
              resolve;

            tx.onerror =
              resolve;
          })
      )
    );

    musicas =
      musicas.filter(
        m => !m.isTestTrack
      );

    localStorage.setItem(
      MUSIC_KEY,
      JSON.stringify(musicas)
    );

    window.dispatchEvent(
      new Event(
        "ntp-music-updated"
      )
    );

    alert(
      `${teste.length} música(s) de teste removida(s).`
    );

    location.reload();
  }

  /* ============================================================
     INTERFACE
     ============================================================ */

  function criarBotoes() {

    const header =
      document.querySelector(
        ".page-header"
      );

    if (!header) {
      console.warn(
        "[MÚSICAS TESTE] .page-header não encontrado."
      );

      return;
    }

    if (
      document.querySelector(
        "#createTestMusicBtn"
      )
    ) {
      return;
    }

    const container =
      document.createElement("div");

    container.style.display = "flex";
    container.style.gap = "10px";
    container.style.flexWrap = "wrap";
    container.style.marginTop = "10px";

    const criar =
      document.createElement("button");

    criar.id =
      "createTestMusicBtn";

    criar.type = "button";

    criar.innerHTML =
      "🎵 Criar músicas de teste";

    criar.style.padding =
      "10px 16px";

    criar.style.borderRadius =
      "10px";

    criar.style.border =
      "1px solid rgba(139,92,246,.45)";

    criar.style.background =
      "linear-gradient(135deg,#6d28ff,#8b5cf6)";

    criar.style.color =
      "#fff";

    criar.style.cursor =
      "pointer";

    const remover =
      document.createElement("button");

    remover.type =
      "button";

    remover.innerHTML =
      "🗑️ Remover músicas de teste";

    remover.style.padding =
      "10px 16px";

    remover.style.borderRadius =
      "10px";

    remover.style.border =
      "1px solid rgba(255,255,255,.15)";

    remover.style.background =
      "#161225";

    remover.style.color =
      "#fff";

    remover.style.cursor =
      "pointer";

    criar.addEventListener(
      "click",
      async () => {

        criar.disabled =
          true;

        criar.innerHTML =
          "⏳ Criando...";

        try {

          const musicas =
            await criarMusicasTeste();

          alert(
            `${musicas.length} músicas de teste foram criadas!`
          );

          location.reload();

        } catch (error) {

          console.error(error);

          alert(
            "Erro ao criar músicas de teste."
          );

          criar.disabled =
            false;

          criar.innerHTML =
            "🎵 Criar músicas de teste";
        }
      }
    );

    remover.addEventListener(
      "click",
      removerMusicasTeste
    );

    container.appendChild(
      criar
    );

    container.appendChild(
      remover
    );

    header.appendChild(
      container
    );
  }

  /* ============================================================
     API
     ============================================================ */

  window.NTP_TEST_MUSIC = {
    criar: criarMusicasTeste,
    remover: removerMusicasTeste
  };

  /* ============================================================
     START
     ============================================================ */

  document.addEventListener(
    "DOMContentLoaded",
    async () => {

      try {
        await abrirBanco();
        criarBotoes();

        console.log(
          "%c[NTP RADIO OS] Sistema de músicas de teste carregado.",
          "color:#a66bff;font-weight:bold;"
        );

      } catch (error) {

        console.error(
          "[MÚSICAS TESTE]",
          error
        );
      }
    }
  );

})();
