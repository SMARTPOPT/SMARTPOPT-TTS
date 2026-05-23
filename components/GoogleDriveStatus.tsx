
import React, { useEffect, useState } from 'react';
import { GoogleDriveService, DriveStatus } from '../GoogleDriveService';

const GoogleDriveStatus: React.FC = () => {
  const [status, setStatus] = useState<DriveStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStatus = async () => {
    try {
      const s = await GoogleDriveService.getStatus();
      setStatus(s);
    } catch (error) {
      console.error('Failed to fetch Drive status:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        fetchStatus();
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleConnect = async () => {
    try {
      const url = await GoogleDriveService.getAuthUrl();
      window.open(url, 'google_oauth', 'width=600,height=700');
    } catch (error) {
      console.error('Failed to get auth URL:', error);
      alert('Gagal menghubungkan ke Google Drive. Periksa konfigurasi API.');
    }
  };

  const handleLogout = async () => {
    if (confirm('Apakah Anda yakin ingin memutuskan koneksi Google Drive?')) {
      await GoogleDriveService.logout();
      setStatus({ connected: false });
    }
  };

  if (loading) return <div className="px-4 py-2 text-[10px] text-green-400 animate-pulse">Memeriksa Drive...</div>;

  return (
    <div className="px-4 py-3 bg-green-800/30 rounded-xl border border-green-700/50 mx-4 mt-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          <svg className="w-4 h-4 mr-2 text-green-400" fill="currentColor" viewBox="0 0 24 24">
            <path d="M7.71 3.5L1.15 15l3.43 6 6.55-11.5h-6.86zm1.45 11.5l3.43 6h13.1l-3.43-6H9.16zm1.45-1.5h13.1L17.15 2 10.61 13.5z"/>
          </svg>
          <span className="text-[10px] font-bold uppercase tracking-wider text-green-100">Google Drive</span>
        </div>
        <div className={`w-2 h-2 rounded-full ${status?.connected ? 'bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.5)]' : 'bg-slate-500'}`}></div>
      </div>
      
      {status?.connected ? (
        <div className="space-y-2">
          <p className="text-[10px] text-green-300 leading-tight">
            {status.method === 'service_account' 
              ? 'Terhubung otomatis via Service Account.' 
              : 'Terhubung sebagai penyimpanan utama.'}
          </p>
          {status.method !== 'service_account' && (
            <button 
              onClick={handleLogout}
              className="text-[9px] font-bold text-red-300 hover:text-red-200 transition-colors uppercase tracking-widest"
            >
              Putuskan Koneksi
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-[10px] text-green-400/70 leading-tight">Hubungkan untuk menyimpan data ke folder Drive.</p>
          <button 
            onClick={handleConnect}
            className="w-full py-1.5 bg-green-600 hover:bg-green-500 text-white text-[10px] font-bold rounded-lg transition-all shadow-sm"
          >
            HUBUNGKAN DRIVE
          </button>
        </div>
      )}
    </div>
  );
};

export default GoogleDriveStatus;
