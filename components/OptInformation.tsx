import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

const OptInformation = () => {
  const [pests, setPests] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isAdmin] = useState(false); 

  const [newPest, setNewPest] = useState({
    name: '', host: '', symptoms: '', control: '', 
    imageUrl: '', imageUrl2: '', imageUrl3: ''
  });

  useEffect(() => {
    async function loadPests() {
      const { data } = await supabase.from('katalog_hama').select('*');
      if (data) setPests(data);
    }
    loadPests();
  }, []);

  const handleAddPest = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data, error } = await supabase.from('katalog_hama').insert([newPest]).select();
    if (error) { alert("Gagal: " + error.message); } 
    else {
      setPests([...pests, data[0]]);
      setShowAddModal(false);
      setNewPest({ name: '', host: '', symptoms: '', control: '', imageUrl: '', imageUrl2: '', imageUrl3: '' });
      alert("Data berhasil disimpan!");
    }
  };

  const filteredPests = pests.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.host.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-4 max-w-lg mx-auto bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-extrabold mb-6 text-center text-gray-800">Katalog Hama</h1>

      <input type="text" placeholder="Cari nama hama atau inang..." className="w-full p-3 mb-6 border rounded-xl shadow-sm outline-none" onChange={(e) => setSearchQuery(e.target.value)} />

      {isAdmin && (
        <button onClick={() => setShowAddModal(true)} className="w-full bg-green-600 text-white py-2 rounded-lg mb-6 font-semibold shadow">+ Tambah Hama Baru</button>
      )}

      <div className="space-y-4">
        {filteredPests.map((pest) => (
          <div key={pest.id} className="rounded-2xl bg-white shadow-md overflow-hidden">
            {/* Gallery Carousel */}
            <div className="flex gap-2 overflow-x-auto p-2 snap-x">
              {[pest.imageUrl, pest.imageUrl2, pest.imageUrl3].filter(url => url).map((url, i) => (
                <img key={i} src={url} alt={pest.name} className="w-40 h-40 object-cover rounded-xl shrink-0 snap-start shadow-sm" />
              ))}
            </div>
            
            <div className="p-4">
              <h2 className="font-bold text-xl text-gray-900">{pest.name}</h2>
              <p className="text-sm text-gray-600 mb-4">Inang: <span className="font-medium text-blue-600">{pest.host}</span></p>
              <button onClick={() => setExpandedId(expandedId === pest.id ? null : pest.id)} className="w-full py-2 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition">
                {expandedId === pest.id ? 'Tutup Detail' : 'Lihat Selengkapnya'}
              </button>

              {expandedId === pest.id && (
                <div className="mt-4 pt-4 border-t space-y-3">
                  <p className="text-xs font-bold text-gray-400 uppercase">Gejala</p>
                  <p className="text-sm text-gray-700">{pest.symptoms}</p>
                  <p className="text-xs font-bold text-gray-400 uppercase">Pengendalian</p>
                  <p className="text-sm text-gray-700">{pest.control}</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {showAddModal && (
        <form onSubmit={handleAddPest} className="fixed inset-0 bg-white p-6 z-50 overflow-y-auto">
          <h2 className="text-xl font-bold mb-4">Tambah Data</h2>
          <input className="block w-full mb-2 border p-2 rounded" placeholder="Nama Hama" value={newPest.name} onChange={e => setNewPest({...newPest, name: e.target.value})} />
          <input className="block w-full mb-2 border p-2 rounded" placeholder="Inang" value={newPest.host} onChange={e => setNewPest({...newPest, host: e.target.value})} />
          <textarea className="block w-full mb-2 border p-2 rounded" placeholder="Gejala" value={newPest.symptoms} onChange={e => setNewPest({...newPest, symptoms: e.target.value})} />
          <textarea className="block w-full mb-2 border p-2 rounded" placeholder="Pengendalian" value={newPest.control} onChange={e => setNewPest({...newPest, control: e.target.value})} />
          <input className="block w-full mb-2 border p-2 rounded" placeholder="URL Gambar 1" value={newPest.imageUrl} onChange={e => setNewPest({...newPest, imageUrl: e.target.value})} />
          <input className="block w-full mb-2 border p-2 rounded" placeholder="URL Gambar 2" value={newPest.imageUrl2} onChange={e => setNewPest({...newPest, imageUrl2: e.target.value})} />
          <input className="block w-full mb-4 border p-2 rounded" placeholder="URL Gambar 3" value={newPest.imageUrl3} onChange={e => setNewPest({...newPest, imageUrl3: e.target.value})} />
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 mr-2 rounded">Simpan</button>
          <button type="button" onClick={() => setShowAddModal(false)} className="bg-gray-400 text-white px-4 py-2 rounded">Batal</button>
        </form>
      )}
    </div>
  );
};

export default OptInformation;
