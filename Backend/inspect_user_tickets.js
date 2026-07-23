const dotenv = require('dotenv');
const path = require('path');
const mongoose = require('mongoose');

const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

dotenv.config({ path: path.join(__dirname, '.env') });
const Ticket = require('./models/Ticket');

async function check() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to MongoDB.");
  const tickets = await Ticket.find({ creatorRole: 'user' }).lean();
  console.log("User tickets found:", JSON.stringify(tickets, null, 2));
  mongoose.disconnect();
}

check();
