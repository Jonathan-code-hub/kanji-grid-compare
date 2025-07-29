chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "compare-kanji",
    title: "Compare Kanji to Known Grid",
    contexts: ["selection"]
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "compare-kanji") {
    const selectedText = info.selectionText || "";
    const knownKanji = await getKnownKanji();
    const joyoMap = await getJoyoKanji();

    const uniqueKanji = Array.from(new Set(selectedText.match(/[\u4e00-\u9faf]/g) || []));
    const unknown = uniqueKanji.filter(k => !knownKanji.includes(k));

    // Sort by frequency (lower = more common)
    const sorted = unknown
      .map(k => ({
        char: k,
        freq: joyoMap[k]?.freq ?? Infinity,
        isJoyo: !!joyoMap[k]
      }))
      .sort((a, b) => a.freq - b.freq);

    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: showColoredOverlay,
      args: [sorted]
    });
  }
});

async function getKnownKanji() {
  return new Promise(resolve => {
    chrome.storage.local.get("knownKanji", (data) => {
      resolve(data.knownKanji || []);
    });
  });
}

async function getJoyoKanji() {
  const response = await fetch(chrome.runtime.getURL("joyo_kanji.json"));
  return await response.json();
}


function showColoredOverlay(kanjiList) {
  const container = document.createElement("div");
  container.style.position = "fixed";
  container.style.top = "20px";
  container.style.right = "20px";
  container.style.padding = "12px";
  container.style.background = "#fff";
  container.style.color = "#000";
  container.style.border = "2px solid #333";
  container.style.zIndex = 99999;
  container.style.fontSize = "20px";
  container.style.fontFamily = "sans-serif";
  container.style.boxShadow = "0 0 8px rgba(0,0,0,0.3)";
  container.style.borderRadius = "8px";
  container.style.maxWidth = "300px";
  container.style.display = "grid";
  container.style.gridTemplateColumns = "repeat(auto-fill, minmax(32px, 1fr))";
  container.style.gap = "6px";
  container.style.textAlign = "center";

  for (const entry of kanjiList) {
    const div = document.createElement("div");
    div.textContent = entry.char;

    if (entry.isJoyo && entry.freq !== Infinity) {
      const hue = Math.floor(40 + (entry.freq / 2500) * 60); // Yellow (low freq) to red (high)
      div.style.background = `hsl(${hue}, 100%, 70%)`;
      div.style.color = "#000";
    } else {
      div.style.background = "#ccc";
      div.style.color = "#555";
      div.title = "Non-Jōyō Kanji";
    }

    div.style.borderRadius = "4px";
    div.style.padding = "4px";
    div.style.fontSize = "24px";

    container.appendChild(div);
  }

  document.body.appendChild(container);
  setTimeout(() => container.remove(), 8000);
}

