
import React, { useState, useEffect } from 'react';
import WeatherWidget from './WeatherWidget';
import { Tab } from '../types';

interface BerandaProps {
  userFullName?: string | null;
  bppName?: string | null;
  onNavigate: (tab: Tab) => void;
  visitorCount?: number | null;
}

const Beranda: React.FC<BerandaProps> = ({ userFullName, bppName, onNavigate, visitorCount }) => {
  const [quote, setQuote] = useState('');

  const quotes = [
    "Pertanian adalah pondasi peradaban. Mari bekerja dengan hati untuk ketahanan pangan.",
    "Setiap benih yang kita jaga adalah harapan bagi masa depan bangsa.",
    "Kerja keras di lapangan hari ini adalah senyum petani di masa panen nanti.",
    "Semangat melayani, dedikasi untuk petani, demi bumi yang lebih hijau.",
    "Inovasi teknologi, kearifan lokal, satu tujuan: Kesejahteraan Petani."
  ];

  useEffect(() => {
    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
    setQuote(randomQuote);
  }, []);

  const stats = [
    { label: 'Luas Lahan Terpantau', value: '1,240 Ha', icon: 'M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7', color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Kelompok Tani Binaan', value: '42 Unit', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z', color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Status Keamanan OPT', value: 'WASPADA', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z', color: 'text-amber-600', bg: 'bg-amber-50' },
  ];

  if (visitorCount !== undefined && visitorCount !== null) {
    stats.push({
      label: 'Jumlah Pengunjung',
      value: `${visitorCount.toLocaleString('id-ID')} Orang`,
      icon: 'M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z',
      color: 'text-teal-600',
      bg: 'bg-teal-50'
    });
  }

  const displayName = userFullName || `Petugas SMART POPT BPP ${bppName || 'Nule'}`;

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Welcome Section for Logged In Users */}
      {userFullName && (
        <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-green-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative">
          <div className="absolute top-0 left-0 w-1 h-full bg-green-600"></div>
          <div className="flex items-center space-x-6">
            <div className="w-16 h-16 rounded-2xl bg-green-100 flex items-center justify-center text-green-700 text-2xl font-black shadow-inner shrink-0">
              {userFullName[0].toUpperCase()}
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">
                Selamat Datang, <span className="text-green-700">{userFullName}</span>!
              </h2>
              <p className="text-slate-500 italic mt-1 font-medium">
                "{quote}"
              </p>
            </div>
          </div>
          <div className="hidden lg:block text-right">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Status Tugas Hari Ini</p>
            <p className="text-sm font-bold text-green-600 mt-1">Siap Melayani Petani {bppName || 'Nule'}</p>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-green-800 to-emerald-900 rounded-[2rem] p-8 md:p-16 text-white shadow-2xl flex flex-col md:flex-row items-center gap-12">
        <div className="absolute top-0 right-0 w-1/3 h-full opacity-10 pointer-events-none">
          <svg className="w-full h-full" viewBox="0 0 200 200" fill="currentColor">
            <path d="M45,-76.3C58.1,-69.5,68.2,-56.3,76.1,-42.1C84,-27.9,89.6,-12.7,88.4,2.1C87.2,16.9,79.2,31.2,69.5,43.6C59.8,56,48.4,66.4,35.3,72.9C22.1,79.4,7.3,82, -8.1,80.7C-23.4,79.4,-39.3,74.2,-52.8,65.1C-66.2,56,-77.2,43,-82.9,28.2C-88.6,13.4,-89.1,-3.2,-84.3,-18.2C-79.5,-33.2,-69.5,-46.6,-57.1,-53.8C-44.6,-61,-29.7,-62.1,-15.8,-69.5C-2,-76.9,12,-90.6,45,-76.3Z" transform="translate(100 100)" />
          </svg>
        </div>
        
        <div className="relative z-10 flex-1">
          <div className="inline-flex items-center space-x-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full border border-white/20 text-xs font-bold uppercase tracking-widest mb-6">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
            <span>Sistem Monitoring, Analisis, dan Respon Terpadu</span>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black leading-tight mb-6">
            Menjaga Ketahanan <br/> <span className="text-green-400">Pangan BPP {bppName || 'Nule'}</span>
          </h1>
          <p className="text-base md:text-lg text-green-100/80 leading-relaxed mb-8 font-medium">
            Integrasi data pengamatan lapangan, kecerdasan buatan, dan arsip digital untuk perlindungan tanaman yang lebih presisi dan modern.
          </p>
          <div className="flex flex-wrap gap-4">
            <button 
              onClick={() => onNavigate(Tab.OPT)}
              className="px-8 py-4 bg-white text-green-900 font-bold rounded-2xl shadow-xl hover:bg-green-50 transition-all transform hover:-translate-y-1 active:scale-95 text-sm md:text-base cursor-pointer"
            >
              Jelajahi Katalog OPT
            </button>
            <button 
              onClick={() => onNavigate(Tab.PETUGAS)}
              className="px-8 py-4 bg-green-700/50 backdrop-blur-md text-white font-bold rounded-2xl border border-white/20 hover:bg-green-700 transition-all text-sm md:text-base cursor-pointer"
            >
              Hubungi Penyuluh
            </button>
          </div>
        </div>

        {/* Prominent Centered Large Logo */}
        <div className="relative z-10 shrink-0 flex items-center justify-center">
          <div className="relative group">
            {/* Soft background glow decoration */}
            <div className="absolute -inset-1 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full blur-xl opacity-30 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
            <img 
              src="https://lh3.googleusercontent.com/d/1AfqdJADOoZgqIWcnTTr9CqgeG-8pDxEv" 
              alt="SMART POPT Circular Logo" 
              className="relative w-48 h-48 md:w-64 md:h-64 rounded-full border-4 border-white/20 shadow-2xl p-2 bg-white object-contain hover:scale-105 transition-transform duration-500"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      </section>

      {/* Real-time Stats Section */}
      <section className={`grid grid-cols-1 ${visitorCount !== undefined && visitorCount !== null ? 'sm:grid-cols-2 lg:grid-cols-4' : 'md:grid-cols-3'} gap-6`}>
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 hover:shadow-xl hover:border-green-200 transition-all group">
            <div className={`w-14 h-14 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={stat.icon} />
              </svg>
            </div>
            <p className="text-slate-500 text-sm font-bold uppercase tracking-wider">{stat.label}</p>
            <p className="text-4xl font-black text-slate-800 mt-2">{stat.value}</p>
          </div>
        ))}
      </section>

      {/* Main Mission Cards */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <svg className="w-32 h-32" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>
          <div>
            <h3 className="text-3xl font-black text-slate-800 mb-6 tracking-tight">Visi & Misi Digitalisasi</h3>
            <p className="text-slate-500 leading-relaxed mb-8 text-lg">
              Website ini hadir sebagai manifestasi komitmen <span className="text-green-700 font-bold">{displayName}</span> dalam mentransformasi data menjadi aksi nyata penyelamatan produksi pertanian di Kecamatan Amanuban Barat.
            </p>
            <ul className="space-y-4">
              {[
                { title: 'Respon Cepat Serangan', desc: 'Sistem peringatan dini bagi petani.' },
                { title: 'Data Terintegrasi', desc: 'Database digital yang akurat dan rapi.' },
                { title: 'Edukasi Mandiri', desc: 'Akses materi penyuluhan kapan saja.' }
              ].map((item, i) => (
                <li key={i} className="flex items-start space-x-4">
                  <div className="shrink-0 w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-green-600 mt-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800">{item.title}</h4>
                    <p className="text-sm text-slate-400">{item.desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="bg-emerald-50 p-1 rounded-[2.5rem]">
           <div className="bg-white p-10 rounded-[2.2rem] h-full shadow-inner flex flex-col items-center text-center justify-center">
              <div className="w-24 h-24 bg-green-600 rounded-3xl flex items-center justify-center text-white shadow-2xl shadow-green-200 mb-8 rotate-3">
                 <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                 </svg>
              </div>
              <h3 className="text-2xl font-black text-slate-800 mb-4 tracking-tight">Konsultasi Pakar AI</h3>
              <p className="text-slate-500 mb-8 max-w-sm">
                Punya kendala di kebun yang butuh jawaban cepat? Tanyakan pada Asisten AI kami yang dilatih dengan pengetahuan proteksi tanaman terkini.
              </p>
              <button className="w-full py-4 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-all flex items-center justify-center space-x-2">
                 <span>Mulai Konsultasi Gratis</span>
                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                 </svg>
              </button>
           </div>
        </div>
      </section>

      {/* Weather Widget Section */}
      <section>
        <WeatherWidget />
      </section>

      {/* Latest Info Section */}
      <section>
        <div className="flex items-center justify-between mb-8">
           <h3 className="text-2xl font-black text-slate-800 tracking-tight">Berita & Informasi Terbaru</h3>
           <button className="text-green-700 font-bold text-sm hover:underline">Lihat Semua</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { tag: 'Info OPT', title: 'Waspada Serangan Lalat Buah pada Tanaman Cabai', date: '2 Jam yang lalu', img: 'https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?auto=format&fit=crop&q=80&w=800' },
            { tag: 'Penyuluhan', title: 'Pelatihan Pembuatan Pestisida Nabati Desa Nule', date: 'Kemarin', img: 'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&q=80&w=800' },
            { tag: 'Laporan', title: 'Rekapitulasi Pengamatan Mingguan Periode Januari', date: '3 Jan 2026', img: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&q=80&w=800' },
          ].map((item, i) => (
            <div key={i} className="group cursor-pointer">
              <div className="h-56 rounded-[2rem] overflow-hidden mb-6 relative">
                <img src={item.img} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={item.title}/>
                <div className="absolute top-4 left-4">
                  <span className="px-3 py-1 bg-white/90 backdrop-blur-md rounded-full text-[10px] font-bold text-green-800 shadow-sm">{item.tag}</span>
                </div>
              </div>
              <p className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-widest">{item.date}</p>
              <h4 className="text-lg font-black text-slate-800 leading-snug group-hover:text-green-700 transition-colors">{item.title}</h4>
            </div>
          ))}
        </div>
      </section>
      
    </div>
  );
};

export default Beranda;
