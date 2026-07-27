require('mongoose').connect('mongodb+srv://harshpandey09112004_db_user:AKJADD1jCULsc5A7@doormeet.xylkk3b.mongodb.net/civilconnect?retryWrites=true&w=majority').then(async () => {
  const Vendor = require('./models/Vendor');
  const Category = require('./models/Category');
  const Service = require('./models/Service');
  
  const vendors = await Vendor.find({}).select('name service categories subCategories');
  for (const v of vendors) {
    console.log(`\nVendor: ${v.name}`);
    console.log('service:', v.service);
    console.log('categories:', v.categories);
    console.log('subCategories:', v.subCategories);
    
    for (const id of v.service) {
      const c = await Category.findById(id);
      if (c) console.log(`  - service ID ${id} is Category: ${c.title}`);
      else {
        const s = await Service.findById(id);
        if (s) console.log(`  - service ID ${id} is Service: ${s.title}`);
      }
    }
  }
  process.exit();
}).catch(console.error);
