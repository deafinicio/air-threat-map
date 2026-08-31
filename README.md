# AIR Threat Map

Standalone web interface for visualizing **source-reported air-threat information** for the Kharkiv region, with a live air-raid alert indicator for **Kharkiv city and the Kharkiv territorial community**.

**Live site:** https://deafinicio.github.io/air-threat-map/

> **Important:** this project is an informational visualization system. It is **not radar**, **not verified real-time telemetry**, and **not a trajectory-prediction system**. Markers and lines represent information extracted from public source reports. Some geographic points are derived approximations between named source references. The map must not be used for mission planning, route planning, determining safe areas, or making safety-critical decisions. During an air alert, follow official civil-protection instructions and official alert channels.

---

# 🇺🇦 Українська версія

## 1. Що це за проєкт

**AIR Threat Map** — це окремий standalone-фронтенд для візуалізації повідомлень про повітряні загрози, отриманих із відкритого Telegram-джерела `monitor1654` і попередньо оброблених серверною частиною проєкту.

Система перетворює текстові повідомлення у структуровані події, географічні орієнтири, reply-гілки та картографічні треки. Вона також відображає статус повітряної тривоги для **м. Харків та Харківської територіальної громади** через окремий server-side proxy до Ukraine Alarm API.

Цей репозиторій містить лише **standalone web frontend**. Backend, база даних, Telegram collector, parser/processor та API працюють окремо на Oracle Cloud VM.

---

## 2. Поточний публічний URL

GitHub Pages:

```text
https://deafinicio.github.io/air-threat-map/
```

Репозиторій:

```text
https://github.com/deafinicio/air-threat-map
```

---

## 3. Критичне застереження щодо інтерпретації даних

AIR Threat Map не має доступу до радарних даних, військової телеметрії, треків ППО або підтверджених реальних координат цілей.

Візуалізація будується винятково на основі тексту публічних повідомлень і явних reply-зв’язків між ними.

Тому:

- marker не означає підтверджену фактичну позицію повітряного об’єкта;
- track line не означає фізично виміряну траєкторію польоту;
- `direction_target` не є підтвердженою поточною позицією;
- midpoint/centroid — це лише derived cartographic reference;
- terminal marker не означає встановлену точну координату падіння або перехоплення, якщо джерело її не повідомляло;
- система може відображати інформацію із затримкою;
- джерело може бути неповним або помилятися;
- карта не повинна використовуватися для визначення безпечних маршрутів, прогнозування місця удару або прийняття рішень, від яких залежить безпека людей.

При кожному вході в AIR mode користувач бачить окремий HUD-style disclaimer.

---

## 4. Високорівнева архітектура

```text
Public Telegram source: monitor1654
              │
              ▼
      monitor_collector.py
              │
              ▼
      monitor_messages.db
              │
              ▼
      monitor_processor.py
              │
              ├── monitor_parsed_events
              ├── monitor_branch_events
              ├── monitor_branches
              └── monitor_branch_tracks
              │
              ▼
          FastAPI
              │
              ▼
          Uvicorn
      127.0.0.1:8000
              │
              ▼
            Caddy
          HTTPS proxy
              │
              ▼
/api/monitor/tracks
/api/monitor/debug-track/...
/api/alarm/kharkiv
              │
              ▼
        GitHub Pages
              │
              ▼
          index.html
          air-mode.js
              │
              ▼
            Leaflet
```

---

## 5. Що знаходиться в цьому репозиторії

Поточна standalone-структура мінімальна:

```text
air-threat-map/
├── index.html
├── air-mode.js
├── kharkiv-ring-road.geojson
└── README.md
```

### `index.html`

Відповідає за:

- standalone layout;
- Leaflet initialization;
- HUD top bar;
- local clock/date;
- basemap selector;
- координатні rulers;
- cursor LAT/LON readout;
- lock-on reticle helper;
- standalone AIR visual panel styling;
- Kharkiv city/community alert indicator;
- polling `/api/alarm/kharkiv`;
- loading `air-mode.js`.

### `air-mode.js`

Основний AIR engine. Містить:

- API polling;
- normalization backend payload;
- threat rendering;
- semantic handling of places;
- midpoint/centroid logic;
- reply-linked tracks;
- active/stale filtering;
- aggregate snapshot handling;
- terminal marker handling;
- track selection/display modes;
- visual settings;
- legend;
- disclaimer;
- ring-road linear reference projection;
- historical debug branch support.

### `kharkiv-ring-road.geojson`

GeoJSON-геометрія Харківської кільцевої дороги. Використовується як **linear cartographic reference** для повідомлень, де джерело явно згадує рух уздовж кільцевої.

---

## 6. Standalone mode

`index.html` задає:

```html
<html lang="uk" data-air-standalone="true">
```

`air-mode.js` читає цей прапорець:

```js
const AIR_STANDALONE =
  document.documentElement.dataset.airStandalone === "true";
```

У standalone-режимі:

- MINE UI не використовується;
- немає перемикання `MINE / AIR`;
- AIR запускається автоматично;
- MINE layers не додаються;
- standalone map використовує той самий AIR engine, що й комбінована карта.

Таким чином цей репозиторій дублює AIR-функціонал, але не видаляє і не змінює AIR у початковому `mine-risk-map`.

---

## 7. Backend runtime

Backend працює окремо на Oracle Cloud VM.

Поточний стек:

```text
Ubuntu 24.04
Python 3.12
FastAPI
Uvicorn
SQLite
Caddy
systemd
```

Основний робочий каталог:

```text
/opt/tlk-map
```

Uvicorn слухає лише localhost:

```text
127.0.0.1:8000
```

