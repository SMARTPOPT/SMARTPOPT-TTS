import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar, Layers, Activity, Bell, Info, ShieldCheck, ShoppingBag, Plus, Trash2, Clock, CheckCircle2, AlertTriangle, MessageSquare, ArrowRight, BookOpen, Send, Sparkles, ChevronLeft, ChevronRight, X, Sprout, Flower, Bug } from 'lucide-react';

interface CropPreset {
  id: string;
  name: string;
  category: 'horti' | 'pangan' | 'perkebunan' | 'kustom';
  durationDays: number;
  stages: {
    semai: { start: number; end: number; desc: string };
    tanam: { day: number; desc: string };
    pupuk1: { day: number; desc: string; amountPerHa: { urea: number; npk: number; other?: string } };
    pupuk2: { day: number; desc: string; amountPerHa: { urea: number; npk: number; other?: string } };
    optRisk: { start: number; end: number; pests: string[]; level: 'Tinggi' | 'Sedang'; desc: string };
    pembungaan: { day: number; desc: string };
    panen: { start: number; end: number; desc: string };
  };
}

interface RawCropPreset {
  id: string;
  name: string;
  category: 'horti' | 'pangan' | 'perkebunan';
  semaiDuration: number;
  panenHSTStart: number;
  panenHSTEnd: number;
  pupuk1HST: number;
  pupuk2HST: number;
  pupuk1Urea: number;
  pupuk1Npk: number;
  pupuk1Other?: string;
  pupuk2Urea: number;
  pupuk2Npk: number;
  pupuk2Other?: string;
  optStartHST: number;
  optEndHST: number;
  optPests: string[];
  optDesc: string;
  flowerHST: number;
  semaiDesc: string;
  tanamDesc: string;
}

