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
  var HT={1:'Fermé',2:'9h00 – 18h00',3:'9h00 – 14h00',4:'9h00 – 18h00',5:'9h00 – 18h00',6:'Sur rendez-vous',0:'Fermé'};
  var DAYS={lundi:1,mardi:2,mercredi:3,jeudi:4,vendredi:5,samedi:6,dimanche:0};
  var DN=['Dimanche','Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi'];
  function chf(k){ return 'CHF '+P[k]; }
  function num(k){ var n=parseInt(String(P[k]).replace(/[^0-9]/g,''),10); return isNaN(n)?0:n; }
  function okPrice(v){ return /^[0-9][0-9 '.,]{0,7}$/.test(v); }
  function parseH(v){
    var x=String(v||'').trim(), l=x.toLowerCase();
    if(!x) return null;
    if(/^ferm/.test(l)) return {t:'Fermé',h:null};
    if(/rendez|rdv/.test(l)) return {t:'Sur rendez-vous',h:'rdv'};
    var m=l.match(/^(\d{1,2})\s*[h:.]\s*(\d{2})?\s*(?:[–—-]|à)\s*(\d{1,2})\s*[h:.]?\s*(\d{2})?$/);
    if(!m) return null;
    var a=+m[1]*60+(+m[2]||0), b=+m[3]*60+(+m[4]||0);
    if(a>=b || b>24*60) return null;
    function f(n){ var mm=n%60; return Math.floor(n/60)+'h'+(mm<10?'0':'')+mm; }
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
        if(idx[s]===undefined){ idx[s]=g.length; g.push({s:s,d:[]}); } g[idx[s]].d.push(DN[d].toLowerCase()); });
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
  var LEN={court:'Courts',mi:'Mi-longs',long:'Longs'};
  var LENW={court:'courts',mi:'mi-longs',long:'longs'};
  function LIS(){ return 'CHF\u00a0'+P.lissage_min+' – '+P.lissage_max; }
  function getW(){ return {
    coupe:{name:'Coupe & brushing',p:{court:chf('coupe_court'),mi:'CHF\u00a0'+(num('brushing_mi')+num('supplement_coupe')),long:'CHF\u00a0'+(num('brushing_long')+num('supplement_coupe'))},txt:'Shampoing, coupe et brushing : une coupe adaptée à votre morphologie et à votre quotidien.',form:'Coupe',sub:{court:'Shampoing, coupe et séchage',mi:'Brushing '+chf('brushing_mi')+' + coupe '+chf('supplement_coupe'),long:'Brushing '+chf('brushing_long')+' + coupe '+chf('supplement_coupe')}},
    couleur:{name:'Coloration & brushing',p:{court:chf('couleur_court'),mi:chf('couleur_mi'),long:chf('couleur_long')},txt:'Une coloration sur mesure pour révéler l’éclat naturel de votre chevelure. Coupe en supplément : '+chf('supplement_coupe')+'.',form:'Coloration'},
    meches:{name:'Mèches & brushing',p:{court:'dès '+chf('meches_court'),mi:'dès '+chf('meches_mi'),long:'dès '+chf('meches_long')},txt:'Des mèches qui jouent sur les reflets, pour un effet lumineux et naturel. Coupe en supplément : '+chf('supplement_coupe')+'.',form:'Mèches'},
    lissage:{name:'Lissage au tanin',p:{court:LIS(),mi:LIS(),long:LIS()},txt:'Notre spécialité : un lissage organique sans formaldéhyde, qui discipline, nourrit et fait briller vos cheveux pendant 4 à 6 mois. Tarif selon longueur et épaisseur. -20 % sur votre premier lissage.',form:'Lissage au tanin',more:true},
    soin:{name:'Soin botox capillaire',p:{court:'dès '+chf('botox_court'),mi:'dès '+chf('botox_mi'),long:'dès '+chf('botox_long')},txt:'Un soin hydronutritif et anti-âge (caviar, collagène, acides aminés, panthénol) qui restaure en 15 minutes la brillance et la douceur de la chevelure.',form:'Soin botox capillaire'},
    brushing:{name:'Shampoing & brushing',p:{court:chf('brushing_court'),mi:chf('brushing_mi'),long:chf('brushing_long')},txt:'Un brushing soigné pour une occasion, un rendez-vous important, ou simplement pour vous faire plaisir.',form:'Brushing'}
  }; };
  var state={};
  var quiz=$('#quiz'); if(quiz){
  function ico(id){ return '<svg class="ico"><use href="#i-'+id+'"/></svg>'; }
  function prog(n,t){ var s='<div class="q-prog">'; for(var i=1;i<=t;i++) s+='<i class="'+(i<=n?'on':'')+'"></i>'; return s+'</div>'; }
  function step(n,t,title,opts,two){
    var h=prog(n,t)+'<p class="q-step">Question '+n+'</p><p class="q-title">'+title+'</p><div class="q-opts'+(two?' two':'')+'">';
    opts.forEach(function(o){ h+='<button type="button" class="opt" data-k="'+o[0]+'">'+ico(o[2]||'arrow')+'<span>'+o[1]+(o[3]?'<small>'+o[3]+'</small>':'')+'</span></button>'; });
    h+='</div>'+(n>1?'<button type="button" class="q-back" data-back>'+ico('back')+'Revenir en arrière</button>':'');
    quiz.innerHTML=h;
    var f=$('.opt',quiz); if(f && quiz.dataset.focus) f.focus();
  }
  function render(){
    var s=state;
    if(!s.who) return step(1,3,'Pour qui est le rendez-vous ?',[['femme','Une femme','woman'],['homme','Un homme','scissors'],['enfant','Un enfant ou un ado','users','moins de 15 ans']]);
    if(s.who==='homme'){
      if(!s.cut) return step(2,2,'Quelle coupe préférez-vous ?',[['ciseaux','Aux ciseaux','scissors','Shampoing, coupe et séchage'],['tondeuse','À la tondeuse','scissors','Shampoing, coupe et séchage']],true);
      return result({name:'Coupe homme · '+(s.cut==='ciseaux'?'ciseaux':'tondeuse'),price:s.cut==='ciseaux'?chf('homme_ciseaux'):chf('homme_tondeuse'),txt:'Shampoing, coupe et séchage, avec une coupe nette et adaptée à votre style.',form:'Coupe homme',len:null});
    }
    if(s.who==='enfant'){
      if(!s.age) return step(2,3,'Quel âge a-t-il ou a-t-elle ?',[['m10','Moins de 10 ans','users'],['m15','Entre 10 et 15 ans','users']],true);
      if(!s.sex) return step(3,3,'C’est pour…',[['g','Un garçon','users'],['f','Une fille','users']],true);
      var pr=chf((s.age==='m10'?'enfant_':'ado_')+(s.sex==='f'?'fille':'garcon'));
      return result({name:(s.age==='m10'?'Enfant, moins de 10 ans':'Ado, moins de 15 ans')+' · '+(s.sex==='g'?'garçon':'fille'),price:pr,txt:'Une coupe adaptée, dans une ambiance douce et familiale.',form:'Coupe enfant / ado',len:null});
    }
    if(!s.want) return step(2,4,'Qu’aimeriez-vous ?',[['coupe','Changer de coupe ou la rafraîchir','scissors'],['couleur','Une nouvelle coloration','palette'],['meches','Des reflets lumineux','sparkles','mèches'],['lissage','Des cheveux disciplinés, sans frisottis','sparkles','lissage au tanin'],['soin','Redonner éclat et douceur','droplet','soin'],['brushing','Un brushing pour une occasion','scissors']],true);
    if(!s.len) return step(3,4,'Vos cheveux sont plutôt…',[['court','Courts','scissors'],['mi','Mi-longs','scissors'],['long','Longs','scissors']]);
    if(!s.prio) return step(4,4,'Ce qui compte le plus pour vous',[['temps','Gagner du temps au quotidien','clock'],['repare','Réparer et nourrir mes cheveux','droplet'],['naturel','Un résultat naturel, qui me ressemble','leaf'],['change','Un vrai changement','sparkles']],true);
    var w=getW()[s.want], plus='';
    if(s.prio==='temps' && s.want!=='lissage' && s.len!=='court') plus='Vous voulez gagner du temps chaque matin ? Pensez au <b>lissage au tanin</b>, notre spécialité : moins de frisottis, un coiffage plus rapide, pendant 4 à 6 mois.';
    else if(s.prio==='repare' && s.want!=='soin' && s.want!=='lissage') plus='Pour réparer et nourrir, le <b>soin botox capillaire</b> peut compléter votre prestation : en 15 minutes, il restaure brillance et douceur.';
    else if(s.prio==='change' && s.want==='coupe') plus='Pour un vrai changement, une <b>coloration</b> ou des <b>mèches</b> peuvent accompagner votre nouvelle coupe. Annaëlle vous conseillera au salon.';
    result({name:w.name,price:w.p[s.len],sub:w.sub?w.sub[s.len]:'',txt:w.txt,form:w.form,len:s.len,plus:plus,more:w.more});
  }
  function result(r){
    state.res=r;
    var h=prog(4,4).replace(/<i class="">/g,'<i class="on">')+'<div class="q-res"><p class="q-step">Notre proposition pour vous</p>';
    h+='<div class="res-card"><div class="res-name"><h3>'+r.name+'</h3><span class="amt">'+r.price+'</span></div>';
    if(r.len) h+='<p class="res-len">Cheveux '+LENW[r.len]+(r.sub?' · '+r.sub:'')+'</p>';
    h+='<p>'+r.txt+'</p>'+(r.plus?'<div class="res-plus">'+r.plus+'</div>':'')+'<p class="incl-s">'+ico('check')+'Tous les produits utilisés sont inclus dans le prix.</p></div>';
    h+='<div class="res-act"><button type="button" class="btn btn-gold" data-book>'+ico('card')+'Demander ce rendez-vous</button>';
    if(r.more) h+='<a class="link" href="'+U('lissage')+'">En savoir plus'+ico('arrow')+'</a>';
    h+='</div><button type="button" class="q-back" data-restart>'+ico('refresh')+'Recommencer</button></div>';
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
  function plPrices(){ return {coupe:'dès CHF\u00a0'+MIN(['brushing_court']),couleur:'dès '+chf('couleur_court'),meches:'dès '+chf('meches_court'),soin:'dès '+chf('botox_court'),lissage:LIS(),homme:'dès CHF\u00a0'+MIN(['homme_ciseaux','homme_tondeuse']),enfant:'dès CHF\u00a0'+MIN(['enfant_garcon','enfant_fille','ado_garcon','ado_fille']),autre:''}; }
  var PLP=plPrices();
  var PL=[
    ['coupe','Coupe & brushing',PLP.coupe],
    ['couleur','Coloration',PLP.couleur],
    ['meches','Mèches',PLP.meches],
    ['soin','Soin botox capillaire',PLP.soin],
    ['lissage','Lissage au tanin',PLP.lissage,'Notre spécialité'],
    ['homme','Coupe homme',PLP.homme],
    ['enfant','Enfant ou ado',PLP.enfant],
    ['autre','Autre demande ou conseil','']
  ];
  var MAP={'Coupe':'coupe','Brushing':'coupe','Coloration':'couleur','Mèches':'meches','Soin botox capillaire':'soin','Lissage au tanin':'lissage','Coupe homme':'homme','Coupe enfant / ado':'enfant'};
  var WHEN=[['vite','Au plus tôt'],['semaine','En semaine'],['samedi','Le samedi']];
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
    var fq=$('#fromquiz'); fq.textContent = form.quiz ? 'Proposé par le questionnaire : '+form.quiz : ''; fq.classList.toggle('show', !!form.quiz);
  }
  function prefill(list,len,quizTxt){ form.p=MAP[list[0]]||'autre'; form.quiz=quizTxt||''; sync(); preview(); }
  function label(){ for(var i=0;i<PL.length;i++){ if(PL[i][0]===form.p) return PL[i][1]; } return ''; }
  function msg(){
    var n=$('#f-name').value.trim();
    var t='Bonjour Annaëlle, '+(n?'je m’appelle '+n+'. ':'');
    var low=!n;
    if(form.p==='autre') t+=(low?'j':'J')+'’aurais une question / je souhaiterais un conseil.';
    else if(form.quiz) t+=(low?'je':'Je')+' souhaiterais prendre rendez-vous pour : '+form.quiz+'.';
    else if(form.p) t+=(low?'je':'Je')+' souhaiterais prendre rendez-vous pour : '+({coupe:'une coupe & brushing',couleur:'une coloration',meches:'des mèches',soin:'un soin botox capillaire',lissage:'un lissage au tanin',homme:'une coupe homme',enfant:'une coupe enfant / ado'})[form.p]+'.';
    else t+=(low?'je':'Je')+' souhaiterais prendre rendez-vous.';
    if(form.when==='vite') t+=' Dès que possible, si vous avez une disponibilité.';
    else if(form.when==='semaine') t+=' De préférence en semaine.';
    else if(form.when==='samedi') t+=' De préférence un samedi.';
    var m=$('#f-msg').value.trim(); if(m) t+='\n'+m;
    t+='\nMerci et à bientôt !';
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
  function hm(n){ var m=n%60; return Math.floor(n/60)+'h'+(m<10?'0':'')+m; }
  var N=['dimanche','lundi','mardi','mercredi','jeudi','vendredi','samedi'];
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
    if(Array.isArray(h) && t.min>=h[0] && t.min<h[1]){ open=true; txt='<b>Ouvert</b> jusqu’à '+hm(h[1]); }
    else if(Array.isArray(h) && t.min<h[0]){ txt='<b>Fermé</b>, ouvre aujourd’hui à '+hm(h[0]); }
    else if(h==='rdv'){ txt='<b>'+N[t.day].charAt(0).toUpperCase()+N[t.day].slice(1)+'</b>, sur rendez-vous uniquement'; }
    else { for(var i=1;i<=7;i++){ var dd=(t.day+i)%7; if(Array.isArray(H[dd])){ txt='<b>Fermé</b>, réouverture '+(i===1?'demain':N[dd])+' à '+hm(H[dd][0]); break; } } }
    if(!txt) txt='<b>Fermé</b>';
    $$('[data-status]').forEach(function(el){ el.classList.toggle('open',open); $('span',el).innerHTML=txt+'<span class="sr-only">, heure de Genève</span>'; });
    $$('#hours li').forEach(function(li){ li.classList.toggle('today', +li.getAttribute('data-d')===t.day); });
  }
  applyAll(); loadSheet(); onScroll();
  status(); setInterval(status, 60000);

  (function(){ var hl=$('.hero-logo'); if(!hl||!('IntersectionObserver' in window)){ d.body.classList.remove('hero-logo-in'); return; }
    new IntersectionObserver(function(e){ d.body.classList.toggle('hero-logo-in', e[0].isIntersecting); },{rootMargin:'-60px 0px 0px 0px'}).observe(hl); })();
})();
