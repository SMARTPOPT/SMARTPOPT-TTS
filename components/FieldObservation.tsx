
import React, { useState, useMemo, useEffect } from 'react';
import { Observation, Report } from '../types';
import { GoogleDriveService } from '../GoogleDriveService';

const FieldObservation: React.FC = () => {
  const [activeMethod, setActiveMethod] = useState<'Tetap' | 'Keliling'>('Tetap');
  const [history, setHistory] = useState<Observation[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Official Juknis Configurations
  const [scaleModel, setScaleModel] = useState<'Standard4' | 'DiseaseO9' | 'Mutlak'>('Standard4');
  const [optCategory, setOptCategory] = useState<'Hama' | 'Penyakit' | 'DPI'>('Hama');

  // Generation States
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [previewReport, setPreviewReport] = useState<{
    title: string, 
    summary: string, 
    count: number,
    data: Observation[],
    period: string
  } | null>(null);

  // Common Fields for Daily Input
  const [commonData, setCommonData] = useState({
    village: '',
    subDistrict: '',
    blockName: '',
    cropType: '',
    variety: '',
    optName: '',
    date: new Date().toISOString().split('T')[0],
    hst: '',
    weather: 'Cerah',
    landCondition: '',
    phtRecommendation: '',
    pesticideRecommendation: '',
    plantedArea: '',
    pestPopulation: '',
    naturalEnemyPopulation: '',
    season: 'MH',
    notes: ''
  });

  // Method Specific: Tetap
  const [tetapData, setTetapData] = useState({
    totalPlants: 50,
    cat1: 0,
    cat2: 0,
    cat3: 0,
    cat4: 0,
    cat5: 0,
    cat7: 0,
    cat9: 0,
    catMutlak: 0
  });

  // Method Specific: Keliling
  const [kelilingData, setKelilingData] = useState({
    luasWaspada: 0,
    luasSerang: 0,
    kepadatanPopulasi: 0
  });

  useEffect(() => {
    const loadData = async () => {
      const status = await GoogleDriveService.getStatus();
      if (status.connected) {
        const driveData = await GoogleDriveService.fetchData<Observation[]>('observations.json');
        if (driveData) {
          setHistory(driveData);
          localStorage.setItem('popt_observations', JSON.stringify(driveData));
          return;
        }
      }
      
      const saved = localStorage.getItem('popt_observations');
      if (saved) setHistory(JSON.parse(saved));
    };
    
    loadData();
  }, []);

  const saveHistory = async (data: Observation[]) => {
    setHistory(data);
    localStorage.setItem('popt_observations', JSON.stringify(data));
    
    const status = await GoogleDriveService.getStatus();
    if (status.connected) {
      await GoogleDriveService.saveData('observations.json', data);
    }
  };

  const calculateIntensityEx = (
    method: 'Tetap' | 'Keliling',
    data: any,
    scaling: 'Standard4' | 'DiseaseO9' | 'Mutlak'
  ) => {
    if (method === 'Tetap') {
      if (scaling === 'Mutlak') {
        const n = Number(data.catMutlak) || 0;
        const N = Number(data.totalPlants) || 1;
        return N > 0 ? (n / N) * 100 : 0;
      } else if (scaling === 'DiseaseO9') {
        const sumNV = 
          ((Number(data.cat1) || 0) * 1) + 
          ((Number(data.cat3) || 0) * 3) + 
          ((Number(data.cat5) || 0) * 5) + 
          ((Number(data.cat7) || 0) * 7) + 
          ((Number(data.cat9) || 0) * 9);
        const denominator = (Number(data.totalPlants) || 1) * 9;
        return denominator > 0 ? (sumNV / denominator) * 100 : 0;
      } else { // Standard4
        const sumNV = 
          ((Number(data.cat1) || 0) * 1) + 
          ((Number(data.cat2) || 0) * 2) + 
          ((Number(data.cat3) || 0) * 3) + 
          ((Number(data.cat4) || 0) * 4);
        const denominator = (Number(data.totalPlants) || 1) * 4;
        return denominator > 0 ? (sumNV / denominator) * 100 : 0;
      }
    } else {
      const wasp = Number(data.luasWaspada) || 0;
      const ser = Number(data.luasSerang) || 0;
      return wasp > 0 ? (ser / wasp) * 100 : 0;
    }
  };

  const calculateIntensity = () => {
    return calculateIntensityEx(activeMethod, activeMethod === 'Tetap' ? tetapData : kelilingData, scaleModel);
  };

  const getCategoryEx = (p: number, category: 'Hama' | 'Penyakit' | 'DPI') => {
    if (category === 'Penyakit') {
      if (p <= 11) return 'Ringan';
      if (p <= 25) return 'Sedang';
      if (p <= 85) return 'Berat';
      return 'Puso';
    } else { // Hama / DPI / Kekeringan
      if (p <= 25) return 'Ringan';
      if (p <= 50) return 'Sedang';
      if (p <= 85) return 'Berat';
      return 'Puso';
    }
  };

  const getCategory = (p: number) => {
    return getCategoryEx(p, optCategory);
  };

  const generateAutoRecommendation = () => {
    const opt = commonData.optName.toLowerCase();
    const intensity = calculateIntensity();
    
    let pht = '';
    let pesticide = '';

    if (opt.includes('lalat buah')) {
      pht = 'Pemasangan perangkap metil eugenol (15-20 titik/Ha), sanitasi lahan dengan mengubur buah yang terserang, penggunaan mulsa plastik.';
      pesticide = 'Abamektin (Demolish), Imidakloprid (Confidor), atau Deltametrin (Decis) jika intensitas > 10%.';
    } else if (opt.includes('wereng')) {
      pht = 'Pengaturan jarak tanam (Legowo), pengeringan berkala pada lahan, pemanfaatan musuh alami (Laba-laba, Lycosa).';
      pesticide = 'Pimetrozin (Chess), Buprofezin (Applaud), atau Dinotefuran (Oshin).';
    } else if (opt.includes('ulat grayak') || opt.includes('spodoptera')) {
      pht = 'Pengumpulan kelompok telur secara manual, penggunaan agens hayati Beauveria bassiana atau NPV, pemasangan light trap.';
      pesticide = 'Klorantraniliprol (Prevathon), Emamektin Benzoat (Emma), atau Spinetoram (Exalt).';
    } else if (opt.includes('trip') || opt.includes('thrips')) {
      pht = 'Pemasangan yellow sticky trap (40-50 lembar/Ha), penggunaan mulsa perak, pengairan yang cukup.';
      pesticide = 'Abamektin, Spinetoram, atau Fipronil.';
    } else if (opt.includes('busuk buah') || opt.includes('antraknosa')) {
      pht = 'Perbaikan drainase, pengurangan dosis pupuk N tinggi, pembuangan bagian tanaman yang sakit.';
      pesticide = 'Fungisida berbahan aktif Azoksistrobin (Amistartop), Mankozeb (Dithane), atau Tembaga Hidroksida (Funguran).';
    } else if (opt.includes('tikus')) {
      pht = 'Gropyokan massal, pemasangan TBS (Trap Barrier System), sanitasi habitat (pematang), pelestarian burung hantu (Tyto alba).';
      pesticide = 'Rodentisida antikoagulan (Klerat) atau pengemposan belerang.';
    } else {
      pht = 'Lakukan pengamatan rutin, sanitasi lingkungan, dan pemanfaatan musuh alami di sekitar lahan.';
      pesticide = 'Gunakan pestisida terdaftar sesuai ambang kendali jika diperlukan.';
    }

    setCommonData(prev => ({
      ...prev,
      phtRecommendation: pht,
      pesticideRecommendation: pesticide
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const p = calculateIntensity();
    const category = getCategory(p);

    const newObs: Observation = {
      id: `OBS-${Date.now()}`,
      method: activeMethod,
      intensity: Number(p.toFixed(2)),
      category: category as any,
      ...commonData,
      hst: commonData.hst ? Number(commonData.hst) : undefined,
      plantedArea: commonData.plantedArea ? Number(commonData.plantedArea) : undefined,
      pestPopulation: commonData.pestPopulation ? Number(commonData.pestPopulation) : undefined,
      naturalEnemyPopulation: commonData.naturalEnemyPopulation ? Number(commonData.naturalEnemyPopulation) : undefined,
      details: activeMethod === 'Tetap' ? { ...tetapData, scaleModel, optCategory } : { ...kelilingData, optCategory }
    };

    saveHistory([newObs, ...history]);
    setIsAdding(false);
    setCommonData({ 
      village: '', 
      subDistrict: '',
      blockName: '',
      cropType: '', 
      variety: '',
      optName: '', 
      date: new Date().toISOString().split('T')[0],
      hst: '',
      weather: 'Cerah',
      landCondition: '',
      phtRecommendation: '',
      pesticideRecommendation: '',
      plantedArea: '',
      pestPopulation: '',
      naturalEnemyPopulation: '',
      season: 'MH',
      notes: ''
    });
  };

  // Preview Generation Logic
  const handlePreviewReport = () => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (start > end) {
      alert("Tanggal awal tidak boleh lebih besar dari tanggal akhir.");
      return;
    }

    const filteredObs = history.filter(obs => {
      const obsDate = new Date(obs.date);
      return obsDate >= start && obsDate <= end;
    });

    if (filteredObs.length === 0) {
      alert(`Tidak ada data pengamatan harian dalam periode terpilih.`);
      return;
    }

    const avgIntensity = filteredObs.reduce((sum, o) => sum + o.intensity, 0) / filteredObs.length;
    const uniqueVillages = Array.from(new Set(filteredObs.map(o => o.village)));
    const uniqueOPTs = Array.from(new Set(filteredObs.map(o => o.optName)));
    const uniqueCrops = Array.from(new Set(filteredObs.map(o => o.cropType)));

    const title = `Laporan Rekapitulasi POPT (${startDate} s/d ${endDate})`;
    const summary = `Laporan periode ini mencakup ${filteredObs.length} pengamatan harian. 
Rata-rata intensitas serangan di seluruh titik: ${avgIntensity.toFixed(2)}%. 
Lokasi terdampak mencakup Desa: ${uniqueVillages.join(', ')}. 
Komoditas yang diamati: ${uniqueCrops.join(', ')}. 
Jenis OPT yang terpantau: ${uniqueOPTs.join(', ')}.`;

    setPreviewReport({ 
      title, 
      summary, 
      count: filteredObs.length, 
      data: filteredObs,
      period: `${startDate} - ${endDate}`
    });
  };

  const finalizeReport = async () => {
    if (!previewReport) return;

    const now = new Date();
    const newReport: Report = {
      id: `GEN-${Date.now()}`,
      title: previewReport.title,
      date: now.toISOString().split('T')[0],
      category: 'Periodik',
      summary: previewReport.summary,
      url: '#' 
    };

    const existingReports: Report[] = JSON.parse(localStorage.getItem('popt_reports') || '[]');
    const updatedReports = [newReport, ...existingReports];
    localStorage.setItem('popt_reports', JSON.stringify(updatedReports));
    
    const status = await GoogleDriveService.getStatus();
    if (status.connected) {
      await GoogleDriveService.saveData('reports.json', updatedReports);
    }
    
    alert(`Laporan berhasil disimpan ke Arsip.`);
    setPreviewReport(null);
    setIsGenerating(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header Method Toggle */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-slate-800">Manajemen Pengamatan Lapangan</h3>
          <p className="text-sm text-slate-500">Input data harian atau generate laporan rekapitulasi periodik</p>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-xl">
          <button 
            onClick={() => { setActiveMethod('Tetap'); setIsAdding(false); setIsGenerating(false); }}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeMethod === 'Tetap' && !isGenerating ? 'bg-white text-green-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Pengamatan Tetap
          </button>
          <button 
            onClick={() => { setActiveMethod('Keliling'); setIsAdding(false); setIsGenerating(false); }}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeMethod === 'Keliling' && !isGenerating ? 'bg-white text-green-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Pengamatan Keliling
          </button>
        </div>
      </div>

      {/* Main Action Cards */}
      {!isAdding && !isGenerating && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div 
            className="bg-green-600 p-6 rounded-2xl text-white shadow-lg relative overflow-hidden group cursor-pointer h-full"
            onClick={() => setIsAdding(true)}
          >
            <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:scale-110 transition-transform">
              <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 24 24"><path d="M12 4v16m8-8H4" /></svg>
            </div>
            <h4 className="text-lg font-bold">Input Pengamatan</h4>
            <p className="text-green-100 text-xs mt-1">Catat hasil pengamatan harian petugas di lapangan.</p>
            <div className="mt-8 flex items-center text-[10px] font-bold uppercase tracking-widest bg-green-700/50 w-fit px-3 py-1 rounded-full">
              Buka Form Input
            </div>
          </div>

          <div 
            className="bg-blue-600 p-6 rounded-2xl text-white shadow-lg relative overflow-hidden group cursor-pointer h-full"
            onClick={() => setIsGenerating(true)}
          >
            <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:scale-110 transition-transform">
              <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 24 24"><path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
            </div>
            <h4 className="text-lg font-bold">Rekap Laporan</h4>
            <p className="text-blue-100 text-xs mt-1">Sintesa otomatis data harian ke laporan periodik.</p>
            <div className="mt-8 flex items-center text-[10px] font-bold uppercase tracking-widest bg-blue-700/50 w-fit px-3 py-1 rounded-full">
              Generator Laporan
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-center h-full">
            <div className="flex justify-between items-center mb-4">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status Database</span>
              <span className="text-green-600 font-bold text-lg">{history.length} Data</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-slate-50 p-2 rounded-lg text-center border border-slate-100">
                <p className="text-[10px] text-slate-400 font-bold uppercase">Metode Tetap</p>
                <p className="font-bold text-slate-700">{history.filter(h => h.method === 'Tetap').length}</p>
              </div>
              <div className="bg-slate-50 p-2 rounded-lg text-center border border-slate-100">
                <p className="text-[10px] text-slate-400 font-bold uppercase">Keliling</p>
                <p className="font-bold text-slate-700">{history.filter(h => h.method === 'Keliling').length}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Generator UI */}
      {isGenerating && (
        <div className="bg-white p-8 rounded-2xl border-2 border-blue-100 shadow-xl animate-in slide-in-from-top-4 duration-300">
          <div className="flex justify-between items-center mb-6">
            <h4 className="text-lg font-bold text-slate-800">Generator Laporan Rekapitulasi</h4>
            <button onClick={() => { setIsGenerating(false); setPreviewReport(null); }} className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-50 rounded-full">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Dari Tanggal (Mulai Periode)</label>
                <input 
                  type="date" 
                  value={startDate} 
                  onChange={e => { setStartDate(e.target.value); setPreviewReport(null); }}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Sampai Tanggal (Akhir Periode)</label>
                <input 
                  type="date" 
                  value={endDate} 
                  onChange={e => { setEndDate(e.target.value); setPreviewReport(null); }}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>

            <div className="flex justify-center py-4">
              <button 
                onClick={handlePreviewReport}
                className="px-10 py-3 bg-slate-800 text-white font-bold rounded-xl shadow-lg hover:bg-slate-900 transition-all flex items-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                <span>Lihat Pratinjau Rekapitulasi</span>
              </button>
            </div>

            {previewReport && (
              <div className="bg-white p-8 rounded-2xl border-2 border-slate-200 shadow-2xl animate-in zoom-in-95 duration-300 max-w-6xl mx-auto overflow-hidden print:p-0 print:shadow-none print:border-none">
                {/* Formal Report Header */}
                <div className="text-center mb-8">
                  <h2 className="text-xl font-bold uppercase tracking-tight text-slate-900">KEADAAN OPT PADA PETAK PENGAMATAN TETAP</h2>
                  <h3 className="text-sm font-bold text-slate-700 mt-1 uppercase tracking-wider">
                    (PADI / JAGUNG / KEDELAI/ KACANG TANAH/KACANG HIJAU/UBI KAYU /UBI JALAR/ PORANG)
                  </h3>
                </div>

                <div className="grid grid-cols-1 gap-1 mb-8 text-xs font-medium">
                  <div className="flex">
                    <span className="w-48">WILAYAH PENGAM. (KECAMATAN)</span>
                    <span className="mr-2">:</span>
                    <span className="border-b border-dotted border-slate-400 flex-1">{previewReport.data[0]?.subDistrict || '................................'}</span>
                  </div>
                  <div className="flex">
                    <span className="w-48">KABUPATEN/KOTA</span>
                    <span className="mr-2">:</span>
                    <span className="border-b border-dotted border-slate-400 flex-1">ALOR</span>
                  </div>
                  <div className="flex">
                    <span className="w-48">PERIODE PENGAMATAN 1)</span>
                    <span className="mr-2">:</span>
                    <span className="border-b border-dotted border-slate-400 flex-1">{previewReport.period}</span>
                  </div>
                  <div className="flex">
                    <span className="w-48">MUSIM TANAM 2)</span>
                    <span className="mr-2">:</span>
                    <span className="border-b border-dotted border-slate-400 flex-1">{previewReport.data[0]?.season || '................................'}</span>
                  </div>
                </div>

                <div className="overflow-x-auto mb-8 border border-slate-800">
                  <table className="w-full text-[10px] border-collapse border border-slate-800">
                    <thead>
                      <tr className="bg-slate-50 uppercase font-bold">
                        <th rowSpan={2} className="px-1 py-2 border border-slate-800 text-center w-8">NO</th>
                        <th rowSpan={2} className="px-1 py-2 border border-slate-800 text-center">DESA</th>
                        <th rowSpan={2} className="px-1 py-2 border border-slate-800 text-center">KOMODITAS</th>
                        <th rowSpan={2} className="px-1 py-2 border border-slate-800 text-center">LUAS TANAM (HA)</th>
                        <th rowSpan={2} className="px-1 py-2 border border-slate-800 text-center">VARIETAS</th>
                        <th rowSpan={2} className="px-1 py-2 border border-slate-800 text-center">UMUR TANAMAN (HST)</th>
                        <th rowSpan={2} className="px-1 py-2 border border-slate-800 text-center">JENIS OPT</th>
                        <th rowSpan={2} className="px-1 py-2 border border-slate-800 text-center">INTENSIT AS (%)</th>
                        <th colSpan={2} className="px-1 py-2 border border-slate-800 text-center">KEPADATAN POPULASI / 10 RUMPUN</th>
                        <th rowSpan={2} className="px-1 py-2 border border-slate-800 text-center">KETERANGAN 4)</th>
                      </tr>
                      <tr className="bg-slate-50 uppercase font-bold">
                        <th className="px-1 py-2 border border-slate-800 text-center">SERANGGA PENGGANGGU</th>
                        <th className="px-1 py-2 border border-slate-800 text-center">MUSUH ALAMI 3)</th>
                      </tr>
                      <tr className="bg-yellow-100 text-[8px] font-bold italic">
                        <th className="border border-slate-800 text-center">1</th>
                        <th className="border border-slate-800 text-center">2</th>
                        <th className="border border-slate-800 text-center">3</th>
                        <th className="border border-slate-800 text-center">4</th>
                        <th className="border border-slate-800 text-center">5</th>
                        <th className="border border-slate-800 text-center">6</th>
                        <th className="border border-slate-800 text-center">7</th>
                        <th className="border border-slate-800 text-center">8</th>
                        <th className="border border-slate-800 text-center">9</th>
                        <th className="border border-slate-800 text-center">10</th>
                        <th className="border border-slate-800 text-center">11</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previewReport.data.map((obs, idx) => (
                        <tr key={obs.id}>
                          <td className="px-1 py-2 border border-slate-800 text-center">{idx + 1}</td>
                          <td className="px-1 py-2 border border-slate-800">{obs.village}</td>
                          <td className="px-1 py-2 border border-slate-800">{obs.cropType}</td>
                          <td className="px-1 py-2 border border-slate-800 text-center">{obs.plantedArea || '-'}</td>
                          <td className="px-1 py-2 border border-slate-800">{obs.variety || '-'}</td>
                          <td className="px-1 py-2 border border-slate-800 text-center">{obs.hst || '-'}</td>
                          <td className="px-1 py-2 border border-slate-800">{obs.optName}</td>
                          <td className="px-1 py-2 border border-slate-800 text-center font-bold">{obs.intensity.toFixed(2)}%</td>
                          <td className="px-1 py-2 border border-slate-800 text-center">{obs.pestPopulation || '-'}</td>
                          <td className="px-1 py-2 border border-slate-800 text-center">{obs.naturalEnemyPopulation || '-'}</td>
                          <td className="px-1 py-2 border border-slate-800 text-[8px]">{obs.notes || '-'}</td>
                        </tr>
                      ))}
                      {previewReport.data.length === 0 && (
                        <tr>
                          <td colSpan={11} className="px-1 py-8 border border-slate-800 text-center text-slate-400 italic">Tidak ada data</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="grid grid-cols-2 gap-8 text-[9px] font-medium leading-relaxed mb-8">
                  <div className="space-y-1">
                    <p className="font-bold underline">KETERANGAN :</p>
                    <p>1) Periode Pengamatan I: tgl 1-15 / Pengamatan II: tgl 16-31</p>
                    <p>2) Musim Tanam (MK/MH/Rendeng/Gadu)</p>
                    <p>3) Total Musuh alami yg efektif</p>
                    <p>4) Sebutkan musuh alami yang diamati</p>
                  </div>
                  <div className="text-right space-y-12">
                    <div>
                      <p>........................, ........................ 20....</p>
                      <p className="mr-12">POPT,</p>
                    </div>
                    <div className="mr-4">
                      <p className="font-bold underline">......................................................</p>
                      <p>NIP. ...............................................</p>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 mb-8 print:hidden">
                  <h6 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Sintesa Laporan (AI Generated Summary)</h6>
                  <p className="text-sm text-slate-700 leading-relaxed italic">
                    {previewReport.summary}
                  </p>
                </div>

                <div className="flex flex-col md:flex-row justify-between items-center gap-4 pt-6 border-t border-slate-100 print:hidden">
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => window.print()}
                      className="px-6 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-all flex items-center"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 00-2 2h2m2 4h10a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v2" /></svg>
                      Cetak Laporan
                    </button>
                    <button 
                      onClick={() => setPreviewReport(null)}
                      className="px-6 py-2.5 text-slate-400 font-bold hover:text-slate-600 transition-all"
                    >
                      Batal
                    </button>
                  </div>
                  <button 
                    onClick={finalizeReport}
                    className="w-full md:w-auto px-10 py-3 bg-green-600 text-white font-bold rounded-xl shadow-xl shadow-green-100 hover:bg-green-700 transition-all flex items-center justify-center"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    Simpan ke Arsip Digital
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Input Form */}
      {isAdding && (
        <div className="bg-white p-8 rounded-2xl border border-green-100 shadow-xl animate-in slide-in-from-top-4 duration-300">
          <div className="flex justify-between items-center mb-8">
            <h4 className="text-lg font-bold text-slate-800">Form Input Pengamatan {activeMethod}</h4>
            <button onClick={() => setIsAdding(false)} className="text-slate-400 hover:text-slate-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase">Kecamatan</label>
                <input required type="text" value={commonData.subDistrict} onChange={e => setCommonData({...commonData, subDistrict: e.target.value})} placeholder="Kecamatan..." className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none text-sm" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase">Desa/Lokasi</label>
                <input required type="text" value={commonData.village} onChange={e => setCommonData({...commonData, village: e.target.value})} placeholder="Desa Nule..." className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none text-sm" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase">Blok/Hamparan</label>
                <input type="text" value={commonData.blockName} onChange={e => setCommonData({...commonData, blockName: e.target.value})} placeholder="Blok..." className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none text-sm" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase">Jenis Tanaman</label>
                <input required type="text" value={commonData.cropType} onChange={e => setCommonData({...commonData, cropType: e.target.value})} placeholder="Cabai Rawit..." className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none text-sm" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase">Varietas</label>
                <input type="text" value={commonData.variety} onChange={e => setCommonData({...commonData, variety: e.target.value})} placeholder="Varietas..." className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none text-sm" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase">Luas Tanam (Ha)</label>
                <input type="number" step="0.01" value={commonData.plantedArea} onChange={e => setCommonData({...commonData, plantedArea: e.target.value})} placeholder="Ha..." className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none text-sm" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase">Musim Tanam</label>
                <select value={commonData.season} onChange={e => setCommonData({...commonData, season: e.target.value})} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none text-sm">
                  <option value="MH">MH (Musim Hujan)</option>
                  <option value="MK">MK (Musim Kemarau)</option>
                  <option value="Rendeng">Rendeng</option>
                  <option value="Gadu">Gadu</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase">Nama OPT</label>
                <input required type="text" value={commonData.optName} onChange={e => setCommonData({...commonData, optName: e.target.value})} placeholder="Lalat Buah..." className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none text-sm" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase">HST Tanaman</label>
                <input type="number" value={commonData.hst} onChange={e => setCommonData({...commonData, hst: e.target.value})} placeholder="Hari..." className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none text-sm" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase">Populasi Hama / 10 Rumpun</label>
                <input type="number" value={commonData.pestPopulation} onChange={e => setCommonData({...commonData, pestPopulation: e.target.value})} placeholder="Ekor..." className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none text-sm" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase">Populasi Musuh Alami / 10 Rumpun</label>
                <input type="number" value={commonData.naturalEnemyPopulation} onChange={e => setCommonData({...commonData, naturalEnemyPopulation: e.target.value})} placeholder="Ekor..." className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none text-sm" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase">Cuaca</label>
                <select value={commonData.weather} onChange={e => setCommonData({...commonData, weather: e.target.value})} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none text-sm">
                  <option value="Cerah">Cerah</option>
                  <option value="Berawan">Berawan</option>
                  <option value="Hujan Ringan">Hujan Ringan</option>
                  <option value="Hujan Lebat">Hujan Lebat</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase">Tanggal</label>
                <input required type="date" value={commonData.date} onChange={e => setCommonData({...commonData, date: e.target.value})} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none text-sm" />
              </div>
              <div className="space-y-1 md:col-span-2 lg:col-span-3 xl:col-span-4">
                <label className="text-xs font-bold text-slate-400 uppercase">Keterangan / Catatan Lapangan</label>
                <textarea value={commonData.notes} onChange={e => setCommonData({...commonData, notes: e.target.value})} placeholder="Catatan tambahan..." className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none text-sm h-20" />
              </div>
            </div>

            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
              <h5 className="font-bold text-slate-700 mb-4 flex items-center text-sm">
                <svg className="w-4 h-4 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                Data Teknis ({activeMethod}) sesuai Juknis OPT-DPI
              </h5>

              {/* Juknis Specific Model Selector */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Kategori OPT / Kejadian (Juknis Tabel 4 & 5)</label>
                  <select 
                    value={optCategory} 
                    onChange={e => setOptCategory(e.target.value as any)} 
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none text-sm font-semibold text-slate-700"
                  >
                    <option value="Hama">Hama (Tabel 4 Juknis: Ringan &le; 25%, Sedang &le; 50%, Berat &le; 85%)</option>
                    <option value="Penyakit">Penyakit (Tabel 5 Juknis: Ringan &le; 11%, Sedang &le; 25%, Berat &le; 85%)</option>
                    <option value="DPI">Dampak Perubahan Iklim (Kekeringan / Banjir / Bencana)</option>
                  </select>
                </div>
                {activeMethod === 'Tetap' && (
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Model Skala Kerusakan (Juknis Hal 34, 45)</label>
                    <select 
                      value={scaleModel} 
                      onChange={e => setScaleModel(e.target.value as any)} 
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none text-sm font-semibold text-slate-700"
                    >
                      <option value="Standard4">Standard Skala 0 - 4 (Z = 4; Juknis Hal 34)</option>
                      <option value="DiseaseO9">Skala Tidak Mutlak 0, 1, 3, 5, 7, 9 (Z = 9; Juknis Hal 45)</option>
                      <option value="Mutlak">Kerusakan Mutlak / Counts (Sundep/Beluk/Puso - Z = 1; Juknis Hal 43)</option>
                    </select>
                  </div>
                )}
              </div>

              {activeMethod === 'Tetap' ? (
                <div>
                  {scaleModel === 'Mutlak' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Jumlah Tanaman Contoh (N)</label>
                        <input type="number" value={tetapData.totalPlants} onChange={e => setTetapData({...tetapData, totalPlants: Number(e.target.value)})} className="w-full px-3 py-2 border rounded-lg text-sm bg-white" placeholder="Contoh: 50" />
                      </div>
                      <div className="space-y-1 text-red-600">
                        <label className="text-[10px] font-bold uppercase">Jumlah Tanaman Rusak Mutlak (n)</label>
                        <input type="number" value={tetapData.catMutlak} onChange={e => setTetapData({...tetapData, catMutlak: Number(e.target.value)})} className="w-full px-3 py-2 border border-red-200 rounded-lg text-sm bg-white" placeholder="Contoh: 5" />
                      </div>
                    </div>
                  ) : scaleModel === 'DiseaseO9' ? (
                    <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                      <div className="col-span-2 md:col-span-1 space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Total Tanaman (N)</label>
                        <input type="number" value={tetapData.totalPlants} onChange={e => setTetapData({...tetapData, totalPlants: Number(e.target.value)})} className="w-full px-3 py-2 border rounded-lg text-sm bg-white" />
                      </div>
                      <div className="space-y-1 text-green-600">
                        <label className="text-[10px] font-bold uppercase">Skala 1</label>
                        <input type="number" value={tetapData.cat1} onChange={e => setTetapData({...tetapData, cat1: Number(e.target.value)})} className="w-full px-3 py-2 border border-green-200 rounded-lg text-sm bg-white" />
                      </div>
                      <div className="space-y-1 text-amber-600">
                        <label className="text-[10px] font-bold uppercase">Skala 3</label>
                        <input type="number" value={tetapData.cat3} onChange={e => setTetapData({...tetapData, cat3: Number(e.target.value)})} className="w-full px-3 py-2 border border-amber-200 rounded-lg text-sm bg-white" />
                      </div>
                      <div className="space-y-1 text-orange-600">
                        <label className="text-[10px] font-bold uppercase">Skala 5</label>
                        <input type="number" value={tetapData.cat5} onChange={e => setTetapData({...tetapData, cat5: Number(e.target.value)})} className="w-full px-3 py-2 border border-orange-200 rounded-lg text-sm bg-white" />
                      </div>
                      <div className="space-y-1 text-red-500">
                        <label className="text-[10px] font-bold uppercase">Skala 7</label>
                        <input type="number" value={tetapData.cat7} onChange={e => setTetapData({...tetapData, cat7: Number(e.target.value)})} className="w-full px-3 py-2 border border-red-200 rounded-lg text-sm bg-white" />
                      </div>
                      <div className="space-y-1 text-red-700">
                        <label className="text-[10px] font-bold uppercase">Skala 9</label>
                        <input type="number" value={tetapData.cat9} onChange={e => setTetapData({...tetapData, cat9: Number(e.target.value)})} className="w-full px-3 py-2 border border-red-300 rounded-lg text-sm bg-white" />
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Total Tanaman (N)</label>
                        <input type="number" value={tetapData.totalPlants} onChange={e => setTetapData({...tetapData, totalPlants: Number(e.target.value)})} className="w-full px-3 py-2 border rounded-lg text-sm bg-white" />
                      </div>
                      <div className="space-y-1 text-green-600">
                        <label className="text-[10px] font-bold uppercase">Skala 1</label>
                        <input type="number" value={tetapData.cat1} onChange={e => setTetapData({...tetapData, cat1: Number(e.target.value)})} className="w-full px-3 py-2 border border-green-200 rounded-lg text-sm bg-white" />
                      </div>
                      <div className="space-y-1 text-amber-600">
                        <label className="text-[10px] font-bold uppercase">Skala 2</label>
                        <input type="number" value={tetapData.cat2} onChange={e => setTetapData({...tetapData, cat2: Number(e.target.value)})} className="w-full px-3 py-2 border border-amber-200 rounded-lg text-sm bg-white" />
                      </div>
                      <div className="space-y-1 text-orange-600">
                        <label className="text-[10px] font-bold uppercase">Skala 3</label>
                        <input type="number" value={tetapData.cat3} onChange={e => setTetapData({...tetapData, cat3: Number(e.target.value)})} className="w-full px-3 py-2 border border-orange-200 rounded-lg text-sm bg-white" />
                      </div>
                      <div className="space-y-1 text-red-600">
                        <label className="text-[10px] font-bold uppercase">Skala 4</label>
                        <input type="number" value={tetapData.cat4} onChange={e => setTetapData({...tetapData, cat4: Number(e.target.value)})} className="w-full px-3 py-2 border border-red-200 rounded-lg text-sm bg-white" />
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Luas Waspada (Ha)</label>
                    <input type="number" step="0.01" value={kelilingData.luasWaspada} onChange={e => setKelilingData({...kelilingData, luasWaspada: Number(e.target.value)})} className="w-full px-3 py-2 border rounded-lg text-sm" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Luas Terserang (Ha)</label>
                    <input type="number" step="0.01" value={kelilingData.luasSerang} onChange={e => setKelilingData({...kelilingData, luasSerang: Number(e.target.value)})} className="w-full px-3 py-2 border rounded-lg text-sm" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Populasi (Ekor/Tanaman)</label>
                    <input type="number" value={kelilingData.kepadatanPopulasi} onChange={e => setKelilingData({...kelilingData, kepadatanPopulasi: Number(e.target.value)})} className="w-full px-3 py-2 border rounded-lg text-sm" />
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase">Kondisi Lahan</label>
                <textarea value={commonData.landCondition} onChange={e => setCommonData({...commonData, landCondition: e.target.value})} placeholder="Contoh: Lahan lembab, drainase kurang baik..." className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none text-sm h-20" />
              </div>
              <div className="space-y-1">
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-bold text-slate-400 uppercase">Rekomendasi PHT</label>
                  <button 
                    type="button" 
                    onClick={generateAutoRecommendation}
                    className="text-[10px] font-bold text-blue-600 hover:text-blue-800 flex items-center bg-blue-50 px-2 py-1 rounded transition-colors"
                    title="Generate otomatis berdasarkan OPT"
                  >
                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                    Auto-Generate
                  </button>
                </div>
                <textarea value={commonData.phtRecommendation} onChange={e => setCommonData({...commonData, phtRecommendation: e.target.value})} placeholder="Contoh: Pembersihan gulma, pemasangan perangkap..." className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none text-sm h-20" />
              </div>
              <div className="space-y-1 md:col-span-2">
                <label className="text-xs font-bold text-slate-400 uppercase">Rekomendasi Bahan Aktif / Obat & Merek Dagang</label>
                <input type="text" value={commonData.pesticideRecommendation} onChange={e => setCommonData({...commonData, pesticideRecommendation: e.target.value})} placeholder="Contoh: Abamektin (Demolish), Imidakloprid (Confidor)..." className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none text-sm" />
              </div>
            </div>

            <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-6 bg-green-50 rounded-2xl border border-green-200">
               <div>
                  <h6 className="text-xs font-bold text-green-800 uppercase mb-1 tracking-widest">Analisa Intensitas Attack Harian</h6>
                  <p className="text-2xl font-black text-green-900">{calculateIntensity().toFixed(2)}% Intensitas</p>
                  <span className={`inline-block px-3 py-1 mt-2 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    getCategory(calculateIntensity()) === 'Ringan' ? 'bg-green-200 text-green-800' : 
                    getCategory(calculateIntensity()) === 'Sedang' ? 'bg-amber-200 text-amber-800' : 'bg-red-200 text-red-800'
                  }`}>
                    Kategori: {getCategory(calculateIntensity())}
                  </span>
               </div>
               <div className="flex space-x-3">
                  <button type="button" onClick={() => setIsAdding(false)} className="px-6 py-2 text-sm font-bold text-slate-500 hover:text-slate-700">Batal</button>
                  <button type="submit" className="px-10 py-3 bg-green-600 text-white font-bold rounded-xl shadow-lg shadow-green-200 hover:bg-green-700 transition-all">
                    Simpan Data Harian
                  </button>
               </div>
            </div>
          </form>
        </div>
      )}

      {/* Database View Section */}
      {!isAdding && !isGenerating && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-50 flex justify-between items-center">
            <h4 className="font-bold text-slate-800 text-sm md:text-base">Database Pengamatan Harian</h4>
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Real-time DB</span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b">
                  <th className="px-6 py-4">Tanggal & Lokasi</th>
                  <th className="px-6 py-4">Komoditas & Varietas</th>
                  <th className="px-6 py-4">OPT</th>
                  <th className="px-6 py-4">Metode</th>
                  <th className="px-6 py-4">Hasil Analisa</th>
                  <th className="px-6 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {history.length > 0 ? history.map((obs) => (
                  <tr key={obs.id} className="hover:bg-slate-50 transition-colors group text-sm">
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-700">{new Date(obs.date).toLocaleDateString('id-ID')}</p>
                      <p className="text-[10px] text-slate-500">{obs.subDistrict ? `${obs.subDistrict}, ` : ''}Desa {obs.village}</p>
                      <p className="text-[10px] text-slate-400">{obs.blockName ? `Blok: ${obs.blockName}` : ''}</p>
                      <p className="text-[10px] text-slate-400">{obs.hst ? `${obs.hst} HST` : ''} • {obs.weather || '-'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-slate-700">{obs.cropType}</p>
                      <p className="text-[10px] text-slate-500 italic">{obs.variety || '-'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-[10px] text-green-600 font-bold uppercase tracking-wide">{obs.optName}</p>
                      {obs.pesticideRecommendation && (
                        <p className="text-[9px] text-amber-600 mt-1 italic">Rekomendasi: {obs.pesticideRecommendation}</p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-[10px] font-bold text-slate-500">{obs.method}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-10 font-bold text-slate-800">{obs.intensity}%</div>
                        <span className={`ml-2 px-2 py-0.5 rounded text-[8px] font-bold uppercase ${
                          obs.category === 'Ringan' ? 'bg-green-100 text-green-600' :
                          obs.category === 'Sedang' ? 'bg-amber-100 text-amber-600' : 'bg-red-100 text-red-600'
                        }`}>
                          {obs.category}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => {
                          if (confirm('Hapus data pengamatan ini?')) {
                            const updated = history.filter(h => h.id !== obs.id);
                            saveHistory(updated);
                          }
                        }}
                        className="text-slate-300 hover:text-red-500 transition-colors p-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-16 text-center text-slate-400 italic text-sm">
                      <div className="flex flex-col items-center">
                        <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-3">
                          <svg className="w-6 h-6 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        </div>
                        Database kosong. Silahkan input data harian terlebih dahulu.
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default FieldObservation;
