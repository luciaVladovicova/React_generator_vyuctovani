import { ChevronDown, FolderOpen, RotateCcw } from 'lucide-react';
import { euro } from '../model';
import type { Expense } from '../model';

type Props = {
  loaded: boolean; months: string[]; month: string;
  expenses: Expense[]; onMonthChange: (month: string) => void;
  onToggle: (uid: string) => void; onSelectAll: (checked: boolean) => void;
};
export function ExpenseTable({ loaded, months, month, expenses, onMonthChange, onToggle, onSelectAll }: Props) {
  const selectedCount = expenses.filter(item => item.included).length;
  return <section className="panel items-panel">
    <div className="panel-top"><div><h2><FolderOpen size={19}/> Položky na vyúčtovanie</h2>
      <p>Vyber položky, ktoré chceš zahrnúť do protokolu.</p></div>
      <div className="month-select">
        <select aria-label="Vyber mesiac" disabled={!loaded} value={month} onChange={event => onMonthChange(event.target.value)}>
          {!loaded && <option value="">Najskôr nahraj Excel</option>}
          {months.map(name => <option key={name} value={name}>{name}</option>)}
        </select><ChevronDown size={16}/>
      </div>
    </div>
    <div className="table-scroll"><table className="items-table"><thead><tr>
      <th><input type="checkbox" aria-label="Vybrať všetky položky mesiaca" disabled={!expenses.length} checked={expenses.length > 0 && selectedCount === expenses.length} onChange={event => onSelectAll(event.target.checked)}/></th>
      <th>Položka / služba</th><th>Dodávateľ</th><th className="right">Suma</th>
    </tr></thead><tbody>
      {expenses.map(item => <tr key={item.uid} className={item.included ? '' : 'dim'}>
        <td><input type="checkbox" checked={item.included} onChange={() => onToggle(item.uid)} aria-label={`Zahrnúť ${item.item}`}/></td>
        <td><strong>{item.item}</strong><small>{item.category}</small></td>
        <td>{item.supplier}</td><td className="right amount">{euro(item.amount)}</td>
      </tr>)}
      {!expenses.length && <tr><td colSpan={4} className="empty">{loaded ? 'V tomto mesiaci nie sú položky.' : 'Najskôr nahraj Excel súbor (.xlsx).'}</td></tr>}
    </tbody></table></div>
    {loaded && <div className="table-footer"><span>{selectedCount} z {expenses.length} vybraných položiek</span>
      <button type="button" className="text-btn" onClick={() => onSelectAll(true)}><RotateCcw size={15}/> Obnoviť výber</button>
    </div>}
  </section>;
}
