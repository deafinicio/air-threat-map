/* Reusable takeoff-report marker. No feed or coordinates are activated by this module. */
(function(root) {
  "use strict";
  const svg = `<svg viewBox="0 0 64 64" width="44" height="44" aria-hidden="true" focusable="false">
    <path d="M32 5 36 25 56 39 55 43 37 36 36 49 43 55 43 58 32 54 21 58 21 55 28 49 27 36 9 43 8 39 28 25Z" fill="#2a0710" stroke="#ff496b" stroke-width="1.8" stroke-linejoin="round"/>
    <path d="M32 9V49M28 25 32 29 36 25M16 39 29 32M48 39 35 32" fill="none" stroke="#ff9aae" stroke-width="1" opacity=".8"/>
    <circle cx="32" cy="30" r="2.3" fill="#ff496b"/>
  </svg>`;
  const css = `
    .air-aviation-icon {background:none;border:0}
    .air-aviation-reference {position:relative;width:76px;height:76px;display:grid;place-items:center;color:#ff496b}
    .air-aviation-reference svg {z-index:1;filter:drop-shadow(0 0 6px #ff496b) drop-shadow(0 0 16px #ff496b66)}
    .air-aviation-reference::before,.air-aviation-reference::after {content:"";position:absolute;inset:13px;border:1px solid #ff496b;border-radius:50%;box-shadow:0 0 9px #ff496b80,inset 0 0 9px #ff496b33;animation:air-aviation-pulse 2.6s ease-out infinite;pointer-events:none}
    .air-aviation-reference::after {animation-delay:1.3s}
    .air-aviation-reference span {position:absolute;right:0;bottom:6px;font:11px monospace;background:#220811;border:1px solid #ff496b88;border-radius:3px;padding:1px 4px;color:#ffd5df}
    @keyframes air-aviation-pulse {0%{transform:scale(.7);opacity:.85}100%{transform:scale(1.5);opacity:0}}
    @media(prefers-reduced-motion:reduce) {.air-aviation-reference::before,.air-aviation-reference::after{animation:none;opacity:.35}.air-aviation-reference::after{transform:scale(1.35)}}
  `;
  function installStyles() {
    if (document.getElementById("air-aviation-symbol-style")) return;
    const style=document.createElement("style");style.id="air-aviation-symbol-style";style.textContent=css;document.head.appendChild(style);
  }
  function createIcon(leaflet, count=1) {
    installStyles();
    const value=Math.max(1,Math.min(999,Math.round(Number(count)||1)));
    return leaflet.divIcon({className:"air-aviation-icon",html:`<div class="air-aviation-reference">${svg}${value>1?`<span>${value}</span>`:""}</div>`,iconSize:[76,76],iconAnchor:[38,38],popupAnchor:[0,-30]});
  }
  root.AirAviationSymbol={svg,css,createIcon,installStyles};
})(typeof window !== "undefined" ? window : globalThis);
