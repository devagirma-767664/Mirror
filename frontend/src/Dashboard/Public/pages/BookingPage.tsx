// src/dashboards/BookingPage.tsx
import React, { useState, useEffect } from "react";
import axiosInstance from "../../../api/axios";
import BookingSummary from "../../../Components/Landing Page/BookingSummary"; // ✅ fixed path
import { useAppDispatch } from "../../../app/hooks";
import { bookAppointment } from "../../../features/appointments/appointmentsThunks";

interface Barber {
  id: string;
  name: string;
  profile_picture: string | null;
}

interface Service {
  id: string;
  name: string;
  image?: string;
}

const BookingPage: React.FC = () => {
  const dispatch = useAppDispatch();

  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedBarber, setSelectedBarber] = useState("");
  const [selectedService, setSelectedService] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [barberAppointments, setBarberAppointments] = useState<string[]>([]);
  const [showConfirmation, setShowConfirmation] = useState(false);

  

  useEffect(() => {
    const fetchData = async () => {
      try {
        const barberRes = await axiosInstance.get("/barber/barbers");
        setBarbers(barberRes.data);

        const serviceRes = await axiosInstance.get("/services");
        setServices(serviceRes.data);
      } catch (err) {
        console.error("Failed to fetch booking data", err);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
  if (selectedBarber && date) {
    axiosInstance.get(`/appointments/barber/${selectedBarber}`)
      .then((res) => {
        // Filter appointments for the selected date
        const times = res.data
          .filter((appt: any) => appt.start_time.startsWith(date))
          .map((appt: any) => appt.start_time);
        setBarberAppointments(times);
      })
      .catch((err) => console.error("Failed to fetch barber appointments", err));
  }
}, [selectedBarber, date]);

  const handleBooking = (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(
      bookAppointment({
        customerName,
        customerPhone,
        barberId: selectedBarber,
        serviceId: selectedService,
        startTime: `${date} ${time}`,
      })
    )
    .unwrap()
    .then(() => setShowConfirmation(true))
    .catch((err) => console.error("Booking failed", err));
  };

  return (
    <section className="min-h-screen bg-gradient-to-r from-gray-900 via-gray-800 to-black py-20 px-6">
      <div className="max-w-2xl mx-auto bg-white/10 backdrop-blur-md rounded-xl shadow-lg p-6 text-sm">
        <h2 className="text-3xl md:text-3xl font-bold text-center text-yellow-500 mb-12">
          Book Your Appointment
        </h2>

        <form onSubmit={handleBooking} className="space-y-10">
          {/* Customer Info */}
          <h3 className="text-xl font-bold text-yellow-500 mb-8">👤 Customer Info</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <input
              type="text"
              placeholder="Full Name"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-white/20 bg-gray-800 text-white focus:ring-2 focus:ring-purple-400"
              required
            />
            <input
              type="tel"
              placeholder="Phone Number"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-white/20 bg-gray-800 text-white focus:ring-2 focus:ring-purple-400"
              required
            />
          </div>

          {/* Barber Selection */}
          <h3 className="text-xl font-bold text-yellow-400 mb-8">✂️ Choose Barber</h3>
          <BarberSelect barbers={barbers} selectedBarber={selectedBarber} setSelectedBarber={setSelectedBarber} />

          {/* Service Selection */}
          <h3 className="text-xl font-bold text-yellow-500 mb-8">💈 Choose Service</h3>
          <ServiceSelect services={services} selectedService={selectedService} setSelectedService={setSelectedService} />

          {/* Date & Time Picker */}
          <h3 className="text-xl font-bold text-yellow-500 mb-8">📅 Choose Date & Time</h3>
          <DateTimePicker 
            date={date} 
            setDate={setDate} 
            time={time} 
            setTime={setTime}
            bookedTimes={barberAppointments}
          />

          {/* Booking Summary */}
          <h3 className="text-2xl font-bold text-yellow-500 mb-10">✅ Booking Summary</h3>
          <BookingSummary
            barberName={barbers.find((b) => b.id === selectedBarber)?.name || ""}
            serviceName={services.find((s) => s.id === selectedService)?.name || ""}
            date={date}
            time={time}
          />

          {/* Confirm Button + Home Button */}
          <div className="flex flex-col items-center gap-4">
            <ConfirmButton />

            <button
              type="button"
              onClick={() => (window.location.href = "/")}
              className="bg-gray-300 text-gray-800 px-6 py-2 rounded-lg shadow hover:bg-gray-400 transition font-medium"
            >
              Go back to Home Page
            </button>
          </div>


        </form>
      </div>

          {showConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-900 text-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
            <h2 className="text-2xl font-bold text-green-400 mb-4">🎉 Booking Confirmed!</h2>
            <p className="mb-6">
              Your appointment has been successfully booked with{" "}
              <span className="font-semibold">
                {barbers.find((b) => b.id === selectedBarber)?.name}
              </span>.
            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => setShowConfirmation(false)}
                className="bg-gray-600 px-6 py-2 rounded-lg hover:bg-gray-700 transition"
              >
                Close
              </button>
              <button
                onClick={() => (window.location.href = "/")}
                className="bg-yellow-600 px-6 py-2 rounded-lg hover:bg-yellow-700 transition"
              >
                Go back to Home Page
              </button>
            </div>
          </div>
        </div>
      )}

    </section>
  );
};

