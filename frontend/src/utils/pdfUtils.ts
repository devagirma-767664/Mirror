import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Receipts use saved bill amounts; they never recompute VAT or alter old bills.
export const generatePDF = (bill: any, shop: {name?:string;currency?:string} = {}) => {
  const doc=new jsPDF();
  const currency=shop.currency||'ETB';
  const money=(value:unknown)=>`${currency} ${Number(value||0).toFixed(2)}`;
  const subtotal=bill.subtotal??Number(bill.total)-Number(bill.tax||0);
  doc.setFontSize(20);doc.text(shop.name||'Mirror',20,22);
  doc.setFontSize(12);doc.text(bill.paid?'Payment receipt':'Checkout bill',20,32);
  doc.text(`Bill #${bill.id} / Visit #${bill.appointment_id||bill.id}`,20,43);
  doc.text(`Stylist: ${bill.barber_name||'Not recorded'}`,20,52);
  const date=new Date(bill.payment_recorded_at||bill.paid_at||bill.generated_at);
  doc.text(`Date: ${Number.isNaN(date.getTime())?'Not recorded':date.toLocaleString('en-GB')}`,20,61);
  autoTable(doc,{startY:70,head:[['Service','Amount']],body:(bill.items?.length?bill.items:[{name:bill.service_name||'Service',price:subtotal}]).map((line:any)=>[line.name,money(line.price)]),headStyles:{fillColor:[79,70,229]},styles:{fontSize:11},columnStyles:{1:{halign:'right'}}});
  const rows=[['Subtotal',money(subtotal)],...(Number(bill.tax)>0?[[`VAT${bill.vat_rate?` (${bill.vat_rate}%)`:''}`,money(bill.tax)]]:[]),['Total',money(bill.total)]];
  if(bill.paid) rows.push(['Payment method',({cash:'Cash',bank_transfer:'Bank transfer',telebirr:'Telebirr'} as Record<string,string>)[bill.payment_method]||bill.payment_method||'Not recorded'],['Receiving account',bill.payment_account_name||'Not recorded']);
  if(bill.transaction_reference) rows.push(['Transaction reference',bill.transaction_reference]);
  if(bill.cash_received!=null) rows.push(['Cash received',money(bill.cash_received)],['Change',money(Number(bill.cash_received)-Number(bill.total))]);
  autoTable(doc,{startY:(doc as any).lastAutoTable.finalY+8,body:rows,theme:'plain',styles:{fontSize:11},columnStyles:{1:{halign:'right'}}});
  doc.save(`Mirror-${bill.paid?'Receipt':'Bill'}-${bill.id}.pdf`);
};
