import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const OptInformation = () => {
  const [pests, setPests] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState(''); // State untuk kata kunci pencarian

  useEffect(() => {
    async function loadPests() {
      const { data, error } = await supabase.from('katalog_hama').select('*');
      if (error) {
        console.error("Error mengambil data:", error);
      } else if (data) {
        setPests(data);
      }
    }
    loadPests();
  }, []);

  // Logika Filter: Mencari berdasarkan nama hama atau inang
  const filteredPests = pests.filter((pest) =>
    pest.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pest.host.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 max-w-lg mx-auto bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-extrabold mb-6 text-center text-gray-800">Katalog Hama</h1>
      
      {/* Kolom Pencarian */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Cari hama atau inang..."
          className="w-full p-4 rounded-full border border-slate-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="space-y-4">
        {filteredPests.length > 0 ? (
          filteredPests.map((pest) => (
            <div key={pest.id} className="p-6 bg-white rounded-3xl shadow-sm border border-slate-100">
              <h2 className="text-xl font-black text-slate-900">{pest.name}</h2>
              <p className="text-sm text-slate-500 mb-2">Inang: {pest.host}</p>
              <p className="text-sm text-slate-700 mb-2"><strong>Gejala:</strong> {pest.symptoms}</p>
              <p className="text-sm text-slate-700"><strong>Pengendalian:</strong> {pest.control}</p>
              
              {pest.imageUrl && (
                <img 
                  src={pest.imageUrl} 
                  alt={pest.name} 
                  className="mt-4 w-full h-48 object-cover rounded-2xl"
                />
              )}
            </div>
          ))
        ) : (
          <p className="text-center text-slate-400 mt-10">Data tidak ditemukan.</p>
        )}
      </div>
    </div>
  );
};

export default OptInformation;
