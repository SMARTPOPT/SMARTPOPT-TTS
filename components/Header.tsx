import React, { useState } from 'react';
import { Tab, UserRole } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Menu, 
  X, 
  LogIn, 
  LogOut, 
  Compass, 
  Sprout, 
  BookOpen, 
  HelpCircle, 
  Wind, 
  PhoneCall, 
  Users, 
  MapPin, 
  FolderOpen, 
  LineChart, 
  ShieldAlert,
  ChevronRight,
  UserCheck
} from 'lucide-react';

interface HeaderProps {
  activeTab: Tab;
  user: string | null;
  role: UserRole | null;
  bppName: string | null;
  onLogout: () => void;
  isAuthenticated: boolean;
  onLoginClick: () => void;
  setActiveTab?: (tab: Tab) => void;
}

const Header: React.FC<HeaderProps> = ({ 
  activeTab, 
  user, 
  role, 
  bppName, 
  onLogout, 
  isAuthenticated, 
  onLoginClick,
  setActiveTab
}) => {
  const [isOpen, setIsOpen] = useState(false);

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
      case Tab.CUACA: return 'Pantauan Cuaca';
      case Tab.PETUGAS: return 'Hubungi Petugas';
      case Tab.REKAP_KONSULTASI: return 'Rekap Konsultasi';
      default: return `SMART POPT BPP ${bppName || 'Nule'}`;
    }
  };

  const menuItems = [
    { id: Tab.BERANDA, label: 'Beranda', icon: Compass, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { id: Tab.OPT, label: 'Informasi OPT', icon: Sprout, color: 'text-amber-600', bg: 'bg-amber-50' },
    { id: Tab.KALENDER_TANAM, label: 'Kalender Tanam', icon: BookOpen, color: 'text-green-600', bg: 'bg-green-50' },
    { id: Tab.PENYULUHAN, label: 'Penyuluhan', icon: HelpCircle, color: 'text-sky-600', bg: 'bg-sky-50' },
    { id: Tab.CUACA, label: 'Pantauan Cuaca', icon: Wind, color: 'text-blue-500', bg: 'bg-blue-50' },
    { id: Tab.PETUGAS, label: 'Hubungi Petugas', icon: PhoneCall, color: 'text-teal-600', bg: 'bg-teal-50' },
    { id: Tab.KONSULTASI, label: 'AI SMART POPT', icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50' },
  ];

  const protectedItems = [
    { id: Tab.PENGAMATAN, label: 'Pengamatan Lapangan', icon: MapPin, color: 'text-rose-600', bg: 'bg-rose-50' },
    { id: Tab.ARSIP, label: 'Arsip Laporan', icon: FolderOpen, color: 'text-violet-600', bg: 'bg-violet-50' },
    { id: Tab.REKAP_KONSULTASI, label: 'Rekap Konsultasi', icon: LineChart, color: 'text-fuchsia-600', bg: 'bg-fuchsia-50' },
  ];

  if (role === 'Admin') {
    protectedItems.push({ id: Tab.MANAJEMEN_USER, label: 'Manajemen User', icon: UserCheck, color: 'text-slate-600', bg: 'bg-slate-50' });
  }

  const handleMobileNav = (tabId: Tab) => {
    if (setActiveTab) {
      setActiveTab(tabId);
    }
    setIsOpen(false);
  };

  return (
    <header className="bg-white border-b px-4 md:px-8 py-4 flex items-center justify-between sticky top-0 z-30 shadow-sm shrink-0">
      <div className="flex items-center">
        {/* Mobile Hamburger Button */}
        <button 
          onClick={() => setIsOpen(true)}
          className="md:hidden p-2 -ml-2 text-slate-500 hover:text-green-700 hover:bg-slate-50 rounded-xl transition-all mr-2"
          id="mobile-menu-hamburger-btn"
        >
          <Menu size={24} />
        </button>

        <img 
          src="https://lh3.googleusercontent.com/d/1AfqdJADOoZgqIWcnTTr9CqgeG-8pDxEv" 
          alt="SMART POPT Mobile Logo" 
          className="md:hidden w-10 h-10 rounded-full border border-green-100 shadow-sm mr-3 object-contain p-0.5 bg-white"
          referrerPolicy="no-referrer"
        />
        <div>
          <h2 className="text-base md:text-xl font-bold text-slate-800 tracking-tight">{getTitle()}</h2>
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
          <div className="flex items-center space-x-3">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-sm font-bold text-slate-700 capitalize">{user}</span>
              <span className="text-[10px] text-green-600 font-black uppercase tracking-tighter">
                {bppName ? `${bppName} OFFICIAL` : 'BPP NULE OFFICIAL'}
              </span>
            </div>
            <div className="h-10 w-10 rounded-xl bg-green-100 border border-green-200 flex items-center justify-center text-green-700 font-black shadow-inner">
              {user?.[0].toUpperCase()}
            </div>
          </div>
        ) : (
          <button 
            onClick={onLoginClick}
            className="flex items-center space-x-2 px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 text-sm font-bold rounded-xl border border-slate-200 transition-all active:scale-95"
          >
            <LogIn size={16} className="text-green-600" />
            <span className="hidden sm:inline">Portal Petugas</span>
            <span className="sm:hidden">Login</span>
          </button>
        )}
      </div>

      {/* Slide-out Mobile Navigation Drawer */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Dark Backdrop Overlay */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm md:hidden"
            />

            {/* Slide-out Drawer Box */}
            <motion.div 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 bottom-0 left-0 w-[85%] max-w-sm z-50 bg-white shadow-2xl flex flex-col md:hidden overflow-hidden"
              id="mobile-drawer-container"
            >
              {/* Drawer Header */}
              <div className="p-5 border-b border-slate-100 bg-green-900 text-white flex justify-between items-center">
                <div className="flex items-center space-x-3">
                  <img 
                    src="https://lh3.googleusercontent.com/d/1AfqdJADOoZgqIWcnTTr9CqgeG-8pDxEv" 
                    alt="SMART POPT Mobile Logo" 
                    className="w-10 h-10 rounded-full border border-white/20 p-0.5 bg-white object-contain"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <h3 className="text-sm font-bold tracking-tight">SMART POPT</h3>
                    <p className="text-[9px] text-green-300 font-bold uppercase tracking-wider">NTT DIGITAL LEARNING</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 hover:bg-white/10 rounded-full transition-all text-white/80 hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Drawer Playfield */}
              <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
                <div>
                  <h4 className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Layanan Publik</h4>
                  <div className="space-y-1">
                    {menuItems.map((item) => {
                      const IconComponent = item.icon;
                      const isActive = activeTab === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => handleMobileNav(item.id)}
                          className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${
                            isActive 
                              ? 'bg-green-50 text-green-700 font-bold' 
                              : 'hover:bg-slate-50 text-slate-600 font-medium'
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <div className={`p-2 rounded-lg ${isActive ? 'bg-green-100 text-green-700' : `${item.bg} ${item.color}`}`}>
                              <IconComponent size={16} />
                            </div>
                            <span className="text-sm">{item.label}</span>
                          </div>
                          <ChevronRight size={14} className={isActive ? 'text-green-600' : 'text-slate-300'} />
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Protected Administration Sector */}
                <div>
                  <h4 className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Administrasian Internal</h4>
                  <div className="space-y-1">
                    {protectedItems.map((item) => {
                      const IconComponent = item.icon;
                      const isActive = activeTab === item.id;
                      return (
                        <button
                          key={item.id}
                          disabled={!isAuthenticated}
                          onClick={() => handleMobileNav(item.id)}
                          className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${
                            !isAuthenticated ? 'opacity-50' : ''
                          } ${
                            isActive 
                              ? 'bg-green-50 text-green-700 font-bold' 
                              : 'hover:bg-slate-50 text-slate-600 font-medium'
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <div className={`p-2 rounded-lg ${isActive ? 'bg-green-100 text-green-700' : `${item.bg} ${item.color}`}`}>
                              <IconComponent size={16} />
                            </div>
                            <span className="text-sm">{item.label}</span>
                          </div>
                          {!isAuthenticated ? (
                            <ShieldAlert size={14} className="text-slate-300" />
                          ) : (
                            <ChevronRight size={14} className={isActive ? 'text-green-600' : 'text-slate-300'} />
                          )}
                        </button>
                      );
                    })}
                  </div>
                  
                  {!isAuthenticated && (
                    <div className="px-3 mt-4">
                      <button
                        onClick={() => {
                          setIsOpen(false);
                          onLoginClick();
                        }}
                        className="w-full py-2.5 bg-green-700 hover:bg-green-800 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all text-center flex items-center justify-center space-x-2 shadow-md shadow-green-100"
                      >
                        <LogIn size={14} />
                        <span>Masuk Portal Petugas</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Drawer Footer Account Section */}
              {isAuthenticated && (
                <div className="p-5 border-t border-slate-100 bg-slate-50 flex items-center justify-between shrink-0">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 rounded-xl bg-green-700 text-white flex items-center justify-center font-bold">
                      {user?.[0].toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-700 leading-tight">{user}</h4>
                      <p className="text-[10px] text-green-600 font-black uppercase tracking-tight">{role}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      setIsOpen(false);
                      onLogout();
                    }}
                    className="p-2 border border-red-200 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                    title="Log Out"
                  >
                    <LogOut size={16} />
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;
