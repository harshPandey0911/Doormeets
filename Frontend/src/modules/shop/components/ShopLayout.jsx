import React from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { MdDashboard, MdPersonAdd, MdLogout, MdStore } from 'react-icons/md';

const ShopLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const shopOwner = JSON.parse(localStorage.getItem('shopUser') || '{}');

  const handleLogout = () => {
    localStorage.removeItem('shopAccessToken');
    localStorage.removeItem('shopUser');
    navigate('/shop/login');
  };

  const isActive = (path) => location.pathname.includes(path);

  const menuItems = [
    { name: 'Dashboard', path: '/shop/dashboard', icon: <MdDashboard className="w-5 h-5" /> },
    { name: 'Add Vendor', path: '/shop/add-vendor', icon: <MdPersonAdd className="w-5 h-5" /> }
  ];

  return (
    <div className="flex h-screen bg-gray-50 text-gray-800 font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col justify-between shadow-xl">
        <div>
          {/* Logo / Brand Header */}
          <div className="p-6 border-b border-slate-800 flex items-center space-x-3 bg-slate-950">
            <div className="p-2 bg-blue-600 rounded-lg text-white">
              <MdStore className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-bold text-lg tracking-wide">Doormeets</h1>
              <span className="text-xs text-blue-400 font-medium">Shop Panel</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5">
            {menuItems.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive(item.path)
                    ? 'bg-blue-600 text-white font-medium shadow-md shadow-blue-500/20'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                {item.icon}
                <span>{item.name}</span>
              </Link>
            ))}
          </nav>
        </div>

        {/* User profile & Logout */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/50">
          <div className="flex items-center space-x-3 mb-4 px-2">
            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center font-bold text-white uppercase shadow-inner">
              {shopOwner.name ? shopOwner.name.charAt(0) : 'S'}
            </div>
            <div className="truncate">
              <p className="font-semibold text-sm leading-tight text-white">{shopOwner.name || 'Shop Owner'}</p>
              <p className="text-xs text-slate-400 truncate">{shopOwner.businessName || 'Merchant'}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-2 bg-rose-600/10 text-rose-400 hover:bg-rose-600 hover:text-white px-4 py-2.5 rounded-xl transition-all duration-200 font-medium cursor-pointer"
          >
            <MdLogout className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-8 shadow-sm">
          <h2 className="text-xl font-bold text-gray-800">
            {location.pathname.includes('add-vendor') ? 'Onboard New Vendor' : 'Merchant Dashboard'}
          </h2>
          <div className="flex items-center space-x-4">
            <span className="bg-blue-50 text-blue-600 px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider">
              Referral Code: {shopOwner.referralCode || 'N/A'}
            </span>
          </div>
        </header>

        {/* Page Container */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50/50 p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default ShopLayout;
