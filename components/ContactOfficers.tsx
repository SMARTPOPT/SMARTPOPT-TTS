import React, { useState, useEffect } from 'react';
import { supabaseClient } from '../supabaseClient';
import { Officer, UserRole } from '../types';

interface ContactOfficersProps {
  userRole: UserRole | null;
}

const ContactOfficers: React.FC<ContactOfficersProps> = ({ userRole }) => {
  const [officers, setOfficers] = useState<Officer[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false); // State untuk loading
  const [file, setFile] = useState<File | null>(null);
  const [formData, setFormData] = useState<any>({
    name: '',
    role: '',
    phone: '',
    photo_url: '',
    description: ''
  });

  useEffect(() => {
    fetchOfficers();
  }, []);

  const fetchOfficers = async () => {
    const { data } = await supabaseClient.from('kontak').select('*');
    if (data) setOfficers(data);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true); // Aktifkan indikator loading

    try {
      let finalPhotoUrl = formData.photo_url;

      // Logika Upload ke Supabase Storage
      if (file) {
        const fileName = `${Date.now()}_${file.name}`;
        const { error: uploadError } = await supabaseClient.storage
          .from('petugas-photos')
          .upload(fileName, file);

        if (uploadError) throw uploadError;
        
        const { data } = supabaseClient.storage.from('petugas-photos').getPublicUrl(fileName);
        finalPhotoUrl = data.publicUrl;
      }

      const payload = {
        name: formData.name,
        role: formData.role,
        phone: formData.phone.replace(/\D/g, ''),
        photo_url: finalPhotoUrl,
        description: formData.description
      };

      if (editingId) {
        await supabaseClient.from('kontak').update(payload).eq('id', editingId);
      } else {
        await supabaseClient.from('kontak').insert([payload]);
      }

      setShowModal(false);
      setEditingId(null);
      setFile(null);
      setFormData({ name: '', role: '', phone: '', photo_url: '', description: '' });
      fetchOfficers();
    } catch (error: any) {
      alert('Terjadi kesalahan: ' + error.message);
    } finally {
      setIsLoading(false); // Matikan loading
    }
  };

  const handleEdit = (officer: any) => {
    setFormData(officer);
    setEditingId(officer.id);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Hapus data petugas ini?')) {
      await supabaseClient.from('kontak').delete().eq('id', id);
      fetchOfficers();
    }
  };

  const openWhatsApp = (name: string, phone: string) => {
    const message = `Halo Bapak/Ibu ${name}, saya ingin berkonsultasi.`;
    window.open(`https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-2xl font-black text-slate-800 tracking-tight">Hubungi Petugas & Penyuluh</h3>
          <p className="text-slate-500">Konsultasi langsung dengan tim ahli di lapangan</p>
        </div>
        {userRole === 'Admin' && (
          <button onClick={() => setShowModal(true)} className="px-6 py-3 bg-green-600 text-white font-bold rounded-2xl hover:bg-green-700 transition-all shadow-lg flex items-center">
            Tambah Petugas
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {officers.map((officer: any) => (
          <div key={officer.id} className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 hover:shadow-xl transition-all group relative">
            {userRole === 'Admin' && (
              <div className="absolute top-6 right-6 flex space-x-2">
                <button onClick={() => handleEdit(officer)} className="p-2 bg-amber-50 text-amber-600 rounded-xl">Edit</button>
                <button onClick={() => handleDelete(officer.id)} className="p-2 bg-red-50 text-red-600 rounded-xl">Hapus</button>
              </div>
            )}
            <div className="flex flex-col items-center text-center">
              <img src={officer.photo_url} alt={officer.name} className="w-32 h-32 rounded-[2rem] object-cover mb-6 ring-4 ring-green-50" />
              <h4 className="text-xl font-black text-slate-800">{officer.name}</h4>
              <p className="text-green-600 font-bold text-xs uppercase tracking-widest mb-4">{officer.role}</p>
              <button onClick={() => openWhatsApp(officer.name, officer.phone)} className="w-full py-3 bg-emerald-600 text-white font-bold rounded-2xl hover:bg-emerald-700">
                WhatsApp
              </button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleSave} className="bg-white p-8 rounded-[2.5rem] w-full max-w-lg space-y-4">
            <h3 className="text-xl font-bold mb-4">{editingId ? 'Edit Petugas' : 'Tambah Petugas'}</h3>
            <input required placeholder="Nama Lengkap" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-6 py-4 bg-slate-50 rounded-2xl" />
            <input required placeholder="Jabatan" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className="w-full px-6 py-4 bg-slate-50 rounded-2xl" />
            <input required placeholder="No WhatsApp (628...)" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full px-6 py-4 bg-slate-50 rounded-2xl" />
            <label className="text-sm text-slate-400">Upload Foto Profil:</label>
            <input type="file" onChange={handleFileChange} className="w-full" />
            
            <button 
              type="submit" 
              disabled={isLoading}
              className={`w-full py-5 text-white font-bold rounded-2xl ${isLoading ? 'bg-gray-400' : 'bg-green-600'}`}
            >
              {isLoading ? 'Menyimpan Data...' : 'Simpan Data'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default ContactOfficers;
