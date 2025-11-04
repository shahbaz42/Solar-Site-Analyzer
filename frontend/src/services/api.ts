import axios, { AxiosInstance } from 'axios';
import type {
  SiteListResponse,
  SiteDetail,
  AnalysisRequest,
  AnalysisResponse,
  StatisticsResponse,
} from '@/types';
import { API_BASE_URL } from '@/config';

class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('API Error:', error.response?.data || error.message);
        return Promise.reject(error);
      }
    );
  }

  // Get sites with optional filters
  async getSites(params?: {
    min_score?: number;
    max_score?: number;
    limit?: number;
    offset?: number;
  }): Promise<SiteListResponse> {
    const response = await this.client.get<SiteListResponse>('/api/sites', { params });
    return response.data;
  }

  // Get site by ID
  async getSiteById(siteId: number): Promise<SiteDetail> {
    const response = await this.client.get<SiteDetail>(`/api/sites/${siteId}`);
    return response.data;
  }

  // Analyze sites with custom weights
  async analyzeSites(request: AnalysisRequest): Promise<AnalysisResponse> {
    const response = await this.client.post<AnalysisResponse>('/api/analyze', request);
    return response.data;
  }

  // Get statistics
  async getStatistics(params?: {
    min_score?: number;
    max_score?: number;
  }): Promise<StatisticsResponse> {
    const response = await this.client.get<StatisticsResponse>('/api/statistics', { params });
    return response.data;
  }

  // Health check
  async healthCheck(): Promise<{ status: string }> {
    const response = await this.client.get('/health');
    return response.data;
  }

  // Export sites as CSV
  async exportCSV(params?: {
    min_score?: number;
    max_score?: number;
  }): Promise<void> {
    const response = await this.client.get('/api/export', {
      params: { ...params, format: 'csv' },
      responseType: 'blob',
    });
    
    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `solar_sites_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  }

  // Export sites as JSON
  async exportJSON(params?: {
    min_score?: number;
    max_score?: number;
  }): Promise<void> {
    const response = await this.client.get('/api/export', {
      params: { ...params, format: 'json' },
    });
    
    // Create download link
    const dataStr = JSON.stringify(response.data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = window.URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `solar_sites_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  }
}

export default new ApiService();
