import React, { useState, useRef, useEffect } from 'react';
import { askAgriExpertStream } from '../geminiService';
import { Tab } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Image as ImageIcon, X, User, Bot, AlertCircle, PhoneCall, Loader2, ExternalLink } from 'lucide-react';

interface ExtendedMessage {
  role: 'user' | 'ai';
  text: string;
  image?: string;
  imageData?: { base64: string, mimeType: string };
  sources?: string[];
  showContactButton?: boolean;
}

type FlowStep = 'NAME' | 'ADDRESS' | 'GROUP' | 'CONFIRMATION' | 'CONSULTATION';

const Consultation: React.FC = () => {
  const [messages, setMessages] = useState<ExtendedMessage[]>([
    { role: 'ai', text: 'Halo! Saya asisten AI dari POPT BPP NULE. Mari catat data Anda dulu ya. Mohon informasikan Nama Lengkap Anda?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<{ base64: string, mimeType: string, preview: string } | null>(null);
  const [flowStep, setFlowStep] = useState<FlowStep>('NAME');
  const [farmerData, setFarmerData] = useState({ name: '', address: '', group: '' });

  // FUNGSI OTOMATIS KIRIM KE GOOGLE SHEETS
  const kirimKeSheets = async (nama: string, alamat: string, kelompok: string, masalah: string, hasilAI: string) => {
    const URL_WEB_APP = 'https://script.google.com/macros/s/AKfycbzuBQJ2mKj5X9HtbHniOPSHver9xWknIHy5AahOYCib3yjmanEOmeGVtFmXEe7ktA/exec';
    try {
      await fetch(URL_WEB_APP, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nama, alamat, kelompok, masalah, hasilAI })
      });
    } catch (err) { console.error("Gagal kirim:", err); }
  };

  const handleSend = async () => {
    if ((!input.trim() && !selectedImage) || isLoading) return;

    const userMsg = input;
    const imgData = selectedImage;
    setInput('');
    setSelectedImage(null);
    setMessages(prev => [...prev, { role: 'user', text: userMsg, image: imgData?.preview }]);

    if (flowStep !== 'CONSULTATION') {
      if (flowStep === 'NAME') { setFarmerData({...farmerData, name: userMsg}); setFlowStep('ADDRESS'); setMessages(prev => [...prev, { role: 'ai', text: "Terima kasih. Di mana alamat lahan Bapak/Ibu?" }]); }
      else if (flowStep === 'ADDRESS') { setFarmerData({...farmerData, address: userMsg}); setFlowStep('GROUP'); setMessages(prev => [...prev, { role: 'ai', text: "Apa nama Kelompok Tani Bapak/Ibu?" }]); }
      else if (flowStep === 'GROUP') { setFarmerData({...farmerData, group: userMsg}); setFlowStep('CONFIRMATION'); setMessages(prev => [...prev, { role: 'ai', text: `Data: ${farmerData.name}, ${farmerData.address}, ${userMsg}. Sudah benar? (Ketik Ya)` }]); }
      else if (flowStep === 'CONFIRMATION') { if (userMsg.toLowerCase().includes('ya')) { setFlowStep('CONSULTATION'); setMessages(prev => [...prev, { role: 'ai', text: "Selesai! Silakan sampaikan masalah tanaman Bapak/Ibu." }]); } else { setFlowStep('NAME'); setMessages(prev => [...prev, { role: 'ai', text: "Mari ulangi. Siapa Nama Lengkap Bapak/Ibu?" }]); } }
      return;
    }

    setIsLoading(true);
    try {
      const stream = askAgriExpertStream(userMsg, imgData?.base64, imgData?.mimeType, []);
      setMessages(prev => [...prev, { role: 'ai', text: '' }]);
      let fullText = '';
      for await (const chunk of stream) {
        fullText += chunk.text;
        setMessages(prev => { const n = [...prev]; n[n.length - 1].text = fullText; return n; });
      }
      // REKAP KE GOOGLE SHEETS
      await kirimKeSheets(farmerData.name, farmerData.address, farmerData.group, userMsg, fullText);
    } catch (err) { setMessages(prev => [...prev, { role: 'ai', text: 'Maaf, terjadi kesalahan.' }]); }
    finally { setIsLoading(false); }
  };return (
    <div className="flex flex-col h-[75vh] bg-white rounded-3xl shadow-lg border border-slate-100 overflow-hidden p-6">
      <div className="flex-1 overflow-y-auto space-y-4 mb-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`p-4 rounded-2xl max-w-[80%] ${msg.role === 'user' ? 'bg-green-600 text-white' : 'bg-slate-100 text-slate-800'}`}>
              {msg.text}
            </div>
          </div>
        ))}
      </div>
      <div className="flex space-x-2">
        <input className="flex-1 p-3 border rounded-xl" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Tanya masalah tanaman..." />
        <button className="bg-green-600 text-white px-6 py-3 rounded-xl" onClick={handleSend}>{isLoading ? '...' : 'Kirim'}</button>
      </div>
    </div>
  );
};

export default Consultation;
