# FFG Advisor · v0.4

Přehledná statická pracovní aplikace pro české finanční poradenství. Výpočty DPS,
DIP, investic, vkladů, hypoték, potřeb pojistného krytí, starobních a invalidních
důchodů a analýza kandidátních neevidovaných dob IOLDP.

## Nasazení – GitHub → Cloudflare Workers Builds

- Produkční projekt: `ffg-advisor`, repozitář `tobik640/ffg-advisor`.
- **Build command:** `bash build.sh`.
- **Deploy command:** `npx wrangler deploy --assets ./dist`.
- Konfigurace: `wrangler.jsonc` (name, compatibility_date, assets.directory).
- `build.sh` vytváří `dist/` z uloženého komprimovaného HTML a kopíruje JS,
  manifest, service worker a všechny ikony.
- Historický payload v0.3 v `payload/index.html.gz.b64.part*` zůstává v Gitu
  jako kontrolní bod. Nový je `payload/index.v04.html.gz.b64`.

## Vývoj

Vývojový zdroj pro v0.4 je původní `index.html` plus doplňující,
čitelný `advisor-v04.js`. Nový skript rozšiřuje a opravuje starší kalkulačky.
PDF import používá PDF.js z CDN a vyžaduje textovou vrstvu PDF; skeny zatím
nemají integrované OCR.

## Kontrolní scénáře

- Hypotéka 4 mil. Kč / 0 % / 30 let → splátka 11 111,11 Kč měsíčně před fixací.
- Investice 100 000 Kč / 0 Kč měsíčně / 0 % výnosu / 0 % poplatků → 100 000 Kč.
- DPS vlastní příspěvek 1 700 Kč při splněných podmínkách → 340 Kč státní příspěvek za měsíc.
- Dvě srovnávané varianty 0 % a 0 % poplatků / 1 000 Kč měsíčně / 20 let
  → každá 240 000 Kč (při nulovém počátečním vkladu).
- IOLDP: ukázkové dva intervaly v rozpoznané sekci se objeví na samostatné
  stránce jako nezařazené, v základním důchodu se nepřičtou automaticky.
- Negativní vstupy se zviditelní jako chybný údaj, neukládají se tiše jako nula.

## Odborné a bezpečnostní omezení

Nejde o produkční klientský informační systém. **Není přihlášení, oprávnění,
auditní stopa, databáze ani serverové zabezpečení klientských dokumentů.**
Proto zde nezadávat reálné osobní, zdravotní nebo finanční údaje klientů.

Sazby a finanční produkty jsou **datovaný snapshot k 14. 11. 2026**, nikoli živý
cenový feed. Právní parametry se mohou měnit. Vzorce jsou orientační;
pro oficiální důchod a uznání dob je rozhodující ČSSZ, u hypotečních sazeb
a pojistných produktů skutečná nabídka poskytovatele. Analýza IOLDP umí bezpečně
označit kandidáty v rozpoznatelné sekci, nikoli prokazatelně identifikovat
všechny chybějící doby libovolného PDF. OCR skenů není k dispozici.

## Relevantní oficiální zdroje

- [ČSSZ – Starobní důchod](https://www.cssz.cz/web/cz/starobni-duchod)
- [ČSSZ – Doba pojištění](https://www.cssz.cz/web/cz/doba-pojisteni)
- [Ministerstvo financí – státní příspěvek DPS](https://mf.gov.cz/cs/ministerstvo/media/tiskove-zpravy/2024/zmeny-statniho-prispevku-ve-iii-penzijnim-piliri-56059)
- [Finanční správa – daňová podpora spoření na stáří](https://financnisprava.gov.cz/cs/dane/dane/dan-z-prijmu/zamestnanci-zamestnavatele/obecne-informace)
