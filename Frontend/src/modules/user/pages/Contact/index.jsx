import React, { useState } from 'react';
import { FiMail, FiPhone, FiMapPin, FiSend } from 'react-icons/fi';
import { toast } from 'react-hot-toast';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      toast.error('Please fill in all fields');
      return;
    }
    toast.success('Thank you! Your message has been received.');
    setFormData({ name: '', email: '', message: '' });
  };

  return (
    <div className="min-h-screen font-['Montserrat']" style={{ backgroundColor: 'var(--background)' }}>
      <div className="max-w-5xl mx-auto px-6 py-12 md:py-20">
        {/* Title */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4" style={{ color: 'var(--text-primary)' }}>
            Contact <span className="text-[#B33A35]">Us</span>
          </h1>
          <p className="text-lg max-w-2xl mx-auto font-medium leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            Got questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-12 items-start">
          {/* Contact Details (2/5 cols) */}
          <div className="md:col-span-2 space-y-8">
            <div className="p-8 rounded-3xl border shadow-sm space-y-8" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border)' }}>
              <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Get in touch</h3>
              <div className="flex gap-4 items-start">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-[#B33A35]" style={{ backgroundColor: 'rgba(179, 58, 53, 0.08)' }}>
                  <FiMail className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-xs uppercase tracking-wider mb-0.5" style={{ color: 'var(--text-muted)' }}>Email</h4>
                  <a href="mailto:support@Doormeets.in" className="text-sm font-bold hover:text-[#B33A35] transition-colors" style={{ color: 'var(--text-primary)' }}>
                    support@Doormeets.in
                  </a>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-[#B33A35]" style={{ backgroundColor: 'rgba(179, 58, 53, 0.08)' }}>
                  <FiPhone className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-xs uppercase tracking-wider mb-0.5" style={{ color: 'var(--text-muted)' }}>Phone</h4>
                  <a href="tel:+919876543210" className="text-sm font-bold hover:text-[#B33A35] transition-colors" style={{ color: 'var(--text-primary)' }}>
                    +91 98765 43210
                  </a>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-[#B33A35]" style={{ backgroundColor: 'rgba(179, 58, 53, 0.08)' }}>
                  <FiMapPin className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-xs uppercase tracking-wider mb-0.5" style={{ color: 'var(--text-muted)' }}>Headquarters</h4>
                  <p className="text-sm font-bold leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                    Bhopal, Madhya Pradesh, India
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Form (3/5 cols) */}
          <div className="md:col-span-3">
            <form onSubmit={handleSubmit} className="p-8 md:p-10 rounded-3xl border shadow-sm space-y-6" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border)' }}>
              <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Send Message</h3>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>Your Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="John Doe"
                  className="w-full px-4 py-3 rounded-2xl border focus:outline-none focus:border-[#B33A35] text-sm font-medium"
                  style={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>Email Address</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="john@example.com"
                  className="w-full px-4 py-3 rounded-2xl border focus:outline-none focus:border-[#B33A35] text-sm font-medium"
                  style={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>Message</label>
                <textarea
                  rows={4}
                  value={formData.message}
                  onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                  placeholder="How can we help you?"
                  className="w-full px-4 py-3 rounded-2xl border focus:outline-none focus:border-[#B33A35] text-sm font-medium resize-none"
                  style={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-[#B33A35] hover:bg-[#9E2E2A] text-white font-bold rounded-2xl transition-all flex items-center justify-center gap-2 active:scale-95 shadow-lg shadow-[#B33A35]/15 cursor-pointer"
              >
                <span>Send Message</span>
                <FiSend />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
