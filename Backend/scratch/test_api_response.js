const mongoose = require('mongoose');
require('dotenv').config();

const dbUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/doormeets';

async function run() {
  try {
    await mongoose.connect(dbUri);
    console.log('Connected to MongoDB');

    const Vendor = mongoose.model('Vendor');
    const Category = mongoose.model('Category');

    const vendors = await Vendor.find({});
    for (const vendor of vendors) {
      const assignedCategories = Array.from(new Set([
        ...(vendor.service || []),
        ...(vendor.categories || [])
      ]));

      const query = {
        status: 'active',
        categoryType: 'service'
      };

      if (assignedCategories.length === 0) {
        console.log(`Vendor: ${vendor.name} (${vendor._id}) -> Returns: 0 categories (No assigned)`);
        continue;
      }

      const objectIds = [];
      const names = [];
      assignedCategories.forEach(cat => {
        if (!cat) return;
        const catStr = cat.toString();
        if (/^[0-9a-fA-F]{24}$/.test(catStr)) {
          objectIds.push(catStr);
        } else {
          names.push(new RegExp(`^${catStr}$`, 'i'));
        }
      });

      if (objectIds.length > 0 && names.length > 0) {
        query.$or = [{ _id: { $in: objectIds } }, { title: { $in: names } }];
      } else if (objectIds.length > 0) {
        query._id = { $in: objectIds };
      } else if (names.length > 0) {
        query.title = { $in: names };
      }

      const categories = await Category.find(query);
      console.log(`Vendor: ${vendor.name} (${vendor._id}) -> Returns: ${categories.length} categories [${categories.map(c=>c.title).join(', ')}]`);
    }

  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}

run();
