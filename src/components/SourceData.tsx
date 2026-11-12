import { useRef } from 'react';
import { FileSpreadsheet, UploadCloud } from 'lucide-react';

type Props = {
  fileName: string;
  itemCount: number;
  monthCount: number;
  onUpload: (file: File) => Promise<void>;
};

/** Len tlačidlo pred nahratím; informácie o súbore sa zobrazia až po importe. */
export function SourceData({ fileName, itemCount, monthCount, onUpload }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <section className="panel">
      <div className="panel-top"><div>
        <h2><FileSpreadsheet size={19}/> Zdrojové dáta</h2>
        <p>Nahraj Excel súbor vo formáte .xlsx</p>
      </div></div>
      <div className="uploadrow">
        {fileName && <div className="uploadfile">
          <strong>{fileName}</strong>
          <span>{itemCount} položiek · {monthCount} mesiacov</span>
        </div>}
        <button type="button" className="secondary" onClick={() => inputRef.current?.click()}>
          <UploadCloud size={16}/> Nahraj súbor Excel (.xlsx)
        </button>
        <input
          ref={inputRef} type="file" accept=".xlsx" hidden
          aria-label="Nahraj súbor Excel .xlsx"
          onChange={(event) => {
            const file = event.currentTarget.files?.[0];
            if (file) void onUpload(file);
            event.currentTarget.value = '';
          }}
        />
      </div>
    </section>
  );
}
