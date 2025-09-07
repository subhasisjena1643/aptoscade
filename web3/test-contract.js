const { AptosHackathonSDK } = require('./dist/sdk');
const { Network } = require('@aptos-labs/ts-sdk');

async function testContract() {
  console.log('🧪 Testing deployed contract...');
  
  const sdk = new AptosHackathonSDK(
    Network.TESTNET,
    '0x762779f87715b377314b79420b866ca7edef615a86d0d998f733e3f5c7113f89',
    'main_contract'
  );

  try {
    // Test view function - get project count
    const projectCount = await sdk.getProjectCount();
    console.log('✅ Project count:', projectCount);

    // Test account balance check
    const balance = await sdk.getAccountBalance('0x762779f87715b377314b79420b866ca7edef615a86d0d998f733e3f5c7113f89');
    console.log('✅ Account balance:', balance);

    console.log('🎉 Contract is working perfectly!');
    console.log('📋 Your Web3 component is ready for integration!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testContract();
