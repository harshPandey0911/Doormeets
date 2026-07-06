import { useState, useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiHome,
  FiUsers,
  FiBriefcase,
  FiUser,
  FiShoppingBag,
  FiGrid,
  FiDollarSign,
  FiFileText,
  FiBell,
  FiSettings,
  FiChevronDown,
  FiChevronLeft,
  FiChevronRight,
  FiMenu,
  FiSearch,
  FiX,
  FiPackage,
  FiTrash2,
  FiStar,
  FiMessageSquare,
  FiPlayCircle,
  FiShield,
  FiPercent,
  FiBox,
  FiInbox,
  FiGift,
  FiSliders,
  FiZap,
  FiImage,
  FiInfo,
  FiLayers,
  FiHelpCircle,
  FiMail,
  FiBookOpen,
} from "react-icons/fi";
import adminMenu from "../../config/adminMenu.json";
import dashboardService from "../../services/dashboardService";
import useAdminRole from "../../hooks/useAdminRole";

// Icon mapping for menu items
const iconMap = {
  Dashboard: FiHome,
  Users: FiUsers,
  Vendors: FiBriefcase,
  Labours: FiUser,
  Workers: FiUser,
  Bookings: FiShoppingBag,
  "User Catalog": FiGrid,
  Management: FiSliders,
  "Home Management": FiGrid,
  "Vendor Services": FiGrid,
  "Vendor Parts": FiPackage,
  "Add-on Library": FiSliders,
  Payments: FiDollarSign,
  Reports: FiFileText,
  Notifications: FiBell,
  "Scrap Items": FiTrash2,
  Reviews: FiStar,
  Settlements: FiDollarSign,
  Commission: FiPercent,
  "Promo Codes": FiPercent,
  "Gift Vouchers": FiGift,
  Settings: FiSettings,
  Plans: FiPackage,
  Support: FiMessageSquare,
  Training: FiPlayCircle,
  "Police Verification": FiShield,
  "Offer Banners": FiShoppingBag,
  "Stock Management": FiBox,
  "Vendor Subscriptions": FiDollarSign,
  "Vendor Requests": FiInbox,
  "Package based": FiPackage,
  "Painting": FiGrid,
  "Instant Booking": FiZap,
  "SOS Alerts": FiShield,
  // Website Panel icons
  "Hero Banner": FiImage,
  "About Page": FiInfo,
  "Services Showcase": FiLayers,
  "FAQ Manager": FiHelpCircle,
  "Blog Manager": FiBookOpen,
  "Inquiries": FiMail,
  "SEO & Global": FiSettings
};

