const mongoose = require('mongoose');
require('dotenv').config({path: './Backend/.env'});
mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/doormeets').then(async () => {
  const Service = mongoose.connection.collection('services');
  const Combos = mongoose.connection.collection('comboPackages');
  console.log("Services matching price 168:");
  const s = await Service.find({ price: 168 }).toArray();
  console.log(JSON.stringify(s, null, 2));

  console.log("Combos:");
  const c = await Combos.find({ finalPrice: 300 }).toArray();
  console.log(JSON.stringify(c, null, 2));

  process.exit();
});
