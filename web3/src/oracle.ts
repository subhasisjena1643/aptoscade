import { 
  Account, 
  Aptos,
  PendingTransactionResponse,
  InputGenerateTransactionPayloadData,
} from '@aptos-labs/ts-sdk';

/**
 * Pyth Oracle integration for the crowdfunding platform
 * Provides real-time price feeds for APT/USD and other cryptocurrencies
 */

export interface PriceData {
  price: number;
  confidence: number;
  expo: number;
  publish_time: number;
}

export interface PriceFeedInfo {
  id: string;
  price: PriceData;
  ema_price: PriceData;
}

export interface OracleConfig {
  updateFrequency: number; // seconds
  priceDeviationThreshold: number; // percentage
  stalenessTolerance: number; // seconds
}

export class PythOracleManager {
  private aptos: Aptos;
  private pythProgramId: string;

  constructor(aptos: Aptos, pythProgramId: string = "0x7e783b349d3e89cf5931af376ebeadbfab855b3fa239a7d88d4115e825cfe2") {
    this.aptos = aptos;
    this.pythProgramId = pythProgramId;
  }

  /**
   * Get current APT/USD price from Pyth oracle
   */
  async getAPTPrice(): Promise<PriceData | null> {
    try {
      const viewFunction = await this.aptos.view({
        payload: {
          function: `${this.pythProgramId}::pyth::get_price`,
          functionArguments: [
            "0x03ae4db29ed4ae33d323568895aa00337e658e348b37509f5372ae51f0af00d5" // APT/USD price feed ID
          ],
        },
      });

      const [price, confidence, expo, publishTime] = viewFunction as [number, number, number, number];

      return {
        price,
        confidence,
        expo,
        publish_time: publishTime,
      };
    } catch (error) {
      console.error('Failed to get APT price:', error);
      return null;
    }
  }

  /**
   * Get price for any supported cryptocurrency
   */
  async getPrice(priceFeedId: string): Promise<PriceData | null> {
    try {
      const viewFunction = await this.aptos.view({
        payload: {
          function: `${this.pythProgramId}::pyth::get_price`,
          functionArguments: [priceFeedId],
        },
      });

      const [price, confidence, expo, publishTime] = viewFunction as [number, number, number, number];

      return {
        price,
        confidence,
        expo,
        publish_time: publishTime,
      };
    } catch (error) {
      console.error('Failed to get price:', error);
      return null;
    }
  }

  /**
   * Update price feeds (usually called by authorized oracles)
   */
  async updatePriceFeeds(
    updater: Account,
    contractAddress: string,
    priceFeedIds: string[],
    updateData: string[]
  ): Promise<PendingTransactionResponse> {
    const transactionPayload: InputGenerateTransactionPayloadData = {
      function: `${contractAddress}::oracle::update_price_feeds`,
      functionArguments: [priceFeedIds, updateData],
    };

    const transaction = await this.aptos.transaction.build.simple({
      sender: updater.accountAddress,
      data: transactionPayload,
      options: {
        maxGasAmount: 30000, // Price updates can be gas intensive
        gasUnitPrice: 100,
      },
    });

    return await this.aptos.signAndSubmitTransaction({
      signer: updater,
      transaction,
    });
  }

  /**
   * Check if price data is fresh (not stale)
   */
  isPriceDataFresh(priceData: PriceData, maxAge: number = 60): boolean {
    const now = Math.floor(Date.now() / 1000);
    return (now - priceData.publish_time) <= maxAge;
  }

  /**
   * Convert raw price with expo to human-readable format
   */
  formatPrice(priceData: PriceData): number {
    return priceData.price * Math.pow(10, priceData.expo);
  }

  /**
   * Get price with confidence interval
   */
  getPriceWithConfidence(priceData: PriceData): {
    price: number;
    lowerBound: number;
    upperBound: number;
    confidencePercentage: number;
  } {
    const formattedPrice = this.formatPrice(priceData);
    const formattedConfidence = priceData.confidence * Math.pow(10, priceData.expo);
    
    return {
      price: formattedPrice,
      lowerBound: formattedPrice - formattedConfidence,
      upperBound: formattedPrice + formattedConfidence,
      confidencePercentage: (formattedConfidence / formattedPrice) * 100,
    };
  }

