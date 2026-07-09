import React from 'react';
import { FiUsers, FiAward, FiHeart, FiTrendingUp } from 'react-icons/fi';

const About = () => {
  return (
    <div className="min-h-screen bg-gray-50 font-['Montserrat']">
      <div className="max-w-4xl mx-auto px-6 py-12 md:py-20">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight mb-4">
            About <span className="text-[#B33A35]">Doormeets</span>
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto font-medium leading-relaxed">
            We are dedicated to bringing reliable, premium, and professional home services right to your doorstep.
          </p>
        </div>

        {/* Vision & Mission */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-[#B33A35] flex items-center justify-center mb-6">
              <FiHeart className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Our Mission</h3>
            <p className="text-gray-600 leading-relaxed text-sm font-medium">
              To empower local service experts by providing them with a platform to reach customers directly, while delivering an unparalleled home service experience built on trust and convenience.
            </p>
          </div>

          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-[#B33A35] flex items-center justify-center mb-6">
              <FiTrendingUp className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Our Vision</h3>
            <p className="text-gray-600 leading-relaxed text-sm font-medium">
              To become the world's most trusted partner for daily household repairs, cleaning, and personal wellness, transforming how home services are searched, booked, and executed.
            </p>
          </div>
        </div>

        {/* Why Choose Us */}
        <div className="bg-white p-8 md:p-12 rounded-3xl shadow-sm border border-gray-100 mb-16">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-10">Why Thousands Trust Doormeets</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 rounded-2xl bg-gray-50 text-gray-600 flex items-center justify-center mx-auto mb-4 border">
                <FiUsers className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-gray-900 mb-2">Verified Experts</h4>
              <p className="text-gray-500 text-xs font-medium">Every professional undergoes rigorous background and identity checks.</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-2xl bg-gray-50 text-gray-600 flex items-center justify-center mx-auto mb-4 border">
                <FiAward className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-gray-900 mb-2">Premium Quality</h4>
              <p className="text-gray-500 text-xs font-medium">We guarantee high-quality workmanship backed by our support team.</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-2xl bg-gray-50 text-gray-600 flex items-center justify-center mx-auto mb-4 border">
                <FiHeart className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-gray-900 mb-2">Customer First</h4>
              <p className="text-gray-500 text-xs font-medium">Easy scheduling, transparent pricing, and 24/7 dedicated support.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
