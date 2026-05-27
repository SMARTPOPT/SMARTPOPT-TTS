import React, { useState, useRef, useEffect } from 'react';
import { askAgriExpertStream } from '../geminiService';
import { ConsultationRecord, Tab } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Send, 
  Image as ImageIcon, 
  X, 
  User, 
  Bot,
  AlertCircle,
  ExternalLink,
  PhoneCall,
  Loader2
} from 'lucide-react';

interface ExtendedMessage {
  role: 'user' | 'ai';
  text: string;
  image?: string;
  imageData?: { base64: string, mimeType: string };
  sources?: string[];
  showContactButton?: boolean;
}

type FlowStep = 'NAME' | 'PHONE' | 'ADDRESS' | 'GROUP' | 'CONFIRMATION' | 'CONSULTATION';

interface ConsultationProps {
  onNavigate?: (tab: Tab) => void;
}

const NUDGE_TIMEOUT = 45000;
const END_TIMEOUT = 120000;

const Consultation: React.FC<ConsultationProps> = ({ onNavigate }) => {
  const [messages, setMessages] = useState<ExtendedMessage[]>([
    { role: 'ai', text: 'Halo! Saya asisten AI dari POPT BPP NULE. Sebelum kita mulai konsultasi teknis, saya bantu catat data Anda dulu ya. Mohon informasikan Nama Lengkap Anda?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<{ base64: string, mimeType: string, preview: string } | null>(null);
  const [flowStep, setFlowStep] = useState<FlowStep>('NAME');
  const [farmerData, setFarmerData] = useState({ name: '', phone: '', address: '', group: '' });
  const [currentTicketId, setCurrentTicketId] = useState<string | null>(null);
  const [lastActivity, setLastActivity] = useState(Date.now());
  const [hasNudged, setHasNudged] = useState(false);
  const [isEndedByInactivity, setIsEndedByInactivity] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hasSyncedRef = useRef<Record<string, boolean>>({});

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const scrollToBottom = () => {
    if (scrollRef.current) scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  };

  useEffect(() => {
    if (isEndedByInactivity || isLoading || flowStep !== 'CONSULTATION') return;
    const nudgeTimer = setTimeout(() => {
      if (!hasNudged) {
        setMessages(prev => [...prev, { role: 'ai', text: 'Apakah Bapak/Ibu masih ada kendala lain? Saya masih di sini untuk membantu.' }]);
        setHasNudged(true);
      }
    }, NUDGE_TIMEOUT);
    const endTimer = setTimeout(() => {
      if (hasNudged) {
        setMessages(prev => [...prev, { role: 'ai', text: 'Sepertinya koneksi kita terputus cukup lama. Percakapan ini saya akhiri untuk menjaga performa sistem. Jika masih butuh bantuan, Bapak/Ibu bisa mulai chat baru atau hubungi petugas kami.', showContactButton: true }]);
        setIsEndedByInactivity(true);
      }
    }, END_TIMEOUT);
    return () => { clearTimeout(nudgeTimer); clearTimeout(endTimer); };
  }, [lastActivity, hasNudged, isEndedByInactivity, isLoading, flowStep]);

  const syncRecordToGoogleSheet = async (record: ConsultationRecord) => {
    if (hasSyncedRef.current[record.ticketId]) return;
    try {
      hasSyncedRef.current[record.ticketId] = true;
      await fetch('/api/sync/apps-script', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ record }) });
    } catch (err) { hasSyncedRef.current[record.ticketId] = false; console.error(err); }
  };

  const createInitialRecord = () => {
    const records: ConsultationRecord[] = JSON.parse(localStorage.getItem('popt_consultation_records') || '[]');
    const now = new Date();
    const ticketId = `TKT-${now.toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;
    const newRecord: ConsultationRecord = { id: Date.now().toString(), ticketId, timestamp: now.toLocaleString('id-ID'), farmerName: farmerData.name, address: farmerData.address, farmerGroup: farmerData.group, phoneNumber: farmerData.phone, question: '(Mulai Konsultasi)', aiResponse: '(Proses)' };
    localStorage.setItem('popt_consultation_records', JSON.stringify([newRecord, ...records]));
    setCurrentTicketId(ticketId);
    return ticketId;
  };

  const updateRecordWithConsultation = (question: string, aiResponse: string, image?: string, latestAiMessage?: string) => {
    if (!currentTicketId) return;
    const records: ConsultationRecord[] = JSON.parse(localStorage.getItem('popt_consultation_records') || '[]');
    let updatedRecord: ConsultationRecord | null = null;
    const updatedRecords = records.map(record => {
      if (record.ticketId === currentTicketId) {
        const history = messages.map(m => ({ role: m.role, text: m.text, image: m.image }));
        if (latestAiMessage) history.push({ role: 'ai', text: latestAiMessage });
        updatedRecord = { ...record, question, aiResponse, image: image || record.image, chatHistory: history };
        return updatedRecord;
      }
      return record;
    });
    localStorage.setItem('popt_consultation_records', JSON.stringify(updatedRecords));
    if (updatedRecord && !hasSyncedRef.current[currentTicketId]) {
      if (question !== '(Mulai Konsultasi)' && (aiResponse.includes('DIAGNOSA:') || aiResponse.includes('DIAGNOSIS:'))) syncRecordToGoogleSheet(updatedRecord);
    }
  };

  const handleSend = async () => {
    if ((!input.trim() && !selectedImage) || isLoading || isEndedByInactivity) return;
    const userMsg = input;
    const imgData = selectedImage;
    setInput(''); setSelectedImage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setMessages(prev => [...prev, { role: 'user', text: userMsg, image: imgData?.preview, imageData: imgData ? { base64: imgData.base64, mimeType: imgData.mimeType } : undefined }]);
    setLastActivity(Date.now()); setHasNudged(false);

    if (flowStep !== 'CONSULTATION') {
      // (Flow registration logic tetap sama)
      if (flowStep === 'NAME') { setFarmerData(p => ({...p, name: userMsg})); setFlowStep('PHONE'); setMessages(prev => [...prev, { role: 'ai', text: `Terima kasih ${userMsg}. Berapa nomor HP/WA Anda?` }]); return; }
      if (flowStep === 'PHONE') { setFarmerData(p => ({...p, phone: userMsg})); setFlowStep('ADDRESS'); setMessages(prev => [...prev, { role: 'ai', text: `Baik, apa alamat lahan Anda?` }]); return; }
      if (flowStep === 'ADDRESS') { setFarmerData(p => ({...p, address: userMsg})); setFlowStep('GROUP'); setMessages(prev => [...prev, { role: 'ai', text: `Apa nama Kelompok Tani Anda?` }]); return; }
      if (flowStep === 'GROUP') { setFarmerData(p => ({...p, group: userMsg})); setFlowStep('CONFIRMATION'); setMessages(prev => [...prev, { role: 'ai', text: `Konfirmasi data: ${farmerData.name}, ${farmerData.phone}, ${userMsg}. Sudah benar? (Ya)` }]); return; }
      if (flowStep === 'CONFIRMATION') { if (userMsg.toLowerCase().includes('ya')) { const id = createInitialRecord(); setFlowStep('CONSULTATION'); setMessages(prev => [...prev, { role: 'ai', text: `Selesai! Tiket Anda: ${id}. Sampaikan masalah tanaman Anda.` }]); } else { setFlowStep('NAME'); setMessages(prev => [...prev, { role: 'ai', text: 'Mari ulangi. Siapa Nama Lengkap Anda?' }]); } return; }
    }

    setIsLoading(true);
    // Instruksi sistem PHT
    const PHT_INSTRUCTION = { role: 'user' as const, parts: [{ text: "INSTRUKSI PENTING: Anda adalah ahli POPT. WAJIB ikuti alur PHT: 1. Identifikasi masalah. 2. Pengendalian PHT: Prioritaskan teknik budidaya, sanitasi, dan PESNAB (Pestisida Nabati seperti ekstrak daun mimba/tembakau/bawang). Jelaskan cara buatnya. 3. Pengendalian Kimiawi (Pilihan Terakhir): Jika parah, sebutkan bahan aktif & contoh 2-3 merek dagang umum di Indonesia. 4. Wajib ingatkan: 'Gunakan kimia hanya jika cara alami tidak efektif' & wajib pakai APD/dosis sesuai label." }] };
    
    try {
      const history = messages.filter(m => m.role === 'user' || m.role === 'ai').map(m => ({ role: m.role === 'user' ? 'user' as const : 'model' as const, parts: [{ text: m.text }] }));
      const stream = askAgriExpertStream(userMsg, imgData?.base64, imgData?.mimeType, [PHT_INSTRUCTION, ...history]);
      setMessages(prev => [...prev, { role: 'ai', text: '', sources: [] }]);
      let fullAiText = '';
      for await (const chunk of stream) {
        fullAiText += chunk.text;
        setMessages(prev => { const n = [...prev]; n[n.length - 1].text = fullAiText; return n; });
      }
      // (Update logic record tetap sama)
      updateRecordWithConsultation(userMsg, fullAiText, imgData?.preview, fullAiText);
    } catch (err) { console.error(err); } finally { setIsLoading(false); }
  };

  return (
    <div className="flex flex-col h-[75vh] bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100">
      {/* Header & UI tetap sama... */}
      <div className="bg-slate-50 p-5 border-b flex items-center justify-between">
        <h3 className="font-black text-slate-800">SMART POPT AI</h3>
        {currentTicketId && <span className="text-xs font-bold text-green-700">{currentTicketId}</span>}
      </div>
      
      {/* Chat Area & Input (Integrasikan komponen UI Anda di sini) */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((m, i) => <div key={i} className={`p-4 rounded-2xl ${m.role === 'user' ? 'bg-green-600 text-white ml-auto' : 'bg-slate-100 text-slate-800'}`}>{m.text}</div>)}
      </div>
      
      <div className="p-4 border-t flex gap-2">
        <input className="flex-1 p-3 border rounded-xl" value={input} onChange={(e) => setInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSend()} placeholder="Tanyakan masalah tanaman..." />
        <button onClick={handleSend} className="bg-green-600 text-white px-4 py-2 rounded-xl">Kirim</button>
      </div>
    </div>
  );
};

export default Consultation;
