/* Regional public notices. Fixed reference anchors, never aircraft positions. */
(function(root) {
  "use strict";
  const REGIONS = Object.freeze({
    nizhny_novgorod: {uk:"Нижньогородська область",en:"Nizhny Novgorod Oblast",point:[55.991434,44.415355]},
    murmansk: {uk:"Мурманська область",en:"Murmansk Oblast",point:[68.480743,33.600495]},
    saratov: {uk:"Саратовська область",en:"Saratov Oblast",point:[51.788829,46.573604]},
    belgorod: {uk:"Бєлгородська область",en:"Belgorod Oblast",point:[50.643981,36.589746]}
  });
  const ENDPOINT = "https://air-api.rc-kharkivindependence.space/api/monitor/region-alerts";
  const TTL = 30*60*1000;
  const LABELS = {
    title:["Регіональні попередження","Regional notices"],
    loading:["Завантаження повідомлень…","Loading reports…"],
    empty:["Немає свіжих повідомлень","No recent reports"],
    unavailable:["Повідомлення недоступні","Reports unavailable"],
    reference:["Регіон повідомлення","Report region"],
    takeoff:["Повідомлення про зліт","Reported takeoff"],
    activity:["Повідомлення про активність авіації","Reported aviation activity"],
    note:["Умовний регіональний орієнтир. Положення літаків не визначається.","Approximate regional reference. Aircraft positions are not determined."],
    expiry:["Повідомлення показується до 30 хвилин. Зникнення маркера не означає відбій тривоги.","Reports are shown for up to 30 minutes. A marker disappearing does not mean an all clear."],
    official:["Керуйтеся офіційними повідомленнями про тривогу.","Follow official air raid alerts."],
    source:["Повідомлення джерела №","Source report #"]
  };
  let map, layer, control, panel, enabled=false, timer=null, expiryTimer=null, request=null, generation=0;
  let reports=[], status="loading", checkedAt=null, expanded=false;
  function label(key) {return LABELS[key][root.airLanguage && root.airLanguage()==="en"?1:0];}
  function regionName(key) {return REGIONS[key][root.airLanguage && root.airLanguage()==="en"?"en":"uk"];}
  function escaped(value) {return String(value).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
  function validated(payload, now=Date.now()) {
    const checked=Date.parse(payload && payload.checked_at);
    if (!payload || payload.schema_version!==1 || payload.available!==true || !Array.isArray(payload.regions) ||
        !Number.isFinite(checked) || checked>now+60000 || now-checked>120000) throw new Error("Invalid regional notice payload");
    const byRegion=new Map();
    payload.regions.forEach(item=>{
      if (!item || !Object.prototype.hasOwnProperty.call(REGIONS,item.region_id) ||
          !["reported_takeoff","aviation_activity"].includes(item.kind) || !Number.isSafeInteger(item.message_id) || item.message_id<1) return;
      const reported=Date.parse(item.reported_at), expires=Date.parse(item.expires_at);
      if (!Number.isFinite(reported) || !Number.isFinite(expires) || reported>now || expires<=now || expires<=reported || expires>reported+TTL) return;
      const safe={region_id:item.region_id,kind:item.kind,message_id:item.message_id,reported_at:item.reported_at,expires_at:item.expires_at};
      const old=byRegion.get(item.region_id);
      if (!old || Date.parse(old.reported_at)<reported) byRegion.set(item.region_id,safe);
    });
    return [...byRegion.values()];
  }
  function popup(item) {
    const locale=root.airLocale ? root.airLocale() : "uk-UA";
    const time=new Date(item.reported_at).toLocaleString(locale,{timeZone:"Europe/Kyiv",hour12:false});
    return `<div class="air-region-notice-popup"><strong>${escaped(regionName(item.region_id))}</strong><p>${escaped(label("reference"))}</p><p>${escaped(label(item.kind==="reported_takeoff"?"takeoff":"activity"))}<br>${escaped(time)}<br>${escaped(label("source"))}${item.message_id}</p><p>${escaped(label("note"))}</p><p>${escaped(label("expiry"))}</p><p>${escaped(label("official"))}</p></div>`;
  }
  function styles() {
    if (document.getElementById("air-region-notices-style")) return;
    const style=document.createElement("style");style.id="air-region-notices-style";
    style.textContent=`.air-region-notices{background:rgba(6,15,22,.94);border:1px solid #294654;border-radius:3px;color:#b7d2db;font:11px monospace;max-width:260px;box-shadow:0 0 15px #0008}.air-region-notices button{font:inherit;color:inherit;border:0;background:none;text-align:left;cursor:pointer;width:100%;padding:9px 11px}.air-region-notices button:hover{background:#15303c}.air-region-notices .air-region-notice-heading{color:#56def4;letter-spacing:.03em}.air-region-notices .air-region-notice-row{color:#ff8ca3;border-top:1px solid #294654}.air-region-notices .air-region-notice-detail{padding:8px 11px;line-height:1.6;border-top:1px solid #294654}.air-region-notice-popup{max-width:250px;font:12px/1.5 monospace}.air-region-notice-popup strong{color:#ff496b}.air-region-notice-popup p{margin:8px 0}.air-region-ref-tooltip{background:#130b14;color:#ffb3c2;border:1px solid #ff496b66;font:10px monospace}.air-region-ref-tooltip::before{border-top-color:#ff496b66}@media(max-width:620px){.air-region-notices{max-width:210px;font-size:10px}}`;
    document.head.appendChild(style);
  }
  function render() {
    if (!enabled || !layer || !panel) return;
    const reopened=new Set(layer.getLayers().filter(m=>m.isPopupOpen()).map(m=>m.__regionId));
    layer.clearLayers();
    reports.forEach(item=>{
      const marker=root.L.marker(REGIONS[item.region_id].point,{icon:root.AirAviationSymbol.createIcon(root.L),title:regionName(item.region_id)+" — "+label("reference"),alt:label("reference"),keyboard:true});
      marker.__regionId=item.region_id;
      marker.bindPopup(popup(item));
      marker.bindTooltip(label("reference"),{className:"air-region-ref-tooltip",direction:"bottom"});
      marker.addTo(layer);
      if (reopened.has(item.region_id)) marker.openPopup();
    });
    panel.replaceChildren();
    const heading=document.createElement("button");heading.className="air-region-notice-heading";heading.type="button";
    heading.textContent=label("title")+" · "+reports.length;heading.setAttribute("aria-expanded",String(expanded));
    heading.addEventListener("click",()=>{expanded=!expanded;render();});panel.appendChild(heading);
    const summary=document.createElement("div");summary.className="air-region-notice-detail";summary.setAttribute("role","status");
    summary.textContent=status==="ready" ? (reports.length ? label("reference") : label("empty")) : label(status);
    if (status==="unavailable") summary.style.color="#ffbe55";
    panel.appendChild(summary);
    if (expanded) {
      reports.forEach(item=>{
        const row=document.createElement("button");row.type="button";row.className="air-region-notice-row";
        row.textContent=regionName(item.region_id);
        row.addEventListener("click",()=>{map.setView(REGIONS[item.region_id].point,6);layer.getLayers().find(m=>m.__regionId===item.region_id).openPopup();});
        panel.appendChild(row);
      });
      const note=document.createElement("div");note.className="air-region-notice-detail";note.textContent=label("note")+" "+label("expiry");panel.appendChild(note);
    }
  }
  async function refresh() {
    if (!enabled) return;
    if (request) request.abort();
    const controller=new AbortController(), token=generation;
    request=controller;
    const timeout=setTimeout(()=>controller.abort(),8000);
    try {
      const response=await root.fetch(ENDPOINT,{cache:"no-store",signal:controller.signal,headers:{Accept:"application/json"}});
      if (!response.ok) throw new Error("Regional notice feed unavailable");
      const payload=await response.json(), rows=validated(payload);
      if (!enabled || token!==generation || request!==controller) return;
      reports=rows;checkedAt=payload.checked_at;status="ready";render();
    } catch (_) {
      if (!enabled || token!==generation || request!==controller) return;
      reports=[];status="unavailable";render();
    } finally {
      clearTimeout(timeout);
      if (request===controller) request=null;
    }
  }
  function start(nextMap) {
    if (enabled) return;
    map=nextMap;enabled=true;generation++;reports=[];status="loading";styles();
    layer=root.L.layerGroup().addTo(map);
    control=root.L.control({position:"bottomright"});
    control.onAdd=function(){panel=document.createElement("div");panel.className="air-region-notices";root.L.DomEvent.disableClickPropagation(panel);root.L.DomEvent.disableScrollPropagation(panel);return panel;};
    control.addTo(map);render();refresh();
    timer=setInterval(refresh,30000);
    expiryTimer=setInterval(()=>{
      if (status==="ready" && Date.now()-Date.parse(checkedAt)>120000) {reports=[];status="unavailable";render();return;}
      const live=reports.filter(item=>Date.parse(item.expires_at)>Date.now());
      if (live.length!==reports.length) {reports=live;render();}
    },1000);
  }
  function stop() {
    enabled=false;generation++;if(request)request.abort();request=null;
    clearInterval(timer);clearInterval(expiryTimer);timer=expiryTimer=null;
    if(layer){layer.clearLayers();map.removeLayer(layer);}if(control)control.remove();
    layer=control=panel=null;reports=[];
  }
  root.addEventListener("airlanguagechange",render);
  root.AirRegionAlerts={start,stop,refresh,validated,REGIONS,popup};
})(window);
