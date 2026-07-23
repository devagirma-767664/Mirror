import React, { useEffect } from "react";
import Navbar from "../../../Components/Landing Page/Navbar";
import HeroSection from "../../../Components/Landing Page/HeroSection";
import ServicesSection from "../../../Components/Landing Page/ServicesSection";
import BookingCTA from "../../../Components/Landing Page/BookingCTA";
import LocationSection from "../../../Components/Landing Page/LocationSection";
import WhyChooseUsSection from "../../../Components/Landing Page/WhyChooseUsSection";
import InsideOurShopSection from "../../../Components/Landing Page/InsideOurShopSection";
import MeetFounderSection from "../../../Components/Landing Page/MeetFounderSection";
import Footer from "../../../Components/Landing Page/Footer";
import BarbersSection from "../../../Components/Landing Page/BarbersSection";

import { useAppDispatch, useAppSelector } from "../../../app/hooks";
import { fetchServices } from "../../../features/services/servicesThunks";

const LandingPage: React.FC = () => {
  const dispatch = useAppDispatch();

  const { list: services, loading: servicesLoading, error: servicesError } =
    useAppSelector((state) => state.services);

  useEffect(() => {
    dispatch(fetchServices());
  }, [dispatch]);

  return (
    <div>
      <Navbar />
      <HeroSection />

      {/* Services Section */}
      {servicesLoading ? (
        <p className="text-center py-10">Loading services...</p>
      ) : servicesError ? (
        <p className="text-center py-10 text-red-500">{servicesError}</p>
      ) : (
        <ServicesSection services={services} />
      )}

      {/* Inside Our Shop Section */}
      <InsideOurShopSection />

      {/* Barbers Section */}
      <BarbersSection />

      {/* Why Choose Us Section */}
      <WhyChooseUsSection />

      {/* Location Section */}
      <LocationSection />

      {/* Booking CTA */}
      <BookingCTA ctaText="Book Now" />

      {/* Meet Founder Section */}
      <MeetFounderSection />

      {/* Footer */}
      <Footer />

      
    </div>
  );
};

export default LandingPage;
