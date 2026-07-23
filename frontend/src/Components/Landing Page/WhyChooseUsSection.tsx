import React from "react";

const qualities = [
  {
    title: "Expert Barbers",
    description: "Our team is highly skilled with years of experience in modern and classic styles.",
    icon: "💈",
  },
  {
    title: "Premium Service",
    description: "We provide a luxury grooming experience with attention to detail.",
    icon: "✨",
  },
  {
    title: "Customer Satisfaction",
    description: "Your comfort and satisfaction are our top priorities.",
    icon: "😊",
  },
  {
    title: "Affordable Pricing",
    description: "High-quality service at prices that won’t break the bank.",
    icon: "💵",
  },
];

const WhyChooseUsSection: React.FC = () => {
  return (
    <section
      id="why-choose-us"
      className="py-16 bg-gradient-to-r from-gray-900 via-gray-800 to-black relative z-10"
    >
      <div className="max-w-6xl mx-auto px-6 text-center">
        <h3 className="text-4xl font-extrabold mb-12 text-white drop-shadow-lg">
          Why <span className="text-yellow-600">Choose Us</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {qualities.map((quality, index) => (
            <div
              key={index}
              className="bg-white/10 backdrop-blur-md rounded-xl shadow-lg p-6 border border-white/20 hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300"
            >
              <div className="text-5xl mb-4">{quality.icon}</div>
              <h4 className="text-xl font-semibold text-yellow-500 mb-2">
                {quality.title}
              </h4>
              <p className="text-gray-300">{quality.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyChooseUsSection;
