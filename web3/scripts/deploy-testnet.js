#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Deploying to Aptos Testnet...');

// Check if Move.toml exists
const moveTomlPath = path.join(__dirname, '..', 'contracts', 'Move.toml');
if (!fs.existsSync(moveTomlPath)) {
  console.error('❌ Move.toml not found in contracts directory');
  process.exit(1);
}

try {
  // 1. Compile the Move contracts
  console.log('📦 Compiling Move contracts...');
  execSync('aptos move compile --package-dir contracts', {
    stdio: 'inherit',
    cwd: path.join(__dirname, '..')
  });

  // 2. Test the contracts
  console.log('🧪 Testing Move contracts...');
  execSync('aptos move test --package-dir contracts', {
    stdio: 'inherit',
    cwd: path.join(__dirname, '..')
  });

  // 3. Deploy to testnet
  console.log('🌐 Publishing to testnet...');
  
  // Check if account is configured
  try {
    execSync('aptos account list', { stdio: 'pipe' });
  } catch (error) {
    console.log('⚙️  Setting up new account...');
    execSync('aptos init --network testnet', { stdio: 'inherit' });
  }

  // Fund the account
  console.log('💰 Funding account from faucet...');
  execSync('aptos account fund-with-faucet', { stdio: 'inherit' });

  // Publish the package
  const publishCommand = 'aptos move publish --package-dir contracts --named-addresses hackathon=default';
  execSync(publishCommand, {
    stdio: 'inherit',
    cwd: path.join(__dirname, '..')
  });

  console.log('✅ Deployment to testnet completed successfully!');
  
  // Get the account address
  const accountInfo = execSync('aptos account list --query balance', { encoding: 'utf8' });
  const addressMatch = accountInfo.match(/0x[a-fA-F0-9]+/);
  if (addressMatch) {
    const contractAddress = addressMatch[0];
    console.log(`📄 Contract deployed at: ${contractAddress}`);
    console.log(`🔗 Explorer: https://explorer.aptoslabs.com/account/${contractAddress}?network=testnet`);
    
    // Save contract address to .env file
    const envPath = path.join(__dirname, '..', '.env');
    let envContent = '';
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
    }
    
    // Update or add CONTRACT_ADDRESS
    if (envContent.includes('CONTRACT_ADDRESS=')) {
      envContent = envContent.replace(/CONTRACT_ADDRESS=.*/g, `CONTRACT_ADDRESS=${contractAddress}`);
    } else {
      envContent += `\nCONTRACT_ADDRESS=${contractAddress}\n`;
    }
    
    fs.writeFileSync(envPath, envContent);
    console.log('💾 Contract address saved to .env file');
  }

} catch (error) {
  console.error('❌ Deployment failed:', error.message);
  process.exit(1);
}

console.log('\n🎉 Ready to integrate with your backend and frontend!');
console.log('📚 Next steps:');
console.log('   1. Update your .env file with the contract address');
console.log('   2. Install dependencies: npm install');
console.log('   3. Build the SDK: npm run build');
console.log('   4. Run tests: npm test');
