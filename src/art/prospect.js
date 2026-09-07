// Illustrative ratios against fixed needs. These are not dietary predictions.
export const BANDS = [
 {label:'Calories',tone:'#69784d',pts:[1.25,1.17,1.4,1.55,1.42,1.18,.84,.48,.76,1.18,1.25]},
 {label:'Protein',tone:'#996456',pts:[1.3,1.22,1.34,1.5,1.44,1.36,1.3,1.22,1.16,1.24,1.3]},
 {label:'Fat',tone:'#a78d56',pts:[1.42,1.36,1.4,1.58,1.55,1.5,1.46,1.4,1.34,1.38,1.42]},
 {label:'Vitamin A',tone:'#be813e',pts:[1.34,1.2,1.42,1.6,1.52,1.4,1.32,1.14,1.06,1.2,1.34]},
 {label:'Minerals',tone:'#638b96',pts:[1.26,1.28,1.32,1.44,1.38,1.3,1.24,1.16,1.1,1.18,1.26]},
 {label:'Vitamin C',tone:'#688351',pts:[1.58,1.62,1.52,1.48,1.38,1.34,1.05,.45,.62,1.2,1.58]},
];
const GRID=[0,.12,.25,.38,.5,.62,.7,.8,.9,.96,1];
export function supply(band,u){
 u=Math.max(0,Math.min(1,u));let i=0;while(i<GRID.length-2&&u>GRID[i+1])i++;
 const t=(u-GRID[i])/(GRID[i+1]-GRID[i]);
 // Smoothstep is bounded by the supplied values: no invented spline overshoot.
 return band.pts[i]+(band.pts[i+1]-band.pts[i])*t*t*(3-2*t);
}
const X=u=>60+1080*u,Y=v=>320-(v-1)*170;
const line=fn=>Array.from({length:401},(_,i)=>`${i?'L':'M'}${X(i/400).toFixed(2)} ${Y(fn(i/400)).toFixed(2)}`).join(' ');
const leaf=(x,y,r,s=1)=>`<g transform="translate(${x} ${y}) rotate(${r}) scale(${s})"><path d="M0 0C-23 -12 -20 -43 0 -57C23 -40 22 -13 0 0Z" fill="#87925d" fill-opacity=".28"/><path d="M0 0Q-24 -25 0 -57Q24 -29 0 0M0 0L0 -53M0 -15L-10 -27M0 -28L11 -39"/></g>`;
function specimens(){return `<g class="pj-specimen">
 <g transform="translate(110 79)"><circle r="17" fill="#ddba68" fill-opacity=".35"/><circle r="15"/>${Array.from({length:12},(_,i)=>`<path d="M0 -23L1 -30" transform="rotate(${i*30})"/>`).join('')}</g>
 <g transform="translate(410 105)"><path d="M-24 12Q-5 -15 9 -67M-11 -5L-28 -28M0 -28L20 -48"/>${leaf(0,-27,-40,.55)}${leaf(8,-54,25,.55)}${leaf(-13,-5,-55,.6)}${leaf(-6,-15,62,.55)}</g>
 <g transform="translate(715 83)">${Array.from({length:6},(_,i)=>`<path d="M0 0L0 -29M0 -19L-7 -25M0 -19L7 -25" transform="rotate(${60*i})"/>`).join('')}<circle r="4" fill="#9eaeb2"/></g>
 <g transform="translate(1045 109)"><path d="M0 8Q-5 -20 2 -44M-1 -9Q-16 -10 -22 -27M0 -23Q12 -31 22 -33"/>${leaf(-19,-24,-55,.48)}${leaf(16,-29,52,.52)}${leaf(2,-42,12,.45)}</g>
 </g><g class="pj-season"><text x="110" y="146">High summer</text><text x="410" y="146">The harvest</text><text x="715" y="146">Deep winter</text><text x="1045" y="146">First greens</text></g>`;}
