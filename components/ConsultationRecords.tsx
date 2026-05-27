
import React, { useState, useEffect } from 'react';
import { ConsultationRecord } from '../types';

// Safe field reader for Google Apps Script items, matching various English and Indonesian keys/headers
const getField = (item: any, keys: string[], fallback = '') => {
  for (const k of keys) {
    if (item && item[k] !== undefined && item[k] !== null) {
      return String(item[k]).trim();
    }
  }
  return fallback;
};

const parseRemoteItem = (item: any): ConsultationRecord | null => {
  if (!item) return null;
  
  let ticketId = getField(item, ['ticketId', 'No  Tiket', 'No Tiket', 'no  tiket', 'no tiket', 'Ticket', 'Tiket', 'ticket', 'Nomor Tiket', 'No. Tiket', 'no_tiket', 'id']);
  let question = getField(item, ['Masalah', 'masalah', 'question', 'problem']);
  
  // If no ticketId was found directly, try to extract it from the prepended bracket string in Masalah
  if (!ticketId) {
    const match = question.match(/\[(?:No\.\s*)?Tiket:\s*(TKT-[^\]\s]+)\]/i);
    if (match) {
      ticketId = match[1];
    }
  }

  // If we still don't have a valid ticket token, skip this empty or unrelated row
  if (!ticketId || !ticketId.startsWith('TKT-')) {
    return null;
  }

  // Strip ticket brackets from question for a beautiful cleaned display
  let cleanQuestion = question;
  if (cleanQuestion.startsWith('[No. Tiket:')) {
    cleanQuestion = cleanQuestion.replace(/^\[No\.\s*Tiket:\s*TKT-[^\]\s]+\]\s*/i, '');
  } else if (cleanQuestion.startsWith('[Tiket:')) {
    cleanQuestion = cleanQuestion.replace(/^\[Tiket:\s*TKT-[^\]\s]+\]\s*/i, '');
  }

  const name = getField(item, ['Nama', 'nama', 'farmerName', 'name', 'farmer_name'], 'Tanpa Nama');
  const address = getField(item, ['Alamat', 'alamat', 'address'], '');
  const group = getField(item, ['Kelompok Tani', 'kelompok_tani', 'kelompokTani', 'farmerGroup', 'group'], '');
  const phone = getField(item, ['No Hp', 'No HP', 'no hp', 'phoneNumber', 'phone', 'No. HP', 'hp', 'no_hp', 'whatsapp'], '');
  const response = getField(item, ['Hasil', 'hasil', 'aiResponse', 'response', 'jawaban'], '');
  const timestamp = getField(item, ['Tanggal', 'tanggal', 'timestamp', 'date'], new Date().toLocaleString('id-ID'));
  const image = getField(item, ['image', 'image_url', 'gambar', 'Foto', 'foto'], '');

  return {
    id: getField(item, ['id']) || Date.now().toString() + '-' + ticketId,
    ticketId,
    timestamp,
    farmerName: name,
    address,
    farmerGroup: group,
    phoneNumber: phone,
    question: cleanQuestion || '(Tanpa keterangan / Hanya gambar)',
    aiResponse: response || '(Analisis diproses)',
    image,
    chatHistory: []
  };
};

