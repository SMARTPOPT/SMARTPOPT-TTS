import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

const OptInformation = () => {
  const [pests, setPests] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [currentSlides, setCurrentSlides] = useState<Record<number, number>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadPests() {
      setIsLoading(true);
      // Menggunakan .select() biasa. Jika data tidak muncul, 
      // pastikan RLS Policy di dashboard Supabase sudah Public (SELECT = TRUE)
      const { data, error } = await supabase.from('katalog_hama').select('*');
      if (error) console.error("Error:", error);
      else if (data) setPests(data);
      setIsLoading(false);
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

      {/* Input Pencarian */}
      <div className="sticky top-0 z-10 bg-gray-50 py-2">
        <input 
          type="text" 
          placeholder="🔍 Cari nama hama atau inang..." 
          className="w-full p-4 border border-gray-200 rounded-2xl shadow-sm outline-none focus:ring-2 focus:ring-green-500" 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)} 
        />
      </div>

      {isLoading ? (
        <div className="text-center mt-10 text-gray-400">Memuat data...</div>
      ) : (
        <div className="space-y-6 mt-4">
          {filteredPests.map((pest) => {
            const images = [pest.imageUrl, pest.imageUrl2, pest.imageUrl3].filter(url => url);
            const currentSlide = currentSlides[pest.id] || 0;

            return (
              <div key={pest.id} className="rounded-3xl bg-white shadow-sm border border-gray-100 overflow-hidden">
                {images.length > 0 ? (
                  <div className="relative w-full h-64 overflow-hidden bg-gray-100">
                    {images.map((url, i) => (
                      <img key={i} src={url} alt={pest.name} loading="lazy" className={`absolute w-full h-full object-cover transition-opacity duration-500 ${currentSlide === i ? 'opacity-100' : 'opacity-0'}`} />
                    ))}
                    {images.length > 1 && (
                      <>
                        <button onClick={() => setCurrentSlides(prev => ({...prev, [pest.id]: (currentSlide === 0 ? images.length - 1 : currentSlide - 1)}))} className="absolute left-3 top-1/2 bg-black/40 text-white p-2 rounded-full backdrop-blur-sm">❮</button>
                        <button onClick={() => setCurrentSlides(prev => ({...prev, [pest.id]: (currentSlide === images.length - 1 ? 0 : currentSlide + 1)}))} className="absolute right-3 top-1/2 bg-black/40 text-white p-2 rounded-full backdrop-blur-sm">❯</button>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="w-full h-40 bg-gray-100 flex items-center justify-center text-gray-400 text-sm">Tidak ada foto</div>
                )}
                
                <div className="p-6">
                  <h2 className="font-black text-2xl text-gray-900 mb-1">{pest.name}</h2>
                  <p className="text-sm text-gray-500 mb-4">Inang: <span className="font-semibold text-green-700">{pest.host}</span></p>
                  
                  <button onClick={() => setExpandedId(expandedId === pest.id ? null : pest.id)} className="w-full py-3 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition">
                    {expandedId === pest.id ? 'Tutup Detail' : 'Lihat Selengkapnya'}
                  </button>

                  {expandedId === pest.id && (
                    <div className="mt-6 pt-6 border-t border-gray-50 space-y-4 animate-in fade-in">
                      <div><p className="text-[10px] font-black text-green-600 uppercase tracking-widest mb-1">Gejala</p><p className="text-sm text-gray-600 leading-relaxed">{pest.symptoms}</p></div>
                      <div><p className="text-[10px] font-black text-green-600 uppercase tracking-widest mb-1">Pengendalian</p><p className="text-sm text-gray-600 leading-relaxed">{pest.control}</p></div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default OptInformation;
