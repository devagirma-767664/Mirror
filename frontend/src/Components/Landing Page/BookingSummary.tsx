// src/Components/BookingPage/BookingSummary.tsx
import React from "react";

interface BookingSummaryProps {
  barberName: string;
  serviceName: string;
  date: string;
  time: string;
}

const BookingSummary: React.FC<BookingSummaryProps> = ({
  barberName,
  serviceName,
  date,
  time,
}) => {
  if (!barberName || !serviceName || !date || !time) {
    return null; // Only show summary when all fields are selected
  }

  return (
    <div className="bg-gray-800 text-white rounded-lg p-6 shadow-md mt-8">
      <h3 className="text-2xl font-bold text-yellow-600 mb-4 text-center">
        Booking Summary
      </h3>
      <ul className="space-y-3 text-lg">
        <li>
          <span className="font-semibold">Barber:</span> {barberName}
        </li>
        <li>
          <span className="font-semibold">Service:</span> {serviceName}
        </li>
        <li>
          <span className="font-semibold">Date:</span> {date}
        </li>
        <li>
          <span className="font-semibold">Time:</span> {time}
        </li>
      </ul>
      <p className="mt-6 text-center text-gray-300">
        Please confirm your booking details before proceeding.
      </p>
    </div>
  );
};

export default BookingSummary;
