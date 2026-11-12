# Generátor vyúčtovaní – čistá verzia

React + TypeScript aplikácia na import Excelu `.xlsx` a vytvorenie jedného Word protokolu za mesiac.

## Spustenie

```bash
npm install
npm run dev
```

Aplikácia sa otvorí na adrese zobrazenej v termináli (zvyčajne http://localhost:5173).

## Čo sa zmenilo

- Aplikácia začína **bez nahraného Excelu** a bez vyplneného športovca.
- Ukážkový Excel sa automaticky nenačítava a v balíku už nie je.
- V sekcii **Zdrojové dáta** je na začiatku iba tlačidlo **Nahraj súbor Excel (.xlsx)**.
- Po úspešnom importe sa zobrazí názov súboru, počet položiek a mesiace.
- Export Wordu zostáva vypnutý, pokým nie je vybraná aspoň jedna položka.
- Údaje formulára sa neukladajú do `localStorage`, takže pri opätovnom otvorení začína formulár prázdny.

## Orientácia v kóde

| Súbor | Účel |
| --- | --- |
| `src/main.tsx` | Spustenie React aplikácie – nemení sa skoro vôbec |
| `src/App.tsx` | Hlavný stav, výber mesiaca, import, generovanie DOCX |
| `src/components/SourceData.tsx` | Tlačidlo pre Excel |
| `src/components/DetailsForm.tsx` | Údaje o športovcovi |
| `src/components/ExpenseTable.tsx` | Výber položiek a mesiacov |
| `src/components/DocumentOptions.tsx` | Nastavenie súhrnného/podrobného protokolu |
| `src/components/SummaryAndPreview.tsx` | Súhrn a náhľad |
| `src/model.ts` | Typy, parser Excelu, mesiace, predvolené hodnoty |
| `src/word.ts` | Formát a tvorba Word protokolu |
| `src/style.css` | Vzhľad celej aplikácie |

## Formát Excelu

Očakáva stĺpce `Mesiac`, `Položka / služba` a `Cena spolu (€)`; voliteľne `ID`, `Dodávateľ`, `Kategória`, `Množstvo`, `Jednotka`. Riadky označené `Spolu` sa ignorujú.

Import prebieha lokálne v prehliadači.
