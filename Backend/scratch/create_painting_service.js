const { MongoClient, ObjectId } = require('mongodb');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '../.env') });

async function run() {
  const client = new MongoClient(process.env.MONGODB_URI);
  try {
    await client.connect();
    const db = client.db();
    
    // Find Painting category
    const category = await db.collection('categories').findOne({ _id: new ObjectId('6a293e391e686a11ee740000') });
    if (!category) {
      console.log('Painting category not found.');
      return;
    }
    console.log(`Found category: ${category.title}`);
    
    // Check if service already exists
    let service = await db.collection('services').findOne({ categoryId: category._id });
    if (service) {
      console.log(`Service already exists: ${service.title} (${service._id})`);
    } else {
      // Create service
      const newService = {
        title: 'Painting Consultation & Site Survey',
        categoryId: category._id,
        category: category.title,
        description: 'Free on-site painting inspection and laser measurement survey.',
        basePrice: 0,
        price: 0,
        originalPrice: 0,
        serviceType: 'package_base',
        isConsultation: true,
        isPriceDisclosed: true,
        rating: 4.9,
        reviewCount: 120,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const res = await db.collection('services').insertOne(newService);
      console.log(`Created service: ${newService.title} with ID: ${res.insertedId}`);
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

run();