HTTPS назовні надається через Caddy.

---

## 8. Systemd services

### API

```text
tlk-api.service
```

Поточний запуск:

```text
/opt/tlk-map/.venv/bin/uvicorn api:app --host 127.0.0.1 --port 8000
```

### Monitor collector

```text
monitor-collector.service
```

Збирає raw Telegram messages.

### Monitor processor

```text
monitor-processor.service
```

Парсить повідомлення та перебудовує derived tables / reply branches / branch tracks.

### Legacy collector

На сервері також може бути присутній:

```text
tlk-collector.service
```

Він належить до старої частини системи і не є основним джерелом standalone AIR frontend.

---

## 9. Collector layer

Основний collector:

```text
/opt/tlk-map/monitor_collector.py
```

Collector має максимально точно зберігати raw Telegram message без спроб прогнозувати геометрію.

Критичні поля:

- `message_id`;
- `reply_to_message_id`;
- Telegram timestamp;
- original text;
- службові поля для подальшого parser-а.

Collector — це ingestion layer, а не interpretation layer.

---

## 10. Processor layer

Основний processor:

```text
/opt/tlk-map/monitor_processor.py
```

Він:

1. читає raw Telegram messages;
2. викликає parser;
3. нормалізує threat/status/relation/place semantics;
4. будує reply branches;
5. формує branch tracks;
6. записує derived tables.

Processor перебудовує таблиці через `_next` tables та atomic swap.

Через це **не можна** одночасно запускати ручний `--once` і працюючий `monitor-processor.service`.

Безпечний manual rebuild:

```bash
sudo systemctl stop monitor-processor.service
./.venv/bin/python3 monitor_processor.py --once
sudo systemctl start monitor-processor.service
```

---

## 11. SQLite

Основна monitor database:

```text
/opt/tlk-map/monitor_messages.db
```

Ключові таблиці:

```text
messages
monitor_parsed_events
monitor_branch_events
monitor_branches
monitor_branch_tracks
```

### `messages`

Raw Telegram data.

### `monitor_parsed_events`

Semantic representation після parser-а.

Типові дані:

- message ID;
- reply ID;
- Telegram date;
- threat class;
- object count;
- relation;
- status;
- places;
- geometry-resolved flags;
- original text.

### `monitor_branch_events`

Зв’язок між parsed events і reply branches.

### `monitor_branches`

Логічна структура Telegram reply-tree.

### `monitor_branch_tracks`

Агрегований стан кожної гілки.

Branch identifier концептуально має форму:

```text
root_message_id:leaf_message_id
```

Тому ID branch може змінитися після появи нового reply, оскільки змінюється leaf.

---

## 12. Threat taxonomy

AIR engine підтримує кілька класів повітряних загроз, зокрема:

```text
shahed
shahed_reactive
reactive_uav
attack_uav
recon_uav
uav_unknown
fpv
molniya
banderol
kab
ballistic
missile
aviation
```

Frontend mapping використовує тип загрози для визначення форми, кольору, glow та legend entry.

---

## 13. Status semantics

Підтримувані status types включають:

```text
observed_again
intercepted
fallen
left_region
lost_tracking
threat_persists
clear
```

У frontend також використовуються normalized terminal representations, наприклад:

```text
lost_tracking
fallen_reported
intercepted_reported
```

Статус відображає **те, що повідомило джерело**, а не independently verified event.

---

## 14. Geographic roles

Для place reference parser може задавати `location_role`.

Основні ролі:

```text
reported_position
reported_area
direction_target
inherited_direction
warning_area
launch_target
source_origin
linear_reference_projection
```

Не всі ролі є однаково придатними для побудови track geometry.

Trackable source roles у frontend включають:

```text
reported_position
reported_area
direction_target
inherited_direction
linear_reference_projection
```

При цьому `direction_target` залишається семантично **напрямком/орієнтиром**, а не підтвердженою поточною координатою.

---

## 15. Place resolver

Backend використовує place dictionary та resolver для нормалізації топонімів.

Типові файли:

```text
monitor_places.json
monitor_place_resolver.py
```

Завдання resolver-а:

- normalizing grammatical forms;
- aliases;
- canonical place names;
- lat/lng assignment;
- ambiguity detection;
- geometry-resolved flag.

Приклад:

```text
Лозова
Лозову
```

можуть бути зведені до одного canonical place.

Duplicate aliases у словнику небажані, бо можуть створювати ambiguous resolution.

---

## 16. Reply-linked tracks

Система не створює трек лише через часову близькість повідомлень.

Географічний sequence вважається одним logical track тільки тоді, коли є **explicit Telegram reply relationship**.

Наприклад:

```text
Message A
   ↓ reply
Message B
   ↓ reply
Message C
```

може створити:

```text
A → B → C
```

Але два повідомлення однакового типу, опубліковані поруч у часі без reply-link, автоматично не з’єднуються.

Це принципово важливо, щоб не створювати вигадані траєкторії.

---

## 17. Meaning of track lines

Лінії на карті — це **source-linked geographic sequence**.

Вони означають:

> “джерело спочатку пов’язало об’єкт із цим географічним reference, потім reply-повідомлення пов’язало той самий logical branch з іншим reference”.

Вони **не означають**:

- фізично виміряний маршрут;
- рівномірний рух між точками;
- прогноз продовження маршруту;
- точну висоту/швидкість/курс;
- майбутню ціль.

---

## 18. Midpoint для двох reference points

Для single-object report із двома resolved place references frontend може створити одну derived point.

Наприклад:

```text
1 БПЛА на Хорошеве / Покотилівку
```

За наявності координат A і B:

```text
visual_reference = midpoint(A, B)
```

