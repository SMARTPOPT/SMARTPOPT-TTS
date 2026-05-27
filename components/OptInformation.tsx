
import React, { useState, useEffect } from 'react';
import { PEST_DATA } from '../constants';
import { UserRole, PestInfo } from '../types';
import { Plus, Edit, Trash2, X, Info, ShieldAlert, CheckCircle2, Leaf, BookOpen, Layers } from 'lucide-react';

interface OptInformationProps {
  userRole: UserRole | null;
}

interface TechnicalDetail {
  scientificName: string;
  classification: string;
  optimalConditions: string;
  bioEcology: string;
  culturalControl: string;
  physicalControl: string;
  biologicalControl: string;
  chemicalControl: string;
}

const TECHNICAL_DETAILS_MAP: Record<string, TechnicalDetail> = {
  'Busuk Batang (Phytophthora)': {
    scientificName: 'Phytophthora palmivora / parasitica',
    classification: 'Fungi / Oomycetes (Jamur Air)',
    optimalConditions: 'Suhu hangat 25-28°C, kelembaban tinggi >90% pada musim hujan, tanah tergenang air.',
    bioEcology: 'Menyerang pangkal batang, leher akar, dan buah tanaman. Jamur menginfeksi sel jaringan kayu menyebabkan pelapukan seluler, sumbatan cairan hara, hingga kematian tanaman secara sistemik.',
    culturalControl: 'Sistem drainase mikro & makro harus lancar, hindari genangan air berlama-lama. Lakukan penjarangan gulma dan pemangkasan cabang bawah pelindung atau tanaman agar kelembaban mikro udara sekitar pangkal batang berkurang (udara kering).',
    physicalControl: 'Kupas bagian kulit kayu batang yang membusuk sampai bertemu bagian kayu/kulit sehat berwarna krem muda secara teliti. Olesi luka kupasan menggunakan kuas lapis bubur bubuk tembaga tri-basa.',
    biologicalControl: 'Aplikasi preventif agen hayati Trichoderma harzianum atau Gliocladium sp. dicampur pupuk kandang matang di sekitar piringan perakaran tanaman pada awal musim hujan sebagai kompetitor patogen.',
    chemicalControl: 'Infus batang atau injeksi terfokus menggunakan fungisida sistemik berbahan aktif asam fosfit (phosphonates) atau metalaksil apabila intensitas serangan pada batang telah meluas melebihi 20% keliling batang.'
  },
  'Lalat Buah (Bactrocera)': {
    scientificName: 'Bactrocera dorsalis',
    classification: 'Insecta (Serangga / Diptera)',
    optimalConditions: 'Kelembaban udara tinggi, lahan yang tidak bersih dengan timbunan buah busuk rontok di permukaan tanah.',
    bioEcology: 'Lalat betina menusuk kulit buah dewasa menggunakan ovipositornya untuk meletakkan kelompok telur. Setelah telur menetas, belatung (larva) memakan daging buah dari dalam, menimbulkan pembusukan sekunder oleh bakteri oportunis hingga buah mendadak jatuh berguguran.',
    culturalControl: 'Sanitasi intensif dengan metode pengumpulan seluruh buah yang rontok maupun sakit. Lakukan pergiliran tanaman (crop rotation) non-inang guna memutus siklus pupasi lalat buah di dalam tanah.',
    physicalControl: 'Bungkus buah muda menggunakan pembungkus kertas semen, kantong plastik khusus berlubang mikro, atau tile. Serta pasang perangkap modifikasi botol mineral berisi atraktan dari bahan zat pemikat Metil Eugenol (ME) sebanyak 1-2 ml setinggi tajuk tanaman.',
    biologicalControl: 'Memelihara kelestarian predator lalat buah berupa semut hitam, laba-laba, dan parasitoid pupa Diachasmimorpha longicaudata. Lakukan juga aplikasi penyemprotan jamur entomopatogen Beauveria bassiana pada tanah.',
    chemicalControl: 'Gunakan spray protein berumpun (protein baiting) yang terformulasi ramah lingkungan dicampur insektisida dosis rendah pada spot daun tertentu di bagian timur kebun pada pagi hari.'
  },
  'Antraknosa (Patek)': {
    scientificName: 'Colletotrichum capsici / acutatum',
    classification: 'Fungi (Jamur Ascomycota)',
    optimalConditions: 'Kelembaban nisbi udara >95% pada kondisi suhu hangat berkisar 28-32°C disertai curah hujan berintensitas tinggi.',
    bioEcology: 'Spora bertahan lama pada biji benih yang terinfeksi patogen atau serasah sisa tanaman sakit di lahan. Berkembang membentuk miselum, lalu merusak kutikula buah cabai matang hingga memicu luka lesi melingkar yang basah konsentris.',
    culturalControl: 'Gunakan varietas benih sehat berkualitas tinggi yang memiliki resistensi genetik. Tanam dengan jarak tanam seimbang (tidak terlalu rapat) serta terapkan pupuk berimbang dengan menekan suplai nitrogen berlebih, lalu tingkatkan unsur Kalsium (Ca) serta Kalium (K) untuk memperkuat membran sel.',
    physicalControl: 'Lakukan sanitasi panen dini harian dengan memetik tangkai dan membuang buah cabai yang pertama kali memperlihatkan bintik patek kecil secara teliti agar tidak menulari buah tetangganya.',
    biologicalControl: 'Perlakuan benih (seed treatment) merendam benih menggunakan larutan bakteri antagonis Pseudomonas fluorescens atau rendaman pre-planting Trichoderma sp. guna membentuk antibodi hayati pada tanaman sewaktu berkecambah.',
    chemicalControl: 'Semprotkan fungisida kontak berbahan aktif preventif murni (mankozeb, propineb, klorotalonil) secara merata terjadwal setiap 5-7 hari sekali selama musim hujan yang rimbun.'
  }
};

