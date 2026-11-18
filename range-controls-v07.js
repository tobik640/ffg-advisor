/* Accessible range controls complement, never replace, exact number entry. */
(function(){
 'use strict';
 const configs=[
  ['savInitial',0,2000000,10000,'Kč'],['savMonths',1,120,1,'měs.'],['savMonthly',0,30000,500,'Kč'],
  ['mortAmount',500000,15000000,50000,'Kč'],['mortYears',5,40,1,'let'],['mortRate',0,12,.05,'%'],
  ['invInitial',0,2000000,10000,'Kč'],['invMonthly',0,50000,500,'Kč'],['invYears',1,50,1,'let'],['invReturn',-10,15,.25,'%'],
  ['dipMonthly',0,30000,250,'Kč'],['dipYears',1,50,1,'let'],
  ['dpsOwn',0,10000,100,'Kč'],['dpsYears',1,50,1,'let']
 ];
 const nf=new Intl.NumberFormat('cs-CZ',{maximumFractionDigits:2});
 const mounted=[];
 for(const [id,min,max,step,unit] of configs){
  const number=document.getElementById(id);if(!number||number.type!=='number')continue;
  const field=number.closest('.form-field'),label=field?.querySelector('label');if(!field)continue;
  const wrap=document.createElement('div');wrap.className='ffg-slider';
  const line=document.createElement('div');line.className='ffg-slider-caption';
  const title=document.createElement('span');title.textContent='Rychlé nastavení';
  const value=document.createElement('output');value.setAttribute('for',id);line.append(title,value);
  const range=document.createElement('input');range.type='range';range.min=String(min);range.max=String(max);
  range.step=String(step);range.setAttribute('aria-label','Posuvník: '+(label?.textContent||id));
  const limits=document.createElement('div');limits.className='ffg-slider-limits';
  limits.innerHTML='<span>'+nf.format(min)+' '+unit+'</span><span>'+nf.format(max)+' '+unit+'</span>';
  wrap.append(line,range,limits);field.append(wrap);
  function sync(){
    const val=Number(number.value);if(!Number.isFinite(val))return;
    if(val>Number(range.max)){range.max=String(Math.ceil(val/step)*step);limits.lastElementChild.textContent=nf.format(Number(range.max))+' '+unit;}
    if(val<Number(range.min)){range.min=String(Math.floor(val/step)*step);limits.firstElementChild.textContent=nf.format(Number(range.min))+' '+unit;}
    range.value=String(val);value.textContent=nf.format(val)+' '+unit;
    const percent=(val-Number(range.min))/(Number(range.max)-Number(range.min)||1)*100;
    range.style.setProperty('--progress',Math.max(0,Math.min(100,percent))+'%');
  }
  range.addEventListener('input',()=>{number.value=range.value;number.dispatchEvent(new Event('input',{bubbles:true}));sync();});
  number.addEventListener('input',sync);mounted.push(sync);sync();
 }
 window.syncFfgSliders=()=>mounted.forEach(update=>update());
})();
