import { 
  Account, 
  Aptos,
  PendingTransactionResponse,
  InputGenerateTransactionPayloadData,
} from '@aptos-labs/ts-sdk';

/**
 * Advanced Aptos Objects integration for the crowdfunding platform
 * Implements Object-based architecture for enhanced functionality
 */

export interface ProjectObjectData {
  creator: string;
  title: string;
  description: string;
  target_amount: number;
  current_amount: number;
  end_time: number;
  is_active: boolean;
  milestone_votes: any[];
  reward_collection?: string;
  metadata_uri?: string;
}

export interface ProjectObjectConfig {
  deletable_by_creator?: boolean;
  deletable_by_owner?: boolean;
  extensible_by_creator?: boolean;
  extensible_by_owner?: boolean;
  freezable_by_creator?: boolean;
  freezable_by_owner?: boolean;
}

export class AptosObjectsManager {
  private aptos: Aptos;

  constructor(aptos: Aptos) {
    this.aptos = aptos;
  }

  /**
   * Create a new project as an Aptos Object
   * This provides better composability and extensibility
   */
  async createProjectObject(
    creator: Account,
    contractAddress: string,
    title: string,
    description: string,
    targetAmount: number,
    durationSeconds: number,
    config?: ProjectObjectConfig
  ): Promise<PendingTransactionResponse> {
    const transactionPayload: InputGenerateTransactionPayloadData = {
      function: `${contractAddress}::main_contract::create_project_object`,
      functionArguments: [
        title,
        description,
        targetAmount,
        durationSeconds,
        config?.deletable_by_creator || false,
        config?.deletable_by_owner || false,
        config?.extensible_by_creator || true,
        config?.extensible_by_owner || true,
        config?.freezable_by_creator || false,
        config?.freezable_by_owner || false,
      ],
    };

    const transaction = await this.aptos.transaction.build.simple({
      sender: creator.accountAddress,
      data: transactionPayload,
      options: {
        maxGasAmount: 20000,
        gasUnitPrice: 100,
      },
    });

    return await this.aptos.signAndSubmitTransaction({
      signer: creator,
      transaction,
    });
  }

  /**
   * Get project object data
   */
  async getProjectObject(objectAddress: string): Promise<ProjectObjectData | null> {
    try {
      const objectData = await this.aptos.getObjectDataByObjectAddress({
        objectAddress,
      });

      if (!objectData) return null;

      // For now, return basic object info - in production you'd need to
      // query the specific resource data from the object
      return {
        creator: objectData.owner_address,
        title: "Project Title", // Would be fetched from resource
        description: "Project Description", // Would be fetched from resource
        target_amount: 0, // Would be fetched from resource
        current_amount: 0, // Would be fetched from resource
        end_time: 0, // Would be fetched from resource
        is_active: !objectData.is_deleted,
        milestone_votes: [],
      };
    } catch (error) {
      console.error('Failed to get project object:', error);
      return null;
    }
  }

  /**
   * Update project object metadata
   */
  async updateProjectObjectMetadata(
    owner: Account,
    contractAddress: string,
    projectObjectAddress: string,
    metadataUri: string
  ): Promise<PendingTransactionResponse> {
    const transactionPayload: InputGenerateTransactionPayloadData = {
      function: `${contractAddress}::main_contract::update_project_metadata`,
      functionArguments: [projectObjectAddress, metadataUri],
    };

    const transaction = await this.aptos.transaction.build.simple({
      sender: owner.accountAddress,
      data: transactionPayload,
    });

    return await this.aptos.signAndSubmitTransaction({
      signer: owner,
      transaction,
    });
  }

  /**
   * Transfer project object ownership
   */
  async transferProjectObject(
    currentOwner: Account,
    contractAddress: string,
    projectObjectAddress: string,
    newOwnerAddress: string
  ): Promise<PendingTransactionResponse> {
    const transactionPayload: InputGenerateTransactionPayloadData = {
      function: `${contractAddress}::main_contract::transfer_project_object`,
      functionArguments: [projectObjectAddress, newOwnerAddress],
    };

    const transaction = await this.aptos.transaction.build.simple({
      sender: currentOwner.accountAddress,
      data: transactionPayload,
    });

    return await this.aptos.signAndSubmitTransaction({
      signer: currentOwner,
      transaction,
    });
  }

  /**
   * Extend project object with new functionality
   */
  async extendProjectObject(
    owner: Account,
    contractAddress: string,
    projectObjectAddress: string,
    extensionData: any
  ): Promise<PendingTransactionResponse> {
    const transactionPayload: InputGenerateTransactionPayloadData = {
      function: `${contractAddress}::main_contract::extend_project_object`,
      functionArguments: [projectObjectAddress, extensionData],
    };

    const transaction = await this.aptos.transaction.build.simple({
      sender: owner.accountAddress,
      data: transactionPayload,
    });

    return await this.aptos.signAndSubmitTransaction({
      signer: owner,
      transaction,
    });
  }

