
import React, { useState, useEffect } from 'react';
import { PEST_DATA } from '../constants';
import { UserRole, PestInfo } from '../types';

interface OptInformationProps {
  userRole: UserRole | null;
}

const OptInformation: React.FC<OptInformationProps> = ({ userRole }) => {
  const [pests, setPests] = useState<PestInfo[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPestId, setEditingPestId] = useState<string | null>(null);
  const [newPest, setNewPest] = useState<Partial<PestInfo>>({
    name: '',
    host: '',
    symptoms: '',
    control: '',
    imageUrl: ''
  });

  useEffect(() => {
    const savedPests = localStorage.getItem('popt_pests');
    if (savedPests) {
      setPests(JSON.parse(savedPests));
    } else {
      setPests(PEST_DATA);
    }
  }, []);

  const handleAddPest = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingPestId) {
      const updatedPests = pests.map(p => 
        p.id === editingPestId ? { ...p, ...newPest as PestInfo } : p
      );
      setPests(updatedPests);
      localStorage.setItem('popt_pests', JSON.stringify(updatedPests));
    } else {
      const pestToAdd: PestInfo = {
        ...newPest as PestInfo,
        id: Date.now().toString()
      };
      const updatedPests = [...pests, pestToAdd];
      setPests(updatedPests);
      localStorage.setItem('popt_pests', JSON.stringify(updatedPests));
    }
    setShowAddModal(false);
    setEditingPestId(null);
    setNewPest({ name: '', host: '', symptoms: '', control: '', imageUrl: '' });
  };

  const handleEditPest = (pest: PestInfo) => {
    setNewPest(pest);
    setEditingPestId(pest.id);
    setShowAddModal(true);
  };

  const handleDeletePest = (id: string) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus informasi ini?')) {
      const updatedPests = pests.filter(p => p.id !== id);
      setPests(updatedPests);
      localStorage.setItem('popt_pests', JSON.stringify(updatedPests));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-bold text-slate-800">Katalog Organisme Pengganggu Tumbuhan</h3>
          <p className="text-sm text-slate-500">Informasi teknis hama dan penyakit tanaman</p>
        </div>
        <div className="flex items-center space-x-4">
          <span className="bg-slate-100 px-3 py-1 rounded-full text-xs font-semibold text-slate-500">
            Total: {pests.length} Hama/Penyakit
          </span>
          {userRole === 'Admin' && (
            <button 
              onClick={() => {
                setEditingPestId(null);
                setNewPest({ name: '', host: '', symptoms: '', control: '', imageUrl: '' });
                setShowAddModal(true);
              }}
              className="px-4 py-2 bg-green-600 text-white text-sm font-bold rounded-xl hover:bg-green-700 transition-colors shadow-lg shadow-green-100 flex items-center"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Tambah Konten
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {pests.map((pest) => (
          <div key={pest.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col group relative">
            {userRole === 'Admin' && (
              <div className="absolute top-2 right-2 z-10 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => handleEditPest(pest)}
                  className="p-2 bg-amber-50 text-amber-600 rounded-lg hover:bg-amber-100"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
                <button 
                  onClick={() => handleDeletePest(pest.id)}
                  className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            )}
            <div className="h-48 overflow-hidden relative">
              <img 
                src={pest.imageUrl || 'https://picsum.photos/seed/placeholder/600/400'} 
                alt={pest.name} 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute bottom-4 left-4">
                <span className="bg-green-600 text-white text-xs font-bold px-2 py-1 rounded-md shadow-lg">
                  {pest.host}
                </span>
              </div>
            </div>
            <div className="p-6 flex-1 flex flex-col">
              <h4 className="text-lg font-bold text-slate-800 mb-2">{pest.name}</h4>
              
              <div className="space-y-3 mt-2 flex-1">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Gejala Utama</p>
                  <p className="text-sm text-slate-600 mt-1">{pest.symptoms}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Metode Pengendalian</p>
                  <p className="text-sm text-slate-600 mt-1">{pest.control}</p>
                </div>
              </div>

              <button className="mt-6 w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 text-sm font-semibold rounded-lg transition-colors flex items-center justify-center">
                Lihat Detail Teknis
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-6 border-b flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-800">Tambah Informasi OPT</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleAddPest} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Nama Hama/Penyakit</label>
                <input 
                  required
                  type="text" 
                  value={newPest.name}
                  onChange={(e) => setNewPest({...newPest, name: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
                  placeholder="Contoh: Wereng Batang Coklat"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Tanaman Inang</label>
                <input 
                  required
                  type="text" 
                  value={newPest.host}
                  onChange={(e) => setNewPest({...newPest, host: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
                  placeholder="Contoh: Padi"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Gejala Utama</label>
                <textarea 
                  required
                  value={newPest.symptoms}
                  onChange={(e) => setNewPest({...newPest, symptoms: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none h-24 resize-none"
                  placeholder="Deskripsikan gejala yang terlihat..."
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Metode Pengendalian</label>
                <textarea 
                  required
                  value={newPest.control}
                  onChange={(e) => setNewPest({...newPest, control: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none h-24 resize-none"
                  placeholder="Langkah-langkah pengendalian..."
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">URL Gambar (Opsional)</label>
                <input 
                  type="text" 
                  value={newPest.imageUrl}
                  onChange={(e) => setNewPest({...newPest, imageUrl: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
                  placeholder="https://example.com/image.jpg"
                />
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
                  Simpan Informasi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OptInformation;

