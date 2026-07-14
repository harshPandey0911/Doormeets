const mongoose = require('mongoose');
const mongoUri = "mongodb+srv://harshpandey09112004_db_user:harshpandey09112004_db_user@doormeets.4a1n75n.mongodb.net/civilconnect?appName=Doormeets";

const run = async () => {
  try {
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB");

    const PricingConfig = mongoose.model('PricingConfig', new mongoose.Schema({}, { strict: false }));
    const configs = await PricingConfig.find({ serviceId: new mongoose.Types.ObjectId('6a54b056848c9cf2798ab520') }).lean();
    console.log("PricingConfigs count:", configs.length);
    console.log("PricingConfigs:", JSON.stringify(configs, null, 2));

    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
  }
};

run();