const ConsultationRecords: React.FC = () => {
  const [records, setRecords] = useState<ConsultationRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedRecords, setExpandedRecords] = useState<Set<string>>(new Set());
  const [viewImage, setViewImage] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ id: string | 'all' } | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<ConsultationRecord | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<{ type: 'success' | 'error' | null, message: string }>({ type: null, message: '' });

  useEffect(() => {
    // 1. Initial Load from LocalStorage for ultra-fast, snappy UX
    const stored = JSON.parse(localStorage.getItem('popt_consultation_records') || '[]');
    setRecords(stored);
    
    // 2. Perform background synchronization immediately on load to grab any changes automatically
    autoSyncOnLoad();
  }, []);

  const autoSyncOnLoad = async () => {
    try {
      const res = await fetch('/api/sync/apps-script');
      if (res.ok) {
        const responseJson = await res.json();
        if (responseJson.success && Array.isArray(responseJson.data)) {
          const remoteData = responseJson.data;
          const localData: ConsultationRecord[] = JSON.parse(localStorage.getItem('popt_consultation_records') || '[]');
          
          // Merge remote with local values uniquely by ticketId
          const map = new Map<string, ConsultationRecord>();
          
          remoteData.forEach(item => {
            const parsed = parseRemoteItem(item);
            if (parsed) {
              map.set(parsed.ticketId, parsed);
            }
          });

          localData.forEach(item => {
            if (item.ticketId) {
              const existing = map.get(item.ticketId);
              if (existing) {
                map.set(item.ticketId, {
                  ...existing,
                  ...item,
                  chatHistory: item.chatHistory || existing.chatHistory,
                  image: item.image || existing.image
                });
              } else {
                map.set(item.ticketId, item);
              }
            }
          });

          const merged = Array.from(map.values()).sort((a, b) => b.id.localeCompare(a.id));
          localStorage.setItem('popt_consultation_records', JSON.stringify(merged));
          setRecords(merged);
        }
      }
    } catch (e) {
      console.warn('Silently skipped background auto-sync due to offline/network state.', e);
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);
    setSyncStatus({ type: null, message: '' });
    try {
      // 1. Fetch remote data from Google Sheets via our Server Proxy
      const res = await fetch('/api/sync/apps-script');
      if (!res.ok) {
        let errMsg = 'Gagal menghubungi proxy server.';
        try {
          const errData = await res.json();
          if (errData && errData.error) {
            errMsg = errData.error;
          }
        } catch (_) {}
        throw new Error(errMsg);
      }
      const responseJson = await res.json();
      if (!responseJson.success) {
        throw new Error(responseJson.error || 'Gagal sinkronisasi data.');
      }

      const remoteData = Array.isArray(responseJson.data) ? responseJson.data : [];

      // 2. Load current local data
      const localData: ConsultationRecord[] = JSON.parse(localStorage.getItem('popt_consultation_records') || '[]');

      // 3. Post any locally created records that aren't in the remote sheet yet
      const remoteTicketIds = new Set<string>();
      remoteData.forEach(item => {
        const parsed = parseRemoteItem(item);
        if (parsed) {
          remoteTicketIds.add(parsed.ticketId);
        }
      });

      // Avoid uploading incomplete registration tickets that do not have actual questions, AI responses, or full diagnoses
      const unsyncedLocals = localData.filter(l => {
        const isComplete = l.question && 
                           l.question !== '(Mulai Konsultasi)' && 
                           l.aiResponse && 
                           l.aiResponse !== '(Proses)' && 
                           (l.aiResponse.toUpperCase().includes('DIAGNOSA:') || l.aiResponse.toUpperCase().includes('DIAGNOSIS:'));
        return l.ticketId && isComplete && !remoteTicketIds.has(l.ticketId);
      });

      let uploadCount = 0;
      for (const record of unsyncedLocals) {
        try {
          await fetch('/api/sync/apps-script', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ record })
          });
          uploadCount++;
        } catch (postErr) {
          console.error(`Gagal upload tiket ${record.ticketId} selama sinkronisasi:`, postErr);
        }
      }

      // If we uploaded new ones, re-fetch remote state to maintain ultimate truth
      let finalizedRemote = remoteData;
      if (uploadCount > 0) {
        const reFetchRes = await fetch('/api/sync/apps-script');
        if (reFetchRes.ok) {
          const reFetchJson = await reFetchRes.json();
          if (reFetchJson.success && Array.isArray(reFetchJson.data)) {
            finalizedRemote = reFetchJson.data;
          }
        }
      }

      // 4. Merge uniquely by ticketId
      const map = new Map<string, ConsultationRecord>();
      
      finalizedRemote.forEach(item => {
        const parsed = parseRemoteItem(item);
        if (parsed) {
          map.set(parsed.ticketId, parsed);
        }
      });

      localData.forEach(item => {
        if (item.ticketId) {
          const existing = map.get(item.ticketId);
          if (existing) {
            map.set(item.ticketId, {
              ...existing,
              ...item,
              chatHistory: item.chatHistory || existing.chatHistory,
              image: item.image || existing.image
            });
          } else {
            map.set(item.ticketId, item);
          }
        }
      });

      const merged = Array.from(map.values()).sort((a, b) => b.id.localeCompare(a.id));

      localStorage.setItem('popt_consultation_records', JSON.stringify(merged));
      setRecords(merged);
      
      let successMessage = 'Sinkronisasi berhasil!';
      if (uploadCount > 0) {
        successMessage += ` Terunggah ${uploadCount} laporan lokal baru ke Google Sheets.`;
      } else {
        successMessage += ' Semua data rekap sudah tersinkronisasi penuh dengan Google Sheets.';
      }

      setSyncStatus({
        type: 'success',
        message: successMessage
      });
    } catch (err: any) {
      console.error('Manual Sync Error:', err);
      setSyncStatus({
        type: 'error',
        message: `Sinkronisasi gagal: ${err.message || 'Harap periksa koneksi internet.'}`
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSendTestData = async () => {
    setIsSyncing(true);
    setSyncStatus({ type: null, message: '' });
    try {
      const testRecord: ConsultationRecord = {
        id: 'TEST-' + Math.floor(Math.random() * 1000000),
        ticketId: 'TKT-TEST-' + Math.floor(1000 + Math.random() * 9000),
        timestamp: new Date().toLocaleString('id-ID'),
        farmerName: 'UJI COBA SISTEM (AI Studio)',
        phoneNumber: '081234567890',
        address: 'Desa Nule (Simulasi)',
        farmerGroup: 'Poktan Tani Makmur',
        question: 'Pengujian pengiriman data tes otomatis dari aplikasi BPP Nule ke Google Spreadsheet.',
        aiResponse: 'Integrasi sistem Google Spreadsheet & Apps Script berhasil 100%! Data ini berhasil terkirim dan disimpan secara realtime.',
        image: '',
        chatHistory: []
      };

      const res = await fetch('/api/sync/apps-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ record: testRecord })
      });

      if (!res.ok) {
        let errMsg = 'Gagal menghubungi proxy server.';
        try {
          const errData = await res.json();
          if (errData && errData.error) {
            errMsg = errData.error;
          }
        } catch (_) {}
        throw new Error(errMsg);
      }
      
      const responseJson = await res.json();
      if (!responseJson.success) {
        throw new Error(responseJson.error || 'Gagal mengirim data uji coba ke Apps Script.');
      }

      setSyncStatus({
        type: 'success',
        message: 'Kirim Data Tes Berhasil! Menghubungkan ulang ke Google Sheets...'
      });

      // Automatically trigger a fetch/sync to load the sheet rows including this new test row
      setTimeout(async () => {
        try {
          const syncRes = await fetch('/api/sync/apps-script');
          if (syncRes.ok) {
            const syncJson = await syncRes.json();
            if (syncJson.success && Array.isArray(syncJson.data)) {
              const remoteData = syncJson.data;
              const localData: ConsultationRecord[] = JSON.parse(localStorage.getItem('popt_consultation_records') || '[]');
              
              const map = new Map<string, ConsultationRecord>();
              
              localData.forEach(item => {
                if (item.ticketId) map.set(item.ticketId, item);
              });
              
              map.set(testRecord.ticketId, testRecord);

              remoteData.forEach(item => {
                const parsed = parseRemoteItem(item);
                if (parsed) {
                  map.set(parsed.ticketId, parsed);
                }
              });

              const merged = Array.from(map.values()).sort((a, b) => b.id.localeCompare(a.id));
              localStorage.setItem('popt_consultation_records', JSON.stringify(merged));
              setRecords(merged);

              setSyncStatus({
                type: 'success',
                message: 'Data Tes Terkirim & Terbaca Kembali! Silakan periksa Google Spreadsheet Anda.'
              });
            }
          }
        } catch (e) {
          console.error(e);
        } finally {
          setIsSyncing(false);
        }
      }, 1500);

    } catch (err: any) {
      console.error('Test Send Error:', err);
      setSyncStatus({
        type: 'error',
        message: `Gagal mengirim data tes: ${err.message || 'Harap periksa Google Sheets Apps Script Anda.'}`
      });
      setIsSyncing(false);
    }
  };

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
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">No. HP / WhatsApp</p>
                  {selectedRecord.phoneNumber ? (
                    <a 
                      href={`https://wa.me/${selectedRecord.phoneNumber.replace(/[^0-9]/g, '')}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm font-semibold text-green-600 hover:text-green-800 flex items-center space-x-1"
                    >
                      <svg className="w-3.5 h-3.5 text-green-500 fill-current" viewBox="0 0 24 24">
                        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.454L0 24zm6.59-4.846c1.6.95 3.197 1.45 4.817 1.455 5.426 0 9.842-4.414 9.845-9.843.002-2.63-1.023-5.102-2.886-6.966-1.863-1.864-4.337-2.887-6.965-2.888-5.437 0-9.855 4.417-9.858 9.846-.001 1.769.463 3.497 1.344 5.029l-.913 3.328 3.414-.896zM17.9 14.18c-.328-.163-1.933-.953-2.229-1.062-.297-.109-.512-.163-.726.163-.215.327-.83.1.057-.962 1.15-.362.367.135-.61.135-1.15a13.9 13.9 0 0 1-3.412-2.115 11.5 11.5 0 0 1-2.361-2.937c-.24-.41-.025-.63.18-.834.183-.183.41-.477.615-.716.205-.24.273-.41.41-.682.136-.273.068-.512-.034-.716-.103-.205-.727-1.758-1-.24-.103-.298-.445-.41-.593-.41-.183-.002-.544-.047-.716.108-.172.155-.544.505-.544 1.232 0 .727.528 1.429.6  1.525.073.095 1.04 1.587 2.518 2.223.351.151.625.242.84.31.353.111.674.095.928.058.283-.042.83-.34 1.4-.969.34-.338.56-.554.606-.803.114-.15.44-.092.44-.092s.114.18.114.18v.001z"/>
                      </svg>
                      <span>{selectedRecord.phoneNumber}</span>
                    </a>
                  ) : (
                    <p className="text-sm font-medium text-slate-400">-</p>
                  )}
                </div>
                <div className="bg-slate-50 p-3 rounded-xl">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Kelompok Tani</p>
                  <p className="text-sm text-slate-600">{selectedRecord.farmerGroup}</p>
                </div>
                <div className="bg-slate-50 p-3 col-span-2 rounded-xl">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Alamat</p>
                  <p className="text-sm text-slate-600">{selectedRecord.address}</p>
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
          <button
            onClick={handleSync}
            disabled={isSyncing}
            className={`px-4 py-2 text-xs font-black rounded-xl transition-all border flex items-center gap-2 shadow-sm ${
              isSyncing
                ? 'bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed'
                : 'bg-green-50 text-green-700 hover:bg-green-100 border-green-200 hover:border-green-300'
            }`}
            title="Klik untuk menyingkronkan laporon dengan Google Spreadsheet"
          >
            <svg 
              className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 4.75" />
            </svg>
            <span>{isSyncing ? 'Sinkronisasi...' : 'Sinkronisasi Sheets'}</span>
          </button>

          <button
            onClick={handleSendTestData}
            disabled={isSyncing}
            className={`px-4 py-2 text-xs font-black rounded-xl transition-all border flex items-center gap-2 shadow-sm ${
              isSyncing
                ? 'bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed'
                : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200 hover:border-blue-300'
            }`}
            title="Mengirimkan satu baris rekam data simulasi/tes ke Google Spreadsheet Anda secara realtime"
          >
            <svg 
              className="w-3.5 h-3.5 text-blue-500" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
            <span>Kirim Data Tes</span>
          </button>

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

      {syncStatus.type && (
        <div className={`p-4 rounded-xl text-xs font-bold flex items-center justify-between border ${
          syncStatus.type === 'success' 
            ? 'bg-green-50 text-green-800 border-green-100' 
            : 'bg-red-50 text-red-800 border-red-100'
        }`}>
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {syncStatus.type === 'success' ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              )}
            </svg>
            <span>{syncStatus.message}</span>
          </div>
          <button 
            onClick={() => setSyncStatus({ type: null, message: '' })}
            className="text-[10px] underline hover:no-underline font-normal uppercase"
          >
            Tutup
          </button>
        </div>
      )}

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
                        {record.phoneNumber && (
                          <div className="mt-1">
                            <a 
                              href={`https://wa.me/${record.phoneNumber.replace(/[^0-9]/g, '')}`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="inline-flex items-center space-x-1 text-[11px] text-green-600 hover:text-green-800 font-semibold bg-green-50 px-2 py-0.5 rounded-full border border-green-100"
                              title="Hubungi via WhatsApp"
                            >
                              <svg className="w-3 h-3 text-green-500 fill-current" viewBox="0 0 24 24">
                                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.454L0 24zm6.59-4.846c1.6.95 3.197 1.45 4.817 1.455 5.426 0 9.842-4.414 9.845-9.843.002-2.63-1.023-5.102-2.886-6.966-1.863-1.864-4.337-2.887-6.965-2.888-5.437 0-9.855 4.417-9.858 9.846-.001 1.769.463 3.497 1.344 5.029l-.913 3.328 3.414-.896zM17.9 14.18c-.328-.163-1.933-.953-2.229-1.062-.297-.109-.512-.163-.726.163-.215.327-.83.1.057-.962 1.15-.362.367.135-.61.135-1.15a13.9 13.9 0 0 1-3.412-2.115 11.5 11.5 0 0 1-2.361-2.937c-.24-.41-.025-.63.18-.834.183-.183.41-.477.615-.716.205-.24.273-.41.41-.682.136-.273.068-.512-.034-.716-.103-.205-.727-1.758-1-.24-.103-.298-.445-.41-.593-.41-.183-.002-.544-.047-.716.108-.172.155-.544.505-.544 1.232 0 .727.528 1.429.6  1.525.073.095 1.04 1.587 2.518 2.223.351.151.625.242.84.31.353.111.674.095.928.058.283-.042.83-.34 1.4-.969.34-.338.56-.554.606-.803.114-.15.44-.092.44-.092s.114.18.114.18v.001z"/>
                              </svg>
                              <span>{record.phoneNumber}</span>
                            </a>
                          </div>
                        )}
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
