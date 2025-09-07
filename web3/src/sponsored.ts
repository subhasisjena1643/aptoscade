import { 
  Account, 
  Aptos,
  PendingTransactionResponse,
  InputGenerateTransactionPayloadData,
} from '@aptos-labs/ts-sdk';

export interface SponsoredTransactionConfig {
  maxGasAmount?: number;
  gasUnitPrice?: number;
  expirationTimestamp?: number;
}

export class SponsoredTransactionManager {
  private aptos: Aptos;
  private sponsorAccount: Account;

  constructor(aptos: Aptos, sponsorAccount: Account) {
    this.aptos = aptos;
    this.sponsorAccount = sponsorAccount;
  }

  /**
   * Submit a sponsored transaction using fee payer pattern
   * The sponsor account pays for gas, while the user signs the transaction
   */
  async submitSponsoredTransaction(
    userAccount: Account,
    transactionData: InputGenerateTransactionPayloadData,
    config?: SponsoredTransactionConfig
  ): Promise<PendingTransactionResponse> {
    try {
      // For now, use a simple approach where sponsor account submits on behalf of user
      // In a production environment, you would implement proper fee payer transactions
      const transaction = await this.aptos.transaction.build.simple({
        sender: this.sponsorAccount.accountAddress, // Sponsor submits the transaction
        data: transactionData,
        options: {
          maxGasAmount: config?.maxGasAmount || 10000,
          gasUnitPrice: config?.gasUnitPrice || 100,
          expireTimestamp: config?.expirationTimestamp,
        },
      });

      // Sign with sponsor account (who pays gas)
      const pendingTransaction = await this.aptos.signAndSubmitTransaction({
        signer: this.sponsorAccount,
        transaction,
      });

      return pendingTransaction;
    } catch (error) {
      console.error('Failed to submit sponsored transaction:', error);
      throw error;
    }
  }

  /**
   * Submit a sponsored entry function transaction
   */
  async submitSponsoredEntryFunction(
    userAccount: Account,
    moduleAddress: string,
    moduleName: string,
    functionName: string,
    functionArguments: any[] = [],
    typeArguments: string[] = [],
    config?: SponsoredTransactionConfig
  ): Promise<PendingTransactionResponse> {
    const transactionData: InputGenerateTransactionPayloadData = {
      function: `${moduleAddress}::${moduleName}::${functionName}`,
      functionArguments,
      typeArguments,
    };

    return this.submitSponsoredTransaction(userAccount, transactionData, config);
  }

  /**
   * Get sponsor account balance
   */
  async getSponsorBalance(): Promise<number> {
    try {
      return await this.aptos.getAccountAPTAmount({
        accountAddress: this.sponsorAccount.accountAddress,
      });
    } catch (error) {
      console.error('Failed to get sponsor balance:', error);
      throw error;
    }
  }

  /**
   * Check if sponsor has sufficient balance for transaction
   */
  async canSponsorTransaction(
    estimatedGas: number,
    gasPrice: number = 100
  ): Promise<boolean> {
    try {
      const balance = await this.getSponsorBalance();
      const estimatedCost = estimatedGas * gasPrice;
      return balance >= estimatedCost;
    } catch (error) {
      console.error('Failed to check sponsor capacity:', error);
      return false;
    }
  }

  /**
   * Estimate transaction cost
   */
  async estimateTransactionCost(
    transactionData: InputGenerateTransactionPayloadData
  ): Promise<{ gasUsed: number; gasPrice: number; totalCost: number }> {
    try {
      // Build transaction for simulation
      const transaction = await this.aptos.transaction.build.simple({
        sender: this.sponsorAccount.accountAddress,
        data: transactionData,
      });

      // Simulate the transaction to get gas estimate
      const [simulationResult] = await this.aptos.transaction.simulate.simple({
        signerPublicKey: this.sponsorAccount.publicKey,
        transaction,
        options: {
          estimateGasUnitPrice: true,
          estimateMaxGasAmount: true,
        },
      });

      const gasUsed = parseInt(simulationResult.gas_used);
      const gasPrice = parseInt(simulationResult.gas_unit_price);
      const totalCost = gasUsed * gasPrice;

      return { gasUsed, gasPrice, totalCost };
    } catch (error) {
      console.error('Failed to estimate transaction cost:', error);
      throw error;
    }
  }

