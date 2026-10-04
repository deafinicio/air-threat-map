(function (root) {
  "use strict";
  const REGIONS = Object.freeze({
    sumy_oblast: {iso: "UA-59", uk: "Сумська область", en: "Sumy Oblast"},
    poltava_oblast: {iso: "UA-53", uk: "Полтавська область", en: "Poltava Oblast"},
    dnipropetrovsk_oblast: {iso: "UA-12", uk: "Дніпропетровська область", en: "Dnipropetrovsk Oblast"},
    donetsk_oblast: {iso: "UA-14", uk: "Донецька область", en: "Donetsk Oblast"},
    luhansk_oblast: {iso: "UA-09", uk: "Луганська область", en: "Luhansk Oblast"}
  });
  const EXPLICIT = {
    sumy_oblast: /^(?:сумськ\S*\s+област\S*|сумск\S*\s+област\S*|сумщин\S*)$/iu,
    poltava_oblast: /^(?:полтавськ\S*\s+област\S*|полтавск\S*\s+област\S*|полтавщин\S*)$/iu,
    dnipropetrovsk_oblast: /^(?:дніпропетровськ\S*\s+област\S*|днепропетровск\S*\s+област\S*|дніпропетровщин\S*)$/iu,
    donetsk_oblast: /^(?:донецьк\S*\s+област\S*|донецк\S*\s+област\S*|донеччин\S*)$/iu,
    luhansk_oblast: /^(?:луганськ\S*\s+област\S*|луганск\S*\s+област\S*|луганщин\S*)$/iu
  };
  let features = new Map();
  let pending = null;
  function setGeometry(collection) {
    features = new Map((collection.features || []).map(f => [f.properties && f.properties["iso3166-2"], f]));
  }
  async function load(url = "./kharkiv-neighbor-oblasts.geojson") {
    if (features.size) return true;
    if (pending) return pending;
    pending = (async () => {
      try {
        const response = await fetch(url, {cache: "no-cache"});
        if (!response.ok) throw new Error("Oblast geometry HTTP " + response.status);
        setGeometry(await response.json());
        return true;
      } catch (error) {
        console.warn("Oblast border geometry unavailable", error);
        return false;
      } finally { pending = null; }
    })();
    return pending;
  }
  function exteriorRings(feature) {
    const geometry = feature && (feature.geometry || feature);
    if (!geometry) return [];
    if (geometry.type === "Polygon") return geometry.coordinates.length ? [geometry.coordinates[0]] : [];
    if (geometry.type === "MultiPolygon") return geometry.coordinates.map(p => p[0]).filter(Boolean);
    return [];
  }
  function nearestPoint(latlng, feature) {
    if (!Array.isArray(latlng) || latlng.length < 2 || latlng.some(v => v == null || !Number.isFinite(Number(v)))) return null;
    const [lat0, lon0] = latlng.map(Number);
    if (Math.abs(lat0) > 90 || Math.abs(lon0) > 180) return null;
    const scale = Math.cos(lat0 * Math.PI / 180);
    let best = null;
    exteriorRings(feature).forEach((ring, polygonIndex) => {
      // GeoJSON rings are closed. Close malformed open rings without discarding the final edge.
      for (let i = 0; i < ring.length; i++) {
        const a = ring[i], b = ring[(i + 1) % ring.length];
        if (!a || !b || [a[0], a[1], b[0], b[1]].some(v => v == null || !Number.isFinite(Number(v)))) continue;
        const ax = (a[0] - lon0) * scale, ay = a[1] - lat0;
        const dx = (b[0] - a[0]) * scale, dy = b[1] - a[1];
        const denominator = dx * dx + dy * dy;
        const t = denominator ? Math.max(0, Math.min(1, -(ax * dx + ay * dy) / denominator)) : 0;
        const d2 = (ax + t * dx) ** 2 + (ay + t * dy) ** 2;
        if (!best || d2 < best.d2) best = {lat: a[1] + t * (b[1] - a[1]), lng: a[0] + t * (b[0] - a[0]), d2, polygonIndex, segmentIndex: i, segmentFraction: t};
      }
    });
    return best;
  }
  function regionForPlace(place) {
    if (!place) return null;
    const id = place.place_id || place.id;
    // A region ID is necessary. Explicit region wording is also required: no bare Сумська/Полтавська.
    if (!REGIONS[id]) return null;
    const name = String(place.raw_name || place.canonical_name || "").toLowerCase().trim().replace(/[!⚠️❗‼️.,;]+$/gu, "").trim();
    return EXPLICIT[id].test(name) ? id : null;
  }
  function point(place) {
    if (!place || !place.geometry_resolved && !place.resolved) return null;
    if (place.lat != null && place.lng != null && Number.isFinite(Number(place.lat)) && Number.isFinite(Number(place.lng))) return [Number(place.lat), Number(place.lng)];
    const g = place.geometry;
    if (g && g.type === "Point" && g.coordinates.every(v => v != null && Number.isFinite(Number(v)))) return [g.coordinates[1], g.coordinates[0]];
    return null;
  }
  const ROLES = new Set(["reported_position", "reported_area", "direction_target", "inherited_direction", "linear_reference_projection"]);
  function anchorFor(event, byId) {
    let id = event.reply_to_message_id;
    const visited = new Set([String(event.message_id)]);
    while (id != null && !visited.has(String(id))) {
      visited.add(String(id));
      const ancestor = byId.get(String(id));
      if (!ancestor) return null;
      if (Number(ancestor.object_count) > 1) return null;
      const references = (ancestor.raw_places || ancestor.places || []).filter(p => ROLES.has(p.location_role));
      if (references.length > 1 && references.some(p => !point(p))) return null;
      const candidates = references.map(p => ({place:p,latlng:point(p)})).filter(p => p.latlng);
      const unique = new Map(candidates.map(p => [p.latlng.join(","), p]));
      if (unique.size > 1) return null;
      if (unique.size === 1) return {...unique.values().next().value, messageId: ancestor.message_id};
      id = ancestor.reply_to_message_id;
    }
    return null;
  }
  function resolve(payload) {
    if (!payload || !features.size) return payload;
    (payload.threads || []).forEach(thread => (thread.tracks || []).forEach(track => {
      if (!track.__monitor1654) return;
      (track.segments || []).forEach(segment => {
        const events = segment.events || [];
        const byId = new Map(events.map(e => [String(e.message_id), e]));
        events.forEach(event => {
          if (Number(event.object_count) > 1) return;
          // Never arbitrarily choose a destination from multiple alternatives in one report.
          const targets = (event.places || []).filter(p => p.location_role === "direction_target" || event.status === "left_region" && ROLES.has(p.location_role));
          if (targets.length !== 1) return;
          const place = targets[0], regionId = regionForPlace(place);
          if (!regionId || point(place)) return;
          const anchor = anchorFor(event, byId);
          if (!anchor) return;
          const snap = nearestPoint(anchor.latlng, features.get(REGIONS[regionId].iso));
          if (!snap) return;
          Object.assign(place, {
            resolved:true, geometry_resolved:true, lat:snap.lat, lng:snap.lng,
            geometry:{type:"Point",coordinates:[snap.lng,snap.lat]},
            region_border_projection:true, region_border_id:regionId,
            region_border_from_message_id:anchor.messageId,
            region_border_from_latlng:anchor.latlng.slice(),
            region_border_polygon:snap.polygonIndex, region_border_segment:snap.segmentIndex,
            region_border_fraction:snap.segmentFraction, place_type:"region_border_reference"
          });
        });
      });
    }));
    return payload;
  }
  function displayName(place) {
    const region = REGIONS[place && place.region_border_id];
    if (!region) return null;
    const english = root.airLanguage && root.airLanguage() === "en";
    return (english ? region.en : region.uk) + (english ? " (approximate border reference)" : " (наближена прив’язка до кордону)");
  }
  const api = {REGIONS,load,setGeometry,exteriorRings,nearestPoint,regionForPlace,anchorFor,resolve,displayName};
  root.AirRegionBorders = api;
  if (typeof module !== "undefined") module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
