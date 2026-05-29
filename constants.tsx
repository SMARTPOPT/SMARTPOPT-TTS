
import { PestInfo, Report } from './types';
import phytophthoraImg from './src/assets/images/phytophthora_stem_rot_1779624179481.png';
import bactroceraImg from './src/assets/images/bactrocera_fruit_fly_1779624198875.png';
import anthracnoseImg from './src/assets/images/anthracnose_patek_1779624216969.png';
import brownPlanthopperImg from './src/assets/images/nilaparvata_lugens_rice_1780069819951.png';
import bulaiCornImg from './src/assets/images/bulai_corn_disease_1780069845397.png';
import ulatGrayakImg from './src/assets/images/ulat_grayak_jagung_1780069867037.png';
import riceStemBorerImg from './src/assets/images/rice_stem_borer_beluk_1780069889921.png';
import cacaoPodRotImg from './src/assets/images/cacao_pod_rot_disease_1780069916151.png';

export const PEST_DATA: PestInfo[] = [
  {
    id: '1',
    name: 'Busuk Batang (Phytophthora)',
    host: 'Tanaman Petai & Hortikultura',
    symptoms: 'Batang menghitam, keluar lendir cokelat kehitaman, kulit kayu membusuk dan mengelupas, tanaman layu tiba-tiba.',
    control: 'Sanitasi drainase lahan, pemangkasan bagian yang sakit, mengoleskan bubur bordeaux atau aplikasi fungisida tembaga secara terarah.',
    imageUrl: phytophthoraImg
  },
  {
    id: '2',
    name: 'Lalat Buah (Bactrocera)',
    host: 'Cabai, Tomat & Mangga',
    symptoms: 'Buah berlubang kecil (bekas tusukan ovipositor), membusuk dari dalam karena larva, dan rontok sebelum waktunya.',
    control: 'Pemasangan perangkap atraktan metil eugenol (petrogenol), pembungkusan buah, pengumpulan serta pembakaran buah yang rontok.',
    imageUrl: bactroceraImg
  },
  {
    id: '3',
    name: 'Antraknosa (Patek)',
    host: 'Cabai, Tomat & Pepaya',
    symptoms: 'Bercak melingkar cekung berwarna coklat hingga kehitaman pada buah, yang kemudian meluas membentuk lingkaran konsentris basah.',
    control: 'Gunakan benih unggul bebas penyakit, atur spasasi atau jarak tanam agar tidak terlalu lembap, dan semprot fungisida nabati atau kimia secara preventif.',
    imageUrl: anthracnoseImg
  },
  {
    id: '4',
    name: 'Wereng Batang Coklat (Nilaparvata lugens)',
    host: 'Tanaman Padi',
    symptoms: 'Tanaman padi menguning, mengering mengeras seperti terbakar (Hopperburn) secara melingkar di tengah hamparan sawah.',
    control: 'Gunakan varietas tahan wereng (Inpari), penerapan jarak tanam jajar legowo, pengairan berselang, serta pelestarian musuh alami seperti laba-laba.',
    imageUrl: brownPlanthopperImg
  },
  {
    id: '5',
    name: 'Penyakit Bulai (Peronosclerospora maydis)',
    host: 'Tanaman Jagung',
    symptoms: 'Daun menunjukkan garis-garis kuning keputihan pararel memanjang, pertumbuhan tanaman kerdil, dan tidak menghasilkan tongkol.',
    control: 'Gunakan benih hibrida bermutu tinggi, perlakuan benih (seed treatment) dengan fungisida berbahan aktif metalaksil, dan musnahkan tanaman yang terinfeksi dini.',
    imageUrl: bulaiCornImg
  },
  {
    id: '6',
    name: 'Ulat Grayak Jagung (Spodoptera frugiperda)',
    host: 'Tanaman Jagung',
    symptoms: 'Daun jagung berlubang-lubang besar tidak beraturan, terdapat sisa kotoran seperti serbuk gergaji basah pada pucuk atau pupus daun.',
    control: 'Tanam serentak, rotasi tanaman non-graminae, aplikasi bio-pestisida Bacillus thuringiensis (Bt), atau pemanfaatan parasitoid Trichogramma.',
    imageUrl: ulatGrayakImg
  },
  {
    id: '7',
    name: 'Penggerek Batang Padi (Scirpophaga innotata)',
    host: 'Tanaman Padi',
    symptoms: 'Pucuk tanaman padi mengering dan mati pada fase vegetatif (disebut Sundep), atau malai padi hampa dan berwarna putih pada fase generatif (disebut Beluk).',
    control: 'Kumpulkan kelompok telur di pesemaian, penggenangan sawah setelah panen, atur waktu tanam serentak, dan pasang perangkap lampu (light trap).',
    imageUrl: riceStemBorerImg
  },
  {
    id: '8',
    name: 'Busuk Buah Kakao (Phytophthora palmivora)',
    host: 'Tanaman Kakao',
    symptoms: 'Bercak cokelat basah dimulai dari ujung atau pangkal buah kakao yang dengan cepat meluas hingga seluruh buah menghitam dan busuk.',
    control: 'Pemangkasan rutin untuk menurunkan kelembapan kebun, sanitasi dengan membuang buah busuk dari pohon, dan aplikasi ragi Trichoderma harzianum.',
    imageUrl: cacaoPodRotImg
  }
];

export const ARCHIVE_DATA: Report[] = [
  { id: 'R1', title: 'Laporan Bulanan September 2025', date: '2025-09-30', category: 'Bulanan', summary: 'Rekapitulasi serangan OPT di 5 desa binaan.', url: 'https://drive.google.com' },
  { id: 'R2', title: 'Laporan Bulanan Oktober 2025', date: '2025-10-31', category: 'Bulanan', summary: 'Penurunan intensitas serangan Lalat Buah.', url: 'https://drive.google.com' },
  { id: 'R3', title: 'Laporan Bulanan November 2025', date: '2025-11-30', category: 'Bulanan', summary: 'Waspada Antraknosa pada musim hujan.', url: 'https://drive.google.com' },
  { id: 'R4', title: 'Laporan Bulanan Desember 2025', date: '2025-12-31', category: 'Bulanan', summary: 'Evaluasi tahunan program pengendalian OPT.', url: 'https://drive.google.com' }
];
