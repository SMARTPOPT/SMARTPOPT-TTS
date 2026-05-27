
import React, { useState, useEffect } from 'react';
import { Tab, UserRole } from './types';
import Login from './components/Login';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Beranda from './components/Beranda';
import OptInformation from './components/OptInformation';
import Penyuluhan from './components/Penyuluhan';
import Archive from './components/Archive';
import Consultation from './components/Consultation';
import UserManagement from './components/UserManagement';
import FieldObservation from './components/FieldObservation';
import WeatherWidget from './components/WeatherWidget';
import ContactOfficers from './components/ContactOfficers';
import ConsultationRecords from './components/ConsultationRecords';
import KalenderTanam from './components/KalenderTanam';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [showLoginModal, setShowLoginModal] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<Tab>(Tab.BERANDA);
  const [user, setUser] = useState<string | null>(null);
  const [userFullName, setUserFullName] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [bppName, setBppName] = useState<string | null>(null);
  const [visitorCount, setVisitorCount] = useState<number | null>(null);

  // Synchronize and record page visitor analytics with thread-safe file-persistence
  useEffect(() => {
    let isMounted = true;
    
    const fetchCount = async () => {
      try {
        const res = await fetch('/api/visitor/count');
        if (res.ok) {
          const data = await res.json();
          if (data && typeof data.count === 'number' && isMounted) {
            setVisitorCount(data.count);
          }
        }
      } catch (err) {
        console.error('Failed to fetch visitor count:', err);
      }
    };

    const trackVisit = async () => {
      try {
        const hasVisited = sessionStorage.getItem('smartpopt_session_visited');
        if (!hasVisited) {
          const res = await fetch('/api/visitor/increment', { method: 'POST' });
          if (res.ok) {
            const data = await res.json();
            if (data && typeof data.count === 'number' && isMounted) {
              setVisitorCount(data.count);
              sessionStorage.setItem('smartpopt_session_visited', 'true');
              return;
            }
          }
        }
        await fetchCount();
      } catch (err) {
        console.error('Failed to increment visitor count:', err);
        await fetchCount();
      }
    };

    trackVisit();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleLogin = (username: string, fullName: string, role: UserRole, bpp?: string) => {
    setIsAuthenticated(true);
    setUser(username);
    setUserFullName(fullName);
    setUserRole(role);
    setBppName(bpp || 'NULE');
    setShowLoginModal(false);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUser(null);
    setUserFullName(null);
    setUserRole(null);
    setBppName(null);
    setActiveTab(Tab.BERANDA);
  };

  const isTabProtected = (tab: Tab) => {
    return [Tab.PENGAMATAN, Tab.ARSIP, Tab.MANAJEMEN_USER, Tab.REKAP_KONSULTASI].includes(tab);
  };

  const handleTabChange = (tab: Tab) => {
    if (isTabProtected(tab) && !isAuthenticated) {
      setShowLoginModal(true);
    } else {
      setActiveTab(tab);
    }
  };

  return (
    <div className="flex h-screen bg-[#FDFDFD] overflow-hidden selection:bg-green-100 selection:text-green-900">
      {/* Sidebar - Polished Glassmorphism Look */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={handleTabChange} 
        onLogout={handleLogout} 
        currentUser={user} 
        userRole={userRole}
        bppName={bppName}
        isAuthenticated={isAuthenticated}
        onLoginClick={() => setShowLoginModal(true)}
        visitorCount={visitorCount}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          activeTab={activeTab} 
          user={userFullName || user} 
          role={userRole} 
          bppName={bppName}
          onLogout={handleLogout}
          isAuthenticated={isAuthenticated}
          onLoginClick={() => setShowLoginModal(true)}
        />

        <main className="flex-1 overflow-y-auto px-4 md:px-10 py-10 scroll-smooth">
          <div className="max-w-[1400px] mx-auto">
            {activeTab === Tab.BERANDA && <Beranda userFullName={userFullName} bppName={bppName} onNavigate={handleTabChange} visitorCount={visitorCount} />}
            {activeTab === Tab.OPT && <OptInformation userRole={userRole} />}
            {activeTab === Tab.KALENDER_TANAM && <KalenderTanam />}
            {activeTab === Tab.PENYULUHAN && <Penyuluhan userRole={userRole} />}
            {activeTab === Tab.KONSULTASI && <Consultation onNavigate={handleTabChange} />}
            {activeTab === Tab.CUACA && <WeatherWidget />}
            {activeTab === Tab.PETUGAS && <ContactOfficers userRole={userRole} />}
            
            {/* Protected Content */}
            {isAuthenticated && (
              <>
                {activeTab === Tab.PENGAMATAN && <FieldObservation />}
                {activeTab === Tab.ARSIP && <Archive />}
                {activeTab === Tab.MANAJEMEN_USER && <UserManagement />}
                {activeTab === Tab.REKAP_KONSULTASI && <ConsultationRecords />}
              </>
            )}

            {/* Restricted Access State */}
            {!isAuthenticated && isTabProtected(activeTab) && (
              <div className="flex flex-col items-center justify-center py-32 text-center animate-in zoom-in-95 duration-500">
                <div className="w-24 h-24 bg-amber-50 rounded-3xl flex items-center justify-center text-amber-500 mb-8 border border-amber-100 shadow-inner">
                  <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h2 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">Halaman Terproteksi</h2>
                <p className="text-slate-500 max-w-lg mb-10 text-lg">Halaman ini berisi data administratif internal POPT BPP Nule. Silahkan login untuk melanjutkan akses.</p>
                <button 
                  onClick={() => setShowLoginModal(true)}
                  className="px-10 py-4 bg-green-700 text-white font-black rounded-2xl shadow-2xl shadow-green-100 hover:bg-green-800 transition-all hover:scale-105 active:scale-95"
                >
                  Masuk Portal Petugas
                </button>
              </div>
            )}
          </div>
        </main>

        <footer className="bg-white border-t py-6 text-center shrink-0">
          <p className="text-slate-400 text-sm font-medium tracking-wide">
            &copy; 2026 <span className="text-green-700 font-bold">BPP Nule</span> • Sistem Informasi SMART POPT Digital NTT
          </p>
        </footer>
      </div>

      {/* Modern Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-md animate-in fade-in duration-300">
          <div className="relative w-full max-w-md shadow-[0_32px_64px_-15px_rgba(0,0,0,0.3)] animate-in slide-in-from-bottom-8 duration-500">
            <button 
              onClick={() => setShowLoginModal(false)}
              className="absolute -top-12 right-0 text-white/80 hover:text-white transition-colors"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <Login onLogin={handleLogin} />
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