Мета — уникнути “spiderweb” effect, коли одна подія створювала кілька паралельних ліній до наступної події.

Midpoint позначає **візуальний reference повідомлення**, а не реальну координату об’єкта.

Оригінальні source place names зберігаються у metadata/popup.

---

## 19. Centroid для 3+ references

Якщо single-object report містить три або більше resolved geographic references, frontend може використати centroid:

```text
centroid(P1, P2, ..., Pn)
```

Це також лише derived cartographic approximation.

---

## 20. Multi-object reports

Для aggregate/multi-object reports midpoint/centroid collapsing не повинен руйнувати поділ об’єктів на групи.

Наприклад:

```text
Наразі 3 БПЛА ...
2 на Барвінкове
1 на Лозову
```

очікувана візуалізація:

```text
Барвінкове → group count 2
Лозова     → group count 1
```

Для конкретного marker count використовується пріоритет:

```text
segment_object_count
↓
reported_object_count
↓
object_count
↓
1
```

Це не дозволяє помилково показати загальну кількість `3` біля кожного окремого place.

---

## 21. Aggregate snapshots

Повідомлення виду:

```text
Наразі N БПЛА ...
```

трактуються як **current situation snapshot**, а не як незалежний новий довгоживучий track.

Наприклад:

```text
21:36
Наразі 3 ...
3 на Барвінкове
```

пізніше:

```text
21:42
Наразі 3 ...
2 на Барвінкове
1 на Лозову
```

У LIVE-візуалізації новіший snapshot тієї самої threat class supersede старіший.

Старий snapshot не видаляється з історичних даних, але не повинен одночасно виглядати як ще один актуальний розподіл тих самих об’єктів.

---

## 22. Terminal marker anchor

Terminal message може не містити власного населеного пункту.

Наприклад:

```text
Слатине
  ↓ reply
Далі на Дергачі
  ↓ reply
Далі на Малу Данилівку
  ↓ reply
Впала в області
```

Якщо terminal event не має explicit resolved place, terminal marker прив’язується до **останнього resolved source reference у цій reply branch**.

Тобто в прикладі — до Малої Данилівки, а не до першої точки гілки.

Пріоритет:

```text
1. explicit resolved place у terminal message
2. latest resolved source reference у тому самому reply branch
```

Це все одно не означає підтверджену точну координату падіння.

---

## 23. Харківська кільцева дорога

Файл:

```text
kharkiv-ring-road.geojson
```

містить геометрію кільцевої.

Для unresolved reference, який явно містить формулювання на кшталт:

```text
вздовж кільцевої дороги
```

frontend може проектувати derived reference на найближчий segment кільцевої від попередньої source-linked point.

Такому place задаються metadata типу:

```text
place_type = linear_feature
linear_reference_projection = true
linear_reference_id = kharkiv_ring_road
```

Це **картографічна прив’язка**, а не точна позиція об’єкта на дорозі.

---

## 24. LIVE freshness TTL

Backend logical track іноді може залишатися `active`, якщо джерело не опублікувало явний terminal status.

Тому frontend застосовує додатковий operational TTL:

```text
30 minutes
```

У коді:

```js
const AIR_ACTIVE_STALE_MS = 30 * 60 * 1000;
```

LIVE threat відображається як current лише якщо останній meaningful source report достатньо свіжий.

Старі дані при цьому не видаляються з history.

---

## 25. API polling

Основний AIR feed:

```text
GET /api/monitor/tracks
```

Frontend settings:

```text
lookback_hours = 12
limit = 200
active_only = false
geometry_only = false
```

Frontend refresh interval:

```text
5000 ms
```

тобто приблизно кожні 5 секунд.

---

## 26. Основний API URL

Поточний frontend використовує HTTPS API host:

```text
https://89-168-114-2.sslip.io
```

Основний endpoint:

```text
https://89-168-114-2.sslip.io/api/monitor/tracks
```

Historical debug base:

```text
https://89-168-114-2.sslip.io/api/monitor/debug-track
```

---

## 27. Historical debug mode

Для тестування старої reply branch без залежності від LIVE TTL підтримується query parameter:

```text
?airDebugTrack=ROOT:LEAF
```

Наприклад:

```text
?airDebugTrack=147323:147335
```

Frontend викликає:

```text
/api/monitor/debug-track/{root_message_id}/{leaf_message_id}
```

Debug track:

- додається окремо до payload;
- позначається як historical;
- не перетворюється на LIVE threat;
- не повинен збільшувати `ACTIVE TRACKS`.

---

## 28. Track display modes

Підтримуються три режими:

### ALL

Показує history/curve для всіх видимих актуальних tracks.

### SEL

Показує history/curve лише selected track.

Клік по іншому marker змінює selected track, але режим залишається SEL.

### OFF

Вимикає history/curve.

Режим sticky: клік по marker не повинен самовільно перемикати ALL або OFF у SEL.

---

## 29. LIVE / DEMO

AIR engine підтримує data mode:

```text
LIVE
DEMO
```

LIVE використовує backend API.

DEMO очікує локальний файл:

```text
./demo-air.json
```

Якщо `demo-air.json` відсутній, LIVE mode продовжує працювати нормально, але DEMO mode поверне file error.

Data mode зберігається в localStorage.

---

## 30. Visual settings

Кнопка `VIS` відкриває HUD-style visual settings panel.

Поточні параметри:

```text
Icon glow
Glow radius
Pulse
Track glow
Track width
Kharkiv boundary
```

Default values:

```text
iconGlow: 100
glowRadius: 8
pulse: 65
trackGlow: 22
trackWidth: 2.0
ringRoadIntensity: 55
```