const RAW_CROP_PRESETS: RawCropPreset[] = [
  {
    id: 'padi',
    name: 'Padi Sawah (IR-64)',
    category: 'pangan',
    semaiDuration: 20,
    panenHSTStart: 85,
    panenHSTEnd: 95,
    pupuk1HST: 10,
    pupuk1Urea: 100,
    pupuk1Npk: 150,
    pupuk2HST: 30,
    pupuk2Urea: 50,
    pupuk2Npk: 100,
    optStartHST: 20,
    optEndHST: 50,
    optPests: ['Wereng Coklat', 'Penggerek Batang', 'Tikus Sawah', 'Hawar Daun Bakteri'],
    optDesc: 'Fase vegetatif akhir sangat rentan serangan Wereng Coklat & Penggerek Batang.',
    flowerHST: 54,
    semaiDesc: 'Penyemaian benih padi dengan media tanah basah berlumpur.',
    tanamDesc: 'Pemindahan bibit semai ke sawah (0 HST - Hari Setelah Tanam).'
  },
  {
    id: 'jagung',
    name: 'Jagung Hibrida (Pertiwi)',
    category: 'pangan',
    semaiDuration: 0,
    panenHSTStart: 95,
    panenHSTEnd: 105,
    pupuk1HST: 15,
    pupuk1Urea: 150,
    pupuk1Npk: 100,
    pupuk2HST: 35,
    pupuk2Urea: 100,
    pupuk2Npk: 150,
    optStartHST: 20,
    optEndHST: 60,
    optPests: ['Ulat Grayak Jagung (Spodoptera frugiperda)', 'Bulai (Peronosclerospora)', 'Penggerek Tongkol'],
    optDesc: 'Ulat grayak jagung merusak pucuk daun mudanya. Lakukan pengamatan berkala pagi hari.',
    flowerHST: 55,
    semaiDesc: 'Ditanam langsung benih kering di lubang tanam kedalaman 3-5 cm.',
    tanamDesc: 'Tanam langsung menggunakan alat tugal manual.'
  },
  // the 20 customizable horticultural crops:
  {
    id: 'cabai-besar',
    name: 'Cabai Besar',
    category: 'horti',
    semaiDuration: 25, // range 21-28 hari
    panenHSTStart: 90,
    panenHSTEnd: 120, // 90-120 HST
    pupuk1HST: 10,
    pupuk1Urea: 30,
    pupuk1Npk: 90,
    pupuk1Other: 'KNO3 Merah 15 kg',
    pupuk2HST: 25,
    pupuk2Urea: 20,
    pupuk2Npk: 120,
    pupuk2Other: 'KNO3 Putih 20 kg',
    optStartHST: 20,
    optEndHST: 50,
    optPests: ['Thrips', 'Kutu Kebul', 'Layu Bakteri', 'Antraknosa / Pathek'],
    optDesc: 'Waspadai virus kuning gemini yang ditularkan Kutu Kebul dan serangan pathek saat hujan.',
    flowerHST: 35,
    semaiDesc: 'Semaikan benih pada tray semai dengan pupuk organik steril.',
    tanamDesc: 'Pindah tanam ke bedengan mulsa plastik pada pagi atau sore hari.'
  },
  {
    id: 'cabai-rawit',
    name: 'Cabai Rawit',
    category: 'horti',
    semaiDuration: 25, // range 21-28 hari
    panenHSTStart: 90,
    panenHSTEnd: 120, // 90-120 HST
    pupuk1HST: 10,
    pupuk1Urea: 30,
    pupuk1Npk: 80,
    pupuk1Other: 'KNO3 Putih 15 kg',
    pupuk2HST: 25,
    pupuk2Urea: 20,
    pupuk2Npk: 100,
    pupuk2Other: 'Boron 10 kg',
    optStartHST: 20,
    optEndHST: 55,
    optPests: ['Thrips parvispinus', 'Kutu Kebul', 'Tungau', 'Layu Fusarium'],
    optDesc: 'Waspadai penularan kutu daun dan kerontokan bunga mendadak akibat trips daun.',
    flowerHST: 40,
    semaiDesc: 'Semaikan benih pada media steril baki semai terlindung air hujan deras.',
    tanamDesc: 'Tanam bibit umur 4 minggu tegak lurus pada lubang mulsa plastik.'
  },
  {
    id: 'tomat',
    name: 'Tomat',
    category: 'horti',
    semaiDuration: 21, // range 18-25 hari
    panenHSTStart: 80,
    panenHSTEnd: 100, // 80-100 HST
    pupuk1HST: 7,
    pupuk1Urea: 20,
    pupuk1Npk: 80,
    pupuk2HST: 21,
    pupuk2Urea: 30,
    pupuk2Npk: 100,
    pupuk2Other: 'Kalsium Super',
    optStartHST: 15,
    optEndHST: 45,
    optPests: ['Ulat Buah Tomat', 'Busuk Daun (Phytophthora)', 'Kutu Daun / Aphids', 'Layu Bakteri'],
    optDesc: 'Cegah Kelembaban berlebih di sekitar bedengan untuk mendinginkan spora jamur Phytophthora.',
    flowerHST: 30,
    semaiDesc: 'Semaikan benih di tempat teduh. Semprot air halus setiap pagi.',
    tanamDesc: 'Penanaman bibit sehat berdaun 4-5 helai ke lubang tanam.'
  },
  {
    id: 'terong',
    name: 'Terong',
    category: 'horti',
    semaiDuration: 28, // range 25-30 hari
    panenHSTStart: 90,
    panenHSTEnd: 120, // 90-120 HST
    pupuk1HST: 10,
    pupuk1Urea: 40,
    pupuk1Npk: 100,
    pupuk2HST: 30,
    pupuk2Urea: 30,
    pupuk2Npk: 120,
    optStartHST: 20,
    optEndHST: 60,
    optPests: ['Kumbang Daun Epilachna', 'Kutu Daun Hijau', 'Layu Verticillium'],
    optDesc: 'Amati bagian bawah daun untuk pencegahan dini kutu daun pengisap cairan tanaman.',
    flowerHST: 40,
    semaiDesc: 'Semaikan biji terong dalam pot polybag mini beralaskan pupuk kandang matang.',
    tanamDesc: 'Tanam bibit sejati berdaun 4 helai dengan sirkulasi drainase bedeng lebar.'
  },
  {
    id: 'kubis',
    name: 'Kubis',
    category: 'horti',
    semaiDuration: 22, // range 20-25 hari
    panenHSTStart: 90,
    panenHSTEnd: 125, // 90-120 HST
    pupuk1HST: 14,
    pupuk1Urea: 60,
    pupuk1Npk: 100,
    pupuk2HST: 28,
    pupuk2Urea: 50,
    pupuk2Npk: 120,
    optStartHST: 15,
    optEndHST: 40,
    optPests: ['Ulat Daun Kubis Plutella', 'Ulat Krop Crocidolomia', 'Akar Gada'],
    optDesc: 'Pantau ulat krop merusak titik tumbuh lingkaran daun tengah kubis muda.',
    flowerHST: 0,
    semaiDesc: 'Penaburan benih kubis merata pada wadah persemaian beratap daun kelapa.',
    tanamDesc: 'Pindahkan bibit terpilih ke atas bedengan gundukan tinggi penahan banjir.'
  },
  {
    id: 'brokoli',
    name: 'Brokoli',
    category: 'horti',
    semaiDuration: 22, // range 20-25 hari
    panenHSTStart: 80,
    panenHSTEnd: 100, // 80-100 HST
    pupuk1HST: 14,
    pupuk1Urea: 50,
    pupuk1Npk: 100,
    pupuk2HST: 28,
    pupuk2Urea: 40,
    pupuk2Npk: 110,
    optStartHST: 15,
    optEndHST: 40,
    optPests: ['Ulat Plutella xylostella', 'Busuk Hitam Xanthomonas', 'Hama Belalang'],
    optDesc: 'Lakukan sanitasi lingkungan krop agar terjaga bebas dari hama pemakan kuntum brokoli.',
    flowerHST: 0,
    semaiDesc: 'Penyemaian keping benih brokoli di kotak kayu bertanah humus lempung.',
    tanamDesc: 'Tanam bibit brokoli sore hari di bedengan berlapis mulsa jerami alami.'
  },
  {
    id: 'sawi',
    name: 'Sawi',
    category: 'horti',
    semaiDuration: 17, // range 14-21 hari
    panenHSTStart: 40,
    panenHSTEnd: 50, // 40-50 HST
    pupuk1HST: 7,
    pupuk1Urea: 30,
    pupuk1Npk: 40,
    pupuk2HST: 15,
    pupuk2Urea: 20,
    pupuk2Npk: 30,
    optStartHST: 10,
    optEndHST: 25,
    optPests: ['Ulat Grayak Spodoptera', 'Siput Telanjang', 'Rebah Semai (Pythium)'],
    optDesc: 'Waspadai daun berguguran bolong akibat ulat dan keong tanah basah di malam hari.',
    flowerHST: 0,
    semaiDesc: 'Semaikan benih kecil sawi di baki rata dengan taburan pupuk kompos halus.',
    tanamDesc: 'Tanam sebar bibit dengan jarak seimbang lurus 20x20 cm agar daun tumbuh lebat.'
  },
  {
    id: 'selada',
    name: 'Selada',
    category: 'horti',
    semaiDuration: 17, // range 14-21 hari
    panenHSTStart: 45,
    panenHSTEnd: 60, // 45-60 HST
    pupuk1HST: 7,
    pupuk1Urea: 25,
    pupuk1Npk: 40,
    pupuk2HST: 15,
    pupuk2Urea: 15,
    pupuk2Npk: 30,
    optStartHST: 10,
    optEndHST: 25,
    optPests: ['Kutu Daun Aphids', 'Siput Kebun', 'Busuk Basah Erwinia'],
    optDesc: 'Cegah genangan air di daun bagian bawah untuk membendung perkembangan infeksi busuk daun.',
    flowerHST: 0,
    semaiDesc: 'Tebarkan benih selada pada media sekam bakar subur beralaskan sirkulasi air tipis.',
    tanamDesc: 'Tanam bibit berakar bersih putih di bedengan rimbun sekam manis.'
  },
  {
    id: 'bawang-merah',
    name: 'Bawang Merah',
    category: 'horti',
    semaiDuration: 0, // - (langsung tanam umbi)
    panenHSTStart: 60,
    panenHSTEnd: 70, // 60-70 HST
    pupuk1HST: 10,
    pupuk1Urea: 50,
    pupuk1Npk: 120,
    pupuk1Other: 'ZA 80 kg',
    pupuk2HST: 25,
    pupuk2Urea: 30,
    pupuk2Npk: 150,
    pupuk2Other: 'KNO3 Putih 25 kg',
    optStartHST: 15,
    optEndHST: 45,
    optPests: ['Ulat Grayak', 'Layu Mboler Fusarium', 'Thrips Bawang'],
    optDesc: 'Gantung perangkap lem kuning dan lampu ultraviolet pada malam hari untuk mematikan induk ulat.',
    flowerHST: 0,
    semaiDesc: 'Ditanam langsung murni dari siung umbi bibit bermutu tinggi kering simpan.',
    tanamDesc: 'Tancapkan umbi bawang sedalam 2/3 bagian ke tanah bedengan datar berdrainase tinggi.'
  },
  {
    id: 'bawang-daun',
    name: 'Bawang Daun',
    category: 'horti',
    semaiDuration: 35, // range 30-40 hari
    panenHSTStart: 60,
    panenHSTEnd: 80, // 60-80 HST
    pupuk1HST: 15,
    pupuk1Urea: 40,
    pupuk1Npk: 80,
    pupuk2HST: 35,
    pupuk2Urea: 30,
    pupuk2Npk: 100,
    optStartHST: 20,
    optEndHST: 55,
    optPests: ['Thrips Tabaci', 'Ulat Daun Bawang', 'Karat Daun Bawang'],
    optDesc: 'Potong ujung daun kuning karat secepatnya agar spora Puccinia tidak menular ke rumpun tetangga.',
    flowerHST: 0,
    semaiDesc: 'Penyemaian biji bawang daun halus di bedengan pembibitan bertaburkan pupuk organik.',
    tanamDesc: 'Pindahkan bibit berumur 5 minggu, tanam serempak tegak lurus mengarah tajuk anakan.'
  },
  {
    id: 'mentimun',
    name: 'Mentimun',
    category: 'horti',
    semaiDuration: 0, // - (langsung benih)
    panenHSTStart: 40,
    panenHSTEnd: 50, // 40-50 HST
    pupuk1HST: 10,
    pupuk1Urea: 30,
    pupuk1Npk: 60,
    pupuk2HST: 20,
    pupuk2Urea: 20,
    pupuk2Npk: 80,
    optStartHST: 15,
    optEndHST: 35,
    optPests: ['Kumbang Daun Oteng-oteng', 'Kutu Kebul', 'Embun Tepung / Mildew'],
    optDesc: 'Amati serangga merah oranye pemakan permukaan daun. Semprot pestisida hayati mimba.',
    flowerHST: 25,
    semaiDesc: 'Ditanam langsung benih murni mentimun tanpa melalui masa baki persemaian.',
    tanamDesc: 'Isi lubang tanam dengan 1-2 benih kering mentimun, tutupi abu sekam tipis rata.'
  },
  {
    id: 'kacang-panjang',
    name: 'Kacang Panjang',
    category: 'horti',
    semaiDuration: 0, // - (langsung benih)
    panenHSTStart: 45,
    panenHSTEnd: 60, // 45-60 HST
    pupuk1HST: 10,
    pupuk1Urea: 25,
    pupuk1Npk: 50,
    pupuk2HST: 25,
    pupuk2Urea: 20,
    pupuk2Npk: 70,
    optStartHST: 15,
    optEndHST: 40,
    optPests: ['Kutu Hitam Aphids', 'Ulat Polong Maruca', 'Lalat Kacang Merusak Polong'],
    optDesc: 'Semprotkan rebusan air daun sirsak jika kutu aphid hitam mulai merubung pucuk rambatan.',
    flowerHST: 30,
    semaiDesc: 'Ditanam langsung tanpa semai di lubang bedengan yang siap terpasang tiang lanjaran.',
    tanamDesc: 'Tanam langsung benih kacang sedalam 3 cm, basahi tanah pasca dilingkari kompos.'
  },
  {
    id: 'pare',
    name: 'Pare',
    category: 'horti',
    semaiDuration: 0, // - (langsung benih)
    panenHSTStart: 55,
    panenHSTEnd: 70, // 55-70 HST
    pupuk1HST: 10,
    pupuk1Urea: 30,
    pupuk1Npk: 70,
    pupuk2HST: 25,
    pupuk2Urea: 25,
    pupuk2Npk: 90,
    optStartHST: 15,
    optEndHST: 45,
    optPests: ['Lalat Buah Bactrocera', 'Kumbang Daun Oteng-oteng', 'Layu Patogen'],
    optDesc: 'Bungkus pare muda menggunakan koran atau kertas semen pelindung lalat menyisipkan telur buah.',
    flowerHST: 35,
    semaiDesc: 'Rendam biji pare berkulit keras semalaman di air hangat sebelum dibenamkan.',
    tanamDesc: 'Benamkan langsung biji pare di samping tiang rambatan paray berukuran lebar.'
  },
  {
    id: 'semangka',
    name: 'Semangka',
    category: 'horti',
    semaiDuration: 8, // range 7-10 hari
    panenHSTStart: 70,
    panenHSTEnd: 80, // 70-80 HST
    pupuk1HST: 7,
    pupuk1Urea: 40,
    pupuk1Npk: 80,
    pupuk2HST: 21,
    pupuk2Urea: 30,
    pupuk2Npk: 120,
    optStartHST: 15,
    optEndHST: 40,
    optPests: ['Kutu Kebul', 'Thrips Daun', 'Layu Golongan Fusarium', 'Kresek Daun'],
    optDesc: 'Kurangi pengairan di sela bedengan untuk mencegah akar lumat memicu busuk buah melon-semangka.',
    flowerHST: 30,
    semaiDesc: 'Rendam benih retak ujung, tiriskan dan letakkan di wadah semai beralas pasir humus.',
    tanamDesc: 'Pindahkan bibit berdaun 4 helai ke puncak bedengan pasir subur berangkai.'
  },
  {
    id: 'melon',
    name: 'Melon',
    category: 'horti',
    semaiDuration: 11, // range 7-14 hari
    panenHSTStart: 65,
    panenHSTEnd: 80, // 65-80 HST
    pupuk1HST: 10,
    pupuk1Urea: 45,
    pupuk1Npk: 90,
    pupuk2HST: 25,
    pupuk2Urea: 35,
    pupuk2Npk: 130,
    optStartHST: 15,
    optEndHST: 45,
    optPests: ['Kutu Kebul Gemini', 'Ulat Daun Melon', 'Embun Bulu Pelepah'],
    optDesc: 'Embun bulu memicu daun gembung kuning mengering keriput pekat. Semprotkan agen Hayati.',
    flowerHST: 30,
    semaiDesc: 'Semaikan benih melon miring ke bawah di baki persemaian beralaskan sabut kelapa.',
    tanamDesc: 'Tanam bibit melon dan ikat halus di jalur lanjaran tiang bambu lengkung melingkar.'
  },
  {
    id: 'bayam',
    name: 'Bayam',
    category: 'horti',
    semaiDuration: 0, // - (langsung benih)
    panenHSTStart: 25,
    panenHSTEnd: 30, // 25-30 HST
    pupuk1HST: 7,
    pupuk1Urea: 20,
    pupuk1Npk: 30,
    pupuk2HST: 14,
    pupuk2Urea: 15,
    pupuk2Npk: 20,
    optStartHST: 7,
    optEndHST: 18,
    optPests: ['Ulat Daun Bayam', 'Belalang Kayu', 'Penyakit Karat Putih'],
    optDesc: 'Lakukan penyiangan gulma pengganggu hara di selasela batang bayam darat berumpun.',
    flowerHST: 0,
    semaiDesc: 'Ditanam langsung murni mencampur biji bayam yang sangat halus dengan pasir kering rata.',
    tanamDesc: 'Sebarkan merata di parit-parit kecil bedengan basah berjarak tipis.'
  },
  {
    id: 'kangkung',
    name: 'Kangkung',
    category: 'horti',
    semaiDuration: 0, // - (langsung benih)
    panenHSTStart: 25,
    panenHSTEnd: 30, // 25-30 HST
    pupuk1HST: 7,
    pupuk1Urea: 20,
    pupuk1Npk: 35,
    pupuk2HST: 14,
    pupuk2Urea: 15,
    pupuk2Npk: 25,
    optStartHST: 7,
    optEndHST: 18,
    optPests: ['Ulat Grayak', 'Kutu Daun Kangkung', 'Busuk Leher Akar'],
    optDesc: 'Kangkung darat membutuhkan drainase bedeng baik agar terhindar busuk akar batang air.',
    flowerHST: 0,
    semaiDesc: 'Ditanam langsung menugal lubang tanam beralaskan benih kangkung darat berumpun.',
    tanamDesc: 'Benamkan 3-4 butir benih kangkung di lubang tugal kedalaman 2 cm berjarak 20 cm.'
  },
  {
    id: 'wortel',
    name: 'Wortel',
    category: 'horti',
    semaiDuration: 0, // - (langsung benih)
    panenHSTStart: 90,
    panenHSTEnd: 110, // 90-110 HST
    pupuk1HST: 15,
    pupuk1Urea: 45,
    pupuk1Npk: 80,
    pupuk2HST: 40,
    pupuk2Urea: 35,
    pupuk2Npk: 120,
    optStartHST: 20,
    optEndHST: 60,
    optPests: ['Ulat Tanah Agrotis ipsilon', 'Kutu Daun Wortel', 'Penyakit Busuk Umbi'],
    optDesc: 'Ulat tanah gemar memotong pucuk umbi muda tersembunyi di dalam tanah. Jaga sanitasi gulma.',
    flowerHST: 0,
    semaiDesc: 'Ditanam langsung menabur benih wortel kering halus di celah larikan garis gembur pasir.',
    tanamDesc: 'Sebarkan di parit bedengan tanah berpasir porsi 40%, tutup pupuk kandang tipis pelindung.'
  },
  {
    id: 'kentang',
    name: 'Kentang',
    category: 'horti',
    semaiDuration: 0, // - (langsung umbi)
    panenHSTStart: 100,
    panenHSTEnd: 120, // 100-120 HST
    pupuk1HST: 20,
    pupuk1Urea: 100,
    pupuk1Npk: 155,
    pupuk2HST: 45,
    pupuk2Urea: 80,
    pupuk2Npk: 180,
    optStartHST: 25,
    optEndHST: 70,
    optPests: ['Busuk Late Blight Phytophthora', 'Kutu Daun Myzus persicae', 'Ulat Grayak'],
    optDesc: 'Late blight dapat membuat tanaman lumer busuk dalam 3 hari dingin. Berikan fungisida tembaga.',
    flowerHST: 50,
    semaiDesc: 'Ditanam langsung murni mata tunas umbi kentang sehat berlabel sertifikasi BPSB.',
    tanamDesc: 'Benamkan umbi kentang bertunas ke dalam bedengan tinggi miring kedalaman 8-10 cm.'
  },
  {
    id: 'seledri',
    name: 'Seledri',
    category: 'horti',
    semaiDuration: 35, // range 30-40 hari
    panenHSTStart: 90,
    panenHSTEnd: 120, // 90-120 HST
    pupuk1HST: 15,
    pupuk1Urea: 35,
    pupuk1Npk: 70,
    pupuk2HST: 45,
    pupuk2Urea: 30,
    pupuk2Npk: 90,
    optStartHST: 20,
    optEndHST: 65,
    optPests: ['Bercak Daun Cercospora', 'Ulat Daun Hijau', 'Penyakit Rebah Batang Sclerotium'],
    optDesc: 'Seledri peka kelembaban air melimpah. Bersihkan penyiangan gulma dari naungan daun lembat.',
    flowerHST: 0,
    semaiDesc: 'Penyemaian biji seledri halus di media arang sekam pasir berkadar lembab tinggi teduh.',
    tanamDesc: 'Pindahkan anakan seledri satu per satu ke bedengan bebatuan pasir subur rimbun pupuk.'
  }
];

