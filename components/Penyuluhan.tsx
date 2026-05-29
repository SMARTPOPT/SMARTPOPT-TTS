
import React, { useState, useEffect } from 'react';
import { UserRole } from '../types';
import { FileText, Play, Image, Award, BookOpen, Clock, Calendar, ArrowLeft, ArrowRight, Eye, Trash2, Edit, X, Plus, Download, ZoomIn, ZoomOut, CheckCircle, ExternalLink } from 'lucide-react';
import sanisImg from '../src/assets/images/infografis_sanitasi_1779624257036.png';
import { SupabaseService } from '../SupabaseService';
import { SupabaseConfigPanel } from './SupabaseConfigPanel';

interface Material {
  id: string;
  title: string;
  type: 'Modul' | 'Video' | 'Infografis';
  date: string;
  author: string;
  url?: string;
}

interface PenyuluhanProps {
  userRole: UserRole | null;
}

const MODUL_CONTENTS: Record<string, { title: string; pages: { subtitle: string; text: string }[] }> = {
  'Pengendalian OPT Ramah Lingkungan': {
    title: 'Modul Pelatihan: Pengendalian OPT Ramah Lingkungan',
    pages: [
      {
        subtitle: 'Prinsip Dasar Sistem PHT',
        text: 'Pengendalian Hama Terpadu (PHT) Ramah Lingkungan mengutamakan stabilitas ekologi sawah. Kita meminimalkan pestisida kimia sintetis untuk menjaga musuh alami agar tetap seimbang. Langkah awal selalu berfokus pada sanitasi lingkungan, pemantauan populasi OPT secara rutin, dan pemilihan varietas benih padi/cabai unggul yang tahan serangan penyakit patogen lokal.'
      },
      {
        subtitle: 'Membudidayakan Agen Hayati Utama',
        text: 'Menggunakan jamur menguntungkan (seperti Trichoderma harzianum) dicampur pupuk kompos dapat mencegah infeksi layu fusarium pada tanaman hortikultura. Agen hayati tanah bertindak sebagai kompetitor ruang dan nutrisi terhadap cendawan merugikan, sekaligus merangsang hormon tumbuh akar tanaman secara alami.'
      },
      {
        subtitle: 'Pembuatan Pestisida Nabati Sederhana',
        text: 'Pestisida nabati dapat diracik dari bahan lokal yang melimpah seperti daun mimba, lengkuas, serai wangi, dan tembakau. Rebusan bahan-bahan tersebut mengandung senyawa fitokimia (seperti azadirachtin) yang bersifat menurunkan nafsu makan serangga pengganggu, menolak peletakan telur, tanpa menyisakan residu beracun berkepanjangan pada hasil panen petani.'
      },
      {
        subtitle: 'Kesimpulan & Sinergi Ekosistem',
        text: 'Gabungan taktis antara sanitasi lahan, penanaman refugia pembawa nektar (bunga matahari/kenikir), serta pelepasan berkala parasitoid Trichogramma terbukti memangkas biaya pestisida kimia hingga 75%. Petani memperoleh profit bersih melimpah, tanah subur berkelanjutan, dan produk pangan yang sehat bebas racun residu.'
      }
    ]
  },
  'Manajemen Musuh Alami di Sawah': {
    title: 'Modul Teknis: Manajemen Musuh Alami di Sawah',
    pages: [
      {
        subtitle: 'Mengenal Sahabat Setia Petani',
        text: 'Di ekosistem sawah, tidak semua organisme adalah hama. Predator utama seperti Laba-laba Serigala (Lycosa), Tawon Kertas (Polistes), Kumbang Kubah (Coccinella), dan Kepik Mirid adalah sekutu alami kita. Kehadiran satu ekor laba-laba serigala per rumpun padi dapat mengendalikan ledakan populasi Wereng Batang Coklat (WBC) dengan instan.'
      },
      {
        subtitle: 'Ancaman Kerusaakan Akibat Pestisida Butiran',
        text: 'Penyemprotan insektisida kimia berspektrum luas yang serampangan di bawah umur padi 40 hari berisiko melenyapkan seluruh populasi laba-laba dan kepik pemburu di sawah. Hal ini memicu hilangnya agen pengontrol alami, memicu kepunahan predator, dan menginduksi resurgensi WBC yang berkali-kali lipat lebih dahsyat.'
      },
      {
        subtitle: 'Konservasi & Penyediaan Tanaman Refugia',
        text: 'Menanam barisan tumbuhan berbunga refugia di sepanjang pematang seperti tanaman kenikir (Cosmos caudatus), tapak dara, atau wijen merupakan kunci konservasi musuh alami. Bunga-bungaan tersebut menyediakan nektar dan polen sebagai pakan suplemen bagi tawon parasitoid tawon Trichogramma sewaktu mencari imago wereng.'
      },
      {
        subtitle: 'Protokol Ambang Ekonomi & Rekomendasi',
        text: 'Selalu lakukan pengamatan visual di 20 rumpun sampel diagonal sebelum menyemprot. Jika rasio jumlah predator alami banding wereng berkisar 1:2 atau lebih tinggi, tunda penyemprotan bahan kimia sintetik karena koloni pemangsa alamiah masih sanggup menekan hama secara mandiri.'
      }
    ]
  },
  'Pencegahan Penyakit Bulai Pada Tanaman Jagung': {
    title: 'Modul Teknis: Pencegahan Penyakit Bulai Pada Tanaman Jagung (Peronosclerospora maydis)',
    pages: [
      {
        subtitle: 'Memahami Gejala Awal Bulai',
        text: 'Penyakit Bulai adalah Momok nomor satu bagi petani jagung di NTT dan wilayah lainnya. Ditandai dengan munculnya klorosis memanjang (berwarna kuning keputihan) sejajar dengan tulang daun jagung yang berumur muda. Sering kali diikuti dengan adanya serbuk putih serupa tepung di permukaan bawah daun yang terinfeksi aktif pada pagi hari.'
      },
      {
        subtitle: 'Tindakan Pencegahan Sejak Dini',
        text: 'Fungisida berbahan aktif Metalaksil memegang peran kunci sebagai treatment benih sebelum tanam (seed treatment). Campurkan benih jagung dengan bubuk metalaksil basah sebelum ditanam di tanah sela musim pancaroba untuk mencegah jamur bulai berkembang di fase kecambah awal.'
      },
      {
        subtitle: 'Pengaturan Sanitasi Serta Jarak Tanam',
        text: 'Kelembapan tinggi adalah sahabat jamur. Penerapan sistem baris ganda (Legowo) sangat dianjurkan untuk memaksimalkan penetrasi radiasi surya dan kelancaran laju angin di sela baris jagung. Jika melihat tanaman bergejala bulai, cabut dan bakar sesegera mungkin di luar area kebun agar spora tidak menular.'
      }
    ]
  },
  'Panduan Lapangan Pengendalian Wereng Coklat': {
    title: 'Buku Saku Lapangan: Pengendalian Wereng Batang Coklat (WBC)',
    pages: [
      {
        subtitle: 'Biologi Wereng Batang Coklat',
        text: 'Wereng Batang Coklat menghisap cairan batang padi dari pangkal tanaman dekat permukaan air sawah. Wereng menyukai area rindang lembap. Akibat serangan berat, hamparan sawah mengalami hopperburn—mengering cokelat nampak bagai terbakar melingkar yang menjalar dengan sangat kilat.'
      },
      {
        subtitle: 'Pola Tanam & Pengairan Berselang',
        text: 'Gunakan sistem pengairan berselang (intermittent irrigation) dengan membiarkan sawah mengering berkala untuk menekan kelembapan mikro rumpun padi. Kombinasikan dengan pola tanam jajar legowo agar sirkulasi udara lebih lancar dan memudahkan penyemprotan pas di pangkal padi.'
      },
      {
        subtitle: 'Aplikasi Insektisida Nabati & Agens Hayati',
        text: 'Semprot pangkal rumpun menggunakan agens hayati Beauveria bassiana yang memparasit tubuh wereng secara biologi, atau gunakan ramuan daun mimba dan tembakau. Hindari penggunaan insektisida berbahan aktif Piretroid sintetis karena terbukti memicu resurgensi (wereng bertelur lebih cepat).'
      }
    ]
  },
  'Teknik Sanitasi Lahan Musim Hujan': {
    title: 'Panduan Praktis: Teknik Sanitasi Lahan Hortikultura Musim Hujan',
    pages: [
      {
        subtitle: 'Pentingnya Sanitasi Lahan',
        text: 'Suhu hangat disertai curah hujan yang lebat memicu ekstremnya kelembapan di wilayah kebun. Cendawan merugikan seperti Phytophthora dan antraknosa menyebar luas lewat percikan air hujan. Pembersihan residu sisa tanaman terinfeksi dari musim sebelumnya wajib tuntas dikerjakan sebelum mengolah bedengan baru.'
      },
      {
        subtitle: 'Pembuatan Sistem Drainase Sempurna',
        text: 'Tinggikan bedengan hingga 40-50 cm di musim hujan agar air tidak menggenang di wilayah perakaran tanaman cabai/tomat yang sensitif busuk akar. Parit drainase dibikin melandai tanpa ada bottleneck serbuan rumput liar agar air lancar mengalir ke pembuangan utama.'
      },
      {
        subtitle: 'Sterilisasi Tanah & Aplikasi Kapur Pertanian',
        text: 'Berikan kapur dolomit/zeolit untuk menjaga pH tanah tetap stabil di angka 6-7 pasca-hujan masam berkepanjangan. Taburkan jamur antagonis pemakan patogen tanah (Trichoderma) sesaat sebelum pemasangan mulsa plastik untuk pencegahan patek serta layu tanaman.'
      }
    ]
  }
};