Значення зберігаються у localStorage.

---

## 31. Basemaps

Standalone frontend не використовує CARTO tiles, які вимагали API key і показували watermark `API KEY REQUIRED`.

Доступні:

```text
Dark Ops — Esri
Esri Topographic
OpenStreetMap
```

Default:

```text
Esri Dark Gray Canvas
```

Dark basemap складається з base + reference labels layers.

Якщо default dark tile layer не завантажується, frontend може fallback на OpenStreetMap.

---

## 32. HUD

Top HUD показує:

```text
AIR THREAT // TRACK SYS
local time
date
tracks loaded
active tracks
mapped positions
AIR FEED status
```

Feed status може переходити між станами на кшталт:

```text
AIR SYNCING
AIR FEED
AIR FEED ERROR
```

---

## 33. Legend

Legend пояснює:

- threat classes;
- current position symbol;
- historical position;
- reported track;
- lost tracking;
- intercepted;
- fallen/impact reported.

Legend є інтерпретацією frontend semantics, а не підтвердженням реального фізичного стану об’єкта.

---

## 34. Disclaimer

Disclaimer показується при вході в standalone AIR.

Він прямо попереджає, що:

- карта не показує verified real-time coordinates;
- markers/lines є visual representation public reports;
- деякі точки можуть бути derived approximations;
- інформація може бути затриманою/неповною/неточною;
- система не призначена для mission planning, route planning або safe-zone determination;
- користувач повинен керуватися official civil-protection information.

---

## 35. Kharkiv city/community air-alert indicator

У лівому нижньому HUD-блоці відображається статус повітряної тривоги для:

```text
м. Харків та Харківська територіальна громада
```

Поточний Ukraine Alarm region ID:

```text
1293
```

Frontend **не звертається безпосередньо до Ukraine Alarm API**.

Схема:

```text
GitHub Pages
     │
     ▼
GET /api/alarm/kharkiv
     │
     ▼
FastAPI backend
     │
     ▼
Ukraine Alarm API
```

Це потрібно, щоб API token не був доступний у browser JavaScript.

---

## 36. Alarm endpoint

Backend endpoint:

```text
GET /api/alarm/kharkiv
```

Типова відповідь під час тривоги:

```json
{
  "ok": true,
  "region": "м. Харків та Харківська територіальна громада",
  "region_eng": "Kharkiv and Kharkivska community",
  "region_id": "1293",
  "status": "AIR_ALERT",
  "air_alert": true,
  "active_alert_count": 1,
  "active_alert_types": ["AIR"],
  "source_last_update": "...",
  "checked_at": "...",
  "source": "Ukraine Alarm API"
}
```

Можливі frontend states:

```text
CLEAR
AIR ALERT
NO DATA
```

Кольори:

```text
CLEAR     → green
AIR ALERT → red + pulse
NO DATA   → amber
```

Frontend refresh interval:

```text
15 seconds
```

---

## 37. Ukraine Alarm API token security

Token **ніколи не повинен** зберігатися в цьому GitHub repository або frontend JavaScript.

На сервері він зберігається у приватному environment file:

```text
/etc/tlk-map-api.env
```

Формат:

```text
UKRAINE_ALARM_TOKEN=...
```

Recommended permissions:

```bash
sudo chmod 600 /etc/tlk-map-api.env
```

Systemd service використовує `EnvironmentFile` override.

Не комітьте `.env`, tokens, API keys або secrets у Git.

---

## 38. CORS

FastAPI CORS дозволяє frontend origin:

```text
https://deafinicio.github.io
```

Для локального тестування також дозволені:

```text
http://127.0.0.1:8080
http://localhost:8080
```

Methods обмежені GET, оскільки frontend API є read-only.

---

## 39. Local development

Клонування:

```bash
git clone https://github.com/deafinicio/air-threat-map.git
cd air-threat-map
```

Не рекомендується відкривати `index.html` напряму через `file://`.

Запустіть простий local HTTP server:

```bash
python -m http.server 8080
```

Відкрити:

```text
http://localhost:8080/
```

---

## 40. JavaScript validation

Перед commit змін `air-mode.js`:

```bash
node --check air-mode.js
```

Також:

```bash
git diff --check
```

Для staging краще явно додавати потрібні файли:

```bash
git add air-mode.js
git add index.html
git add kharkiv-ring-road.geojson
```

замість:

```bash
git add .
```

Це зменшує ризик випадково закомітити backup або secret files.

---

## 41. GitHub Pages deployment

Поточний deployment:

```text
Source: Deploy from a branch
Branch: main
Folder: / (root)
```

Після push у `main` GitHub Pages автоматично оновлює сайт.

Після deployment для жорсткого refresh браузера можна використати:

```text
Ctrl + F5
```

---

## 42. DNS та `sslip.io`

API зараз використовує hostname:

```text
89-168-114-2.sslip.io
```

`sslip.io` автоматично резолвить hostname із вбудованою IP-адресою.

Деякі ISP/router/DNS resolver-и можуть повертати:

```text
DNS name does not exist
ERR_NAME_NOT_RESOLVED
```

У такому випадку перевірка Windows:

```powershell
Resolve-DnsName 89-168-114-2.sslip.io
```

Публічні DNS resolver-и, які можуть допомогти:

```text
Cloudflare
1.1.1.1
1.0.0.1
```

або:

```text
Google
8.8.8.8
8.8.4.4
```

Після зміни DNS:

```powershell
ipconfig /flushdns
```

Довгостроково рекомендовано перейти з `sslip.io` на власний стабільний API hostname.

---

## 43. Backend diagnostics

### Services

