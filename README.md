# AIR Threat Map

Standalone web interface for visualizing **source-reported air-threat information** for the Kharkiv region, with a live air-raid alert indicator for **Kharkiv city and the Kharkiv territorial community**.

**Live map:** https://deafinicio.github.io/air-threat-map/

---

## 🇺🇦 Українська

**AIR Threat Map** — окремий standalone вебпроєкт для візуалізації повідомлень про повітряні загрози з відкритого Telegram-джерела після їх серверної обробки.

Система відображає:

- активні source-reported повітряні загрози;
- географічні орієнтири з повідомлень;
- explicit Telegram reply-linked tracks;
- історичні точки та terminal statuses;
- aggregate reports для груп повітряних об'єктів;
- derived midpoint/centroid references для окремих неоднозначних географічних формулювань;
- Харківську кільцеву дорогу як окремий cartographic reference;
- статус повітряної тривоги для **м. Харків та Харківської територіальної громади**.

Frontend розміщений на **GitHub Pages**. Collector, parser/processor, SQLite database та FastAPI API працюють окремо на сервері.

> **Важливо:** AIR Threat Map не є радаром, не отримує підтверджену військову телеметрію та не прогнозує фізичні траєкторії повітряних об'єктів. Маркери й лінії є візуальним представленням інформації з відкритих повідомлень. Карта не призначена для планування місій, маршрутів пересування, визначення безпечних зон або інших safety-critical рішень. Під час повітряної тривоги керуйтеся офіційними повідомленнями та правилами цивільного захисту.

### Документація

**[Детальна технічна документація українською →](docs/README_UA.md)**

**[Detailed technical documentation in English →](docs/README_EN.md)**

---

## 🇬🇧 English

**AIR Threat Map** is a standalone web project for visualizing source-reported air-threat information from a public Telegram source after server-side processing.

The system displays:

- active source-reported air threats;
- geographic references extracted from reports;
- explicit Telegram reply-linked tracks;
- historical positions and terminal statuses;
- aggregate reports for groups of airborne objects;
- derived midpoint/centroid references for selected ambiguous geographic descriptions;
- the Kharkiv ring road as a cartographic reference;
- the air-raid alert status for **Kharkiv city and the Kharkiv territorial community**.

The frontend is hosted on **GitHub Pages**. The collector, parser/processor, SQLite database, and FastAPI API run separately on the backend server.

> **Important:** AIR Threat Map is not a radar system, does not receive verified military telemetry, and does not predict physical trajectories of airborne objects. Markers and lines are visual representations of information extracted from public source reports. The map must not be used for mission planning, route planning, determining safe areas, or other safety-critical decisions. During an air alert, follow official civil-protection instructions and official alert channels.

### Documentation

**[Детальна технічна документація українською →](docs/README_UA.md)**

**[Detailed technical documentation in English →](docs/README_EN.md)**

---

## Repository structure

```text
air-threat-map/
├── index.html
├── air-mode.js
├── kharkiv-ring-road.geojson
├── README.md
└── docs/
    ├── README_UA.md
    └── README_EN.md
```

## Public links

- **Live map:** https://deafinicio.github.io/air-threat-map/
- **Repository:** https://github.com/deafinicio/air-threat-map

---

AIR Threat Map is an informational visualization project and does not replace official warning systems.