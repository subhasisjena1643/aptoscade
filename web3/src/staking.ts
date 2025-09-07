import { 
  Account, 
  Aptos,
  PendingTransactionResponse,
  InputGenerateTransactionPayloadData,
} from '@aptos-labs/ts-sdk';

/**
 * Staking system for the crowdfunding platform
 * Allows users to stake APT tokens to earn rewards and governance power
 */

export interface StakeInfo {
  staker: string;
  amount: number;
  stake_time: number;
  last_reward_time: number;
  rewards_earned: number;
  is_active: boolean;

}

export interface StakingPoolInfo {
  total_staked: number;
  total_rewards_distributed: number;
  apy_percentage: number;
  min_stake_amount: number;
  lock_duration: number;
  active_stakers: number;
}

export interface StakeRewards {
  pending_rewards: number;
  claimable_rewards: number;
  total_earned: number;
  next_claim_time: number;
}

export class StakingManager {
  private aptos: Aptos;

  constructor(aptos: Aptos) {
    this.aptos = aptos;
  }

  /**
   * Stake APT tokens in the crowdfunding platform
   */
  async stakeTokens(
    staker: Account,
    contractAddress: string,
    amount: number,
    lockDurationDays?: number
  ): Promise<PendingTransactionResponse> {
    const lockDurationSeconds = (lockDurationDays || 30) * 24 * 60 * 60;

    const transactionPayload: InputGenerateTransactionPayloadData = {
      function: `${contractAddress}::staking::stake_tokens`,
      functionArguments: [amount, lockDurationSeconds],
    };

    const transaction = await this.aptos.transaction.build.simple({
      sender: staker.accountAddress,
      data: transactionPayload,
      options: {
        maxGasAmount: 15000,
        gasUnitPrice: 100,
      },
    });

    return await this.aptos.signAndSubmitTransaction({
      signer: staker,
      transaction,
    });
  }

  /**
   * Unstake tokens (after lock period)
   */
  async unstakeTokens(
    staker: Account,
    contractAddress: string,
    amount?: number
  ): Promise<PendingTransactionResponse> {
    const transactionPayload: InputGenerateTransactionPayloadData = {
      function: `${contractAddress}::staking::unstake_tokens`,
      functionArguments: amount ? [amount] : [],
    };

    const transaction = await this.aptos.transaction.build.simple({
      sender: staker.accountAddress,
      data: transactionPayload,
      options: {
        maxGasAmount: 15000,
        gasUnitPrice: 100,
      },
    });

    return await this.aptos.signAndSubmitTransaction({
      signer: staker,
      transaction,
    });
  }

  /**
   * Claim staking rewards
   */
  async claimRewards(
    staker: Account,
    contractAddress: string
  ): Promise<PendingTransactionResponse> {
    const transactionPayload: InputGenerateTransactionPayloadData = {
      function: `${contractAddress}::staking::claim_rewards`,
      functionArguments: [],
    };

    const transaction = await this.aptos.transaction.build.simple({
      sender: staker.accountAddress,
      data: transactionPayload,
      options: {
        maxGasAmount: 10000,
        gasUnitPrice: 100,
      },
    });

    return await this.aptos.signAndSubmitTransaction({
      signer: staker,
      transaction,
    });
  }

  /**
   * Get staker information
   */
  async getStakeInfo(
    contractAddress: string,
    stakerAddress: string
  ): Promise<StakeInfo | null> {
    try {
      const resourceType = `${contractAddress}::staking::StakeInfo` as `${string}::${string}::${string}`;
      const resource = await this.aptos.getAccountResource({
        accountAddress: stakerAddress,
        resourceType,
      });

      return resource.data as StakeInfo;
    } catch (error) {
      console.error('Failed to get stake info:', error);
      return null;
    }
  }

  /**
   * Get staking pool information
   */
  async getStakingPoolInfo(contractAddress: string): Promise<StakingPoolInfo | null> {
    try {
      const resourceType = `${contractAddress}::staking::StakingPool` as `${string}::${string}::${string}`;
      const resource = await this.aptos.getAccountResource({
        accountAddress: contractAddress,
        resourceType,
      });

      return resource.data as StakingPoolInfo;
    } catch (error) {
      console.error('Failed to get staking pool info:', error);
      return null;
    }
  }

