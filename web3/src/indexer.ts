import { 
  Account, 
  Aptos,
} from '@aptos-labs/ts-sdk';

/**
 * Advanced Aptos Indexer integration for comprehensive event tracking
 * and analytics for the crowdfunding platform
 */

export interface ProjectEvent {
  type: 'project_created' | 'contribution_made' | 'milestone_voted' | 'reward_claimed';
  project_id: number;
  user_address: string;
  amount?: number;
  timestamp: number;
  transaction_hash: string;
  block_height: number;
}

export interface ContributorAnalytics {
  total_contributed: number;
  projects_count: number;
  average_contribution: number;
  first_contribution_date: number;
  last_contribution_date: number;
  contribution_frequency: number;
  favorite_categories: string[];
}

export interface ProjectAnalytics {
  total_contributions: number;
  unique_contributors: number;
  funding_velocity: number; // APT per day
  milestone_completion_rate: number;
  average_contribution_size: number;
  geographic_distribution: { [region: string]: number };
  time_series_data: { timestamp: number; amount: number }[];
}

export interface PlatformStats {
  total_projects: number;
  total_funding: number;
  total_contributors: number;
  success_rate: number;
  average_project_duration: number;
  top_categories: string[];
  monthly_growth: number;
}

export class AdvancedIndexerManager {
  private aptos: Aptos;
  private indexerEndpoint: string;

  constructor(aptos: Aptos, indexerEndpoint: string = "https://indexer.mainnet.aptoslabs.com/v1/graphql") {
    this.aptos = aptos;
    this.indexerEndpoint = indexerEndpoint;
  }

