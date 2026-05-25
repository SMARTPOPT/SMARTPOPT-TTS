import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

const OptInformation = () => {
  const [pests, setPests] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [currentSlides, setCurrentSlides] = useState<Record<number, number>>({});

  useEffect(() => {
    async function loadPests() {
      const { data } = await supabase.from('katalog_hama').select('*');
      if (data) setPests(data);
    }
    loadPests();
  }, []);

  const filteredPests = pests.filter(p => 
    (p.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
     p.host?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="p-4 max-w-lg mx-auto bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-extrabold mb-6 text-center text-gray-800">Katalog Hama</h1>
      <input 
        type="text" 
        placeholder="🔍 Cari nama hama atau inang..." 
        className="w-full p-4 mb-6 border border-gray-200 rounded-2xl shadow-sm outline-none" 
        onChange={(e) => setSearchQuery(e.target.value)} 
      />
      <div className="space-y-6">
        {filteredPests.map((pest) => {
          const images = [pest.imageUrl, pest.imageUrl2, pest.imageUrl3].filter(url => url);
          const currentSlide = currentSlides[pest.id] || 0;
          return (
            <div key={pest.id} className="rounded-3xl bg-white shadow-sm border border-gray-100 overflow-hidden">
              {images.length > 0 ? (
                <div className="relative w-full h-64 overflow-hidden bg-gray-100">
                  {images.map((url, i) => (
                    <img key={i} src={url} alt={pest.name} className={`absolute w-full h-full object-cover transition-opacity duration-500 ${currentSlide === i ? 'opacity-100' : 'opacity-0'}`} />
                  ))}
                </div>
              ) : <div className="w-full h-40 bg-gray-100 flex items-center justify-center text-gray-400">Tidak ada foto</div>}
              <div className="p-6">
                <h2 className="font-black text-2xl text-gray-900">{pest.name}</h2>
                <p className="text-sm text-gray-500 mb-4">Inang: {pest.host}</p>
                <button onClick={() => setExpandedId(expandedId === pest.id ? null : pest.id)} className="w-full py-3 bg-slate-900 text-white rounded-2xl font-bold">
                  {expandedId === pest.id ? 'Tutup Detail' : 'Lihat Detail'}
                </button>
                {expandedId === pest.id && (
                  <div className="mt-6 pt-6 border-t space-y-4">
                    <p className="text-sm text-gray-600"><strong>Gejala:</strong> {pest.symptoms}</p>
                    <p className="text-sm text-gray-600"><strong>Pengendalian:</strong> {pest.control}</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default OptInformation;
