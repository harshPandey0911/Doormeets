// Force Google DNS to bypass broken local IPv6 DNS settings
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const originalConsoleError = console.error;
console.error = function () {
  try { fs.appendFileSync('error.log', Array.from(arguments).join(' ') + '\\n'); } catch (e) { }
  originalConsoleError.apply(console, arguments);
};
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const rateLimiter = require('./middleware/rateLimiter');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

// Connect to database deferred to startup block at the bottom

// Initialize Redis (if enabled)
const { initRedis } = require('./services/redisService');
initRedis();

// Initialize Express app
const app = express();

// Trust proxy for reverse proxies (Nginx/PM2) to allow express-rate-limit to read X-Forwarded-For headers correctly
app.set('trust proxy', 1);

// Security middleware - allow cross-origin resource loading (images) for user app
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// CORS configuration
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'https://www.civilconnect.in',
  'https://civilconnect.in',
  'https://api.civilconnect.in',
  'https://civilconnect.vercel.app'
];

if (process.env.FRONTEND_URL) {
  // Support comma-separated URLs in .env
  const envOrigins = process.env.FRONTEND_URL.split(',').map(url => url.trim());
  envOrigins.forEach(origin => {
    if (!allowedOrigins.includes(origin)) {
      allowedOrigins.push(origin);
    }
  });
}

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    // Allow allowedOrigins or any Vercel preview URL for this project
    if (allowedOrigins.indexOf(origin) !== -1 || origin.includes('.vercel.app')) {
      callback(null, true);
    } else {
      console.log('BLOCKED CORS ORIGIN:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['set-cookie', 'x-rtb-fingerprint-id', 'request-id']
}));

// CORS configuration finished above

// CORS configuration finished above

// Body parser middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cookieParser());

//For camera clicks feature 
// app.use(express.json({ limit: "20mb" })); // REMOVED redundant
// app.use(express.urlencoded({ extended: true, limit: "20mb" })); // REMOVED redundant

// DEBUG: Log Requests (Removed to prevent terminal spam)
// (Old Vendor Register Logger Removed)



// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev', {
    skip: function (req, res) { return res.statusCode === 304 }
  }));
}

// Rate limiting
app.use('/api', rateLimiter);

// Health check route
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Civil connect API is running',
    timestamp: new Date().toISOString()
  });
});

// Quick Redis Test Route
app.get('/api/test/redis', async (req, res) => {
  try {
    const { getRedis, isRedisConnected } = require('./services/redisService');
    const redis = getRedis();

    if (!isRedisConnected()) {
      return res.status(503).json({
        success: false,
        message: 'Redis is not connected or disabled',
        redisEnabled: process.env.REDIS_ENABLED === 'true',
        status: redis ? redis.status : 'no_instance'
      });
    }

    const testKey = `test:time:${Date.now()}`;
    const testValue = 'Hello from Redis!';

    // Test Set
    await redis.set(testKey, testValue, 'EX', 60);

    // Test Get
    const retrievedValue = await redis.get(testKey);

    // Test Delete
    const deleted = await redis.del(testKey);

    res.json({
      success: true,
      message: 'Redis is working correctly',
      testResults: {
        set: 'Retrieved value: ' + retrievedValue,
        match: retrievedValue === testValue,
        delete: deleted === 1 ? 'Success' : 'Failed'
      },
      connectionInfo: {
        status: redis.status,
        host: redis.options.host
      }
    });
  } catch (error) {
    console.error('[Redis Test Route] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Redis test failed',
      error: error.message
    });
  }
});

// API Routes

app.use('/api/public/cities', require('./routes/public-routes/city.routes.js'));


// User routes
app.use('/api/users/auth', require('./routes/user-routes/auth.routes'));
app.use('/api/users', require('./routes/user-routes/profile.routes'));
app.use('/api/user/wallet', require('./routes/user-routes/userWallet.routes'));
app.use('/api/users/bookings', require('./routes/user-routes/booking.routes'));
app.use('/api/users', require('./routes/user-routes/cart.routes'));
app.use('/api/users/fcm-tokens', require('./routes/user-routes/fcmToken.routes'));
app.use('/api/users', require('./routes/user-routes/sos.routes'));
app.use('/api/users/painting-consultations', require('./routes/user-routes/painting-consultation.routes'));
app.use('/api/user/support', require('./routes/user-routes/support.routes'));


// Vendor routes
const { checkSubscription } = require('./middleware/roleMiddleware');
app.use('/api/vendors/auth', require('./routes/vendor-routes/auth.routes'));
app.use('/api/vendors/subscription', require('./routes/vendor-routes/subscription.routes'));

// Training routes (require subscription but NOT training completion — they ARE the training step)
app.use('/api/vendors/training', require('./routes/vendor-routes/training.routes'));

