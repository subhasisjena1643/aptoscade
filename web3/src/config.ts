import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export interface AptosConfig {
  network: 'testnet' | 'mainnet' | 'devnet';
  nodeUrl: string;
  faucetUrl?: string;
  contractAddress: string;
  moduleName: string;
}

export interface APIConfig {
  port: number;
  host: string;
  backendUrl: string;
  frontendUrl: string;
}

export interface AccountConfig {
  deployerPrivateKey?: string;
  deployerAddress?: string;
}

export class ConfigManager {
  private static instance: ConfigManager;
  private config: {
    aptos: AptosConfig;
    api: APIConfig;
    account: AccountConfig;
    isDevelopment: boolean;
    debug: boolean;
  };

  private constructor() {
    this.config = {
      aptos: {
        network: (process.env.APTOS_NETWORK as any) || 'testnet',
        nodeUrl: process.env.APTOS_NODE_URL || 'https://fullnode.testnet.aptoslabs.com/v1',
        faucetUrl: process.env.APTOS_FAUCET_URL || 'https://faucet.testnet.aptoslabs.com',
        contractAddress: process.env.CONTRACT_ADDRESS || '0x1',
        moduleName: process.env.MODULE_NAME || 'main_contract',
      },
      api: {
        port: parseInt(process.env.API_PORT || '3001'),
        host: process.env.API_HOST || 'localhost',
        backendUrl: process.env.BACKEND_URL || 'http://localhost:3000',
        frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3002',
      },
      account: {
        deployerPrivateKey: process.env.PRIVATE_KEY_DEPLOYER,
        deployerAddress: process.env.ACCOUNT_ADDRESS_DEPLOYER,
      },
      isDevelopment: process.env.NODE_ENV !== 'production',
      debug: process.env.DEBUG === 'true',
    };

    this.validateConfig();
  }

  public static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  private validateConfig(): void {
    const { aptos, api } = this.config;

    if (!aptos.nodeUrl) {
      throw new Error('APTOS_NODE_URL is required');
    }

    if (!aptos.contractAddress || aptos.contractAddress === '0x1') {
      console.warn('Warning: CONTRACT_ADDRESS not set or using default value');
    }

    if (api.port < 1000 || api.port > 65535) {
      throw new Error('Invalid API_PORT: must be between 1000 and 65535');
    }
  }

  // Getters
  public getAptosConfig(): AptosConfig {
    return { ...this.config.aptos };
  }

  public getAPIConfig(): APIConfig {
    return { ...this.config.api };
  }

  public getAccountConfig(): AccountConfig {
    return { ...this.config.account };
  }

  public isDev(): boolean {
    return this.config.isDevelopment;
  }

  public isDebug(): boolean {
    return this.config.debug;
  }

  // Setters (for testing or dynamic configuration)
  public updateAptosConfig(config: Partial<AptosConfig>): void {
    this.config.aptos = { ...this.config.aptos, ...config };
  }

  public updateAPIConfig(config: Partial<APIConfig>): void {
    this.config.api = { ...this.config.api, ...config };
  }

  // Utility methods
  public getFullAPIUrl(): string {
    const { host, port } = this.config.api;
    return `http://${host}:${port}`;
  }

  public getNetworkConfig() {
    const { network, nodeUrl, faucetUrl } = this.config.aptos;
    return {
      network,
      nodeUrl,
      faucetUrl,
    };
  }

  // Environment-specific helpers
  public isTestnet(): boolean {
    return this.config.aptos.network === 'testnet';
  }

  public isMainnet(): boolean {
    return this.config.aptos.network === 'mainnet';
  }

  public isDevnet(): boolean {
    return this.config.aptos.network === 'devnet';
  }

  // Configuration validation
  public validateRequiredConfig(): boolean {
    const required = [
      'APTOS_NODE_URL',
      'CONTRACT_ADDRESS',
      'API_PORT',
    ];

    const missing = required.filter(key => !process.env[key]);

    if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }

    return true;
  }

  // Get config for external services
  public getExternalConfig() {
    return {
      aptosNetwork: this.config.aptos.network,
      contractAddress: this.config.aptos.contractAddress,
      apiUrl: this.getFullAPIUrl(),
      backendUrl: this.config.api.backendUrl,
      frontendUrl: this.config.api.frontendUrl,
    };
  }
}

// Export singleton instance
export const configManager = ConfigManager.getInstance();
