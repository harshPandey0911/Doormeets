import React from 'react';
import { FiShield, FiClock, FiCreditCard, FiHeadphones } from 'react-icons/fi';

const TrustSection = () => {
  const items = [
    {
      icon: FiShield,
      title: "Verified Professionals",
      desc: "Background checked & certified service experts",
      color: "text-emerald-500",
      bg: "bg-emerald-500/5",
    },
    {
      icon: FiClock,
      title: "On-Time Service",
      desc: "Guaranteed prompt response and timely delivery",
      color: "text-[#FF6B4A]",
      bg: "bg-[#FF6B4A]/5",
    },
    {
      icon: FiCreditCard,
      title: "Transparent Pricing",
      desc: "No hidden charges, pay only for what you request",
      color: "text-blue-500",
      bg: "bg-blue-500/5",
    },
    {
      icon: FiHeadphones,
      title: "24/7 Support",
      desc: "Dedicated helpdesk to solve any issue instantly",
      color: "text-purple-500",
      bg: "bg-purple-500/5",
    },
  ];

  return (
    <section className="px-5 py-8 max-w-7xl mx-auto w-full">
      <div className="text-center mb-8">
        <h2 className="text-[17px] font-extrabold tracking-tight text-slate-800">
          Why customers trust Doormeets
        </h2>
        <p className="text-xs font-semibold text-slate-400 mt-1">
          Your safety and convenience is our priority
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {items.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={idx}
              className="bg-white rounded-3xl p-5 border border-transparent shadow-[0_8px_30px_rgba(0,0,0,0.02)] hover:shadow-[0_20px_45px_rgba(0,0,0,0.04)] hover:-translate-y-1 transition-all duration-300 flex flex-col items-center text-center space-y-3"
            >
              <div className={`w-12 h-12 rounded-2xl ${item.bg} flex items-center justify-center`}>
                <Icon className={`w-5 h-5 ${item.color}`} />
              </div>
              <div className="space-y-1">
                <h3 className="text-xs font-bold text-slate-800 tracking-tight">
                  {item.title}
                </h3>
                <p className="text-[10px] font-medium text-slate-400 leading-relaxed max-w-[150px] mx-auto">
                  {item.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default TrustSection;
