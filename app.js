const SCRIPT_URL = "script.txt";

const scriptEl = document.querySelector("#script");
const scriptTitleEl = document.querySelector("#script-title");
const scriptMetaEl = document.querySelector("#script-meta");
const sceneSelect = document.querySelector("#scene-select");
const prevSceneButton = document.querySelector("#prev-scene");
const nextSceneButton = document.querySelector("#next-scene");
const fontSize = document.querySelector("#font-size");
const fontFamily = document.querySelector("#font-family");
const themeToggle = document.querySelector("#theme-toggle");
const directionsToggle = document.querySelector("#directions-toggle");
const menuToggle = document.querySelector("#menu-toggle");
const controlsPanel = document.querySelector("#controls-panel");
const topButton = document.querySelector("#top-button");
const characterButtons = [...document.querySelectorAll(".character-filter")];
const clearFocusButton = document.querySelector("#clear-focus");

const CHARACTER_COLOURS = {
  LEON: "leon",
  JANE: "jane"
};

let currentScenes = [];
let activeCharacter = null;

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function slugify(value, index) {
  const base = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `${base || "scene"}-${index + 1}`;
}

function isSceneHeading(line) {
  return /^\.(?:SCENE\s+\d+)/i.test(line) || /^(INT\.|EXT\.|INT\.\/EXT\.)/.test(line);
}

