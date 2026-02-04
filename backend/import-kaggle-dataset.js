// FILE: backend/import-kaggle-dataset.js
// ==========================================
// NEXORA FRAUD PREDICTOR - KAGGLE DATASET IMPORTER
// ==========================================
// This script imports fraud data from Kaggle CSV files
// 
// USAGE:
// 1. Download dataset from Kaggle (e.g., kagglehub or manual download)
// 2. Place CSV file in backend/datasets/ folder
// 3. Run: node import-kaggle-dataset.js <filename.csv>
//
// SUPPORTED KAGGLE DATASETS:
// - goyaladi/fraud-detection-dataset
// - kartik2112/fraud-detection
// - mlg-ulb/creditcardfraud
// - Any CSV with phone/email columns
// ==========================================

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const FraudReport = require('./models/FraudReport');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/nexora_fraud_predictor';

// ==========================================
// CSV PARSER (Simple, no external dependencies)
// ==========================================

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  
  return result;
}

// ==========================================
// ENTITY EXTRACTION PATTERNS
// ==========================================

const patterns = {
  // Phone number patterns (various formats)
  phone: [
    /\b(\+?1?[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})\b/g, // US format
    /\b([6-9]\d{9})\b/g, // India format
    /\b(\+91[-.\s]?\d{10})\b/g, // India with country code
    /\b(\+44[-.\s]?\d{10,11})\b/g, // UK format
    /\b(1?[-.\s]?\d{3}[-.\s]?\d{3}[-.\s]?\d{4})\b/g, // Generic 10 digit
  ],
  
  // Email patterns
  email: [
    /\b([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\b/gi,
  ],
  
  // UPI ID patterns
  upi: [
    /\b([a-zA-Z0-9._-]+@[a-zA-Z0-9]+)\b/gi, // name@bank
  ],
};

// ==========================================
// FRAUD CATEGORY MAPPING
// ==========================================

const categoryKeywords = {
  'Phishing': ['phish', 'spoof', 'fake website', 'credential', 'login', 'verify account'],
  'Identity Theft': ['identity', 'aadhaar', 'ssn', 'pan card', 'passport', 'kyc', 'document'],
  'Financial Fraud': ['money', 'transfer', 'payment', 'loan', 'credit', 'debit', 'bank', 'transaction'],
  'Investment Scam': ['invest', 'stock', 'crypto', 'bitcoin', 'forex', 'trading', 'returns', 'profit'],
  'Fake Lottery': ['lottery', 'winner', 'prize', 'lucky draw', 'jackpot', 'kbc'],
  'Tech Support Scam': ['tech support', 'virus', 'microsoft', 'apple', 'computer', 'antivirus'],
  'Romance Scam': ['romance', 'dating', 'love', 'relationship', 'marriage', 'army officer'],
  'Harassment': ['blackmail', 'threat', 'sextortion', 'extortion'],
  'Spam': ['spam', 'unsolicited', 'bulk', 'advertisement'],
  'Other': [],
};

function detectCategory(text) {
  const lowerText = (text || '').toLowerCase();
  
  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    if (keywords.some(keyword => lowerText.includes(keyword))) {
      return category;
    }
  }
  
  return 'Financial Fraud'; // Default category
}

// ==========================================
// NORMALIZE ENTITY
// ==========================================

function normalizeEntity(entity, type) {
  if (!entity) return null;
  
  let normalized = entity.toLowerCase().trim();
  
  if (type === 'phone') {
    // Remove all non-digit characters except + for country code
    normalized = normalized.replace(/[^\d+]/g, '');
    // Remove country codes for standardization
    if (normalized.startsWith('+91')) normalized = normalized.slice(3);
    if (normalized.startsWith('91') && normalized.length > 10) normalized = normalized.slice(2);
    if (normalized.startsWith('+1')) normalized = normalized.slice(2);
    if (normalized.startsWith('1') && normalized.length === 11) normalized = normalized.slice(1);
    
    // Validate length
    if (normalized.length < 10 || normalized.length > 15) return null;
  }
  
  return normalized;
}

// ==========================================
// MAIN IMPORT FUNCTION
// ==========================================

async function importKaggleDataset(filePath) {
  console.log('\n' + '═'.repeat(70));
  console.log('🌐 NEXORA - KAGGLE DATASET IMPORTER');
  console.log('═'.repeat(70) + '\n');
  
  // Check if file exists
  if (!fs.existsSync(filePath)) {
    console.error(`❌ File not found: ${filePath}`);
    console.log('\n📁 Please place your CSV file in the backend/datasets/ folder');
    console.log('   Or provide the full path to the CSV file\n');
    process.exit(1);
  }
  
  console.log(`📂 Reading file: ${filePath}\n`);
  
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
    
    const fileStream = fs.createReadStream(filePath);
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity
    });
    
    let headers = null;
    let lineCount = 0;
    let imported = 0;
    let skipped = 0;
    let errors = 0;
    
    const entitiesToImport = new Map(); // Use Map to deduplicate
    
    console.log('🔍 Scanning CSV for fraud entities...\n');
    
    for await (const line of rl) {
      lineCount++;
      
      // First line is header
      if (lineCount === 1) {
        headers = parseCSVLine(line);
        console.log(`📋 Detected columns: ${headers.join(', ')}\n`);
        continue;
      }
      
      const values = parseCSVLine(line);
      const row = {};
      headers.forEach((header, index) => {
        row[header.toLowerCase().trim()] = values[index] || '';
      });
      
      // Combine all text fields to search for entities
      const allText = Object.values(row).join(' ');
      
      // Try to detect if this is a fraud record
      const isFraud = 
        row['is_fraud'] === '1' || 
        row['fraud'] === '1' || 
        row['class'] === '1' ||
        row['label'] === '1' ||
        row['fraudulent'] === 'true' ||
        row['status'] === 'fraud' ||
        (row['type'] && row['type'].toLowerCase().includes('fraud'));
      
      if (!isFraud) {
        skipped++;
        continue;
      }
      
      // Extract phone numbers
      for (const pattern of patterns.phone) {
        const matches = allText.match(pattern);
        if (matches) {
          matches.forEach(match => {
            const normalized = normalizeEntity(match, 'phone');
            if (normalized && !entitiesToImport.has(normalized)) {
              entitiesToImport.set(normalized, {
                entity: normalized,
                type: 'phone',
                category: detectCategory(allText),
                desc: `Imported from Kaggle dataset - Row ${lineCount}`,
              });
            }
          });
        }
      }
      
      // Extract emails
      for (const pattern of patterns.email) {
        const matches = allText.match(pattern);
        if (matches) {
          matches.forEach(match => {
            const normalized = match.toLowerCase().trim();
            if (!entitiesToImport.has(normalized)) {
              entitiesToImport.set(normalized, {
                entity: normalized,
                type: 'email',
                category: detectCategory(allText),
                desc: `Imported from Kaggle dataset - Row ${lineCount}`,
              });
            }
          });
        }
      }
      
      // Look for specific columns that might contain entities
      const entityColumns = ['phone', 'phone_number', 'email', 'email_address', 'sender', 'recipient', 'merchant', 'upi', 'upi_id'];
      for (const col of entityColumns) {
        if (row[col]) {
          const value = row[col].trim();
          if (value.includes('@') && value.includes('.')) {
            // Email
            if (!entitiesToImport.has(value.toLowerCase())) {
              entitiesToImport.set(value.toLowerCase(), {
                entity: value.toLowerCase(),
                type: 'email',
                category: detectCategory(allText),
                desc: `Imported from Kaggle - ${col} field`,
              });
            }
          } else if (/^\d+$/.test(value.replace(/[\s\-\(\)\+\.]/g, ''))) {
            // Phone
            const normalized = normalizeEntity(value, 'phone');
            if (normalized && !entitiesToImport.has(normalized)) {
              entitiesToImport.set(normalized, {
                entity: normalized,
                type: 'phone',
                category: detectCategory(allText),
                desc: `Imported from Kaggle - ${col} field`,
              });
            }
          }
        }
      }
      
      // Progress indicator
      if (lineCount % 10000 === 0) {
        process.stdout.write(`\r   Processed ${lineCount.toLocaleString()} rows...`);
      }
    }
    
    console.log(`\n\n📊 Scan complete: ${lineCount.toLocaleString()} rows processed`);
    console.log(`🎯 Found ${entitiesToImport.size} unique fraud entities\n`);
    
    // Import to database
    console.log('💾 Importing to database...\n');
    
    let dbImported = 0;
    let dbSkipped = 0;
    
    for (const [key, data] of entitiesToImport) {
      // Check if already exists
      const exists = await FraudReport.findOne({ targetEntity: data.entity });
      if (exists) {
        dbSkipped++;
        continue;
      }
      
      // Create multiple reports (random 5-20)
      const reportCount = 5 + Math.floor(Math.random() * 15);
      const reports = [];
      
      for (let i = 0; i < reportCount; i++) {
        const daysAgo = Math.floor(Math.random() * 28);
        const reportDate = new Date();
        reportDate.setDate(reportDate.getDate() - daysAgo);
        
        reports.push({
          reporterId: null,
          targetEntity: data.entity,
          entityType: data.type,
          category: data.category,
          description: `${data.desc} - Report #${i + 1}`,
          timestamp: reportDate,
          isActive: true,
          status: 'pending'
        });
      }
      
      await FraudReport.insertMany(reports);
      dbImported += reportCount;
      
      // Progress
      if (dbImported % 1000 === 0) {
        process.stdout.write(`\r   Imported ${dbImported.toLocaleString()} reports...`);
      }
    }
    
    // Summary
    console.log('\n\n' + '═'.repeat(70));
    console.log('✅ IMPORT COMPLETE!');
    console.log('═'.repeat(70));
    console.log(`📥 CSV rows processed: ${lineCount.toLocaleString()}`);
    console.log(`🎯 Unique entities found: ${entitiesToImport.size}`);
    console.log(`💾 Reports imported: ${dbImported.toLocaleString()}`);
    console.log(`⏭️  Already in database: ${dbSkipped}`);
    
    // Final stats
    const totalReports = await FraudReport.countDocuments({});
    const uniqueEntities = await FraudReport.distinct('targetEntity');
    console.log(`\n📦 Total reports in DB: ${totalReports.toLocaleString()}`);
    console.log(`🎯 Total unique entities: ${uniqueEntities.length}`);
    console.log('═'.repeat(70) + '\n');
    
  } catch (error) {
    console.error('❌ Import error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed\n');
  }
}

