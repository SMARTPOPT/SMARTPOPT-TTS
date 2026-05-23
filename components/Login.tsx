
import React, { useState } from 'react';
import { User, UserRole } from '../types';

interface LoginProps {
  onLogin: (username: string, fullName: string, role: UserRole, bppName?: string) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (username === 'admin' && password === '12345') {
      onLogin(username, 'Pither Keristian Penikay, S.Si', 'Admin', 'POPT BPP Nulle');
      return;
    }

    const storedUsers: User[] = JSON.parse(localStorage.getItem('popt_users') || '[]');
    const foundUser = storedUsers.find(u => u.username === username && u.password === password);

    if (foundUser) {
      onLogin(foundUser.username, foundUser.fullName, foundUser.role, foundUser.bppName);
    } else {
      setError('Kredensial tidak valid. Silahkan periksa username/password.');
    }
  };

  return (
    <div className="w-full bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
      <div className="bg-green-700 p-8 text-white text-center">
        <div className="mb-4 flex items-center justify-center">
          <img 
            src="https://lh3.googleusercontent.com/d/1AfqdJADOoZgqIWcnTTr9CqgeG-8pDxEv" 
            alt="SMART POPT Logo" 
            className="w-20 h-20 rounded-full border-4 border-white/20 shadow-lg object-contain p-0.5 bg-white"
            referrerPolicy="no-referrer"
          />
        </div>
        <h1 className="text-2xl font-black tracking-tight">SMART POPT LOGIN</h1>
        <p className="mt-1 text-green-100 text-[10px] font-medium opacity-80 uppercase tracking-widest leading-tight">Sistem Monitoring, Analisis, dan Respon Terpadu</p>
      </div>
      
      <form onSubmit={handleSubmit} className="p-8 space-y-5">
        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl text-xs font-bold border border-red-100 flex items-center animate-in slide-in-from-top-2">
            <svg className="w-4 h-4 mr-2 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        )}
        
        <div className="space-y-1.5">
          <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">Username Petugas</label>
          <input
            type="text"
            required
            autoFocus
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all text-sm font-medium"
            placeholder="Ketik username..."
          />
        </div>
        
        <div className="space-y-1.5">
          <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">Password</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all text-sm font-medium"
            placeholder="••••••••"
          />
        </div>
        
        <button
          type="submit"
          className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black py-4 rounded-xl shadow-xl shadow-slate-200 transition-all transform active:scale-[0.98] uppercase tracking-widest text-xs mt-4"
        >
          Masuk Dashboard Internal
        </button>
        
        <div className="text-center">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
            Authorized Personnel Only &bull; Versi 2.0.2
          </p>
        </div>
      </form>
    </div>
  );
};

export default Login;
