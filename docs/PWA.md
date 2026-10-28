# Home screen installation

The map can be installed from HTTPS as a Progressive Web App. It opens in a separate
standalone window with the existing radar icon. The manifest, worker scope, start URL
and icons are relative to this project, so GitHub Pages subpath hosting is supported.

- **Android:** open in Chrome, tap **APP** in the right-hand controls, then **Install app**
  when the browser offers it. Otherwise use the browser menu → **Add to Home screen** /
  **Install app**. The browser controls eligibility and may require interaction/time first.
- **iPhone / iPad:** open in Safari → Share → **Add to Home Screen** → leave
  **Open as Web App** enabled if shown → Add. **APP** includes these instructions.
- UA/EN instructions follow the map language. The APP control is hidden when the map
  is already running in standalone mode. No prompts are shown automatically.
- Native installation and iOS home-screen addition still require the user's action
  on the device; there is no automatic or remote installation.

## Connectivity and updates

Internet is required for map data. The service worker caches **only** the self-contained
`offline.html` explanation. Map HTML is requested from the network with `cache: no-store`.
Live APIs, messages, tracks, regional notices, alarm state, map tiles and JavaScript are
not stored or served by the worker. On a failed map navigation or HTTP error, the
offline explanation is shown instead of an old map. It follows the saved UA/EN preference.

Worker updates bypass the browser's worker HTTP cache. New workers activate without
an automatic page reload, and remove only old caches with this project's own prefix.
Normal site publication updates the installed app on its next online launch.
Installing does not add push notifications, background tracking or offline map data.

## Validation

`npm ci && npm test` includes the existing map tests and PWA tests for manifest/icon
sizes, project-relative paths, Android prompt lifecycle, iOS instructions, focus/keyboard
behavior, standalone mode, offline navigation, and isolation from live data/other sites.
Real Android and iPhone installation must also be checked on those devices.

References: [Chrome install criteria](https://web.dev/articles/install-criteria),
[WebKit home-screen behavior](https://webkit.org/blog/17333/webkit-features-in-safari-26-0/),
[Apple iPhone instructions](https://support.apple.com/guide/iphone/iphea86e5236/ios),
[offline fallback](https://web.dev/articles/offline-fallback-page).