```bash
systemctl is-active monitor-collector.service
systemctl is-active monitor-processor.service
systemctl is-active tlk-api.service
systemctl is-active caddy
```

### Local AIR API

```bash
curl -s http://127.0.0.1:8000/api/monitor/tracks
```

### Public AIR API

```bash
curl -s https://89-168-114-2.sslip.io/api/monitor/tracks
```

### Alarm API

```bash
curl -s http://127.0.0.1:8000/api/alarm/kharkiv | python3 -m json.tool
```

### Ports

```bash
sudo ss -ltnp | grep -E ':80|:443|:8000'
```

---

## 44. Typical browser diagnostics

Chrome / Chromium:

```text
F12 → Console
F12 → Network
```

Типові проблеми:

### `ERR_NAME_NOT_RESOLVED`

Client-side DNS issue for API hostname.

### `AIR FEED ERROR`

Перевірити Network/Console. Причина може бути DNS, CORS, HTTPS, backend service, timeout або malformed payload.

### `NO DATA` у Kharkiv alert indicator

Перевірити:

```text
/api/alarm/kharkiv
```

та backend token/environment configuration.

### Ring-road geometry unavailable

Перевірити наявність:

```text
kharkiv-ring-road.geojson
```

у корені GitHub Pages repo.

---

## 45. Backup files

Patcher scripts під час розробки можуть створювати локальні backups на кшталт:

```text
air-mode-before-....js
index-before-....html
```

Їх не слід commit-ити в repository.

Доцільно додати `.gitignore`, якщо backup workflow буде використовуватися надалі.

---

## 46. Data-flow example

```text
Telegram message
      │
      ▼
raw messages table
      │
      ▼
parse_message()
      │
      ├── threat
      ├── object_count
      ├── status
      ├── relation
      └── places
      │
      ▼
reply branch
      │
      ▼
branch track
      │
      ▼
FastAPI JSON
      │
      ▼
normalizeMonitorPayload()
      │
      ▼
deriveMonitorVisualPlaces()
      │
      ├── raw places
      ├── midpoint
      └── centroid
      │
      ▼
linear reference resolution
      │
      ▼
terminal anchor override
      │
      ▼
freshness + snapshot filtering
      │
      ▼
Leaflet markers / lines / terminal states
```

---

## 47. Core design principles

1. **Source first** — не вигадувати географічні точки без source basis.
2. **Explicit reply linkage** — не з’єднувати незалежні повідомлення лише через час або схожий текст.
3. **No prediction** — не прогнозувати майбутню траєкторію.
4. **No impact prediction** — не створювати predicted impact point.
5. **Direction is not position** — `direction_target` не називати confirmed current position.
6. **Derived points are approximate** — midpoint/centroid мають залишатися clearly derived references.
7. **Terminal semantics remain source semantics** — fall/intercept marker не перетворювати на independently verified coordinate.
8. **Aggregate snapshots supersede older LIVE snapshots** — не дублювати один і той самий statewide count через кілька одночасних snapshot layers.
9. **History is preserved** — filtering LIVE state не повинно видаляти raw/history data.
10. **Secrets stay server-side** — API tokens не повинні потрапляти в GitHub Pages.

---

## 48. Known technical debt / future improvements

Поточна реалізація свідомо зберігає частину shared-code heritage від початкової MINE + AIR карти.

Приклади:

- localStorage keys досі мають prefix `mine-risk-map-air-*`;
- `air-mode.js` містить compatibility code для MINE state;
- API hostname залежить від `sslip.io`;
- `demo-air.json` не є обов’язковою частиною standalone repo;
- frontend logic поки зосереджена у великому `air-mode.js`;
- CSS standalone layout поки знаходиться всередині `index.html`.

Можливе майбутнє рефакторинг-напрямлення:

```text
css/
  air-map.css
js/
  air-core.js
  air-render.js
  air-api.js
  air-ui.js
  alarm-indicator.js
data/
  kharkiv-ring-road.geojson
```

Але рефакторинг варто робити лише після стабілізації current behavior та regression testing.

---

## 49. License

На момент створення цього README окремий LICENSE file у repository не зафіксований.

До додавання license не слід автоматично припускати, що код дозволено необмежено копіювати, модифікувати або перевикористовувати.

---

# 🇬🇧 English version

## 1. Project overview

**AIR Threat Map** is a standalone web frontend that visualizes **source-reported air-threat information** derived from the public Telegram source `monitor1654` and processed by a separate backend pipeline.

The system converts public text reports into structured events, geographic references, explicit Telegram reply branches, and cartographic tracks.

It also displays the current air-raid alert state for **Kharkiv city and the Kharkiv territorial community** through a server-side proxy to the Ukraine Alarm API.

This repository contains only the **standalone frontend**. Telegram ingestion, parsing, SQLite storage, branch reconstruction, FastAPI endpoints, and the Ukraine Alarm API proxy run separately on an Oracle Cloud VM.

---

## 2. Public URLs

Live GitHub Pages site:

```text
https://deafinicio.github.io/air-threat-map/
```

Repository:

```text
https://github.com/deafinicio/air-threat-map
```

---

## 3. Safety and interpretation notice

AIR Threat Map is not connected to radar, military telemetry, air-defense tracking systems, or independently verified real-time coordinates.

The visualization is derived from public text reports and explicit Telegram reply relationships.

Therefore:

- a marker is not a verified real-world object position;
- a line is not a measured physical flight trajectory;
- a `direction_target` is not a confirmed current coordinate;
- midpoint and centroid anchors are derived cartographic approximations;
- a terminal marker is not an independently confirmed impact/intercept coordinate unless the source explicitly provided a resolved location;
- reports may be delayed, incomplete, or inaccurate;
- the map must not be used for mission planning, route planning, safe-area determination, impact prediction, or safety-critical decisions.

