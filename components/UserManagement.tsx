
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

  useEffect(() => {
    const storedUsers = JSON.parse(localStorage.getItem('popt_users') || '[]');
    setUsers(storedUsers);
  }, []);

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
                placeholder="Pither Keristian Penikay, S.Si..."
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
    </div>
  );
};

export default UserManagement;
