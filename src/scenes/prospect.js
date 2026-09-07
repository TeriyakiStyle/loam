import { prospectSVG, runProspect, BANDS } from '../art/prospect.js';
export function render(el){
 el.innerHTML=`<section class="prospect">
 <header class="pj-heading"><h1>Prospect</h1></header>
 <figure class="pj-sheet"><div class="pj-scroll" tabindex="0" aria-label="Seasonal drawing. Scroll horizontally on small screens.">${prospectSVG()}</div>
 <figcaption><span class="pj-key"><i></i>Food available</span><span class="pj-key needs"><i></i>Daily needs</span></figcaption></figure>
 <div class="pj-controls"><button type="button" data-pause>Pause walk</button><label class="pj-scrub"><span class="sr-only">Explore the year</span><input data-year type="range" min="0" max="1000" value="60" aria-label="Explore the year"></label><span data-month class="pj-current-month"></span><button type="button" data-nutrition aria-pressed="false" aria-controls="pj-nutrition-detail">Show nutrition</button></div>
 <div class="pj-observation"><p data-status></p><span data-reading></span></div>
 <div id="pj-nutrition-detail" data-nutrition-detail hidden><ul class="pj-legend">${BANDS.slice(1).map(b=>`<li><i style="background:${b.tone}"></i>${b.label}</li>`).join('')}</ul><p data-nutrition-note></p><p class="pj-detail-note">Each dotted line compares one nutrient with its own requirement. A nutrient deficiency is distinct from a calorie shortage.</p></div>
 <footer class="pj-footer"><p>Lorem ipsum dolor sit amet, consectetur adipiscing elit,<br>sed do eiusmod tempor incididunt ut labore.</p><small>Ut enim ad minim veniam, quis nostrud exercitation<br>ullamco laboris nisi ut aliquip ex ea commodo.</small></footer></section>`;
 return runProspect(el);
}