const VIDEO_DETAILS_MAP: Record<string, { duration: string; embedUrl: string; description: string; chapters: { time: string; title: string; desc: string }[] }> = {
  'Budidaya Cabai Sehat Tanpa Pestisida': {
    duration: '12:24',
    embedUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    description: 'Panduan visual cara menanam cabai merah besar dan cabai rawit secara modern menggunakan mulsa plastik perak dan pupuk organik hayati tanpa pestisida kimia.',
    chapters: [
      { time: '00:00 - 02:15', title: 'Persiapan Lahan & Pembuatan Bedengan', desc: 'Cara meratakan tanah, memberikan kapur zeolit, penaburan kompos, memasang mulsa plastik perak untuk memantulkan sinar matahari guna mengusir hama Thrips.' },
      { time: '02:16 - 05:40', title: 'Persemaian Benih & Transplantasi', desc: 'Pemilahan benih unggul tahan patek, sterilisasi semai, pemindahan bibit berumur 15-20 hari ke bedengan dengan jarak tanam sejajar zig-zag.' },
      { time: '05:41 - 09:10', title: 'Pemupukan Liquid Organik & Pengairan', desc: 'Cara meracik pupuk cair hayati difermentasi menggunakan urine sapi, EM4 pertanian, disiram berkala 10 hari sekali secara terukur.' },
      { time: '09:11 - Selesai', title: 'Pengendalian Hama Nabati & Panen Beruntun', desc: 'Menggunakan spray ekstrak daun mimba giling dan pemasangan perangkap kuning berperekat untuk menjaga kelestarian kebun cabai.' }
    ]
  },
  'Pembuatan Pestisida Nabati Berbahan Daun Mimba': {
    duration: '08:45',
    embedUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    description: 'Petunjuk praktis meracik bahan pestisida ramah lingkungan berbahan aktif Azadirachtin dari daun mimba untuk mengusir ulat, kutu daun, belalang, dan thrips.',
    chapters: [
      { time: '00:00 - 02:00', title: 'Pengumpulan Bahan & Daun Mimba', desc: 'Pemilihan daun mimba hijau tua segar tanpa bercak jamur, serta penakaran bahan pembantu berupa deterjen pencuci piring atau sabun colek cair sebagai emulgator.' },
      { time: '02:01 - 05:30', title: 'Penggilingan Serta Ekstraksi Cairan', desc: 'Langkah melumatkan daun mimba lewat blender atau ditumbuk kasar, dilanjutkan perendaman dengan air bersih selama 24 jam penuh di wadah gelap tertutup.' },
      { time: '05:31 - Selesai', title: 'Penyaringan & Teknik Penyemprotan', desc: 'Menyaring larutan gilingan memakai kain kasa halus, pengenceran dosis 1:10 dengan air, dan menyemprot tepat pada sore hari agar larutan aktif tidak menguap.' }
    ]
  },
  'Teknik Inokulasi Jamur Trichoderma': {
    duration: '10:15',
    embedUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    description: 'Video tutorial pembiakan mandiri spora Trichoderma harzianum sebagai agen pengendali jamur tanah patogen penyebab layu fusarium.',
    chapters: [
      { time: '00:00 - 03:00', title: 'Persiapan Media Nasi Sisa / Dedak', desc: 'Mengolah media nasi sisa kering atau dedak padi steril yang telah dikukus ringan untuk dijadikan tempat tumbuh substrat hifa Trichoderma.' },
      { time: '03:01 - 07:00', title: 'Proses Inokulasi & Inkubasi Kamar', desc: 'Menaburkan starter bibit biakan murni Trichoderma ke media tumbuh secara steril, menutupnya rapat-rapat memakai kertas, diletakkan di tempat teduh.' },
      { time: '07:01 - Selesai', title: 'Pemanenan Spora & Pengaplikasian Tanah', desc: 'Melihat ciri keberhasilan (koloni berwarna hijau tua tebal berpendar), cara melarutkan spora untuk siraman bedengan atau dipadukan kompos.' }
    ]
  }
};

