import { FileText, Info } from 'lucide-react';
import { euro } from '../model';
import type { Details } from '../model';

type Props = { details: Details; month: string; count: number; total: number };
export function Summary({ details, month, count, total }: Props) {
  return <section className="panel summary">
    <div className="summary-kicker">SÚHRN VYÚČTOVANIA</div><span>Celková suma</span>
    <div className="huge-total">{euro(total)}</div><div className="summary-sep"/>
    <div className="summary-line"><span>Obdobie</span><strong>{month || '—'}</strong></div>
    <div className="summary-line"><span>Počet položiek</span><strong>{count}</strong></div>
    <div className="summary-line"><span>Športovec</span><strong>{details.athlete || '—'}</strong></div>
  </section>;
}
export function DocumentPreview({ details, month, total }: Props) {
  return <section className="preview">
    <div className="preview-heading"><FileText size={18}/><strong>Čo bude vo Worde?</strong></div>
    <div className="preview-paper"><div className="paper-kicker">SLOVENSKÝ ZVÄZ TELESNE<br/>POSTIHNUTÝCH ŠPORTOVCOV</div>
      <div className="paper-title">VYÚČTOVANIE<br/>TRÉNINGOVEJ PRÍPRAVY</div>
      <div className="paper-row"><span>Športovec</span><b>{details.athlete || '—'}</b></div>
      <div className="paper-row"><span>Mesiac</span><b>{month || '—'}</b></div>
      <div className="paper-row"><span>Šport</span><b>{details.sport || '—'}</b></div>
      <div className="paper-rule"/><div className="paper-row total"><span>SPOLU</span><b>{euro(total)}</b></div>
      <div className="paper-signatures"><span>..............................<br/>podpis</span><span>..............................<br/>podpis</span></div>
    </div><p><Info size={15}/> Náhľad je zjednodušený. Word obsahuje kompletné tabuľky a podpisy.</p>
  </section>;
}
