import {AlignmentType, BorderStyle, Document, Packer, Paragraph, Table, TableCell, TableRow, TextRun, WidthType, VerticalAlign, HeightRule} from 'docx';
import type {Details,Expense} from './model';
import {amountToCents,euro,formatDate} from './model';
const border={style:BorderStyle.SINGLE,size:7,color:'262626'};
const cell=(text:string,opts:{bold?:boolean;align?:typeof AlignmentType[keyof typeof AlignmentType];width?:number}={})=>new TableCell({width:opts.width?{size:opts.width,type:WidthType.DXA}:undefined,borders:{top:border,bottom:border,left:border,right:border},margins:{top:95,bottom:95,left:110,right:110},verticalAlign:VerticalAlign.CENTER,children:[new Paragraph({alignment:opts.align??AlignmentType.LEFT,spacing:{after:0,before:0},children:[new TextRun({text,bold:opts.bold,size:20,font:'Times New Roman'})]})]});
const p=(s:string,opts:{bold?:boolean;center?:boolean;size?:number;before?:number;after?:number}={})=>new Paragraph({alignment:opts.center?AlignmentType.CENTER:AlignmentType.LEFT,spacing:{before:opts.before??0,after:opts.after??0},children:[new TextRun({text:s,bold:opts.bold,size:opts.size??20,font:'Times New Roman'})]});
const row=(cells:TableCell[])=>new TableRow({children:cells});
const space=(after:number)=>new Paragraph({spacing:{after},children:[new TextRun('')]});
export async function createWord(details:Details,month:string,expenses:Expense[],aggregate:boolean):Promise<Blob>{
 const selected=expenses.filter(e=>e.included&&e.month===month);
 if(!selected.length)throw new Error('Vyber aspoň jednu položku.');
 const total=selected.reduce((a,e)=>a+amountToCents(e.amount),0)/100;
 const note=details.notes.trim()||selected.map(e=>e.item).join(', ');
 const itemRows=aggregate?[{name:details.expenseName||'Športový materiál',amount:total,description:note}]:selected.map(e=>({name:e.item,amount:e.amount,description:[e.supplier,e.category].filter(Boolean).join(' · ')}));
 const expenseTable=new Table({width:{size:100,type:WidthType.PERCENTAGE},columnWidths:[800,3400,1750,3600],rows:[
 row([cell('Por. č.',{bold:true,align:AlignmentType.CENTER,width:800}),cell('Položky',{bold:true,align:AlignmentType.CENTER,width:3400}),cell('Suma',{bold:true,align:AlignmentType.CENTER,width:1750}),cell('Poznámky',{bold:true,align:AlignmentType.CENTER,width:3600})]),
 ...itemRows.map((e,i)=>row([cell(String(i+1),{align:AlignmentType.CENTER}),cell(e.name),cell(euro(e.amount),{align:AlignmentType.RIGHT}),cell(e.description)])),
 row([cell(''),cell('SPOLU:',{bold:true}),cell(euro(total),{bold:true,align:AlignmentType.RIGHT}),cell('')])
 ]});
 const information=new Table({width:{size:100,type:WidthType.PERCENTAGE},columnWidths:[3900,5650],rows:[
 row([cell('Meno športovca',{bold:true}),cell(details.athlete)]),
 row([cell('Číslo účtu / IBAN',{bold:true}),cell(details.iban)]),
 row([cell('Kategória',{bold:true}),cell(details.category)]),
 row([cell('Dátum prípravy',{bold:true}),cell(formatDate(details.trainingDate))]),
 row([cell('Športové odvetvie',{bold:true}),cell(details.sport)])
 ]});
 const sign=(label:string)=>new TableCell({borders:{top:{style:BorderStyle.NIL},bottom:{style:BorderStyle.NIL},left:{style:BorderStyle.NIL},right:{style:BorderStyle.NIL}},children:[p('..................................................',{center:true}),p(label,{center:true,size:18})]});
 const signatures=new Table({width:{size:100,type:WidthType.PERCENTAGE},columnWidths:[4750,4750],rows:[row([sign('podpis zúčtovateľa'),sign('podpis reprezentačného trénera alebo predsedu ŠTK')])]});
 const approval=new Table({width:{size:100,type:WidthType.PERCENTAGE},columnWidths:[4750,4750],rows:[row([new TableCell({borders:{top:{style:BorderStyle.NIL},bottom:{style:BorderStyle.NIL},left:{style:BorderStyle.NIL},right:{style:BorderStyle.NIL}},children:[p('')]}),sign('predseda SZTPŠ')])]});
 const dateTable=new Table({width:{size:65,type:WidthType.PERCENTAGE},columnWidths:[4000,2200],rows:[row([cell('Dátum zúčtovania:',{bold:true}),cell(formatDate(details.settlementDate),{align:AlignmentType.CENTER})])]});
 const doc=new Document({creator:'Generátor vyúčtovaní',title:`Vyúčtovanie - ${month} - ${details.athlete}`,styles:{default:{document:{run:{font:'Times New Roman',size:20},paragraph:{spacing:{after:0}}}}},sections:[{properties:{page:{size:{width:11906,height:16838},margin:{top:760,right:870,bottom:750,left:870}}},children:[
 p('SLOVENSKÝ ZVÄZ TELESNE POSTIHNUTÝCH ŠPORTOVCOV',{bold:true,center:true,size:24}),
 p('Benediktiho 5, 811 05 Bratislava',{center:true,size:19,after:220}),
 p('VYÚČTOVANIE TRÉNINGOVEJ PRÍPRAVY',{bold:true,center:true,size:27,after:240}),
 information,space(270),expenseTable,p('Poznámka: '+(aggregate?'':note),{before:150}),
 space(900),signatures,space(340),p('Schválil:',{bold:true,size:24}),space(600),approval,space(270),dateTable
 ]}]});
 return await Packer.toBlob(doc);
}
export function saveBlob(blob:Blob,filename:string){const url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.download=filename;document.body.appendChild(link);link.click();link.remove();window.setTimeout(()=>URL.revokeObjectURL(url),1000)}
