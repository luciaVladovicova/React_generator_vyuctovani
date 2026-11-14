import { Plus, Trash2 } from 'lucide-react';
import { euro, amountToCents } from '../model';
import type { Details, Expense, ProtocolGroup, ProtocolMode } from '../model';

type Props = {
  mode: ProtocolMode;
  onModeChange: (mode: ProtocolMode) => void;
  details: Details;
  onChange: (key: keyof Details, value: string) => void;
  groups: ProtocolGroup[];
  onAddGroup: () => void;
  onUpdateGroup: (id: string, key: 'name' | 'notes', value: string) => void;
  onRemoveGroup: (id: string) => void;
  assignments: Record<string, string>;
  onAssign: (expenseId: string, groupId: string) => void;
  selected: Expense[];
};

export function DocumentOptions(props: Props) {
  const { mode, onModeChange, details, onChange, groups, onAddGroup, onUpdateGroup, onRemoveGroup, assignments, onAssign, selected } = props;

  return <section className="panel settings">
    <h2>Podoba protokolu</h2>
    <p>Za jeden mesiac vznikne vždy jeden Word dokument. Vyber spôsob zobrazenia položiek.</p>

    <label className="option"><input type="radio" name="docstyle" checked={mode === 'summary'} onChange={() => onModeChange('summary')}/>
      <span><strong>Jedna súhrnná položka</strong><small>Jedna položka so sumou za mesiac, ako na fotografii.</small></span></label>
    <label className="option"><input type="radio" name="docstyle" checked={mode === 'groups'} onChange={() => onModeChange('groups')}/>
      <span><strong>Viacero vlastných položiek</strong><small>Pridáš riadky, pomenuješ ich a priradíš k nim nákupy z Excelu. Suma sa vypočíta automaticky.</small></span></label>
    <label className="option"><input type="radio" name="docstyle" checked={mode === 'details'} onChange={() => onModeChange('details')}/>
      <span><strong>Rozpis všetkých nákupov</strong><small>Každý vybraný nákup na samostatnom riadku.</small></span></label>

    {mode === 'summary' && <div className="fields-vertical">
      <label className="field">Názov položky<input value={details.expenseName} onChange={e => onChange('expenseName', e.target.value)}/></label>
      <label className="field">Poznámky do tabuľky<textarea rows={3} value={details.notes} placeholder="Bez vyplnenia sa použijú názvy položiek z Excelu" onChange={e => onChange('notes', e.target.value)}/></label>
    </div>}

    {mode === 'groups' && <div className="group-editor">
      <div className="group-help">Každý vybraný nákup patrí do jedného riadku protokolu. Zoznam a súčty sa prenesú do Wordu.</div>
      {groups.map((group, index) => {
        const assigned = selected.filter(item => (assignments[item.uid] || groups[0]?.id) === group.id);
        const sum = assigned.reduce((cents, item) => cents + amountToCents(item.amount), 0) / 100;
        return <div className="custom-group" key={group.id}>
          <div className="custom-group-head"><strong>Položka {index + 1}</strong>
            <button type="button" className="icon-btn" title="Odstrániť položku" aria-label={`Odstrániť položku ${index + 1}`} disabled={groups.length === 1} onClick={() => onRemoveGroup(group.id)}><Trash2 size={17}/></button></div>
          <label className="field">Názov položky<input value={group.name} placeholder="Napríklad Športový materiál" onChange={e => onUpdateGroup(group.id, 'name', e.target.value)}/></label>
          <label className="field">Poznámky<textarea rows={2} value={group.notes} placeholder="Nepovinné" onChange={e => onUpdateGroup(group.id, 'notes', e.target.value)}/></label>
          <div className="group-total">Priradené nákupy: <strong>{assigned.length}</strong><span>{euro(sum)}</span></div>
        </div>;
      })}
      <button type="button" className="secondary add-group" onClick={onAddGroup}><Plus size={16}/> Pridať ďalšiu položku</button>
      <h3>Priradenie nákupov k položkám</h3>
      {selected.map(item => <div className="assignment" key={item.uid}>
        <div className="assignment-name"><strong>{item.item}</strong><small>{euro(item.amount)}</small></div>
        <select aria-label={`Položka protokolu pre ${item.item}`} value={assignments[item.uid] || groups[0]?.id || ''} onChange={e => onAssign(item.uid, e.target.value)}>
          {groups.map((group, index) => <option key={group.id} value={group.id}>{group.name.trim() || `Položka ${index + 1}`}</option>)}
        </select>
      </div>)}
      {!selected.length && <p>Najskôr vyber nákupy v predchádzajúcom kroku.</p>}
    </div>}
  </section>;
}