// Verification pipeline routes (Police Verification, etc.)
app.use('/api/vendors/verification', require('./routes/vendor-routes/verification.routes'));

// Protected Vendor routes (require active subscription)
app.use('/api/vendors', checkSubscription, require('./routes/vendor-routes/profile.routes'));
app.use('/api/vendors', checkSubscription, require('./routes/vendor-routes/settings.routes'));
app.use('/api/vendors', checkSubscription, require('./routes/vendor-routes/wallet.routes'));
app.use('/api/vendors', checkSubscription, require('./routes/vendor-routes/dashboard.routes'));
app.use('/api/vendors', checkSubscription, require('./routes/vendor-routes/service.routes'));
app.use('/api/vendors/bookings', checkSubscription, require('./routes/vendor-routes/booking.routes'));
app.use('/api/vendors/workers', checkSubscription, require('./routes/vendor-routes/worker.routes'));
app.use('/api/vendors/fcm-tokens', checkSubscription, require('./routes/vendor-routes/fcmToken.routes'));
app.use('/api/vendors', checkSubscription, require('./routes/vendor-routes/vendorBill.routes'));
app.use('/api/vendors/catalog', checkSubscription, require('./routes/vendor-routes/catalog.routes'));
app.use('/api/vendors/categories', checkSubscription, require('./routes/vendor-routes/category.routes'));
app.use('/api/vendors/category-requests', checkSubscription, require('./routes/vendor-routes/vendorCategoryRequest.routes'));
app.use('/api/vendors/products', checkSubscription, require('./routes/vendor-routes/product.routes'));
app.use('/api/vendors/support', checkSubscription, require('./routes/vendor-routes/support.routes'));
app.use('/api/vendors/painting-consultations', checkSubscription, require('./routes/vendor-routes/painting-consultation.routes'));
app.use('/api/vendor/painting', checkSubscription, require('./routes/vendor-routes/painting-quotation.routes'));

// Worker routes
app.use('/api/workers', require('./routes/worker-routes/workerWallet.routes'));




// Admin routes
app.use('/api/admin/auth', require('./routes/admin-routes/adminAuth.routes'));
app.use('/api/admin', require('./routes/admin-routes/cityManagement.routes.js'));
app.use('/api/admin', require('./routes/admin-routes/dashboard.routes'));
app.use('/api/admin', require('./routes/admin-routes/userManagement.routes'));
app.use('/api/admin', require('./routes/admin-routes/vendorManagement.routes'));
app.use('/api/admin/vendor-dashboard', require('./routes/admin-routes/vendorDashboard.routes'));
app.use('/api/admin/shop-owners', require('./routes/admin-routes/shopManagement.routes'));
app.use('/api/admin', require('./routes/admin-routes/workerManagement.routes'));
app.use('/api/admin', require('./routes/admin-routes/categoryManagement.routes'));
app.use('/api/admin/professions', require('./routes/admin-routes/profession.routes'));
app.use('/api/admin/subcategories', require('./routes/admin-routes/subCategoryManagement.routes'));
app.use('/api/admin/category-templates', require('./routes/admin-routes/categoryTemplate.routes'));
app.use('/api/admin/pricing', require('./routes/admin-routes/pricingManagement.routes'));
app.use('/api/admin', require('./routes/admin-routes/brandManagement.routes'));
app.use('/api/admin', require('./routes/admin-routes/serviceManagement.routes'));
app.use('/api/admin/services', require('./routes/admin-routes/dynamicServiceRoutes'));
app.use('/api/admin', require('./routes/admin-routes/vendorCatalogManagement.routes'));
app.use('/api/admin', require('./routes/admin-routes/homePageManagement.routes'));
app.use('/api/admin', require('./routes/admin-routes/bookingManagement.routes'));
app.use('/api/admin', require('./routes/admin-routes/paymentManagement.routes'));
app.use('/api/admin', require('./routes/admin-routes/transactionManagement.routes'));
app.use('/api/admin', require('./routes/admin-routes/upload.routes'));
app.use('/api/admin', require('./routes/admin-routes/planManagement.routes'));
app.use('/api/admin/vendor-subscriptions', require('./routes/admin-routes/vendorSubscriptionPlan.routes'));
app.use('/api/admin', require('./routes/admin-routes/settings.routes'));
app.use('/api/admin', require('./routes/admin-routes/painting.routes'));
app.use('/api/admin/painting', require('./routes/admin-routes/property-template.routes'));
app.use('/api/admin/painting', require('./routes/admin-routes/painting-settings.routes'));
app.use('/api/admin', require('./routes/admin-routes/sosAdmin.routes'));
app.use('/api/admin', require('./routes/admin-routes/reviewManagement.routes'));
app.use('/api/admin', require('./routes/admin-routes/reportManagement.routes'));
app.use('/api/admin/settlements', require('./routes/admin-routes/settlementManagement.routes'));
app.use('/api/admin/admins', require('./routes/admin-routes/adminManagement.routes'));
app.use('/api/admin/promos', require('./routes/admin-routes/promo.routes'));
app.use('/api/admin/vouchers', require('./routes/admin-routes/voucher.routes'));
app.use('/api/admin', require('./routes/admin-routes/deletedAccounts.routes'));
app.use('/api/admin/notifications', require('./routes/admin-routes/adminNotification.routes'));

