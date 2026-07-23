// src/Components/Receptionist/Billing.tsx
import React, { useState, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { fetchBills, markBillPaid } from "../../features/bills/billsThuks";
import { generatePDF } from "../../utils/pdfUtils";

const Billing: React.FC = () => {
  const dispatch = useAppDispatch();
  const { list, loading, error } = useAppSelector((state) => state.bills);

  const [selectedBill, setSelectedBill] = useState<any | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // ✅ Fetch bills when component mounts
  useEffect(() => {
    dispatch(fetchBills());
  }, [dispatch]);

  // ✅ Only show unpaid bills
  const unpaidBills = list.filter((bill) => !bill.paid);

  const handleViewBill = (bill: any) => {
    // Automatically download PDF
    generatePDF(bill);

    // Open summary popup
    setSelectedBill(bill);
  };

  const handleMarkPaid = async () => {
    if (!selectedBill) return;
    await dispatch(markBillPaid(selectedBill.id));
    setSelectedBill(null);
    setPaymentSuccess(true);

    // ✅ Refresh bills after payment
    dispatch(fetchBills());
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-xl font-bold text-yellow-600 mb-4">Billing Section</h2>

      {loading && <p className="text-gray-500">Loading bills...</p>}
      {error && <p className="text-red-500">Error: {error}</p>}

      <ul>
        {unpaidBills.map((bill) => (
          <li
            key={bill.id}
            className="flex justify-between items-center border-b py-2"
          >
            <span className="text-gray-700 font-medium">
              {bill.customer_name} — {bill.service_name}
            </span>
            <button
              onClick={() => handleViewBill(bill)}
              className="bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700 transition"
            >
              View Bill
            </button>
          </li>
        ))}
        {unpaidBills.length === 0 && !loading && !error && (
          <p className="text-gray-500 text-center py-4">No unpaid bills.</p>
        )}
      </ul>

      {/* Bill Summary Popup */}
      {selectedBill && (
        <div className="fixed inset-0 bg-gray-200 bg-opacity-50 flex items-center justify-center">
          <div className="bg-white w-[28rem] p-8 rounded-xl shadow-2xl">
            <h3 className="text-2xl font-bold mb-6 text-yellow-600">Bill Summary</h3>
            <div className="space-y-2 text-gray-700">
              <p><span className="font-semibold">Customer:</span> {selectedBill.customer_name}</p>
              <p><span className="font-semibold">Service:</span> {selectedBill.service_name}</p>
              <p><span className="font-semibold">Barber:</span> {selectedBill.barber_name}</p>
              <p>
                <span className="font-semibold">Total:</span> $
                {Number(selectedBill.total).toFixed(2)}
              </p>
            </div>
            <div className="mt-6 flex gap-3 justify-end">
              <button
                onClick={handleMarkPaid}
                className="bg-green-600 text-white px-5 py-2 rounded-lg hover:bg-green-700 transition"
              >
                Mark as Paid
              </button>
              <button
                onClick={() => setSelectedBill(null)}
                className="bg-gray-400 text-white px-5 py-2 rounded-lg hover:bg-gray-500 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Success Popup */}
      {paymentSuccess && (
        <div className="fixed inset-0 bg-gray-200 bg-opacity-50 flex items-center justify-center">
          <div className="bg-white w-96 p-8 rounded-xl shadow-2xl text-center">
            <div className="text-green-600 text-7xl mb-4">✔️</div>
            <h3 className="text-2xl font-bold mb-2 text-green-700">Payment Completed</h3>
            <p className="text-gray-600 mb-6">The bill has been marked as paid successfully.</p>
            <button
              onClick={() => setPaymentSuccess(false)}
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Billing;
