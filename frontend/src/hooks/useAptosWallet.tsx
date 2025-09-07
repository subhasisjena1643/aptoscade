// Aptos Wallet Integration - leveraging teammates' comprehensive Web3 infrastructure
"use client";

import { useState, useEffect, useCallback } from 'react';
import { 
  Aptos, 
  Account, 
  AccountAddress
} from "@aptos-labs/ts-sdk";
import { aptos, APTOSCADE_CONTRACT_ADDRESS, AptosError, isValidAptosAddress } from '@/lib/aptos';

// Wallet connection states
export type WalletConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error';

// Supported wallet types (based on available adapters)
export type SupportedWallet = 'petra' | 'martian' | 'pontem' | 'keyless';

// Wallet account information
export interface WalletAccount {
  address: string;
  publicKey?: string;
  authKey?: string;
}

// Balance information
export interface WalletBalance {
  apt: number;
  formattedAPT: string;
  usd?: number;
}

// Transaction result
export interface TransactionResult {
  hash: string;
  success: boolean;
  gasUsed?: number;
  error?: string;
}

// Hook for Aptos wallet integration
export function useAptosWallet() {
  const [connectionState, setConnectionState] = useState<WalletConnectionState>('disconnected');
  const [account, setAccount] = useState<WalletAccount | null>(null);
  const [balance, setBalance] = useState<WalletBalance | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Check if wallet is already connected on mount
  useEffect(() => {
    checkExistingConnection();
  }, []);

  // Check for existing wallet connection (localStorage or session)
  const checkExistingConnection = async () => {
    try {
      // Check for stored account from teammates' keyless auth system
      const storedAccount = localStorage.getItem('aptoscade_wallet_account');
      if (storedAccount) {
        const parsedAccount = JSON.parse(storedAccount);
        if (isValidAptosAddress(parsedAccount.address)) {
          setAccount(parsedAccount);
          setConnectionState('connected');
          await fetchBalance(parsedAccount.address);
        }
      }
    } catch (error) {
      console.error('Error checking existing connection:', error);
    }
  };

  // Connect to wallet with timeout and improved error handling
  const connect = useCallback(async (walletType: SupportedWallet = 'petra') => {
    setIsLoading(true);
    setConnectionState('connecting');
    setError(null);

    try {
      let walletAccount: WalletAccount;

      // Add connection timeout (20 seconds - reduced to prevent hanging)
      const connectionPromise = (async () => {
        switch (walletType) {
          case 'keyless':
            // This will integrate with teammates' keyless authentication system
            walletAccount = await connectKeylessWallet();
            break;
          case 'petra':
            walletAccount = await connectPetraWallet();
            break;
          case 'martian':
            walletAccount = await connectMartianWallet();
            break;
          case 'pontem':
            walletAccount = await connectPontemWallet();
            break;
          default:
            throw new AptosError(`Unsupported wallet type: ${walletType}`);
        }
        return walletAccount;
      })();

      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new AptosError('Connection timeout - Please ensure your wallet is unlocked and try again')), 20000);
      });

      walletAccount = await Promise.race([connectionPromise, timeoutPromise]);

      setAccount(walletAccount);
      setConnectionState('connected');
      
      // Store connection for persistence
      localStorage.setItem('aptoscade_wallet_account', JSON.stringify(walletAccount));
      localStorage.setItem('aptoscade_wallet_type', walletType);
      
      // Fetch balance
      await fetchBalance(walletAccount.address);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to connect wallet';
      setError(errorMessage);
      setConnectionState('error');
      
      // Only log the actual error object, not the full error for security
      console.error('Wallet connection error:', errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Keyless wallet connection (integrating with teammates' Google Sign-In system)
  const connectKeylessWallet = async (): Promise<WalletAccount> => {
    // This will eventually integrate with teammates' keyless authentication
    // For now, we'll create a placeholder that matches their system
    
    // Check if teammates' keyless system is available
    const keylessSession = localStorage.getItem('aptoscade_keyless_session');
    if (keylessSession) {
      const session = JSON.parse(keylessSession);
      return {
        address: session.accountAddress,
        publicKey: session.publicKey
      };
    }
    
    // Fallback: prompt for Google Sign-In integration
    throw new AptosError('Keyless authentication not yet integrated. Please use Petra wallet for now.');
  };

  // Petra wallet connection with improved error handling
  const connectPetraWallet = async (): Promise<WalletAccount> => {
    if (!window.aptos) {
      throw new AptosError('Petra wallet not installed. Please install Petra wallet extension.');
    }

    try {
      // Check if wallet is unlocked/ready
      const response = await window.aptos.connect();
      
      if (!response || !response.address) {
        throw new AptosError('Failed to get wallet address from Petra');
      }

      return {
        address: response.address,
        publicKey: response.publicKey || ''
      };
    } catch (error: any) {
      
      // Handle specific Petra errors
      if (error?.code === 4001) {
        throw new AptosError('Connection rejected by user');
      }
      if (error?.code === 4000 || error?.status === 'PetraApiError') {
        throw new AptosError('Please unlock your Petra wallet and ensure it is properly set up');
      }
      if (error?.message?.includes('locked')) {
        throw new AptosError('Please unlock your Petra wallet');
      }
      throw new AptosError(`Petra connection failed: ${error?.message || JSON.stringify(error) || 'Unknown error'}`);
    }
  };

  // Martian wallet connection with improved error handling
  const connectMartianWallet = async (): Promise<WalletAccount> => {
    if (!window.martian) {
      throw new AptosError('Martian wallet not installed. Please install Martian wallet extension.');
    }

    try {
      // Martian might need different connect method
      const response = await window.martian.connect();
      
      if (!response || !response.address) {
        throw new AptosError('Failed to get wallet address from Martian');
      }

      return {
        address: response.address,
        publicKey: response.publicKey || ''
      };
    } catch (error: any) {
      
      // Handle specific Martian errors
      if (error?.code === 4001) {
        throw new AptosError('Connection rejected by user');
      }
      if (error?.message?.includes('Wallet setup required') || error === 'Wallet setup required') {
        throw new AptosError('Please complete your Martian wallet setup first. Open the Martian extension and create/import a wallet.');
      }
      if (error?.message?.includes('locked')) {
        throw new AptosError('Please unlock your Martian wallet');
      }
      if (error?.message?.includes('not initialized')) {
        throw new AptosError('Please setup your Martian wallet first');
      }
      throw new AptosError(`Martian connection failed: ${error?.message || JSON.stringify(error) || 'Unknown error'}`);
    }
  };

  // Pontem wallet connection with improved error handling
  const connectPontemWallet = async (): Promise<WalletAccount> => {
    if (!window.pontem) {
      throw new AptosError('Pontem wallet not installed. Please install Pontem wallet extension.');
    }

    try {
      // Add a shorter timeout to prevent hanging (15 seconds instead of 30)
      const connectPromise = window.pontem.connect();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Connection timeout - Please ensure your Pontem wallet is unlocked')), 15000)
      );
      
      const response = await Promise.race([connectPromise, timeoutPromise]) as any;
      
      if (!response || !response.address) {
        throw new AptosError('Failed to get wallet address from Pontem');
      }

      return {
        address: response.address,
        publicKey: response.publicKey || ''
      };
    } catch (error: any) {
      // Suppress console errors from wallet extension briefly
      const originalConsoleError = console.error;
      console.error = () => {}; // Temporarily disable console.error
      
      setTimeout(() => {
        console.error = originalConsoleError; // Restore after a short delay
      }, 500); // Reduced timeout
      
      // Handle specific Pontem errors
      if (error?.code === 4001) {
        throw new AptosError('Connection rejected by user');
      }
      if (error?.message?.includes('locked')) {
        throw new AptosError('Please unlock your Pontem wallet');
      }
      if (error?.message?.includes('setup')) {
        throw new AptosError('Please complete Pontem wallet setup');
      }
      if (error?.message?.includes('timeout')) {
        throw new AptosError('Pontem wallet connection timed out. Please try again.');
      }
      throw new AptosError(`Pontem connection failed: ${error?.message || 'Unknown error'}`);
    }
  };

  // Disconnect wallet
  const disconnect = useCallback(() => {
    setAccount(null);
    setBalance(null);
    setConnectionState('disconnected');
    setError(null);
    
    // Clear stored data
    localStorage.removeItem('aptoscade_wallet_account');
    localStorage.removeItem('aptoscade_wallet_type');
  }, []);

  // Fetch APT balance
  const fetchBalance = async (address: string) => {
    try {
      const resources = await aptos.getAccountResources({ accountAddress: address });
      
      // Look for APT coin resource
      const aptResource = resources.find(r => 
        r.type === '0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>'
      );
      
      let aptAmount = 0;
      if (aptResource && aptResource.data) {
        aptAmount = parseInt((aptResource.data as any).coin?.value || '0');
      }
      
      const formattedAPT = (aptAmount / 100000000).toFixed(8); // APT has 8 decimals
      
      setBalance({
        apt: aptAmount,
        formattedAPT
      });
      
      return { apt: aptAmount, formattedAPT };
    } catch (error) {
      console.error('Error fetching balance:', error);
      return null;
    }
  };

  // Sign and submit transaction
  const signAndSubmitTransaction = useCallback(async (transaction: any): Promise<TransactionResult> => {
    if (!account) {
      throw new AptosError('Wallet not connected');
    }

    setIsLoading(true);
    try {
      const walletType = localStorage.getItem('aptoscade_wallet_type') as SupportedWallet;
      let txHash: string;

      switch (walletType) {
        case 'petra':
          if (!window.aptos) throw new AptosError('Petra wallet not available');
          const petraResponse = await window.aptos.signAndSubmitTransaction(transaction);
          txHash = petraResponse.hash;
          break;
        
        case 'martian':
          if (!window.martian) throw new AptosError('Martian wallet not available');
          const martianResponse = await window.martian.signAndSubmitTransaction(transaction);
          txHash = martianResponse.hash;
          break;
          
        case 'pontem':
          if (!window.pontem) throw new AptosError('Pontem wallet not available');
          const pontemResponse = await window.pontem.signAndSubmitTransaction(transaction);
          txHash = pontemResponse.hash;
          break;
          
        default:
          throw new AptosError('Unsupported wallet for transaction signing');
      }

      // Wait for transaction confirmation
      const txResult = await aptos.waitForTransaction({ transactionHash: txHash });
      
      // Refresh balance after transaction
      await fetchBalance(account.address);
      
      return {
        hash: txHash,
        success: txResult.success,
        gasUsed: parseInt(txResult.gas_used)
      };
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Transaction failed';
      return {
        hash: '',
        success: false,
        error: errorMessage
      };
    } finally {
      setIsLoading(false);
    }
  }, [account]);

  // Refresh balance manually
  const refreshBalance = useCallback(async () => {
    if (account) {
      return await fetchBalance(account.address);
    }
    return null;
  }, [account]);

  return {
    // State
    connectionState,
    account,
    balance,
    error,
    isLoading,
    
    // Actions
    connect,
    disconnect,
    signAndSubmitTransaction,
    refreshBalance,
    
    // Utilities
    isConnected: connectionState === 'connected',
    canTransact: connectionState === 'connected' && !isLoading
  };
}

// Type declarations for wallet objects on window
declare global {
  interface Window {
    aptos?: {
      connect(): Promise<{ address: string; publicKey: string }>;
      signAndSubmitTransaction(transaction: any): Promise<{ hash: string }>;
    };
    martian?: {
      connect(): Promise<{ address: string; publicKey: string }>;
      signAndSubmitTransaction(transaction: any): Promise<{ hash: string }>;
    };
    pontem?: {
      connect(): Promise<{ address: string; publicKey: string }>;
      signAndSubmitTransaction(transaction: any): Promise<{ hash: string }>;
    };
  }
}
