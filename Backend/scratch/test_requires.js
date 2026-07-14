const startUser = Date.now();
console.log("Loading User...");
require('../models/User');
console.log("Loaded User in", Date.now() - startUser, "ms");

const startWorker = Date.now();
console.log("Loading Worker...");
require('../models/Worker');
console.log("Loaded Worker in", Date.now() - startWorker, "ms");

const startService = Date.now();
console.log("Loading Service...");
require('../models/Service');
console.log("Loaded Service in", Date.now() - startService, "ms");

const startBooking = Date.now();
console.log("Loading Booking...");
require('../models/Booking');
console.log("Loaded Booking in", Date.now() - startBooking, "ms");
