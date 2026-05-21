
export enum Tab {
  BERANDA = 'beranda',
  OPT = 'opt',
  KALENDER_TANAM = 'kalender_tanam',
  PENGAMATAN = 'pengamatan',
  PENYULUHAN = 'penyuluhan',
  ARSIP = 'arsip',
  KONSULTASI = 'konsultasi',
  CUACA = 'cuaca',
  PETUGAS = 'petugas',
  MANAJEMEN_USER = 'user_management',
  REKAP_KONSULTASI = 'rekap_konsultasi'
}

export interface ConsultationRecord {
  id: string;
  ticketId: string;
  timestamp: string;
  farmerName: string;
  address: string;
  farmerGroup: string;
  question: string;
  aiResponse: string;
  image?: string;
  chatHistory?: { role: 'user' | 'ai', text: string, image?: string }[];
}

export type UserRole = 'Admin' | 'Petugas POPT' | 'Penyuluh' | 'Kepala BPP';

export interface User {
  id: string;
  username: string;
  password: string;
  fullName: string;
  role: UserRole;
  bppName?: string;
  createdAt: string;
}

export interface Officer {
  id: string;
  name: string;
  role: string;
  phone: string;
  photoUrl?: string;
  description?: string;
}

export interface Observation {
  id: string;
  date: string;
  village: string;
  subDistrict?: string;
  blockName?: string;
  cropType: string;
  variety?: string;
  optName: string;
  method: 'Tetap' | 'Keliling';
  intensity: number;
  category: 'Ringan' | 'Sedang' | 'Berat' | 'Puso';
  hst?: number;
  weather?: string;
  landCondition?: string;
  phtRecommendation?: string;
  pesticideRecommendation?: string;
  plantedArea?: number;
  pestPopulation?: number;
  naturalEnemyPopulation?: number;
  season?: string;
  notes?: string;
  details: any; // Method-specific calculation data
}

export interface PestInfo {
  id: string;
  name: string;
  host: string;
  symptoms: string;
  control: string;
  imageUrl: string;
}

export interface Report {
  id: string;
  title: string;
  date: string;
  category: string;
  summary: string;
  url?: string;
}
