import { 
  Account, 
  Aptos, 
  AptosConfig, 
  Network,
  Ed25519PrivateKey,
  AccountAddress,
} from '@aptos-labs/ts-sdk';

// Import advanced feature modules
import { KeylessAuthManager } from './keyless';
import { SponsoredTransactionManager } from './sponsored';
import { AptosObjectsManager } from './objects';
import { StakingManager } from './staking';
import { PythOracleManager, CrowdfundingOracleHelper } from './oracle';
import { AdvancedIndexerManager } from './indexer';

export interface ProjectInfo {
  id: number;
  title: string;
  description: string;
  targetAmount: number;
  currentAmount: number;
  status: number;
  creator: string;
  deadline: number;
  contributors: string[];
}

export interface UserStats {
  contributedProjectsCount: number;
  createdProjectsCount: number;
  totalContributed: number;
  reputationScore: number;
}

export interface ContractConfig {
  admin: string;
  feeRate: number;
  totalProjects: number;
  isPaused: boolean;
}

export class AptosHackathonSDK {
  private aptos: Aptos;
  private contractAddress: string;
  private moduleName: string;

  // Advanced feature managers
  public keylessAuth: KeylessAuthManager;
  public sponsoredTransactions?: SponsoredTransactionManager;
  public aptosObjects: AptosObjectsManager;
  public staking: StakingManager;
  public oracle: PythOracleManager;
  public oracleHelper: CrowdfundingOracleHelper;
  public indexer: AdvancedIndexerManager;

  constructor(
    network: Network = Network.TESTNET,
    contractAddress: string,
    moduleName: string = 'main_contract',
    sponsorAccount?: Account,
    googleClientId?: string
  ) {
    const config = new AptosConfig({ network });
    this.aptos = new Aptos(config);
    this.contractAddress = contractAddress;
    this.moduleName = moduleName;

    // Initialize advanced feature managers
    this.keylessAuth = new KeylessAuthManager({
      googleClientId: googleClientId || 'your-google-client-id',
    });
    this.aptosObjects = new AptosObjectsManager(this.aptos);
    this.staking = new StakingManager(this.aptos);
    this.oracle = new PythOracleManager(this.aptos);
    this.oracleHelper = new CrowdfundingOracleHelper(this.oracle, this.aptos);
    this.indexer = new AdvancedIndexerManager(this.aptos);

    // Initialize sponsored transactions if sponsor account provided
    if (sponsorAccount) {
      this.sponsoredTransactions = new SponsoredTransactionManager(this.aptos, sponsorAccount);
    }
  }

  // Initialize contract (admin only)
  async initializeContract(
    adminAccount: Account,
    feeRate: number
  ): Promise<string> {
    const transaction = await this.aptos.transaction.build.simple({
      sender: adminAccount.accountAddress,
      data: {
        function: `${this.contractAddress}::${this.moduleName}::initialize`,
        functionArguments: [feeRate],
      },
    });

    const pendingTransaction = await this.aptos.signAndSubmitTransaction({
      signer: adminAccount,
      transaction,
    });

    return pendingTransaction.hash;
  }

  // Create a new project
  async createProject(
    creatorAccount: Account,
    title: string,
    description: string,
    targetAmount: number,
    durationSeconds: number
  ): Promise<string> {
    const transaction = await this.aptos.transaction.build.simple({
      sender: creatorAccount.accountAddress,
      data: {
        function: `${this.contractAddress}::${this.moduleName}::create_project`,
        functionArguments: [title, description, targetAmount, durationSeconds],
      },
    });

    const pendingTransaction = await this.aptos.signAndSubmitTransaction({
      signer: creatorAccount,
      transaction,
    });

    return pendingTransaction.hash;
  }

  // Contribute to a project
  async contributeToProject(
    contributorAccount: Account,
    projectId: number,
    amount: number
  ): Promise<string> {
    const transaction = await this.aptos.transaction.build.simple({
      sender: contributorAccount.accountAddress,
      data: {
        function: `${this.contractAddress}::${this.moduleName}::contribute_to_project`,
        functionArguments: [projectId, amount],
      },
    });

    const pendingTransaction = await this.aptos.signAndSubmitTransaction({
      signer: contributorAccount,
      transaction,
    });

    return pendingTransaction.hash;
  }

