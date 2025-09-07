export interface EventData {
  type: string;
  timestamp: number;
  data: any;
  transactionHash?: string;
  blockHeight?: number;
}

export interface ProjectEventData extends EventData {
  projectId: number;
  creator?: string;
  contributor?: string;
  amount?: number;
}

export type EventCallback = (event: EventData) => void;

export class EventListener {
  private callbacks: Map<string, EventCallback[]> = new Map();
  private isListening: boolean = false;
  private pollingInterval: number = 5000; // 5 seconds
  private intervalId?: NodeJS.Timeout;

  constructor(pollingInterval: number = 5000) {
    this.pollingInterval = pollingInterval;
  }

  // Subscribe to specific event types
  on(eventType: string, callback: EventCallback): void {
    if (!this.callbacks.has(eventType)) {
      this.callbacks.set(eventType, []);
    }
    this.callbacks.get(eventType)!.push(callback);
  }

  // Unsubscribe from events
  off(eventType: string, callback: EventCallback): void {
    const callbacks = this.callbacks.get(eventType);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  // Emit events to subscribers
  private emit(eventType: string, data: EventData): void {
    const callbacks = this.callbacks.get(eventType);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Error in event callback:', error);
        }
      });
    }
  }

  // Start listening for events
  async startListening(): Promise<void> {
    if (this.isListening) {
      return;
    }

    this.isListening = true;
    this.intervalId = setInterval(() => {
      this.pollForEvents();
    }, this.pollingInterval);

    console.log('Event listener started');
  }

  // Stop listening for events
  stopListening(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
    this.isListening = false;
    console.log('Event listener stopped');
  }

  // Poll for new events (simplified implementation)
  private async pollForEvents(): Promise<void> {
    try {
      // This is a simplified implementation
      // In a real scenario, you would query the blockchain or backend API
      // for new events since the last poll
      
      // Example: Mock event for demonstration
      if (Math.random() < 0.1) { // 10% chance of generating a mock event
        const mockEvent: ProjectEventData = {
          type: 'project_created',
          timestamp: Date.now(),
          projectId: Math.floor(Math.random() * 100),
          data: {
            title: 'New Project',
            targetAmount: 1000000,
          },
        };
        this.emit('project_created', mockEvent);
      }
    } catch (error) {
      console.error('Error polling for events:', error);
    }
  }

  // Helper methods for specific event types
  onProjectCreated(callback: (event: ProjectEventData) => void): void {
    this.on('project_created', callback as EventCallback);
  }

  onContributionMade(callback: (event: ProjectEventData) => void): void {
    this.on('contribution_made', callback as EventCallback);
  }

  onProjectCompleted(callback: (event: ProjectEventData) => void): void {
    this.on('project_completed', callback as EventCallback);
  }

  onProjectWithdrawal(callback: (event: ProjectEventData) => void): void {
    this.on('project_withdrawal', callback as EventCallback);
  }

  // Manual event triggering (for testing or integration)
  triggerEvent(eventType: string, data: EventData): void {
    this.emit(eventType, data);
  }

  // Get current listening status
  isEventListening(): boolean {
    return this.isListening;
  }

  // Set polling interval
  setPollingInterval(intervalMs: number): void {
    this.pollingInterval = intervalMs;
    if (this.isListening) {
      this.stopListening();
      this.startListening();
    }
  }
}

// Event type constants
export const EVENT_TYPES = {
  PROJECT_CREATED: 'project_created',
  CONTRIBUTION_MADE: 'contribution_made',
  PROJECT_COMPLETED: 'project_completed',
  PROJECT_WITHDRAWAL: 'project_withdrawal',
  CONTRACT_PAUSED: 'contract_paused',
  CONTRACT_UNPAUSED: 'contract_unpaused',
  FEE_RATE_CHANGED: 'fee_rate_changed',
} as const;

export type EventType = typeof EVENT_TYPES[keyof typeof EVENT_TYPES];
