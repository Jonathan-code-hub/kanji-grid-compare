// Load known kanji from local JSON file or localStorage
let knownKanji = [];

fetch(chrome.runtime.getURL('known-kanji.json'))
  .then(response => response.json())
  .then(data => knownKanji = data);

function extractKanji(text) {
  return Array.from(text).filter(c => /[\u4e00-\u9fff]/.test(c));
}

document.getElementById("checkButton").addEventListener("click", async () => {
  const output = document.getElementById("output");
  output.innerText = "Scanning..."; // Clear or update UI immediately

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => document.body.innerText,
  }, (results) => {
    const pageText = results[0].result;
    const pageKanji = [...new Set(extractKanji(pageText))];
    const newKanji = pageKanji.filter(k => !knownKanji.includes(k));

    output.innerText = `New Kanji (${newKanji.length}):\n${newKanji.join(' ')}`;
  });
});