function isCharacterCue(line) {
  return /^[A-Z][A-Z0-9 .'\-()]+$/.test(line)
    && !line.endsWith(":")
    && !isSceneHeading(line)
    && !["FADE TO BLACK.", "THE END", "LAKERS LODGE"].includes(line);
}

function baseCharacter(cue) {
  return cue.replace(/\s*\(.*?\)\s*/g, "").trim();
}

function parseMetadata(lines) {
  const metadata = {};
  let cursor = 0;

  while (cursor < lines.length) {
    const line = lines[cursor].trim();
    const match = line.match(/^([A-Za-z ]+):\s*(.*)$/);

    if (!match) break;

    metadata[match[1].toLowerCase()] = match[2];
    cursor += 1;
  }

  while (cursor < lines.length && lines[cursor].trim() === "") cursor += 1;
  return { metadata, cursor };
}

function parseScript(source) {
  const lines = source.replace(/\r\n?/g, "\n").split("\n");
  const { metadata, cursor: initialCursor } = parseMetadata(lines);
  const blocks = [];
  const scenes = [];
  let cursor = initialCursor;
  let sceneIndex = 0;

  while (cursor < lines.length) {
    const line = lines[cursor].trim();

    if (!line) {
      cursor += 1;
      continue;
    }

    if (isSceneHeading(line)) {
      const id = slugify(line, sceneIndex);
      scenes.push({ id, title: line, number: sceneIndex + 1 });
      blocks.push({ type: "scene", text: line, id, number: sceneIndex + 1 });
      sceneIndex += 1;
      cursor += 1;
      continue;
    }

    if (isCharacterCue(line)) {
      const cue = line;
      const character = baseCharacter(cue);
      const parentheticals = [];
      const dialogue = [];
      cursor += 1;

      while (cursor < lines.length) {
        const next = lines[cursor].trim();

        if (!next || isSceneHeading(next) || isCharacterCue(next)) break;

        if (/^\(.*\)$/.test(next)) {
          parentheticals.push(next);
        } else {
          dialogue.push(next);
        }
        cursor += 1;
      }

      blocks.push({
        type: "dialogue",
        cue,
        character,
        parentheticals,
        dialogue: dialogue.join(" ")
      });
      continue;
    }

    if (/^\*.*\*$/.test(line)) {
      blocks.push({ type: "note", text: line.slice(1, -1) });
      cursor += 1;
      continue;
    }

    if (["TITLE OVER:", "FADE TO BLACK.", "THE END", "DISSOLVE TO:", "LAKERS LODGE"].includes(line)) {
      blocks.push({ type: "centered", text: line });
      cursor += 1;
      continue;
    }

    const actionLines = [line];
    cursor += 1;

    while (cursor < lines.length) {
      const next = lines[cursor].trim();
      if (!next || isSceneHeading(next) || isCharacterCue(next)) break;
      if (/^\*.*\*$/.test(next)) break;
      if (["TITLE OVER:", "FADE TO BLACK.", "THE END", "DISSOLVE TO:", "LAKERS LODGE"].includes(next)) break;
      actionLines.push(next);
      cursor += 1;
    }

    blocks.push({ type: "action", text: actionLines.join(" ") });
  }

  return { metadata, blocks, scenes };
}

function renderScript(source) {
  const { metadata, blocks, scenes } = parseScript(source);
  currentScenes = scenes;

  const title = metadata.title || "Lakers Lodge";
  const revision = metadata.revision || "";
  const date = metadata["draft date"] || "";

  scriptTitleEl.textContent = title;
  scriptMetaEl.textContent = [revision, date].filter(Boolean).join(" • ") || "Rehearsal script";
  document.title = `${title} — Rehearsal Script`;

  const body = blocks.map((block) => {
    if (block.type === "scene") {
      return `<h2 class="scene-heading" id="${block.id}" data-scene="${block.number}">
        ${escapeHtml(block.text.replace(/^\./, ""))}
      </h2>`;
    }

    if (block.type === "dialogue") {
      const charClass = CHARACTER_COLOURS[block.character] || "other";
      const parentheticals = block.parentheticals
        .map((item) => `<div class="parenthetical">${escapeHtml(item)}</div>`)
        .join("");

      return `<section class="dialogue-block ${charClass}" data-character="${escapeHtml(block.character)}">
        <div class="character">${escapeHtml(block.cue)}</div>
        ${parentheticals}
        <p class="dialogue">${escapeHtml(block.dialogue)}</p>
      </section>`;
    }

    if (block.type === "note") {
      return `<aside class="note">${escapeHtml(block.text)}</aside>`;
    }

    if (block.type === "centered") {
      return `<div class="centered">${escapeHtml(block.text)}</div>`;
    }

    return `<p class="action">${escapeHtml(block.text)}</p>`;
  }).join("");

  scriptEl.innerHTML = body;
  populateSceneNavigation(scenes);
  applyCharacterFocus();
  observeScenes();
}

function populateSceneNavigation(scenes) {
  sceneSelect.innerHTML = `<option value="">Choose a scene…</option>` +
    scenes.map((scene) => (
      `<option value="${scene.id}">${scene.number}. ${escapeHtml(scene.title.replace(/^\./, ""))}</option>`
    )).join("");
}

function moveScene(offset) {
  if (!currentScenes.length) return;

  const currentId = sceneSelect.value;
  let index = currentScenes.findIndex((scene) => scene.id === currentId);

  if (index < 0) index = offset > 0 ? -1 : currentScenes.length;
  const nextIndex = Math.min(currentScenes.length - 1, Math.max(0, index + offset));
  jumpToScene(currentScenes[nextIndex].id);
}

function jumpToScene(id) {
  if (!id) return;
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  if (window.innerWidth <= 980) closeControls();
}

function setTheme(theme) {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem("ll-theme", theme);
  themeToggle.textContent = theme === "dark" ? "Light" : "Dark";
}

function setDirectionsHidden(hidden) {
  document.body.classList.toggle("hide-directions", hidden);
  directionsToggle.setAttribute("aria-pressed", String(hidden));
  directionsToggle.textContent = hidden ? "Show directions" : "Hide directions";
  localStorage.setItem("ll-hide-directions", String(hidden));
}

function setFontSize(value) {
  document.documentElement.style.setProperty("--font-size", `${value}px`);
  fontSize.value = value;
  localStorage.setItem("ll-font-size", value);
}

function setFontFamily(value) {
  const fontStacks = {
    "Courier Prime": '"Courier Prime", "Courier New", monospace',
    "Roboto Mono": '"Roboto Mono", monospace',
    "IBM Plex Mono": '"IBM Plex Mono", monospace',
    "Source Code Pro": '"Source Code Pro", monospace',
    "Inter": 'Inter, system-ui, sans-serif',
    "Roboto": 'Roboto, system-ui, sans-serif',
    "Lora": 'Lora, Georgia, serif',
    "Merriweather": 'Merriweather, Georgia, serif'
  };

  document.documentElement.style.setProperty("--script-font", fontStacks[value] || fontStacks["Courier Prime"]);
  fontFamily.value = value;
  localStorage.setItem("ll-font-family", value);
}

function setCharacterFocus(character) {
  activeCharacter = character;
  characterButtons.forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.character === character));
  });
  applyCharacterFocus();
}

