// Quick script to view all data in the database
require('dotenv').config();
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/nexora_fraud_predictor';

async function viewData() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
    console.log('📦 Database:', mongoose.connection.name);
    console.log('='.repeat(60));

    // Get all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('\n📁 Collections in database:', collections.map(c => c.name).join(', '));
    console.log('='.repeat(60));

    // Show data from each collection
    for (const col of collections) {
      const collection = mongoose.connection.db.collection(col.name);
      const count = await collection.countDocuments();
      console.log(`\n📊 ${col.name.toUpperCase()} (${count} documents)`);
      console.log('-'.repeat(40));
      
      if (count > 0) {
        const docs = await collection.find({}).limit(5).toArray();
        docs.forEach((doc, i) => {
          console.log(`\n[${i + 1}]`, JSON.stringify(doc, null, 2).substring(0, 500));
          if (JSON.stringify(doc).length > 500) console.log('  ... (truncated)');
        });
        if (count > 5) {
          console.log(`\n  ... and ${count - 5} more documents`);
        }
      } else {
        console.log('  (empty collection)');
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ Data viewing complete!');
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

viewData();
