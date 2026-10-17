(function(){
  var d=document, $=function(s,c){return (c||d).querySelector(s)}, $$=function(s,c){return Array.prototype.slice.call((c||d).querySelectorAll(s))};
  var hdr=$('#hdr'), menu=$('#menu'), openBtn=$('#menuOpen'), bar=$('#bar');
  var y=$('#year'); if(y) y.textContent=new Date().getFullYear();
  var WA='41223461260';

  /* Header on scroll */
  var ticking=false;
  function onScroll(){ if(ticking) return; ticking=true; requestAnimationFrame(function(){ hdr.classList.toggle('scrolled', window.scrollY>20); bar.classList.toggle('show', current!=='home' || window.scrollY>window.innerHeight*.7); ticking=false; }); }
  window.addEventListener('scroll', onScroll, {passive:true});

  /* Menu */
  function setMenu(open){
    menu.classList.toggle('open', open);
    openBtn.setAttribute('aria-expanded', open);
    d.documentElement.style.overflow = open ? 'hidden' : '';
    if(open) $('#menuClose').focus();
  }
  openBtn.addEventListener('click', function(){ setMenu(true); });
  $('#menuClose').addEventListener('click', function(){ setMenu(false); openBtn.focus(); });
  d.addEventListener('keydown', function(e){ if(e.key==='Escape' && menu.classList.contains('open')) setMenu(false); });

  /* Pages : chaque rubrique est une vraie page */
  var current=d.body.getAttribute('data-page')||'home';
  var U=function(k){ return d.body.getAttribute('data-url-'+k)||'./'; };
  function smooth(){ return !window.matchMedia('(prefers-reduced-motion: reduce)').matches; }
  /* anciens liens de la démo (…#lissage) : redirection vers la vraie page */
  if(current==='home'){ var oh=location.hash.replace('#',''); if({prestations:1,lissage:1,avis:1,contact:1}[oh]){ location.replace(U(oh)); return; } }
  $$('[data-pre]').forEach(function(a){ a.addEventListener('click', function(){ try{ sessionStorage.setItem('capilus-pre', JSON.stringify({form:a.getAttribute('data-pre')})); }catch(e){} }); });
  $$('[data-scroll]').forEach(function(a){ a.addEventListener('click', function(e){ var el=d.getElementById(a.getAttribute('data-scroll')); if(el){ e.preventDefault(); el.scrollIntoView({behavior:smooth()?'smooth':'auto'}); } }); });
  /* Reveal on scroll */
  var io = 'IntersectionObserver' in window ? new IntersectionObserver(function(es){ es.forEach(function(en){ if(en.isIntersecting){ en.target.classList.add('in'); io.unobserve(en.target); } }); }, {rootMargin:'0px 0px -6% 0px', threshold:0}) : null;
  function revealIn(scope){ $$('.rv',scope).forEach(function(el){ if(io) io.observe(el); else el.classList.add('in'); }); }
  revealIn(d);


  /* ===== Tarifs & horaires : modifiables par le salon dans Google Sheets =====
     Coller ici les liens « Publier sur le web » (format CSV) des deux onglets.
     Si un lien est vide ou si Google ne répond pas, le site garde les valeurs ci-dessous. */
  var SHEET={
    tarifs:'',
    horaires:''
  };
  var P={brushing_court:'55',brushing_mi:'60',brushing_long:'65',coupe_court:'60',supplement_coupe:'25',
    couleur_court:'110',couleur_mi:'120',couleur_long:'130',meches_court:'120',meches_mi:'130',meches_long:'150',
    botox_court:'110',botox_mi:'125',botox_long:'140',lissage_min:'200',lissage_max:'450',
    homme_ciseaux:'45',homme_tondeuse:'30',enfant_garcon:'35',enfant_fille:'35',ado_garcon:'35',ado_fille:'50'};
  var HT={1:'Closed',2:'9:00 – 18:00',3:'9:00 – 14:00',4:'9:00 – 18:00',5:'9:00 – 18:00',6:'By appointment',0:'Closed'};
  var DAYS={lundi:1,mardi:2,mercredi:3,jeudi:4,vendredi:5,samedi:6,dimanche:0,monday:1,tuesday:2,wednesday:3,thursday:4,friday:5,saturday:6,sunday:0};
  var DN=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  function chf(k){ return 'CHF '+P[k]; }
  function num(k){ var n=parseInt(String(P[k]).replace(/[^0-9]/g,''),10); return isNaN(n)?0:n; }
  function okPrice(v){ return /^[0-9][0-9 '.,]{0,7}$/.test(v); }
  function parseH(v){
    var x=String(v||'').trim(), l=x.toLowerCase();
    if(!x) return null;
    if(/^(ferm|clos)/.test(l)) return {t:'Closed',h:null};
    if(/rendez|rdv|appoint/.test(l)) return {t:'By appointment',h:'rdv'};
    var m=l.match(/^(\d{1,2})\s*[h:.]\s*(\d{2})?\s*(?:[–—-]|à)\s*(\d{1,2})\s*[h:.]?\s*(\d{2})?$/);
    if(!m) return null;
    var a=+m[1]*60+(+m[2]||0), b=+m[3]*60+(+m[4]||0);
    if(a>=b || b>24*60) return null;
    function f(n){ var mm=n%60; return Math.floor(n/60)+':'+(mm<10?'0':'')+mm; }
    return {t:f(a)+' – '+f(b),h:[a,b]};
  }
  function csv(text){
    var rows=[],row=[],cell='',q=false;
    for(var i=0;i<text.length;i++){ var c=text[i];
      if(q){ if(c==='"'){ if(text[i+1]==='"'){ cell+='"'; i++; } else q=false; } else cell+=c; }
      else if(c==='"') q=true; else if(c===','){ row.push(cell); cell=''; }
      else if(c==='\n'){ row.push(cell); rows.push(row); row=[]; cell=''; } else if(c!=='\r') cell+=c; }
    row.push(cell); rows.push(row); return rows;
  }
  function mergeTarifs(rows){ rows.forEach(function(r){ var k=(r[0]||'').trim(), v=(r[2]||'').trim(); if(P.hasOwnProperty(k) && okPrice(v)) P[k]=v.replace(/\s+/g,''); }); }
  function mergeHoraires(rows){ rows.forEach(function(r){ var d=DAYS[(r[0]||'').trim().toLowerCase()], p=parseH(r[1]); if(d!==undefined && p) HT[d]=p.t; }); }
  function applyAll(){
    $$('[data-p]').forEach(function(el){ var k=el.getAttribute('data-p'); if(P[k]) el.textContent=P[k]; });
    $$('#hours li').forEach(function(li){ var d=+li.getAttribute('data-d'), p=parseH(HT[d]); if(!p) return;
      $('[data-h]',li).textContent=p.t; li.classList.toggle('closed',p.h===null); li.classList.toggle('rdv',p.h==='rdv'); H[d]=p.h; });
    var sum=$('#hours-sum');
    if(sum){ var g=[], idx={}; [2,3,4,5,6,0,1].forEach(function(d){ var p=parseH(HT[d]); if(!p) return; var s=p.t.replace(/h00/g,'h');
        if(idx[s]===undefined){ idx[s]=g.length; g.push({s:s,d:[]}); } g[idx[s]].d.push(DN[d]); });
      sum.innerHTML=''; g.forEach(function(x){ var li=d.createElement('li'), a=d.createElement('span'), b=d.createElement('span');
        var n=x.d.join(', '); a.textContent=n.charAt(0).toUpperCase()+n.slice(1); b.textContent=x.s; li.appendChild(a); li.appendChild(b); sum.appendChild(li); }); }
    if(typeof refreshPrices==='function') refreshPrices();
    if(typeof status==='function') status();
  }
  try{ var cache=JSON.parse(localStorage.getItem('capilus-sheet')||'null'); if(cache){ if(cache.t) mergeTarifs(cache.t); if(cache.h) mergeHoraires(cache.h); } }catch(e){}
  function loadSheet(){
    if(!window.fetch || (!SHEET.tarifs && !SHEET.horaires)) return;
    function get(u){ return u ? fetch(u,{cache:'no-store'}).then(function(r){ if(!r.ok) throw 0; return r.text(); }).then(csv) : Promise.resolve(null); }
    Promise.all([get(SHEET.tarifs).catch(function(){return null;}), get(SHEET.horaires).catch(function(){return null;})]).then(function(res){
      if(res[0]) mergeTarifs(res[0]); if(res[1]) mergeHoraires(res[1]);
      try{ var c=JSON.parse(localStorage.getItem('capilus-sheet')||'{}')||{}; if(res[0]) c.t=res[0]; if(res[1]) c.h=res[1]; localStorage.setItem('capilus-sheet',JSON.stringify(c)); }catch(e){}
      applyAll();
    });
  }

  /* ===== Questionnaire ===== */
  var LEN={court:'Short',mi:'Medium-length',long:'Long'};
  var LENW={court:'short',mi:'medium-length',long:'long'};
  function LIS(){ return 'CHF\u00a0'+P.lissage_min+' – '+P.lissage_max; }
  function getW(){ return {
    coupe:{name:'Cut & blow-dry',p:{court:chf('coupe_court'),mi:'CHF\u00a0'+(num('brushing_mi')+num('supplement_coupe')),long:'CHF\u00a0'+(num('brushing_long')+num('supplement_coupe'))},txt:'Shampoo, cut and blow-dry: a cut suited to your features and your lifestyle.',form:'Coupe',sub:{court:'Shampoo, cut and dry',mi:'Blow-dry '+chf('brushing_mi')+' + cut '+chf('supplement_coupe'),long:'Blow-dry '+chf('brushing_long')+' + cut '+chf('supplement_coupe')}},
    couleur:{name:'Colouring & blow-dry',p:{court:chf('couleur_court'),mi:chf('couleur_mi'),long:chf('couleur_long')},txt:'A tailor-made colour to bring out the natural shine of your hair. Cut extra: '+chf('supplement_coupe')+'.',form:'Coloration'},
    meches:{name:'Highlights & blow-dry',p:{court:'from '+chf('meches_court'),mi:'from '+chf('meches_mi'),long:'from '+chf('meches_long')},txt:'Highlights that play with the light, for a bright, natural effect. Cut extra: '+chf('supplement_coupe')+'.',form:'Mèches'},
    lissage:{name:'Tannin straightening',p:{court:LIS(),mi:LIS(),long:LIS()},txt:'Our speciality: an organic, formaldehyde-free straightening that tames, nourishes and adds shine to your hair for 4 to 6 months. Price depends on length and thickness. 20% off your first straightening.',form:'Lissage au tanin',more:true},
    soin:{name:'Hair botox treatment',p:{court:'from '+chf('botox_court'),mi:'from '+chf('botox_mi'),long:'from '+chf('botox_long')},txt:'A moisturising, nourishing and anti-ageing treatment (caviar, collagen, amino acids, panthenol) that restores shine and softness in 15 minutes.',form:'Soin botox capillaire'},
    brushing:{name:'Shampoo & blow-dry',p:{court:chf('brushing_court'),mi:chf('brushing_mi'),long:chf('brushing_long')},txt:'A careful blow-dry for an occasion, an important meeting, or simply to treat yourself.',form:'Brushing'}
  }; };
  var state={};
  var quiz=$('#quiz'); if(quiz){
  function ico(id){ return '<svg class="ico"><use href="#i-'+id+'"/></svg>'; }
  function prog(n,t){ var s='<div class="q-prog">'; for(var i=1;i<=t;i++) s+='<i class="'+(i<=n?'on':'')+'"></i>'; return s+'</div>'; }
  function step(n,t,title,opts,two){
    var h=prog(n,t)+'<p class="q-step">Question '+n+'</p><p class="q-title">'+title+'</p><div class="q-opts'+(two?' two':'')+'">';
    opts.forEach(function(o){ h+='<button type="button" class="opt" data-k="'+o[0]+'">'+ico(o[2]||'arrow')+'<span>'+o[1]+(o[3]?'<small>'+o[3]+'</small>':'')+'</span></button>'; });
    h+='</div>'+(n>1?'<button type="button" class="q-back" data-back>'+ico('back')+'Back</button>':'');
    quiz.innerHTML=h;
    var f=$('.opt',quiz); if(f && quiz.dataset.focus) f.focus();
  }
  function render(){
    var s=state;
    if(!s.who) return step(1,3,'Who is the appointment for?',[['femme','A woman','woman'],['homme','A man','scissors'],['enfant','A child or teen','users','under 15']]);
    if(s.who==='homme'){
      if(!s.cut) return step(2,2,'Which cut do you prefer?',[['ciseaux','With scissors','scissors','Shampoo, cut and dry'],['tondeuse','With clippers','scissors','Shampoo, cut and dry']],true);
      return result({name:'Men’s cut · '+(s.cut==='ciseaux'?'scissors':'clippers'),price:s.cut==='ciseaux'?chf('homme_ciseaux'):chf('homme_tondeuse'),txt:'Shampoo, cut and dry, with a clean cut that suits your style.',form:'Coupe homme',len:null});
    }
    if(s.who==='enfant'){
      if(!s.age) return step(2,3,'How old is the child?',[['m10','Under 10','users'],['m15','Between 10 and 15','users']],true);
      if(!s.sex) return step(3,3,'It’s for…',[['g','A boy','users'],['f','A girl','users']],true);
      var pr=chf((s.age==='m10'?'enfant_':'ado_')+(s.sex==='f'?'fille':'garcon'));
      return result({name:(s.age==='m10'?'Child, under 10':'Teen, under 15')+' · '+(s.sex==='g'?'boy':'girl'),price:pr,txt:'A suitable cut, in a gentle, family atmosphere.',form:'Coupe enfant / ado',len:null});
    }
    if(!s.want) return step(2,4,'What would you like?',[['coupe','A new cut or a refresh','scissors'],['couleur','A new colour','palette'],['meches','Bright highlights','sparkles','highlights'],['lissage','Smooth, frizz-free hair','sparkles','tannin straightening'],['soin','Restore shine and softness','droplet','treatment'],['brushing','A blow-dry for an occasion','scissors']],true);
    if(!s.len) return step(3,4,'Your hair is…',[['court','Short','scissors'],['mi','Medium-length','scissors'],['long','Long','scissors']]);
    if(!s.prio) return step(4,4,'What matters most to you',[['temps','Saving time every day','clock'],['repare','Repairing and nourishing my hair','droplet'],['naturel','A natural result that feels like me','leaf'],['change','A real change','sparkles']],true);
    var w=getW()[s.want], plus='';
    if(s.prio==='temps' && s.want!=='lissage' && s.len!=='court') plus='Want to save time every morning? Consider <b>tannin straightening</b>, our speciality: less frizz and faster styling for 4 to 6 months.';
    else if(s.prio==='repare' && s.want!=='soin' && s.want!=='lissage') plus='To repair and nourish, a <b>hair botox treatment</b> can complement your service: in 15 minutes it restores shine and softness.';
    else if(s.prio==='change' && s.want==='coupe') plus='For a real change, <b>colouring</b> or <b>highlights</b> can go with your new cut. Annaëlle will advise you at the salon.';
    result({name:w.name,price:w.p[s.len],sub:w.sub?w.sub[s.len]:'',txt:w.txt,form:w.form,len:s.len,plus:plus,more:w.more});
  }
  function result(r){
    state.res=r;
    var h=prog(4,4).replace(/<i class="">/g,'<i class="on">')+'<div class="q-res"><p class="q-step">Our suggestion for you</p>';
    h+='<div class="res-card"><div class="res-name"><h3>'+r.name+'</h3><span class="amt">'+r.price+'</span></div>';
    if(r.len) h+='<p class="res-len">'+LEN[r.len]+' hair'+(r.sub?' · '+r.sub:'')+'</p>';
    h+='<p>'+r.txt+'</p>'+(r.plus?'<div class="res-plus">'+r.plus+'</div>':'')+'<p class="incl-s">'+ico('check')+'All products used are included in the price.</p></div>';
    h+='<div class="res-act"><button type="button" class="btn btn-gold" data-book>'+ico('card')+'Request this appointment</button>';
    if(r.more) h+='<a class="link" href="'+U('lissage')+'">Learn more'+ico('arrow')+'</a>';
    h+='</div><button type="button" class="q-back" data-restart>'+ico('refresh')+'Start again</button></div>';
    quiz.innerHTML=h;
  }
  var order={femme:['who','want','len','prio'],homme:['who','cut'],enfant:['who','age','sex']};
  quiz.addEventListener('click', function(e){
    var b=e.target.closest('button,a'); if(!b) return;
    quiz.dataset.focus='1';
    if(b.dataset.k){
      var seq=order[state.who]||['who']; var key=seq[0];
      for(var i=0;i<seq.length;i++){ if(!state[seq[i]]){ key=seq[i]; break; } }
      state[key]=b.dataset.k; render(); return;
    }
    if(b.hasAttribute('data-back')){
      var seq2=order[state.who]||['who']; for(var j=seq2.length-1;j>=0;j--){ if(state[seq2[j]]){ delete state[seq2[j]]; break; } }
      if(!state.who) state={}; render(); return;
    }
    if(b.hasAttribute('data-restart')){ state={}; render(); return; }
    if(b.hasAttribute('data-book')){
      var r=state.res; try{ sessionStorage.setItem('capilus-pre', JSON.stringify({form:r.form,len:r.len,quiz:r.name+(r.price?' ('+r.price+')':'')})); }catch(err){}
      location.href=U('contact'); return;
    }
    
  });
  render(); delete quiz.dataset.focus;
  }

  /* ===== Contact form → WhatsApp (simple, one choice) ===== */
  function MIN(ks){ return Math.min.apply(null,ks.map(num)); }
  function plPrices(){ return {coupe:'from CHF\u00a0'+MIN(['brushing_court']),couleur:'from '+chf('couleur_court'),meches:'from '+chf('meches_court'),soin:'from '+chf('botox_court'),lissage:LIS(),homme:'from CHF\u00a0'+MIN(['homme_ciseaux','homme_tondeuse']),enfant:'from CHF\u00a0'+MIN(['enfant_garcon','enfant_fille','ado_garcon','ado_fille']),autre:''}; }
  var PLP=plPrices();
  var PL=[
    ['coupe','Cut & blow-dry',PLP.coupe],
    ['couleur','Colouring',PLP.couleur],
    ['meches','Highlights',PLP.meches],
    ['soin','Hair botox treatment',PLP.soin],
    ['lissage','Tannin straightening',PLP.lissage,'Our speciality'],
    ['homme','Men’s cut',PLP.homme],
    ['enfant','Child or teen',PLP.enfant],
    ['autre','Other request or advice','']
  ];
  var MAP={'Coupe':'coupe','Brushing':'coupe','Coloration':'couleur','Mèches':'meches','Soin botox capillaire':'soin','Lissage au tanin':'lissage','Coupe homme':'homme','Coupe enfant / ado':'enfant'};
  var WHEN=[['vite','As soon as possible'],['semaine','On a weekday'],['samedi','On a Saturday']];
  var form={p:null,when:null,quiz:''};
  var plist=$('#f-prest'); var refreshPrices=function(){}; if(plist){
  plist.innerHTML=PL.map(function(x){ return '<button type="button" class="prow" role="radio" aria-checked="false" data-v="'+x[0]+'"><span class="dot"></span><span class="nm">'+x[1]+(x[3]?'<small>'+x[3]+'</small>':'')+'</span><span class="pr">'+x[2]+'</span></button>'; }).join('');
  refreshPrices=function(){ var pp=plPrices(); $$('.prow',plist).forEach(function(b){ var v=pp[b.dataset.v]; if(v!==undefined) $('.pr',b).textContent=v; }); }
  $('#f-when').innerHTML=WHEN.map(function(x){ return '<button type="button" role="radio" aria-checked="false" data-v="'+x[0]+'">'+x[1]+'</button>'; }).join('');
  plist.addEventListener('click', function(e){ var b=e.target.closest('.prow'); if(!b) return; form.p=b.dataset.v; form.quiz=''; $('#e-prest').classList.remove('show'); sync(); preview(); });
  $('#f-when').addEventListener('click', function(e){ var b=e.target.closest('button'); if(!b) return; form.when = form.when===b.dataset.v ? null : b.dataset.v; sync(); preview(); });
  function sync(){
    $$('.prow',plist).forEach(function(b){ b.setAttribute('aria-checked', b.dataset.v===form.p); });
    $$('#f-when button').forEach(function(b){ b.setAttribute('aria-checked', b.dataset.v===form.when); });
    var fq=$('#fromquiz'); fq.textContent = form.quiz ? 'Suggested by the questionnaire: '+form.quiz : ''; fq.classList.toggle('show', !!form.quiz);
  }
  function prefill(list,len,quizTxt){ form.p=MAP[list[0]]||'autre'; form.quiz=quizTxt||''; sync(); preview(); }
  function label(){ for(var i=0;i<PL.length;i++){ if(PL[i][0]===form.p) return PL[i][1]; } return ''; }
  function msg(){
    var n=$('#f-name').value.trim();
    var t='Hello Annaëlle, '+(n?'my name is '+n+'. ':'');
    if(form.p==='autre') t+='I have a question / would like some advice.';
    else if(form.quiz) t+='I would like to book an appointment for: '+form.quiz+'.';
    else if(form.p) t+='I would like to book an appointment for: '+({coupe:'a cut & blow-dry',couleur:'colouring',meches:'highlights',soin:'a hair botox treatment',lissage:'tannin straightening',homme:'a men’s cut',enfant:'a child / teen cut'})[form.p]+'.';
    else t+='I would like to book an appointment.';
    if(form.when==='vite') t+=' As soon as possible, if you have availability.';
    else if(form.when==='semaine') t+=' Preferably on a weekday.';
    else if(form.when==='samedi') t+=' Preferably on a Saturday.';
    var m=$('#f-msg').value.trim(); if(m) t+='\n'+m;
    t+='\nThank you, see you soon!';
    return t;
  }
  function preview(){ $('#pv').textContent=msg(); }
  ['#f-name','#f-msg'].forEach(function(sel){ $(sel).addEventListener('input', function(){ preview(); $('#e-name').classList.remove('show'); }); });
  $('#rdv').addEventListener('submit', function(e){
    e.preventDefault();
    var ok=true;
    if(!form.p){ $('#e-prest').classList.add('show'); ok=false; }
    if(!$('#f-name').value.trim()){ $('#e-name').classList.add('show'); ok=false; }
    if(!ok){ var f=$('.err.show'); if(f) f.parentNode.scrollIntoView({behavior:smooth()?'smooth':'auto',block:'center'}); return; }
    window.open('https://wa.me/'+WA+'?text='+encodeURIComponent(msg()),'_blank','noopener');
  });
  preview();
  try{ var pre=JSON.parse(sessionStorage.getItem('capilus-pre')||'null'); if(pre){ sessionStorage.removeItem('capilus-pre'); prefill([pre.form], pre.len, pre.quiz); } }catch(e){}
  }

  /* Opening status, Geneva time */
  var H={0:null,1:null,2:[540,1080],3:[540,840],4:[540,1080],5:[540,1080],6:'rdv'};
  function hm(n){ var m=n%60; return Math.floor(n/60)+':'+(m<10?'0':'')+m; }
  var N=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  function genevaNow(){
    try{
      var p=new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Zurich',weekday:'short',hour:'2-digit',minute:'2-digit',hour12:false}).formatToParts(new Date());
      var o={}; p.forEach(function(x){ o[x.type]=x.value; });
      var wd={Sun:0,Mon:1,Tue:2,Wed:3,Thu:4,Fri:5,Sat:6}[o.weekday];
      return {day:wd, min:(+o.hour%24)*60 + +o.minute};
    }catch(e){ var n=new Date(); return {day:n.getDay(), min:n.getHours()*60+n.getMinutes()}; }
  }
  function status(){
    var t=genevaNow(), h=H[t.day], txt, open=false;
    if(Array.isArray(h) && t.min>=h[0] && t.min<h[1]){ open=true; txt='<b>Open</b> until '+hm(h[1]); }
    else if(Array.isArray(h) && t.min<h[0]){ txt='<b>Closed</b>, opens today at '+hm(h[0]); }
    else if(h==='rdv'){ txt='<b>'+N[t.day].charAt(0).toUpperCase()+N[t.day].slice(1)+'</b>, by appointment only'; }
    else { for(var i=1;i<=7;i++){ var dd=(t.day+i)%7; if(Array.isArray(H[dd])){ txt='<b>Closed</b>, reopens '+(i===1?'tomorrow':N[dd])+' at '+hm(H[dd][0]); break; } } }
    if(!txt) txt='<b>Closed</b>';
    $$('[data-status]').forEach(function(el){ el.classList.toggle('open',open); $('span',el).innerHTML=txt+'<span class="sr-only">, Geneva time</span>'; });
    $$('#hours li').forEach(function(li){ li.classList.toggle('today', +li.getAttribute('data-d')===t.day); });
  }
  applyAll(); loadSheet(); onScroll();
  status(); setInterval(status, 60000);

  (function(){ var hl=$('.hero-logo'); if(!hl||!('IntersectionObserver' in window)){ d.body.classList.remove('hero-logo-in'); return; }
    new IntersectionObserver(function(e){ d.body.classList.toggle('hero-logo-in', e[0].isIntersecting); },{rootMargin:'-60px 0px 0px 0px'}).observe(hl); })();
})();
