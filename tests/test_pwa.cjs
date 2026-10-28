const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {JSDOM} = require('jsdom');
const root = path.resolve(__dirname, '..');
const base = 'https://deafinicio.github.io/air-threat-map/';
const source = fs.readFileSync(path.join(root, 'air-pwa.js'), 'utf8');
const delay = () => new Promise(resolve => setTimeout(resolve, 20));

async function ui({ios = false, standalone = false, initialPrompt = null} = {}) {
  const dom = new JSDOM('<!doctype html><html><body><button data-air-language="uk">UA</button><div class="icon-control"></div></body></html>', {url: base, runScripts: 'outside-only', pretendToBeVisual: true});
  const w = dom.window, d = w.document;
  let language = 'uk';
  w.airLanguage = () => language;
  Object.defineProperty(d, 'currentScript', {get: () => ({src: base + 'air-pwa.js?v=1'})});
  Object.defineProperty(w.navigator, 'userAgent', {value: ios ? 'iPhone' : 'Android Chrome'});
  Object.defineProperty(w.navigator, 'standalone', {value: standalone});
  Object.defineProperty(w, 'isSecureContext', {value: true});
  const media = {matches: standalone, addEventListener: () => {}};
  w.matchMedia = () => media;
  const registrations = [];
  Object.defineProperty(w.navigator, 'serviceWorker', {value: {register: async (...args) => {registrations.push(args);}}});
  w.eval(source);
  function prompt(outcome) {
    let calls = 0;
    const event = new w.Event('beforeinstallprompt', {cancelable: true});
    event.prompt = async () => { calls++; };
    event.userChoice = Promise.resolve({outcome});
    w.dispatchEvent(event);
    assert.ok(event.defaultPrevented);
    return () => calls;
  }
  const earlyCalls = initialPrompt ? prompt(initialPrompt) : null;
  await delay();
  return {dom, w, d, prompt, registrations, earlyCalls, language: value => {language = value; w.dispatchEvent(new w.Event('airlanguagechange'));}};
}

test('manifest, icon dimensions and URLs stay inside the GitHub Pages project', () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.webmanifest')));
  assert.equal(manifest.display, 'standalone');
  for (const name of ['id', 'scope', 'start_url']) assert.equal(new URL(manifest[name], base).href, base);
  const any = manifest.icons.filter(x => x.purpose === 'any');
  assert.deepEqual(any.map(x => x.sizes), ['192x192', '512x512']);
  for (const icon of manifest.icons) {
    const data = fs.readFileSync(path.join(root, icon.src));
    assert.equal(data.subarray(1, 4).toString(), 'PNG');
    assert.equal(`${data.readUInt32BE(16)}x${data.readUInt32BE(20)}`, icon.sizes);
    assert.ok(new URL(icon.src, base).href.startsWith(base));
  }
  assert.ok(manifest.icons.some(x => x.purpose === 'maskable'));
  const html = new JSDOM(fs.readFileSync(path.join(root, 'index.html'), 'utf8')).window.document;
  assert.equal(html.querySelector('link[rel="manifest"]').getAttribute('href'), './manifest.webmanifest');
  assert.equal(html.querySelector('meta[name="apple-mobile-web-app-capable"]').content, 'yes');
  assert.ok(html.querySelector('link[rel="apple-touch-icon"]'));
});

test('Android installs only on click, consumes prompts once, and handles dismissal and acceptance', async () => {
  const u = await ui({initialPrompt: 'dismissed'});
  try {
    const {d, w} = u;
    assert.equal(u.earlyCalls(), 0);
    assert.equal(u.registrations.length, 1);
    assert.equal(u.registrations[0][0], base + 'sw.js');
    assert.equal(u.registrations[0][1].scope, base);
    assert.equal(u.registrations[0][1].updateViaCache, 'none');
    const open = d.querySelector('#air-install-open'), dialog = d.querySelector('dialog');
    open.focus(); open.click();
    assert.ok(dialog.open);
    assert.equal(d.activeElement, d.querySelector('.air-install-close'));
    const native = d.querySelector('.air-install-native');
    assert.equal(native.hidden, false);
    native.click(); await delay();
    assert.equal(u.earlyCalls(), 1);
    assert.ok(d.querySelector('[role="status"]').textContent.includes('скасовано'));
    assert.equal(native.hidden, true);
    native.click(); await delay(); assert.equal(u.earlyCalls(), 1);
    u.language('en');
    assert.equal(d.querySelector('h2').textContent, 'Use the map as an app');
    assert.ok(d.querySelector('[role="status"]').textContent.includes('dismissed'));
    const calls = u.prompt('accepted');
    native.click(); await delay();
    assert.equal(calls(), 1); assert.equal(open.hidden, true); assert.equal(dialog.open, false);
    assert.equal(d.activeElement, d.querySelector('[data-air-language]'));
    w.dispatchEvent(new w.Event('appinstalled'));
    assert.equal(open.hidden, true);
  } finally { u.dom.window.close(); }
});

