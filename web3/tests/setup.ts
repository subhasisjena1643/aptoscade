// Jest setup file
import * as dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: '.env.test' });

/**
 * Test setup and global configurations
 */

// Import Jest types for global availability
import '@jest/types';

// Add Node.js polyfills for browser APIs
const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Extend Jest timeout for blockchain operations
jest.setTimeout(30000);

// Mock console in tests
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
  log: jest.fn(),
};

// Mock window object for wallet tests
Object.defineProperty(window, 'aptos', {
  writable: true,
  value: {
    connect: jest.fn(),
    disconnect: jest.fn(),
    signTransaction: jest.fn(),
  },
});

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
});
