import { FileCheck2, FileUp, RotateCcw } from 'lucide-react';

type Props = {
  selectedName: string;
  isCustom: boolean;
  onUpload: (file: File) => Promise<void>;
  onReset: () => void;
};

export function TemplatePicker({ selectedName, isCustom, onUpload, onReset }: Props) {
  return <section className="panel template-picker">
    <h2><FileCheck2 size={19}/> Word šablóna protokolu</h2>
    <p className="template-hint">Ak nenahráš vlastnú šablónu, použije sa prednastavená šablóna. Môžeš tiež nahrať inú šablónu s rovnakými značkami.</p>
    <div className="template-file">
      <div className="template-file-info"><FileCheck2 size={22}/><div><strong>{isCustom ? selectedName : 'Použije sa prednastavená šablóna'}</strong>{isCustom && <small>Vlastná nahraná šablóna</small>}</div></div>
      <div className="template-controls">
        <label className="secondary template-upload"><FileUp size={17}/> Nahrať vlastnú .docx
          <input type="file" accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={e=>{
            const file=e.target.files?.[0];
            if(file) void onUpload(file);
            e.currentTarget.value='';
          }}/>
        </label>
        {isCustom && <button type="button" className="secondary" onClick={onReset}><RotateCcw size={16}/> Obnoviť predvolenú</button>}
      </div>
    </div>
    <p className="template-hint">Podporované: upraviteľný Word (.docx). Vlastné šablóny musia obsahovať značky ako <code>{'{meno_sportovca}'}</code>, <code>{'{polozka_1}'}</code>, <code>{'{suma_1}'}</code> a <code>{'{spolu}'}</code>.</p>
  </section>;
}
