import { useMemo, useState } from 'react';
import { ArrowDownToLine, ArrowLeft, ArrowRight, Check, CheckCircle2, FileSpreadsheet, FileText, Info, Layers3, ShieldCheck } from 'lucide-react';
import { MONTHS, INITIAL_DETAILS, amountToCents, parseWorkbook } from './model';
import type { Details, DocumentRow, Expense, ProtocolGroup, ProtocolMode } from './model';
import { saveBlob } from './word';
import { fetchDefaultTemplate, renderTemplate, validateTemplate } from './templateWord';
import { TemplatePicker } from './components/TemplatePicker';
import { SourceData } from './components/SourceData';
import { DetailsForm } from './components/DetailsForm';
import { ExpenseTable } from './components/ExpenseTable';
import { DocumentOptions } from './components/DocumentOptions';
import { Summary, DocumentPreview } from './components/SummaryAndPreview';

const STEPS = ['Načítanie evidencie', 'Výber položiek', 'Podoba protokolu', 'Súhrn', 'Export'];
const FIRST_GROUP: ProtocolGroup = { id: 'group-1', name: 'Športový materiál', notes: '' };

export default function App() {
  const [step, setStep] = useState(0);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [fileName, setFileName] = useState('');
  const [month, setMonth] = useState('');
  const [details, setDetails] = useState<Details>({ ...INITIAL_DETAILS });
  const [mode, setMode] = useState<ProtocolMode>('summary');
  const [groups, setGroups] = useState<ProtocolGroup[]>([{ ...FIRST_GROUP }]);
  const [assignments, setAssignments] = useState<Record<string, string>>({});
  const [nextGroupId, setNextGroupId] = useState(2);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  // Šablóna sa predvolene načíta z public/ až pri exporte; vlastná ostáva v tomto otvorenom okne.
  const [customTemplate, setCustomTemplate] = useState<ArrayBuffer | null>(null);
  const [customTemplateName, setCustomTemplateName] = useState('');

  const months = useMemo(() => {
    const values = [...new Set(expenses.map(item => item.month))];
    return values.sort((a, b) => {
      const ai = MONTHS.findIndex(value => value.toLowerCase() === a.toLowerCase());
      const bi = MONTHS.findIndex(value => value.toLowerCase() === b.toLowerCase());
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    });
  }, [expenses]);

  const currentExpenses = expenses.filter(item => item.month === month);
  const selected = currentExpenses.filter(item => item.included);
  const total = selected.reduce((sum, item) => sum + amountToCents(item.amount), 0) / 100;

  // Všetky tri podoby protokolu sa prevádzajú na rovnaký formát riadkov.
  const rows: DocumentRow[] = useMemo(() => {
    if (mode === 'summary') return selected.length ? [{
      name: details.expenseName.trim() || 'Športový materiál',
      amount: total,
      description: details.notes.trim() || selected.map(item => item.item).join(', '),
    }] : [];
    if (mode === 'details') return selected.map(item => ({
      name: item.item,
      amount: item.amount,
      description: [item.supplier, item.category].filter(Boolean).join(' · '),
    }));
    return groups.map(group => {
      const assigned = selected.filter(item => (assignments[item.uid] || groups[0]?.id) === group.id);
      return {
        name: group.name.trim(),
        amount: assigned.reduce((sum, item) => sum + amountToCents(item.amount), 0) / 100,
        description: group.notes.trim() || assigned.map(item => item.item).join(', '),
      };
    }).filter(row => row.amount !== 0);
  }, [mode, selected, total, details, groups, assignments]);

  const invalidGroups = mode === 'groups' && rows.some(row => !row.name);
  const canExport = selected.length > 0 && !invalidGroups;
  const maxAvailableStep = !fileName ? 0 : !selected.length ? 1 : 4;

  function updateDetail(key: keyof Details, value: string) {
    setDetails(previous => ({ ...previous, [key]: value }));
  }
  function toggleExpense(uid: string) {
    setExpenses(previous => previous.map(item => item.uid === uid ? { ...item, included: !item.included } : item));
  }
  function selectAll(checked: boolean) {
    setExpenses(previous => previous.map(item => item.month === month ? { ...item, included: checked } : item));
  }
  async function upload(file: File) {
    if (!file.name.toLowerCase().endsWith('.xlsx')) {
      setMessage('Nahraj súbor typu .xlsx.');
      return;
    }
    try {
      const parsed = parseWorkbook(await file.arrayBuffer());
      const firstMonth = MONTHS.find(value => parsed.some(item => item.month.toLowerCase() === value.toLowerCase())) ?? parsed[0].month;
      setExpenses(parsed);
      setMonth(firstMonth);
      setFileName(file.name);
      setGroups([{ ...FIRST_GROUP }]);
      setAssignments({});
      setNextGroupId(2);
      setMessage(`Načítaných ${parsed.length} položiek. Môžeš pokračovať na výber položiek.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Excel sa nepodarilo načítať.');
    }
  }
  function changeMonth(value: string) {
    setMonth(value);
    setGroups([{ ...FIRST_GROUP }]);
    setAssignments({});
    setNextGroupId(2);
  }
  function addGroup() {
    setGroups(previous => [...previous, { id: `group-${nextGroupId}`, name: '', notes: '' }]);
    setNextGroupId(value => value + 1);
  }
  function updateGroup(id: string, key: 'name' | 'notes', value: string) {
    setGroups(previous => previous.map(group => group.id === id ? { ...group, [key]: value } : group));
  }
  function removeGroup(id: string) {
    if (groups.length <= 1) return;
    const fallback = groups.find(group => group.id !== id)?.id;
    if (!fallback) return;
    setGroups(previous => previous.filter(group => group.id !== id));
    setAssignments(previous => Object.fromEntries(Object.entries(previous).map(([uid, groupId]) => [uid, groupId === id ? fallback : groupId])));
  }
  function goNext() {
    if (step === 0 && !fileName) return setMessage('Najskôr nahraj Excel súbor.');
    if (step === 1 && !selected.length) return setMessage('Vyber aspoň jeden nákup.');
    if (step === 2 && invalidGroups) return setMessage('Vyplň názvy všetkých použitých položiek protokolu.');
    setMessage('');
    setStep(value => Math.min(4, value + 1));
  }
  async function uploadTemplate(file: File) {
    if (!file.name.toLowerCase().endsWith('.docx')) {
      setMessage('Šablóna musí byť súbor .docx.');
      return;
    }
    try {
      const data = await file.arrayBuffer();
      validateTemplate(data);
      setCustomTemplate(data);
      setCustomTemplateName(file.name);
      setMessage(`Šablóna ${file.name} bola načítaná. Použije sa pri exporte.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Šablónu sa nepodarilo načítať.');
    }
  }
  async function download() {
    if (!canExport || busy) return;
    setBusy(true);
    setMessage('');
    try {
      const templateBytes = customTemplate ?? await fetchDefaultTemplate();
      const blob = renderTemplate(templateBytes, details, rows);
      const name = `Vyuctovanie_${month}_${details.athlete || 'sportovec'}.docx`
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9_.-]+/g, '_');
      saveBlob(blob, name);
      setMessage(`Word dokument bol vytvorený: ${name}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Nepodarilo sa vytvoriť Word.');
    } finally {
      setBusy(false);
    }
  }

  return <div className="app">
    <aside className="sidebar">
      <div className="brand-icon"><Layers3 size={22}/></div>
      <div className="brand">Športové<br/>vyúčtovania<span>GENERÁTOR DOKUMENTOV</span></div>
      <div className="side-label">PRACOVNÝ PRIESTOR</div>
      <div className="nav-item active"><FileText size={19}/> Nové vyúčtovanie</div>
      <div className="side-bottom"><ShieldCheck size={18}/><span>Údaje sa spracúvajú lokálne v prehliadači.</span></div>
    </aside>
    <main>
      <header className="topbar"><span>Vyúčtovania <span className="muted">/ Nový protokol</span></span>
        <span className="top-right"><span className="status-dot"/> {fileName ? 'Excel načítaný' : 'Čaká na Excel'}</span>
      </header>
      <div className="content wizard-content">
        <div className="eyebrow">VYÚČTOVANIE TRÉNINGOVEJ PRÍPRAVY</div>
        <div className="head"><div><h1>Nové vyúčtovanie</h1><p>Prejdi jednotlivé kroky a vytvor Word protokol za jeden mesiac.</p></div></div>
        <nav className="progress wizard-progress" aria-label="Kroky vyúčtovania">
          {STEPS.map((name, index) => <button type="button" key={name}
            className={`wizard-step ${index === step ? 'is-current' : ''} ${index < step ? 'is-done' : ''}`}
            disabled={index > maxAvailableStep}
            aria-current={index === step ? 'step' : undefined}
            onClick={() => { setMessage(''); setStep(index); }}>
            <span className={`bubble ${index === step ? 'current' : ''} ${index < step ? 'done' : ''}`}>{index < step ? <Check size={16}/> : index + 1}</span>
            <span>{name}</span>
          </button>)}
        </nav>

        <div className="wizard-panel">
          {step === 0 && <><div className="wizard-intro"><h2><FileSpreadsheet size={20}/> Načítanie evidencie</h2><p>Začni nahratím súboru Excel (.xlsx). Žiadne vzorové údaje sa nenačítavajú.</p></div>
            <SourceData fileName={fileName} itemCount={expenses.length} monthCount={months.length} onUpload={upload}/></>}
          {step === 1 && <><div className="wizard-intro"><h2>Výber položiek</h2><p>Vyber mesiac a nákupy, ktoré sa majú zahrnúť do vyúčtovania.</p></div>
            <ExpenseTable loaded={Boolean(fileName)} months={months} month={month} expenses={currentExpenses} onMonthChange={changeMonth} onToggle={toggleExpense} onSelectAll={selectAll}/></>}
          {step === 2 && <><div className="wizard-intro"><h2>Podoba protokolu</h2><p>Vyplň údaje a urči, ako budú nákupy rozdelené do riadkov vo Worde.</p></div>
            <div className="wizard-stack"><DetailsForm details={details} onChange={updateDetail}/>
              <DocumentOptions mode={mode} onModeChange={setMode} details={details} onChange={updateDetail}
                groups={groups} onAddGroup={addGroup} onUpdateGroup={updateGroup} onRemoveGroup={removeGroup}
                assignments={assignments} onAssign={(uid, id) => setAssignments(previous => ({ ...previous, [uid]: id }))} selected={selected}/></div></>}
          {step === 3 && <><div className="wizard-intro"><h2>Súhrn vyúčtovania</h2><p>Skontroluj údaje a riadky, ktoré sa objavia vo výslednom dokumente.</p></div>
            <div className="wizard-stack"><Summary details={details} month={month} count={selected.length} total={total}/>
              <section className="panel"><h2>Riadky protokolu</h2><div className="table-scroll"><table className="items-table"><thead><tr><th>Položka</th><th>Poznámka</th><th className="right">Suma</th></tr></thead><tbody>
                {rows.map((row, index) => <tr key={`${index}-${row.name}`}><td><strong>{row.name || 'Bez názvu'}</strong></td><td>{row.description || '—'}</td><td className="right amount">{new Intl.NumberFormat('sk-SK', { style: 'currency', currency: 'EUR' }).format(row.amount)}</td></tr>)}
              </tbody></table></div></section>
              <TemplatePicker selectedName={customTemplateName} isCustom={Boolean(customTemplate)} onUpload={uploadTemplate} onReset={() => { setCustomTemplate(null); setCustomTemplateName(''); setMessage('Obnovená predvolená šablóna SZTPŠ.'); }}/>
              <DocumentPreview details={details} month={month} count={selected.length} total={total}/></div></>}
          {step === 4 && <><div className="wizard-intro"><h2>Export do Wordu</h2><p>Všetko je pripravené. Vygeneruj jeden dokument DOCX za vybraný mesiac.</p></div>
            <div className="wizard-stack"><Summary details={details} month={month} count={selected.length} total={total}/>
              <section className="panel export-panel"><CheckCircle2 size={36}/><h2>Pripravené na stiahnutie</h2>
                <p>Dokument bude obsahovať {rows.length} {rows.length === 1 ? 'riadok' : 'riadkov'} protokolu, celkovú sumu a podpisové miesta.</p>
                <p className="template-hint">{customTemplate ? 'Použitá vlastná šablóna:' : 'Použije sa prednastavená šablóna'} {customTemplate && <strong>{customTemplateName}</strong>}</p>
                <button className="primary export-main" type="button" onClick={() => void download()} disabled={!canExport || busy}>
                  <ArrowDownToLine size={19}/>{busy ? 'Generujem dokument...' : 'Vygenerovať Word (.docx)'}</button>
                <div className="hint"><CheckCircle2 size={16}/> Microsoft Word nie je potrebný na vytvorenie súboru.</div>
              </section></div></>}
        </div>
        <div className="wizard-actions">
          <button type="button" className="secondary" disabled={step === 0} onClick={() => { setStep(value => Math.max(0, value - 1)); setMessage(''); }}><ArrowLeft size={16}/> Späť</button>
          {step < 4 && <button type="button" className="primary" onClick={goNext}>Pokračovať <ArrowRight size={16}/></button>}
        </div>
        {message && <div className="toast" role="status"><Info size={18}/>{message}<button onClick={() => setMessage('')} aria-label="Zavrieť upozornenie">×</button></div>}
      </div>
    </main>
  </div>;
}