The interface displays a dedicated HUD-style disclaimer whenever AIR mode starts.

---

## 4. High-level architecture

```text
Public Telegram source: monitor1654
              │
              ▼
      monitor_collector.py
              │
              ▼
      monitor_messages.db
              │
              ▼
      monitor_processor.py
              │
              ├── monitor_parsed_events
              ├── monitor_branch_events
              ├── monitor_branches
              └── monitor_branch_tracks
              │
              ▼
            FastAPI
              │
              ▼
            Uvicorn
        127.0.0.1:8000
              │
              ▼
             Caddy
          HTTPS reverse proxy
              │
              ▼
/api/monitor/tracks
/api/monitor/debug-track/...
/api/alarm/kharkiv
              │
              ▼
          GitHub Pages
              │
              ▼
           index.html
           air-mode.js
              │
              ▼
             Leaflet
```

---

## 5. Repository structure

```text
air-threat-map/
├── index.html
├── air-mode.js
├── kharkiv-ring-road.geojson
└── README.md
```

### `index.html`

Contains the standalone page shell and UI integration:

- Leaflet initialization;
- HUD header;
- clock/date;
- basemap controls;
- coordinate rulers;
- cursor coordinate readout;
- lock-on reticle helper;
- standalone visual-settings styling;
- Kharkiv alert indicator;
- `/api/alarm/kharkiv` polling;
- `air-mode.js` loading.

### `air-mode.js`

Main AIR visualization engine:

- API polling;
- backend payload normalization;
- threat rendering;
- semantic place filtering;
- midpoint/centroid generation;
- reply-linked tracks;
- LIVE freshness logic;
- aggregate snapshot supersession;
- terminal anchor handling;
- track display modes;
- visual settings;
- legend;
- disclaimer;
- ring-road linear reference projection;
- historical debug loading.

### `kharkiv-ring-road.geojson`

Kharkiv ring-road geometry used strictly as a cartographic linear reference when the public source explicitly mentions the ring road.

---

## 6. Standalone operation

The page declares:

```html
<html lang="uk" data-air-standalone="true">
```

The AIR engine reads:

```js
const AIR_STANDALONE =
  document.documentElement.dataset.airStandalone === "true";
```

In standalone mode:

- MINE UI is not used;
- no MINE/AIR toggle is installed;
- AIR mode starts automatically;
- MINE overlays are not displayed;
- the AIR engine retains compatibility with the original combined map.

The original combined project remains separate and unchanged by this repository.

---

## 7. Backend stack

The backend runs separately on Oracle Cloud.

Current runtime stack:

```text
Ubuntu 24.04
Python 3.12
FastAPI
Uvicorn
SQLite
Caddy
systemd
```

Working directory:

```text
/opt/tlk-map
```

Uvicorn binds only to:

```text
127.0.0.1:8000
```

Caddy provides public HTTPS termination and reverse proxying.

---

## 8. Backend services

### `tlk-api.service`

Runs the FastAPI app via Uvicorn.

### `monitor-collector.service`

Collects raw Telegram reports from `monitor1654`.

### `monitor-processor.service`

Parses raw reports and rebuilds derived event, branch, and track tables.

A legacy `tlk-collector.service` may also exist on the host, but it is not the primary ingestion path used by the standalone AIR frontend.

---

## 9. Data ingestion principles

The collector preserves raw source information rather than attempting to predict geometry.

Important raw fields include:

- message ID;
- reply-to message ID;
- source timestamp;
- original report text.

Interpretation happens downstream in the parser/processor layer.

---

## 10. Processor and atomic rebuilds

The processor rebuilds derived tables using temporary `_next` tables and atomic swaps.

Do not run a manual `--once` rebuild concurrently with `monitor-processor.service`.

Safe manual sequence:

```bash
sudo systemctl stop monitor-processor.service
./.venv/bin/python3 monitor_processor.py --once
sudo systemctl start monitor-processor.service
```

---

## 11. SQLite model

Primary monitor database:

```text
/opt/tlk-map/monitor_messages.db
```

Important tables:

```text
messages
monitor_parsed_events
monitor_branch_events
monitor_branches
monitor_branch_tracks
```

The `messages` table stores raw source data.

`monitor_parsed_events` stores semantic parser output.

`monitor_branch_events` and `monitor_branches` reconstruct explicit Telegram reply relationships.

`monitor_branch_tracks` stores the logical branch-level track state.

A branch identifier conceptually follows:

```text
root_message_id:leaf_message_id
```

and may therefore change as a reply chain receives a new leaf message.

---

## 12. Threat taxonomy

Supported/recognized threat classes include:

```text
shahed
shahed_reactive
reactive_uav
attack_uav
recon_uav
uav_unknown
fpv
molniya
banderol
kab
ballistic
missile
aviation
```

The frontend maps threat classes to visual shape/color/glow semantics.

---

## 13. Status semantics

Examples of parsed statuses:

```text
observed_again
intercepted
fallen
left_region
lost_tracking
threat_persists
clear
```

Normalized frontend terminal types include values such as:

```text
lost_tracking
fallen_reported
intercepted_reported
```

These statuses reflect source reports, not independently verified physical events.

---

## 14. Geographic roles

Common location roles include:

```text
reported_position
reported_area
direction_target
inherited_direction
warning_area
launch_target
source_origin
linear_reference_projection
```

The frontend only uses selected roles as trackable map references.

A `direction_target` remains a direction/reference from the source and must not be described as a confirmed object coordinate.

---

## 15. Place resolver

