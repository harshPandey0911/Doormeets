import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FiTwitter, FiInstagram, FiLinkedin, FiYoutube } from 'react-icons/fi';
import Logo from '../../../../components/common/Logo';
import { configService } from '../../../../services/configService';

const Footer = () => {
  const location = useLocation();
  const currentYear = new Date().getFullYear();
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    const fetchSettings = async () => {
      const data = await configService.getSettings();
      if (data?.success) {
        setSettings(data.settings);
      }
    };
    fetchSettings();
  }, []);

  // Show on home, about, contact, categories, brand, and service pages
  const allowedPaths = ['/user', '/user/', '/user/home', '/user/home/', '/user/about', '/user/contact'];
  const isAllowedPath = allowedPaths.includes(location.pathname) ||
    location.pathname.startsWith('/user/category/') ||
    location.pathname.startsWith('/user/brand/') ||
    location.pathname.startsWith('/user/service/');

  if (!isAllowedPath) {
    return null;
  }

  return (
    <footer className="hidden md:block bg-gray-50 border-t border-gray-100 pt-8 md:pt-16 pb-8 lg:pb-12 mt-6 md:mt-20 relative overflow-hidden group">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/5 rounded-full blur-3xl -mr-32 -mt-32 transition-colors group-hover:bg-teal-500/10" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-orange-500/5 rounded-full blur-3xl -ml-32 -mb-32 transition-colors group-hover:bg-orange-500/10" />

      <div className="max-w-[1600px] mx-auto px-6 md:px-12 relative z-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-12 mb-16">
          {/* Column 1: Brand Info */}
          <div className="space-y-4">
            <Link to="/user" className="inline-block transform hover:scale-[1.01] transition-transform duration-300">
              <Logo className="h-8 w-auto" />
            </Link>
            <p className="text-gray-500 text-sm leading-relaxed max-w-xs">
              {settings?.companyName || 'DoorMeets'} is your one-stop destination for all home services. From electrical repairs to premium salon services, we bring the experts to your doorstep.
            </p>
          </div>

          {/* Column 2: For customers */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">For customers</h3>
            <ul className="space-y-3">
              <li>
                <Link to="/user/about" className="text-gray-500 hover:text-[#B33A35] text-sm transition-colors duration-200">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/user/help-support" className="text-gray-500 hover:text-[#B33A35] text-sm transition-colors duration-200">
                  Help & Support
                </Link>
              </li>
              <li>
                <Link to="/user/cancellation-policy" className="text-gray-500 hover:text-[#B33A35] text-sm transition-colors duration-200">
                  Cancellation Policy
                </Link>
              </li>
              <li>
                <Link to="/user/contact" className="text-gray-500 hover:text-[#B33A35] text-sm transition-colors duration-200">
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: For professionals */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">For professionals</h3>
            <ul className="space-y-3">
              <li>
                <Link to="/vendor/signup" className="text-gray-500 hover:text-[#B33A35] text-sm transition-colors duration-200">
                  Register as Vendor
                </Link>
              </li>
              <li>
                <Link to="/worker/signup" className="text-gray-500 hover:text-[#B33A35] text-sm transition-colors duration-200">
                  Register as Worker
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Social links & Store buttons */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Social links</h3>
            <div className="flex items-center gap-3">
              {[
                { Icon: FiTwitter, href: "#" },
                { Icon: FiInstagram, href: "#" },
                { Icon: FiYoutube, href: "#" },
                { Icon: FiLinkedin, href: "#" }
              ].map(({ Icon, href }, i) => (
                <a
                  key={i}
                  href={href}
                  className="w-9 h-9 rounded-full border border-gray-300 flex items-center justify-center text-gray-500 hover:bg-gray-100 hover:text-black transition-colors"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>

            {/* App Store and Google Play buttons */}
            <div className="flex flex-col gap-2 pt-2">
              <a
                href="#"
                className="bg-black text-white px-3 py-1.5 rounded-lg flex items-center gap-2 hover:bg-gray-900 transition-colors w-[150px] border border-gray-800"
              >
                <svg className="w-5 h-5 text-white fill-current shrink-0" viewBox="0 0 24 24">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-1 .04-2.21.67-2.93 1.49-.62.69-1.16 1.84-1.01 2.96 1.12.09 2.27-.57 2.95-1.39z" />
                </svg>
                <div className="flex flex-col text-left">
                  <span className="text-[8px] uppercase tracking-wider text-gray-400 font-semibold leading-none">Download on the</span>
                  <span className="text-[12px] font-bold leading-tight">App Store</span>
                </div>
              </a>

              <a
                href="#"
                className="bg-black text-white px-3 py-1.5 rounded-lg flex items-center gap-2 hover:bg-gray-900 transition-colors w-[150px] border border-gray-800"
              >
                <svg className="w-5 h-5 text-white fill-current shrink-0" viewBox="0 0 24 24">
                  <path d="M5 3.14a1.83 1.83 0 0 0-.41 1.27v15.18a1.83 1.83 0 0 0 .41 1.27l8.28-8.28L5 3.14zm9.69 9.69 2.76-2.76L6.5 4.88l8.19 7.95zm.7-9.69L6.5 19.12l10.95-5.19-2.06-2.06z" />
                </svg>
                <div className="flex flex-col text-left">
                  <span className="text-[8px] uppercase tracking-wider text-gray-400 font-semibold leading-none">GET IT ON</span>
                  <span className="text-[12px] font-bold leading-tight">Google Play</span>
                </div>
              </a>
            </div>
          </div>
        </div>

        {/* Bottom copyright row */}
        <div className="border-t border-gray-200 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-col gap-1 text-left w-full md:w-auto">
            <p className="text-[11px] text-gray-400 font-medium">
              * As of July 2026
            </p>
            <p className="text-[11px] text-gray-400 font-medium">
              © Copyright {currentYear} {settings?.companyName || 'DoorMeets'} Limited. All rights reserved.
            </p>
          </div>
          <div className="flex items-center gap-6 self-start md:self-center">
            <Link to="#" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">Privacy Policy</Link>
            <Link to="#" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">Terms of Service</Link>
            <Link to="#" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">Cookie Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

