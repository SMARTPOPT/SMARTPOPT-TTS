
import React, { useState, useEffect } from 'react';
import { UserRole } from '../types';

interface Material {
  id: string;
  title: string;
  type: 'Modul' | 'Video' | 'Infografis';
  date: string;
  author: string;
  url?: string;
}

interface PenyuluhanProps {
  userRole: UserRole | null;
}

const Penyuluhan: React.FC<PenyuluhanProps> = ({ userRole }) => {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newMaterial, setNewMaterial] = useState<Partial<Material>>({
    title: '',
    type: 'Modul',
    author: '',
    url: ''
  });

  const defaultMaterials: Material[] = [
    { id: '1', title: 'Pengendalian OPT Ramah Lingkungan', type: 'Modul', date: '12 Jan 2026', author: 'Dr. Ir. Suharyanto', url: '#' },
    { id: '2', title: 'Budidaya Cabai Sehat Tanpa Pestisida', type: 'Video', date: '05 Jan 2026', author: 'Tim POPT Jabar', url: '#' },
    { id: '3', title: 'Teknik Sanitasi Lahan Musim Hujan', type: 'Infografis', date: '28 Des 2025', author: 'Kementan RI', url: '#' },
    { id: '4', title: 'Manajemen Musuh Alami di Sawah', type: 'Modul', date: '15 Des 2025', author: 'Balai Proteksi Tanaman', url: '#' },
  ];

  useEffect(() => {
    const savedMaterials = localStorage.getItem('popt_materials');
    if (savedMaterials) {
      setMaterials(JSON.parse(savedMaterials));
    } else {
      setMaterials(defaultMaterials);
    }
  }, []);

  const handleAddMaterial = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      const updatedMaterials = materials.map(m => 
        m.id === editingId ? { ...m, ...newMaterial as Material } : m
      );
      setMaterials(updatedMaterials);
      localStorage.setItem('popt_materials', JSON.stringify(updatedMaterials));
    } else {
      const materialToAdd: Material = {
        ...newMaterial as Material,
        id: Date.now().toString(),
        date: new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
      };
      const updatedMaterials = [materialToAdd, ...materials];
      setMaterials(updatedMaterials);
      localStorage.setItem('popt_materials', JSON.stringify(updatedMaterials));
    }
    setShowAddModal(false);
    setEditingId(null);
    setNewMaterial({ title: '', type: 'Modul', author: '', url: '' });
  };

  const handleEditMaterial = (material: Material) => {
    setNewMaterial(material);
    setEditingId(material.id);
    setShowAddModal(true);
  };

  const handleDeleteMaterial = (id: string) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus materi ini?')) {
      const updatedMaterials = materials.filter(m => m.id !== id);
      setMaterials(updatedMaterials);
      localStorage.setItem('popt_materials', JSON.stringify(updatedMaterials));
    }
  };

  const handleOpenLink = (url?: string) => {
    if (url && url !== '#') {
      window.open(url, '_blank');
    } else {
      alert('Tautan tidak tersedia atau masih dalam pengembangan.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-green-600 to-green-500 p-8 rounded-2xl text-white shadow-lg flex justify-between items-center">
        <div>
          <h3 className="text-2xl font-bold">Materi Penyuluhan Pertanian</h3>
          <p className="text-green-100 mt-2 opacity-90 max-w-xl">
            Akses modul, video tutorial, dan panduan praktis untuk meningkatkan kualitas budidaya dan pengendalian hama secara berkelanjutan.
          </p>
        </div>
        {userRole === 'Admin' && (
          <button 
            onClick={() => {
              setEditingId(null);
              setNewMaterial({ title: '', type: 'Modul', author: '', url: '' });
              setShowAddModal(true);
            }}
            className="px-6 py-3 bg-white text-green-700 font-bold rounded-xl hover:bg-green-50 transition-all shadow-xl flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Tambah Materi
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4">
        {materials.map((item) => (
          <div 
            key={item.id} 
            onClick={() => handleOpenLink(item.url)}
            className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between hover:border-green-300 transition-colors cursor-pointer group relative"
          >
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 rounded-lg bg-green-50 flex items-center justify-center text-green-600 group-hover:bg-green-100 transition-colors">
                {item.type === 'Modul' && (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                )}
                {item.type === 'Video' && (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
                {item.type === 'Infografis' && (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                )}
              </div>
              <div>
                <h4 className="font-bold text-slate-800 group-hover:text-green-700 transition-colors">{item.title}</h4>
                <div className="flex items-center space-x-3 mt-1 text-xs text-slate-500">
                  <span>{item.author}</span>
                  <span>•</span>
                  <span>{item.date}</span>
                </div>
              </div>
            </div>
            
            <div className="mt-4 md:mt-0 flex items-center">
              <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-bold mr-4">{item.type}</span>
              <button 
                className="text-green-600 font-bold text-sm hover:underline mr-4"
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenLink(item.url);
                }}
              >
                {item.type === 'Video' ? 'Tonton' : 'Buka'}
              </button>
              {userRole === 'Admin' && (
                <div className="flex space-x-2">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditMaterial(item);
                    }}
                    className="p-2 text-amber-500 hover:bg-amber-50 rounded-lg transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteMaterial(item.id);
                    }}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-6 border-b flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-800">{editingId ? 'Edit Materi Penyuluhan' : 'Tambah Materi Penyuluhan'}</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleAddMaterial} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Judul Materi</label>
                <input 
                  required
                  type="text" 
                  value={newMaterial.title}
                  onChange={(e) => setNewMaterial({...newMaterial, title: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
                  placeholder="Contoh: Teknik Budidaya Jagung Hibrida"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Tipe Materi</label>
                  <select 
                    value={newMaterial.type}
                    onChange={(e) => setNewMaterial({...newMaterial, type: e.target.value as any})}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
                  >
                    <option value="Modul">Modul (PDF/Doc)</option>
                    <option value="Video">Video</option>
                    <option value="Infografis">Infografis (Gambar)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Penulis / Sumber</label>
                  <input 
                    required
                    type="text" 
                    value={newMaterial.author}
                    onChange={(e) => setNewMaterial({...newMaterial, author: e.target.value})}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
                    placeholder="Contoh: BPP Amanuban Barat"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Tautan Sumber (Link Doc/Video/Gambar)</label>
                <input 
                  required
                  type="url" 
                  value={newMaterial.url}
                  onChange={(e) => setNewMaterial({...newMaterial, url: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
                  placeholder="https://drive.google.com/... atau https://youtube.com/..."
                />
                <p className="text-[10px] text-slate-400 mt-1 italic">*Masukkan tautan dari Google Drive, YouTube, atau penyimpanan awan lainnya.</p>
              </div>
              <div className="pt-4 flex space-x-3">
                <button 
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-colors shadow-lg shadow-green-100"
                >
                  {editingId ? 'Simpan Perubahan' : 'Simpan Materi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Penyuluhan;

