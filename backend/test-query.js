// FILE: backend/test-query.js
// Quick test script to debug queries

const mongoose = require('mongoose');
const FraudReport = require('./models/FraudReport');

async function test() {
  await mongoose.connect('mongodb://localhost:27017/nexora_fraud_predictor');
  
  const entity = 'security@amaz0n.com';
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  console.log('======= DEBUG QUERY TEST =======');
  console.log('Searching for:', entity);
  console.log('Date filter:', thirtyDaysAgo);
  console.log('');
  
  // Test exact query
  const count1 = await FraudReport.countDocuments({ 
    targetEntity: entity.toLowerCase() 
  });
  console.log('1. Total with exact entity:', count1);
  
  // Test with date filter
  const count2 = await FraudReport.countDocuments({ 
    targetEntity: entity.toLowerCase(),
    timestamp: { $gte: thirtyDaysAgo }
  });
  console.log('2. With date filter:', count2);
  
  // Test with all filters
  const count3 = await FraudReport.countDocuments({ 
    targetEntity: entity.toLowerCase(),
    timestamp: { $gte: thirtyDaysAgo },
    isActive: true
  });
  console.log('3. With all filters (isActive):', count3);
  
  // Check sample record
  const sample = await FraudReport.findOne({ targetEntity: entity.toLowerCase() });
  if (sample) {
    console.log('\nSample record:');
    console.log('  - targetEntity:', sample.targetEntity);
    console.log('  - timestamp:', sample.timestamp);
    console.log('  - isActive:', sample.isActive);
    console.log('  - entityType:', sample.entityType);
  } else {
    console.log('\n❌ No sample found!');
  }
  
  // List some entities in DB
  console.log('\n======= SAMPLE ENTITIES IN DB =======');
  const samples = await FraudReport.aggregate([
    { $group: { _id: '$targetEntity' } },
    { $limit: 10 }
  ]);
  samples.forEach(s => console.log('  -', s._id));
  
  await mongoose.connection.close();
  console.log('\n✅ Test complete');
}

test().catch(console.error);
