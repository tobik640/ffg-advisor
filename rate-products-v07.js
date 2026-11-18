/* FFG Advisor v0.7 — dated, source-linked product catalogue.
   A public bank page is NOT a live tariff API. The last known public rate is
   deliberately identified as a snapshot and never represented as guaranteed. */
(function(){
 'use strict';
 const $=id=>document.getElementById(id);
 const verified='18. 11. 2026';
 const parseDate=date=>{
  const parts=String(date).match(/(\d{1,2})\.\s*(\d{1,2})\.\s*(20\d{2})/);
  return parts?Date.UTC(Number(parts[3]),Number(parts[2])-1,Number(parts[1])):0;
 };
 const products=[
  {id:'creditas-bonus',bankId:'creditas',bank:'Banka CREDITAS',product:'Spořicí účet TOP · bonus 4,60 %',rate:4.60,limit:500000,above:3.30,bands:[{upTo:500000,rate:4.60},{upTo:null,rate:3.30}],condition:'Bonus do 500 000 Kč vyžaduje aktivní používání účtu nebo investice. Bez podmínek nelze bonusovou sazbu automaticky předpokládat.',url:'https://www.creditas.cz/blog/na-sporicim-uctu-top-nove-ziskate-az-46-rocne',source:'Banka CREDITAS · listopad 2026'},
  {id:'trinity-narozeniny',bankId:'trinity',bank:'TRINITY BANK',product:'Narozeninový Skvělý účet · nový vklad',rate:4.28,limit:500000,above:3.30,bands:[{upTo:500000,rate:4.28},{upTo:null,rate:3.30}],condition:'Akční nabídka pro nový vklad s omezeným objemem. Banka uvádí garanci sazby do 31. 3. 2027; pro delší horizont jde jen o scénář.',url:'https://trinitybank.cz/aktuality/zvysujeme-sazbu-4-28-pa-na-500-000-kc',source:'TRINITY BANK · říjen 2026'},
  {id:'mbank-plus',bankId:'mbank',bank:'mBank',product:'mSpořicí účet Plus · bonusová pásma',rate:4.41,limit:250000,above:4.11,bands:[{upTo:250000,rate:4.41},{upTo:500000,rate:4.11},{upTo:3000000,rate:3.51},{upTo:null,rate:3.41}],condition:'Sazby účinné od 16. 11. 2026, minimálně do 31. 1. 2027. První tři kalendářní měsíce bonus bez aktivity; následně příjem alespoň 15 000 Kč a 5 plateb kartou za měsíc.',url:'https://www.mbank.cz/informace-k-produktum/archiv/urokovy-listek/2026-11-16_revize.pdf',source:'mBank · úrokový lístek účinný od 16. 11. 2026'},
  {id:'mbank-basic',bankId:'mbank',bank:'mBank',product:'mSpořicí účet · bez aktivity',rate:3.01,limit:0,above:3.01,bands:[{upTo:null,rate:3.01}],condition:'Účet bez povinných plateb kartou či minimálního měsíčního příjmu. Sazba je proměnlivá.',url:'https://www.mbank.cz/osobni/sporeni/msporici-ucet/',source:'mBank · produktová stránka'},
  {id:'air-regular',bankId:'air',bank:'Air Bank',product:'Spořicí účet · pravidelné spoření',rate:3.50,limit:300000,above:2.00,bands:[{upTo:300000,rate:3.50},{upTo:null,rate:2.00}],condition:'Pro nové účty od 16. 9. 2026 nebo po přepnutí režimu. Požaduje pravidelné spoření, například příchozí vklad alespoň 1 000 Kč měsíčně.',url:'https://www.airbank.cz/file-download/5286-prehled-urokovych-sazeb.pdf',source:'Air Bank · sazebník od 9. 11. 2026'},
  {id:'air-basic',bankId:'air',bank:'Air Bank',product:'Spořicí účet · bez pravidelného spoření',rate:2.00,limit:0,above:2.00,bands:[{upTo:null,rate:2.00}],condition:'Základní varianta úročení nového režimu bez podmínek bonusové sazby.',url:'https://www.airbank.cz/file-download/5286-prehled-urokovych-sazeb.pdf',source:'Air Bank · sazebník od 9. 11. 2026'},
  {id:'air-old',bankId:'air',bank:'Air Bank',product:'Starší účet · bonus za aktivitu',rate:2.60,limit:300000,above:0,bands:[{upTo:300000,rate:2.60},{upTo:null,rate:0}],condition:'Pro účty založené do 15. 9. 2026 bez přepnutí na nové úročení. 5 plateb kartou měsíčně; nad pásmem v modelu 0 %, ověř aktuální tarif.',url:'https://www.airbank.cz/file-download/5286-prehled-urokovych-sazeb.pdf',source:'Air Bank · sazebník od 9. 11. 2026'},
  {id:'fio-konto',bankId:'fio',bank:'Fio banka',product:'Fio konto · bonus do 200 000 Kč',rate:3.50,limit:200000,above:0.10,bands:[{upTo:200000,rate:3.50},{upTo:1000000,rate:0.10},{upTo:10000000,rate:0.15},{upTo:null,rate:0.20}],condition:'Bonusové pásmo platí na jediné (nejstarší) Fio konto fyzické osoby. Pro sazby dalších pásem ověř aktuální sazebník banky.',url:'https://www.fio.cz/bankovni-sluzby/sporeni/sporici-ucet-fio-konto',source:'Fio banka · produkt a přehled sazeb'},
  {id:'fio-standard',bankId:'fio',bank:'Fio banka',product:'Fio spořicí účet',rate:3.00,limit:0,above:3.00,bands:[{upTo:null,rate:3.00}],condition:'Spořicí účet má odlišná pravidla než Fio konto, včetně omezení odchozích převodů. Ověř aktuální sazebník.',url:'https://www.fio.cz/bankovni-sluzby/sporeni/fio-sporici-ucet',source:'Fio banka · produktová stránka'},
  {id:'csob-bonus',bankId:'csob',bank:'ČSOB',product:'Spoření s bonusem · aktivita',rate:3.80,limit:250000,above:2.00,bands:[{upTo:250000,rate:3.80},{upTo:1000000,rate:2.00},{upTo:null,rate:0.10}],condition:'Podmínky bonusu se liší dle věku a tarifu. U některých klientů je nutná i TOP sazba. Veřejná zvýhodněná sazba uvedena do 30. 11. 2026.',url:'https://www.csob.cz/lide/poplatky-a-sazby/sazby',source:'ČSOB · oficiální sazby listopad 2026'},
  {id:'rb-cards-invest',bankId:'rb',bank:'Raiffeisenbank',product:'Bonusový spořicí účet · karta + investice',rate:4.20,limit:500000,above:0,bands:[{upTo:500000,rate:4.20},{upTo:null,rate:0}],condition:'Do 30. 11. 2026 maximální sazba 4,20 % při alespoň 10 platbách kartou a investování. Sazba nad 500 000 Kč v modelu konzervativně 0 % – ověř pásma podle tarifu. Od 1. 12. 2026 banka avizovala jiné sazby.',url:'https://www.rb.cz/osobni/ucty/sporici-ucty/bonusovy-ucet',source:'Raiffeisenbank · aktuální nabídka / změny od prosince'},
  {id:'rb-cards',bankId:'rb',bank:'Raiffeisenbank',product:'Bonusový spořicí účet · 10 plateb kartou',rate:4.00,limit:500000,above:0,bands:[{upTo:500000,rate:4.00},{upTo:null,rate:0}],condition:'Sazba při 10 platbách kartou měsíčně. Nad 500 000 Kč model nepočítá další úrok, protože pásma závisejí na tarifu. Od 1. 12. 2026 banka avizovala změny.',url:'https://www.rb.cz/podpora/podminky-akci/bonusovy-urok',source:'Raiffeisenbank · bonusové podmínky'},
  {id:'penta-plus',bankId:'penta',bank:'Penta Bank',product:'Spořicí účet+',rate:4.01,limit:10000000,above:0.01,bands:[{upTo:10000000,rate:4.01},{upTo:null,rate:0.01}],condition:'Veřejná sazba do 10 mil. Kč, denní výpočet úroku a měsíční připisování. Ověř, zda je nabídka dostupná konkrétnímu klientovi.',url:'https://www.pentabank.cz/novinky/penta-bank-zvysila-urokovou-sazbu-sporiciho-uctu-na-4%2C01-percenta',source:'Penta Bank · 29. 10. 2026'},
  {id:'partners-standard',bankId:'partners',bank:'Partners Banka',product:'Spořicí účet · aktivní klient',rate:3.20,limit:0,above:3.20,bands:[{upTo:null,rate:3.20}],condition:'Základní sazba pro aktivní klienty; balíčky Pro dva / Pro rodinu ji mají i bez aktivity. Jednoměsíční akce 4,06 % není předpokládána pro celý horizont.',url:'https://www.partnersbanka.cz/sporici-ucty',source:'Partners Banka · produktová stránka'},
  {id:'csas-plus',bankId:'csas',bank:'Česká spořitelna',product:'Spořicí účet · Plus + pravidelné investice',rate:3.80,limit:400000,above:0,bands:[{upTo:400000,rate:3.80},{upTo:null,rate:0}],condition:'Podmíněno Plus účtem, Georgem a pravidelnou investicí nebo DPS alespoň 2 000 Kč. Nad uvedeným pásmem model používá 0 %; bonusové podmínky ověř v Georgi.',url:'https://www.csas.cz/cs/osobni-finance/sporeni/sporici-ucet',source:'Česká spořitelna · produktová stránka'}
 ];
 const banks=[
  ['creditas','Banka CREDITAS'],['trinity','TRINITY BANK'],['mbank','mBank'],['air','Air Bank'],['fio','Fio banka'],['csob','ČSOB'],['rb','Raiffeisenbank'],['penta','Penta Bank'],['partners','Partners Banka'],['csas','Česká spořitelna'],['kb','Komerční banka'],['moneta','MONETA Money Bank'],['unicredit','UniCredit Bank']
 ];
 const mortgage=[
  {id:'fio',bankId:'fio',bank:'Fio banka',rate:4.78,fix:3,condition:'3 roky · LTV do 80 % · veřejná sazba „od“; podle bonity a slev',url:'https://www.fio.cz/bankovni-sluzby/uvery/hypoteky'},
  {id:'air',bankId:'air',bank:'Air Bank',rate:5.19,fix:3,condition:'3 roky · LTV do 80 % · sazba „od“, podmíněná nabídkou',url:'https://www.airbank.cz/produkty/hypoteka/'},
  {id:'cs',bankId:'csas',bank:'Česká spořitelna',rate:5.39,fix:3,condition:'3 roky · LTV do 80 % · slevy a posouzení banky',url:'https://www.csas.cz/cs/osobni-finance/uvery/hypoteka'},
  {id:'unicredit',bankId:'unicredit',bank:'UniCredit Bank',rate:5.39,fix:3,condition:'3 roky · LTV do 80 % · sazba „od“',url:'https://www.unicreditbank.cz/'},
  {id:'mbank',bankId:'mbank',bank:'mBank',rate:5.59,fix:3,condition:'3 roky · LTV do 80 % · sazba „od“',url:'https://www.mbank.cz/osobni/uvery/hypoteky/'},
  {id:'partners',bankId:'partners',bank:'Partners Banka',rate:5.69,fix:3,condition:'3 roky · LTV do 80 % · sazba „od“',url:'https://www.partnersbanka.cz/'},
  {id:'kb',bankId:'kb',bank:'Komerční banka',rate:6.14,fix:3,condition:'3 roky · LTV do 80 % · sazba „od“',url:'https://www.kb.cz/cs/obcane/pujcky/hypoteka'}
 ];
 const pct=n=>new Intl.NumberFormat('cs-CZ',{maximumFractionDigits:2}).format(n)+' %';
 const createOption=(value,label)=>{const o=document.createElement('option');o.value=value;o.textContent=label;return o};
 const source=(product,hypo=false)=>{
  const box=$(hypo?'mortProductInfo':'savingProductInfo');if(!box)return;
  box.replaceChildren();box.className='form-field full product-context';
  if(!product){box.textContent='U vlastní nabídky doplň sazbu ručně. Úročení a podmínky nejsou ověřené aplikací.';return;}
  const line=document.createElement('div');line.className='product-context-row';
  const name=document.createElement('strong');name.textContent=(hypo?'Referenční nabídka · ':'Produkt · ')+product.bank;
  const tag=document.createElement('span');tag.className='rate-verified';
  const stale=(Date.now()-parseDate(hypo?'13. 11. 2026':verified))/86400000>14;
  tag.textContent=(hypo?'Referenční sazba 13. 11. 2026':'Ověřeno '+verified)+(stale?' · znovu ověřit':'');
  if(stale)tag.classList.add('rate-stale');
  line.append(name,tag);box.append(line);
  const p=document.createElement('p');p.textContent=product.condition;box.append(p);
  if(!hypo&&product.bands){const row=document.createElement('div');row.className='rate-band-row';let lower=0;for(const b of product.bands){const item=document.createElement('span');item.textContent=(b.upTo===null?'nad '+new Intl.NumberFormat('cs-CZ').format(lower)+' Kč':'do '+new Intl.NumberFormat('cs-CZ').format(b.upTo)+' Kč')+' · '+pct(b.rate);row.append(item);lower=b.upTo??lower}box.append(row)}
  const anchor=document.createElement('a');anchor.href=product.url;anchor.target='_blank';anchor.rel='noopener noreferrer';anchor.textContent='Ověřit na webu instituce ↗';box.append(anchor);
 };
 // Keep one source of product values for both the calculator and market table.
 BANKS.splice(0,BANKS.length,...products);
 if(typeof renderMarket==='function')renderMarket();
 const savingBank=$('savingBank'),oldSaving=$('savingProduct');
 const saving=oldSaving.cloneNode(false);oldSaving.replaceWith(saving);
 const savBanks=[['manual','Vlastní sazba / jiná instituce'],...banks];
 savingBank.replaceChildren(...savBanks.map(b=>createOption(b[0],b[1])));
 function populateSaving(bankId){
  const selected=products.filter(p=>p.bankId===bankId);
  saving.replaceChildren(createOption('manual','Vlastní sazba z nabídky'),...selected.map(p=>createOption(p.id,p.product+' · '+pct(p.rate))));
  if(selected.length){saving.value=selected[0].id;applySaving();}else{saving.value='manual';source(null);window.calculateSavings();}
 }
 function applySaving(){
  const p=products.find(p=>p.id===saving.value);
  if(p){$('savRate').value=p.rate;$('savLimit').value=p.limit;$('savAboveRate').value=p.above;$('savTax').value=15;}
  source(p);window.calculateSavings();window.syncFfgSliders?.();
 }
 savingBank.addEventListener('change',()=>populateSaving(savingBank.value));
 saving.addEventListener('change',applySaving);
 // Global manual-rate editing already changes savingProduct to 'manual'.
 ['savRate','savLimit','savAboveRate'].forEach(id=>$(id).addEventListener('input',()=>source(null)));
 savingBank.value='manual';populateSaving('manual');

 const mortInstitution=$('mortInstitution'),oldMort=$('mortBank');
 const mortSel=oldMort.cloneNode(false);oldMort.replaceWith(mortSel);
 mortInstitution.replaceChildren(...[['manual','Vlastní nabídka / jiná banka'],...banks].map(b=>createOption(b[0],b[1])));
 function populateMortgage(bankId){
  const matches=mortgage.filter(p=>p.bankId===bankId);
  mortSel.replaceChildren(createOption('manual','Individuální sazba / jiné podmínky'),...matches.map(p=>createOption(p.id,'Hypotéka · fixace '+p.fix+' roky · '+pct(p.rate)+' od')));
  if(matches.length){mortSel.value=matches[0].id;applyMortgage();}else{mortSel.value='manual';source(null,true);window.calculateMortgage();}
 }
 function applyMortgage(){
  const p=mortgage.find(x=>x.id===mortSel.value);
  if(p){$('mortRate').value=p.rate;$('mortFixYears').value=String(p.fix);}
  source(p,true);window.calculateMortgage();window.syncFfgSliders?.();
 }
 mortInstitution.addEventListener('change',()=>populateMortgage(mortInstitution.value));
 mortSel.addEventListener('change',applyMortgage);
 $('mortRate').addEventListener('input',()=>source(null,true));
 mortInstitution.value='manual';populateMortgage('manual');
 window.FFGRateCatalog={savings:products,mortgage,verified};
})();
