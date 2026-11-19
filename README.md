# FFG Advisor · v1.0

Přehledná statická pracovní aplikace pro české finanční poradenství. Výpočty DPS,
DIP, investic, vkladů, hypoték, potřeb pojistného krytí a porovnání variant,
plus katalog tržních podkladů. Starobní a invalidní důchody i IOLDP byly
na žádost vlastníka kompletně vyřazeny z uživatelského rozhraní a nasazení.

## Nasazení – GitHub → Cloudflare Workers Builds

- Produkční projekt: `ffg-advisor`, repozitář `tobik640/ffg-advisor`.
- **Build command:** `bash build.sh`.
- **Deploy command:** `npx wrangler deploy --assets ./dist`.
- Konfigurace: `wrangler.jsonc` (name, compatibility_date, assets.directory).
- `build.sh` vytváří `dist/` z přímo upravitelného `index.html` a kopíruje JS,
  manifest, service worker a všechny ikony.
- Historické komprimované payloady zůstávají v Gitu jako kontrolní body;
  aktuální vydání už není potřeba komprimovat při úpravách.

## Vývoj

Vývojový zdroj pro v1.0 je `index.html` a modulární soubory
`advisor-v05.js`, `charts-v05.js`, `workspace-v06.js`, `redesign-v06.css`,
`rate-products-v07.js`, `range-controls-v07.js`, `workspace-v08.js`
a `redesign-v08.css`, dále `workspace-v09.js`, `redesign-v09.css` a `product-binding-v10.js`.
Modul v1.0 spojuje výběr instituce s fondem či ilustračním typem produktu.
Každá změna výběru předvyplní scénářový výnos a náklady a okamžitě přepočítá
výsledky. U investic a DIP nejde o skutečné úrokové sazby ani garantované
podmínky společnosti. Bez doloženého sazebníku jsou náklady explicitně označeny
jako ilustrační. U DPS je k vybraným ověřeným fondům připojen oficiální zdroj;
výnos je i zde ilustrační a zjednodušený model nezahrnuje odměny ze zhodnocení.
Redesign zachovává černo-zlatou identitu, ale používá tmavě petrolejovou pracovní plochu,
kontrastní grafy, přehlednější vstupy a čitelnější výsledky. Obsahuje
rychlou navigaci Ctrl/⌘+K a přepracovaný dashboard.
Každá kalkulačka zobrazuje tři záměrně vybrané klíčové výsledky. Povinné
ekonomické předpoklady (např. poplatky, věk pro daňovou podporu, sazba po
fixaci) jsou viditelné, zatímco méně častá nastavení jsou rozbalovací.
Duplicitní tlačítka přepočtu jsou odstraněna: každá změna okamžitě spustí
výpočet. Invalidní zadání skryje zastaralý výsledkový souhrn.
Grafy lze přepnout na tabulku všech modelových období. Vhodné kalkulačky
obsahují i koláčový rozklad vkladů a výnosu, s vynecháním negativního rozkladu.
I v režimu tabulky lze vybrat zobrazované řady a exportovat je do CSV.
Grafy mají interaktivní tooltip, volitelné řady, posuvník času a režim zvětšení; zobrazují klientovy vklady,
zaměstnavatelské a státní příspěvky, scénáře, poplatky i inflaci podle typu
výpočtu. Model investičního nástroje synchronizuje výnosové a nákladové vstupy.
Výběr banky a produktu vyplňuje konkrétní sazbu, další úroková pásma a
podmínky s odkazem na primární zdroj. Spořicí účty se liší podle nároku
na bonus; ruční úprava sazby přepne produkt do vlastního scénáře. Výběr
hypoteční banky použije pouze datovanou referenční sazbu „od“, nenahrazuje
individuální nabídku banky. Ruční změna sazby či fixace zruší přiřazení
referenční hypoteční nabídky; ruční změna úroku či pásma zruší výpočet podle
původního produktu. Číselné vstupy zůstávají editovatelné vedle
posuvníků, které přesně kopírují i hodnoty mimo svůj obvyklý krok.
Zjednodušená analýza pojištění řeší pouze finanční potřebu při smrti,
invaliditě a pracovní neschopnosti. U PN nepřičítá automaticky celý dluh;
pojišťovna ani její název nemění výpočet ceny.
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
- Ručně změněná sazba spoření nevypočítává skrytě původní pásma banky.
- Změna sazby nebo fixace hypotéky zruší vazbu na referenční nabídku.
- Pokud se úvěr doplatí před fixací, zůstatek po fixaci je 0 Kč.
- Ručně zadaných 4,89 % se na posuvníku zobrazuje přesně, ne jako 4,90 %.
- Základní test pojištění v režimu PN nepočítá jednorázové doplacení hypotéky.
- Negativní vstupy se zviditelní jako chybný údaj, neukládají se tiše jako nula.

## Odborné a bezpečnostní omezení

Nejde o produkční klientský informační systém. **Není přihlášení, oprávnění,
auditní stopa, databáze ani serverové zabezpečení klientských dokumentů.**
Proto zde nezadávat reálné osobní, zdravotní nebo finanční údaje klientů.

Spořicí sazby byly naposledy porovnány s veřejnými informacemi institucí
**18. 11. 2026**, hypoteční sazby zůstávají orientačním přehledem k 13. 11. 2026.
**Nejde o živý cenový feed.** Je vytvořena samostatná ChatGPT automatizace,
která se každý měsíc pokusí ověřit nové sazebníky a bezpečně aktualizovat
údaje v GitHub repozitáři; první běh se uskuteční 1. 12. 2026.
Sazba je přepsána pouze po doloženém ověření oficiálního zdroje a úspěšném
nasazení. Neověřitelné položky zůstanou označené jako staré. Automatizace
zatím nemá ověřený úspěšný bezobslužný běh a nenahrazuje kontrolu u banky.
Po uplynutí 14 dní aplikace vyznačí nutnost nového ověření. Právní parametry se mohou
měnit. Vzorce jsou orientační;
pro hypoteční sazby, investiční produkty a pojistná krytí je rozhodující
skutečná nabídka poskytovatele. Všechna zhodnocení zůstávají hypotetická.
Před nasazením do práce s klienty je nutné nezávislé odborné ověření pravidel,
aktualizace produktových dat, autentizace a ochrana osobních údajů.

## Relevantní oficiální zdroje

- [Ministerstvo financí – státní příspěvek DPS](https://mf.gov.cz/cs/ministerstvo/media/tiskove-zpravy/2024/zmeny-statniho-prispevku-ve-iii-penzijnim-piliri-56059)
- [Finanční správa – daňová podpora spoření na stáří](https://financnisprava.gov.cz/cs/dane/dane/dan-z-prijmu/zamestnanci-zamestnavatele/obecne-informace)

