const axios = require('axios');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function test() {
  const API_URL = 'http://localhost:5000/api';
  console.log('1. Logging in with 6263079701 (Harsh Kanojiya)...');
  try {
    const loginRes = await axios.post(`${API_URL}/vendors/auth/verify-login`, {
      phone: '6263079701',
      otp: '123456'
    });
    
    if (!loginRes.data.success) {
      console.error('Login failed:', loginRes.data);
      return;
    }
    
    const token = loginRes.data.accessToken;
    console.log('Login successful! Token obtained.');

    const headers = {
      Authorization: `Bearer ${token}`
    };

    console.log('\n2. Creating simulated worker...');
    const workerPayload = {
      name: 'Simulated Worker',
      phone: '9876543299',
      email: '',
      aadhar: {
        number: '123456789012',
        document: 'https://res.cloudinary.com/deorxby43/image/upload/v1779695058/vendors/documents/jenam0ubwilxc196j8xc.webp'
      },
      serviceCategories: ['Beauty Packages'],
      address: {
        addressLine1: 'Corporate House',
        city: 'Indore',
        state: 'Madhya Pradesh',
        pincode: '452001'
      }
    };

    let createdWorkerId = null;
    try {
      const workerRes = await axios.post(`${API_URL}/vendors/workers`, workerPayload, { headers });
      console.log('Worker creation successful:', workerRes.data);
      createdWorkerId = workerRes.data.data?._id;
    } catch (err) {
      console.error('Worker creation FAILED. Status:', err.response?.status);
      console.error('Response data:', JSON.stringify(err.response?.data, null, 2));
    }

    if (createdWorkerId) {
      console.log('\n3. Editing Worker Phone and Email (Empty string)...');
      const updatePayload = {
        name: 'Simulated Worker Updated',
        phone: '9876543298', // Changing from ...99 to ...98
        email: '', // Empty string to verify optional checkFalsy works
        serviceCategories: ['Beauty Packages']
      };

      try {
        const updateRes = await axios.put(`${API_URL}/vendors/workers/${createdWorkerId}`, updatePayload, { headers });
        console.log('Worker update successful:', updateRes.data);
      } catch (err) {
        console.error('Worker update FAILED. Status:', err.response?.status);
        console.error('Response data:', JSON.stringify(err.response?.data, null, 2));
      }

      console.log('\n4. Cleaning up test worker...');
      await axios.delete(`${API_URL}/vendors/workers/${createdWorkerId}`, { headers });
      console.log('Cleanup successful.');
    }

  } catch (error) {
    console.error('Error during test:', error.message);
  }
}

test();
