(function () {
  "use strict";
  const messages = {
  "AIR THREAT // TRACK SYS": {
    "uk": "ПОВІТРЯНІ ЗАГРОЗИ // МАПА",
    "en": "AIR THREAT // TRACK SYS"
  },
  "tracks loaded": {
    "uk": "завантажено треків",
    "en": "tracks loaded"
  },
  "active tracks": {
    "uk": "активні треки",
    "en": "active tracks"
  },
  "mapped positions": {
    "uk": "точки на карті",
    "en": "mapped positions"
  },
  "local time": {
    "uk": "місцевий час",
    "en": "local time"
  },
  "date": {
    "uk": "дата",
    "en": "date"
  },
  "● AIR SYNCING": {
    "uk": "● СИНХРОНІЗАЦІЯ",
    "en": "● AIR SYNCING"
  },
  "● AIR FEED": {
    "uk": "● ПОВІТРЯНІ ДАНІ",
    "en": "● AIR FEED"
  },
  "● DEMO FEED": {
    "uk": "● ДЕМО-ДАНІ",
    "en": "● DEMO FEED"
  },
  "● DEMO LOADING": {
    "uk": "● ЗАВАНТАЖЕННЯ ДЕМО",
    "en": "● DEMO LOADING"
  },
  "● DEMO FILE ERROR": {
    "uk": "● ПОМИЛКА ДЕМО",
    "en": "● DEMO FILE ERROR"
  },
  "● AIR FEED ERROR": {
    "uk": "● ПОМИЛКА ДАНИХ",
    "en": "● AIR FEED ERROR"
  },
  "AIR DATA // IMPORTANT NOTICE": {
    "uk": "ПОВІТРЯНІ ДАНІ // ВАЖЛИВО",
    "en": "AIR DATA // IMPORTANT NOTICE"
  },
  "AIR THREAT // INFORMATION SYSTEM": {
    "uk": "ПОВІТРЯНІ ЗАГРОЗИ // ІНФОРМАЦІЙНА СИСТЕМА",
    "en": "AIR THREAT // INFORMATION SYSTEM"
  },
  "AIR THREATS": {
    "uk": "ПОВІТРЯНІ ЗАГРОЗИ",
    "en": "AIR THREATS"
  },
  "Air Visual Params": {
    "uk": "Візуальні параметри",
    "en": "Air visual settings"
  },
  "Icon glow": {
    "uk": "Світіння іконок",
    "en": "Icon glow"
  },
  "Glow radius": {
    "uk": "Радіус світіння",
    "en": "Glow radius"
  },
  "Pulse": {
    "uk": "Пульсація",
    "en": "Pulse"
  },
  "Track glow": {
    "uk": "Світіння треку",
    "en": "Track glow"
  },
  "Track width": {
    "uk": "Товщина треку",
    "en": "Track width"
  },
  "Ring road intensity": {
    "uk": "Яскравість кільцевої",
    "en": "Ring road intensity"
  },
  "Kharkiv boundary": {
    "uk": "Яскравість кільцевої дороги",
    "en": "Ring road intensity"
  },
  "Скинути": {
    "uk": "Скинути",
    "en": "Reset"
  },
  "CURRENT POSITION": {
    "uk": "ОСТАННЯ ПОВІДОМЛЕНА ПОЗИЦІЯ",
    "en": "LATEST REPORTED POSITION"
  },
  "HISTORICAL POSITION": {
    "uk": "ІСТОРИЧНА ПОЗИЦІЯ",
    "en": "HISTORICAL POSITION"
  },
  "REPORTED TRACK": {
    "uk": "ТРЕК ЗА ПОВІДОМЛЕННЯМИ",
    "en": "REPORTED TRACK"
  },
  "LOST TRACKING": {
    "uk": "ВТРАЧЕНО ВІДСТЕЖЕННЯ",
    "en": "LOST TRACKING"
  },
  "INTERCEPTED": {
    "uk": "ПЕРЕХОПЛЕНО",
    "en": "INTERCEPTED"
  },
  "FALLEN / IMPACT": {
    "uk": "ПАДІННЯ / ВЛУЧАННЯ",
    "en": "FALL / IMPACT"
  },
  "REACTIVE SHAHED": {
    "uk": "РЕАКТИВНИЙ ШАХЕД",
    "en": "REACTIVE SHAHED"
  },
  "SHAHED": {
    "uk": "ШАХЕД",
    "en": "SHAHED"
  },
  "MOLNIYA": {
    "uk": "МОЛНІЯ",
    "en": "MOLNIYA"
  },
  "KAB": {
    "uk": "КАБ",
    "en": "GUIDED BOMB"
  },
  "MISSILE": {
    "uk": "РАКЕТА",
    "en": "MISSILE"
  },
  "RECON UAV": {
    "uk": "РОЗВІДУВАЛЬНИЙ БПЛА",
    "en": "RECON UAV"
  },
  "TACTICAL AVIATION": {
    "uk": "ТАКТИЧНА АВІАЦІЯ",
    "en": "TACTICAL AVIATION"
  },
  "Повітряна загроза": {
    "uk": "Повітряна загроза",
    "en": "Air threat"
  },
  "SOURCE-REPORTED DIRECTION TARGET": {
    "uk": "НАПРЯМОК, ПОВІДОМЛЕНИЙ ДЖЕРЕЛОМ",
    "en": "SOURCE-REPORTED DIRECTION TARGET"
  },
  "CURRENT REPORTED POSITION": {
    "uk": "ОСТАННЯ ПОВІДОМЛЕНА ПОЗИЦІЯ",
    "en": "LATEST REPORTED POSITION"
  },
  "REPORTED POSITION": {
    "uk": "ПОВІДОМЛЕНА ПОЗИЦІЯ",
    "en": "REPORTED POSITION"
  },
  "DERIVED SOURCE REFERENCE": {
    "uk": "РОЗРАХОВАНИЙ ОРІЄНТИР",
    "en": "DERIVED SOURCE REFERENCE"
  },
  "SOURCE REPORT": {
    "uk": "ПОВІДОМЛЕННЯ ДЖЕРЕЛА",
    "en": "SOURCE REPORT"
  },
  "SOURCE REPORTED FALL / IMPACT": {
    "uk": "ДЖЕРЕЛО ПОВІДОМИЛО ПРО ПАДІННЯ / ВЛУЧАННЯ",
    "en": "SOURCE REPORTED FALL / IMPACT"
  },
  "SOURCE REPORTED INTERCEPTION": {
    "uk": "ДЖЕРЕЛО ПОВІДОМИЛО ПРО ПЕРЕХОПЛЕННЯ",
    "en": "SOURCE REPORTED INTERCEPTION"
  },
  "SOURCE REPORTED LOSS OF TRACKING": {
    "uk": "ДЖЕРЕЛО ПОВІДОМИЛО ПРО ВТРАТУ ВІДСТЕЖЕННЯ",
    "en": "SOURCE REPORTED LOSS OF TRACKING"
  },
  "SOURCE TERMINAL STATUS": {
    "uk": "ЗАВЕРШАЛЬНИЙ СТАТУС ДЖЕРЕЛА",
    "en": "SOURCE TERMINAL STATUS"
  },
  "Тип цілі: не визначений джерелом": {
    "uk": "Тип цілі: не визначений джерелом",
    "en": "Target type: not specified by source"
  },
  "Остання підтверджена джерелом позиція: ": {
    "uk": "Остання повідомлена джерелом позиція: ",
    "en": "Last source-reported position: "
  },
  "Час terminal-повідомлення: ": {
    "uk": "Час завершального повідомлення: ",
    "en": "Closing report time: "
  },
  "Статус: попереднє повідомлення джерела": {
    "uk": "Статус: попереднє повідомлення джерела",
    "en": "Status: preliminary source report"
  },
  "<br>Кількість: ": {
    "uk": "<br>Кількість: ",
    "en": "<br>Count: "
  },
  "<br>Track: ": {
    "uk": "<br>Трек: ",
    "en": "<br>Track: "
  },
  "<br>Thread: ": {
    "uk": "<br>Гілка: ",
    "en": "<br>Thread: "
  },
  "<br>Message: ": {
    "uk": "<br>Повідомлення: ",
    "en": "<br>Message: "
  },
  "Місце: ": {
    "uk": "Місце: ",
    "en": "Place: "
  },
  "Об'єктів у цій групі: ": {
    "uk": "Об'єктів у цій групі: ",
    "en": "Objects in this group: "
  },
  "Орієнтири джерела: ": {
    "uk": "Орієнтири джерела: ",
    "en": "Source landmarks: "
  },
  "Час повідомлення: ": {
    "uk": "Час повідомлення: ",
    "en": "Report time: "
  },
  "Статус треку: ": {
    "uk": "Статус треку: ",
    "en": "Track status: "
  },
  "ACTIVE": {
    "uk": "АКТИВНИЙ",
    "en": "ACTIVE"
  },
  "INACTIVE": {
    "uk": "НЕАКТИВНИЙ",
    "en": "INACTIVE"
  },
  "Згорнути легенду": {
    "uk": "Згорнути легенду",
    "en": "Collapse legend"
  },
  "Розгорнути легенду": {
    "uk": "Розгорнути легенду",
    "en": "Expand legend"
  },
  "Треки: ": {
    "uk": "Треки: ",
    "en": "Tracks: "
  },
  " — клікни по цілі": {
    "uk": " — натисніть на ціль",
    "en": " — click a target"
  },
  "Треки: SEL — клікни по цілі": {
    "uk": "Треки: ВИБ — натисніть на ціль",
    "en": "Tracks: SEL — click a target"
  },
  "Налаштування AIR-візуалізації": {
    "uk": "Налаштування візуалізації",
    "en": "Air visualization settings"
  },
  "Перемкнутися на спостереження за повітряними загрозами": {
    "uk": "Перейти до повітряних загроз",
    "en": "Switch to air threat monitoring"
  },
  "Повернутися до карти мінної небезпеки": {
    "uk": "Повернутися до карти мінної небезпеки",
    "en": "Return to mine risk map"
  },
  "Налаштування heatmap": {
    "uk": "Налаштування теплової карти",
    "en": "Heatmap settings"
  },
  "Демо-дані активні. Натисни, щоб перейти на LIVE.": {
    "uk": "Демо-дані активні. Натисніть для живих даних.",
    "en": "Demo data active. Click to switch to LIVE."
  },
  "Живі дані з сервера. Натисни, щоб перейти на DEMO.": {
    "uk": "Живі дані з сервера. Натисніть для демо.",
    "en": "Live server data. Click to switch to DEMO."
  },
  "KHARKIV CITY / COMMUNITY": {
    "uk": "ХАРКІВ / ГРОМАДА",
    "en": "KHARKIV CITY / COMMUNITY"
  },
  "NO DATA": {
    "uk": "НЕМАЄ ДАНИХ",
    "en": "NO DATA"
  },
  "AIR ALERT": {
    "uk": "ПОВІТРЯНА ТРИВОГА",
    "en": "AIR ALERT"
  },
  "CLEAR": {
    "uk": "ВІДБІЙ",
    "en": "ALL CLEAR"
  },
  "waiting for status": {
    "uk": "очікування статусу",
    "en": "waiting for status"
  },
  "updated ": {
    "uk": "оновлено ",
    "en": "updated "
  },
  "updated —": {
    "uk": "оновлено —",
    "en": "updated —"
  },
  "Dark Ops — Esri": {
    "uk": "Темна — Esri",
    "en": "Dark Ops — Esri"
  },
  "Esri Topographic": {
    "uk": "Топографічна — Esri",
    "en": "Esri Topographic"
  },
  "SEL": {
    "uk": "ВИБ",
    "en": "SEL"
  },
  "ALL": {
    "uk": "УСІ",
    "en": "ALL"
  },
  "OFF": {
    "uk": "ВИМК",
    "en": "OFF"
  },
  "OK": {
    "uk": "ЗРОЗУМІЛО",
    "en": "OK"
  },
  "reported historical positions": {
    "uk": "історичних повідомлених позицій",
    "en": "reported historical positions"
  },
  "recent terminal markers": {
    "uk": "недавніх завершальних маркерів",
    "en": "recent closing markers"
  },
  "backend-active tracks hidden by 30 min LIVE TTL": {
    "uk": "треків приховано після 30 хв без оновлень",
    "en": "tracks hidden after 30 min without updates"
  },
  "TRK mode: ": {
    "uk": "Режим треків: ",
    "en": "Track mode: "
  },
  "Approximate border reference": {
    "uk": "Наближена прив’язка до кордону",
    "en": "Approximate border reference"
  },
  "Reference is the nearest border point, not a confirmed crossing.": {
    "uk": "Орієнтир — найближча точка кордону, а не підтверджене місце перетину.",
    "en": "Reference is the nearest border point, not a confirmed crossing."
  },
  "Aircraft takeoff report": {
    "uk": "Повідомлення про зліт авіації",
    "en": "Aircraft takeoff report"
  },
  "Approximate regional reference": {
    "uk": "Орієнтовний центр області",
    "en": "Approximate regional reference"
  },
  "Карта не відображає підтверджені реальні поточні координати повітряних загроз.": {
    "uk": "Карта не відображає підтверджені реальні поточні координати повітряних загроз.",
    "en": "The map does not show confirmed, actual current coordinates of air threats."
  },
  "Маркери та лінії є візуальним представленням інформації з відкритих повідомлень. Частина точок може бути приблизно розрахована між указаними географічними орієнтирами.": {
    "uk": "Маркери та лінії є візуальним представленням інформації з відкритих повідомлень. Частина точок може бути приблизно розрахована між указаними географічними орієнтирами.",
    "en": "Markers and lines visualize information from public reports. Some points may be approximated between the geographic landmarks mentioned."
  },
  "Інформація може надходити та відображатися з невеликою затримкою, бути неповною або неточною.": {
    "uk": "Інформація може надходити та відображатися з невеликою затримкою, бути неповною або неточною.",
    "en": "Information may arrive or appear with a delay and may be incomplete or inaccurate."
  },
  "Карта має виключно інформаційний характер і не призначена для планування місій, маршрутів пересування, визначення безпечних зон або прийняття рішень, від яких залежить безпека людей.": {
    "uk": "Карта має виключно інформаційний характер і не призначена для планування місій, маршрутів пересування, визначення безпечних зон або прийняття рішень, від яких залежить безпека людей.",
    "en": "The map is for information only. It is not intended for planning missions or travel routes, identifying safe areas, or making decisions affecting people's safety."
  },
  "Під час повітряної тривоги керуйтеся офіційними повідомленнями та правилами цивільного захисту.": {
    "uk": "Під час повітряної тривоги керуйтеся офіційними повідомленнями та правилами цивільного захисту.",
    "en": "During an air raid alert, follow official announcements and civil protection instructions."
  },
  "Візуальна точка розміщена посередині між двома вказаними географічними орієнтирами.": {
    "uk": "Візуальна точка розміщена посередині між двома вказаними географічними орієнтирами.",
    "en": "The visual point is placed halfway between the two reported geographic landmarks."
  },
  "Візуальна точка розміщена в центроїді вказаних географічних орієнтирів.": {
    "uk": "Візуальна точка розміщена в центроїді вказаних географічних орієнтирів.",
    "en": "The visual point is placed at the centroid of the reported geographic landmarks."
  },
  "Це напрямок або географічний орієнтир, прямо вказаний джерелом. ": {
    "uk": "Це напрямок або географічний орієнтир, прямо вказаний джерелом. ",
    "en": "This direction or geographic landmark was explicitly named by the source. "
  },
  "Маркер не означає підтверджену поточну координату об'єкта.": {
    "uk": "Маркер не означає підтверджену поточну координату об'єкта.",
    "en": "The marker does not indicate a confirmed current position of the object."
  },
  "Великий пульсуючий маркер — остання однозначно геоприв'язана reported position цього активного треку.": {
    "uk": "Великий пульсуючий маркер — остання однозначно геоприв'язана повідомлена позиція цього активного треку.",
    "en": "The large pulsing marker is the latest unambiguous, georeferenced source report for this active track."
  },
  "Мала точка — історична reported position. Вона не є прогнозом поточного місцеположення.": {
    "uk": "Мала точка — історична повідомлена позиція. Вона не є прогнозом поточного місцеположення.",
    "en": "The small dot is a historical source-reported position. It is not a prediction of the current location."
  },
  "Маркер показує останню однозначну позицію, повідомлену джерелом до terminal-статусу. ": {
    "uk": "Маркер показує останню однозначну позицію, повідомлену джерелом до завершального статусу. ",
    "en": "The marker shows the last unambiguous source-reported position before the closing status. "
  },
  "Це не точна координата падіння або перехоплення.": {
    "uk": "Це не точна координата падіння або перехоплення.",
    "en": "This is not the exact coordinate of a fall or interception."
  },
  "shahed_reactive": {
    "uk": "Реактивний шахед",
    "en": "Reactive Shahed"
  },
  "reactive_uav": {
    "uk": "Реактивний БПЛА",
    "en": "Jet-powered UAV"
  },
  "attack_uav": {
    "uk": "Ударний БПЛА",
    "en": "Attack UAV"
  },
  "recon_uav": {
    "uk": "Розвідувальний БПЛА",
    "en": "Reconnaissance UAV"
  },
  "uav_unknown": {
    "uk": "БПЛА невизначеного типу",
    "en": "Unidentified UAV"
  },
  "fpv": {
    "uk": "FPV",
    "en": "FPV"
  },
  "molniya": {
    "uk": "Молнія",
    "en": "Molniya"
  },
  "shahed": {
    "uk": "Шахед",
    "en": "Shahed"
  },
  "kab": {
    "uk": "КАБ",
    "en": "Guided bomb"
  },
  "missile": {
    "uk": "Ракета",
    "en": "Missile"
  },
  "tactical_aviation": {
    "uk": "Тактична авіація",
    "en": "Tactical aviation"
  },
  "ballistic_missile": {
    "uk": "Балістична ракета",
    "en": "Ballistic missile"
  }
};

  const STORAGE_KEY = "air-map-language-v1";
  let language = "uk";
  try { language = localStorage.getItem(STORAGE_KEY) === "en" ? "en" : "uk"; } catch (_) {}
  function t(key) { return messages[key] ? messages[key][language] : key; }
  window.airT = t;
  window.airLocale = () => language === "en" ? "en-GB" : "uk-UA";
  window.airLanguage = () => language;
  function apply(root = document) {
    root.querySelectorAll("[data-i18n]").forEach(el => { el.textContent = t(el.dataset.i18n); });
    root.querySelectorAll("[data-i18n-title]").forEach(el => { el.title = t(el.dataset.i18nTitle); });
    document.documentElement.lang = language;
    document.title = language === "uk" ? "Повітряні загрози — Харківщина" : "Air Threat Map — Kharkiv Region";
    document.querySelectorAll("[data-air-language]").forEach(button => {
      button.setAttribute("aria-pressed", String(button.dataset.airLanguage === language));
      button.title = button.dataset.airLanguage === "uk" ? "Українська" : "English";
    });
  }
  window.applyAirTranslations = apply;
  window.setAirLanguage = function(next) {
    if (!["uk", "en"].includes(next)) return;
    language = next;
    try { localStorage.setItem(STORAGE_KEY, language); } catch (_) {}
    apply();
    window.dispatchEvent(new CustomEvent("airlanguagechange", {detail: {language}}));
  };
  function init() {
    document.querySelectorAll("[data-air-language]").forEach(button => {
      button.addEventListener("click", () => window.setAirLanguage(button.dataset.airLanguage));
    });
    apply();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, {once:true});
  else init();
})();
