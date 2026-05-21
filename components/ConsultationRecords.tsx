
import React, { useState, useEffect } from 'react';
import { ConsultationRecord } from '../types';

const ConsultationRecords: React.FC = () => {
  const [records, setRecords] = useState<ConsultationRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedRecords, setExpandedRecords] = useState<Set<string>>(new Set());
  const [viewImage, setViewImage] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ id: string | 'all' } | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<ConsultationRecord | null>(null);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('popt_consultation_records') || '[]');
    setRecords(stored);
  }, []);

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedRecords);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRecords(newExpanded);
  };

  const handleDelete = () => {
    if (!confirmDelete) return;

    if (confirmDelete.id === 'all') {
      localStorage.setItem('popt_consultation_records', '[]');
      setRecords([]);
    } else {
      const updated = records.filter(r => r.id !== confirmDelete.id);
      localStorage.setItem('popt_consultation_records', JSON.stringify(updated));
      setRecords(updated);
    }
    setConfirmDelete(null);
  };

  const filteredRecords = records.filter(r => 
    r.farmerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.farmerGroup.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.question.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Custom Confirmation Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center text-red-500 mb-4">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">
              {confirmDelete.id === 'all' ? 'Hapus Semua Laporan?' : 'Hapus Laporan Ini?'}
            </h3>
            <p className="text-slate-500 text-sm mb-6 leading-relaxed">
              Tindakan ini akan menghapus data secara permanen dari penyimpanan lokal Anda. Data yang sudah dihapus tidak dapat dikembalikan.
            </p>
            <div className="flex space-x-3">
              <button 
                onClick={() => setConfirmDelete(null)}
                className="flex-1 py-2.5 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors text-sm"
              >
                Batal
              </button>
              <button 
                onClick={handleDelete}
                className="flex-1 py-2.5 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-colors shadow-lg shadow-red-100 text-sm"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Modal */}
      {viewImage && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setViewImage(null)}
        >
          <div className="relative max-w-4xl w-full max-h-[90vh] flex flex-col items-center">
            <button 
              className="absolute -top-12 right-0 text-white hover:text-green-400 transition-colors"
              onClick={() => setViewImage(null)}
            >
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <img 
              src={viewImage} 
              alt="Full view" 
              className="max-w-full max-h-full object-contain rounded-xl shadow-2xl border-4 border-white/10"
              referrerPolicy="no-referrer"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50 rounded-t-2xl">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Detail Laporan Konsultasi</h3>
                <p className="text-xs text-slate-500 font-medium">Tiket: {selectedRecord.ticketId}</p>
              </div>
              <button 
                onClick={() => setSelectedRecord(null)}
                className="p-2 hover:bg-slate-200 rounded-full transition-colors"
              >
                <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-3 rounded-xl">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Nama Petani</p>
                  <p className="text-sm font-bold text-slate-800">{selectedRecord.farmerName}</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Waktu Laporan</p>
                  <p className="text-sm font-bold text-slate-800">{selectedRecord.timestamp}</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Alamat</p>
                  <p className="text-sm text-slate-600">{selectedRecord.address}</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Kelompok Tani</p>
                  <p className="text-sm text-slate-600">{selectedRecord.farmerGroup}</p>
                </div>
              </div>

              {selectedRecord.image && (
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Lampiran Foto</p>
                  <img 
                    src={selectedRecord.image} 
                    alt="Lampiran" 
                    className="w-full h-48 object-cover rounded-xl border border-slate-200 shadow-sm"
                    referrerPolicy="no-referrer"
                  />
                </div>
              )}

              <div className="space-y-4">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Masalah Umum</p>
                  <p className="text-sm text-slate-800 leading-relaxed">{selectedRecord.question}</p>
                </div>

                <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                  <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-2">Diagnosa AI</p>
                  <p className="text-sm text-slate-800 font-bold leading-relaxed">
                    {selectedRecord.aiResponse.includes('DIAGNOSA:') 
                      ? selectedRecord.aiResponse.split('SARAN:')[0].replace('DIAGNOSA:', '').trim()
                      : selectedRecord.aiResponse}
                  </p>
                </div>

                <div className="bg-green-50/50 p-4 rounded-xl border border-green-100">
                  <p className="text-[10px] font-bold text-green-600 uppercase tracking-widest mb-2">Saran Pengendalian</p>
                  <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
                    {selectedRecord.aiResponse.includes('SARAN:') 
                      ? selectedRecord.aiResponse.split('SARAN:')[1].trim()
                      : '-'}
                  </p>
                </div>

                {selectedRecord.chatHistory && selectedRecord.chatHistory.length > 0 && (
                  <div className="pt-4 border-t border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Riwayat Percakapan Lengkap</p>
                    <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                      {selectedRecord.chatHistory.map((msg, idx) => (
                        <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${
                            msg.role === 'user' 
                              ? 'bg-green-600 text-white rounded-tr-none' 
                              : 'bg-slate-100 text-slate-800 rounded-tl-none'
                          }`}>
                            {msg.image && (
                              <img 
                                src={msg.image} 
                                alt="User upload" 
                                className="w-full h-32 object-cover rounded-lg mb-2 border border-white/20"
                                referrerPolicy="no-referrer"
                              />
                            )}
                            <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50 rounded-b-2xl">
              <button 
                onClick={() => setSelectedRecord(null)}
                className="w-full py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-all shadow-lg shadow-green-100"
              >
                Tutup Detail
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-slate-800">Rekap Konsultasi AI</h3>
          <p className="text-sm text-slate-500">Data petani dan riwayat tanya jawab dengan asisten AI</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <input 
              type="text" 
              placeholder="Cari petani/kelompok..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-green-500 w-full md:w-64"
            />
            <svg className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          {records.length > 0 && (
            <button 
              onClick={() => setConfirmDelete({ id: 'all' })}
              className="px-4 py-2 text-xs font-bold text-red-500 hover:bg-red-50 rounded-xl transition-colors border border-red-100"
            >
              Hapus Semua
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">No. Tiket</th>
                <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Waktu</th>
                <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Petani</th>
                <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Alamat</th>
                <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Kelompok</th>
                <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Masalah Umum</th>
                <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Diagnosa & Saran</th>
                <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredRecords.length > 0 ? (
                filteredRecords.map((record) => {
                  const isExpanded = expandedRecords.has(record.id);
                  const shortResponse = record.aiResponse.length > 120 
                    ? record.aiResponse.substring(0, 120) + '...' 
                    : record.aiResponse;
                  const shortQuestion = record.question.length > 120
                    ? record.question.substring(0, 120) + '...'
                    : record.question;

                  return (
                    <tr key={record.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-4 py-4 align-top">
                        <button 
                          onClick={() => setSelectedRecord(record)}
                          className="text-[10px] font-bold text-green-700 bg-green-50 px-2 py-1 rounded-md border border-green-100 whitespace-nowrap hover:bg-green-100 transition-colors shadow-sm"
                          title="Klik untuk detail"
                        >
                          {record.ticketId || 'N/A'}
                        </button>
                      </td>
                      <td className="px-4 py-4 align-top">
                        <span className="text-[10px] font-medium text-slate-400 whitespace-nowrap">{record.timestamp}</span>
                      </td>
                      <td className="px-4 py-4 align-top">
                        <p className="text-sm font-bold text-slate-800">{record.farmerName}</p>
                      </td>
                      <td className="px-4 py-4 align-top">
                        <p className="text-sm text-slate-600">{record.address}</p>
                      </td>
                      <td className="px-4 py-4 align-top">
                        <p className="text-sm text-slate-600">{record.farmerGroup}</p>
                      </td>
                      <td className="px-4 py-4 align-top min-w-[250px]">
                        <div className="flex flex-col">
                          {record.image && (
                            <button 
                              onClick={() => setViewImage(record.image!)}
                              className="flex items-center space-x-2 mb-3 group/btn w-fit"
                            >
                              <div className="relative">
                                <img 
                                  src={record.image} 
                                  alt="Lampiran" 
                                  className="w-12 h-12 object-cover rounded-lg border-2 border-slate-100 group-hover/btn:border-green-500 transition-all shadow-sm" 
                                  referrerPolicy="no-referrer"
                                />
                                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/btn:opacity-100 rounded-lg flex items-center justify-center transition-opacity">
                                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                  </svg>
                                </div>
                              </div>
                              <span className="text-[10px] font-bold text-green-600 uppercase tracking-wider">Foto Laporan</span>
                            </button>
                          )}
                          <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Masalah Umum:</p>
                            <p className="text-sm text-slate-800 leading-relaxed">{isExpanded ? record.question : shortQuestion}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 align-top min-w-[350px]">
                        <div className="flex flex-col space-y-3">
                          {record.aiResponse.includes('DIAGNOSA:') ? (
                            <>
                              <div className="bg-blue-50/30 p-3 rounded-xl border border-blue-100/50">
                                <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-1">Diagnosa AI:</p>
                                <p className="text-sm text-slate-700 leading-relaxed font-bold">
                                  {record.aiResponse.split('SARAN:')[0].replace('DIAGNOSA:', '').trim()}
                                </p>
                              </div>
                              <div className="bg-green-50/30 p-3 rounded-xl border border-green-100/50">
                                <p className="text-[10px] font-bold text-green-600 uppercase tracking-widest mb-1">Saran Pengendalian:</p>
                                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                                  {record.aiResponse.includes('SARAN:') 
                                    ? (isExpanded ? record.aiResponse.split('SARAN:')[1].trim() : record.aiResponse.split('SARAN:')[1].trim().substring(0, 100) + '...')
                                    : '-'}
                                </p>
                              </div>
                            </>
                          ) : (
                            <div className="bg-green-50/30 p-3 rounded-xl border border-green-100/50">
                              <p className="text-xs font-bold text-green-600/60 uppercase tracking-widest mb-1">Diagnosa & Saran AI:</p>
                              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                                {isExpanded ? record.aiResponse : shortResponse}
                              </p>
                            </div>
                          )}
                          
                          {(record.aiResponse.length > 120 || record.question.length > 120) && (
                            <button 
                              onClick={() => toggleExpand(record.id)}
                              className="text-[10px] font-bold text-green-600 uppercase hover:underline mt-2 ml-1 text-left flex items-center"
                            >
                              <span>{isExpanded ? 'Sembunyikan Laporan' : 'Lihat Laporan Lengkap'}</span>
                              <svg className={`w-3 h-3 ml-1 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 align-top">
                        <button 
                          onClick={() => setConfirmDelete({ id: record.id })}
                          className="text-slate-300 hover:text-red-500 transition-colors p-1"
                          title="Hapus Laporan"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center">
                    <p className="text-slate-400 italic text-sm">Belum ada rekapan konsultasi.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ConsultationRecords;
