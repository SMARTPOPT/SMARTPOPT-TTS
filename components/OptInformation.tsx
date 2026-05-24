import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient'; // Pastikan path file ini benar

const OptInformation = () => {
  const [pests, setPests] = useState<any[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPest, setNewPest] = useState({
    name: '',
    host: '',
    symptoms: '',
    control: '',
    imageUrl: ''
  });

  // 1. Mengambil data dari Supabase saat aplikasi dibuka
  useEffect(() => {
    async function loadPests() {
      const { data, error } = await supabase.from('katalog_hama').select('*');
      if (data) setPests(data);
      else console.error("Error loading data:", error);
    }
    loadPests();
  }, []);

  // 2. Fungsi untuk menyimpan data ke Supabase
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
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Katalog Hama</h1>
      <button 
        onClick={() => setShowAddModal(true)}
        className="bg-green-600 text-white px-4 py-2 rounded mb-4"
      >
        Tambah Hama Baru
      </button>

      {/* Tampilan Daftar Hama */}
      <div className="grid gap-4">
        {pests.map((pest, index) => (
          <div key={index} className="border p-4 rounded shadow">
            <h2 className="font-bold text-xl">{pest.name}</h2>
            <p><strong>Inang:</strong> {pest.host}</p>
            <p><strong>Gejala:</strong> {pest.symptoms}</p>
            <p><strong>Pengendalian:</strong> {pest.control}</p>
          </div>
        ))}
      </div>

      {/* Modal Input */}
      {showAddModal && (
        <form onSubmit={handleAddPest} className="fixed inset-0 bg-white p-6 overflow-y-auto">
          <h2 className="text-xl font-bold mb-4">Tambah Data Hama</h2>
          <input className="block w-full mb-2 border p-2" placeholder="Nama Hama" value={newPest.name} onChange={e => setNewPest({...newPest, name: e.target.value})} required />
          <input className="block w-full mb-2 border p-2" placeholder="Inang" value={newPest.host} onChange={e => setNewPest({...newPest, host: e.target.value})} />
          <textarea className="block w-full mb-2 border p-2" placeholder="Gejala" value={newPest.symptoms} onChange={e => setNewPest({...newPest, symptoms: e.target.value})} />
          <textarea className="block w-full mb-2 border p-2" placeholder="Pengendalian" value={newPest.control} onChange={e => setNewPest({...newPest, control: e.target.value})} />
          <input className="block w-full mb-4 border p-2" placeholder="URL Gambar" value={newPest.imageUrl} onChange={e => setNewPest({...newPest, imageUrl: e.target.value})} />
          
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 mr-2">Simpan ke Database</button>
          <button type="button" onClick={() => setShowAddModal(false)} className="bg-gray-400 text-white px-4 py-2">Batal</button>
        </form>
      )}
    </div>
  );
};

export default OptInformation;
