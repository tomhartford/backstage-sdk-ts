/**
 * Backstage API Client
 * 
 * Auto-generated wrapper with token management and convenience methods
 * Generated from OpenAPI specification
 */

import type { components } from './generated/types';

// Extract schema types
type LoginRequest = components['schemas']['LoginRequest'];
type LoginResponse = components['schemas']['LoginResponse'];
type RefreshTokenRequest = components['schemas']['RefreshTokenRequest'];
type RefreshTokenResponse = components['schemas']['RefreshTokenResponse'];
type RedeemInvitationRequest = components['schemas']['RedeemInvitationRequest'];
type RedeemInvitationResponse = components['schemas']['RedeemInvitationResponse'];
type FederateRequest = components['schemas']['FederateRequest'];
type GetUserMeResponse = components['schemas']['GetUserMeResponse'];
type GetUserOrganisationsResponse = components['schemas']['GetUserOrganisationsResponse'];
type GetOrganisationResponse = components['schemas']['GetOrganisationResponse'];
type UpdateOrganisationRequest = components['schemas']['UpdateOrganisationRequest'];
type UpdateOrganisationResponse = components['schemas']['UpdateOrganisationResponse'];

export interface BackstageClientConfig {
  baseUrl: string;
  accessToken?: string;
  refreshToken?: string;
  onTokenRefresh?: (accessToken: string, refreshToken: string) => void | Promise<void>;
  headers?: Record<string, string>;
}

export class BackstageClient {
  private baseUrl: string;
  private accessToken?: string;
  private refreshToken?: string;
  private headers: Record<string, string>;
  private onTokenRefresh?: (accessToken: string, refreshToken: string) => void | Promise<void>;

  constructor(config: BackstageClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, ''); // Remove trailing slash
    this.accessToken = config.accessToken;
    this.refreshToken = config.refreshToken;
    this.onTokenRefresh = config.onTokenRefresh;
    this.headers = config.headers || {};
  }

  /**
   * Set the access token for authenticated requests
   */
  setAccessToken(token: string): void {
    this.accessToken = token;
  }

  /**
   * Clear the access token
   */
  clearAccessToken(): void {
    this.accessToken = undefined;
  }

  /**
   * Get the current access token
   */
  getAccessToken(): string | undefined {
    return this.accessToken;
  }

  /**
   * Set the refresh token
   */
  setRefreshToken(token: string): void {
    this.refreshToken = token;
  }

  /**
   * Get the current refresh token
   */
  getRefreshToken(): string | undefined {
    return this.refreshToken;
  }

  /**
   * Make an authenticated API request
   * - Adds /v1 prefix for API versioning
   * - Injects Authorization header if token available
   * - Automatically refreshes token on 401
   * - Unwraps JSend format responses
   */
  private async request<T>(
    path: string,
    options: RequestInit = {}
  ): Promise<T> {
    // Ensure path starts with /v1 for API versioning
    const versionedPath = path.startsWith('/v1') ? path : `/v1${path}`;
    const url = `${this.baseUrl}${versionedPath}`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...this.headers,
      ...(options.headers as Record<string, string> || {}),
    };

    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    let response = await fetch(url, {
      ...options,
      headers,
    });

    // Handle token refresh on 401
    if (response.status === 401 && this.refreshToken && !path.includes('/auth/refresh')) {
      try {
        // Make refresh request directly to avoid circular dependency
        const refreshResponse = await fetch(`${this.baseUrl}/v1/auth/refresh`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refreshToken: this.refreshToken }),
        });
        
        if (!refreshResponse.ok) {
          throw new Error('Token refresh failed');
        }
        
        const refreshJson = await refreshResponse.json();
        const refreshData = refreshJson.status === 'success' && refreshJson.data !== undefined 
          ? refreshJson.data 
          : refreshJson;
        
        this.accessToken = refreshData.accessToken;
        this.refreshToken = refreshData.refreshToken;
        
        if (this.onTokenRefresh) {
          await this.onTokenRefresh(refreshData.accessToken, refreshData.refreshToken);
        }

        // Retry original request with new token
        headers['Authorization'] = `Bearer ${this.accessToken}`;
        response = await fetch(url, {
          ...options,
          headers,
        });
      } catch (refreshError) {
        // Refresh failed, throw original 401
        throw new Error('Authentication failed. Please log in again.');
      }
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        error: response.statusText,
        code: 'HTTP_ERROR',
      }));
      throw new Error(error.error || 'Request failed');
    }

    const json = await response.json();
    
    // Unwrap JSend format if present
    if (json.status === 'success' && json.data !== undefined) {
      return json.data as T;
    }
    
    return json as T;
  }

  /**
   * Authentication methods
   */
  authentication = {
  /**
   * User login
   * Authenticate a user with email and password, returns access and refresh tokens
   */
  login: async (request: LoginRequest) => {
    const response = await this.request<LoginResponse>(`/auth/login`, {
      method: 'POST',
      body: JSON.stringify(request)
    });

    this.setAccessToken(response.accessToken);
    this.setRefreshToken(response.refreshToken);

    return response;
  },

  /**
   * Refresh access token
   * Exchange a refresh token for a new access token and refresh token
   */
  refresh: async (request: RefreshTokenRequest) => {
    const response = await this.request<RefreshTokenResponse>(`/auth/refresh`, {
      method: 'POST',
      body: JSON.stringify(request)
    });

    this.setAccessToken(response.accessToken);
    this.setRefreshToken(response.refreshToken);

    if (this.onTokenRefresh) {
      await this.onTokenRefresh(response.accessToken, response.refreshToken);
    }

    return response;
  },

  /**
   * Redeem invitation
   * Redeem an invitation code and set up a new user account
   */
  redeem: async (request: RedeemInvitationRequest) => {
    const response = await this.request<RedeemInvitationResponse>(`/auth/redeem`, {
      method: 'POST',
      body: JSON.stringify(request)
    });

    this.setAccessToken(response.accessToken);
    this.setRefreshToken(response.refreshToken);

    return response;
  },

  /**
   * Federate user to organisation
   * Exchange a Stagedoor JWT token for API access and refresh tokens
   */
  federate: async (request: FederateRequest) => {
    const response = await this.request<LoginResponse>(`/auth/federate`, {
      method: 'POST',
      body: JSON.stringify(request)
    });

    this.setAccessToken(response.accessToken);
    this.setRefreshToken(response.refreshToken);

    return response;
  }
  };

  /**
   * Users methods
   */
  users = {
  /**
   * Get current user
   * Get the currently authenticated user information
   */
  getMe: async () => {
    const response = await this.request<GetUserMeResponse>(`/users/me`, {
      method: 'GET'
    });

    return response.user;
  },

  /**
   * Get user organisations
   * Get all organisations the current user is a member of
   */
  getMeOrganisations: async () => {
    const response = await this.request<GetUserOrganisationsResponse>(`/users/me/organisations`, {
      method: 'GET'
    });

    return response.organisations;
  }
  };

  /**
   * Organizations methods
   */
  organisations = {
  /**
   * Get organisation
   * Get organisation details including branding information
   */
  get: async (id: string) => {
    const response = await this.request<GetOrganisationResponse>(`/organisations/${id}`, {
      method: 'GET'
    });

    return response.organisation;
  },

  /**
   * Update organisation
   * Update organisation details and branding (owner permission required)
   */
  update: async (id: string, request: UpdateOrganisationRequest) => {
    const response = await this.request<UpdateOrganisationResponse>(`/organisations/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(request)
    });

    return response.organisation;
  }
  };
}
