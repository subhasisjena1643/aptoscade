import axios, { AxiosInstance } from 'axios';

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface BackendEndpoints {
  projects: string;
  users: string;
  transactions: string;
  stats: string;
}

export class APIService {
  private api: AxiosInstance;
  private endpoints: BackendEndpoints;

  constructor(baseURL: string, endpoints?: Partial<BackendEndpoints>) {
    this.api = axios.create({
      baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.endpoints = {
      projects: '/api/projects',
      users: '/api/users', 
      transactions: '/api/transactions',
      stats: '/api/stats',
      ...endpoints,
    };

    // Add response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('API Error:', error);
        return Promise.reject(error);
      }
    );
  }

  // Project-related API calls
  async getAllProjects(): Promise<APIResponse<any[]>> {
    try {
      const response = await this.api.get(this.endpoints.projects);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to fetch projects: ${error}`,
      };
    }
  }

  async getProject(projectId: number): Promise<APIResponse<any>> {
    try {
      const response = await this.api.get(`${this.endpoints.projects}/${projectId}`);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to fetch project ${projectId}: ${error}`,
      };
    }
  }

  async createProject(projectData: {
    title: string;
    description: string;
    targetAmount: number;
    duration: number;
    creatorAddress: string;
  }): Promise<APIResponse<any>> {
    try {
      const response = await this.api.post(this.endpoints.projects, projectData);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to create project: ${error}`,
      };
    }
  }

  // User-related API calls
  async getUserProfile(userAddress: string): Promise<APIResponse<any>> {
    try {
      const response = await this.api.get(`${this.endpoints.users}/${userAddress}`);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to fetch user profile: ${error}`,
      };
    }
  }

  async updateUserProfile(userAddress: string, profileData: any): Promise<APIResponse<any>> {
    try {
      const response = await this.api.put(`${this.endpoints.users}/${userAddress}`, profileData);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to update user profile: ${error}`,
      };
    }
  }

  // Transaction-related API calls
  async getTransactionHistory(userAddress: string): Promise<APIResponse<any[]>> {
    try {
      const response = await this.api.get(`${this.endpoints.transactions}/${userAddress}`);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to fetch transaction history: ${error}`,
      };
    }
  }

  async submitTransaction(transactionData: {
    hash: string;
    type: string;
    userAddress: string;
    projectId?: number;
    amount?: number;
  }): Promise<APIResponse<any>> {
    try {
      const response = await this.api.post(this.endpoints.transactions, transactionData);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to submit transaction: ${error}`,
      };
    }
  }

  // Statistics API calls
  async getPlatformStats(): Promise<APIResponse<{
    totalProjects: number;
    totalUsers: number;
    totalFunding: number;
    successRate: number;
  }>> {
    try {
      const response = await this.api.get(this.endpoints.stats);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to fetch platform stats: ${error}`,
      };
    }
  }

  // Health check
  async healthCheck(): Promise<APIResponse<{ status: string }>> {
    try {
      const response = await this.api.get('/health');
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: `Health check failed: ${error}`,
      };
    }
  }

  // Utility method to set auth token if needed
  setAuthToken(token: string): void {
    this.api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  // Utility method to remove auth token
  removeAuthToken(): void {
    delete this.api.defaults.headers.common['Authorization'];
  }
}