Backend place resolution uses a dictionary/resolver layer, typically:

```text
monitor_places.json
monitor_place_resolver.py
```

Responsibilities include:

- alias normalization;
- grammatical-form normalization;
- canonical names;
- coordinates;
- geometry-resolved state;
- ambiguity handling.

Duplicate aliases should be avoided because they can produce ambiguous resolution.

---

## 16. Explicit reply-linked tracks

Tracks are created from explicit Telegram reply relationships, not merely because reports were published close together in time or mention similar threats.

This prevents the system from fabricating connections between unrelated reports.

---

## 17. Track-line meaning

A displayed line represents a **source-linked sequence of geographic references**.

It does not represent:

- measured radar trajectory;
- predicted movement;
- exact speed or heading;
- future target;
- interception solution.

---

## 18. Midpoint logic

For a single-object report containing two resolved source places, the frontend may create one derived midpoint reference.

This prevents a single source event from generating multiple parallel outgoing lines and reduces spiderweb-like visualization.

The midpoint is explicitly approximate and is not treated as a verified position.

---

## 19. Centroid logic

For a single-object report with three or more resolved place references, the frontend may create a centroid.

As with midpoint logic, this is a cartographic approximation of source wording only.

---

## 20. Multi-object reports

Multi-object reports preserve group-level counts.

Example:

```text
Currently 3 UAVs
2 toward Barvinkove
1 toward Lozova
```

Expected visualization:

```text
Barvinkove → count 2
Lozova     → count 1
```

Marker count priority:

```text
segment_object_count
reported_object_count
object_count
1
```

---

## 21. Aggregate snapshots

Reports beginning with patterns such as:

```text
Наразі N ...
```

are treated as current situation snapshots.

A newer snapshot for the same threat class supersedes an older snapshot in the LIVE visualization, while historical records remain stored.

This avoids displaying multiple successive statewide summaries as if they represented additional simultaneous objects.

---

## 22. Terminal marker anchoring

If a terminal report contains its own resolved place, that place has priority.

If the terminal report contains no geographic reference, the terminal marker uses the latest resolved source reference in the same explicit reply branch.

This corrects cases where a fall/loss/intercept symbol would otherwise appear at the branch’s first point rather than the last reported reference.

It still does not imply a verified physical terminal coordinate.

---

## 23. Kharkiv ring-road reference

`kharkiv-ring-road.geojson` is used for explicit ring-road source references.

Unresolved ring-road wording may be projected to the nearest ring-road segment relative to the previous source-linked reference.

Such points are labeled as linear cartographic references rather than exact object positions.

---

## 24. LIVE freshness TTL

The frontend uses an operational stale threshold:

```text
30 minutes
```

```js
const AIR_ACTIVE_STALE_MS = 30 * 60 * 1000;
```

This prevents backend-active tracks with no recent source update from remaining indefinitely visible as current LIVE threats.

Historical data is preserved.

---

## 25. AIR API polling

Primary endpoint:

```text
GET /api/monitor/tracks
```

Frontend configuration:

```text
lookback_hours = 12
limit = 200
active_only = false
geometry_only = false
refresh = 5000 ms
```

---

## 26. API host

Current public API hostname:

```text
https://89-168-114-2.sslip.io
```

Main tracks endpoint:

```text
https://89-168-114-2.sslip.io/api/monitor/tracks
```

Historical debug base:

```text
https://89-168-114-2.sslip.io/api/monitor/debug-track
```

---

## 27. Historical debug mode

Query parameter:

```text
?airDebugTrack=ROOT:LEAF
```

Example:

```text
?airDebugTrack=147323:147335
```

The frontend loads a specific historical reply branch through:

```text
/api/monitor/debug-track/{root_message_id}/{leaf_message_id}
```

Debug tracks remain historical and must not become LIVE tracks or inflate the ACTIVE TRACKS counter.

---

## 28. Track display modes

### ALL

Show all visible track history/curves.

### SEL

Show history/curve only for the selected track.

### OFF

Hide history/curves.

The mode is sticky: marker clicks do not automatically force the interface into SEL.

---

## 29. LIVE and DEMO modes

The engine supports:

```text
LIVE
DEMO
```

LIVE uses the backend API.

DEMO expects:

```text
./demo-air.json
```

The selected data mode is stored in browser localStorage.

---

## 30. Visual controls

The `VIS` panel exposes:

```text
Icon glow
Glow radius
Pulse
Track glow
Track width
Kharkiv boundary
```

Default values:

```text
iconGlow: 100
glowRadius: 8
pulse: 65
trackGlow: 22
trackWidth: 2.0
ringRoadIntensity: 55
```

Settings persist through localStorage.

---

## 31. Basemaps

The standalone frontend uses no-key public map layers instead of the previous CARTO configuration that displayed an API-key watermark.

Available layers:

```text
Dark Ops — Esri
Esri Topographic
OpenStreetMap
```

Default layer:

```text
Esri Dark Gray Canvas
```

---

## 32. HUD

The top HUD displays:

```text
AIR THREAT // TRACK SYS
local time
date
tracks loaded
active tracks
mapped positions
AIR FEED status
```

Typical feed states:

```text
AIR SYNCING
AIR FEED
AIR FEED ERROR
```

---

## 33. Kharkiv city/community air-alert indicator

The bottom-left HUD indicator shows the current alert state for:

```text
Kharkiv city and the Kharkiv territorial community
```

Ukraine Alarm region ID:

```text
1293
```

The frontend does not expose the Ukraine Alarm API token.

Data flow:

```text
GitHub Pages
     ↓
GET /api/alarm/kharkiv
     ↓
FastAPI backend
     ↓
Ukraine Alarm API
```

