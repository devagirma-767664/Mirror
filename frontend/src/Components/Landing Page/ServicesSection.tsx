import React from "react";

interface Service {
  id: string;
  name: string;
  image: string;
  description: string;
}

const services: Service[] = [
  {
    id: "1",
    name: <span className="text-yellow-600 ">Classic Haircut</span>,
    image: "/assets/images/barber2.png",
    description:
      "Experience timeless style with precision cuts that redefine confidence.",
  },
  {
    id: "2",
    name: <span className="text-yellow-600 ">Beard Trim</span>,
    image: "/assets/images/barber5.png",
    description:
      "Sculpted perfection — a beard trim that sharpens your look with finesse.",
  },
  {
    id: "3",
    name: <span className="text-yellow-600 ">Full Shave</span>,
    image: "/assets/images/barber6.png",
    description:
      "Indulge in luxury — a soothing shave with hot towels and expert care.",
  },
];

const ServicesSection: React.FC = () => {
  return (
    <section
      id="services"
      className="py-20 relative z-10 bg-gradient-to-r from-gray-900 via-gray-800 to-black"
    >
      <div className="max-w-6xl mx-auto px-6">
        {/* Section Title */}
        <h3 className="text-4xl font-extrabold text-center mb-12 text-white drop-shadow-lg">
          <span className="text-yellow-600">Our</span> Services
        </h3>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {services.map((service) => (
            <div
              key={service.id}
              className="group bg-white/10 backdrop-blur-md rounded-xl shadow-lg hover:shadow-2xl transform hover:-translate-y-2 hover:scale-105 transition-all duration-300 p-6 border border-white/20"
            >
              <div className="overflow-hidden rounded-lg mb-4">
                <img
                  src={service.image}
                  alt={service.name}
                  className="w-full h-56 object-cover rounded-md group-hover:scale-110 transition-transform duration-500"
                />
              </div>
              <h4 className="text-xl font-semibold mb-3 text-white">
                {service.name}
              </h4>
              <p className="text-gray-300 leading-relaxed mb-6">
                {service.description}
              </p>
              {/* Modern Button */}
             
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ServicesSection;