  /**
   * Calculate pending rewards for a staker
   */
  async calculateRewards(
    contractAddress: string,
    stakerAddress: string
  ): Promise<StakeRewards | null> {
    try {
      const viewFunction = await this.aptos.view({
        payload: {
          function: `${contractAddress}::staking::calculate_rewards`,
          functionArguments: [stakerAddress],
        },
      });

      const [pendingRewards, claimableRewards, totalEarned, nextClaimTime] = viewFunction as [number, number, number, number];

      return {
        pending_rewards: pendingRewards,
        claimable_rewards: claimableRewards,
        total_earned: totalEarned,
        next_claim_time: nextClaimTime,
      };
    } catch (error) {
      console.error('Failed to calculate rewards:', error);
      return null;
    }
  }

  /**
   * Get staking power for governance (staked amount affects voting weight)
   */
  async getStakingPower(
    contractAddress: string,
    stakerAddress: string
  ): Promise<number> {
    try {
      const viewFunction = await this.aptos.view({
        payload: {
          function: `${contractAddress}::staking::get_staking_power`,
          functionArguments: [stakerAddress],
        },
      });

      return viewFunction[0] as number;
    } catch (error) {
      console.error('Failed to get staking power:', error);
      return 0;
    }
  }

  /**
   * Extend stake lock period for higher rewards
   */
  async extendStakeLock(
    staker: Account,
    contractAddress: string,
    additionalDays: number
  ): Promise<PendingTransactionResponse> {
    const additionalSeconds = additionalDays * 24 * 60 * 60;

    const transactionPayload: InputGenerateTransactionPayloadData = {
      function: `${contractAddress}::staking::extend_lock_period`,
      functionArguments: [additionalSeconds],
    };

    const transaction = await this.aptos.transaction.build.simple({
      sender: staker.accountAddress,
      data: transactionPayload,
    });

    return await this.aptos.signAndSubmitTransaction({
      signer: staker,
      transaction,
    });
  }

  /**
   * Emergency unstake (with penalty)
   */
  async emergencyUnstake(
    staker: Account,
    contractAddress: string
  ): Promise<PendingTransactionResponse> {
    const transactionPayload: InputGenerateTransactionPayloadData = {
      function: `${contractAddress}::staking::emergency_unstake`,
      functionArguments: [],
    };

    const transaction = await this.aptos.transaction.build.simple({
      sender: staker.accountAddress,
      data: transactionPayload,
      options: {
        maxGasAmount: 20000, // Higher gas for emergency operations
        gasUnitPrice: 100,
      },
    });

    return await this.aptos.signAndSubmitTransaction({
      signer: staker,
      transaction,
    });
  }

  /**
   * Compound rewards (automatically stake claimed rewards)
   */
  async compoundRewards(
    staker: Account,
    contractAddress: string
  ): Promise<PendingTransactionResponse> {
    const transactionPayload: InputGenerateTransactionPayloadData = {
      function: `${contractAddress}::staking::compound_rewards`,
      functionArguments: [],
    };

    const transaction = await this.aptos.transaction.build.simple({
      sender: staker.accountAddress,
      data: transactionPayload,
    });

    return await this.aptos.signAndSubmitTransaction({
      signer: staker,
      transaction,
    });
  }

  /**
   * Get all stakers in the pool (for admin dashboard)
   */
  async getAllStakers(contractAddress: string): Promise<string[]> {
    try {
      const events = await this.aptos.getAccountEventsByEventType({
        accountAddress: contractAddress,
        eventType: `${contractAddress}::staking::StakeEvent` as `${string}::${string}::${string}`,
        options: {
          limit: 1000,
        },
      });

      const uniqueStakers = new Set<string>();
      events.forEach(event => {
        const staker = (event.data as any).staker;
        if (staker) {
          uniqueStakers.add(staker);
        }
      });

      return Array.from(uniqueStakers);
    } catch (error) {
      console.error('Failed to get all stakers:', error);
      return [];
    }
  }
}

