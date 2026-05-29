import React, { useState, useEffect } from 'react';
import { SupabaseService, SupabaseConfigProps } from '../SupabaseService';
import { Database, ShieldCheck, Key, RefreshCw, AlertCircle, CheckCircle2, ChevronDown, ChevronUp, DatabaseBackup, HelpCircle } from 'lucide-react';

interface SupabaseConfigPanelProps {
  tableType: 'penyuluhan' | 'katalog_hama';
  onDataSynced: (data: any[]) => void;
  getLocalData: () => any[];
}

export const SupabaseConfigPanel: React.FC<SupabaseConfigPanelProps> = ({ tableType, onDataSynced, getLocalData }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState<SupabaseConfigProps | null>(null);
  const [inputAnonKey, setInputAnonKey] = useState('');
  const [inputUrl, setInputUrl] = useState('');
  const [inputTableName, setInputTableName] = useState('');
  const [status, setStatus] = useState<'idle' | 'checking' | 'connected' | 'error' | 'unconfigured'>('idle');
  const [statusMsg, setStatusMsg] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncLogs, setSyncLogs] = useState<string[]>([]);
  const [showDocs, setShowDocs] = useState(false);

  // Load configuration on mount
  useEffect(() => {
    loadConfig();
  }, [tableType]);

  const loadConfig = async () => {
    try {
      setStatus('checking');
      const conf = await SupabaseService.getConfig();
      setConfig(conf);
      setInputUrl(conf.url);
      setInputAnonKey(conf.hasKey ? '••••••••••••••••••••••••••••' : '');
      const defaultTable = tableType === 'penyuluhan' ? conf.tablePenyuluhan : conf.tableOptHama;
      setInputTableName(defaultTable);
      
      if (!conf.hasKey) {
        setStatus('unconfigured');
        setStatusMsg('Supabase Anon Key belum diatur. Silakan atur di bawah untuk mengaktifkan sinkronisasi real-time.');
      } else {
        // Try to fetch data to test the actual key & table setup
        try {
          const fetched = await SupabaseService.fetchRemoteData(tableType);
          setStatus('connected');
          setStatusMsg(`Terhubung dengan sukses! Menampilkan ${fetched.length} rekaman langsung dari database.`);
        } catch (err: any) {
          setStatus('error');
          setStatusMsg(`Konfigurasi tersimpan, tetapi gagal memuat tabel "${defaultTable}": ${err.message}`);
        }
      }
    } catch (e: any) {
      setStatus('error');
      setStatusMsg(`Kesalahan sistem: ${e.message}`);
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSyncLogs([]);
    try {
      const payload: any = {
        url: inputUrl,
        ...(tableType === 'penyuluhan' ? { tablePenyuluhan: inputTableName } : { tableOptHama: inputTableName })
      };
      
      // Only set key if it is changed and not placeholder mask
      if (inputAnonKey && !inputAnonKey.startsWith('••••')) {
        payload.anonKey = inputAnonKey;
      }

      await SupabaseService.saveConfig(payload);
      
      // Reload is needed to re-evaluate connection
      const updatedConf = await SupabaseService.getConfig();
      setConfig(updatedConf);
      
      try {
        const fetched = await SupabaseService.fetchRemoteData(tableType);
        setStatus('connected');
        setStatusMsg(`Konfigurasi berhasil disimpan! Berhasil terhubung ke tabel "${inputTableName}" (${fetched.length} baris ditemukan).`);
        onDataSynced(fetched);
      } catch (err: any) {
        setStatus('error');
        setStatusMsg(`Konfigurasi disimpan, tapi koneksi ke tabel "${inputTableName}" gagal: ${err.message}`);
      }
    } catch (err: any) {
      setStatus('error');
      setStatusMsg(`Kesalahan menyimpan konfigurasi: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleFetchFromSupabase = async () => {
    setIsSyncing(true);
    setStatus('checking');
    setStatusMsg('Mengambil data dari Supabase...');
    try {
      const fetched = await SupabaseService.fetchRemoteData(tableType);
      onDataSynced(fetched);
      setStatus('connected');
      setStatusMsg(`Sinkronisasi sukses! Berhasil mengimpor ${fetched.length} baris dari tabel Supabase "${inputTableName}".`);
    } catch (err: any) {
      setStatus('error');
      setStatusMsg(`Gagal memuat data dari Supabase: ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleExportToSupabase = async () => {
    const localData = getLocalData();
    if (localData.length === 0) {
      alert('Tidak ada data lokal saat ini untuk diekspor.');
      return;
    }

    const conf = confirm(`Apakah Anda yakin ingin mengekspor ${localData.length} baris data lokal dan menyisipkannya ke dalam tabel Supabase "${inputTableName}"? Langkah ini akan meng-update atau menambahkan record baru berdasarkan ID.`);
    if (!conf) return;

    setIsSyncing(true);
    setSyncLogs(['Memulai proses unggahan/migrasi data ke Supabase...']);
    try {
      const { successCount, errors } = await SupabaseService.seedRemoteTable(tableType, localData);
      
      const newLogs = [
        `Proses pemisahan selesai.`,
        `✓ Berhasil diunggah: ${successCount} baris.`,
        `✗ Kesalahan/Gagal: ${errors.length} baris.`
      ];
      if (errors.length > 0) {
        newLogs.push('=== Detail Kesalahan ===', ...errors);
      }
      setSyncLogs(newLogs);
      
      // Refetch actual records to update local component state
      try {
        const fetched = await SupabaseService.fetchRemoteData(tableType);
        onDataSynced(fetched);
      } catch (e) {}

      alert(`Sinkronisasi selesai! ${successCount} data berhasil disalin ke tabel Supabase.`);
    } catch (err: any) {
      setSyncLogs(prev => [...prev, `Gagal total dalam migrasi: ${err.message}`]);
      alert(`Migrasi gagal: ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden transition-all duration-300">
      {/* Panel Header */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="px-6 py-4 bg-white/60 hover:bg-white flex items-center justify-between cursor-pointer select-none transition-colors"
      >
        <div className="flex items-center space-x-3">
          <Database className={`w-5 h-5 ${status === 'connected' ? 'text-green-600' : 'text-slate-400 animate-pulse'}`} />
          <div>
            <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <span>Pengaturan & Sinkronisasi Supabase</span>
              {status === 'connected' && (
                <span className="bg-green-50 text-green-700 text-[10px] px-2 py-0.5 rounded-full font-sans border border-green-200">Terhubung</span>
              )}
              {status === 'unconfigured' && (
                <span className="bg-amber-50 text-amber-700 text-[10px] px-2 py-0.5 rounded-full font-sans border border-amber-200">Belum Terhubung</span>
              )}
              {status === 'error' && (
                <span className="bg-red-50 text-red-700 text-[10px] px-2 py-0.5 rounded-full font-sans border border-red-200">Koneksi Error</span>
              )}
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">Integrasi basis data awan real-time untuk {tableType === 'penyuluhan' ? 'materi penyuluhan' : 'katalog hama'}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {status === 'connected' ? (
            <span className="text-xs font-semibold text-green-700 bg-green-50 px-2 py-1 rounded">Live DB Aktif</span>
          ) : (
            <span className="text-xs text-slate-400">Offline / Local Storage</span>
          )}
          {isOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </div>
      </div>

      {/* Panel Expandable Content */}
      {isOpen && (
        <div className="p-6 border-t border-slate-100 bg-slate-50/50 space-y-6">
          {/* Connection Status Badge */}
          <div className={`p-4 rounded-xl flex items-start space-x-3 text-xs leading-relaxed ${
            status === 'connected' ? 'bg-green-50 text-green-800 border border-green-100' :
            status === 'unconfigured' ? 'bg-amber-50 text-amber-800 border border-amber-100' :
            status === 'checking' ? 'bg-slate-100 text-slate-700' :
            'bg-red-50 text-red-800 border border-red-100'
          }`}>
            {status === 'connected' ? (
              <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
            ) : status === 'unconfigured' ? (
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            )}
            <div>
              <p className="font-bold">Status Koneksi:</p>
              <p className="mt-1 text-slate-600">{statusMsg}</p>
            </div>
          </div>

          {/* Setup Instructions Helper Toggle */}
          <div>
            <button 
              type="button"
              onClick={() => setShowDocs(!showDocs)}
              className="text-xs text-green-700 hover:underline flex items-center font-medium"
            >
              <HelpCircle className="w-3.5 h-3.5 mr-1" />
              {showDocs ? 'Sembunyikan Panduan Pembuatan Tabel' : 'Bagaimana cara membuat tabel di Supabase saya?'}
            </button>
            
            {showDocs && (
              <div className="mt-3 p-4 bg-slate-100 border border-slate-200 rounded-xl text-xs space-y-3 text-slate-600 font-mono">
                <p className="font-bold text-slate-800 uppercase text-[10px]">Langkah Membuat Tabel di SQL Editor Supabase:</p>
                {tableType === 'penyuluhan' ? (
                  <div>
                    <p className="text-slate-500 mb-1">Jalankan instruksi SQL berikut untuk membuat tabel 'penyuluhan' (Editor ID 17558):</p>
                    <pre className="p-3 bg-slate-950 text-slate-200 rounded-lg overflow-x-auto text-[11px] leading-relaxed select-all">
{`create table public.penyuluhan (
  id text primary key,
  title text not null,
  type text not null,
  date text,
  author text,
  url text
);

-- Izinkan pembacaan publik tanpa filter
alter table public.penyuluhan enable row level security;
create policy "Izinkan Baca Publik" on public.penyuluhan for select using (true);
create policy "Izinkan CRUD Admin" on public.penyuluhan for all using (true);`}
                    </pre>
                  </div>
                ) : (
                  <div>
                    <p className="text-slate-500 mb-1">Jalankan instruksi SQL berikut untuk membuat tabel 'katalog_hama' (Editor ID 17581):</p>
                    <pre className="p-3 bg-slate-950 text-slate-200 rounded-lg overflow-x-auto text-[11px] leading-relaxed select-all">
{`create table public.katalog_hama (
  id text primary key,
  name text not null,
  host text not null,
  symptoms text,
  control text,
  "imageUrl" text
);

-- Izinkan pembacaan publik tanpa filter
alter table public.katalog_hama enable row level security;
create policy "Izinkan Baca Publik" on public.katalog_hama for select using (true);
create policy "Izinkan CRUD Admin" on public.katalog_hama for all using (true);`}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Form configuration */}
            <form onSubmit={handleSaveConfig} className="space-y-4 bg-white p-5 rounded-xl border border-slate-200">
              <h5 className="font-bold text-xs text-slate-700 flex items-center gap-1.5 border-b pb-2 mb-3">
                <Database className="w-3.5 h-3.5" />
                <span>Konektivitas Supabase</span>
              </h5>
              
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Default / Custom Supabase URL</label>
                <input 
                  required
                  type="url" 
                  value={inputUrl}
                  onChange={(e) => setInputUrl(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-green-500 text-xs font-mono outline-none"
                  placeholder="https://your_project.supabase.co"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex justify-between">
                  <span>Supabase API Anon Key</span>
                  <span className="text-red-500 text-[9px] font-normal italic">Rahasia</span>
                </label>
                <div className="relative">
                  <input 
                    required
                    type="password" 
                    value={inputAnonKey}
                    onChange={(e) => setInputAnonKey(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-green-500 text-xs font-mono outline-none"
                    placeholder="Masukkan Anon Key dari panel Supabase..."
                  />
                  <Key className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Nama Tabel ({tableType === 'penyuluhan' ? 'Editor 17558' : 'Editor 17581'})</label>
                <input 
                  required
                  type="text" 
                  value={inputTableName}
                  onChange={(e) => setInputTableName(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-green-500 text-xs font-mono outline-none text-slate-700"
                  placeholder={tableType === 'penyuluhan' ? 'penyuluhan' : 'katalog_hama'}
                />
              </div>

              <button 
                type="submit"
                disabled={isSaving}
                className="w-full py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs uppercase tracking-wider rounded-lg transition-all flex items-center justify-center shadow disabled:opacity-40"
              >
                {isSaving ? (
                  <>
                    <RefreshCw className="w-3 h-3 mr-1.5 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  'Simpan & Uji Koneksi'
                )}
              </button>
            </form>

            {/* Sync actions block */}
            <div className="space-y-4 bg-white p-5 rounded-xl border border-slate-200 flex flex-col justify-between">
              <div>
                <h5 className="font-bold text-xs text-slate-700 flex items-center gap-1.5 border-b pb-2 mb-3">
                  <ShieldCheck className="w-3.5 h-3.5 text-slate-600" />
                  <span>Aksi Sinkronisasi Data</span>
                </h5>
                <p className="text-[11px] text-slate-500 leading-relaxed mb-4">
                  Gunakan aksi di bawah untuk melakukan pertukaran data dua arah. Jika database Supabase Anda baru dibuat (masih kosong), pilih <b>Ekspor Data Lokal</b> untuk mengisi data instan.
                </p>
                
                <div className="space-y-3">
                  <button 
                    type="button"
                    onClick={handleFetchFromSupabase}
                    disabled={isSyncing || status !== 'connected'}
                    className="w-full py-2 px-3 bg-green-50 text-green-700 hover:bg-green-100 font-bold text-xs rounded-lg transition-all border border-green-200/50 flex items-center justify-center disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
                    Impor / Ambil Data dari Supabase
                  </button>

                  <button 
                    type="button"
                    onClick={handleExportToSupabase}
                    disabled={isSyncing || status !== 'connected'}
                    className="w-full py-2 px-3 bg-amber-50 text-amber-700 hover:bg-amber-100 font-bold text-xs rounded-lg transition-all border border-amber-200/50 flex items-center justify-center disabled:opacity-50"
                  >
                    <DatabaseBackup className="w-3.5 h-3.5 mr-2" />
                    Ekspor Data Lokal ke Supabase ('Seeding')
                  </button>
                </div>
              </div>

              {/* Sync logs output if any */}
              {syncLogs.length > 0 && (
                <div className="mt-4 p-3 bg-slate-900 text-slate-300 font-mono text-[10px] rounded-lg max-h-32 overflow-y-auto space-y-1 select-text">
                  <p className="text-slate-400 font-bold pb-1 border-b border-slate-800">Riwayat Sinkronisasi:</p>
                  {syncLogs.map((log, i) => (
                    <p key={i} className="line-break">{log}</p>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
