'use strict';
const assert=require('node:assert/strict');
const test=require('node:test');
const parser=require('../ioldp-parser-v05.js');

const sample=`Informativní výpis konta
Celkový počet evidovaných dob činí: 5541 dnů, tj. 15 rok a 66 dnů
Náhradní doba pojištění činí: 357 dnů
Přehled dob neevidovaných
Doba od Doba do Dny
01.05.2005 31.03.2007 700
01.12.2007 30.04.2010 882
01.09.2010 28.02.2011 181
01.06.2011 30.09.2014 1218
Celkový počet neevidovaných dob činí: 2981 dnů, tj. 8 rok a 61 dnů`;

test('ČSSZ sample: four periods and all day totals agree',()=>{
  const r=parser.parse(sample);
  assert.equal(r.format,'CSSZ-NEEVIDOVANE-DOBY');
  assert.equal(r.valid,true);
  assert.deepEqual(r.periods.map(x=>x.days),[700,882,181,1218]);
  assert.equal(r.declaredMissingDays,2981);
  assert.equal(r.calculatedMissingDays,2981);
  assert.equal(r.recordedDays,5541);
  assert.equal(r.substitutedDays,357);
});

test('normal insured date ranges must not be treated as unrecorded',()=>{
  const r=parser.parse('Přehled dob pojištění 01.01.2020 31.12.2020 pojištění 366 dní');
  assert.equal(r.periods.length,0);
  assert.equal(r.hasSection,false);
});

test('reported duration mismatch produces a warning',()=>{
  const r=parser.parse('Přehled dob neevidovaných 01.01.2020 31.12.2020 365 Celkový počet neevidovaných dob činí: 365 dnů');
  assert.equal(r.periods[0].days,366);
  assert.equal(r.valid,false);
  assert.ok(r.warnings.some(x=>x.includes('liší')));
});

test('leap years and invalid calendar dates',()=>{
  assert.equal(parser.daysBetween('2020-02-28','2020-03-01'),3);
  assert.equal(parser.dateOf('31.02.2020'),null);
});
