/* Functional DOM check. Does not claim pixel/layout verification. */
const {JSDOM,ResourceLoader,VirtualConsole}=require('jsdom');
const fs=require('node:fs'),assert=require('node:assert/strict'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const timestamp=new Date(Date.now()-2000).toISOString();
let notices={schema_version:1,available:true,checked_at:timestamp,regions:[
 ...['nizhny_novgorod','murmansk','saratov','belgorod'].map((region_id,i)=>({region_id,kind:i===3?'aviation_activity':'reported_takeoff',message_id:500+i,reported_at:timestamp,expires_at:new Date(Date.parse(timestamp)+30*60*1000).toISOString(),lat:1,lng:2}))
]};
let noticeFailure=false;
let fixture={source:'monitor1654',tracks:[{branch_id:'101:103',root_message_id:101,last_message_id:103,is_active:false,status:'left_region',threat:'attack_uav',object_count:1,started_at:timestamp,updated_at:timestamp,events:[
 {message_id:101,telegram_date:timestamp,text:'Ударний БПЛА на Центр міста❗️',explicit_threat:'attack_uav',threat:'attack_uav',object_count:1,places:[{place_id:'kharkiv_center',canonical_name:'Центр міста',location_role:'direction_target',geometry_resolved:true,lat:49.996792,lng:36.231052}]},
 {message_id:102,reply_to_message_id:101,telegram_date:timestamp,text:'Далі рухається❗️',object_count:1,places:[]},
 {message_id:103,reply_to_message_id:102,telegram_date:timestamp,text:'Вилетів в Сумську область⚠️',object_count:1,status:'left_region',places:[{place_id:'sumy_oblast',raw_name:'Сумську область',canonical_name:'Сумська область',location_role:'direction_target',geometry_resolved:false,lat:null,lng:null}]}
]}]};
if(process.env.AIR_PIPELINE_FIXTURE) fixture=JSON.parse(fs.readFileSync(process.env.AIR_PIPELINE_FIXTURE));
class Loader extends ResourceLoader {
 fetch(url) {
  if(url.includes('leaflet@') && url.endsWith('.js')) return Promise.resolve(fs.readFileSync(require.resolve('leaflet/dist/leaflet.js')));
  if(url.includes('leaflet@') && url.endsWith('.css')) return Promise.resolve(fs.readFileSync(require.resolve('leaflet/dist/leaflet.css')));
  if(!url.startsWith('https://test.local/')) return null;
  let filename=path.basename(new URL(url).pathname);let s=fs.readFileSync(root+'/'+filename);
  if(filename==='air-mode.js') s=Buffer.from(s.toString().replace(/\}\)\(\);\s*$/,'window.airTest={normalizeMonitorPayload,buildPopupHtml,resolveThreatVisualType,drawTrackSequenceCurves,renderAirPayload,ensureAirLayers,getLayers:()=>airHistoryLayer.getLayers()};})();'));
  return Promise.resolve(s);
 }
}
const errors=[],console=new VirtualConsole();console.on('jsdomError',e=>errors.push(e.message));
const dom=new JSDOM(fs.readFileSync(root+'/index.html','utf8'),{url:'https://test.local/',runScripts:'dangerously',resources:new Loader(),pretendToBeVisual:true,virtualConsole:console,beforeParse(w){
 Object.defineProperty(w.HTMLElement.prototype,'clientWidth',{get(){return this.id==='map'?1440:100}});
 Object.defineProperty(w.HTMLElement.prototype,'clientHeight',{get(){return this.id==='map'?848:100}});
 w.SVGSVGElement.prototype.createSVGRect=()=>({});
 w.fetch=async url=>({ok:true,json:async()=>{
  if(String(url).includes('/region-alerts')) {if(noticeFailure)throw new Error('offline');return JSON.parse(JSON.stringify(notices));}
  if(String(url).includes('.geojson')) return JSON.parse(fs.readFileSync(root+'/'+new URL(url,'https://test.local').pathname.split('/').pop()));
  if(String(url).includes('/tracks')||String(url).includes('/debug-track')) return JSON.parse(JSON.stringify(fixture));
  return {ok:true,status:'CLEAR',checked_at:timestamp};
 }});
}});
function wait(ms){return new Promise(r=>setTimeout(r,ms))}
(async()=>{
 await wait(500);const w=dom.window,d=w.document;
 assert.equal(d.documentElement.lang,'uk');assert.ok(d.querySelector('.air-disclaimer-body').textContent.includes('Карта не відображає'));
 d.querySelector('.air-disclaimer-ok').click();await wait(300);
 assert.ok(d.querySelector('#hud-live').textContent.includes('ДАНІ'));
 assert.equal(d.querySelector('#air-threat-legend').style.display,'block');
 assert.equal(d.querySelector('#kharkiv-alert-state').textContent,'ВІДБІЙ');
 // Closing exit stays visible as a two-point straight line; two layers are glow and core.
 const lines=w.airTest.getLayers().filter(line=>line.__airTrackRole);
 assert.equal(lines.length,2);
 assert.ok(lines.every(line=>line.getLatLngs().length===2));
 assert.equal(d.querySelector('#hud-shown').textContent,'0');
 w.setAirLanguage('en');await wait(100);
 assert.equal(d.documentElement.lang,'en');assert.equal(w.localStorage.getItem('air-map-language-v1'),'en');
 assert.ok(d.querySelector('#air-threat-legend').textContent.includes('AIR THREATS'));
 assert.equal(d.querySelector('#air-threat-legend').style.display,'block');
 d.querySelector('#air-threat-legend .air-legend-toggle').click();
 assert.ok(d.querySelector('#air-threat-legend').classList.contains('air-legend-collapsed'));
 assert.equal(d.querySelector('#kharkiv-alert-state').textContent,'ALL CLEAR');
 assert.ok(d.querySelector('#air-visual-settings-panel').textContent.includes('Reset'));
 assert.ok(d.querySelector('.air-disclaimer-body').textContent.includes('During an air raid alert'));
 const p=w.airTest.normalizeMonitorPayload(JSON.parse(JSON.stringify(fixture)));w.AirRegionBorders.resolve(p);
 const thread=p.threads[0],track=thread.tracks[0],event=track.segments[0].events[2],place=event.places[0];
 let popup=w.airTest.buildPopupHtml(thread,track,event,place,'historical');
 assert.ok(popup.includes('Sumy Oblast (approximate border reference)'));assert.ok(popup.includes('SOURCE REPORT'));assert.ok(popup.includes('Вилетів в Сумську область⚠️'));
 assert.equal(w.airTest.resolveThreatVisualType(track),'attack_uav_unknown');
 w.setAirLanguage('uk');await wait(100);
 assert.equal(d.querySelector('#air-threat-legend').style.display,'block');
 assert.ok(d.querySelector('#air-threat-legend').classList.contains('air-legend-collapsed'));
 d.querySelector('#air-threat-legend .air-legend-toggle').click();
 popup=w.airTest.buildPopupHtml(thread,track,event,place,'historical');assert.ok(popup.includes('ПОВІДОМЛЕННЯ ДЖЕРЕЛА'));
 assert.ok(popup.includes('наближена прив’язка до кордону'));
 const icon=w.AirAviationSymbol.createIcon(w.L,2);assert.ok(icon.options.html.includes('<span>2</span>'));assert.ok(d.getElementById('air-aviation-symbol-style').textContent.includes('prefers-reduced-motion'));
 // Regional notices are their own layer and never increase active-target counts.
 assert.ok(d.querySelector('.air-region-notice-heading').textContent.endsWith('4'));
 assert.ok(d.querySelector('.leaflet-bottom.leaflet-left .air-region-notices'));
 assert.equal(d.querySelector('#hud-shown').textContent,'0');
 const regionalMarkers=[...d.querySelectorAll('.air-aviation-icon')];assert.equal(regionalMarkers.length,4);
 assert.ok(regionalMarkers.every(el=>el.getAttribute('title').includes('Регіон повідомлення')));
 d.querySelector('.air-region-notice-heading').click();
 const saratov=[...d.querySelectorAll('.air-region-notice-row')].find(el=>el.textContent==='Саратовська область');saratov.click();
 assert.ok(Math.abs(w.map.getCenter().lat-51.788829)<.000001);assert.ok(Math.abs(w.map.getCenter().lng-46.573604)<.000001);
 assert.ok(d.querySelector('.air-region-notice-popup').textContent.includes('Положення літаків не визначається'));
 w.setAirLanguage('en');await wait(50);
 assert.ok(d.querySelector('.air-region-notice-popup').textContent.includes('Aircraft positions are not determined'));
 assert.ok(d.querySelector('.air-region-notice-popup').textContent.includes('Saratov Oblast'));
 const now=Date.now(),payload={schema_version:1,available:true,checked_at:new Date(now).toISOString(),regions:[
  {region_id:'saratov',kind:'reported_takeoff',message_id:1,reported_at:new Date(now-1000).toISOString(),expires_at:new Date(now+1000).toISOString(),lat:1,lng:2},
  {region_id:'airfield',kind:'reported_takeoff',message_id:2,reported_at:timestamp,expires_at:new Date(now+1000).toISOString()},
  {region_id:'murmansk',kind:'reported_takeoff',message_id:3,reported_at:new Date(now+1000).toISOString(),expires_at:new Date(now+2000).toISOString()},
  {region_id:'belgorod',kind:'aviation_activity',message_id:4,reported_at:timestamp,expires_at:new Date(now-1000).toISOString()}
 ]};
 const safe=w.AirRegionAlerts.validated(payload,now);assert.equal(safe.length,1);assert.ok(!('lat' in safe[0]));
 assert.throws(()=>w.AirRegionAlerts.validated({...payload,available:false},now));
 assert.throws(()=>w.AirRegionAlerts.validated({...payload,checked_at:'2024-01-01T00:00:00Z'},now));
 noticeFailure=true;await w.AirRegionAlerts.refresh();assert.equal(d.querySelectorAll('.air-aviation-icon').length,0);
 assert.ok(d.querySelector('.air-region-notice-detail').textContent.includes('Reports unavailable'));
 noticeFailure=false;notices.regions=[{...notices.regions[0],expires_at:new Date(Date.now()+150).toISOString()}];await w.AirRegionAlerts.refresh();
 assert.equal(d.querySelectorAll('.air-aviation-icon').length,1);await wait(1200);assert.equal(d.querySelectorAll('.air-aviation-icon').length,0);
 notices.regions=[];await w.AirRegionAlerts.refresh();assert.ok(d.querySelector('.air-region-notice-detail').textContent.includes('No recent reports'));
 w.AirRegionAlerts.stop();assert.equal(d.querySelector('.air-region-notices'),null);
 // Source-derived midpoint must not become an unambiguous border origin.
 const multiple=JSON.parse(JSON.stringify(fixture));multiple.tracks[0].events[0].places.push({...multiple.tracks[0].events[0].places[0],lat:49.9,lng:36.4});
 const mp=w.airTest.normalizeMonitorPayload(multiple);w.AirRegionBorders.resolve(mp);
 assert.ok(!mp.threads[0].tracks[0].segments[0].events[2].places[0].region_border_projection);
 assert.deepEqual(errors,[]);
 process.stdout.write('DOM integration: UA/EN, Leaflet straight exit, inactive counts, ambiguity, 4 regional notices, translated popups, no coordinate injection, expiry/future rejection, feed failure and teardown PASS\n');
 dom.window.close();
})().catch(e=>{process.stderr.write(String(e.stack)+'\n');dom.window.close();process.exit(1)});
