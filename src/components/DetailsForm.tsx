import { Settings2 } from 'lucide-react';
import type { Details } from '../model';

type Props = { details: Details; onChange: (key: keyof Details, value: string) => void };
export function DetailsForm({ details, onChange }: Props) {
  const field = (title: string, key: keyof Details, type = 'text', placeholder = '') => (
    <label className="field" key={key}>{title}
      <input type={type} value={details[key]} placeholder={placeholder} onChange={event => onChange(key, event.target.value)}/>
    </label>
  );
  return <section className="panel">
    <div className="panel-top"><div><h2><Settings2 size={19}/> Údaje vyúčtovania</h2>
      <p>Údaje sa vložia do Word dokumentu.</p></div></div>
    <div className="form-grid">
      {field('Meno športovca', 'athlete')}
      {field('Športové odvetvie', 'sport')}
      {field('IBAN', 'iban', 'text', 'SK00 0000 0000 0000 0000 0000')}
      {field('Kategória športovca', 'category', 'text', 'Nepovinné')}
      {field('Dátum prípravy', 'trainingDate', 'date')}
      {field('Dátum zúčtovania', 'settlementDate', 'date')}
    </div>
  </section>;
}
