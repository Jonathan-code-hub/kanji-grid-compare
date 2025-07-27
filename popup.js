let knownKanji = [];
let kanjiMeta = {};

// Load known kanji
fetch(chrome.runtime.getURL('known-kanji.json'))
  .then(response => response.json())
  .then(data => knownKanji = data);

// Load joyo kanji metadata
fetch(chrome.runtime.getURL('joyo_kanji.json'))
  .then(response => response.json())
  .then(data => kanjiMeta = data);

function extractKanji(text) {
  return Array.from(text).filter(c => /[\u4e00-\u9fff]/.test(c));
}

// Convert frequency to color using a simple gradient function
function getColorFromFrequency(freq) {
  // Normalize frequency range (e.g., 1 to 2500 → 0 to 1)
  const minFreq = 1;
  const maxFreq = 2500;
  const t = (maxFreq - freq) / (maxFreq - minFreq); // higher freq → higher t

  // Simple interpolation between #fa709a and #fee140
  const start = [250, 112, 154]; // #fa709a
  const end = [254, 225, 64];   // #fee140

  const r = Math.round(start[0] + t * (end[0] - start[0]));
  const g = Math.round(start[1] + t * (end[1] - start[1]));
  const b = Math.round(start[2] + t * (end[2] - start[2]));

  return `rgb(${r}, ${g}, ${b})`;
}

document.getElementById("checkButton").addEventListener("click", async () => {
  const grid = document.getElementById("kanjiGrid");
  grid.innerHTML = "Loading...";

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => document.body.innerText,
  }, (results) => {
    const pageText = results[0].result;
    const pageKanji = [...new Set(extractKanji(pageText))];
    const newKanji = pageKanji.filter(k => !knownKanji.includes(k));

    // Sort by frequency (lower number = more common)
    newKanji.sort((a, b) => {
      const fa = kanjiMeta[a]?.freq ?? 9999;
      const fb = kanjiMeta[b]?.freq ?? 9999;
      return fa - fb;
    });

    grid.innerHTML = "";

    if (newKanji.length === 0) {
      grid.innerText = "No new kanji found!";
      return;
    }

    newKanji.forEach(kanji => {
      const el = document.createElement("div");
      el.textContent = kanji;

      const freq = kanjiMeta[kanji]?.freq ?? 9999;
      el.style.backgroundColor = getColorFromFrequency(freq);
      el.style.borderRadius = "4px";
      el.style.padding = "4px";

      grid.appendChild(el);
    });
  });
});