function applyCharacterFocus() {
  const blocks = [...document.querySelectorAll(".dialogue-block")];
  document.body.classList.toggle("focus-character", Boolean(activeCharacter));

  blocks.forEach((block) => {
    block.classList.toggle("is-focused", block.dataset.character === activeCharacter);
  });
}

function openControls() {
  controlsPanel.classList.add("open");
  menuToggle.setAttribute("aria-expanded", "true");
  menuToggle.textContent = "Close";
}

function closeControls() {
  controlsPanel.classList.remove("open");
  menuToggle.setAttribute("aria-expanded", "false");
  menuToggle.textContent = "Options";
}

function observeScenes() {
  const headings = [...document.querySelectorAll(".scene-heading")];
  if (!headings.length) return;

  const observer = new IntersectionObserver((entries) => {
    const visible = entries
      .filter((entry) => entry.isIntersecting)
      .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];

    if (!visible) return;
    sceneSelect.value = visible.target.id;
  }, {
    rootMargin: "-18% 0px -72% 0px",
    threshold: 0
  });

  headings.forEach((heading) => observer.observe(heading));
}

async function loadScript() {
  scriptEl.innerHTML = `<div class="loading">Loading script…</div>`;

  try {
    const response = await fetch(`${SCRIPT_URL}?v=${Date.now()}`, { cache: "no-store" });
    if (!response.ok) throw new Error(`Could not load ${SCRIPT_URL}`);
    renderScript(await response.text());
  } catch (error) {
    scriptEl.innerHTML = `
      <div class="error">
        <strong>The script could not be loaded.</strong><br>
        Make sure <code>script.txt</code> is in the same folder as this page.
      </div>
    `;
  }
}

sceneSelect.addEventListener("change", (event) => jumpToScene(event.target.value));
prevSceneButton.addEventListener("click", () => moveScene(-1));
nextSceneButton.addEventListener("click", () => moveScene(1));

themeToggle.addEventListener("click", () => {
  const current = document.documentElement.dataset.theme || "light";
  setTheme(current === "dark" ? "light" : "dark");
});

directionsToggle.addEventListener("click", () => {
  setDirectionsHidden(!document.body.classList.contains("hide-directions"));
});

fontSize.addEventListener("input", (event) => setFontSize(event.target.value));
fontFamily.addEventListener("change", (event) => setFontFamily(event.target.value));

characterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const character = button.dataset.character;
    setCharacterFocus(activeCharacter === character ? null : character);
  });
});

clearFocusButton.addEventListener("click", () => setCharacterFocus(null));

menuToggle.addEventListener("click", () => {
  controlsPanel.classList.contains("open") ? closeControls() : openControls();
});

topButton.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));

window.addEventListener("scroll", () => {
  topButton.classList.toggle("visible", window.scrollY > 900);
}, { passive: true });

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeControls();
});

const storedTheme = localStorage.getItem("ll-theme");
const systemDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches;
setTheme(storedTheme || (systemDark ? "dark" : "light"));
setFontSize(localStorage.getItem("ll-font-size") || "20");
setFontFamily(localStorage.getItem("ll-font-family") || "Courier Prime");
setDirectionsHidden(localStorage.getItem("ll-hide-directions") === "true");

loadScript();
