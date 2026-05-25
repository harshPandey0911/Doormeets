require('mongoose').connect('mongodb://localhost:27017/civilconnect').then(async () => {
  const { getBrandServicesAndPricing } = require('./controllers/vendorControllers/vendorCategoryController');
  const req = {
    params: {
      categoryId: '6a102f889c9f3a4b5fa77db1',
      brandId: '6a103215ca864728ce8f6fcd'
    }
  };
  const res = {
    status: (code) => ({
      json: (data) => {
        console.log('Status:', code);
        console.log('Data:', JSON.stringify(data, null, 2));
      }
    })
  };
  await getBrandServicesAndPricing(req, res);
  process.exit();
});
