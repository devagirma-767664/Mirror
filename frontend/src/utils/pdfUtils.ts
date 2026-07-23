import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export const generatePDF = (bill: any) => {
  const doc = new jsPDF();

  // Header
  doc.setFontSize(18);
  doc.text("Barbershop Receipt", 105, 20, { align: "center" });

  doc.setFontSize(12);
  doc.text(`Customer: ${bill.customer_name}`, 20, 40);
  doc.text(`Barber: ${bill.barber_name}`, 20, 50);
  doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 60);

  // Ensure numeric
  const price = Number(bill.total);
  const vat = price * 0.15;
  const grandTotal = price + vat;

  // Table
  const tableResult = autoTable(doc, {
    startY: 80,
    head: [["Service", "Price", "VAT (15%)", "Total"]],
    body: [
      [
        bill.service_name,
        `$${price.toFixed(2)}`,
        `$${vat.toFixed(2)}`,
        `$${grandTotal.toFixed(2)}`
      ],
    ],
    styles: { halign: "center" },
    headStyles: { fillColor: [255, 204, 0] },
  });

  // Safely get finalY
  const finalY = (tableResult as any)?.lastAutoTable?.finalY || 95;

  // Breakdown
  doc.setFontSize(12);
  doc.text("Subtotal:", 140, finalY + 15);
  doc.text(`$${price.toFixed(2)}`, 180, finalY + 15);
  doc.text("VAT (15%):", 140, finalY + 25);
  doc.text(`$${vat.toFixed(2)}`, 180, finalY + 25);
  doc.setFont("helvetica", "bold");
  doc.text("Grand Total:", 140, finalY + 35);
  doc.text(`$${grandTotal.toFixed(2)}`, 180, finalY + 35);

  // Footer
  doc.setFontSize(10);
  doc.text(
    "Thank you for choosing our barbershop!",
    105,
    doc.internal.pageSize.height - 20,
    { align: "center" }
  );

  doc.save(`Bill_${bill.customer_name}.pdf`);
};