// Shop Owner routes
app.use('/api/shop', require('./routes/shop-routes/shop.routes'));
app.use('/api/admin/support', require('./routes/admin-routes/support.routes'));
app.use('/api/admin/banners', require('./routes/admin-routes/banner.routes'));
app.use('/api/admin/training', require('./routes/admin-routes/trainingManagement.routes'));
app.use('/api/admin', require('./routes/admin-routes/adminVendorCategoryRequest.routes'));
app.use('/api/admin/city-admin-requests', require('./routes/admin-routes/cityAdminRequests.routes'));
app.use('/api/admin/police-verification', require('./routes/admin-routes/policeVerification.routes'));
app.use('/api/image', require('./routes/admin-routes/image.routes'));
app.use('/api', require('./routes/admin-routes/upload.routes')); // Generic upload access
app.use('/api/commissions', require('./routes/admin-routes/commission.routes'));

// Vendor Wallet/Ledger routes
// Vendor Wallet/Ledger routes
// WARNING: This mounts at /api/vendors, meaning routes inside are relative to that.
// e.g., router.post('/withdrawal') becomes /api/vendors/withdrawal
app.use('/api/vendors', require('./routes/vendor-routes/vendorWallet.routes'));

// Booking routes
app.use('/api/bookings', require('./routes/booking-routes/userBooking.routes'));
app.use('/api/bookings/cash', require('./routes/booking-routes/cashCollection.routes'));

// Payment routes
app.use('/api/payments', require('./routes/payment-routes/payment.routes'));

// Bidding routes
app.use('/api/bids', require('./routes/booking-routes/bid.routes'));

// Notification routes
app.use('/api/notifications', require('./routes/notification.routes'));

// Stock Management routes
app.use('/api/stock', require('./routes/stock.routes'));

// Public routes (no authentication required)
app.use('/api/public', require('./routes/public-routes/catalog.routes'));
app.use('/api/public/promos', require('./routes/public-routes/promo.routes'));
app.use('/api/public/vouchers', require('./routes/public-routes/voucher.routes'));
app.use('/api/public', require('./routes/public-routes/plan.routes'));
app.use('/api/public', require('./routes/public-routes/config.routes'));
app.use('/api/public/banners', require('./routes/user-routes/banner.routes'));

// 404 handler
app.use((req, res) => {
  console.log(`[404 HANDLER] Route not found - Method: ${req.method}, Path: ${req.path}, OriginalUrl: ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    message: 'Route not found',
    method: req.method,
    path: req.path
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Connect to database and then initialize services and start the server
let server;
connectDB().then(() => {
  if (process.env.VERCEL !== '1' && !process.env.VERCEL_ENV) {
    const PORT = process.env.PORT || 5000;
    server = app.listen(PORT, () => {
      console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
    }).on('error', (err) => {
      // Handle common listen errors gracefully so nodemon doesn't crash unhelpfully
      if (err && err.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use. Please free the port or set PORT env variable.`);
        // Allow nodemon to keep running so developer can fix without forcing multiple restarts
      } else {
        console.error('Server listen error:', err);
        // For unexpected errors, exit so process manager can restart if configured
        process.exit(1);
      }
    });

    // Initialize Socket.io
    const { initializeSocket, getIO } = require('./sockets');
    initializeSocket(server);

    // Make io instance available in request
    app.set('io', getIO());

    // Initialize Booking Scheduler for Wave-Based Alerting
    const { initializeScheduler } = require('./services/bookingScheduler');
    initializeScheduler(getIO());
    console.log('[Server] Booking Scheduler initialized for wave-based alerting');

    // Initialize Booking Availability & Reconfirmation Scheduler
    const { initializeAvailabilityScheduler } = require('./services/bookingAvailabilityScheduler');
    initializeAvailabilityScheduler(getIO());
    console.log('[Server] Booking Availability & Reconfirmation Scheduler initialized');

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (err) => {
      console.error('Unhandled Promise Rejection:', err);
      if (server) {
        server.close(() => {
          process.exit(1);
        });
      } else {
        process.exit(1);
      }
    });
  } else {
    // For Vercel, create HTTP server for Socket.io
    const http = require('http');
    server = http.createServer(app);
    const { initializeSocket } = require('./sockets');
    initializeSocket(server);
  }
}).catch((err) => {
  console.error('Database connection failed, server could not be started:', err);
  process.exit(1);
});

module.exports = app;





