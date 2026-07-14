const http = require('http');

http.get('http://localhost:5000/api/public/services?categoryId=6a53aff11ac1bf137612a9c9', (res) => {
  let data = '';
  res.on('data', chunk => { data += chunk; });
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      console.log("Response success:", json.success);
      if (json.services && json.services.length > 0) {
        const svc = json.services[0];
        console.log("Service Title:", svc.title);
        console.log("Service ID:", svc.id || svc._id);
        console.log("Variants array exists:", Array.isArray(svc.variants));
        console.log("Variants count:", svc.variants ? svc.variants.length : 'undefined');
        console.log("Variants:", JSON.stringify(svc.variants, null, 2));
      } else {
        console.log("No services returned");
      }
    } catch (e) {
      console.error("Parse error:", e);
    }
  });
}).on('error', (err) => {
  console.error("HTTP error:", err);
});
