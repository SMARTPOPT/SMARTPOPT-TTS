import React, { useState, useEffect } from 'react';
import { PEST_DATA } from '../constants';
import { UserRole, PestInfo } from '../types';
import { Plus, Edit, Trash2, X, Info, ShieldAlert, CheckCircle2, Leaf, BookOpen, Layers, Search } from 'lucide-react'; // Tambahkan Search icon

// ... (TECHNICAL_DETAILS_MAP tetap sama seperti kode Anda)

const OptInformation: React.FC<OptInformationProps> = ({ userRole }) => {
  const [pests, setPests] = useState<PestInfo[]>([]);
  const [searchTerm, setSearchTerm] = useState(''); // State untuk pencarian
  const [selectedPest, setSelectedPest] = useState<PestInfo | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPestId, setEditingPestId] = useState<string | null>(null);
  const [newPest, setNewPest] = useState<Partial<PestInfo>>({
    name: '', host: '', symptoms: '', control: '', imageUrl: ''
  });

  useEffect(() => {
    const savedPests = localStorage.getItem('popt_pests');
    if (savedPests) {
      setPests(JSON.parse(savedPests));
    } else {
      setPests(PEST_DATA);
    }
  }, []);

  // LOGIKA PENCARIAN
  const filteredPests = pests.filter(pest => 
    pest.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    pest.host.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ... (Fungsi handleAddPest, handleEditPest, handleDeletePest tetap sama)

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="text-xl font-bold text-slate-800">Katalog Organisme Pengganggu Tumbuhan</h3>
          <p className="text-sm text-slate-500">Informasi teknis hama dan penyakit tanaman</p>
        </div>
        
        {/* INPUT PENCARIAN */}
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input 
            type="text"
            placeholder="Cari hama atau inang..."
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {userRole === 'Admin' && (
          <button 
            onClick={() => {
              setEditingPestId(null);
              setNewPest({ name: '', host: '', symptoms: '', control: '', imageUrl: '' });
              setShowAddModal(true);
            }}
            className="px-4 py-2 bg-green-600 text-white text-sm font-bold rounded-xl hover:bg-green-700 transition-colors shadow-lg flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" /> Tambah Konten
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPests.length > 0 ? (
          filteredPests.map((pest) => (
            <div key={pest.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col group relative">
              {/* Image dengan Error Handling */}
              <div className="h-48 overflow-hidden relative">
                <img 
                  src={pest.imageUrl || 'https://via.placeholder.com/600x400?text=Gambar+Tidak+Tersedia'} 
                  alt={pest.name} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/600x400?text=Gambar+Rusak' }}
                />
                <div className="absolute bottom-4 left-4">
                  <span className="bg-green-600 text-white text-xs font-bold px-2 py-1 rounded-md shadow-lg">
                    {pest.host}
                  </span>
                </div>
              </div>
              
              {/* ... sisa konten card tetap sama ... */}
            </div>
          ))
        ) : (
          <div className="col-span-full py-10 text-center text-slate-400">
            Data tidak ditemukan untuk "{searchTerm}"
          </div>
        )}
      </div>
      {/* ... sisa modal tetap sama ... */}
    </div>
  );
};
