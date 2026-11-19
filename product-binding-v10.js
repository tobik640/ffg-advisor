/* FFG Advisor v1.0 — dependent provider / instrument / assumption controls.
 * A bank deposit's published interest is a rate. Investment portfolios have
 * NO provider-wide interest rate. The defaults below are explicitly labelled
 * illustrative asset-class return/cost scenarios, never live offers or tariffs.
 */
(function(){
 'use strict';
 const $=id=>document.getElementById(id);
 const fmt=n=>new Intl.NumberFormat('cs-CZ',{maximumFractionDigits:2}).format(n)+' %';
 const option=(value,label)=>{const o=document.createElement('option');o.value=value;o.textContent=label;return o;};
 const mk=(tag,cls,txt)=>{const el=document.createElement(tag);if(cls)el.className=cls;if(txt)el.textContent=txt;return el;};
 const riskProfiles={
  conservative:{gross:2.5,fee:.4,entry:0,label:'konzervativní'},
  balanced:{gross:4.5,fee:1,entry:0,label:'vyvážený'},
  dynamic:{gross:6.5,fee:1,entry:0,label:'dynamický'}
 };
 const pensionNames={
  'Allianz penzijní společnost':{
   names:['Allianz účastnický povinný konzervativní fond','Allianz vyvážený účastnický fond','Allianz dynamický účastnický fond'],
   source:'https://www.allianz.cz/content/dam/onemarketing/cee/azcz/dokumenty-a-formulare/penze/2026/Smluvni_dokumentace_Penze_02_26.pdf',verified:true,defaultRisk:'balanced'},
  'ČSOB Penzijní společnost':{
   names:['ČSOB konzervativní účastnický fond','ČSOB vyvážený účastnický fond','ČSOB dynamický účastnický fond'],
   source:'https://www.csob-penze.cz/dokumenty/klicove-informace-a-statuty-fondu/',verified:true,defaultRisk:'conservative'},
  'NN Penzijní společnost':{
   names:['NN povinný konzervativní fond','NN vyvážený fond','NN růstový fond'],
   source:'https://www.nn.cz/penze/ucastnicke-fondy/',verified:true,defaultRisk:'dynamic'},
  'Conseq penzijní společnost':{defaultRisk:'dynamic'},
  'Česká spořitelna – penzijní společnost':{defaultRisk:'balanced'},
  'Generali penzijní společnost':{defaultRisk:'dynamic'},
  'KB Penzijní společnost':{defaultRisk:'conservative'},
  'Rentea penzijní společnost':{defaultRisk:'dynamic'},
  'UNIQA penzijní společnost':{defaultRisk:'balanced'}
 };
 const values=(kind,gross,fee,entry)=>{
  const ids=kind==='dps'?['dpsReturn','dpsFee']:kind==='dip'?['dipReturn','dipFee','dipEntry']:['invReturn','invFee','invEntryFee'];
  [gross,fee,entry].forEach((v,i)=>{if(ids[i]&&Number.isFinite(v))$(ids[i]).value=String(v);});
  if(kind==='dps')window.calculateDps();
  if(kind==='dip')window.calculateDip();
  if(kind==='investment')window.calculateInvestment();
  window.syncFfgSliders?.();
 };
 const updateContext=(kind,lead,detail,url)=>{
  const wrapper=$('ffg-v10-'+kind+'-context');if(!wrapper)return;
  wrapper.replaceChildren();
  const title=mk('strong','',lead),note=mk('span','',detail);
  wrapper.append(title,note);
  if(url){const a=mk('a','','Ověřit dokument produktu ↗');a.href=url;a.rel='noopener noreferrer';a.target='_blank';wrapper.append(a);}
 };
 const context=(kind,after)=>{
  const field=mk('div','ffg-v10-product-context');field.id='ffg-v10-'+kind+'-context';field.setAttribute('role','status');
  after.insertAdjacentElement('afterend',field);return field;
 };
 const dpsCompany=$('dpsCompany');
 if(dpsCompany){
  const field=mk('div','form-field full ffg-v10-fund-field');
  const label=mk('label','','Fond / výchozí strategie');label.htmlFor='dpsFundChoice';
  const picker=mk('select');picker.id='dpsFundChoice';
  field.append(label,picker);
  dpsCompany.closest('.form-field').insertAdjacentElement('afterend',field);
  context('dps',field);
  // The previously hidden generic return preset has been superseded by an
  // explicitly named product / risk selection. Retain its ID for legacy code.
  const old=$('dpsStrategy')?.closest('.form-field');if(old)old.hidden=true;
  function renderPensionCompany(){
   const info=pensionNames[dpsCompany.value]||{defaultRisk:'balanced'};
   const names=info.names||[];
   picker.replaceChildren(...['conservative','balanced','dynamic'].map((risk,i)=>option(risk,names[i]||'Ilustrační '+riskProfiles[risk].label+' strategie (konkrétní fond ověřit)')),
    option('manual','Vlastní sazba a náklady'));
   picker.value=info.defaultRisk||'balanced';
   applyPensionFund();
  }
  function applyPensionFund(){
   const info=pensionNames[dpsCompany.value]||{};
   if(picker.value==='manual'){
    updateContext('dps','Ruční předpoklady','Zadáváš vlastní výnos a náklady; tato společnost sama o sobě žádnou sazbu negarantuje.',info.source);return;
   }
   const data=riskProfiles[picker.value];if(!data)return;
   $('dpsStrategy').value='custom';
   values('dps',data.gross,data.fee);
   updateContext('dps','Model fondu: '+fmt(data.gross)+' hrubě · '+fmt(data.fee)+' náklady',
    (info.verified?'Název fondu je z oficiální nabídky. ':'Název strategie je ilustrativní, konkrétní fond není ověřen. ')+
    'Výnos je pracovní scénář dle rizika, NE úrok nebo předpověď fondu. Náklad je model (u Allianz použito maximum správy z dokumentu); možná odměna ze zhodnocení v tomto zjednodušeném modelu není zahrnuta.',info.source);
  }
  dpsCompany.addEventListener('change',renderPensionCompany);
  picker.addEventListener('change',applyPensionFund);
  ['dpsReturn','dpsFee'].forEach(id=>$(id)?.addEventListener('input',()=>{
   picker.value='manual';updateContext('dps','Ruční úprava výnosu / nákladů','Hodnoty teď řídíš ručně. Změna společnosti nebo fondu je znovu předvyplní.');
  }));
  renderPensionCompany();
 }

 // These are portfolio TEMPLATES, never claims that the institution sells a
 // product with this exact yield, platform fee or initial charge.
 const dipModels={
  cash:{gross:2.5,fee:.4,entry:0},
  balanced:{gross:5,fee:1.1,entry:1},
  index:{gross:7,fee:.45,entry:0},
  fund:{gross:6.5,fee:1.7,entry:2}
 };
 const dipPreferred={
  'Fio banka':'cash','Patria Finance':'index','Česká spořitelna':'balanced',
  'ČSOB':'balanced','Komerční banka':'fund','Raiffeisenbank':'balanced',
  'Conseq':'fund','Amundi':'fund','Portu':'index','Generali Investments':'fund',
  'J&T Investiční společnost':'fund','Jiný oprávněný poskytovatel':'custom'
 };
 const dipProvider=$('dipProvider'),dipPicker=$('dipAssetModel');
 if(dipProvider&&dipPicker){
  context('dip',dipPicker.closest('.form-field'));
  function applyDip(){
   const key=dipPicker.value,m=dipModels[key];
   if(!m){updateContext('dip','Vlastní zadání','Bez konkrétního fondu, KID a sazebníku nelze automaticky převzít jeho skutečný výnos ani náklady.');return;}
   values('dip',m.gross,m.fee,m.entry);
   updateContext('dip','Předvyplněný model: '+fmt(m.gross)+' hrubě · '+fmt(m.fee)+' průběžně · '+fmt(m.entry)+' vstupně',
    'Poskytovatel: '+dipProvider.value+'. Zvolený typ portfolia určuje ILUSTRAČNÍ výnos a poplatkové předpoklady; nejde o skutečnou sazbu ani ověřenou nabídku této instituce. Údaje lze upravit.');
  }
  dipProvider.addEventListener('change',()=>{
   dipPicker.value=dipPreferred[dipProvider.value]||'custom';applyDip();
  });
  // This fires after the legacy preset listener, deliberately replacing its
  // generic values with the matching provider-neutral illustrated portfolio.
  dipPicker.addEventListener('change',applyDip);
  ['dipReturn','dipFee','dipEntry'].forEach(id=>$(id)?.addEventListener('input',()=>{
   dipPicker.value='custom';updateContext('dip','Vlastní upravené parametry','Přednastavený scénář je vypnutý; hodnoty se řídí tvojí úpravou.');
  }));
  dipPicker.value=dipPreferred[dipProvider.value]||'custom';applyDip();
 }

 const invModels={
  etf:{gross:7,fee:.35,entry:0},
  balanced:{gross:5,fee:1.1,entry:1},
  active:{gross:7,fee:1.9,entry:3},
  conservative:{gross:3,fee:.65,entry:0},
  realestate:{gross:5,fee:1.5,entry:1.5}
 };
 const invPreferred={
  'Amundi':'balanced','Conseq':'conservative','ČSOB Asset Management':'balanced',
  'Erste Asset Management':'active','Generali Investments':'conservative','INVESTIKA':'realestate',
  'J&T Investiční společnost':'balanced','Raiffeisen investiční společnost':'balanced',
  'Fidelity International':'active','BlackRock / iShares':'etf','Vlastní / jiný poskytovatel':'custom'
 };
 // Existence of a published fund is distinct from the hypothetical forecast.
 const invFundKind={0:'balanced',1:'balanced',2:'conservative',3:'conservative',4:'realestate',5:'balanced',6:'conservative'};
 const invProvider=$('invProvider'),invPicker=$('invProductModel'),fundPicker=$('invFundSelect');
 if(invProvider&&invPicker&&fundPicker){
  // Two independent return-preset dropdowns and the old one-year-performance
  // transfer button caused contradictory scenarios. Keep a single model flow.
  const scenarioField=$('invScenario')?.closest('.form-field');if(scenarioField)scenarioField.hidden=true;
  fundPicker.closest('.form-field').querySelector('button[onclick="applyFundPerformance()"]')?.remove();
  const productLabel=invPicker.closest('.form-field')?.querySelector('label');
  if(productLabel)productLabel.textContent='Typ portfolia / ilustrační model';
  context('investment',fundPicker.closest('.form-field'));
  function fundIds(provider){return typeof FUNDS==='undefined'?[]:FUNDS.map((f,i)=>f.company===provider?i:null).filter(i=>i!==null);}
  function updateFundOptions(){
   const ids=fundIds(invProvider.value);
   fundPicker.replaceChildren(option('','Bez konkrétního fondu · ilustrační portfolio'),...ids.map(i=>option(String(i),FUNDS[i].name)));
   fundPicker.value=ids.length?String(ids[0]):'';
   if(!ids.length)$('invFundMeta').textContent='Pro vybranou společnost nemáme doložená aktuální data konkrétního fondu. Použitý model není její nabídkou.';
  }
  function applyInvestment(){
   const idx=fundPicker.value,known=idx!==''&&typeof FUNDS!=='undefined'?FUNDS[Number(idx)]:null;
   const kind=known?invFundKind[Number(idx)]:(invPicker.value==='custom'?'custom':invPicker.value);
   const model=invModels[kind];
   if(!model){updateContext('investment','Vlastní scénář','Zvol typ modelu nebo konkrétní fond. Výnos a náklady teď určuje ruční zadání.');return;}
   // Do not auto-import a one-year performance, and NEVER treat bond YTM as
   // an investment return forecast.
   values('investment',model.gross,model.fee,model.entry);
   $('invScenario').value='custom';
   const meta=known?'Vybraný fond: '+known.name+'. '+known.period+': '+known.value+' (k '+known.date+'). Historická hodnota se do výpočtu NEPŘENÁŠÍ.':
      'Vybrán ilustrační typ investice; není to ceník společnosti ani doložený konkrétní produkt.';
   updateContext('investment','Pracovní předpoklady: '+fmt(model.gross)+' hrubě · '+fmt(model.fee)+' průběžně · '+fmt(model.entry)+' vstupně',
    meta+' Model výnosu vychází z třídy aktiva, nikoli ze jména poskytovatele. Ověř KID, skutečné náklady i dostupnost.',known?.url);
  }
  invProvider.addEventListener('change',()=>{
   updateFundOptions();
   const fund=fundPicker.value!=='';
   invPicker.value=fund?'custom':(invPreferred[invProvider.value]||'custom');
   applyInvestment();
  });
  invPicker.addEventListener('change',()=>{
   fundPicker.value='';applyInvestment();
  });
  fundPicker.addEventListener('change',()=>{
   if(fundPicker.value!=='')invPicker.value='custom';
   applyInvestment();
  });
  ['invReturn','invFee','invEntryFee'].forEach(id=>$(id)?.addEventListener('input',()=>{
   invPicker.value='custom';fundPicker.value='';
   updateContext('investment','Ruční výnos a náklady','Upravený výnos je individuální scénář poradce; změna společnosti nebo modelu automaticky vyplní výchozí předpoklady.');
  }));
  updateFundOptions();invPicker.value=fundPicker.value!==''?'custom':invPreferred[invProvider.value]||'custom';applyInvestment();
 }

 // Avoid the previous false impression that a provider switch is a no-op.
 const texts={
  dps:'Vyber společnost a fond. Výnos a náklady se ihned předvyplní jako model podle rizika, nikoliv garantovaná sazba fondu.',
  dip:'Změna poskytovatele předvybere typ portfolia a přepočítá ilustrační výnos i náklady. Skutečný produkt ověř v KID.',
  investment:'Změna společnosti vybere dostupný fond z katalogu, nebo ilustrační typ investice, a okamžitě přepočítá model.'
 };
 Object.entries(texts).forEach(([key,value])=>{const p=$('view-'+key)?.querySelector('.ffg-v09-context');if(p)p.textContent=value;});
 const side=$('sidebar')?.querySelector('.side-foot');if(side)side.textContent='FFG · FINANČNÍ NÁSTROJE · V1.0';
 document.title='FFG Advisor · poradenské studio v1.0';
})();
