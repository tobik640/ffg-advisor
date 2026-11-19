/* FFG Advisor 0.9 — editorial review of every visible calculator control.
 * The calculators remain the source of numerical truth; this layer only
 * organizes their results and removes misleading or duplicate interactions. */
(function(){
 'use strict';
 const $=id=>document.getElementById(id);
 const fmt=new Intl.NumberFormat('cs-CZ',{style:'currency',currency:'CZK',maximumFractionDigits:0});
 const configurations={
  dps:{result:'dpsResult',title:'Orientační hodnota DPS',fields:['Vlastní vklady','Státní příspěvky']},
  dip:{result:'dipResult',title:'Orientační hodnota DIP',fields:['Celkem vloženo','Modelový výsledek']},
  investment:{result:'investmentResult',title:'Hodnota investice v modelu',fields:['Celkem investováno','Zisk / ztráta po nákladech']},
  savings:{result:'savingsResult',title:'Zůstatek po zdanění úroků',fields:['Celkem vloženo','Čistý úrok']},
  mortgage:{result:'mortgageResult',title:'První měsíční platba',fields:['Celkové úroky v modelu','LTV']},
  protection:{result:'protectionResult',title:'Nezajištěná potřeba',fields:['Příjmová mezera měsíčně','Celková potřeba']},
  comparison:{result:'comparisonResult',title:'Rozdíl mezi variantami',fields:[]}
 };
 const sourceContext={
  dps:'Scénář výnosu není výkonnost konkrétního fondu. Výběr společnosti mění jen označení, ne modelový výnos.',
  dip:'Poskytovatel určuje nabídku dostupných investic, ale výnos je zde ručně zvolený scénář, ne jeho slib.',
  investment:'Výnos není sazba od investiční společnosti. Náklady a riziko ověř podle konkrétního produktu.',
  savings:'U vybraného produktu se použijí zadaná úroková pásma. Bonus může vyžadovat splnění podmínek.',
  mortgage:'Sazby bank jsou pouze veřejné příklady „od“. Skutečná nabídka závisí na klientovi, LTV a fixaci.',
  protection:'Výsledek je finanční potřeba, ne cena pojištění ani doporučení konkrétní pojišťovny.',
  comparison:'Vyšší konečná hodnota při zvoleném výnosu neznamená vhodnější nebo bezpečnější investici.'
 };

 function create(tag,cls,value){const n=document.createElement(tag);if(cls)n.className=cls;if(value!==undefined)n.textContent=value;return n}
 function clean(s){return String(s??'').replace(/\s+/g,' ').trim()}
 function metric(result,title){
  const tile=[...result.querySelectorAll('.result-tile')].find(el=>clean(el.querySelector('span')?.textContent)===title);
  return clean(tile?.querySelector('strong')?.textContent);
 }
 function summaryData(key,result){
  const config=configurations[key],hero=clean(result.querySelector('.result-number')?.textContent);
  if(!hero)return [];
  const rows=[{label:config.title,value:hero}];
  if(key==='comparison'){
   const tiles=[...result.querySelectorAll('.result-tile')].filter(el=>el.querySelector('span')?.textContent.includes('konečná hodnota'));
   for(const el of tiles.slice(0,2))rows.push({label:clean(el.querySelector('span')?.textContent),value:clean(el.querySelector('strong')?.textContent)});
  }else for(const label of config.fields)rows.push({label,value:metric(result,label)});
  return rows.filter(row=>row.value).slice(0,3);
 }
 function renderSummary(key){
  const result=$(configurations[key].result),summary=$('view-'+key)?.querySelector('.ffg-v08-summary');
  if(!result||!summary)return;
  const data=summaryData(key,result);
  const signature=JSON.stringify(data);
  if(summary.dataset.ffgV09===signature && summary.querySelectorAll('.ffg-v09-summary-card').length===data.length)return;
  summary.dataset.ffgV09=signature;
  summary.replaceChildren(...data.map((item,i)=>{
   const card=create('div','ffg-v09-summary-card'+(i===0?' primary':''));
   card.append(create('span','ffg-v09-metric-label',item.label),create('strong','ffg-v09-metric-value',item.value));
   return card;
  }));
  summary.hidden=!data.length;
 }
 function wrapResultWatcher(key){
  const view=$('view-'+key),result=$(configurations[key].result),summary=view?.querySelector('.ffg-v08-summary');
  if(!result||!summary)return;
  // The previous UI layer regenerates summary cards on every calculation.
  // Only edit if they aren't already the curated three-card version.
  const summaryWatcher=new MutationObserver(()=>renderSummary(key));
  summaryWatcher.observe(summary,{childList:true});
  const resultWatcher=new MutationObserver(()=>{
   if(!result.querySelector('.result-hero') && summary.children.length){
    summary.replaceChildren();summary.dataset.ffgV09='[]';summary.hidden=true;
   }
   if(result.querySelector('.validation')){
    const invalid=view.querySelector('[aria-invalid="true"]');
    const parent=invalid?.closest('.ffg-v08-advanced');
    if(parent)parent.open=true;
   }
  });
  resultWatcher.observe(result,{childList:true});
  renderSummary(key);
 }

 function promoteField(view,id){
  const field=$(id)?.closest('.form-field'),details=view.querySelector('.ffg-v08-advanced');
  if(field&&details&&details.contains(field))details.before(field);
 }
 function editorial(view,key){
  // Surface only parameters whose omission could silently change eligibility
  // or make a manually selected bank rate impossible to inspect.
  const essential={
   savings:['savRate'],
   dps:['dpsFee','dpsAge'],
   dip:['dipEmployer','dipFee','dipAge'],
   investment:['invFee'],
   mortgage:['mortFixYears','mortRateAfter'],
   protection:['proOtherIncome','proExisting'],
   comparison:['cmpFeeA','cmpFeeB']
  };
  for(const id of essential[key]||[])promoteField(view,id);
  const advanced=view.querySelector('.ffg-v08-advanced'),count=advanced?.querySelector('.ffg-v08-advanced-count');
  const hidden=advanced?.querySelectorAll('.ffg-v08-advanced-grid>.form-field').length||0;
  if(count)count.textContent=hidden+' dalších nastavení';
  if(advanced&&!hidden)advanced.remove();
  const panel=view.querySelector('.calc-layout>.card:first-child');
  const header=panel?.querySelector('h3');
  if(header){
   const explanation=create('p','ffg-v09-context',sourceContext[key]);
   header.insertAdjacentElement('afterend',explanation);
  }
  // Live recalculation is already bound to every field in advisor-v05.js;
  // the manual "calculate" actions duplicated that same result.
  view.querySelectorAll('.calc-layout button[onclick^="calculate"]').forEach(btn=>btn.remove());
  view.querySelectorAll('.form-field').forEach(field=>{
   const label=field.querySelector('label'),control=field.querySelector('input[id],select[id],textarea[id]');
   if(label&&control&&!label.htmlFor)label.htmlFor=control.id;
  });
 }

 function makeDownload(key,model){
  const button=create('button','btn secondary ffg-v09-export','Stáhnout tabulku CSV');button.type='button';
  button.setAttribute('aria-label','Stáhnout právě vybrané řady grafu jako CSV');
  button.addEventListener('click',()=>{
   const columns=model.named.filter(s=>model.selected.has(s.name));
   // A quoted cell alone does not prevent spreadsheet formula execution.
   const q=value=>{
    const raw=String(value??'');
    const safe=typeof value==='string'&&/^[\s\u0000-\u001f]*[=+@-]/.test(raw)?"'"+raw:raw;
    return '"'+safe.replace(/"/g,'""')+'"';
   };
   const content=[['Období',...columns.map(s=>s.name)].map(q).join(';')];
   for(let i=0;i<model.length;i++)content.push([model.ticks[i],...columns.map(s=>s.values[Math.min(i,s.values.length-1)]??0)].map(q).join(';'));
   const url=URL.createObjectURL(new Blob(['\uFEFF'+content.join('\r\n')],{type:'text/csv;charset=utf-8'}));
   const a=document.createElement('a');a.href=url;a.download='ffg-'+key+'-model.csv';document.body.append(a);a.click();a.remove();
   setTimeout(()=>URL.revokeObjectURL(url),1500);
  });
  return button;
 }

 function improveCharts(key){
  const result=$(configurations[key].result);if(!result)return;
  const box=result.querySelector('.chart-box'),chart=box?.querySelector('.ffg-chart');
  if(!chart||box.querySelector('.ffg-v09-chart-controls'))return;
  const model=window.FFGChartData?.get(chart.dataset.chartId);if(!model)return;
  const original=chart.querySelector('.ffg-chart-legend');
  const toolbar=create('div','ffg-v09-chart-controls');
  const seriesBar=create('div','ffg-v09-table-series');seriesBar.hidden=true;
  seriesBar.append(create('span','ffg-v09-selector-title','Zobrazit v tabulce:'));
  const controls=[];
  for(const s of model.named){
   const b=create('button','ffg-v09-series-button',s.name);b.type='button';
   b.dataset.series=s.name;const dot=create('i','');dot.style.background=s.color;b.prepend(dot);
   b.addEventListener('click',()=>{
    const target=[...original.querySelectorAll('[data-series-toggle]')].find(item=>item.dataset.seriesToggle===s.name);
    target?.click();sync();
   });
   controls.push(b);seriesBar.append(b);
  }
  toolbar.append(seriesBar,makeDownload(key,model));
  box.querySelector('.ffg-v08-viz-toggle')?.insertAdjacentElement('afterend',toolbar);
  const toggle=box.querySelector('.ffg-v08-viz-toggle');
  function sync(){
   const tableMode=toggle?.querySelector('[data-viz="table"]')?.classList.contains('active');
   seriesBar.hidden=!tableMode;
   controls.forEach(b=>{const selected=model.selected.has(b.dataset.series);b.classList.toggle('active',selected);b.setAttribute('aria-pressed',String(selected))});
  }
  toggle?.addEventListener('click',()=>queueMicrotask(sync));
  chart.addEventListener('click',()=>queueMicrotask(sync));
  sync();
 }

 // Recalculated charts are replaced, never mutated in place.
 for(const [key] of Object.entries(configurations)){
  const view=$('view-'+key);if(!view)continue;
  view.querySelector('.calc-context')?.remove();
  editorial(view,key);
  wrapResultWatcher(key);
  const result=$(configurations[key].result);
  const watch=new MutationObserver(()=>improveCharts(key));
  watch.observe(result,{childList:true});
  improveCharts(key);
 }

 // Four generic DPS facts repeated the explanatory result and crowded the
 // first screen. The relevant state support is already calculated below.
 $('view-dps')?.querySelector('.grid.stats')?.remove();
 // DIP details were an oversized wall of copy above the calculation.
 const dip=$('view-dip');const longNote=dip?.querySelector(':scope > .notice.blue');
 if(longNote){const block=create('details','ffg-v09-rules');block.append(create('summary','','Podmínky DIP a daňová podpora'));longNote.before(block);block.append(longNote);}
 const providerList=dip?.querySelector('#dipProviderCards')?.closest('.card.panel');
 if(providerList){const fold=create('details','ffg-v09-providers');fold.append(create('summary','','Seznam poskytovatelů a odkazy k ověření'));providerList.before(fold);fold.append(providerList);}

 // The insurance model is an income-gap calculation. Don't imply that it
 // prices unrelated property, liability, or accident policies.
 const risk=$('insProductType'),debt=$('proDebt')?.closest('.form-field');
 const riskHint=create('p','ffg-v09-risk-note');risk?.closest('.form-field')?.append(riskHint);
 function updateRisk(){
  const pn=risk?.value.includes('Pracovní neschopnost');
  if(debt)debt.classList.toggle('hidden',!!pn);
  riskHint.textContent=pn?'Pro pracovní neschopnost se počítá měsíční potřeba. Celý dluh se jednorázově nepřičítá.':
   'Pro smrt a invaliditu lze započíst jednorázové splacení závazků i pravidelnou potřebu domácnosti.';
 }
 risk?.addEventListener('change',updateRisk);updateRisk();

 const side=$('sidebar')?.querySelector('.side-foot');if(side)side.textContent='FFG · FINANČNÍ NÁSTROJE · V0.9';
 document.title='FFG Advisor · poradenské studio v0.9';
 const foot=document.querySelector('.content > .footer-note');
 if(foot)foot.textContent=foot.textContent.replace('v0.8','v0.9');
})();
