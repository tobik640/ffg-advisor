/* FFG Advisor 0.5: interactive, expandable SVG forecasts (zero dependencies). */
(function(){
  'use strict';
  const data=new Map(),preferences=new Map();let sequence=0,modal=null;
  const palette=['#e9c978','#76c5ac','#91b3ee','#e4a180','#b6a0de','#bfc1c5'];
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const fmt=v=>new Intl.NumberFormat('cs-CZ',{maximumFractionDigits:0}).format(v)+' Kč';
  const compact=v=>new Intl.NumberFormat('cs-CZ',{notation:'compact',maximumFractionDigits:1}).format(v);
  const svgW=780,svgH=330,left=83,right=23,top=28,bottom=46;
  const plotW=svgW-left-right,plotH=svgH-top-bottom;
  function buildChart(series,labels,aria){
    const named=series.filter(s=>Array.isArray(s?.values)&&s.values.length).map((s,i)=>({
      name:String(s.name||['Hodnota portfolia','Srovnání','Další řada'][i]||'Řada '+(i+1)),
      color:s.color||palette[i%palette.length],values:s.values.map(v=>Number.isFinite(Number(v))?Number(v):0)
    }));
    if(!named.length)return '<div class="notice">Graf nemá dostupná data.</div>';
    const length=Math.max(...named.map(s=>s.values.length));
    const ticks=Array.from({length},(_,i)=>String(labels?.[i]??i));
    const values=named.flatMap(s=>s.values),minimum=Math.min(0,...values),maximum=Math.max(1,...values),range=maximum-minimum||1;
    const x=i=>left+i*plotW/Math.max(1,length-1),y=v=>top+(maximum-v)*plotH/range;
    const key=String(aria||named.map(s=>s.name).join('|'));
    const selected=new Set(preferences.get(key)||named.map(s=>s.name));
    // A scenario can disappear between recalculations; always keep one series.
    if(!named.some(s=>selected.has(s.name)))selected.add(named[0].name);
    const id='ffg-chart-'+(++sequence);data.set(id,{named,ticks,length,key,selected});
    if(data.size>180)data.delete(data.keys().next().value);
    let markup='<svg viewBox="0 0 '+svgW+' '+svgH+'" role="img" tabindex="0" aria-label="'+esc(aria)+'; najeď myší nebo použij šipky pro detail hodnot">';
    for(let i=0;i<=5;i++){
      const value=maximum-(maximum-minimum)*i/5,py=y(value);
      markup+='<line x1="'+left+'" x2="'+(svgW-right)+'" y1="'+py+'" y2="'+py+'" stroke="#393a37" stroke-dasharray="4 5"/>';
      markup+='<text x="'+(left-13)+'" y="'+(py+4)+'" text-anchor="end" fill="#a9aa9f" font-size="11">'+esc(compact(value))+'</text>';
    }
    for(let i=0;i<length;i++)if(i===0||i===length-1||i%Math.max(1,Math.ceil(length/7))===0){
      markup+='<text x="'+x(i)+'" y="'+(svgH-12)+'" text-anchor="middle" fill="#b2a998" font-size="11">'+esc(ticks[i])+'</text>';
    }
    named.forEach(s=>{
      const points=s.values.map((v,i)=>(i===0?'M ':'L ')+x(i).toFixed(2)+' '+y(v).toFixed(2)).join(' ');
      markup+='<path data-line-name="'+esc(s.name)+'" d="'+points+'" stroke="'+esc(s.color)+'" stroke-width="3" stroke-linejoin="round" stroke-linecap="round" fill="none" vector-effect="non-scaling-stroke"'+(selected.has(s.name)?'':' style="display:none"')+'/>';
    });
    markup+='<line data-cursor="1" x1="0" x2="0" y1="'+top+'" y2="'+(svgH-bottom)+'" stroke="#fff" stroke-width="1" stroke-dasharray="5 4" opacity="0"/><g data-circles="1"></g></svg>';
    const legend=named.map(s=>'<button type="button" class="ffg-legend-item ffg-series-toggle'+(selected.has(s.name)?'':' muted')+'" data-series-toggle="'+esc(s.name)+'" aria-pressed="'+selected.has(s.name)+'" title="Zobrazit nebo skrýt řadu: '+esc(s.name)+'"><i style="background:'+esc(s.color)+'"></i>'+esc(s.name)+'</button>').join('');
    return '<div class="ffg-chart" data-chart-id="'+id+'"><div class="ffg-chart-tools"><div class="ffg-chart-help">Klikni na řady v legendě • posuvníkem vyber období • najeď myší pro hodnoty</div><button class="btn secondary small" type="button" data-chart-expand="1" aria-label="Zvětšit interaktivní graf">⤢ Zvětšit graf</button></div><div class="ffg-chart-surface">'+markup+'<div class="ffg-chart-tooltip" hidden></div></div><div class="ffg-chart-legend" aria-label="Zobrazené křivky grafu">'+legend+'</div><label class="ffg-chart-scrub-label">Zvolené období <input class="ffg-chart-scrubber" aria-label="Vybrat období na grafu" type="range" min="0" max="'+(length-1)+'" value="0" step="1"><output class="ffg-chart-scrub-value">'+esc(ticks[0])+'</output></label></div>';
  }
  window.lineChart=buildChart;
  // Expose only a read model for the advisor's chart/table switcher. The
  // canonical series and visibility preferences remain inside this module.
  window.FFGChartData={get:id=>data.get(id)||null};

  function hover(chart,index){
    const item=data.get(chart.dataset.chartId),svg=chart.querySelector('svg');if(!item||!svg)return;
    const i=Math.min(item.length-1,Math.max(0,index));chart.dataset.hoverIndex=i;
    const x=left+i*plotW/Math.max(1,item.length-1);
    const cursor=svg.querySelector('[data-cursor]');cursor.setAttribute('x1',String(x));cursor.setAttribute('x2',String(x));cursor.setAttribute('opacity','0.8');
    const all=item.named.flatMap(s=>s.values),minimum=Math.min(0,...all),maximum=Math.max(1,...all),range=maximum-minimum||1;
    const active=item.named.filter(s=>item.selected.has(s.name));
    svg.querySelector('[data-circles]').innerHTML=active.map(s=>{
      const value=s.values[Math.min(i,s.values.length-1)]??0;
      const y=top+(maximum-value)*plotH/range;
      return '<circle cx="'+x+'" cy="'+y+'" r="5" fill="'+esc(s.color)+'" stroke="#111" stroke-width="2" />';
    }).join('');
    const tooltip=chart.querySelector('.ffg-chart-tooltip');
    tooltip.innerHTML='<b>'+esc(item.ticks[i])+'</b>'+active.map(s=>'<div><span><i style="background:'+esc(s.color)+'"></i>'+esc(s.name)+'</span><strong>'+fmt(s.values[Math.min(i,s.values.length-1)]??0)+'</strong></div>').join('');
    tooltip.hidden=false;
    const scrub=chart.querySelector('.ffg-chart-scrubber'),scrubValue=chart.querySelector('.ffg-chart-scrub-value');
    if(scrub)scrub.value=String(i);if(scrubValue)scrubValue.textContent=item.ticks[i];
    const surface=chart.querySelector('.ffg-chart-surface');
    const cx=(x/svgW)*surface.clientWidth;
    tooltip.style.left=Math.max(6,Math.min(surface.clientWidth-tooltip.offsetWidth-6,cx-tooltip.offsetWidth/2))+'px';
    tooltip.style.top='8px';
  }
  function clearHover(chart){
    chart.querySelector('[data-cursor]')?.setAttribute('opacity','0');
    const circles=chart.querySelector('[data-circles]');if(circles)circles.innerHTML='';
    const tip=chart.querySelector('.ffg-chart-tooltip');if(tip)tip.hidden=true;
  }
  document.addEventListener('pointermove',event=>{
    const chart=event.target.closest?.('.ffg-chart'),svg=event.target.closest?.('svg');
    if(!chart||!svg||!data.has(chart.dataset.chartId))return;
    const rect=svg.getBoundingClientRect(),ratio=Math.max(0,Math.min(1,(event.clientX-rect.left)/Math.max(rect.width,1)));
    const plotRatio=Math.max(0,Math.min(1,(ratio*svgW-left)/plotW));
    const item=data.get(chart.dataset.chartId);hover(chart,Math.round(plotRatio*(item.length-1)));
  });
  document.addEventListener('pointerout',event=>{
    const chart=event.target.closest?.('.ffg-chart');
    if(chart&&event.target.closest('svg')&&!chart.querySelector('svg')?.contains(event.relatedTarget))clearHover(chart);
  });
  document.addEventListener('keydown',event=>{
    if(event.key==='Escape'&&modal){closeModal();return;}
    const chart=event.target.closest?.('.ffg-chart');
    if(chart&&['ArrowLeft','ArrowRight','Home','End'].includes(event.key)){
      const item=data.get(chart.dataset.chartId);if(!item)return;
      event.preventDefault();let current=Number(chart.dataset.hoverIndex||0);
      if(event.key==='ArrowLeft')current--;if(event.key==='ArrowRight')current++;
      if(event.key==='Home')current=0;if(event.key==='End')current=item.length-1;
      hover(chart,current);
    }
  });
  document.addEventListener('input',event=>{
    if(!event.target.matches?.('.ffg-chart-scrubber'))return;
    const chart=event.target.closest('.ffg-chart');if(chart)hover(chart,Number(event.target.value));
  });
  function closeModal(){if(!modal)return;modal.remove();modal=null;document.body.classList.remove('ffg-modal-open');}
  document.addEventListener('click',event=>{
    const toggle=event.target.closest?.('[data-series-toggle]');
    if(toggle){
      const chart=toggle.closest('.ffg-chart'),item=chart&&data.get(chart.dataset.chartId),name=toggle.dataset.seriesToggle;
      if(!item)return;
      if(item.selected.has(name)){if(item.selected.size===1)return;item.selected.delete(name)}else item.selected.add(name);
      preferences.set(item.key,new Set(item.selected));
      // Keep the enlarged chart and underlying chart synchronized.
      document.querySelectorAll('[data-chart-id="'+chart.dataset.chartId+'"]').forEach(instance=>{
        instance.querySelectorAll('[data-line-name]').forEach(path=>{path.style.display=item.selected.has(path.dataset.lineName)?'':'none'});
        instance.querySelectorAll('[data-series-toggle]').forEach(button=>{
          const visible=item.selected.has(button.dataset.seriesToggle);
          button.setAttribute('aria-pressed',String(visible));button.classList.toggle('muted',!visible);
        });
        clearHover(instance);
      });
      return;
    }
    if(event.target.closest?.('[data-chart-close]')){closeModal();return;}
    const button=event.target.closest?.('[data-chart-expand]');if(!button)return;
    const src=button.closest('.ffg-chart');if(!src)return;
    closeModal();modal=document.createElement('div');modal.className='ffg-chart-modal';modal.setAttribute('role','dialog');modal.setAttribute('aria-modal','true');modal.setAttribute('aria-label','Zvětšený interaktivní graf');
    modal.innerHTML='<div class="ffg-chart-modal-content"><div class="ffg-chart-modal-header"><b>Detailní vývoj v čase</b><button class="btn secondary small" type="button" data-chart-close="1">✕ Zavřít</button></div></div>';
    const clone=src.cloneNode(true);clone.querySelector('[data-chart-expand]')?.remove();clone.querySelector('[data-circles]').innerHTML='';clone.querySelector('.ffg-chart-tooltip').hidden=true;
    modal.querySelector('.ffg-chart-modal-content').append(clone);document.body.append(modal);document.body.classList.add('ffg-modal-open');
    modal.querySelector('[data-chart-close]').focus();
  });
})();

