/* FFG Advisor v0.6 — replace the advisor shell, retire pension modules from the
   available product, preserve all existing non-pension calculation engines. */
(function(){
  'use strict';
  const $=id=>document.getElementById(id);
  const tools=[
    {id:'mortgage',name:'Hypoteční kalkulačka',short:'Hypotéka',icon:'⌂',tag:'BYDLENÍ',
      desc:'Splátka, fixace, LTV, mimořádné splátky a stresový scénář.',keys:'banka úvěr splátky bydlení fixace'},
    {id:'investment',name:'Investiční plán',short:'Investice',icon:'↗',tag:'INVESTOVÁNÍ',
      desc:'Vývoj hodnoty, vlastní vklady, náklady, inflace a více scénářů.',keys:'investice etf fond výnos poplatky'},
    {id:'savings',name:'Spoření a vklady',short:'Spoření',icon:'▤',tag:'REZERVY',
      desc:'Úroková pásma, měsíční vklady a model zůstatku po zdanění.',keys:'spoření banka úrok spořicí účet'},
    {id:'dip',name:'Dlouhodobý investiční produkt',short:'DIP',icon:'◎',tag:'DAŇOVÁ PODPORA',
      desc:'Příspěvky klienta a zaměstnavatele, náklady a model daňové podpory.',keys:'dip investice zaměstnavatel daň odpočet'},
    {id:'dps',name:'Doplňkové penzijní spoření',short:'DPS',icon:'◈',tag:'PRAVIDELNÉ SPOŘENÍ',
      desc:'Státní podpora, příspěvky zaměstnavatele, výnosové scénáře.',keys:'dps penzijní spoření státní příspěvek'},
    {id:'protection',name:'Analýza pojistného krytí',short:'Pojištění',icon:'⬡',tag:'ZAJIŠTĚNÍ',
      desc:'Finanční mezera domácnosti, příjmy, závazky a stávající krytí.',keys:'pojištění smrt invalidita nemoc finanční mezera'},
    {id:'comparison',name:'Porovnání variant',short:'Srovnání',icon:'⇄',tag:'ROZHODOVÁNÍ',
      desc:'Dvě investiční možnosti vedle sebe — výnosy, náklady i vklady.',keys:'porovnání varianta fond investice poplatek'},
    {id:'market',name:'Tržní podklady',short:'Trh a produkty',icon:'◉',tag:'KATALOG',
      desc:'Přehled bank, institucí a fondů s odkazy na zdroje.',keys:'banky produkty poskytovatelé sazby fondy katalog'}
  ];
  // SVGs remain crisp across operating systems without an external icon font.
  const iconPaths={
    overview:'<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
    mortgage:'<path d="m3 10 9-7 9 7"/><path d="M5 9v11h14V9"/><path d="M9 20v-7h6v7"/>',
    investment:'<path d="m3 17 6-6 4 4 8-8"/><path d="M15 7h6v6"/>',
    savings:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18"/><circle cx="16" cy="16" r="1"/>',
    dip:'<path d="M12 2 4 6v6c0 5 3 8 8 10 5-2 8-5 8-10V6Z"/><path d="m8.5 12 2.5 2.5 4.5-5"/>',
    dps:'<circle cx="12" cy="12" r="9"/><path d="M12 6v12M15.5 9.5c-.5-1-1.6-1.5-3.5-1.5-2 0-3 1-3 2.5s1 2 3 2.5c2 .5 3 1 3 2.5S14 18 12 18c-1.9 0-3.1-.7-3.5-1.8"/>',
    protection:'<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/>',
    comparison:'<path d="M4 7h16m-4-4 4 4-4 4M20 17H4m4-4-4 4 4 4"/>',
    market:'<path d="M3 10 12 3l9 7M5 10v10h14V10M2 21h20M9 13v4m6-4v4"/>',
    arrow:'<path d="M7 17 17 7M8 7h9v9"/>'
  };
  const svg=id=>'<svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+iconPaths[id]+'</svg>';
  const retired=['pension','ioldp-report','disability'];
  const buttons=new Map();

  // Remove the old pension views and links from the live application, including
  // direct hash navigation. Existing calculation engines initialize first.
  retired.forEach(id=>{
    document.querySelector('.nav button[data-view="'+id+'"]')?.remove();
    $('view-'+id)?.remove();
  });
  const nav=document.querySelector('.nav');
  const overviewButton=nav.querySelector('[data-view="overview"]');
  if(overviewButton){buttons.set('overview',overviewButton);overviewButton.querySelector('.nav-icon').innerHTML=svg('overview');}
  for(const tool of tools){const button=nav.querySelector('[data-view="'+tool.id+'"]');if(button){buttons.set(tool.id,button);button.querySelector('.nav-icon').innerHTML=svg(tool.id);}}
  nav.replaceChildren();
  const addGroup=(label,ids)=>{
    const group=document.createElement('div');group.className='nav-group';group.textContent=label;nav.append(group);
    ids.forEach(id=>{const button=buttons.get(id);if(button)nav.append(button);});
  };
  addGroup('Pracovní plocha',['overview']);
  addGroup('Plánování',['mortgage','investment','savings','dip','dps']);
  addGroup('Analýza',['protection','comparison']);
  addGroup('Datové podklady',['market']);

  const sidebar=$('sidebar');
  const sideNote=sidebar.querySelector('.side-note');
  if(sideNote)sideNote.innerHTML='<div class="rail-status">Pracovní režim</div><br><br><b>FFG Advisor</b><br>Nezávislé modelové výpočty s vysvětlenými předpoklady. Sazby vždy ověř u poskytovatele.';
  const foot=sidebar.querySelector('.side-foot');if(foot)foot.textContent='FFG · FINANČNÍ NÁSTROJE · V0.8';
  const brandSub=sidebar.querySelector('.brand-sub');if(brandSub)brandSub.textContent='ADVISOR WORKSPACE';
  document.title='FFG Advisor · poradenské studio v0.8';
  const footer=document.querySelector('.content > .footer-note');
  if(footer)footer.innerHTML='FFG Advisor · v0.8 · Orientační finanční modely, nikoli závazné nabídky nebo automatická doporučení. Spořicí sazby: poslední ověření '+(window.FFGRateCatalog?.verified||'nezjištěno')+'. Automatická měsíční kontrola nezaručuje neměnnou sazbu; vždy ověř konkrétní nabídku. Nezadávej citlivé klientské údaje: aplikace nemá zabezpečenou klientskou databázi ani správu přístupů.';

  const cards=tools.map(tool=>'<button class="tool-card" type="button" data-open-view="'+tool.id+'" aria-label="Otevřít '+tool.name+'">'+
    '<div class="tool-card-head"><span class="tool-icon">'+svg(tool.id)+'</span><span class="tool-arrow" aria-hidden="true">'+svg('arrow')+'</span></div>'+
    '<div><strong>'+tool.name+'</strong><p>'+tool.desc+'</p></div><span class="tool-meta">'+tool.tag+'</span></button>').join('');
  const overview=$('view-overview');
  overview.innerHTML=`<section class="dashboard-hero" aria-label="Poradenské studio">
    <div><div class="hero-eyebrow">FINANČNÍ PRACOVNÍ PROSTOR</div>
    <h1>Víc jasno v číslech.<br><em>Méně práce s výpočty.</em></h1>
    <p>Přehledné kalkulačky pro finanční schůzky. Změň vstupy a okamžitě uvidíš, jak se promítají do výsledku, grafu a dalších scénářů.</p>
    <div class="hero-actions"><button class="btn" data-open-view="mortgage">Spočítat hypotéku ${svg('arrow')}</button><button class="btn secondary" data-open-view="investment">Otevřít investice ${svg('arrow')}</button></div></div>
    <aside class="hero-brief"><div class="hero-brief-label">PORADENSKÝ REŽIM</div><strong>8 nástrojů.<br>Jeden pracovní prostor.</strong>
    <p>Výsledky zůstávají v prohlížeči. Každá změna je propočítaná a vysvětlená.</p>
    <div class="brief-divider"></div><small>Produktová data jsou orientační · kontrola nabídky nutná</small></aside>
  </section>
  <div class="dashboard-section-header"><div><div class="eyebrow">RYCHLÝ PŘÍSTUP</div><h2>Co dnes potřebuješ spočítat?</h2><p>Vyber oblast. Výsledek uvidíš hned vedle zadaných údajů.</p></div><span class="section-count">8 pracovních nástrojů</span></div>
  <div class="tool-grid">${cards}</div>
  <div class="workflow-note">
    <div><span>↻</span><div><strong>Výpočet bez čekání</strong><p>Čísla a grafy se průběžně přepočítávají podle zadaných hodnot.</p></div></div>
    <div><span>◈</span><div><strong>Viditelné předpoklady</strong><p>Výnosy, poplatky a scénáře lze upravit — nejsou to sliby poskytovatelů.</p></div></div>
    <div><span>✓</span><div><strong>Pro přímou práci</strong><p>Rozvržení je navržené pro schůzku, mobil i tisk vybraného výpočtu.</p></div></div>
  </div>`;

  for(const [id,tool] of tools.map(t=>[t.id,t])){
    const view=$('view-'+id);if(!view)continue;
    const pageHead=view.querySelector('.page-head');
    if(pageHead&&id!=='market'){
      const hint=document.createElement('div');hint.className='calc-context';
      hint.innerHTML='<i aria-hidden="true">✓</i><span>Vstupy, výsledky a grafy se automaticky aktualizují. Orientační předpoklady můžeš změnit.</span>';
      pageHead.after(hint);
    }
    if(id==='market')continue;
    const result=view.querySelector('.calc-layout>.card:last-child');
    if(result){result.setAttribute('aria-label','Výsledky kalkulace');}
  }

  const topActions=document.querySelector('.top-actions');
  const shortcut=document.createElement('button');shortcut.type='button';shortcut.className='shortcut-trigger btn secondary';
  shortcut.innerHTML='<span>⌕ &nbsp; Otevřít nástroj</span><kbd>⌘ K</kbd>';
  shortcut.setAttribute('aria-label','Vyhledat kalkulačku (Control K nebo Command K)');
  topActions.prepend(shortcut);
  const search=document.createElement('div');search.className='ffg-search-backdrop';search.setAttribute('aria-hidden','true');
  search.innerHTML='<div class="ffg-search-panel" role="dialog" aria-modal="true" aria-label="Rychlé otevření nástroje">'+
    '<div class="ffg-search-top"><span>⌕</span><input type="search" autocomplete="off" placeholder="Hypotéka, DIP, investice…" aria-label="Hledat kalkulačku"><button type="button" data-search-close="1">ESC</button></div>'+
    '<div class="ffg-search-results"></div><div class="ffg-search-foot">↑ ↓ pro výběr · Enter otevře · Esc zavře</div></div>';
  document.body.append(search);
  const searchInput=search.querySelector('input'),searchResults=search.querySelector('.ffg-search-results');
  let filtered=tools,selected=0,lastFocus=null;
  function renderResults(){
    const query=searchInput.value.toLocaleLowerCase('cs').trim();
    filtered=tools.filter(t=>(t.name+' '+t.short+' '+t.keys).toLocaleLowerCase('cs').includes(query));
    selected=Math.max(0,Math.min(selected,filtered.length-1));
    searchResults.innerHTML=filtered.length?filtered.map((t,i)=>'<button class="ffg-search-result'+(i===selected?' selected':'')+'" type="button" data-open-view="'+t.id+'"><span>'+svg(t.id)+'</span>'+t.name+'<small>'+svg('arrow')+'</small></button>').join(''):'<div class="ffg-search-empty">Nenalezeno. Zkus například „hypotéka“ nebo „investice“.</div>';
  }
  function openSearch(){lastFocus=document.activeElement;search.classList.add('open');search.setAttribute('aria-hidden','false');selected=0;searchInput.value='';renderResults();searchInput.focus();}
  function closeSearch(){search.classList.remove('open');search.setAttribute('aria-hidden','true');lastFocus?.focus?.();}
  shortcut.addEventListener('click',openSearch);
  search.addEventListener('click',event=>{if(event.target===search||event.target.closest('[data-search-close]'))closeSearch();});
  searchInput.addEventListener('input',()=>{selected=0;renderResults();});
  searchInput.addEventListener('keydown',event=>{
    if(event.key==='ArrowDown'){event.preventDefault();selected=Math.min(filtered.length-1,selected+1);renderResults();}
    if(event.key==='ArrowUp'){event.preventDefault();selected=Math.max(0,selected-1);renderResults();}
    if(event.key==='Enter'&&filtered[selected]){event.preventDefault();closeSearch();openView(filtered[selected].id);}
  });
  document.addEventListener('keydown',event=>{
    if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='k'){event.preventDefault();openSearch();}
    if(event.key==='Escape'&&search.classList.contains('open')){event.stopImmediatePropagation();closeSearch();}
  },true);
  function openView(view){if(!buttons.has(view))return;if(search.classList.contains('open'))closeSearch();window.go(view);}
  document.addEventListener('click',event=>{const trigger=event.target.closest?.('[data-open-view]');if(trigger)openView(trigger.dataset.openView);});

  // Better mobile drawer behaviour; do not obscure the working canvas.
  const overlay=document.createElement('div');overlay.className='side-overlay';overlay.setAttribute('aria-hidden','true');
  document.body.append(overlay);overlay.addEventListener('click',()=>sidebar.classList.remove('open'));
  const observer=new MutationObserver(()=>document.body.classList.toggle('menu-open',sidebar.classList.contains('open')));
  observer.observe(sidebar,{attributes:true,attributeFilter:['class']});

  // Deep links and the browser's back/forward hash navigation must show the
  // requested tool, not just change the address bar.
  window.addEventListener('hashchange',()=>{
    const requested=location.hash.slice(1);
    const safe=buttons.has(requested)?requested:'overview';
    window.go(safe);
  });
  if(!buttons.has(location.hash.slice(1)))openView('overview');
})();
