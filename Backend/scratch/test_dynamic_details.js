const http = require('http');

http.get('http://localhost:5000/api/public/services/6a54b056848c9cf2798ab520/dynamic-details', (res) => {
  let data = '';
  res.on('data', chunk => { data += chunk; });
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      console.log("Success:", json.success);
      if (json.service) {
        console.log("Title:", json.service.title);
        console.log("Price:", json.service.price);
        console.log("BasePrice:", json.service.basePrice);
        console.log("OriginalPrice:", json.service.originalPrice);
      }
    } catch (e) {
      console.error(e);
    }
  });
});
