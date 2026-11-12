import * as XLSX from 'xlsx';
export type Expense = { uid:string; id:string; month:string; supplier:string; item:string; category:string; quantity:string; unit:string; amount:number; included:boolean };
export type Details = { athlete:string; iban:string; category:string; sport:string; trainingDate:string; settlementDate:string; expenseName:string; notes:string };
export const MONTHS = ['Január','Február','Marec','Apríl','Máj','Jún','Júl','August','September','Október','November','December'];
export const INITIAL_DETAILS:Details = {athlete:'',iban:'',category:'',sport:'',trainingDate:'',settlementDate:'',expenseName:'Športový materiál',notes:''};
const canon=(v:unknown)=>String(v??'').trim().toLocaleLowerCase('sk-SK').replace(/\s+/g,' ');
const headerMap:Record<string,string>={'id':'id','mesiac':'month','dodávateľ':'supplier','dodavatel':'supplier','položka / služba':'item','polozka / sluzba':'item','položka':'item','kategória':'category','kategoria':'category','množstvo':'quantity','mnozstvo':'quantity','jednotka':'unit','cena spolu (€)':'amount','cena spolu':'amount','suma':'amount'};
export function euro(n:number){return new Intl.NumberFormat('sk-SK',{style:'currency',currency:'EUR'}).format(n)}
export function amountToCents(n:number){return Math.round((n+Number.EPSILON)*100)}
export function safeMoney(v:unknown):number {if(typeof v==='number')return Number.isFinite(v)?v:NaN;const x=String(v??'').replace(/\s|€|\u00a0/g,'').replace(',','.');return x?Number(x):NaN}
export function parseWorkbook(data:ArrayBuffer):Expense[]{
 const workbook=XLSX.read(data,{type:'array',cellDates:true});const rows:Expense[]=[];
 for(const sheetName of workbook.SheetNames){const sheet=workbook.Sheets[sheetName];const matrix=(XLSX.utils.sheet_to_json(sheet,{header:1,defval:'',blankrows:false}) as unknown[][]);
  const headerIndex=matrix.findIndex(row=>row.some(v=>canon(v)==='mesiac')&&row.some(v=>canon(v).includes('cena spolu')));
  if(headerIndex<0)continue;
  const indexes:Record<string,number>={};matrix[headerIndex].forEach((v,i)=>{const field=headerMap[canon(v)];if(field)indexes[field]=i});
  if(indexes.month===undefined||indexes.item===undefined||indexes.amount===undefined)continue;
  for(let i=headerIndex+1;i<matrix.length;i++){
   const row=matrix[i];const cell=(key:string)=>indexes[key]===undefined?'':row[indexes[key]];
   const id=String(cell('id')??'').trim();const item=String(cell('item')??'').trim();const month=String(cell('month')??'').trim();
   if(!month||!item||/^spolu\b/i.test(id)||/^spolu\b/i.test(item))continue;
   const amount=safeMoney(cell('amount'));if(!Number.isFinite(amount))continue;
   rows.push({uid:`${sheetName}-${i}`,id,supplier:String(cell('supplier')??''),item,month,category:String(cell('category')??''),quantity:String(cell('quantity')??''),unit:String(cell('unit')??''),amount:Math.round(amount*100)/100,included:true});
  }
 }
 if(rows.length===0)throw new Error('V Exceli sa nenašli platné položky. Očakávam stĺpce Mesiac, Položka / služba a Cena spolu (€).');
 return rows;
}
export function formatDate(date:string){if(!/^\d{4}-\d{2}-\d{2}$/.test(date))return date;const [y,m,d]=date.split('-');return `${Number(d)}.${Number(m)}.${y}`}
