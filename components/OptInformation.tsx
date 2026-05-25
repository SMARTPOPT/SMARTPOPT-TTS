import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

const OptInformation = () => {
  const [pests, setPests] = useState<any[]>([]);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  
  // Ganti ke 'true' hanya saat Anda (Admin) sedang mengakses halaman
  const [isAdmin] = useState(false); 

  const [newPest, setNewPest] = useState({
    name: '',
    host: '',
    symptoms: '',
    control: '',
    imageUrl: ''
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
    const { data, error } = await supabase
      .from('katalog_hama')
      .insert([newPest])
      .select();

    if (error) {
      alert("Gagal simpan: " + error.message);
    } else {
      setPests([...pests, data[0]]);
      setShowAddModal(false);
      setNewPest({ name: '', host: '', symptoms: '', control: '', imageUrl: '' });
      alert("Data berhasil disimpan!");
    }
  };

  return (
    <div className="p-4 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-center">Katalog Hama</h1>

      {/* Tombol Tambah (Admin Only) */}
      {isAdmin && (
        <button 
          onClick={() => setShowAddModal(true)}
          className="w-full bg-green-600 text-white py-2 rounded-lg mb-6 font-semibold shadow"
        >
          + Tambah Hama Baru
        </button>
      )}

      {/* Daftar Katalog Minimalis */}
      <div className="space-y-3">
        {pests.map((pest) => (
          <div key={pest.id} className="border border-gray-200 rounded-xl p-4 bg-white shadow-sm">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="font-bold text-lg text-gray-800">{pest.name}</h2>
                <p className="text-sm text-gray-500">Inang: {pest.host}</p>
              </div>
              <button 
                onClick={() => setExpandedId(expandedId === pest.id ? null : pest.id)}
                className="text-xs bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg font-medium hover:bg-blue-100 transition"
              >
                {expandedId === pest.id ? 'Tutup' : 'Lihat Selengkapnya'}
              </button>
            </div>

            {/* Info Lengkap */}
            {expandedId === pest.id && (
              <div className="mt-4 pt-4 border-t border-gray-100 space-y-3 animate-in fade-in duration-300">
                {pest.imageUrl && (
                  <img src={pest.imageUrl} alt={pest.name} className="w-full h-40 object-cover rounded-lg" />
                )}
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase">Gejala</p>
                  <p className="text-sm text-gray-600">{pest.symptoms}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase">Pengendalian</p>
                  <p className="text-sm text-gray-600">{pest.control}</p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Modal Input (Hanya muncul jika di-trigger admin) */}
      {showAddModal && (
        <form onSubmit={handleAddPest} className="fixed inset-0 bg-white p-6 z-50 overflow-y-auto">
          <h2 className="text-xl font-bold mb-4">Tambah Data Hama</h2>
          <input className="block w-full mb-2 border p-2 rounded" placeholder="Nama Hama" value={newPest.name} onChange={e => setNewPest({...newPest, name: e.target.value})} required />
          <input className="block w-full mb-2 border p-2 rounded" placeholder="Inang" value={newPest.host} onChange={e => setNewPest({...newPest, host: e.target.value})} />
          <textarea className="block w-full mb-2 border p-2 rounded" placeholder="Gejala" value={newPest.symptoms} onChange={e => setNewPest({...newPest, symptoms: e.target.value})} />
          <textarea className="block w-full mb-2 border p-2 rounded" placeholder="Pengendalian" value={newPest.control} onChange={e => setNewPest({...newPest, control: e.target.value})} />
          <input className="block w-full mb-4 border p-2 rounded" placeholder="URL Gambar" value={newPest.imageUrl} onChange={e => setNewPest({...newPest, imageUrl: e.target.value})} />
          
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 mr-2 rounded">Simpan</button>
          <button type="button" onClick={() => setShowAddModal(false)} className="bg-gray-400 text-white px-4 py-2 rounded">Batal</button>
        </form>
      )}
    </div>
  );
};

export default OptInformation;