  /**
   * Set up automatic price monitoring for a project
   */
  async setupPriceMonitoring(
    admin: Account,
    contractAddress: string,
    projectId: number,
    targetPrice: number,
    priceThreshold: number
  ): Promise<PendingTransactionResponse> {
    const transactionPayload: InputGenerateTransactionPayloadData = {
      function: `${contractAddress}::oracle::setup_price_monitoring`,
      functionArguments: [projectId, targetPrice, priceThreshold],
    };

    const transaction = await this.aptos.transaction.build.simple({
      sender: admin.accountAddress,
      data: transactionPayload,
    });

    return await this.aptos.signAndSubmitTransaction({
      signer: admin,
      transaction,
    });
  }

  /**
   * Get historical price data (if available)
   */
  async getHistoricalPrices(
    priceFeedId: string,
    fromTime: number,
    toTime: number
  ): Promise<PriceData[]> {
    try {
      // This would typically require off-chain indexing
      // For demo purposes, we'll return mock data
      console.log(`Fetching historical data for ${priceFeedId} from ${fromTime} to ${toTime}`);
      
      // In production, you'd query indexed historical data
      return [];
    } catch (error) {
      console.error('Failed to get historical prices:', error);
      return [];
    }
  }

  /**
   * Calculate price volatility over a period
   */
  calculateVolatility(prices: number[]): number {
    if (prices.length < 2) return 0;

    const returns = prices.slice(1).map((price, i) => 
      Math.log(price / prices[i])
    );

    const meanReturn = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
    const variance = returns.reduce((sum, ret) => 
      sum + Math.pow(ret - meanReturn, 2), 0
    ) / returns.length;

    return Math.sqrt(variance * 365); // Annualized volatility
  }

  /**
   * Check if current price triggers any alerts
   */
  async checkPriceAlerts(
    contractAddress: string,
    projectIds: number[]
  ): Promise<{ projectId: number; alertType: string; currentPrice: number }[]> {
    const alerts: { projectId: number; alertType: string; currentPrice: number }[] = [];
    
    try {
      const currentPrice = await this.getAPTPrice();
      if (!currentPrice) return alerts;

      const formattedPrice = this.formatPrice(currentPrice);

      for (const projectId of projectIds) {
        // Check project-specific price alerts
        const viewFunction = await this.aptos.view({
          payload: {
            function: `${contractAddress}::oracle::check_price_alerts`,
            functionArguments: [projectId, formattedPrice],
          },
        });

        const alertTriggered = viewFunction[0] as boolean;
        const alertType = viewFunction[1] as string;

        if (alertTriggered) {
          alerts.push({
            projectId,
            alertType,
            currentPrice: formattedPrice,
          });
        }
      }

      return alerts;
    } catch (error) {
      console.error('Failed to check price alerts:', error);
      return alerts;
    }
  }
}

/**
 * Oracle integration helper for crowdfunding-specific operations
 */
export class CrowdfundingOracleHelper {
  private oracleManager: PythOracleManager;
  private aptos: Aptos;

  constructor(oracleManager: PythOracleManager, aptos: Aptos) {
    this.oracleManager = oracleManager;
    this.aptos = aptos;
  }

  /**
   * Convert project target amount from USD to APT
   */
  async convertUSDToAPT(usdAmount: number): Promise<number | null> {
    const aptPrice = await this.oracleManager.getAPTPrice();
    if (!aptPrice) return null;

    const formattedPrice = this.oracleManager.formatPrice(aptPrice);
    return usdAmount / formattedPrice;
  }

  /**
   * Convert APT amount to USD for display
   */
  async convertAPTToUSD(aptAmount: number): Promise<number | null> {
    const aptPrice = await this.oracleManager.getAPTPrice();
    if (!aptPrice) return null;

    const formattedPrice = this.oracleManager.formatPrice(aptPrice);
    return aptAmount * formattedPrice;
  }

