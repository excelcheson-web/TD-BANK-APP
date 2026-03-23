#!/usr/bin/env node
/**
 * Deploy Firestore Security Rules
 * 
 * This script deploys the updated firestore.rules to Firebase.
 * Run with: node deploy-rules.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔥 Deploying Firestore Security Rules...\n');

// Check if firebase-tools is installed
try {
  execSync('firebase --version', { stdio: 'ignore' });
} catch (err) {
  console.error('❌ Firebase CLI not found. Installing...');
  try {
    execSync('npm install -g firebase-tools', { stdio: 'inherit' });
  } catch (installErr) {
    console.error('❌ Failed to install Firebase CLI. Please install manually:');
    console.error('   npm install -g firebase-tools');
    process.exit(1);
  }
}

// Check if firestore.rules exists
const rulesPath = path.join(__dirname, 'firestore.rules');
if (!fs.existsSync(rulesPath)) {
  console.error('❌ firestore.rules file not found!');
  process.exit(1);
}

console.log('📄 Found firestore.rules');
console.log('🚀 Deploying to Firebase...\n');

// Deploy only Firestore rules
try {
  execSync('firebase deploy --only firestore:rules', { 
    stdio: 'inherit',
    cwd: __dirname 
  });
  console.log('\n✅ Firestore rules deployed successfully!');
  console.log('\n📋 Summary of changes:');
  console.log('   • Admins can now read all user profiles');
  console.log('   • Admins can read/write all user transactions');
  console.log('   • Regular users can only access their own data');
} catch (err) {
  console.error('\n❌ Deployment failed:', err.message);
  console.error('\nMake sure you are logged in to Firebase:');
  console.error('   firebase login');
  process.exit(1);
}