// Helper function to convert child name to route path
const getChildRoute = (parentRoute, childName) => {
  const routeMap = {
    "/admin/users": {
      "All Users": "/admin/users/all",
      "User Bookings": "/admin/users/bookings",
      "Transactions": "/admin/users/transactions",
      "User Analytics": "/admin/users/analytics",
      "Referral Settings": "/admin/users/referrals",
    },
    "/admin/vendors": {
      "All Vendors": "/admin/vendors/all",
      "Vendor's Zone": "/admin/vendors/zone",
      "Manual Assignment": "/admin/vendors/manual",
      "Vendor Bookings": "/admin/vendors/bookings",
      "Vendor Analytics": "/admin/vendors/analytics",
      "Vendor Payments": "/admin/vendors/payments",
      "Police Verification": "/admin/vendors/police-verification",
      "Incentives": "/admin/vendors/incentives",
      "Vendor Wallets": "/admin/vendor-wallets",
    },
    "/admin/labours": {
      "All Labours": "/admin/labours/all",
      "Labour Jobs": "/admin/labours/jobs",
      "Labour Analytics": "/admin/labours/analytics",
    },
    "/admin/workers": {
      "All Workers": "/admin/workers/all",
      "Worker Jobs": "/admin/workers/jobs",
      "Worker Analytics": "/admin/workers/analytics",
      "Worker Payments": "/admin/workers/payments",
    },
    "/admin/bookings": {
      "All Bookings": "/admin/bookings",
      "Booking Tracking": "/admin/bookings/tracking",
      "Booking Notifications": "/admin/bookings/notifications",
      "Instant Booking": "/admin/bookings/instant",
    },
    "/admin/user-categories": {
      "Home": "/admin/user-categories/home",
      "Popular Services": "/admin/user-categories/popular-services",
      "Manage Professions": "/admin/user-categories/professions",
      "Category Templates": "/admin/user-categories/templates",
      "Featured Sections": "/admin/user-categories/featured-sections"
    },
    "/admin/addon-library": {
      "Extra Services": "/admin/user-categories/vendor-services"
    },

    "/admin/home-management": {
      "Banners & Categories": "/admin/user-categories/home",
      "Combined Categories": "/admin/user-categories/combined-categories",
      "Top Brands & Featured": "/admin/user-categories/featured-sections",
      "Popular Services": "/admin/user-categories/popular-services",
      "Manage Professions": "/admin/user-categories/professions",
      "Loyalty Points Settings": "/admin/user-categories/loyalty-points"
    },
    "/admin/management": {
      "Minute based": "/admin/user-categories/templates/MINUTE_BASED/manage",
      "Normal service": "/admin/user-categories/templates/NORMAL_SERVICE/manage",
      "Subscription based": "/admin/user-categories/templates/SUBSCRIPTION_BASED/manage",
      "Image based": "/admin/user-categories/templates/IMAGE_CONSULTANT/manage",
      "Multi Visit": "/admin/user-categories/templates/MULTI_VISIT/manage"
    },
    "/admin/payments": {
      "Payment Overview": "/admin/payments/overview",
      "User Payments": "/admin/payments/users",
      "Worker Payments": "/admin/payments/workers",
      "Vendor Payments": "/admin/payments/vendors",
      "Admin Revenue": "/admin/payments/revenue",
      "Payment Reports": "/admin/payments/reports",
    },
    "/admin/reports": {
      "Revenue Report": "/admin/reports/revenue",
      "Booking Report": "/admin/reports/bookings",
      "Payment Report": "/admin/payments/reports",
    },
    "/admin/notifications": {
      "Push Notifications": "/admin/notifications/push",
      "Custom Messages": "/admin/notifications/messages",
      "Notification Settings": "/admin/notifications/settings",
    },
    "/admin/settings": {
      "General Settings": "/admin/settings/general",
      "Worker Assignment": "/admin/settings/worker-assignment",
      "Service Configuration": "/admin/settings/service-config",
      "System Settings": "/admin/settings/system",
    },
    "/admin/settlements": {
      "Pending": "/admin/settlements/pending",
      "Withdrawals": "/admin/settlements/withdrawals",
      "Vendors with Due": "/admin/settlements/vendors",
      "History": "/admin/settlements/history",
    },
    "/admin/admin-management": {
      "City Admins": "/admin/admin-management",
      "Pending Proposals": "/admin/admin-management/proposals"
    },
    "/admin/shop-owners": {
      "All Shop Owners": "/admin/shop-owners/all",
      "Referral Settings": "/admin/shop-owners/referrals"
    },
    "/admin/painting": {
      "Paint Brands": "/admin/painting/brands",
      "Paint Products": "/admin/painting/products",
      "Property Templates": "/admin/painting/layouts",
      "Pricing Config": "/admin/painting/pricing",
      "Settings Dashboard": "/admin/painting/settings",
      "Page Builder": "/admin/painting/page-builder",
      "Painting Quotations": "/admin/painting/quotations",
      "Painting Consultations": "/admin/painting/consultations"
    }
  };

  return routeMap[parentRoute]?.[childName] || parentRoute;
};

