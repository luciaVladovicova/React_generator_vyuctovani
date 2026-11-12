import type { Details } from '../model';

type Props = { aggregate: boolean; onAggregateChange: (value: boolean) => void; details: Details; onChange: (key: keyof Details, value: string) => void };
export function DocumentOptions({ aggregate, onAggregateChange, details, onChange }: Props) {
  return <section className="panel settings">
    <h2>Podoba protokolu</h2><p>Jeden Word dokument za vybraný mesiac.</p>
    <label className="option"><input type="radio" name="docstyle" checked={aggregate} onChange={() => onAggregateChange(true)}/>
      <span><strong>Súhrnná položka</strong><small>Jedna položka so sumou za mesiac, ako na fotografii.</small></span>
    </label>
    <label className="option"><input type="radio" name="docstyle" checked={!aggregate} onChange={() => onAggregateChange(false)}/>
      <span><strong>Rozpis všetkých položiek</strong><small>Každý vybraný nákup na samostatnom riadku.</small></span>
    </label>
    {aggregate && <>
      <label className="field">Názov položky<input value={details.expenseName} onChange={e => onChange('expenseName', e.target.value)}/></label>
      <label className="field">Poznámky do tabuľky<textarea rows={3} value={details.notes} placeholder="Bez vyplnenia sa použijú názvy položiek z Excelu" onChange={e => onChange('notes', e.target.value)}/></label>
    </>}
  </section>;
}