  /**
   * Get project funding status in both APT and USD
   */
  async getProjectFundingStatus(
    contractAddress: string,
    projectId: number
  ): Promise<{
    targetAPT: number;
    targetUSD: number;
    currentAPT: number;
    currentUSD: number;
    progressPercentage: number;
    priceData: PriceData;
  } | null> {
    try {
      // Get project data
      const viewFunction = await this.aptos.view({
        payload: {
          function: `${contractAddress}::main_contract::get_project`,
          functionArguments: [projectId],
        },
      });

      const projectData = viewFunction[0] as any;
      const targetAPT = projectData.target_amount;
      const currentAPT = projectData.current_amount;

      // Get current APT price
      const priceData = await this.oracleManager.getAPTPrice();
      if (!priceData) return null;

      const aptPriceUSD = this.oracleManager.formatPrice(priceData);
      const targetUSD = targetAPT * aptPriceUSD;
      const currentUSD = currentAPT * aptPriceUSD;
      const progressPercentage = (currentAPT / targetAPT) * 100;

      return {
        targetAPT,
        targetUSD,
        currentAPT,
        currentUSD,
        progressPercentage,
        priceData,
      };
    } catch (error) {
      console.error('Failed to get project funding status:', error);
      return null;
    }
  }

  /**
   * Calculate optimal contribution timing based on price trends
   */
  async getOptimalContributionTiming(
    targetUSDAmount: number,
    priceHistory: number[] = []
  ): Promise<{
    recommendation: 'buy_now' | 'wait' | 'dollar_cost_average';
    reasoning: string;
    estimatedSavings?: number;
  }> {
    const currentPrice = await this.oracleManager.getAPTPrice();
    if (!currentPrice) {
      return {
        recommendation: 'buy_now',
        reasoning: 'Unable to fetch current price data',
      };
    }

    const formattedPrice = this.oracleManager.formatPrice(currentPrice);

    if (priceHistory.length < 7) {
      return {
        recommendation: 'buy_now',
        reasoning: 'Insufficient historical data for analysis',
      };
    }

    // Simple trend analysis
    const recentAvg = priceHistory.slice(-7).reduce((sum, price) => sum + price, 0) / 7;
    const volatility = this.oracleManager.calculateVolatility(priceHistory);

    if (formattedPrice > recentAvg * 1.1 && volatility > 0.5) {
      return {
        recommendation: 'wait',
        reasoning: 'Price is significantly above recent average with high volatility',
        estimatedSavings: (formattedPrice - recentAvg) * (targetUSDAmount / formattedPrice),
      };
    }

    if (volatility > 0.3) {
      return {
        recommendation: 'dollar_cost_average',
        reasoning: 'High volatility suggests dollar-cost averaging strategy',
      };
    }

    return {
      recommendation: 'buy_now',
      reasoning: 'Price is stable and near historical averages',
    };
  }

  /**
   * Monitor price impact of large contributions
   */
  async estimatePriceImpact(
    contractAddress: string,
    contributionAmount: number
  ): Promise<{
    estimatedImpact: number;
    liquidityRisk: 'low' | 'medium' | 'high';
    recommendation: string;
  }> {
    try {
      // Get total platform liquidity
      const viewFunction = await this.aptos.view({
        payload: {
          function: `${contractAddress}::main_contract::get_total_liquidity`,
          functionArguments: [],
        },
      });

      const totalLiquidity = viewFunction[0] as number;
      const impactPercentage = (contributionAmount / totalLiquidity) * 100;

      let liquidityRisk: 'low' | 'medium' | 'high' = 'low';
      let recommendation = 'Safe to contribute full amount';

      if (impactPercentage > 10) {
        liquidityRisk = 'high';
        recommendation = 'Consider splitting contribution into smaller amounts';
      } else if (impactPercentage > 5) {
        liquidityRisk = 'medium';
        recommendation = 'Monitor for slippage but acceptable impact';
      }

      return {
        estimatedImpact: impactPercentage,
        liquidityRisk,
        recommendation,
      };
    } catch (error) {
      console.error('Failed to estimate price impact:', error);
      return {
        estimatedImpact: 0,
        liquidityRisk: 'low',
        recommendation: 'Unable to calculate impact',
      };
    }
  }
}
