
import React, { useState, useEffect } from 'react';
import { Officer, UserRole } from '../types';

interface ContactOfficersProps {
  userRole: UserRole | null;
}

const DEFAULT_OFFICERS: Officer[] = [
  {
    id: '1',
    name: 'Pither Keristian',
    role: 'Petugas POPT',
    phone: '6281234567890',
    photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
    description: 'Spesialis Hama Tanaman Pangan'
  },
  {
    id: '2',
    name: 'Siti Aminah',
    role: 'Penyuluh Pertanian',
    phone: '6281234567891',
    photoUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200',
    description: 'Pendamping Kelompok Tani Desa Nule'
  }
];

const ContactOfficers: React.FC<ContactOfficersProps> = ({ userRole }) => {
  const [officers, setOfficers] = useState<Officer[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [photoMethod, setPhotoMethod] = useState<'link' | 'upload'>('link');
  const [formData, setFormData] = useState<Partial<Officer>>({
    name: '',
    role: '',
    phone: '',
    photoUrl: '',
    description: ''
  });

  useEffect(() => {
    const saved = localStorage.getItem('popt_officers');
    if (saved) {
      setOfficers(JSON.parse(saved));
    } else {
      setOfficers(DEFAULT_OFFICERS);
      localStorage.setItem('popt_officers', JSON.stringify(DEFAULT_OFFICERS));
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, photoUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    let updated: Officer[];
    if (editingId) {
      updated = officers.map(o => o.id === editingId ? { ...o, ...formData as Officer } : o);
    } else {
      const newOfficer: Officer = {
        ...formData as Officer,
        id: Date.now().toString()
      };
      updated = [...officers, newOfficer];
    }
    setOfficers(updated);
    localStorage.setItem('popt_officers', JSON.stringify(updated));
    setShowModal(false);
    setEditingId(null);
    setFormData({ name: '', role: '', phone: '', photoUrl: '', description: '' });
  };

  const handleEdit = (officer: Officer) => {
    setFormData(officer);
    setEditingId(officer.id);
    setPhotoMethod(officer.photoUrl?.startsWith('data:') ? 'upload' : 'link');
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Hapus data petugas ini?')) {
      const updated = officers.filter(o => o.id !== id);
      setOfficers(updated);
      localStorage.setItem('popt_officers', JSON.stringify(updated));
    }
  };

  const openWhatsApp = (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    window.open(`https://wa.me/${cleanPhone}`, '_blank');
  };

  const openPhone = (phone: string) => {
    window.open(`tel:${phone}`, '_self');
  };

  const openSMS = (phone: string) => {
    window.open(`sms:${phone}`, '_self');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-2xl font-black text-slate-800 tracking-tight">Hubungi Petugas & Penyuluh</h3>
          <p className="text-slate-500">Konsultasi langsung dengan tim ahli di lapangan</p>
        </div>
        {userRole === 'Admin' && (
          <button 
            onClick={() => {
              setEditingId(null);
              setFormData({ name: '', role: '', phone: '', photoUrl: '', description: '' });
              setPhotoMethod('link');
              setShowModal(true);
            }}
            className="px-6 py-3 bg-green-600 text-white font-bold rounded-2xl hover:bg-green-700 transition-all shadow-lg shadow-green-100 flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
            Tambah Petugas
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {officers.map((officer) => (
          <div key={officer.id} className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 hover:shadow-xl hover:border-green-200 transition-all group relative">
            {userRole === 'Admin' && (
              <div className="absolute top-6 right-6 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => handleEdit(officer)}
                  className="p-2 bg-amber-50 text-amber-600 rounded-xl hover:bg-amber-100"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
                <button 
                  onClick={() => handleDelete(officer.id)}
                  className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            )}
            
            <div className="flex flex-col items-center text-center">
              <div className="w-32 h-32 rounded-[2rem] overflow-hidden mb-6 ring-4 ring-green-50 group-hover:ring-green-100 transition-all">
                <img 
                  src={officer.photoUrl || 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?auto=format&fit=crop&q=80&w=200'} 
                  alt={officer.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <h4 className="text-xl font-black text-slate-800 mb-1">{officer.name}</h4>
              <p className="text-green-600 font-bold text-xs uppercase tracking-widest mb-4">{officer.role}</p>
              <p className="text-slate-500 text-sm mb-8 line-clamp-2">{officer.description || 'Petugas lapangan BPP Nule siap membantu kendala pertanian Anda.'}</p>
              
              <div className="w-full space-y-3">
                <button 
                  onClick={() => openWhatsApp(officer.phone)}
                  className="w-full py-3 bg-emerald-600 text-white font-bold rounded-2xl hover:bg-emerald-700 transition-all flex items-center justify-center space-x-2 shadow-lg shadow-emerald-100"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.94 3.659 1.437 5.63 1.438h.008c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                  </svg>
                  <span>WhatsApp</span>
                </button>
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => openPhone(officer.phone)}
                    className="py-3 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-all flex items-center justify-center space-x-2 shadow-lg shadow-blue-100"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <span>Telepon</span>
                  </button>
                  <button 
                    onClick={() => openSMS(officer.phone)}
                    className="py-3 bg-amber-600 text-white font-bold rounded-2xl hover:bg-amber-700 transition-all flex items-center justify-center space-x-2 shadow-lg shadow-amber-100"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                    <span>SMS</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>


      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h4 className="text-xl font-black text-slate-800">{editingId ? 'Edit Data Petugas' : 'Tambah Petugas Baru'}</h4>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-white rounded-full transition-colors">
                <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleSave} className="p-8 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2 tracking-widest">Nama Lengkap</label>
                <input 
                  required
                  type="text" 
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-green-500 transition-all font-medium"
                  placeholder="Contoh: Pither Keristian"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2 tracking-widest">Jabatan/Role</label>
                  <input 
                    required
                    type="text" 
                    value={formData.role}
                    onChange={e => setFormData({...formData, role: e.target.value})}
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-green-500 transition-all font-medium"
                    placeholder="Penyuluh / POPT"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2 tracking-widest">No. WhatsApp</label>
                  <input 
                    required
                    type="text" 
                    value={formData.phone}
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-green-500 transition-all font-medium"
                    placeholder="62812..."
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2 tracking-widest">Metode Foto</label>
                <div className="flex space-x-4 mb-4">
                  <button 
                    type="button"
                    onClick={() => setPhotoMethod('link')}
                    className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${photoMethod === 'link' ? 'bg-green-600 text-white shadow-lg shadow-green-100' : 'bg-slate-100 text-slate-500'}`}
                  >
                    Link Google Drive
                  </button>
                  <button 
                    type="button"
                    onClick={() => setPhotoMethod('upload')}
                    className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${photoMethod === 'upload' ? 'bg-green-600 text-white shadow-lg shadow-green-100' : 'bg-slate-100 text-slate-500'}`}
                  >
                    Upload Manual
                  </button>
                </div>

                {photoMethod === 'link' ? (
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 tracking-widest">URL Foto / Google Drive</label>
                    <input 
                      type="text" 
                      value={formData.photoUrl}
                      onChange={e => setFormData({...formData, photoUrl: e.target.value})}
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-green-500 transition-all font-medium"
                      placeholder="https://drive.google.com/..."
                    />
                    <p className="text-[10px] text-slate-400 mt-2 italic">*Pastikan link Google Drive bersifat publik (Anyone with the link).</p>
                  </div>
                ) : (
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 tracking-widest">Pilih File Foto</label>
                    <div className="relative group">
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={handleFileChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      />
                      <div className="w-full px-6 py-8 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center group-hover:border-green-400 transition-all">
                        {formData.photoUrl && formData.photoUrl.startsWith('data:') ? (
                          <div className="flex items-center space-x-4">
                            <img src={formData.photoUrl} alt="Preview" className="w-12 h-12 rounded-lg object-cover" />
                            <span className="text-xs font-bold text-green-600">Foto Terpilih</span>
                          </div>
                        ) : (
                          <>
                            <svg className="w-8 h-8 text-slate-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span className="text-xs font-bold text-slate-400">Klik untuk pilih foto</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2 tracking-widest">Deskripsi Singkat</label>
                <textarea 
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-green-500 transition-all font-medium h-24 resize-none"
                  placeholder="Keahlian atau wilayah binaan..."
                />
              </div>
              <div className="pt-4">
                <button 
                  type="submit"
                  className="w-full py-5 bg-green-600 text-white font-bold rounded-2xl hover:bg-green-700 transition-all shadow-xl shadow-green-100"
                >
                  {editingId ? 'Simpan Perubahan' : 'Simpan Data Petugas'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default ContactOfficers;
