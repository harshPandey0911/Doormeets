/**
 * seedTrainingData.js
 * Seeds 4 sample training videos and 10 MCQ questions for testing.
 * Run: node scripts/seedTrainingData.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const connectDB = require('../config/db');

const TrainingVideo = require('../models/TrainingVideo');
const TrainingQuestion = require('../models/TrainingQuestion');

const sampleVideos = [
  {
    title: 'Welcome to Doormeets — Vendor Orientation',
    description: 'Learn about the platform, how bookings work, and your responsibilities as a vendor.',
    videoUrl: 'dQw4w9WgXcQ', // Replace with actual YouTube ID
    videoSource: 'youtube',
    durationSeconds: 480,
    isRequired: true,
    order: 1
  },
  {
    title: 'Customer Service Excellence',
    description: 'How to greet customers, handle complaints, and maintain professional behavior on-site.',
    videoUrl: 'jNQXAC9IVRw',
    videoSource: 'youtube',
    durationSeconds: 360,
    isRequired: true,
    order: 2
  },
  {
    title: 'Safety & Tools — On-Site Best Practices',
    description: 'Personal protective equipment, safe tool usage, and worksite safety standards.',
    videoUrl: 'QH2-TGUlwu4',
    videoSource: 'youtube',
    durationSeconds: 420,
    isRequired: true,
    order: 3
  },
  {
    title: 'Payments & Billing — How It Works',
    description: 'Understanding the billing process, payment methods, wallet earnings, and dues.',
    videoUrl: 'kffacxfA7G4',
    videoSource: 'youtube',
    durationSeconds: 300,
    isRequired: false,
    order: 4
  }
];

const sampleQuestions = [
  {
    question: 'What is the primary responsibility of a Doormeets vendor when arriving at a customer\'s home?',
    options: [
      { text: 'Complete the job as quickly as possible', isCorrect: false },
      { text: 'Introduce yourself politely, show your ID badge and confirm the service required', isCorrect: true },
      { text: 'Ask for payment before starting work', isCorrect: false },
      { text: 'Call the admin before entering', isCorrect: false }
    ],
    explanation: 'Professional conduct starts with a proper introduction and confirming the service scope before beginning work.',
    difficulty: 'easy'
  },
  {
    question: 'What should a vendor do if a customer complains about the quality of service?',
    options: [
      { text: 'Argue and defend your work', isCorrect: false },
      { text: 'Ignore the complaint and leave', isCorrect: false },
      { text: 'Listen calmly, apologize, try to resolve it; if unresolved, escalate through the app', isCorrect: true },
      { text: 'Ask for more money to fix it', isCorrect: false }
    ],
    explanation: 'Customer complaints should always be handled professionally. The platform has a support escalation mechanism.',
    difficulty: 'medium'
  },
  {
    question: 'What is the correct way to handle the Doormeets payment OTP at job completion?',
    options: [
      { text: 'Ask the customer to share the OTP via phone call', isCorrect: false },
      { text: 'Enter any 6-digit number — it auto-approves', isCorrect: false },
      { text: 'Customer shows you the OTP in their app; you enter it to confirm job completion', isCorrect: true },
      { text: 'OTP is not required for payment', isCorrect: false }
    ],
    explanation: 'The payment OTP system ensures mutual confirmation that the job is complete before billing is processed.',
    difficulty: 'medium'
  },
  {
    question: 'According to safety standards, what must a vendor always carry on-site?',
    options: [
      { text: 'Only a mobile phone', isCorrect: false },
      { text: 'Tools, personal protective equipment (PPE), and their Doormeets ID', isCorrect: true },
      { text: 'A company letterhead', isCorrect: false },
      { text: 'Cash for change', isCorrect: false }
    ],
    explanation: 'PPE protects you and the customer. Your Doormeets ID provides trust and authenticity.',
    difficulty: 'easy'
  },
  {
    question: 'What does "L1 Vendor" mean in the Doormeets certification system?',
    options: [
      { text: 'First vendor to join the platform', isCorrect: false },
      { text: 'A vendor who scored 80% or above in the certification test (premium level)', isCorrect: true },
      { text: 'A vendor with the lowest commission rate', isCorrect: false },
      { text: 'A vendor on their first booking', isCorrect: false }
    ],
    explanation: 'L1 is the highest level, awarded for 80%+ test scores. L1 vendors get priority in job allocation.',
    difficulty: 'easy'
  },
  {
    question: 'A customer cancels the booking after you have started the journey to their location. What happens?',
    options: [
      { text: 'You receive full payment for the booking', isCorrect: false },
      { text: 'No financial impact — the booking simply closes', isCorrect: false },
      { text: 'A cancellation fee is charged to the customer, which partially compensates you', isCorrect: true },
      { text: 'You must pay a penalty to the platform', isCorrect: false }
    ],
    explanation: 'The platform charges a cancellation fee to the customer after journey start to compensate vendors.',
    difficulty: 'medium'
  },
  {
    question: 'What is the maximum allowed cash collection limit for a vendor before dues must be cleared?',
    options: [
      { text: '₹5,000', isCorrect: false },
      { text: '₹10,000', isCorrect: true },
      { text: '₹50,000', isCorrect: false },
      { text: 'There is no limit', isCorrect: false }
    ],
    explanation: 'The default cash limit is ₹10,000. Exceeding this freezes cash payment acceptance until dues are settled.',
    difficulty: 'hard'
  },
  {
    question: 'What should a vendor do if they arrive at the customer location and cannot complete the service?',
    options: [
      { text: 'Leave without informing anyone', isCorrect: false },
      { text: 'Mark the booking as completed anyway', isCorrect: false },
      { text: 'Contact support through the app, explain the situation, and await instructions', isCorrect: true },
      { text: 'Ask another vendor to take over without platform notification', isCorrect: false }
    ],
    explanation: 'All exceptions must be reported through official channels to ensure customer satisfaction and proper documentation.',
    difficulty: 'medium'
  },
  {
    question: 'How does the Doormeets trust score work?',
    options: [
      { text: 'It increases automatically every month', isCorrect: false },
      { text: 'It starts at 100 and decreases with complaints, cancellations, or misconduct', isCorrect: true },
      { text: 'It is determined solely by customer star ratings', isCorrect: false },
      { text: 'It has no impact on your account', isCorrect: false }
    ],
    explanation: 'The trust score reflects overall platform behavior. A low trust score can affect job allocation priority.',
    difficulty: 'hard'
  },
  {
    question: 'When using power tools at a customer\'s home, what is the first safety step?',
    options: [
      { text: 'Check the tool is plugged in correctly', isCorrect: false },
      { text: 'Start immediately to save time', isCorrect: false },
      { text: 'Inspect the work area for hazards, ensure PPE is worn, and get customer approval for the work area', isCorrect: true },
      { text: 'Call a helper before using any tools', isCorrect: false }
    ],
    explanation: 'Safety assessment before starting protects both the vendor and the customer from accidents.',
    difficulty: 'hard'
  }
];

const seed = async () => {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await connectDB();
    console.log('✅ Connected\n');

    // ── Videos ──
    const existingVideos = await TrainingVideo.countDocuments();
    if (existingVideos === 0) {
      await TrainingVideo.insertMany(sampleVideos);
      console.log(`✅ Inserted ${sampleVideos.length} training videos`);
    } else {
      console.log(`⚠️  Skipping videos — ${existingVideos} already exist`);
    }

    // ── Questions ──
    const existingQuestions = await TrainingQuestion.countDocuments();
    if (existingQuestions === 0) {
      await TrainingQuestion.insertMany(sampleQuestions);
      console.log(`✅ Inserted ${sampleQuestions.length} MCQ questions`);
    } else {
      console.log(`⚠️  Skipping questions — ${existingQuestions} already exist`);
    }

    console.log('\n🎉 Training data seed complete!');
    console.log('📹 Videos: 4 (3 required, 1 optional)');
    console.log('📝 Questions: 10 (easy: 3, medium: 4, hard: 3)');
    console.log('📊 Passing score: 50% (≥80% = L1, 50-79% = L2, <50% = L3)');

  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
};

seed();