function buildCropPreset(raw: RawCropPreset, useNursery: boolean): CropPreset {
  const includeNursery = useNursery && raw.semaiDuration > 0;
  const semaiEnd = includeNursery ? raw.semaiDuration : 0;
  const tanamDay = includeNursery ? raw.semaiDuration : 0;

  return {
    id: raw.id,
    name: raw.name,
    category: raw.category as any,
    durationDays: tanamDay + raw.panenHSTEnd,
    stages: {
      semai: {
        start: 0,
        end: semaiEnd,
        desc: includeNursery 
          ? `${raw.semaiDesc || 'Penyemaian benih pada media gembur steril.'} (Masa semai: ${raw.semaiDuration} hari).` 
          : 'Ditanam langsung murni tanpa penyemaian.'
      },
      tanam: {
        day: tanamDay,
        desc: raw.tanamDesc || 'Pemindahan bibit semai prima siap tanam ke bedengan lahan utama.'
      },
      pupuk1: {
        day: tanamDay + raw.pupuk1HST,
        desc: `Pemupukan dasar masa vegetatif awal (${raw.pupuk1HST} HST) mengoptimalkan pacu daun hijau sehat.`,
        amountPerHa: {
          urea: raw.pupuk1Urea,
          npk: raw.pupuk1Npk,
          other: raw.pupuk1Other
        }
      },
      pupuk2: {
        day: tanamDay + raw.pupuk2HST,
        desc: `Pemupukan susulan lanjutan (${raw.pupuk2HST} HST) melengkapi nutrisi pembentukan anakan cabang dan buah baru.`,
        amountPerHa: {
          urea: raw.pupuk2Urea,
          npk: raw.pupuk2Npk,
          other: raw.pupuk2Other
        }
      },
      optRisk: {
        start: tanamDay + raw.optStartHST,
        end: tanamDay + raw.optEndHST,
        pests: raw.optPests,
        level: 'Tinggi',
        desc: raw.optDesc
      },
      pembungaan: {
        day: tanamDay + raw.flowerHST,
        desc: raw.flowerHST > 0 
          ? `Tunas pembungaan perdana mulai bermunculan aktif (${raw.flowerHST} HST).` 
          : 'Fase generatif pembentukan anakan maksimal.'
      },
      panen: {
        start: tanamDay + raw.panenHSTStart,
        end: tanamDay + raw.panenHSTEnd,
        desc: `Masa buah rimbun siap dipanen secara selektif berkala (${raw.panenHSTStart}-${raw.panenHSTEnd} HST) untuk nilai jual terbaik.`
      }
    }
  };
}

