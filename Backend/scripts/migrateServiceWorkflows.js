const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const Service = require('../models/Service');
const ServiceWorkflow = require('../models/ServiceWorkflow');

const runMigration = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/appzeto';
    console.log(`Connecting to database: ${mongoUri}`);
    await mongoose.connect(mongoUri);
    console.log('Connected to database.');

    const services = await Service.find({});
    console.log(`Found ${services.length} services in the database.`);

    let createdCount = 0;
    for (const service of services) {
      const existingWorkflow = await ServiceWorkflow.findOne({ serviceId: service._id });
      if (!existingWorkflow) {
        await ServiceWorkflow.create({
          serviceId: service._id,
          workflowType: 'single_visit',
          totalVisits: 1,
          frequency: 'none',
          status: 'active'
        });
        createdCount++;
      }
    }

    console.log(`Migration complete. Created baseline workflow configs for ${createdCount} services.`);
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

runMigration();
