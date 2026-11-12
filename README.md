# Generátor vyúčtovania tréningovej prípravy (React)

Prvá verzia webovej aplikácie pre gebnerovanie vyučtovania

## Spustenie

Potrebujete **Node.js 20.19+ alebo 22.12+** a internet pri prvom inštalovaní balíčkov.

```bash
npm install
npm run dev
```

Otvorte adresu, ktorú vypíše terminál (obvykle http://localhost:5173).

## Použitie

1. Po otvorení sa automaticky načíta ukážkový súbor `public/vzor-evidencia.xlsx`.
2. Voliteľne kliknite na **Nahrať Excel** a vyberte vlastný súbor `.xlsx` alebo `.xls`.
3. Vyberte mesiac; v tabuľke odškrtnite položky, ktoré nemajú ísť do protokolu.
4. Vyplňte meno, IBAN, športové odvetvie, kategóriu a dátumy.
5. Predvolene sa vytvorí jeden súhrnný riadok za mesiac (ako na fotografii). Môžete prepnúť na rozpis položiek.
6. Kliknite **Exportovať DOCX** alebo **Vygenerovať Word (.docx)**. Dokument sa stiahne do priečinka Stiahnuté súbory.

## Pravidlá spracovania Excelu

- Očakáva aspoň stĺpce **Mesiac**, **Položka / služba** a **Cena spolu (€)**.
- Podporuje pôvodné stĺpce: ID, Mesiac, Dodávateľ, Položka / služba, Kategória, Množstvo, Jednotka, Cena spolu (€).
- Ignoruje prázdne riadky a súhrnné riadky s ID `Spolu`, aby nedochádzalo k dvojitému započítaniu.
- Sumy počíta v centoch, aby obmedzila chyby s desatinnou čiarkou.
- Spracuje aj viac hárkov s rovnakou štruktúrou.
- Jeden mesiac = jeden protokol; rok nastavujete dátumom prípravy. Ak Excel obsahuje rovnaké názvy mesiacov z viacerých rokov, pred importom ich treba oddeliť do jednotlivých súborov, alebo doplniť rok do dát.

## Poznámky

- Dokument obsahuje hlavičku SZTPŠ, informačnú tabuľku, položky, celkovú sumu, priestor na tri podpisy a dátum zúčtovania.
- **Logo nie je súčasťou generovaného Wordu**, pretože zdrojom je fotografia, nie pôvodný grafický súbor loga. Rozloženie je podobné vzoru, nie pixelovo totožné.
- Údaje športovca sa ukladajú iba lokálne v danom prehliadači (localStorage). Importované Excel údaje sa neodosielajú na server ani neukladajú do databázy.
- Pri prvom otvorení aplikácia načíta súbor so vzorovými údajmi vrátane konkrétnych nákupov dodaných v Exceli.
- Na zostavenie produkčnej verzie použite `npm run build` (výsledok bude v `dist/`).
- Použité závislosti: React, TypeScript, Vite, `xlsx` (SheetJS), `docx` a lucide-react.

## Ďalší rozvoj

Možno doplniť originálne logo, exaktne zhodnú Word šablónu, rok ako samostatný stĺpec v Exceli, históriu vyúčtovaní, kontrolu duplicitných vyúčtovaní a archiváciu.