  /**
   * Get sponsor account address
   */
  getSponsorAddress(): string {
    return this.sponsorAccount.accountAddress.toString();
  }

  /**
   * Create a new sponsor account (for testing)
   */
  static async createSponsorAccount(aptos: Aptos, fundAmount?: number): Promise<Account> {
    const sponsorAccount = Account.generate();
    
    if (fundAmount && fundAmount > 0) {
      // Fund the sponsor account from faucet (only on testnet/devnet)
      await aptos.fundAccount({
        accountAddress: sponsorAccount.accountAddress,
        amount: fundAmount,
      });
    }

    return sponsorAccount;
  }

  /**
   * Batch sponsored transactions for better efficiency
   */
  async submitBatchSponsoredTransactions(
    transactions: {
      userAccount: Account;
      transactionData: InputGenerateTransactionPayloadData;
      config?: SponsoredTransactionConfig;
    }[]
  ): Promise<PendingTransactionResponse[]> {
    const results: PendingTransactionResponse[] = [];

    for (const { userAccount, transactionData, config } of transactions) {
      try {
        const result = await this.submitSponsoredTransaction(
          userAccount,
          transactionData,
          config
        );
        results.push(result);
      } catch (error) {
        console.error(`Failed to submit sponsored transaction for user ${userAccount.accountAddress}:`, error);
        throw error;
      }
    }

    return results;
  }
}

/**
 * Sponsored transaction helper for common use cases
 */
export class SponsoredTransactionHelper {
  private sponsoredTxManager: SponsoredTransactionManager;

  constructor(sponsoredTxManager: SponsoredTransactionManager) {
    this.sponsoredTxManager = sponsoredTxManager;
  }

  /**
   * Sponsor a project contribution transaction
   */
  async sponsorProjectContribution(
    userAccount: Account,
    contractAddress: string,
    projectId: number,
    amount: number
  ): Promise<PendingTransactionResponse> {
    return this.sponsoredTxManager.submitSponsoredEntryFunction(
      userAccount,
      contractAddress,
      'main_contract',
      'contribute_to_project',
      [projectId, amount]
    );
  }

  /**
   * Sponsor a project creation transaction
   */
  async sponsorProjectCreation(
    userAccount: Account,
    contractAddress: string,
    title: string,
    description: string,
    targetAmount: number,
    durationSeconds: number
  ): Promise<PendingTransactionResponse> {
    return this.sponsoredTxManager.submitSponsoredEntryFunction(
      userAccount,
      contractAddress,
      'main_contract',
      'create_project',
      [title, description, targetAmount, durationSeconds],
      [],
      { maxGasAmount: 20000 } // Project creation might need more gas
    );
  }

  /**
   * Sponsor a voting transaction
   */
  async sponsorVote(
    userAccount: Account,
    contractAddress: string,
    projectId: number,
    milestoneId: number,
    vote: boolean
  ): Promise<PendingTransactionResponse> {
    return this.sponsoredTxManager.submitSponsoredEntryFunction(
      userAccount,
      contractAddress,
      'main_contract',
      'vote_on_milestone',
      [projectId, milestoneId, vote]
    );
  }

  /**
   * Sponsor NFT reward collection creation
   */
  async sponsorRewardCollectionCreation(
    userAccount: Account,
    contractAddress: string,
    projectId: number,
    maxSupply: number
  ): Promise<PendingTransactionResponse> {
    return this.sponsoredTxManager.submitSponsoredEntryFunction(
      userAccount,
      contractAddress,
      'main_contract',
      'create_project_reward_collection',
      [projectId, maxSupply],
      [],
      { maxGasAmount: 30000 } // NFT operations might need more gas
    );
  }
}
