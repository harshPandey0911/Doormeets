import React from 'react';
import { FiUsers, FiAward, FiHeart, FiTrendingUp } from 'react-icons/fi';

const About = () => {
  return (
    <div className="min-h-screen font-['Montserrat']" style={{ backgroundColor: 'var(--background)' }}>
      <div className="max-w-4xl mx-auto px-6 py-12 md:py-20">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4" style={{ color: 'var(--text-primary)' }}>
            About <span className="text-[#B33A35]">Doormeets</span>
          </h1>
          <p className="text-lg max-w-2xl mx-auto font-medium leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            We are dedicated to bringing reliable, premium, and professional home services right to your doorstep.
          </p>
        </div>

        {/* Vision & Mission */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          <div className="p-8 rounded-3xl shadow-sm border hover:shadow-md transition-shadow" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border)' }}>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-6 text-[#B33A35]" style={{ backgroundColor: 'rgba(179, 58, 53, 0.08)' }}>
              <FiHeart className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>Our Mission</h3>
            <p className="leading-relaxed text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
              To empower local service experts by providing them with a platform to reach customers directly, while delivering an unparalleled home service experience built on trust and convenience.
            </p>
          </div>

          <div className="p-8 rounded-3xl shadow-sm border hover:shadow-md transition-shadow" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border)' }}>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-6 text-[#B33A35]" style={{ backgroundColor: 'rgba(179, 58, 53, 0.08)' }}>
              <FiTrendingUp className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>Our Vision</h3>
            <p className="leading-relaxed text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
              To become the world's most trusted partner for daily household repairs, cleaning, and personal wellness, transforming how home services are searched, booked, and executed.
            </p>
          </div>
        </div>

        {/* Why Choose Us */}
        <div className="p-8 md:p-12 rounded-3xl shadow-sm border mb-16" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border)' }}>
          <h2 className="text-2xl font-bold text-center mb-10" style={{ color: 'var(--text-primary)' }}>Why Thousands Trust Doormeets</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4 border" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
                <FiUsers className="w-6 h-6" />
              </div>
              <h4 className="font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Verified Experts</h4>
              <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Every professional undergoes rigorous background and identity checks.</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4 border" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
                <FiAward className="w-6 h-6" />
              </div>
              <h4 className="font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Premium Quality</h4>
              <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>We guarantee high-quality workmanship backed by our support team.</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4 border" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
                <FiHeart className="w-6 h-6" />
              </div>
              <h4 className="font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Customer First</h4>
              <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Easy scheduling, transparent pricing, and 24/7 dedicated support.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
