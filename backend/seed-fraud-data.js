// FILE: backend/seed-fraud-data.js
// Script to pre-populate database with known fraudulent entities

const mongoose = require('mongoose');
const FraudReport = require('./models/FraudReport');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/fraud_predictor';

// Known fraudulent entities (sample data for demo)
const knownFraudulentEntities = [
  // Phone numbers (format normalized - no dashes or parentheses)
  { targetEntity: '7632743899', entityType: 'phone', category: 'Phishing', description: 'Known scam caller - pretends to be IRS', reportsCount: 15 },
  { targetEntity: '9876543210', entityType: 'phone', category: 'Financial Fraud', description: 'Lottery scam calls', reportsCount: 8 },
  { targetEntity: '8005551234', entityType: 'phone', category: 'Tech Support Scam', description: 'Fake Microsoft support scam', reportsCount: 22 },
  { targetEntity: '9998887777', entityType: 'phone', category: 'Romance Scam', description: 'Romance scam targeting elderly', reportsCount: 6 },
  { targetEntity: '1234567890', entityType: 'phone', category: 'Identity Theft', description: 'Phishing for SSN and bank details', reportsCount: 12 },
  
  // Emails
  { targetEntity: 'prince.nigeria@scam.com', entityType: 'email', category: 'Financial Fraud', description: 'Nigerian prince inheritance scam', reportsCount: 50 },
  { targetEntity: 'support@amaz0n-verify.com', entityType: 'email', category: 'Phishing', description: 'Fake Amazon verification phishing', reportsCount: 35 },
  { targetEntity: 'winner@lotteryscam.net', entityType: 'email', category: 'Fake Lottery', description: 'Fake lottery winner notification', reportsCount: 28 },
  { targetEntity: 'verify@paypa1-secure.com', entityType: 'email', category: 'Identity Theft', description: 'PayPal phishing for credentials', reportsCount: 40 },
  { targetEntity: 'helpdesk@microsoft-alert.com', entityType: 'email', category: 'Tech Support Scam', description: 'Fake Microsoft virus alert', reportsCount: 18 },
  { targetEntity: 'scam@test.com', entityType: 'email', category: 'Identity Theft', description: 'Known scam email for testing', reportsCount: 10 },
  
  // UPI IDs
  { targetEntity: 'fraudster@upi', entityType: 'upi', category: 'Financial Fraud', description: 'Fake payment request scam', reportsCount: 7 },
  { targetEntity: 'givemoney@ybl', entityType: 'upi', category: 'Investment Scam', description: 'Fake crypto investment scheme', reportsCount: 5 },
  
  // Bank accounts
  { targetEntity: '1234567890123456', entityType: 'bank', category: 'Financial Fraud', description: 'Fraudulent bank account for money laundering', reportsCount: 3 },
];

async function seedDatabase() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Clear existing fraud reports (optional - comment out to keep existing)
    // await FraudReport.deleteMany({});
    // console.log('🗑️ Cleared existing reports');
    
    let totalCreated = 0;
    
    for (const entity of knownFraudulentEntities) {
      // Check if reports already exist for this entity
      const existingCount = await FraudReport.countDocuments({ 
        targetEntity: entity.targetEntity.toLowerCase() 
      });
      
      if (existingCount > 0) {
        console.log(`⏭️ Skipping ${entity.targetEntity} - already has ${existingCount} reports`);
        continue;
      }
      
      // Create multiple reports based on reportsCount
      const reports = [];
      for (let i = 0; i < entity.reportsCount; i++) {
        // Spread reports over the last 30 days
        const daysAgo = Math.floor(Math.random() * 25); // Random day within last 25 days
        const reportDate = new Date();
        reportDate.setDate(reportDate.getDate() - daysAgo);
        
        reports.push({
          reporterId: null, // Anonymous reports
          targetEntity: entity.targetEntity.toLowerCase(),
          entityType: entity.entityType,
          category: entity.category,
          description: `${entity.description} - Report #${i + 1}`,
          timestamp: reportDate,
          isActive: true,
          status: 'verified'
        });
      }
      
      await FraudReport.insertMany(reports);
      totalCreated += reports.length;
      console.log(`✅ Created ${reports.length} reports for ${entity.targetEntity}`);
    }
    
    console.log('\n========================================');
    console.log(`🎉 SEED COMPLETE: ${totalCreated} reports created`);
    console.log('========================================');
    
    // Show summary
    const totalReports = await FraudReport.countDocuments({});
    console.log(`📊 Total reports in database: ${totalReports}`);
    
    // Show unique entities
    const uniqueEntities = await FraudReport.distinct('targetEntity');
    console.log(`📋 Unique reported entities: ${uniqueEntities.length}`);
    
    console.log('\n🧪 Test these entities:');
    console.log('   Phone: 7632743899, 9876543210, 8005551234');
    console.log('   Email: prince.nigeria@scam.com, scam@test.com');
    console.log('========================================\n');
    
  } catch (error) {
    console.error('❌ Seed error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Run the seed
seedDatabase();
