import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

const OptInformation = () => {
  const [pests, setPests] = useState<any[]>([]);

  useEffect(() => {
    async function loadPests() {
      const { data } = await supabase.from('katalog_hama').select('*');
      if (data) setPests(data);
    }
    loadPests();
  }, []);

  return (
    <div className="p-4 max-w-lg mx-auto bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-extrabold mb-6 text-center text-gray-800">Katalog Hama</h1>
      <div className="space-y-4">
        {pests.map((pest) => (
          <div key={pest.id} className="p-6 bg-white rounded-3xl shadow-sm border border-slate-100">
            <h2 className="text-xl font-black text-slate-900">{pest.name}</h2>
            <p className="text-sm text-slate-500 mb-2">Inang: {pest.host}</p>
            <p className="text-sm text-slate-700"><strong>Gejala:</strong> {pest.symptoms}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OptInformation;
