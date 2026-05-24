
import React from 'react';
import { Tab, UserRole } from '../types';

interface HeaderProps {
  activeTab: Tab;
  user: string | null;
  role: UserRole | null;
  bppName: string | null;
  onLogout: () => void;
  isAuthenticated: boolean;
  onLoginClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ activeTab, user, role, bppName, isAuthenticated, onLoginClick }) => {
  const getTitle = () => {
    switch (activeTab) {
      case Tab.BERANDA: return 'Beranda Dashboard';
      case Tab.OPT: return 'Katalog OPT & Hama';
      case Tab.KALENDER_TANAM: return 'Kalender Tanam SMART';
      case Tab.PENYULUHAN: return 'Program Penyuluhan';
      case Tab.ARSIP: return 'Arsip Laporan Digital';
      case Tab.KONSULTASI: return 'AI SMART POPT';
      case Tab.MANAJEMEN_USER: return 'Manajemen User';
      case Tab.PENGAMATAN: return 'Pengamatan Lapangan';
      default: return `SMART POPT BPP ${bppName || 'Nule'}`;
    }
  };

  return (
    <header className="bg-white border-b px-4 md:px-8 py-4 flex items-center justify-between sticky top-0 z-20 shadow-sm shrink-0">
      <div className="flex items-center">
        <img 
          src="https://lh3.googleusercontent.com/d/1AfqdJADOoZgqIWcnTTr9CqgeG-8pDxEv" 
          alt="SMART POPT Mobile Logo" 
          className="md:hidden w-10 h-10 rounded-full border border-green-150 shadow-sm mr-3 object-contain p-0.5 bg-white"
          referrerPolicy="no-referrer"
        />
        <div>
          <h2 className="text-lg md:text-xl font-bold text-slate-800">{getTitle()}</h2>
          <div className="flex items-center space-x-2 mt-0.5">
            <span className={`w-2 h-2 rounded-full ${isAuthenticated ? 'bg-green-500' : 'bg-slate-300'}`}></span>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
              {isAuthenticated ? `${role} Terautentikasi` : 'Mode Publik / Tamu'}
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        {isAuthenticated ? (
          <>
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-sm font-bold text-slate-700 capitalize">{user}</span>
              <span className="text-[10px] text-green-600 font-black uppercase tracking-tighter">
                {bppName ? `${bppName} OFFICIAL` : 'BPP NULE OFFICIAL'}
              </span>
            </div>
            <div className="h-10 w-10 rounded-xl bg-green-100 border border-green-200 flex items-center justify-center text-green-700 font-black shadow-inner">
              {user?.[0].toUpperCase()}
            </div>
          </>
        ) : (
          <button 
            onClick={onLoginClick}
            className="flex items-center space-x-2 px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 text-sm font-bold rounded-xl border border-slate-200 transition-all active:scale-95"
          >
            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span className="hidden sm:inline">Portal Petugas</span>
            <span className="sm:hidden">Login</span>
          </button>
        )}
      </div>
    </header>
  );
};

export default Header;