  // Withdraw funds (creator only)
  async withdrawFunds(
    creatorAccount: Account,
    projectId: number
  ): Promise<string> {
    const transaction = await this.aptos.transaction.build.simple({
      sender: creatorAccount.accountAddress,
      data: {
        function: `${this.contractAddress}::${this.moduleName}::withdraw_funds`,
        functionArguments: [projectId],
      },
    });

    const pendingTransaction = await this.aptos.signAndSubmitTransaction({
      signer: creatorAccount,
      transaction,
    });

    return pendingTransaction.hash;
  }

  // View functions
  async getProjectCount(): Promise<number> {
    const response = await this.aptos.view({
      payload: {
        function: `${this.contractAddress}::${this.moduleName}::get_project_count`,
        functionArguments: [],
      },
    });

    return Number(response[0]);
  }

  async getProjectInfo(projectId: number): Promise<ProjectInfo> {
    const response = await this.aptos.view({
      payload: {
        function: `${this.contractAddress}::${this.moduleName}::get_project_info`,
        functionArguments: [projectId],
      },
    });

    return {
      id: projectId,
      title: String(response[0]),
      description: String(response[1]),
      targetAmount: Number(response[2]),
      currentAmount: Number(response[3]),
      status: Number(response[4]),
      creator: '', // This would need to be fetched separately or added to contract
      deadline: 0, // This would need to be fetched separately or added to contract
      contributors: [], // This would need to be fetched separately or added to contract
    };
  }

  async getUserStats(userAddress: string): Promise<UserStats> {
    const response = await this.aptos.view({
      payload: {
        function: `${this.contractAddress}::${this.moduleName}::get_user_stats`,
        functionArguments: [userAddress],
      },
    });

    return {
      contributedProjectsCount: Number(response[0]),
      createdProjectsCount: Number(response[1]),
      totalContributed: Number(response[2]),
      reputationScore: 0, // Would need to be added to contract view function
    };
  }

  // Utility functions
  async waitForTransaction(txnHash: string): Promise<any> {
    return await this.aptos.waitForTransaction({
      transactionHash: txnHash,
    });
  }

  async getAccountBalance(accountAddress: string): Promise<number> {
    try {
      const balance = await this.aptos.getAccountAPTAmount({
        accountAddress,
      });
      return balance;
    } catch (error) {
      console.error('Error fetching balance:', error);
      return 0;
    }
  }

  // Account management
  static generateRandomAccount(): Account {
    return Account.generate();
  }

  static createAccountFromPrivateKey(privateKeyHex: string): Account {
    const privateKey = new Ed25519PrivateKey(privateKeyHex);
    return Account.fromPrivateKey({ privateKey });
  }

  // Event listening (for real-time updates)
  async getAccountTransactions(accountAddress: string, options?: {
    start?: number;
    limit?: number;
  }): Promise<any[]> {
    return await this.aptos.getAccountTransactions({
      accountAddress,
      options,
    });
  }

  // Admin functions
  async setFeeRate(
    adminAccount: Account,
    newFeeRate: number
  ): Promise<string> {
    const transaction = await this.aptos.transaction.build.simple({
      sender: adminAccount.accountAddress,
      data: {
        function: `${this.contractAddress}::${this.moduleName}::set_fee_rate`,
        functionArguments: [newFeeRate],
      },
    });

    const pendingTransaction = await this.aptos.signAndSubmitTransaction({
      signer: adminAccount,
      transaction,
    });

    return pendingTransaction.hash;
  }

  async pauseContract(adminAccount: Account): Promise<string> {
    const transaction = await this.aptos.transaction.build.simple({
      sender: adminAccount.accountAddress,
      data: {
        function: `${this.contractAddress}::${this.moduleName}::pause_contract`,
        functionArguments: [],
      },
    });

    const pendingTransaction = await this.aptos.signAndSubmitTransaction({
      signer: adminAccount,
      transaction,
    });

    return pendingTransaction.hash;
  }