Frontend states:

```text
CLEAR
AIR ALERT
NO DATA
```

Polling interval:

```text
15 seconds
```

---

## 34. Alarm API response

Example:

```json
{
  "ok": true,
  "region": "м. Харків та Харківська територіальна громада",
  "region_eng": "Kharkiv and Kharkivska community",
  "region_id": "1293",
  "status": "AIR_ALERT",
  "air_alert": true,
  "active_alert_count": 1,
  "active_alert_types": ["AIR"],
  "source_last_update": "...",
  "checked_at": "...",
  "source": "Ukraine Alarm API"
}
```

---

## 35. Secret management

The Ukraine Alarm API token must never be committed to this repository.

It is stored server-side in:

```text
/etc/tlk-map-api.env
```

with a variable such as:

```text
UKRAINE_ALARM_TOKEN=...
```

Recommended permissions:

```bash
sudo chmod 600 /etc/tlk-map-api.env
```

The FastAPI systemd service loads this file through an `EnvironmentFile` override.

---

## 36. CORS

The backend allows the GitHub Pages origin:

```text
https://deafinicio.github.io
```

Local development origins currently include:

```text
http://127.0.0.1:8080
http://localhost:8080
```

The public frontend API is read-only and uses GET requests.

---

## 37. Local development

Clone:

```bash
git clone https://github.com/deafinicio/air-threat-map.git
cd air-threat-map
```

Serve over HTTP:

```bash
python -m http.server 8080
```

Open:

```text
http://localhost:8080/
```

Avoid relying on `file://` because browser fetch/security behavior differs from HTTP hosting.

---

## 38. Validation before commit

JavaScript syntax:

```bash
node --check air-mode.js
```

Whitespace/diff validation:

```bash
git diff --check
```

Prefer explicit staging:

```bash
git add air-mode.js
git add index.html
git add kharkiv-ring-road.geojson
```

rather than blindly using `git add .`.

---

## 39. GitHub Pages deployment

Current configuration:

```text
Source: Deploy from a branch
Branch: main
Folder: / (root)
```

Pushes to `main` update the public GitHub Pages site.

---

## 40. DNS and sslip.io

The current API hostname depends on `sslip.io`.

Some ISP/router/DNS configurations may fail to resolve it and produce:

```text
ERR_NAME_NOT_RESOLVED
```

Windows diagnostic:

```powershell
Resolve-DnsName 89-168-114-2.sslip.io
```

Common public DNS alternatives:

```text
Cloudflare: 1.1.1.1 / 1.0.0.1
Google:     8.8.8.8 / 8.8.4.4
```

After changing Windows DNS:

```powershell
ipconfig /flushdns
```

A dedicated owned API hostname is recommended long-term.

---

## 41. Backend troubleshooting

Service health:

```bash
systemctl is-active monitor-collector.service
systemctl is-active monitor-processor.service
systemctl is-active tlk-api.service
systemctl is-active caddy
```

Local tracks API:

```bash
curl -s http://127.0.0.1:8000/api/monitor/tracks
```

Alarm status:

```bash
curl -s http://127.0.0.1:8000/api/alarm/kharkiv | python3 -m json.tool
```

Public API:

```bash
curl -s https://89-168-114-2.sslip.io/api/monitor/tracks
```

Listening ports:

```bash
sudo ss -ltnp | grep -E ':80|:443|:8000'
```

---

## 42. Browser troubleshooting

Use:

```text
F12 → Console
F12 → Network
```

Common cases:

### AIR FEED ERROR

Check DNS, HTTPS, CORS, API service status, network timeout, and response validity.

### ERR_NAME_NOT_RESOLVED

Client DNS cannot resolve the API hostname.

### Kharkiv indicator shows NO DATA

Check `/api/alarm/kharkiv` and the backend environment/token configuration.

### Ring-road geometry missing

Verify `kharkiv-ring-road.geojson` exists in the GitHub Pages root.

---

## 43. Development backup files

Local patch workflows may create files like:

```text
air-mode-before-*.js
index-before-*.html
```

These are local recovery files and should not be committed.

A future `.gitignore` may include such patterns.

---

## 44. Core design rules

1. Do not predict trajectories.
2. Do not generate predicted impact points.
3. Do not treat direction targets as confirmed positions.
4. Only connect source events with explicit reply linkage.
5. Clearly treat midpoint/centroid as approximate derived references.
6. Keep terminal markers tied to source semantics.
7. Supersede older LIVE aggregate snapshots rather than stacking them.
8. Preserve historical/raw data while filtering LIVE state.
9. Keep API tokens and secrets server-side.
10. Treat the system as informational visualization, not verified telemetry.

---

## 45. Current technical debt and possible future refactoring

The standalone AIR engine intentionally reuses code from the original combined MINE + AIR project.

Known cleanup opportunities include:

- rename legacy localStorage keys that still use `mine-risk-map-air-*`;
- split the large `air-mode.js` into API, normalization, rendering, UI, and alarm modules;
- move inline CSS from `index.html` into a dedicated stylesheet;
- replace `sslip.io` with an owned stable hostname;
- formalize DEMO fixtures;
- add automated parser/render regression tests;
- add `.gitignore` for local patch backups.

A suggested future structure:

```text
css/
  air-map.css
js/
  air-api.js
  air-normalize.js
  air-render.js
  air-ui.js
  alarm-indicator.js
data/
  kharkiv-ring-road.geojson
```

Refactoring should be incremental and should preserve current tested behavior.

---

## 46. License

No separate LICENSE file is currently documented in this repository.

Until a license is added, do not assume unrestricted permission to copy, modify, redistribute, or reuse the code.