export default BookingPage;

// Barber Select (cards)
const BarberSelect = ({
  barbers,
  selectedBarber,
  setSelectedBarber,
}: {
  barbers: Barber[];
  selectedBarber: string;
  setSelectedBarber: React.Dispatch<React.SetStateAction<string>>;
}) => (
  <div className="grid md:grid-cols-2 gap-6">
    {barbers.map((barber) => (
      <div
        key={barber.id}
        onClick={() => setSelectedBarber(barber.id)}
        className={`cursor-pointer p-4 rounded-lg border flex items-center gap-4 transition ${
          selectedBarber === barber.id ? "border-yellow-600 bg-gray-700" : "border-white/20 bg-gray-800"
        }`}
      >
        {barber.profile_picture ? (
          <img
            src={`http://localhost:5000${barber.profile_picture}`}
            alt={barber.name}
            className="w-16 h-16 rounded-full object-cover border-2 border-yellow-600"
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-gray-300 flex items-center justify-center text-gray-600">
            No Image
          </div>
        )}
        <span className="text-white font-semibold">{barber.name}</span>
      </div>
    ))}
  </div>
);

// Service Select (cards)
const ServiceSelect = ({
  services,
  selectedService,
  setSelectedService,
}: {
  services: Service[];
  selectedService: string;
  setSelectedService: React.Dispatch<React.SetStateAction<string>>;
}) => (
  <div className="grid md:grid-cols-2 gap-6">
    {services.map((service) => (
      <div
        key={service.id}
        onClick={() => setSelectedService(service.id)}
        className={`cursor-pointer p-4 rounded-lg border flex items-center gap-4 transition ${
          selectedService === service.id ? "border-yellow-600 bg-gray-700" : "border-white/20 bg-gray-800"
        }`}
      >
        {service.image ? (
          <img
            src={service.image}
            alt={service.name}
            className="w-16 h-16 rounded-md object-cover border-2 border-yellow-600"
          />
        ) : (
          <div className="w-16 h-16 rounded-md bg-gray-300 flex items-center justify-center text-gray-600">
            No Image
          </div>
        )}
        <span className="text-white font-semibold">{service.name}</span>
      </div>
    ))}
  </div>
);

// Date & Time Picker
const DateTimePicker = ({
  date,
  setDate,
  time,
  setTime,
  bookedTimes,
}: {
  date: string;
  setDate: React.Dispatch<React.SetStateAction<string>>;
  time: string;
  setTime: React.Dispatch<React.SetStateAction<string>>;
  bookedTimes: string[];
}) => {
  const generateTimeSlots = () => {
    const slots: string[] = [];
    for (let hour = 8; hour <= 21; hour++) {
      slots.push(`${hour.toString().padStart(2, "0")}:00`);
    }
    return slots;
  };
  const timeSlots = generateTimeSlots();

  // Normalize bookedTimes to "YYYY-MM-DD HH:mm"
  const normalizedBooked = bookedTimes.map((t) => {
    const d = new Date(t);
    return d.toISOString().slice(0, 16).replace("T", " "); // e.g. "2026-07-17 10:00"
  });

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        className="w-full px-4 py-3 rounded-lg border border-white/20 bg-gray-800 text-white focus:ring-2 focus:ring-blue-400 text-lg"
        required
      />

      <div className="grid grid-cols-3 gap-3 max-h-64 overflow-y-auto p-2 bg-gray-800 rounded-lg border border-white/20">
        {timeSlots.map((slot) => {
          const fullSlot = `${date} ${slot}`;
          const isBooked = normalizedBooked.includes(fullSlot);

          return (
            <button
              key={slot}
              type="button"
              onClick={() => !isBooked && setTime(slot)}
              disabled={isBooked}
              className={`text-center py-2 rounded-md text-lg transition w-full ${
                isBooked
                  ? "bg-red-600 text-white opacity-50 cursor-not-allowed"
                  : time === slot
                  ? "bg-yellow-600 text-white font-semibold"
                  : "bg-gray-700 text-gray-200 hover:bg-yellow-600 hover:text-white"
              }`}
              title={isBooked ? "Booked" : "Available"}
            >
              {slot}
            </button>
          );
        })}
      </div>
    </div>
  );
};




// Confirm Button
const ConfirmButton = () => (
  <div className="flex justify-center">
    <button
      type="submit"
      className="bg-yellow-600 text-white px-10 py-4 rounded-lg shadow hover:bg-yellow-700 transition font-bold text-lg"
    >
      Confirm Booking
    </button>
  </div>
);