  async unpauseContract(adminAccount: Account): Promise<string> {
    const transaction = await this.aptos.transaction.build.simple({
      sender: adminAccount.accountAddress,
      data: {
        function: `${this.contractAddress}::${this.moduleName}::unpause_contract`,
        functionArguments: [],
      },
    });

    const pendingTransaction = await this.aptos.signAndSubmitTransaction({
      signer: adminAccount,
      transaction,
    });

    return pendingTransaction.hash;
  }

  // ==================== ADVANCED FEATURES ====================

  /**
   * Initialize sponsored transactions with a sponsor account
   */
  initializeSponsoredTransactions(sponsorAccount: Account): void {
    this.sponsoredTransactions = new SponsoredTransactionManager(this.aptos, sponsorAccount);
  }

  /**
   * Get comprehensive platform analytics
   */
  async getPlatformAnalytics(): Promise<{
    platformStats: any;
    trendingProjects: any[];
    topContributors: string[];
  }> {
    const [platformStats, trendingProjects] = await Promise.all([
      this.indexer.getPlatformStats(this.contractAddress),
      this.indexer.getTrendingProjects(this.contractAddress),
    ]);

    return {
      platformStats,
      trendingProjects,
      topContributors: [], // Would need additional indexing
    };
  }

  /**
   * Get user dashboard with all activities and analytics
   */
  async getUserDashboard(userAddress: string): Promise<{
    activities: any[];
    contributorAnalytics: any;
    stakingInfo: any;
    projectObjects: string[];
  }> {
    const [activities, contributorAnalytics, stakingDashboard, projectObjects] = await Promise.all([
      this.indexer.getUserActivityFeed(this.contractAddress, userAddress),
      this.indexer.getContributorAnalytics(this.contractAddress, userAddress),
      this.staking.getStakeInfo(this.contractAddress, userAddress),
      this.aptosObjects.getUserProjectObjects(userAddress),
    ]);

    return {
      activities,
      contributorAnalytics,
      stakingInfo: stakingDashboard,
      projectObjects,
    };
  }

  /**
   * Get project with enhanced data including analytics and price info
   */
  async getProjectWithAnalytics(projectId: number): Promise<{
    basicInfo: ProjectInfo | null;
    analytics: any;
    fundingStatus: any;
    events: any[];
  }> {
    const [basicInfo, analytics, fundingStatus, events] = await Promise.all([
      this.getProjectInfo(projectId),
      this.indexer.getProjectAnalytics(this.contractAddress, projectId),
      this.oracleHelper.getProjectFundingStatus(this.contractAddress, projectId),
      this.indexer.getProjectEvents(this.contractAddress, projectId),
    ]);

    return {
      basicInfo,
      analytics,
      fundingStatus,
      events,
    };
  }

  /**
   * Create a project with NFT rewards and enhanced features
   */
  async createProjectWithRewards(
    creator: Account,
    title: string,
    description: string,
    targetAmount: number,
    durationDays: number,
    enableNFTRewards: boolean = true,
    enableStaking: boolean = true
  ): Promise<{
    projectHash: string;
    rewardCollectionHash?: string;
  }> {
    const durationSeconds = durationDays * 24 * 60 * 60;

    // Create the project
    const projectHash = await this.createProject(
      creator,
      title,
      description,
      targetAmount,
      durationSeconds
    );

    let rewardCollectionHash: string | undefined;

    if (enableNFTRewards) {
      // Get the project ID from events (simplified approach)
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for transaction to finalize
      
      try {
        // Create NFT reward collection for the project
        const rewardTransaction = await this.aptos.transaction.build.simple({
          sender: creator.accountAddress,
          data: {
            function: `${this.contractAddress}::reward_nft::create_reward_collection`,
            functionArguments: [title, `Rewards for ${title}`, 1000], // max supply 1000
          },
        });

        const rewardPendingTx = await this.aptos.signAndSubmitTransaction({
          signer: creator,
          transaction: rewardTransaction,
        });

        rewardCollectionHash = rewardPendingTx.hash;
      } catch (error) {
        console.error('Failed to create reward collection:', error);
      }
    }

    return {
      projectHash,
      rewardCollectionHash,
    };
  }