const WALKER=`<g data-walker class="pj-walker">
 <ellipse cx="0" cy="2" rx="19" ry="2.5" fill="#4e493c" opacity=".13"/>
 <path data-back-leg class="pj-trouser back"/><path data-back-arm class="pj-limb back"/>
 <path d="M-9 -75Q-17 -65 -14 -44L-10 -31Q1 -27 13 -33L10 -57L4 -72Z" fill="#829077" stroke="#4e5140" stroke-width="1.7"/>
 <path d="M-12 -65Q-25 -67 -25 -48L-16 -43" fill="#ae9170" stroke="#655744" stroke-width="1.5"/>
 <path d="M-5 -75L-4 -84L6 -83L6 -72" fill="#d4b28c" stroke="#655744" stroke-width="1.4"/>
 <path d="M-9 -91Q-9 -104 3 -104Q14 -102 12 -94L16 -90L11 -87Q10 -80 2 -80L-5 -84Z" fill="#d6b996" stroke="#655744" stroke-width="1.5"/>
 <path d="M-16 -100Q0 -105 19 -99M-10 -102L-6 -113Q4 -117 12 -108L13 -101" fill="#a39c78" stroke="#575443" stroke-width="1.8"/>
 <path d="M7 -93L9 -93M-5 -62L-4 -39M1 -37L9 -37" fill="none" stroke="#595442" stroke-width="1.2"/>
 <path data-front-leg class="pj-trouser"/><path data-front-arm class="pj-limb"/>
 </g>`;
