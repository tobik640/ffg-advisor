/* FFG Advisor 0.4 – verified model boundaries and local-only IOLDP workflow.
   The original v0.3 remains as a recoverable baseline in the Git repository. */
(function(){
  'use strict';
  const $ = id => document.getElementById(id);
  const amount = id => {
    const el=$(id);
    if(!el) return 0;
    const value=Number(el.value);
    return Number.isFinite(value)?value:NaN;
  };
  const fmt = x => MONEY(x);
  const maxZero = x => Math.max(0,x);
  const fixed = (x,d=1) => Number(x).toFixed(d).replace('.',',');
  const seen = {};
  const required = ids => {
    const errors=[];
    for(const id of ids){
      const e=$(id);if(!e)continue;
      const v=Number(e.value),minimum=e.getAttribute('min'),maximum=e.getAttribute('max'),
        min=minimum===null?-Infinity:Number(minimum),max=maximum===null?Infinity:Number(maximum);
      const ok=e.value.trim()!==''&&Number.isFinite(v)&&v>=min&&v<=max;
      e.setAttribute('aria-invalid',String(!ok));
      if(!ok)errors.push(e.closest('.form-field')?.querySelector('label')?.textContent||id);
    }
    return errors.length?'<div class="validation" role="alert"><b>Oprav vstupní údaje:</b> '+errors.map(safe).join(', ')+'.</div>':'';
  };
  const metric = (title,value) => tile(title,value);
  const notification = (message,warn=false) => '<div class="'+(warn?'validation':'notice')+'">'+message+'</div>';
  const effective = (gross,fee) => (1+gross/100)*(1-fee/100)-1;
  const monthlyRate = annualFraction => Math.pow(Math.max(.000001,1+annualFraction),1/12)-1;
  const series = (initial,monthly,gross,fee,entry,years) => {
    const rr=monthlyRate(effective(gross,fee)),deposit=(1-entry/100);
    let balance=initial*deposit;const timeline=[balance];
    for(let m=1;m<=Math.round(years*12);m++){
      balance=balance*(1+rr)+monthly*deposit;
      if(m%12===0)timeline.push(balance);
    }
    return {balance,timeline,rate:effective(gross,fee)*100};
  };
  const spark = (items,yearCount,caption) => lineChart(
    items.map(values=>({values:values.map(x=>Math.round(x))})),
    Array.from({length:yearCount+1},(_,i)=>i===0?'Start':i+' r.'),
    caption);
  const grossAndFees = (gross,fee,principal,monthly,entry,years) => {
    const net=series(principal,monthly,gross,fee,entry,years);
    const noFees=series(principal,monthly,gross,0,0,years);
    return {...net,noFees:noFees.balance,impact:noFees.balance-net.balance};
  };
  const modelNotice = '<div class="notice blue">Scénář je ilustrace, nikoli zaručený výnos, výběr produktu nebo individuální finanční doporučení. Konkrétní poplatky, KID, podmínky a daně je nutné prověřit.</div>';

  // NAVIGATION – top-level overview and the separate IOLDP report view.
  const previousGo=window.go;
  window.go=function(view){
    if(!$('view-'+view))return;
    previousGo(view);
    const names={overview:'Přehled', 'ioldp-report':'Analýza IOLDP / ČSSZ'};
    if(names[view])$('crumbTitle').textContent=names[view];
    if(view==='ioldp-report')renderIoldpReport();
    if(view==='pension')window.calculatePensionAdvanced();
    const main=document.querySelector('.main');
    if(main)window.scrollTo({top:0,behavior:'instant'});
    if(location.hash!=='#'+view)history.replaceState(null,'','#'+view);
  };

  // Pension-savings model: state credit and employer contribution are *cashflows*,
  // but tax deduction is a distinct benefit, not additional account performance.
  window.calculateDps=function(){
    const ids=['dpsOwn','dpsEmployer','dpsYears','dpsReturn','dpsFee','dpsAge','dpsInitial','dpsInflation','dpsOtherTax','dpsEmployerUsed'];
    const bad=required(ids);if(bad){$('dpsResult').innerHTML=bad;return;}
    const own=amount('dpsOwn'),emp=amount('dpsEmployer'),years=amount('dpsYears'),
      gross=amount('dpsReturn'),fee=amount('dpsFee'),age=amount('dpsAge'),
      initial=amount('dpsInitial'),infl=amount('dpsInflation'),
      retired=$('dpsRetired').checked,eligible=$('dpsEligible').checked&&!retired;
    const state=dpsState(own,eligible),months=years*12,totalOwn=own*months,
      totalEmp=emp*months,totalState=state*months;
    const m=grossAndFees(gross,fee,initial,own+emp+state,0,years),
      paid=initial+totalOwn+totalEmp+totalState,real=m.balance/Math.pow(1+infl/100,years);
    const available=maxZero(48000-amount('dpsOtherTax')),
      deduction=Math.min(available,(retired?own:maxZero(own-1700))*12),
      tax=deduction*amount('dpsTaxRate')/100,
      empExempt=Math.min(emp*12,maxZero(50000-amount('dpsEmployerUsed')));
    const gate=age+years<60?'Ve zvoleném horizontu účastník ještě nedosáhne 60 let. Výběr a daňovou podporu je nutné prověřit.':
      'Věková podmínka pro obvyklý řádný výběr může být splněna; ověř také délku konkrétní smlouvy.';
    $('dpsResult').innerHTML=hero('Odhadovaná hodnota DPS',fmt(m.balance),'Včetně modelových příspěvků a po uvažovaných průběžných nákladech.')+
      '<div class="result-grid">'+metric('Vlastní vklady',fmt(totalOwn))+metric('Zaměstnavatel',fmt(totalEmp))+
      metric('Státní příspěvky',fmt(totalState))+metric('Zhodnocení po nákladech',fmt(m.balance-paid))+
      metric('Hodnota v dnešních cenách',fmt(real))+metric('Dopad nákladů',fmt(m.impact))+
      metric('Čistý modelový výnos p.a.',PCT(m.rate))+metric('Vybraná společnost',safe($('dpsCompany').value))+'</div>'+
      '<div class="kpi-grid"><div class="kpi"><span>Státní podpora měsíčně</span><strong>'+fmt(state)+'</strong></div>'+
      '<div class="kpi"><span>Možný odpočet od základu daně / rok</span><strong>'+fmt(deduction)+'</strong></div>'+
      '<div class="kpi"><span>Orientační úspora na dani / rok</span><strong>'+fmt(tax)+'</strong></div></div>'+
      '<div class="chart-box"><div class="chart-title">Vývoj hodnoty účtu</div>'+spark([m.timeline],years,'Modelové DPS')+'</div>'+
      notification('Z příspěvku zaměstnavatele může být osvobozeno až '+fmt(empExempt)+' ročně v rámci společného limitu 50 000 Kč. '+safe(gate),age+years<60)+
      notification('Státní příspěvek není nárokový pro poživatele starobního důchodu. Pro částky pod 500 Kč měsíčně je nulový, nad 1 700 Kč se již nezvyšuje. Příspěvky zaměstnavatele nezvyšují státní příspěvek.')+modelNotice;
  };

  window.calculateDip=function(){
    const ids=['dipInitial','dipMonthly','dipEmployer','dipReturn','dipFee','dipEntry','dipYears','dipAge','dipUsed','dipTax','dipInflation','dipEmployerUsed'];
    const bad=required(ids);if(bad){$('dipResult').innerHTML=bad;return;}
    const initial=amount('dipInitial'),monthly=amount('dipMonthly'),employer=amount('dipEmployer'),
      years=amount('dipYears'),age=amount('dipAge'),gross=amount('dipReturn'),fee=amount('dipFee'),
      entry=amount('dipEntry'),infl=amount('dipInflation'),months=years*12;
    if(gross<=-100||fee>=100||entry>=100){$('dipResult').innerHTML=notification('Neplatná kombinace výnosu a poplatků.',true);return;}
    const m=grossAndFees(gross,fee,initial,monthly+employer,entry,years);
    const paid=initial+(monthly+employer)*months,
      remaining=maxZero(48000-amount('dipUsed')),deduction=Math.min(remaining,initial+12*monthly),
      benefit=deduction*amount('dipTax')/100,
      exempt=Math.min(12*employer,maxZero(50000-amount('dipEmployerUsed')));
    const meets=years>=10&&age+years>=60;
    $('dipResult').innerHTML=hero('Odhadovaná hodnota DIP',fmt(m.balance),'Model s reinvesticí, vstupním a průběžným nákladem; bez garantovaného výnosu.')+
      '<div class="result-grid">'+metric('Celkem vloženo',fmt(paid))+metric('Modelový výsledek',fmt(m.balance-paid))+
      metric('Čistý modelový výnos p.a.',PCT(m.rate))+metric('V dnešních cenách',fmt(m.balance/Math.pow(1+infl/100,years)))+
      metric('Dopad nákladů',fmt(m.impact))+metric('Poskytovatel',safe($('dipProvider').value))+'</div>'+
      '<div class="kpi-grid"><div class="kpi"><span>Odpočet za první rok</span><strong>'+fmt(deduction)+'</strong></div>'+
      '<div class="kpi"><span>Možná úspora na dani</span><strong>'+fmt(benefit)+'</strong></div>'+
      '<div class="kpi"><span>Osvobozený příspěvek zaměstnavatele / rok</span><strong>'+fmt(exempt)+'</strong></div></div>'+
      '<div class="chart-box"><div class="chart-title">Vývoj majetku v DIP</div>'+spark([m.timeline],years,'Vývoj DIP')+'</div>'+
      notification(meets?'Podle zadaného věku a horizontu je orientačně splněno pravidlo 120 kalendářních měsíců a věku 60 let. Stále ověř přesné datum vzniku smlouvy.':
        'Pozor: zadaný scénář NEsplňuje současně 120 měsíců trvání a dosažení 60 let. Předčasný výběr může vyvolat navrácení daňové podpory.',!meets)+
      notification('Odpočet závisí i na skutečném základu daně klienta. Úspora není garantovaná: uvedená sazba daně a nárok na odpočet musejí odpovídat skutečné daňové situaci. Příspěvky zaměstnavatele nejsou vlastním odpočtem zaměstnance.')+modelNotice;
  };

  window.calculateInvestment=function(){
    const ids=['invInitial','invMonthly','invReturn','invFee','invEntryFee','invYears','invInflation'];
    const bad=required(ids);if(bad){$('investmentResult').innerHTML=bad;return;}
    const initial=amount('invInitial'),monthly=amount('invMonthly'),gross=amount('invReturn'),
      fee=amount('invFee'),entry=amount('invEntryFee'),years=amount('invYears'),infl=amount('invInflation');
    if(gross<=-100||fee>=100||entry>=100){$('investmentResult').innerHTML=notification('Zvol platný výnos a poplatky pod 100 %.',true);return;}
    const m=grossAndFees(gross,fee,initial,monthly,entry,years),paid=initial+monthly*12*years;
    const low=series(initial,monthly,Math.max(-99,gross-3),fee,entry,years).balance,
      high=series(initial,monthly,gross+3,fee,entry,years).balance;
    $('investmentResult').innerHTML=hero('Modelová hodnota investice',fmt(m.balance),'Složené zhodnocení po uvedených nákladech, pravidelné vklady na konci měsíce.')+
      '<div class="result-grid">'+metric('Celkem investováno',fmt(paid))+
      metric('Zisk / ztráta po nákladech',fmt(m.balance-paid))+
      metric('Efektivní výnos po nákladech p.a.',PCT(m.rate))+
      metric('Hodnota v dnešních cenách',fmt(m.balance/Math.pow(1+infl/100,years)))+
      metric('Dopad poplatků',fmt(m.impact))+
      metric('Poskytovatel',safe($('invProvider').value))+'</div>'+
      '<div class="kpi-grid"><div class="kpi"><span>Slabší scénář (−3 p. b.)</span><strong>'+fmt(low)+'</strong></div>'+
      '<div class="kpi"><span>Základní scénář</span><strong>'+fmt(m.balance)+'</strong></div>'+
      '<div class="kpi"><span>Silnější scénář (+3 p. b.)</span><strong>'+fmt(high)+'</strong></div></div>'+
      '<div class="chart-box"><div class="chart-title">Vývoj v čase</div>'+spark([m.timeline],years,'Investiční plán')+'</div>'+
      notification('Vstupní poplatek se odečte z počátečního i každého měsíčního vkladu. Průběžný náklad se v modelu aplikuje na hodnotu portfolia; investice mohou klesnout i výrazně více než ukazuje stresový scénář.')+modelNotice;
  };

  // Unlike investment return, deposit interest is a quoted nominal annual rate.
  // 1/12 of the annual nominal rate is an approximation of monthly credited interest.
  window.interestFromBands=function(balance,bands,taxPct=0){
    let lower=0,total=0;balance=maxZero(balance);
    for(const band of bands){
      const upper=band.upTo===null?Infinity:Number(band.upTo);
      const portion=maxZero(Math.min(balance,upper)-lower);
      total+=portion*Number(band.rate)/1200*(1-taxPct/100);
      if(upper===Infinity||balance<=upper)break;
      lower=upper;
    }
    return total;
  };
  window.calculateSavings=function(){
    const ids=['savInitial','savMonthly','savRate','savMonths','savTax','savLimit','savAboveRate'];
    const bad=required(ids);if(bad){$('savingsResult').innerHTML=bad;return;}
    const initial=amount('savInitial'),monthly=amount('savMonthly'),months=Math.round(amount('savMonths')),
      tax=amount('savTax'),rate=amount('savRate'),above=amount('savAboveRate'),limit=amount('savLimit'),
      selected=BANKS.find(b=>b.id===$('savingProduct').value);
    const bands=selected?.bands||[{upTo:limit>0?limit:null,rate},...(limit>0?[{upTo:null,rate:above}]:[])];
    let gross=initial,net=initial,grossInterest=0,netInterest=0,chart=[net];
    for(let m=0;m<months;m++){
      const gi=window.interestFromBands(gross,bands,0),ni=window.interestFromBands(net,bands,tax);
      gross+=gi+monthly;net+=ni+monthly;grossInterest+=gi;netInterest+=ni;chart.push(net);
    }
    const deposited=initial+monthly*months,real=net/Math.pow(1.025,months/12);
    $('savingsResult').innerHTML=hero('Zůstatek po orientačním zdanění',fmt(net))+
      '<div class="result-grid">'+metric('Celkem vloženo',fmt(deposited))+metric('Čistý úrok',fmt(netInterest))+
      metric('Hrubý úrok',fmt(grossInterest))+metric('Předpoklad daně z úroku',PCT(tax))+
      metric('Orientační reálná hodnota při inflaci 2,5 %',fmt(real))+
      metric('Délka uložení',months+' měs.')+'</div>'+
      '<div class="chart-box"><div class="chart-title">Vývoj vkladu (měsíčně, po dani)</div>'+
      lineChart([{values:chart}],chart.map((_,i)=>i===0?'Start':i+' m.'),'Vývoj spoření')+'</div>'+
      notification(selected?safe(selected.bank+' · '+selected.product+': '+selected.condition):
        'Používají se ručně nastavené úrokové pásmo a sazba nad limitem.')+
      notification('Sazby jsou pouze datovaný snapshot z 14. 11. 2026. Model používá nominální sazbu p.a. a zjednodušené měsíční připisování; skutečná banka může úročit denně, sazbu měnit, požadovat aktivitu nebo mít speciální podmínky. U termínovaných vkladů se režim liší.');
  };

  const pmt=(balance,r,term)=>term<=0?0:r===0?balance/term:balance*r/(1-Math.pow(1+r,-term));
  function mortgageSchedule(principal,rate,after,term,fix,extra){
    const months=term*12,fixMonths=Math.min(fix*12,months),r0=rate/1200,r1=after/1200;
    let bal=principal,interest=0,total=0,payment=pmt(principal,r0,months),second=0,atFix=principal,
      first=payment,paidOff=0,points=[principal];
    for(let m=1;m<=months&&bal>0.0001;m++){
      if(m===fixMonths+1){payment=pmt(bal,r1,months-m+1);second=payment;}
      const charge=bal*(m<=fixMonths?r0:r1);
      const paid=Math.min(bal+charge,payment+extra);
      bal=maxZero(bal-(paid-charge));interest+=charge;total+=paid;
      if(m===fixMonths)atFix=bal;
      if(bal<.001){paidOff=m;bal=0;}
      if(m%12===0)points.push(bal);
    }
    while(points.length<term+1)points.push(0);
    return {first,second,atFix,interest,total,paidOff:paidOff||months,points};
  }
  window.calculateMortgage=function(){
    const ids=['mortAmount','mortValue','mortRate','mortYears','mortFixYears','mortRateAfter','mortExtra','mortIncome','mortOtherPayments'];
    const bad=required(ids);if(bad){$('mortgageResult').innerHTML=bad;return;}
    const principal=amount('mortAmount'),property=amount('mortValue'),rate=amount('mortRate'),
      after=amount('mortRateAfter'),years=amount('mortYears'),fix=amount('mortFixYears'),
      extra=amount('mortExtra'),income=amount('mortIncome'),other=amount('mortOtherPayments');
    if(!principal){$('mortgageResult').innerHTML=notification('Vyplň výši úvěru větší než 0.',true);return;}
    const m=mortgageSchedule(principal,rate,after,years,fix,extra),
      stress=mortgageSchedule(principal,rate+2,after+2,years,fix,0),
      ltv=property>0?principal/property*100:null,
      burden=income>0?(m.first+extra+other)/income*100:null,
      yearsPaid=Math.floor(m.paidOff/12),monthsPaid=m.paidOff%12;
    $('mortgageResult').innerHTML=hero('První měsíční odtok na hypotéku',fmt(m.first+extra),'Anuitní splátka plus dobrovolná mimořádná platba každý měsíc.')+
      '<div class="result-grid">'+metric('Splátka po fixaci (bez mimořádné)',fmt(m.second||0))+
      metric('Zůstatek po fixaci',fmt(m.atFix))+metric('Celkové úroky v modelu',fmt(m.interest))+
      metric('Celkem zaplaceno',fmt(m.total))+metric('LTV',ltv===null?'Doplň hodnotu nemovitosti':PCT(ltv))+
      metric('Splaceno za',yearsPaid+' let '+monthsPaid+' měs.')+
      metric('Podíl splátek na čistém příjmu',burden===null?'Doplň příjem':PCT(burden))+
      metric('Stresová splátka při +2 p. b.',fmt(stress.first))+'</div>'+
      '<div class="chart-box"><div class="chart-title">Zbývající jistina</div>'+
      spark([m.points],years,'Amortizace hypotéky')+'</div>'+
      notification(ltv!==null&&ltv>100?'Úvěr převyšuje zadanou hodnotu nemovitosti. Prověř dodatečné zajištění a reálné možnosti banky.':
        'LTV a podíl splátek na příjmu jsou orientační ukazatele; nejsou automatickým rozhodnutím banky.',ltv!==null&&ltv>100)+
      (burden!==null&&burden>45?notification('Splátky by v tomto modelu spotřebovaly přes 45 % čistého měsíčního příjmu domácnosti. Jde o upozornění na rozpočet, nikoli zákonný strop.',true):'')+
      notification('Model zohledňuje změnu sazby po první fixaci a dobrovolné měsíční doplatky. Nezohledňuje RPSN, pojištění, poplatky, právní limity mimořádných splátek, denní úročení ani individuální bonitu.');
  };

  // No quotation of insurance premiums or recommendation of a concrete insurer.
  window.calculateProtection=function(){
    const ids=['proDebt','proGap','proOtherIncome','proBenefits','proMonths','proOther','proReserve','proExisting'];
    const bad=required(ids);if(bad){$('protectionResult').innerHTML=bad;return;}
    const debt=amount('proDebt'),monthlyNeed=amount('proGap'),others=amount('proOtherIncome'),
      benefits=amount('proBenefits'),months=amount('proMonths'),oneOff=amount('proOther'),
      reserve=amount('proReserve'),existing=amount('proExisting');
    const shortfall=maxZero(monthlyNeed-others-benefits),gross=debt+oneOff+shortfall*months,
      already=reserve+existing,need=maxZero(gross-already);
    $('protectionResult').innerHTML=hero('Nezajištěná finanční potřeba',fmt(need),'Model pro zvolené riziko, nikoli pojistná částka schválená pojistitelem.')+
      '<div class="result-grid">'+metric('Příjmová mezera měsíčně',fmt(shortfall))+
      metric('Celková potřeba',fmt(gross))+metric('Rezerva + existující krytí',fmt(already))+
      metric('Horizont náhrady příjmu',months+' měsíců')+
      metric('Pojišťovna k prověření',safe($('insurerSelect').value))+
      metric('Řešený typ rizika',safe($('insProductType').value))+'</div>'+
      '<div class="chart-box"><div class="chart-title">Struktura potřeby</div>'+
      barRows([{label:'Závazky',value:debt,text:fmt(debt)},{label:'Ztráta příjmu',value:shortfall*months,text:fmt(shortfall*months)},
        {label:'Další náklady',value:oneOff,text:fmt(oneOff)}])+'</div>'+
      notification('Příjem jiné osoby, sociální dávky a stávající krytí bývají pro smrt, invaliditu a pracovní neschopnost odlišné. Zadané položky musí odpovídat právě řešenému riziku. Pojišťovny a produkty zde NEJSOU cenově porovnány a zvolená instituce nemění výsledek.')+
      notification('Pro odborné nastavení ověř čekací a karenční dobu, definici invalidity a PN, výluky, progresi, limity plnění, indexaci, věk klienta, povolání a sport. Nejde o ocenění pojistného.');
  };

  window.calculateComparison=function(){
    const ids=['cmpMonthly','cmpYears','cmpInitial','cmpReturnA','cmpFeeA','cmpEntryA','cmpReturnB','cmpFeeB','cmpEntryB'];
    const bad=required(ids);if(bad){$('comparisonResult').innerHTML=bad;return;}
    const initial=amount('cmpInitial'),monthly=amount('cmpMonthly'),years=amount('cmpYears');
    const a={name:$('cmpNameA').value||'Varianta A',gross:amount('cmpReturnA'),fee:amount('cmpFeeA'),entry:amount('cmpEntryA')};
    const b={name:$('cmpNameB').value||'Varianta B',gross:amount('cmpReturnB'),fee:amount('cmpFeeB'),entry:amount('cmpEntryB')};
    const variants=[a,b];
    for(const v of variants){
      if(v.gross<=-100||v.fee<0||v.fee>=100){$('comparisonResult').innerHTML=notification('Náklady musejí být nezáporné a nižší než 100 %, hrubý výnos nad −100 %.',true);return;}
      v.plan=grossAndFees(v.gross,v.fee,initial,monthly,v.entry,years);
      v.down=series(initial,monthly,Math.max(-99,v.gross-3),v.fee,v.entry,years).balance;
      v.net=effective(v.gross,v.fee)*100;
    }
    const lead=a.plan.balance>=b.plan.balance?a:b,delta=Math.abs(a.plan.balance-b.plan.balance);
    $('comparisonResult').innerHTML=hero('Rozdíl modelových hodnot',fmt(delta),'Stejný vklad a horizont, odlišné náklady a výnosové předpoklady.')+
      '<div class="result-grid">'+metric(safe(a.name)+' – konečná hodnota',fmt(a.plan.balance))+
      metric(safe(b.name)+' – konečná hodnota',fmt(b.plan.balance))+
      metric('Vlastní vložené prostředky',fmt(initial+monthly*years*12))+
      metric('Poplatkový dopad A / B',fmt(a.plan.impact)+' / '+fmt(b.plan.impact))+
      metric('Efektivní výnos A / B',PCT(a.net)+' / '+PCT(b.net))+
      metric('Slabší scénář A / B',fmt(a.down)+' / '+fmt(b.down))+'</div>'+
      '<div class="chart-box"><div class="chart-title">Srovnání vývoje po nákladech</div>'+
      spark([a.plan.timeline,b.plan.timeline],years,'Porovnání variant')+'</div>'+
      notification('Za zadaných <b>matematických</b> předpokladů vychází vyšší konečná hodnota u '+safe(lead.name)+
      '. Větší očekávaný výnos neznamená nižší riziko nebo vyšší vhodnost produktu. Před doporučením porovnej likviditu, SRI, doporučený horizont, diverzifikaci, měnu, zdanění, úplné náklady a investiční cíle.')+modelNotice;
  };

  // Pension estimate must not invent earnings. OVZ is not current gross salary.
  window.calculatePensionAdvanced=function(){
    const ovz=amount('penOvz'),years=amount('penYears'),
      future=$('penFutureMode').value==='yes'?maxZero(amount('penFutureYears')):0,
      added=window.gapCreditedDays();
    if(!(ovz>0&&years>0)){
      $('pensionResult').innerHTML=notification('Pro odhad nejprve vyplň <b>skutečný OVZ a dosud evidované roky pojištění</b> z ČSSZ / IDA. Vložení PDF samo o sobě obvykle tyto výpočtové údaje spolehlivě neurčí.',true);
      $('pensionScenarioResult').innerHTML=notification('Scénář před / po bude dostupný po zadání OVZ a evidované doby. Identifikované intervaly se zatím drží jako návrhy k prověření.');
      renderIoldpForecast();
      return;
    }
    const before=pensionFormula(ovz,years+future),
      after=pensionFormula(ovz,years+future+added.years),delta=after.total-before.total;
    const qualified=years+future>=35;
    $('pensionResult').innerHTML=hero('Podmíněný odhad důchodu – výchozí stav',fmt(before.total),
      'Výhradně zjednodušené parametry roku 2026, nikoli budoucí valorizace ani oficiální výměr ČSSZ.')+
      '<div class="result-grid">'+metric('OVZ',fmt(ovz))+metric('Celé roky v modelu',before.fullYears+' let')+
      metric('Výpočtový základ',fmt(before.base))+metric('Základní výměra',fmt(4900))+'</div>'+
      notification(qualified?'Model eviduje nejméně 35 let, ale skutečný nárok, důchodový věk a druh dob musí ČSSZ ověřit.':
        'Modelová doba je pod obecnou podmínkou 35 let. Před stanovením částky jako skutečně nárokového důchodu ověř výjimky a další nárokové cesty u ČSSZ.',!qualified)+
      notification('Zadané roky jsou převzaty jako souhrnné období. Neprovádí se kontrola skutečného rozlišení pojištěných a náhradních dob, ani historických vyměřovacích základů.');
    $('pensionScenarioResult').innerHTML='<div class="kpi-grid"><div class="kpi"><span>Před případným uznáním</span><strong>'+fmt(before.total)+'</strong></div>'+
      '<div class="kpi"><span>Hypoteticky uznané roky</span><strong>'+fixed(added.years,2)+'</strong></div>'+
      '<div class="kpi"><span>Po případném uznání</span><strong>'+fmt(after.total)+'</strong></div></div>'+
      notification('Rozdíl: <b>'+fmt(delta)+' měsíčně</b>. Hodnota není navýšení přiznané ČSSZ: uznání dob a změna OVZ se posuzují individuálně. Samotné přidané období může mít vliv i na výpočtový základ.');
    renderIoldpForecast();
  };

  // Day precision and de-duplication: the same day cannot be counted twice.
  window.gapCreditedDays=function(){
    const days=new Map(),cutoff=Date.UTC(1940,0,1),maxDate=Date.UTC(new Date().getFullYear()+1,11,31);
    for(const gap of GAP_PERIODS){
      const factor=GAP_TYPES[gap.type]?.factor||0;
      if(!gap.include||!factor)continue;
      const from=gap.startDate||gap.start+'-01';
      const end=gap.endDate||gap.end+'-'+String(new Date(Number(gap.end.slice(0,4)),Number(gap.end.slice(5,7)),0).getDate()).padStart(2,'0');
      let date=Date.parse(from+'T00:00:00Z'),finish=Date.parse(end+'T00:00:00Z');
      if(!Number.isFinite(date)||!Number.isFinite(finish)||finish<date||date<cutoff||finish>maxDate)continue;
      for(;date<=finish;date+=86400000)days.set(date,Math.max(days.get(date)||0,factor));
    }
    let total=0;days.forEach(x=>total+=x);
    return {days:total,years:total/365};
  };

  // Disabled entitlement is not a zero disability pension: show the scenario
  // as an unverified hypothetical, and make the insurance test explicit.
  window.calculateDisability=function(){
    const ids=['invAge','invDegree','invLast10','invLast20','invCovered','invStudy','invElapsed','invRefAge','invOvz','invPastYears'];
    const bad=required(ids);if(bad){$('disabilityResult').innerHTML=bad;return;}
    const age=amount('invAge'),degree=amount('invDegree'),last10=amount('invLast10'),
      last20=amount('invLast20'),covered=amount('invCovered')+amount('invStudy'),
      elapsed=amount('invElapsed'),ref=amount('invRefAge'),ovz=amount('invOvz'),
      past=amount('invPastYears'),accident=$('invWorkAccident').checked,
      youth=$('invYouth').checked,intentional=$('invIntentional').checked;
    let needed=age<20?null:age<22?1:age<24?2:age<26?3:age<28?4:5;
    const qualified=accident||(needed!==null&&last10>=needed)||(age>38&&last20>=10);
    const ratio=elapsed>0?Math.min(1,covered/elapsed):0,
      threshold=age<28?1:age<40?2:3,
      full=age<18||(elapsed-covered)<threshold;
    const future=maxZero(ref-age),futureCredited=intentional?0:(full?future:future*ratio),
      totalYears=past+futureCredited,reduced=pensionFormula(ovz,0).base,
      rate={1:.01495/3,2:.01495/2,3:.01495}[degree],
      minimum={1:1634,2:2450,3:4900}[degree],
      percentage=Math.max(minimum,reduced*totalYears*rate),
      total=4900+percentage;
    const needsManual=needed===null||youth||ref<=age||covered>elapsed||ovz<=0;
    let status=qualified?'Zadaný základní test doby pojištění vychází orientačně splněn.':
      'Zadaný základní test doby pojištění vychází nesplněn; částka níže není potvrzený nárok.';
    if(needed===null)status='Pro věk do 20 let je potřeba individuální test v kratších obdobích; zjednodušený přepočet nerozhoduje o nároku.';
    if(accident)status='Označena zákonná výjimka pracovního úrazu / nemoci z povolání; uznání souvislosti musí posoudit příslušné orgány.';
    $('disabilityResult').innerHTML=hero('Ilustrační částka při uznání nároku',fmt(total),
      'Částka předpokládá uznaný stupeň invalidity, dobu pojištění a OVZ; nejde o posudek.')+
      '<div class="result-grid">'+metric('Stupeň',degree+'. stupeň')+
      metric('Předchozí doba pojištění',fixed(past)+' let')+
      metric('Dopočtená doba',fixed(futureCredited,2)+' let')+
      metric('Celková modelová doba',fixed(totalYears,2)+' let')+
      metric('Procentní výměra',fmt(percentage))+
      metric('Výpočtový základ',fmt(reduced))+'</div>'+
      notification(safe(status),!qualified||needsManual)+
      (needsManual?notification('Část vstupů vyžaduje individuální kontrolu (zejména invalidita z mládí, nízký věk, referenční důchodový věk nebo evidence pojištění). Výpočet v těchto případech není automatickým rozhodnutím.',true):'')+
      notification('Pokles pracovní schopnosti 35–49 % / 50–69 % / nejméně 70 % posuzuje IPZS. Model neověřuje zdravotní podklady ani přesné zákonné zaokrouhlování, přechodná ustanovení a všechny podmínky dopočtené doby.');
  };

  // IOLDP: extract only from an explicitly identified missing-period block.
  // Parsing every date range in the PDF would incorrectly mark covered work as missing.
  let reportMeta={status:'empty',source:'',pages:0,explicit:false,intervals:0};
  const parseDate = x => {
    const m=String(x).match(/(\d{1,2})\.\s*(\d{1,2})\.\s*(\d{4})/);
    if(!m)return null;
    const dd=Number(m[1]),mm=Number(m[2]),yy=Number(m[3]);
    const day=new Date(Date.UTC(yy,mm-1,dd));
    return day.getUTCFullYear()===yy&&day.getUTCMonth()===mm-1&&day.getUTCDate()===dd?
      yy+'-'+String(mm).padStart(2,'0')+'-'+String(dd).padStart(2,'0'):null;
  };
  window.analyzeIoldpText=function(text,source='Zkopírovaný text'){
    IOLDP_TEXT=String(text||'').slice(0,2e6);
    const norm=IOLDP_TEXT.replace(/\u00a0/g,' ').replace(/\r/g,'\n');
    const flat=norm.replace(/\s+/g,' '),head=flat.search(/neevidovan[eé] dob[yě]|nezjišt[eě]n[eé] dob[yě]|chyb[eě]j[ií]c[ií] dob[yě]|neprok[aá]zan[eé] dob[yě]/i);
    const explicit=head>=0;
    let zone='';
    if(explicit){
      const textAfter=flat.slice(head+1,head+30000);
      const stop=textAfter.search(/(?:celkov[aá] doba pojišt[eě]n[ií]|pouč[eě]n[ií]|v[yý]sledek v[yý]počtu|vym[eě]řovac[ií] z[aá]klady|zhodnocen[eé] dob[yě]|rekapitulace evidovan[yý]ch)/i);
      zone=stop>75?textAfter.slice(0,stop):textAfter;
    }
    const period=/([0-3]?\d\.\s*[01]?\d\.\s*(?:19|20)\d{2})\s*(?:-|–|—|až|do)\s*([0-3]?\d\.\s*[01]?\d\.\s*(?:19|20)\d{2})/g;
    let match;const candidates=[];
    while((match=period.exec(zone))&&candidates.length<80){
      const a=parseDate(match[1]),b=parseDate(match[2]);
      if(!a||!b||a>b||b>new Date().toISOString().slice(0,10))continue;
      if(!candidates.some(x=>x.a===a&&x.b===b))candidates.push({a,b});
    }
    // Replacement affects only older machine-generated suggestions, not the
    // user's manual investigation.
    GAP_PERIODS=GAP_PERIODS.filter(g=>g.source!=='PDF');
    for(const p of candidates)GAP_PERIODS.push({
      id:'g'+Date.now()+Math.random().toString(36).slice(2),
      start:p.a.slice(0,7),end:p.b.slice(0,7),
      startDate:p.a,endDate:p.b,type:'unknown',note:'Rozpoznaný kandidát – potvrdit podle originálu',
      source:'PDF',include:false});
    reportMeta={status:'loaded',source,pages:(norm.match(/--- STRANA/g)||[]).length,
      explicit,intervals:candidates.length};
    if($('ioldpExtract')){
      $('ioldpExtract').classList.remove('hidden');
      $('ioldpPreview').textContent=norm.slice(0,24000);
      $('ioldpExtractSummary').innerHTML='<div class="notice">'+
        (explicit?'Rozpoznána možná sekce neevidovaných dob.':'Sekce neevidovaných dob nebyla bezpečně rozpoznána.')+
        ' Kandidátních intervalů: '+candidates.length+'.</div>';
    }
    $('ioldpStatus').textContent='Lokálně zpracováno: '+source+
      '. '+(candidates.length?'Nalezené intervaly čekají na potvrzení.':'Nebylo možné spolehlivě určit chybějící období.');
    window.renderGapPeriods();
    window.go('ioldp-report');
  };
  const originalClear=window.clearIoldp;
  window.clearIoldp=function(){originalClear();reportMeta={status:'empty',source:'',pages:0,explicit:false,intervals:0};renderIoldpReport();};
  const previousRender=window.renderGapPeriods;
  window.renderGapPeriods=function(){previousRender();renderIoldpReport();};
  const previousUpdate=window.updateGapField;
  window.updateGapField=function(id,field,value){
    previousUpdate(id,field,value);
    // Need exact dates to remain attached when merely classifying an imported interval.
    renderIoldpReport();
  };
  const previousRemove=window.removeGapPeriod;
  window.removeGapPeriod=function(id){previousRemove(id);renderIoldpReport();};
  const previousAdd=window.addGapPeriod;
  window.addGapPeriod=function(){previousAdd();renderIoldpReport();};

  function renderIoldpForecast(){
    const holder=$('ioldpReportForecast');if(!holder)return;
    const ovz=amount('penOvz'),years=amount('penYears');
    if(!(ovz>0&&years>0)){
      holder.innerHTML=notification('Nelze vyčíslit důchod: nejprve zadej skutečný OVZ a evidovanou dobu pojištění. Vysvětlení mezer samo o sobě tyto hodnoty neposkytuje.',true);
      return;
    }
    const future=$('penFutureMode').value==='yes'?maxZero(amount('penFutureYears')):0,
      added=window.gapCreditedDays(),before=pensionFormula(ovz,years+future),
      after=pensionFormula(ovz,years+future+added.years);
    holder.innerHTML='<div class="kpi-grid"><div class="kpi"><span>Před doplněním (hypoteticky)</span><strong>'+fmt(before.total)+'</strong></div>'+
      '<div class="kpi"><span>Možné přidané doby</span><strong>'+fixed(added.years,2)+' roku</strong></div>'+
      '<div class="kpi"><span>Po uznání všech označených dob (hypoteticky)</span><strong>'+fmt(after.total)+'</strong></div></div>'+
      notification('Možný rozdíl '+fmt(after.total-before.total)+' měsíčně, ale jen při uznání všech označených dob. Model používá parametry 2026. Případná změna historických výdělků, vyloučených dob, přesného nároku a budoucího data výpočtu zde není obsažena.');
  }

  function renderIoldpReport(){
    const summary=$('ioldpReportSummary'),list=$('ioldpReportPeriods'),evidence=$('ioldpReportEvidence');
    if(!summary||!list||!evidence)return;
    if(reportMeta.status!=='loaded'&&!GAP_PERIODS.length){
      summary.innerHTML=notification('Zatím nebyl načten výpis. Začni v nabídce Starobní důchod / IOLDP: nahraj textové PDF ČSSZ nebo vlož text.').replace('</div>',' <button class="btn secondary small" onclick="go(\'pension\')">Přejít k nahrání</button></div>');
      list.innerHTML='<div class="mini">Žádná období.</div>';
      evidence.innerHTML='<div class="doc-item">Po klasifikaci období se zobrazí konkrétní druhy dokladů.</div>';
      renderIoldpForecast();return;
    }
    summary.innerHTML='<div class="kpi-grid" style="margin-bottom:14px"><div class="kpi"><span>Zdroj</span><strong style="font-size:12px">'+safe(reportMeta.source||'Ruční zadání')+'</strong></div>'+
      '<div class="kpi"><span>Intervaly k prověření</span><strong>'+GAP_PERIODS.length+'</strong></div>'+
      '<div class="kpi"><span>Hypoteticky zahrnuté</span><strong>'+GAP_PERIODS.filter(g=>g.include).length+'</strong></div></div>'+
      (reportMeta.status==='loaded'&&!reportMeta.explicit?
        notification('Z dokumentu nebyl spolehlivě rozpoznán nadpis neevidovaných dob. Z bezpečnostních důvodů aplikace neoznačila všechny ostatní datumové intervaly za mezery.',true):'');
    list.innerHTML=GAP_PERIODS.length?GAP_PERIODS.map((gap,i)=>{
      const type=GAP_TYPES[gap.type]||GAP_TYPES.unknown;
      const period=(gap.startDate||gap.start)+' – '+(gap.endDate||gap.end);
      return '<div class="report-row"><div class="report-row-header"><b>Období '+(i+1)+': '+safe(period)+'</b>'+
        '<span class="pill">'+(gap.source==='PDF'?'Z PDF – neověřeno':'Ručně přidáno')+'</span></div>'+
        '<label class="mini" for="reportType'+i+'">Co se v období skutečně dělo?</label>'+
        '<select class="report-select" id="reportType'+i+'" onchange="updateGapField(\''+gap.id+'\',\'type\',this.value)">'+
        Object.entries(GAP_TYPES).map(([key,v])=>'<option value="'+key+'" '+(gap.type===key?'selected':'')+'>'+safe(v.label)+'</option>').join('')+'</select>'+
        '<label class="checkline"><input type="checkbox" '+(gap.include?'checked':'')+
        ' onchange="updateGapField(\''+gap.id+'\',\'include\',this.checked)"> Zahrnout do hypotetického scénáře, až bude doba uznána</label>'+
        '<div class="mini">'+safe(type.rule)+'</div>'+
        '<button class="btn ghost small" style="margin-top:8px" onclick="removeGapPeriod(\''+gap.id+'\')">Odebrat interval</button></div>';
    }).join(''):'<div class="validation">Žádné jednoznačné kandidátní intervaly. To neprokazuje, že evidence ČSSZ nemá mezery. Prověř datum narození, pojištěné doby a text originálu; případně zadej období ručně.</div>';
    const unique=new Set();
    evidence.innerHTML=GAP_PERIODS.length?GAP_PERIODS.map(g=>{
      const kind=GAP_TYPES[g.type]||GAP_TYPES.unknown;
      if(unique.has(g.type))return '';unique.add(g.type);
      return '<div class="doc-item"><b>'+safe(kind.label)+'</b><br>'+safe(kind.rule)+
        '<ul class="advice-list">'+kind.docs.map(doc=>'<li>'+safe(doc)+'</li>').join('')+'</ul></div>';
    }).join(''):'<div class="doc-item"><b>Obecné doložení</b><br>Časová osa klienta; ELDP; potvrzení OSSZ, zaměstnavatele, školy, ÚP či zahraniční instituce podle okolností.</div>';
    renderIoldpForecast();
  }

  // UI ergonomics, live recalculation and truthful product catalog boundaries.
  const models={dps:window.calculateDps,dip:window.calculateDip,
    investment:window.calculateInvestment,savings:window.calculateSavings,
    mortgage:window.calculateMortgage,protection:window.calculateProtection,
    pension:window.calculatePensionAdvanced,disability:window.calculateDisability,comparison:window.calculateComparison};
  const groups={
    dps:['dpsOwn','dpsEmployer','dpsYears','dpsReturn','dpsFee','dpsAge','dpsInitial','dpsInflation','dpsOtherTax','dpsEmployerUsed','dpsTaxRate','dpsEligible','dpsRetired','dpsCompany'],
    dip:['dipInitial','dipMonthly','dipEmployer','dipReturn','dipFee','dipEntry','dipYears','dipAge','dipUsed','dipTax','dipInflation','dipEmployerUsed','dipProvider'],
    investment:['invInitial','invMonthly','invReturn','invFee','invEntryFee','invYears','invInflation','invProvider'],
    savings:['savInitial','savMonthly','savRate','savMonths','savTax','savLimit','savAboveRate','savingProduct'],
    mortgage:['mortAmount','mortValue','mortRate','mortYears','mortFixYears','mortRateAfter','mortExtra','mortIncome','mortOtherPayments','mortBank'],
    protection:['proDebt','proGap','proOtherIncome','proBenefits','proMonths','proOther','proReserve','proExisting','insurerSelect','insProductType'],
    pension:['penOvz','penYears','penFutureYears','penFutureMode'],
    disability:['invAge','invDegree','invLast10','invLast20','invCovered','invStudy','invElapsed','invRefAge','invOvz','invPastYears','invWorkAccident','invYouth','invIntentional'],
    comparison:['cmpMonthly','cmpYears','cmpInitial','cmpNameA','cmpNameB','cmpReturnA','cmpReturnB','cmpFeeA','cmpFeeB','cmpEntryA','cmpEntryB']
  };
  const lookup={};
  Object.entries(groups).forEach(([model,ids])=>ids.forEach(id=>lookup[id]=model));
  document.addEventListener('input',event=>{
    const id=event.target.id;
    if(['savRate','savLimit','savAboveRate'].includes(id)){
      // An edited rate is a user hypothesis, not the old market snapshot.
      $('savingProduct').value='manual';
    }
    if(id==='reportOvz')$('penOvz').value=event.target.value;
    if(id==='reportYears')$('penYears').value=event.target.value;
    if(id==='penOvz')$('reportOvz').value=event.target.value;
    if(id==='penYears')$('reportYears').value=event.target.value;
    if(id==='reportOvz'||id==='reportYears')window.calculatePensionAdvanced();
    if(lookup[id]&&models[lookup[id]])models[lookup[id]]();
    if(id==='penOvz'||id==='penYears')renderIoldpForecast();
  });
  document.addEventListener('change',event=>{
    const model=lookup[event.target.id];if(model&&models[model])models[model]();
  });
  document.querySelectorAll('.form-field').forEach(field=>{
    const label=field.querySelector('label'),input=field.querySelector('input,select,textarea');
    if(label&&input&&input.id&&!label.htmlFor)label.htmlFor=input.id;
  });
  // Bank rates without independently checked offers must be manually supplied.
  const moreBankNames=['ČSOB','Raiffeisenbank','MONETA Money Bank','UniCredit Bank','Hypoteční banka','Oberbank'];
  for(const name of moreBankNames){
    const el=document.createElement('option');el.value='manual';el.textContent=name+' · zadat sazbu z nabídky';
    $('mortBank').append(el);
  }
  const moreInsuranceNames=['Pillow pojišťovna','Slavia pojišťovna','Colonnade Insurance','PVZP','Cardif','Maxima pojišťovna'];
  for(const name of moreInsuranceNames){
    const opt=document.createElement('option');opt.value=name;opt.textContent=name;
    $('insurerSelect').append(opt);
  }
  Object.values(models).forEach(fn=>fn());
  if($('reportOvz'))$('reportOvz').value=$('penOvz').value;
  if($('reportYears'))$('reportYears').value=$('penYears').value;
  window.go(['overview','dps','dip','investment','savings','mortgage','protection','pension','ioldp-report','disability','comparison','market'].includes(location.hash.slice(1))?location.hash.slice(1):'overview');
  renderIoldpReport();
})();
