(function () {
  const units = window.WORDLY_WISE_UNITS || {};
  const unitOrder = ["1", "2", "3", "4", "5", "6"];
  let voices = [];

  document.addEventListener("DOMContentLoaded", () => {
    loadVoices();

    if ("speechSynthesis" in window) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    const unitList = document.getElementById("unit-list");
    const wordContainer = document.getElementById("word-container");

    if (unitList) {
      renderHome(unitList);
      makePageHeaderSpeakable();
    }

    if (wordContainer) {
      renderUnitPage(wordContainer);
    }
  });

  function loadVoices() {
    if (!("speechSynthesis" in window)) {
      voices = [];
      return;
    }

    voices = window.speechSynthesis.getVoices();
  }

  function renderHome(unitList) {
    unitList.textContent = "";

    unitOrder.forEach(unitId => {
      const unit = units[unitId];

      if (!unit) {
        return;
      }

      unitList.appendChild(createUnitCard(unitId, unit));
    });
  }

  function makePageHeaderSpeakable() {
    const pageHeader = document.querySelector(".page-header h1");
    if (pageHeader && pageHeader.textContent) {
      const text = pageHeader.textContent;
      pageHeader.textContent = "";
      pageHeader.appendChild(createSpeakableText(text));
    }
  }

  function createUnitCard(unitId, unit) {
    const firstWord = unit.words[0]?.word || "";
    const lastWord = unit.words[unit.words.length - 1]?.word || "";
    const card = document.createElement("a");
    card.className = "unit-card";
    card.href = `unit.html?unit=${unitId}`;

    const titleGroup = document.createElement("div");
    const title = document.createElement("h2");
    title.className = "unit-card-title";
    title.appendChild(createSpeakableText(unit.title));

    const count = document.createElement("p");
    count.className = "unit-card-count";
    count.appendChild(document.createTextNode(`${unit.words.length} `));
    count.appendChild(createSpeakableText("words"));

    const range = document.createElement("p");
    range.className = "unit-card-range";
    range.appendChild(createSpeakableText(`${firstWord} - ${lastWord}`));

    titleGroup.appendChild(title);
    titleGroup.appendChild(count);
    card.appendChild(titleGroup);
    card.appendChild(range);

    return card;
  }

  function renderUnitPage(wordContainer) {
    const unitId = getUnitIdFromQuery();
    const unit = units[unitId];
    const title = document.getElementById("unit-title");
    const count = document.getElementById("unit-count");
    const error = document.getElementById("unit-error");

    wordContainer.textContent = "";

    if (!unit) {
      document.title = "Wordly Wise Unit";
      if (title) title.textContent = "Wordly Wise";
      if (count) count.textContent = "";
      if (error) error.hidden = false;
      return;
    }

    document.title = `Wordly Wise ${unit.title}`;
    if (title) {
      title.textContent = "";
      title.appendChild(createSpeakableText("Wordly Wise"));
      title.appendChild(document.createTextNode(" "));
      title.appendChild(createSpeakableText(unit.title));
    }
    if (count) {
      count.textContent = "";
      count.appendChild(document.createTextNode(`${unit.words.length} `));
      count.appendChild(createSpeakableText("words"));
    }
    if (error) error.hidden = true;

    unit.words.forEach(item => {
      wordContainer.appendChild(createWordCard(item));
    });
  }

  function getUnitIdFromQuery() {
    const params = new URLSearchParams(window.location.search);
    const rawUnit = params.get("unit") || "4";
    return rawUnit.replace(/^unit/i, "");
  }

  function createWordCard(item) {
    const card = document.createElement("div");
    card.className = "card";

    const word = createSpeakableText(item.word, "word");

    const buttonGroup = document.createElement("div");
    buttonGroup.className = "button-group";

    const definitionBtn = document.createElement("button");
    definitionBtn.type = "button";
    definitionBtn.textContent = "Definition";

    const translationBtn = document.createElement("button");
    translationBtn.type = "button";
    translationBtn.textContent = "中文";

    const definitionBox = createDefinitionBox(item);
    const translationBox = createTranslationBox(item);

    definitionBtn.addEventListener("click", () => {
      const isVisible = toggleBox(definitionBox);
      definitionBtn.textContent = isVisible ? "隱藏 Definition" : "Definition";
    });

    translationBtn.addEventListener("click", () => {
      const isVisible = toggleBox(translationBox);
      translationBtn.textContent = isVisible ? "隱藏中文" : "中文";
    });

    buttonGroup.appendChild(definitionBtn);
    buttonGroup.appendChild(translationBtn);
    card.appendChild(word);
    card.appendChild(buttonGroup);
    card.appendChild(definitionBox);
    card.appendChild(translationBox);

    return card;
  }

  function createDefinitionBox(item) {
    const box = document.createElement("div");
    box.className = "definition-box";

    addLabeledText(box, "English Definition:", item.definition, "en");
    box.appendChild(document.createElement("br"));
    box.appendChild(document.createElement("br"));
    addLabeledText(box, "English Sentence:", item.sentence, "en");

    return box;
  }

  function createTranslationBox(item) {
    const box = document.createElement("div");
    box.className = "translation-box";

    addLabeledText(box, "中文意思：", item.translation);

    return box;
  }

  function addLabeledText(parent, labelText, bodyText, lang) {
    const label = document.createElement("span");
    label.className = "label";
    label.textContent = labelText;

    parent.appendChild(label);
    parent.appendChild(document.createElement("br"));
    if (lang) {
      parent.appendChild(createSpeakableText(bodyText));
    } else {
      parent.appendChild(document.createTextNode(bodyText));
    }
  }

  function createSpeakableText(text, className = "") {
    const element = document.createElement("span");
    element.className = ["speakable-text", className].filter(Boolean).join(" ");
    element.tabIndex = 0;
    element.setAttribute("role", "button");
    element.setAttribute("aria-label", `Speak ${text}`);
    element.lang = "en";
    element.textContent = text;
    element.addEventListener("click", event => {
      event.preventDefault();
      event.stopPropagation();
      speak(text);
    });
    element.addEventListener("keydown", event => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        event.stopPropagation();
        speak(text);
      }
    });

    return element;
  }

  function toggleBox(box) {
    box.classList.toggle("is-visible");
    return box.classList.contains("is-visible");
  }

  function getEnglishVoice() {
    let voice = voices.find(item => item.name.includes("Samantha"));
    if (voice) return voice;

    voice = voices.find(item => item.lang && item.lang.toLowerCase().startsWith("en"));
    if (voice) return voice;

    return voices[0];
  }

  function speak(text) {
    if (!("speechSynthesis" in window) || !("SpeechSynthesisUtterance" in window)) {
      return;
    }

    window.speechSynthesis.cancel();

    const utter = new SpeechSynthesisUtterance(text);
    const voice = getEnglishVoice();

    if (voice) {
      utter.voice = voice;
      utter.lang = voice.lang;
    } else {
      utter.lang = "en-US";
    }

    utter.rate = 0.85;
    utter.pitch = 1;
    utter.volume = 1;

    window.speechSynthesis.speak(utter);
  }
})();
