// src/Components/Landing Page/BarbersSection.tsx
import React, { useEffect, useState } from "react";
import axiosInstance from "../../api/axios";
import { Link } from "react-router-dom";

interface Barber {
  id: string;
  name: string;
  profile_picture: string | null;
}

const BarbersSection: React.FC = () => {
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBarbers = async () => {
      setLoading(true);
      try {
        const response = await axiosInstance.get("/barber/barbers");
        setBarbers(response.data);
      } catch (err: any) {
        setError(err.message || "Failed to fetch barbers");
      } finally {
        setLoading(false);
      }
    };
    fetchBarbers();
  }, []);

  return (
    <section
      id="barbers"
      className="py-20 relative z-10 bg-gradient-to-r from-gray-900 via-gray-800 to-black"
    >
      <div className="max-w-6xl mx-auto px-6">
        {/* Section Title */}
        <h3 className="text-4xl font-extrabold text-center mb-12 text-white drop-shadow-lg">
          <span className="text-yellow-600">The</span> Artists
        </h3>

        {loading && <p className="text-center text-white">Loading barbers...</p>}
        {error && <p className="text-center text-red-500">{error}</p>}

        {/* Barbers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {barbers.map((barber) => (
            <div
              key={barber.id}
              className="group bg-white/10 backdrop-blur-md rounded-xl shadow-lg hover:shadow-2xl transform hover:-translate-y-2 hover:scale-105 transition-all duration-300 p-6 border border-white/20"
            >
              <div className="overflow-hidden rounded-lg mb-4">
                {barber.profile_picture ? (
                  <img
                    src={`${import.meta.env.VITE_API_URL}${barber.profile_picture}`}
                    alt={barber.name}
                    className="w-full h-56 object-cover rounded-md group-hover:scale-110 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-56 rounded-md bg-gray-300 flex items-center justify-center text-gray-600">
                    No Image
                  </div>
                )}
              </div>

              {/* Centered Name */}
              <h4 className="text-xl font-semibold mb-3 text-center text-white">
                <span className="text-yellow-600">{barber.name}</span>
              </h4>

              {/* Five Stars */}
              <div className="flex justify-center mb-6">
                {Array.from({ length: 5 }).map((_, i) => (
                  <span key={i} className="text-yellow-500 text-lg">★</span>
                ))}
              </div>

              <Link
                to={`/booking`}
                className="block bg-yellow-600 text-white w-full py-2 rounded-lg shadow hover:bg-yellow-700 transition font-semibold text-center"
              >
                Book with {barber.name}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BarbersSection;
