import test from 'node:test';
import assert from 'node:assert/strict';
import {createWorld,addBed,startJob,tick,cancel,removeBed,restore,advanceDays} from '../src/workshop/world.js';
import {seed,grow,yieldKg,SPECIES} from '../src/workshop/plants.js';
const polygon=[{x:2,y:2},{x:4,y:2},{x:4,y:4},{x:2,y:4}];
function finish(w){for(let i=0;i<20000&&(w.job||w.actor.path.length);i++)tick(w,.1);assert.equal(w.job,null);}
test('90% quality across a lifetime gives 90% of species yield',()=>{
 const p=seed('tomato');grow(p,200,.9);assert.equal(p.age,90);assert.equal(p.ready,true);assert.ok(Math.abs(yieldKg(p)-SPECIES.tomato.potentialKg*.9)<1e-9);
 grow(p,100,0);assert.ok(Math.abs(yieldKg(p)-3.6)<1e-9);
});
test('yield integrates changing soil instead of using only final conditions',()=>{
 const p=seed('tomato');grow(p,45,.5);grow(p,45,1);assert.equal(yieldKg(p),3);
});
test('interruption, save and resume never redo completed work or charges',()=>{
 let w=createWorld();addBed(w,polygon);startJob(w,'inspect');finish(w);startJob(w,'water');
 while(w.job.done<1)tick(w,.1);cancel(w);assert.equal(w.inventory.water,158);
 w=restore(JSON.stringify(w));startJob(w,'water');assert.equal(w.job.total,3);finish(w);assert.equal(w.inventory.water,152);
});
test('bed boundaries reject overlap and preserve ground and plants on removal',()=>{
 const w=createWorld();assert.ok(addBed(w,polygon));assert.equal(addBed(w,polygon),false);
 const c=w.cells[w.beds[0].cells[0]];c.soil.moisture=1;c.plant=seed('bean');removeBed(w);
 assert.equal(w.beds.length,0);assert.equal(c.soil.moisture,1);assert.equal(c.plant.species,'bean');
});
test('resource exhaustion stops without charging or changing an unfinished cell',()=>{
 const w=createWorld();addBed(w,polygon);startJob(w,'inspect');finish(w);w.inventory.water=2;startJob(w,'water');finish(w);
 assert.equal(w.inventory.water,0);assert.equal(w.beds[0].cells.filter(id=>w.cells[id].soil.moisture===1).length,1);
});
test('full loop plants, matures and harvests once into inventory',()=>{
 const w=createWorld();addBed(w,polygon);for(const kind of ['inspect','till','compost','water','plant']){startJob(w,kind);finish(w);}
 assert.equal(w.cells.filter(c=>c.plant).length,4);advanceDays(w,91);startJob(w,'harvest');finish(w);
 const food=w.inventory.food;assert.ok(food>0);assert.equal(w.cells.filter(c=>c.plant).length,0);startJob(w,'harvest');assert.equal(w.inventory.food,food);
});
test('unsupported or malformed saves fail cleanly',()=>{assert.equal(restore('{'),null);assert.equal(restore('{"version":42}'),null);});
test('crossing perimeters are rejected',()=>{const w=createWorld();assert.equal(addBed(w,[{x:2,y:2},{x:5,y:5},{x:2,y:5},{x:5,y:2}]),false);assert.equal(w.beds.length,0);});
