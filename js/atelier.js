// User text is always assigned as textContent. Designs live only in this page.
const NS='http://www.w3.org/2000/svg';
const FONTS={classique:['Fraunces, Georgia, serif',440,'Classique'],contemporain:['Inter Tight, Arial, sans-serif',500,'Contemporain'],audacieux:['Inter Tight, Arial, sans-serif',600,'Audacieux'],naturel:['Fraunces Soft, Georgia, serif',450,'Naturel']};
const COLORS={encre:['#111A22','Encre'],leman:['#1F4E5A','Léman'],terre:['#9B4327','Terre cuite'],foret:['#365743','Forêt'],prune:['#67415C','Prune'],cobalt:['#304F9B','Cobalt']};
const SYMBOLS={none:'Aucun',monogram:'Initiales',leaf:'Feuille',sun:'Soleil',spark:'Éclat',arch:'Arche',peak:'Sommet'};
const PATHS={leaf:'M12 50C4 19 28 5 54 7C56 32 42 53 12 50ZM12 50L44 18M26 36V23M26 36H39',sun:'M32 16A16 16 0 1 0 32 48A16 16 0 1 0 32 16M32 2V9M32 55V62M2 32H9M55 32H62M10 10L15 15M49 49L54 54M10 54L15 49M49 15L54 10',spark:'M32 3Q36 27 61 32Q36 37 32 61Q28 37 3 32Q28 27 32 3Z',arch:'M10 58V28A22 22 0 0 1 54 28V58M21 58V28A11 11 0 0 1 43 28V58M5 58H59',peak:'M3 53L25 12L39 37L47 24L62 53ZM17 27L25 31L32 25'};
const node=(tag,attrs,text)=>{const el=document.createElementNS(NS,tag);Object.entries(attrs).forEach(([k,v])=>el.setAttribute(k,v));if(text)el.textContent=text;return el;};
export function initNameplay(){
 const root=document.querySelector('[data-nameplay]');if(!root)return;
 const input=root.querySelector('[data-np-input]');
 const state={font:'classique',color:'encre',symbol:'none',layout:'inline',view:'logo',spacing:0};
 const clean=v=>v.replace(/[\u0000-\u001f\u007f]/g,'').replace(/\s+/g,' ').slice(0,40).trim();
 const name=()=>clean(input.value)||'Votre entreprise';let frame=0;
 function render(){
  const shown=name(),[font,weight,fontLabel]=FONTS[state.font],[color,colorLabel]=COLORS[state.color];root.style.setProperty('--brand',color);
  const initials=shown.split(/\s+/).slice(0,2).map(s=>Array.from(s)[0]).join('').toLocaleUpperCase('fr');
  root.querySelector('[data-color-name]').textContent=colorLabel;root.querySelector('[data-logo-status]').textContent=`${fontLabel} · ${colorLabel} · ${SYMBOLS[state.symbol]}`;
  root.querySelector('[data-card-name]').textContent=shown;root.querySelector('[data-phone-name]').textContent=shown;
  root.querySelectorAll('[data-scene]').forEach(el=>el.hidden=el.dataset.scene!==state.view);
  root.querySelectorAll('.atelier__logo').forEach(svg=>{
   svg.setAttribute('aria-label',`Logo ${shown}, ${fontLabel}, ${colorLabel}, ${SYMBOLS[state.symbol]}`);
   const text=svg.querySelector('[data-logo-text]'),group=svg.querySelector('[data-logo-symbol]'),has=state.symbol!=='none',stack=has&&state.layout==='stack';
   text.textContent=state.font==='audacieux'?shown.toLocaleUpperCase('fr'):shown;text.style.fontFamily=font;text.style.fontWeight=weight;
   text.style.fontVariationSettings=`"wght" ${weight}, "opsz" 72, "SOFT" ${state.font==='naturel'?100:0}`;
   text.style.letterSpacing=state.spacing+'px';text.style.fontSize=(stack?48:60)+'px';text.setAttribute('x',has&&!stack?'337':'300');text.setAttribute('y',stack?'155':'112');text.setAttribute('fill',color);group.replaceChildren();
   if(has){group.setAttribute('transform',stack?'translate(271 20) scale(.9)':'translate(33 58) scale(1.05)');
    if(state.symbol==='monogram'){group.append(node('circle',{cx:32,cy:32,r:29,fill:'none',stroke:color,'stroke-width':1.7}));const mono=node('text',{x:32,y:42,'text-anchor':'middle',fill:color,'font-size':25},initials);mono.style.fontFamily=font;group.append(mono);}
    else group.append(node('path',{d:PATHS[state.symbol],fill:'none',stroke:color,'stroke-width':2,'stroke-linecap':'round','stroke-linejoin':'round'}));}
   const available=has&&!stack?450:548,measured=text.getComputedTextLength();if(measured>available)text.style.fontSize=((stack?48:60)*available/measured)+'px';
  });
 }
 const schedule=()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(render);};input.addEventListener('input',schedule);
 root.addEventListener('change',e=>{if(e.target.type==='radio'&&e.target.name.startsWith('logo-')){state[e.target.name.slice(5)]=e.target.value;if(e.target.name==='logo-view')resetFlip();render();}});
 root.querySelector('#logo-spacing').addEventListener('input',e=>{state.spacing=Number(e.target.value);render();});
 const flip=root.querySelector('[data-flip]');
 function resetFlip(){flip.classList.remove('is-flipped');flip.setAttribute('aria-pressed','false');flip.querySelector('.atelier__card-front').setAttribute('aria-hidden','false');flip.querySelector('.atelier__card-back').setAttribute('aria-hidden','true');}
 flip.addEventListener('click',()=>{const on=flip.classList.toggle('is-flipped');flip.setAttribute('aria-pressed',String(on));flip.querySelector('.atelier__card-front').setAttribute('aria-hidden',String(on));flip.querySelector('.atelier__card-back').setAttribute('aria-hidden',String(!on));});
 function sync(){for(const[k,v]of Object.entries(state)){const el=root.querySelector(`input[name="logo-${k}"][value="${v}"]`);if(el)el.checked=true;}root.querySelector('#logo-spacing').value=state.spacing;resetFlip();render();}
 const presets=[['naturel','foret','leaf','inline'],['contemporain','leman','arch','stack'],['audacieux','terre','spark','inline'],['classique','prune','monogram','stack'],['contemporain','cobalt','peak','inline'],['naturel','terre','sun','stack']];let preset=0;
 root.querySelector('[data-inspire]').addEventListener('click',()=>{[state.font,state.color,state.symbol,state.layout]=presets[preset++%presets.length];state.spacing=0;sync();});
 root.querySelector('[data-logo-reset]').addEventListener('click',()=>{Object.assign(state,{font:'classique',color:'encre',symbol:'none',layout:'inline',view:'logo',spacing:0});sync();});
 let previous='';document.querySelector('[data-logo-contact]').addEventListener('click',()=>{
  const company=document.querySelector('#f-company'),more=document.querySelector('#f-more');if(!company.value.trim()&&clean(input.value)){company.value=clean(input.value);company.dispatchEvent(new Event('input'));}
  const summary=`Piste d’identité : ${name()} · ${FONTS[state.font][2]} · ${COLORS[state.color][1]} · ${SYMBOLS[state.symbol]} · ${state.layout==='stack'?'empilée':'en ligne'} · espacement ${state.spacing}.`;
  if(more){const existing=previous?more.value.replace(previous,'').trim():more.value.trim(),combined=[existing,summary].filter(Boolean).join('\n\n');if(combined.length<=more.maxLength){more.value=combined;previous=summary;}}
 });
 render();document.fonts?.ready.then(schedule);document.fonts?.addEventListener('loadingdone',schedule);
}