export default function KalenderTanam() {
  const [activeTab, setActiveTabLocal] = useState<'timeline' | 'weekly' | 'sop' | 'notif'>('timeline');
  const [category, setCategory] = useState<'horti' | 'pangan' | 'perkebunan' | 'kustom'>('pangan');
  const [selectedCropId, setSelectedCropId] = useState<string>('padi');
  const [plantingDate, setPlantingDate] = useState<string>(
    new Date().toISOString().substring(0, 10)
  );
  const [landArea, setLandArea] = useState<number>(0.5); // in Hectares
  const [useNursery, setUseNursery] = useState<boolean>(true);

  // Dynamically build CROP_PRESETS based on raw definitions and the nursery state
  const CROP_PRESETS = useMemo(() => {
    return RAW_CROP_PRESETS.map(raw => buildCropPreset(raw, useNursery));
  }, [useNursery]);

  // Custom Crop state
  const [customCropName, setCustomCropName] = useState('Cabai Rawit Nule');
  const [customDuration, setCustomDuration] = useState(100);
  const [customStages, setCustomStages] = useState({
    semaiEnd: 20,
    tanamDay: 21,
    pupuk1Day: 30,
    pupuk2Day: 45,
    optRiskStart: 35,
    optRiskEnd: 70,
    pembungaanDay: 55,
    panenStart: 85,
    panenEnd: 100,
  });

  // Checklist of completed activities (persisted in localStorage)
  const [completedTasks, setCompletedTasks] = useState<Record<string, boolean>>({});

  // Notification Simulation
  const [userName, setUserName] = useState('');
  const [userPhone, setUserPhone] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [simulatedAlerts, setSimulatedAlerts] = useState<string[]>([]);
  const [phoneType, setPhoneType] = useState<'all' | 'alert' | 'schedule'>('all');

  // Load custom crop data and tasks on init
  useEffect(() => {
    const savedTasks = localStorage.getItem('popt_completed_tasks');
    if (savedTasks) {
      try {
        setCompletedTasks(JSON.parse(savedTasks));
      } catch (e) {
        console.error(e);
      }
    }
    const savedName = localStorage.getItem('popt_username');
    const savedPhone = localStorage.getItem('popt_phone');
    if (savedName) setUserName(savedName);
    if (savedPhone) setUserPhone(savedPhone);
  }, []);

  const toggleTask = (taskId: string) => {
    const newTasks = { ...completedTasks, [taskId]: !completedTasks[taskId] };
    setCompletedTasks(newTasks);
    localStorage.setItem('popt_completed_tasks', JSON.stringify(newTasks));
  };

  // Obtain selected crop settings
  let activeCrop: CropPreset;
  if (selectedCropId === 'kustom') {
    activeCrop = {
      id: 'kustom',
      name: customCropName,
      category: 'kustom',
      durationDays: customDuration,
      stages: {
        semai: { start: 0, end: customStages.semaiEnd, desc: 'Penyemaian bibit tanaman secara manual dan terkontrol.' },
        tanam: { day: customStages.tanamDay, desc: 'Penanaman bibit siap ke bedengan utama (0 HST).' },
        pupuk1: { day: customStages.pupuk1Day, desc: 'Aplikasi pemupukan berkala awal pertumbuhan.', amountPerHa: { urea: 80, npk: 120 } },
        pupuk2: { day: customStages.pupuk2Day, desc: 'Aplikasi pemupukan penunjang lanjutan.', amountPerHa: { urea: 40, npk: 80 } },
        optRisk: {
          start: customStages.optRiskStart,
          end: customStages.optRiskEnd,
          pests: ['Kutu Pendedas', 'Ulat Sayur', 'Penyakit Daun', 'Layu Jamur'],
          level: 'Tinggi',
          desc: 'Risiko hama dan patogen meningkat seiring kepadatan daun.'
        },
        pembungaan: { day: customStages.pembungaanDay, desc: 'Tumbuhnya bunga perdana menandai fase generatif.' },
        panen: { start: customStages.panenStart, end: customStages.panenEnd, desc: 'Periode pemetikan hasil panen bertahap.' }
      }
    };
  } else {
    activeCrop = CROP_PRESETS.find(c => c.id === selectedCropId) || CROP_PRESETS[0];
  }

  // Active Category Filtering
  useEffect(() => {
    if (selectedCropId !== 'kustom') {
      const matched = CROP_PRESETS.find(c => c.category === category);
      if (matched) {
        setSelectedCropId(matched.id);
      }
    }
  }, [category, CROP_PRESETS, selectedCropId]);

  // Calculations of absolute dates based on Planting date (defaults to Today)
  const getCalculatedDate = (offsetDaysFromTanam: number) => {
    const basePlanting = new Date(plantingDate);
    basePlanting.setDate(basePlanting.getDate() + offsetDaysFromTanam);
    return basePlanting.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const getDayOffsetFormatted = (stageDay: number) => {
    const diff = stageDay - activeCrop.stages.tanam.day;
    if (diff === 0) return 'Tanam (0 HST)';
    return diff > 0 ? `+${diff} HST` : `${Math.abs(diff)} Hari Sebelum Tanam`;
  };

  const calculateDoses = (amountPerHa: number) => {
    return (amountPerHa * landArea).toFixed(1);
  };

  // State variables for interactive calendar widget
  const [selectedCalendarDay, setSelectedCalendarDay] = useState<number | null>(null);
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<Date | null>(null);
  const [currentMonthIndex, setCurrentMonthIndex] = useState<number>(0);

  // Reset selected month when crop type or planting date changes
  useEffect(() => {
    setCurrentMonthIndex(0);
  }, [selectedCropId, plantingDate]);

  // Months name array in Indonesian
  const INDONESIAN_MONTHS = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  // Retrieve comprehensive SOP recommendations & info based on Crop Age Day (0 to activeCrop.durationDays)
  const getDetailsForCropAge = (age: number) => {
    const info = {
      phase: 'Masa Vegetatif',
      phaseDesc: 'Tanaman fokus pada pemanjangan tunas, pengakaran daun, dan peningkatan anakan.',
      colorTheme: 'emerald', // emerald, green, blue, rose, amber, yellow, slate
      badgeText: 'Pertumbuhan',
      recommendations: [] as string[],
      pestsWarning: [] as string[],
      pestsDesc: '',
      logistics: null as any,
      taskKey: '',
    };

    const semai = activeCrop.stages.semai;
    const tanam = activeCrop.stages.tanam;
    const pupuk1 = activeCrop.stages.pupuk1;
    const pupuk2 = activeCrop.stages.pupuk2;
    const opt = activeCrop.stages.optRisk;
    const flower = activeCrop.stages.pembungaan;
    const panen = activeCrop.stages.panen;

    // 1. Semai Phase (Nursery)
    if (semai.end > 0 && age >= semai.start && age <= semai.end) {
      info.phase = 'Penyemaian Benih (Nursery)';
      info.phaseDesc = semai.desc;
      info.colorTheme = 'emerald';
      info.badgeText = 'Penyemaian';
      info.recommendations = [
        'Gunakan media semai gembur (pupuk organik & tanah steril 1:1) agar kecambah tumbuh tegak.',
        'Sediakan peneduh paranet pelindung hujan lebat dan tirai penahan hama kocor.',
        'Lakukan penyemprotan air berbutir halus secara rutin setiap pagi/sore hari.'
      ];
      info.taskKey = 'semai';
    }
    // 2. Planting Day
    else if (age === tanam.day) {
      info.phase = 'Hari Pindah Tanam (0 HST)';
      info.phaseDesc = tanam.desc;
      info.colorTheme = 'green';
      info.badgeText = 'Tanam Utama';
      info.recommendations = [
        'Ambil bibit tanaman dari baki penyemaian dengan hati-hati, jangan dicabut kasar agar akar tidak patah.',
        'Atur genangan air sawah setinggi 1-2 cm (macak-macak) agar mempercepat adaptasi perakaran.',
        'Campurkan agen hayati Trichoderma di lubang bedengan untuk mencegah layu jamur tular-tanah.'
      ];
      info.taskKey = 'tanam';
    }
    // 3. Pupuk 1 Day
    else if (age === pupuk1.day) {
      info.phase = `Jadwal Pemupukan Pertama (${pupuk1.day - tanam.day} HST)`;
      info.phaseDesc = pupuk1.desc;
      info.colorTheme = 'blue';
      info.badgeText = 'Pupuk Dasar';
      info.recommendations = [
        `Aplikasikan pupuk dasar berimbang: butuh Urea sebesar ${calculateDoses(pupuk1.amountPerHa.urea)} kg dan NPK Phonska sebesar ${calculateDoses(pupuk1.amountPerHa.npk)} kg untuk luas lahan Anda (${landArea} Ha).`,
        pupuk1.amountPerHa.other ? `Tambahan asupan: ${pupuk1.amountPerHa.other}.` : 'Tebarkan pupuk secara merata melingkar mengelilingi tajuk daun tanaman.'
      ];
      info.logistics = pupuk1.amountPerHa;
      info.taskKey = 'pupuk1';
    }
    // 4. Pupuk 2 Day
    else if (age === pupuk2.day) {
      info.phase = `Jadwal Pemupukan Kedua (${pupuk2.day - tanam.day} HST)`;
      info.phaseDesc = pupuk2.desc;
      info.colorTheme = 'blue';
      info.badgeText = 'Pupuk Lanjutan';
      info.recommendations = [
        `Aplikasikan pemupukan lanjutan: butuh Urea ${calculateDoses(pupuk2.amountPerHa.urea)} kg dan NPK Phonska ${calculateDoses(pupuk2.amountPerHa.npk)} kg untuk luas lahan ${landArea} Ha.`,
        pupuk2.amountPerHa.other ? `Suplemen pertumbuhan: ${pupuk2.amountPerHa.other}.` : 'Pastikan tanah cukup lembap basah saat pemupukan agar butiran hara melarut cepat.'
      ];
      info.logistics = pupuk2.amountPerHa;
      info.taskKey = 'pupuk2';
    }
    // 5. Pembungaan Day
    else if (age === flower.day) {
      info.phase = `Pembungaan Perdana (${flower.day - tanam.day} HST)`;
      info.phaseDesc = flower.desc;
      info.colorTheme = 'amber';
      info.badgeText = 'Pembungaan';
      info.recommendations = [
        'Memasuki gerbang fase generatif aktif. Tanaman membutuhkan asupan air yang stabil di area perakaran.',
        'Semprotkan unsur mineral Kalsium & Boron tambahan untuk memperkuat jaring tangkai bunga agar tidak gampang rontok.'
      ];
      info.taskKey = 'flower';
    }
    // 6. Panen Period
    else if (age >= panen.start && age <= panen.end) {
      info.phase = 'Masa Panen Raya Tanaman';
      info.phaseDesc = panen.desc;
      info.colorTheme = 'yellow';
      info.badgeText = 'Panen Raya';
      info.recommendations = [
        'Hentikan pasokan air irigasi 7-10 harian sebelum pemotongan utama agar buah atau bulir mengering serentak.',
        'Lakukan pemetaan ubinan (ukuran 2.5m x 2.5m) di beberapa titik contoh bersama aparat POPT BPP Nule untuk menilai potensi hasil tonase.'
      ];
      info.taskKey = 'harvest';
    }
    // 7. General days
    else {
      if (age > tanam.day && age < flower.day) {
        info.phase = `Pertumbuhan Vegetatif (${age - tanam.day} HST)`;
        info.phaseDesc = 'Periode perkembangan fotosintesis batang tinggi dan tunas anak daun lebat.';
        info.colorTheme = 'emerald';
        info.badgeText = 'Vegetatif';
        info.recommendations = [
          'Bersihkan tanaman dari gulma rumput liar (proses penyiangan manual) agar nutrisi pupuk murni diserap tanaman utama.',
          'Amati jika ada gejala daun menguning tidak wajar untuk antisipasi kekurangan mikronutrien nitrogen.'
        ];
      } else if (age > flower.day && age < panen.start) {
        info.phase = `Pengisian Buah & Bulir (${age - tanam.day} HST)`;
        info.phaseDesc = 'Bunga berguguran beralih melangsungkan pemadatan biji pati karbohidrat penuh.';
        info.colorTheme = 'amber';
        info.badgeText = 'Generatif';
        info.recommendations = [
          'Pantau ketersediaan air tetap lembap (kondisi macak-macak basah), kekeringan parah di umur ini memicu buah kerdil atau hampa.',
          'Hindari herbisida atau pestisida berbahan kimia keras tinggi karena buah panenan sudah mulai terbentuk.'
        ];
      } else {
        info.phase = 'Masa Persiapan Lahan';
        info.phaseDesc = 'Masa sebelum penyemaian dimulai, tanah dibalikkan dan diberi asupan kompos penunjang.';
        info.colorTheme = 'slate';
        info.badgeText = 'Pra-Tanam';
        info.recommendations = [
          'Taburkan kapur pertanian (Dolomit) merata ke sawah apabila pH tanah terukur di bawah 5.5.',
          'Lakukan pengendapan air berkas jerami sisa panen lalu aplikasikan dekomposer mikroba pengurai.'
        ];
      }
    }

    // Checking if targeted day overlaps with scheduled high pest risks
    if (age >= opt.start && age <= opt.end) {
      info.pestsWarning = opt.pests;
      info.pestsDesc = opt.desc;
      // Visually adapt color if vegetative/standard so threat is obvious
      if (info.colorTheme === 'slate' || info.colorTheme === 'emerald') {
        info.colorTheme = 'rose';
        info.badgeText = 'Waspada OPT';
      }
    }

    return info;
  };

  // Set subscription
  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName || !userPhone) return;
    setIsSubscribed(true);
    localStorage.setItem('popt_username', userName);
    localStorage.setItem('popt_phone', userPhone);

    const alertMsg1 = `🔔 [SMART POPT BPP NULE] Halo Bpk/Ibu ${userName}, pendaftaran nomor Anda berhasil! Anda akan menerima update jadwal pemupukan (Biru) dan peringatan dini serangan OPT (Merah) rutin berdasarkan umur tanaman ${activeCrop.name}.`;
    setSimulatedAlerts([alertMsg1]);
  };

  // Weekly calendar compilation (e.g. 15 weeks total)
  const totalWeeks = Math.ceil(activeCrop.durationDays / 7);
  const weeksData = Array.from({ length: totalWeeks }, (_, idx) => {
    const weekNum = idx + 1;
    const startDay = idx * 7;
    const endDay = weekNum * 7;
    
    // Determine overlapping events
    const isActiveSemai = activeCrop.stages.semai.end > 0 && startDay < activeCrop.stages.semai.end;
    const isPlantingWeek = activeCrop.stages.tanam.day >= startDay && activeCrop.stages.tanam.day <= endDay;
    const isPupuk1Week = activeCrop.stages.pupuk1.day >= startDay && activeCrop.stages.pupuk1.day <= endDay;
    const isPupuk2Week = activeCrop.stages.pupuk2.day >= startDay && activeCrop.stages.pupuk2.day <= endDay;
    const isOptionWeek = startDay >= activeCrop.stages.optRisk.start && startDay <= activeCrop.stages.optRisk.end;
    const isFlowerWeek = activeCrop.stages.pembungaan.day >= startDay && activeCrop.stages.pembungaan.day <= endDay;
    const isHarvestWeek = startDay >= activeCrop.stages.panen.start;

    // Phase identification
    let phase = 'Vegetatif (Pertumbuhan Daun)';
    let colorTheme = 'emerald'; // Hijau
    let alertType = '';

    if (isOptionWeek) {
      phase = 'Kerentanan OPT Tinggi (Risiko)';
      colorTheme = 'rose'; // Merah
    } else if (isPupuk1Week || isPupuk2Week) {
      phase = 'Pemupukan Aktif';
      colorTheme = 'blue'; // Biru
    } else if (isFlowerWeek || (startDay > activeCrop.stages.pembungaan.day && !isHarvestWeek)) {
      phase = 'Generatif (Pembungaan/Pengisian)';
      colorTheme = 'amber'; // Kuning
    } else if (isHarvestWeek) {
      phase = 'Panen & Pasca Panen';
      colorTheme = 'yellow';
    } else if (isActiveSemai) {
      phase = 'Semaian Awal';
      colorTheme = 'emerald';
    }

    return {
      weekNum,
      startDay,
      endDay,
      phase,
      colorTheme,
      events: {
        semai: isActiveSemai,
        tanam: isPlantingWeek,
        pupuk1: isPupuk1Week,
        pupuk2: isPupuk2Week,
        optRisk: isOptionWeek,
        flower: isFlowerWeek,
        harvest: isHarvestWeek
      }
    };
  });

  // Calculate current progress
  const completedCount = Object.keys(completedTasks).filter(k => k.startsWith(activeCrop.id) && completedTasks[k]).length;
  const totalTasksForCrop = 7; // 7 key milestones
  const progressPercent = Math.min(100, Math.round((completedCount / totalTasksForCrop) * 100));

  const triggerSimulatedSMS = (type: 'pupuk' | 'opt' | 'panen') => {
    if (!userName) {
      alert('Tulis nama Anda terlebih dahulu di bagian formulir!');
      return;
    }
    let text = '';
    const dateStr = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
    
    if (type === 'pupuk') {
      text = `🔔 [SMART POPT ALERT - ${dateStr}] Yth. ${userName}, Berdasarkan Kalender Tanam, tanaman ${activeCrop.name} Anda memasuki umur ${activeCrop.stages.pupuk1.day} HST. Dijadwalkan pemupukan DOSIS 1 (Biru): butuh Urea ${calculateDoses(activeCrop.stages.pupuk1.amountPerHa.urea)} kg & NPK ${calculateDoses(activeCrop.stages.pupuk1.amountPerHa.npk)} kg untuk luas lahan ${landArea} Ha. `;
    } else if (type === 'opt') {
      text = `⚠️ [SMART POPT AWAS - ${dateStr}] Bpk/Ibu ${userName}, tanaman memasuki hari rawan OPT (${activeCrop.stages.optRisk.start} - ${activeCrop.stages.optRisk.end} HST). Waspadai peningkatan hama: ${activeCrop.stages.optRisk.pests.join(', ')}. Rekomendasi: Bersihkan gulma, pasang trap kuning, kocor agen hayati Trichoderma.`;
    } else {
      text = `🌾 [SMART POPT PANEN - ${dateStr}] Yth. ${userName}, bersiaplah! Estimasi panen ${activeCrop.name} dalam waktu dekat (fase generatif matang). Ambil sampel ubinan di lahan Anda untuk menghitung produktivitas per Hektar.`;
    }

    setSimulatedAlerts(prev => [text, ...prev]);
    setActiveTabLocal('notif');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500" id="smart-kalender-tanam">
      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-emerald-800 to-green-900 rounded-3xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-full bg-emerald-700/10 rounded-full blur-2xl pointer-events-none"></div>
        <div className="relative z-10 space-y-2 max-w-2xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full border border-white/20 text-xs font-bold uppercase tracking-widest text-emerald-200">
            <Sparkles className="w-3.5 h-3.5" />
            <span>SABULAN • Kalender Tanam SMART</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight leading-tight">
            Kalender Tanam & Prediksi OPT Interaktif
          </h1>
          <p className="text-sm md:text-base text-green-150/80 leading-relaxed">
            Pilih jenis tanaman Anda, tentukan musim mulanya, dan kembangkan jadwal pemupukan (Biru) serta waspada mitigasi dini OPT tinggi (Merah) otomatis terstruktur per minggu.
          </p>
        </div>
        <div className="relative z-10 shrink-0 self-start md:self-center">
          <img 
            src="https://lh3.googleusercontent.com/d/1AfqdJADOoZgqIWcnTTr9CqgeG-8pDxEv" 
            alt="Logo POPT" 
            className="w-20 h-20 md:w-24 md:h-24 rounded-full border-4 border-white/20 shadow-2xl bg-white object-contain"
          />
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: Controls & Presets */}
        <div className="lg:col-span-4 bg-white rounded-3xl p-6 shadow-sm border border-slate-150 space-y-6">
          <div>
            <h2 className="text-lg font-black text-slate-800 flex items-center mb-4">
              <Layers className="w-5 h-5 mr-2 text-emerald-600" />
              1. Pilih Jenis Tanaman
            </h2>

            {/* Category Filter */}
            <div className="grid grid-cols-3 gap-1 mb-4 bg-slate-100 p-1 rounded-xl">
              <button 
                onClick={() => { setCategory('pangan'); if (selectedCropId === 'kustom') setSelectedCropId('padi'); }}
                className={`py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer ${category === 'pangan' && selectedCropId !== 'kustom' ? 'bg-white text-emerald-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Pangan
              </button>
              <button 
                onClick={() => { setCategory('horti'); if (selectedCropId === 'kustom') setSelectedCropId('cabai-besar'); }}
                className={`py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer ${category === 'horti' && selectedCropId !== 'kustom' ? 'bg-white text-emerald-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Hortikultura
              </button>
              <button 
                onClick={() => { setSelectedCropId('kustom'); setCategory('kustom'); }}
                className={`py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer ${selectedCropId === 'kustom' ? 'bg-white text-emerald-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Kustom/Lain
              </button>
            </div>

            {/* Crop Selector under active category */}
            {selectedCropId !== 'kustom' ? (
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Spesifik Komoditi</label>
                <select
                  value={selectedCropId}
                  onChange={(e) => setSelectedCropId(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                >
                  {CROP_PRESETS.filter(c => c.category === category).map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.durationDays} Hari)</option>
                  ))}
                </select>
              </div>
            ) : (
              /* Custom Crop Parameters Input form */
              <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 space-y-3">
                <h3 className="text-xs font-bold text-emerald-900 flex items-center">
                  <Plus className="w-3.5 h-3.5 mr-1" /> Parameter Tanaman Kustom Anda
                </h3>
                
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Nama Varietas</label>
                  <input 
                    type="text" 
                    value={customCropName}
                    onChange={(e) => setCustomCropName(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Masa Panen (Hari)</label>
                    <input 
                      type="number" 
                      value={customDuration}
                      onChange={(e) => setCustomDuration(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Umur Tanam (HST)</label>
                    <input 
                      type="number" 
                      value={customStages.tanamDay}
                      onChange={(e) => setCustomStages({...customStages, tanamDay: Number(e.target.value)})}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Pupuk 1 (HST)</label>
                    <input 
                      type="number" 
                      value={customStages.pupuk1Day}
                      onChange={(e) => setCustomStages({...customStages, pupuk1Day: Number(e.target.value)})}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Pupuk 2 (HST)</label>
                    <input 
                      type="number" 
                      value={customStages.pupuk2Day}
                      onChange={(e) => setCustomStages({...customStages, pupuk2Day: Number(e.target.value)})}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <hr className="border-slate-100" />

          {/* Configuration Inputs */}
          <div className="space-y-4">
            <h2 className="text-lg font-black text-slate-800 flex items-center">
              <Calendar className="w-5 h-5 mr-2 text-emerald-600" />
              2. Detail Lahan & Tanggal
            </h2>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block">Tanggal Mulai Semai / Tanam</label>
              <input 
                type="date"
                value={plantingDate}
                onChange={(e) => setPlantingDate(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
              />
              <p className="text-[10px] text-slate-400">Semua perkiraan tanggal kegiatan dinilai dari tanggal patokan ini.</p>
            </div>

            {/* Checkbox Penyemaian (Nursery Option) */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-150 space-y-2 mt-2">
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="toggle-nursery"
                  checked={useNursery && activeCrop.stages.semai.end > 0}
                  disabled={selectedCropId !== 'kustom' && activeCrop.stages.semai.end === 0}
                  onChange={(e) => setUseNursery(e.target.checked)}
                  className="w-5 h-5 accent-emerald-600 rounded-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <label 
                  htmlFor="toggle-nursery" 
                  className={`text-sm font-black cursor-pointer select-none ${selectedCropId !== 'kustom' && activeCrop.stages.semai.end === 0 ? 'text-slate-400 cursor-not-allowed' : 'text-slate-800'}`}
                >
                  Sertakan Fase Penyemaian (Nursery)
                </label>
              </div>
              {activeCrop.stages.semai.end > 0 ? (
                <p className="text-[11px] text-slate-600 leading-normal">
                  {useNursery 
                    ? `📅 Perhitungan kalender menyertakan masa penyemaian selama ${activeCrop.stages.semai.end} hari sebelum Hari Pindah Tanam (0 HST).`
                    : "🌱 Simulasi langsung dari Hari Pindah Tanam (0 HST). Masa pemeliharaan penyemaian ditiadakan di kalender."}
                </p>
              ) : (
                <p className="text-[11px] text-slate-500 italic leading-normal">
                  * Komoditas ini ditanam secara langsung (Tugal/Umbi) tanpa melalui fase penyemaian benih.
                </p>
              )}
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Luas Lahan Target</label>
                <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">{landArea} Hektar</span>
              </div>
              <input 
                type="range"
                min="0.1"
                max="5.0"
                step="0.1"
                value={landArea}
                onChange={(e) => setLandArea(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
              />
              <p className="text-[10px] text-slate-400">Luas lahan ini digunakan untuk menghitung dosis kebutuhan pupuk otomatis.</p>
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* Quick Simulation Reminders */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block">Simulasikan Rekomendasi Hari Ini</label>
            <div className="grid grid-cols-3 gap-2">
              <button 
                onClick={() => triggerSimulatedSMS('pupuk')}
                className="p-2 text-[10px] font-black uppercase text-blue-700 bg-blue-50 border border-blue-200 rounded-xl hover:bg-blue-100 transition-colors flex flex-col items-center justify-center gap-1 cursor-pointer"
              >
                <span className="w-2 h-2 bg-blue-500 rounded-full animate-ping"></span>
                Pemupukan
              </button>
              <button 
                onClick={() => triggerSimulatedSMS('opt')}
                className="p-2 text-[10px] font-black uppercase text-rose-700 bg-rose-50 border border-rose-200 rounded-xl hover:bg-rose-100 transition-colors flex flex-col items-center justify-center gap-1 cursor-pointer"
              >
                <span className="w-2 h-2 bg-rose-500 rounded-full animate-ping"></span>
                Awas OPT
              </button>
              <button 
                onClick={() => triggerSimulatedSMS('panen')}
                className="p-2 text-[10px] font-black uppercase text-amber-700 bg-amber-50 border border-amber-200 rounded-xl hover:bg-amber-100 transition-colors flex flex-col items-center justify-center gap-1 cursor-pointer"
              >
                <span className="w-2 h-2 bg-amber-500 rounded-full animate-ping"></span>
                Panen
              </button>
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* Progress Tracker Card */}
          <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl p-4 border border-slate-200 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-600">Progres Kepatuhan SOP</span>
              <span className="text-xs font-black text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">{progressPercent}%</span>
            </div>
            <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
              <div 
                className="bg-emerald-600 h-full transition-all duration-500" 
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
            <p className="text-[9px] text-slate-400 italic">Ceklis tugas-tugas pada timeline di samping setelah Anda menyiapkannya di lapangan.</p>
          </div>
        </div>

        {/* RIGHT COLUMN: Interactive Views & Detailed Timelines */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Navigation Tab Menu */}
          <div className="flex flex-wrap md:flex-nowrap gap-2 bg-slate-100 p-1.5 rounded-2xl">
            <button
              onClick={() => setActiveTabLocal('timeline')}
              className={`flex-1 py-3 text-xs md:text-sm font-bold rounded-xl transition-all flex items-center justify-center space-x-2 cursor-pointer ${activeTab === 'timeline' ? 'bg-white text-emerald-800 shadow-sm font-black' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}
            >
              <Activity className="w-4 h-4 text-emerald-600" />
              <span>Kalender Tanam</span>
            </button>
            <button
              onClick={() => setActiveTabLocal('weekly')}
              className={`flex-1 py-3 text-xs md:text-sm font-bold rounded-xl transition-all flex items-center justify-center space-x-2 cursor-pointer ${activeTab === 'weekly' ? 'bg-white text-emerald-800 shadow-sm font-black' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}
            >
              <Calendar className="w-4 h-4 text-amber-600" />
              <span>Kalender Mingguan</span>
            </button>
            <button
              onClick={() => setActiveTabLocal('sop')}
              className={`flex-1 py-3 text-xs md:text-sm font-bold rounded-xl transition-all flex items-center justify-center space-x-2 cursor-pointer ${activeTab === 'sop' ? 'bg-white text-emerald-800 shadow-sm font-black' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}
            >
              <BookOpen className="w-4 h-4 text-blue-600" />
              <span>Rekomendasi / SOP</span>
            </button>
            <button
              onClick={() => setActiveTabLocal('notif')}
              className={`flex-1 py-3 text-xs md:text-sm font-bold rounded-xl transition-all flex items-center justify-center space-x-2 cursor-pointer ${activeTab === 'notif' ? 'bg-white text-emerald-800 shadow-sm font-black' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}
            >
              <Bell className="w-4 h-4 text-rose-500 animate-pulse-subtle" />
              <span>Notifikasi Otomatis {isSubscribed && '•'}</span>
            </button>
          </div>

          <AnimatePresence mode="wait">
            {/* VIEW 1: TIMELINE INTERAKTIF */}
            {activeTab === 'timeline' && (
              <motion.div
                key="timeline-view"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="bg-white rounded-3xl p-6 shadow-sm border border-slate-150 space-y-6"
              >
                {/* Calendar Header with info and legend */}
                <div className="flex justify-between items-center flex-wrap gap-4">
                  <div>
                    <h3 className="text-xl font-black text-slate-800">Kalender Kegiatan & SOP Interaktif</h3>
                    <p className="text-xs text-slate-400">Pilih tanggal pada kalender di bawah untuk melihat detail instruksi teknis dan rekomendasi PHT.</p>
                  </div>
                  <div className="flex flex-wrap gap-2 text-[10px] font-bold">
                    <span className="px-2.5 py-1 rounded-full border border-emerald-300 bg-emerald-50 text-emerald-800 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Penyemaian
                    </span>
                    <span className="px-2.5 py-1 rounded-full border border-green-300 bg-green-50 text-green-900 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-green-600"></span> Tanam Utama
                    </span>
                    <span className="px-2.5 py-1 rounded-full border border-blue-300 bg-blue-50 text-blue-800 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span> Pupuk / Kocor
                    </span>
                    <span className="px-2.5 py-1 rounded-full border border-rose-300 bg-rose-50 text-rose-800 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-rose-600"></span> Waspada OPT
                    </span>
                    <span className="px-2.5 py-1 rounded-full border border-amber-300 bg-amber-50 text-amber-800 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-amber-500"></span> Pembungaan
                    </span>
                    <span className="px-2.5 py-1 rounded-full border border-yellow-300 bg-yellow-100 text-yellow-950 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-yellow-500"></span> Panen Raya
                    </span>
                  </div>
                </div>

                {/* Calculate Spanned Calendar Months */}
                {(() => {
                  const startCropDate = new Date(plantingDate);
                  // Day 0 of crop cycle starts 'tanamDay' days before plantingDate
                  startCropDate.setDate(startCropDate.getDate() - activeCrop.stages.tanam.day);

                  const endCropDate = new Date(startCropDate);
                  endCropDate.setDate(endCropDate.getDate() + activeCrop.durationDays);

                  const getMonthsSpanned = (start: Date, end: Date) => {
                    const list: { year: number; month: number }[] = [];
                    let curr = new Date(start.getFullYear(), start.getMonth(), 1);
                    const last = new Date(end.getFullYear(), end.getMonth(), 1);
                    while (curr <= last) {
                      list.push({ year: curr.getFullYear(), month: curr.getMonth() });
                      curr.setMonth(curr.getMonth() + 1);
                    }
                    return list;
                  };

                  const monthsList = getMonthsSpanned(startCropDate, endCropDate);
                  
                  // Safe sanity check for bounds
                  const safeMonthIndex = currentMonthIndex >= monthsList.length ? 0 : currentMonthIndex;
                  const activeMonthYear = monthsList[safeMonthIndex] || { year: new Date(plantingDate).getFullYear(), month: new Date(plantingDate).getMonth() };
                  const { year: cy, month: cm } = activeMonthYear;

                  // Month Metadata
                  const firstDayOfMonth = new Date(cy, cm, 1);
                  // Sunday = 0, Monday = 1... convert Monday to index 0, Sunday to index 6
                  const firstDayIndex = (firstDayOfMonth.getDay() + 6) % 7;
                  const totalMonthDays = new Date(cy, cm + 1, 0).getDate();

                  const emptyPrefixSlots = Array.from({ length: firstDayIndex });
                  const daysInMonthArray = Array.from({ length: totalMonthDays }, (_, i) => i + 1);

                  return (
                    <div className="space-y-6">
                      {/* Month Swiper bar */}
                      <div className="flex items-center justify-between bg-slate-50 border border-slate-150 p-3 rounded-2xl">
                        <button
                          onClick={() => setCurrentMonthIndex(prev => Math.max(0, prev - 1))}
                          disabled={safeMonthIndex === 0}
                          className="p-2 bg-white rounded-xl border border-slate-200 text-slate-600 hover:text-slate-800 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white cursor-pointer transition-colors"
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </button>
                        <div className="text-center">
                          <h4 className="text-lg font-black text-slate-800">
                            {INDONESIAN_MONTHS[cm]} {cy}
                          </h4>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                            Pekerjaan Bulan {safeMonthIndex + 1} dari {monthsList.length}
                          </p>
                        </div>
                        <button
                          onClick={() => setCurrentMonthIndex(prev => Math.min(monthsList.length - 1, prev + 1))}
                          disabled={safeMonthIndex === monthsList.length - 1}
                          className="p-2 bg-white rounded-xl border border-slate-200 text-slate-600 hover:text-slate-800 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white cursor-pointer transition-colors"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      </div>

                      {/* Calendar Grid Container */}
                      <div className="bg-slate-50 border border-slate-150 rounded-3xl p-4 md:p-6 shadow-xs">
                        {/* Day names headers */}
                        <div className="grid grid-cols-7 gap-2 text-center text-xs font-black text-slate-400 uppercase mb-4 tracking-wider">
                          <div>Sen</div>
                          <div>Sel</div>
                          <div>Rab</div>
                          <div>Kam</div>
                          <div>Jum</div>
                          <div className="text-emerald-600">Sab</div>
                          <div className="text-rose-600">Min</div>
                        </div>

                        {/* Calendar Body grid */}
                        <div className="grid grid-cols-7 gap-2 md:gap-3">
                          {/* Prefix blank spaces */}
                          {emptyPrefixSlots.map((_, i) => (
                            <div key={`empty-${i}`} className="aspect-square bg-slate-100/30 rounded-2xl invisible"></div>
                          ))}

                          {/* Render actual days */}
                          {daysInMonthArray.map((dayNum) => {
                            const cellDate = new Date(cy, cm, dayNum);
                            const cellTime = cellDate.getTime();
                            const startTime = startCropDate.getTime();
                            // Determine crop cycle day count
                            const cropAgeDay = Math.round((cellTime - startTime) / (1000 * 60 * 60 * 24));
                            const isInsideCycle = cropAgeDay >= 0 && cropAgeDay <= activeCrop.durationDays;

                            let cellStyle = "bg-white hover:bg-slate-50 text-slate-400 border border-slate-150";
                            let eventDetails = null;
                            let timelineIndicatorDot = null;

                            if (isInsideCycle) {
                              eventDetails = getDetailsForCropAge(cropAgeDay);
                              const theme = eventDetails.colorTheme;
                              
                              // Check if is completed in Checklist
                              const taskKey = eventDetails.taskKey ? `${activeCrop.id}-${eventDetails.taskKey}` : `${activeCrop.id}-day-${cropAgeDay}`;
                              const isCompleted = completedTasks[taskKey];

                              if (theme === 'emerald') {
                                cellStyle = `bg-emerald-50/70 hover:bg-emerald-100/80 border border-emerald-250 text-emerald-950 font-extrabold ${isCompleted ? 'ring-2 ring-emerald-500 ring-offset-1 opacity-75' : ''}`;
                                timelineIndicatorDot = <Sprout className="w-3.5 h-3.5 text-emerald-600" />;
                              } else if (theme === 'green') {
                                cellStyle = `bg-green-150/70 hover:bg-green-200/80 border border-green-350 text-green-950 font-black ${isCompleted ? 'ring-2 ring-emerald-500 ring-offset-1 opacity-75' : ''}`;
                                timelineIndicatorDot = <Calendar className="w-3.5 h-3.5 text-green-800" />;
                              } else if (theme === 'blue') {
                                cellStyle = `bg-blue-50 hover:bg-blue-100/90 border border-blue-250 text-blue-950 font-black animate-pulse-subtle ${isCompleted ? 'ring-2 ring-emerald-500 ring-offset-1 opacity-75' : ''}`;
                                timelineIndicatorDot = <Clock className="w-3.5 h-3.5 text-blue-600" />;
                              } else if (theme === 'rose') {
                                cellStyle = `bg-rose-50 hover:bg-rose-100 border border-rose-250 text-rose-950 font-extrabold ${isCompleted ? 'ring-2 ring-emerald-500 ring-offset-1 opacity-75' : ''}`;
                                timelineIndicatorDot = <Bug className="w-3.5 h-3.5 text-rose-600" />;
                              } else if (theme === 'amber') {
                                cellStyle = `bg-amber-50 hover:bg-amber-100 border border-amber-250 text-amber-950 font-bold ${isCompleted ? 'ring-2 ring-emerald-500 ring-offset-1 opacity-75' : ''}`;
                                timelineIndicatorDot = <Flower className="w-3.5 h-3.5 text-amber-600" />;
                              } else if (theme === 'yellow') {
                                cellStyle = `bg-yellow-100/70 hover:bg-yellow-200 border border-yellow-250 text-yellow-950 font-black ${isCompleted ? 'ring-2 ring-emerald-500 ring-offset-1 opacity-75' : ''}`;
                                timelineIndicatorDot = <ShoppingBag className="w-3.5 h-3.5 text-yellow-700" />;
                              } else if (theme === 'slate') {
                                cellStyle = `bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-medium ${isCompleted ? 'ring-2 ring-emerald-500 ring-offset-1 opacity-75' : ''}`;
                                timelineIndicatorDot = <Info className="w-3.5 h-3.5 text-slate-400" />;
                              }
                            } else {
                              // Days outside the crop cycle
                              cellStyle = "bg-slate-200/35 text-slate-350 border border-slate-100 cursor-not-allowed opacity-40";
                            }

                            // Calculate sublabel
                            const hstVal = cropAgeDay - activeCrop.stages.tanam.day;
                            const hstText = hstVal === 0 ? "Tanam" : hstVal > 0 ? `+${hstVal} HST` : `S-${Math.abs(hstVal)}`;

                            return (
                              <button
                                key={`day-${dayNum}`}
                                onClick={() => {
                                  if (isInsideCycle) {
                                    setSelectedCalendarDay(cropAgeDay);
                                    setSelectedCalendarDate(cellDate);
                                  }
                                }}
                                disabled={!isInsideCycle}
                                className={`aspect-square rounded-2xl p-2 relative flex flex-col justify-between text-left cursor-pointer transition-all shadow-xs ${cellStyle}`}
                              >
                                <span className="text-sm md:text-base font-black leading-none">{dayNum}</span>
                                
                                {isInsideCycle && (
                                  <div className="flex items-center justify-between w-full mt-1">
                                    <span className="text-[8px] md:text-[9px] font-bold text-slate-500/90 leading-none">
                                      {hstText}
                                    </span>
                                    {timelineIndicatorDot}
                                  </div>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Callout Info box */}
                      <div className="bg-emerald-50 border border-emerald-150 rounded-2xl p-4 flex items-start gap-3">
                        <Info className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-emerald-950">Petunjuk Penggunaan Kalender:</p>
                          <p className="text-[11px] text-emerald-800 leading-normal">
                            Kalender di atas dihitung presisi mulai dari <strong>tanggal tanam ({getCalculatedDate(activeCrop.stages.tanam.day - 1)})</strong>. Blok hari yang berwarna menandakan masa pertumbuhan biologis komoditi {activeCrop.name}. Klik pada tanggal yang diwarnai untuk membuka panduan pemupukan (Biru) dan rekomendasi kendali OPT (Ros) di pop-up secara langsung.
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </motion.div>
            )}

            {/* VIEW 2: KALENDER PER MINGGU */}
            {activeTab === 'weekly' && (
              <motion.div
                key="weekly-view"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="bg-white rounded-3xl p-6 shadow-sm border border-slate-150 space-y-6"
              >
                <div>
                  <h3 className="text-xl font-black text-slate-800">Kalender Kegiatan Per Minggu</h3>
                  <p className="text-xs text-slate-500">Berikut adalah rekapitulasi fokus pekerjaan lapangan mingguan sampai umur panen tanaman tercapai.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {weeksData.map((w) => {
                    let borderClass = 'border-slate-150';
                    let bgClass = 'bg-slate-50/50';
                    let textClass = 'text-slate-700';
                    let iconBg = 'bg-slate-200';

                    if (w.colorTheme === 'rose') {
                      borderClass = 'border-rose-200';
                      bgClass = 'bg-rose-50/60';
                      textClass = 'text-rose-800';
                      iconBg = 'bg-rose-200 text-rose-800';
                    } else if (w.colorTheme === 'blue') {
                      borderClass = 'border-blue-200';
                      bgClass = 'bg-blue-50/60';
                      textClass = 'text-blue-850';
                      iconBg = 'bg-blue-200 text-blue-800';
                    } else if (w.colorTheme === 'amber') {
                      borderClass = 'border-amber-200';
                      bgClass = 'bg-amber-50/60';
                      textClass = 'text-amber-800';
                      iconBg = 'bg-amber-200 text-amber-800';
                    } else if (w.colorTheme === 'yellow') {
                      borderClass = 'border-yellow-200';
                      bgClass = 'bg-yellow-50/60';
                      textClass = 'text-yellow-900';
                      iconBg = 'bg-yellow-200 text-yellow-800';
                    } else if (w.colorTheme === 'emerald') {
                      borderClass = 'border-emerald-200';
                      bgClass = 'bg-emerald-50/50';
                      textClass = 'text-emerald-800';
                      iconBg = 'bg-emerald-200 text-emerald-800';
                    }

                    return (
                      <div key={w.weekNum} className={`border rounded-2xl p-4 shadow-sm ${borderClass} ${bgClass} transition-all hover:scale-[1.02] flex flex-col justify-between space-y-3`}>
                        <div className="space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-black tracking-tight uppercase px-2 py-0.5 bg-white border rounded-lg shadow-xs text-slate-600">
                              M-0{w.weekNum} (Minggu ke-{w.weekNum})
                            </span>
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${iconBg}`}>
                              {w.colorTheme === 'rose' ? 'Awas Rawat' : w.colorTheme === 'blue' ? 'Pupuk' : 'Pertumbuhan'}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 font-bold">{w.startDay} sampai {w.endDay} DAS / HST</p>
                          <p className="text-xs text-slate-600 font-bold pt-1">{w.phase}</p>
                        </div>

                        {/* List of active activities inside this week */}
                        <div className="bg-white/80 rounded-xl p-2 border border-slate-100 space-y-1 text-[11px] text-slate-500">
                          <span className="font-bold text-[9px] text-slate-400 block uppercase">Agenda Kerja Lapangan:</span>
                          {w.events.semai && <p className="text-emerald-700 font-medium">• Masa Penyemaian Air & Pupuk</p>}
                          {w.events.tanam && <p className="text-emerald-700 font-bold">• Agenda Pindah Tanam Utama</p>}
                          {w.events.pupuk1 && <p className="text-blue-700 font-bold">• Kirim Pupuk Susulan Pertumbuhan</p>}
                          {w.events.optRisk && <p className="text-rose-700 font-bold flex items-center">⚠️ Bahaya OPT: Amati daun berkala</p>}
                          {w.events.pupuk2 && <p className="text-blue-700 font-bold">• Kirim Pupuk Susulan Umbi/Batang</p>}
                          {w.events.flower && <p className="text-amber-700 font-bold">• Transisi Bunga, Tambah Kalsium</p>}
                          {w.events.harvest && <p className="text-amber-800 font-black flex items-center">🌾 Bersiap Pemanenan & Ubinan</p>}
                        </div>

                        {/* Calculated Date span */}
                        <div className="text-[10px] text-slate-400 italic font-medium">
                          Mulai: {getCalculatedDate(w.startDay)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* VIEW 3: SOP REKOMENDASI & TAKARAN AHLI */}
            {activeTab === 'sop' && (
              <motion.div
                key="sop-view"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="bg-white rounded-3xl p-6 shadow-sm border border-slate-150 space-y-6"
              >
                <div className="flex items-center space-x-3 bg-emerald-50 p-4 rounded-2xl border border-emerald-150">
                  <ShieldCheck className="w-8 h-8 text-emerald-600" />
                  <div>
                    <h3 className="text-lg font-bold text-emerald-950">Rekomendasi Pemupukan & Perlindungan BPP Nule</h3>
                    <p className="text-xs text-emerald-800/80">Kalkulasi presisi berorientasi ramah lingkungan (Prinsip PHT Terpadu).</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Fertilizer Calculation Box */}
                  <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-4">
                    <h4 className="font-extrabold text-slate-800 flex items-center border-b pb-2">
                      <ShoppingBag className="w-5 h-5 mr-2 text-blue-600" />
                      Estimasi Total Logistik Pupuk ({landArea} Ha)
                    </h4>
                    <p className="text-xs text-slate-500">Butuh pupuk bersubsidi dengan kisaran takaran standar:</p>

                    <div className="space-y-3">
                      <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-150">
                        <div>
                          <p className="text-xs font-bold text-slate-600">Urea (Fase Vegetatif)</p>
                          <p className="text-[10px] text-slate-400">Pelebat tajuk daun hijau</p>
                        </div>
                        <p className="text-base font-black text-slate-800">
                          {((activeCrop.stages.pupuk1.amountPerHa.urea + activeCrop.stages.pupuk2.amountPerHa.urea) * landArea).toFixed(0)} kg
                        </p>
                      </div>

                      <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-150">
                        <div>
                          <p className="text-xs font-bold text-slate-600 font-sans">NPK Phonska (Bunga & Buah)</p>
                          <p className="text-[10px] text-slate-400">Nutrisi lengkap N-P-K berimbang</p>
                        </div>
                        <p className="text-base font-black text-slate-800">
                          {((activeCrop.stages.pupuk1.amountPerHa.npk + activeCrop.stages.pupuk2.amountPerHa.npk) * landArea).toFixed(0)} kg
                        </p>
                      </div>

                      {(activeCrop.stages.pupuk1.amountPerHa.other || activeCrop.stages.pupuk2.amountPerHa.other) && (
                        <div className="bg-emerald-50/50 p-3 rounded-xl border border-emerald-100 text-[11px] text-emerald-800">
                          <strong className="block mb-1">💡 Tambahan Opsional Lain:</strong>
                          {activeCrop.stages.pupuk1.amountPerHa.other && <p>• {activeCrop.stages.pupuk1.amountPerHa.other}</p>}
                          {activeCrop.stages.pupuk2.amountPerHa.other && <p>• {activeCrop.stages.pupuk2.amountPerHa.other}</p>}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Standard PHT Recommendations */}
                  <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-4 font-normal text-slate-600 text-sm">
                    <h4 className="font-extrabold text-slate-800 flex items-center border-b pb-2">
                      <Info className="w-5 h-5 mr-2 text-rose-600 animate-pulse" />
                      Pedoman Pencegahan & Pengendalian OPT
                    </h4>

                    <div className="space-y-4 text-xs leading-relaxed">
                      <div className="flex items-start space-x-2">
                        <div className="w-5 h-5 bg-rose-100 rounded-full flex items-center justify-center text-rose-700 font-bold shrink-0 text-[10px]">1</div>
                        <p><strong>Monitoring Intensif:</strong> Lakukan rute keliling sawah berkala pada pagi-sore hari saat tanaman berumur {activeCrop.stages.optRisk.start} - {activeCrop.stages.optRisk.end} HST.</p>
                      </div>

                      <div className="flex items-start space-x-2">
                        <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center text-green-700 font-bold shrink-0 text-[10px]">2</div>
                        <p><strong>Perangkap Fisik / Hayati:</strong> Pasang lekatan lem kuning (Yellow Sticky Trap) sebanyak yang diperlukan untuk mengendalikan Thrips dan Kutu Kebul pada sayuran horti.</p>
                      </div>

                      <div className="flex items-start space-x-2">
                        <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold shrink-0 text-[10px]">3</div>
                        <p><strong>Pestisida Nabati:</strong> Utamakan fungisida organik Trichoderma, rendaman ekstrak daun mimba atau umbi bawang putih sebelum mengandalkan pestisida kimia sintetis.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* VIEW 4: FORMS NOTIFIKASI OTOMATIS */}
            {activeTab === 'notif' && (
              <motion.div
                key="notif-view"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="bg-white rounded-3xl p-6 shadow-sm border border-slate-150 space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                  
                  {/* Phone Settings */}
                  <div className="md:col-span-6 space-y-4">
                    <div>
                      <h3 className="text-xl font-black text-slate-800 flex items-center">
                        <Bell className="w-5 h-5 mr-2 text-rose-500" /> Berlangganan SMS Alerter
                      </h3>
                      <p className="text-xs text-slate-400">Isi data di bawah untuk mensimulasikan notifikasi otomatis mingguan langsung di simulasi Hp sebelah kanan.</p>
                    </div>

                    {!isSubscribed ? (
                      <form onSubmit={handleSubscribe} className="space-y-3">
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Nama Petani / Pengguna</label>
                          <input 
                            type="text" 
                            required
                            placeholder="Contoh: Bpk. Melkisedek"
                            value={userName}
                            onChange={(e) => setUserName(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-1 focus:ring-rose-500"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Nomor Telepon WA/SMS (Simulasi)</label>
                          <input 
                            type="tel" 
                            required
                            placeholder="Contoh: 0812-3456-7890"
                            value={userPhone}
                            onChange={(e) => setUserPhone(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-1 focus:ring-rose-500"
                          />
                        </div>

                        <button 
                          type="submit"
                          className="w-full py-3 bg-rose-600 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg hover:bg-rose-700 hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center space-x-2 cursor-pointer"
                        >
                          <Send className="w-4.5 h-4.5" />
                          <span>Mulai Kirim Notif</span>
                        </button>
                      </form>
                    ) : (
                      <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-150 text-center space-y-4">
                        <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600">
                          <CheckCircle2 className="w-6 h-6" />
                        </div>
                        <div className="space-y-1">
                          <h4 className="font-extrabold text-slate-800 text-sm">Notifikasi Berlangganan Aktif!</h4>
                          <p className="text-[11px] text-slate-500">Nomor: <strong className="text-slate-700">{userPhone}</strong> atas nama <strong className="text-slate-700">{userName}</strong></p>
                        </div>
                        <button 
                          onClick={() => { setIsSubscribed(false); setSimulatedAlerts([]); }}
                          className="px-4 py-1.5 text-[10px] bg-white border border-rose-200 hover:bg-rose-50 text-rose-600 rounded-lg font-bold transition-all cursor-pointer"
                        >
                          Hapus Pendaftaran
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Smartphone Simulator Panel */}
                  <div className="md:col-span-6 bg-[#0B0F19] text-white rounded-[2rem] p-4 shadow-xl border-4 border-slate-800 relative max-w-xs mx-auto">
                    {/* Phone Top Notch decoration */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-5 bg-slate-800 rounded-b-xl flex items-center justify-center space-x-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-600"></span>
                      <span className="w-2.5 h-1 bg-slate-600 rounded-full"></span>
                    </div>

                    <div className="space-y-4 pt-6 h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                      {/* Phone internal screen title status */}
                      <div className="flex justify-between items-center text-[10px] text-slate-400 border-b border-white/10 pb-2">
                        <span>SMART POPT NULE</span>
                        <span>📶 4G LTE</span>
                      </div>

                      <div className="space-y-2">
                        {simulatedAlerts.length === 0 ? (
                          <div className="text-center py-16 text-slate-500 space-y-2">
                            <MessageSquare className="w-10 h-10 mx-auto text-slate-600 animate-bounce" />
                            <p className="text-xs">Tiada pesan masuk baru.</p>
                            <p className="text-[9px] text-slate-600 italic">Pencet "Daftar" atau simulasikan kiriman dengan tombol hari ini!</p>
                          </div>
                        ) : (
                          simulatedAlerts.map((e, idx) => (
                            <div key={idx} className="bg-slate-900 border border-white/10 p-3 rounded-2xl text-[10px] leading-relaxed shadow-sm text-slate-100 relative">
                              <span className="absolute -top-1 -right-1 flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                              </span>
                              {e}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>

                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>

      {/* OVERLAY POPUP MODAL UNTUK DETAIL TANGGAL KALENDER */}
      <AnimatePresence>
        {selectedCalendarDay !== null && selectedCalendarDate !== null && (() => {
          const age = selectedCalendarDay;
          const dateStr = selectedCalendarDate.toLocaleDateString('id-ID', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
          });
          const info = getDetailsForCropAge(age);
          const taskKey = info.taskKey ? `${activeCrop.id}-${info.taskKey}` : `${activeCrop.id}-day-${age}`;
          const isCompleted = completedTasks[taskKey];

          // Calculate offset label
          const hstVal = age - activeCrop.stages.tanam.day;

          // Apply gorgeous accent color palettes based on phase theme
          let themeClasses = {
            bg: 'bg-emerald-50 border-emerald-200',
            text: 'text-emerald-950',
            badge: 'bg-emerald-500 text-white',
            border: 'border-emerald-150',
            button: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-205'
          };

          if (info.colorTheme === 'emerald') {
            themeClasses = { bg: 'bg-emerald-50/75 border-emerald-150', text: 'text-emerald-950', badge: 'bg-emerald-600 text-white', border: 'border-emerald-100', button: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200' };
          } else if (info.colorTheme === 'green') {
            themeClasses = { bg: 'bg-green-50/80 border-green-200', text: 'text-green-950', badge: 'bg-green-600 text-white', border: 'border-green-150', button: 'bg-green-600 hover:bg-green-700 text-white shadow-green-200' };
          } else if (info.colorTheme === 'blue') {
            themeClasses = { bg: 'bg-blue-50/70 border-blue-200', text: 'text-blue-950', badge: 'bg-blue-650 text-white', border: 'border-blue-150', button: 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200' };
          } else if (info.colorTheme === 'rose') {
            themeClasses = { bg: 'bg-rose-50/80 border-rose-200', text: 'text-rose-950', badge: 'bg-rose-650 text-white', border: 'border-rose-150', button: 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-200' };
          } else if (info.colorTheme === 'amber') {
            themeClasses = { bg: 'bg-amber-50/80 border-amber-200', text: 'text-amber-950', badge: 'bg-amber-600 text-white', border: 'border-amber-150', button: 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-200' };
          } else if (info.colorTheme === 'yellow') {
            themeClasses = { bg: 'bg-yellow-50/80 border-yellow-250', text: 'text-yellow-950', badge: 'bg-yellow-500 text-slate-900', border: 'border-yellow-150', button: 'bg-yellow-600 hover:bg-yellow-700 text-white' };
          } else if (info.colorTheme === 'slate') {
            themeClasses = { bg: 'bg-slate-50 border-slate-200', text: 'text-slate-900', badge: 'bg-slate-500 text-white', border: 'border-slate-150', button: 'bg-slate-700 hover:bg-slate-800 text-white' };
          }

          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              {/* Back backdrop shadow */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => { setSelectedCalendarDay(null); setSelectedCalendarDate(null); }}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs cursor-pointer"
              />

              {/* Popup Floating Card */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-150 overflow-hidden w-full max-w-lg z-10 flex flex-col relative max-h-[90vh]"
              >
                {/* Close Button X absolute */}
                <button
                  onClick={() => { setSelectedCalendarDay(null); setSelectedCalendarDate(null); }}
                  className="absolute top-4 right-4 p-2 bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 rounded-full transition-colors cursor-pointer z-20"
                >
                  <X className="w-5 h-5" />
                </button>

                {/* Modal Nice Header Bar */}
                <div className={`p-6 border-b ${themeClasses.bg} ${themeClasses.text} space-y-2`}>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-full ${themeClasses.badge}`}>
                      {info.badgeText}
                    </span>
                    <span className="text-xs font-bold opacity-60">Umur Tanaman: Hari ke-{age} ({hstVal === 0 ? "Pindah Tanam" : hstVal > 0 ? `${hstVal} HST` : `S-${Math.abs(hstVal)}`})</span>
                  </div>
                  <h4 className="text-xl font-black">{dateStr}</h4>
                  <p className="text-xs leading-relaxed opacity-95">{info.phaseDesc}</p>
                </div>

                {/* Scrollable recommendations contents */}
                <div className="p-6 overflow-y-auto space-y-5 flex-1 select-none">
                  
                  {/* Warning OPT if available */}
                  {info.pestsWarning.length > 0 && (
                    <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 space-y-2">
                      <div className="flex items-center space-x-2 text-rose-800">
                        <Bug className="w-5 h-5 animate-bounce shrink-0 font-bold" />
                        <h5 className="font-extrabold text-xs uppercase tracking-wider">Peringatan Risiko Serangan OPT</h5>
                      </div>
                      <p className="text-xs text-rose-900 leading-normal font-medium">{info.pestsDesc}</p>
                      <div className="flex flex-wrap gap-1">
                        {info.pestsWarning.map((pest, pIdx) => (
                          <span key={pIdx} className="text-[10px] font-bold bg-white text-rose-800 border border-rose-150 px-2.5 py-0.5 rounded-lg">
                            • {pest}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Fertilizer Logistics Details */}
                  {info.logistics && (
                    <div className="bg-blue-50/50 border border-blue-150 rounded-2xl p-4 space-y-3">
                      <div className="flex items-center space-x-2 text-blue-950">
                        <Clock className="w-5 h-5 text-blue-600 shrink-0" />
                        <h5 className="font-black text-xs uppercase tracking-wider">Takaran & Formula Pupuk Rekomendasi ({landArea} Ha)</h5>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white p-2.5 rounded-xl border border-blue-100 shadow-2xs">
                          <span className="text-[9px] uppercase font-bold text-slate-400">Takaran Urea</span>
                          <p className="text-sm font-black text-blue-900">{calculateDoses(info.logistics.urea)} kg</p>
                        </div>
                        <div className="bg-white p-2.5 rounded-xl border border-blue-100 shadow-2xs">
                          <span className="text-[9px] uppercase font-bold text-slate-400">Takaran NPK Phonska</span>
                          <p className="text-sm font-black text-blue-900">{calculateDoses(info.logistics.npk)} kg</p>
                        </div>
                      </div>
                      {info.logistics.other && (
                        <p className="text-[10px] text-blue-800 bg-white/70 py-1.5 px-2.5 rounded-lg font-medium">💡 Suplemen lain: {info.logistics.other}</p>
                      )}
                    </div>
                  )}

                  {/* Recommendations Bullet list */}
                  <div className="space-y-3">
                    <h5 className="text-xs uppercase tracking-wider font-extrabold text-slate-400">SOP & Panduan Lapangan:</h5>
                    <ul className="space-y-2.5">
                      {info.recommendations.map((rec, rIdx) => (
                        <li key={rIdx} className="flex items-start text-xs text-slate-600 leading-relaxed">
                          <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-slate-400 mr-2.5 mt-2"></span>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                </div>

                {/* Checklist Action bottom footer bar */}
                <div className="p-4 bg-slate-50 border-t border-slate-150 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className={`w-5 h-5 ${isCompleted ? 'text-emerald-600' : 'text-slate-300'}`} />
                    <span className="text-xs font-bold text-slate-500">Status Tindakan Hari Ini</span>
                  </div>

                  <button
                    onClick={() => toggleTask(taskKey)}
                    className={`py-2 px-5 rounded-xl text-xs font-black uppercase tracking-wider transition-all scale-100 cursor-pointer active:scale-95 ${
                      isCompleted 
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 hover:bg-emerald-200' 
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md hover:shadow-lg'
                    }`}
                  >
                    {isCompleted ? 'Tandai Belum Selesai' : 'Siap Laksanakan, Set Selesai!'}
                  </button>
                </div>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>
    </div>
  );
}