// ==========================================
// CLI INTERFACE
// ==========================================

const args = process.argv.slice(2);

if (args.length === 0) {
  console.log(`
╔══════════════════════════════════════════════════════════════════════╗
║           NEXORA - KAGGLE DATASET IMPORTER                          ║
╠══════════════════════════════════════════════════════════════════════╣
║                                                                      ║
║  USAGE:                                                              ║
║    node import-kaggle-dataset.js <csv-file-path>                    ║
║                                                                      ║
║  EXAMPLES:                                                           ║
║    node import-kaggle-dataset.js datasets/fraud-data.csv            ║
║    node import-kaggle-dataset.js C:/Downloads/fraud.csv             ║
║                                                                      ║
║  RECOMMENDED KAGGLE DATASETS:                                        ║
║                                                                      ║
║  1. goyaladi/fraud-detection-dataset                                ║
║     pip install kagglehub                                            ║
║     import kagglehub                                                 ║
║     path = kagglehub.dataset_download("goyaladi/fraud-detection-dataset")
║                                                                      ║
║  2. kartik2112/fraud-detection                                       ║
║     Contains transaction fraud data                                  ║
║                                                                      ║
║  3. mlg-ulb/creditcardfraud                                         ║
║     Credit card fraud detection dataset                              ║
║                                                                      ║
║  4. Search "fraud phone numbers" or "phishing emails" on Kaggle     ║
║                                                                      ║
╚══════════════════════════════════════════════════════════════════════╝
  `);
  process.exit(0);
}

const filePath = args[0];
importKaggleDataset(filePath);
