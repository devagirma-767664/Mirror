import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { OwnerReport } from '../Components/Admin/owner';
import { cash, dayLabel, periodLabel } from '../Components/Admin/owner';
import { methodName } from '../Components/Reception/desk';
export function buildOwnerReportPdf(r:OwnerReport){
  const doc=new jsPDF();let y=22;
  const money=(n:number)=>cash(n,r.shop.currency);
  doc.setTextColor('#252b48');doc.setFontSize(22);doc.text('Mirror | Shop statement',14,y);y+=10;
  doc.setFontSize(12);const name=doc.splitTextToSize(r.shop.name,180);doc.text(name,14,y);y+=name.length*6+6;
  doc.text(`${r.period.kind==='monthly'?'Monthly':'Weekly'}: ${periodLabel(r)}${r.period.partial?' (to date)':''}`,14,y);y+=10;
  const table=(title:string,head:string[],body:Array<Array<string|number>>)=>{
    if(y>245){doc.addPage();y=20;}
    doc.setFontSize(13);doc.setTextColor('#5142ac');doc.text(title,14,y);y+=5;
    autoTable(doc,{startY:y,head:[head],body:body.length?body:[head.map((_,i)=>i?'':'No entries')],styles:{font:'helvetica',fontSize:9,cellPadding:3,overflow:'linebreak'},headStyles:{fillColor:[98,84,217]},alternateRowStyles:{fillColor:[248,248,252]},margin:{top:18,bottom:20},rowPageBreak:'avoid'});
    y=(doc as jsPDF & {lastAutoTable:{finalY:number}}).lastAutoTable.finalY+13;
  };
  const note=(text:string)=>{if(y>245){doc.addPage();y=20;}doc.setFontSize(9);doc.setTextColor('#586078');const lines=doc.splitTextToSize(text,180);doc.text(lines,14,y);y+=lines.length*5+10;};
  table('Trading & cash summary',['Measure','Amount'],[['Service sales (excluding VAT)',money(r.totals.sales)],['VAT collected',money(r.totals.vat)],['Total customer payments',money(r.totals.collected)],['Recorded expenses paid',money(r.totals.expenses)],['Net cash movement',money(r.totals.cashMovement)],['Paid customer visits',r.totals.customers],['Average service bill (excluding VAT)',money(r.totals.averageTicket)]]);
  note('Net cash movement is collections minus recorded expenses. It includes VAT and excludes any costs or payroll not recorded as expenses. It is not final profit. Sales are recognized here on the payment date.');
  table('Account movements',['Account','Method','Received','Expenses','Net movement'],r.accounts.map(a=>[a.name,methodName(a.method),money(a.collected),money(a.expenses),money(a.collected-a.expenses)]));
  table('Shop costs',['Category','Entries','Amount'],r.categories.map(c=>[c.category,c.count,money(c.amount)]));
  table('Stylist contribution & pay reference',['Stylist','Paid visits','Sales','Commission earned','Current monthly salary'],r.barbers.map(b=>[b.name,b.customers,money(b.sales),money(b.commission),money(b.monthly_salary)]));
  note('Salary is the current monthly agreement, not a period payout. Commission is based on saved payment rates. Payroll settlement is handled separately by the owner.');
  table('Service demand',['Service','Count','Sales'],r.services.map(s=>[s.name,s.count,money(s.sales)]));
  table('Daily figures',['Date','Paid visits','Sales','Collected','Expenses'],r.daily.map(d=>[dayLabel(d.day),d.customers,money(d.sales),money(d.collected),money(d.expenses)]));
  table('Daily closings',['Date','Closed by','Cash checks','Handover'],r.closings.map(c=>[dayLabel(c.day),c.closedBy||'Reception',c.differences.map(d=>`${d.name}: counted ${money(d.counted)}, expected ${money(d.expected)}, difference ${money(d.difference)}`).join('\n')||'No cash till',c.notes||'No note']));
  table('Expense ledger',['Date','Category / description','Account','Recorded by','Amount'],r.expenses.map(e=>[dayLabel(e.day),`${e.category}: ${e.description}`,e.account,e.recorded_by||'Unknown',money(e.amount)]));
  const pages=doc.getNumberOfPages();for(let p=1;p<=pages;p++){doc.setPage(p);doc.setFontSize(8);doc.setTextColor('#7b8094');doc.text(`Mirror | ${r.period.start} to ${r.period.through}`,14,288);doc.text(`${p} / ${pages}`,190,288,{align:'right'});}
  return doc;
}
export function exportOwnerReport(r:OwnerReport){buildOwnerReportPdf(r).save(`Mirror-${r.period.kind}-${r.period.start}.pdf`);}
