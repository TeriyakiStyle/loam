import { SIZE, height } from './world.js';
import { quality } from './soil.js';
import { SPECIES } from './plants.js';
export const project=(x,y,z=height(x,y))=>({x:500+(x-y)*32,y:110+(x+y)*17-z*48});
const points=ps=>ps.map(p=>`${p.x},${p.y}`).join(' ');
const poly=(ps,fill,extra='')=>`<polygon points="${points(ps)}" fill="${fill}" ${extra}/>`;
function plantArt(c,p) {
 const plant=c.plant,s=SPECIES[plant.species],growth=Math.min(1,plant.age/s.days),h=9+growth*35;
 return `<g pointer-events="none" transform="translate(${p.x} ${p.y})"><path d="M0 0Q-3 -${h*.5} 0 -${h}" stroke="#526144" stroke-width="2.4" fill="none"/>${[.3,.55,.8].map((f,i)=>`<path d="M0 -${h*f}q${i%2?13:-13} -15 ${i%2?17:-17} -6q-5 12 ${i%2?-17:17} 6" fill="${i%2?'#75894d':'#91a65e'}"/>`).join('')}${growth>.65?[-8,7].map((x,i)=>`<circle cx="${x}" cy="${-h*.55+i*7}" r="${plant.ready?4.5:3}" fill="${plant.ready?s.color:'#a9a467'}"/>`).join(''):''}</g>`;
}
function actorArt(w,time) {
 const a=w.actor,p=project(a.x,a.y),moving=a.path.length>0,working=!!w.job&&!moving;
 const stride=moving?Math.sin(time*12)*4:0,bob=moving?Math.abs(Math.sin(time*12))*1.8:0;
 const right=!a.path.length||a.path[0].x-a.x>=a.path[0].y-a.y;
 return `<g pointer-events="none" transform="translate(${p.x} ${p.y})"><ellipse rx="13" ry="5" fill="#303d29" opacity=".22"/><g transform="translate(0 ${-bob}) scale(${right?1:-1} 1)">
 <path d="M-6 -16L${-6+stride} -3M4 -16L${4-stride} -3" stroke="#4d5148" stroke-width="7"/><path d="M${-8+stride} -2h8M${2-stride} -2h8" stroke="#554439" stroke-width="4"/>
 <path d="M-10 -36L8 -37L10 -16L-9 -15Z" fill="#748477" stroke="#4f6159"/><path d="M-8 -33L6 -33L5 -18L-8 -18Z" fill="#a1ad92"/><path d="M-10 -32L-14 -22" stroke="#b99a73" stroke-width="5"/>
 <path d="M7 -32L${working?19:12} ${working?-25:-20}" stroke="#b99a73" stroke-width="5"/><path d="M-6 -48L7 -48L9 -37L-5 -36Z" fill="#d7b58a"/>
 <path d="M-17 -47L0 -54L17 -48L1 -42Z" fill="#d7bd79" stroke="#a58b54"/><path d="M-9 -49L-7 -58L5 -60L10 -51L0 -47Z" fill="#c8aa68"/><path d="M-9 -50L0 -47L10 -51" fill="none" stroke="#8c784d" stroke-width="3"/>
 ${working?(w.job.kind==='water'?`<path d="M15 -27h12v11H15Z" fill="#6f99a1"/><path d="M27 -23l10 8" stroke="#6f99a1" stroke-width="4"/><path d="M35 -12l4 8m-1 -12l5 8" stroke="#a2c3c3" stroke-width="2"/>`:`<path d="M17 -30L25 -1" stroke="#856d4b" stroke-width="3"/><path d="M19 -2h13" stroke="#747b73" stroke-width="4"/>`):''}
 </g></g>`;
}
export function groundSVG(w,outline,mode,time,focusCell) {
 const parts=[];const ordered=[...w.cells].sort((a,b)=>(a.x+a.y)-(b.x+b.y)||a.x-b.x);
 for(const c of ordered){const {x,y}=c,ps=[project(x,y),project(x+1,y),project(x+1,y+1),project(x,y+1)];
  const bed=w.beds.find(b=>b.cells.includes(c.id)),isSelected=bed?.id===w.selected;
  if(x===SIZE-1){parts.push(poly([ps[1],{x:ps[1].x,y:ps[1].y+65},{x:ps[2].x,y:ps[2].y+65},ps[2]],'#806343'));}
  if(y===SIZE-1){parts.push(poly([ps[2],{x:ps[2].x,y:ps[2].y+65},{x:ps[3].x,y:ps[3].y+65},ps[3]],'#a17c50'));}
  const color=bed?(c.soil.moisture>.8?'#69543d':c.soil.tilled?'#907048':'#9d8456'):`hsl(${75+(x%3)*2} 22% ${46+Math.sin(x*1.7+y)*3}%)`;
  parts.push(`<g data-cell="${c.id}">${poly(ps,color,'stroke="#5f714c" stroke-opacity=".22" stroke-width=".7"')}`);
  const p=project(x+.5,y+.5);
  if(c.soil.tilled){parts.push(`<path d="M${p.x-17} ${p.y-3}l24 12m-15 -17l24 12" stroke="#4f4030" opacity=".35" fill="none"/>`);}
  else if(!bed && c.id%3===0)parts.push(`<path d="M${p.x-4} ${p.y}l-2 -5m2 5l3 -7m-3 7l5 -2" stroke="#d0ce8d" stroke-width="1" opacity=".55"/>`);
  if(mode==='soil'&&c.examined)parts.push(poly(ps,`hsl(${quality(c.soil)*110} 50% 58%)`,'opacity=".45"'));
  if(isSelected)parts.push(poly(ps,'#f5dc94','opacity=".09"'));
  if(c.id===focusCell)parts.push(poly(ps,'none','stroke="#f3e0ad" stroke-width="2"'));
  parts.push('</g>');
 }
 // Perimeters follow shared terrain corners and remain independent of soil.
 for(const b of w.beds){for(const id of b.cells){const c=w.cells[id];
  const sides=[[-1,0,[c.x,c.y],[c.x,c.y+1]],[1,0,[c.x+1,c.y],[c.x+1,c.y+1]],[0,-1,[c.x,c.y],[c.x+1,c.y]],[0,1,[c.x,c.y+1],[c.x+1,c.y+1]]];
  for(const [dx,dy,a,z] of sides){if(w.cells.some(n=>n.x===c.x+dx&&n.y===c.y+dy&&b.cells.includes(n.id)))continue;
   const p=project(...a),q=project(...z);parts.push(`<path d="M${p.x} ${p.y}L${q.x} ${q.y}" fill="none" stroke="${b.id===w.selected?'#f0d49a':'#c6ba8a'}" stroke-width="2" pointer-events="none"/>`);
  }
 }}
 const entities=w.cells.filter(c=>c.plant).map(c=>({depth:c.x+c.y+1,art:plantArt(c,project(c.x+.5,c.y+.5))}));
 entities.push({depth:w.actor.x+w.actor.y,art:actorArt(w,time)});entities.sort((a,b)=>a.depth-b.depth);parts.push(...entities.map(e=>e.art));
 if(outline.length)parts.push(`<polyline points="${points(outline.map(p=>project(p.x,p.y)))}" fill="none" stroke="#ffe5ac" stroke-width="3" stroke-dasharray="5 4" pointer-events="none"/>${outline.map(p=>{const q=project(p.x,p.y);return `<circle cx="${q.x}" cy="${q.y}" r="4" fill="#ffe5ac" pointer-events="none"/>`;}).join('')}`);
 return `<ellipse cx="500" cy="420" rx="325" ry="95" fill="#283c30" opacity=".12"/>${parts.join('')}`;
}
