/** Vyplnenie pôvodnej Word šablóny bez prepisovania jej štýlov a loga. */
import Docxtemplater from 'docxtemplater';
import PizZip from 'pizzip';
import type { Details, DocumentRow } from './model';
import { euro, formatDate } from './model';

export const DEFAULT_TEMPLATE_NAME = 'Sablona_vyuctovania_SZTPS_nove_logo_upravene.docx';
export const DEFAULT_TEMPLATE_URL = `${import.meta.env.BASE_URL}${DEFAULT_TEMPLATE_NAME}`;

const REQUIRED_TAGS = ['meno_sportovca', 'iban', 'datum_pripravy', 'sport', 'polozka_1', 'suma_1', 'poznamka_1', 'spolu', 'datum_zuctovania'];

/** Načítava sa z public/ — GitHub Pages používa nastavenú BASE_URL. */
export async function fetchDefaultTemplate(): Promise<ArrayBuffer> {
  const response = await fetch(DEFAULT_TEMPLATE_URL);
  if (!response.ok) throw new Error('Predvolenú šablónu sa nepodarilo načítať. Skontroluj súbor v priečinku public.');
  return await response.arrayBuffer();
}

function makeZip(data: ArrayBuffer): PizZip {
  try { return new PizZip(data); }
  catch { throw new Error('Súbor nie je platný dokument Word (.docx).'); }
}

/** Overí požadované značky; ich poradie aj rozloženie môže používateľ meniť. */
export function validateTemplate(data: ArrayBuffer): void {
  const zip = makeZip(data);
  const xml = zip.file('word/document.xml')?.asText();
  if (!xml) throw new Error('Chýba obsah Word dokumentu. Nahraj súbor .docx.');
  // Vyťahovanie textu aj v prípade, keď Word rozdelil značky medzi niekoľko w:t uzlov.
  const dom = new DOMParser().parseFromString(xml, 'application/xml');
  const nodes = Array.from(dom.getElementsByTagNameNS('http://schemas.openxmlformats.org/wordprocessingml/2006/main', 't'));
  const flat = nodes.map(node => node.textContent ?? '').join('');
  const missing = REQUIRED_TAGS.filter(tag => !flat.includes(`{${tag}}`));
  if (missing.length) throw new Error(`Šablóna nemá potrebné značky: ${missing.map(tag => `{${tag}}`).join(', ')}. Použi pripravenú šablónu SZTPŠ alebo do Wordu pridaj tieto značky.`);
}

/**
 * Dynamicky vytvorí v tabuľke presne N riadkov položiek.
 * Ako vzor použije prvý riadok s {polozka_1}: kopíruje sa jeho
 * orámovanie, šírky buniek aj štýl textu. Hlavička a riadok SPOLU
 * zostávajú nedotknuté.
 *
 * Funguje aj pri pôvodnej šablóne, ktorá obsahuje 3 vyplniteľné
 * a 4 prázdne riadky: všetky nahradí skutočným počtom položiek.
 */