// Mapping from Menu Title to Permission Key
const permissionMap = {
  "Dashboard": "view_dashboard",
  "Users": "view_users",
  "Vendors": "view_vendors",
  "Vendor Subscriptions": "view_subscriptions",
  "Workers": "view_workers",
  "Bookings": "view_bookings",
  "Payments": "view_payments",
  "Settlements": "view_settlements",
  "Reports": "view_reports",
  "Reviews": "view_reviews",
  "Plans": "manage_plans",
  "Offer Banners": "manage_banners",
  "Promo Codes": "manage_promos",
  "Gift Vouchers": "manage_promos",
  "Commission": "view_commissions",
  "Settings": "manage_homepage",
  "Training": "manage_training",
  "Vendor Requests": "view_vendor_requests",
  "Support": "manage_support",
  "SOS Alerts": "manage_support",
  "User Catalog": "propose_categories",
  "Management": "propose_categories",
  "Package based": "propose_categories",
  "Painting": "propose_categories",
  "Home Management": "manage_homepage",
  "Vendor Services": "view_vendor_services",
  "Vendor Parts": "view_vendor_parts",
  "Add-on Library": "view_vendor_services",
  "Stock Management": "manage_stock",
  "Scrap Items": "view_scrap_items",
  "Notifications": "manage_notifications",
  "Police Verification": "view_police_verification",
};