  /**
   * Get all events for a specific project
   */
  async getProjectEvents(
    contractAddress: string,
    projectId: number,
    limit: number = 100
  ): Promise<ProjectEvent[]> {
    try {
      // GraphQL query for project events
      const query = `
        query GetProjectEvents($contract_address: String!, $project_id: Int!, $limit: Int!) {
          events(
            where: {
              account_address: { _eq: $contract_address }
              type: { _in: [
                "${contractAddress}::main_contract::ProjectCreated",
                "${contractAddress}::main_contract::ContributionMade", 
                "${contractAddress}::main_contract::MilestoneVoted",
                "${contractAddress}::main_contract::RewardClaimed"
              ]}
              data: { _contains: { project_id: $project_id } }
            }
            limit: $limit
            order_by: { transaction_block_height: desc }
          ) {
            type
            data
            transaction_block_height
            transaction_hash
            inserted_at
          }
        }
      `;

      const response = await fetch(this.indexerEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          variables: { 
            contract_address: contractAddress, 
            project_id: projectId, 
            limit 
          },
        }),
      });

      const result = await response.json();
      
      return result.data.events.map((event: any) => ({
        type: this.mapEventType(event.type),
        project_id: event.data.project_id,
        user_address: event.data.user_address || event.data.contributor,
        amount: event.data.amount,
        timestamp: new Date(event.inserted_at).getTime() / 1000,
        transaction_hash: event.transaction_hash,
        block_height: event.transaction_block_height,
      }));
    } catch (error) {
      console.error('Failed to get project events:', error);
      return [];
    }
  }

  /**
   * Get contributor analytics for a specific user
   */
  async getContributorAnalytics(
    contractAddress: string,
    userAddress: string
  ): Promise<ContributorAnalytics | null> {
    try {
      const query = `
        query GetContributorAnalytics($contract_address: String!, $user_address: String!) {
          events(
            where: {
              account_address: { _eq: $contract_address }
              type: { _eq: "${contractAddress}::main_contract::ContributionMade" }
              data: { _contains: { contributor: $user_address } }
            }
            order_by: { transaction_block_height: asc }
          ) {
            data
            inserted_at
          }
        }
      `;

      const response = await fetch(this.indexerEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          variables: { 
            contract_address: contractAddress, 
            user_address: userAddress 
          },
        }),
      });

      const result = await response.json();
      const contributions = result.data.events;

      if (contributions.length === 0) return null;

      const amounts = contributions.map((c: any) => c.data.amount);
      const total_contributed = amounts.reduce((sum: number, amount: number) => sum + amount, 0);
      const projects = new Set(contributions.map((c: any) => c.data.project_id));
      const timestamps = contributions.map((c: any) => new Date(c.inserted_at).getTime() / 1000);

      return {
        total_contributed,
        projects_count: projects.size,
        average_contribution: total_contributed / contributions.length,
        first_contribution_date: Math.min(...timestamps),
        last_contribution_date: Math.max(...timestamps),
        contribution_frequency: contributions.length / Math.max(1, (Math.max(...timestamps) - Math.min(...timestamps)) / (24 * 60 * 60)), // contributions per day
        favorite_categories: [], // Would need additional category tracking
      };
    } catch (error) {
      console.error('Failed to get contributor analytics:', error);
      return null;
    }
  }

  /**
   * Get detailed project analytics
   */
  async getProjectAnalytics(
    contractAddress: string,
    projectId: number
  ): Promise<ProjectAnalytics | null> {
    try {
      const query = `
        query GetProjectAnalytics($contract_address: String!, $project_id: Int!) {
          contribution_events: events(
            where: {
              account_address: { _eq: $contract_address }
              type: { _eq: "${contractAddress}::main_contract::ContributionMade" }
              data: { _contains: { project_id: $project_id } }
            }
            order_by: { transaction_block_height: asc }
          ) {
            data
            inserted_at
          }
          milestone_events: events(
            where: {
              account_address: { _eq: $contract_address }
              type: { _eq: "${contractAddress}::main_contract::MilestoneVoted" }
              data: { _contains: { project_id: $project_id } }
            }
          ) {
            data
          }
        }
      `;

      const response = await fetch(this.indexerEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          variables: { 
            contract_address: contractAddress, 
            project_id: projectId 
          },
        }),
      });

      const result = await response.json();
      const contributions = result.data.contribution_events;
      const milestones = result.data.milestone_events;

      if (contributions.length === 0) return null;

      const amounts = contributions.map((c: any) => c.data.amount);
      const contributors = new Set(contributions.map((c: any) => c.data.contributor));
      const timestamps = contributions.map((c: any) => new Date(c.inserted_at).getTime() / 1000);
      
      const total_contributions = amounts.reduce((sum: number, amount: number) => sum + amount, 0);
      const duration_days = (Math.max(...timestamps) - Math.min(...timestamps)) / (24 * 60 * 60);
      const funding_velocity = duration_days > 0 ? total_contributions / duration_days : 0;

      // Create time series data (daily aggregation)
      const time_series_data = this.aggregateByDay(
        contributions.map((c: any, i: number) => ({
          timestamp: timestamps[i],
          amount: amounts[i],
        }))
      );

      return {
        total_contributions,
        unique_contributors: contributors.size,
        funding_velocity,
        milestone_completion_rate: this.calculateMilestoneCompletionRate(milestones),
        average_contribution_size: total_contributions / contributions.length,
        geographic_distribution: {}, // Would need additional geo data
        time_series_data,
      };
    } catch (error) {
      console.error('Failed to get project analytics:', error);
      return null;
    }
  }

  /**
   * Get platform-wide statistics
   */
  async getPlatformStats(contractAddress: string): Promise<PlatformStats | null> {
    try {
      const query = `
        query GetPlatformStats($contract_address: String!) {
          project_created: events_aggregate(
            where: {
              account_address: { _eq: $contract_address }
              type: { _eq: "${contractAddress}::main_contract::ProjectCreated" }
            }
          ) {
            aggregate {
              count
            }
          }
          contributions: events_aggregate(
            where: {
              account_address: { _eq: $contract_address }
              type: { _eq: "${contractAddress}::main_contract::ContributionMade" }
            }
          ) {
            aggregate {
              count
              sum {
                amount: data(path: "amount")
              }
            }
          }
          recent_projects: events(
            where: {
              account_address: { _eq: $contract_address }
              type: { _eq: "${contractAddress}::main_contract::ProjectCreated" }
              inserted_at: { _gte: "2024-01-01" }
            }
            order_by: { inserted_at: desc }
            limit: 100
          ) {
            data
            inserted_at
          }
        }
      `;

      const response = await fetch(this.indexerEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          variables: { contract_address: contractAddress },
        }),
      });

      const result = await response.json();
      
      const total_projects = result.data.project_created.aggregate.count;
      const total_funding = result.data.contributions.aggregate.sum?.amount || 0;
      const total_contributions = result.data.contributions.aggregate.count;
      
      // Calculate success rate and other metrics
      const recent_projects = result.data.recent_projects;
      const successful_projects = recent_projects.filter((p: any) => 
        p.data.current_amount >= p.data.target_amount
      ).length;
      
      const success_rate = recent_projects.length > 0 ? 
        (successful_projects / recent_projects.length) * 100 : 0;

      return {
        total_projects,
        total_funding,
        total_contributors: 0, // Would need unique contributor count query
        success_rate,
        average_project_duration: this.calculateAverageProjectDuration(recent_projects),
        top_categories: [], // Would need category tracking
        monthly_growth: this.calculateMonthlyGrowth(recent_projects),
      };
    } catch (error) {
      console.error('Failed to get platform stats:', error);
      return null;
    }
  }

  /**
   * Get trending projects based on recent activity
   */
  async getTrendingProjects(
    contractAddress: string,
    timeWindow: number = 7 // days
  ): Promise<{ project_id: number; activity_score: number; recent_contributions: number }[]> {
    try {
      const startTime = new Date(Date.now() - timeWindow * 24 * 60 * 60 * 1000).toISOString();

      const query = `
        query GetTrendingProjects($contract_address: String!, $start_time: timestamptz!) {
          events(
            where: {
              account_address: { _eq: $contract_address }
              type: { _eq: "${contractAddress}::main_contract::ContributionMade" }
              inserted_at: { _gte: $start_time }
            }
          ) {
            data
          }
        }
      `;

      const response = await fetch(this.indexerEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          variables: { 
            contract_address: contractAddress,
            start_time: startTime 
          },
        }),
      });

      const result = await response.json();
      const contributions = result.data.events;

      // Group by project and calculate activity scores
      const projectActivity: { [projectId: number]: { count: number; amount: number } } = {};
      
      contributions.forEach((event: any) => {
        const projectId = event.data.project_id;
        const amount = event.data.amount;

        if (!projectActivity[projectId]) {
          projectActivity[projectId] = { count: 0, amount: 0 };
        }

        projectActivity[projectId].count += 1;
        projectActivity[projectId].amount += amount;
      });

      // Calculate activity scores and sort
      return Object.entries(projectActivity)
        .map(([projectId, activity]) => ({
          project_id: parseInt(projectId),
          activity_score: activity.count * 10 + activity.amount * 0.1, // Weighted score
          recent_contributions: activity.count,
        }))
        .sort((a, b) => b.activity_score - a.activity_score)
        .slice(0, 10);
    } catch (error) {
      console.error('Failed to get trending projects:', error);
      return [];
    }
  }

  /**
   * Get user activity feed
   */
  async getUserActivityFeed(
    contractAddress: string,
    userAddress: string,
    limit: number = 50
  ): Promise<ProjectEvent[]> {
    try {
      const query = `
        query GetUserActivity($contract_address: String!, $user_address: String!, $limit: Int!) {
          events(
            where: {
              account_address: { _eq: $contract_address }
              _or: [
                { data: { _contains: { contributor: $user_address } } }
                { data: { _contains: { creator: $user_address } } }
                { data: { _contains: { voter: $user_address } } }
              ]
            }
            limit: $limit
            order_by: { transaction_block_height: desc }
          ) {
            type
            data
            transaction_block_height
            transaction_hash
            inserted_at
          }
        }
      `;

      const response = await fetch(this.indexerEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          variables: { 
            contract_address: contractAddress,
            user_address: userAddress,
            limit 
          },
        }),
      });

      const result = await response.json();
      
      return result.data.events.map((event: any) => ({
        type: this.mapEventType(event.type),
        project_id: event.data.project_id,
        user_address: userAddress,
        amount: event.data.amount,
        timestamp: new Date(event.inserted_at).getTime() / 1000,
        transaction_hash: event.transaction_hash,
        block_height: event.transaction_block_height,
      }));
    } catch (error) {
      console.error('Failed to get user activity feed:', error);
      return [];
    }
  }

  /**
   * Helper method to map event types
   */
  private mapEventType(eventType: string): ProjectEvent['type'] {
    if (eventType.includes('ProjectCreated')) return 'project_created';
    if (eventType.includes('ContributionMade')) return 'contribution_made';
    if (eventType.includes('MilestoneVoted')) return 'milestone_voted';
    if (eventType.includes('RewardClaimed')) return 'reward_claimed';
    return 'contribution_made'; // default
  }

  /**
   * Helper method to aggregate data by day
   */
  private aggregateByDay(data: { timestamp: number; amount: number }[]): { timestamp: number; amount: number }[] {
    const dailyData: { [day: string]: number } = {};

    data.forEach(({ timestamp, amount }) => {
      const day = new Date(timestamp * 1000).toISOString().split('T')[0];
      dailyData[day] = (dailyData[day] || 0) + amount;
    });

    return Object.entries(dailyData).map(([day, amount]) => ({
      timestamp: new Date(day).getTime() / 1000,
      amount,
    }));
  }

  /**
   * Helper method to calculate milestone completion rate
   */
  private calculateMilestoneCompletionRate(milestones: any[]): number {
    if (milestones.length === 0) return 0;

    const completedMilestones = milestones.filter(m => m.data.approved === true).length;
    return (completedMilestones / milestones.length) * 100;
  }

  /**
   * Helper method to calculate average project duration
   */
  private calculateAverageProjectDuration(projects: any[]): number {
    if (projects.length === 0) return 0;

    const durations = projects.map((p: any) => p.data.duration_seconds);
    return durations.reduce((sum: number, duration: number) => sum + duration, 0) / projects.length / (24 * 60 * 60); // in days
  }

  /**
   * Helper method to calculate monthly growth
   */
  private calculateMonthlyGrowth(projects: any[]): number {
    const now = new Date();
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const twoMonthsAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    const thisMonth = projects.filter(p => 
      new Date(p.inserted_at) >= oneMonthAgo
    ).length;

    const lastMonth = projects.filter(p => {
      const date = new Date(p.inserted_at);
      return date >= twoMonthsAgo && date < oneMonthAgo;
    }).length;

    if (lastMonth === 0) return 0;
    return ((thisMonth - lastMonth) / lastMonth) * 100;
  }
}
