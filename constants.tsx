
import { PestInfo, Report } from './types';

export const PEST_DATA: PestInfo[] = [
  {
    id: '1',
    name: 'Busuk Batang (Phytophthora)',
    host: 'Tanaman Petai',
    symptoms: 'Batang menghitam, keluar lendir, kulit kayu mengelupas.',
    control: 'Sanitasi lahan, pemangkasan bagian yang sakit, aplikasi fungisida tembaga.',
    imageUrl: 'https://picsum.photos/seed/pest1/600/400'
  },
  {
    id: '2',
    name: 'Lalat Buah (Bactrocera)',
    host: 'Cabai & Tomat',
    symptoms: 'Buah berlubang kecil, membusuk, dan rontok sebelum waktunya.',
    control: 'Pemasangan perangkap feromon, pembungkusan buah, pemusnahan buah yang rontok.',
    imageUrl: 'https://picsum.photos/seed/pest2/600/400'
  },
  {
    id: '3',
    name: 'Antraknosa (Patek)',
    host: 'Cabai',
    symptoms: 'Bercak coklat kehitaman melingkar pada buah cabai yang matang.',
    control: 'Gunakan benih sehat, atur jarak tanam, aplikasi fungisida secara terjadwal.',
    imageUrl: 'https://picsum.photos/seed/pest3/600/400'
  }
];

export const ARCHIVE_DATA: Report[] = [
  { id: 'R1', title: 'Laporan Bulanan September 2025', date: '2025-09-30', category: 'Bulanan', summary: 'Rekapitulasi serangan OPT di 5 desa binaan.', url: 'https://drive.google.com' },
  { id: 'R2', title: 'Laporan Bulanan Oktober 2025', date: '2025-10-31', category: 'Bulanan', summary: 'Penurunan intensitas serangan Lalat Buah.', url: 'https://drive.google.com' },
  { id: 'R3', title: 'Laporan Bulanan November 2025', date: '2025-11-30', category: 'Bulanan', summary: 'Waspada Antraknosa pada musim hujan.', url: 'https://drive.google.com' },
  { id: 'R4', title: 'Laporan Bulanan Desember 2025', date: '2025-12-31', category: 'Bulanan', summary: 'Evaluasi tahunan program pengendalian OPT.', url: 'https://drive.google.com' }
];
