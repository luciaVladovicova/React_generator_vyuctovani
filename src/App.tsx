import { useMemo, useState } from 'react';
import { ArrowDownToLine, Check, CheckCircle2, FileSpreadsheet, FileText, Info, Layers3, ShieldCheck } from 'lucide-react';
import { MONTHS, INITIAL_DETAILS, amountToCents, parseWorkbook } from './model';
import type { Details, Expense } from './model';
import { createWord, saveBlob } from './word';
import { SourceData } from './components/SourceData';
import { DetailsForm } from './components/DetailsForm';
import { ExpenseTable } from './components/ExpenseTable';
import { DocumentOptions } from './components/DocumentOptions';
import { Summary, DocumentPreview } from './components/SummaryAndPreview';

export default function App() {
  // Úvodný stav je naozaj prázdny. Údaje sa nikdy nenačítavajú automaticky.
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [fileName, setFileName] = useState('');
  const [month, setMonth] = useState('');
  const [details, setDetails] = useState<Details>({ ...INITIAL_DETAILS });
  const [aggregate, setAggregate] = useState(true);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

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
      setMessage(`Načítaných ${parsed.length} položiek.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Excel sa nepodarilo načítať.');
    }
  }
  async function download() {
    if (!selected.length || busy) return;
    setBusy(true);
    setMessage('');
    try {
      const blob = await createWord(details, month, expenses, aggregate);
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

  const exportButton = (className: string, label: string) => (
    <button className={`primary ${className}`} type="button" onClick={() => void download()} disabled={!selected.length || busy}>
      <ArrowDownToLine size={18}/>{busy ? 'Generujem dokument...' : label}
    </button>
  );

  return <div className="app">
    <aside className="sidebar">
      <div className="brand-icon"><Layers3 size={22}/></div>
      <div className="brand">Športové<br/>vyúčtovania<span>GENERÁTOR DOKUMENTOV</span></div>
      <div className="side-label">PRACOVNÝ PRIESTOR</div>
      <div className="nav-item active"><FileText size={19}/> Nové vyúčtovanie</div>
      <div className="nav-item"><FileSpreadsheet size={19}/> Evidencia položiek</div>
      <div className="side-bottom"><ShieldCheck size={18}/><span>Údaje sa spracúvajú lokálne v prehliadači.</span></div>
    </aside>
    <main>
      <header className="topbar"><span>Vyúčtovania <span className="muted">/ Nový protokol</span></span>
        <span className="top-right"><span className="status-dot"/> {expenses.length ? 'Excel načítaný' : 'Čaká na Excel'}</span>
      </header>
      <div className="content">
        <div className="eyebrow">VYÚČTOVANIE TRÉNINGOVEJ PRÍPRAVY</div>
        <div className="head"><div><h1>Nové vyúčtovanie</h1><p>Nahraj Excel, vyber mesiac a vygeneruj protokol.</p></div>
          {exportButton('header-export', 'Exportovať DOCX')}</div>
        <div className="progress">
          <div className="step"><span className={`bubble ${expenses.length ? 'done' : 'current'}`}>{expenses.length ? <Check size={16}/> : '1'}</span><span>Načítanie evidencie</span></div>
          <div className="step-line"/>
          <div className="step"><span className={`bubble ${expenses.length ? 'current' : ''}`}>2</span><span>Výber položiek</span></div>
          <div className="step-line"/><div className="step"><span className="bubble">3</span><span>Export protokolu</span></div>
        </div>
        <div className="layout">
          <div className="leftcol">
            <SourceData fileName={fileName} itemCount={expenses.length} monthCount={months.length} onUpload={upload}/>
            <DetailsForm details={details} onChange={updateDetail}/>
            <ExpenseTable loaded={Boolean(fileName)} months={months} month={month} expenses={currentExpenses} onMonthChange={setMonth} onToggle={toggleExpense} onSelectAll={selectAll}/>
          </div>
          <div className="rightcol">
            <Summary details={details} month={month} count={selected.length} total={total}/>
            <DocumentOptions aggregate={aggregate} onAggregateChange={setAggregate} details={details} onChange={updateDetail}/>
            <DocumentPreview details={details} month={month} count={selected.length} total={total}/>
            {exportButton('bottom-export', 'Vygenerovať Word (.docx)')}
            <div className="hint"><CheckCircle2 size={16}/> Na export nepotrebuješ Microsoft Word.</div>
          </div>
        </div>
        {message && <div className="toast" role="status"><Info size={18}/>{message}<button onClick={() => setMessage('')} aria-label="Zavrieť upozornenie">×</button></div>}
      </div>
    </main>
  </div>;
}
