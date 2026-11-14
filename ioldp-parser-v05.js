/* ČSSZ Informativní výpis konta parser – no network, no personal-data retention.
   Works in browser and Node for regression tests. */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  root.FFGIoldpParser=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const DATE='([0-3]?\\d\\.\\s*[01]?\\d\\.\\s*(?:19|20)\\d{2})';
  const PATTERN=new RegExp(DATE+'\\s*(?:[-–—]|až|do)?\\s*'+DATE+'(?:\\s+(\\d{1,5})(?=\\s|$))?','g');
  const SECTION=/(?:přehled\s+dob\s+neevidovan(?:ých|é|y)|přehled\s+neevidovan(?:ých|é|y)\s+dob|neevidovan(?:é|ých)\s+doby|nezjištěn(?:é|ých)\s+doby|chybějící\s+doby)/i;
  const END=/celkový\s+počet\s+neevidovaných\s+dob\s+činí|celkový\s+součet\s+neevidovaných\s+dob|poučení\s*:/i;

  function dateOf(raw){
    const match=String(raw).match(/^(\d{1,2})\.\s*(\d{1,2})\.\s*(\d{4})$/);
    if(!match)return null;
    const d=Number(match[1]),m=Number(match[2]),y=Number(match[3]);
    const dt=new Date(Date.UTC(y,m-1,d));
    if(dt.getUTCFullYear()!==y||dt.getUTCMonth()!==m-1||dt.getUTCDate()!==d)return null;
    return {iso:y+'-'+String(m).padStart(2,'0')+'-'+String(d).padStart(2,'0'),ms:dt.getTime()};
  }
  function daysBetween(from,to){
    const a=Date.parse(from+'T00:00:00Z'),b=Date.parse(to+'T00:00:00Z');
    return Number.isFinite(a)&&Number.isFinite(b)?Math.round((b-a)/86400000)+1:NaN;
  }
  function totalOf(text,regex){
    const match=text.match(regex);
    return match?Number(match[1].replace(/\D/g,'')):null;
  }
  function yearsAndDays(days){
    return Number.isFinite(days)?{years:Math.floor(days/365),days:days%365}:null;
  }
  function parse(input){
    const raw=String(input||'').slice(0,2000000),flat=raw.replace(/\u00a0/g,' ').replace(/\s+/g,' ').trim();
    const sectionMatch=SECTION.exec(flat),hasSection=Boolean(sectionMatch);
    const recordedDays=totalOf(flat,/celkový\s+počet\s+evidovaných\s+dob\s+činí\s*:\s*([\d\s]+)\s*dn[ůy]/i);
    const substitutedDays=totalOf(flat,/náhradní\s+doba\s+pojištění\s+činí\s*:\s*([\d\s]+)\s*dn[ůy]/i);
    const declaredMissingDays=totalOf(flat,/celkový\s+počet\s+neevidovaných\s+dob\s+činí\s*:\s*([\d\s]+)\s*dn[ůy]/i);
    const warnings=[],periods=[];
    if(!hasSection){warnings.push('Nepodařilo se rozpoznat sekci neevidovaných dob. Ostatní data nepovažujeme za chybějící roky.');}
    if(flat.length<80){warnings.push('Dokument pravděpodobně nemá čitelnou textovou vrstvu. Je nutné OCR nebo textový originál ČSSZ.');}
    if(hasSection){
      const after=flat.slice(sectionMatch.index+sectionMatch[0].length);
      const end=END.exec(after);
      const zone=(end?after.slice(0,end.index):after.slice(0,22000));
      const now=new Date().toISOString().slice(0,10);
      PATTERN.lastIndex=0;
      let match;
      while((match=PATTERN.exec(zone))!==null&&periods.length<100){
        const a=dateOf(match[1]),b=dateOf(match[2]);
        if(!a||!b||a.ms>b.ms||b.iso>now)continue;
        const duration=daysBetween(a.iso,b.iso),listed=match[3]===undefined?null:Number(match[3]);
        if(periods.some(x=>x.start===a.iso&&x.end===b.iso))continue;
        const consistent=listed===null||listed===duration;
        periods.push({start:a.iso,end:b.iso,days:duration,listedDays:listed,consistent});
        if(!consistent)warnings.push('ČSSZ a datumový výpočet se liší u období '+a.iso+' až '+b.iso+'; zkontroluj originál.');
      }
      if(!periods.length)warnings.push('Sekce neevidovaných dob existuje, ale nebylo možné přečíst její řádky.');
    }
    const calculatedMissingDays=periods.reduce((sum,p)=>sum+p.days,0);
    const statementMatches=declaredMissingDays===null||calculatedMissingDays===declaredMissingDays;
    if(hasSection&&declaredMissingDays!==null&&!statementMatches)warnings.push('Součet rozpoznaných intervalů nesouhlasí s celkovým počtem neevidovaných dní ve výpisu.');
    if(recordedDays===null)warnings.push('Nepodařilo se zjistit celkový počet evidovaných dní. Údaj doplň ručně.');
    return {
      format:hasSection?'CSSZ-NEEVIDOVANE-DOBY':'UNRECOGNIZED',
      hasSection,periods,recordedDays,substitutedDays,declaredMissingDays,
      calculatedMissingDays,statementMatches,
      valid:hasSection&&periods.length>0&&periods.every(p=>p.consistent)&&statementMatches,
      warnings,description:'Neevidovaná doba znamená, že ČSSZ daný úsek nemá evidovaný jako pojištěný nebo náhradní. Sama o sobě nepotvrzuje právo na započtení.'
    };
  }
  return {parse,dateOf,daysBetween,yearsAndDays};
});
