/* FFG Advisor 0.8 — shared advisor workspace, inspired by a compact client
 * dashboard, with distinct FFG styling and the original calculation engines. */
(function(){
 'use strict';
 const views={
  dps:{result:'dpsResult',keep:['dpsCompany','dpsOwn','dpsEmployer','dpsYears','dpsReturn']},
  dip:{result:'dipResult',keep:['dipProvider','dipAssetModel','dipInitial','dipMonthly','dipYears','dipReturn']},
  investment:{result:'investmentResult',keep:['invProvider','invProductModel','invFundSelect','invInitial','invMonthly','invYears','invReturn']},
  savings:{result:'savingsResult',keep:['savingBank','savingProduct','savingProductInfo','savInitial','savMonthly','savMonths']},
  mortgage:{result:'mortgageResult',keep:['mortInstitution','mortBank','mortProductInfo','mortAmount','mortValue','mortRate','mortYears']},
  protection:{result:'protectionResult',keep:['insurerSelect','insProductType','proDebt','proGap','proMonths','proReserve']},
  comparison:{result:'comparisonResult',keep:['cmpMonthly','cmpYears','cmpInitial','cmpNameA','cmpReturnA','cmpNameB','cmpReturnB']}
 };
 const fmt=new Intl.NumberFormat('cs-CZ',{style:'currency',currency:'CZK',maximumFractionDigits:0});
 const fmtNum=n=>fmt.format(Number.isFinite(n)?n:0);
 const tabs=new Map();
 const colors=['#d9b16e','#5ea99d','#8baedb','#c28e7e','#b3a3dd'];
 const getValue=el=>Number((el?.textContent||'').replace(/[^\d,−-]/g,'').replace('−','-').replace(',','.'));
 const text=(tag,cls,value)=>{const el=document.createElement(tag);el.className=cls;el.textContent=value;return el};
 const clean=t=>(t||'').replace(/\s+/g,' ').trim();

 // Details are an escape hatch for complex professional scenarios; the most
 // common client inputs stay visible and live calculations continue unchanged.
 function simplifyForm(view,key){
  const grid=view.querySelector('.calc-layout>.card:first-child .form-grid');
  if(!grid||grid.querySelector('.ffg-v08-advanced'))return;
  const important=new Set(views[key].keep),fields=[...grid.children].filter(el=>el.classList.contains('form-field'));
  const advanced=fields.filter(field=>{
   const controls=[...field.querySelectorAll('input[id],select[id],textarea[id]')];
   return controls.length&&!controls.some(control=>important.has(control.id));
  });
  if(!advanced.length)return;
  const details=document.createElement('details');details.className='ffg-v08-advanced';
  const summary=document.createElement('summary');summary.textContent='Pokročilé parametry';
  const badge=text('span','ffg-v08-advanced-count',String(advanced.length)+' dalších nastavení');summary.append(badge);
  const body=document.createElement('div');body.className='ffg-v08-advanced-grid';
  advanced.forEach(el=>body.append(el));details.append(summary,body);grid.append(details);
  const hint=text('p','ffg-v08-input-hint','Změny se promítají do výsledků a grafu okamžitě.');
  grid.parentElement.insertBefore(hint,grid.nextSibling);
 }

 function buildSummary(result,view){
  const cards=view.querySelector('.ffg-v08-summary');if(!cards)return;
  cards.replaceChildren();
  const hero=result.querySelector('.result-hero');
  const nodes=[];
  if(hero)nodes.push({label:clean(hero.querySelector('.result-label')?.textContent)||'Hlavní výsledek',value:clean(hero.querySelector('.result-number')?.textContent)});
  const metrics=[...result.querySelectorAll('.result-tile')].map(el=>({label:clean(el.querySelector('span')?.textContent),value:clean(el.querySelector('strong')?.textContent)}));
  const wanted=metrics.filter(m=>/vloženo|vklady|úrok|zhodnocení|poplat|náklad|státní|zaměstnav|splat|LTV|výnos|hodnota v dnešních|daň/i.test(m.label));
  nodes.push(...wanted.slice(0,4));
  if(nodes.length<5)nodes.push(...metrics.filter(m=>!wanted.includes(m)).slice(0,5-nodes.length));
  for(const [i,item] of nodes.slice(0,5).entries()){
   const card=document.createElement('div');card.className='ffg-v08-summary-card'+(i===0?' primary':'');
   card.append(text('span','ffg-v08-metric-label',item.label),text('strong','ffg-v08-metric-value',item.value));
   cards.append(card);
  }
 }

 function seriesTable(item){
  const container=document.createElement('div');container.className='ffg-v08-table-view';container.hidden=true;
  const table=document.createElement('table');table.className='ffg-v08-series-table';
  const thead=document.createElement('thead');const head=document.createElement('tr');
  head.append(text('th','','Období'));
  for(const s of item.named.filter(s=>item.selected.has(s.name)))head.append(text('th','',s.name));
  thead.append(head);table.append(thead);
  const body=document.createElement('tbody');
  for(let i=0;i<item.length;i++){
   const row=document.createElement('tr');row.append(text('td','',item.ticks[i]));
   for(const s of item.named.filter(s=>item.selected.has(s.name)))row.append(text('td','',fmtNum(s.values[Math.min(i,s.values.length-1)]??0)));
   body.append(row);
  }
  table.append(body);container.append(table);return container;
 }

 function getMetricValue(result,labels){
  const tiles=[...result.querySelectorAll('.result-tile')];
  const tile=tiles.find(t=>labels.some(label=>clean(t.querySelector('span')?.textContent).toLowerCase()===label.toLowerCase()));
  const val=tile?getValue(tile.querySelector('strong')):NaN;
  return Number.isFinite(val)?val:null;
 }
 function donutSegments(result,key){
  const value=(...labels)=>getMetricValue(result,labels);
  const deposit=value('Celkem vloženo','Celkem investováno','Vlastní vložené prostředky');
  const profit=value('Čistý úrok','Zisk / ztráta po nákladech','Modelový výsledek');
  if(['savings','investment','dip'].includes(key)&&deposit!==null&&profit!==null&&profit>=0)
    return [{label:'Vložené prostředky',amount:deposit},{label:'Zhodnocení',amount:profit}];
  if(key==='dps'){
   const own=value('Vlastní vklady'),employer=value('Zaměstnavatel'),state=value('Státní příspěvky'),gain=value('Zhodnocení po nákladech');
   const initial=Number(document.getElementById('dpsInitial')?.value||0);
   if([own,employer,state,gain].every(n=>n!==null&&n>=0))return[
    {label:'Vlastní nové vklady',amount:own},
    {label:'Počáteční zůstatek',amount:Math.max(0,initial)},
    {label:'Zaměstnavatel',amount:employer},{label:'Státní podpora',amount:state},{label:'Zhodnocení',amount:gain}];
  }
  if(key==='mortgage'){
   const interest=value('Celkové úroky v modelu');const principal=Number(document.getElementById('mortAmount')?.value||0);
   if(interest!==null&&interest>=0)return[{label:'Splacená jistina',amount:principal},{label:'Zaplacené úroky',amount:interest}];
  }
  return [];
 }
 function renderDonut(result,key){
  const segments=donutSegments(result,key).filter(s=>s.amount>0);
  const total=segments.reduce((a,b)=>a+b.amount,0);
  if(!total||segments.length<2)return null;
  const holder=document.createElement('div');holder.className='ffg-v08-breakdown';
  const header=document.createElement('div');header.append(text('h4','','Složení výsledné částky'),text('p','','Přehled, odkud výsledná hodnota pochází.'));
  holder.append(header);
  const layout=document.createElement('div');layout.className='ffg-v08-breakdown-layout';
  const ring=document.createElement('div');ring.className='ffg-v08-donut';
  let position=0;const stops=[];
  segments.forEach((s,i)=>{const end=position+s.amount/total*100;stops.push(colors[i]+' '+position.toFixed(3)+'% '+end.toFixed(3)+'%');position=end});
  ring.style.background='conic-gradient('+stops.join(',')+')';
  const center=document.createElement('div');center.className='ffg-v08-donut-core';center.append(text('span','','Celkem'),text('strong','',fmtNum(total)));ring.append(center);
  const list=document.createElement('div');list.className='ffg-v08-breakdown-list';
  segments.forEach((s,i)=>{
   const row=document.createElement('div');row.className='ffg-v08-breakdown-row';
   const dot=text('i','','');dot.style.background=colors[i];
   const name=text('span','',s.label),amount=text('b','',fmtNum(s.amount));row.append(dot,name,amount);list.append(row);
  });layout.append(ring,list);holder.append(layout);return holder;
 }

 function mountVisualization(result,key){
  const box=result.querySelector('.chart-box'),chart=box?.querySelector('.ffg-chart');
  if(!chart||box.querySelector('.ffg-v08-viz-toggle'))return;
  const model=window.FFGChartData?.get(chart.dataset.chartId);if(!model)return;
  const bar=document.createElement('div');bar.className='ffg-v08-viz-toggle';bar.setAttribute('role','group');bar.setAttribute('aria-label','Způsob zobrazení vývoje');
  const button=(name,mode)=>{const b=text('button','ffg-v08-viz-button',name);b.type='button';b.dataset.viz=mode;b.addEventListener('click',()=>{tabs.set(key,mode);updateMode()});return b};
  const graph=button('◫ Graf','chart'),tableButton=button('☷ Tabulka','table');bar.append(graph,tableButton);
  const table=seriesTable(model);const chartWrap=document.createElement('div');chartWrap.className='ffg-v08-chart-wrap';chart.parentElement.insertBefore(chartWrap,chart);chartWrap.append(chart);
  box.insertBefore(bar,chartWrap);box.insertBefore(table,chartWrap.nextSibling);
  const pie=renderDonut(result,key);if(pie)box.append(pie);
  function updateMode(){const isTable=tabs.get(key)==='table';graph.classList.toggle('active',!isTable);tableButton.classList.toggle('active',isTable);graph.setAttribute('aria-pressed',String(!isTable));tableButton.setAttribute('aria-pressed',String(isTable));chartWrap.hidden=isTable;table.hidden=!isTable;
   if(isTable){const replacement=seriesTable(model);table.replaceChildren(...replacement.childNodes)}}
  updateMode();
  bar.addEventListener('click',()=>{});
  // Clicking an existing legend updates both the chart and the table model.
  chart.addEventListener('click',event=>{if(event.target.closest('[data-series-toggle]'))queueMicrotask(()=>{if(tabs.get(key)==='table')updateMode()})});
 }

 function moveDetails(result){
  if(result.querySelector('.ffg-v08-result-details'))return;
  const chart=result.querySelector('.chart-box');if(!chart)return;
  const info=[...result.children].filter(el=>el.matches('.result-hero,.result-grid,.kpi-grid,.bars'));
  if(!info.length)return;
  const details=document.createElement('details');details.className='ffg-v08-result-details';
  details.append(text('summary','','Detailní rozpis a předpoklady'));
  const body=document.createElement('div');body.className='ffg-v08-result-detail-body';info.forEach(el=>body.append(el));details.append(body);
  chart.insertAdjacentElement('afterend',details);
 }

 function attach(view,key){
  const result=document.getElementById(views[key].result);if(!result)return;
  const summary=document.createElement('div');summary.className='ffg-v08-summary';summary.setAttribute('aria-label','Nejdůležitější výsledky');
  const layout=view.querySelector('.calc-layout');layout?.insertAdjacentElement('beforebegin',summary);
  simplifyForm(view,key);
  let pending=false;
  const refresh=()=>{if(!result.querySelector('.result-hero')&&!result.querySelector('.ffg-v08-result-details'))return;
   buildSummary(result,view);mountVisualization(result,key);moveDetails(result);
  };
  const observer=new MutationObserver(()=>{if(pending)return;pending=true;queueMicrotask(()=>{pending=false;refresh()})});
  observer.observe(result,{childList:true});refresh();
 }

 for(const [key] of Object.entries(views)){
  const view=document.getElementById('view-'+key);if(view)attach(view,key);
 }

 // One verified date is the source of truth; the monthly updater only has to
 // change the catalogue when it has actually checked primary evidence.
 const catalogue=window.FFGRateCatalog;
 if(catalogue){
  const date=catalogue.verified;
  const savings=document.querySelector('#view-savings .page-head .pill');if(savings)savings.textContent='Bankovní sazby ověřené '+date;
  const market=document.querySelector('#view-market .page-head .pill');if(market)market.textContent='Spořicí sazby · '+date;
  const snapshot=document.querySelector('.data-snapshot');if(snapshot)snapshot.textContent='Spořicí sazby: poslední doložené ověření '+date+'. Hypotéky a fondy mají vlastní datum. Sazby se mohou měnit i během měsíce; při práci s klientem ověř aktuální podmínky.';
  const footer=document.querySelector('.workspace-disclaimer');if(footer)footer.textContent=footer.textContent.replace(/\d{1,2}\.\s*\d{1,2}\.\s*20\d{2}/g,date);
 }
})();
