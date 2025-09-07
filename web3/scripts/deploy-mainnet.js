#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🚨 MAINNET DEPLOYMENT - PROCEED WITH CAUTION');
console.log('⚠️  This will deploy to Aptos mainnet using real APT tokens');

rl.question('Are you sure you want to deploy to mainnet? (yes/no): ', (answer) => {
  if (answer.toLowerCase() !== 'yes') {
    console.log('❌ Mainnet deployment cancelled');
    rl.close();
    process.exit(0);
  }

  rl.question('Please type "DEPLOY TO MAINNET" to confirm: ', (confirmation) => {
    if (confirmation !== 'DEPLOY TO MAINNET') {
      console.log('❌ Confirmation failed. Deployment cancelled');
      rl.close();
      process.exit(0);
    }

    rl.close();
    deployToMainnet();
  });
});

function deployToMainnet() {
  console.log('🚀 Starting mainnet deployment...');

  // Check if Move.toml exists
  const moveTomlPath = path.join(__dirname, '..', 'contracts', 'Move.toml');
  if (!fs.existsSync(moveTomlPath)) {
    console.error('❌ Move.toml not found in contracts directory');
    process.exit(1);
  }

  // Check for mainnet configuration
  const envPath = path.join(__dirname, '..', '.env');
  if (!fs.existsSync(envPath)) {
    console.error('❌ .env file not found. Please configure mainnet settings');
    process.exit(1);
  }

  try {
    // 1. Compile the Move contracts
    console.log('📦 Compiling Move contracts...');
    execSync('aptos move compile --package-dir contracts', {
      stdio: 'inherit',
      cwd: path.join(__dirname, '..')
    });

    // 2. Run comprehensive tests
    console.log('🧪 Running comprehensive tests...');
    execSync('aptos move test --package-dir contracts', {
      stdio: 'inherit',
      cwd: path.join(__dirname, '..')
    });

    // 3. Switch to mainnet
    console.log('🌐 Configuring for mainnet...');
    
    // Check if mainnet profile exists
    try {
      execSync('aptos config show-profiles', { stdio: 'pipe' });
    } catch (error) {
      console.log('⚙️  Creating mainnet profile...');
      execSync('aptos init --profile mainnet --network mainnet', { stdio: 'inherit' });
    }

    // 4. Check account balance
    console.log('💰 Checking account balance...');
    const balanceOutput = execSync('aptos account list --query balance --profile mainnet', { encoding: 'utf8' });
    console.log(balanceOutput);

    // Warn about gas costs
    console.log('⚠️  Mainnet deployment will consume real APT tokens for gas');
    console.log('⚠️  Make sure you have sufficient balance');

    // 5. Deploy to mainnet
    console.log('🚀 Publishing to mainnet...');
    const publishCommand = 'aptos move publish --package-dir contracts --named-addresses hackathon=default --profile mainnet';
    execSync(publishCommand, {
      stdio: 'inherit',
      cwd: path.join(__dirname, '..')
    });

    console.log('✅ Deployment to mainnet completed successfully!');
    
    // Get the account address
    const accountInfo = execSync('aptos account list --query balance --profile mainnet', { encoding: 'utf8' });
    const addressMatch = accountInfo.match(/0x[a-fA-F0-9]+/);
    if (addressMatch) {
      const contractAddress = addressMatch[0];
      console.log(`📄 Contract deployed at: ${contractAddress}`);
      console.log(`🔗 Explorer: https://explorer.aptoslabs.com/account/${contractAddress}?network=mainnet`);
      
      // Update .env for mainnet
      let envContent = fs.readFileSync(envPath, 'utf8');
      
      // Update network and contract address for mainnet
      envContent = envContent.replace(/APTOS_NETWORK=.*/g, 'APTOS_NETWORK=mainnet');
      envContent = envContent.replace(/APTOS_NODE_URL=.*/g, 'APTOS_NODE_URL=https://fullnode.mainnet.aptoslabs.com/v1');
      
      if (envContent.includes('CONTRACT_ADDRESS=')) {
        envContent = envContent.replace(/CONTRACT_ADDRESS=.*/g, `CONTRACT_ADDRESS=${contractAddress}`);
      } else {
        envContent += `\nCONTRACT_ADDRESS=${contractAddress}\n`;
      }
      
      fs.writeFileSync(envPath, envContent);
      console.log('💾 Mainnet configuration saved to .env file');
    }

    console.log('\n🎉 MAINNET DEPLOYMENT SUCCESSFUL!');
    console.log('🚨 IMPORTANT: Update your frontend and backend to use mainnet endpoints');
    console.log('📱 Notify users to switch their wallets to mainnet');
    console.log('🔍 Monitor the contract on Aptos Explorer');

  } catch (error) {
    console.error('❌ Mainnet deployment failed:', error.message);
    console.log('🛠️  Please check your configuration and try again');
    process.exit(1);
  }
}
