import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

const OptInformation = () => {
  const [pests, setPests] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [currentSlides, setCurrentSlides] = useState<Record<number, number>>({});

  useEffect(() => {
    async function loadPests() {
      const { data, error } = await supabase.from('katalog_hama').select('*');
      if (error) console.error("Error fetching data:", error);
      else if (data) setPests(data);
    }
    loadPests();
  }, []);

  // Memfilter hama berdasarkan input pencarian
  const filteredPests = pests.filter(p => 
    (p.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
     p.host?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="p-4 max-w-lg mx-auto bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-extrabold mb-6 text-center text-gray-800">Katalog Hama</h1>

      {/* Input Pencarian */}
      <input 
        type="text" 
        placeholder="Cari nama hama atau inang..." 
        className="w-full p-4 mb-6 border border-gray-200 rounded-2xl shadow-sm outline-none focus:ring-2 focus:ring-green-500" 
        onChange={(e) => setSearchQuery(e.target.value)} 
      />

      <div className="space-y-6">
        {filteredPests.map((pest) => {
          // Mengambil gambar yang tersedia saja
          const images = [pest.imageUrl, pest.imageUrl2, pest.imageUrl3].filter(url => url);
          const currentSlide = currentSlides[pest.id] || 0;

          return (
            <div key={pest.id} className="rounded-3xl bg-white shadow-sm border border-gray-100 overflow-hidden">
              {/* Image Slider */}
              {images.length > 0 ? (
                <div className="relative w-full h-64 overflow-hidden bg-gray-100">
                  {images.map((url, i) => (
                    <img 
                      key={i} 
                      src={url} 
                      alt={pest.name} 
                      loading="lazy"
                      className={`absolute w-full h-full object-cover transition-opacity duration-500 ${currentSlide === i ? 'opacity-100' : 'opacity-0'}`}
                    />
                  ))}
                  {images.length > 1 && (
                    <>
                      <button onClick={() => setCurrentSlides(prev => ({...prev, [pest.id]: (currentSlide === 0 ? images.length - 1 : currentSlide - 1)}))} className="absolute left-3 top-1/2 bg-black/40 text-white p-2 rounded-full backdrop-blur-sm">❮</button>
                      <button onClick={() => setCurrentSlides(prev => ({...prev, [pest.id]: (currentSlide === images.length - 1 ? 0 : currentSlide + 1)}))} className="absolute right-3 top-1/2 bg-black/40 text-white p-2 rounded-full backdrop-blur-sm">❯</button>
                    </>
                  )}
                </div>
              ) : (
                <div className="w-full h-40 bg-gray-100 flex items-center justify-center text-gray-400">Tidak ada gambar</div>
              )}
              
              <div className="p-6">
                <h2 className="font-black text-2xl text-gray-900 mb-1">{pest.name}</h2>
                <p className="text-sm text-gray-500 mb-4">Inang: <span className="font-semibold text-green-700">{pest.host}</span></p>
                
                <button 
                  onClick={() => setExpandedId(expandedId === pest.id ? null : pest.id)} 
                  className="w-full py-3 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition"
                >
                  {expandedId === pest.id ? 'Tutup Detail' : 'Lihat Selengkapnya'}
                </button>

                {expandedId === pest.id && (
                  <div className="mt-6 pt-6 border-t border-gray-50 space-y-4 animate-in fade-in slide-in-from-top-2">
                    <div>
                      <p className="text-[10px] font-black text-green-600 uppercase tracking-widest mb-1">Gejala</p>
                      <p className="text-sm text-gray-600 leading-relaxed">{pest.symptoms}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-green-600 uppercase tracking-widest mb-1">Pengendalian</p>
                      <p className="text-sm text-gray-600 leading-relaxed">{pest.control}</p>
                    </div>
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
