const assert = require('node:assert/strict');
const fs = require('node:fs');
const B = require('../air-region-borders.js');
B.setGeometry(JSON.parse(fs.readFileSync(__dirname+'/../kharkiv-neighbor-oblasts.geojson')));
let checks=0;
function check(x,msg){assert.ok(x,msg);checks++;}
const rectangle={type:'Polygon',coordinates:[[[0,0],[2,0],[2,2],[0,2],[0,0]]]};
const snap=B.nearestPoint([1,3],rectangle);
check(snap.lat===1 && snap.lng===2,'point projects into segment, not nearest vertex');
check(B.nearestPoint([null,3],rectangle)===null,'null coordinates');
check(B.nearestPoint([NaN,3],rectangle)===null,'invalid coordinates');
check(B.nearestPoint([1,3],{type:'MultiPolygon',coordinates:[rectangle.coordinates]}).lng===2,'multipolygon');
const hole={type:'Polygon',coordinates:[rectangle.coordinates[0],[[.9,.9],[1.1,.9],[1.1,1.1],[.9,.9]]]};
check(B.nearestPoint([1,1],hole).d2>.1,'exclude internal holes from regional exterior');
function p(lat=50,lng=36){return {geometry_resolved:true,resolved:true,lat,lng,location_role:'reported_position',place_id:'known'}};
function region(id='sumy_oblast',raw='Сумську область'){return {place_id:id,raw_name:raw,geometry_resolved:false,location_role:'direction_target'}};
function payload(events){return {threads:[{tracks:[{__monitor1654:true,segments:[{events}]}]}]};}
function events(place=region()){return [{message_id:1,places:[p()]},{message_id:2,reply_to_message_id:1,places:[place]}];}
let rows=events();B.resolve(payload(rows));check(rows[1].places[0].region_border_projection,'sumy exit projection');
check(rows[1].places[0].region_border_from_message_id===1,'anchor message identity');
check(rows[1].places[0].lat>50 && rows[1].places[0].lng<36,'sumy nearest border');
for (const [id,r] of Object.entries(B.REGIONS)){
 rows=events(region(id,r.uk));B.resolve(payload(rows));check(rows[1].places[0].region_border_projection,'neighbor '+id);
}
for(const raw of ['Сумську','вул. Сумську','Суми']){rows=events(region('sumy_oblast',raw));B.resolve(payload(rows));check(!rows[1].places[0].region_border_projection,'street/city rejected '+raw);}
rows=events();rows[1].reply_to_message_id=null;B.resolve(payload(rows));check(!rows[1].places[0].region_border_projection,'chronological neighbor is not an ancestor');
rows=events();rows[0].places.push(p(49,35));B.resolve(payload(rows));check(!rows[1].places[0].region_border_projection,'ambiguous origin');
rows=events();rows[0].places.push({place_id:'unknown',location_role:'reported_position',geometry_resolved:false});B.resolve(payload(rows));check(!rows[1].places[0].region_border_projection,'known plus unknown alternative is ambiguous');
rows=events();rows[1].places.push(region('poltava_oblast','Полтавську область'));B.resolve(payload(rows));check(!rows[1].places[0].region_border_projection,'ambiguous destination');
rows=events();rows[0].object_count=2;B.resolve(payload(rows));check(!rows[1].places[0].region_border_projection,'multi object origin');
rows=events();rows[1].places[0].location_role='reported_area';B.resolve(payload(rows));check(!rows[1].places[0].region_border_projection,'area alone is not a border destination');
rows=[{message_id:1,places:[p()]},{message_id:2,reply_to_message_id:1,places:[]},{message_id:3,reply_to_message_id:2,status:'left_region',places:[region()]}];B.resolve(payload(rows));check(rows[2].places[0].region_border_from_message_id===1,'skip unresolved ancestor only along reply chain');
rows=events();rows[1].reply_to_message_id=99;B.resolve(payload(rows));check(!rows[1].places[0].region_border_projection,'missing ancestor');
rows=events();rows[0].reply_to_message_id=2;rows[0].places=[];B.resolve(payload(rows));check(!rows[1].places[0].region_border_projection,'cycle');
B.setGeometry({features:[]});rows=events();B.resolve(payload(rows));check(!rows[1].places[0].region_border_projection,'missing geometry');
console.log('BORDER CHECKS:',checks,'PASS');