const Penyuluhan: React.FC<PenyuluhanProps> = ({ userRole }) => {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newMaterial, setNewMaterial] = useState<Partial<Material>>({
    title: '',
    type: 'Modul',
    author: '',
    url: ''
  });

  // Media viewer states
  const [activeVideo, setActiveVideo] = useState<Material | null>(null);
  const [activeModul, setActiveModul] = useState<Material | null>(null);
  const [activeInfografis, setActiveInfografis] = useState<Material | null>(null);
  const [modulPage, setModulPage] = useState<number>(0);
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  const defaultMaterials: Material[] = [
    { id: '1', title: 'Pengendalian OPT Ramah Lingkungan', type: 'Modul', date: '12 Jan 2026', author: 'Dr. Ir. Suharyanto', url: '' },
    { id: '2', title: 'Budidaya Cabai Sehat Tanpa Pestisida', type: 'Video', date: '05 Jan 2026', author: 'Tim POPT Jabar', url: 'https://www.youtube.com/embed/dQw4w9WgXcQ' },
    { id: '3', title: 'Teknik Sanitasi Lahan Musim Hujan', type: 'Infografis', date: '28 Des 2025', author: 'Kementan RI', url: sanisImg },
    { id: '4', title: 'Manajemen Musuh Alami di Sawah', type: 'Modul', date: '15 Des 2025', author: 'Balai Proteksi Tanaman', url: '' },
    { id: '5', title: 'Pembuatan Pestisida Nabati Berbahan Daun Mimba', type: 'Video', date: '10 Jan 2026', author: 'Team SMART POPT', url: 'https://www.youtube.com/embed/dQw4w9WgXcQ' },
    { id: '6', title: 'Kalender Tanam Dinamis Menghadapi Iklim NTT', type: 'Infografis', date: '02 Jan 2026', author: 'BMKG Kupang & Distan NTT', url: sanisImg },
    { id: '7', title: 'Pencegahan Penyakit Bulai Pada Tanaman Jagung', type: 'Modul', date: '20 Des 2025', author: 'BPP Nules NTT', url: '' },
    { id: '8', title: 'Teknik Inokulasi Jamur Trichoderma', type: 'Video', date: '15 Des 2025', author: 'Balai Proteksi NTT', url: 'https://www.youtube.com/embed/dQw4w9WgXcQ' },
    { id: '9', title: 'Panduan Lapangan Pengendalian Wereng Coklat', type: 'Modul', date: '01 Des 2025', author: 'Kementerian Pertanian', url: '' },
    { id: '10', title: 'Infografis Pengenalan Gejala Ulat Grayak Jagung', type: 'Infografis', date: '15 Nov 2025', author: 'Team SMART POPT', url: sanisImg }
  ];

  const [supabaseConnected, setSupabaseConnected] = useState(false);

  const loadData = async () => {
    try {
      const data = await SupabaseService.fetchRemoteData('penyuluhan');
      setMaterials(data);
      localStorage.setItem('popt_materials', JSON.stringify(data));
      setSupabaseConnected(true);
    } catch (err: any) {
      console.warn("Supabase fetch failed initially (normal if unconfigured):", err);
      setSupabaseConnected(false);
      const savedMaterials = localStorage.getItem('popt_materials');
      if (savedMaterials) {
        setMaterials(JSON.parse(savedMaterials));
      } else {
        setMaterials(defaultMaterials);
      }
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    let updatedMaterials: Material[];
    let materialToSave: Material;

    if (editingId) {
      materialToSave = {
        ...materials.find(m => m.id === editingId)!,
        ...newMaterial as Material
      };
      updatedMaterials = materials.map(m => 
        m.id === editingId ? materialToSave : m
      );
    } else {
      materialToSave = {
        ...newMaterial as Material,
        id: Date.now().toString(),
        date: new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
      };
      updatedMaterials = [materialToSave, ...materials];
    }

    setMaterials(updatedMaterials);
    localStorage.setItem('popt_materials', JSON.stringify(updatedMaterials));

    // Try saving to Supabase if connected
    try {
      await SupabaseService.saveRemoteData('penyuluhan', materialToSave);
      setSupabaseConnected(true);
    } catch (err: any) {
      console.warn('Could not sync addition with Supabase:', err.message);
      // We don't block local success but warn user if they are admin and intentionally turned on Supabase
      if (userRole === 'Admin') {
        alert(`Disimpan secara lokal. Gagal sinkron ke Supabase: ${err.message}`);
      }
    }

    setShowAddModal(false);
    setEditingId(null);
    setNewMaterial({ title: '', type: 'Modul', author: '', url: '' });
  };

  const handleEditMaterial = (material: Material) => {
    setNewMaterial(material);
    setEditingId(material.id);
    setShowAddModal(true);
  };

  const handleDeleteMaterial = async (id: string) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus materi ini?')) {
      const updatedMaterials = materials.filter(m => m.id !== id);
      setMaterials(updatedMaterials);
      localStorage.setItem('popt_materials', JSON.stringify(updatedMaterials));

      try {
        await SupabaseService.deleteRemoteData('penyuluhan', id);
      } catch (err: any) {
        console.warn('Could not sync delete with Supabase:', err.message);
        if (userRole === 'Admin') {
          alert(`Dihapus secara lokal. Gagal hapus di Supabase: ${err.message}`);
        }
      }
    }
  };

  const handleMaterialClick = (item: Material) => {
    if (item.type === 'Video') {
      setActiveVideo(item);
    } else if (item.type === 'Modul') {
      setModulPage(0);
      setActiveModul(item);
    } else if (item.type === 'Infografis') {
      setActiveInfografis(item);
      setZoomLevel(1);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-green-600 to-green-500 p-8 rounded-2xl text-white shadow-lg flex justify-between items-center">
        <div>
          <h3 className="text-2xl font-bold">Materi Penyuluhan Pertanian</h3>
          <p className="text-green-100 mt-2 opacity-90 max-w-xl">
            Akses modul, video tutorial, dan panduan praktis untuk meningkatkan kualitas budidaya dan pengendalian hama secara berkelanjutan.
          </p>
        </div>
        {userRole === 'Admin' && (
          <button 
            onClick={() => {
              setEditingId(null);
              setNewMaterial({ title: '', type: 'Modul', author: '', url: '' });
              setShowAddModal(true);
            }}
            className="px-6 py-3 bg-white text-green-700 font-bold rounded-xl hover:bg-green-50 transition-all shadow-xl flex items-center shrink-0"
          >
            <Plus className="w-5 h-5 mr-2" />
            Tambah Materi
          </button>
        )}
      </div>

      {userRole === 'Admin' && (
        <SupabaseConfigPanel 
          tableType="penyuluhan"
          onDataSynced={(syncedData) => {
            setMaterials(syncedData);
            localStorage.setItem('popt_materials', JSON.stringify(syncedData));
            setSupabaseConnected(true);
          }}
          getLocalData={() => {
            const saved = localStorage.getItem('popt_materials');
            return saved ? JSON.parse(saved) : defaultMaterials;
          }}
        />
      )}

      <div className="grid grid-cols-1 gap-4">
        {materials.map((item) => (
          <div 
            key={item.id} 
            onClick={() => handleMaterialClick(item)}
            className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between hover:border-green-300 hover:shadow-md transition-all cursor-pointer group relative"
          >
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 rounded-lg bg-green-50 flex items-center justify-center text-green-600 group-hover:bg-green-100 transition-colors shrink-0">
                {item.type === 'Modul' && <FileText className="w-6 h-6" />}
                {item.type === 'Video' && <Play className="w-6 h-6 fill-current" />}
                {item.type === 'Infografis' && <Image className="w-6 h-6" />}
              </div>
              <div>
                <h4 className="font-bold text-slate-800 group-hover:text-green-700 transition-colors">{item.title}</h4>
                <div className="flex items-center space-x-3 mt-1 text-xs text-slate-500">
                  <span className="flex items-center"><Award className="w-3.5 h-3.5 mr-1" /> {item.author}</span>
                  <span>•</span>
                  <span className="flex items-center"><Calendar className="w-3.5 h-3.5 mr-1" /> {item.date}</span>
                </div>
              </div>
            </div>
            
            <div className="mt-4 md:mt-0 flex items-center justify-between md:justify-end">
              <span className={`px-3 py-1 rounded-full text-xs font-bold mr-4 ${
                item.type === 'Modul' ? 'bg-sky-50 text-sky-700' :
                item.type === 'Video' ? 'bg-amber-50 text-amber-700' :
                'bg-emerald-50 text-emerald-700'
              }`}>{item.type}</span>
              <div className="flex items-center space-x-2">
                <button 
                  className="text-green-600 font-bold text-sm hover:underline mr-4 flex items-center"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMaterialClick(item);
                  }}
                >
                  <Eye className="w-4 h-4 mr-1" />
                  {item.type === 'Video' ? 'Tonton' : 'Buka'}
                </button>
                {userRole === 'Admin' && (
                  <div className="flex space-x-2">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditMaterial(item);
                      }}
                      className="p-2 text-amber-500 hover:bg-amber-50 rounded-lg transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteMaterial(item.id);
                      }}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Interactive Modul Modal Box Reader */}
      {activeModul && (() => {
        const book = MODUL_CONTENTS[activeModul.title] || {
          title: `Materi Buku: ${activeModul.title}`,
          pages: [
            {
              subtitle: 'Bagian Pertama: Pendahuluan Pengenalan',
              text: 'Buku kajian teknis ini merangkum teknik pertanian terpadu yang disusun oleh dinas. Meliputi investigasi dini lahan sawah, cara mendeteksi hama penyerbu, budidaya varietas resisten unggul, serta pentingnya menghindari asupan pupuk buatan berlebihan demi kelestarian daya dukung tanah hara.'
            },
            {
              subtitle: 'Bagian Kedua: Metode Operasional Teknis',
              text: 'Petani diarahkan melakukan pergiliran tanam secara berkala. Pemantauan populasi hama dilakukan dua kali dalam seminggu. Penggunaan pestisida alternatif yang ramah herbisida organik atau pestisida berbahan nabati lokal diposisikan sebagai pilar intervensi awal demi keamanan hasil panen pangan.'
            }
          ]
        };

        const totalPages = book.pages.length;
        const currentPageData = book.pages[modulPage] || book.pages[0];

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden my-8 animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
              {/* Reader Header */}
              <div className="p-6 border-b border-slate-100 bg-emerald-700 text-white flex justify-between items-center shrink-0">
                <div className="flex items-center space-x-3">
                  <BookOpen className="w-6 h-6 text-emerald-200" />
                  <div>
                    <h3 className="text-lg font-bold line-clamp-1">{book.title}</h3>
                    <p className="text-xs text-emerald-100">Disusun oleh {activeModul.author} • {activeModul.date}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setActiveModul(null)}
                  className="p-1.5 hover:bg-white/10 rounded-full transition-all text-white"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Reader Book Interface */}
              <div className="flex-1 overflow-y-auto p-8 md:p-12 bg-amber-50/20 flex flex-col items-center">
                <div className="w-full max-w-xl bg-white p-8 md:p-10 rounded-2xl shadow-xl border border-amber-100 flex-1 flex flex-col justify-between min-h-[400px]">
                  {/* Page Contents */}
                  <div className="space-y-6">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                      <span className="text-emerald-700 text-xs font-extrabold uppercase tracking-wide font-sans">
                        {currentPageData.subtitle}
                      </span>
                      <span className="text-xs bg-emerald-50 text-emerald-800 font-mono px-2 py-1 rounded">
                        Hal. {modulPage + 1} dari {totalPages}
                      </span>
                    </div>
                    <p className="text-slate-700 leading-relaxed text-sm md:text-base whitespace-pre-line text-justify font-sans">
                      {currentPageData.text}
                    </p>
                  </div>

                  {/* Footnotes */}
                  <div className="border-t border-slate-50 pt-4 mt-8 flex justify-between items-center text-[10px] text-slate-400 font-mono">
                    <span>© {activeModul.author}</span>
                    <span>BPP NULE DIGITAL LEARNING</span>
                  </div>
                </div>
              </div>

              {/* Reader Navigation Footer */}
              <div className="p-6 border-t border-slate-100 bg-slate-50 flex items-center justify-between shrink-0">
                <button
                  disabled={modulPage === 0}
                  onClick={() => setModulPage(prev => Math.max(0, prev - 1))}
                  className="px-4 py-2 text-sm font-bold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-100 hover:text-slate-800 disabled:opacity-40 disabled:pointer-events-none transition-all flex items-center"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Sebelumnya
                </button>

                <div className="text-xs text-slate-500 font-medium">
                  Progress Membaca: <span className="font-bold text-emerald-600">{Math.round(((modulPage + 1) / totalPages) * 100)}%</span>
                </div>

                {modulPage < totalPages - 1 ? (
                  <button
                    onClick={() => setModulPage(prev => Math.min(totalPages - 1, prev + 1))}
                    className="px-4 py-2 text-sm font-bold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 transition-all flex items-center shadow"
                  >
                    Selanjutnya
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      alert("Terima kasih! Anda telah menyelesaikan seluruh bab pelatihan ini.");
                      setActiveModul(null);
                    }}
                    className="px-4 py-2 text-sm font-bold text-white bg-green-600 hover:bg-green-700 rounded-xl transition-all flex items-center shadow"
                  >
                    Selesai Membaca
                    <CheckCircle className="w-4 h-4 ml-2" />
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Interactive Video Player Dialog */}
      {activeVideo && (() => {
        const videoDetail = VIDEO_DETAILS_MAP[activeVideo.title] || {
          duration: '10:00',
          embedUrl: activeVideo.url && activeVideo.url.includes('youtube.com') ? activeVideo.url : 'https://www.youtube.com/embed/dQw4w9WgXcQ',
          description: 'Video petunjuk teknis yang memuat langkah praktis penyuluhan pertanian di lapangan.',
          chapters: [
            { time: '00:00 - 03:00', title: 'Pendahuluan & Konsep Utama', desc: 'Pemapar menjelaskan dasar sirkulasi agroekosistem dan mitigasi hama pengganggu.' },
            { time: '03:01 - Selesai', title: 'Penerapan Praktis Lahan Mandiri', desc: 'Petisi lapangan mengajarkan teknik mencampur pupuk kandang dan menanam refugia.' }
          ]
        };

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl overflow-hidden my-8 animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
              {/* Header */}
              <div className="p-6 border-b border-slate-100 bg-slate-950 text-white flex justify-between items-center shrink-0">
                <div className="flex items-center space-x-3">
                  <Play className="w-6 h-6 text-amber-500 fill-current animate-pulse" />
                  <div>
                    <h3 className="text-lg font-bold line-clamp-1">{activeVideo.title}</h3>
                    <p className="text-xs text-slate-400">Penyuluhan Video • {activeVideo.author} • Durasi {videoDetail.duration}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setActiveVideo(null)}
                  className="p-1.5 hover:bg-white/10 rounded-full transition-all text-white"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Two-Column Player + Chapter layout */}
              <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-3 bg-slate-900 animate-fade-in">
                {/* Visual Video Iframe Panel */}
                <div className="lg:col-span-2 p-4 md:p-6 flex flex-col justify-center items-center h-full bg-slate-950 min-h-[300px] md:min-h-[450px]">
                  <div className="relative w-full aspect-video rounded-xl overflow-hidden shadow-2xl bg-black border border-slate-800">
                    <iframe 
                      className="absolute inset-0 w-full h-full"
                      src={videoDetail.embedUrl}
                      title={activeVideo.title}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                      allowFullScreen
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="w-full text-slate-300 text-xs mt-3 flex items-center justify-between px-2">
                    <span className="flex items-center"><Clock className="w-3.5 h-3.5 mr-1 text-slate-400" /> Pemutaran Online Streaming</span>
                    <span className="text-slate-400">{activeVideo.author} • Sumber Terpilih Kementan Jabar</span>
                  </div>
                </div>

                {/* Chapters & Takeaways Panel */}
                <div className="p-6 bg-slate-800 text-white flex flex-col justify-between max-h-full overflow-y-auto border-t lg:border-t-0 lg:border-l border-slate-700">
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-sm font-bold text-amber-400 uppercase tracking-wider mb-2">Deskripsi Video</h4>
                      <p className="text-xs text-slate-300 leading-relaxed">{videoDetail.description}</p>
                    </div>

                    <div className="space-y-3">
                      <h4 className="text-sm font-bold text-amber-400 uppercase tracking-wider">Bab Video & Transkrip</h4>
                      <div className="space-y-4 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                        {videoDetail.chapters.map((ch, idx) => (
                          <div key={idx} className="p-3 bg-slate-900/40 hover:bg-slate-900/70 rounded-xl border border-slate-700/50 transition-colors">
                            <div className="flex justify-between items-center">
                              <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">{ch.time}</span>
                              <span className="text-[10px] text-slate-400">Bagian {idx + 1}</span>
                            </div>
                            <h5 className="text-xs font-bold text-slate-100 mt-1.5">{ch.title}</h5>
                            <p className="text-[11px] text-slate-400 mt-1 font-sans">{ch.desc}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-slate-700 flex justify-end">
                    <button 
                      onClick={() => setActiveVideo(null)}
                      className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg"
                    >
                      Tutup Video Training
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Interactive Infographic Lightbox Viewer */}
      {activeInfografis && (() => {
        const imagePath = activeInfografis.url && activeInfografis.url !== '#' ? activeInfografis.url : '/src/assets/images/infografis_sanitasi_1779624257036.png';
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm overflow-y-auto">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden my-8 animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
              {/* Header */}
              <div className="p-6 border-b border-slate-100 bg-teal-800 text-white flex justify-between items-center shrink-0">
                <div className="flex items-center space-x-3">
                  <Image className="w-6 h-6 text-teal-200" />
                  <div>
                    <h3 className="text-lg font-bold line-clamp-1">{activeInfografis.title}</h3>
                    <p className="text-xs text-teal-100">Infografis Visual Grafis • {activeInfografis.author} • {activeInfografis.date}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setActiveInfografis(null)}
                  className="p-1.5 hover:bg-white/10 rounded-full transition-all text-white"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Pan & View Workspace */}
              <div className="flex-1 overflow-auto p-6 bg-slate-100 flex items-center justify-center min-h-[400px]">
                <div className="relative bg-white p-4 rounded-xl shadow-inner max-w-xl transition-transform duration-300 overflow-hidden" 
                     style={{ transform: `scale(${zoomLevel})` }}>
                  <img 
                    src={imagePath} 
                    alt={activeInfografis.title} 
                    className="max-h-[60vh] object-contain rounded"
                    referrerPolicy="no-referrer"
                  />
                </div>
              </div>

              {/* Lightbox controls & download simulation */}
              <div className="p-6 border-t border-slate-100 bg-slate-50 flex items-center justify-between shrink-0">
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={() => setZoomLevel(prev => Math.max(0.75, prev - 0.25))}
                    className="p-2 border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-lg opacity-80"
                    title="Perkecil"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-mono font-bold text-slate-400 w-12 text-center">
                    {Math.round(zoomLevel * 100)}%
                  </span>
                  <button 
                    onClick={() => setZoomLevel(prev => Math.min(2.5, prev + 0.25))}
                    className="p-2 border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-lg opacity-80"
                    title="Perbesar"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                </div>

                <div className="text-center hidden md:block text-xs text-slate-400 font-sans italic">
                  Gunakan roda mouse atau kontrol kontrol cubit untuk menavigasi gambar.
                </div>

                <div className="flex items-center space-x-2">
                  <a 
                    href={imagePath}
                    download={activeInfografis.title}
                    onClick={(e) => {
                      if(imagePath.startsWith('/src')) {
                        e.preventDefault();
                        const link = document.createElement('a');
                        link.href = imagePath;
                        link.setAttribute('download', `${activeInfografis.title}.png`);
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        alert("Berkas gambar poster " + activeInfografis.title + " berhasil diunduh!");
                      }
                    }}
                    className="px-4 py-2 border border-teal-600 hover:bg-teal-50 text-teal-700 font-bold text-sm rounded-xl transition-all flex items-center shadow-sm"
                  >
                    <Download className="w-4 h-4 mr-1.5" />
                    Unduh Gambar
                  </a>
                  <button 
                    onClick={() => setActiveInfografis(null)}
                    className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-sm rounded-xl transition-all"
                  >
                    Tutup Poster
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-6 border-b flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-800">{editingId ? 'Edit Materi Penyuluhan' : 'Tambah Materi Penyuluhan'}</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleAddMaterial} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Judul Materi</label>
                <input 
                  required
                  type="text" 
                  value={newMaterial.title}
                  onChange={(e) => setNewMaterial({...newMaterial, title: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
                  placeholder="Contoh: Teknik Budidaya Jagung Hibrida"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Tipe Materi</label>
                  <select 
                    value={newMaterial.type}
                    onChange={(e) => setNewMaterial({...newMaterial, type: e.target.value as any})}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
                  >
                    <option value="Modul">Modul (PDF/Doc)</option>
                    <option value="Video">Video</option>
                    <option value="Infografis">Infografis (Gambar)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Penulis / Sumber</label>
                  <input 
                    required
                    type="text" 
                    value={newMaterial.author}
                    onChange={(e) => setNewMaterial({...newMaterial, author: e.target.value})}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
                    placeholder="Contoh: BPP Amanuban Barat"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Tautan Sumber (Link Doc/Video/Gambar)</label>
                <input 
                  required
                  type="url" 
                  value={newMaterial.url}
                  onChange={(e) => setNewMaterial({...newMaterial, url: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
                  placeholder="https://drive.google.com/... atau https://youtube.com/..."
                />
                <p className="text-[10px] text-slate-400 mt-1 italic">*Masukkan tautan dari Google Drive, YouTube, atau penyimpanan awan lainnya.</p>
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
                  {editingId ? 'Simpan Perubahan' : 'Simpan Materi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Penyuluhan;

