export interface WalletAccount {
  address: string;
  publicKey: string;
  name?: string;
}

export interface WalletConnection {
  isConnected: boolean;
  account?: WalletAccount;
  network?: string;
  wallet?: string;
}

export interface WalletProvider {
  name: string;
  icon?: string;
  connect(): Promise<WalletAccount>;
  disconnect(): Promise<void>;
  signTransaction(transaction: any): Promise<string>;
  isAvailable(): boolean;
}

// Mock wallet providers for development
class PetraWallet implements WalletProvider {
  name = 'Petra';
  icon = 'petra-icon.png';

  isAvailable(): boolean {
    // In real implementation, check if window.aptos exists
    return typeof window !== 'undefined' && 'aptos' in window;
  }

  async connect(): Promise<WalletAccount> {
    // Mock implementation
    return {
      address: '0x1234567890abcdef',
      publicKey: '0xabcdef1234567890',
      name: 'Petra Wallet',
    };
  }

  async disconnect(): Promise<void> {
    // Mock implementation
  }

  async signTransaction(transaction: any): Promise<string> {
    // Mock implementation
    return 'mock_signature';
  }
}

class MartianWallet implements WalletProvider {
  name = 'Martian';
  icon = 'martian-icon.png';

  isAvailable(): boolean {
    // In real implementation, check if window.martian exists
    return typeof window !== 'undefined' && 'martian' in window;
  }

  async connect(): Promise<WalletAccount> {
    // Mock implementation
    return {
      address: '0xfedcba0987654321',
      publicKey: '0x0987654321fedcba',
      name: 'Martian Wallet',
    };
  }

  async disconnect(): Promise<void> {
    // Mock implementation
  }

  async signTransaction(transaction: any): Promise<string> {
    // Mock implementation
    return 'mock_signature';
  }
}

export class WalletManager {
  private providers: Map<string, WalletProvider> = new Map();
  private currentConnection: WalletConnection = { isConnected: false };
  private eventCallbacks: Map<string, Function[]> = new Map();

  constructor() {
    this.registerProviders();
  }

  private registerProviders(): void {
    const providers = [
      new PetraWallet(),
      new MartianWallet(),
    ];

    providers.forEach(provider => {
      this.providers.set(provider.name.toLowerCase(), provider);
    });
  }

  // Get available wallet providers
  getAvailableWallets(): WalletProvider[] {
    return Array.from(this.providers.values()).filter(provider => 
      provider.isAvailable()
    );
  }

  // Connect to a specific wallet
  async connectWallet(walletName: string): Promise<WalletConnection> {
    const provider = this.providers.get(walletName.toLowerCase());
    if (!provider) {
      throw new Error(`Wallet provider ${walletName} not found`);
    }

    if (!provider.isAvailable()) {
      throw new Error(`Wallet ${walletName} is not available. Please install the extension.`);
    }

    try {
      const account = await provider.connect();
      this.currentConnection = {
        isConnected: true,
        account,
        wallet: provider.name,
      };

      this.emit('wallet_connected', this.currentConnection);
      return this.currentConnection;
    } catch (error) {
      throw new Error(`Failed to connect to ${walletName}: ${error}`);
    }
  }

  // Disconnect current wallet
  async disconnectWallet(): Promise<void> {
    if (!this.currentConnection.isConnected || !this.currentConnection.wallet) {
      return;
    }

    const provider = this.providers.get(this.currentConnection.wallet.toLowerCase());
    if (provider) {
      try {
        await provider.disconnect();
      } catch (error) {
        console.error('Error disconnecting wallet:', error);
      }
    }

    const previousConnection = this.currentConnection;
    this.currentConnection = { isConnected: false };
    this.emit('wallet_disconnected', previousConnection);
  }

  // Get current connection status
  getConnection(): WalletConnection {
    return { ...this.currentConnection };
  }

  // Check if wallet is connected
  isConnected(): boolean {
    return this.currentConnection.isConnected;
  }

  // Get current account
  getCurrentAccount(): WalletAccount | undefined {
    return this.currentConnection.account;
  }

  // Sign transaction with current wallet
  async signTransaction(transaction: any): Promise<string> {
    if (!this.currentConnection.isConnected || !this.currentConnection.wallet) {
      throw new Error('No wallet connected');
    }

    const provider = this.providers.get(this.currentConnection.wallet.toLowerCase());
    if (!provider) {
      throw new Error('Wallet provider not found');
    }

    return await provider.signTransaction(transaction);
  }

  // Event handling
  on(event: string, callback: Function): void {
    if (!this.eventCallbacks.has(event)) {
      this.eventCallbacks.set(event, []);
    }
    this.eventCallbacks.get(event)!.push(callback);
  }

  off(event: string, callback: Function): void {
    const callbacks = this.eventCallbacks.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  private emit(event: string, data: any): void {
    const callbacks = this.eventCallbacks.get(event);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Error in wallet event callback:', error);
        }
      });
    }
  }

  // Auto-connect to previously connected wallet
  async autoConnect(): Promise<WalletConnection | null> {
    // In a real implementation, you would check localStorage for the last connected wallet
    const lastWallet = this.getLastConnectedWallet();
    if (lastWallet) {
      try {
        return await this.connectWallet(lastWallet);
      } catch (error) {
        console.error('Auto-connect failed:', error);
        this.clearLastConnectedWallet();
      }
    }
    return null;
  }

  // Utility methods for localStorage (in browser environment)
  private getLastConnectedWallet(): string | null {
    if (typeof window !== 'undefined' && window.localStorage) {
      return localStorage.getItem('lastConnectedWallet');
    }
    return null;
  }

  private setLastConnectedWallet(walletName: string): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('lastConnectedWallet', walletName);
    }
  }

  private clearLastConnectedWallet(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem('lastConnectedWallet');
    }
  }
}

// Wallet event types
export const WALLET_EVENTS = {
  CONNECTED: 'wallet_connected',
  DISCONNECTED: 'wallet_disconnected',
  ACCOUNT_CHANGED: 'account_changed',
  NETWORK_CHANGED: 'network_changed',
} as const;
