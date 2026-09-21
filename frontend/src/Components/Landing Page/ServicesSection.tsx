import React from "react";

interface Service {
  id: string;
  name: string;
  image?: string;
  description?: string;
  price?: number;
  duration?: number;
}

const fallbackServices: Service[] = [
  { id: "1", name: "Classic Haircut", image: "/assets/images/barber2.png", description: "Experience timeless style with a precise, confidence-building cut." },
  { id: "2", name: "Beard Trim", image: "/assets/images/barber5.png", description: "Sculpted detail that sharpens your look with expert care." },
  { id: "3", name: "Full Shave", image: "/assets/images/barber6.png", description: "A relaxing hot-towel shave finished with a clean, smooth feel." },
];

const ServicesSection: React.FC<{ services?: Service[] }> = ({ services = [] }) => {
  const visibleServices = services.length ? services : fallbackServices;
  return (
    <section id="services" className="py-20 relative z-10 bg-gradient-to-r from-gray-900 via-gray-800 to-black">
      <div className="max-w-6xl mx-auto px-6">
        <h3 className="text-4xl font-extrabold text-center mb-12 text-white drop-shadow-lg"><span className="text-yellow-600">Our</span> Services</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {visibleServices.map((service, index) => <div key={service.id} className="group bg-white/10 backdrop-blur-md rounded-xl shadow-lg hover:shadow-2xl transform hover:-translate-y-2 hover:scale-105 transition-all duration-300 p-6 border border-white/20"><div className="overflow-hidden rounded-lg mb-4"><img src={service.image || fallbackServices[index % fallbackServices.length].image} alt={service.name} className="w-full h-56 object-cover rounded-md group-hover:scale-110 transition-transform duration-500" /></div><h4 className="text-xl font-semibold mb-3 text-white">{service.name}</h4><p className="text-gray-300 leading-relaxed mb-6">{service.description || `${service.duration || 0} minute service${service.price != null ? ` · $${service.price}` : ""}`}</p></div>)}
        </div>
      </div>
    </section>
  );
};

export default ServicesSection;
