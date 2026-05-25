import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

const OptInformation = () => {
  const [pests, setPests] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isAdmin] = useState(false); 

  useEffect(() => {
    async function loadPests() {
      const { data } = await supabase.from('katalog_hama').select('*');
      if (data) setPests(data);
    }
    loadPests();
  }, []);

  // Logika Filter Pencarian
  const filteredPests = pests.filter(pest => 
    pest.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    pest.host.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-4 max-w-lg mx-auto bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-extrabold mb-6 text-center text-gray-800">Katalog Hama</h1>

      {/* Input Pencarian */}
      <input 
        type="text"
        placeholder="Cari nama hama atau inang..."
        className="w-full p-3 mb-6 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 outline-none"
        onChange={(e) => setSearchQuery(e.target.value)}
      />

      {/* Tombol Tambah (Admin Only) */}
      {isAdmin && (
        <button onClick={() => setShowAddModal(true)} className="w-full bg-green-600 text-white py-2 rounded-lg mb-6 font-semibold shadow">
          + Tambah Hama Baru
        </button>
      )}

      {/* Daftar Katalog */}
      <div className="space-y-4">
        {filteredPests.map((pest) => (
          <div key={pest.id} className="border-0 rounded-2xl p-0 bg-white shadow-md overflow-hidden transition-all">
            {/* Tampilan Visual Awal */}
            {pest.imageUrl && (
              <img src={pest.imageUrl} alt={pest.name} className="w-full h-48 object-cover" />
            )}
            <div className="p-4">
              <h2 className="font-bold text-xl text-gray-900">{pest.name}</h2>
              <p className="text-sm text-gray-600 mb-4">Inang: <span className="font-medium text-blue-600">{pest.host}</span></p>
              
              <button 
                onClick={() => setExpandedId(expandedId === pest.id ? null : pest.id)}
                className="w-full py-2 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition"
              >
                {expandedId === pest.id ? 'Tutup Detail' : 'Lihat Selengkapnya'}
              </button>

              {/* Info Detail */}
              {expandedId === pest.id && (
                <div className="mt-4 pt-4 border-t border-gray-100 space-y-3 animate-in fade-in duration-300">
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase">Gejala</p>
                    <p className="text-sm text-gray-700">{pest.symptoms}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase">Pengendalian</p>
                    <p className="text-sm text-gray-700">{pest.control}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OptInformation;