test('iPhone instructions, platform switch, focus loop and Escape work without an install API', async () => {
  const u = await ui({ios: true});
  try {
    const {d, w} = u;
    const open = d.querySelector('#air-install-open'), dialog = d.querySelector('dialog');
    open.focus(); open.click();
    assert.ok(d.querySelector('ol').textContent.includes('Safari'));
    assert.ok(d.querySelector('ol').textContent.includes('Поділитися'));
    assert.equal(d.querySelector('.air-install-native').hidden, true);
    d.querySelector('[data-platform="android"]').click();
    assert.ok(d.querySelector('ol').textContent.includes('Chrome'));
    const first = d.querySelector('.air-install-close'), last = d.querySelector('[data-platform="ios"]');
    first.focus(); dialog.dispatchEvent(new w.KeyboardEvent('keydown', {key: 'Tab', shiftKey: true, bubbles: true}));
    assert.equal(d.activeElement, last);
    last.focus(); dialog.dispatchEvent(new w.KeyboardEvent('keydown', {key: 'Tab', bubbles: true}));
    assert.equal(d.activeElement, first);
    dialog.dispatchEvent(new w.KeyboardEvent('keydown', {key: 'Escape', bubbles: true}));
    assert.equal(dialog.open, false); assert.equal(d.activeElement, open);
  } finally { u.dom.window.close(); }
});

test('installed standalone app hides the install entry but retains worker registration', async () => {
  const u = await ui({standalone: true});
  try { assert.equal(u.d.querySelector('#air-install-open').hidden, true); assert.equal(u.registrations.length, 1); }
  finally { u.dom.window.close(); }
});

function worker() {
  const handlers = {}, added = [], deleted = [], matched = [], network = [];
  let claim = false, skip = false;
  let fetchImpl = async () => new Response('fresh map', {status: 200});
  const cache = {add: async request => added.push(request), match: async url => {matched.push(url); return new Response('offline explanation');}};
  const context = {
    URL, Request, Response,
    self: {registration: {scope: base}, addEventListener: (name, fn) => {handlers[name] = fn;}, skipWaiting: async () => {skip = true;}, clients: {claim: async () => {claim = true;}}},
    caches: {open: async () => cache, keys: async () => ['air-threat-map-offline-old', 'air-threat-map-offline-20261028-1', 'other-project-cache'], delete: async key => {deleted.push(key);}},
    fetch: async (...args) => {network.push(args); return fetchImpl(...args);}
  };
  vm.runInNewContext(fs.readFileSync(path.join(root, 'sw.js'), 'utf8'), context);
  return {handlers, added, deleted, matched, network, get claim() {return claim;}, get skip() {return skip;}, setFetch: fn => {fetchImpl = fn;}};
}

test('worker stores only the offline explanation and removes only its own obsolete cache', async () => {
  const w = worker(); let done;
  w.handlers.install({waitUntil: p => {done = p;}}); await done;
  assert.equal(w.added.length, 1); assert.equal(w.added[0].url, base + 'offline.html'); assert.equal(w.added[0].cache, 'reload'); assert.ok(w.skip);
  w.handlers.activate({waitUntil: p => {done = p;}}); await done;
  assert.deepEqual(w.deleted, ['air-threat-map-offline-old']); assert.ok(w.claim);
});

test('worker always requests a fresh map; network failure or HTTP error returns no old map', async () => {
  const w = worker();
  async function navigate(url) {
    let promise;
    w.handlers.fetch({request: {url, mode: 'navigate', method: 'GET'}, respondWith: p => {promise = p;}});
    return (await promise).text();
  }
  assert.equal(await navigate(base + '?pwa=1'), 'fresh map');
  assert.equal(w.network[0][1].cache, 'no-store'); assert.equal(w.matched.length, 0);
  w.setFetch(async () => {throw new Error('offline');});
  assert.equal(await navigate(base + 'index.html'), 'offline explanation');
  w.setFetch(async () => new Response('bad gateway', {status: 502}));
  assert.equal(await navigate(base), 'offline explanation');
  assert.deepEqual(w.matched, [base + 'offline.html', base + 'offline.html']);
});

test('worker leaves live APIs, data files, tiles, other projects and non-GET requests untouched', () => {
  const w = worker();
  const cases = [
    {url: 'https://air-api.rc-kharkivindependence.space/api/monitor/tracks', mode: 'cors', method: 'GET'},
    {url: 'https://server.arcgisonline.com/tile/1/2/3', mode: 'no-cors', method: 'GET'},
    {url: base + 'kharkiv-ring-road.geojson', mode: 'cors', method: 'GET'},
    {url: base + 'air-mode.js', mode: 'no-cors', method: 'GET'},
    {url: 'https://deafinicio.github.io/another-project/', mode: 'navigate', method: 'GET'},
    {url: base, mode: 'navigate', method: 'POST'}
  ];
  for (const request of cases) w.handlers.fetch({request, respondWith: () => assert.fail('Unexpected interception: ' + request.url)});
  assert.equal(w.network.length, 0); assert.equal(w.added.length, 0); assert.equal(w.matched.length, 0);
});

test('offline explanation follows the saved language without loading scripts, APIs or map tiles', () => {
  for (const language of ['uk', 'en']) {
    const dom = new JSDOM(fs.readFileSync(path.join(root, 'offline.html'), 'utf8'), {url: base, runScripts: 'dangerously', beforeParse(w) {w.localStorage.setItem('air-map-language-v1', language);}});
    try {
      assert.equal(dom.window.document.documentElement.lang, language);
      assert.equal(dom.window.document.querySelectorAll('script[src],iframe,img,link[rel="stylesheet"]').length, 0);
      assert.ok(dom.window.document.querySelector('#description').textContent.includes(language === 'uk' ? 'не завантажено' : 'not been loaded'));
    } finally { dom.window.close(); }
  }
});