function setDynamicTableRows(zip: PizZip, itemCount: number): void {
  const file = zip.file('word/document.xml');
  if (!file) throw new Error('Šablóna neobsahuje word/document.xml.');

  const parser = new DOMParser();
  const xml = parser.parseFromString(file.asText(), 'application/xml');
  if (xml.getElementsByTagName('parsererror').length) {
    throw new Error('Word šablóna má poškodenú vnútornú štruktúru XML.');
  }

  const wordNs = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
  const tables = Array.from(xml.getElementsByTagNameNS(wordNs, 'tbl'));
  const rowText = (row: Element) =>
    Array.from(row.getElementsByTagNameNS(wordNs, 't'))
      .map(node => node.textContent ?? '').join('');

  // Nájdeme konkrétnu tabuľku položiek; iných tabuliek sa nedotýkame.
  const table = tables.find(tbl =>
    Array.from(tbl.getElementsByTagNameNS(wordNs, 'tr'))
      .some(row => rowText(row).includes('{polozka_1}'))
  );
  if (!table) throw new Error('Šablóna musí obsahovať riadok s {polozka_1}.');

  // getElementsByTagNameNS je rekurzívne; vyberieme len priame riadky tabuľky.
  const tableRows = Array.from(table.children)
    .filter(child => child.localName === 'tr' && child.namespaceURI === wordNs);
  const firstItemIndex = tableRows.findIndex(row => rowText(row).includes('{polozka_1}'));
  const totalIndex = tableRows.findIndex((row, index) =>
    index > firstItemIndex && (rowText(row).includes('{spolu}') || rowText(row).includes('SPOLU'))
  );
  if (totalIndex < 0) {
    throw new Error('V tabuľke položiek chýba súhrnný riadok SPOLU / {spolu}.');
  }

  const templateRow = tableRows[firstItemIndex];
  const totalRow = tableRows[totalIndex];
  // Odstránime staré predvyplnené aj prázdne riadky (iba medzi položkou 1 a SPOLU).
  tableRows.slice(firstItemIndex, totalIndex).forEach(row => table.removeChild(row));

  for (let index = 1; index <= itemCount; index++) {
    const clone = templateRow.cloneNode(true) as Element;
    // Všetky placeholdery preberú index aktuálneho riadku.
    const cells = Array.from(clone.children)
      .filter(child => child.localName === 'tc' && child.namespaceURI === wordNs);
    cells.forEach((cell, cellIndex) => {
      const nodes = Array.from(cell.getElementsByTagNameNS(wordNs, 't'));
      for (const textNode of nodes) {
        const original = textNode.textContent ?? '';
        textNode.textContent = original.replace(
          /\{(polozka|suma|poznamka)_1\}/g,
          (_match, field: string) => `{${field}_${index}}`
        );
      }
      // Prvá bunka je poradové číslo. Upravíme iba jej číselný obsah.
      if (cellIndex === 0) {
        const numberNode = nodes.find(node => /^\s*1\s*$/.test(node.textContent ?? ''));
        if (numberNode) numberNode.textContent = String(index);
      }
    });
    table.insertBefore(clone, totalRow);
  }

  zip.file('word/document.xml', new XMLSerializer().serializeToString(xml));
}

export function renderTemplate(data: ArrayBuffer, details: Details, rows: DocumentRow[]): Blob {
  if (!rows.length) throw new Error('Najskôr vyber aspoň jednu položku na vyúčtovanie.');
  if (rows.some(row => !row.name.trim())) throw new Error('Každá položka protokolu potrebuje názov.');
  validateTemplate(data);
  const zip = makeZip(data);
  setDynamicTableRows(zip, rows.length);
  const totalCents = rows.reduce((sum, row) => sum + Math.round(row.amount * 100), 0);
  const values: Record<string, string> = {
    meno_sportovca: details.athlete,
    iban: details.iban,
    datum_pripravy: formatDate(details.trainingDate),
    sport: details.sport,
    spolu: euro(totalCents / 100),
    poznamka: details.notes,
    datum_zuctovania: formatDate(details.settlementDate),
  };
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    values[`polozka_${i + 1}`] = row?.name ?? '';
    values[`suma_${i + 1}`] = row ? euro(row.amount) : '';
    values[`poznamka_${i + 1}`] = row?.description ?? '';
  }
  // Voliteľná kategória pre vlastné budúce šablóny.
  values.kategoria = details.category;
  try {
    const document = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true, nullGetter: () => '' });
    document.render(values);
    return document.getZip().generate({ type: 'blob', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }) as Blob;
  } catch (error) {
    console.error('Chyba Word šablóny:', error);
    throw new Error('Nepodarilo sa vyplniť Word šablónu. Skontroluj, či značky {meno_sportovca}, {polozka_1} a ďalšie nie sú poškodené.');
  }
}
