
import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../types';

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    fullName: '',
    role: 'Petugas POPT' as UserRole,
    bppName: ''
  });

  const [visitorLogs, setVisitorLogs] = useState<{ date: string; count: number }[]>([]);
  const [visitorTotal, setVisitorTotal] = useState<number>(0);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);

  useEffect(() => {
    const storedUsers = JSON.parse(localStorage.getItem('popt_users') || '[]');
    setUsers(storedUsers);

    const fetchLogs = async () => {
      setIsLoadingLogs(true);
      try {
        const res = await fetch('/api/visitor/daily-reports');
        if (res.ok) {
          const data = await res.json();
          if (data && Array.isArray(data.logs)) {
            setVisitorLogs(data.logs);
            setVisitorTotal(data.total);
          }
        }
      } catch (err) {
        console.error('Failed to fetch visitor logs:', err);
      } finally {
        setIsLoadingLogs(false);
      }
    };
    fetchLogs();
  }, []);

  const formatIndoDate = (dateStr: string) => {
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        return d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
      }
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    } catch (e) {
      return dateStr;
    }
  };

  const saveUsers = (updated: User[]) => {
    localStorage.setItem('popt_users', JSON.stringify(updated));
    setUsers(updated);
  };

  const resetForm = () => {
    setIsAdding(false);
    setEditingId(null);
    setFormData({ username: '', password: '', fullName: '', role: 'Petugas POPT', bppName: '' });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.username || !formData.password || !formData.fullName) return;

    if (editingId) {
      const updated = users.map(u => 
        u.id === editingId ? { ...u, ...formData } : u
      );
      saveUsers(updated);
    } else {
      const userToAdd: User = {
        id: Date.now().toString(),
        ...formData,
        createdAt: new Date().toLocaleDateString('id-ID')
      };
      saveUsers([...users, userToAdd]);
    }
    resetForm();
  };

  const handleEdit = (user: User) => {
    setEditingId(user.id);
    setFormData({
      username: user.username,
      password: user.password,
      fullName: user.fullName,
      role: user.role,
      bppName: user.bppName || ''
    });
    setIsAdding(true);
  };

  const deleteUser = (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus user ini?')) {
      const updatedUsers = users.filter(u => u.id !== id);
      saveUsers(updatedUsers);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-bold text-slate-800">Manajemen Pengguna</h3>
          <p className="text-sm text-slate-500">Kelola akses petugas ke sistem SMART POPT Digital</p>
        </div>
        <button 
          onClick={() => { resetForm(); setIsAdding(true); }}
          className="bg-green-600 hover:bg-green-700 text-white text-sm font-bold px-4 py-2 rounded-lg transition-colors flex items-center shadow-md shadow-green-100"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
          Tambah User Baru
        </button>
      </div>

      {isAdding && (
        <div className="bg-white p-6 rounded-2xl border border-green-100 shadow-xl animate-in slide-in-from-top-4 duration-300">
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-bold text-slate-800">{editingId ? 'Edit Data User' : 'Form Tambah User'}</h4>
            <button onClick={resetForm} className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-50 rounded-full">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Nama Lengkap</label>
              <input 
                required
                type="text" 
                placeholder="Pither Kristian Penikay, S.Si..."
                value={formData.fullName}
                onChange={e => setFormData({...formData, fullName: e.target.value})}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Username</label>
              <input 
                required
                type="text" 
                placeholder="username123"
                value={formData.username}
                onChange={e => setFormData({...formData, username: e.target.value})}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Password</label>
              <input 
                required
                type="password" 
                placeholder="••••••••"
                value={formData.password}
                onChange={e => setFormData({...formData, password: e.target.value})}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Role</label>
              <select 
                value={formData.role}
                onChange={e => setFormData({...formData, role: e.target.value as UserRole})}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500 text-sm"
              >
                <option value="Petugas POPT">Petugas POPT</option>
                <option value="Penyuluh">Penyuluh</option>
                <option value="Kepala BPP">Kepala BPP</option>
                <option value="Admin">Admin</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Nama BPP / Wilayah</label>
              <input 
                type="text" 
                placeholder="POPT BPP Nulle / NULE..."
                value={formData.bppName}
                onChange={e => setFormData({...formData, bppName: e.target.value})}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500 text-sm"
              />
            </div>
            <div className="md:col-span-2 flex justify-end space-x-3 mt-2">
              <button 
                type="button"
                onClick={resetForm}
                className="px-4 py-2 text-sm text-slate-500 font-bold hover:bg-slate-50 rounded-lg"
              >
                Batal
              </button>
              <button 
                type="submit"
                className="px-6 py-2 bg-green-600 text-white text-sm font-bold rounded-lg hover:bg-green-700 transition-colors"
              >
                {editingId ? 'Simpan Perubahan' : 'Simpan User'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-slate-400 text-xs font-bold uppercase tracking-wider border-b border-slate-100">
                <th className="px-6 py-4">Nama User</th>
                <th className="px-6 py-4">Username</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Terdaftar</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.length > 0 ? (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold mr-3 text-xs">
                          {u.fullName[0].toUpperCase()}
                        </div>
                        <span className="font-medium text-slate-700">{u.fullName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">{u.username}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                        u.role === 'Admin' ? 'bg-amber-50 text-amber-600' : 
                        u.role === 'Kepala BPP' ? 'bg-blue-50 text-blue-600' :
                        u.role === 'Penyuluh' ? 'bg-purple-50 text-purple-600' :
                        'bg-green-50 text-green-600'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">{u.createdAt}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end space-x-2">
                        <button 
                          onClick={() => handleEdit(u)}
                          className="text-amber-500 hover:text-amber-700 p-1.5 rounded-lg hover:bg-amber-50 transition-colors"
                          title="Edit User"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                        <button 
                          onClick={() => deleteUser(u.id)}
                          disabled={u.username === 'admin'}
                          className={`text-slate-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-colors ${u.username === 'admin' ? 'opacity-0' : ''}`}
                          title="Hapus User"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic">
                    Belum ada user tambahan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Rincian Kunjungan Pengunjung Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden p-6 mt-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 pb-4 border-b border-slate-100 space-y-2 sm:space-y-0">
          <div>
            <h4 className="font-bold text-slate-800 text-lg flex items-center">
              <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              Rincian Kunjungan Pengunjung Harian
            </h4>
            <p className="text-xs text-slate-400 mt-1 uppercase font-bold tracking-wider">Statistik kunjungan pada platform SMART POPT</p>
          </div>
          <div className="text-left sm:text-right shrink-0">
            <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block">Total Pengunjung</span>
            <span className="text-2xl font-black text-green-700">{visitorTotal.toLocaleString('id-ID')} <span className="text-xs font-semibold text-slate-500">Orang</span></span>
          </div>
        </div>

        {isLoadingLogs ? (
          <div className="py-8 text-center text-slate-500 font-medium text-sm animate-pulse">
            Memuat rincian kunjungan...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-slate-100 rounded-xl overflow-hidden shadow-sm">
              <div className="bg-slate-50 px-4 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">
                Laporan Kunjungan Harian
              </div>
              <div className="divide-y divide-slate-100 max-h-[300px] overflow-y-auto scrollbar-thin">
                {visitorLogs.map((log, index) => {
                  const maxCount = Math.max(...visitorLogs.map(l => l.count), 1);
                  const percentage = (log.count / maxCount) * 100;
                  return (
                    <div key={log.date || index} className="px-4 py-3 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                      <div className="flex-1 mr-4">
                        <p className="text-sm font-bold text-slate-700">{formatIndoDate(log.date)}</p>
                        <div className="w-full bg-slate-100 h-1.5 rounded-full mt-1.5 overflow-hidden">
                          <div 
                            className="bg-green-600 h-full rounded-full transition-all duration-500" 
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="px-2.5 py-1 bg-green-50 text-green-700 rounded-lg text-xs font-black">
                          {log.count} Kunjungan
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-slate-50/60 p-5 rounded-xl border border-slate-100 flex flex-col justify-between">
              <div>
                <h5 className="font-bold text-slate-700 text-sm mb-2.5">Analisis Kunjungan</h5>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Sistem melacak setiap sesi browser baru dan memperbarui hitungan secara real-time. Jika Anda ingin menyinkronkan data dengan database Supabase, Anda dapat mengaktifkannya di dasbor.
                </p>
                <div className="mt-4 p-3 bg-white rounded-lg border border-slate-100 grid grid-cols-2 gap-2 text-center">
                  <div>
                    <span className="text-[9px] text-slate-400 uppercase font-black tracking-widest">Rata-rata/Hari</span>
                    <span className="block text-base font-black text-slate-700 mt-1">
                      {visitorLogs.length ? Math.round(visitorTotal / visitorLogs.length) : 0} <span className="text-[10px] font-normal text-slate-500">Kunjungan</span>
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 uppercase font-black tracking-widest">Hari Tertinggi</span>
                    <span className="block text-base font-black text-green-700 mt-1">
                      {visitorLogs.length ? Math.max(...visitorLogs.map(l => l.count)) : 0} <span className="text-[10px] font-normal text-slate-500">Kunjungan</span>
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center space-x-2 text-slate-400">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">Real-time Tracker Aktif</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserManagement;
