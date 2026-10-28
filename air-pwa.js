(function () {
  "use strict";
  // The script lives beside the manifest, worker and offline page, including on GitHub Pages.
  const base = new URL("./", document.currentScript.src);
  const copy = {
    uk: {
      open: "Додати мапу на головний екран", title: "Мапа як застосунок", close: "Закрити",
      intro: "Відкривайте мапу з власної іконки, в окремому вікні без панелі браузера.",
      platforms: "Пристрій для встановлення", install: "Встановити застосунок",
      android: ["Відкрийте мапу у Chrome або іншому браузері з підтримкою встановлення.", "Натисніть «Встановити застосунок» нижче, якщо кнопка доступна. Або відкрийте меню браузера ⋮ → «Додати на головний екран» / «Встановити застосунок».", "Підтвердьте встановлення. Іконка AIR Map з’явиться серед ваших застосунків."],
      ios: ["Відкрийте мапу в Safari на iPhone або iPad.", "Натисніть «Поділитися» (квадрат зі стрілкою вгору). За потреби спочатку відкрийте меню сторінки.", "Виберіть «На початковий екран». Якщо є перемикач «Відкрити як вебзастосунок», залиште його ввімкненим. Натисніть «Додати»."],
      note: "Для актуальних даних потрібен інтернет. Встановлення не додає сповіщень і не замінює офіційні повідомлення про тривогу.",
      dismissed: "Встановлення скасовано. Можна скористатися меню браузера або спробувати пізніше.",
      unavailable: "Браузер зараз не відкрив встановлення. Скористайтеся кроками вище.",
      accepted: "Запит на встановлення підтверджено."
    },
    en: {
      open: "Add the map to your home screen", title: "Use the map as an app", close: "Close",
      intro: "Launch the map from its own icon in a separate window without the browser toolbar.",
      platforms: "Installation device", install: "Install app",
      android: ["Open the map in Chrome or another browser that supports installation.", "Use the Install app button below when available. Or open the browser menu ⋮ → Add to Home screen / Install app.", "Confirm installation. AIR Map will appear among your apps."],
      ios: ["Open the map in Safari on your iPhone or iPad.", "Tap Share (the square with an upward arrow). You may need to open the page menu first.", "Choose Add to Home Screen. Leave Open as Web App enabled if that option is shown, then tap Add."],
      note: "An internet connection is needed for current data. Installing does not enable notifications or replace official air raid alerts.",
      dismissed: "Installation dismissed. Use the browser menu or try again later.",
      unavailable: "The browser could not open installation right now. Follow the steps above.",
      accepted: "Installation request accepted."
    }
  };
  let promptEvent = null;
  let installed = false;
  let button, dialog, title, intro, note, steps, nativeButton, status, closeButton, platforms;
  let lastFocus = null;
  let statusKey = "";
  const displayMode = window.matchMedia ? window.matchMedia("(display-mode: standalone)") : null;
  let platform = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1) ? "ios" : "android";
  const isStandalone = () => installed || Boolean(navigator.standalone) || Boolean(displayMode && displayMode.matches);
  const strings = () => copy[window.airLanguage && window.airLanguage() === "en" ? "en" : "uk"];

  function render() {
    if (!button) return;
    const text = strings();
    button.hidden = isStandalone();
    button.title = text.open;
    button.setAttribute("aria-label", text.open);
    title.textContent = text.title;
    intro.textContent = text.intro;
    note.textContent = text.note;
    closeButton.setAttribute("aria-label", text.close);
    platforms.setAttribute("aria-label", text.platforms);
    platforms.querySelectorAll("button").forEach(el => el.setAttribute("aria-pressed", String(el.dataset.platform === platform)));
    steps.replaceChildren(...text[platform].map(value => {
      const item = document.createElement("li"); item.textContent = value; return item;
    }));
    nativeButton.textContent = text.install;
    nativeButton.hidden = !promptEvent || platform === "ios" || isStandalone();
    status.textContent = text[statusKey] || "";
  }

  function close() {
    if (!dialog || !dialog.open) return;
    if (typeof dialog.close === "function") dialog.close();
    else dialog.removeAttribute("open");
    const target = lastFocus && !lastFocus.hidden ? lastFocus : document.querySelector("[data-air-language]");
    if (target) target.focus();
  }

  async function install() {
    const event = promptEvent;
    if (!event) return;
    promptEvent = null;
    render();
    try {
      // Must run directly from the user's click, before awaiting anything else.
      await event.prompt();
      const choice = await event.userChoice;
      statusKey = choice.outcome === "accepted" ? "accepted" : "dismissed";
      if (choice.outcome === "accepted") { installed = true; render(); close(); }
    } catch (_) { statusKey = "unavailable"; }
    render();
  }

  window.addEventListener("beforeinstallprompt", event => {
    event.preventDefault();
    promptEvent = event;
    render();
  });
  window.addEventListener("appinstalled", () => {
    installed = true; promptEvent = null; render(); close();
  });
  function displayChanged() { if (isStandalone()) close(); render(); }
  if (displayMode && displayMode.addEventListener) displayMode.addEventListener("change", displayChanged);
  else if (displayMode && displayMode.addListener) displayMode.addListener(displayChanged);
  window.addEventListener("airlanguagechange", render);

  function init() {
    const controls = document.querySelector(".icon-control");
    if (!controls) return;
    button = document.createElement("button");
    button.id = "air-install-open";
    button.type = "button";
    button.setAttribute("aria-haspopup", "dialog");
    button.setAttribute("aria-controls", "air-install-dialog");
    button.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M12 3v12m-4-4 4 4 4-4M5 15v5h14v-5"/></svg><span>APP</span>';
    // Keep APP above the other controls, clear of the bottom-right legend on phones.
    controls.prepend(button);
    dialog = document.createElement("dialog");
    dialog.id = "air-install-dialog";
    dialog.className = "air-install-dialog";
    dialog.setAttribute("aria-labelledby", "air-install-title");
    dialog.setAttribute("aria-describedby", "air-install-intro");
    dialog.innerHTML = '<header><img alt="" width="44" height="44"><h2 id="air-install-title"></h2><button type="button" class="air-install-close">×</button></header><p id="air-install-intro"></p><div class="air-install-platforms" role="group"><button type="button" data-platform="android">Android</button><button type="button" data-platform="ios">iPhone / iPad</button></div><ol></ol><p class="air-install-note"></p><button type="button" class="air-install-native" hidden></button><p class="air-install-status" role="status"></p>';
    dialog.querySelector("img").src = new URL("apple-touch-icon.png", base).href;
    document.body.appendChild(dialog);
    title = dialog.querySelector("h2"); intro = dialog.querySelector("#air-install-intro");
    note = dialog.querySelector(".air-install-note"); steps = dialog.querySelector("ol");
    nativeButton = dialog.querySelector(".air-install-native"); status = dialog.querySelector(".air-install-status");
    closeButton = dialog.querySelector(".air-install-close"); platforms = dialog.querySelector(".air-install-platforms");
    button.addEventListener("click", () => {
      lastFocus = document.activeElement;
      statusKey = ""; render();
      if (typeof dialog.showModal === "function") dialog.showModal();
      else {
        dialog.classList.add("air-install-fallback"); dialog.setAttribute("open", "");
        dialog.setAttribute("role", "dialog"); dialog.setAttribute("aria-modal", "true");
      }
      closeButton.focus();
    });
    closeButton.addEventListener("click", close);
    dialog.addEventListener("cancel", event => { event.preventDefault(); close(); });
    dialog.addEventListener("click", event => {
      if (event.target !== dialog) return;
      const r = dialog.getBoundingClientRect();
      if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) close();
    });
    dialog.addEventListener("keydown", event => {
      if (event.key === "Escape") { event.preventDefault(); close(); }
      if (event.key !== "Tab") return;
      const buttons = [...dialog.querySelectorAll("button")].filter(el => !el.hidden);
      const first = buttons[0], last = buttons[buttons.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    });
    platforms.querySelectorAll("button").forEach(el => el.addEventListener("click", () => {
      platform = el.dataset.platform; render();
    }));
    nativeButton.addEventListener("click", install);
    render();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, {once: true});
  else init();

  function registerWorker() {
    if (!("serviceWorker" in navigator) || !window.isSecureContext) return;
    navigator.serviceWorker.register(new URL("sw.js", base).href, {
      scope: base.href, updateViaCache: "none"
    }).catch(error => console.warn("PWA offline page unavailable:", error));
  }
  if (document.readyState === "complete") registerWorker();
  else window.addEventListener("load", registerWorker, {once: true});
})();
