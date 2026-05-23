
import React from 'react';
import { Tab, UserRole } from '../types';
import GoogleDriveStatus from './GoogleDriveStatus';

interface SidebarProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  onLogout: () => void;
  currentUser: string | null;
  userRole: UserRole | null;
  bppName: string | null;
  isAuthenticated: boolean;
  onLoginClick: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  activeTab, 
  setActiveTab, 
  onLogout, 
  userRole, 
  bppName,
  isAuthenticated,
  onLoginClick
}) => {
  const publicItems = [
    { id: Tab.BERANDA, label: 'Beranda', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { id: Tab.OPT, label: 'Informasi OPT', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01' },
    { id: Tab.KALENDER_TANAM, label: 'Kalender Tanam SMART', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
    { id: Tab.PENYULUHAN, label: 'Penyuluhan', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
    { id: Tab.CUACA, label: 'Pantauan Cuaca', icon: 'M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z' },
    { id: Tab.PETUGAS, label: 'Hubungi Petugas', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
    { id: Tab.KONSULTASI, label: 'AI SMART POPT', icon: 'M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z' },
  ];

  const protectedItems = [
    { id: Tab.PENGAMATAN, label: 'Pengamatan Lapangan', icon: 'M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7' },
    { id: Tab.ARSIP, label: 'Arsip Laporan', icon: 'M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4' },
    { id: Tab.REKAP_KONSULTASI, label: 'Rekap Konsultasi AI', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
  ];

  if (userRole === 'Admin') {
    protectedItems.push({ id: Tab.MANAJEMEN_USER, label: 'Manajemen User', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' });
  }

  return (
    <aside className="hidden md:flex flex-col w-64 bg-green-900 text-white shadow-xl shrink-0">
      <div className="p-6 flex items-center space-x-3 border-b border-green-800/50 shadow-sm">
        <img 
          src="https://lh3.googleusercontent.com/d/1AfqdJADOoZgqIWcnTTr9CqgeG-8pDxEv" 
          alt="SMART POPT Logo" 
          className="w-12 h-12 rounded-full border border-white/30 shadow-md object-contain p-0.5 bg-white shrink-0"
          referrerPolicy="no-referrer"
        />
        <div>
          <h1 className="text-lg font-bold tracking-tight leading-none text-white">SMART POPT</h1>
          <p className="text-green-400 text-[8px] font-black uppercase tracking-wider mt-1 leading-tight">
            MONITORING, ANALISIS, & RESPON TERPADU
          </p>
        </div>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-6 overflow-y-auto">
        {/* Google Drive Status */}
        {isAuthenticated && <GoogleDriveStatus />}

        {/* Public Menu */}
        <div>
          <h2 className="px-4 text-[10px] font-bold text-green-500 uppercase tracking-widest mb-2 opacity-50">Layanan Publik</h2>
          <div className="space-y-1">
            {publicItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center px-4 py-2.5 rounded-lg transition-all ${
                  activeTab === item.id 
                    ? 'bg-green-700 text-white shadow-md' 
                    : 'hover:bg-green-800/50 text-green-100'
                }`}
              >
                <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                </svg>
                <span className="text-sm font-medium">{item.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Protected Menu */}
        <div>
          <h2 className="px-4 text-[10px] font-bold text-green-500 uppercase tracking-widest mb-2 opacity-50">Administrasi POPT</h2>
          <div className="space-y-1">
            {protectedItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center px-4 py-2.5 rounded-lg transition-all ${
                  !isAuthenticated ? 'opacity-40 grayscale pointer-events-none' : ''
                } ${
                  activeTab === item.id 
                    ? 'bg-green-700 text-white shadow-md' 
                    : 'hover:bg-green-800/50 text-green-100'
                }`}
              >
                <div className="relative">
                  <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                  </svg>
                  {!isAuthenticated && (
                    <div className="absolute -top-1 -right-1">
                      <svg className="w-2.5 h-2.5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
                <span className="text-sm font-medium">{item.label}</span>
              </button>
            ))}
          </div>
          
          {!isAuthenticated && (
            <button 
              onClick={onLoginClick}
              className="mt-4 mx-4 flex items-center justify-center space-x-2 px-4 py-2 bg-green-800 hover:bg-green-700 text-white text-xs font-bold rounded-lg border border-green-700 transition-colors"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>LOGIN PETUGAS</span>
            </button>
          )}
        </div>
      </nav>

      {isAuthenticated && (
        <div className="p-4 border-t border-green-800">
          <button
            onClick={onLogout}
            className="w-full flex items-center px-4 py-3 rounded-lg text-red-300 hover:bg-green-800 transition-colors"
          >
            <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Logout
          </button>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
