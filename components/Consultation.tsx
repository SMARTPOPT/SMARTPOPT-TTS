
import React, { useState, useRef, useEffect } from 'react';
import { askAgriExpertStream } from '../geminiService';
import { ConsultationRecord, Tab } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Send, 
  Image as ImageIcon, 
  X, 
  User, 
  MapPin, 
  Users, 
  CheckCircle2, 
  MessageSquare, 
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

const NUDGE_TIMEOUT = 45000; // 45 seconds
const END_TIMEOUT = 120000; // 2 minutes

const Consultation: React.FC<ConsultationProps> = ({ onNavigate }) => {
  const [messages, setMessages] = useState<ExtendedMessage[]>([
    { role: 'ai', text: 'Halo! Saya asisten AI dari POPT BPP NULE. Sebelum kita mulai konsultasi teknis, saya bantu catat data Anda dulu ya. Mohon informasikan Nama Lengkap Anda?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<{ base64: string, mimeType: string, preview: string } | null>(null);
  const [flowStep, setFlowStep] = useState<FlowStep>('NAME');
  const [farmerData, setFarmerData] = useState({
    name: '',
    phone: '',
    address: '',
    group: ''
  });
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
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  // Inactivity Detection
  useEffect(() => {
    if (isEndedByInactivity || isLoading || flowStep !== 'CONSULTATION') return;

    const nudgeTimer = setTimeout(() => {
      if (!hasNudged) {
        setMessages(prev => [...prev, { 
          role: 'ai', 
          text: 'Apakah Bapak/Ibu masih ada kendala lain? Saya masih di sini untuk membantu.' 
        }]);
        setHasNudged(true);
      }
    }, NUDGE_TIMEOUT);

    const endTimer = setTimeout(() => {
      if (hasNudged) {
        setMessages(prev => [...prev, { 
          role: 'ai', 
          text: 'Sepertinya koneksi kita terputus cukup lama. Percakapan ini saya akhiri untuk menjaga performa sistem. Jika masih butuh bantuan, Bapak/Ibu bisa mulai chat baru atau hubungi petugas kami.',
          showContactButton: true 
        }]);
        setIsEndedByInactivity(true);
      }
    }, END_TIMEOUT);

    return () => {
      clearTimeout(nudgeTimer);
      clearTimeout(endTimer);
    };
  }, [lastActivity, hasNudged, isEndedByInactivity, isLoading, flowStep]);

  const syncRecordToGoogleSheet = async (record: ConsultationRecord) => {
    if (hasSyncedRef.current[record.ticketId]) {
      console.log(`Tiket ${record.ticketId} sudah disinkronkan sebelumnya.`);
      return;
    }

    try {
      hasSyncedRef.current[record.ticketId] = true; // prevent parallel sync requests
      const response = await fetch('/api/sync/apps-script', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ record })
      });
      if (response.ok) {
        console.log(`Berhasil sync auto tiket ${record.ticketId} ke Google Sheets.`);
      } else {
        hasSyncedRef.current[record.ticketId] = false; // allow retry if failed
        console.error('Failed to sync to Google Sheets, response not OK');
      }
    } catch (err) {
      hasSyncedRef.current[record.ticketId] = false; // allow retry if failed
      console.error('Failed to sync to Google Sheets:', err);
    }
  };

  const createInitialRecord = () => {
    const records: ConsultationRecord[] = JSON.parse(localStorage.getItem('popt_consultation_records') || '[]');
    const now = new Date();
    const datePart = now.toISOString().slice(0, 10).replace(/-/g, '');
    const randomPart = Math.floor(1000 + Math.random() * 9000);
    const ticketId = `TKT-${datePart}-${randomPart}`;

    const newRecord: ConsultationRecord = {
      id: Date.now().toString(),
      ticketId,
      timestamp: now.toLocaleString('id-ID'),
      farmerName: farmerData.name,
      address: farmerData.address,
      farmerGroup: farmerData.group,
      phoneNumber: farmerData.phone,
      question: '(Mulai Konsultasi)',
      aiResponse: '(Proses)',
    };

    localStorage.setItem('popt_consultation_records', JSON.stringify([newRecord, ...records]));
    setCurrentTicketId(ticketId);
    
    // Note: To avoid appending incomplete rows, we DO NOT auto-sync on initial record creation.
    // It will be synced when the first complete diagnosis is updated.
    
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
        updatedRecord = {
          ...record,
          question,
          aiResponse,
          image: image || record.image,
          chatHistory: history
        };
        return updatedRecord;
      }
      return record;
    });
    localStorage.setItem('popt_consultation_records', JSON.stringify(updatedRecords));
    
    // Auto-sync the updated complete analysis record to Google Sheets if not already synced in this session
    if (updatedRecord && !hasSyncedRef.current[currentTicketId]) {
      // Ensure there is a meaningful question/response before sync
      const isComplete = question && question !== '(Mulai Konsultasi)' && aiResponse && aiResponse !== '(Proses)';
      if (isComplete) {
         syncRecordToGoogleSheet(updatedRecord);
      }
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = (reader.result as string).split(',')[1];
      setSelectedImage({ base64, mimeType: file.type, preview: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

  const handleSend = async () => {
    if ((!input.trim() && !selectedImage) || isLoading || isEndedByInactivity) return;

    const userMsg = input;
    const userImgPreview = selectedImage?.preview;
    const imgData = selectedImage;

    setInput('');
    setSelectedImage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';

    setMessages(prev => [...prev, { 
      role: 'user', 
      text: userMsg, 
      image: userImgPreview,
      imageData: imgData ? { base64: imgData.base64, mimeType: imgData.mimeType } : undefined
    }]);
    
    setLastActivity(Date.now());
    setHasNudged(false);

    // Initial Registration Flow
    if (flowStep !== 'CONSULTATION') {
      const isConsultationAttempt = selectedImage || userMsg.toLowerCase().match(/hama|ulat|wereng|padi|jagung|sakit|cabai/);
      
      if (flowStep === 'NAME') {
        if (isConsultationAttempt || userMsg.length < 2) {
          setMessages(prev => [...prev, { role: 'ai', text: 'Mohon maaf Bapak/Ibu, data Nama Lengkap diperlukan untuk verifikasi laporan. Siapa Nama Lengkap Bapak/Ibu?' }]);
          return;
        }
        setFarmerData(prev => ({ ...prev, name: userMsg }));
        setMessages(prev => [...prev, { role: 'ai', text: `Terima kasih Pak/Bu ${userMsg}. Berapa nomor HP atau WhatsApp Bapak/Ibu yang dapat dihubungi?` }]);
        setFlowStep('PHONE');
        return;
      }

      if (flowStep === 'PHONE') {
        const cleanPhone = userMsg.replace(/[^0-9+\-\s()]/g, '').trim();
        if (cleanPhone.length < 6) {
          setMessages(prev => [...prev, { role: 'ai', text: 'Mohon masukkan nomor HP atau WhatsApp yang valid (minimal 6 digit angka) agar kami dapat melakukan follow up jika diperlukan. Berapa No. HP Bapak/Ibu?' }]);
          return;
        }
        setFarmerData(prev => ({ ...prev, phone: cleanPhone }));
        setMessages(prev => [...prev, { role: 'ai', text: `Baik, nomor HP Bapak/Ibu tercatat: ${cleanPhone}.\n\nSelanjutnya, apa Alamat atau Lokasi lahan pertanian Bapak/Ibu?` }]);
        setFlowStep('ADDRESS');
        return;
      }

      if (flowStep === 'ADDRESS') {
        setFarmerData(prev => ({ ...prev, address: userMsg }));
        setMessages(prev => [...prev, { role: 'ai', text: `Baik, di ${userMsg}. Terakhir, apa nama Kelompok Tani Bapak/Ibu?` }]);
        setFlowStep('GROUP');
        return;
      }

      if (flowStep === 'GROUP') {
        setFarmerData(prev => ({ ...prev, group: userMsg }));
        setMessages(prev => [...prev, { 
          role: 'ai', 
          text: `Data sudah lengkap! Mari konfirmasi:\n\n👤 Nama: **${farmerData.name}**\n📞 No. HP/WA: **${farmerData.phone}**\n📍 Alamat: **${farmerData.address}**\n🌾 Kelompok Tani: **${userMsg}**\n\nApakah data di atas sudah benar? (Ketik "Ya" untuk lanjut)` 
        }]);
        setFlowStep('CONFIRMATION');
        return;
      }

      if (flowStep === 'CONFIRMATION') {
        if (userMsg.toLowerCase().match(/ya|ok|betul|benar|sesuai|sip/)) {
          const ticketId = createInitialRecord();
          setMessages(prev => [...prev, { 
            role: 'ai', 
            text: `Selesai! Nomor Tiket Anda: **${ticketId}**.\n\nSekarang silakan sampaikan masalah tanaman Anda. Klik ikon kamera untuk mengirim foto hama/penyakit.` 
          }]);
          setFlowStep('CONSULTATION');
        } else {
          setMessages(prev => [...prev, { role: 'ai', text: 'Baik, mari kita ulangi. Siapa Nama Lengkap Bapak/Ibu?' }]);
          setFlowStep('NAME');
          setFarmerData({ name: '', phone: '', address: '', group: '' });
        }
        return;
      }
    }

    // AI Consultation Core
    setIsLoading(true);
    let fullAiText = '';
    let sources: string[] = [];

    try {
      // Map history including image signals
      const history = messages
        .filter(m => m.role === 'user' || m.role === 'ai')
        .slice(-8)
        .map(m => {
          const parts: any[] = [{ text: m.text }];
          if (m.imageData) {
            parts.push({
              inlineData: {
                data: m.imageData.base64,
                mimeType: m.imageData.mimeType
              }
            });
          }
          return {
            role: m.role === 'user' ? 'user' as const : 'model' as const,
            parts
          };
        });

      const stream = askAgriExpertStream(
        userMsg || 'Tolong analisis foto yang saya lampirkan.',
        imgData?.base64,
        imgData?.mimeType,
        history
      );

      // Placeholder for streaming
      setMessages(prev => [...prev, { role: 'ai', text: '', sources: [] }]);

      for await (const chunk of stream) {
        fullAiText += chunk.text;
        if (chunk.sources.length > 0) {
          sources = Array.from(new Set([...sources, ...chunk.sources]));
        }

        setMessages(prev => {
          const next = [...prev];
          const last = next[next.length - 1];
          if (last.role === 'ai') {
            last.text = fullAiText;
            last.sources = sources;
          }
          return next;
        });
      }

      const hasAction = fullAiText.includes('[ACTION:CONTACT_OFFICER]');
      const cleanText = fullAiText.replace('[ACTION:CONTACT_OFFICER]', '').trim();

      setMessages(prev => {
        const next = [...prev];
        const last = next[next.length - 1];
        if (last.role === 'ai') {
          last.text = cleanText;
          last.showContactButton = hasAction;
        }
        return next;
      });

      // Robustly extract key analysis indicators for follow-up record keeping
      const problemMatch = cleanText.match(/(?:RINGKASAN MASALAH|MASALAH UMUM|RINGKASAN|MASALAH):?\s*([\s\S]*?)(?=(?:DIAGNOSA|DIAGNOSIS|SARAN|REKOMENDASI|$))/i);
      const diagnosisMatch = cleanText.match(/(?:DIAGNOSA|DIAGNOSIS):?\s*([\s\S]*?)(?=(?:SARAN|REKOMENDASI|$))/i);
      const adviceMatch = cleanText.match(/(?:SARAN PENGENDALIAN|SARAN|REKOMENDASI):?\s*([\s\S]*)$/i);

      let finalQuestion = '';
      if (problemMatch && problemMatch[1].trim()) {
        finalQuestion = problemMatch[1].trim().replace(/^:\s*/, '');
      } else {
        // Fallback or keep the original user question
        const records: ConsultationRecord[] = JSON.parse(localStorage.getItem('popt_consultation_records') || '[]');
        const existing = records.find(r => r.ticketId === currentTicketId);
        if (existing && existing.question && existing.question !== '(Mulai Konsultasi)' && existing.question !== '') {
          finalQuestion = existing.question;
        } else {
          finalQuestion = userMsg || 'Konsultasi gambar/gejala tanaman';
        }
      }

      let finalResponse = '';
      if (diagnosisMatch && diagnosisMatch[1].trim()) {
        const diag = diagnosisMatch[1].trim().replace(/^:\s*/, '');
        const adv = adviceMatch ? adviceMatch[1].trim().replace(/^:\s*/, '').trim() : '-';
        finalResponse = `DIAGNOSA: ${diag}\n\nSARAN: ${adv}`;
      } else {
        // Fallback: If AI hasn't made a diagnosis block yet, keep the actual conversation text
        const records: ConsultationRecord[] = JSON.parse(localStorage.getItem('popt_consultation_records') || '[]');
        const existing = records.find(r => r.ticketId === currentTicketId);
        if (existing && existing.aiResponse && existing.aiResponse.includes('DIAGNOSA:')) {
          finalResponse = existing.aiResponse; // keep previous diagnosis intact
        } else {
          finalResponse = cleanText;
        }
      }

      updateRecordWithConsultation(
        finalQuestion,
        finalResponse,
        userImgPreview,
        cleanText
      );

    } catch (err: any) {
      console.error("Consultation Detail Error:", err);
      let errorMessage = 'Maaf, terjadi kesalahan teknis saat menghubungi pusat data AI.';
      const errMsgStr = String(err.message || err);
      
      if (errMsgStr.toUpperCase().includes('API_KEY')) {
        errorMessage = 'Konfigurasi AI belum siap. Mohon pastikan API Key yang valid sudah terpasangkan di Settings > Secrets.';
      } else if (errMsgStr.includes('fetch')) {
        errorMessage = 'Koneksi internet terputus atau gagal menghubungi server. Silakan periksa jaringan Anda dan coba lagi.';
      } else if (errMsgStr.includes('RESOURCE_EXHAUSTED') || errMsgStr.includes('quota') || errMsgStr.includes('429') || errMsgStr.includes('Too Many Requests')) {
        errorMessage = 'Sistem AI sedang padat atau kuota harian telah habis (Batas 429). Silakan coba kirimkan pesan Anda kembali dalam beberapa saat lagi.';
      } else if (err.message) {
        errorMessage = `Koneksi AI terhambat: ${err.message}`;
      }

      setMessages(prev => {
        const next = [...prev];
        const last = next[next.length - 1];
        if (last && last.role === 'ai' && last.text === '') {
          last.text = errorMessage;
        } else {
          next.push({ role: 'ai', text: errorMessage });
        }
        return next;
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[75vh] bg-white rounded-3xl shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
      {/* Header */}
      <div className="bg-slate-50/80 backdrop-blur-md p-5 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-600 to-green-500 flex items-center justify-center text-white shadow-lg shadow-green-200">
              <Bot size={28} />
            </div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full animate-pulse"></div>
          </div>
          <div>
            <h3 className="font-black text-slate-800 text-base leading-tight">SMART POPT AI</h3>
            <p className="text-[10px] text-green-600 font-bold uppercase tracking-widest flex items-center mt-1">
              <Loader2 size={10} className={`mr-1 ${isLoading ? 'animate-spin' : 'hidden'}`} />
              {isLoading ? 'Sedang Berpikir...' : 'Terhubung • Gemini 1.5 Flash'}
            </p>
          </div>
        </div>
        {currentTicketId && (
          <div className="hidden sm:block px-3 py-1.5 bg-green-50 rounded-lg border border-green-100">
             <p className="text-[10px] font-bold text-green-700 uppercase tracking-tight">Tiket Aktif</p>
             <p className="text-xs font-black text-green-800">{currentTicketId}</p>
          </div>
        )}
      </div>

      {/* Chat Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-fixed"
      >
        <AnimatePresence mode="popLayout">
          {messages.map((msg, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.2 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`group relative max-w-[85%] sm:max-w-[70%] rounded-3xl p-4 shadow-sm ${
                msg.role === 'user' 
                  ? 'bg-green-600 text-white rounded-tr-none' 
                  : 'bg-white border border-slate-100 text-slate-700 rounded-tl-none'
              }`}>
                {msg.image && (
                  <motion.img 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    src={msg.image} 
                    alt="Lampiran" 
                    className="rounded-2xl mb-3 max-h-72 w-full object-cover border border-white/20 shadow-inner" 
                    referrerPolicy="no-referrer"
                  />
                )}
                
                <p className="text-sm font-medium whitespace-pre-wrap leading-relaxed">
                  {msg.text || (msg.role === 'ai' && isLoading && idx === messages.length - 1 ? '...' : '')}
                </p>

                {msg.showContactButton && onNavigate && (
                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onNavigate(Tab.PETUGAS)}
                    className="mt-4 w-full py-3 bg-green-700 text-white text-xs font-bold rounded-2xl hover:bg-green-800 transition-all flex items-center justify-center space-x-2 shadow-lg shadow-green-100"
                  >
                    <PhoneCall size={14} />
                    <span>Hubungi Petugas Teknis</span>
                  </motion.button>
                )}

                {msg.sources && msg.sources.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <p className="text-[10px] font-bold uppercase text-slate-400 mb-2 flex items-center">
                      <ExternalLink size={10} className="mr-1" /> Referensi Digital:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {msg.sources.map((url, uidx) => (
                        <a 
                          key={uidx} 
                          href={url} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="px-2 py-1 bg-slate-50 text-[10px] text-blue-600 rounded-md border border-slate-100 truncate max-w-[150px] hover:bg-blue-50 transition-colors"
                        >
                          {new URL(url).hostname}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className={`absolute top-2 ${msg.role === 'user' ? '-left-8' : '-right-8'} opacity-0 group-hover:opacity-100 transition-opacity`}>
                   {msg.role === 'user' ? <User size={16} className="text-slate-300" /> : <Bot size={16} className="text-slate-300" />}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {isLoading && messages[messages.length - 1]?.text === '' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
            <div className="bg-slate-100 rounded-2xl rounded-tl-none px-4 py-3 flex items-center space-x-2">
              <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 0.6 }} className="w-2 h-2 bg-slate-400 rounded-full" />
              <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} className="w-2 h-2 bg-slate-400 rounded-full" />
              <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }} className="w-2 h-2 bg-slate-400 rounded-full" />
            </div>
          </motion.div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-6 bg-slate-50/50 border-t border-slate-100">
        {selectedImage && (
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="mb-4 relative inline-block group"
          >
            <img 
              src={selectedImage.preview} 
              alt="Preview" 
              className="w-24 h-24 object-cover rounded-2xl border-4 border-white shadow-xl group-hover:brightness-75 transition-all" 
              referrerPolicy="no-referrer"
            />
            <button 
              onClick={() => setSelectedImage(null)}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 shadow-lg hover:bg-red-600 transition-colors"
            >
              <X size={14} />
            </button>
          </motion.div>
        )}
        
        <div className="relative flex items-center space-x-3">
          <input 
            type="file" 
            ref={fileInputRef}
            onChange={handleImageSelect}
            accept="image/*"
            className="hidden"
          />
          
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => fileInputRef.current?.click()}
            className="p-4 bg-white text-slate-500 rounded-2xl hover:text-green-600 border border-slate-200 shadow-sm transition-all"
            title="Lampirkan Foto Tanaman"
          >
            <ImageIcon size={22} />
          </motion.button>

          <div className="flex-1 relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              disabled={isEndedByInactivity}
              placeholder={isEndedByInactivity ? "Sesi berakhir. Klik mulai ulang untuk konsultasi baru." : "Tanyakan masalah tanaman Bapak/Ibu..."}
              className={`w-full pl-5 pr-14 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-green-100 focus:border-green-500 outline-none transition-all shadow-sm ${isEndedByInactivity ? 'opacity-50 grayscale cursor-not-allowed' : ''}`}
            />
            <button 
              onClick={handleSend}
              disabled={isLoading || (!input.trim() && !selectedImage) || isEndedByInactivity}
              className="absolute right-2 top-2 p-3 bg-green-600 text-white rounded-xl shadow-lg shadow-green-100 hover:bg-green-700 disabled:opacity-50 transition-all"
            >
              <Send size={18} />
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between mt-4">
          <p className="text-[10px] text-slate-400 font-medium italic flex items-center">
            <AlertCircle size={10} className="mr-1" /> Verifikasi diagnosa AI dengan petugas lapangan.
          </p>
          {isEndedByInactivity && (
            <button 
              onClick={() => window.location.reload()}
              className="text-[10px] font-bold text-green-600 uppercase hover:underline"
            >
              Mulai Ulang Konsultasi
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Consultation;