/**
 * Staking helper for common operations and utilities
 */
export class StakingHelper {
  private stakingManager: StakingManager;

  constructor(stakingManager: StakingManager) {
    this.stakingManager = stakingManager;
  }

  /**
   * Get comprehensive staking dashboard data
   */
  async getStakingDashboard(
    contractAddress: string,
    userAddress: string
  ): Promise<{
    userStake: StakeInfo | null;
    userRewards: StakeRewards | null;
    poolInfo: StakingPoolInfo | null;
    stakingPower: number;
    canUnstake: boolean;
  }> {
    const [userStake, userRewards, poolInfo, stakingPower] = await Promise.all([
      this.stakingManager.getStakeInfo(contractAddress, userAddress),
      this.stakingManager.calculateRewards(contractAddress, userAddress),
      this.stakingManager.getStakingPoolInfo(contractAddress),
      this.stakingManager.getStakingPower(contractAddress, userAddress),
    ]);

    const now = Math.floor(Date.now() / 1000);
    const canUnstake = userStake ? 
      (userStake.stake_time + (poolInfo?.lock_duration || 0)) <= now : false;

    return {
      userStake,
      userRewards,
      poolInfo,
      stakingPower,
      canUnstake,
    };
  }

  /**
   * Calculate optimal staking strategy
   */
  calculateOptimalStake(
    availableAmount: number,
    currentAPY: number,
    lockPeriodDays: number
  ): {
    recommendedAmount: number;
    estimatedRewards: number;
    riskLevel: 'low' | 'medium' | 'high';
    strategy: string;
  } {
    // Simple strategy calculation
    const recommendedAmount = Math.floor(availableAmount * 0.8); // Keep 20% liquid
    const estimatedRewards = (recommendedAmount * currentAPY * lockPeriodDays) / (365 * 100);
    
    let riskLevel: 'low' | 'medium' | 'high' = 'low';
    let strategy = 'Conservative staking';

    if (lockPeriodDays > 90) {
      riskLevel = 'high';
      strategy = 'Long-term staking for maximum rewards';
    } else if (lockPeriodDays > 30) {
      riskLevel = 'medium';
      strategy = 'Balanced risk/reward staking';
    }

    return {
      recommendedAmount,
      estimatedRewards,
      riskLevel,
      strategy,
    };
  }

  /**
   * Auto-compound rewards when profitable
   */
  async autoCompoundIfProfitable(
    staker: Account,
    contractAddress: string,
    minimumRewardThreshold: number = 100
  ): Promise<PendingTransactionResponse | null> {
    const rewards = await this.stakingManager.calculateRewards(contractAddress, staker.accountAddress.toString());
    
    if (!rewards || rewards.claimable_rewards < minimumRewardThreshold) {
      return null;
    }

    return this.stakingManager.compoundRewards(staker, contractAddress);
  }

  /**
   * Stake with automatic tier selection based on amount
   */
  async stakeWithTier(
    staker: Account,
    contractAddress: string,
    amount: number
  ): Promise<{
    transaction: PendingTransactionResponse;
    tier: 'bronze' | 'silver' | 'gold' | 'platinum';
    lockPeriod: number;
  }> {
    let tier: 'bronze' | 'silver' | 'gold' | 'platinum';
    let lockPeriod: number;

    if (amount >= 10000) {
      tier = 'platinum';
      lockPeriod = 365; // 1 year for maximum rewards
    } else if (amount >= 5000) {
      tier = 'gold';
      lockPeriod = 180; // 6 months
    } else if (amount >= 1000) {
      tier = 'silver';
      lockPeriod = 90; // 3 months
    } else {
      tier = 'bronze';
      lockPeriod = 30; // 1 month
    }

    const transaction = await this.stakingManager.stakeTokens(
      staker,
      contractAddress,
      amount,
      lockPeriod
    );

    return { transaction, tier, lockPeriod };
  }
}