  /**
   * Check if object exists and is owned by specific account
   */
  async verifyObjectOwnership(
    objectAddress: string,
    expectedOwner: string
  ): Promise<boolean> {
    try {
      const objectData = await this.aptos.getObjectDataByObjectAddress({
        objectAddress,
      });

      return objectData?.owner_address === expectedOwner;
    } catch (error) {
      console.error('Failed to verify object ownership:', error);
      return false;
    }
  }

  /**
   * List all project objects created by a user
   */
  async getUserProjectObjects(userAddress: string): Promise<string[]> {
    try {
      // This would require custom indexing in a real application
      // For demo purposes, we'll show how it could work conceptually
      const events = await this.aptos.getAccountEventsByEventType({
        accountAddress: userAddress,
        eventType: "0x1::crowdfunding::ProjectCreated" as `${string}::${string}::${string}`,
        options: {
          limit: 100,
        },
      });

      return events.map(event => (event.data as any).project_object_address as string);
    } catch (error) {
      console.error('Failed to get user project objects:', error);
      return [];
    }
  }

  /**
   * Freeze/unfreeze a project object (admin functionality)
   */
  async freezeProjectObject(
    admin: Account,
    contractAddress: string,
    projectObjectAddress: string,
    freeze: boolean
  ): Promise<PendingTransactionResponse> {
    const transactionPayload: InputGenerateTransactionPayloadData = {
      function: `${contractAddress}::main_contract::${freeze ? 'freeze' : 'unfreeze'}_project_object`,
      functionArguments: [projectObjectAddress],
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
   * Delete a project object (if allowed by configuration)
   */
  async deleteProjectObject(
    account: Account,
    contractAddress: string,
    projectObjectAddress: string
  ): Promise<PendingTransactionResponse> {
    const transactionPayload: InputGenerateTransactionPayloadData = {
      function: `${contractAddress}::main_contract::delete_project_object`,
      functionArguments: [projectObjectAddress],
    };

    const transaction = await this.aptos.transaction.build.simple({
      sender: account.accountAddress,
      data: transactionPayload,
    });

    return await this.aptos.signAndSubmitTransaction({
      signer: account,
      transaction,
    });
  }

  /**
   * Batch operations for multiple project objects
   */
  async batchUpdateProjectObjects(
    owner: Account,
    contractAddress: string,
    updates: { objectAddress: string; metadataUri: string }[]
  ): Promise<PendingTransactionResponse[]> {
    const results: PendingTransactionResponse[] = [];

    for (const update of updates) {
      try {
        const result = await this.updateProjectObjectMetadata(
          owner,
          contractAddress,
          update.objectAddress,
          update.metadataUri
        );
        results.push(result);
      } catch (error) {
        console.error(`Failed to update object ${update.objectAddress}:`, error);
        throw error;
      }
    }

    return results;
  }
}

/**
 * Project Object helper for common operations
 */
export class ProjectObjectHelper {
  private objectsManager: AptosObjectsManager;

  constructor(objectsManager: AptosObjectsManager) {
    this.objectsManager = objectsManager;
  }

  /**
   * Create a fully configured project object with default settings
   */
  async createStandardProjectObject(
    creator: Account,
    contractAddress: string,
    title: string,
    description: string,
    targetAmount: number,
    durationDays: number
  ): Promise<PendingTransactionResponse> {
    const durationSeconds = durationDays * 24 * 60 * 60;
    
    const config: ProjectObjectConfig = {
      deletable_by_creator: true,
      deletable_by_owner: false,
      extensible_by_creator: true,
      extensible_by_owner: true,
      freezable_by_creator: false,
      freezable_by_owner: true,
    };

    return this.objectsManager.createProjectObject(
      creator,
      contractAddress,
      title,
      description,
      targetAmount,
      durationSeconds,
      config
    );
  }

  /**
   * Create a immutable project object (cannot be modified after creation)
   */
  async createImmutableProjectObject(
    creator: Account,
    contractAddress: string,
    title: string,
    description: string,
    targetAmount: number,
    durationSeconds: number
  ): Promise<PendingTransactionResponse> {
    const config: ProjectObjectConfig = {
      deletable_by_creator: false,
      deletable_by_owner: false,
      extensible_by_creator: false,
      extensible_by_owner: false,
      freezable_by_creator: false,
      freezable_by_owner: false,
    };

    return this.objectsManager.createProjectObject(
      creator,
      contractAddress,
      title,
      description,
      targetAmount,
      durationSeconds,
      config
    );
  }

  /**
   * Get comprehensive project statistics from object
   */
  async getProjectStatistics(objectAddress: string): Promise<{
    fundingProgress: number;
    timeRemaining: number;
    contributorCount: number;
    milestoneCount: number;
    isActive: boolean;
  } | null> {
    const projectData = await this.objectsManager.getProjectObject(objectAddress);
    
    if (!projectData) return null;

    const now = Math.floor(Date.now() / 1000);
    const fundingProgress = (projectData.current_amount / projectData.target_amount) * 100;
    const timeRemaining = Math.max(0, projectData.end_time - now);

    return {
      fundingProgress,
      timeRemaining,
      contributorCount: 0, // Would need additional tracking
      milestoneCount: projectData.milestone_votes?.length || 0,
      isActive: projectData.is_active,
    };
  }
}
