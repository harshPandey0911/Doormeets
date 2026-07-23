const axios = require('axios');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const token = jwt.sign(
  { userId: '6a100ce6b4d5de086f4f61d4', role: 'USER', loginSessionId: '1234567890' },
  process.env.JWT_SECRET,
  { expiresIn: '7d' }
);

async function run() {
  try {
    const res = await axios.post('http://localhost:5000/api/user/support/tickets', {
      subject: 'Test Support Request',
      message: 'This is a test message from script',
      category: 'general',
      priority: 'medium'
    }, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    console.log("Response:", res.data);
  } catch (err) {
    console.error("Error status:", err.response ? err.response.status : 'No response');
    console.error("Error data:", err.response ? err.response.data : err.message);
  }
}

run();