  /**
   * Contribute with automatic reward minting and staking options
   */
  async contributeWithRewards(
    contributor: Account,
    projectId: number,
    amount: number,
    autoStakeRewards: boolean = false
  ): Promise<{
    contributionHash: string;
    rewardHash?: string;
    stakingHash?: string;
  }> {
    // Make the contribution
    const contributionHash = await this.contributeToProject(contributor, projectId, amount);

    let rewardHash: string | undefined;
    let stakingHash: string | undefined;

    try {
      // Wait for contribution to finalize
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Mint reward NFT based on contribution tier
      const rewardTransaction = await this.aptos.transaction.build.simple({
        sender: contributor.accountAddress,
        data: {
          function: `${this.contractAddress}::reward_nft::mint_contributor_reward`,
          functionArguments: [projectId, amount],
        },
      });

      const rewardPendingTx = await this.aptos.signAndSubmitTransaction({
        signer: contributor,
        transaction: rewardTransaction,
      });

      rewardHash = rewardPendingTx.hash;

      // Auto-stake rewards if requested
      if (autoStakeRewards && amount >= 100) { // Minimum stake amount
        const stakingPendingTx = await this.staking.stakeTokens(
          contributor,
          this.contractAddress,
          Math.floor(amount * 0.1) // Stake 10% of contribution
        );
        stakingHash = stakingPendingTx.hash;
      }
    } catch (error) {
      console.error('Failed to process rewards/staking:', error);
    }

    return {
      contributionHash,
      rewardHash,
      stakingHash,
    };
  }

  /**
   * Get optimal contribution strategy based on market conditions
   */
  async getContributionStrategy(
    usdAmount: number,
    userAddress?: string
  ): Promise<{
    recommendedAPTAmount: number;
    timing: any;
    priceImpact: any;
    userAnalytics?: any;
  }> {
    const [aptAmount, timing, priceImpact, userAnalytics] = await Promise.all([
      this.oracleHelper.convertUSDToAPT(usdAmount),
      this.oracleHelper.getOptimalContributionTiming(usdAmount),
      this.oracleHelper.estimatePriceImpact(this.contractAddress, usdAmount),
      userAddress ? this.indexer.getContributorAnalytics(this.contractAddress, userAddress) : null,
    ]);

    return {
      recommendedAPTAmount: aptAmount || 0,
      timing,
      priceImpact,
      userAnalytics,
    };
  }
}

// Export types and constants
export const PROJECT_STATUS = {
  ACTIVE: 1,
  COMPLETED: 2,
  CANCELLED: 3,
} as const;

export type ProjectStatus = typeof PROJECT_STATUS[keyof typeof PROJECT_STATUS];

// Helper functions for frontend integration
export class HackathonSDKHelpers {
  static formatAmount(amount: number): string {
    return (amount / 100000000).toFixed(8); // Convert from Octas to APT
  }

  static parseAmount(aptAmount: string): number {
    return Math.floor(parseFloat(aptAmount) * 100000000); // Convert from APT to Octas
  }

  static formatDate(timestamp: number): string {
    return new Date(timestamp * 1000).toLocaleDateString();
  }

  static getStatusText(status: number): string {
    switch (status) {
      case PROJECT_STATUS.ACTIVE:
        return 'Active';
      case PROJECT_STATUS.COMPLETED:
        return 'Completed';
      case PROJECT_STATUS.CANCELLED:
        return 'Cancelled';
      default:
        return 'Unknown';
    }
  }

  static calculateProgress(currentAmount: number, targetAmount: number): number {
    if (targetAmount === 0) return 0;
    return Math.min(100, (currentAmount / targetAmount) * 100);
  }
}

export default AptosHackathonSDK;
