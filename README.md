# FFG Advisor · v0.6

Přehledná statická pracovní aplikace pro české finanční poradenství. Výpočty DPS,
DIP, investic, vkladů, hypoték, potřeb pojistného krytí a porovnání variant,
plus katalog tržních podkladů. Starobní a invalidní důchody i IOLDP byly
na žádost vlastníka kompletně vyřazeny z uživatelského rozhraní a nasazení.

## Nasazení – GitHub → Cloudflare Workers Builds

- Produkční projekt: `ffg-advisor`, repozitář `tobik640/ffg-advisor`.
- **Build command:** `bash build.sh`.
- **Deploy command:** `npx wrangler deploy --assets ./dist`.
- Konfigurace: `wrangler.jsonc` (name, compatibility_date, assets.directory).
- `build.sh` vytváří `dist/` z uloženého komprimovaného HTML a kopíruje JS,
  manifest, service worker a všechny ikony.
- Historický payload v0.3 v `payload/index.html.gz.b64.part*` zůstává v Gitu
  jako kontrolní bod. Nový je `payload/index.v06.html.gz.b64`.

## Vývoj

Vývojový zdroj pro v0.6 je `index.html` a modulární soubory
`advisor-v05.js`, `charts-v05.js`, `workspace-v06.js`, `redesign-v06.css`.
Redesign zachovává černo-zlatou identitu, ale používá světlou pracovní plochu,
kontrastní tmavé grafy, přehlednější vstupy a čitelnější výsledky. Obsahuje
rychlou navigaci Ctrl/⌘+K a přepracovaný dashboard.
Grafy mají interaktivní tooltip a režim zvětšení, zobrazují klientovy vklady,
zaměstnavatelské a státní příspěvky, scénáře, poplatky i inflaci podle typu
výpočtu. Model investičního nástroje synchronizuje výnosové a nákladové vstupy.
Starší důchodové moduly zůstávají v historických revizích repozitáře pro
rollback, ale už nejsou dostupné uživatelům na stránce.

## Kontrolní scénáře

- Hypotéka 4 mil. Kč / 0 % / 30 let → splátka 11 111,11 Kč měsíčně před fixací.
- Investice 100 000 Kč / 0 Kč měsíčně / 0 % výnosu / 0 % poplatků → 100 000 Kč.
- DPS vlastní příspěvek 1 700 Kč při splněných podmínkách → 340 Kč státní příspěvek za měsíc.
- Dvě srovnávané varianty 0 % a 0 % poplatků / 1 000 Kč měsíčně / 20 let
  → každá 240 000 Kč (při nulovém počátečním vkladu).
- Žádné položky navigace, dashboardu ani veřejně dostupné obsahové stránky
  nevystavují starobní důchod, invalidní důchod nebo IOLDP.
- Změna investičního modelu, produktu spoření nebo banky přepočítá související výsledek.
- Negativní vstupy se zviditelní jako chybný údaj, neukládají se tiše jako nula.

## Odborné a bezpečnostní omezení

Nejde o produkční klientský informační systém. **Není přihlášení, oprávnění,
auditní stopa, databáze ani serverové zabezpečení klientských dokumentů.**
Proto zde nezadávat reálné osobní, zdravotní nebo finanční údaje klientů.

Sazby a finanční produkty jsou **datovaný snapshot k 14. 11. 2026**, nikoli živý
cenový feed. Právní parametry se mohou měnit. Vzorce jsou orientační;
pro hypoteční sazby, investiční produkty a pojistná krytí je rozhodující
skutečná nabídka poskytovatele. Všechna zhodnocení zůstávají hypotetická.
Před nasazením do práce s klienty je nutné nezávislé odborné ověření pravidel,
aktualizace produktových dat, autentizace a ochrana osobních údajů.

## Relevantní oficiální zdroje

- [Ministerstvo financí – státní příspěvek DPS](https://mf.gov.cz/cs/ministerstvo/media/tiskove-zpravy/2024/zmeny-statniho-prispevku-ve-iii-penzijnim-piliri-56059)
- [Finanční správa – daňová podpora spoření na stáří](https://financnisprava.gov.cz/cs/dane/dane/dan-z-prijmu/zamestnanci-zamestnavatele/obecne-informace)

