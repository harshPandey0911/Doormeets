require('mongoose').connect('mongodb+srv://harshpandey09112004_db_user:AKJADD1jCULsc5A7@doormeet.xylkk3b.mongodb.net/civilconnect?retryWrites=true&w=majority').then(async () => {
  const Category = require('./models/Category');
  const Service = require('./models/Service');
  
  const id = '6a645a9e7525f78953e9a13d';
  
  const isCategory = await Category.findById(id);
  const isService = await Service.findById(id);
  
  console.log('Is Category:', isCategory ? isCategory.title : 'No');
  console.log('Is Service:', isService ? isService.title : 'No');
  
  process.exit();
}).catch(console.error);
