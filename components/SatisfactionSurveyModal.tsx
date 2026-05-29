import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ClipboardCheck, Sparkles, X, ChevronRight } from 'lucide-react';

interface SatisfactionSurveyModalProps {
  onSurveyOpen?: () => void;
}

const SatisfactionSurveyModal: React.FC<SatisfactionSurveyModalProps> = () => {
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const clearActiveTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  useEffect(() => {
    // Expose a helper function to trigger the modal instantly from the browser console for testing
    (window as any).triggerSurveyModal = () => {
      setIsVisible(true);
      console.log("Satisfaction survey modal triggered manually.");
    };

    const isDismissed = localStorage.getItem('smartpopt_survey_v4_dismissed') === 'true';
    const isFilled = localStorage.getItem('smartpopt_survey_v4_filled') === 'true';

    if (!isDismissed && !isFilled) {
      // First prompt in exactly 1 minute (60,000ms)
      timerRef.current = setTimeout(() => {
        setIsVisible(true);
      }, 60000);
    }

    return () => {
      clearActiveTimer();
      delete (window as any).triggerSurveyModal;
    };
  }, []);

  const handleOpenSurvey = () => {
    clearActiveTimer();
    // Open in a new tab
    window.open('https://forms.gle/Fp4wK5hXtCWg7NFs9', '_blank', 'noopener,noreferrer');
    // Set filled in localStorage so it doesn't prompt again
    localStorage.setItem('smartpopt_survey_v4_filled', 'true');
    setIsVisible(false);
  };

  const handleDismissTemporary = () => {
    clearActiveTimer();
    setIsVisible(false);

    // Automatically reschedule to show again in 2 minutes (120,000ms)
    timerRef.current = setTimeout(() => {
      const isDismissed = localStorage.getItem('smartpopt_survey_v4_dismissed') === 'true';
      const isFilled = localStorage.getItem('smartpopt_survey_v4_filled') === 'true';
      if (!isDismissed && !isFilled) {
        setIsVisible(true);
      }
    }, 120000);
  };

  const handleDismissPermanent = () => {
    clearActiveTimer();
    localStorage.setItem('smartpopt_survey_v4_dismissed', 'true');
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
          id="survey-modal-overlay"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className="relative w-full max-w-lg bg-white rounded-[2rem] border border-green-100 shadow-[0_32px_64px_-15px_rgba(4,120,87,0.25)] overflow-hidden"
            id="survey-modal-container"
          >
            {/* Top decorative gradient and leaf accent */}
            <div className="h-4 bg-gradient-to-r from-green-600 via-emerald-600 to-teal-500 w-full" />
            
            {/* Close Button top-right */}
            <button 
              onClick={handleDismissTemporary}
              className="absolute top-6 right-6 p-1.5 hover:bg-slate-50 text-slate-400 hover:text-slate-600 rounded-full transition-all"
              id="survey-modal-close"
              aria-label="Tutup"
            >
              <X size={20} />
            </button>

            <div className="p-8 md:p-10">
              {/* Animated Floating Survey Icon */}
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center text-green-700 border border-green-100 shadow-inner shrink-0 relative">
                  <ClipboardCheck size={28} />
                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                  </span>
                </div>
                <div>
                  <div className="flex items-center space-x-1.5">
                    <span className="text-[10px] bg-green-100 text-green-800 font-extrabold px-2 py-0.5 rounded-full uppercase tracking-widest">
                      Kuesioner Digital
                    </span>
                    <Sparkles size={14} className="text-amber-500" />
                  </div>
                  <h3 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight mt-1">
                    Bantu Tingkatkan SMART POPT Nule
                  </h3>
                </div>
              </div>

              {/* Message text with high typography contrast */}
              <div className="space-y-4 text-slate-600 text-sm md:text-base leading-relaxed font-medium">
                <p>
                  Halo Pengunjung Setia! Kami di <span className="text-green-700 font-bold">BPP Nules NTT</span> terus meluncurkan pembaruan demi memudahkan sistem identifikasi hama dan penyakit bagi para petani lokal kita.
                </p>
                <p className="bg-slate-50 p-4 rounded-xl border border-slate-100/80 text-xs md:text-sm text-slate-505 font-medium italic">
                  "Apakah Bapak/Ibu bersedia meluangkan waktu kurang dari 1 menit untuk mengisi kuesioner kepuasan penggunaan aplikasi ini? Masukan Anda sangat berarti bagi pengembangan pertanian yang bermartabat dan modern."
                </p>
              </div>

              {/* Functional CTA sector */}
              <div className="mt-8 flex flex-col gap-3">
                <button
                  onClick={handleOpenSurvey}
                  className="w-full py-4 px-6 bg-green-700 hover:bg-green-800 text-white font-black rounded-2xl shadow-xl shadow-green-100 hover:shadow-green-200 transition-all active:scale-98 flex items-center justify-center space-x-2 text-sm md:text-base cursor-pointer"
                  id="survey-submit-button"
                >
                  <span>Ya, Bersedia Isi Kuesioner</span>
                  <ChevronRight size={18} />
                </button>

                <div className="grid grid-cols-2 gap-3 mt-1">
                  <button
                    onClick={handleDismissTemporary}
                    className="py-3 px-4 border border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-slate-700 font-bold text-xs md:text-sm rounded-xl transition-all text-center cursor-pointer"
                    id="survey-dismiss-temporary"
                  >
                    Nanti Saja
                  </button>
                  <button
                    onClick={handleDismissPermanent}
                    className="py-3 px-4 bg-slate-50 hover:bg-slate-100 border border-slate-100 text-slate-400 hover:text-slate-600 font-bold text-xs md:text-sm rounded-xl transition-all text-center cursor-pointer"
                    id="survey-dismiss-permanent"
                  >
                    Jangan Tampilkan Lagi
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default SatisfactionSurveyModal;
