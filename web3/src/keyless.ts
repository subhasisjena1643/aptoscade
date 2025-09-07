/**
 * Simplified Keyless Authentication Manager
 * For production use, integrate with proper Aptos Keyless SDK
 */

export interface KeylessConfig {
  googleClientId: string;
  maxAgeSeconds?: number;
}

export interface KeylessAccountData {
  address: string;
  jwt: string;
  timestamp: number;
  maxAgeSeconds: number;
}

export class KeylessAuthManager {
  private googleClientId: string;
  private maxAgeSeconds: number;
  private currentAccount: KeylessAccountData | null = null;

  constructor(config: KeylessConfig) {
    this.googleClientId = config.googleClientId;
    this.maxAgeSeconds = config.maxAgeSeconds || 3600; // 1 hour default
  }

  /**
   * Initialize Google Sign-In
   */
  async initializeGoogleAuth(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Check if already loaded
      if (window.google?.accounts?.id) {
        this.configureGoogleAuth();
        resolve();
        return;
      }

      // Load Google Identity Services script
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.onload = () => {
        this.configureGoogleAuth();
        resolve();
      };
      script.onerror = () => reject(new Error('Failed to load Google Identity Services'));
      document.head.appendChild(script);
    });
  }

  private configureGoogleAuth(): void {
    if (window.google?.accounts?.id) {
      window.google.accounts.id.initialize({
        client_id: this.googleClientId,
        callback: this.handleGoogleSignIn.bind(this),
        auto_select: false,
        cancel_on_tap_outside: true,
      });
    }
  }

  /**
   * Show Google Sign-In popup
   */
  async signInWithGoogle(): Promise<KeylessAccountData> {
    if (!window.google?.accounts?.id) {
      throw new Error('Google Identity Services not initialized');
    }

    return new Promise((resolve, reject) => {
      this.pendingSignInResolve = resolve;
      this.pendingSignInReject = reject;

      window.google!.accounts.id.prompt((notification: any) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          reject(new Error('Google Sign-In was not displayed or was skipped'));
        }
      });

      // Timeout after 30 seconds
      setTimeout(() => {
        if (this.pendingSignInReject) {
          this.pendingSignInReject(new Error('Sign-in timeout'));
          this.pendingSignInResolve = undefined;
          this.pendingSignInReject = undefined;
        }
      }, 30000);
    });
  }

  private pendingSignInResolve?: (account: KeylessAccountData) => void;
  private pendingSignInReject?: (error: Error) => void;

  private async handleGoogleSignIn(response: any): Promise<void> {
    try {
      const jwt = response.credential;
      
      // Parse JWT to get user info
      const payload = JSON.parse(atob(jwt.split('.')[1]));
      
      // For demo purposes, create a deterministic address based on email
      // In production, use proper Aptos Keyless derivation
      const address = this.createDeterministicAddress(payload.email);

      const accountData: KeylessAccountData = {
        address,
        jwt,
        timestamp: Date.now(),
        maxAgeSeconds: this.maxAgeSeconds,
      };

      this.currentAccount = accountData;

      // Store in localStorage for persistence
      localStorage.setItem('keyless_account', JSON.stringify(accountData));

      if (this.pendingSignInResolve) {
        this.pendingSignInResolve(accountData);
        this.pendingSignInResolve = undefined;
        this.pendingSignInReject = undefined;
      }
    } catch (error) {
      console.error('Google sign-in error:', error);
      if (this.pendingSignInReject) {
        this.pendingSignInReject(error as Error);
        this.pendingSignInResolve = undefined;
        this.pendingSignInReject = undefined;
      }
    }
  }

  private createDeterministicAddress(email: string): string {
    // Simple hash function for demo - in production use proper derivation
    let hash = 0;
    for (let i = 0; i < email.length; i++) {
      const char = email.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    // Create a 64-character hex string (Aptos address format)
    const hashHex = Math.abs(hash).toString(16).padStart(8, '0');
    return '0x' + hashHex.repeat(8).substring(0, 64);
  }

  /**
   * Restore keyless account from localStorage
   */
  async restoreKeylessAccount(): Promise<KeylessAccountData | null> {
    try {
      const accountDataStr = localStorage.getItem('keyless_account');
      if (!accountDataStr) return null;

      const accountData: KeylessAccountData = JSON.parse(accountDataStr);
      
      // Check if account has expired
      const elapsed = Date.now() - accountData.timestamp;
      if (elapsed > accountData.maxAgeSeconds * 1000) {
        this.clearStoredAccount();
        return null;
      }

      this.currentAccount = accountData;
      return accountData;
    } catch (error) {
      console.error('Failed to restore keyless account:', error);
      this.clearStoredAccount();
      return null;
    }
  }

  /**
   * Sign out and clear stored account
   */
  signOut(): void {
    this.currentAccount = null;
    this.clearStoredAccount();
    
    // Sign out from Google
    if (window.google?.accounts?.id) {
      window.google.accounts.id.disableAutoSelect();
    }
  }

  private clearStoredAccount(): void {
    localStorage.removeItem('keyless_account');
  }

  /**
   * Get current keyless account
   */
  getCurrentAccount(): KeylessAccountData | null {
    return this.currentAccount;
  }

  /**
   * Check if user is signed in
   */
  isSignedIn(): boolean {
    return this.currentAccount !== null;
  }

  /**
   * Get account address
   */
  getAccountAddress(): string | null {
    return this.currentAccount?.address || null;
  }

  /**
   * Get user info from JWT
   */
  getUserInfo(): any {
    if (!this.currentAccount?.jwt) return null;
    
    try {
      return JSON.parse(atob(this.currentAccount.jwt.split('.')[1]));
    } catch (error) {
      console.error('Failed to parse JWT:', error);
      return null;
    }
  }

  /**
   * Create a sign-in button
   */
  createSignInButton(containerId: string, theme: 'outline' | 'filled_blue' | 'filled_black' = 'filled_blue'): void {
    const element = document.getElementById(containerId);
    if (!element || !window.google?.accounts?.id) {
      console.error('Cannot create sign-in button: element or Google services not available');
      return;
    }

    window.google.accounts.id.renderButton(element, {
      theme,
      size: 'large',
      type: 'standard',
      text: 'signin_with',
      shape: 'rectangular',
      logo_alignment: 'left',
    });
  }

  /**
   * Check if JWT is still valid
   */
  isJWTValid(): boolean {
    if (!this.currentAccount) return false;
    
    try {
      const payload = JSON.parse(atob(this.currentAccount.jwt.split('.')[1]));
      const now = Math.floor(Date.now() / 1000);
      return payload.exp > now;
    } catch (error) {
      return false;
    }
  }
}

// Extend the window interface for TypeScript
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          prompt: (callback?: (notification: any) => void) => void;
          renderButton: (parent: HTMLElement, options: any) => void;
          disableAutoSelect: () => void;
        };
      };
    };
  }
}
