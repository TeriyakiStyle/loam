import { createSoil, quality, applySoilWork, soilNeeds } from './soil.js';
import { seed, grow, yieldKg, SPECIES } from './plants.js';
export const SIZE = 12;
export const ACTIONS = {
  inspect: { label: 'Examine soil', seconds: .7 },
  till: { label: 'Till bed', seconds: 1.4 },
  compost: { label: 'Add compost', seconds: 1, resource: 'compost', cost: 1 },
  water: { label: 'Water bed', seconds: .8, resource: 'water', cost: 2 },
  plant: { label: 'Plant bed', seconds: .8, resource: 'seeds', cost: 1 },
  harvest: { label: 'Harvest bed', seconds: .9 },
};
export function height(x,y) { return .14 + .8 * Math.exp(-((x-9)**2+(y-3)**2)/24) + .08 * Math.sin(x*.5); }
export const cellId = (x,y) => y*SIZE+x;
export function createWorld() {
  return { version: 1, day: 1, cells: Array.from({length:SIZE*SIZE},(_,id)=>{
    const x=id%SIZE,y=Math.floor(id/SIZE);return {id,x,y,soil:createSoil(x,y),examined:false,plant:null};
  }), beds:[], nextBed:1, selected:null, species:'tomato',
  actor:{x:2.5,y:8.5,path:[]}, job:null, inventory:{water:160,compost:80,seeds:80,food:0},
  events:[], notice:'Mark a bed to begin. Click the ground to walk.' };
}
function announce(w,type,message) {
  w.notice=message;w.events.push({type,day:w.day,message});if(w.events.length>40)w.events.shift();
}
export function inside(x,y,polygon) {
  let hit=false;for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){
    const a=polygon[i],b=polygon[j];if((a.y>y)!==(b.y>y)&&x<(b.x-a.x)*(y-a.y)/(b.y-a.y)+a.x)hit=!hit;
  }return hit;
}
export function addBed(w,polygon) {
  if(polygon.length<3)return false;
  const cross=(a,b,c)=>(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x);
  for(let i=0;i<polygon.length;i++)for(let j=i+1;j<polygon.length;j++){
    if(j===i+1||(i===0&&j===polygon.length-1))continue;
    const a=polygon[i],b=polygon[(i+1)%polygon.length],c=polygon[j],d=polygon[(j+1)%polygon.length];
    if(cross(a,b,c)*cross(a,b,d)<=0&&cross(c,d,a)*cross(c,d,b)<=0){
      w.notice='The perimeter crosses itself. Undo a corner and trace around the outside.';return false;
    }
  }
  const ids=w.cells.filter(c=>inside(c.x+.5,c.y+.5,polygon)).map(c=>c.id);
  if(!ids.length){w.notice='That boundary contains no ground. Draw a larger bed.';return false;}
  if(w.beds.some(b=>b.cells.some(id=>ids.includes(id)))){w.notice='Beds cannot overlap. Your existing soil stays in place.';return false;}
  const id=w.nextBed++;w.beds.push({id,name:`Bed ${id}`,cells:ids,polygon});w.selected=id;
  announce(w,'bed.created',`Bed ${id} marked. Examine its soil before preparing it.`);return true;
}
export const selectedBed = w => w.beds.find(b=>b.id===w.selected);
export function removeBed(w) {
  w.beds=w.beds.filter(b=>b.id!==w.selected);cancel(w);w.selected=null;
  announce(w,'bed.removed','Boundary removed. Soil and plants remain on the ground.');
}
export function cancel(w) {w.job=null;w.actor.path=[];}
// Four-neighbor route; terrain elevation affects travel time in tick().
export function route(w,id) {
  let x=Math.floor(w.actor.x),y=Math.floor(w.actor.y);const c=w.cells[id],path=[];
  while(x!==c.x||y!==c.y){if(x!==c.x)x+=Math.sign(c.x-x);else y+=Math.sign(c.y-y);path.push({x:x+.5,y:y+.5});}
  if(!path.length && Math.hypot(w.actor.x-c.x-.5,w.actor.y-c.y-.5)>.01)path.push({x:c.x+.5,y:c.y+.5});
  w.actor.path=path;
}
export function walk(w,id){cancel(w);route(w,id);w.notice='Walking. Completed bed work is preserved.';}
function eligible(w,c,kind,species) {
  if(kind==='inspect')return !c.examined;
  if(!c.examined)return false;
  if(kind==='plant')return !c.plant && quality(c.soil)>=SPECIES[species].minQuality;
  if(kind==='harvest')return c.plant?.ready;
  if(kind==='till'&&c.plant)return false;
  return soilNeeds(c.soil).includes(kind);
}
export function pending(w,kind) {
  return (selectedBed(w)?.cells||[]).filter(id=>eligible(w,w.cells[id],kind,w.species));
}
export function startJob(w,kind) {
  if(!ACTIONS[kind])return;
  const cells=pending(w,kind).sort((a,b)=>{
    const ca=w.cells[a],cb=w.cells[b];return ca.y-cb.y||(ca.y%2?cb.x-ca.x:ca.x-cb.x);
  });
  if(!cells.length){w.notice='No cells need that task. Examine the soil or choose another crop.';return;}
  cancel(w);w.job={kind,cells,total:cells.length,done:0,elapsed:0,species:w.species,bed:w.selected};
  route(w,cells[0]);announce(w,'work.started',`${ACTIONS[kind].label}: working through ${cells.length} cells.`);
}
export function tick(w,dt) {
  dt=Math.min(.1,Math.max(0,dt));const a=w.actor;
  if(a.path.length){const p=a.path[0],dx=p.x-a.x,dy=p.y-a.y,d=Math.hypot(dx,dy);
    const step=dt*3/(1+Math.abs(height(p.x,p.y)-height(a.x,a.y))*2);
    if(d<=step){a.x=p.x;a.y=p.y;a.path.shift();}else{a.x+=dx/d*step;a.y+=dy/d*step;}return;
  }
  const j=w.job;if(!j)return;
  j.elapsed+=dt;const action=ACTIONS[j.kind];if(j.elapsed<action.seconds)return;
  const c=w.cells[j.cells[0]];
  if(action.resource&&w.inventory[action.resource]<action.cost){cancel(w);announce(w,'work.blocked',`Out of ${action.resource}. Restock at the workshop supplies.`);return;}
  if(action.resource)w.inventory[action.resource]-=action.cost;
  if(j.kind==='inspect')c.examined=true;
  else if(j.kind==='plant')c.plant=seed(j.species);
  else if(j.kind==='harvest'){w.inventory.food+=yieldKg(c.plant);c.plant=null;}
  else applySoilWork(c.soil,j.kind);
  j.done++;j.cells.shift();j.elapsed=0;
  if(!j.cells.length){announce(w,'work.completed',`${action.label} complete. ${j.done} cells finished.`);w.job=null;}
  else route(w,j.cells[0]);
}
export function advanceDays(w,days) {
  if(w.job||w.actor.path.length){w.notice='Finish or stop the current work before advancing days.';return;}
  // Sampling soil per day keeps plant accounting independent of frame rate.
  for(let i=0;i<days;i++){for(const c of w.cells){if(c.plant)grow(c.plant,1,quality(c.soil));}w.day++;}
  announce(w,'calendar.advanced',`${days} days passed. Plants grew under the current soil conditions.`);
}
export function restore(raw) {
  try {const w=JSON.parse(raw);if(w.version!==1||w.cells?.length!==SIZE*SIZE||!Array.isArray(w.beds)||!w.actor||!w.inventory) return null;
    if(!w.cells.every((c,i)=>c.id===i&&c.soil&&['fertility','structure','moisture'].every(k=>Number.isFinite(c.soil[k])&&c.soil[k]>=0&&c.soil[k]<=1)&&(!c.plant||SPECIES[c.plant.species])))return null;
    if(!w.beds.every(b=>Array.isArray(b.cells)&&b.cells.every(id=>Number.isInteger(id)&&id>=0&&id<SIZE*SIZE)))return null;
    if(!Number.isFinite(w.actor.x)||!Number.isFinite(w.actor.y)||w.actor.x<0||w.actor.y<0||w.actor.x>=SIZE||w.actor.y>=SIZE)return null;
    return w;
  }catch{return null;}
}
