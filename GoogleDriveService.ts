
export interface DriveStatus {
  connected: boolean;
  method?: 'oauth' | 'service_account';
}

export const GoogleDriveService = {
  async getAuthUrl(): Promise<string> {
    const response = await fetch('/api/auth/google/url');
    const { url } = await response.json();
    return url;
  },

  async getStatus(): Promise<DriveStatus> {
    const response = await fetch('/api/auth/google/status');
    return response.json();
  },

  async logout(): Promise<void> {
    await fetch('/api/auth/google/logout', { method: 'POST' });
  },

  async fetchData<T>(filename: string): Promise<T | null> {
    const response = await fetch(`/api/drive/data/${filename}`);
    if (!response.ok) return null;
    const { data } = await response.json();
    return data;
  },

  async saveData<T>(filename: string, data: T): Promise<void> {
    await fetch(`/api/drive/data/${filename}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data })
    });
  }
};
