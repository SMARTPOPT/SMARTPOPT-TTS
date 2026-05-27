import React, { useState, useEffect } from 'react';
import { PEST_DATA } from '../constants';
import { UserRole, PestInfo } from '../types';
import { Plus, Search, Info, X, Layers, BookOpen, ShieldAlert, Leaf, CheckCircle2 } from 'lucide-react';
import { supabase } from '../supabaseClient'; // Pastikan path ini benar

// Definisi Props
interface OptInformationProps {
  userRole: UserRole | null;
}

// Anda bisa memindahkan TECHNICAL_DETAILS_MAP ke constants.tsx jika file tersebut sudah di-import
const OptInformation: React.FC<OptInformationProps> = ({ userRole }) => {
  const [pests, setPests] = useState<PestInfo[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedPest, setSelectedPest] = useState<PestInfo | null>(null);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [editingPestId, setEditingPestId] = useState<string | null>(null);
  
  // State untuk form input
  const [newPest, setNewPest] = useState<Omit<PestInfo, 'id'>>({
    name: '',
    host: '',
    symptoms: '',
    control: '',
    imageUrl: ''
  });

  useEffect(() => {
    // Tetap memuat data awal, bisa diganti dengan fetch Supabase jika database sudah siap
    const savedPests = localStorage.getItem('popt_pests');
    if (savedPests) {
      setPests(JSON.parse(savedPests));
    } else {
      setPests(PEST_DATA);
    }
  }, []);

  // Logika Pencarian
  const filteredPests = pests.filter((pest: PestInfo) => 
    pest.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    pest.host.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddPest = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingPestId) {
      const updatedPests = pests.map(p => 
        p.id === editingPestId ? { ...newPest, id: editingPestId } : p
      );
      setPests(updatedPests);
      localStorage.setItem('popt_pests', JSON.stringify(updatedPests));
    } else {
      const pestToAdd: PestInfo = {
        ...newPest,
        id: Date.now().toString()
      };
      const updatedPests = [...pests, pestToAdd];
      setPests(updatedPests);
      localStorage.setItem('popt_pests', JSON.stringify(updatedPests));
    }
    setShowAddModal(false);
    setEditingPestId(null);
  };

  const handleEditPest = (pest: PestInfo) => {
    setNewPest({
      name: pest.name,
      host: pest.host,
      symptoms: pest.symptoms,
      control: pest.control,
      imageUrl: pest.imageUrl
    });
    setEditingPestId(pest.id);
    setShowAddModal(true);
