# Nasazení FFG Advisor na Cloudflare Pages

1. Přihlas se na https://dash.cloudflare.com/
2. Otevři **Workers & Pages** → **Create application** → **Pages** → **Connect to Git**.
3. Připoj GitHub účet a povol Cloudflare přístup pouze k repozitáři `tobik640/ffg-advisor`.
4. Vyber repozitář `ffg-advisor` a větev `main`.
5. Nastav:
   - Framework preset: **None**
   - Build command: `bash build.sh`
   - Build output directory: `dist`
   - Root directory: `/`
6. Klikni na **Save and Deploy**.

Po úspěšném buildu Cloudflare zobrazí adresu projektu ve tvaru `https://název-projektu.pages.dev`.

## Poznámka k soukromí
Samotný GitHub repozitář je Private, ale web nasazený na Pages je veřejně dostupný na internetu, pokud nepřidáš přístupovou ochranu. Před použitím se skutečnými klientskými údaji je nutné nejprve nastavit autentizaci a serverovou ochranu. Aktuální prototyp klientská data a přihlášení vůbec neřeší.
