require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const PaintingQuotation = require('../models/PaintingQuotation');
const PaintingConsultation = require('../models/PaintingConsultation');

async function run() {
  const uri = process.env.MONGODB_URI;
  await mongoose.connect(uri);
  
  try {
    const quoteId = '6a4b6b74791d3ba26a0511df';
    const quote = await PaintingQuotation.findById(quoteId);
    if (quote) {
      console.log('--- QUOTATION ---');
      console.log(JSON.stringify(quote, null, 2));
      
      if (quote.consultationId) {
        const consultation = await PaintingConsultation.findById(quote.consultationId);
        if (consultation) {
          console.log('--- CONSULTATION ---');
          console.log(JSON.stringify(consultation, null, 2));
        }
      }
    }
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.connection.close();
  }
}

run();