export function prospectSVG(){
 const calories=line(u=>supply(BANDS[0],u)),area=`${calories}L1140 320L60 320Z`;
 return `<svg class="pj-svg" viewBox="0 0 1200 520" role="img" aria-labelledby="pj-title pj-desc">
 <title id="pj-title">A walk through a year of food</title><desc id="pj-desc">A straight line represents daily calorie needs. Stores rise at harvest, fall below needs in late winter and recover with spring. This is an illustrative season.</desc>
 <defs><clipPath id="pj-above"><rect width="1200" height="320"/></clipPath><clipPath id="pj-below"><rect y="320" width="1200" height="200"/></clipPath><pattern id="pj-grain" width="19" height="17" patternUnits="userSpaceOnUse"><path d="M2 4l2 -1M12 12l1 1" stroke="#685c42" stroke-opacity=".075" stroke-width=".8"/></pattern></defs>
 <rect width="1200" height="520" fill="url(#pj-grain)"/>${specimens()}
 <path d="${area}" fill="#b6b979" opacity=".25" clip-path="url(#pj-above)"/><path d="${area}" fill="#be8067" opacity=".2" clip-path="url(#pj-below)"/>
 <path d="${area}" fill="none" stroke="#a6a574" stroke-width="11" opacity=".06" clip-path="url(#pj-above)"/>
 <g class="pj-nutrition">${BANDS.slice(1).map(b=>`<path d="${line(u=>supply(b,u))}" fill="none" stroke="${b.tone}" stroke-width="1.5" stroke-dasharray="5 5"/>`).join('')}</g>
 <path d="${calories}" class="pj-calories"/><path d="${calories}" fill="none" stroke="#66704e" stroke-width=".7" opacity=".25" transform="translate(0 2.3)"/>
 <path d="M38 320H1160" class="pj-baseline"/><text x="62" y="345" class="pj-small">daily needs</text>
 <g class="pj-annotation"><text x="335" y="202">a little put by</text><path d="M402 210q18 8 25 28"/><text x="854" y="448">the hungry gap</text><path d="M902 424q-5 -16 -19 -23"/></g>
 <text x="1140" y="304" class="pj-margin">FEAST</text><text x="1140" y="344" class="pj-margin">FAMINE</text>
 <path data-gap class="pj-gap-marker" d="M60 320V320"/>${WALKER}
 <g class="pj-months">${['JUL','AUG','SEP','OCT','NOV','DEC','JAN','FEB','MAR','APR','MAY','JUN','JUL'].map((m,i)=>`<path d="M${X(i/12)} 476v5"/><text x="${X(i/12)}" y="499">${m}</text>`).join('')}</g></svg>`;
}
export function runProspect(root){
 const q=s=>root.querySelector(s),walker=q('[data-walker]'),slider=q('[data-year]'),pause=q('[data-pause]'),toggle=q('[data-nutrition]');
 // The person is the present. Three clipped copies let the year flow past
 // continuously, including the June/July boundary, without moving the person.
 const svg=q('.pj-svg'), ns='http://www.w3.org/2000/svg';
 const make=name=>document.createElementNS(ns,name);
 const clip=make('clipPath'),rect=make('rect');clip.id='pj-year-window';
 rect.setAttribute('x','60');rect.setAttribute('width','1080');rect.setAttribute('height','520');clip.append(rect);svg.querySelector('defs').append(clip);
 const year=make('g');year.setAttribute('clip-path','url(#pj-year-window)');
 [...svg.children].filter(node=>node.matches('.pj-specimen,.pj-season,.pj-nutrition,.pj-annotation,.pj-months') || (node.tagName==='path'&&!node.matches('.pj-baseline,.pj-gap-marker'))).forEach(node=>year.append(node));
 const world=make('g');world.setAttribute('data-world','');
 for(const offset of [-1080,0,1080]){const tile=make('g');tile.setAttribute('transform',`translate(${offset} 0)`);tile.append(year.cloneNode(true));world.append(tile);}
 svg.insertBefore(world,q('.pj-baseline'));
 const PRESENT=300;
 const media=matchMedia('(prefers-reduced-motion: reduce)');
 let u=.06,playing=!media.matches,raf=null,previous=null,stride=0;
 function draw(){
  walker.setAttribute('transform',`translate(${PRESENT} 320)`);
  world.setAttribute('transform',`translate(${PRESENT-X(u)} 0)`);
  const swing=playing?Math.sin(stride)*15:7;
  q('[data-front-leg]').setAttribute('d',`M3 -32Q${-3+swing*.55} -16 ${swing} -4l8 2`);
  q('[data-back-leg]').setAttribute('d',`M-6 -32Q${-swing*.6} -19 ${-swing} -4l7 2`);
  q('[data-front-arm]').setAttribute('d',`M3 -66Q${8-swing*.5} -51 ${9-swing*.8} -43`);
  q('[data-back-arm]').setAttribute('d',`M-9 -66Q${-7+swing*.6} -51 ${swing*.8} -46`);
  const value=supply(BANDS[0],u),short=value<1;
  q('[data-gap]').setAttribute('d',`M${PRESENT} 320V${short?Y(value):320}`);
  q('[data-status]').textContent=short?'Famine':'Feast';q('[data-status]').dataset.short=String(short);
  q('[data-reading]').textContent=`${Math.round(value*100)}% of daily calorie needs`;
  q('[data-month]').textContent=['July','August','September','October','November','December','January','February','March','April','May','June','July'][Math.min(12,Math.floor(u*12))];
  const low=BANDS.slice(1).filter(b=>supply(b,u)<1).map(b=>b.label);
  q('[data-nutrition-note]').textContent=low.length?`${low.join(', ')} also falls below its requirement here.`:'The other illustrated nutrients meet their requirements here.';
  slider.value=Math.round(u*1000);slider.setAttribute('aria-valuetext',q('[data-month]').textContent);
  follow();
 }
 function follow(){const viewport=q('.pj-scroll');if(viewport.scrollWidth>viewport.clientWidth)viewport.scrollLeft=PRESENT/1200*viewport.scrollWidth-viewport.clientWidth/2;}
 function sync(){pause.textContent=playing?'Pause walk':'Resume walk';pause.setAttribute('aria-pressed',String(!playing));}
 function frame(now){if(previous!==null){const dt=Math.min(now-previous,100);u=(u+dt/64000)%1;stride+=dt/1150*Math.PI*2;}previous=now;draw();raf=requestAnimationFrame(frame);}
 function stop(){cancelAnimationFrame(raf);raf=null;previous=null;}
 function onPause(){playing=!playing;sync();stop();draw();if(playing)raf=requestAnimationFrame(frame);}
 function onInput(){playing=false;stop();u=Number(slider.value)/1000;sync();draw();}
 function onToggle(){const on=toggle.getAttribute('aria-pressed')!=='true';toggle.setAttribute('aria-pressed',String(on));q('.prospect').classList.toggle('show-nutrition',on);q('[data-nutrition-detail]').hidden=!on;}
 function onMotion(){if(media.matches&&playing)onPause();}
 pause.addEventListener('click',onPause);slider.addEventListener('input',onInput);toggle.addEventListener('click',onToggle);media.addEventListener('change',onMotion);window.addEventListener('resize',follow);
 sync();draw();if(playing)raf=requestAnimationFrame(frame);
 return()=>{stop();pause.removeEventListener('click',onPause);slider.removeEventListener('input',onInput);toggle.removeEventListener('click',onToggle);media.removeEventListener('change',onMotion);window.removeEventListener('resize',follow);};
}