const OptInformation: React.FC<OptInformationProps> = ({ userRole }) => {
  const [pests, setPests] = useState<PestInfo[]>([]);
  const [selectedPest, setSelectedPest] = useState<PestInfo | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPestId, setEditingPestId] = useState<string | null>(null);
  const [newPest, setNewPest] = useState<Partial<PestInfo>>({
    name: '',
    host: '',
    symptoms: '',
    control: '',
    imageUrl: ''
  });

  useEffect(() => {
    const savedPests = localStorage.getItem('popt_pests');
    if (savedPests) {
      setPests(JSON.parse(savedPests));
    } else {
      setPests(PEST_DATA);
    }
  }, []);

  const handleAddPest = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingPestId) {
      const updatedPests = pests.map(p => 
        p.id === editingPestId ? { ...p, ...newPest as PestInfo } : p
      );
      setPests(updatedPests);
      localStorage.setItem('popt_pests', JSON.stringify(updatedPests));
    } else {
      const pestToAdd: PestInfo = {
        ...newPest as PestInfo,
        id: Date.now().toString()
      };
      const updatedPests = [...pests, pestToAdd];
      setPests(updatedPests);
      localStorage.setItem('popt_pests', JSON.stringify(updatedPests));
    }
    setShowAddModal(false);
    setEditingPestId(null);
    setNewPest({ name: '', host: '', symptoms: '', control: '', imageUrl: '' });
  };

  const handleEditPest = (pest: PestInfo) => {
    setNewPest(pest);
    setEditingPestId(pest.id);
    setShowAddModal(true);
  };

  const handleDeletePest = (id: string) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus informasi ini?')) {
      const updatedPests = pests.filter(p => p.id !== id);
      setPests(updatedPests);
      localStorage.setItem('popt_pests', JSON.stringify(updatedPests));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-bold text-slate-800">Katalog Organisme Pengganggu Tumbuhan</h3>
          <p className="text-sm text-slate-500">Informasi teknis hama dan penyakit tanaman</p>
        </div>
        <div className="flex items-center space-x-4">
          <span className="bg-slate-100 px-3 py-1 rounded-full text-xs font-semibold text-slate-500">
            Total: {pests.length} Hama/Penyakit
          </span>
          {userRole === 'Admin' && (
            <button 
              onClick={() => {
                setEditingPestId(null);
                setNewPest({ name: '', host: '', symptoms: '', control: '', imageUrl: '' });
                setShowAddModal(true);
              }}
              className="px-4 py-2 bg-green-600 text-white text-sm font-bold rounded-xl hover:bg-green-700 transition-colors shadow-lg shadow-green-100 flex items-center"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Tambah Konten
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {pests.map((pest) => (
          <div key={pest.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col group relative">
            {userRole === 'Admin' && (
              <div className="absolute top-2 right-2 z-10 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => handleEditPest(pest)}
                  className="p-2 bg-amber-50 text-amber-600 rounded-lg hover:bg-amber-100"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
                <button 
                  onClick={() => handleDeletePest(pest.id)}
                  className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            )}
            <div className="h-48 overflow-hidden relative">
              <img 
                src={pest.imageUrl || 'https://picsum.photos/seed/placeholder/600/400'} 
                alt={pest.name} 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute bottom-4 left-4">
                <span className="bg-green-600 text-white text-xs font-bold px-2 py-1 rounded-md shadow-lg">
                  {pest.host}
                </span>
              </div>
            </div>
            <div className="p-6 flex-1 flex flex-col">
              <h4 className="text-lg font-bold text-slate-800 mb-2">{pest.name}</h4>
              
              <div className="space-y-3 mt-2 flex-1">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Gejala Utama</p>
                  <p className="text-sm text-slate-600 mt-1">{pest.symptoms}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Metode Pengendalian</p>
                  <p className="text-sm text-slate-600 mt-1">{pest.control}</p>
                </div>
              </div>

              <button 
                onClick={() => setSelectedPest(pest)}
                className="mt-6 w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 text-sm font-semibold rounded-lg transition-colors flex items-center justify-center"
              >
                Lihat Detail Teknis
                <span className="w-4 h-4 ml-2 flex items-center justify-center">
                  <Info className="w-4 h-4" />
                </span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Detail Teknis Modal */}
      {selectedPest && (() => {
        const details = TECHNICAL_DETAILS_MAP[selectedPest.name] || {
          scientificName: 'N/A',
          classification: 'Umum / Lainnya',
          optimalConditions: 'Kondisi lingkungan lembab atau kurang sanitasi.',
          bioEcology: selectedPest.symptoms,
          culturalControl: selectedPest.control,
          physicalControl: 'Lakukan pembersihan fisik dan pembuangan bagian tanaman sakit secara rutin.',
          biologicalControl: 'Gunakan musuh alami dan agens hayati tanah yang sesuai.',
          chemicalControl: 'Gunakan pestisida kimia sebagai alternatif terakhir dengan dosis tepat.'
        };

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden my-8 animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
              {/* Modal Header & Image Banner */}
              <div className="relative h-64 md:h-80 w-full overflow-hidden bg-slate-900 shrink-0">
                <img 
                  src={selectedPest.imageUrl || 'https://picsum.photos/seed/placeholder/600/400'} 
                  alt={selectedPest.name} 
                  className="w-full h-full object-cover opacity-80"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent"></div>
                <button 
                  onClick={() => setSelectedPest(null)}
                  className="absolute top-4 right-4 p-2 bg-black/40 hover:bg-black/60 text-white rounded-full backdrop-blur-sm transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
                <div className="absolute bottom-6 left-6 right-6">
                  <span className="bg-green-600 text-white text-xs font-bold px-3 py-1 rounded-md shadow-lg">
                    {selectedPest.host}
                  </span>
                  <h3 className="text-2xl md:text-3xl font-extrabold text-white mt-2 drop-shadow-md">{selectedPest.name}</h3>
                  <p className="text-green-300 text-sm md:text-base italic mt-1 font-mono drop-shadow">
                    {details.scientificName !== 'N/A' ? details.scientificName : 'Kategori Spesies OPT'}
                  </p>
                </div>
              </div>

              {/* Modal Contents (Scrollable) */}
              <div className="p-6 md:p-8 overflow-y-auto space-y-6 flex-1">
                {/* Meta Attributes */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-start space-x-3">
                    <Layers className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Golongan OPT</p>
                      <p className="text-sm font-semibold text-slate-700 mt-1">{details.classification}</p>
                    </div>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-start space-x-3">
                    <Info className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Kondisi Pendukung OPT</p>
                      <p className="text-sm text-slate-600 mt-1">{details.optimalConditions}</p>
                    </div>
                  </div>
                </div>

                {/* Bioekologi */}
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-slate-800 font-bold border-b border-slate-100 pb-2">
                    <BookOpen className="w-5 h-5 text-green-600" />
                    <h4>Karakteristik & Bioekologi Serangan</h4>
                  </div>
                  <p className="text-sm leading-relaxed text-slate-600">{details.bioEcology}</p>
                </div>

                {/* Pengendalian Terpadu (PHT) */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2 text-slate-800 font-bold border-b border-slate-100 pb-2">
                    <ShieldAlert className="w-5 h-5 text-green-600" />
                    <h4>Panduan Pengendalian Hama Terpadu (PHT)</h4>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Kultur Teknis */}
                    <div className="bg-emerald-50/40 p-5 rounded-2xl border border-emerald-100 space-y-2">
                      <div className="flex items-center space-x-2">
                        <Leaf className="w-4 h-4 text-emerald-600" />
                        <h5 className="font-bold text-emerald-800 text-sm">A. Kultur Teknis / Agronomis</h5>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">{details.culturalControl}</p>
                    </div>

                    {/* Mekanis & Fisik */}
                    <div className="bg-blue-50/40 p-5 rounded-2xl border border-blue-100 space-y-2">
                      <div className="flex items-center space-x-2">
                        <Layers className="w-4 h-4 text-blue-600" />
                        <h5 className="font-bold text-blue-800 text-sm">B. Pengendalian Fisik & Mekanis</h5>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">{details.physicalControl}</p>
                    </div>

                    {/* Biologi & Hayati */}
                    <div className="bg-teal-50/40 p-5 rounded-2xl border border-teal-100 space-y-2">
                      <div className="flex items-center space-x-2">
                        <CheckCircle2 className="w-4 h-4 text-teal-600" />
                        <h5 className="font-bold text-teal-800 text-sm">C. Agens Hayati / Biologis</h5>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">{details.biologicalControl}</p>
                    </div>

                    {/* Kimiawi */}
                    <div className="bg-rose-50/40 p-5 rounded-2xl border border-rose-100 space-y-2">
                      <div className="flex items-center space-x-2">
                        <ShieldAlert className="w-4 h-4 text-rose-600" />
                        <h5 className="font-bold text-rose-800 text-sm">D. Pengendalian Kimiawi (Langkah Akhir)</h5>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">{details.chemicalControl}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end shrink-0">
                <button 
                  onClick={() => setSelectedPest(null)}
                  className="px-6 py-2.5 bg-slate-800 hover:bg-slate-900 text-white text-sm font-bold rounded-xl transition-all shadow-lg"
                >
                  Tutup Informasi Teknis
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-6 border-b flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-800">Tambah Informasi OPT</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleAddPest} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Nama Hama/Penyakit</label>
                <input 
                  required
                  type="text" 
                  value={newPest.name}
                  onChange={(e) => setNewPest({...newPest, name: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
                  placeholder="Contoh: Wereng Batang Coklat"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Tanaman Inang</label>
                <input 
                  required
                  type="text" 
                  value={newPest.host}
                  onChange={(e) => setNewPest({...newPest, host: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
                  placeholder="Contoh: Padi"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Gejala Utama</label>
                <textarea 
                  required
                  value={newPest.symptoms}
                  onChange={(e) => setNewPest({...newPest, symptoms: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none h-24 resize-none"
                  placeholder="Deskripsikan gejala yang terlihat..."
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Metode Pengendalian</label>
                <textarea 
                  required
                  value={newPest.control}
                  onChange={(e) => setNewPest({...newPest, control: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none h-24 resize-none"
                  placeholder="Langkah-langkah pengendalian..."
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">URL Gambar (Opsional)</label>
                <input 
                  type="text" 
                  value={newPest.imageUrl}
                  onChange={(e) => setNewPest({...newPest, imageUrl: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
                  placeholder="https://example.com/image.jpg"
                />
              </div>
              <div className="pt-4 flex space-x-3">
                <button 
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-colors shadow-lg shadow-green-100"
                >
                  Simpan Informasi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OptInformation;

