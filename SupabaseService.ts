export interface SupabaseConfigProps {
  url: string;
  tablePenyuluhan: string;
  tableOptHama: string;
  hasKey: boolean;
  maskedKey: string;
}

export const SupabaseService = {
  async getConfig(): Promise<SupabaseConfigProps> {
    try {
      const resp = await fetch('/api/supabase/config');
      if (!resp.ok) {
        throw new Error('Gagal mengambil konfigurasi Supabase.');
      }
      return resp.json();
    } catch (e: any) {
      console.error(e);
      return {
        url: 'https://hvxrwragkrfsbgbmwpcd.supabase.co',
        tablePenyuluhan: 'penyuluhan',
        tableOptHama: 'katalog_hama',
        hasKey: false,
        maskedKey: ''
      };
    }
  },

  async saveConfig(config: { url?: string; anonKey?: string; tablePenyuluhan?: string; tableOptHama?: string }): Promise<{ success: boolean; message: string }> {
    const resp = await fetch('/api/supabase/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    });
    if (!resp.ok) {
      const err = await resp.json();
      throw new Error(err.error || 'Gagal menyimpan konfigurasi Supabase.');
    }
    return resp.json();
  },

  async fetchRemoteData(tableType: 'penyuluhan' | 'katalog_hama'): Promise<any[]> {
    const tableParam = tableType === 'penyuluhan' ? 'penyuluhan' : 'katalog_hama';
    const resp = await fetch(`/api/supabase/data/${tableParam}`);
    if (!resp.ok) {
      const err = await resp.json();
      throw new Error(err.error || `Gagal mengambil data ${tableType} dari Supabase.`);
    }
    const result = await resp.json();
    if (!result.success) {
      throw new Error(result.error || 'Terjadi kesalahan tidak dikenal saat mengambil data.');
    }
    return result.data || [];
  },

  async saveRemoteData(tableType: 'penyuluhan' | 'katalog_hama', item: any): Promise<any> {
    const tableParam = tableType === 'penyuluhan' ? 'penyuluhan' : 'katalog_hama';
    const resp = await fetch(`/api/supabase/data/${tableParam}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item)
    });
    if (!resp.ok) {
      const err = await resp.json();
      throw new Error(err.error || `Gagal menyimpan data ${tableType} ke Supabase.`);
    }
    return resp.json();
  },

  async deleteRemoteData(tableType: 'penyuluhan' | 'katalog_hama', id: string): Promise<any> {
    const tableParam = tableType === 'penyuluhan' ? 'penyuluhan' : 'katalog_hama';
    const resp = await fetch(`/api/supabase/data/${tableParam}/${id}`, {
      method: 'DELETE'
    });
    if (!resp.ok) {
      const err = await resp.json();
      throw new Error(err.error || `Gagal menghapus data ${tableType} dari Supabase.`);
    }
    return resp.json();
  },

  // Seed remote database tables with local entries
  async seedRemoteTable(tableType: 'penyuluhan' | 'katalog_hama', localItems: any[]): Promise<{ successCount: number; errors: string[] }> {
    let successCount = 0;
    const errors: string[] = [];

    for (const item of localItems) {
      try {
        await this.saveRemoteData(tableType, item);
        successCount++;
      } catch (err: any) {
        errors.push(`Item "${item.title || item.name}": ${err.message}`);
      }
    }

    return { successCount, errors };
  }
};
