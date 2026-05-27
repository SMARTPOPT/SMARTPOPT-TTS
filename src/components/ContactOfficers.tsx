import React, { useState, useEffect } from 'react';
// PERBAIKAN: Gunakan '../src/' untuk keluar dari 'components' dan masuk ke 'src'
import { supabase } from '../src/supabaseClient'; 
import { Officer, UserRole } from '../types';

interface ContactOfficersProps {
  userRole: UserRole | null;
}

const ContactOfficers: React.FC<ContactOfficersProps> = ({ userRole }) => {
  const [officers, setOfficers] = useState<any[]>([]);

  useEffect(() => {
    async function fetchOfficers() {
      // Pastikan supabase sudah ter-import dengan benar di atas
      const { data, error } = await supabase.from('kontak').select('*');
      if (error) {
        console.error("Gagal ambil data:", error);
      } else {
        setOfficers(data || []);
      }
    }
    fetchOfficers();
  }, []);

  const openWhatsApp = (name: string, phone: string) => {
    const message = `Halo Bapak/Ibu ${name}, saya ingin berkonsultasi.`;
    window.open(`https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 p-4 max-w-lg mx-auto">
      <h3 className="text-2xl font-black text-slate-800 tracking-tight text-center">Hubungi Petugas & Penyuluh</h3>
      
      <div className="space-y-4">
        {officers.map((officer) => (
          <div key={officer.id} className="p-6 bg-white rounded-3xl shadow-sm border border-slate-100">
            <h4 className="text-xl font-black text-slate-900">{officer.name}</h4>
            <p className="text-green-600 font-bold text-xs uppercase tracking-widest mb-2">{officer.role}</p>
            <p className="text-sm text-slate-600 mb-4">{officer.description}</p>
            <button 
              onClick={() => openWhatsApp(officer.name, officer.phone)} 
              className="w-full py-3 bg-emerald-600 text-white font-bold rounded-2xl hover:bg-emerald-700 transition-all"
            >
              WhatsApp
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ContactOfficers;
