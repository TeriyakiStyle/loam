import { createWorld,restore,selectedBed,addBed,removeBed,walk,startJob,pending,tick,advanceDays,cancel,ACTIONS,SIZE } from '../workshop/world.js';
import { quality } from '../workshop/soil.js';
import { SPECIES,yieldKg } from '../workshop/plants.js';
import { groundSVG,project } from '../workshop/view.js';
const KEY='loam.bed-workshop.v1';
export function render(root){
 let w=createWorld(),saveStatus='Saved on this device';
 try{const saved=localStorage.getItem(KEY);if(saved){const loaded=restore(saved);if(loaded)w=loaded;else saveStatus='Old save could not be loaded. A fresh workshop is open.';}}catch{saveStatus='Saving unavailable in this browser';}
 let mode='walk',outline=[],focusCell=98,paused=matchMedia('(prefers-reduced-motion: reduce)').matches,speed=1,last=0,raf,elapsed=0,uiElapsed=0;
 root.innerHTML=`<section class="lw"><header class="lw-heading"><div><span class="lw-eyebrow">A SMALL PATCH OF POSSIBILITY</span><h1>LOAM<span>the bed workshop</span></h1></div><div class="lw-date"><span data-day></span><small>Early season · temperate meadow</small></div></header>
 <div class="lw-layout"><div class="lw-board"><div class="lw-toolbar"><div><button data-mode="walk" aria-pressed="true">↗ Walk & select</button><button data-mode="draw" aria-pressed="false">◇ Mark a bed</button><button data-mode="soil" aria-pressed="false">◉ Soil view</button></div><button data-command="pause"></button></div>
 <div class="lw-draw" hidden><span>Click perimeter corners, then finish. Arrow keys move the cursor; Enter adds a corner.</span><button data-command="undo">Undo corner</button><button data-command="finish">Finish bed</button><button data-command="cancel-draw">Cancel</button></div>
 <div class="lw-map"><div class="lw-map-label">THE MEADOW<small>12 × 12 metres</small></div><svg data-ground viewBox="0 0 1000 650" tabindex="0" role="group" aria-label="Isometric meadow. Arrow keys choose a ground cell; Enter walks or adds a bed corner."></svg><div class="lw-compass">N<span>↗</span></div><div class="lw-map-note">A little ground. A beginning.</div></div>
 <div class="lw-bottom"><p data-notice role="status" aria-live="polite"></p><div><label>Pace <select data-speed><option value="1">1×</option><option value="3">3×</option><option value="8">8×</option></select></label><button data-command="stop">Stop work</button></div></div></div>
 <aside class="lw-journal"><div class="lw-eyebrow">FIELD JOURNAL / 01</div><div data-panel></div></aside></div>
 <footer class="lw-footer"><span data-save></span><details><summary>About this workshop</summary><p>One ground cell is one square metre. Species timing and yields are editable game assumptions. Soil quality is a simplified index; yield uses its average over the growing period. Moisture holds between tasks in this first workshop; weather and daily water demand are future systems.</p><p>Work takes real seconds; “Advance 7 days” advances plant growth. Supplies can be replenished freely while testing. Terrain and character are original procedural vector art, with no external runtime or art dependencies.</p></details></footer></section>`;
 const q=s=>root.querySelector(s),ground=q('[data-ground]');
 function save(){try{localStorage.setItem(KEY,JSON.stringify(w));}catch{saveStatus='Saving unavailable in this browser';}q('[data-save]').textContent=saveStatus;}
 function panel(){const b=selectedBed(w),cells=(b?.cells||[]).map(id=>w.cells[id]),known=cells.filter(c=>c.examined),average=k=>known.length?known.reduce((s,c)=>s+c.soil[k],0)/known.length:0;
  const crop=cells.filter(c=>c.plant),ready=crop.filter(c=>c.plant.ready),allKnown=known.length===cells.length&&cells.length;
  q('[data-day]').textContent=`Day ${w.day}`;q('[data-notice]').textContent=w.notice;
  q('[data-command="pause"]').textContent=paused?'▶ Resume':'Ⅱ Pause';
  q('[data-panel]').innerHTML=`<h2>${b?b.name:'Your first bed'}</h2><p class="lw-sub">${b?`${cells.length} m² · ${known.length}/${cells.length} cells examined`:'Draw its edges. Learn its soil. Give it a beginning.'}</p>
  ${w.beds.length?`<label class="lw-bed-select">Selected bed<select data-bed>${w.beds.map(v=>`<option value="${v.id}" ${v.id===w.selected?'selected':''}>${v.name} · ${v.cells.length} m²</option>`).join('')}</select></label>`:''}
  ${!b?`<div class="lw-empty"><span>01</span><h3>Choose your ground</h3><p>Mark three or more corners around a patch of meadow. The boundary follows the slope.</p><button data-mode="draw">Mark a bed</button></div>`:`<div class="lw-score"><strong>${known.length?Math.round(known.reduce((s,c)=>s+quality(c.soil),0)/known.length*100)+'%':'—'}</strong><span>soil quality<small>${allKnown?'Observed across this bed':'Examine each cell to reveal its soil'}</small></span></div>
  <div class="lw-meters">${[['fertility','Fertility'],['structure','Structure'],['moisture','Moisture']].map(([k,label])=>`<div><span>${label}</span><meter min="0" max="1" value="${average(k)}"></meter><small>${known.length?Math.round(average(k)*100)+'%':'?'}</small></div>`).join('')}</div>
  <h3>Prepare & tend</h3><div class="lw-tasks">${Object.entries(ACTIONS).filter(([k])=>k!=='plant'&&k!=='harvest').map(([k,a])=>{const n=pending(w,k);return `<button data-task="${k}" ${!n.length?'disabled':''}><span>${a.label}<small>${k==='inspect'?'Reveal soil conditions':k==='till'?'Improve structure · unplanted cells':k==='compost'?'Improve fertility · 1 scoop / cell':'Restore moisture · 2 L / cell'}</small></span><b>${n.length?n.length+' cells':'✓'}</b></button>`;}).join('')}</div>
  <h3>First planting</h3><label class="lw-species">Seed species<select data-species>${Object.entries(SPECIES).map(([id,s])=>`<option value="${id}" ${w.species===id?'selected':''}>${s.name}</option>`).join('')}</select></label><p class="lw-sub">${SPECIES[w.species].days} days · up to ${SPECIES[w.species].potentialKg} kg per plant<br>Plantable at ${Math.round(SPECIES[w.species].minQuality*100)}% soil quality.</p>
  <button class="lw-primary" data-task="plant" ${!pending(w,'plant').length?'disabled':''}>Plant ${pending(w,'plant').length} ready cells</button>
  ${crop.length?`<div class="lw-crops"><strong>${crop.length} plants · ${ready.length} ready</strong><p>${crop.map(c=>c.plant.species).filter((s,i,a)=>a.indexOf(s)===i).map(s=>{const ps=crop.filter(c=>c.plant.species===s);return `${SPECIES[s].name}: day ${Math.floor(ps.reduce((sum,c)=>sum+c.plant.age,0)/ps.length)} / ${SPECIES[s].days}`;}).join('<br>')}</p><small>Projected harvest: ${crop.reduce((s,c)=>s+yieldKg(c.plant),0).toFixed(2)} kg at experienced soil quality.</small><button data-task="harvest" ${!ready.length?'disabled':''}>Harvest ${ready.length} ready cells</button></div>`:''}
  <button class="lw-text" data-command="remove">Remove boundary only</button>`}
  ${w.job?`<div class="lw-job"><strong>${ACTIONS[w.job.kind].label} · Bed ${w.job.bed}</strong><progress max="${w.job.total}" value="${w.job.done}"></progress><small>${w.job.done} / ${w.job.total} cells finished${paused?' · paused':''}</small></div>`:''}
  <div class="lw-supplies"><h3>Workshop supplies</h3><div><span>Water<strong>${w.inventory.water} L</strong></span><span>Compost<strong>${w.inventory.compost} scoops</strong></span><span>Seed<strong>${w.inventory.seeds}</strong></span><span>Larder<strong>${w.inventory.food.toFixed(2)} kg</strong></span></div><button data-command="restock">Replenish supplies</button></div>
  <button class="lw-days" data-command="days" ${w.job||w.actor.path.length?'disabled':''}>Advance 7 days →</button>`;
 }
 function draw(){ground.innerHTML=groundSVG(w,outline,mode,elapsed,focusCell);}
 function refresh(){panel();draw();save();}
 function setMode(next){mode=next;outline=[];q('.lw-draw').hidden=mode!=='draw';root.querySelectorAll('.lw-toolbar [data-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mode===mode)));w.notice=mode==='draw'?'Click three or more corners, then finish the bed.':mode==='soil'?'Soil colors show examined cells only. Click a bed to select it.':'Click the ground to walk; click a bed to select it.';refresh();}
 function selectCell(id,corner){focusCell=id;
  if(mode==='draw'){const c=w.cells[id];const p=corner||{x:c.x,y:c.y};if(!outline.some(v=>v.x===p.x&&v.y===p.y))outline.push(p);w.notice=`${outline.length} corners marked. Finish when your perimeter is complete.`;}
  else{const b=w.beds.find(b=>b.cells.includes(id));if(b)w.selected=b.id;walk(w,id);}refresh();
 }
 function onGround(e){const target=e.target.closest('[data-cell]');if(!target)return;const id=Number(target.dataset.cell),c=w.cells[id];
  const point=ground.createSVGPoint();point.x=e.clientX;point.y=e.clientY;const p=point.matrixTransform(ground.getScreenCTM().inverse());
  const corners=[{x:c.x,y:c.y},{x:c.x+1,y:c.y},{x:c.x+1,y:c.y+1},{x:c.x,y:c.y+1}];corners.sort((a,b)=>{const aa=project(a.x,a.y),bb=project(b.x,b.y);return Math.hypot(aa.x-p.x,aa.y-p.y)-Math.hypot(bb.x-p.x,bb.y-p.y);});selectCell(id,corners[0]);
 }
 function onKey(e){if(e.key==='Escape'){setMode('walk');return;}const delta={ArrowLeft:-1,ArrowRight:1,ArrowUp:-SIZE,ArrowDown:SIZE}[e.key];if(delta){e.preventDefault();focusCell=Math.max(0,Math.min(SIZE*SIZE-1,focusCell+delta));draw();}if(e.key==='Enter'){e.preventDefault();selectCell(focusCell);}}
 function onClick(e){const b=e.target.closest('button');if(!b)return;if(b.dataset.mode){setMode(b.dataset.mode);return;}if(b.dataset.task){startJob(w,b.dataset.task);refresh();return;}
  switch(b.dataset.command){case 'pause':paused=!paused;break;case 'stop':cancel(w);w.notice='Stopped. Completed cells keep their progress.';break;
   case 'undo':outline.pop();break;case 'cancel-draw':setMode('walk');return;case 'finish':if(addBed(w,outline)){mode='walk';outline=[];q('.lw-draw').hidden=true;root.querySelectorAll('.lw-toolbar [data-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mode===mode)));}else if(outline.length<3)w.notice='Mark at least three corners.';break;
   case 'remove':removeBed(w);break;case 'restock':Object.assign(w.inventory,{water:160,compost:80,seeds:80});w.notice='Workshop supplies replenished.';break;case 'days':advanceDays(w,7);break;
  }refresh();
 }
 function onChange(e){if(e.target.matches('[data-bed]'))w.selected=Number(e.target.value);if(e.target.matches('[data-species]'))w.species=e.target.value;if(e.target.matches('[data-speed]'))speed=Number(e.target.value);refresh();}
 function frame(now){const dt=last?Math.min(.1,(now-last)/1000):0;last=now;if(!paused&&!document.hidden){for(let i=0;i<speed;i++)tick(w,dt);elapsed+=dt;}draw();uiElapsed+=dt;if(uiElapsed>.5){panel();save();uiElapsed=0;}raf=requestAnimationFrame(frame);}
 root.addEventListener('click',onClick);root.addEventListener('change',onChange);ground.addEventListener('click',onGround);ground.addEventListener('keydown',onKey);refresh();raf=requestAnimationFrame(frame);
 return()=>{cancelAnimationFrame(raf);save();root.removeEventListener('click',onClick);root.removeEventListener('change',onChange);ground.removeEventListener('click',onGround);ground.removeEventListener('keydown',onKey);};
}
