import { AptosHackathonSDK, PROJECT_STATUS } from '../src/sdk';

// Mock the Aptos SDK
jest.mock('@aptos-labs/ts-sdk', () => ({
  Account: {
    generate: () => ({ address: () => '0xtest' }),
    fromPrivateKey: () => ({ address: () => '0xtest' }),
  },
  Aptos: jest.fn().mockImplementation(() => ({
    view: jest.fn(),
    signAndSubmitTransaction: jest.fn(),
    waitForTransaction: jest.fn(),
    getAccountAPTAmount: jest.fn(),
    getAccountTransactions: jest.fn(),
  })),
  AptosConfig: jest.fn(),
  Network: {
    TESTNET: 'testnet',
    MAINNET: 'mainnet',
  },
  AccountAddress: {
    fromString: (addr: string) => addr,
  },
  Ed25519PrivateKey: jest.fn(),
}));

describe('AptosHackathonSDK', () => {
  let sdk: AptosHackathonSDK;

  beforeEach(() => {
    sdk = new AptosHackathonSDK('testnet' as any, '0xtest');
  });

  describe('View Functions', () => {
    test('should get project count', async () => {
      const mockAptos = require('@aptos-labs/ts-sdk').Aptos;
      const aptosInstance = new mockAptos();
      aptosInstance.view.mockResolvedValue([5]);

      (sdk as any).aptos = aptosInstance;

      const count = await sdk.getProjectCount();
      expect(count).toBe(5);
    });

    test('should get project info', async () => {
      const mockAptos = require('@aptos-labs/ts-sdk').Aptos;
      const aptosInstance = new mockAptos();
      aptosInstance.view.mockResolvedValue([
        'Test Project',
        'Test Description',
        1000000,
        500000,
        PROJECT_STATUS.ACTIVE,
      ]);

      (sdk as any).aptos = aptosInstance;

      const projectInfo = await sdk.getProjectInfo(1);
      expect(projectInfo.title).toBe('Test Project');
      expect(projectInfo.targetAmount).toBe(1000000);
      expect(projectInfo.status).toBe(PROJECT_STATUS.ACTIVE);
    });

    test('should get user stats', async () => {
      const mockAptos = require('@aptos-labs/ts-sdk').Aptos;
      const aptosInstance = new mockAptos();
      aptosInstance.view.mockResolvedValue([3, 2, 2000000]);

      (sdk as any).aptos = aptosInstance;

      const stats = await sdk.getUserStats('0xtest');
      expect(stats.contributedProjectsCount).toBe(3);
      expect(stats.createdProjectsCount).toBe(2);
      expect(stats.totalContributed).toBe(2000000);
    });
  });

  describe('Transaction Functions', () => {
    test('should create project', async () => {
      const mockAptos = require('@aptos-labs/ts-sdk').Aptos;
      const aptosInstance = new mockAptos();
      aptosInstance.signAndSubmitTransaction.mockResolvedValue({
        hash: '0xtransactionhash',
      });

      (sdk as any).aptos = aptosInstance;

      const mockAccount = { address: () => '0xtest' };
      const txHash = await sdk.createProject(
        mockAccount as any,
        'Test Project',
        'Test Description',
        1000000,
        86400
      );

      expect(txHash).toBe('0xtransactionhash');
      expect(aptosInstance.signAndSubmitTransaction).toHaveBeenCalled();
    });

    test('should contribute to project', async () => {
      const mockAptos = require('@aptos-labs/ts-sdk').Aptos;
      const aptosInstance = new mockAptos();
      aptosInstance.signAndSubmitTransaction.mockResolvedValue({
        hash: '0xtransactionhash',
      });

      (sdk as any).aptos = aptosInstance;

      const mockAccount = { address: () => '0xtest' };
      const txHash = await sdk.contributeToProject(
        mockAccount as any,
        1,
        100000
      );

      expect(txHash).toBe('0xtransactionhash');
    });
  });

  describe('Utility Functions', () => {
    test('should wait for transaction', async () => {
      const mockAptos = require('@aptos-labs/ts-sdk').Aptos;
      const aptosInstance = new mockAptos();
      aptosInstance.waitForTransaction.mockResolvedValue({
        success: true,
      });

      (sdk as any).aptos = aptosInstance;

      const result = await sdk.waitForTransaction('0xtransactionhash');
      expect(result.success).toBe(true);
    });

    test('should get account balance', async () => {
      const mockAptos = require('@aptos-labs/ts-sdk').Aptos;
      const aptosInstance = new mockAptos();
      aptosInstance.getAccountAPTAmount.mockResolvedValue(1000000);

      (sdk as any).aptos = aptosInstance;

      const balance = await sdk.getAccountBalance('0xtest');
      expect(balance).toBe(1000000);
    });
  });
});