const AdminSidebar = ({ isOpen, onClose, isCollapsed, onToggleCollapse, panelMode }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { admin, role, isSuperAdmin, isCityAdmin, hasPermission } = useAdminRole();
  const [expandedItems, setExpandedItems] = useState({});
  const [isMobile, setIsMobile] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [counts, setCounts] = useState({
    bookings: 0,
    vendors: 0,
    withdrawals: 0,
    pendingSettlements: 0,
    scraps: 0,
    vendorRequests: 0
  });

  // Ensure city-admin selection is persisted and used across admin pages
  useEffect(() => {
    try {
      const storedData = sessionStorage.getItem('adminData') || localStorage.getItem('adminData');
      const stored = JSON.parse(storedData || '{}');
      if (stored.role === 'city_admin') {
        const cityIds = stored.cityIds || stored.cityId || [];
        const first = Array.isArray(cityIds) ? cityIds[0] : cityIds;
        if (first) {
          // Persist a dedicated admin selected city key so admin pages can read it
          localStorage.setItem('adminSelectedCity', String(first));
        }
      }
    } catch (e) { /* silent */ }
  }, []);

  // Filter menu items by role and permissions
  const filteredMenu = useMemo(() => {
    if (panelMode === 'website') {
      return [
        { "title": "Hero Banner", "route": "/admin/website/hero", "section": "WEBSITE CONFIGS", "children": [] },
        { "title": "About Page", "route": "/admin/website/about", "section": "WEBSITE CONFIGS", "children": [] },
        { "title": "Services Showcase", "route": "/admin/website/services", "section": "WEBSITE CONFIGS", "children": [] },
        { "title": "FAQ Manager", "route": "/admin/website/faqs", "section": "WEBSITE CONFIGS", "children": [] },
        { "title": "Blog Manager", "route": "/admin/website/blogs", "section": "WEBSITE CONFIGS", "children": [] },
        { "title": "Inquiries", "route": "/admin/website/inquiries", "section": "COMMUNICATION", "children": [] },
        { "title": "SEO & Global", "route": "/admin/website/seo", "section": "SYSTEM", "children": [] }
      ];
    }

    return adminMenu.filter(item => {
      // Basic allowedRoles array check (fallback)
      const allowedByRole = !item.allowedRoles || item.allowedRoles.includes(role) || item.allowedRoles.includes(role.toLowerCase()) || item.allowedRoles.includes(role.toUpperCase());

      // Super Admin sees everything allowed by their role
      if (isSuperAdmin) {
        return allowedByRole;
      }

      // For City Admin, check dynamic permissions
      if (isCityAdmin) {
        // Admin Management is NEVER allowed for City Admin, regardless of role array or permissions
        if (item.title === 'Admin Management') return false;

        // If there's a mapped permission key, check it
        const requiredPerm = permissionMap[item.title];
        if (requiredPerm) {
          return hasPermission(requiredPerm);
        }

        // If no permission mapped but role allows it, show it (e.g., Dashboard if no perm mapped)
        return allowedByRole;
      }

      return allowedByRole;
    });
  }, [role, isSuperAdmin, isCityAdmin, hasPermission, panelMode]);

  // Filter menu items by search query
  const searchedMenu = useMemo(() => {
    if (!searchQuery.trim()) return filteredMenu;
    const query = searchQuery.toLowerCase();
    return filteredMenu.map(item => {
      const parentMatches = item.title.toLowerCase().includes(query);
      const matchingChildren = item.children ? item.children.filter(child =>
        child.toLowerCase().includes(query)
      ) : [];

      if (parentMatches || matchingChildren.length > 0) {
        return {
          ...item,
          children: matchingChildren.length > 0 ? matchingChildren : item.children
        };
      }
      return null;
    }).filter(Boolean);
  }, [filteredMenu, searchQuery]);

  // Fetch pending counts for badges
  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const response = await dashboardService.getStats();
        if (response.success && response.data?.stats) {
          const stats = response.data.stats;
          setCounts({
            bookings: stats.pendingBookings || 0,
            vendors: stats.pendingVendors || 0,
            withdrawals: stats.pendingWithdrawals || 0,
            pendingSettlements: stats.pendingSettlements || 0,
            scraps: stats.pendingScraps || 0
          });
          // Fetch vendor request count separately
          try {
            const vendorRequestService = (await import('../../services/vendorRequestService')).default;
            const reqData = await vendorRequestService.getPendingCount();
            if (reqData.success) {
              setCounts(prev => ({ ...prev, vendorRequests: reqData.pendingCount || 0 }));
            }
          } catch (e) { /* silent */ }
        }
      } catch (error) {
        console.error("Error fetching sidebar counts:", error);
      }
    };

    fetchCounts();
    // Refresh every 30 seconds
    const interval = setInterval(fetchCounts, 30000);
    return () => clearInterval(interval);
  }, []);

  // Check if mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Auto-close sidebar on mobile when route changes
  // Auto-close sidebar on mobile when route changes
  useEffect(() => {
    // Only close if screen is small (mobile)
    if (window.innerWidth < 1024) {
      onClose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]); // Remove onClose to prevent re-triggering when parent re-renders

  // Auto-expand menu items when their route is active
  useEffect(() => {
    const activeItem = filteredMenu.find((item) => {
      if (item.route === "/admin/dashboard") {
        return location.pathname === "/admin/dashboard";
      }
      const isChildRoute =
        location.pathname.startsWith(item.route) &&
        location.pathname !== item.route;
      return isChildRoute;
    });
    if (activeItem && activeItem.children && activeItem.children.length > 0) {
      setExpandedItems((prev) => {
        if (prev[activeItem.title]) {
          return prev;
        }
        return {
          [activeItem.title]: true,
        };
      });
    }
  }, [location.pathname, filteredMenu]);

  // Check if a menu item is active
  const isActive = (route) => {
    if (route === "/admin/dashboard") {
      return location.pathname === "/admin/dashboard";
    }

    // Special case for User Catalog to avoid overlap with Vendor Services/Parts
    if (route === "/admin/user-categories") {
      if (location.pathname.startsWith("/admin/user-categories/vendor-")) {
        return false;
      }
    }

    // Strict prefix check: either exact match OR followed by a slash
    return location.pathname === route || location.pathname.startsWith(route + '/');
  };

  // Toggle expanded state for menu items with children
  const toggleExpand = (title, closeOthers = true) => {
    setExpandedItems((prev) => {
      if (closeOthers) {
        return {
          [title]: !prev[title],
        };
      } else {
        return {
          ...prev,
          [title]: !prev[title],
        };
      }
    });
  };

  // Handle menu item click
  const handleMenuItemClick = (route, parentTitle = null) => {
    if (parentTitle) {
      setExpandedItems((prev) => {
        return {
          [parentTitle]: true,
        };
      });
    }
    if (location.pathname === route) {
      window.location.reload();
    } else {
      navigate(route);
    }
    if (window.innerWidth < 1024) {
      onClose();
    }
  };

  // Render menu item
  const renderMenuItem = (item) => {
    const Icon = iconMap[item.title] || FiHome;
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems[item.title];
    const active = isActive(item.route);
    const hasCount = (
      (item.title === "Bookings" && counts.bookings > 0) ||
      (item.title === "Vendors" && counts.vendors > 0) ||
      (item.title === "Settlements" && (counts.withdrawals + counts.pendingSettlements) > 0) ||
      (item.title === "Scrap Items" && counts.scraps > 0) ||
      (item.title === "Vendor Requests" && counts.vendorRequests > 0)
    );

    return (
      <div key={item.route} className="mb-1">
        {/* Main Menu Item */}
        <div
          title={isCollapsed ? item.title : undefined}
          className={`
            flex items-center gap-3 transition-all duration-200 cursor-pointer
            ${isCollapsed
              ? "w-12 h-12 justify-center mx-auto rounded-xl p-0"
              : "px-4 py-3.5 rounded-xl"
            }
            ${active
              ? "bg-primary-600 text-white shadow-sm"
              : "text-gray-300 hover:bg-slate-700"
            }
          `}
          onClick={() => {
            if (hasChildren && !isCollapsed) {
              toggleExpand(item.title, true);
            } else {
              handleMenuItemClick(item.route);
            }
          }}>
          <div className="relative flex items-center justify-center flex-shrink-0">
            <Icon
              className={`text-xl ${active ? "text-white" : "text-gray-400"}`}
            />
            {isCollapsed && hasCount && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full shadow-sm animate-pulse border-2 border-slate-800" />
            )}
          </div>
          {!isCollapsed && <span className="font-semibold flex-1 text-base">{item.title}</span>}

          {/* Badge Display */}
          {!isCollapsed && item.title === "Bookings" && counts.bookings > 0 && (
            <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-sm animate-pulse mr-2">
              {counts.bookings > 99 ? '99+' : counts.bookings}
            </span>
          )}
          {!isCollapsed && item.title === "Vendors" && counts.vendors > 0 && (
            <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-sm animate-pulse mr-2">
              {counts.vendors > 99 ? '99+' : counts.vendors}
            </span>
          )}
          {!isCollapsed && item.title === "Settlements" && (counts.withdrawals + counts.pendingSettlements) > 0 && (
            <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-sm animate-pulse mr-2">
              {(counts.withdrawals + counts.pendingSettlements) > 99 ? '99+' : (counts.withdrawals + counts.pendingSettlements)}
            </span>
          )}
          {!isCollapsed && item.title === "Scrap Items" && counts.scraps > 0 && (
            <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-sm animate-pulse mr-2">
              {counts.scraps > 99 ? '99+' : counts.scraps}
            </span>
          )}
          {!isCollapsed && item.title === "Vendor Requests" && counts.vendorRequests > 0 && (
            <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-sm animate-pulse mr-2">
              {counts.vendorRequests > 99 ? '99+' : counts.vendorRequests}
            </span>
          )}

          {hasChildren && !isCollapsed && (
            <motion.div
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}>
              <FiChevronDown className="text-gray-400 text-sm" />
            </motion.div>
          )}
        </div>

        {/* Children Items */}
        <AnimatePresence>
          {hasChildren && isExpanded && !isCollapsed && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden">
              <div className="ml-4 mt-1 pl-4 border-l-2 border-slate-600 space-y-1">
                {item.children.map((child, index) => {
                  const childRoute = getChildRoute(item.route, child);
                  const isChildActive =
                    location.pathname === childRoute ||
                    (childRoute !== item.route &&
                      location.pathname.startsWith(childRoute));

                  return (
                    <div
                      key={index}
                      onClick={() =>
                        handleMenuItemClick(childRoute, item.title)
                      }
                      className={`
                        px-3 py-2 text-sm rounded-lg transition-colors cursor-pointer flex justify-between items-center
                        ${isChildActive
                          ? "bg-primary-50 text-white font-medium"
                          : "text-gray-400 hover:bg-slate-700"
                        }
                      `}>
                      <span>{child}</span>
                      {item.title === "Settlements" && child === "Pending" && counts.pendingSettlements > 0 && (
                        <span className="bg-red-500 text-white text-[10px] h-5 min-w-[20px] px-1.5 flex items-center justify-center rounded-full">
                          {counts.pendingSettlements}
                        </span>
                      )}
                      {item.title === "Settlements" && child === "Withdrawals" && counts.withdrawals > 0 && (
                        <span className="bg-orange-500 text-white text-[10px] h-5 min-w-[20px] px-1.5 flex items-center justify-center rounded-full">
                          {counts.withdrawals}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  // Sidebar content
  const sidebarContent = (
    <div className="h-full w-full flex flex-col bg-slate-800">
      {/* Header Section */}
      <div className={`px-2 py-6 border-b border-slate-700 bg-slate-900 transition-all duration-300 ${isCollapsed ? 'flex flex-col items-center justify-center gap-3' : 'px-4'}`}>
        <div className={`flex items-center justify-between gap-2 w-full ${isCollapsed ? 'flex-col justify-center' : ''}`}>
          <div className={`flex items-center gap-3 min-w-0 ${isCollapsed ? 'flex-col justify-center' : 'flex-1'}`}>
            <div
              className={`${isCollapsed ? 'w-10 h-10' : 'w-12 h-12'} rounded-xl flex items-center justify-center shadow-md flex-shrink-0 transition-all duration-300`}
              style={{
                background: 'linear-gradient(135deg, #2874F0 0%, #4787F7 100%)',
              }}
            >
              <FiUser className="text-white text-xl" />
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <h2 className="font-semibold text-white text-base truncate">
                  {admin?.name || 'Admin'}
                </h2>
                <p className="text-xs text-gray-400 truncate">
                  {isSuperAdmin ? '⭐ Super Admin' : 'Admin'}
                </p>
              </div>
            )}
          </div>

          {/* Collapse Button - Desktop Only */}
          <button
            onClick={onToggleCollapse}
            className="hidden lg:flex p-2 hover:bg-white/10 rounded-lg transition-colors flex-shrink-0"
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}>
            <FiMenu className="text-xl text-gray-300" />
          </button>

          {/* Close Button - Mobile Only */}
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors flex-shrink-0 lg:hidden"
            aria-label="Close sidebar">
            <FiX className="text-xl text-gray-300" />
          </button>
        </div>
      </div>

      {/* Search Section */}
      {!isCollapsed && (
        <div className="px-4 py-3 border-b border-slate-700/50 bg-slate-800/50">
          <div className="relative">
            <input
              type="text"
              placeholder="Search Menu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 text-gray-200 placeholder-gray-500 text-sm rounded-lg pl-9 pr-4 py-2 border border-slate-700 focus:outline-none focus:border-primary-500 transition-colors"
            />
            <FiSearch className="absolute left-3 top-2.5 text-gray-500 text-base" />
          </div>
        </div>
      )}

      {/* Navigation Menu */}
      <nav className="flex-1 overflow-y-auto p-3 scrollbar-admin lg:pb-3">
        {(() => {
          let lastSection = null;
          return searchedMenu.map((item) => {
            const elements = [];
            if (item.section && item.section !== lastSection) {
              lastSection = item.section;
              elements.push(
                isCollapsed ? (
                  <hr key={`divider-${item.section}`} className="border-slate-700/50 my-4" />
                ) : (
                  <div
                    key={`section-${item.section}`}
                    className="px-4 pt-5 pb-2 text-[12px] font-bold tracking-widest text-slate-400 uppercase select-none border-t border-slate-700/30 first:border-t-0 mt-3 first:mt-0"
                  >
                    {item.section}
                  </div>
                )
              );
            }
            elements.push(renderMenuItem(item));
            return elements;
          });
        })()}
      </nav>
    </div>
  );

  return (
    <>
      {/* Mobile: Overlay Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 z-[99998] lg:hidden backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      {/* Sidebar - Mobile Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed left-0 top-0 bottom-0 w-[280px] z-[99999] lg:hidden shadow-2xl"
          >
            {sidebarContent}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sidebar - Desktop Fixed */}
      <div
        className="hidden lg:flex fixed left-0 top-0 bottom-0 z-30 transition-all duration-300"
        style={{ width: isCollapsed ? '80px' : '320px' }}
      >
        {sidebarContent}
      </div>
    </>
  );
};

export default AdminSidebar;

